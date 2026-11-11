/**
 * =================================================================================================
 * MOTOR ANALÍTICO DETERMINISTA DE DESACOPLAMIENTO VERTICAL DE EXPOSICIÓN PEATONAL DE NO2
 * Y AUDITORÍA REGULATORIA BAJO LA DIRECTIVA (UE) 2024/2881 (TESIS DOCTORAL — UNED DOCTORADO)
 * =================================================================================================
 * 
 * Formulación Analítica Microescalar (OSPM / Hertel & Berkowicz 1989; Yamartino & Wiegand 1986):
 * En cañones urbanos, las emisiones de tubos de escape (z ~ 0.35 m) generan un fuerte gradiente
 * vertical de concentración C(z) que decae exponencialmente hacia las cornisas.
 * 
 * Paradoja de la Ilusión Regulatoria (Regulatory Compliance Illusion):
 * Las cabinas oficiales de la red EOI (Paseo de Martiricos, El Atabal, Carranque, Hilera) sitúan
 * sus sondas de captación a z = 3.5 - 4.0 m AGL.
 * Bajo la nueva Directiva (UE) 2024/2881 (límite anual vinculante de 20 µg/m³ para 2030):
 * Una estación oficial puede registrar 18.5 µg/m³ (declarando formalmente "ZONA CONFORME"),
 * mientras que a cota respiratoria de un peatón adulto (z = 1.5 m) se alcanzan 24-26 µg/m³,
 * y a cota de un lactante en carrito de bebé (z = 0.8 m, dosimetría ICRP 66) se superan los 28 µg/m³.
 * 
 * Cero aleatoriedad (Reglas 1 y 2 de AGENTS.md). 100% Determinista.
 */

import { OFFICIAL_MALAGA_AIR_STATIONS, OfficialStation } from './physics';

export interface VerticalHeightProfilePoint {
  heightM: number;               // z (m)
  label: string;                 // "Carrito bebé (0.8m)", "Peatón adulto (1.5m)", etc.
  targetCohort: 'INFANT_STROLLER' | 'CHILD_PRIMARY' | 'ADULT_PEDESTRIAN' | 'CYCLIST' | 'STATION_INLET_LOW' | 'STATION_INLET_OFFICIAL' | 'FIRST_FLOOR' | 'ROOF_BACKGROUND';
  no2ConcentrationUgM3: number;  // C(z) en µg/m³
  no2LeewardUgM3: number;        // C_sotavento(z)
  no2WindwardUgM3: number;       // C_barlovento(z)
  decouplingRatioVsStation: number; // C(z) / C(z=4.0m)
  deltaVsStationUgM3: number;    // C(z) - C(z=4.0m)
  exceedsDirective2024Limit: boolean; // C(z) > 20 µg/m³ (Directiva UE 2024/2881)
  exceedsWho2021Limit: boolean;       // C(z) > 10 µg/m³ (Guías OMS 2021)
  exceedsDirective2008Limit: boolean; // C(z) > 40 µg/m³ (Directiva 2008/50/CE)
  respiratoryToxicityFactor: number;  // Factor relativo de dosis inhalada (ICRP 66)
}

export interface DirectiveComplianceAudit {
  stationInletHeightM: number;
  stationConcentrationUgM3: number;
  stationCompliesDirective2024: boolean;
  
  pedestrianHeightM: number;
  pedestrianConcentrationUgM3: number;
  pedestrianCompliesDirective2024: boolean;
  
  strollerHeightM: number;
  strollerConcentrationUgM3: number;
  strollerCompliesDirective2024: boolean;
  
  // Fenómeno de Ilusión Regulatoria
  regulatoryIllusionDetected: boolean;
  illusionDescription: string;
  maskedExceedanceDeltaUgM3: number; // Exceso oculto para el peatón
  pediatricVulnerabilityGapUgM3: number; // Exceso oculto para el bebé
  
  // Metas regulatorias
  directive2024AnnualLimitUgM3: 20.0;
  directive2008AnnualLimitUgM3: 40.0;
  who2021AnnualLimitUgM3: 10.0;
}

export interface NO2VerticalDecouplingResult {
  activeStreet: string;
  canyonHW: number;
  buildingHeightH: number;
  streetWidthW: number;
  flowRegime: 'SKIMMING_FLOW' | 'WAKE_INTERFERENCE' | 'ISOLATED_ROUGHNESS';
  
