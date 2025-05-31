// Ruta: finanzas-app-pro/frontend/src/components/dashboard/SpendingChart.jsx
import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import dashboardService from '../../services/dashboard.service'; // Usamos el dashboardService
import './DashboardComponents.css'; 

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const SpendingChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currencyReported, setCurrencyReported] = useState('ARS'); // Moneda del reporte

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError('');
        // dashboardService.getMonthlySpendingByCategory ya pide el reporte en ARS por defecto
        const data = await dashboardService.getMonthlySpendingByCategory(); 
        if (data && data.labels && data.datasets && data.summary) {
          setChartData(data);
          setCurrencyReported(data.summary.currencyReported || 'ARS');
        } else {
          setError('No hay datos suficientes para mostrar el gráfico de gastos.');
          setChartData(null); // Asegurar que no haya datos viejos
        }
      } catch (err) {
        console.error("Error fetching spending chart data:", err);
        setError('Error al cargar datos del gráfico de gastos.');
        setChartData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top', 
        labels: {
          boxWidth: 20,
          padding: 15,
          font: {
            size: 10 
          }
        }
      },
      title: {
        display: false, 
        // text: `Gastos del Mes por Categoría (${currencyReported})`, // El título del widget ya lo dice
        // font: { size: 16 }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              // Formatear como moneda usando la moneda reportada
              label += new Intl.NumberFormat('es-AR', { 
                style: 'currency', 
                currency: currencyReported, // Usar la moneda del reporte
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              }).format(context.parsed);
            }
            return label;
          }
        }
      }
    },
    cutout: '60%', 
  };

  if (loading) {
    return (
      <div className="dashboard-widget spending-chart-widget">
        <h3>Gastos del Mes ({currencyReported})</h3>
        <div className="chart-container" style={{ minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="loading-text-widget">Cargando gráfico...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-widget spending-chart-widget">
        <h3>Gastos del Mes ({currencyReported})</h3>
        <p className="error-message" style={{textAlign: 'center'}}>{error}</p>
      </div>
    );
  }
  
  // Verifica si hay datos para mostrar en el gráfico
  const noDataAvailable = !chartData || !chartData.datasets || chartData.datasets.length === 0 || chartData.datasets[0].data.length === 0 || chartData.datasets[0].data.every(item => item === 0);

  if (noDataAvailable) {
     return (
      <div className="dashboard-widget spending-chart-widget">
        <h3>Gastos del Mes ({currencyReported})</h3>
        <div className="chart-container" style={{ minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <p className="no-data-widget">No hay datos de gastos para mostrar este mes en {currencyReported}.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="dashboard-widget spending-chart-widget">
      <h3>Gastos del Mes ({currencyReported})</h3>
      <div className="chart-container" style={{ height: '280px', position: 'relative' }}>
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

export default SpendingChart;