/**
 * Evaluación de Geometría de Cañón Urbano (H/W Aspect Ratio) y Vórtices de Recirculación.
 * Clasificación de Régimen de Flujo de Oke (1987) e Índice de Ventilabilidad de Calles de Málaga.
 * Tesis Doctoral: Gemelo Digital de Málaga.
 * 
 * Marco Teórico y Ecuaciones Fundamentales:
 * 1. Regímenes de Flujo según T.R. Oke (1987) & Grimmond & Oke (1999):
 *    - Flujo de Rugosidad Aislada (Isolated Roughness Flow): H/W < 0.30.
 *      Los edificios están lo suficientemente separados para que las estelas de barlovento
 *      y sotavento no interactúen. Dispersión libre, ventilación directa a nivel de acera.
 *    - Flujo de Interferencia de Estelas (Wake Interference Flow): 0.30 <= H/W < 0.65.
 *      La estela descendente del edificio de barlovento impacta en la fachada opuesta antes
 *      de alcanzar el asfalto. Turbulencia intermedia, ventilación moderada.
 *    - Flujo Rasante de Cavidad (Skimming Flow): H/W >= 0.65.
 *      El flujo sobre las cornisas se desacopla del fondo de la calle, formando un vórtice
 *      cerrado de recirculación que atrapa contaminantes (NOx, PM) en la acera de sotavento.
 * 
 * 2. Dinámica del Vórtice y Ventilación (Yamartino & Wiegand 1986; Berkowicz 2000; Soulhac et al. 2008):
 *    - Componente perpendicular del viento: U_perp = U_roof * |sin(θ_wind - θ_street)|
 *    - Fluctuation de turbulencia vertical en cornisa: σ_w = 0.10 * U_perp + 0.15 (m/s)
 *    - Tasa de intercambio turbulento: q_exch = σ_w * W (m²/s por metro lineal)
 *    - Tiempo de residencia del aire: τ_res = (H * W) / q_exch = H / σ_w (s)
 *    - Renovaciones de aire por hora: ACH = 3600 / τ_res (h⁻¹)
 *    - Asimetría de concentración acera sotavento/barlovento: C_lee / C_wind
 *    - Factor de vista del cielo (Sky View Factor): SVF = cos(arctan(2 * H / W))
 */

export type OkeRegimeCode = 'ISOLATED_ROUGHNESS' | 'WAKE_INTERFERENCE' | 'SKIMMING_FLOW';

export interface StreetCanyonGeometryProfile {
  streetId: string;
  streetName: string;
  district: string;
  lat: number;
  lon: number;
  avgBuildingHeightM: number; // H
  streetWidthM: number; // W
  aspectRatioHW: number; // H/W
  skyViewFactorSVF: number; // SVF [0, 1]
  streetOrientationDeg: number; // Orientación geográfica respecto al Norte (0-180°)
  okeFlowRegime: 'Flujo_Aislado' | 'Estela_Interaccion' | 'Flujo_Cavidad_Skimming';
  regimeCode: OkeRegimeCode;
  vortexCirculationSpeedMs: number; // Velocidad del vórtice en sotavento (m/s)
  airResidenceTimeSec: number; // Tiempo de residencia medio del aire τ_res (s)
  airChangesPerHourACH: number; // Tasa de renovación horaria ACH (h⁻¹)
  leewardToWindwardPollutantRatio: number; // Factor de asimetría C_lee / C_wind
  ventilationCapacityScore: number; // 0 (bloqueo total / atrapamiento) a 10 (ventilación óptima)
  criticalHotspotNote: string;
}

