import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="page-container text-center">
      <h1>404 - Página No Encontrada</h1>
      <p>Lo sentimos, la página que buscas no existe.</p>
      <Link to="/" className="button" style={{marginTop: '20px'}}>Volver al Inicio</Link>
    </div>
  );
};

export default NotFoundPage;