import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="page-container">
      <h1>Bienvenido a Finanzas App Pro</h1>
      <p>Tu solución para gestionar tus finanzas personales de forma modular.</p>
      <div>
        <Link to="/login" className="button">Iniciar Sesión</Link>
        <Link to="/register" className="button button-secondary" style={{marginLeft: '10px'}}>Registrarse</Link>
      </div>
    </div>
  );
};

export default HomePage;