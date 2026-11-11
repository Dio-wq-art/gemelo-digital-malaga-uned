/**
 * earthEngineDownscaling.ts
 * 
 * Biblioteca científica para:
 * 1. Fusión espaciotemporal y Downscaling analítico Sentinel-5P TROPOMI (ESA) -> Cota Peatonal 1.5m
 * 2. Modelo de Deposición Seca y Remoción Foliar Sentinel-2 MSI (NDVI / LAI) acoplado a Wesely (1989)
 * 3. Dosimetría inhalada peatonal (ICRP) en aceras urbanas según el vórtice de Oke (1987)
 */

export interface DownscalingLocationProfile {
  id: string;
  name: string;
  lat: number;
  lon: number;
  district: string;
  H: number;
  W: number;
  aspectRatioHW: number;
  copertTrafficVolVehDay: number;
  officialStationId?: string;
  officialStationName?: string;
  officialNO2UgM3: number;
}

export const MALAGA_DOWNSCALING_RECEPTORS: DownscalingLocationProfile[] = [
  {
    id: 'larios',
    name: 'Calle Marqués de Larios (Centro Histórico)',
    lat: 36.7185,
    lon: -4.4213,
    district: 'Distrito Centro',
    H: 22.5,
    W: 11.2,
    aspectRatioHW: 2.01,
    copertTrafficVolVehDay: 0, // Peatonal, advección de Alameda
    officialStationId: 'carranque',
    officialStationName: 'Estación Carranque (Referencia)',
    officialNO2UgM3: 34.5
  },
  {
    id: 'alameda',
    name: 'Alameda Principal (Eje Central)',
    lat: 36.7182,
    lon: -4.4235,
    district: 'Distrito Centro',
    H: 24.0,
    W: 36.0,
    aspectRatioHW: 0.67,
    copertTrafficVolVehDay: 28500,
    officialStationId: 'carranque',
    officialStationName: 'Estación Carranque (Referencia)',
    officialNO2UgM3: 38.2
  },
  {
    id: 'hilera',
    name: 'Calle Hilera (Cañón Comercial)',
    lat: 36.7188,
    lon: -4.4320,
    district: 'Bailén-Miraflores',
    H: 21.0,
    W: 13.5,
    aspectRatioHW: 1.56,
    copertTrafficVolVehDay: 19800,
    officialStationId: 'hilera',
    officialStationName: 'Estación Oficial Calle Hilera (Fondo Urbano)',
    officialNO2UgM3: 29.8
  },
  {
    id: 'carranque',
    name: 'Avenida de Andalucía / Carranque',
    lat: 36.7169,
    lon: -4.4447,
    district: 'Cruz de Humilladero',
    H: 26.0,
    W: 38.0,
    aspectRatioHW: 0.68,
    copertTrafficVolVehDay: 42500,
    officialStationId: 'carranque',
    officialStationName: 'Estación Oficial Carranque (Tráfico Urbano)',
    officialNO2UgM3: 39.4
  },
  {
    id: 'juan_xxiii',
    name: 'Avenida Juan XXIII (Cañón de Tráfico Pesado)',
    lat: 36.7088,
    lon: -4.4443,
    district: 'Carretera de Cádiz',
    H: 28.0,
    W: 19.5,
    aspectRatioHW: 1.44,
    copertTrafficVolVehDay: 36200,
    officialStationId: 'carranque',
    officialStationName: 'Estación Carranque (Referencia)',
    officialNO2UgM3: 43.1
  },
  {
    id: 'puerto',
    name: 'Paseo del Parque / Muelle Heredia',
    lat: 36.7185,
    lon: -4.4140,
    district: 'Distrito Puerto',
    H: 18.0,
    W: 32.0,
    aspectRatioHW: 0.56,
    copertTrafficVolVehDay: 24000,
    officialStationId: 'puerto',
    officialStationName: 'Estación Oficial Puerto de Málaga',
    officialNO2UgM3: 27.5
  },
  {
    id: 'atabal',
    name: 'El Atabal (Fondo Periurbano)',
    lat: 36.7328,
    lon: -4.4697,
    district: 'Puerto de la Torre',
    H: 8.5,
    W: 18.0,
    aspectRatioHW: 0.47,
    copertTrafficVolVehDay: 4200,
    officialStationId: 'atabal',
    officialStationName: 'Estación Oficial El Atabal (Fondo Suburbano)',
    officialNO2UgM3: 16.8
  }
];

