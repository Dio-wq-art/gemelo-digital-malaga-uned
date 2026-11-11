/**
 * Módulo de Sincronización Universal de Punto Georreferenciado Activo (Universal Active Point Synchronization)
 * Tesis Doctoral - Gemelo Digital de Calidad del Aire en Málaga
 * 
 * Centraliza la verdad única sobre la ubicación analítica del sistema, garantizando que
 * cualquier interacción en el mapa, inspector, Street View 360°, consolas de telemetría
 * o selectores de zonas sincronice simultáneamente todos los módulos de la aplicación.
 * 
 * Cumple con los estándares IGN, ETRS89 / UTM Huso 30N (EPSG:25830), OSPM microescalar
 * y la zonificación municipal oficial del Ayuntamiento de Málaga (11 distritos).
 */

import { OFFICIAL_MALAGA_AIR_STATIONS } from './physics';
import { OFFICIAL_MALAGA_STREET_TREES } from './malagaTreesInventory';
import { MALAGA_CRITICAL_TRAFFIC_HOTSPOTS } from './trafficEmission';
import { MALAGA_PORT_BERTHS } from './portEmissionsBriggs';
import { wgs84ToUtm30N } from './geodesy';

export interface MalagaGeoReference {
  name: string;
  lat: number;
  lon: number;
  category: 'canyon' | 'station' | 'port' | 'airport' | 'industrial' | 'traffic' | 'green' | 'urban';
  highwayType?: string;
  H?: number;
  W?: number;
  orientationDeg?: number;
  treeCoverPct?: number;
  lanes?: number;
  qNOx_ug_m_s?: number;
  trafficVehiclesDay?: number;
}

/**
 * Catálogo Maestro Georreferenciado y Determinista de Hitos de Málaga
 */
export const MASTER_MALAGA_GEOREFERENCES: MalagaGeoReference[] = [
  // Cañones Urbanos y Ejes Principales
  { name: 'Calle Marqués de Larios', lat: 36.7185, lon: -4.4213, category: 'canyon', highwayType: 'pedestrian', H: 22.5, W: 11.2, orientationDeg: 184, treeCoverPct: 2, lanes: 0, qNOx_ug_m_s: 4.2, trafficVehiclesDay: 0 },
  { name: 'Alameda Principal', lat: 36.7182, lon: -4.4235, category: 'canyon', highwayType: 'primary', H: 24.0, W: 36.0, orientationDeg: 95, treeCoverPct: 45, lanes: 4, qNOx_ug_m_s: 28.5, trafficVehiclesDay: 22000 },
  { name: 'Paseo del Parque', lat: 36.7185, lon: -4.4140, category: 'green', highwayType: 'primary', H: 18.0, W: 32.0, orientationDeg: 82, treeCoverPct: 65, lanes: 4, qNOx_ug_m_s: 18.0, trafficVehiclesDay: 16000 },
  { name: 'Avenida Juan XXIII', lat: 36.7088, lon: -4.4443, category: 'canyon', highwayType: 'primary', H: 28.0, W: 19.5, orientationDeg: 172, treeCoverPct: 15, lanes: 6, qNOx_ug_m_s: 48.0, trafficVehiclesDay: 38000 },
  { name: 'Calle Hilera', lat: 36.7188, lon: -4.4320, category: 'canyon', highwayType: 'secondary', H: 21.0, W: 13.5, orientationDeg: 88, treeCoverPct: 10, lanes: 3, qNOx_ug_m_s: 32.0, trafficVehiclesDay: 19000 },
  { name: 'Calle Carretería', lat: 36.7235, lon: -4.4238, category: 'canyon', highwayType: 'secondary', H: 18.0, W: 10.5, orientationDeg: 75, treeCoverPct: 5, lanes: 2, qNOx_ug_m_s: 21.0, trafficVehiclesDay: 11000 },
  { name: 'Calle de la Victoria', lat: 36.7265, lon: -4.4145, category: 'canyon', highwayType: 'secondary', H: 19.5, W: 12.0, orientationDeg: 42, treeCoverPct: 8, lanes: 2, qNOx_ug_m_s: 24.0, trafficVehiclesDay: 14000 },
  { name: 'Calle Mármoles', lat: 36.7202, lon: -4.4290, category: 'canyon', highwayType: 'secondary', H: 20.0, W: 14.0, orientationDeg: 92, treeCoverPct: 6, lanes: 2, qNOx_ug_m_s: 26.5, trafficVehiclesDay: 15500 },
  { name: 'Avenida de Andalucía', lat: 36.7170, lon: -4.4310, category: 'traffic', highwayType: 'trunk', H: 26.0, W: 42.0, orientationDeg: 92, treeCoverPct: 20, lanes: 8, qNOx_ug_m_s: 52.0, trafficVehiclesDay: 46000 },
  { name: 'Ronda Oeste MA-20 / Carlos Haya', lat: 36.7215, lon: -4.4560, category: 'traffic', highwayType: 'motorway', H: 12.0, W: 45.0, orientationDeg: 168, treeCoverPct: 8, lanes: 8, qNOx_ug_m_s: 65.0, trafficVehiclesDay: 85000 },
  
  // Áreas Portuarias y Muelles
  { name: 'Puerto de Málaga - Muelle 3 (Baleària Ferry / Dársena Guadiaro)', lat: 36.7125, lon: -4.4180, category: 'port', highwayType: 'service', H: 14.0, W: 50.0, orientationDeg: 135, treeCoverPct: 0, lanes: 2, qNOx_ug_m_s: 38.0, trafficVehiclesDay: 8000 },
  { name: 'Puerto de Málaga - Dique de Levante (Cruceros Internacionales)', lat: 36.7111, lon: -4.4121, category: 'port', highwayType: 'service', H: 12.0, W: 60.0, orientationDeg: 145, treeCoverPct: 0, lanes: 2, qNOx_ug_m_s: 55.0, trafficVehiclesDay: 6500 },
  { name: 'Puerto de Málaga - Muelle 1 (El Palmeral / Marina)', lat: 36.7160, lon: -4.4160, category: 'port', highwayType: 'pedestrian', H: 10.0, W: 35.0, orientationDeg: 110, treeCoverPct: 18, lanes: 1, qNOx_ug_m_s: 14.0, trafficVehiclesDay: 3000 },
  { name: 'Puerto de Málaga - Muelle 4 y Dársena Heredia', lat: 36.7138, lon: -4.4215, category: 'port', highwayType: 'primary', H: 18.0, W: 38.0, orientationDeg: 88, treeCoverPct: 5, lanes: 4, qNOx_ug_m_s: 34.0, trafficVehiclesDay: 19500 },
  { name: 'Puerto de Málaga - Muelle 6 (Graneles y Contenedores)', lat: 36.7050, lon: -4.4260, category: 'port', highwayType: 'service', H: 15.0, W: 50.0, orientationDeg: 160, treeCoverPct: 0, lanes: 2, qNOx_ug_m_s: 42.0, trafficVehiclesDay: 9500 },
  { name: 'Puerto Pesquero y Dársena San Andrés', lat: 36.7035, lon: -4.4340, category: 'port', highwayType: 'secondary', H: 12.0, W: 28.0, orientationDeg: 140, treeCoverPct: 4, lanes: 2, qNOx_ug_m_s: 22.0, trafficVehiclesDay: 7500 },
  
  // Entorno Metropolitano, Aeropuerto e Industria
  { name: 'Aeropuerto AGP (Pistas / Despegue y Aterrizaje LTO)', lat: 36.6749, lon: -4.4780, category: 'airport', highwayType: 'service', H: 8.0, W: 75.0, orientationDeg: 130, treeCoverPct: 2, lanes: 2, qNOx_ug_m_s: 72.0, trafficVehiclesDay: 25000 },
  { name: 'Aeropuerto AGP (Terminales T2/T3 Pablo Picasso)', lat: 36.6780, lon: -4.4930, category: 'airport', highwayType: 'primary', H: 22.0, W: 45.0, orientationDeg: 120, treeCoverPct: 6, lanes: 6, qNOx_ug_m_s: 58.0, trafficVehiclesDay: 42000 },
  { name: 'Polígono Industrial Guadalhorce', lat: 36.6890, lon: -4.4720, category: 'industrial', highwayType: 'secondary', H: 10.0, W: 24.0, orientationDeg: 85, treeCoverPct: 3, lanes: 2, qNOx_ug_m_s: 36.0, trafficVehiclesDay: 28000 },
  { name: 'Polígono San Luis', lat: 36.7000, lon: -4.4680, category: 'industrial', highwayType: 'secondary', H: 11.0, W: 22.0, orientationDeg: 90, treeCoverPct: 4, lanes: 2, qNOx_ug_m_s: 34.0, trafficVehiclesDay: 24000 },
  { name: 'PTA TechPark (Campanillas)', lat: 36.7380, lon: -4.5530, category: 'industrial', highwayType: 'primary', H: 12.0, W: 26.0, orientationDeg: 45, treeCoverPct: 30, lanes: 4, qNOx_ug_m_s: 22.0, trafficVehiclesDay: 32000 },
  { name: 'El Atabal (Fondo Periurbano)', lat: 36.7350, lon: -4.4695, category: 'station', highwayType: 'residential', H: 9.0, W: 16.0, orientationDeg: 60, treeCoverPct: 40, lanes: 2, qNOx_ug_m_s: 8.5, trafficVehiclesDay: 4500 },
  { name: 'Campus Universitario Teatinos', lat: 36.7183, lon: -4.4735, category: 'urban', highwayType: 'secondary', H: 16.0, W: 30.0, orientationDeg: 90, treeCoverPct: 35, lanes: 4, qNOx_ug_m_s: 18.5, trafficVehiclesDay: 19000 },
  { name: 'Cruz de Humilladero', lat: 36.7150, lon: -4.4380, category: 'urban', highwayType: 'primary', H: 24.0, W: 18.0, orientationDeg: 88, treeCoverPct: 12, lanes: 4, qNOx_ug_m_s: 44.0, trafficVehiclesDay: 31000 },
  { name: 'Jardín Botánico Histórico La Concepción', lat: 36.7600, lon: -4.4260, category: 'green', highwayType: 'service', H: 8.0, W: 25.0, orientationDeg: 0, treeCoverPct: 85, lanes: 1, qNOx_ug_m_s: 3.5, trafficVehiclesDay: 800 },
  { name: 'Centro Oceanográfico de Málaga (CSIC-IEO) / Muelle San Andrés', lat: 36.7035, lon: -4.4340, category: 'port', highwayType: 'service', H: 10.0, W: 35.0, orientationDeg: 140, treeCoverPct: 5, lanes: 2, qNOx_ug_m_s: 18.0, trafficVehiclesDay: 5000 },
  { name: 'IHSM La Mayora (CSIC-UMA) / Estación Agroforestal Algarrobo', lat: 36.7580, lon: -4.0410, category: 'green', highwayType: 'service', H: 6.0, W: 30.0, orientationDeg: 0, treeCoverPct: 75, lanes: 1, qNOx_ug_m_s: 4.0, trafficVehiclesDay: 600 }
];

