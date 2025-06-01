// Ruta: finanzas-app-pro/frontend/src/components/auth/InactivityHandler.jsx
import React from 'react';
import { useInactivityTimeout } from '../../hooks/useInactivityTimeout';
import SessionTimeoutModal from './SessionTimeoutModal';
import { useAuth } from '../../contexts/AuthContext'; //

const InactivityHandler = () => {
  const { user } = useAuth(); //
  const { isWarningModalOpen, countdown, handleStayLoggedIn } = useInactivityTimeout();

  // Solo renderizar el modal si hay un usuario y el modal debe estar abierto
  if (!user || !isWarningModalOpen) {
    return null;
  }

  return (
    <SessionTimeoutModal
      isOpen={isWarningModalOpen}
      countdown={countdown}
      onStayLoggedIn={handleStayLoggedIn}
    />
  );
};

export default InactivityHandler;