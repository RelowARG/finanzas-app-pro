// Ruta: frontend/src/components/accounts/AccountTrendChart.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Función auxiliar para el formato compacto de moneda en los ejes (ej. $1.5M, $82k)
const formatCompactCurrency = (value, currency) => {
    const numValue = Number(value);
    if (isNaN(numValue)) return '';

    const absValue = Math.abs(numValue);
    let formatted = '';
    let suffix = '';

    // Umbrales y formato más precisos para la referencia:
    // Si es > 1 millón, mostrar X.XM
    // Si es > 1 mil, mostrar X.Xk
    // Si es menor a 1 mil, mostrar el valor completo sin decimales.
    if (absValue >= 1000000) {
        formatted = (absValue / 1000000).toFixed(1); // 1 decimal para millones
        suffix = 'M';
    } else if (absValue >= 1000) {
        formatted = (absValue / 1000).toFixed(1); // 1 decimal para miles
        suffix = 'k';
    } else if (absValue > 0) {
        formatted = absValue.toFixed(0); // Sin decimales si es < 1000
    } else {
        formatted = '0'; // Para el caso de 0
    }

    const symbol = currency === 'USD' ? 'U$S' : '$'; 
    // Si el valor es negativo, añadir el signo al inicio
    return `${numValue < 0 ? '-' : ''}${symbol}${formatted}${suffix}`;
};

// Función para formatear el valor completo en el tooltip
const formatFullCurrency = (value, currency) => {
    const numValue = Number(value);
    if (isNaN(numValue)) return '';
    const symbol = currency === 'USD' ? 'U$S' : '$';
    return `${symbol} ${numValue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};


const AccountTrendChart = ({ chartData, loading, error, accountCurrency, summaryData }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false }, 
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) { label += ': '; }
            if (context.parsed.y !== null) {
              label += formatFullCurrency(context.parsed.y, accountCurrency); // Usar formato completo en tooltip
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false }, // Ocultar líneas de la cuadrícula del eje X
        ticks: {
          // Formatear los labels del eje X como "DD/MM"
          callback: function(val, index) {
            const dateStr = this.getLabelForValue(val);
            const date = new Date(dateStr + 'T00:00:00Z'); 
            if (isNaN(date.getTime())) {
                return dateStr; 
            }
            const day = date.getUTCDate();
            const month = date.getUTCMonth() + 1;
            return `${day}/${month}`;
          },
          color: '#888', // Color de los labels del eje X
          font: { size: 10 }
        }
      },
      y: {
        // Asegurar que el eje Y se ajuste bien
        beginAtZero: false, // No necesariamente empieza en cero
        grid: {
          color: 'rgba(220, 220, 220, 0.5)', // Líneas de cuadrícula horizontales muy claras
          drawBorder: false // No dibujar el borde del eje Y
        },
        ticks: {
          callback: function(value) {
            return formatCompactCurrency(value, accountCurrency);
          },
          color: '#888', // Color de los labels del eje Y
          font: { size: 10 }
        },
        // Ajustar el mínimo y el máximo del eje Y si es necesario para controlar el rango
        // min: chartData ? Math.min(...chartData.datasets[0].data) * 0.9 : undefined, // 10% por debajo del mínimo
        // max: chartData ? Math.max(...chartData.datasets[0].data) * 1.1 : undefined, // 10% por encima del máximo
      }
    },
    elements: {
      line: {
        tension: 0.3, // Curva suave para la línea
        borderColor: 'rgba(52, 152, 219, 1)', // Color de la línea (azul primario)
        borderWidth: 2, // Grosor de la línea
        fill: 'origin', // Rellenar el área bajo la línea
        backgroundColor: 'rgba(52, 152, 219, 0.2)', // Color de relleno (azul con opacidad)
      },
      point: {
        radius: 0, // << CAMBIO CLAVE: Radio de los puntos a 0 para que no se vean
        hitRadius: 10, // Aumentar hitRadius para que sea fácil interactuar
        hoverRadius: 5, // Radio al pasar el mouse
        backgroundColor: 'rgba(52, 152, 219, 1)', 
        borderColor: 'white', 
        borderWidth: 1,
      }
    },
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      }
    }
  };

  // Ajuste de los datos del gráfico para incluir el fill
  const chartDataWithStyling = chartData ? {
    labels: chartData.labels,
    datasets: chartData.datasets.map(dataset => ({
      ...dataset,
      // Aseguramos que los colores y el fill se apliquen desde las opciones
      borderColor: options.elements.line.borderColor,
      backgroundColor: options.elements.line.backgroundColor,
      fill: options.elements.line.fill,
      tension: options.elements.line.tension,
      pointRadius: options.elements.point.radius,
      pointBackgroundColor: options.elements.point.backgroundColor,
      pointBorderColor: options.elements.point.borderColor,
      pointBorderWidth: options.elements.point.borderWidth,
      pointHoverRadius: options.elements.point.hoverRadius,
    }))
  } : null;

  if (loading) {
    return <p className="loading-text">Cargando tendencia...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!chartDataWithStyling || !chartDataWithStyling.labels || chartDataWithStyling.labels.length === 0) {
    return <p className="no-data-message">No hay datos de tendencia de saldo para mostrar.</p>;
  }

  return (
    <div className="chart-wrapper"> 
      <div className="chart-header-info">
        <span className="chart-current-value">
          HOY {formatFullCurrency(summaryData?.currentBalance || 0, accountCurrency)}
        </span>
        <span className={`chart-period-change ${summaryData?.changeVsPreviousPeriodPercent >= 0 ? 'positive' : 'negative'}`}>
          {summaryData?.changeVsPreviousPeriodPercent >= 0 ? '▲' : '▼'}
          {summaryData?.changeVsPreviousPeriodPercent?.toFixed(2)}% vs periodo anterior
        </span>
      </div>
      <div className="chart-container-inner"> 
        <Line data={chartDataWithStyling} options={options} /> 
      </div>
    </div>
  );
};

export default AccountTrendChart;