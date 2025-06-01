// Ruta: finanzas-app-pro/backend/services/dashboard.service.js
const db = require('../models');
const { Op, Sequelize } = require('sequelize');

// Helper para obtener el rango de fechas de un mes
const getMonthDateRange = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const firstDay = new Date(Date.UTC(year, month, 1)); // Usar UTC para evitar problemas de timezone al construir
  const lastDay = new Date(Date.UTC(year, month + 1, 0)); // Último día del mes también en UTC
  
  const formatDateString = (d) => {
    // Formatear a YYYY-MM-DD sin depender de la zona horaria local del servidor para el string
    const pad = (num) => (num < 10 ? '0' : '') + num;
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  };

  return {
    dateFrom: formatDateString(firstDay),
    dateTo: formatDateString(lastDay),
    monthName: firstDay.toLocaleString('es-AR', { month: 'long', timeZone: 'UTC' }),
    year: year, // Año de la fecha base
    monthNumber: month + 1 // Mes (1-12) de la fecha base
  };
};

// Helper para obtener tasas de cambio para un conjunto de transacciones
const getRatesForTransactions = async (userId, transactions) => {
    if (!transactions || transactions.length === 0) return {};
    const dateRateMap = {};
    const uniqueMonthYears = new Set();
    transactions.forEach(tx => {
        if (tx.currency === 'USD') {
            const dateParts = tx.date.split('-'); // Asumiendo formato YYYY-MM-DD
            if (dateParts.length === 3) {
                const year = parseInt(dateParts[0]);
                const month = parseInt(dateParts[1]);
                uniqueMonthYears.add(`${year}-${month}`);
            }
        }
    });

    if (uniqueMonthYears.size === 0) return {};

    const ratePromises = Array.from(uniqueMonthYears).map(async (yearMonth) => {
        const [year, month] = yearMonth.split('-').map(Number);
        if (dateRateMap[yearMonth]) return;

        const rateEntry = await db.ExchangeRate.findOne({
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

    const { year, monthNumber } = getMonthDateRange(new Date()); // Usar fecha actual para la tasa
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
    
    const finalConsolidatedValue = (hasARS || (hasUSD && conversionRateUsed)) ? totalBalanceARSConverted : (hasARS ? totalBalanceARS : (hasUSD ? null : 0) ); // Ajuste para devolver 0 si no hay nada
        
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
    
    let rates = {};
    let conversionNotes = [];
    if (targetCurrency === 'ARS' && transactions.some(tx => tx.currency === 'USD')) {
        rates = await getRatesForTransactions(userId, transactions);
    }

    const expensesMap = new Map();
    for (const tx of transactions) {
      let amountInTargetCurrency = parseFloat(tx.amount); // El monto ya es negativo para egresos
      if (tx.currency !== targetCurrency && tx.currency === 'USD' && targetCurrency === 'ARS') {
        const txDateParts = tx.date.split('-');
        const yearMonthKey = `${parseInt(txDateParts[0])}-${parseInt(txDateParts[1])}`;
        const rate = rates[yearMonthKey];
        if (rate) {
          amountInTargetCurrency = amountInTargetCurrency * rate;
        } else {
          conversionNotes.push(`Transacción ${tx.id} (${tx.description}) en USD no convertida a ARS por falta de tasa para ${parseInt(txDateParts[1])}/${parseInt(txDateParts[0])}.`);
          continue; // Omitir esta transacción del total ARS si no hay tasa
        }
      } else if (tx.currency !== targetCurrency) {
        // Si se quiere soportar otras conversiones, se añadiría lógica aquí
        conversionNotes.push(`Conversión de ${tx.currency} a ${targetCurrency} no soportada para tx ${tx.id} (${tx.description}).`);
        continue; // Omitir si no se puede convertir
      }
      const categoryKey = tx.category.id || 'sin_categoria';
      const currentCategoryData = expensesMap.get(categoryKey) || {
        totalAmount: 0, categoryName: tx.category.name || 'Sin Categoría', icon: tx.category.icon
      };
      currentCategoryData.totalAmount += Math.abs(amountInTargetCurrency); // Sumar el valor absoluto para el gráfico
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
  console.log('\n[DashService-MonthlyStatus] =================================================');
  console.log('[DashService-MonthlyStatus] INICIO getCurrentMonthFinancialStatus para user:', userId);
  // Usar la fecha actual del servidor para determinar el mes actual
  const currentServerDate = new Date();
  const currentMonthRange = getMonthDateRange(currentServerDate); 
  const { dateFrom, dateTo, monthName, year, monthNumber } = currentMonthRange;
  console.log(`[DashService-MonthlyStatus] Rango del mes actual (calculado por el servidor): ${dateFrom} a ${dateTo} (${monthName} ${year})`);
  
  try {
    const exchangeRateEntry = await db.ExchangeRate.findOne({
      where: { userId, year, month: monthNumber, fromCurrency: 'USD', toCurrency: 'ARS' }
    });
    const usdToArsRate = exchangeRateEntry ? parseFloat(exchangeRateEntry.rate) : null;
    if (!usdToArsRate) {
        console.warn(`[DashService-MonthlyStatus] No se encontró tasa USD a ARS para ${monthNumber}/${year} para user ${userId}. Las transacciones en USD no se convertirán para el total ARS.`);
    } else {
        console.log(`[DashService-MonthlyStatus] Tasa USD a ARS para ${monthNumber}/${year} obtenida: ${usdToArsRate}`);
    }

    const currentMonthTransactions = await db.Transaction.findAll({
        where: {
            userId,
            date: { [Op.between]: [dateFrom, dateTo] } // Fechas en formato YYYY-MM-DD
        }
    });
    console.log(`[DashService-MonthlyStatus] Transacciones encontradas para ${monthName} ${year}: ${currentMonthTransactions.length}`);
    
    let totalIncomeARS = 0;
    let totalExpensesARS = 0;
    let originalIncomeUSD = 0;
    let originalExpensesUSD = 0;

    const allAccounts = await db.Account.findAll({ where: { userId }});
    const accountsIncludedInSummaryIds = allAccounts
                                          .filter(acc => acc.includeInDashboardSummary)
                                          .map(acc => acc.id.toString());
    console.log(`[DashService-MonthlyStatus] IDs de cuentas incluidas en el resumen del dashboard: [${accountsIncludedInSummaryIds.join(', ')}]`);


    if (Array.isArray(currentMonthTransactions) && currentMonthTransactions.length > 0) {
      currentMonthTransactions.forEach(tx => {
        console.log(`[DashService-MonthlyStatus] Procesando Tx ID: ${tx.id}, Tipo: ${tx.type}, Monto: ${tx.amount}, Moneda: ${tx.currency}, CuentaID: ${tx.accountId}, Fecha: ${tx.date}`);

        if (accountsIncludedInSummaryIds.includes(tx.accountId.toString())) {
            console.log(`  [DashService-MonthlyStatus] Tx ID: ${tx.id} PERTENECE a una cuenta incluida en el resumen.`);
            const amount = parseFloat(tx.amount) || 0; // El monto ya tiene signo desde la BD
            let amountInARS = amount;

            if (tx.currency === 'USD') {
                console.log(`    [DashService-MonthlyStatus] Tx ID: ${tx.id} es en USD.`);
                if (usdToArsRate) {
                    amountInARS = amount * usdToArsRate;
                    console.log(`    [DashService-MonthlyStatus] Tx ID: ${tx.id} (USD) convertido a ARS: ${amountInARS.toFixed(2)} (Monto original USD: ${amount}, Tasa: ${usdToArsRate})`);
                } else {
                    console.warn(`    [DashService-MonthlyStatus] Tx ID: ${tx.id} (USD) NO CONVERTIDO por falta de tasa. Se acumulará en USD_UNCONVERTED.`);
                    if (tx.type === 'ingreso') { 
                        originalIncomeUSD += amount; // El monto de ingreso es positivo
                    } else if (tx.type === 'egreso') { 
                        originalExpensesUSD += Math.abs(amount); // El monto de egreso es negativo
                    }
                    return; // Saltar esta transacción para los totales consolidados en ARS
                }
            } else if (tx.currency !== 'ARS') {
                // Si no es USD y no es ARS, actualmente se suma tal cual.
                console.warn(`    [DashService-MonthlyStatus] Tx ID: ${tx.id} en moneda ${tx.currency} (no USD, no ARS). Se sumará como si fuera ARS para el consolidado.`);
            }

            // El 'amount' de la transacción ya viene con el signo correcto: positivo para ingreso, negativo para egreso.
            if (tx.type === 'ingreso') {
                totalIncomeARS += amountInARS; // amountInARS será positivo si es ingreso
                console.log(`    [DashService-MonthlyStatus] Tx ID: ${tx.id} es INGRESO. Sumando ${amountInARS.toFixed(2)}. totalIncomeARS ahora: ${totalIncomeARS.toFixed(2)}`);
            } else if (tx.type === 'egreso') {
                totalExpensesARS += Math.abs(amountInARS); // Los egresos se suman como absolutos para el total de gastos
                                                            // amountInARS será negativo si es egreso.
                console.log(`    [DashService-MonthlyStatus] Tx ID: ${tx.id} es EGRESO. Sumando ${Math.abs(amountInARS).toFixed(2)}. totalExpensesARS ahora: ${totalExpensesARS.toFixed(2)}`);
            }
        } else {
            console.log(`  [DashService-MonthlyStatus] Tx ID: ${tx.id} NO PERTENECE a una cuenta incluida en el resumen (Cuenta ID: ${tx.accountId}). Se omite del cálculo de Ingresos/Egresos del mes.`);
        }
      });
    } else {
        console.log(`[DashService-MonthlyStatus] No se encontraron transacciones en el rango de fechas o el array está vacío para el usuario ${userId}.`);
    }
    
    const netSavingsARS = totalIncomeARS - totalExpensesARS;
    console.log(`[DashService-MonthlyStatus] FINAL CALC: totalIncomeARS=${totalIncomeARS.toFixed(2)}, totalExpensesARS=${totalExpensesARS.toFixed(2)}, netSavingsARS=${netSavingsARS.toFixed(2)}, originalIncomeUSD=${originalIncomeUSD.toFixed(2)}, originalExpensesUSD=${originalExpensesUSD.toFixed(2)}`);
    console.log('[DashService-MonthlyStatus] FIN getCurrentMonthFinancialStatus ======================================');

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
                  note: "Estos montos en USD no se incluyeron en el total ARS por falta de tasa de cambio para el mes."
              }
          })
      },
      monthName,
      year,
      rateUsed: usdToArsRate
    };
  } catch (error) {
    console.error("[DashService-MonthlyStatus] EXCEPCIÓN calculando estado financiero del mes:", error);
    const fallbackMonthRange = getMonthDateRange();
    return { 
        statusByCurrency: {}, 
        monthName: fallbackMonthRange.monthName, 
        year: fallbackMonthRange.year,
        rateUsed: null,
        error: error.message 
    };
  }
};