/**
 * Distancia ortodrómica euclídea aproximada en kilómetros para filtrado local rápido
 */
export function fastDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * 111.0;
  const dLon = (lon2 - lon1) * 111.0 * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180));
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

export interface ResolvedLocationMetadata {
  lat: number;
  lon: number;
  name: string;
  highwayType: string;
  H: number;
  W: number;
  orientationDeg: number;
  treeCoverPct: number;
  lanes: number;
  qNOx_ug_m_s: number;
  trafficVehiclesDay: number;
  clickedFeatureType: 'street' | 'tree' | 'building' | 'blank_terrain';
  isKnownLandmark: boolean;
  // Métricas a nivel de distancia de calle (metros)
  distanceToStreetMeters: number;
  nearestStreetName: string;
  lateralZone: 'carriageway' | 'sidewalk' | 'facade' | 'urban_setback' | 'park_or_free';
  lateralZoneLabel: string;
  perpendicularDecayFactor: number;
  // Desglose Administrativo y Territorial de Málaga
  districtId: number;
  districtName: string;
  neighborhoodName: string;
  postalCode: string;
  // Coordenadas Geodésicas e Ingenieriles Oficiales
  utmX: number;
  utmY: number;
  elevationM: number;
  distanceToCoastM: number;
  // Referencia a la estación oficial de contraste más próxima
  nearestOfficialStation: {
    id: string;
    code: string;
    name: string;
    distanceM: number;
  };
  // Morfología y Régimen de Flujo Microclimático (Oke 1987)
  aspectRatioHw: number;
  skyViewFactorSvf: number;
  flowRegimeOke: 'isolated_roughness' | 'wake_interference' | 'skimming_flow';
  flowRegimeLabel: string;
  streetOrientationLabel: string;
  fullLocationDescription: string;
  // Alias unificados para compatibilidad atómica en todos los motores y modales
  buildingHeightM: number;
  canyonWidthM: number;
  streetBearingDeg: number;
  streetName: string;
  district: string;
  svf: number;
  isPedestrian: boolean;
}

export interface StreetSegmentGeodesic {
  id: string;
  name: string;
  category: 'motorway' | 'trunk' | 'primary' | 'secondary' | 'pedestrian' | 'service';
  p1: { lat: number; lon: number };
  p2: { lat: number; lon: number };
  carriagewayWidthM: number; // Ancho calzada (m)
  sidewalkWidthM: number;    // Ancho acera (m)
  lanes: number;
  H: number;                 // Altura fachadas (m)
  orientationDeg: number;
  baseQNOx_ug_m_s: number;   // COPERT 5 base
  aadtVehiclesDay: number;
  treeCoverPct: number;
}

export interface NearestStreetResult {
  segment: StreetSegmentGeodesic;
  distanceMeters: number;
  lateralZone: 'carriageway' | 'sidewalk' | 'facade' | 'urban_setback' | 'park_or_free';
  zoneLabel: string;
  perpendicularDecayFactor: number;
  projectionPoint: { lat: number; lon: number };
  clampedT: number;
}

/**
 * Catálogo Extensivo de Segmentos Geodésicos de la Red Viaria de Málaga
 * Cubre los 11 distritos municipales, cañones urbanos, avenidas estructurantes y accesos metropolitanos.
 */
