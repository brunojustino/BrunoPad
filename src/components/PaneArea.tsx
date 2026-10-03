import { createContext, useContext, useRef } from "react";
import {
  DockviewReact,
  DockviewReadyEvent,
  DockviewApi,
  DockviewDidDropEvent,
  IDockviewPanelProps,
  type SerializedDockview,
} from "dockview-react";
import "dockview-react/dist/styles/dockview.css";
import { MarkdownEditor } from "./MarkdownEditor";
import { ChatPanel } from "./chat/ChatPanel";
import { FILE_MIME, nameFromPath } from "../lib/panels";

export type WordCountReporter = (filePath: string, count: number) => void;

const WordCountContext = createContext<WordCountReporter>(() => {});

function dropDirection(position: string): "left" | "right" | "above" | "below" | "within" {
  switch (position) {
    case "left":
      return "left";
    case "right":
      return "right";
    case "top":
      return "above";
    case "bottom":
      return "below";
    default:
      return "within";
  }
}

function MarkdownPane(props: IDockviewPanelProps) {
  const filePath = props.params.filePath as string;
  const reportWordCount = useContext(WordCountContext);
  return (
    <div className="h-full overflow-y-auto">
      <MarkdownEditor
        key={filePath}
        filePath={filePath}
        onWordCount={(count) => reportWordCount(filePath, count)}
      />
    </div>
  );
}

function ChatPane() {
  return <ChatPanel />;
}

const components = { markdown: MarkdownPane, chat: ChatPane };

interface PaneAreaProps {
  initialLayout: SerializedDockview | null;
  onLayoutChange: (layout: SerializedDockview) => void;
  onApiReady: (api: DockviewApi) => void;
  onWordCount: WordCountReporter;
}

export function PaneArea(props: PaneAreaProps) {
  const initialLayoutRef = useRef(props.initialLayout);

  const onReady = (event: DockviewReadyEvent) => {
    const { api } = event;
    props.onApiReady(api);
    if (initialLayoutRef.current) {
      try {
        api.fromJSON(initialLayoutRef.current);
      } catch (err) {
        console.error("[panes] restore failed, starting empty", err);
      }
    }
    // accept external HTML5 drags that carry our file payload so dockview
    // shows its VS Code-style drop overlays for them
    api.onUnhandledDragOver((e) => {
      if (e.nativeEvent instanceof DragEvent && e.nativeEvent.dataTransfer?.types.includes(FILE_MIME)) {
        e.accept();
      }
    });
    api.onDidLayoutChange(() => props.onLayoutChange(api.toJSON()));
  };

  const onDidDrop = (event: DockviewDidDropEvent) => {
    if (!(event.nativeEvent instanceof DragEvent)) return;
    const filePath = event.nativeEvent.dataTransfer?.getData(FILE_MIME);
    if (!filePath) return;
    const reference = event.group?.activePanel;
    event.api.addPanel({
      id: `file-${Date.now()}`,
      component: "markdown",
      title: nameFromPath(filePath),
      params: { filePath },
      position:
        reference
          ? { referencePanel: reference, direction: dropDirection(event.position) }
          : undefined,
    });
  };

  return (
    <WordCountContext.Provider value={props.onWordCount}>
      <DockviewReact
        className="dockview-theme-dark h-full"
        components={components}
        onReady={onReady}
        onDidDrop={onDidDrop}
      />
    </WordCountContext.Provider>
  );
}
