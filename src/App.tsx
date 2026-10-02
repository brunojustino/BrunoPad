import { useCallback, useEffect, useRef, useState } from "react";
import type { DockviewApi, SerializedDockview } from "dockview-react";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWorkspace, setWorkspace, type UserWorkspace } from "./lib/workspace";
import { FileTree } from "./components/FileTree";
import { loadPaneLayout, savePaneLayout } from "./lib/panes";
import { PaneArea } from "./components/PaneArea";
import { openChatPanel, openMarkdownPanel } from "./lib/panels";
import { useWorkspaceWatcher } from "./lib/useWorkspaceWatcher";

function App() {
  const [workspace, setWorkspaceState] = useState<UserWorkspace | null>(null);
  const [busy, setBusy] = useState(false);
  const [layout, setLayout] = useState<SerializedDockview | null>(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const dockviewApi = useRef<DockviewApi | undefined>(undefined);

  useEffect(() => {
    void getCurrentWorkspace()
      .then(setWorkspaceState)
      .catch((err) => console.error("[workspace] load failed", err));
  }, []);

  useEffect(() => {
    if (!workspace) return;
    void loadPaneLayout(workspace.id)
      .then((loaded) => {
        setLayout(loaded);
        setLayoutReady(true);
      })
      .catch((err) => {
        console.error("[panes] load failed", err);
        setLayoutReady(true);
      });
  }, [workspace]);

  const treeVersion = useWorkspaceWatcher(workspace);

  const openFile = useCallback((filePath: string) => {
    const api = dockviewApi.current;
    if (api) openMarkdownPanel(api, filePath);
  }, []);

  const openChat = useCallback(() => {
    const api = dockviewApi.current;
    if (api) openChatPanel(api);
  }, []);

  const onApiReady = useCallback((api: DockviewApi) => {
    dockviewApi.current = api;
  }, []);

  const onLayoutChange = useCallback(
    (serialized: SerializedDockview) => {
      if (workspace) savePaneLayout(workspace.id, serialized);
    },
    [workspace],
  );

  const pickWorkspace = async () => {
    setBusy(true);
    try {
      const dir = await open({ directory: true, multiple: false });
      if (dir) {
        const saved = await setWorkspace(dir);
        setWorkspaceState(saved);
        setLayout(null);
        setLayoutReady(false);
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
        <button
          className="ml-auto rounded px-1.5 py-0.5 text-xs text-neutral-500 hover:bg-neutral-200"
          onClick={openChat}
          title="Open AI chat"
        >
          AI
        </button>
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
              <FileTree
                key={treeVersion}
                rootPath={workspace.path}
                onSelectFile={openFile}
              />
            </div>
          </aside>
          <main className="flex-1 overflow-hidden">
            {layoutReady ? (
              <PaneArea
                initialLayout={layout}
                onLayoutChange={onLayoutChange}
                onApiReady={onApiReady}
              />
            ) : null}
          </main>
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
