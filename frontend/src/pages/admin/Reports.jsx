import { useEffect, useState } from "react";
import { getReports, generateReport, downloadReport } from "../../api";
import Loader from "../../components/common/Loader";

const REPORT_TYPES = ["summary", "department", "company", "yearly"];

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ title: "", report_type: "summary" });
  const [message, setMessage] = useState(null);

  const fetchReports = () => {
    setLoading(true);
    getReports().then((res) => setReports(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(); }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setMessage(null);
    try {
      await generateReport(form);
      setMessage({ type: "success", text: "Report generated successfully." });
      setForm({ title: "", report_type: "summary" });
      fetchReports();
    } catch (err) {
      setMessage({ type: "danger", text: err.response?.data?.error || "Generation failed." });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (id, title) => {
    try {
      const res = await downloadReport(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "_")}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Download failed.");
    }
  };

  return (
    <div className="py-4 px-4 flex-grow-1">
      <h4 className="fw-bold mb-1">Reports</h4>
      <p className="text-muted small mb-4">Generate and download PDF placement reports</p>

      <div className="card border-0 shadow-sm p-4 mb-4" style={{ maxWidth: "500px" }}>
        <h6 className="fw-semibold mb-3">Generate New Report</h6>
        {message && <div className={`alert alert-${message.type} py-2 small`}>{message.text}</div>}
        <form onSubmit={handleGenerate}>
          <div className="mb-3">
            <label className="form-label">Report Title</label>
            <input className="form-control" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Annual Placement Report 2024" />
          </div>
          <div className="mb-3">
            <label className="form-label">Report Type</label>
            <select className="form-select" value={form.report_type} onChange={(e) => setForm({ ...form, report_type: e.target.value })}>
              {REPORT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={generating}>
            {generating && <span className="spinner-border spinner-border-sm me-2" />}
            {generating ? "Generating..." : "Generate PDF Report"}
          </button>
        </form>
      </div>

      <h6 className="fw-semibold mb-3">Generated Reports</h6>
      {loading ? <Loader /> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr><th>Title</th><th>Type</th><th>Created At</th><th>Download</th></tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>{r.title}</td>
                    <td><span className="badge bg-primary">{r.report_type}</span></td>
                    <td className="text-muted small">{new Date(r.created_at).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-success" onClick={() => handleDownload(r.id, r.title)}>
                        <i className="bi bi-download me-1" />PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
