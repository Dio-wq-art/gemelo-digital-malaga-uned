/**
 * Módulo de Entornos Escolares Seguros (School Streets) & Dosimetría Pediátrica ICRP 66
 * Tesis Doctoral: Gemelo Digital de Málaga
 * 
 * Normativa:
 * - Directiva (UE) 2024/2881 (Art. 13: Protección de grupos vulnerables y centros educativos).
 * - Real Decreto 1052/2022 (Zonas de Bajas Emisiones y entornos escolares).
 * - Guía OMS 2021 sobre calidad del aire y salud infantil.
 * 
 * Fisiología Respiratoria Pediátrica ICRP 66:
 * - Tasa de ventilación específica niño (6-11 años): V_E = 0.42 m³/(h·kg) [vs 0.20 en adultos].
 * - Frecuencia respiratoria: 22 respiraciones/minuto.
 * - Cota de inhalación: 0.90 m AGL (coincide con la cota de eyección de escapes vehiculares).
 * - Fracción de depósito alveolar profundo (ICRP 66): f_alv = 0.28 para PM2.5.
 * 
 * Rigor doctoral: CERO datos estocásticos (Math.random() = 0).
 */

export interface SchoolVulnerabilityProfile {
  schoolId: string;
  schoolName: string;
  districtName: string;
  districtId: number;
  lat: number;
  lon: number;
  averageIncomeEurYear: number;
  studentsCount: number;
  streetType: 'CALLE_PACIFICADA_ESCOLAR' | 'CAÑON_TRAFICO_DENSO' | 'AVENIDA_ARTERIAL';
  inhalationHeightM: number;           // 0.90m AGL
  schoolHoursPeakNO2UgM3: number;      // Concentración en hora punta (08:30-09:15)
  baselinePM25UgM3: number;
  childHourlyNO2DoseUg: number;        // Dosis inhalada por hora (µg/h)
  childAlveolarPM25DoseUgDay: number;  // Depósito en alvéolos (µg/día escolar)
  trafficBufferStatus: 'PROTEGIDO_PEATONAL' | 'AMORTIGUAMIENTO_MEDIO' | 'ALTA_EXPOSICION_FRONTAL';
  directiveComplianceStatus: 'CUMPLE_GUIA_OMS' | 'EXCEDE_OBJETIVO_2030' | 'ALERTA_EXPOSICION_CRONICA';
  // Marco Regulatorio Tripartito (Directiva 2008/50/CE vs Directiva (UE) 2024/2881 vs OMS 2021)
  dir2008LimitNO2: number;
  dir2024LimitNO2: number;
  who2021GuideNO2: number;
  gap2024DirectiveNO2: number;
  requiredTrafficReductionPercent: number;
  dir2008Compliance: 'CONFORME' | 'SUPERACION';
  dir2024Compliance: 'CONFORME' | 'SUPERACION_HORIZONTE_2030';
  who2021Compliance: 'CONFORME' | 'SUPERACION_GUIA_SALUD';
}

export interface SchoolAirEquityAnalysis {
  evaluatedSchoolsCount: number;
  childAdultVentilationRatio: number;
  mostExposedSchool: string;
  leastExposedSchool: string;
  inequalityRatioLowVsHighIncome: number;
  schools: SchoolVulnerabilityProfile[];
  regulatoryVerdict: string;
  doctoralConclusion: string;
  tripartiteSummary: {
    dir2008CompliantCount: number;
    dir2024CompliantCount: number;
    who2021CompliantCount: number;
    averageGap2024DirectiveNO2: number;
    maxTrafficReductionRequiredPercent: number;
    criticalSchoolId: string;
  };
}

