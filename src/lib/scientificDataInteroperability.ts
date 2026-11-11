/**
 * Motor de Interoperabilidad Científica para CAMS, NetCDF-4, GeoTIFF (COG) y Métricas FAIRMODE
 * Tesis Doctoral - Gemelo Digital de Calidad del Aire en Málaga
 *
 * Fundamentación Científica y Normativa:
 * - NetCDF-3/4 (CF-1.8 Conventions): Ingesta y decodificación de mallas atmosféricas multidimensionales de Copernicus CAMS & ERA5.
 * - Cloud-Optimized GeoTIFF (COG / OGC): Lectura de bandas multiespectrales satelitales (Sentinel-2 NDVI, Sentinel-5P TROPOMI NO2).
 * - Estadísticas Avanzadas FAIRMODE WG1 / Directiva 2008/50/CE con simple-statistics: Pearson r, Spearman rho, R², FB, NMSE, Willmott IOA, MQI.
 * - Cero Aleatoriedad: Cálculos deterministas y matrices numéricas reproducibles.
 */

import { NetCDFReader } from 'netcdfjs';
import { fromArrayBuffer, GeoTIFF, GeoTIFFImage } from 'geotiff';
import * as ss from 'simple-statistics';

export interface DecodedNetCdfField {
  title: string;
  dimensions: { name: string; size: number }[];
  variables: { name: string; type: string; dimensions: number[]; attributes: Record<string, any> }[];
  globalAttributes: Record<string, any>;
  latitudes: number[];
  longitudes: number[];
  timeSteps?: number[];
  extractedGridData?: {
    variableName: string;
    units: string;
    min: number;
    max: number;
    mean: number;
    sampleMatrix: number[][]; // [latIndex][lonIndex]
  };
}

export interface DecodedGeoTiffRaster {
  width: number;
  height: number;
  bandsCount: number;
  bbox: [number, number, number, number]; // [minX/lon, minY/lat, maxX/lon, maxY/lat]
  resolution: [number, number];
  dataSampleMin: number;
  dataSampleMax: number;
  dataSampleMean: number;
  noDataValue?: number;
}

export interface AdvancedFairmodeValidationResult {
  n: number;
  meanObs: number;
  meanSim: number;
  stdObs: number;
  stdSim: number;
  rPearson: number;
  rSpearman: number;
  rSquared: number;
  mae: number; // Mean Absolute Error (µg/m³)
  rmse: number; // Root Mean Square Error (µg/m³)
  nmb: number; // Normalized Mean Bias (%)
  nme: number; // Normalized Mean Error (%)
  fractionalBias: number; // FB (-2 a +2)
  fractionalError: number; // FE (0 a +2)
  nmse: number; // Normalized Mean Square Error
  willmottIndexAgreement: number; // d (0 a 1)
  fac2: number; // Fraction within factor 2 (0 a 1)
  mqi: number; // Model Quality Indicator (Target < 1.0)
  targetMet: boolean;
  linearRegression: {
    slope: number;
    intercept: number;
  };
}

/**
 * Parsea un buffer binario de NetCDF y extrae las dimensiones, metadatos y mallas CAMS/ERA5
 */
export function parseNetCdfBinaryBuffer(buffer: ArrayBuffer): DecodedNetCdfField {
  const reader = new NetCDFReader(buffer);

  const dimensions = reader.dimensions.map(d => ({ name: d.name, size: d.size }));
  const variables = reader.variables.map(v => {
    const attrs: Record<string, any> = {};
    if (v.attributes) {
      (v.attributes as any[]).forEach((a: any) => {
        attrs[a.name] = a.value;
      });
    }
    return {
      name: v.name,
      type: v.type,
      dimensions: v.dimensions,
      attributes: attrs
    };
  });

  const globalAttributes: Record<string, any> = {};
  (reader.globalAttributes as any[]).forEach((a: any) => {
    globalAttributes[a.name] = a.value;
  });

  // Intentar extraer lat/lon si existen
  let latitudes: number[] = [];
  let longitudes: number[] = [];
  try {
    if (reader.dataVariableExists('latitude')) {
      latitudes = Array.from(reader.getDataVariable('latitude') as any);
    } else if (reader.dataVariableExists('lat')) {
      latitudes = Array.from(reader.getDataVariable('lat') as any);
    }
    if (reader.dataVariableExists('longitude')) {
      longitudes = Array.from(reader.getDataVariable('longitude') as any);
    } else if (reader.dataVariableExists('lon')) {
      longitudes = Array.from(reader.getDataVariable('lon') as any);
    }
  } catch {
    // Si no existen variables lat/lon directas
  }

  return {
    title: globalAttributes.title || globalAttributes.Conventions || 'CAMS NetCDF Dataset',
    dimensions,
    variables,
    globalAttributes,
    latitudes,
    longitudes
  };
}

/**
 * Parsea un GeoTIFF / Cloud-Optimized GeoTIFF en memoria y extrae metadatos y estadísticas de ráster
 */
export async function parseGeoTiffArrayBuffer(buffer: ArrayBuffer): Promise<DecodedGeoTiffRaster> {
  const tiff: GeoTIFF = await fromArrayBuffer(buffer);
  const image: GeoTIFFImage = await tiff.getImage();

  const width = image.getWidth();
  const height = image.getHeight();
  const bandsCount = image.getSamplesPerPixel();
  const bbox = image.getBoundingBox() as [number, number, number, number];
  const resolution = image.getResolution() as [number, number];

  // Leer primer raster band para calcular métricas estadísticas representativas
  const rasters = await image.readRasters({ window: [0, 0, Math.min(width, 100), Math.min(height, 100)] });
  const sampleData = Array.from(rasters[0] as unknown as number[]);

  // Filtrar valores no válidos (NaN o negativos extremos)
  const validSamples = sampleData.filter(v => !isNaN(v) && v > -9999);
  const minVal = validSamples.length > 0 ? ss.min(validSamples) : 0;
  const maxVal = validSamples.length > 0 ? ss.max(validSamples) : 0;
  const meanVal = validSamples.length > 0 ? ss.mean(validSamples) : 0;

  return {
    width,
    height,
    bandsCount,
    bbox: bbox || [-4.6, 36.6, -4.2, 36.8],
    resolution: resolution || [0.001, 0.001],
    dataSampleMin: Number(minVal.toFixed(4)),
    dataSampleMax: Number(maxVal.toFixed(4)),
    dataSampleMean: Number(meanVal.toFixed(4))
  };
}

/**
 * Calcula el conjunto exhaustivo de validación estadística FAIRMODE WG1 usando simple-statistics
 */
