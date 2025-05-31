// Ruta: finanzas-app-pro/backend/services/dashboard.service.js
const db = require('../models'); // Para acceder a los modelos directamente
const { Op } = require('sequelize'); // Si necesitas operadores de Sequelize
// No necesitas importar otros servicios aquí si las funciones hacen consultas directas a la BD
// o si los controladores ya llaman a esos otros servicios por separado.
// Si necesitas lógica de otros servicios, los requerirías así:
// const accountService = require('./accounts.service');
// const transactionService = require('./transactions.service');
// const reportsService = require('./reports.service');
// const investmentsService = require('./investments.service');


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
    monthNumber: month + 1 // Para buscar la tasa de cambio
  };
};

const getDashboardSummary = async (userId) => {
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

    console.log('[DEBUG] Backend Service: Initial totalBalanceARS (from included accounts):', totalBalanceARS);
    console.log('[DEBUG] Backend Service: Initial totalBalanceUSD (from included accounts):', totalBalanceUSD);
    console.log('[DEBUG] Backend Service: hasARS:', hasARS, '| hasUSD:', hasUSD);

    const { year, monthNumber } = getMonthDateRange();
    console.log('[DEBUG] Backend Service: Current server month/year for rate lookup:', monthNumber, '/', year);

    const exchangeRateEntry = await db.ExchangeRate.findOne({
      where: { userId, year, month: monthNumber, fromCurrency: 'USD', toCurrency: 'ARS' }
    });
    console.log('[DEBUG] Backend Service: exchangeRateEntry found:', exchangeRateEntry ? exchangeRateEntry.toJSON() : null);

    let totalBalanceARSConverted = hasARS ? totalBalanceARS : 0;
    console.log('[DEBUG] Backend Service: totalBalanceARSConverted after ARS init:', totalBalanceARSConverted);
    
    let conversionRateUsed = null;

    if (hasUSD && exchangeRateEntry && exchangeRateEntry.rate) {
      conversionRateUsed = parseFloat(exchangeRateEntry.rate);
      console.log('[DEBUG] Backend Service: USD to ARS Rate found and used:', conversionRateUsed);
      totalBalanceARSConverted += totalBalanceUSD * conversionRateUsed;
      console.log('[DEBUG] Backend Service: totalBalanceARSConverted after USD conversion (if any):', totalBalanceARSConverted);
    } else if (hasUSD && !exchangeRateEntry) {
      console.warn(`[DashboardService Backend] No exchange rate found for USD to ARS for ${monthNumber}/${year} for user ${userId}. USD balance not converted for summary.`);
      console.log('[DEBUG] Backend Service: No rate found, totalBalanceARSConverted (variable) remains:', totalBalanceARSConverted);
    } else if (!hasUSD) {
      console.log('[DEBUG] Backend Service: No USD balance to convert.');
    }

    const finalConsolidatedValue = (hasARS || (hasUSD && conversionRateUsed)) ? totalBalanceARSConverted : (hasARS ? totalBalanceARS : null);
    // Corrección: Si no hay USD o no hay tasa, pero sí hay ARS, el consolidado debe ser el total ARS.
    // Si solo hay USD y no hay tasa, el consolidado será null.
    // Si no hay ni ARS ni USD, será null.
    
    console.log('[DEBUG] Backend Service: Condition for returning consolidated (hasARS || (hasUSD && conversionRateUsed)):', (hasARS || (hasUSD && conversionRateUsed)));
    console.log('[DEBUG] Backend Service: totalBalanceARSConverted (variable) before return:', totalBalanceARSConverted);
    console.log('[DEBUG] Backend Service: Final summary.totalBalanceARSConverted property being returned:', finalConsolidatedValue);
    
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
  // Esta función ahora llama directamente a la lógica de reportes, adaptada para ser un servicio interno.
  // El controlador de reportes (/api/reports/expenses-by-category) es para la página de reportes.
  // Aquí necesitamos la lógica subyacente.
  try {
    const currentMonthRange = getMonthDateRange(); 
    const dateFrom = filters.dateFrom || currentMonthRange.dateFrom;
    const dateTo = filters.dateTo || currentMonthRange.dateTo;
    const targetCurrency = filters.currency || 'ARS'; // Para el dashboard, usualmente ARS

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
    
    let rates = {};
    let conversionNotes = [];
    if (targetCurrency === 'ARS' && transactions.some(tx => tx.currency === 'USD')) {
        // Reutilizar la lógica de getRatesForTransactions (podría extraerse a un helper)
        const dateRateMap = {};
        const uniqueMonthYears = new Set();
        transactions.forEach(tx => {
            if (tx.currency === 'USD') {
                const date = new Date(tx.date);
                uniqueMonthYears.add(`${date.getFullYear()}-${date.getMonth() + 1}`);
            }
        });
        if (uniqueMonthYears.size > 0) {
            const ratePromises = Array.from(uniqueMonthYears).map(async (yearMonth) => {
                const [year, month] = yearMonth.split('-').map(Number);
                const rateEntry = await db.ExchangeRate.findOne({
                    where: { userId, year, month, fromCurrency: 'USD', toCurrency: 'ARS' }
                });
                dateRateMap[yearMonth] = rateEntry ? parseFloat(rateEntry.rate) : null;
            });
            await Promise.all(ratePromises);
            rates = dateRateMap;
        }
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

const getCurrentMonthFinancialStatus = async (userId) => {
  console.log('[DashboardService Backend] getCurrentMonthFinancialStatus for user:', userId);
  const currentMonthRange = getMonthDateRange(); 
  const { dateFrom, dateTo, monthName, year, monthNumber } = currentMonthRange;
  
  try {
    const exchangeRateEntry = await db.ExchangeRate.findOne({
      where: { userId, year, month: monthNumber, fromCurrency: 'USD', toCurrency: 'ARS' }
    });
    const usdToArsRate = exchangeRateEntry ? parseFloat(exchangeRateEntry.rate) : null;
    if (!usdToArsRate) {
        console.warn(`[DashboardService Backend] No USD to ARS exchange rate for ${monthNumber}/${year} for user ${userId}. USD transactions will not be converted.`);
    }

    const currentMonthTransactions = await db.Transaction.findAll({
        where: {
            userId,
            date: { [Op.between]: [dateFrom, dateTo] }
        }
    });
    
    let totalIncomeARS = 0;
    let totalExpensesARS = 0;
    let originalIncomeUSD = 0;
    let originalExpensesUSD = 0;

    const allAccounts = await db.Account.findAll({ where: { userId }});
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

const dashboardService = {
  getDashboardSummary,
  getMonthlySpendingByCategory,
  getInvestmentHighlights,
  getCurrentMonthFinancialStatus,
};

module.exports = dashboardService;