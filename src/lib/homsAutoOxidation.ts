/**
 * Mecanismo de Auto-Oxidación y Formación de HOMs / Partículas Ultrafinas (PM0.1 / ELVOC)
 * Referencia: Atmospheric Chemistry and Physics (ACP) / Science (2025/2026)
 * Cadena de auto-oxidación:
 *   RO2* + O2 -> (HOM-RO2)* -> ELVOC / UFP (Nucleación en condensación espontánea)
 */

export interface HomsAutoOxidationParams {
  alphaPinenePpb: number;
  ozonePpb: number;
  temperatureC: number;
  relHumidityPct: number;
  sunlightRadWm2: number;
}

export interface HomsAutoOxidationResults {
  homsProductionRateMolecCm3S: number;
  elvocConcentrationUgm3: number;
  nucleationRateJ1Cm3S: number;
  pm01UltrafineUgm3: number;
  oxidationRegime: 'Breeze-Monte Dominant' | 'Urban-Anthropogenic Mixed' | 'Coastal Marine Quenched';
  condensationSinkS1: number;
}

export function computeHomsAndUltrafines(
  params: HomsAutoOxidationParams
): HomsAutoOxidationResults {
  const { alphaPinenePpb, ozonePpb, temperatureC, relHumidityPct, sunlightRadWm2 } = params;

  // Rate constant k_O3+pinene (Arrhenius equation)
  const tempK = temperatureC + 273.15;
  const kO3Pinene = 8.05e-16 * Math.exp(-640 / tempK); // cm^3 molec^-1 s^-1

  // Concentrations in molec/cm^3 (ideal gas approximation: 1 ppb ~ 2.46e10 molec/cm3 at 298K)
  const airDensity = (2.46e10 * 298.15) / tempK;
  const pineneMolec = alphaPinenePpb * airDensity;
  const o3Molec = ozonePpb * airDensity;

  // Primary RO2 production rate
  const ro2ProdRate = kO3Pinene * pineneMolec * o3Molec;

  // Auto-oxidation branching ratio (depends on temperature and sunlight)
  const autoOxidationYield = Math.min(0.12, 0.045 * (1 + (temperatureC - 20) * 0.02) * (1 + sunlightRadWm2 / 800));
  const homsProductionRateMolecCm3S = parseFloat((ro2ProdRate * autoOxidationYield).toFixed(2));

  // Extremely Low Volatility Organic Compounds (ELVOC) concentration in ug/m^3
  const condensationSinkS1 = 0.008 + (relHumidityPct / 100) * 0.004;
  const elvocMolecCm3 = (homsProductionRateMolecCm3S * 0.7) / Math.max(1e-4, condensationSinkS1);
  const elvocConcentrationUgm3 = parseFloat(((elvocMolecCm3 * 350) / 6.022e17 * 1e6).toFixed(3));

  // Nucleation rate of ultrafine particles J1 (cm^-3 s^-1) ~ k_nuc * [ELVOC]^2
  const nucleationRateJ1Cm3S = parseFloat((0.00085 * Math.pow(Math.max(0.1, elvocConcentrationUgm3), 1.8)).toFixed(3));

  // Ultrafine particle mass PM0.1 in ug/m^3
  const pm01UltrafineUgm3 = parseFloat((elvocConcentrationUgm3 * 0.85 + nucleationRateJ1Cm3S * 0.04).toFixed(3));

  let oxidationRegime: 'Breeze-Monte Dominant' | 'Urban-Anthropogenic Mixed' | 'Coastal Marine Quenched' = 'Urban-Anthropogenic Mixed';
  if (alphaPinenePpb > 1.2 && ozonePpb > 40) {
    oxidationRegime = 'Breeze-Monte Dominant';
  } else if (relHumidityPct > 80 && temperatureC < 18) {
    oxidationRegime = 'Coastal Marine Quenched';
  }

  return {
    homsProductionRateMolecCm3S,
    elvocConcentrationUgm3,
    nucleationRateJ1Cm3S,
    pm01UltrafineUgm3,
    oxidationRegime,
    condensationSinkS1: parseFloat(condensationSinkS1.toFixed(4))
  };
}
