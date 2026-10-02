import { useCallback, useEffect, useRef, useState } from "react";
import type { BlockNoteEditor } from "@blocknote/core";
import { useEditorChange } from "@blocknote/react";
import { getApiKey, getProviderConfig, type AiProviderConfig } from "./settings";
import { aiPostJson } from "./aiHttpClient";

const PAUSE_MS = 800;
const TAIL_CHARS = 4000;
const MAX_TOKENS = 48;

export interface GhostSuggestion {
  text: string;
  left: number;
  top: number;
}

interface CompletionResponse {
  choices: { message?: { content?: string } }[];
}

async function requestGhostText(
  tail: string,
  config: AiProviderConfig,
): Promise<string | null> {
  const res = await aiPostJson(
    config,
    "/chat/completions",
    {
      model: config.chatModel,
      stream: false,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: "system",
          content:
            "You are a text autocomplete engine. Continue the document with ONE " +
            "short line (max 10 words). Reply with ONLY the continuation text - " +
            "no quotes, no explanation, no markdown.",
        },
        { role: "user", content: tail },
      ],
    },
    "ghost request",
  );
  const json = (await res.json()) as CompletionResponse;
  const text = json.choices?.[0]?.message?.content;
  if (typeof text !== "string") return null;
  return text.split(/\r?\n/, 1)[0].trim() || null;
}

export function useGhostText(editor: BlockNoteEditor) {
  const [suggestion, setSuggestion] = useState<GhostSuggestion | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const requestRef = useRef(0);
  const suppressRef = useRef(true);

  const clearSuggestion = useCallback(() => {
    requestRef.current++;
    setSuggestion(null);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const request = async () => {
    const view = editor.prosemirrorView;
    if (!view) return;
    const state = view.state;
    const head = state.selection.head;
    const $head = state.doc.resolve(head);
    if (!$head.parent.isTextblock) return;
    if (!state.selection.empty) return;
    const textBefore = state.doc.textBetween($head.start(), head, "\n", "\uFFFC");
    const charBefore = textBefore.slice(-1);
    if (charBefore !== "" && !/[\s\p{P}]/u.test(charBefore)) return;
    const md = await editor.blocksToMarkdownLossy(editor.document);
    const tail = md.length > TAIL_CHARS ? md.slice(-TAIL_CHARS) : md;
    if (!tail.trim()) return;
    const cfg = await getProviderConfig();
    if (cfg.provider === "openrouter" && !getApiKey(cfg.provider)) return;
    const id = ++requestRef.current;
    const coords = view.coordsAtPos(head);
    const domRect = (editor.domElement ?? view.dom).getBoundingClientRect();
    try {
      const text = await requestGhostText(tail, cfg);
      if (id !== requestRef.current) return;
      if (!text) return;
      if (view.state.selection.head !== head) return;
      setSuggestion({
        text,
        left: coords.left - domRect.left,
        top: coords.bottom - domRect.top,
      });
    } catch (err) {
      console.warn("[ai] ghost request failed", err);
    }
  };

  const schedule = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void request();
    }, PAUSE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  useEditorChange(() => {
    setSuggestion(null);
    if (suppressRef.current) {
      suppressRef.current = false;
      return;
    }
    schedule();
  }, editor);

  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
      if (!suggestion) return;
      if (e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        suppressRef.current = true;
        editor.insertInlineContent(suggestion.text);
        setSuggestion(null);
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        clearSuggestion();
      }
    },
    [suggestion, editor, clearSuggestion],
  );

  return { suggestion, handleKeydown };
}
