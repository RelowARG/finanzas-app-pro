// Ruta: finanzas-app-pro/frontend/src/components/accounts/EditAccountModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import accountService from '../../services/accounts.service';
import './AddAccountModal.css'; // Reutilizamos CSS

const predefinedColors = [
  '#4A90E2', '#50E3C2', '#B8E986', '#F8E71C', '#F5A623', '#BD10E0', '#9013FE', '#4A4A4A',
  '#007AFF', '#34C759', '#5AC8FA', '#FF9500', '#FFCC00', '#FF3B30', '#AF52DE', '#8E8E93',
  '#5856D6', '#FF2D55', '#A2845E', '#634F44', '#D8D8D8', '#C7C7CD', '#7ED321', '#059B82'
];

const EditAccountModal = ({ isOpen, onClose, onAccountUpdated, accountData }) => {
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState(''); 
  const [accountCurrency, setAccountCurrency] = useState(''); 
  const [currentBalance, setCurrentBalance] = useState(''); // Este es el balance que no se edita
  const [accountColor, setAccountColor] = useState('#4A90E2');
  const [excludeFromStatistics, setExcludeFromStatistics] = useState(false);
  const [isArchived, setIsArchived] = useState(false); 

  // Campos específicos (se cargan desde accountData)
  const [creditLimit, setCreditLimit] = useState('');
  const [statementBalance, setStatementBalance] = useState('');
  const [statementCloseDate, setStatementCloseDate] = useState('');
  const [statementDueDate, setStatementDueDate] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumberLast4, setAccountNumberLast4] = useState('');

  const [originalIcon, setOriginalIcon] = useState('💰'); 

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const colorPickerRef = useRef(null);

  const accountTypeOptions = [ 
    { value: 'efectivo', label: 'Efectivo', icon: '💵' },
    { value: 'bancaria', label: 'Cuenta Bancaria', icon: '🏦' },
    { value: 'tarjeta_credito', label: 'Tarjeta de Crédito', icon: '💳' },
    { value: 'inversion', label: 'Inversión', icon: '📈' },
    { value: 'digital_wallet', label: 'Billetera Digital', icon: '📱' },
    { value: 'otro', label: 'Otro', icon: '📁' },
  ];

  useEffect(() => {
    if (isOpen && accountData) {
      setAccountName(accountData.name || '');
      setAccountType(accountData.type || 'otro');
      setAccountCurrency(accountData.currency || 'ARS');
      setCurrentBalance(accountData.balance !== null ? accountData.balance.toString() : '0');
      setAccountColor(accountData.color || '#4A90E2');
      setExcludeFromStatistics(!(accountData.includeInDashboardSummary === undefined ? true : accountData.includeInDashboardSummary));
      setIsArchived(accountData.isArchived || false); 
      
      const typeOption = accountTypeOptions.find(opt => opt.value === accountData.type);
      setOriginalIcon(typeOption ? typeOption.icon : '💰');

      // Cargar campos específicos
      setBankName(accountData.bankName || '');
      setAccountNumberLast4(accountData.accountNumberLast4 || '');
      if (accountData.type === 'tarjeta_credito') {
        setCreditLimit(accountData.creditLimit !== null ? accountData.creditLimit.toString() : '');
        setStatementBalance(accountData.statementBalance !== null ? accountData.statementBalance.toString() : '');
        setStatementCloseDate(accountData.statementCloseDate ? accountData.statementCloseDate.split('T')[0] : '');
        setStatementDueDate(accountData.statementDueDate ? accountData.statementDueDate.split('T')[0] : '');
      } else {
        setCreditLimit('');
        setStatementBalance('');
        setStatementCloseDate('');
        setStatementDueDate('');
      }

      setError('');
      setIsSubmitting(false);
      setShowColorPalette(false);
    }
  }, [isOpen, accountData]);

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
    setError('');
    setIsSubmitting(true);

    const updatedAccountData = {
      name: accountName.trim(),
      type: accountType, 
      balance: parseFloat(currentBalance), 
      currency: accountCurrency, 
      color: accountColor,
      icon: originalIcon, 
      includeInDashboardSummary: !excludeFromStatistics,
      isArchived: isArchived, 
      
      bankName: (accountType === 'bancaria' || accountType === 'tarjeta_credito' || accountType === 'digital_wallet') ? bankName.trim() : null,
      accountNumberLast4: (accountType === 'bancaria' || accountType === 'tarjeta_credito' || accountType === 'digital_wallet') ? accountNumberLast4.trim() : null,
    };

    if (accountType === 'tarjeta_credito') {
      updatedAccountData.creditLimit = creditLimit ? parseFloat(creditLimit) : null;
      updatedAccountData.statementBalance = statementBalance ? parseFloat(statementBalance) : null;
      updatedAccountData.statementCloseDate = statementCloseDate || null;
      updatedAccountData.statementDueDate = statementDueDate || null;
    }


    try {
      const updatedAccount = await accountService.updateAccount(accountData.id, updatedAccountData);
      if (onAccountUpdated) {
        onAccountUpdated(updatedAccount);
      }
      onClose(); 
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar la cuenta.');
      console.error("Error updating account:", err.response?.data || err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !accountData) {
    return null;
  }

  const selectedTypeObject = accountTypeOptions.find(opt => opt.value === accountType);
  const displayTypeIcon = selectedTypeObject?.icon || '📁';
  const displayTypeLabel = selectedTypeObject?.label || accountType;


  return (
    <div className="modal-overlay-add-account">
      <div className="modal-content-add-account exact-replica-style edit-account-modal-style">
        <div className="modal-header-add-account">
          <h3>EDITAR CUENTA</h3>
          <button onClick={onClose} className="close-modal-button">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message small-error">{error}</p>}

          <div className="form-row-exact name-color-row">
            <div className="form-group-add-account name-group-exact">
              <label htmlFor="editAccountNameModal">NOMBRE</label>
              <input
                type="text"
                id="editAccountNameModal"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
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
            <label>TIPO DE CUENTA (No editable)</label>
            <div className="type-display-exact"> {/* Mostrar como texto */}
                <span className="type-icon-beside-select-exact">{displayTypeIcon}</span>
                <span className="type-text-exact">{displayTypeLabel}</span>
            </div>
          </div>
          
          <div className="form-row-exact">
            <div className="form-group-add-account balance-group-exact">
              <label>MONTO INICIAL (Saldo Actual)</label> {/* Cambiar label */}
              <input type="text" value={`${currentBalance} ${accountCurrency}`} disabled className="disabled-input-lookalike" />
            </div>
            <div className="form-group-add-account currency-group-narrow-exact new-currency-style">
              <label>MONEDA (No editable)</label>
              <input type="text" value={accountCurrency} disabled className="disabled-input-lookalike" />
            </div>
          </div>

          {/* Campos adicionales para bancaria, tarjeta_credito, digital_wallet */}
          {(accountType === 'bancaria' || accountType === 'tarjeta_credito' || accountType === 'digital_wallet') && (
            <>
              <div className="form-group-add-account">
                <label htmlFor="editBankNameModal">Nombre del Banco/Emisor (Opcional)</label>
                <input type="text" id="editBankNameModal" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
              <div className="form-group-add-account">
                <label htmlFor="editAccountNumberLast4Modal">Últimos 4 dígitos (Opcional)</label>
                <input type="text" id="editAccountNumberLast4Modal" value={accountNumberLast4} onChange={(e) => setAccountNumberLast4(e.target.value)} maxLength="4" />
              </div>
            </>
          )}

          {/* Campos específicos para Tarjeta de Crédito */}
          {accountType === 'tarjeta_credito' && (
            <>
              <div className="form-group-add-account">
                <label htmlFor="editCreditLimitModal">Límite de Crédito (Opcional)</label>
                <input type="number" id="editCreditLimitModal" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} step="0.01" />
              </div>
              <h4 className="form-section-title-modal">Información del Resumen (Opcional)</h4>
              <div className="form-group-add-account">
                <label htmlFor="editStatementBalanceModal">Saldo del Último Resumen a Pagar</label>
                <input type="number" id="editStatementBalanceModal" value={statementBalance} onChange={(e) => setStatementBalance(e.target.value)} step="0.01" />
              </div>
              <div className="form-row-exact">
                <div className="form-group-add-account">
                  <label htmlFor="editStatementCloseDateModal">Fecha de Cierre del Resumen</label>
                  <input type="date" id="editStatementCloseDateModal" value={statementCloseDate} onChange={(e) => setStatementCloseDate(e.target.value)} />
                </div>
                <div className="form-group-add-account">
                  <label htmlFor="editStatementDueDateModal">Fecha de Vencimiento del Resumen</label>
                  <input type="date" id="editStatementDueDateModal" value={statementDueDate} onChange={(e) => setStatementDueDate(e.target.value)} />
                </div>
              </div>
            </>
          )}
          {/* Fin campos Tarjeta de Crédito */}


          <div className="form-group-add-account toggle-group-exact">
            <label className="toggle-switch-exact">
              <input
                type="checkbox"
                id="editExcludeFromStatisticsModal"
                checked={excludeFromStatistics}
                onChange={(e) => setExcludeFromStatistics(e.target.checked)}
              />
              <span className="slider-exact"></span>
            </label>
            <span className="toggle-label-exact">Excluir de las estadísticas</span>
            <span className="info-tooltip-exact" title="Las cuentas excluidas no se mostrarán en resúmenes ni afectarán los totales del dashboard.">?</span>
          </div>

          <div className="form-group-add-account toggle-group-exact">
            <label className="toggle-switch-exact">
              <input
                type="checkbox"
                id="editIsArchivedModal"
                checked={isArchived}
                onChange={(e) => setIsArchived(e.target.checked)}
              />
              <span className="slider-exact"></span>
            </label>
            <span className="toggle-label-exact">Archivar cuenta</span>
            <span className="info-tooltip-exact" title="Las cuentas archivadas se ocultan de las listas principales pero sus datos se conservan.">?</span>
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

export default EditAccountModal;