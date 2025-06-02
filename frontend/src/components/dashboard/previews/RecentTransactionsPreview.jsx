// Ruta: src/components/dashboard/previews/RecentTransactionsPreview.jsx
import React from 'react';
import '../../dashboard/DashboardComponents.css';
import './PreviewStyles.css';

const formatCurrencyPreview = (amount, currency = 'ARS') => {
    const symbol = currency === 'USD' ? 'U$S' : '$';
    const value = Number(amount) || 0;
    const absAmount = Math.abs(value);
    // Determinar el signo basado en el valor original
    const sign = value < 0 ? '-' : (value > 0 && currency === 'ARS' && symbol === '$' ? '' : ''); // No añadir '+' para ARS positivo
    return `${sign}${symbol}${absAmount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatDatePreview = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString + 'T00:00:00Z'); // Interpretar como UTC
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    } catch {
        return 'Fecha Inv.';
    }
};


const RecentTransactionsPreview = () => {
  const transactions = [
    { id: 1, icon: '🍔', description: 'Almuerzo de trabajo', category: { name: 'Comida' }, amount: -1250.00, currency: 'ARS', date: '2025-06-02' },
    { id: 2, icon: '🛒', description: 'Compra Supermercado', category: { name: 'Supermercado' }, amount: -8750.00, currency: 'ARS', date: '2025-06-01' },
    { id: 3, icon: '💰', description: 'Sueldo Mayo', category: { name: 'Sueldo' }, amount: 250000.00, currency: 'ARS', date: '2025-05-31' },
    { id: 4, icon: '💡', description: 'Pago Luz', category: { name: 'Servicios' }, amount: -3500.00, currency: 'ARS', date: '2025-05-30'},
  ];

  return (
    <div className="dashboard-widget recent-transactions-widget preview-mode">
      <h3>Últimos Registros</h3>
      <div className="dashboard-widget-content">
        <ul className="transactions-list">
          {transactions.slice(0, 3).map(tx => ( // Mostrar solo 3 para el preview
            <li key={tx.id} className={`dashboard-transaction-item ${tx.amount >= 0 ? 'ingreso' : 'egreso'}`}>
              <a href="#!" className="dashboard-transaction-link"> {/* Enlaces desactivados */}
                <span className="dashboard-transaction-icon">{tx.icon}</span>
                <div className="dashboard-transaction-info">
                  <span className="dashboard-transaction-description" title={tx.description}>
                    {tx.description.length > 18 ? tx.description.substring(0, 15) + '...' : tx.description}
                  </span>
                  <span className="dashboard-transaction-category">
                    {tx.category?.name}
                  </span>
                </div>
                <div className="dashboard-transaction-details">
                  <span className={`dashboard-transaction-amount ${tx.amount >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {formatCurrencyPreview(tx.amount, tx.currency)}
                  </span>
                  <span className="dashboard-transaction-date">{formatDatePreview(tx.date)}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
export default RecentTransactionsPreview;