import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const PALETTE = [
  "#0d6efd", "#198754", "#ffc107", "#dc3545",
  "#0dcaf0", "#6f42c1", "#fd7e14", "#20c997",
];

export default function DoughnutChart({ labels, data, title, optionsOverride = {} }) {
  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: PALETTE.slice(0, data.length),
      borderWidth: 2,
      borderColor: "#fff",
      hoverOffset: 6,
    }],
  };

  const options = {
    responsive: true,
    cutout: "68%",
    plugins: {
      legend: { position: "right", labels: { boxWidth: 12, font: { size: 12 } } },
      title: { display: !!title, text: title },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed}`,
        },
      },
    },
    ...optionsOverride,
  };

  return <Doughnut data={chartData} options={options} />;
}