export const MALAGA_STREET_CANYONS_GEOMETRY: StreetCanyonGeometryProfile[] = [
  {
    streetId: 'CNY-MGA-01',
    streetName: 'Calle Marqués de Larios',
    district: 'Centro Histórico',
    lat: 36.7185,
    lon: -4.4213,
    avgBuildingHeightM: 22.5,
    streetWidthM: 11.2,
    aspectRatioHW: 2.01,
    skyViewFactorSVF: 0.24,
    streetOrientationDeg: 180, // Norte-Sur
    okeFlowRegime: 'Flujo_Cavidad_Skimming',
    regimeCode: 'SKIMMING_FLOW',
    vortexCirculationSpeedMs: 0.42,
    airResidenceTimeSec: 62.5,
    airChangesPerHourACH: 57.6,
    leewardToWindwardPollutantRatio: 3.25,
    ventilationCapacityScore: 3.2,
    criticalHotspotNote: 'Cañón profundo peatonalizado (H/W > 2). Vórtice estable cerrado con atrapamiento de NOx en sotavento bajo vientos transversales de Poniente/Levante.'
  },
  {
    streetId: 'CNY-MGA-02',
    streetName: 'Calle Carretería',
    district: 'Centro Histórico',
    lat: 36.7235,
    lon: -4.4230,
    avgBuildingHeightM: 18.0,
    streetWidthM: 9.0,
    aspectRatioHW: 2.00,
    skyViewFactorSVF: 0.24,
    streetOrientationDeg: 90, // Este-Oeste
    okeFlowRegime: 'Flujo_Cavidad_Skimming',
    regimeCode: 'SKIMMING_FLOW',
    vortexCirculationSpeedMs: 0.38,
    airResidenceTimeSec: 54.5,
    airChangesPerHourACH: 66.1,
    leewardToWindwardPollutantRatio: 2.95,
    ventilationCapacityScore: 3.6,
    criticalHotspotNote: 'Cañón estrecho con tráfico rodado continuo y fachadas históricas continuas sin retranqueos. Lenta evacuación de partículas finas.'
  },
  {
    streetId: 'CNY-MGA-03',
    streetName: 'Calle Nueva',
    district: 'Centro Histórico',
    lat: 36.7202,
    lon: -4.4232,
    avgBuildingHeightM: 16.5,
    streetWidthM: 6.8,
    aspectRatioHW: 2.43,
    skyViewFactorSVF: 0.20,
    streetOrientationDeg: 160,
    okeFlowRegime: 'Flujo_Cavidad_Skimming',
    regimeCode: 'SKIMMING_FLOW',
    vortexCirculationSpeedMs: 0.28,
    airResidenceTimeSec: 72.0,
    airChangesPerHourACH: 50.0,
    leewardToWindwardPollutantRatio: 3.60,
    ventilationCapacityScore: 2.5,
    criticalHotspotNote: 'Hiper-cañón medieval estrecho (H/W = 2.43). Desacoplamiento eólico casi total de la atmósfera sinóptica.'
  },
  {
    streetId: 'CNY-MGA-04',
    streetName: 'Calle Victoria',
    district: 'Centro / Lagunillas',
    lat: 36.7262,
    lon: -4.4145,
    avgBuildingHeightM: 19.5,
    streetWidthM: 10.5,
    aspectRatioHW: 1.86,
    skyViewFactorSVF: 0.26,
    streetOrientationDeg: 45, // NE-SW
    okeFlowRegime: 'Flujo_Cavidad_Skimming',
    regimeCode: 'SKIMMING_FLOW',
    vortexCirculationSpeedMs: 0.44,
    airResidenceTimeSec: 55.7,
    airChangesPerHourACH: 64.6,
    leewardToWindwardPollutantRatio: 2.65,
    ventilationCapacityScore: 4.1,
    criticalHotspotNote: 'Eje de acceso de alta densidad de autobuses EMT y taxis. Atrapamiento matutino de NO2 a cota de respiración peatonal.'
  },
  {
    streetId: 'CNY-MGA-05',
    streetName: 'Calle Hilera',
    district: 'Centro / Cruz de Humilladero',
    lat: 36.7198,
    lon: -4.4320,
    avgBuildingHeightM: 24.0,
    streetWidthM: 18.0,
    aspectRatioHW: 1.33,
    skyViewFactorSVF: 0.35,
    streetOrientationDeg: 90, // Este-Oeste
    okeFlowRegime: 'Flujo_Cavidad_Skimming',
    regimeCode: 'SKIMMING_FLOW',
    vortexCirculationSpeedMs: 0.65,
    airResidenceTimeSec: 48.0,
    airChangesPerHourACH: 75.0,
    leewardToWindwardPollutantRatio: 2.10,
    ventilationCapacityScore: 5.4,
    criticalHotspotNote: 'Cercana a la estación de control oficial de Hilera. Skimming moderado con fuerte asimetría norte-sur en episodios de Terral.'
  },
  {
    streetId: 'CNY-MGA-06',
    streetName: 'Calle Mármoles',
    district: 'Bailén-Miraflores',
    lat: 36.7215,
    lon: -4.4290,
    avgBuildingHeightM: 21.0,
    streetWidthM: 16.0,
    aspectRatioHW: 1.31,
    skyViewFactorSVF: 0.36,
    streetOrientationDeg: 95,
    okeFlowRegime: 'Flujo_Cavidad_Skimming',
    regimeCode: 'SKIMMING_FLOW',
    vortexCirculationSpeedMs: 0.62,
    airResidenceTimeSec: 46.5,
    airChangesPerHourACH: 77.4,
    leewardToWindwardPollutantRatio: 2.05,
    ventilationCapacityScore: 5.6,
    criticalHotspotNote: 'Arteria de tráfico denso hacia la zona norte. Vórtice cerrado con retención de emisiones diésel a nivel de acera.'
  },
  {
    streetId: 'CNY-MGA-07',
    streetName: 'Avenida Juan XXIII',
    district: 'Cruz de Humilladero / Carretera de Cádiz',
    lat: 36.7088,
    lon: -4.4428,
    avgBuildingHeightM: 28.5,
    streetWidthM: 30.0,
    aspectRatioHW: 0.95,
    skyViewFactorSVF: 0.46,
    streetOrientationDeg: 165, // NNW-SSE
    okeFlowRegime: 'Flujo_Cavidad_Skimming',
    regimeCode: 'SKIMMING_FLOW',
    vortexCirculationSpeedMs: 0.88,
    airResidenceTimeSec: 42.0,
    airChangesPerHourACH: 85.7,
    leewardToWindwardPollutantRatio: 1.85,
    ventilationCapacityScore: 6.5,
    criticalHotspotNote: 'Cañón arterial de 6 carriles (~28.000 veh/día). Frontera entre skimming y estela con recirculación turbulenta intermitente.'
  },
  {
    streetId: 'CNY-MGA-08',
    streetName: 'Avenida de Velázquez',
    district: 'Carretera de Cádiz',
    lat: 36.6980,
    lon: -4.4485,
    avgBuildingHeightM: 28.0,
    streetWidthM: 34.0,
    aspectRatioHW: 0.82,
    skyViewFactorSVF: 0.52,
    streetOrientationDeg: 45, // SW-NE
    okeFlowRegime: 'Flujo_Cavidad_Skimming',
    regimeCode: 'SKIMMING_FLOW',
    vortexCirculationSpeedMs: 0.95,
    airResidenceTimeSec: 38.5,
    airChangesPerHourACH: 93.5,
    leewardToWindwardPollutantRatio: 1.65,
    ventilationCapacityScore: 7.0,
    criticalHotspotNote: 'Avenida ancha con tráfico intenso. Skimming suave: el viento incidente a 45° genera canalización helicoidal longitudinal.'
  },
  {
    streetId: 'CNY-MGA-09',
    streetName: 'Alameda Principal',
    district: 'Centro Histórico',
    lat: 36.7175,
    lon: -4.4235,
    avgBuildingHeightM: 26.0,
    streetWidthM: 44.0,
    aspectRatioHW: 0.59,
    skyViewFactorSVF: 0.65,
    streetOrientationDeg: 90, // Este-Oeste
    okeFlowRegime: 'Estela_Interaccion',
    regimeCode: 'WAKE_INTERFERENCE',
    vortexCirculationSpeedMs: 1.25,
    airResidenceTimeSec: 28.0,
    airChangesPerHourACH: 128.6,
    leewardToWindwardPollutantRatio: 1.25,
    ventilationCapacityScore: 8.4,
    criticalHotspotNote: 'Bulevar arbolado amplio con H/W < 0.65. Régimen de interferencia de estelas con renovación de aire muy favorable impulsada por brisa marina.'
  },
  {
    streetId: 'CNY-MGA-10',
    streetName: 'Paseo del Parque',
    district: 'Centro Histórico',
    lat: 36.7188,
    lon: -4.4150,
    avgBuildingHeightM: 22.0,
    streetWidthM: 38.0,
    aspectRatioHW: 0.58,
    skyViewFactorSVF: 0.66,
    streetOrientationDeg: 90,
    okeFlowRegime: 'Estela_Interaccion',
    regimeCode: 'WAKE_INTERFERENCE',
    vortexCirculationSpeedMs: 1.30,
    airResidenceTimeSec: 24.5,
    airChangesPerHourACH: 146.9,
    leewardToWindwardPollutantRatio: 1.20,
    ventilationCapacityScore: 8.8,
    criticalHotspotNote: 'Frente marítimo con parque botánico lateral. Estructura asimétrica que favorece la dispersión libre hacia la bahía de Málaga.'
  },
  {
    streetId: 'CNY-MGA-11',
    streetName: 'Bulevar Louis Pasteur',
    district: 'Teatinos-Universidad',
    lat: 36.7160,
    lon: -4.4715,
    avgBuildingHeightM: 21.0,
    streetWidthM: 48.0,
    aspectRatioHW: 0.44,
    skyViewFactorSVF: 0.75,
    streetOrientationDeg: 90,
    okeFlowRegime: 'Estela_Interaccion',
    regimeCode: 'WAKE_INTERFERENCE',
    vortexCirculationSpeedMs: 1.45,
    airResidenceTimeSec: 21.0,
    airChangesPerHourACH: 171.4,
    leewardToWindwardPollutantRatio: 1.12,
    ventilationCapacityScore: 9.3,
    criticalHotspotNote: 'Traza urbana contemporánea con amplios retranqueos. Interferencia leve de estelas y excelente ventilación natural.'
  },
  {
    streetId: 'CNY-MGA-12',
    streetName: 'Avenida Manuel Agustín Heredia',
    district: 'Centro / Puerto',
    lat: 36.7145,
    lon: -4.4250,
    avgBuildingHeightM: 24.0,
    streetWidthM: 52.0,
    aspectRatioHW: 0.46,
    skyViewFactorSVF: 0.73,
    streetOrientationDeg: 90,
    okeFlowRegime: 'Estela_Interaccion',
    regimeCode: 'WAKE_INTERFERENCE',
    vortexCirculationSpeedMs: 1.50,
    airResidenceTimeSec: 22.0,
    airChangesPerHourACH: 163.6,
    leewardToWindwardPollutantRatio: 1.15,
    ventilationCapacityScore: 9.1,
    criticalHotspotNote: 'Fachada portuaria norte. El viento de Levante/Poniente fluye sin obstáculos y la brisa marina ventila continuamente la calzada.'
  },
  {
    streetId: 'CNY-MGA-13',
    streetName: 'Autovía del Guadalhorce (MA-20)',
    district: 'Campanillas / Guadalhorce',
    lat: 36.6950,
    lon: -4.4750,
    avgBuildingHeightM: 8.0,
    streetWidthM: 45.0,
    aspectRatioHW: 0.18,
    skyViewFactorSVF: 0.94,
    streetOrientationDeg: 135,
    okeFlowRegime: 'Flujo_Aislado',
    regimeCode: 'ISOLATED_ROUGHNESS',
    vortexCirculationSpeedMs: 2.10,
    airResidenceTimeSec: 9.5,
    airChangesPerHourACH: 378.9,
    leewardToWindwardPollutantRatio: 1.02,
    ventilationCapacityScore: 9.9,
    criticalHotspotNote: 'Corredor periurbano abierto (H/W < 0.30). Régimen de rugosidad aislada con dispersión gaussiana pura sin atrapamiento de vórtice.'
  }
];

