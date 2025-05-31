// Ruta: finanzas-app-pro/backend/models/recurringTransaction.model.js
// ARCHIVO NUEVO
module.exports = (sequelize, Sequelize, DataTypes) => {
  const RecurringTransaction = sequelize.define("recurringTransaction", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false // Siempre positivo, el tipo definirá si es ingreso o egreso (generalmente egreso para "fijos")
    },
    currency: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'ARS'
    },
    type: { // 'ingreso' o 'egreso'
      type: DataTypes.ENUM('ingreso', 'egreso'),
      allowNull: false,
      defaultValue: 'egreso'
    },
    frequency: { // 'diaria', 'semanal', 'quincenal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual'
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'mensual'
    },
    dayOfWeek: { // Para frecuencia semanal (0=Domingo, 1=Lunes, ..., 6=Sábado)
      type: DataTypes.INTEGER,
      allowNull: true
    },
    dayOfMonth: { // Para frecuencia mensual, bimestral, etc. (1-31). Usar 29,30,31 con cuidado por meses cortos.
                  // O un valor especial como 'ultimo' (requiere lógica adicional).
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // monthOfYear: // Para frecuencia anual, si es un día específico de un mes específico.
    startDate: { // Fecha en que comienza la recurrencia
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    endDate: { // Fecha opcional en que termina la recurrencia
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    nextRunDate: { // Próxima fecha en que se debe generar la transacción
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    lastRunDate: { // Última fecha en que se generó la transacción
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // userId, accountId, categoryId se añadirán por las asociaciones
  }, {
    tableName: 'recurring_transactions',
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['accountId'] },
        { fields: ['categoryId'] },
        { fields: ['nextRunDate', 'isActive'] } // Importante para el job scheduler
    ]
  });

  return RecurringTransaction;
};
