import { useEffect, useState } from "react";
import { getYearlyTrends } from "../../api";
import LineChart from "../../components/charts/LineChart";
import BarChart from "../../components/charts/BarChart";
import Loader from "../../components/common/Loader";

export default function YearlyTrends() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getYearlyTrends()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const labels = data.map((d) => String(d.year));
  const totalPlacements = data.map((d) => d.total_placements);
  const avgPkg = data.map((d) => d.avg_package_lpa);
  const maxPkg = data.map((d) => d.max_package_lpa);
  const minPkg = data.map((d) => d.min_package_lpa);

  return (
    <div className="container-fluid py-4 px-4">
      <h2 className="fw-bold mb-1">Yearly Placement Trends</h2>
      <p className="text-muted mb-4">Year-on-year placement performance</p>

      {loading ? (
        <Loader />
      ) : data.length === 0 ? (
        <p className="text-muted">No trend data available yet.</p>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm p-3">
                <h6 className="fw-semibold mb-3">Total Placements per Year</h6>
                <BarChart
                  labels={labels}
                  datasets={[
                    {
                      label: "Total Placements",
                      data: totalPlacements,
                      backgroundColor: "#0d6efd",
                    },
                  ]}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="card border-0 shadow-sm p-3">
                <h6 className="fw-semibold mb-3">Package Trends (LPA)</h6>
                <LineChart
                  labels={labels}
                  datasets={[
                    { label: "Avg LPA", data: avgPkg, borderColor: "#0d6efd", backgroundColor: "rgba(13,110,253,0.1)", fill: true },
                    { label: "Max LPA", data: maxPkg, borderColor: "#198754", backgroundColor: "transparent" },
                    { label: "Min LPA", data: minPkg, borderColor: "#dc3545", backgroundColor: "transparent" },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Year-wise Summary</h6>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Year</th>
                      <th>Total Placements</th>
                      <th>Avg Package (LPA)</th>
                      <th>Max Package (LPA)</th>
                      <th>Min Package (LPA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((d) => (
                      <tr key={d.year}>
                        <td className="fw-semibold">{d.year}</td>
                        <td>{d.total_placements}</td>
                        <td>₹{d.avg_package_lpa}</td>
                        <td className="text-success">₹{d.max_package_lpa}</td>
                        <td className="text-danger">₹{d.min_package_lpa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
