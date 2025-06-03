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
import WidgetLoader from './WidgetLoader'; //
import WidgetInfoIcon from './WidgetInfoIcon'; //
import './DashboardComponents.css'; //

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const SpendingChart = ({ chartData: chartDataFromHook, loading, error, widgetDescription }) => { 
  const [chartData, setChartData] = useState(null); 
  const [currencyReported, setCurrencyReported] = useState('ARS');
  const [totalExpenses, setTotalExpenses] = useState(0);
  
  // El título ahora se construye dinámicamente basado en currencyReported
  const widgetTitle = `Gastos del Mes (${currencyReported})`;

  useEffect(() => {
    if (chartDataFromHook && chartDataFromHook.datasets && chartDataFromHook.summary) {
      setChartData(chartDataFromHook);
      setCurrencyReported(chartDataFromHook.summary.currencyReported || 'ARS');
      setTotalExpenses(chartDataFromHook.summary.totalExpenses || 0);
    } else if (!loading && !error) {
      // Si no hay datos después de cargar y sin error, limpiar
      setChartData(null); 
      setTotalExpenses(0);
    }
  }, [chartDataFromHook, loading, error]);

  const options = {
    responsive: true,
    maintainAspectRatio: false, 
    plugins: {
      legend: { 
        position: 'bottom', 
        labels: { 
          boxWidth: 15, 
          padding: 10, 
          font: { size: 9 },
          // Filtrar etiquetas si el valor es 0 para no mostrar categorías vacías en la leyenda
          filter: function (legendItem, data) {
            const value = data.datasets[0].data[legendItem.index];
            return value > 0;
          }
        } 
      },
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
    
    // Nueva lógica para determinar si no hay datos
    // Si no hay datos, o todos los datos en el primer dataset son cero (que es lo que el backend envía si no hay gastos)
    const noDataAvailable = !chartData || !chartData.datasets || chartData.datasets.length === 0 || 
                            !chartData.datasets[0].data || chartData.datasets[0].data.every(item => item === 0);
    
    if (noDataAvailable) {
       return <p className="no-data-widget">No hay gastos para mostrar este mes en {currencyReported}.</p>;
    }

    // Mostrar el total de gastos debajo del título del widget (opcional)
    const formatCurrencyForDisplay = (amount, currency) => {
        const symbol = currency === 'USD' ? 'U$S' : '$';
        return `${symbol} ${Number(amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
      <div className="chart-wrapper">
        {totalExpenses > 0 && (
            <div className="total-expenses-display">
                Total: <strong>{formatCurrencyForDisplay(totalExpenses, currencyReported)}</strong>
            </div>
        )}
        <div className="chart-container">
          <Doughnut data={chartData} options={options} />
        </div>
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