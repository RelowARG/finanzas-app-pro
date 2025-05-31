// Ruta: finanzas-app-pro/frontend/src/pages/ReportsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import reportsService from '../services/reports.service';
import ReportFilters from '../components/reports/ReportFilters';
import CategoryExpensesChart from '../components/reports/CategoryExpensesChart';
import IncomeVsExpensesChart from '../components/reports/IncomeVsExpensesChart';
import './ReportsPage.css';

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [conversionNotes, setConversionNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [currentFilters, setCurrentFilters] = useState({
    reportType: 'expensesByCategory',
    dateFrom: firstDayOfMonth,
    dateTo: today,
    displayCurrency: 'ARS', // Moneda por defecto para visualización
  });

  const availableReportTypes = [
    { value: 'expensesByCategory', label: 'Gastos por Categoría' },
    { value: 'incomeVsExpenses', label: 'Ingresos vs. Egresos (Mensual)' },
  ];

  const generateReport = useCallback(async (filters) => {
    setLoading(true);
    setError('');
    setReportData(null);
    setReportSummary(null);
    setConversionNotes([]);
    setCurrentFilters(filters); 

    try {
      let data;
      const backendFilters = {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        // El backend para expensesByCategory usa 'currency' como targetCurrency
        // El backend para incomeVsExpenses usa 'displayCurrency' como targetCurrency
        // Aseguramos que el nombre del parámetro sea el esperado por cada endpoint
      };

      if (filters.reportType === 'expensesByCategory') {
        backendFilters.currency = filters.displayCurrency; // Para expensesByCategory
        data = await reportsService.getExpensesByCategoryReport(backendFilters);
      } else if (filters.reportType === 'incomeVsExpenses') {
        backendFilters.displayCurrency = filters.displayCurrency; // Para incomeVsExpenses
        // Si el reporte de Ingresos vs Egresos tiene un filtro de 'months', se podría añadir aquí
        // backendFilters.months = filters.months || 6; // Ejemplo
        data = await reportsService.getIncomeVsExpensesReport(backendFilters);
      } else {
        setError('Tipo de informe no soportado aún.');
        setLoading(false);
        return;
      }
      
      if (data) {
        setReportData(data); // Contiene labels y datasets
        setReportSummary(data.summary); // Contiene totales y moneda reportada
        setConversionNotes(data.summary?.conversionNotes || []);
      } else {
        setError('No se recibieron datos para el informe.');
      }

    } catch (err) {
      console.error("Error generating report:", err);
      setError(err.response?.data?.message || err.message || 'Error al generar el informe.');
    } finally {
      setLoading(false);
    }
  }, []); 
  
  useEffect(() => {
    generateReport(currentFilters);
  }, [generateReport]); // generateReport ahora está en useCallback y no cambiará a menos que sus dependencias lo hagan (ninguna por ahora)

  return (
    <div className="page-container reports-page">
      <div className="reports-page-header">
        <h1>Informes Financieros</h1>
      </div>

      <ReportFilters 
        onApplyFilters={generateReport} 
        availableReportTypes={availableReportTypes}
        initialFilters={currentFilters} 
      />

      {loading && <p className="loading-text">Generando informe...</p>}
      {error && <p className="error-message">{error}</p>}

      {conversionNotes.length > 0 && !loading && (
        <div className="conversion-notes-container">
          <h4>Notas sobre la Conversión de Moneda:</h4>
          <ul>
            {conversionNotes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {!loading && !error && reportData && (
        <>
          {currentFilters.reportType === 'expensesByCategory' && (
            <CategoryExpensesChart 
              chartData={reportData} 
              chartType="doughnut" // o "bar"
              reportSummary={reportSummary} 
            />
          )}
          {currentFilters.reportType === 'incomeVsExpenses' && (
            <IncomeVsExpensesChart 
              chartData={reportData} 
              chartType="bar" // o "line"
              reportSummary={reportSummary} 
            />
          )}
        </>
      )}
      
      {!loading && !error && !reportData && !error && ( // Condición adicional para no mostrar si hay error
          <p className="no-data-message">Selecciona los filtros y genera un informe.</p>
      )}
    </div>
  );
};

export default ReportsPage;