// Ruta: frontend/src/pages/CategoriesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import categoriesService from '../services/categories.service';
import CategoryListItem from '../components/categories/CategoryListItem';
import CategoryForm from '../components/categories/CategoryForm';
import './CategoriesPage.css';

const CategoriesPage = () => {
  const [userCategories, setUserCategories] = useState([]);
  const [globalCategories, setGlobalCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const allCategoriesData = await categoriesService.getAllCategories();
      
      const userIngreso = allCategoriesData.ingreso.filter(cat => cat.userId !== null);
      const userEgreso = allCategoriesData.egreso.filter(cat => cat.userId !== null);
      setUserCategories([...userIngreso, ...userEgreso].sort((a,b) => a.name.localeCompare(b.name)));

      const globalIngreso = allCategoriesData.ingreso.filter(cat => cat.userId === null);
      const globalEgreso = allCategoriesData.egreso.filter(cat => cat.userId === null);
      setGlobalCategories([...globalIngreso, ...globalEgreso].sort((a,b) => a.name.localeCompare(b.name)));

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar las categorías.');
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCategoryCreated = (newCategory) => {
    setUserCategories(prev => [...prev, newCategory].sort((a,b) => a.name.localeCompare(b.name)));
    setShowAddForm(false);
    setEditingCategory(null);
  };

  const handleCategoryUpdated = (updatedCategory) => {
    setUserCategories(prev => 
      prev.map(cat => (cat.id === updatedCategory.id ? updatedCategory : cat))
        .sort((a,b) => a.name.localeCompare(b.name))
    );
    setEditingCategory(null);
    setShowAddForm(false);
  };
  
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowAddForm(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría? Esto no se puede deshacer.')) {
      try {
        await categoriesService.deleteCategory(categoryId);
        setUserCategories(prev => prev.filter(cat => cat.id !== categoryId));
      } catch (err) {
        setError(err.response?.data?.message || 'Error al eliminar la categoría.');
        console.error("Error deleting category:", err);
      }
    }
  };

  if (loading) {
    return <div className="page-container categories-page-loading"><p className="loading-text">Cargando categorías...</p></div>;
  }

  return (
    <div className="page-container categories-page">
      {/* El header original se oculta por SettingsPage.css cuando está dentro de SettingsPage */}
      <div className="categories-page-header" style={{ display: 'none' }}>
        <h1>Gestionar Categorías</h1>
      </div>

      {/* Barra de acciones para el botón */}
      <div className="categories-actions-bar">
        <button 
          onClick={() => { 
            if (showAddForm && editingCategory) { 
                 setShowAddForm(false); 
                 setEditingCategory(null);
            } else if (showAddForm && !editingCategory) { 
                setShowAddForm(false);
            } else { 
                setEditingCategory(null);
                setShowAddForm(true);
            }
          }} 
          // Se aplica la clase 'button-primary' para que tome los estilos de la barra azul
          // y 'button-secondary' si es un estado de "cancelar"
          className={`button ${showAddForm && !editingCategory ? 'button-secondary-cancel-form' : 'button-primary-action-bar'}`}
        >
          {showAddForm && !editingCategory ? 'Cancelar Creación de Categoría' : (editingCategory ? 'Cancelar Edición': '➕ Nueva Categoría')}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {showAddForm && (
        <CategoryForm
          onCategorySaved={editingCategory ? handleCategoryUpdated : handleCategoryCreated}
          existingCategory={editingCategory}
          onCancel={() => { setShowAddForm(false); setEditingCategory(null); }}
        />
      )}

      <div className="categories-section">
        <h2>Mis Categorías Personalizadas ({userCategories.length})</h2>
        {userCategories.length > 0 ? (
          <ul className="category-list">
            {userCategories.map(cat => (
              <CategoryListItem 
                key={cat.id} 
                category={cat} 
                isCustom={true}
                onEdit={() => handleEditCategory(cat)}
                onDelete={() => handleDeleteCategory(cat.id)}
              />
            ))}
          </ul>
        ) : (
          !showAddForm && <p className="no-data-message">Aún no has creado categorías personalizadas.</p>
        )}
      </div>

      <div className="categories-section global-categories-section">
        <h2>Categorías Globales (Predeterminadas)</h2>
        {globalCategories.length > 0 ? (
          <ul className="category-list">
            {globalCategories.map(cat => (
              <CategoryListItem key={cat.id} category={cat} isCustom={false} />
            ))}
          </ul>
        ) : (
          <p className="no-data-message">No hay categorías globales disponibles.</p>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;