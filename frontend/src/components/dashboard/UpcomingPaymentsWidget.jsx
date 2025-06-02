// finanzas-app-pro/frontend/src/components/dashboard/UpcomingPaymentsWidget.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import WidgetLoader from './WidgetLoader'; // *** IMPORTAR WidgetLoader ***
import './DashboardComponents.css'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css]
import './UpcomingPaymentsWidget.css'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/UpcomingPaymentsWidget.css]

const formatCurrencyWidget = (amount, currency = 'ARS') => {
  // ... (tu función formatCurrencyWidget existente)
  if (amount === null || amount === undefined) return '-';
  const symbol = currency === 'USD' ? 'U$S' : '$';
  const value = Number(amount);
  if (isNaN(value)) return '-';
  return `${symbol} ${value.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatDateWidget = (dateString) => {
  // ... (tu función formatDateWidget existente)
  if (!dateString) return 'N/A';
  const date = new Date(dateString + 'T00:00:00Z'); 
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === tomorrow.toDateString()) return 'Mañana';
  
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
};

const getEventTypeDetails = (event) => {
    // ... (tu función getEventTypeDetails existente)
    switch(event.type) {
        case 'recurrente':
            return { label: 'Recurrente', link: '/settings/recurring-transactions', icon: event.icon || '🔁' };
        case 'tarjeta':
            return { label: 'Tarjeta', link: '/accounts', icon: event.icon || '💳' };
        case 'debt':
            return { label: 'Deuda', link: '/debts-loans', icon: event.icon || '💸' };
        case 'loan':
            return { label: 'Préstamo', link: '/debts-loans', icon: event.icon || '💰' };
        case 'inversion':
            return { label: 'Inversión', link: '/investments', icon: event.icon || '📜' };
        default:
            return { label: 'Evento', link: '#', icon: event.icon || '🔔' };
    }
};

// Aceptar events, loading y error como props
const UpcomingPaymentsWidget = ({ events, loading, error }) => {
  if (loading) {
    return (
      <div className="dashboard-widget upcoming-payments-widget">
        <h3>Próximos Vencimientos</h3>
        <div className="dashboard-widget-content">
          <WidgetLoader message="Cargando vencimientos..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-widget upcoming-payments-widget">
        <h3>Próximos Vencimientos</h3>
         <div className="dashboard-widget-content">
            <p className="error-message" style={{ textAlign: 'center', fontSize:'0.9em', padding:'10px' }}>
                {typeof error === 'string' ? error : 'Error cargando vencimientos.'}
            </p>
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="dashboard-widget upcoming-payments-widget">
        <h3>Próximos Vencimientos</h3>
        <div className="dashboard-widget-content">
          <p className="no-data-widget" style={{textAlign: 'center'}}>No hay vencimientos próximos.</p> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-widget upcoming-payments-widget">
      <h3>Próximos Vencimientos</h3>
      <div className="dashboard-widget-content">
        <ul className="upcoming-events-list"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/UpcomingPaymentsWidget.css] */}
          {events.slice(0, 7).map((event, index) => {
            const { label: typeLabel, link: typeLink, icon: typeIcon } = getEventTypeDetails(event);
            const amountColorClass = event.eventType === 'ingreso' ? 'text-positive' : (event.eventType === 'egreso' ? 'text-negative' : '');

            return (
                <li key={`${event.date}-${event.description}-${index}`} className={`upcoming-event-item item-type-${event.type} item-event-${event.eventType}`}> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/UpcomingPaymentsWidget.css] */}
                  <Link to={typeLink} className="upcoming-event-link" title={`${typeLabel}: ${event.source || event.description}`}> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/UpcomingPaymentsWidget.css] */}
                    <span className="event-icon">{typeIcon}</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/UpcomingPaymentsWidget.css] */}
                    <div className="event-info"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/UpcomingPaymentsWidget.css] */}
                      <span className="event-description"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/UpcomingPaymentsWidget.css] */}
                        {event.description.length > 30 ? event.description.substring(0, 27) + '...' : event.description}
                      </span>
                      <span className="event-source"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/UpcomingPaymentsWidget.css] */}
                        {typeLabel}
                      </span>
                    </div>
                    <div className="event-details"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/UpcomingPaymentsWidget.css] */}
                      {(event.amount !== null && event.amount !== undefined && event.eventType !== 'info') && (
                        <span className={`event-amount ${amountColorClass}`}> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/UpcomingPaymentsWidget.css] */}
                          {formatCurrencyWidget(event.amount, event.currency)}
                        </span>
                      )}
                       {event.eventType === 'info' && (
                         <span className="event-amount info-event">{formatCurrencyWidget(event.amount, event.currency)}</span>  /* [cite: finanzas-app-pro/frontend/src/components/dashboard/UpcomingPaymentsWidget.css] */
                       )}
                      <span className="event-date">{formatDateWidget(event.date)}</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/UpcomingPaymentsWidget.css] */}
                    </div>
                  </Link>
                </li>
            )
          })}
        </ul>
      </div>
    </div>
  );
};

export default UpcomingPaymentsWidget;