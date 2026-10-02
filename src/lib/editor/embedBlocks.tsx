import {
  BlockNoteSchema,
  defaultBlockSpecs,
} from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { createContext, useContext } from "react";
import { invoke } from "@tauri-apps/api/core";
import { joinPath, parentPath } from "../explorer";

const PDF_EXTS = new Set(["pdf"]);
const DOC_EXTS = new Set(["doc", "docx", "odt", "xls", "xlsx", "ods", "ppt", "pptx", "odp", "rtf"]);

function extOf(src: string): string {
  const clean = src.split(/[?#]/)[0];
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : "";
}

export const EmbedMdPathContext = createContext<string | null>(null);

interface EmbedProps {
  url: string;
  name: string;
}

interface ResizableProps extends EmbedProps {
  width: string;
}

interface PdfProps extends EmbedProps {
  width: string;
  height: string;
}

function startResize(
  e: React.MouseEvent,
  apply: (dx: number, dy: number) => void,
) {
  e.preventDefault();
  e.stopPropagation();
  const startX = e.clientX;
  const startY = e.clientY;
  const move = (ev: MouseEvent) => apply(ev.clientX - startX, ev.clientY - startY);
  const up = () => {
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", move);
    window.removeEventListener("mouseup", up);
  };
  document.body.style.cursor = "nwse-resize";
  document.body.style.userSelect = "none";
  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);
}

const createMediaImage = createReactBlockSpec(
  {
    type: "mediaImage",
    propSchema: {
      url: { default: "" },
      name: { default: "" },
      width: { default: "" },
    },
    content: "none",
  },
  {
    runsBefore: ["image"],
    toExternalHTML: ({ block }) => {
      const p = block.props as unknown as ResizableProps;
      const w = Number(p.width) || undefined;
      return <img src={p.url} alt={p.name} width={w} />;
    },
    parse: (element) => {
      if (element.tagName !== "IMG") return undefined;
      const src = element.getAttribute("src") ?? "";
      if (!src) return undefined;
      const ext = extOf(src);
      if (PDF_EXTS.has(ext) || DOC_EXTS.has(ext)) return undefined;
      const width = parseFloat(element.getAttribute("width") ?? "");
      return {
        url: src,
        name: element.getAttribute("alt") ?? "",
        ...(Number.isFinite(width) && width > 0 ? { width: String(Math.round(width)) } : {}),
      };
    },
    render: ({ block, editor }) => {
      const p = block.props as unknown as ResizableProps;
      const startW = Number(p.width) || 0;
      return (
        <div className="relative my-1 inline-block max-w-full">
          <img
            src={p.url}
            alt={p.name}
            draggable={false}
            style={startW > 0 ? { width: `${startW}px` } : undefined}
            className="max-w-full rounded border border-line align-middle"
          />
          <span
            className="absolute bottom-0 right-0 h-3 w-3 cursor-nwse-resize rounded-sm bg-brass-400/40 hover:bg-brass-400/70"
            onMouseDown={(e) =>
              startResize(e, (dx) => {
                const base = startW > 0 ? startW : (e.currentTarget.previousElementSibling as HTMLImageElement)?.offsetWidth ?? 300;
                void editor.updateBlock(block, {
                  props: { width: String(Math.max(120, Math.round(base + dx))) },
                } as never);
              })
            }
          />
        </div>
      );
    },
  },
);

const createMediaPdf = createReactBlockSpec(
  {
    type: "mediaPdf",
    propSchema: {
      url: { default: "" },
      name: { default: "" },
      width: { default: "640" },
      height: { default: "480" },
    },
    content: "none",
  },
  {
    runsBefore: ["image"],
    toExternalHTML: ({ block }) => {
      const p = block.props as unknown as ResizableProps;
      return <img src={p.url} alt={p.name} />;
    },
    parse: (element) => {
      if (element.tagName !== "IMG") return undefined;
      const src = element.getAttribute("src") ?? "";
      if (!PDF_EXTS.has(extOf(src))) return undefined;
      return { url: src, name: element.getAttribute("alt") ?? "" };
    },
    render: ({ block, editor }) => {
      const p = block.props as unknown as PdfProps;
      const w = Number(p.width) || 640;
      const h = Number(p.height) || 480;
      return (
        <div className="relative my-2">
          {p.url ? (
            <iframe
              src={p.url}
              title={p.name}
              style={{ width: `${w}px`, height: `${h}px` }}
              className="rounded border border-line bg-ink-950"
            />
          ) : (
            <div style={{ width: `${w}px`, height: `${h}px` }} className="rounded border border-line" />
          )}
          <span
            className="absolute right-0 h-3 w-3 cursor-nwse-resize rounded-sm bg-brass-400/40 hover:bg-brass-400/70"
            style={{ bottom: 0 }}
            onMouseDown={(e) =>
              startResize(e, (dx, dy) => {
                void editor.updateBlock(block, {
                  props: {
                    width: String(Math.max(240, w + dx)),
                    height: String(Math.max(180, h + dy)),
                  },
                } as never);
              })
            }
          />
          <span
            className="absolute bottom-0 left-1/2 h-2 w-8 -translate-x-1/2 cursor-ns-resize rounded-sm bg-brass-400/40 hover:bg-brass-400/70"
            onMouseDown={(e) =>
              startResize(e, (_dx, dy) => {
                void editor.updateBlock(block, {
                  props: { height: String(Math.max(180, h + dy)) },
                } as never);
              })
            }
          />
        </div>
      );
    },
  },
);

function DocChip({ url, name }: { url: string; name: string }) {
  const mdPath = useContext(EmbedMdPathContext);
  const openChip = () => {
    if (!url) return;
    const absolute =
      /^[A-Za-z]:[\\/]/.test(url) || url.startsWith("/")
        ? url
        : mdPath
          ? joinPath(parentPath(mdPath), url)
          : null;
    if (!absolute) return;
    void invoke("open_media_path", { path: absolute }).catch((err) =>
      console.error("[media] open failed", err),
    );
  };
  return (
    <button
      type="button"
      onClick={openChip}
      className="my-1 inline-flex items-center gap-2 rounded border border-line bg-ink-900 px-2 py-1 text-xs text-fog-200 hover:bg-ink-800 hover:text-fog-100"
      title="Open in system app"
    >
      <span className="rounded bg-ink-700 px-1 py-0.5 text-[10px] uppercase text-fog-400">
        {extOf(name || url) || "doc"}
      </span>
      <span className="truncate">{name || url}</span>
    </button>
  );
}

const createMediaDoc = createReactBlockSpec(
  {
    type: "mediaDoc",
    propSchema: {
      url: { default: "" },
      name: { default: "" },
    },
    content: "none",
  },
  {
    runsBefore: ["paragraph"],
    toExternalHTML: ({ block }) => {
      const p = block.props as unknown as EmbedProps;
      return <a href={p.url}>{p.name}</a>;
    },
    parse: (element) => {
      if (element.tagName !== "P") return undefined;
      if (element.children.length !== 1) return undefined;
      const link = element.children[0];
      if (link.tagName !== "A") return undefined;
      const href = link.getAttribute("href") ?? "";
      if (!DOC_EXTS.has(extOf(href))) return undefined;
      return { url: href, name: link.textContent?.trim() || "" };
    },
    render: ({ block }) => {
      const p = block.props as unknown as EmbedProps;
      return <DocChip url={p.url} name={p.name} />;
    },
  },
);

export const schemaWithEmbeds = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    mediaImage: createMediaImage(),
    mediaPdf: createMediaPdf(),
    mediaDoc: createMediaDoc(),
  },
});
