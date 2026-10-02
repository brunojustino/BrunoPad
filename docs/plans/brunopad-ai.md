<!-- owt:start -->
# Plan: brunopad AI integration

Status: approved
Runtime: host-waived
<!-- When the last task is ticked, set Status: done and move this file to
     docs/plans/history/ in the same commit (archived plans are read-only records). -->
Origin: brunopad-mvp tasks 11-12 + user decisions 2026-10-02 (OpenRouter
first; Ollama/LM Studio as local presets; keyring key storage)
Spec: docs/spec/product-brief.md
Stack decisions: ADR-0006 (dockview panes); provider architecture per
Notes below.

## Provider architecture (settled)

All three providers expose OpenAI-compatible endpoints, so one provider
abstraction covers them: base URL + optional API key + chat model +
embedding model. Presets:

- `openrouter`: https://openrouter.ai/api/v1, key required (OS keychain),
  default chat model user-picked, default embedding model
  `openai/text-embedding-3-small` (1536d)
- `ollama`: http://localhost:11434/v1, no key, embedding model
  `nomic-embed-text` (768d) assumed present
- `lmstudio`: http://localhost:1234/v1, no key, models as loaded by the
  user

Cosine similarity is only computed across chunks embedded by the SAME
model (model stored per row).

## Tasks

Ordered; "Blocked by" lists task numbers that must finish first.

- [x] 1. Provider settings + API key storage + chat panel shell
  Blocked by: -
  <!-- mini-plan filled at execution time:
       Steps:
       1. Cargo: keyring = "3" in src-tauri/Cargo.toml (service
          "brunopad", account = provider id). Commands in lib.rs:
          ai_get_secret(name), ai_set_secret(name, secret),
          ai_delete_secret(name); register via generate_handler.
       2. Migration v2 in lib.rs:
          CREATE TABLE ai_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
          );
          (non-secret config only: provider, baseUrl, chatModel,
          embeddingModel; the key itself lives in the OS keychain)
       3. src/lib/ai/settings.ts: AiProviderConfig type +
          getProviderConfig() (SELECTs ai_settings, falls back to the
          openrouter preset) + setProviderConfig(patch) +
          getApiKey/setApiKey/clearApiKey via invoke -> keyring.
       4. src/components/chat/ChatPanel.tsx: panel shell with a
          settings form (provider select [OpenRouter/Ollama/LM Studio],
          base URL prefilled per preset, chat model, embedding model,
          API key field shown only for openrouter; save persists
          config to ai_settings + key to keychain, then switches to
          the empty chat view).
       5. App.tsx: register the 'chat' component; open the chat panel
          docked right (addPanel position 'right') via a small "AI"
          button in the header.
       Files: src-tauri/Cargo.toml, src-tauri/Cargo.lock,
       src-tauri/src/lib.rs, src/lib/ai/settings.ts,
       src/components/chat/ChatPanel.tsx, src/App.tsx
       Verify:
       - npm run build -> exit 0
       - cargo check (PATH prefix) -> exit 0
       - runtime smoke (user-run): open chat panel -> settings form ->
            save key (openrouter) -> restart -> config + key presence
            restored; key NOT in SQLite (inspect brunopad.db) -->
- [x] 2. Chunk + embed pipeline: workspace .md -> chunks -> embeddings table
  Blocked by: 1
  <!-- mini-plan filled at execution time:
       Steps:
       1. Migration v2 in lib.rs (same migration as task 1's
          ai_settings table):
          CREATE TABLE embeddings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id INTEGER NOT NULL REFERENCES user_workspaces(id)
              ON DELETE CASCADE,
            path TEXT NOT NULL,
            chunk_index INTEGER NOT NULL,
            text TEXT NOT NULL,
            embedding TEXT NOT NULL,
            model TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE (workspace_id, path, chunk_index)
          );
       2. src/lib/ai/chunking.ts: split markdown into chunks -
          heading-aware (split on ATX headings), then paragraph-join
          under a ~2000-char cap; no overlap (MVP).
       3. src/lib/ai/embeddings.ts: embedTexts(texts) -> POST
          {baseUrl}/embeddings (batch input, Authorization only when
          key present); embedFile(path): read -> chunk -> embed ->
          store (DELETE rows for path, INSERT chunks).
       4. ChatPanel: "Index workspace" button -> walk workspace .md
          files (recursive over readDirEntries) -> embedFile each with
          progress text; skip non-.md.
       5. Watcher re-embed: on watcher event, re-embedFile the changed
          path (debounced 1s); markSelfWrite() guards against
          self-write loops.
       Files: src-tauri/src/lib.rs, src/lib/ai/chunking.ts,
       src/lib/ai/embeddings.ts, src/components/chat/ChatPanel.tsx,
       src/App.tsx
       Verify:
       - npm run build -> exit 0
       - cargo check (PATH prefix) -> exit 0
       - runtime smoke (user-run): Index workspace -> embeddings rows
            exist for each .md (inspect brunopad.db); edit a file
            externally -> its rows refresh ~1s -->
