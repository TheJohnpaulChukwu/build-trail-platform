# BuildTrail implementation contract: data, APIs and private work

Status: implementation specification, 26 November 2026. This document specifies work to build; it does not claim migrations, endpoints, tests or infrastructure already exist. Application code belongs in the separate `build-trail-platform` repository defined in the [repository specification](planning/technical/08_CODE_AND_OBJECT_DESIGN.md). This document remains in the BuildTrail planning root.

## 1. Authority, scope and engineering discipline

Implement the complete [product scope](planning/01_PRODUCT_AND_SCOPE.md), [personal-data requirements](planning/05_AUTH_DATA_AND_SYNC.md), [technical database baseline](planning/technical/03_DATABASE_AND_AUTHORIZATION.md), [API baseline](planning/technical/04_API_AND_SYNC.md) and [security baseline](planning/technical/07_SECURITY_AND_PRIVACY.md). This contract resolves their previously underspecified revision, preference import, metadata and export behavior. Reconcile older wording with these decisions before implementing affected work; do not independently maintain incompatible contracts.

The user has adopted the general, non-Java, non-financial engineering rules in [planning/CLAUDE.md](planning/CLAUDE.md). For this TypeScript/Postgres implementation:

- Work in reviewed chunks using red, green, refactor. Write the behavior/authorization test before the corresponding implementation and record the initial expected failure.
- Integration tests run the real local Supabase Postgres, Auth, Storage and application handlers. Internal services and repositories are not mocked. Unit tests may isolate pure boundaries; actual third-party OAuth callbacks require staging tests.
- Enforce at least 80% instruction coverage and 60% branch coverage per application module, with every exported/public behavior tested and every HTTP endpoint integration-tested. JavaScript tooling must document its statement/V8 instrumentation mapping to the instruction requirement; do not claim JVM bytecode coverage. SQL receives explicit branch/scenario evidence rather than fictitious JavaScript coverage. Critical privacy, concurrency and deletion cases remain mandatory regardless of percentages.
- Use real migration ordering, structured sanitized errors/logs, external configuration, idempotency on all mutations and explicit failure handling. No secrets or personal text in logs, fixtures or commits.
- This specification is reviewable documentation. It does not authorize a production deployment, paid plan or a bypass of the adopted implementation/review gates. Do not import Java/Spring, financial-money, proprietary plugin or unavailable skill requirements into this app.

## 2. Shared types and limits

Create executable schemas under `src/contracts/` and generate database row types from migrations. Reject unknown keys on mutation DTOs and backups. HTTP uses camelCase; SQL uses snake_case. All timestamps are database-generated UTC RFC 3339 strings with explicit `Z` on output. UUIDs are validated canonical UUID strings. Revisions, workspace revisions, fencing tokens and epochs are nonnegative PostgreSQL `bigint`, serialized as decimal strings matching `^(0|[1-9][0-9]*)$`, bounded at `9223372036854775807`; never convert them to JavaScript `number`.

| Name | Contract |
| --- | --- |
| `MutationId` | Client-generated UUID, unique per authenticated user across all mutation kinds |
| `Revision` | `"0"` means absent; persisted record revisions start at `"1"` |
| `WorkspaceEpoch` | Starts at `"0"`; monotonically increases on import application for that course |
| `WorkspaceRevision` | Starts at `"0"`; increases once per successful study transaction affecting that course |
| `TextBody` | Exact text, including empty string; maximum 50,000 Unicode code points AND 200,000 UTF-8 bytes; reject U+0000 because PostgreSQL text cannot store it; do not trim/normalize learner text |
| `Status` | `not_started`, `in_progress`, `completed` |
| `Theme` | `system`, `light`, `dark` |
| `ReadingSize` | `normal`, `large`, `extra_large`; CSS mapping is the frontend contract |
| `ReadingFont` | `mono`, `proportional`; self-hosted font/fallback mapping is the frontend contract |
| `CourseVisibility` | `listed`, `withdrawn`; a course without an active version is never public |
| `AccountState` | `active`, `deleting`; absent profile is denied |
| `StudyRecordKind` | `progress`, `note`, `reflection`, `checklist`, `evidence` |

Externalize limits and display applicable limits before input/upload. Initial settings: text aggregate 10 MiB/user; 120 study mutations/minute/user with documented token-bucket burst of 30; imports/exports five creations/hour/user; deletion challenges five/hour/user; one active import/user; owner uploads ten/day and one nonterminal operation. Payload metadata is at most 64 KiB per HTTP request. A note near its maximum size travels through the Supabase RPC boundary, whose request/body allowance must be verified at bootstrap; do not route 200 KiB note bodies through the 64 KiB metadata endpoints.

Bound the pilot's total persisted study records to 10,000 per user, counting the five study record kinds above. Enrollments, preferences and operational rows are not counted as study records. Separately cap enrollment rows at1,000/user; each serialized enrollment is at most4 KiB with at most50 expanded milestone IDs. Enforce these bounds during normal navigation/import, including accumulated archived enrollments, and surface the course-workspace limit before starting another course. Preferences serialize within4 KiB. This makes complete export and transactional import measurable and bounded; reject new record creation with `QUOTA_EXCEEDED` while permitting edits/deletions that reduce usage. Do not evict work. Surface record usage alongside text usage. This newly explicit capacity rule must be reconciled with the earlier specs before release.

## 3. Schema conventions and exact relational invariants

Use application tables in exposed `public` only where RLS-protected SELECT is needed; operational secrets, counters, receipts and internal helper functions belong in unexposed `private`. Naming `public` does not imply public readability. All foreign-key columns are indexed unless already a leading primary/unique index. UUID primary keys default to database-generated random UUIDs except stable IDs accepted from a validated owner manifest. Every `created_at`/`updated_at` defaults to database time and cannot be supplied by browsers.

Use `ON DELETE RESTRICT` for content identities/history; no content removal cascades into learner data. Ordinary user-owned study rows cascade from `auth.users(id)`. Explicitly create composite unique keys needed as FK targets. Text enums use CHECK constraints or SQL enum types consistently; examples below use logical enums, not permission to skip constraints.

