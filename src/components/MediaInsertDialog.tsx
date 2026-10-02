import { useEffect, useState } from "react";
import {
  copyIntoWorkspaceDestination,
  type MediaDestination,
} from "../lib/editor/mediaInsert";
import { mediaKindFor } from "../lib/editor/embedBlocks";
import {
  getMediaInsertDestination,
  setMediaInsertDestination,
} from "../lib/mediaSettings";
import type { BlockNoteEditor } from "@blocknote/core";

const DESTINATION_OPTIONS: { value: MediaDestination; label: string; hint: string }[] = [
  { value: "sameFolder", label: "Same folder as this file", hint: "" },
  { value: "subfolder", label: "assets folder next to this file", hint: "{file dir}/assets/" },
  { value: "workspace", label: "Workspace assets folder", hint: "{workspace}/assets/" },
];

interface MediaInsertDialogProps {
  sourcePath: string;
  mdFilePath: string;
  editor: BlockNoteEditor;
  onClose: () => void;
}

function isEmptyParagraph(block: { type: string; content: unknown }): boolean {
  if (block.type !== "paragraph") return false;
  return Array.isArray(block.content) && block.content.length === 0;
}

export function MediaInsertDialog({ sourcePath, mdFilePath, editor, onClose }: MediaInsertDialogProps) {
  const [destination, setDestination] = useState<MediaDestination>("subfolder");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getMediaInsertDestination().then(setDestination);
  }, []);

  const insert = async () => {
    setBusy(true);
    try {
      const { relativeUrl } = await copyIntoWorkspaceDestination(sourcePath, mdFilePath, destination);
      await setMediaInsertDestination(destination);
      const kind = mediaKindFor(sourcePath);
      const name = sourcePath.replace(/[\\/]+/g, "/").split("/").pop() ?? "";
      const embedBlock = { type: kind, props: { url: relativeUrl, name } } as never;
      const cursorBlock = editor.getTextCursorPosition().block;
      if (isEmptyParagraph(cursorBlock)) {
        await editor.replaceBlocks([cursorBlock], [embedBlock] as never);
      } else {
        await editor.insertBlocks([embedBlock], cursorBlock, "after" as never);
      }
      onClose();
    } catch (err) {
      console.error("[media] insert failed", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50" onMouseDown={onClose}>
      <div
        className="w-80 rounded-lg border border-line bg-ink-900 p-4 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <p className="mb-3 truncate text-sm text-fog-100" title={sourcePath}>
          Insert {sourcePath.replace(/[\\/]+/g, "/").split("/").pop()}
        </p>
        <div className="mb-4 flex flex-col gap-1.5">
          {DESTINATION_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-xs text-fog-300">
              <input
                type="radio"
                name="media-destination"
                checked={destination === opt.value}
                onChange={() => setDestination(opt.value)}
                className="accent-brass-400"
              />
              {opt.label}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="rounded px-2 py-1 text-xs text-fog-400 hover:bg-ink-700 hover:text-fog-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded bg-brass-400 px-2 py-1 text-xs font-medium text-ink-950 hover:bg-brass-300 disabled:opacity-50"
            disabled={busy}
            onClick={() => void insert()}
          >
            {busy ? "Copying…" : "Insert"}
          </button>
        </div>
      </div>
    </div>
  );
}
