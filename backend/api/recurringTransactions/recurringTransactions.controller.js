// Ruta: finanzas-app-pro/backend/api/recurringTransactions/recurringTransactions.controller.js
const db = require('../../models');
const RecurringTransaction = db.RecurringTransaction;
const { Op } = require('sequelize');
const { calculateNextRunDate } = require('../../utils/dateUtils');
const { processSingleRecurringTransaction } = require('../../services/recurringProcessor.service'); // *** IMPORTAR ***

// ... (getRecurringTransactions, getRecurringTransactionById, createRecurringTransaction, etc. existentes)

// @desc    Crear una nueva transacción recurrente
// @route   POST /api/recurring-transactions
// @access  Private
const createRecurringTransaction = async (req, res, next) => {
    const {
        description,
        amount,
        currency,
        type,
        frequency,
        dayOfMonth, // Para mensual y anual
        dayOfWeek,  // Para semanal
        monthOfYear, // Para anual
        startDate,
        endDate,
        notes,
        accountId,
        categoryId,
        icon
    } = req.body;
    const userId = req.user.id;

    if (!description || !amount || !type || !frequency || !startDate || !accountId || !categoryId) {
        return res.status(400).json({ message: 'Descripción, monto, tipo, frecuencia, fecha de inicio, cuenta y categoría son requeridos.' });
    }
    if (type !== 'ingreso' && type !== 'egreso') {
        return res.status(400).json({ message: 'El tipo debe ser "ingreso" o "egreso".' });
    }
    const validFrequencies = ['diaria', 'semanal', 'quincenal', 'mensual', 'anual'];
    if (!validFrequencies.includes(frequency)) {
        return res.status(400).json({ message: 'Frecuencia no válida.' });
    }
    if (frequency === 'semanal' && (dayOfWeek === undefined || dayOfWeek === null || dayOfWeek < 0 || dayOfWeek > 6)) {
        return res.status(400).json({ message: 'Día de la semana requerido y válido (0-6) para frecuencia semanal.' });
    }
    if ((frequency === 'mensual' || frequency === 'quincenal') && (dayOfMonth === undefined || dayOfMonth === null || dayOfMonth < 1 || dayOfMonth > 31)) {
        return res.status(400).json({ message: 'Día del mes requerido y válido (1-31) para frecuencia mensual o quincenal.' });
    }
    if (frequency === 'anual' && ((dayOfMonth === undefined || dayOfMonth === null || dayOfMonth < 1 || dayOfMonth > 31) || (monthOfYear === undefined || monthOfYear === null || monthOfYear < 1 || monthOfYear > 12))) {
        return res.status(400).json({ message: 'Día del mes y mes del año requeridos y válidos para frecuencia anual.' });
    }


    try {
        // Validar que la cuenta y categoría pertenezcan al usuario o sean globales
        const account = await db.Account.findOne({ where: { id: accountId, userId } });
        if (!account) {
            return res.status(404).json({ message: 'Cuenta no encontrada o no pertenece al usuario.' });
        }
        const category = await db.Category.findOne({
            where: { id: categoryId, type, [Op.or]: [{ userId: null }, { userId }] }
        });
        if (!category) {
            return res.status(404).json({ message: 'Categoría no encontrada, no válida para este tipo de movimiento, o no pertenece al usuario.' });
        }
        
        // Calcular la primera nextRunDate
        // El startDate es el día que el usuario quiere que comience a aplicar la recurrencia.
        // nextRunDate será igual a startDate o la primera fecha futura que cumpla la condición.
        const firstNextRunDate = calculateNextRunDate(frequency, new Date(startDate + 'T00:00:00Z'), dayOfMonth, dayOfWeek, monthOfYear, true);

        const newRecurringTransaction = await RecurringTransaction.create({
            description,
            amount: parseFloat(amount), // El monto se guarda con signo aquí
            currency: currency || account.currency,
            type,
            frequency,
            dayOfMonth: (frequency === 'mensual' || frequency === 'anual' || frequency === 'quincenal') ? parseInt(dayOfMonth) : null,
            dayOfWeek: frequency === 'semanal' ? parseInt(dayOfWeek) : null,
            monthOfYear: frequency === 'anual' ? parseInt(monthOfYear) : null,
            startDate,
            endDate: endDate || null,
            nextRunDate: firstNextRunDate,
            lastRunDate: null,
            isActive: true,
            notes,
            icon: icon || category.icon,
            userId,
            accountId,
            categoryId,
        });
        res.status(201).json(newRecurringTransaction);
    } catch (error) {
        console.error("Error creando transacción recurrente:", error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: "Error de validación", errors: error.errors.map(e => e.message) });
        }
        next(error);
    }
};

// @desc    Obtener todas las transacciones recurrentes del usuario
// @route   GET /api/recurring-transactions
// @access  Private
const getRecurringTransactions = async (req, res, next) => {
    const userId = req.user.id;
    const { isActive, type, accountId, categoryId, frequency, page = 1, limit = 100 } = req.query;

    const whereClause = { userId };
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    if (type) whereClause.type = type;
    if (accountId) whereClause.accountId = accountId;
    if (categoryId) whereClause.categoryId = categoryId;
    if (frequency) whereClause.frequency = frequency;
    
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    try {
        const { count, rows } = await RecurringTransaction.findAndCountAll({
            where: whereClause,
            include: [
                { model: db.Account, as: 'account', attributes: ['id', 'name', 'icon'] },
                { model: db.Category, as: 'category', attributes: ['id', 'name', 'icon'] }
            ],
            order: [['nextRunDate', 'ASC'], ['description', 'ASC']],
            limit: parseInt(limit, 10),
            offset: offset,
        });

        res.status(200).json({
            totalPages: Math.ceil(count / parseInt(limit, 10)),
            currentPage: parseInt(page, 10),
            totalItems: count,
            items: rows
        });
    } catch (error) {
        console.error("Error obteniendo transacciones recurrentes:", error);
        next(error);
    }
};

// @desc    Obtener una transacción recurrente por ID
// @route   GET /api/recurring-transactions/:id
// @access  Private
const getRecurringTransactionById = async (req, res, next) => {
    const userId = req.user.id;
    const { id } = req.params;
    try {
        const recurringTransaction = await RecurringTransaction.findOne({
            where: { id, userId },
            include: [
                { model: db.Account, as: 'account', attributes: ['id', 'name', 'currency', 'icon'] },
                { model: db.Category, as: 'category', attributes: ['id', 'name', 'icon'] }
            ]
        });
        if (!recurringTransaction) {
            return res.status(404).json({ message: 'Transacción recurrente no encontrada.' });
        }
        // Devolver el monto como absoluto para el formulario
        const responseTx = recurringTransaction.toJSON();
        responseTx.amount = Math.abs(parseFloat(responseTx.amount));

        res.status(200).json(responseTx);
    } catch (error) {
        console.error("Error obteniendo transacción recurrente por ID:", error);
        next(error);
    }
};

