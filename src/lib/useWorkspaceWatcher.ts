import { useEffect, useState } from "react";
import type { UserWorkspace } from "./workspace";
import { watchWorkspace } from "./watcher";
import { reEmbedPaths } from "./ai/indexing";

const RE_EMBED_DEBOUNCE_MS = 1000;

export function useWorkspaceWatcher(
  workspace: UserWorkspace | null,
): number {
  const [treeVersion, setTreeVersion] = useState(0);

  useEffect(() => {
    if (!workspace) return;
    let unwatch: (() => void) | undefined;
    let reEmbedTimer: ReturnType<typeof setTimeout> | undefined;
    let reEmbedPending: string[] = [];
    void watchWorkspace(workspace.path, (paths) => {
      setTreeVersion((v) => v + 1);
      reEmbedPending.push(...paths);
      clearTimeout(reEmbedTimer);
      reEmbedTimer = setTimeout(() => {
        const changed = reEmbedPending;
        reEmbedPending = [];
        void reEmbedPaths(workspace.id, changed);
      }, RE_EMBED_DEBOUNCE_MS);
    })
      .then((fn) => {
        unwatch = fn;
      })
      .catch((err) => console.error("[watcher] failed", err));
    return () => {
      unwatch?.();
      clearTimeout(reEmbedTimer);
    };
  }, [workspace]);

  return treeVersion;
}
