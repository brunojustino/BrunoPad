import { useState } from "react";
import type { ExplorerEntry } from "../lib/explorer";
import { useFileTreeData, type Draft } from "../lib/useFileTreeData";
import { ContextMenu, type MenuItem } from "./ContextMenu";
import { EntryRow } from "./filetree/EntryRow";
import { DraftRow, FILE_NAME_PLACEHOLDER, FOLDER_NAME_PLACEHOLDER } from "./filetree/DraftRow";

interface FileTreeProps {
  rootPath: string;
  onSelectFile: (path: string) => void;
}

export function FileTree({ rootPath, onSelectFile }: FileTreeProps) {
  const data = useFileTreeData(rootPath);
  const [menu, setMenu] = useState<{ x: number; y: number; entry: ExplorerEntry } | null>(null);
  const [draft, setDraft] = useState<Draft>(null);

  const commitDraft = (value: string) => {
    const d = draft;
    setDraft(null);
    if (!d || !value.trim()) return;
    if (d.kind === "create") {
      void data.createEntry(d.parentDir, value.trim(), d.isDirectory);
    } else {
      void data.renameTo(d.path, value.trim());
    }
  };

  const startCreate = (parentDir: string, isDirectory: boolean) => {
    if (parentDir !== rootPath) data.expand(parentDir);
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
    { label: "Delete", danger: true, onClick: () => void data.removeEntry(entry) },
  ];

  const renderEntry = (entry: ExplorerEntry, depth: number): React.ReactNode => {
    const isExpanded = data.expanded.has(entry.path);
    return (
      <EntryRow
        key={entry.path}
        entry={entry}
        depth={depth}
        isExpanded={isExpanded}
        isRenaming={draft?.kind === "rename" && draft.path === entry.path}
        showCreateDraft={draft?.kind === "create" && draft.parentDir === entry.path}
        isDirectoryDraft={draft?.kind === "create" ? draft.isDirectory : false}
        onToggle={(e) => void data.toggle(e)}
        onSelect={onSelectFile}
        onMenu={(e, x, y) => setMenu({ x, y, entry: e })}
        onRename={(e) => setDraft({ kind: "rename", path: e.path, original: e.name })}
        onDelete={(e) => void data.removeEntry(e)}
        onDraftCommit={commitDraft}
      >
        {isExpanded &&
          data
            .childrenOf(entry.path)
            .map((child) => renderEntry(child, depth + 1))}
      </EntryRow>
    );
  };

  if (!data.entries) {
    void data.refreshChildren(rootPath);
    return <div className="p-2 text-sm text-neutral-400">Loading…</div>;
  }

  return (
    <div className="select-none">
      {data.entries.map((entry) => renderEntry(entry, 0))}
      {draft?.kind === "create" && draft.parentDir === rootPath && (
        <DraftRow
          depth={0}
          defaultValue={draft.isDirectory ? FOLDER_NAME_PLACEHOLDER : FILE_NAME_PLACEHOLDER}
          onCommit={commitDraft}
        />
      )}
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
