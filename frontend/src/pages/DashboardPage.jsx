// Ruta: src/pages/DashboardPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
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

import './DashboardPage.css';
import '../components/dashboard/DashboardComponents.css';

const ALL_AVAILABLE_WIDGETS = {
  saludFinanciera: { Component: SaludFinancieraWidget, name: 'Salud Financiera General', description: 'Puntuación y métricas clave de tu bienestar financiero.', defaultProps: {}, PreviewComponent: SaludFinancieraPreview },
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
  const { apiData, loadingStates, error: dataApiError } = useDashboardData();

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
    // console.log('[DashboardPage] Recalculando finalWidgetPropsList (useMemo)');
    return orderedVisibleWidgetsList.map(widget => {
      // La 'key' ya está siendo usada por el componente SortableWidget en el mapeo.
      // Aquí solo preparamos las props que irán *dentro* del componente del widget.
      let componentSpecificProps = {}; 
      switch (widget.id) {
        case 'saludFinanciera': 
          componentSpecificProps = { data: apiData.saludFinancieraData, loading: loadingStates.saludFinanciera, error: dataApiError };
          break;
        case 'balanceOverview':
          componentSpecificProps = { summary: apiData.balanceSummary, loading: loadingStates.balanceSummary };
          break;
        case 'investmentHighlights':
          componentSpecificProps = { highlights: apiData.investmentHighlights, loading: loadingStates.investments };
          break;
        case 'controlPanel':
          componentSpecificProps = {
            saldoData: apiData.balanceSummary ? { value: apiData.balanceSummary.totalBalanceARSConverted, currency: 'ARS' } : null,
            flujoData: apiData.monthlyFinancialStatus?.statusByCurrency?.ARS ? { value: apiData.monthlyFinancialStatus.statusByCurrency.ARS.savings, currency: 'ARS' } : null,
            gastadoData: apiData.globalBudgetStatus,
            loading: loadingStates.balanceSummary || loadingStates.monthlyStatus || loadingStates.globalBudget
          };
          break;
        case 'monthlySavings':
          componentSpecificProps = { status: apiData.monthlyFinancialStatus, loading: loadingStates.monthlyStatus, error: dataApiError };
          break;
        case 'balanceTrend':
          componentSpecificProps = { chartData: apiData.balanceTrendData, loading: loadingStates.balanceTrend };
          break;
        case 'spendingChart': 
          componentSpecificProps = { loading: loadingStates.monthlyStatus };
          break;
        case 'recentTransactions': 
          componentSpecificProps = { loading: loadingStates.accounts };
          break;
        default:
          componentSpecificProps = { ...widget.props }; // Mantener props por defecto si no hay específicas
          break;
      }
      // Devolver el objeto widget con sus props actualizadas, sin la 'key' aquí.
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

        {dataApiError && <p className="error-message" style={{marginBottom: '20px'}}>{dataApiError}</p>}
        {configError && <p className="error-message" style={{marginBottom: '20px'}}>{configError}</p>}
        
        <SortableContext items={finalWidgetPropsList.map(w => w.id)} strategy={rectSwappingStrategy}>
          <div className="dashboard-widgets-grid-target">
            {finalWidgetPropsList.map(widgetItem => (
              // La 'key' se pasa directamente a SortableWidget
              <SortableWidget key={widgetItem.id} id={widgetItem.id}>
                {/* El componente del widget recibe sus props específicas sin la 'key' */}
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
             {/* Aquí también, el componente se crea y las props se pasan sin 'key' en el spread */}
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
