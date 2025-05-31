// Ruta: finanzas-app-pro/backend/models/index.js
const dbConfig = require('../config/db.config.js');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config({ path: '../.env' }); 

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 5,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    },
    define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    }
  }
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
db.ExchangeRate = require("./exchangeRate.model.js")(sequelize, Sequelize, DataTypes); // NUEVO MODELO

// --- Definir Relaciones ---

// User <-> Account
db.User.hasMany(db.Account, { foreignKey: { name: 'userId', allowNull: false }, as: 'accounts' });
db.Account.belongsTo(db.User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });

// User <-> Category
db.User.hasMany(db.Category, { foreignKey: { name: 'userId', allowNull: true }, as: 'customCategories' });
db.Category.belongsTo(db.User, { foreignKey: { name: 'userId', allowNull: true }, as: 'user' });

// User <-> Transaction
db.User.hasMany(db.Transaction, { foreignKey: { name: 'userId', allowNull: false }, as: 'transactions' });
db.Transaction.belongsTo(db.User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });

// Account <-> Transaction
db.Account.hasMany(db.Transaction, { foreignKey: { name: 'accountId', allowNull: false }, as: 'transactions' });
db.Transaction.belongsTo(db.Account, { foreignKey: { name: 'accountId', allowNull: false }, as: 'account' });

// Category <-> Transaction
db.Category.hasMany(db.Transaction, { foreignKey: { name: 'categoryId', allowNull: false }, as: 'transactions' });
db.Transaction.belongsTo(db.Category, { foreignKey: { name: 'categoryId', allowNull: false }, as: 'category' });

// User <-> Investment
db.User.hasMany(db.Investment, { foreignKey: { name: 'userId', allowNull: false }, as: 'investments' });
db.Investment.belongsTo(db.User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });

// User <-> Budget
db.User.hasMany(db.Budget, { foreignKey: { name: 'userId', allowNull: false }, as: 'budgets' });
db.Budget.belongsTo(db.User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });

// Category <-> Budget
db.Category.hasMany(db.Budget, { foreignKey: { name: 'categoryId', allowNull: false }, as: 'budgetsForCategory' });
db.Budget.belongsTo(db.Category, { foreignKey: { name: 'categoryId', allowNull: false }, as: 'category' });

// User <-> RecurringTransaction
db.User.hasMany(db.RecurringTransaction, { foreignKey: { name: 'userId', allowNull: false }, as: 'recurringTransactions' });
db.RecurringTransaction.belongsTo(db.User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });

// Account <-> RecurringTransaction
db.Account.hasMany(db.RecurringTransaction, { foreignKey: { name: 'accountId', allowNull: false }, as: 'recurringDebits' });
db.RecurringTransaction.belongsTo(db.Account, { foreignKey: { name: 'accountId', allowNull: false }, as: 'account' });

// Category <-> RecurringTransaction
db.Category.hasMany(db.RecurringTransaction, { foreignKey: { name: 'categoryId', allowNull: false }, as: 'recurringCategorizations' });
db.RecurringTransaction.belongsTo(db.Category, { foreignKey: { name: 'categoryId', allowNull: false }, as: 'category' });

// User <-> DebtAndLoan
db.User.hasMany(db.DebtAndLoan, { foreignKey: { name: 'userId', allowNull: false }, as: 'debtsAndLoans' });
db.DebtAndLoan.belongsTo(db.User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });

// User <-> ExchangeRate (NUEVA RELACIÓN)
db.User.hasMany(db.ExchangeRate, { foreignKey: { name: 'userId', allowNull: false }, as: 'exchangeRates' });
db.ExchangeRate.belongsTo(db.User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });

module.exports = db;
