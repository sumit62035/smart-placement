import { Link, useLocation } from "react-router-dom";

const publicLinks = [
  { to: "/",           label: "Dashboard"     },
  { to: "/departments", label: "Departments"  },
  { to: "/companies",  label: "Companies"     },
  { to: "/trends",     label: "Yearly Trends" },
];

export default function PublicNavbar() {
  const { pathname } = useLocation();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to="/">
          📊 PlacementIQ
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#publicNav"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="publicNav">
          <ul className="navbar-nav ms-auto">
            {publicLinks.map((link) => (
              <li className="nav-item" key={link.to}>
                <Link
                  className={`nav-link ${pathname === link.to ? "active fw-semibold" : ""}`}
                  to={link.to}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="nav-item ms-lg-2">
              <Link className="btn btn-outline-light btn-sm" to="/admin/login">
                Admin Login
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