### 3.1 Content identities, versions and metadata

| Table | Required columns and constraints |
| --- | --- |
| `courses` | `id UUID PK`, canonical `slug TEXT NOT NULL UNIQUE`, `visibility`, nullable `active_version_id UUID`, timestamps. Slug lowercase ASCII `[a-z0-9]+(?:-[a-z0-9]+)*`, 1–80 characters. Composite FK `(id,active_version_id)` to `course_versions(course_id,id)`, deferred when needed for first publication. Deferred constraint trigger requires active target state `published`. |
| `course_routes` | `slug TEXT PK`, `course_id FK courses`, `is_canonical BOOLEAN`; unique partial index on `course_id WHERE is_canonical`. Canonical and alias slugs share this ONE namespace; maintain canonical row equal to `courses.slug` in trusted transactions. This replaces the logical separate `course_slug_aliases` table to make uniqueness enforceable. No alias chain: every row resolves directly to course UUID. |
| `course_versions` | `id UUID PK`, `course_id FK courses`, `version_label TEXT`, `schema_version INTEGER CHECK >0`, `state` in `draft/ready/published/invalid`, `source_hash` 64 lowercase hex, `title` 1–160 characters, `summary` 1–1200, `language` 1–40, `prerequisites JSONB` string array, `metadata JSONB`, nullable `published_at`, `created_at`. Unique `(course_id,id)` and `(course_id,version_label)`. Version labels obey documented SemVer syntax. Immutable public metadata belongs here, not on mutable `courses`; catalogue joins active version. Metadata schema contains declared learning outcomes/tools/estimates, not arbitrary HTML. |
| `lesson_identities` | PK `(course_id,lesson_id)`, course FK; stable lesson ID never reused for another lesson. |
| `item_identities` | PK `(course_id,lesson_id,item_id)`, FK `(course_id,lesson_id)`, `kind` in `section/checklist/reflection`; unique `(course_id,lesson_id,item_id,kind)` supports kind-sensitive FKs. Kind never changes. |
| `milestone_versions` | PK `(version_id,milestone_id)`, `course_id`, title, integer position CHECK >=0. Composite FK `(course_id,version_id)`, unique `(version_id,position)` and `(course_id,version_id,milestone_id)`. |
| `lesson_versions` | PK `(version_id,lesson_id)`, `course_id`, `milestone_id`, slug, title, integer position >=0, `required BOOLEAN`, `body_markdown TEXT`, `content_hash`, validated ordered section mapping, canonical sanitized AST JSONB, AST schema version and canonical AST SHA-256. Retain source Markdown and canonical model as the same validated snapshot; runtime render/search consume the accepted model. FK `(course_id,version_id)` to versions; FK `(course_id,lesson_id)` to identity; FK `(course_id,version_id,milestone_id)` to milestone. Unique `(course_id,version_id,lesson_id)`, `(version_id,slug)`, `(version_id,position)`. Position is course-wide, not independently duplicated per milestone. |
| `item_versions` | PK `(version_id,lesson_id,item_id)`, course, kind, label, position >=0, stable anchor. Composite FK to lesson version and kind-bearing stable item. Unique `(version_id,lesson_id,kind,position)` and `(version_id,lesson_id,anchor)` where anchor non-null. Section entries require non-null unique anchor; checklist/reflection anchors may be null if reached through their section. |
| `lesson_routes` | PK `(course_id,slug)`, `lesson_id`, stable identity FK. Maintains every current/historical lesson slug as a direct mapping. Publishing forbids assigning a historical slug to a different stable lesson. The pinned version must contain that lesson before rendering; otherwise show archived-work/current-outline state. Replaces logical `lesson_slug_aliases` with a unified route registry. |
| `reference_versions` | PK `(version_id,reference_id)`, course, slug/title/body/anchors, canonical sanitized AST JSONB, AST schema version and canonical AST SHA-256; FK to version/course; unique `(version_id,slug)`. References have no private completion keys. |
| `asset_versions` | PK `(version_id,asset_id)`, course, unique immutable storage path, media type, bytes CHECK >=0, SHA-256, purpose; version/course FK. Actual processed bytes/hash are authoritative, distinct from original upload hash. |
| `search_documents` | PK `(version_id,document_id)`, course, kind lesson/reference, source ID, nullable section ID, title/plain text. Validated source FK/transaction checks select exactly one source kind; no private user fields. Total serialized index <=2 MiB/version. |

Enforce accepted snapshot immutability with database triggers/grants, not only a disabled UI. At `ready`, content rows, metadata, accepted inventory and hashes are frozen. Publication may set state/published time once; rollback changes only the course pointer. A re-upload uses a new version UUID/label. No direct owner REST update bypasses the publication transaction. Metadata rollback follows the target version automatically.

### 3.2 Learner records

| Table | Required columns and constraints |
| --- | --- |
| `profiles` | `user_id UUID PK FK auth.users ON DELETE CASCADE`, nullable display name max100 characters, account state default active, timestamps. Auth trigger creates profile and quota row transactionally; absent trigger result is fail-closed. |
| `user_preferences` | user PK/FK, theme, reading size, reading font, focus BOOLEAN, revision bigint CHECK >=1, updated time. Absent row exposes defaults `system/normal/mono/false` with revision `0`. |
| `enrollments` | PK `(user_id,course_id)`, user FK cascade and course FK restrict, workspace epoch bigint >=0 default0, workspace revision bigint >=0 default0, nullable last lesson/section, nullable last activity, expanded milestone UUID array default empty, navigation revision bigint >=0 default0. Last lesson references stable identity; non-null section references a stable section in the same lesson. Enrollment rows survive replacement/import and are deleted only with account deletion. |
| `lesson_progress` | PK `(user_id,course_id,lesson_id)`, enrollment FK, stable lesson FK, status, nullable completed time/version, needs_review BOOLEAN default false, revision >=1, updated time. `status=completed` iff both completion fields non-null. FK `(course_id,completed_version_id,lesson_id)` to matching lesson snapshot. |
| `lesson_notes` | Same key/FKs as progress, body text, revision >=1, updated time; dual text limits. Empty string is stored; ordinary clearing does not delete a row. |
| `reflection_answers` | PK `(user_id,course_id,lesson_id,item_id)`, enrollment FK, fixed kind `reflection` CHECK, kind-sensitive stable item FK, body, revision >=1, updated time. |
| `checklist_answers` | Same key pattern, fixed kind `checklist`, checked BOOLEAN NOT NULL, revision >=1, updated time. False is data, not an absent record. |
| `lesson_evidence` | Same key/FKs as notes; body, revision, updated time; plain text self-report, no attachment execution or grading. |