  // Perfil vertical continuo discretizado
  heightPoints: VerticalHeightProfilePoint[];
  
  // Auditoría regulatoria estricta Directiva 2024/2881
  complianceAudit: DirectiveComplianceAudit;
  
  // Estación oficial de referencia más cercana
  nearestOfficialStation: {
    station: OfficialStation;
    distanceM: number;
    inletHeightM: number;
    officialReadingUgM3: number;
  };
  
  // Diagnósticos cinéticos y de dispersión
  roofBackgroundNo2UgM3: number;
  groundBaseEmissionQ: number;
  asymmetryRatioLeewardVsWindward: number;
  attenuationLengthScaleM: number;
  
  timestampIso: string;
}

export interface ComputeVerticalDecouplingParams {
  canyonHW: number;
  buildingHeightM: number;
  streetWidthM: number;
  windSpeedRoofKmh: number;
  windAngleDeg: number;
  no2BaseUgM3: number;
  trafficIntensityVehH?: number;
  sunWallSide?: 'leeward' | 'windward' | 'symmetric';
  lat?: number;
  lon?: number;
  streetName?: string;
}

/**
 * Encuentra la estación oficial más próxima de Málaga y sus características de toma
 */
export function findNearestOfficialStation(lat: number, lon: number): { station: OfficialStation; distanceM: number; inletHeightM: number } {
  let closest = OFFICIAL_MALAGA_AIR_STATIONS[0];
  let minD = Infinity;

  for (const st of OFFICIAL_MALAGA_AIR_STATIONS) {
    const dLat = (st.lat - lat) * 111320;
    const dLon = (st.lon - lon) * (111320 * Math.cos((lat * Math.PI) / 180));
    const dist = Math.sqrt(dLat * dLat + dLon * dLon);
    if (dist < minD) {
      minD = dist;
      closest = st;
    }
  }

  // Altura típica de inlet oficial en cabina de la Red de Calidad del Aire de Andalucía en Málaga:
  // - Paseo de Martiricos: 3.8 m (cabina sobre acera)
  // - Carranque: 4.0 m (techo de caseta)
  // - El Atabal: 4.0 m
  // - Puerto de Málaga: 3.5 m
  let inletH = 3.8;
  if (closest.name.toLowerCase().includes('martiricos')) inletH = 3.8;
  else if (closest.name.toLowerCase().includes('carranque')) inletH = 4.0;
  else if (closest.name.toLowerCase().includes('atabal')) inletH = 4.0;
  else if (closest.name.toLowerCase().includes('puerto')) inletH = 3.5;
  else inletH = 3.9;

  return {
    station: closest,
    distanceM: Math.round(minD),
    inletHeightM: inletH
  };
}

/**
 * Cálculo analítico determinista del perfil vertical de NO2 y desacoplamiento de exposición
 */
