# BuildTrail Product and Build Plan

Generated from the maintained [section specifications](README.md). Edit the numbered files there, then run rebuild_master.py. This is a build handoff, not a completed application.

## Product and Scope

### Purpose and confirmed decisions

Build an online learning platform for multiple build-by-doing software projects, launching with the existing 30-lesson Python rate limiter course. The user wants the visual character of Designed to Scale and the lesson/task progression of CodeCrafters. This document is a handoff specification; no application has been built as part of planning.

Confirmed on 2026 November 26:

- Hosted online on Vercel, with Supabase authentication and database-backed progress that follows each learner across devices.
- Supports multiple courses with independent milestones, lessons and per-user progress. The rate limiter is the first published course, not the platform identity.
- Visitors can browse published courses; an account is required to save personal progress and notes.
- Python exercises are written and executed in the user's editor and terminal.
- First release includes all 30 lessons, progress, notes, search, and a few interactive algorithm demonstrations.
- Report meaningful progress in chat during development. A file log supplements those updates rather than replacing them.

The confirmed platform name is **BuildTrail**. Proposed tagline: **Understand software by building it.** The tagline remains editable. Use central branding configuration; names must not determine stable course IDs or stored progress. Domain availability has not been established.

UI/UX is a defining product requirement. BuildTrail must make it easy to study, understand, practise and return to a project. Mobile usability and visual teaching are first-release requirements, not a later polish phase. Feature completeness alone is insufficient for delivery.

### Inputs and boundaries

Course directory: `/home/jchukwu/Documents/code/BuildTrail/courses/rate-limiter-python`.

Read `COURSE.md`, `README.md`, all 30 files in `lessons/`, and `starter/`. Preserve the original files. Put application source in `/home/jchukwu/Documents/code/build-trail-platform/`. Do not modify the downloaded ShipThatCode repository or synced project sources.

Visual reference: https://designed-to-scale.vercel.app/#/

Learning structure reference: https://app.codecrafters.io/courses/redis/introduction

Use references as design inspiration. Create original UI components and diagrams; do not depend on their servers, account state, source code, or private lesson content. The first course uses the user's local teaching content. Future courses are owner-published content bundles; learners cannot publish courses in the first release.

### First release features

The first course must expose all five milestones and 30 lessons, preparation, shared rules, reference tables, debugging guide, original-fixture mapping, source references and starter files. The public course catalogue shows only published courses; My Learning shows each signed-in learner's started courses and individual progress.

Course search should cover lesson titles, teaching text, code text, and reference material, with short result excerpts and links to the relevant section. Use a course-scoped index for the first release and catalogue search across published course titles and summaries. Never include private learner notes in public search indexes. Support Ctrl/Cmd+K, Escape to close, and keyboard selection.

Per lesson store: not started/in progress/completed, checklist values, notes, reflection, optional self-reported test evidence, and a separate needs-review flag. Opening a lesson can make it in progress; completing it requires an explicit action. Let the user reverse completion. Keep navigation open rather than locking advanced lessons.

Remember the current lesson and section, expanded milestone groups, theme, reading size, and focus-mode preference. Autosave notes with a visible saving/saved/error state. Preserve pending note writes across internal navigation and confirm Saved only after the database acknowledges them. Show retryable failures. Scope every cache by user ID and clear private in-memory state on sign-out. Do not promise full offline synchronisation in this release.

Provide export and import of a versioned JSON backup containing progress, notes, reflections, and preferences. Validate imports before changing existing data, show what will change, and offer merge or replace. A malformed import must not erase existing work. Use a deliberate confirmation for reset actions.

Offer starter-file downloads and copyable terminal commands. A browser cannot silently open arbitrary local editor files or run terminal commands; present these as user actions, not fake Open/Run buttons.

### Product boundaries and user roles

| Role | Can do | Cannot do |
| --- | --- | --- |
| Visitor | Browse published courses, read lessons and use public demonstrations | Save cloud notes, access drafts or another learner's records |
| Learner | Start courses, save personal work, export/import their records, delete their account | Publish content or inspect other users' records |
| Owner | Use learner features and manage course drafts, validation and publication | Bypass privacy rules through ordinary learner screens |

Ownership is an operational role, not a paid account tier. The owner's role is assigned through trusted setup. Public learner registration never changes that role.

### Information architecture

Public entry is the course catalogue. Each course has a detail/setup view and a lesson workspace. My Learning lists started courses and Resume actions. Account settings hold preferences, export/import and deletion. Owner tools have a separate entry visible only to the owner, with server-side authorization on every action.

Example route shapes are /courses, /courses/:courseSlug, /courses/:courseSlug/lessons/:lessonSlug, /my-learning, /settings and /owner/courses. These are navigation names; stable database IDs remain independent of slugs. Preserve old links when a slug changes using a deliberate redirect mapping.

Do not create unsupported catalogue entries to make the platform appear populated. Launch with the genuine rate limiter course; the second validation course stays internal.

## Design and Mobile UX

### Reference observations and visual direction

Designed to Scale was inspected in light and dark themes, including the course navigation, lesson workspace, responsive navigation drawer, and rate limiting lesson. Observed characteristics include JetBrains Mono, warm surfaces, thin outlines, softly rounded cards, green active selections, pastel category accents, a persistent lesson tree, step controls, and explanatory side panels. Computed light-theme body colours were background `rgb(244,235,224)` and text `rgb(29,27,24)`; the observed main heading was 30px JetBrains Mono. These are reference observations, not a requirement to copy every dimension.

Proposed design:

- Light theme starts with warm ivory surfaces, near-black text, muted green selection, and restrained lavender, amber, and blue callouts.
- Dark theme uses warm charcoal, cream text, and subdued versions of the same accents.
- Self-host JetBrains Mono with its licence. Default reading text to at least 16px with generous line height; provide text-size controls. Offer an optional proportional reading font if long monospaced paragraphs feel tiring.
- Use soft outlines and small, consistent shadows. Keep decorative grids inside diagrams, where they serve the technical visual style.
- Do not introduce a marketing landing page, giant hero section, stock illustrations, or decorative dashboard metrics.
- Render clear focus states and adequate contrast in both themes. Never make colour the sole indicator of completion or rejection.

### The main study workspace

At wide desktop sizes use three regions:

1. Left: the selected course's milestones, expandable lesson lists, completion indicators, and course progress. The rate limiter has five milestones; other courses may differ.
2. Centre: the selected lesson, current study section, examples, code blocks, exercises, and relevant diagrams.
3. Right: a collapsible study panel with checklist, personal notes, and a place to record a blocker or explanation.

Global navigation contains Courses and My Learning, search, theme and account controls. Within a selected course, contextual navigation contains Learn, Playground and Reference. On mobile, use the course drawer and a compact context selector instead of crowding both navigation layers into the header. Include a clear Continue studying action that returns to the last lesson and section. Keep the default landing experience close to the work rather than making the user pass through a dashboard every time.

At medium widths collapse the right panel into a drawer. At narrow widths use a course-navigation drawer and a single reading column. Provide a focus mode that hides both side panels. Code and wide tables may scroll inside their own containers; the whole page should not overflow horizontally.

The responsive cutoffs should follow actual content fit, with starting targets around 1200px for all three columns and 900px for the navigation drawer. Verify on the user's actual desktop window as well as narrower sizes.

### Mobile study experience

Design the phone experience deliberately rather than shrinking the desktop workspace. The phone is a complete companion for reading, visual experiments, reflections, notes and progress; full project coding remains in the learner's editor and terminal.

- Use one primary reading column, with a compact header identifying the current course and lesson.
- Provide a labelled navigator for Understand, Build, Verify and Reflect. Gestures may supplement visible controls but must not be the only way to navigate.
- Preserve the section, reading position and unsaved text when opening drawers or changing orientation. Across devices, resume at a stable section or content anchor rather than a pixel offset.
- Keep Previous/Next actions reachable and respect device safe areas. They must not obscure text, focused inputs or the on-screen keyboard. While editing notes, prioritise the editor and save status.
- Present course navigation and notes as separate accessible drawers or sheets with clear close controls, correct focus handling and minimal nested scrolling.
- Use a product target of at least 44 by 44 CSS pixels for primary touch targets, with adequate spacing. Never require hover for hints or essential explanations.
- Keep default body text at least 16px, permit text scaling and avoid long lines. Do not shrink text to force a desktop diagram onto a phone.
- Reflow diagrams vertically or into readable steps. Retain a text/event-table alternative and offer an expanded view for dense diagrams.
- Give code blocks a labelled Copy control and optional soft wrapping while preserving indentation. Keep unavoidable horizontal scrolling inside code or table containers. The page itself must not overflow horizontally.
- Offer command copying, starter downloads and a saved next-action note for later desktop coding. Do not imply the app executes Python on the phone or automatically opens a desktop editor.
- Make sign-in, search, exports, account controls and saving feedback usable by touch. Owner uploads also need a functional narrow layout, although long-form course authoring is expected to be easier on desktop.

### Study experience quality standards

Every screen should answer: where am I, what should I do next, and is my work saved?

Keep a clear primary action for the current task. Use consistent typography, spacing, colours, callouts and component behaviour across courses. Retain full-lesson reading and focus mode so learners can compare explanations with acceptance criteria without repeatedly switching views.

Connect each concept to a concrete problem, example, state change and coding task. Put diagrams next to the explanation they support. Reveal hints progressively without hiding essential prerequisites. Animate to explain causality or sequence, with pause, reset and reduced-motion alternatives.

Returning learners should reach their last lesson with one Continue action. Search results open the relevant section. Navigation retains notes and checklist state. Save failures preserve the draft and offer retry. Avoid streak pressure, confetti, fake grading, unnecessary popups and decorative metrics in the first release.

Design loading, empty, error, offline, expired-session and conflicting-edit states alongside success screens. Session expiry must not discard a reflection. Clearly distinguish an unsaved local draft from cloud-saved work during connectivity loss; full offline synchronisation remains deferred.

Keep the study interface lightweight: lazy-load richer simulations, reserve layout space to avoid disruptive jumps, load fonts efficiently and bundle necessary assets. Check perceived responsiveness on a throttled connection and representative phone; record the environment with performance measurements.

### Design deliverables before broad implementation

