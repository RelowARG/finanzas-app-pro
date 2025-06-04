// Ruta: frontend/src/components/recurring/EditRecurringTransactionModal.jsx
// *** ARCHIVO NUEVO ***
import React, { useState, useEffect, useCallback } from 'react';
import recurringTransactionsService from '../../services/recurringTransactions.service';
import accountService from '../../services/accounts.service';
import categoriesService from '../../services/categories.service';
import { useAuth } from '../../contexts/AuthContext';
import './RecurringTransactionModal.css'; // Reutilizamos el mismo CSS

const EditRecurringTransactionModal = ({ isOpen, onClose, onRecurringTransactionUpdated, recurringTransactionData }) => {
  const { user } = useAuth();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [type, setType] = useState('egreso');
  const [frequency, setFrequency] = useState('mensual');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [nextRunDateDisplay, setNextRunDateDisplay] = useState(''); // Solo para mostrar
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);

  const currencyOptions = [
    { value: 'ARS', label: 'ARS - Peso Argentino' },
    { value: 'USD', label: 'USD - Dólar Estadounidense' },
  ];
  const frequencyOptions = [
    { value: 'diaria', label: 'Diaria' }, { value: 'semanal', label: 'Semanal' },
    { value: 'quincenal', label: 'Quincenal (Días 1 y 15+)' }, { value: 'mensual', label: 'Mensual' },
    { value: 'bimestral', label: 'Bimestral' }, { value: 'trimestral', label: 'Trimestral' },
    { value: 'semestral', label: 'Semestral' }, { value: 'anual', label: 'Anual' },
  ];
  const daysOfWeekOptions = [
    { value: '1', label: 'Lunes' }, { value: '2', label: 'Martes' },
    { value: '3', label: 'Miércoles' }, { value: '4', label: 'Jueves' },
    { value: '5', label: 'Viernes' }, { value: '6', label: 'Sábado' },
    { value: '0', label: 'Domingo' },
  ];
  const daysOfMonthOptions = Array.from({ length: 31 }, (_, i) => ({ value: (i + 1).toString(), label: (i + 1).toString() }));
  daysOfMonthOptions.push({ value: 'ultimo', label: 'Último día del mes' });

  const populateForm = useCallback((data) => {
    if (!data) return;
    setDescription(data.description || '');
    setAmount(data.amount ? Math.abs(data.amount).toString() : '');
    setCurrency(data.currency || 'ARS');
    setType(data.type || 'egreso');
    setFrequency(data.frequency || 'mensual');
    setDayOfWeek(data.dayOfWeek !== null ? data.dayOfWeek.toString() : '');
    setDayOfMonth(data.dayOfMonth !== null ? (data.dayOfMonth === 32 ? 'ultimo' : data.dayOfMonth.toString()) : '1');
    setStartDate(data.startDate ? data.startDate.split('T')[0] : '');
    setEndDate(data.endDate ? data.endDate.split('T')[0] : '');
    setNextRunDateDisplay(data.nextRunDate ? data.nextRunDate.split('T')[0] : '');
    setAccountId(data.accountId ? data.accountId.toString() : '');
    // categoryId se establecerá después de que las categorías para el tipo se carguen
    setNotes(data.notes || '');
    setIsActive(data.isActive !== undefined ? data.isActive : true);
  }, []);

  useEffect(() => {
    if (isOpen && recurringTransactionData) {
      populateForm(recurringTransactionData);
      setLoadingInitialData(true);
      const loadDropdownData = async () => {
        try {
          const accData = await accountService.getAllAccounts();
          setAccounts(accData || []);
          // Asegurar que accountId de la data esté seleccionado
          if (recurringTransactionData.accountId && accData.some(a => a.id.toString() === recurringTransactionData.accountId.toString())) {
            setAccountId(recurringTransactionData.accountId.toString());
          } else if (accData && accData.length > 0) {
             // Si la cuenta original ya no existe o no se pasó, se podría seleccionar la primera, o mejor, dejarlo y que el usuario corrija
             // setAccountId(accData[0].id.toString()); 
          }

          if (recurringTransactionData.type) {
            const catData = await categoriesService.getCategoriesByType(recurringTransactionData.type);
            setCategories(catData || []);
            if (recurringTransactionData.categoryId && catData.some(c => c.id.toString() === recurringTransactionData.categoryId.toString())) {
              setCategoryId(recurringTransactionData.categoryId.toString());
            } else if (catData && catData.length > 0) {
              // setCategoryId(catData[0].id.toString()); // Opcional: default si la original no es válida para el tipo
            } else {
                setCategoryId('');
            }
          }
        } catch (err) {
          setError('Error al cargar datos para el formulario de edición.');
          console.error(err);
        } finally {
          setLoadingInitialData(false);
        }
      };
      loadDropdownData();
    }
  }, [isOpen, recurringTransactionData, populateForm]);

  // Efecto para cargar categorías si el tipo cambia (aunque el tipo no debería ser editable en la edición de recurrentes)
  useEffect(() => {
    if (!isOpen || loadingInitialData || !type) return;

    // Si el tipo no es editable, las categorías ya deberían estar cargadas y filtradas
    // Este efecto es más relevante si el 'type' fuera un campo editable en este modal
    categoriesService.getCategoriesByType(type)
      .then(data => {
        const fetchedCategories = data || [];
        setCategories(fetchedCategories);
        // Si el categoryId actual no está en la nueva lista (porque el tipo cambió y la categoría vieja no aplica)
        // O si categoryId estaba vacío, intentar setearlo.
        if (!fetchedCategories.some(c => c.id.toString() === categoryId)) {
          setCategoryId(fetchedCategories.length > 0 ? fetchedCategories[0].id.toString() : '');
        }
      })
      .catch(err => {
        setError('Error al cargar categorías para el tipo seleccionado.');
        setCategories([]);
        setCategoryId('');
      });
  }, [type, isOpen, loadingInitialData, categoryId]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount || !accountId || !categoryId || !startDate || !frequency) {
      setError('Por favor, completa todos los campos requeridos (*).');
      return;
    }
    if (frequency === 'semanal' && !dayOfWeek) {
      setError('Para frecuencia semanal, selecciona un día de la semana.'); return;
    }
    if (['quincenal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual'].includes(frequency) && !dayOfMonth) {
      setError('Para la frecuencia seleccionada, selecciona un día del mes.'); return;
    }
    setError('');
    setIsSubmitting(true);

    const recurringTxDataToUpdate = {
      description, amount: parseFloat(amount), currency, type, frequency,
      dayOfWeek: frequency === 'semanal' ? parseInt(dayOfWeek) : null,
      dayOfMonth: (['quincenal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual'].includes(frequency)) ? (dayOfMonth === 'ultimo' ? 32 : parseInt(dayOfMonth)) : null,
      startDate, endDate: endDate || null, accountId: parseInt(accountId),
      categoryId: parseInt(categoryId), notes, isActive,
    };

    try {
      const updatedRecTx = await recurringTransactionsService.update(recurringTransactionData.id, recurringTxDataToUpdate); // Usa el servicio correcto
      if (onRecurringTransactionUpdated) {
        onRecurringTransactionUpdated(updatedRecTx);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar el movimiento recurrente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-atm">
      <div className="modal-content-atm recurring-tx-modal-content">
        <div className="modal-header-atm">
          <h3>Editar Movimiento Recurrente</h3>
          <button onClick={onClose} className="close-modal-button-atm">&times;</button>
        </div>
        
        {loadingInitialData ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Cargando datos del formulario...</div>
        ) : (
          <form onSubmit={handleSubmit} className="transaction-form-atm recurring-tx-form">
            {error && <p className="error-message small-error-atm">{error}</p>}

            <div className="form-group-atm">
              <label htmlFor="editRecurringDescriptionModal">Descripción (*):</label>
              <input type="text" id="editRecurringDescriptionModal" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>

            <div className="form-row-atm">
              <div className="form-group-atm amount-group-atm">
                <label htmlFor="editRecurringAmountModal">Monto (*):</label>
                <input type="number" id="editRecurringAmountModal" value={amount} onChange={(e) => setAmount(e.target.value)} step="0.01" required />
              </div>
              <div className="form-group-atm currency-group-atm">
                <label htmlFor="editRecurringCurrencyModal">Moneda (*):</label>
                <select id="editRecurringCurrencyModal" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {currencyOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label.split(' ')[0]}</option>))}
                </select>
              </div>
            </div>
            
            <div className="form-row-atm">
              <div className="form-group-atm">
                <label htmlFor="editRecurringTypeModal">Tipo (*):</label>
                 {/* El tipo generalmente no se edita para un recurrente existente para evitar inconsistencias con la categoría */}
                <input type="text" id="editRecurringTypeModal" value={type === 'ingreso' ? 'Ingreso' : 'Egreso'} disabled style={{backgroundColor: '#e9ecef'}}/>
              </div>
              <div className="form-group-atm">
                <label htmlFor="editRecurringAccountIdModal">Cuenta (*):</label>
                <select id="editRecurringAccountIdModal" value={accountId} onChange={(e) => setAccountId(e.target.value)} required disabled={accounts.length === 0}>
                  <option value="">{accounts.length === 0 ? 'No hay cuentas' : 'Seleccionar...'}</option>
                  {accounts.map(acc => (<option key={acc.id} value={acc.id}>{acc.icon} {acc.name} ({acc.currency})</option>))}
                </select>
              </div>
            </div>

            <div className="form-group-atm">
              <label htmlFor="editRecurringCategoryIdModal">Categoría (*):</label>
              <select id="editRecurringCategoryIdModal" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required disabled={categories.length === 0}>
                <option value="">{categories.length === 0 ? `No hay categorías de ${type}` : 'Seleccionar...'}</option>
                {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>))}
              </select>
            </div>

            <hr className="form-separator-atm" />
            <h4 className="form-section-title-atm">Configuración de Recurrencia</h4>

            <div className="form-row-atm">
              <div className="form-group-atm">
                <label htmlFor="editRecurringFrequencyModal">Frecuencia (*):</label>
                <select id="editRecurringFrequencyModal" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                  {frequencyOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
              </div>
              {frequency === 'semanal' && (
                <div className="form-group-atm">
                  <label htmlFor="editRecurringDayOfWeekModal">Día de la Semana (*):</label>
                  <select id="editRecurringDayOfWeekModal" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} required={frequency === 'semanal'}>
                    <option value="">Seleccionar...</option>
                    {daysOfWeekOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
              )}
              { (['quincenal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual'].includes(frequency)) && (
                <div className="form-group-atm">
                  <label htmlFor="editRecurringDayOfMonthModal">Día del Mes (*):</label>
                  <select id="editRecurringDayOfMonthModal" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} required>
                    <option value="">Seleccionar...</option>
                    {daysOfMonthOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="form-row-atm">
                <div className="form-group-atm">
                    <label htmlFor="editRecurringStartDateModal">Fecha de Inicio (*):</label>
                    <input type="date" id="editRecurringStartDateModal" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <div className="form-group-atm">
                    <label htmlFor="editRecurringEndDateModal">Fecha de Fin (Opcional):</label>
                    <input type="date" id="editRecurringEndDateModal" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
            </div>
             <div className="form-group-atm">
                  <label htmlFor="editNextRunDateDisplay">Próxima Ejecución (Informativo):</label>
                  <input type="date" id="editNextRunDateDisplay" value={nextRunDateDisplay} readOnly disabled style={{backgroundColor: '#e9ecef'}} />
              </div>

             <div className="form-group-atm">
              <label htmlFor="editRecurringIsActiveModal">Estado:</label>
              <select id="editRecurringIsActiveModal" value={isActive.toString()} onChange={(e) => setIsActive(e.target.value === 'true')}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>

            <div className="form-group-atm">
              <label htmlFor="editRecurringNotesModal">Notas (Opcional):</label>
              <textarea id="editRecurringNotesModal" value={notes} onChange={(e) => setNotes(e.target.value)} rows="2"></textarea>
            </div>

            <div className="modal-actions-atm">
              <button type="submit" className="button button-primary button-add-single-atm" disabled={isSubmitting || loadingInitialData}>
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </button>
               <button type="button" onClick={onClose} className="button button-secondary" disabled={isSubmitting || loadingInitialData}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditRecurringTransactionModal;