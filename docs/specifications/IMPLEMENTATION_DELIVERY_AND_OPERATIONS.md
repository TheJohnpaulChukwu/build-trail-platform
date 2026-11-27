# Implementation delivery, verification and operations

Status: implementation specification; no application, infrastructure, backup job, review approval or deployment is created by this document.

## Scope and precedence

Read the [root specification guide](IMPLEMENTATION_SPECIFICATIONS.md) for precedence. This file is a normative refinement of the maintained product and technical baseline, not an independent competing master. Commit and merge the reviewed specification baseline in the application repository before beginning application implementation. This file defines how to deliver the complete BuildTrail release in the separate `build-trail-platform` application repository. Preserve the original course and this planning repository. Read the [product scope](planning/01_PRODUCT_AND_SCOPE.md), [acceptance requirements](planning/09_ACCEPTANCE_AND_QA.md), [technical contracts](planning/technical/README.md) and applicable general rules in [CLAUDE.md](planning/CLAUDE.md). The first public course contains all 30 lessons. The two-lesson visual checkpoint does not reduce release scope. Additional instructor publishing, hosted Python execution, grading, payments, social features and arbitrary plugins remain excluded.

All artifact paths in backticks below are proposed paths relative to the future application repository unless explicitly described otherwise. They are deliverables, not claims that files already exist. Links point to current specification sources. Exact runtime and provider capabilities must be verified during implementation; this document does not certify current service limits or pricing.

The coverage requirements here and the [test plan](planning/technical/09_TESTING_AND_QUALITY.md) apply the general engineering rules: enforce at least 80% instruction coverage and 60% branch coverage for each application module, while independently requiring every critical scenario below. Coverage percentages never replace behavioral evidence. Java, payment and financial-domain conventions do not apply to this TypeScript/Python learning platform.

## Delivery rules and review units

Each work package produces a small coherent change with a named interface, tests and a reviewable result. Split a package further when its database, API and UI changes cannot be reviewed together comfortably; retain the package ID as the parent. A package is complete only when its exit evidence exists. Do not mark a checklist complete merely because code or a test stub exists.

For behavior changes, record Red–Green–Refactor evidence: a targeted test fails for the intended missing behavior, the smallest implementation passes, then refactoring preserves behavior. Missing dependencies or broken test setup are not useful red evidence. Unit tests may substitute collaborators; integration tests run owned collaborators, Postgres, Auth and Storage for real. External Google/GitHub providers may be simulated in local error-path tests, but real staging provider tests remain mandatory. Fault injection through a network proxy against real services is acceptable; an internal mock is not proof of database or workflow correctness.

Every public service method/function and API endpoint needs relevant tests. For SQL policy and transactional functions, use real database assertions even when the TypeScript coverage tool cannot instrument SQL. Configure module coverage explicitly; report generated schema types, third-party code and fixtures as justified exclusions, never exclude failing business logic. TypeScript tooling often reports statements/functions rather than literal bytecode instructions: record the selected instrumenter's instruction-equivalent metric and obtain a concrete documented reconciliation if it cannot satisfy the governance terminology. Do not silently rename statement coverage to instruction coverage. Keep SQL scenario coverage alongside instrumented module reports.

No package creates implicit production approval. General governance tiers apply before changes reach production:

| Tier | Application here | Evidence required |
| --- | --- | --- |
| 1 | Documentation, formatting and changes with no runtime behavior effect | Requesting engineer scope and normal checks; a behavior-changing lint fix is not Tier 1 |
| 2 | Features, APIs, bug fixes and integrations | At least one engineer other than the author reviews the concrete change |
| 3 | Production deployment, schema DDL, security configuration, architecture/rule changes and explicitly designated critical components | At least two engineers, including the senior role specified by the general rules; record actual reviewers and decisions |

Subagents and automated reviews are not substitutes for the required human reviewers. Record unknown reviewer availability as an input before promotion; do not invent approval or use this requirement to stop authorized local preparation. If the owner requests a different governance process, reconcile that explicitly rather than assuming an exception. No payment-domain criticality is imported into this project.

Each review record in `docs/verification/<release>/changes/<package>.md` contains scope, affected interfaces, tier, tests and outcomes, red/green evidence, migration/rollback implications, actual review status and remaining gaps. `BUILD_LOG.md` summarizes progress; chat updates remain the primary user communication during sustained work.

