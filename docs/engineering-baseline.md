# Engineering baseline

This first backend section uses one npm package with exact dependency versions and a committed lockfile. `npm ci` is the reproducible installation path. Use `.nvmrc` for the local runtime; production provider support must be verified before deployment.

| Component            | Pin     | Verification boundary                                     |
| -------------------- | ------- | --------------------------------------------------------- |
| Node.js              | 24.21.0 | Local unit tests, types and build; hosted support pending |
| npm                  | 11.19.0 | Local install and lockfile                                |
| TypeScript           | 6.0.3   | Strict NodeNext compilation; compatible lint peer range   |
| Zod                  | 4.6.7   | Runtime contracts and Unicode boundary tests              |
| Supabase JS          | 2.119.2 | Auth verification and caller-scoped RPC client            |
| Supabase CLI         | 3.4.0   | Committed JSONC configuration; local stack tooling        |
| PostgreSQL           | 17      | Local config; hosted major version must match             |
| Vitest / V8 coverage | 5.1.2   | Unit and integration runner with per-file thresholds      |
| ESLint               | 10.15.0 | Flat configuration                                        |
| typescript-eslint    | 8.74.0  | Strict TypeScript lint adapter                            |
| Prettier             | 3.10.1  | Formatting gate excluding frozen source snapshots         |
| tsx                  | 4.23.15 | Local TypeScript entrypoint                               |
| Node types           | 24.19.4 | Compilation declarations                                  |

`package-lock.json` pins transitive dependencies. Container image versions are selected by the pinned CLI for PostgreSQL major 17; record the actual resolved images in the section verification evidence. No application code depends on the parent planning directory.

The local engine is rootless Podman through its Docker-compatible socket. CI uses its runner's container engine. The frontend stack and deployment configuration are not yet installed or accepted. See the section decision and verification records for scope and actual command outcomes.

Core SQL is also tested on a separate vanilla PostgreSQL 18 container, pinned by digest in `scripts/test-core-db.mjs`. This validates application schema independence from Supabase; it does not change the Supabase deployment target of PostgreSQL 17. The provider boundary and identity lifecycle are specified in `docs/decisions/0002-portable-application-identity.md`.
