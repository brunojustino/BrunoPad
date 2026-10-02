<!-- owt:start -->
# Plan: Media embeds

Status: draft
Runtime: host-waived
Origin: grill session 2026-10-02
Spec: -

## Tasks

Ordered; "Blocked by" lists task numbers that must finish first.

- [x] 1. Serving pipeline for workspace files: custom Rust protocol handler
  Blocked by: -
  <!-- mini-plan (2026-10-02):
       Steps:
       1. src-tauri/src/lib.rs:
          - Managed state Mutex<Option<PathBuf>> holding the canonical
            media root (the current User workspace).
          - Command set_media_root(path): std::fs::canonicalize both sides
            consistently, store in state.
          - register_uri_scheme_protocol("media", ...): parse the request
            URI path (WebView2 serves custom protocols as
            http://media.localhost/<path>), percent-decode it (small
            hand-rolled decoder, no new crate), canonicalize, reject
            unless it starts_with the registered root (blocks .. escape),
            stream the file with a content-type guessed from the
            extension (png/jpg/gif/webp/svg/bmp/ico/pdf/txt/mp4/mp3/wav/ogg,
            default application/octet-stream), CORS header *, 404/403
            on failure.
          - No tauri.conf.json change: csp is null and assetProtocol stays
            untouched (ADR 0007).
       2. src/lib/mediaProtocol.ts: setMediaRoot(path) -> invoke("set_media_root"),
          mediaUrl(filePath) -> convertFileSrc(filePath, "media").
       3. App.tsx: effect on workspace -> void setMediaRoot(workspace.path)
          (both attach paths: initial load and pickWorkspace flow through
          the workspace state).
       4. PDF spike (manual): open devtools in a dev run, render
          <iframe src={mediaUrl(some.pdf)}> in a test doc; record result
          in this plan's Notes - iframe works (task 2 keeps markup) or
          pdf.js fallback required.
       Files/symbols: src-tauri/src/lib.rs, new src/lib/mediaProtocol.ts,
       src/App.tsx
       Verify: cargo check (src-tauri), npx tsc --noEmit, npm run build;
       manual dev run: fetch(mediaUrl(<workspace image>)) returns 200 with
       image content-type;        mediaUrl(<path outside workspace>) returns 403;
       PDF spike outcome recorded. -->
  <!-- executed 2026-10-02: implemented as mini-planned (MediaRoot state +
       set_media_root command + media:// protocol handler in lib.rs,
       mediaProtocol.ts, App.tsx effect). Deviation: none in scope; cargo
       check, typecheck, build green. Manual parts pending user dev run:
       200/403 fetch checks and the PDF iframe spike - outcome to be
       recorded in Notes. -->
  <!-- original scope note (superseded by mini-plan above):
       Steps: register custom protocol handler in src-tauri/src/lib.rs;
       serve only paths under the current User workspace root. Include a
       spike: does WebView2 render PDFs in an iframe? (yes -> iframe;
       no -> pdf.js fallback, per ADR 0007)
       Files/symbols: src-tauri/src/lib.rs, tauri.conf.json (if asset reuse)
       Verify: npm run tauri dev; image + pdf from two workspace paths load
       via the handler; record whether PDF renders in webview or fallback. -->
- [ ] 2. Custom block schema: image, pdf frame, doc attachment chip
  Blocked by: 1
  <!-- Steps: BlockNoteSchema with three custom blocks: resizable image
       (serializes <img src width>), pdf frame (embed markup + dims),
       doc chip (opens in system viewer). Draft plan: HTML-in-markdown
       serialization, refs relative to md file (ADR 0007).
       Files/symbols: new src/lib/editor/embedBlocks.tsx, MarkdownEditor.tsx
       Verify: typecheck + dev run; insert each kind, resize, save, reload:
       src and dimensions survive round-trip. -->
- [ ] 3. Copy-on-insert with destinations and collision renaming
  Blocked by: 2
  <!-- Steps: copy picked file to destination (same folder /
       {md dir}/assets/ / {workspace}/assets/); auto-rename name-1.ext on
       collision; register the new asset in the files table (plan 0001).
       Files/symbols: new src/lib/editor/mediaInsert.ts
       Verify: insert a file from outside the workspace twice: second insert
       gets -1 suffix, no overwrite anywhere. -->
- [ ] 4. Insert UX: slash menu + destination selector dialog
  Blocked by: 3
  <!-- Steps: slash-menu item opens dialog with destination selector
       (same folder / next-to-file assets / workspace assets), default
       from setting + remember last-used; insert point = cursor block if
       empty else new block below.
       Files/symbols: embedBlocks.tsx (slash menu), new dialog component,
       settings keys following src/lib/ai/settings.ts pattern
       Verify: dev run; each destination lands the file correctly; the
       last-used destination is remembered across restart. -->
- [ ] 5. Paste-screenshot via ctrl+v
  Blocked by: 2
  <!-- Steps: intercept paste in editor; if clipboard has image data, save
       PNG to {workspace}/assets/ as screenshot-YYYYMMDD-HHMMSS.png, insert
       image block; no destination dialog. Loose md files (outside the
       workspace): fallback to assets next to the file.
       Files/symbols: src/components/MarkdownEditor.tsx, mediaInsert.ts
       Verify: screenshot -> ctrl+v in a workspace doc and a loose doc:
       lands in {workspace}/assets and {file dir}/assets respectively. -->
- [ ] 6. Drag-and-drop from Explorer
  Blocked by: 3
  <!-- Steps: Tauri onDragDropEvent or webview drop handler; dropped files
       go through the same mediaInsert.ts path as the dialog flow.
       Deliberately a later task in the plan (session decision), not the
       first tracer bullet.
       Files/symbols: src/components/MarkdownEditor.tsx, mediaInsert.ts
       Verify: drop an image and a pdf onto the editor: copy + insert
       behave like the dialog flow. -->
- [ ] 7. Docs updates
  Blocked by: 6
  <!-- Steps: tick tasks as completed; product-brief media section;
       CONTEXT.md terms are already added (Media embed, Assets folder,
       File registry). Verify all green, then archive to docs/plans/history/
       in the same commit (per plan-template).
       Verify: plan fully ticked, archived. -->

## Notes

- Serialization: HTML-in-markdown for all three kinds; references relative
  to the md file. Native BlockNote image block rejected because its width
  would be lost in blocksToMarkdownLossy (ADR 0007).
- Copy-always semantics; collision rename `name-1.ext`; never overwrite.
- Destinations: same folder / {md dir}/assets/ / {workspace}/assets/;
  paste always -> {workspace}/assets/; loose md fallback -> assets next
  to the file.
- Saved doc/docx renders as attachment chip opening in the system viewer;
  in-editor display deferred, candidate approach docx->HTML conversion.
- Known v1 limitation: md move/rename breaks embed links (dead refs, files
  intact); rewriting deferred until the registry link graph exists.
<!-- owt:end -->
