# BuildTrail application implementation specification

Status: implementation contract. This file defines application boundaries and browser behavior; it does not claim working software. Read the [root guide](IMPLEMENTATION_SPECIFICATIONS.md), [data contracts](IMPLEMENTATION_DATA_AND_API.md), [content contracts](IMPLEMENTATION_CONTENT_AND_LEARNING.md) and [delivery gates](IMPLEMENTATION_DELIVERY_AND_OPERATIONS.md) together.

## 1 Repository and reproducibility

Implement in `/home/jchukwu/Documents/code/build-trail-platform/`. The current `BuildTrail` folder contains planning and original course inputs. Do not initialize it as the application repository. The application must build from a clean clone without this sibling folder, owner downloads, absolute filesystem paths or cross-repository symlinks.

Use one npm package, strict TypeScript, React, Vite, React Router data mode, TanStack Query, CSS Modules, semantic CSS variables, selectively used Radix primitives, Zod, Supabase and Vercel Node functions. Use the existing [stack decisions](planning/technical/01_STACK_AND_DECISIONS.md). Freeze exact compatible dependency/toolchain versions during bootstrap after checking official support; Node 24 is a candidate, not a verified deployment setting. Use npm ci, commit package-lock.json, match local and hosted Postgres major versions, and record versions in docs/engineering-baseline.md. Do not run floating latest installs in CI.

Required layout:

```text
build-trail-platform/
  src/app/{router,providers,config,composition}/
  src/contracts/{common,content,learning,publishing,transfers,identity}/
  src/domain/{learning,content,demonstrations}/
  src/features/{catalogue,learning,identity,publishing,demonstrations,settings}/
  src/infrastructure/{supabase,drafts,http}/
  src/content/{ast,rendering,search}/
  src/ui/
  src/styles/
  server/{auth,config,operations,publishing,transfers,deletion,observability}/
  api/v1/
  supabase/{migrations,tests}/
  content/public/rate-limiter-python/
  tests/{unit,integration,e2e,fixtures}/
  scripts/
  docs/{decisions,runbooks,verification}/
  BUILD_LOG.md
```

Directory names describe ownership; do not create empty scaffolding merely to match the tree. ESLint must reject src imports from server/api, shared contracts importing server-only modules, and domain imports of React/Supabase/Vercel. Server composition is separate from browser composition. Scan production assets for administrative credentials and server-only code.

Public scripts must provide dev, dev:api, build, preview, lint, format:check, typecheck, test:unit, test:integration, test:db, test:e2e, test:coverage, content:validate, content:bundle, db:types and verify. Document the exact local API emulator command when selected. verify sequences checks and returns nonzero on failure; it must not deploy, mutate production, or replace test baselines. Generated database types are checked for drift after migrations.

## 2 Domain ownership and dependency direction

UI calls feature hooks/use cases; use cases depend on narrow domain ports; infrastructure implements ports. Composition roots wire dependencies. SQL is authoritative for cross-request transactions. Browser queues and server orchestration never replace SQL compare-and-swap or authorization.

| Boundary | Responsibilities | Prohibited dependencies or behavior |
| --- | --- | --- |
| Catalogue | Published course metadata, aliases, outline, search | Learner text in public response/index |
| Learning | Progress, answers, drafts, resume, completion | Publication/role assignment |
| Identity | Session changes, callback, deletion entry | Custom passwords or email-based account merging |
| Publishing | Upload, validate, preview, activate, rollback | Uploaded code execution |
| Demonstrations | Pure event/state arithmetic and explanations | Wall-clock-dependent results or Python execution |
| UI | Accessible controls, states, layout | Raw SQL calls or service credentials |
| Operations | Configuration, telemetry, recovery | Unredacted request bodies or private text in logs |

Use small interfaces such as NoteStore, DraftStore, ContentReader, OperationReader and Clock. Prefer functions for arithmetic and state transitions. A NoteSaveCoordinator may be a class with explicit lifecycle. Do not add a generic repository, inheritance framework, dependency injection container or global service locator. Each interface must express an actual boundary.

