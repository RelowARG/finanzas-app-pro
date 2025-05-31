// Ruta: finanzas-app-pro/frontend/src/components/dashboard/QuickActions.jsx
// ACTUALIZA ESTE ARCHIVO
import React from 'react';
import { Link } from 'react-router-dom';
// Asegúrate que DashboardComponents.css (o el CSS donde estén los nuevos estilos) se importe
// en un nivel superior (como DashboardPage.jsx) o aquí directamente si es necesario.
// import './DashboardComponents.css'; // Si los estilos están allí
import './InvestmentHighlights.css'; // Si los estilos de botón están en otro lado (revisar)

const QuickActions = () => {
  return (
    // Cambiamos la clase del div contenedor y eliminamos el h3
    <div className="dashboard-quick-actions-bar"> 
      {/* Ya no necesitamos el <h3>Acciones Rápidas</h3> aquí si va directo en el flujo */}
      {/* La clase "actions-buttons" se fusiona con "dashboard-quick-actions-bar" */}
      <Link to="/transactions/add?type=ingreso" className="button button-quick-action button-income">
        ➕ Registrar Ingreso
      </Link>
      <Link to="/transactions/add?type=egreso" className="button button-quick-action button-expense">
        ➖ Registrar Gasto
      </Link>
      <Link to="/accounts/add" className="button button-quick-action button-account">
        🏦 Nueva Cuenta
      </Link>
      <Link to="/investments/add" className="button button-quick-action button-transfer"> {/* Usando clase transfer para color naranja */}
        💹 Nueva Inversión
      </Link>
    </div>
  );
};

export default QuickActions;
