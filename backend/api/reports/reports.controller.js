// Ruta: finanzas-app-pro/backend/api/reports/reports.controller.js
const db = require('../../models');
const Transaction = db.Transaction;
const Category = db.Category;
const ExchangeRate = db.ExchangeRate;
const { Op, Sequelize } = require('sequelize');

// ... (getRatesForTransactions existente) ...
const getRatesForTransactions = async (userId, transactions) => {
    if (!transactions || transactions.length === 0) return {};
    
    const dateRateMap = {}; 
    const uniqueMonthYears = new Set();
    transactions.forEach(tx => {
        if (tx.currency === 'USD') { 
            const date = new Date(tx.date);
            uniqueMonthYears.add(`${date.getFullYear()}-${date.getMonth() + 1}`);
        }
    });

    if (uniqueMonthYears.size === 0) return {};

    const ratePromises = Array.from(uniqueMonthYears).map(async (yearMonth) => {
        const [year, month] = yearMonth.split('-').map(Number);
        if (dateRateMap[yearMonth]) return; 

        const rateEntry = await ExchangeRate.findOne({
            where: { userId, year, month, fromCurrency: 'USD', toCurrency: 'ARS' }
        });
        if (rateEntry) {
            dateRateMap[yearMonth] = parseFloat(rateEntry.rate);
        } else {
            dateRateMap[yearMonth] = null; 
            console.warn(`[ReportsController] No exchange rate for USD to ARS for ${month}/${year} for user ${userId}`);
        }
    });
    await Promise.all(ratePromises);
    return dateRateMap;
};


const getExpensesByCategoryReport = async (req, res, next) => {
  const userId = req.user.id;
  const { dateFrom, dateTo, currency: targetCurrency = 'ARS' } = req.query; 

  try {
    const transactionWhereClause = {
      userId,
      type: 'egreso', // *** MANTENER 'egreso' AQUÍ, ya que las transferencias salientes son 'transferencia' ***
                      // Si quisieras un reporte de "salidas de dinero" que incluya transferencias,
                      // podrías hacer type: { [Op.in]: ['egreso', 'transferencia'] } y luego filtrar en el frontend
                      // o tener un reporte específico para flujos de transferencia.
                      // Para "Gastos", solo queremos 'egreso'.
    };
    if (dateFrom && dateTo) {
      transactionWhereClause.date = { [Op.between]: [dateFrom, dateTo] };
    }

    const transactions = await Transaction.findAll({
      where: transactionWhereClause,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'icon'] }],
      raw: true, 
      nest: true, 
    });

    // ... (resto de la lógica de conversión y agregación sin cambios, ya que solo toma 'egresos') ...
    // La lógica actual ya no debería incluir los pagos de tarjeta si se marcaron como 'transferencia'.
    
    if (transactions.length === 0) {
      return res.status(200).json({
        labels: [],
        datasets: [{ label: `Gastos (${targetCurrency})`, data: [], backgroundColor: [], borderColor: [], borderWidth: 1 }],
        summary: { totalExpenses: 0, numberOfCategories: 0, currencyReported: targetCurrency, conversionNotes: [] }
      });
    }
    
    let rates = {};
    let conversionNotes = [];
    if (targetCurrency === 'ARS' && transactions.some(tx => tx.currency === 'USD')) {
        rates = await getRatesForTransactions(userId, transactions);
    }

    const expensesMap = new Map();

    for (const tx of transactions) {
      let amountInTargetCurrency = parseFloat(tx.amount); 

      if (tx.currency !== targetCurrency) {
        if (tx.currency === 'USD' && targetCurrency === 'ARS') {
          const txDate = new Date(tx.date);
          const yearMonthKey = `${txDate.getFullYear()}-${txDate.getMonth() + 1}`;
          const rate = rates[yearMonthKey];
          if (rate) {
            amountInTargetCurrency = amountInTargetCurrency * rate;
          } else {
            const note = `Transacción ${tx.id} (${tx.description}) en USD no convertida por falta de tasa para ${txDate.getMonth() + 1}/${txDate.getFullYear()}.`;
            if (!conversionNotes.includes(note)) conversionNotes.push(note);
             console.warn(note);
             continue; 
          }
        } else if (targetCurrency !== tx.currency) {
          const note = `Conversión de ${tx.currency} a ${targetCurrency} no soportada para transacción ${tx.id}.`;
          if (!conversionNotes.includes(note)) conversionNotes.push(note);
          console.warn(note);
          continue; 
        }
      }

      const categoryKey = tx.category.id || 'sin_categoria';
      const currentCategoryData = expensesMap.get(categoryKey) || {
        totalAmount: 0,
        categoryName: tx.category.name || 'Sin Categoría',
        icon: tx.category.icon
      };
      
      currentCategoryData.totalAmount += Math.abs(amountInTargetCurrency); 
      expensesMap.set(categoryKey, currentCategoryData);
    }
    
    const sortedExpenses = Array.from(expensesMap.values()).sort((a,b) => b.totalAmount - a.totalAmount);

    const labels = sortedExpenses.map(item => item.categoryName);
    const data = sortedExpenses.map(item => item.totalAmount);
    
    const baseBackgroundColors = [
      'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
      'rgba(255, 99, 71, 0.7)', 'rgba(60, 179, 113, 0.7)', 'rgba(255, 215, 0, 0.7)', 'rgba(106, 90, 205, 0.7)'
    ];
    const backgroundColors = labels.map((_, i) => baseBackgroundColors[i % baseBackgroundColors.length]);
    const borderColors = backgroundColors.map(color => color.replace('0.7', '1'));

    res.status(200).json({
      labels: labels,
      datasets: [{
        label: `Gastos (${targetCurrency})`,
        data: data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
        hoverOffset: 4,
      }],
      summary: {
        totalExpenses: data.reduce((sum, val) => sum + val, 0),
        numberOfCategories: labels.length,
        currencyReported: targetCurrency,
        conversionNotes: conversionNotes
      }
    });

  } catch (error) {
    console.error('[ReportsController] Error en getExpensesByCategoryReport:', error);
    next(error);
  }
};

