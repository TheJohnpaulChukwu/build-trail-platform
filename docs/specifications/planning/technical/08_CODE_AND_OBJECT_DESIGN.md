# 08 — Code organization, OOP and engineering conventions

## Repository layout

Confirmed application repository root is `/home/jchukwu/Documents/code/build-trail-platform/`. Keep one package initially:

```text
build-trail-platform/
  src/
    app/                 # router, providers, startup/config
    features/
      catalogue/
      learning/
      identity/
      publishing/
      demonstrations/
    ui/                  # accessible primitives and shared study components
    content/             # AST transformation and renderer adapters
    contracts/           # Zod schemas, DTOs, error codes
    domain/              # pure decisions, value types, state transitions
    infrastructure/      # browser Supabase, IndexedDB and HTTP adapters
    styles/              # tokens, global rules
  api/v1/                # thin Vercel entry points
  server/                # identity guards, use cases and server-only adapters
  supabase/
    migrations/
    tests/
    seed.sql             # synthetic local records only
  content/public/        # adapted course bundles; no private notes
  scripts/               # validation, seed/import, backup support
  tests/                 # integration, E2E, fixtures and malicious bundles
  docs/                  # decisions, setup, runbooks and test evidence
```

Server modules must not be importable from `src/`. Shared contracts cannot import server-only libraries. Enforce boundaries through lint restrictions and a build-bundle check. Public course content and fixtures must be distinguishable from private data; never commit real session state or learner exports.

## Repository boundary and source ownership

Use one Git repository named `build-trail-platform`, separate from the existing `BuildTrail` planning folder:

```text
Documents/code/
├── BuildTrail/                  # Planning and original course reference material
│   ├── planning/
│   └── courses/
└── build-trail-platform/        # Single application Git repository
    ├── src/
    ├── api/
    ├── server/
    ├── supabase/
    ├── content/public/
    ├── tests/
    └── docs/
```

The platform repository must contain everything needed to build, test, deploy and maintain the application: source code, migrations, publishable course sources and starter downloads, fixtures, configuration templates, and implementation/operating documentation. A clean clone must work without the sibling `BuildTrail` folder. Do not use cross-repository symlinks or absolute owner-machine paths in builds, CI or runtime code.

Original course material stays in `BuildTrail/courses/` as reference. Adapted publishable course material is maintained in `build-trail-platform/content/public/`, with provenance/adaptation records. Keep architectural decisions, executable contracts and runbooks in the platform's `docs/` as implementation evolves; record which planning revision informed the initial handoff. Do not create competing copies of the entire planning pack without an explicit synchronization policy.

Do not initialize the existing `BuildTrail` folder as the application repository. Keep secrets, local environments, personal study records, real learner exports and generated build output out of the platform repository. This documentation change does not create or initialize the new repository.

## Object model and useful OOP

OOP is a tool for cohesive responsibilities, not a requirement that every function be a class. Use small domain-specific interfaces at I/O boundaries:

```ts
interface NoteStore {
  load(key: NoteKey): Promise<NoteSnapshot | null>;
  save(command: SaveNoteCommand): Promise<SaveNoteResult>;
}
interface DraftStore {
  put(draft: AccountScopedDraft): Promise<void>;
  list(scope: AccountScope): Promise<AccountScopedDraft[]>;
  remove(key: DraftKey): Promise<void>;
}
interface Clock { now(): number }
```

`SaveNoteResult` is a discriminated union: saved, conflict, unauthenticated, limited or failed. Avoid throwing for expected domain conflicts. Unexpected infrastructure failures are normalized at adapter boundaries. The database's CAS remains authoritative; a TypeScript interface alone does not make saves atomic.

A `NoteSaveCoordinator` may be a small class or reducer-backed service that owns the per-record queue, submitted generation, retry timer and disposal. Inject NoteStore, DraftStore, clock/scheduler and randomness for deterministic retry tests. Do not let React re-renders create multiple independent save coordinators. Its public operations are edit, flush, resolveConflict, recover and dispose; no component mutates internal revision fields.

`PublishCourse` is an application use case that orchestrates authorization, operation lease, validated storage inventory and a transactional publication repository operation. The repository exposes `publishValidatedVersion(command)`, not generic `update(table, values)` calls that let callers bypass invariants. `BundleValidator` converts bounded untrusted input into a validated immutable bundle. It cannot publish and cannot execute downloads.

Simulation models are pure functions with readonly state/event types. A simulation renderer should never need a database dependency. Progress calculation is a pure function over the current required lesson IDs and completed stable IDs. Inject time rather than calling Date.now throughout models.

## Dependency direction

UI → application use cases/hooks → domain interfaces. Infrastructure implements interfaces; composition happens in app/server startup. Domain code imports no React, Supabase, browser storage or Vercel package. SQL owns cross-request transactions; do not duplicate those guarantees in fragile application-side read/modify/write loops.

Use composition, not inheritance, to vary storage or simulation behavior. Do not add a generic repository base class, global service locator, DI container or factory hierarchy for one implementation. Introduce an interface when it expresses a meaningful boundary or makes a real failure mode testable; avoid an interface per trivial helper.

## TypeScript and error rules

Enable `strict`, `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` after validating tooling compatibility. Parse `unknown` external values; avoid `any`, unchecked casts and non-null assertions at trust boundaries. Distinguish DTOs, database rows and UI view models. Use explicit units in names (durationMs, bytes, tokensPerSecond). Avoid JS floating-point for revision integers; simulation tolerance must be documented.

Keep functions cohesive and name them after intent. Prefer early returns over deeply nested branches. Do not impose arbitrary line counts, but split modules with unrelated responsibilities. Comments explain invariants, tradeoffs or surprising domain behavior, not obvious syntax. No swallowed exceptions or success toasts before persistence acknowledgement.

Every async effect has cancellation or lifecycle handling. Handle rejected promises. Do not retry non-idempotent operations without a mutation ID. Never rely on unload handlers or fire-and-forget server work for data durability. Log sanitized categories, not full request/response objects.

## Git, review and maintenance

Small commits should describe observable behavior and verification. Review schema changes with their RLS policies and tests. Review content transforms against source coverage reports. Automated formatting uses Prettier; lint uses ESLint/TypeScript rules and React hooks/accessibility checks. Dependency security reports are triaged by reachability and severity, not ignored or blindly fixed with breaking upgrades.

Definition of ready: relevant product requirement, proposed contract, error cases and verification method are understood. Definition of done: implementation, relevant tests, actual manual evidence where needed, documentation and honest limitations. Tests should protect behavior/invariants, not mirror internal helper calls or create brittle snapshots of everything.

The owner has confirmed that `planning/CLAUDE.md` governs BuildTrail wherever its rules are not Java/framework-specific or finance-specific. Apply its general testing, security, concurrency, idempotency, review, observability and workflow rules. Do not transplant Spring/JDBC/financial-service requirements or assume referenced tooling is installed. See the [root implementation guide](../../IMPLEMENTATION_SPECIFICATIONS.md) for applicability and contract ownership. The source rules file is unchanged.
