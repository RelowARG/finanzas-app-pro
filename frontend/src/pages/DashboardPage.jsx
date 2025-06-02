// Ruta: src/pages/DashboardPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import UpcomingPaymentsWidget from '../components/dashboard/UpcomingPaymentsWidget';
import SavingsGoalsWidget from '../components/dashboard/SavingsGoalsWidget';

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
import UpcomingPaymentsPreview from '../components/dashboard/previews/UpcomingPaymentsPreview';
import SavingsGoalsPreview from '../components/dashboard/previews/SavingsGoalsPreview';

import './DashboardPage.css';
import '../components/dashboard/DashboardComponents.css';

// *** DESCRIPCIONES DE WIDGETS MEJORADAS ***
const ALL_AVAILABLE_WIDGETS = {
  saludFinanciera: { 
    Component: SaludFinancieraWidget, 
    name: 'Salud Financiera General', 
    description: 'Evalúa tu bienestar financiero general con una puntuación y métricas clave como tasa de ahorro, fondo de emergencia y nivel de endeudamiento.', 
    defaultProps: {}, 
    PreviewComponent: SaludFinancieraPreview 
  },
  upcomingPayments: { 
    Component: UpcomingPaymentsWidget, 
    name: 'Próximos Vencimientos', 
    description: 'Anticipa tus próximos pagos: vencimientos de tarjetas, cuotas de préstamos, servicios recurrentes y más, para los siguientes 15 días.', 
    defaultProps: {}, 
    PreviewComponent: UpcomingPaymentsPreview 
  },
  savingsGoals: { 
    Component: SavingsGoalsWidget, 
    name: 'Metas de Ahorro', 
    description: 'Visualiza el progreso de tus metas de ahorro activas. Muestra cuánto has ahorrado y cuánto te falta para alcanzar cada objetivo.', 
    defaultProps: {}, 
    PreviewComponent: SavingsGoalsPreview 
  },
  controlPanel: { 
    Component: ControlPanelWidget, 
    name: 'Panel de Control Rápido', 
    description: 'Un vistazo rápido a cifras clave: tu saldo actual total, el flujo de dinero (ingresos vs. egresos) del mes y cómo vas con tu presupuesto general.', 
    defaultProps: {}, 
    PreviewComponent: ControlPanelPreview 
  },
  spendingChart: { 
    Component: SpendingChart, 
    name: 'Gastos del Mes por Categoría', 
    description: 'Entiende en qué estás gastando tu dinero este mes. Un gráfico de torta muestra la distribución de tus egresos por cada categoría.', 
    defaultProps: {}, 
    PreviewComponent: SpendingChartPreview 
  },
  balanceOverview: { 
    Component: BalanceOverview, 
    name: 'Resumen de Balance Total', 
    description: 'Muestra la suma de los saldos de tus cuentas (incluidas en el resumen) en ARS y USD, y un total consolidado aproximado en ARS.', 
    defaultProps: {}, 
    PreviewComponent: BalanceOverviewPreview 
  },
  investmentHighlights: { 
    Component: InvestmentHighlights, 
    name: 'Resumen de Inversiones', 
    description: 'Observa el valor total estimado de tu portafolio de inversiones y cuáles son tus principales activos actualmente.', 
    defaultProps: {}, 
    PreviewComponent: InvestmentHighlightsPreview 
  },
  balanceTrend: { 
    Component: BalanceTrendWidget, 
    name: 'Tendencia del Saldo General', 
    description: 'Visualiza cómo ha evolucionado tu patrimonio neto (saldo total de cuentas) a lo largo de los últimos meses.', 
    defaultProps: {}, 
    PreviewComponent: BalanceTrendPreview 
  },
  monthlySavings: { 
    Component: MonthlySavingsWidget, 
    name: 'Finanzas del Mes Actual', 
    description: 'Compara tus ingresos y egresos totales del mes corriente para ver tu capacidad de ahorro o si tuviste un déficit.', 
    defaultProps: {}, 
    PreviewComponent: MonthlySavingsPreview 
  },
  recentTransactions: { 
    Component: RecentTransactions, 
    name: 'Últimos Movimientos Registrados', 
    description: 'Un listado de tus transacciones más recientes (ingresos, gastos o transferencias) para un acceso rápido.', 
    defaultProps: {}, 
    PreviewComponent: RecentTransactionsPreview 
  },
};

const getDefaultWidgetOrder = () => [
  'saludFinanciera', 
  'upcomingPayments',
  'savingsGoals',
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
  const { apiData, loadingStates, error: dataApiError, fetchDashboardData } = useDashboardData();

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
      const widgetDescription = ALL_AVAILABLE_WIDGETS[widget.id]?.description || '';

      switch (widget.id) {
        case 'saludFinanciera': 
          componentSpecificProps = { data: apiData.saludFinancieraData, loading: loadingStates.saludFinanciera, error: dataApiError?.saludFinanciera, widgetDescription };
          break;
        case 'upcomingPayments': 
          componentSpecificProps = { events: apiData.upcomingEvents, loading: loadingStates.upcomingEvents, error: dataApiError?.upcomingEvents, widgetDescription };
          break;
        case 'savingsGoals':
          componentSpecificProps = { goals: apiData.savingsGoals, loading: loadingStates.savingsGoals, error: dataApiError?.savingsGoals, widgetDescription };
          break;
        case 'balanceOverview':
          componentSpecificProps = { summary: apiData.balanceSummary, loading: loadingStates.balanceSummary, error: dataApiError?.balanceSummary, widgetDescription };
          break;
        case 'investmentHighlights':
          componentSpecificProps = { highlights: apiData.investmentHighlights, loading: loadingStates.investments, error: dataApiError?.investmentHighlights, widgetDescription };
          break;
        case 'controlPanel':
          componentSpecificProps = {
            saldoData: apiData.balanceSummary ? { value: apiData.balanceSummary.totalBalanceARSConverted, currency: 'ARS' } : null,
            flujoData: apiData.monthlyFinancialStatus?.statusByCurrency?.ARS ? { value: apiData.monthlyFinancialStatus.statusByCurrency.ARS.savings, currency: 'ARS' } : null,
            gastadoData: apiData.globalBudgetStatus,
            loading: loadingStates.balanceSummary || loadingStates.monthlyStatus || loadingStates.globalBudget,
            error: dataApiError?.controlPanel,
            widgetDescription
          };
          break;
        case 'monthlySavings':
          componentSpecificProps = { status: apiData.monthlyFinancialStatus, loading: loadingStates.monthlyStatus, error: dataApiError?.monthlyFinancialStatus, widgetDescription };
          break;
        case 'balanceTrend':
          componentSpecificProps = { chartData: apiData.balanceTrendData, loading: loadingStates.balanceTrend, error: dataApiError?.balanceTrendData, widgetDescription };
          break;
        case 'spendingChart': 
          componentSpecificProps = { chartData: apiData.spendingChart, loading: loadingStates.spendingChart, error: dataApiError?.spendingChart, widgetDescription }; 
          break;
        case 'recentTransactions': 
          componentSpecificProps = { transactions: apiData.recentTransactions, loading: loadingStates.recentTransactions, error: dataApiError?.recentTransactions, widgetDescription }; 
          break;
        default:
          componentSpecificProps = { ...widget.props, widgetDescription };
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
                msg && <p key={key} className="error-message small-error" style={{marginBottom: '5px'}}>{`Error en ${ALL_AVAILABLE_WIDGETS[key]?.name || key}: ${msg}`}</p>
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