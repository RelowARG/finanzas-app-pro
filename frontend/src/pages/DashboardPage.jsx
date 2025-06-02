// Ruta: src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  MeasuringStrategy // Asegúrate que MeasuringStrategy esté importado si lo usas
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSwappingStrategy // Nueva estrategia para grids
} from '@dnd-kit/sortable';

// ... (importaciones de tus componentes de widget y servicios)
import AccountSummaryCard from '../components/dashboard/AccountSummaryCard';
import BalanceOverview from '../components/dashboard/BalanceOverview';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import SpendingChart from '../components/dashboard/SpendingChart';
import InvestmentHighlights from '../components/dashboard/InvestmentHighlights';
import MonthlySavingsWidget from '../components/dashboard/MonthlySavingsWidget';
import ControlPanelWidget from '../components/dashboard/ControlPanelWidget';
import BalanceTrendWidget from '../components/dashboard/BalanceTrendWidget';
import AccountDashboardSelectionModal from '../components/dashboard/AccountDashboardSelectionModal';
import SortableWidget from '../components/dashboard/SortableWidget';

import accountService from '../services/accounts.service';
import dashboardService from '../services/dashboard.service';
import authService from '../services/auth.service';

import './DashboardPage.css';
import '../components/dashboard/DashboardComponents.css';

// Mapa de todos los widgets disponibles
const ALL_AVAILABLE_WIDGETS = {
  controlPanel: { Component: ControlPanelWidget, name: 'Panel de Control', defaultProps: {} },
  spendingChart: { Component: SpendingChart, name: 'Gastos del Mes', defaultProps: {} },
  balanceOverview: { Component: BalanceOverview, name: 'Resumen de Balance', defaultProps: {} },
  investmentHighlights: { Component: InvestmentHighlights, name: 'Resumen de Inversiones', defaultProps: {} },
  balanceTrend: { Component: BalanceTrendWidget, name: 'Tendencia del Saldo', defaultProps: {} },
  monthlySavings: { Component: MonthlySavingsWidget, name: 'Finanzas del Mes', defaultProps: {} },
  recentTransactions: { Component: RecentTransactions, name: 'Últimos Registros', defaultProps: {} },
};

// Orden por defecto de los widgets si no hay configuración guardada
const getDefaultWidgetOrder = () => [
  'controlPanel',
  'balanceTrend',
  'monthlySavings',
  'spendingChart',
  'balanceOverview',
  'recentTransactions',
  'investmentHighlights',
  // Añade aquí cualquier nuevo widget en el orden que prefieras por defecto
];

// Función para inicializar la lista de widgets con sus componentes y props
const initializeWidgetsConfig = (order, allWidgetsMap) => {
  const widgetList = [];
  const includedIds = new Set();

  if (order && order.length > 0) {
    order.forEach(id => {
      if (allWidgetsMap[id]) {
        widgetList.push({ 
          id, 
          name: allWidgetsMap[id].name,
          Component: allWidgetsMap[id].Component, 
          props: { ...allWidgetsMap[id].defaultProps, loading: true } // Iniciar con loading
        });
        includedIds.add(id);
      }
    });
  }

  // Añadir widgets nuevos que no estén en el orden guardado (al final)
  Object.keys(allWidgetsMap).forEach(id => {
    if (!includedIds.has(id)) {
      widgetList.push({ 
        id, 
        name: allWidgetsMap[id].name,
        Component: allWidgetsMap[id].Component, 
        props: { ...allWidgetsMap[id].defaultProps, loading: true }
      });
    }
  });
  return widgetList;
};


const MAX_SUMMARY_CARDS_DISPLAY = 5;

