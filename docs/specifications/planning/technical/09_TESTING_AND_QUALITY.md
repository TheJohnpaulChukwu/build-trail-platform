# 09 — Testing strategy and quality gates

## Test layers

| Layer | Tool | What it proves |
| --- | --- | --- |
| Domain | Vitest | Simulation arithmetic, progress, ID mapping, limits, save-state transitions |
| Components | Testing Library + Vitest | User-visible states, keyboard labels, conflict handling and navigation behavior |
| Database | Local Supabase + pgTAP and real Data API clients | Constraints, grants, RLS, RPC ownership and transaction behavior |
| Server integration | Vitest with local services | Auth guards, operation state, upload validation and deletion retries |
| Browser | Playwright Chromium/Firefox/WebKit | Complete study journeys, deep links, saving and responsive interactions |
| Accessibility | axe-core plus manual keyboard/zoom/screen-reader checks | Automated defects plus behavior automation cannot establish |
| Course | Python standard-library tests and clean-room walkthrough | Supplied starter contract and usable public instructions |
| Load | Small reproducible concurrent-client test | Initial 20-session workload and largest bounded imports/uploads |

Mocks are suitable for network failures and component variants. They do not prove RLS, OAuth providers, database locking or Storage policies. Use real local services for those boundaries and deployed staging for actual provider callbacks.

## Required high-value cases

### Notes and private records

- Two simultaneous inserts for an absent note: one wins, the other receives a conflict; no silent overwrite.
- Edit A is in flight, edit B is typed, response A arrives: UI remains dirty until B is acknowledged.
- Server commits but response disappears: retrying the same mutation returns the original result, increments revision once.
- Two devices with the same base revision: conflict preserves both texts and manual merge saves against current revision.
- Session expires, reload occurs, same user signs in: local draft recovers. Different user cannot see it.
- Explicit sign-out honors save/download/discard and clears private caches. Pending requests cannot populate the next user's UI.
- IndexedDB unavailable/full: unsaved status remains accurate and download fallback works.
- Completion reversal, needs-review changes and separate checklist items do not overwrite unrelated fields.

### Authorization matrix

Run select/insert/update/delete and RPC calls as anonymous, A, B, owner and deleting user. Try forged course/lesson relationships, owner metadata, revision fields, direct table mutations, draft object paths and imports containing user IDs. Verify not only HTTP responses but unchanged database rows. Service-role clients are setup tools only; never use them as the principal in a learner isolation test.

Test functions with PUBLIC grants, definer search paths, views, private schema exposure and Storage permissions. A separate policy linter should fail on exposed tables without RLS or unintended broad grants. Test stale token after deletion before JWT expiration.

### Content and publication

Malicious ZIP paths, actual decompression bomb, forged size/type, duplicate entries, malicious Markdown links, raw HTML, malformed JSON, missing asset, invalid stable ID, mixed course IDs, oversized search index and unsupported demo ID. Every failure preserves active content.

Publish A/B concurrently with the same expected active version. Interrupt before/after Storage stage and before/after pointer commit. Expire a worker lease and ensure a late old worker cannot finalize. Retry committed publication; result is stable. Roll back while a learner keeps an older version open. Public text, search and downloads must stay version-consistent. Publish the second sample course without editing platform code.

### Import, deletion and recovery

Round-trip exported Unicode text, archived records, false checklist values and empty notes. Reject malformed, oversized, unknown-identity or cross-user payloads without changes. Save after preview, then apply: stale import fails. Replace is scoped to selected courses. Retry apply after lost response; no duplicate writes.

Delete an ordinary account, reject sole-owner deletion, simulate cleanup failure and resume job. Restore a backup in staging, including assets and deletion ledger; demonstrate that deleted accounts remain deleted. A list of intended steps is not evidence of recovery.

## Visual acceptance

Use real lessons 1, 11 and 22 in both themes, widths 320/390/768/1024/1440, portrait/landscape, 200% text zoom and reduced motion. Capture normal study, drawer navigation, long code, expanded hint, active note editor and failed/conflicting save. Test tab order, Escape, focus restoration, contrast and screen-reader labels.

A real phone must verify keyboard behavior and touch comfort where available. Otherwise explicitly record the remaining gap and resolve before claiming full mobile verification. Automated screenshots and axe results do not establish complete accessibility conformance. Shared visual baselines are reviewed intentionally, never mass-updated just to make CI green.

## Performance and reliability checks

Measure cold and warm navigation, note p50/p95 latency, initial bundle transfer and largest upload memory/duration. Use the declared test machine, region and network profile. Run a bounded 15-minute test with 20 sessions and five active note writers against local/staging synthetic data, not production. Check throttling/backoff and database query plans for expensive policy queries. A passing small test is not a guarantee of arbitrary scale.

## CI checks and evidence

On each change: frozen install, formatting/lint, typecheck, domain/component tests, content validation, migration reset and database policy tests, production build and secret scan. Relevant integration/E2E tests run with synthetic local services. Before release run the complete study journey and supported browser matrix, deployed Google/GitHub tests, accessibility/visual review, backup restoration and largest-input checks.

Use targeted coverage reports for critical decision branches: CAS, deletion, import, publish, policy denial and simulation arithmetic. The applicable engineering rules require at least 80% instruction/statement-equivalent coverage and 60% branch coverage for new application modules; document the chosen reporter mapping. SQL authorization requires explicit role/operation coverage rather than a misleading TypeScript percentage. Missing critical scenarios block release even with high numeric coverage. Use tests-first implementation and real owned components for integration tests.

Write evidence to `docs/verification/<release>/` inside the platform repository: commit, toolchain, environment, fixture versions, commands, outcomes, screenshots and known gaps. Artifacts must not contain real notes, tokens or personal exports. CI traces use synthetic accounts and expire after seven days. Production smoke test creates only disposable owner-approved test records and removes them.

Launch blockers: private-data exposure, lost text, broken first-milestone setup, inaccessible required lessons, failed OAuth, false grading claims, corrupt publication, missing downloads, unreadable mobile tasks or untested restore procedure. Minor isolated cosmetics can be tracked, but broad UI/UX defects are not optional polish.

References: [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/docs/intro). Test selection and release gates above are BuildTrail requirements.
