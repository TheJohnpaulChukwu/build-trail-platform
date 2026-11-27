# Build log

## 2026-11-26 — Backend section 1

- Scope: reproducible TypeScript backend, shared scalar/config contracts, health and authenticated identity reads, real local Supabase identity tables/bootstrap/RLS tests. Course publishing and study mutation RPCs are later sections.
- User authorized implementation in feature sections, testing and review before each local commit, and explicitly prohibited pushes.
- Recorded the approved implementation baseline with SHA-256 hashes. Latest user destination is this nested application repository.
- Environment: Node 24.21.0, npm 11.19.0, rootless Podman with its user API socket; no Docker binary or hosted credentials required.
- No application checks have run yet. Human release/schema approval gates remain separate from local implementation review.
