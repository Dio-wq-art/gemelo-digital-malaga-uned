/**
 * Módulo de Mitigación por Cubiertas Vegetales, Bosques Verticales y Vegetación Urbana
 * Tesis Doctoral - Gemelo Digital de Calidad del Aire a Microescala en Málaga
 *
 * Fundamentación Física y Normativa:
 * - Modelo de Resistencia Aerodinámica y Estomática de Wesely (1989) (Atmospheric Environment 23, 1293-1304)
 *   acoplado a la capa canópica y de cubierta de tejado (Rooftop & Living Wall Boundary Layers).
 * - Absorción estomática y cuticular de NO2 según EMEP/EEA Air Pollutant Emission Inventory Guidebook 2023.
 * - Formulación determinista (Cero Aleatoriedad): Cálculos basados en el Índice de Área Foliar (LAI),
 *   Radiación Fotosintéticamente Activa (PAR), Temperatura del aire, Humedad Relativa y Fricción u*.
 * - Balances de masa en cañón urbano: Reducción local de concentración Delta [NO2] en microescala.
 */

export type VegetationTypology = 
  | 'extensive_green_roof'   // Cubiertas extensivas (Sedum, sustrato 6-12 cm, bajo mantenimiento)
  | 'intensive_green_roof'   // Cubiertas intensivas / huertos y jardines de cubierta (arbustos mediterráneos)
  | 'vertical_forest_wall'   // Bosques verticales y fachadas verdes modulares (Hedera, trepadoras, hidroponía)
  | 'urban_canopy_trees';    // Arbolado viario y de parque existente (Platanus, Ficus, Jacaranda)

export interface TypologyCharacteristics {
  id: VegetationTypology;
  name: string;
  scientificName: string;
  defaultLAI: number;           // m² hoja / m² suelo o fachada
  rsMin_s_m: number;            // Resistencia estomática mínima (s/m)
  roughnessZ0_m: number;        // Rugosidad aerodinámica z0 (m)
  canopyHeight_m: number;       // Altura canópica típica (m)
  albedo: number;               // Albedo superficial
  transpirationCooling_C: number;// Enfriamiento superficial microclimático por evapotranspiración (°C)
  description: string;
}

export const VEGETATION_TYPOLOGIES: Record<VegetationTypology, TypologyCharacteristics> = {
  extensive_green_roof: {
    id: 'extensive_green_roof',
    name: 'Cubierta Vegetal Extensiva',
    scientificName: 'Sedum album / Sedum sediforme / Crassulaceae',
    defaultLAI: 2.8,
    rsMin_s_m: 320,
    roughnessZ0_m: 0.08,
    canopyHeight_m: 0.15,
    albedo: 0.22,
    transpirationCooling_C: 2.3,
    description: 'Cubierta ligera sobre forjado con sustrato drenante de 8-12 cm. Especies crasuláceas xerófitas de bajo consumo hídrico y alta tolerancia térmica.'
  },
  intensive_green_roof: {
    id: 'intensive_green_roof',
    name: 'Cubierta Vegetal Intensiva (Jardín de Azotea)',
    scientificName: 'Rosmarinus officinalis / Lavandula dentata / Nerium oleander',
    defaultLAI: 4.6,
    rsMin_s_m: 240,
    roughnessZ0_m: 0.25,
    canopyHeight_m: 0.80,
    albedo: 0.18,
    transpirationCooling_C: 3.8,
    description: 'Jardines de azotea con sustrato fértil >30 cm y estrato arbustivo mediterráneo denso. Mayor capacidad de interceptación estomática de NO2.'
  },
  vertical_forest_wall: {
    id: 'vertical_forest_wall',
    name: 'Bosque Vertical / Fachada Verde Viva',
    scientificName: 'Hedera helix / Trachelospermum jasminoides / Lonicera japonica',
    defaultLAI: 4.2,
    rsMin_s_m: 210,
    roughnessZ0_m: 0.18,
    canopyHeight_m: 12.0,
    albedo: 0.20,
    transpirationCooling_C: 4.5,
    description: 'Muros vivos modulares y trepadoras sobre paramentos verticales en cañones urbanos. Captura directa de emisiones vehiculares a media cota antes del escape de flotabilidad.'
  },
  urban_canopy_trees: {
    id: 'urban_canopy_trees',
    name: 'Arbolado Viario Urbano Existente',
    scientificName: 'Platanus x hispanica / Ficus microcarpa / Jacaranda mimosifolia',
    defaultLAI: 4.4,
    rsMin_s_m: 190,
    roughnessZ0_m: 0.85,
    canopyHeight_m: 14.0,
    albedo: 0.16,
    transpirationCooling_C: 3.2,
    description: 'Dosel de arbolado viario y alineaciones urbanas consolidadas en calles principales, bulevares y parques históricos de la ciudad.'
  }
};

