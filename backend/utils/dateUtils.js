// Ruta: finanzas-app-pro/backend/utils/dateUtils.js
// ARCHIVO NUEVO
const calculateNextRunDate = (startDate, frequency, dayOfMonth, dayOfWeek) => {
    let nextDate = new Date(startDate); // Empezar desde la fecha de inicio
    const today = new Date();
    today.setHours(0,0,0,0); // Normalizar a inicio del día

    // Asegurarse de que la primera ejecución no sea en el pasado respecto a hoy,
    // a menos que la fecha de inicio sea hoy o en el futuro.
    if (nextDate < today && new Date(startDate) < today) {
        nextDate = new Date(today); // Si startDate es pasado, calcular desde hoy
    }


    switch (frequency) {
        case 'diaria':
            if (nextDate < today) nextDate.setDate(today.getDate() + 1); // Si es pasado, el próximo es mañana
            else if (nextDate.getTime() === today.getTime() && new Date().getHours() >=0) { // Si es hoy y ya pasó la hora de ejecución (asumimos 00:00)
                 // No, esto es para la fecha. Si es hoy, es hoy. El job correrá hoy.
            }
            break;
        case 'semanal':
            if (dayOfWeek === null || dayOfWeek === undefined) throw new Error('dayOfWeek es requerido para frecuencia semanal');
            // Avanzar hasta el próximo dayOfWeek correcto
            while (nextDate.getDay() !== dayOfWeek || nextDate < today) {
                nextDate.setDate(nextDate.getDate() + 1);
                 if (nextDate.getDay() === dayOfWeek && nextDate < today) { // Si encontramos el día pero es pasado
                    nextDate.setDate(nextDate.getDate() + 7); // Saltar a la próxima semana
                }
            }
            break;
        case 'mensual':
            if (!dayOfMonth) throw new Error('dayOfMonth es requerido para frecuencia mensual');
            nextDate.setDate(dayOfMonth);
            if (nextDate < today) { // Si este mes ya pasó o es hoy pero ya se ejecutó
                nextDate.setMonth(nextDate.getMonth() + 1);
            }
             // Manejar meses con menos días que dayOfMonth
            while (nextDate.getDate() !== dayOfMonth) {
                nextDate.setDate(dayOfMonth); // Intentar de nuevo el próximo mes
                if (nextDate < today) nextDate.setMonth(nextDate.getMonth() + 1);
            }
            break;
        case 'quincenal': // Lógica simplificada: día X y día X+15 (o fin de mes)
             if (!dayOfMonth) throw new Error('dayOfMonth es requerido para frecuencia quincenal (primer día de la quincena)');
             const midMonthDay = 15;
             let firstOption = new Date(nextDate.getFullYear(), nextDate.getMonth(), dayOfMonth);
             let secondOption = new Date(nextDate.getFullYear(), nextDate.getMonth(), Math.min(dayOfMonth + 15, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()));
             
             if (firstOption >= today) nextDate = firstOption;
             else if (secondOption >= today) nextDate = secondOption;
             else { // Ambas opciones son pasadas, ir al próximo mes
                nextDate.setMonth(nextDate.getMonth() + 1);
                nextDate.setDate(dayOfMonth);
             }
            break;
        // Añadir lógica para 'anual', 'bimestral', 'trimestral', 'semestral'
        default:
            throw new Error(`Frecuencia no soportada: ${frequency}`);
    }
    return nextDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
};

module.exports = { calculateNextRunDate };