All five study tables include user ID independently for RLS and use composite course/lesson constraints; a UUID existing somewhere is insufficient. Retained removed items/lessons are valid archived records. Withdrawal changes content access, not private ownership: authenticated users can read/export their own archived work. Writes to retained private records remain allowed for that same user; starting/completing a lesson requires a readable pinned snapshot. An unreadable withdrawn lesson cannot become newly completed through a crafted RPC.

### 3.3 Operational state

| Private table | Contract |
| --- | --- |
| `platform_owner` | Singleton `id SMALLINT PK CHECK(id=1)`, user FK with ON DELETE RESTRICT. No browser SELECT/write; trusted `owner_capabilities` read returns boolean only. Role is not JWT user metadata. |
| `user_quotas` | user PK cascade, `text_bytes BIGINT >=0`, `study_record_count INTEGER >=0`, `enrollment_count INTEGER` between0 and1000; initialized by auth trigger. All study mutations lock this row. State/usage is exposed through self-only read RPC, never direct table access. |
| `mutation_receipts` | PK `(user_id,mutation_id)`, operation name, canonical request SHA-256, bounded JSON result without bodies/tokens/signed links, creation/expiry; successful mutation receipt retained seven days. FK cascade except deletion acceptance receipt stored with job. |
| `security_counters` | scope/action/window key, count/tokens >=0, updated/expiry. No direct client access. Counters use trusted time and atomic updates; cleanup indexed by expiry. |
| `publish_operations` | UUID PK, owner/course/version, operation state, operation revision bigint >=1, archive path/hash, bounded report, lease owner UUID, lease expiry, monotonically increasing fencing token, timestamps. Nonterminal owner uniqueness enforced by partial index. |
| `data_operations` | UUID PK, user FK cascade, kind export/import, state, input/set hashes, selected courses, immutable preview data/token digest, resolution revision bigint >=0, validated resolution plan, result metadata, lease/fencing fields, expiry. Partial unique active-import/user. |
| `export_snapshot_rows` | PK `(operation_id,ordinal)`, frozen record JSON and serialized byte count; operation FK cascade. Contains private text, private schema only, 24-hour expiry. Materialize in a consistent transaction, then download by bounded chunks. |
| `transfer_parts` | PK `(operation_id,part_number)`, generated storage path, SHA-256, actual bytes/record count, state; unique generated path, no client-selected URLs. |
| `deletion_challenges` | UUID PK, user, original session reference, created/expiry, consumed flag; no raw bearer/provider tokens. Expire after ten minutes. |
| `deletion_jobs` | UUID PK, target UUID WITHOUT cascading auth FK, stage/state, minimum session evidence, created/updated/completed times, error category. One unfinished job/target. Retain completed operational details 30 days. |
| `deletion_ledger` | restricted deletion identifier/time and backup-expiry boundary, separately preserved off-provider; retained until every restorable backup containing that account expires. Not interchangeable with expiring job logs. |

Index operation state/expiry for cleanup and operator reconciliation. Copy no note bodies into receipt, validation report, audit event or deletion records. Opaque IDs may appear only where the recipient is authorized; generic error messages never expose other users' identifiers.

## 4. Authorization and grants

RLS is enabled on every exposed table. Apply explicit default privilege revocation in migrations; a new table/function must not accidentally inherit broad access. Browser roles have no table INSERT/UPDATE/DELETE privileges. Test grants as well as policies.

| Resource | Anonymous | Authenticated active learner | Owner | Trusted server/admin |
| --- | --- | --- | --- | --- |
| Listed active course and retained published snapshots | SELECT readable rows | Same | Same plus drafts | Workflow-specific access |
| Withdrawn course/draft content | Deny | Deny | SELECT authorized owner views | Required workflow access |
| Own learner rows/preferences/enrollment | Deny | SELECT self | SELECT self only | Import/export/deletion only after actor verification |
| Other learner rows | Deny | Deny | Deny | No general owner-facing inspection endpoint |
| Direct study/content table writes | Deny | Deny | Deny | Narrow transaction helpers only |
| Learner mutation RPCs | Deny | EXECUTE self | EXECUTE self | Avoid service credentials for ordinary learner calls |
| Private operational tables | Deny | Deny | Deny | Narrow server helpers/operator access |
| Course asset Storage | Published-version policy only | Published-version policy only | Own authorized draft/readable content | Staging/cleanup via workflow |
| Personal transfer Storage | Deny | Own operation authorized transfer only | Own only | Operation staging/cleanup |

`is_active_user()` must check an existing active profile, not merely JWT existence. Avoid a recursive policy on profiles; use a narrowly reviewed private helper with fixed search path and explicit authenticated UID, executable only where needed. Security-definer mutation functions set empty search path, fully qualify every object, prohibit dynamic SQL and derive actor from `auth.uid()`. Revoke PUBLIC/anon execute and grant authenticated execute individually. Function owner should have only required privileges; no function accepts browser `userId` as authority.

Service-only helpers accept the already verified actor UUID, recheck current profile/owner state and lock required rows. Server handlers verify bearer token through trusted Supabase authentication before calling helpers. Revoked/stale tokens cannot recreate profile/quota/enrollment after deletion. OAuth state/PKCE, local-return-path validation and exact callbacks follow the security baseline.

Storage policies bind paths to operation rows, actor, purpose, state and expiry, not just a prefix match. Upload authorizations are insert-only and cannot overwrite. Private download URLs expire in five minutes; personal objects/snapshots expire within 24 hours. Signed URLs are bearer secrets; never log them. Course asset signing permits visitors only after matching readable published course/version/asset policy. Withdrawal cannot recall previously downloaded bytes or still-valid signed URLs.

