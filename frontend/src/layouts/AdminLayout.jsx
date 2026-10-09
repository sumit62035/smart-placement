import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/common/AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <AdminSidebar />
      <div className="flex-grow-1 bg-light overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
