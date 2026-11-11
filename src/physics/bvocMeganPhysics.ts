/**
 * Motor de Fotoquímica de Dosel Arbóreo, Emisión MEGAN 2.1 y Fotólisis J_NO2 (Tesis Doctoral).
 * Modela la interacción entre la atenuación de radiación actínica por la copa (Sky View Factor / LAI),
 * la constante de fotólisis de NO2 (J_NO2), la emisión biogénica de isopreno/monoterpenos MEGAN 2.1
 * y el Potencial de Creación de Ozono Troposférico (POCP / MIR Carter).
 * 
 * Cumple con la regla de CERO DATOS ALEATORIOS (Physics-Informed Digital Twin).
 */

import { MALAGA_SPECIES_CATALOG, TreeSpeciesAntiPollutionProfile } from '../lib/malagaTreesInventory';

export interface PhotochemicalCanopyInput {
  speciesId: string;
  lai: number; // Índice de Área Foliar
  crownPorosity: number; // Porosidad de copa (0 a 1)
  solarZenithAngleDeg: number; // Ángulo cenital solar
  surfaceSolarRadWm2: number; // Irradiancia global incidente (W/m²)
  ambientTempC: number;
  ambientNo2Ugm3: number;
  ambientO3Ugm3: number;
  treeCountInAlignment: number;
  canopyAreaM2PerTree: number;
}

export interface PhotochemicalCanopyResult {
  species: TreeSpeciesAntiPollutionProfile;
  // Flujo Actínico UV y Constante de Fotólisis J_NO2
  unshadedActinicFluxWm2: number;
  underCanopyActinicFluxWm2: number;
  unshadedJNo2PerSec: number; // J_NO2 fuera de la sombra (1/s)
  underCanopyJNo2PerSec: number; // J_NO2 atenuado bajo la copa (1/s)
  jNo2AttenuationPct: number; // Porcentaje de atenuación de J_NO2

  // Emisiones Biogénicas MEGAN 2.1
  isopreneEmissionGramsDay: number;
  monoterpenesEmissionGramsDay: number;
  totalBvocGramsDay: number;

  // Reacción Fotoquímica de Leighton y Producción de Ozono
  photochemicalO3ProductionGramsDay: number; // O3 generado por fotoquímica de COVs
  netO3BalanceGramsDay: number; // (O3 absorbido por estomas) - (O3 producido biogénicamente)
  netNo2RetentionUgm3: number; // Retención de NO2 en acera por inhibición de fotólisis

  doctoralEvaluation: string;
}

/**
 * Calcula la física determinista de atenuación de J_NO2 y fotoquímica de MEGAN bajo el dosel.
 */
