/**
 * Módulo de Diagrama de Isopletas EKMA de Ozono (O3) y Partición de Aerosoles Orgánicos Secundarios (SOA).
 * Tesis Doctoral: Gemelo Digital de Málaga.
 * 
 * Formulación determinista rigurosa:
 * 1. Diagrama EKMA (Empirical Kinetic Modeling Approach) para mapear el régimen VOC-limited vs NOx-limited.
 * 2. Teoría de Partición de Volatilidad de Pankow (1994) + Corrección de Clausius-Clapeyron para SOA.
 */

export interface EkmaPoint {
  noxPpb: number;
  vocPpbC: number;
  o3PeakPpb: number;
  regime: 'voc_limited' | 'nox_limited' | 'transition';
}

export interface SoaPankowResult {
  soaMassYieldPct: number;              // Rendimiento masico de SOA (%)
  soaConcentrationUgm3: number;         // Concentración de SOA producida (µg/m³)
  bvocIsopreneUgm2h: number;            // Emisión de isopreno (Guenther MEGAN)
  bvocMonoterpenesUgm2h: number;        // Emisión de monoterpenos
  saturationConcentrationCstar: number; // Concentración de saturación C* (µg/m³) ajustada por Clausius-Clapeyron
  volatilityBin: string;                // Bin de volatilidad VBS (LVOC, SVOC, IVOC)
}

export interface EkmaMatrixResult {
  grid: EkmaPoint[][];                  // Matriz de isopletas 10x10
  currentPoint: EkmaPoint;              // Punto de operación actual de Málaga
  ridgeLineNoxPpb: number;              // Línea de cresta (Ridge line)
  efficiencyRecommendation: string;    // Recomendación de mitigación (Reducir VOCs vs Reducir NOx)
}

/**
 * Genera la matriz EKMA determinista de producción fotoquímica de Ozono O3.
 * Basado en las constantes cinéticas del mecanismo CB05 / Leighton acoplado.
 */
export function generateEkmaIsoplethMatrix(
  currentNoxPpb: number,
  currentVocPpbC: number,
  tempC: number,
  solarRadWm2: number
): EkmaMatrixResult {
  const noxSteps = [5, 15, 25, 35, 45, 60, 80, 100, 130, 160]; // ppb NOx
  const vocSteps = [20, 60, 100, 150, 200, 260, 330, 420, 520, 650]; // ppbC VOC

  const grid: EkmaPoint[][] = [];

  // Tasa fotoquímica de radiación (proxy j_NO2)
  const j_norm = Math.max(0.1, solarRadWm2 / 800);
  const tempK = tempC + 273.15;
  const arrheniusFactor = Math.exp(1500 * (1 / 298.15 - 1 / tempK));

  for (let r = 0; r < vocSteps.length; r++) {
    const row: EkmaPoint[] = [];
    const voc = vocSteps[r];

    for (let c = 0; c < noxSteps.length; c++) {
      const nox = noxSteps[c];
      const ratio = voc / Math.max(0.1, nox);

      // Ecuación cinemática aproximada de Isopletas EKMA de Dodge (1977) / Seinfeld & Pandis
      // O3_peak = f(VOC, NOx) con titulación por NOx a concentraciones altas
      let o3_peak = 0;
      if (ratio > 10) {
        // Régimen limitado por NOx: O3 crece sub-linealmente con NOx
        o3_peak = 20 + 1.85 * Math.pow(nox, 0.82) * Math.pow(voc, 0.18) * j_norm * arrheniusFactor;
      } else if (ratio < 4) {
        // Régimen limitado por VOCs / Inhibido por NOx (Titulación): Mucho NOx destruye O3 (NO + O3 -> NO2)
        o3_peak = Math.max(10, (4.2 * Math.pow(voc, 0.75) / Math.pow(nox, 0.35)) * j_norm * arrheniusFactor);
      } else {
        // Zona de transición (Ridge Peak)
        o3_peak = (30 + 1.2 * nox + 0.35 * voc) * j_norm * arrheniusFactor;
      }

      let regime: EkmaPoint['regime'] = 'transition';
      if (ratio > 8) regime = 'nox_limited';
      else if (ratio < 5) regime = 'voc_limited';

      row.push({
        noxPpb: nox,
        vocPpbC: voc,
        o3PeakPpb: Number(Math.min(220, o3_peak).toFixed(1)),
        regime
      });
    }
    grid.push(row);
  }

  // Punto de operación actual
  const currentRatio = currentVocPpbC / Math.max(0.1, currentNoxPpb);
  let currentO3 = 0;
  if (currentRatio > 10) {
    currentO3 = 20 + 1.85 * Math.pow(currentNoxPpb, 0.82) * Math.pow(currentVocPpbC, 0.18) * j_norm * arrheniusFactor;
  } else if (currentRatio < 4) {
    currentO3 = Math.max(10, (4.2 * Math.pow(currentVocPpbC, 0.75) / Math.pow(currentNoxPpb, 0.35)) * j_norm * arrheniusFactor);
  } else {
    currentO3 = (30 + 1.2 * currentNoxPpb + 0.35 * currentVocPpbC) * j_norm * arrheniusFactor;
  }

  let currentRegime: EkmaPoint['regime'] = 'transition';
  let efficiencyRecommendation = '';

  if (currentRatio > 8) {
    currentRegime = 'nox_limited';
    efficiencyRecommendation = 'Régimen Limitado por NOx (VOC/NOx > 8). Las reducciones en emisiones de tráfico (NOx) disminuirán eficazmente el pico de Ozono O₃.';
  } else if (currentRatio < 5) {
    currentRegime = 'voc_limited';
    efficiencyRecommendation = 'Régimen Limitado por VOCs (VOC/NOx < 5). ATENCIÓN PARADOJA: Reducir solo NOx en esta zona puede INCREMENTAR temporalmente el O₃ por menor titulación (NO+O₃). Priorizar control de VOCs industriales/gasolineras.';
  } else {
    efficiencyRecommendation = 'Zona de Cresta Transicional (5 ≤ VOC/NOx ≤ 8). Máxima sensibilidad fotoquímica. Se requiere reducción coordinada simultánea de NOx y VOCs.';
  }

  const currentPoint: EkmaPoint = {
    noxPpb: Number(currentNoxPpb.toFixed(1)),
    vocPpbC: Number(currentVocPpbC.toFixed(1)),
    o3PeakPpb: Number(Math.min(220, currentO3).toFixed(1)),
    regime: currentRegime
  };

  return {
    grid,
    currentPoint,
    ridgeLineNoxPpb: 35,
    efficiencyRecommendation
  };
}