Create a small design token set covering surface layers, text emphasis, semantic colours, spacing, type scale, radii, borders, shadows and focus rings. Both themes use the same semantic tokens. Show real course text in the visual slice; placeholder paragraphs cannot validate reading comfort.

Define reusable components for course navigation, section navigation, code blocks, instructional callouts, hints, checklists, save status, note editors, empty states and error recovery. A component's disabled, loading and error states belong to the same design specification as its default appearance.

Desktop layout sketch:

```text
Global navigation and course context
Course tree | Lesson and explanation | Notes and checklist
            | Relevant visual        |
            | Current task           |
            | Previous / Next        |
```

Phone layout sketch:

```text
Menu / Course / Account
Lesson title and section selector
Explanation and visual
Task / example / verification
Notes and checklist entry
Previous / Next
```

The sketch describes hierarchy, not fixed pixel heights. Long content must expand naturally.

### Visual review evidence

Capture the actual rendered lesson 1, token-bucket lesson 11 and advanced lesson 22 in both themes. Include a phone screen with the note editor open and one showing a long code block. Record any untested real-device keyboard behaviour. Correct cramped text, ambiguous selected states and unexplained controls before propagating the layout to all lessons.

## Learning Flow and Visual Teaching

### A lesson from start to finish

Use a consistent sequence: Understand, Build, Verify, Reflect. These are navigation sections within one lesson, not four disconnected pages that hide essential context. Provide a full-lesson reading mode too.

Understand: situation, purpose, explanation, worked example and optional simulation.

Build: exact task, guided exercise, files or functions involved, and code snippets with Copy controls.

Verify: acceptance cases, expected results, commands to run locally, and the completion checklist.

Reflect: explanation question, personal answer, notes, optional stretch task, and next lesson.

Reveal the existing hint only when requested. Do not invent full reference solutions or additional staged hints without separate content review. Keep all original teaching content accessible even when it does not map cleanly to a named section.

Example session: resume lesson 11; predict how many tokens remain; step through the token-bucket example; implement in the local editor; run terminal tests; record the result; answer why capacity and refill rate differ; explicitly mark the lesson complete.

Viewing or scrolling through a lesson never marks it complete. Test results entered by the learner are labelled self-reported. The app does not claim it executed or verified their Python.

### Visual explanations throughout the course

Visual teaching is a first-release requirement throughout the course, not confined to three playgrounds. Create a lesson-to-visual coverage map. Use diagrams where they explain a relationship or state change; simple lessons can use a state table rather than decorative animation.

Required examples: separate Alice/Bob allowances, a request passing through the limiter, aligned versus rolling time windows, tokens refilling and being spent, queued jobs waiting for service, several application workers sharing Redis, and failure-policy paths during an outage. Use the same StudyShelf story and visual vocabulary across lessons. Pair every diagram with a brief plain-language explanation and a text/table alternative.

The following three demos are the initial richer simulations. Additional diagrams do not need interactive controls unless those controls improve understanding.

### Three initial interactive demonstrations

1. Fixed window versus exact sliding log: replay five arrivals at 59.9 and five at 60; show the boundary, retained timestamps, decisions and counters. Fixed window admits ten, the sliding log five.
2. Token bucket: adjust capacity, refill rate and request cost; add a request; advance simulated time; display before/refill/after balances and retry advice. Include the lesson 11 and 12 traces as presets.
3. Concurrency race: step through two workers reading one remaining token, then compare with an atomic decision. Show the event order, not an animation that merely suggests correctness.

Each demo needs Step, Reset, and a readable event table. Optional playback honours reduced-motion preferences. Use simulated time rather than wall-clock animation as the source of truth. Controls must update the real model. Clearly label these as teaching demonstrations, not execution of the learner's code.

Test simulation outputs against the course examples. Avoid implying the single Redis simulation models failover or all production failure modes.

### Lesson presentation contract

Keep the original teaching sequence understandable even when sections are rearranged into the four study stages. The full-lesson view must use the same content model as the section view, so corrections do not leave two different versions of an explanation.

For every lesson, map: learning objective, prerequisites, explanation, worked example, implementation task, verification method, hint, reflection, stretch work and completion checklist. Missing optional fields should disappear cleanly. Missing required teaching material is an import/readiness issue rather than an invitation to fill the interface with generic text.

### Simulation contract

Represent a demonstration as a pure model plus a renderer. Each event produces a before-state, event, decision and after-state. Animation displays those records; it does not control algorithm timing. Reset restores both model and presentation state.

For the first demonstrations, test the boundary trace, fractional refill, invalid control values and deterministic worker interleavings. Show units next to controls. Explain when a change resets the current experiment rather than silently mixing parameters from two different runs.

### Visual coverage record

Create one row per lesson with visual type, teaching purpose, source example, mobile treatment and accessible alternative. A simple state table may be the right answer for a basic counter. Several related lessons can reuse a visual component with different curated traces. Do not manufacture thirty complex animations merely to satisfy coverage.

Reflections are learner explanations, not automatically scored answers. Keep the distinction between observing a demonstration and implementing the project visible.

## Content Import and Public Course Readiness

### Content import and preservation

Use individual lesson Markdown files as the canonical source for lesson bodies. Use COURSE.md for preparation and reference material. Do not import both copies of every lesson.

