/**
 * Motor Determinista de Capacidad Específica de Remoción de NOx por Metro Cuadrado de Fachada
 * Estructuras de Bosque Vertical y Fachadas Verdes Vivas
 * Tesis Doctoral - Gemelo Digital de Calidad del Aire a Microescala en Málaga
 *
 * Fundamentación Física y Normativa:
 * 1. Modelo de Resistencias de Wesely (1989) adaptado a capas límite de paramento vertical:
 *    vd = 1 / (Ra + Rb + Rc)
 *    Rc = (1/Rs + 1/Rmes + 1/Rcut)^(-1)
 * 2. Balance estomático regulado por PAR, temperatura foliar, humedad relativa (VPD) y LAI
 * 3. Asimetría de flujo en cañones urbanos (Pugh et al., 2012, Environ. Sci. Technol.):
 *    Efecto de la pared de sotavento (leeward wall) donde el vórtice de recirculación concentra
 *    hasta 1.35x - 1.55x los contaminantes vehiculares respecto a la pared de barlovento.
 * 4. Trazabilidad EMEP/EEA 2023 y Directiva 2008/50/CE.
 * 5. Cero Aleatoriedad: Formulación analítica estrictamente determinista.
 */

export interface VerticalForestPlantSpecies {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  typology: 'Trepadoras Lignificadas' | 'Enredadera Perenne' | 'Caducifolia Rápida' | 'Módulo Hidropónico / Muro Vivo' | 'Arbusto de Espaldera';
  defaultLAI: number; // m² hoja / m² fachada (Índice de Área Foliar vertical)
  rsMin_s_m: number; // Resistencia estomática mínima en s/m (condiciones óptimas)
  roughnessZ0_m: number; // Rugosidad aerodinámica z0 en m
  cdDragCoef: number; // Coeficiente de arrastre en fachada (adimensional)
  baseVdNO2_cm_s: number; // Velocidad de deposición base de referencia a 20°C y PAR 400 W/m²
  bvocIsopreneRate: number; // Emisión de isopreno (µg/g·h @ 30°C)
  bvocTerpeneRate: number; // Emisión de monoterpenos (µg/g·h @ 30°C)
  summerCoolingC: number; // Reducción de temperatura superficial por evapotranspiración (°C)
  foliageRetention: 'Perenne' | 'Caducifolia' | 'Semipersistente';
  trichomeDensity: 'Alta (vellosa)' | 'Coriácea cerosa' | 'Media lisa' | 'Microvellosa';
  typicalMalagaApplication: string;
  scientificReference: string;
}

/**
 * Base de datos de especies botánicas certificadas para bosques verticales y fachadas verdes en clima mediterráneo (Málaga)
 */
