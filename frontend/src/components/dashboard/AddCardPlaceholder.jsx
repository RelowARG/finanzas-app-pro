// Ruta: src/components/dashboard/AddCardPlaceholder.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './DashboardComponents.css'; // Asegúrate que este CSS exista y tenga estilos relevantes

const AddCardPlaceholder = () => (
  <div className="dashboard-widget add-card-placeholder">
    <Link to="/accounts/add" style={{textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
      <div style={{fontSize: '2.5rem', marginBottom: '10px'}}>+</div>
      <div>Añadir Tarjeta/Cuenta</div>
    </Link>
  </div>
);

export default AddCardPlaceholder;