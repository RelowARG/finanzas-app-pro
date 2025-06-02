// Ruta: src/components/dashboard/SaludFinancieraWidget.jsx
import React, { useState } from 'react';
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
      displayValue = "N/A"; // O un símbolo como '∞' si prefieres
    } else if (Number.isFinite(value)) {
      // Formatear a 1 decimal si no es entero, o sin decimales si es entero.
      // Para el ratio de deuda, siempre es bueno ver un decimal.
      // Para la cobertura, también.
      displayValue = value.toLocaleString('es-AR', { minimumFractionDigits: (label.toLowerCase().includes("ratio") || label.toLowerCase().includes("cobertura") || !Number.isInteger(value)) ? 1 : 0, maximumFractionDigits: 1 });
    }
  }
  // Si 'value' ya es un string (ej. "N/A" o un mensaje), se usa tal cual.

  return (
    <div className={`sfw-submetric-item sfw-status-${status}`}>
      <span className="sfw-submetric-label">{label}:</span>
      <span className="sfw-submetric-value">{displayValue}{unit}</span>
      {recommendation && <p className="sfw-submetric-recommendation">{recommendation}</p>}
    </div>
  );
};

const SaludFinancieraWidget = ({ data, loading, error }) => {
  const [showDetails, setShowDetails] = useState(false); 

  if (loading) {
    return (
      <div className="dashboard-widget salud-financiera-widget">
        <h3>Salud Financiera General</h3>
        <div className="dashboard-widget-content">
          <p className="loading-text-widget">Calculando salud financiera...</p>
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
            {error || 'No se pudieron cargar los datos de salud financiera.'}
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
        <div className="sfw-main-score-container">
          <div className={`sfw-score-circle ${scoreColorClass}`}>
            <span className="sfw-score-value">{overallScore}</span>
            <span className="sfw-score-label">/ 100</span>
          </div>
          <p className={`sfw-score-assessment ${scoreColorClass}`}>
            {assessmentText}
          </p>
        </div>

        <div className={`sfw-details-panel ${showDetails ? 'visible' : ''}`}>
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
                value={debtToIncomeRatio.value} // El backend ya debería enviar un número
                unit="%"
                recommendation={debtToIncomeRatio.recommendation}
                status={debtToIncomeRatio.status}
              />
            )}
            {debtCoverage && (
              <SubMetricItem
                label="Cobertura de Deudas Corto Plazo"
                value={debtCoverage.value} // El backend ya debería enviar un número o manejar Infinity
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