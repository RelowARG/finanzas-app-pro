// Ruta: finanzas-app-pro/backend/api/recurringTransactions/recurringTransactions.controller.js
const db = require('../../models');
const RecurringTransaction = db.RecurringTransaction;
const Account = db.Account; // Asegúrate de tener esta importación si no estaba
const Category = db.Category; // Asegúrate de tener esta importación si no estaba
const { Op } = require('sequelize');
const { calculateNextRunDate } = require('../../utils/dateUtils');
const { processSingleRecurringTransaction } = require('../../services/recurringProcessor.service');

// ... (createRecurringTransaction, getRecurringTransactions, etc. - sin cambios)
const createRecurringTransaction = async (req, res, next) => {
    const {
        description,
        amount,
        currency,
        type,
        frequency,
        dayOfMonth, 
        dayOfWeek,  
        monthOfYear, 
        startDate,
        endDate,
        notes,
        accountId,
        categoryId,
        icon, // Recibir el ícono del frontend
        isActive // Recibir estado inicial
    } = req.body;
    const userId = req.user.id;

    if (!description || !amount || !type || !frequency || !startDate || !accountId || !categoryId) {
        return res.status(400).json({ message: 'Descripción, monto, tipo, frecuencia, fecha de inicio, cuenta y categoría son requeridos.' });
    }
    if (type !== 'ingreso' && type !== 'egreso') {
        return res.status(400).json({ message: 'El tipo debe ser "ingreso" o "egreso".' });
    }
    const validFrequencies = ['diaria', 'semanal', 'quincenal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual'];
    if (!validFrequencies.includes(frequency)) {
        return res.status(400).json({ message: 'Frecuencia no válida.' });
    }
    if (frequency === 'semanal' && (dayOfWeek === undefined || dayOfWeek === null || dayOfWeek < 0 || dayOfWeek > 6)) {
        return res.status(400).json({ message: 'Día de la semana requerido y válido (0-6) para frecuencia semanal.' });
    }
    if ((frequency === 'mensual' || frequency === 'quincenal' || frequency === 'bimestral' || frequency === 'trimestral' || frequency === 'semestral') && 
        (dayOfMonth === undefined || dayOfMonth === null || parseInt(dayOfMonth) < 1 || parseInt(dayOfMonth) > 31)) {
        return res.status(400).json({ message: 'Día del mes requerido y válido (1-31) para esta frecuencia.' });
    }
    if (frequency === 'anual' && 
        ((dayOfMonth === undefined || dayOfMonth === null || parseInt(dayOfMonth) < 1 || parseInt(dayOfMonth) > 31) || 
         (monthOfYear === undefined || monthOfYear === null || parseInt(monthOfYear) < 1 || parseInt(monthOfYear) > 12))) {
        return res.status(400).json({ message: 'Día del mes y mes del año requeridos y válidos para frecuencia anual.' });
    }

    try {
        const account = await Account.findOne({ where: { id: accountId, userId } });
        if (!account) {
            return res.status(404).json({ message: 'Cuenta no encontrada o no pertenece al usuario.' });
        }
        const category = await Category.findOne({
            where: { id: categoryId, type, [Op.or]: [{ userId: null }, { userId }] }
        });
        if (!category) {
            return res.status(404).json({ message: 'Categoría no encontrada, no válida para este tipo de movimiento, o no pertenece al usuario.' });
        }
        
        const firstNextRunDate = calculateNextRunDate(
            frequency, 
            new Date(startDate + 'T00:00:00Z'), // Fecha de inicio de la recurrencia
            dayOfMonth ? parseInt(dayOfMonth) : null, 
            dayOfWeek ? parseInt(dayOfWeek) : null, 
            monthOfYear ? parseInt(monthOfYear) : null,
            true // Es el primer cálculo
        );

        const finalAmount = type === 'egreso' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));

        const newRecurringTransaction = await RecurringTransaction.create({
            description,
            amount: finalAmount,
            currency: currency || account.currency,
            type,
            frequency,
            dayOfMonth: (frequency !== 'diaria' && frequency !== 'semanal') ? parseInt(dayOfMonth) : null,
            dayOfWeek: frequency === 'semanal' ? parseInt(dayOfWeek) : null,
            monthOfYear: frequency === 'anual' ? parseInt(monthOfYear) : null,
            startDate,
            endDate: endDate || null,
            nextRunDate: firstNextRunDate,
            lastRunDate: null,
            isActive: isActive !== undefined ? isActive : true,
            notes,
            icon: icon || category.icon, // Usar el ícono provisto o el de la categoría
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
                { model: db.Account, as: 'account', attributes: ['id', 'name', 'icon', 'currency'] }, // Añadir currency
                { model: db.Category, as: 'category', attributes: ['id', 'name', 'icon'] }
            ],
            order: [['nextRunDate', 'ASC'], ['description', 'ASC']],
            limit: parseInt(limit, 10),
            offset: offset,
        });
        // Asegurar que el monto se devuelva como absoluto para el frontend
        const itemsWithAbsoluteAmount = rows.map(item => {
            const plainItem = item.toJSON();
            plainItem.amount = Math.abs(parseFloat(plainItem.amount));
            return plainItem;
        });

        res.status(200).json({
            totalPages: Math.ceil(count / parseInt(limit, 10)),
            currentPage: parseInt(page, 10),
            totalItems: count,
            items: itemsWithAbsoluteAmount
        });
    } catch (error) {
        console.error("Error obteniendo transacciones recurrentes:", error);
        next(error);
    }
};

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
        const responseTx = recurringTransaction.toJSON();
        responseTx.amount = Math.abs(parseFloat(responseTx.amount));

        res.status(200).json(responseTx);
    } catch (error) {
        console.error("Error obteniendo transacción recurrente por ID:", error);
        next(error);
    }
};

