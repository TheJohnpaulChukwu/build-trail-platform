import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServer, type Server } from "node:http";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadServerConfig } from "../../server/config.js";
import { createApplicationHandler } from "../../server/composition.js";

const url = process.env.TEST_SUPABASE_URL;
const anonKey = process.env.TEST_SUPABASE_ANON_KEY;
const serviceKey = process.env.TEST_SUPABASE_SERVICE_KEY;
if (!url || !anonKey || !serviceKey)
  throw new Error("Use npm run test:integration with local Supabase running");
if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname))
  throw new Error("Local test target required");
const connectionUrl = url;
const browserKey = anonKey;
const issuer = `${url.replace(/\/$/, "")}/auth/v1`;
const issuerSql = `'${issuer.replaceAll("'", "''")}'`;
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, serviceKey, options);
const anonymous = createClient(url, anonKey, options);
type Fixture = {
  subject: string;
  appId: string;
  token: string;
  client: SupabaseClient;
};
const createdSubjects: string[] = [];
const createdAppIds = new Set<string>();
const users: Fixture[] = [];
let server: Server;
let base: string;
function fixtureId(value: string): string {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new Error("Invalid local fixture ID");
  return `'${value}'`;
}
const execFileAsync = promisify(execFile);
async function sql(statement: string): Promise<string> {
  const command = execFileAsync(process.execPath, ["scripts/local-db.mjs"], {
    encoding: "utf8",
  });
  command.child.stdin?.end(statement);
  const { stdout } = await command;
  return stdout.trim();
}

async function createFixture(
  email = `backend-${randomUUID()}@example.test`,
): Promise<Fixture> {
  const password = randomUUID();
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "owner",
      account_state: "active",
      display_name: { unexpected: true },
    },
  });
  if (created.error) throw created.error;
  const subject = created.data.user.id;
  createdSubjects.push(subject);
  const appId = await sql(
    `select user_id from private.auth_identities where provider='supabase' and issuer=${issuerSql} and subject=${fixtureId(subject)};`,
  );
  fixtureId(appId);
  createdAppIds.add(appId);
  const client = createClient(connectionUrl, browserKey, options);
  const auth = await client.auth.signInWithPassword({ email, password });
  if (auth.error || !auth.data.session)
    throw new Error("Synthetic test login failed");
  return { subject, appId, token: auth.data.session.access_token, client };
}
beforeAll(async () => {
  for (let index = 0; index < 4; index++) users.push(await createFixture());
  server = createServer(
    createApplicationHandler(
      loadServerConfig({
        APP_ENV: "test",
        SUPABASE_URL: url,
        SUPABASE_PUBLISHABLE_KEY: anonKey,
        APP_ORIGIN: "http://127.0.0.1:3001",
        RELEASE: "integration",
        REQUEST_TIMEOUT_MS: "5000",
      }),
    ),
  );
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Test listener missing");
  base = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
  for (const subject of createdSubjects) {
    const { error } = await admin.auth.admin.deleteUser(subject);
    if (error && error.status !== 404) throw error;
  }
  if (createdAppIds.size)
    await sql(
      `delete from private.app_users where id in (${[...createdAppIds].map(fixtureId).join(",")});`,
    );
});
function user(index: number): Fixture {
  const value = users[index];
  if (!value) throw new Error("Missing fixture");
  return value;
}
function me(token: string) {
  return fetch(`${base}/api/v1/me`, {
    headers: { authorization: `Bearer ${token}` },
  });
}

