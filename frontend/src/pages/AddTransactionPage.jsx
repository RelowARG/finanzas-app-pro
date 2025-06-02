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
  const [relatedAccountId, setRelatedAccountId] = useState(''); // *** Para transferencias ***
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [icon, setIcon] = useState(initialType === 'ingreso' ? '➕' : (initialType === 'transferencia' ? '↔️' : '💸')); 

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
  }, [user, accountId]); 

  useEffect(() => {
    const loadCategoriesAndSetDefault = async () => {
      if (type && !loadingInitialData && user) {
        if (type === 'transferencia') {
          setCategories([]); 
          setCategoryId(''); 
          setIcon('↔️');
          return;
        }
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
  }, [type, user, loadingInitialData, categoryId]); 

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategoryId(''); 
    setRelatedAccountId(''); 
    setIsInstallment(false); 
    setCurrentInstallment('');
    setTotalInstallments('');
  };

  const handleCategoryChange = (e) => {
    const selectedCatId = e.target.value;
    setCategoryId(selectedCatId);
    const selectedCategory = categories.find(cat => cat.id.toString() === selectedCatId);
    if (selectedCategory) {
      setIcon(selectedCategory.icon || (type === 'ingreso' ? '➕' : (type === 'transferencia' ? '↔️' : '💸')));
    } else {
      setIcon(type === 'ingreso' ? '➕' : (type === 'transferencia' ? '↔️' : '💸'));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.id) {
        setError('Usuario no autenticado. Por favor, inicie sesión.');
        return;
    }
    if (!amount || !accountId || !date || !type) {
      setError('Por favor, completa tipo, monto, cuenta y fecha.');
      return;
    }
    if (type !== 'transferencia' && !categoryId) {
        setError('Por favor, selecciona una categoría para ingresos o egresos.');
        return;
    }
    if (type === 'transferencia' && !relatedAccountId) {
        setError('Por favor, selecciona la cuenta de destino/origen para la transferencia.');
        return;
    }
    if (type === 'transferencia' && accountId === relatedAccountId) {
        setError('La cuenta de origen y destino no pueden ser la misma para una transferencia.');
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
      categoryId: type !== 'transferencia' ? parseInt(categoryId, 10) : null,
      relatedAccountId: type === 'transferencia' ? parseInt(relatedAccountId, 10) : null,
      description: description.trim(),
      notes: notes.trim(),
      userId: user.id, 
      isInstallment: type === 'egreso' && isInstallment, 
      currentInstallment: (type === 'egreso' && isInstallment) ? parseInt(currentInstallment, 10) : null,
      totalInstallments: (type === 'egreso' && isInstallment) ? parseInt(totalInstallments, 10) : null,
    };

    try {
      if (type === 'transferencia') {
          const destinationAccount = accounts.find(acc => acc.id.toString() === relatedAccountId.toString());
          transactionData.description = transactionData.description || `Transferencia a ${destinationAccount?.name || 'otra cuenta'}`;
      }
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
        <h2>{type === 'ingreso' ? 'Registrar Ingreso' : (type === 'transferencia' ? 'Registrar Transferencia' : 'Registrar Gasto')}</h2>
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
            <button 
              type="button" 
              className={`button-type ${type === 'transferencia' ? 'active' : ''}`}
              onClick={() => handleTypeChange('transferencia')}>
              ↔️ Transferencia
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="amount">Monto (*):</label>
              <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} step="0.01" placeholder="0.00" required />
            </div>

            <div className="form-group">
              <label htmlFor="accountId">{type === 'transferencia' ? 'Cuenta Origen (*):' : 'Cuenta (*):'}</label>
              <select id="accountId" value={accountId} onChange={(e) => setAccountId(e.target.value)} required disabled={accounts.length === 0}>
                <option value="" disabled>{accounts.length === 0 ? 'No hay cuentas' : 'Selecciona una cuenta'}</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id.toString()}>
                    {acc.icon} {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transferencia' && (
                <div className="form-group">
                    <label htmlFor="relatedAccountId">Cuenta Destino (*):</label>
                    <select id="relatedAccountId" value={relatedAccountId} onChange={(e) => setRelatedAccountId(e.target.value)} required disabled={accounts.length === 0}>
                        <option value="" disabled>Selecciona cuenta destino</option>
                        {accounts.filter(acc => acc.id.toString() !== accountId.toString()).map(acc => ( 
                            <option key={acc.id} value={acc.id.toString()}>{acc.icon} {acc.name} ({acc.currency})</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="form-group">
              <label htmlFor="date">Fecha (*):</label>
              <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            {type !== 'transferencia' && (
              <div className="form-group">
                <label htmlFor="categoryId">Categoría (*):</label>
                <select 
                  id="categoryId" 
                  value={categoryId} 
                  onChange={handleCategoryChange} 
                  required={type !== 'transferencia'} 
                  disabled={!type || type === 'transferencia' || categories.length === 0}
                >
                  <option value="" disabled>
                    {!type ? 'Selecciona un tipo primero' : (type === 'transferencia' ? 'N/A para transferencias' : (categories.length === 0 ? `No hay categorías de ${type}` : 'Selecciona una categoría'))}
                  </option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id.toString()}>
                    {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Descripción {type === 'transferencia' ? '(Opcional)' : '(*)'}:</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'transferencia' ? "Ej: Ahorros para viaje" : "Ej: Compra supermercado, Sueldo Mayo"}
              required={type !== 'transferencia'} 
            />
          </div>
           <div className="form-group">
            <label htmlFor="notes">Notas (Opcional):</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" placeholder="Detalles adicionales..."></textarea>
          </div>

          {type === 'egreso' && (
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
              {loading ? 'Guardando...' : (type === 'ingreso' ? 'Registrar Ingreso' : (type === 'transferencia' ? 'Registrar Transferencia' : 'Registrar Gasto'))}
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