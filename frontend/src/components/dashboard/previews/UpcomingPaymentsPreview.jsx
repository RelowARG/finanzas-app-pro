// finanzas-app-pro/frontend/src/components/dashboard/previews/UpcomingPaymentsPreview.jsx
import React from 'react';
import '../../dashboard/DashboardComponents.css'; // Estilos generales del widget
import '../../dashboard/UpcomingPaymentsWidget.css'; // Estilos del widget real
import './PreviewStyles.css'; // Estilos específicos para previews

const formatDatePreview = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00Z');
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
};

const UpcomingPaymentsPreview = () => {
  const events = [
    { type: 'recurrente', eventType: 'egreso', icon: '💸', description: 'Netflix Mensual', source: 'Recurrente: Santander Río', amount: 3500, currency: 'ARS', date: '2025-06-10' },
    { type: 'tarjeta', eventType: 'egreso', icon: '💳', description: 'Venc. Tarjeta Visa', source: 'Tarjeta: Visa Gold', amount: 25800, currency: 'ARS', date: '2025-06-15' },
    { type: 'loan', eventType: 'ingreso', icon: '💰', description: 'Cobro Préstamo Juan', source: 'Préstamo con: Juan Pérez', amount: 5000, currency: 'ARS', date: '2025-06-20' },
  ];

  return (
    <div className="dashboard-widget upcoming-payments-widget preview-mode">
      <h3>Próximos Vencimientos</h3>
      <div className="dashboard-widget-content" style={{ padding: '5px 0 0 0' }}> {/* Menos padding para preview */}
        <ul className="upcoming-events-list">
          {events.slice(0, 3).map((event, index) => ( // Mostrar solo 3 para el preview
            <li key={index} className={`upcoming-event-item item-type-${event.type} item-event-${event.eventType}`}>
              <a href="#!" className="upcoming-event-link"> {/* Enlaces desactivados */}
                <span className="event-icon">{event.icon}</span>
                <div className="event-info">
                  <span className="event-description" title={event.description}>
                    {event.description.length > 20 ? event.description.substring(0, 17) + '...' : event.description}
                  </span>
                  <span className="event-source" style={{fontSize:'0.6rem'}}> {/* Fuente más pequeña para el source */}
                     {event.source.length > 18 ? event.source.substring(0, 15) + '...' : event.source}
                  </span>
                </div>
                <div className="event-details">
                  <span className={`event-amount ${event.eventType === 'ingreso' ? 'text-positive' : 'text-negative'}`}>
                    ${Number(event.amount).toLocaleString('es-AR', {minimumFractionDigits:0, maximumFractionDigits:0})}
                  </span>
                  <span className="event-date">{formatDatePreview(event.date)}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UpcomingPaymentsPreview;