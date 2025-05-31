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
const HOST = '0.0.0.0'; // <--- CAMBIO IMPORTANTE AQUÍ

// Configuración de CORS ajustada para incluir la IP específica
const defaultFrontendUrl = 'http://localhost:5173';
const frontendUrl = process.env.FRONTEND_URL || defaultFrontendUrl;

// Lista de orígenes permitidos
const allowedOrigins = [
  frontendUrl, 
  // Si necesitas acceso desde otra IP específica durante el desarrollo con Vercel/Render, añádela aquí
  // o mejor, configura FRONTEND_URL en Render con la URL de Vercel.
];
// Usamos un Set para evitar duplicados
const uniqueAllowedOrigins = [...new Set(allowedOrigins)];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin 'origin' (como Postman o apps móviles) O si el origen está en la lista
    if (!origin || uniqueAllowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const connectAndSyncDb = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Conexión a la base de datos MySQL establecida exitosamente.');

    // En producción, generalmente se manejan las migraciones por separado.
    // Para Render, podrías tener un script de migración o dejar sync({ force: false })
    // si es la primera vez y quieres que Sequelize cree las tablas.
    // Considera usar migraciones para cambios futuros.
    await db.sequelize.sync({ force: false }); 
    console.log('Modelos sincronizados con la base de datos.');

    await seedDefaultCategories();

  } catch (error) {
    console.error('No se pudo conectar o sincronizar la base de datos:', error);
    process.exit(1); // Detener la app si la BD no funciona
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

  app.listen(PORT, HOST, () => {
    console.log(`Servidor backend escuchando en http://${HOST}:${PORT}`);
    if(process.env.NODE_ENV === 'production'){
        console.log(`Permitiendo CORS para el origen: ${process.env.FRONTEND_URL}`);
    } else {
        console.log(`Permitiendo CORS para los orígenes: ${uniqueAllowedOrigins.join(', ')}`);
    }


    const cronSchedule = process.env.RECURRING_TX_CRON_SCHEDULE || '0 3 * * *';

    if (cron.validate(cronSchedule)) {
      cron.schedule(cronSchedule, () => {
        console.log(`[CronJob] Ejecutando tarea programada de movimientos recurrentes a las ${new Date().toLocaleString('es-AR')}...`);
        processAllDueRecurringTransactions().catch(err => {
          console.error('[CronJob] Error durante la ejecución de processAllDueRecurringTransactions:', err);
        });
      }, {
        scheduled: true,
        // timezone: "America/Argentina/Buenos_Aires" // Descomentar si tu servidor Render no está en esta zona horaria por defecto
      });
      console.log(`[CronJob] Tarea de movimientos recurrentes programada con la expresión: "${cronSchedule}"`);
    } else {
      console.error(`[CronJob] Expresión cron inválida en RECURRING_TX_CRON_SCHEDULE: "${cronSchedule}". La tarea no se programará.`);
    }
  });
};

startServer();