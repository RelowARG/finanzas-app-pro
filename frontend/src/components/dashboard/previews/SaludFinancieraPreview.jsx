// Ruta: src/components/dashboard/previews/SaludFinancieraPreview.jsx
import React from 'react';
import '../../dashboard/DashboardComponents.css';
import '../../dashboard/SaludFinancieraWidget.css'; // Reutilizar estilos del widget real
import './PreviewStyles.css'; // Estilos para el modo preview

const getScoreColor = (score) => {
  if (score >= 75) return 'score-high';
  if (score >= 50) return 'score-medium';
  return 'score-low';
};

const SaludFinancieraPreview = () => {
  const data = {
    overallScore: 68,
    savingsRate: { value: 12, status: 'medium' },
    emergencyFund: { value: 2, status: 'low' },
    // Podrías añadir más métricas si quieres que el preview sea más completo
    // debtToIncomeRatio: { value: 35, status: 'high' },
    // debtCoverage: { value: 1.1, status: 'medium' }
  };
  const scoreColorClass = getScoreColor(data.overallScore);

  return (
    <div className="dashboard-widget salud-financiera-widget preview-mode">
      <h3>Salud Financiera</h3>
      <div className="dashboard-widget-content">
        <div className="sfw-main-score-container">
          <div className={`sfw-score-circle ${scoreColorClass}`} style={{ width: '80px', height: '80px' }}> {/* Más pequeño para preview */}
            <span className="sfw-score-value" style={{ fontSize: '1.8rem' }}>{data.overallScore}</span>
            <span className="sfw-score-label" style={{ fontSize: '0.6rem' }}>/ 100</span>
          </div>
          <p className={`sfw-score-assessment ${scoreColorClass}`} style={{ fontSize: '0.8rem', marginTop: '5px' }}>
            {data.overallScore >= 75 ? "Saludable" : data.overallScore >= 50 ? "Mejorable" : "Atención"}
          </p>
        </div>

        <div className="sfw-submetrics-grid preview-submetrics">
          <div className={`sfw-submetric-item sfw-status-${data.savingsRate.status}`}>
            <span className="sfw-submetric-label">Ahorro:</span>
            <span className="sfw-submetric-value">{data.savingsRate.value}%</span>
          </div>
          <div className={`sfw-submetric-item sfw-status-${data.emergencyFund.status}`}>
            <span className="sfw-submetric-label">F. Emergencia:</span>
            <span className="sfw-submetric-value">{data.emergencyFund.value}m</span>
          </div>
          {/* Ejemplo de cómo se verían más métricas en el preview si las añades */}
          {/* {data.debtToIncomeRatio && (
            <div className={`sfw-submetric-item sfw-status-${data.debtToIncomeRatio.status}`}>
              <span className="sfw-submetric-label">Deuda/Ingr:</span>
              <span className="sfw-submetric-value">{data.debtToIncomeRatio.value}%</span>
            </div>
          )}
          */}
        </div>
      </div>
    </div>
  );
};

export default SaludFinancieraPreview;
