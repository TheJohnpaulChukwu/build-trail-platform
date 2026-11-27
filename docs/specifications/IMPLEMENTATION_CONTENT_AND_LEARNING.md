# BuildTrail implementation specification: content and learning

Status: implementation-ready design; no application implementation is claimed. This document specifies the public course pipeline and learning interface. Preserve every file under `courses/rate-limiter-python/`. Implement the application and adapted content in `/home/jchukwu/Documents/code/build-trail-platform/`.

Sources: [product](planning/01_PRODUCT_AND_SCOPE.md), [mobile design](planning/02_DESIGN_AND_MOBILE_UX.md), [learning](planning/03_LEARNING_AND_VISUALS.md), [public adaptation](planning/04_CONTENT_AND_PUBLIC_STARTER.md), [publishing architecture](planning/technical/05_CONTENT_AND_PUBLISHING.md), [frontend architecture](planning/technical/06_FRONTEND_AND_VISUALS.md), [shared API protocol](IMPLEMENTATION_DATA_AND_API.md) and [application routes/save coordinator](IMPLEMENTATION_APPLICATION.md), and [engineering rules](planning/CLAUDE.md). Apply the generic security, validation, idempotency, real-component integration testing, coverage, configuration and error-handling rules; Java, Spring and finance-specific prescriptions do not define this TypeScript/Python project. Instructions below are concrete design decisions, not assertions that validation has already passed.

## 1. Ownership and delivery boundaries

The browser presents lessons and teaching simulations; it does not run learner Python, grade submissions, or operate the learner's filesystem. Progress and evidence are self-reported. First publication includes all 30 lessons and five milestones of 7/7/6/5/5 lessons, three interactive demos, a visual for every lesson, references and a standalone starter. A second internal two-lesson course verifies that the platform does not hardcode those counts.

Canonical source lesson bodies are the individual lesson Markdown files. `COURSE.md` supplies preparation, shared rules and references only. Its duplicated lesson bodies and starter source appendices must not create second imported lessons or duplicate downloads. Changes happen in `content/public/rate-limiter-python/`, with a traceable adaptation report. Legacy ShipThatCode fixtures are optional compatibility material and are not redistributed. No learner needs access to the owner's Downloads directory or third-party account.

Implementation modules use the single-package application layout: `src/contracts/content` owns schema types and limits; `src/content` owns shared AST conversion, safe rendering and validation; `server/publishing` owns archive handling and publication orchestration; `src/features/catalogue` owns course reads; `src/features/publishing` owns upload/preview UI; `src/features/demonstrations` owns pure models and renderers. Server publication use cases depend on narrow storage/database interfaces. Do not put privileged credentials or publication code in browser imports.

## 2. Exact bundle contract

A ZIP has one root `manifest.json`; declared Markdown under `lessons/` and `references/`; declared PNG/JPEG/WebP under `images/`; and text downloads under `starter/`. No enclosing directory, arbitrary extra files or nested archives. Generated reports/search/starter ZIP are server outputs, not trusted bundle inputs.

Configured default limits: compressed 10 MiB; expanded actual bytes 25 MiB; 200 entries including directories; manifest 256 KiB, depth 12; Markdown 1 MiB/file; starter text 1 MiB/file; image 5 MiB/file, decoded 20 megapixels and 10,000 pixels/side. Search output is at most 2 MiB UTF-8 JSON. Reject excess rather than truncate. Every string and array below also has schema bounds. A smaller server execution budget may reject a bundle before these ceilings; report the failed limit and offer correction.

All manifest objects are strict: unknown keys fail. Required fields are listed below; fields marked optional may be omitted, never implicitly `null`. UTF-8 text, no BOM, LF normalization for authored Markdown; hash original bytes separately from normalized output. IDs are canonical lowercase UUID strings, allocated once and committed to the authoring manifest. IDs are never regenerated from titles, indexes or content hashes. Labels use SemVer `major.minor.patch` without build/prerelease suffix for v1. Slugs match `[a-z0-9]+(?:-[a-z0-9]+)*`, 1–80 characters. Versions are unique per course. Array order is authoritative; no independent order integer can disagree.

| Object | Required fields and bounds | Optional fields |
| --- | --- | --- |
| Manifest | `schemaVersion: 1`, `course`, `version`, `milestones`, `lessons`, `references`, `assets`, `starter` | None |
| course | `id`, `slug`, `title` 1–160 chars, `summary` 1–1200 chars, `language` 1–40 chars, `prerequisites` array of 0–20 strings (1–300 chars each) | `learningOutcomes` up to 20 strings (300 chars), `tools` up to 20 strings (120 chars), `estimatedHours` `{min,max}` finite numbers with 0 < min <= max <= 2000 |
| milestone | `id`, `title` 1–160 chars, `lessonIds` array 1–200 unique lesson UUIDs | `summary` up to 500 chars |
| lesson | `id`, `slug`, `title` 1–160 chars, `path`, `required` boolean, `prerequisiteLessonIds`, `newTools`, `verification`, `sections`, `checklist`, `reflections`, `demos`, `visuals` | `estimatedMinutes` integer 1–10000 |
| section | `id`, `stage` enum `understand/build/verify/reflect`, `anchor`, `heading`, `role` | None |
| checklist item | `id`, `label` 1–500 chars | None |
| reflection item | `id`, `prompt` 1–2000 chars | None |
| reference | `id`, `slug`, `path`, `title` 1–160 chars, `sections` | None |
| reference section | `id`, `anchor`, `heading` | None |
| asset | `id`, `path`, `mime`, `sha256`, `purpose` 1–500 chars, `license` | `alt` up to 1000 chars; required and nonempty when displayed as teaching image |
| starter | `files`, `readme`, `license` | None |
| starter file | `id`, `path`, `sha256`, `purpose` 1–500 chars, `license` | None |
| license | `kind` enum `original/permission/open-license`, `statement` 1–2000 chars | `sourceUrl` HTTPS URL and `licenseId` 1–80 chars; required for open-license |
| demo binding | `id` registered renderer enum, `sectionId`, `preset` registered preset enum | None |
| visual binding | `id` UUID, `rendererId`, `sectionId`, `sourceExample` 1–1000 chars, `caption` 1–1000 chars, `alternative` 1–4000 chars, `data` registry-specific strict JSON | None |

Additional exact bounds: 1–50 milestones, 1–200 lessons, 1–50 references, 0–150 assets, 1–150 starter files, 1–80 sections per document, 1–20 checklist items per lesson, 1–10 reflections per lesson, 0–3 demo bindings, 1–10 visual bindings, up to 199 prerequisites and 20 newTools per lesson. All counts remain subject to the archive entry ceiling. `newTools` is an array of 1–120-character names. `verification` is one of `learner-authored`, `supplied-tests`, `mixed`. UUID uniqueness applies across all content/item IDs in the bundle; registered renderer IDs are references, not UUID identities.

`section.anchor` is the persistent slug-form fragment (1–100 chars); `section.heading` is the exact visible heading text (1–200 chars). `role` is one of `objective/situation/explanation/example/task/guided-exercise/acceptance/commands/hint/reflection/stretch/checklist/milestone/reference`. Repeated role values are allowed; anchors are unique per document. Paths are case-sensitive normalized POSIX relative strings of at most 240 bytes and must match the correct directory and extension. `mime` is exactly `image/png`, `image/jpeg` or `image/webp`; hash is lowercase 64-character SHA-256 hex. Assets have no executable type.

Every lesson appears exactly once across milestone lessonIds. Every listed prerequisite exists in the same version, precedes the lesson in the course order and does not form a cycle. Slugs are unique within their resource kind/course. Every source path is declared once. Every demo/visual sectionId refers to a section of that lesson. No dangling item IDs. Empty course prerequisites, lesson prerequisiteLessonIds, newTools, demos and assets arrays are explicitly valid (in particular for a beginner course or lesson 1). Other arrays may not be empty unless explicitly permitted above. Readme points to a listed `.md` starter file. A new upload cannot reuse a stable lesson/item ID for a different semantic task; validation compares identity history and requires owner resolution for conflicting reuse.

### Version metadata and database projection

`courses` stores stable identity, canonical slug, active version pointer and lifecycle fields. It does **not** own mutable published title, summary, language or prerequisites. `course_versions` stores immutable `title`, `summary`, `language`, `prerequisites`, `metadata` (learningOutcomes/tools/estimates), version label, accepted source hash, normalized manifest hash, schema/renderer contract versions and publication lifecycle. The active catalogue joins courses to its active published version. Old lessons and previews always show their own version's metadata. This resolves the previously unspecified metadata persistence location.

Project manifest milestones, lesson versions, sections and item definitions into version-scoped rows with stable identities referencing the parent course. Persist an ordered canonical AST JSON and its SHA-256, plus source hashes and sanitized plain search text. Server-generated downloadable assets have IDs and MIME/hash/size metadata in the accepted inventory. Database transactions enforce parent-course/version consistency; the browser must not assemble arbitrary IDs from different snapshots. Renamed slugs create explicit old-to-new alias records; never recycle an old slug to a different identity. A published snapshot may be withdrawn from public access but not rewritten.

## 3. AST, conversion and coverage algorithm

1. Read original source bytes and record SHA-256. Parse with unified/remark and GFM into an AST; do not split headings using regular expressions. Fenced Python comments beginning `#` remain code.
2. Identify lesson content by the known individual source path. Remove only the exact top/bottom navigation paragraphs and separator belonging to that navigation. Record these removals. The prerequisite and working-rule paragraphs remain teaching content after public adaptation.
3. Convert known bold lead labels (`Situation.`, `Build.`, `Trace.`, `Acceptance.`, `Technique.`, `Hint.`, `Explain.`, `Pass evidence:`, `Stretch:` and variants) into explicit section headings in the public source. Preserve the remainder of the paragraph as paragraph content. No general text replacement inside code, tables or inline links. Guided exercise and checklist headings remain structured headings.
4. Map Understand to objective/situation/explanation/examples/technique; Build to task/guided exercise; Verify to acceptance/commands/pass evidence/checklist/milestone; Reflect to explanation questions/stretch. Hint has its own role and appears as a disclosure beside the task. Full mode uses source order; stage mode filters the same ordered records without rewriting prose.
5. Assign every root teaching block to one section exactly once, using headings as section boundaries. A manifest section heading must resolve to exactly one heading node. Store the manifest anchor as the renderer ID; headings do not silently generate identity. A source heading rename changes heading text, not ID/anchor. Any introductory block before the first section must be moved explicitly into an objective section and recorded. Reject unmapped blocks or empty required sections.
6. Resolve links against the original source file directory before rewriting. Canonical route map covers lesson files, master headings, references, starter assets and local images. Strip only presentation Previous/Next links supplied by the shell. Validate anchors after rewrite. Reject required links escaping the permitted bundle; optional legacy links become a clearly labeled optional reference without personal paths.
7. Build the render model and search documents from the same accepted AST. Rendering disallows raw HTML, scripts, MDX/JSX, iframes, arbitrary directives, remote images and unsupported URL schemes. Reject these on import and disable them again at render time. Code is escaped text. Only HTTPS external links and explicitly allowlisted HTTP documentation hosts are accepted; no server fetch of target URLs. Fragment-only and mapped internal route/asset references are allowed. Relative references inside downloadable README files remain download-relative, not app routes.
8. Registered diagrams consume typed data validated by their renderer schemas. No uploaded SVG, inline code expressions or arbitrary JavaScript. Mermaid-like source is not executable upload content; trusted diagrams are shipped React/SVG components.