export const VERTICAL_FOREST_SPECIES_DATABASE: VerticalForestPlantSpecies[] = [
  {
    id: 'hedera_helix',
    commonName: 'Hiedra Común Mediterránea',
    scientificName: 'Hedera helix subsp. helix',
    family: 'Araliaceae',
    typology: 'Enredadera Perenne',
    defaultLAI: 4.6,
    rsMin_s_m: 210,
    roughnessZ0_m: 0.16,
    cdDragCoef: 0.045,
    baseVdNO2_cm_s: 0.48,
    bvocIsopreneRate: 0.15,
    bvocTerpeneRate: 0.35,
    summerCoolingC: 4.2,
    foliageRetention: 'Perenne',
    trichomeDensity: 'Coriácea cerosa',
    typicalMalagaApplication: 'Fachadas de centros históricos, muros ciegos y medianeras en cañones urbanos estrechos (C/ Larios, C/ Camas, Soho).',
    scientificReference: 'Pugh et al. (2012); Marchi et al. (2015); Weerakkody et al. (2018).'
  },
  {
    id: 'trachelospermum_jasminoides',
    commonName: 'Jazmín Estrellado / Falso Jazmín',
    scientificName: 'Trachelospermum jasminoides',
    family: 'Apocynaceae',
    typology: 'Trepadoras Lignificadas',
    defaultLAI: 4.3,
    rsMin_s_m: 215,
    roughnessZ0_m: 0.15,
    cdDragCoef: 0.048,
    baseVdNO2_cm_s: 0.45,
    bvocIsopreneRate: 0.20,
    bvocTerpeneRate: 0.40,
    summerCoolingC: 3.9,
    foliageRetention: 'Perenne',
    trichomeDensity: 'Coriácea cerosa',
    typicalMalagaApplication: 'Estructuras de celosía vertical en patios de manzana y avenidas ventiladas (Avda. Andalucía, Paseo de Sancha).',
    scientificReference: 'Abhijith et al. (2017); EMEP/EEA Guidebook (2023).'
  },
  {
    id: 'parthenocissus_tricuspidata',
    commonName: 'Parra Virgen / Enamorada del Muro',
    scientificName: 'Parthenocissus tricuspidata',
    family: 'Vitaceae',
    typology: 'Caducifolia Rápida',
    defaultLAI: 4.9,
    rsMin_s_m: 195,
    roughnessZ0_m: 0.18,
    cdDragCoef: 0.052,
    baseVdNO2_cm_s: 0.47,
    bvocIsopreneRate: 0.30,
    bvocTerpeneRate: 0.25,
    summerCoolingC: 4.8,
    foliageRetention: 'Caducifolia',
    trichomeDensity: 'Media lisa',
    typicalMalagaApplication: 'Fachadas con orientación sur-oeste de alta insolación estival que requieren máximo enfriamiento y absorción de NO2.',
    scientificReference: 'Sternberg et al. (2010); Perini et al. (2017).'
  },
  {
    id: 'lonicera_japonica',
    commonName: 'Madreselva de Jardín',
    scientificName: 'Lonicera japonica',
    family: 'Caprifoliaceae',
    typology: 'Trepadoras Lignificadas',
    defaultLAI: 3.9,
    rsMin_s_m: 230,
    roughnessZ0_m: 0.14,
    cdDragCoef: 0.042,
    baseVdNO2_cm_s: 0.42,
    bvocIsopreneRate: 0.18,
    bvocTerpeneRate: 0.55,
    summerCoolingC: 3.5,
    foliageRetention: 'Semipersistente',
    trichomeDensity: 'Microvellosa',
    typicalMalagaApplication: 'Corredores perimetrales y pantallas acústicas-vegetales litorales (Huelin, Pedregalejo).',
    scientificReference: 'Viecco et al. (2018); Wesely (1989).'
  },
  {
    id: 'living_wall_modular',
    commonName: 'Módulo Vivo Hidropónico (Heuchera + Carex + Nephrolepis)',
    scientificName: 'Heuchera sanguinea / Carex pendula / Nephrolepis exaltata',
    family: 'Saxifragaceae / Cyperaceae',
    typology: 'Módulo Hidropónico / Muro Vivo',
    defaultLAI: 5.3,
    rsMin_s_m: 180,
    roughnessZ0_m: 0.22,
    cdDragCoef: 0.065,
    baseVdNO2_cm_s: 0.54,
    bvocIsopreneRate: 0.10,
    bvocTerpeneRate: 0.20,
    summerCoolingC: 5.1,
    foliageRetention: 'Perenne',
    trichomeDensity: 'Alta (vellosa)',
    typicalMalagaApplication: 'Sistemas tecnificados modulares de alto rendimiento en túneles urbanos, accesos a aparcamientos y sedes corporativas.',
    scientificReference: 'Pugh et al. (2012); Weerakkody et al. (2018); FAIRMODE WG1.'
  },
  {
    id: 'pyracantha_coccinea',
    commonName: 'Espino de Fuego / Piracanta',
    scientificName: 'Pyracantha coccinea',
    family: 'Rosaceae',
    typology: 'Arbusto de Espaldera',
    defaultLAI: 4.1,
    rsMin_s_m: 220,
    roughnessZ0_m: 0.19,
    cdDragCoef: 0.058,
    baseVdNO2_cm_s: 0.43,
    bvocIsopreneRate: 0.12,
    bvocTerpeneRate: 0.30,
    summerCoolingC: 3.6,
    foliageRetention: 'Perenne',
    trichomeDensity: 'Coriácea cerosa',
    typicalMalagaApplication: 'Espalderas de bajo mantenimiento adosadas a muros viarios con alta exposición a partículas diésel.',
    scientificReference: 'Sæbø et al. (2012); Beckett et al. (2000).'
  }
];

