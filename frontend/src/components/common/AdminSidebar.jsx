import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const adminLinks = [
  { to: "/admin/dashboard",   label: "Dashboard",   icon: "bi-speedometer2" },
  { to: "/admin/departments", label: "Departments", icon: "bi-diagram-3" },
  { to: "/admin/students",    label: "Students",    icon: "bi-people" },
  { to: "/admin/companies",   label: "Companies",   icon: "bi-building" },
  { to: "/admin/placements",  label: "Placements",  icon: "bi-briefcase" },
  { to: "/admin/upload",      label: "Upload Data", icon: "bi-cloud-upload" },
  { to: "/admin/reports",     label: "Reports",     icon: "bi-file-earmark-bar-graph" },
];

export default function AdminSidebar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div
      className="d-flex flex-column bg-dark text-white p-3"
      style={{ minHeight: "100vh", width: "240px", minWidth: "240px" }}
    >
      <div className="mb-4">
        <h5 className="fw-bold text-primary mb-0">📊 PlacementIQ</h5>
        <small className="text-muted">Admin Portal</small>
      </div>

      {admin && (
        <div className="mb-3 p-2 rounded bg-secondary bg-opacity-25">
          <small className="text-muted">Logged in as</small>
          <div className="fw-semibold">{admin.username}</div>
        </div>
      )}

      <ul className="nav nav-pills flex-column gap-1 flex-grow-1">
        {adminLinks.map((link) => (
          <li key={link.to} className="nav-item">
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                `nav-link text-white d-flex align-items-center gap-2 ${isActive ? "active bg-primary" : ""}`
              }
            >
              <i className={`bi ${link.icon}`} />
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <button
        className="btn btn-outline-danger btn-sm mt-3"
        onClick={handleLogout}
      >
        <i className="bi bi-box-arrow-right me-1" />
        Logout
      </button>
    </div>
  );
}
