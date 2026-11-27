# BuildTrail implementation instructions

Read `docs/specifications/README.md` and the applicable implementation specification before changing a feature. `docs/specifications/planning/CLAUDE.md` governs engineering practices where they are not specific to Java, Spring, financial products, or unavailable organization tooling. The user explicitly approved this interpretation.

Follow `docs/branching-and-commit-policy.md` for branch names, commit messages, PR scope, migrations and repository hygiene. The user explicitly adopted this policy for BuildTrail. Use meaningful conventional commit scopes and focused `feature/`, `fix/` or `chore/` branches, without a `codex` prefix. Each migration file must contain one top-level SQL statement; statements inside a function definition remain part of that single definition. Preserve the repository's SQL terminator convention. The existing uncommitted identity migration must be split accordingly before its implementation commit.

Implement in bounded feature sections. For each section, write meaningful tests, run the relevant local checks, review the complete change, fix findings, and commit only verified work. Do not push to origin or deploy without explicit user authorization. Keep the user informed during work and update `BUILD_LOG.md` with scope, decisions, actual test results and unresolved limitations.

Use strict TypeScript and validate untrusted runtime data at boundaries. Keep ordinary application requests on the public project key plus the verified caller token. Administrative credentials belong only in explicitly trusted tooling/test fixtures; never expose or log tokens or personal data. Browser database writes require approved RPC boundaries; preserve RLS and explicit grants.

Run `npm run verify` with local Supabase running for backend/database changes. Regenerate `src/contracts/database.types.ts` using `npm run db:types` after schema changes and verify it is reproducible. Integration tests use actual local dependencies. Record blocked checks honestly rather than replacing them with mocks or declaring them passed.

Treat `docs/specifications` as an immutable, hashed planning baseline. Record implementation clarifications in decision documents and obtain direction for substantive product changes. Do not edit source snapshots merely to satisfy formatting.
