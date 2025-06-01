// Ruta: finanzas-app-pro/backend/server.js
// (Solo se muestra la parte relevante para la modificación)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const apiRoutes = require('./api'); //
const errorHandler = require('./middleware/errorHandler'); //
const db = require('./models'); //
const { seedDefaultCategories } = require('./api/categories/categories.controller'); //
const { processAllDueRecurringTransactions } = require('./services/recurringProcessor.service'); //

// *** INICIO: Definición de la función de sembrado de permisos ***
// (Puedes colocar la función seedPermissionsAndRoles que te proporcioné anteriormente aquí,
// o importarla si la pones en un archivo separado)
const seedPermissionsAndRoles = async (database) => { // database es db
  try {
    const permissions = [
      { name: 'view_dashboard', description: 'Ver el dashboard principal' },
      { name: 'manage_accounts', description: 'Crear, ver, editar, eliminar cuentas propias' },
      { name: 'manage_transactions', description: 'Crear, ver, editar, eliminar transacciones propias' },
      { name: 'manage_budgets', description: 'Gestionar presupuestos propios' },
      { name: 'view_reports', description: 'Ver informes financieros propios' },
      { name: 'manage_investments', description: 'Gestionar inversiones propias' },
      { name: 'manage_categories', description: 'Gestionar categorías personalizadas' },
      { name: 'manage_recurring_transactions', description: 'Gestionar transacciones recurrentes propias' },
      { name: 'manage_debts_loans', description: 'Gestionar deudas y préstamos propios' },
      { name: 'manage_exchange_rates', description: 'Gestionar tasas de cambio propias' },
      { name: 'admin_view_all_users', description: 'Ver lista de todos los usuarios' },
      { name: 'admin_manage_user_roles', description: 'Cambiar roles de usuarios' },
      { name: 'admin_delete_users', description: 'Eliminar usuarios del sistema' },
    ];

    const createdPermissionsMap = {};
    for (const perm of permissions) {
      const [p, created] = await database.Permission.findOrCreate({
        where: { name: perm.name },
        defaults: { name: perm.name, description: perm.description },
      });
      createdPermissionsMap[perm.name] = p.id;
      if (created) {
        console.log(`Permiso creado: ${perm.name}`);
      }
    }

    const rolePermissionsData = {
      user: [
        'view_dashboard', 'manage_accounts', 'manage_transactions', 'manage_budgets',
        'view_reports', 'manage_investments', 'manage_categories', 
        'manage_recurring_transactions', 'manage_debts_loans', 'manage_exchange_rates'
      ],
      admin: [
        'view_dashboard', 'manage_accounts', 'manage_transactions', 'manage_budgets',
        'view_reports', 'manage_investments', 'manage_categories', 
        'manage_recurring_transactions', 'manage_debts_loans', 'manage_exchange_rates',
        'admin_view_all_users', 'admin_manage_user_roles', 'admin_delete_users'
      ],
    };

    for (const roleName in rolePermissionsData) {
      if (rolePermissionsData.hasOwnProperty(roleName)) {
        for (const permName of rolePermissionsData[roleName]) {
          const permissionId = createdPermissionsMap[permName];
          if (permissionId) {
            const [rp, createdRp] = await database.RolePermission.findOrCreate({
              where: { roleName: roleName, permissionId: permissionId },
              defaults: { roleName: roleName, permissionId: permissionId },
            });
            if (createdRp) {
              console.log(`Permiso '${permName}' asignado al rol '${roleName}'.`);
            }
          } else {
            console.warn(`Advertencia: El permiso llamado '${permName}' no fue encontrado al intentar asignarlo al rol '${roleName}'.`);
          }
        }
      }
    }
    console.log('Permisos de roles asignados/verificados exitosamente.');
  } catch (error) {
    console.error('Error crítico sembrando permisos y asignaciones de roles:', error);
  }
};
// *** FIN: Definición de la función de sembrado de permisos ***


const app = express();
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

// ... (resto de la configuración de CORS, express.json, etc.) ...
const defaultFrontendUrl = 'http://localhost:5173';
const frontendUrl = process.env.FRONTEND_URL || defaultFrontendUrl;
const allowedOrigins = [frontendUrl];
const uniqueAllowedOrigins = [...new Set(allowedOrigins)];

app.use(cors({
  origin: function (origin, callback) {
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

    await db.sequelize.sync({ force: false }); 
    console.log('Modelos sincronizados con la base de datos.');

    await seedDefaultCategories(); //
    await seedPermissionsAndRoles(db); // *** NUEVO: Llamada a la función de sembrado de permisos ***

  } catch (error) {
    console.error('No se pudo conectar o sincronizar la base de datos:', error);
    process.exit(1); 
  }
};

app.use('/api', apiRoutes); //

app.get('/', (req, res) => {
  res.send('Servidor Backend de Finanzas App Pro funcionando correctamente!');
});

app.use(errorHandler); //

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
        processAllDueRecurringTransactions().catch(err => { //
          console.error('[CronJob] Error durante la ejecución de processAllDueRecurringTransactions:', err);
        });
      }, {
        scheduled: true,
      });
      console.log(`[CronJob] Tarea de movimientos recurrentes programada con la expresión: "${cronSchedule}"`);
    } else {
      console.error(`[CronJob] Expresión cron inválida en RECURRING_TX_CRON_SCHEDULE: "${cronSchedule}". La tarea no se programará.`);
    }
  });
};

startServer();