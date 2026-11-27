# BuildTrail Deployment Launch and Recovery

## Launch and recovery requirements

Use Google and GitHub OAuth only for initial login. Create separate provider credentials and callback configuration for staging and production; test both providers, cancellation, sign-out, expiry and return-to-lesson. Test supported account linking before exposing a Link provider control; do not invent unsafe automatic merging.

Provide a plain-language privacy/data page describing actual account fields, private study data, hosting providers, exports, deletion and retention. Keep analytics off initially unless separately requested. Error logs must not include access tokens, note bodies, reflections or raw uploaded content. Capture enough operation IDs and error categories to diagnose login, save and publication failures. Document the owner contact route and service-status checks without adding a monitoring dashboard product.

Bound account writes and uploads using database constraints, authorization and appropriate server-side limits. Avoid saving on every keystroke. Default note/reflection size limit is 50,000 characters per field with a clear UI message; accept only one draft version upload operation at a time per owner. Review project quota usage and spend controls before opening registration widely.

Account deletion requires recent authentication, a clear description of the data affected, and an export option. Remove learner rows and related owned objects through a retryable trusted workflow; test that a stale session cannot recreate private data after deletion. Authentication deletion and database/storage cleanup are not assumed to be one transaction. Existing issued tokens and Storage ownership require explicit handling: https://supabase.com/docs/guides/auth/managing-user-data .

Document and exercise backup restoration for database records AND uploaded assets. Supabase database backups do not include Storage object contents: https://supabase.com/docs/guides/platform/backups . Define the chosen backup schedule, retention, responsible owner and restoration steps for the purchased/free plan. Preserve original published bundles outside the hosting service. Test a restore into staging before describing data as recoverable. Do not promise zero data loss; disclose the actual backup interval.

Keep an application rollback procedure separate from course-version rollback. Test migrations in staging and prefer backwards-compatible schema changes during deployment. Maintain a deployment checklist for environment variables, OAuth callbacks, row policies, Storage policies, deep links, exports and both-account tests. Include security headers appropriate to the chosen auth flow and block rendering uploaded HTML/scripts.

Release sequence: internal checks, a small invited pilot with real phone/desktop study sessions, then open registration. Treat the pilot as a release stage, not a new invitation-management feature. Resolve observed reading/navigation/save failures before widening access. No extra gamification, hosted IDE, payments or community features are added by this review.

## Environment responsibilities

Local development uses reproducible migrations and test fixtures. Hosted staging uses test accounts and test content. Production uses real learner data. Keep environment credentials and OAuth callbacks separate. Confirm the deployment actually points to its intended Supabase project before running write-based checks.

Document which environment variables are safe browser configuration and which must remain server-only. The example environment file contains names and explanations without real secrets. Do not put a service-role key into any variable that the frontend bundler exposes.

## Release runbook

The runbook should identify the release commit, migrations, content version, environment checks, tests, production smoke checks and rollback action. Application rollback and course rollback are distinct operations. Avoid a schema migration that makes the previous app release unable to read existing records unless a recovery plan is tested.

Before public launch, verify catalogue access, each login provider, one note save, progress resume, starter download and an issue-report link. Inspect errors without logging private content.

## Operational handoff

Supply a short owner guide for publishing a corrected course, diagnosing a failed save, checking provider status, exporting backups, restoring staging and rotating configuration. Name the backup owner and chosen retention/schedule in deployment documentation. A documented procedure that has never been tried must not be reported as a successful restore test.

A custom domain is optional. Domain availability, paid service choices and real contact details remain owner-provided deployment inputs.

