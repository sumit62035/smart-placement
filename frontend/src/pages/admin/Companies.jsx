import { useEffect, useState, useRef, useCallback } from "react";
import {
  getCompanies, createCompany, updateCompany, deleteCompany,
} from "../../api";
import Loader from "../../components/common/Loader";
import CrudToolbar from "../../components/common/CrudToolbar";
import Paginator from "../../components/common/Paginator";
import ConfirmModal from "../../components/common/ConfirmModal";
import Toast, { useToast } from "../../components/common/Toast";

const EMPTY_FORM = {
  name: "", sector: "", location: "", package_min: "", package_max: "",
};

const SECTORS = [
  "IT", "Finance", "Healthcare", "Manufacturing",
  "Consulting", "Analytics", "E-Commerce", "Telecom", "Other",
];

export default function Companies() {
  const [companies,  setCompanies]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [meta,       setMeta]       = useState({ total: 0, pages: 1 });

  // search
  const [search,     setSearch]     = useState("");
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

  // ── fetch ────────────────────────────────────────────────────────────────
  // NOTE: getCompanies returns { companies, total, pages, current_page }
  const fetchCompanies = useCallback((pg = page) => {
    setLoading(true);
    const params = { page: pg, per_page: 15 };
    if (search.trim()) params.search = search.trim();
    getCompanies(params)
      .then((res) => {
        // response is paginated: res.data = { companies, total, pages, current_page }
        setCompanies(res.data.companies);
        setMeta({ total: res.data.total, pages: res.data.pages });
      })
      .catch(() => addToast("Failed to load companies", "error"))
      .finally(() => setLoading(false));
  }, [page, search]); // eslint-disable-line

  // debounce search → reset to page 1
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); fetchCompanies(1); }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]); // eslint-disable-line

  // page change — immediate
  useEffect(() => { fetchCompanies(page); }, [page]); // eslint-disable-line

  // ── helpers ──────────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM); setEditId(null); setFormError(""); setShowModal(true);
  };
  const openEdit = (c) => {
    setForm({
      name:        c.name,
      sector:      c.sector      ?? "",
      location:    c.location    ?? "",
      package_min: c.package_min ?? "",
      package_max: c.package_max ?? "",
    });
    setEditId(c.id); setFormError(""); setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setFormError(""); };

  // ── submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setFormError("");
    try {
      if (editId) {
        await updateCompany(editId, form);
        addToast("Company updated successfully");
      } else {
        await createCompany(form);
        addToast("Company added successfully");
      }
      closeModal();
      fetchCompanies(editId ? page : 1);
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
      await deleteCompany(confirmId);
      addToast("Company deleted");
      setConfirmId(null);
      fetchCompanies(page);
    } catch (err) {
      addToast(err.response?.data?.error || "Delete failed", "error");
      setConfirmId(null);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="py-4 px-4 flex-grow-1">
      <CrudToolbar
        title="Manage Companies"
        addLabel="Add Company"
        onAdd={openAdd}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search company name or sector…"
      />

      {loading ? <Loader /> : (
        <>
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Company</th><th>Sector</th><th>Location</th>
                    <th>Min (LPA)</th><th>Max (LPA)</th>
                    <th style={{ width: 90 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">
                        No companies found
                      </td>
                    </tr>
                  ) : companies.map((c) => (
                    <tr key={c.id}>
                      <td className="fw-semibold">{c.name}</td>
                      <td>
                        {c.sector
                          ? <span className="badge bg-secondary-subtle text-secondary-emphasis border">{c.sector}</span>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td className="text-muted">{c.location || "—"}</td>
                      <td>{c.package_min != null ? `₹${c.package_min}` : "—"}</td>
                      <td>{c.package_max != null ? `₹${c.package_max}` : "—"}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          title="Edit"
                          onClick={() => openEdit(c)}
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          title="Delete"
                          onClick={() => setConfirmId(c.id)}
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
            label="companies" onPage={setPage}
          />
        </>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editId ? "Edit Company" : "Add Company"}
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
                  <div className="col-12">
                    <label className="form-label">Company Name <span className="text-danger">*</span></label>
                    <input className="form-control" required value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Sector</label>
                    <select className="form-select" value={form.sector}
                      onChange={(e) => setForm({ ...form, sector: e.target.value })}>
                      <option value="">Select sector…</option>
                      {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Location</label>
                    <input className="form-control" value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Min Package (LPA)</label>
                    <div className="input-group">
                      <span className="input-group-text">₹</span>
                      <input type="number" step="0.01" min={0} className="form-control"
                        value={form.package_min}
                        onChange={(e) => setForm({ ...form, package_min: e.target.value })} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Max Package (LPA)</label>
                    <div className="input-group">
                      <span className="input-group-text">₹</span>
                      <input type="number" step="0.01" min={0} className="form-control"
                        value={form.package_max}
                        onChange={(e) => setForm({ ...form, package_max: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting
                      ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                      : <>{editId ? "Update" : "Add"} Company</>
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
        title="Delete Company"
        message="This will permanently remove the company. Any placements linked to this company will also be removed. This action cannot be undone."
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmId(null)}
      />

      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
}
