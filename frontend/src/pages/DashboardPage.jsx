// Ruta: src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext'; //
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay, MeasuringStrategy } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

import AccountSummaryCard from '../components/dashboard/AccountSummaryCard'; //
import BalanceOverview from '../components/dashboard/BalanceOverview'; //
import RecentTransactions from '../components/dashboard/RecentTransactions'; //
import SpendingChart from '../components/dashboard/SpendingChart'; //
import InvestmentHighlights from '../components/dashboard/InvestmentHighlights'; //
import MonthlySavingsWidget from '../components/dashboard/MonthlySavingsWidget'; //
import ControlPanelWidget from '../components/dashboard/ControlPanelWidget'; //
import BalanceTrendWidget from '../components/dashboard/BalanceTrendWidget'; //
import AccountDashboardSelectionModal from '../components/dashboard/AccountDashboardSelectionModal'; //
import SortableWidget from '../components/dashboard/SortableWidget'; //

import accountService from '../services/accounts.service'; //
import dashboardService from '../services/dashboard.service'; //
import authService from '../services/auth.service'; //

import './DashboardPage.css'; //
import '../components/dashboard/DashboardComponents.css'; //

const ALL_AVAILABLE_WIDGETS = {
  controlPanel: { Component: ControlPanelWidget, name: 'Panel de Control', defaultProps: {} },
  spendingChart: { Component: SpendingChart, name: 'Gastos del Mes', defaultProps: {} },
  balanceOverview: { Component: BalanceOverview, name: 'Resumen de Balance', defaultProps: {} },
  investmentHighlights: { Component: InvestmentHighlights, name: 'Resumen de Inversiones', defaultProps: {} },
  balanceTrend: { Component: BalanceTrendWidget, name: 'Tendencia del Saldo', defaultProps: {} },
  monthlySavings: { Component: MonthlySavingsWidget, name: 'Finanzas del Mes', defaultProps: {} },
  recentTransactions: { Component: RecentTransactions, name: 'Últimos Registros', defaultProps: {} },
};

const getDefaultWidgetLayout = () => ({
  left: ['controlPanel', 'spendingChart', 'balanceOverview', 'investmentHighlights'],
  right: ['balanceTrend', 'monthlySavings', 'recentTransactions'],
});

const getDefaultWidgetConfig = (layout) => {
    const config = { left: [], right: [] };
    const currentLayout = layout || getDefaultWidgetLayout(); // Usar layout provisto o el default

    currentLayout.left.forEach(id => {
        if (ALL_AVAILABLE_WIDGETS[id]) {
            config.left.push({ id, ...ALL_AVAILABLE_WIDGETS[id], props: { loading: true } });
        }
    });
    currentLayout.right.forEach(id => {
        if (ALL_AVAILABLE_WIDGETS[id]) {
            config.right.push({ id, ...ALL_AVAILABLE_WIDGETS[id], props: { loading: true } });
        }
    });
    
    Object.keys(ALL_AVAILABLE_WIDGETS).forEach(widgetId => {
        if (!config.left.find(w => w.id === widgetId) && !config.right.find(w => w.id === widgetId)) {
            // Añadir a la columna derecha por defecto si falta
            config.right.push({ id: widgetId, ...ALL_AVAILABLE_WIDGETS[widgetId], props: { loading: true } });
        }
    });
    return config;
};

const MAX_SUMMARY_CARDS_DISPLAY = 5; 

