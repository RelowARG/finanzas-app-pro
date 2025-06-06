// Ruta: finanzas-app-pro/backend/services/investmentUpdate.service.js
const db = require('../models');
const Investment = db.Investment;
const { Op } = require('sequelize');

/**
 * Actualiza el currentValue de los Plazos Fijos y FCI con TNA activos, y procesa las renovaciones de Plazos Fijos vencidos.
 * @param {boolean} isStartupCatchUp - Indica si se está ejecutando al inicio para procesar pendientes.
 */
const updateActiveFixedTermValues = async (isStartupCatchUp = false) => {
  console.log(`[InvestmentUpdateService] Iniciando actualización de Plazos Fijos y FCI con TNA (Catch-up: ${isStartupCatchUp})...`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); 
  const todayDateString = today.toISOString().split('T')[0];

  try {
    const investmentsToReview = await Investment.findAll({
      where: {
        [Op.or]: [
          // Opción 1: Inversiones activas con TNA para actualizar valor diario
          {
            type: { [Op.in]: ['plazo_fijo', 'fci'] },
            interestRate: { [Op.ne]: null, [Op.gt]: 0 },
            startDate: { [Op.lte]: todayDateString },
            endDate: { [Op.gte]: todayDateString } 
          },
          // Opción 2: Plazos Fijos vencidos con renovación automática pendiente
          {
            type: 'plazo_fijo',
            autoRenew: true,
            endDate: { [Op.lt]: todayDateString }
          }
        ]
      }
    });

    if (investmentsToReview.length === 0) {
      console.log('[InvestmentUpdateService] No hay Plazos Fijos o FCI con TNA para revisar/actualizar.');
      return { updatedCount: 0, errors: 0 };
    }

    console.log(`[InvestmentUpdateService] Se encontraron ${investmentsToReview.length} Plazos Fijos o FCI para revisar.`);
    let updatedCount = 0;
    let errorCount = 0;

    for (const inv of investmentsToReview) {
      try {
        const principal = parseFloat(inv.initialInvestment) || parseFloat(inv.amountInvested) || 0;
        const tna = parseFloat(inv.interestRate);
        const startDate = new Date(inv.startDate + 'T00:00:00Z'); 
        const endDate = inv.endDate ? new Date(inv.endDate + 'T00:00:00Z') : null;

        if (principal <= 0 || isNaN(tna) || tna <= 0) {
          console.log(`[InvestmentUpdateService] Saltando Inversión ID ${inv.id} ("${inv.name}"): principal (${principal}) o TNA (${tna}) inválidos.`);
          continue;
        }

        // ---- LÓGICA DE RENOVACIÓN PARA PLAZOS FIJOS VENCIDOS ----
        if (inv.type === 'plazo_fijo' && endDate && today > endDate && inv.autoRenew) {
          console.log(`[InvestmentUpdateService] Procesando renovación para Plazo Fijo ID ${inv.id} ("${inv.name}").`);
          
          const termTimeDifference = endDate.getTime() - startDate.getTime();
          const termDays = Math.round(termTimeDifference / (1000 * 60 * 60 * 24));

          const dailyRate = (tna / 100) / 365;
          const totalInterest = principal * dailyRate * (termDays + 1);
          const finalValue = principal + totalInterest;

          const newPrincipal = inv.renewWithInterest ? finalValue : principal;
          const newStartDate = new Date(endDate);
          newStartDate.setUTCDate(newStartDate.getUTCDate() + 1);
          const newEndDate = new Date(newStartDate);
          newEndDate.setUTCDate(newStartDate.getUTCDate() + termDays);

          await Investment.create({
            name: `${inv.name} (Renovación)`,
            type: 'plazo_fijo',
            entity: inv.entity,
            currency: inv.currency,
            initialInvestment: newPrincipal,
            currentValue: newPrincipal,
            startDate: newStartDate.toISOString().split('T')[0],
            endDate: newEndDate.toISOString().split('T')[0],
            interestRate: inv.interestRate,
            autoRenew: inv.autoRenew,
            renewWithInterest: inv.renewWithInterest,
            icon: inv.icon,
            notes: `Renovación automática del Plazo Fijo ID: ${inv.id}.`,
            userId: inv.userId,
          });

          await inv.update({ autoRenew: false, currentValue: finalValue.toFixed(2) });
          updatedCount++;
          console.log(`[InvestmentUpdateService] Plazo Fijo ID ${inv.id} renovado. Nuevo PF creado.`);
          continue; // Saltar al siguiente item
        }

        // ---- LÓGICA DE ACTUALIZACIÓN DIARIA (para activos no vencidos) ----
        let calculationUpToDate = new Date(today.getTime()); 
        if (endDate && endDate < today) {
          calculationUpToDate = new Date(endDate.getTime()); 
        }
        
        const timeDifference = calculationUpToDate.getTime() - startDate.getTime();
        let daysElapsed = (timeDifference >= 0) ? Math.floor(timeDifference / (1000 * 3600 * 24)) + 1 : 0;

        const dailyRate = (tna / 100) / 365;
        const accruedInterest = principal * dailyRate * daysElapsed;
        const newCurrentValue = principal + accruedInterest;

        if (inv.currentValue === null || Math.abs(parseFloat(inv.currentValue) - newCurrentValue) >= 0.01) {
          console.log(`[InvestmentUpdateService] Actualizando Inversión ID ${inv.id} ("${inv.name}"): ValorActual=${newCurrentValue.toFixed(2)}`);
          await inv.update({ currentValue: newCurrentValue.toFixed(2) });
          updatedCount++;
        }
      } catch (errorForSingleItem) {
        errorCount++;
        console.error(`[InvestmentUpdateService] Error actualizando Inversión ID ${inv.id} ("${inv.name}"):`, errorForSingleItem.message);
      }
    }
    console.log(`[InvestmentUpdateService] Actualización de Inversiones con TNA completada. ${updatedCount} registros actualizados, ${errorCount} errores.`);
    return { updatedCount, errors: errorCount };

  } catch (error) {
    console.error('[InvestmentUpdateService] Error general actualizando valores de inversiones con TNA:', error);
    return { updatedCount: 0, errors: 1, generalError: error.message };
  }
};

module.exports = {
  updateActiveFixedTermValues,
};