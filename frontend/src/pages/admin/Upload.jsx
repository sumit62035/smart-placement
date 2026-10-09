import { useEffect, useRef, useState } from "react";
import { uploadFile, getUploads } from "../../api";
import Loader from "../../components/common/Loader";

// ── helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = { processed: "success", failed: "danger", pending: "warning text-dark" };
  return <span className={`badge bg-${map[status] ?? "secondary"}`}>{status}</span>;
}

function StatPill({ label, value, color }) {
  return (
    <div className={`border border-${color} rounded-3 px-3 py-2 text-center`} style={{ minWidth: 90 }}>
      <div className={`fw-bold fs-5 text-${color}`}>{value}</div>
      <div className="text-muted" style={{ fontSize: 11 }}>{label}</div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function Upload() {
  const fileInputRef            = useRef(null);
  const [file, setFile]         = useState(null);
  const [uploads, setUploads]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);

  // result state after a completed upload
  const [result, setResult]     = useState(null);   // { upload, stats, errors, row_count }
  const [uploadError, setUploadError] = useState(null);

  // which history row is expanded (shows its error log)
  const [expanded, setExpanded] = useState(null);

  const fetchUploads = () => {
    setLoading(true);
    getUploads()
      .then((res) => setUploads(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUploads(); }, []);

  // ── submit ──────────────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setResult(null);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await uploadFile(formData);
      setResult(res.data);
      // reset file input
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchUploads();
    } catch (err) {
      const data = err.response?.data;
      // 422 = validation / structural error — still has partial data
      if (data?.upload) {
        setResult({ upload: data.upload, stats: null, errors: data.upload.error_log, row_count: null });
      }
      setUploadError(data?.error || "Upload failed. Please try again.");
      fetchUploads();
    } finally {
      setUploading(false);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="py-4 px-4 flex-grow-1">
      <h4 className="fw-bold mb-1">Upload Placement Data</h4>
      <p className="text-muted small mb-4">
        Bulk-import placement records from a CSV or XLSX file
      </p>

      {/* ── Upload form ─────────────────────────────────────────────────── */}
      <div className="card border-0 shadow-sm p-4 mb-4" style={{ maxWidth: 660 }}>
        <h6 className="fw-semibold mb-3">Select File</h6>

        <form onSubmit={handleUpload}>
          <div className="mb-3">
            <input
              ref={fileInputRef}
              type="file"
              className="form-control"
              accept=".csv,.xlsx"
              onChange={(e) => { setFile(e.target.files[0]); setResult(null); setUploadError(null); }}
              required
            />
          </div>

          {/* column guide */}
          <div className="bg-light rounded p-3 mb-3 small text-muted">
            <div className="fw-semibold text-dark mb-1">Required columns</div>
            <code>
              student_name, roll_number, email, department, batch_year,
              company_name, package_lpa, year
            </code>
            <div className="fw-semibold text-dark mt-2 mb-1">Optional columns</div>
            <code>cgpa, sector, location, role, offer_date</code>
            <div className="mt-2">
              ⚠ <strong>department</strong> must already exist in the system.
              Packages must be between <strong>0.1</strong> and <strong>500</strong> LPA.
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={uploading || !file}
          >
            {uploading && <span className="spinner-border spinner-border-sm me-2" />}
            {uploading ? "Processing…" : "Upload & Validate"}
          </button>
        </form>
      </div>

      {/* ── Upload result ───────────────────────────────────────────────── */}
      {(result || uploadError) && (
        <div className="mb-4" style={{ maxWidth: 660 }}>
          {/* structural error (missing columns, etc.) */}
          {uploadError && (
            <div className="alert alert-danger d-flex gap-2 align-items-start small mb-3">
              <i className="bi bi-x-circle-fill mt-1" />
              <span>{uploadError}</span>
            </div>
          )}

          {result?.stats && (
            <>
              {/* stat pills */}
              <div className="card border-0 shadow-sm p-3 mb-3">
                <div className="fw-semibold mb-3">
                  Upload Summary
                  <span className="text-muted fw-normal ms-2 small">
                    {result.row_count} row{result.row_count !== 1 ? "s" : ""} in file
                  </span>
                </div>
                <div className="d-flex flex-wrap gap-3">
                  <StatPill label="Inserted"  value={result.stats.inserted} color="success" />
                  <StatPill label="Updated"   value={result.stats.updated}  color="primary" />
                  <StatPill label="Skipped"   value={result.stats.skipped}  color="warning" />
                  <StatPill label="Errors"    value={result.stats.errors}   color="danger"  />
                </div>
              </div>

              {/* per-row error table */}
              {result.errors?.length > 0 && (
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-danger bg-opacity-10 border-0 py-2">
                    <span className="fw-semibold text-danger small">
                      <i className="bi bi-exclamation-triangle-fill me-1" />
                      {result.errors.length} validation error{result.errors.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="table-responsive" style={{ maxHeight: 320, overflowY: "auto" }}>
                    <table className="table table-sm table-hover align-middle mb-0">
                      <thead className="table-light sticky-top">
                        <tr>
                          <th style={{ width: 60 }}>Row</th>
                          <th style={{ width: 140 }}>Field</th>
                          <th>Issue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.errors.map((e, i) => (
                          <tr key={i}>
                            <td className="text-muted">{e.row}</td>
                            <td>
                              <code className="small">{e.field}</code>
                            </td>
                            <td className="small text-danger">{e.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result.errors?.length === 0 && (
                <div className="alert alert-success d-flex gap-2 align-items-center small mb-0">
                  <i className="bi bi-check-circle-fill" />
                  All rows imported successfully with no errors.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Upload history ──────────────────────────────────────────────── */}
      <h6 className="fw-semibold mb-3">Upload History</h6>
      {loading ? (
        <Loader />
      ) : uploads.length === 0 ? (
        <p className="text-muted small">No uploads yet.</p>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Filename</th>
                  <th>Type</th>
                  <th>Rows</th>
                  <th>Inserted</th>
                  <th>Updated</th>
                  <th>Skipped</th>
                  <th>Status</th>
                  <th>Uploaded At</th>
                  <th>Errors</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((u) => (
                  <>
                    <tr key={u.id}>
                      <td className="fw-semibold">{u.filename}</td>
                      <td>
                        <span className="badge bg-info text-dark">
                          {u.file_type?.toUpperCase()}
                        </span>
                      </td>
                      <td>{u.row_count ?? "—"}</td>
                      <td className="text-success">{u.stats?.inserted ?? "—"}</td>
                      <td className="text-primary">{u.stats?.updated  ?? "—"}</td>
                      <td className="text-warning">{u.stats?.skipped  ?? "—"}</td>
                      <td><StatusBadge status={u.status} /></td>
                      <td className="text-muted small">
                        {new Date(u.uploaded_at).toLocaleString()}
                      </td>
                      <td>
                        {u.error_log?.length > 0 ? (
                          <button
                            className="btn btn-sm btn-outline-danger py-0 px-2"
                            onClick={() => setExpanded(expanded === u.id ? null : u.id)}
                          >
                            {u.error_log.length} error{u.error_log.length !== 1 ? "s" : ""}
                            <i className={`bi ms-1 bi-chevron-${expanded === u.id ? "up" : "down"}`} />
                          </button>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                    </tr>

                    {/* expandable error log row */}
                    {expanded === u.id && u.error_log?.length > 0 && (
                      <tr key={`${u.id}-errors`}>
                        <td colSpan={9} className="p-0 bg-light">
                          <div
                            className="table-responsive border-top"
                            style={{ maxHeight: 240, overflowY: "auto" }}
                          >
                            <table className="table table-sm mb-0">
                              <thead className="table-danger">
                                <tr>
                                  <th style={{ width: 60 }}>Row</th>
                                  <th style={{ width: 140 }}>Field</th>
                                  <th>Issue</th>
                                </tr>
                              </thead>
                              <tbody>
                                {u.error_log.map((e, i) => (
                                  <tr key={i}>
                                    <td className="text-muted">{e.row}</td>
                                    <td><code className="small">{e.field}</code></td>
                                    <td className="small text-danger">{e.message}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