Enable strict, noUncheckedIndexedAccess and exactOptionalPropertyTypes. Parse external values from unknown; use no unchecked casts to authorize an operation. Revision numbers are decimal strings, not JavaScript numbers. Time units appear in names. Unexpected exceptions are caught at adapters, classified and propagated; no silent catches. Every asynchronous effect has cancellation/lifecycle handling.

## 3 Route contracts

| Route | Access | Data and behavior |
| --- | --- | --- |
| `/` | Public | Redirect to `/courses`; no invented marketing landing page |
| `/courses` | Public | Listed active versions; title/summary catalogue search |
| `/courses/:courseSlug` | Public if listed | Versioned description, prerequisites, setup, download, Start/Continue |
| `/courses/:courseSlug/lessons/:lessonSlug` | Public if readable | Pinned outline/body/references; separate private study queries |
| `/courses/:courseSlug/reference/:referenceSlug` | Public if readable | Same pinned version, stable anchors, content search |
| `/courses/:courseSlug/playground` | Public if readable | Registered demos; no saved anonymous private data |
| `/my-learning` | Signed in | Own enrollments, current-version progress, Continue, archived work |
| `/settings` | Signed in | Preferences, quota, import/export, deletion, data handling |
| `/auth/callback` | OAuth return | Process PKCE once, validate same-origin return path, recover failures |
| `/owner/courses` | Owner | Version operations and course management |
| `/owner/courses/:courseId/versions/:versionId` | Owner | Exact draft preview or retained version with clear status |
| `/data` | Public | Actual privacy/data handling, providers, region, retention and contact |
| unmatched route | Public | Application 404, useful return links |

Archived work is an explicit view under My Learning, using course/lesson stable IDs. It must work when published text is unavailable; it displays the user's retained records and honest content-unavailable labels. Do not grant withdrawn-content access merely to show notes. Owner-route hiding is convenience, not authorization.

A course session pins one version in one provider. Query keys and links include that pinned version internally. Resolve aliases before fetching bodies; retain the stable section anchor. Canonicalize old links without resetting progress. If an alias points to a lesson absent from the pinned version, show current-outline/archived-work choices. Never silently substitute unrelated lesson text.

The reader's progress is completed required IDs intersected with the pinned outline, divided by pinned required count. My Learning uses the current published required set. Label the reader version and show an update notice when the active version changes. A zero-required course displays no required lessons rather than division by zero. Switching versions preserves local drafts and replaces outline, body, search and assets together.

For private route entry while signed out, show sign-in with a validated return path. Public lessons remain readable. Start course for a guest prompts sign-in and returns to the intended lesson. Signed-in lesson entry invokes start_lesson once with a stable mutation ID for that navigation intent; retries reuse that ID. Reading never changes completed back to in progress.

## 4 Queries and cache lifecycle

Router loaders call shared TanStack Query query functions. Do not maintain independent router and component fetch caches. Public keys contain environment/course/version/resource. Private keys also contain user ID. Owner draft keys use a distinct namespace. Never include tokens or note bodies in keys, browser URLs or diagnostics.

Fetch outline and selected lesson separately; do not ship every lesson in JavaScript. Fetch private work separately from public content. Revalidate private work on tab focus, lesson change and session restoration. A background response must not replace unsaved editor text: compare revisions and enter conflict recovery if necessary. Stale-response filtering uses both account scope and request generation.

Do not persist private query cache wholesale. IndexedDB stores narrowly scoped pending drafts. No service worker or full offline sync in release one. A failed public read offers Retry; a failed private read never initializes an editable empty value as if the server had no note. Render loading/unavailable state until absence is positively established.

Withdrawal invalidates discovery and fresh content authorization. Cached/downloaded bytes cannot be recalled; do not promise otherwise. Private and owner responses use no-store. Retained published version reads still require current course visibility checks.

## 5 Saved work coordinator

Create one coordinator per editable record under the authenticated application lifetime, not per React render. Internal navigation can detach an editor without destroying its pending queue. Bound retained coordinators to active/pending records and dispose clean records when no subscriber remains.

