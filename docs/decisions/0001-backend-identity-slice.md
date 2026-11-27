# Backend section 1: runtime and account identity

Identity ownership, bootstrap and provider-deletion behavior below are superseded by [decision 0002](0002-portable-application-identity.md), approved subsequently by the user.

The first backend section implements the prerequisites of D00/D01/D02 and the identity portion of D05/D06. It does not claim completion of the entire database schema. Content identities, course versions, study writes, receipts, publication, transfers and deletion workflows will be separate tested sections.

Use Node 24 and compatible strict TypeScript, Zod contracts, Supabase Postgres/Auth and the Supabase client. TypeScript 7 was rejected because the lint adapter's supported peer range ends below 6.1; use pinned TypeScript 6.0.3 without forced peer resolution. Runtime installation/build/test evidence determines compatibility.

## Read endpoint addition

`GET /api/v1/me` verifies the bearer token through Supabase Auth, then calls `account_context()` with that same caller token and the non-administrative project key. It returns only user ID, nullable display name, normalized preferences (including decimal-string revision), usage counts and an owner-capability boolean. Missing/inactive profile fails closed. No email, provider payload, raw role row or administrative key is returned.

`GET /api/v1/health` reports liveness and build release only; it is not a database readiness claim. Both endpoints use no-store and request IDs. Unknown routes and wrong methods are explicit errors. Private errors do not echo SDK exceptions or tokens.

## Database foundation

Auth-user creation bootstraps an active profile and zero quota row atomically. Untrusted signup metadata is not copied into roles/account state/display names. Display-name editing is a later RPC. The owner is explicitly assigned through trusted operations; the first signup never becomes owner. Ordinary user deletion cascades personal rows; deleting the sole owner is restricted.

Anonymous clients have no access to private account tables/RPCs. Authenticated clients can only select their own active profile/preferences; direct writes are denied. `account_context` derives the UID from the caller and exposes only the bounded self DTO. Operational quota/owner tables remain private. Security-definer helpers use fixed search paths and explicit grants.

## Tests and environment

Run actual local Supabase using Docker or its compatible rootless Podman socket. Unit tests may isolate transport failures; integration tests use real Auth, Data API and PostgreSQL. Do not label local password-based synthetic test identities as deployed Google/GitHub acceptance. Never use real learner data.

This slice has no Storage business workflow; live Storage isolation tests belong to the publication/transfer sections. CI is authored here but is not run on GitHub until the user later authorizes a push. Local tests and independent code review precede the local implementation commit.

## TypeScript guidance

The user requested consideration of [Bunny Dev's TypeScript best-practices article](https://medium.com/@bunny_dev/mastering-typescript-the-ultimate-guide-to-best-practices-for-scalable-and-maintainable-code-6f63080ef1ad). Apply inference for obvious locals, explicit public boundaries, unknown plus runtime parsing, readonly snapshots, union narrowing and composition. Do not introduce inheritance/generic repositories or replace database permissions with static types. The article does not supply this project's test strategy.

Official supporting references: [Supabase local development](https://supabase.com/docs/guides/local-development), [Supabase database testing](https://supabase.com/docs/guides/database/testing), [TypeScript narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html). Exact version pins are in package-lock.json; provider support is verified separately before deployment.

## Initial observability

Each completed request emits structured JSON containing a generated request ID, allowlisted method/path, status and elapsed milliseconds. Unknown paths are replaced with `[unmatched]`; query strings, tokens, headers, bodies and identities are omitted. A logging sink failure must not fail an already acknowledged request. Central telemetry export, dashboards and alerts remain operations work in later sections.