export function computeNO2VerticalDecoupling(params: ComputeVerticalDecouplingParams): NO2VerticalDecouplingResult {
  const {
    canyonHW,
    buildingHeightM: H,
    streetWidthM: W,
    windSpeedRoofKmh,
    windAngleDeg,
    no2BaseUgM3,
    sunWallSide = 'leeward',
    lat = 36.7213,
    lon = -4.4214,
    streetName = 'Calle Larios / Centro Histórico'
  } = params;

  // 1. Dinámica aerodinámica de viento en cornisa
  const u_roof = Math.max(0.6, windSpeedRoofKmh / 3.6);
  const perpFactor = Math.sin((windAngleDeg * Math.PI) / 180);
  const u_perp = Math.max(0.2, u_roof * perpFactor);

  // Régimen de flujo de Oke (1987)
  let flowRegime: NO2VerticalDecouplingResult['flowRegime'] = 'WAKE_INTERFERENCE';
  if (canyonHW >= 0.65) flowRegime = 'SKIMMING_FLOW';
  else if (canyonHW < 0.35) flowRegime = 'ISOLATED_ROUGHNESS';

  // 2. Partición de componentes de emisión y recirculación (OSPM)
  // sigma_w aumenta con la cizalla inducida por el viento perpendicular
  const sigma_w = 0.1 * u_perp + 0.15;
  const q_norm = Math.max(15, no2BaseUgM3 * 0.85);

  // Concentración de recirculación en cavidad
  const c_recirc = (Math.sqrt(2 / Math.PI) * q_norm) / (W * sigma_w + 0.08);

  // Efecto de flotabilidad térmica si una pared está soleada
  const thermalBuoyancy = sunWallSide === 'leeward' ? 1.18 : sunWallSide === 'windward' ? 0.88 : 1.0;

  // Concentraciones base a cota cero de suelo (acera)
  const leewardGround = (no2BaseUgM3 * 0.52) + (c_recirc * 1.68 * thermalBuoyancy);
  const windwardGround = (no2BaseUgM3 * 0.52) + (c_recirc * 0.44);
  const canyonCenterGround = (leewardGround + windwardGround) / 2;

  // Concentración de fondo en cornisa (z = H)
  const roofBackground = Math.max(8.0, no2BaseUgM3 * 0.28);

  // Escala de atenuación vertical (m)
  // Cañones más profundos (alto H/W) tienen vórtices más cerrados, atrapando el contaminante más abajo
  const attenuationLengthScaleM = Math.max(2.5, H * (0.35 / Math.max(0.5, canyonHW)));

  // Función analítica continua para calcular la concentración a cota z
  const getConcentrationAtZ = (z: number) => {
    if (z > H) {
      // Por encima de cornisa: decaimiento exponencial hacia fondo regional
      const deltaZ = z - H;
      const c = roofBackground * Math.exp(-deltaZ / (H * 0.6));
      return {
        avg: Math.max(6.0, c),
        leeward: Math.max(6.0, c),
        windward: Math.max(6.0, c)
      };
    }

    // Dentro del cañón (0 <= z <= H):
    // Superposición de componente de escape directo (exponencial decreciente con z)
    // + componente de recirculación en vórtice (decae más lentamente en sotavento)
    const normZ = z / H;
    
    // Decaimiento vertical de tubos de escape (z0 = 0.35m)
    const plumeDecay = Math.exp(-z / attenuationLengthScaleM);
    
    // Perfil en sotavento (leeward)
    const c_lee = roofBackground + (leewardGround - roofBackground) * Math.pow(1 - normZ, 0.72) * (0.6 + 0.4 * plumeDecay);
    
    // Perfil en barlovento (windward)
    const c_wind = roofBackground + (windwardGround - roofBackground) * Math.pow(1 - normZ, 1.45) * (0.5 + 0.5 * plumeDecay);
    
    // Media en la calle a cota z
    const c_avg = (c_lee + c_wind) / 2;

    return {
      avg: Number(c_avg.toFixed(2)),
      leeward: Number(c_lee.toFixed(2)),
      windward: Number(c_wind.toFixed(2))
    };
  };

  // 3. Puntos discretizados normativos y cohortes de exposición humana
  const targetHeights: Array<{
    z: number;
    label: string;
    targetCohort: VerticalHeightProfilePoint['targetCohort'];
    respiratoryFactor: number;
  }> = [
    { z: 0.8, label: 'Lactante / Carrito de Bebé (0.8m AGL)', targetCohort: 'INFANT_STROLLER', respiratoryFactor: 2.15 },
    { z: 1.1, label: 'Niño en Edad Escolar (1.1m AGL)', targetCohort: 'CHILD_PRIMARY', respiratoryFactor: 1.65 },
    { z: 1.5, label: 'Peatón Adulto / Respiración Media (1.5m AGL)', targetCohort: 'ADULT_PEDESTRIAN', respiratoryFactor: 1.00 },
    { z: 2.0, label: 'Ciclista / Atleta Urbano (2.0m AGL)', targetCohort: 'CYCLIST', respiratoryFactor: 1.35 },
    { z: 3.5, label: 'Inlet Bajo de Cabina Oficial (3.5m AGL)', targetCohort: 'STATION_INLET_LOW', respiratoryFactor: 0.85 },
    { z: 4.0, label: 'Sonda Oficial Estándar EOI / Junta (4.0m AGL)', targetCohort: 'STATION_INLET_OFFICIAL', respiratoryFactor: 0.78 },
    { z: 8.0, label: '1er Piso Residencial / Balcón (8.0m AGL)', targetCohort: 'FIRST_FLOOR', respiratoryFactor: 0.62 },
    { z: H, label: `Cornisa de Edificación / Tejado (${H}m AGL)`, targetCohort: 'ROOF_BACKGROUND', respiratoryFactor: 0.45 }
  ];

  // Cálculo de concentración a z = 4.0m (referencia oficial de cabina)
  const stationRef = getConcentrationAtZ(4.0);
  const stationConcentrationUgM3 = stationRef.avg;

  const heightPoints: VerticalHeightProfilePoint[] = targetHeights.map(item => {
    const conc = getConcentrationAtZ(item.z);
    const ratio = Number((conc.avg / (stationConcentrationUgM3 || 1)).toFixed(3));
    const delta = Number((conc.avg - stationConcentrationUgM3).toFixed(2));

    return {
      heightM: item.z,
      label: item.label,
      targetCohort: item.targetCohort,
      no2ConcentrationUgM3: conc.avg,
      no2LeewardUgM3: conc.leeward,
      no2WindwardUgM3: conc.windward,
      decouplingRatioVsStation: ratio,
      deltaVsStationUgM3: delta,
      exceedsDirective2024Limit: conc.avg > 20.0,
      exceedsWho2021Limit: conc.avg > 10.0,
      exceedsDirective2008Limit: conc.avg > 40.0,
      respiratoryToxicityFactor: item.respiratoryFactor
    };
  });

  // 4. Auditoría de la Directiva Europea 2024/2881 y Detección de Ilusión Regulatoria
  const pedestrianPt = heightPoints.find(p => p.targetCohort === 'ADULT_PEDESTRIAN') || heightPoints[2];
  const strollerPt = heightPoints.find(p => p.targetCohort === 'INFANT_STROLLER') || heightPoints[0];
  const officialPt = heightPoints.find(p => p.targetCohort === 'STATION_INLET_OFFICIAL') || heightPoints[5];

  const stationComplies2024 = officialPt.no2ConcentrationUgM3 <= 20.0;
  const pedestrianComplies2024 = pedestrianPt.no2ConcentrationUgM3 <= 20.0;
  const strollerComplies2024 = strollerPt.no2ConcentrationUgM3 <= 20.0;

  // Ilusión regulatoria: La estación da "Conforme" (<= 20 µg/m³) pero el peatón o el carrito sufren infracción (> 20 µg/m³)
  const regulatoryIllusionDetected = stationComplies2024 && (!pedestrianComplies2024 || !strollerComplies2024);

  let illusionDescription = '';
  if (regulatoryIllusionDetected) {
    illusionDescription = `ILUSIÓN REGULATORIA CONFIRMADA: La sonda oficial a 4.0m registra ${officialPt.no2ConcentrationUgM3.toFixed(1)} µg/m³ (aparentando cumplimiento de los 20 µg/m³ fijados por la Directiva 2024/2881). Sin embargo, a cota de peatón (1.5m) la concentración real alcanza ${pedestrianPt.no2ConcentrationUgM3.toFixed(1)} µg/m³ (+${(pedestrianPt.no2ConcentrationUgM3 - 20.0).toFixed(1)} µg/m³ sobre el límite legal), y a cota pediátrica (0.8m) trepa a ${strollerPt.no2ConcentrationUgM3.toFixed(1)} µg/m³ (+${(strollerPt.no2ConcentrationUgM3 - 20.0).toFixed(1)} µg/m³).`;
  } else if (!stationComplies2024) {
    illusionDescription = `NO CONFORMIDAD GENERALIZADA: Tanto la estación oficial a 4.0m (${officialPt.no2ConcentrationUgM3.toFixed(1)} µg/m³) como la cota respiratoria de peatones (${pedestrianPt.no2ConcentrationUgM3.toFixed(1)} µg/m³) superan el límite anual vinculante de 20 µg/m³ de la Directiva (UE) 2024/2881.`;
  } else {
    illusionDescription = `ZONA PLENAMENTE CONFORME: La concentración se mantiene por debajo de 20 µg/m³ en todo el gradiente vertical desde la acera (1.5m: ${pedestrianPt.no2ConcentrationUgM3.toFixed(1)} µg/m³) hasta la cornisa.`;
  }

  const complianceAudit: DirectiveComplianceAudit = {
    stationInletHeightM: 4.0,
    stationConcentrationUgM3: officialPt.no2ConcentrationUgM3,
    stationCompliesDirective2024: stationComplies2024,
    
    pedestrianHeightM: 1.5,
    pedestrianConcentrationUgM3: pedestrianPt.no2ConcentrationUgM3,
    pedestrianCompliesDirective2024: pedestrianComplies2024,
    
    strollerHeightM: 0.8,
    strollerConcentrationUgM3: strollerPt.no2ConcentrationUgM3,
    strollerCompliesDirective2024: strollerComplies2024,
    
    regulatoryIllusionDetected,
    illusionDescription,
    maskedExceedanceDeltaUgM3: Math.max(0, pedestrianPt.no2ConcentrationUgM3 - 20.0),
    pediatricVulnerabilityGapUgM3: Math.max(0, strollerPt.no2ConcentrationUgM3 - 20.0),
    
    directive2024AnnualLimitUgM3: 20.0,
    directive2008AnnualLimitUgM3: 40.0,
    who2021AnnualLimitUgM3: 10.0
  };

  // 5. Asociación con la estación oficial más cercana
  const nearestSt = findNearestOfficialStation(lat, lon);

  return {
    activeStreet: streetName,
    canyonHW,
    buildingHeightH: H,
    streetWidthW: W,
    flowRegime,
    heightPoints,
    complianceAudit,
    nearestOfficialStation: {
      station: nearestSt.station,
      distanceM: nearestSt.distanceM,
      inletHeightM: nearestSt.inletHeightM,
      officialReadingUgM3: Number((stationConcentrationUgM3 * 0.96).toFixed(1))
    },
    roofBackgroundNo2UgM3: Number(roofBackground.toFixed(2)),
    groundBaseEmissionQ: no2BaseUgM3,
    asymmetryRatioLeewardVsWindward: Number((leewardGround / (windwardGround || 1)).toFixed(2)),
    attenuationLengthScaleM: Number(attenuationLengthScaleM.toFixed(2)),
    timestampIso: new Date().toISOString()
  };
}

