/**
 * Módulo de Emisiones Portuarias Tier 3 EMEP/EEA y Elevación de Pluma Térmica (Briggs)
 * Tesis Doctoral - Gemelo Digital de Calidad del Aire en Málaga
 *
 * Fundamentación Normativa y Física:
 * - Guía EMEP/EEA 2023 (1.A.3.d Navigation): Metodología Tier 3 por tipo de buque y modo operacional.
 * - Convenio MARPOL Anexo VI: Límite de azufre en combustibles marinos en zonas ECA (0.1% S) y global (0.5% S).
 * - Fórmulas de Pluma Térmica de Briggs (1969, 1975): Cálculo determinista del ascenso de pluma ($\Delta h$) por flotabilidad.
 * - Capa Límite Planetaria Marina (PBL_marina) y Advección de Brisa Sur a Norte (Puerto -> Centro Histórico).
 *
 * Cero Datos Aleatorios (Zero Stochastic Data): Todos los cálculos son analíticos e idénticos para las mismas condiciones de entrada.
 */

export interface ShipBerthLocation {
  id: string;
  nombre: string;
  muelle: string;
  lat: number;
  lon: number;
  tipoBuqueDefecto: ShipType;
  potenciaAuxKw: number;
  potenciaPrincKw: number;
}

export type ShipType = 'crucero' | 'ferry_roro' | 'carguero_portacontenedores' | 'petrolero_quimiquero' | 'pesquero';
export type OperatingMode = 'hoteling' | 'maniobra' | 'transito';
export type PasquillStabilityClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface ShipEmissionFactors {
  nox_g_kwh: number;
  so2_g_kwh: number;
  pm10_g_kwh: number;
  pm25_g_kwh: number;
  co_g_kwh: number;
  voc_g_kwh: number;
  co2_kg_kwh: number;
}

export interface PortBerthCalculation {
  berthId: string;
  muelleName: string;
  shipType: ShipType;
  mode: OperatingMode;
  fuelSulfurPct: number; // e.g. 0.1% ECA o 0.5%
  activeKw: number;
  emissionsKgH: {
    nox: number;
    so2: number;
    pm10: number;
    pm25: number;
    co: number;
    voc: number;
    co2: number;
  };
  briggsParams: {
    stackHeightM: number;
    stackTempC: number;
    stackVelMs: number;
    stackRadiusM: number;
    buoyancyFluxF: number; // m⁴/s³
    plumeRiseDeltaHM: number; // m
    effectiveHeightHM: number; // m
    maxConcentrationDistM: number; // m
    maxGroundConcentrationUgm3: {
      nox: number;
      so2: number;
      pm10: number;
    };
  };
}

export interface PortEmissionsSummary {
  timestamp: string;
  totalActiveShips: number;
  totalKw: number;
  totalEmissionsKgH: {
    nox: number;
    so2: number;
    pm10: number;
    pm25: number;
    co2TonH: number;
  };
  berths: PortBerthCalculation[];
  advectionVectorToCity: {
    speedMs: number;
    dirDeg: number;
    impactAlamedaUgm3NO2: number;
    impactParqueUgm3SO2: number;
  };
}

// Ubicaciones de Atranque Oficiales en el Puerto de Málaga (Muelle de Levante, Muelle 1, Muelle 2, Muelle 9)
export const MALAGA_PORT_BERTHS: ShipBerthLocation[] = [
  {
    id: 'muelle_levante_1',
    nombre: 'Atranque Cruceros Grande Calado',
    muelle: 'Muelle de Levante (Atranque B/C)',
    lat: 36.7118,
    lon: -4.4125,
    tipoBuqueDefecto: 'crucero',
    potenciaAuxKw: 11000,
    potenciaPrincKw: 36000,
  },
  {
    id: 'darsena_guadiaro_2',
    nombre: 'Muelle 2 - Palmeral de las Sorpresas',
    muelle: 'Muelle 2 (Megayates / Cruceros Pequeños)',
    lat: 36.7160,
    lon: -4.4162,
    tipoBuqueDefecto: 'crucero',
    potenciaAuxKw: 3500,
    potenciaPrincKw: 12000,
  },
  {
    id: 'muelle_3_ferry',
    nombre: 'Terminal Ferry Melilla (Ro-Ro)',
    muelle: 'Muelle 3 (Carga Rodada / Trasmediterránea)',
    lat: 36.7125,
    lon: -4.4190,
    tipoBuqueDefecto: 'ferry_roro',
    potenciaAuxKw: 4800,
    potenciaPrincKw: 18000,
  },
  {
    id: 'muelle_9_contenedores',
    nombre: 'Terminal Contenedores y Carga Granel',
    muelle: 'Muelle 9 (Noatum / Terminal Polivalente)',
    lat: 36.7055,
    lon: -4.4250,
    tipoBuqueDefecto: 'carguero_portacontenedores',
    potenciaAuxKw: 3200,
    potenciaPrincKw: 22000,
  },
  {
    id: 'darsena_pesquera_delfin',
    nombre: 'Dársena Pesquera de San Andrés',
    muelle: 'Dársena Pesquera / Lonja',
    lat: 36.7030,
    lon: -4.4320,
    tipoBuqueDefecto: 'pesquero',
    potenciaAuxKw: 450,
    potenciaPrincKw: 1200,
  }
];

