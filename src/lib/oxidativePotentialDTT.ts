/**
 * Potencial Oxidativo del Particulado Peatonal (OP^DTT y OP^AA - Toxicidad Redox)
 * Referencia: Environmental Health Perspectives (EHP) / ES&T (2025/2026)
 * Ecuación toxicológica:
 *   OP^DTT = alpha * [Cu] + beta * [Fe] + gamma * [OC_primario] + delta * [Quinonas]  [nmol DTT / (min * m^3)]
 */

export interface OxidativePotentialParams {
  pm25ConcentrationUgm3: number;
  brakeWearCuNgM3: number; // Cobre de pastillas de freno en ng/m^3 (ZBE / rotondas)
  exhaustFeNgM3: number; // Hierro de combustión/desgaste en ng/m^3
  organicCarbonUgm3: number; // Carbono orgánico primario en ug/m^3
  distanceToIntersectionM: number;
}

export interface OxidativePotentialResults {
  opDttVolumeNormNmolMinM3: number; // Actividad redox por m^3 de aire inhalado
  opDttMassNormPmolMinUg: number; // Toxicidad intrínseca por microgramo de PM2.5
  opAaAscorbicAcidNormNmolMinM3: number; // Potencial por ensayo de Ácido Ascórbico
  cellOxidativeStressRisk: 'Bajo (Rural/Parque)' | 'Moderado (Residencial)' | 'Alto (Eje Viario ZBE)' | 'Crítico (Rotonda/Frenado Intenso)';
  mainContributorSource: 'Desgaste de Frenos (Cu/Fe)' | 'Combustión Diesel (OC/HAP)' | 'Fondo Regional Secundario';
  cellularRosRatio: number; // Ratio de especies reactivas de oxígeno vs nivel basal
}

export function computeOxidativePotential(
  params: OxidativePotentialParams
): OxidativePotentialResults {
  const { pm25ConcentrationUgm3, brakeWearCuNgM3, exhaustFeNgM3, organicCarbonUgm3, distanceToIntersectionM } = params;

  // Intersection braking proximity factor (close to crosswalks & traffic lights)
  const proximityBoost = Math.max(1.0, 1.8 - (distanceToIntersectionM / 100));

  // Sensitivities derived from multivariate toxicological regressions:
  // OP_DTT = 0.042 * [Cu_ng] + 0.0085 * [Fe_ng] + 0.28 * [OC_ug]
  const effectiveCu = brakeWearCuNgM3 * proximityBoost;
  const effectiveFe = exhaustFeNgM3 * proximityBoost;
  const effectiveOC = organicCarbonUgm3;

  const opDttVolume = 0.042 * effectiveCu + 0.0085 * effectiveFe + 0.28 * effectiveOC;
  const opDttVolumeNormNmolMinM3 = parseFloat(opDttVolume.toFixed(2));

  // Mass-normalized intrinsic OP (pmol DTT / min / ug PM2.5)
  const opDttMass = (opDttVolume * 1000) / Math.max(1.0, pm25ConcentrationUgm3);
  const opDttMassNormPmolMinUg = parseFloat(opDttMass.toFixed(1));

  // Ascorbic Acid depletion (OP^AA is predominantly sensitive to transition metals Cu and Fe)
  const opAaVolume = 0.065 * effectiveCu + 0.012 * effectiveFe + 0.05 * effectiveOC;
  const opAaAscorbicAcidNormNmolMinM3 = parseFloat(opAaVolume.toFixed(2));

  // Cellular ROS generation multiplier
  const cellularRosRatio = parseFloat((1.0 + (opDttVolume / 1.5)).toFixed(2));

  // Determine risk category and main contributor
  let cellOxidativeStressRisk: 'Bajo (Rural/Parque)' | 'Moderado (Residencial)' | 'Alto (Eje Viario ZBE)' | 'Crítico (Rotonda/Frenado Intenso)' = 'Moderado (Residencial)';
  if (opDttVolume > 4.5) {
    cellOxidativeStressRisk = 'Crítico (Rotonda/Frenado Intenso)';
  } else if (opDttVolume > 2.5) {
    cellOxidativeStressRisk = 'Alto (Eje Viario ZBE)';
  } else if (opDttVolume < 1.0) {
    cellOxidativeStressRisk = 'Bajo (Rural/Parque)';
  }

  const cuShare = 0.042 * effectiveCu;
  const ocShare = 0.28 * effectiveOC;
  const mainContributorSource = cuShare > ocShare ? 'Desgaste de Frenos (Cu/Fe)' : 'Combustión Diesel (OC/HAP)';

  return {
    opDttVolumeNormNmolMinM3,
    opDttMassNormPmolMinUg,
    opAaAscorbicAcidNormNmolMinM3,
    cellOxidativeStressRisk,
    mainContributorSource,
    cellularRosRatio
  };
}