## Dependency-ordered work packages

The identifiers below refine the existing T00–T10 plan. Packages sharing a dependency may proceed independently once their contracts are stable and delegation is authorized. A later package cannot claim completion against mocked predecessor behavior.

| ID | Deliverable and named artifacts | Dependencies | Exit evidence |
| --- | --- | --- | --- |
| D00 | Repository baseline: `package.json`, lockfile, `.nvmrc`, `.env.example`, `README.md`, `docs/engineering-baseline.md` | None | Clean checkout installs, local API and UI start, typecheck/build succeed, runtime matrix recorded |
| D01 | CI baseline: `.github/workflows/ci.yml`, coverage configuration, secret/dependency checks | D00 | Fresh runner executes checks with local real services; no production secrets accessible to PR jobs |
| D02 | Runtime schemas: `src/contracts/`, schemas for manifests, mutation envelopes, errors, backup imports and config; valid fixture bundles | D00 | Valid/invalid boundary fixtures, exact field limits, unknown-field rejection and generated/shared types agree |
| D03 | Public course adaptation: `content/public/rate-limiter-python/`, `docs/content/adaptation-map.json`, source hashes and route map | D02 | Every original teaching block mapped, portable prerequisites and links, exactly 30 lessons in 7/7/6/5/5 milestones |
| D04 | Independent starter/harness: starter files under public bundle, manifest inventory, setup README and original fixtures | D03 | Clean-machine first-milestone walkthrough; expected initial failures; temporary reviewer solution excluded |
| D05 | Content identities/migrations: `supabase/migrations/`, generated database types, fixture seed | D02 | Fresh and upgrade migrations; all composite FKs and stable identity invariants tested; repeat seed preserves learner work |
| D06 | Identity and permissions foundation: trusted profile/quota initialization, singleton owner setup, RLS/grants and helper functions | D05 | Anonymous/A/B/owner/deleting-user direct-access matrix passes; browser cannot grant itself ownership or mutate tables directly |
| D07 | Study mutation RPCs and client adapter: `src/features/learning/`, typed RPC error mapping | D06 | CAS, absent-row race, field patches, idempotency, rate/quota limits and lock order proven with concurrent real clients |
| D08 | Safe content parser/renderer: shared AST utilities, source-to-section mapping, URL handling and search document derivation | D02,D03 | No dropped/duplicated blocks, code comments remain code, malicious links/HTML rejected, identical full/staged content model |
| D09 | Visual slice: semantic tokens and components; real lessons 1/11, stress lesson 22 | D08 | Both themes and phone/tablet/desktop; real text, hints, notes panel, diagrams, focus mode and failure states reviewed |
| D10 | Auth/session integration: callback route, guarded API verification, account-scoped query/draft store | D06,D09 | Both real staging providers, return-route validation, cancellation/error/expiry; account switching cannot expose prior drafts |
| D11 | Reliable saved work: note/reflection/evidence editors, checklist/progress/review flag/resume and preferences UI | D07,D10 | Second-session resume, dirty-during-save, lost-response retry, conflict merge, quota errors and local-draft recovery pass |
| D12 | Owner upload/validation: private direct upload, leased operation, bounded validator and generated starter ZIP | D02,D05,D06,D08 | Adversarial archive suite; maximum bundle fits runtime; timeout/fencing/retry cannot corrupt ready content |
| D13 | Draft preview and immutable publication/rollback: owner pages and transaction handlers | D10,D12 | Second course uploads without code changes; concurrent publish has one winner; draft inaccessible; retained reader snapshots coherent |
| D14 | Complete reader/catalogue/search/reference/download journeys | D03,D04,D09,D13 | All lessons/references discoverable; title/body/code/reference search; old slugs redirect; download and setup links work |
| D15 | Visual coverage and three simulations: pure models, SVG/event-table renderers, presets | D09 | 30-row coverage map; boundary, fractional refill and concurrency traces correct; mobile/text alternatives and reduced motion |
| D16 | Personal export/import: bounded transfer objects, preview and transactional application UI/API | D07,D11 | Consistent round-trip, preference/record revision conflicts, selected-course replace, archived data and Unicode preserved |
| D17 | Deletion and owner recovery: fresh-auth challenge, deletion jobs, ledger writer, cleanup/reassignment tools | D06,D10,D16 | Sole-owner safeguard, retry stages, stale-token denial, no account resurrection after restore; honest pending UI |
| D18 | Operational tooling/runbooks: backups, restore, rollout/rollback, quotas, secrets and incidents | D12,D13,D16,D17 | Encrypted off-provider recovery point, tested isolated full restore, scheduler health and deletion-ledger replay evidence |
| D19 | Integrated hardening and performance evidence | D11,D13–D18 | Browser/accessibility/security matrix, bounded load, bundle and validation measurements; required coverage and critical scenarios pass |
| D20 | Invited pilot and production release | D14,D15,D18,D19; deployment inputs and actual required approvals | Recorded real study sessions, resolved blockers, tested release commit deployed, production smoke and owner handoff |