export interface QuadrantVegetationInventory {
  extensiveGreenRoofAreaM2: number;
  intensiveGreenRoofAreaM2: number;
  verticalForestAreaM2: number;
  urbanCanopyTreeAreaM2: number;
  potentialRetrofitRoofAreaM2: number;
}

export interface SimulationQuadrant {
  id: string;
  name: string;
  district: string;
  lat: number;
  lon: number;
  canyonWidthM: number;
  canyonHeightM: number;
  streetLengthM: number;
  aspectRatioHW: number;
  skyViewFactorSVF: number;
  inventory: QuadrantVegetationInventory;
  notes: string;
}

export const MALAGA_SIMULATION_QUADRANTS: SimulationQuadrant[] = [
  {
    id: 'centro_alameda',
    name: 'Cuadrante 1: Alameda Principal - Calle Larios',
    district: 'Centro Histórico',
    lat: 36.7188,
    lon: -4.4222,
    canyonWidthM: 28.0,
    canyonHeightM: 22.0,
    streetLengthM: 450.0,
    aspectRatioHW: 0.79,
    skyViewFactorSVF: 0.45,
    inventory: {
      extensiveGreenRoofAreaM2: 2400,
      intensiveGreenRoofAreaM2: 1250,
      verticalForestAreaM2: 1850,
      urbanCanopyTreeAreaM2: 8500,
      potentialRetrofitRoofAreaM2: 16500
    },
    notes: 'Corredor neurálgico con arbolado bicentenario (Platanus) y fachadas comerciales con prototipos de cubiertas en edificios administrativos.'
  },
  {
    id: 'soho_ensanche',
    name: 'Cuadrante 2: Soho - Ensanche Heredia',
    district: 'Centro - Soho',
    lat: 36.7165,
    lon: -4.4245,
    canyonWidthM: 16.0,
    canyonHeightM: 24.0,
    streetLengthM: 380.0,
    aspectRatioHW: 1.50,
    skyViewFactorSVF: 0.32,
    inventory: {
      extensiveGreenRoofAreaM2: 3200,
      intensiveGreenRoofAreaM2: 800,
      verticalForestAreaM2: 2600,
      urbanCanopyTreeAreaM2: 3100,
      potentialRetrofitRoofAreaM2: 14200
    },
    notes: 'Cañón urbano estrecho con medianeras aptas para jardines verticales de gran desarrollo y proximidad a paradas de autobuses de alta frecuencia.'
  },
  {
    id: 'paseo_parque',
    name: 'Cuadrante 3: Paseo del Parque - Malagueta',
    district: 'Centro - Este',
    lat: 36.7196,
    lon: -4.4124,
    canyonWidthM: 35.0,
    canyonHeightM: 18.0,
    streetLengthM: 800.0,
    aspectRatioHW: 0.51,
    skyViewFactorSVF: 0.65,
    inventory: {
      extensiveGreenRoofAreaM2: 1100,
      intensiveGreenRoofAreaM2: 2100,
      verticalForestAreaM2: 950,
      urbanCanopyTreeAreaM2: 32000,
      potentialRetrofitRoofAreaM2: 8500
    },
    notes: 'Ecosistema de masa forestal subtropical costera con la mayor tasa de captura biogénica per cápita de la ciudad.'
  },
  {
    id: 'carretera_cadiz',
    name: 'Cuadrante 4: Carretera de Cádiz - Huelin',
    district: 'Carretera de Cádiz',
    lat: 36.7025,
    lon: -4.4410,
    canyonWidthM: 20.0,
    canyonHeightM: 32.0,
    streetLengthM: 620.0,
    aspectRatioHW: 1.60,
    skyViewFactorSVF: 0.28,
    inventory: {
      extensiveGreenRoofAreaM2: 1800,
      intensiveGreenRoofAreaM2: 450,
      verticalForestAreaM2: 1200,
      urbanCanopyTreeAreaM2: 4200,
      potentialRetrofitRoofAreaM2: 28500
    },
    notes: 'Máxima densidad demográfica y de tráfico rodado. Cañones urbanos profundos con alto potencial de mitigación en cubiertas planas de vivienda plurifamiliar.'
  },
  {
    id: 'cruz_humilladero',
    name: 'Cuadrante 5: Cruz de Humilladero - Estación',
    district: 'Cruz de Humilladero',
    lat: 36.7120,
    lon: -4.4365,
    canyonWidthM: 24.0,
    canyonHeightM: 26.0,
    streetLengthM: 520.0,
    aspectRatioHW: 1.08,
    skyViewFactorSVF: 0.38,
    inventory: {
      extensiveGreenRoofAreaM2: 2900,
      intensiveGreenRoofAreaM2: 950,
      verticalForestAreaM2: 1400,
      urbanCanopyTreeAreaM2: 5400,
      potentialRetrofitRoofAreaM2: 22000
    },
    notes: 'Intercambiador modal y nudo viario con alta concentración de emisiones diésel. Cubiertas de centros terciarios e infraestructuras ferroviarias.'
  },
  {
    id: 'teatinos_universidad',
    name: 'Cuadrante 6: Campus Universitario de Teatinos',
    district: 'Teatinos - Universidad',
    lat: 36.7183,
    lon: -4.4735,
    canyonWidthM: 40.0,
    canyonHeightM: 16.0,
    streetLengthM: 700.0,
    aspectRatioHW: 0.40,
    skyViewFactorSVF: 0.72,
    inventory: {
      extensiveGreenRoofAreaM2: 6800,
      intensiveGreenRoofAreaM2: 3400,
      verticalForestAreaM2: 3100,
      urbanCanopyTreeAreaM2: 14500,
      potentialRetrofitRoofAreaM2: 35000
    },
    notes: 'Edificación moderna bioclimática con cubiertas experimentales de investigación y amplios bulevares ajardinados.'
  },
  {
    id: 'puerto_darsena',
    name: 'Cuadrante 7: Dársena del Puerto - Muelle Dos',
    district: 'Distrito Portuario',
    lat: 36.7153,
    lon: -4.4172,
    canyonWidthM: 45.0,
    canyonHeightM: 12.0,
    streetLengthM: 500.0,
    aspectRatioHW: 0.27,
    skyViewFactorSVF: 0.85,
    inventory: {
      extensiveGreenRoofAreaM2: 1500,
      intensiveGreenRoofAreaM2: 1800,
      verticalForestAreaM2: 800,
      urbanCanopyTreeAreaM2: 7800,
      potentialRetrofitRoofAreaM2: 12000
    },
    notes: 'Pérgola bioclimática del Palmeral de las Sorpresas y azoteas comerciales con amortiguamiento del penacho marino portuario.'
  },
  {
    id: 'pta_campanillas',
    name: 'Cuadrante 8: Campanillas - Parque Tecnológico (PTA)',
    district: 'Campanillas',
    lat: 36.7380,
    lon: -4.5510,
    canyonWidthM: 32.0,
    canyonHeightM: 14.0,
    streetLengthM: 900.0,
    aspectRatioHW: 0.44,
    skyViewFactorSVF: 0.78,
    inventory: {
      extensiveGreenRoofAreaM2: 5200,
      intensiveGreenRoofAreaM2: 2600,
      verticalForestAreaM2: 1700,
      urbanCanopyTreeAreaM2: 18000,
      potentialRetrofitRoofAreaM2: 48000
    },
    notes: 'Sector periurbano donde confluyen la ventilación del Valle del Guadalhorce, fotorreactividad de ozono y cubiertas técnicas empresariales.'
  }
];

