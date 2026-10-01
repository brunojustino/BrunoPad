import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWorkspace, setWorkspace, type UserWorkspace } from "./lib/workspace";
import { FileTree } from "./components/FileTree";
import { watchWorkspace } from "./lib/watcher";

function App() {
  const [workspace, setWorkspaceState] = useState<UserWorkspace | null>(null);
  const [busy, setBusy] = useState(false);
  const [treeVersion, setTreeVersion] = useState(0);

  useEffect(() => {
    void getCurrentWorkspace()
      .then(setWorkspaceState)
      .catch((err) => console.error("[workspace] load failed", err));
  }, []);

  useEffect(() => {
    if (!workspace) return;
    let unwatch: (() => void) | undefined;
    void watchWorkspace(workspace.path, () => setTreeVersion((v) => v + 1))
      .then((fn) => {
        unwatch = fn;
      })
      .catch((err) => console.error("[watcher] failed", err));
    return () => unwatch?.();
  }, [workspace]);

  const pickWorkspace = async () => {
    setBusy(true);
    try {
      const dir = await open({ directory: true, multiple: false });
      if (dir) {
        const saved = await setWorkspace(dir);
        setWorkspaceState(saved);
      }
    } catch (err) {
      console.error("[workspace] pick failed", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-10 items-center gap-2 border-b border-neutral-200 px-3 text-sm">
        <span className="font-semibold">brunopad</span>
        {workspace && (
          <span className="truncate text-neutral-500">{workspace.path}</span>
        )}
      </header>
      {workspace ? (
        <div className="flex flex-1 overflow-hidden">
          <aside className="flex w-60 shrink-0 flex-col overflow-hidden border-r border-neutral-200 bg-neutral-50">
            <div className="flex h-8 items-center border-b border-neutral-200 px-2">
              <button
                className="rounded px-1.5 py-0.5 text-xs text-neutral-500 hover:bg-neutral-200"
                onClick={() => void pickWorkspace()}
                title="Change workspace"
              >
                workspace
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FileTree key={treeVersion} rootPath={workspace.path} />
            </div>
          </aside>
          <main className="flex-1" />
        </div>
      ) : (
        <main className="flex flex-1 items-center justify-center">
          <button
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            disabled={busy}
            onClick={() => void pickWorkspace()}
          >
            {busy ? "Opening…" : "Open workspace"}
          </button>
        </main>
      )}
    </div>
  );
}

export default App;