### D00–D02: bootstrap without unverified assumptions

Begin with the selected [stack baseline](planning/technical/01_STACK_AND_DECISIONS.md). Test a maintained Node LTS supported by both Vite and Vercel; Node 24 is the initial candidate, not a verified guarantee. Freeze exact npm/tool versions, package lock, Supabase CLI and the hosted-compatible Postgres major. Record archive parser capabilities, dependency licences and advisories. Select a streaming archive implementation only after its limits can be tested.

Define reproducible commands in `package.json`: `dev`, `dev:api`, `lint`, `typecheck`, `test:unit`, `test:component`, `test:db`, `test:integration`, `test:e2e`, `test:coverage`, `content:validate`, `build`, and `verify`. A single documented command starts local services and synthetic fixtures; a second resets them. Explain required Docker/CLI setup and local API routing. Do not commit secrets, generated dependency directories or test credentials usable on hosted systems.

Compile browser and server boundaries separately. Browser imports cannot reach administrative clients or server config. Runtime configuration schemas fail closed when required values are missing or environment/project identities disagree. API errors follow the canonical envelope, contain safe request IDs and expose no stack traces or private text. Manifest and backup schemas are versioned; samples use real stable IDs and supplied files, not placeholders copied from illustrative snippets.

### D03–D04: prove the course before distributing it

Preserve original inputs. For each adapted location record source file/heading/hash, public file/anchor, reason and verification. Replace personal paths, mandatory ShipThatCode harness requirements and unavailable fixtures with independently authored resources. Legacy compatibility remains optional. Include supported Linux/macOS/WSL instructions, Python/tools versions actually tested, the optional study schedule, supplied versus learner-authored tests, and just-in-time Lua/Redis guidance. Do not redistribute unverified third-party assets.

The clean-room reviewer starts with only public instructions and the starter download, validates its file inventory and initial expected test failures, then follows lessons 1–7. Temporary solutions are private verification fixtures and must not enter the downloadable bundle. Run content validation after ZIP generation so the shipped bytes, README and manifest match. Record unsupported native Windows behavior honestly.

### D05–D07: transactional foundations

Implement the [database contract](planning/technical/03_DATABASE_AND_AUTHORIZATION.md) and [API contract](planning/technical/04_API_AND_SYNC.md), including composite identity relationships, revisions encoded as decimal strings, immutable snapshot constraints, stable item kinds, idempotency receipts and environment-safe administration.

Lock user quota, enrollment(s) in deterministic course order, then affected records. Enforce authorization and limits inside the authoritative operation; UI debouncing is not enforcement. Concurrent inserts of an absent note must not silently overwrite. Receipt reuse with a different request hash is rejected; committed request retries return the prior result without another revision increment. Test direct REST and SQL/RPC attempts as actual user principals, not service-role clients masquerading as users.

Imports and settings need revision protection at the scope they modify. Preview records both selected-course workspace revisions and the preferences revision when preferences are selected. Apply locks/rechecks those dependencies, preserves monotonically advancing live revisions and durable course epochs, invalidates stale in-flight saves and atomically updates quota accounting. Replace must not reset a revision to an imported value. Every course write carries the expected durable epoch as well as its record revision; replace increments the epoch so deletion/recreation cannot make an old command valid again. Epoch tombstones survive removal/recreation of enrollment data. Deletion, import and ordinary writes share account-state and locking rules. These are implementation invariants even where an earlier schema table abbreviated the fields.

