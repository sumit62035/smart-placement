import { useEffect, useMemo, useState } from "react";
import {
  getCompanyAnalytics,
  getCompanySectors,
  getCompanyTrends,
} from "../../api";
import BarChart    from "../../components/charts/BarChart";
import LineChart   from "../../components/charts/LineChart";
import PieChart    from "../../components/charts/PieChart";
import StatCard    from "../../components/common/StatCard";
import Loader      from "../../components/common/Loader";

// ── palette ───────────────────────────────────────────────────────────────────
const PALETTE = [
  "#0d6efd","#198754","#ffc107","#dc3545",
  "#0dcaf0","#6f42c1","#fd7e14","#20c997",
  "#6610f2","#d63384","#343a40","#adb5bd",
];

// ── medal helpers ─────────────────────────────────────────────────────────────
const MEDALS = ["🥇","🥈","🥉"];
function rankIcon(i) {
  return i < 3
    ? <span style={{ fontSize: 16 }}>{MEDALS[i]}</span>
    : <span className="text-muted small fw-semibold">{i + 1}</span>;
}

// ── sector badge colour ───────────────────────────────────────────────────────
const SECTOR_COLOURS = {
  IT: "primary", Finance: "success", Core: "warning",
  Consulting: "info", Manufacturing: "secondary",
  Healthcare: "danger", Other: "dark",
};
function SectorBadge({ sector }) {
  const col = SECTOR_COLOURS[sector] ?? "secondary";
  return <span className={`badge bg-${col} bg-opacity-15 text-${col} border border-${col}`}
                style={{ fontSize: 11 }}>{sector}</span>;
}

// ── shared helpers ────────────────────────────────────────────────────────────
function SectionHead({ title, subtitle }) {
  return (
    <div className="mb-3">
      <h5 className="fw-bold mb-0" style={{ color: "#1a2332" }}>{title}</h5>
      {subtitle && <p className="text-muted small mb-0 mt-1">{subtitle}</p>}
    </div>
  );
}
const cardStyle = { borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.08)" };
const truncate  = (s, n = 16) => s.length > n ? s.slice(0, n - 1) + "…" : s;

