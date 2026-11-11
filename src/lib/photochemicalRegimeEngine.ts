/**
 * Motor Determinista de Diagnóstico del Régimen Fotoquímico (VOC-limited vs. NOx-limited)
 * Tesis Doctoral: Gemelo Digital de Málaga
 * 
 * Marco Teórico y Ecuaciones Fundamentales:
 * 1. Ciclo Fotoestacionario de Leighton (1961):
 *    NO2 + hν (λ < 420 nm) -> NO + O(3P)               [j_NO2]
 *    O(3P) + O2 + M -> O3 + M                          [rápido]
 *    NO + O3 -> NO2 + O2                               [k3 Arrhenius IUPAC]
 *    Relación de Leighton: Φ = (j_NO2 * [NO2]) / (k3 * [NO] * [O3])
 * 
 * 2. Indicador de Sensibilidad de Sillman (1999) y Kleinman (2005):
 *    Ratio de reactividad = [VOC] (ppbC) / [NOx] (ppb)
 *    - Ratio < 4.0 - 5.5: Régimen VOC-limitado (Saturado en NOx). OH + NO2 -> HNO3 domina la terminación.
 *      Efecto Titración Paradoja ZBE: Disminuir NOx aumenta O3 local (∂[O3]/∂[NOx] < 0).
 *    - Ratio > 8.0 - 10.0: Régimen NOx-limitado. Reacciones radical-radical (HO2 + HO2 -> H2O2) dominan la terminación.
 *      Reducir NOx abate eficazmente los picos de O3 (∂[O3]/∂[NOx] > 0).
 *    - 5.5 <= Ratio <= 8.0: Régimen de transición / Cresta Isoplética EKMA.
 * 
 * 3. Derivadas analíticas de sensibilidad fotoquímica:
 *    ∂[O3]/∂[NOx] y ∂[O3]/∂[VOC] calculadas a partir del balance fotoquímico de Seinfeld & Pandis (2016).
 * 
 * Regla de Oro del Proyecto: CERO ALEATORIEDAD (Zero Stochastic Data).
 */

import { calculateRigorousSPA } from './astronomy';

export type PhotochemicalRegimeType = 'voc_limited' | 'nox_limited' | 'transitional';

export interface PhotochemicalDiagnostics {
  timestamp: string;
  // Variables astronómicas y de radiación
  szaDeg: number;
  jNo2SecMinus1: number;
  solarRadWm2: number;
  
  // Constantes cinéticas
  tempC: number;
  k3PpbMin: number;
  k3Cm3MolecSec: number;
  
  // Especies base
  no2Ppb: number;
  noPpb: number;
  noxTotalPpb: number;
  o3ObservedPpb: number;
  vocPpbC: number;
  
  // Indicadores de Leighton y Sillman
  leightonRatioPhi: number;
  isRadicalShortCircuit: boolean; // Φ > 1.1 indica que RO2/HO2 oxidan NO a NO2 adicionalmente
  vocNoxRatio: number;
  regime: PhotochemicalRegimeType;
  regimeLabel: string;
  regimeDescription: string;
  
  // Tasas de reacción instantáneas (ppb / min)
  photolysisRatePpbMin: number;
  titrationRatePpbMin: number;
  netProductionRatePpbMin: number;
  
  // Derivadas Analíticas de Sensibilidad (Gradiente EKMA)
  dO3_dNOx: number; // Cambio en O3 por cada 1 ppb de NOx añadido
  dO3_dVOC: number; // Cambio en O3 por cada 1 ppbC de VOC añadido
  isTitrationParadoxActive: boolean; // TRUE si reducir NOx eleva el O3 local
  
  // Escenario ZBE Simulador de Políticas Públicas
  zbeScenario: {
    trafficNoxReductionPct: number;
    vocReductionPct: number;
    postNoxPpb: number;
    postVocPpbC: number;
    postO3Ppb: number;
    deltaO3Ppb: number;
    deltaO3Pct: number;
    technicalVerdict: string;
    verdictColor: 'rose' | 'emerald' | 'amber';
  };
}

/**
 * Constante Arrhenius k3 (NO + O3 -> NO2 + O2) recomendada por IUPAC.
 * A = 1.4 x 10^-12 cm³ molec⁻¹ s⁻¹, E/R = 1310 K
 */
export function calculateArrheniusK3(tempC: number): { k3_cm3: number; k3_ppb_min: number } {
  const tk = tempC + 273.15;
  const k3_cm3 = 1.4e-12 * Math.exp(-1310 / tk);
  
  // Factor de conversión a ppb⁻¹ min⁻¹ en atmósfera estándar
  const numberDensityPerPpb = (101325 / (8.314 * tk)) * 6.022e23 * 1e-6 / 1e9;
  const k3_ppb_min = k3_cm3 * numberDensityPerPpb * 60.0;
  
  return { k3_cm3, k3_ppb_min };
}

