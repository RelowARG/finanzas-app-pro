// Ruta: finanzas-app-pro/backend/models/index.js
const dbConfig = require('../config/db.config.js'); // No se usa directamente si las vars de entorno están configuradas
const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs'); // <--- AÑADIDO para leer el certificado

// Cargar variables de entorno desde .env en la raíz del backend
// Asegúrate que .env esté presente o que las variables se definan en el entorno de Render
require('dotenv').config(); 

const sequelizeOptions = {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT || 'mysql',
  port: process.env.DB_PORT || 3306, // El puerto 4000 de TiDB
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX, 10) || 5,
    min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
    idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000
  },
  define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
  }
};

// Configuración SSL para TiDB Cloud (o cualquier MySQL que requiera SSL con CA)
// En producción (Render), asumimos que SSL es requerido.
if (process.env.NODE_ENV === 'production') {
    if (process.env.DB_SSL_CA_PATH) {
        try {
            // En Render, DB_SSL_CA_PATH será la ruta al "Secret File"
            const caCert = fs.readFileSync(process.env.DB_SSL_CA_PATH).toString();
            sequelizeOptions.dialectOptions = {
                ssl: {
                    ca: caCert,
                    // rejectUnauthorized: true // Generalmente es bueno tenerlo, TiDB Cloud lo maneja bien con su CA
                }
            };
            console.log('Certificado SSL CA cargado para la conexión a la base de datos desde:', process.env.DB_SSL_CA_PATH);
        } catch (e) {
            console.error('Error crítico al leer el archivo del certificado CA:', e.message);
            console.error('La aplicación podría no conectarse a la base de datos. Asegúrate que DB_SSL_CA_PATH sea correcto y el archivo exista en Render.');
            // Considera terminar el proceso si el CA es absolutamente necesario y no se puede cargar
            // process.exit(1); 
        }
    } else {
        // Si estás seguro que tu TiDB Cloud Serverless no necesita un CA específico y solo TLS.
        // Podrías configurar ssl: true o un objeto vacío, pero usar el CA provisto es más seguro.
        // TiDB Cloud Serverless generalmente SÍ requiere el CA que ellos proveen.
        console.warn('NODE_ENV es production pero DB_SSL_CA_PATH no está definido. La conexión SSL podría fallar o ser insegura si el CA es requerido por TiDB Cloud.');
        // Como fallback, podrías intentar con una configuración SSL más genérica, aunque NO RECOMENDADO sin el CA:
        // sequelizeOptions.dialectOptions = { ssl: { rejectUnauthorized: false } }; // ¡MENOS SEGURO!
    }
} else if (process.env.DB_SSL_REQUIRED === 'true' && process.env.DB_SSL_CA_PATH) {
    // Para pruebas locales con SSL
    try {
        const caCert = fs.readFileSync(process.env.DB_SSL_CA_PATH).toString();
        sequelizeOptions.dialectOptions = {
            ssl: {
                ca: caCert,
            }
        };
        console.log('Certificado SSL CA cargado (desarrollo/prueba local) desde:', process.env.DB_SSL_CA_PATH);
    } catch (e) {
        console.error('Error al leer el archivo del certificado CA (desarrollo/prueba local):', e.message);
    }
}


const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  sequelizeOptions // Usa las opciones configuradas
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Cargar modelos
db.User = require("./user.model.js")(sequelize, Sequelize, DataTypes);
db.Account = require("./account.model.js")(sequelize, Sequelize, DataTypes);
db.Category = require("./category.model.js")(sequelize, Sequelize, DataTypes);
db.Transaction = require("./transaction.model.js")(sequelize, Sequelize, DataTypes);
db.Investment = require("./investment.model.js")(sequelize, Sequelize, DataTypes);
db.Budget = require("./budget.model.js")(sequelize, Sequelize, DataTypes);
db.RecurringTransaction = require("./recurringTransaction.model.js")(sequelize, Sequelize, DataTypes);
db.DebtAndLoan = require("./debtAndLoan.model.js")(sequelize, Sequelize, DataTypes);
db.ExchangeRate = require("./exchangeRate.model.js")(sequelize, Sequelize, DataTypes);

// --- Definir Relaciones ---
// (Las relaciones permanecen igual)
db.User.hasMany(db.Account, { foreignKey: { name: 'userId', allowNull: false }, as: 'accounts' });
db.Account.belongsTo(db.User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });

db.User.hasMany(db.Category, { foreignKey: { name: 'userId', allowNull: true }, as: 'customCategories' });
db.Category.belongsTo(db.User, { foreignKey: { name: 'userId', allowNull: true }, as: 'user' });

db.User.hasMany(db.Transaction, { foreignKey: { name: 'userId', allowNull: false }, as: 'transactions' });
db.Transaction.belongsTo(db.User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });

db.Account.hasMany(db.Transaction, { foreignKey: { name: 'accountId', allowNull: false }, as: 'transactions' });
db.Transaction.belongsTo(db.Account, { foreignKey: { name: 'accountId', allowNull: false }, as: 'account' });

db.Category.hasMany(db.Transaction, { foreignKey: { name: 'categoryId', allowNull: false }, as: 'transactions' });
db.Transaction.belongsTo(db.Category, { foreignKey: { name: 'categoryId', allowNull: false }, as: 'category' });

db.User.hasMany(db.Investment, { foreignKey: { name: 'userId', allowNull: false }, as: 'investments' });
db.Investment.belongsTo(db.User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });

db.User.hasMany(db.Budget, { foreignKey: { name: 'userId', allowNull: false }, as: 'budgets' });
db.Budget.belongsTo(db.User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });

db.Category.hasMany(db.Budget, { foreignKey: { name: 'categoryId', allowNull: false }, as: 'budgetsForCategory' });
db.Budget.belongsTo(db.Category, { foreignKey: { name: 'categoryId', allowNull: false }, as: 'category' });

db.User.hasMany(db.RecurringTransaction, { foreignKey: { name: 'userId', allowNull: false }, as: 'recurringTransactions' });
db.RecurringTransaction.belongsTo(db.User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });

db.Account.hasMany(db.RecurringTransaction, { foreignKey: { name: 'accountId', allowNull: false }, as: 'recurringDebits' });
db.RecurringTransaction.belongsTo(db.Account, { foreignKey: { name: 'accountId', allowNull: false }, as: 'account' });

db.Category.hasMany(db.RecurringTransaction, { foreignKey: { name: 'categoryId', allowNull: false }, as: 'recurringCategorizations' });
db.RecurringTransaction.belongsTo(db.Category, { foreignKey: { name: 'categoryId', allowNull: false }, as: 'category' });

db.User.hasMany(db.DebtAndLoan, { foreignKey: { name: 'userId', allowNull: false }, as: 'debtsAndLoans' });
db.DebtAndLoan.belongsTo(db.User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });

db.User.hasMany(db.ExchangeRate, { foreignKey: { name: 'userId', allowNull: false }, as: 'exchangeRates' });
db.ExchangeRate.belongsTo(db.User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });

module.exports = db;