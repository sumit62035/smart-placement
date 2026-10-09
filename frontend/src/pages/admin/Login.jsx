import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ username: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.username.trim(), form.password);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm border-0" style={{ width: "420px" }}>
        <div className="card-body p-4">

          {/* Header */}
          <div className="text-center mb-4">
            <div
              className="bg-primary bg-opacity-10 rounded-3 d-inline-flex align-items-center
                          justify-content-center mb-3"
              style={{ width: 56, height: 56 }}
            >
              <i className="bi bi-shield-lock-fill text-primary fs-4" />
            </div>
            <h5 className="fw-bold mb-0">PlacementIQ Admin</h5>
            <p className="text-muted small mt-1">Sign in to manage placement data</p>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small">
              <i className="bi bi-exclamation-circle-fill" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Username</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-person text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Enter username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold small">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-lock text-muted" />
                </span>
                <input
                  type={showPwd ? "text" : "password"}
                  className="form-control border-start-0 border-end-0 ps-0"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-group-text bg-light"
                  onClick={() => setShowPwd((v) => !v)}
                  tabIndex={-1}
                  title={showPwd ? "Hide password" : "Show password"}
                >
                  <i className={`bi ${showPwd ? "bi-eye-slash" : "bi-eye"} text-muted`} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading && <span className="spinner-border spinner-border-sm me-2" />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Back to public */}
          <div className="text-center mt-3">
            <Link to="/" className="text-muted small text-decoration-none">
              <i className="bi bi-arrow-left me-1" />Back to public dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
