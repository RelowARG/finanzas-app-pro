// Ruta: finanzas-app-pro/frontend/src/components/Layout/Layout.jsx
import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';   
import { useAuth } from '../../contexts/AuthContext';
import { useModals, MODAL_TYPES } from '../../contexts/ModalContext';
import AddAccountModal from '../accounts/AddAccountModal'; 
import PayCreditCardModal from '../accounts/PayCreditCardModal'; 
import AddTransactionModal from '../transactions/AddTransactionModal';
import AddRecurringTransactionModal from '../recurring/AddRecurringTransactionModal';
// *** NUEVO IMPORT PARA MODAL DE EDITAR RECURRENTES ***
import EditRecurringTransactionModal from '../recurring/EditRecurringTransactionModal'; 
import './Layout.css';

const Layout = ({ children, showChrome = true }) => {
  const { user } = useAuth();
  const { modalType, modalProps, closeModal } = useModals();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false); 

  let appLayoutClasses = "app-layout";
  if (user && showChrome) {
    appLayoutClasses += " sidebar-active"; 
    if (isSidebarHovered) {
      appLayoutClasses += " sidebar-expanded"; 
    }
  }
  if (showChrome) {
    appLayoutClasses += " app-chrome-visible";
  } else {
    appLayoutClasses += " app-chrome-hidden";
  }

  return (
    <div className={appLayoutClasses}>
      {user && showChrome && (
        <div 
          className="sidebar-container-area"
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
        >
          <Sidebar />
        </div>
      )}

      {showChrome && <Navbar />} 
      
      <main className={`main-content ${!showChrome ? 'no-padding-main' : ''}`}>
        {children}
      </main>
      
      {showChrome && <Footer />} 

      {modalType === MODAL_TYPES.ADD_ACCOUNT && (
        <AddAccountModal
          isOpen={true}
          onClose={closeModal}
          onAccountCreated={modalProps.onAccountCreated} 
        />
      )}
      {modalType === MODAL_TYPES.PAY_CREDIT_CARD && (
        <PayCreditCardModal
          isOpen={true}
          onClose={closeModal}
          {...modalProps}
        />
      )}
      {modalType === MODAL_TYPES.ADD_TRANSACTION && (
        <AddTransactionModal
          isOpen={true}
          onClose={closeModal}
          onTransactionCreated={modalProps.onTransactionCreated}
          initialTypeFromButton={modalProps.initialTypeFromButton || 'egreso'}
        />
      )}
      {modalType === MODAL_TYPES.ADD_RECURRING_TRANSACTION && (
        <AddRecurringTransactionModal
          isOpen={true}
          onClose={closeModal}
          onRecurringTransactionCreated={modalProps.onRecurringTransactionCreated}
        />
      )}
      {/* *** RENDERIZAR MODAL DE EDITAR RECURRENTE *** */}
      {modalType === MODAL_TYPES.EDIT_RECURRING_TRANSACTION && (
        <EditRecurringTransactionModal
          isOpen={true}
          onClose={closeModal}
          onRecurringTransactionUpdated={modalProps.onRecurringTransactionUpdated}
          recurringTransactionData={modalProps.recurringTransactionData} // Asegúrate de pasar los datos aquí
        />
      )}
    </div>
  );
};

export default Layout;