## 5. Transaction, idempotency and revision protocol

### 5.1 Common envelope and receipt behavior

Every HTTP mutation requires `Idempotency-Key: <UUID>` and body `mutationId` with the same value. This bridges the adopted engineering rule and existing shared DTO; a mismatch is `INVALID_INPUT`. Browser Supabase RPCs receive `mutationId` in the argument DTO because transport headers are not relied on for SQL authorization. Include endpoint/RPC name, schema version and canonical validated payload in request hash; exclude token, request ID and transport retry metadata.

Authenticate and bound/validate the envelope first. Receipt lookup is the first application mutation decision, before quotas, resource changes or external side effects. Authorization still runs on every request; a receipt never discloses data to a deleted user. Under the shared account lock, recheck the receipt before applying changes: same hash returns original result, different hash returns `IDEMPOTENCY_MISMATCH`. The receipt is inserted in the same transaction as its mutation. Simultaneous identical calls produce one effect. Do not cache failure as permanent success. Data-operation IDs provide durable workflow identity beyond individual request receipts until operation expiry.

A response includes `mutationId`, `requestId`, `replayed` and the authoritative revision/epoch metadata. Stored receipt excludes raw text. Idempotent replay returns the original acknowledgement, not a newly fetched body. If an import changed epoch since that receipt, include `workspaceChanged: true` and current epoch in the response; frontend refreshes and does not treat the acknowledgement as proof its current text survived the import.

### 5.2 Lock order

Use this order for any overlapping lock set:

1. Active profile row in shared lock mode for ordinary mutations; deletion obtains exclusive row lock. Ownership-changing transactions lock singleton owner row before profile locks; learner transactions never lock that singleton.
2. User quota row (`FOR UPDATE`) for study writes, preferences, import/export snapshots and account operational reservations.
3. Selected enrollment rows sorted by UUID, creating absent rows with `INSERT ... ON CONFLICT DO NOTHING` before locking. Never attempt to lock a nonexistent row as a serialization strategy.
4. Preference row when selected, then affected study rows in deterministic `(course,kind,lesson,item)` order.
5. Operation/receipt rows as required by the operation; no other path may reverse this order while also acquiring account/enrollment locks.

Publishing locks owner singleton then actor profile, course, operation and version in its separate graph; it does not acquire learner quota/enrollment locks. A publication helper must never invoke a learner mutation while holding publication locks. Cleanup uses short transactions and skips live leases/reference targets. Test deadlock scenarios with repeated concurrent actions.

### 5.3 Epoch and CAS rules

An enrollment's epoch is the identity of a course workspace generation. It is never accepted from backup data as new authoritative state. Every study write includes `expectedWorkspaceEpoch`; every record edit also includes `expectedRevision`. When an enrollment is absent, descriptor read returns virtual epoch/revision `0`; first creation persists epoch0. Imports never delete enrollments. An accepted import increments each selected course epoch once, even merge, invalidating all pre-import editors and delayed commands for those courses.

Validate epoch before record CAS. Mismatch returns `WORKSPACE_CHANGED`; do not automatically resubmit against a fresh epoch. The editor retains its draft and offers explicit comparison/recovery. Within one epoch, record revision only increases; missing record expects0 and first write yields1. Clearing text stores empty body; it cannot recycle revision1. Import may remove/recreate records because it always advances epoch; newly inserted rows start1 and retained changed rows increment revision. Imported revision/timestamp values are historical metadata, never trusted CAS authority. Workspace revision monotonically increases and never resets, including on replace. Revision overflow fails safely with an operational error, never wraps.

Every successful logical study change increments workspace revision once. A no-op returns current state without revision/workspace increments, but still records its idempotent result. Start/resume/navigation state changes also increment workspace revision, deliberately making import preview conservative. Record-level revisions protect independent records; changes to another checklist item do not conflict with the current item's CAS. Account quota serialization protects accounting, not semantic conflict resolution.

Quota enforcement computes byte delta with PostgreSQL `octet_length` and character length with `char_length`; JavaScript uses Unicode code points rather than UTF-16 code units. Count all note/reflection/evidence bodies. Quota decreases are always permitted for an active account. Study-record count deltas use actual inserted/deleted rows, never client claims. No browser can write counters.

Rate-limit counters must commit rejected-attempt accounting. Expected rate/conflict/validation outcomes use typed results rather than throwing and rolling back their counters. Cheap syntactic failures before an authenticated DB call are bounded at the HTTP/edge boundary; RPC entry functions count authenticated attempts before semantic checks. Unexpected transaction failures may roll back their counter update, so platform abuse controls remain necessary. Receipt replay does not consume the normal successful-write budget; a separate bounded request budget prevents replay floods.

## 6. Read contracts

Public reads resolve course route to stable course UUID and active published version, then pin that version for outline, lessons, references, search and asset requests. No component independently rereads a new active pointer mid-page. Query keys include environment/course/version; private keys also include user ID. Return public metadata only from active-version joins. Use stable ordering with explicit IDs as pagination tie breakers.

Required read adapters: catalogue (paginated title/summary), course descriptor (active version plus immutable metadata), pinned outline, lesson model, references, search index parts, current user workspace descriptor, records for one lesson, archived work, preferences, My Learning, usage, owner capabilities and authorized operation status. Private read page sizes default100/max500. A lesson read combines public and private queries only in the client; never place learner data in a public cache payload.

Workspace descriptor returns `{courseId, workspaceEpoch, workspaceRevision, navigationRevision, lastLessonId, lastSectionId, expandedMilestoneIds}`. Lesson state contains explicit absent records with revision0 where required. A read of an unknown/unauthorized private ID yields generic NOT_FOUND; do not distinguish another user's existence. Private responses use `Cache-Control: no-store`. Account changes cancel requests, dispose coordinators and clear old user query caches.

## 7. Browser RPC contracts

