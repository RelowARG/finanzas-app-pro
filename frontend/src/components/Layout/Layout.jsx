// Ruta: finanzas-app-pro/frontend/src/components/Layout/Layout.jsx
import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';   
import { useAuth } from '../../contexts/AuthContext'; //
import './Layout.css';

const Layout = ({ children, showChrome = true }) => {
  const { user } = useAuth(); //
  const [isSidebarHovered, setIsSidebarHovered] = useState(false); // Estado para el hover del Sidebar

  // Clases para el div principal de la aplicación
  let appLayoutClasses = "app-layout";
  if (user && showChrome) {
    appLayoutClasses += " sidebar-active"; // Indica que el sidebar está presente (aunque colapsado)
    if (isSidebarHovered) {
      appLayoutClasses += " sidebar-expanded"; // Indica que el sidebar está expandido por hover
    }
  }
  // En el futuro, si tienes un toggle para el sidebar en móvil, podrías añadir otra clase como:
  // if (isMobileSidebarOpen) appLayoutClasses += " sidebar-mobile-open";

  return (
    <div className={appLayoutClasses}>
      {user && showChrome && (
        // Este div envuelve al Sidebar y es el que detecta el hover
        // para aplicar la clase .sidebar-expanded al .app-layout
        <div 
          className="sidebar-container-area" 
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
        >
          <Sidebar />
        </div>
      )}

      {/* Este wrapper contiene todo lo que se debe desplazar cuando el sidebar cambia de tamaño */}
      <div className="main-page-wrapper">
        {showChrome && <Navbar />}
        <main className={`main-content ${!showChrome ? 'no-padding-main' : ''}`}>
          {children}
        </main>
        {showChrome && <Footer />} 
      </div>
    </div>
  );
};

export default Layout;