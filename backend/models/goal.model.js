// finanzas-app-pro/backend/models/goal.model.js
module.exports = (sequelize, DataTypes) => {
  const Goal = sequelize.define("goal", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    targetAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    currentAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    // *** NUEVO CAMPO CURRENCY ***
    currency: {
      type: DataTypes.STRING(3), // Ej. 'ARS', 'USD'
      allowNull: false,
      defaultValue: 'ARS' // Moneda por defecto
    },
    targetDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'paused', 'cancelled'),
      allowNull: false,
      defaultValue: 'active'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: true,
      defaultValue: 'medium'
    }
    // userId será añadido por la asociación
  }, {
    tableName: 'goals',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['targetDate'] },
      { fields: ['currency'] } // *** NUEVO ÍNDICE PARA CURRENCY ***
    ]
  });

  return Goal;
};