// Ruta: finanzas-app-pro/frontend/src/pages/EditBudgetPage.jsx
// ARCHIVO NUEVO
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import budgetsService from '../services/budgets.service';
import categoriesService from '../services/categories.service';
import './AddBudgetPage.css'; // Reutilizamos los estilos de AddBudgetPage

const EditBudgetPage = () => {
  const navigate = useNavigate();
  const { budgetId } = useParams();

  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState(''); // Para mostrar, no se edita directamente aquí
  const [icon, setIcon] = useState('🎯');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [period, setPeriod] = useState('mensual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [originalBudget, setOriginalBudget] = useState(null); // Para comparar cambios
  const [availableCategories, setAvailableCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currencyOptions = [
    { value: 'ARS', label: 'ARS - Peso Argentino' },
    { value: 'USD', label: 'USD - Dólar Estadounidense' },
  ];

  const periodOptions = [
    { value: 'mensual', label: 'Mensual' },
    { value: 'quincenal', label: 'Quincenal' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'anual', label: 'Anual' },
    { value: 'personalizado', label: 'Personalizado' },
  ];

  const populateForm = useCallback((budgetData) => {
    setOriginalBudget(budgetData); // Guardar el original para referencia
    setCategoryId(budgetData.categoryId);
    setCategoryName(budgetData.categoryNameSnapshot || budgetData.category?.name || '');
    setIcon(budgetData.icon || budgetData.category?.icon || '🎯');
    setAmount(budgetData.amount.toString());
    setCurrency(budgetData.currency);
    setPeriod(budgetData.period);
    setStartDate(budgetData.startDate.split('T')[0]); // Asumiendo que viene como ISOString
    setEndDate(budgetData.endDate.split('T')[0]);   // Asumiendo que viene como ISOString
  }, []);

  useEffect(() => {
    const fetchBudgetData = async () => {
      setLoading(true);
      setError('');
      try {
        const [budgetData, catData] = await Promise.all([
          budgetsService.getBudgetById(budgetId),
          categoriesService.getCategoriesByType('egreso') // Presupuestos son para egresos
        ]);

        setAvailableCategories(catData || []);

        if (budgetData) {
          populateForm(budgetData);
        } else {
          setError('Presupuesto no encontrado.');
          navigate('/budgets');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error al cargar el presupuesto.');
        console.error("Error fetching budget for edit:", err);
      } finally {
        setLoading(false);
      }
    };
    if (budgetId) {
      fetchBudgetData();
    }
  }, [budgetId, navigate, populateForm]);

  // Actualizar fechas si el período cambia y no es personalizado
   useEffect(() => {
    if (period !== 'personalizado' && !loading && originalBudget) { // Solo si no está cargando y ya hay datos originales
      const now = new Date(); // Podríamos usar la fecha de inicio original como base si es relevante
      let newStartDateObj = new Date(originalBudget.startDate); // Usar fecha original como base
      let newEndDateObj = new Date(originalBudget.endDate);

      if (period === 'mensual') {
        newStartDateObj = new Date(newStartDateObj.getFullYear(), newStartDateObj.getMonth(), 1);
        newEndDateObj = new Date(newStartDateObj.getFullYear(), newStartDateObj.getMonth() + 1, 0);
      } else if (period === 'anual') {
        newStartDateObj = new Date(newStartDateObj.getFullYear(), 0, 1);
        newEndDateObj = new Date(newStartDateObj.getFullYear(), 11, 31);
      }
      // Añadir lógica para quincenal y semanal si es necesario, similar a AddBudgetPage
      
      setStartDate(newStartDateObj.toISOString().split('T')[0]);
      setEndDate(newEndDateObj.toISOString().split('T')[0]);
    }
  }, [period, loading, originalBudget]);


  const handleCategoryChange = (e) => {
    const selectedCatId = e.target.value;
    setCategoryId(selectedCatId);
    const selectedCategory = availableCategories.find(cat => cat.id === selectedCatId);
    if (selectedCategory) {
      setCategoryName(selectedCategory.name); // Actualizar el nombre para el snapshot
      setIcon(selectedCategory.icon || '🎯');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId || !amount || !period || !startDate || !endDate) {
      setError('Por favor, completa categoría, monto, período y fechas.');
      return;
    }
     if (new Date(endDate) < new Date(startDate)) {
        setError('La fecha de fin no puede ser anterior a la fecha de inicio.');
        return;
    }
    setError('');
    setIsSubmitting(true);

    const selectedCategory = availableCategories.find(cat => cat.id === categoryId);

    const budgetDataToUpdate = {
      categoryId,
      categoryNameSnapshot: selectedCategory?.name || categoryName, // Mantener el nombre si no cambia la categoría
      icon: selectedCategory?.icon || icon,
      amount: parseFloat(amount),
      currency,
      period,
      startDate,
      endDate,
    };

    try {
      await budgetsService.updateBudget(budgetId, budgetDataToUpdate);
      navigate('/budgets'); 
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar el presupuesto.');
      console.error("Error updating budget:", err.response?.data || err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-container"><p className="loading-text">Cargando datos del presupuesto...</p></div>;
  }
  if (error && !originalBudget) {
     return <div className="page-container"><p className="error-message">{error}</p> <Link to="/budgets" className="button">Volver</Link> </div>;
  }

  return (
    <div className="page-container add-budget-page"> {/* Reutiliza la clase y estilos */}
      <div className="form-container" style={{maxWidth: '700px'}}>
        <h2>Editar Presupuesto para "{categoryName || 'Categoría'}"</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}

          <div className="form-group">
            <label htmlFor="categoryId">Categoría de Gasto:</label>
            <select id="categoryId" value={categoryId} onChange={handleCategoryChange} required disabled={availableCategories.length === 0}>
              <option value="" disabled>{availableCategories.length === 0 ? "Cargando/No hay categorías" : "Selecciona una categoría"}</option>
              {availableCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-grid-halves">
            <div className="form-group">
              <label htmlFor="amount">Monto Presupuestado:</label>
              <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} step="0.01" required />
            </div>
            <div className="form-group">
              <label htmlFor="currency">Moneda:</label>
              <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {currencyOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="period">Período:</label>
            <select id="period" value={period} onChange={(e) => setPeriod(e.target.value)}>
              {periodOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <div className="form-grid-halves">
            <div className="form-group">
              <label htmlFor="startDate">Fecha de Inicio:</label>
              <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} required disabled={period !== 'personalizado'} />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">Fecha de Fin:</label>
              <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} required disabled={period !== 'personalizado'} />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="icon">Ícono (Emoji):</label>
            <input type="text" id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength="2" style={{width: '80px', textAlign: 'center', fontSize: '1.5rem'}}/>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={isSubmitting || loading} className="button-primary">
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button type="button" onClick={() => navigate('/budgets')} className="button-secondary" disabled={isSubmitting || loading}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBudgetPage;
