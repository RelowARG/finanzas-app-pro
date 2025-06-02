// Ruta: src/components/dashboard/WidgetSelectionModal.jsx
import React, { useState, useEffect } from 'react';
import './WidgetSelectionModal.css'; 

const WidgetSelectionModal = ({
  isOpen,
  onClose,
  allAvailableWidgets, 
  currentVisibleWidgetIds, 
  onSave,
}) => {
  const [selectedWidgetIds, setSelectedWidgetIds] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      setSelectedWidgetIds(new Set(currentVisibleWidgetIds));
    }
  }, [isOpen, currentVisibleWidgetIds]);

  const handleToggleWidget = (widgetId) => {
    setSelectedWidgetIds((prevSelectedIds) => {
      const newSelectedIds = new Set(prevSelectedIds);
      if (newSelectedIds.has(widgetId)) {
        newSelectedIds.delete(widgetId);
      } else {
        newSelectedIds.add(widgetId);
      }
      return newSelectedIds;
    });
  };

  const handleSaveChanges = () => {
    onSave(Array.from(selectedWidgetIds)); 
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const widgetEntries = Object.entries(allAvailableWidgets);

  return (
    <div className="widget-selection-modal-overlay">
      <div className="widget-selection-modal-content">
        <h3>Personalizar Widgets del Dashboard</h3>
        <p>Selecciona los widgets que deseas mostrar. Puedes reordenarlos luego directamente en el dashboard.</p>
        
        <div className="widget-selection-list">
          {widgetEntries.map(([widgetId, widgetConfig]) => (
            <div key={widgetId} className="widget-selection-item">
              <div className="widget-preview-area">
                {widgetConfig.PreviewComponent ? (
                  <widgetConfig.PreviewComponent />
                ) : widgetConfig.staticPreviewImage ? (
                  <img src={widgetConfig.staticPreviewImage} alt={`${widgetConfig.name} preview`} className="widget-static-preview-img" />
                ) : (
                  <div className="widget-preview-placeholder">
                    <span role="img" aria-label="Preview icon">🖼️ Vista Previa no disponible</span>
                  </div>
                )}
              </div>
              {/* Contenedor para la info y el checkbox, debajo del preview */}
              <div className="widget-selection-item-footer">
                <div className="widget-info-area">
                  <h4 className="widget-item-name">{widgetConfig.name}</h4>
                  <p className="widget-item-description">{widgetConfig.description}</p>
                </div>
                <div className="widget-checkbox-area">
                  <input
                    type="checkbox"
                    id={`widget-select-${widgetId}`}
                    checked={selectedWidgetIds.has(widgetId)}
                    onChange={() => handleToggleWidget(widgetId)}
                    className="widget-select-checkbox"
                  />
                  <label htmlFor={`widget-select-${widgetId}`} className="checkbox-custom-label">
                    {selectedWidgetIds.has(widgetId) ? 'Visible' : 'Oculto'}
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="widget-selection-modal-actions">
          <button onClick={handleSaveChanges} className="button button-primary">
            Guardar Cambios
          </button>
          <button onClick={onClose} className="button button-secondary">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetSelectionModal;