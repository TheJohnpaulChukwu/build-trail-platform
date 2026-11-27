# 11 — Implementation work packages

This is a sequence of reviewable engineering outcomes, not a time estimate or an instruction to start implementation during planning. All product scope remains required. Independent tasks may run in parallel only after shared contracts are settled and when agent delegation is authorized.

| ID | Deliverable | Depends on | Exit evidence |
| --- | --- | --- | --- |
| T00 | Bootstrap repository and freeze dependency baseline | None | Clean install/typecheck/build, runtime matrix, config validation, no secrets |
| T01 | Executable content/backup schemas and public starter | T00 | Valid two-course fixtures, adaptation map, clean first-milestone walkthrough |
| T02 | SQL schema, roles, RPC foundation and generated types | T00; stable IDs from T01 | Fresh/upgrade migrations, direct-access denial tests, CAS/idempotency proofs |
| T03 | Read-only study shell and two-lesson visual slice | T01 | Real lessons 1/11 and stress case 22 on desktop/phone, both themes |
| T04 | Safe content pipeline and owner validation | T01,T02 | Malicious archive suite, bounded-runtime measurements, private draft preview |
| T05 | Auth and saved-work system | T02,T03 | Both providers in staging, two-user isolation, note race/recovery tests |
| T06 | Complete course/visual/search experience | T03,T04 | All30 lessons/references, coverage map, three correct demos, search anchors |
| T07 | Publication, rollback and course consistency | T04,T05 | Concurrent publish/timeout/fencing tests, second-course upload, no mixed snapshots |
| T08 | Export/import, settings and account deletion | T02,T05 | Round-trip, import race, scoped replace, deletion retry/stale-token evidence |
| T09 | Operations and hardening | T04–T08 | Backup restore, load/security/accessibility checks, budget/config runbooks |
| T10 | Pilot and release | T06–T09 | Real study sessions, resolved blockers, deployed smoke evidence and handoff |

## T00 — Engineering baseline

Create `/home/jchukwu/Documents/code/build-trail-platform/` as the single application repository; preserve the separate `/home/jchukwu/Documents/code/BuildTrail/` planning and original-course folder. Read parent product requirements and this technical set first. Verify package/runtime compatibility, licences and hosting support before locking versions. Supply `.env.example`, setup guide, lint/typecheck/test/build commands and a documented local API development workflow. Local email/password test accounts may be created by test setup even though the production UI only exposes Google/GitHub; do not accidentally ship test authentication controls.

## T01 — Content before platform assumptions

Produce executable Zod schemas, valid JSON samples, stable ID registry, adaptation report and original portable starter/harness. The first milestone must work in a clean directory. A temporary reviewer solution may validate exercises but must stay out of student bundles. Confirm all 30 lesson mappings and prerequisite/tool explanations; document later learner-authored tests honestly.

## T02 — Database contracts before scattered UI writes

Implement ordered migrations and a transaction/policy test suite. Prove absent-row CAS, same-mutation retry, user quota accounting, lock ordering, item/course constraints and direct-table write denial. Add a minimal client adapter returning typed errors. Freeze the wire schemas before parallel feature work; generate database types rather than inventing separate handwritten row types.

## T03 — Visual checkpoint

Build a functioning read-only shell with real content and local demo state. Show its phone/desktop views, code overflow, hint, study panel and error states. Incorporate concrete usability feedback before copying layout everywhere. This checkpoint does not authorize dropping remaining features or substitute mock persistence for T05.

## T04/T07 — Publishing as a durable workflow

Deliver direct Storage upload, operation leases/fencing, schema/asset validation, draft rendering, publication transaction and rollback. Run largest allowed input and adversarial cases early, before building a polished owner dashboard around unsafe assumptions. If the runtime budget fails, document the revised limits or worker decision and reconcile parent specs.

## T05/T08 — Private data reliability

Implement auth callback and session lifecycle, account-scoped queries/drafts, authoritative saves, all progress fields, resume and settings. Then add bounded export/import with preview revisions and account deletion with fresh-session challenge. Tests must exercise real database permissions, not only mocked APIs. Never mark notes Saved from a local write alone.

## T06 — Complete learning experience

Import all required teaching blocks and references. Add the full visual map and three richer demos. Test search for material in early and late lessons, stable links, diagram alternatives and mobile long-form reading. Complete setup/download instructions and report-issue routing. No invented second public course: second fixture remains internal.

## T09/T10 — Evidence and handoff

Supply actual evidence, runbooks, release commit, schema/content versions and known limitations. Launch a small pilot, observe study friction and fix blockers before broader access. An account being able to sign in once is not proof of cross-device saving, privacy or recovery. Deployment must use the chosen accounts, callback origins, region and operational contact; missing inputs should not prevent independent local work.

## Required implementation artifacts

- Source, lockfile, pinned runtime, environment template and reproducible setup commands.
- SQL migrations, policies/RPCs, generated types and authoritative schema definitions.
- Public course bundle, original starter, adaptation/visual coverage reports and valid sample bundle.
- Domain/database/browser test suites with real outcomes, screenshots and measured performance.
- Owner publishing guide, account/bootstrap recovery, backups/restore, rollout/rollback and cost checklist.
- `BUILD_LOG.md` at the platform repository root plus meaningful chat updates; no private data in either.

## Contract change procedure

When implementation exposes a flaw, record the problem and proposed replacement, update the relevant technical file and affected parent specification, then regenerate the parent combined plan. Keep a short ADR for architectural changes. Do not silently change public behavior to make an implementation easier. Routine internal naming/refactoring does not need user permission; changes to scope, paid services or learner experience should be explained concretely.