Create an explicit course manifest: stable course ID, title, summary, language, prerequisites, version, milestone IDs, lesson IDs, ordering, source paths, section mapping and attached demo IDs. Milestone and lesson counts are data, not platform constants. Persist progress by stable IDs rather than headings or array positions. A title change must not lose progress.

Use a Markdown AST parser rather than splitting with regular expressions. The master contains code comments beginning with `#`; those are not document headings. Some lesson labels are bold inline labels, not Markdown headings. Preserve code fences, lists, tables, link destinations, and checkbox text during transformation.

For the rate limiter course validate exactly 30 unique lessons and milestone sizes 7, 7, 6, 5, 5. Validate other courses against their own manifests rather than these fixed counts. Every teaching content block must either render in a study section or remain in the full-lesson view. Personal filesystem paths and legacy-only setup steps require the explicit public-edition adaptation described below; keep that mapping auditable rather than silently copying unusable instructions. Preserve source content hashes and record import results so missing content is detected rather than silently dropped.

Provide an initial seed/import command for the local course and an owner-only course upload workflow for future courses. Imported published content is read-only to learners; notes live separately. The hosted app never reads the owner's Documents folder directly. Publishing creates a versioned content snapshot.

When imported course content changes, preserve progress and notes; optionally show a content-updated notice for affected completed lessons. Do not automatically erase completion or mark new material mastered.

### Public course readiness and first use

The current Markdown course was written for the owner's computer. Preparation references `/home/jchukwu/Downloads/shipthatcode-build-rate-limiter-python`, and lesson 7 requires its HTTP adapter, shell runner and fixtures. The existing `starter/` contains only the core limiter scaffold and eleven tests. This is a public-release blocker until the required exercises are self-contained.

Create a separate public-edition content directory in the application repository. Preserve the original course. Maintain a source-to-public mapping describing each adaptation: replace personal paths with portable working-directory instructions, present the three-hour study schedule as an optional example, link every required download, and provide BuildTrail-owned HTTP harness code and independently authored fixtures for the main lesson 7 path. Keep the legacy ShipThatCode exercise as an optional compatibility note, never a prerequisite for an account holder. Do not automatically redistribute third-party starter assets without establishing that they may be included.

Create a source-path-to-route mapping for lessons, preparation, reference sections and downloadable assets. Resolve relative Markdown links against their actual source files before rewriting them to app routes. Deduplicate presentation-only Previous/Next links already supplied by the app shell. Record these transformations while preserving teaching content. Validate every internal destination and reject required links outside the permitted bundle. Public links must not depend on the owner's absolute filesystem path or unavailable raw Markdown pages.

Each public lesson manifest identifies prerequisite knowledge, new tools, verification method and whether tests are supplied or learner-authored. Add concise just-in-time explanations where unfamiliar syntax is essential; lesson 22, for example, needs enough Lua and Redis script-invocation guidance to begin. Record these public-edition additions without providing complete solutions. Verify usability for a learner with the stated prerequisites rather than assuming the private conversation supplied their background.

Provide one versioned starter download, its file list, setup README and supported platform instructions. Start with Linux, macOS and Windows through WSL; explicitly state that native Windows shell commands are not verified unless tested. A fresh learner should need only the documented tools and supplied downloads. Preserve unfinished implementation tasks. Explain the initial expected test failures. Later lessons must clearly distinguish supplied tests from tests the learner is expected to write; do not imply all 30 lessons have a downloadable grader.

The course detail page states what will be built, prerequisites, language, tools, expected outcomes, milestone structure, and that coding happens locally. Keep time estimates labelled estimates. Provide a short setup checklist before lesson 1 and optional warmups for missing prerequisites. A learner can inspect content as a guest, but changing a cloud checklist or writing notes requires sign-in; the login prompt preserves the intended lesson and section.

Add a lightweight Report a lesson issue link that prepares the course/version/lesson context for a documented owner contact route. Do not build a discussion forum or expose private notes in reports. Keep the contact route a deployment configuration requiring a real owner-provided address or issue destination.

### Public-edition adaptation report

For every adapted source location record the original source path and heading, adaptation reason, new public location and verification performed. Classify changes as path portability, navigation conversion, original prerequisite replacement, optional legacy material or new prerequisite explanation.

Keep this report developer-facing. Learners should receive direct usable instructions rather than an account of internal migration work.

### Fresh-learner test procedure

1. Use a clean working directory with no reference to the owner's downloaded repository.
2. Follow the public overview and setup instructions using only advertised downloads.
3. Confirm the starter file list and documented initial test failures.
4. Follow lessons 1–7 and identify where code must be written versus supplied.
5. Run both the core and original BuildTrail integration checks required for the first milestone.
6. Record platform, Python version, commands, outcomes and corrections.

The test validates the course path; it does not require publishing a full solution. Temporary reviewer solutions and credentials must not leak into the learner starter.

### Content validation report

Output lesson counts and ordering, unresolved links, missing assets, duplicate stable IDs, unsupported Markdown constructs, source hashes and public-adaptation coverage. A failed required-content check prevents publishing. Original instructions to copy machine-specific files must never survive as mandatory public setup.

Separate seed content from user records. Re-running a seed command updates or stages the intended course version; it must not reset learners' notes or progress.

