// Ruta: finanzas-app-pro/backend/models/debtAndLoan.model.js
module.exports = (sequelize, Sequelize, DataTypes) => {
  const DebtAndLoan = sequelize.define("debtAndLoan", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: { // 'debt' (yo debo), 'loan' (me deben / yo presté)
      type: DataTypes.ENUM('debt', 'loan'),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    personInvolved: { 
      type: DataTypes.STRING,
      allowNull: false
    },
    totalAmount: { // Monto total original de la deuda o préstamo
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    paidAmount: { // Monto que ya he pagado (si es deuda) o que ya me han devuelto (si es préstamo)
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    currency: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'ARS'
    },
    initialDate: { 
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    dueDate: { 
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    status: { 
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'defaulted', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Campos específicos para "Presté mi tarjeta a Gabi para compra en cuotas"
    // (Esto es cuando YO hago la compra con MI tarjeta, y Gabi me devuelve a MÍ el dinero)
    isMyCreditCardLoanToOther: { 
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    installmentsTotalForOther: { // Total de cuotas que Gabi me pagará a mí
      type: DataTypes.INTEGER,
      allowNull: true
    },
    installmentsPaidByOther: { // Cuántas cuotas Gabi ya me pagó
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },

    // Campos específicos para "Presté $X y me devuelven $Y en Z cuotas"
    // (Esto es cuando YO presto dinero directamente, y me lo devuelven en partes)
    isRepaidInInstallments: { // Si el préstamo que hice me lo devuelven en cuotas
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    repaymentInstallmentAmount: { // Monto de cada cuota que me pagan
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
    },
    repaymentTotalInstallments: { // Total de cuotas que me van a pagar
        type: DataTypes.INTEGER,
        allowNull: true
    },
    repaymentInstallmentsPaid: { // Cuántas cuotas ya me pagaron de este préstamo
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    repaymentFrequency: { // Frecuencia de las devoluciones (ej: 'monthly')
        type: DataTypes.STRING, // Podría ser ENUM('monthly', 'biweekly', 'weekly')
        allowNull: true
    },
    firstRepaymentDate: { // Fecha de la primera devolución esperada
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    nextExpectedPaymentDate: { // Calculado o manual, para la próxima devolución
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    // nextExpectedPaymentAmount ya existe, se puede usar para el monto de la próxima cuota de devolución.

    // userId se añadirá por la asociación
  }, {
    tableName: 'debts_and_loans',
    timestamps: true,
    hooks: {
        beforeSave: (instance, options) => {
            // Calcular remainingAmount y actualizar status automáticamente
            const remaining = parseFloat(instance.totalAmount) - parseFloat(instance.paidAmount);
            if (remaining <= 0 && instance.status !== 'cancelled') { // No marcar como completed si está cancelado
                instance.status = 'completed';
            } else if (parseFloat(instance.paidAmount) > 0 && instance.status === 'pending') {
                instance.status = 'in_progress';
            }
            // No cambiar a 'pending' si ya está 'in_progress' o 'completed' solo por paidAmount = 0

            if (instance.type === 'loan') {
                if (instance.isMyCreditCardLoanToOther && instance.installmentsTotalForOther) {
                    if (instance.installmentsPaidByOther >= instance.installmentsTotalForOther && instance.status !== 'cancelled') {
                        instance.status = 'completed';
                    }
                }
                if (instance.isRepaidInInstallments && instance.repaymentTotalInstallments) {
                    if (instance.repaymentInstallmentsPaid >= instance.repaymentTotalInstallments && instance.status !== 'cancelled') {
                        instance.status = 'completed';
                    }
                }
            }
        }
    },
    indexes: [
        { fields: ['userId'] },
        { fields: ['type'] },
        { fields: ['status'] },
        { fields: ['personInvolved'] },
    ]
  });

  return DebtAndLoan;
};
