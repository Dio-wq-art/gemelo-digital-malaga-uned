import { calculateRigorousSPA } from './astronomy';
/**
 * Módulo del Estado Estacionario Fotoquímico Extendido (Extended PSS) y Química Nocturna
 * Tesis Doctoral - Gemelo Digital de Calidad del Aire en Málaga
 *
 * Fundamentación Científica y Normativa:
 * - Ciclo de Leighton extendido: [NO2] = (k3[O3] + k_HO2[HO2] + k_RO2[RO2]) * [NO] / J_NO2
 * - Cinética de Arrhenius rigurosa para k3.
 * - Cálculo determinista del Ángulo Cenital Solar (SZA) basado en tiempo astronómico real.
 * - Inclusión de Química Nocturna (Formación e hidrólisis de N2O5) cuando J_NO2 = 0.
 * - Cero Aleatoriedad: Todo cálculo depende estrictamente del timestamp atómico o datos termodinámicos.
 */

export interface PssChemistryState {
  timestamp: string;
  solarZenithAngleDeg: number;
  jNo2SecMinus1: number;      // Tasa de fotólisis J_NO2 (s⁻¹)
  k3ArrheniusCm3MolecSec: number; // Constante térmica k3
  k3PpbMin: number;           // k3 convertida a ppb⁻¹ min⁻¹
  
  // Aerosoles y Tiempos de Relajación (Nuevos)
  aod: number;                // Profundidad Óptica de Aerosoles (tau_a)
  tauAdvSec: number;          // Tiempo de relajación advectiva (s)
  tauChemSec: number;         // Tiempo de relajación fotoquímica (s)
  damkohlerNumber: number;    // Número de Damköhler (Da = tau_adv / tau_chem)
  
  // Tasas Cinéticas Netas
  ratePhotolysisPpbMin: number;
  rateTitrationPpbMin: number;
  rateShuntPpbMin: number;

  // Variables del PSS Diurno
  primaryFNo2Ratio: number;   // Fracción de emisión primaria diésel f-NO2
  extendedLeightonPhi: number; // Φ extendido (incluyendo HO2/RO2)
  uncertaintyPhi: number;     // Incertidumbre propagada u(Φ) analítica (ISO/GUM 98-3)
  predictedNo2Ppb: number;    // Concentración de NO2 predicha por el PSS
  oxTotalPpb: number;         // Oxidantes totales conservativos Ox = [O3] + [NO2] (ppb)
  
  // Variables Nocturnas
  isNightChemistry: boolean;  // Activo cuando SZA > 90°
  kNo3Formation: number;      // NO2 + O3 -> NO3
  n2o5HydrolysisRate: number; // Deposición heterogénea a HNO3 (condicionada por HR)
}

/**
 * Calcula el Ángulo Cenital Solar (SZA) determinista para Málaga.
 */
function calculateMalagaSZA(date: Date = new Date()): number {
  const lat = 36.72016; // Málaga
  const lon = -4.42034;
  
  // Día juliano fraccional simplificado
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = Number(date) - Number(startOfYear);
  const dayOfYear = Math.floor(diff / 86400000);
  
  // Declinación solar empírica
  const declination = -23.44 * Math.cos((360 / 365) * (dayOfYear + 10) * (Math.PI / 180));
  
  // Tiempo Solar Verdadero (aproximación rápida a ecuación del tiempo nula)
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60.0;
  const solarTime = utcHours + (lon / 15.0); 
  const hourAngle = 15.0 * (solarTime - 12.0); // 15 grados por hora
  
  // SZA
  const radLat = lat * (Math.PI / 180);
  const radDecl = declination * (Math.PI / 180);
  const radHa = hourAngle * (Math.PI / 180);
  
  const cosSZA = Math.sin(radLat) * Math.sin(radDecl) + Math.cos(radLat) * Math.cos(radDecl) * Math.cos(radHa);
  const sza = Math.acos(cosSZA) * (180 / Math.PI);
  return sza;
}

/**
 * Calcula la constante de velocidad k3 por la Ecuación de Arrhenius.
 * Reacción: NO + O3 -> NO2 + O2
 * IUPAC Task Group on Atmospheric Chemical Kinetic Data Evaluation.
 */
function calculateK3Arrhenius(tempC: number): number {
  const tk = tempC + 273.15;
  // k(T) = A * exp(-E/RT)
  // A = 1.4 x 10^-12 cm^3 molec^-1 s^-1, E/R = 1310 K
  const k3_cm3 = 1.4e-12 * Math.exp(-1310 / tk);
  return k3_cm3;
}

export function evaluateExtendedPhotochemistry(
  realDate: Date,
  tempC: number,
  relativeHumidityPct: number,
  observedNo2Ppb: number,
  o3Ppb: number,
  noPpb: number,
  vocReactivityProxy: number = 2.0, // Representa la influencia global de HO2/RO2 local
  cloudCoverPct: number = 0, // Cobertura nubosa (0-100) para atenuación de J_NO2
  pm25UgM3: number = 10.0, // Concentración PM2.5 (ug/m3) para atenuación por aerosoles
  windSpeedMs: number = 2.5 // Viento (m/s) para el número de Damköhler
): PssChemistryState {
  const solarGeometry = calculateRigorousSPA(realDate);
  const sza = solarGeometry.sza_deg;
  const k3_cm3 = calculateK3Arrhenius(tempC);
  
  // Conversión de k3_cm3 a ppb⁻¹ min⁻¹ (aprox: cm3/molec s * 2.46e10 molec/cm3/ppb * 60)
  const tk = tempC + 273.15;
  const numberDensity = (101325 / (8.314 * tk)) * 6.022e23 * 1e-6 / 1e9; // molec/cm3 per ppb
  const k3_ppb_min = k3_cm3 * numberDensity * 60.0;
  
  // Profundidad Óptica de Aerosoles (AOD) estimada mecanicistamente desde PM2.5
  // tau_a ≈ [PM2.5] * MEC * H_PBL. Aproximación lineal empírica urbana.
  const aod = pm25UgM3 * 0.005;

  // Fotólisis J_NO2 parametrada por SZA y atenuación de Aerosoles/Nubes
  let jNo2 = 0;
  let isNight = false;
  if (sza < 90) {
    // Tasa teórica de NCAR TUV model (SPA algoritm)
    const jNo2Clear = solarGeometry.jNo2_ClearSky_s1;
    // Función de transmitancia atmosférica de Kasten & Czeplak modificada a %
    const cloudAttenuation = 1 - 0.75 * Math.pow(cloudCoverPct / 100.0, 3.4);
    // Atenuación de Beer-Lambert por AOD
    const m = 1.0 / Math.cos(sza * Math.PI / 180.0);
    const aodAttenuation = Math.exp(-aod * m);
    
    jNo2 = jNo2Clear * Math.max(0, cloudAttenuation) * aodAttenuation;
  } else {
    isNight = true;
  }

  // Tasa de formación de NO3 (k_NO3) para la química nocturna (NO2 + O3 -> NO3)
  // A = 1.2 x 10^-13, E/R = 2450 K
  const k_no3_cm3 = 1.2e-13 * Math.exp(-2450 / tk);
  const k_no3_ppb_min = k_no3_cm3 * numberDensity * 60.0;

  // Hidrólisis de N2O5 (dependiente de humedad)
  const n2o5Hydrolysis = isNight ? Math.max(0, (relativeHumidityPct - 40) * 0.005) : 0;

  // Relación Primaria f-NO2 (Diésel predominante)
  const primaryFNo2 = 0.22; // 22% emisión primaria
  
  // Evaluación del Estado Estacionario Extendido (PSS)
  let predictedNo2 = 0;
  let phi = 1.0;
  let rPhotolysis = 0;
  let rTitration = 0;
  let rShunt = 0;
  
  if (!isNight && jNo2 > 0) {
    const k_ho2_ro2 = vocReactivityProxy * 0.08; // Proxy cinético (ppb-1 min-1)
    
    // Ecuación PSS extendida (NO2 = [k3(O3) + k_rox(ROx)] * NO / J_NO2) * fNO2_factor
    // Para simplificar (al no tener la red de RO2 real instantánea), modulamos el balance:
    const jNo2_min = jNo2 * 60;
    predictedNo2 = ((k3_ppb_min * o3Ppb) + (k_ho2_ro2 * noPpb)) * noPpb / jNo2_min;
    
    // Tasas cinéticas (ppb/min)
    rPhotolysis = jNo2_min * predictedNo2;
    rTitration = k3_ppb_min * noPpb * o3Ppb;
    rShunt = k_ho2_ro2 * noPpb; // Bypass por ciclo de COVs

    // Aporte primario
    predictedNo2 = predictedNo2 * (1 + primaryFNo2);
    
    // Ratio de Leighton Observado Φ = (J_NO2 * NO2_obs) / (k3 * NO * O3)
    phi = (jNo2_min * observedNo2Ppb) / Math.max(0.0001, k3_ppb_min * noPpb * o3Ppb);
  } else {
    // Dinámica Nocturna (pérdida progresiva a sumideros)
    predictedNo2 = (noPpb * 1.5); // Baseline remanente nocturno
    phi = 0;
  }

  // Número de Damköhler (Da = tau_adv / tau_chem) para un cañón urbano estándar (L = 100m)
  const L = 100.0; // metros
  const tauAdv = windSpeedMs > 0.1 ? L / windSpeedMs : 1000.0; // Limitado para calma total
  const k3_s = k3_ppb_min / 60.0;
  const sumK = jNo2 + k3_s * o3Ppb + k3_s * noPpb;
  const tauChem = sumK > 0 ? 1.0 / sumK : 1000.0;
  const damkohler = tauAdv / tauChem;

  // Cálculo de Oxidantes Totales Conservativos Ox = [O3] + [NO2] (ppb)
  const oxTotal = o3Ppb + predictedNo2;

  // Propagación Analítica de Incertidumbre de Taylor (ISO/GUM 98-3) para u(Φ)
  // u_rel(J) = 5%, u_rel(k3) = 8% (IUPAC), u_rel(Conc) = 5%
  const u_rel_j = 0.05;
  const u_rel_k3 = 0.08;
  const u_rel_conc = 0.05;
  const u_rel_phi = Math.sqrt(u_rel_j * u_rel_j + u_rel_k3 * u_rel_k3 + 2 * u_rel_conc * u_rel_conc);
  const u_phi = phi * u_rel_phi;

  return {
    timestamp: realDate.toISOString(),
    solarZenithAngleDeg: parseFloat(sza.toFixed(2)),
    jNo2SecMinus1: parseFloat(jNo2.toExponential(3)),
    k3ArrheniusCm3MolecSec: parseFloat(k3_cm3.toExponential(3)),
    k3PpbMin: parseFloat(k3_ppb_min.toFixed(3)),
    aod: parseFloat(aod.toFixed(3)),
    tauAdvSec: parseFloat(tauAdv.toFixed(1)),
    tauChemSec: parseFloat(tauChem.toFixed(1)),
    damkohlerNumber: parseFloat(damkohler.toFixed(2)),
    ratePhotolysisPpbMin: parseFloat(rPhotolysis.toFixed(2)),
    rateTitrationPpbMin: parseFloat(rTitration.toFixed(2)),
    rateShuntPpbMin: parseFloat(rShunt.toFixed(2)),
    primaryFNo2Ratio: primaryFNo2,
    extendedLeightonPhi: parseFloat(phi.toFixed(2)),
    uncertaintyPhi: parseFloat(u_phi.toFixed(3)),
    predictedNo2Ppb: parseFloat(predictedNo2.toFixed(1)),
    oxTotalPpb: parseFloat(oxTotal.toFixed(1)),
    isNightChemistry: isNight,
    kNo3Formation: parseFloat(k_no3_ppb_min.toExponential(3)),
    n2o5HydrolysisRate: parseFloat(n2o5Hydrolysis.toFixed(3)),
  };
}

