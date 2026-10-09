import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const PALETTE = [
  "#0d6efd", "#198754", "#ffc107", "#dc3545",
  "#0dcaf0", "#6f42c1", "#fd7e14", "#20c997",
  "#6610f2", "#d63384", "#343a40", "#adb5bd",
];

export default function PieChart({ labels, data, title, optionsOverride = {} }) {
  const total = data.reduce((a, b) => a + b, 0);

  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: PALETTE.slice(0, data.length),
      borderColor:     "#fff",
      borderWidth:     2,
      hoverOffset:     8,
    }],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
        labels: { boxWidth: 13, font: { size: 12 }, padding: 14 },
      },
      title: { display: !!title, text: title },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const pct = total ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
            return `  ${ctx.label}: ${ctx.parsed} hires (${pct}%)`;
          },
        },
      },
    },
    ...optionsOverride,
  };

  return <Pie data={chartData} options={options} />;
}
