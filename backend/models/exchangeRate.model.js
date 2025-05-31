// finanzas-app-pro/backend/models/exchangeRate.model.js
module.exports = (sequelize, Sequelize, DataTypes) => {
  const ExchangeRate = sequelize.define("exchangeRate", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    month: { // 1-12
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12,
      },
    },
    fromCurrency: { // e.g., 'USD'
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'USD',
    },
    toCurrency: { // e.g., 'ARS'
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'ARS',
    },
    rate: { // How many 'toCurrency' units for one 'fromCurrency' unit
      type: DataTypes.DECIMAL(15, 4), 
      allowNull: false,
    },
    // userId will be added by association
  }, {
    tableName: 'exchange_rates',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'year', 'month', 'fromCurrency', 'toCurrency'],
        name: 'unique_user_monthly_rate',
      },
      { fields: ['userId'] },
      { fields: ['year', 'month'] },
    ]
  });

  return ExchangeRate;
};