Canonical AST transport union: `heading(level 2..6,text,anchor)`, `paragraph(inlines)`, `list(ordered,start?,items)`, `table(headers,rows)`, `code(language,text)`, `blockquote(blocks)`, `thematicBreak`, `image(assetId,alt,title?)`. Inline union: `text(value)`, `emphasis(children)`, `strong(children)`, `inlineCode(value)`, `link(destination,children)`, `break`. List items contain `blocks` and optional `checked` boolean for task lists. Raw task checkboxes render as teaching content; live learner checklist controls bind only explicit checklist IDs. Search extracts inline/code text and image alt, not personal data. Unknown node types fail with path and line rather than disappear. Add maximum AST depth 32, 50,000 nodes/document and 100,000 text characters per code block; these are named configuration values.

Coverage report fields: source path/hash, original heading and line span, transformation category, target document/section IDs, original block count, mapped block count, removed navigation block count, added public block count, target hash and verification outcome. Categories are `path-portability`, `navigation-conversion`, `original-prerequisite-replacement`, `optional-legacy`, `new-prerequisite-explanation`, `unchanged`. A separate record captures each reason; no omnibus “adapted” row hides changes. Master duplicate lesson/starter exclusions are explicit. Reports are owner/developer artifacts, not learner prose.

Required reference pages: setup; shared-rules; algorithm-comparison; python-techniques; debugging; optional-legacy; shared-storage-limitations; study-journal; review-rubric; primary-references. Course overview contains purpose, outcomes, milestones, estimates and optional three-hour study schedule. Every original master teaching block is covered by an overview/reference/lesson mapping or an explicit duplicate exclusion.

## 4. Upload, lease and publication workflow

Use the shared mutation protocol: every mutation includes UUID `mutationId` and `Idempotency-Key` header equal to it; same key/input returns its stored result, changed input conflicts. Verify authentication and owner authorization before returning a receipt. The first business operation checks the receipt; no duplicate side effects. Stable operation ID identifies retryable upload work. Hash canonical input and key receipts by actor and mutation ID across all operations, with operation type included in the canonical request hash. No private prose or credentials in logs.

| State | Permitted next action | Exit rule |
| --- | --- | --- |
| created | Upload once to reserved private object, confirm, cancel | Actual object size/hash checked server-side |
| uploaded | Validate or cancel | Acquire lease atomically |
| validating | Same-operation retry after lease expires; cancel when no live worker | Invalid deterministic input → invalid; recoverable infrastructure error → uploaded with error |
| invalid | Download report or cancel; corrected bundle requires new operation | No replacement of insert-only archive |
| ready | Preview, publish or cancel | Metadata/hash/inventory frozen; no further edits |
| publishing | Inspect status or retry same mutation | Transaction commits published or returns guarded conflict to ready |
| published | Inspect, rollback active pointer through separate command | Terminal upload operation; snapshot retained |
| cancelled | Inspect report | Terminal; cleanup eligible after retention window |

Every operation has `operation_revision >= 1`; every state transition increments it atomically, and cancellation supplies `expectedOperationRevision` for comparison. The shared publication lock order is owner singleton → actor profile → course → operation → version; all owner commands follow this order for the rows they require. At most one nonterminal upload per owner. Invalid is terminal for quota purposes; published/cancelled/invalid release the reservation. A ready operation retains its reservation until published/cancelled. Deletion/cancellation never deletes a retained published version.

Reserve with `POST /api/v1/owner/uploads`: course ID or new course intent, version label, expected compressed size and mutation ID. Return operation ID, insert-only staging path, configured limits and short-lived upload authorization. Browser directly uploads to `<ownerId>/<operationId>/bundle.zip`. The API never accepts an arbitrary path from the client. Existing object cannot be overwritten, including by retry.

`POST /api/v1/owner/uploads/:id/confirm` accepts mutation ID and no client-selected object path, verifies the reserved object's actual bytes/hash and insert-only ownership, and atomically moves created to uploaded. A retry returns the same inventory; mismatched bytes conflict. `POST /api/v1/owner/uploads/:id/cancel` accepts mutation ID and expected operation revision; under a row lock it rejects published/live-leased work, marks other cancellable work cancelled, releases reservation and fences off stale workers. Cancellation never deletes objects synchronously; referenced/staged objects follow the cleanup policy. The UI exposes Cancel on every permitted state and explains when an active bounded validation must finish or expire first.

`POST /api/v1/owner/uploads/:id/validate` requires uploaded state and is an awaited bounded operation. Verify the already accepted size/checksum and acquire `(leaseOwner, leaseExpiresAt, fencingToken)` under a row lock. Each acquisition increments the token; every staging/finalization write checks operation ID, token, lease validity and expected state. Use database time. Default lease 45 seconds with renewal every 10 seconds; validation request budget 25 seconds, configurable below verified hosting limits. If the bundle cannot fit, fail with an actionable budget error; never promise background work after returning. Upload status GET reports authoritative state after a timeout.

Enumerate archive without general-purpose filesystem extraction. Reject traversal, absolute/drive/backslash/null paths, duplicate/case-colliding names, links, encryption and nested archives. Enforce streamed byte budgets and image decode limits; re-encode images and hash sanitized derivatives. Untrusted images/text are never executed. Upload immutable outputs only under operation-reserved version/asset IDs. Recovery may reuse an output only after verifying expected hash; otherwise fail and quarantine. Partially staged versions are not readable as ready/public.

