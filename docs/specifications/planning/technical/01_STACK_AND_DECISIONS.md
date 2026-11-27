# 01 — Stack and architectural decisions

## Selected baseline

| Layer | Choice | Reason and constraint |
| --- | --- | --- |
| Language | TypeScript with strict checking | Shared browser/server contract types; runtime validation still required |
| UI | React, function components | Interactive lesson workspace and reusable teaching components |
| Build | Vite | Simple client application build; no SSR requirement for the pilot |
| Navigation | React Router, data mode | Nested course routes, lazy routes, route errors and deep links |
| Remote state | TanStack Query | Version/account-scoped reads, invalidation and refetch; not the autosave correctness engine |
| Local state | React state/reducers/context | Component state and explicit save/simulation state machines; no Redux initially |
| Styling | CSS Modules plus semantic CSS variables | Original visual design, themes and predictable responsive layouts |
| Accessible controls | Radix Primitives, selectively | Dialogs, drawers, menus and tabs; still test actual integration |
| Icons/fonts | One small licensed SVG icon set; self-hosted JetBrains Mono | Consistent appearance, no third-party font requests; preserve licences |
| Content | unified/remark AST pipeline; react-markdown + remark-gfm | Shared safe Markdown semantics; no MDX or raw HTML execution |
| Highlighting | A small allowlisted highlight.js language build | Python, shell, JSON, SQL, Lua and TypeScript only initially; escaped rendering |
| Boundary validation | Zod | Request, manifest, configuration and backup schemas |
| Backend platform | Supabase Postgres, Auth, Storage | Relational records, OAuth and object storage without operating servers |
| Server runtime | Vercel Node functions | Owner workflows, import/export and account deletion; no second function platform |
| Database access | Supabase JS/Data API and named SQL RPCs | Generated database types; no ORM or separate connection pool initially |
| Tests | Vitest, Testing Library, Playwright, axe-core, pgTAP | Pure logic, components, real browser and database authorization checks |
| Development | npm with committed lockfile, Supabase CLI, Docker | One package manager; reproducible local database |
| Source/CI | Git repository and GitHub Actions | Proposed repository host; owner supplies repository destination |

Use a maintained Node LTS supported by both Vite and Vercel. Start compatibility verification with Node 24; confirm provider support at bootstrap before freezing `.nvmrc`, `engines`, CI and hosting settings. Pin exact toolchain and resolved package versions in lockfiles and an engineering baseline record. Do not claim a version matrix is tested until clean installation and CI pass. Match local Postgres major version to the actual hosted Supabase project, not the latest upstream PostgreSQL release.

## Decision records

### ADR-001: React/Vite instead of Next.js or a static content framework

Selected for the study workspace, client-side simulations and runtime owner publishing. Next.js would be reasonable if search-engine discovery, server-rendered public lessons or per-course social previews became core requirements. It introduces server/client rendering and authentication decisions that the current pilot does not need. Astro is attractive for static teaching sites but runtime publishing plus account-rich study tools reduce that simplicity. A plain static Markdown site cannot satisfy private cross-device progress.

Tradeoff: public pages are client-rendered; crawlers and link previews may receive only generic metadata. Set route titles and descriptions for readers, but do not promise SSR-grade SEO. Revisit before an SEO-led launch. Runtime content must remain independent of a frontend rebuild.

### ADR-002: Supabase instead of Firebase, Django/FastAPI or a custom Node API

The data is relational: stable lessons, immutable versions, per-user answers and transactions. PostgreSQL suits publication and import consistency. Supabase combines that database with OAuth and Storage. Firebase is viable, but would require a different relational/versioning strategy. Django/FastAPI or a custom Node server would add another application runtime and more auth/operations work. Python remains the course language, not an obligation for platform implementation.

Tradeoff: RLS and SQL functions become important application code; test and review them as carefully as TypeScript. Encapsulate Supabase access behind domain-specific adapters, keep migrations in Git and preserve portable exports. Do not build a generic cloud abstraction in anticipation of migration.

### ADR-003: Modular monolith with limited server functions

One repository/deployment and clear modules. No microservices, Kubernetes, message broker, Redis cache, GraphQL or event bus. Postgres handles atomic mutations. Owner publishing is infrequent and bounded. If validated imports cannot complete safely within chosen function limits, add a durable job worker through a new design decision; never hide unfinished work behind a response.

### ADR-004: Browser session with bearer tokens

Use Supabase browser authentication and PKCE. API requests explicitly attach an access token. This avoids introducing an SSR cookie session architecture. The tradeoff is that browser-accessible tokens require strict XSS prevention. Do not mix cookie-based authentication into individual endpoints without revisiting CSRF and session design.

### ADR-005: Selective OOP, functional domain logic

Use interfaces for external dependencies and cohesive services for multi-step workflows. Use pure functions for simulation arithmetic, progress calculations and validation. No `BaseRepository<T>`, inheritance tree or dependency injection framework. See [object design](08_CODE_AND_OBJECT_DESIGN.md).

### ADR-006: Free-tier pilot with measured capacity

A target of 100 active learners is a planning assumption, not a provider capacity guarantee. The initial deployment is a non-commercial pilot unless the owner specifies otherwise. Vercel Hobby eligibility must be checked before launch; public access alone does not establish commercial eligibility. Free Supabase inactivity and resource limits affect availability. Upgrade triggers and recovery obligations are defined in [operations](10_INFRASTRUCTURE_AND_OPERATIONS.md).

## Dependency rules

Add a dependency only for a named requirement. Check maintenance, licence, browser/server suitability and known advisories. Prefer stable releases, no canary dependencies. Use `npm ci` in CI. Commit schema/library updates with relevant tests. Keep runtime-only secrets out of browser imports and inspect emitted bundles. Select and pin the archive library during the malicious-bundle spike; require streaming enumeration, actual expanded-byte accounting and no automatic extraction to arbitrary paths.

References: [Vite](https://vite.dev/guide/), [React Router](https://reactrouter.com/start/data/installation), [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview), [Zod](https://zod.dev/), [Radix](https://www.radix-ui.com/primitives/docs/overview/introduction), [Node release policy](https://nodejs.org/en/about/previous-releases). These support tool capabilities; the architectural choices above are BuildTrail recommendations.
