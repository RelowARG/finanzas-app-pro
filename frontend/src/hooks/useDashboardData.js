// finanzas-app-pro/frontend/src/hooks/useDashboardData.js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  upcomingEvents: [], // <--- NUEVO ESTADO
  // Estados de carga individuales
  loadingAccounts: true,
  loadingInvestments: true,
  loadingMonthlyStatus: true,
  loadingBalanceSummary: true,
  loadingGlobalBudget: true,
  loadingBalanceTrend: true,
  loadingSaludFinanciera: true,
  loadingUpcomingEvents: true, // <--- NUEVO ESTADO DE CARGA
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
          // Para objetos/arrays anidados, esta igualdad superficial solo chequeará referencias.
          // Si se necesita deep comparison aquí, se complicaría, pero para datos de API suele ser suficiente.
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
  const [dataError, setDataError] = useState(''); // Puede ser un objeto para errores específicos
  const prevApiDataRef = useRef(initialApiDataState);

  useEffect(() => {
    prevApiDataRef.current = apiData;
  }, [apiData]);


  const fetchDashboardData = useCallback(async (showLoadingIndicators = true) => {
    if (!user) {
      setApiData(initialApiDataState); // Resetear si no hay usuario
      setDataError('');
      return;
    }

    // Si showLoadingIndicators es true, resetear todos los loading a true.
    // Si es false (ej. un refresco en segundo plano), mantener los datos existentes
    // y solo actualizar los loading de las llamadas que se harán.
    let newLoadingStates = { ...initialApiDataState }; // Esto ya los pone a true por defecto
    if (showLoadingIndicators) {
      setApiData(prev => ({
        ...initialApiDataState, // Resetea datos a null/[] y loadings a true
        allUserAccounts: prev.allUserAccounts, // Mantener cuentas si ya están cargadas y no se vuelven a pedir explícitamente
        // Podríamos ser más selectivos aquí si solo algunas cosas se refrescan.
      }));
    }
    setDataError(''); // Limpiar errores antes de nueva carga
    // console.log('[useDashboardData] Fetching data...');

    try {
      const results = await Promise.allSettled([
        dashboardService.getInvestmentHighlights(3),
        dashboardService.getCurrentMonthFinancialStatus(),
        accountService.getAllAccounts(), // Podría ser condicional si no se necesita siempre
        dashboardService.getDashboardSummary(),
        dashboardService.getGlobalBudgetStatus(),
        dashboardService.getBalanceTrendData({ months: 6 }),
        dashboardService.getSaludFinancieraData(),
        dashboardService.getUpcomingEvents(15), // <--- LLAMADA AL NUEVO SERVICIO
      ]);

      // Crear un objeto para almacenar errores por cada "slice" de datos
      const errorMessages = {};
      results.forEach((result, index) => {
          if (result.status === 'rejected') {
              const keys = ['investmentHighlights', 'monthlyFinancialStatus', 'allUserAccounts', 'balanceSummary', 'globalBudgetStatus', 'balanceTrendData', 'saludFinancieraData', 'upcomingEvents'];
              errorMessages[keys[index]] = result.reason?.response?.data?.message || result.reason?.message || `Error en ${keys[index]}`;
              console.warn(`[useDashboardData] Error fetching ${keys[index]}:`, errorMessages[keys[index]]);
          }
      });
      if (Object.keys(errorMessages).length > 0) {
          setDataError(errorMessages); // Guardar errores específicos
      }


      setApiData(prevApiDataNow => {
        const newLoadingStatesValues = {
          loadingAccounts: false, loadingInvestments: false, loadingMonthlyStatus: false,
          loadingBalanceSummary: false, loadingGlobalBudget: false, loadingBalanceTrend: false,
          loadingSaludFinanciera: false, loadingUpcomingEvents: false, // <--- NUEVO
        };

        const newFetchedData = {
          investmentHighlights: results[0].status === 'fulfilled' ? results[0].value : prevApiDataNow.investmentHighlights,
          monthlyFinancialStatus: results[1].status === 'fulfilled' ? results[1].value : prevApiDataNow.monthlyFinancialStatus,
          allUserAccounts: results[2].status === 'fulfilled' ? (results[2].value || []) : prevApiDataNow.allUserAccounts,
          balanceSummary: results[3].status === 'fulfilled' ? results[3].value : prevApiDataNow.balanceSummary,
          globalBudgetStatus: results[4].status === 'fulfilled' ? results[4].value : prevApiDataNow.globalBudgetStatus,
          balanceTrendData: results[5].status === 'fulfilled' ? results[5].value : prevApiDataNow.balanceTrendData,
          saludFinancieraData: results[6].status === 'fulfilled' ? results[6].value : prevApiDataNow.saludFinancieraData,
          upcomingEvents: results[7].status === 'fulfilled' ? (results[7].value || []) : prevApiDataNow.upcomingEvents, // <--- NUEVO
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
      // Este catch es para errores imprevistos en Promise.allSettled o en la lógica del hook en sí.
      // Los errores de las llamadas individuales ya se manejan con `errorMessages`.
      setDataError(prev => ({ ...prev, general: 'Error crítico al cargar datos del dashboard.' }));
      console.error("[useDashboardData] Error crítico en fetchDashboardData:", err);
      // Asegurarse que todos los loading states se pongan a false
      setApiData(prev => ({ ...initialApiDataState, loadingAccounts: false, loadingInvestments: false, loadingMonthlyStatus: false, loadingBalanceSummary: false, loadingGlobalBudget: false, loadingBalanceTrend: false, loadingSaludFinanciera: false, loadingUpcomingEvents: false }));
    }
  }, [user]); // Dependencia de 'user' para que se vuelva a crear si el usuario cambia.

  useEffect(() => {
    if (user) { 
        // console.log('[useDashboardData] User changed or fetchDashboardData changed, calling fetchDashboardData.');
        fetchDashboardData();
    } else {
        // console.log('[useDashboardData] No user, resetting apiData.');
        setApiData(initialApiDataState); 
        setDataError(''); // Limpiar errores si el usuario se desloguea
    }
  }, [user, fetchDashboardData]); // fetchDashboardData está en useCallback, solo cambia si 'user' cambia.


  const loadingStates = useMemo(() => {
    // Determina el estado general de carga si alguna de las cargas individuales está activa.
    const isLoadingOverall = apiData.loadingAccounts || apiData.loadingInvestments || apiData.loadingMonthlyStatus ||
                         apiData.loadingBalanceSummary || apiData.loadingGlobalBudget || apiData.loadingBalanceTrend ||
                         apiData.loadingSaludFinanciera || apiData.loadingUpcomingEvents; // <--- NUEVO
    // console.log('[useDashboardData] Recalculating loadingStates. Overall:', isLoadingOverall);
    return {
      accounts: apiData.loadingAccounts,
      investments: apiData.loadingInvestments,
      monthlyStatus: apiData.loadingMonthlyStatus,
      balanceSummary: apiData.loadingBalanceSummary,
      globalBudget: apiData.loadingGlobalBudget,
      balanceTrend: apiData.loadingBalanceTrend,
      saludFinanciera: apiData.loadingSaludFinanciera,
      upcomingEvents: apiData.loadingUpcomingEvents, // <--- NUEVO
      overall: isLoadingOverall, // Estado de carga general
    };
  }, [ // Lista de dependencias para useMemo
    apiData.loadingAccounts, apiData.loadingInvestments, apiData.loadingMonthlyStatus,
    apiData.loadingBalanceSummary, apiData.loadingGlobalBudget, apiData.loadingBalanceTrend,
    apiData.loadingSaludFinanciera, apiData.loadingUpcomingEvents // <--- NUEVO
  ]);

  // Log para cuando el objeto apiData que devuelve el hook cambia de referencia
  useEffect(() => {
    if (prevApiDataRef.current !== apiData) {
        // console.log('[useDashboardData] apiData reference CHANGED.');
        // Loguear qué parte específica de apiData cambió de referencia si es posible
        for (const key in apiData) {
            if (apiData[key] !== prevApiDataRef.current[key]) {
                // console.log(`  - apiData.${key} reference changed.`);
            }
        }
    } else {
        // console.log('[useDashboardData] apiData reference is STABLE.');
    }
  }, [apiData]);


  return {
    apiData, // El objeto que contiene todos los datos y los estados de carga individuales
    loadingStates, // Un objeto separado con solo los booleanos de carga (útil para UI)
    fetchDashboardData, // Función para refrescar los datos manualmente
    error: dataError // Estado de error (puede ser string o objeto con errores por slice)
  };
};