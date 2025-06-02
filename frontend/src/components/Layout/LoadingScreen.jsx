// Ruta finanzas-app-pro/frontend/src/components/Layout/LoadingScreen.jsx

import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ appName = "FinanzasApp Pro", message = "Sincronizando tus datos..." }) => {
  return (
    <div className="loading-screen-overlay">
      <div className="loading-screen-content">
        <div className="loading-logo-placeholder">
          💰
        </div>
        <h1>{appName}</h1>
        <p>{message}</p>
        <div className="loading-spinner"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;