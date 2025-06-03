// Ruta: backend/services/accountTrend.service.js
console.log('DEBUG: accountTrend.service.js started loading');
const db = require('../models');
const { Op, Sequelize } = require('sequelize');

// Funciones auxiliares (pueden ser importadas de utils si ya existen allí)
const getMonthDateRange = (date = new Date(), monthsOffset = 0) => {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + monthsOffset);

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

const getRatesForItems = async (userId, items, targetCurrency = 'ARS') => {
  if (!items || items.length === 0) return { rates: {}, notes: [] };
  
  const rateMap = {}; 
  const uniqueRateLookups = new Set();
  let notes = [];

  items.forEach(item => {
    if (item.currency && item.currency !== targetCurrency) {
      try {
        const itemDate = new Date(item.date + 'T00:00:00Z'); 
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

    if (rateMap[lookupKey]) return; 

    const rateEntry = await db.ExchangeRate.findOne({
      where: { userId, year: numYear, month: numMonth, fromCurrency, toCurrency: targetCurrency }
    });

    if (rateEntry) {
      rateMap[lookupKey] = parseFloat(rateEntry.rate);
    } else {
      rateMap[lookupKey] = null; 
      const noteMsg = `No se encontró tasa de cambio para ${fromCurrency} a ${targetCurrency} en ${numMonth}/${numYear}.`;
      if (!notes.includes(noteMsg)) notes.push(noteMsg);
    }
  });
  await Promise.all(ratePromises);
  return { rates: rateMap, notes };
};

const convertItemAmount = (amount, currency, dateStr, ratesMap, targetCurrency = 'ARS', notesSet) => {
  const originalAmount = parseFloat(amount);
  if (currency === targetCurrency) return originalAmount;
  if (isNaN(originalAmount)) return 0; 

  try {
    const itemDate = new Date(dateStr + 'T00:00:00Z');
    const year = itemDate.getUTCFullYear();
    const month = itemDate.getUTCMonth() + 1;
    const rateKey = `${year}-${month}-${currency}`;
    const rate = ratesMap[rateKey];

    if (rate !== null && rate !== undefined) {
      return originalAmount * rate;
    } else {
      notesSet.add(`Error al procesar fecha '${dateStr}' para conversión de ${currency}.`);
      return null; 
    }
  } catch (e) {
    notesSet.add(`Error al procesar fecha '${dateStr}' para conversión de ${currency}.`);
    return null;
  }
};


const getAccountBalanceTrend = async (userId, accountId, numberOfMonths = 6, targetCurrency = 'ARS') => {
  console.log(`[AccountTrendService] Calculating Balance Trend for Account ID: ${accountId} for ${numberOfMonths} months (User: ${userId})`);
  try {
    const account = await db.Account.findOne({ where: { id: accountId, userId: userId }, raw: true });
    if (!account) {
      console.log(`[AccountTrendService] Account with ID ${accountId} not found for user ${userId}.`);
      return { labels: [], datasets: [], summary: { currentBalance: 0, currency: targetCurrency, changeVsPreviousPeriodPercent: 0 }, conversionNotes: [`Account with ID ${accountId} not found.`] };
    }

    let conversionNotes = [];
    const trendData = [];
    const labels = [];

    // Paso 1: Obtener el saldo actual de la cuenta específica
    let currentBalanceOfAccount = parseFloat(account.balance) || 0;
    
    // Obtener tasas para el mes actual para convertir el saldo inicial si la moneda de la cuenta es diferente
    const currentMonthDateRange = getMonthDateRange(new Date());
    const { rates: currentRates, notes: currentRateNotes } = await getRatesForItems(userId, [{ date: currentMonthDateRange.dateFrom, currency: account.currency }], targetCurrency);
    currentRateNotes.forEach(note => conversionNotes.push(note));

    let convertedCurrentBalance = convertItemAmount(currentBalanceOfAccount, account.currency, currentMonthDateRange.dateFrom, currentRates, targetCurrency, new Set());
    if (convertedCurrentBalance === null) {
        conversionNotes.push(`No se pudo convertir el saldo actual de la cuenta ${account.name} (${account.currency}) a ${targetCurrency}.`);
        convertedCurrentBalance = currentBalanceOfAccount; // Usar el balance original si no se puede convertir
    }
    currentBalanceOfAccount = convertedCurrentBalance; // Actualizar con el balance convertido

    let rollingBalanceForTrend = currentBalanceOfAccount; // Este será el punto más reciente en el gráfico

    // Paso 2: Iterar hacia atrás para construir la tendencia
    for (let i = 0; i < numberOfMonths; i++) {
      const monthOffsetDate = new Date();
      monthOffsetDate.setUTCMonth(monthOffsetDate.getUTCMonth() - i); // Fecha para el mes actual o meses anteriores
      const monthRange = getMonthDateRange(monthOffsetDate);
      
      labels.unshift(monthRange.dateFrom); // Usar la fecha de inicio del mes como label para el eje X

      if (i === 0) {
        // Para el mes actual, el punto de datos es el saldo actual
        trendData.unshift(rollingBalanceForTrend);
      } else {
        // Para meses anteriores, calculamos el flujo neto de transacciones de ese mes
        // y lo RESTAMOS al saldo rodante para obtener el saldo al inicio de ese mes (fin del mes anterior)
        const transactionsWhere = {
            userId,
            accountId: accountId, // << FILTRADO CRÍTICO: SOLO TRANSACCIONES DE ESTA CUENTA
            date: { [Op.between]: [monthRange.dateFrom, monthRange.dateTo] }
        };

        const transactionsThisMonth = await db.Transaction.findAll({
          where: transactionsWhere,
          raw: true,
        });

        const { rates: monthRates, notes: monthRateNotes } = await getRatesForItems(userId, transactionsThisMonth, targetCurrency);
        monthRateNotes.forEach(note => conversionNotes.push(note));

        let netFlowThisMonthConverted = 0;
        for (const tx of transactionsThisMonth) {
            let amountInTarget = convertItemAmount(tx.amount, tx.currency, tx.date, monthRates, targetCurrency, new Set());
            if (amountInTarget === null) {
                conversionNotes.push(`No se pudo convertir la transacción ${tx.id} (${tx.currency}) a ${targetCurrency} para el cálculo de flujo de ${monthRange.monthName} ${monthRange.year}.`);
                amountInTarget = 0;
            }
            
            if (tx.type === 'ingreso') {
                netFlowThisMonthConverted += amountInTarget;
            } else if (tx.type === 'egreso') {
                netFlowThisMonthConverted -= Math.abs(amountInTarget); 
            }
        }
        
        // Restar el flujo neto del mes para obtener el saldo al inicio de ese mes
        rollingBalanceForTrend -= netFlowThisMonthConverted; 
        trendData.unshift(rollingBalanceForTrend);
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
        label: `Saldo (${targetCurrency})`, 
        data: trendData.map(val => parseFloat(val.toFixed(2))),
      }],
      summary: {
        currentBalance: parseFloat(currentBalanceOfAccount.toFixed(2)), 
        currency: targetCurrency,
        changeVsPreviousPeriodPercent: parseFloat(changeVsPreviousPeriodPercent.toFixed(2)),
      },
      conversionNotes: [...new Set(conversionNotes)] 
    };

  } catch (error) {
    console.error(`[AccountTrendService] Error calculating balance trend for account ${accountId}:`, error);
    return { labels: [], datasets: [], summary: { currentBalance: 0, currency: targetCurrency, changeVsPreviousPeriodPercent: 0 }, conversionNotes: ['Error al calcular la tendencia de saldo de la cuenta.'] };
  }
};

module.exports = {
  getAccountBalanceTrend,
};