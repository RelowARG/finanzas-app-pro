// Ruta: finanzas-app-pro/frontend/src/components/transactions/TransactionFilter.jsx
// ARCHIVO NUEVO
import React, { useState, useEffect } from 'react';
import accountService from '../../services/accounts.service'; // Para obtener lista de cuentas
import './TransactionFilter.css';

// Asumimos que tendrás un categories.service.js en el futuro
const mockCategories = ['Sueldo', 'Supermercado', 'Transporte', 'Varios', 'Intereses', 'Restaurantes', 'Servicios', 'Kiosco', 'Salud', 'Educación', 'Regalos'];

const TransactionFilter = ({ onFilterChange, initialFilters }) => {
  const [filters, setFilters] = useState(initialFilters || {
    type: '', // 'ingreso', 'egreso', o '' para todos
    accountId: '',
    categoryId: '', // Usaremos nombres de categoría por ahora
    dateFrom: '',
    dateTo: '',
    searchTerm: '',
  });
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    // Cargar cuentas para el selector
    accountService.getAllAccounts()
      .then(data => setAccounts(data))
      .catch(err => console.error("Error cargando cuentas para filtro:", err));
  }, []);

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
        <div className="filter-group">
          <label htmlFor="categoryId">Categoría:</label>
          <select id="categoryId" name="categoryId" value={filters.categoryId} onChange={handleChange}>
            <option value="">Todas</option>
            {mockCategories.sort().map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
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