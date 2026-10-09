import { useEffect, useState, useCallback } from "react";
import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
} from "../../api";
import CrudToolbar from "../../components/common/CrudToolbar";
import ConfirmModal from "../../components/common/ConfirmModal";
import Toast, { useToast } from "../../components/common/Toast";
import Loader from "../../components/common/Loader";

const EMPTY_FORM = { name: "", code: "" };

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");

  // modal
  const [showModal,  setShowModal]  = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [editId,     setEditId]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState("");

  // confirm delete
  const [confirmId, setConfirmId] = useState(null);

  const { toasts, add: addToast, remove: removeToast } = useToast();

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchDepartments = useCallback(() => {
    setLoading(true);
    getDepartments()
      .then((res) => setDepartments(res.data))
      .catch(() => addToast("Failed to load departments", "error"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  useEffect(() => { fetchDepartments(); }, []);  // eslint-disable-line

  // ── filtered list (client-side — departments are few) ─────────────────────
  const filtered = departments.filter((d) =>
    search.trim() === "" ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  // ── helpers ───────────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM); setEditId(null); setFormError(""); setShowModal(true);
  };
  const openEdit = (d) => {
    setForm({ name: d.name, code: d.code });
    setEditId(d.id); setFormError(""); setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setFormError(""); };

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setFormError("");
    try {
      if (editId) {
        await updateDepartment(editId, form);
        addToast("Department updated successfully");
      } else {
        await createDepartment(form);
        addToast("Department added successfully");
      }
      closeModal();
      fetchDepartments();
    } catch (err) {
      setFormError(err.response?.data?.error || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── delete ────────────────────────────────────────────────────────────────
  const handleDeleteConfirmed = async () => {
    try {
      await deleteDepartment(confirmId);
      addToast("Department deleted");
      setConfirmId(null);
      fetchDepartments();
    } catch (err) {
      addToast(err.response?.data?.error || "Cannot delete — students may be linked to this department", "error");
      setConfirmId(null);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="py-4 px-4 flex-grow-1">
      <CrudToolbar
        title="Manage Departments"
        addLabel="Add Department"
        onAdd={openAdd}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search name or code…"
      />

      {loading ? <Loader /> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Department Name</th>
                  <th>Code</th>
                  <th style={{ width: 90 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      {departments.length === 0
                        ? "No departments yet — add your first one!"
                        : "No departments match your search"}
                    </td>
                  </tr>
                ) : filtered.map((d, i) => (
                  <tr key={d.id}>
                    <td className="text-muted">{i + 1}</td>
                    <td className="fw-semibold">{d.name}</td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary-emphasis border">
                        {d.code}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        title="Edit"
                        onClick={() => openEdit(d)}
                      >
                        <i className="bi bi-pencil" />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        title="Delete"
                        onClick={() => setConfirmId(d.id)}
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {departments.length > 0 && (
            <div className="px-3 py-2 border-top">
              <small className="text-muted">{departments.length} department{departments.length !== 1 ? "s" : ""} total</small>
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Modal ───────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editId ? "Edit Department" : "Add Department"}
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
                    <label className="form-label">
                      Department Name <span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control"
                      required
                      placeholder="e.g. Computer Science"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">
                      Code <span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control"
                      required
                      placeholder="e.g. CSE"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    />
                    <div className="form-text">Short identifier used in reports and analytics.</div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting
                      ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                      : <>{editId ? "Update" : "Add"} Department</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete ─────────────────────────────────────────────────── */}
      <ConfirmModal
        show={!!confirmId}
        title="Delete Department"
        message="This will permanently delete the department. This cannot be done if students are linked to it."
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmId(null)}
      />

      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
}
