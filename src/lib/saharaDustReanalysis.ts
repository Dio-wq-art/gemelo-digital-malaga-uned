/**
 * Módulo de Reanálisis de Episodios de Calima (Polvo Sahariano)
 * y Química Heterogénea sobre Aerosoles Minerales.
 * Tesis Doctoral: Gemelo Digital de Málaga.
 * 
 * Formulación determinista basada en datos observacionales Copernicus CAMS y AEMET.
 */

export interface DustReanalysisParams {
  dustConcentrationUgm3: number; // Concentración de polvo mineral (µg/m³)
  aod550nm: number;               // Aerosol Optical Depth a 550nm (CAMS)
  tempC: number;
  relHumidityPct: number;
  windSpeedKmh: number;
}

export interface MineralFraction {
  name: string;
  chemicalFormula: string;
  weightPct: number;
  refractiveIndex: string;
  roleDescription: string;
}

export interface DustReanalysisResult {
  dustMassLoadingUgm3: number;
  extinctionCoefficientMm1: number;       // Coeficiente de extinción óptica alpha_ext (Mm⁻¹)
  heterogeneousReactionRateS1: number;   // Tasa heterogénea k_het (NO2 + dust -> HONO / HNO3) (s⁻¹)
  uvSolarAttenuationPct: number;          // Porcentaje de atenuación de radiación solar UV por la nube de polvo (%)
  honoSecondaryProductionPpbh: number;   // Producción secundaria de Ácido Nitroso (HONO) en superficie de polvo (ppb/h)
  airQualityImpactCategory: string;
  mitigationRecommendation: string;

  // Nuevas métricas avanzadas de mineralogía, óptica y transporte WMO SDS-WAS / SKIRON
  angstromExponent: number;               // Exponente de Ångström alpha (440-870 nm) (~0.1-0.3 para polvo grueso)
  singleScatteringAlbedo550: number;      // Albedo de Dispersión Simple SSA_550 (~0.92-0.96)
  asymmetryParameterG: number;             // Factor de Asimetría g (~0.72)
  ironSolubleFluxUgm2Day: number;         // Flujo de deposición de Hierro Soluble Fe(II/III) a las aguas del Mar de Alborán (µg/m²/día)
  mineralMatrix: MineralFraction[];
  transportElevationLayerM: string;       // Capa de advección (ej. 1200 - 2800 m MSL)
  cloudCondensationNucleiCCN: number;    // Núcleos de condensación de nubes activados (cm⁻³)
  n2o5UptakeCoefficient: number;         // Coeficiente de captura heterogénea gamma(N2O5)
}

/**
 * Reanálisis físico-químico determinista del polvo sahariano advectado sobre Málaga.
 */
