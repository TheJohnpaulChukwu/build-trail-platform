# BuildTrail Handoff Review

Reviewed on 2026 November 26. This is a review of the specification and source course, not an audit of a built application. The fixes below are incorporated into WEB_APP_BUILD_PLAN.md; Codex must implement and verify them.

## Verdict

The architecture and learning experience are suitable for handoff after this revision. No stack redesign is needed. The original plan understated the work required to turn a personal study course into a public multi-user product. The revised plan makes that work explicit and preserves the agreed first-release scope.

The highest-priority discovery was a public-course blocker: preparation and lesson 7 require files from the owner's computer that are absent from the distributable starter. Public release must not proceed until the independent public starter and lesson adaptation are ready.

## Findings and incorporated fixes

| Priority | Finding | Change to the handoff |
| --- | --- | --- |
| P1 | Required setup depends on private local paths and an external starter | Add a portable public edition, original HTTP harness and fixtures, with a clean-machine first-milestone walkthrough |
| P1 | Exact source preservation conflicts with public adaptations | Preserve originals; maintain an explicit transformation map for the public edition |
| P1 | Source-relative Markdown links can break in the app | Map source paths to routes/assets and validate every internal destination |
| P1 | A course publish can mix old navigation with new lesson content | Resolve and pin one immutable course version per study session; switch coherently |
| P1 | Checklist answers and resume anchors can drift after edits | Add stable item, prompt and section IDs, plus explicit completion/version semantics |
| P1 | A revision field alone does not prevent note loss | Require atomic revision-conditioned saves and recoverable conflict UI |
| P1 | Backup merge/replace was undefined | Define scope, validation, conflict choices, ownership and transactional application |
| P1 | Owner upload was a feature promise without a concrete contract | Specify bundle format, size limits, private staging, validation runtime, publication retries and rollback |
| P1 | Sign-in and owner setup were unresolved | User selected Google and GitHub; use trusted explicit owner assignment rather than first-signup ownership |
| P2 | Public learners lack the context from this conversation | Add course overview/setup, supported platform guidance, test-coverage labels and just-in-time tooling explanations |
| P2 | Mobile checks could pass using only short lessons | Include lesson 22, long code/reflections and interrupted-save stress cases |
| P2 | Database backups do not cover all published assets | Require database-plus-asset recovery documentation and staging restoration rehearsal |
| P2 | Account deletion and expired sessions could leave inconsistent access | Specify retryable cleanup, stale-session tests and draft recovery |
| P2 | No simple course-feedback route was defined | Add a contextual Report a lesson issue link without building a community product |
| P2 | Multi-course support could remain hardcoded to the first course | Upload a tiny internal second course through the actual owner workflow |
| P2 | Quick deployment could be confused with readiness | Separate visual checkpoint, invited pilot and public-launch acceptance |

## Important scope distinctions

- A public starter and clear instructions are required; a browser IDE and automatic grader remain deferred.
- All 30 lessons remain in scope. The two-lesson visual slice is a design checkpoint, not the entire deliverable.
- Owner upload and versioned publication remain in scope. A visual course editor and arbitrary executable plugins do not.
- Mobile supports complete study, reflection and interactive explanations. Project coding remains in the learner's editor and terminal.
- Recorded completion is self-reported. Nothing in the interface should imply verified implementation results.
- Cloud-saved data is distinct from a pending local draft. Full offline synchronisation remains deferred.

## Owner details needed during setup

The product decisions are sufficient to start implementation. Deployment will still need the owner's GitHub repository and service projects, the authenticated user ID to assign as owner, configured Google/GitHub provider credentials, a real support/contact destination, and a decision on any paid plan. A custom domain is optional; BuildTrail's name/domain availability has not been checked. These are setup inputs, not reasons to delay content preparation or the UI work.

## Review evidence and limits

The review covered the full plan, course preparation, the first-milestone starter and representative lessons including 1, 7 and 22. Two independent review agents examined learning/mobile/public-content issues and platform/data/publication issues. Official provider documentation was consulted for upload request limits, database versus Storage backups and account deletion behaviour.

- [Vercel function limits](https://vercel.com/docs/functions/limitations)
- [Supabase backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase user management](https://supabase.com/docs/guides/auth/managing-user-data)

No application, account integration, public course adaptation or deployment was implemented during this review. The specification now contains explicit acceptance checks for that work. Passing a document review is not evidence that the eventual app passes those checks.