- [ ] 3. Retrieval + streaming chat answer with sources
  Blocked by: 2
  <!-- mini-plan filled at execution time:
       Steps:
       1. src/lib/ai/retrieval.ts: retrieveContext(question, k=5):
          embed question (same model as stored rows) -> SELECT all
          embeddings for workspace with that model -> cosine in JS ->
          top-k [{path, chunkIndex, text, score}].
       2. src/lib/ai/chat.ts: streamChat(messages, onDelta): POST
          {baseUrl}/chat/completions stream:true; parse SSE chunks
          (data: ... / [DONE]) -> invoke onDelta per token. System
          prompt: answer from the provided context only; context
          blocks prefixed with their source path.
       3. ChatPanel chat view: message list (user/assistant), input
          box (Enter sends), assistant bubble streams deltas; below
          each answer, list the source paths used. Errors shown
          inline.
       Files: src/lib/ai/retrieval.ts, src/lib/ai/chat.ts,
       src/components/chat/ChatPanel.tsx
       Verify:
       - npm run build -> exit 0
       - cargo check (PATH prefix) -> exit 0
       - runtime smoke (user-run): ask about workspace content ->
            answer streams in and cites real files; empty workspace
            index -> graceful "no context" behavior -->
- [ ] 4. Ghost-text autocomplete on typing pause
  Blocked by: 3
  <!-- mini-plan filled at execution time:
       Steps:
       1. src/lib/ai/ghost.ts: on typing pause (800ms without input,
          cursor not mid-word at start), POST chat completions
          (stream:false, small/fast model, max_tokens ~48) with the
          markdown tail as prompt -> single-line suggestion.
       2. Render the suggestion as dimmed inline text after the
          cursor (prosemirror decoration or a positioned overlay -
          pick during implementation, keep it out of the doc state);
          Tab accepts (insert at cursor), Escape/typing dismisses,
          another keystroke restarts the pause timer.
       3. Cache/in-flight guard: one request at a time, latest wins.
       Files: src/lib/ai/ghost.ts, src/components/MarkdownEditor.tsx
       Verify:
       - npm run build -> exit 0
       - cargo check (PATH prefix) -> exit 0
       - runtime smoke (user-run): pause typing mid-sentence ->
            ghost text appears -> Tab inserts; Escape dismisses;
            nothing is written to the .md until accepted -->

## Notes

Deviations, settled terminology (also mirrored to CONTEXT.md), ADRs produced.

- Task 2 (2026-10-02): deviation - the embeddings table lands as
  migration v3 (task 1 already shipped v2 for ai_settings). Watcher
  re-embed lives in App.tsx (debounced 1s over WatchEvent.paths);
  watcher.ts's callback now passes changed paths through. Embedding
  requests batch 16 chunks per POST. Re-embed skips silently when no
  key is configured (openrouter without OPENROUTER_API_KEY). Verify:
  `npm run build` green, `cargo check` green. Runtime smoke pending
  user run.
- Task 1 (2026-10-02): deviation (user decision) - no keyring/keychain
  storage yet; the OpenRouter key is read from `.env`
  (`OPENROUTER_API_KEY`, exposed via `loadEnv` + `define` in
  vite.config.ts, not a `VITE_`-prefixed var). Keychain storage is
  deferred to a pre-release task; the settings form shows the key's
  presence read-only instead of an editable field. Default chat model
  preset is `stealth/space-bunny-alpha` (user-picked, still editable).
  The chat component is registered in PaneArea.tsx (dockview's
  component map lives there); App.tsx only adds the "AI" header button.
  Verify: `npm run build` green, `cargo check` green. Runtime smoke
  pending user run.
- Planning (2026-10-02): OpenRouter embeddings endpoint confirmed live
  (OpenAI-compatible, e.g. openai/text-embedding-3-small); Ollama and LM
  Studio also speak OpenAI-compatible /v1 - hence the single
  base-url+key provider abstraction above. MVP calls APIs from the
  frontend (fetch/SSE streaming is trivial there); key is fetched from
  the keychain into JS memory per session - the more principled
  Rust-side HTTP proxy is deferred (revisit before release). ADR
  candidate if the provider abstraction or key handling surprises a
  future reader.
<!-- owt:end -->
