<!-- owt:start -->
# Plan: File registry in DB

Status: approved
Runtime: host-waived
Origin: grill session (media-embeds design) 2026-10-02
Spec: -

## Tasks

Ordered; "Blocked by" lists task numbers that must finish first.

- [x] 1. Registry lifecycle on scan and watcher events
  Blocked by: -
  <!-- mini-plan (2026-10-02):
       Steps:
       1. New src/lib/fileRegistry.ts: syncFileRegistry(workspace:
          UserWorkspace) does a recursive readDir(root, {recursive: true}),
          computes the current file set (files only, skip directories),
          then: SELECT existing paths for the workspace, INSERT missing
          rows (INSERT ... ON CONFLICT(workspace_id, path) DO NOTHING -
          updated_at keeps first-registration time), DELETE rows whose
          path no longer exists. Path stored = absolute, matching the
          convention already used by embeddings.path.
       2. Hook into src/lib/useWorkspaceWatcher.ts: call
          syncFileRegistry once when the workspace attaches; on watcher
          events run a debounced (1s) full re-sync (same coalescing
          pattern as reEmbedPaths). No writes to the fs, so markSelfWrite
          is unaffected.
       Rationale for full re-sync vs incremental: watcher event paths can
       be directories (recursive deletes, folder drops) whose children
       are not listed; one code path is always consistent and workspaces
       are user text folders.
       Files/symbols: new src/lib/fileRegistry.ts,
       src/lib/useWorkspaceWatcher.ts
       Verify: npx tsc --noEmit; then npm run tauri dev, open a workspace,
       and check SELECT COUNT(*) FROM files WHERE workspace_id = <id>
       matches the on-disk file count; create / rename / delete a file
       and confirm rows follow after ~1s. -->
  <!-- executed 2026-10-02: implemented as mini-planned (fileRegistry.ts
       syncFileRegistry + debounced re-sync in useWorkspaceWatcher).
       Deviation: none in scope; note that the interactive dev-run part of
       the verify (SELECT COUNT(*) FROM files vs disk, create/rename/delete)
       was not driven by the agent - typecheck and npm run build are green,
       manual SQL spot-check left to the user on next dev run. -->
  <!-- original scope note (superseded by mini-plan above):
       Steps: hook existing file-tree scan + watcher flows; upsert
       (workspace_id, path) rows in files; delete rows whose path vanished;
       keep it a pure sync cache - filesystem is source of truth.
       Files/symbols: src/lib/watcher.ts, src/lib/explorer.ts,
       src-tauri/src/lib.rs (no schema change, table exists in migration 1)
       Verify: npm run tauri dev; open a workspace; check
       SELECT * FROM files matches disk (create, edit, delete, restore). -->
- [ ] 2. Expose registry read API to the frontend
  Blocked by: 1
  <!-- Steps: lib/fileRegistry.ts with getFileId(workspaceId, path) and
       listFiles(workspaceId); SQLite via plugin-sql, same pattern as
       embeddingStore.ts.
       Files/symbols: new src/lib/fileRegistry.ts, src/lib/db.ts
       Verify: typecheck (npx tsc --noEmit) + manual dev-run query. -->
- [ ] 3. Key AI embeddings by files.id instead of path string
  Blocked by: 2
  <!-- Steps: add file_id FK to embeddings (migration 4), populate during
       next reindex, update embeddingStore.ts queries; keep model column.
       Files/symbols: src-tauri/src/lib.rs, src/lib/ai/embeddingStore.ts,
       src/lib/ai/indexing.ts
       Verify: dev run, reindex a workspace, confirm embeddings rows join files. -->

## Notes

- `files` table (migration 1) already exists but is unused today; this plan
  makes it the per-file identity backbone for later metadata, linking,
  and live search.
- Registry semantics: sync cache of the filesystem. Renames = delete+insert
  (move detection deferred). All files register: md + media.
- Foundation for the media-embeds plan (0002) which needs stable file IDs.
<!-- owt:end -->
