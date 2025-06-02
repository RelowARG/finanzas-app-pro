// Ruta: src/hooks/useDashboardData.js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'; // Importar useRef
import { useAuth } from '../contexts/AuthContext';
import dashboardService from '../services/dashboard.service';
import accountService from '../services/accounts.service';

const initialApiDataState = {
  investmentHighlights: null,
  monthlyFinancialStatus: null,
  balanceSummary: null,
  allUserAccounts: [],
  globalBudgetStatus: null,
  balanceTrendData: null,
  saludFinancieraData: null,
  loadingAccounts: true,
  loadingInvestments: true,
  loadingMonthlyStatus: true,
  loadingBalanceSummary: true,
  loadingGlobalBudget: true,
  loadingBalanceTrend: true,
  loadingSaludFinanciera: true,
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
  const { user } = useAuth();
  const [apiData, setApiData] = useState(initialApiDataState);
  const [dataError, setDataError] = useState('');
  const prevApiDataRef = useRef(initialApiDataState); // Para comparar con el estado anterior

  useEffect(() => {
    prevApiDataRef.current = apiData;
  }, [apiData]);


  const fetchDashboardData = useCallback(async (showLoadingIndicators = true) => {
    if (!user) {
      setApiData(initialApiDataState); 
      setDataError('');
      return;
    }

    if (showLoadingIndicators) {
      setApiData(prev => ({
        ...initialApiDataState, 
        allUserAccounts: prev.allUserAccounts, 
      }));
    }
    setDataError('');
    console.log('[useDashboardData] Fetching data...');

    try {
      const results = await Promise.allSettled([
        dashboardService.getInvestmentHighlights(3),
        dashboardService.getCurrentMonthFinancialStatus(),
        accountService.getAllAccounts(),
        dashboardService.getDashboardSummary(),
        dashboardService.getGlobalBudgetStatus(),
        dashboardService.getBalanceTrendData({ months: 6 }),
        dashboardService.getSaludFinancieraData(),
      ]);

      setApiData(prevApiDataNow => { // Renombrar prevApiData para evitar confusión con el ref
        const newLoadingStatesValues = {
          loadingAccounts: false, loadingInvestments: false, loadingMonthlyStatus: false,
          loadingBalanceSummary: false, loadingGlobalBudget: false, loadingBalanceTrend: false,
          loadingSaludFinanciera: false,
        };

        const newFetchedData = {
          investmentHighlights: results[0].status === 'fulfilled' ? results[0].value : prevApiDataNow.investmentHighlights,
          monthlyFinancialStatus: results[1].status === 'fulfilled' ? results[1].value : prevApiDataNow.monthlyFinancialStatus,
          allUserAccounts: results[2].status === 'fulfilled' ? (results[2].value || []) : prevApiDataNow.allUserAccounts,
          balanceSummary: results[3].status === 'fulfilled' ? results[3].value : prevApiDataNow.balanceSummary,
          globalBudgetStatus: results[4].status === 'fulfilled' ? results[4].value : prevApiDataNow.globalBudgetStatus,
          balanceTrendData: results[5].status === 'fulfilled' ? results[5].value : prevApiDataNow.balanceTrendData,
          saludFinancieraData: results[6].status === 'fulfilled' ? results[6].value : prevApiDataNow.saludFinancieraData,
        };
        
        let hasDataChanged = false;
        let changedKeys = []; // Para loguear qué cambió
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
            console.log('[useDashboardData] setApiData - Changes detected in:', changedKeys.join(', '));
            return { ...prevApiDataNow, ...newFetchedData, ...newLoadingStatesValues };
        }
        console.log('[useDashboardData] setApiData - No changes detected in data or loading states.');
        return prevApiDataNow; 
      });
      
      const fetchErrors = results.filter(r => r.status === 'rejected').map(r => r.reason?.message || 'Error desconocido');
      if (fetchErrors.length > 0) {
        setDataError(`Errores al cargar algunos datos: ${fetchErrors.join(', ')}`);
      }

    } catch (err) { 
      setDataError('Error crítico al cargar datos del dashboard.');
      console.error("Error crítico en fetchDashboardData:", err);
      setApiData({ ...initialApiDataState, loadingAccounts: false, loadingInvestments: false, loadingMonthlyStatus: false, loadingBalanceSummary: false, loadingGlobalBudget: false, loadingBalanceTrend: false, loadingSaludFinanciera: false });
    }
  }, [user]);

  useEffect(() => {
    if (user) { 
        console.log('[useDashboardData] User changed or fetchDashboardData changed, calling fetchDashboardData.');
        fetchDashboardData();
    } else {
        console.log('[useDashboardData] No user, resetting apiData.');
        setApiData(initialApiDataState); 
        setDataError('');
    }
  }, [user, fetchDashboardData]); // fetchDashboardData está en useCallback, solo cambia si 'user' cambia.


  const loadingStates = useMemo(() => {
    const isLoadingOverall = apiData.loadingAccounts || apiData.loadingInvestments || apiData.loadingMonthlyStatus ||
                         apiData.loadingBalanceSummary || apiData.loadingGlobalBudget || apiData.loadingBalanceTrend ||
                         apiData.loadingSaludFinanciera;
    // console.log('[useDashboardData] Recalculating loadingStates. Overall:', isLoadingOverall);
    return {
      accounts: apiData.loadingAccounts,
      investments: apiData.loadingInvestments,
      monthlyStatus: apiData.loadingMonthlyStatus,
      balanceSummary: apiData.loadingBalanceSummary,
      globalBudget: apiData.loadingGlobalBudget,
      balanceTrend: apiData.loadingBalanceTrend,
      saludFinanciera: apiData.loadingSaludFinanciera,
      overall: isLoadingOverall,
    };
  }, [ 
    apiData.loadingAccounts, apiData.loadingInvestments, apiData.loadingMonthlyStatus,
    apiData.loadingBalanceSummary, apiData.loadingGlobalBudget, apiData.loadingBalanceTrend,
    apiData.loadingSaludFinanciera
  ]);

  // Log para cuando el objeto apiData que devuelve el hook cambia de referencia
  useEffect(() => {
    if (prevApiDataRef.current !== apiData) {
        console.log('[useDashboardData] apiData reference CHANGED.');
        // Loguear qué parte específica de apiData cambió de referencia si es posible
        for (const key in apiData) {
            if (apiData[key] !== prevApiDataRef.current[key]) {
                console.log(`  - apiData.${key} reference changed.`);
            }
        }
    } else {
        // console.log('[useDashboardData] apiData reference is STABLE.');
    }
  }, [apiData]);


  return {
    apiData,
    loadingStates, 
    fetchDashboardData, 
    error: dataError 
  };
};