### D08–D11: reviewable interface, then actual persistence

Use real imported content for the visual checkpoint. Static fixture/local save states are clearly marked during D09; they cannot satisfy D11. Cover every component's loading, empty, disabled, failure, expired-session and conflict behavior. Verify safe areas, drawer focus return, text zoom, code/table scrolling and editing with the on-screen keyboard.

Render one content model in full-lesson and Understand/Build/Verify/Reflect modes. Notes, reflections and evidence are separate records. Only acknowledged database writes show Saved; newer local edits remain dirty when older acknowledgments arrive. Preserve account-scoped drafts on navigation/reload/expiry. Explicit sign-out offers save/retry/download/discard before private cache cleanup; response callbacks from an old account cannot repopulate the next account's cache.

Document progress presentation across content changes: the pinned reader uses its pinned required-lesson denominator and labels its version; My Learning uses the current published denominator. A version-update notice explains any changed progress. Stable completed records and notes survive, removed content remains represented in archived notes, and switching snapshots is explicit. No checklist or reflection secretly gates completion.

### D12–D15: publishing and complete learning

Exercise the largest allowed bundle early: 10 MiB compressed, 25 MiB actually expanded, 200 entries and the per-file/image limits in the [publishing contract](planning/technical/05_CONTENT_AND_PUBLISHING.md). Never trust declared sizes. Reject nested archives, path tricks, links, duplicates, unrecognized files, raw HTML and unsupported executable content. Starter scripts remain downloads, never server execution. Derive section links, search records, starter archive and asset hashes from the same validated snapshot.

A validation request is awaited and bounded. Persist operation state, expiring lease and fencing token; a late worker cannot finalize after replacement. Publication verifies ready immutable content and expected active version in a database transaction. Staged Storage objects are not a distributed transaction with the pointer change. Faults before/after staging and pointer commit retain the previous valid course and support safe retry. Keep published snapshots during the pilot; cleanup only unreferenced failed/cancelled staging after 48 hours.

Owner preview uses private keys and explicit version context. All public lesson/search/download reads pin a version. Withdrawn course content follows access policy while personal records remain recoverable; already downloaded files and still-valid signed links cannot be recalled. Internal sample content proves generic course structure but is not invented public catalogue filler.

Complete the catalogue, My Learning, setup/reference pages, course search and command/download actions. Give all 30 lessons a purposeful visual treatment; a state table is sufficient where appropriate. Test fixed-window versus exact-sliding-log boundary behavior, token refill/cost and deterministic two-worker interleavings. Simulations disclose that they do not execute learner Python or model every production failure.

### D16–D17: personal data and deletion

Export takes a consistent snapshot with schema/version references, stable IDs, all study fields and preferences; it excludes tokens, provider secrets and roles. Transfers use private objects and short-lived links. Enforce at most 10,000 study records and 1,000 enrollments per user and the canonical multipart transfer bounds: each JSON part is at most 20 MiB and 10,000 records, and the complete backup set is at most 128 MiB. Follow the data/API contract for its manifest, consistent snapshot identity, part hashes and all-or-nothing import. Never truncate or independently apply parts; offer bounded course selection when needed. Validate the entire bounded import before a preview; unknown identities yield explicit recoverable errors. Merge requires choices for differing values; replace affects selected courses only; preferences require separate selection. Offer pre-import export, recheck preview revisions and apply transactionally.

Deletion creates a one-use ten-minute challenge, verifies same-user fresh provider authentication/new session rather than refreshed JWT issuance, then atomically blocks private operations and records a durable job. Retry object cleanup/Auth deletion from stored stages. Do not delete published assets or let a stale token recreate rows. Sole-owner deletion requires prior trusted reassignment and resolution of draft ownership. A pending job is not success. Preserve a minimal separate deletion ledger for recovery as specified below.

## Continuous integration and release pipeline

### Required PR workflow

Run with least permissions on synthetic data; pin third-party actions to reviewed commit SHAs. Do not use privileged pull-request execution on untrusted checkout code. Hosted deployment secrets are unavailable to fork jobs. Save sanitized evidence with commit/toolchain versions; traces expire after seven days unless an explicitly approved operational need requires otherwise.

