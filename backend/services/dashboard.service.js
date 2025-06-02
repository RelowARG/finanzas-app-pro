// Ruta: finanzas-app-pro/backend/services/dashboard.service.js
const db = require('../models');
const { Op, Sequelize, literal } = require('sequelize');

// --- HELPER FUNCTIONS ---

const getMonthDateRange = (date = new Date(), monthsOffset = 0) => {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + monthsOffset); // Aplicar offset para meses anteriores/posteriores

  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

  const formatDateString = (dt) => {
    const pad = (num) => (num < 10 ? '0' : '') + num;
    return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
  };

  return {
    dateFrom: formatDateString(firstDay),
    dateTo: formatDateString(lastDay),
    monthName: firstDay.toLocaleString('es-AR', { month: 'long', timeZone: 'UTC' }),
    year: year,
    monthNumber: month + 1
  };
};

// Refinado para ser más genérico: items es un array de { date, currency }
const getRatesForItems = async (userId, items, targetCurrency = 'ARS') => {
  if (!items || items.length === 0) return { rates: {}, notes: [] };
  
  const rateMap = {}; // 'YYYY-M-CUR': rate
  const uniqueRateLookups = new Set();
  let notes = [];

  items.forEach(item => {
    if (item.currency && item.currency !== targetCurrency) {
      try {
        const itemDate = new Date(item.date + 'T00:00:00Z'); // Asegurar UTC para parseo de fecha
        const year = itemDate.getUTCFullYear();
        const month = itemDate.getUTCMonth() + 1;
        uniqueRateLookups.add(`${year}-${month}-${item.currency}`);
      } catch (e) {
        console.warn(`[getRatesForItems] Invalid date for item: ${item.date}`);
      }
    }
  });

  if (uniqueRateLookups.size === 0) return { rates: {}, notes: [] };

  const ratePromises = Array.from(uniqueRateLookups).map(async (lookupKey) => {
    const [year, month, fromCurrency] = lookupKey.split('-');
    const numYear = parseInt(year);
    const numMonth = parseInt(month);

    if (rateMap[lookupKey]) return; // Ya procesado o en proceso

    const rateEntry = await db.ExchangeRate.findOne({
      where: { userId, year: numYear, month: numMonth, fromCurrency, toCurrency: targetCurrency }
    });

    if (rateEntry) {
      rateMap[lookupKey] = parseFloat(rateEntry.rate);
    } else {
      rateMap[lookupKey] = null; // Marcar como no encontrada
      const noteMsg = `No se encontró tasa de cambio para ${fromCurrency} a ${targetCurrency} en ${numMonth}/${numYear}.`;
      if (!notes.includes(noteMsg)) notes.push(noteMsg);
    }
  });
  await Promise.all(ratePromises);
  return { rates: rateMap, notes };
};

// Refinado para usar el mapa de tasas y la fecha del item
const convertItemAmount = (amount, currency, dateStr, ratesMap, targetCurrency = 'ARS', notesSet) => {
  const originalAmount = parseFloat(amount);
  if (currency === targetCurrency) return originalAmount;
  if (isNaN(originalAmount)) return 0; // Si el monto no es válido, tratar como 0

  try {
    const itemDate = new Date(dateStr + 'T00:00:00Z');
    const year = itemDate.getUTCFullYear();
    const month = itemDate.getUTCMonth() + 1;
    const rateKey = `${year}-${month}-${currency}`;
    const rate = ratesMap[rateKey];

    if (rate !== null && rate !== undefined) {
      return originalAmount * rate;
    } else {
      // La nota ya se añadió en getRatesForItems
      return null; // Indica que la conversión no fue posible
    }
  } catch (e) {
    notesSet.add(`Error al procesar fecha '${dateStr}' para conversión de ${currency}.`);
    return null;
  }
};


// --- FUNCIONES EXISTENTES DEL DASHBOARD ---
// (getDashboardSummary, getMonthlySpendingByCategory, etc., como estaban antes, 
//  pero pueden ser actualizadas para usar los nuevos getRatesForItems y convertItemAmount si es necesario)
// ... (Tu código existente para las otras funciones del dashboard service) ...
// ... (Asegúrate de que las funciones existentes como getDashboardSummary, etc., estén aquí)