Derive AST, source coverage, route inventory, search index and starter ZIP. Starter ZIP is generated from validated text files, has a deterministic sorted entry list and fixed archive metadata; no compilation or installation occurs. Persist output manifest with every ID/hash/byte count. Mark ready only after objects and database rows agree. All invalid results include safe file/line/field paths and remediation; diagnostic logs include only opaque IDs, category and timings.

Owner preview reads exact version ID with a Draft banner and separate query namespace. Publication request includes operation ID, target version ID and `expectedActiveVersionId` (nullable only for first publication). In one database transaction lock the owner singleton, actor profile, course, operation and target version in that order, then recheck owner/ready/frozen hashes, compare pointer, publish complete snapshot, switch active pointer and store receipt. Two concurrent requests based on the same pointer cannot both succeed. An expired validator token cannot overwrite the ready/published state. A lost response is recovered by receipt/status, not a second new mutation.

Rollback selects a retained published version with the same pointer comparison; it does not rewrite content or learner records. Withdrawal removes public discovery/read access while retaining private learner records and retained snapshots. Existing readers pin their version until navigation/update acceptance; show an update notice without resetting notes/completion. Version switching reconciles removed lessons to archived records and never automatically marks new material learned.

Every staged row/object records its owning operation and version ID; a failed operation cannot clean another operation's output, even for the same course. Cleanup produces a dry-run inventory and deletes failed/cancelled unreferenced staging objects only after 48 hours and no live lease. Keep published history during pilot. Do not clean objects by filename prefix alone. Signed asset URLs expire after five minutes, require published/version or owner checks, and cannot be revoked from copies already downloaded. Blob URLs from authenticated downloads are revoked when no longer used.

## 5. Public starter and independent harness

Public starter inventory (all independently authored BuildTrail files): `README.md`, `LICENSE.txt` using the owner's confirmed distribution terms, `limiter.py`, `main.py`, `harness.py`, `run_tests.sh`, `course_tests/test_fixed_window.py`, `integration_tests/test_adapter.py`, `fixtures/01_cases.json`, `fixtures/01_expected.json`. The existing limiter scaffold and eleven core tests are preserved as the learner baseline; add original harness/parser/formatter tests without publishing the missing algorithm or adapter solution. Ownership/licence remains a release input; a placeholder licence never passes publication readiness.

`limiter.py` retains Decision and constructor validation, and deliberately raises NotImplementedError in check. `main.py` exposes `handle(request, limiter, now)` as an explicit learner TODO and a runnable stdin loop supplied by the harness. The harness owns parse/serialize and fixture replay only; it must not implement admission or select the answer based on fixture name. `run_tests.sh` is a convenience wrapper for `python3 -m unittest discover -s integration_tests -v`, with an optional `01` group; it fails on unknown group. Python commands remain the authoritative portable test entry points.

### Harness transport contract

Inputs are newline-delimited JSON, one object per line. A clock directive is `{ "type": "clock", "now": 10 }`; a request is `{ "type": "request", "method": "GET", "target": "/notes", "headers": { "X-Demo-Client": "alice" } }`. Strict known fields; `now` is finite, nonnegative and nondecreasing. Initial time is zero. A directive changes time and emits no response. Every request emits one JSON object containing integer `status`, string-to-string `headers`, and string `body`. No sockets or wall-clock waiting in lesson 7. JSONL removes dependence on a third-party pseudo-HTTP grammar while retaining explicit HTTP status/header/body teaching.

Header names are case-insensitive; reject duplicate names after case normalization. Header values cannot contain CR/LF. Limit input line to 16 KiB, headers to 32 entries and value to 1024 characters. Whitespace-only identity maps to `anonymous`; other identities are stripped and constrained to 1–80 ASCII letters/digits/underscore/hyphen. This demo header is deliberately untrusted; lesson 15 replaces it with server-owned demo credentials. Reject malformed input with status 400 without touching quota. The lesson-7 fixture route is exact GET /notes; unsupported valid method/path returns 404 without quota. Do not silently teach health/auth/weighted costs before their lessons.

Accepted response: status 200, body `{"ok":true}`, content type application/json, correct UTF-8 Content-Length, Cache-Control no-store; no Retry-After. Limited response: status 429, body `{"error":"rate_limited"}`, same content headers plus Retry-After `str(ceil(decision.retry_after))`. Response JSON wrapper key order is not a test criterion. Compare status, required headers and body bytes; reject unexpected diagnostics on stdout. Diagnostics use stderr. A provided optional serializer emits status line/headers with CRLF and body bytes for lesson 5/7 formatting tests; the JSONL replay remains the primary public harness. Lesson 19 uses real localhost HTTP.

### Required integration vectors

Each case starts a fresh limiter unless it explicitly lists sequential events. Supply fixtures below, independently authored from course contracts, not copied from legacy files.

| Case | Inputs | Expected result |
| --- | --- | --- |
| First | clock 10; Alice request | 200, no Retry-After, remaining core allowance 4 |
| Exhaust | clock 10; six Alice requests | 200 five times, then 429 Retry-After 50 |
| Isolation | Exhaust; Bob request | Bob 200; seventh Alice request still 429 |
| Boundary | Five Alice at 10; request 59.999; two requests 60 | 429 Retry-After 1; then 200,200; core remaining 4,3 |
| Fraction | Five Alice at 10; request 59.2 | 429 Retry-After 1; core delay approximately 0.8 |
| No postponement | Five at 1; reject at 20,30,59; request 60 | Delays 40,30,1 then 200 |
| Idle jump | Five at 10; request 600 | 200 |
| Anonymous | Empty/whitespace/missing identity, six total at 10 | Shared anonymous allowance, sixth 429 |
| Invalid request | Invalid JSON, CRLF request header, unknown request fields | 400; no quota mutation; subsequent valid first request 200 |
| Invalid clock | Parsed clock directive with backward/nonfinite time or unknown fields | No response object; structured stderr error, nonzero exit and unchanged limiter state |
| Format | Non-ASCII body in formatter unit case | Content-Length equals encoded byte count; CRLF in optional wire serializer |