const updateRecurringTransaction = async (req, res, next) => {
    const userId = req.user.id;
    const { id } = req.params;
    const {
        description, amount, currency, type, frequency,
        dayOfMonth, dayOfWeek, monthOfYear, startDate, endDate,
        // nextRunDate, // No permitir actualizar nextRunDate directamente, se recalcula
        // lastRunDate, // No permitir actualizar lastRunDate directamente
        isActive, notes, accountId, categoryId, icon
    } = req.body;

    try {
        const recurringTx = await RecurringTransaction.findOne({ where: { id, userId } });
        if (!recurringTx) {
            return res.status(404).json({ message: 'Transacción recurrente no encontrada.' });
        }

        let account = recurringTx.account;
        if (accountId && accountId !== recurringTx.accountId) {
            account = await db.Account.findOne({ where: { id: accountId, userId } });
            if (!account) return res.status(404).json({ message: 'Cuenta no encontrada.' });
        } else if (!accountId && !recurringTx.accountId) { // Caso raro pero posible
             return res.status(400).json({ message: 'Se requiere una cuenta.' });
        }

        let category = recurringTx.category;
        if (categoryId && categoryId !== recurringTx.categoryId) {
            const typeToSearch = type || recurringTx.type;
            category = await db.Category.findOne({
                where: { id: categoryId, type: typeToSearch, [Op.or]: [{ userId: null }, { userId }] }
            });
            if (!category) return res.status(404).json({ message: 'Categoría no válida.' });
        } else if (!categoryId && !recurringTx.categoryId) {
            return res.status(400).json({ message: 'Se requiere una categoría.' });
        }
        
        recurringTx.description = description !== undefined ? description : recurringTx.description;
        if (amount !== undefined) {
            const newType = type !== undefined ? type : recurringTx.type;
            recurringTx.amount = newType === 'egreso' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));
        }
        recurringTx.currency = currency || account.currency; // Usa la moneda de la cuenta si no se especifica
        recurringTx.type = type !== undefined ? type : recurringTx.type;
        recurringTx.frequency = frequency !== undefined ? frequency : recurringTx.frequency;
        recurringTx.startDate = startDate !== undefined ? startDate : recurringTx.startDate;
        recurringTx.endDate = endDate !== undefined ? (endDate || null) : recurringTx.endDate;
        recurringTx.isActive = isActive !== undefined ? isActive : recurringTx.isActive;
        recurringTx.notes = notes !== undefined ? notes : recurringTx.notes;
        recurringTx.accountId = accountId !== undefined ? accountId : recurringTx.accountId;
        recurringTx.categoryId = categoryId !== undefined ? categoryId : recurringTx.categoryId;
        recurringTx.icon = icon || category?.icon || (recurringTx.type === 'ingreso' ? '💰' : '💸');


        if (frequency || startDate || dayOfMonth || dayOfWeek || monthOfYear) {
            const baseDateForCalc = recurringTx.lastRunDate 
                                  ? new Date(recurringTx.lastRunDate  + 'T00:00:00Z') 
                                  : new Date(recurringTx.startDate  + 'T00:00:00Z');
            
            const dom = dayOfMonth !== undefined ? (dayOfMonth ? parseInt(dayOfMonth) : null) : recurringTx.dayOfMonth;
            const dow = dayOfWeek !== undefined ? (dayOfWeek ? parseInt(dayOfWeek) : null) : recurringTx.dayOfWeek;
            const moy = monthOfYear !== undefined ? (monthOfYear ? parseInt(monthOfYear) : null) : recurringTx.monthOfYear;

            recurringTx.dayOfMonth = (recurringTx.frequency !== 'diaria' && recurringTx.frequency !== 'semanal') ? dom : null;
            recurringTx.dayOfWeek = recurringTx.frequency === 'semanal' ? dow : null;
            recurringTx.monthOfYear = recurringTx.frequency === 'anual' ? moy : null;


            recurringTx.nextRunDate = calculateNextRunDate(
                recurringTx.frequency,
                baseDateForCalc,
                recurringTx.dayOfMonth,
                recurringTx.dayOfWeek,
                recurringTx.monthOfYear,
                !recurringTx.lastRunDate 
            );
        }

        await recurringTx.save();
        const updatedTx = await RecurringTransaction.findByPk(id, { // Re-fetch para obtener con includes
             include: [
                { model: db.Account, as: 'account', attributes: ['id', 'name', 'currency', 'icon'] },
                { model: db.Category, as: 'category', attributes: ['id', 'name', 'icon'] }
            ]
        });
        const responseTx = updatedTx.toJSON();
        responseTx.amount = Math.abs(parseFloat(responseTx.amount));
        res.status(200).json(responseTx);

    } catch (error) {
        console.error("Error actualizando transacción recurrente:", error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: "Error de validación", errors: error.errors.map(e => e.message) });
        }
        next(error);
    }
};

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

