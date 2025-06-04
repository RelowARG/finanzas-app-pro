// Ruta: finanzas-app-pro/backend/services/investmentUpdate.service.js
const db = require('../models');
const Investment = db.Investment;
const { Op } = require('sequelize');

/**
 * Actualiza el currentValue de los Plazos Fijos activos basado en su TNA.
 * @param {boolean} isStartupCatchUp - Indica si se está ejecutando al inicio para procesar pendientes.
 */
const updateActiveFixedTermValues = async (isStartupCatchUp = false) => {
  console.log(`[InvestmentUpdateService] Iniciando actualización de Plazos Fijos (Catch-up: ${isStartupCatchUp})...`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); 
  const todayDateString = today.toISOString().split('T')[0];

  try {
    // Para el catch-up o ejecución normal, la lógica es la misma: actualizar hasta 'today'.
    // Se buscan plazos fijos cuyo período de vigencia incluya 'today' o que hayan terminado pero
    // su 'currentValue' podría no estar reflejando el valor final.
    const fixedTermsToReview = await Investment.findAll({
      where: {
        type: 'plazo_fijo',
        startDate: { [Op.lte]: todayDateString }, 
      }
    });

    if (fixedTermsToReview.length === 0) {
      console.log('[InvestmentUpdateService] No hay Plazos Fijos para revisar/actualizar.');
      return { updatedCount: 0, errors: 0 };
    }

    console.log(`[InvestmentUpdateService] Se encontraron ${fixedTermsToReview.length} Plazos Fijos para revisar.`);
    let updatedCount = 0;
    let errorCount = 0;

    for (const ft of fixedTermsToReview) {
      try {
        const principal = parseFloat(ft.initialInvestment) || parseFloat(ft.amountInvested) || 0;
        const tna = parseFloat(ft.interestRate);
        const startDate = new Date(ft.startDate + 'T00:00:00Z'); 
        const endDate = ft.endDate ? new Date(ft.endDate + 'T00:00:00Z') : null;

        if (principal <= 0 || isNaN(tna) || tna <= 0) {
          console.log(`[InvestmentUpdateService] Saltando Plazo Fijo ID ${ft.id} ("${ft.name}"): principal (${principal}) o TNA (${tna}) inválidos.`);
          continue;
        }

        let calculationUpToDate = new Date(today.getTime()); 
        if (endDate && endDate < today) {
          calculationUpToDate = new Date(endDate.getTime()); 
        }
        
        if (startDate > calculationUpToDate) {
          if (ft.currentValue !== null && Math.abs(parseFloat(ft.currentValue) - principal) >= 0.01) {
              console.log(`[InvestmentUpdateService] Plazo Fijo ID ${ft.id} ("${ft.name}") aún no ha comenzado. Ajustando currentValue a principal.`);
              await ft.update({ currentValue: principal.toFixed(2) });
              updatedCount++;
          }
          continue;
        }
        
        // Si el PF ya terminó (endDate < today) y su currentValue ya refleja el valor final, no hacer nada más.
        // Esto previene recálculos innecesarios para PFs ya maduros y correctamente actualizados.
        if (endDate && endDate < today) {
            const finalTermTimeDifference = endDate.getTime() - startDate.getTime();
            let finalTermDaysElapsed = 0;
            if (finalTermTimeDifference >= 0) {
                finalTermDaysElapsed = Math.floor(finalTermTimeDifference / (1000 * 3600 * 24)) + 1;
            }
            const dailyRateFinal = (tna / 100) / 365;
            const finalAccruedInterest = principal * dailyRateFinal * finalTermDaysElapsed;
            const finalValueExpected = principal + finalAccruedInterest;

            if (Math.abs(parseFloat(ft.currentValue) - finalValueExpected) < 0.01) {
                // console.log(`[InvestmentUpdateService] Plazo Fijo VENCIDO ID ${ft.id} ("${ft.name}") ya tiene valor final correcto. Saltando.`);
                continue;
            } else {
                 console.log(`[InvestmentUpdateService] Corrigiendo valor final para Plazo Fijo VENCIDO ID ${ft.id} ("${ft.name}"): `+
                             `Valor actual DB=${ft.currentValue}, Debería ser=${finalValueExpected.toFixed(2)}`);
                 await ft.update({ currentValue: finalValueExpected.toFixed(2) });
                 updatedCount++;
                 continue; 
            }
        }

        const timeDifference = calculationUpToDate.getTime() - startDate.getTime();
        let daysElapsed = 0;
        if (timeDifference >= 0) {
           daysElapsed = Math.floor(timeDifference / (1000 * 3600 * 24)) + 1;
        }

        if (daysElapsed <= 0) {
          if (ft.currentValue !== null && Math.abs(parseFloat(ft.currentValue) - principal) >= 0.01) {
              await ft.update({ currentValue: principal.toFixed(2) });
              updatedCount++;
          }
          continue;
        }

        const dailyRate = (tna / 100) / 365;
        const accruedInterest = principal * dailyRate * daysElapsed;
        const newCurrentValue = principal + accruedInterest;

        if (ft.currentValue === null || Math.abs(parseFloat(ft.currentValue) - newCurrentValue) >= 0.01) {
          console.log(`[InvestmentUpdateService] Actualizando Plazo Fijo ID ${ft.id} ("${ft.name}"): ` +
                      `Principal=${principal.toFixed(2)}, TNA=${tna}%, Días Calc=${daysElapsed}, ` +
                      `Interés Devengado=${accruedInterest.toFixed(2)}, ` +
                      `Viejo ValorActual=${ft.currentValue}, Nuevo ValorActual=${newCurrentValue.toFixed(2)}`);
          await ft.update({ currentValue: newCurrentValue.toFixed(2) });
          updatedCount++;
        }
      } catch (errorForSingleFt) {
        errorCount++;
        console.error(`[InvestmentUpdateService] Error actualizando Plazo Fijo ID ${ft.id} ("${ft.name}"):`, errorForSingleFt.message);
      }
    }
    console.log(`[InvestmentUpdateService] Actualización de Plazos Fijos completada. ${updatedCount} registros actualizados, ${errorCount} errores.`);
    return { updatedCount, errors: errorCount };

  } catch (error) {
    console.error('[InvestmentUpdateService] Error general actualizando valores de Plazos Fijos:', error);
    return { updatedCount: 0, errors: 1, generalError: error.message };
  }
};

module.exports = {
  updateActiveFixedTermValues,
};