Unparseable JSON is treated as a malformed request and returns 400. A successfully parsed object with type clock is always classified as a clock directive. Malformed clock directives report a structured stderr error and nonzero process exit instead of generating a fictitious request response. Request validation errors return 400. Fixture runner checks expected error channel as well as outputs. Use arbitrary named synthetic client identities only; never real credentials or personal data.

### Setup and supplied-test boundary

README begins with tools: Python 3.10+, terminal/editor, Git optional; standard library only for milestone 1. Provide Linux/macOS/WSL extraction and working-directory commands, `python3 --version`, optional `python3 -m venv .venv`, activation, core tests and integration tests. Record exact tested Python/platform matrix in release evidence; native Windows is not verified unless explicitly tested. No global install, Redis, container or external account is needed before lesson 22. Include SHA-256/file list and explain downloads versus local work.

The eleven original core tests initially yield ten NotImplementedErrors and one passing configuration test. Added parser/formatter tests pass; adapter tests intentionally fail at the named TODO. Count and record the new exact total in the generated public README during implementation; do not claim those not-yet-authored tests have run. CI distinguishes expected baseline failures from harness regressions. Reviewer-only temporary solutions may validate the course but must be outside the artifact tree and scanned out of the ZIP.

Lessons 1–5: learner writes small experiments and assertions. Lesson 6: supplied core scaffold/tests. Lesson 7: supplied original harness/integration fixtures plus learner-authored edge cases. Lessons 8–30: learner-authored tests, guided traces and explanations; no implied downloadable grader. Later Python snippets remain incomplete examples, not full solutions. Lesson 22 adds a tiny non-limiter Lua echo/number-conversion example, KEYS/ARGV explanation, Redis client script registration/invocation, return conversion, dedicated key prefix, real server setup and deterministic-time versus real-expiry test distinction. Lesson 23 explains that a test timestamp must not accidentally set an absolute expiry in the real server's past.

## 6. All-lesson adaptation and visual coverage

Each row is mandatory public content work. `L01`..`L30` below are human shorthand only; manifest UUIDs are authoritative. Source paths are the corresponding numbered files under [original lessons](courses/rate-limiter-python/lessons). Public target keeps the same filename under `content/public/rate-limiter-python/lessons/`. All rows inherit portable paths, stable heading/section conversion, no duplicated shell navigation, six preserved completion items, existing hint/reflection/stretch and explicit supplied-test status. Cumulative prerequisites remain available but each row adds the immediate concept/tool prerequisite below. Static data is drawn from the named source trace and checked in with the renderer; no fabricated telemetry.