The following table defines exact logical fields; executable schemas reject extras. All commands contain `{schemaVersion:1, mutationId}`. `CourseCommand` adds `{courseId, expectedWorkspaceEpoch}`. `RecordCommand` adds `{lessonId, expectedRevision}`. Optional means omitted; nullable means explicit null accepted. Successful responses always include request/mutation metadata; course responses include current epoch/workspace revision, record responses include record revision and updatedAt.

| RPC | Additional fields | Required transaction behavior/result |
| --- | --- | --- |
| `start_lesson` | CourseCommand + `versionId`, `lessonId`, optional `sectionId` | Require readable matching lesson/section; create enrollment if absent; create in-progress if no progress; never downgrade completed. Update resume/activity. Return progress metadata/status and workspace descriptor. No record expected revision because operation only conditionally promotes absent/not_started. |
| `set_lesson_status` | CourseCommand + RecordCommand + `versionId`, `status` | CAS whole progress revision; preserve needsReview. Completed sets DB time/version; reverse clears completion fields. Return status/completion/needsReview/revision. Completion requires readable pinned lesson; unrelated version rejected. |
| `set_review_flag` | CourseCommand + RecordCommand + `needsReview:boolean` | CAS progress, preserve status/completion; absent progress starts not_started with requested flag. |
| `save_note` | CourseCommand + RecordCommand + `body:TextBody` | Epoch/CAS, text quota delta, return acknowledgement only. |
| `save_reflection` | CourseCommand + RecordCommand + `itemId`, `body` | Require retained stable item kind reflection in same lesson. |
| `set_checklist` | CourseCommand + RecordCommand + `itemId`, `checked:boolean` | Require checklist kind; one-item CAS. |
| `save_evidence` | CourseCommand + RecordCommand + `body` | Same text/CAS rules as note. |
| `touch_resume` | CourseCommand + `versionId`, `lessonId`, nullable `sectionId` | Validate readable stable section; update activity using DB time. Client coalesces to one per15 seconds plus section changes. Last committed navigation wins across devices. |
| `save_navigation` | CourseCommand + `versionId`, `expandedMilestoneIds:UUID[]`, `expectedNavigationRevision` | New required operation: distinct IDs, each in pinned version, max50 IDs and no more than manifest milestones; CAS navigationRevision; update enrollment and workspace revision. Never writes record text/status. |
| `save_preferences` | `expectedRevision`, nonempty `patch` containing only theme/readingSize/readingFont/focus | Lock account then preference; CAS; increment preferences revision once if changed. No course workspace increment. Return full preferences plus revision. |
| `save_profile_name` | nullable `displayName` max100 | Only profile display name, no role/state/provider fields. Last committed value wins; protected by idempotency/account lock. |

Example note request:

```json
{
  "schemaVersion": 1,
  "mutationId": "11111111-1111-4111-8111-111111111111",
  "courseId": "22222222-2222-4222-8222-222222222222",
  "lessonId": "33333333-3333-4333-8333-333333333333",
  "expectedWorkspaceEpoch": "2",
  "expectedRevision": "7",
  "body": "The window boundary admits a second burst."
}
```

Example success payload, with opaque request ID generated by the server:

```json
{
  "ok": true,
  "mutationId": "11111111-1111-4111-8111-111111111111",
  "requestId": "req_example",
  "replayed": false,
  "workspaceChanged": false,
  "data": {
    "workspaceEpoch": "2",
    "workspaceRevision": "38",
    "revision": "8",
    "updatedAt": "2026-11-26T20:30:00.000Z"
  }
}
```

Expected conflicts return `{ok:false,error:{code,message,requestId,fieldErrors?,currentRevision?,currentWorkspaceEpoch?,retryAfterSeconds?}}`; no private body in errors. The authorized client fetches the conflicting current record separately. Data API adapters normalize this union; do not falsely promise that Supabase SQL RPC results always have the custom HTTP status used by Vercel handlers.

## 8. Save coordinator and private local state

One coordinator per environment/user/course/lesson/field/item. IndexedDB drafts include record key, base revision, workspace epoch, exact body, local generation, update time and frozen in-flight mutation when applicable. Drafts are not an offline authoritative database. Do not create anonymous private notes.

1. Load server snapshot and matching same-user local draft. If bases differ, show recovery comparison rather than silently selecting newest timestamp.
2. Each edit advances local generation, marks dirty immediately and attempts IndexedDB persistence. Cloud debounce800ms, maximum sustained interval5 seconds.
3. Permit one in-flight request per record. Freeze body/epoch/revision/mutation ID; typing never changes the submitted snapshot.
4. On acknowledgement, advance known server revision only for the matching request. Mark Saved only if acknowledged generation equals current generation and epoch is unchanged.
5. Queue newer text against acknowledged revision. A lost response retries identical frozen payload/ID with exponential backoff/jitter, delays1,2,4,8,16,30 seconds with bounded jitter, then stopping automatic retries and requiring manual Retry while preserving draft and exposing Retry.
6. Conflict/workspace change pauses automatic writes. Provide server/local comparison, keep server or explicit merged save using newly fetched epoch/revision and a new mutation ID. Never retry stale data simply by substituting latest revision.
7. Account expiry preserves recoverable same-user draft; explicit logout offers save/retry or download/discard, then clears private drafts/caches. Failed IndexedDB preservation is disclosed; keep text in memory and offer download.
8. Internal navigation preserves the coordinator/draft until acknowledged or recoverable; browser unload cannot be the durability mechanism. Import success invalidates all affected queries/coordinators; another device discovers epoch changes through its next read/write/focus refresh.

## 9. HTTP operation contracts

Base `/api/v1`; JSON metadata requests, bearer token for private/owner routes, strict same-origin/CORS configuration, 64 KiB metadata cap. GET reads do not need idempotency headers. Successful synchronous command returns200/201; durable accepted-but-not-complete operation returns202 with operation ID/state/status URL. Return no202 without committed durable state. Errors use the envelope above. A timeout is outcome unknown, not rollback.