export interface TypologyDepositionMetrics {
  typology: VegetationTypology;
  name: string;
  areaM2: number;
  effectiveLAI: number;
  ra_s_m: number;
  rb_s_m: number;
  rs_s_m: number;
  rc_s_m: number;
  vd_cm_s: number;
  no2Flux_ug_m2_s: number;
  no2RemovalGramsPerHour: number;
  no2RemovalKgPerMonth: number;
  no2RemovalKgPerYear: number;
}

export interface QuadrantMitigationResult {
  quadrant: SimulationQuadrant;
  timestamp: string;
  ambientConditions: {
    tempC: number;
    rhPct: number;
    parWm2: number;
    windSpeedMs: number;
    ustarMs: number;
    baselineNO2_ug_m3: number;
  };
  typologies: TypologyDepositionMetrics[];
  totals: {
    totalGreenAreaM2: number;
    totalNo2RemovalGramsPerHour: number;
    totalNo2RemovalKgPerMonth: number;
    totalNo2RemovalKgPerYear: number;
    weightedVd_cm_s: number;
    effectiveQuadrantDeltaNO2_ug_m3: number;
    mitigationEfficiencyPct: number;
    mitigatedNO2_ug_m3: number;
    potentialWithRetrofitKgPerYear: number;
  };
  urbanCanyonPhysics: {
    canopyAirVolumeM3: number;
    airExchangeRatePerHour: number;
    ventilationFluxM3_s: number;
    meanCanyonWindMs: number;
  };
}

