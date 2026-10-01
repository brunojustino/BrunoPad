<!-- owt:start -->
# Plan: brunopad MVP

Status: draft
Runtime: host-waived
<!-- When the last task is ticked, set Status: done and move this file to
     docs/plans/history/ in the same commit (archived plans are read-only records). -->
Origin: starter.md / docs/spec/product-brief.md, adaptation session 2026-10-01
Spec: docs/spec/product-brief.md

## Tasks

Ordered; "Blocked by" lists task numbers that must finish first.

- [ ] 1. Scaffold Tauri 2.0 app (React/TS/Tailwind); commit toolchain pins
  Blocked by: -
- [ ] 2. Configure core plugins: fs, dialog, sql (capabilities in tauri.conf.json)
  Blocked by: 1
- [ ] 3. SQLite init + schema: user_workspaces (path), pane_layouts (JSON), files (metadata)
  Blocked by: 2
- [ ] 4. User-workspace folder picker UI; persist selected path
  Blocked by: 3
- [ ] 5. Explorer sidebar: recursive tree of user workspace
  Blocked by: 4
- [ ] 6. FS watcher (tauri plugin) -> UI updates on external changes
  Blocked by: 5
- [ ] 7. Sidebar CRUD: create/rename/delete folders + .md files
  Blocked by: 6
- [ ] 8. react-mosaic panes: drag file in, VS Code-style edge split, serialize layout to SQLite, restore on restart
  Blocked by: 7
- [ ] 9. BlockNote in panes: .md -> blocks on load, blocks -> .md on save
  Blocked by: 8
- [ ] 10. Verify BlockNote native behaviors: block drag, slash menu, heading markers
  Blocked by: 9
- [ ] 11. AI chat sidebar: chunk+embed files, embeddings in SQLite, external API; decide key storage first
  Blocked by: 5, 10
- [ ] 12. Ghost-text autocomplete on typing pause
  Blocked by: 11

## Notes

Deviations, settled terminology (also mirrored to CONTEXT.md), ADRs produced.
<!-- owt:end -->
