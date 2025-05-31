// Ruta: finanzas-app-pro/frontend/src/pages/EditAccountPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import accountService from '../services/accounts.service';
import './AddAccountPage.css'; // Reutilizamos los estilos

const EditAccountPage = () => {
  const navigate = useNavigate();
  const { accountId } = useParams(); 

  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('efectivo');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [icon, setIcon] = useState('💰');
  
  const [bankName, setBankName] = useState('');
  const [accountNumberLast4, setAccountNumberLast4] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [includeInDashboardSummary, setIncludeInDashboardSummary] = useState(true); // NUEVO ESTADO
  
  const [originalAccountData, setOriginalAccountData] = useState(null); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); 
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const populateForm = useCallback((accData) => {
    setOriginalAccountData(accData); 
    setAccountName(accData.name || '');
    setAccountType(accData.type || 'efectivo');
    setBalance(accData.balance !== null && accData.balance !== undefined ? accData.balance.toString() : '');
    setCurrency(accData.currency || 'ARS');
    setIcon(accData.icon || '💰');
    setBankName(accData.bankName || '');
    setAccountNumberLast4(accData.accountNumberLast4 || '');
    setCreditLimit(accData.creditLimit !== null && accData.creditLimit !== undefined ? accData.creditLimit.toString() : '');
    setIncludeInDashboardSummary(accData.includeInDashboardSummary !== undefined ? accData.includeInDashboardSummary : true); // Cargar valor existente
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
          navigate('/accounts'); 
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error al cargar la cuenta.');
        console.error("Error fetching account for edit:", err);
      } finally {
        setLoading(false);
      }
    };
    if (accountId) {
      fetchAccountData();
    }
  }, [accountId, navigate, populateForm]);

  useEffect(() => {
    if (!loading) { 
        const selectedType = accountTypeOptions.find(opt => opt.value === accountType);
        if (selectedType && originalAccountData) { // Solo si ya hay datos originales
            // Actualizar icono solo si el tipo cambió Y el icono actual era el del tipo anterior
            const originalTypeInfo = accountTypeOptions.find(opt => opt.value === originalAccountData.type);
            if (accountType !== originalAccountData.type && icon === originalTypeInfo?.icon) {
                 setIcon(selectedType.icon);
            } else if (!icon && selectedType) { // Si no hay icono seteado, poner el del tipo
                setIcon(selectedType.icon);
            }
        } else if (selectedType && !icon) { // Si no hay datos originales pero no hay icono
             setIcon(selectedType.icon);
        }
    }
  }, [accountType, loading, icon, originalAccountData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountName.trim()) { // El tipo no se edita, así que no se valida aquí
      setError('El nombre de la cuenta es requerido.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const accountDataToUpdate = {
      name: accountName.trim(),
      // type: accountType, // No permitir editar el tipo
      balance: parseFloat(balance) || 0.00,
      currency: currency,
      icon: icon,
      bankName: bankName !== undefined ? bankName.trim() : null,
      accountNumberLast4: accountNumberLast4 !== undefined ? accountNumberLast4.trim() : null,
      creditLimit: creditLimit !== undefined ? (creditLimit ? parseFloat(creditLimit) : null) : null,
      includeInDashboardSummary, // NUEVO CAMPO ENVIADO AL BACKEND
    };
    
    try {
      await accountService.updateAccount(accountId, accountDataToUpdate);
      navigate('/accounts'); 
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar la cuenta.');
      console.error("Error updating account:", err.response?.data || err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-container"><p className="loading-text">Cargando datos de la cuenta...</p></div>;
  }
  if (error && !originalAccountData) { 
     return <div className="page-container"><p className="error-message">{error}</p> <Link to="/accounts" className="button">Volver a Cuentas</Link> </div>;
  }

  return (
    <div className="page-container add-account-page"> 
      <div className="form-container" style={{maxWidth: '600px'}}>
        <h2>Editar Cuenta: {originalAccountData?.name || ''}</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}

          <div className="form-group">
            <label htmlFor="accountName">Nombre de la Cuenta:</label>
            <input type="text" id="accountName" value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="accountTypeDisplay">Tipo de Cuenta:</label>
            <input 
                type="text" 
                id="accountTypeDisplay" 
                value={`${accountTypeOptions.find(opt => opt.value === accountType)?.icon || ''} ${accountTypeOptions.find(opt => opt.value === accountType)?.label || 'Desconocido'}`} 
                disabled 
                style={{backgroundColor: '#e9ecef', cursor: 'not-allowed'}}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="balance">Saldo:</label>
            <input type="number" id="balance" value={balance} onChange={(e) => setBalance(e.target.value)} step="0.01" />
          </div>

          <div className="form-group">
            <label htmlFor="currency">Moneda:</label>
            <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {currencyOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {accountType === 'bancaria' && (
            <>
              <div className="form-group">
                <label htmlFor="bankName">Nombre del Banco (Opcional):</label>
                <input type="text" id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="accountNumberLast4">Últimos 4 dígitos (Opcional):</label>
                <input type="text" id="accountNumberLast4" value={accountNumberLast4} onChange={(e) => setAccountNumberLast4(e.target.value)} maxLength="4" />
              </div>
            </>
          )}

          {accountType === 'tarjeta_credito' && (
            <div className="form-group">
              <label htmlFor="creditLimit">Límite de Crédito (Opcional):</label>
              <input type="number" step="0.01" id="creditLimit" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="icon">Ícono (Emoji):</label>
            <input type="text" id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength="2" style={{width: '80px', textAlign: 'center', fontSize: '1.5rem'}} />
          </div>

          {/* NUEVO CHECKBOX */}
          <div className="form-group">
            <label htmlFor="includeInDashboardSummary" className="checkbox-label">
              <input
                type="checkbox"
                id="includeInDashboardSummary"
                checked={includeInDashboardSummary}
                onChange={(e) => setIncludeInDashboardSummary(e.target.checked)}
              />
              Incluir en el resumen del dashboard
            </label>
          </div>

          <div className="form-actions" style={{marginTop: '20px'}}>
            <button type="submit" disabled={isSubmitting || loading} className="button-primary">
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button type="button" onClick={() => navigate('/accounts')} className="button-secondary" disabled={isSubmitting || loading}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAccountPage;
