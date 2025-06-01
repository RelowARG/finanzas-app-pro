// Ruta: finanzas-app-pro/backend/models/account.model.js
module.exports = (sequelize, Sequelize, DataTypes) => {
  const Account = sequelize.define("account", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    type: {
      type: Sequelize.STRING, 
      allowNull: false
    },
    balance: {
      type: Sequelize.DECIMAL(15, 2), 
      allowNull: false,
      defaultValue: 0.00
    },
    currency: {
      type: Sequelize.STRING(5), 
      allowNull: false,
      defaultValue: 'ARS'
    },
    icon: { 
      type: Sequelize.STRING(10),
      allowNull: true
    },
    bankName: {
        type: Sequelize.STRING,
        allowNull: true
    },
    accountNumberLast4: { 
        type: Sequelize.STRING(4),
        allowNull: true
    },
    creditLimit: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
    },
    includeInDashboardSummary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    // Campos para tarjetas de crédito
    statementBalance: { // Saldo del resumen actual a pagar
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
    },
    statementCloseDate: { // Fecha de cierre del resumen actual
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    statementDueDate: { // Fecha de vencimiento del resumen actual
        type: DataTypes.DATEONLY,
        allowNull: true
    }
    // userId se añade por la asociación
  }, {
    tableName: 'accounts',
    timestamps: true,
  });

  return Account;
};
