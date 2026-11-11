/**
 * Módulo de Aerosoles Orgánicos Secundarios (SOA) y Esquema VBS (Volatility Basis Set)
 * Tesis Doctoral - Gemelo Digital de Calidad del Aire en Málaga
 *
 * Fundamentación Científica y Normativa:
 * - Esquema VBS (Volatility Basis Set) de Donahue et al. (2006) (Environ. Sci. Technol. 40, 2635–2643).
 * - Partición gas-partícula dada por la ecuación de Pankow (1994):
 *   F_i = 1 / (1 + C*_i / C_OA)
 * - Emisiones Biogénicas (BVOCs: Isopreno, α-Pineno de los Montes de Málaga) y Antropogénicas (AVOCs: Benceno, Tolueno del tráfico/puerto).
 * - Cero Datos Aleatorios (Zero Stochastic Data): Formulación analítica determinista basada en la cinética del radical OH y radiación UV-A.
 */

export interface VbsVolatilityBin {
  logCStar: number; // Log10 de la concentración de saturación de referencia C* (µg/m³)
  cStarUgm3: number; // C* a 298K (e.g., 0.1, 1, 10, 100, 1000 µg/m³)
  bvocMassYield: number; // Rendimiento de masa de BVOCs (Montes de Málaga)
  avocMassYield: number; // Rendimiento de masa de AVOCs (Tráfico/Puerto)
  condensedFractionFi: number; // Fracción condensada F_i en la fase aerosol
  binAerosolConcentrationUgm3: number; // Concentración en masa en la fase aerosol (µg/m³)
}

export interface VbsSoaZoneResult {
  zoneId: string;
  zoneName: string;
  lat: number;
  lon: number;
  bvocEmissionKgH: number; // Emisión de Isopreno + α-Pineno (kg/h)
  avocEmissionKgH: number; // Emisión de Aromáticos (kg/h)
  soaProductionUgm3: number; // Concentración total de SOA producido (µg/m³)
  bvocContributedSoaUgm3: number;
  avocContributedSoaUgm3: number;
  volatilityBins: VbsVolatilityBin[];
}

export interface VbsOrganicAerosolSummary {
  timestamp: string;
  airTempC: number;
  totalOrganicAerosolCoaUgm3: number; // C_OA total (Primary + Secondary OA)
  uvARadiationWm2: number; // Radiación UV-A (W/m²)
  ohRadicalConcMolecCm3: number; // Concentración de radicales OH (moléc/cm³)
  totalSoaProductionKgH: number; // Producción acumulada de SOA en la cuenca de Málaga (kg/h)
  zones: VbsSoaZoneResult[];
}

export const MALAGA_SOA_SOURCE_ZONES = [
  { id: 'montes_malaga_pinar', nombre: 'Montes de Málaga (Masa Biogénica Pinar/Encinar)', lat: 36.7800, lon: -4.4100, isBiogenic: true, bvocFactorKgHHa: 0.85, areaHa: 4800 },
  { id: 'cuenca_guadalhorce_agr', nombre: 'Valle del Guadalhorce (Cítricos y Cultivos)', lat: 36.7300, lon: -4.5200, isBiogenic: true, bvocFactorKgHHa: 0.42, areaHa: 3200 },
  { id: 'eje_trafico_ma20', nombre: 'Eje Urbano M-20 / Teatinos (AVOCs Tráfico)', lat: 36.7180, lon: -4.4600, isBiogenic: false, avocFactorKgHKm: 1.45, lengthKm: 12 },
  { id: 'puerto_muelle_cruceros', nombre: 'Zona Portuaria y Buques (Aromáticos Pesados)', lat: 36.7120, lon: -4.4180, isBiogenic: false, avocFactorKgH: 18.5, lengthKm: 1 },
];

/**
 * Coeficientes de entalpía de vaporización dH_vap (kJ/mol) según Epstein et al. (2010)
 */
export function getEpsomClausiusClapeyronCStar(cStar298: number, tempC: number): number {
  const T = tempC + 273.15;
  const T298 = 298.15;
  const R = 8.314e-3; // kJ / (mol K)
  const dHvap = 85.0 - 11.0 * Math.log10(cStar298); // kJ/mol
  return cStar298 * Math.exp(((dHvap / R) * (1 / T298 - 1 / T)));
}

/**
 * Cálculo del Particionamiento VBS de Pankow (1994) & Donahue (2006)
 */
