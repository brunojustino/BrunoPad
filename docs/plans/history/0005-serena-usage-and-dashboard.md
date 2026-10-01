# Plan: make Serena actually used + stop dashboard spam

Status: done (closed out 2026-09-04; restart opencode to pick up config + AGENTS.md)
Origin: user report - "a bunch of serena dashboards open but never see it used even with 200k+ contexts"
Spec: approved in session

## Diagnosis

- Every opencode session spawns its own `serena start-mcp-server` process and each
  auto-opens the web dashboard -> tab/process pile-up. Fix: `--enable-web-dashboard false`
  (verified flag exists in serena 1.7.0 `start-mcp-server --help`).
- Tools unused: one weak line in AGENTS.md ("prefer Serena's symbol-level tools") loses to
  opencode's built-in tool steering in the system prompt. Log shows sporadic
  `serena_get_symbols_overview` / `serena_find_symbol` / `serena_search_for_pattern` use
  (Sep 2-3), but never the default navigation path. planner.md and arch-analyzer.md already
  steer to Serena; the gap is the primary/build agents' steering (AGENTS.md Tools section).

## Tasks

- [x] 1. Disable dashboard auto-open in opencode.template.json
  Blocked by: -
  <!-- mini-plan filled at execution time:
       Steps:
         1. opencode.template.json line ~32: append "--enable-web-dashboard", "false"
            to serena command args.
       Files/symbols: opencode.template.json (mcp.serena.command)
       Verify: JSON parses (ConvertFrom-Json), args contain the new flag -->
- [x] 2. Harden the Serena rule in AGENTS.md
  Blocked by: -
  <!-- mini-plan filled at execution time:
       Steps:
         1. AGENTS.md Tools section: replace the weak bullet with an explicit conditional
            rule (symbols overview before whole-file reads on large/unfamiliar source
            files, find_symbol for defs/refs, search_for_pattern over Grep for code
            searches; built-ins stay default for docs/configs/small files).
       Files/symbols: AGENTS.md (## Tools)
       Verify: read-back; wording stays short (AGENTS.md is a router) -->
- [x] 3. Verify + close out
  Blocked by: 1, 2
  <!-- mini-plan filled at execution time:
       Steps: tick tasks, commit, note restart requirement.
       Files/symbols: docs/plans/0005-serena-usage-and-dashboard.md (tick)
       Verify: commit succeeds -->

## Notes

- User must restart opencode after this change (config + AGENTS.md load at startup).
- Known limitation: plan-mode sessions may not expose Serena tools at all (opencode core
  behavior, not config) - usage gains show up in build/execute sessions on target projects.
- No ADR: reversible config/wording change, follows existing patterns.