const getDashboardSummary = async (userId) => {
  // ... (código existente)
  console.log('[DEBUG] Backend Service: Entering getDashboardSummary for userId:', userId);
  try {
    const accounts = await db.Account.findAll({ 
        where: { userId: userId } 
    }); 
    console.log('[DEBUG] Backend Service: Fetched accounts for summary:', accounts.length);

    let totalBalanceARS = 0;
    let totalBalanceUSD = 0;
    let hasARS = false;
    let hasUSD = false;

    if (accounts && accounts.length > 0) {
      accounts.forEach(account => {
        if (account.includeInDashboardSummary) { 
          const balance = parseFloat(account.balance) || 0; 
          if (account.currency === 'ARS') {
            totalBalanceARS += balance;
            hasARS = true;
          } else if (account.currency === 'USD') {
            totalBalanceUSD += balance;
            hasUSD = true;
          }
        }
      });
    }

    const { year, monthNumber } = getMonthDateRange(new Date()); 
    const exchangeRateEntry = await db.ExchangeRate.findOne({
      where: { userId, year, month: monthNumber, fromCurrency: 'USD', toCurrency: 'ARS' }
    });
    
    let totalBalanceARSConverted = hasARS ? totalBalanceARS : 0;
    let conversionRateUsed = null;

    if (hasUSD && exchangeRateEntry && exchangeRateEntry.rate) {
      conversionRateUsed = parseFloat(exchangeRateEntry.rate);
      totalBalanceARSConverted += totalBalanceUSD * conversionRateUsed;
    } else if (hasUSD && !exchangeRateEntry) {
      console.warn(`[DashboardService Backend] No exchange rate found for USD to ARS for ${monthNumber}/${year} for user ${userId}. USD balance not converted for summary.`);
    }
    
    const finalConsolidatedValue = (hasARS || (hasUSD && conversionRateUsed)) ? totalBalanceARSConverted : (hasARS ? totalBalanceARS : (hasUSD ? null : 0) ); 
        
    return {
      balances: { 
        ARS: hasARS ? totalBalanceARS : null, 
        USD: hasUSD ? totalBalanceUSD : null,
      },
      totalBalanceARSConverted: finalConsolidatedValue,
      conversionRateUsed: conversionRateUsed,
      rateMonthYear: conversionRateUsed ? `${monthNumber}/${year}`: null
    };
  } catch (error) {
    console.error("[DashboardService Backend] Error calculating total balance:", error);
    return { 
        balances: { ARS: null, USD: null }, 
        totalBalanceARSConverted: null,
        conversionRateUsed: null,
        rateMonthYear: null
    }; 
  }
};

const getMonthlySpendingByCategory = async (userId, filters = {}) => {
  // ... (código existente)
  console.log('[DashboardService Backend] Fetching MonthlySpendingByCategory for userId:', userId, 'Filters:', filters);
  try {
    const currentMonthRange = getMonthDateRange(filters.dateFrom ? new Date(filters.dateFrom + 'T00:00:00Z') : new Date()); 
    const dateFrom = filters.dateFrom || currentMonthRange.dateFrom;
    const dateTo = filters.dateTo || currentMonthRange.dateTo;
    const targetCurrency = filters.currency || 'ARS';

    const transactionWhereClause = {
      userId,
      type: 'egreso',
      date: { [Op.between]: [dateFrom, dateTo] },
    };

    const transactions = await db.Transaction.findAll({
      where: transactionWhereClause,
      include: [{ model: db.Category, as: 'category', attributes: ['id', 'name', 'icon'] }],
      raw: true,
      nest: true,
    });

    if (transactions.length === 0) {
      return {
        labels: [],
        datasets: [{ label: `Gastos (${targetCurrency})`, data: [], backgroundColor: [], borderColor: [], borderWidth: 1 }],
        summary: { totalExpenses: 0, numberOfCategories: 0, currencyReported: targetCurrency, conversionNotes: [] }
      };
    }
    
    const { rates: expenseRates, notes: expenseConversionNotes } = await getRatesForItems(userId, transactions, targetCurrency);
    let conversionNotes = [...expenseConversionNotes];

    const expensesMap = new Map();
    for (const tx of transactions) {
      let amountInTargetCurrency = convertItemAmount(tx.amount, tx.currency, tx.date, expenseRates, targetCurrency, new Set()); // Usar un Set temporal aquí para notas de esta conversión
      
      if (amountInTargetCurrency === null && tx.currency !== targetCurrency) {
          // La nota ya se debería haber añadido en getRatesForItems o se podría añadir aquí si no.
          // Por ahora, el flujo de getRatesForItems ya añade la nota si falta la tasa.
          continue; 
      }
      // Si es null pero ya está en targetCurrency, significa que el monto original era inválido o 0.
      amountInTargetCurrency = amountInTargetCurrency === null ? parseFloat(tx.amount) : amountInTargetCurrency;


      const categoryKey = tx.category.id || 'sin_categoria';
      const currentCategoryData = expensesMap.get(categoryKey) || {
        totalAmount: 0, categoryName: tx.category.name || 'Sin Categoría', icon: tx.category.icon
      };
      currentCategoryData.totalAmount += Math.abs(amountInTargetCurrency); 
      expensesMap.set(categoryKey, currentCategoryData);
    }
    
    const sortedExpenses = Array.from(expensesMap.values()).sort((a,b) => b.totalAmount - a.totalAmount);
    const labels = sortedExpenses.map(item => item.categoryName);
    const data = sortedExpenses.map(item => item.totalAmount);
    const baseColors = ['rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)', 'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)'];
    
    return {
      labels: labels,
      datasets: [{
        label: `Gastos (${targetCurrency})`, data: data,
        backgroundColor: labels.map((_, i) => baseColors[i % baseColors.length]),
        borderColor: labels.map((_, i) => baseColors[i % baseColors.length].replace('0.7', '1')),
        borderWidth: 1,
      }],
      summary: {
        totalExpenses: data.reduce((sum, val) => sum + val, 0),
        numberOfCategories: labels.length, currencyReported: targetCurrency, conversionNotes
      }
    };

  } catch (error) {
    console.error("[DashboardService Backend] Error fetching monthly spending for chart:", error);
    return { labels: [], datasets: [{ data: [] }], summary: { totalExpenses: 0, numberOfCategories: 0, currencyReported: 'ARS', conversionNotes:['Error al cargar datos.'] } };
  }
};

const getInvestmentHighlights = async (userId, topN = 3) => {
  // ... (código existente)
  console.log('[DashboardService Backend] getInvestmentHighlights for userId:', userId);
  try {
    const allInvestments = await db.Investment.findAll({ where: { userId }});
    if (!allInvestments || allInvestments.length === 0) {
        return { totalValueByCurrency: {}, topInvestments: [], totalNumberOfInvestments: 0 };
    }
    const summaryByCurrency = allInvestments.reduce((acc, inv) => {
      const currency = inv.currency || 'ARS';
      acc[currency] = (acc[currency] || 0) + (parseFloat(inv.currentValue) || 0); 
      return acc;
    }, {});

    const sortedByValue = [...allInvestments].sort((a, b) => (parseFloat(b.currentValue) || 0) - (parseFloat(a.currentValue) || 0));
    const topInvestments = sortedByValue.slice(0, topN).map(inv => ({
        id: inv.id, name: inv.name, currentValue: parseFloat(inv.currentValue) || 0, 
        currency: inv.currency, icon: inv.icon, type: inv.type,
    }));
    return {
      totalValueByCurrency: summaryByCurrency, 
      topInvestments: topInvestments,
      totalNumberOfInvestments: allInvestments.length,
    };
  } catch (error) {
    console.error("[DashboardService Backend] Error getting investment highlights:", error);
    return { totalValueByCurrency: {}, topInvestments: [], totalNumberOfInvestments: 0 };
  }
};

