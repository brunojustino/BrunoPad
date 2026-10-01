<!-- owt:start -->
# Plan: brunopad MVP

Status: approved
Runtime: host-waived
<!-- When the last task is ticked, set Status: done and move this file to
     docs/plans/history/ in the same commit (archived plans are read-only records). -->
Origin: starter.md / docs/spec/product-brief.md, adaptation session 2026-10-01
Spec: docs/spec/product-brief.md

## Tasks

Ordered; "Blocked by" lists task numbers that must finish first.

- [x] 1. Scaffold Tauri 2.0 app (React/TS/Tailwind); commit toolchain pins
  Blocked by: -
  <!-- mini-plan filled at execution time:
       Steps:
       1. Scaffold Vite + React + TypeScript app in repo root (package.json,
          tsconfig, vite.config.ts, src/, index.html).
       2. Add Tailwind CSS (v3 config or v4 build step) wired into src/ styles.
       3. Add Tauri 2.0: @tauri-apps/cli dev-dep, `tauri init` -> src-tauri/
          (Cargo.toml, tauri.conf.json, main.rs) with devUrl pointing at Vite.
       4. Commit toolchain pins: package.json exact versions,
          src-tauri/rust-toolchain.toml. Update .gitignore
          (node_modules/, dist/, src-tauri/target/).
       Files: package.json, package-lock.json, tsconfig.json,
       vite.config.ts, index.html, src/*, src-tauri/*, .gitignore
       Verify:
       - npm run build (tsc + vite build) -> exit 0
       - cargo check in src-tauri/ -> exit 0 (host run per ADR-0004) -->
- [x] 2. Configure core plugins: fs, dialog, sql (capabilities in tauri.conf.json)
  Blocked by: 1
  <!-- mini-plan filled at execution time:
       Steps:
       1. npm deps (pinned): @tauri-apps/plugin-fs@2.6.0,
          @tauri-apps/plugin-dialog@2.8.1, @tauri-apps/plugin-sql@2.5.0.
       2. Rust deps in src-tauri/Cargo.toml: tauri-plugin-fs = "2",
          tauri-plugin-dialog = "2", tauri-plugin-sql = { version = "2",
          features = ["sqlite"] } (lock to the resolved 2.x exact after install).
       3. Register in src-tauri/src/lib.rs:
          .plugin(tauri_plugin_fs::init()),
          .plugin(tauri_plugin_dialog::init()),
          .plugin(tauri_plugin_sql::Builder::default().build()).
       4. Extend src-tauri/capabilities/default.json permissions:
          fs:default, fs:allow-read-dir, fs:allow-read-text-file,
          fs:allow-write-text-file, fs:allow-mkdir, fs:allow-remove,
          fs:allow-rename (+ dialog:default, sql:default).
       Files: package.json, package-lock.json, src-tauri/Cargo.toml,
       src-tauri/Cargo.lock, src-tauri/src/lib.rs,
       src-tauri/capabilities/default.json
       Verify:
       - npm run build -> exit 0
       - cargo check (PATH prefixed with ~\.cargo\bin, see plan Notes) -> exit 0 -->
- [x] 3. SQLite init + schema: user_workspaces (path), pane_layouts (JSON), files (metadata)
  Blocked by: 2
  <!-- mini-plan filled at execution time:
       Steps:
       1. src-tauri/src/lib.rs: declare migration v1 (SQL below) via
          tauri_plugin_sql::{Migration, MigrationKind} and attach with
          .add_migrations("sqlite:brunopad.db", migrations) on the sql plugin.
       2. Schema (migration v1):
          CREATE TABLE user_workspaces (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          );
          CREATE TABLE pane_layouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id INTEGER NOT NULL REFERENCES user_workspaces(id) ON DELETE CASCADE,
            layout TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
          );
          CREATE TABLE files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id INTEGER NOT NULL REFERENCES user_workspaces(id) ON DELETE CASCADE,
            path TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE (workspace_id, path)
          );
       3. src/lib/db.ts: getDb() singleton via Database.load("sqlite:brunopad.db")
          from @tauri-apps/plugin-sql; on startup log tables found
          (sqlite_master) as dev-time smoke signal (console.debug).
       4. src/App.tsx: call getDb() in a mount effect (fire-and-forget smoke check).
       Files: src-tauri/src/lib.rs, src/lib/db.ts, src/App.tsx
       Verify:
       - npm run build -> exit 0
       - cargo check (PATH prefix) -> exit 0
       - runtime smoke (user-run): `npm run tauri dev` -> devtools console
         shows the three tables listed -->
- [x] 4. User-workspace folder picker UI; persist selected path
  Blocked by: 3
  <!-- mini-plan filled at execution time:
       Steps:
       1. src/lib/workspace.ts: UserWorkspace type + getCurrentWorkspace()
          (SELECT ... ORDER BY id DESC LIMIT 1) + setWorkspace(path)
          (INSERT OR IGNORE into user_workspaces).
       2. src/App.tsx: on mount load current user workspace; if none, show
          an "Open workspace" button -> @tauri-apps/plugin-dialog
          open({ directory: true, multiple: false }); on pick, persist via
          setWorkspace and render the selected path in a slim top bar.
          If one exists already, render the path directly (placeholder main
          area until Phase 2 explorer).
       3. Cosmetic (kills the favicon 404): public/favicon.svg + link in index.html.
       Files: src/lib/workspace.ts, src/App.tsx, src/styles.css (touch-up),
       public/favicon.svg, index.html
       Verify:
       - npm run build -> exit 0
       - cargo check (PATH prefix) -> exit 0
       - runtime smoke (user-run): pick a folder -> path appears; restart app
         -> same path shown without picking -->
- [x] 5. Explorer sidebar: recursive tree of user workspace
  Blocked by: 4
  <!-- mini-plan filled at execution time:
       Steps:
       1. src/lib/explorer.ts: readDirEntries(path) wrapper over
          @tauri-apps/plugin-fs readDir, returning entries sorted
          (directories first, then alphabetical).
       2. src/components/FileTree.tsx: lazy recursive tree component -
          folders expand/collapse on click, children fetched per
          directory on first expand and cached in component state;
          files render as plain rows (no selection behavior yet).
       3. src/App.tsx: left sidebar (w-60, border-r) hosting FileTree
          rooted at workspace.path; main area stays placeholder.
       Files: src/lib/explorer.ts, src/components/FileTree.tsx,
       src/App.tsx
       Verify:
       - npm run build -> exit 0
       - cargo check (PATH prefix) -> exit 0
       - runtime smoke (user-run): sidebar shows real folder tree;
         expanding nested folders works -->
- [x] 6. FS watcher (tauri plugin) -> UI updates on external changes
  Blocked by: 5
  <!-- mini-plan filled at execution time:
       Steps:
       1. capabilities/default.json: add fs:allow-watch with
          allow [{ "path": "**" }] scope.
       2. src/lib/watcher.ts: watchWorkspace(path, onChange) using
          plugin-fs watchImmediate(path, cb, { recursive: true }),
          with a 200ms debounce on events; returns the unwatch fn.
       3. src/App.tsx: on workspace set, start the watcher (cleanup
          on change/unmount); on event bump treeVersion; FileTree
          remounts via key={treeVersion} (expansion state resets -
          accepted MVP trade-off, noted).
       Files: src-tauri/capabilities/default.json, src/lib/watcher.ts,
       src/App.tsx
       Verify:
       - npm run build -> exit 0
       - cargo check (PATH prefix) -> exit 0
       - runtime smoke (user-run): with app open, create/rename/delete a
         file in the workspace from Explorer -> sidebar reflects it within
         ~1s -->
- [x] 7. Sidebar CRUD: create/rename/delete folders + .md files
  Blocked by: 6
  <!-- mini-plan filled at execution time:
       Steps:
       1. src/lib/explorer.ts: add createFile (writeTextFile, ""),
          createFolder (mkdir), renameEntry (rename within same dir),
          deleteEntry (remove, recursive for dirs).
       2. src/components/ContextMenu.tsx: lightweight fixed-position
          menu (backdrop click-away); items: {label, danger?, onClick}.
       3. Rewrite src/components/FileTree.tsx with LIFTED expansion
          state (Set<path>) + children cache (Map<path>) so the tree
          can refresh after CRUD without losing expansion; nodes get
          onContextMenu -> menu; inline input row commits new
          file/folder names on Enter (window.prompt is unavailable in
          the Tauri webview); rename uses the same inline input
          prefilled; delete goes straight through (remove).
       4. Sidebar header: "+ file" button targeting the workspace root;
          App bumps treeVersion on every mutation.
       Files: src/lib/explorer.ts, src/components/ContextMenu.tsx,
       src/components/FileTree.tsx, src/App.tsx
       Verify:
       - npm run build -> exit 0
       - cargo check (PATH prefix) -> exit 0
       - runtime smoke (user-run): right-click create file + folder,
         rename both, delete both; verify on disk -->
- [x] 8. react-mosaic panes: drag file in, VS Code-style edge split, serialize layout to SQLite, restore on restart
  Blocked by: 7
- [x] 9. BlockNote in panes: .md -> blocks on load, blocks -> .md on save
  Blocked by: 8
- [ ] 10. Verify BlockNote native behaviors: block drag, slash menu, heading markers
  Blocked by: 9
- [ ] 11. AI chat sidebar: chunk+embed files, embeddings in SQLite, external API; decide key storage first
  Blocked by: 5, 10
- [ ] 12. Ghost-text autocomplete on typing pause
  Blocked by: 11

## Notes

Deviations, settled terminology (also mirrored to CONTEXT.md), ADRs produced.

- Task 1 (2026-10-01): Tauri 2.12.1 (Tauri 3 still alpha; "Tauri 2.0" mandate = 2.x stable). `tauri init` named the crate `app` - renamed to `brunopad` (`brunopad_lib`), identifier `com.brunopad.app`. Added `src/vite-env.d.ts` for CSS module typing. Tailwind v4 via `@tailwindcss/vite`. Session PATH lacks `~\.cargo\bin` on this machine - verification commands must prefix it (`$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"`). Versions pinned exact: react/react-dom 19.3.0, vite 8.3.2, tailwindcss 4.3.3, typescript 7.0.2, @tauri-apps/{cli,api} 2.12.1. Verify: `npm run build` green, `cargo check` green (1m07s cold).
- Task 2 (2026-10-01): Rust plugin crates locked exact to match npm: tauri-plugin-fs 2.6.0, tauri-plugin-dialog 2.8.1, tauri-plugin-sql 2.5.0 (sqlite feature). No deviations. Verify: `npm run build` green, `cargo check` green (50s).
- Task 3 (2026-10-01): deviation - `Migration` is not `Clone` in tauri-plugin-sql 2.5.0, so the migrations are built as a `Vec` inside `run()` instead of a const slice copy. Verify: `npm run build` green, `cargo check` green. Runtime smoke pending user run (`npm run tauri dev` -> devtools console shows tables).
- Task 3 runtime-smoke failure (2026-10-01): user hit `SQLITE_BUSY (code 5)` on startup - React StrictMode double-invokes the mount effect in dev, overlapping two `Database.load` calls (both run migration checks against the same file). Fixed in `src/lib/db.ts`: memoize the load *promise* (dedupes concurrent callers) and enable WAL journal mode after load. Verify: `npm run build` green; user smoke re-run pending.
- Task 3 runtime-smoke failure 2 (2026-10-01): `sql.execute not allowed` - `sql:default` in tauri-plugin-sql 2.5.0 does not include execute/select/load. Added explicit `sql:allow-load`, `sql:allow-execute`, `sql:allow-select` to capabilities/default.json. Verify: build green; user smoke re-run pending.
- Task 5 (2026-10-01): deviation - plugin-fs 2.6.0 `DirEntry` has no `path` field (name only), so `readDirEntries` builds a project `ExplorerEntry` type with joined paths (separator inferred from input). Verify: build green, cargo check green. Runtime smoke pending user run.
- Task 5 runtime-smoke failure (2026-10-01): `forbidden path` on user-picked dirs - bare `fs:allow-*` permissions only cover app-reserved dirs; arbitrary user-workspace paths need explicit scopes. Fixed capabilities: each fs permission carries `allow: [{ "path": "**" }]`. Security trade-off (MVP: frontend fs API is unconstrained) noted; the principled fix - runtime-extend the fs scope in Rust when the picker resolves - is deferred; revisit before release.
- Task 7 (2026-10-01): deviation - mini-plan's "+ file at root" header button replaced with a "change workspace" button (more useful now; root-level create needs an imperative FileTree API - deferred; create works by right-clicking any existing folder). FileTree rewritten with lifted expansion state, so CRUD refreshes no longer collapse folders (also softens the task-6 remount trade-off). Verify: build green, cargo check green. Runtime smoke pending user run.
- Task 8 (2026-10-01): deviation - MosaicZeroState in v7 accepts only `createNode`, so a custom zero-state div is used. Editor placeholder renders file name; real content lands with task 9 (BlockNote). Persisted layout = `{ tree, panes }` JSON via DELETE+INSERT per save (debounced 300ms). Verify: build green, cargo check green. Runtime smoke pending user run (open 2 files split, restart, layout restored).
- Task 9 (2026-10-01): no deviations. BlockNote 0.55.0 (core/react/mantine). Load: readTextFile -> tryParseMarkdownToBlocks -> replaceBlocks; save: useEditorChange -> 500ms debounce -> blocksToMarkdownLossy -> writeTextFile, guarded so the initial load doesn't write back. Build green (bundle grew to 1.3MB main chunk - code-splitting deferred), cargo check green. Runtime smoke pending user run.
<!-- owt:end -->
