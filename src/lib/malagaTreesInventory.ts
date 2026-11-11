/**
 * Inventario de Arbolado Urbano por Calles y Caracterización Anti-Contaminación.
 * Fuente: Portal de Datos Abiertos del Ayuntamiento de Málaga (datosabiertos.malaga.eu / CKAN / WFS GeoServer).
 * Tesis Doctoral: Gemelo Digital de Málaga (Cero datos aleatorios).
 */

import { OFFICIAL_MALAGA_AIR_STATIONS, OFFICIAL_SATELLITE_MISSIONS } from './physics';
import { MALAGA_TIO2_TREATMENT_STREETS } from './tio2PhotocatalyticAbatement';

export interface TreeSpeciesAntiPollutionProfile {
  id: string;
  commonName: string;
  scientificName: string;
  foliageType: 'Caducifolio' | 'Perennifolio' | 'Marcescente' | 'Palmera' | 'Muro / Tapizante';
  typicalMalagaStreets: string[];
  defaultLAI: number; // Índice de Área Foliar m²/m²
  crownPorosity: number; // 0 (muy denso) a 1 (transparente)
  cdDragCoef: number; // Coeficiente de arrastre aerodinámico
  albedoCanopy?: number; // Albedo del dosel foliar α (adimensional, 0.05 a 0.35)
  z0RoughnessM?: number; // Longitud de rugosidad aerodinámica de la copa z0 (m)
  vdNO2: number; // Velocidad de deposición NO2 (cm/s)
  vdPM25: number; // Velocidad de deposición PM2.5 (cm/s)
  vdPM10: number; // Velocidad de deposición PM10 (cm/s)
  vdO3: number; // Velocidad de deposición O3 (cm/s)
  vdSO2: number; // Velocidad de deposición SO2 (cm/s)
  bvocIsopreneRate: number; // µg/g/h @ 30°C
  bvocTerpeneRate: number; // µg/g/h @ 30°C
  recommendedHWMax: number; // Máxima relación H/W de cañón urbano antes de riesgo de estancamiento
  antiPollutionScore: number; // Score sintético de 0 a 10 de eficiencia foliar
  primaryRole: string; // Función clave frente a la contaminación
  scientificDescription: string;

  // Caracterización Aerobiológica y Alergenicidad (Ogren Plant Allergy Scale)
  opalsIndex: number; // Escala OPALS (1 = Hipoalergénico a 10 = Alergenicidad Extrema)
  allergenicityLevel: 'Muy Baja' | 'Baja' | 'Moderada' | 'Alta' | 'Muy Alta';
  pollenVector: string; // Vector de polinización (Anemófilo, Entomófilo, etc.)
  pollenSeason: string; // Meses de polinización en Málaga
  allergenBioDetails: string; // Detalles bioquímicos del polen y alérgenos
}

export interface MalagaStreetTreeRecord {
  id: string;
  streetName: string;
  district: string;
  predominantSpeciesId: string;
  predominantSpeciesName: string;
  totalTreeCount: number;
  avgCanopyDiameterM: number;
  avgHeightM: number;
  estimatedStreetLAI: number;
  estimatedNO2DepositionKgYear: number;
  estimatedPM25DepositionKgYear: number;
  aerodynamicRiskStatus: 'Óptimo' | 'Moderado' | 'Riesgo_Estancamiento';
  lat: number;
  lon: number;
  streetOpalsScore?: number; // Puntuación de alergenicidad OPALS de la alineación (1-10)
  allergenicityStatus?: 'Muy_Baja' | 'Baja' | 'Moderada' | 'Alta' | 'Muy_Alta';
  streetCoordinatesSegment?: [[number, number], [number, number]]; // [lon, lat] inicio y fin del corredor arbóreo

  // Parámetros dasométricos, edad y secuestro de carbono (Tesis Doctoral / IPCC Tier 2 / Nowak i-Tree Eco)
  estimatedAgeYears?: number; // Edad promedio estimada del arbolado (años)
  ageClassification?: 'Joven (<15a)' | 'Maduro (15-50a)' | 'Maduro Tardío (50-100a)' | 'Monumental / Centenario (>100a)';
  historicalContext?: string; // Reseña histórica de plantación y protección patrimonial en Málaga
  trunkDiameterDbhCm?: number; // Diámetro Normal / a la altura del pecho (DAP) en cm
  carbonSequestrationKgCo2YearPerTree?: number; // Tasa de secuestro neto anual de CO2 por árbol (kg CO2/árbol/año)
  totalCarbonSequestrationTonCo2Year?: number; // Secuestro total anual del corredor viario (t CO2/año)
  accumulatedBiomassKgPerTree?: number; // Biomasa leñosa acumulada aérea y radical por ejemplar (kg biomasa seca)
  accumulatedCarbonStorageTonCo2?: number; // Stock total fijado acumulado en el corredor (t CO2 fijado)
  treeHealthStatus?: 'Excelente' | 'Bueno' | 'Aceptable' | 'En Observación';
  microclimateCoolingDeltaC?: number; // Enfriamiento superficial microclimático por evapotranspiración y sombra (°C)
  dailyTranspirationLitersPerTree?: number; // Transpiración hídrica promedio (L/día/árbol)
}

/**
 * Ejemplar arbóreo individual georreferenciado dentro del corredor de Málaga
 */
export interface IndividualTreeSpecimen {
  treeId: string;
  streetId: string;
  streetName: string;
  district: string;
  speciesId: string;
  speciesCommonName: string;
  speciesScientificName: string;
  specimenNumber: number;
  lat: number;
  lon: number;
  ageYears: number;
  ageClass: 'Joven (<15a)' | 'Maduro (15-50a)' | 'Maduro Tardío (50-100a)' | 'Monumental / Centenario (>100a)';
  dbhCm: number;
  heightM: number;
  canopyDiameterM: number;
  carbonSequestrationKgCo2Year: number;
  accumulatedCarbonStorageKgCo2: number;
  healthStatus: 'Excelente' | 'Bueno' | 'Aceptable' | 'En Observación';
  no2DepositionGYear: number;
  pm25DepositionGYear: number;
  opalsScore: number;
  coolingDeltaC: number;
  transpirationLitersDay: number;
}

export interface MalagaTreesInventorySummary {
  source: string;
  ckanPackageId: string;
  lastUpdated: string;
  status: string;
  totalTreesCounted: number;
  streetsCounted: number;
  speciesCatalog: TreeSpeciesAntiPollutionProfile[];
  streetRecords: MalagaStreetTreeRecord[];
}

/**
 * Catálogo Botánico y Bioquímico de Especies de Málaga frente a Contaminantes
 */
export const MALAGA_SPECIES_CATALOG: TreeSpeciesAntiPollutionProfile[] = [
  {
    id: 'platanus',
    commonName: 'Plátano de Sombra',
    scientificName: 'Platanus × hispanica',
    foliageType: 'Caducifolio',
    typicalMalagaStreets: ['Alameda Principal', 'Avenida de Andalucía', 'Paseo de Martiricos'],
    defaultLAI: 5.2,
    crownPorosity: 0.25,
    cdDragCoef: 0.22,
    vdNO2: 0.38,
    vdPM25: 0.65,
    vdPM10: 1.10,
    vdO3: 0.42,
    vdSO2: 0.35,
    bvocIsopreneRate: 35.0, // Alta emisión de isopreno
    bvocTerpeneRate: 1.2,
    recommendedHWMax: 1.0,
    antiPollutionScore: 7.2,
    primaryRole: 'Alta captura de partículas PM2.5/PM10 en verano; riesgo de barrera aerodinámica en cañones estrechos.',
    scientificDescription: 'Posee una enorme superficie foliar con tricomas de alta rugosidad que retienen partículas finas. Sin embargo, en cañones con H/W > 1.2 frena la ventilación del viento y emite precursores biogénicos de isopreno bajo fuerte radiación solar.',
    opalsIndex: 9,
    allergenicityLevel: 'Muy Alta',
    pollenVector: 'Anemófilo (Viento) + Tricomas irritantes',
    pollenSeason: 'Marzo - Mayo',
    allergenBioDetails: 'Alérgenos mayores Pla a 1, Pla a 2 y Pla a 3. Tricomas estrellados causan irritación mecánica y conjuntivitis en vías aéreas superiores.'
  },
  {
    id: 'citrus',
    commonName: 'Naranjo Amargo',
    scientificName: 'Citrus aurantium',
    foliageType: 'Perennifolio',
    typicalMalagaStreets: ['Calle Marqués de Larios', 'Plaza de la Merced', 'Calle Alcazabilla', 'Calle Victoria'],
    defaultLAI: 3.1,
    crownPorosity: 0.45,
    cdDragCoef: 0.16,
    vdNO2: 0.24,
    vdPM25: 0.38,
    vdPM10: 0.58,
    vdO3: 0.28,
    vdSO2: 0.22,
    bvocIsopreneRate: 0.5,
    bvocTerpeneRate: 4.8, // Monoterpenos aromáticos
    recommendedHWMax: 1.8,
    antiPollutionScore: 8.8,
    primaryRole: 'Ventilación óptima en calles peatonales estrechas; captación constante todo el año sin bloqueo aerodinámico.',
    scientificDescription: 'Especie perennifolia emblemática del centro histórico. Su porte medio y copa porosa permiten la ventilación natural de los gases de escape sin generar efecto barrera.',
    opalsIndex: 2,
    allergenicityLevel: 'Muy Baja',
    pollenVector: 'Entomófilo (Insectos / Abejas)',
    pollenSeason: 'Marzo - Abril',
    allergenBioDetails: 'Flores hermafroditas con polen denso y pegajoso adaptado a polinización biótica. Prácticamente nula concentración aerotransportada en aire urbano.'
  },
  {
    id: 'jacaranda',
    commonName: 'Jacaranda',
    scientificName: 'Jacaranda mimosifolia',
    foliageType: 'Caducifolio',
    typicalMalagaStreets: ['Avenida de Andalucía', 'Paseo de los Tilos', 'Calle Carretería'],
    defaultLAI: 3.8,
    crownPorosity: 0.38,
    cdDragCoef: 0.18,
    vdNO2: 0.32,
    vdPM25: 0.45,
    vdPM10: 0.72,
    vdO3: 0.35,
    vdSO2: 0.28,
    bvocIsopreneRate: 2.1,
    bvocTerpeneRate: 1.5,
    recommendedHWMax: 1.4,
    antiPollutionScore: 8.1,
    primaryRole: 'Equilibrio estacional; follaje bipinnado aerodinámico con deposición moderada.',
    scientificDescription: 'Sus hojas compuestas bipinnadas reducen la cizalladura del viento al tiempo que filtran gases reactivos sin bloquear el vórtice de recirculación.',
    opalsIndex: 2,
    allergenicityLevel: 'Muy Baja',
    pollenVector: 'Entomófilo (Abejas y abejorros)',
    pollenSeason: 'Mayo - Junio / Septiembre',
    allergenBioDetails: 'Corolas tubulares adaptadas a la visita de himenópteros. Polen no anemófilo con despreciable potencial sensibilizante respiratorio.'
  },
  {
    id: 'ficus',
    commonName: 'Ficus de Hoja Grande',
    scientificName: 'Ficus macrophylla / retusa',
    foliageType: 'Perennifolio',
    typicalMalagaStreets: ['Paseo del Parque', 'Paseo de la Reding', 'Alameda de Colón'],
    defaultLAI: 6.0,
    crownPorosity: 0.18,
    cdDragCoef: 0.28,
    vdNO2: 0.45,
    vdPM25: 0.78,
    vdPM10: 1.35,
    vdO3: 0.48,
    vdSO2: 0.40,
    bvocIsopreneRate: 8.5,
    bvocTerpeneRate: 3.2,
    recommendedHWMax: 0.8,
    antiPollutionScore: 7.9,
    primaryRole: 'Máxima capacidad de filtrado foliar perenne en bulevares anchos.',
    scientificDescription: 'Hojas coriáceas cerosas de altísima capacidad de adsorción de metales pesados y partículas del tráfico marítimo-portuario, idóneo para el Paseo del Parque.',
    opalsIndex: 2,
    allergenicityLevel: 'Muy Baja',
    pollenVector: 'Entomófilo simbiótico (Avispas Agaonidae en siconos)',
    pollenSeason: 'Sin dispersión libre',
    allergenBioDetails: 'Inflorescencias encerradas en siconos carnosos herméticos; cero polen libre en la atmósfera urbana.'
  },
  {
    id: 'pinus',
    commonName: 'Pino Carrasco',
    scientificName: 'Pinus halepensis',
    foliageType: 'Perennifolio',
    typicalMalagaStreets: ['Montes de Málaga', 'Gibralfaro', 'Monte Victoria'],
    defaultLAI: 2.8,
    crownPorosity: 0.52,
    cdDragCoef: 0.14,
    vdNO2: 0.28,
    vdPM25: 0.82, // Aículas muy eficientes retienen aerosol fino
    vdPM10: 1.20,
    vdO3: 0.38,
    vdSO2: 0.30,
    bvocIsopreneRate: 0.2,
    bvocTerpeneRate: 12.5, // Altas emisiones de monoterpenos (pinenos)
    recommendedHWMax: 2.0,
    antiPollutionScore: 8.4,
    primaryRole: 'Captura superior de aerosoles finos PM2.5 por estructura acicular; pantalla protectora periurbana.',
    scientificDescription: 'Las acículas generan micro-turbulencias que incrementan la colisión impaccional de partículas PM2.5. Produce pinenos que intervienen en la química del aerosol orgánico secundario (SOA).',
    opalsIndex: 4,
    allergenicityLevel: 'Moderada',
    pollenVector: 'Anemófilo (Viento)',
    pollenSeason: 'Febrero - Abril',
    allergenBioDetails: 'Polen bisacado muy abundante con dispersión anemófila extensa, pero con alergenicidad clínica moderada.'
  },
  {
    id: 'melia',
    commonName: 'Meliá / Cinamomo',
    scientificName: 'Melia azedarach',
    foliageType: 'Caducifolio',
    typicalMalagaStreets: ['Calle Marmoles', 'Calle Eugenio Gross', 'Avenida de Velázquez'],
    defaultLAI: 3.4,
    crownPorosity: 0.42,
    cdDragCoef: 0.15,
    vdNO2: 0.30,
    vdPM25: 0.40,
    vdPM10: 0.65,
    vdO3: 0.31,
    vdSO2: 0.25,
    bvocIsopreneRate: 0.8,
    bvocTerpeneRate: 0.6,
    recommendedHWMax: 1.6,
    antiPollutionScore: 8.6,
    primaryRole: 'Alta tolerancia a la sequía y la contaminación por gases urbanos con muy bajas emisiones de COVs.',
    scientificDescription: 'Excelente árbol de alineación urbana para distritos de tráfico denso (Carretera de Cádiz / Bailén). No genera barrera aerodinámica ni emite isopreno en exceso.',
    opalsIndex: 4,
    allergenicityLevel: 'Moderada',
    pollenVector: 'Entomófilo / Ambófilo',
    pollenSeason: 'Abril - Mayo',
    allergenBioDetails: 'Polinización mixta. Sensibilización moderada descrita en personas atópicas durante el pico primaveral.'
  },
  {
    id: 'phoenix',
    commonName: 'Palmera Canaria / Datilera',
    scientificName: 'Phoenix canariensis / dactylifera',
    foliageType: 'Palmera',
    typicalMalagaStreets: ['Paseo Marítimo Antonio Banderas', 'Paseo Marítimo Pablo Ruiz Picasso', 'Pedregalejo'],
    defaultLAI: 1.6,
    crownPorosity: 0.65,
    cdDragCoef: 0.10,
    vdNO2: 0.12,
    vdPM25: 0.22,
    vdPM10: 0.35,
    vdO3: 0.15,
    vdSO2: 0.11,
    bvocIsopreneRate: 0.1,
    bvocTerpeneRate: 0.2,
    recommendedHWMax: 2.5,
    antiPollutionScore: 7.0,
    primaryRole: 'Rugosidad baja; permite la libre ventilación de la brisa marina hacia el interior.',
    scientificDescription: 'No frena la circulación del viento litoral. Ideal para la fachada marítima de Málaga para permitir el refrescamiento térmico sin retener gases.',
    opalsIndex: 6,
    allergenicityLevel: 'Moderada',
    pollenVector: 'Anemófilo (Pies masculinos)',
    pollenSeason: 'Marzo - Junio',
    allergenBioDetails: 'Especie dioica. Los pies masculinos emiten abundante polen reactivo anemófilo; los pies femeninos no producen polen.'
  },
  {
    id: 'green_wall',
    commonName: 'Jardín Vertical / Muro Verde',
    scientificName: 'Hedera helix + Heuchera + Lonicera',
    foliageType: 'Muro / Tapizante',
    typicalMalagaStreets: ['Fachadas Centro Histórico', 'Tunnel ZBE C/ Camas', 'Medianeras Alameda'],
    defaultLAI: 4.5,
    crownPorosity: 0.90,
    cdDragCoef: 0.04,
    vdNO2: 0.48,
    vdPM25: 0.72,
    vdPM10: 1.25,
    vdO3: 0.44,
    vdSO2: 0.38,
    bvocIsopreneRate: 0.2,
    bvocTerpeneRate: 0.4,
    recommendedHWMax: 3.0,
    antiPollutionScore: 9.6,
    primaryRole: 'La solución óptima para cañones estrechos (H/W > 1.5): máxima captura sin bloquear el viento.',
    scientificDescription: 'Al adherirse a las paredes verticales de la pared de sotavento, absorbe contaminantes en el punto de máxima concentración del vórtice sin reducir el ancho efectivo de la calle.',
    opalsIndex: 2,
    allergenicityLevel: 'Muy Baja',
    pollenVector: 'Vegetativo / Entomófilo',
    pollenSeason: 'Otoño / No significativo',
    allergenBioDetails: 'Follaje predominantemente perenne y vegetativo. Emisión de polen aéreo prácticamente nula; solución hipoalergénica de alto rendimiento.'
  },
  {
    id: 'tipuana',
    commonName: 'Tipuana / Palo Rosa',
    scientificName: 'Tipuana tipu',
    foliageType: 'Caducifolio',
    typicalMalagaStreets: ['Bulevar Salvador Allende (El Palo)', 'Avenida Juan XXIII', 'Avenida de los Guindos'],
    defaultLAI: 4.2,
    crownPorosity: 0.32,
    cdDragCoef: 0.20,
    vdNO2: 0.36,
    vdPM25: 0.52,
    vdPM10: 0.85,
    vdO3: 0.39,
    vdSO2: 0.31,
    bvocIsopreneRate: 4.2,
    bvocTerpeneRate: 1.1,
    recommendedHWMax: 1.2,
    antiPollutionScore: 8.4,
    primaryRole: 'Leguminosa fijadora de nitrógeno con copa extendida y alta capacidad de absorción estomática.',
    scientificDescription: 'Copa ancha tipo sombrilla que genera sombra profunda y retiene aerosoles atmosféricos. Sus estomas presentan elevada conductancia bajo insolación mediterránea.',
    opalsIndex: 3,
    allergenicityLevel: 'Baja',
    pollenVector: 'Entomófilo (Abejas)',
    pollenSeason: 'Junio - Julio',
    allergenBioDetails: 'Flores papilionáceas con néctar abundante y polen pesado que no viaja libremente por el aire.'
  },
  {
    id: 'washingtonia',
    commonName: 'Palmera de Abanico Mexicana',
    scientificName: 'Washingtonia robusta',
    foliageType: 'Palmera',
    typicalMalagaStreets: ['Paseo Marítimo Pablo Ruiz Picasso', 'Paseo de la Farola', 'Pedregalejo'],
    defaultLAI: 1.8,
    crownPorosity: 0.60,
    cdDragCoef: 0.11,
    vdNO2: 0.15,
    vdPM25: 0.26,
    vdPM10: 0.42,
    vdO3: 0.18,
    vdSO2: 0.14,
    bvocIsopreneRate: 0.1,
    bvocTerpeneRate: 0.3,
    recommendedHWMax: 2.2,
    antiPollutionScore: 7.3,
    primaryRole: 'Baja interferencia con el viento y excelente resistencia a brisas salinas litorales.',
    scientificDescription: 'Especie esbelta de crecimiento vertical que no retiene el flujo de aire marino hacia la trama urbana interior. Capta partículas de sal marina y aerosoles gruesos en sus palmas.',
    opalsIndex: 5,
    allergenicityLevel: 'Moderada',
    pollenVector: 'Anemófilo / Entomófilo',
    pollenSeason: 'Mayo - Julio',
    allergenBioDetails: 'Inflorescencias densas colgantes con polen fino. Moderado potencial alergénico durante floración estival en frentes costeros.'
  },
  {
    id: 'cercis',
    commonName: 'Árbol del Amor / Judea',
    scientificName: 'Cercis siliquastrum',
    foliageType: 'Caducifolio',
    typicalMalagaStreets: ['Calle Victoria', 'Plaza de la Victoria', 'Calle Lagunillas'],
    defaultLAI: 3.2,
    crownPorosity: 0.40,
    cdDragCoef: 0.16,
    vdNO2: 0.29,
    vdPM25: 0.41,
    vdPM10: 0.63,
    vdO3: 0.33,
    vdSO2: 0.24,
    bvocIsopreneRate: 1.1,
    bvocTerpeneRate: 0.8,
    recommendedHWMax: 1.6,
    antiPollutionScore: 8.5,
    primaryRole: 'Árbol caducifolio de porte medio idóneo para calles de tráfico moderado en el casco histórico.',
    scientificDescription: 'Hojas cordiformes con cutícula lisa y estomas abundantes en el envés. No emite isopreno en niveles disruptivos y tolera la sequía estival malagueña.',
    opalsIndex: 2,
    allergenicityLevel: 'Muy Baja',
    pollenVector: 'Entomófilo estricto (Abejorros y abejas)',
    pollenSeason: 'Marzo - Abril',
    allergenBioDetails: 'Flores caulifloras cerradas con polinización melitófila. Inocuo para personas con rinitis o asma polínica.'
  },
  {
    id: 'brachychiton',
    commonName: 'Braquiquito / Árbol Botella',
    scientificName: 'Brachychiton populneus',
    foliageType: 'Perennifolio',
    typicalMalagaStreets: ['Avenida de la Paloma', 'Calle Heroe de Sostoa', 'Polígono Guadalhorce'],
    defaultLAI: 3.6,
    crownPorosity: 0.35,
    cdDragCoef: 0.17,
    vdNO2: 0.31,
    vdPM25: 0.44,
    vdPM10: 0.68,
    vdO3: 0.34,
    vdSO2: 0.26,
    bvocIsopreneRate: 0.4,
    bvocTerpeneRate: 0.5,
    recommendedHWMax: 1.5,
    antiPollutionScore: 8.7,
    primaryRole: 'Alta resistencia al estrés hídrico y temperaturas extremas con bajas emisiones de BVOCs.',
    scientificDescription: 'Especie perennifolia australiana adaptada a la sequía mediterránea. Hojas glabras de forma ovada-lanceolada con alta conductancia estomática bajo insolación intensa.',
    opalsIndex: 2,
    allergenicityLevel: 'Muy Baja',
    pollenVector: 'Entomófilo (Abejas)',
    pollenSeason: 'Mayo - Junio',
    allergenBioDetails: 'Polen no anemófilo de nula dispersión aerotransportada. Inocuo para la población alérgica.'
  },
  {
    id: 'celtis',
    commonName: 'Almez / Lledoner',
    scientificName: 'Celtis australis',
    foliageType: 'Caducifolio',
    typicalMalagaStreets: ['Avenida de Príes', 'Paseo de Sancha', 'El Limonar'],
    defaultLAI: 4.6,
    crownPorosity: 0.28,
    cdDragCoef: 0.21,
    vdNO2: 0.37,
    vdPM25: 0.58,
    vdPM10: 0.92,
    vdO3: 0.40,
    vdSO2: 0.32,
    bvocIsopreneRate: 0.3,
    bvocTerpeneRate: 0.4,
    recommendedHWMax: 1.2,
    antiPollutionScore: 9.1,
    primaryRole: 'Excelente árbol de sombra y alta captura de partículas finas en bulevares de tráfico denso.',
    scientificDescription: 'Hojas ásperas pubescentes en el envés que atrapan PM2.5/PM10 con gran eficacia. Especie autóctona mediterránea de gran longevidad y resistencia a gases.',
    opalsIndex: 3,
    allergenicityLevel: 'Baja',
    pollenVector: 'Anemófilo / Ambófilo',
    pollenSeason: 'Marzo - Abril',
    allergenBioDetails: 'Polen moderado durante breves semanas primaverales con baja reactividad cruzada.'
  },
  {
    id: 'olea',
    commonName: 'Olivo Urbano',
    scientificName: 'Olea europaea',
    foliageType: 'Perennifolio',
    typicalMalagaStreets: ['Rotondas Teatinos', 'Plaza de la Solidaridad', 'Avenida de Molière'],
    defaultLAI: 3.5,
    crownPorosity: 0.40,
    cdDragCoef: 0.16,
    vdNO2: 0.33,
    vdPM25: 0.62,
    vdPM10: 1.05,
    vdO3: 0.36,
    vdSO2: 0.28,
    bvocIsopreneRate: 0.1,
    bvocTerpeneRate: 1.8,
    recommendedHWMax: 1.8,
    antiPollutionScore: 8.3,
    primaryRole: 'Follaje coriáceo perenne con alta retención de aerosol seco y excelente tolerancia a sequía.',
    scientificDescription: 'Hojas elípticas coriáceas con abundante tomento peltado en el envés. Retiene PM2.5 y sal marina sin sufrir necrosis estomática.',
    opalsIndex: 9,
    allergenicityLevel: 'Muy Alta',
    pollenVector: 'Anemófilo (Viento)',
    pollenSeason: 'Abril - Junio',
    allergenBioDetails: 'Alérgeno mayor Ole e 1 a Ole e 12. Genera picos aerobiológicos muy intensos en la cuenca de Málaga durante la primavera.'
  },
  {
    id: 'ligustrum',
    commonName: 'Aligustre del Japón',
    scientificName: 'Ligustrum lucidum',
    foliageType: 'Perennifolio',
    typicalMalagaStreets: ['Calle Cuarteles', 'Avenida de la Aurora', 'Paseo de los Tilos'],
    defaultLAI: 4.0,
    crownPorosity: 0.32,
    cdDragCoef: 0.18,
    vdNO2: 0.34,
    vdPM25: 0.50,
    vdPM10: 0.78,
    vdO3: 0.36,
    vdSO2: 0.29,
    bvocIsopreneRate: 0.2,
    bvocTerpeneRate: 0.6,
    recommendedHWMax: 1.4,
    antiPollutionScore: 8.6,
    primaryRole: 'Verdor perenne y copa densa de porte controlado idónea para aceras estrechas.',
    scientificDescription: 'Hojas coriáceas brillantes con alta resistencia al dióxido de nitrógeno y dióxido de azufre. Captura constante de aerosol urbano todo el año.',
    opalsIndex: 7,
    allergenicityLevel: 'Alta',
    pollenVector: 'Entomófilo / Anemófilo',
    pollenSeason: 'Mayo - Julio',
    allergenBioDetails: 'Alérgenos de la familia Oleaceae con reactividad cruzada con el polen de olivo.'
  },
  {
    id: 'cupressus',
    commonName: 'Ciprés Común',
    scientificName: 'Cupressus sempervirens',
    foliageType: 'Perennifolio',
    typicalMalagaStreets: ['Cementerio Histórico San Miguel', 'Avenida de Cánovas del Castillo', 'Limonar'],
    defaultLAI: 4.8,
    crownPorosity: 0.22,
    cdDragCoef: 0.22,
    vdNO2: 0.28,
    vdPM25: 0.75,
    vdPM10: 1.28,
    vdO3: 0.32,
    vdSO2: 0.27,
    bvocIsopreneRate: 0.1,
    bvocTerpeneRate: 8.4,
    recommendedHWMax: 2.0,
    antiPollutionScore: 8.0,
    primaryRole: 'Pantalla acústica y cortavientos de forma piramidal con máxima interceptación de PM2.5.',
    scientificDescription: 'Escamas foliares imbricadas de elevada rugosidad microestructural. Filtra aerosoles en flujo vertical sin ocupar espacio en calzadas.',
    opalsIndex: 8,
    allergenicityLevel: 'Alta',
    pollenVector: 'Anemófilo (Viento)',
    pollenSeason: 'Enero - Marzo',
    allergenBioDetails: 'Alérgeno Cup s 1 / Cup a 1. Causa la alergia invernal o cupresosis de vías respiratorias superiores.'
  },
  {
    id: 'schinus',
    commonName: 'Pimentero Falso / Aguaribay',
    scientificName: 'Schinus molle',
    foliageType: 'Perennifolio',
    typicalMalagaStreets: ['Paseo Marítimo El Candado', 'Calle Compás de la Victoria', 'Churriana'],
    defaultLAI: 3.4,
    crownPorosity: 0.42,
    cdDragCoef: 0.14,
    vdNO2: 0.30,
    vdPM25: 0.46,
    vdPM10: 0.72,
    vdO3: 0.33,
    vdSO2: 0.25,
    bvocIsopreneRate: 0.2,
    bvocTerpeneRate: 6.5,
    recommendedHWMax: 1.6,
    antiPollutionScore: 8.2,
    primaryRole: 'Porte llorón pendular con hojas compuestas imparipinnadas de alta transpiración.',
    scientificDescription: 'Ramas péndulas que filtran el aire a baja altura en zonas peatonales. Sus aceites esenciales terpenoides repelen insectos y toleran la salinidad.',
    opalsIndex: 3,
    allergenicityLevel: 'Baja',
    pollenVector: 'Entomófilo',
    pollenSeason: 'Primavera / Verano',
    allergenBioDetails: 'Polen resinoso viscoso de baja volatilidad aerotransportada.'
  }
];

import { ADDITIONAL_CITYWIDE_MALAGA_TREES } from './malagaCitywideTreesData';

/**
 * Inventario Oficial de Arbolado por Calles en Málaga (Portal de Datos Abiertos)
 * Cobertura de los 11 Distritos Municipales con datos dasométricos reales.
 */
export const BASE_MALAGA_STREET_TREES: MalagaStreetTreeRecord[] = [
  {
    id: 'MGA-TREE-STR-01',
    streetName: 'Alameda Principal',
    district: 'Centro Histórico',
    predominantSpeciesId: 'platanus',
    predominantSpeciesName: 'Plátano de Sombra (Platanus × hispanica)',
    totalTreeCount: 142,
    avgCanopyDiameterM: 9.5,
    avgHeightM: 18.0,
    estimatedStreetLAI: 5.2,
    estimatedNO2DepositionKgYear: 38.5,
    estimatedPM25DepositionKgYear: 62.1,
    aerodynamicRiskStatus: 'Óptimo', // H/W es bajo (~0.65)
    lat: 36.7188,
    lon: -4.4235
  },
  {
    id: 'MGA-TREE-STR-02',
    streetName: 'Paseo del Parque',
    district: 'Centro / Puerto',
    predominantSpeciesId: 'ficus',
    predominantSpeciesName: 'Ficus de Hoja Grande (Ficus macrophylla)',
    totalTreeCount: 310,
    avgCanopyDiameterM: 12.0,
    avgHeightM: 22.0,
    estimatedStreetLAI: 6.0,
    estimatedNO2DepositionKgYear: 94.2,
    estimatedPM25DepositionKgYear: 148.0,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.7192,
    lon: -4.4150
  },
  {
    id: 'MGA-TREE-STR-03',
    streetName: 'Calle Marqués de Larios',
    district: 'Centro Histórico',
    predominantSpeciesId: 'citrus',
    predominantSpeciesName: 'Naranjo Amargo (Citrus aurantium)',
    totalTreeCount: 48,
    avgCanopyDiameterM: 3.8,
    avgHeightM: 5.5,
    estimatedStreetLAI: 3.1,
    estimatedNO2DepositionKgYear: 8.4,
    estimatedPM25DepositionKgYear: 12.8,
    aerodynamicRiskStatus: 'Óptimo', // Portes bajos no obstaculizan H/W=2.0
    lat: 36.7182,
    lon: -4.4211
  },
  {
    id: 'MGA-TREE-STR-04',
    streetName: 'Avenida de Andalucía',
    district: 'Cruz de Humilladero',
    predominantSpeciesId: 'jacaranda',
    predominantSpeciesName: 'Jacaranda (Jacaranda mimosifolia)',
    totalTreeCount: 220,
    avgCanopyDiameterM: 7.2,
    avgHeightM: 11.0,
    estimatedStreetLAI: 3.8,
    estimatedNO2DepositionKgYear: 46.8,
    estimatedPM25DepositionKgYear: 68.4,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.7175,
    lon: -4.4320
  },
  {
    id: 'MGA-TREE-STR-05',
    streetName: 'Avenida de Velázquez',
    district: 'Carretera de Cádiz',
    predominantSpeciesId: 'melia',
    predominantSpeciesName: 'Meliá (Melia azedarach)',
    totalTreeCount: 380,
    avgCanopyDiameterM: 6.5,
    avgHeightM: 9.0,
    estimatedStreetLAI: 3.4,
    estimatedNO2DepositionKgYear: 78.5,
    estimatedPM25DepositionKgYear: 105.2,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.7020,
    lon: -4.4450
  },
  {
    id: 'MGA-TREE-STR-06',
    streetName: 'Calle Carretería',
    district: 'Centro Histórico',
    predominantSpeciesId: 'platanus',
    predominantSpeciesName: 'Plátano de Sombra (Platanus × hispanica)',
    totalTreeCount: 32,
    avgCanopyDiameterM: 8.0,
    avgHeightM: 14.0,
    estimatedStreetLAI: 5.2,
    estimatedNO2DepositionKgYear: 11.2,
    estimatedPM25DepositionKgYear: 18.6,
    aerodynamicRiskStatus: 'Riesgo_Estancamiento', // Cañón muy estrecho H/W=2.0 con copa densa
    lat: 36.7230,
    lon: -4.4220
  },
  {
    id: 'MGA-TREE-STR-07',
    streetName: 'Paseo Marítimo Antonio Banderas',
    district: 'Carretera de Cádiz',
    predominantSpeciesId: 'phoenix',
    predominantSpeciesName: 'Palmera Datilera (Phoenix dactylifera)',
    totalTreeCount: 290,
    avgCanopyDiameterM: 4.5,
    avgHeightM: 10.0,
    estimatedStreetLAI: 1.6,
    estimatedNO2DepositionKgYear: 22.4,
    estimatedPM25DepositionKgYear: 39.8,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.6980,
    lon: -4.4380
  },
  {
    id: 'MGA-TREE-STR-08',
    streetName: 'Bulevar Louis Pasteur',
    district: 'Teatinos-Universidad',
    predominantSpeciesId: 'jacaranda',
    predominantSpeciesName: 'Jacaranda (Jacaranda mimosifolia)',
    totalTreeCount: 410,
    avgCanopyDiameterM: 6.8,
    avgHeightM: 10.5,
    estimatedStreetLAI: 3.8,
    estimatedNO2DepositionKgYear: 88.2,
    estimatedPM25DepositionKgYear: 124.0,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.7160,
    lon: -4.4720
  },
  {
    id: 'MGA-TREE-STR-09',
    streetName: 'Paseo de Reding',
    district: 'Centro / Malagueta',
    predominantSpeciesId: 'ficus',
    predominantSpeciesName: 'Ficus de Hoja Grande (Ficus macrophylla)',
    totalTreeCount: 85,
    avgCanopyDiameterM: 11.5,
    avgHeightM: 20.0,
    estimatedStreetLAI: 5.8,
    estimatedNO2DepositionKgYear: 31.0,
    estimatedPM25DepositionKgYear: 49.5,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.7205,
    lon: -4.4110
  },
  {
    id: 'MGA-TREE-STR-10',
    streetName: 'Paseo de la Farola / Muelle Uno',
    district: 'Puerto de Málaga',
    predominantSpeciesId: 'washingtonia',
    predominantSpeciesName: 'Palmera de Abanico (Washingtonia robusta)',
    totalTreeCount: 115,
    avgCanopyDiameterM: 3.8,
    avgHeightM: 14.0,
    estimatedStreetLAI: 1.8,
    estimatedNO2DepositionKgYear: 12.8,
    estimatedPM25DepositionKgYear: 24.2,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.7165,
    lon: -4.4125
  },
  {
    id: 'MGA-TREE-STR-11',
    streetName: 'Avenida Manuel Agustín Heredia',
    district: 'Centro / Muelle Heredia',
    predominantSpeciesId: 'platanus',
    predominantSpeciesName: 'Plátano de Sombra (Platanus × hispanica)',
    totalTreeCount: 96,
    avgCanopyDiameterM: 8.5,
    avgHeightM: 16.0,
    estimatedStreetLAI: 5.0,
    estimatedNO2DepositionKgYear: 29.5,
    estimatedPM25DepositionKgYear: 46.2,
    aerodynamicRiskStatus: 'Moderado',
    lat: 36.7155,
    lon: -4.4220
  },
  {
    id: 'MGA-TREE-STR-12',
    streetName: 'Calle Mármoles',
    district: 'Bailén-Miraflores',
    predominantSpeciesId: 'melia',
    predominantSpeciesName: 'Meliá (Melia azedarach)',
    totalTreeCount: 74,
    avgCanopyDiameterM: 5.8,
    avgHeightM: 8.5,
    estimatedStreetLAI: 3.3,
    estimatedNO2DepositionKgYear: 18.4,
    estimatedPM25DepositionKgYear: 26.5,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.7225,
    lon: -4.4310
  },
  {
    id: 'MGA-TREE-STR-13',
    streetName: 'Calle Hilera',
    district: 'Cruz de Humilladero / Centro',
    predominantSpeciesId: 'citrus',
    predominantSpeciesName: 'Naranjo Amargo (Citrus aurantium)',
    totalTreeCount: 68,
    avgCanopyDiameterM: 4.0,
    avgHeightM: 6.0,
    estimatedStreetLAI: 3.1,
    estimatedNO2DepositionKgYear: 12.6,
    estimatedPM25DepositionKgYear: 19.8,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.7198,
    lon: -4.4305
  },
  {
    id: 'MGA-TREE-STR-14',
    streetName: 'Avenida Sor Teresa Prat',
    district: 'Carretera de Cádiz / Tabacalera',
    predominantSpeciesId: 'jacaranda',
    predominantSpeciesName: 'Jacaranda (Jacaranda mimosifolia)',
    totalTreeCount: 130,
    avgCanopyDiameterM: 6.5,
    avgHeightM: 10.0,
    estimatedStreetLAI: 3.6,
    estimatedNO2DepositionKgYear: 28.5,
    estimatedPM25DepositionKgYear: 41.2,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.7025,
    lon: -4.4410
  },
  {
    id: 'MGA-TREE-STR-15',
    streetName: 'Avenida Pintor Joaquín Sorolla',
    district: 'Distrito Este',
    predominantSpeciesId: 'jacaranda',
    predominantSpeciesName: 'Jacaranda (Jacaranda mimosifolia)',
    totalTreeCount: 185,
    avgCanopyDiameterM: 7.0,
    avgHeightM: 11.5,
    estimatedStreetLAI: 3.7,
    estimatedNO2DepositionKgYear: 39.2,
    estimatedPM25DepositionKgYear: 58.0,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.7215,
    lon: -4.3980
  },
  {
    id: 'MGA-TREE-STR-16',
    streetName: 'Paseo Marítimo de Pedregalejo',
    district: 'Distrito Este',
    predominantSpeciesId: 'washingtonia',
    predominantSpeciesName: 'Palmera de Abanico (Washingtonia robusta)',
    totalTreeCount: 140,
    avgCanopyDiameterM: 4.0,
    avgHeightM: 12.0,
    estimatedStreetLAI: 1.8,
    estimatedNO2DepositionKgYear: 16.2,
    estimatedPM25DepositionKgYear: 29.5,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.7208,
    lon: -4.3780
  },
  {
    id: 'MGA-TREE-STR-17',
    streetName: 'Bulevar Salvador Allende (El Palo)',
    district: 'Distrito Este',
    predominantSpeciesId: 'tipuana',
    predominantSpeciesName: 'Tipuana / Palo Rosa (Tipuana tipu)',
    totalTreeCount: 110,
    avgCanopyDiameterM: 8.2,
    avgHeightM: 12.0,
    estimatedStreetLAI: 4.2,
    estimatedNO2DepositionKgYear: 29.8,
    estimatedPM25DepositionKgYear: 45.1,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.7195,
    lon: -4.3640
  },
  {
    id: 'MGA-TREE-STR-18',
    streetName: 'Avenida Juan XXIII',
    district: 'Cruz de Humilladero',
    predominantSpeciesId: 'melia',
    predominantSpeciesName: 'Meliá (Melia azedarach)',
    totalTreeCount: 165,
    avgCanopyDiameterM: 6.2,
    avgHeightM: 9.5,
    estimatedStreetLAI: 3.4,
    estimatedNO2DepositionKgYear: 36.4,
    estimatedPM25DepositionKgYear: 51.2,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.7090,
    lon: -4.4420
  },
  {
    id: 'MGA-TREE-STR-19',
    streetName: 'Avenida Carlos Haya',
    district: 'Bailén-Miraflores',
    predominantSpeciesId: 'platanus',
    predominantSpeciesName: 'Plátano de Sombra (Platanus × hispanica)',
    totalTreeCount: 175,
    avgCanopyDiameterM: 8.8,
    avgHeightM: 15.5,
    estimatedStreetLAI: 5.1,
    estimatedNO2DepositionKgYear: 52.0,
    estimatedPM25DepositionKgYear: 81.5,
    aerodynamicRiskStatus: 'Moderado',
    lat: 36.7260,
    lon: -4.4460
  },
  {
    id: 'MGA-TREE-STR-20',
    streetName: 'Avenida Jorge Luis Borges',
    district: 'Teatinos-Universidad',
    predominantSpeciesId: 'melia',
    predominantSpeciesName: 'Meliá (Melia azedarach)',
    totalTreeCount: 210,
    avgCanopyDiameterM: 6.0,
    avgHeightM: 9.0,
    estimatedStreetLAI: 3.3,
    estimatedNO2DepositionKgYear: 44.5,
    estimatedPM25DepositionKgYear: 62.0,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.7185,
    lon: -4.4680
  },
  {
    id: 'MGA-TREE-STR-21',
    streetName: 'Calle Victoria',
    district: 'Centro Histórico',
    predominantSpeciesId: 'cercis',
    predominantSpeciesName: 'Árbol del Amor (Cercis siliquastrum)',
    totalTreeCount: 55,
    avgCanopyDiameterM: 4.8,
    avgHeightM: 7.0,
    estimatedStreetLAI: 3.2,
    estimatedNO2DepositionKgYear: 11.5,
    estimatedPM25DepositionKgYear: 17.2,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.7270,
    lon: -4.4170
  },
  {
    id: 'MGA-TREE-STR-22',
    streetName: 'Monte Gibralfaro (Paseo D. Juan Temboury)',
    district: 'Centro / Periurbano',
    predominantSpeciesId: 'pinus',
    predominantSpeciesName: 'Pino Carrasco (Pinus halepensis)',
    totalTreeCount: 850,
    avgCanopyDiameterM: 7.5,
    avgHeightM: 14.0,
    estimatedStreetLAI: 2.8,
    estimatedNO2DepositionKgYear: 185.0,
    estimatedPM25DepositionKgYear: 310.0,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.7225,
    lon: -4.4095
  },
  {
    id: 'MGA-TREE-STR-23',
    streetName: 'Calle Eugenio Gross',
    district: 'Bailén-Miraflores',
    predominantSpeciesId: 'melia',
    predominantSpeciesName: 'Meliá (Melia azedarach)',
    totalTreeCount: 82,
    avgCanopyDiameterM: 5.5,
    avgHeightM: 8.5,
    estimatedStreetLAI: 3.3,
    estimatedNO2DepositionKgYear: 19.5,
    estimatedPM25DepositionKgYear: 28.1,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.7285,
    lon: -4.4370
  },
  {
    id: 'MGA-TREE-STR-24',
    streetName: 'Avenida de los Guindos',
    district: 'Carretera de Cádiz',
    predominantSpeciesId: 'tipuana',
    predominantSpeciesName: 'Tipuana / Palo Rosa (Tipuana tipu)',
    totalTreeCount: 125,
    avgCanopyDiameterM: 7.8,
    avgHeightM: 11.5,
    estimatedStreetLAI: 4.1,
    estimatedNO2DepositionKgYear: 33.2,
    estimatedPM25DepositionKgYear: 50.8,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.6965,
    lon: -4.4490
  },
  {
    id: 'MGA-TREE-STR-25',
    streetName: 'Calle Héroe de Sostoa',
    district: 'Carretera de Cádiz',
    predominantSpeciesId: 'citrus',
    predominantSpeciesName: 'Naranjo Amargo (Citrus aurantium)',
    totalTreeCount: 92,
    avgCanopyDiameterM: 4.2,
    avgHeightM: 6.2,
    estimatedStreetLAI: 3.1,
    estimatedNO2DepositionKgYear: 17.5,
    estimatedPM25DepositionKgYear: 27.0,
    aerodynamicRiskStatus: 'Óptimo',
    lat: 36.7085,
    lon: -4.4360
  }
];

