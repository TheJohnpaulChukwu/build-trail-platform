# Backend section 1 verification record

## Scope

Runtime/configuration contracts, liveness and authenticated self-account reads, identity bootstrap, profile/preferences RLS, private quotas, and explicit singleton ownership. This is a local implementation checkpoint, not hosted deployment acceptance or completion of every D00–D06 deliverable.

## Development and review evidence

Tests were authored before the migration. Registry/download delays prevented executing the database red phase before the SQL implementation was written. Likewise, initial unit implementation was drafted while dependencies were unavailable; a later missing-module run is not claimed as an original red phase. The malformed-revision regression was observed failing and corrected. Future sections should get the now-established test harness running before implementation.

Independent review examined configuration, HTTP handlers, SQL grants, security-definer search paths, RLS, atomic bootstrap and owner protections. A suspected Unicode-length mismatch was tested and disproved: the pinned Zod implementation counts code points. Boundary regression tests remain in the suite. Missing quota state explicitly fails closed and is covered by pgTAP.

Unit tests isolate network failure modes. Integration tests use actual local Auth, PostgREST, PostgreSQL, and HTTP listeners; no internal-service mocks substitute for those tests. Service-role access is confined to test fixture management. No real learner data or hosted project is involved.

## Checks

Final command outcomes and coverage are recorded below after execution. Local container-engine output and machine-local logs remain ignored; credentials and signed registry URLs are not committed.

## Remaining acceptance outside this section

- Hosted environment/project binding and actual Google/GitHub OAuth acceptance.
- Deployment/provider runtime support and production SMTP configuration.
- Browser UI tests, content publication/Storage isolation, learner mutation and concurrency tests.
- Broader metrics/alerts and operations dashboards, beyond sanitized request-completion records.
- Human release approval and any push or deployment; neither is performed by this section.

## Historical blocked checkpoint (resolved)

The local container registry is the outstanding environment blocker. ECR pulls stalled; Docker Hub equivalents are transferring, but measured aggregate progress implies roughly 80–100 minutes more for the PostgreSQL image at the observed rate. Auth and PostgREST images are cached; PostgreSQL and Kong are still downloading. No local Supabase services are ready yet.

Therefore pgTAP, real Auth/Data API integration, migration reset/replay and database type generation are **not passed**. The implementation must remain uncommitted until those gates run successfully. The already committed planning baseline is separate from the uncommitted implementation.

Resume by checking that the current image pulls completed, tagging the verified Docker Hub equivalents to the CLI's ECR names if needed, then running `npm run db:start`, `npm run db:reset`, `npm run db:types` and `npm run verify`. Regenerate types a second time and compare bytes. Review any resulting fixes before the local implementation commit. Do not push.

## Earlier checkpoint results (2026-11-27 UTC)

| Check                                                            | Actual outcome                                                                                     |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Formatting, ESLint, strict TypeScript, compilation               | Passed                                                                                             |
| `npm run test:tooling`                                           | 5 passed                                                                                           |
| `npx vitest run tests/unit --coverage`                           | 33 passed; 95.49% statements, 89.65% branches, 100% functions, 95.37% lines; per-file gates passed |
| Runtime dependency audit                                         | Zero reported vulnerabilities                                                                      |
| Frozen specification hashes                                      | All 32 matched                                                                                     |
| Supabase CLI and Podman shim smoke                               | CLI 3.4.0 and forwarded Podman version command succeeded                                           |
| `npm run test:db`                                                | Blocked: `ECONNREFUSED 127.0.0.1:54322`; no database available                                     |
| `npm run test:integration`                                       | Blocked: local Supabase not running                                                                |
| Reset/replay, generated types, combined live coverage, GitHub CI | Not executed                                                                                       |

Independent review findings about Podman port forms/imports were corrected and covered by tooling tests. Live container binding remains unverified. The unit-only coverage figures above must not be presented as a passing integration suite.

Latest download update: Kong completed and is already tagged as `public.ecr.aws/supabase/kong:2.8.1`. PostgreSQL remains in progress; the historical estimates above are not a new measurement.

## Completed portability verification (2026-11-27 UTC)

This run supersedes the blocked checkpoint above. Image downloads completed, the real local stack started, and PostgreSQL/API published ports were inspected as loopback-only.

| Check                                              | Actual outcome                                                                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `npm run db:reset`                                 | Passed; all 54 migrations applied and local issuer configured                                                          |
| `npm run verify`                                   | Passed, exit 0                                                                                                         |
| Migration assembly                                 | 33 core + 21 Supabase statements; generated copies match                                                               |
| Tooling                                            | 8 passed                                                                                                               |
| Unit                                               | 40 passed                                                                                                              |
| Vanilla PostgreSQL 18                              | Core migrations and invariants passed in two fresh databases; unsafe role attributes and inherited privileges rejected |
| Supabase PostgreSQL 17 pgTAP                       | 62 passed                                                                                                              |
| Real Auth/Data API/HTTP integration                | 14 passed (54 total tests in combined coverage run)                                                                    |
| Combined coverage                                  | 96% statements, 90.52% branches, 100% functions, 96.66% lines; per-file gates passed                                   |
| Formatting, ESLint, strict TypeScript, compilation | Passed                                                                                                                 |
| Database types                                     | Generated from the live schema; regeneration after reset matches byte-for-byte                                         |
| Remote CI / hosted deployment                      | Not run; no push or deployment authorized                                                                              |

Review found and corrected insufficient validation of a pre-existing application role. The core now rejects login, superuser, bypass-RLS, create-role, create-database, replication, and outbound role memberships. Regression cases exercise privileged membership and create-role rejection. Final independent review reported no remaining must-fix security or correctness findings.

The live harness initially failed when two runs were accidentally overlapped and synchronous fixture commands blocked the in-process HTTP server. Fixture commands now run asynchronously; the final suite ran serially. Run integration/coverage suites one at a time because they mutate singleton issuer configuration. A vanilla PostgreSQL initialization race was fixed by waiting for TCP readiness rather than the temporary initialization server's Unix socket.

Verified local versions: Supabase PostgreSQL 17.12.0.002, Auth 2.198.0, PostgREST 16.6, Kong 2.8.1, and pg_prove 3.36. The separate PostgreSQL 18 image digest is pinned in the test runner. Historical frozen-snapshot hash results above describe the earlier checkpoint; the user's subsequent CLAUDE.md edit is preserved separately and excluded from the implementation commit.
