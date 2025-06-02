// finanzas-app-pro/frontend/src/services/goals.service.js
import apiClient from './api'; //

const API_ENDPOINT = '/goals';

const getAllGoals = async (filters = {}) => {
  // console.log('[GoalService] Fetching all goals from backend with filters:', filters);
  const params = new URLSearchParams();
  if (filters.statusFilter) params.append('statusFilter', filters.statusFilter);
  if (filters.priorityFilter) params.append('priorityFilter', filters.priorityFilter);

  const response = await apiClient.get(`${API_ENDPOINT}?${params.toString()}`);
  // console.log('[GoalService] Goals received:', response.data);
  return response.data;
};

const getGoalById = async (id) => {
  // console.log('[GoalService] Fetching goal by ID from backend:', id);
  const response = await apiClient.get(`${API_ENDPOINT}/${id}`);
  // console.log('[GoalService] Goal by ID received:', response.data);
  return response.data;
};

const createGoal = async (goalData) => {
  // console.log('[GoalService] Creating new goal via backend:', goalData);
  const response = await apiClient.post(API_ENDPOINT, goalData);
  // console.log('[GoalService] Goal creation response:', response.data);
  return response.data;
};

const updateGoal = async (id, goalData) => {
  // console.log('[GoalService] Updating goal via backend:', id, goalData);
  const response = await apiClient.put(`${API_ENDPOINT}/${id}`, goalData);
  // console.log('[GoalService] Goal update response:', response.data);
  return response.data;
};

const deleteGoal = async (id) => {
  // console.log('[GoalService] Deleting goal via backend:', id);
  const response = await apiClient.delete(`${API_ENDPOINT}/${id}`);
  // console.log('[GoalService] Goal deletion response:', response.data);
  return response.data;
};

// Potentially, a function to add progress to a goal
const addProgressToGoal = async (id, amount) => {
  console.log(`[GoalService] Adding progress to goal ID ${id}:`, { amount });
  // This endpoint doesn't exist yet in the backend controller,
  // but it's a common feature for goals.
  // For now, updates to currentAmount will go through updateGoal.
  // If a dedicated endpoint is created, it would be called here.
  // Example: const response = await apiClient.post(`${API_ENDPOINT}/${id}/add-progress`, { amount });
  // return response.data;
  throw new Error('Endpoint addProgressToGoal not implemented yet in backend.');
};


const goalsService = {
  getAllGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  // addProgressToGoal, // Uncomment if implemented
};

export default goalsService;