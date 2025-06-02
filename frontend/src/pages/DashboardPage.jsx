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
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSwappingStrategy
} from '@dnd-kit/sortable';

import AccountSummaryCard from '../components/dashboard/AccountSummaryCard';
import BalanceOverview from '../components/dashboard/BalanceOverview';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import SpendingChart from '../components/dashboard/SpendingChart';
import InvestmentHighlights from '../components/dashboard/InvestmentHighlights';
import MonthlySavingsWidget from '../components/dashboard/MonthlySavingsWidget';
import ControlPanelWidget from '../components/dashboard/ControlPanelWidget';
import BalanceTrendWidget from '../components/dashboard/BalanceTrendWidget';
import AccountDashboardSelectionModal from '../components/dashboard/AccountDashboardSelectionModal';
import WidgetSelectionModal from '../components/dashboard/WidgetSelectionModal';
import AddWidgetPlaceholder from '../components/dashboard/AddWidgetPlaceholder';
import SortableWidget from '../components/dashboard/SortableWidget';

import accountService from '../services/accounts.service';
import dashboardService from '../services/dashboard.service';
import authService from '../services/auth.service';

import './DashboardPage.css';
import '../components/dashboard/DashboardComponents.css';

// Definición de todos los widgets disponibles con nombre y descripción
const ALL_AVAILABLE_WIDGETS = {
  controlPanel: { Component: ControlPanelWidget, name: 'Panel de Control Rápido', description: 'Vista rápida de saldo, flujo y presupuesto.', defaultProps: {} },
  spendingChart: { Component: SpendingChart, name: 'Gastos del Mes por Categoría', description: 'Gráfico de torta mostrando la distribución de tus gastos mensuales.', defaultProps: {} },
  balanceOverview: { Component: BalanceOverview, name: 'Resumen de Balance Total', description: 'Saldo total en ARS, USD y consolidado.', defaultProps: {} },
  investmentHighlights: { Component: InvestmentHighlights, name: 'Resumen de Inversiones', description: 'Valor total y principales inversiones.', defaultProps: {} },
  balanceTrend: { Component: BalanceTrendWidget, name: 'Tendencia del Saldo General', description: 'Evolución de tu saldo total en los últimos meses.', defaultProps: {} },
  monthlySavings: { Component: MonthlySavingsWidget, name: 'Finanzas del Mes Actual', description: 'Ingresos, egresos y ahorro/déficit del mes corriente.', defaultProps: {} },
  recentTransactions: { Component: RecentTransactions, name: 'Últimos Movimientos Registrados', description: 'Lista de tus transacciones más recientes.', defaultProps: {} },
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
  // Esto asegura que si se añade un nuevo widget al código, aparezca para los usuarios.
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

  // Estado para datos de la API
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

  // Estados para la configuración del dashboard
  const [orderedWidgetsList, setOrderedWidgetsList] = useState([]);
  const [visibleWidgetIds, setVisibleWidgetIds] = useState([]); // IDs de widgets visibles
  const [displayedAccountIds, setDisplayedAccountIds] = useState([]); // IDs de cuentas para el resumen superior
  
  // Estado para las tarjetas de resumen de cuentas que se mostrarán efectivamente
  const [summaryAccountsToDisplay, setSummaryAccountsToDisplay] = useState([]);

  // Estados de UI y errores
  const [error, setError] = useState('');
  const [activeDragId, setActiveDragId] = useState(null); // Para DND
  const [showAccountSelectionModal, setShowAccountSelectionModal] = useState(false);
  const [showWidgetSelectionModal, setShowWidgetSelectionModal] = useState(false);
  const [isInitialConfigSyncAttempted, setIsInitialConfigSyncAttempted] = useState(false);

  // Sensores para Drag and Drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Cargar/Sincronizar configuración del dashboard (orden de widgets, widgets visibles, cuentas de resumen)
  useEffect(() => {
    if (user && !isInitialConfigSyncAttempted) {
      setIsInitialConfigSyncAttempted(true);
      let initialWidgetOrder = getDefaultWidgetOrder();
      let initialDisplayedAccounts = [];
      let initialVisibleWidgets = getDefaultWidgetOrder(); // Por defecto, todos los widgets definidos en el orden son visibles

      if (user.dashboardConfig) {
        console.log("DashboardPage: Cargando config del backend:", user.dashboardConfig);
        if (user.dashboardConfig.widgetOrder && user.dashboardConfig.widgetOrder.length > 0) {
          initialWidgetOrder = user.dashboardConfig.widgetOrder;
        }
        initialDisplayedAccounts = user.dashboardConfig.displayedAccountIds || [];
        
        initialVisibleWidgets = (user.dashboardConfig.visibleWidgetIds && user.dashboardConfig.visibleWidgetIds.length > 0)
                                ? user.dashboardConfig.visibleWidgetIds
                                : initialWidgetOrder; 
      }
      
      setOrderedWidgetsList(initializeWidgetsConfig(initialWidgetOrder, ALL_AVAILABLE_WIDGETS));
      setDisplayedAccountIds(initialDisplayedAccounts);
      setVisibleWidgetIds(initialVisibleWidgets);

      if (!user.dashboardConfig && apiData.allUserAccounts.length > 0 && isInitialConfigSyncAttempted) {
        console.log("DashboardPage: No hay config en backend, usando default y guardando.");
        const defaultDisplayedAccountsFromApi = apiData.allUserAccounts
            .filter(acc => acc.includeInDashboardSummary)
            .slice(0, MAX_SUMMARY_CARDS_DISPLAY)
            .map(acc => acc.id.toString());
        
        const initialUserDashboardConfig = {
            widgetOrder: initialWidgetOrder,
            displayedAccountIds: defaultDisplayedAccountsFromApi.length > 0 ? defaultDisplayedAccountsFromApi : initialDisplayedAccounts,
            visibleWidgetIds: initialVisibleWidgets,
        };
        
        setDisplayedAccountIds(initialUserDashboardConfig.displayedAccountIds);
        setVisibleWidgetIds(initialUserDashboardConfig.visibleWidgetIds);

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

  // Guardar configuración del dashboard en backend cuando cambie
  const saveDashboardConfigToBackend = useCallback(async (newWidgetOrder, newDisplayedAccountIds, newVisibleWidgetIds) => {
    if (!user || !isInitialConfigSyncAttempted) return;

    const newConfigToSave = {
        widgetOrder: newWidgetOrder,
        displayedAccountIds: newDisplayedAccountIds,
        visibleWidgetIds: newVisibleWidgetIds,
    };

    const currentBackendConfig = user.dashboardConfig || {};
    const currentBackendOrder = currentBackendConfig.widgetOrder || [];
    const currentBackendDisplayedIds = currentBackendConfig.displayedAccountIds || [];
    const currentBackendVisibleIds = currentBackendConfig.visibleWidgetIds || getDefaultWidgetOrder();

    const orderChanged = JSON.stringify(currentBackendOrder) !== JSON.stringify(newWidgetOrder);
    const displayedIdsChanged = JSON.stringify(currentBackendDisplayedIds.sort()) !== JSON.stringify(newDisplayedAccountIds.sort());
    const visibleIdsChanged = JSON.stringify(currentBackendVisibleIds.sort()) !== JSON.stringify(newVisibleWidgetIds.sort());

    if (!orderChanged && !displayedIdsChanged && !visibleIdsChanged) {
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

  // Efecto para guardar cuando el orden de widgets, los visibles o las cuentas mostradas cambian
  useEffect(() => {
    if (isInitialConfigSyncAttempted && orderedWidgetsList.length > 0) {
      const currentWidgetOrder = orderedWidgetsList.map(w => w.id);
      saveDashboardConfigToBackend(currentWidgetOrder, displayedAccountIds, visibleWidgetIds);
    }
  }, [orderedWidgetsList, displayedAccountIds, visibleWidgetIds, saveDashboardConfigToBackend, isInitialConfigSyncAttempted]);

  // Fetch de datos para los widgets
  const fetchDashboardData = useCallback(async (showLoadingIndicators = true) => {
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
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Actualizar props de los widgets cuando los datos de la API cambian
  useEffect(() => {
    setOrderedWidgetsList(prevWidgets => 
      prevWidgets.map(widget => {
        let newProps = { ...widget.props, key: widget.id }; 
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
            newProps = { ...newProps, chartData: apiData.balanceTrendData, loading: apiData.loadingBalanceTrend };
            break;
          case 'spendingChart': 
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

  // Lógica para tarjetas de resumen de cuentas
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

  // Manejadores de DND
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
    }
  };

  const activeDraggedWidgetObject = activeDragId ? orderedWidgetsList.find(w => w.id === activeDragId) : null;
  
  // Funciones para el modal de selección de cuentas
  const getAccountCardStyle = (accountName) => { 
    const nameLower = accountName?.toLowerCase() || '';
    if (nameLower.includes('efectivo')) return 'bg-efectivo';
    if (nameLower.includes('icbc') || nameLower.includes('banco galicia')) return 'bg-icbc';
    if (nameLower.includes('uala') || nameLower.includes('mercado pago')) return 'bg-uala';
    return '';
  };
  const accountTypeIcons = {efectivo: '💵', bancaria: '🏦', tarjeta_credito: '💳', inversion: '�', digital_wallet: '📱', otro: '📁',};

  const handleSaveAccountSelections = (selectedIds) => {
    setDisplayedAccountIds(selectedIds);
    setShowAccountSelectionModal(false);
  };

  // Funciones para el modal de selección de widgets
  const handleSaveWidgetSelections = (newVisibleIds) => {
    setVisibleWidgetIds(newVisibleIds);
    setShowWidgetSelectionModal(false);
  };
  
  // Estados de carga iniciales
  if (!user && !error && !isInitialConfigSyncAttempted) { 
      return <div className="page-container loading-auth-home">Cargando datos de usuario...</div>;
  }
  if (orderedWidgetsList.length === 0 && !error && !isInitialConfigSyncAttempted) {
      return <div className="page-container loading-auth-home">Inicializando dashboard...</div>;
  }

  // Filtrar los widgets que se van a renderizar
  const widgetsToRender = orderedWidgetsList.filter(widget => visibleWidgetIds.includes(widget.id));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="page-container dashboard-page">
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
              <AccountSummaryCard onCustomizeClick={() => setShowAccountSelectionModal(true)} /> 
            </>
          )}
        </div>

        {error.trim() && <p className="error-message" style={{marginBottom: '20px'}}>{error.trim()}</p>}
        
        <SortableContext items={widgetsToRender.map(w => w.id)} strategy={rectSwappingStrategy}>
          <div className="dashboard-widgets-grid-target">
            {widgetsToRender.map(widgetItem => (
              <SortableWidget key={widgetItem.id} id={widgetItem.id}>
                <widgetItem.Component {...widgetItem.props} />
              </SortableWidget>
            ))}
            {/* Placeholder para añadir/gestionar widgets */}
            <AddWidgetPlaceholder onClick={() => setShowWidgetSelectionModal(true)} />
          </div>
        </SortableContext>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDragId && activeDraggedWidgetObject ? (
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

      {showWidgetSelectionModal && (
        <WidgetSelectionModal
          isOpen={showWidgetSelectionModal}
          onClose={() => setShowWidgetSelectionModal(false)}
          allAvailableWidgets={ALL_AVAILABLE_WIDGETS} // Pasar todos los widgets definidos
          currentVisibleWidgetIds={visibleWidgetIds} // Pasar los IDs actualmente visibles
          onSave={handleSaveWidgetSelections} // Función para guardar la nueva selección
        />
      )}
    </DndContext>
  );
};

export default DashboardPage;