export function calculateVbsSoaSummary(
  airTempC: number = 28.0,
  totalCoaUgm3: number = 8.5, // Concentración total de aerosol orgánico C_OA
  uvARadiationWm2: number = 32.0 // Radiación UV-A
): VbsOrganicAerosolSummary {
  // Concentración de radicales OH estimada a partir de UV-A: [OH] = 1e6 * (UV-A / 30)^0.8 (moléc/cm³)
  const ohConc = 1.2e6 * Math.pow(Math.max(1, uvARadiationWm2) / 30.0, 0.8);

  const binsBase298 = [
    { logC: -1, cStar: 0.1, bvocYield: 0.015, avocYield: 0.030 },
    { logC: 0, cStar: 1.0, bvocYield: 0.040, avocYield: 0.065 },
    { logC: 1, cStar: 10.0, bvocYield: 0.080, avocYield: 0.110 },
    { logC: 2, cStar: 100.0, bvocYield: 0.120, avocYield: 0.150 },
    { logC: 3, cStar: 1000.0, bvocYield: 0.180, avocYield: 0.220 },
  ];

  let totalSoaKgH = 0;

  const zones: VbsSoaZoneResult[] = MALAGA_SOA_SOURCE_ZONES.map((src) => {
    let bvocKgH = 0;
    let avocKgH = 0;

    if (src.isBiogenic) {
      // Emisión de BVOCs con dependencia de temperatura de Guenther et al. (MEGAN v2.1)
      const tempFactor = Math.exp(0.09 * (airTempC - 29.0));
      bvocKgH = (src.bvocFactorKgHHa * (src.areaHa || 100) * tempFactor) / 100;
    } else {
      avocKgH = (src.avocFactorKgHKm || src.avocFactorKgH || 1.0) * (src.lengthKm || 1);
    }

    // Particionamiento VBS en cada bin de volatilidad
    let zoneSoaUgm3 = 0;
    let bvocSoaUgm3 = 0;
    let avocSoaUgm3 = 0;

    const volatilityBins: VbsVolatilityBin[] = binsBase298.map((b) => {
      const cStarT = getEpsomClausiusClapeyronCStar(b.cStar, airTempC);
      // Fracción condensada F_i = 1 / (1 + C*_i / C_OA)
      const Fi = 1.0 / (1.0 + cStarT / Math.max(0.5, totalCoaUgm3));

      // Masa de SOA producida en esta zona = Emisión * Yield * Fi * factor_conversion
      const bvocBinSoa = bvocKgH * b.bvocYield * Fi * 0.12;
      const avocBinSoa = avocKgH * b.avocYield * Fi * 0.18;

      const binConc = bvocBinSoa + avocBinSoa;
      zoneSoaUgm3 += binConc;
      bvocSoaUgm3 += bvocBinSoa;
      avocSoaUgm3 += avocBinSoa;

      return {
        logCStar: b.logC,
        cStarUgm3: parseFloat(cStarT.toFixed(2)),
        bvocMassYield: b.bvocYield,
        avocMassYield: b.avocYield,
        condensedFractionFi: parseFloat(Fi.toFixed(3)),
        binAerosolConcentrationUgm3: parseFloat(binConc.toFixed(2)),
      };
    });

    totalSoaKgH += (bvocKgH + avocKgH) * 0.08;

    return {
      zoneId: src.id,
      zoneName: src.nombre,
      lat: src.lat,
      lon: src.lon,
      bvocEmissionKgH: parseFloat(bvocKgH.toFixed(2)),
      avocEmissionKgH: parseFloat(avocKgH.toFixed(2)),
      soaProductionUgm3: parseFloat(zoneSoaUgm3.toFixed(2)),
      bvocContributedSoaUgm3: parseFloat(bvocSoaUgm3.toFixed(2)),
      avocContributedSoaUgm3: parseFloat(avocSoaUgm3.toFixed(2)),
      volatilityBins,
    };
  });

  return {
    timestamp: new Date().toISOString(),
    airTempC,
    totalOrganicAerosolCoaUgm3: totalCoaUgm3,
    uvARadiationWm2,
    ohRadicalConcMolecCm3: parseFloat(ohConc.toExponential(2)),
    totalSoaProductionKgH: parseFloat(totalSoaKgH.toFixed(2)),
    zones,
  };
}

export function generateVbsGeoJson(summary: VbsOrganicAerosolSummary): any {
  return {
    type: 'FeatureCollection',
    features: summary.zones.map((z) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [z.lon, z.lat],
      },
      properties: {
        id: z.zoneId,
        nombre: z.zoneName,
        emision_bvoc_kg_h: z.bvocEmissionKgH,
        emision_avoc_kg_h: z.avocEmissionKgH,
        produccion_soa_ugm3: z.soaProductionUgm3,
        contribucion_biogenica_ugm3: z.bvocContributedSoaUgm3,
        contribucion_antropogenica_ugm3: z.avocContributedSoaUgm3,
      },
    })),
  };
}

export function exportVbsGeoJson(summary: VbsOrganicAerosolSummary): string {
  return JSON.stringify(generateVbsGeoJson(summary), null, 2);
}

export function exportVbsCsv(summary: VbsOrganicAerosolSummary): string {
  const headers =
    'zona_id,nombre,bvoc_kg_h,avoc_kg_h,soa_total_ugm3,bvoc_soa_ugm3,avoc_soa_ugm3\n';
  const rows = summary.zones
    .map(
      (z) =>
        `${z.zoneId},"${z.zoneName}",${z.bvocEmissionKgH},${z.avocEmissionKgH},${z.soaProductionUgm3},${z.bvocContributedSoaUgm3},${z.avocContributedSoaUgm3}`
    )
    .join('\n');
  return headers + rows;
}
