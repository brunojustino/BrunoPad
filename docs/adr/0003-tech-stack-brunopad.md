# Tech stack: Tauri 2.0 + React/TS/Tailwind + BlockNote + react-mosaic

brunopad is a local markdown-first desktop editor with a cross-platform
trajectory (desktop now, Android/Web later); this dictates Tauri 2.0
(Rust) with core plugins (fs, dialog, sql) over Electron, and a
React/TypeScript/Tailwind frontend. BlockNote is chosen over TipTap for
out-of-the-box block drag-and-drop, Notion-style slash menus, and native
markdown import/export - the editor's I/O contract is raw .md
round-tripping. Pane management uses react-mosaic-component (rather
than a hand-rolled recursive flex/grid) because its binary tree already
models VS Code-style edge-splitting and natively serializes to JSON,
which persists to SQLite. Persistence is SQLite via
@tauri-apps/plugin-sql: workspaces, pane layouts (JSON tree), file
metadata, AI embeddings.

Status: accepted

## Considered options

- react-mosaic-component vs custom recursive flex/grid: the custom layout
  state must reimplement edge-split hit-testing, clone-aware drag, and
  serialization by hand; react-mosaic-component ships all three. Decided
  2026-10-01 after grill session with user.
- Electron (rejected: no mobile trajectory), TipTap raw (rejected:
  block-level UX must be built by hand).

## Consequences

- Alternatives to this stack (Electron, TipTap raw, hand-rolled panes)
  require superseding this ADR, not per-task rationalization.
- Ambient capability: rust-toolchain.toml / package.json pins are the
  reproducibility contract (see ADR-0004 host waiver).