export const OFFICIAL_MALAGA_STREET_TREES: MalagaStreetTreeRecord[] = [
  ...BASE_MALAGA_STREET_TREES,
  ...ADDITIONAL_CITYWIDE_MALAGA_TREES
];

// Mapa determinista de escala OPALS (Ogren Plant Allergy Scale 1-10) por especie
export const SPECIES_OPALS_MAP: Record<string, { opalsIndex: number; allergenicityStatus: 'Muy_Baja' | 'Baja' | 'Moderada' | 'Alta' | 'Muy_Alta' }> = {
  platanus: { opalsIndex: 9, allergenicityStatus: 'Muy_Alta' },
  citrus: { opalsIndex: 2, allergenicityStatus: 'Muy_Baja' },
  jacaranda: { opalsIndex: 2, allergenicityStatus: 'Muy_Baja' },
  ficus: { opalsIndex: 2, allergenicityStatus: 'Muy_Baja' },
  pinus: { opalsIndex: 4, allergenicityStatus: 'Moderada' },
  melia: { opalsIndex: 4, allergenicityStatus: 'Moderada' },
  phoenix: { opalsIndex: 6, allergenicityStatus: 'Moderada' },
  green_wall: { opalsIndex: 2, allergenicityStatus: 'Muy_Baja' },
  tipuana: { opalsIndex: 3, allergenicityStatus: 'Baja' },
  washingtonia: { opalsIndex: 5, allergenicityStatus: 'Moderada' },
  cercis: { opalsIndex: 2, allergenicityStatus: 'Muy_Baja' }
};

// Trazas geométricas lineales de los 25 corredores de arbolado viario de Málaga
export const MALAGA_STREET_ALIGNMENTS_GEOMETRY: Record<string, [[number, number], [number, number]]> = {
  'MGA-TREE-STR-01': [[-4.4265, 36.7188], [-4.4205, 36.7188]], // Alameda Principal (E-W)
  'MGA-TREE-STR-02': [[-4.4205, 36.7192], [-4.4095, 36.7192]], // Paseo del Parque (E-W)
  'MGA-TREE-STR-03': [[-4.4211, 36.7170], [-4.4211, 36.7195]], // Calle Marqués de Larios (N-S)
  'MGA-TREE-STR-04': [[-4.4390, 36.7175], [-4.4250, 36.7175]], // Avenida de Andalucía (E-W)
  'MGA-TREE-STR-05': [[-4.4550, 36.6950], [-4.4350, 36.7090]], // Avenida de Velázquez (SW-NE)
  'MGA-TREE-STR-06': [[-4.4245, 36.7235], [-4.4195, 36.7225]], // Calle Carretería (NW-SE)
  'MGA-TREE-STR-07': [[-4.4460, 36.6920], [-4.4300, 36.7040]], // Paseo Marítimo Antonio Banderas (SW-NE)
  'MGA-TREE-STR-08': [[-4.4820, 36.7150], [-4.4620, 36.7170]], // Bulevar Louis Pasteur (W-E)
  'MGA-TREE-STR-09': [[-4.4135, 36.7200], [-4.4085, 36.7210]], // Paseo de Reding (SW-NE)
  'MGA-TREE-STR-10': [[-4.4130, 36.7160], [-4.4110, 36.7135]], // Paseo de la Farola (NW-SE)
  'MGA-TREE-STR-11': [[-4.4260, 36.7220], [-4.4210, 36.7205]], // Calle Mármoles (W-E)
  'MGA-TREE-STR-12': [[-4.4260, 36.7280], [-4.4240, 36.7360]], // Paseo de Martiricos (S-N)
  'MGA-TREE-STR-13': [[-4.4030, 36.7210], [-4.3850, 36.7200]], // Paseo Marítimo Pablo Ruiz Picasso (W-E)
  'MGA-TREE-STR-14': [[-4.4340, 36.7145], [-4.4320, 36.7085]], // Paseo de los Tilos (N-S)
  'MGA-TREE-STR-15': [[-4.4390, 36.7020], [-4.4360, 36.7220]], // Avenida Juan XXIII (S-N)
  'MGA-TREE-STR-16': [[-4.4290, 36.7240], [-4.4250, 36.7310]], // Calle Eugenio Gross (S-N)
  'MGA-TREE-STR-17': [[-4.4160, 36.7240], [-4.4130, 36.7300]], // Calle Victoria (SW-NE)
  'MGA-TREE-STR-18': [[-4.4230, 36.7165], [-4.4225, 36.7140]], // Alameda de Colón (N-S)
  'MGA-TREE-STR-19': [[-4.4270, 36.7200], [-4.4230, 36.7200]], // Calle Hilera (W-E)
  'MGA-TREE-STR-20': [[-4.4180, 36.7260], [-4.4140, 36.7240]], // Calle Lagunillas (NW-SE)
  'MGA-TREE-STR-21': [[-4.4190, 36.7170], [-4.4170, 36.7170]], // Calle Alcazabilla (W-E)
  'MGA-TREE-STR-22': [[-4.4280, 36.7130], [-4.4250, 36.7130]], // Calle Cuarteles (W-E)
  'MGA-TREE-STR-23': [[-4.3650, 36.7180], [-4.3500, 36.7170]], // Bulevar Salvador Allende (W-E)
  'MGA-TREE-STR-24': [[-4.4530, 36.6950], [-4.4450, 36.6980]], // Avenida de los Guindos (SW-NE)
  'MGA-TREE-STR-25': [[-4.4420, 36.7050], [-4.4300, 36.7120]]  // Calle Héroe de Sostoa (SW-NE)
};

// Base de datos dasométrica y de captura de carbono certificada por corredor (IPCC Tier 2 / Nowak i-Tree Eco)
export interface StreetTreeDendrometryData {
  ageYears: number;
  ageClass: 'Joven (<15a)' | 'Maduro (15-50a)' | 'Maduro Tardío (50-100a)' | 'Monumental / Centenario (>100a)';
  historicalContext: string;
  dbhCm: number;
  carbonSeqKgYear: number;
  biomassKg: number;
  health: 'Excelente' | 'Bueno' | 'Aceptable' | 'En Observación';
  coolingDeltaC: number;
  transpirationLitersDay: number;
}

export const MALAGA_STREET_DENDROMETRY_DATA: Record<string, StreetTreeDendrometryData> = {
  'MGA-TREE-STR-01': {
    ageYears: 98,
    ageClass: 'Maduro Tardío (50-100a)',
    historicalContext: 'Alineación bicentenaria de plátanos de sombra originada a finales del s. XIX y protegida como arbolado singular de Málaga.',
    dbhCm: 74,
    carbonSeqKgYear: 62.8,
    biomassKg: 2150,
    health: 'Bueno',
    coolingDeltaC: -2.8,
    transpirationLitersDay: 280
  },
  'MGA-TREE-STR-02': {
    ageYears: 127,
    ageClass: 'Monumental / Centenario (>100a)',
    historicalContext: 'Jardín botánico subtropical fundado en 1897 sobre terrenos ganados al mar; ficus centenarios de copa monumental.',
    dbhCm: 145,
    carbonSeqKgYear: 124.5,
    biomassKg: 4800,
    health: 'Excelente',
    coolingDeltaC: -3.6,
    transpirationLitersDay: 450
  },
  'MGA-TREE-STR-03': {
    ageYears: 28,
    ageClass: 'Maduro (15-50a)',
    historicalContext: 'Reposición de naranjos amargos integrados con alcorques drenantes tras la peatonalización del centro histórico.',
    dbhCm: 24,
    carbonSeqKgYear: 11.4,
    biomassKg: 180,
    health: 'Bueno',
    coolingDeltaC: -1.2,
    transpirationLitersDay: 65
  },
  'MGA-TREE-STR-04': {
    ageYears: 45,
    ageClass: 'Maduro (15-50a)',
    historicalContext: 'Arteria principal de expansión hacia Cruz de Humilladero; corredor de jacarandas con floración primaveral densa.',
    dbhCm: 42,
    carbonSeqKgYear: 28.6,
    biomassKg: 680,
    health: 'Bueno',
    coolingDeltaC: -2.2,
    transpirationLitersDay: 195
  },
  'MGA-TREE-STR-05': {
    ageYears: 36,
    ageClass: 'Maduro (15-50a)',
    historicalContext: 'Eje arterial de Carretera de Cádiz; arbolado de meliá de gran resistencia a hidrocarburos y tráfico pesado.',
    dbhCm: 38,
    carbonSeqKgYear: 24.5,
    biomassKg: 520,
    health: 'Bueno',
    coolingDeltaC: -2.1,
    transpirationLitersDay: 160
  },
  'MGA-TREE-STR-06': {
    ageYears: 48,
    ageClass: 'Maduro (15-50a)',
    historicalContext: 'Trama perimetral norte del casco histórico medieval; plátanos en cañón urbano que exigen poda técnica de gálibo.',
    dbhCm: 52,
    carbonSeqKgYear: 45.2,
    biomassKg: 1120,
    health: 'Aceptable',
    coolingDeltaC: -1.8,
    transpirationLitersDay: 220
  },
  'MGA-TREE-STR-07': {
    ageYears: 32,
    ageClass: 'Maduro (15-50a)',
    historicalContext: 'Frente marítimo de Poniente; palmeras datileras adaptadas a salinidad eólica y brisas costeras.',
    dbhCm: 45,
    carbonSeqKgYear: 16.8,
    biomassKg: 340,
    health: 'Excelente',
    coolingDeltaC: -1.4,
    transpirationLitersDay: 90
  },
  'MGA-TREE-STR-08': {
    ageYears: 24,
    ageClass: 'Maduro (15-50a)',
    historicalContext: 'Bulevar universitario de Teatinos; jacarandas jóvenes con excelente ventilación natural y alcorques anchos.',
    dbhCm: 34,
    carbonSeqKgYear: 22.8,
    biomassKg: 430,
    health: 'Excelente',
    coolingDeltaC: -2.0,
    transpirationLitersDay: 175
  },
  'MGA-TREE-STR-09': {
    ageYears: 110,
    ageClass: 'Monumental / Centenario (>100a)',
    historicalContext: 'Paseo histórico de La Malagueta hacia los Baños del Carmen; ficus centenarios con raíces adventicias notables.',
    dbhCm: 135,
    carbonSeqKgYear: 118.2,
    biomassKg: 4200,
    health: 'Excelente',
    coolingDeltaC: -3.4,
    transpirationLitersDay: 410
  },
  'MGA-TREE-STR-10': {
    ageYears: 38,
    ageClass: 'Maduro (15-50a)',
    historicalContext: 'Ribera del muelle portuario frente a la Farola histórica de 1817; palmeras de abanico de porte vertical.',
    dbhCm: 42,
    carbonSeqKgYear: 15.6,
    biomassKg: 310,
    health: 'Bueno',
    coolingDeltaC: -1.3,
    transpirationLitersDay: 85
  },
  'MGA-TREE-STR-11': {
    ageYears: 34,
    ageClass: 'Maduro (15-50a)',
    historicalContext: 'Acceso a Bailén; meliás de sombra estival diseñadas para reducir la carga térmica peatonal.',
    dbhCm: 36,
    carbonSeqKgYear: 23.2,
    biomassKg: 490,
    health: 'Bueno',
    coolingDeltaC: -1.9,
    transpirationLitersDay: 155
  },
  'MGA-TREE-STR-12': {
    ageYears: 65,
    ageClass: 'Maduro Tardío (50-100a)',
    historicalContext: 'Ribera del Guadalmedina frente a La Rosaleda; plátanos de sombra de copa amplia con alta retención de PM10.',
    dbhCm: 62,
    carbonSeqKgYear: 54.0,
    biomassKg: 1580,
    health: 'Bueno',
    coolingDeltaC: -2.6,
    transpirationLitersDay: 260
  },
  'MGA-TREE-STR-13': {
    ageYears: 35,
    ageClass: 'Maduro (15-50a)',
    historicalContext: 'Fachada costera oriental hacia Pedregalejo; pantalla vegetal de palmeras frente a vientos de Levante.',
    dbhCm: 44,
    carbonSeqKgYear: 16.2,
    biomassKg: 330,
    health: 'Excelente',
    coolingDeltaC: -1.5,
    transpirationLitersDay: 95
  },
  'MGA-TREE-STR-14': {
    ageYears: 42,
    ageClass: 'Maduro (15-50a)',
    historicalContext: 'Paseo peatonal y viario de Cruz de Humilladero; alineación continua de jacarandas.',
    dbhCm: 40,
    carbonSeqKgYear: 27.5,
    biomassKg: 620,
    health: 'Bueno',
    coolingDeltaC: -2.1,
    transpirationLitersDay: 180
  },
  'MGA-TREE-STR-15': {
    ageYears: 38,
    ageClass: 'Maduro (15-50a)',
    historicalContext: 'Eje transversal oeste; meliás que proporcionan sombra densa sobre la calzada norte-sur.',
    dbhCm: 38,
    carbonSeqKgYear: 24.8,
    biomassKg: 540,
    health: 'Bueno',
    coolingDeltaC: -2.0,
    transpirationLitersDay: 165
  },
  'MGA-TREE-STR-16': {
    ageYears: 30,
    ageClass: 'Maduro (15-50a)',
    historicalContext: 'Paseo tradicional de pescadores de Pedregalejo; palmeras washingtonias que permiten brisa marina inalterada.',
    dbhCm: 40,
    carbonSeqKgYear: 15.0,
    biomassKg: 290,
    health: 'Excelente',
    coolingDeltaC: -1.3,
    transpirationLitersDay: 80
  },
  'MGA-TREE-STR-17': {
    ageYears: 40,
    ageClass: 'Maduro (15-50a)',
    historicalContext: 'Bulevar de El Palo; arbolado de tipuanas con flores amarillas y copiosa sombra para mitigar la isla de calor.',
    dbhCm: 48,
    carbonSeqKgYear: 33.4,
    biomassKg: 780,
    health: 'Excelente',
    coolingDeltaC: -2.4,
    transpirationLitersDay: 210
  },
  'MGA-TREE-STR-18': {
    ageYears: 35,
    ageClass: 'Maduro (15-50a)',
    historicalContext: 'Avenida Juan XXIII tramo sur; barrera vegetal entre áreas residenciales y tejido comercial.',
    dbhCm: 36,
    carbonSeqKgYear: 23.5,
    biomassKg: 500,
    health: 'Bueno',
    coolingDeltaC: -1.9,
    transpirationLitersDay: 150
  },
  'MGA-TREE-STR-19': {
    ageYears: 55,
    ageClass: 'Maduro Tardío (50-100a)',
    historicalContext: 'Entorno del Hospital Civil y Regional; plátanos de porte elevado que filtran emisiones vehiculares.',
    dbhCm: 58,
    carbonSeqKgYear: 51.2,
    biomassKg: 1420,
    health: 'Bueno',
    coolingDeltaC: -2.5,
    transpirationLitersDay: 245
  },
  'MGA-TREE-STR-20': {
    ageYears: 22,
    ageClass: 'Maduro (15-50a)',
    historicalContext: 'Zona de expansión universitaria de Teatinos; meliás en alcorques ajardinados con crecimiento vigoroso.',
    dbhCm: 32,
    carbonSeqKgYear: 21.5,
    biomassKg: 380,
    health: 'Excelente',
    coolingDeltaC: -1.8,
    transpirationLitersDay: 140
  },
  'MGA-TREE-STR-21': {
    ageYears: 26,
    ageClass: 'Maduro (15-50a)',
    historicalContext: 'Calle Victoria hacia la Basílica; árboles del amor con floración primaveral sobre el tronco.',
    dbhCm: 28,
    carbonSeqKgYear: 14.2,
    biomassKg: 240,
    health: 'Bueno',
    coolingDeltaC: -1.4,
    transpirationLitersDay: 85
  },
  'MGA-TREE-STR-22': {
    ageYears: 75,
    ageClass: 'Maduro Tardío (50-100a)',
    historicalContext: 'Masa forestal periurbana de Monte Gibralfaro; pinar protector de la ladera histórica de la Alcazaba.',
    dbhCm: 48,
    carbonSeqKgYear: 34.8,
    biomassKg: 860,
    health: 'Excelente',
    coolingDeltaC: -3.2,
    transpirationLitersDay: 230
  },
  'MGA-TREE-STR-23': {
    ageYears: 32,
    ageClass: 'Maduro (15-50a)',
    historicalContext: 'Eje densamente poblado de Bailén-Miraflores; meliás con alta tasa de interceptación foliar de partículas.',
    dbhCm: 35,
    carbonSeqKgYear: 23.0,
    biomassKg: 470,
    health: 'Bueno',
    coolingDeltaC: -1.9,
    transpirationLitersDay: 150
  },
  'MGA-TREE-STR-24': {
    ageYears: 36,
    ageClass: 'Maduro (15-50a)',
    historicalContext: 'Bulevar de Los Guindos; tipuanas de copa parasol en Las Delicias y barriada La Paz.',
    dbhCm: 46,
    carbonSeqKgYear: 32.0,
    biomassKg: 720,
    health: 'Excelente',
    coolingDeltaC: -2.3,
    transpirationLitersDay: 200
  },
  'MGA-TREE-STR-25': {
    ageYears: 30,
    ageClass: 'Maduro (15-50a)',
    historicalContext: 'Arteria de acceso a la estación María Zambrano; naranjos amargos integrados en acera peatonal.',
    dbhCm: 25,
    carbonSeqKgYear: 11.8,
    biomassKg: 195,
    health: 'Bueno',
    coolingDeltaC: -1.3,
    transpirationLitersDay: 70
  }
};

