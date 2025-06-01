// Ruta: finanzas-app-pro/backend/utils/dateUtils.js
/**
 * Calcula la próxima fecha de ejecución para una transacción recurrente.
 * @param {string} frequency - Ej: 'diaria', 'semanal', 'mensual', 'anual', 'quincenal', 'bimestral', 'trimestral', 'semestral'.
 * @param {Date} baseDate - La fecha base para el cálculo (usualmente la última ejecución o la fecha de inicio).
 * @param {number|null} dayOfMonth - Día del mes (1-31) para frecuencias mensuales, anuales, etc.
 * @param {number|null} dayOfWeek - Día de la semana (0=Domingo, 1=Lunes...) para frecuencia semanal.
 * @param {number|null} monthOfYear - Mes del año (1-12) para frecuencia anual.
 * @param {boolean} isFirstCalculation - True si es el primer cálculo desde startDate, para asegurar que no se saltee la startDate.
 * @returns {string} - Próxima fecha de ejecución en formato YYYY-MM-DD.
 */
const calculateNextRunDate = (frequency, baseDateInput, dayOfMonth, dayOfWeek, monthOfYear, isFirstCalculation = false) => {
    let nextDate = new Date(baseDateInput.getTime()); // Clonar la fecha base para no modificarla
    
    // Si es el primer cálculo y la baseDate ya cumple la condición de día/mes, no la incrementamos innecesariamente al inicio.
    // Pero si no es el primer cálculo, siempre avanzamos al menos un período.
    let shouldIncrementPeriod = !isFirstCalculation;

    // console.log(`CalcNextRun: Freq=${frequency}, Base=${baseDateInput.toISOString()}, DoM=${dayOfMonth}, DoW=${dayOfWeek}, MoY=${monthOfYear}, isFirst=${isFirstCalculation}`);

    switch (frequency) {
        case 'diaria':
            if (shouldIncrementPeriod || isFirstCalculation && nextDate < baseDateInput) {
                 nextDate.setUTCDate(nextDate.getUTCDate() + 1);
            }
            break;
        case 'semanal':
            if (dayOfWeek === null || dayOfWeek === undefined) throw new Error('dayOfWeek es requerido para frecuencia semanal');
            if (shouldIncrementPeriod) {
                nextDate.setUTCDate(nextDate.getUTCDate() + 1); // Asegurar que avanzamos para buscar el próximo
            }
            while (nextDate.getUTCDay() !== dayOfWeek) {
                nextDate.setUTCDate(nextDate.getUTCDate() + 1);
            }
            break;
        case 'quincenal': // Asume dos días fijos del mes, ej. 1 y 15, o 15 y último.
            if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 15) { // Asumimos que dayOfMonth es el primer día de la quincena (1-15)
                // console.warn('Para frecuencia quincenal, se espera dayOfMonth entre 1 y 15. Usando 1 y 15 por defecto.');
                dayOfMonth = 1; // O manejar como error
            }
            const secondQuincenaDay = dayOfMonth + 15; // Aproximado, podría ser fin de mes

            if (shouldIncrementPeriod) {
                nextDate.setUTCDate(nextDate.getUTCDate() + 1);
            }

            const currentDay = nextDate.getUTCDate();
            const currentMonth = nextDate.getUTCMonth();
            const currentYear = nextDate.getUTCFullYear();
            
            if (currentDay > dayOfMonth && currentDay < secondQuincenaDay) { // Si estamos entre los dos días de quincena
                nextDate.setUTCDate(secondQuincenaDay); // Ir al segundo día de quincena del mes actual
                const daysInMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();
                if (nextDate.getUTCDate() > daysInMonth ) nextDate.setUTCDate(daysInMonth); // Ajustar si el día 30/31 no existe
            } else if (currentDay >= secondQuincenaDay) { // Si ya pasó el segundo día de quincena
                nextDate.setUTCMonth(nextDate.getUTCMonth() + 1); // Ir al próximo mes
                nextDate.setUTCDate(dayOfMonth); // Al primer día de quincena del próximo mes
            } else { // (currentDay <= dayOfMonth)
                 nextDate.setUTCDate(dayOfMonth); // Ir al primer día de quincena del mes actual
            }
            break;
        case 'mensual':
        case 'bimestral':
        case 'trimestral':
        case 'semestral':
            if (!dayOfMonth) throw new Error('dayOfMonth es requerido para frecuencia mensual, bimestral, trimestral o semestral.');
            let monthIncrement = 1;
            if (frequency === 'bimestral') monthIncrement = 2;
            if (frequency === 'trimestral') monthIncrement = 3;
            if (frequency === 'semestral') monthIncrement = 6;

            if (shouldIncrementPeriod) {
                nextDate.setUTCMonth(nextDate.getUTCMonth() + monthIncrement);
            } else if (nextDate.getUTCDate() > dayOfMonth && nextDate.getUTCMonth() === baseDateInput.getUTCMonth()){
                // Si es el primer cálculo, pero la baseDate es después del dayOfMonth en el mismo mes, saltar al siguiente período.
                nextDate.setUTCMonth(nextDate.getUTCMonth() + monthIncrement);
            }
            
            nextDate.setUTCDate(dayOfMonth);
            // Ajustar si el día no existe en ese mes (ej. día 31 en Febrero)
            let tempMonthCheck = nextDate.getUTCMonth();
            while (nextDate.getUTCDate() !== dayOfMonth) { // Si setUTCDate cambió el mes (porque el día no existía)
                nextDate.setUTCMonth(tempMonthCheck); // Volver al mes correcto
                nextDate.setUTCDate(new Date(Date.UTC(nextDate.getUTCFullYear(), tempMonthCheck + 1, 0)).getUTCDate()); // último día del mes
                if (nextDate.getUTCDate() < dayOfMonth) { // Si el último día sigue siendo menor (ej. día 30 y queremos día 31 en feb)
                     nextDate.setUTCMonth(tempMonthCheck + monthIncrement); // Saltar al siguiente periodo
                     nextDate.setUTCDate(dayOfMonth); // E intentar de nuevo
                     tempMonthCheck = nextDate.getUTCMonth();
                }
            }
            break;
        case 'anual':
            if (!dayOfMonth || !monthOfYear) throw new Error('dayOfMonth y monthOfYear son requeridos para frecuencia anual.');
            if (shouldIncrementPeriod) {
                nextDate.setUTCFullYear(nextDate.getUTCFullYear() + 1);
            } else if (isFirstCalculation) {
                const baseMonth = baseDateInput.getUTCMonth() + 1; // 1-12
                const baseDay = baseDateInput.getUTCDate();
                if (baseMonth > monthOfYear || (baseMonth === monthOfYear && baseDay > dayOfMonth)) {
                    nextDate.setUTCFullYear(nextDate.getUTCFullYear() + 1);
                }
            }
            nextDate.setUTCMonth(monthOfYear - 1); // Meses son 0-indexados
            nextDate.setUTCDate(dayOfMonth);
            // Ajustar día si no existe (similar a mensual)
            let tempAnnualMonthCheck = nextDate.getUTCMonth();
            while (nextDate.getUTCDate() !== dayOfMonth) {
                nextDate.setUTCMonth(tempAnnualMonthCheck);
                nextDate.setUTCDate(new Date(Date.UTC(nextDate.getUTCFullYear(), tempAnnualMonthCheck + 1, 0)).getUTCDate());
                if (nextDate.getUTCDate() < dayOfMonth) {
                     nextDate.setUTCFullYear(nextDate.getUTCFullYear() + 1);
                     nextDate.setUTCMonth(monthOfYear - 1);
                     nextDate.setUTCDate(dayOfMonth);
                     tempAnnualMonthCheck = nextDate.getUTCMonth();
                }
            }
            break;
        default:
            throw new Error(`Frecuencia no soportada: ${frequency}`);
    }
    return nextDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
};

module.exports = { calculateNextRunDate };