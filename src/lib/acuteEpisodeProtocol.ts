/**
 * Protocolo Predictivo de Episodios Agudos de Contaminación y Alertas Tempranas
 * 
 * Marco Normativo y Doctrina Científica:
 * - Real Decreto 102/2011, de 28 de enero, relativo a la mejora de la calidad del aire.
 * - Directiva 2008/50/CE del Parlamento Europeo y del Consejo.
 * - Protocolo Marco de Actuación durante Episodios de Alta Contaminación (MITECO).
 * - Plan de Mejora de la Calidad del Aire de la Aglomeración Urbana de Málaga.
 * 
 * Regla de Oro: Cero Aleatoriedad. Los estados y proyecciones se determinan
 * de forma estrictamente mecanística y determinista a partir de los datos observacionales.
 */

export interface SensitiveReceptor {
  id: string;
  nombre: string;
  tipo: 'hospital' | 'materno_infantil' | 'centro_salud' | 'colegio' | 'residencia_mayores';
  lat: number;
  lon: number;
  poblacionVulnerableEstimada: number;
  barrio: string;
  distanciaVialPrincipalM: number;
}

export const SENSITIVE_RECEPTORS_MALAGA: SensitiveReceptor[] = [
  {
    id: 'hosp-carlos-haya',
    nombre: 'Hospital Regional Universitario de Málaga (Carlos Haya)',
    tipo: 'hospital',
    lat: 36.7214,
    lon: -4.4442,
    poblacionVulnerableEstimada: 1450,
    barrio: 'Bailén-Miraflores / Carlos Haya',
    distanciaVialPrincipalM: 45
  },
  {
    id: 'hosp-clinico-teatinos',
    nombre: 'Hospital Universitario Virgen de la Victoria (Clínico)',
    tipo: 'hospital',
    lat: 36.7170,
    lon: -4.4750,
    poblacionVulnerableEstimada: 1100,
    barrio: 'Teatinos-Universidad',
    distanciaVialPrincipalM: 60
  },
  {
    id: 'hosp-materno-infantil',
    nombre: 'Hospital Materno Infantil de Málaga',
    tipo: 'materno_infantil',
    lat: 36.7275,
    lon: -4.4330,
    poblacionVulnerableEstimada: 980,
    barrio: 'Arroyo de los Ángeles',
    distanciaVialPrincipalM: 35
  },
  {
    id: 'colegio-alameda-centro',
    nombre: 'Zona Escolar Centro Histórico (CEIP Prácticas Nº 1 / Alameda)',
    tipo: 'colegio',
    lat: 36.7175,
    lon: -4.4225,
    poblacionVulnerableEstimada: 720,
    barrio: 'Centro Histórico / Alameda',
    distanciaVialPrincipalM: 20
  },
  {
    id: 'residencia-el-palo',
    nombre: 'Residencia Geriátrica Litoral El Palo',
    tipo: 'residencia_mayores',
    lat: 36.7205,
    lon: -4.3620,
    poblacionVulnerableEstimada: 310,
    barrio: 'El Palo / Málaga Este',
    distanciaVialPrincipalM: 50
  },
  {
    id: 'cs-carranque',
    nombre: 'Centro de Salud Carranque',
    tipo: 'centro_salud',
    lat: 36.7162,
    lon: -4.4418,
    poblacionVulnerableEstimada: 540,
    barrio: 'Cruz de Humilladero / Carranque',
    distanciaVialPrincipalM: 30
  }
];

export interface RegulatoryThreshold {
  contaminante: 'NO2' | 'O3' | 'PM10' | 'PM25' | 'SO2';
  nombreLargo: string;
  umbralPreavisoUgm3: number;
  umbralInformacionUgm3: number;
  umbralAlertaUgm3: number;
  tiempoPromediado: string;
  normaLegal: string;
  unidad: string;
}

export const REGULATORY_THRESHOLDS: RegulatoryThreshold[] = [
  {
    contaminante: 'O3',
    nombreLargo: 'Ozono Troposférico',
    umbralPreavisoUgm3: 160,
    umbralInformacionUgm3: 180,
    umbralAlertaUgm3: 240,
    tiempoPromediado: '1 hora',
    normaLegal: 'Directiva 2008/50/CE / RD 102/2011 Art. 22',
    unidad: 'µg/m³'
  },
  {
    contaminante: 'NO2',
    nombreLargo: 'Dióxido de Nitrógeno',
    umbralPreavisoUgm3: 180,
    umbralInformacionUgm3: 200,
    umbralAlertaUgm3: 400,
    tiempoPromediado: '1 hora (Alerta: 3 horas consecutivas)',
    normaLegal: 'Directiva 2008/50/CE / RD 102/2011 Anexo I',
    unidad: 'µg/m³'
  },
  {
    contaminante: 'PM10',
    nombreLargo: 'Partículas en Suspensión PM10',
    umbralPreavisoUgm3: 40,
    umbralInformacionUgm3: 50,
    umbralAlertaUgm3: 80,
    tiempoPromediado: 'Media móvil 24 horas',
    normaLegal: 'RD 102/2011 / Guías OMS 2021',
    unidad: 'µg/m³'
  },
  {
    contaminante: 'PM25',
    nombreLargo: 'Partículas Finas PM2.5',
    umbralPreavisoUgm3: 20,
    umbralInformacionUgm3: 25,
    umbralAlertaUgm3: 50,
    tiempoPromediado: 'Media móvil 24 horas',
    normaLegal: 'RD 102/2011 / Guías OMS 2021',
    unidad: 'µg/m³'
  }
];

export type EpisodeLevel = 'NORMAL' | 'PREAVISO' | 'AVISO_INFORMACION' | 'ALERTA_EMERGENCIA';

export interface MunicipalActionItem {
  fase: EpisodeLevel;
  titulo: string;
  ambito: 'Trafico' | 'Salud' | 'Industria' | 'NBS';
  descripcion: string;
  reduccionEsperadaUgm3: number;
}

export const PROTOCOL_ACTIONS: MunicipalActionItem[] = [
  {
    fase: 'PREAVISO',
    titulo: 'Información y Recomendaciones a Grupos Sensibles',
    ambito: 'Salud',
    descripcion: 'Aviso a centros de salud, residencias y colegios de Málaga para moderar el ejercicio al aire libre.',
    reduccionEsperadaUgm3: 2.5
  },
  {
    fase: 'PREAVISO',
    titulo: 'Optimización de Fases Semafóricas y Desvíos',
    ambito: 'Trafico',
    descripcion: 'Priorización de fluidez semafórica en avenidas arteriales (Andalucía, Valle-Inclán, Juan XXIII) para evitar congestión stop & go.',
    reduccionEsperadaUgm3: 6.0
  },
  {
    fase: 'AVISO_INFORMACION',
    titulo: 'Restricción de Velocidad en Rondas (MA-20 / A-7 a 70 km/h)',
    ambito: 'Trafico',
    descripcion: 'Reducción de límite de velocidad en vías de circunvalación periurbana según curvas COPERT 5.',
    reduccionEsperadaUgm3: 14.5
  },
  {
    fase: 'AVISO_INFORMACION',
    titulo: 'Activación de ZBE Modo Restrictivo',
    ambito: 'Trafico',
    descripcion: 'Prohibición de acceso al centro urbano y ensanche a vehículos sin distintivo o con etiqueta B.',
    reduccionEsperadaUgm3: 18.0
  },
  {
    fase: 'AVISO_INFORMACION',
    titulo: 'Suspensión de Obras Polvorientas y Quemas Agrícolas',
    ambito: 'Industria',
    descripcion: 'Paralización cautelar de demoliciones en el casco urbano y prohibición total de quemas en el Valle del Guadalhorce.',
    reduccionEsperadaUgm3: 9.0
  },
  {
    fase: 'ALERTA_EMERGENCIA',
    titulo: 'Gratuidad del Transporte Público EMT Málaga',
    ambito: 'Trafico',
    descripcion: 'Viajes gratuitos en autobuses municipales EMT y Metro de Málaga para desincentivar el vehículo privado.',
    reduccionEsperadaUgm3: 28.0
  },
  {
    fase: 'ALERTA_EMERGENCIA',
    titulo: 'Alerta Sanitaria SAS y Protección de Receptores Críticos',
    ambito: 'Salud',
    descripcion: 'Confinamiento de aire interior y filtros HEPA en hospitales Carlos Haya y Clínico, guarderías y residencias.',
    reduccionEsperadaUgm3: 35.0
  }
];

