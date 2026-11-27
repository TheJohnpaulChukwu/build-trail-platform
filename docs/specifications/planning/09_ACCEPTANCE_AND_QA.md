# BuildTrail Acceptance Tests and Quality Review

## Validation and definition of done

- All 30 lessons and all supporting reference material are accessible with no duplicated lesson bodies or missing teaching sections; public-edition adaptations have an explicit source mapping.
- A fresh learner with no owner filesystem access can download the starter, follow setup and complete the first milestone using only public course resources.
- Both Google and GitHub sign-in work; login cancellation, callback failure and expired sessions have recoverable paths.
- Stable checklist IDs, course updates, archived notes and completion denominators follow the stated contracts.
- Publishing during a reading session cannot mix versions. Failed uploads and failed publication preserve the current course.
- The second internal sample course can be uploaded and previewed without source-code changes.
- Account deletion, invalid/conflicting imports, owner bootstrap and storage restoration have been exercised in staging.
- Search locates text from early and late lessons and navigates to the correct place.
- Notes, checklist values, completion and resume position survive reload, sign-out and login on a different device.
- Account A cannot read, create, modify or delete account B's records through direct API requests; anonymous visitors cannot access private study data.
- Two courses with identical lesson slugs have separate progress. Renaming a course does not reset progress.
- Concurrent note edits are detected and recoverable rather than silently overwritten.
- Non-owners cannot upload or publish content. Draft courses and their private assets are inaccessible to anonymous visitors. Invalid uploads do not replace a published course.
- Export/import round-trips preserve data; malformed imports leave existing data intact; storage errors are visible.
- Reading a lesson does not claim verified test completion. Later lessons do not show fake grading results.
- Demonstrations produce the documented decisions, including exact boundary and fractional-refill cases.
- Browser Back/Forward, direct lesson links and reloads work.
- Keyboard navigation, focus management, readable contrast, reduced motion, code overflow and narrow layouts are checked in both themes.
- Verify representative widths of 320, 390, 768, 1024 and 1440 CSS pixels, including phone portrait and landscape. No page-level horizontal overflow, clipped primary controls or illegible diagram labels are acceptable.
- Test a mobile journey: discover a course, sign in, read a lesson, inspect a diagram, reveal a hint, copy code, write a reflection, navigate away, return and resume on desktop with saved state intact.
- Check text zoom, touch interactions, keyboard focus, drawer focus return and on-screen-keyboard behaviour. Simulated viewports alone do not prove real mobile keyboard behaviour; check a real device when available or report that verification gap.
- Stress-test mobile with lesson 22, long code lines, long reflections, expanded course navigation and an interrupted save during navigation; do not validate only short introductory content.
- Controls must have working actions, readable labels and appropriate feedback. Session expiry and save failure must preserve drafts.
- Review both the initial visual slice and final app for typography, purposeful diagrams, spacing, readable themes and clear next actions. Resolve usability defects even when functional tests pass.
- The production build succeeds; preview and production deep links work; production authentication redirects and cross-device saves are verified.
- No application files replace the course source and no learner code is executed by the app. Production secrets are not exposed in the client bundle or logs.

Use unit tests for model arithmetic, content transformation and storage migrations; integration tests for content and backup contracts; and browser tests for the main study journey. Inspect screenshots of actual desktop and narrow layouts. A green build alone does not demonstrate usable typography or layout.

## Required evidence categories

| Area | Required evidence |
| --- | --- |
| Content | Import report, link audit and public first-milestone walkthrough |
| Visual quality | Actual desktop/phone captures with real course content in both themes |
| Learning visuals | Deterministic model tests and readable mobile/text alternatives |
| Accounts | Google and GitHub sign-in flows on deployed staging |
| Privacy | Direct API/database/Storage deny tests between two users and anonymous access |
| Saved work | Reload, second-device resume, conflicting saves and expired-session recovery |
| Publication | Malformed bundle, interrupted operation, concurrent publish and rollback checks |
| Recovery | Personal export/import and a separate database-plus-assets staging restoration |
| Release | Clean build, deep links, production smoke checks and recorded limitations |

Record outcomes rather than merely listing intended tests. Failed checks remain visible until fixed or explicitly described as unresolved. Do not infer mobile keyboard behaviour from screenshots alone.

## Defect triage

Block public launch for broken setup, inaccessible required lessons, private-data exposure, lost notes, incorrect core demo arithmetic, failed sign-in, corrupt publication or missing required downloads.

Treat layout defects that obscure tasks, controls or code as functional learning defects. Small cosmetic inconsistencies can be recorded separately, but the user explicitly prioritises UI/UX: do not dismiss widespread cramped typography or inconsistent interactions as optional polish.

Re-run the affected acceptance journey after a fix. Broadly repeating every check is useful only when changes affect shared infrastructure or leave a material unresolved concern.

