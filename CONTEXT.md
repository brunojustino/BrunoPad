# Context

brunopad: a local, markdown-first desktop text editor with tiling panes
and AI assistance, built by agents in controlled approval-cycle tasks.

## Language

<!-- Terms appear here one by one as grill-with-docs / domain-modeling sessions resolve them.
     Format:

**Term**:
A one or two sentence definition of what it IS.
_Avoid_: alternative words used for the same thing

Keep it pure vocabulary: no implementation details, no specs. Only terms specific to this project's domain - not general programming concepts. -->

**Archived plan**:
A finished plan moved from `docs/plans/` to `docs/plans/history/`; a read-only record that is never re-opened - new work means a new plan.
_Avoid_: "old plan", "closed plan".

**User workspace**:
The local folder the user selects inside the app to work in; its path is persisted in the app database.
_Avoid_: "project directory" (ambiguous with repo), "workspace" alone (collides with agent "Workspace root").

**Pane**:
A tiling region of the main area displaying one open file's editor.
_Avoid_: "split", "editor instance".

**Pane layout**:
The binary-tree arrangement of panes and rows/columns for a user workspace, serialized to JSON and persisted; restored on app launch.
_Avoid_: "grid state", "window layout".

**Workspace root**:
The directory opencode was started in; the boundary agents may not read, write, or search beyond without explicit user permission.
_Avoid_: "project directory", "user directory" (ambiguous between repo and home).
