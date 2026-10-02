<!-- owt:start -->
# Plan: SOLID refactor — module split

Status: approved
Runtime: host-waived
Origin: user request 2026-10-02 ("better split the code, SOLID");
MarkdownEditor extraction added by user approval same day.
Constraint: zero behavior change — every task must pass the existing
verify steps; no ADR reversals (stack per ADR-0003, panes per ADR-0006).

## Guiding principles

- Each task is a pure re-organization: same behavior, same UX.
- Split by change-reason (SRP), not by file-size arithmetic.
- Seams first where parked decisions will land (keychain key storage,
  Rust-side HTTP proxy) — that's OCP/DIP, not speculative abstraction.

## Tasks

Ordered; "Blocked by" lists task numbers that must finish first.

- [x] 1. AI module split: client / store / service
  Blocked by: -
  <!-- mini-plan filled at execution time:
       Steps:
       1. src/lib/ai/aiHttpClient.ts: aiPostJson(config, path, body,
          errorLabel) -> builds headers (Authorization when key present),
          throws on !res.ok, returns the Response. All three fetch
          sites (embedTexts, streamChat, requestGhostText) consume it.
       2. src/lib/ai/embeddingClient.ts: embedTexts(texts, config) via
          aiPostJson (batch parse + index sort stays here).
       3. src/lib/ai/embeddingStore.ts: selectEmbeddings(workspaceId,
          model) + replaceEmbeddings(workspaceId, path, inserts, model)
          (DELETE+INSERT loops live only here).
       4. src/lib/ai/indexing.ts: embedFile, indexWorkspace,
          reEmbedPaths move here as the orchestration service;
          embeddings.ts deleted; imports updated in retrieval.ts,
          ChatPanel.tsx, App.tsx.
       Verify:
       - npm run build -> exit 0
       - cargo check (PATH prefix) -> exit 0
       - runtime smoke (user-run): Index workspace + ask question
            still streams with sources -->

- [x] 2. Secret source seam (Open/Closed prep for keychain)
  Blocked by: -
  <!-- mini-plan filled at execution time:
       Steps:
       1. src/lib/ai/secretSource.ts: interface SecretSource
          { get(providerId: AiProviderId): string }; envSecretSource
          implementation reads import.meta.env.OPENROUTER_API_KEY.
       2. AI_PROVIDER_PRESETS entries carry a secretSource field;
          getApiKey(provider) becomes a thin dispatch over presets.
       3. Adding keychain later = new SecretSource impl, no edits to
          consumers (the parked pre-release task becomes additive).
       Verify:
       - npm run build -> exit 0
       - cargo check -> exit 0
       - runtime smoke (user-run): openrouter chat still authenticates -->

- [x] 3. ChatPanel split (SRP)
  Blocked by: 1
  <!-- mini-plan filled at execution time:
       Steps:
       1. src/components/chat/SettingsForm.tsx (moved as-is).
       2. src/lib/ai/prompt.ts: buildSystemPrompt (pure, testable).
       3. src/components/chat/useChatSession.ts: messages state, send()
          (retrieve -> prompt build -> stream -> sources attach),
          streaming/error state.
       4. src/components/chat/ChatMessages.tsx: bubble list + sources +
          autoscroll. ChatPanel becomes a <100-line composition root
          (toolbar + view switch).
       Verify:
       - npm run build -> exit 0
       - cargo check -> exit 0
       - runtime smoke (user-run): settings save, ask, index unchanged -->

- [x] 4. App.tsx decomposition (SRP)
  Blocked by: -
  <!-- mini-plan filled at execution time:
       Steps:
       1. src/lib/panels.ts: openMarkdownPanel(api, path),
          openChatPanel(api), and FILE_MIME moved here (FileTree +
          PaneArea consume the shared constant - dedupe).
       2. src/lib/useWorkspaceWatcher.ts: watch + tree-version bump +
          1s-debounced re-embed scheduling (moves the AI logic out of
          the app root into the AI layer's consumer hook).
       3. App.tsx keeps only composition: workspace state, layout
          wiring, header UI.
       Verify:
       - npm run build -> exit 0
       - cargo check -> exit 0
       - runtime smoke (user-run): open file, chat button, external
            edit re-embeds ~1s, layout restores after restart -->

- [ ] 5. FileTree split (SRP)
  Blocked by: -
  <!-- mini-plan filled at execution time:
       Steps:
       1. src/lib/useFileTreeData.ts: entries/cache/expanded state +
          refreshChildren + CRUD error handling.
       2. src/components/filetree/EntryRow.tsx + DraftRow.tsx.
       3. FileTree.tsx = composition root (~60 lines).
       Verify:
       - npm run build -> exit 0
       - cargo check -> exit 0
       - runtime smoke (user-run): expand/collapse, create/rename/
            delete, drag to pane still work; folders stay expanded
            after CRUD -->

- [ ] 6. MarkdownEditor extraction (SRP)
  Blocked by: 4
  <!-- mini-plan filled at execution time:
       Steps:
       1. src/lib/useFileContent.ts: file load (read -> parse ->
          replaceBlocks) + debounced save (blocksToMarkdownLossy ->
          writeTextFile + markSelfWrite) + loaded/error state, extracted
          from MarkdownEditor.tsx.
       2. MarkdownEditor.tsx keeps editor UI + ghost overlay wiring.
       Verify:
       - npm run build -> exit 0
       - cargo check -> exit 0
       - runtime smoke (user-run): open file, edit, auto-save debounce,
            external edit still re-embeds; ghost text still works -->

## Notes

Deviations, settled terminology, ADRs produced.

- Task 4 (2026-10-02): no deviations. nameFromPath moved from
  PaneArea.tsx into lib/panels.ts (pane-panel concern); FILE_MIME now
  exported from panels.ts and consumed by FileTree + PaneArea. App.tsx
  ~155 lines, zero AI/watcher imports.
  Verify: `npm run build` green, `cargo check` green. Runtime smoke
  pending user run.
- Task 3 (2026-10-02): no deviations. ChatUiMessage lives in
  useChatSession.ts; inline chat error moved to a row between messages
  and the composer (same visibility). ChatPanel now ~100 lines.
  Verify: `npm run build` green, `cargo check` green. Runtime smoke
  pending user run.
- Task 2 (2026-10-02): no deviations. envSecretSource still maps
  openrouter -> import.meta.env.OPENROUTER_API_KEY internally; presets
  carry their SecretSource; getApiKey is a one-line preset dispatch.
  Verify: `npm run build` green, `cargo check` green. Runtime smoke
  pending user run.
- Task 1 (2026-10-02): no deviations. Error labels preserved at each
  call site via aiPostJson's errorLabel param ("embeddings request",
  "chat request", "ghost request"). Verify: `npm run build` green,
  `cargo check` green. Runtime smoke pending user run.
- LSP/ISP: no class hierarchies or fat interfaces exist; nothing to do.
- Deliberately NOT creating a global repository layer over getDb():
  thin-client SQLite access is the accepted shape (product brief);
  a repo-per-table abstraction would be speculative.
- No new ADRs required; ADR-0006 dockview decision untouched.
<!-- owt:end -->
