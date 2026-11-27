# 04 — API contracts, saving and personal backups

The [detailed data/API specification](../../IMPLEMENTATION_DATA_AND_API.md) owns exact wire contracts. Its durable study epoch, preference revision guard, explicit milestone-state operation and multipart backup protocol refine the abbreviated contracts below.

## Shared protocol

Validate unknown input at every boundary. UUID IDs, string revisions, UTC ISO times, explicit schema versions, strict enums. All mutating commands carry a client-generated UUID `mutationId`; privileged workflows also have a stable operation ID. Store a canonical request hash: the same ID with different input is an idempotency error. Keep receipts seven days, then clean them; idempotency outside that interval is not promised.

API errors use `{ error: { code, message, requestId, fieldErrors? } }`. Known codes: UNAUTHENTICATED (401), FORBIDDEN (403), NOT_FOUND (404), CONFLICT (409), INVALID_INPUT (422), TOO_LARGE (413), RATE_LIMITED (429 with Retry-After), RETRYABLE_FAILURE (503). Do not include secrets, SQL text or private content in errors. RPCs may return a typed result union for expected conflicts; adapters normalize it to the same domain result without pretending every Data API response has a custom HTTP status.

## Browser database operations

| RPC | Input besides mutation ID | Atomic result |
| --- | --- | --- |
| `start_lesson` | course, pinned version, lesson, optional section | Validate readable lesson; enroll if absent; mark in-progress only if previously not started; update resume |
| `set_lesson_status` | course, lesson, pinned version, desired status, expected record revision | Set/reverse completion; server completion time/version; preserve notes |
| `set_review_flag` | course, lesson, boolean, expected progress revision | Change only review flag |
| `save_note` | course, lesson, body, expected revision | CAS text; return new revision/time or conflict metadata |
| `save_reflection` | course, lesson, item, body, expected revision | Validate stable reflection item; CAS text |
| `set_checklist` | course, lesson, item, boolean, expected revision | Update exactly one item |
| `save_evidence` | course, lesson, body, expected revision | Bounded self-reported text only |
| `touch_resume` | course, pinned version, lesson, section | Server activity timestamp; throttle to at most one per 15 seconds/client and section changes |
| `save_preferences` | patch of allowlisted fields, expected revision | CAS preferences; no auth/profile fields |

Expected revision `"0"` means absent/new record; initial successful write yields `"1"`. Updating an existing row with expected zero conflicts. The implementation must test simultaneous first writes. For CAS conflicts fetch the current record only under the caller's permission; never return another account's data.

Progress mutations use the same revision/idempotency rules as text. A start/read action never overwrites completed status. Concurrent independent checklist items succeed; conflicting edits to the same item require refresh/reapply. Account-level and course-level throttles apply inside RPCs as well as server APIs.

## Vercel endpoints

All routes are under `/api/v1`, JSON except direct Storage transfer. Every private/owner endpoint requires a bearer token verified through the trusted Supabase authentication path; authorization is checked on every operation. The published-asset URL endpoint described in the content specification permits visitors only after an explicit published-version access check. Draft asset requests require owner authentication. No wildcard CORS.

| Method/path | Contract |
| --- | --- |
| POST `/owner/uploads` | Create owner operation, course/version intent, expected archive bytes; return unique private upload path and short-lived upload authorization |
| POST `/owner/uploads/:id/validate` | Acquire lease, validate stored archive, stage immutable snapshot; return ready/invalid report |
| GET `/owner/uploads/:id` | Return current authorized operation state, not a guessed timeout outcome |
| POST `/owner/courses/:id/publish` | operation ID, target version, expected active version; atomically activate validated snapshot |
| POST `/owner/courses/:id/rollback` | retained version, expected active version; same consistency checks |
| POST `/owner/courses/:id/withdraw` | expected active version; remove discovery and public content access, retain learner records |
| POST `/me/exports` | selected courses or all; create consistent versioned export snapshot and private download object |
| POST `/me/imports` | reserve private upload slot with maximum bytes; return operation ID/path |
| POST `/me/imports/:id/preview` | validate uploaded JSON and create conflict/change preview with workspace revisions |
| POST `/me/imports/:id/apply` | merge/replace, explicit selected course IDs, resolution choices, expected preview token; transactional apply |
| POST `/me/deletion-challenges` | establish short-lived deletion challenge before fresh OAuth login |
| POST `/me/deletion` | challenge ID, typed confirmation, idempotency ID; start retryable deletion after fresh-session verification |

