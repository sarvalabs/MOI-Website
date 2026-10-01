// SSR entry for build-time static generation (scripts/ssg.mjs).
//
// This mirrors App.jsx's routes with STATIC imports: renderToString cannot
// resolve React.lazy, and the server bundle doesn't need code splitting.
// Keep the route table in sync with src/App.jsx when routes change (the
// ssg script's small-render assertion catches a route that stops matching).
//
// Effects don't run server-side, so canvas animations, GSAP, analytics, and
// anything window-bound initialize only in the browser, exactly as before —
// this renders the markup the client hydrates onto.
//
// The <Suspense> below must stay: App.jsx wraps its routes in one, and
// hydration only matches if the server HTML carries the same boundary.
// Without it every prerendered page throws React error #418 on load and is
// re-rendered from scratch on the client.
import { Suspense } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import HowItWorksPage from "./pages/HowItWorksPageV5";
import ManifestoPage from "./pages/ManifestoPage";
import PapersPage from "./pages/PapersPage";

function ServerApp() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/why-moi" element={<HowItWorksPage />} />
        <Route path="/manifesto" element={<ManifestoPage />} />
        <Route path="/papers" element={<PapersPage />} />
      </Routes>
    </Suspense>
  );
}

export function render(url) {
  return renderToString(
    <StaticRouter location={url}>
      <ServerApp />
    </StaticRouter>
  );
}