export interface StreetVortexDynamicsResult {
  aspectRatioHW: number;
  skyViewFactorSVF: number;
  regime: 'Flujo_Aislado' | 'Estela_Interaccion' | 'Flujo_Cavidad_Skimming';
  regimeCode: OkeRegimeCode;
  regimeLabel: string;
  regimeDescription: string;
  uPerpMs: number;
  uParallelMs: number;
  sigmaWMs: number; // m/s
  qExchM2s: number; // m²/s
  tauResSec: number; // segundos
  tauResMin: number; // minutos
  achPerHour: number; // h⁻¹
  vVortexMs: number; // m/s
  ratioLeeward: number; // C_lee / C_wind
  ventilationScore: number; // 0-10
  isTrappingSevere: boolean;
  verdict: string;
}

/**
 * Calcula la hidrodinámica completa del cañón urbano según Oke (1987) y Yamartino & Wiegand (1986).
 */
export function calculateStreetVortexDynamics(
  heightM: number,
  widthM: number,
  uRoofMs: number,
  windAngleRelDeg: number = 90
): StreetVortexDynamicsResult {
  const hw = heightM / Math.max(1, widthM);
  
  // Sky View Factor analítico en cañón 2D simétrico
  const angleRad = Math.atan((2 * heightM) / Math.max(1, widthM));
  const svf = Math.cos(angleRad);
  
  // Clasificación de Oke (1987)
  let regime: 'Flujo_Aislado' | 'Estela_Interaccion' | 'Flujo_Cavidad_Skimming' = 'Flujo_Aislado';
  let regimeCode: OkeRegimeCode = 'ISOLATED_ROUGHNESS';
  let regimeLabel = 'Flujo de Rugosidad Aislada (Isolated Roughness Flow)';
  let regimeDescription = 'Espaciado amplio: Las estelas no interactúan entre aceras. Ventilación natural directa sin formación de vórtice cerrado.';
  
  if (hw < 0.30) {
    regime = 'Flujo_Aislado';
    regimeCode = 'ISOLATED_ROUGHNESS';
    regimeLabel = 'Flujo de Rugosidad Aislada (H/W < 0.30)';
    regimeDescription = 'Dispersión libre sin interferencia de vórtices entre aceras. El viento barre el suelo con total eficacia.';
  } else if (hw < 0.65) {
    regime = 'Estela_Interaccion';
    regimeCode = 'WAKE_INTERFERENCE';
    regimeLabel = 'Flujo de Interferencia de Estelas (0.30 ≤ H/W < 0.65)';
    regimeDescription = 'Interacción moderada de estelas descendentes. Se genera turbulencia pero el flujo no queda totalmente desacoplado.';
  } else {
    regime = 'Flujo_Cavidad_Skimming';
    regimeCode = 'SKIMMING_FLOW';
    regimeLabel = 'Flujo Rasante de Cavidad / Skimming Flow (H/W ≥ 0.65)';
    regimeDescription = 'Atrapamiento severo por desacoplamiento de capa límite. Formación de un vórtice recirculante cerrado que retiene contaminantes a 1.5 m.';
  }

  // Componente perpendicular del viento incidente
  const rad = (Math.abs(windAngleRelDeg) * Math.PI) / 180;
  const uPerp = Math.max(0.15, uRoofMs * Math.abs(Math.sin(rad)));
  const uParallel = uRoofMs * Math.abs(Math.cos(rad));
  
  // Turbulencia vertical en la cota de cornisa (Yamartino & Wiegand 1986)
  const sigmaW = 0.10 * uPerp + 0.15;
  
  // Flujo volumétrico de intercambio turbulento en el techo del cañón (m²/s)
  const qExch = sigmaW * widthM;
  
  // Tiempo de residencia medio del aire τ_res (s)
  const tauResSec = heightM / Math.max(0.01, sigmaW);
  const tauResMin = tauResSec / 60.0;
  
  // Renovaciones de aire por hora (ACH)
  const achPerHour = 3600.0 / Math.max(1, tauResSec);

  // Velocidad del vórtice secundario en el fondo del cañón
  const vVortex = uPerp * 0.12 * Math.exp(-0.4 * Math.max(0, hw - 1));

  // Factor de asimetría de concentración acera de sotavento / barlovento
  const ratioLeeward = Number((1.0 + Math.min(4.5, Math.pow(hw, 1.25) * 1.35)).toFixed(2));

  // Puntuación de ventilabilidad (0 a 10)
  const ventilationScore = Number((Math.max(1.0, Math.min(10.0, 10.0 / (1.0 + Math.pow(hw, 1.4))))).toFixed(1));
  
  const isTrappingSevere = hw >= 0.65 && uPerp > 1.0;

  let verdict = '';
  if (hw >= 1.5) {
    verdict = 'HIPER-CAÑÓN CRÍTICO: Atrapamiento severo de emisiones rodadas. Los transeúntes en la acera de sotavento respiran hasta ' + ratioLeeward + ' veces más NO₂ que en barlovento.';
  } else if (hw >= 0.65) {
    verdict = 'CAÑÓN EN SKIMMING: Vórtice cerrado activo. Ventilación dependiente del intercambio turbulento en la cota de cornisa (ACH = ' + achPerHour.toFixed(0) + ' h⁻¹).';
  } else if (hw >= 0.30) {
    verdict = 'RÉGIMEN DE ESTELAS: Interferencia moderada sin vórtice cerrado permanente. La ventilación de la calle es favorable (ACH = ' + achPerHour.toFixed(0) + ' h⁻¹).';
  } else {
    verdict = 'VENTILACIÓN ÓPTIMA: Dispersión directa a nivel de calzada con rápida renovación del aire (τ_res = ' + tauResMin.toFixed(1) + ' min).';
  }

  return {
    aspectRatioHW: Number(hw.toFixed(2)),
    skyViewFactorSVF: Number(svf.toFixed(2)),
    regime,
    regimeCode,
    regimeLabel,
    regimeDescription,
    uPerpMs: Number(uPerp.toFixed(2)),
    uParallelMs: Number(uParallel.toFixed(2)),
    sigmaWMs: Number(sigmaW.toFixed(2)),
    qExchM2s: Number(qExch.toFixed(2)),
    tauResSec: Number(tauResSec.toFixed(1)),
    tauResMin: Number(tauResMin.toFixed(2)),
    achPerHour: Number(achPerHour.toFixed(1)),
    vVortexMs: Number(vVortex.toFixed(2)),
    ratioLeeward,
    ventilationScore,
    isTrappingSevere,
    verdict
  };
}

