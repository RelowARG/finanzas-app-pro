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
import WidgetLoader from './WidgetLoader'; // *** IMPORTAR WidgetLoader ***
import './DashboardComponents.css'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css]
import dashboardService from '../../services/dashboard.service'; // [cite: finanzas-app-pro/frontend/src/services/dashboard.service.js]

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Aceptar chartData, loading y error como props
const BalanceTrendWidget = ({ chartData, loading, error }) => {

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: chartData?.datasets?.length > 1, 
      },
      title: {
        display: false, 
      },
      tooltip: {
        enabled: true, 
        animation: { 
          duration: 150, 
        },
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
        beginAtZero: false, 
        ticks: {
          callback: function(value) {
            if (Math.abs(value) >= 1000000) return (value / 1000000).toFixed(1) + 'M';
            if (Math.abs(value) >= 1000) return (value / 1000).toFixed(0) + 'k';
            return value.toFixed(0); 
          }
        }
      },
      x: {
        grid: {
          display: false, 
        }
      }
    },
    animation: { 
        duration: 800, 
        easing: 'easeOutQuart'
    }
  };

  const renderContent = () => {
    if (loading) {
      return <WidgetLoader message="Cargando tendencia..." />;
    }
    if (error) {
      return <p className="error-message" style={{ textAlign: 'center' }}>{typeof error === 'string' ? error : 'Error al cargar tendencia.'}</p>;
    }
    if (!chartData || !chartData.datasets || chartData.datasets.length === 0 || chartData.datasets[0].data.length === 0) {
      return <p className="no-data-widget">No hay datos suficientes para mostrar la tendencia.</p>; {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
    }
    return (
      <>
        {chartData.summary && (
            <div className="balance-trend-summary"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
                <div className="current-balance-value"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: chartData.summary.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(chartData.summary.currentBalance)}
                </div>
                <div className={`period-change ${chartData.summary.changeVsPreviousPeriodPercent >= 0 ? 'text-positive' : 'text-negative'}`}> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
                    {chartData.summary.changeVsPreviousPeriodPercent >= 0 ? '▲' : '▼'} {Math.abs(chartData.summary.changeVsPreviousPeriodPercent)}% vs mes anterior
                </div>
            </div>
        )}
        <div className="chart-container" style={{height: chartData.summary ? 'calc(100% - 70px)' : '100%' }}>  {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
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