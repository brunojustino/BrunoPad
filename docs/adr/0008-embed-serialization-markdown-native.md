# Embed serialization: markdown-native references, geometry in the DB

BlocksToMarkdownLossy in BlockNote 0.55 strips the width attribute from
`<img>` and drops unknown elements like `<iframe>` entirely (verified in
`@blocknote/core/src/api/exporters/markdown/htmlToMarkdown.ts`), so the
HTML-in-markdown approach of ADR 0007 cannot persist embed dimensions.
Supersedes ADR 0007's serialization decision; its other decisions carry
over unchanged. Embeds are serialized as standard markdown distinguished
by file extension at parse time: images and PDFs as `![name](assets/x)`,
doc/docx as plain links `[name](assets/x.docx)`. Presentation geometry
(width/height per embed) lives in a new `embed_geometry` table keyed by
`(files.id, asset_path as referenced)` - the file registry's first
metadata use - applied to blocks on load and upserted on save.

## Considered options

- Patching/overriding BlockNote's markdown exporter (fragile on upgrades).
- Accepting lossy resize (defeats the resizable requirement).
- BlockNote JSON sidecars next to md files (abandons markdown-first).
- HTML-in-markdown (ADR 0007) - factually broken by the 0.55 exporter.

## Consequences

- Markdown files stay standard and fully portable; only presentation
  metadata lives in the DB and is re-derivable (missing rows render at
  natural/default size).
- Renaming an md file gets a new registry id (delete+insert), so its
  geometry rows are orphaned - same v1 limitation as embed links.
- Hand-edited equivalent paths (e.g. `./assets/x.png`) won't match the
  geometry key and render at default size.
