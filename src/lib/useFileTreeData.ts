import { useCallback, useEffect, useRef, useState } from "react";
import {
  createFile,
  createFolder,
  deleteEntry,
  parentPath,
  readDirEntries,
  renameEntry,
  type ExplorerEntry,
} from "./explorer";

export type Draft =
  | { kind: "create"; parentDir: string; isDirectory: boolean }
  | { kind: "rename"; path: string; original: string }
  | null;

export function useFileTreeData(rootPath: string) {
  const [entries, setEntries] = useState<ExplorerEntry[] | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [cache, setCache] = useState<Map<string, ExplorerEntry[]>>(new Map());
  const cacheRef = useRef(cache);

  useEffect(() => {
    cacheRef.current = cache;
  }, [cache]);

  const refreshChildren = useCallback(
    async (dirPath: string): Promise<ExplorerEntry[]> => {
      const fresh = await readDirEntries(dirPath);
      setCache((prev) => new Map(prev).set(dirPath, fresh));
      if (dirPath === rootPath) setEntries(fresh);
      return fresh;
    },
    [rootPath],
  );

  const toggle = useCallback(
    async (entry: ExplorerEntry) => {
      if (!entry.isDirectory) return;
      if (!cacheRef.current.has(entry.path)) await refreshChildren(entry.path);
      setExpanded((prev) => {
        if (prev.has(entry.path)) {
          const next = new Set(prev);
          next.delete(entry.path);
          return next;
        }
        return new Set(prev).add(entry.path);
      });
    },
    [refreshChildren],
  );

  const expand = useCallback((dirPath: string) => {
    setExpanded((prev) => new Set(prev).add(dirPath));
  }, []);

  const createEntry = useCallback(
    async (parentDir: string, name: string, isDirectory: boolean) => {
      try {
        if (isDirectory) {
          await createFolder(parentDir, name);
        } else {
          await createFile(parentDir, name);
        }
        await refreshChildren(parentDir);
      } catch (err) {
        console.error("[explorer] operation failed", err);
      }
    },
    [refreshChildren],
  );

  const renameTo = useCallback(
    async (path: string, name: string) => {
      try {
        await renameEntry(path, name);
        await refreshChildren(parentPath(path));
      } catch (err) {
        console.error("[explorer] operation failed", err);
      }
    },
    [refreshChildren],
  );

  const removeEntry = useCallback(
    async (entry: ExplorerEntry) => {
      try {
        await deleteEntry(entry.path, entry.isDirectory);
        await refreshChildren(parentPath(entry.path));
        setExpanded((prev) => {
          const next = new Set(prev);
          next.delete(entry.path);
          return next;
        });
        setCache((prev) => {
          const next = new Map(prev);
          next.delete(entry.path);
          return next;
        });
      } catch (err) {
        console.error("[explorer] delete failed", err);
      }
    },
    [refreshChildren],
  );

  const childrenOf = useCallback(
    (dirPath: string): ExplorerEntry[] => cache.get(dirPath) ?? [],
    [cache],
  );

  return {
    entries,
    expanded,
    refreshChildren,
    toggle,
    expand,
    createEntry,
    renameTo,
    removeEntry,
    childrenOf,
  };
}
