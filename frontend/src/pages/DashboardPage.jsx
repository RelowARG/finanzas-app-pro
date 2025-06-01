// Ruta: src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext'; // [cite: finanzas-app-pro/frontend/src/contexts/AuthContext.jsx]

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import AccountSummaryCard from '../components/dashboard/AccountSummaryCard'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/AccountSummaryCard.jsx]
import BalanceOverview from '../components/dashboard/BalanceOverview'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/BalanceOverview.jsx]
import RecentTransactions from '../components/dashboard/RecentTransactions'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/RecentTransactions.jsx]
import SpendingChart from '../components/dashboard/SpendingChart'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/SpendingChart.jsx]
import InvestmentHighlights from '../components/dashboard/InvestmentHighlights'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/InvestmentHighlights.jsx]
import MonthlySavingsWidget from '../components/dashboard/MonthlySavingsWidget'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.jsx]
import ControlPanelWidget from '../components/dashboard/ControlPanelWidget'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/ControlPanelWidget.jsx]
import BalanceTrendWidget from '../components/dashboard/BalanceTrendWidget'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/BalanceTrendWidget.jsx]
import AccountDashboardSelectionModal from '../components/dashboard/AccountDashboardSelectionModal'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/AccountDashboardSelectionModal.jsx]
import SortableWidget from '../components/dashboard/SortableWidget'; // *** IMPORTACIÓN AÑADIDA/VERIFICADA *** [cite: finanzas-app-pro/frontend/src/components/dashboard/SortableWidget.jsx]

import accountService from '../services/accounts.service'; // [cite: finanzas-app-pro/frontend/src/services/accounts.service.js]
import dashboardService from '../services/dashboard.service'; // [cite: finanzas-app-pro/frontend/src/services/dashboard.service.js]

import './DashboardPage.css'; // [cite: finanzas-app-pro/frontend/src/pages/DashboardPage.css]
import '../components/dashboard/DashboardComponents.css'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css]

const ALL_AVAILABLE_WIDGETS = {
  controlPanel: { Component: ControlPanelWidget, name: 'Panel de Control', defaultProps: {} },
  spendingChart: { Component: SpendingChart, name: 'Gastos del Mes', defaultProps: {} },
  balanceOverview: { Component: BalanceOverview, name: 'Resumen de Balance', defaultProps: {} },
  investmentHighlights: { Component: InvestmentHighlights, name: 'Resumen de Inversiones', defaultProps: {} },
  balanceTrend: { Component: BalanceTrendWidget, name: 'Tendencia del Saldo', defaultProps: {} },
  monthlySavings: { Component: MonthlySavingsWidget, name: 'Finanzas del Mes', defaultProps: {} },
  recentTransactions: { Component: RecentTransactions, name: 'Últimos Registros', defaultProps: {} },
};

const getDefaultWidgetConfig = () => ({
  left: [
    { id: 'controlPanel', ...ALL_AVAILABLE_WIDGETS.controlPanel, props: { saldoData: null, flujoData: null, gastadoData: null, loading: true } },
    { id: 'spendingChart', ...ALL_AVAILABLE_WIDGETS.spendingChart, props: { loading: true } },
    { id: 'balanceOverview', ...ALL_AVAILABLE_WIDGETS.balanceOverview, props: { summary: null, loading: true } },
    { id: 'investmentHighlights', ...ALL_AVAILABLE_WIDGETS.investmentHighlights, props: { highlights: null, loading: true } },
  ],
  right: [
    { id: 'balanceTrend', ...ALL_AVAILABLE_WIDGETS.balanceTrend, props: { chartData: null, loading: true } },
    { id: 'monthlySavings', ...ALL_AVAILABLE_WIDGETS.monthlySavings, props: { status: null, loading: true } },
    { id: 'recentTransactions', ...ALL_AVAILABLE_WIDGETS.recentTransactions, props: { loading: true } },
  ],
});

const LOCAL_STORAGE_KEY_WIDGET_ORDER = 'dashboardWidgetOrder';
const LOCAL_STORAGE_KEY_DISPLAYED_ACCOUNTS = 'dashboardDisplayedAccounts';
const MAX_SUMMARY_CARDS_DISPLAY = 5; 

