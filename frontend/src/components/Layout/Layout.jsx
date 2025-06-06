// Ruta: /frontend/src/components/Layout/Layout.jsx
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
import AddGoalModal from '../goals/AddGoalModal.jsx';
import EditGoalModal from '../goals/EditGoalModal.jsx';
import AddInvestmentModal from '../investments/AddInvestmentModal';
import EditInvestmentModal from '../investments/EditInvestmentModal';
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

      {/* ... (otros modales) ... */}
      {modalType === MODAL_TYPES.EDIT_GOAL && ( <EditGoalModal isOpen={true} onClose={closeModal} {...modalProps} /> )}
      
      {modalType === MODAL_TYPES.ADD_INVESTMENT && (
        <AddInvestmentModal isOpen={true} onClose={closeModal} {...modalProps} />
      )}
      {modalType === MODAL_TYPES.EDIT_INVESTMENT && (
        <EditInvestmentModal isOpen={true} onClose={closeModal} {...modalProps} />
      )}
    </div>
  );
};

export default Layout;