const DashboardPage = () => {
  const { user, updateUserInContext } = useAuth();

  // --- Estado para datos de la API (similar a como lo tenías) ---
  const [apiData, setApiData] = useState({
    investmentHighlights: null,
    monthlyFinancialStatus: null,
    balanceSummary: null,
    allUserAccounts: [],
    globalBudgetStatus: null,
    balanceTrendData: null,
    loadingAccounts: true,
    loadingInvestments: true,
    loadingMonthlyStatus: true,
    loadingBalanceSummary: true,
    loadingGlobalBudget: true,
    loadingBalanceTrend: true,
  });

  // --- Estado para la lista ordenada de widgets ---
  const [orderedWidgetsList, setOrderedWidgetsList] = useState([]);
  
  const [displayedAccountIds, setDisplayedAccountIds] = useState([]);
  const [summaryAccountsToDisplay, setSummaryAccountsToDisplay] = useState([]);
  
  const [error, setError] = useState('');
  const [activeDragId, setActiveDragId] = useState(null);
  const [showAccountSelectionModal, setShowAccountSelectionModal] = useState(false);
  const [isInitialConfigSyncAttempted, setIsInitialConfigSyncAttempted] = useState(false);

  // --- Sensores para DND ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- Cargar/Sincronizar configuración del dashboard (widgetOrder y displayedAccountIds) ---
  useEffect(() => {
    if (user && !isInitialConfigSyncAttempted) {
      setIsInitialConfigSyncAttempted(true);
      let initialWidgetOrder = getDefaultWidgetOrder();
      let initialDisplayedAccounts = [];

      if (user.dashboardConfig) {
        console.log("DashboardPage: Cargando config del backend:", user.dashboardConfig);
        if (user.dashboardConfig.widgetOrder && user.dashboardConfig.widgetOrder.length > 0) {
          initialWidgetOrder = user.dashboardConfig.widgetOrder;
        }
        initialDisplayedAccounts = user.dashboardConfig.displayedAccountIds || [];
      }
      
      setOrderedWidgetsList(initializeWidgetsConfig(initialWidgetOrder, ALL_AVAILABLE_WIDGETS));
      setDisplayedAccountIds(initialDisplayedAccounts);

      // Si no había config en el backend y ya tenemos cuentas, guardamos la default
      if (!user.dashboardConfig && apiData.allUserAccounts.length > 0) {
        console.log("DashboardPage: No hay config en backend, usando default y guardando.");
        const defaultDisplayedAccountsFromApi = apiData.allUserAccounts
            .filter(acc => acc.includeInDashboardSummary)
            .slice(0, MAX_SUMMARY_CARDS_DISPLAY)
            .map(acc => acc.id.toString());
        
        const initialUserDashboardConfig = {
            widgetOrder: initialWidgetOrder, // El orden por defecto
            displayedAccountIds: defaultDisplayedAccountsFromApi.length > 0 ? defaultDisplayedAccountsFromApi : initialDisplayedAccounts,
        };
        setDisplayedAccountIds(initialUserDashboardConfig.displayedAccountIds); // Actualizar estado local también

        authService.updateUserDashboardConfig(initialUserDashboardConfig)
            .then(response => {
                updateUserInContext({ dashboardConfig: response.dashboardConfig });
                console.log("DashboardPage: Config inicial guardada en backend.");
            })
            .catch(err => {
                console.error("DashboardPage: Error guardando config inicial en backend:", err);
            });
      }
    }
  }, [user, apiData.allUserAccounts, isInitialConfigSyncAttempted, updateUserInContext]);


  // --- Guardar configuración del dashboard en backend cuando cambie ---
  const saveDashboardConfigToBackend = useCallback(async (newWidgetOrder, newDisplayedAccountIds) => {
    if (!user || !isInitialConfigSyncAttempted) return; // No guardar si la carga inicial no se intentó o no hay user

    const newConfigToSave = {
        widgetOrder: newWidgetOrder,
        displayedAccountIds: newDisplayedAccountIds
    };

    // Comparar con la config actual del user para evitar guardados innecesarios
    const currentBackendConfig = user.dashboardConfig || {};
    const currentBackendOrder = currentBackendConfig.widgetOrder || [];
    const currentBackendDisplayedIds = currentBackendConfig.displayedAccountIds || [];

    if (JSON.stringify(currentBackendOrder) === JSON.stringify(newWidgetOrder) &&
        JSON.stringify(currentBackendDisplayedIds) === JSON.stringify(newDisplayedAccountIds)) {
        // console.log("DashboardPage: No hay cambios en la configuración del dashboard, no se guarda.");
        return;
    }

    try {
      console.log("DashboardPage: Guardando nueva config en backend:", newConfigToSave);
      const response = await authService.updateUserDashboardConfig(newConfigToSave);
      updateUserInContext({ dashboardConfig: response.dashboardConfig });
      console.log("DashboardPage: Configuración guardada en backend.");
    } catch (err) {
      console.error("DashboardPage: Error guardando configuración en backend:", err);
      setError("No se pudo guardar la configuración del dashboard.");
    }
  }, [user, updateUserInContext, isInitialConfigSyncAttempted]);

  // Efecto para guardar cuando el orden de widgets o las cuentas mostradas cambian
  useEffect(() => {
    if (orderedWidgetsList.length > 0) { // Solo guardar si ya tenemos widgets
      const currentWidgetOrder = orderedWidgetsList.map(w => w.id);
      saveDashboardConfigToBackend(currentWidgetOrder, displayedAccountIds);
    }
  }, [orderedWidgetsList, displayedAccountIds, saveDashboardConfigToBackend]);


  // --- Fetch de datos para los widgets (sin cambios mayores, solo se adapta a la nueva estructura de props) ---
  const fetchDashboardData = useCallback(async (showLoadingIndicators = true) => {
    // ... (lógica de fetch similar a la anterior, usando dashboardService y accountService)
    // Al final, actualiza setApiData
    if (!user) return;
    if (showLoadingIndicators) {
        setApiData(prev => ({ ...prev, 
            loadingInvestments: true, loadingMonthlyStatus: true, 
            loadingAccounts: true, loadingBalanceSummary: true,
            loadingGlobalBudget: true, loadingBalanceTrend: true,
        }));
    }
    setError('');
    try {
      const results = await Promise.allSettled([
        dashboardService.getInvestmentHighlights(3),
        dashboardService.getCurrentMonthFinancialStatus(),
        accountService.getAllAccounts(),
        dashboardService.getDashboardSummary(),
        dashboardService.getGlobalBudgetStatus(),
        dashboardService.getBalanceTrendData({ months: 6 }),
      ]);

      const allAccountsData = results[2].status === 'fulfilled' ? (results[2].value || []) : apiData.allUserAccounts; 
      
      setApiData(prev => ({
        ...prev,
        investmentHighlights: results[0].status === 'fulfilled' ? results[0].value : prev.investmentHighlights,
        monthlyFinancialStatus: results[1].status === 'fulfilled' ? results[1].value : prev.monthlyFinancialStatus,
        allUserAccounts: allAccountsData,
        balanceSummary: results[3].status === 'fulfilled' ? results[3].value : prev.balanceSummary,
        globalBudgetStatus: results[4].status === 'fulfilled' ? results[4].value : prev.globalBudgetStatus,
        balanceTrendData: results[5].status === 'fulfilled' ? results[5].value : prev.balanceTrendData,
      }));

      // ... (manejo de errores de promesas individuales) ...
    } catch (err) { 
      setError('Error general al cargar datos del dashboard.');
      console.error("Error general en fetchDashboardData:", err);
    }
    finally {
      setApiData(prev => ({ ...prev, 
        loadingInvestments: false, loadingMonthlyStatus: false, 
        loadingAccounts: false, loadingBalanceSummary: false,
        loadingGlobalBudget: false, loadingBalanceTrend: false,
      }));
    }
  }, [user]); // apiData.allUserAccounts quitado de aquí

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- Actualizar props de los widgets cuando los datos de la API cambian ---
  useEffect(() => {
    setOrderedWidgetsList(prevWidgets => 
      prevWidgets.map(widget => {
        let newProps = { ...widget.props, key: widget.id }; // Asegurar una key única para el componente
        switch (widget.id) {
          case 'balanceOverview':
            newProps = { ...newProps, summary: apiData.balanceSummary, loading: apiData.loadingBalanceSummary };
            break;
          case 'investmentHighlights':
            newProps = { ...newProps, highlights: apiData.investmentHighlights, loading: apiData.loadingInvestments };
            break;
          case 'controlPanel':
            newProps = {
              ...newProps,
              saldoData: apiData.balanceSummary ? { value: apiData.balanceSummary.totalBalanceARSConverted, currency: 'ARS' } : null,
              flujoData: apiData.monthlyFinancialStatus?.statusByCurrency?.ARS ? { value: apiData.monthlyFinancialStatus.statusByCurrency.ARS.savings, currency: 'ARS' } : null,
              gastadoData: apiData.globalBudgetStatus,
              loading: apiData.loadingBalanceSummary || apiData.loadingMonthlyStatus || apiData.loadingGlobalBudget
            };
            break;
          case 'monthlySavings':
            newProps = { ...newProps, status: apiData.monthlyFinancialStatus, loading: apiData.loadingMonthlyStatus };
            break;
          case 'balanceTrend':
            // La data para balanceTrend ya viene procesada desde el servicio
            newProps = { ...newProps, chartData: apiData.balanceTrendData, loading: apiData.loadingBalanceTrend };
            break;
          case 'spendingChart': 
             // SpendingChart ahora llama a su propio servicio
            newProps = { ...newProps, loading: apiData.loadingMonthlyStatus };
            break;
          case 'recentTransactions': 
            newProps = { ...newProps, loading: apiData.loadingAccounts };
            break;
          default:
            break;
        }
        return { ...widget, props: newProps };
      })
    );
  }, [
      apiData.balanceSummary, apiData.investmentHighlights, apiData.monthlyFinancialStatus, 
      apiData.globalBudgetStatus, apiData.balanceTrendData,
      apiData.loadingBalanceSummary, apiData.loadingInvestments, apiData.loadingMonthlyStatus,
      apiData.loadingGlobalBudget, apiData.loadingBalanceTrend, apiData.loadingAccounts
    ]);

  // --- Lógica para tarjetas de resumen de cuentas (sin cambios mayores) ---
  useEffect(() => {
    if (apiData.allUserAccounts.length > 0) {
      let accountsForDisplay;
      if (displayedAccountIds.length > 0) {
        accountsForDisplay = displayedAccountIds
          .map(id => apiData.allUserAccounts.find(acc => acc.id.toString() === id.toString()))
          .filter(Boolean) 
          .slice(0, MAX_SUMMARY_CARDS_DISPLAY);
      } else { 
        accountsForDisplay = apiData.allUserAccounts
          .filter(acc => acc.includeInDashboardSummary) 
          .slice(0, MAX_SUMMARY_CARDS_DISPLAY);
        if (accountsForDisplay.length === 0 && apiData.allUserAccounts.length > 0) {
            accountsForDisplay = apiData.allUserAccounts.slice(0, MAX_SUMMARY_CARDS_DISPLAY);
        }
      }
      setSummaryAccountsToDisplay(accountsForDisplay);
    } else {
      setSummaryAccountsToDisplay([]);
    }
  }, [displayedAccountIds, apiData.allUserAccounts]);

  // --- Manejadores de DND ---
  const handleDragStart = (event) => {
     setActiveDragId(event.active.id);
  };

  const handleDragEnd = (event) => {
    setActiveDragId(null);
    const { active, over } = event;
  
    if (over && active.id !== over.id) {
      setOrderedWidgetsList((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      // El useEffect [orderedWidgetsList, displayedAccountIds] se encargará de guardar
    }
  };

  const activeDraggedWidgetObject = activeDragId ? orderedWidgetsList.find(w => w.id === activeDragId) : null;
  
  // --- Funciones para el modal de selección de cuentas (sin cambios) ---
  const getAccountCardStyle = (accountName) => { /* ... (sin cambios) ... */ 
    const nameLower = accountName?.toLowerCase() || '';
    if (nameLower.includes('efectivo')) return 'bg-efectivo';
    if (nameLower.includes('icbc') || nameLower.includes('banco galicia')) return 'bg-icbc';
    if (nameLower.includes('uala') || nameLower.includes('mercado pago')) return 'bg-uala';
    return '';
  };
  const accountTypeIcons = {efectivo: '💵', bancaria: '🏦', tarjeta_credito: '💳', inversion: '📈', digital_wallet: '📱', otro: '📁',};

  const handleSaveAccountSelections = (selectedIds) => {
    setDisplayedAccountIds(selectedIds);
    // El useEffect [orderedWidgetsList, displayedAccountIds] se encargará de guardar
    setShowAccountSelectionModal(false);
  };
  
  if (!user && !error && !isInitialConfigSyncAttempted) { 
      return <div className="page-container loading-auth-home">Cargando datos de usuario...</div>;
  }
  if (orderedWidgetsList.length === 0 && !error) {
      return <div className="page-container loading-auth-home">Inicializando dashboard...</div>;
  }


  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      // Measuring strategy puede ser necesario si hay problemas con el tamaño durante el drag
      // measuring={{ droppable: { strategy: MeasuringStrategy.Always } }} 
    >
      <div className="page-container dashboard-page">
        {/* Fila de Resumen de Cuentas (sin cambios) */}
        <div className="accounts-summary-row">
          {apiData.loadingAccounts && summaryAccountsToDisplay.length === 0 ? ( 
            <p className="loading-text-widget" style={{flexGrow: 1, textAlign:'center'}}>Cargando resumen de cuentas...</p> 
          ) : (
            <>
              {summaryAccountsToDisplay.map(acc => ( 
                <AccountSummaryCard 
                  key={acc.id} 
                  account={acc} 
                  bgColorClass={getAccountCardStyle(acc.name)} 
                  icon={accountTypeIcons[acc.type] || acc.icon || '🏦'}
                />
              ))}
              {/* Placeholder para añadir cuenta y personalizar */}
              <AccountSummaryCard onCustomizeClick={() => setShowAccountSelectionModal(true)} /> 
            </>
          )}
        </div>

        {error.trim() && <p className="error-message" style={{marginBottom: '20px'}}>{error.trim()}</p>}
        
        {/* Contenedor Principal de Widgets - AHORA ES EL ÚNICO GRID PARA WIDGETS */}
        <SortableContext items={orderedWidgetsList.map(w => w.id)} strategy={rectSwappingStrategy}>
          <div className="dashboard-widgets-grid-target">
            {orderedWidgetsList.map(widgetItem => (
              <SortableWidget key={widgetItem.id} id={widgetItem.id}>
                {/* Renderizar el componente del widget con sus props actualizadas */}
                <widgetItem.Component {...widgetItem.props} />
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDragId && activeDraggedWidgetObject ? (
          // Estilo del widget mientras se arrastra
          <div className="dashboard-widget" style={{height: '300px', opacity: 0.95, boxShadow: '0 10px 25px rgba(0,0,0,0.2)'}}>
             {React.createElement(activeDraggedWidgetObject.Component, activeDraggedWidgetObject.props)}
          </div>
        ) : null}
      </DragOverlay>

      {showAccountSelectionModal && (
        <AccountDashboardSelectionModal
          isOpen={showAccountSelectionModal}
          onClose={() => setShowAccountSelectionModal(false)}
          allAccounts={apiData.allUserAccounts} 
          currentlyDisplayedAccountIds={displayedAccountIds}
          onSave={handleSaveAccountSelections}
          maxSelection={MAX_SUMMARY_CARDS_DISPLAY}
        />
      )}
    </DndContext>
  );
};

export default DashboardPage;