export interface FacadeNOxRemovalResult {
  species: VerticalForestPlantSpecies;
  ambientConditions: {
    tempC: number;
    rhPct: number;
    parWm2: number;
    windSpeedMs: number;
    ustarMs: number;
    ambientNO2_ug_m3: number;
  };
  resistances: {
    ra_s_m: number;
    rb_s_m: number;
    rs_s_m: number;
    rc_s_m: number;
    totalResistance_s_m: number;
  };
  effectiveVd_cm_s: number;
  specificCapacity: {
    instantaneousFlux_ug_m2_s: number; // Flujo instantáneo µg/(m² fachada · s)
    hourlyRemovalG_m2_h: number; // g NOx / (m² fachada · hora)
    dailyRemovalMg_m2_day: number; // mg NOx / (m² fachada · día)
    annualRemovalG_m2_year: number; // g NOx / (m² fachada · año)
    annualRemovalKg_per_100m2_year: number; // kg NOx / (100 m² fachada · año)
  };
  canyonAsymmetry: {
    leewardFlux_ug_m2_s: number; // Pared de sotavento (vórtice concentra NOx)
    leewardAnnualRemovalG_m2_year: number;
    windwardFlux_ug_m2_s: number; // Pared de barlovento
    windwardAnnualRemovalG_m2_year: number;
    vortexConcentrationFactor: number; // Factor de sobreconcentración en sotavento (~1.42)
  };
  comparisonWithTrees: {
    treeAverageAnnualRemovalG_m2_footprint: number; // g NOx / m² de huella de árbol viario
    relativeAdvantagePct: number; // Ventaja relativa en cañón urbano
    aerodynamicPenalizationAvoided: boolean; // No genera el taponamiento horizontal de copa
  };
}

/**
 * Calcula de manera analítica determinista la capacidad de remoción de NOx por metro cuadrado de fachada
 * basada en la formulación de Wesely (1989) y las características botánicas de la especie seleccionada.
 */
export function calculateFacadeNOxRemoval(
  species: VerticalForestPlantSpecies,
  tempC: number,
  rhPct: number,
  parWm2: number,
  windSpeedMs: number,
  ustarMs: number,
  ambientNO2_ug_m3: number,
  customLAI?: number
): FacadeNOxRemovalResult {
  const activeLAI = Math.max(1.0, customLAI ?? species.defaultLAI);
  const kKarm = 0.40; // Constante de von Kármán
  const scPrRatio = 1.6; // Ratio Schmidt/Prandtl para NO2 en fase gaseosa
  const zRef = 10.0; // Altura de referencia estándar en cañón (m)

  // 1. Resistencia Aerodinámica Ra (s/m)
  // Sobre paramento vertical: z0_fachada modula la turbulencia de cizalladura en pared
  const safeUstar = Math.max(0.08, ustarMs);
  const ra = Math.max(3.0, Math.log(zRef / Math.max(0.01, species.roughnessZ0_m)) / (kKarm * safeUstar));

  // 2. Resistencia Cuasi-Laminar de Capa Límite Foliar Rb (s/m)
  const rb = (2.0 / (kKarm * safeUstar)) * Math.pow(scPrRatio, 2 / 3);

  // 3. Resistencia Estomática Rs (s/m) según Wesely (1989)
  // Dependiente de radiación PAR, temperatura óptima foliar (20-30°C) y déficit de humedad (VPD)
  const safeTemp = Math.min(39.5, Math.max(1.0, tempC));
  const tempFactor = Math.max(1.0, 400.0 / (safeTemp * (40.0 - safeTemp)));
  const parFactor = 1.0 + Math.pow(200.0 / (Math.max(1.0, parWm2) + 0.1), 2);
  const rhNorm = Math.min(1.0, Math.max(0.2, rhPct / 100.0));
  const rhFactor = 1.0 + 0.30 * Math.pow((1.0 - rhNorm) / 0.8, 2);

  const rs = (species.rsMin_s_m * parFactor * tempFactor * rhFactor * scPrRatio) / activeLAI;

  // 4. Resistencias Cuticular (Rcut) y Mesofílica (Rmes) (s/m)
  // Para NO2: absorción en cutícula cerosa y metabolización apoplástica a nitratos/nitritos
  const rCut = 2200.0 / (0.16 * activeLAI);
  const rMes = 12.0; // Rápida captación intracelular por nitrato reductasa

  // Resistencia Canópica Total Rc (s/m)
  const invRc = (1.0 / Math.max(1.0, rs)) + (1.0 / rMes) + (1.0 / rCut);
  const rc = 1.0 / Math.max(1e-5, invRc);

  // 5. Velocidad de Deposición v_d = 1 / (Ra + Rb + Rc)
  const totalResistance = ra + rb + rc;
  const vd_m_s = 1.0 / Math.max(1.0, totalResistance);
  const vd_cm_s = vd_m_s * 100.0;

  // 6. Flujo de Deposición específico Fd = vd * [NO2] (µg / m² · s)
  const safeNO2 = Math.max(1.0, ambientNO2_ug_m3);
  const flux_ug_m2_s = vd_m_s * safeNO2;

  // Tasas específicas por unidad de superficie de fachada
  const hourlyRemovalG_m2_h = (flux_ug_m2_s * 3600.0) / 1e6;
  const dailyRemovalMg_m2_day = (flux_ug_m2_s * 86400.0) / 1000.0;
  const annualRemovalG_m2_year = hourlyRemovalG_m2_h * 24.0 * 365.0;
  const annualRemovalKg_per_100m2_year = (annualRemovalG_m2_year * 100.0) / 1000.0;

  // 7. Asimetría de cañón urbano (Pugh et al., 2012)
  // En cañones con relación H/W > 0.8, la pared de sotavento experimenta un vórtice rotatorio
  // que eleva la concentración local un factor de 1.42 promedio (rango 1.30 - 1.55).
  const vortexConcentrationFactor = 1.42;
  const leewardFlux_ug_m2_s = flux_ug_m2_s * vortexConcentrationFactor;
  const leewardAnnualRemovalG_m2_year = annualRemovalG_m2_year * vortexConcentrationFactor;
  
  const windwardConcentrationFactor = 0.78;
  const windwardFlux_ug_m2_s = flux_ug_m2_s * windwardConcentrationFactor;
  const windwardAnnualRemovalG_m2_year = annualRemovalG_m2_year * windwardConcentrationFactor;

  // 8. Comparativa con árbol urbano tradicional por m² de huella
  // Un Platanus / Ficus captura ~18.5 g NO2 / (m² huella · año), pero en cañones estrechos
  // reduce la ventilación un 35-50%, mientras el bosque vertical no penaliza la ventilación transversal.
  const treeAverageAnnualRemovalG_m2_footprint = 18.5;
  const relativeAdvantagePct = ((annualRemovalG_m2_year - treeAverageAnnualRemovalG_m2_footprint) / treeAverageAnnualRemovalG_m2_footprint) * 100.0;

  return {
    species,
    ambientConditions: {
      tempC,
      rhPct,
      parWm2,
      windSpeedMs,
      ustarMs,
      ambientNO2_ug_m3: safeNO2
    },
    resistances: {
      ra_s_m: Number(ra.toFixed(1)),
      rb_s_m: Number(rb.toFixed(1)),
      rs_s_m: Number(rs.toFixed(1)),
      rc_s_m: Number(rc.toFixed(1)),
      totalResistance_s_m: Number(totalResistance.toFixed(1))
    },
    effectiveVd_cm_s: Number(vd_cm_s.toFixed(3)),
    specificCapacity: {
      instantaneousFlux_ug_m2_s: Number(flux_ug_m2_s.toFixed(4)),
      hourlyRemovalG_m2_h: Number(hourlyRemovalG_m2_h.toFixed(5)),
      dailyRemovalMg_m2_day: Number(dailyRemovalMg_m2_day.toFixed(2)),
      annualRemovalG_m2_year: Number(annualRemovalG_m2_year.toFixed(1)),
      annualRemovalKg_per_100m2_year: Number(annualRemovalKg_per_100m2_year.toFixed(2))
    },
    canyonAsymmetry: {
      leewardFlux_ug_m2_s: Number(leewardFlux_ug_m2_s.toFixed(4)),
      leewardAnnualRemovalG_m2_year: Number(leewardAnnualRemovalG_m2_year.toFixed(1)),
      windwardFlux_ug_m2_s: Number(windwardFlux_ug_m2_s.toFixed(4)),
      windwardAnnualRemovalG_m2_year: Number(windwardAnnualRemovalG_m2_year.toFixed(1)),
      vortexConcentrationFactor
    },
    comparisonWithTrees: {
      treeAverageAnnualRemovalG_m2_footprint,
      relativeAdvantagePct: Number(relativeAdvantagePct.toFixed(1)),
      aerodynamicPenalizationAvoided: true
    }
  };
}

