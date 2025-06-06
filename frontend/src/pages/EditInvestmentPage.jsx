// Ruta: finanzas-app-pro/frontend/src/pages/EditInvestmentPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import investmentsService from '../services/investments.service';
import { formatCurrency } from '../utils/formatters';
import './AddInvestmentPage.css';

const EditInvestmentPage = () => {
  const navigate = useNavigate();
  const { investmentId } = useParams();

  const [investmentType, setInvestmentType] = useState('');
  const [name, setName] = useState('');
  const [entity, setEntity] = useState('');
  const [amountInvested, setAmountInvested] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [icon, setIcon] = useState('');
  const [notes, setNotes] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [ticker, setTicker] = useState('');
  const [autoRenew, setAutoRenew] = useState(false);
  const [renewWithInterest, setRenewWithInterest] = useState(false);
  const [estimatedGain, setEstimatedGain] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const investmentTypeOptions = [
    { value: 'plazo_fijo', label: 'Plazo Fijo', icon: '📜' },
    { value: 'acciones', label: 'CEDEAR', icon: '📊' },
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
    setAutoRenew(invData.autoRenew || false);
    setRenewWithInterest(invData.renewWithInterest || false);
    
    setStartDate(''); setEndDate(''); setPurchaseDate('');
    setInterestRate(''); setQuantity(''); setPurchasePrice('');
    setCurrentPrice(''); setTicker(''); setAmountInvested('');

    if (invData.type === 'plazo_fijo') {
      setAmountInvested(invData.amountInvested !== null ? invData.amountInvested.toString() : (invData.initialInvestment !== null ? invData.initialInvestment.toString() : ''));
      setStartDate(invData.startDate ? invData.startDate.split('T')[0] : '');
      setEndDate(invData.endDate ? invData.endDate.split('T')[0] : '');
      setInterestRate(invData.interestRate !== null ? invData.interestRate.toString() : '');
    } else if (invData.type === 'acciones' || invData.type === 'criptomonedas') {
      setQuantity(invData.quantity !== null ? invData.quantity.toString() : '');
      setPurchasePrice(invData.purchasePrice !== null ? invData.purchasePrice.toString() : '');
      setTicker(invData.ticker || '');
      setPurchaseDate(invData.purchaseDate ? invData.purchaseDate.split('T')[0] : '');
      setCurrentPrice(invData.currentPrice !== null ? invData.currentPrice.toString() : '');
    } else {
      setAmountInvested(invData.amountInvested !== null ? invData.amountInvested.toString() : (invData.initialInvestment !== null ? invData.initialInvestment.toString() : ''));
      setPurchaseDate(invData.purchaseDate ? invData.purchaseDate.split('T')[0] : '');
      if (invData.type === 'fci') {
         setInterestRate(invData.interestRate !== null ? invData.interestRate.toString() : '');
      }
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
      } finally {
        setLoading(false);
      }
    };
    if (investmentId) {
      fetchInvestmentData();
    }
  }, [investmentId, navigate, populateForm]);

  useEffect(() => {
    if (investmentType === 'plazo_fijo' && amountInvested && interestRate && startDate && endDate) {
      const principal = parseFloat(amountInvested);
      const tna = parseFloat(interestRate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(principal) && !isNaN(tna) && start <= end) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const dailyRate = (tna / 100) / 365;
        const totalInterest = principal * dailyRate * diffDays;
        setEstimatedGain(totalInterest);
        setFinalAmount(principal + totalInterest);
      } else {
        setEstimatedGain(0); setFinalAmount(0);
      }
    } else {
      setEstimatedGain(0); setFinalAmount(0);
    }
  }, [investmentType, amountInvested, interestRate, startDate, endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    let investmentDataPayload = {
      name: name.trim(), entity: entity.trim(),
      currency, icon, notes: notes.trim(),
      currentValue: currentValue !== '' ? parseFloat(currentValue) : null,
    };
    if (!investmentDataPayload.name || !investmentDataPayload.entity) {
        setError('El nombre de la inversión y la entidad son requeridos.');
        setIsSubmitting(false); return;
    }
    switch (investmentType) {
      case 'plazo_fijo':
        investmentDataPayload = {
          ...investmentDataPayload, amountInvested: parseFloat(amountInvested) || 0,
          startDate, endDate,
          interestRate: interestRate ? parseFloat(interestRate) : null,
          autoRenew, renewWithInterest: autoRenew ? renewWithInterest : false,
        };
        break;
      case 'acciones': case 'criptomonedas':
        investmentDataPayload = {
          ...investmentDataPayload, quantity: parseFloat(quantity) || 0,
          purchasePrice: parseFloat(purchasePrice) || 0, purchaseDate,
          ticker: ticker.trim().toUpperCase(),
          currentPrice: currentPrice !== '' ? parseFloat(currentPrice) : null,
        };
        break;
      case 'fci':
        investmentDataPayload = {
          ...investmentDataPayload, amountInvested: parseFloat(amountInvested) || 0,
          purchaseDate, interestRate: interestRate ? parseFloat(interestRate) : null,
        };
        break;
      case 'obligaciones': case 'otro':
        investmentDataPayload = {
          ...investmentDataPayload, amountInvested: parseFloat(amountInvested) || 0, purchaseDate,
        };
        break;
      default:
        setError('Tipo de inversión no reconocido.');
        setIsSubmitting(false); return;
    }
    try {
      await investmentsService.updateInvestment(investmentId, investmentDataPayload);
      navigate('/investments');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar la inversión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-container"><p className="loading-text">Cargando datos...</p></div>;
  }
  if (error && !name) {
    return <div className="page-container"><p className="error-message">{error}</p></div>;
  }

  return (
    <div className="page-container add-investment-page">
      <div className="form-container" style={{maxWidth: '750px'}}>
        <h2>Editar Inversión: {name}</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}
          
          <div className="form-group">
            <label>Tipo de Inversión (No editable)</label>
            <input type="text" value={`${investmentTypeOptions.find(opt => opt.value === investmentType)?.icon || ''} ${investmentTypeOptions.find(opt => opt.value === investmentType)?.label || 'Desconocido'}`} disabled style={{backgroundColor: '#e9ecef'}}/>
          </div>
          
          <div className="form-group"><label htmlFor="name">Nombre (*):</label><input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="form-group"><label htmlFor="entity">Entidad (*):</label><input type="text" id="entity" value={entity} onChange={(e) => setEntity(e.target.value)} required /></div>
          
          {(investmentType === 'plazo_fijo' || investmentType === 'fci' || investmentType === 'obligaciones' || investmentType === 'otro') && (
            <div className="form-group"><label htmlFor="amountInvested">Monto Invertido:</label><input type="number" step="0.01" id="amountInvested" value={amountInvested} onChange={(e) => setAmountInvested(e.target.value)} /></div>
          )}
          {(investmentType === 'acciones' || investmentType === 'criptomonedas') && (
            <><div className="form-group"><label htmlFor="ticker">Ticker:</label><input type="text" id="ticker" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} /></div><div className="form-group"><label htmlFor="quantity">Cantidad:</label><input type="number" step="any" id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div><div className="form-group"><label htmlFor="purchasePrice">Precio Compra:</label><input type="number" step="0.01" id="purchasePrice" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} /></div><div className="form-group"><label htmlFor="currentPrice">Precio Actual:</label><input type="number" step="0.01" id="currentPrice" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} /></div></>
          )}

          <div className="form-group"><label htmlFor="currency">Moneda:</label><select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>{currencyOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select></div>
          
          {(investmentType === 'acciones' || investmentType === 'criptomonedas' || investmentType === 'fci' || investmentType === 'obligaciones' || investmentType === 'otro') && (<div className="form-group"><label htmlFor="purchaseDate">Fecha Compra:</label><input type="date" id="purchaseDate" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} /></div>)}
          
          {(investmentType === 'plazo_fijo' || investmentType === 'fci') && (
            <>
              {investmentType === 'plazo_fijo' && (<><div className="form-group"><label htmlFor="startDate">Fecha Inicio:</label><input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div><div className="form-group"><label htmlFor="endDate">Fecha Fin:</label><input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div></>)}
              <div className="form-group"><label htmlFor="interestRate">TNA (%):</label><input type="number" step="0.01" id="interestRate" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} /></div>
            </>
          )}

          {investmentType === 'plazo_fijo' && finalAmount > 0 && (<div className="form-section read-only-section"><h4>Estimación</h4><div className="detail-grid"><div className="detail-grid-item"><span className="label">Ganancia Estimada:</span><span className="value profit-positive">{formatCurrency(estimatedGain, currency)}</span></div><div className="detail-grid-item"><span className="label">Monto Final:</span><span className="value">{formatCurrency(finalAmount, currency)}</span></div></div></div>)}
          {investmentType === 'plazo_fijo' && (<div className="form-section"><h4>Renovación</h4><div className="form-group"><label htmlFor="autoRenew" className="checkbox-label"><input type="checkbox" id="autoRenew" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} />Renovar automáticamente</label></div>{autoRenew && (<div className="form-group renewal-options"><label>Opciones:</label><div className="radio-group"><label htmlFor="renewCapital"><input type="radio" id="renewCapital" name="renewalType" value="capital" checked={!renewWithInterest} onChange={() => setRenewWithInterest(false)} />Solo capital</label><label htmlFor="renewAll"><input type="radio" id="renewAll" name="renewalType" value="all" checked={renewWithInterest} onChange={() => setRenewWithInterest(true)} />Capital + intereses</label></div></div>)}</div>)}

          <div className="form-group"><label htmlFor="currentValue">Valor Actual Total:</label><input type="number" step="0.01" id="currentValue" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} /></div>
          <div className="form-group"><label htmlFor="icon">Ícono:</label><input type="text" id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength="2" style={{width: '80px', textAlign: 'center', fontSize: '1.5rem'}}/></div>
          <div className="form-group"><label htmlFor="notes">Notas:</label><textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="3"></textarea></div>

          <div className="form-actions"><button type="submit" disabled={isSubmitting || loading} className="button-primary">{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</button><button type="button" onClick={() => navigate('/investments')} className="button-secondary" disabled={isSubmitting || loading}>Cancelar</button></div>
        </form>
      </div>
    </div>
  );
};

export default EditInvestmentPage;