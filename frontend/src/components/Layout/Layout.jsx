// Ruta: finanzas-app-pro/frontend/src/components/Layout/Layout.jsx
import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';   
import { useAuth } from '../../contexts/AuthContext';
import { useModals, MODAL_TYPES } from '../../contexts/ModalContext'; // *** NUEVO IMPORT ***
import AddAccountModal from '../accounts/AddAccountModal'; // *** NUEVO IMPORT ***
import PayCreditCardModal from '../accounts/PayCreditCardModal'; // *** NUEVO IMPORT ***
// Importa otros modales aquí si los globalizas
import './Layout.css';

const Layout = ({ children, showChrome = true }) => {
  const { user } = useAuth();
  const { modalType, modalProps, closeModal } = useModals(); // *** USAR EL CONTEXTO DE MODALES ***
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

      {/* *** RENDERIZAR MODALES GLOBALES AQUÍ *** */}
      {modalType === MODAL_TYPES.ADD_ACCOUNT && (
        <AddAccountModal
          isOpen={true} // Siempre es true si modalType coincide
          onClose={closeModal}
          onAccountCreated={modalProps.onAccountCreated} // Pasa el callback
        />
      )}
      {modalType === MODAL_TYPES.PAY_CREDIT_CARD && (
        <PayCreditCardModal
          isOpen={true}
          onClose={closeModal}
          creditCardAccount={modalProps.creditCardAccount}
          payingAccounts={modalProps.payingAccounts}
          onPaymentSuccess={modalProps.onPaymentSuccess}
        />
      )}
      {/* Añadir otros modales aquí */}
    </div>
  );
};

export default Layout;