/**
 * Modelo Cinético Determinista de Fotólisis Heterogénea de Películas Superficiales Urbanas (Urban Surface Grime).
 * Emisión diurna de Ácido Nitroso (HONO), renoxificación de fachadas y pulso matinal de radicales OH•.
 * 
 * Fundamentación Científica:
 * - Donaldson & George (2012, 2014): Heterogeneous Photochemistry in the Urban Environment.
 * - Ammann et al. (2007), Stemmler et al. (2006): Photoreduction of NO2/NO3- on organic surfaces.
 * - VandenBoer et al. (2015): Daytime HONO vertical gradients and morning radical budget.
 * - Tesis Doctoral: Gemelo Digital de Calidad del Aire de Málaga.
 */

export interface UrbanGrimePoint {
  id: string;
  name: string;
  district: string;
  lat: number;
  lon: number;
  canyonHwRatio: number; // H/W (Relación altura-anchura)
  skyViewFactor: number; // SVF (Factor de visión del cielo)
  facadeAreaDensityM2M3: number; // Superficie de fachada por volumen de aire [m²/m³]
  grimeNitrateLoadingUmolM2: number; // Carga de nitrato en película de grime [µmol/m²]
  organicCarbonGrimeFraction: number; // Fracción orgánica f_org en la película [0-1]
  daytimeHonoPpb: number; // Concentración de HONO estimada a cota peatonal [ppb]
  morningOhRadicalYieldPct: number; // % de contribución de HONO al pulso matinal de OH•
  honoFluxNmolM2S: number; // Flujo superficial F_HONO [nmol/(m²·s)]
  facadeType: string;
}

export interface DiurnalHonoStep {
  hour: number;
  timeLabel: string;
  solarRadiationWm2: number;
  jHonoPerSec: number; // Tasa de fotólisis J(HONO) [s⁻¹]
  jNo2PerSec: number; // Tasa de fotólisis J(NO2) [s⁻¹]
  honoConcentrationPpb: number; // [HONO] [ppb]
  no2ConcentrationPpb: number; // [NO2] [ppb]
  ohProductionFromHono10e6: number; // P(OH) de HONO [10⁶ moléc/(cm³·s)]
  ohProductionFromO3_10e6: number; // P(OH) de O3 fotólisis [10⁶ moléc/(cm³·s)]
  honoContributionToOhPct: number; // % contribución relativa de HONO
  renoxificationRateUgm3H: number; // Renoxificación neta [µg/m³·h]
}

export interface UrbanGrimeParameters {
  tempCelsius: number;
  relativeHumidityPct: number;
  solarRadiationWm2: number;
  no2PedestrianUgm3: number;
  canyonHwRatio: number; // H/W
  skyViewFactor: number; // SVF
  grimeNitrateLoadingUmolM2: number; // típicamente 5 a 60 µmol/m²
  facadeOrganicFraction: number; // 0.1 a 0.6
  surfaceRoughnessZ0: number; // rugosidad aerodinámica z0 [m]
  canyonWindSpeedMs?: number; // velocidad real del viento en el cañón [m/s]
  canyonWidthM?: number; // ancho real de la vía activa [m]
  o3Ugm3?: number; // concentración real de ozono [µg/m³]
}

export interface UrbanGrimeSimulationResult {
  honoSurfaceFluxNmolM2S: number; // F_HONO [nmol/(m²·s)]
  steadyStateHonoPpb: number; // [HONO]_ss [ppb]
  jHonoRatePerSec: number; // J(HONO) [s⁻¹]
  ohRadicalProductionRate: number; // P(OH) [moléc/(cm³·s)]
  ohProductionFromO3Rate: number; // P(OH)_O3 [moléc/(cm³·s)]
  honoShareOfTotalOhProdPct: number; // % cuota de HONO en la capacidad oxidativa
  grimeLifetimeHours: number; // Tiempo de agotamiento de nitrato superficial [horas]
  renoxificationFluxUgm2H: number; // Flujo de renoxificación [µg/(m²·h)]
  canyonAccumulationFactor: number; // Factor de amplificación por confinamiento en cañón
  diurnalProfile: DiurnalHonoStep[];
  malagaHotspots: UrbanGrimePoint[];
  scientificInterpretation: string;
}

