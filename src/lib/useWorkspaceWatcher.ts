import { useEffect, useState } from "react";
import type { UserWorkspace } from "./workspace";
import { watchWorkspace } from "./watcher";
import { syncFileRegistry } from "./fileRegistry";
import { reEmbedPaths } from "./ai/indexing";

const RE_EMBED_DEBOUNCE_MS = 1000;
const REGISTRY_SYNC_DEBOUNCE_MS = 1000;

export function useWorkspaceWatcher(
  workspace: UserWorkspace | null,
): number {
  const [treeVersion, setTreeVersion] = useState(0);

  useEffect(() => {
    if (!workspace) return;
    let unwatch: (() => void) | undefined;
    let reEmbedTimer: ReturnType<typeof setTimeout> | undefined;
    let syncTimer: ReturnType<typeof setTimeout> | undefined;
    let reEmbedPending: string[] = [];

    const scheduleSync = () => {
      clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        void syncFileRegistry(workspace).catch((err) =>
          console.error("[registry] sync failed", err),
        );
      }, REGISTRY_SYNC_DEBOUNCE_MS);
    };

    void syncFileRegistry(workspace).catch((err) =>
      console.error("[registry] initial sync failed", err),
    );

    void watchWorkspace(workspace.path, (paths) => {
      setTreeVersion((v) => v + 1);
      scheduleSync();
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
      clearTimeout(syncTimer);
    };
  }, [workspace]);

  return treeVersion;
}
