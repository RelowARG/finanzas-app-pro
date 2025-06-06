// Ruta: finanzas-app-pro/frontend/src/App.jsx
import React from 'react';
import AppRouter from './router'; //
import Layout from './components/Layout/Layout'; //
import { useLocation } from 'react-router-dom';
import InactivityHandler from './components/auth/InactivityHandler'; //
import './App.css'; //

function App() {
  const location = useLocation();
  // *** CORRECCIÓN: AÑADIR '/register' A LAS RUTAS SIN NAVBAR/FOOTER ***
  const noChromeRoutes = ['/', '/register']; 
  const showAppChrome = !noChromeRoutes.includes(location.pathname);

  return (
    <Layout showChrome={showAppChrome}>
      <AppRouter />
      <InactivityHandler />
    </Layout>
  );
}

export default App;