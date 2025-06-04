// Ruta: finanzas-app-pro/backend/models/index.js
const dbConfig = require('../config/db.config.js');
const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs'); 

require('dotenv').config(); 

const sequelizeOptions = {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT || 'mysql',
  port: process.env.DB_PORT || 3306,
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

if (process.env.NODE_ENV === 'production') {
    if (process.env.DB_SSL_CA_PATH) {
        try {
            const caCert = fs.readFileSync(process.env.DB_SSL_CA_PATH).toString();
            sequelizeOptions.dialectOptions = {
                ssl: { ca: caCert }
            };
            //console.log('Certificado SSL CA cargado desde:', process.env.DB_SSL_CA_PATH);
        } catch (e) {
            console.error('Error crítico al leer el certificado CA:', e.message);
        }
    } else {
        console.warn('NODE_ENV es production pero DB_SSL_CA_PATH no está definido.');
    }
} else if (process.env.DB_SSL_REQUIRED === 'true' && process.env.DB_SSL_CA_PATH) {
    try {
        const caCert = fs.readFileSync(process.env.DB_SSL_CA_PATH).toString();
        sequelizeOptions.dialectOptions = { ssl: { ca: caCert } };
        //console.log('Certificado SSL CA cargado (desarrollo) desde:', process.env.DB_SSL_CA_PATH);
    } catch (e) {
        console.error('Error al leer el certificado CA (desarrollo):', e.message);
    }
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  sequelizeOptions
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Cargar modelos existentes
db.User = require("./user.model.js")(sequelize, Sequelize, DataTypes);
db.Account = require("./account.model.js")(sequelize, Sequelize, DataTypes);
db.Category = require("./category.model.js")(sequelize, Sequelize, DataTypes);
db.Transaction = require("./transaction.model.js")(sequelize, Sequelize, DataTypes);
db.Investment = require("./investment.model.js")(sequelize, Sequelize, DataTypes);
db.Budget = require("./budget.model.js")(sequelize, Sequelize, DataTypes);
db.RecurringTransaction = require("./recurringTransaction.model.js")(sequelize, Sequelize, DataTypes);
db.DebtAndLoan = require("./debtAndLoan.model.js")(sequelize, Sequelize, DataTypes);
db.ExchangeRate = require("./exchangeRate.model.js")(sequelize, Sequelize, DataTypes);
db.Permission = require("./permission.model.js")(sequelize, Sequelize, DataTypes);
db.RolePermission = require("./rolePermission.model.js")(sequelize, Sequelize, DataTypes);

// *** NUEVO: Cargar modelo Goal ***
db.Goal = require("./goal.model.js")(sequelize, DataTypes);


// --- Definir Relaciones Existentes ---
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

db.Permission.hasMany(db.RolePermission, { foreignKey: 'permissionId', as: 'rolePermissions' });
db.RolePermission.belongsTo(db.Permission, { foreignKey: 'permissionId', as: 'permissionDetail' });

// *** NUEVO: Definir Relación para Goals ***
db.User.hasMany(db.Goal, { foreignKey: { name: 'userId', allowNull: false }, as: 'goals' });
db.Goal.belongsTo(db.User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });

module.exports = db;