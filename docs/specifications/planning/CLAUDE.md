

## Domain Rules

Domain-specific rules (data access framework, Tier 3 triggers, naming conventions, test patterns) live in each team's own repo — either in the project's `CLAUDE.md` or in the team's Claude Code plugin. This plugin provides only universal rules that apply across all teams.

---

## Legacy Services vs Greenfield

**Greenfield services (new repos):** Enforce all rules from day 1. Use `/bootstrap-service-repo` for correct setup.

**Established services (monnify-*, pos-*, kuwego-*, etc.):** Apply the ratcheting principle:
- Rules apply to **new code only** — don't rewrite working code to match
- Coverage targets are directional — measure current baseline, improve incrementally
- Existing patterns are acceptable until refactored:

| Rule | Greenfield (enforced) | Legacy (acceptable until migrated) |
|------|----------------------|----------------------------------|
| Money types | `long` minor units | `BigDecimal` (established in all payment services) |
| Data access | Spring Data JDBC (see `rules/spring-data-jdbc.md`) | JPA / Hibernate (established in all services) |
| DI | Constructor only (@RequiredArgsConstructor) | @Autowired field injection (common in older services) |
| HTTP client | RestClient | RestTemplate, Retrofit, OkHttp (Spring Boot 2.7 services) |
| Config | @ConfigurationProperties records | @Value (established pattern, 248 instances vs 2 in one service) |
| Idempotency | Required on all mutations | Not implemented in legacy (add on new endpoints only) |
| Resilience | Resilience4j Decorators | None or basic try-catch (add on new external calls only) |
| Coverage | 80% instruction / 60% branch | Baseline + ratchet (never decrease, improve incrementally) |
| Spring Boot | 3.x+ / 4.x | 2.7.x (migrate when capacity allows) |
| Observability | Observation API (`ObservationRegistry`) — produces metrics + traces + log correlation | Direct `MeterRegistry` / `Counter.builder()` / `Timer.start()` (add Observation on new code only) |
| Imports | No wildcard imports (`import x.y.*`) — explicit imports only | Wildcard imports (fix on touch) |
| Visibility | Package-private by default — `public` only when accessed cross-package | `public` everywhere (apply on new classes only) |

**The `/baseline-codebase-audit` skill measures the starting point. The `/pre-pr-quality-check` skill enforces rules on new code in the diff, not on the entire codebase.**

---

## Universal Enforced Rules

These rules apply to all teams. Claude Code must refuse to generate code that violates them.

### Code Style

**ENFORCED: All generated Java code must comply with Google Java Style Guide.**
- 2-space indentation (not tabs, not 4 spaces)
- Braces: Egyptian style (opening brace on same line)
- Line length: 100 characters maximum
- Import ordering: static imports first, then non-static, alphabetical within groups
- No wildcard imports
- Records for DTOs, sealed interfaces for type hierarchies
- Java 25 features: use records, sealed interfaces, pattern matching switch, text blocks where appropriate

### Test Coverage

**ENFORCED: Minimum 80% instruction coverage, 60% branch coverage on all modules.**
- Every public method must have at least one unit test
- Every REST endpoint must have at least one integration test
- Coverage is checked in CI. MRs that lower overall module coverage are blocked.
- New repos: 80% instruction / 60% branch enforced from first MR.
- Adopted repos: coverage must not decrease from the baseline measured at onboarding. The 80% / 60% target is the destination — teams ratchet toward it over time. Once a module reaches the target, the absolute threshold applies going forward.

### Test & data discipline

**ENFORCED: Integration tests use real components. A test double (mock / stub / fake) is justified ONLY for an external system that genuinely cannot run in CI — a third-party network service, a paid SaaS API, or hardware.** Everything you own — your database, cache, message broker, and your own internal services/collaborators — runs for real (Testcontainers, an embedded broker, or a real wired application context). Mocking is the last resort, not the default: if a component can run in CI, do not mock it. **Stubbing an internal collaborator inside an integration test is a defect, not a shortcut.** **Prefer an in-process real component (embedded broker, in-JVM HTTP/gRPC server) over a container when both are faithful** — it is faster and avoids container-pressure flakiness. Reach for a container only when fidelity or deployability demands it: no in-process build exists (a cloud-DB emulator), the test needs exact engine semantics (Lua scripting, CDC connectors, real TLS/networking), or the artifact must double as a deployable simulator for shared environments. (Unit tests may freely mock collaborators — this rule is about *integration* tests.) The strongest form is a deployable simulator that speaks the providers' real protocols (REST/SOAP/gRPC) and is reused in CI *and* in shared environments, so the same artifacts cover ITs and manual QA.

**ENFORCED: Static test configuration lives in config files (e.g. per-test YAML profiles), not hardcoded inline in test annotations.** Reserve runtime-property injection (the framework's dynamic-property hook) strictly for values only known at runtime — Testcontainer URLs, random ports, embedded-broker addresses. Don't bake tunables (retry/circuit-breaker settings, cache TTLs, feature flags) into inline annotation properties.

**ENFORCED: DB migrations use the project's real versioning scheme** (e.g. monotonic timestamp). Do not use sentinel/inflated version numbers to force run-ordering. For test-only seed tables, prefer seeding in-test over a forced-last migration.

**ENFORCED: Production seed / reference data for a system that replaces a legacy one must be derived from — and cite — the legacy source** (repo/file/table), so replay-parity ("0% functional delta vs legacy") holds. Do not invent production seed values. Test fixtures may be synthetic. Where the legacy source is silent on a choice (e.g. ordering a new rail it never had), follow the authored spec's decision and flag it — never invent money-routing / money-math.

**ENFORCED: No Spring-context bean-override mocks in tests** (e.g. Spring Boot's `@MockitoBean` / `@MockitoSpyBean`). A test that needs a Spring bean uses the real bean — backed by the real infrastructure (a protocol-faithful simulator for external providers, an embedded broker, real seeds, a real cache backend). Replace controller "slice" tests that mock the service layer with full integration tests against the real service. The right end-state is a build-enforced fitness check that fails on any such annotation in test sources — turn it on once the existing uses are eliminated. **Corollary: a cache integration test uses the project's *production* cache backend** (e.g. a real Redis container), not a lighter in-memory `CacheManager` substitute — only the production backend exercises real serialization and outage-fallthrough behaviour.

### PII Protection

**ENFORCED: No PII in logs, events, metrics, or error messages.**
- No customer names, phone numbers, email addresses, financial account numbers, government IDs
- Operation IDs, request IDs, idempotency keys, and opaque references are acceptable
- Use structured logging (SLF4J + Logback). Never concatenate PII into log strings.
- Kafka events must contain only opaque references, never PII.
- Error responses to callers must not leak internal identifiers (user IDs, entity IDs, infrastructure details).

### Idempotency

**ENFORCED: Every mutation endpoint must accept an idempotency key.**
- API: `Idempotency-Key` header, mapped to `idempotency_key` column
- External service calls: deterministic reference derived from entity ID + operation type (e.g., `"{entity_id}:CREATE"`, `"{entity_id}:DISPATCH"`)
- Never generate random UUIDs for references to external systems
- Idempotency check is the **FIRST** operation in every mutation handler
- On duplicate key: return the existing result, do NOT re-execute

### No Secrets in Code

**ENFORCED: Never commit secrets, API keys, passwords, tokens, or credentials.**
- Use environment variables or secret management (Vault, GCP Secret Manager)
- Spring/Quarkus: `application.yml` / `application.properties` must use `${ENV_VAR}` placeholders for all credentials
- .NET: `appsettings.json` must not contain literal secrets — use environment variables, User Secrets (dev), or secret manager (prod)
- Javalin/other JVM: externalize via environment variables or config files excluded from source control
- `.gitignore` must exclude `.env` files, credential files, and key stores
- If a secret is accidentally committed, rotate it immediately — removing from git history is not sufficient

### No Silent Exception Swallowing

**ENFORCED: Never catch an exception and silently discard it.**
- Every `catch` block must either: log the exception, propagate it, or handle it with explicit logic
- Kafka consumers must not swallow exceptions — failed messages go to DLQ or are retried, never silently dropped
- Empty `catch` blocks are forbidden. If an exception is intentionally ignored, add a comment explaining why and log at DEBUG level.

### No Floating-Point Money

**ENFORCED: Never use `float` or `double` for monetary amounts.**
- Use `long` in minor currency units (kobo, pence, cents) for all amounts
- Use `BigDecimal` only for exchange rates and percentage calculations
- Fee calculations, posting amounts, and transaction values are always `long` minor units
- Split percentages are integers in basis points (10000 = 100%)

### Constructor Injection Only

**ENFORCED: Use constructor injection for all Spring dependencies.**
- Use `@RequiredArgsConstructor` (Lombok) — never `@Autowired` on fields
- No field injection, no setter injection
- This ensures immutability, testability, and makes dependencies explicit

### Session Hygiene

**ENFORCED: Monitor session length and recommend fresh sessions proactively.**
- After 50 tool calls in a single session, proactively recommend the engineer start a fresh session: "This session has made N tool calls. For best output quality, consider starting a fresh session (exit + claude)."
- After 80 tool calls, insist: "This session has exceeded 80 tool calls. Context quality is degraded. Please start a fresh session for the next task."
- When a chunk implementation completes (task registry updated, tests pass), always recommend: "Chunk complete. Start a fresh session for the next chunk."
- Never attempt more than one chunk implementation in a single session unless the engineer explicitly overrides.

---

## Advisory Rules (Proactive Coaching)

Claude Code proactively suggests improvements but does not block code generation.

### Error Handling

**ADVISORY: Suggest missing error handling.**
- External calls should have explicit error handling with appropriate exception types
- HTTP client errors should distinguish between retryable (5xx, timeout) and non-retryable (4xx) failures
- Suggest circuit breaker configuration for external dependencies

### Concurrency

**ADVISORY: Flag potential concurrency issues.**
- Warn about shared mutable state in Spring `@Service` beans
- Suggest optimistic locking for concurrent state machine transitions
- Flag potential race conditions in idempotency key checking (read-then-write is not atomic; use `INSERT` with `ON CONFLICT`)

### DDL Best Practices

**ADVISORY: Validate DDL migrations.** See `rules/spanner-ddl.md` for the full Spanner-specific rule.
- Warn about auto-increment or time-ordered primary keys in distributed databases (causes write hotspots in Spanner; less critical in MySQL/PostgreSQL but still a scalability concern)
- Suggest UUID v4 (random) for primary keys in distributed databases. Do NOT use UUID v7 (time-ordered) for Spanner; acceptable for MySQL/PostgreSQL where insert ordering improves B-tree locality.
- Warn about missing secondary indexes for common query patterns
- **Spanner-specific:** suggest interleaved tables for parent-child relationships with high locality, `STORING` clause for covering indexes
- **PostgreSQL-specific:** suggest partial indexes for filtered queries, `jsonb` over `json`
- **MySQL-specific:** verify InnoDB engine, `utf8mb4` charset, appropriate index lengths

### Resilience Patterns

**ADVISORY: Suggest resilience improvements.**
- Recommend circuit breakers for external service clients
- Suggest retry with exponential backoff for transient failures
- Recommend timeout configuration for all external calls
- Suggest bulkhead pattern for isolating failures by provider or dependency

### Observability (Spring Boot 4+ / greenfield)

**ENFORCED (greenfield): Use Observation API over direct Micrometer for business observability.**
- `ObservationRegistry` + programmatic `Observation` produces both a timer metric AND a trace span from a single instrumentation point — no dual instrumentation needed
- Do not use `MeterRegistry` directly for business operations (step execution, service calls, transaction lifecycle). `MeterRegistry` is used under the hood by auto-configured handlers.
- Do not use the OpenTelemetry API directly — Spring recommends Micrometer Observation as the instrumentation API
- Test with `TestObservationRegistry` from `micrometer-observation-test` for unit tests (no Spring context needed). Use qualified `TestObservationRegistryAssert.assertThat()` — avoid static import (clashes with AssertJ).
- Low-cardinality key values become metric tags (country, status, outcome). High-cardinality values (transaction ID, account number) go to traces only.
- Legacy services on Spring Boot 2.7/3.x: continue using `MeterRegistry` directly. Migrate to Observation API when upgrading to Boot 4.

### Visibility

**ENFORCED (greenfield): Package-private by default.**
- Start with package-private (no modifier). Promote to `public` only when accessed from outside the package.
- Spring beans (`@Component`, `@Service`) work with package-private visibility — Spring uses reflection for instantiation.
- Step executors, internal helpers, mappers, config records used only within their package: package-private.
- Controllers (`@RestController`), shared services used cross-package, SPI implementations: public.
- Legacy services: apply on new classes only. Do not retrofit existing code.

### Diagrams

**ADVISORY: Use Mermaid as the default diagramming tool.**
- Mermaid code blocks inline in markdown — renders natively in GitLab MRs and Confluence
- Use C4 diagram types (`C4Context`, `C4Container`, `C4Component`, `C4Deployment`) for architecture-level views
- Mermaid covers ~80% of diagrams: sequence flows, state machines, component relationships, ERDs
- Fall back to draw.io (via `/drawio` skill) only when precise visual layout is needed: system architecture overviews with 10+ nodes, deployment topology diagrams, network diagrams with infrastructure icons
- Do not use Structurizr, PlantUML, Excalidraw, or D2

### Input Validation

**ADVISORY: Validate at system boundaries.**
- Use `@Valid` on REST request bodies — let Bean Validation catch malformed input before business logic
- Validate external API responses defensively (null checks, type assertions)
- Trust internal code and framework guarantees — don't re-validate inside service methods

### Configuration Externalization

**ADVISORY: Externalize all configuration.**
- Use `@ConfigurationProperties` records — not `@Value` for structured config
- No hardcoded thresholds, timeouts, URLs, or feature flags in source code
- Config key convention: `{service}.{component}.{concern}.{property}` (e.g., `payments.adapter.provider.timeout`)

### Naming Convention Inference

**ADVISORY: Infer and enforce naming conventions from existing code.**
- Before generating code, scan the target package for naming patterns: camelCase vs snake_case, class prefixes/suffixes (e.g., `*Service`, `*Adapter`, `*IT`), method naming style, constant casing.
- All generated code must match the inferred conventions. If the codebase uses `*Repository` for data access classes, do not generate `*Dao`.
- If conflicting conventions exist in the same package, flag it rather than picking one silently.

### Session Audit Log

**ADVISORY: Maintain a decision log during multi-step skills.**
- For skills that span multiple steps (spec generation, implementation chunks, quality checks), track each decision, approval, and modification in a structured log.
- Format: append a `## Session Log` section at the end of skill output listing: step taken, files read, decisions made, engineer approvals received, and any redirects.
- This enables post-hoc review of how the AI arrived at the final output — especially valuable for Tier 3 changes and incident post-mortems.

### Context Manifest

**ADVISORY: Report loaded context at the end of every skill output.**
- Every skill that reads files must list which files/docs it loaded in its output, so the engineer can verify the working set and identify missing context.
- Format: `Context loaded: {file1}, {file2}, ...` at the end of the output section.
- If the skill determines that critical context may be missing (e.g., no architecture docs found, no domain-specific rules found in project CLAUDE.md), flag it explicitly.

### Escalation Protocol

**ADVISORY: Flag ambiguity instead of guessing.**
- If AI confidence is below threshold or conflicting information is detected, flag for human decision rather than guessing.
- State what you are uncertain about and why. Present the options with trade-offs.
- Applies to all skills — not just implementation. Spec generation, test generation, and analysis skills should escalate when assumptions would be risky.

### Local Execution Gate

**ADVISORY: All tests must pass on a local app instance before commit.**
- Backend: Run the full test suite against a local service (Docker Compose for dependencies).
- Mobile: Run tests against a local emulator (Android/iOS) or BrowserStack Local.
- Web: Run tests against a local dev server with real browser instances (Playwright).
- Use `/run-local-tests` to orchestrate local execution. If tests fail, use `/analyse-test-failure` to diagnose.

---

## Governance Tiers

Every change has an approval tier. The tier determines who must approve before the change reaches production.

| Tier | Name | Who Approves | Change Types |
|------|------|--------------|-------------|
| **1** | Auto-Approve | None (beyond the requesting engineer) | Code formatting, documentation, lint fixes, test generation for existing code, patch dependency bumps with no API changes |
| **2** | Review-Required | At least one engineer other than the author | Feature implementation, API changes, configuration changes, bug fixes, integration/adapter changes |
| **3** | Multi-Approve | At least two engineers including a Head of Engineering, engineering manager, or principal engineer | Production deployments, schema migrations (any DDL), security configuration, architecture doc changes, **CLAUDE.md rule changes**, domain-critical components |

**Tier 1 constraint:** Auto-approve only applies to changes that do not alter runtime behavior. If a lint fix removes a code path that is actually reachable under a specific condition, it is not Tier 1.

**Domain-specific Tier 3 triggers** are defined in each team's project CLAUDE.md. Each team identifies its critical code paths (financial logic, state machine definitions, external system clients, security boundaries) and designates them as Tier 3.

---

## Spec Engineering Workflow

Spec engineering is the process of translating a product requirement into an implementation-ready specification through structured collaboration. It is the single most important activity in AI-native engineering. Who authors the spec depends on scope: the engineering manager for domain features (the default), senior engineers for well-scoped work in mature domains, or the Head of Engineering for cross-domain or Tier 3 changes. A good spec produces correct code on the first generation pass.

**Upstream of the spec — the API Contract.** For cross-surface (mobile/web consumers), Tier 3, or multi-deployment-unit features, the backend design owner produces a canonical **API Contract** via `/generate-api-contract` and merges it *before* the consuming tech specs are written. The contract — endpoints, payloads, error codes, auth model, versioning — is the shared boundary the backend, mobile, and web teams build against in parallel; mobile and web design generation is owned by those teams' own plugins, with the contract as input. In parallel, QA produces BDD test cases via `/generate-test-cases-from-prd`. For single-team, Scout-sized features, skip the standalone contract and author it inline in tech-spec §4 — single source of truth. See `patterns/api-contract.md`.

**The Collaboration Loop (6 phases):**

```
1. SEED INTENT ──→ 2. AI STRUCTURES ──→ 3. AI CHALLENGES ──→ 4. HUMAN RESOLVES ──→ 5. AI VALIDATES ──→ 6. HUMAN APPROVES
      │                   │                    │                     │                     │                    │
  Engineer            Claude Code          Claude Code           Engineer             Claude Code          Engineer
  states what         produces a           identifies gaps,      answers the          verifies spec        reviews the
  needs to be         structured spec      ambiguities, edge     questions,           is internally        final spec,
  built and why       draft with all       cases, missing        makes judgment       consistent and       approves for
                      sections filled      error handling        calls                complete             implementation
```

1. **Seed Intent** — Engineer provides context: the API Contract (if produced) and QA BDD test cases, which product change, which component, what architecture docs say, constraints.
2. **AI Structures** — Claude Code produces structured spec draft following `templates/tech-spec-template.md`. Every section filled.
3. **AI Challenges** — Claude Code reviews its own draft and raises questions (unresolved decisions, edge cases, missing error handling).
4. **Human Resolves** — Engineer answers each question with domain knowledge and judgment.
5. **AI Validates** — Claude Code verifies the spec is internally consistent and complete.
6. **Human Approves** — Engineer reviews the final spec and approves for implementation.

**Implementation is gated on spec merge.** Do not start coding until the implementation spec is merged into the main branch. Use `/implement-feature-workflow` for full feature orchestration with worktree isolation and batch mode, or `/implement-feature-chunk` for individual chunks.

**Hotfix exception:** MRs labelled `hotfix` may bypass the spec gate for production incidents where writing a spec first is impractical. A retroactive spec and post-mortem are required within 48 hours, tracked as a follow-up ticket. Repeated hotfix exemptions for the same component signal the component needs a proper spec.

---

## Implementation Pattern: Chunk-Review-Redirect

Once the implementation spec is merged, code generation begins. The core principle: build in small, reviewable pieces. Review each piece. Redirect if off-track.

**TDD Enforcement:** Each chunk follows the Red-Green-Refactor cycle. Write tests first (red — tests fail because implementation doesn't exist), implement the minimum code to make tests pass (green), then refactor. The `/implement-feature-chunk` skill enforces this with a failure feedback loop (max 3 iterations of diagnose-fix-rerun before escalating to the engineer). Use `/generate-tdd-tests` for stack-specific test generation and `/analyse-test-failure` for automated failure diagnosis.

```
       ┌─────────────────────────────────────────┐
       │                                         │
       ▼                                         │
   CHUNK: Generate a single       NO ──→  REDIRECT: Explain
   coherent piece of code                  what is wrong,
       │                                   provide corrected
       ▼                                   direction
   REVIEW: Engineer reads             ▲
   the generated code                 │
       │                              │
       ├── Correct? ─── YES ──→ Commit, next chunk
       │
       └── Wrong? ─────────────────────┘
```

**What counts as a chunk:**
- One REST endpoint (controller method + request/response DTOs)
- One service method (e.g., `OrderService.validateOrder()`)
- One background job (e.g., `ScheduledCleanupJob.java`)
- One adapter method (e.g., `ProviderAdapter.dispatch()`)
- One Spanner migration script
- One set of unit tests for a specific method
- One configuration change (workflow definition, routing rule, business rule config)
- One observability bundle (metrics + alerts for a specific component)

**Anti-patterns to refuse:**

| Anti-Pattern | Why It Fails |
|-------------|-------------|
| **Generate and Merge** — Generate a large block and merge without careful review | Accumulates subtle errors that compound. Dangerous in domain-critical code. |
| **Big Bang Implementation** — "Implement the entire service layer" in one pass | Unreviewable output. Errors in early parts propagate to later parts. |
| **Test Blindness** — Accept generated tests without reading them | Tests that call a method but only assert `assertNotNull(result)` are worthless. |
| **Spec Drift** — Start implementing without a merged spec, or deviate from spec during implementation | The spec is the contract. If the spec needs to change, update the spec first. |
| **Hope-Based Concurrency** — Assume AI-generated concurrent code is correct without stress testing | Every idempotency key check, every optimistic lock, every state transition guard must be tested under contention. |
| **Copy-Modify Shortcut** — Copy an existing integration and modify for a new target | Each target's API, error codes, callback format, and retry semantics are unique. Scaffold from the interface. |

For automated orchestration of the chunk loop with persistent state and resume, use `/implement-feature-workflow`.

---

## Code Review

Code review has two AI-assisted phases, an optional adversarial phase, plus human deep review.

### Phase 1: Author-Side (Run Pre-PR Quality Check)

Before submitting an MR, the author runs `/pre-pr-quality-check`. Claude Code reviews for:

| Category | Checks                                                                                                  |
|----------|---------------------------------------------------------------------------------------------------------|
| Style | Google Java Style Guide compliance, consistent naming conventions                                       |
| Security | No PII in logs or events, no hardcoded secrets, no SQL injection vectors                                |
| Performance | No N+1 queries, no unbounded collections, no blocking calls in reactive chains                          |
| Test coverage | Minimum 80% instruction coverage, 60% branch coverage, all public methods have tests                    |
| Idempotency | All mutation endpoints accept idempotency keys, all external service calls use deterministic references |
| Error handling | All external calls wrapped in try-catch, appropriate exception types used, no swallowed exceptions      |
| Spec compliance | Generated code matches the approved tech spec                                                           |

### Phase 2: Reviewer-Side (Run Code Review)

When reviewing an MR, the engineering manager or peer reviewer runs `/code-review !{number}`. Claude Code reviews the MR diff for:
- Enforced rule violations (same checks as Phase 1, applied to the MR diff)
- Pattern registry divergence
- Spec compliance (maps MR changes to tech spec chunks, flags deviations)
- Test presence for new public methods and endpoints
- **Human focus areas** — business logic, concurrency, data integrity, external contracts, and security boundaries that require human judgment

### Phase 3 (Optional): Adversarial Review

For high-risk changes (Tier 3, security boundaries, financial logic), run an adversarial review that challenges the design itself — not just implementation correctness. Four variants are available:

| Command | Reviewer model | Mechanism |
|---------|---------------|-----------|
| `/adversarial-review` | Current model | Prompt-only, no CLI dependency — works in any harness |
| `/gemini:adversarial-review` | Gemini | Shells to Gemini CLI |
| `/claude:adversarial-review` | Claude | Shells to Claude CLI |
| `/codex:adversarial-review` | Codex/GPT | Shells to Codex CLI (via [Codex plugin](https://github.com/openai/codex-plugin-cc)) |

The prefix selects which model acts as "police." For true cross-model review, use a different prefix than the model that generated the code. The unprefixed `/adversarial-review` runs on the active model with an adversarial persona — useful in Antigravity where you can switch models before running.

### Human Deep Review

The human reviewer focuses on the areas `/code-review` flags for human judgment:
- **Business logic correctness** — Does the implementation correctly handle domain rules? Are edge cases covered? Do outputs match the spec?
- **Architectural alignment** — Does the implementation respect component boundaries from architecture docs? Any cross-boundary calls that should go through defined interfaces?
- **Domain correctness** — Concerns specific to this team's domain (defined in the project's CLAUDE.md). Reviewers must understand the domain well enough to catch errors AI cannot reliably validate.

---

## Observability

**Rule: An MR that adds or modifies business logic must include the corresponding observability instrumentation. "Code works" is not sufficient — "code works and we can see it working in production" is the bar.**

Every feature implementation produces three outputs: **code**, **tests**, and **observability**. Observability is not an afterthought — it is a required chunk in every implementation cycle.

The observability bundle (generated via `skill: Generate Observability Bundle`) contains:
- **Micrometer metric definitions** — counters, histograms, gauges for the feature
- **Alert rule YAML** — thresholds and conditions for PagerDuty/Alertmanager
- **Grafana dashboard JSON** — panels for the feature's metrics

Domain-standard metrics are defined in each team's project CLAUDE.md and generated automatically when producing the observability bundle.

---

## Incident Response

**Rule: AI never executes production commands during incidents. It drafts, suggests, and generates queries. The on-call engineer executes. Every production action during an incident is logged with the engineer's identity.**

AI assists during production incidents but never acts autonomously:
1. **Alert fires** — On-call engineer opens incident channel
2. **AI assists with triage** — Correlate alert with recent deployments, surface relevant error patterns, generate targeted queries to quantify blast radius
3. **Engineer diagnoses** — Root cause determination requires human judgment
4. **AI assists with remediation** — Draft rollback plan, generate targeted fixes, draft stakeholder communication from incident template
5. **Engineer executes** — Human approval required for every production action
6. **AI assists with post-mortem** — Generate incident timeline, draft post-mortem, identify CLAUDE.md rules or test gaps that could have caught the issue, propose new test cases or monitoring rules

---

## Pattern Registry

The following pattern docs define cross-platform standards. When generated code diverges from a registered pattern, flag it during the pre-PR quality check.

| Pattern | Path | Purpose |
|---|---|---|
| Outbox | `patterns/outbox.md` | CDC-based event publishing via `com.moniepoint:outbox` |
| Webhook Normalization | `patterns/webhook-normalization.md` | Canonical adapter event model for provider callbacks |
| Idempotency | `patterns/idempotency.md` | Key strategy, header convention, duplicate detection |
| API Contract | `patterns/api-contract.md` | Shared cross-team boundary — endpoints, payloads, errors, auth, versioning; upstream of tech specs |
| Provider Adapter | `patterns/provider-adapter.md` | Standard adapter SPI — contract, error mapping, config |
| Error Model | `patterns/error-model.md` | Sealed exception hierarchy, error codes, HTTP mapping |
| Observability | `patterns/observability.md` | Standard metrics, alerts, dashboard structure |
| Observation API | `patterns/observation-api.md` | Micrometer Observation API for unified metrics + traces (Spring Boot 3+/4+) |
| Status Mapping | `patterns/status-mapping.md` | Config-driven provider status → domain state mapping |
| Scheduled Jobs | `patterns/scheduled-jobs.md` | ShedLock distributed locking, batch pagination |
| Scoped Value | `patterns/scoped-value.md` | ScopedValue replacing ThreadLocal for request-scoped context (Java 21+) |
| Circuit Breaker Fallback | `patterns/circuit-breaker-fallback.md` | Resilience4j Decorators composition, typed fallbacks |
| Strategy Dispatch | `patterns/strategy-dispatch.md` | canHandle/process routing pattern |
| PII Masking | `patterns/pii-masking.md` | Shared PiiMasker utility, field taxonomy |
| Shared Contracts | `patterns/shared-contracts.md` | Cross-service contract modules, versioning strategy |
| Database Migration | `patterns/database-migration.md` | Versioned DDL scripts, naming conventions, rollback strategy |
| JPA to JDBC Migration | `patterns/jpa-to-jdbc-migration.md` | JPA to Spring Data JDBC migration guide: entity mapping, repository changes, query translation |
| Readiness Checks | `patterns/readiness-checks.md` | Standard pre-flight checks for skills (build file, source dir, compilation) |
| Parallel Agents | `patterns/parallel-agents.md` | Orchestrator-owned git, parallel sub-agents, result merging |
| Context7 Fallback | `patterns/context7-fallback.md` | Tier 2 version-specific docs via Context7 MCP |
| Rust Error Propagation | `patterns/rust-error-propagation.md` | thiserror enums, From impls, IntoResponse HTTP mapping |
| Rust Axum Extractors | `patterns/rust-axum-extractors.md` | Custom extractors for auth, validation, state management |
| .NET Middleware Pipeline | `patterns/dotnet-middleware-pipeline.md` | ASP.NET Core request pipeline ordering and custom middleware |
| .NET Options Pattern | `patterns/dotnet-options-pattern.md` | Strongly-typed config binding with IOptions, validation, reload |
| Go Graceful Shutdown | `patterns/go-graceful-shutdown.md` | Signal handling, context cancellation, connection draining |
| Go HTTP Middleware | `patterns/go-http-middleware.md` | Middleware chain pattern with Chi/stdlib for cross-cutting concerns |
| HTTP Exchange | `patterns/http-exchange.md` | @HttpExchange + HttpServiceProxyFactory declarative clients (Spring 7) |
| Quarkus Config Mapping | `patterns/quarkus-config-mapping.md` | @ConfigMapping vs @ConfigProperty, nested groups, profile overrides |
| Javalin Plugin Architecture | `patterns/javalin-plugin-architecture.md` | Plugins for cross-cutting concerns, AccessManager for auth |
| Javalin FluentJDBC | `patterns/javalin-fluent-jdbc.md` | FluentJDBC data access pattern for Javalin + Guice services |
| Javalin Typesafe Config | `patterns/javalin-typesafe-config.md` | HOCON config with ConfigurationManager wrapper, env var overrides |
| Javalin Saga Orchestration | `patterns/javalin-saga-orchestration.md` | SagaOrchestrator + SagaStep pattern with compensation |
| Quarkus REST Client | `patterns/quarkus-rest-client.md` | MicroProfile REST Client interface pattern, config keys, injection |
| Confluence CI Sync | `patterns/confluence-ci-sync.md` | CI-driven markdown-to-Confluence publishing via `mark` |

---

## Available Skills

Skills are automated, multi-step operations in `claude-engineering/skills/`. Invoke with `/skill-name` in Claude Code sessions.

| | Skill                                          | Purpose |
|---|------------------------------------------------|---------|
| **Setup** | `/start`                                       | Entry point wizard — routes to the right skill |
| | `/bootstrap-service-repo`                      | New single-module repo with standard structure |
| | `/bootstrap-multi-module-repo`                 | New multi-module repo with parent POM + child modules |
| | `/onboard-repo`                                | Onboard existing repo (single or multi-module) |
| | `/baseline-codebase-audit`                     | One-time adoption audit |
| **Plan** | `/think`                                       | Design reasoning — no code, just decisions and trade-offs |
| | `/grill-me`                                    | Adversarial pre-spec interview — stress-tests a plan before /generate-tech-spec |
| | `/ubiquitous-language`                         | DDD glossary from conversation, cross-checked against platform vocabulary |
| | `/design-an-interface`                         | Parallel-stance interface design — 3 sub-agents, side-by-side comparison |
| | `/generate-api-contract`                       | Canonical API Contract (endpoints, payloads, errors, auth, versioning) — shared boundary, merged upstream of the tech spec |
| | `/generate-tech-spec`                          | Structured tech spec from product change + architecture docs + API Contract |
| | `/analyse-codebase`                            | Structured codebase analysis with gap/impact assessment |
| | `/generate-test-cases-from-prd`                | BDD test cases (Gherkin) from PRD acceptance criteria |
| | `/generate-test-scripts-playwright-from-prd`   | Playwright BDD test scripts for frontend projects — redirects to Karate skill if a backend project is detected |
| | `/setup-and-run-playwright-test-scripts`        | Set up the framework and run BDD test scripts in bdd/ automatically |
| | `/generate-test-scripts-bdd-karate-from-prd`   | Karate BDD test scripts for backend/API and mobile projects — redirects to Playwright skill if a frontend project is detected |
| | `/validate-spec`                               | Pre-implementation spec validation — resolve refs, check rules, verify DAG |
| **Build** | `/implement-feature-workflow`                  | Full feature: all chunks with worktree isolation, state, resume, batch mode |
| | `/implement-feature-chunk`                     | Single chunk from spec (TDD enforced) — used standalone or called by workflow |
| | `/generate-tdd-tests`                          | Tests-first per stack layer with correct mock boundaries |
| | `/analyse-test-failure`                        | Diagnose failures, fix, re-run — loop until green or escalate |
| | `/generate-mocks`                              | Mocks/fakes/stubs from dependency graph, contract-synced |
| | `/generate-exception-hierarchy`                | Scaffold sealed exception hierarchy + global handler (one-time) |
| | `/generate-db-migration`                       | Versioned DDL migration script (Spanner, PostgreSQL, MySQL, SQL Server) |
| | `/generate-entity-repository`                  | Scaffold entity + repository + DDL migration + tests |
| | `/generate-http-client`                        | Scaffold RestClient with Resilience4j + error mapper + tests |
| | `/generate-provider-integration`               | Scaffold adapter from SPI |
| | `/generate-status-mapping-config`              | Return-code mapping for new adapter |
| | `/generate-rest-endpoint`                      | Scaffold controller + DTOs + service + tests |
| | `/generate-scheduled-job`                      | ShedLock batch job with observability |
| | `/generate-test-suite`                         | Tests from spec's test strategy section |
| | `/generate-observability-bundle`               | Metrics, alerts, dashboard config |
| | `/generate-feature-flag-config`                | Feature flag for gradual rollout |
| | `/resolve-design-system`                       | Validate UI code against DS component catalog (mobile/web) |
| **Ship** | `/run-local-tests`                             | Run full test suite locally — gate before commit |
| | `/pre-pr-quality-check`                        | AI first-pass review on staged changes (author-side) |
| | `/compose-commits`                             | Split staged changes into atomic conventional commits |
| | `/prefill-mr`                                  | Auto-fill MR description from tech spec + staged changes |
| | `/code-review`                                 | AI-assisted MR review against rules, patterns, and spec (reviewer-side) |
| | `/adversarial-review`                          | Adversarial review challenging design decisions (works in any harness) |
| | `/sync-jira`                                   | Push tech spec tasks to Jira as epic + linked issues |
| | `/publish-confluence`                          | Publish tech spec and ADRs to Confluence |
| | `/deploy-staging`                              | Trigger Harness staging pipeline |
| **Discover** | `/discover-capabilities`                       | Scan a legacy platform to produce a capability catalog |
| | `/extract-code`                                | Extract frontend/backend code for a product capability |
| | `/reverse-engineer`                            | Reverse-engineer codebases into platform artifacts |
| | `/market-specific-reverse-engineer`            | Produce a per-market before-doc (AIPM-facing) for PM authoring of capability spec + journeys |
| | `/review-artifacts`                            | Apply PM/business review feedback to reverse-engineered artifacts |
| | `/re-conformance-check`                        | Validate any AIPM-eligible artifact against AIPM v3 CI rules (BLOCK/WARN/INFO) |
| | `/push-to-product-repos`                       | Split RE Phase 3 artifacts into platform + team product repos |
| | `/synthesise-legacy`                           | Consolidate migration assessments into legacy platform analysis |
| **Maintain** | `/architectural-drift-scan`                    | Proactive codebase integrity check + 7-dimension strategy review |
| | `/generate-adr`                                | Structured ADR from decision discussion |
| | `/generate-rfc`                                | Technical proposal (RFC) for cross-team decisions |
| | `/generate-incident-comms`                     | Incident notification and status update drafts |
| | `/generate-post-mortem`                        | Structured post-mortem with CLAUDE.md gap analysis |
| | `/generate-runbook`                            | Operational runbook for alerts and failure scenarios |
| | `/generate-load-test-report`                   | Structured load test report with Pass/Fail/Conditional verdict |
| | `/generate-service-maintenance`                | Planned maintenance announcement (Markdown + Slack) |
| | `/resolve-bot-threads`                         | Triage and resolve open bot MR review threads — fix, defer, or reply |

--