| Lesson | Public addition/adaptation and immediate prerequisite | Verification | Renderer; purpose/source trace | Mobile and text alternative |
| --- | --- | --- | --- | --- |
| 01 Counter | Create experiments directory; function/counter warmup | Learner assertions, seven calls | `state-ledger`; counts 0→5 then two rejects | Seven stacked rows with before/after counts |
| 02 Identity | Explain dictionary missing-key lookup and anonymous adapter scope | Learner interleaved-key tests | `identity-lanes`; Alice sixth rejects, Bob count two | Separate labeled client cards plus ordered event table |
| 03 Time | Show floor import and seconds; nonnegative monotonic input | Learner boundary table | `window-axis`; 0,59.999,60,119.999,120 | Boundary intervals stacked; exact values in table |
| 04 Renewal | Explain stored window identifier and lazy reset | Learner reset/isolation tests | `window-ledger`; five at 10,59.999,60 twice,600 | One event per row, window/count displayed |
| 05 Retry | Distinguish float arithmetic and header formatting | Learner core/formatter cases | `retry-countdown`; 30,59.2,59.999 delays | Numeric delay/ceil table; no timed countdown |
| 06 Class | Explain self, instance fields and frozen dataclass | Supplied eleven core tests plus learner cases | `instance-isolation`; A exhausted, B fresh | Two cards and per-instance count table |
| 07 Feedback | Replace mandatory legacy main/runner/fixtures with public harness | Mixed core and supplied integration tests | `request-pipeline`; parse→identity→check→format | Vertical flow with step labels and input/output transcript |
| 08 Boundary burst | Show replay tuple/event ordering | Learner replay assertions | `window-comparison` demo boundary preset | Two vertically stacked algorithms, ten-row comparison |
| 09 Exact log | Explain deque append/popleft and <= expiry | Learner sliding cases | `window-comparison` plus retained-log preset 0..60 | Queue shown as ordered list with expired labels |
| 10 Approximation | Define weighted arithmetic and temporary retry calculation | Learner exact-versus-estimate tests | `weighted-counter`; previous 4/current 2 at fractions 0,.5,.75 | Formula followed by a three-row state table |
| 11 Token bucket | Explain min/cap and persisted timestamp on rejection | Learner deterministic tests | `token-bucket` demo unit preset | Balance ledger and large step controls |
| 12 Weighted work | Explain bool/int validation and server-owned cost table | Learner no-mutation invalid cases | `token-bucket` demo weighted preset | Cost selector plus before/refill/spend table |
| 13 Queue | Define pending reservation capacity and drain order | Learner FIFO simulator | `queue-reservations`; starts 0,2,4,6 then reject | Vertical reservations and drain/admit table |
| 14 Compare | Explain shared interface; Protocol remains stretch | Learner four-workload reports | `algorithm-matrix`; course guarantees and recorded trace | Column selector/cards, complete accessible table |
| 15 Policy | Explain urlsplit and demo credential lookup; replace legacy reliance | Learner route/spoof tests | `policy-flow`; trusted account→plan→scope→cost | Vertical decision flow plus explicit route truth table |
| 16 Multiple limits | Explain preview/commit separation | Learner all-or-nothing tests | `budget-ledger`; Alice three, Bob two, network five | User/network values in one event table |
| 17 Cleanup | Explain bounded sweep and stale heap entries | Learner equivalent replay/size tests | `expiry-axis`; empty bucket at 0, unsafe 2, safe 10 | Three state cards, retain/delete justification text |
| 18 Concurrency | Explain barrier placement/lock context manager | Learner deterministic race + real thread tests | `concurrency-race` demo | Worker events stacked, numbered interleaving table |
| 19 HTTP | Explain handler lifecycle, bytes and injected clock | Learner real localhost HTTP tests | `http-roundtrip`; 200/429/401/400 contracts | Request/response panels and header table |
| 20 Retry client | Explain fake clock/sleeper, jitter and semaphore distinction | Learner bounded retry tests | `retry-timeline`; 2+.3 wait then success | Ordered attempts with cumulative time/deadline |
| 21 Processes | Explain object versus process address space | Learner three-instance 15 versus 5 trace | `worker-topology`; three capacity-five instances | Vertically grouped workers with summed admissions |
| 22 Redis fixed | Add Lua/KEYS/ARGV/invocation warmup and Redis setup | Learner real Redis integration | `redis-atomic-flow`; two clients and one operation | Vertical client/script/store sequence, written atomic steps |
| 23 Redis bucket | Explain scaled units, remainder and test expiry clock | Learner local-vs-Redis traces and precision tests | `refill-units`; 0.5 units/ms and carried remainder | Unit conversion table plus state comparison |
| 24 Outage | Explain timeouts, ambiguous commit and breaker states | Learner unit fault injection and real backend outage test | `outage-paths`; quiz 503/search fallback 2 per process | Branch cards and status/fallback table |
| 25 Duplicate | Explain operation digest/retention and quota/job gap | Learner lost-response and conflict tests | `operation-sequence`; admitted once, retry same ID | Numbered sequence plus operation-state table |
| 26 Observe | Explain counters/histograms and bounded labels | Learner exact metric counts | `decision-counters`; five allowed, one limited, one failure | Counts as labeled text/table, never color-only |
| 27 Invariants | Explain seeded random/model baseline and percentiles | Learner 1000 events plus measured benchmark | `invariant-report`; bounds and recorded outcomes | Static example explicitly labeled; real learner table optional |
| 28 Migrate | Explain old-rate refill then clamp at change instant | Learner transition/concurrency tests | `migration-ledger`; 0,2,5,8→0,2,5,5 | Before/after cards and capacity/rate columns |
| 29 Regions/GCRA | Explain TAT symbols/units and quota allocation | Learner regional + GCRA traces | `regional-budget` and `gcra-axis`; 8+2/static 6+4; B3/T2 | Budget table and four-request TAT ledger |
| 30 Defend | Portable clean-setup checklist; optional legacy comparison only | Learner ten final demonstrations and fresh reviewer | `system-map`; policy/core/Redis/HTTP/client boundaries | Vertical architecture with component responsibility table |

Visual registry implementations share typography, admit/reject labels, time units and StudyShelf identities. Static renderers accept bounded typed rows (maximum 200 rows) and explicit captions, never arbitrary templates. Responsive table view and diagram view use identical data. Each diagram has a visible short explanation and an accessible text alternative; screen readers must not receive duplicate verbose SVG and table narration simultaneously.

## 7. Deterministic interactive model specification

All demos are labeled “Teaching demonstration — does not run your code.” Pure reducer input is `(state,event)` and output is `{nextState,record}`. Record includes sequence, simulated time, client/worker, before, operation, decision, after and explanation key/parameters. No Date.now, randomness, network calls or animation callbacks inside models. Event order is stable at equal timestamps. Invalid input returns a typed validation result with unchanged state/trace. Reset restores initial configuration/preset state and clears presentation playback. Parameter changes explicitly reset the experiment after a visible notice; they never reinterpret an existing trace.

Shared controls: Step, Reset, preset selection, readable input labels/units, visible status and event table. Playback is optional and off by default; reduced motion disables autoplay and transitions without removing functionality. Limits: capacity integer 1–100; window 1–600 seconds; refill rate 0.01–100 tokens/second with at most 2 decimals; cost integer 1–100 and <= capacity; time advances 0–600 seconds with at most 3 decimals; at most 200 recorded events before asking for Reset. Render arithmetic at up to 3 decimals while showing precision policy. Implement model arithmetic with integer milliseconds and scaled token units (100,000 units/token) so allowed demo inputs yield exact refill; never use display rounding to decide admission. Absolute simulated time capped at 86,400 seconds; all products remain within safe integers.

### A. Fixed window versus exact sliding log

State holds timeMs, per-client `{windowStartMs,count}` for fixed and accepted timestamp arrays for sliding, totals and ordered records. Request event updates both algorithms independently for the same client/time. Fixed start is floor(time/window)*window; stale start resets count. Sliding prunes values <= time-window, then accepts iff retained length < limit. Rejections do not append or increment. Delay is end-now for fixed and oldest+window-now for full log. Remaining is limit minus accepted current count. Advance alone changes clock; state cleanup is lazy at next request and the display labels pre-request state accordingly.

