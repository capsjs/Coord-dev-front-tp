import { Route, Routes } from "react-router";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { Layout } from "./components/Layout";
import { EventDetailPage } from "./pages/EventDetailPage";
import EventFormPage from "./pages/EventFormPage";
import { EventsPage } from "./pages/EventsPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Pages publiques */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Consultation des événements : accessible à tous */}
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />

        {/* Utilisateurs connectés */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Organisateurs et administrateurs */}
        <Route element={<ProtectedRoute roles={["organizer", "admin"]} />}>
          <Route path="/events/new" element={<EventFormPage />} />
          <Route path="/events/:id/edit" element={<EventFormPage />} />
        </Route>

        {/* Page introuvable */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