## Accounts Data and Synchronisation

### Technical recommendation

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

### Explicit learning and data contracts

Enrollment starts when a signed-in learner selects Start course or starts a lesson; guest browsing creates no private enrollment. Opening a signed-in lesson makes it in progress. Completion requires an explicit learner action, remains reversible, and is never labelled test-verified. Checklists and reflections support learning but do not secretly gate completion. Needs review is independent of completion. My Learning progress is completed required lessons divided by currently published required lessons. The reader uses its pinned version's required lesson set and labels that version; optional stretch tasks do not inflate the denominator.

Give checklist items, reflection prompts and resume sections stable IDs as well as lessons. Notes and reflections are distinct fields. Store completion time and the content version completed. A materially revised completed lesson can display Content updated while preserving its completion and notes. A newly added required lesson changes the current percentage; explain that change rather than silently resetting old work. Removed lessons retain personal notes in an archived-notes view and are excluded from the current denominator. Never recycle stable IDs for unrelated content.

Autosave after a short idle interval, coalesce outstanding changes per record, and enforce revision checks in the database operation. A stale update cannot overwrite a newer note. Show both copies on conflict and let the learner choose or combine them. Repeating a request must not create duplicate enrollments or records. Use per-item writes for checklist changes so checking one item on a phone does not erase another item changed on desktop.

Resuming selects the most recently active lesson and valid section using server-recorded activity times. Refresh saves when switching lessons, returning to an active tab or detecting a session change; live collaborative editing is not required. On session expiry, preserve an account-scoped local draft and allow the same user to recover it after sign-in. On explicit sign-out with pending drafts, offer save/retry or download before clearing the private cache. Do not expose retained drafts to a subsequently signed-in different account.

Personal-data exports include schema version, export time, stable course/lesson/item IDs and content-version references. Import previews counts and conflicts before any write. Merge adds absent values and requires a choice for conflicting existing notes rather than trusting file timestamps. Replace affects only the explicitly selected user's course records, after a pre-import export is offered. Missing/unknown lesson IDs remain recoverable archived records or appear as explicit validation issues; they are not discarded silently. Validate the entire bounded import before applying it transactionally through a trusted operation. Never accept user IDs or owner roles from the file.

### Identity and storage test matrix

Test each operation as visitor, learner A, learner B and owner. Include direct database/API attempts as well as UI actions. Cover select, insert, update and delete for private records, and draft access for content and Storage objects. Hidden UI controls are not evidence of authorization.

Model unique record identities explicitly: enrollment by user and course, progress by user/course/lesson, and prompt or checklist answers by stable item ID. Reject references to lessons that do not belong to the selected course. Foreign-key and access-policy decisions must agree.

### Save state machine

The UI distinguishes clean, edited, saving, saved, failed and conflict. New edits during an in-flight save remain dirty until their own revision succeeds. A late response to an older request must not falsely mark newer text saved.

Draft recovery is account-scoped. When connectivity returns, retry only against the revision last read; on conflict preserve both versions. A refresh or route change should not discard queued local drafts. Never depend on a network request sent during page unload as the only preservation mechanism.

### Provider acceptance

Verify Google and GitHub independently from a deployed staging origin. Test the intended return route, cancelled consent, callback errors, missing optional profile fields, sign-out and expired sessions. Use supported verified identity linking only if exposing that control. Do not automatically assume two separate provider logins are the same person.

Keep the operational owner role out of user-editable profile fields and personal-data import payloads.

## Course Upload Publication and Versioning

### Owner course upload and publishing

The first release supports one platform owner and many learners. The owner can upload a documented course bundle containing a manifest, Markdown lesson files and allowed static assets, validate it, preview it as a draft, and explicitly publish a version. Provide an example bundle and a checklist so future courses do not require redesigning the app.

Validate file types, size limits, manifest schema, unique stable IDs, lesson ordering, asset references and path safety. If archives are accepted, protect against path traversal and excessive extracted size. Uploads cannot install packages, execute JavaScript, register new arbitrary simulations, or change application code. New interactive demo types are reviewed code additions; manifests only select already-supported demo components.

Show actionable validation errors and preserve the last published version on failure. Draft uploads remain private to the owner. Publication atomically switches the active version after validation; rollback can select a retained version without deleting learner records. Existing IDs cannot be casually recycled for unrelated lessons. Removing or reorganising lessons must preserve historical notes and avoid corrupting completion totals.

### Published content consistency

Store course content in Supabase at runtime so an owner can publish another course without redeploying the React application. The frontend bundle contains the renderer and reviewed simulation components, not the only copy of the catalogue. Course versions are immutable snapshots with version-scoped lessons, assets, references and search indexes.

Read the active version once when opening a course session, then fetch lessons, downloads and search data using that exact version ID. Do not mix old lesson text with new examples during a publication. When a new version becomes available, show a notice and switch on explicit reload or the next course entry; never replace text while the learner is writing. Cache keys include course and version IDs. Maintain an explicit retention policy for readable previously published snapshots; hide withdrawn courses from discovery while preserving the learner's exportable records.

