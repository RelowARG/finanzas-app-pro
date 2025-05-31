// Ruta: finanzas-app-pro/frontend/src/pages/EditRecurringTransactionPage.jsx
// ARCHIVO NUEVO
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import recurringTransactionsService from '../services/recurringTransactions.service';
import accountService from '../services/accounts.service';
import categoriesService from '../services/categories.service';
import './AddRecurringTransactionPage.css'; // Reutilizamos los estilos

const EditRecurringTransactionPage = () => {
  const navigate = useNavigate();
  const { recurringId } = useParams();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [type, setType] = useState('egreso');
  const [frequency, setFrequency] = useState('mensual');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [nextRunDate, setNextRunDate] = useState(''); // Para mostrar, podría ser editable
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState(null);


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

  const populateForm = useCallback((data) => {
    setOriginalData(data);
    setDescription(data.description || '');
    setAmount(Math.abs(data.amount).toString() || '');
    setCurrency(data.currency || 'ARS');
    setType(data.type || 'egreso');
    setFrequency(data.frequency || 'mensual');
    setDayOfWeek(data.dayOfWeek !== null ? data.dayOfWeek.toString() : '');
    setDayOfMonth(data.dayOfMonth !== null ? data.dayOfMonth.toString() : '1');
    setStartDate(data.startDate ? data.startDate.split('T')[0] : '');
    setEndDate(data.endDate ? data.endDate.split('T')[0] : '');
    setNextRunDate(data.nextRunDate ? data.nextRunDate.split('T')[0] : '');
    setAccountId(data.accountId || '');
    setCategoryId(data.categoryId || '');
    setNotes(data.notes || '');
    setIsActive(data.isActive !== undefined ? data.isActive : true);
  }, []);

  const fetchCategoriesForType = useCallback(async (currentType) => {
    if (currentType) {
      try {
        const catData = await categoriesService.getCategoriesByType(currentType);
        setCategories(catData || []);
        return catData || [];
      } catch (err) {
        console.error("Error cargando categorías:", err);
        setError(prev => prev + " No se pudieron cargar las categorías.");
        setCategories([]);
        return [];
      }
    } else {
      setCategories([]);
      return [];
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [recurringTxData, accData] = await Promise.all([
          recurringTransactionsService.getRecurringTransactionById(recurringId),
          accountService.getAllAccounts()
        ]);
        
        setAccounts(accData || []);

        if (recurringTxData) {
          populateForm(recurringTxData);
          await fetchCategoriesForType(recurringTxData.type); // Cargar categorías para el tipo inicial
        } else {
          setError('Definición de movimiento recurrente no encontrada.');
          navigate('/settings/recurring-transactions');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error al cargar los datos.');
        console.error(err);
      }
      setLoading(false);
    };
    if (recurringId) {
      loadData();
    }
  }, [recurringId, navigate, populateForm, fetchCategoriesForType]);

  // Efecto para recargar categorías si el TIPO cambia manualmente
  useEffect(() => {
    if (!loading && type !== originalData?.type) { // Solo si no está cargando y el tipo realmente cambió
        fetchCategoriesForType(type).then(newCategories => {
            // Intentar mantener la categoría si es válida para el nuevo tipo, sino resetear
            const currentCatStillValidInNewList = newCategories.some(cat => cat.id === categoryId);
            if (!currentCatStillValidInNewList && newCategories.length > 0) {
                setCategoryId(newCategories[0].id);
            } else if (!currentCatStillValidInNewList) {
                setCategoryId('');
            }
        });
    }
  }, [type, loading, originalData, categoryId, fetchCategoriesForType]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validaciones similares a AddRecurringTransactionPage
    if (!description || !amount || !accountId || !categoryId || !startDate) {
      setError('Por favor, completa todos los campos requeridos (*).');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const recurringTxDataToUpdate = {
      description,
      amount: parseFloat(amount),
      currency,
      type,
      frequency,
      dayOfWeek: frequency === 'semanal' ? parseInt(dayOfWeek) : null,
      dayOfMonth: (frequency !== 'diaria' && frequency !== 'semanal') ? parseInt(dayOfMonth) : null,
      startDate,
      endDate: endDate || null,
      // nextRunDate: nextRunDate, // El backend lo recalculará si cambian frecuencia/startDate
      accountId,
      categoryId,
      notes,
      isActive,
    };

    try {
      await recurringTransactionsService.updateRecurringTransaction(recurringId, recurringTxDataToUpdate);
      navigate('/settings/recurring-transactions');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar el movimiento recurrente.');
      console.error("Error updating recurring transaction:", err.response?.data || err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-container"><p className="loading-text">Cargando definición...</p></div>;
  }
   if (error && !originalData) {
     return <div className="page-container"><p className="error-message">{error}</p> <Link to="/settings/recurring-transactions" className="button">Volver</Link> </div>;
  }

  return (
    <div className="page-container add-recurring-tx-page"> {/* Reutiliza clase */}
      <div className="form-container" style={{maxWidth: '800px'}}>
        <h2>Editar Movimiento Recurrente</h2>
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
            {(frequency !== 'diaria' && frequency !== 'semanal') && (
              <div className="form-group">
                <label htmlFor="dayOfMonth">Día del Mes (*):</label>
                <select id="dayOfMonth" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} required={frequency !== 'diaria' && frequency !== 'semanal'}>
                  <option value="">Seleccionar día</option>
                  {daysOfMonthOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
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
                <label htmlFor="nextRunDate">Próxima Ejecución (informativo):</label>
                <input type="date" id="nextRunDate" value={nextRunDate} readOnly disabled style={{backgroundColor: '#e9ecef'}}/>
            </div>

          <div className="form-group">
            <label htmlFor="notes">Notas (Opcional):</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="2"></textarea>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={isSubmitting || loading} className="button-primary">
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button type="button" onClick={() => navigate('/settings/recurring-transactions')} className="button-secondary" disabled={isSubmitting || loading}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRecurringTransactionPage;