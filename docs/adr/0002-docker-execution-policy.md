# Run project code in Docker by default

Projects need runtimes (node, uv, java, ...); installing them on the user's machine makes every project dependent on host state and spreads environment drift across machines. We decided that anything that would require installing a runtime on the host - the project's runtime, builds, tests, and lint - runs in Docker instead: the agent creates the `Dockerfile` / `docker-compose.yml` matching the project's requirements and all verification commands execute via `docker compose run` / `docker compose exec`.

Why: reproducible verification is more robust, safer, and more professional than "works on my machine" host runs. The trade-off is accepted knowingly: every verification cycle pays container overhead. Agent tooling itself (opencode, MCP servers, git) is exempt - the harness cannot run inside the container it drives; this exemption is structural, not repo-specific.

Considered options: universal default with no escape hatch (rejected: breaks on machines without Docker and on trivial projects), silent opt-in per project (rejected: agents lazily fall back to host runtimes). A project may run on the host only by explicit waiver, recorded as `Runtime: host-waived` in the header of the active plan; individual waivers get no ADR of their own - this decision covers the policy.

Status: accepted

## Consequences

- Plans carry a `Runtime:` header field (`docker | host-waived`).
- Verification commands in plans are compose invocations, not bare host commands.
- Machines without Docker cannot follow the default workflow without a waiver.
