// Ruta: src/pages/DashboardPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react'; // useCallback añadido
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
  SortableContext,
  sortableKeyboardCoordinates,
  rectSwappingStrategy
} from '@dnd-kit/sortable';

// Hooks personalizados
import { useDashboardData } from '../hooks/useDashboardData';
import { useDashboardConfig } from '../hooks/useDashboardConfig'; 

// Componentes del Dashboard
import AccountSummaryCard from '../components/dashboard/AccountSummaryCard';
import BalanceOverview from '../components/dashboard/BalanceOverview';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import SpendingChart from '../components/dashboard/SpendingChart';
import InvestmentHighlights from '../components/dashboard/InvestmentHighlights';
import MonthlySavingsWidget from '../components/dashboard/MonthlySavingsWidget';
import ControlPanelWidget from '../components/dashboard/ControlPanelWidget';
import BalanceTrendWidget from '../components/dashboard/BalanceTrendWidget';
import SaludFinancieraWidget from '../components/dashboard/SaludFinancieraWidget';
import UpcomingPaymentsWidget from '../components/dashboard/UpcomingPaymentsWidget'; // <--- NUEVO: Importar el widget

import AccountDashboardSelectionModal from '../components/dashboard/AccountDashboardSelectionModal';
import WidgetSelectionModal from '../components/dashboard/WidgetSelectionModal';
import AddWidgetPlaceholder from '../components/dashboard/AddWidgetPlaceholder';
import SortableWidget from '../components/dashboard/SortableWidget';

// Previews para el modal
import SaludFinancieraPreview from '../components/dashboard/previews/SaludFinancieraPreview';
import SpendingChartPreview from '../components/dashboard/previews/SpendingChartPreview';
import BalanceOverviewPreview from '../components/dashboard/previews/BalanceOverviewPreview';
import ControlPanelPreview from '../components/dashboard/previews/ControlPanelPreview';
import InvestmentHighlightsPreview from '../components/dashboard/previews/InvestmentHighlightsPreview';
import MonthlySavingsPreview from '../components/dashboard/previews/MonthlySavingsPreview';
import RecentTransactionsPreview from '../components/dashboard/previews/RecentTransactionsPreview';
import BalanceTrendPreview from '../components/dashboard/previews/BalanceTrendPreview';
import UpcomingPaymentsPreview from '../components/dashboard/previews/UpcomingPaymentsPreview'; // <--- NUEVO: Importar la preview

import './DashboardPage.css';
import '../components/dashboard/DashboardComponents.css';

const ALL_AVAILABLE_WIDGETS = {
  saludFinanciera: { Component: SaludFinancieraWidget, name: 'Salud Financiera General', description: 'Puntuación y métricas clave de tu bienestar financiero.', defaultProps: {}, PreviewComponent: SaludFinancieraPreview },
  upcomingPayments: { Component: UpcomingPaymentsWidget, name: 'Próximos Vencimientos', description: 'Vencimientos de tarjetas, pagos recurrentes, deudas y más.', defaultProps: {}, PreviewComponent: UpcomingPaymentsPreview }, // <--- NUEVO: Widget añadido
  controlPanel: { Component: ControlPanelWidget, name: 'Panel de Control Rápido', description: 'Vista rápida de saldo, flujo y presupuesto.', defaultProps: {}, PreviewComponent: ControlPanelPreview },
  spendingChart: { Component: SpendingChart, name: 'Gastos del Mes por Categoría', description: 'Gráfico de torta mostrando la distribución de tus gastos mensuales.', defaultProps: {}, PreviewComponent: SpendingChartPreview },
  balanceOverview: { Component: BalanceOverview, name: 'Resumen de Balance Total', description: 'Saldo total en ARS, USD y consolidado.', defaultProps: {}, PreviewComponent: BalanceOverviewPreview },
  investmentHighlights: { Component: InvestmentHighlights, name: 'Resumen de Inversiones', description: 'Valor total y principales inversiones.', defaultProps: {}, PreviewComponent: InvestmentHighlightsPreview },
  balanceTrend: { Component: BalanceTrendWidget, name: 'Tendencia del Saldo General', description: 'Evolución de tu saldo total en los últimos meses.', defaultProps: {}, PreviewComponent: BalanceTrendPreview },
  monthlySavings: { Component: MonthlySavingsWidget, name: 'Finanzas del Mes Actual', description: 'Ingresos, egresos y ahorro/déficit del mes corriente.', defaultProps: {}, PreviewComponent: MonthlySavingsPreview },
  recentTransactions: { Component: RecentTransactions, name: 'Últimos Movimientos Registrados', description: 'Lista de tus transacciones más recientes.', defaultProps: {}, PreviewComponent: RecentTransactionsPreview },
};

const getDefaultWidgetOrder = () => [
  'saludFinanciera', 
  'upcomingPayments', // <--- NUEVO: Widget añadido al orden
  'controlPanel',
  'balanceTrend',
  'monthlySavings',
  'spendingChart',
  'balanceOverview',
  'recentTransactions',
  'investmentHighlights',
];

const MAX_SUMMARY_CARDS_DISPLAY = 5;

const DashboardPage = () => {
  const { user } = useAuth(); 
  const { apiData, loadingStates, error: dataApiError, fetchDashboardData } = useDashboardData(); // fetchDashboardData ya estaba, se mantiene

  const {
    masterWidgetOrder, 
    orderedVisibleWidgetsList, 
    visibleWidgetIds,
    displayedAccountIds,
    configError,
    isInitialConfigLoaded, 
    handleDragEndDnd,
    handleSaveWidgetSelections,
    handleSaveAccountSelections,
  } = useDashboardConfig(ALL_AVAILABLE_WIDGETS, getDefaultWidgetOrder, apiData.allUserAccounts);
  
  const [activeDragId, setActiveDragId] = useState(null); 
  const [showAccountSelectionModal, setShowAccountSelectionModal] = useState(false);
  const [showWidgetSelectionModal, setShowWidgetSelectionModal] = useState(false);
  const [summaryAccountsToDisplay, setSummaryAccountsToDisplay] = useState([]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const finalWidgetPropsList = useMemo(() => {
    return orderedVisibleWidgetsList.map(widget => {
      let componentSpecificProps = {}; 
      switch (widget.id) {
        case 'saludFinanciera': 
          componentSpecificProps = { data: apiData.saludFinancieraData, loading: loadingStates.saludFinanciera, error: dataApiError?.saludFinanciera };
          break;
        case 'upcomingPayments': // <--- NUEVO: Caso para el widget
          componentSpecificProps = { events: apiData.upcomingEvents, loading: loadingStates.upcomingEvents, error: dataApiError?.upcomingEvents };
          break;
        case 'balanceOverview':
          componentSpecificProps = { summary: apiData.balanceSummary, loading: loadingStates.balanceSummary, error: dataApiError?.balanceSummary };
          break;
        case 'investmentHighlights':
          componentSpecificProps = { highlights: apiData.investmentHighlights, loading: loadingStates.investments, error: dataApiError?.investmentHighlights };
          break;
        case 'controlPanel':
          componentSpecificProps = {
            saldoData: apiData.balanceSummary ? { value: apiData.balanceSummary.totalBalanceARSConverted, currency: 'ARS' } : null,
            flujoData: apiData.monthlyFinancialStatus?.statusByCurrency?.ARS ? { value: apiData.monthlyFinancialStatus.statusByCurrency.ARS.savings, currency: 'ARS' } : null,
            gastadoData: apiData.globalBudgetStatus,
            loading: loadingStates.balanceSummary || loadingStates.monthlyStatus || loadingStates.globalBudget,
            error: dataApiError?.controlPanel 
          };
          break;
        case 'monthlySavings':
          componentSpecificProps = { status: apiData.monthlyFinancialStatus, loading: loadingStates.monthlyStatus, error: dataApiError?.monthlyFinancialStatus };
          break;
        case 'balanceTrend':
          componentSpecificProps = { chartData: apiData.balanceTrendData, loading: loadingStates.balanceTrend, error: dataApiError?.balanceTrendData };
          break;
        case 'spendingChart': 
          componentSpecificProps = { loading: loadingStates.spendingChart, error: dataApiError?.spendingChart }; 
          break;
        case 'recentTransactions': 
          componentSpecificProps = { loading: loadingStates.recentTransactions, error: dataApiError?.recentTransactions }; 
          break;
        default:
          componentSpecificProps = { ...widget.props };
          break;
      }
      return { ...widget, props: componentSpecificProps }; 
    });
  }, [orderedVisibleWidgetsList, apiData, loadingStates, dataApiError]);


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

  const handleDragStartDndKit = (event) => setActiveDragId(event.active.id); 
  
  const activeDraggedWidgetObject = activeDragId ? finalWidgetPropsList.find(w => w.id === activeDragId) : null;
  
  const getAccountCardStyle = (accountName) => { 
    const nameLower = accountName?.toLowerCase() || '';
    if (nameLower.includes('efectivo')) return 'bg-efectivo';
    if (nameLower.includes('icbc') || nameLower.includes('banco galicia')) return 'bg-icbc';
    if (nameLower.includes('uala') || nameLower.includes('mercado pago')) return 'bg-uala';
    return '';
  };
  const accountTypeIcons = {efectivo: '💵', bancaria: '🏦', tarjeta_credito: '💳', inversion: '📈', digital_wallet: '📱', otro: '📁',};
  
  if (!user && !dataApiError && !isInitialConfigLoaded) { 
      return <div className="page-container loading-auth-home">Cargando datos de usuario...</div>;
  }
  if (!isInitialConfigLoaded && !dataApiError) {
      return <div className="page-container loading-auth-home">Inicializando dashboard...</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStartDndKit}
      onDragEnd={handleDragEndDnd} 
    >
      <div className="page-container dashboard-page">
        {/* Se mantiene la estructura original sin el div.dashboard-header que había eliminado previamente por tu indicación */}
        <div className="accounts-summary-row">
          {loadingStates.accounts && summaryAccountsToDisplay.length === 0 ? ( 
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

        {typeof dataApiError === 'string' && dataApiError && <p className="error-message" style={{marginBottom: '20px'}}>{dataApiError}</p>}
        {typeof dataApiError === 'object' && Object.keys(dataApiError).length > 0 && !dataApiError.general &&
            Object.entries(dataApiError).map(([key, msg]) => (
                msg && <p key={key} className="error-message small-error" style={{marginBottom: '5px'}}>{`Error en ${key}: ${msg}`}</p>
            ))
        }
        {dataApiError?.general && <p className="error-message" style={{marginBottom: '20px'}}>{dataApiError.general}</p>}
        
        {configError && <p className="error-message" style={{marginBottom: '20px'}}>{configError}</p>}
        
        <SortableContext items={finalWidgetPropsList.map(w => w.id)} strategy={rectSwappingStrategy}>
          <div className="dashboard-widgets-grid-target">
            {finalWidgetPropsList.map(widgetItem => (
              <SortableWidget key={widgetItem.id} id={widgetItem.id}>
                <widgetItem.Component {...widgetItem.props} />
              </SortableWidget>
            ))}
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
          allAvailableWidgets={ALL_AVAILABLE_WIDGETS} 
          currentVisibleWidgetIds={visibleWidgetIds} 
          onSave={handleSaveWidgetSelections} 
        />
      )}
    </DndContext>
  );
};

export default DashboardPage;