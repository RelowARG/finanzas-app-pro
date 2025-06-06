// Ruta: finanzas-app-pro/frontend/src/components/Layout/Layout.jsx
import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';   
import { useAuth } from '../../contexts/AuthContext';
import { useModals, MODAL_TYPES } from '../../contexts/ModalContext';
import AddAccountModal from '../accounts/AddAccountModal'; 
import PayCreditCardModal from '../accounts/PayCreditCardModal'; 
import AddTransactionModal from '../transactions/AddTransactionModal';
import AddRecurringTransactionModal from '../recurring/AddRecurringTransactionModal';
import EditRecurringTransactionModal from '../recurring/EditRecurringTransactionModal'; 
import AddBudgetModal from '../budgets/AddBudgetModal';
import EditBudgetModal from '../budgets/EditBudgetModal';
import './Layout.css';

const Layout = ({ children, showChrome = true }) => {
  const { user } = useAuth();
  const { modalType, modalProps, closeModal } = useModals();

  let appLayoutClasses = "app-layout";
  if (showChrome) {
    appLayoutClasses += " app-chrome-visible";
  } else {
    appLayoutClasses += " app-chrome-hidden";
  }

  return (
    <div className={appLayoutClasses}>
      {showChrome && <Navbar />} 
      
      <main className={`main-content ${!showChrome ? 'no-padding-main' : ''}`}>
        {children}
      </main>
      
      {showChrome && <Footer />} 

      {modalType === MODAL_TYPES.ADD_ACCOUNT && ( <AddAccountModal isOpen={true} onClose={closeModal} {...modalProps} /> )}
      {modalType === MODAL_TYPES.PAY_CREDIT_CARD && ( <PayCreditCardModal isOpen={true} onClose={closeModal} {...modalProps} /> )}
      {modalType === MODAL_TYPES.ADD_TRANSACTION && ( <AddTransactionModal isOpen={true} onClose={closeModal} {...modalProps} /> )}
      {modalType === MODAL_TYPES.ADD_RECURRING_TRANSACTION && ( <AddRecurringTransactionModal isOpen={true} onClose={closeModal} {...modalProps} /> )}
      {modalType === MODAL_TYPES.EDIT_RECURRING_TRANSACTION && ( <EditRecurringTransactionModal isOpen={true} onClose={closeModal} {...modalProps} /> )}
      
      {modalType === MODAL_TYPES.ADD_BUDGET && (
        <AddBudgetModal
          isOpen={true}
          onClose={closeModal}
          onBudgetCreated={modalProps.onBudgetCreated}
        />
      )}
      {modalType === MODAL_TYPES.EDIT_BUDGET && (
        <EditBudgetModal
          isOpen={true}
          onClose={closeModal}
          onBudgetUpdated={modalProps.onBudgetUpdated}
          budgetData={modalProps.budgetData}
        />
      )}
    </div>
  );
};

export default Layout;