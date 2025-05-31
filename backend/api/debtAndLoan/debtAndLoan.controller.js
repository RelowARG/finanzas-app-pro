// Ruta: finanzas-app-pro/backend/api/debtAndLoan/debtAndLoan.controller.js
const db = require('../../models');
const DebtAndLoan = db.DebtAndLoan;
const { Op } = require('sequelize');

// @desc    Crear una nueva deuda o préstamo
// @route   POST /api/debts-loans
// @access  Private
const createDebtAndLoan = async (req, res, next) => {
  const {
    type, description, personInvolved, totalAmount, currency, initialDate, dueDate, 
    status, notes, 
    isMyCreditCardLoanToOther, installmentsTotalForOther, installmentsPaidByOther, 
    isRepaidInInstallments, repaymentInstallmentAmount, repaymentTotalInstallments, 
    repaymentInstallmentsPaid, repaymentFrequency, firstRepaymentDate,
    nextExpectedPaymentDate, nextExpectedPaymentAmount // nextExpectedPaymentAmount es el que ya teníamos
  } = req.body;
  const userId = req.user.id;

  if (!type || !description || !personInvolved || !totalAmount || !initialDate) {
    return res.status(400).json({ message: 'Tipo, descripción, persona, monto total y fecha inicial son requeridos.' });
  }
  if (type !== 'debt' && type !== 'loan') {
    return res.status(400).json({ message: 'El tipo debe ser "debt" o "loan".' });
  }

  try {
    const newEntry = await DebtAndLoan.create({
      userId,
      type,
      description,
      personInvolved,
      totalAmount: parseFloat(totalAmount),
      paidAmount: 0,
      currency: currency || 'ARS',
      initialDate,
      dueDate: dueDate || null,
      status: status || 'pending',
      notes,
      
      isMyCreditCardLoanToOther: type === 'loan' ? (isMyCreditCardLoanToOther || false) : false,
      installmentsTotalForOther: (type === 'loan' && isMyCreditCardLoanToOther) ? parseInt(installmentsTotalForOther, 10) : null,
      installmentsPaidByOther: (type === 'loan' && isMyCreditCardLoanToOther) ? (parseInt(installmentsPaidByOther, 10) || 0) : null,
      
      isRepaidInInstallments: type === 'loan' ? (isRepaidInInstallments || false) : false,
      repaymentInstallmentAmount: (type === 'loan' && isRepaidInInstallments) ? parseFloat(repaymentInstallmentAmount) : null,
      repaymentTotalInstallments: (type === 'loan' && isRepaidInInstallments) ? parseInt(repaymentTotalInstallments, 10) : null,
      repaymentInstallmentsPaid: (type === 'loan' && isRepaidInInstallments) ? (parseInt(repaymentInstallmentsPaid, 10) || 0) : null,
      repaymentFrequency: (type === 'loan' && isRepaidInInstallments) ? repaymentFrequency : null,
      firstRepaymentDate: (type === 'loan' && isRepaidInInstallments) ? (firstRepaymentDate || null) : null,
      
      nextExpectedPaymentDate: nextExpectedPaymentDate || null,
      nextExpectedPaymentAmount: nextExpectedPaymentAmount ? parseFloat(nextExpectedPaymentAmount) : null
    });
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error en createDebtAndLoan:', error);
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    next(error);
  }
};

// @desc    Obtener todas las deudas y préstamos del usuario
// @route   GET /api/debts-loans
// @access  Private
const getDebtsAndLoans = async (req, res, next) => {
  const userId = req.user.id;
  const { type, status, person } = req.query;
  
  const whereClause = { userId };
  if (type) whereClause.type = type;
  if (status) whereClause.status = status;
  if (person) whereClause.personInvolved = { [Op.like]: `%${person}%` };

  try {
    const entries = await DebtAndLoan.findAll({
      where: whereClause,
      order: [['initialDate', 'DESC'], ['personInvolved', 'ASC']]
    });
    res.status(200).json(entries);
  } catch (error) {
    console.error('Error en getDebtsAndLoans:', error);
    next(error);
  }
};