// @desc    Actualizar una transacción recurrente
// @route   PUT /api/recurring-transactions/:id
// @access  Private
const updateRecurringTransaction = async (req, res, next) => {
    const userId = req.user.id;
    const { id } = req.params;
    const {
        description, amount, currency, type, frequency,
        dayOfMonth, dayOfWeek, monthOfYear, startDate, endDate,
        nextRunDate, // Permitir actualizar nextRunDate manualmente
        lastRunDate, // Permitir actualizar lastRunDate manualmente (con precaución)
        isActive, notes, accountId, categoryId, icon
    } = req.body;

    try {
        const recurringTx = await RecurringTransaction.findOne({ where: { id, userId } });
        if (!recurringTx) {
            return res.status(404).json({ message: 'Transacción recurrente no encontrada.' });
        }

        // Validaciones si se cambian campos críticos
        if (accountId) {
            const account = await db.Account.findOne({ where: { id: accountId, userId } });
            if (!account) return res.status(404).json({ message: 'Cuenta no encontrada.' });
            recurringTx.currency = currency || account.currency; // Actualizar moneda si cambia la cuenta
        } else if (currency) {
             recurringTx.currency = currency;
        }

        if (categoryId) {
            const currentType = type || recurringTx.type;
            const category = await db.Category.findOne({
                where: { id: categoryId, type: currentType, [Op.or]: [{ userId: null }, { userId }] }
            });
            if (!category) return res.status(404).json({ message: 'Categoría no válida.' });
            recurringTx.icon = icon || category.icon; // Actualizar ícono si cambia la categoría
        } else if (icon) {
            recurringTx.icon = icon;
        }
        
        // Actualizar campos
        recurringTx.description = description !== undefined ? description : recurringTx.description;
        if (amount !== undefined) recurringTx.amount = parseFloat(amount);
        recurringTx.type = type !== undefined ? type : recurringTx.type;
        recurringTx.frequency = frequency !== undefined ? frequency : recurringTx.frequency;
        recurringTx.startDate = startDate !== undefined ? startDate : recurringTx.startDate;
        recurringTx.endDate = endDate !== undefined ? (endDate || null) : recurringTx.endDate;
        recurringTx.isActive = isActive !== undefined ? isActive : recurringTx.isActive;
        recurringTx.notes = notes !== undefined ? notes : recurringTx.notes;
        recurringTx.accountId = accountId !== undefined ? accountId : recurringTx.accountId;
        recurringTx.categoryId = categoryId !== undefined ? categoryId : recurringTx.categoryId;

        // Actualización de días específicos según frecuencia (si se proveen)
        if (recurringTx.frequency === 'semanal' && dayOfWeek !== undefined) {
            recurringTx.dayOfWeek = parseInt(dayOfWeek);
            recurringTx.dayOfMonth = null;
            recurringTx.monthOfYear = null;
        } else if ((recurringTx.frequency === 'mensual' || recurringTx.frequency === 'quincenal') && dayOfMonth !== undefined) {
            recurringTx.dayOfMonth = parseInt(dayOfMonth);
            recurringTx.dayOfWeek = null;
            recurringTx.monthOfYear = null;
        } else if (recurringTx.frequency === 'anual' && (dayOfMonth !== undefined || monthOfYear !== undefined)) {
            recurringTx.dayOfMonth = dayOfMonth !== undefined ? parseInt(dayOfMonth) : recurringTx.dayOfMonth;
            recurringTx.monthOfYear = monthOfYear !== undefined ? parseInt(monthOfYear) : recurringTx.monthOfYear;
            recurringTx.dayOfWeek = null;
        } else if (recurringTx.frequency === 'diaria') {
            recurringTx.dayOfMonth = null;
            recurringTx.dayOfWeek = null;
            recurringTx.monthOfYear = null;
        }

        // Recalcular nextRunDate solo si cambian los parámetros de frecuencia o startDate,
        // o si no se provee explícitamente nextRunDate
        if (nextRunDate === undefined && (frequency || startDate || dayOfMonth || dayOfWeek || monthOfYear)) {
            const baseDateForCalc = recurringTx.lastRunDate ? new Date(recurringTx.lastRunDate  + 'T00:00:00Z') : new Date(recurringTx.startDate  + 'T00:00:00Z');
            recurringTx.nextRunDate = calculateNextRunDate(
                recurringTx.frequency,
                baseDateForCalc,
                recurringTx.dayOfMonth,
                recurringTx.dayOfWeek,
                recurringTx.monthOfYear,
                !recurringTx.lastRunDate // isFirstCalculation = true si no hay lastRunDate
            );
        } else if (nextRunDate !== undefined) {
            recurringTx.nextRunDate = nextRunDate; // Permite anulación manual
        }

        if (lastRunDate !== undefined) {
            recurringTx.lastRunDate = lastRunDate; // Permite anulación manual
        }

        await recurringTx.save();
        res.status(200).json(recurringTx);
    } catch (error) {
        console.error("Error actualizando transacción recurrente:", error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: "Error de validación", errors: error.errors.map(e => e.message) });
        }
        next(error);
    }
};


// @desc    Eliminar una transacción recurrente
// @route   DELETE /api/recurring-transactions/:id
// @access  Private
const deleteRecurringTransaction = async (req, res, next) => {
    const userId = req.user.id;
    const { id } = req.params;
    try {
        const recurringTx = await RecurringTransaction.findOne({ where: { id, userId } });
        if (!recurringTx) {
            return res.status(404).json({ message: 'Transacción recurrente no encontrada.' });
        }
        await recurringTx.destroy();
        res.status(200).json({ message: 'Transacción recurrente eliminada exitosamente.' });
    } catch (error) {
        console.error("Error eliminando transacción recurrente:", error);
        next(error);
    }
};


