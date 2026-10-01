<!-- owt:start -->
# Task Execution Workflow

Load this file when planning or implementing tasks. The short version lives in AGENTS.md; this file is the authoritative procedure.

## Rule

One task per approval cycle. The agent never implements multiple tasks without explicit user approval between them.

## Preconditions

- An approved plan exists in `docs/plans/` (see `plan-template.md`).
- Tasks are ordered with blocking edges clear. If the plan came from `/to-tickets`, follow its dependency order.

## The loop (repeat per task)

1. **Pick one task** - next unchecked, unblocked task. Never two.
2. **Write the mini-plan** into the plan file under that task (steps, files to touch, verification command). Present it and wait for explicit approval.
3. **Implement** only what the mini-plan covers. Scope creep: stop, split, re-ask.
4. **Verify**: narrowest check first (single test), full suite/lint at the end. All green required.
5. **Update docs** (see git-workflow.md before committing):
   - tick the task checkbox, note deviations
   - `CONTEXT.md` only for newly settled domain terms
   - `docs/adr/` only for hard-to-reverse + surprising + real-trade-off decisions (most tasks: zero ADRs)
   - if this was the plan's last task: set `Status: done` and move the plan to `docs/plans/history/` in the same commit
6. **Commit**: one task = one commit, including its doc updates.
7. **Stop and report**: changes, verification results, commit hash. Wait for approval before the next task.

## Failure handling

- Verification fails twice in a row: stop, report findings, ask how to proceed.
- Task grows beyond its mini-plan: split into new tickets, get approval, then continue.
- A decision pops up mid-task: if it passes the ADR gates, park it - finish the task, record it in the commit's docs update.
<!-- owt:end -->
