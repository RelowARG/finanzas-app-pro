// Ruta: src/components/dashboard/SaludFinancieraWidget.jsx
import React, { useState } from 'react';
import WidgetLoader from './WidgetLoader'; // *** IMPORTAR WidgetLoader ***
import './DashboardComponents.css'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css]
import './SaludFinancieraWidget.css'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/SaludFinancieraWidget.css]

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
    <div className={`sfw-submetric-item sfw-status-${status}`}> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SaludFinancieraWidget.css] */}
      <span className="sfw-submetric-label">{label}:</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SaludFinancieraWidget.css] */}
      <span className="sfw-submetric-value">{displayValue}{unit}</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SaludFinancieraWidget.css] */}
      {recommendation && <p className="sfw-submetric-recommendation">{recommendation}</p>} {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SaludFinancieraWidget.css] */}
    </div>
  );
};

// Aceptar data, loading y error como props
const SaludFinancieraWidget = ({ data, loading, error }) => {
  const [showDetails, setShowDetails] = useState(false); 

  if (loading) {
    return (
      <div className="dashboard-widget salud-financiera-widget">
        <h3>Salud Financiera General</h3>
        <div className="dashboard-widget-content">
          <WidgetLoader message="Calculando salud financiera..." />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dashboard-widget salud-financiera-widget">
        <h3>Salud Financiera General</h3>
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
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      <h3>Salud Financiera General</h3>
      <div className="dashboard-widget-content"> 
        <div className="sfw-main-score-container"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SaludFinancieraWidget.css] */}
          <div className={`sfw-score-circle ${scoreColorClass}`}> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SaludFinancieraWidget.css] */}
            <span className="sfw-score-value">{overallScore}</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SaludFinancieraWidget.css] */}
            <span className="sfw-score-label">/ 100</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SaludFinancieraWidget.css] */}
          </div>
          <p className={`sfw-score-assessment ${scoreColorClass}`}> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SaludFinancieraWidget.css] */}
            {assessmentText}
          </p>
        </div>

        <div className={`sfw-details-panel ${showDetails ? 'visible' : ''}`}> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SaludFinancieraWidget.css] */}
          <h4>Detalle de Métricas:</h4>
          <div className="sfw-submetrics-grid"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SaludFinancieraWidget.css] */}
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
