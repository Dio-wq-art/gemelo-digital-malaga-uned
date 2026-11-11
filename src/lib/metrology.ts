/**
 * Módulo de Trazabilidad Metrológica y Auditoría Normativa.
 * Propagación analítica del error (k3 derivativa).
 */

export interface MetrologyState {
  t_celsius: number;
  t_error: number; // e.g. ± 0.5 ºC
  p_hpa: number;
  
  // Evaluaciones de error
  k3_value: number;
  k3_error: number;
  
  // Auditoria Legal (Directiva 2008/50/CE)
  no2_ppb: number;
  no2_ugm3: number;
  no2_legal_limit_1h_ugm3: number;
  no2_is_compliant: boolean;

  o3_ppb: number;
  o3_ugm3: number;
  o3_legal_limit_8h_ugm3: number;
  o3_is_compliant: boolean;
}

export function evaluateMetrologyAndCompliance(
  t_celsius: number, 
  t_error: number, 
  p_hpa: number, 
  no2_ppb: number, 
  o3_ppb: number
): MetrologyState {
  const tk = t_celsius + 273.15;
  const p_atm = p_hpa / 1013.25;

  // 1. Propagación de Error en k3 de Arrhenius (k3 = 1.4e-12 * exp(-1310/T))
  const A = 1.4e-12;
  const Ea_R = 1310;
  const k3_value = A * Math.exp(-Ea_R / tk);
  
  // Derivada parcial: dk3/dT = k3 * (1310 / T^2)
  const dk3_dT = k3_value * (Ea_R / (tk * tk));
  const k3_error = Math.abs(dk3_dT * t_error); // Propagación directa lineal (Taylor 1er orden)

  // 2. Conversiones Termodinámicas ppb -> µg/m³
  // C(µg/m3) = C(ppb) * MW / 22.41 * (273.15 / T) * P(atm)
  // factor_ideal = P(atm) * MW / (R * T) * 1000 ... we use standard formula:
  const getFactor = (mw: number) => mw / 22.414 * (273.15 / tk) * p_atm;
  
  const mw_no2 = 46.0055;
  const mw_o3 = 47.998;
  
  const no2_ugm3 = no2_ppb * getFactor(mw_no2);
  const o3_ugm3 = o3_ppb * getFactor(mw_o3);

  // 3. Normativa EU 2008/50/CE
  const NO2_LIMIT = 200; // µg/m³ 1-hora
  const O3_LIMIT = 120; // µg/m³ 8-hora (usamos el valor actual como proxy)

  return {
    t_celsius,
    t_error,
    p_hpa,
    k3_value,
    k3_error,
    no2_ppb,
    no2_ugm3,
    no2_legal_limit_1h_ugm3: NO2_LIMIT,
    no2_is_compliant: no2_ugm3 <= NO2_LIMIT,
    o3_ppb,
    o3_ugm3,
    o3_legal_limit_8h_ugm3: O3_LIMIT,
    o3_is_compliant: o3_ugm3 <= O3_LIMIT
  };
}
