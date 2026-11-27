# BuildTrail

An online platform for learning software engineering by building projects.

The first implementation section provides a TypeScript HTTP backend, PostgreSQL-owned application identities and a Supabase authentication adapter. Course publishing, learner study writes, the frontend, and hosted deployment are subsequent sections.

## Local setup

Use the Node version in `.nvmrc`, npm 11, and a running Docker-compatible container engine. The Supabase wrapper automatically detects the current user's rootless Podman socket when Docker is unavailable.

```sh
npm ci
npm run db:start
cp .env.example .env
```

Set `SUPABASE_PUBLISHABLE_KEY` in `.env` to the local anonymous/public key shown by `node scripts/supabase.mjs status`. Never put the service-role key in the application's environment. Keep `.env` untracked. Then run `npm run dev`; the API listens on `127.0.0.1:3001`.

- `GET /api/v1/health`: liveness and release identifier; does not claim database readiness.
- `GET /api/v1/me`: verified bearer required; returns only the caller's normalized account context.

The local stack runs PostgreSQL, Auth and the Data API. Unused Storage, Realtime, Studio, Edge Functions, analytics and mail services are disabled for this section. Local password identities are synthetic integration fixtures; production OAuth setup remains future work.

## Verification

```sh
npm run verify
npm run db:types
```

`verify` checks migration assembly, tooling, formatting, lint, strict types, unit tests, core migrations on vanilla PostgreSQL 18, pgTAP database tests, real HTTP/Auth/Data API integration tests with per-file coverage thresholds, and compilation. Integration tests refuse non-loopback targets, create disposable identities, and clean them up. They obtain local fixture administrative credentials in memory from CLI status; the application uses only the public project key and caller token.

`npm run db:reset` destroys and recreates this project's local database and applies the repository migrations. Use it only when local data is disposable. `npm run db:stop` stops this project's containers. Database types are generated from the local schema and checked in. CI checks that regeneration does not change them. Run integration/coverage suites serially: they temporarily modify the local authentication configuration.

## Database portability

BuildTrail user IDs belong to the application. Private mappings connect `(provider, issuer, subject)` to those IDs; removing a provider login retains application data. The API returns the application UUID. Supabase SDK calls are confined to backend adapters. See the [approved identity design](docs/decisions/0002-portable-application-identity.md) for trust boundaries, deletion and recovery.

Edit canonical one-statement SQL files under `database/migrations/core` or `database/migrations/providers/supabase`, then run `npm run db:prepare`. Generated copies in `supabase/migrations` are checked by `npm run db:check`. `npm run test:core-db` tests the core without Supabase using a disposable, digest-pinned vanilla PostgreSQL container.

`db:start` and `db:reset` also configure the local authentication issuer from CLI status. They refuse to silently rebind an existing different issuer. Hosted configuration is a separate explicit operator step.

## Implementation records

- [Accepted specifications](docs/specifications/README.md)
- [Section scope and decisions](docs/decisions/0001-backend-identity-slice.md)
- [Build log](BUILD_LOG.md)

Work is tested, reviewed and committed in sections. Publishing changes to origin and deploying remain separate actions.
