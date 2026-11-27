# Branching And Commit Policy

## Branch Naming
- Use `feature/...` for feature implementation work.
- Use `fix/...` for bug fixes and behavior corrections.
- Use `chore/...` for config, ops, environment, or maintenance work.
- Do not add a `codex` prefix or suffix to branch names unless explicitly required.

## PR Shape
- Prefer small, reviewable PRs.
- Break large work into isolated units where possible.
- Stacked PRs are fine, but each PR should still make sense on its own.
- Keep one main concern per PR where practical.

## Commit Message Style
- Use conventional commit style:
  - `feat(scope): ...`
  - `fix(scope): ...`
  - `chore(scope): ...`
- Scope should be meaningful and tied to the area changed.
- Commit messages should be concise and specific.

Examples:
- `feat(acceptance): resolve routing at acceptance`
- `fix(cdc): reduce staging consumer concurrency`
- `chore(config): align staging cdc bootstrap servers`

## Migration Conventions
- Follow the existing migration convention exactly.
- One statement per migration file.
- Do not add a trailing `;` at the end of the migration file unless the repo already does so for that migration type.
- Keep migration files narrowly scoped.

## Repo Hygiene
- Do not push incidental local helper scripts unless they are intentionally part of the change.
- Remove accidental local-only files from PRs.
- Keep comments and docs product-clear and easy to understand.
- Prefer clean, isolated diffs over mixed incidental refactors.

## Review Expectations
- Optimize for reviewer clarity.
- Changes should be easy to explain in business and technical terms.
- Avoid over-abstraction unless it clearly pays for itself.
- Preserve backward-compatible behavior where that is the expected product outcome.

## Practical Working Pattern
1. Branch from the correct base.
2. Keep the branch focused.
3. Commit in coherent units.
4. Rebase or merge from `main` as needed to keep the branch current.
5. Push only intended files.
6. Prepare a concise PR description with:
   - summary
   - why
   - what changed
   - expected behavior/outcome