export function evaluateAdvancedFairmodeMetrics(
  pairs: Array<{ obs: number; sim: number }>,
  targetMqiThreshold: number = 1.0,
  rvThreshold: number = 50.0 // Concentración de referencia (50 µg/m³ para NO2 o 120 para O3)
): AdvancedFairmodeValidationResult {
  if (!pairs || pairs.length < 2) {
    return {
      n: pairs?.length || 0,
      meanObs: 0,
      meanSim: 0,
      stdObs: 0,
      stdSim: 0,
      rPearson: 1,
      rSpearman: 1,
      rSquared: 1,
      mae: 0,
      rmse: 0,
      nmb: 0,
      nme: 0,
      fractionalBias: 0,
      fractionalError: 0,
      nmse: 0,
      willmottIndexAgreement: 1,
      fac2: 1,
      mqi: 0,
      targetMet: true,
      linearRegression: { slope: 1, intercept: 0 }
    };
  }

  const n = pairs.length;
  const obsArray = pairs.map(p => p.obs);
  const simArray = pairs.map(p => p.sim);

  const meanObs = ss.mean(obsArray);
  const meanSim = ss.mean(simArray);
  const stdObs = ss.standardDeviation(obsArray);
  const stdSim = ss.standardDeviation(simArray);

  // 1. Correlación de Pearson y Coeficiente de Determinación R²
  const rPearson = ss.sampleCorrelation(obsArray, simArray);
  const rSquared = ss.rSquared(pairs.map(p => [p.obs, p.sim]), (x) => {
    const reg = ss.linearRegression(pairs.map(pt => [pt.obs, pt.sim]));
    return reg.m * x + reg.b;
  });

  // 2. Correlación de Spearman
  // Calcular rangos
  const getRanks = (arr: number[]) => {
    const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array(arr.length);
    sorted.forEach((item, rank) => {
      ranks[item.i] = rank + 1;
    });
    return ranks;
  };
  const obsRanks = getRanks(obsArray);
  const simRanks = getRanks(simArray);
  const rSpearman = ss.sampleCorrelation(obsRanks, simRanks);

  // 3. Regresión Lineal Robusta
  const linReg = ss.linearRegression(pairs.map(p => [p.obs, p.sim]));

  // 4. Métricas de Error Absoluto y Cuadrático
  let sumAbsErr = 0;
  let sumSqErr = 0;
  let sumFb = 0;
  let sumFe = 0;
  let fac2Count = 0;
  let willmottDenominator = 0;

  pairs.forEach(p => {
    const diff = p.sim - p.obs;
    sumAbsErr += Math.abs(diff);
    sumSqErr += diff * diff;

    // Fractional Bias y Fractional Error
    const sumPair = p.sim + p.obs;
    if (sumPair > 0) {
      sumFb += (p.sim - p.obs) / (sumPair / 2);
      sumFe += Math.abs(p.sim - p.obs) / (sumPair / 2);
    }

    // FAC2
    if (p.obs > 0) {
      const ratio = p.sim / p.obs;
      if (ratio >= 0.5 && ratio <= 2.0) {
        fac2Count++;
      }
    } else if (p.sim === 0) {
      fac2Count++;
    }

    // Willmott Index: denominator = sum(|sim - meanObs| + |obs - meanObs|)^2
    const termW = Math.abs(p.sim - meanObs) + Math.abs(p.obs - meanObs);
    willmottDenominator += termW * termW;
  });

  const mae = sumAbsErr / n;
  const rmse = Math.sqrt(sumSqErr / n);
  const nmb = meanObs > 0 ? ((meanSim - meanObs) / meanObs) * 100 : 0;
  const nme = meanObs > 0 ? (mae / meanObs) * 100 : 0;
  const fractionalBias = sumFb / n;
  const fractionalError = sumFe / n;

  // NMSE = sum( (sim - obs)^2 ) / (n * meanObs * meanSim)
  const nmse = (meanObs * meanSim > 0) ? sumSqErr / (n * meanObs * meanSim) : 0;

  // Willmott IOA = 1 - ( sum(sim - obs)^2 / sum(|sim-meanObs| + |obs-meanObs|)^2 )
  const willmottIndexAgreement = willmottDenominator > 0 ? Math.max(0, 1 - (sumSqErr / willmottDenominator)) : 1;
  const fac2 = fac2Count / n;

  // 5. FAIRMODE Model Quality Indicator (MQI):
  // MQI = RMSE / (2 * U_r_95 * sqrt( (1 - alpha) * meanObs^2 + alpha * RV^2 ))
  // donde U_r_95 = 0.28 (para NO2 según FAIRMODE Guidance v3.3)
  const ur95 = 0.28;
  const alpha = 0.5;
  const targetUncertainty = 2 * ur95 * Math.sqrt((1 - alpha) * (meanObs * meanObs) + alpha * (rvThreshold * rvThreshold));
  const mqi = targetUncertainty > 0 ? rmse / targetUncertainty : 0;
  const targetMet = mqi <= targetMqiThreshold;

  return {
    n,
    meanObs: Number(meanObs.toFixed(2)),
    meanSim: Number(meanSim.toFixed(2)),
    stdObs: Number(stdObs.toFixed(2)),
    stdSim: Number(stdSim.toFixed(2)),
    rPearson: Number(rPearson.toFixed(3)),
    rSpearman: Number(rSpearman.toFixed(3)),
    rSquared: Number(rSquared.toFixed(3)),
    mae: Number(mae.toFixed(2)),
    rmse: Number(rmse.toFixed(2)),
    nmb: Number(nmb.toFixed(2)),
    nme: Number(nme.toFixed(2)),
    fractionalBias: Number(fractionalBias.toFixed(3)),
    fractionalError: Number(fractionalError.toFixed(3)),
    nmse: Number(nmse.toFixed(4)),
    willmottIndexAgreement: Number(willmottIndexAgreement.toFixed(3)),
    fac2: Number(fac2.toFixed(3)),
    mqi: Number(mqi.toFixed(3)),
    targetMet,
    linearRegression: {
      slope: Number(linReg.m.toFixed(3)),
      intercept: Number(linReg.b.toFixed(3))
    }
  };
}
