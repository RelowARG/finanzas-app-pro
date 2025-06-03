// Ruta: finanzas-app-pro/frontend/src/components/transactions/AddTransactionModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import accountService from '../../services/accounts.service';
import categoriesService from '../../services/categories.service';
import transactionService from '../../services/transactions.service';
import { useAuth } from '../../contexts/AuthContext';
import './AddTransactionModal.css';

const AddTransactionModal = ({ isOpen, onClose, onTransactionCreated, initialTypeFromButton = 'egreso' }) => {
  const { user } = useAuth();

  const [type, setType] = useState(initialTypeFromButton);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [accountId, setAccountId] = useState('');
  const [relatedAccountId, setRelatedAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const [isInstallment, setIsInstallment] = useState(false);
  const [currentInstallment, setCurrentInstallment] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingFormData, setLoadingFormData] = useState(true);

  // Cargar cuentas (solo una vez o cuando cambie isOpen si es necesario resetear)
  useEffect(() => {
    if (!isOpen || !user) return;

    setLoadingFormData(true);
    // Resetear tipo al abrir basado en el botón que lo invocó, y otros campos relacionados
    setType(initialTypeFromButton);
    setAmount('');
    // setDate(new Date().toISOString().split('T')[0]); // Mantener fecha
    // setTime(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })); // Mantener hora
    // setAccountId(''); // No resetear cuenta seleccionada al cambiar tipo dentro del modal abierto
    setRelatedAccountId('');
    setCategoryId(''); // Se establecerá en el efecto de categorías
    setDescription('');
    setNotes('');
    setIsInstallment(false);
    setCurrentInstallment('');
    setTotalInstallments('');


    const fetchInitialData = async () => {
      try {
        const accData = await accountService.getAllAccounts();
        setAccounts(accData || []);
        // Preseleccionar la primera cuenta si no hay una ya seleccionada o si la actual no es válida
        if (accData && accData.length > 0) {
            if (!accountId || !accData.some(acc => acc.id.toString() === accountId)) {
                 setAccountId(accData[0].id.toString());
            }
        } else {
            setAccountId('');
        }

      } catch (err) {
        console.error("Error loading accounts for modal:", err);
        setError("Error al cargar cuentas.");
      } finally {
        setLoadingFormData(false); // Marcar como cargado después de cuentas
      }
    };
    fetchInitialData();
  }, [isOpen, user, initialTypeFromButton]); // Quitar accountId de aquí para no recargar cuentas innecesariamente

  // Cargar categorías cuando el tipo cambia O cuando se termina de cargar los datos iniciales
  useEffect(() => {
    if (!isOpen || !user || loadingFormData) { // Esperar a que loadingFormData sea false
      return;
    }
    
    if (type === 'transferencia') {
      setCategories([]); 
      setCategoryId(''); 
      return;
    }
    
    categoriesService.getCategoriesByType(type)
      .then(catData => {
        const fetchedCategories = catData || [];
        setCategories(fetchedCategories);
        // Solo establecer la categoría por defecto si categoryId está vacío
        // o si la categoría actual no es válida para el nuevo tipo.
        const currentCategoryIsValidForNewType = fetchedCategories.some(c => c.id.toString() === categoryId);
        if (!categoryId || !currentCategoryIsValidForNewType) {
            if (fetchedCategories.length > 0) {
                setCategoryId(fetchedCategories[0].id.toString());
            } else {
                setCategoryId('');
            }
        }
        // Si categoryId ya tiene un valor y es válido para el 'type' actual, no lo cambiamos.
      })
      .catch(err => {
        console.error(`Error loading categories for type ${type}:`, err);
        setError(prev => prev + "\nError al cargar categorías.");
        setCategories([]);
        setCategoryId('');
      });
  // *** CAMBIO: Quitar categoryId del array de dependencias ***
  }, [isOpen, user, type, loadingFormData]); 


  const handleTypeChange = (newType) => {
    setType(newType);
    // No es necesario resetear categoryId aquí explícitamente,
    // el useEffect anterior se encargará de ello si es necesario,
    // o de mantenerla si es compatible.
    setRelatedAccountId('');
    setIsInstallment(false);
    setCurrentInstallment('');
    setTotalInstallments('');
    setDescription(''); 
    setNotes('');
  };

  const handleSubmit = async (e, createAnother = false) => {
    // ... (lógica de submit sin cambios)
    e.preventDefault();
    if (!user || !user.id) {
      setError('Usuario no autenticado.'); return;
    }
    if (!amount || !accountId || !date || !type) {
      setError('Por favor, completa tipo, monto, cuenta y fecha.'); return;
    }
    if (type !== 'transferencia' && !categoryId) {
      setError('Por favor, selecciona una categoría para ingresos o egresos.'); return;
    }
    if (type === 'transferencia' && (!relatedAccountId || accountId === relatedAccountId)) {
      setError('Para transferencias, selecciona una cuenta de destino diferente a la de origen.'); return;
    }
    if (isInstallment && type === 'egreso' && (!currentInstallment || !totalInstallments || parseInt(currentInstallment,10) <= 0 || parseInt(totalInstallments,10) <=0 )) {
      setError('Para compras en cuotas, completa el número de cuota actual y el total (mayores a cero).'); return;
    }
    if (isInstallment && type === 'egreso' && parseInt(currentInstallment,10) > parseInt(totalInstallments,10) ) {
      setError('La cuota actual no puede ser mayor al total de cuotas.'); return;
    }

    setError('');
    setIsSubmitting(true);

    const selectedAccount = accounts.find(acc => acc.id.toString() === accountId.toString());
    let finalDescription = description.trim();
    if (type === 'transferencia' && !finalDescription) {
        const destinationAccount = accounts.find(acc => acc.id.toString() === relatedAccountId.toString());
        finalDescription = `Transferencia a ${destinationAccount?.name || 'otra cuenta'}`;
    } else if (!finalDescription && type !== 'transferencia') {
        setError('La descripción es requerida para ingresos y gastos.');
        setIsSubmitting(false);
        return;
    }

    const transactionData = {
      type,
      amount: parseFloat(amount), 
      currency: selectedAccount?.currency || 'ARS', 
      date: `${date}T${time}:00`,
      accountId: parseInt(accountId, 10), 
      categoryId: type !== 'transferencia' ? parseInt(categoryId, 10) : null,
      relatedAccountId: type === 'transferencia' ? parseInt(relatedAccountId, 10) : null,
      description: finalDescription,
      notes: notes.trim(),
      userId: user.id, 
      isInstallment: type === 'egreso' ? isInstallment : false, 
      currentInstallment: (type === 'egreso' && isInstallment) ? parseInt(currentInstallment, 10) : null,
      totalInstallments: (type === 'egreso' && isInstallment) ? parseInt(totalInstallments, 10) : null,
    };

    try {
      const newTransaction = await transactionService.createTransaction(transactionData);
      if (onTransactionCreated) {
        onTransactionCreated(newTransaction);
      }
      if (createAnother) {
        setAmount('');
        setRelatedAccountId('');
        // Al cambiar el tipo, el useEffect de categorías se encargará de la categoría
        // setCategoryId(categories.length > 0 ? categories[0].id.toString() : '');
        if (type === 'ingreso' || type === 'egreso') { // Resetear categoría solo si no es transferencia
             setCategoryId(categories.length > 0 ? categories[0].id.toString() : '');
        } else {
            setCategoryId('');
        }
        setDescription('');
        setNotes('');
        setIsInstallment(false);
        setCurrentInstallment('');
        setTotalInstallments('');
        const amountInput = document.getElementById('transactionAmountModal');
        if (amountInput) amountInput.focus();
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al crear el movimiento.');
      console.error("Error creating transaction:", err.response?.data || err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Este useEffect ya no es necesario aquí con la nueva lógica del useEffect de categorías
  // useEffect(() => { 
  //   if (!isOpen) return; 
  //   setAmount('');
  //   setRelatedAccountId('');
  //   setCategoryId(categories.length > 0 && (type === 'ingreso' || type === 'egreso') ? categories[0].id.toString() : '');
  //   setDescription('');
  //   setNotes('');
  //   setIsInstallment(false);
  //   setCurrentInstallment('');
  //   setTotalInstallments('');
  // }, [type, isOpen, categories]); // Removido


  if (!isOpen) return null;

  // ... (función renderFields y JSX del return sin cambios)
  const renderFields = () => {
    if (loadingFormData) return <p className="loading-text">Cargando datos...</p>;

    return (
      <>
        {type === 'transferencia' ? (
          <div className="form-row-atm">
            <div className="form-group-atm">
              <label htmlFor="accountIdModal">Cuenta Origen</label>
              <select id="accountIdModal" value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
                {accounts.map(acc => (<option key={acc.id} value={acc.id}>{acc.icon} {acc.name} ({acc.currency})</option>))}
              </select>
            </div>
            <div className="form-group-atm">
              <label htmlFor="relatedAccountIdModal">Cuenta Destino</label>
              <select id="relatedAccountIdModal" value={relatedAccountId} onChange={(e) => setRelatedAccountId(e.target.value)} required>
                <option value="">Seleccionar...</option>
                {accounts.filter(acc => acc.id.toString() !== accountId.toString()).map(acc => (<option key={acc.id} value={acc.id}>{acc.icon} {acc.name} ({acc.currency})</option>))}
              </select>
            </div>
          </div>
        ) : (
          <div className="form-group-atm">
            <label htmlFor="accountIdModal">Cuenta</label>
            <select id="accountIdModal" value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
              {accounts.map(acc => (<option key={acc.id} value={acc.id}>{acc.icon} {acc.name} ({acc.currency})</option>))}
            </select>
          </div>
        )}

        <div className="form-row-atm">
          <div className="form-group-atm amount-group-atm">
            <label htmlFor="transactionAmountModal">Importe</label>
            <input type="number" id="transactionAmountModal" value={amount} onChange={(e) => setAmount(e.target.value)} step="0.01" placeholder="0.00" required />
          </div>
          <div className="form-group-atm currency-group-atm">
            <label htmlFor="transactionCurrencyModal">Moneda</label>
            <select id="transactionCurrencyModal" value={accounts.find(a => a.id.toString() === accountId)?.currency || 'ARS'} disabled>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        {type !== 'transferencia' && (
          <div className="form-group-atm">
            <label htmlFor="categoryIdModal">Categoría</label>
            <select id="categoryIdModal" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required={type !== 'transferencia'} disabled={categories.length === 0}>
              <option value="">{categories.length === 0 ? (type ? `No hay categorías de ${type}` : 'Seleccione tipo') : 'Seleccionar...'}</option>
              {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>))}
            </select>
          </div>
        )}
        
        <div className="form-row-atm">
          <div className="form-group-atm">
            <label htmlFor="transactionDateModal">Fecha</label>
            <input type="date" id="transactionDateModal" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="form-group-atm">
            <label htmlFor="transactionTimeModal">Hora</label>
            <input type="time" id="transactionTimeModal" value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
        </div>

        <div className="form-group-atm">
          <label htmlFor="descriptionModal">{type === 'transferencia' ? 'Descripción (Opcional)' : 'Descripción (*)'}</label>
          <input type="text" id="descriptionModal" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={type === 'transferencia' ? "Ej: Ahorro mensual" : "Ej: Supermercado COTO"} required={type !== 'transferencia'}/>
        </div>
        <div className="form-group-atm">
          <label htmlFor="notesModal">Nota (Opcional)</label>
          <textarea id="notesModal" value={notes} onChange={(e) => setNotes(e.target.value)} rows="2" placeholder="Detalles adicionales..."></textarea>
        </div>

        {type === 'egreso' && (
          <div className="installments-section-atm">
            <div className="form-group-atm checkbox-group-atm">
              <input
                type="checkbox"
                id="isInstallmentModal"
                checked={isInstallment}
                onChange={(e) => setIsInstallment(e.target.checked)}
              />
              <label htmlFor="isInstallmentModal" className="checkbox-label-inline-atm">¿Es una compra en cuotas?</label>
            </div>
            {isInstallment && (
              <div className="form-row-atm">
                <div className="form-group-atm">
                  <label htmlFor="currentInstallmentModal">Cuota Actual N°</label>
                  <input type="number" id="currentInstallmentModal" value={currentInstallment} onChange={(e) => setCurrentInstallment(e.target.value)} min="1" placeholder="1" />
                </div>
                <div className="form-group-atm">
                  <label htmlFor="totalInstallmentsModal">Total de Cuotas</label>
                  <input type="number" id="totalInstallmentsModal" value={totalInstallments} onChange={(e) => setTotalInstallments(e.target.value)} min="1" placeholder="12" />
                </div>
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="modal-overlay-atm">
      <div className="modal-content-atm">
        <div className="modal-header-atm">
          <h3>AÑADIR REGISTRO</h3>
          <button onClick={onClose} className="close-modal-button-atm">&times;</button>
        </div>
        <div className="type-selector-atm">
          <button type="button" className={type === 'egreso' ? 'active' : ''} onClick={() => handleTypeChange('egreso')}>Gasto</button>
          <button type="button" className={type === 'ingreso' ? 'active' : ''} onClick={() => handleTypeChange('ingreso')}>Ingreso</button>
          <button type="button" className={type === 'transferencia' ? 'active' : ''} onClick={() => handleTypeChange('transferencia')}>Transferencia</button>
        </div>
        <form onSubmit={(e) => handleSubmit(e, false)} className="transaction-form-atm"> {/* Asegurar que el form principal llame con false */}
          {error && <p className="error-message small-error-atm">{error}</p>}
          {renderFields()}
          <div className="modal-actions-atm">
            <button type="button" onClick={(e) => handleSubmit(e, true)} className="button button-secondary button-add-another-atm" disabled={isSubmitting || loadingFormData}>
              Añadir y crear otro
            </button>
            <button type="submit" className="button button-primary button-add-single-atm" disabled={isSubmitting || loadingFormData}>
              {isSubmitting ? 'Guardando...' : 'Añadir registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;