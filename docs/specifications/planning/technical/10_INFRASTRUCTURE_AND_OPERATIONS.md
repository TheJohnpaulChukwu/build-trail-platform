# 10 — Infrastructure, deployment, cost and recovery

## Environments

| Environment | Web/API | Data/auth/storage | Allowed data |
| --- | --- | --- | --- |
| Local | Vite plus local API emulator/adapter | Supabase CLI/Docker | Synthetic fixtures |
| Pull request preview | Vercel preview, public/synthetic UI | No production credentials; auth disabled unless explicitly using stable staging flow | Synthetic only |
| Stable staging | Fixed Vercel origin | Dedicated hosted Supabase project and OAuth config | Test users/content |
| Production | Vercel production origin | Separate hosted Supabase project and OAuth config | Real study records |

Propose one North American Supabase region and a nearby supported Vercel function region. Confirm actual audience/residency before creating projects; moving a database region later is operational work. Static delivery can remain global. Avoid a cross-region backend round trip without a reason.

Use two hosted projects only if the current free account entitlement permits both; verify before provisioning. If it does not, resolve staging budget/setup explicitly rather than testing against production. Free tiers are the initial target, not a promise that every reliability requirement is free.

## Configuration contract

Browser-safe: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_APP_ENV`, `VITE_APP_ORIGIN`, `VITE_SUPPORT_URL`. Server-only: administrative Supabase credential, project URL, allowed origin, environment ID and configured limits. Exact admin key type follows current project configuration; never prefix it with `VITE_`. OAuth client secrets are configured in Supabase/provider settings, not frontend environment variables. DB migration credentials belong only in protected CI/operator configuration.

Validate config at startup and before release. Refuse production writes when expected project/environment IDs disagree. Preview builds must not inherit production service credentials. `.env.example` documents names and purpose without actual values. Keep local secrets ignored by Git and out of build logs.

## Vercel deployment contract

Vercel project root: the `build-trail-platform` repository root (`.`), not an `app/` subdirectory. Build with `npm ci` then `npm run build`; static output `dist/`. Deploy `api/v1` Node functions alongside static assets. Production routes must resolve assets and `/api/*` before SPA fallback. Missing API paths return API 404, never HTML. Direct course links, auth callback and static asset cache headers are tested on a real deployment.

Use explicit per-function duration and selected runtime settings after the largest-input spike. Course archives upload directly to Storage. Ordinary API metadata bodies cap at 64 KiB; larger personal transfers also use Storage. The design avoids reliance on Vercel's optional large-body beta. [Function limits](https://vercel.com/docs/functions/limitations) currently distinguish a default 4.5 MB request limit from a conditional larger-body option; recheck at deployment. No response-before-completion background work.

Hashed application assets can use long immutable caching. HTML should revalidate. Private responses are no-store. Public course-version caches include version ID and publication access state; do not cache owner draft responses publicly. Withdrawal cannot revoke files already downloaded or unexpired signed links.

## Delivery pipeline

1. Pull request: all applicable CI checks and preview using synthetic data; no production credentials on untrusted fork code.
2. Merge candidate: record commit/toolchain and inspect migration diff. Create backup before production schema changes.
3. Apply backwards-compatible migrations to staging; deploy candidate; run provider, two-user, content/publication and mobile checks.
4. Review evidence and unresolved launch blockers; provision only already agreed services/plans.
5. Apply compatible migrations to production using trusted operator/protected workflow, deploy same tested artifact/commit and verify configuration.
6. Run public catalogue/deep-link/download checks, both login providers and one disposable save/resume test. Record release and recovery action.
7. Observe error/latency/quota signals during a small pilot, fix observed failures before wider discovery.

Use minimal GitHub Actions permissions, pin third-party actions to reviewed commit SHAs, separate environment secrets and avoid privileged pull-request execution of untrusted code. Vercel preview deployment alone does not constitute release verification.

## Backup and restoration

Proposed target: encrypted daily database backup plus all immutable asset objects, with 7 daily and 4 weekly retained recovery points. Retention is a recommendation the owner must fund/operate; not an existing backup job. Keep a manifest of database snapshot time, asset paths/hashes, schema version and release commit. Original published bundles are preserved off the hosting provider. Staging data is disposable; production backup access is restricted to the owner.

Supabase database backups do not include Storage object bytes. Free-tier projects should arrange their own exports; paid backup features have plan-specific retention. [Supabase backup documentation](https://supabase.com/docs/guides/platform/backups)

Before launch choose a dependable off-provider encrypted destination and scheduler. A powered-off laptop cannot meet a daily backup target. A private scheduled CI job may be evaluated, but scheduling delays and artifact retention/access must be accounted for; do not claim it is a guaranteed scheduler. Document the chosen mechanism, key recovery and the last successful backup. No backup automation is configured by this planning task.

Restore rehearsal: create isolated staging target; restore schema, roles/policies and required Auth records through the supported procedure; restore Storage objects and verify hashes; apply deletion ledger; configure staging OAuth; test sign-in identity mapping, notes, publication, downloads and export. Logical database dumps do not by themselves prove restoration of managed Auth/Storage behavior. Record any provider-specific gaps before promising recovery. Measure elapsed time against the one-working-day target.

Database/app rollback differs from content rollback. Prefer rolling back to the prior app deployment with compatible schema. If a migration destroys compatibility, use the tested restore/forward-fix procedure and account for data written after the snapshot. Never “roll back” by dropping live tables casually.

## Cost controls and upgrade triggers

Owner chose free tiers and about 100 active learners. Check current [Vercel Hobby eligibility](https://vercel.com/docs/plans/hobby) and [Supabase pricing/limits](https://supabase.com/pricing) before launch. No exact monthly bill is promised. Domain registration is optional and separate. Commercial use or monetization may require a different Vercel plan even at low traffic.

Record actual database, Storage, egress, function and auth allowances from selected accounts in the deployment baseline. Set alerts where supported at 70% of allowance, investigate at 80%, and take an explicit action before exhaustion. Paid upgrades require owner choice; do not silently purchase or remove required features.

Upgrade/reconsider when inactivity pauses are unacceptable, the recovery target cannot be met, sustained latency exceeds targets after query fixes, usage approaches plan limits, terms require a commercial plan, or validation exceeds safe runtime headroom. First optimize bounded reads, indexes, caching and payloads. Do not add Redis/microservices merely because signups increase.

## Operating runbooks

- Save errors: check provider status, request IDs and RPC errors; preserve user drafts, never request their private note text in logs.
- OAuth failure: inspect origin/provider callback configuration and sanitized error; do not log tokens/query codes.
- Publish stuck: inspect operation lease/hash/state, retry with same ID or cancel safely; never overwrite active assets.
- Quota pressure: inspect category usage, remove eligible temporary objects, plan upgrade; never delete learner notes or retained versions automatically.
- Secret exposure: revoke/rotate affected credentials, redeploy, review logs and grants, document impact.
- Account deletion pending: inspect job stage and resume trusted cleanup; active-user denial stays in place.
- Provider outage: public cached shell may load but cloud content/saves can fail; show accurate status and local draft recovery.

Use sanitized Vercel/Supabase logs initially; no external analytics/session replay. A small scheduled health check may be configured during implementation, with explicit owner notification preferences. It is not running now. Operational ownership, backup destination and support contact are deployment inputs in [decision register](12_DECISIONS_AND_SOURCES.md).
