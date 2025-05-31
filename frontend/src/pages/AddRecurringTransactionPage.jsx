// Ruta: finanzas-app-pro/frontend/src/pages/AddRecurringTransactionPage.jsx
// ARCHIVO NUEVO
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import recurringTransactionsService from '../services/recurringTransactions.service';
import accountService from '../services/accounts.service';
import categoriesService from '../services/categories.service';
import './AddRecurringTransactionPage.css'; // Crearemos este CSS

const AddRecurringTransactionPage = () => {
  const navigate = useNavigate();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [type, setType] = useState('egreso');
  const [frequency, setFrequency] = useState('mensual');
  const [dayOfWeek, setDayOfWeek] = useState(''); // 0-6 (Domingo-Sábado)
  const [dayOfMonth, setDayOfMonth] = useState('1'); // 1-31 o 'ultimo'
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(''); // Opcional
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);

  const currencyOptions = [
    { value: 'ARS', label: 'ARS - Peso Argentino' },
    { value: 'USD', label: 'USD - Dólar Estadounidense' },
  ];
  const frequencyOptions = [
    { value: 'diaria', label: 'Diaria' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'quincenal', label: 'Quincenal' },
    { value: 'mensual', label: 'Mensual' },
    { value: 'bimestral', label: 'Bimestral' },
    { value: 'trimestral', label: 'Trimestral' },
    { value: 'semestral', label: 'Semestral' },
    { value: 'anual', label: 'Anual' },
  ];
  const daysOfWeekOptions = [
    { value: '1', label: 'Lunes' }, { value: '2', label: 'Martes' },
    { value: '3', label: 'Miércoles' }, { value: '4', label: 'Jueves' },
    { value: '5', label: 'Viernes' }, { value: '6', label: 'Sábado' },
    { value: '0', label: 'Domingo' },
  ];
  const daysOfMonthOptions = Array.from({ length: 31 }, (_, i) => ({ value: (i + 1).toString(), label: (i + 1).toString() }));
  // daysOfMonthOptions.push({ value: 'ultimo', label: 'Último día del mes'}); // Lógica más compleja para 'ultimo'

  useEffect(() => {
    const loadData = async () => {
      setLoadingInitialData(true);
      try {
        const [accData, catData] = await Promise.all([
          accountService.getAllAccounts(),
          categoriesService.getCategoriesByType(type) // Cargar según tipo inicial
        ]);
        setAccounts(accData || []);
        setCategories(catData || []);
        if (accData && accData.length > 0 && !accountId) setAccountId(accData[0].id);
        if (catData && catData.length > 0 && !categoryId) setCategoryId(catData[0].id);
      } catch (err) {
        setError('Error al cargar datos iniciales (cuentas/categorías).');
        console.error(err);
      }
      setLoadingInitialData(false);
    };
    loadData();
  }, []); // Solo al montar

  useEffect(() => {
    // Recargar categorías si cambia el tipo
    if (!loadingInitialData && type) {
      categoriesService.getCategoriesByType(type)
        .then(data => {
          setCategories(data || []);
          // Si la categoría seleccionada no es válida para el nuevo tipo, resetearla
          const currentCatIsValid = data && data.some(cat => cat.id === categoryId);
          if (!currentCatIsValid && data && data.length > 0) {
            setCategoryId(data[0].id);
          } else if (!currentCatIsValid) {
            setCategoryId('');
          }
        })
        .catch(err => {
          setError('Error al cargar categorías para el tipo seleccionado.');
          console.error(err);
        });
    }
  }, [type, loadingInitialData, categoryId]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount || !accountId || !categoryId || !startDate) {
      setError('Por favor, completa todos los campos requeridos (*).');
      return;
    }
    // Validaciones adicionales según frecuencia
    if (frequency === 'semanal' && dayOfWeek === '') {
        setError('Por favor, selecciona un día de la semana para la frecuencia semanal.');
        return;
    }
    if ((frequency === 'mensual' || frequency === 'quincenal' || frequency === 'bimestral' || frequency === 'trimestral' || frequency === 'semestral' || frequency === 'anual') && dayOfMonth === '') {
        setError('Por favor, selecciona un día del mes para la frecuencia seleccionada.');
        return;
    }

    setError('');
    setLoading(true);

    const recurringTxData = {
      description,
      amount: parseFloat(amount),
      currency,
      type,
      frequency,
      dayOfWeek: frequency === 'semanal' ? parseInt(dayOfWeek) : null,
      dayOfMonth: (frequency !== 'diaria' && frequency !== 'semanal') ? parseInt(dayOfMonth) : null,
      startDate,
      endDate: endDate || null, // Enviar null si está vacío
      accountId,
      categoryId,
      notes,
      isActive,
    };

    try {
      await recurringTransactionsService.createRecurringTransaction(recurringTxData);
      navigate('/settings/recurring-transactions');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al crear el movimiento recurrente.');
      console.error("Error creating recurring transaction:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loadingInitialData) {
    return <div className="page-container"><p className="loading-text">Cargando formulario...</p></div>;
  }

  return (
    <div className="page-container add-recurring-tx-page">
      <div className="form-container" style={{maxWidth: '800px'}}>
        <h2>Definir Nuevo Movimiento Recurrente</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}

          <div className="form-group">
            <label htmlFor="description">Descripción (*):</label>
            <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          <div className="form-grid-thirds">
            <div className="form-group">
              <label htmlFor="amount">Monto (*):</label>
              <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} step="0.01" required />
            </div>
            <div className="form-group">
              <label htmlFor="currency">Moneda (*):</label>
              <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {currencyOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="type">Tipo (*):</label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="egreso">Egreso</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </div>
          </div>

          <div className="form-grid-thirds">
            <div className="form-group">
              <label htmlFor="accountId">Cuenta Origen/Destino (*):</label>
              <select id="accountId" value={accountId} onChange={(e) => setAccountId(e.target.value)} required disabled={accounts.length === 0}>
                <option value="">{accounts.length === 0 ? 'No hay cuentas' : 'Seleccionar cuenta'}</option>
                {accounts.map(acc => (<option key={acc.id} value={acc.id}>{acc.icon} {acc.name} ({acc.currency})</option>))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="categoryId">Categoría (*):</label>
              <select id="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required disabled={categories.length === 0}>
                <option value="">{categories.length === 0 ? `No hay categorías de ${type}` : 'Seleccionar categoría'}</option>
                {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>))}
              </select>
            </div>
             <div className="form-group">
              <label htmlFor="isActive">Estado:</label>
              <select id="isActive" value={isActive.toString()} onChange={(e) => setIsActive(e.target.value === 'true')}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>
          
          <hr className="form-separator"/>
          <h4>Configuración de Recurrencia</h4>

          <div className="form-grid-thirds">
            <div className="form-group">
              <label htmlFor="frequency">Frecuencia (*):</label>
              <select id="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                {frequencyOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
            {frequency === 'semanal' && (
              <div className="form-group">
                <label htmlFor="dayOfWeek">Día de la Semana (*):</label>
                <select id="dayOfWeek" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} required={frequency === 'semanal'}>
                  <option value="">Seleccionar día</option>
                  {daysOfWeekOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
              </div>
            )}
            {(frequency === 'mensual' || frequency === 'quincenal' || frequency === 'bimestral' || frequency === 'trimestral' || frequency === 'semestral' || frequency === 'anual') && (
              <div className="form-group">
                <label htmlFor="dayOfMonth">Día del Mes (*):</label>
                <select id="dayOfMonth" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} required={frequency !== 'diaria' && frequency !== 'semanal'}>
                  <option value="">Seleccionar día</option>
                  {daysOfMonthOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  {/* <option value="ultimo">Último día del mes</option> */}
                </select>
              </div>
            )}
          </div>

          <div className="form-grid-halves">
            <div className="form-group">
              <label htmlFor="startDate">Fecha de Inicio Recurrencia (*):</label>
              <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">Fecha de Fin Recurrencia (Opcional):</label>
              <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notas (Opcional):</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="2"></textarea>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading || loadingInitialData} className="button-primary">
              {loading ? 'Guardando...' : 'Guardar Definición'}
            </button>
            <button type="button" onClick={() => navigate('/settings/recurring-transactions')} className="button-secondary" disabled={loading || loadingInitialData}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecurringTransactionPage;
