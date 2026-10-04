import { Routes, Route } from "react-router-dom";
import NavBar from "./components/layout/NavBar";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DoctorsListPage from "./pages/DoctorsListPage";
import DoctorDetailPage from "./pages/DoctorDetailPage";
import BookingWizardPage from "./pages/BookingWizardPage";
import PatientDashboardPage from "./pages/PatientDashboardPage";
import DoctorDashboardPage from "./pages/DoctorDashboardPage";
import LabTestsPage from "./pages/LabTestsPage";
import AutomationsPage from "./pages/AutomationsPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/doctors" element={<DoctorsListPage />} />
          <Route path="/doctors/:id" element={<DoctorDetailPage />} />
          <Route path="/lab-tests" element={<LabTestsPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/book" element={<BookingWizardPage />} />
          </Route>

          <Route element={<RoleRoute roles={["PATIENT"]} />}>
            <Route path="/dashboard" element={<PatientDashboardPage />} />
          </Route>

          <Route element={<RoleRoute roles={["DOCTOR"]} />}>
            <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
          </Route>

          <Route element={<RoleRoute roles={["DOCTOR", "ADMIN"]} />}>
            <Route path="/automations" element={<AutomationsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}
