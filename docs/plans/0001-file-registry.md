<!-- owt:start -->
# Plan: File registry in DB

Status: draft
Runtime: host-waived
Origin: grill session (media-embeds design) 2026-10-02
Spec: -

## Tasks

Ordered; "Blocked by" lists task numbers that must finish first.

- [ ] 1. Registry lifecycle on scan and watcher events
  Blocked by: -
  <!-- mini-plan filled at execution time:
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