export const MALAGA_URBAN_GRIME_HOTSPOTS: UrbanGrimePoint[] = [
  {
    id: 'calle_larios',
    name: 'Calle Marqués de Larios (Cañón Estrecho)',
    district: 'Centro Histórico',
    lat: 36.7196,
    lon: -4.4208,
    canyonHwRatio: 2.35,
    skyViewFactor: 0.28,
    facadeAreaDensityM2M3: 0.38,
    grimeNitrateLoadingUmolM2: 48.5,
    organicCarbonGrimeFraction: 0.45,
    daytimeHonoPpb: 2.15,
    morningOhRadicalYieldPct: 54.2,
    honoFluxNmolM2S: 0.38,
    facadeType: 'Piedra caliza & Revoques tradicionales con alta absorción de SO2/NOx'
  },
  {
    id: 'alameda_principal',
    name: 'Alameda Principal (Boulevard con Dosel Arbóreo)',
    district: 'Centro-Alameda',
    lat: 36.7175,
    lon: -4.4229,
    canyonHwRatio: 0.85,
    skyViewFactor: 0.62,
    facadeAreaDensityM2M3: 0.15,
    grimeNitrateLoadingUmolM2: 32.0,
    organicCarbonGrimeFraction: 0.52,
    daytimeHonoPpb: 1.42,
    morningOhRadicalYieldPct: 41.5,
    honoFluxNmolM2S: 0.24,
    facadeType: 'Vidrio moderno, hormigón y hojas de plátanos de sombra'
  },
  {
    id: 'paseo_parque',
    name: 'Paseo del Parque / Muelle Heredia',
    district: 'Centro-Puerto',
    lat: 36.7181,
    lon: -4.4172,
    canyonHwRatio: 0.65,
    skyViewFactor: 0.74,
    facadeAreaDensityM2M3: 0.11,
    grimeNitrateLoadingUmolM2: 24.5,
    organicCarbonGrimeFraction: 0.38,
    daytimeHonoPpb: 0.95,
    morningOhRadicalYieldPct: 32.8,
    honoFluxNmolM2S: 0.16,
    facadeType: 'Fachadas costeras abiertas con deposición de sal marina'
  },
  {
    id: 'calle_victoria',
    name: 'Calle Victoria (Eje Conectivo Hacia El Ejido)',
    district: 'Centro-Norte',
    lat: 36.7265,
    lon: -4.4168,
    canyonHwRatio: 1.85,
    skyViewFactor: 0.34,
    facadeAreaDensityM2M3: 0.29,
    grimeNitrateLoadingUmolM2: 42.0,
    organicCarbonGrimeFraction: 0.41,
    daytimeHonoPpb: 1.88,
    morningOhRadicalYieldPct: 49.6,
    honoFluxNmolM2S: 0.32,
    facadeType: 'Hormigón antiguo, ladrillo caravista y tráfico continuo'
  },
  {
    id: 'avenida_andalucia',
    name: 'Avenida de Andalucía (Arteria Principal ZBE)',
    district: 'Cruz de Humilladero',
    lat: 36.7162,
    lon: -4.4332,
    canyonHwRatio: 1.10,
    skyViewFactor: 0.55,
    facadeAreaDensityM2M3: 0.19,
    grimeNitrateLoadingUmolM2: 36.8,
    organicCarbonGrimeFraction: 0.48,
    daytimeHonoPpb: 1.55,
    morningOhRadicalYieldPct: 44.0,
    honoFluxNmolM2S: 0.27,
    facadeType: 'Edificación moderna residencial de gran altura con asfalto denso'
  }
];

/**
 * Tasa de fotólisis espectral J(HONO) [s⁻¹] basada en radiación solar y ángulo cenital:
 * J(HONO) ≈ 0.185 * J(NO2), donde J(NO2) = f(Radiation, SZA).
 */