const getCurrentMonthFinancialStatus = async (userId, targetCurrency = 'ARS') => {
  // ... (código existente, adaptado para usar los nuevos helpers de conversión)
  console.log('\n[DashService-MonthlyStatus] =================================================');
  console.log('[DashService-MonthlyStatus] INICIO getCurrentMonthFinancialStatus para user:', userId);
  const currentServerDate = new Date();
  const currentMonthRange = getMonthDateRange(currentServerDate); 
  const { dateFrom, dateTo, monthName, year, monthNumber } = currentMonthRange; // monthNumber es 1-12
  console.log(`[DashService-MonthlyStatus] Rango del mes actual (servidor): ${dateFrom} a ${dateTo} (${monthName} ${year})`);
  
  try {
    const currentMonthTransactions = await db.Transaction.findAll({
        where: {
            userId,
            date: { [Op.between]: [dateFrom, dateTo] } 
        },
        raw: true
    });
    console.log(`[DashService-MonthlyStatus] Transacciones encontradas para ${monthName} ${year}: ${currentMonthTransactions.length}`);
    
    const { rates, notes: rateConversionNotes } = await getRatesForItems(userId, currentMonthTransactions, targetCurrency);
    let conversionNotes = [...rateConversionNotes];

    let totalIncomeTargetCurrency = 0;
    let totalExpensesTargetCurrency = 0;
    let originalIncomeOtherCurrency = {}; 
    let originalExpensesOtherCurrency = {};


    const allAccounts = await db.Account.findAll({ where: { userId }, raw:true });
    const accountsIncludedInSummaryIds = allAccounts
                                          .filter(acc => acc.includeInDashboardSummary)
                                          .map(acc => acc.id.toString());

    if (Array.isArray(currentMonthTransactions) && currentMonthTransactions.length > 0) {
      currentMonthTransactions.forEach(tx => {
        if (accountsIncludedInSummaryIds.includes(tx.accountId.toString())) {
            let amountInTarget = convertItemAmount(tx.amount, tx.currency, tx.date, rates, targetCurrency, new Set());

            if (amountInTarget === null && tx.currency !== targetCurrency) {
                // Nota ya manejada por getRatesForItems
                originalIncomeOtherCurrency[tx.currency] = originalIncomeOtherCurrency[tx.currency] || 0;
                originalExpensesOtherCurrency[tx.currency] = originalExpensesOtherCurrency[tx.currency] || 0;
                if (tx.type === 'ingreso') originalIncomeOtherCurrency[tx.currency] += parseFloat(tx.amount);
                else originalExpensesOtherCurrency[tx.currency] += Math.abs(parseFloat(tx.amount));
                return; 
            }
            amountInTarget = amountInTarget === null ? parseFloat(tx.amount) : amountInTarget;

            if (tx.type === 'ingreso') {
                totalIncomeTargetCurrency += amountInTarget;
            } else if (tx.type === 'egreso') {
                totalExpensesTargetCurrency += Math.abs(amountInTarget);
            }
        }
      });
    }
    
    const netSavingsTargetCurrency = totalIncomeTargetCurrency - totalExpensesTargetCurrency;
    
    const statusByCurrency = {
        [targetCurrency]: {
            income: totalIncomeTargetCurrency,
            expenses: totalExpensesTargetCurrency,
            savings: netSavingsTargetCurrency,
        }
    };

    Object.keys(originalIncomeOtherCurrency).forEach(curr => {
        statusByCurrency[`${curr}_UNCONVERTED`] = {
            income: originalIncomeOtherCurrency[curr],
            expenses: originalExpensesOtherCurrency[curr] || 0,
            savings: (originalIncomeOtherCurrency[curr] || 0) - (originalExpensesOtherCurrency[curr] || 0),
            note: `Estos montos en ${curr} no se incluyeron en el total ${targetCurrency} por falta de tasa.`
        };
    });
    
    const usdRateForMonthKey = `${year}-${monthNumber}-USD`;
    const rateUsedForUSD = (targetCurrency === 'ARS' && rates[usdRateForMonthKey]) ? rates[usdRateForMonthKey] : null;

    console.log('[DashService-MonthlyStatus] FIN getCurrentMonthFinancialStatus ======================================');

    return {
      statusByCurrency,
      monthName,
      year,
      rateUsed: rateUsedForUSD,
      conversionNotes: [...new Set(conversionNotes)]
    };
  } catch (error) {
    console.error("[DashService-MonthlyStatus] EXCEPCIÓN calculando estado financiero del mes:", error);
    const fallbackMonthRange = getMonthDateRange();
    return { 
        statusByCurrency: {}, 
        monthName: fallbackMonthRange.monthName, 
        year: fallbackMonthRange.year,
        rateUsed: null,
        error: error.message,
        conversionNotes: ['Error al procesar datos.']
    };
  }
};


const getGlobalBudgetStatus = async (userId, targetCurrency = 'ARS') => {
  // ... (código existente, adaptado para conversión)
  console.log('[DashboardService Backend] Calculating Global Budget Status for user:', userId);
  const currentServerDate = new Date();
  const { dateFrom, dateTo, monthName, year } = getMonthDateRange(currentServerDate);

  try {
    const activeBudgets = await db.Budget.findAll({
      where: {
        userId,
        startDate: { [Op.lte]: dateTo },
        endDate: { [Op.gte]: dateFrom },
      },
      raw: true,
    });

    let totalBudgetedTargetCurrency = 0;
    const budgetCategoryIds = [];
    
    const { rates: budgetRates, notes: budgetConversionNotes } = await getRatesForItems(userId, activeBudgets.map(b => ({ date: b.startDate, currency: b.currency })), targetCurrency);
    let conversionNotes = [...budgetConversionNotes];


    activeBudgets.forEach(budget => {
        let budgetAmountInTarget = convertItemAmount(budget.amount, budget.currency, budget.startDate, budgetRates, targetCurrency, new Set());
        if (budgetAmountInTarget === null && budget.currency !== targetCurrency) {
            // Nota ya manejada
        } else if (budgetAmountInTarget !== null) {
            totalBudgetedTargetCurrency += budgetAmountInTarget;
        } else if (budget.currency === targetCurrency) { 
            totalBudgetedTargetCurrency += parseFloat(budget.amount);
        }

        if (budget.categoryId) {
            budgetCategoryIds.push(budget.categoryId);
        }
    });
    
    let totalSpentInBudgetedCategoriesTargetCurrency = 0;
    if (budgetCategoryIds.length > 0) {
      const transactionsInBudgetedCategories = await db.Transaction.findAll({
        where: {
          userId,
          type: 'egreso',
          date: { [Op.between]: [dateFrom, dateTo] }, 
          categoryId: { [Op.in]: budgetCategoryIds },
        },
        raw: true,
      });
      
      const { rates: expenseRates, notes: expenseConvNotes } = await getRatesForItems(userId, transactionsInBudgetedCategories, targetCurrency);
      conversionNotes = [...new Set([...conversionNotes, ...expenseConvNotes])]; // Combinar notas únicas

      transactionsInBudgetedCategories.forEach(tx => {
        let amountInTarget = convertItemAmount(tx.amount, tx.currency, tx.date, expenseRates, targetCurrency, new Set());
        if (amountInTarget === null && tx.currency !== targetCurrency) {
            return; 
        }
        amountInTarget = amountInTarget === null ? parseFloat(tx.amount) : amountInTarget;
        totalSpentInBudgetedCategoriesTargetCurrency += Math.abs(amountInTarget);
      });
    }
    
    const progressPercent = totalBudgetedTargetCurrency > 0 ? (totalSpentInBudgetedCategoriesTargetCurrency / totalBudgetedTargetCurrency) * 100 : 0;

    return {
      totalBudgeted: totalBudgetedTargetCurrency,
      totalSpent: totalSpentInBudgetedCategoriesTargetCurrency,
      currency: targetCurrency,
      progressPercent: parseFloat(progressPercent.toFixed(2)),
      month: monthName,
      year: year,
      conversionNotes
    };

  } catch (error) {
    console.error("[DashboardService Backend] Error calculating global budget status:", error);
    return { totalBudgeted: 0, totalSpent: 0, currency: targetCurrency, progressPercent: 0, conversionNotes: ['Error al calcular.'] };
  }
};

const getBalanceTrend = async (userId, numberOfMonths = 6, targetCurrency = 'ARS') => {
  // ... (código existente, adaptado para conversión)
  console.log(`[DashboardService Backend] Calculating Balance Trend for ${numberOfMonths} months for user:`, userId);
  try {
    const accounts = await db.Account.findAll({ where: { userId }, raw: true }); // raw:true
    const itemsForRateLookup = [];
    const todayForRate = getMonthDateRange(new Date()).dateFrom;

    accounts.forEach(acc => {
        if(acc.currency !== targetCurrency) itemsForRateLookup.push({date: todayForRate, currency: acc.currency});
    });
    // También necesitaremos tasas para el flujo de transacciones de cada mes
    for (let i = 0; i < numberOfMonths; i++) {
        const monthRange = getMonthDateRange(new Date(), -i);
        // Suponemos que necesitaremos tasas para USD a ARS para las transacciones
        if ('USD' !== targetCurrency) itemsForRateLookup.push({ date: monthRange.dateFrom, currency: 'USD'});
        if ('ARS' !== targetCurrency && 'ARS' !== 'USD') itemsForRateLookup.push({date: monthRange.dateFrom, currency: 'ARS'});
        // Añadir otras monedas comunes si es necesario
    }
    
    const { rates: exchangeRatesMap, notes: trendConvNotes } = await getRatesForItems(userId, itemsForRateLookup, targetCurrency);
    let conversionNotes = [...trendConvNotes];

    const calculateTotalBalanceInTarget = async (targetDateForBalance) => {
        let currentTotalBalanceTarget = 0;
        for (const account of accounts) {
            if (account.includeInDashboardSummary) {
                let balanceInTarget = convertItemAmount(account.balance, account.currency, getMonthDateRange(targetDateForBalance).dateFrom, exchangeRatesMap, targetCurrency, new Set());
                if (balanceInTarget !== null) {
                    currentTotalBalanceTarget += balanceInTarget;
                }
            }
        }
        return currentTotalBalanceTarget;
    };
    
    const today = new Date();
    let currentOverallBalanceTarget = await calculateTotalBalanceInTarget(today);

    const trendData = [];
    const labels = [];
    let rollingBalanceTarget = currentOverallBalanceTarget;

    for (let i = 0; i < numberOfMonths; i++) {
      const monthEndDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i + 1, 0)); 
      const { monthName: labelMonth, year: labelYear } = getMonthDateRange(monthEndDate);
      labels.unshift(labelMonth.substring(0,3) + '.' + labelYear.toString().slice(-2) ); 
      
      if (i === 0) { 
        trendData.unshift(rollingBalanceTarget);
      } else { 
        const flowMonthRange = getMonthDateRange(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i + 1, 1)));

        const transactionsThisFlowMonth = await db.Transaction.findAll({
          where: { userId, date: { [Op.between]: [flowMonthRange.dateFrom, flowMonthRange.dateTo] } },
          raw: true,
        });
        
        let netFlowThisMonthConvertedTarget = 0;

        for (const tx of transactionsThisFlowMonth) {
          const txAccount = accounts.find(acc => acc.id === tx.accountId && acc.includeInDashboardSummary);
          if (!txAccount) continue;

          let amountInTarget = convertItemAmount(tx.amount, tx.currency, tx.date, exchangeRatesMap, targetCurrency, new Set());
          if (amountInTarget === null ) amountInTarget = (tx.currency === targetCurrency ? parseFloat(tx.amount) : 0);
          
          netFlowThisMonthConvertedTarget += amountInTarget;
        }
        rollingBalanceTarget -= netFlowThisMonthConvertedTarget; 
        trendData.unshift(rollingBalanceTarget);
      }
    }

    let changeVsPreviousPeriodPercent = 0;
    if (trendData.length >= 2) {
      const latestBalance = trendData[trendData.length - 1]; 
      const previousBalance = trendData[trendData.length - 2]; 
      if (previousBalance !== 0) {
        changeVsPreviousPeriodPercent = ((latestBalance - previousBalance) / Math.abs(previousBalance)) * 100;
      } else if (latestBalance !== 0) { 
        changeVsPreviousPeriodPercent = latestBalance > 0 ? 100 : -100;
      }
    }
    
    return {
      labels,
      datasets: [{
        label: `Saldo Total (${targetCurrency} Aprox.)`,
        data: trendData.map(val => parseFloat(val.toFixed(2))),
        backgroundColor: 'rgba(52, 152, 219, 0.6)',
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 1,
      }],
      summary: {
        currentBalance: parseFloat(currentOverallBalanceTarget.toFixed(2)), 
        currency: targetCurrency,
        changeVsPreviousPeriodPercent: parseFloat(changeVsPreviousPeriodPercent.toFixed(2)),
      },
      conversionNotes: [...new Set(conversionNotes)]
    };

  } catch (error) {
    console.error("[DashboardService Backend] Error calculating balance trend:", error);
    return { labels: [], datasets: [], summary: { currentBalance: 0, currency: targetCurrency, changeVsPreviousPeriodPercent: 0 }, conversionNotes: ['Error al calcular tendencia.'] };
  }
};


// --- NUEVA FUNCIÓN PARA SALUD FINANCIERA ---
const calculateFinancialHealth = async (userId, targetCurrency = 'ARS') => {
  console.log(`[DashboardService] Calculating Financial Health for userId: ${userId} in ${targetCurrency}`);
  const today = new Date(); // Usar la fecha actual del servidor
  const currentMonthRange = getMonthDateRange(today);
  let conversionNotesSet = new Set();

  // --- 1. Obtener Datos Base ---
  const userAccountsRaw = await db.Account.findAll({ where: { userId }, raw: true });
  
  // Para promedios, tomar transacciones de los últimos 3 meses + mes actual (hasta 4 meses de datos)
  const dateForAveragesStart = getMonthDateRange(today, -2).dateFrom; // Inicio del mes de hace 2 meses
  
  const recentTransactionsRaw = await db.Transaction.findAll({
      where: { userId, date: { [Op.gte]: dateForAveragesStart } },
      raw: true
  });
  
  const activeDebtsAndLoansRaw = await db.DebtAndLoan.findAll({
      where: { userId, status: { [Op.notIn]: ['completed', 'cancelled'] } },
      raw: true
  });

  // Recopilar todos los items que necesitan tasas de cambio
  let itemsToGetRatesFor = [];
  userAccountsRaw.forEach(a => itemsToGetRatesFor.push({ date: currentMonthRange.dateFrom, currency: a.currency }));
  recentTransactionsRaw.forEach(t => itemsToGetRatesFor.push({ date: t.date, currency: t.currency }));
  activeDebtsAndLoansRaw.forEach(d => itemsToGetRatesFor.push({ date: d.initialDate, currency: d.currency }));
  
  const { rates: ratesMap, notes: rateNotes } = await getRatesForItems(userId, itemsToGetRatesFor, targetCurrency);
  rateNotes.forEach(note => conversionNotesSet.add(note));

  // --- 2. Procesar Transacciones para Ingresos/Egresos y Promedios ---
  let currentMonthIncomeConverted = 0;
  let currentMonthExpensesConverted = 0;
  const monthlyExpensesAggregated = {}; // { 'YYYY-MM': totalExpensesConverted }

  recentTransactionsRaw.forEach(tx => {
      const account = userAccountsRaw.find(a => a.id === tx.accountId);
      if (!account || !account.includeInDashboardSummary) return;

      let amountInTarget = convertItemAmount(tx.amount, tx.currency, tx.date, ratesMap, targetCurrency, conversionNotesSet);
      if (amountInTarget === null) return; // No se pudo convertir, nota ya añadida

      const txDate = new Date(tx.date + 'T00:00:00Z');
      const txYearMonth = `${txDate.getUTCFullYear()}-${String(txDate.getUTCMonth() + 1).padStart(2, '0')}`;

      if (tx.type === 'ingreso') {
          if (txYearMonth === `${currentMonthRange.year}-${String(currentMonthRange.monthNumber).padStart(2, '0')}`) {
              currentMonthIncomeConverted += amountInTarget;
          }
      } else if (tx.type === 'egreso') {
          const absAmountInTarget = Math.abs(amountInTarget);
          if (txYearMonth === `${currentMonthRange.year}-${String(currentMonthRange.monthNumber).padStart(2, '0')}`) {
              currentMonthExpensesConverted += absAmountInTarget;
          }
          // Acumular para promedio de gastos (últimos 3 meses completos + lo que va del actual si no hay 3 completos)
          if (txDate >= new Date(dateForAveragesStart + 'T00:00:00Z') && txDate <= new Date(currentMonthRange.dateTo + 'T23:59:59Z')) {
            monthlyExpensesAggregated[txYearMonth] = (monthlyExpensesAggregated[txYearMonth] || 0) + absAmountInTarget;
          }
      }
  });

  const expenseMonthsValues = Object.values(monthlyExpensesAggregated);
  const averageMonthlyExpenses = expenseMonthsValues.length > 0
      ? expenseMonthsValues.reduce((sum, val) => sum + val, 0) / expenseMonthsValues.length
      : (currentMonthExpensesConverted > 0 ? currentMonthExpensesConverted : 1); // Evitar división por cero

  // --- 3. Tasa de Ahorro ---
  const savingsRateValue = currentMonthIncomeConverted > 0 ? ((currentMonthIncomeConverted - currentMonthExpensesConverted) / currentMonthIncomeConverted) * 100 : 0;
  let savingsRateStatus = 'low', savingsRateRecommendation = 'Intenta aumentar tu tasa de ahorro.';
  if (savingsRateValue >= 20) { savingsRateStatus = 'excellent'; savingsRateRecommendation = '¡Excelente tasa de ahorro! Sigue así.'; }
  else if (savingsRateValue >= 10) { savingsRateStatus = 'good'; savingsRateRecommendation = 'Buena tasa de ahorro, ¡vas bien!'; }
  else if (savingsRateValue > 0) { savingsRateStatus = 'medium'; savingsRateRecommendation = 'Estás ahorrando, pero hay espacio para mejorar.'; }


  // --- 4. Fondo de Emergencia ---
  let totalLiquidAssetsConverted = 0;
  userAccountsRaw.filter(acc => acc.includeInDashboardSummary && (acc.type === 'efectivo' || acc.type === 'bancaria'))
    .forEach(acc => {
      let balanceInTarget = convertItemAmount(acc.balance, acc.currency, currentMonthRange.dateFrom, ratesMap, targetCurrency, conversionNotesSet);
      if (balanceInTarget !== null) totalLiquidAssetsConverted += balanceInTarget;
    });
  const emergencyFundMonths = averageMonthlyExpenses > 0 ? totalLiquidAssetsConverted / averageMonthlyExpenses : 0;
  const emergencyFundTargetMonths = 3;
  let emergencyFundStatus = 'low', emergencyFundRecommendation = `Tu fondo de emergencia es bajo. Apunta a ${emergencyFundTargetMonths} meses.`;
  if (emergencyFundMonths >= emergencyFundTargetMonths) { emergencyFundStatus = 'good'; emergencyFundRecommendation = `¡Excelente! Tienes ${emergencyFundMonths.toFixed(1)} meses de gastos cubiertos.`; }
  else if (emergencyFundMonths >= emergencyFundTargetMonths * 0.66) { emergencyFundStatus = 'medium'; emergencyFundRecommendation = `Estás cerca de tu objetivo de ${emergencyFundTargetMonths} meses.`;}
  

  // --- 5. Ratio Deuda / Ingreso (No Hipotecario) ---
  let totalNonMortgageDebtConverted = 0;
  userAccountsRaw.filter(acc => acc.includeInDashboardSummary && acc.type === 'tarjeta_credito' && parseFloat(acc.balance) < 0)
    .forEach(acc => {
      let debtInTarget = convertItemAmount(acc.balance, acc.currency, currentMonthRange.dateFrom, ratesMap, targetCurrency, conversionNotesSet);
      if (debtInTarget !== null) totalNonMortgageDebtConverted += Math.abs(debtInTarget);
    });
  activeDebtsAndLoansRaw.filter(d => d.type === 'debt').forEach(debt => {
      let remainingDebt = parseFloat(debt.totalAmount) - parseFloat(debt.paidAmount);
      let debtInTarget = convertItemAmount(remainingDebt, debt.currency, debt.initialDate, ratesMap, targetCurrency, conversionNotesSet);
      if (debtInTarget !== null) totalNonMortgageDebtConverted += debtInTarget;
    });
  const debtToIncomeRatioValue = currentMonthIncomeConverted > 0 ? (totalNonMortgageDebtConverted / currentMonthIncomeConverted) * 100 : (totalNonMortgageDebtConverted > 0 ? Infinity : 0);
  let debtToIncomeRatioStatus = 'good', debtToIncomeRatioRecommendation = 'Nivel de deuda saludable.';
  if (debtToIncomeRatioValue === Infinity) { debtToIncomeRatioStatus = 'very_high'; debtToIncomeRatioRecommendation = 'Ingresos cero este mes con deudas pendientes.';}
  else if (debtToIncomeRatioValue > 43) { debtToIncomeRatioStatus = 'very_high'; debtToIncomeRatioRecommendation = 'Nivel de deuda muy alto. Prioriza reducirla.'; }
  else if (debtToIncomeRatioValue > 30) { debtToIncomeRatioStatus = 'high'; debtToIncomeRatioRecommendation = 'Nivel de deuda alto. Considera planes de pago.'; }
  else if (debtToIncomeRatioValue > 15) { debtToIncomeRatioStatus = 'medium'; debtToIncomeRatioRecommendation = 'Nivel de deuda moderado. Vigílalo.'; }


  // --- 6. Cobertura de Deudas (Resumen de Tarjetas) ---
  let totalStatementBalancesConverted = 0;
  userAccountsRaw.filter(acc => acc.type === 'tarjeta_credito' && parseFloat(acc.statementBalance) > 0)
    .forEach(card => {
      let statementInTarget = convertItemAmount(card.statementBalance, card.currency, card.statementCloseDate || currentMonthRange.dateFrom, ratesMap, targetCurrency, conversionNotesSet);
      if (statementInTarget !== null) totalStatementBalancesConverted += statementInTarget;
    });
  const debtCoverageValue = totalStatementBalancesConverted > 0 ? totalLiquidAssetsConverted / totalStatementBalancesConverted : Infinity; // Infinity si no hay saldos de resumen
  let debtCoverageStatus = 'low', debtCoverageRecommendation = 'Aumenta tu liquidez para cubrir resúmenes.';
  if (debtCoverageValue === Infinity) { debtCoverageStatus = 'excellent'; debtCoverageRecommendation = '¡No tienes saldos de resumen pendientes!'; }
  else if (debtCoverageValue >= 1.5) { debtCoverageStatus = 'good'; debtCoverageRecommendation = 'Buena capacidad para cubrir tus resúmenes.'; }
  else if (debtCoverageValue >= 1) { debtCoverageStatus = 'medium'; debtCoverageRecommendation = 'Puedes cubrir tus resúmenes, pero ajustado.'; }


  // --- 7. Puntaje General (Ejemplo Ponderado) ---
  const normalize = (val, min, max) => Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
  const savingsScore = normalize(savingsRateValue, -20, 25); // ej: -20% = 0pts, 25% = 100pts
  const emergencyScore = normalize(emergencyFundMonths, 0, emergencyFundTargetMonths + 1); // ej: 0 meses=0pts, 4 meses=100pts
  const debtRatioScore = 100 - normalize(debtToIncomeRatioValue === Infinity ? 100 : debtToIncomeRatioValue, 10, 50); // ej: 10% deuda=100pts, 50% deuda=0pts
  const coverageScore = normalize(debtCoverageValue === Infinity ? 3 : debtCoverageValue, 0.5, 2); // ej: 0.5x=0pts, 2x=100pts

  let overallScore = (savingsScore * 0.30) + (emergencyScore * 0.30) + (debtRatioScore * 0.25) + (coverageScore * 0.15);
  overallScore = Math.round(Math.max(0, Math.min(overallScore, 100)));

  return {
    overallScore,
    savingsRate: { value: parseFloat(savingsRateValue.toFixed(1)), status: savingsRateStatus, recommendation: savingsRateRecommendation },
    emergencyFund: { value: parseFloat(emergencyFundMonths.toFixed(1)), targetMonths: emergencyFundTargetMonths, status: emergencyFundStatus, recommendation: emergencyFundRecommendation },
    debtToIncomeRatio: { value: parseFloat(debtToIncomeRatioValue.toFixed(1)), status: debtToIncomeRatioStatus, recommendation: debtToIncomeRatioRecommendation },
    debtCoverage: { value: parseFloat(debtCoverageValue.toFixed(1)), status: debtCoverageStatus, recommendation: debtCoverageRecommendation },
    summaryDate: currentMonthRange.dateTo,
    conversionNotes: Array.from(conversionNotesSet)
  };
};

const dashboardService = {
  getDashboardSummary,
  getMonthlySpendingByCategory,
  getInvestmentHighlights,
  getCurrentMonthFinancialStatus,
  getGlobalBudgetStatus,
  getBalanceTrend,
  calculateFinancialHealth,
};

module.exports = dashboardService;
