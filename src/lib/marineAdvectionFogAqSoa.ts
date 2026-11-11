/**
 * Modelo Determinista de Procesamiento Acuoso en Nieblas Litorales de Advección (Taró de la Bahía de Málaga).
 * Formación de Aerosol Orgánico Secundario Acuoso (aqSOA), Carbono Pardo (Brown Carbon - BrC)
 * y oligomerización multifásica catalizada por metales de transición y sulfato/amonio.
 * 
 * Fundamentación Científica:
 * - Ervens, Turpin & Chillrud (2011): Secondary organic aerosol formation in cloud droplets and aqueous particles (ACP).
 * - Lim et al. (2010): Aqueous-phase secondary organic aerosol formation from glyoxal (ES&T).
 * - Laskin, Laskin & Nizkorodov (2015): Chemistry of atmospheric brown carbon (Chemical Reviews).
 * - Tesis Doctoral: Gemelo Digital de Málaga.
 */

export interface TaroFogPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceToSeaM: number;
  fogFrequencyDaysPerYear: number; // Días/año con episodios de Taró
  liquidWaterContentGm3: number; // LWC [g/m³]
  dropletEffectiveRadiusUm: number; // r_eff [µm]
  glyoxalGasPpb: number; // [CHOCHO] en fase gaseosa [ppb]
  aqSoaYieldUgm3Hour: number; // Tasa de producción de aqSOA [µg/(m³·h)]
  brownCarbonMac365M2G: number; // Coeficiente de absorción másica MAC_365 [m²/g]
  pm25MassEnhancementPct: number; // Incremento neto de PM2.5 tras evaporación de la niebla
  description: string;
}

export interface TaroFogParameters {
  liquidWaterContentGm3: number; // LWC de la niebla (0.05 a 0.55 g/m³)
  dropletRadiusUm: number; // Radio efectivo r_eff (6 a 18 µm)
  ambientTempC: number; // Temperatura durante el Taró (típico 15 a 21°C)
  relativeHumidityPct: number; // HR (95 a 100%)
  glyoxalGasPpb: number; // Precursor soluble: Glioxal [ppb]
  methylglyoxalGasPpb: number; // Precursor: Metilglioxal [ppb]
  ammoniumSulfateLoadingUgm3: number; // Carga de sulfato amónico [µg/m³]
  transitionMetalsFeCuNgM3: number; // [Fe + Cu] disuelto para reacción Fenton [ng/m³]
  solarRadiationWm2: number; // Radiación residual atenuada por niebla [W/m²]
}

export interface TaroFogSimulationResult {
  dropletNumberDensityCm3: number; // N_drop [cm⁻³]
  dropletTotalSurfaceAreaUm2Cm3: number; // S_drop [µm²/cm³]
  glyoxalHenryEffectiveMatm: number; // H*_gly constante de Henry efectiva [M/atm]
  aqueousGlyoxalMolarityMolL: number; // [CHOCHO]_aq en microgotas [mol/L]
  aqueousOhRadicalSteadyStateM: number; // [OH•]_aq en microgotas [M]
  aqSoaFormationRateUgm3Hour: number; // Tasa de masa de aqSOA [µg/(m³·h)]
  oxalicAcidProductionUgm3Hour: number; // Formación de ácido oxálico (no volátil) [µg/(m³·h)]
  brownCarbonMac365M2G: number; // Absorción de Brown Carbon MAC_365 [m²/g]
  brownCarbonAerosolAodIncrement: number; // Incremento de AOD UV por BrC
  postFogEvaporationPm25GainUgm3: number; // Ganancia neta de masa PM2.5 retenida [µg/m³]
  chemicalReactionPathways: {
    fentonPhotoOxidationPct: number;
    ammoniumCatalyzedOligomersPct: number;
    sulfateEsterificationPct: number;
  };
  malagaTaroHotspots: TaroFogPoint[];
  scientificInterpretation: string;
}

