import { useCallback, useEffect, useRef, useState } from "react";
import type { DockviewApi, SerializedDockview } from "dockview-react";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWorkspace, setWorkspace, type UserWorkspace } from "./lib/workspace";
import { setMediaRoot } from "./lib/mediaProtocol";
import { FileTree } from "./components/FileTree";
import { loadPaneLayout, savePaneLayout } from "./lib/panes";
import { PaneArea } from "./components/PaneArea";
import { openChatPanel, openMarkdownPanel, nameFromPath } from "./lib/panels";
import { useWorkspaceWatcher } from "./lib/useWorkspaceWatcher";

function App() {
  const [workspace, setWorkspaceState] = useState<UserWorkspace | null>(null);
  const [busy, setBusy] = useState(false);
  const [layout, setLayout] = useState<SerializedDockview | null>(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [wordsByFile, setWordsByFile] = useState<Record<string, number>>({});
  const dockviewApi = useRef<DockviewApi | undefined>(undefined);

  useEffect(() => {
    void getCurrentWorkspace()
      .then(setWorkspaceState)
      .catch((err) => console.error("[workspace] load failed", err));
  }, []);

  useEffect(() => {
    if (!workspace) return;
    void setMediaRoot(workspace.path).catch((err) =>
      console.error("[media] set root failed", err),
    );
  }, [workspace]);

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
    api.onDidActivePanelChange((event) => {
      const params = event.panel?.params as { filePath?: string } | undefined;
      setActiveFile(params?.filePath ?? null);
    });
  }, []);

  const onWordCount = useCallback((filePath: string, count: number) => {
    setWordsByFile((prev) =>
      prev[filePath] === count ? prev : { ...prev, [filePath]: count },
    );
  }, []);

  const startSidebarResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev: MouseEvent) => {
      setSidebarWidth(Math.min(480, Math.max(160, startWidth + ev.clientX - startX)));
    };
    const onUp = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

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
    <div className="flex h-screen flex-col bg-ink-950 text-fog-100">
      <header className="flex h-10 items-center gap-2 border-b border-line bg-ink-900 px-3 text-sm">
        <span className="font-semibold tracking-tight text-fog-100">brunopad</span>
        <button
          className="ml-auto rounded px-1.5 py-0.5 text-xs text-fog-300 hover:bg-ink-700 hover:text-fog-100"
          onClick={openChat}
          title="Open AI chat"
        >
          AI
        </button>
      </header>
      {workspace ? (
        <div className="flex flex-1 overflow-hidden">
          <aside
            className="flex shrink-0 flex-col overflow-hidden border-r border-line bg-ink-900"
            style={{ width: `${sidebarWidth}px` }}
          >
            <div className="flex h-8 items-center border-b border-line-soft px-2">
              <button
                className="rounded px-1.5 py-0.5 text-xs text-fog-500 hover:bg-ink-700 hover:text-fog-100"
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
          <div
            className="w-1 shrink-0 cursor-col-resize bg-ink-950 transition-colors hover:bg-brass-400/40"
            onMouseDown={startSidebarResize}
            title="Drag to resize explorer"
          />
          <main className="min-w-0 flex-1 overflow-hidden">
            {layoutReady ? (
              <PaneArea
                initialLayout={layout}
                onLayoutChange={onLayoutChange}
                onApiReady={onApiReady}
                onWordCount={onWordCount}
              />
            ) : null}
          </main>
        </div>
      ) : (
        <main className="flex flex-1 flex-col items-center justify-center gap-3 bg-ink-950">
          <p className="text-sm text-fog-500">Open a folder to start writing.</p>
          <button
            className="rounded-md bg-brass-400 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-brass-300 disabled:opacity-50"
            disabled={busy}
            onClick={() => void pickWorkspace()}
          >
            {busy ? "Opening…" : "Open workspace"}
          </button>
        </main>
      )}
      <footer className="flex h-6 shrink-0 items-center gap-3 border-t border-line bg-ink-900 px-3 text-xs text-fog-500">
        {activeFile ? (
          <>
            <span className="truncate">{nameFromPath(activeFile)}</span>
            <span className="ml-auto shrink-0 tabular-nums">
              {wordsByFile[activeFile] ?? 0} {wordsByFile[activeFile] === 1 ? "word" : "words"}
            </span>
          </>
        ) : (
          <span className="truncate">No file open</span>
        )}
      </footer>
    </div>
  );
}

export default App;
