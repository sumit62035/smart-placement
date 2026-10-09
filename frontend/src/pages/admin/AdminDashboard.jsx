import { useEffect, useState } from "react";
import { getDashboard } from "../../api";
import StatCard from "../../components/common/StatCard";
import Loader from "../../components/common/Loader";
import DoughnutChart from "../../components/charts/DoughnutChart";

export default function AdminDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="py-4 px-4 flex-grow-1">
      <h4 className="fw-bold mb-1">Admin Dashboard</h4>
      <p className="text-muted small mb-4">System overview & placement KPIs</p>

      {data && (
        <>
          {/* Row 1 — student counts */}
          <div className="row g-3 mb-3">
            <div className="col-sm-6 col-xl-3">
              <StatCard title="Total Students"   value={data.total_students}   icon="bi-people-fill"      colorClass="primary" />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatCard title="Placed"           value={data.placed_students}  subtitle={`${data.placement_rate}% rate`} icon="bi-patch-check-fill" colorClass="success" />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatCard title="Unplaced"         value={data.unplaced_students} subtitle={`${data.opted_out_students} opted out`} icon="bi-person-x-fill" colorClass="danger" />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatCard title="Total Recruiters" value={data.total_recruiters} subtitle={`${data.total_placements} offers`} icon="bi-building-fill" colorClass="info" />
            </div>
          </div>

          {/* Row 2 — package KPIs */}
          <div className="row g-3 mb-4">
            <div className="col-sm-6 col-xl-3">
              <StatCard title="Avg Package"    value={`₹${data.avg_package_lpa} LPA`}    icon="bi-graph-up"               colorClass="primary"   />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatCard title="Median Package" value={`₹${data.median_package_lpa} LPA`} icon="bi-distribute-vertical"    colorClass="secondary" />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatCard title="Highest Package" value={`₹${data.max_package_lpa} LPA`}   icon="bi-arrow-up-circle-fill"   colorClass="success"   />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatCard title="Lowest Package"  value={`₹${data.min_package_lpa} LPA`}   icon="bi-arrow-down-circle-fill" colorClass="warning"   />
            </div>
          </div>

          {/* Charts */}
          <div className="row g-3">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm p-3">
                <h6 className="fw-semibold mb-3">Placement Status</h6>
                <DoughnutChart
                  labels={["Placed", "Unplaced", "Opted Out"]}
                  data={[data.placed_students, data.unplaced_students, data.opted_out_students]}
                />
              </div>
            </div>
            <div className="col-md-8">
              <div className="card border-0 shadow-sm p-3 h-100">
                <h6 className="fw-semibold mb-3">All KPIs</h6>
                <table className="table table-sm table-hover align-middle mb-0">
                  <tbody>
                    <tr><td className="text-muted">Total Students</td>   <td className="fw-semibold">{data.total_students}</td></tr>
                    <tr><td className="text-muted">Placed</td>           <td className="fw-semibold text-success">{data.placed_students}</td></tr>
                    <tr><td className="text-muted">Unplaced</td>         <td className="fw-semibold text-danger">{data.unplaced_students}</td></tr>
                    <tr><td className="text-muted">Opted Out</td>        <td className="fw-semibold text-secondary">{data.opted_out_students}</td></tr>
                    <tr><td className="text-muted">Placement Rate</td>   <td className="fw-semibold">{data.placement_rate}%</td></tr>
                    <tr><td className="text-muted">Total Offers</td>     <td className="fw-semibold">{data.total_placements}</td></tr>
                    <tr><td className="text-muted">Total Recruiters</td> <td className="fw-semibold">{data.total_recruiters}</td></tr>
                    <tr><td className="text-muted">Avg Package</td>      <td className="fw-semibold">₹{data.avg_package_lpa} LPA</td></tr>
                    <tr><td className="text-muted">Median Package</td>   <td className="fw-semibold">₹{data.median_package_lpa} LPA</td></tr>
                    <tr><td className="text-muted">Highest Package</td>  <td className="fw-semibold text-success">₹{data.max_package_lpa} LPA</td></tr>
                    <tr><td className="text-muted">Lowest Package</td>   <td className="fw-semibold text-warning">₹{data.min_package_lpa} LPA</td></tr>
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
