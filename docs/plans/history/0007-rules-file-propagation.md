# Plan: propagate template-owned rules files on re-install

Status: done (closed out 2026-09-12; archived to history/)
Origin: user follow-up to plan 0006 - "old installs drift" (rules files never update on re-install)
Spec: approved in session (Q1(a) scope, Q2(a) owt markers + stale migration, Q3(a) skip CONTEXT.md, Q4(a) wording fix)

## Decisions settled in session

- Scope: `docs/rules/*.md` + `docs/plans/plan-template.md` become template-owned and
  update on re-install. Project docs (adr/, plans content, architecture/) stay
  never-written. CONTEXT.md stays purely project-owned - no propagation machinery.
- Mechanism: owt markers (`<!-- owt:start -->...<!-- owt:end -->`) wrapping the whole
  template content of each rules file + plan-template. Re-install replaces the block.
  Marker-less files in these paths are treated as stale template installs: backup,
  then replace with marker-wrapped version (user-customized pre-marker files are
  backed up, diffable/restorable from .template-backup).
- Wording: installer header + README "never written" promise updated to the precise
  exception.

## Tasks

Ordered; "Blocked by" lists task numbers that must finish first.

- [x] 1. Marker-wrap template-owned files
  Blocked by: -
  <!-- mini-plan filled at execution time:
       Steps:
         1. docs/rules/task-execution.md, git-workflow.md, agent-constraints.md,
            docs/plans/plan-template.md: wrap ENTIRE file content in
            <!-- owt:start --> ... <!-- owt:end --> (first line before content, last
            line after). Template source files become marker-wrapped.
       Files/symbols: docs/rules/{task-execution,git-workflow,agent-constraints}.md,
         docs/plans/plan-template.md
       Verify: rg -c "owt:start" matches 4 in those files; files still render as
         markdown (markers are comments) -->
- [x] 2. Installer: Merge-RulesFile + wiring
  Blocked by: 1
  <!-- mini-plan filled at execution time:
       Steps:
         1. install.ps1: add Merge-RulesFile function - per file in
            docs/rules/*.md + docs/plans/plan-template.md:
            - missing -> Write-TemplateFile with template content (created)
            - present + has owt:start/end -> backup, replace block via existing
              Merge-MarkdownBlock logic (reuse: call Merge-MarkdownBlock directly -
              it already implements exactly this)
            - present + marker-less (stale) -> backup, replace whole file with
              marker-wrapped template content (merged list)
         2. Call it after the Copy-TemplateTree docs step (replaces MissingOnly for
            these paths - exclude them from the docs tree walk or run after; simplest:
            keep MissingOnly walk, then Merge-RulesFile overwrites these specific
            files backup-first).
         3. Header comment (line ~12) + README safety-model wording: precise exception
            for template-owned rules files.
       Files/symbols: install.ps1 (new function, docs step, header), README.md
       Verify: PS parser syntax check; scratch install fresh -> markers present,
         content correct; scratch install #2 after modifying a rules file outside
         markers -> user text preserved + block refreshed; stale marker-less file ->
         replaced + backed up -->
- [x] 3. Verify end-to-end and close out
  Blocked by: 2
  <!-- mini-plan filled at execution time:
       Steps: full scenario matrix (fresh, re-install with user edits, stale
         marker-less, opencode.jsonc warning path untouched), tick plan, archive to
         history/ in same commit.
       Files/symbols: this plan file
       Verify: all scenario assertions green -->