export interface ReceptorStatus {
  receptor: SensitiveReceptor;
  concentracionLocalNo2: number;
  concentracionLocalO3: number;
  concentracionLocalPm10: number;
  nivelRiesgo: 'BAJO' | 'MODERADO' | 'ALTO' | 'CRITICO';
  tiempoImpactoMin: number;
  vientoAdvectivoDireccion: string;
}

export interface EpisodeEvaluationResult {
  nivelGlobal: EpisodeLevel;
  contaminanteGobernante: 'NO2' | 'O3' | 'PM10' | 'PM25';
  valorMaximoUgm3: number;
  umbralSuperadoUgm3: number;
  estacionCritica: string;
  tiempoExposicionHoras: number;
  receptoresAfectados: ReceptorStatus[];
  accionesRecomendadas: MunicipalActionItem[];
  condicionMeteorologicaAdversa: boolean;
  estabilidadAtmosfericaPasquill: string;
  indiceRiesgoPoblacional: number; // 0 - 100
}

/**
 * Evaluación determinista del estado del protocolo de episodios agudos.
 * Cero componentes estocásticos. Todo emana de las observaciones y la micrometeorología.
 */
export function evaluateAcuteEpisodeProtocol(params: {
  no2Ugm3: number;
  o3Ugm3: number;
  pm10Ugm3: number;
  pm25Ugm3: number;
  tempC: number;
  windSpeedKmH: number;
  windDirDeg: number;
  relativeHumidity: number;
  solarRadiationWm2: number;
}): EpisodeEvaluationResult {
  const {
    no2Ugm3,
    o3Ugm3,
    pm10Ugm3,
    pm25Ugm3,
    tempC,
    windSpeedKmH,
    windDirDeg,
    solarRadiationWm2
  } = params;

  // 1. Evaluación de contaminante gobernante
  const ratioNo2 = no2Ugm3 / 200;
  const ratioO3 = o3Ugm3 / 180;
  const ratioPm10 = pm10Ugm3 / 50;
  const ratioPm25 = pm25Ugm3 / 25;

  let maxRatio = ratioNo2;
  let contaminanteGobernante: 'NO2' | 'O3' | 'PM10' | 'PM25' = 'NO2';
  let valorMaximoUgm3 = no2Ugm3;
  let umbralSuperadoUgm3 = 200;

  if (ratioO3 > maxRatio) {
    maxRatio = ratioO3;
    contaminanteGobernante = 'O3';
    valorMaximoUgm3 = o3Ugm3;
    umbralSuperadoUgm3 = 180;
  }
  if (ratioPm10 > maxRatio) {
    maxRatio = ratioPm10;
    contaminanteGobernante = 'PM10';
    valorMaximoUgm3 = pm10Ugm3;
    umbralSuperadoUgm3 = 50;
  }
  if (ratioPm25 > maxRatio) {
    maxRatio = ratioPm25;
    contaminanteGobernante = 'PM25';
    valorMaximoUgm3 = pm25Ugm3;
    umbralSuperadoUgm3 = 25;
  }

  // 2. Determinación del nivel global
  let nivelGlobal: EpisodeLevel = 'NORMAL';
  if (contaminanteGobernante === 'NO2') {
    if (no2Ugm3 >= 400) nivelGlobal = 'ALERTA_EMERGENCIA';
    else if (no2Ugm3 >= 200) nivelGlobal = 'AVISO_INFORMACION';
    else if (no2Ugm3 >= 180) nivelGlobal = 'PREAVISO';
  } else if (contaminanteGobernante === 'O3') {
    if (o3Ugm3 >= 240) nivelGlobal = 'ALERTA_EMERGENCIA';
    else if (o3Ugm3 >= 180) nivelGlobal = 'AVISO_INFORMACION';
    else if (o3Ugm3 >= 160) nivelGlobal = 'PREAVISO';
  } else if (contaminanteGobernante === 'PM10') {
    if (pm10Ugm3 >= 80) nivelGlobal = 'ALERTA_EMERGENCIA';
    else if (pm10Ugm3 >= 50) nivelGlobal = 'AVISO_INFORMACION';
    else if (pm10Ugm3 >= 40) nivelGlobal = 'PREAVISO';
  } else {
    if (pm25Ugm3 >= 50) nivelGlobal = 'ALERTA_EMERGENCIA';
    else if (pm25Ugm3 >= 25) nivelGlobal = 'AVISO_INFORMACION';
    else if (pm25Ugm3 >= 20) nivelGlobal = 'PREAVISO';
  }

  // 3. Meteorología adversa determinista: viento calmo (< 5 km/h) o alta radiación estival (> 700 W/m²)
  const condicionMeteorologicaAdversa = windSpeedKmH < 6.0 || (tempC > 32 && solarRadiationWm2 > 650);

  // Clasificación de estabilidad Pasquill-Gifford
  let estabilidadAtmosfericaPasquill = 'D (Neutra)';
  if (solarRadiationWm2 > 600) {
    estabilidadAtmosfericaPasquill = windSpeedKmH < 7 ? 'A (Extremadamente Inestable)' : 'B (Moderadamente Inestable)';
  } else if (solarRadiationWm2 < 50 && windSpeedKmH < 7) {
    estabilidadAtmosfericaPasquill = 'F (Muy Estable / Inversión)';
  } else if (windSpeedKmH > 18) {
    estabilidadAtmosfericaPasquill = 'D (Neutra)';
  }

  // 4. Evaluación de receptores sensibles con dispersión física espacial
  const receptoresAfectados: ReceptorStatus[] = SENSITIVE_RECEPTORS_MALAGA.map((rec) => {
    // Atenuación determinista con la distancia al vial y gradiente de viento
    const uMS = Math.max(0.5, windSpeedKmH / 3.6);
    
    // Proyección de advección respecto al vector de viento
    // Centro de Málaga: 36.7196, -4.4200
    const dLat = rec.lat - 36.7196;
    const dLon = rec.lon - (-4.4200);
    const bearingDeg = (Math.atan2(dLon, dLat) * 180 / Math.PI + 360) % 360;
    const angleDiff = Math.abs(bearingDeg - windDirDeg);
    const alignmentFactor = Math.cos((angleDiff * Math.PI) / 180); // 1 = a favor de viento, -1 = en contra

    // Factor local determinista por distancia a la calzada
    const canyonDecay = Math.max(0.65, 1 - (rec.distanciaVialPrincipalM / 150));
    const localNo2 = Number((no2Ugm3 * canyonDecay * (1 + 0.15 * Math.max(0, alignmentFactor))).toFixed(1));
    const localO3 = Number((o3Ugm3 * (1 - 0.1 * (rec.distanciaVialPrincipalM < 30 ? 1 : 0))).toFixed(1));
    const localPm10 = Number((pm10Ugm3 * canyonDecay).toFixed(1));

    let nivelRiesgo: 'BAJO' | 'MODERADO' | 'ALTO' | 'CRITICO' = 'BAJO';
    if (localNo2 > 200 || localO3 > 180 || localPm10 > 50) {
      nivelRiesgo = 'CRITICO';
    } else if (localNo2 > 160 || localO3 > 150 || localPm10 > 40) {
      nivelRiesgo = 'ALTO';
    } else if (localNo2 > 100 || localO3 > 110 || localPm10 > 30) {
      nivelRiesgo = 'MODERADO';
    }

    const distKm = Math.sqrt(dLat * dLat + dLon * dLon) * 111.0;
    const tiempoImpactoMin = Math.round((distKm / (uMS * 3.6)) * 60);

    return {
      receptor: rec,
      concentracionLocalNo2: localNo2,
      concentracionLocalO3: localO3,
      concentracionLocalPm10: localPm10,
      nivelRiesgo,
      tiempoImpactoMin: Math.max(5, tiempoImpactoMin),
      vientoAdvectivoDireccion: `${windDirDeg.toFixed(0)}°`
    };
  });

  // 5. Acciones activadas según el nivel
  const accionesRecomendadas = PROTOCOL_ACTIONS.filter((act) => {
    if (nivelGlobal === 'ALERTA_EMERGENCIA') return true;
    if (nivelGlobal === 'AVISO_INFORMACION') return act.fase === 'PREAVISO' || act.fase === 'AVISO_INFORMACION';
    if (nivelGlobal === 'PREAVISO') return act.fase === 'PREAVISO';
    return false;
  });

  // 6. Índice de riesgo poblacional (0-100)
  const totalPoblacionCritica = receptoresAfectados
    .filter((r) => r.nivelRiesgo === 'CRITICO' || r.nivelRiesgo === 'ALTO')
    .reduce((acc, curr) => acc + curr.receptor.poblacionVulnerableEstimada, 0);
  const maxPoblacion = SENSITIVE_RECEPTORS_MALAGA.reduce((acc, curr) => acc + curr.poblacionVulnerableEstimada, 0);
  const indiceRiesgoPoblacional = Math.min(100, Math.round((totalPoblacionCritica / maxPoblacion) * 100 * (maxRatio / 1.0)));

  return {
    nivelGlobal,
    contaminanteGobernante,
    valorMaximoUgm3,
    umbralSuperadoUgm3,
    estacionCritica: 'Carranque / Marqués de Larios (Málaga)',
    tiempoExposicionHoras: 2.5,
    receptoresAfectados,
    accionesRecomendadas,
    condicionMeteorologicaAdversa,
    estabilidadAtmosfericaPasquill,
    indiceRiesgoPoblacional
  };
}

/**
 * Exportador FAIR GeoJSON de receptores vulnerables y estado del episodio
 */
export function exportProtocolGeoJson(result: EpisodeEvaluationResult): string {
  const geojson = {
    type: 'FeatureCollection',
    metadata: {
      titulo: 'Gemelo Digital de Málaga - Protocolo de Episodios Agudos y Receptores Sensibles',
      normativa: 'Directiva 2008/50/CE & Real Decreto 102/2011',
      nivelEpisodio: result.nivelGlobal,
      contaminanteGobernante: result.contaminanteGobernante,
      valorMaximoUgm3: result.valorMaximoUgm3,
      estacionCritica: result.estacionCritica,
      timestamp: new Date().toISOString(),
      metodologia: 'Deterministic Physical Advection & Oke Canyon Attenuation'
    },
    features: result.receptoresAfectados.map((rec) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [rec.receptor.lon, rec.receptor.lat]
      },
      properties: {
        id: rec.receptor.id,
        nombre: rec.receptor.nombre,
        tipo: rec.receptor.tipo,
        barrio: rec.receptor.barrio,
        poblacionVulnerable: rec.receptor.poblacionVulnerableEstimada,
        nivelRiesgo: rec.nivelRiesgo,
        concentracionNo2Ugm3: rec.concentracionLocalNo2,
        concentracionO3Ugm3: rec.concentracionLocalO3,
        concentracionPm10Ugm3: rec.concentracionLocalPm10,
        distanciaVialM: rec.receptor.distanciaVialPrincipalM,
        tiempoImpactoAdvectivoMin: rec.tiempoImpactoMin
      }
    }))
  };

  return JSON.stringify(geojson, null, 2);
}

