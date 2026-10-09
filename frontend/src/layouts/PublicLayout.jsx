import { Outlet } from "react-router-dom";
import PublicNavbar from "../components/common/PublicNavbar";

export default function PublicLayout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <PublicNavbar />
      <main className="flex-grow-1 bg-light">
        <Outlet />
      </main>
      <footer className="bg-dark text-white text-center py-3 small">
        © {new Date().getFullYear()} Smart College Placement Analytics & Management System
      </footer>
    </div>
  );
}