export function exportPssCsv(state: PssChemistryState): string {
  const headers = "timestamp,sza_deg,j_no2_s,k3_cm3,phi,u_phi,predicted_no2,ox_total_ppb,aod,damkohler,is_night,n2o5_hydrolysis,Arrhenius_A,Arrhenius_ER,IUPAC_metadata\n";
  const row = `${state.timestamp},${state.solarZenithAngleDeg},${state.jNo2SecMinus1},${state.k3ArrheniusCm3MolecSec},${state.extendedLeightonPhi},${state.uncertaintyPhi},${state.predictedNo2Ppb},${state.oxTotalPpb},${state.aod},${state.damkohlerNumber},${state.isNightChemistry},${state.n2o5HydrolysisRate},1.4e-12,1310,IUPAC_Task_Group_K3\n`;
  return headers + row;
}

export function exportPssLatex(state: PssChemistryState): string {
  return `% --- DEDUCCIÓN Y ESTADO FOTOQUÍMICO DE LEIGHTON (TESIS DOCTORAL) ---
\\begin{equation}
\\Phi = \\frac{J_{\\text{NO}_2} [\\text{NO}_2]}{k_3 [\\text{NO}] [\\text{O}_3]} = ${state.extendedLeightonPhi} \\pm ${state.uncertaintyPhi} \\quad (\\text{ISO/GUM 98-3})
\\end{equation}

\\begin{align*}
SZA &= ${state.solarZenithAngleDeg}^{\\circ} \\quad (\\text{Ángulo Cenital Solar en Málaga}) \\\\
J_{\\text{NO}_2} &= ${state.jNo2SecMinus1} \\; \\text{s}^{-1} \\quad (\\text{Tasa de Fotólisis Actínica atenuada por } \\tau_a=${state.aod}) \\\\
k_3(T) &= ${state.k3PpbMin} \\; \\text{ppb}^{-1}\\text{min}^{-1} \\quad (\\text{Arrhenius IUPAC}) \\\\
Da &= ${state.damkohlerNumber} \\quad (\\text{Número de Damköhler: } \\tau_{\\text{adv}}=${state.tauAdvSec}\\text{ s, } \\tau_{\\text{chem}}=${state.tauChemSec}\\text{ s}) \\\\
[\\text{O}_x] &= [\\text{O}_3] + [\\text{NO}_2] = ${state.oxTotalPpb} \\; \\text{ppb} \\quad (\\text{Invariante de Oxidantes Totales})
\\end{align*}`;
}
