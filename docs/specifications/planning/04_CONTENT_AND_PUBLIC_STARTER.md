# BuildTrail Content Import and Public Course Readiness

## Content import and preservation

Use individual lesson Markdown files as the canonical source for lesson bodies. Use COURSE.md for preparation and reference material. Do not import both copies of every lesson.

Create an explicit course manifest: stable course ID, title, summary, language, prerequisites, version, milestone IDs, lesson IDs, ordering, source paths, section mapping and attached demo IDs. Milestone and lesson counts are data, not platform constants. Persist progress by stable IDs rather than headings or array positions. A title change must not lose progress.

Use a Markdown AST parser rather than splitting with regular expressions. The master contains code comments beginning with `#`; those are not document headings. Some lesson labels are bold inline labels, not Markdown headings. Preserve code fences, lists, tables, link destinations, and checkbox text during transformation.

For the rate limiter course validate exactly 30 unique lessons and milestone sizes 7, 7, 6, 5, 5. Validate other courses against their own manifests rather than these fixed counts. Every teaching content block must either render in a study section or remain in the full-lesson view. Personal filesystem paths and legacy-only setup steps require the explicit public-edition adaptation described below; keep that mapping auditable rather than silently copying unusable instructions. Preserve source content hashes and record import results so missing content is detected rather than silently dropped.

Provide an initial seed/import command for the local course and an owner-only course upload workflow for future courses. Imported published content is read-only to learners; notes live separately. The hosted app never reads the owner's Documents folder directly. Publishing creates a versioned content snapshot.

When imported course content changes, preserve progress and notes; optionally show a content-updated notice for affected completed lessons. Do not automatically erase completion or mark new material mastered.

## Public course readiness and first use

The current Markdown course was written for the owner's computer. Preparation references `/home/jchukwu/Downloads/shipthatcode-build-rate-limiter-python`, and lesson 7 requires its HTTP adapter, shell runner and fixtures. The existing `starter/` contains only the core limiter scaffold and eleven tests. This is a public-release blocker until the required exercises are self-contained.

Create a separate public-edition content directory in the application repository. Preserve the original course. Maintain a source-to-public mapping describing each adaptation: replace personal paths with portable working-directory instructions, present the three-hour study schedule as an optional example, link every required download, and provide BuildTrail-owned HTTP harness code and independently authored fixtures for the main lesson 7 path. Keep the legacy ShipThatCode exercise as an optional compatibility note, never a prerequisite for an account holder. Do not automatically redistribute third-party starter assets without establishing that they may be included.

Create a source-path-to-route mapping for lessons, preparation, reference sections and downloadable assets. Resolve relative Markdown links against their actual source files before rewriting them to app routes. Deduplicate presentation-only Previous/Next links already supplied by the app shell. Record these transformations while preserving teaching content. Validate every internal destination and reject required links outside the permitted bundle. Public links must not depend on the owner's absolute filesystem path or unavailable raw Markdown pages.

Each public lesson manifest identifies prerequisite knowledge, new tools, verification method and whether tests are supplied or learner-authored. Add concise just-in-time explanations where unfamiliar syntax is essential; lesson 22, for example, needs enough Lua and Redis script-invocation guidance to begin. Record these public-edition additions without providing complete solutions. Verify usability for a learner with the stated prerequisites rather than assuming the private conversation supplied their background.

Provide one versioned starter download, its file list, setup README and supported platform instructions. Start with Linux, macOS and Windows through WSL; explicitly state that native Windows shell commands are not verified unless tested. A fresh learner should need only the documented tools and supplied downloads. Preserve unfinished implementation tasks. Explain the initial expected test failures. Later lessons must clearly distinguish supplied tests from tests the learner is expected to write; do not imply all 30 lessons have a downloadable grader.

The course detail page states what will be built, prerequisites, language, tools, expected outcomes, milestone structure, and that coding happens locally. Keep time estimates labelled estimates. Provide a short setup checklist before lesson 1 and optional warmups for missing prerequisites. A learner can inspect content as a guest, but changing a cloud checklist or writing notes requires sign-in; the login prompt preserves the intended lesson and section.

Add a lightweight Report a lesson issue link that prepares the course/version/lesson context for a documented owner contact route. Do not build a discussion forum or expose private notes in reports. Keep the contact route a deployment configuration requiring a real owner-provided address or issue destination.

## Public-edition adaptation report

For every adapted source location record the original source path and heading, adaptation reason, new public location and verification performed. Classify changes as path portability, navigation conversion, original prerequisite replacement, optional legacy material or new prerequisite explanation.

Keep this report developer-facing. Learners should receive direct usable instructions rather than an account of internal migration work.

## Fresh-learner test procedure

1. Use a clean working directory with no reference to the owner's downloaded repository.
2. Follow the public overview and setup instructions using only advertised downloads.
3. Confirm the starter file list and documented initial test failures.
4. Follow lessons 1–7 and identify where code must be written versus supplied.
5. Run both the core and original BuildTrail integration checks required for the first milestone.
6. Record platform, Python version, commands, outcomes and corrections.

The test validates the course path; it does not require publishing a full solution. Temporary reviewer solutions and credentials must not leak into the learner starter.

## Content validation report

Output lesson counts and ordering, unresolved links, missing assets, duplicate stable IDs, unsupported Markdown constructs, source hashes and public-adaptation coverage. A failed required-content check prevents publishing. Original instructions to copy machine-specific files must never survive as mandatory public setup.

Separate seed content from user records. Re-running a seed command updates or stages the intended course version; it must not reset learners' notes or progress.

