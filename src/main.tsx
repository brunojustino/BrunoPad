import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// StrictMode re-enabled once react-dnd (which broke on its dev
// double-mount) left the tree with dockview (ADR-0006).
ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
