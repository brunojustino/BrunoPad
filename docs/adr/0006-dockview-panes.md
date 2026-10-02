# Pane management: dockview, not react-mosaic

react-mosaic-component hardwires react-dnd 16, which is unmaintained and
broken on React 19 (issue #3675: the DnD monitor reports `isDragging` false
during downward drags - in practice BlockNote block drags fail downwards,
mosaic pane drags never split, and react-dnd's document-level HTML5 backend
cancels native drags it doesn't recognize, killing sidebar file drags).
Dockview 8.4.0 replaces it: zero dependencies (no react-dnd), peer-supports
React 19, serializes layouts natively (`toJSON`/`fromJSON`, still persisted
to SQLite's pane_layouts), and handles external HTML5 drags natively
(`onUnhandledDragOver` accept + `onDidDrop`), which gives VS Code-style
file-drop splitting that react-mosaic never offered.

Status: accepted (2026-10-02) - supersedes the react-mosaic portion of
ADR-0003; the rest of ADR-0003's stack stands unchanged.

## Considered options

- React downgrade to 18.3.1 (rejected: keeps an unmaintained drag library
  as a load-bearing dependency; only fixes the known bug).
- @dnd-kit/react custom panes (rejected: dnd-kit provides drag primitives
  only - splitting, resize, serialization all hand-rolled, the exact
  "custom pane code" ADR-0003 rejected).
- dockview-react (chosen: full docking model, external-drag API, active
  maintenance).

## Consequences

- react-mosaic-component and react-dnd disappear from the dependency tree.
- The saved `pane_layouts.layout` JSON shape changes from mosaic's
  `{ tree, panes }` to dockview's serialized layout; old saved layouts are
  discarded on load failure (reset to empty).
- Splitting is now available by dropping panels AND external file drags on
  pane edges; dropping on a tab bar groups panels as tabs.
