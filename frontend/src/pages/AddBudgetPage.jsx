// Ruta: finanzas-app-pro/frontend/src/pages/AddBudgetPage.jsx
// ACTUALIZA ESTE ARCHIVO (reemplaza el placeholder anterior)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import budgetsService from '../services/budgets.service';
import categoriesService from '../services/categories.service'; // Para las categorías de egreso
import './AddBudgetPage.css'; // Crearemos o usaremos este CSS

const AddBudgetPage = () => {
  const navigate = useNavigate();

  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState(''); // Guardaremos el nombre para el servicio simulado
  const [icon, setIcon] = useState('🎯'); // Icono por defecto
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ARS'); // Moneda por defecto
  const [period, setPeriod] = useState('mensual'); // 'mensual', 'anual', 'personalizado'
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]); // Primer día del mes actual
  const [endDate, setEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]); // Último día del mes actual
  
  const [availableCategories, setAvailableCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    // Cargar categorías de egreso
    categoriesService.getCategoriesByType('egreso')
      .then(data => {
        setAvailableCategories(data);
        if (data.length > 0 && !categoryId) {
          // No preseleccionar, dejar que el usuario elija
        }
      })
      .catch(err => {
        console.error("Error cargando categorías de egreso:", err);
        setError("No se pudieron cargar las categorías para el presupuesto.");
      });
  }, []); // Solo al montar

  useEffect(() => {
    // Ajustar fechas si el período no es personalizado
    if (period !== 'personalizado') {
      const now = new Date();
      let newStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      let newEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      if (period === 'anual') {
        newStartDate = new Date(now.getFullYear(), 0, 1); // 1 de Enero
        newEndDate = new Date(now.getFullYear(), 11, 31); // 31 de Diciembre
      } else if (period === 'quincenal') {
        // Lógica simple para quincena actual (del 1 al 15, o del 16 a fin de mes)
        if (now.getDate() <= 15) {
          newEndDate = new Date(now.getFullYear(), now.getMonth(), 15);
        } else {
          newStartDate = new Date(now.getFullYear(), now.getMonth(), 16);
        }
      } else if (period === 'semanal') {
        // Lógica simple para semana actual (Lunes a Domingo)
        const dayOfWeek = now.getDay(); // 0 (Dom) a 6 (Sab)
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Ajuste para que la semana empiece en Lunes
        newStartDate = new Date(now.setDate(now.getDate() + diffToMonday));
        newEndDate = new Date(newStartDate);
        newEndDate.setDate(newStartDate.getDate() + 6);
      }
      setStartDate(newStartDate.toISOString().split('T')[0]);
      setEndDate(newEndDate.toISOString().split('T')[0]);
    }
  }, [period]);

  const handleCategoryChange = (e) => {
    const selectedCatId = e.target.value;
    setCategoryId(selectedCatId);
    const selectedCategory = availableCategories.find(cat => cat.id === selectedCatId);
    if (selectedCategory) {
      setCategoryName(selectedCategory.name);
      setIcon(selectedCategory.icon || '🎯');
    } else {
      setCategoryName('');
      setIcon('🎯');
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
    setLoading(true);

    const budgetData = {
      categoryId,
      categoryName, // El servicio simulado lo usa
      icon,
      amount: parseFloat(amount),
      currency,
      period,
      startDate,
      endDate,
    };

    try {
      await budgetsService.createBudget(budgetData);
      navigate('/budgets'); 
    } catch (err) {
      setError(err.message || 'Error al crear el presupuesto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container add-budget-page">
      <div className="form-container" style={{maxWidth: '700px'}}>
        <h2>Crear Nuevo Presupuesto</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}

          <div className="form-group">
            <label htmlFor="categoryId">Categoría de Gasto:</label>
            <select id="categoryId" value={categoryId} onChange={handleCategoryChange} required>
              <option value="" disabled>Selecciona una categoría</option>
              {availableCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-grid-halves">
            <div className="form-group">
              <label htmlFor="amount">Monto Presupuestado:</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                placeholder="Ej: 5000.00"
                required
              />
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
              <input 
                type="date" 
                id="startDate" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                required 
                disabled={period !== 'personalizado'}
              />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">Fecha de Fin:</label>
              <input 
                type="date" 
                id="endDate" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                required 
                disabled={period !== 'personalizado'}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="icon">Ícono (Emoji):</label>
            <input
              type="text"
              id="icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength="2"
              style={{width: '80px', textAlign: 'center', fontSize: '1.5rem'}}
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="button-primary">
              {loading ? 'Creando...' : 'Crear Presupuesto'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/budgets')} 
              className="button-secondary" 
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBudgetPage;
