// Ruta: finanzas-app-pro/frontend/src/pages/EditInvestmentPage.jsx
// ARCHIVO NUEVO
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import investmentsService from '../services/investments.service';
import './AddInvestmentPage.css'; // Reutilizamos estilos de AddInvestmentPage por similitud

const EditInvestmentPage = () => {
  const navigate = useNavigate();
  const { investmentId } = useParams();

  const [investmentType, setInvestmentType] = useState(''); // Se cargará de la inversión
  const [name, setName] = useState('');
  const [entity, setEntity] = useState('');
  const [amountInvested, setAmountInvested] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [icon, setIcon] = useState('');
  const [notes, setNotes] = useState('');
  const [currentValue, setCurrentValue] = useState(''); // Para actualizar valor actual

  // Campos específicos para Plazo Fijo
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [interestRate, setInterestRate] = useState('');
  
  // Campos específicos para Acciones/Cripto
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState(''); // Para actualizar precio actual de acciones/cripto
  const [ticker, setTicker] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // Inicia en true para cargar datos
  const [isSubmitting, setIsSubmitting] = useState(false);

  const investmentTypeOptions = [
    { value: 'plazo_fijo', label: 'Plazo Fijo', icon: '📜' },
    { value: 'acciones', label: 'Acciones', icon: '📊' },
    { value: 'criptomonedas', label: 'Criptomonedas', icon: '₿' },
    { value: 'fci', label: 'Fondo Común de Inversión', icon: '💰' },
    { value: 'obligaciones', label: 'Obligaciones Negociables', icon: '📄' },
    { value: 'otro', label: 'Otra Inversión', icon: '⭐' },
  ];

  const currencyOptions = [
    { value: 'ARS', label: 'ARS - Peso Argentino' },
    { value: 'USD', label: 'USD - Dólar Estadounidense' },
  ];

  const populateForm = useCallback((invData) => {
    setInvestmentType(invData.type || 'otro');
    setName(invData.name || '');
    setEntity(invData.entity || '');
    setCurrency(invData.currency || 'ARS');
    setIcon(invData.icon || '⭐');
    setNotes(invData.notes || '');
    setCurrentValue(invData.currentValue !== null && invData.currentValue !== undefined ? invData.currentValue.toString() : '');
    
    // El backend ahora tiene initialInvestment, pero el formulario usa amountInvested para PF/FCI
    // y quantity/purchasePrice para acciones/cripto.
    // El backend también tiene amountInvested para FCI/Obligaciones/Otro.

    if (invData.type === 'plazo_fijo') {
      setAmountInvested(invData.amountInvested !== null ? invData.amountInvested.toString() : (invData.initialInvestment !== null ? invData.initialInvestment.toString() : ''));
      setStartDate(invData.startDate ? invData.startDate.split('T')[0] : '');
      setEndDate(invData.endDate ? invData.endDate.split('T')[0] : '');
      setInterestRate(invData.interestRate !== null ? invData.interestRate.toString() : '');
      setPurchaseDate(''); // No aplica directamente a PF en este formulario
    } else if (invData.type === 'acciones' || invData.type === 'criptomonedas') {
      setQuantity(invData.quantity !== null ? invData.quantity.toString() : '');
      setPurchasePrice(invData.purchasePrice !== null ? invData.purchasePrice.toString() : '');
      setTicker(invData.ticker || '');
      setPurchaseDate(invData.purchaseDate ? invData.purchaseDate.split('T')[0] : '');
      setCurrentPrice(invData.currentPrice !== null ? invData.currentPrice.toString() : '');
      setAmountInvested(''); // No se usa directamente para estos tipos en el form
    } else { // FCI, Obligaciones, Otro
      setAmountInvested(invData.amountInvested !== null ? invData.amountInvested.toString() : (invData.initialInvestment !== null ? invData.initialInvestment.toString() : ''));
      setPurchaseDate(invData.purchaseDate ? invData.purchaseDate.split('T')[0] : '');
    }
  }, []);


  useEffect(() => {
    const fetchInvestmentData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await investmentsService.getInvestmentById(investmentId);
        if (data) {
          populateForm(data);
        } else {
          setError('Inversión no encontrada.');
          navigate('/investments');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error al cargar la inversión.');
        console.error("Error fetching investment for edit:", err);
        // navigate('/investments'); // Podría ser muy abrupto si es un error temporal
      } finally {
        setLoading(false);
      }
    };
    if (investmentId) {
      fetchInvestmentData();
    }
  }, [investmentId, navigate, populateForm]);

  // Actualizar icono por defecto al cambiar tipo (si el tipo se pudiera cambiar en edición)
  // Por ahora, el tipo no se edita una vez creado para simplificar.
  // Si se permitiera, este useEffect debería estar activo.
  /*
  useEffect(() => {
    if (!loading) { // No durante la carga inicial
        const selectedTypeOpt = investmentTypeOptions.find(opt => opt.value === investmentType);
        if (selectedTypeOpt) {
        setIcon(selectedTypeOpt.icon);
        }
    }
  }, [investmentType, loading]);
  */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    let investmentDataPayload = {
      // type: investmentType, // No se permite cambiar el tipo en la edición
      name: name.trim(),
      entity: entity.trim(),
      currency,
      icon,
      notes: notes.trim(),
      currentValue: currentValue !== '' ? parseFloat(currentValue) : null, // Permitir actualizar valor actual
    };

    if (!investmentDataPayload.name || !investmentDataPayload.entity) {
        setError('El nombre de la inversión y la entidad son requeridos.');
        setIsSubmitting(false);
        return;
    }

    switch (investmentType) {
      case 'plazo_fijo':
        investmentDataPayload = {
          ...investmentDataPayload,
          amountInvested: parseFloat(amountInvested) || 0,
          startDate,
          endDate,
          interestRate: interestRate ? parseFloat(interestRate) : null,
        };
        if (!amountInvested || !startDate || !endDate) {
            setError('Para Plazo Fijo, el monto, fecha de inicio y fin son requeridos.');
            setIsSubmitting(false);
            return;
        }
        break;
      case 'acciones':
      case 'criptomonedas':
        investmentDataPayload = {
          ...investmentDataPayload,
          quantity: parseFloat(quantity) || 0,
          purchasePrice: parseFloat(purchasePrice) || 0,
          purchaseDate,
          ticker: ticker.trim().toUpperCase(),
          currentPrice: currentPrice !== '' ? parseFloat(currentPrice) : null, // Permitir actualizar precio actual
        };
         if (!quantity || !purchasePrice || !purchaseDate || !ticker.trim()) {
            setError('Para Acciones/Cripto, cantidad, precio de compra, fecha y ticker son requeridos.');
            setIsSubmitting(false);
            return;
        }
        break;
      case 'fci':
      case 'obligaciones':
      case 'otro':
        investmentDataPayload = {
          ...investmentDataPayload,
          amountInvested: parseFloat(amountInvested) || 0,
          purchaseDate,
        };
        if (!amountInvested || !purchaseDate) {
            setError(`Para ${investmentTypeOptions.find(o=>o.value === investmentType)?.label || 'este tipo'}, el monto invertido y fecha de compra son requeridos.`);
            setIsSubmitting(false);
            return;
        }
        break;
      default: // No debería llegar aquí si el tipo no se puede cambiar
        setError('Tipo de inversión no reconocido para la actualización.');
        setIsSubmitting(false);
        return;
    }
    
    try {
      await investmentsService.updateInvestment(investmentId, investmentDataPayload);
      navigate('/investments');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar la inversión.');
      console.error("Error updating investment:", err.response?.data || err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className="page-container"><p className="loading-text">Cargando datos de la inversión...</p></div>;
  }
  if (error && !name) { // Si hubo un error grave al cargar y no tenemos datos
    return <div className="page-container"><p className="error-message">{error}</p> <Link to="/investments" className="button">Volver</Link> </div>;
  }


  return (
    <div className="page-container add-investment-page"> {/* Reutiliza la clase y estilos */}
      <div className="form-container" style={{maxWidth: '750px'}}>
        <h2>Editar Inversión: {name}</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}

          <div className="form-group">
            <label htmlFor="investmentTypeDisplay">Tipo de Inversión:</label>
            {/* El tipo no se edita, solo se muestra */}
            <input 
                type="text" 
                id="investmentTypeDisplay" 
                value={`${investmentTypeOptions.find(opt => opt.value === investmentType)?.icon || ''} ${investmentTypeOptions.find(opt => opt.value === investmentType)?.label || 'Desconocido'}`} 
                disabled 
                style={{backgroundColor: '#e9ecef', cursor: 'not-allowed'}}
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Nombre de la Inversión:</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="entity">Entidad/Plataforma/Banco:</label>
            <input type="text" id="entity" value={entity} onChange={(e) => setEntity(e.target.value)} required />
          </div>
          
          {/* Campos condicionales */}
          {(investmentType === 'plazo_fijo' || investmentType === 'fci' || investmentType === 'obligaciones' || investmentType === 'otro') && (
            <div className="form-group">
              <label htmlFor="amountInvested">Monto Invertido/Valor Nominal:</label>
              <input type="number" step="0.01" id="amountInvested" value={amountInvested} onChange={(e) => setAmountInvested(e.target.value)} />
            </div>
          )}

          {(investmentType === 'acciones' || investmentType === 'criptomonedas') && (
            <>
              <div className="form-group">
                <label htmlFor="ticker">Ticker/Símbolo:</label>
                <input type="text" id="ticker" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} />
              </div>
              <div className="form-group">
                <label htmlFor="quantity">Cantidad:</label>
                <input type="number" step="any" id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="purchasePrice">Precio de Compra (por unidad):</label>
                <input type="number" step="0.01" id="purchasePrice" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="currentPrice">Precio Actual (por unidad - Opcional):</label>
                <input type="number" step="0.01" id="currentPrice" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} placeholder="Dejar vacío para no cambiar"/>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="currency">Moneda:</label>
            <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {currencyOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {(investmentType === 'acciones' || investmentType === 'criptomonedas' || investmentType === 'fci' || investmentType === 'obligaciones' || investmentType === 'otro') && (
            <div className="form-group">
              <label htmlFor="purchaseDate">Fecha de Compra/Suscripción:</label>
              <input type="date" id="purchaseDate" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
          )}

          {investmentType === 'plazo_fijo' && (
            <>
              <div className="form-group">
                <label htmlFor="startDate">Fecha de Inicio (Constitución):</label>
                <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="endDate">Fecha de Vencimiento:</label>
                <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="interestRate">Tasa de Interés Anual (TNA %):</label>
                <input type="number" step="0.01" id="interestRate" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="currentValue">Valor Actual Total (Opcional):</label>
            <input type="number" step="0.01" id="currentValue" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} placeholder="Dejar vacío si se calcula por precio/cantidad"/>
          </div>
          
          <div className="form-group">
            <label htmlFor="icon">Ícono (Emoji):</label>
            <input type="text" id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength="2" style={{width: '80px', textAlign: 'center', fontSize: '1.5rem'}}/>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notas (Opcional):</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="3"></textarea>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={isSubmitting || loading} className="button-primary">
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button type="button" onClick={() => navigate('/investments')} className="button-secondary" disabled={isSubmitting || loading}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditInvestmentPage;
