// Ruta: finanzas-app-pro/frontend/src/components/reports/ReportFilters.jsx
import React, { useState, useEffect } from 'react';
import './ReportFilters.css';

const ReportFilters = ({ onApplyFilters, availableReportTypes, initialFilters }) => {
  const defaultDateFrom = initialFilters?.dateFrom || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const defaultDateTo = initialFilters?.dateTo || new Date().toISOString().split('T')[0];
  const defaultReportType = initialFilters?.reportType || (availableReportTypes && availableReportTypes.length > 0 ? availableReportTypes[0].value : '');
  const defaultDisplayCurrency = initialFilters?.displayCurrency || 'ARS'; // Moneda por defecto para visualización

  const [selectedReportType, setSelectedReportType] = useState(defaultReportType);
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(defaultDateTo);
  const [displayCurrency, setDisplayCurrency] = useState(defaultDisplayCurrency); // Nuevo estado

  // Sincronizar con initialFilters si cambian desde el padre (ej. al cambiar tipo de reporte)
  useEffect(() => {
    if (initialFilters) {
      setSelectedReportType(initialFilters.reportType || (availableReportTypes && availableReportTypes.length > 0 ? availableReportTypes[0].value : ''));
      setDateFrom(initialFilters.dateFrom || defaultDateFrom);
      setDateTo(initialFilters.dateTo || defaultDateTo);
      setDisplayCurrency(initialFilters.displayCurrency || 'ARS');
    }
  }, [initialFilters, availableReportTypes, defaultDateFrom, defaultDateTo]);


  const handleSubmit = (e) => {
    e.preventDefault();
    onApplyFilters({
      reportType: selectedReportType,
      dateFrom,
      dateTo,
      displayCurrency, // Incluir la moneda de visualización en los filtros
    });
  };

  const currencyOptions = [
    { value: 'ARS', label: 'Pesos Argentinos (ARS)' },
    { value: 'USD', label: 'Dólares Estadounidenses (USD)' },
    // Podrías añadir más si tu backend las soporta para conversión
  ];

  return (
    <form className="report-filters-form" onSubmit={handleSubmit}>
      <h4>Configurar Informe</h4>
      <div className="report-filter-grid">
        <div className="filter-group">
          <label htmlFor="reportType">Tipo de Informe:</label>
          <select 
            id="reportType" 
            value={selectedReportType} 
            onChange={(e) => setSelectedReportType(e.target.value)}
          >
            {availableReportTypes && availableReportTypes.map(rt => (
              <option key={rt.value} value={rt.value}>{rt.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="dateFrom">Desde:</label>
          <input type="date" id="dateFrom" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="filter-group">
          <label htmlFor="dateTo">Hasta:</label>
          <input type="date" id="dateTo" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        {/* Nuevo selector de moneda de visualización */}
        <div className="filter-group">
          <label htmlFor="displayCurrency">Moneda de Visualización:</label>
          <select 
            id="displayCurrency" 
            value={displayCurrency} 
            onChange={(e) => setDisplayCurrency(e.target.value)}
          >
            {currencyOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="filter-actions">
        <button type="submit" className="button button-primary">Generar Informe</button>
      </div>
    </form>
  );
};

export default ReportFilters;