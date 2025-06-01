// Ruta: finanzas-app-pro/frontend/src/components/auth/SessionTimeoutModal.jsx
import React from 'react';
import './SessionTimeoutModal.css'; // Crearemos este CSS

const SessionTimeoutModal = ({ isOpen, countdown, onStayLoggedIn, appName = "FinanzasApp Pro" }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="session-timeout-modal-overlay">
      <div className="session-timeout-modal-content">
        <h3>¿Sigues ahí?</h3>
        <p>
          Tu sesión en {appName} está a punto de expirar por inactividad.
        </p>
        <div className="session-timeout-countdown">
          Cerrando sesión en: <span>{countdown}</span> segundos
        </div>
        <p>
          ¿Quieres continuar con tu sesión activa?
        </p>
        <div className="session-timeout-actions">
          <button onClick={onStayLoggedIn} className="button button-primary">
            Mantener Sesión
          </button>
          {/* Podrías añadir un botón de "Cerrar Sesión Ahora" si quisieras */}
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;