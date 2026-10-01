import { useRef } from "react";
import { Mosaic, MosaicWindow, MosaicNode } from "react-mosaic-component";
import "react-mosaic-component/react-mosaic-component.css";
import { MarkdownEditor } from "./MarkdownEditor";

interface PaneAreaProps {
  tree: MosaicNode<string> | null;
  panes: Record<string, string>;
  onTreeChange: (tree: MosaicNode<string> | null) => void;
  onDropFile: (paneId: string, filePath: string) => void;
  onClosePane: (paneId: string) => void;
}

const FILE_MIME = "application/x-brunopad-file";

function paneName(id: string, panes: Record<string, string>): string {
  const filePath = panes[id];
  return filePath ? nameFromPath(filePath) : id;
}

function nameFromPath(path: string): string {
  const sep = path.includes("\\") ? "\\" : "/";
  return path.slice(path.lastIndexOf(sep) + 1);
}

export function PaneArea(props: PaneAreaProps) {
  const nextId = useRef(1);

  const createNode = (): string => `pane-${nextId.current++}`;

  return (
    <Mosaic<string>
      className="brunopad-mosaic"
      value={props.tree}
      onChange={props.onTreeChange}
      createNode={createNode}
      renderTile={(id, path) => (
        <MosaicWindow<string>
          path={path}
          title={paneName(id, props.panes)}
          className="brunopad-window"
          toolbarControls={[]}
          additionalControls={[]}
          onDragStart={() => undefined}
        >
          <div
            className="flex h-full flex-col"
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes(FILE_MIME)) e.preventDefault();
            }}
            onDrop={(e) => {
              const filePath = e.dataTransfer.getData(FILE_MIME);
              if (filePath) props.onDropFile(id, filePath);
            }}
          >
            <div className="flex-1 overflow-y-auto">
              {props.panes[id] ? (
                <MarkdownEditor key={props.panes[id]} filePath={props.panes[id]} />
              ) : (
                <div className="p-4 text-sm text-neutral-600">Empty pane</div>
              )}
            </div>
            <div className="flex justify-end border-t border-neutral-200 p-1">
              <button
                className="rounded px-2 py-0.5 text-xs text-neutral-400 hover:bg-neutral-100"
                onClick={() => props.onClosePane(id)}
              >
                close
              </button>
            </div>
          </div>
        </MosaicWindow>
      )}
      zeroStateView={
        <div className="flex h-full flex-col items-center justify-center gap-1 text-neutral-400">
          <div className="text-lg">No panes open</div>
          <div className="text-sm">Click a file in the explorer to open it.</div>
        </div>
      }
    />
  );
}
