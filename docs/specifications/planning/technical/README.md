# BuildTrail technical implementation specification

Status: design for implementation, not an implemented or tested application. Prepared 26 November 2026. Application destination: `/home/jchukwu/Documents/code/build-trail-platform/`.

## Confirmed design inputs

The owner selected free tiers first, a small public launch of about 100 active learners, and comparison of alternative stacks. Google and GitHub login, mobile study, visual teaching, private notes/progress, multi-course support and owner publishing remain required. Coding exercises run locally. No hosted IDE, automatic grader, payments or public instructor accounts.

Recommendation: a modular TypeScript application, React/Vite frontend on Vercel, Supabase Auth/Postgres/Storage, and bounded Vercel Node functions. This is an engineering recommendation supported by the decisions below, not a claim that services have been configured.

## Reading map

| Specification | Implementation responsibility |
| --- | --- |
| [01 Stack and decisions](01_STACK_AND_DECISIONS.md) | Technology choices, alternatives, dependency policy |
| [02 Architecture and boundaries](02_ARCHITECTURE.md) | Runtime topology, modules, trust boundaries, load assumptions |
| [03 Database and authorization](03_DATABASE_AND_AUTHORIZATION.md) | Tables, keys, constraints, RLS and mutation rules |
| [04 APIs and synchronization](04_API_AND_SYNC.md) | Contracts, concurrency, drafts, import/export |
| [05 Content and publishing](05_CONTENT_AND_PUBLISHING.md) | Bundle schema, parsing, validation, version publication |
| [06 Frontend and visual engineering](06_FRONTEND_AND_VISUALS.md) | Components, responsive UX, accessible teaching models |
| [07 Security and privacy](07_SECURITY_AND_PRIVACY.md) | Threat model, OAuth, deletion, secrets, abuse controls |
| [08 Code and object design](08_CODE_AND_OBJECT_DESIGN.md) | Repository layout, interfaces, OOP, engineering conventions |
| [09 Testing and quality](09_TESTING_AND_QUALITY.md) | Unit, database, browser, performance and release evidence |
| [10 Infrastructure and operations](10_INFRASTRUCTURE_AND_OPERATIONS.md) | Environments, CI/CD, backup, recovery, cost triggers |
| [11 Implementation work packages](11_IMPLEMENTATION_PLAN.md) | Dependency-ordered deliverables and acceptance gates |
| [12 Decisions and sources](12_DECISIONS_AND_SOURCES.md) | Remaining inputs, risk register, official references |

Read the parent [product specification](../01_PRODUCT_AND_SCOPE.md), [UX specification](../02_DESIGN_AND_MOBILE_UX.md) and [acceptance criteria](../09_ACCEPTANCE_AND_QA.md) alongside this set. The parent nine numbered files own product scope; these twelve numbered files own technical detail. A conflict must be reconciled in both places rather than silently choosing whichever is easier. The combined parent plan does not embed this technical set; it links here.

Examples below are proposed contracts and pseudocode, not production migrations, complete API schemas or working implementations. Implementation must produce executable schemas, migrations, tests and measured evidence. Table and operation names are intentionally consistent across these documents. Change them together if necessary.

## Build handoff

Implement inside `/home/jchukwu/Documents/code/build-trail-platform/`; preserve the original course sources in the separate `BuildTrail/` planning folder. Start with work packages T00–T02, then a real two-lesson visual slice. Follow all release gates; a polished demo is not a complete release. Post meaningful progress in chat during work, with decisions and outcomes. Record evidence in the application's build log. Never describe an unrun check as passed.

The files in this folder are the maintained technical source. Do not create a second independently edited technical master. Exact dependency patches and provider settings are selected and recorded at bootstrap, then locked; do not install floating `latest` versions on each build.

## Detailed implementation contracts

The [root implementation guide](../../IMPLEMENTATION_SPECIFICATIONS.md) and its four focused specifications define concrete build contracts and work packages. They refine the abbreviated examples here and own their detailed wire/concurrency contracts; maintain cross-references and reconcile changed behavior rather than maintaining independent duplicate specifications.