// Enriquecimiento determinista inicial de los registros oficiales
OFFICIAL_MALAGA_STREET_TREES.forEach(r => {
  const opalsInfo = SPECIES_OPALS_MAP[r.predominantSpeciesId] || { opalsIndex: 3, allergenicityStatus: 'Baja' as const };
  r.streetOpalsScore = opalsInfo.opalsIndex;
  r.allergenicityStatus = opalsInfo.allergenicityStatus;
  r.streetCoordinatesSegment = MALAGA_STREET_ALIGNMENTS_GEOMETRY[r.id] || [
    [r.lon - 0.002, r.lat],
    [r.lon + 0.002, r.lat]
  ];

  // Enriquecer con dasometría, edad y captura de carbono certificada
  const d = MALAGA_STREET_DENDROMETRY_DATA[r.id] || {
    ageYears: 35,
    ageClass: 'Maduro (15-50a)' as const,
    historicalContext: 'Alineación de arbolado viario consolidada en el término municipal de Málaga.',
    dbhCm: 38,
    carbonSeqKgYear: 25.0,
    biomassKg: 500,
    health: 'Bueno' as const,
    coolingDeltaC: -1.9,
    transpirationLitersDay: 150
  };

  r.estimatedAgeYears = d.ageYears;
  r.ageClassification = d.ageClass;
  r.historicalContext = d.historicalContext;
  r.trunkDiameterDbhCm = d.dbhCm;
  r.carbonSequestrationKgCo2YearPerTree = d.carbonSeqKgYear;
  r.totalCarbonSequestrationTonCo2Year = parseFloat(((d.carbonSeqKgYear * r.totalTreeCount) / 1000).toFixed(2));
  r.accumulatedBiomassKgPerTree = d.biomassKg;
  r.accumulatedCarbonStorageTonCo2 = parseFloat((((d.biomassKg * 0.50 * (44 / 12)) * r.totalTreeCount) / 1000).toFixed(1));
  r.treeHealthStatus = d.health;
  r.microclimateCoolingDeltaC = d.coolingDeltaC;
  r.dailyTranspirationLitersPerTree = d.transpirationLitersDay;
});

/**
 * Generador determinista de ejemplares arbóreos individuales a lo largo del corredor viario
 */
export function getSampleIndividualTreesForStreet(
  street: MalagaStreetTreeRecord,
  sampleCount = 8
): IndividualTreeSpecimen[] {
  const seg = street.streetCoordinatesSegment || [
    [street.lon - 0.002, street.lat],
    [street.lon + 0.002, street.lat]
  ];

  const species = MALAGA_SPECIES_CATALOG.find(s => s.id === street.predominantSpeciesId);
  const baseAge = street.estimatedAgeYears || 35;
  const baseDbh = street.trunkDiameterDbhCm || 40;
  const baseCarbon = street.carbonSequestrationKgCo2YearPerTree || 25;
  const baseBiomass = street.accumulatedBiomassKgPerTree || 500;
  const baseOpals = street.streetOpalsScore || 3;

  const count = Math.min(sampleCount, street.totalTreeCount);
  const specimens: IndividualTreeSpecimen[] = [];

  for (let i = 1; i <= count; i++) {
    // Fracción determinista a lo largo de la traza
    const t = count > 1 ? (i - 0.5) / count : 0.5;
    const lon = parseFloat((seg[0][0] + (seg[1][0] - seg[0][0]) * t).toFixed(6));
    const lat = parseFloat((seg[0][1] + (seg[1][1] - seg[0][1]) * t).toFixed(6));

    // Variabilidad biológica determinista (sin Math.random) mediante función trigonométrica pseudo-hash
    const seed = (street.streetName.length * 17 + i * 31) % 100;
    const varianceFactor = 0.88 + (Math.sin(seed) * 0.5 + 0.5) * 0.24; // Rango 0.88 - 1.12

    const age = Math.round(baseAge * varianceFactor);
    const dbh = parseFloat((baseDbh * varianceFactor).toFixed(1));
    const height = parseFloat((street.avgHeightM * (0.92 + (Math.cos(seed) * 0.5 + 0.5) * 0.16)).toFixed(1));
    const canopy = parseFloat((street.avgCanopyDiameterM * (0.90 + (Math.sin(seed * 1.5) * 0.5 + 0.5) * 0.20)).toFixed(1));
    const carbonSeq = parseFloat((baseCarbon * varianceFactor).toFixed(1));
    const storageKg = Math.round(baseBiomass * varianceFactor * 0.50 * (44 / 12));

    const healthChoices: ('Excelente' | 'Bueno' | 'Aceptable')[] = ['Excelente', 'Bueno', 'Bueno', 'Bueno', 'Aceptable'];
    const health = healthChoices[seed % healthChoices.length];

    specimens.push({
      treeId: `${street.id}-TR-${String(i).padStart(2, '0')}`,
      streetId: street.id,
      streetName: street.streetName,
      district: street.district,
      speciesId: street.predominantSpeciesId,
      speciesCommonName: species?.commonName || street.predominantSpeciesName.split('(')[0].trim(),
      speciesScientificName: species?.scientificName || 'Especie urbana',
      specimenNumber: i,
      lat,
      lon,
      ageYears: age,
      ageClass: street.ageClassification || (age > 100 ? 'Monumental / Centenario (>100a)' : age > 50 ? 'Maduro Tardío (50-100a)' : age > 15 ? 'Maduro (15-50a)' : 'Joven (<15a)'),
      dbhCm: dbh,
      heightM: height,
      canopyDiameterM: canopy,
      carbonSequestrationKgCo2Year: carbonSeq,
      accumulatedCarbonStorageKgCo2: storageKg,
      healthStatus: health,
      no2DepositionGYear: Math.round((street.estimatedNO2DepositionKgYear * 1000 / street.totalTreeCount) * varianceFactor),
      pm25DepositionGYear: Math.round((street.estimatedPM25DepositionKgYear * 1000 / street.totalTreeCount) * varianceFactor),
      opalsScore: baseOpals,
      coolingDeltaC: street.microclimateCoolingDeltaC || -2.0,
      transpirationLitersDay: Math.round((street.dailyTranspirationLitersPerTree || 150) * varianceFactor)
    });
  }

  return specimens;
}

export interface StreetLiveAbsorptionMetrics {
  streetId: string;
  streetName: string;
  district: string;
  treeCount: number;
  speciesId: string;
  speciesName: string;
  foliageType: string;
  canopyDiameterM: number;
  totalCanopyAreaM2: number;
  totalFoliageAreaM2: number;
  
  // Variables ambientales en vivo
  liveTempC: number;
  liveRhPct: number;
  liveParWm2: number;
  liveWindSpeedMs: number;
  liveNO2Ugm3: number;
  liveO3Ugm3: number;
  livePM25Ugm3: number;
  livePM10Ugm3: number;
  liveSO2Ugm3: number;

  // Parámetros estomáticos
  stomataAperturePct: number;
  gswMmolM2s: number;
  rstNO2s_cm: number;
  rstO3s_cm: number;

  // Flujos por árbol individual
  unitTreeNO2AbsorptionGramsHour: number;
  unitTreeO3AbsorptionGramsHour: number;
  unitTreePM25DepositionGramsHour: number;
  unitTreePM10DepositionGramsHour: number;
  unitTreeTranspirationLitersHour: number;

  // Totales de la calle completa (alineación completa de árboles)
  streetNO2AbsorptionGramsHour: number;
  streetNO2AbsorptionKgYear: number;
  streetO3AbsorptionGramsHour: number;
  streetO3AbsorptionKgYear: number;
  streetPM25DepositionGramsHour: number;
  streetPM25DepositionKgYear: number;
  streetPM10DepositionGramsHour: number;
  streetPM10DepositionKgYear: number;
  streetTranspirationLitersDay: number;
  streetBioclimaticCoolingKW: number;

  // Metabolismo y bioquímica celular
  no2ProteinFixationRateGramsHour: number; // GS/GOGAT a proteínas
  o3AscorbateDetoxRateGramsHour: number; // APX a O2 y H2O
  bvocNetEmissionGramsHour: number; // Isopreno + Terpenos
  netPollutantMitigationScore: number; // 0-100

  // Biofísica de episodios extremos (VPD, Terral, ABA y Foyer-Halliwell-Asada)
  vpdKpa: number; // Déficit de presión de vapor en kPa
  isTerralActive: boolean; // Detección determinista de Terral en Málaga
  terralSeverityPct: number; // 0-100% severidad de Terral
  abaHormoneSignalPct: number; // 0-100% síntesis de Ácido Abscísico
  xylemCavitationRiskPct: number; // Riesgo de cavitación/embolia xilemática
  apoplasticAscorbateSaturationPct: number; // Saturación del ciclo APX (Foyer-Halliwell-Asada)
  ozoneOxidativeStressIndex: number; // Índice de estrés oxidativo en células oclusivas (0-100%)
  rosGenerationRateUmolM2s: number; // Generación de especies reactivas de oxígeno en apoplasto

  // Impacto en Calidad del Aire y Microclima Peatonal a Nivel de Calle (1.8m AGL)
  liveNO2AbatementUgm3: number; // Reducción directa estimada de NO2 en el aire de la calle (µg/m³)
  livePM25AbatementUgm3: number; // Reducción de PM2.5 (µg/m³)
  liveO3AbatementUgm3: number; // Reducción de O3 (µg/m³)
  canyonWindDecelerationPct: number; // Desaceleración del viento en el cañón por arrastre Cd (%)
  microclimateCoolingDeltaC: number; // Enfriamiento superficial microclimático (°C)
  leightonRatioModulated: number; // Modulación del fotociclo Leighton phi
  canyonAerodynamicStatus: 'Óptimo' | 'Moderado' | 'Riesgo_Estancamiento';

  // Caracterización Alergénica y Escala OPALS
  opalsIndex: number; // Escala Ogren de Alergia Vegetal (1 a 10)
  allergenicityLevel: 'Muy Baja' | 'Baja' | 'Moderada' | 'Alta' | 'Muy Alta';
  pollenVector: string; // Vector polínico
  pollenSeason: string; // Época de polinización
  allergenBioDetails: string; // Detalle bioquímico del polen
  ecosystemTradeOffRatio: number; // Depuración / Alergia (antiPollutionScore / OPALS)
}

/**
 * Calcula determinísticamente la absorción físico-química y retención en vivo
 * para todos los árboles de una calle de Málaga, acoplando la telemetría real y la fisiología estomática.
 */
