import { useEffect, useRef } from "react";
import { useCreateBlockNote, useEditorChange } from "@blocknote/react";
import type { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useFileContent } from "../lib/useFileContent";
import { useGhostText } from "../lib/ai/ghost";
import { countWords } from "../lib/wordCount";
import { schemaWithEmbeds, EmbedMdPathContext } from "../lib/editor/embedBlocks";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

interface MarkdownEditorProps {
  filePath: string;
  onWordCount?: (count: number) => void;
}

export function MarkdownEditor({ filePath, onWordCount }: MarkdownEditorProps) {
  const editor = useCreateBlockNote({ schema: schemaWithEmbeds }) as unknown as BlockNoteEditor;
  const { loaded, error } = useFileContent(editor, filePath);

  const reportWordCount = useRef(onWordCount);
  reportWordCount.current = onWordCount;

  useEditorChange(() => {
    reportWordCount.current?.(countWords(editor));
  }, editor);

  useEffect(() => {
    if (loaded) reportWordCount.current?.(countWords(editor));
  }, [loaded, editor]);

  const ghost = useGhostText(editor);
  const ghostWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ghostWrapRef.current;
    if (!el) return;
    el.addEventListener("keydown", ghost.handleKeydown, true);
    return () => el.removeEventListener("keydown", ghost.handleKeydown, true);
  }, [ghost.handleKeydown]);

  if (error) {
    return <div className="p-4 text-sm text-berry-400">Failed to load: {error}</div>;
  }
  if (!loaded) {
    return <div className="p-4 text-sm text-fog-500">Loading…</div>;
  }
  return (
    <EmbedMdPathContext.Provider value={filePath}>
      <div ref={ghostWrapRef} className="relative h-full">
        <BlockNoteView editor={editor} theme="dark" className="h-full" />
        {ghost.suggestion && (
          <span
            className="pointer-events-none absolute select-none text-fog-500"
            style={{ left: ghost.suggestion.left, top: ghost.suggestion.top }}
          >
            {ghost.suggestion.text}
          </span>
        )}
      </div>
    </EmbedMdPathContext.Provider>
  );
}