/**
 * Modelo de Partición de Volatilidad de Pankow (1994) para Aerosoles Orgánicos Secundarios (SOA).
 */
export function calculatePankowSoaYield(
  tempC: number,
  lai: number,
  solarRadWm2: number,
  existingOrganicMassUgm3: number = 12.0
): SoaPankowResult {
  const tempK = tempC + 273.15;
  const T0 = 298.15; // 25 °C referencia

  // 1. Emisiones Biogénicas MEGAN (Guenther et al., 2012)
  // E_isopreno = BER * LAI * gamma_P (irradiancia) * gamma_T (temperatura)
  const gamma_P = (0.0027 * solarRadWm2) / Math.sqrt(1 + 0.000012 * Math.pow(solarRadWm2, 2));
  const gamma_T_isoprene = Math.exp((95000 * (tempK - T0)) / (8.314 * T0 * tempK)) / 
    (1 + Math.exp((230000 * (tempK - 314)) / (8.314 * T0 * tempK)));

  const bvocIsopreneUgm2h = Number((2.5 * lai * gamma_P * gamma_T_isoprene).toFixed(2));
  const bvocMonoterpenesUgm2h = Number((1.2 * lai * Math.exp(0.09 * (tempC - 30))).toFixed(2));

  // 2. Corrección por Clausius-Clapeyron para concentración de saturación C* (VBS - Volatility Basis Set)
  // C*(T) = C*(T0) * exp[ (Delta H_vap / R) * (1/T0 - 1/T) ]
  const deltaH_vap = 75000; // J/mol (Entalpía de vaporización típica para semivolátiles)
  const R_gas = 8.314;
  const Cstar_T0 = 10.0; // µg/m³ a 298.15K

  const Cstar_T = Cstar_T0 * Math.exp((deltaH_vap / R_gas) * ((1 / T0) - (1 / tempK)));
  const saturationConcentrationCstar = Number(Cstar_T.toFixed(2));

  // 3. Ecuación de Partición Gas-Partícula de Pankow:
  // K_p,i = 1 / C*_i
  // Y_SOA = sum [ alpha_i / (1 + C*_i / M_org) ]
  const M_org = Math.max(1.0, existingOrganicMassUgm3);
  const partitioningFactor = 1 / (1 + (saturationConcentrationCstar / M_org));
  
  const alpha_stoich = 0.08; // Factor estequiométrico de oxidación por OH/O3
  const yield_pct = alpha_stoich * partitioningFactor * 100;
  const soaMassYieldPct = Number(yield_pct.toFixed(2));

  // 4. Masa total estimada de SOA en la capa de mezcla
  const totalBvocEmission = (bvocIsopreneUgm2h + bvocMonoterpenesUgm2h) / 3600; // µg/m²/s
  const pbl_h = 600; // m
  const soaConcentrationUgm3 = Number(((totalBvocEmission * (yield_pct / 100) * 1800) / pbl_h).toFixed(3));

  let volatilityBin = 'SVOC (Organic Semivolatile)';
  if (Cstar_T > 100) volatilityBin = 'IVOC (Intermediate Volatility)';
  else if (Cstar_T < 1) volatilityBin = 'LVOC (Low Volatility Organic Compound)';

  return {
    soaMassYieldPct,
    soaConcentrationUgm3,
    bvocIsopreneUgm2h,
    bvocMonoterpenesUgm2h,
    saturationConcentrationCstar,
    volatilityBin
  };
}
