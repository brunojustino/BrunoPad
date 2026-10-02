import { useEffect, useRef, useState } from "react";
import type { BlockNoteEditor } from "@blocknote/core";
import { useEditorChange } from "@blocknote/react";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { markSelfWrite } from "./watcher";

const SAVE_DEBOUNCE_MS = 500;

export function useFileContent(editor: BlockNoteEditor, filePath: string) {
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

  useEditorChange(() => {
    if (!loaded || saving.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      saving.current = true;
      try {
        const md = await editor.blocksToMarkdownLossy(editor.document);
        await writeTextFile(filePath, md);
        markSelfWrite();
      } catch (err) {
        console.error("[editor] save failed", filePath, err);
      } finally {
        saving.current = false;
      }
    }, SAVE_DEBOUNCE_MS);
  }, editor);

  return { loaded, error };
}