// ── main component ────────────────────────────────────────────────────────────
export default function CompanyAnalytics() {
  const [companies,  setCompanies]  = useState([]);
  const [sectors,    setSectors]    = useState([]);
  const [trends,     setTrends]     = useState([]);
  const [year,       setYear]       = useState("");
  const [sector,     setSector]     = useState("");
  const [loading,    setLoading]    = useState(true);
  const [activeComp, setActiveComp] = useState(null);
  const [sortField,  setSortField]  = useState("hires"); // hires | avg | max

  // ── fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    const params = {};
    if (year)   params.year   = year;
    if (sector) params.sector = sector;

    Promise.all([
      getCompanyAnalytics(params),
      getCompanySectors({ ...(year ? { year } : {}) }),
      getCompanyTrends(params),
    ])
      .then(([coRes, secRes, trendRes]) => {
        setCompanies(coRes.data);
        setSectors(secRes.data);
        setTrends(trendRes.data);
        if (coRes.data.length && !activeComp) setActiveComp(coRes.data[0].company);
      })
      .finally(() => setLoading(false));
  }, [year, sector]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── top-level KPIs ─────────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    if (!companies.length) return null;
    const totalHires  = companies.reduce((s, c) => s + c.hires, 0);
    const maxPkg      = Math.max(...companies.map((c) => c.max_package_lpa));
    const avgOfAvg    = companies.reduce((s, c) => s + c.avg_package_lpa, 0) / companies.length;
    const topRecruiter = companies[0];           // already sorted by hires desc
    const topPayer    = [...companies].sort((a, b) => b.avg_package_lpa - a.avg_package_lpa)[0];
    return { total: companies.length, totalHires, maxPkg, avgOfAvg: r2(avgOfAvg), topRecruiter, topPayer };
  }, [companies]);

  // ── sorted table ───────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    const key = { hires: "hires", avg: "avg_package_lpa", max: "max_package_lpa" }[sortField];
    return [...companies].sort((a, b) => b[key] - a[key]);
  }, [companies, sortField]);

  // ── chart data — top N ─────────────────────────────────────────────────────
  const TOP = 10;
  const topByHires  = companies.slice(0, TOP);
  const topByAvg    = [...companies].sort((a,b) => b.avg_package_lpa - a.avg_package_lpa).slice(0, TOP);
  const topByMax    = [...companies].sort((a,b) => b.max_package_lpa  - a.max_package_lpa).slice(0, TOP);

  const hiresLabels = topByHires.map((c) => truncate(c.company));
  const avgLabels   = topByAvg.map((c)   => truncate(c.company));
  const maxLabels   = topByMax.map((c)   => truncate(c.company));

  // ── sector pie ─────────────────────────────────────────────────────────────
  const sectorLabels = sectors.map((s) => s.sector);
  const sectorHires  = sectors.map((s) => s.hires);

  // ── sector dropdown options ────────────────────────────────────────────────
  const sectorOptions = useMemo(() =>
    [...new Set(sectors.map((s) => s.sector))].filter((s) => s !== "Other").sort(),
  [sectors]);

  // ── trend for active company ───────────────────────────────────────────────
  const companyList = useMemo(() =>
    [...new Set(trends.map((t) => t.company))].sort(), [trends]);

  const trendForComp = useMemo(() => {
    const rows = trends.filter((t) => t.company === activeComp);
    return {
      years:  rows.map((r) => String(r.year)),
      hires:  rows.map((r) => r.hires),
      avgPkg: rows.map((r) => r.avg_package_lpa),
      maxPkg: rows.map((r) => r.max_package_lpa),
    };
  }, [trends, activeComp]);

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: "#f4f6fb", minHeight: "100vh" }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #1a3c5e 0%, #0d6efd 100%)",
        padding: "32px 32px 24px", color: "#fff",
      }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h1 className="fw-bold mb-1" style={{ fontSize: "1.5rem" }}>Company Analytics</h1>
            <p className="mb-0 opacity-75" style={{ fontSize: 13 }}>
              Recruitment data, package benchmarks, and sector breakdowns
            </p>
          </div>

          {/* Filters */}
          <div className="d-flex flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2 rounded-3 px-3 py-2"
                 style={{ background: "rgba(255,255,255,.15)" }}>
              <i className="bi bi-calendar3 text-white-50" />
              <input
                type="number"
                className="border-0 bg-transparent text-white fw-semibold"
                style={{ width: 80, outline: "none", fontSize: 14 }}
                placeholder="All years"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
              {year && (
                <button className="btn btn-sm p-0 border-0 text-white-50" onClick={() => setYear("")}>
                  <i className="bi bi-x-lg" />
                </button>
              )}
            </div>

            <div className="d-flex align-items-center gap-2 rounded-3 px-3 py-2"
                 style={{ background: "rgba(255,255,255,.15)" }}>
              <i className="bi bi-building text-white-50" />
              <select
                className="border-0 bg-transparent text-white fw-semibold"
                style={{ outline: "none", fontSize: 14, cursor: "pointer" }}
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              >
                <option value="" style={{ color: "#000" }}>All sectors</option>
                {sectorOptions.map((s) => (
                  <option key={s} value={s} style={{ color: "#000" }}>{s}</option>
                ))}
              </select>
              {sector && (
                <button className="btn btn-sm p-0 border-0 text-white-50" onClick={() => setSector("")}>
                  <i className="bi bi-x-lg" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-5"><Loader /></div>
      ) : companies.length === 0 ? (
        <div className="text-center py-5 text-muted">No company data available.</div>
      ) : (
        <div className="px-3 px-md-4 py-4" style={{ maxWidth: 1400, margin: "0 auto" }}>

          {/* ── KPI strip ──────────────────────────────────────────────────── */}
          {kpi && (
            <div className="row g-3 mb-4">
              <div className="col-6 col-md-4 col-xl-2">
                <StatCard title="Total Companies"  value={kpi.total}                   icon="bi-building-fill"         colorClass="primary" />
              </div>
              <div className="col-6 col-md-4 col-xl-2">
                <StatCard title="Total Hires"      value={kpi.totalHires.toLocaleString()} icon="bi-person-check-fill" colorClass="success" />
              </div>
              <div className="col-6 col-md-4 col-xl-2">
                <StatCard title="Top Recruiter"    value={truncate(kpi.topRecruiter.company, 14)} subtitle={`${kpi.topRecruiter.hires} hires`} icon="bi-trophy-fill" colorClass="warning" />
              </div>
              <div className="col-6 col-md-4 col-xl-2">
                <StatCard title="Highest Avg Pkg"  value={`₹${kpi.topPayer.avg_package_lpa}`}    subtitle={`${truncate(kpi.topPayer.company, 12)} · LPA`} icon="bi-currency-rupee" colorClass="info" />
              </div>
              <div className="col-6 col-md-4 col-xl-2">
                <StatCard title="Peak Package"     value={`₹${kpi.maxPkg}`}            subtitle="LPA (highest offer)" icon="bi-arrow-up-circle-fill" colorClass="success" />
              </div>
              <div className="col-6 col-md-4 col-xl-2">
                <StatCard title="Avg of Avg Pkg"   value={`₹${kpi.avgOfAvg}`}          subtitle="LPA across companies" icon="bi-graph-up"            colorClass="secondary" />
              </div>
            </div>
          )}

          {/* ── Row 1: Top recruiters + Sector pie ─────────────────────────── */}
          <div className="row g-3 mb-3">
            <div className="col-md-7">
              <div className="card border-0 h-100" style={cardStyle}>
                <div className="card-body p-3">
                  <SectionHead title="Top 10 Recruiters" subtitle="Companies with most student hires" />
                  <BarChart
                    labels={hiresLabels}
                    datasets={[{
                      label: "Hires",
                      data: topByHires.map((c) => c.hires),
                      backgroundColor: topByHires.map((_, i) =>
                        `hsl(${(i * 29 + 210) % 360},65%,52%)`
                      ),
                      borderRadius: 5, borderSkipped: false,
                    }]}
                    optionsOverride={{
                      indexAxis: "y",
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { beginAtZero: true, grid: { color: "rgba(0,0,0,.04)" } },
                        y: { grid: { display: false }, ticks: { font: { size: 12 } } },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="col-md-5">
              <div className="card border-0 h-100" style={cardStyle}>
                <div className="card-body p-3">
                  <SectionHead
                    title="Hires by Sector"
                    subtitle={`${sectors.length} sectors · ${year ? year : "all years"}`}
                  />
                  {sectorHires.length === 0 ? (
                    <p className="text-muted small">No sector data.</p>
                  ) : (
                    <PieChart
                      labels={sectorLabels}
                      data={sectorHires}
                      optionsOverride={{
                        plugins: {
                          legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 }, padding: 10 } },
                          tooltip: {
                            callbacks: {
                              label: (ctx) => {
                                const total = sectorHires.reduce((a, b) => a + b, 0);
                                const pct   = total ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                                return `  ${ctx.label}: ${ctx.parsed} hires (${pct}%)`;
                              },
                            },
                          },
                        },
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 2: Highest paying + Average package ────────────────────── */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <div className="card border-0 h-100" style={cardStyle}>
                <div className="card-body p-3">
                  <SectionHead
                    title="Highest Paying Companies"
                    subtitle="Peak offer (Max LPA) per company"
                  />
                  <BarChart
                    labels={maxLabels}
                    datasets={[{
                      label: "Max LPA",
                      data: topByMax.map((c) => c.max_package_lpa),
                      backgroundColor: "rgba(25,135,84,.75)",
                      borderRadius: 5, borderSkipped: false,
                    }]}
                    optionsOverride={{
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, grid: { color: "rgba(0,0,0,.04)" },
                             ticks: { callback: (v) => `₹${v}` } },
                        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card border-0 h-100" style={cardStyle}>
                <div className="card-body p-3">
                  <SectionHead
                    title="Average Package by Company"
                    subtitle="Mean offer per company (LPA)"
                  />
                  <BarChart
                    labels={avgLabels}
                    datasets={[{
                      label: "Avg LPA",
                      data: topByAvg.map((c) => c.avg_package_lpa),
                      backgroundColor: avgLabels.map((_, i) =>
                        PALETTE[i % PALETTE.length] + "bb"
                      ),
                      borderRadius: 5, borderSkipped: false,
                    }]}
                    optionsOverride={{
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, grid: { color: "rgba(0,0,0,.04)" },
                             ticks: { callback: (v) => `₹${v}` } },
                        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 3: Company trend drill-down ────────────────────────────── */}
          {trends.length > 0 && (
            <div className="row g-3 mb-3">
              {/* company selector */}
              <div className="col-md-3 col-xl-2">
                <div className="card border-0 h-100" style={cardStyle}>
                  <div className="card-body p-3">
                    <p className="text-muted fw-semibold text-uppercase mb-2"
                       style={{ fontSize: 11, letterSpacing: "0.06em" }}>
                      Select Company
                    </p>
                    <div className="d-flex flex-column gap-1" style={{ maxHeight: 320, overflowY: "auto" }}>
                      {companyList.map((co) => (
                        <button
                          key={co}
                          className={`btn btn-sm text-start ${activeComp === co ? "btn-primary" : "btn-outline-secondary"}`}
                          style={{ fontSize: 12 }}
                          onClick={() => setActiveComp(co)}
                        >
                          {co}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* trend charts */}
              <div className="col-md-9 col-xl-10">
                <div className="row g-3">
                  <div className="col-md-5">
                    <div className="card border-0 h-100" style={cardStyle}>
                      <div className="card-body p-3">
                        <SectionHead
                          title={`${activeComp} — Hires Over Years`}
                          subtitle="Number of students hired each year"
                        />
                        {trendForComp.years.length === 0 ? (
                          <p className="text-muted small">No data for this company.</p>
                        ) : (
                          <LineChart
                            labels={trendForComp.years}
                            datasets={[{
                              label: "Hires",
                              data:  trendForComp.hires,
                              borderColor:     "#0d6efd",
                              backgroundColor: "rgba(13,110,253,.1)",
                              fill: true, tension: 0.4,
                              pointRadius: 5, pointHoverRadius: 7,
                            }]}
                            optionsOverride={{
                              plugins: { legend: { display: false } },
                              scales: {
                                y: { beginAtZero: true, grid: { color: "rgba(0,0,0,.04)" } },
                                x: { grid: { display: false } },
                              },
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-7">
                    <div className="card border-0 h-100" style={cardStyle}>
                      <div className="card-body p-3">
                        <SectionHead
                          title={`${activeComp} — Package Trends`}
                          subtitle="Avg and highest package (LPA) year-on-year"
                        />
                        {trendForComp.years.length === 0 ? (
                          <p className="text-muted small">No data for this company.</p>
                        ) : (
                          <LineChart
                            labels={trendForComp.years}
                            datasets={[
                              {
                                label: "Avg LPA",
                                data:  trendForComp.avgPkg,
                                borderColor: "#198754",
                                backgroundColor: "rgba(25,135,84,.08)",
                                fill: true, tension: 0.4,
                                pointRadius: 5, pointHoverRadius: 7,
                              },
                              {
                                label: "Max LPA",
                                data:  trendForComp.maxPkg,
                                borderColor: "#dc3545",
                                backgroundColor: "transparent",
                                borderDash: [5, 3], tension: 0.4,
                                pointRadius: 5, pointHoverRadius: 7,
                              },
                            ]}
                            optionsOverride={{
                              scales: {
                                y: { beginAtZero: true, grid: { color: "rgba(0,0,0,.04)" },
                                     ticks: { callback: (v) => `₹${v}` } },
                                x: { grid: { display: false } },
                              },
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Row 4: Full ranking table ───────────────────────────────────── */}
          <div className="card border-0" style={cardStyle}>
            <div className="card-body p-3">
              {/* table header + sort controls */}
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <SectionHead
                  title="Company Ranking Table"
                  subtitle={`${sorted.length} companies · ${year ? year : "all time"}`}
                />
                <div className="d-flex gap-2 align-items-center">
                  <span className="text-muted small">Sort by:</span>
                  {[
                    { key: "hires", label: "Most Hires" },
                    { key: "avg",   label: "Avg Package" },
                    { key: "max",   label: "Max Package" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      className={`btn btn-sm ${sortField === key ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => setSortField(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 40 }}>Rank</th>
                      <th>Company</th>
                      <th>Sector</th>
                      <th>Location</th>
                      <th className="text-center">Hires</th>
                      <th className="text-center">Students</th>
                      <th className="text-end">Avg LPA</th>
                      <th className="text-end">Max LPA</th>
                      <th className="text-end">Min LPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((c, i) => (
                      <tr
                        key={c.company}
                        style={{ cursor: "pointer" }}
                        onClick={() => setActiveComp(c.company)}
                        className={activeComp === c.company ? "table-primary" : ""}
                      >
                        <td className="text-center">{rankIcon(i)}</td>
                        <td className="fw-semibold">{c.company}</td>
                        <td><SectorBadge sector={c.sector} /></td>
                        <td className="text-muted small">{c.location}</td>
                        <td className="text-center fw-semibold">{c.hires}</td>
                        <td className="text-center text-muted">{c.unique_students}</td>
                        <td className="text-end text-primary fw-semibold">₹{c.avg_package_lpa}</td>
                        <td className="text-end text-success fw-semibold">₹{c.max_package_lpa}</td>
                        <td className="text-end text-warning">₹{c.min_package_lpa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-muted small mt-2 mb-0">
                <i className="bi bi-info-circle me-1" />
                Click a row to load that company's trend charts above.
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────
function r2(n) { return Math.round(n * 100) / 100; }
