# Build log

## 2026-11-26 — Backend section 1

- Scope: reproducible TypeScript backend, shared scalar/config contracts, health and authenticated identity reads, real local Supabase identity tables/bootstrap/RLS tests. Course publishing and study mutation RPCs are later sections.
- User authorized implementation in feature sections, testing and review before each local commit, and explicitly prohibited pushes.
- Recorded the approved implementation baseline with SHA-256 hashes. Latest user destination is this nested application repository.
- Environment: Node 24.21.0, npm 11.19.0, rootless Podman with its user API socket; no Docker binary or hosted credentials required.
- No application checks have run yet. Human release/schema approval gates remain separate from local implementation review.

### Implementation progress

- Committed the accepted planning baseline locally as `b576591`; verified all 32 source snapshot hashes still match their manifest.
- Pinned Node/npm and compatible TypeScript, Supabase, Zod, Vitest and ESLint dependencies. Rejected the incompatible TypeScript 7/lint-peer combination rather than bypassing peer checks. Installation succeeded; the runtime dependency audit reports zero vulnerabilities.
- Added strict shared contracts, validated server-only configuration, Node/Vercel endpoint adapters, bounded upstream requests, request IDs and non-sensitive error envelopes.
- Added a database migration for profiles, preferences, private quotas and explicit singleton ownership. Auth bootstrap ignores untrusted authority/display metadata. RLS and grants deny browser writes; the self-account RPC derives its caller from the authenticated database context.
- Added unit, real Supabase integration and pgTAP tests, per-file coverage gates, reproducible type generation and a pinned-action CI workflow. CI is authored but has not run remotely because no push is authorized.
- Read the user-supplied TypeScript article through a delegated reviewer and recorded applicable practices in the section decision document.
- Independent review raised a potential Unicode boundary mismatch; executable regression tests disproved it for pinned Zod, which already counts code points. Kept the regression coverage.
- Reduced the local Supabase configuration to this section's required services after registry TLS failures. Retried downloads using the existing rootless Podman engine. No hosted project credentials are used.
- Documented the limits of the initial red/green evidence honestly in `docs/verification/backend-01/README.md`; dependency/startup delays prevented a complete original executable red phase.
- Added redaction-tested structured request completion logs. The expanded unit suite passes 33 tests; strict types, lint, formatting and compilation pass. Independent static review reports no remaining actionable findings.
- Persisted the agreed engineering workflow in `AGENTS.md`. Integration/database verification and generated database types remain the final pre-commit gates while local images download.

### Environment-blocked checkpoint

- ECR stalled; equivalent official Docker Hub PostgreSQL/Kong pulls are running but moving at approximately 50–60 KB/s. Estimated remaining database image transfer is 80–100 minutes at the observed rate, not a guaranteed completion time.
- Auth and PostgREST images are already cached. Local PostgreSQL/Auth/Data API services are not ready, so live database/integration checks, migration replay and type generation remain pending.
- Added a project-scoped Podman port-binding adapter to constrain this CLI's published ports to loopback; actual container binding still requires live startup verification.
- Left the implementation uncommitted to honor the required test/review/commit sequence. Nothing has been pushed. Resume instructions are in the section verification record.
- Final checkpoint checks: formatting, ESLint, strict TypeScript and build passed; 33 unit tests and 5 tooling tests passed. Unit coverage: 95.49% statements, 89.65% branches, 100% functions, 95.37% lines; per-file thresholds passed.
- Actually attempted live gates: database test command reports `ECONNREFUSED 127.0.0.1:54322`; integration runner refuses to proceed without local Supabase. These are blocked checks, not passes. Migration replay, generated types and remote CI remain unrun.
- The Kong download subsequently completed and was tagged to the CLI's expected ECR cache name. PostgreSQL remains downloading (PID 159381 at this checkpoint).

### Completed application identity portability revision — 2026-11-27 UTC

- Implemented the user-approved revision in decision 0002: application UUIDs own data, private provider/issuer/subject mappings resolve logins, and provider unlink retains application data and owner assignment. No implicit email-based linking or recovery.
- Isolated Supabase Auth/RPC calls behind the account-access adapter; verified identities and RPC envelopes must agree on issuer and subject. Application handlers consume provider-neutral results.
- Separated 33 ordinary PostgreSQL migrations from 21 Supabase setup migrations, each one top-level statement. Added deterministic assembly/drift validation and a vanilla PostgreSQL 18 compatibility suite with fresh-database replay.
- Downloads completed; real Supabase stack startup and reset succeeded. Generated database types are reproducible byte-for-byte after reset. Updated setup and runtime records to identify earlier blocked results as historical.
- Independent review findings fixed: reject unsafe pre-existing role capabilities and memberships. Added regression checks. Review reports no remaining must-fix findings.
- Fixed fixture event-loop blocking with asynchronous SQL helpers, ran shared-state suites serially after an accidental overlap, and fixed the vanilla PostgreSQL initialization readiness race using TCP. Added Podman workdir-alias coverage after the real pgTAP runner exposed that CLI argument.
- Final `npm run verify` passed: 8 tooling tests, 40 unit tests, 14 real integration tests, 62 pgTAP assertions, vanilla PostgreSQL core/replay checks, formatting, lint, strict types and compilation. Combined coverage: 96% statements, 90.52% branches, 100% functions, 96.66% lines; per-file gates passed.
- Prepared a local implementation commit on `feature/backend-foundation`; nothing pushed or deployed. User's separate frozen CLAUDE.md edit remains unstaged. Hosted OAuth, frontend, learner writes and account-deletion/recovery workflows remain subsequent sections.

### Accepted engineering-rules edits — 2026-11-27 UTC

- User explicitly approved committing their existing edits to `docs/specifications/planning/CLAUDE.md`, overriding the frozen-snapshot restriction for this change.
- Reviewed the removal of organization-specific introductory material and repository structure references. Preserved the supplied file contents exactly.
- Documentation-only change; checked the staged diff for whitespace errors. No runtime tests required. Original snapshot hashes remain historical provenance, not a checksum of this approved revision.
- Committed locally only; no push or deployment.
