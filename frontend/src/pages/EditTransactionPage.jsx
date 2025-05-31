// Ruta: finanzas-app-pro/frontend/src/pages/EditTransactionPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import transactionService from '../services/transactions.service';
import accountService from '../services/accounts.service';
import categoriesService from '../services/categories.service';
import { useAuth } from '../contexts/AuthContext';
import './AddTransactionPage.css'; // Reutilizamos los estilos

const EditTransactionPage = () => {
  const navigate = useNavigate();
  const { transactionId } = useParams(); 
  const { user } = useAuth();

  const [type, setType] = useState('egreso');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [icon, setIcon] = useState('');

  // Estados para cuotas
  const [isInstallment, setIsInstallment] = useState(false);
  const [currentInstallment, setCurrentInstallment] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');
  
  const [originalData, setOriginalData] = useState(null); // Para comparar cambios

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [error, setError] = useState('');
  const [loadingForm, setLoadingForm] = useState(true); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategoriesForType = useCallback(async (currentType, currentCatId = null) => {
    if (currentType) {
      try {
        const catData = await categoriesService.getCategoriesByType(currentType);
        setCategories(catData || []);
        
        if (currentCatId && catData.some(cat => cat.id.toString() === currentCatId.toString())) {
            setCategoryId(currentCatId.toString());
            const selectedCat = catData.find(cat => cat.id.toString() === currentCatId.toString());
            if (selectedCat) setIcon(selectedCat.icon || (currentType === 'ingreso' ? '➕' : '💸'));
        } else if (catData && catData.length > 0) {
            setCategoryId(catData[0].id.toString());
            setIcon(catData[0].icon || (currentType === 'ingreso' ? '➕' : '💸'));
        } else {
            setCategoryId('');
            setIcon(currentType === 'ingreso' ? '➕' : '💸');
        }
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

  const populateForm = useCallback((data) => {
    setOriginalData(data);
    setType(data.type);
    setAmount(data.amount.toString()); // El backend ya devuelve el monto positivo para edición
    setDate(data.date.split('T')[0]);
    setAccountId(data.accountId.toString());
    // categoryId se seteará en el efecto de fetchCategoriesForType
    setDescription(data.description || '');
    setNotes(data.notes || '');
    
    setIsInstallment(data.isInstallment || false);
    setCurrentInstallment(data.isInstallment && data.currentInstallment ? data.currentInstallment.toString() : '');
    setTotalInstallments(data.isInstallment && data.totalInstallments ? data.totalInstallments.toString() : '');
    
    // Se llama a fetchCategoriesForType con el categoryId de la transacción
    fetchCategoriesForType(data.type, data.categoryId);

  }, [fetchCategoriesForType]);

  useEffect(() => {
    const fetchTransactionAndInitialData = async () => {
      if(!user || !transactionId) return;
      setLoadingForm(true);
      setError('');
      try {
        const [transactionData, accData] = await Promise.all([
          transactionService.getTransactionById(transactionId),
          accountService.getAllAccounts(),
        ]);

        setAccounts(accData || []);

        if (transactionData) {
          populateForm(transactionData);
        } else {
          setError('Movimiento no encontrado.');
          navigate('/transactions');
        }
      } catch (err) {
        console.error("Error cargando datos para editar:", err);
        setError(err.response?.data?.message || err.message || 'Error al cargar los datos del movimiento.');
      } finally {
        setLoadingForm(false);
      }
    };
    fetchTransactionAndInitialData();
  }, [transactionId, user, navigate, populateForm]);

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategoryId(''); // Resetear categoría, useEffect la seteará
    // Si es un cambio de tipo, resetear cuotas
    setIsInstallment(false); 
    setCurrentInstallment('');
    setTotalInstallments('');
    // El useEffect de fetchCategoriesForType se encargará de recargar y setear ícono.
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
        setError('Usuario no autenticado.');
        return;
    }
    if (!amount || !accountId || !categoryId || !date) {
      setError('Por favor, completa monto, cuenta, categoría y fecha.');
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
    setIsSubmitting(true);

    const selectedAccount = accounts.find(acc => acc.id.toString() === accountId.toString());

    const transactionDataToUpdate = {
      type,
      amount: parseFloat(amount), // El backend espera el monto positivo para el form
      currency: selectedAccount?.currency,
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
      await transactionService.updateTransaction(transactionId, transactionDataToUpdate);
      navigate('/transactions');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar el movimiento.');
      console.error("Error updating transaction:", err.response?.data || err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingForm) {
    return <div className="page-container"><p className="loading-text">Cargando movimiento...</p></div>;
  }
   if (error && !originalData) { 
     return (
      <div className="page-container">
        <p className="error-message">{error}</p> 
        <Link to="/transactions" className="button">Volver a Movimientos</Link>
      </div>
    );
  }

  return (
    <div className="page-container add-transaction-page">
      <div className="form-container" style={{maxWidth: '700px'}}>
        <h2>Editar Movimiento</h2>
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
              <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} step="0.01" required />
            </div>
            <div className="form-group">
              <label htmlFor="accountId">Cuenta (*):</label>
              <select id="accountId" value={accountId} onChange={(e) => setAccountId(e.target.value)} required disabled={accounts.length === 0}>
                <option value="" disabled>Selecciona una cuenta</option>
                {accounts.map(acc => (<option key={acc.id} value={acc.id.toString()}>{acc.icon} {acc.name} ({acc.currency})</option>))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="date">Fecha (*):</label>
              <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="categoryId">Categoría (*):</label>
              <select id="categoryId" value={categoryId} onChange={handleCategoryChange} required disabled={!type || categories.length === 0}>
                <option value="" disabled>{categories.length === 0 ? `No hay categorías de ${type}` : 'Selecciona una categoría'}</option>
                {categories.map(cat => (<option key={cat.id} value={cat.id.toString()}>{cat.icon} {cat.name}</option>))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Descripción (*):</label>
            <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} required/>
          </div>
          <div className="form-group">
            <label htmlFor="notes">Notas (Opcional):</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="3"></textarea>
          </div>

          {/* Campos de Cuotas */}
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
                      type="number" id="currentInstallment" value={currentInstallment}
                      onChange={(e) => setCurrentInstallment(e.target.value)}
                      placeholder="Ej: 1" min="1" required={isInstallment}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="totalInstallments">Total de Cuotas (*):</label>
                    <input
                      type="number" id="totalInstallments" value={totalInstallments}
                      onChange={(e) => setTotalInstallments(e.target.value)}
                      placeholder="Ej: 12" min="1" required={isInstallment}
                    />
                  </div>
                </div>
              )}
            </>
          )}
          
          <div className="form-actions">
            <button type="submit" disabled={isSubmitting || loadingForm} className="button-primary">
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button type="button" onClick={() => navigate('/transactions')} className="button-secondary" disabled={isSubmitting || loadingForm}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionPage;