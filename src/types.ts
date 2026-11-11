/**
 * Málaga Digital Twin - Ph.D. Core Types
 * Centralized type definitions for physics, chemistry, and geospatial assimilation.
 */

export interface Location {
  lat: number;
  lon: number;
}

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
  distanceToStreetMeters: number;
  nearestStreetName: string;
  lateralZone: 'carriageway' | 'sidewalk' | 'facade' | 'urban_setback' | 'park_or_free';
  lateralZoneLabel: string;
  perpendicularDecayFactor: number;
  districtId: number;
  districtName: string;
  neighborhoodId: number;
  neighborhoodName: string;
  postalCode: string;
  elevationM: number;
  distanceToCoastM: number;
  isWithinZBE: boolean;
  isOfficialStation: boolean;
  officialStationId?: string;
  isMalagaTree: boolean;
  malagaTreeId?: string;
  openStreetView?: boolean;
}

export interface MeteoData {
  temperatura_malaga: number;
  direccion_viento_grados: number;
  velocidad_viento_km_h: number;
  no2_satelite_base: number;
  lai_arbolado: number;
  humedad_relativa: number;
  pm2_5: number;
  pm10: number;
  dust: number;
  ozone: number;
  uv_index: number;
  presion_atmosferica: number;
  temperatura_mar_c?: number;
  salinidad_mar_psu?: number;
  densidad_vias_m2?: number;
  volumen_edificios_m3?: number;
  shortwave_radiation?: number;
  cloud_cover?: number;
  pbl_height?: number;
  aspect_ratio_hw?: number;
  sky_view_factor?: number;
  lat?: number;
  lon?: number;
}

export interface PhysicsResult {
  vd: number;
  k: number;
  j_no2: number;
  aod: number;
  aod_category: string;
  aod_f_rh: number;
  aod_attenuation_solar: number;
  estabilidad_pg: string;
  justificacion: string;
  sugerencias_doctorado: string[];
  cinetica_quimica: {
    no_est: number;
    voc_est: number;
    ratio_leighton: number;
    k3: number;
    voc_nox_ratio: number;
    regimen_ozono: string;
    cloro_radical_activado: boolean;
    clno2_pptv: number;
    temperatura_mar_c: number;
    salinidad_mar_psu: number;
    emision_spray_marino_mg_m2_s: number;
    tasa_heterogenea_n2o5_s1: number;
    emision_isopreno_ug_m2_h: number;
    rendimiento_soa_porcentaje: number;
    alerta_estres_biogenico: boolean;
    ruta_oxidacion_ro2: string;
    zona_malaga: string;
    paradoja_fin_de_semana: boolean;
    remocion_no2_kg_dia: number;
    tasa_captacion_kg_ha_ano: number;
    flujo_deposicion_ug_m2_s: number;
    efecto_barrera_canon: boolean;
    pbl_height_m: number;
  };
}

export interface ActivePointContextValue {
  location: { lat: number; lon: number };
  activePoint: ResolvedLocationMetadata;
  assimilation: any;
  data: MeteoData;
  result: PhysicsResult | null;
  syncActivePoint: (
    lat: number,
    lon: number,
    options?: {
      name?: string;
      zoom?: number;
      pitch?: number;
      fly?: boolean;
      openStreetView?: boolean;
      clickedFeatures?: any;
    }
  ) => void;
}