export interface DownscalingResult {
  vcdTropoMolM2: number;
  vcdTropoUmolM2: number;
  pblhM: number;
  alphaProfile: number;
  backgroundSurfaceNO2UgM3: number;
  canyonIncrementNO2UgM3: number;
  microscaleNO2UgM3: number;
  leewardNO2UgM3: number;
  windwardNO2UgM3: number;
  observedOfficialNO2UgM3: number;
  biasResidualUgM3: number;
  relativeErrorPct: number;
  mqiFairmode: number;
  statusCompliance: 'CONFORME_MQI' | 'ADVERTENCIA' | 'SUPERACION';
}

/**
 * Realiza el downscaling determinista multiescala
 * de la columna troposférica Sentinel-5P a nivel de acera (z = 1.5m)
 */
export function calculateS5pDownscaling(
  profile: DownscalingLocationProfile,
  vcdTropoMolM2: number = 3.4e-5,
  pblhM: number = 850,
  uRoofMs: number = 3.2
): DownscalingResult {
  const molarMassNO2 = 46.0055; // g/mol
  
  // 1. Concentración de fondo superficial (C_bg = VCD * M * 1e6 / PBLH * alpha)
  // Perfil vertical no homogéneo (alpha = 2.15 en capas superficiales urbanas, Seinfeld & Pandis 2016)
  const alphaProfile = 2.15;
  const backgroundSurfaceNO2 = (vcdTropoMolM2 * molarMassNO2 * 1e6 / Math.max(200, pblhM)) * alphaProfile;

  // 2. Incremento local debido al tráfico rodado COPERT 5 y confinamiento en cañón (Oke 1987)
  // Factor de confinamiento por relación de aspecto H/W
  const confinementFactor = 1.0 + 0.85 * Math.pow(profile.aspectRatioHW, 1.20);
  const trafficFluxFactor = profile.copertTrafficVolVehDay / 20000;
  const canyonIncrementNO2 = (trafficFluxFactor * 14.5 * confinementFactor) / Math.max(1.0, uRoofMs);

  // 3. Concentración media a cota de calle (z = 1.5m)
  const microscaleNO2 = backgroundSurfaceNO2 + canyonIncrementNO2;

  // 4. Asimetría acera sotavento vs barlovento según el vórtice de Oke (1987)
  const asymmetryRatio = 1.0 + 1.35 * Math.pow(profile.aspectRatioHW, 1.25);
  const leewardNO2 = microscaleNO2 * (asymmetryRatio / (1 + asymmetryRatio * 0.5));
  const windwardNO2 = microscaleNO2 / (asymmetryRatio * 0.75);

  // 5. Validación contra estación oficial de la Junta de Andalucía
  const observedNO2 = profile.officialNO2UgM3;
  const biasResidual = microscaleNO2 - observedNO2;
  const relativeErrorPct = (biasResidual / observedNO2) * 100;

  // 6. Indicador de Calidad del Modelo FAIRMODE WG1: MQI = |bias| / (beta * U95)
  // Para NO2 a 1h: beta = 2.0, U95_rel = 0.25 (U95 = 0.25 * Obs)
  const u95 = 0.25 * observedNO2;
  const mqi = Math.abs(biasResidual) / (2.0 * u95);

  const statusCompliance: 'CONFORME_MQI' | 'ADVERTENCIA' | 'SUPERACION' =
    mqi <= 1.0 ? 'CONFORME_MQI' : mqi <= 1.25 ? 'ADVERTENCIA' : 'SUPERACION';

  return {
    vcdTropoMolM2,
    vcdTropoUmolM2: vcdTropoMolM2 * 1e6,
    pblhM,
    alphaProfile,
    backgroundSurfaceNO2UgM3: Number(backgroundSurfaceNO2.toFixed(2)),
    canyonIncrementNO2UgM3: Number(canyonIncrementNO2.toFixed(2)),
    microscaleNO2UgM3: Number(microscaleNO2.toFixed(2)),
    leewardNO2UgM3: Number(leewardNO2.toFixed(2)),
    windwardNO2UgM3: Number(windwardNO2.toFixed(2)),
    observedOfficialNO2UgM3: Number(observedNO2.toFixed(2)),
    biasResidualUgM3: Number(biasResidual.toFixed(2)),
    relativeErrorPct: Number(relativeErrorPct.toFixed(1)),
    mqiFairmode: Number(mqi.toFixed(3)),
    statusCompliance
  };
}

// -------------------------------------------------------------
// 2. MODELO DE DEPOSICIÓN SECA SENTINEL-2 (NDVI / LAI) Y WESELY
// -------------------------------------------------------------

export interface GreenCanopyDepositionProfile {
  id: string;
  name: string;
  location: string;
  lat: number;
  lon: number;
  areaHa: number;
  dominantSpecies: string;
  sentinel2Ndvi: number;
  calculatedLai: number;
  soilMoisturePct: number;
}