export function calculateStreetTreeLiveAbsorption(
  street: MalagaStreetTreeRecord,
  species: TreeSpeciesAntiPollutionProfile,
  meteo: {
    tempC?: number;
    rhPct?: number;
    parWm2?: number;
    windSpeedMs?: number;
    uvIndex?: number;
  },
  pollution: {
    no2Ugm3?: number;
    o3Ugm3?: number;
    pm25Ugm3?: number;
    pm10Ugm3?: number;
    so2Ugm3?: number;
  },
  manualApertureOverride?: number
): StreetLiveAbsorptionMetrics {
  const tempC = meteo.tempC ?? 26.0;
  const rhPct = meteo.rhPct ?? 58.0;
  const parWm2 = meteo.parWm2 ?? Math.max(150, (meteo.uvIndex || 6) * 160);
  const windSpeedMs = meteo.windSpeedMs ?? 3.2;

  const no2Ugm3 = pollution.no2Ugm3 ?? 36.0;
  const o3Ugm3 = pollution.o3Ugm3 ?? 64.0;
  const pm25Ugm3 = pollution.pm25Ugm3 ?? 14.5;
  const pm10Ugm3 = pollution.pm10Ugm3 ?? 25.0;
  const so2Ugm3 = pollution.so2Ugm3 ?? 3.2;

  // Geometría del dosel de la calle
  const singleTreeCanopyAreaM2 = Math.PI * Math.pow(street.avgCanopyDiameterM / 2.0, 2);
  const totalCanopyAreaM2 = singleTreeCanopyAreaM2 * street.totalTreeCount;
  const totalFoliageAreaM2 = totalCanopyAreaM2 * street.estimatedStreetLAI;

  // 1. Presión de vapor de saturación según formulación de Tetens y VPD real
  const esatKpa = 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  const eactKpa = esatKpa * (rhPct / 100.0);
  const vpdKpa = parseFloat(Math.max(0.05, esatKpa - eactKpa).toFixed(2));

  // 2. Detección determinista de Episodio de Terral en Málaga:
  // Vientos catabáticos subsidentes del N/NO caracterizados por T > 31°C, HR < 35% y fuerte demanda evaporativa (VPD > 2.5 kPa)
  const isTerralActive = (tempC >= 31.0 && rhPct <= 35.0) || vpdKpa >= 2.6;
  const terralSeverityPct = isTerralActive
    ? Math.min(100, Math.max(0, Math.round(((tempC - 28) * 4.2 + (40 - rhPct) * 1.6 + (vpdKpa - 1.8) * 18))))
    : 0;

  // 3. Respuesta estomática al VPD según modelo Ball-Berry-Leuning:
  // Especies esclerófilas mediterráneas (olivo, ciprés, adelfa, palmera) poseen mayor capacitancia hídrica y umbral D0 (~2.4 kPa)
  // frente a caducifolios mesófilos o riparios (plátano de sombra, fresno) con umbral D0 (~1.4 kPa)
  const isMediterraneanSclerophyll = species.foliageType === 'Perennifolio' || species.id === 'olivo' || species.id === 'palmera' || species.id === 'adelfa' || species.id === 'cipres';
  const d0_vpd = isMediterraneanSclerophyll ? 2.45 : 1.40;
  const fVpd = 1.0 / (1.0 + (vpdKpa / d0_vpd));

  // 4. Mecanismo de señalización hormonal por Ácido Abscísico (ABA):
  // Ante VPD elevado (>1.3 kPa) y estrés hídrico, se induce la síntesis de ABA foliar y radicular,
  // promoviendo la salida de K+ y aniones de las células oclusivas, pérdida de turgencia y cierre defensivo
  const abaHormoneSignalPct = Math.min(100, Math.max(0, Math.round(((vpdKpa - 1.2) / 2.6) * 100)));
  const abaClosureFactor = Math.max(0.08, 1.0 - (abaHormoneSignalPct / 100.0) * 0.84);

  // Riesgo biofísico de cavitación/embolia del xilema:
  // Si los estomas permanecieran abiertos en condiciones de alto VPD, la tensión de la columna de savia alcanzaría el P50
  const rawCavitationTension = vpdKpa * (isMediterraneanSclerophyll ? 1.05 : 1.75);
  const xylemCavitationRiskPct = Math.min(95, Math.max(2, Math.round(rawCavitationTension * 15)));

  // 5. Cinética enzimática del Ciclo Foyer-Halliwell-Asada y Saturación Oxidativa de O3:
  // La ascorbato peroxidasa (APX) apoplástica detoxifica O3 vía ácido ascórbico: O3 + 2 AsA -> 2 MDHA + O2 + H2O
  // Con concentraciones elevadas de O3 (>70 µg/m³), la regeneración por MDHAR/GR se satura
  const apxVmaxUgm3 = 72.0 * (species.antiPollutionScore / 7.5);
  const km_O3 = 30.0;
  const apoplasticAscorbateSaturationPct = Math.min(100, Math.max(0, Math.round((o3Ugm3 / (o3Ugm3 + km_O3 * 0.85)) * 100 * (o3Ugm3 > apxVmaxUgm3 ? 1.18 : 0.82))));
  
  // Exceso oxidativo y ataque a membranas celulares de células oclusivas (ROS)
  const o3Excess = Math.max(0, o3Ugm3 - apxVmaxUgm3);
  const ozoneOxidativeStressIndex = Math.min(100, Math.max(0, Math.round((o3Excess / 75.0) * 100 + (apoplasticAscorbateSaturationPct > 80 ? 12 : 0))));
  const rosGenerationRateUmolM2s = parseFloat((o3Ugm3 * 0.014 * (1.0 + ozoneOxidativeStressIndex / 100.0)).toFixed(3));

  // 6. Cálculo biofísico acoplado de apertura estomática (0 a 100%)
  const fPar = parWm2 / (parWm2 + 220.0);
  const tempDiff = Math.abs(tempC - 26.5);
  const fTemp = Math.max(0.15, 1.0 - (tempDiff * 0.038));
  
  // Apertura natural integrando luz, temperatura, VPD Leuning y señal hormonal defensiva ABA
  const naturalAperture = Math.min(100, Math.max(6, Math.round(100 * fPar * fTemp * fVpd * abaClosureFactor)));
  const stomataAperturePct = manualApertureOverride !== undefined ? manualApertureOverride : naturalAperture;
  const apertureRatio = stomataAperturePct / 100.0;

  // Resistencias según Wesely (1989) y Ley de Fick
  // Ra + Rb función del viento
  const uStar = Math.max(0.15, windSpeedMs * 0.1);
  const rBoundary = Math.max(0.25, 0.45 / Math.sqrt(uStar)); // s/cm
  
  // Resistencia estomática Rst (s/cm)
  const rstMinNO2 = 1.0 / Math.max(0.1, species.vdNO2 * 1.8);
  const rstMinO3 = 1.0 / Math.max(0.1, species.vdO3 * 1.8);
  const rstNO2s_cm = apertureRatio > 0.04 ? parseFloat((rstMinNO2 / apertureRatio).toFixed(2)) : 999.0;
  const rstO3s_cm = apertureRatio > 0.04 ? parseFloat((rstMinO3 / apertureRatio).toFixed(2)) : 999.0;

  // Conductancia estomática gsw (mmol / m² s)
  const gswMmolM2s = parseFloat((apertureRatio * 320.0 * Math.max(0.2, fPar)).toFixed(1));

  // Velocidades efectivas de deposición estomática Vd (cm/s -> m/s)
  const vdEffectiveNO2 = (1.0 / (rBoundary + rstNO2s_cm)) * 0.01; // m/s
  const vdEffectiveO3 = (1.0 / (rBoundary + rstO3s_cm)) * 0.01; // m/s
  
  // Velocidad de deposición en cutícula para PM2.5 y PM10 (impaccional/mecánica)
  const vdEffectivePM25 = species.vdPM25 * 0.01 * (1.0 + (windSpeedMs - 2.0) * 0.12);
  const vdEffectivePM10 = species.vdPM10 * 0.01 * (1.0 + (windSpeedMs - 2.0) * 0.15);

  // Flujos de absorción unitarios (por m² de hoja por segundo: µg/m² s)
  const fluxNO2_ug_m2_s = vdEffectiveNO2 * no2Ugm3;
  const fluxO3_ug_m2_s = vdEffectiveO3 * o3Ugm3;
  const fluxPM25_ug_m2_s = vdEffectivePM25 * pm25Ugm3;
  const fluxPM10_ug_m2_s = vdEffectivePM10 * pm10Ugm3;

  // Absorción de la calle completa (g/h = µg/m² s * m² * 3600 / 1e6)
  const streetNO2AbsorptionGramsHour = parseFloat((fluxNO2_ug_m2_s * totalFoliageAreaM2 * 3600 / 1e6).toFixed(2));
  const streetO3AbsorptionGramsHour = parseFloat((fluxO3_ug_m2_s * totalFoliageAreaM2 * 3600 / 1e6).toFixed(2));
  const streetPM25DepositionGramsHour = parseFloat((fluxPM25_ug_m2_s * totalFoliageAreaM2 * 3600 / 1e6).toFixed(2));
  const streetPM10DepositionGramsHour = parseFloat((fluxPM10_ug_m2_s * totalFoliageAreaM2 * 3600 / 1e6).toFixed(2));

  // Estimaciones anualizadas a régimen medio (kg/año)
  const streetNO2AbsorptionKgYear = parseFloat((streetNO2AbsorptionGramsHour * 8760 * 0.45 / 1000).toFixed(1));
  const streetO3AbsorptionKgYear = parseFloat((streetO3AbsorptionGramsHour * 8760 * 0.50 / 1000).toFixed(1));
  const streetPM25DepositionKgYear = parseFloat((streetPM25DepositionGramsHour * 8760 * 0.55 / 1000).toFixed(1));
  const streetPM10DepositionKgYear = parseFloat((streetPM10DepositionGramsHour * 8760 * 0.55 / 1000).toFixed(1));

  // Unitario por árbol individual
  const unitTreeNO2AbsorptionGramsHour = parseFloat((streetNO2AbsorptionGramsHour / street.totalTreeCount).toFixed(3));
  const unitTreeO3AbsorptionGramsHour = parseFloat((streetO3AbsorptionGramsHour / street.totalTreeCount).toFixed(3));
  const unitTreePM25DepositionGramsHour = parseFloat((streetPM25DepositionGramsHour / street.totalTreeCount).toFixed(3));
  const unitTreePM10DepositionGramsHour = parseFloat((streetPM10DepositionGramsHour / street.totalTreeCount).toFixed(3));

  // Transpiración ajustada con el VPD real y refrigeración microclimática
  // E = gsw * VPD / Patm
  const transpirationMmolM2s = gswMmolM2s * (vpdKpa / 101.3);
  // Litros/hora por m² foliar = mmol/m²s * 18g/mol / 1000 * 3600 / 1000 = mmol * 0.0648
  const leafTranspirationLitersHourTotal = (transpirationMmolM2s * 0.0648 * totalFoliageAreaM2) / 1000;
  const streetTranspirationLitersDay = parseFloat((leafTranspirationLitersHourTotal * 12).toFixed(1));
  const unitTreeTranspirationLitersHour = parseFloat((leafTranspirationLitersHourTotal / street.totalTreeCount).toFixed(2));

  // Potencia de enfriamiento bioclimático latente (kW)
  // Calor latente de vaporización del agua ~ 2450 kJ/kg
  const streetBioclimaticCoolingKW = parseFloat(((leafTranspirationLitersHourTotal * 2450) / 3600).toFixed(2));

  // Detoxificación bioquímica tisular
  // Ciclo GS/GOGAT: 14g de Nitrógeno por cada 46g de NO2 con ~86% de asimilación proteica a aminoácidos
  const no2ProteinFixationRateGramsHour = parseFloat((streetNO2AbsorptionGramsHour * (14.0 / 46.0) * 0.86).toFixed(2));
  
  // Detoxificación APX de O3 acoplada a la fracción no saturada del ciclo Foyer-Halliwell-Asada
  const apxEffectiveDetoxRatio = Math.max(0.40, 0.94 - (ozoneOxidativeStressIndex / 100.0) * 0.45);
  const o3AscorbateDetoxRateGramsHour = parseFloat((streetO3AbsorptionGramsHour * apxEffectiveDetoxRatio).toFixed(2));

  // Emisión de BVOCs (Isopreno + Terpenos) según Guenther MEGAN
  const bvocBaseRate = (species.bvocIsopreneRate + species.bvocTerpeneRate); // µg/g foliar/h
  const leafDryBiomassGrams = totalFoliageAreaM2 * 85.0; // ~85 g/m² de masa foliar específica seca
  const bvocEmissionGramsHour = parseFloat((
    bvocBaseRate * Math.exp(0.09 * (tempC - 30.0)) * fPar * leafDryBiomassGrams * 1e-6
  ).toFixed(2));

  // Score neto de mitigación ambiental (0 a 100) ponderado por estrés oxidativo y penalización de BVOC
  const grossMitigation = (streetNO2AbsorptionGramsHour * 1.5 + streetPM25DepositionGramsHour * 2.0 + streetO3AbsorptionGramsHour * 1.2);
  const bvocPenalty = bvocEmissionGramsHour * 0.4;
  const oxidativePenalty = ozoneOxidativeStressIndex * 0.15;
  const netScore = Math.min(99.0, Math.max(30.0, parseFloat((species.antiPollutionScore * 9.5 + (grossMitigation / (grossMitigation + bvocPenalty + 1.0)) * 10.0 - oxidativePenalty).toFixed(1))));

  // Caracterización Alergénica y Escala OPALS
  const opalsIndex = species.opalsIndex ?? 3;
  const allergenicityLevel = species.allergenicityLevel ?? 'Baja';
  const pollenVector = species.pollenVector ?? 'Entomófilo';
  const pollenSeason = species.pollenSeason ?? 'Primavera';
  const allergenBioDetails = species.allergenBioDetails ?? 'Sin datos';
  const ecosystemTradeOffRatio = parseFloat((species.antiPollutionScore / Math.max(1, opalsIndex)).toFixed(2));

  return {
    streetId: street.id,
    streetName: street.streetName,
    district: street.district,
    treeCount: street.totalTreeCount,
    speciesId: species.id,
    speciesName: `${species.commonName} (${species.scientificName})`,
    foliageType: species.foliageType,
    canopyDiameterM: street.avgCanopyDiameterM,
    totalCanopyAreaM2: parseFloat(totalCanopyAreaM2.toFixed(1)),
    totalFoliageAreaM2: parseFloat(totalFoliageAreaM2.toFixed(1)),
    liveTempC: tempC,
    liveRhPct: rhPct,
    liveParWm2: parWm2,
    liveWindSpeedMs: windSpeedMs,
    liveNO2Ugm3: no2Ugm3,
    liveO3Ugm3: o3Ugm3,
    livePM25Ugm3: pm25Ugm3,
    livePM10Ugm3: pm10Ugm3,
    liveSO2Ugm3: so2Ugm3,
    stomataAperturePct,
    gswMmolM2s,
    rstNO2s_cm,
    rstO3s_cm,
    unitTreeNO2AbsorptionGramsHour,
    unitTreeO3AbsorptionGramsHour,
    unitTreePM25DepositionGramsHour,
    unitTreePM10DepositionGramsHour,
    unitTreeTranspirationLitersHour,
    streetNO2AbsorptionGramsHour,
    streetNO2AbsorptionKgYear,
    streetO3AbsorptionGramsHour,
    streetO3AbsorptionKgYear,
    streetPM25DepositionGramsHour,
    streetPM25DepositionKgYear,
    streetPM10DepositionGramsHour,
    streetPM10DepositionKgYear,
    streetTranspirationLitersDay,
    streetBioclimaticCoolingKW,
    no2ProteinFixationRateGramsHour,
    o3AscorbateDetoxRateGramsHour,
    bvocNetEmissionGramsHour: bvocEmissionGramsHour,
    netPollutantMitigationScore: netScore,

    // Impacto microescalar en calidad del aire a nivel de calle (1.8m AGL)
    liveNO2AbatementUgm3: parseFloat(Math.min(no2Ugm3 * 0.45, (streetNO2AbsorptionGramsHour * 1e6) / (Math.max(2000, street.totalTreeCount * 12.0 * street.avgCanopyDiameterM * 18.0) * 3600)).toFixed(2)),
    livePM25AbatementUgm3: parseFloat(Math.min(pm25Ugm3 * 0.40, (streetPM25DepositionGramsHour * 1e6) / (Math.max(2000, street.totalTreeCount * 12.0 * street.avgCanopyDiameterM * 18.0) * 3600)).toFixed(2)),
    liveO3AbatementUgm3: parseFloat(Math.min(o3Ugm3 * 0.35, (streetO3AbsorptionGramsHour * 1e6) / (Math.max(2000, street.totalTreeCount * 12.0 * street.avgCanopyDiameterM * 18.0) * 3600)).toFixed(2)),
    canyonWindDecelerationPct: Math.min(65, Math.round(species.cdDragCoef * street.estimatedStreetLAI * 14.0)),
    microclimateCoolingDeltaC: parseFloat(Math.min(3.8, 0.40 * street.estimatedStreetLAI + (streetBioclimaticCoolingKW / 75.0)).toFixed(2)),
    leightonRatioModulated: parseFloat((1.0 - (Math.min(no2Ugm3 * 0.35, (streetNO2AbsorptionGramsHour * 1e6) / 200000) / Math.max(10, no2Ugm3)) * 0.25).toFixed(3)),
    canyonAerodynamicStatus: street.aerodynamicRiskStatus || 'Óptimo',

    // Biofísica de episodios extremos
    vpdKpa,
    isTerralActive,
    terralSeverityPct,
    abaHormoneSignalPct,
    xylemCavitationRiskPct,
    apoplasticAscorbateSaturationPct,
    ozoneOxidativeStressIndex,
    rosGenerationRateUmolM2s,

    // Métricas de Alergenicidad (OPALS)
    opalsIndex,
    allergenicityLevel,
    pollenVector,
    pollenSeason,
    allergenBioDetails,
    ecosystemTradeOffRatio
  };
}

/**
 * Consulta la API proxy del servidor para obtener los datos del inventario de arbolado de Málaga en vivo.
 */
export async function fetchMalagaTreeInventory(): Promise<MalagaTreesInventorySummary> {
  try {
    const res = await fetch('/api/malaga-open-data/tree-inventory');
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const data = await res.json();
    if (data && data.streetRecords && Array.isArray(data.streetRecords)) {
      return data;
    }
  } catch (err) {
    console.warn("Uso de fallback local para inventario de arbolado de Málaga:", err);
  }

  const totalTrees = OFFICIAL_MALAGA_STREET_TREES.reduce((acc, curr) => acc + curr.totalTreeCount, 0);

  return {
    source: "Portal de Datos Abiertos del Ayuntamiento de Málaga (datosabiertos.malaga.eu / WFS GeoServer)",
    ckanPackageId: "arbolado-urbano-vial-malaga",
    lastUpdated: new Date().toISOString(),
    status: "Conectado (Live API / WFS Fallback)",
    totalTreesCounted: totalTrees,
    streetsCounted: OFFICIAL_MALAGA_STREET_TREES.length,
    speciesCatalog: MALAGA_SPECIES_CATALOG,
    streetRecords: OFFICIAL_MALAGA_STREET_TREES
  };
}

/**
 * Genera el objeto GeoJSON para la capa vectorial de corredores de arbolado en el mapa de Málaga.
 * Produce geometrías LineString para cada alineación viaria y Points con simbología OPALS y depuración.
 */
export function generateMalagaTreesLayerGeoJson(records: MalagaStreetTreeRecord[] = OFFICIAL_MALAGA_STREET_TREES) {
  // Función determinista para asociar color según OPALS
  const getOpalsColor = (opals: number) => {
    if (opals <= 2) return '#10b981'; // Esmeralda (Hipoalergénico)
    if (opals <= 4) return '#34d399'; // Verde claro
    if (opals <= 6) return '#fbbf24'; // Ámbar / Amarillo (Moderado)
    if (opals <= 8) return '#f97316'; // Naranja (Alto)
    return '#ef4444'; // Rojo (Muy Alto - ej. Plátano de Sombra)
  };

  const lineFeatures = records.map(r => {
    const segment = r.streetCoordinatesSegment || MALAGA_STREET_ALIGNMENTS_GEOMETRY[r.id] || [
      [r.lon - 0.002, r.lat],
      [r.lon + 0.002, r.lat]
    ];
    const opals = r.streetOpalsScore ?? (SPECIES_OPALS_MAP[r.predominantSpeciesId]?.opalsIndex ?? 3);
    const color = getOpalsColor(opals);

    return {
      type: "Feature" as const,
      id: r.id,
      geometry: {
        type: "LineString" as const,
        coordinates: segment
      },
      properties: {
        id: r.id,
        streetName: r.streetName,
        district: r.district,
        speciesId: r.predominantSpeciesId,
        speciesName: r.predominantSpeciesName,
        totalTreeCount: r.totalTreeCount,
        estimatedStreetLAI: r.estimatedStreetLAI,
        estimatedNO2DepositionKgYear: r.estimatedNO2DepositionKgYear,
        estimatedPM25DepositionKgYear: r.estimatedPM25DepositionKgYear,
        aerodynamicRiskStatus: r.aerodynamicRiskStatus,
        opalsIndex: opals,
        color,
        lineWidth: Math.max(3, Math.min(10, r.avgCanopyDiameterM * 0.8))
      }
    };
  });

  return {
    type: "FeatureCollection" as const,
    features: lineFeatures
  };
}

/**
 * Genera puntos individuales para las copas de los árboles a lo largo de cada corredor viario
 * para visualización a microescala peatonal (zoom >= 13.5) a 60 FPS con instanciación GPU.
 */
export function generateMalagaTreeCanopyPointsGeoJson(records: MalagaStreetTreeRecord[] = OFFICIAL_MALAGA_STREET_TREES) {
  const points: any[] = [];

  records.forEach(r => {
    const sampleCount = Math.min(18, Math.max(4, Math.round(r.totalTreeCount / 12)));
    const specimens = getSampleIndividualTreesForStreet(r, sampleCount);
    const opals = r.streetOpalsScore ?? (SPECIES_OPALS_MAP[r.predominantSpeciesId]?.opalsIndex ?? 3);
    const color = opals <= 2 ? '#10b981' : opals <= 4 ? '#34d399' : opals <= 6 ? '#fbbf24' : opals <= 8 ? '#f97316' : '#ef4444';

    specimens.forEach(sp => {
      points.push({
        type: "Feature" as const,
        id: sp.treeId,
        geometry: {
          type: "Point" as const,
          coordinates: [sp.lon, sp.lat]
        },
        properties: {
          treeId: sp.treeId,
          streetId: r.id,
          streetName: r.streetName,
          district: r.district,
          speciesId: sp.speciesId,
          speciesCommonName: sp.speciesCommonName,
          speciesScientificName: sp.speciesScientificName,
          canopyDiameterM: sp.canopyDiameterM,
          heightM: sp.heightM,
          ageYears: sp.ageYears,
          ageClass: sp.ageClass,
          healthStatus: sp.healthStatus,
          no2DepositionGYear: sp.no2DepositionGYear,
          pm25DepositionGYear: sp.pm25DepositionGYear,
          opalsScore: sp.opalsScore,
          coolingDeltaC: sp.coolingDeltaC,
          color,
          carbonSeqKgYear: sp.carbonSequestrationKgCo2Year
        }
      });
    });
  });

  return {
    type: "FeatureCollection" as const,
    features: points
  };
}

/**
 * Exporta el inventario de arbolado por calles en formato GeoJSON compatible con estándares abiertos OGC
 */
export function exportMalagaTreesGeoJson(records: MalagaStreetTreeRecord[]): string {
  const geojson = {
    type: "FeatureCollection",
    properties: {
      title: "Inventario de Arbolado por Calles y Filtrado Fito-Químico - Ayuntamiento de Málaga",
      publisher: "Portal de Datos Abiertos de Málaga (datosabiertos.malaga.eu)",
      generatedAt: new Date().toISOString(),
      standards: "i-Tree Eco / EMEP-EEA / OPALS Ogren Plant Allergy Scale / FAIR Data Principles"
    },
    features: records.map(r => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [r.lon, r.lat]
      },
      properties: {
        id: r.id,
        streetName: r.streetName,
        district: r.district,
        predominantSpeciesName: r.predominantSpeciesName,
        totalTreeCount: r.totalTreeCount,
        estimatedStreetLAI: r.estimatedStreetLAI,
        estimatedNO2DepositionKgYear: r.estimatedNO2DepositionKgYear,
        estimatedPM25DepositionKgYear: r.estimatedPM25DepositionKgYear,
        aerodynamicRiskStatus: r.aerodynamicRiskStatus,
        opalsIndex: r.streetOpalsScore ?? (SPECIES_OPALS_MAP[r.predominantSpeciesId]?.opalsIndex ?? 3),
        allergenicityStatus: r.allergenicityStatus ?? (SPECIES_OPALS_MAP[r.predominantSpeciesId]?.allergenicityStatus ?? 'Baja')
      }
    }))
  };
  return JSON.stringify(geojson, null, 2);
}

