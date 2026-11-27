# Local container runtime

`scripts/supabase.mjs` selects an existing rootless Podman socket when Docker is unavailable. For that child invocation only, it prepends `scripts/local-bin` to PATH and supplies the resolved absolute real Podman executable. The shim forwards commands without logging arguments, rewrites the installed Supabase CLI's `run`/`create` numeric published-port mappings to loopback, preserves explicit loopback bindings, and rejects unsupported/non-loopback publish forms. It stops parsing at the image or command separator. It does not alter the user's PATH or system container configuration. Docker-mode binding remains an engine/network configuration concern; this Podman shim does not configure Docker.

Run `npm run test:tooling` for shim tests; this is included in `npm run verify`. Actual container bindings must also be inspected after stack startup.

## Resolved first-download checkpoint

The downloads described below subsequently completed. The local stack now starts successfully; PostgreSQL and API ports were verified bound to `127.0.0.1`. Database type generation also completed without requiring Studio. The following records the earlier recovery procedure, not a current blocker.

### Historical recovery procedure

The initial ECR pulls were extremely slow. Completed ECR images are Auth `v2.198.0` and PostgREST `v16.6`. Docker Hub fallback pulls for `supabase/postgres:17.12.0.002` and `library/kong:2.8.1` were left running at the checkpoint, with logs in ignored `.local/postgres-pull.log` and `.local/kong-pull.log`. Inspect current process state before restarting; do not launch duplicate pulls. Logs are diagnostics, not committed artifacts.

Once both pulls succeed, prepare the exact CLI cache names:

```bash
podman tag docker.io/supabase/postgres:17.12.0.002 public.ecr.aws/supabase/postgres:17.12.0.002
podman tag docker.io/library/kong:2.8.1 public.ecr.aws/supabase/kong:2.8.1
npm run db:start > .local/stack-start.log 2>&1
```

The Kong mirror uses the same layer digests as the official library image. Do not substitute different versions. Startup output can contain local development credentials; do not paste the complete log into chat, reports or commits. Check container health and published host addresses, then run the existing database migration/test/type-generation commands. No successful database integration test or generated-type freshness result is implied by static tests passing. Type generation may require an additional CLI-selected postgres-meta image even when Studio is disabled; this has not yet been exercised and should be treated as an additional potential download.
