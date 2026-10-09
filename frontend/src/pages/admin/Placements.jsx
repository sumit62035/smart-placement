import { useEffect, useState, useRef, useCallback } from "react";
import {
  getPlacements, getStudents, getCompanies,
  createPlacement, updatePlacement, deletePlacement,
} from "../../api";
import Loader from "../../components/common/Loader";
import CrudToolbar from "../../components/common/CrudToolbar";
import Paginator from "../../components/common/Paginator";
import ConfirmModal from "../../components/common/ConfirmModal";
import Toast, { useToast } from "../../components/common/Toast";

const EMPTY_FORM = {
  student_id: "", company_id: "", package_lpa: "",
  role: "", offer_date: "", year: new Date().getFullYear(),
};

export default function Placements() {
  const [placements, setPlacements] = useState([]);
  const [students,   setStudents]   = useState([]);   // for modal dropdown
  const [companies,  setCompanies]  = useState([]);   // for modal dropdown
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [meta,       setMeta]       = useState({ total: 0, pages: 1 });

  // search + year filter
  const [search,    setSearch]    = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const debounceRef = useRef(null);

  // modal
  const [showModal,  setShowModal]  = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [editId,     setEditId]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState("");

  // confirm-delete
  const [confirmId,  setConfirmId]  = useState(null);

  const { toasts, add: addToast, remove: removeToast } = useToast();

  // ── fetch placements ──────────────────────────────────────────────────────
  const fetchPlacements = useCallback((pg = page) => {
    setLoading(true);
    const params = { page: pg, per_page: 15 };
    if (search.trim()) params.search = search.trim();
    if (yearFilter)    params.year   = yearFilter;
    getPlacements(params)
      .then((res) => {
        setPlacements(res.data.placements);
        setMeta({ total: res.data.total, pages: res.data.pages });
      })
      .catch(() => addToast("Failed to load placements", "error"))
      .finally(() => setLoading(false));
  }, [page, search, yearFilter]); // eslint-disable-line

  // load dropdown data once
  useEffect(() => {
    // Students — fetch up to 500 for the dropdown
    getStudents({ per_page: 500 })
      .then((res) => setStudents(res.data.students))
      .catch(() => {});
    // Companies — paginated response: extract .companies
    getCompanies({ per_page: 500 })
      .then((res) => setCompanies(res.data.companies))
      .catch(() => {});
  }, []);

  // debounce search → reset to page 1
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); fetchPlacements(1); }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]); // eslint-disable-line

  // page or year filter — immediate
  useEffect(() => { fetchPlacements(page); }, [page, yearFilter]); // eslint-disable-line

  // ── helpers ──────────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM); setEditId(null); setFormError(""); setShowModal(true);
  };
  const openEdit = (p) => {
    setForm({
      student_id:  p.student_id,
      company_id:  p.company_id,
      package_lpa: p.package_lpa,
      role:        p.role       ?? "",
      offer_date:  p.offer_date ?? "",
      year:        p.year,
    });
    setEditId(p.id); setFormError(""); setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setFormError(""); };

  const handleYearFilter = (val) => { setYearFilter(val); setPage(1); };

  // ── submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setFormError("");
    try {
      if (editId) {
        await updatePlacement(editId, form);
        addToast("Placement updated successfully");
      } else {
        await createPlacement(form);
        addToast("Placement added successfully");
      }
      closeModal();
      fetchPlacements(editId ? page : 1);
      if (!editId) setPage(1);
    } catch (err) {
      setFormError(err.response?.data?.error || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── delete ───────────────────────────────────────────────────────────────
  const handleDeleteConfirmed = async () => {
    try {
      await deletePlacement(confirmId);
      addToast("Placement record deleted");
      setConfirmId(null);
      fetchPlacements(page);
    } catch (err) {
      addToast(err.response?.data?.error || "Delete failed", "error");
      setConfirmId(null);
    }
  };

  // derive year options from current records for the filter dropdown
  const years = [...new Set(placements.map((p) => p.year))].sort((a, b) => b - a);

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="py-4 px-4 flex-grow-1">
      <CrudToolbar
        title="Manage Placements"
        addLabel="Add Placement"
        onAdd={openAdd}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search student, company or role…"
      >
        <select
          className="form-select form-select-sm"
          style={{ width: 120 }}
          value={yearFilter}
          onChange={(e) => handleYearFilter(e.target.value)}
        >
          <option value="">All Years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </CrudToolbar>

      {loading ? <Loader /> : (
        <>
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Student</th><th>Company</th><th>Role</th>
                    <th>Package (LPA)</th><th>Year</th><th>Offer Date</th>
                    <th style={{ width: 90 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {placements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">
                        No placement records found
                      </td>
                    </tr>
                  ) : placements.map((p) => (
                    <tr key={p.id}>
                      <td className="fw-semibold">{p.student_name}</td>
                      <td>{p.company_name}</td>
                      <td className="text-muted">{p.role || "—"}</td>
                      <td>
                        <span className="fw-semibold text-success">₹{p.package_lpa}</span>
                      </td>
                      <td>{p.year}</td>
                      <td className="text-muted">{p.offer_date || "—"}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          title="Edit"
                          onClick={() => openEdit(p)}
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          title="Delete"
                          onClick={() => setConfirmId(p.id)}
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
            label="placement records" onPage={setPage}
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
                  {editId ? "Edit Placement" : "Add Placement"}
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
                    <label className="form-label">Student <span className="text-danger">*</span></label>
                    <select className="form-select" required value={form.student_id}
                      onChange={(e) => setForm({ ...form, student_id: e.target.value })}>
                      <option value="">Select student…</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Company <span className="text-danger">*</span></label>
                    <select className="form-select" required value={form.company_id}
                      onChange={(e) => setForm({ ...form, company_id: e.target.value })}>
                      <option value="">Select company…</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Package (LPA) <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <span className="input-group-text">₹</span>
                      <input type="number" step="0.01" min={0} className="form-control" required
                        value={form.package_lpa}
                        onChange={(e) => setForm({ ...form, package_lpa: e.target.value })} />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Role</label>
                    <input className="form-control" placeholder="e.g. Software Engineer"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Year <span className="text-danger">*</span></label>
                    <input type="number" className="form-control" required
                      min={2000} max={2100} value={form.year}
                      onChange={(e) => setForm({ ...form, year: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Offer Date</label>
                    <input type="date" className="form-control" value={form.offer_date}
                      onChange={(e) => setForm({ ...form, offer_date: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting
                      ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                      : <>{editId ? "Update" : "Add"} Placement</>
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
        title="Delete Placement"
        message="This will permanently remove this placement record. This action cannot be undone."
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmId(null)}
      />

      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
}
