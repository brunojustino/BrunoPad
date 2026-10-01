# Plan: agent environment constraints + plan archive convention

Status: done (closed out 2026-09-12; archived to history/)
Origin: grill-with-docs session 2026-09-12 (user: sandbox boundary, docker execution, plans history)
Spec: approved in session (Q1-Q7 round 1 + Q1-Q7 round 2, all recommendations accepted)

## Decisions settled in session

- Boundary = **workspace root** (dir opencode was started in), wall binds **all agents**;
  enforcement = explicit `external_directory` permission + prose rule; allowlist is
  per-project, user-maintained, documented in the rules file (last-match-wins).
- Docker policy = default-on for **project code + verification** (runtime, build, test,
  lint); agent tooling (opencode, MCP servers, git) exempt - structural, not repo-specific.
  Waiver = `Runtime: host-waived` header field in the plan; the policy ADR notes the
  waiver mechanism. One ADR (`0002-docker-execution-policy.md`); no ADR for the sandbox
  rule (documents an opencode default, reversible - 0003 precedent).
- Archive = when a plan's last task is ticked, the same commit moves it to
  `docs/plans/history/`; no index file (git history + NNNN prefixes are the index).
- Glossary terms: **Workspace root**, **Archived plan**.

## Tasks

Ordered; "Blocked by" lists task numbers that must finish first.

- [x] 1. Archive finished plans + history convention
  Blocked by: -
  <!-- mini-plan filled at execution time:
       Steps:
         1. Create docs/plans/history/ (with .gitkeep so git tracks it).
         2. Plans 0003, 0004, 0005: verify all tasks ticked -> set Status: done, move to
            docs/plans/history/ (git mv). 0005 already done.
         3. task-execution.md: add to step 5 - "if this was the plan's last task: set
            Status: done and move the plan to docs/plans/history/ in the same commit".
         4. plan-template.md: note the archive convention under Status.
         5. CONTEXT.md: add **Archived plan** term.
       Files/symbols: docs/plans/history/.gitkeep, docs/plans/000{3,4,5}*.md,
         docs/rules/task-execution.md, docs/plans/plan-template.md, CONTEXT.md
       Verify: git status shows renames; docs/plans/ root holds only active plans
         (0006) + plan-template.md; rg "Status: done" in history/ matches 3 files -->
- [x] 2. Sandbox rule: workspace-root wall
  Blocked by: 1
  <!-- mini-plan filled at execution time:
       Steps:
         1. opencode.template.json: add "external_directory": { "**": "ask" } to
            permission (explicit self-documentation of the opencode default; allowlist
            entries are added per-project by the user, last-match-wins).
         2. New docs/rules/agent-constraints.md: Workspace Root section - wall binds all
            agents (read/write/search/bash paths); avoid asking for outside access, ask
            only when truly necessary; allowlist how-to with example JSON.
         3. AGENTS.md: add router line under Docs map.
         4. CONTEXT.md: add **Workspace root** term.
         5. README.md: bullet in the safety-notes area (near line 257) on
            external_directory.
       Files/symbols: opencode.template.json, docs/rules/agent-constraints.md,
         AGENTS.md, CONTEXT.md, README.md
       Verify: opencode.template.json parses as valid JSON; rg external_directory
         matches in template json + rules file + README -->
- [x] 3. Docker execution policy + ADR
  Blocked by: 2
  <!-- mini-plan filled at execution time:
       Steps:
         1. docs/rules/agent-constraints.md: Docker Execution section - project runtime,
            build, test, lint run in Docker (Dockerfile/compose created to match project
            needs); agent tooling exempt; waiver = "Runtime: host-waived" in plan header.
         2. plan-template.md: add "Runtime: docker | host-waived" header field.
         3. New docs/adr/0002-docker-execution-policy.md (accepted; notes waiver
            mechanism); update docs/adr/index.md table.
         4. AGENTS.md: extend the router line from task 2 to cover the whole file.
       Files/symbols: docs/rules/agent-constraints.md, docs/plans/plan-template.md,
         docs/adr/0002-docker-execution-policy.md, docs/adr/index.md, AGENTS.md
       Verify: rg "host-waived" matches rules file + plan template + ADR; index row
         present; rg "agent-constraints" in AGENTS.md -->
- [x] 4. Verify and close out
  Blocked by: 3
  <!-- mini-plan filled at execution time:
       Steps: full grep sweep across touched files, tick plan, move this plan to
         history/ per the new convention (dogfood), commit.
       Files/symbols: this plan file
       Verify: all task-level verify commands green -->

## Notes

Deviations, settled terminology (also mirrored to CONTEXT.md), ADRs produced.

- Task 1 deviation: mini-plan listed 0003/0004/0005, but 0002-analyze-architecture.md
  was also fully ticked yet still marked `Status: approved` - archived it too
  (within task intent: "archive finished plans").

- Session decisions: round 1 = Q1(b) allowlist wall, Q2(b) prose+config, Q3(c)
  default-with-waiver, Q4(b) runtime+build+test+lint, Q5(a) one rules file, Q6(a)
  move at plan completion, Q7(a) one plan + docker ADR. Round 2 = all recommendations
  accepted (explicit external_directory ask; tooling exemption structural; waiver in
  plan header; one ADR; move in same commit; both glossary terms; wall binds all agents).
- Facts: external_directory defaults to "ask" and covers every path-taking tool incl.
  MCP tools (opencode docs, Permissions); template ships config via
  opencode.template.json, installer merges missing keys (plan 0003 precedent).
