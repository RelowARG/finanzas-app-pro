// Ruta: finanzas-app-pro/frontend/src/utils/formatters.js

/**
 * Formatea un monto numérico a una cadena de moneda.
 * @param {number} amount - El monto a formatear.
 * @param {string} currencyCode - El código de moneda (ej. 'ARS', 'USD').
 * @param {string} locale - El locale para el formato (ej. 'es-AR').
 * @returns {string} - El monto formateado como string.
 */
export const formatCurrency = (amount, currencyCode = 'ARS', locale = 'es-AR') => {
  const value = Number(amount);
  if (isNaN(value)) {
    // Manejar el caso donde amount no es un número válido, podría devolver un string vacío o un default
    // console.warn(`formatCurrency recibió un valor no numérico: ${amount}`);
    // Por ahora, si es NaN, tratamos de mostrar el símbolo de moneda con 0.00 o manejar como prefieras.
    // Dependiendo de si el backend ya envía el monto con signo, ajustamos.
    // Esta función asume que 'amount' es el valor numérico puro.
    const symbol = currencyCode === 'USD' ? 'U$S' : '$';
    return `${symbol} 0,00`; 
  }

  let options = {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };
  
  // Para evitar el "-$ X.XX" y mostrar "$ -X.XX" o "-$X.XX"
  // Intl.NumberFormat no lo maneja directamente de forma estándar para todos los locales.
  // Lo más simple es manejar el signo por separado si es necesario un formato específico.
  // Sin embargo, para la mayoría de los casos, el formato por defecto del locale es aceptable.
  
  // Si el monto ya viene con signo del backend y solo queremos formatear el absoluto:
  // const absValue = Math.abs(value);
  // const sign = value < 0 ? "-" : "";
  // return `${sign}${new Intl.NumberFormat(locale, options).format(absValue).replace(/^(\D+)/, '').trim()}`;
  // Pero si 'amount' es el valor puro, y el tipo (ingreso/egreso) lo da el contexto:

  return new Intl.NumberFormat(locale, options).format(value);
};


/**
 * Formatea una cadena de fecha (YYYY-MM-DD o ISO) a un formato Dia/Mes/Año.
 * @param {string} dateString - La fecha en formato string.
 * @returns {string} - La fecha formateada o 'N/A'.
 */
export const formatDateDMY = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    // Añadir 'T00:00:00Z' asegura que se interprete como UTC y luego se convierta al local para mostrar,
    // evitando problemas de "off-by-one day" debido a la zona horaria del navegador al parsear YYYY-MM-DD.
    const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00Z');
    if (isNaN(date.getTime())) { // Comprobar si la fecha es inválida
        // console.warn(`formatDateDMY recibió una fecha inválida: ${dateString}`);
        return 'Fecha Inv.';
    }
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC', // Mostrar la fecha tal cual es, sin conversión de zona horaria local del navegador si ya viene de UTC
    });
  } catch (error) {
    // console.error(`Error formateando fecha: ${dateString}`, error);
    return 'Fecha Inv.';
  }
};

/**
 * Formatea una cadena de fecha (YYYY-MM-DD o ISO) a un formato más descriptivo.
 * @param {string} dateString - La fecha en formato string.
 * @returns {string} - La fecha formateada o 'N/A'.
 */
export const formatDateFull = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00Z');
         if (isNaN(date.getTime())) {
            return 'Fecha Inv.';
        }
        return date.toLocaleDateString('es-AR', {
            weekday: 'long', // "lunes"
            year: 'numeric', // "2024"
            month: 'long', // "marzo"
            day: 'numeric', // "14"
            timeZone: 'UTC',
        });
    } catch (error) {
        return 'Fecha Inv.';
    }
};

/**
 * Capitaliza la primera letra de un string.
 * @param {string} string - El string a capitalizar.
 * @returns {string}
 */
export const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};