| Route | Request/response contract |
| --- | --- |
| POST `/owner/uploads` | Body schemaVersion/mutationId, courseId (existing or declared new stable ID), versionLabel, archiveBytes; validate ownership/limits; return operationId/generated path/insert-only upload authorization/expiry. |
| POST `/owner/uploads/:id/confirm` | mutation envelope only; inspect actual stored metadata/hash under recorded path; return uploaded state. Added explicit confirmation transition. |
| POST `/owner/uploads/:id/validate` | mutation envelope; acquire lease/fence; await bounded validation; ready/invalid report with sanitized file/field errors. |
| POST `/owner/uploads/:id/cancel` | mutation envelope + expectedOperationRevision; CAS operation revision and cancel only before publication and with no live validation lease; reject live lease with CONFLICT, increment fencing token to exclude expired workers, release reservation, defer safe cleanup. |
| GET `/owner/uploads/:id` | owner-scoped state/report/lease expiry, no raw archive or secrets. |
| POST `/owner/courses/:id/publish` | mutation envelope + operationId, targetVersionId, expectedActiveVersionId nullable; atomically verify ready immutable inventory and switch pointer. |
| POST `/owner/courses/:id/rollback` | mutation envelope + targetVersionId, expectedActiveVersionId; retained published complete target only; preserve learner records. |
| POST `/owner/courses/:id/withdraw` | mutation envelope + expectedActiveVersionId; set withdrawn, preserve pointer/history/private work; signing/read policies deny withdrawn public content. |
| GET `/assets/:assetId/url?versionId=...` | Visitors allowed only for readable published matching asset; owner required for draft. Return five-minute URL/expiry; no-store response and bounded signing abuse counters. |
| POST `/me/exports` | mutation envelope + courseIds UUID array or `all:true`, includePreferences boolean; create frozen snapshot/set operation; return operationId/state. Reject mixed all/courseIds. |
| POST `/me/exports/:id/continue` | mutation envelope; generate next bounded part from frozen snapshot under lease; return progress or completed index; retry safe. Client explicitly awaits/calls continuation, no hidden background work. |
| POST `/me/imports` | mutation envelope + declared set manifest/part inventory sizes/hashes; reserve generated private part paths; return operationId/upload authorizations. Legacy single-file schema accepted through one-part adapter. |
| POST `/me/imports/:id/preview` | mutation envelope + selectedCourseIds, includePreferences; validate actual uploaded bytes/hashes/all parts; persist immutable preview and return token/counts/conflicts. |
| POST `/me/imports/:id/resolutions` | mutation envelope + previewToken, expectedResolutionRevision, choices array max100 within64KiB; store allowed keep_current/use_imported choices by preview conflict key; CAS/increment resolution revision and return it. |
| POST `/me/imports/:id/apply` | mutation envelope + previewToken, mode merge/replace, selectedCourseIds, includePreferences, expectedResolutionRevision; applies stored complete resolution plan in transaction described below. |
| POST `/me/imports/:id/cancel` | mutation envelope; terminal cancellation before apply; cleanup expiry still applies. |
| GET `/me/operations/:id` | Own active-account operation state, counts, bounded result metadata and fresh signed download links when appropriate. |
| POST `/me/deletion-challenges` | mutation envelope; one-use challenge bound to authenticated UID/original session, expires10minutes. |
| POST `/me/deletion` | mutation envelope + challengeId + confirmation string `DELETE MY ACCOUNT`; verify new same-user session after challenge; commit deletion job/tombstone, await stages within request budget. |
| GET `/health` | Release/build status only; no database contents, credentials or identity. |

All owner transitions use operation state/fencing checks; API surface does not grant permission to reuse mutable upload paths. New cancellation/confirmation/continuation routes close workflow gaps in earlier endpoint tables and require integration tests.

## 10. Complete export and import

### 10.1 Backup format and bounded complete export

Preserve ordinary single-file JSON exports where they fit. Backup schemaVersion2 supports a complete multipart set. Each part is valid UTF-8 JSON <=20 MiB and <=10,000 records. The same aggregate128 MiB/ten-part cap applies to both export and import sets; the20 MiB limit is per part, not per complete set. Full set is capped128 MiB and ten parts; the account record/text quotas above make the serialized representation fit this bound. Every study record's metadata encoding is limited to4 KiB; at most1,000 enrollment records add at most4 MiB and preferences at most4 KiB. Text worst-case JSON escaping is budgeted at6 times the10 MiB raw UTF-8 quota. The10,000 study metadata rows consume under40 MiB, so text plus metadata remains below105 MiB before small bounded index/part framing, within128 MiB. Reject contract changes that invalidate that size proof without revising quotas/set limits. Preference/profile tokens/provider metadata are excluded; optional personal display name is not part of study backup.

The index contains `schemaVersion:2`, `exportId`, `exportedAt`, selected course IDs, includePreferences, total records/bytes, and ordered parts `{partNumber, filename, bytes, sha256, recordCount}`. Each part contains exportId/partNumber and records. No user/owner/provider IDs or access tokens. Each record discriminates kind and contains course/lesson/item IDs as applicable, content-version references where meaningful, value, original timestamp and revision as historical strings. Export enrollment state (resume/expanded groups) separately from counted study records; preferences include theme/reading size/reading font/focus. Unknown properties are invalid. Exported source epochs are diagnostic only, never accepted as destination concurrency authority.

Create snapshot in one SQL transaction while holding user quota lock, copying selected study/enrollment/preferences into private snapshot rows in deterministic order. All relevant writes acquire that same lock. Snapshot time is consistent; subsequent chunk reads read only frozen rows, not live tables. Do not hold a database transaction open across HTTP/Storage calls. Release account locks after materialization. Measure maximum snapshot transaction during spike; if it cannot meet runtime budget, redesign before launch rather than silently weakening consistency.

Part generation uses bounded pages of frozen rows and actual UTF-8 serialized byte counting, ending a part BEFORE exceeding limit. A single permitted record always fits a part. Generated objects use operation/part identities, insert-only staging and hash verification; retry reuses the accepted part. Continuations persist cursor/part state under lease and never return before their bounded work completes. Completed operation provides index and every part for download, with an explicit complete-set UI; no truncation/per-course-only dead end. Expire snapshot rows and objects within24hours. Losing an operation to expiry requires a fresh export.