Stage assets under immutable version paths, validate all metadata and asset availability, then atomically switch the active-version pointer in a database transaction. Storage uploads and the database pointer change are not one distributed transaction: failed staging remains unpublished and can be cleaned up later. Publishing retries use a stable operation ID. Concurrent publication checks the expected active version. Rollback selects a retained complete snapshot, not a partial overwrite. Search indexes and public asset access follow the same publication state. Publicly downloaded material cannot be recalled by unpublishing.

### Concrete upload and owner contracts

Define the bundle format before building the upload UI: `manifest.json`, `lessons/*.md`, `references/*.md`, optional raster images, and downloadable starter files. The manifest includes schema version, stable IDs, ordered milestones and lessons, section/item IDs, asset references and only registered demo IDs. Deliver a sample bundle and schema validation tests. An internal two-lesson sample course is required to prove that platform code does not assume the rate limiter's structure; it need not be publicly listed.

Initial configurable product limits: 10 MiB compressed bundle, 25 MiB expanded total, 200 entries, 1 MiB per Markdown file and 5 MiB per image. Reject nested archives, symlinks, path traversal, external asset fetch instructions and unsupported content. Permit PNG/JPEG/WebP for uploaded images; application-owned SVG diagrams remain trusted code. Treat allowed Python/shell starter text as downloads only, never executable server code or injected HTML. Document any additional file types deliberately.

Upload directly to a private Supabase Storage staging area after owner authorization. Send only the object reference and metadata to the validation API, rather than routing a large archive through a normal function request. The server verifies object ownership, size and allowed path itself. Use bounded validation with an operation record, status, clear errors and safe retry; do not assume an unawaited background task survives a serverless response. Verify selected runtime limits with the largest permitted sample before launch. Vercel has request-body limits that depend on configuration: https://vercel.com/docs/functions/limitations .

Bootstrap the single owner using a documented one-time trusted action assigning a specific authenticated user ID. The first public signup never becomes owner automatically. Verify the current owner role server-side, not a browser flag. Provide an operational recovery/reassignment procedure. Block self-service deletion of the only owner until ownership has been deliberately reassigned; ordinary learner deletion remains available.

### Publication states

Use explicit operation states such as uploaded, validating, invalid, ready, publishing and published. A validation failure presents a report and allows a corrected upload. A timeout presents a retry/status action with the same operation ID; it does not assume the earlier attempt failed before committing.

Course-version content remains immutable after publication. Editing creates a new draft. The active-version pointer chooses the current published snapshot. Deleting an incomplete staging operation must never delete assets referenced by a retained published version.

### Publication walkthrough

The owner uploads the sample bundle, reads validation results, opens a draft preview, publishes, opens the public course as an anonymous visitor, then rolls back to a retained version. Meanwhile, learner A keeps an older lesson open and learner B begins a new visit. Neither should receive a mixed snapshot or lose private work.

Run the same workflow for the internal second course with different milestone counts. This checks the platform contract rather than just the seed course.

### Reader and owner separation

Owner previews clearly indicate draft/version context. They must not seed draft content into anonymous caches or public search results. Public reads follow publication policy; owner reads can inspect drafts but still resolve explicit version IDs.

The upload format selects reviewed simulation types by ID. Uploading content is never a plugin-installation mechanism.

## Deployment Launch and Recovery

### Launch and recovery requirements

Use Google and GitHub OAuth only for initial login. Create separate provider credentials and callback configuration for staging and production; test both providers, cancellation, sign-out, expiry and return-to-lesson. Test supported account linking before exposing a Link provider control; do not invent unsafe automatic merging.

Provide a plain-language privacy/data page describing actual account fields, private study data, hosting providers, exports, deletion and retention. Keep analytics off initially unless separately requested. Error logs must not include access tokens, note bodies, reflections or raw uploaded content. Capture enough operation IDs and error categories to diagnose login, save and publication failures. Document the owner contact route and service-status checks without adding a monitoring dashboard product.

Bound account writes and uploads using database constraints, authorization and appropriate server-side limits. Avoid saving on every keystroke. Default note/reflection size limit is 50,000 characters per field with a clear UI message; accept only one draft version upload operation at a time per owner. Review project quota usage and spend controls before opening registration widely.

Account deletion requires recent authentication, a clear description of the data affected, and an export option. Remove learner rows and related owned objects through a retryable trusted workflow; test that a stale session cannot recreate private data after deletion. Authentication deletion and database/storage cleanup are not assumed to be one transaction. Existing issued tokens and Storage ownership require explicit handling: https://supabase.com/docs/guides/auth/managing-user-data .

Document and exercise backup restoration for database records AND uploaded assets. Supabase database backups do not include Storage object contents: https://supabase.com/docs/guides/platform/backups . Define the chosen backup schedule, retention, responsible owner and restoration steps for the purchased/free plan. Preserve original published bundles outside the hosting service. Test a restore into staging before describing data as recoverable. Do not promise zero data loss; disclose the actual backup interval.

Keep an application rollback procedure separate from course-version rollback. Test migrations in staging and prefer backwards-compatible schema changes during deployment. Maintain a deployment checklist for environment variables, OAuth callbacks, row policies, Storage policies, deep links, exports and both-account tests. Include security headers appropriate to the chosen auth flow and block rendering uploaded HTML/scripts.

