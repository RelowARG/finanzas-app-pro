// Ruta: src/components/dashboard/SpendingChart.jsx
import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import dashboardService from '../../services/dashboard.service';
import './DashboardComponents.css'; 

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const SpendingChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currencyReported, setCurrencyReported] = useState('ARS');

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await dashboardService.getMonthlySpendingByCategory(); 
        if (data && data.labels && data.datasets && data.summary) {
          setChartData(data);
          setCurrencyReported(data.summary.currencyReported || 'ARS');
        } else {
          setError('No hay datos suficientes para mostrar el gráfico de gastos.');
          setChartData(null);
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
    maintainAspectRatio: false, // Muy importante para que el gráfico se adapte al contenedor
    plugins: {
      legend: {
        position: 'bottom', // Posición de la leyenda como en la imagen objetivo
        labels: { 
          boxWidth: 15, // Ancho de la caja de color de la leyenda
          padding: 10, // Espaciado de la leyenda
          font: { size: 9 } // Tamaño de fuente más pequeño para la leyenda
        }
      },
      title: { 
        display: false, // El título "Gastos del Mes" ya está en el h3 del widget
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) { label += ': '; }
            if (context.parsed !== null) {
              label += new Intl.NumberFormat('es-AR', { 
                style: 'currency', currency: currencyReported, 
                minimumFractionDigits: 2, maximumFractionDigits: 2 
              }).format(context.parsed);
            }
            return label;
          }
        }
      }
    },
    cutout: '60%', 
  };

  const renderContent = () => {
    if (loading) {
      return <p className="loading-text-widget">Cargando gráfico...</p>;
    }
    if (error) {
      return <p className="error-message" style={{textAlign: 'center'}}>{error}</p>;
    }
    const noDataAvailable = !chartData || !chartData.datasets || chartData.datasets.length === 0 || chartData.datasets[0].data.length === 0 || chartData.datasets[0].data.every(item => item === 0);
    if (noDataAvailable) {
       return <p className="no-data-widget">No hay datos de gastos para mostrar este mes en {currencyReported}.</p>;
    }
    return (
      <div className="chart-container">
        <Doughnut data={chartData} options={options} />
      </div>
    );
  };
  
  return (
    <div className="dashboard-widget spending-chart-widget"> {/* Clase específica opcional */}
      <h3>Gastos del Mes ({currencyReported})</h3>
      <div className="dashboard-widget-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default SpendingChart;