/**
 * Calcula la deposición seca de NO2 según el modelo de resistencia de Wesely (1989)
 * adaptado a la morfología de cubiertas y paramentos verticales.
 */
export function calculateTypologyDeposition(
  typologyKey: VegetationTypology,
  areaM2: number,
  tempC: number,
  rhPct: number,
  parWm2: number,
  windSpeedMs: number,
  ustarMs: number,
  baselineNO2_ug_m3: number
): TypologyDepositionMetrics {
  const typo = VEGETATION_TYPOLOGIES[typologyKey];
  const kKarm = 0.40; // Constante de von Kármán
  const scPrRatio = 1.6; // Ratio Schmidt/Prandtl para NO2 en fase gaseosa
  const zRef = Math.max(10.0, typo.canopyHeight_m * 2.0);

  // 1. Resistencia Aerodinámica R_a (s/m)
  // R_a = ln(zRef / z0) / (k * u*)
  const safeUstar = Math.max(0.08, ustarMs);
  const ra = Math.max(4.0, Math.log(zRef / typo.roughnessZ0_m) / (kKarm * safeUstar));

  // 2. Resistencia Cuasi-Laminar de Capa Límite Foliar R_b (s/m)
  // R_b = 2 / (k * u*) * (Sc / Pr)^(2/3)
  const rb = (2.0 / (kKarm * safeUstar)) * Math.pow(scPrRatio, 2 / 3);

  // 3. Resistencia Estomática R_s (s/m) según Wesely (1989)
  // Dependiente de irradiancia PAR, temperatura foliar óptima (20-30°C) y humedad relativa
  const safeTemp = Math.min(39.5, Math.max(0.5, tempC));
  const tempFactor = Math.max(1.0, 400.0 / (safeTemp * (40.0 - safeTemp)));
  const parFactor = 1.0 + Math.pow(200.0 / (Math.max(1.0, parWm2) + 0.1), 2);
  
  // Factor de déficit de presión de vapor / humedad (cierre estomático por sequedad atmosférica)
  const rhNorm = Math.min(1.0, Math.max(0.2, rhPct / 100.0));
  const rhFactor = 1.0 + 0.35 * Math.pow((1.0 - rhNorm) / 0.8, 2);

  const rs = (typo.rsMin_s_m * parFactor * tempFactor * rhFactor * scPrRatio) / Math.max(0.5, typo.defaultLAI);

  // 4. Resistencia Cutilar R_cut y Mesofílica R_mes (s/m)
  // Para NO2: reactividad f0 = 0.1, solubilidad H = 1e-2 M/atm
  const rCut = 2000.0 / (0.15 * typo.defaultLAI);
  const rMes = 10.0; // Captura rápida en el apoplasto y conversión a nitratos/nitritos

  // Resistencia Canópica Total R_c (s/m)
  const invRc = (1.0 / Math.max(1.0, rs)) + (1.0 / rMes) + (1.0 / rCut);
  const rc = 1.0 / Math.max(1e-5, invRc);

  // 5. Velocidad de Deposición v_d = 1 / (R_a + R_b + R_c)
  const vd_m_s = 1.0 / (ra + rb + rc);
  const vd_cm_s = vd_m_s * 100.0;

  // 6. Flujo de Deposición F_d = v_d * C (µg/m² s)
  const flux_ug_m2_s = vd_m_s * Math.max(1.0, baselineNO2_ug_m3);

  // 7. Tasas de remoción másica deterministas
  const removalGramsPerHour = (flux_ug_m2_s * areaM2 * 3600.0) / 1e6;
  const removalKgPerMonth = (removalGramsPerHour * 24.0 * 30.0) / 1e3;
  const removalKgPerYear = removalKgPerMonth * 12.0;

  return {
    typology: typologyKey,
    name: typo.name,
    areaM2,
    effectiveLAI: typo.defaultLAI,
    ra_s_m: Number(ra.toFixed(1)),
    rb_s_m: Number(rb.toFixed(1)),
    rs_s_m: Number(rs.toFixed(1)),
    rc_s_m: Number(rc.toFixed(1)),
    vd_cm_s: Number(vd_cm_s.toFixed(3)),
    no2Flux_ug_m2_s: Number(flux_ug_m2_s.toFixed(3)),
    no2RemovalGramsPerHour: Number(removalGramsPerHour.toFixed(2)),
    no2RemovalKgPerMonth: Number(removalKgPerMonth.toFixed(2)),
    no2RemovalKgPerYear: Number(removalKgPerYear.toFixed(2))
  };
}