1. Frozen install; validate runtime/config schemas; formatting, lint and strict type checking.
2. Unit/component tests and per-module coverage gates; fail on missing critical tests even above percentage thresholds.
3. Start local Supabase/Auth/Storage, migrate from empty, seed synthetic users/content, run policy/RPC/server integration suites.
4. Test upgrades from the previous release schema with data; regenerate database types and fail on drift.
5. Validate full public content, fixture bundles, links, starter inventory and adversarial uploads.
6. Build production client/API; inspect browser output for administrative imports/secrets; scan committed and generated artifacts.
7. Run affected E2E journeys against built assets/local real services. The release candidate additionally runs the full Chromium/Firefox/WebKit matrix and visual/accessibility checks.
8. Publish a concise check summary, sanitized test logs, coverage and artifact sizes. Never mass-update visual baselines to hide unexplained changes.

A clean CI pass is required but does not prove OAuth, live serverless limits, real-device keyboards or recoverability. Those have separate staging/manual evidence. Required checks must not silently pass when services are unavailable: fail or explicitly report blocked.

### Hosted environment and secret contract

| Environment | Resources and configuration | Data and authority |
| --- | --- | --- |
| Local | Vite/local Node API, CLI/Docker Supabase and ignored local env | Synthetic fixtures; test auth only |
| PR preview | Vercel preview; no production credentials; public/synthetic UI or deliberate stable staging flow | Synthetic only; no wildcard OAuth callbacks |
| Staging | Fixed Vercel origin, dedicated hosted Supabase and provider credentials | Test identities/content; real provider acceptance |
| Production | Separate Vercel environment/Supabase/provider configuration | Real learner records; protected release workflow |

