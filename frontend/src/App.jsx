// Ruta: finanzas-app-pro/frontend/src/App.jsx
import React from 'react';
import AppRouter from './router';
import Layout from './components/Layout/Layout';
import { useLocation } from 'react-router-dom'; // Importar useLocation

function App() {
  const location = useLocation(); // Obtener la ubicación actual

  // Rutas donde NO queremos mostrar Navbar/Footer
  const noChromeRoutes = ['/']; 

  // Determinar si la ruta actual está en noChromeRoutes
  const showAppChrome = !noChromeRoutes.includes(location.pathname);

  return (
    // Pasar la prop showChrome a Layout
    <Layout showChrome={showAppChrome}> 
      <AppRouter />
    </Layout>
  );
}

export default App;