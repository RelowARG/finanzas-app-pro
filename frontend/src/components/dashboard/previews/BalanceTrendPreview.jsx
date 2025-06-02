// Ruta: src/components/dashboard/previews/BalanceTrendPreview.jsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from 'chart.js';
import '../../dashboard/DashboardComponents.css'; // Estilos generales del widget
import './PreviewStyles.css'; // Estilos específicos para previews

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

const BalanceTrendPreview = () => {
  const data = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr'],
    datasets: [
      {
        label: 'Saldo Total (ARS Aprox.)',
        data: [180000, 195000, 190000, 210000], // Datos de ejemplo
        backgroundColor: 'rgba(52, 152, 219, 0.5)', // Azul claro con opacidad
        borderColor: 'rgba(52, 152, 219, 1)', // Azul más oscuro para el borde
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Importante para que el gráfico se ajuste al contenedor
    plugins: {
      legend: { display: false }, // Ocultar leyenda en la previsualización
      title: { display: false }, // El título ya está en el widget principal
      tooltip: { enabled: false }, // Deshabilitar tooltips en la previsualización
    },
    scales: {
      y: {
        beginAtZero: false, // El eje Y no necesariamente empieza en cero para tendencias
        ticks: { display: false }, // Ocultar los números (ticks) del eje Y
        grid: { 
            drawTicks: false, // No dibujar las marcas de los ticks
            drawBorder: false, // No dibujar el borde del eje
            display: false, // Ocultar completamente las líneas de la cuadrícula del eje Y
        } 
      },
      x: {
        ticks: { 
            font: {size: 8}, // Ticks del eje X más pequeños
            maxRotation: 0, // Evitar rotación de etiquetas si es posible
            minRotation: 0
        }, 
        grid: { 
            display: false // Ocultar líneas de cuadrícula del eje X
        }
      },
    },
    animation: {
        duration: 0 // Deshabilitar animación para que la previsualización sea instantánea
    }
  };

  return (
    <div className="dashboard-widget balance-trend-widget preview-mode">
      <h3>Tendencia del Saldo</h3>
       <div className="dashboard-widget-content" style={{padding: '5px'}}> {/* Menos padding para el contenido del preview */}
        {/* Sección de resumen simplificada para el preview */}
        <div className="balance-trend-summary" style={{padding: '5px 0', marginBottom:'3px'}}>
            <div className="current-balance-value" style={{fontSize: '1rem'}}> {/* Valor más pequeño */}
                $ 210.000
            </div>
            <div className="period-change text-positive" style={{fontSize: '0.65rem'}}> {/* Texto más pequeño */}
                ▲ 5.2% vs mes anterior
            </div>
        </div>
        {/* Contenedor del gráfico ajustado para el preview */}
        <div className="chart-container" style={{ height: 'calc(100% - 50px)' }}> {/* Ajustar altura si es necesario */}
          <Bar data={data} options={options} />
        </div>
      </div>
    </div>
  );
};

export default BalanceTrendPreview;