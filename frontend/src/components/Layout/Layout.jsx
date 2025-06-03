// Ruta: finanzas-app-pro/frontend/src/components/Layout/Layout.jsx
import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';   
import { useAuth } from '../../contexts/AuthContext';
import { useModals, MODAL_TYPES } from '../../contexts/ModalContext';
import AddAccountModal from '../accounts/AddAccountModal'; 
import PayCreditCardModal from '../accounts/PayCreditCardModal'; 
import AddTransactionModal from '../transactions/AddTransactionModal'; // *** NUEVO IMPORT ***
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
          {...modalProps} // Pasa todas las props necesarias
        />
      )}
      {/* *** RENDERIZAR MODAL DE TRANSACCIONES *** */}
      {modalType === MODAL_TYPES.ADD_TRANSACTION && (
        <AddTransactionModal
          isOpen={true}
          onClose={closeModal}
          onTransactionCreated={modalProps.onTransactionCreated}
          initialTypeFromButton={modalProps.initialTypeFromButton || 'egreso'}
        />
      )}
    </div>
  );
};

export default Layout;