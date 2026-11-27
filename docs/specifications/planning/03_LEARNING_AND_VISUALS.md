# BuildTrail Learning Flow and Visual Teaching

## A lesson from start to finish

Use a consistent sequence: Understand, Build, Verify, Reflect. These are navigation sections within one lesson, not four disconnected pages that hide essential context. Provide a full-lesson reading mode too.

Understand: situation, purpose, explanation, worked example and optional simulation.

Build: exact task, guided exercise, files or functions involved, and code snippets with Copy controls.

Verify: acceptance cases, expected results, commands to run locally, and the completion checklist.

Reflect: explanation question, personal answer, notes, optional stretch task, and next lesson.

Reveal the existing hint only when requested. Do not invent full reference solutions or additional staged hints without separate content review. Keep all original teaching content accessible even when it does not map cleanly to a named section.

Example session: resume lesson 11; predict how many tokens remain; step through the token-bucket example; implement in the local editor; run terminal tests; record the result; answer why capacity and refill rate differ; explicitly mark the lesson complete.

Viewing or scrolling through a lesson never marks it complete. Test results entered by the learner are labelled self-reported. The app does not claim it executed or verified their Python.

## Visual explanations throughout the course

Visual teaching is a first-release requirement throughout the course, not confined to three playgrounds. Create a lesson-to-visual coverage map. Use diagrams where they explain a relationship or state change; simple lessons can use a state table rather than decorative animation.

Required examples: separate Alice/Bob allowances, a request passing through the limiter, aligned versus rolling time windows, tokens refilling and being spent, queued jobs waiting for service, several application workers sharing Redis, and failure-policy paths during an outage. Use the same StudyShelf story and visual vocabulary across lessons. Pair every diagram with a brief plain-language explanation and a text/table alternative.

The following three demos are the initial richer simulations. Additional diagrams do not need interactive controls unless those controls improve understanding.

## Three initial interactive demonstrations

1. Fixed window versus exact sliding log: replay five arrivals at 59.9 and five at 60; show the boundary, retained timestamps, decisions and counters. Fixed window admits ten, the sliding log five.
2. Token bucket: adjust capacity, refill rate and request cost; add a request; advance simulated time; display before/refill/after balances and retry advice. Include the lesson 11 and 12 traces as presets.
3. Concurrency race: step through two workers reading one remaining token, then compare with an atomic decision. Show the event order, not an animation that merely suggests correctness.

Each demo needs Step, Reset, and a readable event table. Optional playback honours reduced-motion preferences. Use simulated time rather than wall-clock animation as the source of truth. Controls must update the real model. Clearly label these as teaching demonstrations, not execution of the learner's code.

Test simulation outputs against the course examples. Avoid implying the single Redis simulation models failover or all production failure modes.

## Lesson presentation contract

Keep the original teaching sequence understandable even when sections are rearranged into the four study stages. The full-lesson view must use the same content model as the section view, so corrections do not leave two different versions of an explanation.

For every lesson, map: learning objective, prerequisites, explanation, worked example, implementation task, verification method, hint, reflection, stretch work and completion checklist. Missing optional fields should disappear cleanly. Missing required teaching material is an import/readiness issue rather than an invitation to fill the interface with generic text.

## Simulation contract

Represent a demonstration as a pure model plus a renderer. Each event produces a before-state, event, decision and after-state. Animation displays those records; it does not control algorithm timing. Reset restores both model and presentation state.

For the first demonstrations, test the boundary trace, fractional refill, invalid control values and deterministic worker interleavings. Show units next to controls. Explain when a change resets the current experiment rather than silently mixing parameters from two different runs.

## Visual coverage record

Create one row per lesson with visual type, teaching purpose, source example, mobile treatment and accessible alternative. A simple state table may be the right answer for a basic counter. Several related lessons can reuse a visual component with different curated traces. Do not manufacture thirty complex animations merely to satisfy coverage.

Reflections are learner explanations, not automatically scored answers. Keep the distinction between observing a demonstration and implementing the project visible.

