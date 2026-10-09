import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, sessionChecked } = useAuth();

  // Wait for the /auth/me check to finish before deciding to redirect.
  // Prevents a false redirect on hard-refresh while the token is valid.
  if (!sessionChecked) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Checking session…</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
}