Release sequence: internal checks, a small invited pilot with real phone/desktop study sessions, then open registration. Treat the pilot as a release stage, not a new invitation-management feature. Resolve observed reading/navigation/save failures before widening access. No extra gamification, hosted IDE, payments or community features are added by this review.

### Environment responsibilities

Local development uses reproducible migrations and test fixtures. Hosted staging uses test accounts and test content. Production uses real learner data. Keep environment credentials and OAuth callbacks separate. Confirm the deployment actually points to its intended Supabase project before running write-based checks.

Document which environment variables are safe browser configuration and which must remain server-only. The example environment file contains names and explanations without real secrets. Do not put a service-role key into any variable that the frontend bundler exposes.

### Release runbook

The runbook should identify the release commit, migrations, content version, environment checks, tests, production smoke checks and rollback action. Application rollback and course rollback are distinct operations. Avoid a schema migration that makes the previous app release unable to read existing records unless a recovery plan is tested.

Before public launch, verify catalogue access, each login provider, one note save, progress resume, starter download and an issue-report link. Inspect errors without logging private content.

### Operational handoff

Supply a short owner guide for publishing a corrected course, diagnosing a failed save, checking provider status, exporting backups, restoring staging and rotating configuration. Name the backup owner and chosen retention/schedule in deployment documentation. A documented procedure that has never been tried must not be reported as a successful restore test.

A custom domain is optional. Domain availability, paid service choices and real contact details remain owner-provided deployment inputs.

## Build Sequence and Handoff

### Implementation sequence and agent ownership

Phase 1: inspect sources, audit public course readiness, create the portable public course adaptation and independent starter, then define manifests, version contracts, schema, ownership policies and import validation. Preserve the original files. This phase must prove a new learner can start without files from the owner’s computer.

Phase 2: build a working visual slice using lesson 1 and lesson 11, plus a content stress check of lesson 22, with both themes and phone, tablet and desktop layouts. Demonstrate reading, hints, diagrams, notes and resume in the browser. Fix usability issues before expanding components. This is a design-quality checkpoint, not merely a screenshot of the shell.

Phase 3: import all lessons and reference material; implement the catalogue, course switching, search, navigation, code rendering and downloads. Prove content completeness.

Phase 4: add Google and GitHub sign-in, account settings, private database-backed progress, notes, checklists, resume, exports and recovery states. Test account isolation and conflicting edits from two sessions.

Phase 5: add diagrams throughout the course and the three tested interactive demonstrations; complete owner upload, validation, draft preview and publishing.

Phase 6: complete a fresh-learner walkthrough, exercise restore procedures in staging, run integrated checks, inspect the real UI, configure production services and deploy to Vercel. Verify production login, saving and cross-device resume; deliver the URL and maintenance instructions.

Codex may delegate after the interfaces are established. Use bounded file ownership: one agent owns content import and validation; one owns simulations and their tests; one owns storage and backup tests. The lead owns the app shell, visual system, integration, browser checks and user updates. Do not have several agents rewrite the same global styles or application shell. Start integration early rather than collecting unrelated prototypes at the end.

### Communication and deliverables

During implementation give brief chat updates at meaningful milestones and at least about once a minute during sustained work. Explain what is complete, what was learned, what is being checked next, and any blocker. Maintain `/home/jchukwu/Documents/code/build-trail-platform/BUILD_LOG.md` with completed work and validation, but do not substitute the file for chat updates.

Deliver application source, the deployed app URL, local development instructions, owner course-upload instructions, database migrations and access policies, backup/export guidance, tests and actual results, known limitations and a short feature summary. Do not report unimplemented controls as finished.

Deferred features: browser Python execution, automatic grading, hosted code runners, AI tutoring, spaced repetition, full quiz authoring, payments, social features and public instructor publishing. Multi-course support and owner uploads are included; writing additional courses is separate content work. A visual course editor, executable plugins, multiple owner roles, notifications and real-time collaborative editing are also deferred. Add them only after a separate request. Basic lesson reflections and review flags are included already.

### Handoff instruction

Implement this online multi-course platform in the new `/home/jchukwu/Documents/code/build-trail-platform/` folder, launching with the existing rate limiter course. Use Vercel hosting and Supabase accounts and private progress. Keep Python coding in each learner's editor and terminal. Begin with content validation and a two-lesson visual slice, then complete all release phases including owner uploads and deployment. Keep the user updated in chat and verify the finished study journey with two accounts. Treat public-edition readiness, stable version/data contracts and the mobile stress check as required work, not optional follow-ups. This document is the revised build handoff; the planning session itself does not create services, purchase plans or deploy an app.

### Work packages and completion evidence

| Package | Evidence before moving on |
| --- | --- |
| Public content readiness | Portable starter, adaptation report and resolved link map |
| Architecture contracts | Manifest/schema definitions, ownership model and stable IDs |
| Visual slice | Real lessons demonstrated on desktop and phone, with notes and diagrams |
| Full reading experience | Thirty lessons, references, search and downloads verified |
| Accounts and saved work | Both providers, two-account isolation and conflict/recovery tests |
| Owner publication | Sample upload, errors, preview, publish, rollback and second course |
| Release preparation | Staging restore, pilot findings, production setup and smoke checks |

These packages express dependencies; independent work can proceed in parallel once shared interfaces are stable. The lead agent integrates continuously and keeps one coherent app rather than assembling disconnected demos at the end.

