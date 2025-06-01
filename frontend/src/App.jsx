// Ruta: finanzas-app-pro/frontend/src/App.jsx
import React from 'react';
import AppRouter from './router'; //
import Layout from './components/Layout/Layout'; //
import { useLocation } from 'react-router-dom';
import InactivityHandler from './components/auth/InactivityHandler'; // *** NUEVO ***
import './App.css'; //

function App() {
  const location = useLocation();
  const noChromeRoutes = ['/']; 
  const showAppChrome = !noChromeRoutes.includes(location.pathname);

  return (
    <Layout showChrome={showAppChrome}> {/* */}
      <AppRouter /> {/* */}
      <InactivityHandler /> {/* *** AÑADIDO AQUÍ *** */}
    </Layout>
  );
}

export default App;