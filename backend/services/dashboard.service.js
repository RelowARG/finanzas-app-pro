// Ruta: finanzas-app-pro/backend/services/dashboard.service.js
const db = require('../models'); // [cite: finanzas-app-pro/backend/models/index.js]
const { Op, Sequelize } = require('sequelize');

// Helper para obtener el rango de fechas de un mes
const getMonthDateRange = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const formatDateString = (d) => d.toISOString().split('T')[0];
  return {
    dateFrom: formatDateString(firstDay),
    dateTo: formatDateString(lastDay),
    monthName: firstDay.toLocaleString('es-AR', { month: 'long' }),
    year: year,
    monthNumber: month + 1 
  };
};

// Helper para obtener tasas de cambio para un conjunto de transacciones
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

        const rateEntry = await db.ExchangeRate.findOne({ // [cite: finanzas-app-pro/backend/models/exchangeRate.model.js]
            where: { userId, year, month, fromCurrency: 'USD', toCurrency: 'ARS' }
        });
        if (rateEntry) {
            dateRateMap[yearMonth] = parseFloat(rateEntry.rate);
        } else {
            dateRateMap[yearMonth] = null;
            console.warn(`[DashboardService Helpers] No exchange rate for USD to ARS for ${month}/${year} for user ${userId}`);
        }
    });
    await Promise.all(ratePromises);
    return dateRateMap;
};


const getDashboardSummary = async (userId) => {
  console.log('[DEBUG] Backend Service: Entering getDashboardSummary for userId:', userId);
  try {
    const accounts = await db.Account.findAll({  // [cite: finanzas-app-pro/backend/models/account.model.js]
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

    const { year, monthNumber } = getMonthDateRange();
    const exchangeRateEntry = await db.ExchangeRate.findOne({ // [cite: finanzas-app-pro/backend/models/exchangeRate.model.js]
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
    
    const finalConsolidatedValue = (hasARS || (hasUSD && conversionRateUsed)) ? totalBalanceARSConverted : (hasARS ? totalBalanceARS : null);
        
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
  console.log('[DashboardService Backend] Fetching MonthlySpendingByCategory for userId:', userId, 'Filters:', filters);
  try {
    const currentMonthRange = getMonthDateRange(); 
    const dateFrom = filters.dateFrom || currentMonthRange.dateFrom;
    const dateTo = filters.dateTo || currentMonthRange.dateTo;
    const targetCurrency = filters.currency || 'ARS';

    const transactionWhereClause = {
      userId,
      type: 'egreso',
      date: { [Op.between]: [dateFrom, dateTo] },
    };

    const transactions = await db.Transaction.findAll({ // [cite: finanzas-app-pro/backend/models/transaction.model.js]
      where: transactionWhereClause,
      include: [{ model: db.Category, as: 'category', attributes: ['id', 'name', 'icon'] }], // [cite: finanzas-app-pro/backend/models/category.model.js]
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
    
    let rates = {};
    let conversionNotes = [];
    if (targetCurrency === 'ARS' && transactions.some(tx => tx.currency === 'USD')) {
        rates = await getRatesForTransactions(userId, transactions);
    }

    const expensesMap = new Map();
    for (const tx of transactions) {
      let amountInTargetCurrency = parseFloat(tx.amount);
      if (tx.currency !== targetCurrency && tx.currency === 'USD' && targetCurrency === 'ARS') {
        const txDate = new Date(tx.date);
        const yearMonthKey = `${txDate.getFullYear()}-${txDate.getMonth() + 1}`;
        const rate = rates[yearMonthKey];
        if (rate) {
          amountInTargetCurrency = amountInTargetCurrency * rate;
        } else {
          conversionNotes.push(`Transacción ${tx.id} en USD no convertida por falta de tasa para ${txDate.getMonth() + 1}/${txDate.getFullYear()}.`);
          continue; 
        }
      } else if (tx.currency !== targetCurrency) {
        conversionNotes.push(`Conversión de ${tx.currency} a ${targetCurrency} no soportada para tx ${tx.id}.`);
        continue;
      }
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
  console.log('[DashboardService Backend] getInvestmentHighlights for userId:', userId);
  try {
    const allInvestments = await db.Investment.findAll({ where: { userId }}); // [cite: finanzas-app-pro/backend/models/investment.model.js]
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

const getCurrentMonthFinancialStatus = async (userId) => {
  console.log('[DashboardService Backend] getCurrentMonthFinancialStatus for user:', userId);
  const currentMonthRange = getMonthDateRange(); 
  const { dateFrom, dateTo, monthName, year, monthNumber } = currentMonthRange;
  
  try {
    const exchangeRateEntry = await db.ExchangeRate.findOne({ // [cite: finanzas-app-pro/backend/models/exchangeRate.model.js]
      where: { userId, year, month: monthNumber, fromCurrency: 'USD', toCurrency: 'ARS' }
    });
    const usdToArsRate = exchangeRateEntry ? parseFloat(exchangeRateEntry.rate) : null;
    if (!usdToArsRate) {
        console.warn(`[DashboardService Backend] No USD to ARS exchange rate for ${monthNumber}/${year} for user ${userId}. USD transactions will not be converted.`);
    }

    const currentMonthTransactions = await db.Transaction.findAll({ // [cite: finanzas-app-pro/backend/models/transaction.model.js]
        where: {
            userId,
            date: { [Op.between]: [dateFrom, dateTo] }
        }
    });
    
    let totalIncomeARS = 0;
    let totalExpensesARS = 0;
    let originalIncomeUSD = 0;
    let originalExpensesUSD = 0;

    const allAccounts = await db.Account.findAll({ where: { userId }}); // [cite: finanzas-app-pro/backend/models/account.model.js]
    const accountsIncludedInSummaryIds = allAccounts
                                          .filter(acc => acc.includeInDashboardSummary)
                                          .map(acc => acc.id.toString());

    if (Array.isArray(currentMonthTransactions) && currentMonthTransactions.length > 0) {
      currentMonthTransactions.forEach(tx => {
        if (accountsIncludedInSummaryIds.includes(tx.accountId.toString())) {
            const amount = parseFloat(tx.amount) || 0; 
            let amountInARS = amount;

            if (tx.currency === 'USD') {
                if (usdToArsRate) {
                    amountInARS = amount * usdToArsRate;
                } else {
                    console.warn(`[DashboardService Backend] Skipping USD transaction ${tx.id} from ARS total due to missing rate.`);
                    if (tx.type === 'ingreso') originalIncomeUSD += amount;
                    else if (tx.type === 'egreso') originalExpensesUSD += Math.abs(amount);
                    return; 
                }
            }
            if (tx.type === 'ingreso') {
                totalIncomeARS += amountInARS;
            } else if (tx.type === 'egreso') {
                totalExpensesARS += Math.abs(amountInARS); 
            }
        }
      });
    }
    
    const netSavingsARS = totalIncomeARS - totalExpensesARS;

    return {
      statusByCurrency: {
          ARS: {
              income: totalIncomeARS,
              expenses: totalExpensesARS,
              savings: netSavingsARS,
          },
          ...( (originalIncomeUSD > 0 || originalExpensesUSD > 0) && {
              USD_UNCONVERTED: {
                  income: originalIncomeUSD,
                  expenses: originalExpensesUSD,
                  savings: originalIncomeUSD - originalExpensesUSD,
                  note: "No se pudo convertir a ARS por falta de tasa de cambio para el mes."
              }
          })
      },
      monthName,
      year,
      rateUsed: usdToArsRate
    };
  } catch (error) {
    console.error("[DashboardService Backend] Error calculating current month financial status:", error);
    const fallbackMonthRange = getMonthDateRange();
    return { 
        statusByCurrency: {}, 
        monthName: fallbackMonthRange.monthName, 
        year: fallbackMonthRange.year,
        rateUsed: null
    };
  }
};

const getGlobalBudgetStatus = async (userId) => {
  console.log('[DashboardService Backend] Calculating Global Budget Status for user:', userId);
  const { dateFrom, dateTo } = getMonthDateRange();

  try {
    const activeBudgets = await db.Budget.findAll({ // [cite: finanzas-app-pro/backend/models/budget.model.js]
      where: {
        userId,
        startDate: { [Op.lte]: dateTo },
        endDate: { [Op.gte]: dateFrom },
      },
      raw: true,
    });

    let totalBudgetedARS = 0;
    const budgetCategoryIds = [];
    activeBudgets.forEach(budget => {
      totalBudgetedARS += parseFloat(budget.amount);
      if (budget.categoryId) {
        budgetCategoryIds.push(budget.categoryId);
      }
    });

    let totalSpentInBudgetedCategoriesARS = 0;
    if (budgetCategoryIds.length > 0) {
      const transactionsInBudgetedCategories = await db.Transaction.findAll({ // [cite: finanzas-app-pro/backend/models/transaction.model.js]
        where: {
          userId,
          type: 'egreso',
          date: { [Op.between]: [dateFrom, dateTo] },
          categoryId: { [Op.in]: budgetCategoryIds },
        },
        raw: true,
      });
      
      const rates = await getRatesForTransactions(userId, transactionsInBudgetedCategories.filter(tx => tx.currency === 'USD'));

      transactionsInBudgetedCategories.forEach(tx => {
        let amount = parseFloat(tx.amount);
        if (tx.currency === 'USD') {
          const txDate = new Date(tx.date);
          const yearMonthKey = `${txDate.getFullYear()}-${txDate.getMonth() + 1}`;
          const rate = rates[yearMonthKey];
          if (rate) {
            amount = amount * rate;
          } else {
            console.warn(`[GlobalBudgetStatus] No rate for USD tx ${tx.id}, not included in spent.`);
            return;
          }
        }
        totalSpentInBudgetedCategoriesARS += Math.abs(amount);
      });
    }
    
    const progressPercent = totalBudgetedARS > 0 ? (totalSpentInBudgetedCategoriesARS / totalBudgetedARS) * 100 : 0;

    return {
      totalBudgeted: totalBudgetedARS,
      totalSpent: totalSpentInBudgetedCategoriesARS,
      currency: 'ARS',
      progressPercent: parseFloat(progressPercent.toFixed(2)),
      month: new Date().toLocaleString('es-AR', { month: 'long' }),
      year: new Date().getFullYear(),
    };

  } catch (error) {
    console.error("[DashboardService Backend] Error calculating global budget status:", error);
    return { totalBudgeted: 0, totalSpent: 0, currency: 'ARS', progressPercent: 0 };
  }
};

const getBalanceTrend = async (userId, numberOfMonths = 6) => {
  console.log(`[DashboardService Backend] Calculating Balance Trend for ${numberOfMonths} months for user:`, userId);
  try {
    const accounts = await db.Account.findAll({ where: { userId } }); // [cite: finanzas-app-pro/backend/models/account.model.js]
    const exchangeRatesCache = {}; 

    let currentTotalBalanceARS = 0;
    for (const account of accounts) {
      if (account.includeInDashboardSummary) {
        let balanceInARS = parseFloat(account.balance);
        if (account.currency === 'USD') {
          const { monthNumber, year } = getMonthDateRange();
          const rateKey = `${year}-${monthNumber}`;
          if (exchangeRatesCache[rateKey] === undefined) {
            const rateEntry = await db.ExchangeRate.findOne({ // [cite: finanzas-app-pro/backend/models/exchangeRate.model.js]
              where: { userId, year, month: monthNumber, fromCurrency: 'USD', toCurrency: 'ARS' }
            });
            exchangeRatesCache[rateKey] = rateEntry ? parseFloat(rateEntry.rate) : null;
          }
          if (exchangeRatesCache[rateKey]) {
            balanceInARS *= exchangeRatesCache[rateKey];
          } else {
            console.warn(`[BalanceTrend] No current rate for USD account ${account.id}, balance not included accurately.`);
            balanceInARS = 0;
          }
        }
        currentTotalBalanceARS += balanceInARS;
      }
    }

    const trendData = [];
    const labels = [];
    let rollingBalanceARS = currentTotalBalanceARS;

    for (let i = 0; i < numberOfMonths; i++) {
      const dateForMonth = new Date();
      dateForMonth.setMonth(dateForMonth.getMonth() - i);
      const { dateFrom, dateTo, monthName, year, monthNumber } = getMonthDateRange(dateForMonth);
      
      labels.unshift(monthName.substring(0,3) + '.' + year.toString().slice(-2) ); 

      if (i === 0) {
        trendData.unshift(rollingBalanceARS);
      } else {
        const transactionsThisMonth = await db.Transaction.findAll({ // [cite: finanzas-app-pro/backend/models/transaction.model.js]
          where: { userId, date: { [Op.between]: [dateFrom, dateTo] } },
          raw: true,
        });
        
        let netFlowThisMonthARS = 0;
        for (const tx of transactionsThisMonth) {
          const txAccount = accounts.find(acc => acc.id === tx.accountId && acc.includeInDashboardSummary);
          if (!txAccount) continue;

          let amountInARS = parseFloat(tx.amount);
          if (tx.currency === 'USD') {
            const rateKey = `${year}-${monthNumber}`;
            if (exchangeRatesCache[rateKey] === undefined) { 
              const rateEntry = await db.ExchangeRate.findOne({ // [cite: finanzas-app-pro/backend/models/exchangeRate.model.js]
                where: { userId, year, month: monthNumber, fromCurrency: 'USD', toCurrency: 'ARS' }
              });
              exchangeRatesCache[rateKey] = rateEntry ? parseFloat(rateEntry.rate) : null;
            }
            if (exchangeRatesCache[rateKey]) {
              amountInARS *= exchangeRatesCache[rateKey];
            } else {
              console.warn(`[BalanceTrend] No rate for USD tx ${tx.id} in ${monthName} ${year}, not included in net flow.`);
              amountInARS = 0;
            }
          }
          netFlowThisMonthARS += amountInARS;
        }
        rollingBalanceARS -= netFlowThisMonthARS;
        trendData.unshift(rollingBalanceARS);
      }
    }

    let changeVsPreviousPeriodPercent = 0;
    if (trendData.length >= 2) {
      const latestBalance = trendData[trendData.length - 1];
      const previousBalance = trendData[trendData.length - 2];
      if (previousBalance !== 0) {
        changeVsPreviousPeriodPercent = ((latestBalance - previousBalance) / Math.abs(previousBalance)) * 100;
      } else if (latestBalance > 0) {
        changeVsPreviousPeriodPercent = 100;
      }
    }
    
    return {
      labels,
      datasets: [{
        label: 'Saldo Total (ARS Aprox.)',
        data: trendData.map(val => parseFloat(val.toFixed(2))),
        backgroundColor: 'rgba(52, 152, 219, 0.6)',
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 1,
      }],
      summary: {
        currentBalance: parseFloat(currentTotalBalanceARS.toFixed(2)),
        currency: 'ARS',
        changeVsPreviousPeriodPercent: parseFloat(changeVsPreviousPeriodPercent.toFixed(2)),
      }
    };

  } catch (error) {
    console.error("[DashboardService Backend] Error calculating balance trend:", error);
    return { labels: [], datasets: [], summary: { currentBalance: 0, currency: 'ARS', changeVsPreviousPeriodPercent: 0 } };
  }
};

const dashboardService = {
  getDashboardSummary,
  getMonthlySpendingByCategory,
  getInvestmentHighlights,
  getCurrentMonthFinancialStatus,
  getGlobalBudgetStatus,
  getBalanceTrend,
};

module.exports = dashboardService;