### Working with the user

Post short progress updates in chat describing the concrete result, relevant finding and next check. Ask for missing service credentials or owner decisions only when needed. Continue independent implementation while waiting where possible.

The visual checkpoint should produce a reviewable working screen, not a question asking the user to imagine a design. If user feedback changes the layout, apply it before repeating that pattern across the platform. Do not impose additional approval gates absent a real need.

Report exactly what works, what was tested and what remains blocked. Seeded content, mock sign-in and mocked saves must be labelled during development and replaced before claiming the release complete.

## Acceptance Tests and Quality Review

### Validation and definition of done

- All 30 lessons and all supporting reference material are accessible with no duplicated lesson bodies or missing teaching sections; public-edition adaptations have an explicit source mapping.
- A fresh learner with no owner filesystem access can download the starter, follow setup and complete the first milestone using only public course resources.
- Both Google and GitHub sign-in work; login cancellation, callback failure and expired sessions have recoverable paths.
- Stable checklist IDs, course updates, archived notes and completion denominators follow the stated contracts.
- Publishing during a reading session cannot mix versions. Failed uploads and failed publication preserve the current course.
- The second internal sample course can be uploaded and previewed without source-code changes.
- Account deletion, invalid/conflicting imports, owner bootstrap and storage restoration have been exercised in staging.
- Search locates text from early and late lessons and navigates to the correct place.
- Notes, checklist values, completion and resume position survive reload, sign-out and login on a different device.
- Account A cannot read, create, modify or delete account B's records through direct API requests; anonymous visitors cannot access private study data.
- Two courses with identical lesson slugs have separate progress. Renaming a course does not reset progress.
- Concurrent note edits are detected and recoverable rather than silently overwritten.
- Non-owners cannot upload or publish content. Draft courses and their private assets are inaccessible to anonymous visitors. Invalid uploads do not replace a published course.
- Export/import round-trips preserve data; malformed imports leave existing data intact; storage errors are visible.
- Reading a lesson does not claim verified test completion. Later lessons do not show fake grading results.
- Demonstrations produce the documented decisions, including exact boundary and fractional-refill cases.
- Browser Back/Forward, direct lesson links and reloads work.
- Keyboard navigation, focus management, readable contrast, reduced motion, code overflow and narrow layouts are checked in both themes.
- Verify representative widths of 320, 390, 768, 1024 and 1440 CSS pixels, including phone portrait and landscape. No page-level horizontal overflow, clipped primary controls or illegible diagram labels are acceptable.
- Test a mobile journey: discover a course, sign in, read a lesson, inspect a diagram, reveal a hint, copy code, write a reflection, navigate away, return and resume on desktop with saved state intact.
- Check text zoom, touch interactions, keyboard focus, drawer focus return and on-screen-keyboard behaviour. Simulated viewports alone do not prove real mobile keyboard behaviour; check a real device when available or report that verification gap.
- Stress-test mobile with lesson 22, long code lines, long reflections, expanded course navigation and an interrupted save during navigation; do not validate only short introductory content.
- Controls must have working actions, readable labels and appropriate feedback. Session expiry and save failure must preserve drafts.
- Review both the initial visual slice and final app for typography, purposeful diagrams, spacing, readable themes and clear next actions. Resolve usability defects even when functional tests pass.
- The production build succeeds; preview and production deep links work; production authentication redirects and cross-device saves are verified.
- No application files replace the course source and no learner code is executed by the app. Production secrets are not exposed in the client bundle or logs.

Use unit tests for model arithmetic, content transformation and storage migrations; integration tests for content and backup contracts; and browser tests for the main study journey. Inspect screenshots of actual desktop and narrow layouts. A green build alone does not demonstrate usable typography or layout.

### Required evidence categories

| Area | Required evidence |
| --- | --- |
| Content | Import report, link audit and public first-milestone walkthrough |
| Visual quality | Actual desktop/phone captures with real course content in both themes |
| Learning visuals | Deterministic model tests and readable mobile/text alternatives |
| Accounts | Google and GitHub sign-in flows on deployed staging |
| Privacy | Direct API/database/Storage deny tests between two users and anonymous access |
| Saved work | Reload, second-device resume, conflicting saves and expired-session recovery |
| Publication | Malformed bundle, interrupted operation, concurrent publish and rollback checks |
| Recovery | Personal export/import and a separate database-plus-assets staging restoration |
| Release | Clean build, deep links, production smoke checks and recorded limitations |

Record outcomes rather than merely listing intended tests. Failed checks remain visible until fixed or explicitly described as unresolved. Do not infer mobile keyboard behaviour from screenshots alone.

### Defect triage

Block public launch for broken setup, inaccessible required lessons, private-data exposure, lost notes, incorrect core demo arithmetic, failed sign-in, corrupt publication or missing required downloads.

Treat layout defects that obscure tasks, controls or code as functional learning defects. Small cosmetic inconsistencies can be recorded separately, but the user explicitly prioritises UI/UX: do not dismiss widespread cramped typography or inconsistent interactions as optional polish.

Re-run the affected acceptance journey after a fix. Broadly repeating every check is useful only when changes affect shared infrastructure or leave a material unresolved concern.