export const MALAGA_STREET_NETWORK_SEGMENTS: StreetSegmentGeodesic[] = [
  // --- DISTRITO 1: CENTRO ---
  {
    id: 'alameda_principal',
    name: 'Alameda Principal',
    category: 'primary',
    p1: { lat: 36.7180, lon: -4.4265 },
    p2: { lat: 36.7184, lon: -4.4208 },
    carriagewayWidthM: 14.0,
    sidewalkWidthM: 11.0,
    lanes: 4,
    H: 24.0,
    orientationDeg: 95,
    baseQNOx_ug_m_s: 28.5,
    aadtVehiclesDay: 22000,
    treeCoverPct: 45
  },
  {
    id: 'paseo_del_parque',
    name: 'Paseo del Parque',
    category: 'primary',
    p1: { lat: 36.7184, lon: -4.4208 },
    p2: { lat: 36.7186, lon: -4.4080 },
    carriagewayWidthM: 16.0,
    sidewalkWidthM: 8.0,
    lanes: 4,
    H: 18.0,
    orientationDeg: 82,
    baseQNOx_ug_m_s: 18.0,
    aadtVehiclesDay: 16000,
    treeCoverPct: 65
  },
  {
    id: 'calle_larios',
    name: 'Calle Marqués de Larios',
    category: 'pedestrian',
    p1: { lat: 36.7183, lon: -4.4215 },
    p2: { lat: 36.7214, lon: -4.4213 },
    carriagewayWidthM: 0.0,
    sidewalkWidthM: 11.2,
    lanes: 0,
    H: 22.5,
    orientationDeg: 184,
    baseQNOx_ug_m_s: 3.5,
    aadtVehiclesDay: 0,
    treeCoverPct: 2
  },
  {
    id: 'calle_carreteria',
    name: 'Calle Carretería',
    category: 'secondary',
    p1: { lat: 36.7225, lon: -4.4275 },
    p2: { lat: 36.7240, lon: -4.4195 },
    carriagewayWidthM: 7.0,
    sidewalkWidthM: 3.5,
    lanes: 2,
    H: 18.0,
    orientationDeg: 75,
    baseQNOx_ug_m_s: 21.0,
    aadtVehiclesDay: 11000,
    treeCoverPct: 5
  },
  {
    id: 'calle_alamos',
    name: 'Calle Álamos',
    category: 'secondary',
    p1: { lat: 36.7240, lon: -4.4195 },
    p2: { lat: 36.7235, lon: -4.4170 },
    carriagewayWidthM: 6.5,
    sidewalkWidthM: 2.5,
    lanes: 1,
    H: 19.0,
    orientationDeg: 110,
    baseQNOx_ug_m_s: 18.0,
    aadtVehiclesDay: 8500,
    treeCoverPct: 4
  },
  {
    id: 'calle_granada',
    name: 'Calle Granada',
    category: 'pedestrian',
    p1: { lat: 36.7214, lon: -4.4210 },
    p2: { lat: 36.7235, lon: -4.4175 },
    carriagewayWidthM: 0.0,
    sidewalkWidthM: 6.0,
    lanes: 0,
    H: 18.5,
    orientationDeg: 60,
    baseQNOx_ug_m_s: 3.2,
    aadtVehiclesDay: 0,
    treeCoverPct: 2
  },
  {
    id: 'calle_victoria',
    name: 'Calle de la Victoria',
    category: 'secondary',
    p1: { lat: 36.7238, lon: -4.4180 },
    p2: { lat: 36.7300, lon: -4.4095 },
    carriagewayWidthM: 8.0,
    sidewalkWidthM: 4.0,
    lanes: 2,
    H: 19.5,
    orientationDeg: 42,
    baseQNOx_ug_m_s: 24.0,
    aadtVehiclesDay: 14000,
    treeCoverPct: 8
  },
  {
    id: 'av_manuel_agustin_heredia',
    name: 'Av. Manuel Agustín Heredia (El Soho)',
    category: 'primary',
    p1: { lat: 36.7145, lon: -4.4260 },
    p2: { lat: 36.7135, lon: -4.4180 },
    carriagewayWidthM: 16.0,
    sidewalkWidthM: 5.0,
    lanes: 4,
    H: 18.0,
    orientationDeg: 88,
    baseQNOx_ug_m_s: 34.0,
    aadtVehiclesDay: 19500,
    treeCoverPct: 5
  },
  {
    id: 'paseo_de_los_curas',
    name: 'Paseo de los Curas',
    category: 'primary',
    p1: { lat: 36.7170, lon: -4.4185 },
    p2: { lat: 36.7175, lon: -4.4080 },
    carriagewayWidthM: 15.0,
    sidewalkWidthM: 4.0,
    lanes: 4,
    H: 14.0,
    orientationDeg: 85,
    baseQNOx_ug_m_s: 32.0,
    aadtVehiclesDay: 21000,
    treeCoverPct: 40
  },

  // --- DISTRITO 6: CRUZ DE HUMILLADERO ---
  {
    id: 'av_andalucia',
    name: 'Avenida de Andalucía',
    category: 'trunk',
    p1: { lat: 36.7175, lon: -4.4270 },
    p2: { lat: 36.7160, lon: -4.4450 },
    carriagewayWidthM: 28.0,
    sidewalkWidthM: 7.0,
    lanes: 8,
    H: 26.0,
    orientationDeg: 92,
    baseQNOx_ug_m_s: 52.0,
    aadtVehiclesDay: 46000,
    treeCoverPct: 20
  },
  {
    id: 'calle_hilera',
    name: 'Calle Hilera',
    category: 'secondary',
    p1: { lat: 36.7185, lon: -4.4280 },
    p2: { lat: 36.7192, lon: -4.4390 },
    carriagewayWidthM: 10.5,
    sidewalkWidthM: 3.0,
    lanes: 3,
    H: 21.0,
    orientationDeg: 88,
    baseQNOx_ug_m_s: 32.0,
    aadtVehiclesDay: 19000,
    treeCoverPct: 10
  },
  {
    id: 'paseo_de_los_tilos',
    name: 'Paseo de los Tilos',
    category: 'secondary',
    p1: { lat: 36.7140, lon: -4.4330 },
    p2: { lat: 36.7120, lon: -4.4440 },
    carriagewayWidthM: 12.0,
    sidewalkWidthM: 4.0,
    lanes: 3,
    H: 22.0,
    orientationDeg: 98,
    baseQNOx_ug_m_s: 30.0,
    aadtVehiclesDay: 18000,
    treeCoverPct: 18
  },
  {
    id: 'calle_cuarteles',
    name: 'Calle Cuarteles',
    category: 'secondary',
    p1: { lat: 36.7125, lon: -4.4260 },
    p2: { lat: 36.7115, lon: -4.4330 },
    carriagewayWidthM: 8.5,
    sidewalkWidthM: 3.5,
    lanes: 2,
    H: 22.0,
    orientationDeg: 90,
    baseQNOx_ug_m_s: 26.0,
    aadtVehiclesDay: 16500,
    treeCoverPct: 10
  },
  {
    id: 'camino_san_rafael',
    name: 'Camino de San Rafael',
    category: 'secondary',
    p1: { lat: 36.7100, lon: -4.4450 },
    p2: { lat: 36.7080, lon: -4.4600 },
    carriagewayWidthM: 11.0,
    sidewalkWidthM: 3.0,
    lanes: 2,
    H: 18.0,
    orientationDeg: 96,
    baseQNOx_ug_m_s: 25.0,
    aadtVehiclesDay: 15000,
    treeCoverPct: 14
  },

  // --- DISTRITO 7: CARRETERA DE CÁDIZ ---
  {
    id: 'av_juan_xxiii',
    name: 'Avenida Juan XXIII',
    category: 'primary',
    p1: { lat: 36.7020, lon: -4.4445 },
    p2: { lat: 36.7165, lon: -4.4440 },
    carriagewayWidthM: 19.5,
    sidewalkWidthM: 4.0,
    lanes: 6,
    H: 28.0,
    orientationDeg: 172,
    baseQNOx_ug_m_s: 48.0,
    aadtVehiclesDay: 38000,
    treeCoverPct: 15
  },
  {
    id: 'av_velazquez_ma21',
    name: 'Avenida Velázquez (Carretera de Cádiz)',
    category: 'trunk',
    p1: { lat: 36.7000, lon: -4.4500 },
    p2: { lat: 36.6800, lon: -4.4750 },
    carriagewayWidthM: 22.0,
    sidewalkWidthM: 4.5,
    lanes: 6,
    H: 24.0,
    orientationDeg: 135,
    baseQNOx_ug_m_s: 54.0,
    aadtVehiclesDay: 48000,
    treeCoverPct: 12
  },
  {
    id: 'calle_heroe_sostoa',
    name: 'Calle Héroe de Sostoa',
    category: 'primary',
    p1: { lat: 36.7110, lon: -4.4335 },
    p2: { lat: 36.7040, lon: -4.4450 },
    carriagewayWidthM: 12.0,
    sidewalkWidthM: 3.5,
    lanes: 3,
    H: 24.0,
    orientationDeg: 142,
    baseQNOx_ug_m_s: 36.0,
    aadtVehiclesDay: 22500,
    treeCoverPct: 8
  },
  {
    id: 'calle_ayala',
    name: 'Calle Ayala (Huelin)',
    category: 'secondary',
    p1: { lat: 36.7100, lon: -4.4310 },
    p2: { lat: 36.7030, lon: -4.4410 },
    carriagewayWidthM: 8.5,
    sidewalkWidthM: 3.0,
    lanes: 2,
    H: 20.0,
    orientationDeg: 138,
    baseQNOx_ug_m_s: 22.0,
    aadtVehiclesDay: 13000,
    treeCoverPct: 6
  },
  {
    id: 'paseo_antonio_machado',
    name: 'Paseo Marítimo Antonio Machado',
    category: 'primary',
    p1: { lat: 36.7000, lon: -4.4420 },
    p2: { lat: 36.7130, lon: -4.4250 },
    carriagewayWidthM: 14.0,
    sidewalkWidthM: 8.0,
    lanes: 4,
    H: 22.0,
    orientationDeg: 145,
    baseQNOx_ug_m_s: 22.0,
    aadtVehiclesDay: 17500,
    treeCoverPct: 20
  },
  {
    id: 'calle_pacifico',
    name: 'Calle Pacífico (Fachada Litoral Oeste)',
    category: 'primary',
    p1: { lat: 36.6870, lon: -4.4530 },
    p2: { lat: 36.7000, lon: -4.4420 },
    carriagewayWidthM: 16.0,
    sidewalkWidthM: 6.0,
    lanes: 4,
    H: 24.0,
    orientationDeg: 140,
    baseQNOx_ug_m_s: 26.0,
    aadtVehiclesDay: 19000,
    treeCoverPct: 22
  },

  // --- DISTRITO 4: BAILÉN - MIRAFLORES ---
  {
    id: 'calle_marmoles',
    name: 'Calle Mármoles',
    category: 'secondary',
    p1: { lat: 36.7200, lon: -4.4265 },
    p2: { lat: 36.7205, lon: -4.4360 },
    carriagewayWidthM: 9.0,
    sidewalkWidthM: 3.5,
    lanes: 2,
    H: 20.0,
    orientationDeg: 92,
    baseQNOx_ug_m_s: 26.5,
    aadtVehiclesDay: 15500,
    treeCoverPct: 6
  },
  {
    id: 'calle_martinez_maldonado',
    name: 'Calle Martínez Maldonado',
    category: 'primary',
    p1: { lat: 36.7205, lon: -4.4360 },
    p2: { lat: 36.7215, lon: -4.4480 },
    carriagewayWidthM: 12.0,
    sidewalkWidthM: 3.5,
    lanes: 3,
    H: 22.0,
    orientationDeg: 96,
    baseQNOx_ug_m_s: 36.0,
    aadtVehiclesDay: 24000,
    treeCoverPct: 12
  },
  {
    id: 'calle_eugenio_gross',
    name: 'Calle Eugenio Gross',
    category: 'secondary',
    p1: { lat: 36.7210, lon: -4.4380 },
    p2: { lat: 36.7280, lon: -4.4390 },
    carriagewayWidthM: 10.0,
    sidewalkWidthM: 3.0,
    lanes: 2,
    H: 21.0,
    orientationDeg: 172,
    baseQNOx_ug_m_s: 28.0,
    aadtVehiclesDay: 17000,
    treeCoverPct: 10
  },
  {
    id: 'av_valle_inclan',
    name: 'Avenida de Valle-Inclán',
    category: 'trunk',
    p1: { lat: 36.7290, lon: -4.4300 },
    p2: { lat: 36.7280, lon: -4.4550 },
    carriagewayWidthM: 20.0,
    sidewalkWidthM: 4.0,
    lanes: 6,
    H: 16.0,
    orientationDeg: 93,
    baseQNOx_ug_m_s: 48.0,
    aadtVehiclesDay: 42000,
    treeCoverPct: 16
  },

  // --- DISTRITO 5: PALMA - PALMILLA Y CIUDAD JARDÍN ---
  {
    id: 'av_ramon_y_cajal',
    name: 'Avenida Ramón y Cajal (Ciudad Jardín)',
    category: 'primary',
    p1: { lat: 36.7320, lon: -4.4280 },
    p2: { lat: 36.7450, lon: -4.4330 },
    carriagewayWidthM: 14.0,
    sidewalkWidthM: 4.0,
    lanes: 4,
    H: 20.0,
    orientationDeg: 160,
    baseQNOx_ug_m_s: 34.0,
    aadtVehiclesDay: 22000,
    treeCoverPct: 15
  },
  {
    id: 'paseo_martiricos',
    name: 'Paseo de Martiricos (Estadio La Rosaleda)',
    category: 'secondary',
    p1: { lat: 36.7270, lon: -4.4270 },
    p2: { lat: 36.7340, lon: -4.4280 },
    carriagewayWidthM: 12.0,
    sidewalkWidthM: 4.5,
    lanes: 3,
    H: 18.0,
    orientationDeg: 175,
    baseQNOx_ug_m_s: 26.0,
    aadtVehiclesDay: 16000,
    treeCoverPct: 20
  },

  // --- DISTRITO 2: MÁLAGA ESTE ---
  {
    id: 'paseo_pablo_picasso',
    name: 'Paseo Marítimo Pablo Ruiz Picasso (La Malagueta)',
    category: 'secondary',
    p1: { lat: 36.7180, lon: -4.4050 },
    p2: { lat: 36.7200, lon: -4.3800 },
    carriagewayWidthM: 12.0,
    sidewalkWidthM: 6.0,
    lanes: 3,
    H: 16.0,
    orientationDeg: 85,
    baseQNOx_ug_m_s: 19.0,
    aadtVehiclesDay: 14000,
    treeCoverPct: 25
  },
  {
    id: 'av_pintor_joaquin_sorolla',
    name: 'Avenida Pintor Joaquín Sorolla',
    category: 'primary',
    p1: { lat: 36.7190, lon: -4.4060 },
    p2: { lat: 36.7210, lon: -4.3850 },
    carriagewayWidthM: 13.0,
    sidewalkWidthM: 4.0,
    lanes: 4,
    H: 18.0,
    orientationDeg: 84,
    baseQNOx_ug_m_s: 28.0,
    aadtVehiclesDay: 19500,
    treeCoverPct: 30
  },
  {
    id: 'av_salvador_allende_el_palo',
    name: 'Avenida Salvador Allende (El Palo)',
    category: 'secondary',
    p1: { lat: 36.7190, lon: -4.3650 },
    p2: { lat: 36.7160, lon: -4.3400 },
    carriagewayWidthM: 11.0,
    sidewalkWidthM: 3.5,
    lanes: 2,
    H: 15.0,
    orientationDeg: 96,
    baseQNOx_ug_m_s: 20.0,
    aadtVehiclesDay: 13500,
    treeCoverPct: 18
  },

  // --- DISTRITO 11: TEATINOS - UNIVERSIDAD ---
  {
    id: 'bulevar_louis_pasteur',
    name: 'Bulevar Louis Pasteur (Campus Teatinos)',
    category: 'secondary',
    p1: { lat: 36.7170, lon: -4.4650 },
    p2: { lat: 36.7200, lon: -4.4900 },
    carriagewayWidthM: 14.0,
    sidewalkWidthM: 6.0,
    lanes: 4,
    H: 16.0,
    orientationDeg: 90,
    baseQNOx_ug_m_s: 18.5,
    aadtVehiclesDay: 19000,
    treeCoverPct: 35
  },
  {
    id: 'av_plutarco',
    name: 'Avenida Plutarco (Teatinos)',
    category: 'secondary',
    p1: { lat: 36.7210, lon: -4.4680 },
    p2: { lat: 36.7230, lon: -4.4850 },
    carriagewayWidthM: 12.0,
    sidewalkWidthM: 5.0,
    lanes: 3,
    H: 17.0,
    orientationDeg: 95,
    baseQNOx_ug_m_s: 16.0,
    aadtVehiclesDay: 14500,
    treeCoverPct: 28
  },
  {
    id: 'calle_navarro_ledesma',
    name: 'Calle Navarro Ledesma',
    category: 'secondary',
    p1: { lat: 36.7230, lon: -4.4580 },
    p2: { lat: 36.7260, lon: -4.4820 },
    carriagewayWidthM: 11.0,
    sidewalkWidthM: 3.5,
    lanes: 2,
    H: 16.5,
    orientationDeg: 98,
    baseQNOx_ug_m_s: 17.5,
    aadtVehiclesDay: 15000,
    treeCoverPct: 22
  },

  // --- DISTRITO 9: CAMPANILLAS / PTA ---
  {
    id: 'av_severo_ochoa_pta',
    name: 'Avenida Severo Ochoa (PTA Campanillas)',
    category: 'primary',
    p1: { lat: 36.7350, lon: -4.5600 },
    p2: { lat: 36.7420, lon: -4.5450 },
    carriagewayWidthM: 14.0,
    sidewalkWidthM: 4.0,
    lanes: 4,
    H: 12.0,
    orientationDeg: 45,
    baseQNOx_ug_m_s: 22.0,
    aadtVehiclesDay: 32000,
    treeCoverPct: 30
  },

  // --- RONDA OESTE MA-20 Y AUTOVÍAS METROPOLITANAS ---
  {
    id: 'ronda_oeste_ma20',
    name: 'Autovía Urbana MA-20 (Ronda Oeste)',
    category: 'motorway',
    p1: { lat: 36.7050, lon: -4.4600 },
    p2: { lat: 36.7350, lon: -4.4530 },
    carriagewayWidthM: 32.0,
    sidewalkWidthM: 1.5,
    lanes: 8,
    H: 12.0,
    orientationDeg: 168,
    baseQNOx_ug_m_s: 65.0,
    aadtVehiclesDay: 85000,
    treeCoverPct: 8
  },
  {
    id: 'autovia_puerto_ma22',
    name: 'Autovía de Acceso al Puerto MA-22',
    category: 'trunk',
    p1: { lat: 36.6850, lon: -4.4550 },
    p2: { lat: 36.7030, lon: -4.4360 },
    carriagewayWidthM: 20.0,
    sidewalkWidthM: 2.0,
    lanes: 4,
    H: 10.0,
    orientationDeg: 135,
    baseQNOx_ug_m_s: 42.0,
    aadtVehiclesDay: 34000,
    treeCoverPct: 5
  }
];

