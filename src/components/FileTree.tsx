import { useEffect, useRef, useState } from "react";
import type { ExplorerEntry } from "../lib/explorer";
import {
  createFile,
  createFolder,
  deleteEntry,
  parentPath,
  readDirEntries,
  renameEntry,
} from "../lib/explorer";
import { ContextMenu, type MenuItem } from "./ContextMenu";
import { FILE_MIME } from "../lib/panels";

interface FileTreeProps {
  rootPath: string;
  onSelectFile: (path: string) => void;
}

const FILE_NAME_PLACEHOLDER = "untitled.md";
const FOLDER_NAME_PLACEHOLDER = "untitled";

type Draft =
  | { kind: "create"; parentDir: string; isDirectory: boolean }
  | { kind: "rename"; path: string; original: string }
  | null;

export function FileTree({ rootPath, onSelectFile }: FileTreeProps) {
  const [entries, setEntries] = useState<ExplorerEntry[] | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [cache, setCache] = useState<Map<string, ExplorerEntry[]>>(new Map());
  const [menu, setMenu] = useState<{ x: number; y: number; entry: ExplorerEntry } | null>(null);
  const [draft, setDraft] = useState<Draft>(null);

  const refreshChildren = async (dirPath: string): Promise<ExplorerEntry[]> => {
    const fresh = await readDirEntries(dirPath);
    setCache((prev) => new Map(prev).set(dirPath, fresh));
    if (dirPath === rootPath) setEntries(fresh);
    return fresh;
  };

  const toggle = async (entry: ExplorerEntry) => {
    if (!entry.isDirectory) return;
    if (!expanded.has(entry.path)) {
      if (!cache.has(entry.path)) await refreshChildren(entry.path);
      setExpanded((prev) => new Set(prev).add(entry.path));
    } else {
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(entry.path);
        return next;
      });
    }
  };

  const commitDraft = async (value: string) => {
    const d = draft;
    setDraft(null);
    if (!d || !value.trim()) return;
    try {
      if (d.kind === "create") {
        if (d.isDirectory) {
          await createFolder(d.parentDir, value.trim());
        } else {
          await createFile(d.parentDir, value.trim());
        }
        await refreshChildren(d.parentDir);
      } else {
        await renameEntry(d.path, value.trim());
        await refreshChildren(parentPath(d.path));
      }
    } catch (err) {
      console.error("[explorer] operation failed", err);
    }
  };

  const removeEntry = async (entry: ExplorerEntry) => {
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
  };

  const startCreate = (parentDir: string, isDirectory: boolean) => {
    if (parentDir !== rootPath) setExpanded((prev) => new Set(prev).add(parentDir));
    setDraft({ kind: "create", parentDir, isDirectory });
  };

  const menuItems = (entry: ExplorerEntry): MenuItem[] => [
    ...(entry.isDirectory
      ? [
          {
            label: "New file",
            onClick: () => startCreate(entry.path, false),
          },
          {
            label: "New folder",
            onClick: () => startCreate(entry.path, true),
          },
        ]
      : []),
    {
      label: "Rename",
      onClick: () => setDraft({ kind: "rename", path: entry.path, original: entry.name }),
    },
    { label: "Delete", danger: true, onClick: () => void removeEntry(entry) },
  ];

  const draftRow = (depth: number, isDirectory: boolean) => (
    <DraftRow
      depth={depth}
      defaultValue={isDirectory ? FOLDER_NAME_PLACEHOLDER : FILE_NAME_PLACEHOLDER}
      onCommit={commitDraft}
    />
  );

  const renderEntry = (entry: ExplorerEntry, depth: number): React.ReactNode => {
    const isExpanded = expanded.has(entry.path);
    return (
      <div key={entry.path}>
        <button
          className="flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left text-sm hover:bg-neutral-100"
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
          onClick={() => (entry.isDirectory ? void toggle(entry) : onSelectFile(entry.path))}
          draggable={!entry.isDirectory}
          onDragStart={(e) => {
            if (entry.isDirectory) return;
            e.dataTransfer.setData(FILE_MIME, entry.path);
            e.dataTransfer.effectAllowed = "copy";
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setMenu({ x: e.clientX, y: e.clientY, entry });
          }}
        >
          <span className="w-3 text-center text-neutral-400">
            {entry.isDirectory ? (isExpanded ? "▾" : "▸") : ""}
          </span>
          {draft?.kind === "rename" && draft.path === entry.path ? null : <span>{entry.name}</span>}
        </button>
        {draft?.kind === "rename" && draft.path === entry.path
          ? draftRow(depth + 1, false)
          : null}
        {isExpanded &&
          (cache.get(entry.path) ?? []).map((child) => renderEntry(child, depth + 1))}
        {isExpanded && draft?.kind === "create" && draft.parentDir === entry.path
          ? draftRow(depth + 1, draft.isDirectory)
          : null}
      </div>
    );
  };

  if (!entries) {
    void refreshChildren(rootPath);
    return <div className="p-2 text-sm text-neutral-400">Loading…</div>;
  }

  return (
    <div className="select-none">
      {entries.map((entry) => renderEntry(entry, 0))}
      {draft?.kind === "create" && draft.parentDir === rootPath
        ? draftRow(0, draft.isDirectory)
        : null}
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems(menu.entry)}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}

function DraftRow({
  depth,
  defaultValue,
  onCommit,
}: {
  depth: number;
  defaultValue: string;
  onCommit: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const settled = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const settle = (commit: boolean) => {
    if (settled.current) return;
    settled.current = true;
    onCommit(commit ? value : "");
  };

  return (
    <input
      ref={inputRef}
      className="mx-1 my-0.5 rounded border border-blue-400 px-1.5 py-0.5 text-sm outline-none"
      style={{ marginLeft: `${depth * 12 + 6}px`, width: "calc(100% - 18px)" }}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => settle(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          settled.current = true;
          void onCommit(value);
        }
        if (e.key === "Escape") settle(false);
      }}
    />
  );
}
