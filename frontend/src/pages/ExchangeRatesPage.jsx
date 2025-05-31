// finanzas-app-pro/frontend/src/pages/ExchangeRatesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import exchangeRatesService from '../services/exchangeRates.service';
import './ExchangeRatesPage.css';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-indexed

const ExchangeRatesPage = () => {
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [rate, setRate] = useState('');
  const [currentRateDisplay, setCurrentRateDisplay] = useState('');
  const [loadingRate, setLoadingRate] = useState(false);
  const [errorRate, setErrorRate] = useState('');
  const [successRate, setSuccessRate] = useState('');

  const [history, setHistory] = useState([]);
  const [historyYear, setHistoryYear] = useState(currentYear);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorHistory, setErrorHistory] = useState('');

  const monthNames = React.useMemo(() => 
    ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
  []);

  const fetchCurrentRate = useCallback(async (fetchYear, fetchMonth) => {
    setLoadingRate(true);
    setErrorRate('');
    setCurrentRateDisplay('');
    setSuccessRate(''); // Clear previous success message
    try {
      const data = await exchangeRatesService.getRate({ year: fetchYear, month: fetchMonth });
      if (data && data.rate !== null && data.rate !== undefined) { // Check for null or undefined specifically
        setRate(parseFloat(data.rate).toFixed(4)); // Show more precision if available
        setCurrentRateDisplay(`Tasa actual para ${monthNames[fetchMonth - 1]} ${fetchYear}: ${parseFloat(data.rate).toFixed(2)} ARS por USD`);
      } else {
        setRate(''); // Clear input if no rate is found
        setCurrentRateDisplay(`No hay tasa registrada para ${monthNames[fetchMonth - 1]} ${fetchYear}.`);
      }
    } catch (err) {
      setErrorRate(err.message || 'Error al obtener la tasa actual.');
      setRate(''); // Clear input on error
    } finally {
      setLoadingRate(false);
    }
  }, [monthNames]);

  const fetchHistory = useCallback(async (fetchHistYear) => {
    setLoadingHistory(true);
    setErrorHistory('');
    try {
      const data = await exchangeRatesService.getRateHistory({ year: fetchHistYear });
      setHistory(data || []);
    } catch (err) {
      setErrorHistory(err.message || 'Error al obtener el historial de tasas.');
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentRate(year, month);
  }, [year, month, fetchCurrentRate]);

  useEffect(() => {
    fetchHistory(historyYear);
  }, [historyYear, fetchHistory]);

  const handleSetRateSubmit = async (e) => {
    e.preventDefault();
    if (!rate || parseFloat(rate) <= 0) {
        setErrorRate('Por favor, ingresa una tasa válida mayor a cero.');
        return;
    }
    setLoadingRate(true);
    setErrorRate('');
    setSuccessRate('');
    try {
      const updatedRate = await exchangeRatesService.setRate({ year, month, rate: parseFloat(rate) });
      setSuccessRate(`Tasa para ${monthNames[month - 1]} ${year} guardada: ${parseFloat(updatedRate.rate).toFixed(2)} ARS por USD`);
      // No es necesario llamar a fetchCurrentRate aquí si el input 'rate' ya se actualizó
      // y el mensaje de éxito muestra el valor guardado.
      // Si se quiere forzar la recarga del display:
      fetchCurrentRate(year, month); 
      if (year === historyYear) {
        fetchHistory(historyYear);
      }
    } catch (err) {
      setErrorRate(err.message || 'Error al guardar la tasa.');
    } finally {
      setLoadingRate(false);
    }
  };
  
  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    setYear(newYear);
    // fetchCurrentRate(newYear, month); // Se activa por el useEffect
  };

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    setMonth(newMonth);
    // fetchCurrentRate(year, newMonth); // Se activa por el useEffect
  };
  
  const handleHistoryYearChange = (e) => {
     const newHistYear = parseInt(e.target.value,10);
     setHistoryYear(newHistYear);
     // fetchHistory(newHistYear); // Se activa por el useEffect
  }

  const yearsForSelect = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);


  return (
    <div className="page-container exchange-rates-page">
      <div className="page-header">
        <h1>Cotización Dólar Mensual (USD a ARS)</h1>
      </div>

      <section className="rate-form-section">
        <h2>Establecer/Actualizar Tasa del Mes</h2>
        <form onSubmit={handleSetRateSubmit}>
          <div className="rate-form-grid">
            <div className="form-group">
              <label htmlFor="year">Año:</label>
              <select id="year" value={year} onChange={handleYearChange} required>
                {yearsForSelect.map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="month">Mes:</label>
              <select id="month" value={month} onChange={handleMonthChange} required>
                {monthNames.map((name, index) => (
                  <option key={index + 1} value={index + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="rate">Tasa (1 USD = X ARS):</label>
              <input 
                type="number" 
                id="rate" 
                value={rate} 
                onChange={(e) => setRate(e.target.value)} 
                step="0.0001" // Permitir más decimales para la tasa
                min="0.0001" 
                placeholder="Ej: 950.5000" 
                required 
              />
            </div>
            <div className="form-group">
              <button type="submit" className="button button-primary" disabled={loadingRate}>
                {loadingRate ? 'Guardando...' : 'Guardar Tasa'}
              </button>
            </div>
          </div>
          {loadingRate && <p className="loading-text" style={{textAlign:'left', marginTop:'10px'}}>Cargando/Guardando tasa...</p>}
          {errorRate && <p className="error-message" style={{marginTop:'10px'}}>{errorRate}</p>}
          {successRate && <p className="success-message">{successRate}</p>}
          {!loadingRate && !errorRate && currentRateDisplay && 
            <p className="no-current-rate-message" style={{marginTop:'10px', fontWeight:'bold', textAlign:'left', background:'none', paddingLeft:0}}>
              {currentRateDisplay}
            </p>
          }
        </form>
      </section>

      <section className="rate-history-section">
        <h2>Historial de Tasas Guardadas (USD a ARS)</h2>
         <div className="history-filter-controls">
            <div className="form-group">
                <label htmlFor="historyYear">Filtrar por Año:</label>
                 <select id="historyYear" value={historyYear} onChange={handleHistoryYearChange}>
                    {yearsForSelect.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>
        </div>
        {loadingHistory && <p className="loading-text">Cargando historial...</p>}
        {errorHistory && <p className="error-message">{errorHistory}</p>}
        {!loadingHistory && !errorHistory && history.length > 0 ? (
          <table className="history-table">
            <thead>
              <tr>
                <th>Año</th>
                <th>Mes</th>
                <th>1 USD = ARS</th>
                <th>Guardado/Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td>{h.year}</td>
                  <td>{monthNames[h.month - 1]}</td>
                  <td>{parseFloat(h.rate).toFixed(4)}</td>
                  <td>{new Date(h.updatedAt).toLocaleDateString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loadingHistory && !errorHistory && <p className="no-history-message">No hay historial de tasas para el año seleccionado.</p>
        )}
      </section>
    </div>
  );
};

export default ExchangeRatesPage;