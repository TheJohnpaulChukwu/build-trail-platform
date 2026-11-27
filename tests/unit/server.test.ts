import { afterEach, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { once } from "node:events";
import { loadServerConfig } from "../../server/config.js";
import { createHandler } from "../../server/handler.js";
import { createApplicationHandler } from "../../server/composition.js";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { AccountContextSchema } from "../../src/contracts/identity.js";

const env = {
  APP_ENV: "test",
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  APP_ORIGIN: "http://localhost:5173",
  RELEASE: "test-release",
  REQUEST_TIMEOUT_MS: "100",
};
const providerIssuer = `${env.SUPABASE_URL}/auth/v1`;
const providerSubject = "99999999-9999-4999-8999-999999999999";
const context = {
  userId: "11111111-1111-4111-8111-111111111111",
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
};
const servers: Server[] = [];
afterEach(async () => {
  await Promise.all(
    servers
      .splice(0)
      .map(
        (server) =>
          new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          ),
      ),
  );
});
async function start(fetcher?: typeof fetch) {
  const server = createServer(
    createApplicationHandler(loadServerConfig(env), fetcher),
  );
  servers.push(server);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No listener");
  return `http://127.0.0.1:${address.port}`;
}
function upstream(
  status = 200,
  rpcStatus = 200,
  payload: unknown = {
    issuer: providerIssuer,
    subject: providerSubject,
    account: context,
  },
): typeof fetch {
  return async (input, init) => {
    const url = String(input);
    expect(new Headers(init?.headers).get("authorization")).toBe(
      "Bearer test-token",
    );
    if (url.endsWith("/auth/v1/user"))
      return Response.json(
        status === 200
          ? { id: providerSubject }
          : { message: "secret upstream detail" },
        { status },
      );
    expect(url).toContain("/rest/v1/rpc/account_context");
    return Response.json(
      rpcStatus === 200
        ? payload
        : {
            code: rpcStatus === 403 ? "42501" : "internal",
            message: "secret SQL detail",
          },
      { status: rpcStatus },
    );
  };
}
describe("server configuration", () => {
  it("accepts local/test and secure deployed configuration", () => {
    expect(loadServerConfig(env).environment).toBe("test");
    expect(
      loadServerConfig({
        ...env,
        APP_ENV: "production",
        SUPABASE_URL: "https://project.supabase.co",
        APP_ORIGIN: "https://learn.example.com",
      }).environment,
    ).toBe("production");
  });
  it.each([
    { APP_ENV: "preview" },
    { APP_ORIGIN: "https://example.com/path" },
    { APP_ORIGIN: "https://user:pass@example.com" },
    { APP_ORIGIN: "https://example.com?x=1" },
    { APP_ORIGIN: "http://remote.example.com" },
    { SUPABASE_URL: "https://project.supabase.co/path" },
    { SUPABASE_PUBLISHABLE_KEY: "sb_secret_secret" },
    { RELEASE: "" },
    { REQUEST_TIMEOUT_MS: "0" },
    { REQUEST_TIMEOUT_MS: "60001" },
    { APP_ENV: "production" },
  ])("rejects unsafe or missing config %j", (changes) =>
    expect(() => loadServerConfig({ ...env, ...changes })).toThrow(
      "Invalid server configuration",
    ),
  );
  it("does not echo secrets in configuration errors", () =>
    expect(() =>
      loadServerConfig({ ...env, SUPABASE_PUBLISHABLE_KEY: "SECRET_VALUE" }),
    ).toThrow(/^Invalid server configuration$/));
});
describe("HTTP handler", () => {
  it("returns minimal health with no-store and request ID", async () => {
    const response = await fetch(`${await start()}/api/v1/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      release: "test-release",
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });
  it("returns 404 and 405 with Allow", async () => {
    const base = await start();
    expect((await fetch(`${base}/missing`)).status).toBe(404);
    const response = await fetch(`${base}/api/v1/health`, { method: "POST" });
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET");
  });
  it.each([undefined, "Basic bad", "Bearer a b", "Bearer"])(
    "rejects malformed auth %s",
    async (authorization) => {
      const response = await fetch(`${await start()}/api/v1/me`, {
        headers: authorization ? { authorization } : {},
      });
      expect(response.status).toBe(401);
    },
  );
  it("returns independent application identity and strips verified provider subject", async () => {
    const response = await fetch(`${await start(upstream())}/api/v1/me`, {
      headers: { authorization: "Bearer test-token" },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(context);
  });
  it.each([
    [401, 200, 401],
    [500, 200, 503],
    [200, 403, 403],
    [200, 500, 503],
  ])("sanitizes upstream failures %s/%s", async (auth, rpc, expected) => {
    const response = await fetch(
      `${await start(upstream(auth, rpc))}/api/v1/me`,
      { headers: { authorization: "Bearer test-token" } },
    );
    expect(response.status).toBe(expected);
    expect(await response.text()).not.toContain("secret");
  });
  it("rejects malformed or mismatched RPC output", async () => {
    for (const value of [
      {
        issuer: providerIssuer,
        subject: providerSubject,
        account: { ...context, extra: true },
      },
      {
        issuer: providerIssuer,
        subject: "different-subject",
        account: context,
      },
      {
        issuer: providerIssuer,
        subject: providerSubject,
        account: context,
        extra: true,
      },
    ]) {
      const response = await fetch(
        `${await start(upstream(200, 200, value))}/api/v1/me`,
        { headers: { authorization: "Bearer test-token" } },
      );
      expect(response.status).toBe(503);
    }
  });
  it("aborts an upstream request at configured timeout", async () => {
    const blocked = ((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new Error("private network detail")),
          { once: true },
        );
      })) as typeof fetch;
    const response = await fetch(`${await start(blocked)}/api/v1/me`, {
      headers: { authorization: "Bearer test-token" },
    });
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private");
  });
});
it("validates strict account fields and bigint revision", () => {
  expect(AccountContextSchema.parse(context)).toEqual(context);
  expect(() =>
    AccountContextSchema.parse({
      ...context,
      preferences: { ...context.preferences, revision: "9223372036854775808" },
    }),
  ).toThrow();
  expect(() =>
    AccountContextSchema.parse({
      ...context,
      usage: { ...context.usage, textBytes: -1 },
    }),
  ).toThrow();
});

// SDK transport substitutes below are unit fixtures, not evidence of Supabase integration.
it("accepts legacy anon key classification and rejects elevated or malformed keys", () => {
  const key = (role: string) =>
    `e30.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.signature`;
  expect(
    loadServerConfig({ ...env, SUPABASE_PUBLISHABLE_KEY: key("anon") })
      .supabasePublishableKey,
  ).toBe(key("anon"));
  for (const value of [
    key("service_role"),
    "e30.e30.signature",
    "e30.invalid.signature",
  ])
    expect(() =>
      loadServerConfig({ ...env, SUPABASE_PUBLISHABLE_KEY: value }),
    ).toThrow();
  expect(() => loadServerConfig({ ...env, APP_ORIGIN: "not-a-url" })).toThrow();
});
it("exercises local server startup and validates its port", async () => {
  const { startLocalServer } = await import("../../server/local.js");
  expect(() => startLocalServer({ ...env, PORT: "bad" })).toThrow(
    "Invalid server port",
  );
  expect(() => startLocalServer({ ...env, PORT: "65536" })).toThrow(
    "Invalid server port",
  );
  const server = startLocalServer({ ...env, PORT: "0" });
  servers.push(server);
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No listener");
  expect(
    (await fetch(`http://127.0.0.1:${address.port}/api/v1/health`)).status,
  ).toBe(200);
});
it("runs deployed adapters and fails closed for missing deployment config", async () => {
  const { default: runtime } = await import("../../api/v1/health.js");
  const { default: me } = await import("../../api/v1/me.js");
  expect(me).toBe(runtime);
  const server = createServer(runtime);
  servers.push(server);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No listener");
  const saved = { ...process.env };
  try {
    Object.assign(process.env, env);
    expect(
      (await fetch(`http://127.0.0.1:${address.port}/api/v1/health`)).status,
    ).toBe(200);
    process.env.RELEASE = "";
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/v1/health`,
    );
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
  } finally {
    for (const key of Object.keys(env)) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});

it("returns schema failures rather than throwing for malformed revisions", () => {
  for (const revision of ["abc", "-1", "01", "1.5", "", "1e3"]) {
    expect(
      AccountContextSchema.safeParse({
        ...context,
        preferences: { ...context.preferences, revision },
      }).success,
    ).toBe(false);
  }
});

it("counts display names by Unicode code points like PostgreSQL char_length", () => {
  expect(
    AccountContextSchema.safeParse({
      ...context,
      displayName: "😀".repeat(100),
    }).success,
  ).toBe(true);
  expect(
    AccountContextSchema.safeParse({
      ...context,
      displayName: "😀".repeat(101),
    }).success,
  ).toBe(false);
});

it("logs only bounded request completion fields without private request data", async () => {
  const records: unknown[] = [];
  const server = createServer(
    createApplicationHandler(loadServerConfig(env), upstream(), (event) =>
      records.push(event),
    ),
  );
  servers.push(server);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No listener");
  const response = await fetch(
    `http://127.0.0.1:${address.port}/private-email@example.test?token=secret-query`,
    { headers: { authorization: "Bearer secret-token" } },
  );
  expect(response.status).toBe(404);
  expect(records).toHaveLength(1);
  expect(records[0]).toEqual({
    event: "request_completed",
    requestId: response.headers.get("x-request-id"),
    method: "GET",
    path: "[unmatched]",
    status: 404,
    durationMs: expect.any(Number),
  });
  expect(JSON.stringify(records)).not.toMatch(/secret|email|authorization/);
});

it.each([
  ["unauthenticated", 401],
  ["forbidden", 403],
  ["unavailable", 503],
] as const)(
  "maps provider-neutral %s results to HTTP",
  async (kind, status) => {
    const server = createServer(
      createHandler(
        { release: "port-test", requestTimeoutMs: 100 },
        { read: async () => ({ kind }) },
      ),
    );
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No listener");
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/me`, {
      headers: { authorization: "Bearer test-token" },
    });
    expect(response.status).toBe(status);
  },
);

it("keeps Supabase SDK references inside provider adapters", async () => {
  const root = fileURLToPath(new URL("../../server/", import.meta.url));
  async function inspect(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await inspect(path);
      else if (
        entry.name.endsWith(".ts") &&
        !path.includes("/adapters/supabase/")
      ) {
        expect(await readFile(path, "utf8"), path).not.toContain(
          "@supabase/supabase-js",
        );
      }
    }
  }
  await inspect(root);
});

it("shares one deadline across verification and account retrieval", async () => {
  let verificationSignal: AbortSignal | null | undefined;
  const transport: typeof fetch = async (input, init) => {
    if (String(input).endsWith("/auth/v1/user")) {
      verificationSignal = init?.signal;
      return Response.json({ id: providerSubject });
    }
    expect(init?.signal).toBe(verificationSignal);
    expect(verificationSignal).toBeInstanceOf(AbortSignal);
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener(
        "abort",
        () => reject(new Error("private RPC detail")),
        { once: true },
      );
    });
  };
  const response = await fetch(`${await start(transport)}/api/v1/me`, {
    headers: { authorization: "Bearer test-token" },
  });
  expect(response.status).toBe(503);
  expect(verificationSignal?.aborted).toBe(true);
});

it("returns forbidden for a verified subject without an active application mapping", async () => {
  const response = await fetch(`${await start(upstream(200, 403))}/api/v1/me`, {
    headers: { authorization: "Bearer test-token" },
  });
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({
    error: {
      code: "FORBIDDEN",
      message: "Account unavailable",
      requestId: response.headers.get("x-request-id"),
    },
  });
});

it("rejects a matching subject returned for another provider issuer", async () => {
  const response = await fetch(
    `${await start(upstream(200, 200, { issuer: "https://other-project.supabase.co/auth/v1", subject: providerSubject, account: context }))}/api/v1/me`,
    { headers: { authorization: "Bearer test-token" } },
  );
  expect(response.status).toBe(503);
});
