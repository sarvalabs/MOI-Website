// SSR entry for build-time static generation (scripts/ssg.mjs). Renders the
// same tree main.jsx mounts, minus StrictMode (double-render is a dev aid;
// renderToString runs once). Effects don't run server-side, so the canvas
// animations, GSAP, analytics, and chatbot all initialize only in the browser
// exactly as before — this renders the markup they hydrate onto.
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import App from "./App.jsx";

export function render(url) {
  return renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  );
}
