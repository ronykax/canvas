import { createRoot } from "react-dom/client";

import "./index.css";
import { App } from "./app";

const root = document.querySelector("#root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(<App />);
