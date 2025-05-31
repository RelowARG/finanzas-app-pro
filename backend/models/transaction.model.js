// Ruta: finanzas-app-pro/backend/models/transaction.model.js
module.exports = (sequelize, Sequelize, DataTypes) => {
  const Transaction = sequelize.define("transaction", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true 
    },
    amount: { // Este monto se guardará negativo para egresos, positivo para ingresos
      type: DataTypes.DECIMAL(15, 2), 
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'ARS'
    },
    date: {
      type: DataTypes.DATEONLY, 
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    type: { 
      type: DataTypes.ENUM('ingreso', 'egreso'),
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    icon: { 
      type: DataTypes.STRING(10),
      allowNull: true
    },
    isInstallment: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    currentInstallment: { 
      type: DataTypes.INTEGER,
      allowNull: true
    },
    totalInstallments: { 
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'transactions',
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['accountId'] },
        { fields: ['categoryId'] },
        { fields: ['date'] },
        { fields: ['isInstallment'] } 
    ],
    hooks: {
        beforeValidate: (transaction, options) => {
            if (transaction.isInstallment) {
                if (transaction.currentInstallment == null || parseInt(transaction.currentInstallment, 10) < 1) {
                    throw new Error('El número de cuota actual es requerido y debe ser al menos 1.');
                }
                if (transaction.totalInstallments == null || parseInt(transaction.totalInstallments, 10) < 1) {
                    throw new Error('El número total de cuotas es requerido y debe ser al menos 1.');
                }
                if (parseInt(transaction.currentInstallment, 10) > parseInt(transaction.totalInstallments, 10)) {
                    throw new Error('El número de cuota actual no puede ser mayor al total de cuotas.');
                }
                // Si es una cuota (que asumimos es un egreso), el monto viene positivo del formulario.
                // No hacemos nada con el signo aquí; beforeSave se encargará.
            } else {
                transaction.currentInstallment = null;
                transaction.totalInstallments = null;
            }
        },
        beforeSave: (transaction, options) => { 
            // El monto del formulario (transaction.amount) siempre se espera positivo.
            // El tipo ('ingreso' o 'egreso') determina el signo final.
            const numericAmount = Math.abs(parseFloat(transaction.amount) || 0); // Asegurar que trabajamos con el valor absoluto

            if (transaction.type === 'egreso') {
                transaction.amount = -numericAmount; // Guardar como negativo
            } else if (transaction.type === 'ingreso') {
                transaction.amount = numericAmount; // Guardar como positivo
            }
        }
    }
  });

  return Transaction;
};
