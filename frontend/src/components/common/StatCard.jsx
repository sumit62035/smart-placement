/**
 * StatCard — professional KPI card with accent border, trend badge, and icon.
 *
 * Props:
 *   title       string   — metric label
 *   value       any      — primary number/string
 *   subtitle    string   — secondary line (optional)
 *   icon        string   — Bootstrap Icons class e.g. "bi-people-fill"
 *   colorClass  string   — Bootstrap colour token e.g. "primary" (default)
 *   trend       number   — % change vs previous period (optional, shows arrow badge)
 */
export default function StatCard({
  title,
  value,
  subtitle,
  colorClass = "primary",
  icon,
  trend,
}) {
  const trendPositive = trend > 0;
  const trendNeutral  = trend === 0 || trend === undefined || trend === null;

  return (
    <div
      className="card border-0 h-100"
      style={{
        borderRadius: 12,
        boxShadow: "0 1px 4px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.04)",
        borderLeft: `4px solid var(--bs-${colorClass})`,
      }}
    >
      <div className="card-body px-3 py-3">
        {/* top row: label + icon */}
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span
            className="text-muted fw-semibold text-uppercase"
            style={{ fontSize: 11, letterSpacing: "0.06em" }}
          >
            {title}
          </span>
          {icon && (
            <div
              className={`d-flex align-items-center justify-content-center rounded-circle bg-${colorClass} bg-opacity-10`}
              style={{ width: 36, height: 36, flexShrink: 0 }}
            >
              <i className={`bi ${icon} text-${colorClass}`} style={{ fontSize: 16 }} />
            </div>
          )}
        </div>

        {/* value */}
        <div
          className={`fw-bold text-${colorClass}`}
          style={{ fontSize: "1.75rem", lineHeight: 1.1 }}
        >
          {value}
        </div>

        {/* subtitle + trend badge */}
        <div className="d-flex align-items-center justify-content-between mt-2 gap-2">
          {subtitle && (
            <span className="text-muted" style={{ fontSize: 12 }}>
              {subtitle}
            </span>
          )}
          {!trendNeutral && (
            <span
              className={`badge rounded-pill bg-${trendPositive ? "success" : "danger"} bg-opacity-15
                          text-${trendPositive ? "success" : "danger"} ms-auto`}
              style={{ fontSize: 11, fontWeight: 600 }}
            >
              <i className={`bi bi-arrow-${trendPositive ? "up" : "down"}-short`} />
              {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
