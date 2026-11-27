# BuildTrail Accounts Data and Synchronisation

## Technical recommendation

The detailed [technical implementation specifications](technical/README.md) define the selected stack, database constraints, transactional APIs, security model, tests and deployment process. The owner has selected a free-tier-first pilot of about 100 active learners. The technical review retained React/Vite, Vercel and Supabase after considering alternatives. These decisions are specifications, not provisioned infrastructure.

Use React, TypeScript and Vite with CSS variables, a maintained Markdown renderer with GFM support, syntax highlighting and SVG simulations driven by pure functions. Deploy the web client to Vercel; use Supabase Auth, Postgres and Storage for accounts, learning records and versioned course assets. Configure SPA route rewrites so direct lesson links and page reloads work. Disable executable MDX and raw HTML for uploaded course content.

Store versioned Markdown bodies and normalized metadata in Postgres; store immutable versioned binary assets and downloads in Supabase Storage. Proposed data model: courses, course_versions, milestones, lessons, profiles, enrollments, lesson_progress, lesson_notes and user_preferences. Course content references stable course/version/lesson identifiers. Learner records carry user_id and course_id; progress uniqueness includes the learner, course and stable lesson ID. Use a revision field for note conflict detection. Preserve user answers when content versions change.

Enable and test row-level security for every exposed table. Authenticated users may only access their own learner records. Anonymous users may read published course content. Owner publishing permissions come from server-controlled roles, never editable profile metadata. Service-role credentials stay in trusted server functions and are never included in browser code. Define Storage access policies separately for private draft uploads and published downloadable assets.

Use the Supabase client with the publishable client key and enforced database policies for ordinary learner operations. Use Vercel Node.js server functions for privileged upload validation, owner publication, user-data import and account deletion; do not introduce a second function-hosting platform for the same responsibilities. Verify identity and server-controlled owner permission on every privileged request. Keep /api routes outside the SPA catch-all rewrite. Deletion must remove the account and associated learner records; export covers only the requesting learner's information. Restrict login redirects to explicitly configured local development, one stable staging URL and production origins; do not allow arbitrary wildcard preview callbacks. General preview builds can be viewed without production authentication, or use the deliberate staging flow.

Google and GitHub sign-in are confirmed for launch. Configure both through Supabase Auth. Do not implement email/password or magic-link authentication in this release. Recovery of the underlying Google/GitHub account is handled by that provider. Handle cancelled consent, callback errors, expired sessions and missing provider profile fields. Return the learner to the lesson they intended to open, using a validated same-origin return path. Never merge accounts solely on an unverified matching email; use supported identity-linking flows and document their behaviour.

The database is the primary record. Local storage may cache UI preferences or pending edits, with per-user separation and cleanup on sign-out. Do not leak one account's notes into another account's session on a shared device. Autosave uses revisions or equivalent optimistic concurrency; conflicting edits retain the draft and offer recovery. Full offline editing is deferred.

Keep downloadable personal-data export/import with schema validation, stable IDs, ownership derived from the authenticated session, and explicit merge/replace semantics. Never trust an imported user_id. Backups of the service database and individual user exports are different responsibilities; document both before launch.

Use local Supabase for automated tests/development and separate hosted staging and production projects for release checks. Do not require paid branching for the initial workflow. If service limits prevent staging, resolve the account setup before production validation rather than silently sharing live learner data. Use separate development/test and production data. Preview deployments must not accidentally modify production records. Supply migrations, an environment-variable example without secrets, a lockfile, supported Node versions and a clean setup guide. Bundle fonts and diagram assets rather than depending on reference sites.

Deployment sequence: prepare repository, configure Supabase schema and policies, configure sign-in and callbacks, connect Vercel, set environment variables, deploy a preview, test two-account isolation, then publish and verify production. A custom domain is optional. The owner supplies service accounts and completes any required account agreements or billing choices.

