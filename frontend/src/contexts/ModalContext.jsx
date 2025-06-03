// Ruta: finanzas-app-pro/frontend/src/contexts/ModalContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext(null);

export const useModals = () => useContext(ModalContext);

export const MODAL_TYPES = { // Definir tipos de modales para evitar strings mágicos
  ADD_ACCOUNT: 'ADD_ACCOUNT',
  PAY_CREDIT_CARD: 'PAY_CREDIT_CARD',
  // Añadir otros tipos de modales aquí en el futuro
};

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    type: null, // Qué modal mostrar, ej: MODAL_TYPES.ADD_ACCOUNT
    props: {},  // Props adicionales para el modal, ej: { creditCardAccount: {}, payingAccounts: [] }
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