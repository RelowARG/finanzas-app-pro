// Ruta: finanzas-app-pro/frontend/src/components/Layout/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css'; // Crearemos este archivo CSS

const Footer = () => {
  return (
    <footer className="app-footer new-look-footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} FinanzasApp Pro. Todos los derechos reservados.</p>
        <nav className="footer-nav">
          <Link to="/terms">Términos de Servicio</Link>
          <span>|</span>
          <Link to="/privacy">Política de Privacidad</Link>
          {/* Podrías añadir más enlaces aquí si es necesario */}
        </nav>
      </div>
    </footer>
  );
};

export default Footer;