export function calculateJHono(solarRadiationWm2: number, svf: number = 1.0): number {
  if (solarRadiationWm2 <= 1.0) return 0.0;
  // J(NO2) máximo a mediodía en Málaga ~ 0.009 s⁻¹ con 950 W/m²
  const jNo2 = Math.min(0.010, (solarRadiationWm2 / 1000.0) * 0.0092 * svf);
  // Relación empírica validada por Kraus & Hofzumahaus (1998)
  const jHono = jNo2 * 0.185;
  return Math.max(0.0, jHono);
}

/**
 * Coeficiente de rendimiento cuántico de reducción de nitrato en grime orgánico:
 * Φ(NO3- -> HONO) = f(Humedad, Materia Orgánica)
 * Según Stemmler et al. (2006) y George et al. (2014):
 */
export function calculateGrimeQuantumYield(
  relativeHumidityPct: number,
  organicFraction: number
): number {
  // Rango de rendimiento: 10⁻⁵ a 5·10⁻⁴ dependiendo de f_org y solvatación
  const rhNorm = Math.min(1.0, Math.max(0.15, relativeHumidityPct / 100.0));
  const orgFactor = Math.min(1.0, Math.max(0.05, organicFraction));
  // A mayor humedad relativa, la capa deliquescente superficial promueve la transferencia de H+ del sustrato orgánico
  const baseYield = 1.2e-4;
  return baseYield * (0.4 + 0.6 * rhNorm) * (0.3 + 1.4 * orgFactor);
}

/**
 * Simulación Determinista del Ciclo de Grime y Presupuesto de HONO en Cañones Urbanos
 */
