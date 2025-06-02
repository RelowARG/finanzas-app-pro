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
    amount: { // Este monto se guardará negativo para egresos/transferencias salientes, positivo para ingresos/transferencias entrantes
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
      // *** AÑADIDO 'transferencia' AL ENUM ***
      type: DataTypes.ENUM('ingreso', 'egreso', 'transferencia'),
      allowNull: false
    },
    // *** NUEVO CAMPO OPCIONAL para identificar la contraparte de una transferencia ***
    relatedAccountId: { // Para transferencias, ID de la cuenta de destino/origen
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'accounts', // Nombre de la tabla de cuentas
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL' // O 'RESTRICT' si no quieres que se eliminen transacciones si se borra la cuenta relacionada
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
        { fields: ['type'] }, // *** AÑADIR ÍNDICE AL NUEVO TIPO SI ES NECESARIO ***
        { fields: ['relatedAccountId'] },
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
            } else {
                transaction.currentInstallment = null;
                transaction.totalInstallments = null;
            }
            // Si es transferencia, la categoría podría ser opcional o una especial
            if (transaction.type === 'transferencia' && !transaction.categoryId) {
                // Podrías asignar una categoría por defecto para transferencias aquí
                // o permitir que sea nula y manejarlo en la lógica de negocio/UI.
            }
        },
        beforeSave: (transaction, options) => { 
            const numericAmount = Math.abs(parseFloat(transaction.amount) || 0);

            if (transaction.type === 'egreso' || (transaction.type === 'transferencia' && transaction.amount < 0) ) {
                transaction.amount = -numericAmount; 
            } else if (transaction.type === 'ingreso' || (transaction.type === 'transferencia' && transaction.amount >= 0) ) {
                transaction.amount = numericAmount; 
            }
        }
    }
  });

  return Transaction;
};