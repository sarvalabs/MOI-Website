import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import "./styles/mobile.css";

const root = document.getElementById("root");
const tree = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Prerendered routes (scripts/ssg.mjs) arrive with markup already in #root —
// hydrate it so the first paint is the server HTML. Non-prerendered routes
// (/admin, the /how-it-works redirect, unknown URLs) are served the homepage
// file as a fallback; the inline guard ssg.mjs puts after #root has already
// emptied it by the time this runs, so they mount from empty. A hydration
// mismatch (e.g. content drift) makes React fall back to a client render.
if (root.hasChildNodes()) {
  hydrateRoot(root, tree);
} else {
  createRoot(root).render(tree);
}