/**
 * Factores de Emisión EMEP/EEA 2023 Tier 3 (g/kWh) por tipo de buque y combustible MARPOL
 */
export function getEMEPMarineFactors(
  shipType: ShipType,
  fuelSulfurPct: number = 0.1
): ShipEmissionFactors {
  // Ajuste lineal de SO2 por % de Azufre en combustible (100% conversión S -> SO2)
  // Consumo base específico: ~200 g MDO/kWh. SO2 = 2 * 200 * (%S / 100) g/kWh = 4 * %S g/kWh.
  const so2Factor = parseFloat((4.0 * fuelSulfurPct * 10).toFixed(2)); // e.g. 0.1% S -> 4.0 g/kWh

  switch (shipType) {
    case 'crucero':
      return {
        nox_g_kwh: 12.5,
        so2_g_kwh: Math.max(0.2, so2Factor),
        pm10_g_kwh: 1.15,
        pm25_g_kwh: 1.05,
        co_g_kwh: 1.8,
        voc_g_kwh: 0.5,
        co2_kg_kwh: 0.620,
      };
    case 'ferry_roro':
      return {
        nox_g_kwh: 11.8,
        so2_g_kwh: Math.max(0.2, so2Factor),
        pm10_g_kwh: 1.02,
        pm25_g_kwh: 0.94,
        co_g_kwh: 1.6,
        voc_g_kwh: 0.45,
        co2_kg_kwh: 0.610,
      };
    case 'carguero_portacontenedores':
      return {
        nox_g_kwh: 13.2,
        so2_g_kwh: Math.max(0.25, so2Factor),
        pm10_g_kwh: 1.30,
        pm25_g_kwh: 1.20,
        co_g_kwh: 1.4,
        voc_g_kwh: 0.4,
        co2_kg_kwh: 0.630,
      };
    case 'petrolero_quimiquero':
      return {
        nox_g_kwh: 12.8,
        so2_g_kwh: Math.max(0.25, so2Factor),
        pm10_g_kwh: 1.25,
        pm25_g_kwh: 1.15,
        co_g_kwh: 1.5,
        voc_g_kwh: 0.8, // Mayor COV evaporativo
        co2_kg_kwh: 0.625,
      };
    case 'pesquero':
      return {
        nox_g_kwh: 9.5,
        so2_g_kwh: Math.max(0.1, so2Factor * 0.8),
        pm10_g_kwh: 0.75,
        pm25_g_kwh: 0.68,
        co_g_kwh: 2.1,
        voc_g_kwh: 0.6,
        co2_kg_kwh: 0.590,
      };
  }
}

/**
 * Cálculo del Modelo de Pluma Térmica de Briggs (1969, 1975) y Dispersión Gaussiana Simplificada
 *
 * @param stackHeightM Altura física de la chimenea (m)
 * @param stackTempC Temperatura del gas de escape (°C)
 * @param airTempC Temperatura del aire ambiente (°C)
 * @param stackVelMs Velocidad de salida del gas (m/s)
 * @param stackRadiusM Radio interior de la chimenea (m)
 * @param windSpeedMs Velocidad del viento a altura de chimenea (m/s)
 * @param stabilityClase Clase de estabilidad Pasquill-Gifford
 */