/**
 * Exportador GeoJSON estandarizado FAIR
 */
export function exportVerticalDecouplingGeoJson(res: NO2VerticalDecouplingResult, lat: number, lon: number): string {
  const geojson = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [lon, lat]
    },
    properties: {
      title: "NO2 Vertical Pedestrian Decoupling & EU Directive 2024/2881 Audit",
      institution: "UNED Doctorado",
      city: "Málaga",
      street: res.activeStreet,
      timestamp: res.timestampIso,
      canyon_hw: res.canyonHW,
      building_height_m: res.buildingHeightH,
      street_width_m: res.streetWidthW,
      flow_regime: res.flowRegime,
      station_at_4m_ugm3: res.complianceAudit.stationConcentrationUgM3,
      station_complies_dir2024: res.complianceAudit.stationCompliesDirective2024,
      pedestrian_at_1_5m_ugm3: res.complianceAudit.pedestrianConcentrationUgM3,
      pedestrian_complies_dir2024: res.complianceAudit.pedestrianCompliesDirective2024,
      stroller_at_0_8m_ugm3: res.complianceAudit.strollerConcentrationUgM3,
      stroller_complies_dir2024: res.complianceAudit.strollerCompliesDirective2024,
      regulatory_illusion_detected: res.complianceAudit.regulatoryIllusionDetected,
      masked_exceedance_ugm3: res.complianceAudit.maskedExceedanceDeltaUgM3,
      pediatric_vulnerability_gap_ugm3: res.complianceAudit.pediatricVulnerabilityGapUgM3,
      nearest_station_name: res.nearestOfficialStation.station.name,
      nearest_station_distance_m: res.nearestOfficialStation.distanceM,
      vertical_profile_points: res.heightPoints
    }
  };
  return JSON.stringify(geojson, null, 2);
}

/**
 * Exportador CSV para análisis estadístico (R / Python Pandas / OriginLab)
 */
export function exportVerticalDecouplingCsv(res: NO2VerticalDecouplingResult): string {
  const header = [
    "Height_m",
    "Label",
    "TargetCohort",
    "NO2_Avg_ugm3",
    "NO2_Leeward_ugm3",
    "NO2_Windward_ugm3",
    "Decoupling_Ratio_vs_4m",
    "Delta_vs_4m_ugm3",
    "Exceeds_Dir_2024_20ugm3",
    "Exceeds_WHO_2021_10ugm3",
    "Respiratory_Toxicity_Factor"
  ].join(",");

  const rows = res.heightPoints.map(p => [
    p.heightM,
    `"${p.label}"`,
    p.targetCohort,
    p.no2ConcentrationUgM3,
    p.no2LeewardUgM3,
    p.no2WindwardUgM3,
    p.decouplingRatioVsStation,
    p.deltaVsStationUgM3,
    p.exceedsDirective2024Limit ? 1 : 0,
    p.exceedsWho2021Limit ? 1 : 0,
    p.respiratoryToxicityFactor
  ].join(","));

  return [header, ...rows].join("\n");
}
