// Ruta: finanzas-app-pro/backend/services/recurringProcessor.service.js
const db = require('../models');
const RecurringTransaction = db.RecurringTransaction;
const Transaction = db.Transaction;
const Account = db.Account;
const Category = db.Category;
const { Op } = require('sequelize');
const { calculateNextRunDate } = require('../utils/dateUtils');

const processSingleRecurringTransaction = async (recurringTx, processingDate) => {
  const t = await db.sequelize.transaction();
  try {
    const processingDateString = processingDate.toISOString().split('T')[0];
    console.log(`[Processor] Iniciando procesamiento para Recurrente ID: ${recurringTx.id} ("${recurringTx.description}") con fecha de transacción: ${processingDateString}`);

    const account = await Account.findOne({ 
        where: { id: recurringTx.accountId, userId: recurringTx.userId },
        transaction: t 
    });
    if (!account) {
        await t.rollback();
        const errorMsg = `Cuenta ID ${recurringTx.accountId} no encontrada o no pertenece al usuario ${recurringTx.userId} para Recurrente ID ${recurringTx.id}.`;
        console.error(`[Processor] Error: ${errorMsg}`);
        throw new Error(errorMsg);
    }

    const category = await Category.findOne({
        where: {
          id: recurringTx.categoryId,
          type: recurringTx.type,
          [Op.or]: [{ userId: null }, { userId: recurringTx.userId }]
        },
        transaction: t
      });
    if (!category) {
        await t.rollback();
        const errorMsg = `Categoría ID ${recurringTx.categoryId} no válida para Recurrente ID ${recurringTx.id} (tipo: ${recurringTx.type}).`;
        console.error(`[Processor] Error: ${errorMsg}`);
        throw new Error(errorMsg);
    }

    console.log(`[Processor] Recurrente ID: ${recurringTx.id} - Cuenta: ${account.name}, Categoría: ${category.name}`);
    
    const newTransaction = await Transaction.create({
      description: recurringTx.description,
      amount: recurringTx.amount,
      currency: recurringTx.currency || account.currency,
      date: processingDateString, // Fecha en la que se registra la transacción
      type: recurringTx.type,
      notes: recurringTx.notes,
      icon: recurringTx.icon || category.icon,
      userId: recurringTx.userId,
      accountId: recurringTx.accountId,
      categoryId: recurringTx.categoryId,
    }, { transaction: t });

    console.log(`[Processor] Recurrente ID: ${recurringTx.id} - Transacción creada ID: ${newTransaction.id}`);

    const transactionAmountForBalance = parseFloat(newTransaction.amount);
    const newBalance = parseFloat(account.balance) + transactionAmountForBalance;
    await account.update({ balance: newBalance }, { transaction: t });
    console.log(`[Processor] Recurrente ID: ${recurringTx.id} - Saldo de cuenta ${account.id} actualizado a: ${newBalance}`);

    // La nueva nextRunDate se calcula basada en la fecha en que la transacción DEBIÓ ocurrir (processingDateString)
    const baseDateForNextCalculation = new Date(processingDateString + 'T00:00:00Z');
    const newNextRunDate = calculateNextRunDate(
        recurringTx.frequency, 
        baseDateForNextCalculation, 
        recurringTx.dayOfMonth, 
        recurringTx.dayOfWeek,
        recurringTx.monthOfYear,
        false 
    );
    
    console.log(`[Processor] Recurrente ID: ${recurringTx.id} - Nueva nextRunDate calculada: ${newNextRunDate}`);

    const updatePayload = {
      lastRunDate: processingDateString, // Se procesó en esta fecha
      nextRunDate: newNextRunDate,
    };
    
    if (recurringTx.endDate && new Date(newNextRunDate) > new Date(recurringTx.endDate  + 'T00:00:00Z')) {
      updatePayload.isActive = false;
      console.log(`[Processor] Recurrente ID: ${recurringTx.id} - Desactivado por superar fecha de fin.`);
    }

    await recurringTx.update(updatePayload, { transaction: t });

    await t.commit();
    console.log(`[Processor] Movimiento recurrente ID: ${recurringTx.id} procesado exitosamente. Próxima ejecución: ${newNextRunDate}, Última ejecución: ${processingDateString}`);
    return { success: true, transaction: newTransaction, recurringTransaction: recurringTx.toJSON() };

  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error(`[Processor] FALLO procesando movimiento recurrente ID: ${recurringTx.id} - "${recurringTx.description}". Error: ${error.message}`, error.stack);
    throw error; 
  }
};