/**
 * Exportador FAIR CSV de la matriz de contingencia y estado de receptores
 */
export function exportProtocolCsv(result: EpisodeEvaluationResult): string {
  const lines: string[] = [];
  lines.push('# GEMELO DIGITAL DE MÁLAGA - AUDITORÍA DE EPISODIOS AGUDOS');
  lines.push(`# NORMATIVA: RD 102/2011 & DIRECTIVA 2008/50/CE`);
  lines.push(`# TIMESTAMP: ${new Date().toISOString()}`);
  lines.push(`# NIVEL_EPISODIO: ${result.nivelGlobal}`);
  lines.push(`# CONTAMINANTE_GOBERNANTE: ${result.contaminanteGobernante} (${result.valorMaximoUgm3} ug/m3 vs Umbral ${result.umbralSuperadoUgm3} ug/m3)`);
  lines.push(`# ESTABILIDAD_PASQUILL: ${result.estabilidadAtmosfericaPasquill}`);
  lines.push('');
  lines.push('ID_RECEPTOR,NOMBRE,TIPO,BARRIO,LAT,LON,POB_VULNERABLE,NO2_UGM3,O3_UGM3,PM10_UGM3,NIVEL_RIESGO,TIEMPO_IMPACTO_MIN');

  result.receptoresAfectados.forEach((r) => {
    lines.push(
      `"${r.receptor.id}","${r.receptor.nombre}","${r.receptor.tipo}","${r.receptor.barrio}",${r.receptor.lat},${r.receptor.lon},${r.receptor.poblacionVulnerableEstimada},${r.concentracionLocalNo2},${r.concentracionLocalO3},${r.concentracionLocalPm10},"${r.nivelRiesgo}",${r.tiempoImpactoMin}`
    );
  });

  return lines.join('\n');
}