export function simulateUrbanGrimeHono(params: UrbanGrimeParameters): UrbanGrimeSimulationResult {
  const {
    tempCelsius,
    relativeHumidityPct,
    solarRadiationWm2,
    no2PedestrianUgm3,
    canyonHwRatio,
    skyViewFactor,
    grimeNitrateLoadingUmolM2,
    facadeOrganicFraction
  } = params;

  // Factor de área superficial activa del cañón por m² de suelo: S_act = 1 (suelo) + 2 * (H/W) (fachadas)
  const surfaceToFloorRatio = 1.0 + 2.0 * Math.max(0.2, canyonHwRatio);

  // Rendimiento cuántico interfacial
  const phiHono = calculateGrimeQuantumYield(relativeHumidityPct, facadeOrganicFraction);

  // Tasa de fotólisis de HONO local ajustada por SVF
  const jHono = calculateJHono(solarRadiationWm2, skyViewFactor);
  const jNo2 = jHono / 0.185;

  // Flujo superficial de HONO: F_HONO = Φ_HONO * J_NO3_eff * [NO3-_grime] * S_act
  // J_NO3_eff sobre grime ~ 2.5e-6 s⁻¹ a 1000 W/m²
  const jNo3Eff = (solarRadiationWm2 / 1000.0) * 2.8e-6 * skyViewFactor;
  // Flujo en nmol/(m²·s)
  const honoFluxNmolM2S = (grimeNitrateLoadingUmolM2 * 1000.0) * jNo3Eff * (phiHono / 1e-4) * surfaceToFloorRatio;

  // Altura efectiva de mezcla en el cañón h_canyon = W * (H/W)
  const canyonWidthM = Math.max(3.5, params.canyonWidthM ?? 15.0);
  const effectiveCanyonHeightM = Math.max(5.0, canyonWidthM * Math.max(0.5, canyonHwRatio));

  // Tasa de emisión volumétrica S_vol [ppb/s]
  // 1 nmol/m³ = 0.0245 ppb a 25°C y 1 atm
  const molarVolumeL = 22.4 * ((tempCelsius + 273.15) / 273.15); // L/mol
  const emissionRatePpbS = (honoFluxNmolM2S * 1e-9 * (molarVolumeL * 1000.0) / effectiveCanyonHeightM) * 1e9;

  // Pérdidas: Fotólisis J_HONO + ventilación de cañón k_vent (u_vent / W) + reacción con OH
  const canyonWindSpeedMs = Math.max(0.3, params.canyonWindSpeedMs ?? 1.4); // velocidad real dentro del cañón
  const kVentPerSec = (0.15 * canyonWindSpeedMs) / (canyonWidthM * (1.0 + 0.35 * canyonHwRatio)); // ventilación turbulenta con la capa superior
  const kLossTotal = Math.max(1e-4, jHono + kVentPerSec);

  // Concentración de estado estacionario de HONO [ppb]
  // Formación homogénea secundaria NO + OH -> HONO (~10-15% del total diurno)
  const no2Ppb = no2PedestrianUgm3 / 1.88;
  const noPpb = no2Ppb * 0.25; // fracción típica de NO en cañón
  const homogeneousRatePpbS = 0.00015 * noPpb * (solarRadiationWm2 / 800.0);

  const steadyStateHonoPpb = Math.max(0.05, (emissionRatePpbS + homogeneousRatePpbS) / kLossTotal);

  // Tasa de producción de radicales OH a partir de la fotólisis de HONO: P(OH)_HONO = J_HONO * [HONO]
  // Convertir ppb a moléc/cm³: 1 ppb ≈ 2.46e10 moléc/cm³ a 25°C
  const moleculesPerCm3PerPpb = 2.46e10 * (298.15 / (tempCelsius + 273.15));
  const honoMoleculesCm3 = steadyStateHonoPpb * moleculesPerCm3PerPpb;
  const ohFromHonoRate = jHono * honoMoleculesCm3; // moléc/(cm³·s)

  // Comparativa con la producción de OH por fotólisis de O3: O3 + hv -> O(1D) + H2O -> 2 OH
  // J(O1D) ~ 1.5e-5 s⁻¹ a mediodía despejado
  const jO1D = (solarRadiationWm2 / 1000.0) * 1.8e-5 * skyViewFactor;
  const o3Ppb = Math.max(4.0, (params.o3Ugm3 ?? 68.0) / 1.96); // O3 dinámico desde telemetría real
  const o3MoleculesCm3 = o3Ppb * moleculesPerCm3PerPpb;
  const waterVaporFraction = (relativeHumidityPct / 100.0) * 0.025; // fracción molar de H2O
  const ohFromO3Rate = 2.0 * jO1D * o3MoleculesCm3 * (waterVaporFraction / (waterVaporFraction + 0.1));

  const totalOhProdRate = Math.max(1.0, ohFromHonoRate + ohFromO3Rate);
  const honoSharePct = Math.min(95.0, (ohFromHonoRate / totalOhProdRate) * 100.0);

  // Tiempo de agotamiento de nitrato en el grime (sin aporte de nuevo NOx) [horas]
  const nitrateLossRateUmolM2H = (honoFluxNmolM2S * 1e-3) * 3600.0;
  const grimeLifetimeHours = nitrateLossRateUmolM2H > 0 
    ? Math.max(2.0, grimeNitrateLoadingUmolM2 / nitrateLossRateUmolM2H) 
    : 120.0;

  // Flujo de renoxificación: conversión de NO3- inerte en NOx/HONO activo [µg/(m²·h)]
  const renoxificationFluxUgm2H = (honoFluxNmolM2S * 1e-9 * 47.013 * 1e6) * 3600.0; // 47.013 g/mol HONO

  // Factor de amplificación por confinamiento en cañón respecto a terreno llano abierto
  const canyonAmplificationFactor = (surfaceToFloorRatio * (1.0 / Math.max(0.2, skyViewFactor))) * 0.45;

  // Generación del perfil diurno de 24 horas determinista
  const diurnalProfile: DiurnalHonoStep[] = [];
  const hours = Array.from({ length: 25 }, (_, i) => i);

  for (const h of hours) {
    // Curva solar diurna determinista
    const solarFactor = Math.max(0, Math.sin(((h - 6) / 14) * Math.PI));
    const hRad = h >= 6 && h <= 20 ? solarRadiationWm2 * Math.pow(solarFactor, 1.2) : 0;
    const hJHono = calculateJHono(hRad, skyViewFactor);
    const hJNo2 = hJHono / 0.185;

    // Concentración diurna: Pico temprano al amanecer (acumulación nocturna + inicio fotólisis)
    let hHonoPpb = 0.2;
    if (h >= 5 && h <= 9) {
      // Pico matinal por fotólisis inicial del reservorio nocturno acumulado
      hHonoPpb = steadyStateHonoPpb * (1.35 - (h - 5) * 0.15);
    } else if (h > 9 && h <= 18) {
      // Estado fotoestacionario diurno sostenido por el grime
      hHonoPpb = steadyStateHonoPpb * (0.8 + 0.2 * solarFactor);
    } else {
      // Acumulación nocturna lenta heterogénea NO2 + H2O -> HONO + HNO3 sobre superficies húmedas
      hHonoPpb = 0.45 + 0.15 * Math.sin(((h - 20) / 8) * Math.PI);
    }

    const hHonoMolecules = hHonoPpb * moleculesPerCm3PerPpb;
    const hOhHono = (hJHono * hHonoMolecules) / 1e6; // en 10⁶ moléc/(cm³·s)

    const hJO1D = (hRad / 1000.0) * 1.8e-5 * skyViewFactor;
    const hOhO3 = (2.0 * hJO1D * o3MoleculesCm3 * (waterVaporFraction / (waterVaporFraction + 0.1))) / 1e6;

    const hTotalOh = Math.max(0.001, hOhHono + hOhO3);
    const hHonoPct = (hOhHono / hTotalOh) * 100.0;
    const hRenox = (hHonoPpb * 1.88) * 0.12 * (hRad / 500.0);

    diurnalProfile.push({
      hour: h,
      timeLabel: `${h.toString().padStart(2, '0')}:00`,
      solarRadiationWm2: Math.round(hRad),
      jHonoPerSec: parseFloat(hJHono.toExponential(4)),
      jNo2PerSec: parseFloat(hJNo2.toExponential(4)),
      honoConcentrationPpb: parseFloat(hHonoPpb.toFixed(3)),
      no2ConcentrationPpb: parseFloat((no2Ppb * (0.8 + 0.4 * (1 - solarFactor))).toFixed(2)),
      ohProductionFromHono10e6: parseFloat(hOhHono.toFixed(3)),
      ohProductionFromO3_10e6: parseFloat(hOhO3.toFixed(3)),
      honoContributionToOhPct: parseFloat(hHonoPct.toFixed(1)),
      renoxificationRateUgm3H: parseFloat(hRenox.toFixed(2))
    });
  }

  const scientificInterpretation = `La fotólisis del nitrato adsorbido en la película de grime orgánico de las fachadas urbanas genera un flujo sostenido de HONO de ${honoFluxNmolM2S.toFixed(2)} nmol/(m²·s). En cañones urbanos estrechos con H/W = ${canyonHwRatio.toFixed(2)} y SVF = ${skyViewFactor.toFixed(2)}, el confinamiento amplifica la concentración de HONO hasta ${steadyStateHonoPpb.toFixed(2)} ppb. Su fotólisis matinal rápida constituye el ${honoSharePct.toFixed(1)}% de la tasa total de generación de radicales OH• a ras de suelo, adelantando la oxidación fotoquímica de COVs y acelerando el ciclo de Leighton antes de que la fotólisis del ozono alcance su cénit diurno.`;

  return {
    honoSurfaceFluxNmolM2S: parseFloat(honoFluxNmolM2S.toFixed(3)),
    steadyStateHonoPpb: parseFloat(steadyStateHonoPpb.toFixed(3)),
    jHonoRatePerSec: parseFloat(jHono.toExponential(4)),
    ohRadicalProductionRate: parseFloat(ohFromHonoRate.toExponential(3)),
    ohProductionFromO3Rate: parseFloat(ohFromO3Rate.toExponential(3)),
    honoShareOfTotalOhProdPct: parseFloat(honoSharePct.toFixed(1)),
    grimeLifetimeHours: parseFloat(grimeLifetimeHours.toFixed(1)),
    renoxificationFluxUgm2H: parseFloat(renoxificationFluxUgm2H.toFixed(2)),
    canyonAccumulationFactor: parseFloat(canyonAmplificationFactor.toFixed(2)),
    diurnalProfile,
    malagaHotspots: MALAGA_URBAN_GRIME_HOTSPOTS,
    scientificInterpretation
  };
}
