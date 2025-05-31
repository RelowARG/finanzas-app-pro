// Ruta: finanzas-app-pro/frontend/src/services/categories.service.js
// ACTUALIZA ESTE ARCHIVO PARA USAR apiClient Y LLAMAR AL BACKEND REAL
import apiClient from './api';

// El backend en GET /api/categories ya devuelve un objeto {ingreso: [], egreso: []}
// o un array si se filtra por tipo.
const getAllCategories = async () => {
  console.log('[CategoryService] Fetching all categories from backend');
  // Esta llamada al backend ya debería devolver las globales + las del usuario
  const response = await apiClient.get('/categories'); 
  console.log('[CategoryService] All categories received:', response.data);
  // response.data será {ingreso: [...], egreso: [...]}
  return response.data; 
};

const getCategoriesByType = async (type) => { // type puede ser 'ingreso' o 'egreso'
  console.log('[CategoryService] Fetching categories by type from backend:', type);
  if (!type) {
    // Si no se especifica tipo, podríamos llamar a getAllCategories y que el componente filtre,
    // o decidir que siempre se debe especificar un tipo para esta función.
    // Por ahora, si el backend soporta ?type=, lo usamos.
    console.warn('[CategoryService] getCategoriesByType llamado sin tipo, obteniendo todas y filtrando en frontend o esperando que el backend filtre.');
  }
  // El backend en GET /api/categories?type=egreso devuelve un array de categorías de ese tipo
  const response = await apiClient.get(`/categories?type=${type}`);
  console.log(`[CategoryService] Categories for type ${type} received:`, response.data);
  return response.data; // El backend devuelve un array filtrado por tipo
};

const createCategory = async (categoryData) => {
  // categoryData debería ser { name, type, icon }
  // El userId se añade en el backend.
  console.log('[CategoryService] Creating new custom category via backend:', categoryData);
  const response = await apiClient.post('/categories', categoryData);
  console.log('[CategoryService] Custom category creation response:', response.data);
  return response.data; // El backend devuelve la categoría creada
};

const updateCategory = async (id, categoryData) => {
  // categoryData podría ser { name, icon }. El tipo usualmente no se edita.
  console.log('[CategoryService] Updating custom category via backend:', id, categoryData);
  const response = await apiClient.put(`/categories/${id}`, categoryData);
  console.log('[CategoryService] Custom category update response:', response.data);
  return response.data;
};

const deleteCategory = async (id) => {
  console.log('[CategoryService] Deleting custom category via backend:', id);
  const response = await apiClient.delete(`/categories/${id}`);
  console.log('[CategoryService] Custom category deletion response:', response.data);
  return response.data; // El backend devuelve un mensaje de éxito
};

const categoriesService = {
  getAllCategories,
  getCategoriesByType,
  createCategory,
  updateCategory,
  deleteCategory,
};

export default categoriesService;