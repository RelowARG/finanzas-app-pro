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
import WidgetLoader from './WidgetLoader';
import WidgetInfoIcon from './WidgetInfoIcon';
import './DashboardComponents.css';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const SpendingChart = ({ chartData: chartDataFromHook, loading, error, widgetDescription }) => { 
  const [chartData, setChartData] = useState(null); 
  const [currencyReported, setCurrencyReported] = useState('ARS');
  
  // El título ahora se construye dinámicamente basado en currencyReported
  const widgetTitle = `Gastos del Mes (${currencyReported})`;

  useEffect(() => {
    if (chartDataFromHook && chartDataFromHook.datasets && chartDataFromHook.summary) {
      setChartData(chartDataFromHook);
      setCurrencyReported(chartDataFromHook.summary.currencyReported || 'ARS');
    } else if (!loading && !error) {
      setChartData(null); 
    }
  }, [chartDataFromHook, loading, error]);

  const options = {
    responsive: true,
    maintainAspectRatio: false, 
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 15, padding: 10, font: { size: 9 } } },
      title: { display: false }, 
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
    animation: { duration: 800, easing: 'easeOutQuart' }
  };

  const renderContent = () => {
    if (loading) {
      return <WidgetLoader message="Cargando gráfico de gastos..." />;
    }
    if (error) {
      return <p className="error-message" style={{textAlign: 'center'}}>
        {typeof error === 'string' ? error : 'Error al cargar gráfico de gastos.'}
      </p>;
    }
    
    const dataToRender = chartData; 
    const noDataAvailable = !dataToRender || !dataToRender.datasets || dataToRender.datasets.length === 0 || dataToRender.datasets[0].data.length === 0 || dataToRender.datasets[0].data.every(item => item === 0);
    
    if (noDataAvailable) {
       return <p className="no-data-widget">No hay gastos para mostrar este mes en {currencyReported}.</p>;
    }
    return (
      <div className="chart-container">
        <Doughnut data={dataToRender} options={options} />
      </div>
    );
  };
  
  return (
    <div className="dashboard-widget spending-chart-widget"> 
      <div className="widget-header-container">
        <h3>{widgetTitle}</h3>
        <WidgetInfoIcon description={widgetDescription} />
      </div>
      <div className="dashboard-widget-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default SpendingChart;