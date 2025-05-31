// Ruta: finanzas-app-pro/backend/models/investment.model.js
// ARCHIVO NUEVO
module.exports = (sequelize, Sequelize, DataTypes) => {
  const Investment = sequelize.define("investment", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: { // Nombre descriptivo de la inversión
      type: DataTypes.STRING,
      allowNull: false
    },
    type: { // 'plazo_fijo', 'acciones', 'criptomonedas', 'fci', 'obligaciones', 'otro'
      type: DataTypes.STRING,
      allowNull: false
    },
    entity: { // Banco, Broker, Exchange, etc.
      type: DataTypes.STRING,
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'ARS'
    },
    initialInvestment: { // Monto total inicial invertido (costo)
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true // Puede ser calculado o ingresado
    },
    currentValue: { // Valor actual de la inversión
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    purchaseDate: { // Fecha de compra o inicio de la inversión
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Campos específicos por tipo (usar allowNull: true)
    // Para Plazo Fijo
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    endDate: { type: DataTypes.DATEONLY, allowNull: true },
    interestRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true }, // TNA %
    // Para Acciones / Criptomonedas
    quantity: { type: DataTypes.DECIMAL(20, 8), allowNull: true }, // Alta precisión para cripto
    purchasePrice: { type: DataTypes.DECIMAL(15, 2), allowNull: true }, // Precio por unidad al comprar
    currentPrice: { type: DataTypes.DECIMAL(15, 2), allowNull: true }, // Precio actual por unidad
    ticker: { type: DataTypes.STRING, allowNull: true },
    // Para FCI / Obligaciones (amountInvested podría ser initialInvestment)
    amountInvested: { // Si es un monto único y no por cantidad/precio
        type: DataTypes.DECIMAL(15,2),
        allowNull: true
    }
    // userId se añadirá por la asociación
  }, {
    tableName: 'investments',
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['type'] },
    ]
  });

  return Investment;
};