// finanzas-app-pro/frontend/src/components/dashboard/WidgetLoader.jsx
import React from 'react';
// import './WidgetLoader.css'; // Crearemos este CSS

const WidgetLoader = ({ message = "Cargando datos..." }) => {
  return (
    <div className="widget-loader-container"> {/* Define en CSS */}
      <div className="widget-spinner"></div> {/* Define en CSS */}
      {message && <p className="widget-loader-message">{message}</p>} {/* Define en CSS */}
    </div>
  );
};

export default WidgetLoader;