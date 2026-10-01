<!-- owt:start -->
# Agent Environment Constraints

Load this file before touching anything outside the workspace root, or before running/building/testing project code.

## Workspace Root

The **workspace root** is the directory opencode was started in. It is the hard boundary for all agents - read-only ones and build/execute ones alike. What differs per agent is *write* permission, never *reach*.

- Never read, write, glob, grep, or path-touch anything outside the workspace root.
- Do not even *ask* for outside access unless truly necessary; prefer solving the task from inside the project. When outside access is genuinely required, ask the user and name the exact path.
- This binds built-in tools **and** MCP tools (Serena, etc.) - they are permissioned separately but the boundary is the same.

### Enforcement

`opencode.template.json` sets `permission.external_directory: {"**": "ask"}`. This makes opencode prompt for every tool call that touches a path outside the workspace root (the built-in default, made explicit so the template self-documents it).

### Allowlist (per project, user-maintained)

When a project legitimately needs routine access to an outside path, the user adds an allow rule. Rules are last-match-wins, so put the allowlist after the catch-all:

```json
{
  "permission": {
    "external_directory": {
      "**": "ask",
      "~/shared-libs/**": "allow"
    }
  }
}
```

Keep the allowlist short and specific. `~` expands to the user's home directory. Agents never edit this allowlist themselves - propose the entry, let the user add it.

## Docker Execution

Projects must be self-sufficient: anything that would require installing a runtime on the user's machine (node, uv, java, ...) runs in Docker instead.

- The agent creates the `Dockerfile` / `docker-compose.yml` that matches the project's requirements, then runs everything through it.
- What runs in Docker: the project's **runtime** (server, CLI), **builds**, **tests**, and **lint**. All verification commands in plans execute via `docker compose run` / `docker compose exec` - never on the host.
- Exempt: agent tooling itself (opencode, MCP servers, git). The harness cannot run inside the container it drives. This exemption is structural, not repo-specific.
- Trade-off accepted: every verification cycle pays container overhead. That is the price of reproducibility.
- **Waiver**: a project may run on the host only by explicit waiver, recorded as `Runtime: host-waived` in the header of the active plan. No waiver, no host execution. See ADR-0002 for the rationale.
<!-- owt:end -->