describe("real Supabase adapter and portable application identity", () => {
  it("serves health without credentials", async () => {
    const response = await fetch(`${base}/api/v1/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      release: "integration",
    });
  });
  it("uses an independent application ID and strips the provider envelope", async () => {
    expect(user(0).appId).not.toBe(user(0).subject);
    expect(user(1).appId).not.toBe(user(0).appId);
    const response = await me(user(0).token);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      userId: user(0).appId,
      displayName: null,
      preferences: {
        theme: "system",
        readingSize: "normal",
        readingFont: "mono",
        focus: false,
        revision: "0",
      },
      usage: { textBytes: 0, studyRecordCount: 0, enrollmentCount: 0 },
      isOwner: false,
    });
    const rpc = await user(0).client.rpc("account_context");
    expect(rpc.error).toBeNull();
    expect(rpc.data.issuer).toBe(issuer);
    expect(rpc.data.subject).toBe(user(0).subject);
    expect(rpc.data.account.userId).toBe(user(0).appId);
  });
  it("does not authenticate invented tokens or anonymous reads", async () => {
    expect((await me("invalid")).status).toBe(401);
    expect((await anonymous.from("profiles").select("*")).error).not.toBeNull();
    expect((await anonymous.rpc("account_context")).error).not.toBeNull();
  });
  it("isolates profiles and ignores forged owner metadata", async () => {
    const result = await user(0).client.from("profiles").select("*");
    expect(result.error).toBeNull();
    expect(result.data?.map((row) => row.user_id)).toEqual([user(0).appId]);
    expect(
      (
        await user(0)
          .client.from("profiles")
          .select("*")
          .eq("user_id", user(1).appId)
      ).data,
    ).toEqual([]);
    expect(
      (await user(1).client.rpc("account_context")).data.account.isOwner,
    ).toBe(false);
  });
  it("denies browser mutation of profiles, preferences and identity mappings", async () => {
    for (const table of ["profiles", "user_preferences"]) {
      expect(
        (
          await user(0)
            .client.from(table)
            .insert({ user_id: user(0).appId })
        ).error,
      ).not.toBeNull();
      expect(
        (
          await user(0)
            .client.from(table)
            .update({ user_id: user(1).appId })
            .eq("user_id", user(0).appId)
        ).error,
      ).not.toBeNull();
      expect(
        (await user(0).client.from(table).delete().eq("user_id", user(0).appId))
          .error,
      ).not.toBeNull();
    }
    const identities = user(0).client.schema("private").from("auth_identities");
    expect((await identities.select("*")).error).not.toBeNull();
    expect(
      (
        await identities.insert({
          provider: "supabase",
          issuer,
          subject: user(0).subject,
          user_id: user(1).appId,
        })
      ).error,
    ).not.toBeNull();
    expect(
      (
        await identities
          .update({ user_id: user(1).appId })
          .eq("subject", user(0).subject)
      ).error,
    ).not.toBeNull();
    expect(
      (await identities.delete().eq("subject", user(0).subject)).error,
    ).not.toBeNull();
    expect((await me(user(0).token)).status).toBe(200);
  });
  it("retains bigint revision strings and preference isolation", async () => {
    expect(
      (
        await admin.from("user_preferences").insert({
          user_id: user(0).appId,
          theme: "dark",
          reading_font: "proportional",
          revision: "9007199254740993",
        })
      ).error,
    ).toBeNull();
    const body = await (await me(user(0).token)).json();
    expect(body.preferences.revision).toBe("9007199254740993");
    expect(body.preferences.readingFont).toBe("proportional");
    expect(
      (await user(1).client.from("user_preferences").select("*")).data,
    ).toEqual([]);
  });
  it("supports trusted subject remapping without moving or resetting application data", async () => {
    const before = await (await me(user(0).token)).json();
    await sql(
      `update private.auth_identities set user_id=${fixtureId(user(0).appId)} where provider='supabase' and issuer=${issuerSql} and subject=${fixtureId(user(2).subject)};`,
    );
    try {
      const response = await me(user(2).token);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(before);
      expect(
        (await user(2).client.from("profiles").select("*")).data?.map(
          (row) => row.user_id,
        ),
      ).toEqual([user(0).appId]);
      expect(
        await sql(
          `select count(*) from private.app_users where id=${fixtureId(user(2).appId)};`,
        ),
      ).toBe("1");
    } finally {
      await sql(
        `update private.auth_identities set user_id=${fixtureId(user(2).appId)} where provider='supabase' and issuer=${issuerSql} and subject=${fixtureId(user(2).subject)};`,
      );
    }
  });
  it("fails closed for a valid bearer without an identity mapping", async () => {
    await sql(
      `delete from private.auth_identities where provider='supabase' and issuer=${issuerSql} and subject=${fixtureId(user(3).subject)};`,
    );
    try {
      expect((await me(user(3).token)).status).toBe(403);
      expect((await user(3).client.from("profiles").select("*")).data).toEqual(
        [],
      );
      expect(
        (await user(3).client.rpc("account_context")).error,
      ).not.toBeNull();
    } finally {
      await sql(
        `insert into private.auth_identities(provider,issuer,subject,user_id) values('supabase',${issuerSql},${fixtureId(user(3).subject)},${fixtureId(user(3).appId)});`,
      );
    }
  });
  it("fails closed when the trusted provider configuration is missing or wrong", async () => {
    await sql("delete from private.supabase_auth_config;");
    try {
      expect((await me(user(3).token)).status).toBe(403);
      expect(
        (await user(3).client.rpc("account_context")).error,
      ).not.toBeNull();
      await sql(
        "insert into private.supabase_auth_config(singleton,issuer) values(true,'https://wrong-issuer.example.test/auth/v1');",
      );
      expect((await me(user(3).token)).status).toBe(403);
      expect((await user(3).client.from("profiles").select("*")).data).toEqual(
        [],
      );
    } finally {
      await sql(
        `delete from private.supabase_auth_config; insert into private.supabase_auth_config(singleton,issuer) values(true,${issuerSql});`,
      );
    }
  });
  it("preserves Unicode profile names and rejects over-limit values", async () => {
    const name = "🚀".repeat(100);
    expect(
      (
        await admin
          .from("profiles")
          .update({ display_name: name })
          .eq("user_id", user(0).appId)
      ).error,
    ).toBeNull();
    const response = await me(user(0).token);
    expect(response.status).toBe(200);
    expect((await response.json()).displayName).toBe(name);
    expect(
      (
        await admin
          .from("profiles")
          .update({ display_name: name + "🚀" })
          .eq("user_id", user(0).appId)
      ).error?.code,
    ).toBe("23514");
  });
  it("denies deleting accounts despite a valid provider token", async () => {
    expect(
      (
        await admin
          .from("profiles")
          .update({ account_state: "deleting" })
          .eq("user_id", user(0).appId)
      ).error,
    ).toBeNull();
    try {
      expect((await me(user(0).token)).status).toBe(403);
      expect((await user(0).client.from("profiles").select("*")).data).toEqual(
        [],
      );
      expect(
        (await user(0).client.from("user_preferences").select("*")).data,
      ).toEqual([]);
    } finally {
      expect(
        (
          await admin
            .from("profiles")
            .update({ account_state: "active" })
            .eq("user_id", user(0).appId)
        ).error,
      ).toBeNull();
    }
  });
  it("fails closed if application profile is absent", async () => {
    expect(
      (await admin.from("profiles").delete().eq("user_id", user(1).appId))
        .error,
    ).toBeNull();
    expect((await me(user(1).token)).status).toBe(403);
  });
  it("unlinks deleted provider accounts, retains application data and rejects stale tokens", async () => {
    expect(
      (await admin.auth.admin.deleteUser(user(0).subject)).error,
    ).toBeNull();
    expect((await me(user(0).token)).status).toBe(401);
    expect(
      (
        await admin
          .from("user_preferences")
          .select("user_id")
          .eq("user_id", user(0).appId)
      ).data,
    ).toEqual([{ user_id: user(0).appId }]);
    expect(
      await sql(
        `select count(*) from private.app_users where id=${fixtureId(user(0).appId)};`,
      ),
    ).toBe("1");
    expect(
      await sql(
        `select count(*) from private.auth_identities where provider='supabase' and issuer=${issuerSql} and subject=${fixtureId(user(0).subject)};`,
      ),
    ).toBe("0");
  });
  it("never merges a newly registered subject by a reused email", async () => {
    const email = `reused-${randomUUID()}@example.test`;
    const original = await createFixture(email);
    expect(
      (
        await admin
          .from("profiles")
          .update({ display_name: "Retained fixture" })
          .eq("user_id", original.appId)
      ).error,
    ).toBeNull();
    expect(
      (await admin.auth.admin.deleteUser(original.subject)).error,
    ).toBeNull();
    const replacement = await createFixture(email);
    expect(replacement.appId).not.toBe(original.appId);
    expect(replacement.subject).not.toBe(original.subject);
    const body = await (await me(replacement.token)).json();
    expect(body.userId).toBe(replacement.appId);
    expect(body.displayName).toBeNull();
    expect(
      (
        await admin
          .from("profiles")
          .select("display_name")
          .eq("user_id", original.appId)
      ).data,
    ).toEqual([{ display_name: "Retained fixture" }]);
  });
});
