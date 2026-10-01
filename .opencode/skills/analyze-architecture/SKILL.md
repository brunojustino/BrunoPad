---
name: analyze-architecture
description: "Produce or refresh the project's technical documentation under docs/architecture/ by analyzing the codebase: stack, entry points, module boundaries, data flow, external services, and constraints, with Mermaid diagrams. Use when the user asks to analyze the architecture, document the codebase, 'create tech docs', 'architecture analysis', or right after installing this template into a new project."
---

# Analyze Architecture

Analyze the codebase and write its technical documentation to `docs/architecture/`. Two modes:

- **Create**: no `docs/architecture/overview.md` exists yet - full analysis.
- **Refresh**: it exists - update only what changed since the last analysis.

Never write outside `docs/architecture/`. Never modify existing project docs (README, CONTEXT.md, docs/adr/, docs/plans/) - read them as input, not as targets.

## Phase 0 - Inventory (main agent, cheap)

1. If the user passed a focus argument, note it; it scopes which concerns get (re-)explored.
2. Detect the stack: package manifests (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `build.gradle*`, `pom.xml`, `*.csproj`, `composer.json`, ...), lockfiles, config files (`tsconfig`, `vite`/`webpack`, `docker-compose`, `Dockerfile`, CI pipelines, `opencode.json`).
3. Read existing context: `README*`, `CONTEXT.md`, `docs/adr/index.md`, `docs/plans/`, `AGENTS.md`.
4. Git anchors: `git log --oneline -20` and top-level directory listing. If not a git repo, note the date instead of a SHA.
5. **Refresh mode check**: if `docs/architecture/overview.md` exists, read its `<!-- owt-analyzed-at: <sha> -->` marker. Resolve the SHA. If it resolves, run `git diff --stat <sha>..HEAD` and `git log --oneline <sha>..HEAD` to map which areas of the codebase changed; only those concerns go to Phase 1. If the SHA does not resolve, treat as Create but preserve existing files you cannot improve.

## Phase 1 - Explore

Pick one:

- **Large/medium codebase** (default): dispatch one parallel `arch-analyzer` subagent per concern in scope, each with an explicit task prompt (concern + relevant paths from Phase 0 + the output format from the agent file):
  1. **Topology**: entry points, runtime processes, deployment shape.
  2. **Components**: modules/layers, responsibilities, dependency directions, boundaries.
  3. **Data flow**: key flows end-to-end, persistence, state, queues/events.
  4. **Constraints**: env vars, config, external services, build/deploy, observed risks or debt.
- **Small codebase** or user asked to avoid subagents: explore directly, same four concerns, same output structure.

Focus argument: if the user scoped the run (e.g. "just the data flow"), explore only those concerns.

## Phase 2 - Write

Write exactly these files, aggregating subagent findings (dedupe, resolve contradictions yourself - do not paste agent output):

| File | Content |
| ---- | ------- |
| `overview.md` | What the system is (2-3 sentences), stack table, entry points, runtime topology (Mermaid `graph`), the `<!-- owt-analyzed-at: ... -->` marker right under the title |
| `components.md` | Per module: responsibility, key symbols (file:line), depends-on list; Mermaid dependency graph |
| `data-flow.md` | Key flows as Mermaid `sequenceDiagram` or `graph`, persistence/state notes |
| `constraints.md` | Env vars table, config surface, external services, build/deploy, Risks & debt observations |

Rules:

- Mermaid diagrams, not ASCII art. Diagrams must mirror code reality - node names match real modules/symbols.
- Every non-obvious claim cites evidence: `path/file.ts:42` or a config file.
- Unknowns: write "Not determined" with the reason (e.g. "no CI config present") instead of guessing.
- Refresh mode: update only stale sections plus the marker (new `HEAD` SHA, or date). Do not restructure files that are still accurate.

## Phase 3 - Report

Summarize: mode used, concerns explored, files written/updated, open unknowns, and anything that looked ADR-worthy (a hard-to-reverse, surprising, real-trade-off decision the code implies but no ADR records). Do not write ADRs yourself - propose them.

## Anti-patterns

- Reading the whole codebase into your own context when subagents are available.
- Inventing components, flows, or env vars not evidenced in the code.
- Editing files outside `docs/architecture/`.
- Refresh run that rewrites everything from scratch.