/**
 * Calcula la mitigación integral de NO2 en el cuadrante de simulación actual
 */
export function calculateQuadrantMitigation(
  quadrant: SimulationQuadrant,
  tempC: number,
  rhPct: number,
  parWm2: number,
  windSpeedMs: number,
  ustarMs: number,
  baselineNO2_ug_m3: number
): QuadrantMitigationResult {
  const inv = quadrant.inventory;

  // Cálculo individual para cada tipología en el cuadrante
  const extRoof = calculateTypologyDeposition(
    'extensive_green_roof',
    inv.extensiveGreenRoofAreaM2,
    tempC, rhPct, parWm2, windSpeedMs, ustarMs, baselineNO2_ug_m3
  );

  const intRoof = calculateTypologyDeposition(
    'intensive_green_roof',
    inv.intensiveGreenRoofAreaM2,
    tempC, rhPct, parWm2, windSpeedMs, ustarMs, baselineNO2_ug_m3
  );

  const vertForest = calculateTypologyDeposition(
    'vertical_forest_wall',
    inv.verticalForestAreaM2,
    tempC, rhPct, parWm2, windSpeedMs, ustarMs, baselineNO2_ug_m3
  );

  const canopyTrees = calculateTypologyDeposition(
    'urban_canopy_trees',
    inv.urbanCanopyTreeAreaM2,
    tempC, rhPct, parWm2, windSpeedMs, ustarMs, baselineNO2_ug_m3
  );

  const typologies = [extRoof, intRoof, vertForest, canopyTrees];

  // Totales
  const totalGreenAreaM2 = inv.extensiveGreenRoofAreaM2 + inv.intensiveGreenRoofAreaM2 + 
                           inv.verticalForestAreaM2 + inv.urbanCanopyTreeAreaM2;

  const totalRemovalGramsPerHour = typologies.reduce((sum, t) => sum + t.no2RemovalGramsPerHour, 0);
  const totalRemovalKgPerMonth = typologies.reduce((sum, t) => sum + t.no2RemovalKgPerMonth, 0);
  const totalRemovalKgPerYear = typologies.reduce((sum, t) => sum + t.no2RemovalKgPerYear, 0);

  // Velocidad de deposición ponderada por área
  const weightedVd_cm_s = totalGreenAreaM2 > 0
    ? typologies.reduce((sum, t) => sum + t.vd_cm_s * t.areaM2, 0) / totalGreenAreaM2
    : 0.25;

  // Física del cañón urbano y volumen de control
  const canyonWidth = quadrant.canyonWidthM;
  const canyonHeight = quadrant.canyonHeightM;
  const streetLength = quadrant.streetLengthM;
  const canyonVolumeM3 = canyonWidth * canyonHeight * streetLength;

  // Velocidad del viento en fondo de cañón (atenuada por rozamiento de paredes y dosel)
  const meanCanyonWindMs = Math.max(0.3, windSpeedMs * (0.35 + 0.15 * quadrant.skyViewFactorSVF));
  // Flujo de ventilación horizontal a través de la sección transversal: Q_vent = W * H * U_canyon (m³/s)
  const ventilationFluxM3_s = canyonWidth * canyonHeight * meanCanyonWindMs;
  const airExchangeRatePerHour = Math.max(1.0, (ventilationFluxM3_s * 3600.0) / canyonVolumeM3);

  // Reducción neta local de concentración en la capa canópica:
  // Delta C = Total_Removal_Flux (µg/s) / Q_vent (m³/s) = µg/m³
  const totalRemovalUgPerS = (totalRemovalGramsPerHour * 1e6) / 3600.0;
  const effectiveDeltaNO2 = Number((totalRemovalUgPerS / Math.max(10.0, ventilationFluxM3_s)).toFixed(2));
  
  const mitigatedNO2 = Number(Math.max(1.0, baselineNO2_ug_m3 - effectiveDeltaNO2).toFixed(2));
  const efficiencyPct = Number(((effectiveDeltaNO2 / Math.max(1.0, baselineNO2_ug_m3)) * 100.0).toFixed(1));

  // Potencial adicional si se activa el área de retrofit de azoteas con cubiertas extensivas
  const retrofitExtRoof = calculateTypologyDeposition(
    'extensive_green_roof',
    inv.potentialRetrofitRoofAreaM2,
    tempC, rhPct, parWm2, windSpeedMs, ustarMs, baselineNO2_ug_m3
  );
  const potentialWithRetrofitKgPerYear = Number((totalRemovalKgPerYear + retrofitExtRoof.no2RemovalKgPerYear).toFixed(1));

  return {
    quadrant,
    timestamp: new Date().toISOString(),
    ambientConditions: {
      tempC: Number(tempC.toFixed(1)),
      rhPct: Number(rhPct.toFixed(1)),
      parWm2: Number(parWm2.toFixed(1)),
      windSpeedMs: Number(windSpeedMs.toFixed(1)),
      ustarMs: Number(ustarMs.toFixed(2)),
      baselineNO2_ug_m3: Number(baselineNO2_ug_m3.toFixed(1))
    },
    typologies,
    totals: {
      totalGreenAreaM2,
      totalNo2RemovalGramsPerHour: Number(totalRemovalGramsPerHour.toFixed(2)),
      totalNo2RemovalKgPerMonth: Number(totalRemovalKgPerMonth.toFixed(2)),
      totalNo2RemovalKgPerYear: Number(totalRemovalKgPerYear.toFixed(2)),
      weightedVd_cm_s: Number(weightedVd_cm_s.toFixed(3)),
      effectiveQuadrantDeltaNO2_ug_m3: effectiveDeltaNO2,
      mitigationEfficiencyPct: efficiencyPct,
      mitigatedNO2_ug_m3: mitigatedNO2,
      potentialWithRetrofitKgPerYear
    },
    urbanCanyonPhysics: {
      canopyAirVolumeM3: Math.round(canyonVolumeM3),
      airExchangeRatePerHour: Number(airExchangeRatePerHour.toFixed(1)),
      ventilationFluxM3_s: Math.round(ventilationFluxM3_s),
      meanCanyonWindMs: Number(meanCanyonWindMs.toFixed(2))
    }
  };
}

/**
 * Exportación GeoJSON estandarizada FAIR para ciencia abierta
 */
export function exportGreenRoofMitigationGeoJson(
  results: QuadrantMitigationResult[]
): string {
  const features = results.map(r => {
    const q = r.quadrant;
    // Creamos un polígono representativo del cuadrante alrededor del punto central
    const dLat = 0.0025;
    const dLon = 0.0035;
    const coords = [
      [
        [Number((q.lon - dLon).toFixed(6)), Number((q.lat - dLat).toFixed(6))],
        [Number((q.lon + dLon).toFixed(6)), Number((q.lat - dLat).toFixed(6))],
        [Number((q.lon + dLon).toFixed(6)), Number((q.lat + dLat).toFixed(6))],
        [Number((q.lon - dLon).toFixed(6)), Number((q.lat + dLat).toFixed(6))],
        [Number((q.lon - dLon).toFixed(6)), Number((q.lat - dLat).toFixed(6))]
      ]
    ];

    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: coords
      },
      properties: {
        quadrant_id: q.id,
        name: q.name,
        district: q.district,
        center_lat: q.lat,
        center_lon: q.lon,
        baseline_no2_ug_m3: r.ambientConditions.baselineNO2_ug_m3,
        mitigated_no2_ug_m3: r.totals.mitigatedNO2_ug_m3,
        delta_no2_reduction_ug_m3: r.totals.effectiveQuadrantDeltaNO2_ug_m3,
        mitigation_efficiency_pct: r.totals.mitigationEfficiencyPct,
        total_green_area_m2: r.totals.totalGreenAreaM2,
        extensive_green_roof_m2: q.inventory.extensiveGreenRoofAreaM2,
        intensive_green_roof_m2: q.inventory.intensiveGreenRoofAreaM2,
        vertical_forest_m2: q.inventory.verticalForestAreaM2,
        canopy_trees_m2: q.inventory.urbanCanopyTreeAreaM2,
        potential_retrofit_roof_m2: q.inventory.potentialRetrofitRoofAreaM2,
        no2_absorption_g_per_h: r.totals.totalNo2RemovalGramsPerHour,
        no2_absorption_kg_per_month: r.totals.totalNo2RemovalKgPerMonth,
        no2_absorption_kg_per_year: r.totals.totalNo2RemovalKgPerYear,
        potential_no2_absorption_kg_per_year: r.totals.potentialWithRetrofitKgPerYear,
        weighted_deposition_velocity_cm_s: r.totals.weightedVd_cm_s,
        canyon_aspect_ratio_hw: q.aspectRatioHW,
        sky_view_factor_svf: q.skyViewFactorSVF,
        canyon_volume_m3: r.urbanCanyonPhysics.canopyAirVolumeM3,
        air_exchange_rate_per_h: r.urbanCanyonPhysics.airExchangeRatePerHour,
        scientific_standard: "Wesely 1989 / EMEP-EEA 2023 / Directiva 2008/50/CE",
        timestamp: r.timestamp
      }
    };
  });

  const geoJson = {
    type: "FeatureCollection",
    metadata: {
      title: "Malla de Mitigación por Cubiertas Vegetales y Bosques Verticales - Málaga",
      source: "Gemelo Digital Informado por la Física (PINN / Wesely 1989)",
      author: "Dionisio Gálvez Pozo (Doctorando UNED)",
      generated_at: new Date().toISOString(),
      institution: "Universidad Nacional de Educación a Distancia (UNED) - EIDUNED / Tesis Doctoral",
      crs: "EPSG:4326"
    },
    features
  };

  return JSON.stringify(geoJson, null, 2);
}