export function analyzeSaharaDustAdvection(params: DustReanalysisParams): DustReanalysisResult {
  const { dustConcentrationUgm3, aod550nm, tempC, relHumidityPct, windSpeedKmh } = params;

  // 1. Coeficiente de extinción óptica alpha_ext = AOD / PBLH_eff (Mm^-1)
  const pblh_eff_km = 0.8; // 800m
  const extinctionCoefficientMm1 = Number(((aod550nm / pblh_eff_km) * 1000).toFixed(1));

  // 2. Cálculo del área superficial específica del polvo (S_dust, m²/m³)
  // S_dust = 6 * Mass_dust / (rho_dust * D_p_eff)
  // rho_dust = 2.65 g/cm³ (densidad mineral de cuarzo/aluminosilicatos), D_p = 2.5 µm
  const s_dust_m2_m3 = (6 * (dustConcentrationUgm3 * 1e-6)) / (2.65e3 * 2.5e-6);

  // 3. Tasa de Reacción Heterogénea k_het (NO2 sobre polvo sahariano)
  // k_het = (gamma * v_bar_NO2 * S_dust) / 4
  // gamma = Coeficiente de acomodación reactiva (Underwood et al., 2001) ~ 1.2e-4
  const gamma_no2 = 1.2e-4 * (1 + 0.005 * relHumidityPct);
  const tempK = tempC + 273.15;
  const v_bar_no2 = Math.sqrt((8 * 8.314 * tempK) / (Math.PI * 0.046)); // Velocidad térmica media del NO2 (~370 m/s)
  
  const k_het_s1 = (gamma_no2 * v_bar_no2 * s_dust_m2_m3) / 4;
  const heterogeneousReactionRateS1 = Number(k_het_s1.toFixed(6));

  // 4. Atenuación solar por esparcimiento (scattering) y absorción del polvo mineral (Beer-Lambert Law)
  const transmittance = Math.exp(-0.45 * aod550nm);
  const uvSolarAttenuationPct = Number(((1 - transmittance) * 100).toFixed(1));

  // 5. Producción fotoquímica heterogénea secundaria de Ácido Nitroso (HONO)
  // 2 NO2 + H2O (surface) -> HONO + HNO3
  const hono_prod_ppb_h = (k_het_s1 * 3600 * 20.0) * 0.5; // Asumiendo 20 ppb de NO2 basal
  const honoSecondaryProductionPpbh = Number(hono_prod_ppb_h.toFixed(2));

  // 6. Propiedades ópticas y microfísicas deterministas
  // Exponente de Ångström α (440-870 nm): dislocación entre aerosol grueso (polvo mineral ~0.15) y fino
  const angstromExponent = Number(Math.max(0.08, 0.45 - 0.35 * Math.min(1.0, aod550nm)).toFixed(2));
  
  // Albedo de Dispersión Simple (SSA_550): absorción en el azul/UV por hematita Fe2O3
  const singleScatteringAlbedo550 = Number(Math.max(0.89, 0.96 - 0.04 * (dustConcentrationUgm3 / 200)).toFixed(3));
  const asymmetryParameterG = 0.72; // Factor de asimetría g característico de esferoides de polvo mineral

  // 7. Deposición de Hierro Bioasimilable al Mar de Alborán (Bahía de Málaga)
  // Contenido medio de Fe en polvo sahariano ~ 4.4% en peso, solubilidad ~ 1.5%
  const dryDepositionVelocityM_s = 0.008; // 0.8 cm/s para partículas gruesas de polvo
  const ironMassConcentrationUgm3 = dustConcentrationUgm3 * 0.044;
  const ironSolubleFluxUgm2Day = Number((ironMassConcentrationUgm3 * dryDepositionVelocityM_s * 86400 * 0.015).toFixed(2));

  // 8. Captura heterogénea de N2O5 (gamma_N2O5)
  const n2o5UptakeCoefficient = Number((1.5e-3 * (1 + 0.01 * relHumidityPct)).toFixed(5));

  // 9. Núcleos de Condensación de Nubes (CCN at S=0.2%)
  const cloudCondensationNucleiCCN = Math.round(120 + dustConcentrationUgm3 * 4.2);

  // 10. Matriz de Composición Mineralógica Típica de Argelia/Marruecos (Bodélé / Erg Chebbi)
  const mineralMatrix: MineralFraction[] = [
    {
      name: 'Cuarzo / Silicatos',
      chemicalFormula: 'SiO₂',
      weightPct: 58.5,
      refractiveIndex: '1.544 + 0.0001i',
      roleDescription: 'Estructura mineral inerte, esparcimiento elástico Mie de radiación solar onda corta.'
    },
    {
      name: 'Illita / Caolinita (Aluminosilicatos)',
      chemicalFormula: 'Al₂Si₂O₅(OH)₄',
      weightPct: 24.2,
      refractiveIndex: '1.560 + 0.001i',
      roleDescription: 'Alta área superficial específica (S_dust). Matriz para advección heterogénea de NO₂ y HONO.'
    },
    {
      name: 'Calcita / Carbonato Cálcico',
      chemicalFormula: 'CaCO₃',
      weightPct: 9.8,
      refractiveIndex: '1.658 + 0.0005i',
      roleDescription: 'Capacidad de neutralización ácida (buffer) frente a condensación de H₂SO₄ y HNO₃.'
    },
    {
      name: 'Hematita / Goethita (Óxidos de Hierro)',
      chemicalFormula: 'Fe₂O₃ / FeO(OH)',
      weightPct: 4.4,
      refractiveIndex: '2.90 + 0.25i',
      roleDescription: 'Absorbedor dominante de radiación UV/azul. Fuente bioasimilable de Fe(III) para fitoplancton.'
    },
    {
      name: 'Yeso / Sulfatos Minerales',
      chemicalFormula: 'CaSO₄·2H₂O',
      weightPct: 3.1,
      refractiveIndex: '1.521 + 0.0001i',
      roleDescription: 'Núcleo higroscópico precursor de formación de condensación en la capa límite costera.'
    }
  ];

  const transportElevationLayerM = dustConcentrationUgm3 > 80 
    ? '1000 - 3200 m MSL (Capa Capa Limite Inmersa)' 
    : '1500 - 2800 m MSL (Capa Capa Sahariana Superior SAL)';

  let airQualityImpactCategory = 'Nulo / Fondo Limpio';
  let mitigationRecommendation = 'Condiciones atmosféricas despejadas de polvo mineral.';

  if (dustConcentrationUgm3 >= 100 || aod550nm >= 0.8) {
    airQualityImpactCategory = 'Severo (Intrusión Sahariana Masiva / Alerta Sanitaria)';
    mitigationRecommendation = 'Intrusión grave de aire sahariano. Alta tasa de formación de HONO fotoquímico. Activar avisos epidemiológicos por fracción PM10 inhalable (>150 µg/m³).';
  } else if (dustConcentrationUgm3 >= 40 || aod550nm >= 0.35) {
    airQualityImpactCategory = 'Moderado (Intrusión Sahariana Notoria)';
    mitigationRecommendation = 'Polvo mineral en suspensión en la capa límite. Atenuación radiativa moderada (15-30%) e incremento del crecimiento de aerosoles por humedad.';
  } else if (dustConcentrationUgm3 >= 15) {
    airQualityImpactCategory = 'Leve (Advección Residual Norte de África)';
    mitigationRecommendation = 'Presencia ligera de polvo en capas medias/altas sin riesgo sanitario inmediato.';
  }

  return {
    dustMassLoadingUgm3: dustConcentrationUgm3,
    extinctionCoefficientMm1,
    heterogeneousReactionRateS1,
    uvSolarAttenuationPct,
    honoSecondaryProductionPpbh,
    airQualityImpactCategory,
    mitigationRecommendation,
    angstromExponent,
    singleScatteringAlbedo550,
    asymmetryParameterG,
    ironSolubleFluxUgm2Day,
    mineralMatrix,
    transportElevationLayerM,
    cloudCondensationNucleiCCN,
    n2o5UptakeCoefficient
  };
}