const processAllDueRecurringTransactions = async (isStartupCatchUp = false) => {
  console.log(`[SchedulerService] Verificando movimientos recurrentes (Catch-up: ${isStartupCatchUp})...`);
  const today = new Date(); // Hora actual del servidor
  const todayDateString = today.toISOString().split('T')[0]; // Solo la fecha YYYY-MM-DD

  // Para el "catch-up" al inicio, queremos procesar las tareas cuya nextRunDate es AYER o anterior.
  // Para la ejecución normal del cron, queremos procesar las tareas cuya nextRunDate es HOY o anterior.
  let dateCondition;
  if (isStartupCatchUp) {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayDateString = yesterday.toISOString().split('T')[0];
    dateCondition = { [Op.lte]: yesterdayDateString }; // Solo tareas de días anteriores
    console.log(`[SchedulerService] Catch-up: Buscando tareas con nextRunDate <= ${yesterdayDateString}`);
  } else {
    dateCondition = { [Op.lte]: todayDateString }; // Tareas de hoy o anteriores
    console.log(`[SchedulerService] Cron normal: Buscando tareas con nextRunDate <= ${todayDateString}`);
  }

  try {
    const dueRecurringTxs = await RecurringTransaction.findAll({
      where: {
        isActive: true,
        nextRunDate: dateCondition,
        // Opcional: startDate y endDate (como estaban antes)
      },
       include: [ 
         { model: db.User, as: 'user', attributes: ['id'] }
       ]
    });

    if (dueRecurringTxs.length === 0) {
      console.log(`[SchedulerService] No hay movimientos recurrentes ${isStartupCatchUp ? 'atrasados (catch-up)' : 'para procesar hoy'}.`);
      return;
    }

    console.log(`[SchedulerService] Se encontraron ${dueRecurringTxs.length} movimientos recurrentes para procesar (${isStartupCatchUp ? 'catch-up' : 'cron normal'}).`);

    for (const recurringTxInstance of dueRecurringTxs) {
      try {
        // Siempre usar la nextRunDate del movimiento como la fecha de la transacción,
        // ya que esa es la fecha en la que DEBIÓ ocurrir.
        const processingDateForTx = new Date(recurringTxInstance.nextRunDate + 'T00:00:00Z'); 
        
        console.log(`[SchedulerService] Intentando procesar Recurrente ID: ${recurringTxInstance.id} (nextRunDate: ${recurringTxInstance.nextRunDate}) con fecha de transacción: ${processingDateForTx.toISOString().split('T')[0]}`);
        
        await processSingleRecurringTransaction(recurringTxInstance, processingDateForTx);
      } catch (singleError) {
        console.error(`[SchedulerService] Falló el procesamiento individual del Recurrente ID: ${recurringTxInstance.id}. Mensaje: ${singleError.message}. Continuando con el siguiente.`);
      }
    }
    console.log(`[SchedulerService] Procesamiento de todos los movimientos recurrentes (${isStartupCatchUp ? 'catch-up' : 'cron normal'}) finalizado.`);
  } catch (error) {
      console.error(`[SchedulerService] Error general obteniendo/iterando movimientos recurrentes (${isStartupCatchUp ? 'catch-up' : 'cron normal'}):`, error.message, error.stack);
  }
};

module.exports = {
  processAllDueRecurringTransactions,
  processSingleRecurringTransaction 
};