import { useState } from "react";
import type { ExplorerEntry } from "../lib/explorer";
import { readDirEntries } from "../lib/explorer";

interface FileTreeProps {
  rootPath: string;
}

function TreeNode({ entry, depth }: { entry: ExplorerEntry; depth: number }) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<ExplorerEntry[] | null>(null);

  const toggle = async () => {
    if (!entry.isDirectory) return;
    if (!expanded && !children) {
      setChildren(await readDirEntries(entry.path));
    }
    setExpanded(!expanded);
  };

  return (
    <div>
      <button
        className="flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left text-sm hover:bg-neutral-100"
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
        onClick={() => void toggle()}
      >
        <span className="w-3 text-center text-neutral-400">
          {entry.isDirectory ? (expanded ? "▾" : "▸") : ""}
        </span>
        <span>{entry.name}</span>
      </button>
      {expanded && children && (
        <div>
          {children.map((child) => (
            <TreeNode key={child.path} entry={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ rootPath }: FileTreeProps) {
  const [entries, setEntries] = useState<ExplorerEntry[] | null>(null);

  if (!entries) {
    void readDirEntries(rootPath).then(setEntries);
    return <div className="p-2 text-sm text-neutral-400">Loading…</div>;
  }

  return (
    <div className="select-none">
      {entries.map((entry) => (
        <TreeNode key={entry.path} entry={entry} depth={0} />
      ))}
    </div>
  );
}