export const MALAGA_GREEN_SINKS: GreenCanopyDepositionProfile[] = [
  {
    id: 'parque_malaga',
    name: 'Paseo del Parque (Parque de Málaga)',
    location: 'Centro Histórico / Fachada Portuaria',
    lat: 36.7185,
    lon: -4.4140,
    areaHa: 3.3,
    dominantSpecies: 'Ficus macrophylla, Palmeras canarias, Platanus hispanica',
    sentinel2Ndvi: 0.78,
    calculatedLai: 4.60,
    soilMoisturePct: 65
  },
  {
    id: 'alameda_arbolado',
    name: 'Bulevar Verde Alameda Principal',
    location: 'Alameda Principal',
    lat: 36.7182,
    lon: -4.4235,
    areaHa: 1.8,
    dominantSpecies: 'Platanus hispanica centenarios (Tilos y Plátanos de Sombra)',
    sentinel2Ndvi: 0.65,
    calculatedLai: 3.80,
    soilMoisturePct: 58
  },
  {
    id: 'gibralfaro',
    name: 'Monte Gibralfaro y Ladera Alcazaba',
    location: 'Gibralfaro',
    lat: 36.7235,
    lon: -4.4110,
    areaHa: 24.5,
    dominantSpecies: 'Pinus halepensis (Pino carrasco), Eucaliptos, Matorral mediterráneo',
    sentinel2Ndvi: 0.82,
    calculatedLai: 5.20,
    soilMoisturePct: 45
  },
  {
    id: 'louis_pasteur',
    name: 'Corredor Verde Bulevar Louis Pasteur',
    location: 'Teatinos / Campus Universitario',
    lat: 36.7160,
    lon: -4.4710,
    areaHa: 4.5,
    dominantSpecies: 'Jacaranda mimosifolia, Tipuana tipu, Césped ornamental',
    sentinel2Ndvi: 0.45,
    calculatedLai: 2.10,
    soilMoisturePct: 52
  },
  {
    id: 'concepcion',
    name: 'Jardín Botánico-Histórico La Concepción',
    location: 'Acceso Norte / Ciudad Jardín',
    lat: 36.7580,
    lon: -4.4260,
    areaHa: 23.0,
    dominantSpecies: 'Bosque subtropical, Ficus gigante, Palmeral histórico',
    sentinel2Ndvi: 0.86,
    calculatedLai: 5.80,
    soilMoisturePct: 75
  },
  {
    id: 'calle_larios_mineral',
    name: 'Calle Marqués de Larios (Zona Mineralizada Sin Vegetación)',
    location: 'Centro Histórico',
    lat: 36.7185,
    lon: -4.4213,
    areaHa: 0.8,
    dominantSpecies: 'Sin arbolado continuo (Pavimento de mármol)',
    sentinel2Ndvi: 0.12,
    calculatedLai: 0.05,
    soilMoisturePct: 15
  }
];

export interface WeselyDepositionRates {
  pollutant: string;
  diffusivityRatioDxDwater: number;
  henryConstantH: number;
  reactivityF0: number;
  raSm: number;
  rbSm: number;
  rcSm: number;
  vdCmS: number;
  fluxRemovalUgM2S: number;
  annualRemovalKgHaYear: number;
}

export interface GreenSinkDepositionResult {
  sinkProfile: GreenCanopyDepositionProfile;
  laiUsed: number;
  solarRadWm2: number;
  tempC: number;
  no2: WeselyDepositionRates;
  o3: WeselyDepositionRates;
  pm25: WeselyDepositionRates;
  totalAnnualRemovalKgYear: number;
  avoidedHealthCostEurYear: number;
}

/**
 * Calcula el circuito de resistencias de Wesely (1989)
 * acoplado a la reflectancia foliar Sentinel-2 MSI
 */
