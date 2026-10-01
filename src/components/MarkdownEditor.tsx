import { useEffect, useRef, useState } from "react";
import { useCreateBlockNote, useEditorChange } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

interface MarkdownEditorProps {
  filePath: string;
}

const SAVE_DEBOUNCE_MS = 500;

export function MarkdownEditor({ filePath }: MarkdownEditorProps) {
  const editor = useCreateBlockNote();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saving = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const md = await readTextFile(filePath);
        const blocks = await editor.tryParseMarkdownToBlocks(md);
        if (cancelled) return;
        await editor.replaceBlocks(editor.document, blocks);
        setLoaded(true);
      } catch (err) {
        console.error("[editor] load failed", filePath, err);
        if (!cancelled) setError(String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editor, filePath]);

  useEditorChange(async () => {
    if (!loaded || saving.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      saving.current = true;
      try {
        const md = await editor.blocksToMarkdownLossy(editor.document);
        await writeTextFile(filePath, md);
      } catch (err) {
        console.error("[editor] save failed", filePath, err);
      } finally {
        saving.current = false;
      }
    }, SAVE_DEBOUNCE_MS);
  }, editor);

  if (error) {
    return <div className="p-4 text-sm text-red-600">Failed to load: {error}</div>;
  }
  if (!loaded) {
    return <div className="p-4 text-sm text-neutral-400">Loading…</div>;
  }
  return <BlockNoteView editor={editor} className="h-full" />;
}
