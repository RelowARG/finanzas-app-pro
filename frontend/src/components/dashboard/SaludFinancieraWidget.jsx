// Ruta: src/components/dashboard/SaludFinancieraWidget.jsx
import React, { useState, useRef, useEffect } from 'react'; // Añadido useRef y useEffect
import WidgetLoader from './WidgetLoader';
import WidgetInfoIcon from './WidgetInfoIcon';
import './DashboardComponents.css'; 
import './SaludFinancieraWidget.css'; 

const getScoreColor = (score) => {
  if (score >= 75) return 'score-high'; 
  if (score >= 50) return 'score-medium'; 
  return 'score-low'; 
};

const SubMetricItem = ({ label, value, unit = '', recommendation, status = 'neutral' }) => {
  let displayValue = value;
  if (typeof value === 'number') {
    if (value === Infinity || value === -Infinity) {
      displayValue = "N/A";
    } else if (Number.isFinite(value)) {
      displayValue = value.toLocaleString('es-AR', { minimumFractionDigits: (label.toLowerCase().includes("ratio") || label.toLowerCase().includes("cobertura") || !Number.isInteger(value)) ? 1 : 0, maximumFractionDigits: 1 });
    }
  }
  return (
    <div className={`sfw-submetric-item sfw-status-${status}`}>
      <span className="sfw-submetric-label">{label}:</span>
      <span className="sfw-submetric-value">{displayValue}{unit}</span>
      {recommendation && <p className="sfw-submetric-recommendation">{recommendation}</p>}
    </div>
  );
};

const SaludFinancieraWidget = ({ data, loading, error, widgetDescription }) => {
  const [showDetailsPanel, setShowDetailsPanel] = useState(false); 
  const [isMouseOverIcon, setIsMouseOverIcon] = useState(false); // Nuevo estado
  const widgetRef = useRef(null); // Ref para el div principal del widget

  const widgetTitle = "Salud Financiera General";

  // Manejador para cuando el mouse entra en el área del widget principal
  const handleWidgetMouseEnter = () => {
    if (!isMouseOverIcon) { // Solo mostrar detalles si el mouse no está ya sobre el ícono
      setShowDetailsPanel(true);
    }
  };

  // Manejador para cuando el mouse sale del área del widget principal
  const handleWidgetMouseLeave = () => {
    setShowDetailsPanel(false);
  };

  // Estos manejadores se pasarán al div que envuelve WidgetInfoIcon
  // para controlar el estado isMouseOverIcon
  const handleIconMouseEnter = () => {
    setIsMouseOverIcon(true);
    setShowDetailsPanel(false); // Ocultar el panel de detalles si el mouse entra al ícono
  };

  const handleIconMouseLeave = () => {
    setIsMouseOverIcon(false);
    // No volvemos a mostrar el panel de detalles automáticamente al salir del ícono,
    // el usuario tendría que re-entrar al área principal del widget (excluyendo el ícono).
  };


  if (loading) {
    return (
      <div className="dashboard-widget salud-financiera-widget" ref={widgetRef}>
        <div className="widget-header-container">
          <h3>{widgetTitle}</h3>
          {/* Envolvemos el WidgetInfoIcon para capturar sus eventos de mouse */}
          <div 
            onMouseEnter={handleIconMouseEnter}
            onMouseLeave={handleIconMouseLeave}
          >
            <WidgetInfoIcon description={widgetDescription} />
          </div>
        </div>
        <div className="dashboard-widget-content">
          <WidgetLoader message="Calculando salud financiera..." />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dashboard-widget salud-financiera-widget" ref={widgetRef}>
        <div className="widget-header-container">
          <h3>{widgetTitle}</h3>
           <div 
            onMouseEnter={handleIconMouseEnter}
            onMouseLeave={handleIconMouseLeave}
          >
            <WidgetInfoIcon description={widgetDescription} />
          </div>
        </div>
        <div className="dashboard-widget-content">
          <p className="error-message" style={{ textAlign: 'center' }}>
            {typeof error === 'string' ? error : 'No se pudo cargar la salud financiera.'}
          </p>
        </div>
      </div>
    );
  }

  const {
    overallScore, 
    savingsRate, 
    emergencyFund, 
    debtToIncomeRatio, 
    debtCoverage, 
  } = data; 

  const scoreColorClass = getScoreColor(overallScore);
  const assessmentText = overallScore >= 75 ? "Saludable" : overallScore >= 50 ? "Mejorable" : "Requiere Atención";

  return (
    <div 
      className="dashboard-widget salud-financiera-widget"
      ref={widgetRef}
      onMouseEnter={handleWidgetMouseEnter} // Se activa para el widget
      onMouseLeave={handleWidgetMouseLeave} // Se activa para el widget
    >
      <div className="widget-header-container">
        <h3>{widgetTitle}</h3>
        {/* Envolvemos el WidgetInfoIcon para capturar sus eventos de mouse y controlar el estado */}
        <div 
          onMouseEnter={handleIconMouseEnter}
          onMouseLeave={handleIconMouseLeave}
        >
          <WidgetInfoIcon description={widgetDescription} />
        </div>
      </div>
      <div className="dashboard-widget-content"> 
        <div className="sfw-main-score-container">
          <div className={`sfw-score-circle ${scoreColorClass}`}>
            <span className="sfw-score-value">{overallScore}</span>
            <span className="sfw-score-label">/ 100</span>
          </div>
          <p className={`sfw-score-assessment ${scoreColorClass}`}>
            {assessmentText}
          </p>
        </div>

        {/* El panel de detalles ahora depende de showDetailsPanel Y de que el mouse no esté sobre el ícono */}
        <div className={`sfw-details-panel ${(showDetailsPanel && !isMouseOverIcon) ? 'visible' : ''}`}>
          <h4>Detalle de Métricas:</h4>
          <div className="sfw-submetrics-grid">
            {savingsRate && (
              <SubMetricItem
                label="Tasa de Ahorro Mensual"
                value={savingsRate.value}
                unit="%"
                recommendation={savingsRate.recommendation}
                status={savingsRate.status}
              />
            )}
            {emergencyFund && (
              <SubMetricItem
                label="Fondo de Emergencia"
                value={emergencyFund.value}
                unit=" meses"
                recommendation={emergencyFund.recommendation}
                status={emergencyFund.status}
              />
            )}
            {debtToIncomeRatio && (
              <SubMetricItem
                label="Ratio Deuda/Ingreso (No Hip.)"
                value={debtToIncomeRatio.value} 
                unit="%"
                recommendation={debtToIncomeRatio.recommendation}
                status={debtToIncomeRatio.status}
              />
            )}
            {debtCoverage && (
              <SubMetricItem
                label="Cobertura de Deudas Corto Plazo"
                value={debtCoverage.value} 
                unit="x"
                recommendation={debtCoverage.recommendation}
                status={debtCoverage.status}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaludFinancieraWidget;
