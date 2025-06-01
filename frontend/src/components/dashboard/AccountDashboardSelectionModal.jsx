// Ruta: src/components/dashboard/AccountDashboardSelectionModal.jsx
import React, { useState, useEffect } from 'react';
// Ya no necesitamos accountService aquí si solo actualizamos localStorage
// import accountService from '../../services/accounts.service'; 
import './DashboardComponents.css'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css]

const AccountDashboardSelectionModal = ({ 
  isOpen, 
  onClose, 
  allAccounts, // Lista de todas las cuentas del usuario
  currentlyDisplayedAccountIds, // Array de IDs de cuentas que se muestran actualmente
  onSave, // Función para guardar los nuevos IDs seleccionados
  maxSelection 
}) => {
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Inicializar los checkboxes con los IDs actualmente mostrados
      setSelectedAccountIds([...currentlyDisplayedAccountIds]);
    }
  }, [isOpen, currentlyDisplayedAccountIds]);

  const handleCheckboxChange = (accountId) => {
    setSelectedAccountIds(prevSelectedIds => {
      if (prevSelectedIds.includes(accountId)) {
        return prevSelectedIds.filter(id => id !== accountId);
      } else {
        if (prevSelectedIds.length < maxSelection) {
          return [...prevSelectedIds, accountId];
        }
        // Opcional: mostrar una alerta o mensaje si se excede el máximo
        alert(`Puedes seleccionar un máximo de ${maxSelection} cuentas para el resumen.`);
        return prevSelectedIds;
      }
    });
  };

  const handleSaveChanges = () => {
    onSave(selectedAccountIds); // Pasar el array de IDs seleccionados
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="dashboard-modal-overlay"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
      <div className="dashboard-modal-content"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
        <h3>Seleccionar Cuentas para el Resumen Superior</h3>
        <p>Elige hasta {maxSelection} cuentas para mostrar en la fila de resumen. Esto no afecta los cálculos de otros widgets.</p>
        <div className="account-selection-list"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
          {allAccounts && allAccounts.length > 0 ? (
            allAccounts.map(account => (
              <div key={account.id} className="account-selection-item"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
                <label htmlFor={`account-select-${account.id}`}>
                  <input
                    type="checkbox"
                    id={`account-select-${account.id}`}
                    checked={selectedAccountIds.includes(account.id.toString()) || selectedAccountIds.includes(account.id)} // Comparar string y número
                    onChange={() => handleCheckboxChange(account.id.toString())}
                    disabled={!selectedAccountIds.includes(account.id.toString()) && selectedAccountIds.length >= maxSelection}
                  />
                  <span className="account-icon">{account.icon || '🏦'}</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
                  {account.name} ({account.currency})
                </label>
              </div>
            ))
          ) : (
            <p>No hay cuentas disponibles para seleccionar.</p>
          )}
        </div>
        <div className="dashboard-modal-actions"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
          <button onClick={handleSaveChanges} className="button button-primary">
            Aplicar Selección
          </button>
          <button onClick={onClose} className="button button-secondary">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountDashboardSelectionModal;