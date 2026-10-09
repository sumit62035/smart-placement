/**
 * CrudToolbar — page header row used by all three admin CRUD panels.
 *
 * Props:
 *   title       string
 *   addLabel    string
 *   onAdd       fn
 *   search      string
 *   onSearch    fn(value)
 *   searchPlaceholder  string
 *   children    extra filter elements (optional)
 */
export default function CrudToolbar({
  title,
  addLabel,
  onAdd,
  search,
  onSearch,
  searchPlaceholder = "Search…",
  children,
}) {
  return (
    <div className="mb-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <h4 className="fw-bold mb-0">{title}</h4>
        <button className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={onAdd}>
          <i className="bi bi-plus-lg" />
          {addLabel}
        </button>
      </div>

      <div className="d-flex flex-wrap gap-2 align-items-center">
        {/* search box */}
        <div className="input-group input-group-sm" style={{ maxWidth: 280 }}>
          <span className="input-group-text bg-white">
            <i className="bi bi-search text-muted" />
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
          {search && (
            <button className="btn btn-outline-secondary" onClick={() => onSearch("")}>
              <i className="bi bi-x" />
            </button>
          )}
        </div>

        {/* extra filters injected by parent */}
        {children}
      </div>
    </div>
  );
}
