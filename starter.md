Master Prompt for Local Agent

System Role: You are an expert application engineer specializing in React, TypeScript, Rust, and modern cross-platform frameworks. We are building a "Super-Powered Text Editor"—a local markdown-first desktop application with advanced block-level editing, customizable tiling pane layouts, and AI capabilities.

Tech Stack (Strictly Enforced):

    Shell/Backend: Tauri 2.0 (Rust) - Crucial for future Android/Web deployment. Use Tauri 2.0 plugins (e.g., @tauri-apps/plugin-fs, @tauri-apps/plugin-dialog, @tauri-apps/plugin-sql).

    Frontend: React, TypeScript, Tailwind CSS.

    Editor Core: BlockNote - Use this specifically over TipTap because it provides out-of-the-box block-level drag-and-drop, Notion-style slash menus, and native Markdown import/export functions.

    Pane Management: A tiling window library like react-mosaic-component or a robust recursive flex/grid layout state.

    Database: SQLite via @tauri-apps/plugin-sql (for layout persistence, AI embeddings, and workspace metadata).

    AI: External API integration (OpenAI/Anthropic) for chat, RAG, and inline autocomplete.

Execution Plan:
Please build this application strictly phase-by-phase. Do not move to the next phase until the current one is fully functional.

Phase 1: Scaffolding & Native Integration

    Initialize the Tauri 2.0 application with React and TypeScript.

    Install and configure Tauri 2.0 core plugins: dialog (for folder selection), fs (for reading/writing), and sql (for local database).

    Set up the local SQLite database instance that the frontend can read/write to. Create the initial schema: Workspaces (path), Layouts (JSON representation of pane grids), and Files (metadata).

    Build a native folder-picker dialog button on the UI to let the user select a workspace directory and persist this path in the database.

Phase 2: Explorer & File System

    Build a Left Sidebar (Explorer) to display a recursive tree of the selected workspace directory.

    Implement file system watchers using Tauri so the UI updates automatically if files are added or removed externally.

    Implement basic CRUD operations: right-click to create, rename, or delete .md files and folders directly from the sidebar.

Phase 3: The Tiling Pane Layout (UI Level Dragging)

    Implement the main workspace area as a tiling layout system (columns and rows).

    Allow users to click or drag a file from the explorer into the main area to open it.

    Implement VS Code-style splitting: dragging a file tab to the edges (top, bottom, left, right) of an existing pane should split the pane and create a new column/row.

    Serialize and persist this layout tree structure continuously to the SQLite database so the precise UI layout restores perfectly upon app restart.

Phase 4: The Block-Based Editor (Content Level Dragging)

    Mount the BlockNote editor inside the active panes.

    Implement seamless I/O: The editor must parse raw .md files from disk into structured blocks on load (using BlockNote's markdown parsing), and serialize blocks back to raw .md to save to disk.

    Ensure BlockNote's native block-dragging (hovering over paragraphs/lists to move them) and markdown auto-formatting (slash commands, # for headings) are functioning properly.

Phase 5: AI Integration

    Chatting with Files: Implement a collapsible right-sidebar chat interface. Create a lightweight system to chunk and embed local markdown files (storing embeddings in SQLite) so the external API can answer questions accurately based on workspace context.

    Autocomplete: Implement ghost-text autocomplete in the editor that triggers a completion endpoint when the user pauses typing.

Instructions for Immediate Action:
We will begin with Phase 1. Please scaffold the project using the Tauri CLI, configure the required Tauri 2.0 plugins (fs, dialog, sql), and write the initial React code for the directory picker and SQLite initialization. Provide the exact commands to run and the initial code structure.