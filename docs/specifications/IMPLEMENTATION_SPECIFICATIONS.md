# BuildTrail implementation specifications

Prepared 26 November 2026. This is the entry point for implementing the complete BuildTrail first release. The specifications are saved in the root of the planning project as requested. Application code belongs in the separate `/home/jchukwu/Documents/code/build-trail-platform/` repository.

The release is an online learning platform with one complete 30-lesson Python rate-limiter course, public reading, Google/GitHub login, private saved work across devices, accessible mobile study, search, three interactive demonstrations, and owner-only versioned course publishing. Learners write and run Python locally. A visual prototype alone does not complete the release.

## 1 Read and implement in this order

| Specification | Contract owner |
| --- | --- |
| [Application architecture and browser behavior](IMPLEMENTATION_APPLICATION.md) | Repository layout, dependency boundaries, routes, queries, save coordinator, UI lifecycle and accessibility |
| [Data and API contracts](IMPLEMENTATION_DATA_AND_API.md) | Relational constraints, permissions, exact mutation contracts, concurrency, transfers and deletion |
| [Content and learning experience](IMPLEMENTATION_CONTENT_AND_LEARNING.md) | Bundle format, public adaptation, all lessons/visuals, publishing, deterministic teaching models |
| [Delivery and operations](IMPLEMENTATION_DELIVERY_AND_OPERATIONS.md) | Small implementation packages, tests, CI, staging, launch, backup, recovery and evidence |

Read all four before fixing shared interfaces. Each file specifies implementation outcomes and acceptance behavior; executable schemas, migrations and tests are implementation deliverables, not artifacts already built by this planning task.

## 2 Authority and maintenance

User instructions govern. The nine [product specifications](planning/README.md) remain the product scope baseline. The twelve [technical specifications](planning/technical/README.md) remain the architectural baseline. This root set adds concrete implementation contracts and closes the review gaps; it is not an independently maintained copy of those documents.

Each detailed contract has one owner in the table above. Cross-cutting files link to that owner instead of independently redefining wire fields or SQL guarantees. Where a root contract refines an earlier abbreviated example, use the root contract. Update the relevant baseline when changing its behavior. Do not resolve conflicts silently by choosing the easier interpretation. Architectural changes need an ADR; scope changes must be explicit.

The [engineering rules](planning/CLAUDE.md) govern wherever applicable, per the owner's explicit clarification. Exclude Java/framework-specific and finance-specific prescriptions. Apply general requirements on real integration components, tests-first implementation, idempotency, security, privacy, error handling, concurrency, review, observability and small reviewable changes. Do not infer that references to an unavailable plugin mean it has been installed or executed.

Generic rules translate to this stack: SQL migrations use the real migration sequence; TypeScript integration tests use the owned real database/Storage/API; structured diagnostics omit private data; mutation IDs are checked before domain side effects; UI and server use dependency injection through explicit composition where useful. Google Java formatting, Spring/JDBC/Micrometer APIs, money conventions and Moniepoint-specific components do not apply.

Coverage floor for new application modules is 80% statement/instruction-equivalent and 60% branch, with the TypeScript reporter metric documented. Every public behavior and endpoint needs relevant tests. Database policy coverage is demonstrated through the full operation/role matrix, not misrepresented as TypeScript line coverage. Numeric coverage never replaces critical concurrency/security/recovery scenarios.

Generic review tiers remain applicable: ordinary documentation within the user's requested authoring scope can proceed; runtime/API changes require peer review; schema/security/architecture/production changes require the applicable higher review gate. Implementation readiness requires the specification baseline committed and merged in the application repository. Record actual reviewer identities/decisions there; do not fabricate approvals. The current request authorizes creating these specifications, not a claim that future release gates have already passed.

At bootstrap, copy this approved baseline into application docs with a source hash manifest and the baseline commit/date. Thereafter executable contracts and implementation docs evolve in that repository; planning changes that affect scope must be reconciled deliberately. A clean application clone must not read the planning folder at runtime or build time.

## 3 Fixed scope and non-goals

| Area | Required for first release | Outside release |
| --- | --- | --- |
| Content | 30 lessons, five milestones, setup, references, downloads, public adaptation | Invented extra public courses |
| Learning | Explicit reversible completion, checklist, notes, reflections, evidence, needs review, resume | Automated grading or progression locks |
| Accounts | Google/GitHub, same-user draft recovery, private export/import, deletion | Password UI, custom provider identity merge |
| Teaching | Visual coverage for every lesson, three deterministic richer demos | Hosted Python/IDE or arbitrary uploaded widgets |
| Authoring | Owner upload/validation/preview/publish/rollback/withdrawal | Learner publishing or instructor marketplace |
| UX | Both themes, mobile/desktop, keyboard, readable diagrams, search | Marketing hero, streak pressure, fake metrics |
| Reliability | CAS, idempotency, import isolation, backups/restore evidence | Full offline sync or collaborative editing |
| Operations | Vercel/Supabase, distinct staging/production, free-tier-first measured pilot | Paid subscriptions without owner choice, unnecessary microservices |