Browser-safe variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_APP_ENV`, `VITE_APP_ORIGIN`, `VITE_SUPPORT_URL`. Server-only configuration includes the administrative credential, verified project URL/ID, expected environment/origin and limits. OAuth secrets stay in provider/Supabase dashboards; migration credentials stay in protected CI/operator configuration. Never use `VITE_` for secrets. `.env.example` contains descriptions/placeholders only. Rotate exposed secrets immediately rather than merely deleting the visible file.

Verify selected accounts permit isolated staging and production before provisioning. If entitlement is insufficient, resolve setup/budget instead of pointing tests at production. Confirm commercial eligibility and regional residency before selecting the final plan/region; free-tier-first is not permission to purchase or a permanence guarantee.

### Real staging acceptance

For Google and GitHub separately: sign in from the stable deployed origin, verify PKCE callback and intended lesson/section return, missing optional profile fields, canceled consent, callback failure, expired session, logout and second-device resume. Record verified identity-linking behavior; do not implement email matching. Test owner bootstrapping with a real authenticated UUID and an ordinary non-owner denial. No local test-login control ships in production.

The deployed root is the application repository, output `dist/`, with `/api/v1` Node functions. Ensure `/api/*` and static assets resolve before SPA fallback; unknown API routes return API 404 rather than HTML. Test direct lesson/auth routes and reload. Validate actual CSP/security headers and exact configured origins. Private/draft responses are no-store; immutable application assets cache long-term; HTML revalidates; content keys include version/access state.

### Promotion and rollback

Record the candidate commit, immutable build identifier, toolchain, migrations, content version and environment identity. Complete staging checks and actual required reviews. Capture a recoverable backup before production schema changes. Apply compatible migrations through a protected operator/workflow, deploy the same tested commit/artifact, and verify project bindings before any write smoke test.

Production smoke covers anonymous catalogue/lesson/reference, direct links, starter bytes, both providers, one disposable authorized note/progress save, resume, sign-out and issue-report destination. Remove disposable test records. Never run load/adversarial tests against real learners. Record success/failure and sanitized request IDs. Roll back to the previous compatible app release for app faults; use the active-version pointer for course rollback. A destructive schema fault requires the rehearsed restore/forward-fix path, with explicit treatment of data written since backup.

## Performance and capacity evidence

| Measurement | Method | Initial acceptance target/action |
| --- | --- | --- |
| Concurrent workload | 15-minute synthetic run, 20 active sessions including five note writers, local then staging | No lost/duplicate writes, unauthorized reads or unhandled errors; report throttling, query latency and cold starts separately |
| Warm note acknowledgment | Measure from user save dispatch to committed acknowledgment in chosen nearby region; include p50/p95 and sample count | p95 below 1.5 seconds; immediate pending feedback; investigate actual network/SQL causes |
| Initial mobile code | Production gzip measurement of entry route excluding genuinely lazy demos/highlighting | At most 250 KiB JavaScript; report route chunks explicitly |
| Initial transfer | Cold cache route with fonts and required assets | Below 750 KiB; record browser/network profile and cache state |
| Maximum validation | Real deployed maximum legal bundle/import, measured duration and peak memory | At least 2× measured-duration headroom within configured timeout; memory fits runtime without unsafe pressure |
| Recovery | Full isolated restore and correctness checks | At most 24 hours data loss and one working day restoration only after actual backup cadence/rehearsal supports it |

Record machine, browser, region, runtime settings, dataset, concurrent load and network throttling in `docs/verification/<release>/performance.md`. Measure cold and warm navigation separately. A 100-active-learner assumption is not 100 simultaneous users or proof of provider capacity. If limits fail, optimize bounded work/indexes first, then document a revised contract or worker design and affected tests; do not silently lower accepted upload limits or introduce a second hosting platform.

## Backup, deletion ledger and full recovery

### Recovery point format and scheduling

Before admitting real study data, choose an owner-controlled encrypted off-provider destination, scheduler, key custodian and tested key-recovery method. Target daily snapshots with seven daily and four weekly recovery points. These are proposed operating commitments until selected and verified. A powered-off laptop cannot provide dependable daily backup. Check scheduler failures and age of last successful recovery point; delayed jobs weaken the claimed recovery objective.

Each recovery point contains a manifest with snapshot timestamp, schema/migration version, application release, course/version pointers, original accepted bundles, object paths/sizes/SHA-256, encryption/key identifier and job result. Capture database content through a provider-supported consistent method and copy required Storage bytes separately; database backups alone do not contain those bytes. Include managed Auth/identity and Storage metadata restoration requirements explicitly. Never assume a generic SQL dump can reconstruct a managed provider project.

Immutable published assets can be deduplicated by hash, but each retained snapshot manifest must remain complete. Include required user records and transfer-object recovery/expiry policy; do not preserve expired personal exports unnecessarily. Backup contents and key material have restricted, separate access. Keep keys out of repository/logs and test decryption independently.

### Deletion ledger durability

Keep a minimal append-only recovery ledger outside rollback-prone application snapshots, recording user UUID, deletion job ID, deletion-request/activation time and final state. It contains no notes, email addresses or provider tokens. Persist the deletion barrier durably before the deletion workflow claims completion. If external ledger persistence fails, preserve the deleting account barrier, surface pending operational status and retry; never report recoverable deletion complete prematurely.

Replay all applicable ledger entries newer than the restored snapshot, as well as incomplete deletion barriers, before enabling private/public account traffic. Remove restored user rows/Auth identity and owned objects through the tested cleanup procedure; verify old tokens cannot read or recreate data. Ledger retention covers the oldest still-restorable backup plus any approved retention grace, not merely the 30-day deletion-job diagnostic expiry. Purge ledger entries only when no retained recovery point can resurrect that account. Expire completed job diagnostics after 30 days independently.

### Restore rehearsal procedure

1. Create an isolated target with staging-only secrets, traffic disabled and a recorded project ID. Never restore into a live project as a test.
2. Select a complete manifest, verify decryption and all checksums, and record actual backup age and intended recovery scope.
3. Restore schema, roles, grants, RLS, RPCs and data through the supported procedure; establish managed Auth/identity restoration and preserve learner UUID associations.
4. Restore required Storage metadata and bytes under original immutable paths; verify hashes and no missing references.
5. Reapply deletion ledger and complete pending deletion cleanup before any learner authentication or write becomes possible.
6. Reconfigure staging OAuth, allowed origins, server secrets and environment checks; provider secrets are setup inputs, not blindly restored production configuration.
7. Run authorization matrix, both provider identity mapping, representative notes/reflections/progress, private drafts, public search/downloads, publish/rollback, personal export and stale-token denial.
8. Compare counts/invariants against the manifest, measure end-to-end elapsed time, document lost-data interval and all gaps. Retain sanitized evidence; destroy/restrict temporary recovery data according to the rehearsal policy.

Maintain `scripts/backup/`, `scripts/restore/`, `docs/runbooks/backup-restore.md`, `docs/runbooks/deletion.md` and `docs/verification/<release>/restore.md`. Commands must support explicit target identity and dry-run where useful; dangerous targets require deliberate operator selection. A written procedure with no successful rehearsal is an unresolved launch blocker.

## Operating runbooks and ownership

Every runbook names trigger, diagnostic signals, safe action, escalation/contact, success verification and rollback/retry. Log request/operation IDs, error categories and durations; exclude note/reflection bodies, access tokens, signed URLs and raw bundles. Analytics/session replay remain off.

| Runbook artifact | Trigger and required action |
| --- | --- |
| `docs/runbooks/saves.md` | Save/conflict/rate-limit increase: check provider status and RPC categories, preserve drafts, retry same mutation or offer conflict recovery; never ask for private note text in logs |
| `docs/runbooks/auth.md` | Provider/callback failures: validate exact origins/project and sanitized callback errors; test affected provider from staging |
| `docs/runbooks/publication.md` | Stuck operation: inspect hash/state/lease/fence, retry same ID or cancel only before publication; never overwrite retained assets |
| `docs/runbooks/quota.md` | Allowance 70% alert, 80% investigation: classify database/object/egress/function usage, clean only eligible temporary data, get owner choice for paid upgrade |
| `docs/runbooks/secrets.md` | Exposure: revoke/rotate, update protected configuration, redeploy and inspect authorization/audit impact; do not print replacement values |
| `docs/runbooks/deletion.md` | Pending cleanup/ledger write: keep account denied, resume trusted stage, reconcile owner reassignment and verify stale-token denial |
| `docs/runbooks/outage.md` | Provider outage: accurate unavailable/unsaved UI, draft preservation, provider status checks, resume with revision checks |
| `docs/runbooks/release.md` | App/content incident: identify release/schema/content versions and select tested compatible rollback; preserve evidence |
| `docs/runbooks/backup-restore.md` | Missed/failed backup or disaster: assess actual last recovery point, alert owner, execute isolated validation/full restoration and ledger replay |

Monitoring is configured only with real owner contact and explicit notification preferences. Record job failures and stale backups; avoid claiming any check exists until deployed and tested. Owner publishing/bootstrap/reassignment instructions belong in `docs/owner-guide.md`. Privacy documentation states actual regions/providers, local draft behavior, export/deletion and retention; no unsupported legal certification claims.

## Acceptance traceability and release dossier

Maintain a machine-readable `docs/verification/traceability.json` with requirement ID, source document/heading, package, test IDs, evidence path, actual outcome, commit and unresolved defect. Use stable categories below; split cases into individual test IDs without collapsing unrelated claims into one green result.

| Requirement family | Packages | Minimum proof |
| --- | --- | --- |
| CONTENT: complete public course | D03,D04,D08,D14 | 30 unique lessons, all references/blocks, resolved links, clean first-milestone setup and exact download inventory |
| UI: coherent mobile study | D09,D11,D14,D15,D19 | Lessons 1/11/22, both themes, 320/390/768/1024/1440, portrait/landscape, zoom, drawers, long code and real-phone keyboard |
| AUTH: identities and return flow | D06,D10,D17 | Both staging providers, cancellation/expiry, same-origin return, owner bootstrap, fresh-auth deletion |
| PRIVACY: direct access denial | D06,D07,D12,D17 | Anonymous/A/B/owner/deleting users across DB/API/Storage; unchanged forbidden target rows and no client secrets |
| SAVE: durable study work | D07,D11 | Lost-response retries, absent-row races, dirty newer edits, conflict recovery, account isolation and second-device resume |
| VERSION: safe publication | D12,D13 | Malformed/maximum uploads, lease expiry, concurrent publish, rollback, retained readers, private preview and second generic course |
| TRANSFER: reversible personal backups | D16 | All-field Unicode/false/empty round-trip, bounded validation, selected replace, preference revision conflicts, no partial application |
| DELETE: retryable non-resurrection | D17,D18 | Cleanup failure/retry, sole-owner block, stale tokens and restore-ledger replay |
| VISUAL-MODEL: teaching correctness | D15 | Boundary/fractional/concurrency pure-model traces, real controls, accessible event tables and reduced motion |
| OPS: measured readiness | D18–D20 | Scheduled encrypted backup, complete restore, runtime/load/bundle evidence, security headers, protected release and production smoke |

The release dossier at `docs/verification/<release>/` contains `summary.md`, `environment.md`, `coverage/`, `test-results/`, `screenshots/`, `performance.md`, `restore.md`, `provider-flows.md`, `release.md` and `known-limitations.md`. Use synthetic identities and scrub screenshots/traces. Each result distinguishes pass, fail, blocked and not run. A screenshot is not evidence of persistence, and a test name is not evidence of execution.

Block public launch for broken first-milestone setup, missing required teaching content/downloads, failed login, private-data exposure, lost text, corrupt publication, wrong demo arithmetic, unreadable mobile tasks, fake grading claims or untested full recovery. Real-device behavior not exercised must remain explicitly unverified. Minor isolated cosmetic defects may be recorded separately; widespread visual defects violate scope. Re-run affected journeys after fixes, broaden only for shared changes or unresolved risks.

## Deferred inputs and decision timing

These inputs do not block writing executable schemas, local code, content adaptation or the visual slice. Request them when their dependency becomes relevant. Never solicit secrets in chat prose; use protected provider/environment configuration.

| Input | Current planning position | Needed before | Owner/action |
| --- | --- | --- | --- |
| GitHub repository/access | Private application repository proposed | Hosted CI/integration | Owner supplies destination and access |
| Vercel/Supabase projects | Separate staging/production, free-tier-first | Hosted deployment | Verify entitlements and actual project IDs |
| OAuth clients and callbacks | Google/GitHub, separate hosted environments | Real provider tests | Owner configures protected provider settings |
| Owner account UUID | Explicit trusted assignment, never first signup | Owner workflow acceptance | Sign in then bootstrap verified UUID |
| Commercial eligibility | Non-commercial pilot assumption | Hosting plan/public launch | Owner confirms use; recheck current terms |
| Region/residency | North American pilot assumption | Database provisioning | Confirm actual audience/requirements |
| Support destination | No invented address | Public issue-report/privacy page | Owner supplies real controlled route |
| Domain | Optional provider domain first | Custom-domain setup only | Owner choice; no purchase implied |
| Backup destination/scheduler/key recovery | Daily encrypted off-provider target | Real learner release | Owner selects operable mechanism and custodian |
| Operational owner/alerts | Project owner unless delegated | Pilot operations | Record contact and notification preferences |
| Real phone/browser access | At least one phone and desktop | Full mobile acceptance | Record devices and observed keyboard behavior |
| Distribution rights | Independently authored replacements | Starter publication | Confirm ownership/licence of shipped files |
| Required human reviewers | No approvals recorded by this specification | Governance promotion gates | Identify actual reviewers; no assumed approvals |
| Paid changes | None authorized by these files | Any purchase/upgrade | Present concrete cost/need for owner choice |

If an input remains unavailable, complete independent packages and report precisely which staging/release evidence is blocked. Do not claim a deployment URL, successful restore or real provider authentication from local mocks.

## Final handoff

Deliver the separate application source repository and tested commit; functioning deployed URL when access permits; runtime/setup guide and secret-free environment template; migrations/RPCs/policies/generated types; canonical executable schemas; full public course, starter and adaptation/visual maps; sample owner bundle; owner guide; actual CI/browser/provider/security/coverage/performance evidence; backup and deletion-ledger recovery tooling with rehearsal evidence; release/rollback runbooks; and an honest list of gaps.

The final report identifies what works, what was actually tested, operational ownership, current backup age/commitments, deferred inputs and any unresolved launch blockers. Preserve the original course sources. Record scope/contract changes in the relevant maintained specifications and ADRs, and regenerate the combined product plan when its numbered sources change. Planning completion alone is never application completion.
