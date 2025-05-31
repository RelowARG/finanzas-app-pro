// Ruta: finanzas-app-pro/frontend/src/components/reports/IncomeVsExpensesChart.jsx
import React from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import './IncomeVsExpensesChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const IncomeVsExpensesChart = ({ chartData, chartType = 'bar', reportSummary }) => {

  const currencyToDisplay = reportSummary?.currencyReported || 'ARS';

  const formatCurrencyForChart = (value) => {
    return new Intl.NumberFormat('es-AR', { 
        style: 'currency', 
        currency: currencyToDisplay,
        minimumFractionDigits: 2, // Mostrar siempre 2 decimales en tooltips y resumen
        maximumFractionDigits: 2
    }).format(value);
  };
  
  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return <p className="no-data-message">No hay datos para mostrar el informe de Ingresos vs. Egresos en {currencyToDisplay}.</p>;
  }

  // Actualizar etiquetas de datasets para incluir la moneda
  const updatedDatasets = chartData.datasets.map(dataset => ({
    ...dataset,
    label: `${dataset.label.replace(/\s\(.+?\)/, '')} (${currencyToDisplay})` // Quita la moneda vieja si existe y añade la nueva
  }));

  const dataWithUpdatedLabels = { ...chartData, datasets: updatedDatasets };


  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Ingresos vs. Egresos (${reportSummary?.period || ''}) - En ${currencyToDisplay}`,
        font: { size: 16, weight: 'bold' },
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || ''; // Ya incluye la moneda
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrencyForChart(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: chartType === 'bar', 
      },
      y: {
        stacked: chartType === 'bar',
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('es-AR', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
            }).format(value); // Solo número para el eje Y
          }
        }
      }
    },
    interaction: { 
        intersect: false,
        mode: 'index',
    },
    ...(chartType === 'line' && {
        elements: {
            line: {
                tension: 0.3 
            }
        }
    })
  };

  return (
    <div className="income-expenses-chart-widget">
      <div className="chart-container">
        {chartType === 'bar' && <Bar options={options} data={dataWithUpdatedLabels} />}
        {chartType === 'line' && <Line options={options} data={dataWithUpdatedLabels} />}
      </div>
      {reportSummary && (
        <div className="report-summary-details">
          <p><strong>Total Ingresos ({currencyToDisplay}):</strong> <span className="text-positive">{formatCurrencyForChart(reportSummary.totalIncome)}</span></p>
          <p><strong>Total Egresos ({currencyToDisplay}):</strong> <span className="text-negative">{formatCurrencyForChart(reportSummary.totalExpenses)}</span></p>
          <p><strong>Flujo Neto ({currencyToDisplay}):</strong> 
            <span className={reportSummary.netFlow >= 0 ? 'text-positive' : 'text-negative'}>
              {formatCurrencyForChart(reportSummary.netFlow)}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default IncomeVsExpensesChart;