const processRecurringTransactionManually = async (req, res, next) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const recurringTx = await RecurringTransaction.findOne({
            where: { id, userId } // No es necesario chequear isActive aquí, se puede procesar una inactiva si el usuario lo fuerza
        });

        if (!recurringTx) {
            return res.status(404).json({ message: 'Transacción recurrente no encontrada o no pertenece al usuario.' });
        }

        // Determinar la fecha de procesamiento para la transacción
        // Si nextRunDate es hoy o pasada, usar la nextRunDate original para la transacción.
        // Si nextRunDate es futura, usar esa nextRunDate futura (adelantando el registro).
        // Esto asegura que la transacción se registre con la fecha que correspondía o la fecha adelantada.
        const processingDate = new Date(recurringTx.nextRunDate + 'T00:00:00Z'); // Usar siempre la nextRunDate del recurrente

        console.log(`[ControllerManualProcess] Solicitud para procesar manualmente Recurrente ID: ${recurringTx.id} con fecha de transacción: ${processingDate.toISOString().split('T')[0]}`);

        if (!recurringTx.isActive) {
            console.warn(`[ControllerManualProcess] Advirtiendo: Recurrente ID: ${recurringTx.id} está INACTIVO pero se procesará manualmente.`);
            // No es un error, pero es bueno loguearlo. La interfaz podría advertir al usuario.
        }

        const result = await processSingleRecurringTransaction(recurringTx, processingDate);
        
        // Re-fetch para devolver el objeto con las asociaciones actualizadas y monto absoluto
        const updatedFullRecurringTx = await RecurringTransaction.findByPk(recurringTx.id, {
             include: [
                { model: db.Account, as: 'account', attributes: ['id', 'name', 'currency', 'icon'] },
                { model: db.Category, as: 'category', attributes: ['id', 'name', 'icon'] }
            ]
        });
        const responseRecurringTx = updatedFullRecurringTx.toJSON();
        responseRecurringTx.amount = Math.abs(parseFloat(responseRecurringTx.amount));


        res.status(200).json({ 
            message: 'Movimiento recurrente procesado manualmente.', 
            createdTransaction: result.transaction, // La transacción creada
            updatedRecurringTransaction: responseRecurringTx // El recurrente actualizado
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
  processRecurringTransactionManually
};