const DashboardPage = () => {
  const { user, updateUserInContext } = useAuth(); //
  
  // *** CORRECCIÓN EN LA INICIALIZACIÓN DE apiData ***
  const [apiData, setApiData] = useState({
    investmentHighlights: null,
    monthlyFinancialStatus: null,
    balanceSummary: null, 
    allUserAccounts: [], // <--- Inicializar como array vacío
    globalBudgetStatus: null,
    balanceTrendData: null,
    // Estados de carga iniciales
    loadingAccounts: true,
    loadingInvestments: true,
    loadingMonthlyStatus: true,
    loadingBalanceSummary: true,
    loadingGlobalBudget: true,
    loadingBalanceTrend: true,
  });
  const [displayedAccountIds, setDisplayedAccountIds] = useState([]);
  const [summaryAccountsToDisplay, setSummaryAccountsToDisplay] = useState([]);
  
  // Inicializar widgetConfig usando el user.dashboardConfig si existe, o un default
  const [widgetConfig, setWidgetConfig] = useState(() => {
      if (user && user.dashboardConfig && user.dashboardConfig.widgetLayout) {
          return getDefaultWidgetConfig(user.dashboardConfig.widgetLayout);
      }
      return getDefaultWidgetConfig(null); // Usará el layout por defecto interno
  });


  const [error, setError] = useState('');
  const [activeDragId, setActiveDragId] = useState(null);
  const [showAccountSelectionModal, setShowAccountSelectionModal] = useState(false);
  const [isInitialConfigSyncAttempted, setIsInitialConfigSyncAttempted] = useState(false);


  // Efecto para cargar/sincronizar configuración del dashboard desde/hacia el backend
  useEffect(() => {
    if (user && !isInitialConfigSyncAttempted) {
      setIsInitialConfigSyncAttempted(true); // Marcar que hemos intentado la sincronización
      if (user.dashboardConfig) {
        console.log("DashboardPage: Cargando config del backend:", user.dashboardConfig);
        setWidgetConfig(getDefaultWidgetConfig(user.dashboardConfig.widgetLayout));
        setDisplayedAccountIds(user.dashboardConfig.displayedAccountIds || []);
      } else if (apiData.allUserAccounts.length > 0) { // Solo intentar guardar si ya tenemos cuentas
        console.log("DashboardPage: No hay config en backend, usando default y guardando.");
        const defaultConfigLayout = getDefaultWidgetLayout();
        const defaultDisplayedAccounts = apiData.allUserAccounts
            .filter(acc => acc.includeInDashboardSummary)
            .slice(0, MAX_SUMMARY_CARDS_DISPLAY)
            .map(acc => acc.id.toString());

        const initialUserDashboardConfig = {
            widgetLayout: defaultConfigLayout,
            displayedAccountIds: defaultDisplayedAccounts,
        };
        
        setWidgetConfig(getDefaultWidgetConfig(defaultConfigLayout)); // Aplicar al estado local
        setDisplayedAccountIds(defaultDisplayedAccounts); // Aplicar al estado local

        authService.updateUserDashboardConfig(initialUserDashboardConfig) //
            .then(response => {
                updateUserInContext({ dashboardConfig: response.dashboardConfig }); //
                console.log("DashboardPage: Config inicial guardada en backend.");
            })
            .catch(err => {
                console.error("DashboardPage: Error guardando config inicial en backend:", err);
                // No mostrar error al usuario por esto, podría ser un problema menor de sincronización inicial
            });
      }
    }
  }, [user, apiData.allUserAccounts, isInitialConfigSyncAttempted, updateUserInContext]);


  const saveDashboardConfigToBackend = useCallback(async (newWidgetConfigLayout, newDisplayedAccountIds) => {
    if (!user) return;
    // Solo guardar si la configuración ha cambiado realmente respecto a lo que tiene el usuario en el contexto
    const currentBackendConfig = user.dashboardConfig;
    const newConfigToSave = {
        widgetLayout: newWidgetConfigLayout,
        displayedAccountIds: newDisplayedAccountIds
    };

    // Comparación simple (podría ser más profunda si es necesario)
    if (JSON.stringify(currentBackendConfig) === JSON.stringify(newConfigToSave)) {
        // console.log("DashboardPage: No hay cambios en la configuración del dashboard, no se guarda.");
        return;
    }

    try {
      console.log("DashboardPage: Guardando nueva config en backend:", newConfigToSave);
      const response = await authService.updateUserDashboardConfig(newConfigToSave); //
      updateUserInContext({ dashboardConfig: response.dashboardConfig }); //
      console.log("DashboardPage: Configuración guardada en backend.");
    } catch (err) {
      console.error("DashboardPage: Error guardando configuración en backend:", err);
      setError("No se pudo guardar la configuración del dashboard.");
    }
  }, [user, updateUserInContext]);

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
        dashboardService.getInvestmentHighlights(3), //
        dashboardService.getCurrentMonthFinancialStatus(), //
        accountService.getAllAccounts(), //
        dashboardService.getDashboardSummary(), //
        dashboardService.getGlobalBudgetStatus(), //
        dashboardService.getBalanceTrendData({ months: 6 }), //
      ]);

      const allAccountsData = results[2].status === 'fulfilled' ? (results[2].value || []) : apiData.allUserAccounts; 
      
      setApiData(prev => ({
        ...prev,
        investmentHighlights: results[0].status === 'fulfilled' ? results[0].value : prev.investmentHighlights,
        monthlyFinancialStatus: results[1].status === 'fulfilled' ? results[1].value : prev.monthlyFinancialStatus,
        allUserAccounts: allAccountsData, // Este se actualiza aquí
        balanceSummary: results[3].status === 'fulfilled' ? results[3].value : prev.balanceSummary,
        globalBudgetStatus: results[4].status === 'fulfilled' ? results[4].value : prev.globalBudgetStatus,
        balanceTrendData: results[5].status === 'fulfilled' ? results[5].value : prev.balanceTrendData,
      }));

      if (results[0].status !== 'fulfilled') console.error("Error fetching investment highlights:", results[0].reason);
      if (results[1].status !== 'fulfilled') console.error("Error fetching monthly financial status:", results[1].reason);
      if (results[2].status !== 'fulfilled') console.error("Error fetching accounts for summary cards:", results[2].reason);
      if (results[3].status !== 'fulfilled') console.error("Error fetching balance summary:", results[3].reason);
      if (results[4].status !== 'fulfilled') console.error("Error fetching global budget status:", results[4].reason);
      if (results[5].status !== 'fulfilled') console.error("Error fetching balance trend data:", results[5].reason);

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
  }, [user]); // apiData.allUserAccounts quitado de aquí porque se actualiza dentro

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); 
  
  useEffect(() => {
    // Este efecto actualiza las props de los widgets cuando cambian los datos de la API
    setWidgetConfig(prevConfig => {
      const updatePropsForColumn = (columnArray) => columnArray.map(widget => {
        let newProps = { ...widget.props }; 
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
            newProps = { ...newProps, loading: apiData.loadingMonthlyStatus }; // Se actualiza cuando monthlyFinancialStatus (y sus datos base) se actualizan
            break;
          case 'recentTransactions': 
             newProps = { ...newProps, loading: apiData.loadingAccounts }; // Se actualiza cuando las cuentas/transacciones generales se actualizan
            break;
          default:
            break;
        }
        return { ...widget, props: newProps };
      });

      // Solo reconstruir si prevConfig existe (evitar error en montaje inicial si widgetConfig es null)
      if (!prevConfig || !prevConfig.left || !prevConfig.right) {
          return getDefaultWidgetConfig(user?.dashboardConfig?.widgetLayout);
      }
      
      return {
        left: updatePropsForColumn(prevConfig.left),
        right: updatePropsForColumn(prevConfig.right),
      };
    });
  }, [
      apiData.balanceSummary, apiData.investmentHighlights, apiData.monthlyFinancialStatus, 
      apiData.globalBudgetStatus, apiData.balanceTrendData,
      apiData.loadingBalanceSummary, apiData.loadingInvestments, apiData.loadingMonthlyStatus,
      apiData.loadingGlobalBudget, apiData.loadingBalanceTrend, apiData.loadingAccounts,
      user // Añadir user para que se re-evalúe si user.dashboardConfig cambia
    ]);


  useEffect(() => {
    // Este efecto actualiza las cuentas que se muestran en las tarjetas de resumen
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


  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  const findWidgetAndContainerKey = (id, configToSearch) => {
    for (const containerKey of ['left', 'right']) {
      const widgetIndex = configToSearch[containerKey].findIndex(w => w.id === id);
      if (widgetIndex > -1) {
        return { containerKey, index: widgetIndex };
      }
    }
    return { containerKey: null, index: -1 };
  };

  const handleDragStart = (event) => {
     setActiveDragId(event.active.id);
  };

  const handleDragEnd = (event) => {
    setActiveDragId(null);
    const { active, over } = event;
  
    if (!over || !active.id || !over.id) { // Chequeo más robusto
      console.log("DRAG_END_DEBUG: No 'over' o 'active.id' o 'over.id'. Event:", event);
      return;
    }
  
    const activeId = active.id;
    const overId = over.id; 
    
    let newWidgetConfigState; // Para almacenar el estado que se pasará a saveDashboardConfigToBackend

    setWidgetConfig((prevConfig) => {
      const { containerKey: sourceContainerKey, index: sourceIndex } = findWidgetAndContainerKey(activeId, prevConfig);
      if (sourceContainerKey === null || sourceIndex === -1) {
          console.warn("DRAG_END_DEBUG: Source widget not found in prevConfig:", activeId);
          return prevConfig;
      }
  
      let targetContainerKey;
      let targetInsertionIndex; 
      const { containerKey: overItemContainer, index: overItemIndexIfItem } = findWidgetAndContainerKey(overId, prevConfig);
      
      if (activeId === overId && (!over.data?.current?.sortable?.containerId || over.data?.current?.sortable?.containerId === sourceContainerKey) ) {
         console.log("DRAG_END_DEBUG: Dropped on itself or its original container area without changing item. No change.");
         return prevConfig;
      }

      if (overItemContainer) { // Si se suelta sobre otro widget
        targetContainerKey = overItemContainer;
        targetInsertionIndex = overItemIndexIfItem;
      } else { // Si se suelta sobre un área droppable (columna)
        const overContainerDroppableId = over.data?.current?.sortable?.containerId || overId;
        
        if (overContainerDroppableId === 'left-column-droppable') {
          targetContainerKey = 'left';
          targetInsertionIndex = prevConfig.left.length; // Por defecto al final
        } else if (overContainerDroppableId === 'right-column-droppable') {
          targetContainerKey = 'right';
          targetInsertionIndex = prevConfig.right.length; // Por defecto al final
        } else {
          console.warn("DRAG_END_DEBUG: Cannot determine drop target container. Over.id:", overId);
          return prevConfig;
        }
      }
      
      const itemToMove = prevConfig[sourceContainerKey][sourceIndex];
      if (!itemToMove || itemToMove.id !== activeId) {
          console.error("DRAG_END_DEBUG: Mismatch itemToMove or ID.", { activeId, itemIdentified: itemToMove });
          return prevConfig;
      }
      
      let newLeft = [...prevConfig.left];
      let newRight = [...prevConfig.right];

      if (sourceContainerKey === targetContainerKey) {
        if (targetContainerKey === 'left') {
          newLeft = arrayMove(prevConfig.left, sourceIndex, targetInsertionIndex);
        } else { 
          newRight = arrayMove(prevConfig.right, sourceIndex, targetInsertionIndex);
        }
      } else {
        if (sourceContainerKey === 'left') {
          newLeft.splice(sourceIndex, 1);
        } else { 
          newRight.splice(sourceIndex, 1);
        }
        if (targetContainerKey === 'left') {
          const finalInsertionIndexLeft = Math.min(targetInsertionIndex, newLeft.length);
          newLeft.splice(finalInsertionIndexLeft, 0, itemToMove);
        } else { 
          const finalInsertionIndexRight = Math.min(targetInsertionIndex, newRight.length);
          newRight.splice(finalInsertionIndexRight, 0, itemToMove);
        }
      }
      
      newWidgetConfigState = { left: newLeft, right: newRight }; // Guardar el estado para usarlo después
      return newWidgetConfigState;
    });
    
    // Llamar a guardar después de que el estado se haya actualizado
    // Esto requiere que `newWidgetConfigState` se obtenga del callback de setWidgetConfig
    // o que `saveDashboardConfigToBackend` se llame en un useEffect que dependa de widgetConfig.
    // La segunda opción es más limpia (ya implementada).
  };

  // useEffect para guardar en backend cuando widgetConfig (orden) o displayedAccountIds cambian
  useEffect(() => {
    if (user && isInitialConfigSyncAttempted) { // Solo guardar si ya se intentó la sincronización inicial
        const currentLayout = {
            left: widgetConfig.left.map(w => w.id),
            right: widgetConfig.right.map(w => w.id),
        };
        // Evitar guardar si el widgetConfig aún no está completamente cargado con props (para evitar sobrescribir con estado de 'loading')
        // Esto es una heurística, podría necesitar ajustes.
        const isLoadingAnyWidget = widgetConfig.left.some(w => w.props.loading) || widgetConfig.right.some(w => w.props.loading);
        if (user.dashboardConfig || !isLoadingAnyWidget) { // Si ya hay config en backend, o si no estamos en carga inicial de widgets
            saveDashboardConfigToBackend(currentLayout, displayedAccountIds);
        }
    }
  }, [widgetConfig, displayedAccountIds, saveDashboardConfigToBackend, user, isInitialConfigSyncAttempted]);


  const getAccountCardStyle = (accountName) => {
    const nameLower = accountName?.toLowerCase() || '';
    if (nameLower.includes('efectivo')) return 'bg-efectivo';
    if (nameLower.includes('icbc') || nameLower.includes('banco galicia')) return 'bg-icbc';
    if (nameLower.includes('uala') || nameLower.includes('mercado pago')) return 'bg-uala';
    return '';
  };
  const accountTypeIcons = {efectivo: '💵', bancaria: '🏦', tarjeta_credito: '💳', inversion: '📈', digital_wallet: '📱', otro: '📁',};

  const handleSaveAccountSelections = (selectedIds) => {
    setDisplayedAccountIds(selectedIds); // El useEffect anterior se encargará de guardar
    setShowAccountSelectionModal(false);
  };

  const activeDraggedWidgetObject = activeDragId ? (widgetConfig.left.find(w => w.id === activeDragId) || widgetConfig.right.find(w => w.id === activeDragId)) : null;
  
  if (!user && !error) { 
      return <div className="page-container loading-auth-home">Cargando datos de usuario...</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
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
        
        <div className="dashboard-widgets-grid-target">
          <SortableContext items={widgetConfig.left.map(w => w.id)} strategy={verticalListSortingStrategy} id="left-column-droppable">
            <div className="dashboard-main-column-target" id="main-column-target">
              {widgetConfig.left.map(widgetItem => (
                <SortableWidget key={widgetItem.id} id={widgetItem.id}>
                  <widgetItem.Component {...widgetItem.props} />
                </SortableWidget>
              ))}
            </div>
          </SortableContext>

          <SortableContext items={widgetConfig.right.map(w => w.id)} strategy={verticalListSortingStrategy} id="right-column-droppable">
            <div className="dashboard-sidebar-column-target" id="sidebar-column-target">
              {widgetConfig.right.map(widgetItem => (
                <SortableWidget key={widgetItem.id} id={widgetItem.id}>
                  <widgetItem.Component {...widgetItem.props} />
                </SortableWidget>
              ))}
            </div>
          </SortableContext>
        </div>
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
    </DndContext>
  );
};

export default DashboardPage;