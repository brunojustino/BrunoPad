# Plan: analyze-architecture capability

Status: done (closed out 2026-09-12; archived to history/)
Origin: user request - "generate technical documentation of a project after installing the template"
Spec: approved in session (skill + subagent + command; docs/architecture/ folder; create + refresh lifecycle)

## Tasks

Ordered; "Blocked by" lists task numbers that must finish first.

- [x] 1. Add `analyze-architecture` skill, `arch-analyzer` subagent, and `/analyze-architecture` command
  Blocked by: -
  <!-- mini-plan filled at execution time:
       Steps:
         1. Write .opencode/skills/analyze-architecture/SKILL.md (inventory -> parallel arch-analyzer subagents -> write docs/architecture/{overview,components,data-flow,constraints}.md -> refresh via owt-analyzed-at marker).
         2. Write .opencode/agent/arch-analyzer.md (read-only subagent, structured findings + Mermaid).
         3. Write .opencode/command/analyze-architecture.md ($ARGUMENTS as focus hints).
       Files/symbols: .opencode/skills/analyze-architecture/SKILL.md, .opencode/agent/arch-analyzer.md, .opencode/command/analyze-architecture.md
       Verify: frontmatter parses; files exist at exact loader paths; description front-loads trigger keywords -->
- [x] 2. Wire into installer + docs
  Blocked by: 1
  <!-- mini-plan filled at execution time:
       Steps:
         1. install.ps1: add "analyze-architecture" to $required sanity-check list (Copy-TemplateTree already carries .opencode recursively).
         2. README.md: add skill row to Skills table; add /analyze-architecture to Workflow section.
       Files/symbols: install.ps1 ($required), README.md
       Verify: .\install.ps1 -Target <scratch dir> reports "All 10 skills present" and copies the new files -->
- [x] 3. Verify end-to-end and close out
  Blocked by: 2
  <!-- mini-plan filled at execution time:
       Steps: install into scratch dir under temp, confirm files + sanity check, tick plan, commit.
       Files/symbols: docs/plans/0002-analyze-architecture.md (tick)
       Verify: scratch install output clean; git commit succeeds -->

## Notes

- Executed as one task cycle (tasks 1-3 are one coherent change): verification = PowerShell syntax check + scratch install (all 10 skills present, new files copied), scratch dir removed afterwards.
- No deviations from mini-plans.
- No ADR: decision is easily reversible, not surprising, no real trade-off (template already vendors custom skills).
- No AGENTS.md change: skills are auto-discovered; router stays thin.
- No opencode.template.json change: no new MCP/permission surface.