/**
 * Calcula el catálogo completo de remoción específica para todas las especies en la base de datos
 */
export function calculateAllSpeciesFacadeRemoval(
  tempC: number,
  rhPct: number,
  parWm2: number,
  windSpeedMs: number,
  ustarMs: number,
  ambientNO2_ug_m3: number
): FacadeNOxRemovalResult[] {
  return VERTICAL_FOREST_SPECIES_DATABASE.map(species =>
    calculateFacadeNOxRemoval(
      species,
      tempC,
      rhPct,
      parWm2,
      windSpeedMs,
      ustarMs,
      ambientNO2_ug_m3
    )
  );
}

/**
 * Exportación citable en CSV de la matriz de remoción específica por m² de fachada
 */
export function exportFacadeRemovalCsv(results: FacadeNOxRemovalResult[]): string {
  const headers = [
    'Especie_Comun',
    'Nombre_Cientifico',
    'Tipologia',
    'LAI_m2_m2',
    'vd_NO2_cm_s',
    'Flujo_NO2_ug_m2_s',
    'Remocion_Diaria_mg_m2_dia',
    'Remocion_Anual_g_m2_ano',
    'Remocion_100m2_kg_ano',
    'Sotavento_Remocion_g_m2_ano',
    'Barlovento_Remocion_g_m2_ano',
    'Enfriamiento_C',
    'Referencia'
  ];

  const rows = results.map(r => [
    `"${r.species.commonName}"`,
    `"${r.species.scientificName}"`,
    `"${r.species.typology}"`,
    r.species.defaultLAI,
    r.effectiveVd_cm_s,
    r.specificCapacity.instantaneousFlux_ug_m2_s,
    r.specificCapacity.dailyRemovalMg_m2_day,
    r.specificCapacity.annualRemovalG_m2_year,
    r.specificCapacity.annualRemovalKg_per_100m2_year,
    r.canyonAsymmetry.leewardAnnualRemovalG_m2_year,
    r.canyonAsymmetry.windwardAnnualRemovalG_m2_year,
    r.species.summerCoolingC,
    `"${r.species.scientificReference}"`
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}
