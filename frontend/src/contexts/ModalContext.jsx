// Ruta: finanzas-app-pro/frontend/src/contexts/ModalContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext(null);

export const useModals = () => useContext(ModalContext);

export const MODAL_TYPES = {
  ADD_ACCOUNT: 'ADD_ACCOUNT',
  PAY_CREDIT_CARD: 'PAY_CREDIT_CARD',
  ADD_TRANSACTION: 'ADD_TRANSACTION',
  // *** NUEVOS TIPOS DE MODAL PARA RECURRENTES ***
  ADD_RECURRING_TRANSACTION: 'ADD_RECURRING_TRANSACTION',
  EDIT_RECURRING_TRANSACTION: 'EDIT_RECURRING_TRANSACTION',
};

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    type: null, 
    props: {},  
  });

  const openModal = useCallback((type, props = {}) => {
    setModalState({ type, props });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ type: null, props: {} });
  }, []);

  const value = {
    modalType: modalState.type,
    modalProps: modalState.props,
    openModal,
    closeModal,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};