// Ruta: src/components/dashboard/WidgetInfoIcon.jsx
import React, { useState } from 'react';
import './WidgetInfoIcon.css'; // Asumiendo que los estilos están aquí

const WidgetInfoIcon = ({ description }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!description || description.trim() === '') {
    return null;
  }

  const handleMouseEnter = (e) => {
    e.stopPropagation(); // <--- AÑADIDO: Evita que el evento llegue al widget padre
    setShowTooltip(true);
  };

  const handleMouseLeave = (e) => {
    // e.stopPropagation(); // No suele ser necesario en mouseLeave para este caso
    setShowTooltip(false);
  };
  
  const handleClick = (e) => {
    e.stopPropagation(); // <--- AÑADIDO: Evita que el evento llegue al widget padre
    setShowTooltip(prev => !prev);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation(); // <--- AÑADIDO
      handleClick(e);
    }
  };
  
  const handleFocus = (e) => {
    e.stopPropagation(); // <--- AÑADIDO
    setShowTooltip(true);
  };

  const handleBlur = (e) => {
    // e.stopPropagation(); // No suele ser necesario
    setShowTooltip(false);
  };


  return (
    <div 
      className="widget-info-icon-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onFocus={handleFocus} 
      onBlur={handleBlur}  
      role="button" 
      tabIndex={0}  
      aria-label="Más información sobre este widget"
      aria-expanded={showTooltip}
      onKeyPress={handleKeyPress}
    >
      <span className="widget-info-icon-symbol">?</span>
      {showTooltip && (
        <div className="widget-info-tooltip" role="tooltip">
          {description}
        </div>
      )}
    </div>
  );
};

export default WidgetInfoIcon;