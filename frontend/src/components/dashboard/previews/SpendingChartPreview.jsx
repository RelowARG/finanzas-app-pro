// Ruta: src/components/dashboard/previews/SpendingChartPreview.jsx
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'; // Solo lo necesario para el preview
import './PreviewStyles.css'; // Un CSS común para previews o específico

ChartJS.register(ArcElement, Tooltip);

const SpendingChartPreview = () => {
  const data = {
    labels: ['Alimentación', 'Transporte', 'Servicios', 'Ocio'],
    datasets: [
      {
        data: [350, 150, 200, 250], // Datos de ejemplo
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',  // Rojo
          'rgba(54, 162, 235, 0.6)', // Azul
          'rgba(255, 206, 86, 0.6)', // Amarillo
          'rgba(75, 192, 192, 0.6)', // Verde Agua
        ],
        borderColor: [ // Opcional: bordes más oscuros
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1, // Un borde sutil
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Importante para que se ajuste al contenedor
    plugins: {
      legend: { display: false }, // Ocultar leyenda en preview
      title: { display: false }, // Ocultar título en preview
      tooltip: { enabled: false }, // Deshabilitar tooltips en preview
    },
    cutout: '60%', // Hacerlo un donut
    animation: {
        duration: 0 // Deshabilitar animación para previews estáticos
    }
  };

  return (
    <div className="widget-preview-container">
      {/* Podrías añadir un título pequeño si quieres */}
      {/* <p className="preview-widget-title">Gastos del Mes</p> */}
      <div className="preview-chart-wrapper">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
};

export default SpendingChartPreview;