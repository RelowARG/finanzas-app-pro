// Ruta: finanzas-app-pro/frontend/src/components/categories/CategoryListItem.jsx
// ARCHIVO NUEVO
import React from 'react';
import './CategoryListItem.css';

const CategoryListItem = ({ category, isCustom, onEdit, onDelete }) => {
  return (
    <li className={`category-list-item ${isCustom ? 'custom' : 'global'} type-${category.type}`}>
      <div className="category-info">
        <span className="category-icon">{category.icon || (category.type === 'ingreso' ? '➕' : '💸')}</span>
        <span className="category-name">{category.name}</span>
        <span className="category-type-badge">{category.type}</span>
      </div>
      {isCustom && (
        <div className="category-actions">
          <button onClick={onEdit} className="button button-small button-edit">Editar</button>
          <button onClick={onDelete} className="button button-small button-delete">Eliminar</button>
        </div>
      )}
    </li>
  );
};

export default CategoryListItem;