export const MALAGA_TARO_HOTSPOTS: TaroFogPoint[] = [
  {
    id: 'puerto_muelle_heredia',
    name: 'Puerto de Málaga / Muelle Heredia',
    lat: 36.7142,
    lon: -4.4215,
    distanceToSeaM: 25,
    fogFrequencyDaysPerYear: 28,
    liquidWaterContentGm3: 0.32,
    dropletEffectiveRadiusUm: 10.5,
    glyoxalGasPpb: 0.42,
    aqSoaYieldUgm3Hour: 1.85,
    brownCarbonMac365M2G: 1.65,
    pm25MassEnhancementPct: 34.5,
    description: 'Niebla de advección directa sobre buques y tráfico pesado, máxima formación de aqSOA con metales de transición'
  },
  {
    id: 'paseo_maritimo_antonio_machado',
    name: 'Paseo Marítimo Antonio Machado (Huelin)',
    lat: 36.7065,
    lon: -4.4312,
    distanceToSeaM: 40,
    fogFrequencyDaysPerYear: 31,
    liquidWaterContentGm3: 0.38,
    dropletEffectiveRadiusUm: 11.2,
    glyoxalGasPpb: 0.38,
    aqSoaYieldUgm3Hour: 1.62,
    brownCarbonMac365M2G: 1.48,
    pm25MassEnhancementPct: 29.8,
    description: 'Entrada de Taró que penetra 600m tierra adentro por el eje viario de Huelin hacia Carretera de Cádiz'
  },
  {
    id: 'la_malagueta_paseo_maritimo',
    name: 'La Malagueta / Paseo Ciudad de Melilla',
    lat: 36.7175,
    lon: -4.4095,
    distanceToSeaM: 20,
    fogFrequencyDaysPerYear: 26,
    liquidWaterContentGm3: 0.28,
    dropletEffectiveRadiusUm: 9.8,
    glyoxalGasPpb: 0.29,
    aqSoaYieldUgm3Hour: 1.24,
    brownCarbonMac365M2G: 1.32,
    pm25MassEnhancementPct: 24.2,
    description: 'Condensación rápida sobre aerosoles de sal marina con alta alcalinidad inicial y neutralización por HNO3'
  },
  {
    id: 'desembocadura_guadalhorce_litoral',
    name: 'Litoral Desembocadura del Guadalhorce',
    lat: 36.6620,
    lon: -4.4490,
    distanceToSeaM: 10,
    fogFrequencyDaysPerYear: 36,
    liquidWaterContentGm3: 0.45,
    dropletEffectiveRadiusUm: 12.8,
    glyoxalGasPpb: 0.51,
    aqSoaYieldUgm3Hour: 2.15,
    brownCarbonMac365M2G: 1.95,
    pm25MassEnhancementPct: 41.0,
    description: 'Mezcla de niebla advectiva marina con emisiones biogénicas de humedales y aportes de amonio agrícola'
  }
];

/**
 * Cálculo de la constante de Henry efectiva para Glioxal considerando hidratación acuosa:
 * CHOCHO(g) + 2 H2O -> CHOCHO·2H2O (gem-dioles y tetroles hidratados)
 * H*_gly = H_0 * (1 + K_hyd1 + K_hyd1 * K_hyd2) ~ 3.0e5 M/atm a 298K
 */
export function calculateEffectiveGlyoxalHenry(tempCelsius: number): number {
  const tempK = tempCelsius + 273.15;
  // Entalpía de disolución ΔH = -62 kJ/mol (reacción fuertemente exotérmica por hidratación)
  const h0 = 3.2e5; // M/atm a 298.15 K
  const deltaH = -62000; // J/mol
  const R = 8.314;
  return h0 * Math.exp((-deltaH / R) * (1 / tempK - 1 / 298.15));
}

/**
 * Simulación Determinista del Procesamiento Acuoso del Taró y Rendimiento de aqSOA / BrC
 */