GET operation status for data operations is also required at `/me/operations/:id`. Administrative resume of interrupted deletion is an operational command, not an unauthenticated public endpoint. Health endpoint returns only release/build status, never credentials or database contents.

## Exact note-save algorithm

1. Load server text/revision; restore only matching environment/user/course/lesson drafts from IndexedDB.
2. A change immediately marks the editor dirty and persists a local draft. Debounce cloud writes for 800ms, with a five-second maximum interval during sustained typing. Flush on internal navigation where possible; navigation never discards the draft.
3. Allow one in-flight save per record. Freeze submitted text, base revision and mutation ID. New typing produces a new local generation; never mutate the submitted snapshot.
4. The transaction validates active user, quota and record identity, locks the user quota row and enrollment, checks the mutation receipt, then performs CAS and increments workspace revision.
5. On success advance the known server revision. Mark Saved only if no newer generation exists. If newer text exists, queue its write against the acknowledged revision.
6. On network timeout retry the same frozen request/ID with bounded exponential backoff and jitter. On conflict stop automatic overwrite; preserve local/current-server copies and offer compare, keep server, or merge/save against the newly read revision.
7. On auth expiry retain the local draft and prompt login. Only the same verified user can recover it. On quota/storage failure keep text in memory and offer download, displaying the failed local preservation state honestly.

A signed-out browser can still read public lessons. Notes require sign-in; do not silently create anonymous private notes. Explicit sign-out with pending work offers save/retry or download/discard. After the choice, cancel requests, remove user-scoped query caches and delete local private drafts. Session expiry may retain recoverable same-user drafts. IndexedDB isolation is application logic, not encryption against someone with access to the browser profile. Disclose shared-device limitations.

## Export/import design

Export includes `schemaVersion`, `exportedAt`, selected course IDs, stable record IDs, content-version references, notes/reflections/evidence/checklists/progress and preferences. No tokens, roles or provider identifiers. Take a consistent SQL snapshot; do not assemble an inconsistent export by paging changing tables. Generate a bounded private object and a short-lived signed download URL. Each transfer part is at most 20 MiB UTF-8 JSON and 10,000 records. Use the detailed contract's complete multipart snapshot/reassembly protocol when a single course or whole account exceeds one part; per-course export alone is not a complete fallback. Enforce a 10 MiB aggregate text quota, 10,000 persisted study-record limit and 1,000 enrollment limit for the pilot; a full backup set is bounded at 128 MiB. Measure actual serialized bytes, including escaping and metadata, and prove worst-case capacity in tests. Never truncate exports.

Transfers above ordinary API body limits use private Storage. Import JSON parsing checks actual byte size/depth/record count before large allocation; no recursive schema without a depth bound. Stored objects expire within 24 hours; signed links expire after five minutes and are bearer secrets. Storage policies deny user reads of other objects.

Preview returns insert/change/conflict counts and known/unknown IDs. Unknown course or item IDs are explicit validation errors with a downloadable report; the original file remains untouched. Removed but retained stable identities are valid archived records. Do not manufacture course identities from imported data.

Merge inserts absent records, retains identical ones and requires explicit choices for differing existing values. Replace changes only selected-course learner records and preserves the durable enrollment epoch counter; each applied import advances the selected course epochs so old editors cannot write against deleted/recreated revisions. Every study mutation checks the expected epoch. Preferences change only if separately selected, with an independently captured and checked preference revision. Offer a pre-import export before replace. One transaction locks the user quota row, then all selected enrollments in sorted course-ID order, verifies preview workspace revisions and epochs, locks/checks the preference revision when selected, and applies all changes. Follow the detailed data contract's lock order. If any relevant save happened after preview, return CONFLICT and require a new preview. A retry with the same operation ID returns the recorded result rather than applying twice.

The import service derives user identity from authentication; ownership/role fields in imported JSON are rejected. Checks are repeated at apply time. The API does not accept the client's claimed validation result. Large import transactions are performance-tested at configured limits; reduce limits with clear UX before adding asynchronous complexity.