export function calculateBriggsPlumeRise(
  stackHeightM: number,
  stackTempC: number,
  airTempC: number,
  stackVelMs: number,
  stackRadiusM: number,
  windSpeedMs: number,
  stabilityClass: PasquillStabilityClass = 'D'
) {
  const g = 9.81; // m/s²
  const Ts = stackTempC + 273.15;
  const Ta = airTempC + 273.15;
  const u = Math.max(0.8, windSpeedMs); // Evitar división por cero en calma

  // Parámetro de Flujo de Flotabilidad de Briggs F (m⁴/s³)
  // F = g * w_s * r_s² * (T_s - T_a) / T_s
  const buoyancyFluxF = (g * stackVelMs * Math.pow(stackRadiusM, 2) * (Ts - Ta)) / Ts;

  let plumeRiseDeltaH = 0;
  let distanceToMaxDistM = 0;

  if (stabilityClass === 'A' || stabilityClass === 'B' || stabilityClass === 'C' || stabilityClass === 'D') {
    // Atmósfera Inestable / Neutra
    if (buoyancyFluxF < 55) {
      distanceToMaxDistM = 49 * Math.pow(buoyancyFluxF, 5 / 8);
    } else {
      distanceToMaxDistM = 119 * Math.pow(buoyancyFluxF, 2 / 5);
    }
    // Ascenso final delta H = 1.6 * F^(1/3) * x_f^(2/3) / u
    plumeRiseDeltaH = (1.6 * Math.pow(Math.max(0.01, buoyancyFluxF), 1 / 3) * Math.pow(Math.max(1.0, distanceToMaxDistM), 2 / 3)) / u;
  } else {
    // Atmósfera Estable (E, F)
    // Gradiente térmico vertical dTheta/dz ~ 0.02 K/m para E, 0.035 K/m para F
    const dThetaDz = stabilityClass === 'E' ? 0.02 : 0.035;
    const stabilityParamS = (g / Ta) * dThetaDz;
    distanceToMaxDistM = 2.07 * (u / Math.sqrt(stabilityParamS));
    plumeRiseDeltaH = 2.6 * Math.pow(buoyancyFluxF / (u * stabilityParamS), 1 / 3);
  }

  // Acotar ascenso físico realista
  plumeRiseDeltaH = Math.min(250, Math.max(2, plumeRiseDeltaH));
  const effectiveHeightHM = stackHeightM + plumeRiseDeltaH;

  return {
    buoyancyFluxF: parseFloat(buoyancyFluxF.toFixed(3)),
    plumeRiseDeltaHM: parseFloat(plumeRiseDeltaH.toFixed(1)),
    effectiveHeightHM: parseFloat(effectiveHeightHM.toFixed(1)),
    maxConcentrationDistM: parseFloat(distanceToMaxDistM.toFixed(0)),
  };
}

/**
 * Concentración en superficie C_max (µg/m³) por modelo gaussiano determinista de chimenea elevada
 * C_max = Q / (e * pi * u * sigma_y * sigma_z)
 */
export function calculateGaussianGroundPeak(
  emissionRateGMs: number, // g/s
  effectiveHeightM: number,
  windSpeedMs: number,
  stabilityClass: PasquillStabilityClass = 'D'
): number {
  const u = Math.max(0.8, windSpeedMs);
  // Coeficientes de dispersión a distancia x_max típicos (Pasquill)
  let sigmaY = 0.12 * effectiveHeightM * 2.5;
  let sigmaZ = 0.08 * effectiveHeightM * 1.8;

  if (stabilityClass === 'A' || stabilityClass === 'B') {
    sigmaZ *= 1.8;
  } else if (stabilityClass === 'E' || stabilityClass === 'F') {
    sigmaZ *= 0.5;
  }

  // C_max en µg/m³
  const cMaxGmM3 = emissionRateGMs / (Math.E * Math.PI * u * sigmaY * sigmaZ);
  const cMaxUgm3 = cMaxGmM3 * 1e6; // g/m³ -> µg/m³

  return parseFloat(Math.min(450, Math.max(0.1, cMaxUgm3)).toFixed(1));
}

/**
 * Calcula la matriz determinista de emisiones portuarias y advección de pluma sobre Málaga
 */
