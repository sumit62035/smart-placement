import { useEffect, useState } from "react";
import { getDashboard, getYearlyTrends, getCompanyAnalytics } from "../../api";
import StatCard from "../../components/common/StatCard";
import Loader from "../../components/common/Loader";
import DoughnutChart from "../../components/charts/DoughnutChart";
import BarChart from "../../components/charts/BarChart";
import LineChart from "../../components/charts/LineChart";

// ── tiny helpers ──────────────────────────────────────────────────────────────

function SectionTitle({ children, subtitle }) {
  return (
    <div className="mb-3">
      <h5 className="fw-bold mb-0" style={{ color: "#1a2332" }}>{children}</h5>
      {subtitle && <p className="text-muted small mb-0 mt-1">{subtitle}</p>}
    </div>
  );
}

function PlacementRateRing({ rate }) {
  // SVG ring that fills proportionally to the placement rate
  const r = 46;
  const circ = 2 * Math.PI * r;
  const offset = circ - (rate / 100) * circ;
  const colour = rate >= 75 ? "#198754" : rate >= 50 ? "#ffc107" : "#dc3545";

  return (
    <div className="d-flex flex-column align-items-center justify-content-center h-100 py-3">
      <svg width="130" height="130" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e9ecef" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke={colour}
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
        <text x="60" y="56" textAnchor="middle" fontSize="18" fontWeight="700" fill={colour}>
          {rate}%
        </text>
        <text x="60" y="72" textAnchor="middle" fontSize="10" fill="#6c757d">
          Placed
        </text>
      </svg>
      <div className="text-muted small mt-1">Placement Rate</div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function PublicDashboard() {
  const [kpi,      setKpi]      = useState(null);
  const [trends,   setTrends]   = useState([]);
  const [companies, setCompanies] = useState([]);
  const [year,     setYear]     = useState("");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDashboard(year ? { year } : {}),
      getYearlyTrends(),
      getCompanyAnalytics(year ? { year } : {}),
    ])
      .then(([kpiRes, trendRes, coRes]) => {
        setKpi(kpiRes.data);
        setTrends(trendRes.data);
        setCompanies(coRes.data.slice(0, 8));
      })
      .finally(() => setLoading(false));
  }, [year]);

  // ── derived chart data ─────────────────────────────────────────────────────

  const trendLabels     = trends.map((d) => String(d.year));
  const trendPlacements = trends.map((d) => d.total_placements);
  const trendAvg        = trends.map((d) => d.avg_package_lpa);
  const trendMax        = trends.map((d) => d.max_package_lpa);
  const trendMedian     = trends.map((d) => d.median_package_lpa);

  const coLabels = companies.map((c) => c.company.length > 14 ? c.company.slice(0, 13) + "…" : c.company);
  const coHires  = companies.map((c) => c.hires);
  const coAvgPkg = companies.map((c) => c.avg_package_lpa);

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: "#f4f6fb", minHeight: "100vh" }}>

      {/* ── Hero banner ───────────────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a3c5e 0%, #0d6efd 100%)",
          padding: "36px 32px 28px",
          color: "#fff",
        }}
      >
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h1 className="fw-bold mb-1" style={{ fontSize: "1.6rem" }}>
              Placement Analytics Dashboard
            </h1>
            <p className="mb-0 opacity-75" style={{ fontSize: 14 }}>
              Real-time college placement performance overview · No login required
            </p>
          </div>

          {/* Year filter */}
          <div
            className="d-flex align-items-center gap-2 rounded-3 px-3 py-2"
            style={{ background: "rgba(255,255,255,.15)", backdropFilter: "blur(4px)" }}
          >
            <i className="bi bi-funnel text-white-50" />
            <input
              type="number"
              className="border-0 bg-transparent text-white fw-semibold"
              style={{ width: 80, outline: "none", fontSize: 14 }}
              placeholder="All years"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
            {year && (
              <button
                className="btn btn-sm p-0 border-0 text-white-50"
                onClick={() => setYear("")}
                title="Clear filter"
              >
                <i className="bi bi-x-lg" />
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-5"><Loader /></div>
      ) : !kpi ? (
        <div className="text-center py-5 text-muted">No data available.</div>
      ) : (
        <div className="px-3 px-md-4 py-4" style={{ maxWidth: 1400, margin: "0 auto" }}>

          {/* ── KPI row 1: student stats ──────────────────────────────────── */}
          <div className="row g-3 mb-3">
            <div className="col-6 col-md-4 col-xl-2">
              <StatCard
                title="Total Students"
                value={kpi.total_students.toLocaleString()}
                icon="bi-people-fill"
                colorClass="primary"
              />
            </div>
            <div className="col-6 col-md-4 col-xl-2">
              <StatCard
                title="Placed Students"
                value={kpi.placed_students.toLocaleString()}
                subtitle={`${kpi.placement_rate}% rate`}
                icon="bi-patch-check-fill"
                colorClass="success"
              />
            </div>
            <div className="col-6 col-md-4 col-xl-2">
              <StatCard
                title="Unplaced"
                value={kpi.unplaced_students.toLocaleString()}
                icon="bi-person-x-fill"
                colorClass="danger"
              />
            </div>
            <div className="col-6 col-md-4 col-xl-2">
              <StatCard
                title="Highest Package"
                value={`₹${kpi.max_package_lpa}`}
                subtitle="LPA"
                icon="bi-arrow-up-circle-fill"
                colorClass="success"
              />
            </div>
            <div className="col-6 col-md-4 col-xl-2">
              <StatCard
                title="Average Package"
                value={`₹${kpi.avg_package_lpa}`}
                subtitle="LPA"
                icon="bi-graph-up"
                colorClass="primary"
              />
            </div>
            <div className="col-6 col-md-4 col-xl-2">
              <StatCard
                title="Median Package"
                value={`₹${kpi.median_package_lpa}`}
                subtitle="LPA"
                icon="bi-distribute-vertical"
                colorClass="secondary"
              />
            </div>
          </div>

          {/* ── Row 2: placement ring + doughnut + recruiter count ────────── */}
          <div className="row g-3 mb-3">
            {/* Placement rate ring */}
            <div className="col-md-3">
              <div className="card border-0 h-100" style={{ borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
                <div className="card-body p-3 d-flex flex-column">
                  <span className="text-muted fw-semibold text-uppercase" style={{ fontSize: 11, letterSpacing: "0.06em" }}>
                    Overview
                  </span>
                  <PlacementRateRing rate={kpi.placement_rate} />
                  <div className="row g-2 mt-1">
                    <div className="col-6 text-center">
                      <div className="fw-bold text-success" style={{ fontSize: 18 }}>{kpi.placed_students}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>Placed</div>
                    </div>
                    <div className="col-6 text-center">
                      <div className="fw-bold text-danger" style={{ fontSize: 18 }}>{kpi.unplaced_students}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>Unplaced</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status doughnut */}
            <div className="col-md-4">
              <div className="card border-0 h-100" style={{ borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
                <div className="card-body p-3">
                  <span className="text-muted fw-semibold text-uppercase d-block mb-3" style={{ fontSize: 11, letterSpacing: "0.06em" }}>
                    Student Status Breakdown
                  </span>
                  <DoughnutChart
                    labels={["Placed", "Unplaced", "Opted Out"]}
                    data={[kpi.placed_students, kpi.unplaced_students, kpi.opted_out_students]}
                    optionsOverride={{
                      plugins: {
                        legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 12 }, padding: 12 } },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Package summary */}
            <div className="col-md-5">
              <div className="card border-0 h-100" style={{ borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
                <div className="card-body p-3">
                  <span className="text-muted fw-semibold text-uppercase d-block mb-3" style={{ fontSize: 11, letterSpacing: "0.06em" }}>
                    Package Summary {year && <span className="text-primary">· {year}</span>}
                  </span>
                  <table className="table table-sm align-middle mb-0">
                    <tbody>
                      {[
                        ["Total Students",  kpi.total_students,    "text-dark"],
                        ["Placed",          kpi.placed_students,   "text-success"],
                        ["Unplaced",        kpi.unplaced_students, "text-danger"],
                        ["Opted Out",       kpi.opted_out_students,"text-secondary"],
                        ["Total Offers",    kpi.total_placements,  "text-dark"],
                        ["Total Recruiters",kpi.total_recruiters,  "text-info"],
                        ["Avg Package",     `₹${kpi.avg_package_lpa} LPA`, "text-primary"],
                        ["Median Package",  `₹${kpi.median_package_lpa} LPA`, "text-secondary"],
                        ["Highest Package", `₹${kpi.max_package_lpa} LPA`, "text-success"],
                        ["Lowest Package",  `₹${kpi.min_package_lpa} LPA`, "text-warning"],
                      ].map(([label, val, cls]) => (
                        <tr key={label}>
                          <td className="text-muted ps-0" style={{ fontSize: 13 }}>{label}</td>
                          <td className={`fw-semibold text-end pe-0 ${cls}`} style={{ fontSize: 13 }}>{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 3: yearly trend charts ────────────────────────────────── */}
          {trends.length > 0 && (
            <div className="row g-3 mb-3">
              <div className="col-md-5">
                <div className="card border-0" style={{ borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
                  <div className="card-body p-3">
                    <SectionTitle subtitle="Total placement offers per year">
                      Year-on-Year Placements
                    </SectionTitle>
                    <BarChart
                      labels={trendLabels}
                      datasets={[{
                        label: "Total Placements",
                        data: trendPlacements,
                        backgroundColor: "rgba(13,110,253,.75)",
                        borderRadius: 5,
                        borderSkipped: false,
                      }]}
                      optionsOverride={{
                        plugins: { legend: { display: false } },
                        scales: {
                          y: { beginAtZero: true, grid: { color: "rgba(0,0,0,.04)" } },
                          x: { grid: { display: false } },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-7">
                <div className="card border-0" style={{ borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
                  <div className="card-body p-3">
                    <SectionTitle subtitle="Average, median & highest package by year">
                      Package Trends (LPA)
                    </SectionTitle>
                    <LineChart
                      labels={trendLabels}
                      datasets={[
                        { label: "Avg",    data: trendAvg,    borderColor: "#0d6efd", backgroundColor: "rgba(13,110,253,.08)", fill: true, tension: 0.4, pointRadius: 4 },
                        { label: "Median", data: trendMedian, borderColor: "#6f42c1", backgroundColor: "transparent",          tension: 0.4, pointRadius: 4 },
                        { label: "High",   data: trendMax,    borderColor: "#198754", backgroundColor: "transparent",          tension: 0.4, pointRadius: 4, borderDash: [4,3] },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Row 4: top recruiters ─────────────────────────────────────── */}
          {companies.length > 0 && (
            <div className="row g-3">
              <div className="col-md-6">
                <div className="card border-0" style={{ borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
                  <div className="card-body p-3">
                    <SectionTitle subtitle="Hires by top 8 recruiters">
                      Top Recruiters
                    </SectionTitle>
                    <BarChart
                      labels={coLabels}
                      datasets={[{
                        label: "Hires",
                        data: coHires,
                        backgroundColor: companies.map((_, i) =>
                          `hsl(${(i * 37 + 210) % 360},65%,52%)`
                        ),
                        borderRadius: 4,
                        borderSkipped: false,
                      }]}
                      optionsOverride={{
                        indexAxis: "y",
                        plugins: { legend: { display: false } },
                        scales: {
                          x: { beginAtZero: true, grid: { color: "rgba(0,0,0,.04)" } },
                          y: { grid: { display: false }, ticks: { font: { size: 11 } } },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border-0" style={{ borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
                  <div className="card-body p-3">
                    <SectionTitle subtitle="Average package offered by top recruiters">
                      Avg Package by Company (LPA)
                    </SectionTitle>
                    <BarChart
                      labels={coLabels}
                      datasets={[{
                        label: "Avg LPA",
                        data: coAvgPkg,
                        backgroundColor: "rgba(25,135,84,.7)",
                        borderRadius: 4,
                        borderSkipped: false,
                      }]}
                      optionsOverride={{
                        plugins: { legend: { display: false } },
                        scales: {
                          y: { beginAtZero: true, grid: { color: "rgba(0,0,0,.04)" } },
                          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
