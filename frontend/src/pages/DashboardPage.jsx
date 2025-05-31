// Ruta: finanzas-app-pro/frontend/src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react'; // useCallback añadido
import { useAuth } from '../contexts/AuthContext';

import BalanceOverview from '../components/dashboard/BalanceOverview';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import SpendingChart from '../components/dashboard/SpendingChart';
import QuickActions from '../components/dashboard/QuickActions';
import InvestmentHighlights from '../components/dashboard/InvestmentHighlights';
import MonthlySavingsWidget from '../components/dashboard/MonthlySavingsWidget';

import dashboardService from '../services/dashboard.service';
// transactionService ya no se llama directamente desde aquí para las recientes,
// dashboardService.getCurrentMonthFinancialStatus lo usa internamente.

import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const [balanceSummaryData, setBalanceSummaryData] = useState(null);
  // RecentTransactions ahora maneja su propia carga y estado de error/vacío
  const [investmentHighlights, setInvestmentHighlights] = useState(null);
  const [monthlyFinancialStatus, setMonthlyFinancialStatus] = useState(null);
  
  const [loadingBalanceSummary, setLoadingBalanceSummary] = useState(true);
  // loadingTransactions ya no es necesario aquí
  const [loadingInvestments, setLoadingInvestments] = useState(true);
  const [loadingMonthlyStatus, setLoadingMonthlyStatus] = useState(true);
  
  const [error, setError] = useState(''); // Error general del dashboard

  const fetchAllDashboardData = useCallback(async () => {
    if (!user) return; // No cargar si el usuario no está listo

    setLoadingBalanceSummary(true);
    setLoadingInvestments(true);
    setLoadingMonthlyStatus(true);
    setError('');

    try {
      // Promise.allSettled para que si una falla, las otras puedan continuar
      const results = await Promise.allSettled([
        dashboardService.getDashboardSummary(),
        dashboardService.getInvestmentHighlights(3),
        dashboardService.getCurrentMonthFinancialStatus()
        // SpendingChart y RecentTransactions manejan sus propios datos
      ]);

      if (results[0].status === 'fulfilled') {
        setBalanceSummaryData(results[0].value);
      } else {
        console.error("Error fetching balance summary:", results[0].reason);
        setError(prev => prev + 'Error al cargar resumen de balance. ');
      }
      setLoadingBalanceSummary(false);

      if (results[1].status === 'fulfilled') {
        setInvestmentHighlights(results[1].value);
      } else {
        console.error("Error fetching investment highlights:", results[1].reason);
        setError(prev => prev + 'Error al cargar inversiones destacadas. ');
      }
      setLoadingInvestments(false);

      if (results[2].status === 'fulfilled') {
        setMonthlyFinancialStatus(results[2].value);
      } else {
        console.error("Error fetching monthly financial status:", results[2].reason);
        setError(prev => prev + 'Error al cargar estado financiero mensual. ');
      }
      setLoadingMonthlyStatus(false);

    } catch (err) { // Error general si Promise.allSettled no es suficiente
      setError('Error al cargar datos del dashboard. Intenta de nuevo más tarde.');
      console.error("Error fetching dashboard data:", err);
      // Asegurar que todos los loaders se pongan en false
      setLoadingBalanceSummary(false);
      setLoadingInvestments(false);
      setLoadingMonthlyStatus(false);
    }
  }, [user]); // Depender de user

  useEffect(() => {
    fetchAllDashboardData();
  }, [fetchAllDashboardData]);

  return (
    <div className="page-container dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        {user && <p className="welcome-message">Bienvenido de nuevo, {user.name || user.email}!</p>}
      </div>

      <QuickActions /> 

      {error.trim() && <p className="error-message" style={{marginBottom: '20px'}}>{error.trim()}</p>}

      <div className="dashboard-full-width-widget-container">
        <BalanceOverview summary={balanceSummaryData} loading={loadingBalanceSummary} />
      </div>

      <div className="dashboard-widgets-grid">
        <div className="dashboard-main-column">
          <MonthlySavingsWidget 
            status={monthlyFinancialStatus} 
            loading={loadingMonthlyStatus} 
            error={!loadingMonthlyStatus && !monthlyFinancialStatus ? 'No se pudo cargar el estado mensual.' : null}
          />
          <RecentTransactions /> {/* Maneja su propia carga */}
        </div>
        <div className="dashboard-sidebar-column">
          <SpendingChart />  {/* Maneja su propia carga */}
          <InvestmentHighlights 
            highlights={investmentHighlights} 
            loading={loadingInvestments} 
            error={!loadingInvestments && !investmentHighlights ? 'No se pudieron cargar las inversiones.' : null}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;