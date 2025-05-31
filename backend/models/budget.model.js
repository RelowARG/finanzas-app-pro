// Ruta: finanzas-app-pro/backend/models/budget.model.js
// ARCHIVO NUEVO
module.exports = (sequelize, Sequelize, DataTypes) => {
  const Budget = sequelize.define("budget", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    amount: { // Monto presupuestado
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'ARS'
    },
    period: { // 'mensual', 'anual', 'quincenal', 'semanal', 'personalizado'
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'mensual'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    icon: { // Icono de la categoría del presupuesto (puede ser denormalizado)
      type: DataTypes.STRING(10),
      allowNull: true
    },
    // categoryName también podría denormalizarse aquí para fácil acceso
    categoryNameSnapshot: { // Guardar el nombre de la categoría al momento de crear el presupuesto
        type: DataTypes.STRING,
        allowNull: true
    }
    // userId y categoryId se añadirán por las asociaciones
  }, {
    tableName: 'budgets',
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['categoryId'] },
        { fields: ['startDate', 'endDate'] },
    ]
  });

  return Budget;
};