export function calculatePortEmissionsAndPlume(
  airTempC: number = 22,
  windSpeedMs: number = 3.5,
  windDirDeg: number = 190, // Brisa marina del Sur hacia Alameda/Parque
  fuelSulfurPct: number = 0.1,
  activeBerthsCount: number = 4,
  stabilityClass: PasquillStabilityClass = 'D'
): PortEmissionsSummary {
  const berthsCalcs: PortBerthCalculation[] = [];

  let totalNoxKgH = 0;
  let totalSo2KgH = 0;
  let totalPm10KgH = 0;
  let totalPm25KgH = 0;
  let totalCoKgH = 0;
  let totalVocKgH = 0;
  let totalCo2TonH = 0;
  let totalKw = 0;

  // Recorrer los atranques
  const countToUse = Math.min(MALAGA_PORT_BERTHS.length, Math.max(1, activeBerthsCount));

  for (let i = 0; i < countToUse; i++) {
    const berth = MALAGA_PORT_BERTHS[i];
    const shipType = berth.tipoBuqueDefecto;
    const mode: OperatingMode = 'hoteling'; // Buques atracados consumiendo en generadores auxiliares

    const factors = getEMEPMarineFactors(shipType, fuelSulfurPct);
    const activeKw = berth.potenciaAuxKw;

    // Emisiones horarias en kg/h: E = Power (kW) * Factor (g/kWh) / 1000
    const noxKgH = parseFloat(((activeKw * factors.nox_g_kwh) / 1000).toFixed(2));
    const so2KgH = parseFloat(((activeKw * factors.so2_g_kwh) / 1000).toFixed(2));
    const pm10KgH = parseFloat(((activeKw * factors.pm10_g_kwh) / 1000).toFixed(2));
    const pm25KgH = parseFloat(((activeKw * factors.pm25_g_kwh) / 1000).toFixed(2));
    const coKgH = parseFloat(((activeKw * factors.co_g_kwh) / 1000).toFixed(2));
    const vocKgH = parseFloat(((activeKw * factors.voc_g_kwh) / 1000).toFixed(2));
    const co2TonH = parseFloat(((activeKw * factors.co2_kg_kwh) / 1000).toFixed(3));

    totalNoxKgH += noxKgH;
    totalSo2KgH += so2KgH;
    totalPm10KgH += pm10KgH;
    totalPm25KgH += pm25KgH;
    totalCoKgH += coKgH;
    totalVocKgH += vocKgH;
    totalCo2TonH += co2TonH;
    totalKw += activeKw;

    // Parámetros físicos típicos de chimenea de buque según tipo
    let stackHeightM = 35;
    let stackTempC = 280;
    let stackVelMs = 12;
    let stackRadiusM = 0.75;

    if (shipType === 'crucero') {
      stackHeightM = 52;
      stackTempC = 310;
      stackVelMs = 16;
      stackRadiusM = 1.1;
    } else if (shipType === 'ferry_roro') {
      stackHeightM = 28;
      stackTempC = 260;
      stackVelMs = 11;
      stackRadiusM = 0.65;
    }

    const briggs = calculateBriggsPlumeRise(
      stackHeightM,
      stackTempC,
      airTempC,
      stackVelMs,
      stackRadiusM,
      windSpeedMs,
      stabilityClass
    );

    // Conversión de g/s para Gauss
    const noxGMs = (noxKgH * 1000) / 3600;
    const so2GMs = (so2KgH * 1000) / 3600;
    const pm10GMs = (pm10KgH * 1000) / 3600;

    const maxNoxUgm3 = calculateGaussianGroundPeak(noxGMs, briggs.effectiveHeightHM, windSpeedMs, stabilityClass);
    const maxSo2Ugm3 = calculateGaussianGroundPeak(so2GMs, briggs.effectiveHeightHM, windSpeedMs, stabilityClass);
    const maxPm10Ugm3 = calculateGaussianGroundPeak(pm10GMs, briggs.effectiveHeightHM, windSpeedMs, stabilityClass);

    berthsCalcs.push({
      berthId: berth.id,
      muelleName: berth.muelle,
      shipType,
      mode,
      fuelSulfurPct,
      activeKw,
      emissionsKgH: {
        nox: noxKgH,
        so2: so2KgH,
        pm10: pm10KgH,
        pm25: pm25KgH,
        co: coKgH,
        voc: vocKgH,
        co2: parseFloat((co2TonH * 1000).toFixed(1)), // kg/h
      },
      briggsParams: {
        stackHeightM,
        stackTempC,
        stackVelMs,
        stackRadiusM,
        buoyancyFluxF: briggs.buoyancyFluxF,
        plumeRiseDeltaHM: briggs.plumeRiseDeltaHM,
        effectiveHeightHM: briggs.effectiveHeightHM,
        maxConcentrationDistM: briggs.maxConcentrationDistM,
        maxGroundConcentrationUgm3: {
          nox: maxNoxUgm3,
          so2: maxSo2Ugm3,
          pm10: maxPm10Ugm3,
        },
      },
    });
  }

  // Impacto en el Centro Histórico (Alameda Principal y Parque de Málaga) por Advección de Brisa
  // Distancia del Muelle de Levante a la Alameda ~ 850m
  // Factor de atenuación gaussiana advectiva de la pluma combinada
  const windRad = (windDirDeg * Math.PI) / 180;
  // Componente del viento apuntando al Norte (hacia la ciudad): -cos(dir)
  const northVector = -Math.cos(windRad);
  const advectionFactorToCity = Math.max(0.05, northVector);

  const impactAlamedaUgm3NO2 = parseFloat((totalNoxKgH * 0.18 * advectionFactorToCity * (3.5 / Math.max(1, windSpeedMs))).toFixed(1));
  const impactParqueUgm3SO2 = parseFloat((totalSo2KgH * 0.22 * advectionFactorToCity * (3.5 / Math.max(1, windSpeedMs))).toFixed(1));

  return {
    timestamp: new Date().toISOString(),
    totalActiveShips: countToUse,
    totalKw,
    totalEmissionsKgH: {
      nox: parseFloat(totalNoxKgH.toFixed(1)),
      so2: parseFloat(totalSo2KgH.toFixed(1)),
      pm10: parseFloat(totalPm10KgH.toFixed(1)),
      pm25: parseFloat(totalPm25KgH.toFixed(1)),
      co2TonH: parseFloat(totalCo2TonH.toFixed(2)),
    },
    berths: berthsCalcs,
    advectionVectorToCity: {
      speedMs: windSpeedMs,
      dirDeg: windDirDeg,
      impactAlamedaUgm3NO2,
      impactParqueUgm3SO2,
    },
  };
}

