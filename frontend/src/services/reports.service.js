    // Ruta: finanzas-app-pro/frontend/src/services/reports.service.js
    import apiClient from './api';

    const getExpensesByCategoryReport = async (filters = {}) => {
      console.log('[ReportService] Fetching ExpensesByCategoryReport from backend with filters:', filters);
      
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.currency) params.append('currency', filters.currency); // AÑADIR FILTRO DE MONEDA

      try {
        const response = await apiClient.get(`/reports/expenses-by-category?${params.toString()}`);
        console.log('[ReportService] ExpensesByCategoryReport received:', response.data);
        return response.data; 
      } catch (error) {
        console.error("Error fetching expenses by category report from backend:", error);
        throw error.response?.data || new Error("No se pudo generar el informe de gastos por categoría desde el servidor.");
      }
    };

    const getIncomeVsExpensesReport = async (filters = {}) => {
      // ... (sin cambios)
      console.log('[ReportService] Fetching IncomeVsExpensesReport from backend with filters:', filters);
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.months) params.append('months', filters.months); 

      try {
        const response = await apiClient.get(`/reports/income-vs-expenses?${params.toString()}`);
        console.log('[ReportService] IncomeVsExpensesReport received:', response.data);
        return response.data;
      } catch (error) {
        console.error("Error fetching income vs expenses report from backend:", error);
        throw error.response?.data || new Error("No se pudo generar el informe de ingresos vs. egresos desde el servidor.");
      }
    };

    const reportsService = {
      getExpensesByCategoryReport,
      getIncomeVsExpensesReport,
    };

    export default reportsService;
    