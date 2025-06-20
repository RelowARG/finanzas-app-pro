// Ruta: frontend/src/pages/EditAccountFormPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import accountService from '../services/accounts.service';
import './AddAccountPage.css'; // Reutilizamos los estilos de AddAccountPage
import { formatCurrency } from '../utils/formatters'; 

const EditAccountFormPage = () => {
  const navigate = useNavigate();
  const { accountId } = useParams(); // Obtener el ID de la URL

  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('efectivo'); // El tipo no será editable
  const [balance, setBalance] = useState(''); // El balance no será editable directamente aquí
  const [currency, setCurrency] = useState('ARS');
  const [icon, setIcon] = useState('💰');
  
  const [bankName, setBankName] = useState('');
  const [accountNumberLast4, setAccountNumberLast4] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [includeInDashboardSummary, setIncludeInDashboardSummary] = useState(true);
  
  // Estados para tarjetas de crédito
  const [statementBalance, setStatementBalance] = useState('');
  const [statementCloseDate, setStatementCloseDate] = useState('');
  const [statementDueDate, setStatementDueDate] = useState('');
  
  const [originalAccountData, setOriginalAccountData] = useState(null); // Para comparar cambios
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accountTypeOptions = [ // Solo para mostrar el label, no para seleccionar
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

  const populateForm = useCallback((accData) => {
    setOriginalAccountData(accData); 
    setAccountName(accData.name || '');
    setAccountType(accData.type || 'efectivo'); 
    setBalance(accData.balance !== null && accData.balance !== undefined ? accData.balance.toString() : ''); // Balance se muestra, no se edita
    setCurrency(accData.currency || 'ARS');
    setIcon(accData.icon || '💰');
    setBankName(accData.bankName || '');
    setAccountNumberLast4(accData.accountNumberLast4 || '');
    setCreditLimit(accData.creditLimit !== null && accData.creditLimit !== undefined ? accData.creditLimit.toString() : '');
    setIncludeInDashboardSummary(accData.includeInDashboardSummary !== undefined ? accData.includeInDashboardSummary : true);
    
    if (accData.type === 'tarjeta_credito') {
      setStatementBalance(accData.statementBalance !== null && accData.statementBalance !== undefined ? accData.statementBalance.toString() : '');
      setStatementCloseDate(accData.statementCloseDate ? accData.statementCloseDate.split('T')[0] : '');
      setStatementDueDate(accData.statementDueDate ? accData.statementDueDate.split('T')[0] : '');
    }
  }, []);

  useEffect(() => {
    const fetchAccountData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await accountService.getAccountById(accountId);
        if (data) {
          populateForm(data);
        } else {
          setError('Cuenta no encontrada.');
          // navigate('/accounts'); // No redirigir aquí, dejar que el usuario vea el error
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error al cargar la cuenta para editar.');
        console.error("Error fetching account for edit form:", err);
      } finally {
        setLoading(false);
      }
    };
    if (accountId) {
      fetchAccountData();
    }
  }, [accountId, populateForm]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountName.trim()) {
      setError('El nombre de la cuenta es requerido.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const accountDataToUpdate = {
      name: accountName.trim(),
      type: accountType, // <<-- AÑADIDO: Enviar el tipo de cuenta
      balance: parseFloat(balance) || 0.00, // <<-- AÑADIDO: Enviar el balance actual (aunque no editable)
      currency,
      icon,
      bankName: bankName.trim() || null, 
      accountNumberLast4: accountNumberLast4.trim() || null, 
      creditLimit: accountType === 'tarjeta_credito' && creditLimit ? parseFloat(creditLimit) : null, 
      includeInDashboardSummary,
    };

    // Solo enviar campos de resumen si el tipo original es tarjeta de crédito
    if (originalAccountData && originalAccountData.type === 'tarjeta_credito') {
      accountDataToUpdate.statementBalance = statementBalance ? parseFloat(statementBalance) : null;
      accountDataToUpdate.statementCloseDate = statementCloseDate || null;
      accountDataToUpdate.statementDueDate = statementDueDate || null;
    }
    
    try {
      await accountService.updateAccount(accountId, accountDataToUpdate);
      navigate(`/accounts/edit/${accountId}`); // Redirigir de vuelta a la página de detalles
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar la cuenta.');
      console.error("Error updating account:", err.response?.data || err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-container"><p className="loading-text">Cargando formulario de edición...</p></div>;
  }
  if (error && !originalAccountData) { 
     return <div className="page-container"><p className="error-message">{error}</p> <Link to="/accounts" className="button">Volver a Cuentas</Link> </div>;
  }

  return (
    <div className="page-container add-account-page"> {/* Reutiliza la clase de AddAccountPage */}
      <div className="form-container" style={{maxWidth: '600px'}}>
        <h2>Editar Cuenta: {originalAccountData?.name || ''}</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}

          <div className="form-group">
            <label htmlFor="accountName">Nombre de la Cuenta:</label>
            <input type="text" id="accountName" value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="accountTypeDisplay">Tipo de Cuenta (No editable):</label>
            <input 
                type="text" 
                id="accountTypeDisplay" 
                value={`${accountTypeOptions.find(opt => opt.value === accountType)?.icon || ''} ${accountTypeOptions.find(opt => opt.value === accountType)?.label || 'Desconocido'}`} 
                disabled 
                style={{backgroundColor: '#e9ecef', cursor: 'not-allowed'}}
            />
          </div>
          
          {/* El balance no se edita directamente desde aquí */}
          <div className="form-group">
            <label htmlFor="balanceDisplay">Saldo Actual (Solo Informativo):</label>
            <input type="text" id="balanceDisplay" value={formatCurrency(balance, currency)} disabled style={{backgroundColor: '#e9ecef', cursor: 'not-allowed'}}/>
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
              <input type="text" id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </div>
          )}
          {(accountType === 'bancaria' || accountType === 'tarjeta_credito' || accountType === 'digital_wallet') && (
             <div className="form-group">
              <label htmlFor="accountNumberLast4">Últimos 4 dígitos (Opcional):</label>
              <input type="text" id="accountNumberLast4" value={accountNumberLast4} onChange={(e) => setAccountNumberLast4(e.target.value)} maxLength="4" />
            </div>
          )}

          {accountType === 'tarjeta_credito' && (
            <>
              <div className="form-group">
                <label htmlFor="creditLimit">Límite de Crédito (Opcional):</label>
                <input type="number" step="0.01" id="creditLimit" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
              </div>
              <hr/>
              <h4>Información del Resumen (Opcional)</h4>
              <div className="form-group">
                <label htmlFor="statementBalance">Saldo del Último Resumen a Pagar:</label>
                <input type="number" step="0.01" id="statementBalance" value={statementBalance} onChange={(e) => setStatementBalance(e.target.value)} />
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
            <input type="text" id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength="2" style={{width: '80px', textAlign: 'center', fontSize: '1.5rem'}} />
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
            <button type="submit" disabled={isSubmitting || loading} className="button-primary">
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button type="button" onClick={() => navigate(`/accounts/edit/${accountId}`)} className="button-secondary" disabled={isSubmitting || loading}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAccountFormPage;