const getIncomeVsExpensesReport = async (req, res, next) => {
    const userId = req.user.id;
    const { dateFrom, dateTo, months: numberOfMonthsQuery, displayCurrency = 'ARS' } = req.query;

    let startDate, endDate;

    if (dateFrom && dateTo) {
        startDate = new Date(dateFrom + 'T00:00:00Z'); 
        endDate = new Date(dateTo + 'T23:59:59Z');   
    } else {
        const numberOfMonths = parseInt(numberOfMonthsQuery, 10) || 6;
        endDate = new Date(); 
        endDate.setUTCHours(23, 59, 59, 999);
        startDate = new Date(endDate);
        startDate.setUTCMonth(startDate.getUTCMonth() - (numberOfMonths - 1));
        startDate.setUTCDate(1);
        startDate.setUTCHours(0, 0, 0, 0);
    }
    
    try {
        const transactions = await Transaction.findAll({
            where: {
                userId,
                date: { [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]] },
                // *** AQUÍ FILTRAMOS PARA INCLUIR SOLO INGRESOS Y EGRESOS, NO TRANSFERENCIAS ***
                type: { [Op.in]: ['ingreso', 'egreso'] } 
            },
            order: [['date', 'ASC']],
            raw: true,
        });

        let rates = {};
        if (displayCurrency === 'ARS' && transactions.some(tx => tx.currency === 'USD')) {
             rates = await getRatesForTransactions(userId, transactions);
        }

        const monthlyReport = {};
        let conversionNotes = [];

        transactions.forEach(tx => {
            // ... (lógica de conversión de moneda existente) ...
            const txDate = new Date(tx.date);
            const year = txDate.getFullYear();
            const month = txDate.getMonth() + 1; 
            const monthKey = `${year}-${String(month).padStart(2, '0')}`;

            if (!monthlyReport[monthKey]) {
                monthlyReport[monthKey] = {
                    year,
                    month,
                    label: new Date(year, month - 1).toLocaleString('es-AR', { month: 'short', year: 'numeric' }),
                    income: 0,
                    expenses: 0,
                };
            }

            let amountInDisplayCurrency = parseFloat(tx.amount);

            if (tx.currency !== displayCurrency) {
                if (tx.currency === 'USD' && displayCurrency === 'ARS') {
                    const yearMonthKeyForRate = `${year}-${month}`;
                    const rate = rates[yearMonthKeyForRate];
                    if (rate) {
                        amountInDisplayCurrency = amountInDisplayCurrency * rate;
                    } else {
                        const note = `Transacción ${tx.id} (${tx.description}) en USD del ${month}/${year} no convertida a ARS por falta de tasa.`;
                        if (!conversionNotes.includes(note)) conversionNotes.push(note);
                        console.warn(note);
                        return; 
                    }
                } else {
                     const note = `Conversión de ${tx.currency} a ${displayCurrency} no soportada para transacción ${tx.id}.`;
                    if (!conversionNotes.includes(note)) conversionNotes.push(note);
                    console.warn(note);
                    return; 
                }
            }
            // *** ASEGURARSE QUE EL TIPO ES 'ingreso' O 'egreso' ANTES DE SUMAR ***
            if (tx.type === 'ingreso') {
                monthlyReport[monthKey].income += amountInDisplayCurrency;
            } else if (tx.type === 'egreso') {
                monthlyReport[monthKey].expenses += Math.abs(amountInDisplayCurrency);
            }
        });
        
        let currentIterDate = new Date(startDate);
        while(currentIterDate <= endDate) {
            const year = currentIterDate.getFullYear();
            const month = currentIterDate.getMonth() + 1;
            const monthKey = `${year}-${String(month).padStart(2, '0')}`;
            if (!monthlyReport[monthKey]) {
                 monthlyReport[monthKey] = {
                    year,
                    month,
                    label: new Date(year, month - 1).toLocaleString('es-AR', { month: 'short', year: 'numeric' }),
                    income: 0,
                    expenses: 0,
                };
            }
            currentIterDate.setMonth(currentIterDate.getMonth() + 1);
        }


        const sortedReportData = Object.values(monthlyReport).sort((a, b) => {
            if (a.year === b.year) return a.month - b.month;
            return a.year - b.year;
        });

        const labels = sortedReportData.map(item => item.label);
        const incomeData = sortedReportData.map(item => item.income);
        const expenseData = sortedReportData.map(item => item.expenses);
        
        const totalIncome = incomeData.reduce((sum, val) => sum + val, 0);
        const totalExpenses = expenseData.reduce((sum, val) => sum + val, 0);
        const netFlow = totalIncome - totalExpenses;

        res.status(200).json({
            labels,
            datasets: [
                { label: `Ingresos (${displayCurrency})`, data: incomeData, backgroundColor: 'rgba(75, 192, 192, 0.7)' },
                { label: `Egresos (${displayCurrency})`, data: expenseData, backgroundColor: 'rgba(255, 99, 132, 0.7)' },
            ],
            summary: { 
                totalIncome, 
                totalExpenses, 
                netFlow, 
                currencyReported: displayCurrency,
                period: `${startDate.toLocaleDateString('es-AR')} - ${endDate.toLocaleDateString('es-AR')}`,
                conversionNotes 
            }
        });

    } catch (error) {
        console.error('[ReportsController] Error en getIncomeVsExpensesReport:', error);
        next(error);
    }
};

module.exports = {
  getExpensesByCategoryReport,
  getIncomeVsExpensesReport,
};