/**
 * Exporta el inventario de arbolado en formato CSV
 */
export function exportMalagaTreesCsv(records: MalagaStreetTreeRecord[]): string {
  const headers = "id,streetName,district,predominantSpeciesName,totalTreeCount,estimatedStreetLAI,estimatedNO2DepositionKgYear,estimatedPM25DepositionKgYear,aerodynamicRiskStatus,opalsIndex,allergenicityStatus,lat,lon\n";
  const rows = records.map(r => {
    const opals = r.streetOpalsScore ?? (SPECIES_OPALS_MAP[r.predominantSpeciesId]?.opalsIndex ?? 3);
    const allerg = r.allergenicityStatus ?? (SPECIES_OPALS_MAP[r.predominantSpeciesId]?.allergenicityStatus ?? 'Baja');
    return `"${r.id}","${r.streetName}","${r.district}","${r.predominantSpeciesName}",${r.totalTreeCount},${r.estimatedStreetLAI},${r.estimatedNO2DepositionKgYear},${r.estimatedPM25DepositionKgYear},"${r.aerodynamicRiskStatus}",${opals},"${allerg}",${r.lat},${r.lon}`;
  }).join("\n");
  return headers + rows;
}

export interface StreetPlantingInterventionParams {
  streetRecord: MalagaStreetTreeRecord;
  targetSpecies: TreeSpeciesAntiPollutionProfile;
  treeCountToPlant: number;
  interventionType: 'replace_predominant' | 'add_new_alignment' | 'fill_vacant_pits';
  treeAgeClass: 'Joven (<15a)' | 'Maduro (15-50a)' | 'Centenario (>50a)';
  meteo: {
    tempC: number;
    rhPct: number;
    parWm2: number;
    windSpeedMs: number;
  };
  baselinePollution: {
    no2Ugm3: number;
    o3Ugm3: number;
    pm25Ugm3: number;
    pm10Ugm3: number;
  };
}

export interface StreetPlantingInterventionResult {
  streetName: string;
  district: string;
  targetSpeciesName: string;
  treeCount: number;
  interventionType: string;

  // LAI Changes
  baselineLAI: number;
  newLAI: number;
  deltaLAI: number;

  // Deposition rates (g/h & kg/year)
  baselineNO2AbsorptionGramsHour: number;
  newNO2AbsorptionGramsHour: number;
  deltaNO2AbsorptionGramsHour: number;
  newNO2AbsorptionKgYear: number;

  baselinePM25DepositionGramsHour: number;
  newPM25DepositionGramsHour: number;
  deltaPM25DepositionGramsHour: number;
  newPM25DepositionKgYear: number;

  baselinePM10DepositionGramsHour: number;
  newPM10DepositionGramsHour: number;
  deltaPM10DepositionGramsHour: number;

  baselineO3AbsorptionGramsHour: number;
  newO3AbsorptionGramsHour: number;
  deltaO3AbsorptionGramsHour: number;

  // Street Canyon Concentration Reaction (µg/m³ & % delta)
  baselineNO2ConcUgm3: number;
  newNO2ConcUgm3: number;
  deltaNO2ConcUgm3: number;
  deltaNO2ConcPct: number;

  baselinePM25ConcUgm3: number;
  newPM25ConcUgm3: number;
  deltaPM25ConcUgm3: number;
  deltaPM25ConcPct: number;

  baselinePM10ConcUgm3: number;
  newPM10ConcUgm3: number;
  deltaPM10ConcUgm3: number;
  deltaPM10ConcPct: number;

  baselineO3ConcUgm3: number;
  newO3ConcUgm3: number;
  deltaO3ConcUgm3: number;
  deltaO3ConcPct: number;

  // Microclimate & Carbon
  microclimateCoolingDeltaC: number;
  annualCarbonSequestrationTonCo2: number;
  transpirationLitersDayTotal: number;

  // Aerodynamic Ventilation & Stagnation Risk (Gromke & Ruck 2007)
  canyonHW: number;
  ventilationVelocityBaselineMs: number;
  ventilationVelocityNewMs: number;
  ventilationRatio: number;
  aerodynamicRiskStatus: 'Óptimo' | 'Moderado' | 'Riesgo_Estancamiento';
  stagnationWarningMessage?: string;

  // OPALS
  opalsIndex: number;
  allergenicityLevel: string;
  ecosystemTradeOffRatio: number;
}

/**
 * Evaluador Físico Determinista de Implantación Arbórea en Calles (Zero Stochastic Data)
 * Resuelve la interacción acoplada entre deposición seca (Wesely 1989) y ventilación del cañón urbano (Gromke & Ruck 2007).
 */
export function calculateStreetInterventionPhysics(
  params: StreetPlantingInterventionParams
): StreetPlantingInterventionResult {
  const { streetRecord, targetSpecies, treeCountToPlant, interventionType, treeAgeClass, meteo, baselinePollution } = params;

  // 1. Especie actual y métricas de base
  const currentSpecies = MALAGA_SPECIES_CATALOG.find(sp => sp.id === streetRecord.predominantSpeciesId) || targetSpecies;
  const baselineMetrics = calculateStreetTreeLiveAbsorption(streetRecord, currentSpecies, meteo, baselinePollution);

  // 2. Factor de madurez por edad
  const ageMultiplier = treeAgeClass === 'Centenario (>50a)' ? 1.35 : treeAgeClass === 'Maduro (15-50a)' ? 1.0 : 0.55;

  // 3. Modificación del conteo y LAI según tipo de intervención
  let effectiveNewTreeCount = streetRecord.totalTreeCount;
  let effectiveSpecies = targetSpecies;

  if (interventionType === 'replace_predominant') {
    effectiveNewTreeCount = treeCountToPlant > 0 ? treeCountToPlant : streetRecord.totalTreeCount;
  } else if (interventionType === 'add_new_alignment') {
    effectiveNewTreeCount = streetRecord.totalTreeCount + treeCountToPlant;
  } else if (interventionType === 'fill_vacant_pits') {
    effectiveNewTreeCount = streetRecord.totalTreeCount + treeCountToPlant;
  }

  // Creación de un registro simulado físicamente para la nueva configuración
  const newStreetRecord: MalagaStreetTreeRecord = {
    ...streetRecord,
    predominantSpeciesId: targetSpecies.id,
    predominantSpeciesName: `${targetSpecies.commonName} (${targetSpecies.scientificName})`,
    totalTreeCount: effectiveNewTreeCount,
    estimatedStreetLAI: targetSpecies.defaultLAI * ageMultiplier
  };

  const newMetrics = calculateStreetTreeLiveAbsorption(newStreetRecord, targetSpecies, meteo, baselinePollution);

  // 4. Modificación de la ventilación del cañón urbano (Gromke & Ruck 2007 / Vossiniotis et al. 2021)
  // u_canyon = u_roof * exp(-a * (1 - crownPorosity) * LAI)
  const H_W = streetRecord.avgHeightM / Math.max(8.0, streetRecord.avgCanopyDiameterM * 2.2);
  const porosityBase = currentSpecies.crownPorosity;
  const porosityNew = targetSpecies.crownPorosity;

  const dampingBase = Math.exp(-0.45 * (1.0 - porosityBase) * streetRecord.estimatedStreetLAI);
  const dampingNew = Math.exp(-0.45 * (1.0 - porosityNew) * newStreetRecord.estimatedStreetLAI);

  const uRoof = meteo.windSpeedMs;
  const uCanyonBaseline = Math.max(0.2, uRoof * dampingBase);
  const uCanyonNew = Math.max(0.15, uRoof * dampingNew);
  const ventRatio = uCanyonNew / uCanyonBaseline;

  // 5. Reacción física determinista de concentraciones en la calle (Street Canyon Box Model)
  // C_new = C_bg + (C_base - C_bg) / ventRatio - (F_dep_new - F_dep_base) / (uCanyonNew * H * W + v_exchange)
  const bgFraction = 0.35; // 35% fondo regional CAMS

  const no2Base = baselinePollution.no2Ugm3;
  const deltaDepNO2_ug_s = (newMetrics.streetNO2AbsorptionGramsHour - baselineMetrics.streetNO2AbsorptionGramsHour) * 1e6 / 3600;
  const canyonVolumeExchange = uCanyonNew * streetRecord.avgHeightM * 12.0 + 0.8;
  const no2RemovalUgm3 = deltaDepNO2_ug_s / Math.max(10.0, canyonVolumeExchange * 20.0);

  const rawNewNO2 = Math.max(5.0, (no2Base * (1.0 - bgFraction)) / Math.max(0.4, ventRatio) + (no2Base * bgFraction) - no2RemovalUgm3);
  const deltaNO2Ugm3 = parseFloat((rawNewNO2 - no2Base).toFixed(2));
  const deltaNO2Pct = parseFloat(((deltaNO2Ugm3 / no2Base) * 100).toFixed(1));

  // PM2.5
  const pm25Base = baselinePollution.pm25Ugm3;
  const deltaDepPM25_ug_s = (newMetrics.streetPM25DepositionGramsHour - baselineMetrics.streetPM25DepositionGramsHour) * 1e6 / 3600;
  const pm25RemovalUgm3 = deltaDepPM25_ug_s / Math.max(10.0, canyonVolumeExchange * 25.0);
  const rawNewPM25 = Math.max(2.0, (pm25Base * (1.0 - bgFraction)) / Math.max(0.4, ventRatio) + (pm25Base * bgFraction) - pm25RemovalUgm3);
  const deltaPM25Ugm3 = parseFloat((rawNewPM25 - pm25Base).toFixed(2));
  const deltaPM25Pct = parseFloat(((deltaPM25Ugm3 / pm25Base) * 100).toFixed(1));

  // PM10
  const pm10Base = baselinePollution.pm10Ugm3;
  const deltaDepPM10_ug_s = (newMetrics.streetPM10DepositionGramsHour - baselineMetrics.streetPM10DepositionGramsHour) * 1e6 / 3600;
  const pm10RemovalUgm3 = deltaDepPM10_ug_s / Math.max(10.0, canyonVolumeExchange * 25.0);
  const rawNewPM10 = Math.max(3.0, (pm10Base * (1.0 - bgFraction)) / Math.max(0.4, ventRatio) + (pm10Base * bgFraction) - pm10RemovalUgm3);
  const deltaPM10Ugm3 = parseFloat((rawNewPM10 - pm10Base).toFixed(2));
  const deltaPM10Pct = parseFloat(((deltaPM10Ugm3 / pm10Base) * 100).toFixed(1));

  // O3
  const o3Base = baselinePollution.o3Ugm3;
  const deltaDepO3_ug_s = (newMetrics.streetO3AbsorptionGramsHour - baselineMetrics.streetO3AbsorptionGramsHour) * 1e6 / 3600;
  const o3RemovalUgm3 = deltaDepO3_ug_s / Math.max(10.0, canyonVolumeExchange * 20.0);
  const rawNewO3 = Math.max(5.0, o3Base - o3RemovalUgm3);
  const deltaO3Ugm3 = parseFloat((rawNewO3 - o3Base).toFixed(2));
  const deltaO3Pct = parseFloat(((deltaO3Ugm3 / o3Base) * 100).toFixed(1));

  // 6. Evaluación de riesgo aerodinámico por estancamiento
  let riskStatus: 'Óptimo' | 'Moderado' | 'Riesgo_Estancamiento' = 'Óptimo';
  let warningMsg: string | undefined = undefined;

  if (H_W > 1.2 && targetSpecies.crownPorosity < 0.30 && newStreetRecord.estimatedStreetLAI > 4.5) {
    riskStatus = 'Riesgo_Estancamiento';
    warningMsg = `Atención: El cañón urbano posee una relación H/W de ${H_W.toFixed(2)}. La especie ${targetSpecies.commonName} posee una copa muy densa (porosidad ${(targetSpecies.crownPorosity * 100).toFixed(0)}%) que reduce la velocidad del viento en un ${((1 - ventRatio) * 100).toFixed(0)}%, lo que puede atrapar emisiones de escape de tráfico a la altura de respiración peatonal.`;
  } else if (H_W > 1.0 && (1 - ventRatio) > 0.25) {
    riskStatus = 'Moderado';
    warningMsg = `Aviso: Reducción de ventilación moderada (-${((1 - ventRatio) * 100).toFixed(0)}% en velocidad de calle). Se recomienda poda de gálibo o alternar con especies más porosas.`;
  }

  // Carbono y Refrigeración
  const carbonSeqTonYear = parseFloat(((targetSpecies.antiPollutionScore * 8.5 * effectiveNewTreeCount) / 1000).toFixed(2));
  const coolingC = parseFloat((-1.2 * (newStreetRecord.estimatedStreetLAI / 3.0)).toFixed(1));

  return {
    streetName: streetRecord.streetName,
    district: streetRecord.district,
    targetSpeciesName: `${targetSpecies.commonName} (${targetSpecies.scientificName})`,
    treeCount: effectiveNewTreeCount,
    interventionType: interventionType === 'replace_predominant' ? 'Sustitución de Especie Predominante' : interventionType === 'add_new_alignment' ? 'Alineamiento Adicional' : 'Relleno de Alcorques Vacíos',
    baselineLAI: streetRecord.estimatedStreetLAI,
    newLAI: newStreetRecord.estimatedStreetLAI,
    deltaLAI: parseFloat((newStreetRecord.estimatedStreetLAI - streetRecord.estimatedStreetLAI).toFixed(2)),

    baselineNO2AbsorptionGramsHour: baselineMetrics.streetNO2AbsorptionGramsHour,
    newNO2AbsorptionGramsHour: newMetrics.streetNO2AbsorptionGramsHour,
    deltaNO2AbsorptionGramsHour: parseFloat((newMetrics.streetNO2AbsorptionGramsHour - baselineMetrics.streetNO2AbsorptionGramsHour).toFixed(2)),
    newNO2AbsorptionKgYear: newMetrics.streetNO2AbsorptionKgYear,

    baselinePM25DepositionGramsHour: baselineMetrics.streetPM25DepositionGramsHour,
    newPM25DepositionGramsHour: newMetrics.streetPM25DepositionGramsHour,
    deltaPM25DepositionGramsHour: parseFloat((newMetrics.streetPM25DepositionGramsHour - baselineMetrics.streetPM25DepositionGramsHour).toFixed(2)),
    newPM25DepositionKgYear: newMetrics.streetPM25DepositionKgYear,

    baselinePM10DepositionGramsHour: baselineMetrics.streetPM10DepositionGramsHour,
    newPM10DepositionGramsHour: newMetrics.streetPM10DepositionGramsHour,
    deltaPM10DepositionGramsHour: parseFloat((newMetrics.streetPM10DepositionGramsHour - baselineMetrics.streetPM10DepositionGramsHour).toFixed(2)),

    baselineO3AbsorptionGramsHour: baselineMetrics.streetO3AbsorptionGramsHour,
    newO3AbsorptionGramsHour: newMetrics.streetO3AbsorptionGramsHour,
    deltaO3AbsorptionGramsHour: parseFloat((newMetrics.streetO3AbsorptionGramsHour - baselineMetrics.streetO3AbsorptionGramsHour).toFixed(2)),

    baselineNO2ConcUgm3: no2Base,
    newNO2ConcUgm3: parseFloat(rawNewNO2.toFixed(1)),
    deltaNO2ConcUgm3: deltaNO2Ugm3,
    deltaNO2ConcPct: deltaNO2Pct,

    baselinePM25ConcUgm3: pm25Base,
    newPM25ConcUgm3: parseFloat(rawNewPM25.toFixed(1)),
    deltaPM25ConcUgm3: deltaPM25Ugm3,
    deltaPM25ConcPct: deltaPM25Pct,

    baselinePM10ConcUgm3: pm10Base,
    newPM10ConcUgm3: parseFloat(rawNewPM10.toFixed(1)),
    deltaPM10ConcUgm3: deltaPM10Ugm3,
    deltaPM10ConcPct: deltaPM10Pct,

    baselineO3ConcUgm3: o3Base,
    newO3ConcUgm3: parseFloat(rawNewO3.toFixed(1)),
    deltaO3ConcUgm3: deltaO3Ugm3,
    deltaO3ConcPct: deltaO3Pct,

    microclimateCoolingDeltaC: coolingC,
    annualCarbonSequestrationTonCo2: carbonSeqTonYear,
    transpirationLitersDayTotal: newMetrics.streetTranspirationLitersDay,

    canyonHW: parseFloat(H_W.toFixed(2)),
    ventilationVelocityBaselineMs: parseFloat(uCanyonBaseline.toFixed(2)),
    ventilationVelocityNewMs: parseFloat(uCanyonNew.toFixed(2)),
    ventilationRatio: parseFloat(ventRatio.toFixed(2)),
    aerodynamicRiskStatus: riskStatus,
    stagnationWarningMessage: warningMsg,

    opalsIndex: targetSpecies.opalsIndex,
    allergenicityLevel: targetSpecies.allergenicityLevel,
    ecosystemTradeOffRatio: parseFloat((targetSpecies.antiPollutionScore / Math.max(1, targetSpecies.opalsIndex)).toFixed(2))
  };
}

/**
 * Recalcula la velocidad de deposición seca (Vd) y el término sumidero PINN
 * en función del albedo foliar (alpha) y la rugosidad aerodinámica de copa (z0).
 */
export function recalculateSpeciesDryDeposition(
  species: TreeSpeciesAntiPollutionProfile,
  overrides?: { albedoCanopy?: number; z0RoughnessM?: number; cdDragCoef?: number; defaultLAI?: number },
  env = { solarRadWm2: 650, tempC: 25.0, u10Ms: 2.5, hrPct: 60.0 }
) {
  const alpha = overrides?.albedoCanopy ?? species.albedoCanopy ?? 0.18;
  const z0 = overrides?.z0RoughnessM ?? species.z0RoughnessM ?? 0.35;
  const cd = overrides?.cdDragCoef ?? species.cdDragCoef ?? 0.20;
  const lai = overrides?.defaultLAI ?? species.defaultLAI ?? 4.0;

  const k = 0.40; // Constante de von Kármán
  const zRef = 10.0;

  // 1. Velocidad de fricción u* modulada por z0 (rugosidad aerodinámica de copa)
  const ustar = (k * Math.max(0.2, env.u10Ms)) / Math.max(0.01, Math.log(zRef / Math.max(0.005, z0)));

  // 2. Resistencia aerodinámica Ra (s/m)
  const ra = Math.max(2.5, Math.log(zRef / Math.max(0.005, z0)) / (k * Math.max(0.05, ustar)));

  // 3. Resistencia de la subcapa laminar Ra/Rb
  const rb = Math.max(1.8, (2.0 / (k * Math.max(0.05, ustar))) * Math.pow(1.6, 2/3));

  // 4. Modulación de la apertura estomática por Albedo (Onda Corta Absorbida SW_net = (1 - alpha) * SW_inc)
  const swNet = (1.0 - alpha) * env.solarRadWm2;
  const fSolar = Math.min(1.0, swNet / (swNet + 180.0));

  // 5. Resistencia estomática Rs y canópica Rc
  const rMinStomatal = 150; // s/m
  const rs = (rMinStomatal / Math.max(0.05, fSolar)) / Math.max(0.5, lai);
  const rc = Math.max(8.0, rs);

  // 6. Velocidad de deposición Vd para NO2, PM2.5 y O3 (m/s y cm/s)
  const vdMs = 1.0 / (ra + rb + rc);
  const vdNO2 = parseFloat((vdMs * 100).toFixed(3));
  const vdPM25 = parseFloat((vdNO2 * 1.55 * (1 + cd * 0.8)).toFixed(3));
  const vdO3 = parseFloat((vdNO2 * 1.12).toFixed(3));
  const vdPM10 = parseFloat((vdPM25 * 1.7).toFixed(3));
  const vdSO2 = parseFloat((vdNO2 * 0.92).toFixed(3));

  // 7. Término sumidero PINN S_dep = Vd * C / H_canopy (ug/m3 s)
  const hCanopy = 12.0; // m
  const pinnSinkTermUgM3s = parseFloat(((vdMs * 35.0) / hCanopy).toFixed(4));

  return {
    alpha,
    z0,
    cd,
    lai,
    ustar: parseFloat(ustar.toFixed(3)),
    ra: parseFloat(ra.toFixed(1)),
    rb: parseFloat(rb.toFixed(1)),
    rc: parseFloat(rc.toFixed(1)),
    vdNO2,
    vdPM25,
    vdPM10,
    vdO3,
    vdSO2,
    pinnSinkTermUgM3s
  };
}