const DashboardPage = () => {
  const { user } = useAuth(); 
  
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
  const [displayedAccountIds, setDisplayedAccountIds] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_DISPLAYED_ACCOUNTS);
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error parsing displayed accounts from localStorage", e);
      return [];
    }
  });
  const [summaryAccountsToDisplay, setSummaryAccountsToDisplay] = useState([]);


  const [error, setError] = useState('');
  const [activeDragId, setActiveDragId] = useState(null);
  const [showAccountSelectionModal, setShowAccountSelectionModal] = useState(false);

  const [widgetConfig, setWidgetConfig] = useState(() => {
    const savedOrder = localStorage.getItem(LOCAL_STORAGE_KEY_WIDGET_ORDER);
    let initialConfig = getDefaultWidgetConfig();
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        const loadedConfig = { left: [], right: [] };
        const foundIds = new Set();

        ['left', 'right'].forEach(columnKey => {
          if (parsedOrder[columnKey] && Array.isArray(parsedOrder[columnKey])) {
            parsedOrder[columnKey].forEach(widgetId => {
              if (ALL_AVAILABLE_WIDGETS[widgetId] && !foundIds.has(widgetId)) {
                const defaultWidgetForProps = initialConfig.left.find(w => w.id === widgetId) || initialConfig.right.find(w => w.id === widgetId);
                loadedConfig[columnKey].push({
                  id: widgetId,
                  ...ALL_AVAILABLE_WIDGETS[widgetId],
                  props: defaultWidgetForProps ? { ...defaultWidgetForProps.props } : { loading: true },
                });
                foundIds.add(widgetId);
              }
            });
          }
        });

        ['left', 'right'].forEach(colKey => {
            initialConfig[colKey].forEach(defaultWidget => {
                if (!foundIds.has(defaultWidget.id)) {
                    const targetColumn = (initialConfig.left.find(w => w.id === defaultWidget.id) && loadedConfig.left.length < 4) ? 'left' : 'right';
                    if (!loadedConfig.left.find(w=>w.id === defaultWidget.id) && !loadedConfig.right.find(w=>w.id === defaultWidget.id)) {
                         loadedConfig[targetColumn].push({
                            id: defaultWidget.id,
                            Component: defaultWidget.Component,
                            name: defaultWidget.name,
                            props: { ...defaultWidget.props } 
                        });
                        foundIds.add(defaultWidget.id);
                    }
                }
            });
        });
        
        if (loadedConfig.left.length === 0 && loadedConfig.right.length === 0 && foundIds.size < Object.keys(ALL_AVAILABLE_WIDGETS).length) {
            console.warn("Loaded config from localStorage was empty or incomplete, reverting to default.");
            return initialConfig;
        }
        return loadedConfig;

      } catch (e) {
        console.error("Error parsing saved widget order from localStorage, using default.", e);
        return initialConfig;
      }
    }
    return initialConfig;
  });

  useEffect(() => {
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
            newProps = { ...newProps, loading: apiData.loadingMonthlyStatus }; 
            break;
          case 'recentTransactions': 
             newProps = { ...newProps, loading: apiData.loadingAccounts }; 
            break;
          default:
            break;
        }
        return { ...widget, props: newProps };
      });

      return {
        left: updatePropsForColumn(prevConfig.left),
        right: updatePropsForColumn(prevConfig.right),
      };
    });
  }, [
      apiData.balanceSummary, apiData.investmentHighlights, apiData.monthlyFinancialStatus, 
      apiData.globalBudgetStatus, apiData.balanceTrendData,
      apiData.loadingBalanceSummary, apiData.loadingInvestments, apiData.loadingMonthlyStatus,
      apiData.loadingGlobalBudget, apiData.loadingBalanceTrend, apiData.loadingAccounts
    ]);


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
  }, [user]); 

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); 
  
  useEffect(() => {
    const orderToSave = {
      left: widgetConfig.left.map(w => w.id),
      right: widgetConfig.right.map(w => w.id),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY_WIDGET_ORDER, JSON.stringify(orderToSave));
  }, [widgetConfig]);

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
  
    if (!over) {
      console.log("DRAG_END_DEBUG: No 'over' target.");
      return;
    }
  
    const activeId = active.id;
    const overId = over.id; 
  
    setWidgetConfig((prevConfig) => {
      const { containerKey: sourceContainerKey, index: sourceIndex } = findWidgetAndContainerKey(activeId, prevConfig);
  
      if (sourceContainerKey === null || sourceIndex === -1) {
        console.warn("DRAG_END_DEBUG: Source widget not found in prevConfig:", activeId, "PrevConfig:", prevConfig);
        return prevConfig;
      }
  
      let targetContainerKey;
      let targetInsertionIndex; 
  
      const { containerKey: overItemContainer, index: overItemIndexIfItem } = findWidgetAndContainerKey(overId, prevConfig);
      
      if (activeId === overId && !over.data?.current?.sortable?.containerId ) {
         if(over.data?.current?.sortable?.containerId === sourceContainerKey){
            console.log("DRAG_END_DEBUG: Dropped on itself within same container. No change.");
            return prevConfig;
         }
      }

      if (overItemContainer) {
        targetContainerKey = overItemContainer;
        targetInsertionIndex = overItemIndexIfItem;
        console.log(`DRAG_END_DEBUG: Target is ITEM ${overId} in ${targetContainerKey} at index ${targetInsertionIndex}`);
      } else {
        const overContainerDroppableId = over.data?.current?.sortable?.containerId || overId;
        const overItemIdWithinSortableContext = over.data?.current?.sortable?.id;
        
        console.log(`DRAG_END_DEBUG: Target is CONTAINER AREA. overContainerId: ${overContainerDroppableId}, itemInContext: ${overItemIdWithinSortableContext}`);

        if (overContainerDroppableId === 'left-column-droppable') {
          targetContainerKey = 'left';
          targetInsertionIndex = overItemIdWithinSortableContext 
            ? prevConfig.left.findIndex(w => w.id === overItemIdWithinSortableContext) 
            : prevConfig.left.length; 
          if (targetInsertionIndex === -1) targetInsertionIndex = prevConfig.left.length; 
        } else if (overContainerDroppableId === 'right-column-droppable') {
          targetContainerKey = 'right';
          targetInsertionIndex = overItemIdWithinSortableContext 
            ? prevConfig.right.findIndex(w => w.id === overItemIdWithinSortableContext) 
            : prevConfig.right.length;
          if (targetInsertionIndex === -1) targetInsertionIndex = prevConfig.right.length;
        } else {
          console.warn("DRAG_END_DEBUG: Cannot determine drop target container. Over.id:", overId, "Full 'over' object:", over);
          return prevConfig;
        }
        console.log(`DRAG_END_DEBUG: Target resolved to CONTAINER ${targetContainerKey}, insertionIndex: ${targetInsertionIndex}`);
      }
      
      const itemToMove = prevConfig[sourceContainerKey][sourceIndex];
      
      if (!itemToMove || itemToMove.id !== activeId) {
        console.error("DRAG_END_DEBUG: CRITICAL - Failed to correctly identify itemToMove or ID mismatch.", { activeId, itemIdentified: itemToMove });
        return prevConfig;
      }
      
      let newLeft = [...prevConfig.left];
      let newRight = [...prevConfig.right];

      if (sourceContainerKey === targetContainerKey) {
        console.log(`DRAG_END_DEBUG: Reordering in ${sourceContainerKey}. From ${sourceIndex} to ${targetInsertionIndex}. Item: ${itemToMove.id}`);
        if (targetContainerKey === 'left') {
          newLeft = arrayMove(prevConfig.left, sourceIndex, targetInsertionIndex);
        } else { 
          newRight = arrayMove(prevConfig.right, sourceIndex, targetInsertionIndex);
        }
      } else {
        console.log(`DRAG_END_DEBUG: Moving ${itemToMove.id} from ${sourceContainerKey} to ${targetContainerKey} at index ${targetInsertionIndex}`);
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
      
      const finalLeftIds = newLeft.map(w => w.id);
      const finalRightIds = newRight.map(w => w.id);
      const combinedIds = [...finalLeftIds, ...finalRightIds];
      const uniqueCombinedIds = new Set(combinedIds);

      if (combinedIds.length !== uniqueCombinedIds.size) {
          console.error("DRAG_END_DEBUG: Duplicate widget IDs DETECTED after proposed move! ABORTING state update.", {
              finalLeftIds, finalRightIds,
              activeId, sourceContainerKey, sourceIndex, targetContainerKey, targetInsertionIndex
          });
          return prevConfig; 
      }

      console.log("DRAG_END_DEBUG: Final Left IDs:", finalLeftIds);
      console.log("DRAG_END_DEBUG: Final Right IDs:", finalRightIds);
  
      return { left: newLeft, right: newRight };
    });
  };
  
  const getAccountCardStyle = (accountName) => {
    const nameLower = accountName?.toLowerCase() || '';
    if (nameLower.includes('efectivo')) return 'bg-efectivo';
    if (nameLower.includes('icbc') || nameLower.includes('banco galicia')) return 'bg-icbc';
    if (nameLower.includes('uala') || nameLower.includes('mercado pago')) return 'bg-uala';
    return '';
  };
  const accountTypeIcons = {efectivo: '💵', bancaria: '🏦', tarjeta_credito: '💳', inversion: '📈', digital_wallet: '📱', otro: '📁',};

  const handleSaveAccountSelections = (selectedIds) => {
    console.log("DashboardPage: Saving displayed account IDs", selectedIds);
    setDisplayedAccountIds(selectedIds);
    localStorage.setItem(LOCAL_STORAGE_KEY_DISPLAYED_ACCOUNTS, JSON.stringify(selectedIds));
  };

  const activeDraggedWidgetObject = activeDragId ? (widgetConfig.left.find(w => w.id === activeDragId) || widgetConfig.right.find(w => w.id === activeDragId)) : null;
  
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
          {apiData.loadingAccounts ? ( <p className="loading-text-widget" style={{flexGrow: 1, textAlign:'center'}}>Cargando cuentas...</p> ) : (
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
              {/* Ya no se necesita AddCardPlaceholder aquí */}
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