/**
 * Exporta la red de atranques y pluma portuaria en formato GeoJSON para QGIS
 */
export function generatePortPlumeGeoJson(summary: PortEmissionsSummary): any {
  const features: any[] = [];

  summary.berths.forEach((b) => {
    const berthLoc = MALAGA_PORT_BERTHS.find((m) => m.id === b.berthId);
    if (!berthLoc) return;

    // Punto de emisión en atranque
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [berthLoc.lon, berthLoc.lat],
      },
      properties: {
        id: b.berthId,
        nombre: berthLoc.nombre,
        muelle: b.muelleName,
        tipoBuque: b.shipType,
        kwAuxiliares: b.activeKw,
        emisionNOx_kg_h: b.emissionsKgH.nox,
        emisionSO2_kg_h: b.emissionsKgH.so2,
        alturaEfectivaM: b.briggsParams.effectiveHeightHM,
        ascensoPlumaDeltaHM: b.briggsParams.plumeRiseDeltaHM,
        maxConcNOx_ugm3: b.briggsParams.maxGroundConcentrationUgm3.nox,
      },
    });

    // Trayectoria de la pluma hacia el sotavento
    const dirRad = (summary.advectionVectorToCity.dirDeg * Math.PI) / 180;
    const plumeLengthKm = (b.briggsParams.maxConcentrationDistM * 2.5) / 100000; // ~ km en grados aprox
    const endLon = berthLoc.lon + Math.sin(dirRad) * plumeLengthKm;
    const endLat = berthLoc.lat + Math.cos(dirRad) * plumeLengthKm;

    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [berthLoc.lon, berthLoc.lat],
          [endLon, endLat],
        ],
      },
      properties: {
        id: `plume_line_${b.berthId}`,
        muelle: b.muelleName,
        tipo: 'Eje de Pluma de Briggs',
        distanciaMaxImpactoM: b.briggsParams.maxConcentrationDistM,
        so2GroundPeakUgm3: b.briggsParams.maxGroundConcentrationUgm3.so2,
      },
    });
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Exportación FAIR GeoJSON
 */
export function exportPortGeoJson(summary: PortEmissionsSummary): string {
  const geojson = generatePortPlumeGeoJson(summary);
  return JSON.stringify(geojson, null, 2);
}

/**
 * Exportación FAIR CSV para Auditoría Regulatoria de Emisiones Marítimas
 */
export function exportPortCsv(summary: PortEmissionsSummary): string {
  const headers =
    'berth_id,muelle,tipo_buque,potencia_aux_kw,combustible_azufre_pct,emision_nox_kg_h,emision_so2_kg_h,emision_pm10_kg_h,emision_co2_ton_h,altura_chimenea_m,ascenso_pluma_briggs_m,altura_efectiva_m,distancia_max_impacto_m,so2_max_superficie_ugm3\n';
  const rows = summary.berths
    .map(
      (b) =>
        `${b.berthId},"${b.muelleName}",${b.shipType},${b.activeKw},${b.fuelSulfurPct},${b.emissionsKgH.nox},${b.emissionsKgH.so2},${b.emissionsKgH.pm10},${(b.emissionsKgH.co2 / 1000).toFixed(3)},${b.briggsParams.stackHeightM},${b.briggsParams.plumeRiseDeltaHM},${b.briggsParams.effectiveHeightHM},${b.briggsParams.maxConcentrationDistM},${b.briggsParams.maxGroundConcentrationUgm3.so2}`
    )
    .join('\n');

  return headers + rows;
}
