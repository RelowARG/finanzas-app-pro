// Ruta: finanzas-app-pro/frontend/src/components/Layout/Layout.jsx
import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';   
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

const Layout = ({ children, showChrome = true }) => {
  const { user } = useAuth();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false); 

  let appLayoutClasses = "app-layout";
  if (user && showChrome) {
    appLayoutClasses += " sidebar-active"; 
    if (isSidebarHovered) {
      appLayoutClasses += " sidebar-expanded"; 
    }
  }
  if (showChrome) {
    appLayoutClasses += " app-chrome-visible";
  } else {
    appLayoutClasses += " app-chrome-hidden";
  }

  return (
    <div className={appLayoutClasses}>
      {user && showChrome && (
        <div 
          className="sidebar-container-area" // Este div es solo para el hover
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
        >
          <Sidebar /> {/* Sidebar con position:fixed */}
        </div>
      )}

      {/* Navbar es un elemento fijo global y ocupa todo el ancho */}
      {showChrome && <Navbar />} 
      
      {/* main-content es el único que ajusta su padding-left */}
      <main className={`main-content ${!showChrome ? 'no-padding-main' : ''}`}>
        {children}
      </main>
      
      {/* Footer es un elemento fijo global y ocupa todo el ancho */}
      {showChrome && <Footer />} 
    </div>
  );
};

export default Layout;