Brand name is BuildTrail. The tagline remains editable. Public catalogue starts with the genuine course; a second small bundle is private test evidence for generic course support. All UI must distinguish self-reported work from verified tests.

## 4 Review gaps resolved by this set

| Gap | Required resolution | Owner |
| --- | --- | --- |
| Stale editor after import replace | Durable course epoch plus per-record revision; import changes invalidate old commands even after deletion/recreation | Data/API |
| Preferences changed after import preview | Snapshot and compare preference revision under a shared lock | Data/API |
| Course metadata not assigned storage | Immutable version metadata; active catalogue and pinned reader use their respective version | Data/API and content mapping |
| Expanded milestone groups have no write API | Explicit bounded, authorized mutation with conflict semantics | Data/API |
| One course exceeds export part limit | Complete multipart snapshot and validated reassembly; never truncate | Data/API |
| Reader outline differs from progress denominator | Reader uses pinned required lessons; My Learning uses current published required lessons | Application |
| Original setup needs owner files | Independent public harness/fixtures and clean-directory walkthrough; preserve original source | Content |
| Generic engineering rules treated as merely advisory source | Applicable non-Java/non-finance rules govern; coverage and review conflicts reconciled | This guide and delivery |

These are implementation design choices. They must be encoded in schemas and tests before dependent UI work; prose alone does not prevent lost writes.

## 5 Completion gates

1. **Contract gate:** executable request/content/backup schemas, stable IDs, table/permission model and realistic fixtures agree. No placeholders in a supposedly valid upload sample.
2. **Foundation gate:** clean application clone installs, builds and runs local services; migrations and real isolation tests pass; no planning-folder dependency.
3. **Visual checkpoint:** actual lessons 1 and 11 with lesson 22 stress content in both themes; phone/desktop reading, notes and error states inspected. Incorporate concrete feedback before propagating layout.
4. **Feature gate:** all lessons/references/search/visuals, accounts/saved work, publishing and transfers/deletion implemented with their negative paths.
5. **Reliability gate:** concurrency, privacy, malicious inputs, stale sessions, import replacement, timeout retries and complete restore exercised against real components.
6. **Release gate:** deployed provider flows, mobile journey, backup operations, measured limits and production configuration verified; required reviewers and owner service decisions recorded.
7. **Handoff gate:** release commit/URL, setup, content versions, owner instructions, recovery runbooks, evidence and remaining limitations delivered.

Do not mark a gate passed from code inspection alone when it requires execution. Preserve failed evidence until superseded by a verified fix. No fake Saved states, grading badges, uploads or recovery promises.

## 6 Requirements traceability

| Product requirement | Implementation owner | Required verification |
| --- | --- | --- |
| Complete course and portable setup | Content | 30-row coverage, source mapping, clean first-milestone walkthrough |
| Generic multi-course model | Content and data | Internal second course uploads without platform changes |
| Stable IDs and published snapshots | Data and content | Rename/removal/rollback and pinned-reader consistency |
| Public reading and private work | Application and data | Anonymous/A/B/owner direct-access matrix |
| Reliable notes/reflections | Application and data | New typing during save, response loss, conflict and draft recovery |
| Completion/checklists/resume | Application and data | Independent item writes, reversible status, cross-device resume |
| Search | Content and application | Lesson/code/reference match, stable anchors, no private text |
| Mobile and accessibility | Application and content | Both themes and width matrix, real keyboard and full study journey |
| Visual teaching | Content | Per-lesson visual map, deterministic traces and text alternatives |
| Owner publishing | Content and data | Malicious input, concurrent publish, expired worker and rollback |
| Personal backups/deletion | Data | Round-trip, multipart, stale preview/editor, deletion retry and stale token |
| Deployment/recovery | Delivery | Exact environment checks, OAuth, DB-plus-assets restoration and deletion ledger |
| Engineering governance | Delivery | Tests-first evidence, coverage, review records, sanitized observability |

## 7 External inputs and remaining implementation decisions

Service accounts, protected credentials, actual owner UUID, commercial status, region/residency, support destination, backup destination/scheduler/key custody, repository hosting access and real-device availability are needed at their documented gates. Do not request secrets in prose. Use dashboards or protected environment configuration. Missing deployment inputs do not block independent local implementation.

Exact dependency patches, hosting allowances, runtime compatibility and provider-specific recovery procedures must be verified against current official documentation and selected accounts at bootstrap/provisioning. This set does not assert that historical vendor limits remain current. Record the result in the engineering baseline and run the associated integration tests.

No specification can pre-decide every runtime finding. When a spike disproves a limit or reveals an omitted invariant, stop the dependent package, record evidence, revise the owning contract and affected tests, then continue. Do not reduce release scope silently or add infrastructure to conceal an unbounded operation.
