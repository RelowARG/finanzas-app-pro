// Ruta: src/components/dashboard/BalanceTrendWidget.jsx
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './DashboardComponents.css';
import dashboardService from '../../services/dashboard.service'; // Importar el servicio

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BalanceTrendWidget = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBalanceTrend = async () => {
      setLoading(true);
      setError('');
      try {
        // --- LLAMADA REAL AL SERVICIO ---
        const dataFromApi = await dashboardService.getBalanceTrendData({ months: 6 });
        setChartData(dataFromApi);

      } catch (err) {
        console.error("Error fetching balance trend data:", err);
        setError('Error al cargar la tendencia del saldo.');
        setChartData({ // Estructura por defecto en caso de error para que el gráfico no falle
          labels: [],
          datasets: [],
          summary: { currentBalance: 0, currency: 'ARS', changeVsPreviousPeriodPercent: 0 }
        });
      } finally {
        setLoading(false);
      }
    };
    fetchBalanceTrend();
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: chartData?.datasets?.length > 1, // Mostrar leyenda si hay más de un dataset
      },
      title: {
        display: false, // El título del widget ya es "Tendencia del Saldo"
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) { label += ': '; }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('es-AR', {
                style: 'currency', currency: chartData?.summary?.currency || 'ARS',
                minimumFractionDigits: 0, maximumFractionDigits: 0
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false, // Permitir que el eje Y se ajuste mejor a los datos
        ticks: {
          callback: function(value) {
            if (Math.abs(value) >= 1000000) return (value / 1000000).toFixed(1) + 'M';
            if (Math.abs(value) >= 1000) return (value / 1000).toFixed(0) + 'k';
            return value.toFixed(0); // Ajustar decimales si es necesario
          }
        }
      },
      x: {
        grid: {
          display: false, // Ocultar líneas de grid vertical
        }
      }
    },
  };

  const renderContent = () => {
    if (loading) {
      return <p className="loading-text-widget">Cargando tendencia...</p>;
    }
    if (error) {
      return <p className="error-message" style={{ textAlign: 'center' }}>{error}</p>;
    }
    if (!chartData || !chartData.datasets || chartData.datasets.length === 0 || chartData.datasets[0].data.length === 0) {
      return <p className="no-data-widget">No hay datos suficientes para mostrar la tendencia.</p>;
    }
    return (
      <>
        {chartData.summary && (
            <div className="balance-trend-summary">
                <div className="current-balance-value">
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: chartData.summary.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(chartData.summary.currentBalance)}
                </div>
                <div className={`period-change ${chartData.summary.changeVsPreviousPeriodPercent >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {chartData.summary.changeVsPreviousPeriodPercent >= 0 ? '▲' : '▼'} {Math.abs(chartData.summary.changeVsPreviousPeriodPercent)}% vs mes anterior
                </div>
            </div>
        )}
        <div className="chart-container" style={{height: chartData.summary ? 'calc(100% - 70px)' : '100%' }}> {/* Ajustar altura si hay resumen */}
          <Bar data={chartData} options={options} />
        </div>
      </>
    );
  };

  return (
    <div className="dashboard-widget balance-trend-widget">
      <h3>Tendencia del Saldo</h3>
      <div className="dashboard-widget-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default BalanceTrendWidget;