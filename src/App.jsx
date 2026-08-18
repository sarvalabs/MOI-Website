import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { initAnalytics, trackPageView } from "./lib/analytics";
import HomePage from "./pages/HomePage";
import HowItWorksPage from "./pages/HowItWorksPageV5";
import AdminCalendarPage from "./pages/AdminCalendarPage";
import ManifestoPage from "./pages/ManifestoPage";
import PapersPage from "./pages/PapersPage";

export default function App() {
  const { pathname } = useLocation();

  // One page_view per route. Without this the SPA reports a single visit to
  // whichever URL the reader entered on, and every navigation after it is
  // invisible.
  useEffect(() => {
    initAnalytics();
    trackPageView(pathname);
  }, [pathname]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/why-moi" element={<HowItWorksPage />} />
      <Route path="/how-it-works" element={<Navigate to="/why-moi" replace />} />
      <Route path="/manifesto" element={<ManifestoPage />} />
      <Route path="/papers" element={<PapersPage />} />
      <Route path="/admin/calendar" element={<AdminCalendarPage />} />
    </Routes>
  );
}
