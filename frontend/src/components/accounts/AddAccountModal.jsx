// Ruta: finanzas-app-pro/frontend/src/components/accounts/AddAccountModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import accountService from '../../services/accounts.service';
import './AddAccountModal.css';

const predefinedColors = [
  '#4A90E2', '#50E3C2', '#B8E986', '#F8E71C', '#F5A623', '#BD10E0', '#9013FE', '#4A4A4A',
  '#007AFF', '#34C759', '#5AC8FA', '#FF9500', '#FFCC00', '#FF3B30', '#AF52DE', '#8E8E93',
  '#5856D6', '#FF2D55', '#A2845E', '#634F44', '#D8D8D8', '#C7C7CD', '#7ED321', '#059B82'
];

const AddAccountModal = ({ isOpen, onClose, onAccountCreated }) => {
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('efectivo');
  const [initialBalance, setInitialBalance] = useState('0');
  const [currency, setCurrency] = useState('ARS');
  const [accountColor, setAccountColor] = useState('#4A90E2');
  const [excludeFromStatistics, setExcludeFromStatistics] = useState(false);

  // Campos específicos para Tarjeta de Crédito
  const [creditLimit, setCreditLimit] = useState('');
  const [statementBalance, setStatementBalance] = useState('');
  const [statementCloseDate, setStatementCloseDate] = useState('');
  const [statementDueDate, setStatementDueDate] = useState('');
  // Otros campos que podrían ser relevantes si el tipo es bancaria/tarjeta
  const [bankName, setBankName] = useState('');
  const [accountNumberLast4, setAccountNumberLast4] = useState('');


  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const colorPickerRef = useRef(null);

  const accountTypeOptions = [
    { value: 'efectivo', label: 'Efectivo', icon: '💵', defaultColor: '#4CAF50' },
    { value: 'bancaria', label: 'Cuenta Bancaria', icon: '🏦', defaultColor: '#2196F3' },
    { value: 'tarjeta_credito', label: 'Tarjeta de Crédito', icon: '💳', defaultColor: '#F44336' },
    { value: 'inversion', label: 'Inversión', icon: '📈', defaultColor: '#FFC107' },
    { value: 'digital_wallet', label: 'Billetera Digital', icon: '📱', defaultColor: '#9C27B0' },
    { value: 'otro', label: 'Otro', icon: '📁', defaultColor: '#795548' },
  ];
  
  useEffect(() => {
    if (isOpen) {
      const initialType = 'efectivo';
      setAccountName('');
      setAccountType(initialType);
      setInitialBalance('0');
      setCurrency('ARS');
      const typeOption = accountTypeOptions.find(opt => opt.value === initialType);
      setAccountColor(typeOption ? typeOption.defaultColor : '#2196F3');
      setExcludeFromStatistics(false);
      
      // Resetear campos específicos
      setCreditLimit('');
      setStatementBalance('');
      setStatementCloseDate('');
      setStatementDueDate('');
      setBankName('');
      setAccountNumberLast4('');

      setError('');
      setIsSubmitting(false);
      setShowColorPalette(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const selectedTypeOption = accountTypeOptions.find(opt => opt.value === accountType);
    if (selectedTypeOption) {
      const isCurrentColorADefault = accountTypeOptions.some(opt => opt.defaultColor === accountColor);
      if (isCurrentColorADefault || !accountColor) {
          setAccountColor(selectedTypeOption.defaultColor);
      }
    }
     // Limpiar campos de tarjeta si no es tarjeta de crédito
    if (accountType !== 'tarjeta_credito') {
      setCreditLimit('');
      setStatementBalance('');
      setStatementCloseDate('');
      setStatementDueDate('');
    }
    // Limpiar bankName y last4 si no es bancaria o tarjeta
    if (accountType !== 'bancaria' && accountType !== 'tarjeta_credito' && accountType !== 'digital_wallet') {
        setBankName('');
        setAccountNumberLast4('');
    }

  }, [accountType, accountColor]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPalette(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [colorPickerRef]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountName.trim()) {
      setError('El nombre de la cuenta es requerido.');
      return;
    }
    // Validación adicional para tarjeta de crédito si es necesario
    if (accountType === 'tarjeta_credito' && creditLimit && parseFloat(creditLimit) < 0) {
        setError('El límite de crédito no puede ser negativo.');
        return;
    }

    setError('');
    setIsSubmitting(true);

    const selectedTypeOption = accountTypeOptions.find(opt => opt.value === accountType);

    const accountData = {
      name: accountName.trim(),
      type: accountType,
      balance: parseFloat(initialBalance) || 0.00,
      currency: currency,
      color: accountColor,
      icon: selectedTypeOption ? selectedTypeOption.icon : '💰',
      includeInDashboardSummary: !excludeFromStatistics,
      bankName: (accountType === 'bancaria' || accountType === 'tarjeta_credito' || accountType === 'digital_wallet') ? bankName.trim() : null,
      accountNumberLast4: (accountType === 'bancaria' || accountType === 'tarjeta_credito' || accountType === 'digital_wallet') ? accountNumberLast4.trim() : null,
    };

    if (accountType === 'tarjeta_credito') {
      accountData.creditLimit = creditLimit ? parseFloat(creditLimit) : null;
      accountData.statementBalance = statementBalance ? parseFloat(statementBalance) : null;
      accountData.statementCloseDate = statementCloseDate || null;
      accountData.statementDueDate = statementDueDate || null;
    }

    try {
      const newAccount = await accountService.createAccount(accountData);
      if (onAccountCreated) {
        onAccountCreated(newAccount);
      }
      onClose(); 
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al crear la cuenta.');
      console.error("Error creating account:", err.response?.data || err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const currentSelectedTypeIcon = accountTypeOptions.find(opt => opt.value === accountType)?.icon || '📁';

  return (
    <div className="modal-overlay-add-account">
      <div className="modal-content-add-account exact-replica-style">
        <div className="modal-header-add-account">
          <h3>AÑADIR CUENTA</h3>
          <button onClick={onClose} className="close-modal-button">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message small-error">{error}</p>}

          <div className="form-row-exact name-color-row">
            <div className="form-group-add-account name-group-exact">
              <label htmlFor="accountNameModalExact">NOMBRE</label>
              <input
                type="text"
                id="accountNameModalExact"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
                placeholder="Nombre de la cuenta"
              />
            </div>
            <div className="form-group-add-account color-group-exact custom-color-picker-group" ref={colorPickerRef}>
              <label>COLOR</label>
              <div 
                className="custom-color-input" 
                onClick={() => setShowColorPalette(!showColorPalette)}
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowColorPalette(!showColorPalette)}
              >
                <span className="color-preview-exact" style={{ backgroundColor: accountColor }}></span>
                <span className="dropdown-arrow-exact">▼</span>
              </div>
              {showColorPalette && (
                <div className="color-palette-dropdown">
                  {predefinedColors.map(color => (
                    <button
                      type="button"
                      key={color}
                      className="color-palette-item"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setAccountColor(color);
                        setShowColorPalette(false);
                      }}
                      aria-label={`Seleccionar color ${color}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="form-group-add-account type-group-fullwidth-exact new-type-style">
            <label htmlFor="accountTypeModalExact">TIPO DE CUENTA</label>
            <div className="type-select-container-exact">
              <span className="type-icon-beside-select-exact">{currentSelectedTypeIcon}</span>
              <select 
                  id="accountTypeModalExact" 
                  value={accountType} 
                  onChange={(e) => setAccountType(e.target.value)}
                  className="type-select-exact-no-internal-icon"
              >
              {accountTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
              </select>
            </div>
          </div>
          
          <div className="form-row-exact">
            <div className="form-group-add-account balance-group-exact">
              <label htmlFor="initialBalanceModalExact">MONTO INICIAL</label>
              <input
                type="number"
                id="initialBalanceModalExact"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                step="0.01"
                placeholder="0 (Negativo para deuda de tarjeta)" 
              />
            </div>
            <div className="form-group-add-account currency-group-narrow-exact new-currency-style">
              <label htmlFor="currencyModalExact">MONEDA</label>
              <select 
                id="currencyModalExact" 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                className="currency-select-exact"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* Campos adicionales para bancaria, tarjeta_credito, digital_wallet */}
          {(accountType === 'bancaria' || accountType === 'tarjeta_credito' || accountType === 'digital_wallet') && (
            <>
              <div className="form-group-add-account">
                <label htmlFor="bankNameModal">Nombre del Banco/Emisor (Opcional)</label>
                <input type="text" id="bankNameModal" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ej: Banco Galicia, Mercado Pago"/>
              </div>
              <div className="form-group-add-account">
                <label htmlFor="accountNumberLast4Modal">Últimos 4 dígitos (Opcional)</label>
                <input type="text" id="accountNumberLast4Modal" value={accountNumberLast4} onChange={(e) => setAccountNumberLast4(e.target.value)} maxLength="4" placeholder="1234"/>
              </div>
            </>
          )}

          {/* Campos específicos para Tarjeta de Crédito */}
          {accountType === 'tarjeta_credito' && (
            <>
              <div className="form-group-add-account">
                <label htmlFor="creditLimitModal">Límite de Crédito (Opcional)</label>
                <input type="number" id="creditLimitModal" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} step="0.01" placeholder="Ej: 150000"/>
              </div>
              <h4 className="form-section-title-modal">Información del Resumen (Opcional)</h4>
              <div className="form-group-add-account">
                <label htmlFor="statementBalanceModal">Saldo del Último Resumen a Pagar</label>
                <input type="number" id="statementBalanceModal" value={statementBalance} onChange={(e) => setStatementBalance(e.target.value)} step="0.01" placeholder="Ej: 25000.50"/>
              </div>
              <div className="form-row-exact">
                <div className="form-group-add-account">
                  <label htmlFor="statementCloseDateModal">Fecha de Cierre del Resumen</label>
                  <input type="date" id="statementCloseDateModal" value={statementCloseDate} onChange={(e) => setStatementCloseDate(e.target.value)} />
                </div>
                <div className="form-group-add-account">
                  <label htmlFor="statementDueDateModal">Fecha de Vencimiento del Resumen</label>
                  <input type="date" id="statementDueDateModal" value={statementDueDate} onChange={(e) => setStatementDueDate(e.target.value)} />
                </div>
              </div>
            </>
          )}
          {/* Fin campos Tarjeta de Crédito */}

          <div className="form-group-add-account toggle-group-exact">
            <label className="toggle-switch-exact">
              <input
                type="checkbox"
                id="excludeFromStatisticsModalExact"
                checked={excludeFromStatistics}
                onChange={(e) => setExcludeFromStatistics(e.target.checked)}
              />
              <span className="slider-exact"></span>
            </label>
            <span className="toggle-label-exact">Excluir de las estadísticas</span>
            <span className="info-tooltip-exact" title="Las cuentas excluidas no se mostrarán en resúmenes ni afectarán los totales del dashboard.">?</span>
          </div>

          <div className="modal-actions-add-account">
            <button type="submit" className="button button-primary button-guardar-modal exact-save-button" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal;