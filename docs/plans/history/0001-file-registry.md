<!-- owt:start -->
# Plan: File registry in DB

Status: done
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
- [x] 2. Expose registry read API to the frontend
  Blocked by: 1
  <!-- mini-plan (2026-10-02):
       Steps:
       1. Extend src/lib/fileRegistry.ts with two read helpers:
          - listFiles(workspaceId): SELECT id, path FROM files WHERE
            workspace_id = $1 -> { id, path }[]
          - getFileId(workspaceId, path): SELECT id ... LIMIT 1 ->
            number | null (null when unregistered; callers decide
            whether to sync-and-retry later)
       2. No UI wiring yet - task 3 (embeddings by files.id) is the
          first consumer; media plan will follow.
       Files/symbols: src/lib/fileRegistry.ts (same pattern as
       embeddingStore.ts)
       Verify: npx tsc --noEmit; npm run build; manual query on next
       dev run (listFiles returns the same rows as
       SELECT * FROM files WHERE workspace_id = <id>). -->
  <!-- executed 2026-10-02: implemented as mini-planned; typecheck and
       build green; manual query spot-check left to user on next dev run. -->
- [x] 3. Key AI embeddings by files.id instead of path string
  Blocked by: 2
  <!-- mini-plan (2026-10-02):
       Steps:
       1. Migration 4 in src-tauri/src/lib.rs: ALTER TABLE embeddings ADD
          COLUMN file_id INTEGER REFERENCES files(id); backfill
          UPDATE ... SET file_id = (SELECT f.id FROM files f WHERE
          f.workspace_id = embeddings.workspace_id AND f.path =
          embeddings.path) WHERE file_id IS NULL (works only if files rows
          exist by then - rows still NULL after backfill get populated by
          the next reindex); CREATE UNIQUE INDEX
          idx_embeddings_ws_file_chunk ON embeddings(workspace_id,
          file_id, chunk_index). Column stays nullable (SQLite ALTER
          limitation); new writes always set it.
       2. fileRegistry.ts: add ensureFileId(workspaceId, path) - returns
          existing id or registers the file on the spot (covers the race
          where reEmbedPaths fires before the debounced registry sync
          sees a brand-new file).
       3. embeddingStore.ts: replaceEmbeddings signature becomes
          (workspaceId, fileId, path, inserts, model). DELETE FROM
          embeddings WHERE workspace_id = $1 AND (path = $2 OR file_id =
          $3) - the OR handles registry renames (old path, old id) and
          normal re-embeds (same id). INSERTs carry both file_id and path
          (path column kept: retrieval.ts displays it). selectEmbeddings
          unchanged.
       4. indexing.ts: embedFile resolves fileId = ensureFileId(...)
          before replaceEmbeddings; indexWorkspace starts with a full
          DELETE FROM embeddings WHERE workspace_id = $1 (a full reindex
          rebuilds everything, and this clears rows orphaned by
          renames/deletes that reEmbedPaths never touches).
       Files/symbols: src-tauri/src/lib.rs, src/lib/fileRegistry.ts,
       src/lib/ai/embeddingStore.ts, src/lib/ai/indexing.ts
       Verify: npx tsc --noEmit; npm run build; manual dev run:
       reindex a workspace, then SELECT e.file_id, e.chunk_index,
       f.path FROM embeddings e JOIN files f ON f.id = e.file_id -
       expect non-NULL file_id on all rows after reindex. -->
  <!-- executed 2026-10-02: implemented as mini-planned (migration 4,
       ensureFileId, replaceEmbeddings by file_id with path-OR-id delete,
       full-reindex wipe). Deviation: none in scope. Typecheck and build
       green; manual reindex-join check left to user on next dev run. -->
  <!-- original scope note (superseded by mini-plan above):
       Steps: add file_id FK to embeddings (migration 4), populate during
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
