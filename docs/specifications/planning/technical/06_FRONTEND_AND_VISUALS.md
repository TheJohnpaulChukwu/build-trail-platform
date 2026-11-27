# 06 — Frontend, mobile and visual engineering

## Routes and loading

Routes: `/courses`, `/courses/:courseSlug`, `/courses/:courseSlug/lessons/:lessonSlug`, `/courses/:courseSlug/reference/:referenceSlug`, `/courses/:courseSlug/playground`, `/my-learning`, `/settings`, `/auth/callback`, `/owner/courses`, `/owner/courses/:courseId/versions/:versionId`. Route parameters resolve to stable IDs before data access. Section selection uses a stable anchor; owner preview version is explicit and marked Draft.

React Router owns navigation, route errors and loading boundaries. TanStack Query owns fetched data; router loaders call shared query functions rather than maintain a second cache. Read keys include course/version and private keys additionally include user/environment. Owner preview keys are distinct. One provider owns current pinned course version; components cannot independently re-read the active pointer and mix snapshots.

Provide meaningful loading, empty, not-found, withdrawn-course, auth-error, unavailable-network and failed-save states. Error boundaries offer retry without clearing drafts. On navigating to a lesson, focus its heading for keyboard/screen-reader users without interrupting an editor's save. Preserve scroll locally; cross-device resume uses stable sections, not pixels.

## Component contracts

| Component | Main responsibility | Required states |
| --- | --- | --- |
| `StudyShell` | Responsive regions, context and focus mode | Guest/member, narrow/wide, drawer open |
| `CourseNavigator` | Data-driven milestones and lesson status | Expanded, active, incomplete/completed, archived link |
| `LessonReader` | One ordered model for full/stage views | Long code/table, image error, missing optional section |
| `CodeBlock` | Escaped code, copy, wrap and labelled language | Copy success/failure, long line, keyboard scroll |
| `HintDisclosure` | Accessible progressive disclosure | Closed/open, keyboard focus |
| `StudyPanel` | Notes, reflection and checklist | Loading, dirty, saving, saved, failed, conflict |
| `SaveIndicator` | Truthful persistence status | Local draft vs acknowledged cloud save |
| `ConflictResolver` | Keep server, retain local, manual merged text | Both copies readable, explicit final save |
| `CourseSearch` | Version-pinned content search | Keyboard selection, no results, loading/error |
| `DemoFrame` | Model controls, visual and event table | Step/reset, invalid input, reduced motion |

No component receives a service-role client. Persistence goes through hooks/use cases, not raw database calls scattered through JSX. Native form elements are preferred; use Radix where focus trapping and menu/dialog behavior warrant it. Accessible primitives do not remove the need for keyboard tests.

## Tokens and responsive behavior

Use semantic tokens: surface/page/panel, text/primary/muted, border, accent, success, warning, danger, focus. Define the same token names in light/dark themes. Spacing scale starts at 4/8/12/16/24/32/48px; body text at least 16px, 1.6 line-height and roughly 65–75 characters maximum reading width. Keep these adjustable after actual visual review. Self-host font files and licence; offer a proportional reading option if the monospaced text is tiring.

Start three columns around 1200px, collapse notes to drawer below that, course tree to drawer below 900px. Validate actual fit at 320/390/768/1024/1440px. Primary touch targets are at least 44px. Use safe-area padding and dynamic viewport behavior; avoid fixed footers over inputs. At most one modal drawer at a time. Restoring focus to its trigger and closing on Escape are required. On-screen keyboard testing needs a real device or an explicitly recorded gap.

WCAG 2.2 AA is the accessibility target: semantic headings, labels, focus visibility/order, appropriate contrast, 200% text zoom and reflow. Never encode admission/rejection with color alone. Animation must have a motion-reduced equivalent. Test actual colors and rendered controls rather than declaring compliance from token names.

## Teaching model contract

A simulation is `state + event → {nextState, decision, explanation}` with an explicit simulated clock. The renderer consumes that record; animation does not decide arithmetic. Parameter changes reset the trace with a visible explanation. Units belong on every control. All three demos have Step, Reset and a text event table.

- Fixed/sliding: capacity 5, window 60 seconds, five arrivals at 59.9 followed by five at 60. Fixed admits ten; exact sliding log admits five. Define expiration at `timestamp <= now - window` and test equality.
- Token bucket: refill `min(capacity, previousTokens + elapsed * rate)`, then charge cost if available. Validate capacity/rate/cost and monotonic event times. Reject costs above capacity with an explicit impossible-under-current-config explanation. Test fractional refill with documented numerical tolerance.
- Concurrency: model reads and writes as explicit events for two workers. Show double admission from stale reads versus one atomic admission. Label it a limited teaching model, not a simulation of Redis failover.

Create a visual coverage manifest for all 30 lessons with purpose, source example, renderer ID, mobile treatment and text alternative. A clear state table can satisfy a lesson; do not add gratuitous animation. Trusted SVG diagrams are React components. Uploaded SVG/HTML is not accepted.

## Search and performance

Derive per-section plain text from the accepted AST, including code text. Fetch a bounded course-version index on first search, build it in a Web Worker and return top 20 matches with escaped excerpts and stable section IDs. Start with simple token matching/scoring; no external search service. Index maximum 2 MiB serialized, paginated downloads if necessary; publication rejects an oversized index with an actionable limit rather than shipping a mobile freeze. Catalogue search matches published titles/summaries only.

Lazy-load demos, owner screens and syntax language modules. Do not include all lesson bodies or all diagrams in initial JavaScript. Reserve image dimensions and font fallbacks to reduce layout jumps. Memoize only when measurements justify it. Performance targets are in [architecture](02_ARCHITECTURE.md); record device/network and cold/warm cache conditions.

The first visual evidence must use lessons 1 and 11, plus lesson 22 as a stress case, in both themes. Include long code, note editing, failed saving and mobile drawer states. Placeholder content cannot validate reading quality.

Reference: [react-markdown security and architecture](https://github.com/remarkjs/react-markdown), [Radix Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction). The BuildTrail rendering restrictions remain mandatory even if a renderer can support more features.
