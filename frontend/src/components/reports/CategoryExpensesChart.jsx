// Ruta: finanzas-app-pro/frontend/src/components/reports/CategoryExpensesChart.jsx
import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import './CategoryExpensesChart.css';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

const CategoryExpensesChart = ({ chartData, chartType = 'doughnut', reportSummary }) => {
  
  const currencyToDisplay = reportSummary?.currencyReported || 'ARS'; // Usar la moneda del reporte

  const formatCurrencyForChart = (value) => {
    return new Intl.NumberFormat('es-AR', { 
        style: 'currency', 
        currency: currencyToDisplay,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
  };

  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return <p className="no-data-message">No hay datos de gastos para mostrar en el período seleccionado en {currencyToDisplay}.</p>;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 15,
          padding: 15,
          font: { size: 11 }
        }
      },
      title: {
        display: true,
        text: `Distribución de Gastos por Categoría (${currencyToDisplay})`,
        font: { size: 16, weight: 'bold' },
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            const value = chartType === 'doughnut' ? context.parsed : context.parsed.y;
            if (value !== null && value !== undefined) {
              label += formatCurrencyForChart(value);
              if (chartType === 'doughnut' || chartType === 'pie') {
                const total = context.chart.data.datasets[0].data.reduce((sum, val) => sum + parseFloat(val), 0);
                const percentage = total > 0 ? ((parseFloat(value) / total) * 100).toFixed(1) : 0;
                label += ` (${percentage}%)`;
              }
            }
            return label;
          }
        }
      }
    },
    ...(chartType === 'doughnut' && { cutout: '50%' }),
    ...(chartType === 'bar' && {
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        // Solo el número para el eje, sin el símbolo de moneda para no saturar
                        return new Intl.NumberFormat('es-AR', { 
                            minimumFractionDigits: 0, // Ajustar según preferencia
                            maximumFractionDigits: 0 
                        }).format(value);
                    }
                }
            }
        }
    })
  };

  return (
    <div className="category-expenses-chart-widget">
      <div className="chart-container">
        {chartType === 'doughnut' && <Doughnut data={chartData} options={options} />}
        {chartType === 'bar' && <Bar data={chartData} options={options} />}
      </div>
      {reportSummary && (
        <div className="report-summary-details">
          <p><strong>Total Gastado ({currencyToDisplay}):</strong> {formatCurrencyForChart(reportSummary.totalExpenses)}</p>
          <p><strong>Categorías con Gastos:</strong> {reportSummary.numberOfCategories}</p>
        </div>
      )}
    </div>
  );
};

export default CategoryExpensesChart;
