import { cli } from "./supabase.mjs";
import { query } from "./local-db.mjs";
const result = cli(["status", "-o", "json"]);
if (result.status !== 0) throw new Error("Local Supabase must be running");
const url = new URL(JSON.parse(result.stdout).API_URL);
if (!["127.0.0.1", "localhost"].includes(url.hostname))
  throw new Error("Local Auth configuration only");
const issuer = (url.origin + "/auth/v1").replaceAll("'", "''");
query(`begin;
  do $$ begin
    if exists(select 1 from private.supabase_auth_config where issuer <> '${issuer}') then
      raise exception 'Existing authentication issuer differs; explicit identity migration required';
    end if;
  end $$;
  insert into private.supabase_auth_config(singleton,issuer) values(true,'${issuer}') on conflict(singleton) do nothing;
  select private.provision_supabase_identity(id) from auth.users;
  commit;`);
console.log(
  "Local authentication issuer configured; existing identities provisioned.",
);