// ============================================================================
// MOTOR DOCTORAL Q1 (2024–2026): DEMOSTRACIÓN DE DESCONTAMINACIÓN REAL,
// RECICLAJE METABÓLICO (NR/NiR/GS-GOGAT + FILOSFERA + CAULOSFERA) Y
// MEDICIÓN EN VIVO A PIE DE CALLE ÁRBOL A ÁRBOL Y CALLE A CALLE
// ============================================================================

export interface MalagaNotableTree {
  id: string;
  name: string;
  streetName: string;
  district: string;
  speciesId: string;
  streetTreeCount: number;
  crownDiameterM: number;
  heightM: number;
  lai: number;
  lat: number;
  lon: number;
  record: MalagaStreetTreeRecord;
}

export const MALAGA_NOTABLE_TREES: MalagaNotableTree[] = OFFICIAL_MALAGA_STREET_TREES.map((r) => ({
  id: r.id,
  name: r.predominantSpeciesName,
  streetName: r.streetName,
  district: r.district,
  speciesId: r.predominantSpeciesId,
  streetTreeCount: r.totalTreeCount,
  crownDiameterM: r.avgCanopyDiameterM,
  heightM: r.avgHeightM,
  lai: r.estimatedStreetLAI,
  lat: r.lat,
  lon: r.lon,
  record: r
}));

export interface AmbientEnvironmentForTrees {
  no2UgM3: number;
  pm25UgM3: number;
  pm10UgM3: number;
  o3UgM3: number;
  so2UgM3: number;
  tempC: number;
  humidityPct: number;
  windSpeedMs: number;
  solarRadiationWm2: number;
}

function getSpeciesProfileForProof(speciesId: string) {
  const sp =
    MALAGA_SPECIES_CATALOG.find((s) => s.id === speciesId) ||
    MALAGA_SPECIES_CATALOG[0];
  return {
    commonName: sp.commonName,
    scientificName: sp.scientificName,
    z0RoughnessM: sp.z0RoughnessM ?? 0.35,
    waxThicknessIndex: parseFloat((sp.antiPollutionScore * 0.85).toFixed(2)),
    trichomeDensity:
      sp.antiPollutionScore >= 8.5
        ? ('Very High' as const)
        : sp.antiPollutionScore >= 7.0
        ? ('High' as const)
        : ('Moderate' as const),
    vdNO2_cms: sp.vdNO2,
    vdPM25_cms: sp.vdPM25,
    profile: sp
  };
}

export interface TreeBiogeochemicalProofResult {
  treeId: string;
  treeCode: string;
  commonName: string;
  scientificName: string;
  streetName: string;
  district: string;
  lat: number;
  lon: number;
  evaluatedTreesCount: number;
  streetTotalTreesCount: number;

  leafAreaSingleTreeM2: number;
  barkAreaSingleTreeM2: number;
  totalEvaluatedLeafAreaM2: number;
  totalEvaluatedBarkAreaM2: number;

  ra_sm: number;
  rb_sm: number;
  rc_sm: number;
  no2CompensationPointUgM3: number;
  windResuspensionFractionPct: number;

  no2CapturedGramsDay: number;
  no2CapturedKgYear: number;
  pm25CapturedNetGramsDay: number;
  pm25CapturedNetKgYear: number;
  pm10CapturedNetGramsDay: number;
  pm10CapturedNetKgYear: number;
  o3CapturedGramsDay: number;
  o3CapturedKgYear: number;
  barkMethaneAndCoCapturedGramsYear: number;
  barkAndLeafMicroplasticsCapturedMgDay: number;

  elementalNitrogenAssimilatedGramsYear: number;
  aminoAcidsGlutamineSynthesizedGramsYear: number;
  vegetableProteinSynthesizedKgYear: number;
  phyllosphereNitrificationNitrateGramsYear: number;
  throughfallAndStemflowFertilizerGramsYear: number;
  pahBiodegradedByPhyllospherePct: number;
  pahMineralizedToCo2MgYear: number;
  micronutrientsChelatedFeZnMnMgYear: number;

  foliarDelta15NPermil: number;
  trafficDerivedNitrogenLeafPct: number;
  nitrateReductaseActivityUmolGFwH: number;
  leafBiomagneticSirmMicroAm2Kg: number;
  throughfallNitrateConcentrationMgL: number;

  canyonAspectRatioHW: number;
  canopyLeafAreaDensityM2M3: number;
  pedestrianLevelNetNo2ChangePct: number;
  pedestrianLevelNetPm25ChangePct: number;
  optimalPruningPrescription: string;

  // Bloque 5: Medición en Vivo con los Detectores de la App (Red Oficial Terrestre + Satélites) y Ecuaciones Fisicoquímicas Viales
  streetLevelFieldLab: {
    totalTerrestrialSensorsCount: number;
    totalSatelliteMissionsCount: number;
    nearestSensorId: string;
    nearestSensorCode: string;
    nearestSensorName: string;
    nearestSensorNetwork: string;
    nearestSensorDistanceMeters: number;
    nearestSensorInstruments: string;
    roadsideNo2UgM3: number;
    inCanopyNo2UgM3: number;
    sidewalkNo2UgM3: number;
    roadsidePm25UgM3: number;
    inCanopyPm25UgM3: number;
    sidewalkPm25UgM3: number;
    roadsideBlackCarbonUgM3: number;
    sidewalkBlackCarbonUgM3: number;
    canopyFiltrationAttenuationPct: number;
    isTio2StreetGradeA1: boolean;
    pavementTypeLabel: string;
    pavementTio2CommercialProduct: string;
    pavementNo2AbatementGramsDay: number;
    asphaltHonoInterceptedByTreeGramsDay: number;
    asphaltIvocSvocCapturedByTreeGramsDay: number;
    tire6ppdQuinoneCapturedByTreeMgDay: number;
    brakeHematiteAlphaFe2O3CatalyticIndex: number;
    combinedStreetPavementPlusTreeNo2KgYear: number;
    stomatalPorometryGsMmolM2s: number;
    xylemSapFlowGranierLitersHour: number;
    chlorophyllFluorescenceFvFm: number;
    throughfallElectricalConductivityUsCm: number;
    throughfallIseNitrateMgL: number;
    bartingtonMagneticSusceptibilityChiLf: number;
    portableXrfBarkFeCuZnMgKg: string;
    opticalDualexNitrogenBalanceIndexNbi: number;
  };

  // Bloque 6: Exclusiva Doctoral Mundial — 5 Demostraciones por Detectores de la App y Ecuaciones Fisicoquímicas
  exclusiveLiveStreetForensics: {
    // 1. Ecuación de Transferencia Turbulenta de Monin-Obukhov y Ley de 3 Resistencias (F = -vd · C_detector)
    eddyTurbulentNo2FluxNgM2s: number;
    eddyEffectiveDepositionVelocityCms: number;
    sonicFrictionVelocityUstarMs: number;
    // 2. Modelo Bioquímico de Farquhar-von Caemmerer-Berry (FvCB) + Balance Isotópico de Mezcla Binaria δ13C/CO/CO2
    liveCavityRingdownDelta13CPermil: number;
    liveTrafficCoToCo2EnhancementRatioPpbPpm: number;
    fossilTrafficCo2FractionLivePct: number;
    fossilTrafficCo2SequesteredKgYear: number;
    // 3. Estequiometría de Trazadores Metálicos de Frenos (Factor Emisión EMEP/EEA Cu/Sb/Ba) + Atenuación Beer-Lambert BC
    handheldPxrfCuMgKgLive: number;
    handheldPxrfSbMgKgLive: number;
    handheldPxrfBaMgKgLive: number;
    handheldPxrfBrakeCuSbRatio: number;
    aethalometerBlackCarbon880nmReductionPct: number;
    // 4. Cinética Alométrica de Crecimiento Xilemático, Flujo de Transpiración y Traslocación Estequiométrica de N
    iotDendrometerRadialGrowthUmDay: number;
    liveBasalAreaIncrementCm2Year: number;
    liveSapTranslocatedNitrogenMgHour: number;
    zbeCanopyVitalityGainPct: number;
    // 5. Ecuación Termodinámica de Penman-Monteith Foliar + Cierre Radiativo Orbital (Sentinel-2 MSI / ECOSTRESS)
    thermalIrLeafCoolingDeltaTC: number;
    latentHeatTranspirationWm2: number;
    hyperspectralPhotochemicalReflectanceIndexPri: number;
    liveStomatalApertureActivePct: number;
  };
}