### 10.2 Import validation and preview

Accept schemaVersion1 legacy single-file exports and schemaVersion2 complete sets through an explicit conversion to the same internal records. Validate all parts before preview: size/depth (maximum16), UTF-8, index/hash/part count, duplicate records, declared totals, strict fields, known stable identities/kinds, valid completion version relationships, text limits and final quotas. An incomplete set is not a partial import. Unknown course/item is a reportable error; retained removed identities are valid. Preserve the original user file; report only safe record coordinates/error categories, never dump private bodies into logs.

Preview stores input hash, selected courses, mode-independent old values/fingerprints, per-course epoch/workspace revision, and preference revision when included. Token is opaque random32bytes, stored as digest, bound to user/operation/input/selection, expires15minutes. A new preview invalidates the old token. Return counts insert/unchanged/change/conflict/delete for both merge and replace, plus paginated authorized conflict records; each resolution references a stable conflict key, not a client-selected arbitrary row. Provide downloadable validation report for unknown IDs. Choices are `keep_current` or `use_imported`; persist them through bounded idempotent batches, with a resolution revision starting0 and CAS on each batch. Re-preview clears the resolution plan. Apply checks the complete stored plan and expected resolution revision, so 10,000 conflicts never require an oversized metadata request. Manual editing occurs in the normal editor after import, avoiding an unbounded third text payload in apply metadata.

Preferences are a separate selection and conflict domain. If selected, preview captures expected preference revision including0 for absent. Any subsequent `save_preferences` makes apply conflict. If excluded, apply does not inspect, lock for change or overwrite preferences. Resume/navigation import is explicitly shown in preview; merge keeps current enrollment navigation unless absent, replace uses selected imported navigation after validating retained IDs.

### 10.3 Atomic application

1. Authenticate, check receipt, acquire account lock and selected enrollments in UUID order, then preference/affected records as defined above. Recheck active user, operation state/hash/token expiry, all chosen records and final quotas.
2. Compare every selected course's current epoch AND workspace revision to preview. Compare preference revision if included. Any mismatch returns CONFLICT without study changes; require preview again. A record's timestamp alone never resolves conflict.
3. Merge inserts absent, leaves equal unchanged, requires one explicit resolution for every differing value. Replace removes only selected-course study records and inserts validated selected replacements. Never delete account/profile/enrollment/receipts as a shortcut.
4. Increment each selected course epoch and workspace revision exactly once, even if its data values happen to match. Assign server revisions/timestamps, preserving imported historical provenance only where the schema explicitly permits it. Increment preferences revision only if preferences actually change.
5. Apply quota/record-count deltas, set operation applied and record success/affected epochs in the SAME transaction. Commit all selected courses/preferences together or none.
6. Same operation retry returns recorded outcome even with a new transport mutation ID; cannot reapply an already-applied set. Reusing a mutation ID with different input is still rejected. Subsequent writes use new epoch; old drafts get recovery UI.

Offer a pre-import export before replace. Do not require it as permission to perform an already explicitly confirmed replace. Show exact selected courses, counts and preference inclusion before confirmation. No inferred global reset.

## 11. Account deletion and restoration

Fresh authentication is a new active Supabase session created after the challenge, for the same UID; token refresh `iat` is not evidence. Session existence and creation time must be checked using a trusted supported provider path at implementation time. If the provider configuration cannot prove it, stop deletion with an actionable verification error, never weaken to browser claims. Provider SSO may reauthenticate without asking a password; explain that honestly.

Deletion locks singleton owner then profile exclusively; recheck owner restriction, consume challenge, create durable job, mark profile deleting and write restricted deletion ledger in one transaction. Existing study transactions hold profile shared locks; they finish before deletion's tombstone or are denied afterwards. An owner cannot be deleted until trusted reassignment and draft ownership resolution. No public role reassignment endpoint.

Stages: accepted → replicating_ledger → clearing_transfers → deleting_auth → completed; retryable failure retains last safe stage and error category. Require an acknowledged durable off-provider ledger write before advancing past replicating_ledger. If ledger replication fails, keep account tombstoned/job pending and resume with the same deletion identity; do not report completion. Clear private export snapshots/transfers and owned draft uploads; retain published assets/history. Delete Auth user through trusted admin path, causing ordinary learner cascades. Treat already-missing objects/user as idempotent success, but verify correct target/path before deletion. Mark job complete without needing the deleted user's session. No endless in-request loop or fire-and-forget continuation; trusted operator reconciliation resumes interrupted jobs.

While tombstoned, normal user APIs deny access. The original deletion request may finish returning job acknowledgement after tombstone; do not invent a broad unauthenticated status endpoint. If it times out, UI says deletion requested/status unavailable and directs to support; operator verifies durable job. A signed-out/deleted user is not promised authenticated polling. Clear local tokens/caches/drafts on confirmed acceptance and display accurate pending/complete state from the response.

Completed job details expire30days. Preserve deletion ledger independently until the last backup capable of restoring that account expires, and copy it off-provider for each accepted deletion with durable acknowledgement before the deletion job can complete. Ledger replay/upsert uses deletion identity for idempotency; an ambiguous external write is verified or retried, never treated as acknowledged. Restoration must obtain latest ledger, apply deletions before public service/auth is enabled, then verify old sessions cannot read/recreate rows. A stale restored ledger is a release blocker. Backup destination/scheduler/key recovery remain owner deployment inputs.

## 12. Errors, resilience and operational evidence

