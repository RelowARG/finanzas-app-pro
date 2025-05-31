// Ruta: finanzas-app-pro/frontend/src/pages/CategoriesPage.jsx
// ARCHIVO NUEVO
import React, { useState, useEffect, useCallback } from 'react';
import categoriesService from '../services/categories.service';
import CategoryListItem from '../components/categories/CategoryListItem';
import CategoryForm from '../components/categories/CategoryForm'; // Asumimos que este componente se creará
import './CategoriesPage.css';

const CategoriesPage = () => {
  const [userCategories, setUserCategories] = useState([]);
  const [globalCategories, setGlobalCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // Para la edición futura

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const allCategoriesData = await categoriesService.getAllCategories();
      // El backend devuelve {ingreso: [...], egreso: [...]}
      // y cada categoría tiene un userId (null para globales)
      
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
  };

  const handleCategoryUpdated = (updatedCategory) => {
    setUserCategories(prev => 
      prev.map(cat => (cat.id === updatedCategory.id ? updatedCategory : cat))
        .sort((a,b) => a.name.localeCompare(b.name))
    );
    setEditingCategory(null);
    setShowAddForm(false); // Ocultar formulario si se estaba usando para editar
  };
  
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowAddForm(true); // Reutilizar el formulario para editar
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría? Esto no se puede deshacer.')) {
      try {
        await categoriesService.deleteCategory(categoryId);
        setUserCategories(prev => prev.filter(cat => cat.id !== categoryId));
        // Mostrar mensaje de éxito (toast)
      } catch (err) {
        setError(err.response?.data?.message || 'Error al eliminar la categoría.');
        console.error("Error deleting category:", err);
      }
    }
  };

  if (loading) {
    return <div className="page-container"><p className="loading-text">Cargando categorías...</p></div>;
  }

  return (
    <div className="page-container categories-page">
      <div className="categories-page-header">
        <h1>Gestionar Categorías</h1>
        <button 
          onClick={() => { setShowAddForm(!showAddForm); setEditingCategory(null); }} 
          className="button button-primary"
        >
          {showAddForm && !editingCategory ? 'Cancelar' : '➕ Nueva Categoría Personalizada'}
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
          !showAddForm && <p>Aún no has creado categorías personalizadas.</p>
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
          <p>No hay categorías globales disponibles.</p>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;