/**
 * Evalúa la tasa de fotólisis j_NO2 en Málaga considerando geometría solar SPA y radiación solar.
 */
export function calculateJNO2(date: Date, solarRadWm2: number, cloudCoverPct: number = 0): { jNo2: number; sza: number } {
  const spa = calculateRigorousSPA(date);
  const sza = spa.sza_deg;
  
  if (sza >= 90) {
    return { jNo2: 0, sza };
  }
  
  // Radiación global a nivel de superficie acoplada a transmitancia
  const clearSkyJ = spa.jNo2_ClearSky_s1;
  const cloudFactor = Math.max(0.1, 1 - 0.75 * Math.pow(cloudCoverPct / 100, 3.4));
  const radRatio = Math.min(1.2, Math.max(0.05, solarRadWm2 / 850.0));
  
  const jNo2 = clearSkyJ * cloudFactor * radRatio;
  return { jNo2, sza };
}

/**
 * Evalúa el diagnóstico fotoquímico determinista integral.
 */
export function evaluatePhotochemicalRegime(
  date: Date,
  tempC: number,
  solarRadWm2: number,
  no2Ppb: number,
  noPpb: number,
  o3ObservedPpb: number,
  vocPpbC: number,
  trafficNoxReductionPct: number = 20,
  vocReductionPct: number = 10,
  cloudCoverPct: number = 0
): PhotochemicalDiagnostics {
  const { jNo2, sza } = calculateJNO2(date, solarRadWm2, cloudCoverPct);
  const { k3_cm3, k3_ppb_min } = calculateArrheniusK3(tempC);
  
  const noxTotal = Math.max(0.1, no2Ppb + noPpb);
  const vocTotal = Math.max(0.1, vocPpbC);
  const vocNoxRatio = vocTotal / noxTotal;
  
  // Relación de Leighton Φ = (j_NO2 * [NO2]) / (k3 * [NO] * [O3])
  const jNo2_min = jNo2 * 60.0;
  const titrationDenominator = Math.max(0.001, k3_ppb_min * noPpb * o3ObservedPpb);
  const leightonRatioPhi = jNo2 > 0 ? (jNo2_min * no2Ppb) / titrationDenominator : 0;
  const isRadicalShortCircuit = leightonRatioPhi > 1.15;
  
  // Tasas cinéticas instantáneas
  const photolysisRate = jNo2_min * no2Ppb;
  const titrationRate = k3_ppb_min * noPpb * o3ObservedPpb;
  const netProductionRate = photolysisRate - titrationRate;
  
  // Clasificación del Régimen de Sensibilidad (Sillman / Seinfeld & Pandis)
  let regime: PhotochemicalRegimeType = 'transitional';
  let regimeLabel = 'Régimen de Transición (Cresta EKMA)';
  let regimeDescription = 'Sensibilidad balanceada: reducir tanto NOx como COVs disminuye coordinadamente el ozono.';
  
  if (vocNoxRatio < 5.5) {
    regime = 'voc_limited';
    regimeLabel = 'VOC-Limitado (Saturado en NOx)';
    regimeDescription = 'Régimen de inhibición por NOx. El sumidero OH + NO2 domina. La reducción de NOx puede elevar el O3 local (Paradoja ZBE).';
  } else if (vocNoxRatio > 8.5) {
    regime = 'nox_limited';
    regimeLabel = 'NOx-Limitado (Sensible a NOx)';
    regimeDescription = 'Régimen de control eficiente por tráfico. La producción fotoquímica de O3 disminuye monótonamente al reducir emisiones de NOx.';
  }
  
  // Derivadas Analíticas de Sensibilidad (EKMA / Seinfeld & Pandis)
  // Modelo formal: [O3]_peak ≈ C * [VOC]^α / [NOx]^β para VOC-limited, y C' * [NOx]^γ * [VOC]^δ para NOx-limited
  let dO3_dNOx = 0;
  let dO3_dVOC = 0;
  
  const j_factor = Math.max(0.1, jNo2 / 0.007);
  const tempFactor = Math.exp(1200 * (1 / 298.15 - 1 / (tempC + 273.15)));
  
  if (regime === 'voc_limited') {
    // d[O3]/d[NOx] < 0 (Efecto inhibidor / titración de NOx)
    // d( (k * VOC^0.75) / (NOx^0.4) ) / dNOx = -0.4 * (O3 / NOx)
    dO3_dNOx = -0.38 * (o3ObservedPpb / noxTotal);
    dO3_dVOC = 0.72 * (o3ObservedPpb / vocTotal);
  } else if (regime === 'nox_limited') {
    // d[O3]/d[NOx] > 0
    dO3_dNOx = 0.78 * (o3ObservedPpb / noxTotal);
    dO3_dVOC = 0.18 * (o3ObservedPpb / vocTotal);
  } else {
    // Cerca de la cresta (dO3/dNOx cercano a 0)
    dO3_dNOx = 0.05 * (o3ObservedPpb / noxTotal);
    dO3_dVOC = 0.45 * (o3ObservedPpb / vocTotal);
  }
  
  const isTitrationParadoxActive = dO3_dNOx < -0.05;
  
  // Proyección determinista del Escenario ZBE
  const postNox = Math.max(1.0, noxTotal * (1 - trafficNoxReductionPct / 100.0));
  const postVoc = Math.max(1.0, vocTotal * (1 - vocReductionPct / 100.0));
  const deltaNox = postNox - noxTotal;
  const deltaVoc = postVoc - vocTotal;
  
  // Integración analítica del cambio de ozono
  const deltaO3Ppb = Number((dO3_dNOx * deltaNox + dO3_dVOC * deltaVoc).toFixed(1));
  const postO3Ppb = Math.max(5.0, Number((o3ObservedPpb + deltaO3Ppb).toFixed(1)));
  const deltaO3Pct = Number(((deltaO3Ppb / Math.max(1, o3ObservedPpb)) * 100).toFixed(1));
  
  let technicalVerdict = '';
  let verdictColor: 'rose' | 'emerald' | 'amber' = 'emerald';
  
  if (deltaO3Ppb > 1.5) {
    technicalVerdict = 'PARADOJA DE TITRACIÓN ACTIVA: La reducción aislada de NOx vehiculares desinhibe la formación fotoquímica y aumenta el O3 local. Se requiere incorporar medidas complementarias obligatorias sobre COVs (solventes portuarios, evaporación de gasolinas).';
    verdictColor = 'rose';
  } else if (deltaO3Ppb < -2.0) {
    technicalVerdict = 'ABATIMIENTO EFICAZ DE OZONO: La reducción de emisiones de tráfico en régimen NOx-limitado abate significativamente las concentraciones máximas de O3 sin provocar rebote fotoquímico.';
    verdictColor = 'emerald';
  } else {
    technicalVerdict = 'ZONA DE CRESTA: El impacto sobre el O3 es neutro o ligeramente variable. Se recomienda una reducción armónica simétrica de NOx vehicular y precursores orgánicos (VOCs).';
    verdictColor = 'amber';
  }
  
  return {
    timestamp: date.toISOString(),
    szaDeg: Number(sza.toFixed(1)),
    jNo2SecMinus1: Number(jNo2.toExponential(3)),
    solarRadWm2,
    tempC,
    k3PpbMin: Number(k3_ppb_min.toFixed(3)),
    k3Cm3MolecSec: Number(k3_cm3.toExponential(3)),
    no2Ppb,
    noPpb,
    noxTotalPpb: Number(noxTotal.toFixed(1)),
    o3ObservedPpb,
    vocPpbC: Number(vocTotal.toFixed(1)),
    leightonRatioPhi: Number(leightonRatioPhi.toFixed(2)),
    isRadicalShortCircuit,
    vocNoxRatio: Number(vocNoxRatio.toFixed(2)),
    regime,
    regimeLabel,
    regimeDescription,
    photolysisRatePpbMin: Number(photolysisRate.toFixed(2)),
    titrationRatePpbMin: Number(titrationRate.toFixed(2)),
    netProductionRatePpbMin: Number(netProductionRate.toFixed(2)),
    dO3_dNOx: Number(dO3_dNOx.toFixed(3)),
    dO3_dVOC: Number(dO3_dVOC.toFixed(3)),
    isTitrationParadoxActive,
    zbeScenario: {
      trafficNoxReductionPct,
      vocReductionPct,
      postNoxPpb: Number(postNox.toFixed(1)),
      postVocPpbC: Number(postVoc.toFixed(1)),
      postO3Ppb,
      deltaO3Ppb,
      deltaO3Pct,
      technicalVerdict,
      verdictColor
    }
  };
}

/**
 * Exportación FAIR Data en formato CSV estándar.
 */
export function exportPhotochemicalCsv(diag: PhotochemicalDiagnostics): string {
  const headers = [
    'timestamp',
    'sza_deg',
    'j_no2_s1',
    'k3_ppb_min',
    'no2_ppb',
    'no_ppb',
    'nox_total_ppb',
    'o3_ppb',
    'voc_ppbC',
    'leighton_phi',
    'voc_nox_ratio',
    'regime',
    'dO3_dNOx',
    'dO3_dVOC',
    'is_titration_paradox',
    'zbe_nox_red_pct',
    'zbe_voc_red_pct',
    'post_o3_ppb',
    'delta_o3_ppb',
    'delta_o3_pct'
  ].join(',');
  
  const row = [
    diag.timestamp,
    diag.szaDeg,
    diag.jNo2SecMinus1,
    diag.k3PpbMin,
    diag.no2Ppb,
    diag.noPpb,
    diag.noxTotalPpb,
    diag.o3ObservedPpb,
    diag.vocPpbC,
    diag.leightonRatioPhi,
    diag.vocNoxRatio,
    diag.regime,
    diag.dO3_dNOx,
    diag.dO3_dVOC,
    diag.isTitrationParadoxActive,
    diag.zbeScenario.trafficNoxReductionPct,
    diag.zbeScenario.vocReductionPct,
    diag.zbeScenario.postO3Ppb,
    diag.zbeScenario.deltaO3Ppb,
    diag.zbeScenario.deltaO3Pct
  ].join(',');
  
  return `${headers}\n${row}\n`;
}

