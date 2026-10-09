import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
);

export default function LineChart({ labels, datasets, title, optionsOverride = {} }) {
  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top", labels: { boxWidth: 12, font: { size: 12 } } },
      title: { display: !!title, text: title },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(0,0,0,.05)" } },
      x: { grid: { display: false } },
    },
    ...optionsOverride,
  };

  return <Line data={{ labels, datasets }} options={options} />;
}
