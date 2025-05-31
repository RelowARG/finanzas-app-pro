// Ruta: finanzas-app-pro/backend/config/db.config.js
// ARCHIVO NUEVO
const { Sequelize } = require('sequelize');
require('dotenv').config(); // Para cargar variables de .env si este archivo se llama directamente en algún script

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
    port: process.env.DB_PORT || 3306, // Puerto por defecto de MySQL
    logging: process.env.NODE_ENV === 'development' ? console.log : false, // Loguea SQL en desarrollo
    pool: { // Configuración opcional del pool de conexiones
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Más adelante, aquí importaremos los modelos
// db.User = require('../models/user.model.js')(sequelize, Sequelize);
// db.Account = require('../models/account.model.js')(sequelize, Sequelize);
// ...y así sucesivamente para otros modelos

// Sincronización (Opcional, usar con cuidado en desarrollo, preferir migraciones para producción)
// El método sync() crea las tablas si no existen.
// { force: true } eliminaría las tablas existentes y las recrearía. ¡CUIDADO!
// db.sequelize.sync({ force: false }).then(() => {
//   console.log('Base de datos sincronizada (tablas creadas si no existían).');
// }).catch(err => {
//   console.error('Error al sincronizar la base de datos:', err);
// });


module.exports = db; // Exportamos el objeto db que contiene sequelize y Sequelize