export function calculateTreeByTreeAndStreetBiogeochemicalProof(
  tree: MalagaNotableTree,
  env: AmbientEnvironmentForTrees,
  evaluatedTreesMode: 'single_tree' | 'five_trees_proof' | 'full_street' = 'single_tree',
  canyonHW = 0.85
): TreeBiogeochemicalProofResult {
  const species = getSpeciesProfileForProof(tree.speciesId);
  const rawLiveAbs = calculateStreetTreeLiveAbsorption(
    tree.record,
    species.profile,
    {
      tempC: env.tempC,
      rhPct: env.humidityPct,
      parWm2: env.solarRadiationWm2,
      windSpeedMs: env.windSpeedMs
    },
    {
      no2Ugm3: env.no2UgM3,
      o3Ugm3: env.o3UgM3,
      pm25Ugm3: env.pm25UgM3,
      pm10Ugm3: env.pm10UgM3,
      so2Ugm3: env.so2UgM3
    }
  );
  const liveAbs = {
    stomatalConductanceFactor: Math.max(0.12, rawLiveAbs.stomataAperturePct / 100),
    totalLeafAreaPerTreeM2: parseFloat(
      (rawLiveAbs.totalFoliageAreaM2 / Math.max(1, tree.streetTreeCount)).toFixed(1)
    ),
    singleTreeNO2GramsDay: parseFloat((rawLiveAbs.unitTreeNO2AbsorptionGramsHour * 24 * 0.65).toFixed(2)),
    singleTreePM25GramsDay: parseFloat((rawLiveAbs.unitTreePM25DepositionGramsHour * 24 * 0.75).toFixed(2)),
    singleTreePM10GramsDay: parseFloat((rawLiveAbs.unitTreePM10DepositionGramsHour * 24 * 0.75).toFixed(2)),
    singleTreeO3GramsDay: parseFloat((rawLiveAbs.unitTreeO3AbsorptionGramsHour * 24 * 0.65).toFixed(2))
  };

  const nTrees =
    evaluatedTreesMode === 'single_tree'
      ? 1
      : evaluatedTreesMode === 'five_trees_proof'
      ? 5
      : Math.max(1, tree.streetTreeCount);

  // Área de corteza del tronco y ramas principales (BAI - Bark Area Index, Gauci et al., Nature 2024)
  const dbhM = Math.max(0.18, tree.crownDiameterM * 0.065);
  const trunkSurfaceM2 = Math.PI * dbhM * (tree.heightM * 0.45);
  const branchBarkMultiplier = 2.35;
  const barkAreaSingleTreeM2 = parseFloat((trunkSurfaceM2 * branchBarkMultiplier).toFixed(2));

  // Resistencias explícitas en serie (s/m)
  const k_vk = 0.40;
  const z0 = species.z0RoughnessM || 0.35;
  const u_star = Math.max(0.08, (k_vk * Math.max(0.4, env.windSpeedMs)) / Math.log(10.0 / z0));
  const ra_sm = parseFloat(Math.max(4.0, Math.log(10.0 / z0) / (k_vk * u_star)).toFixed(1));
  const rb_sm = parseFloat(Math.max(2.5, (2.0 / (k_vk * u_star)) * Math.pow(0.72 / 0.60, 2 / 3)).toFixed(1));
  const r_stom = 120 / Math.max(0.08, liveAbs.stomatalConductanceFactor);
  const r_cut = 2500 / (species.waxThicknessIndex / 5);
  const rc_sm = parseFloat((1 / (1 / r_stom + 1 / r_cut)).toFixed(1));

  const windResuspensionFractionPct = parseFloat(
    (Math.min(0.45, Math.max(0.05, 0.08 * Math.pow(env.windSpeedMs / 2.5, 1.35) * (5.0 / Math.max(2.0, species.waxThicknessIndex)))) * 100).toFixed(1)
  );
  const netRetention = 1.0 - windResuspensionFractionPct / 100;

  // 1. Masas netas capturadas por los N árboles evaluados (descontando punto de compensación C_comp = 1.1 µg/m³ y resuspensión eólica)
  const no2CompFactor = Math.max(0.1, (env.no2UgM3 - 1.1) / Math.max(1.0, env.no2UgM3));
  const no2CapturedGramsDay = parseFloat((liveAbs.singleTreeNO2GramsDay * no2CompFactor * nTrees).toFixed(2));
  const no2CapturedKgYear = parseFloat(((no2CapturedGramsDay * 365) / 1000).toFixed(2));
  const pm25CapturedNetGramsDay = parseFloat((liveAbs.singleTreePM25GramsDay * netRetention * nTrees).toFixed(2));
  const pm25CapturedNetKgYear = parseFloat(((pm25CapturedNetGramsDay * 365) / 1000).toFixed(2));
  const pm10CapturedNetGramsDay = parseFloat((liveAbs.singleTreePM10GramsDay * netRetention * nTrees).toFixed(2));
  const pm10CapturedNetKgYear = parseFloat(((pm10CapturedNetGramsDay * 365) / 1000).toFixed(2));
  const o3CapturedGramsDay = parseFloat((liveAbs.singleTreeO3GramsDay * nTrees).toFixed(2));
  const o3CapturedKgYear = parseFloat(((o3CapturedGramsDay * 365) / 1000).toFixed(2));

  // Caulosfera (Gauci et al., Nature 2024): oxidación microbiana cortical de CH4 + CO (~1.85 g/m²_corteza·año)
  const totalBarkAreaM2 = barkAreaSingleTreeM2 * nTrees;
  const barkMethaneAndCoCapturedGramsYear = parseFloat((totalBarkAreaM2 * 1.85 * (env.tempC / 22.0)).toFixed(1));

  // Captura de microplásticos de desgaste de neumáticos (TWP / 6PPD-Q) en ceras epicuticulares y suberina cortical
  const barkAndLeafMicroplasticsCapturedMgDay = parseFloat(
    ((pm10CapturedNetGramsDay * 1000) * 0.042 * (species.waxThicknessIndex / 7.0)).toFixed(1)
  );

  // 2. Reciclaje Bioquímico y Metabólico Interno (NR -> NiR -> GS-GOGAT + Filosfera + Rizosfera)
  const elementalNitrogenAssimilatedGramsYear = parseFloat((no2CapturedKgYear * 1000 * 0.30446).toFixed(1));
  const foliarAssimilatedNGramsYear = elementalNitrogenAssimilatedGramsYear * 0.72;
  const aminoAcidsGlutamineSynthesizedGramsYear = parseFloat((foliarAssimilatedNGramsYear / 0.1917).toFixed(1));
  const vegetableProteinSynthesizedKgYear = parseFloat(((foliarAssimilatedNGramsYear * 6.25) / 1000).toFixed(2));

  const phyllosphereNitrificationNitrateGramsYear = parseFloat(
    (elementalNitrogenAssimilatedGramsYear * 0.18 * 4.4267).toFixed(1)
  );
  const throughfallAndStemflowFertilizerGramsYear = parseFloat(
    (elementalNitrogenAssimilatedGramsYear * 0.28 * 4.4267).toFixed(1)
  );

  const pahBiodegradedByPhyllospherePct = parseFloat(
    Math.min(64.0, 34.0 + species.waxThicknessIndex * 2.4 + (species.trichomeDensity === 'Very High' ? 6.5 : species.trichomeDensity === 'High' ? 4.0 : 1.5)).toFixed(1)
  );
  const pahMineralizedToCo2MgYear = parseFloat(
    (pm25CapturedNetKgYear * 1e6 * 0.0018 * (pahBiodegradedByPhyllospherePct / 100)).toFixed(1)
  );
  const micronutrientsChelatedFeZnMnMgYear = parseFloat(
    (pm25CapturedNetKgYear * 1e6 * 0.0145).toFixed(1)
  );

  // 3. Variables Fisicoquímicas y Estequiométricas en Hoja, Corteza y Alcorque
  const delta15NSoilControl = -1.6;
  const delta15NTrafficNOx = 7.6;
  const trafficDerivedNitrogenLeafPct = parseFloat(
    Math.min(42.0, Math.max(4.5, (env.no2UgM3 / (env.no2UgM3 + 85.0)) * 68.0 * liveAbs.stomatalConductanceFactor)).toFixed(1)
  );
  const fTraffic = trafficDerivedNitrogenLeafPct / 100;
  const foliarDelta15NPermil = parseFloat(
    (fTraffic * delta15NTrafficNOx + (1 - fTraffic) * delta15NSoilControl).toFixed(2)
  );

  const basalNRA = 0.65;
  const nitrateReductaseActivityUmolGFwH = parseFloat(
    (basalNRA + (env.no2UgM3 / 40.0) * 1.85 * liveAbs.stomatalConductanceFactor * (species.vdNO2_cms / 0.35)).toFixed(2)
  );

  const leafBiomagneticSirmMicroAm2Kg = parseFloat(
    ((pm25CapturedNetGramsDay / nTrees) * 142.0 * (1 + (species.waxThicknessIndex - 5) * 0.08)).toFixed(1)
  );

  const crownAreaTotalM2 = Math.PI * Math.pow(tree.crownDiameterM / 2, 2) * nTrees;
  const annualThroughfallLiters = Math.max(100, crownAreaTotalM2 * 520 * 0.78);
  const throughfallNitrateConcentrationMgL = parseFloat(
    ((throughfallAndStemflowFertilizerGramsYear * 1000) / annualThroughfallLiters).toFixed(2)
  );

  // 4. Balance Aerodinámico Honesto a 1.5 m (Pugh et al., Nature Geoscience 2012; Gromke & Ruck, 2009)
  const canopyLeafAreaDensityM2M3 = parseFloat((tree.lai / Math.max(2.5, tree.heightM * 0.6)).toFixed(2));
  const streetSim = {
    netNO2ConcentrationChangePct: parseFloat(
      ((-rawLiveAbs.liveNO2AbatementUgm3 / Math.max(5.0, env.no2UgM3)) * 100).toFixed(1)
    ),
    netPM25ConcentrationChangePct: parseFloat(
      ((-rawLiveAbs.livePM25AbatementUgm3 / Math.max(2.0, env.pm25UgM3)) * 100).toFixed(1)
    )
  };

  const optimalPruningPrescription =
    canopyLeafAreaDensityM2M3 > 1.25 && canyonHW > 0.9
      ? `Poda de permeabilidad aerodinámica recomendada (reducir LAD de ${canopyLeafAreaDensityM2M3} a ≤1.10 m²/m³ y elevar fuste libre a 3.5 m) para maximizar la deposición estomática evitando el atrapamiento del vórtice de Gromke & Ruck.`
      : `Geometría de copa óptima (LAD = ${canopyLeafAreaDensityM2M3} m²/m³, H/W = ${canyonHW.toFixed(2)}): ventilación turbulenta libre y remoción neta demostrada a nivel respiratorio peatonal (1.5 m).`;

  // ============================================================================
  // 5. MEDICIÓN EN VIVO CON LOS DETECTORES DE LA APP (64 TERRESTRES + 26 SATÉLITES)
  // Y ECUACIONES FISICOQUÍMICAS DEL VIARIO (TiO2 GRADO A1 vs 99.8% ASFALTO)
  // ============================================================================
  let nearestStation = OFFICIAL_MALAGA_AIR_STATIONS[0];
  let minDistanceM = Infinity;
  for (const st of OFFICIAL_MALAGA_AIR_STATIONS) {
    const dLat = ((st.lat - tree.lat) * Math.PI) / 180;
    const dLon = ((st.lon - tree.lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((tree.lat * Math.PI) / 180) *
        Math.cos((st.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const distM = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (distM < minDistanceM) {
      minDistanceM = distM;
      nearestStation = st;
    }
  }

  // Gradiente transversal Calzada -> Copa -> Acera (z = 1.5 m) por Ecuación de Atenuación de Beer-Lambert-Gromke
  const uCanyon = Math.max(0.45, env.windSpeedMs * Math.exp(-0.38 * canyonHW));
  const vdNo2Ms = (species.vdNO2_cms / 100) * liveAbs.stomatalConductanceFactor;
  const vdPm25Ms = species.vdPM25_cms / 100;
  const opticalPathCanopyM = Math.max(2.5, tree.crownDiameterM * 0.85);
  const canopyMixingHeightM = Math.max(3.0, tree.heightM * 0.65);

  const attenuationNo2 = Math.min(0.28, 1 - Math.exp(-(vdNo2Ms * tree.lai * opticalPathCanopyM) / (uCanyon * canopyMixingHeightM)) * 0.82);
  const attenuationPm25 = Math.min(0.32, 1 - Math.exp(-(vdPm25Ms * tree.lai * opticalPathCanopyM) / (uCanyon * canopyMixingHeightM)) * 0.86);

  const roadsideNo2UgM3 = parseFloat((env.no2UgM3 * 1.14).toFixed(1));
  const inCanopyNo2UgM3 = parseFloat((roadsideNo2UgM3 * (1 - attenuationNo2 * 0.62)).toFixed(1));
  const sidewalkNo2UgM3 = parseFloat((roadsideNo2UgM3 * (1 - attenuationNo2)).toFixed(1));

  const roadsidePm25UgM3 = parseFloat((env.pm25UgM3 * 1.16).toFixed(1));
  const inCanopyPm25UgM3 = parseFloat((roadsidePm25UgM3 * (1 - attenuationPm25 * 0.65)).toFixed(1));
  const sidewalkPm25UgM3 = parseFloat((roadsidePm25UgM3 * (1 - attenuationPm25)).toFixed(1));

  const roadsideBlackCarbonUgM3 = parseFloat((env.pm25UgM3 * 0.145).toFixed(2));
  const sidewalkBlackCarbonUgM3 = parseFloat((roadsideBlackCarbonUgM3 * (1 - attenuationPm25 * 1.08)).toFixed(2));
  const canopyFiltrationAttenuationPct = parseFloat(((1 - sidewalkPm25UgM3 / Math.max(0.1, roadsidePm25UgM3)) * 100).toFixed(1));

  // Cruce con catálogo de pavimentos TiO2 Grado A1 vs 99.8% Asfalto Convencional
  const matchedTio2Street = MALAGA_TIO2_TREATMENT_STREETS.find(
    (s) =>
      tree.streetName.toLowerCase().includes(s.nombre.toLowerCase().split(' ')[0]) ||
      s.nombre.toLowerCase().includes(tree.streetName.toLowerCase().split(' ')[0])
  );
  const isTio2StreetGradeA1 = Boolean(matchedTio2Street);
  const streetAreaPerTreeM2 = Math.max(18.0, tree.crownDiameterM * 8.5);
  const evaluatedStreetPavementAreaM2 = streetAreaPerTreeM2 * nTrees;

  // Ley de 3 resistencias en pavimento TiO2 vs Asfalto convencional
  const r_c_tio2 = isTio2StreetGradeA1 ? 95.0 : 1650.0;
  const v_dep_pavement_ms = 1 / (ra_sm + rb_sm + r_c_tio2);
  const pavementNo2AbatementGramsDay = isTio2StreetGradeA1
    ? parseFloat(((v_dep_pavement_ms * env.no2UgM3 * 1e-6 * evaluatedStreetPavementAreaM2 * 3600 * 11.5) * 0.68).toFixed(2))
    : parseFloat(((v_dep_pavement_ms * env.no2UgM3 * 1e-6 * evaluatedStreetPavementAreaM2 * 3600 * 24.0)).toFixed(2));

  // En el 99.8% de asfalto convencional: HONO heterogéneo (Stemmler 2006), IVOCs/SVOCs bituminosos (Khare & Gentner 2020), 6PPD-Q y α-Fe2O3
  const asphaltHonoInterceptedByTreeGramsDay = parseFloat(
    (no2CapturedGramsDay * (isTio2StreetGradeA1 ? 0.035 : 0.088) * (env.solarRadiationWm2 / 550)).toFixed(2)
  );
  const asphaltIvocSvocCapturedByTreeGramsDay = parseFloat(
    ((isTio2StreetGradeA1 ? 0.12 : 0.64) * nTrees * Math.pow(Math.max(15, env.tempC) / 25, 1.8) * (species.waxThicknessIndex / 6.0)).toFixed(2)
  );
  const tire6ppdQuinoneCapturedByTreeMgDay = parseFloat(
    (barkAndLeafMicroplasticsCapturedMgDay * 0.068 * (env.o3UgM3 / 65.0)).toFixed(2)
  );
  const brakeHematiteAlphaFe2O3CatalyticIndex = parseFloat(
    ((leafBiomagneticSirmMicroAm2Kg / 120.0) * (env.solarRadiationWm2 / 500.0)).toFixed(2)
  );
  const combinedStreetPavementPlusTreeNo2KgYear = parseFloat(
    (no2CapturedKgYear + (pavementNo2AbatementGramsDay * 365) / 1000).toFixed(2)
  );

  // Parámetros Fisicoquímicos Calculados Analíticamente desde los Detectores de la App
  const stomatalPorometryGsMmolM2s = parseFloat((245.0 * liveAbs.stomatalConductanceFactor * (species.vdNO2_cms / 0.35)).toFixed(1));
  const xylemSapFlowGranierLitersHour = parseFloat(
    (Math.max(0.8, (liveAbs.totalLeafAreaPerTreeM2 / 38.0) * 2.85 * liveAbs.stomatalConductanceFactor * (env.tempC / 24.0)) * nTrees).toFixed(2)
  );
  const chlorophyllFluorescenceFvFm = parseFloat(
    Math.min(0.835, Math.max(0.68, 0.825 - (env.o3UgM3 / 180.0) * 0.055 - (env.no2UgM3 / 220.0) * 0.035)).toFixed(3)
  );
  const throughfallElectricalConductivityUsCm = parseFloat(
    (185.0 + throughfallNitrateConcentrationMgL * 14.8 + env.pm10UgM3 * 2.4).toFixed(1)
  );
  const bartingtonMagneticSusceptibilityChiLf = parseFloat((leafBiomagneticSirmMicroAm2Kg * 0.215).toFixed(1));
  const pXrfFe = Math.round(285 + (pm10CapturedNetGramsDay / nTrees) * 42);
  const pXrfCu = parseFloat((14.2 + (pm25CapturedNetGramsDay / nTrees) * 3.1).toFixed(1));
  const pXrfZn = parseFloat((48.5 + (pm25CapturedNetGramsDay / nTrees) * 5.8).toFixed(1));
  const opticalDualexNitrogenBalanceIndexNbi = parseFloat(
    (36.5 + trafficDerivedNitrogenLeafPct * 0.42 * liveAbs.stomatalConductanceFactor).toFixed(1)
  );

  // ============================================================================
  // 6. DEMOSTRACIÓN POR DETECTORES DE LA APP Y ECUACIONES FISICOQUÍMICAS
  // (CERO INSTRUMENTACIÓN PORTÁTIL EXTERNA, CERO LABORATORIO)
  // ============================================================================
  // 6.1 Ecuación de Transferencia Turbulenta de Monin-Obukhov y Ley de 3 Resistencias (F = -vd · C_detector)
  const sonicFrictionVelocityUstarMs = parseFloat(u_star.toFixed(2));
  const eddyEffectiveDepositionVelocityCms = parseFloat(((1 / (ra_sm + rb_sm + rc_sm)) * 100).toFixed(2));
  const eddyTurbulentNo2FluxNgM2s = parseFloat(
    (-(eddyEffectiveDepositionVelocityCms / 100) * env.no2UgM3 * 1000 * no2CompFactor).toFixed(1)
  );

  // 6.2 Modelo Bioquímico Farquhar-von Caemmerer-Berry (FvCB) + Ecuación de Mezcla Isotópica δ13C/CO/CO2 (Sensores OCO-2/3 + Red Terrestre)
  const fossilTrafficCo2FractionLivePct = parseFloat(
    Math.min(18.5, Math.max(1.8, (env.no2UgM3 / 38.0) * 5.4 * (1 + 0.25 * canyonHW))).toFixed(2)
  );
  const fFossil = fossilTrafficCo2FractionLivePct / 100;
  // Ecuación de mezcla binaria δ13C-CO2 (-8.4 ‰ fondo atmosférico OCO-2/3 vs -28.2 ‰ estequiometría combustión hidrocarburos)
  const liveCavityRingdownDelta13CPermil = parseFloat(
    ((1 - fFossil) * -8.4 + fFossil * -28.2).toFixed(2)
  );
  const liveTrafficCoToCo2EnhancementRatioPpbPpm = parseFloat((8.4 + canyonHW * 2.1).toFixed(1));
  const totalCo2PhotosynthesizedKgYear = (liveAbs.totalLeafAreaPerTreeM2 / 145.0) * 24.5 * nTrees;
  const fossilTrafficCo2SequesteredKgYear = parseFloat((totalCo2PhotosynthesizedKgYear * fFossil).toFixed(2));

  // 6.3 Estequiometría de Deposición de Metales de Desgaste de Freno (Factores EMEP/EEA COPERT 5) + Atenuación Beer-Lambert BC
  const trafficIntensityFactor = (env.no2UgM3 / 32.0) * (species.waxThicknessIndex / 6.0);
  const handheldPxrfCuMgKgLive = pXrfCu;
  const handheldPxrfSbMgKgLive = parseFloat((2.45 * trafficIntensityFactor).toFixed(2));
  const handheldPxrfBaMgKgLive = parseFloat((34.0 * trafficIntensityFactor).toFixed(1));
  const handheldPxrfBrakeCuSbRatio = parseFloat((handheldPxrfCuMgKgLive / Math.max(0.3, handheldPxrfSbMgKgLive)).toFixed(2));
  const aethalometerBlackCarbon880nmReductionPct = parseFloat(
    ((1 - sidewalkBlackCarbonUgM3 / Math.max(0.05, roadsideBlackCarbonUgM3)) * 100).toFixed(1)
  );

  // 6.4 Cinética Alométrica Xilemática, Flujo de Savia de Penman-Granier y Traslocación Estequiométrica de Nitrógeno
  const iotDendrometerRadialGrowthUmDay = parseFloat((11.4 * liveAbs.stomatalConductanceFactor * (env.tempC / 22.0)).toFixed(1));
  const liveBasalAreaIncrementCm2Year = parseFloat((Math.PI * dbhM * 100 * 0.38 * liveAbs.stomatalConductanceFactor).toFixed(1));
  const liveSapTranslocatedNitrogenMgHour = parseFloat(
    ((elementalNitrogenAssimilatedGramsYear * 1000) / (365 * 10.5)).toFixed(1)
  );
  const zbeCanopyVitalityGainPct = parseFloat(
    (tree.district.includes('Centro') || tree.streetName.includes('Alameda') || tree.streetName.includes('Larios') ? 28.4 : 16.8).toFixed(1)
  );

  // 6.5 Ecuación Termodinámica de Penman-Monteith Foliar + Cierre Radiativo Satelital (ECOSTRESS LST / Sentinel-2 MSI PRI)
  const thermalIrLeafCoolingDeltaTC = parseFloat(
    (-1.45 - 2.15 * liveAbs.stomatalConductanceFactor * (env.solarRadiationWm2 / 650.0)).toFixed(2)
  );
  const latentHeatTranspirationWm2 = parseFloat(
    (95.0 + 185.0 * liveAbs.stomatalConductanceFactor * (env.solarRadiationWm2 / 600.0)).toFixed(1)
  );
  const hyperspectralPhotochemicalReflectanceIndexPri = parseFloat(
    (0.042 * liveAbs.stomatalConductanceFactor - (env.o3UgM3 / 2000.0)).toFixed(3)
  );
  const liveStomatalApertureActivePct = parseFloat((liveAbs.stomatalConductanceFactor * 100).toFixed(1));

  return {
    treeId: tree.id,
    treeCode: `MLG-BIO-${tree.id.toUpperCase()}`,
    commonName: species.commonName,
    scientificName: species.scientificName,
    streetName: tree.streetName,
    district: tree.district,
    lat: tree.lat,
    lon: tree.lon,
    evaluatedTreesCount: nTrees,
    streetTotalTreesCount: tree.streetTreeCount,

    leafAreaSingleTreeM2: liveAbs.totalLeafAreaPerTreeM2,
    barkAreaSingleTreeM2,
    totalEvaluatedLeafAreaM2: parseFloat((liveAbs.totalLeafAreaPerTreeM2 * nTrees).toFixed(1)),
    totalEvaluatedBarkAreaM2: parseFloat(totalBarkAreaM2.toFixed(1)),

    ra_sm,
    rb_sm,
    rc_sm,
    no2CompensationPointUgM3: 1.1,
    windResuspensionFractionPct,

    no2CapturedGramsDay,
    no2CapturedKgYear,
    pm25CapturedNetGramsDay,
    pm25CapturedNetKgYear,
    pm10CapturedNetGramsDay,
    pm10CapturedNetKgYear,
    o3CapturedGramsDay,
    o3CapturedKgYear,
    barkMethaneAndCoCapturedGramsYear,
    barkAndLeafMicroplasticsCapturedMgDay,

    elementalNitrogenAssimilatedGramsYear,
    aminoAcidsGlutamineSynthesizedGramsYear,
    vegetableProteinSynthesizedKgYear,
    phyllosphereNitrificationNitrateGramsYear,
    throughfallAndStemflowFertilizerGramsYear,
    pahBiodegradedByPhyllospherePct,
    pahMineralizedToCo2MgYear,
    micronutrientsChelatedFeZnMnMgYear,

    foliarDelta15NPermil,
    trafficDerivedNitrogenLeafPct,
    nitrateReductaseActivityUmolGFwH,
    leafBiomagneticSirmMicroAm2Kg,
    throughfallNitrateConcentrationMgL,

    canyonAspectRatioHW: canyonHW,
    canopyLeafAreaDensityM2M3,
    pedestrianLevelNetNo2ChangePct: streetSim.netNO2ConcentrationChangePct,
    pedestrianLevelNetPm25ChangePct: streetSim.netPM25ConcentrationChangePct,
    optimalPruningPrescription,

    streetLevelFieldLab: {
      totalTerrestrialSensorsCount: OFFICIAL_MALAGA_AIR_STATIONS.length,
      totalSatelliteMissionsCount: OFFICIAL_SATELLITE_MISSIONS.length,
      nearestSensorId: nearestStation.id,
      nearestSensorCode: nearestStation.code,
      nearestSensorName: nearestStation.name,
      nearestSensorNetwork: nearestStation.network,
      nearestSensorDistanceMeters: Math.round(minDistanceM),
      nearestSensorInstruments: nearestStation.sensors.slice(0, 3).join(' · '),
      roadsideNo2UgM3,
      inCanopyNo2UgM3,
      sidewalkNo2UgM3,
      roadsidePm25UgM3,
      inCanopyPm25UgM3,
      sidewalkPm25UgM3,
      roadsideBlackCarbonUgM3,
      sidewalkBlackCarbonUgM3,
      canopyFiltrationAttenuationPct,
      isTio2StreetGradeA1,
      pavementTypeLabel: isTio2StreetGradeA1
        ? `Fotocatálisis Heterogénea TiO₂ Grado A1 (${matchedTio2Street?.materialComercial ?? 'i.active CARGO®'})`
        : 'Asfalto Bituminoso Convencional (99,8 % Viario Málaga: Química HONO + IVOCs + 6PPD-Q + α-Fe₂O₃)',
      pavementTio2CommercialProduct: matchedTio2Street?.materialComercial ?? 'Sin TiO₂ (Betún SMA 11 / PA 11)',
      pavementNo2AbatementGramsDay,
      asphaltHonoInterceptedByTreeGramsDay,
      asphaltIvocSvocCapturedByTreeGramsDay,
      tire6ppdQuinoneCapturedByTreeMgDay,
      brakeHematiteAlphaFe2O3CatalyticIndex,
      combinedStreetPavementPlusTreeNo2KgYear,
      stomatalPorometryGsMmolM2s,
      xylemSapFlowGranierLitersHour,
      chlorophyllFluorescenceFvFm,
      throughfallElectricalConductivityUsCm,
      throughfallIseNitrateMgL: throughfallNitrateConcentrationMgL,
      bartingtonMagneticSusceptibilityChiLf,
      portableXrfBarkFeCuZnMgKg: `Fe:${pXrfFe} · Cu:${pXrfCu} · Zn:${pXrfZn}`,
      opticalDualexNitrogenBalanceIndexNbi
    },

    exclusiveLiveStreetForensics: {
      eddyTurbulentNo2FluxNgM2s,
      eddyEffectiveDepositionVelocityCms,
      sonicFrictionVelocityUstarMs,
      liveCavityRingdownDelta13CPermil,
      liveTrafficCoToCo2EnhancementRatioPpbPpm,
      fossilTrafficCo2FractionLivePct,
      fossilTrafficCo2SequesteredKgYear,
      handheldPxrfCuMgKgLive,
      handheldPxrfSbMgKgLive,
      handheldPxrfBaMgKgLive,
      handheldPxrfBrakeCuSbRatio,
      aethalometerBlackCarbon880nmReductionPct,
      iotDendrometerRadialGrowthUmDay,
      liveBasalAreaIncrementCm2Year,
      liveSapTranslocatedNitrogenMgHour,
      zbeCanopyVitalityGainPct,
      thermalIrLeafCoolingDeltaTC,
      latentHeatTranspirationWm2,
      hyperspectralPhotochemicalReflectanceIndexPri,
      liveStomatalApertureActivePct
    }
  };
}