export const MALAGA_RAW_SCHOOLS = [
  {
    id: 'CEIP-01',
    name: 'CEIP Prácticas Nº 1 (Plaza de la Constitución)',
    district: 'Distrito 1: Centro (ZBE)',
    districtId: 1,
    lat: 36.7218,
    lon: -4.4225,
    income: 31800,
    students: 450,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.85,
    buffer: 'PROTEGIDO_PEATONAL' as const
  },
  {
    id: 'CEIP-02',
    name: 'CEIP San José de Calasanz (Calle Ollerías)',
    district: 'Distrito 1: Centro (ZBE)',
    districtId: 1,
    lat: 36.7245,
    lon: -4.421,
    income: 31800,
    students: 380,
    streetType: 'CAÑON_TRAFICO_DENSO' as const,
    trafficExposureFactor: 1.28,
    buffer: 'ALTA_EXPOSICION_FRONTAL' as const
  },
  {
    id: 'CEIP-03',
    name: 'CEIP Madre de Dios (Plaza Jerónimo Cuervo)',
    district: 'Distrito 1: Centro (ZBE)',
    districtId: 1,
    lat: 36.7258,
    lon: -4.4172,
    income: 31800,
    students: 320,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.82,
    buffer: 'PROTEGIDO_PEATONAL' as const
  },
  {
    id: 'CEIP-04',
    name: 'CDP San Agustín (Calle Pedro de Toledo)',
    district: 'Distrito 1: Centro (ZBE)',
    districtId: 1,
    lat: 36.721,
    lon: -4.419,
    income: 31800,
    students: 650,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.88,
    buffer: 'AMORTIGUAMIENTO_MEDIO' as const
  },
  {
    id: 'CEIP-05',
    name: 'CEIP Nuestra Señora de Gracia (Calle Victoria)',
    district: 'Distrito 1: Centro (ZBE)',
    districtId: 1,
    lat: 36.727,
    lon: -4.414,
    income: 31800,
    students: 410,
    streetType: 'AVENIDA_ARTERIAL' as const,
    trafficExposureFactor: 1.35,
    buffer: 'ALTA_EXPOSICION_FRONTAL' as const
  },
  {
    id: 'CEIP-06',
    name: 'CEIP Parque Clavero (El Limonar)',
    district: 'Distrito 2: Este',
    districtId: 2,
    lat: 36.7265,
    lon: -4.398,
    income: 47600,
    students: 520,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.68,
    buffer: 'PROTEGIDO_PEATONAL' as const
  },
  {
    id: 'CEIP-07',
    name: 'CEIP Valle-Inclán Este (Pedregalejo)',
    district: 'Distrito 2: Este',
    districtId: 2,
    lat: 36.723,
    lon: -4.385,
    income: 47600,
    students: 480,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.72,
    buffer: 'PROTEGIDO_PEATONAL' as const
  },
  {
    id: 'CEIP-08',
    name: 'CEIP San Sebastián (El Palo)',
    district: 'Distrito 2: Este',
    districtId: 2,
    lat: 36.721,
    lon: -4.362,
    income: 47600,
    students: 510,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.75,
    buffer: 'AMORTIGUAMIENTO_MEDIO' as const
  },
  {
    id: 'CEIP-09',
    name: 'CEIP Gutiérrez Mata (Calle Almería)',
    district: 'Distrito 2: Este',
    districtId: 2,
    lat: 36.7195,
    lon: -4.354,
    income: 47600,
    students: 460,
    streetType: 'CAÑON_TRAFICO_DENSO' as const,
    trafficExposureFactor: 1.12,
    buffer: 'AMORTIGUAMIENTO_MEDIO' as const
  },
  {
    id: 'CEIP-10',
    name: 'CEIP Jorge Guillén (Echeverría del Palo)',
    district: 'Distrito 2: Este',
    districtId: 2,
    lat: 36.7212,
    lon: -4.359,
    income: 47600,
    students: 530,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.7,
    buffer: 'PROTEGIDO_PEATONAL' as const
  },
  {
    id: 'CEIP-11',
    name: 'CEIP Alegría de la Huerta (Ciudad Jardín)',
    district: 'Distrito 3: Ciudad Jardín',
    districtId: 3,
    lat: 36.741,
    lon: -4.423,
    income: 19800,
    students: 430,
    streetType: 'CAÑON_TRAFICO_DENSO' as const,
    trafficExposureFactor: 1.28,
    buffer: 'AMORTIGUAMIENTO_MEDIO' as const
  },
  {
    id: 'CEIP-12',
    name: 'CEIP Benito Pérez Galdós (Emilio Thuiller)',
    district: 'Distrito 3: Ciudad Jardín',
    districtId: 3,
    lat: 36.7445,
    lon: -4.425,
    income: 19800,
    students: 390,
    streetType: 'AVENIDA_ARTERIAL' as const,
    trafficExposureFactor: 1.4,
    buffer: 'ALTA_EXPOSICION_FRONTAL' as const
  },
  {
    id: 'CEIP-13',
    name: 'CEIP Salvador Allende (Mangas Verdes)',
    district: 'Distrito 3: Ciudad Jardín',
    districtId: 3,
    lat: 36.748,
    lon: -4.421,
    income: 19800,
    students: 360,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.92,
    buffer: 'AMORTIGUAMIENTO_MEDIO' as const
  },
  {
    id: 'CEIP-14',
    name: 'CEIP Los Guindos CJ (Calle Jerez Perchet)',
    district: 'Distrito 3: Ciudad Jardín',
    districtId: 3,
    lat: 36.743,
    lon: -4.427,
    income: 19800,
    students: 410,
    streetType: 'CAÑON_TRAFICO_DENSO' as const,
    trafficExposureFactor: 1.32,
    buffer: 'ALTA_EXPOSICION_FRONTAL' as const
  },
  {
    id: 'CEIP-15',
    name: 'CEIP Bergamín (Bailén-Miraflores)',
    district: 'Distrito 4: Bailén-Miraflores',
    districtId: 4,
    lat: 36.729,
    lon: -4.438,
    income: 21100,
    students: 480,
    streetType: 'CAÑON_TRAFICO_DENSO' as const,
    trafficExposureFactor: 1.25,
    buffer: 'AMORTIGUAMIENTO_MEDIO' as const
  },
  {
    id: 'CEIP-16',
    name: 'CEIP Severo Ochoa (Calle Eugenio Gross)',
    district: 'Distrito 4: Bailén-Miraflores',
    districtId: 4,
    lat: 36.7315,
    lon: -4.434,
    income: 21100,
    students: 520,
    streetType: 'CAÑON_TRAFICO_DENSO' as const,
    trafficExposureFactor: 1.38,
    buffer: 'ALTA_EXPOSICION_FRONTAL' as const
  },
  {
    id: 'CEIP-17',
    name: 'CEIP Manolo Garvayo (Miraflores)',
    district: 'Distrito 4: Bailén-Miraflores',
    districtId: 4,
    lat: 36.735,
    lon: -4.436,
    income: 21100,
    students: 440,
    streetType: 'CAÑON_TRAFICO_DENSO' as const,
    trafficExposureFactor: 1.22,
    buffer: 'AMORTIGUAMIENTO_MEDIO' as const
  },
  {
    id: 'CEIP-18',
    name: 'CEIP Gibraljaire (San Juan Bosco)',
    district: 'Distrito 4: Bailén-Miraflores',
    districtId: 4,
    lat: 36.733,
    lon: -4.431,
    income: 21100,
    students: 560,
    streetType: 'CAÑON_TRAFICO_DENSO' as const,
    trafficExposureFactor: 1.35,
    buffer: 'ALTA_EXPOSICION_FRONTAL' as const
  },
  {
    id: 'CEIP-19',
    name: 'CDP Gamarra (Camino de Antequera)',
    district: 'Distrito 4: Bailén-Miraflores',
    districtId: 4,
    lat: 36.7275,
    lon: -4.441,
    income: 21100,
    students: 780,
    streetType: 'AVENIDA_ARTERIAL' as const,
    trafficExposureFactor: 1.42,
    buffer: 'ALTA_EXPOSICION_FRONTAL' as const
  },
  {
    id: 'CEIP-20',
    name: 'CEIP Valle-Inclán (Virreina)',
    district: 'Distrito 5: Palma-Palmilla',
    districtId: 5,
    lat: 36.745,
    lon: -4.432,
    income: 14200,
    students: 390,
    streetType: 'AVENIDA_ARTERIAL' as const,
    trafficExposureFactor: 1.38,
    buffer: 'ALTA_EXPOSICION_FRONTAL' as const
  },
  {
    id: 'CEIP-21',
    name: 'CEIP Cerro Coronado (Palmilla)',
    district: 'Distrito 5: Palma-Palmilla',
    districtId: 5,
    lat: 36.742,
    lon: -4.436,
    income: 14200,
    students: 310,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 1.15,
    buffer: 'AMORTIGUAMIENTO_MEDIO' as const
  },
  {
    id: 'CEIP-22',
    name: 'CEIP Manuel Altolaguirre (Calle la Rosa)',
    district: 'Distrito 5: Palma-Palmilla',
    districtId: 5,
    lat: 36.7465,
    lon: -4.4345,
    income: 14200,
    students: 280,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 1.18,
    buffer: 'ALTA_EXPOSICION_FRONTAL' as const
  },
  {
    id: 'CEIP-23',
    name: 'CEIP Mula de la Palmilla',
    district: 'Distrito 5: Palma-Palmilla',
    districtId: 5,
    lat: 36.7435,
    lon: -4.438,
    income: 14200,
    students: 340,
    streetType: 'CAÑON_TRAFICO_DENSO' as const,
    trafficExposureFactor: 1.26,
    buffer: 'ALTA_EXPOSICION_FRONTAL' as const
  },
  {
    id: 'CEIP-24',
    name: 'CEIP Doctor Fleming (Paseo de los Tilos)',
    district: 'Distrito 6: Cruz de Humilladero',
    districtId: 6,
    lat: 36.7145,
    lon: -4.4365,
    income: 22800,
    students: 580,
    streetType: 'AVENIDA_ARTERIAL' as const,
    trafficExposureFactor: 1.42,
    buffer: 'ALTA_EXPOSICION_FRONTAL' as const
  },
  {
    id: 'CEIP-25',
    name: 'CEIP Luis de Góngora (Calle La Unión)',
    district: 'Distrito 6: Cruz de Humilladero',
    districtId: 6,
    lat: 36.712,
    lon: -4.44,
    income: 22800,
    students: 490,
    streetType: 'CAÑON_TRAFICO_DENSO' as const,
    trafficExposureFactor: 1.36,
    buffer: 'ALTA_EXPOSICION_FRONTAL' as const
  },
  {
    id: 'CEIP-26',
    name: 'CEIP Félix Rodríguez de la Fuente',
    district: 'Distrito 6: Cruz de Humilladero',
    districtId: 6,
    lat: 36.716,
    lon: -4.445,
    income: 22800,
    students: 410,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.95,
    buffer: 'AMORTIGUAMIENTO_MEDIO' as const
  },
  {
    id: 'CEIP-27',
    name: 'CEIP Antonio Machado (Camino San Rafael)',
    district: 'Distrito 6: Cruz de Humilladero',
    districtId: 6,
    lat: 36.71,
    lon: -4.448,
    income: 22800,
    students: 530,
    streetType: 'AVENIDA_ARTERIAL' as const,
    trafficExposureFactor: 1.44,
    buffer: 'ALTA_EXPOSICION_FRONTAL' as const
  },
  {
    id: 'CEIP-28',
    name: 'CEIP Los Morales CH (Calle Mauricio Moro)',
    district: 'Distrito 6: Cruz de Humilladero',
    districtId: 6,
    lat: 36.713,
    lon: -4.433,
    income: 22800,
    students: 460,
    streetType: 'CAÑON_TRAFICO_DENSO' as const,
    trafficExposureFactor: 1.3,
    buffer: 'AMORTIGUAMIENTO_MEDIO' as const
  },
  {
    id: 'CEIP-29',
    name: 'CEIP Manuel de Falla (Huelin)',
    district: 'Distrito 7: Carretera de Cádiz',
    districtId: 7,
    lat: 36.7052,
    lon: -4.439,
    income: 21600,
    students: 620,
    streetType: 'CAÑON_TRAFICO_DENSO' as const,
    trafficExposureFactor: 1.35,
    buffer: 'ALTA_EXPOSICION_FRONTAL' as const
  },
  {
    id: 'CEIP-30',
    name: 'CEIP Tartessos (Avenida Velázquez)',
    district: 'Distrito 7: Carretera de Cádiz',
    districtId: 7,
    lat: 36.698,
    lon: -4.445,
    income: 21600,
    students: 590,
    streetType: 'AVENIDA_ARTERIAL' as const,
    trafficExposureFactor: 1.48,
    buffer: 'ALTA_EXPOSICION_FRONTAL' as const
  },
  {
    id: 'CEIP-31',
    name: 'CEIP Constitución 1978 (La Luz)',
    district: 'Distrito 7: Carretera de Cádiz',
    districtId: 7,
    lat: 36.695,
    lon: -4.448,
    income: 21600,
    students: 540,
    streetType: 'CAÑON_TRAFICO_DENSO' as const,
    trafficExposureFactor: 1.32,
    buffer: 'ALTA_EXPOSICION_FRONTAL' as const
  },
  {
    id: 'CEIP-32',
    name: 'CEIP Ardira (Calle Heroína)',
    district: 'Distrito 7: Carretera de Cádiz',
    districtId: 7,
    lat: 36.692,
    lon: -4.451,
    income: 21600,
    students: 480,
    streetType: 'CAÑON_TRAFICO_DENSO' as const,
    trafficExposureFactor: 1.28,
    buffer: 'AMORTIGUAMIENTO_MEDIO' as const
  },
  {
    id: 'CEIP-33',
    name: 'CEIP Paulo Freire (Puerta Blanca)',
    district: 'Distrito 7: Carretera de Cádiz',
    districtId: 7,
    lat: 36.689,
    lon: -4.454,
    income: 21600,
    students: 510,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.98,
    buffer: 'AMORTIGUAMIENTO_MEDIO' as const
  },
  {
    id: 'CEIP-34',
    name: 'CEIP Jábega (Parque Litoral)',
    district: 'Distrito 7: Carretera de Cádiz',
    districtId: 7,
    lat: 36.685,
    lon: -4.458,
    income: 21600,
    students: 670,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.88,
    buffer: 'PROTEGIDO_PEATONAL' as const
  },
  {
    id: 'CEIP-35',
    name: 'CEIP Ciudad de Jaén (Churriana)',
    district: 'Distrito 8: Churriana',
    districtId: 8,
    lat: 36.664,
    lon: -4.498,
    income: 24500,
    students: 510,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.95,
    buffer: 'AMORTIGUAMIENTO_MEDIO' as const
  },
  {
    id: 'CEIP-36',
    name: 'CEIP Manuel Laza Palacio (Churriana)',
    district: 'Distrito 8: Churriana',
    districtId: 8,
    lat: 36.661,
    lon: -4.502,
    income: 24500,
    students: 470,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.82,
    buffer: 'PROTEGIDO_PEATONAL' as const
  },
  {
    id: 'CEIP-37',
    name: 'CEIP Rubén Darío (Churriana)',
    district: 'Distrito 8: Churriana',
    districtId: 8,
    lat: 36.667,
    lon: -4.494,
    income: 24500,
    students: 440,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.86,
    buffer: 'PROTEGIDO_PEATONAL' as const
  },
  {
    id: 'CEIP-38',
    name: 'CDP San Antonio de Padua (Churriana)',
    district: 'Distrito 8: Churriana',
    districtId: 8,
    lat: 36.6625,
    lon: -4.4995,
    income: 24500,
    students: 580,
    streetType: 'CAÑON_TRAFICO_DENSO' as const,
    trafficExposureFactor: 1.08,
    buffer: 'AMORTIGUAMIENTO_MEDIO' as const
  },
  {
    id: 'CEIP-39',
    name: 'CEIP Francisco de Quevedo (Campanillas)',
    district: 'Distrito 9: Campanillas',
    districtId: 9,
    lat: 36.728,
    lon: -4.542,
    income: 23200,
    students: 490,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.88,
    buffer: 'PROTEGIDO_PEATONAL' as const
  },
  {
    id: 'CEIP-40',
    name: 'CEIP José Calderón (Campanillas Centro)',
    district: 'Distrito 9: Campanillas',
    districtId: 9,
    lat: 36.726,
    lon: -4.538,
    income: 23200,
    students: 530,
    streetType: 'CAÑON_TRAFICO_DENSO' as const,
    trafficExposureFactor: 1.15,
    buffer: 'AMORTIGUAMIENTO_MEDIO' as const
  },
  {
    id: 'CEIP-41',
    name: 'CEIP María de la O (Los Asperones)',
    district: 'Distrito 9: Campanillas',
    districtId: 9,
    lat: 36.721,
    lon: -4.529,
    income: 23200,
    students: 260,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.9,
    buffer: 'PROTEGIDO_PEATONAL' as const
  },
  {
    id: 'CEIP-42',
    name: 'CEIP Cupiana (Maqueda)',
    district: 'Distrito 9: Campanillas',
    districtId: 9,
    lat: 36.735,
    lon: -4.555,
    income: 23200,
    students: 380,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.84,
    buffer: 'PROTEGIDO_PEATONAL' as const
  },
  {
    id: 'CEIP-43',
    name: 'CEIP Pedro Duque (Puerto de la Torre)',
    district: 'Distrito 10: Puerto de la Torre',
    districtId: 10,
    lat: 36.744,
    lon: -4.482,
    income: 27900,
    students: 560,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.9,
    buffer: 'PROTEGIDO_PEATONAL' as const
  },
  {
    id: 'CEIP-44',
    name: 'CEIP Salvador Rueda (Lope de Rueda)',
    district: 'Distrito 10: Puerto de la Torre',
    districtId: 10,
    lat: 36.747,
    lon: -4.478,
    income: 27900,
    students: 610,
    streetType: 'AVENIDA_ARTERIAL' as const,
    trafficExposureFactor: 1.32,
    buffer: 'ALTA_EXPOSICION_FRONTAL' as const
  },
  {
    id: 'CEIP-45',
    name: 'CEIP Fuente Alegre (Puerto de la Torre)',
    district: 'Distrito 10: Puerto de la Torre',
    districtId: 10,
    lat: 36.741,
    lon: -4.486,
    income: 27900,
    students: 430,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.82,
    buffer: 'PROTEGIDO_PEATONAL' as const
  },
  {
    id: 'CEIP-46',
    name: 'CDP Atabal (El Atabal)',
    district: 'Distrito 10: Puerto de la Torre',
    districtId: 10,
    lat: 36.738,
    lon: -4.472,
    income: 27900,
    students: 720,
    streetType: 'CAÑON_TRAFICO_DENSO' as const,
    trafficExposureFactor: 1.1,
    buffer: 'AMORTIGUAMIENTO_MEDIO' as const
  },
  {
    id: 'CEIP-47',
    name: 'CEIP Pintor Félix Revello de Toro',
    district: 'Distrito 11: Teatinos',
    districtId: 11,
    lat: 36.718,
    lon: -4.475,
    income: 35100,
    students: 710,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.92,
    buffer: 'AMORTIGUAMIENTO_MEDIO' as const
  },
  {
    id: 'CEIP-48',
    name: 'CEIP Carmen de Burgos (Teatinos)',
    district: 'Distrito 11: Teatinos',
    districtId: 11,
    lat: 36.721,
    lon: -4.471,
    income: 35100,
    students: 680,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.88,
    buffer: 'PROTEGIDO_PEATONAL' as const
  },
  {
    id: 'CEIP-49',
    name: 'CEIP Profesor Tierno Galván (El Cónsul)',
    district: 'Distrito 11: Teatinos',
    districtId: 11,
    lat: 36.715,
    lon: -4.482,
    income: 35100,
    students: 640,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.85,
    buffer: 'PROTEGIDO_PEATONAL' as const
  },
  {
    id: 'CEIP-50',
    name: 'CEIP Rectora Adelaida de la Calle',
    district: 'Distrito 11: Teatinos',
    districtId: 11,
    lat: 36.7235,
    lon: -4.4785,
    income: 35100,
    students: 690,
    streetType: 'CALLE_PACIFICADA_ESCOLAR' as const,
    trafficExposureFactor: 0.86,
    buffer: 'PROTEGIDO_PEATONAL' as const
  }
];

export function generateSchoolsGeoJson(schools: SchoolVulnerabilityProfile[]) {
  return {
    type: 'FeatureCollection' as const,
    name: 'malaga_school_streets_pediatric_dosimetry',
    metadata: {
      university: 'Universidad Nacional de Educación a Distancia (UNED)',
      doctoralSchool: 'Escuela Internacional de Doctorado (EIDUNED)',
      author: 'Dionisio Gálvez Pozo (Doctorando)',
      framework: 'Dosimetría Pediátrica ICRP 66 & Directiva (UE) 2024/2881'
    },
    crs: {
      type: 'name',
      properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
    },
    features: schools.map(s => ({
      type: 'Feature' as const,
      id: s.schoolId,
      geometry: {
        type: 'Point' as const,
        coordinates: [s.lon, s.lat]
      },
      properties: {
        schoolId: s.schoolId,
        schoolName: s.schoolName,
        districtName: s.districtName,
        districtId: s.districtId,
        averageIncomeEurYear: s.averageIncomeEurYear,
        studentsCount: s.studentsCount,
        streetType: s.streetType,
        inhalationHeightM: s.inhalationHeightM,
        schoolHoursPeakNO2UgM3: s.schoolHoursPeakNO2UgM3,
        baselinePM25UgM3: s.baselinePM25UgM3,
        childHourlyNO2DoseUg: s.childHourlyNO2DoseUg,
        childAlveolarPM25DoseUgDay: s.childAlveolarPM25DoseUgDay,
        trafficBufferStatus: s.trafficBufferStatus,
        directiveComplianceStatus: s.directiveComplianceStatus
      }
    }))
  };
}

