<!-- owt:start -->
# Git Workflow

Load before any commit.

## Commits

- One task = one commit, including that task's doc updates (plan tick, CONTEXT.md/ADR if warranted).
- Conventional subjects: `feat: | fix: | docs: | refactor: | test: | chore:`
- Subject <= 72 chars, imperative. Reference the plan and task: `feat: auth login (plan/auth task 3)`
- Body explains *why*, not *what*.

## Pre-commit checklist

1. Verification is green (no skipped tests).
2. Plan task ticked, mini-plan deviations noted.
3. No secrets, `.env`, or build artifacts staged. Check `git status` before `git add` - stage only intended files.

## Push

- Never push without explicit user request. `git push*` requires approval by config.

## Things never to do

- Amend or force-push pushed commits.
- Skip hooks (`--no-verify`) unless the user asks.
- Commit unrelated changes that happen to be in the worktree.
<!-- owt:end -->
