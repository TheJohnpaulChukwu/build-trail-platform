# BuildTrail Design and Mobile UX

## Reference observations and visual direction

Designed to Scale was inspected in light and dark themes, including the course navigation, lesson workspace, responsive navigation drawer, and rate limiting lesson. Observed characteristics include JetBrains Mono, warm surfaces, thin outlines, softly rounded cards, green active selections, pastel category accents, a persistent lesson tree, step controls, and explanatory side panels. Computed light-theme body colours were background `rgb(244,235,224)` and text `rgb(29,27,24)`; the observed main heading was 30px JetBrains Mono. These are reference observations, not a requirement to copy every dimension.

Proposed design:

- Light theme starts with warm ivory surfaces, near-black text, muted green selection, and restrained lavender, amber, and blue callouts.
- Dark theme uses warm charcoal, cream text, and subdued versions of the same accents.
- Self-host JetBrains Mono with its licence. Default reading text to at least 16px with generous line height; provide text-size controls. Offer an optional proportional reading font if long monospaced paragraphs feel tiring.
- Use soft outlines and small, consistent shadows. Keep decorative grids inside diagrams, where they serve the technical visual style.
- Do not introduce a marketing landing page, giant hero section, stock illustrations, or decorative dashboard metrics.
- Render clear focus states and adequate contrast in both themes. Never make colour the sole indicator of completion or rejection.

## The main study workspace

At wide desktop sizes use three regions:

1. Left: the selected course's milestones, expandable lesson lists, completion indicators, and course progress. The rate limiter has five milestones; other courses may differ.
2. Centre: the selected lesson, current study section, examples, code blocks, exercises, and relevant diagrams.
3. Right: a collapsible study panel with checklist, personal notes, and a place to record a blocker or explanation.

Global navigation contains Courses and My Learning, search, theme and account controls. Within a selected course, contextual navigation contains Learn, Playground and Reference. On mobile, use the course drawer and a compact context selector instead of crowding both navigation layers into the header. Include a clear Continue studying action that returns to the last lesson and section. Keep the default landing experience close to the work rather than making the user pass through a dashboard every time.

At medium widths collapse the right panel into a drawer. At narrow widths use a course-navigation drawer and a single reading column. Provide a focus mode that hides both side panels. Code and wide tables may scroll inside their own containers; the whole page should not overflow horizontally.

The responsive cutoffs should follow actual content fit, with starting targets around 1200px for all three columns and 900px for the navigation drawer. Verify on the user's actual desktop window as well as narrower sizes.

## Mobile study experience

Design the phone experience deliberately rather than shrinking the desktop workspace. The phone is a complete companion for reading, visual experiments, reflections, notes and progress; full project coding remains in the learner's editor and terminal.

- Use one primary reading column, with a compact header identifying the current course and lesson.
- Provide a labelled navigator for Understand, Build, Verify and Reflect. Gestures may supplement visible controls but must not be the only way to navigate.
- Preserve the section, reading position and unsaved text when opening drawers or changing orientation. Across devices, resume at a stable section or content anchor rather than a pixel offset.
- Keep Previous/Next actions reachable and respect device safe areas. They must not obscure text, focused inputs or the on-screen keyboard. While editing notes, prioritise the editor and save status.
- Present course navigation and notes as separate accessible drawers or sheets with clear close controls, correct focus handling and minimal nested scrolling.
- Use a product target of at least 44 by 44 CSS pixels for primary touch targets, with adequate spacing. Never require hover for hints or essential explanations.
- Keep default body text at least 16px, permit text scaling and avoid long lines. Do not shrink text to force a desktop diagram onto a phone.
- Reflow diagrams vertically or into readable steps. Retain a text/event-table alternative and offer an expanded view for dense diagrams.
- Give code blocks a labelled Copy control and optional soft wrapping while preserving indentation. Keep unavoidable horizontal scrolling inside code or table containers. The page itself must not overflow horizontally.
- Offer command copying, starter downloads and a saved next-action note for later desktop coding. Do not imply the app executes Python on the phone or automatically opens a desktop editor.
- Make sign-in, search, exports, account controls and saving feedback usable by touch. Owner uploads also need a functional narrow layout, although long-form course authoring is expected to be easier on desktop.

## Study experience quality standards

Every screen should answer: where am I, what should I do next, and is my work saved?

Keep a clear primary action for the current task. Use consistent typography, spacing, colours, callouts and component behaviour across courses. Retain full-lesson reading and focus mode so learners can compare explanations with acceptance criteria without repeatedly switching views.

Connect each concept to a concrete problem, example, state change and coding task. Put diagrams next to the explanation they support. Reveal hints progressively without hiding essential prerequisites. Animate to explain causality or sequence, with pause, reset and reduced-motion alternatives.

Returning learners should reach their last lesson with one Continue action. Search results open the relevant section. Navigation retains notes and checklist state. Save failures preserve the draft and offer retry. Avoid streak pressure, confetti, fake grading, unnecessary popups and decorative metrics in the first release.

Design loading, empty, error, offline, expired-session and conflicting-edit states alongside success screens. Session expiry must not discard a reflection. Clearly distinguish an unsaved local draft from cloud-saved work during connectivity loss; full offline synchronisation remains deferred.

Keep the study interface lightweight: lazy-load richer simulations, reserve layout space to avoid disruptive jumps, load fonts efficiently and bundle necessary assets. Check perceived responsiveness on a throttled connection and representative phone; record the environment with performance measurements.

## Design deliverables before broad implementation

Create a small design token set covering surface layers, text emphasis, semantic colours, spacing, type scale, radii, borders, shadows and focus rings. Both themes use the same semantic tokens. Show real course text in the visual slice; placeholder paragraphs cannot validate reading comfort.

Define reusable components for course navigation, section navigation, code blocks, instructional callouts, hints, checklists, save status, note editors, empty states and error recovery. A component's disabled, loading and error states belong to the same design specification as its default appearance.

Desktop layout sketch:

```text
Global navigation and course context
Course tree | Lesson and explanation | Notes and checklist
            | Relevant visual        |
            | Current task           |
            | Previous / Next        |
```

Phone layout sketch:

```text
Menu / Course / Account
Lesson title and section selector
Explanation and visual
Task / example / verification
Notes and checklist entry
Previous / Next
```

The sketch describes hierarchy, not fixed pixel heights. Long content must expand naturally.

## Visual review evidence

Capture the actual rendered lesson 1, token-bucket lesson 11 and advanced lesson 22 in both themes. Include a phone screen with the note editor open and one showing a long code block. Record any untested real-device keyboard behaviour. Correct cramped text, ambiguous selected states and unexplained controls before propagating the layout to all lessons.