// *** NUEVA FUNCIÓN DEL CONTROLADOR ***
// @desc    Procesar manualmente una transacción recurrente específica
// @route   POST /api/recurring-transactions/:id/process
// @access  Private
const processRecurringTransactionManually = async (req, res, next) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const recurringTx = await RecurringTransaction.findOne({
            where: { id, userId, isActive: true } // Solo procesar si está activa
        });

        if (!recurringTx) {
            return res.status(404).json({ message: 'Transacción recurrente no encontrada, no pertenece al usuario o no está activa.' });
        }

        // Usar la nextRunDate actual del movimiento como la fecha de procesamiento
        // O podrías pasar una fecha específica en el body si quieres más control
        // const processingDate = req.body.date ? new Date(req.body.date) : new Date(recurringTx.nextRunDate + 'T00:00:00Z');
        
        let processingDate;
        if (req.body.date) {
            processingDate = new Date(req.body.date + 'T00:00:00Z');
             // Validar que la fecha provista no sea muy lejana a la nextRunDate? Opcional.
        } else {
            // Si no se provee fecha, usar la nextRunDate actual.
            // Pero si la nextRunDate es futura, no debería procesarse hoy a menos que el usuario lo fuerce explícitamente.
            // Para "Registrar Ahora", queremos usar la fecha de HOY si nextRunDate es hoy o pasada.
            // Si nextRunDate es futura, usar nextRunDate para adelantar.
            const today = new Date();
            const nextRun = new Date(recurringTx.nextRunDate + 'T00:00:00Z');
            
            if (nextRun <= today) {
                processingDate = today; // Si está vencida o es hoy, procesar con fecha de hoy
                                        // O mejor usar nextRun para mantener la fecha original debida:
                // processingDate = nextRun;
            } else {
                // Si la nextRunDate es futura y no se especificó una fecha, usar esa fecha futura.
                // Esto permite "adelantar" un registro.
                // Si quisieras forzar a "hoy" siempre, cambia esto.
                processingDate = nextRun; 
            }
             // Por simplicidad para un botón "Registrar Ahora" que suele implicar "ahora mismo
             // usando la fecha que correspondía o la de hoy si ya pasó":
             // Si nextRunDate es futura, no es un "ahora" sino un "adelantar".
             // Si queremos que "Registrar Ahora" siempre use la fecha de *hoy* si nextRunDate ya pasó:
             const todayForComparison = new Date();
             todayForComparison.setHours(0,0,0,0); // Comienzo del día
             const nextRunDateForComparison = new Date(recurringTx.nextRunDate + 'T00:00:00Z');
             
             if (nextRunDateForComparison <= todayForComparison) {
                 processingDate = new Date(); // Usar fecha y hora actual para "Registrar Ahora"
             } else {
                 // Si nextRunDate es futura, y el usuario quiere "Registrar Ahora",
                 // esto es más bien "Adelantar Registro". Usaremos la nextRunDate.
                 processingDate = nextRunDateForComparison;
             }


        }


        console.log(`[ControllerManualProcess] Procesando manualmente Recurrente ID: ${recurringTx.id} con fecha: ${processingDate.toISOString().split('T')[0]}`);

        const result = await processSingleRecurringTransaction(recurringTx, processingDate);
        
        res.status(200).json({ 
            message: 'Movimiento recurrente procesado manualmente.', 
            createdTransaction: result.transaction,
            updatedRecurringTransaction: result.recurringTransaction // recurringTx ya está actualizado
        });

    } catch (error) {
        console.error(`Error procesando manualmente transacción recurrente ID ${id}:`, error);
        if (error.message.includes("Cuenta no encontrada") || error.message.includes("Categoría no válida")) {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};


module.exports = {
  createRecurringTransaction,
  getRecurringTransactions,
  getRecurringTransactionById,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  processRecurringTransactionManually // *** EXPORTAR NUEVA FUNCIÓN ***
};