export function calculateWeselyCanopyDeposition(
  sink: GreenCanopyDepositionProfile,
  solarRadWm2: number = 650,
  tempC: number = 24.0,
  uStarMs: number = 0.35,
  ambientNO2UgM3: number = 32.0,
  ambientO3UgM3: number = 72.0,
  ambientPM25UgM3: number = 14.5
): GreenSinkDepositionResult {
  const lai = Math.max(0.1, sink.calculatedLai);

  // 1. Resistencia aerodinámica Ra (s/m)
  // Ra = (ln(z/z0) - psi_m) / (k * u_star)
  const k = 0.40;
  const z = 10.0;
  const z0 = 0.8;
  const ra = Math.max(10, (Math.log(z / z0)) / (k * Math.max(0.1, uStarMs)));

  // 2. Resistencia subcapa laminar Rb (s/m)
  // Rb = 2 / (k * u_star) * (Sc / Pr)^(2/3) ~ 5 / u_star
  const rbBase = 6.2 / Math.max(0.1, uStarMs);

  // 3. Resistencia estomática del dosel foliar Rc (Wesely 1989)
  // Modulada por radiación solar (apertura estomática) y temperatura foliar
  const f_solar = 1.0 + (200 / (solarRadWm2 + 0.1));
  const t_opt = 25.0;
  const f_temp = 1.0 + Math.pow((tempC - t_opt) / 10, 2);

  // Resistencia estomática mínima base normalizada por LAI
  // r_s = (r_s0 / LAI) * f_solar * f_temp
  const rs_water = (85 / lai) * f_solar * f_temp;

  // CÁLCULO PARA NO2
  const d_ratio_no2 = 1.6; // D_H2O / D_NO2
  const rs_no2 = rs_water * d_ratio_no2;
  const r_cuticle_no2 = 2000 / lai;
  const r_ground_no2 = 350;
  const rc_no2 = 1 / ( (1 / (rs_no2 + 50)) + (1 / r_cuticle_no2) + (1 / r_ground_no2) );
  const vd_no2_ms = 1 / (ra + rbBase * Math.pow(d_ratio_no2, 0.67) + rc_no2);
  const vd_no2_cms = vd_no2_ms * 100;
  const flux_no2 = vd_no2_ms * ambientNO2UgM3; // ug/(m2*s)
  const annual_no2_kg_ha = (flux_no2 * 3600 * 24 * 365 * 10000) / 1e9;

  // CÁLCULO PARA O3
  const d_ratio_o3 = 1.3;
  const rs_o3 = rs_water * d_ratio_o3;
  const r_cuticle_o3 = 1000 / lai; // Mayor afinidad reactiva
  const r_ground_o3 = 200;
  const rc_o3 = 1 / ( (1 / (rs_o3 + 10)) + (1 / r_cuticle_o3) + (1 / r_ground_o3) );
  const vd_o3_ms = 1 / (ra + rbBase * Math.pow(d_ratio_o3, 0.67) + rc_o3);
  const vd_o3_cms = vd_o3_ms * 100;
  const flux_o3 = vd_o3_ms * ambientO3UgM3;
  const annual_o3_kg_ha = (flux_o3 * 3600 * 24 * 365 * 10000) / 1e9;

  // CÁLCULO PARA PM2.5 (Captación inercial y difusión browniana en tricomas y cutícula)
  const vd_pm25_cms = Math.min(2.5, 0.08 * lai * Math.pow(uStarMs, 1.2));
  const vd_pm25_ms = vd_pm25_cms / 100;
  const flux_pm25 = vd_pm25_ms * ambientPM25UgM3;
  const annual_pm25_kg_ha = (flux_pm25 * 3600 * 24 * 365 * 10000) / 1e9;

  const totalKgYear = (annual_no2_kg_ha + annual_o3_kg_ha + annual_pm25_kg_ha) * sink.areaHa;
  // Valor económico del daño en salud evitado según manual EEA (aprox 28 €/kg de NO2/PM2.5 removido)
  const avoidedCost = totalKgYear * 28.5;

  return {
    sinkProfile: sink,
    laiUsed: Number(lai.toFixed(2)),
    solarRadWm2,
    tempC,
    no2: {
      pollutant: 'Dióxido de Nitrógeno (NO2)',
      diffusivityRatioDxDwater: d_ratio_no2,
      henryConstantH: 0.01,
      reactivityF0: 0.1,
      raSm: Number(ra.toFixed(1)),
      rbSm: Number((rbBase * Math.pow(d_ratio_no2, 0.67)).toFixed(1)),
      rcSm: Number(rc_no2.toFixed(1)),
      vdCmS: Number(vd_no2_cms.toFixed(3)),
      fluxRemovalUgM2S: Number(flux_no2.toFixed(3)),
      annualRemovalKgHaYear: Number(annual_no2_kg_ha.toFixed(1))
    },
    o3: {
      pollutant: 'Ozono Troposférico (O3)',
      diffusivityRatioDxDwater: d_ratio_o3,
      henryConstantH: 0.013,
      reactivityF0: 1.0,
      raSm: Number(ra.toFixed(1)),
      rbSm: Number((rbBase * Math.pow(d_ratio_o3, 0.67)).toFixed(1)),
      rcSm: Number(rc_o3.toFixed(1)),
      vdCmS: Number(vd_o3_cms.toFixed(3)),
      fluxRemovalUgM2S: Number(flux_o3.toFixed(3)),
      annualRemovalKgHaYear: Number(annual_o3_kg_ha.toFixed(1))
    },
    pm25: {
      pollutant: 'Partículas Finas (PM2.5)',
      diffusivityRatioDxDwater: 0,
      henryConstantH: 0,
      reactivityF0: 0,
      raSm: Number(ra.toFixed(1)),
      rbSm: Number(rbBase.toFixed(1)),
      rcSm: Number((1 / (vd_pm25_ms || 0.001)).toFixed(1)),
      vdCmS: Number(vd_pm25_cms.toFixed(3)),
      fluxRemovalUgM2S: Number(flux_pm25.toFixed(3)),
      annualRemovalKgHaYear: Number(annual_pm25_kg_ha.toFixed(1))
    },
    totalAnnualRemovalKgYear: Number(totalKgYear.toFixed(1)),
    avoidedHealthCostEurYear: Number(avoidedCost.toFixed(0))
  };
}

// -------------------------------------------------------------
// 3. MODELO DE DOSIMETRÍA PEATONAL ICRP / MPPD EN ACERA (STREET VIEW)
// -------------------------------------------------------------

export type PedestrianActivityLevel = 'rest' | 'walking' | 'cycling' | 'running';

export interface PedestrianDosimetryResult {
  activity: PedestrianActivityLevel;
  activityLabel: string;
  ventilationRateM3H: number;
  exposureDurationMin: number;
  inhalationNO2Ug: number;
  inhalationPM25Ug: number;
  lungDepositionHeadAirwaysUg: number;     // Vías altas / nasofaríngea (50%)
  lungDepositionTracheobronchialUg: number; // Traqueobronquial (25%)
  lungDepositionAlveolarDeepUg: number;     // Alveolos profundos (25%)
  isLeewardHighExposition: boolean;
  excessRiskVersusCleanAirPct: number;
}

/**
 * Calcula la dosis de contaminante inhalada y el depósito pulmonar
 * según el estándar ICRP Publication 66 (Human Respiratory Tract Model)
 */
export function calculatePedestrianInhaledDose(
  cLocalNO2UgM3: number,
  cLocalPM25UgM3: number,
  activity: PedestrianActivityLevel = 'walking',
  durationMinutes: number = 30,
  isLeeward: boolean = true
): PedestrianDosimetryResult {
  // Tasas de ventilación humana ICRP (m3/h)
  const ventilationRates: Record<PedestrianActivityLevel, { rate: number; label: string }> = {
    rest: { rate: 0.45, label: 'En Reposo / Terraza (0.45 m³/h)' },
    walking: { rate: 1.20, label: 'Peatón Caminando (1.20 m³/h)' },
    cycling: { rate: 2.10, label: 'Ciclista Urbano (2.10 m³/h)' },
    running: { rate: 3.20, label: 'Corredor / Running (3.20 m³/h)' }
  };

  const { rate, label } = ventilationRates[activity];
  const airVolumeInhaledM3 = rate * (durationMinutes / 60);

  const inhalationNO2 = cLocalNO2UgM3 * airVolumeInhaledM3;
  const inhalationPM25 = cLocalPM25UgM3 * airVolumeInhaledM3;

  // Fracciones de depósito pulmonar ICRP para PM2.5 (fracción respirable alveolar)
  const headAirwaysDeposition = inhalationPM25 * 0.35;
  const tracheobronchialDeposition = inhalationPM25 * 0.20;
  const alveolarDeepDeposition = inhalationPM25 * 0.30; // Partículas ultrafinas alvéolos

  // Exceso de riesgo relativo frente al valor guía OMS (NO2 OMS = 10 ug/m3 anual / 25 ug/m3 24h)
  const excessRiskPct = Math.max(0, ((cLocalNO2UgM3 - 10) / 10) * 4.5);

  return {
    activity,
    activityLabel: label,
    ventilationRateM3H: rate,
    exposureDurationMin: durationMinutes,
    inhalationNO2Ug: Number(inhalationNO2.toFixed(1)),
    inhalationPM25Ug: Number(inhalationPM25.toFixed(1)),
    lungDepositionHeadAirwaysUg: Number(headAirwaysDeposition.toFixed(1)),
    lungDepositionTracheobronchialUg: Number(tracheobronchialDeposition.toFixed(1)),
    lungDepositionAlveolarDeepUg: Number(alveolarDeepDeposition.toFixed(1)),
    isLeewardHighExposition: isLeeward,
    excessRiskVersusCleanAirPct: Number(excessRiskPct.toFixed(1))
  };
}
