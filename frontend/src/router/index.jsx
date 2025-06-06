// Ruta: frontend/src/router/index.jsx
import React from 'react';
import { Routes, Route, Navigate, Outlet, useOutletContext } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import DashboardWrapper from '../pages/DashboardWrapper';
import AccountsPage from '../pages/AccountsPage';
import AccountDetailsPage from '../pages/AccountDetailsPage';
import EditAccountFormPage from '../pages/EditAccountFormPage';
import TransactionsPage from '../pages/TransactionsPage';
import EditTransactionPage from '../pages/EditTransactionPage';
import BudgetsPage from '../pages/BudgetsPage';
import ReportsPage from '../pages/ReportsPage';
import InvestmentsPage from '../pages/InvestmentsPage';
import SettingsPage from '../pages/SettingsPage';
import CategoriesPage from '../pages/CategoriesPage';
import RecurringTransactionsPage from '../pages/RecurringTransactionsPage';
import ExchangeRatesPage from '../pages/ExchangeRatesPage';
import AdminPanelPage from '../pages/AdminPanelPage.jsx';
import HowItWorksPage from '../pages/HowItWorksPage';
import TermsOfServicePage from '../pages/TermsOfServicePage';
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';
import NotFoundPage from '../pages/NotFoundPage';
import GoalsPage from '../pages/GoalsPage.jsx';
import AddGoalPage from '../pages/AddGoalPage.jsx';
import EditGoalPage from '../pages/EditGoalPage.jsx';
import HowToUsePage from '../pages/HowToUsePage.jsx';
import DebtsAndLoansPage from '../pages/DebtsAndLoansPage';
import AddDebtAndLoanPage from '../pages/AddDebtAndLoanPage';
import EditDebtAndLoanPage from '../pages/EditDebtAndLoanPage';

import PrivateRoute from '../components/Route/PrivateRoute';
import AdminRoute from '../components/Route/AdminRoute';
import { useAuth } from '../contexts/AuthContext';

export function useDashboardWrapperContext() {
  return useOutletContext();
}

const AppRouter = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/como-funciona" element={<HowItWorksPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/como-usar" element={<HowToUsePage />} />
      
      {/* Rutas Privadas */}
      <Route element={<PrivateRoute />}>
        <Route element={<DashboardWrapper />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
        
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/accounts/edit/:accountId" element={<AccountDetailsPage />} />
        <Route path="/accounts/edit-form/:accountId" element={<EditAccountFormPage />} />
        
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/transactions/edit/:transactionId" element={<EditTransactionPage />} />

        <Route path="/budgets" element={<BudgetsPage />} />

        <Route path="/reports" element={<ReportsPage />} />
        
        <Route path="/investments" element={<InvestmentsPage />} />
        
        <Route path="/debts-loans" element={<DebtsAndLoansPage />} />
        <Route path="/debts-loans/add" element={<AddDebtAndLoanPage />} />
        <Route path="/debts-loans/edit/:debtLoanId" element={<EditDebtAndLoanPage />} />

        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/goals/add" element={<AddGoalPage />} />
        <Route path="/goals/edit/:goalId" element={<EditGoalPage />} />

        <Route path="/settings" element={<SettingsPage />}>
          <Route index element={<Navigate to="categories" replace />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="recurring-transactions" element={<RecurringTransactionsPage />} />
          <Route path="exchange-rates" element={<ExchangeRatesPage />} />
        </Route>
        
        <Route path="/admin" element={<AdminRoute />}>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<AdminPanelPage />} />
          <Route path="config/permissions" element={<AdminPanelPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;