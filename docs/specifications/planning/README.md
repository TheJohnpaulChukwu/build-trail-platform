# BuildTrail Implementation Handoff

Start here. This folder is the detailed specification for building BuildTrail, an online platform for learning software engineering by building projects. The first published course is the existing 30-lesson rate limiter course.

**This is planning material. No application has been built.**

See the [root implementation specifications](../IMPLEMENTATION_SPECIFICATIONS.md) for concrete contracts, work packages and the review-gap resolutions that refine this baseline.

## Reading order

1. Read [CODEX_HANDOFF.md](CODEX_HANDOFF.md) for the task and operating boundaries.
2. Read [01 Product and Scope](01_PRODUCT_AND_SCOPE.md) and [02 Design and Mobile UX](02_DESIGN_AND_MOBILE_UX.md) before making architectural or visual decisions.
3. Read [04 Content and Public Starter](04_CONTENT_AND_PUBLIC_STARTER.md) early: the personal course needs a public adaptation before launch.
4. Review every remaining specification before finalising shared interfaces. Assigned agents read their owned section and its dependencies.
5. Use [09 Acceptance and QA](09_ACCEPTANCE_AND_QA.md) throughout the build rather than only at the end.

## Technical implementation specifications

Read the [technical design pack](technical/README.md) before implementation. It contains twelve focused specifications covering the stack, architecture, database, APIs, publishing, frontend, security, object design, testing, infrastructure and work packages. The parent numbered files own product scope; the technical pack supplies implementation detail.

## Specification map

| File | Responsibility |
| --- | --- |
| [Product and Scope](01_PRODUCT_AND_SCOPE.md) | Purpose and confirmed decisions; Inputs and boundaries; First release features |
| [Design and Mobile UX](02_DESIGN_AND_MOBILE_UX.md) | Reference observations and visual direction; The main study workspace; Mobile study experience; Study experience quality standards |
| [Learning Flow and Visual Teaching](03_LEARNING_AND_VISUALS.md) | A lesson from start to finish; Visual explanations throughout the course; Three initial interactive demonstrations |
| [Content Import and Public Course Readiness](04_CONTENT_AND_PUBLIC_STARTER.md) | Content import and preservation; Public course readiness and first use |
| [Accounts Data and Synchronisation](05_AUTH_DATA_AND_SYNC.md) | Technical recommendation; Explicit learning and data contracts |
| [Course Upload Publication and Versioning](06_COURSE_UPLOAD_AND_VERSIONING.md) | Owner course upload and publishing; Published content consistency; Concrete upload and owner contracts |
| [Deployment Launch and Recovery](07_DEPLOYMENT_AND_OPERATIONS.md) | Launch and recovery requirements |
| [Build Sequence and Handoff](08_BUILD_SEQUENCE_AND_HANDOFF.md) | Implementation sequence and agent ownership; Communication and deliverables; Handoff instruction |
| [Acceptance Tests and Quality Review](09_ACCEPTANCE_AND_QA.md) | Validation and definition of done |

## Confirmed product choices

- Name: BuildTrail. Proposed tagline: Understand software by building it.
- Vercel hosting, Supabase authentication/database/Storage.
- Google and GitHub sign-in.
- Public course reading; private account-linked notes and progress.
- Multiple courses with owner-only upload and publication.
- Mobile study, clear visuals and high-quality UX are first-release requirements.
- Python coding remains in the learner's editor and terminal.
- The rate limiter is the initial course; no invented extra public courses.
- No hosted IDE, automatic grading, payments or social platform in this release.

## Source of truth

The nine numbered specification files in this folder are the maintained source of the build plan. [The combined plan](WEB_APP_BUILD_PLAN.md) is generated from them for convenient single-file reading.

When requirements change, edit the appropriate numbered specification and run:

```bash
python3 "/home/jchukwu/Documents/code/BuildTrail/planning/rebuild_master.py"
```

Do not independently edit the generated master. The generator is a documentation utility, not application code. The [review report](WEB_APP_PLAN_REVIEW.md) records earlier findings; it is supporting evidence rather than a competing requirements document. If a later user instruction changes a requirement, update the relevant specification and regenerate the master.

Original course inputs remain outside this folder: [COURSE.md](../courses/rate-limiter-python/COURSE.md), [lesson files](../courses/rate-limiter-python/lessons), and [starter](../courses/rate-limiter-python/starter/README.md). Preserve these originals and create the public edition inside the future application repository.

## Setup inputs still needed

Implementation can begin without a custom domain or paid subscription. Deployment will need owner-provided service projects, configured provider credentials, the real owner account ID and a support destination. Do not invent these details. Domain availability and paid-plan decisions remain unresolved deployment inputs.

## Initial deliverable

First produce a portable public starter/content mapping and a reviewable visual slice of lessons 1 and 11, with lesson 22 used for content stress testing. Then complete the entire agreed release. The visual slice is a checkpoint, not permission to omit the remaining lessons or owner publication.

Give progress updates in chat; a file log is supplementary.

