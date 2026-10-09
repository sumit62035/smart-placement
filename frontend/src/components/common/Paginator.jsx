/**
 * Paginator — consistent pagination bar for all admin CRUD tables.
 *
 * Props:
 *   page       number   current page (1-based)
 *   pages      number   total pages
 *   total      number   total record count
 *   label      string   noun e.g. "students"
 *   onPage     fn(page)
 */
export default function Paginator({ page, pages, total, label = "records", onPage }) {
  if (pages <= 1 && total === 0) return null;

  const start = pages === 0 ? 0 : (page - 1) * Math.ceil(total / pages) + 1;
  const end   = Math.min(start + Math.ceil(total / Math.max(pages, 1)) - 1, total);

  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 gap-2">
      <small className="text-muted">
        {total === 0
          ? `No ${label} found`
          : `Showing ${start}–${end} of ${total} ${label}`}
      </small>

      {pages > 1 && (
        <nav>
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => onPage(1)} title="First">
                <i className="bi bi-chevron-double-left" />
              </button>
            </li>
            <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => onPage(page - 1)}>
                <i className="bi bi-chevron-left" />
              </button>
            </li>
            {buildPages(page, pages).map((p, i) =>
              p === "…" ? (
                <li key={`e${i}`} className="page-item disabled">
                  <span className="page-link">…</span>
                </li>
              ) : (
                <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                  <button className="page-link" onClick={() => onPage(p)}>{p}</button>
                </li>
              )
            )}
            <li className={`page-item ${page >= pages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => onPage(page + 1)}>
                <i className="bi bi-chevron-right" />
              </button>
            </li>
            <li className={`page-item ${page >= pages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => onPage(pages)} title="Last">
                <i className="bi bi-chevron-double-right" />
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

// Build a compact page number array with ellipsis, e.g. [1, "…", 4, 5, 6, "…", 12]
function buildPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const arr   = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (i > 0 && arr[i] - arr[i - 1] > 1) result.push("…");
    result.push(arr[i]);
  }
  return result;
}