// @desc    Obtener una deuda o préstamo específico por ID
// @route   GET /api/debts-loans/:id
// @access  Private
const getDebtAndLoanById = async (req, res, next) => {
  const userId = req.user.id;
  const entryId = req.params.id;
  try {
    const entry = await DebtAndLoan.findOne({
      where: { id: entryId, userId: userId }
    });
    if (!entry) {
      return res.status(404).json({ message: 'Registro no encontrado o no pertenece al usuario.' });
    }
    res.status(200).json(entry);
  } catch (error) {
    console.error('Error en getDebtAndLoanById:', error);
    next(error);
  }
};

// @desc    Actualizar una deuda o préstamo
// @route   PUT /api/debts-loans/:id
// @access  Private
const updateDebtAndLoan = async (req, res, next) => {
  const userId = req.user.id;
  const entryId = req.params.id;
  const {
    description, personInvolved, totalAmount, currency, initialDate, dueDate, 
    status, notes, 
    isMyCreditCardLoanToOther, installmentsTotalForOther, installmentsPaidByOther,
    isRepaidInInstallments, repaymentInstallmentAmount, repaymentTotalInstallments, 
    repaymentInstallmentsPaid, repaymentFrequency, firstRepaymentDate,
    nextExpectedPaymentDate, nextExpectedPaymentAmount
  } = req.body;

  try {
    const entry = await DebtAndLoan.findOne({
      where: { id: entryId, userId: userId }
    });

    if (!entry) {
      return res.status(404).json({ message: 'Registro no encontrado o no pertenece al usuario.' });
    }

    entry.description = description !== undefined ? description : entry.description;
    entry.personInvolved = personInvolved !== undefined ? personInvolved : entry.personInvolved;
    entry.totalAmount = totalAmount !== undefined ? parseFloat(totalAmount) : entry.totalAmount;
    entry.currency = currency !== undefined ? currency : entry.currency;
    entry.initialDate = initialDate !== undefined ? initialDate : entry.initialDate;
    entry.dueDate = dueDate !== undefined ? (dueDate || null) : entry.dueDate;
    entry.status = status !== undefined ? status : entry.status; 
    entry.notes = notes !== undefined ? notes : entry.notes;
    
    if (entry.type === 'loan') {
        entry.isMyCreditCardLoanToOther = isMyCreditCardLoanToOther !== undefined ? isMyCreditCardLoanToOther : entry.isMyCreditCardLoanToOther;
        if (entry.isMyCreditCardLoanToOther) {
            entry.installmentsTotalForOther = installmentsTotalForOther !== undefined ? parseInt(installmentsTotalForOther, 10) : entry.installmentsTotalForOther;
            entry.installmentsPaidByOther = installmentsPaidByOther !== undefined ? parseInt(installmentsPaidByOther, 10) : entry.installmentsPaidByOther;
        } else {
            entry.installmentsTotalForOther = null;
            entry.installmentsPaidByOther = null;
        }

        entry.isRepaidInInstallments = isRepaidInInstallments !== undefined ? isRepaidInInstallments : entry.isRepaidInInstallments;
        if (entry.isRepaidInInstallments) {
            entry.repaymentInstallmentAmount = repaymentInstallmentAmount !== undefined ? parseFloat(repaymentInstallmentAmount) : entry.repaymentInstallmentAmount;
            entry.repaymentTotalInstallments = repaymentTotalInstallments !== undefined ? parseInt(repaymentTotalInstallments, 10) : entry.repaymentTotalInstallments;
            entry.repaymentInstallmentsPaid = repaymentInstallmentsPaid !== undefined ? parseInt(repaymentInstallmentsPaid, 10) : entry.repaymentInstallmentsPaid;
            entry.repaymentFrequency = repaymentFrequency !== undefined ? repaymentFrequency : entry.repaymentFrequency;
            entry.firstRepaymentDate = firstRepaymentDate !== undefined ? (firstRepaymentDate || null) : entry.firstRepaymentDate;
        } else {
            entry.repaymentInstallmentAmount = null;
            entry.repaymentTotalInstallments = null;
            entry.repaymentInstallmentsPaid = null;
            entry.repaymentFrequency = null;
            entry.firstRepaymentDate = null;
        }
    }
    
    entry.nextExpectedPaymentDate = nextExpectedPaymentDate !== undefined ? (nextExpectedPaymentDate || null) : entry.nextExpectedPaymentDate;
    entry.nextExpectedPaymentAmount = nextExpectedPaymentAmount !== undefined ? (nextExpectedPaymentAmount ? parseFloat(nextExpectedPaymentAmount) : null) : entry.nextExpectedPaymentAmount;

    await entry.save(); // Disparará el hook beforeSave
    res.status(200).json(entry);
  } catch (error) {
    console.error('Error en updateDebtAndLoan:', error);
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    next(error);
  }
};

