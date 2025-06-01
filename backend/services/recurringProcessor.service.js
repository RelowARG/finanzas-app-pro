// Ruta: finanzas-app-pro/backend/services/recurringProcessor.service.js
const db = require('../models');
const RecurringTransaction = db.RecurringTransaction;
const Transaction = db.Transaction;
const Account = db.Account;
const Category = db.Category; // Asegúrate que esté bien si lo usas como db.Category
const { Op } = require('sequelize');
const { calculateNextRunDate } = require('../utils/dateUtils');

const processSingleRecurringTransaction = async (recurringTx, processingDate) => {
  const t = await db.sequelize.transaction();
  try {
    const processingDateString = processingDate.toISOString().split('T')[0];
    console.log(`[Processor] Iniciando procesamiento para Recurrente ID: ${recurringTx.id} ("${recurringTx.description}") con fecha: ${processingDateString}`);

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

    const category = await Category.findOne({ // Usar db.Category
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

    // El monto en RecurringTransaction ya debe tener el signo correcto (+ para ingreso, - para egreso)
    // Si no es así, y 'amount' es siempre positivo y 'type' define el signo, ajusta aquí.
    // Por ahora, asumimos que recurringTx.amount ya es correcto.
    // Si recurringTx.amount es siempre positivo y type lo define:
    // const signedAmount = recurringTx.type === 'egreso' ? -Math.abs(recurringTx.amount) : Math.abs(recurringTx.amount);
    
    const newTransaction = await Transaction.create({
      description: recurringTx.description,
      amount: recurringTx.amount, // Usar el monto directamente
      currency: recurringTx.currency || account.currency,
      date: processingDateString,
      type: recurringTx.type,
      notes: recurringTx.notes,
      icon: recurringTx.icon || category.icon,
      userId: recurringTx.userId,
      accountId: recurringTx.accountId,
      categoryId: recurringTx.categoryId,
    }, { transaction: t });

    console.log(`[Processor] Recurrente ID: ${recurringTx.id} - Transacción creada ID: ${newTransaction.id}`);

    const transactionAmountForBalance = parseFloat(newTransaction.amount); // amount ya tiene signo
    const newBalance = parseFloat(account.balance) + transactionAmountForBalance;
    await account.update({ balance: newBalance }, { transaction: t });
    console.log(`[Processor] Recurrente ID: ${recurringTx.id} - Saldo de cuenta ${account.id} actualizado a: ${newBalance}`);

    const baseDateForNextCalculation = new Date(processingDateString + 'T00:00:00Z');
    const newNextRunDate = calculateNextRunDate(
        recurringTx.frequency, 
        baseDateForNextCalculation, 
        recurringTx.dayOfMonth, 
        recurringTx.dayOfWeek,
        recurringTx.monthOfYear, // Añadir monthOfYear
        false // ya no es la primera vez, estamos calculando la *siguiente*
    );
    
    console.log(`[Processor] Recurrente ID: ${recurringTx.id} - Nueva nextRunDate calculada: ${newNextRunDate}`);

    const updatePayload = {
      lastRunDate: processingDateString,
      nextRunDate: newNextRunDate,
    };
    
    // Lógica para desactivar si se superó endDate
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

// ... (resto de processAllDueRecurringTransactions sin cambios en su llamada a processSingleRecurringTransaction, ya que la firma de processSingleRecurringTransaction no cambió para ella)
const processAllDueRecurringTransactions = async () => {
  console.log(`[SchedulerService] Verificando movimientos recurrentes para ejecutar...`);
  const today = new Date();
  const todayString = today.toISOString().split('T')[0]; 
  console.log(`[SchedulerService] Verificando para 'todayString' = ${todayString} (fecha del servidor)`);

  try {
    const dueRecurringTxs = await RecurringTransaction.findAll({
      where: {
        isActive: true,
        nextRunDate: {
          [Op.lte]: todayString 
        },
        // startDate: { [Op.lte]: todayString }, // Opcional: asegurar que ya haya empezado
        // [Op.or]: [ // Opcional: asegurar que no haya terminado
        //   { endDate: null },
        //   { endDate: { [Op.gte]: todayString } }
        // ]
      },
       include: [
         { model: db.User, as: 'user', attributes: ['id'] } // Necesario para acceder a userId para la cuenta/categoría
       ]
    });

    if (dueRecurringTxs.length === 0) {
      console.log(`[SchedulerService] No hay movimientos recurrentes para procesar hoy (${todayString}).`);
      return;
    }

    console.log(`[SchedulerService] Se encontraron ${dueRecurringTxs.length} movimientos recurrentes para procesar.`);

    for (const recurringTxInstance of dueRecurringTxs) {
      try {
        // Usar la nextRunDate del movimiento como la fecha de la transacción
        const processingDateForTx = new Date(recurringTxInstance.nextRunDate + 'T00:00:00Z'); 
        
        console.log(`[SchedulerService] Intentando procesar Recurrente ID: ${recurringTxInstance.id} con nextRunDate: ${recurringTxInstance.nextRunDate} usando fecha: ${processingDateForTx.toISOString().split('T')[0]}`);
        
        await processSingleRecurringTransaction(recurringTxInstance, processingDateForTx);
      } catch (singleError) {
        console.error(`[SchedulerService] Falló el procesamiento individual del Recurrente ID: ${recurringTxInstance.id}. Mensaje: ${singleError.message}. Continuando con el siguiente.`);
      }
    }
    console.log('[SchedulerService] Procesamiento de todos los movimientos recurrentes debidos finalizado.');
  } catch (error) {
      console.error('[SchedulerService] Error general obteniendo o iterando movimientos recurrentes:', error.message, error.stack);
  }
};


module.exports = {
  processAllDueRecurringTransactions,
  processSingleRecurringTransaction 
};