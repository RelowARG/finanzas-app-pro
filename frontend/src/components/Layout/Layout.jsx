// Ruta: finanzas-app-pro/frontend/src/components/Layout/Layout.jsx
import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

// Añadimos una prop 'showChrome' que por defecto será true
const Layout = ({ children, showChrome = true }) => {
  const { user } = useAuth();

  return (
    <div className="app-layout">
      {showChrome && <Navbar />} {/* Renderizar Navbar solo si showChrome es true */}
      <div className={`content-wrapper ${user && showChrome ? 'with-sidebar' : ''} ${!showChrome ? 'full-page-content' : ''}`}>
        {user && showChrome && <Sidebar />} {/* Renderizar Sidebar solo si hay usuario y showChrome es true */}
        <main className={`main-content ${!showChrome ? 'no-padding-main' : ''}`}>
          {children}
        </main>
      </div>
      {showChrome && <footer className="footer"> {/* Renderizar Footer solo si showChrome es true */}
        <p>&copy; {new Date().getFullYear()} Finanzas App Pro. Todos los derechos reservados.</p>
      </footer>}
    </div>
  );
};

export default Layout;