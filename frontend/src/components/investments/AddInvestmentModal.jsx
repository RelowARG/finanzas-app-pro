// Ruta: /frontend/src/components/investments/AddInvestmentModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import investmentsService from '../../services/investments.service';
import marketDataService from '../../services/marketdata.service';
import { formatCurrency } from '../../utils/formatters';
import { alertService } from '../../utils/alert.service';
import './InvestmentModal.css';

const AddInvestmentModal = ({ isOpen, onClose, onInvestmentCreated }) => {
  const [investmentType, setInvestmentType] = useState('acciones');
  const [name, setName] = useState('');
  const [entity, setEntity] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [icon, setIcon] = useState('📊');
  const [notes, setNotes] = useState('');
  const [amountInvested, setAmountInvested] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [ticker, setTicker] = useState('');
  const [autoRenew, setAutoRenew] = useState(false);
  const [renewWithInterest, setRenewWithInterest] = useState(false);
  const [estimatedGain, setEstimatedGain] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const investmentTypeOptions = [
    { value: 'acciones', label: 'CEDEAR', icon: '📊' },
    { value: 'criptomonedas', label: 'Criptomonedas', icon: '₿' },
    { value: 'plazo_fijo', label: 'Plazo Fijo', icon: '📜' },
    { value: 'fci', label: 'Fondo Común de Inversión', icon: '💰' },
    { value: 'obligaciones', label: 'Obligaciones Negociables', icon: '📄' },
    { value: 'otro', label: 'Otra Inversión', icon: '⭐' },
  ];
   const currencyOptions = [
    { value: 'ARS', label: 'ARS - Peso Argentino' },
    { value: 'USD', label: 'USD - Dólar Estadounidense' },
  ];

  const resetForm = useCallback(() => {
    setInvestmentType('acciones');
    setName('');
    setEntity('');
    setCurrency('ARS');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setIcon('📊');
    setNotes('');
    setAmountInvested('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setInterestRate('');
    setQuantity('');
    setPurchasePrice('');
    setTicker('');
    setAutoRenew(false);
    setRenewWithInterest(false);
    setError('');
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
        resetForm();
    }
  }, [isOpen, resetForm]);

  useEffect(() => {
    const selectedType = investmentTypeOptions.find(opt => opt.value === investmentType);
    if (selectedType) setIcon(selectedType.icon);
    
    setSearchKeyword(''); 
    setSearchResults([]); 
    setShowSearchResults(false);
    if(investmentType !== 'acciones' && investmentType !== 'criptomonedas') {
      setTicker('');
      setQuantity('');
      setPurchasePrice('');
    }
    if(investmentType !== 'plazo_fijo') {
      setEndDate('');
      setAutoRenew(false);
      setRenewWithInterest(false);
    }
    if (investmentType !== 'plazo_fijo' && investmentType !== 'fci') {
        setInterestRate('');
    }
    if(investmentType !== 'fci' && investmentType !== 'obligaciones' && investmentType !== 'otro' && investmentType !== 'plazo_fijo') {
        setAmountInvested('');
    }
  }, [investmentType]);
  
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
            setEstimatedGain(0);
            setFinalAmount(0);
        }
    } else {
        setEstimatedGain(0);
        setFinalAmount(0);
    }
  }, [investmentType, amountInvested, interestRate, startDate, endDate]);

  const handleSearchSymbols = useCallback(async () => {
    if (searchKeyword.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const results = await marketDataService.searchSymbols(searchKeyword);
      setSearchResults(results || []);
    } catch (searchError) {
      console.error("Error en búsqueda de símbolos:", searchError);
      setSearchResults([]); 
      setError("Error al buscar símbolos. Intente más tarde.");
    }
    setIsSearching(false);
  }, [searchKeyword]);
  
  useEffect(() => {
    if ((investmentType === 'acciones' || investmentType === 'criptomonedas') && searchKeyword.trim().length > 1) {
      const timerId = setTimeout(() => {
        handleSearchSymbols();
      }, 600);
      return () => clearTimeout(timerId);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchKeyword, investmentType, handleSearchSymbols]);


  const handleSelectSymbol = (selectedSymbol) => {
    setTicker(selectedSymbol.symbol); 
    setName(selectedSymbol.name); 
    setSearchKeyword(selectedSymbol.symbol); 
    setSearchResults([]); 
    setShowSearchResults(false); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    let investmentDataPayload = {
      type: investmentType,
      name: name.trim(),
      entity: entity.trim(),
      currency,
      icon,
      notes: notes.trim(),
    };

    if (!investmentDataPayload.name || !investmentDataPayload.entity) {
        setError('El nombre de la inversión y la entidad/plataforma son requeridos.');
        setIsSubmitting(false); return;
    }

    switch (investmentType) {
      case 'plazo_fijo':
        investmentDataPayload = { 
          ...investmentDataPayload, 
          amountInvested: parseFloat(amountInvested) || 0, 
          startDate: startDate || null, 
          endDate: endDate || null, 
          interestRate: interestRate ? parseFloat(interestRate) : null,
          autoRenew: autoRenew,
          renewWithInterest: autoRenew ? renewWithInterest : false,
        };
        if (!amountInvested || !startDate || !endDate) { 
          setError('Para Plazo Fijo: monto, fecha de inicio y fin son requeridos.'); 
          setIsSubmitting(false); return; 
        }
        break;
      case 'acciones':
      case 'criptomonedas':
        investmentDataPayload = { 
          ...investmentDataPayload, 
          quantity: parseFloat(quantity) || 0, 
          purchasePrice: parseFloat(purchasePrice) || 0, 
          purchaseDate: purchaseDate || null,
          ticker: ticker.trim().toUpperCase(), 
        };
         if (!quantity || !purchasePrice || !purchaseDate || !ticker.trim()) { 
           setError('Para Acciones/Cripto: cantidad, precio de compra, fecha y ticker son requeridos.'); 
           setIsSubmitting(false); return; 
          }
        break;
      case 'fci':
        investmentDataPayload = { 
          ...investmentDataPayload, 
          amountInvested: parseFloat(amountInvested) || 0, 
          purchaseDate: purchaseDate || null,
          interestRate: interestRate ? parseFloat(interestRate) : null,
          startDate: purchaseDate || null, 
        };
        if (!amountInvested || !purchaseDate) { 
          setError(`Para este tipo de inversión, el monto invertido y la fecha de compra son requeridos.`); 
          setIsSubmitting(false); return; 
        }
        break;
      case 'obligaciones': case 'otro':
        investmentDataPayload = { 
          ...investmentDataPayload, 
          amountInvested: parseFloat(amountInvested) || 0, 
          purchaseDate: purchaseDate || null,
        };
        if (!amountInvested || !purchaseDate) { 
          setError(`Para este tipo de inversión, el monto invertido y la fecha de compra son requeridos.`); 
          setIsSubmitting(false); return; 
        }
        break;
      default: 
        setError('Tipo de inversión no reconocido.'); 
        setIsSubmitting(false); return;
    }
    
    try {
      await investmentsService.createInvestment(investmentDataPayload);
      alertService.showSuccessToast('Inversión Creada');
      onInvestmentCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al registrar la inversión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-atm">
      <div className="modal-content-atm investment-modal-content">
        <div className="modal-header-atm">
          <h3>Nueva Inversión</h3>
          <button onClick={onClose} className="close-modal-button-atm">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="transaction-form-atm">
          {error && <p className="error-message small-error-atm">{error}</p>}
          
          <div className="form-group">
            <label htmlFor="investmentType">Tipo de Inversión:</label>
            <select id="investmentType" value={investmentType} onChange={(e) => setInvestmentType(e.target.value)}>
              {investmentTypeOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>))}
            </select>
          </div>

          {(investmentType === 'acciones' || investmentType === 'criptomonedas') && (
            <div className="form-group symbol-search-group">
              <label htmlFor="searchKeyword">Buscar Símbolo (Ticker):</label>
              <div className="search-input-wrapper">
                <input
                  type="text" id="searchKeyword" value={searchKeyword}
                  onChange={(e) => { setSearchKeyword(e.target.value); setShowSearchResults(true); }}
                  placeholder="Ej: GGAL.BA, BTC-USD" autoComplete="off"
                />
              </div>
              {showSearchResults && (searchResults.length > 0 || isSearching || (searchKeyword.length > 1 && !isSearching && searchResults.length === 0)) && (
                <ul className="search-results-list">
                  {isSearching && <li>Buscando...</li>}
                  {!isSearching && searchResults.length === 0 && searchKeyword.length > 1 && <li>No se encontraron coincidencias.</li>}
                  {searchResults.map((result, index) => (
                    <li key={index} onClick={() => handleSelectSymbol(result)}>
                      <strong>{result.symbol}</strong> - {result.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="name">Nombre de la Inversión (*):</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required 
                   placeholder={investmentType === 'acciones' || investmentType === 'criptomonedas' ? "Ej: Apple Inc. (se autocompleta)" : "Ej: Plazo Fijo Banco Nación"}/>
          </div>

          {(investmentType === 'acciones' || investmentType === 'criptomonedas') && (
            <div className="form-group">
              <label htmlFor="ticker">Ticker/Símbolo Confirmado (*):</label>
              <input type="text" id="ticker" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} required 
                     placeholder="Ej: AAPL, BTC-USD"/>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="entity">Entidad/Plataforma/Banco (*):</label>
            <input type="text" id="entity" value={entity} onChange={(e) => setEntity(e.target.value)} required placeholder="Ej: Balanz, Binance, Banco Galicia"/>
          </div>
          
           {(investmentType === 'plazo_fijo' || investmentType === 'fci' || investmentType === 'obligaciones' || investmentType === 'otro') && (
            <div className="form-group">
              <label htmlFor="amountInvested">Monto Invertido/Valor Nominal (*):</label>
              <input type="number" step="0.01" id="amountInvested" value={amountInvested} onChange={(e) => setAmountInvested(e.target.value)} required />
            </div>
          )}

          {(investmentType === 'acciones' || investmentType === 'criptomonedas') && (
            <>
              <div className="form-group">
                <label htmlFor="quantity">Cantidad (*):</label>
                <input type="number" step="any" id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="purchasePrice">Precio de Compra (por unidad) (*):</label>
                <input type="number" step="0.01" id="purchasePrice" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} required />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="currency">Moneda de la Inversión (*):</label>
            <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} required>
              {currencyOptions.map(opt => ( <option key={opt.value} value={opt.value}>{opt.label}</option> ))}
            </select>
          </div>

          {(investmentType === 'acciones' || investmentType === 'criptomonedas' || investmentType === 'fci' || investmentType === 'obligaciones' || investmentType === 'otro') && (
            <div className="form-group">
              <label htmlFor="purchaseDate">{investmentType === 'fci' ? 'Fecha de Compra/Suscripción (Inicio para TNA) (*)' : 'Fecha de Compra/Suscripción (*)'}</label>
              <input type="date" id="purchaseDate" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required={investmentType !== 'plazo_fijo'} />
            </div>
          )}

          {investmentType === 'plazo_fijo' && (
            <>
              <div className="form-group">
                <label htmlFor="startDate">Fecha de Inicio (Constitución) (*):</label>
                <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} required/>
              </div>
              <div className="form-group">
                <label htmlFor="endDate">Fecha de Vencimiento (*):</label>
                <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} required/>
              </div>
            </>
          )}
          
          {(investmentType === 'plazo_fijo' || investmentType === 'fci') && (
            <div className="form-group">
              <label htmlFor="interestRate">Tasa de Interés Anual (TNA %):</label>
              <input type="number" step="0.01" id="interestRate" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="Ej: 30.5"/>
            </div>
          )}

          {investmentType === 'plazo_fijo' && finalAmount > 0 && (
            <div className="form-section read-only-section">
              <h4>Estimación de Rendimiento</h4>
              <div className="detail-grid">
                <div className="detail-grid-item"><span className="label">Ganancia Estimada:</span><span className="value profit-positive">{formatCurrency(estimatedGain, currency)}</span></div>
                <div className="detail-grid-item"><span className="label">Monto Final a Recibir:</span><span className="value">{formatCurrency(finalAmount, currency)}</span></div>
              </div>
            </div>
          )}
          
          {investmentType === 'plazo_fijo' && (
            <div className="form-section">
              <h4>Opciones de Renovación Automática</h4>
              <div className="form-group"><label htmlFor="autoRenew" className="checkbox-label"><input type="checkbox" id="autoRenew" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} />Renovar automáticamente al finalizar</label></div>
              {autoRenew && (<div className="form-group renewal-options"><label>¿Qué deseas renovar?</label><div className="radio-group"><label htmlFor="renewCapital"><input type="radio" id="renewCapital" name="renewalType" value="capital" checked={!renewWithInterest} onChange={() => setRenewWithInterest(false)} />Renovar solo el capital inicial</label><label htmlFor="renewAll"><input type="radio" id="renewAll" name="renewalType" value="all" checked={renewWithInterest} onChange={() => setRenewWithInterest(true)} />Renovar capital + intereses generados</label></div></div>)}
            </div>
          )}
          
          <div className="form-group"><label htmlFor="icon">Ícono (Emoji):</label><input type="text" id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength="2" style={{width: '80px', textAlign: 'center', fontSize: '1.5rem'}}/></div>
          <div className="form-group"><label htmlFor="notes">Notas (Opcional):</label><textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" placeholder="Detalles adicionales..."></textarea></div>

          <div className="modal-actions-atm">
            <button type="button" onClick={onClose} className="button button-secondary" disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="button button-primary" disabled={isSubmitting || isSearching}>{isSubmitting ? 'Guardando...' : 'Crear Inversión'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInvestmentModal;