// Ruta: finanzas-app-pro/backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const apiRoutes = require('./api'); //
const errorHandler = require('./middleware/errorHandler'); //
const db = require('./models'); //
const { seedDefaultCategories } = require('./api/categories/categories.controller'); //
const { processAllDueRecurringTransactions } = require('./services/recurringProcessor.service'); //
// Asegúrate que la ruta sea correcta para donde coloques investmentUpdate.service.js
const { updateActiveFixedTermValues } = require('./services/investmentUpdate.service'); 

const seedPermissionsAndRoles = async (database) => {
  // ... (lógica de seedPermissionsAndRoles sin cambios)
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
      { name: 'admin_manage_permissions_config', description: 'Gestionar la configuración de permisos y la asignación de permisos a roles' },
    ];

    const createdPermissionsMap = {};
    for (const perm of permissions) {
      const [p, created] = await database.Permission.findOrCreate({
        where: { name: perm.name },
        defaults: { name: perm.name, description: perm.description },
      });
      createdPermissionsMap[perm.name] = p.id;
      if (created) {
        // console.log(`Permiso creado: ${perm.name}`);
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
        'admin_view_all_users', 'admin_manage_user_roles', 'admin_delete_users', 'admin_manage_permissions_config'
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
              // console.log(`Permiso '${permName}' asignado al rol '${roleName}'.`);
            }
          } else {
            // console.warn(`Advertencia: El permiso llamado '${permName}' no fue encontrado al intentar asignarlo al rol '${roleName}'.`);
          }
        }
      }
    }
    console.log('Permisos de roles asignados/verificados exitosamente.');
  } catch (error) {
    console.error('Error crítico sembrando permisos y asignaciones de roles:', error);
  }
};


const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Para permitir conexiones desde cualquier IP

const defaultFrontendUrl = 'http://localhost:5173';
const frontendUrl = process.env.FRONTEND_URL || defaultFrontendUrl;
const allowedOrigins = [frontendUrl];
// Si tienes más orígenes permitidos en producción, añádelos a un array en .env
// y procésalos aquí. Ejemplo: process.env.ALLOWED_ORIGINS.split(',')
if (process.env.ADDITIONAL_ALLOWED_ORIGINS) {
    allowedOrigins.push(...process.env.ADDITIONAL_ALLOWED_ORIGINS.split(',').map(s => s.trim()));
}
const uniqueAllowedOrigins = [...new Set(allowedOrigins)];


app.use(cors({
  origin: function (origin, callback) {
    if (!origin || uniqueAllowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.warn(`CORS: Origen no permitido: ${origin}`);
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

    // force: false para no perder datos. En desarrollo, podrías usar { alter: true } con cuidado.
    await db.sequelize.sync({ force: false /* alter: true */ }); 
    console.log('Modelos sincronizados con la base de datos.');

    await seedDefaultCategories(); //
    await seedPermissionsAndRoles(db); 

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

  console.log('[Startup] Verificando movimientos recurrentes pendientes (catch-up)...');
  try {
    await processAllDueRecurringTransactions(true);
    console.log('[Startup] Procesamiento de recurrentes (catch-up) finalizado.');
  } catch (startupError) {
    console.error('[Startup] Error procesando recurrentes (catch-up):', startupError);
  }

  console.log('[Startup] Actualizando valores de Plazos Fijos (catch-up)...');
  try {
    await updateActiveFixedTermValues(true); // Llamada con catch-up
    console.log('[Startup] Actualización de Plazos Fijos (catch-up) finalizada.');
  } catch (startupErrorFT) {
    console.error('[Startup] Error actualizando Plazos Fijos (catch-up):', startupErrorFT);
  }

  app.listen(PORT, HOST, () => {
    console.log(`Servidor backend escuchando en http://${HOST}:${PORT}`);
    if(process.env.NODE_ENV === 'production'){
        console.log(`Permitiendo CORS para los orígenes: ${uniqueAllowedOrigins.join(', ')}`);
    } else {
        console.log(`Permitiendo CORS para los orígenes: ${uniqueAllowedOrigins.join(', ')}`);
    }

    // Cron para transacciones recurrentes
    const recurringTxCronSchedule = process.env.RECURRING_TX_CRON_SCHEDULE || '0 3 * * *'; // Default: 3 AM todos los días
    if (cron.validate(recurringTxCronSchedule)) {
      cron.schedule(recurringTxCronSchedule, () => {
        console.log(`[CronJob Recurrentes] Ejecutando tarea a las ${new Date().toLocaleString('es-AR')}...`);
        processAllDueRecurringTransactions(false).catch(err => { // false para ejecución normal
          console.error('[CronJob Recurrentes] Error:', err);
        });
      }, { scheduled: true, timezone: "America/Argentina/Buenos_Aires" });
      console.log(`[CronJob Recurrentes] Tarea programada con: "${recurringTxCronSchedule}" (Zona Horaria: America/Argentina/Buenos_Aires)`);
    } else {
      console.error(`[CronJob Recurrentes] Expresión cron inválida: "${recurringTxCronSchedule}".`);
    }

    // Cron Job para actualizar Plazos Fijos diariamente
    const fixedTermUpdateCronSchedule = process.env.FIXED_TERM_UPDATE_CRON_SCHEDULE || '0 2 * * *'; // Default: 2 AM todos los días
    if (cron.validate(fixedTermUpdateCronSchedule)) {
      cron.schedule(fixedTermUpdateCronSchedule, () => {
        console.log(`[CronJob Plazos Fijos] Ejecutando actualización de Plazos Fijos a las ${new Date().toLocaleString('es-AR')}...`);
        updateActiveFixedTermValues(false).catch(err => { // false para ejecución normal
          console.error('[CronJob Plazos Fijos] Error durante la actualización:', err);
        });
      }, { scheduled: true, timezone: "America/Argentina/Buenos_Aires" });
      console.log(`[CronJob Plazos Fijos] Tarea programada con: "${fixedTermUpdateCronSchedule}" (Zona Horaria: America/Argentina/Buenos_Aires)`);
    } else {
      console.error(`[CronJob Plazos Fijos] Expresión cron inválida: "${fixedTermUpdateCronSchedule}".`);
    }
  });
};

startServer();