/**
 * Exportación CSV estandarizada FAIR
 */
export function exportGreenRoofMitigationCsv(
  results: QuadrantMitigationResult[]
): string {
  const headers = [
    "ID_Cuadrante",
    "Nombre_Cuadrante",
    "Distrito",
    "Latitud",
    "Longitud",
    "Area_Total_Vegetada_m2",
    "Area_Cubierta_Extensiva_m2",
    "Area_Cubierta_Intensiva_m2",
    "Area_Bosque_Vertical_m2",
    "Area_Arbolado_Viario_m2",
    "Area_Potencial_Retrofit_m2",
    "NO2_Base_ug_m3",
    "NO2_Mitigado_ug_m3",
    "Reduccion_Delta_NO2_ug_m3",
    "Eficiencia_Mitigacion_Pct",
    "Absorcion_NO2_g_h",
    "Absorcion_NO2_kg_mes",
    "Absorcion_NO2_kg_ano",
    "Potencial_Con_Retrofit_kg_ano",
    "Velocidad_Deposicion_vd_cm_s",
    "Temp_C",
    "Humedad_Relativa_Pct",
    "PAR_W_m2",
    "Viento_Canyon_m_s",
    "Volumen_Canopy_m3",
    "Tasa_Renovacion_Aire_h1",
    "Normativa_Referencia"
  ];

  const rows = results.map(r => {
    const q = r.quadrant;
    return [
      `"${q.id}"`,
      `"${q.name}"`,
      `"${q.district}"`,
      q.lat,
      q.lon,
      r.totals.totalGreenAreaM2,
      q.inventory.extensiveGreenRoofAreaM2,
      q.inventory.intensiveGreenRoofAreaM2,
      q.inventory.verticalForestAreaM2,
      q.inventory.urbanCanopyTreeAreaM2,
      q.inventory.potentialRetrofitRoofAreaM2,
      r.ambientConditions.baselineNO2_ug_m3,
      r.totals.mitigatedNO2_ug_m3,
      r.totals.effectiveQuadrantDeltaNO2_ug_m3,
      r.totals.mitigationEfficiencyPct,
      r.totals.totalNo2RemovalGramsPerHour,
      r.totals.totalNo2RemovalKgPerMonth,
      r.totals.totalNo2RemovalKgPerYear,
      r.totals.potentialWithRetrofitKgPerYear,
      r.totals.weightedVd_cm_s,
      r.ambientConditions.tempC,
      r.ambientConditions.rhPct,
      r.ambientConditions.parWm2,
      r.urbanCanyonPhysics.meanCanyonWindMs,
      r.urbanCanyonPhysics.canopyAirVolumeM3,
      r.urbanCanyonPhysics.airExchangeRatePerHour,
      `"Wesely 1989 / EMEP-EEA 2023"`
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}