const getGlobalBudgetStatus = async (userId) => {
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

    let totalBudgetedARS = 0;
    const budgetCategoryIds = [];
    const budgetCurrencies = new Set(); // Para rastrear si hay presupuestos en USD

    activeBudgets.forEach(budget => {
        // Por ahora, asumimos que el reporte global es en ARS y convertimos presupuestos USD si hay tasa
        budgetCurrencies.add(budget.currency);
        totalBudgetedARS += parseFloat(budget.amount); // Sumar directamente; la conversión se hará si es necesario después
        if (budget.categoryId) {
            budgetCategoryIds.push(budget.categoryId);
        }
    });
    
    // Si hay presupuestos en USD y queremos un total ARS, necesitaríamos una tasa.
    // Esta lógica se complica si los presupuestos pueden ser en diferentes monedas y el target es ARS.
    // Por simplicidad actual, si hay mezcla, el "totalBudgetedARS" puede ser una mezcla.
    // Una mejora sería convertir todo a ARS si hay tasa disponible.


    let totalSpentInBudgetedCategoriesARS = 0;
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
      
      const rates = await getRatesForTransactions(userId, transactionsInBudgetedCategories.filter(tx => tx.currency === 'USD'));

      transactionsInBudgetedCategories.forEach(tx => {
        let amount = parseFloat(tx.amount); 
        if (tx.currency === 'USD') {
          const txDateParts = tx.date.split('-');
          const yearMonthKey = `${parseInt(txDateParts[0])}-${parseInt(txDateParts[1])}`;
          const rate = rates[yearMonthKey];
          if (rate) {
            amount = amount * rate;
          } else {
            console.warn(`[GlobalBudgetStatus] No rate for USD tx ${tx.id}, not included in spent for budget report.`);
            return; 
          }
        } else if (tx.currency !== 'ARS') {
             console.warn(`[GlobalBudgetStatus] Transaction ${tx.id} in ${tx.currency} not converted for ARS budget summary.`);
             // Decidir si omitir o sumar tal cual. Por ahora, omitimos si no es ARS o USD convertible.
             return;
        }
        totalSpentInBudgetedCategoriesARS += Math.abs(amount);
      });
    }
    
    const progressPercent = totalBudgetedARS > 0 ? (totalSpentInBudgetedCategoriesARS / totalBudgetedARS) * 100 : 0;

    return {
      totalBudgeted: totalBudgetedARS,
      totalSpent: totalSpentInBudgetedCategoriesARS,
      currency: budgetCurrencies.size > 1 ? 'MIXED' : (budgetCurrencies.values().next().value || 'ARS'), // Indicar si hay mezcla
      progressPercent: parseFloat(progressPercent.toFixed(2)),
      month: monthName,
      year: year,
    };

  } catch (error) {
    console.error("[DashboardService Backend] Error calculating global budget status:", error);
    return { totalBudgeted: 0, totalSpent: 0, currency: 'ARS', progressPercent: 0 };
  }
};

const getBalanceTrend = async (userId, numberOfMonths = 6) => {
  console.log(`[DashboardService Backend] Calculating Balance Trend for ${numberOfMonths} months for user:`, userId);
  try {
    const accounts = await db.Account.findAll({ where: { userId } });
    const exchangeRatesCache = {}; // { "YYYY-M": rate }

    const calculateTotalBalanceInARS = async (targetDate) => {
        let currentTotalBalanceARS = 0;
        const { year: targetYear, monthNumber: targetMonth } = getMonthDateRange(targetDate);

        for (const account of accounts) {
            if (account.includeInDashboardSummary) {
                let balanceInARS = parseFloat(account.balance);
                if (account.currency === 'USD') {
                    const rateKey = `${targetYear}-${targetMonth}`;
                    if (exchangeRatesCache[rateKey] === undefined) {
                        const rateEntry = await db.ExchangeRate.findOne({
                            where: { userId, year: targetYear, month: targetMonth, fromCurrency: 'USD', toCurrency: 'ARS' }
                        });
                        exchangeRatesCache[rateKey] = rateEntry ? parseFloat(rateEntry.rate) : null;
                    }
                    if (exchangeRatesCache[rateKey]) {
                        balanceInARS *= exchangeRatesCache[rateKey];
                    } else {
                        // Si no hay tasa para el mes del saldo que se está calculando, no sumar este balance USD
                        balanceInARS = 0; 
                        console.warn(`[BalanceTrend] No exchange rate for ${targetMonth}/${targetYear} for USD account ${account.name}. Its balance won't be part of ARS total for this period.`);
                    }
                } else if (account.currency !== 'ARS') {
                    balanceInARS = 0; // No sumar otras monedas si no son ARS o USD (convertible)
                     console.warn(`[BalanceTrend] Account ${account.name} in ${account.currency} not included in ARS total for trend.`);
                }
                currentTotalBalanceARS += balanceInARS;
            }
        }
        return currentTotalBalanceARS;
    };
    
    // Saldo actual (al final del día de hoy)
    const today = new Date();
    let currentOverallBalanceARS = await calculateTotalBalanceInARS(today);

    const trendData = [];
    const labels = [];
    let rollingBalanceARS = currentOverallBalanceARS;

    for (let i = 0; i < numberOfMonths; i++) {
      const dateForMonthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i + 1, 0)); // Fin del mes i-ésimo hacia atrás
      const { monthName: labelMonth, year: labelYear } = getMonthDateRange(dateForMonthEnd);
      labels.unshift(labelMonth.substring(0,3) + '.' + labelYear.toString().slice(-2) ); 
      
      if (i === 0) { // Para el mes actual, usamos el saldo calculado al día de hoy
        trendData.unshift(rollingBalanceARS);
      } else { // Para meses anteriores, calculamos el saldo al final de ese mes
        // Necesitamos el flujo neto del mes *posterior* al que queremos calcular el saldo final.
        // Ej: para saldo de fin de Mayo, necesitamos flujo de Junio y restarlo del saldo de fin de Junio.
        const monthToCalculateNetFlow = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i + 1, 1)); // Inicio del mes (i-1)
        const { dateFrom: netFlowDateFrom, dateTo: netFlowDateTo, year: netFlowYear, monthNumber: netFlowMonth } = getMonthDateRange(monthToCalculateNetFlow);

        const transactionsThisFlowMonth = await db.Transaction.findAll({
          where: { userId, date: { [Op.between]: [netFlowDateFrom, netFlowDateTo] } },
          raw: true,
        });
        
        let netFlowThisMonthConvertedARS = 0;
        for (const tx of transactionsThisFlowMonth) {
          const txAccount = accounts.find(acc => acc.id === tx.accountId && acc.includeInDashboardSummary);
          if (!txAccount) continue;

          let amountInARS = parseFloat(tx.amount);
          if (tx.currency === 'USD') {
            const rateKey = `${netFlowYear}-${netFlowMonth}`;
            if (exchangeRatesCache[rateKey] === undefined) { 
              const rateEntry = await db.ExchangeRate.findOne({
                where: { userId, year: netFlowYear, month: netFlowMonth, fromCurrency: 'USD', toCurrency: 'ARS' }
              });
              exchangeRatesCache[rateKey] = rateEntry ? parseFloat(rateEntry.rate) : null;
            }
            if (exchangeRatesCache[rateKey]) {
              amountInARS *= exchangeRatesCache[rateKey];
            } else {
              amountInARS = 0;
            }
          } else if (tx.currency !== 'ARS') {
            amountInARS = 0;
          }
          netFlowThisMonthConvertedARS += amountInARS;
        }
        rollingBalanceARS -= netFlowThisMonthConvertedARS; // Restar el flujo del mes "siguiente" para obtener el saldo al final del mes "actual" del bucle
        trendData.unshift(rollingBalanceARS);
      }
    }

    let changeVsPreviousPeriodPercent = 0;
    if (trendData.length >= 2) {
      const latestBalance = trendData[trendData.length - 1]; // Saldo del mes más reciente en el gráfico (que es el actual)
      const previousBalance = trendData[trendData.length - 2]; // Saldo del mes anterior
      if (previousBalance !== 0) {
        changeVsPreviousPeriodPercent = ((latestBalance - previousBalance) / Math.abs(previousBalance)) * 100;
      } else if (latestBalance !== 0) { // Si el anterior es 0 y el actual no, es 100% de cambio o -100%
        changeVsPreviousPeriodPercent = latestBalance > 0 ? 100 : -100;
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
        currentBalance: parseFloat(currentOverallBalanceARS.toFixed(2)), // El saldo más actual calculado
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