# 05 — Content contracts and publishing pipeline

## Bundle format

One ZIP archive containing `manifest.json`, `lessons/*.md`, `references/*.md`, optional `images/*`, and `starter/*`. Starter files are plain `.py`, `.sh`, `.txt`, `.md`, `.json`, `.toml`, `.yaml` or `.yml` downloads. No nested archives. The validator may generate a downloadable starter ZIP from the accepted starter files; it must not execute or install them. Every starter file requires a manifest entry, purpose and licence/ownership declaration.

Initial limits: 10 MiB compressed, 25 MiB actual expanded bytes, 200 entries, 1 MiB per Markdown file, 5 MiB per image, 1 MiB per starter text file. Cap decoded image dimensions at 20 megapixels and either side at 10,000 pixels. The manifest is at most 256 KiB and 12 nesting levels. Limits are application configuration and shown before upload. The owner gets one nonterminal upload operation at a time; cancelling releases the reservation.

Manifest v1 shape (illustrative; UUID values abbreviated):

```json
{
  "schemaVersion": 1,
  "course": {"id": "<uuid>", "slug": "rate-limiter-python", "title": "Build a Rate Limiter", "summary": "...", "language": "python", "prerequisites": ["Python functions"]},
  "version": "1.0.0",
  "milestones": [{"id": "<uuid>", "title": "A useful limiter", "lessonIds": ["<lesson-uuid>"]}],
  "lessons": [{
    "id": "<lesson-uuid>", "slug": "count-requests", "title": "Count requests",
    "path": "lessons/01.md", "required": true,
    "prerequisiteLessonIds": [], "newTools": [], "verification": "supplied-tests",
    "sections": [{"id": "<section-uuid>", "stage": "understand", "anchor": "why-count"}],
    "checklist": [{"id": "<item-uuid>", "label": "Explain the decision"}],
    "reflections": [{"id": "<item-uuid>", "prompt": "Why count per client?"}],
    "demos": []
  }],
  "references": [{"id": "<uuid>", "slug": "setup", "path": "references/setup.md", "title": "Setup"}],
  "assets": [],
  "starter": {"files": [], "readme": "starter/README.md", "license": "owner-confirmed"}
}
```

The executable schema must define every optional/required field and reject unknown fields. This abbreviated example is not a valid ready-to-upload bundle because UUIDs and starter files are placeholders. T01 supplies a valid small sample. Course version labels are unique strings with documented SemVer formatting; database version UUIDs remain authoritative. Explicit IDs persist across edits. Schema version changes require a migration path or actionable rejection, not guessed interpretation.

## Markdown contract

Use a shared AST pipeline for validation, navigation mapping, section extraction, rendering and search text. Public lesson files use actual headings and explicit stable section anchors supplied by the manifest. Heading anchor generation is deterministic; authored anchor mapping overrides title-derived IDs so renames preserve resume links. Section mappings must cover every content block exactly once in the ordered lesson model. Full reading and four-stage views consume that same model. Do not duplicate prose into two rendering sources.

Allow paragraphs, headings, lists, GFM tables/task lists, fenced code, safe links and raster images. Reject raw HTML in uploads. Disable raw HTML rendering even for already stored content. Reject scripts, JSX/MDX, iframes, event handlers and arbitrary directives. Allow only registered diagram/demo identifiers with validated parameters. Sanitize URL schemes; links may use HTTPS and reviewed HTTP documentation targets, plus internal routes. Images resolve only to declared bundle assets, never remote tracking URLs. User-provided note text is rendered as text, not HTML.

Source conversion must account for code comments beginning with `#`, bold labels, hints, relative navigation and duplicated master lesson text. Import individual lesson files once; master contributes only preparation/references. Generate adaptation report, source hashes, route map and a 30-row visual coverage map. Rate limiter validation checks 30 lessons and milestone sizes 7/7/6/5/5; platform validation never hardcodes those counts.

