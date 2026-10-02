use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let migrations = vec![Migration {
    version: 1,
    description: "create_core_tables",
    sql: "
    CREATE TABLE user_workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE pane_layouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL REFERENCES user_workspaces(id) ON DELETE CASCADE,
      layout TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL REFERENCES user_workspaces(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (workspace_id, path)
    );
  ",
    kind: MigrationKind::Up,
  }, Migration {
    version: 2,
    description: "create_ai_settings",
    sql: "
    CREATE TABLE ai_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  ",
    kind: MigrationKind::Up,
  }, Migration {
    version: 3,
    description: "create_embeddings",
    sql: "
    CREATE TABLE embeddings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL REFERENCES user_workspaces(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      text TEXT NOT NULL,
      embedding TEXT NOT NULL,
      model TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (workspace_id, path, chunk_index)
    );
  ",
    kind: MigrationKind::Up,
  }, Migration {
    version: 4,
    description: "embeddings_file_id",
    sql: "
    ALTER TABLE embeddings ADD COLUMN file_id INTEGER REFERENCES files(id);
    UPDATE embeddings SET file_id = (
      SELECT f.id FROM files f
      WHERE f.workspace_id = embeddings.workspace_id AND f.path = embeddings.path
    ) WHERE file_id IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_embeddings_ws_file_chunk
      ON embeddings (workspace_id, file_id, chunk_index);
  ",
    kind: MigrationKind::Up,
  }];

  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:brunopad.db", migrations)
        .build(),
    )
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
