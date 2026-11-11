/**
 * Módulo de Dinámica de Brisas Marinas y Gradiente Térmico de Presión para la Bahía de Málaga.
 * Tesis Doctoral: Gemelo Digital de Málaga.
 * 
 * Formulación física determinista acoplada a la Temperatura de la Superficie del Mar (SST) de Copernicus Marine Service.
 */

export interface SeaBreezeParams {
  tempLandC: number;           // Temperatura del aire sobre el suelo (Málaga Centro, °C)
  tempSeaSstC: number;         // SST del Mar de Alborán (Bahía de Málaga, Copernicus, °C)
  windDirectionDeg: number;    // Dirección del viento medido (grados)
  windSpeedKmh: number;        // Velocidad del viento (km/h)
  solarIrradianceWm2: number;  // Irradiancia solar de onda corta (W/m²)
  latDeg?: number;             // Latitud de Málaga (36.72° N)
}

export interface SeaBreezeAnalysis {
  deltaT_C: number;                     // Gradiente térmico Tierra-Mar (°C)
  deltaP_hPa: number;                    // Gradiente de presión mesoescala (hPa)
  seaBreezeFrontVelocityMs: number;     // Velocidad del frente de brisa (m/s)
  seaBreezeInlandPenetrationKm: number; // Alcance del frente de brisa tierra adentro (km)
  regime: 'sea_breeze_active' | 'terral_catabatic' | 'transition_neutral' | 'nocturnal_land_breeze';
  regimeDescription: string;
  recirculationIndexPct: number;        // Índice de recirculación de contaminantes sobre la costa (%)
  coriolisDeflectionDeg: number;        // Deflexión de Coriolis por latitud
  marineBoundaryLayerHeightM: number;   // Altura de la capa límite marina (MBLH, m)
  photolyticO3CoastEnrichmentUgm3: number; // Enriquecimiento costero de O3 por transporte fotoquímico marino
  froudeNumberOrographic: number;       // Número de Froude orográfico Fr = U / (N * h_montes)
  orographicBlockingRegime: 'flow_over' | 'blocked_stagnation' | 'critical_wake';
  orographicBlockingDescription: string;
}

/**
 * Calcula deterministamente la dinámica de la brisa marina / terral en la Bahía de Málaga.
 */
export function calculateSeaBreezeDynamics(params: SeaBreezeParams): SeaBreezeAnalysis {
  const {
    tempLandC,
    tempSeaSstC,
    windDirectionDeg,
    windSpeedKmh,
    solarIrradianceWm2,
    latDeg = 36.7196
  } = params;

  // 1. Gradiente térmico Delta T = T_tierra - T_mar
  const deltaT_C = Number((tempLandC - tempSeaSstC).toFixed(2));

  // 2. Gradiente mesoescala de presión hidrostática (Haurwitz / Atkinson model)
  // Delta P ≈ P0 * (g * H / (R * T^2)) * Delta T
  const H_scale = 800; // m (Escala de altura de la brisa marina)
  const T_avg = 273.15 + (tempLandC + tempSeaSstC) / 2;
  const deltaP_hPa = Number((1013.25 * (9.81 * H_scale * deltaT_C) / (287 * T_avg * T_avg)).toFixed(3));

  // 3. Velocidad teórica del frente de brisa marina U_sb (Biggs & Graves criterion)
  // U_sb = C * sqrt(g * H * (Delta T / T_avg))
  const u_sb_raw = deltaT_C > 0 ? 0.65 * Math.sqrt(9.81 * 400 * (deltaT_C / T_avg)) : 0;
  const seaBreezeFrontVelocityMs = Number(u_sb_raw.toFixed(2));

  // 4. Parámetro de Coriolis f = 2 * Omega * sin(phi)
  const omega = 7.2921e-5; // rad/s
  const phi = (latDeg * Math.PI) / 180;
  const f = 2 * omega * Math.sin(phi);
  const coriolisDeflectionDeg = Number(((f * 3600 * 180) / Math.PI).toFixed(1)); // Deflexión horaria teórica

  // 5. Categorización del Régimen Micro-Meteo en Málaga
  // Brisa activa: Viento de S-SE-SO (130° a 240°) con Delta T > 1.5°C e irradiancia alta.
  // Terral: Viento de NW-N (290° a 360° o 0° a 30°) muy seco y cálido (Delta T > 5°C descendiendo de los Montes de Málaga).
  let regime: SeaBreezeAnalysis['regime'] = 'transition_neutral';
  let regimeDescription = 'Régimen de transición o viento sinóptico neutro.';

  const isSoutherlySector = windDirectionDeg >= 120 && windDirectionDeg <= 250;
  const isNortherlySector = (windDirectionDeg >= 290 && windDirectionDeg <= 360) || (windDirectionDeg >= 0 && windDirectionDeg <= 40);

  if (deltaT_C > 1.2 && isSoutherlySector && solarIrradianceWm2 > 150) {
    regime = 'sea_breeze_active';
    regimeDescription = `Brisa de mar activa (S-SE). Arrastra aire marino húmedo, limita la dispersión vertical (MBLH ~ ${Math.round(250 + deltaT_C * 30)} m) y recircula precursores de O₃ hacia el centro urbano.`;
  } else if (isNortherlySector && tempLandC > 28) {
    regime = 'terral_catabatic';
    regimeDescription = 'Terral adiabático de los Montes de Málaga (NW). Viento racheado, compresión térmica, baja humedad relativa y supresión de brisas marinas.';
  } else if (deltaT_C < -1.0 || (solarIrradianceWm2 < 20 && isNortherlySector)) {
    regime = 'nocturnal_land_breeze';
    regimeDescription = 'Terral nocturno / Brisa de tierra. Desplazamiento de la masa de aire urbano hacia la bahía.';
  }

  // 6. Índice de Recirculación de Contaminantes (Allwine & Whiteman Recirculation Factor)
  // R = 1 - S / L. En condiciones de brisa costera oscilante, R varía entre 0 y 100%.
  let recirculationIndexPct = 15;
  if (regime === 'sea_breeze_active') {
    recirculationIndexPct = Math.min(95, Math.round(45 + (deltaT_C * 4.5) + (1000 / (windSpeedKmh + 2))));
  } else if (regime === 'terral_catabatic') {
    recirculationIndexPct = Math.max(5, Math.round(10 - windSpeedKmh * 0.2));
  }

  // 7. Altura de la Capa Límite Marina (MBLH)
  const marineBoundaryLayerHeightM = regime === 'sea_breeze_active' 
    ? Math.round(200 + deltaT_C * 35) 
    : Math.round(800 + (solarIrradianceWm2 * 0.8));

  // 8. Enriquecimiento costero de O3 por transporte de precursores sobre el mar y fotólisis acelerada
  const photolyticO3CoastEnrichmentUgm3 = regime === 'sea_breeze_active'
    ? Number((Math.min(45, (recirculationIndexPct / 100) * 35 * (solarIrradianceWm2 / 600))).toFixed(1))
    : 0;

  const seaBreezeInlandPenetrationKm = Number((seaBreezeFrontVelocityMs * 3.6 * 1.8).toFixed(1));

  // 9. Número de Froude Orográfico (Fr = U / (N * h_montes)) contra los Montes de Málaga (h ~ 800 m)
  // Frecuencia de Brunt-Väisälä N (s⁻¹) estimada analíticamente según gradiente térmico
  const h_montes = 850; // metros (Cresta de los Montes de Málaga)
  const dTheta_dz = Math.max(0.001, (regime === 'sea_breeze_active' ? 0.005 : 0.002));
  const N_bv = Math.sqrt((9.81 / T_avg) * dTheta_dz); // ~ 0.012 s⁻¹
  const u_approach_ms = Math.max(0.5, windSpeedKmh / 3.6);
  const fr_raw = u_approach_ms / (N_bv * h_montes);
  const froudeNumberOrographic = Number(fr_raw.toFixed(3));

  let orographicBlockingRegime: SeaBreezeAnalysis['orographicBlockingRegime'] = 'flow_over';
  let orographicBlockingDescription = 'Flujo orográfico continuo sin bloqueo severo (Fr >= 1.0).';

  if (froudeNumberOrographic < 0.5) {
    orographicBlockingRegime = 'blocked_stagnation';
    orographicBlockingDescription = `Bloqueo orográfico severo contra los Montes de Málaga (Fr = ${froudeNumberOrographic} < 0.5). La brisa marina queda atrapada en el anfiteatro costero, favoreciendo el estancamiento y la acumulación fotoquímica de O₃ y partículas finas.`;
  } else if (froudeNumberOrographic < 1.0) {
    orographicBlockingRegime = 'critical_wake';
    orographicBlockingDescription = `Régimen subcrítico con estancamiento parcial (0.5 <= Fr = ${froudeNumberOrographic} < 1.0). Formación de recirculación litoraleña y vórtices de ladera en el valle del Guadalhorce y centro urbano.`;
  }

  return {
    deltaT_C,
    deltaP_hPa,
    seaBreezeFrontVelocityMs,
    seaBreezeInlandPenetrationKm,
    regime,
    regimeDescription,
    recirculationIndexPct,
    coriolisDeflectionDeg,
    marineBoundaryLayerHeightM,
    photolyticO3CoastEnrichmentUgm3,
    froudeNumberOrographic,
    orographicBlockingRegime,
    orographicBlockingDescription
  };
}
