use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{http::Response, Manager};
use tauri_plugin_sql::{Migration, MigrationKind};

struct MediaRoot(Mutex<Option<PathBuf>>);

#[tauri::command]
fn set_media_root(path: String, state: tauri::State<MediaRoot>) {
  let root = fs::canonicalize(&path).unwrap_or_else(|_| PathBuf::from(&path));
  *state.0.lock().unwrap() = Some(root);
}

fn percent_decode(input: &str) -> String {
  let bytes = input.as_bytes();
  let mut out = Vec::with_capacity(bytes.len());
  let mut i = 0;
  while i < bytes.len() {
    if bytes[i] == b'%' && i + 2 < bytes.len() {
      if let Ok(v) = u8::from_str_radix(&input[i + 1..i + 3], 16) {
        out.push(v);
        i += 3;
        continue;
      }
    }
    out.push(bytes[i]);
    i += 1;
  }
  String::from_utf8_lossy(&out).into_owned()
}

fn guess_mime(path: &str) -> &'static str {
  let ext = path.rsplit('.').next().unwrap_or("").to_ascii_lowercase();
  match ext.as_str() {
    "png" => "image/png",
    "jpg" | "jpeg" => "image/jpeg",
    "gif" => "image/gif",
    "webp" => "image/webp",
    "svg" => "image/svg+xml",
    "bmp" => "image/bmp",
    "ico" => "image/x-icon",
    "pdf" => "application/pdf",
    "txt" => "text/plain",
    "md" => "text/markdown",
    "mp4" => "video/mp4",
    "mp3" => "audio/mpeg",
    "wav" => "audio/wav",
    "ogg" => "audio/ogg",
    _ => "application/octet-stream",
  }
}

fn serve_media_file(
  root: Option<PathBuf>,
  uri_path: &str,
) -> Response<Vec<u8>> {
  let not_found = |status: u16, msg: &'static str| {
    Response::builder()
      .status(status)
      .header("Access-Control-Allow-Origin", "*")
      .body(msg.as_bytes().to_vec())
      .unwrap()
  };
  let Some(root) = root else {
    return not_found(403, "media root not set");
  };
  let raw = uri_path.trim_start_matches('/');
  if raw.is_empty() {
    return not_found(404, "missing path");
  }
  let decoded = percent_decode(raw);
  let canonical = match fs::canonicalize(&decoded) {
    Ok(p) => p,
    Err(_) => return not_found(404, "not found"),
  };
  if !canonical.starts_with(&root) {
    return not_found(403, "outside media root");
  }
  match fs::read(&canonical) {
    Ok(bytes) => Response::builder()
      .status(200)
      .header("Content-Type", guess_mime(&decoded))
      .header("Access-Control-Allow-Origin", "*")
      .body(bytes)
      .unwrap(),
    Err(_) => not_found(404, "not found"),
  }
}

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
    .manage(MediaRoot(Mutex::new(None)))
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .register_uri_scheme_protocol("media", |ctx, request| {
      let root = ctx
        .app_handle()
        .state::<MediaRoot>()
        .0
        .lock()
        .unwrap()
        .clone();
      serve_media_file(root, request.uri().path())
    })
    .invoke_handler(tauri::generate_handler![set_media_root])
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:brunopad.db", migrations)
        .build(),
    )
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
