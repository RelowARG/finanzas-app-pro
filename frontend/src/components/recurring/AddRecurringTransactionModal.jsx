// Ruta: frontend/src/components/recurring/AddRecurringTransactionModal.jsx
// *** ARCHIVO NUEVO ***
import React, { useState, useEffect, useCallback } from 'react';
import recurringTransactionsService from '../../services/recurringTransactions.service';
import accountService from '../../services/accounts.service';
import categoriesService from '../../services/categories.service';
import { useAuth } from '../../contexts/AuthContext';
import './RecurringTransactionModal.css'; // CSS específico para este modal

const AddRecurringTransactionModal = ({ isOpen, onClose, onRecurringTransactionCreated }) => {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [type, setType] = useState('egreso');
  const [frequency, setFrequency] = useState('mensual');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
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


  const resetForm = useCallback(() => {
    setDescription('');
    setAmount('');
    setCurrency('ARS');
    setType('egreso');
    setFrequency('mensual');
    setDayOfWeek('');
    setDayOfMonth('1');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    // No reseteamos accountId y categoryId aquí para mantener la selección previa si es posible
    setNotes('');
    setIsActive(true);
    setError('');
  }, []);
  
  useEffect(() => {
    if (isOpen) {
      resetForm(); // Resetea el formulario cada vez que se abre
      setLoadingInitialData(true);
      const loadData = async () => {
        try {
          const [accData, catDataInitial] = await Promise.all([
            accountService.getAllAccounts(),
            categoriesService.getCategoriesByType('egreso') // Carga inicial con egreso
          ]);
          
          setAccounts(accData || []);
          if (accData && accData.length > 0 && !accountId) {
            setAccountId(accData[0].id.toString());
          } else if (accData && accData.length > 0 && accountId && !accData.some(a => a.id.toString() === accountId)){
            setAccountId(accData[0].id.toString()); // Si la cuenta previa no existe, resetear
          }


          setCategories(catDataInitial || []);
          if (catDataInitial && catDataInitial.length > 0 && !categoryId) {
            setCategoryId(catDataInitial[0].id.toString());
          } else if (catDataInitial && catDataInitial.length > 0 && categoryId && !catDataInitial.some(c => c.id.toString() === categoryId)) {
            setCategoryId(catDataInitial[0].id.toString()); // Si la categoría previa no es válida para egreso, resetear
          }


        } catch (err) {
          setError('Error al cargar datos iniciales (cuentas/categorías).');
          console.error(err);
        } finally {
          setLoadingInitialData(false);
        }
      };
      loadData();
    }
  }, [isOpen, resetForm]); // Dependencias: isOpen y resetForm. No incluir accountId y categoryId aquí para evitar bucles.


  useEffect(() => {
    if (!isOpen || loadingInitialData || !type) return;

    categoriesService.getCategoriesByType(type)
      .then(data => {
        const fetchedCategories = data || [];
        setCategories(fetchedCategories);
        // Mantener categoría seleccionada si es válida para el nuevo tipo, sino seleccionar la primera
        const currentCategoryStillValid = fetchedCategories.some(c => c.id.toString() === categoryId);
        if (!currentCategoryStillValid) {
          setCategoryId(fetchedCategories.length > 0 ? fetchedCategories[0].id.toString() : '');
        }
      })
      .catch(err => {
        setError('Error al cargar categorías para el tipo seleccionado.');
        console.error(err);
        setCategories([]);
        setCategoryId('');
      });
  }, [type, isOpen, loadingInitialData, categoryId]); // Añadir categoryId para re-evaluar si cambia externamente

  const handleSubmit = async (e, createAnother = false) => {
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

    const recurringTxData = {
      description, amount: parseFloat(amount), currency, type, frequency,
      dayOfWeek: frequency === 'semanal' ? parseInt(dayOfWeek) : null,
      dayOfMonth: (['quincenal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual'].includes(frequency)) ? (dayOfMonth === 'ultimo' ? 32 : parseInt(dayOfMonth)) : null, // 32 para 'ultimo'
      startDate, endDate: endDate || null, accountId: parseInt(accountId),
      categoryId: parseInt(categoryId), notes, isActive,
    };

    try {
      const newRecTx = await recurringTransactionsService.create(recurringTxData);
      if (onRecurringTransactionCreated) {
        onRecurringTransactionCreated(newRecTx);
      }
      if (createAnother) {
        resetForm();
        // Mantener cuenta y tipo si el usuario quiere crear otro similar
        setType(type); 
        setAccountId(accountId);
        const amountInput = document.getElementById('recurringAmountModal');
        if (amountInput) amountInput.focus();
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al crear el movimiento recurrente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-atm">
      <div className="modal-content-atm recurring-tx-modal-content">
        <div className="modal-header-atm">
          <h3>Definir Nuevo Recurrente</h3>
          <button onClick={onClose} className="close-modal-button-atm">&times;</button>
        </div>
        
        {loadingInitialData ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Cargando datos del formulario...</div>
        ) : (
          <form onSubmit={(e) => handleSubmit(e, false)} className="transaction-form-atm recurring-tx-form">
            {error && <p className="error-message small-error-atm">{error}</p>}

            <div className="form-group-atm">
              <label htmlFor="recurringDescriptionModal">Descripción (*):</label>
              <input type="text" id="recurringDescriptionModal" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>

            <div className="form-row-atm">
              <div className="form-group-atm amount-group-atm">
                <label htmlFor="recurringAmountModal">Monto (*):</label>
                <input type="number" id="recurringAmountModal" value={amount} onChange={(e) => setAmount(e.target.value)} step="0.01" required />
              </div>
              <div className="form-group-atm currency-group-atm">
                <label htmlFor="recurringCurrencyModal">Moneda (*):</label>
                <select id="recurringCurrencyModal" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {currencyOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label.split(' ')[0]}</option>))}
                </select>
              </div>
            </div>
            
            <div className="form-row-atm">
              <div className="form-group-atm">
                <label htmlFor="recurringTypeModal">Tipo (*):</label>
                <select id="recurringTypeModal" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="egreso">Egreso</option>
                  <option value="ingreso">Ingreso</option>
                </select>
              </div>
              <div className="form-group-atm">
                <label htmlFor="recurringAccountIdModal">Cuenta (*):</label>
                <select id="recurringAccountIdModal" value={accountId} onChange={(e) => setAccountId(e.target.value)} required disabled={accounts.length === 0}>
                  <option value="">{accounts.length === 0 ? 'No hay cuentas' : 'Seleccionar...'}</option>
                  {accounts.map(acc => (<option key={acc.id} value={acc.id}>{acc.icon} {acc.name} ({acc.currency})</option>))}
                </select>
              </div>
            </div>

            <div className="form-group-atm">
              <label htmlFor="recurringCategoryIdModal">Categoría (*):</label>
              <select id="recurringCategoryIdModal" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required disabled={categories.length === 0}>
                <option value="">{categories.length === 0 ? `No hay categorías de ${type}` : 'Seleccionar...'}</option>
                {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>))}
              </select>
            </div>

            <hr className="form-separator-atm" />
            <h4 className="form-section-title-atm">Configuración de Recurrencia</h4>

            <div className="form-row-atm">
              <div className="form-group-atm">
                <label htmlFor="recurringFrequencyModal">Frecuencia (*):</label>
                <select id="recurringFrequencyModal" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                  {frequencyOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
              </div>
              {frequency === 'semanal' && (
                <div className="form-group-atm">
                  <label htmlFor="recurringDayOfWeekModal">Día de la Semana (*):</label>
                  <select id="recurringDayOfWeekModal" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} required={frequency === 'semanal'}>
                    <option value="">Seleccionar...</option>
                    {daysOfWeekOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
              )}
              { (['quincenal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual'].includes(frequency)) && (
                <div className="form-group-atm">
                  <label htmlFor="recurringDayOfMonthModal">Día del Mes (*):</label>
                  <select id="recurringDayOfMonthModal" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} required>
                    <option value="">Seleccionar...</option>
                    {daysOfMonthOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
              )}
            </div>

            <div className="form-row-atm">
              <div className="form-group-atm">
                <label htmlFor="recurringStartDateModal">Fecha de Inicio (*):</label>
                <input type="date" id="recurringStartDateModal" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="form-group-atm">
                <label htmlFor="recurringEndDateModal">Fecha de Fin (Opcional):</label>
                <input type="date" id="recurringEndDateModal" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
             <div className="form-group-atm">
              <label htmlFor="recurringIsActiveModal">Estado:</label>
              <select id="recurringIsActiveModal" value={isActive.toString()} onChange={(e) => setIsActive(e.target.value === 'true')}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>

            <div className="form-group-atm">
              <label htmlFor="recurringNotesModal">Notas (Opcional):</label>
              <textarea id="recurringNotesModal" value={notes} onChange={(e) => setNotes(e.target.value)} rows="2"></textarea>
            </div>

            <div className="modal-actions-atm">
              <button type="button" onClick={(e) => handleSubmit(e, true)} className="button button-secondary button-add-another-atm" disabled={isSubmitting || loadingInitialData}>
                Guardar y Crear Otro
              </button>
              <button type="submit" className="button button-primary button-add-single-atm" disabled={isSubmitting || loadingInitialData}>
                {isSubmitting ? 'Guardando...' : 'Guardar Recurrente'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddRecurringTransactionModal;