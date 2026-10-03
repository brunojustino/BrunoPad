import type { ExplorerEntry } from "../../lib/explorer";
import { FILE_MIME } from "../../lib/panels";
import { DraftRow, FILE_NAME_PLACEHOLDER, FOLDER_NAME_PLACEHOLDER } from "./DraftRow";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-3 w-3 shrink-0 text-fog-600 transition-transform duration-150 ${
        open ? "rotate-90" : ""
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

function FolderIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0 text-brass-400"
      fill="currentColor"
    >
      <path d="M1.5 3.5A1.5 1.5 0 0 1 3 2h3.2c.4 0 .78.16 1.06.44l.86.86c.1.1.22.2.36.2H13A1.5 1.5 0 0 1 14.5 5v.25H4.2a1.5 1.5 0 0 0-1.45 1.1L1.5 10.9V3.5z" />
      <path d="M2.9 6.6a1 1 0 0 1 .96-.72h10.5a1 1 0 0 1 .96 1.28l-1.2 4.2a1 1 0 0 1-.96.72H2.24a.8.8 0 0 1-.77-1.02l1.43-4.46z" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0 text-brass-400"
      fill="currentColor"
    >
      <path d="M1.5 3.5A1.5 1.5 0 0 1 3 2h3.2c.4 0 .78.16 1.06.44l.86.86c.1.1.22.2.36.2H13A1.5 1.5 0 0 1 14.5 5v7A1.5 1.5 0 0 1 13 13.5H3A1.5 1.5 0 0 1 1.5 12V3.5z" />
    </svg>
  );
}

function FileIcon({ name }: { name: string }) {
  const isMd = /\.(md|mdx|markdown)$/i.test(name);
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-3.5 w-3.5 shrink-0 ${isMd ? "text-fog-300" : "text-fog-600"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 1.5h5l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z" />
      <path d="M9 1.5v3h3" />
      {isMd && <path d="M4.8 10.5v-3l1.7 1.8 1.7-1.8v3M10.4 7.5v3m0 0l-1-1m1 1l1-1" />}
    </svg>
  );
}

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
        className="flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-left text-sm text-fog-100 hover:bg-ink-700"
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
        {entry.isDirectory ? (
          <>
            <ChevronIcon open={isExpanded} />
            <FolderIcon open={isExpanded} />
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <FileIcon name={entry.name} />
          </>
        )}
        {props.isRenaming ? null : (
          <span className="truncate">{entry.name}</span>
        )}
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