Required tests: (1) five at 59900ms + five at 60000ms → fixed ten accepted, sliding five; rejected sliding delay 59900ms. (2) Ten at 59900 → five accepted in each. (3) 0,10000,20000,30000,40000 accepted;59000 rejects delay1000;60000 accepts; second60000 rejects delay10000. (4) Duplicate timestamp requests count separately. (5) Bob fresh despite exhausted Alice. (6) Window=10000,limit1, at9999 accepted/rejected then10000 accepted. (7) Backward/nonfinite time and zero window rejected unchanged. (8) Reset removes all clients/history. Renderer test ensures table and colored marks agree, not merely totals.

### B. Token bucket

State per client is scaled tokens and lastUpdateMs. First request starts full at current time. Refill is min(capacityUnits,oldUnits+elapsedMs*rateUnitsPerMs); enough balance deducts costUnits; rejection preserves refreshed balance and saves current timestamp. Remaining is floor(balanceUnits/100000). Retry is exact deficit/refill rate internally, displayed as seconds and HTTP ceil separately. Invalid costs/configuration must not create a key or update timestamp. Advance presents predicted refill without persisting it until an event; label projected versus committed state clearly.

Required tests: (1) Capacity5/rate.5, five at0 leave0; at1000 reject with .5 stored and wait1; at2000 accept leaving0; at100000 begins full5 and leaves4. (2) Capacity5/rate1: cost3 at0 leaves2; cost3 at0 rejects wait1; cost1 at0 leaves1; cost3 at2000 leaves0. (3) Empty/rate2 at500ms accepts cost1. (4) Invalid 0,-1,true,1.5,cost>capacity changes neither tokens nor timestamp; UI shows impossible-under-current-config. (5) Many small increments equal one equivalent refill until capacity cap; 1000 × 1ms at rate.5 yields .5 tokens. (6) Fresh second client independent. (7) Same-time rejected requests do not replenish. (8) Unit mismatch tests ensure 1000ms equals one second. Python learner tests retain approximate assertions for their floats; demo precision is a deliberately bounded teaching representation.

### C. Concurrency race

Mode unsafe starts sharedTokens1, admissions0, workers A/B with no observed value. Curated events: A-read→observed1; B-read→observed1; A-decide/write→admit,write0; B-decide/write→admit,write0. Final admissions2 with stored0 demonstrates why a valid-looking balance is insufficient. Reject invalid schedules (write before read, repeated completed worker). Safe mode events are indivisible A-check-and-spend then B-check-and-spend: admissions1, A allowed/B limited, shared0. Alternate ordering reverses which worker succeeds, not total. Renderer displays an atomic boundary, not a fake claim that animation causes locking.

Tests assert every intermediate record, stale observed values, final admission counts, reset clearing worker registers, schedule validation and atomic B-first symmetry. Explain that this model covers interleaving only; it does not model Redis replication, failover, durability or network deadlines. Lesson18 tests still use real threads for integration; lesson22 uses real Redis, not this simulator as a substitute.

## 8. Routes, loading and study components

| Route | Contract |
| --- | --- |
| `/courses` | Published catalogue title/summary from active version; genuine empty state; no fabricated courses |
| `/courses/:courseSlug` | Version-pinned overview, prerequisites, outcomes, estimates, setup and starter download |
| `/courses/:courseSlug/lessons/:lessonSlug#section-anchor` | Ordered study sections/full view; stable section navigation; explicit completion |
| `/courses/:courseSlug/reference/:referenceSlug#section-anchor` | Same safe reader model; no personal prerequisite path |
| `/courses/:courseSlug/playground` | Three registered demos, course-pinned presets and lesson backlinks |
| `/my-learning` | Account-only started courses, progress, resume; sign-in preserves return destination |
| `/settings` | Theme/reading preferences and personal export/import/deletion from shared account spec |
| `/auth/callback` | Validated same-origin return destination; restore intended lesson/section/action |
| `/owner/courses` | Owner-only list and upload reservation/status/report |
| `/owner/courses/:courseId/versions/:versionId` | Exact draft preview/inventory/validation and guarded publication |

Resolve slugs to stable IDs and aliases before queries. Query keys include environment, content version and resource IDs; private keys also include user ID. Draft/public cache namespaces are separate. One course context pins version; child components cannot independently follow latest pointer. React Router loaders use shared TanStack Query functions, not duplicate caches. No entire-course lesson bodies in initial JS. Lazy-load simulations, highlighting languages and owner routes. Withdrawn/not-found/unavailable versions have explicit states; do not silently redirect to content with a different identity.

| Component | Inputs/behavior and required states |
| --- | --- |
| StudyShell | Course/version metadata, navigation and single active drawer; focus mode; guest/member; mobile/desktop |
| CourseNavigator | Ordered milestone IDs and per-user statuses; expand/collapse, active item, archived identity; no locked lessons |
| SectionNavigator | Understand/Build/Verify/Reflect plus full view; missing optional section omitted; visible selected state and heading focus |
| LessonReader | Canonical blocks; semantic headings; source order in full mode; stable section anchor |
| CodeBlock | Escaped text, language, Copy/Wrap; copy failure fallback; keyboard-scroll region; preserved whitespace |
| HintDisclosure | Existing hint only; native disclosure or equivalent button/aria-expanded; no invented full solution |
| StudyPanel | Notes/reflection/checklist/evidence; dirty/saving/saved/failed/conflict/auth-expired; local draft distinct from cloud save |
| CompletionControl | Explicit complete/reverse action; no scroll/demo-driven completion; self-report label |
| DemoFrame | Validated model, Step/Reset/preset controls, diagram and event table; empty/reset/invalid/max-events states |
| StarterDownload | Version, file list/hash/platforms; real download; error/retry; no fake Run/Open editor |
| CourseSearch | Worker index; code/text/reference search; top20 escaped excerpts; keyboard navigation/no results/error |
| ReportIssue | Prepares course/version/lesson and owner-configured contact route; excludes personal notes/evidence |