// @desc    Eliminar una deuda o préstamo
// @route   DELETE /api/debts-loans/:id
// @access  Private
const deleteDebtAndLoan = async (req, res, next) => {
  const userId = req.user.id;
  const entryId = req.params.id;
  try {
    const entry = await DebtAndLoan.findOne({
      where: { id: entryId, userId: userId }
    });
    if (!entry) {
      return res.status(404).json({ message: 'Registro no encontrado o no pertenece al usuario.' });
    }
    await entry.destroy();
    res.status(200).json({ message: 'Registro eliminado exitosamente.' });
  } catch (error) {
    console.error('Error en deleteDebtAndLoan:', error);
    next(error);
  }
};

// @desc    Registrar un pago (parcial o total) para una deuda o préstamo
// @route   POST /api/debts-loans/:id/record-payment
// @access  Private
const recordPayment = async (req, res, next) => {
    const userId = req.user.id;
    const entryId = req.params.id;
    const { paymentAmount, paymentDate, paymentNotes, relatedTransactionId } = req.body;

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
        return res.status(400).json({ message: 'El monto del pago es requerido y debe ser mayor a cero.' });
    }
    if (!paymentDate) {
        return res.status(400).json({ message: 'La fecha del pago es requerida.' });
    }

    const t = await db.sequelize.transaction();
    try {
        const entry = await DebtAndLoan.findOne({
            where: { id: entryId, userId: userId },
            transaction: t
        });

        if (!entry) {
            await t.rollback();
            return res.status(404).json({ message: 'Registro de deuda/préstamo no encontrado.' });
        }

        const parsedPaymentAmount = parseFloat(paymentAmount);
        entry.paidAmount = parseFloat(entry.paidAmount) + parsedPaymentAmount;

        if (entry.type === 'loan') {
            if (entry.isMyCreditCardLoanToOther && entry.installmentsTotalForOther) {
                entry.installmentsPaidByOther = (entry.installmentsPaidByOther || 0) + 1;
                 // Aquí podrías recalcular nextExpectedPaymentDate si es relevante para este tipo
            }
            if (entry.isRepaidInInstallments && entry.repaymentTotalInstallments) {
                entry.repaymentInstallmentsPaid = (entry.repaymentInstallmentsPaid || 0) + 1;
                // Aquí podrías recalcular nextExpectedPaymentDate para la siguiente cuota de devolución
                if (entry.firstRepaymentDate && entry.repaymentFrequency === 'monthly') {
                    const currentPaidCount = entry.repaymentInstallmentsPaid;
                    if (currentPaidCount < entry.repaymentTotalInstallments) {
                        const newNextDate = new Date(entry.firstRepaymentDate + 'T00:00:00');
                        newNextDate.setMonth(newNextDate.getMonth() + currentPaidCount);
                        // Ajustar día si el mes es más corto
                        if (newNextDate.getDate() < new Date(entry.firstRepaymentDate + 'T00:00:00').getDate() && new Date(entry.firstRepaymentDate + 'T00:00:00').getDate() > 28) {
                            const tempCorrectMonth = new Date(newNextDate.getFullYear(), newNextDate.getMonth() + 1, 0);
                            newNextDate.setDate(tempCorrectMonth.getDate());
                        }
                        entry.nextExpectedPaymentDate = newNextDate.toISOString().split('T')[0];
                    } else {
                        entry.nextExpectedPaymentDate = null; // Todas las cuotas pagadas
                    }
                }
            }
        }
        
        await entry.save({ transaction: t }); // El hook beforeSave actualizará el status

        await t.commit();
        res.status(200).json(entry);

    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error('Error en recordPayment:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
        }
        next(error);
    }
};

module.exports = {
  createDebtAndLoan,
  getDebtsAndLoans,
  getDebtAndLoanById,
  updateDebtAndLoan,
  deleteDebtAndLoan,
  recordPayment
};
