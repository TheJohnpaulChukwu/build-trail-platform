# BuildTrail Build Sequence and Handoff

## Implementation sequence and agent ownership

Phase 1: inspect sources, audit public course readiness, create the portable public course adaptation and independent starter, then define manifests, version contracts, schema, ownership policies and import validation. Preserve the original files. This phase must prove a new learner can start without files from the owner’s computer.

Phase 2: build a working visual slice using lesson 1 and lesson 11, plus a content stress check of lesson 22, with both themes and phone, tablet and desktop layouts. Demonstrate reading, hints, diagrams, notes and resume in the browser. Fix usability issues before expanding components. This is a design-quality checkpoint, not merely a screenshot of the shell.

Phase 3: import all lessons and reference material; implement the catalogue, course switching, search, navigation, code rendering and downloads. Prove content completeness.

Phase 4: add Google and GitHub sign-in, account settings, private database-backed progress, notes, checklists, resume, exports and recovery states. Test account isolation and conflicting edits from two sessions.

Phase 5: add diagrams throughout the course and the three tested interactive demonstrations; complete owner upload, validation, draft preview and publishing.

Phase 6: complete a fresh-learner walkthrough, exercise restore procedures in staging, run integrated checks, inspect the real UI, configure production services and deploy to Vercel. Verify production login, saving and cross-device resume; deliver the URL and maintenance instructions.

Codex may delegate after the interfaces are established. Use bounded file ownership: one agent owns content import and validation; one owns simulations and their tests; one owns storage and backup tests. The lead owns the app shell, visual system, integration, browser checks and user updates. Do not have several agents rewrite the same global styles or application shell. Start integration early rather than collecting unrelated prototypes at the end.

## Communication and deliverables

During implementation give brief chat updates at meaningful milestones and at least about once a minute during sustained work. Explain what is complete, what was learned, what is being checked next, and any blocker. Maintain `/home/jchukwu/Documents/code/build-trail-platform/BUILD_LOG.md` with completed work and validation, but do not substitute the file for chat updates.

Deliver application source, the deployed app URL, local development instructions, owner course-upload instructions, database migrations and access policies, backup/export guidance, tests and actual results, known limitations and a short feature summary. Do not report unimplemented controls as finished.

Deferred features: browser Python execution, automatic grading, hosted code runners, AI tutoring, spaced repetition, full quiz authoring, payments, social features and public instructor publishing. Multi-course support and owner uploads are included; writing additional courses is separate content work. A visual course editor, executable plugins, multiple owner roles, notifications and real-time collaborative editing are also deferred. Add them only after a separate request. Basic lesson reflections and review flags are included already.

## Handoff instruction

Implement this online multi-course platform in the new `/home/jchukwu/Documents/code/build-trail-platform/` folder, launching with the existing rate limiter course. Use Vercel hosting and Supabase accounts and private progress. Keep Python coding in each learner's editor and terminal. Begin with content validation and a two-lesson visual slice, then complete all release phases including owner uploads and deployment. Keep the user updated in chat and verify the finished study journey with two accounts. Treat public-edition readiness, stable version/data contracts and the mobile stress check as required work, not optional follow-ups. This document is the revised build handoff; the planning session itself does not create services, purchase plans or deploy an app.

## Work packages and completion evidence

| Package | Evidence before moving on |
| --- | --- |
| Public content readiness | Portable starter, adaptation report and resolved link map |
| Architecture contracts | Manifest/schema definitions, ownership model and stable IDs |
| Visual slice | Real lessons demonstrated on desktop and phone, with notes and diagrams |
| Full reading experience | Thirty lessons, references, search and downloads verified |
| Accounts and saved work | Both providers, two-account isolation and conflict/recovery tests |
| Owner publication | Sample upload, errors, preview, publish, rollback and second course |
| Release preparation | Staging restore, pilot findings, production setup and smoke checks |

These packages express dependencies; independent work can proceed in parallel once shared interfaces are stable. The lead agent integrates continuously and keeps one coherent app rather than assembling disconnected demos at the end.

## Working with the user

Post short progress updates in chat describing the concrete result, relevant finding and next check. Ask for missing service credentials or owner decisions only when needed. Continue independent implementation while waiting where possible.

The visual checkpoint should produce a reviewable working screen, not a question asking the user to imagine a design. If user feedback changes the layout, apply it before repeating that pattern across the platform. Do not impose additional approval gates absent a real need.

Report exactly what works, what was tested and what remains blocked. Seeded content, mock sign-in and mocked saves must be labelled during development and replaced before claiming the release complete.

