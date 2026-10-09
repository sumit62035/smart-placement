import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401 (expired / revoked / invalid token)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const is401 = err.response?.status === 401;
    const isLoginRoute = err.config?.url?.includes("/auth/login");
    if (is401 && !isLoginRoute) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("admin");
      window.location.href = "/admin/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────
export const loginAdmin  = (data) => api.post("/auth/login", data);
export const logoutAdmin = ()     => api.post("/auth/logout");
export const getMe       = ()     => api.get("/auth/me");

// ── Analytics (public) ────────────────────────────────────────────────────
export const getDashboard            = (params) => api.get("/analytics/dashboard",            { params });
export const getDepartmentAnalytics  = (params) => api.get("/analytics/departments",          { params });
export const getDepartmentTrends     = ()       => api.get("/analytics/departments/trends");
export const getCompanyAnalytics     = (params) => api.get("/analytics/companies",            { params });
export const getCompanySectors       = (params) => api.get("/analytics/companies/sectors",    { params });
export const getCompanyTrends        = (params) => api.get("/analytics/companies/trends",     { params });
export const getYearlyTrends         = ()       => api.get("/analytics/trends");

// ── Departments ───────────────────────────────────────────────────────────
export const getDepartments = () => api.get("/departments");
export const createDepartment = (data) => api.post("/departments", data);
export const updateDepartment = (id, data) => api.put(`/departments/${id}`, data);
export const deleteDepartment = (id) => api.delete(`/departments/${id}`);

// ── Students ──────────────────────────────────────────────────────────────
export const getStudents = (params) => api.get("/students", { params });
export const createStudent = (data) => api.post("/students", data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}`);

// ── Companies ─────────────────────────────────────────────────────────────
export const getCompanies = (params) => api.get("/companies", { params });
export const createCompany = (data) => api.post("/companies", data);
export const updateCompany = (id, data) => api.put(`/companies/${id}`, data);
export const deleteCompany = (id) => api.delete(`/companies/${id}`);

// ── Placements ────────────────────────────────────────────────────────────
export const getPlacements = (params) => api.get("/placements", { params });
export const createPlacement = (data) => api.post("/placements", data);
export const updatePlacement = (id, data) => api.put(`/placements/${id}`, data);
export const deletePlacement = (id) => api.delete(`/placements/${id}`);

// ── Uploads ───────────────────────────────────────────────────────────────
export const uploadFile = (formData) =>
  api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const getUploads  = ()  => api.get("/upload");
export const getUpload   = (id) => api.get(`/upload/${id}`);

// ── Reports ───────────────────────────────────────────────────────────────
export const getReports = () => api.get("/reports");
export const generateReport = (data) => api.post("/reports/generate", data);
export const downloadReport = (id) =>
  api.get(`/reports/${id}/download`, { responseType: "blob" });

export default api;
