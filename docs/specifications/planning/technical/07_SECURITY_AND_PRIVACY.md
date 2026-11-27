# 07 — Security, identity and privacy

## Threat model

| Threat | Control | Required proof |
| --- | --- | --- |
| Learner A guesses B's IDs | RLS, auth-derived ownership, composite FKs, revoked direct writes | Direct REST/RPC/Storage denial tests |
| Role escalation | Trusted singleton owner table; no profile/import role fields | Edited metadata and crafted requests cannot publish |
| Malicious Markdown or code sample | AST allowlist, no raw HTML/MDX, safe URL handling, escaped code | XSS payload suite in renderer and upload validator |
| ZIP bomb/path traversal | Streamed limits, normalized paths, signature checks, no code execution | Adversarial archive fixtures |
| Client bypasses autosave limits | Database revision/quota checks and named RPCs | Direct calls cannot overwrite or flood without limits |
| Stolen browser session | XSS prevention, no token logging, short sensible token lifetime, sign-out | Credential scanning and sensitive-operation session checks |
| Old token after deletion | Account tombstone plus active-user checks, auth deletion and cascading records | Old token cannot read/recreate private rows |
| Draft leaks through cache/assets | Private buckets, version policies, separate cache keys | Anonymous/non-owner requests denied |
| Supply-chain compromise | Lockfiles, reviewed updates, least CI permissions, secret scan | CI evidence and bundle inspection |
| Quota/cost abuse | Per-user limits, bounded uploads, platform protections, usage alerts | Oversized/rate-limit tests and operator runbook |

## Authentication

Supabase Auth handles Google/GitHub OAuth. Use PKCE, exact application callback origins, validated local return paths, provider cancellation/error UI and automatic SDK refresh handling. A return path must begin with a single `/`, resolve to the configured application origin and reject protocol-relative URLs or encoded tricks. Do not accept a caller-provided absolute redirect destination.

Keep provider tokens out of application data. Request only basic identity scopes; GitHub repository access is unnecessary. Optional display name/avatar can be missing. Avoid loading third-party avatar URLs by default; use initials so provider profile data cannot inject arbitrary image requests.

Supabase may automatically link identities according to its verified-identity rules. BuildTrail must not implement its own email-based merge. Test Google/GitHub combinations and document observed behavior. Manual provider linking UI is deferred unless separately implemented and tested. [Supabase identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking)

For server API requests, verify bearer tokens with Supabase's trusted server authentication method, then check current profile state and operational role. Never trust the browser's `getSession()` result as server verification. Administrative helpers use server credentials only after authentication. Ordinary learner operations derive UID inside SQL.

## Account deletion protocol

1. Offer export and describe permanent deletion of study data. Block the sole owner's deletion until trusted reassignment.
2. Create a one-use challenge bound to user ID, existing session and server creation time; expire after ten minutes.
3. Perform fresh provider authentication. Verify returned UID is the same and a new active Supabase session was established after challenge creation. Do not use refreshed JWT `iat` as proof of fresh sign-in. Test provider reauthentication/account-selection parameters; explain that provider SSO may authenticate without prompting for a password.
4. In one database transaction recheck sole-owner restriction, create a deletion job and set profile state to deleting. All private policies/RPCs immediately deny that account. Record only the minimum operational user/session identifiers.
5. Await cleanup of personal-transfer Storage objects and owned upload objects; never delete published course assets as part of learner deletion. A role reassignment must also transfer/resolve draft operational ownership.
6. Delete the Auth user with trusted administration; ordinary learner rows cascade. Complete the job and clear browser caches/drafts/session. Retry from the recorded stage if any step fails.
7. Expire completed deletion-job details after 30 days. A trusted operator can resume pending jobs; the deleted user need not retain a valid session for cleanup to finish.

A pending job is not falsely reported complete. The UI reports accepted/in progress until confirmation; interrupted jobs are surfaced in operational checks. Backups may retain deleted data until their retention expires. Restoration must reapply a separately preserved deletion ledger before restoring service, preventing account resurrection. Restrict and expire that ledger consistently with backup retention.

Supabase sessions can outlive a particular access token; sensitive operations should verify session existence as well as user identity. [Session behavior](https://supabase.com/docs/guides/auth/sessions)

## Browser and transport security

All hosted traffic uses HTTPS. Production CSP starts with `default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`; explicitly allow the project Supabase HTTPS origin in connect/image directives as needed and Blob URLs only for validated asset rendering. No arbitrary wildcard sources, `unsafe-eval` or uploaded scripts. OAuth redirect navigation is not an iframe requirement. Test CSP with the actual production build; inline style attributes required by a UI library need narrow documented treatment rather than silently disabling the policy. Add nosniff, restrictive referrer policy and permissions policy. Keep secrets out of source maps and logs; public source maps should be intentionally enabled or disabled.

API calls use explicit bearer headers, not ambient auth cookies. Reject unexpected origins and content types on mutation endpoints; CORS is not an authorization control. If switching to cookie sessions later, add an explicit CSRF design first.

## Quotas and abuse

Starting product limits, tunable after measurement:

- Text field: 50,000 code points and 200,000 UTF-8 bytes, enforced in browser and database.
- Persisted study records: 10,000/user and enrollments: 1,000/user for the bounded pilot; reject additional creations without discarding existing work. Exact counting and complete transfer behavior are defined in the [data/API contract](../../IMPLEMENTATION_DATA_AND_API.md).
- Aggregate learner text: 10 MiB; show usage and export/delete guidance. Compute deltas transactionally under a per-user quota lock; imports use the same accounting. Lock order: user quota row, then enrollment rows in course-ID order, then records.
- Study mutations: 120/minute/user, burst allowance sufficient for importing normal UI state; imports use separate limits, not thousands of browser calls. Return Retry-After without discarding drafts.
- Import/export jobs: five/hour/user, at most one active import; delete challenges five/hour/user.
- Owner uploads: one nonterminal operation, ten created/day by default.

Implement authoritative counters atomically in Postgres, with expiring rows and cleanup. Avoid process-memory counters in serverless functions. Rate-limit creation attempts, not just successful responses. Invalid inputs still consume an appropriate request budget. Provider/edge controls address gross request floods before expensive work; app counters are not DDoS protection. Monitor storage, database size, bandwidth and authentication usage. No Redis service is required for this pilot.

## Privacy and observability

Collect only auth identity, optional display name, study records and operational metadata needed to run the app. Analytics/session replay are off. No note bodies, reflection text, raw bundles, bearer tokens or signed links in logs. Request IDs, action names, durations, error codes and version IDs are enough for most diagnostics. Avoid persistent user identifiers in general logs; restricted audit records may identify the actor where needed.

Publish a plain-language data page with actual providers, region, local-draft behavior, export/deletion, backup retention and contact. Do not claim legal certification or full anonymity. Resolve region/residency requirements before provisioning; default planning assumes a North American pilot with no special residency mandate. Personal downloads are sensitive files; explain this at export without blocking ordinary study.
