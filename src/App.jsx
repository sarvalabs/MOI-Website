import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { trackPageView } from "./lib/analytics";
import HomePage from "./pages/HomePage";

// Route-level code splitting. The home page stays eager (it's the LCP-critical
// entry and should hydrate immediately); every other route loads its own
// chunk. This keeps GSAP + ScrollTrigger — imported only by the why-moi page —
// out of the main bundle entirely.
//
// SSR note: scripts/ssg.mjs renders through src/entry-server.jsx, which uses
// its own STATIC route table (renderToString can't resolve React.lazy). If a
// route is added or moved here, mirror it there.
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPageV5"));
const ManifestoPage = lazy(() => import("./pages/ManifestoPage"));
const PapersPage = lazy(() => import("./pages/PapersPage"));
const AdminCalendarPage = lazy(() => import("./pages/AdminCalendarPage"));

export default function App() {
  const { pathname } = useLocation();

  // One page_view per route. Without this the SPA reports a single visit to
  // whichever URL the reader entered on, and every navigation after it is
  // invisible.
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return (
    // fallback={null} keeps hydration seamless: on a prerendered route React
    // preserves the server-rendered HTML while the route chunk loads, so the
    // reader never sees a blank frame.
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/why-moi" element={<HowItWorksPage />} />
        <Route path="/how-it-works" element={<Navigate to="/why-moi" replace />} />
        <Route path="/manifesto" element={<ManifestoPage />} />
        <Route path="/papers" element={<PapersPage />} />
        <Route path="/admin/calendar" element={<AdminCalendarPage />} />
      </Routes>
    </Suspense>
  );
}
