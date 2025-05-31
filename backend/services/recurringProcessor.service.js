// Ruta: finanzas-app-pro/backend/services/recurringProcessor.service.js
// CORREGIDO: Asegurar que Category se usa correctamente y mejorar validaciones.
const db = require('../models'); // Asegúrate que la ruta a tus modelos sea correcta
const Transaction = db.Transaction;
const RecurringTransaction = db.RecurringTransaction;
const Account = db.Account;
// const Category = db.Category; // No es estrictamente necesario tenerla como const global si usamos db.Category abajo
const { Op } = require('sequelize');
const { calculateNextRunDate } = require('../utils/dateUtils');

async function processSingleRecurringTransaction(rTx, currentDateString) {
  const t = await db.sequelize.transaction();
  try {
    console.log(`[Processor] Procesando movimiento recurrente ID: ${rTx.id} - "${rTx.description}" para fecha: ${rTx.nextRunDate}`);
    
    const transactionAmount = rTx.type === 'egreso' ? -Math.abs(rTx.amount) : Math.abs(rTx.amount);
    
    // Verificar que las instancias 'account' y 'category' (pobladas por 'include') existen
    if (!rTx.account || !rTx.account.id) { // Chequear también el id por si el objeto está pero vacío
        throw new Error(`Cuenta asociada (ID: ${rTx.accountId}) no encontrada o no válida para Recurrente ID ${rTx.id}.`);
    }
    if (!rTx.category || !rTx.category.id) { // Chequear también el id
        throw new Error(`Categoría asociada (ID: ${rTx.categoryId}) no encontrada o no válida para Recurrente ID ${rTx.id}.`);
    }

    await Transaction.create({
      description: rTx.description,
      amount: transactionAmount,
      currency: rTx.currency || rTx.account.currency, // Usar moneda de la cuenta si no está en rTx
      date: rTx.nextRunDate,
      type: rTx.type,
      notes: rTx.notes || `Generado desde recurrente ID: ${rTx.id}`,
      icon: rTx.category.icon, // Acceder al icono desde la categoría incluida
      userId: rTx.userId,
      accountId: rTx.accountId,
      categoryId: rTx.categoryId,
    }, { transaction: t });

    // Volver a buscar la cuenta dentro de la transacción para asegurar consistencia y bloqueo
    const accountToUpdate = await Account.findByPk(rTx.accountId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!accountToUpdate) {
        // Esto sería un error grave si la cuenta existía al inicio de rTx.account
        throw new Error(`Cuenta ID ${rTx.accountId} no encontrada al intentar actualizar saldo para Recurrente ID ${rTx.id}.`);
    }
    
    const currentBalance = parseFloat(accountToUpdate.balance);
    if (isNaN(currentBalance)) {
        throw new Error(`Saldo inválido para la cuenta ID ${rTx.accountId}. Saldo: ${accountToUpdate.balance}`);
    }
    const newBalance = currentBalance + transactionAmount;
    await accountToUpdate.update({ balance: newBalance }, { transaction: t });

    const oldNextRunDate = new Date(rTx.nextRunDate);
    const newNextRunDateString = calculateNextRunDate(
        rTx.nextRunDate, // Usar la fecha actual de nextRunDate como base
        rTx.frequency,
        rTx.dayOfMonth,
        rTx.dayOfWeek
    );
    
    rTx.lastRunDate = rTx.nextRunDate; // Guardar la fecha que se acaba de procesar
    rTx.nextRunDate = newNextRunDateString; // Actualizar a la siguiente fecha de ejecución

    // Desactivar si la nueva fecha de ejecución supera la fecha de fin, o si no avanza
    if ( (rTx.endDate && new Date(newNextRunDateString) > new Date(rTx.endDate)) || 
         (new Date(newNextRunDateString) <= oldNextRunDate) ) {
      rTx.isActive = false;
      console.log(`[Processor] Movimiento recurrente ID: ${rTx.id} desactivado. Próxima ejecución calculada: ${newNextRunDateString}, Fecha fin: ${rTx.endDate}`);
    }
    
    await rTx.save({ transaction: t });

    await t.commit();
    console.log(`[Processor] Movimiento recurrente ID: ${rTx.id} ("${rTx.description}") procesado exitosamente. Próxima ejecución: ${rTx.nextRunDate}, Última ejecución: ${rTx.lastRunDate}`);

  } catch (error) {
    await t.rollback();
    console.error(`[Processor] Error procesando movimiento recurrente ID: ${rTx.id} ("${rTx.description}"):`, error.message, error.stack);
    // Opcional: Marcar rTx como fallido para evitar reintentos inmediatos o notificar
    // try {
    //   await RecurringTransaction.update(
    //     { isActive: false, notes: `${rTx.notes || ''}\nError en procesamiento ${new Date().toISOString()}: ${error.message}`.substring(0, 2048) },
    //     { where: { id: rTx.id } }
    //   );
    //   console.log(`[Processor] Movimiento recurrente ID: ${rTx.id} marcado como inactivo debido a error.`);
    // } catch (updateError) {
    //   console.error(`[Processor] Error actualizando estado de movimiento recurrente ID: ${rTx.id} tras fallo:`, updateError);
    // }
  }
}


async function processAllDueRecurringTransactions() {
  console.log(`[SchedulerService] Verificando movimientos recurrentes para ejecutar a las ${new Date().toLocaleString('es-AR')}`);
  const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

  try {
    const dueRecurringTxs = await RecurringTransaction.findAll({
      where: {
        isActive: true,
        nextRunDate: {
          [Op.lte]: today 
        }
      },
      include: [ 
        { model: db.Account, as: 'account', attributes: ['id', 'currency', 'balance'] },
        { model: db.Category, as: 'category', attributes: ['id', 'icon', 'name'] } // Usar db.Category aquí
      ],
      order: [['nextRunDate', 'ASC']] // Procesar los más antiguos primero
    });

    if (dueRecurringTxs.length === 0) {
      console.log('[SchedulerService] No hay movimientos recurrentes para procesar hoy.');
      return;
    }

    console.log(`[SchedulerService] Se encontraron ${dueRecurringTxs.length} movimientos recurrentes para procesar.`);
    for (const rTx of dueRecurringTxs) {
      // Se pasa la instancia completa de rTx que ya tiene 'account' y 'category'
      await processSingleRecurringTransaction(rTx, today);
    }
    console.log('[SchedulerService] Procesamiento de todos los movimientos recurrentes debidos finalizado.');

  } catch (error) {
      console.error('[SchedulerService] Error general obteniendo o iterando movimientos recurrentes:', error.message, error.stack);
  }
}

module.exports = { processAllDueRecurringTransactions };
