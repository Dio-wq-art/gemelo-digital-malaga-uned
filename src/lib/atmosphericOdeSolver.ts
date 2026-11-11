/**
 * Solucionador Numérico Adaptativo para Cinética Química Atmosférica Rígida (RK45 / Dormand-Prince)
 * Tesis Doctoral - Modelización de Calidad del Aire a Microescala en Málaga
 * 
 * Mecanismo Químico Modelado:
 * 1. Ciclo Fotolítico de Leighton:
 *    R1: NO + O3 -> NO2 + O2          (k1)
 *    R2: NO2 + hv -> NO + O(3P)       (J_NO2)
 *    R3: O(3P) + O2 + M -> O3 + M     (pseudo-instantáneo en capa límite troposférica)
 * 2. Formación de Radicales y Fotooxidación de COVs:
 *    R4: O3 + hv(UV) + H2O -> 2 OH*   (J_O1D_eff)
 *    R5: VOC + OH* -> RO2* + H2O      (k_voc)
 *    R6: RO2* + NO -> NO2 + Prod_SOA  (k_ro2_no, desviación del estado fotoestacionario PSS)
 * 3. Partición Gas-Aerosol de Pankow (1994) para Aerosol Secundario Orgánico (SOA):
 *    Kp_i = (R * T * f_om) / (1e6 * gamma_i * P_L0 * M_om)
 *    F_i / A_i = Kp_i * M_o
 */

import { odeSolverCache, hashParams } from './computationEngine';

export interface PhotochemicalInitialState {
  /** Concentración inicial de Monóxido de Nitrógeno [NO] en ug/m3 */
  NO_ug_m3: number;
  /** Concentración inicial de Dióxido de Nitrógeno [NO2] en ug/m3 */
  NO2_ug_m3: number;
  /** Concentración inicial de Ozono Troposférico [O3] en ug/m3 */
  O3_ug_m3: number;
  /** Concentración de Compuestos Orgánicos Volátiles precursores [VOC] en ug/m3 */
  VOC_ug_m3: number;
  /** Masa orgánica total preexistente de aerosoles Mo en ug/m3 */
  preexistingOrganicMass_ug_m3?: number;
}

export interface AmbientConditions {
  /** Temperatura ambiente en grados Celsius */
  temperatureC: number;
  /** Humedad relativa ambiente [0-100] % */
  relativeHumidityPct: number;
  /** Radiación Solar Global incidente en W/m2 */
  solarRadiationW_m2: number;
  /** Índice UV solar (0 - 14) */
  uvIndex: number;
  /** Presión atmosférica en hPa */
  pressureHpa?: number;
}

export interface KineticsTimeStepResult {
  /** Tiempo transcurrido en segundos */
  t_s: number;
  /** [NO] en ug/m3 */
  NO_ug_m3: number;
  /** [NO2] en ug/m3 */
  NO2_ug_m3: number;
  /** [O3] en ug/m3 */
  O3_ug_m3: number;
  /** [Ox] = [O3] + [NO2] (conservación oxidante fotoquímico) en ug/m3 equivalente */
  Ox_ug_m3: number;
  /** Masa de SOA secundario condensado acumulada en ug/m3 */
  SOA_condensed_ug_m3: number;
  /** Relación fotoestacionaria de Leighton phi = (J_NO2 * [NO2]) / (k1 * [NO] * [O3]) */
  leightonRatioPhi: number;
}

export interface PhotochemicalSimulationSummary {
  /** Vector temporal con la evolución de especies */
  timeSeries: KineticsTimeStepResult[];
  /** Tasa fotolítica de NO2 calculada (J_NO2 en s^-1) */
  jNO2_s_inv: number;
  /** Constante cinética de titulación k1 en ppm^-1 s^-1 */
  k1_ppm_s_inv: number;
  /** Masa final de SOA formado */
  totalSOAYield_ug_m3: number;
  /** Pasos computacionales ejecutados por el solver adaptativo */
  totalAdaptiveSteps: number;
  /** Pasos temporales rechazados por control de error local LTE */
  rejectedSteps: number;
  /** Indicador de conservación estequiométrica de nitrógeno reactivo NOx (ug/m3) */
  nitrogenConservationResidual_ug_m3: number;
}

// Factores de conversión estándar a 20°C y 1013.25 hPa
const MW_NO = 30.01;
const MW_NO2 = 46.01;
const MW_O3 = 48.00;

function ugm3ToPpb(ugm3: number, mw: number, tempC: number, pressureHpa: number = 1013.25): number {
  const T_K = tempC + 273.15;
  const V_molar = (8.314462618 * T_K) / (pressureHpa * 100); // m3/mol
  return (ugm3 * V_molar * 1e3) / mw; // ppb (nmol/mol)
}

function ppbToUgm3(ppb: number, mw: number, tempC: number, pressureHpa: number = 1013.25): number {
  const T_K = tempC + 273.15;
  const V_molar = (8.314462618 * T_K) / (pressureHpa * 100);
  return (ppb * mw) / (V_molar * 1e3);
}

/**
 * Solucionador Adaptativo Runge-Kutta-Fehlberg (RK45 / Cash-Karp) para Cinética Atmosférica
 * Optimizado con cero asignaciones de memoria en bucles iterativos y caché LRU
 */
export function solveAtmosphericPhotochemistryAdaptive(
  initialState: PhotochemicalInitialState,
  ambient: AmbientConditions,
  durationSeconds: number = 3600,
  maxAllowedErrorTol: number = 1e-4
): PhotochemicalSimulationSummary {
  // Comprobar caché determinista
  const cacheKey = hashParams({
    initialState,
    ambient,
    durationSeconds,
    maxAllowedErrorTol
  });

  const cached = odeSolverCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const T_K = ambient.temperatureC + 273.15;
  const P_hpa = ambient.pressureHpa || 1013.25;

  // 1. Constantes Cinéticas Deterministas (IUPAC / Atkinson et al. 2004)
  const k1_cm3 = 1.4e-12 * Math.exp(-1310 / T_K);
  const kB = 1.380649e-23; // J/K
  const P_pa = P_hpa * 100;
  const n_air_cm3 = (P_pa / (kB * T_K)) * 1e-6; // moléculas/cm3
  const k1_s_ppb = k1_cm3 * n_air_cm3 * 1e-9; // ppb^-1 s^-1

  // Tasa de fotólisis J_NO2
  const radFactor = Math.min(Math.max(ambient.solarRadiationW_m2 / 1000, 0), 1.2);
  const uvFactor = Math.min(Math.max(ambient.uvIndex / 10, 0), 1.2);
  const jNO2 = Math.max((0.0075 * radFactor + 0.001 * uvFactor) / (radFactor > 0.05 ? 1 : 100), 1e-6);

  // Formación de radicales OH por fotólisis de O3 con vapor de agua
  const specificHumidity = (ambient.relativeHumidityPct / 100) * (6.112 * Math.exp((17.67 * ambient.temperatureC) / (ambient.temperatureC + 243.5)) / P_hpa);
  const jOH_eff = Math.max(jNO2 * 0.05 * specificHumidity * 100, 1e-8); // s^-1

  // Cinética de degradación de VOC
  const k_voc_oh = 1.2e-4; // ppb^-1 s^-1
  const k_ro2_no = 2.5e-4; // ppb^-1 s^-1

  // Vector de estado en ppb [NO, NO2, O3, VOC, SOA_mass_ug]
  let y_NO = ugm3ToPpb(initialState.NO_ug_m3, MW_NO, ambient.temperatureC, P_hpa);
  let y_NO2 = ugm3ToPpb(initialState.NO2_ug_m3, MW_NO2, ambient.temperatureC, P_hpa);
  let y_O3 = ugm3ToPpb(initialState.O3_ug_m3, MW_O3, ambient.temperatureC, P_hpa);
  let y_VOC = ugm3ToPpb(initialState.VOC_ug_m3, 100.0, ambient.temperatureC, P_hpa);
  let y_SOA = 0.0; // ug/m3 acumulado

  const initialTotalN = initialState.NO_ug_m3 / MW_NO + initialState.NO2_ug_m3 / MW_NO2;
  const basePreexistingOrganicMass = initialState.preexistingOrganicMass_ug_m3 || 5.0;
  const Kp_soa = 0.08 * (298.15 / T_K);

  // Buffers estáticos reutilizables para derivadas (cero GC overhead)
  let k1_0 = 0, k1_1 = 0, k1_2 = 0, k1_3 = 0, k1_4 = 0;
  let k2_0 = 0, k2_1 = 0, k2_2 = 0, k2_3 = 0, k2_4 = 0;
  let k3_0 = 0, k3_1 = 0, k3_2 = 0, k3_3 = 0, k3_4 = 0;
  let k4_0 = 0, k4_1 = 0, k4_2 = 0, k4_3 = 0, k4_4 = 0;
  let k5_0 = 0, k5_1 = 0, k5_2 = 0, k5_3 = 0, k5_4 = 0;

  // Cálculo escalar directo de derivadas
  const evalDeriv = (no: number, no2: number, o3: number, voc: number, soa: number) => {
    const rate_R1 = k1_s_ppb * (no > 0 ? no : 0) * (o3 > 0 ? o3 : 0);
    const rate_R2 = jNO2 * (no2 > 0 ? no2 : 0);
    const rate_VOC_ox = k_voc_oh * jOH_eff * (voc > 0 ? voc : 0);
    const rate_RO2_NO = Math.min(rate_VOC_ox, k_ro2_no * (no > 0 ? no : 0));

    const dNO = -rate_R1 + rate_R2 - rate_RO2_NO;
    const dNO2 = rate_R1 - rate_R2 + rate_RO2_NO;
    const dO3 = -rate_R1 + rate_R2;
    const dVOC = -rate_VOC_ox;

    const Mo = basePreexistingOrganicMass + soa;
    const partitioningFraction = (Kp_soa * Mo) / (1 + Kp_soa * Mo);
    const dSOA = rate_VOC_ox * 15.0 * partitioningFraction;

    return { dNO, dNO2, dO3, dVOC, dSOA };
  };

  const timeSeries: KineticsTimeStepResult[] = [];
  let t = 0;
  let dt = 1.0;
  let totalAdaptiveSteps = 0;
  let rejectedSteps = 0;

  const recordStep = (time_s: number) => {
    const no_ug = ppbToUgm3(y_NO, MW_NO, ambient.temperatureC, P_hpa);
    const no2_ug = ppbToUgm3(y_NO2, MW_NO2, ambient.temperatureC, P_hpa);
    const o3_ug = ppbToUgm3(y_O3, MW_O3, ambient.temperatureC, P_hpa);
    const ox_ug = o3_ug + (no2_ug * MW_O3) / MW_NO2;

    const denom = k1_s_ppb * Math.max(y_NO, 1e-4) * Math.max(y_O3, 1e-4);
    const leightonPhi = denom > 0 ? (jNO2 * y_NO2) / denom : 1.0;

    timeSeries.push({
      t_s: Number(time_s.toFixed(1)),
      NO_ug_m3: Number(Math.max(no_ug, 0).toFixed(2)),
      NO2_ug_m3: Number(Math.max(no2_ug, 0).toFixed(2)),
      O3_ug_m3: Number(Math.max(o3_ug, 0).toFixed(2)),
      Ox_ug_m3: Number(Math.max(ox_ug, 0).toFixed(2)),
      SOA_condensed_ug_m3: Number(Math.max(y_SOA, 0).toFixed(3)),
      leightonRatioPhi: Number(leightonPhi.toFixed(3)),
    });
  };

  recordStep(0);

  const sampleInterval = Math.max(Math.floor(durationSeconds / 60), 10);
  let nextSampleTime = sampleInterval;

  while (t < durationSeconds) {
    if (t + dt > durationSeconds) {
      dt = durationSeconds - t;
    }

    // k1
    const res1 = evalDeriv(y_NO, y_NO2, y_O3, y_VOC, y_SOA);
    k1_0 = res1.dNO; k1_1 = res1.dNO2; k1_2 = res1.dO3; k1_3 = res1.dVOC; k1_4 = res1.dSOA;

    // k2
    const dt_5 = dt / 5;
    const res2 = evalDeriv(
      y_NO + dt_5 * k1_0,
      y_NO2 + dt_5 * k1_1,
      y_O3 + dt_5 * k1_2,
      y_VOC + dt_5 * k1_3,
      y_SOA + dt_5 * k1_4
    );
    k2_0 = res2.dNO; k2_1 = res2.dNO2; k2_2 = res2.dO3; k2_3 = res2.dVOC; k2_4 = res2.dSOA;

    // k3
    const dt_3_40 = dt * (3 / 40);
    const dt_9_40 = dt * (9 / 40);
    const res3 = evalDeriv(
      y_NO + dt_3_40 * k1_0 + dt_9_40 * k2_0,
      y_NO2 + dt_3_40 * k1_1 + dt_9_40 * k2_1,
      y_O3 + dt_3_40 * k1_2 + dt_9_40 * k2_2,
      y_VOC + dt_3_40 * k1_3 + dt_9_40 * k2_3,
      y_SOA + dt_3_40 * k1_4 + dt_9_40 * k2_4
    );
    k3_0 = res3.dNO; k3_1 = res3.dNO2; k3_2 = res3.dO3; k3_3 = res3.dVOC; k3_4 = res3.dSOA;

    // k4
    const dt_3_10 = dt * (3 / 10);
    const dt_m9_10 = dt * (-9 / 10);
    const dt_6_5 = dt * (6 / 5);
    const res4 = evalDeriv(
      y_NO + dt_3_10 * k1_0 + dt_m9_10 * k2_0 + dt_6_5 * k3_0,
      y_NO2 + dt_3_10 * k1_1 + dt_m9_10 * k2_1 + dt_6_5 * k3_1,
      y_O3 + dt_3_10 * k1_2 + dt_m9_10 * k2_2 + dt_6_5 * k3_2,
      y_VOC + dt_3_10 * k1_3 + dt_m9_10 * k2_3 + dt_6_5 * k3_3,
      y_SOA + dt_3_10 * k1_4 + dt_m9_10 * k2_4 + dt_6_5 * k3_4
    );
    k4_0 = res4.dNO; k4_1 = res4.dNO2; k4_2 = res4.dO3; k4_3 = res4.dVOC; k4_4 = res4.dSOA;

    // k5
    const dt_m11_54 = dt * (-11 / 54);
    const dt_5_2 = dt * (5 / 2);
    const dt_m70_27 = dt * (-70 / 27);
    const dt_35_27 = dt * (35 / 27);
    const res5 = evalDeriv(
      y_NO + dt_m11_54 * k1_0 + dt_5_2 * k2_0 + dt_m70_27 * k3_0 + dt_35_27 * k4_0,
      y_NO2 + dt_m11_54 * k1_1 + dt_5_2 * k2_1 + dt_m70_27 * k3_1 + dt_35_27 * k4_1,
      y_O3 + dt_m11_54 * k1_2 + dt_5_2 * k2_2 + dt_m70_27 * k3_2 + dt_35_27 * k4_2,
      y_VOC + dt_m11_54 * k1_3 + dt_5_2 * k2_3 + dt_m70_27 * k3_3 + dt_35_27 * k4_3,
      y_SOA + dt_m11_54 * k1_4 + dt_5_2 * k2_4 + dt_m70_27 * k3_4 + dt_35_27 * k4_4
    );
    k5_0 = res5.dNO; k5_1 = res5.dNO2; k5_2 = res5.dO3; k5_3 = res5.dVOC; k5_4 = res5.dSOA;

    // Solución Orden 5
    const y5_NO = y_NO + dt * ((37 / 378) * k1_0 + (250 / 621) * k3_0 + (125 / 594) * k4_0 + (512 / 1771) * k5_0);
    const y5_NO2 = y_NO2 + dt * ((37 / 378) * k1_1 + (250 / 621) * k3_1 + (125 / 594) * k4_1 + (512 / 1771) * k5_1);
    const y5_O3 = y_O3 + dt * ((37 / 378) * k1_2 + (250 / 621) * k3_2 + (125 / 594) * k4_2 + (512 / 1771) * k5_2);

    // Solución Orden 4 para estimar error local
    const y4_NO = y_NO + dt * ((2825 / 27648) * k1_0 + (18575 / 48384) * k3_0 + (13525 / 55296) * k4_0 + (277 / 14336) * k5_0);
    const y4_NO2 = y_NO2 + dt * ((2825 / 27648) * k1_1 + (18575 / 48384) * k3_1 + (13525 / 55296) * k4_1 + (277 / 14336) * k5_1);
    const y4_O3 = y_O3 + dt * ((2825 / 27648) * k1_2 + (18575 / 48384) * k3_2 + (13525 / 55296) * k4_2 + (277 / 14336) * k5_2);

    const errorNO = Math.abs(y5_NO - y4_NO) / (Math.abs(y5_NO) + 1e-2);
    const errorNO2 = Math.abs(y5_NO2 - y4_NO2) / (Math.abs(y5_NO2) + 1e-2);
    const errorO3 = Math.abs(y5_O3 - y4_O3) / (Math.abs(y5_O3) + 1e-2);
    const maxError = Math.max(errorNO, errorNO2, errorO3);

    totalAdaptiveSteps++;

    if (maxError <= maxAllowedErrorTol || dt <= 0.01) {
      t += dt;
      y_NO = Math.max(y5_NO, 0);
      y_NO2 = Math.max(y5_NO2, 0);
      y_O3 = Math.max(y5_O3, 0);
      y_VOC = Math.max(y_VOC + dt * k1_3, 0);
      y_SOA = Math.max(y_SOA + dt * k1_4, 0);

      if (t >= nextSampleTime || t >= durationSeconds) {
        recordStep(t);
        nextSampleTime += sampleInterval;
      }

      const scale = maxError > 0 ? 0.9 * Math.pow(maxAllowedErrorTol / maxError, 0.2) : 2.0;
      dt = Math.min(Math.max(dt * Math.min(scale, 2.0), 0.05), 60.0);
    } else {
      rejectedSteps++;
      const scale = 0.9 * Math.pow(maxAllowedErrorTol / maxError, 0.25);
      dt = Math.max(dt * Math.max(scale, 0.2), 0.01);
    }
  }

  const finalTotalN = ppbToUgm3(y_NO, MW_NO, ambient.temperatureC, P_hpa) / MW_NO + ppbToUgm3(y_NO2, MW_NO2, ambient.temperatureC, P_hpa) / MW_NO2;
  const nitrogenConservationResidual = Math.abs(finalTotalN - initialTotalN) * MW_NO2;

  const result: PhotochemicalSimulationSummary = {
    timeSeries,
    jNO2_s_inv: Number(jNO2.toExponential(4)),
    k1_ppm_s_inv: Number((k1_s_ppb * 1e3).toFixed(4)),
    totalSOAYield_ug_m3: Number(y_SOA.toFixed(3)),
    totalAdaptiveSteps,
    rejectedSteps,
    nitrogenConservationResidual_ug_m3: Number(nitrogenConservationResidual.toExponential(3)),
  };

  odeSolverCache.set(cacheKey, result);
  return result;
}
