# Adopt the opencode workflow template

This project uses the opencode workflow template: skills-driven planning (grill-with-docs -> to-spec -> to-tickets -> execute-task), a thin `AGENTS.md` router with lazy-loaded rule files, and docs as first-class artifacts (`CONTEXT.md` glossary, `docs/adr/`, `docs/plans/`).

Why: work is controlled and documented by construction - exactly one task is implemented per user-approval cycle, each task ends with doc updates and a git commit, and the agent loads only the context a task needs (skills on demand, lazy `@`-references, two low-cost MCP servers: context7 for library docs, Serena for symbol-level code navigation).

Alternatives considered: a fat AGENTS.md with all rules always in context (rejected: permanent context cost, dilutes adherence) and ad-hoc prompting per session (rejected: no enforcement of the approval loop, no durable documentation trail).

Consequences: git add/commit are pre-approved but push is not; plans live in `docs/plans/` and are the single source of task truth; new domain terms go to `CONTEXT.md`, hard-to-reverse decisions to `docs/adr/`.
