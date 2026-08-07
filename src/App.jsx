import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import HowItWorksPage from "./pages/HowItWorksPageV5";
import AdminCalendarPage from "./pages/AdminCalendarPage";
import ManifestoPage from "./pages/ManifestoPage";
import PapersPage from "./pages/PapersPage";

export default function App() {
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
