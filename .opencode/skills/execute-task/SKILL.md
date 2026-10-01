---
name: execute-task
description: Execute exactly one task from an approved plan - write a per-task mini-plan, get user approval, implement, verify, update docs, commit, then stop and wait. Use when starting or continuing implementation of a planned task, or whenever the user asks to "do the next task".
---

# Execute Task

One task per approval cycle. Never implement multiple tasks without explicit user approval between them.

## Preconditions

1. An approved plan exists in `docs/plans/` (produced via grill-with-docs -> to-spec -> to-tickets or equivalent).
2. If no plan or tickets exist: stop and route the user to `/grill-with-docs` first. Do not improvise a plan and start implementing.

## The loop

Run exactly one iteration per user approval:

1. **Pick one task.** The next unchecked, unblocked task from the plan. Never two.
2. **Write the mini-plan.** Before touching code, append a short plan under that task in the plan file:
   - steps in order
   - files/symbols to touch
   - how it will be verified (the exact command)
   Present it and **wait for explicit user approval**. No approval, no implementation.
3. **Implement.** Execute only the approved mini-plan. If scope turns out bigger than planned: stop, split into new tickets, re-ask.
4. **Verify.** Narrowest check first (single test), full suite/lint once at the end. All green required before committing. Two consecutive failures: stop and report findings, ask how to proceed.
5. **Update docs.**
   - Tick the task checkbox in the plan file; note any deviation from the mini-plan.
   - `CONTEXT.md`: only if new domain terms were settled (glossary rules apply).
   - `docs/adr/`: only for decisions that are hard to reverse AND surprising AND a real trade-off. Most tasks produce zero ADRs.
6. **Commit** per `docs/rules/git-workflow.md`: one task = one commit, including its doc updates. Push only when the user asks.
7. **Stop.** Report what changed, verification results, commit hash. Then wait. Do not roll into the next task.

## Anti-patterns

- Implementing task N+1 "while you're in there".
- Skipping the mini-plan because the task looks small.
- Committing with failing or skipped verification.
- Batch-editing docs at the end of a session instead of per task.
