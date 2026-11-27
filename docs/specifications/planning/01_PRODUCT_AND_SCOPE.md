# BuildTrail Product and Scope

## Purpose and confirmed decisions

Build an online learning platform for multiple build-by-doing software projects, launching with the existing 30-lesson Python rate limiter course. The user wants the visual character of Designed to Scale and the lesson/task progression of CodeCrafters. This document is a handoff specification; no application has been built as part of planning.

Confirmed on 2026 November 26:

- Hosted online on Vercel, with Supabase authentication and database-backed progress that follows each learner across devices.
- Supports multiple courses with independent milestones, lessons and per-user progress. The rate limiter is the first published course, not the platform identity.
- Visitors can browse published courses; an account is required to save personal progress and notes.
- Python exercises are written and executed in the user's editor and terminal.
- First release includes all 30 lessons, progress, notes, search, and a few interactive algorithm demonstrations.
- Report meaningful progress in chat during development. A file log supplements those updates rather than replacing them.

The confirmed platform name is **BuildTrail**. Proposed tagline: **Understand software by building it.** The tagline remains editable. Use central branding configuration; names must not determine stable course IDs or stored progress. Domain availability has not been established.

UI/UX is a defining product requirement. BuildTrail must make it easy to study, understand, practise and return to a project. Mobile usability and visual teaching are first-release requirements, not a later polish phase. Feature completeness alone is insufficient for delivery.

## Inputs and boundaries

Course directory: `/home/jchukwu/Documents/code/BuildTrail/courses/rate-limiter-python`.

Read `COURSE.md`, `README.md`, all 30 files in `lessons/`, and `starter/`. Preserve the original files. Put application source in `/home/jchukwu/Documents/code/build-trail-platform/`. Do not modify the downloaded ShipThatCode repository or synced project sources.

Visual reference: https://designed-to-scale.vercel.app/#/

Learning structure reference: https://app.codecrafters.io/courses/redis/introduction

Use references as design inspiration. Create original UI components and diagrams; do not depend on their servers, account state, source code, or private lesson content. The first course uses the user's local teaching content. Future courses are owner-published content bundles; learners cannot publish courses in the first release.

## First release features

The first course must expose all five milestones and 30 lessons, preparation, shared rules, reference tables, debugging guide, original-fixture mapping, source references and starter files. The public course catalogue shows only published courses; My Learning shows each signed-in learner's started courses and individual progress.

Course search should cover lesson titles, teaching text, code text, and reference material, with short result excerpts and links to the relevant section. Use a course-scoped index for the first release and catalogue search across published course titles and summaries. Never include private learner notes in public search indexes. Support Ctrl/Cmd+K, Escape to close, and keyboard selection.

Per lesson store: not started/in progress/completed, checklist values, notes, reflection, optional self-reported test evidence, and a separate needs-review flag. Opening a lesson can make it in progress; completing it requires an explicit action. Let the user reverse completion. Keep navigation open rather than locking advanced lessons.

Remember the current lesson and section, expanded milestone groups, theme, reading size, and focus-mode preference. Autosave notes with a visible saving/saved/error state. Preserve pending note writes across internal navigation and confirm Saved only after the database acknowledges them. Show retryable failures. Scope every cache by user ID and clear private in-memory state on sign-out. Do not promise full offline synchronisation in this release.

Provide export and import of a versioned JSON backup containing progress, notes, reflections, and preferences. Validate imports before changing existing data, show what will change, and offer merge or replace. A malformed import must not erase existing work. Use a deliberate confirmation for reset actions.

Offer starter-file downloads and copyable terminal commands. A browser cannot silently open arbitrary local editor files or run terminal commands; present these as user actions, not fake Open/Run buttons.

## Product boundaries and user roles

| Role | Can do | Cannot do |
| --- | --- | --- |
| Visitor | Browse published courses, read lessons and use public demonstrations | Save cloud notes, access drafts or another learner's records |
| Learner | Start courses, save personal work, export/import their records, delete their account | Publish content or inspect other users' records |
| Owner | Use learner features and manage course drafts, validation and publication | Bypass privacy rules through ordinary learner screens |

Ownership is an operational role, not a paid account tier. The owner's role is assigned through trusted setup. Public learner registration never changes that role.

## Information architecture

Public entry is the course catalogue. Each course has a detail/setup view and a lesson workspace. My Learning lists started courses and Resume actions. Account settings hold preferences, export/import and deletion. Owner tools have a separate entry visible only to the owner, with server-side authorization on every action.

Example route shapes are /courses, /courses/:courseSlug, /courses/:courseSlug/lessons/:lessonSlug, /my-learning, /settings and /owner/courses. These are navigation names; stable database IDs remain independent of slugs. Preserve old links when a slug changes using a deliberate redirect mapping.

Do not create unsupported catalogue entries to make the platform appear populated. Launch with the genuine rate limiter course; the second validation course stays internal.

