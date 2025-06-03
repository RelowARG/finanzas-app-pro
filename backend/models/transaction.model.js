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
    amount: { 
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
      type: DataTypes.ENUM('ingreso', 'egreso', 'transferencia'),
      allowNull: false
    },
    relatedAccountId: { 
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'accounts', 
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL' 
    },
    // *** CAMBIO AQUÍ ***
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Permitir NULL para transferencias
      references: {
        model: 'categories', 
        key: 'id'
      },
      onDelete: 'SET NULL', // Si se borra una categoría, poner categoryId a NULL en la transacción
      onUpdate: 'CASCADE'
    },
    // *** FIN CAMBIO ***
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
        { fields: ['type'] },
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
            // Validación de categoryId se mueve al controlador para ser condicional
            // if (transaction.type !== 'transferencia' && !transaction.categoryId) {
            //     throw new Error('La categoría es requerida para ingresos y egresos.');
            // }
        },
        beforeSave: (transaction, options) => { 
            const numericAmount = Math.abs(parseFloat(transaction.amount) || 0);

            if (transaction.type === 'egreso') {
                transaction.amount = -numericAmount; 
            } else if (transaction.type === 'ingreso') {
                transaction.amount = numericAmount; 
            }
            // Para transferencias, el signo se maneja en el controlador al crear las dos transacciones
            // (una negativa para la cuenta origen, una positiva para la cuenta destino).
            // Este hook beforeSave general podría interferir si no se ajusta.
            // Si el controlador ya asigna el signo correcto, este hook podría simplificarse o
            // ser más específico. Por ahora, lo dejamos así, asumiendo que el controlador
            // pasará el monto con el signo correcto antes de llegar aquí para el caso de 'transferencia'.
            // O, mejor aún, el controlador es el responsable final del signo para las transferencias.
            // La transacción 'outgoing' de una transferencia ya se crea con monto negativo en el controller.
            // La transacción 'incoming' de una transferencia ya se crea con monto positivo en el controller.
        }
    }
  });

  return Transaction;
};