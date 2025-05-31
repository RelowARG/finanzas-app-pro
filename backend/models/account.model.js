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
    // NUEVO CAMPO
    includeInDashboardSummary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true // Por defecto, todas las cuentas se incluyen
    }
    // userId se añade por la asociación
  }, {
    tableName: 'accounts',
    timestamps: true, // Sequelize añade createdAt y updatedAt automáticamente
    // Opciones adicionales del modelo si son necesarias
  });

  return Account;
};
