// Ruta: finanzas-app-pro/backend/server.js
// ACTUALIZADO ÚNICAMENTE para conectarse a la IP especificada.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const apiRoutes = require('./api');
// Se asume que errorHandler.js exporta la función middleware directamente
// module.exports = function errorHandler(err, req, res, next) { ... }
const errorHandler = require('./middleware/errorHandler');
const db = require('./models');
const { seedDefaultCategories } = require('./api/categories/categories.controller');
const { processAllDueRecurringTransactions } = require('./services/recurringProcessor.service');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = '192.168.0.7'; // IP específica para escuchar

// Configuración de CORS ajustada para incluir la IP específica
const defaultFrontendUrl = 'http://localhost:5173';
const frontendUrl = process.env.FRONTEND_URL || defaultFrontendUrl;

// Lista de orígenes permitidos
const allowedOrigins = [
  frontendUrl, // El que ya tenías (desde .env o localhost)
  `http://${HOST}:5173` // Acceso desde la IP específica (asumiendo puerto 5173 para frontend)
];
// Si frontendUrl es una URL diferente a localhost:5173 y también diferente a la IP específica, se añadirán ambas.
// Si frontendUrl es igual a localhost:5173, se añadirán localhost:5173 y la IP específica.
// Usamos un Set para evitar duplicados si process.env.FRONTEND_URL fuera igual a `http://${HOST}:5173`
const uniqueAllowedOrigins = [...new Set(allowedOrigins)];

app.use(cors({
  origin: uniqueAllowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const connectAndSyncDb = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Conexión a la base de datos MySQL establecida exitosamente.');

    await db.sequelize.sync({ force: false });
    console.log('Modelos sincronizados con la base de datos.');

    await seedDefaultCategories();

  } catch (error) {
    console.error('No se pudo conectar o sincronizar la base de datos:', error);
    process.exit(1);
  }
};

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('Servidor Backend de Finanzas App Pro funcionando correctamente!');
});

// Middleware de manejo de errores
app.use(errorHandler);

const startServer = async () => {
  await connectAndSyncDb();

  app.listen(PORT, HOST, () => { // Modificado para incluir HOST
    console.log(`Servidor backend escuchando en http://${HOST}:${PORT}`); // Mensaje actualizado
    console.log(`Permitiendo CORS para los orígenes: ${uniqueAllowedOrigins.join(', ')}`);


    const cronSchedule = process.env.RECURRING_TX_CRON_SCHEDULE || '0 3 * * *';

    if (cron.validate(cronSchedule)) {
      cron.schedule(cronSchedule, () => {
        console.log(`[CronJob] Ejecutando tarea programada de movimientos recurrentes a las ${new Date().toLocaleString('es-AR')}...`);
        processAllDueRecurringTransactions().catch(err => {
          console.error('[CronJob] Error durante la ejecución de processAllDueRecurringTransactions:', err);
        });
      }, {
        scheduled: true,
        // timezone: "America/Argentina/Buenos_Aires" // Descomentar si tu servidor no está en esta zona horaria
      });
      console.log(`[CronJob] Tarea de movimientos recurrentes programada con la expresión: "${cronSchedule}"`);
    } else {
      console.error(`[CronJob] Expresión cron inválida en RECURRING_TX_CRON_SCHEDULE: "${cronSchedule}". La tarea no se programará.`);
    }
  });
};

startServer();