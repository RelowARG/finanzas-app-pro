// Ruta: finanzas-app-pro/frontend/src/pages/AddInvestmentPage.jsx
// REVISADO Y AJUSTADO PARA BÚSQUEDA DE SÍMBOLOS CON YAHOO FINANCE
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import investmentsService from '../services/investments.service';
import marketDataService from '../services/marketdata.service';
import './AddInvestmentPage.css'; // Asegúrate que este CSS exista y esté bien

const AddInvestmentPage = () => {
  const navigate = useNavigate();

  const [investmentType, setInvestmentType] = useState('acciones');
  const [name, setName] = useState('');
  const [entity, setEntity] = useState(''); // Banco, Broker, Exchange
  const [currency, setCurrency] = useState('ARS'); // Moneda de la inversión
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [icon, setIcon] = useState('📊');
  const [notes, setNotes] = useState('');
  
  // Campos para Plazo Fijo
  const [amountInvested, setAmountInvested] = useState(''); // También para FCI, ON, Otro
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [interestRate, setInterestRate] = useState(''); // TNA %

  // Campos para Acciones / Criptomonedas
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(''); // Precio por unidad
  const [ticker, setTicker] = useState(''); // Símbolo/Ticker

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para la búsqueda de símbolos
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
    // Podrías añadir más monedas si es necesario
  ];
  
  // Actualizar icono por defecto al cambiar tipo de inversión
  useEffect(() => {
    const selectedType = investmentTypeOptions.find(opt => opt.value === investmentType);
    if (selectedType) setIcon(selectedType.icon);
    
    // Limpiar campos específicos del tipo anterior al cambiar
    setSearchKeyword(''); 
    setSearchResults([]); 
    setShowSearchResults(false);
    if(investmentType !== 'acciones' && investmentType !== 'criptomonedas') {
      setTicker('');
      setQuantity('');
      setPurchasePrice('');
    }
    if(investmentType !== 'plazo_fijo') {
      // setStartDate(new Date().toISOString().split('T')[0]); // Podría mantenerse o resetearse
      setEndDate('');
      setInterestRate('');
    }
    if(investmentType !== 'fci' && investmentType !== 'obligaciones' && investmentType !== 'otro' && investmentType !== 'plazo_fijo') {
        setAmountInvested('');
    }

  }, [investmentType]);

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
  
  // Debounce para la búsqueda automática
  useEffect(() => {
    if ((investmentType === 'acciones' || investmentType === 'criptomonedas') && searchKeyword.trim().length > 1) {
      const timerId = setTimeout(() => {
        handleSearchSymbols();
      }, 600); // Esperar 600ms
      return () => clearTimeout(timerId);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchKeyword, investmentType, handleSearchSymbols]);


  const handleSelectSymbol = (selectedSymbol) => {
    setTicker(selectedSymbol.symbol); 
    setName(selectedSymbol.name); 
    // Yahoo search a veces no devuelve la moneda o devuelve 'N/A'.
    // Es mejor que el usuario seleccione la moneda de la inversión.
    // Si se quisiera usar la moneda del resultado (con precaución):
    // if (selectedSymbol.currency && selectedSymbol.currency !== 'N/A') {
    //   setCurrency(selectedSymbol.currency);
    // }
    setSearchKeyword(selectedSymbol.symbol); 
    setSearchResults([]); 
    setShowSearchResults(false); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let investmentDataPayload = {
      type: investmentType,
      name: name.trim(),
      entity: entity.trim(),
      currency,
      icon,
      notes: notes.trim(),
      // purchaseDate se añade abajo según el tipo
    };

    if (!investmentDataPayload.name || !investmentDataPayload.entity) {
        setError('El nombre de la inversión y la entidad/plataforma son requeridos.');
        setLoading(false); return;
    }

    switch (investmentType) {
      case 'plazo_fijo':
        investmentDataPayload = { 
          ...investmentDataPayload, 
          amountInvested: parseFloat(amountInvested) || 0, 
          startDate: startDate || null, 
          endDate: endDate || null, 
          interestRate: interestRate ? parseFloat(interestRate) : null, 
        };
        if (!amountInvested || !startDate || !endDate) { 
          setError('Para Plazo Fijo: monto, fecha de inicio y fin son requeridos.'); 
          setLoading(false); return; 
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
           setLoading(false); return; 
          }
        break;
      case 'fci': case 'obligaciones': case 'otro':
        investmentDataPayload = { 
          ...investmentDataPayload, 
          amountInvested: parseFloat(amountInvested) || 0, 
          purchaseDate: purchaseDate || null,
        };
        if (!amountInvested || !purchaseDate) { 
          setError(`Para este tipo de inversión, el monto invertido y la fecha de compra son requeridos.`); 
          setLoading(false); return; 
        }
        break;
      default: 
        setError('Tipo de inversión no reconocido.'); 
        setLoading(false); return;
    }
    
    try {
      await investmentsService.createInvestment(investmentDataPayload);
      navigate('/investments');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al registrar la inversión.');
      console.error("Error creating investment:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container add-investment-page">
      <div className="form-container" style={{maxWidth: '750px'}}>
        <h2>Registrar Nueva Inversión</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}

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
                  type="text"
                  id="searchKeyword"
                  value={searchKeyword}
                  onChange={(e) => { setSearchKeyword(e.target.value); setShowSearchResults(true); }}
                  placeholder="Ej: GGAL.BA, PAMP.BA, BTC-USD, ETH-ARS"
                  autoComplete="off"
                />
              </div>
              {showSearchResults && (searchResults.length > 0 || isSearching || (searchKeyword.length > 1 && !isSearching && searchResults.length ===0) ) && (
                <ul className="search-results-list">
                  {isSearching && <li>Buscando...</li>}
                  {!isSearching && searchResults.length === 0 && searchKeyword.length > 1 && <li>No se encontraron coincidencias.</li>}
                  {searchResults.map((result, index) => (
                    <li key={index} onClick={() => handleSelectSymbol(result)}>
                      <strong>{result.symbol}</strong> - {result.name} 
                      {result.type && result.type !== 'N/A' ? ` (${result.type})` : ''}
                      {result.region && result.region !== 'N/A' ? ` [${result.region}]` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="name">Nombre de la Inversión (*):</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required 
                   placeholder={investmentType === 'acciones' || investmentType === 'criptomonedas' ? "Ej: Apple Inc., Bitcoin (se autocompleta al buscar)" : "Ej: Plazo Fijo Banco Nación Mayo"}/>
          </div>

          {(investmentType === 'acciones' || investmentType === 'criptomonedas') && (
            <div className="form-group">
              <label htmlFor="ticker">Ticker/Símbolo Confirmado (*):</label>
              <input type="text" id="ticker" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} required 
                     placeholder="Ej: AAPL, BTC-USD (autocompletado o manual)"/>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="entity">Entidad/Plataforma/Banco (*):</label>
            <input type="text" id="entity" value={entity} onChange={(e) => setEntity(e.target.value)} required placeholder="Ej: Balanz, Binance, Banco Galicia"/>
          </div>
          
           {(investmentType === 'plazo_fijo' || investmentType === 'fci' || investmentType === 'obligaciones' || investmentType === 'otro') && (
            <div className="form-group">
              <label htmlFor="amountInvested">Monto Invertido/Valor Nominal (*):</label>
              <input type="number" step="0.01" id="amountInvested" value={amountInvested} onChange={(e) => setAmountInvested(e.target.value)} required={investmentType !== 'acciones' && investmentType !== 'criptomonedas'} />
            </div>
          )}

          {(investmentType === 'acciones' || investmentType === 'criptomonedas') && (
            <>
              <div className="form-group">
                <label htmlFor="quantity">Cantidad (*):</label>
                <input type="number" step="any" id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} required={investmentType === 'acciones' || investmentType === 'criptomonedas'} />
              </div>
              <div className="form-group">
                <label htmlFor="purchasePrice">Precio de Compra (por unidad) (*):</label>
                <input type="number" step="0.01" id="purchasePrice" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} required={investmentType === 'acciones' || investmentType === 'criptomonedas'} />
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
              <label htmlFor="purchaseDate">Fecha de Compra/Suscripción (*):</label>
              <input type="date" id="purchaseDate" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required={investmentType !== 'plazo_fijo'} />
            </div>
          )}

          {investmentType === 'plazo_fijo' && (
            <>
              <div className="form-group">
                <label htmlFor="startDate">Fecha de Inicio (Constitución) (*):</label>
                <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} required={investmentType === 'plazo_fijo'}/>
              </div>
              <div className="form-group">
                <label htmlFor="endDate">Fecha de Vencimiento (*):</label>
                <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} required={investmentType === 'plazo_fijo'}/>
              </div>
              <div className="form-group">
                <label htmlFor="interestRate">Tasa de Interés Anual (TNA %):</label>
                <input type="number" step="0.01" id="interestRate" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="Ej: 30.5"/>
              </div>
            </>
          )}
          
          <div className="form-group">
            <label htmlFor="icon">Ícono (Emoji):</label>
            <input type="text" id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength="2" style={{width: '80px', textAlign: 'center', fontSize: '1.5rem'}}/>
          </div>
          <div className="form-group">
            <label htmlFor="notes">Notas (Opcional):</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" placeholder="Detalles adicionales, CUIT de la ON, etc."></textarea>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading || isSearching} className="button-primary">
              {loading ? 'Registrando...' : 'Registrar Inversión'}
            </button>
            <button type="button" onClick={() => navigate('/investments')} className="button-secondary" disabled={loading || isSearching}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInvestmentPage;