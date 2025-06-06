import apiClient from './api';

const API_ENDPOINT = '/goals';

const getAllGoals = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.statusFilter) params.append('statusFilter', filters.statusFilter);
  if (filters.priorityFilter) params.append('priorityFilter', filters.priorityFilter);

  const response = await apiClient.get(`${API_ENDPOINT}?${params.toString()}`);
  return response.data;
};

const getGoalById = async (id) => {
  const response = await apiClient.get(`${API_ENDPOINT}/${id}`);
  return response.data;
};

const createGoal = async (goalData) => {
  const response = await apiClient.post(API_ENDPOINT, goalData);
  return response.data;
};

const updateGoal = async (id, goalData) => {
  const response = await apiClient.put(`${API_ENDPOINT}/${id}`, goalData);
  return response.data;
};

const deleteGoal = async (id) => {
  const response = await apiClient.delete(`${API_ENDPOINT}/${id}`);
  return response.data;
};

const addProgress = async (goalId, progressData) => {
  // progressData: { amount, accountId, date }
  const response = await apiClient.post(`${API_ENDPOINT}/${goalId}/add-progress`, progressData);
  return response.data;
};

const goalsService = {
  getAllGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  addProgress,
};

export default goalsService;