# BuildTrail Course Upload Publication and Versioning

## Owner course upload and publishing

The first release supports one platform owner and many learners. The owner can upload a documented course bundle containing a manifest, Markdown lesson files and allowed static assets, validate it, preview it as a draft, and explicitly publish a version. Provide an example bundle and a checklist so future courses do not require redesigning the app.

Validate file types, size limits, manifest schema, unique stable IDs, lesson ordering, asset references and path safety. If archives are accepted, protect against path traversal and excessive extracted size. Uploads cannot install packages, execute JavaScript, register new arbitrary simulations, or change application code. New interactive demo types are reviewed code additions; manifests only select already-supported demo components.

Show actionable validation errors and preserve the last published version on failure. Draft uploads remain private to the owner. Publication atomically switches the active version after validation; rollback can select a retained version without deleting learner records. Existing IDs cannot be casually recycled for unrelated lessons. Removing or reorganising lessons must preserve historical notes and avoid corrupting completion totals.

## Published content consistency

Store course content in Supabase at runtime so an owner can publish another course without redeploying the React application. The frontend bundle contains the renderer and reviewed simulation components, not the only copy of the catalogue. Course versions are immutable snapshots with version-scoped lessons, assets, references and search indexes.

Read the active version once when opening a course session, then fetch lessons, downloads and search data using that exact version ID. Do not mix old lesson text with new examples during a publication. When a new version becomes available, show a notice and switch on explicit reload or the next course entry; never replace text while the learner is writing. Cache keys include course and version IDs. Maintain an explicit retention policy for readable previously published snapshots; hide withdrawn courses from discovery while preserving the learner's exportable records.

Stage assets under immutable version paths, validate all metadata and asset availability, then atomically switch the active-version pointer in a database transaction. Storage uploads and the database pointer change are not one distributed transaction: failed staging remains unpublished and can be cleaned up later. Publishing retries use a stable operation ID. Concurrent publication checks the expected active version. Rollback selects a retained complete snapshot, not a partial overwrite. Search indexes and public asset access follow the same publication state. Publicly downloaded material cannot be recalled by unpublishing.

## Concrete upload and owner contracts

Define the bundle format before building the upload UI: `manifest.json`, `lessons/*.md`, `references/*.md`, optional raster images, and downloadable starter files. The manifest includes schema version, stable IDs, ordered milestones and lessons, section/item IDs, asset references and only registered demo IDs. Deliver a sample bundle and schema validation tests. An internal two-lesson sample course is required to prove that platform code does not assume the rate limiter's structure; it need not be publicly listed.

Initial configurable product limits: 10 MiB compressed bundle, 25 MiB expanded total, 200 entries, 1 MiB per Markdown file and 5 MiB per image. Reject nested archives, symlinks, path traversal, external asset fetch instructions and unsupported content. Permit PNG/JPEG/WebP for uploaded images; application-owned SVG diagrams remain trusted code. Treat allowed Python/shell starter text as downloads only, never executable server code or injected HTML. Document any additional file types deliberately.

Upload directly to a private Supabase Storage staging area after owner authorization. Send only the object reference and metadata to the validation API, rather than routing a large archive through a normal function request. The server verifies object ownership, size and allowed path itself. Use bounded validation with an operation record, status, clear errors and safe retry; do not assume an unawaited background task survives a serverless response. Verify selected runtime limits with the largest permitted sample before launch. Vercel has request-body limits that depend on configuration: https://vercel.com/docs/functions/limitations .

Bootstrap the single owner using a documented one-time trusted action assigning a specific authenticated user ID. The first public signup never becomes owner automatically. Verify the current owner role server-side, not a browser flag. Provide an operational recovery/reassignment procedure. Block self-service deletion of the only owner until ownership has been deliberately reassigned; ordinary learner deletion remains available.

## Publication states

Use explicit operation states such as uploaded, validating, invalid, ready, publishing and published. A validation failure presents a report and allows a corrected upload. A timeout presents a retry/status action with the same operation ID; it does not assume the earlier attempt failed before committing.

Course-version content remains immutable after publication. Editing creates a new draft. The active-version pointer chooses the current published snapshot. Deleting an incomplete staging operation must never delete assets referenced by a retained published version.

## Publication walkthrough

The owner uploads the sample bundle, reads validation results, opens a draft preview, publishes, opens the public course as an anonymous visitor, then rolls back to a retained version. Meanwhile, learner A keeps an older lesson open and learner B begins a new visit. Neither should receive a mixed snapshot or lose private work.

Run the same workflow for the internal second course with different milestone counts. This checks the platform contract rather than just the seed course.

## Reader and owner separation

Owner previews clearly indicate draft/version context. They must not seed draft content into anonymous caches or public search results. Public reads follow publication policy; owner reads can inspect drafts but still resolve explicit version IDs.

The upload format selects reviewed simulation types by ID. Uploading content is never a plugin-installation mechanism.

