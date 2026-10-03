import { useEffect, useRef, useState } from "react";
import {
  useCreateBlockNote,
  useEditorChange,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { filterSuggestionItems } from "@blocknote/core";
import type { BlockNoteEditor } from "@blocknote/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { BlockNoteView } from "@blocknote/mantine";
import { useFileContent } from "../lib/useFileContent";
import { useGhostText } from "../lib/ai/ghost";
import { countWords } from "../lib/wordCount";
import { schemaWithEmbeds, EmbedMdPathContext, embedSrc } from "../lib/editor/embedBlocks";
import { saveMediaFile, insertEmbedAtCursor } from "../lib/editor/mediaInsert";
import { MediaInsertDialog } from "./MediaInsertDialog";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

const MEDIA_FILTERS = [
  {
    name: "Media",
    extensions: [
      "png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico",
      "pdf", "doc", "docx", "odt", "xls", "xlsx", "ods", "ppt", "pptx", "odp", "rtf",
    ],
  },
  { name: "All files", extensions: ["*"] },
];

interface MarkdownEditorProps {
  filePath: string;
  onWordCount?: (count: number) => void;
}

export function MarkdownEditor({ filePath, onWordCount }: MarkdownEditorProps) {
  const editor = useCreateBlockNote({
    schema: schemaWithEmbeds,
    uploadFile: async (file) => {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const { relativeUrl } = await saveMediaFile(filePath, bytes, file.name);
        return { props: { url: relativeUrl } };
      } catch (err) {
        console.error("[media] upload failed", err);
        return { props: {} };
      }
    },
    resolveFileUrl: async (url) => embedSrc(url, filePath) ?? url,
    pasteHandler: (context) => {
      const items = context.event.clipboardData?.items;
      if (!items) return undefined;
      for (const item of Array.from(items)) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (!blob) continue;
          const mdPath = filePath;
          void (async () => {
            try {
              const bytes = new Uint8Array(await blob.arrayBuffer());
              const { relativeUrl } = await saveMediaFile(mdPath, bytes);
              const name = relativeUrl.split(/[\\/]/).pop() ?? "screenshot";
              await insertEmbedAtCursor(context.editor, "mediaImage", relativeUrl, name);
            } catch (err) {
              console.error("[media] paste image failed", err);
            }
          })();
          return true;
        }
      }
      for (const item of Array.from(items)) {
        if (item.kind === "file") {
          // pdfs, docs and images without an image MIME type go through
          // BlockNote's default file insertion (uses uploadFile above)
          return context.defaultPasteHandler();
        }
      }
      return undefined;
    },
  }) as unknown as BlockNoteEditor;
  const { loaded, error } = useFileContent(editor, filePath);
  const [insertSource, setInsertSource] = useState<string | null>(null);

  const reportWordCount = useRef(onWordCount);
  reportWordCount.current = onWordCount;

  useEditorChange(() => {
    reportWordCount.current?.(countWords(editor));
  }, editor);

  useEffect(() => {
    if (loaded) reportWordCount.current?.(countWords(editor));
  }, [loaded, editor]);

  const openInsertDialog = async () => {
    const file = await openDialog({ multiple: false, filters: MEDIA_FILTERS });
    if (typeof file === "string") setInsertSource(file);
  };

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
        <BlockNoteView editor={editor} theme="dark" className="h-full" slashMenu={false}>
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={async (query) => {
              const defaults = getDefaultReactSlashMenuItems(editor).map((item) =>
                item.title === "Image"
                  ? {
                      ...item,
                      // route the default Image item through our media dialog
                      // so it becomes a mediaImage block like drag & drop
                      onItemClick: () => {
                        void openInsertDialog();
                      },
                    }
                  : item,
              );
              const insertMediaItem = {
                title: "Insert media…",
                group: "Media",
                subtext: "Copy an image, pdf or doc from disk",
                onItemClick: () => {
                  void openInsertDialog();
                },
              };
              // insert at the end of the contiguous "Media" group so the menu
              // doesn't render an unkeyed group label for it
              let mediaEnd = defaults.length;
              for (let i = 0; i < defaults.length; i++) {
                if (defaults[i].group === "Media") mediaEnd = i + 1;
              }
              const items = [
                ...defaults.slice(0, mediaEnd),
                insertMediaItem,
                ...defaults.slice(mediaEnd),
              ];
              return filterSuggestionItems(items, query);
            }}
          />
        </BlockNoteView>
        {ghost.suggestion && (
          <span
            className="pointer-events-none absolute select-none text-fog-500"
            style={{ left: ghost.suggestion.left, top: ghost.suggestion.top }}
          >
            {ghost.suggestion.text}
          </span>
        )}
        {insertSource && (
          <MediaInsertDialog
            sourcePath={insertSource}
            mdFilePath={filePath}
            editor={editor}
            onClose={() => setInsertSource(null)}
          />
        )}
      </div>
    </EmbedMdPathContext.Provider>
  );
}
