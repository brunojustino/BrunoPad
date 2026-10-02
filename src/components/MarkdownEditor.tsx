import { useEffect, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useFileContent } from "../lib/useFileContent";
import { useGhostText } from "../lib/ai/ghost";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

interface MarkdownEditorProps {
  filePath: string;
}

export function MarkdownEditor({ filePath }: MarkdownEditorProps) {
  const editor = useCreateBlockNote();
  const { loaded, error } = useFileContent(editor, filePath);

  const ghost = useGhostText(editor);
  const ghostWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ghostWrapRef.current;
    if (!el) return;
    el.addEventListener("keydown", ghost.handleKeydown, true);
    return () => el.removeEventListener("keydown", ghost.handleKeydown, true);
  }, [ghost.handleKeydown]);

  if (error) {
    return <div className="p-4 text-sm text-red-600">Failed to load: {error}</div>;
  }
  if (!loaded) {
    return <div className="p-4 text-sm text-neutral-400">Loading…</div>;
  }
  return (
    <div ref={ghostWrapRef} className="relative h-full">
      <BlockNoteView editor={editor} className="h-full" />
      {ghost.suggestion && (
        <span
          className="pointer-events-none absolute select-none text-neutral-400"
          style={{ left: ghost.suggestion.left, top: ghost.suggestion.top }}
        >
          {ghost.suggestion.text}
        </span>
      )}
    </div>
  );
}