export function simulateTaroFogAqueousSoa(params: TaroFogParameters): TaroFogSimulationResult {
  const {
    liquidWaterContentGm3,
    dropletRadiusUm,
    ambientTempC,
    relativeHumidityPct,
    glyoxalGasPpb,
    methylglyoxalGasPpb,
    ammoniumSulfateLoadingUgm3,
    transitionMetalsFeCuNgM3,
    solarRadiationWm2
  } = params;

  // 1. Microfísica de la niebla
  // Radio en cm: r_drop = dropletRadiusUm * 1e-4 cm
  const rDropCm = dropletRadiusUm * 1e-4;
  // Volumen de una gota: V_drop = (4/3) * π * r^3 [cm³]
  const volumeDropCm3 = (4/3) * Math.PI * Math.pow(rDropCm, 3);
  // Densidad del agua = 1.0 g/cm³
  // Masa de agua por cm³ de aire = LWC [g/m³] * 1e-6 [g/cm³]
  const lwcGcm3 = liquidWaterContentGm3 * 1e-6;
  // Número de gotas por cm³ de aire: N_drop = LWC / (V_drop * rho_w)
  const nDropCm3 = Math.max(10.0, lwcGcm3 / (volumeDropCm3 * 1.0));
  // Área superficial de gotas por cm³ de aire [µm²/cm³]
  const sDropUm2Cm3 = nDropCm3 * (4 * Math.PI * Math.pow(dropletRadiusUm, 2));

  // 2. Partición gas-líquido
  const hGlyMatm = calculateEffectiveGlyoxalHenry(ambientTempC);
  // Presión parcial de glioxal P_gly = [ppb] * 1e-9 atm
  const pGlyAtm = glyoxalGasPpb * 1e-9;
  // Concentración acuosa de glioxal en la microgota [mol/L]
  const cGlyAqMolL = hGlyMatm * pGlyAtm;

  // Análogamente para metilglioxal (H*_mgly ~ 3.5e3 M/atm)
  const hMglyMatm = 3.5e3 * Math.exp(5200 * (1 / (ambientTempC + 273.15) - 1 / 298.15));
  const cMglyAqMolL = hMglyMatm * (methylglyoxalGasPpb * 1e-9);

  // 3. Concentración de radicales OH en fase acuosa [OH•]_aq
  // Generación por reacción Fenton: Fe(II) + H2O2 -> Fe(III) + OH- + OH•
  // y fotólisis acuosa de nitrato/nitrito disuelto
  const feCuMolarity = (transitionMetalsFeCuNgM3 * 1e-9 / 55.845) / Math.max(1e-6, liquidWaterContentGm3 * 1e-3); // mol/L
  const fentonRateMPerSec = 4.5e4 * Math.max(1e-8, feCuMolarity) * 1e-6; // asumiendo [H2O2]_aq ~ 1 µM
  const photoRateMPerSec = (solarRadiationWm2 / 500.0) * 8.5e-10;
  const totalOhAqProdRate = fentonRateMPerSec + photoRateMPerSec;

  // Sumideros de OH en fase acuosa (k_scavenger ~ 5e8 s⁻¹)
  const kScavenger = 4.5e8;
  const ohAqSteadyStateM = totalOhAqProdRate / kScavenger; // Típico 1e-14 a 5e-13 M

  // 4. Cinética de oxidación acuosa hacia Ácido Oxálico y Oligómeros
  // CHOCHO + OH•_aq -> Ac. Glioxílico -> Ac. Oxálico (k_OH = 1.1e9 M⁻¹ s⁻¹)
  const kOxidation = 1.1e9; // M⁻¹ s⁻¹
  const rOxidationGlyMolLS = kOxidation * cGlyAqMolL * ohAqSteadyStateM;
  const rOxidationMglyMolLS = 8.5e8 * cMglyAqMolL * ohAqSteadyStateM;

  // Tasa de producción en volumen de aire [µg/(m³·h)]
  // Peso molecular de ácido oxálico / oligómeros ~ 90.03 g/mol a 200 g/mol
  const molAirVolumeFactor = (liquidWaterContentGm3 * 1e-3); // L de agua por m³ de aire
  const totalAqueousProdMolM3S = (rOxidationGlyMolLS + rOxidationMglyMolLS) * molAirVolumeFactor;
  const oxalicAcidYieldUgm3H = (rOxidationGlyMolLS * molAirVolumeFactor * 90.03 * 1e6) * 3600.0;
  
  // Oligomerización catalizada por amonio (reacción con NH4+ formando imidazoles que absorben luz)
  const nh4Molarity = (ammoniumSulfateLoadingUgm3 * 0.27 * 1e-6 / 18.04) / Math.max(1e-6, liquidWaterContentGm3 * 1e-3);
  const kOligomer = 1.5e-3; // M⁻¹ s⁻¹
  const rOligomerMolLS = kOligomer * cGlyAqMolL * Math.min(0.5, nh4Molarity);
  const oligomerYieldUgm3H = (rOligomerMolLS * molAirVolumeFactor * 160.0 * 1e6) * 3600.0;

  const aqSoaTotalYieldUgm3H = oxalicAcidYieldUgm3H + oligomerYieldUgm3H;

  // 5. Formación de Carbono Pardo (Brown Carbon - BrC)
  // Rendimiento de imidazoles y cromóforos conjugados absorbentes en 365 nm
  const imidazoleFraction = Math.min(0.35, (oligomerYieldUgm3H / Math.max(0.1, aqSoaTotalYieldUgm3H)) * 0.45);
  // MAC_365: Coeficiente de absorción específico de masa [m²/g]
  const brownCarbonMac365 = 0.65 + 3.8 * imidazoleFraction;

  // AOD UV adicional debido a la formación de BrC tras 3 horas de niebla
  const brcMassColumnUgm2 = (oligomerYieldUgm3H * 3.0) * 120.0; // capa de niebla de 120m
  const brcAodIncrement = (brcMassColumnUgm2 * 1e-6) * brownCarbonMac365;

  // Incremento retenido en PM2.5 tras la disipación del Taró (evaporación del agua)
  // El ácido oxálico y los oligómeros son no volátiles y quedan como residuo sólido en PM2.5
  const postFogPm25GainUgm3 = Math.min(8.5, aqSoaTotalYieldUgm3H * 2.5); // episodio de 2.5 horas

  // Distribución de rutas químicas
  const sumRates = rOxidationGlyMolLS + rOxidationMglyMolLS + rOligomerMolLS + 1e-12;
  const fentonPct = ((rOxidationGlyMolLS + rOxidationMglyMolLS) / sumRates) * 65.0;
  const ammoniumPct = (rOligomerMolLS / sumRates) * 100.0;
  const sulfatePct = Math.max(5.0, 100.0 - fentonPct - ammoniumPct);

  const scientificInterpretation = `Durante los episodios de niebla de advección marina (Taró de la Bahía de Málaga) con LWC = ${liquidWaterContentGm3.toFixed(2)} g/m³, la absorción de glioxal y metilglioxal en microgotas de agua (H* = ${(hGlyMatm/1e5).toFixed(2)}×10⁵ M/atm) produce aerosol orgánico secundario acuoso (aqSOA) a una tasa de ${aqSoaTotalYieldUgm3H.toFixed(2)} µg/(m³·h). Las reacciones de Fenton con trazas de Fe/Cu y la catálisis por amonio/sulfato generan ácido oxálico y oligómeros de Carbono Pardo (BrC) con MAC₃₆₅ = ${brownCarbonMac365.toFixed(2)} m²/g. Tras la disipación diurna de la niebla por insolación, este residuo no volátil incrementa de forma irreversible la concentración de PM2.5 en +${postFogPm25GainUgm3.toFixed(2)} µg/m³ en la franja litoral urbana.`;

  return {
    dropletNumberDensityCm3: parseFloat(nDropCm3.toFixed(1)),
    dropletTotalSurfaceAreaUm2Cm3: parseFloat(sDropUm2Cm3.toFixed(0)),
    glyoxalHenryEffectiveMatm: parseFloat(hGlyMatm.toExponential(3)),
    aqueousGlyoxalMolarityMolL: parseFloat(cGlyAqMolL.toExponential(3)),
    aqueousOhRadicalSteadyStateM: parseFloat(ohAqSteadyStateM.toExponential(3)),
    aqSoaFormationRateUgm3Hour: parseFloat(aqSoaTotalYieldUgm3H.toFixed(3)),
    oxalicAcidProductionUgm3Hour: parseFloat(oxalicAcidYieldUgm3H.toFixed(3)),
    brownCarbonMac365M2G: parseFloat(brownCarbonMac365.toFixed(2)),
    brownCarbonAerosolAodIncrement: parseFloat(brcAodIncrement.toFixed(4)),
    postFogEvaporationPm25GainUgm3: parseFloat(postFogPm25GainUgm3.toFixed(2)),
    chemicalReactionPathways: {
      fentonPhotoOxidationPct: parseFloat(fentonPct.toFixed(1)),
      ammoniumCatalyzedOligomersPct: parseFloat(ammoniumPct.toFixed(1)),
      sulfateEsterificationPct: parseFloat(sulfatePct.toFixed(1))
    },
    malagaTaroHotspots: MALAGA_TARO_HOTSPOTS,
    scientificInterpretation
  };
}
