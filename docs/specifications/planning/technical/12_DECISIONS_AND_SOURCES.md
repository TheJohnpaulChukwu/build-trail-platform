# 12 — Decisions, unresolved inputs and sources

## Confirmed by owner

- BuildTrail is an online multi-course learning platform; first course is Python rate limiting.
- Excellent mobile study UX, understandable visuals and progressive exercises are central.
- Google and GitHub sign-in; private cross-device notes/progress; owner course upload.
- Free tiers first, with documented paid upgrade triggers.
- Initial audience about 100 active learners; this is not a concurrency claim.
- Alternative stacks may be considered; recommendation keeps React/Vite, Vercel and Supabase.
- This task creates technical specifications, not an application or deployed services.

- Single code repository: `/home/jchukwu/Documents/code/build-trail-platform/`, separate from the existing `BuildTrail/` planning folder. Code, publishable courses and related engineering docs belong together in this repository.

## Engineering decisions made in this specification

| Decision | Why | Revisit when |
| --- | --- | --- |
| Client-rendered React/Vite | Interactive study workspace, simple hosting | SEO/server-rendered public content becomes central |
| Modular TypeScript app | One language across browser/server and shared schemas | A concrete workload needs another runtime |
| Supabase relational backend | Versioning, learner records and transactional workflows | Measured cost/limits or portability requirements demand migration |
| RLS reads, named transactional RPC writes | Prevent bypassing revisions/quotas/ownership | Measured performance or policy complexity warrants redesign |
| Private assets with authorized reads | Draft confidentiality and version access | Public asset delivery needs a separately designed CDN strategy |
| No Redis/queue initially | Small bounded load and infrequent publishing | Runtime spike fails or durable background jobs become necessary |
| Local coding | Avoid executing untrusted learner code | Hosted execution is separately scoped/funded |
| Stable identities + immutable versions | Preserve notes and consistent reading | Never casually weaken this invariant |

## Inputs still needed, at the point they become relevant

These do not block local specification or most implementation work. They must not be fabricated.

| Input | Proposed default | Needed before |
| --- | --- | --- |
| Repository destination/access | Private GitHub repository | Hosted CI/integration |
| Hosting accounts/project IDs | Owner's Vercel and separate Supabase staging/prod | Staging deployment |
| OAuth provider credentials | Separate staging/prod Google/GitHub configurations | Real provider tests |
| Owner user ID | Explicit authenticated UUID, trusted assignment | Owner publication |
| Intended commercial status | Non-commercial free pilot; no monetization specified | Vercel plan selection/public launch |
| Audience region/residency | North America; no special residency requirement assumed | Database provisioning |
| Support/contact and optional domain | Real owner-controlled contact; provider domain initially | Public release |
| Backup destination/scheduler/keys | Encrypted off-provider copies, daily target | Public release with real study records |
| Operational owner | Project owner unless delegated | Backup/recovery and alerts |
| Real-device availability | At least one phone and desktop | Final mobile acceptance |
| Source redistribution rights | BuildTrail-owned replacements; legacy optional | Public starter distribution |

Don't ask for secrets in chat prose or put them in Markdown. Use provider dashboards or protected local/environment configuration during setup. If the pilot's commercial use, residency or backup expectations differ from defaults, reconcile the design before provisioning.

## Known risks and design checks

1. RLS/definer mistakes can bypass privacy. Mitigation: direct adversarial API tests, explicit grants and function ownership review.
2. Free-tier pauses/quotas can interrupt study. Mitigation: truthful UX, local drafts, monitoring and explicit upgrade decisions.
3. Synchronous bundle processing may exceed limits. Mitigation: early largest-input spike, bounded bytes/time and lease fencing; no imaginary background continuation.
4. Client-rendered pages have SEO limitations. Accept for pilot; revisit if acquisition depends on indexed lesson text.
5. Course prose is written, but public portability and end-to-end exercises still need implementation validation.
6. Managed Auth/Storage restoration is more than copying ordinary tables. Rehearse and document before promising recovery.
7. Cross-device saves can race. Record-level CAS plus course workspace revision and shared lock ordering are mandatory.
8. Uploaded starter code is downloadable material, not executed by the platform. Its ownership and teaching quality still require review.

## Official technical references

Reviewed 26 November 2026. Provider pricing, supported runtimes and quotas are time-sensitive and must be rechecked at provisioning. Tool choices and numerical BuildTrail targets are our design decisions, not vendor guarantees.

| Reference | What it informs |
| --- | --- |
| [Vite guide](https://vite.dev/guide/) | Build tooling and runtime compatibility |
| [Node releases](https://nodejs.org/en/about/previous-releases) | Maintained runtime baseline |
| [React Router data mode](https://reactrouter.com/start/data/installation) | Client routing approach |
| [TanStack Query overview](https://tanstack.com/query/latest/docs/framework/react/overview) | Remote state handling |
| [Zod](https://zod.dev/) | Runtime schema validation |
| [Radix Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction) | Accessible interaction primitives |
| [react-markdown](https://github.com/remarkjs/react-markdown) | AST rendering and security considerations |
| [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) | Row-level authorization |
| [Supabase database functions](https://supabase.com/docs/guides/database/functions) | Invoker/definer privileges and search path |
| [PostgreSQL locking](https://www.postgresql.org/docs/current/explicit-locking.html) | Row locks and transaction coordination; use hosted PG-version equivalent at build time |
| [Supabase Storage access](https://supabase.com/docs/guides/storage/security/access-control) | Independent object policies |
| [Supabase sessions](https://supabase.com/docs/guides/auth/sessions) | Session lifecycle and sensitive-action checks |
| [Supabase identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking) | Provider linking behavior; no custom email merge |
| [Supabase backups](https://supabase.com/docs/guides/platform/backups) | Database versus Storage recovery |
| [Supabase pricing](https://supabase.com/pricing) | Current plan allowances and paid options |
| [Vercel function limits](https://vercel.com/docs/functions/limitations) | Body, memory and execution limits |
| [Vercel Hobby](https://vercel.com/docs/plans/hobby) | Plan eligibility and restrictions |
| [OWASP uploads](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) | File validation and processing threats |
| [Vitest](https://vitest.dev/guide/) | Unit/component test tooling |
| [Playwright](https://playwright.dev/docs/intro) | Browser verification tooling |

## Planning validation versus implementation evidence

This specification set can be checked for links, consistency, scope coverage and explicit unresolved decisions. Those checks do not prove that code, SQL policies, provider login, mobile behavior or backups work. Implementation must produce the evidence listed in [testing](09_TESTING_AND_QUALITY.md).
