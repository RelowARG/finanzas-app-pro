// Ruta: finanzas-app-pro/frontend/src/components/categories/CategoryForm.jsx
// ARCHIVO NUEVO
import React, { useState, useEffect } from 'react';
import categoriesService from '../../services/categories.service';
import './CategoryForm.css';

const CategoryForm = ({ onCategorySaved, existingCategory, onCancel }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('egreso'); // Por defecto, los usuarios suelen crear más de egreso
  const [icon, setIcon] = useState('💸');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingCategory) {
      setName(existingCategory.name);
      setType(existingCategory.type);
      setIcon(existingCategory.icon || (existingCategory.type === 'ingreso' ? '➕' : '💸'));
    } else {
      // Resetear para nuevo formulario
      setName('');
      setType('egreso');
      setIcon('💸');
    }
  }, [existingCategory]);

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setType(newType);
    if (!icon || (icon === '➕' && newType === 'egreso') || (icon === '💸' && newType === 'ingreso')) {
      setIcon(newType === 'ingreso' ? '➕' : '💸');
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la categoría es requerido.');
      return;
    }
    setError('');
    setLoading(true);

    const categoryData = { name: name.trim(), type, icon };

    try {
      let savedCategory;
      if (existingCategory && existingCategory.id) {
        savedCategory = await categoriesService.updateCategory(existingCategory.id, categoryData);
      } else {
        savedCategory = await categoriesService.createCategory(categoryData);
      }
      onCategorySaved(savedCategory); // Llama al callback del padre
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al guardar la categoría.');
      console.error("Error saving category:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="category-form-container">
      <h3>{existingCategory ? 'Editar Categoría' : 'Nueva Categoría Personalizada'}</h3>
      <form onSubmit={handleSubmit}>
        {error && <p className="error-message small-error">{error}</p>}
        <div className="form-group">
          <label htmlFor="categoryName">Nombre:</label>
          <input
            type="text"
            id="categoryName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Compras Online, Freelance"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="categoryType">Tipo:</label>
          <select id="categoryType" value={type} onChange={handleTypeChange}>
            <option value="egreso">Egreso (Gasto)</option>
            <option value="ingreso">Ingreso</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="categoryIcon">Ícono (Emoji):</label>
          <input
            type="text"
            id="categoryIcon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            maxLength="2"
            style={{ width: '70px', textAlign: 'center', fontSize: '1.3rem' }}
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="button button-primary" disabled={loading}>
            {loading ? 'Guardando...' : (existingCategory ? 'Guardar Cambios' : 'Crear Categoría')}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="button button-secondary" disabled={loading}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;