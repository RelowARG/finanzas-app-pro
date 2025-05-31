// Ruta: finanzas-app-pro/frontend/src/components/Layout/Layout.jsx
// ACTUALIZA ESTE ARCHIVO
import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar'; // <--- IMPORTAR NUEVO COMPONENTE
import { useAuth } from '../../contexts/AuthContext'; // Para saber si mostrar el Sidebar
import './Layout.css'; // Crearemos este archivo CSS para el layout

const Layout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="app-layout">
      <Navbar />
      <div className={`content-wrapper ${user ? 'with-sidebar' : ''}`}> {/* Clase condicional */}
        {user && <Sidebar />} {/* Mostrar Sidebar solo si hay usuario */}
        <main className="main-content">
          {children}
        </main>
      </div>
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Finanzas App Pro. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Layout;
