// Ruta: src/components/dashboard/AddWidgetPlaceholder.jsx
import React from 'react';
import './DashboardComponents.css'; // Reutilizaremos estilos de .add-card-placeholder o crearemos nuevos si es necesario

const AddWidgetPlaceholder = ({ onClick }) => {
  return (
    <div
      className="dashboard-widget add-card-placeholder add-widget-placeholder" // Usamos clase existente y una nueva específica
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      style={{ cursor: 'pointer', height: '300px' }} // Asegurar altura consistente con otros widgets
    >
      {/* Contenido del placeholder, similar a AccountSummaryCard cuando no hay cuenta */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ fontSize: '3rem', marginBottom: '15px', color: 'var(--primary-color)' }}>⊕</div>
        <div style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--primary-color)' }}>
          Añadir / Personalizar Widgets
        </div>
        <p style={{fontSize: '0.8rem', color: '#6c757d', marginTop: '10px', maxWidth: '80%', textAlign: 'center'}}>
          Haz clic aquí para elegir qué información ver en tu dashboard.
        </p>
      </div>
    </div>
  );
};

export default AddWidgetPlaceholder;