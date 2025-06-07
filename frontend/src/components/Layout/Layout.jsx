// Ruta: finanzas-app-pro/frontend/src/components/Layout/Layout.jsx
import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';   
import { useAuth } from '../../contexts/AuthContext';
import { useModals, MODAL_TYPES } from '../../contexts/ModalContext';

// Importar TODOS los modales que se usarán en la aplicación
import AddAccountModal from '../accounts/AddAccountModal'; 
import EditAccountModal from '../accounts/EditAccountModal';
import PayCreditCardModal from '../accounts/PayCreditCardModal'; 
import AddTransactionModal from '../transactions/AddTransactionModal';
import AddRecurringTransactionModal from '../recurring/AddRecurringTransactionModal';
import EditRecurringTransactionModal from '../recurring/EditRecurringTransactionModal'; 
import AddBudgetModal from '../budgets/AddBudgetModal';
import EditBudgetModal from '../budgets/EditBudgetModal';
import AddGoalModal from '../goals/AddGoalModal.jsx';
import EditGoalModal from '../goals/EditGoalModal.jsx';
import AddGoalProgressModal from '../goals/AddGoalProgressModal';
import AddInvestmentModal from '../investments/AddInvestmentModal';
import EditInvestmentModal from '../investments/EditInvestmentModal';
import AddDebtAndLoanModal from '../debtAndLoan/AddDebtAndLoanModal';
import EditDebtAndLoanModal from '../debtAndLoan/EditDebtAndLoanModal';

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

      {/* --- INICIO: RENDERIZADO COMPLETO DE TODOS LOS MODALES --- */}

      {/* Cuentas */}
      {modalType === MODAL_TYPES.ADD_ACCOUNT && ( <AddAccountModal isOpen={true} onClose={closeModal} {...modalProps} /> )}
      {modalType === MODAL_TYPES.EDIT_ACCOUNT && ( <EditAccountModal isOpen={true} onClose={closeModal} {...modalProps} /> )}
      {modalType === MODAL_TYPES.PAY_CREDIT_CARD && ( <PayCreditCardModal isOpen={true} onClose={closeModal} {...modalProps} /> )}
      
      {/* Transacciones */}
      {modalType === MODAL_TYPES.ADD_TRANSACTION && ( <AddTransactionModal isOpen={true} onClose={closeModal} {...modalProps} /> )}

      {/* Recurrentes */}
      {modalType === MODAL_TYPES.ADD_RECURRING_TRANSACTION && ( <AddRecurringTransactionModal isOpen={true} onClose={closeModal} {...modalProps} /> )}
      {modalType === MODAL_TYPES.EDIT_RECURRING_TRANSACTION && ( <EditRecurringTransactionModal isOpen={true} onClose={closeModal} {...modalProps} /> )}
      
      {/* Presupuestos */}
      {modalType === MODAL_TYPES.ADD_BUDGET && ( <AddBudgetModal isOpen={true} onClose={closeModal} {...modalProps} /> )}
      {modalType === MODAL_TYPES.EDIT_BUDGET && ( <EditBudgetModal isOpen={true} onClose={closeModal} {...modalProps} /> )}

      {/* Metas */}
      {modalType === MODAL_TYPES.ADD_GOAL && ( <AddGoalModal isOpen={true} onClose={closeModal} {...modalProps} /> )}
      {modalType === MODAL_TYPES.EDIT_GOAL && ( <EditGoalModal isOpen={true} onClose={closeModal} {...modalProps} /> )}
      {modalType === MODAL_TYPES.ADD_GOAL_PROGRESS && ( <AddGoalProgressModal isOpen={true} onClose={closeModal} {...modalProps} /> )}

      {/* Inversiones */}
      {modalType === MODAL_TYPES.ADD_INVESTMENT && ( <AddInvestmentModal isOpen={true} onClose={closeModal} {...modalProps} /> )}
      {modalType === MODAL_TYPES.EDIT_INVESTMENT && ( <EditInvestmentModal isOpen={true} onClose={closeModal} {...modalProps} /> )}

      {/* Deudas y Préstamos */}
      {modalType === MODAL_TYPES.ADD_DEBT_LOAN && ( <AddDebtAndLoanModal isOpen={true} onClose={closeModal} {...modalProps} /> )}
      {modalType === MODAL_TYPES.EDIT_DEBT_LOAN && ( <EditDebtAndLoanModal isOpen={true} onClose={closeModal} {...modalProps} /> )}

      {/* --- FIN: RENDERIZADO COMPLETO DE TODOS LOS MODALES --- */}
    </div>
  );
};

export default Layout;