## Archive security and immutability

Reject absolute paths, `..` components, backslash ambiguity, drive prefixes, null bytes, symlinks/hardlinks, encrypted ZIPs, duplicate or case-colliding names and nested archives. Compare normalized path against declared manifest path; never extract to owner-controlled filesystem locations. Count actual streamed output, not ZIP headers. Check signatures and decode raster images under limits; re-encode accepted images to drop active/unexpected payloads and metadata. Abort on decompression, parser or elapsed-time budget violation. Do not fetch external URLs from manifests. Unknown assets are rejected.

A unique operation-owned staging object has insert-only authorization: no overwrite/upsert. On validation, download only the path recorded in the operation, verify byte limit and SHA-256, then parse. All subsequent attempts compare the accepted hash. An owner role does not make malformed content safe. See [OWASP upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

## Storage layout

Private buckets: `course-uploads`, `course-assets`, `personal-transfers`. Paths use generated IDs, not filenames as authorization:

- uploads: `<ownerId>/<operationId>/bundle.zip`
- assets: `<courseId>/<versionId>/<assetId>/<sanitizedName>`
- transfers: `<userId>/<operationId>/export.json` or `import.json`

Draft read: owner only. Published asset read: content publication policy and explicit version match. Keep course-assets private so draft objects cannot leak through a public bucket. Fetch via policy-authorized Supabase Storage download and browser Blob URLs; revoke unused Blob URLs. Use a short-lived signed URL only when a download requires it, issued by `GET /api/v1/assets/:assetId/url?versionId=...` after published/owner checks. It is public-readable only for readable published versions. Add a per-IP abuse limit at the platform edge where available and per-resource request limits for signing; do not log signed URLs. Revocation does not recall previously issued links before their short expiry or already downloaded files.

## Publication state machine

`created → uploaded → validating → invalid | ready → publishing → published`

`cancelled` applies only before publication. Retryable validation failure releases its lease and retains an error category; a retry uses the same operation ID. Each execution acquires a database lease with expiry and a fencing token. Every state-changing write verifies that token so an expired worker cannot finalize after another attempt takes over. No fire-and-forget server work.

1. Reserve operation and insert-only upload path after owner check.
2. Upload archive directly to Storage. Confirmation validates actual metadata; client-reported size is not proof.
3. Validate inside a bounded awaited server request. Persist actionable errors with file/field context, excluding private content from logs.
4. Insert/stage version rows and immutable assets, derive search documents and generated starter ZIP. Mark ready only when all required hashes and objects exist.
5. Owner previews exact draft version. Preview caches cannot populate public keys.
6. Publish transaction locks course, rechecks owner, ready state and expected active version; marks target published and switches pointer atomically. Record result keyed by mutation ID.
7. Public readers starting now pin the new version. Existing readers keep the retained snapshot and get an update notice.

Concurrent publish attempts with the same expected pointer: one succeeds, one conflicts. Rollback selects a complete retained published version with the same pointer guard. No content overwrite and no rollback of learner records. Course/version hashes and accepted asset inventory are immutable after ready; changes require a new upload/version.

Retain all published snapshots during the small pilot; budget Storage usage explicitly. Failed/cancelled staging objects may be cleaned after 48 hours, only when no live operation or retained version references them. Garbage collection uses a dry-run report and reference checks. Do not prune published history automatically. A retention change needs export/recovery analysis first.

## Public first-course readiness

Create `content/public/rate-limiter-python/` inside the platform repository and an auditable source adaptation map. Replace mandatory local ShipThatCode dependencies with an independently authored HTTP harness and fixtures. Keep legacy compatibility optional. Provide setup for Linux/macOS/WSL and state native Windows verification honestly. Explain initial expected starter failures and supplied versus learner-authored tests for each lesson. Preserve unfinished tasks; reviewer solutions stay out of public downloads. A second two-lesson internal bundle proves generic course structure.