Record scope includes environment, verified user ID, course ID, lesson ID, field kind and optional item ID. Record state includes server revision and generation/epoch required by the data contract, acknowledged text, local text, local generation counter, draft persistence status, frozen in-flight request, retry timer and conflict copies. These are separate concepts: local generation orders edits in one browser; server revision/epoch detects cross-device/import races.

Public operations: load, edit, flush, recover, resolveConflict, subscribe and dispose. edit synchronously updates visible text and marks dirty, then attempts draft persistence. Cloud saves debounce 800 ms with a five-second maximum delay while typing. Only one cloud write per record is in flight. Freeze body, expected revision/epoch and mutationId at submission. Later typing cannot mutate the frozen request.

| Event | Required transition |
| --- | --- |
| Successful save, no newer edit | Advance server token, clear matching draft, show Saved |
| Successful save, newer edit | Advance token; remain dirty; enqueue latest generation |
| Timeout/connection loss | Keep frozen request and draft; retry same ID/body |
| Conflict | Stop overwrite retries; retain submitted/local/server copies |
| Auth expiry | Keep scoped draft; require same-user login |
| Quota/rate limit | Keep text; show usage or Retry-After; avoid request loop |
| IndexedDB failure | Keep memory text, show local preservation failed, offer download |
| Navigation | Persist draft; flush opportunistically; never rely on unload |
| Account changes | Cancel timers/requests and detach old scope before new data loads |

Use bounded exponential retry delays of 1, 2, 4, 8, 16 and 30 seconds with jitter, then expose manual Retry while retaining text. Honor a longer Retry-After. Only transient failures retry automatically. Aborted browser requests may already have committed; recovery repeats the same frozen command rather than inventing a new mutation ID.

Conflict UI shows current server copy and local copy with clear labels; offer keep server, copy/download local and edit merged result. Keeping local or merging is an explicit write against the freshly fetched server token, with a new mutation ID. Do not use client timestamps or last-writer-wins. A content-version update alone does not erase text.

Draft format has schemaVersion, scope, base server token, local generation, text, frozen pending command metadata and local updatedAt. Runtime-validate reads; quarantine malformed entries and offer recoverable download where possible. Use IndexedDB schema migrations and tests with previous fixtures. Do not store access/refresh tokens in draft records. Local storage is not encryption; disclose shared-device limitations.

Explicit sign-out with pending work offers save/retry or download/discard before clearing private cache and drafts. After choice, revoke the SDK session as supported, cancel old coordinators, clear private state, then render signed-out UI. Expiry differs from explicit sign-out: retain same-user recovery drafts. An old asynchronous acknowledgement cannot repopulate a new account's state.

## 6 Learning controls

Completion is explicit, reversible and self-reported. Checklists and reflections never secretly gate completion. Show completion timestamp/content-version context, independent needs-review flag and an optional evidence text field. Each checklist item is a separate mutation; do not submit the whole checklist as a stale replacement.

Resume records stable lesson and section IDs using server activity time. Send section change updates and at most one routine update per 15 seconds/client. Do not save pixel offsets across devices. Preserve scroll locally during drawer/orientation changes. Ignore invalid/removed section IDs and offer the nearest valid lesson entry with an explanatory state.

Persist expanded milestone preferences through the explicit API in the data specification. Checkbox/progress failures show pending/failed state and restore acknowledged values without deleting unrelated state. Mutations of independent fields cannot accidentally replace the lesson's entire private record.

Preferences cover theme, reading size, reading font and focus mode; defaults apply before authentication without pretending they are cloud-saved. Signed-in preferences have revision checks and a defined conflict refresh/reapply flow. Selected text size must preserve layout at 200% zoom. Minimize theme flash using a non-sensitive cached theme preference and a CSP-compatible bootstrap strategy.

## 7 UI and accessibility implementation

StudyShell owns header, context navigation, course drawer, lesson and notes drawer. Start with three regions at 1200 CSS pixels, notes drawer below that, course drawer below 900; adjust based on actual fit. At most one modal drawer opens at a time. Opening another closes the first and preserves editor state. Escape closes; focus returns to the trigger; background is inert; visible close controls are reachable.

