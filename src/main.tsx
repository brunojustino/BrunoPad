import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// StrictMode is disabled: its dev double-mount breaks react-dnd
// ("two HTML5 backends"), which react-mosaic's pane dragging relies on.
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