| Code | HTTP equivalent | Client behavior |
| --- | --- | --- |
| UNAUTHENTICATED |401| Preserve draft; same-user login |
| FORBIDDEN |403| Stop action; no automatic retry |
| NOT_FOUND |404| Generic unavailable resource; avoid existence leak |
| CONFLICT |409| Fetch authorized state/new preview; preserve local text |
| WORKSPACE_CHANGED |409| Epoch invalidation and explicit draft recovery |
| IDEMPOTENCY_MISMATCH |409| Programming/request identity error; never silently replace ID and repeat a destructive action |
| INVALID_INPUT |422| Bounded field errors; preserve submitted text |
| TOO_LARGE |413| Explain applicable bytes/records limit and complete export-set alternative |
| QUOTA_EXCEEDED |422| Show self usage and export/delete/reduce options; no eviction |
| RATE_LIMITED |429| Retry-After and visible unsaved state |
| OPERATION_EXPIRED |410| Recreate upload/preview/export, original file unchanged |
| RETRYABLE_FAILURE |503| Same mutation/operation retry with bounded backoff |

Timeout of a mutating request means unknown outcome. Use receipt-safe retry or operation GET before creating another operation. Do not retry malformed/conflicting requests automatically. Outbound Auth/Storage operations have configured timeout smaller than remaining function deadline, bounded attempts and deterministic operation-derived object identities. Never log full fetch exceptions that include authorization headers/signed URLs; normalize categories first.

Observability records request ID, operation kind, duration, status/error category, content version and aggregate counts. No note/reflection bodies, names/emails, IP histories, provider credentials, signed URLs or raw bundles. Restricted operational records may reference authorized opaque actors; general telemetry uses request/operation references. Alerts cover stuck operations/deletions, failed backup/ledger replication, quota pressure and latency; notification destinations remain deployment inputs.

## 13. Tests-first implementation and release evidence

Build and review this domain in the following sequence; each chunk records red failure, green result and reviewable diff:

1. Shared executable DTOs/limits and backup fixture schemas; malformed/unknown fields, string bigint, Unicode byte/code-point and U+0000 tests.
2. Ordered migrations, constraints, grants and auth-trigger initialization; fresh/upgrade migration tests using real Postgres.
3. Account locks, receipt protocol, epoch/CAS and quotas; concurrency tests through separate real Data API clients.
4. One end-to-end note coordinator with real storage/RPC before adding remaining record types.
5. All progress/navigation/preferences APIs, archived work and public/private read policies.
6. Frozen export snapshots, complete multipart generation and import preview/apply with real Storage.
7. Deletion challenge/session adapter, tombstone/cleanup/recovery and restoration ledger.
8. Maximum-volume timing, browser journey, adversarial tests and independent review of definer functions/grants.

Required assertions, not merely successful HTTP statuses:

| Scenario | Evidence |
| --- | --- |
| Two first saves against absent note/epoch0/revision0 | One insert wins; second conflicts; count/text accounting increments once |
| Same mutation concurrently or after lost response | One change/receipt; same acknowledgement; altered payload conflicts |
| Note A in flight while B typed | A acknowledgement does not label B Saved |
| Two devices editing same record | Both bodies preserved for comparison; no last-write-wins overwrite |
| Import replaces revision1 record, stale editor submits revision1 | WORKSPACE_CHANGED despite matching numeric record revision |
| Import removes record, stale absent/old editor recreates it | Old epoch rejected; no resurrection |
| Preferences saved after preview | Apply conflicts if included; excluded preferences remain unchanged |
| Same course independent checklist items | Both explicit values persist with independent revisions |
| Replace selected A while B exists | B unchanged; all A changes atomic; workspace epochs never reset |
| Import crash/timeout at commit boundary | Retry returns same applied operation; no duplicate epoch increments |
| Worst-case quotes/control characters/Unicode near quota | Complete multipart round-trip, exact text preserved, no byte truncation |
| Extra/missing/hash-mismatched backup part | Preview rejects without changing any learner row |
| Anonymous/A/B/owner/deleting principals | Direct SELECT/write/RPC/Storage matrix verified with real credentials; owner cannot see B notes |
| Forged course/version/item kind | Composite constraints and RPC checks reject; rows/counters consistent |
| Role metadata edit/direct execute/private-schema access | No escalation; PUBLIC/default grants audited |
| Stale bearer token during/after deletion | Cannot read/recreate private rows or quota/profile |
| Deletion concurrent with a note save | Save commits before tombstone or fails after it; no post-deletion resurrection |
| Storage/Auth cleanup fails midway | Durable stage resumes; published assets survive |
| Restore older backup after deletion | Latest independently retained ledger removes deleted identity before public access |
| Live operations vs cleanup | Lease/reference guard prevents deleting live objects/snapshot parts |

Run a15-minute20-session/five-editor workload, maximum10,000-record import/export, worst-case escaped text, and account deletion with populated transfers. Record transaction latency/lock waits, memory, function duration and serialized sizes. Largest awaited unit requires at least2x measured duration headroom within configured runtime. Failure means revise bounded chunk design or explicit limits before release, not pretend the timeout rolled back. Keep schema/query plans and sanitized evidence in application `docs/verification/<release>/`.

A passing coverage percentage cannot waive any privacy, stale-draft, complete-export, corruption or recovery case. Documentation checks do not count as these implementation tests.

## 14. Reconciliation decisions and unresolved deployment inputs

This specification makes concrete engineering decisions: version-owned catalogue metadata; unified slug registries; non-resettable course epochs; explicit navigation/name RPCs; separately checked preference revisions; multipart complete backups with account record bound; upload confirmation/cancellation and export continuation endpoints; profile locks around deletion; and deletion status behavior after access revocation. Update affected earlier technical tables/contracts when integrating this pack; retain one authoritative wire schema in implementation.

Owner inputs still required at their relevant deployment gate: hosting/repository access, real OAuth configuration, owner UUID, commercial eligibility, audience region/residency, support contact, backup/ledger destination and scheduler/key recovery, and approved operational notification preferences. Secrets are configured through protected environment/provider settings, never pasted into this document. None of these missing deployment inputs justify blocking local schemas, fixtures, migrations or tests.

Context used: all files in the [technical reading map](planning/technical/README.md), [product scope](planning/01_PRODUCT_AND_SCOPE.md), [personal-data requirements](planning/05_AUTH_DATA_AND_SYNC.md), [acceptance requirements](planning/09_ACCEPTANCE_AND_QA.md) and adopted general rules in [CLAUDE.md](planning/CLAUDE.md). No implementation or vendor-capacity verification is claimed by this document.
