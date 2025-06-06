import React, { useState, useEffect } from 'react';
import accountService from '../../services/accounts.service';
import categoriesService from '../../services/categories.service'; // <<< AÑADIDO: Importar servicio de categorías
import './TransactionFilter.css';

const TransactionFilter = ({ onFilterChange, initialFilters }) => {
  const [filters, setFilters] = useState(initialFilters || {
    type: '',
    accountId: '',
    categoryId: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: '',
  });

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]); // <<< AÑADIDO: Estado para categorías reales

  useEffect(() => {
    // Cargar cuentas y categorías cuando el componente se monta
    const loadFilterData = async () => {
        try {
            const [accData, catData] = await Promise.all([
                accountService.getAllAccounts(),
                categoriesService.getAllCategories() // <<< AÑADIDO: Llamada al servicio real
            ]);

            setAccounts(accData || []);

            // Combinar categorías de ingreso y egreso en una sola lista para el filtro
            const allCategories = [
                ...(catData.ingreso || []),
                ...(catData.egreso || [])
            ].sort((a, b) => a.name.localeCompare(b.name)); // Ordenar alfabéticamente
            setCategories(allCategories);

        } catch (err) {
            console.error("Error cargando datos para los filtros:", err);
        }
    };
    
    loadFilterData();
  }, []);

  useEffect(() => {
    // Sincronizar el estado del filtro si los filtros iniciales cambian desde la URL
    setFilters(initialFilters);
  }, [initialFilters]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange(filters);
  };

  const handleReset = () => {
    const resetFilters = { type: '', accountId: '', categoryId: '', dateFrom: '', dateTo: '', searchTerm: '' };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  }

  return (
    <form className="transaction-filter-form" onSubmit={handleSubmit}>
      <div className="filter-grid">
        <div className="filter-group">
          <label htmlFor="searchTerm">Buscar:</label>
          <input
            type="text"
            id="searchTerm"
            name="searchTerm"
            placeholder="Descripción..."
            value={filters.searchTerm}
            onChange={handleChange}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="type">Tipo:</label>
          <select id="type" name="type" value={filters.type} onChange={handleChange}>
            <option value="">Todos</option>
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="accountId">Cuenta:</label>
          <select id="accountId" name="accountId" value={filters.accountId} onChange={handleChange}>
            <option value="">Todas</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>
        {/* *** INICIO: SELECT DE CATEGORÍAS CORREGIDO *** */}
        <div className="filter-group">
          <label htmlFor="categoryId">Categoría:</label>
          <select id="categoryId" name="categoryId" value={filters.categoryId} onChange={handleChange}>
            <option value="">Todas</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        {/* *** FIN: SELECT DE CATEGORÍAS CORREGIDO *** */}
        <div className="filter-group">
          <label htmlFor="dateFrom">Desde:</label>
          <input type="date" id="dateFrom" name="dateFrom" value={filters.dateFrom} onChange={handleChange} />
        </div>
        <div className="filter-group">
          <label htmlFor="dateTo">Hasta:</label>
          <input type="date" id="dateTo" name="dateTo" value={filters.dateTo} onChange={handleChange} />
        </div>
      </div>
      <div className="filter-actions">
        <button type="submit" className="button button-primary">Aplicar Filtros</button>
        <button type="button" onClick={handleReset} className="button button-secondary">Limpiar Filtros</button>
      </div>
    </form>
  );
};

export default TransactionFilter;