// Ruta: finanzas-app-pro/frontend/src/router/index.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import AccountsPage from '../pages/AccountsPage';
import AddAccountPage from '../pages/AddAccountPage';
import EditAccountPage from '../pages/EditAccountPage'; 
import TransactionsPage from '../pages/TransactionsPage';
import AddTransactionPage from '../pages/AddTransactionPage';
import EditTransactionPage from '../pages/EditTransactionPage';
import BudgetsPage from '../pages/BudgetsPage';
import AddBudgetPage from '../pages/AddBudgetPage';
import EditBudgetPage from '../pages/EditBudgetPage';
import ReportsPage from '../pages/ReportsPage';
import InvestmentsPage from '../pages/InvestmentsPage';
import AddInvestmentPage from '../pages/AddInvestmentPage';
import EditInvestmentPage from '../pages/EditInvestmentPage';
import CategoriesPage from '../pages/CategoriesPage';
import RecurringTransactionsPage from '../pages/RecurringTransactionsPage';
import AddRecurringTransactionPage from '../pages/AddRecurringTransactionPage';
import EditRecurringTransactionPage from '../pages/EditRecurringTransactionPage'; 
import DebtsAndLoansPage from '../pages/DebtsAndLoansPage';
import AddDebtAndLoanPage from '../pages/AddDebtAndLoanPage';
import EditDebtAndLoanPage from '../pages/EditDebtAndLoanPage';
import ExchangeRatesPage from '../pages/ExchangeRatesPage';
import NotFoundPage from '../pages/NotFoundPage';
import PrivateRoute from '../components/Route/PrivateRoute'; // [cite: finanzas-app-pro/frontend/src/components/Route/PrivateRoute.jsx]
import AdminRoute from '../components/Route/AdminRoute'; // NUEVA RUTA PROTEGIDA PARA ADMIN [cite: finanzas-app-pro/frontend/src/components/Route/AdminRoute.jsx]
import AdminUsersPage from '../pages/AdminUsersPage'; // NUEVA PÁGINA DE ADMIN [cite: finanzas-app-pro/frontend/src/pages/AdminUsersPage.jsx]

import { useAuth } from '../contexts/AuthContext'; // [cite: finanzas-app-pro/frontend/src/contexts/AuthContext.jsx]

const AppRouter = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      
      {/* Rutas Privadas para Usuarios Autenticados */}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/accounts/add" element={<AddAccountPage />} />
        <Route path="/accounts/edit/:accountId" element={<EditAccountPage />} />
        
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/transactions/add" element={<AddTransactionPage />} />
        <Route path="/transactions/edit/:transactionId" element={<EditTransactionPage />} />

        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/budgets/add" element={<AddBudgetPage />} />
        <Route path="/budgets/edit/:budgetId" element={<EditBudgetPage />} />

        <Route path="/reports" element={<ReportsPage />} />
        
        <Route path="/investments" element={<InvestmentsPage />} />
        <Route path="/investments/add" element={<AddInvestmentPage />} />
        <Route path="/investments/edit/:investmentId" element={<EditInvestmentPage />} /> 

        <Route path="/debts-loans" element={<DebtsAndLoansPage />} />
        <Route path="/debts-loans/add" element={<AddDebtAndLoanPage />} />
        <Route path="/debts-loans/edit/:debtLoanId" element={<EditDebtAndLoanPage />} />

        <Route path="/settings/categories" element={<CategoriesPage />} />
        <Route path="/settings/recurring-transactions" element={<RecurringTransactionsPage />} />
        <Route path="/settings/recurring-transactions/add" element={<AddRecurringTransactionPage />} />
        <Route path="/settings/recurring-transactions/edit/:recurringId" element={<EditRecurringTransactionPage />} />
        <Route path="/settings/exchange-rates" element={<ExchangeRatesPage />} />
        
        {/* Rutas de Administración (dentro de PrivateRoute, y luego protegidas por AdminRoute) */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route path="users" element={<AdminUsersPage />} />
          {/* Aquí podrías añadir más sub-rutas de admin, ej: admin/settings, admin/reports-global */}
          <Route index element={<Navigate to="users" replace />} /> {/* Redirigir /admin a /admin/users */}
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;