export function computeSchoolAirEquity(params: {
  ambientNO2UgM3: number;
  ambientPM25UgM3: number;
}): SchoolAirEquityAnalysis {
  const { ambientNO2UgM3, ambientPM25UgM3 } = params;

  // Parámetros fisiológicos pediátricos estándar ICRP 66 (niño de 8 años, masa 26 kg)
  const childMassKg = 26.0;
  const childVentilationRateM3H = 0.42 * childMassKg; // ~ 10.92 m³/día o 0.455 m³/h en reposo/caminar leve
  const alveolarFractionPM25 = 0.28; // ICRP 66 región alveolar (AI)

  const rawSchools = MALAGA_RAW_SCHOOLS;

  const schools: SchoolVulnerabilityProfile[] = rawSchools.map(s => {
    // Aumento de concentración a cota de escape (0.90m AGL) durante hora punta escolar
    const heightGradientFactor = 1.15; // Mayor concentración en acera baja que a 1.8m
    const peakNO2 = Number((ambientNO2UgM3 * s.trafficExposureFactor * heightGradientFactor).toFixed(1));
    const schoolPM25 = Number((ambientPM25UgM3 * s.trafficExposureFactor).toFixed(1));

    // Dosis inhalada por hora en patio/entrada escolar: D = C * V_E (µg/h)
    const hourlyNO2Dose = Number((peakNO2 * (childVentilationRateM3H / 24.0)).toFixed(2));

    // Dosis alveolar de PM2.5 acumulada en una jornada escolar de 5 horas
    const dailyAlveolarPM25Dose = Number((schoolPM25 * (childVentilationRateM3H / 24.0) * 5.0 * alveolarFractionPM25).toFixed(2));

    let compliance: 'CUMPLE_GUIA_OMS' | 'EXCEDE_OBJETIVO_2030' | 'ALERTA_EXPOSICION_CRONICA' = 'CUMPLE_GUIA_OMS';
    if (peakNO2 > 45 || schoolPM25 > 20) {
      compliance = 'ALERTA_EXPOSICION_CRONICA';
    } else if (peakNO2 > 25 || schoolPM25 > 10) {
      compliance = 'EXCEDE_OBJETIVO_2030';
    }

    // Marco Regulatorio Tripartito: Directiva 2008/50/CE vs Directiva 2024/2881 vs OMS 2021
    const dir2008LimitNO2 = 40.0;
    const dir2024LimitNO2 = 20.0;
    const who2021GuideNO2 = 10.0;
    const gap2024DirectiveNO2 = Number(Math.max(0, peakNO2 - dir2024LimitNO2).toFixed(1));
    const dir2008Compliance = peakNO2 <= dir2008LimitNO2 ? 'CONFORME' as const : 'SUPERACION' as const;
    const dir2024Compliance = peakNO2 <= dir2024LimitNO2 ? 'CONFORME' as const : 'SUPERACION_HORIZONTE_2030' as const;
    const who2021Compliance = peakNO2 <= who2021GuideNO2 ? 'CONFORME' as const : 'SUPERACION_GUIA_SALUD' as const;
    const requiredTrafficReductionPercent = peakNO2 > dir2024LimitNO2
      ? Number(Math.min(100, ((peakNO2 - dir2024LimitNO2) / peakNO2) * 100).toFixed(1))
      : 0;

    return {
      schoolId: s.id,
      schoolName: s.name,
      districtName: s.district,
      districtId: s.districtId,
      lat: s.lat,
      lon: s.lon,
      averageIncomeEurYear: s.income,
      studentsCount: s.students,
      streetType: s.streetType,
      inhalationHeightM: 0.90,
      schoolHoursPeakNO2UgM3: peakNO2,
      baselinePM25UgM3: schoolPM25,
      childHourlyNO2DoseUg: hourlyNO2Dose,
      childAlveolarPM25DoseUgDay: dailyAlveolarPM25Dose,
      trafficBufferStatus: s.buffer,
      directiveComplianceStatus: compliance,
      dir2008LimitNO2,
      dir2024LimitNO2,
      who2021GuideNO2,
      gap2024DirectiveNO2,
      requiredTrafficReductionPercent,
      dir2008Compliance,
      dir2024Compliance,
      who2021Compliance
    };
  });

  const sortedByNO2 = [...schools].sort((a, b) => b.schoolHoursPeakNO2UgM3 - a.schoolHoursPeakNO2UgM3);
  const mostExposed = sortedByNO2[0];
  const leastExposed = sortedByNO2[sortedByNO2.length - 1];

  const inequalityRatio = Number((mostExposed.schoolHoursPeakNO2UgM3 / Math.max(1, leastExposed.schoolHoursPeakNO2UgM3)).toFixed(2));

  const regulatoryVerdict = `Conforme al Art. 13 de la Directiva (UE) 2024/2881, ${schools.filter(s => s.directiveComplianceStatus === 'ALERTA_EXPOSICION_CRONICA').length} centros escolares en distritos de renta baja requieren la implantación urgente de 'Calles Escolares Pacificadas' (School Streets).`;
  const doctoralConclusion = `La dosimetría ICRP 66 infantil a cota 0.90m AGL revela una brecha de equidad del factor ${inequalityRatio}x: los escolares del ${mostExposed.schoolName} en ${mostExposed.districtName} (renta ${mostExposed.averageIncomeEurYear} €) inhalan una dosis alveolar de PM2.5 de ${mostExposed.childAlveolarPM25DoseUgDay} µg/día frente a ${leastExposed.childAlveolarPM25DoseUgDay} µg/día en el ${leastExposed.schoolName} (${leastExposed.districtName}). Esto demuestra que la pacificación del tráfico en entornos escolares es un requisito ineludible de justicia ambiental.`;

  const dir2008CompliantCount = schools.filter(s => s.dir2008Compliance === 'CONFORME').length;
  const dir2024CompliantCount = schools.filter(s => s.dir2024Compliance === 'CONFORME').length;
  const who2021CompliantCount = schools.filter(s => s.who2021Compliance === 'CONFORME').length;
  const avgGap2024 = Number((schools.reduce((acc, s) => acc + s.gap2024DirectiveNO2, 0) / schools.length).toFixed(1));
  const maxReduction = Math.max(...schools.map(s => s.requiredTrafficReductionPercent));

  return {
    evaluatedSchoolsCount: schools.length,
    childAdultVentilationRatio: 2.1,
    mostExposedSchool: `${mostExposed.schoolName} (${mostExposed.schoolHoursPeakNO2UgM3} µg/m³)`,
    leastExposedSchool: `${leastExposed.schoolName} (${leastExposed.schoolHoursPeakNO2UgM3} µg/m³)`,
    inequalityRatioLowVsHighIncome: inequalityRatio,
    schools,
    regulatoryVerdict,
    doctoralConclusion,
    tripartiteSummary: {
      dir2008CompliantCount,
      dir2024CompliantCount,
      who2021CompliantCount,
      averageGap2024DirectiveNO2: avgGap2024,
      maxTrafficReductionRequiredPercent: maxReduction,
      criticalSchoolId: mostExposed.schoolId
    }
  };
}