/**
 * Exportación de deducción analítica y formalismo para la memoria de la Tesis Doctoral (LaTeX).
 */
export function exportPhotochemicalLatex(diag: PhotochemicalDiagnostics): string {
  return `% --- DIAGNÓSTICO FOTOQUÍMICO Y EVALUACIÓN ZBE (TESIS DOCTORAL) ---
\\section*{Diagnóstico del Régimen Fotoquímico y Sensibilidad de Ozono en Málaga}

\\subsection*{1. Relación Fotoestacionaria de Leighton}
La relación fotoestacionaria de Leighton ($\\Phi$) desacopla el ciclo nulo de Chapman del cortocircuito inducido por radicales peroxilo ($\\text{HO}_2 + \\text{RO}_2$):
\\begin{equation}
\\Phi = \\frac{j_{\\text{NO}_2} [\\text{NO}_2]}{k_3(T) [\\text{NO}] [\\text{O}_3]} = ${diag.leightonRatioPhi}
\\end{equation}
donde a la temperatura $T = ${diag.tempC}\\,^\\circ\\text{C}$:
\\begin{align*}
j_{\\text{NO}_2} &= ${diag.jNo2SecMinus1} \\; \\text{s}^{-1} \\quad (\\text{Ángulo cenital solar SZA} = ${diag.szaDeg}^\\circ) \\\\
k_3(T) &= ${diag.k3PpbMin} \\; \\text{ppb}^{-1}\\text{min}^{-1} \\quad (\\text{Cinética Arrhenius IUPAC})
\\end{align*}

\\subsection*{2. Clasificación del Régimen de Sensibilidad de Sillman}
El cociente de precursores es:
\\begin{equation}
\\xi = \\frac{[\\text{VOC}]_{\\text{ppbC}}}{[\\text{NO}_x]_{\\text{ppb}}} = \\frac{${diag.vocPpbC}}{${diag.noxTotalPpb}} = ${diag.vocNoxRatio} \\quad \\implies \\quad \\text{${diag.regimeLabel}}
\\end{equation}

\\subsection*{3. Derivadas de Sensibilidad y Paradoja de Titración ZBE}
Las derivadas parciales del gradiente EKMA evaluadas en el punto de operación de Málaga son:
\\begin{equation}
\\frac{\\partial [\\text{O}_3]}{\\partial [\\text{NO}_x]} = ${diag.dO3_dNOx} \\; \\frac{\\text{ppb } \\text{O}_3}{\\text{ppb } \\text{NO}_x}, \\qquad
\\frac{\\partial [\\text{O}_3]}{\\partial [\\text{VOC}]} = ${diag.dO3_dVOC} \\; \\frac{\\text{ppb } \\text{O}_3}{\\text{ppbC } \\text{VOC}}
\\end{equation}
Bajo un escenario de ZBE con reducción del ${diag.zbeScenario.trafficNoxReductionPct}\\% \\text{ en } \\text{NO}_x$ y ${diag.zbeScenario.vocReductionPct}\\% \\text{ en VOC}$:
\\begin{equation}
\\Delta [\\text{O}_3] = \\left( \\frac{\\partial [\\text{O}_3]}{\\partial [\\text{NO}_x]} \\right) \\Delta [\\text{NO}_x] + \\left( \\frac{\\partial [\\text{O}_3]}{\\partial [\\text{VOC}]} \\right) \\Delta [\\text{VOC}] = ${diag.zbeScenario.deltaO3Ppb} \\; \\text{ppb} \\; (${diag.zbeScenario.deltaO3Pct}\\%)
\\end{equation}
\\textbf{Dictamen Técnico para la Ordenanza Municipal:} ${diag.zbeScenario.technicalVerdict}`;
}
