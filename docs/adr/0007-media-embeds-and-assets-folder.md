# Media embeds: HTML-in-markdown via custom blocks, assets/ convention, workspace-scoped serving

Status: superseded by ADR-0008 (serialization decision only; assets/
convention, copy semantics and workspace-scoped serving remain valid).

Brunopad documents are plain markdown, so media embeds (image, PDF,
doc/docx) are serialized as HTML in the markdown - the native BlockNote
image block is rejected because its width is lost in markdown export -
using one custom-block pattern whose HTML attribute dimensions survive
editor round-trips; references are relative to the md file (`assets/…`).
Media is always copied into the User workspace: loose inserts go to the
active file's folder or `{dir}/assets/` (dialog choice, remembered),
pasted screenshots and the keep-it-clean flow go to `{workspace}/assets/`,
never overwriting (collision -> `name-1.ext`). Files are served to the
webview by a custom Rust protocol handler restricted to the current User
workspace; asset-protocol `**/*` scope is rejected as it would expose the
whole disk to the webview.

## Considered options

- Native BlockNote image block (width lost on save), pdf.js-only (heavier
  than needed if the webview renders PDFs natively), wiki-style
  `![[file]]` embeds (non-standard), absolute references (fragile).
- `assetProtocol.scope: ["**/*"]` - rejected: disk-wide exposure.

## Consequences

- Files stay readable in other editors that tolerate HTML-in-markdown.
- In-editor docx rendering is deferred; the chip opens in the system viewer.
- v1: moving/renaming md files breaks embed links until a future
  registry-link-based rewrite feature.
