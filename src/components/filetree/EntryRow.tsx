import type { ExplorerEntry } from "../../lib/explorer";
import { FILE_MIME } from "../../lib/panels";
import { DraftRow, FILE_NAME_PLACEHOLDER, FOLDER_NAME_PLACEHOLDER } from "./DraftRow";

interface EntryRowProps {
  entry: ExplorerEntry;
  depth: number;
  isExpanded: boolean;
  isRenaming: boolean;
  showCreateDraft: boolean;
  isDirectoryDraft: boolean;
  onToggle: (entry: ExplorerEntry) => void;
  onSelect: (path: string) => void;
  onMenu: (entry: ExplorerEntry, x: number, y: number) => void;
  onRename: (entry: ExplorerEntry) => void;
  onDelete: (entry: ExplorerEntry) => void;
  onDraftCommit: (value: string) => void;
  children: React.ReactNode;
}

export function EntryRow(props: EntryRowProps) {
  const { entry, depth, isExpanded } = props;
  return (
    <div>
      <button
        className="flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left text-sm hover:bg-neutral-100"
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
        onClick={() => (entry.isDirectory ? props.onToggle(entry) : props.onSelect(entry.path))}
        draggable={!entry.isDirectory}
        onDragStart={(e) => {
          if (entry.isDirectory) return;
          e.dataTransfer.setData(FILE_MIME, entry.path);
          e.dataTransfer.effectAllowed = "copy";
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          props.onMenu(entry, e.clientX, e.clientY);
        }}
      >
        <span className="w-3 text-center text-neutral-400">
          {entry.isDirectory ? (isExpanded ? "▾" : "▸") : ""}
        </span>
        {props.isRenaming ? null : <span>{entry.name}</span>}
      </button>
      {props.isRenaming && (
        <DraftRow depth={depth + 1} defaultValue={entry.name} onCommit={props.onDraftCommit} />
      )}
      {isExpanded && props.children}
      {props.showCreateDraft && (
        <DraftRow
          depth={depth + 1}
          defaultValue={props.isDirectoryDraft ? FOLDER_NAME_PLACEHOLDER : FILE_NAME_PLACEHOLDER}
          onCommit={props.onDraftCommit}
        />
      )}
    </div>
  );
}