Autosave uses the shared 800ms debounce, five-second maximum interval, one in-flight save per record and revision comparison specified in [the application save coordinator](IMPLEMENTATION_APPLICATION.md#5-saved-work-coordinator), backed by [the data/API protocol](IMPLEMENTATION_DATA_AND_API.md). Navigation does not discard draft generations. Completion/checklist state is private mutable data, never written into published AST. Guests may explore all published material; writing prompts sign-in and returns to the same lesson/section. Do not claim Saved until server acknowledgement for the latest local generation. Keep conflict copies available; no silent last-write-wins text replacement.

### Responsive and accessible behavior

Use semantic tokens for surfaces/text/borders/accent/status/focus in light and dark themes. Default body 16px or larger, line-height1.6, reader width65–75 characters; selectable proportional font alongside self-hosted licensed JetBrains Mono. Spacing4/8/12/16/24/32/48px. These are starting design values, verified on real content rather than rigid quotas.

At >=1200px use course tree/reader/study panel; 900–1199 collapse study panel; <900 collapse tree too. Test at320,390,768,1024,1440 widths, 200% text zoom and 400% browser reflow where applicable. No viewport-wide horizontal scroll; long code/tables scroll inside labeled keyboard-accessible regions. Primary touch targets >=44px. Only one modal drawer; Escape closes, focus stays trapped while open and returns to trigger. Preserve note text/section when rotating or opening drawers. Safe-area padding and dynamic viewport prevent keyboard/fixed navigation overlap. Verify actual phone keyboard behavior or explicitly record the untested gap.

Target WCAG2.2 AA. Test contrast, visible focus, heading order, labels, errors associated to fields, live save status without excessive announcements, and non-color decision labels. SVG decorative details are aria-hidden when the table supplies the equivalent explanation. Essential diagrams have titles/descriptions or equivalent adjacent text. All simulation controls work without mouse/hover/animation. Route navigation focuses the lesson heading except when preserving an active editor. Search supports Ctrl/Cmd+K, arrows, Enter and Escape and announces result count. External links explain destination; new tabs use safe opener handling. No confetti, streak pressure, fabricated grading or distracting autoplay.

## 9. Acceptance and release evidence

Automated content gates: strict manifest/schema/identity relations; full block coverage; all30 lessons and7/7/6/5/5 first-course counts; generic two-lesson bundle accepted; all links/anchors/assets resolve; all30 visual rows bound; no absolute owner paths/mandatory legacy prerequisites; safe AST and renderer registry; original/public hashes and report; valid download inventory/licence; bounded search index; no full reference solution in starter.

Security corpus: ZIP traversal/backslash/drive/link/duplicate/case collision/encryption/zip bomb; understated expanded bytes; oversized/deep JSON/AST; image decode bomb/MIME mismatch; HTML/script/MDX/unsafe URLs/remote tracking images; forged owner/version IDs; stale lease worker; overwrite attempt; draft/public cache crossover; request replay with changed mutation payload. Invalid bundle never becomes publicly readable and logs contain no private text.

Publication integration tests use real local Supabase Postgres/Auth/Storage and wired server handlers: unauthorized owner calls, simultaneous reservation, upload timeout recovery, fenced lease takeover, partial output recovery, two publishes same pointer, lost response receipt replay, rollback, withdrawal, asset authorization and cleanup reference protection. Unit tests may stub clocks/storage faults; integration tests use actual owned components and real fault injection. Do not mock the content database/storage to claim publication integration coverage.

Frontend tests cover canonical AST parity across full/stage views; required sections accessible; guest login return; explicit reversible completion; search section links; every save state and conflict; draft survives route change; version pinning/update notice; drawer focus; copy fallback; reduced motion; code/table overflow. Browser evidence uses actual lesson1, lesson11 and lesson22 in both themes, phone/desktop, editor open and failed save. Automated axe checks complement manual keyboard/screen-reader/reflow review.

Simulation tests cover every vector in section7 and confirm rendered records match model output. Pure model correctness has no wall-clock sleeps. Frontend tests can unit-test injected timing; backend/Python integration uses real HTTP/threads/Redis where the lesson promises those properties. Engineering coverage gates are >=80% instructions and >=60% branches for application modules; unfinished learner TODOs are separately asserted expected failures, not excluded silently to fabricate passing course implementations.

Fresh-learner release run: clean directory with only advertised download; documented tools/platform; verify checksum/file list; run expected initial core/harness failures; follow lessons1–7 using reviewer-private implementation; run both categories; verify later lesson setup is discoverable and supplied versus learner-authored status accurate. Keep reviewer solution and machine-specific files outside public packaging. Record OS, Python, commands, exact outcomes, unresolved instruction gaps and final artifact SHA-256. A fresh reviewer follows README without chat context.

Release evidence bundle contains manifest/AST schema versions, content-validation.json, source-adaptation.json, route-map.json, visual-coverage.json, source-hashes.json, public asset inventory, generated starter checksum, publication concurrency results, accessibility/screenshots, tested platform matrix and fresh-learner report. A required failure blocks publish; no checklist item is marked complete merely because the specification describes it. Owner contact destination and distribution licence must be real configuration/approved text before public release. All other decisions here can proceed without further course clarification.