export function exportCanyonGeometryGeoJson(canyons: StreetCanyonGeometryProfile[]): string {
  const geojson = {
    type: "FeatureCollection",
    properties: {
      title: "Geometría de Cañones Urbanos H/W - Gemelo Digital Málaga",
      theory: "Oke Flow Regimes (1987) / Yamartino-Wiegand Urban Canyon Dispersion / SIRANE",
      generatedAt: new Date().toISOString()
    },
    features: canyons.map(c => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [c.lon, c.lat]
      },
      properties: { ...c }
    }))
  };
  return JSON.stringify(geojson, null, 2);
}

export function exportCanyonGeometryCsv(canyons: StreetCanyonGeometryProfile[]): string {
  const headers = "streetId,streetName,district,lat,lon,avgBuildingHeightM,streetWidthM,aspectRatioHW,skyViewFactorSVF,okeFlowRegime,regimeCode,vortexCirculationSpeedMs,airResidenceTimeSec,airChangesPerHourACH,leewardToWindwardPollutantRatio,ventilationCapacityScore\n";
  const rows = canyons.map(c =>
    `"${c.streetId}","${c.streetName}","${c.district}",${c.lat},${c.lon},${c.avgBuildingHeightM},${c.streetWidthM},${c.aspectRatioHW},${c.skyViewFactorSVF},"${c.okeFlowRegime}","${c.regimeCode}",${c.vortexCirculationSpeedMs},${c.airResidenceTimeSec},${c.airChangesPerHourACH},${c.leewardToWindwardPollutantRatio},${c.ventilationCapacityScore}`
  ).join("\n");
  return headers + rows;
}

/**
 * Exportación formal en formato LaTeX para la memoria de la Tesis Doctoral.
 */
export function exportCanyonOkeLatex(canyons: StreetCanyonGeometryProfile[] = MALAGA_STREET_CANYONS_GEOMETRY): string {
  return `% --- HIDRODINÁMICA DE CAÑONES URBANOS SEGÚN OKE (1987) (TESIS DOCTORAL) ---
\\section*{Clasificación Morfodinámica de Cañones Urbanos en Málaga (Oke, 1987)}

\\subsection*{1. Formulación del Régimen de Flujo y Umbrales Canónicos}
La interacción aerodinámica entre la capa límite superficial y las cavidades urbanas se rige por la relación de aspecto geométrica $H/W$ (altura media de fachada respecto al ancho entre aceras):
\\begin{equation}
\\text{Régimen}(H/W) = \\begin{cases}
\\text{Isolated Roughness Flow (Flujo de Rugosidad Aislada)}, & \\text{si } H/W < 0.30 \\\\
\\text{Wake Interference Flow (Interferencia de Estelas)}, & \\text{si } 0.30 \\le H/W < 0.65 \\\\
\\text{Skimming Flow (Flujo Rasante con Vórtice Cerrado)}, & \\text{si } H/W \\ge 0.65
\\end{cases}
\\end{equation}

\\subsection*{2. Dinámica de Ventilación y Tiempo de Residencia del Aire}
Para un viento incidente a cota de cornisa $U_{\\text{roof}}$ con componente transversal $U_{\\perp} = U_{\\text{roof}} |\\sin\\theta|$, la velocidad de fluctuación vertical turbulenta según la formulación de Yamartino y Wiegand (1986) es:
\\begin{equation}
\\sigma_w = 0.10 \\, U_{\\perp} + 0.15 \\; [\\text{m/s}]
\\end{equation}
El tiempo medio de residencia del aire en el volumen del cañón ($\\tau_{\\text{res}}$) y la tasa horaria de renovación ($ACH$) resultan:
\\begin{equation}
\\tau_{\\text{res}} = \\frac{H}{\\sigma_w} \\; [\\text{s}], \\qquad ACH = \\frac{3600}{\\tau_{\\text{res}}} \\; [\\text{h}^{-1}]
\\end{equation}
La asimetría de concentración entre la acera de sotavento ($C_{\\text{lee}}$) y la de barlovento ($C_{\\text{wind}}$) debida al vórtice recirculante se modela como:
\\begin{equation}
\\frac{C_{\\text{lee}}}{C_{\\text{wind}}} = 1 + 1.35 \\left(\\frac{H}{W}\\right)^{1.25}
\\end{equation}

\\subsection*{3. Base de Datos de Cañones Característicos de Málaga}
\\begin{table}[h!]
\\centering
\\footnotesize
\\begin{tabular}{lccccrc}
\\hline
\\textbf{Calle / Arteria} & $H$ [m] & $W$ [m] & $H/W$ & \\textbf{Régimen Oke} & $\\tau_{\\text{res}}$ [s] & $C_{\\text{lee}}/C_{\\text{wind}}$ \\\\
\\hline
${canyons.slice(0, 8).map(c => `${c.streetName} & ${c.avgBuildingHeightM} & ${c.streetWidthM} & ${c.aspectRatioHW} & ${c.regimeCode.replace('_', ' ')} & ${c.airResidenceTimeSec} & ${c.leewardToWindwardPollutantRatio} \\\\`).join('\n')}
\\hline
\\end{tabular}
\\caption{Parámetros geométricos y dinámicos de los cañones urbanos de Málaga asimilados en el Gemelo Digital.}
\\end{table}`;
}