Provide CourseNavigator, StageNavigator, LessonReader, CodeBlock, HintDisclosure, StudyPanel, SaveIndicator, ConflictResolver, CourseSearch, DemoFrame, OperationStatus and shared loading/error/empty states. Every interactive control must have functional disabled/loading/success/failure behavior, not decorative placeholders.

Warm ivory/light and charcoal/dark themes use shared semantic surface/text/border/accent/status/focus tokens. Body text starts at 16px, 1.6 line height and comfortable reading width. Bundle licensed fonts. Primary touch targets are at least 44 by 44 CSS pixels. Avoid page-level horizontal overflow; code/tables may scroll locally with labels and keyboard access. Copy uses the real clipboard API and reports failure; no fake copied state.

Use semantic headings and links, explicit form labels, keyboard-visible focus, sufficient contrast and non-color status cues. Validate WCAG 2.2 AA targets through automated and manual checks; do not claim conformance from axe alone. Test 320/390/768/1024/1440 widths, portrait/landscape, reduced motion, 200% zoom and real mobile keyboard. Safe-area and dynamic viewport behavior must keep note text, save status and controls visible.

Lesson stages Understand/Build/Verify/Reflect and full reading use one ordered content model. Switching views preserves stable section selection and does not duplicate or omit teaching blocks. Hints use accessible disclosures; mandatory instructions cannot be hidden behind them. Search has Ctrl/Cmd+K, Escape, arrow selection, Enter and clear no-results/loading/error states. Search results retain pinned version and navigate to a stable section heading.

## 8 Security and instrumentation at application boundaries

Use browser PKCE and bearer headers. Validate return URLs against the configured origin and reject protocol-relative/encoded escapes. Server verifies token and current active profile; client session state alone is insufficient. Use initials for missing names/avatars. No third-party avatar requests by default. Provider linking follows supported verified identity behavior; no custom email merge.

Raw HTML/MDX, uploaded executable widgets and remote tracking images are forbidden. Render notes as plain text. Parse URLs; allow only the content contract's schemes/assets. CSP, nosniff, referrer and permissions policy belong in deployment tests. Never weaken CSP globally to fix a component without documenting the narrow requirement.

For each feature instrument operation name, request ID, elapsed milliseconds, outcome/error category and release version. Use bounded labels. Do not log tokens, OAuth callback codes, signed URLs, note text, raw payloads, emails or persistent personal identifiers in general telemetry. Keep required actor auditing in restricted operational tables. No analytics/session replay in this release.

## 9 Application verification cases

| Case | Required evidence |
| --- | --- |
| Clean clone | Install/build/test with original planning folder unavailable |
| Boundary enforcement | Intentional server import in browser fixture fails lint/build check |
| Save race | Type A, submit, type B, acknowledge A; UI remains unsaved until B acknowledged |
| Response loss | Commit then lose response; retry same command produces one change |
| Cross-device conflict | Two contexts load same token; second writer cannot erase first |
| Import race | Old editor cannot overwrite replaced/deleted/restored record |
| Account switch | Delayed response and IndexedDB draft from A never render under B |
| Local storage failure | Editor remains usable and download recovery works |
| Read failure | Failed fetch never becomes an empty note write |
| Publication | Open old reader while new version activates; no mixed body/assets/index |
| History | Back/Forward/direct link/reload preserve correct route and section |
| Private cache | Sign-out clears private queries/drafts after explicit pending-work choice |
| Accessibility | Both themes, keyboard flow, dialogs, zoom, reduced motion and mobile keyboard |
| Performance | Initial JS <=250 KiB gzip; initial transfer <750 KiB; lazy demos verified |

Use unit tests for coordinator/domain state transitions and real local Supabase for integration tests. Own services are not mocked in integration tests. Browser tests use synthetic users and real local APIs. Tests-first chunks and coverage gates follow the delivery specification; meaningful branch scenarios remain mandatory even when numeric coverage passes.
