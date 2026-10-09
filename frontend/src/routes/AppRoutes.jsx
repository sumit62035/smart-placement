import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";

// Public pages
import Dashboard from "../pages/public/Dashboard";
import DepartmentAnalytics from "../pages/public/DepartmentAnalytics";
import CompanyAnalytics from "../pages/public/CompanyAnalytics";
import YearlyTrends from "../pages/public/YearlyTrends";

// Admin pages
import AdminLogin from "../pages/admin/Login";
import AdminDashboard from "../pages/admin/AdminDashboard";
import Students from "../pages/admin/Students";
import Companies from "../pages/admin/Companies";
import Placements from "../pages/admin/Placements";
import Upload from "../pages/admin/Upload";
import Reports from "../pages/admin/Reports";
import Departments from "../pages/admin/Departments";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/departments" element={<DepartmentAnalytics />} />
        <Route path="/companies" element={<CompanyAnalytics />} />
        <Route path="/trends" element={<YearlyTrends />} />
      </Route>

      {/* Admin login (no layout) */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Protected admin routes */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard"   element={<AdminDashboard />} />
        <Route path="/admin/departments" element={<Departments />} />
        <Route path="/admin/students"    element={<Students />} />
        <Route path="/admin/companies" element={<Companies />} />
        <Route path="/admin/placements" element={<Placements />} />
        <Route path="/admin/upload" element={<Upload />} />
        <Route path="/admin/reports" element={<Reports />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