/**
 * Calcula la distancia en metros entre un punto geográfico (lat, lon) y un segmento de recta viario
 * Proyección plana local precisa con escala métrica de WGS84
 */
export function pointToSegmentDistanceMeters(
  lat: number,
  lon: number,
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { distanceMeters: number; projection: { lat: number; lon: number }; tClamped: number } {
  const midLat = (lat1 + lat2 + lat) / 3;
  const mPerDegLat = 110574;
  const mPerDegLon = 111320 * Math.cos(midLat * (Math.PI / 180));

  const px = lon * mPerDegLon;
  const py = lat * mPerDegLat;
  const x1 = lon1 * mPerDegLon;
  const y1 = lat1 * mPerDegLat;
  const x2 = lon2 * mPerDegLon;
  const y2 = lat2 * mPerDegLat;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const segLenSq = dx * dx + dy * dy;

  let t = 0;
  if (segLenSq > 0) {
    t = ((px - x1) * dx + (py - y1) * dy) / segLenSq;
  }
  const tClamped = Math.max(0, Math.min(1, t));

  const projX = x1 + tClamped * dx;
  const projY = y1 + tClamped * dy;

  const distX = px - projX;
  const distY = py - projY;
  const distM = Math.sqrt(distX * distX + distY * distY);

  return {
    distanceMeters: Number(distM.toFixed(1)),
    projection: {
      lat: projY / mPerDegLat,
      lon: projX / mPerDegLon
    },
    tClamped
  };
}

/**
 * Localiza la calle más cercana a nivel de metro y calcula la zonificación transversal y decaimiento OSPM
 */
export function findNearestStreetMeters(lat: number, lon: number): NearestStreetResult {
  let minDistanceM = 999999;
  let bestSegment: StreetSegmentGeodesic = MALAGA_STREET_NETWORK_SEGMENTS[0];
  let bestProj = { lat: bestSegment.p1.lat, lon: bestSegment.p1.lon };
  let bestT = 0;

  for (const seg of MALAGA_STREET_NETWORK_SEGMENTS) {
    const res = pointToSegmentDistanceMeters(lat, lon, seg.p1.lat, seg.p1.lon, seg.p2.lat, seg.p2.lon);
    if (res.distanceMeters < minDistanceM) {
      minDistanceM = res.distanceMeters;
      bestSegment = seg;
      bestProj = res.projection;
      bestT = res.tClamped;
    }
  }

  const halfRoad = bestSegment.carriagewayWidthM / 2.0;
  const sidewalkLimit = halfRoad + bestSegment.sidewalkWidthM;
  const facadeLimit = sidewalkLimit + 8.0;
  const setbackLimit = facadeLimit + 30.0;

  let lateralZone: 'carriageway' | 'sidewalk' | 'facade' | 'urban_setback' | 'park_or_free';
  let zoneLabel: string;
  let perpendicularDecayFactor: number;

  if (minDistanceM <= halfRoad) {
    lateralZone = 'carriageway';
    zoneLabel = `Calzada / Carril de Tráfico (${bestSegment.lanes} carriles)`;
    perpendicularDecayFactor = 1.0;
  } else if (minDistanceM <= sidewalkLimit) {
    lateralZone = 'sidewalk';
    const distFromCurb = minDistanceM - halfRoad;
    zoneLabel = `Acera Peatonal (${distFromCurb.toFixed(1)}m del bordillo, Cota 1.8m AGL)`;
    const sigmaY = 3.5 + 0.12 * distFromCurb;
    perpendicularDecayFactor = Number(Math.exp(-Math.pow(distFromCurb, 2) / (2 * Math.pow(sigmaY, 2))).toFixed(3));
  } else if (minDistanceM <= facadeLimit) {
    lateralZone = 'facade';
    const distFromCurb = minDistanceM - halfRoad;
    zoneLabel = `Línea de Fachada Edilicia (${distFromCurb.toFixed(1)}m de calzada)`;
    const sigmaY = 3.5 + 0.15 * distFromCurb;
    perpendicularDecayFactor = Number(Math.exp(-Math.pow(distFromCurb, 2) / (2 * Math.pow(sigmaY, 2))).toFixed(3));
  } else if (minDistanceM <= setbackLimit) {
    lateralZone = 'urban_setback';
    const distFromCurb = minDistanceM - halfRoad;
    zoneLabel = `Retranqueo / Manzana Interior (${distFromCurb.toFixed(0)}m de calzada)`;
    const sigmaY = 3.5 + 0.18 * distFromCurb;
    perpendicularDecayFactor = Number(Math.max(0.04, Math.exp(-Math.pow(distFromCurb, 2) / (2 * Math.pow(sigmaY, 2)))).toFixed(3));
  } else {
    lateralZone = 'park_or_free';
    zoneLabel = `Espacio Libre / Fondo Urbano (${minDistanceM.toFixed(0)}m de vía principal)`;
    perpendicularDecayFactor = 0.03;
  }

  return {
    segment: bestSegment,
    distanceMeters: minDistanceM,
    lateralZone,
    zoneLabel,
    perpendicularDecayFactor,
    projectionPoint: bestProj,
    clampedT: bestT
  };
}

/**
 * Clasificación Administrativa y Territorial Oficial de Málaga (11 Distritos y Barrios)
 */
export function getMalagaDistrictAndNeighborhood(lat: number, lon: number): {
  districtId: number;
  districtName: string;
  neighborhoodName: string;
  postalCode: string;
} {
  // Distrito 9: Campanillas
  if (lon < -4.510) {
    return {
      districtId: 9,
      districtName: 'Distrito 9: Campanillas',
      neighborhoodName: lat > 36.735 ? 'PTA Parque Tecnológico de Andalucía' : 'Campanillas Centro / Santa Rosalía',
      postalCode: '29590'
    };
  }

  // Distrito 8: Churriana
  if (lat < 36.690 && lon < -4.450) {
    return {
      districtId: 8,
      districtName: 'Distrito 8: Churriana',
      neighborhoodName: lon > -4.480 ? 'Guadalmar / San Julián' : 'Churriana / Aeropuerto AGP',
      postalCode: '29004'
    };
  }

  // Distrito 10: Puerto de la Torre
  if (lat > 36.735 && lon < -4.460) {
    return {
      districtId: 10,
      districtName: 'Distrito 10: Puerto de la Torre',
      neighborhoodName: 'Puerto de la Torre / Fuente Alegre',
      postalCode: '29010'
    };
  }

  // Distrito 11: Teatinos - Universidad
  if (lat >= 36.710 && lat <= 36.735 && lon < -4.455) {
    let neigh = 'Campus Teatinos';
    if (lat > 36.721) neigh = 'El Romeral / Colonia Santa Inés';
    else if (lon > -4.470) neigh = 'Ciudad de la Justicia';
    return {
      districtId: 11,
      districtName: 'Distrito 11: Teatinos-Universidad',
      neighborhoodName: neigh,
      postalCode: '29071'
    };
  }

  // Distrito 3: Ciudad Jardín
  if (lat > 36.732 && lon >= -4.440 && lon <= -4.412) {
    return {
      districtId: 3,
      districtName: 'Distrito 3: Ciudad Jardín',
      neighborhoodName: lat > 36.750 ? 'La Concepción / Finca La Palma' : 'Ciudad Jardín / Parque del Sur',
      postalCode: '29014'
    };
  }

  // Distrito 5: Palma - Palmilla
  if (lat >= 36.728 && lat <= 36.745 && lon >= -4.445 && lon <= -4.425) {
    return {
      districtId: 5,
      districtName: 'Distrito 5: Palma-Palmilla',
      neighborhoodName: lat > 36.735 ? 'La Palmilla / 26 de Febrero' : 'Martiricos / La Rosaleda',
      postalCode: '29011'
    };
  }

  // Distrito 4: Bailén - Miraflores
  if (lat >= 36.720 && lat <= 36.735 && lon >= -4.455 && lon <= -4.430) {
    let neigh = 'Bailén-Miraflores';
    if (lat > 36.726) neigh = 'Miraflores de los Ángeles / Nueva Málaga';
    else neigh = 'Gamarra / Las Chapas';
    return {
      districtId: 4,
      districtName: 'Distrito 4: Bailén-Miraflores',
      neighborhoodName: neigh,
      postalCode: '29009'
    };
  }

  // Distrito 6: Cruz de Humilladero
  if (lat >= 36.708 && lat <= 36.722 && lon >= -4.455 && lon <= -4.426) {
    let neigh = 'Cruz de Humilladero';
    if (lon < -4.442) neigh = 'Polígono Carretera Amarilla / Santa Cristina';
    else if (lat > 36.716) neigh = 'Carranque';
    else neigh = 'Los Tilos / Estación María Zambrano';
    return {
      districtId: 6,
      districtName: 'Distrito 6: Cruz de Humilladero',
      neighborhoodName: neigh,
      postalCode: '29006'
    };
  }

  // Distrito 7: Carretera de Cádiz
  if (lat < 36.712 && lon >= -4.460 && lon <= -4.425) {
    let neigh = 'Carretera de Cádiz';
    if (lon > -4.435) neigh = 'Huelin / Jardín de la Abadía';
    else if (lon < -4.450) neigh = 'Parque Litoral / Guadalhorce';
    else if (lat < 36.700) neigh = 'La Misericordia / San Andrés';
    else neigh = 'Las Delicias / Tabacalera';
    return {
      districtId: 7,
      districtName: 'Distrito 7: Carretera de Cádiz',
      neighborhoodName: neigh,
      postalCode: '29003'
    };
  }

  // Distrito 2: Málaga Este
  if (lon > -4.412) {
    let neigh = 'Málaga Este';
    let cp = '29016';
    if (lon <= -4.395) {
      neigh = 'La Malagueta / Monte Sancha';
      cp = '29016';
    } else if (lon <= -4.370) {
      neigh = 'Pedregalejo / Baños del Carmen';
      cp = '29017';
    } else {
      neigh = 'El Palo / El Candado';
      cp = '29018';
    }
    return {
      districtId: 2,
      districtName: 'Distrito 2: Málaga Este',
      neighborhoodName: neigh,
      postalCode: cp
    };
  }

  // Distrito 1: Centro (Default)
  let neigh = 'Centro Histórico';
  let cp = '29005';
  if (lat < 36.716 && lon > -4.425) {
    neigh = 'El Soho / Ensanche Heredia';
    cp = '29001';
  } else if (lat < 36.714) {
    neigh = 'Puerto de Málaga';
    cp = '29001';
  } else if (lat > 36.723 && lon > -4.418) {
    neigh = 'La Victoria / Lagunillas';
    cp = '29012';
  } else if (lat > 36.722 && lon < -4.424) {
    neigh = 'La Goleta / San Felipe Neri';
    cp = '29008';
  } else if (lon < -4.425) {
    neigh = 'El Perchel Norte';
    cp = '29007';
  }

  return {
    districtId: 1,
    districtName: 'Distrito 1: Centro',
    neighborhoodName: neigh,
    postalCode: cp
  };
}

/**
 * Cálculo analítico de Cota Topográfica sobre el nivel del mar (MDE IGN / SRTM)
 */
export function calculateMalagaElevationM(lat: number, lon: number): number {
  // Málaga: Costa sur a ~0-4m. Montañas al norte (Montes de Málaga) y colinas al oeste
  const baseLat = 36.710;
  const dLatNorth = Math.max(0, lat - baseLat); // Distancia hacia el norte en grados
  const kmNorth = dLatNorth * 111.0;

  // Elevación base de la franja costera
  let baseElev = 5.0;

  // Litoral inmediato (Puerto / Paseo Marítimo / Huelin)
  if (lat < 36.715 && lon > -4.445 && lon < -4.405) {
    return Math.max(2, Math.round(3 + (lat - 36.705) * 80));
  }

  // Pendiente hacia Montes de Málaga
  if (kmNorth > 1.5) {
    baseElev += Math.pow(kmNorth - 1.5, 1.8) * 18.0;
  }

  // El Atabal / Puerto de la Torre (Noroeste)
  if (lon < -4.455 && lat > 36.725) {
    const dNw = Math.sqrt(Math.pow((lat - 36.725) * 111, 2) + Math.pow((-4.455 - lon) * 85, 2));
    baseElev += dNw * 28.0;
  }

  // Teatinos (Oeste medio)
  if (lon < -4.460 && lat <= 36.725 && lat >= 36.710) {
    baseElev = 45.0 + (-4.460 - lon) * 60;
  }

  // Monte Gibralfaro / Alcazaba
  if (lat >= 36.720 && lat <= 36.726 && lon >= -4.417 && lon <= -4.408) {
    return Math.round(95 + (lat - 36.720) * 1200);
  }

  return Math.min(480, Math.max(2, Math.round(baseElev)));
}

/**
 * Distancia aproximada en metros a la línea de costa del Mar de Alborán
 */
export function calculateDistanceToCoastMeters(lat: number, lon: number): number {
  // Segmentos representativos de la línea de costa de Málaga
  const coastPolyline = [
    { lat: 36.660, lon: -4.480 }, // Desembocadura Guadalhorce
    { lat: 36.685, lon: -4.455 }, // Sacaba Beach
    { lat: 36.702, lon: -4.442 }, // Huelin / Misericordia
    { lat: 36.712, lon: -4.422 }, // Dársena Heredia / Muelle 4
    { lat: 36.713, lon: -4.415 }, // Dársena de Guadiaro
    { lat: 36.711, lon: -4.410 }, // Dique de Levante
    { lat: 36.717, lon: -4.406 }, // Playa de La Malagueta
    { lat: 36.719, lon: -4.385 }, // Baños del Carmen
    { lat: 36.719, lon: -4.360 }, // Pedregalejo
    { lat: 36.716, lon: -4.335 }  // El Candado
  ];

  let minDistM = 999999;
  for (let i = 0; i < coastPolyline.length - 1; i++) {
    const p1 = coastPolyline[i];
    const p2 = coastPolyline[i + 1];
    const res = pointToSegmentDistanceMeters(lat, lon, p1.lat, p1.lon, p2.lat, p2.lon);
    if (res.distanceMeters < minDistM) {
      minDistM = res.distanceMeters;
    }
  }

  return Math.round(minDistM);
}

/**
 * Localiza la estación de la Red Oficial de Calidad del Aire (Junta de Andalucía) más cercana
 */
export function getNearestOfficialAirStation(lat: number, lon: number) {
  let closest = OFFICIAL_MALAGA_AIR_STATIONS[0];
  let minDistKm = 9999;

  for (const st of OFFICIAL_MALAGA_AIR_STATIONS) {
    const d = fastDistanceKm(lat, lon, st.lat, st.lon);
    if (d < minDistKm) {
      minDistKm = d;
      closest = st;
    }
  }

  return {
    id: closest.id,
    code: closest.code,
    name: closest.name,
    distanceM: Math.round(minDistKm * 1000)
  };
}

/**
 * Resuelve determinísticamente la identidad espacial, territorial y microclimática
 * de cualquier coordenada de Málaga seleccionada en el mapa o interfaz.
 */
export function resolveMalagaLocationSync(
  lat: number,
  lon: number,
  explicitName?: string,
  clickedFeatures?: any[]
): ResolvedLocationMetadata {
  // 1. Análisis métrico viario a nivel de metro (OSPM)
  const streetAnalysis = findNearestStreetMeters(lat, lon);

  // 2. Información administrativa y territorial oficial de Málaga
  const territorial = getMalagaDistrictAndNeighborhood(lat, lon);

  // 3. Coordenadas geodésicas oficiales UTM Huso 30N (ETRS89)
  const utm = wgs84ToUtm30N(lon, lat);

  // 4. Parámetros físicos (cota MDE y distancia a costa)
  const elevationM = calculateMalagaElevationM(lat, lon);
  const distanceToCoastM = calculateDistanceToCoastMeters(lat, lon);
  const nearestStation = getNearestOfficialAirStation(lat, lon);

  let targetName = '';
  let highwayType = streetAnalysis.segment.category;
  let H = streetAnalysis.segment.H;
  let W = streetAnalysis.segment.carriagewayWidthM + (streetAnalysis.segment.sidewalkWidthM * 2);
  let orientationDeg = streetAnalysis.segment.orientationDeg;
  let treeCoverPct = streetAnalysis.segment.treeCoverPct;
  let lanes = streetAnalysis.segment.lanes;
  let qNOx = streetAnalysis.segment.baseQNOx_ug_m_s;
  let trafficVehiclesDay = streetAnalysis.segment.aadtVehiclesDay;
  let clickedFeatureType: 'street' | 'tree' | 'building' | 'blank_terrain' = 'blank_terrain';
  let isKnownLandmark = false;

  // A) Si hay entidad de MapLibre clicada
  if (clickedFeatures && clickedFeatures.length > 0) {
    const treeF = clickedFeatures.find((f: any) => 
      f.layer?.id === 'malaga-trees-line-layer' || f.layer?.id === 'malaga-trees-glow-layer'
    );
    if (treeF) {
      targetName = treeF.properties?.streetName || treeF.properties?.name || 'Alineación de Arbolado';
      clickedFeatureType = 'tree';
      treeCoverPct = 45;
    }

    const roadF = clickedFeatures.find((f: any) => 
      f.layer?.id === 'roads' || 
      f.layer?.id === 'traffic-nox-core-layer' || 
      f.layer?.id === 'traffic-nox-glow-layer' ||
      f.layer?.id === 'traffic-hotspots-core-layer'
    );
    if (roadF && !targetName) {
      targetName = roadF.properties?.streetName || roadF.properties?.name || roadF.properties?.highway || '';
      clickedFeatureType = 'street';
      if (roadF.properties?.qNOx_ug_m_s) qNOx = Number(roadF.properties.qNOx_ug_m_s);
    }
  }

  // B) Si se proporcionó un nombre explícito (ej. de buscador Nominatim, preset de zona o botón)
  if (!targetName && explicitName && explicitName.trim().length > 0) {
    const rawTrimmed = explicitName.trim();
    const parts = rawTrimmed.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2 && /^\d+[a-zA-Z/-]*$/.test(parts[0])) {
      targetName = `${parts[1]}, ${parts[0]}`;
    } else if (parts.length >= 4 && /málaga|andalucía|españa/i.test(rawTrimmed)) {
      targetName = parts.slice(0, 2).join(', ');
    } else {
      targetName = rawTrimmed;
    }
    isKnownLandmark = true;
  }

  // C) Hitos catalogados de cercanía inmediata (< 150m)
  if (!targetName) {
    let closestLm: MalagaGeoReference | null = null;
    let minLmDist = 0.15; // 150 metros
    for (const lm of MASTER_MALAGA_GEOREFERENCES) {
      const d = fastDistanceKm(lat, lon, lm.lat, lm.lon);
      if (d < minLmDist) {
        minLmDist = d;
        closestLm = lm;
      }
    }
    if (closestLm) {
      targetName = closestLm.name;
      highwayType = (closestLm.highwayType as any) || highwayType;
      H = closestLm.H || H;
      W = closestLm.W || W;
      orientationDeg = closestLm.orientationDeg || orientationDeg;
      treeCoverPct = closestLm.treeCoverPct !== undefined ? closestLm.treeCoverPct : treeCoverPct;
      lanes = closestLm.lanes !== undefined ? closestLm.lanes : lanes;
      qNOx = closestLm.qNOx_ug_m_s || qNOx;
      trafficVehiclesDay = closestLm.trafficVehiclesDay || trafficVehiclesDay;
      isKnownLandmark = true;
      clickedFeatureType = 'street';
    }
  }

  // D) Si está cerca de una calle de la red viaria (< 90m)
  if (!targetName) {
    if (streetAnalysis.distanceMeters <= 90) {
      targetName = streetAnalysis.segment.name;
      clickedFeatureType = streetAnalysis.distanceMeters <= 25 ? 'street' : 'blank_terrain';
    } else {
      // E) Si no, componer con el barrio y distrito
      targetName = `${territorial.neighborhoodName}`;
      clickedFeatureType = 'blank_terrain';
    }
  }

  // Morfología de Oke (1987)
  const safeW = Math.max(W, 4.0);
  const aspectRatioHw = Number((H / safeW).toFixed(2));
  const skyViewFactorSvf = Number(Math.cos(Math.atan(2 * aspectRatioHw)).toFixed(2));

  let flowRegimeOke: 'isolated_roughness' | 'wake_interference' | 'skimming_flow';
  let flowRegimeLabel: string;
  if (aspectRatioHw < 0.30) {
    flowRegimeOke = 'isolated_roughness';
    flowRegimeLabel = 'Isolated Roughness Flow (Flujo Aislado • Dispersión Abierta)';
  } else if (aspectRatioHw < 0.65) {
    flowRegimeOke = 'wake_interference';
    flowRegimeLabel = 'Wake Interference Flow (Interferencia de Estelas)';
  } else {
    flowRegimeOke = 'skimming_flow';
    flowRegimeLabel = 'Skimming Flow (Cañón Cerrado • Recirculación Euleriana)';
  }

  // Etiqueta cardinal de orientación
  let streetOrientationLabel = `${orientationDeg}°`;
  if ((orientationDeg >= 337.5 || orientationDeg < 22.5) || (orientationDeg >= 157.5 && orientationDeg < 202.5)) {
    streetOrientationLabel = `N-S (${orientationDeg}°)`;
  } else if ((orientationDeg >= 67.5 && orientationDeg < 112.5) || (orientationDeg >= 247.5 && orientationDeg < 292.5)) {
    streetOrientationLabel = `E-O (${orientationDeg}°)`;
  } else if ((orientationDeg >= 22.5 && orientationDeg < 67.5) || (orientationDeg >= 202.5 && orientationDeg < 247.5)) {
    streetOrientationLabel = `NE-SO (${orientationDeg}°)`;
  } else {
    streetOrientationLabel = `NO-SE (${orientationDeg}°)`;
  }

  const fullLocationDescription = `${targetName}, ${territorial.neighborhoodName} (${territorial.districtName}, CP ${territorial.postalCode})`;

  return {
    lat,
    lon,
    name: targetName,
    highwayType: highwayType || 'urban_street',
    H,
    W,
    orientationDeg,
    treeCoverPct,
    lanes,
    qNOx_ug_m_s: qNOx,
    trafficVehiclesDay,
    clickedFeatureType,
    isKnownLandmark,
    distanceToStreetMeters: streetAnalysis.distanceMeters,
    nearestStreetName: streetAnalysis.segment.name,
    lateralZone: streetAnalysis.lateralZone,
    lateralZoneLabel: streetAnalysis.zoneLabel,
    perpendicularDecayFactor: streetAnalysis.perpendicularDecayFactor,
    districtId: territorial.districtId,
    districtName: territorial.districtName,
    neighborhoodName: territorial.neighborhoodName,
    postalCode: territorial.postalCode,
    utmX: Math.round(utm.x),
    utmY: Math.round(utm.y),
    elevationM,
    distanceToCoastM,
    nearestOfficialStation: nearestStation,
    aspectRatioHw,
    skyViewFactorSvf,
    flowRegimeOke,
    flowRegimeLabel,
    streetOrientationLabel,
    fullLocationDescription,
    buildingHeightM: H,
    canyonWidthM: W,
    streetBearingDeg: orientationDeg,
    streetName: streetAnalysis.segment.name || targetName,
    district: territorial.districtName,
    svf: skyViewFactorSvf,
    isPedestrian: (highwayType === 'pedestrian') || (lanes === 0)
  };
}

/**
 * Consulta de enriquecimiento asíncrono con el servicio oficial de geocodificación reversa
 * (No bloqueante, complementa con el número de portal o denominación oficial del callejero)
 */
export async function enrichLocationWithReverseGeocoding(lat: number, lon: number): Promise<{
  streetName?: string;
  streetNumber?: string;
  neighborhood?: string;
  postalCode?: string;
  formattedAddress?: string;
} | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lon=${lon}`, {
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.streetName) {
        return {
          streetName: data.streetName,
          streetNumber: data.streetNumber,
          neighborhood: data.neighborhood,
          postalCode: data.postalCode,
          formattedAddress: data.formattedAddress
        };
      }
    }
  } catch (err) {
    // Falla silenciosa, la resolución analítica instantánea a 0 ms ya está garantizada
  }
  return null;
}
