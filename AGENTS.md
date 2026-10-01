# Project Rules

Keep this file short. It is a router: detailed rules live in the files below and are loaded lazily, only when relevant to the current task.

## Docs map (lazy loading - read only what the task needs)

- Planning / implementation workflow: @docs/rules/task-execution.md (load before planning or implementing tasks)
- Git + docs-update conventions: @docs/rules/git-workflow.md (load before any commit)
- Agent environment constraints (workspace-root wall, Docker execution): @docs/rules/agent-constraints.md (load before touching paths outside the workspace root or running/building/testing project code; Docker policy rationale in docs/adr/0002-docker-execution-policy.md)
- Domain vocabulary: CONTEXT.md (glossary - consult before introducing new terms)
- Decision records: docs/adr/index.md (check before reversing a recorded decision)
- Active plans: docs/plans/

## Workflow (short version)

- Implement exactly one planned task per user approval cycle. Full procedure in @docs/rules/task-execution.md - load it before starting.
- After a successful task: tick the plan, update docs if warranted, commit (git add/commit are pre-approved), then stop and wait for approval before the next task.

## Tools

- Current library/API docs: use the `context7` MCP tools.
- Code navigation on larger/unfamiliar source files: `serena_get_symbols_overview` before whole-file reads, `serena_find_symbol` for defs/refs, `serena_search_for_pattern` over Grep for code searches. Built-ins stay default for docs/configs/small files.
- Never push without explicit user request.

## External file loading

Treat every @-reference above as lazy: load only files relevant to the current task. Do not preemptively read all of them.