For a small pilot, free tiers may suffice within their limits. Vercel Hobby is restricted to personal non-commercial use; confirm plan eligibility for the intended launch. Supabase Free can pause after inactivity, and its paid tiers have usage-dependent costs. Recheck prices and limits at deployment, set available spend controls, and make paid subscriptions an explicit owner choice. Do not promise permanently free operation.

Technical references: https://vite.dev/guide/ ; https://supabase.com/docs/guides/auth ; https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/auth/auth-smtp ; https://vercel.com/docs/plans/hobby ; https://supabase.com/pricing

## Explicit learning and data contracts

Enrollment starts when a signed-in learner selects Start course or starts a lesson; guest browsing creates no private enrollment. Opening a signed-in lesson makes it in progress. Completion requires an explicit learner action, remains reversible, and is never labelled test-verified. Checklists and reflections support learning but do not secretly gate completion. Needs review is independent of completion. My Learning progress is completed required lessons divided by currently published required lessons. The reader uses its pinned version's required lesson set and labels that version; optional stretch tasks do not inflate the denominator.

Give checklist items, reflection prompts and resume sections stable IDs as well as lessons. Notes and reflections are distinct fields. Store completion time and the content version completed. A materially revised completed lesson can display Content updated while preserving its completion and notes. A newly added required lesson changes the current percentage; explain that change rather than silently resetting old work. Removed lessons retain personal notes in an archived-notes view and are excluded from the current denominator. Never recycle stable IDs for unrelated content.

Autosave after a short idle interval, coalesce outstanding changes per record, and enforce revision checks in the database operation. A stale update cannot overwrite a newer note. Show both copies on conflict and let the learner choose or combine them. Repeating a request must not create duplicate enrollments or records. Use per-item writes for checklist changes so checking one item on a phone does not erase another item changed on desktop.

Resuming selects the most recently active lesson and valid section using server-recorded activity times. Refresh saves when switching lessons, returning to an active tab or detecting a session change; live collaborative editing is not required. On session expiry, preserve an account-scoped local draft and allow the same user to recover it after sign-in. On explicit sign-out with pending drafts, offer save/retry or download before clearing the private cache. Do not expose retained drafts to a subsequently signed-in different account.

Personal-data exports include schema version, export time, stable course/lesson/item IDs and content-version references. Import previews counts and conflicts before any write. Merge adds absent values and requires a choice for conflicting existing notes rather than trusting file timestamps. Replace affects only the explicitly selected user's course records, after a pre-import export is offered. Missing/unknown lesson IDs remain recoverable archived records or appear as explicit validation issues; they are not discarded silently. Validate the entire bounded import before applying it transactionally through a trusted operation. Never accept user IDs or owner roles from the file.

## Identity and storage test matrix

Test each operation as visitor, learner A, learner B and owner. Include direct database/API attempts as well as UI actions. Cover select, insert, update and delete for private records, and draft access for content and Storage objects. Hidden UI controls are not evidence of authorization.

Model unique record identities explicitly: enrollment by user and course, progress by user/course/lesson, and prompt or checklist answers by stable item ID. Reject references to lessons that do not belong to the selected course. Foreign-key and access-policy decisions must agree.

## Save state machine

The UI distinguishes clean, edited, saving, saved, failed and conflict. New edits during an in-flight save remain dirty until their own revision succeeds. A late response to an older request must not falsely mark newer text saved.

Draft recovery is account-scoped. When connectivity returns, retry only against the revision last read; on conflict preserve both versions. A refresh or route change should not discard queued local drafts. Never depend on a network request sent during page unload as the only preservation mechanism.

## Provider acceptance

Verify Google and GitHub independently from a deployed staging origin. Test the intended return route, cancelled consent, callback errors, missing optional profile fields, sign-out and expired sessions. Use supported verified identity linking only if exposing that control. Do not automatically assume two separate provider logins are the same person.

Keep the operational owner role out of user-editable profile fields and personal-data import payloads.

