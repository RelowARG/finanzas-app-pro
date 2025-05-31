// Ruta: finanzas-app-pro/frontend/src/pages/AddTransactionPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import transactionService from '../services/transactions.service';
import accountService from '../services/accounts.service';
import categoriesService from '../services/categories.service';
import { useAuth } from '../contexts/AuthContext';
import './AddTransactionPage.css'; 

const AddTransactionPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const { user } = useAuth(); 

  const queryParams = new URLSearchParams(location.search);
  const initialType = queryParams.get('type') || 'egreso';

  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [icon, setIcon] = useState(initialType === 'ingreso' ? '➕' : '💸'); 

  // Estados para cuotas
  const [isInstallment, setIsInstallment] = useState(false);
  const [currentInstallment, setCurrentInstallment] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); 
  const [loadingInitialData, setLoadingInitialData] = useState(true); 

  useEffect(() => {
    const loadInitialAccounts = async () => {
      if (!user) return; 
      setLoadingInitialData(true);
      try {
        const accData = await accountService.getAllAccounts(); 
        setAccounts(accData || []); 
        if (accData && accData.length > 0 && !accountId) {
          setAccountId(accData[0].id.toString());
        }
      } catch (err) {
        console.error("Error cargando cuentas:", err);
        setError("No se pudieron cargar las cuentas.");
      }
      setLoadingInitialData(false);
    };
    loadInitialAccounts();
  }, [user]);

  useEffect(() => {
    const loadCategoriesAndSetDefault = async () => {
      if (type && !loadingInitialData && user) {
        try {
          setError('');
          const fetchedCategoriesForType = await categoriesService.getCategoriesByType(type);
          setCategories(fetchedCategoriesForType || []);

          const currentCategoryIdString = categoryId ? categoryId.toString() : '';
          let currentCategoryIsValid = false;
          if(fetchedCategoriesForType && fetchedCategoriesForType.length > 0){
             currentCategoryIsValid = fetchedCategoriesForType.some(cat => cat.id.toString() === currentCategoryIdString);
          }
          
          if (fetchedCategoriesForType && fetchedCategoriesForType.length > 0) {
            if (!currentCategoryIsValid) {
              const firstCategory = fetchedCategoriesForType[0];
              setCategoryId(firstCategory.id.toString());
              setIcon(firstCategory.icon || (type === 'ingreso' ? '➕' : '💸'));
            } else {
              const selectedCat = fetchedCategoriesForType.find(cat => cat.id.toString() === currentCategoryIdString);
              if (selectedCat) {
                  setIcon(selectedCat.icon || (type === 'ingreso' ? '➕' : '💸'));
              }
            }
          } else { 
            setCategoryId('');
            setIcon(type === 'ingreso' ? '➕' : '💸');
          }
        } catch (err) {
          console.error("[CategoriesEffect] Error loading categories:", err);
          setError("No se pudieron cargar las categorías.");
          setCategories([]);
          setCategoryId('');
        }
      } else if (!type && user) {
        setCategories([]);
        setCategoryId('');
        setIcon('');
      }
    };
    loadCategoriesAndSetDefault();
  }, [type, user, loadingInitialData]); 

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategoryId(''); 
    setIsInstallment(false); // Resetear cuotas si cambia el tipo (generalmente cuotas son egresos)
    setCurrentInstallment('');
    setTotalInstallments('');
  };

  const handleCategoryChange = (e) => {
    const selectedCatId = e.target.value;
    setCategoryId(selectedCatId);
    const selectedCategory = categories.find(cat => cat.id.toString() === selectedCatId);
    if (selectedCategory) {
      setIcon(selectedCategory.icon || (type === 'ingreso' ? '➕' : '💸'));
    } else {
      setIcon(type === 'ingreso' ? '➕' : '💸');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.id) {
        setError('Usuario no autenticado. Por favor, inicie sesión.');
        return;
    }
    if (!amount || !accountId || !categoryId || !date || !type) {
      setError('Por favor, completa tipo, monto, cuenta, categoría y fecha.');
      return;
    }
    if (isInstallment && (!currentInstallment || !totalInstallments || parseInt(currentInstallment,10) <= 0 || parseInt(totalInstallments,10) <=0 )) {
      setError('Para compras en cuotas, completa el número de cuota actual y el total de cuotas (mayores a cero).');
      return;
    }
    if (isInstallment && parseInt(currentInstallment,10) > parseInt(totalInstallments,10) ) {
      setError('La cuota actual no puede ser mayor al total de cuotas.');
      return;
    }


    setError('');
    setLoading(true);

    const selectedAccount = accounts.find(acc => acc.id.toString() === accountId.toString());

    const transactionData = {
      type,
      amount: parseFloat(amount), 
      currency: selectedAccount?.currency || 'ARS', 
      date,
      accountId: parseInt(accountId, 10), 
      categoryId: parseInt(categoryId, 10), 
      description: description.trim(),
      notes: notes.trim(),
      userId: user.id, 
      isInstallment,
      currentInstallment: isInstallment ? parseInt(currentInstallment, 10) : null,
      totalInstallments: isInstallment ? parseInt(totalInstallments, 10) : null,
    };

    try {
      await transactionService.createTransaction(transactionData);
      navigate('/transactions'); 
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al crear el movimiento.');
      console.error("Error creating transaction:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingInitialData && !user) {
      return <div className="page-container"><p className="loading-text">Verificando usuario...</p></div>;
  }
  if (loadingInitialData && user) { 
    return <div className="page-container"><p className="loading-text">Cargando datos del formulario...</p></div>;
  }

  return (
    <div className="page-container add-transaction-page">
      <div className="form-container" style={{maxWidth: '700px'}}>
        <h2>{type === 'ingreso' ? 'Registrar Nuevo Ingreso' : 'Registrar Nuevo Gasto'}</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}

          <div className="form-group type-selector">
            <button 
              type="button" 
              className={`button-type ${type === 'egreso' ? 'active' : ''}`}
              onClick={() => handleTypeChange('egreso')}>
              ➖ Gasto
            </button>
            <button 
              type="button" 
              className={`button-type ${type === 'ingreso' ? 'active' : ''}`}
              onClick={() => handleTypeChange('ingreso')}>
              ➕ Ingreso
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="amount">Monto (*):</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="accountId">Cuenta (*):</label>
              <select id="accountId" value={accountId} onChange={(e) => setAccountId(e.target.value)} required disabled={accounts.length === 0}>
                <option value="" disabled>{accounts.length === 0 ? 'No hay cuentas' : 'Selecciona una cuenta'}</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id.toString()}>
                    {acc.icon} {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="date">Fecha (*):</label>
              <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="form-group">
              <label htmlFor="categoryId">Categoría (*):</label>
              <select 
                id="categoryId" 
                value={categoryId} 
                onChange={handleCategoryChange} 
                required 
                disabled={!type || categories.length === 0}
              >
                <option value="" disabled>
                  {!type ? 'Selecciona un tipo primero' : categories.length === 0 ? `No hay categorías de ${type}` : 'Selecciona una categoría'}
                </option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id.toString()}>
                  {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Descripción (*):</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Compra supermercado, Sueldo Mayo"
              required 
            />
          </div>
           <div className="form-group">
            <label htmlFor="notes">Notas (Opcional):</label>
            <textarea 
                id="notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                rows="3"
                placeholder="Detalles adicionales..."
            ></textarea>
          </div>

          {/* Campos de Cuotas */}
          {type === 'egreso' && ( // Generalmente las cuotas son para egresos
            <>
              <div className="form-group">
                <label htmlFor="isInstallment" className="checkbox-label">
                  <input
                    type="checkbox"
                    id="isInstallment"
                    checked={isInstallment}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsInstallment(checked);
                      if (!checked) { 
                        setCurrentInstallment('');
                        setTotalInstallments('');
                      }
                    }}
                  />
                  ¿Es una compra en cuotas?
                </label>
              </div>

              {isInstallment && (
                <div className="form-grid-halves" style={{marginBottom: '15px'}}>
                  <div className="form-group">
                    <label htmlFor="currentInstallment">Cuota Actual N° (*):</label>
                    <input
                      type="number"
                      id="currentInstallment"
                      value={currentInstallment}
                      onChange={(e) => setCurrentInstallment(e.target.value)}
                      placeholder="Ej: 1"
                      min="1"
                      required={isInstallment}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="totalInstallments">Total de Cuotas (*):</label>
                    <input
                      type="number"
                      id="totalInstallments"
                      value={totalInstallments}
                      onChange={(e) => setTotalInstallments(e.target.value)}
                      placeholder="Ej: 12"
                      min="1"
                      required={isInstallment}
                    />
                  </div>
                </div>
              )}
            </>
          )}
          
          <div className="form-actions">
            <button type="submit" disabled={loading || loadingInitialData} className="button-primary">
              {loading ? 'Guardando...' : (type === 'ingreso' ? 'Registrar Ingreso' : 'Registrar Gasto')}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="button-secondary" disabled={loading || loadingInitialData}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionPage;