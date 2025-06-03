// finanzas-app-pro/frontend/src/hooks/useDashboardData.js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext'; //
import dashboardService from '../services/dashboard.service'; //
import accountService from '../services/accounts.service'; //
import goalsService from '../services/goals.service.js'; //

const initialApiDataState = {
  investmentHighlights: null,
  monthlyFinancialStatus: null,
  balanceSummary: null,
  allUserAccounts: [],
  globalBudgetStatus: null,
  balanceTrendData: null,
  saludFinancieraData: null,
  upcomingEvents: [],
  recentTransactions: [],
  spendingChart: null, // << AÑADIDO: Estado para los datos del gráfico de gastos
  savingsGoals: [],
  // Estados de carga individuales
  loadingAccounts: true,
  loadingInvestments: true,
  loadingMonthlyStatus: true,
  loadingBalanceSummary: true,
  loadingGlobalBudget: true,
  loadingBalanceTrend: true,
  loadingSaludFinanciera: true,
  loadingUpcomingEvents: true,
  loadingRecentTransactions: true,
  loadingSpendingChart: true, // << AÑADIDO: Estado de carga para el gráfico de gastos
  loadingSavingsGoals: true,
};

const shallowEqual = (objA, objB) => {
  if (objA === objB) return true;
  if (!objA || !objB || typeof objA !== 'object' || typeof objB !== 'object') return false;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (let key of keysA) {
    if (!objB.hasOwnProperty(key) || objA[key] !== objB[key]) {
      if (typeof objA[key] === 'object' || typeof objB[key] === 'object') {
          if (objA[key] !== objB[key]) return false; 
      } else if (objA[key] !== objB[key]) {
        return false;
      }
    }
  }
  return true;
};


export const useDashboardData = () => {
  const { user } = useAuth(); //
  const [apiData, setApiData] = useState(initialApiDataState);
  const [dataError, setDataError] = useState(''); 
  const prevApiDataRef = useRef(initialApiDataState);

  useEffect(() => {
    prevApiDataRef.current = apiData;
  }, [apiData]);


  const fetchDashboardData = useCallback(async (showLoadingIndicators = true) => {
    if (!user) {
      setApiData(initialApiDataState); 
      setDataError('');
      return;
    }

    let newLoadingStates = { ...initialApiDataState }; 
    if (showLoadingIndicators) {
      setApiData(prev => ({
        ...initialApiDataState, 
        allUserAccounts: prev.allUserAccounts, 
      }));
    }
    setDataError(''); 
    // console.log('[useDashboardData] Fetching data...');

    try {
      const results = await Promise.allSettled([
        dashboardService.getInvestmentHighlights(3), // 0
        dashboardService.getCurrentMonthFinancialStatus(), // 1
        accountService.getAllAccounts(), // 2
        dashboardService.getDashboardSummary(), // 3
        dashboardService.getGlobalBudgetStatus(), // 4
        dashboardService.getBalanceTrendData({ months: 6 }), // 5
        dashboardService.getSaludFinancieraData(), // 6
        dashboardService.getUpcomingEvents(15), // 7
        dashboardService.getRecentTransactions(5), // 8
        dashboardService.getMonthlySpendingByCategory({ currency: 'ARS' }), // 9 <-- Gastos del Mes
        goalsService.getAllGoals({ statusFilter: 'active' }), // 10
      ]);

      const errorMessages = {};
      // **MUY IMPORTANTE: El orden de estas 'keys' DEBE coincidir con el orden de las promesas arriba.**
      const keys = [
        'investmentHighlights', 'monthlyFinancialStatus', 'allUserAccounts', 'balanceSummary',
        'globalBudgetStatus', 'balanceTrendData', 'saludFinancieraData', 'upcomingEvents',
        'recentTransactions', 'spendingChart', 'savingsGoals' 
      ];
      results.forEach((result, index) => {
          if (result.status === 'rejected') {
              errorMessages[keys[index]] = result.reason?.response?.data?.message || result.reason?.message || `Error en ${keys[index]}`;
              console.warn(`[useDashboardData] Error fetching ${keys[index]}:`, errorMessages[keys[index] ]);
          }
      });
      if (Object.keys(errorMessages).length > 0) {
          setDataError(errorMessages); 
      }


      setApiData(prevApiDataNow => {
        const newLoadingStatesValues = {
          loadingAccounts: false, loadingInvestments: false, loadingMonthlyStatus: false,
          loadingBalanceSummary: false, loadingGlobalBudget: false, loadingBalanceTrend: false,
          loadingSaludFinanciera: false, loadingUpcomingEvents: false,
          loadingRecentTransactions: false, 
          loadingSpendingChart: false, // <-- Carga para SpendingChart
          loadingSavingsGoals: false, 
        };

        const newFetchedData = {
          investmentHighlights: results[0].status === 'fulfilled' ? results[0].value : prevApiDataNow.investmentHighlights,
          monthlyFinancialStatus: results[1].status === 'fulfilled' ? results[1].value : prevApiDataNow.monthlyFinancialStatus,
          allUserAccounts: results[2].status === 'fulfilled' ? (results[2].value || []) : prevApiDataNow.allUserAccounts,
          balanceSummary: results[3].status === 'fulfilled' ? results[3].value : prevApiDataNow.balanceSummary,
          globalBudgetStatus: results[4].status === 'fulfilled' ? results[4].value : prevApiDataNow.globalBudgetStatus,
          balanceTrendData: results[5].status === 'fulfilled' ? results[5].value : prevApiDataNow.balanceTrendData,
          saludFinancieraData: results[6].status === 'fulfilled' ? results[6].value : prevApiDataNow.saludFinancieraData,
          upcomingEvents: results[7].status === 'fulfilled' ? (results[7].value || []) : prevApiDataNow.upcomingEvents,
          recentTransactions: results[8].status === 'fulfilled' ? (results[8].value || []) : prevApiDataNow.recentTransactions, 
          spendingChart: results[9].status === 'fulfilled' ? results[9].value : prevApiDataNow.spendingChart, // << Asignación de SpendingChart
          savingsGoals: results[10].status === 'fulfilled' ? (results[10].value || []) : prevApiDataNow.savingsGoals, // << Asignación de SavingsGoals
        };
        
        let hasDataChanged = false;
        let changedKeys = []; 
        for (const key in newFetchedData) {
            if (!shallowEqual(prevApiDataNow[key], newFetchedData[key])) {
                hasDataChanged = true;
                changedKeys.push(key);
            }
        }
        
        let haveLoadingStatesChanged = false;
        for (const key in newLoadingStatesValues) {
            if (prevApiDataNow[key] !== newLoadingStatesValues[key]) {
                haveLoadingStatesChanged = true;
                changedKeys.push(key);
            }
        }

        if (hasDataChanged || haveLoadingStatesChanged) {
            // console.log('[useDashboardData] setApiData - Changes detected in:', changedKeys.join(', '));
            return { ...prevApiDataNow, ...newFetchedData, ...newLoadingStatesValues };
        }
        // console.log('[useDashboardData] setApiData - No changes detected in data or loading states.');
        return prevApiDataNow; 
      });
      
    } catch (err) { 
      setDataError(prev => ({ ...prev, general: 'Error crítico al cargar datos del dashboard.' }));
      console.error("[useDashboardData] Error crítico en fetchDashboardData:", err);
      setApiData(prev => ({ ...initialApiDataState, 
        loadingAccounts: false, loadingInvestments: false, loadingMonthlyStatus: false, 
        loadingBalanceSummary: false, loadingGlobalBudget: false, loadingBalanceTrend: false, 
        loadingSaludFinanciera: false, loadingUpcomingEvents: false, loadingRecentTransactions: false,
        loadingSpendingChart: false, // << Asegurar que se setea a false en caso de error
        loadingSavingsGoals: false 
      }));
    }
  }, [user]); 

  useEffect(() => {
    if (user) { 
        fetchDashboardData();
    } else {
        setApiData(initialApiDataState); 
        setDataError(''); 
    }
  }, [user, fetchDashboardData]); 


  const loadingStates = useMemo(() => {
    const isLoadingOverall = apiData.loadingAccounts || apiData.loadingInvestments || apiData.loadingMonthlyStatus ||
                         apiData.loadingBalanceSummary || apiData.loadingGlobalBudget || apiData.loadingBalanceTrend ||
                         apiData.loadingSaludFinanciera || apiData.loadingUpcomingEvents ||
                         apiData.loadingRecentTransactions || 
                         apiData.loadingSpendingChart || // << Incluido en la carga general
                         apiData.loadingSavingsGoals; 
    return {
      accounts: apiData.loadingAccounts,
      investments: apiData.loadingInvestments,
      monthlyStatus: apiData.loadingMonthlyStatus,
      balanceSummary: apiData.loadingBalanceSummary,
      globalBudget: apiData.loadingGlobalBudget,
      balanceTrend: apiData.loadingBalanceTrend,
      saludFinanciera: apiData.loadingSaludFinanciera,
      upcomingEvents: apiData.loadingUpcomingEvents,
      recentTransactions: apiData.loadingRecentTransactions, 
      spendingChart: apiData.loadingSpendingChart, // << Estado individual
      savingsGoals: apiData.loadingSavingsGoals, 
      overall: isLoadingOverall,
    };
  }, [ 
    apiData.loadingAccounts, apiData.loadingInvestments, apiData.loadingMonthlyStatus,
    apiData.loadingBalanceSummary, apiData.loadingGlobalBudget, apiData.loadingBalanceTrend,
    apiData.loadingSaludFinanciera, apiData.loadingUpcomingEvents,
    apiData.loadingRecentTransactions, 
    apiData.loadingSpendingChart, // << Incluido en dependencias
    apiData.loadingSavingsGoals 
  ]);

  useEffect(() => {
    if (prevApiDataRef.current !== apiData) {
        for (const key in apiData) {
            if (apiData[key] !== prevApiDataRef.current[key]) {
                // console.log(`  - apiData.${key} reference changed.`);
            }
        }
    }
  }, [apiData]);


  return {
    apiData, 
    loadingStates, 
    fetchDashboardData, 
    error: dataError 
  };
};