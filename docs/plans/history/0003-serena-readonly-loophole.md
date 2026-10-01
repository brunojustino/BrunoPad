# Plan: close Serena edit-tool loophole in read-only agents

Status: done (closed out 2026-09-12; archived to history/)
Origin: user report - "planner is getting stuck in loops because of serena mcp"
Spec: approved in session

## Diagnosis

Log evidence (`~/.local/share/opencode/log/opencode.log`, run `707e9945`): during a
`planner` phase, `serena_replace_content` (Serena's MCP edit tool) was called every few
seconds for ~5 minutes until two user aborts. Root cause: the read-only lock
(`tools: write/edit/patch: false`, `bash: deny`) only covers built-in tools. MCP tools are
permissioned separately (log: `permission=serena_replace_content pattern=* action=allow`),
so a "read-only" agent could still edit through Serena and retried in a loop.
Affected: `planner`, `arch-analyzer`, and built-in `plan` (same hole).

## Tasks

- [x] 1. Deny Serena mutating tools for all three read-only agents + add doom_loop guard
  Blocked by: -
  <!-- mini-plan filled at execution time:
       Steps:
         1. planner.md + arch-analyzer.md: extend frontmatter permission with 13 serena_* deny
            keys (replace_content, replace_in_files, replace_symbol_body, insert_after_symbol,
            insert_before_symbol, rename_symbol, delete_lines, replace_lines, insert_at_line,
            write_memory, delete_memory, rename_memory, edit_memory) + loop-guard prompt line.
         2. opencode.template.json: agent.plan.permission with same denies (installer merges
            missing keys) + top-level "doom_loop": "ask" safety net.
         3. README.md safety-note bullet.
       Files/symbols: .opencode/agent/planner.md, .opencode/agent/arch-analyzer.md,
         opencode.template.json, README.md
       Verify: scratch install -> merged opencode.json valid JSON, contains
         agent.plan.permission.serena_replace_content=deny and permission.doom_loop=ask -->
- [x] 2. Verify and close out
  Blocked by: 1
  <!-- mini-plan filled at execution time:
       Steps: scratch install, JSON parse + key assertions, tick plan, commit.
       Files/symbols: docs/plans/0003-serena-readonly-loophole.md (tick)
       Verify: assertions green; commit succeeds -->

## Notes

- Schema-validated: PermissionConfig allows arbitrary additional property keys (string
  shorthand = pattern `*`), `doom_loop` takes a flat action.
- Serena tool names derived from installed package (v installed via uv): tool id = snake_case
  of tool class; `ide` context excludes create_text_file/read_file/execute_shell_command/
  find_file/list_dir, so the 13 listed mutating tools are the remaining surface.
- Deny keys for tools that don't exist are inert - safe for projects without Serena.
- No ADR: reversible, follows existing permission pattern.
- User must restart opencode after pulling this change (config loads at startup).