export function calculatePhotochemicalCanopyPhysics(
  input: PhotochemicalCanopyInput
): PhotochemicalCanopyResult {
  const species = MALAGA_SPECIES_CATALOG.find(s => s.id === input.speciesId) || MALAGA_SPECIES_CATALOG[0];

  // 1. Atenuación de Radiación Actínica UV bajo el Dosel (Beer-Lambert Modificado)
  // I_under = I_top * [porosity + (1 - porosity) * exp(-k_ext * LAI)]
  const kExtinction = 0.55; // Coeficiente de extinción foliar
  const transmittance = input.crownPorosity + (1.0 - input.crownPorosity) * Math.exp(-kExtinction * input.lai);
  
  const unshadedActinicFlux = Math.max(10, input.surfaceSolarRadWm2 * 0.05); // Fracción UV de radiación global (~5%)
  const underCanopyActinicFlux = unshadedActinicFlux * transmittance;

  // 2. Constante de Fotólisis de NO2: J_NO2 = 1.45e-2 * (I_UV / 30.0) ^ 0.9 (1/s)
  const unshadedJNo2 = 1.45e-2 * Math.pow(Math.min(1.2, unshadedActinicFlux / 30.0), 0.9);
  const underCanopyJNo2 = unshadedJNo2 * transmittance;
  const jNo2AttenuationPct = parseFloat(((1.0 - transmittance) * 100).toFixed(1));

  // 3. Emisiones Biogénicas MEGAN 2.1 (Guenther et al. 2012)
  const tempK = input.ambientTempC + 273.15;
  const gammaTIsoprene = Math.exp(0.09 * (input.ambientTempC - 30.0));
  const gammaTMonoterpene = Math.exp(0.09 * (input.ambientTempC - 30.0));

  const totalCanopyAreaM2 = input.treeCountInAlignment * input.canopyAreaM2PerTree;
  
  // Emisión foliar en g/día (14 horas de sol)
  const isopreneGramsDay = (species.bvocIsopreneRate * gammaTIsoprene * totalCanopyAreaM2 * input.lai * 14.0) / 1000.0;
  const monoterpenesGramsDay = (species.bvocTerpeneRate * gammaTMonoterpene * totalCanopyAreaM2 * input.lai * 24.0) / 1000.0;
  const totalBvocGramsDay = isopreneGramsDay + monoterpenesGramsDay;

  // 4. Potencial de Formación de Ozono (MIR Carter: 10.6 g O3/g isopreno, 4.3 g O3/g monoterpeno)
  const ofpO3GramsDay = (isopreneGramsDay * 10.6) + (monoterpenesGramsDay * 4.3);

  // Absorción estomática directa de O3 y NO2 (Wesely)
  const o3AbsorbedGramsDay = (species.vdO3 / 100) * (input.ambientO3Ugm3 / 1e6) * (totalCanopyAreaM2 * input.lai) * (14.0 * 3600);
  const netO3BalanceGramsDay = parseFloat((o3AbsorbedGramsDay - ofpO3GramsDay * 0.15).toFixed(2));

  // Retención extra de NO2 por menor fotólisis J_NO2
  const netNo2RetentionUgm3 = parseFloat((input.ambientNo2Ugm3 * (1.0 - underCanopyJNo2 / Math.max(1e-4, unshadedJNo2)) * 0.12).toFixed(2));

  let evaluation = '';
  if (jNo2AttenuationPct > 60.0 && species.bvocIsopreneRate > 15.0) {
    evaluation = `Atención: ${species.commonName} atenúa un ${jNo2AttenuationPct}% de la radiación UV fotolítica, ralentizando la destrucción de NO2 y acumulando un estancamiento adicional de +${netNo2RetentionUgm3} µg/m³ de NO2 en acera. Sus emisiones de isopreno (${isopreneGramsDay.toFixed(1)} g/día) elevan el potencial de ozono estival.`;
  } else if (species.bvocIsopreneRate < 2.0) {
    evaluation = `${species.commonName}: Excelente comportamiento fotoquímico. Emisión biogénica mínima y balance neto purificador de O3 de +${netO3BalanceGramsDay} g/día.`;
  } else {
    evaluation = `${species.commonName}: Balance fotoquímico moderado con atenuación de J_NO2 del ${jNo2AttenuationPct}% e integración armónica en la masa de aire urbana.`;
  }

  return {
    species,
    unshadedActinicFluxWm2: parseFloat(unshadedActinicFlux.toFixed(2)),
    underCanopyActinicFluxWm2: parseFloat(underCanopyActinicFlux.toFixed(2)),
    unshadedJNo2PerSec: parseFloat(unshadedJNo2.toFixed(5)),
    underCanopyJNo2PerSec: parseFloat(underCanopyJNo2.toFixed(5)),
    jNo2AttenuationPct,
    isopreneEmissionGramsDay: parseFloat(isopreneGramsDay.toFixed(2)),
    monoterpenesEmissionGramsDay: parseFloat(monoterpenesGramsDay.toFixed(2)),
    totalBvocGramsDay: parseFloat(totalBvocGramsDay.toFixed(2)),
    photochemicalO3ProductionGramsDay: parseFloat(ofpO3GramsDay.toFixed(2)),
    netO3BalanceGramsDay,
    netNo2RetentionUgm3,
    doctoralEvaluation: evaluation
  };
}
