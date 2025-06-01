// Ruta: finanzas-app-pro/frontend/src/pages/AddAccountPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import accountService from '../services/accounts.service'; // [cite: finanzas-app-pro/frontend/src/services/accounts.service.js]
import './AddAccountPage.css'; // [cite: finanzas-app-pro/frontend/src/pages/AddAccountPage.css]

const AddAccountPage = () => {
  const navigate = useNavigate();

  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('efectivo'); 
  const [initialBalance, setInitialBalance] = useState('');
  const [currency, setCurrency] = useState('ARS'); 
  const [icon, setIcon] = useState('💰'); 
  
  const [bankName, setBankName] = useState('');
  const [accountNumberLast4, setAccountNumberLast4] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [includeInDashboardSummary, setIncludeInDashboardSummary] = useState(true);
  
  // Nuevos estados para tarjetas de crédito
  const [statementBalance, setStatementBalance] = useState('');
  const [statementCloseDate, setStatementCloseDate] = useState('');
  const [statementDueDate, setStatementDueDate] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const accountTypeOptions = [
    { value: 'efectivo', label: 'Efectivo', icon: '💵' },
    { value: 'bancaria', label: 'Cuenta Bancaria', icon: '🏦' },
    { value: 'tarjeta_credito', label: 'Tarjeta de Crédito', icon: '💳' },
    { value: 'inversion', label: 'Cuenta de Inversión', icon: '📈' },
    { value: 'digital_wallet', label: 'Billetera Digital', icon: '📱' },
    { value: 'otro', label: 'Otro', icon: '📁' },
  ];

  const currencyOptions = [
    { value: 'ARS', label: 'ARS - Peso Argentino' },
    { value: 'USD', label: 'USD - Dólar Estadounidense' },
  ];

  useEffect(() => {
    const selectedType = accountTypeOptions.find(opt => opt.value === accountType);
    if (selectedType) {
      setIcon(selectedType.icon);
    }
    // Limpiar campos específicos de tarjeta si no es tarjeta de crédito
    if (accountType !== 'tarjeta_credito') {
      setStatementBalance('');
      setStatementCloseDate('');
      setStatementDueDate('');
      setCreditLimit(''); // El límite también es más relevante para tarjetas
    }
  }, [accountType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountName.trim() || !accountType) {
      setError('El nombre y el tipo de cuenta son requeridos.');
      return;
    }
    setError('');
    setLoading(true);

    const accountData = {
      name: accountName.trim(),
      type: accountType,
      balance: parseFloat(initialBalance) || 0.00, 
      currency: currency,
      icon: icon,
      bankName: bankName.trim() || null, 
      accountNumberLast4: accountNumberLast4.trim() || null, 
      creditLimit: accountType === 'tarjeta_credito' && creditLimit ? parseFloat(creditLimit) : null, 
      includeInDashboardSummary,
    };

    if (accountType === 'tarjeta_credito') {
      accountData.statementBalance = statementBalance ? parseFloat(statementBalance) : null;
      accountData.statementCloseDate = statementCloseDate || null;
      accountData.statementDueDate = statementDueDate || null;
    }

    try {
      await accountService.createAccount(accountData); // [cite: finanzas-app-pro/frontend/src/services/accounts.service.js]
      navigate('/accounts'); 
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al crear la cuenta. Intenta de nuevo.');
      console.error("Error creating account:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container add-account-page"> 
      <div className="form-container" style={{maxWidth: '600px'}}>
        <h2>Agregar Nueva Cuenta</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}

          <div className="form-group">
            <label htmlFor="accountName">Nombre de la Cuenta:</label>
            <input
              type="text"
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
              placeholder="Ej: Ahorros Banco Nación, Tarjeta Visa"
            />
          </div>

          <div className="form-group">
            <label htmlFor="accountType">Tipo de Cuenta:</label>
            <select id="accountType" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
              {accountTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="initialBalance">Saldo Inicial:</label>
            <input
              type="number"
              id="initialBalance"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              step="0.01"
              placeholder="0.00 (Negativo para deudas de tarjetas)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="currency">Moneda:</label>
            <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {currencyOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {(accountType === 'bancaria' || accountType === 'tarjeta_credito') && (
            <div className="form-group">
              <label htmlFor="bankName">Nombre del Banco/Emisor (Opcional):</label>
              <input type="text" id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ej: Banco Galicia, Visa"/>
            </div>
          )}
          {(accountType === 'bancaria' || accountType === 'tarjeta_credito' || accountType === 'digital_wallet') && (
             <div className="form-group">
              <label htmlFor="accountNumberLast4">Últimos 4 dígitos (Opcional):</label>
              <input type="text" id="accountNumberLast4" value={accountNumberLast4} onChange={(e) => setAccountNumberLast4(e.target.value)} maxLength="4" placeholder="1234"/>
            </div>
          )}

          {accountType === 'tarjeta_credito' && (
            <>
              <div className="form-group">
                <label htmlFor="creditLimit">Límite de Crédito (Opcional):</label>
                <input type="number" step="0.01" id="creditLimit" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} placeholder="500000"/>
              </div>
              <hr/>
              <h4>Información del Resumen (Opcional)</h4>
              <div className="form-group">
                <label htmlFor="statementBalance">Saldo del Último Resumen a Pagar:</label>
                <input type="number" step="0.01" id="statementBalance" value={statementBalance} onChange={(e) => setStatementBalance(e.target.value)} placeholder="Ej: 150000.50"/>
              </div>
              <div className="form-grid-halves">
                <div className="form-group">
                  <label htmlFor="statementCloseDate">Fecha de Cierre del Resumen:</label>
                  <input type="date" id="statementCloseDate" value={statementCloseDate} onChange={(e) => setStatementCloseDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="statementDueDate">Fecha de Vencimiento del Resumen:</label>
                  <input type="date" id="statementDueDate" value={statementDueDate} onChange={(e) => setStatementDueDate(e.target.value)} />
                </div>
              </div>
              <hr/>
            </>
          )}
          
          <div className="form-group">
            <label htmlFor="icon">Ícono (Emoji):</label>
            <input
              type="text"
              id="icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength="2" 
              style={{width: '80px', textAlign: 'center', fontSize: '1.5rem'}}
            />
          </div>

          <div className="form-group">
            <label htmlFor="includeInDashboardSummary" className="checkbox-label">
              <input
                type="checkbox"
                id="includeInDashboardSummary"
                checked={includeInDashboardSummary}
                onChange={(e) => setIncludeInDashboardSummary(e.target.checked)}
              />
              Incluir en el resumen del dashboard y cálculos generales
            </label>
          </div>

          <div className="form-actions" style={{marginTop: '20px'}}>
            <button type="submit" disabled={loading} className="button-primary">
              {loading ? 'Creando...' : 'Crear Cuenta'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/accounts')} 
              className="button-secondary" 
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountPage;