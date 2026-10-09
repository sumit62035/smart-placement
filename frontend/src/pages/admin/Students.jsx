import { useEffect, useState, useRef, useCallback } from "react";
import {
  getStudents, getDepartments,
  createStudent, updateStudent, deleteStudent,
} from "../../api";
import Loader from "../../components/common/Loader";
import CrudToolbar from "../../components/common/CrudToolbar";
import Paginator from "../../components/common/Paginator";
import ConfirmModal from "../../components/common/ConfirmModal";
import Toast, { useToast } from "../../components/common/Toast";

const EMPTY_FORM = {
  name: "", roll_number: "", email: "",
  department_id: "", batch_year: "", cgpa: "", status: "unplaced",
};

const STATUS_BADGE = {
  placed:    "bg-success",
  unplaced:  "bg-danger",
  opted_out: "bg-secondary",
};

export default function Students() {
  const [students,    setStudents]    = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [meta,        setMeta]        = useState({ total: 0, pages: 1 });

  // search + filters
  const [search,    setSearch]    = useState("");
  const [filters,   setFilters]   = useState({ department_id: "", status: "", batch_year: "" });
  const debounceRef = useRef(null);

  // modal
  const [showModal,   setShowModal]   = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [editId,      setEditId]      = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState("");

  // confirm-delete
  const [confirmId,   setConfirmId]   = useState(null);

  const { toasts, add: addToast, remove: removeToast } = useToast();

  // ── fetch ────────────────────────────────────────────────────────────────
  const fetchStudents = useCallback((pg = page) => {
    setLoading(true);
    const params = { page: pg, per_page: 15 };
    if (search.trim())          params.search        = search.trim();
    if (filters.department_id)  params.department_id = filters.department_id;
    if (filters.status)         params.status        = filters.status;
    if (filters.batch_year)     params.batch_year    = filters.batch_year;
    getStudents(params)
      .then((res) => {
        setStudents(res.data.students);
        setMeta({ total: res.data.total, pages: res.data.pages });
      })
      .catch(() => addToast("Failed to load students", "error"))
      .finally(() => setLoading(false));
  }, [page, search, filters]); // eslint-disable-line

  useEffect(() => {
    getDepartments()
      .then((res) => setDepartments(res.data))
      .catch(() => {});
  }, []);

  // debounce search; reset to page 1
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); fetchStudents(1); }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]); // eslint-disable-line

  // filters or page change — immediate
  useEffect(() => { fetchStudents(page); }, [page, filters]); // eslint-disable-line

  // ── helpers ──────────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM); setEditId(null); setFormError(""); setShowModal(true);
  };
  const openEdit = (s) => {
    setForm({
      name: s.name, roll_number: s.roll_number, email: s.email,
      department_id: s.department_id, batch_year: s.batch_year,
      cgpa: s.cgpa ?? "", status: s.status,
    });
    setEditId(s.id); setFormError(""); setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setFormError(""); };

  const handleFilterChange = (key, val) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  // ── submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setFormError("");
    try {
      if (editId) {
        await updateStudent(editId, form);
        addToast("Student updated successfully");
      } else {
        await createStudent(form);
        addToast("Student added successfully");
      }
      closeModal();
      fetchStudents(editId ? page : 1);
      if (!editId) setPage(1);
    } catch (err) {
      const msg = err.response?.data?.error || "Operation failed";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── delete ───────────────────────────────────────────────────────────────
  const handleDeleteConfirmed = async () => {
    try {
      await deleteStudent(confirmId);
      addToast("Student deleted");
      setConfirmId(null);
      fetchStudents(page);
    } catch (err) {
      addToast(err.response?.data?.error || "Delete failed", "error");
      setConfirmId(null);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="py-4 px-4 flex-grow-1">
      <CrudToolbar
        title="Manage Students"
        addLabel="Add Student"
        onAdd={openAdd}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search name, roll or email…"
      >
        <select
          className="form-select form-select-sm"
          style={{ width: 160 }}
          value={filters.department_id}
          onChange={(e) => handleFilterChange("department_id", e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <select
          className="form-select form-select-sm"
          style={{ width: 130 }}
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
        >
          <option value="">All Status</option>
          <option value="placed">Placed</option>
          <option value="unplaced">Unplaced</option>
          <option value="opted_out">Opted Out</option>
        </select>

        <input
          type="number"
          className="form-control form-control-sm"
          style={{ width: 110 }}
          placeholder="Batch Year"
          value={filters.batch_year}
          onChange={(e) => handleFilterChange("batch_year", e.target.value)}
        />
      </CrudToolbar>

      {loading ? <Loader /> : (
        <>
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Name</th><th>Roll No.</th><th>Email</th>
                    <th>Department</th><th>Batch</th><th>CGPA</th>
                    <th>Status</th><th style={{ width: 90 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-4">
                        No students found
                      </td>
                    </tr>
                  ) : students.map((s) => (
                    <tr key={s.id}>
                      <td className="fw-semibold">{s.name}</td>
                      <td className="text-muted font-monospace">{s.roll_number}</td>
                      <td className="text-muted small">{s.email}</td>
                      <td>{s.department || "—"}</td>
                      <td>{s.batch_year}</td>
                      <td>{s.cgpa ?? "—"}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[s.status] ?? "bg-secondary"}`}>
                          {s.status.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          title="Edit"
                          onClick={() => openEdit(s)}
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          title="Delete"
                          onClick={() => setConfirmId(s.id)}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Paginator
            page={page} pages={meta.pages} total={meta.total}
            label="students" onPage={setPage}
          />
        </>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editId ? "Edit Student" : "Add Student"}
                </h5>
                <button className="btn-close" onClick={closeModal} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body row g-3">
                  {formError && (
                    <div className="col-12">
                      <div className="alert alert-danger py-2 small mb-0">{formError}</div>
                    </div>
                  )}
                  <div className="col-md-6">
                    <label className="form-label">Full Name <span className="text-danger">*</span></label>
                    <input className="form-control" required value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Roll Number <span className="text-danger">*</span></label>
                    <input className="form-control" required value={form.roll_number}
                      onChange={(e) => setForm({ ...form, roll_number: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email <span className="text-danger">*</span></label>
                    <input type="email" className="form-control" required value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Department <span className="text-danger">*</span></label>
                    <select className="form-select" required value={form.department_id}
                      onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
                      <option value="">Select department…</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Batch Year <span className="text-danger">*</span></label>
                    <input type="number" className="form-control" required
                      min={2000} max={2100} value={form.batch_year}
                      onChange={(e) => setForm({ ...form, batch_year: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">CGPA</label>
                    <input type="number" step="0.01" min={0} max={10}
                      className="form-control" value={form.cgpa}
                      onChange={(e) => setForm({ ...form, cgpa: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="unplaced">Unplaced</option>
                      <option value="placed">Placed</option>
                      <option value="opted_out">Opted Out</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting
                      ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                      : <>{editId ? "Update" : "Add"} Student</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete ───────────────────────────────────────────────── */}
      <ConfirmModal
        show={!!confirmId}
        title="Delete Student"
        message="This will permanently delete the student and all their placement records. This action cannot be undone."
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmId(null)}
      />

      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
}
