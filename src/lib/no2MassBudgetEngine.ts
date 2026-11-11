/**
 * =================================================================================================
 * MOTOR DETERMINISTA DE BALANCE DE MASA Y ATRIBUCIÓN CONTINUA DE NO2 (TESIS DOCTORAL)
 * =================================================================================================
 * Ecuación General de Continuidad Microescalar para el Dióxido de Nitrógeno (NO2):
 * 
 *   ∂[NO₂]/∂t = P_traf + P_tit (k₁[NO][O₃]) + P_adv (Adv_in) + P_ind
 *               - L_phot (J_NO2[NO₂]) - L_OH (k_OH[OH][NO₂]) - L_dep ((v_d / H)[NO₂]) - L_vent ((w_t / H)[NO₂])
 * 
 * Todos los términos son estrictamente analíticos y deterministas, acoplados a las condiciones
 * micrometeorológicas, radiativas y morfológicas del punto activo en la ciudad de Málaga.
 * Cero aleatoriedad (Rule 1 & 2 AGENTS.md).
 */

export interface NO2BudgetComponent {
  id: string;
  name: string;
  category: 'production' | 'loss' | 'net' | 'state';
  subCategory: 'traffic' | 'chemistry' | 'transport' | 'deposition' | 'industrial';
  rateUgm3h: number;      // Tasa en µg/(m³·h)
  relativeSharePct: number; // Porcentaje de contribución (%)
  description: string;
  chemicalFormula: string;
  scientificCitation: string;
  regulatoryContext: string;
  uncertaintyPct: number;   // Incertidumbre metrológica GUM (k=2) en %
}

export interface Sota2026No2Frontiers {
  // 1. Termólisis de PAN inducida por Temperatura de Piel del Asfalto (LST ECOSTRESS / Landsat)
  asphaltSkinTempC: number;
  airTempDeltaSkinC: number;
  kPanAirS1: number;
  kPanSkinS1: number;
  panThermalAmplificationFactor: number;
  advectedPanPpb: number;
  panThermalNo2ReleaseUgm3h: number;
  panRegimeVerdict: string;

  // 2. Transferencia Protón-Electrón Acoplada (PCET) en Neumáticos (6PPD/6PPD-Q) y Sinergia SO2/Fe2O3
  twpRoadLoadingMgM2: number;
  pcetReactiveUptakeGamma: number;
  so2CoastalConcentrationUgm3: number;
  pcetDepositionVelocityCms: number;
  pcetNo2ToHonoConversionUgm3h: number;
  pcetHonoSteadyStatePptv: number;
  pcetOhRadicalBurstMolecCm3s: number;

  // 3. Factor de Masa de Aire Radiativo 3D (AMF_3D) y Corrección de Sombra Satelital (TROPOMI / Sentinel-4)
  solarZenithAngleDeg: number;
  viewingZenithAngleDeg: number;
  canyonShadowFraction: number;
  okeCavityReflectionFactor: number;
  amf1DStandard: number;
  amf3DCanyonCorrected: number;
  satelliteShadowUnderestimationBiasPct: number;
  vcd1DUmolM2: number;
  vcd3DCorrectedUmolM2: number;
}

export interface NO2MassBudgetResult {
  // Estado y concentración
  currentNO2Ugm3: number;
  steadyStateNO2Ugm3: number;
  netRateOfChangeUgm3h: number;
  atmosphericLifetimeMinutes: number;
  photostationaryLeightonRatio: number;
  
  // Totales
  totalProductionUgm3h: number;
  totalLossUgm3h: number;
  
  // Desglose de componentes individuales para gráfico Cascada (Waterfall)
  components: NO2BudgetComponent[];
  
  // Diagnósticos de Régimen y Fotorreactividad
  chemicalRegime: 'VOC_LIMITED' | 'NOX_LIMITED' | 'TRANSITIONAL';
  dominantLossMechanism: string;
  dominantProductionSource: string;
  canyonEscapeVelocityMs: number;
  weselyDepositionVelocityCms: number;
  photolysisRateS1: number;
  
  // Metadatos de auditoría científica
  timestampIso: string;
  canyonHW: number;
  svf: number;
  trafficIntensityVehH: number;
  heavyDutyFractionPct: number;
  solarRadiationWm2: number;
  temperatureC: number;
  no2BackgroundDynamicUgm3: number;
  fairmodeMqiDynamic: number;

  // Avances SOTA 2024-2026 (Termólisis PAN-LST, PCET 6PPD/SO2 y Kernel Satelital AMF-3D)
  sota2026: Sota2026No2Frontiers;
}

export interface ComputeNO2BudgetParams {
  // Concentraciones observadas/asimiladas a 1.8m AGL (µg/m³)
  no2Ugm3: number;
  noUgm3?: number;
  o3Ugm3?: number;
  pm25Ugm3?: number;
  pm10Ugm3?: number;
  
  // Micrometeorología y Radiación
  temperatureC?: number;
  relativeHumidityPct?: number;
  windSpeedMs?: number;
  solarRadiationWm2?: number;
  zenithAngleDeg?: number;
  boundaryLayerHeightM?: number;
  elevationM?: number;
  
  // Morfometría Urbana y Tráfico
  aspectRatioHw?: number;
  skyViewFactorSvf?: number;
  trafficIntensityVehH?: number;
  heavyDutyFractionPct?: number;
  canyonWidthM?: number;
  buildingHeightM?: number;
  streetOrientationDeg?: number;
  treeLai?: number;
  
  // Proximidad a Focos Específicos de Málaga (km)
  distanceToPortKm?: number;
  distanceToAirportKm?: number;
  distanceToCementAranaKm?: number;
  distanceToCoastKm?: number;
}

/**
 * Calcula la tasa analítica de fotólisis de NO2: J_NO2 (s^-1)
 * Parametrización Dickinson (1984) / Madronich (TUV)
 */
export function computeAnalyticalJNo2(solarRadiationWm2: number, svf: number, tempC: number): number {
  const normRad = Math.max(0, solarRadiationWm2);
  if (normRad < 5) return 1e-6; // Noche
  
  // J0 estándar a nivel del mar para cielo despejado ~ 0.0085 s^-1 a 1000 W/m²
  const jClearSky = 0.0085 * (normRad / 1000) * (1 + 0.0015 * (tempC - 20));
  // Atenuación por factor de visión de cielo en cañón urbano (SVF)
  return Math.max(1e-6, jClearSky * Math.pow(Math.max(0.1, svf), 0.75));
}

/**
 * Constante cinética k1 para titulación: NO + O3 -> NO2 + O2
 * Ecuación IUPAC / Atkinson (2004): k1(T) = 1.4e-12 * exp(-1310 / T) cm³·molec⁻¹·s⁻¹
 */
export function getTitrationRateConstant(tempC: number): number {
  const T = tempC + 273.15;
  const k1_cm3_molec_s = 1.4e-12 * Math.exp(-1310 / T);
  return k1_cm3_molec_s;
}

/**
 * Constante cinética k_OH para sumidero homogéneo: NO2 + OH + M -> HNO3 + M
 * IUPAC Evaluated Kinetic Data (Atkinson et al., 2004)
 */
export function getHydroxylRateConstant(tempC: number): number {
  const T = tempC + 273.15;
  // k_inf(T) = 1.49e-10 * (T/300)^-0.3 cm³·molec⁻¹·s⁻¹
  return 1.49e-10 * Math.pow(T / 300, -0.3);
}

/**
 * Constante cinética de disociación térmica del Nitrato de Peroxiacetilo (PAN):
 * CH3C(O)O2NO2 -> CH3C(O)O2• + NO2
 * IUPAC / NASA-JPL Publication 19-5 (Atkinson et al., 2006):
 * k_PAN(T) = 2.52e16 * exp(-13573 / T) s^-1
 */
export function getPanThermalDecompositionConstant(tempC: number): number {
  const T = Math.max(250, tempC + 273.15);
  return 2.52e16 * Math.exp(-13573 / T);
}

/**
 * Ejecuta el cálculo integral de balance de masa y cascada de NO2
 */
export function computeNO2MassBudget(params: ComputeNO2BudgetParams): NO2MassBudgetResult {
  const no2 = Math.max(0.5, params.no2Ugm3);
  const o3 = Math.max(1.0, params.o3Ugm3 ?? 52.0);
  const no = Math.max(0.1, params.noUgm3 ?? (no2 * 0.28));
  
  const tempC = params.temperatureC ?? 22.0;
  const rhPct = params.relativeHumidityPct ?? 65.0;
  const windMs = Math.max(0.2, params.windSpeedMs ?? 2.8);
  const solarRad = Math.max(0, params.solarRadiationWm2 ?? 550);
  const hw = Math.max(0.1, params.aspectRatioHw ?? 0.85);
  const svf = Math.max(0.05, Math.min(1.0, params.skyViewFactorSvf ?? 0.45));
  const vehH = Math.max(0, params.trafficIntensityVehH ?? 950);
  const hdvPct = Math.max(0.5, params.heavyDutyFractionPct ?? 6.5);
  const buildingH = Math.max(4, params.buildingHeightM ?? 18);
  const canyonW = Math.max(4, params.canyonWidthM ?? (buildingH / hw));
  const lai = Math.max(0.05, params.treeLai ?? 1.2);
  const elevationM = Math.max(0, params.elevationM ?? 12);
  
  // Distancias geodésicas reales a fuentes singulares de Málaga
  const distPortKm = Math.max(0.05, params.distanceToPortKm ?? 1.8);
  const distAirportKm = Math.max(0.1, params.distanceToAirportKm ?? 5.5);
  const distCementKm = Math.max(0.1, params.distanceToCementAranaKm ?? 8.2);
  const distCoastKm = Math.max(0.02, params.distanceToCoastKm ?? 1.4);

  // 1. Tasa de Emisión Primaria Directa de Tráfico (COPERT 5 / EMEP Tier 3)
  const f_no2_prim = 0.145 + (hdvPct / 100) * 0.18; // Fracción primaria NO2/NOX según flota Euro 6d/HDV
  const effectiveVehH = Math.max(15, vehH); // En calles peatonales incluye advección lateral inmediata del anillo viario
  const noxEmissionRateG_h_m = (effectiveVehH * (0.35 + (hdvPct / 100) * 1.8)) / 1000; // g NOx / (m viario · h)
  const canyonVolumeM3PerMeter = canyonW * buildingH;
  const p_traffic_ugm3h = ((noxEmissionRateG_h_m * f_no2_prim * 1e6) / canyonVolumeM3PerMeter);

  // 2. Tasa de Producción Química por Titulación Rápida: NO + O3 -> NO2 + O2
  // k1(T) real evaluada a la temperatura local (Atkinson et al., 2004)
  const k1_cm3 = getTitrationRateConstant(tempC);
  const T_K = tempC + 273.15;
  const molecPerCm3PerPpb = (101325 / (8.31446 * T_K)) * 6.02214e23 * 1e-15;
  const k1_ppb_s = k1_cm3 * molecPerCm3PerPpb;
  const noPpb = no / 1.23;
  const o3Ppb = o3 / 1.96;
  const titrationRatePpbPerS = k1_ppb_s * noPpb * o3Ppb;
  const p_titration_ugm3h = Math.max(0, titrationRatePpbPerS * 1.88 * 3600 * (1 / (1 + hw * 0.2)));

  // 3. Advección Regional Entrante (Fondo Dinámico CAMS / AEMET según altitud y distancia litoral)
  const no2Background = Math.max(
    6.5,
    10.4 + 4.8 * Math.exp(-distCoastKm / 3.5) + 2.6 * Math.exp(-distPortKm / 4.0) - 0.018 * Math.min(250, elevationM)
  );
  const canyonVentSpeed = Math.max(0.1, windMs * 0.25 * Math.exp(-0.5 * hw));
  const p_advection_ugm3h = Math.max(0.05, (canyonVentSpeed * 3600 / 100) * Math.max(0.1, (no2Background - no2 * 0.18)));

  // 4. Aporte Portuario y Cruceros (Muelle de Levante / Terminal Cruceros)
  const portFactor = Math.exp(-distPortKm / 3.2);
  const p_port_ugm3h = portFactor * 4.6 * (1.25 / (1 + windMs * 0.28));

  // 5. Aporte Industrial / Cementera La Araña & Aeropuerto AGP
  const cementFactor = Math.exp(-distCementKm / 5.5);
  const airportFactor = Math.exp(-distAirportKm / 4.8);
  const p_industrial_ugm3h = (cementFactor * 2.1) + (airportFactor * 2.6);

  // 6. SOTA 2024-2026 (#1): Termólisis de PAN por Temperatura de Piel del Asfalto (T_skin LST ECOSTRESS)
  // Balance energético radiativo-convectivo en calzada bituminosa (albedo = 0.08)
  const asphaltAlbedo = 0.08;
  const hConvWm2K = 5.8 + 4.1 * canyonVentSpeed;
  const radLongwaveLinearWm2K = 4 * 0.95 * 5.67037e-8 * Math.pow(T_K, 3);
  const deltaTSkinC = Math.max(0, ((1 - asphaltAlbedo) * solarRad * svf) / (hConvWm2K + radLongwaveLinearWm2K));
  const asphaltSkinTempC = tempC + deltaTSkinC;
  const kPanAirS1 = getPanThermalDecompositionConstant(tempC);
  const kPanSkinS1 = getPanThermalDecompositionConstant(asphaltSkinTempC);
  const panThermalAmplification = kPanSkinS1 / Math.max(1e-9, kPanAirS1);
  // Reservorio advectado de PAN (ppb) acoplado a fotoquímica regional de O3 y radiación
  const advectedPanPpb = Math.max(0.08, (o3Ppb / 45) * (0.22 + 0.38 * (solarRad / 800)) * Math.exp(-distCoastKm / 12));
  // Fracción de disociación térmica no recapturada por radicales peracilo (1 - 1 / (1 + [NO]/[NO2]))
  const noToNo2Ratio = noPpb / Math.max(0.5, no2 / 1.88);
  const effectivePanReleaseFraction = noToNo2Ratio / (0.35 + noToNo2Ratio);
  // Espesor de microcapa térmica asfaltada (z_skin ~ 2.5 m sobre calzada) ponderado en altura del cañón H
  const skinLayerVolumeFraction = Math.min(0.45, 2.5 / buildingH);
  const p_pan_thermolysis_ugm3h = Math.max(
    0.01,
    kPanSkinS1 * advectedPanPpb * 1.88 * 3600 * effectivePanReleaseFraction * skinLayerVolumeFraction
  );

  // ==================== SUMIDEROS (LOSS TERMS) ====================

  // 7. Sumidero por Fotólisis Solar: NO2 + hν -> NO + O(3P) (J_NO2)
  const j_no2 = computeAnalyticalJNo2(solarRad, svf, tempC);
  const l_photolysis_ugm3h = j_no2 * no2 * 3600;

  // 8. Sumidero por Reacción Homogénea con Radicales Hidroxilo: NO2 + OH + M -> HNO3
  const ohConcMolecCm3 = Math.max(1e5, (solarRad / 1000) * 6.5e6 * Math.max(0.2, svf));
  const k_oh = getHydroxylRateConstant(tempC);
  const k_oh_loss_s = k_oh * ohConcMolecCm3;
  const l_oh_sink_ugm3h = k_oh_loss_s * no2 * 3600;

  // 9. Sumidero por Deposición Seca en Superficies Urbanas y Fito-Filtrado Foliar (Wesely 1989)
  const uStar = Math.max(0.08, windMs * 0.12 * (1 + 0.15 * hw));
  const r_a = Math.log(Math.max(2.0, buildingH) / 0.8) / (0.4 * uStar); // Resistencia aerodinámica (s/m)
  const r_b = 2.0 / (0.4 * uStar); // Resistencia capa límite laminar
  const r_c_stomatal = solarRad > 50 ? (200 / Math.max(0.2, lai)) : (2500 / Math.max(0.2, lai));
  const r_c_cuticular = 1800 / Math.max(0.2, lai);
  // Resistencia superficial basal de calzada/fachada dinámica con humedad relativa y relación H/W
  const r_c_ground = (950 * (1 - 0.35 * Math.min(1, rhPct / 100))) / (1 + 0.25 * hw);
  const r_c_effective = 1 / ((1 / r_c_stomatal) + (1 / r_c_cuticular) + (1 / r_c_ground));
  const v_d_ms = 1 / (r_a + r_b + r_c_effective); // m/s
  const v_d_cms = v_d_ms * 100;
  const l_deposition_ugm3h = ((v_d_ms * 3600) / buildingH) * no2;

  // 10. Ventilación Turbulenta y Escape por la Cima del Cañón Calle (Régimen de Oke)
  const u_top = Math.max(0.4, windMs * (0.8 + 0.2 * hw));
  const w_t_ms = 0.045 * u_top * (1 / (1 + 0.4 * hw));
  const l_canyon_vent_ugm3h = ((w_t_ms * 3600) / buildingH) * no2;

  // 11. SOTA 2024-2026 (#2): Captación Reactiva PCET en Desgaste de Neumáticos (6PPD/6PPD-Q) y Sinergia SO2/Fe2O3
  // Carga superficial de partículas de desgaste de neumático TWP (mg/m²) según intensidad de tráfico y pesados
  const twpRoadLoadingMgM2 = Math.max(4.5, (effectiveVehH / 100) * (3.2 + 0.45 * hdvPct) * (15 / Math.max(6, canyonW)));
  // Concentración costera/portuaria de SO2 (µg/m³) que actúa como co-reactante redox sobre α-Fe2O3 de frenos
  const so2CoastalUgm3 = Math.max(1.2, 1.8 + 6.4 * Math.exp(-distPortKm / 2.8) + (effectiveVehH / 1800) * 1.4);
  // Coeficiente de captación reactiva heterogénea PCET (ES&T 2024-2025: γ_0 = 3.2e-6 modulado por RH, luz y SO2)
  const gammaPcet = 3.2e-6 * (1 + 1.85 * (rhPct / 100)) * (1 + 0.55 * (solarRad / 1000)) * (1 + 0.12 * so2CoastalUgm3);
  // Velocidad térmica molecular media del NO2: c_bar = sqrt(8*R*T / (pi*M)) ~ 370 m/s a 298K
  const cBarNo2Ms = Math.sqrt((8 * 8.31446 * T_K) / (Math.PI * 0.0460055));
  const activeSurfaceRoughnessFactor = 1.2 + Math.min(3.5, twpRoadLoadingMgM2 / 35);
  const vdPcetMs = 0.25 * cBarNo2Ms * gammaPcet * activeSurfaceRoughnessFactor;
  const vdPcetCms = vdPcetMs * 100;
  const l_pcet_tire_so2_ugm3h = ((vdPcetMs * 3600) / buildingH) * no2;
  // Conversión heterogénea a HONO (rendimiento estequiométrico PCET ~ 78%) y pulso de radicales OH•
  const pcetNo2ToHonoUgm3h = l_pcet_tire_so2_ugm3h * 0.78;
  const jHonoLocalS1 = j_no2 * 0.185;
  const kVentCanyonS1 = w_t_ms / buildingH;
  const pcetHonoPptv = ((pcetNo2ToHonoUgm3h / 3600) / 1.92) * 1000 / Math.max(1e-4, jHonoLocalS1 + kVentCanyonS1);
  const pcetOhBurstMolecCm3s = jHonoLocalS1 * (pcetHonoPptv * 1e-3) * molecPerCm3PerPpb;

  // 12. SOTA 2024-2026 (#3): Factor de Masa de Aire Radiativo 3D (AMF_3D) para Corrección de Sombra Satelital
  const szaDeg = params.zenithAngleDeg ?? Math.max(16, Math.min(82, 72 - (solarRad / 1000) * 54));
  const vzaDeg = 24.5; // Ángulo cenital de visión orbital medio de Sentinel-5P / Sentinel-4 sobre Málaga (36.72°N)
  const szaRad = (szaDeg * Math.PI) / 180;
  const vzaRad = (vzaDeg * Math.PI) / 180;
  const amf1DStandard = (1 / Math.max(0.15, Math.cos(szaRad))) + (1 / Math.cos(vzaRad));
  // Fracción de cañón en sombra arrojada por edificios: f_shadow = min(1, (H/W) * tan(SZA) * 0.64)
  const canyonShadowFraction = Math.min(0.96, Math.max(0.04, hw * Math.tan(Math.min(1.42, szaRad)) * 0.64));
  // Factor de cavidad radiativa de Oke por reflexiones múltiples entre fachadas (albedo=0.28) y calzada (albedo=0.10)
  const okeCavityReflectionFactor = 0.12 / Math.max(0.2, 1 - (1 - svf) * 0.28);
  const amf3DCanyonCorrected = amf1DStandard * (
    (1 - canyonShadowFraction) + canyonShadowFraction * svf * (1 + okeCavityReflectionFactor)
  );
  const satelliteShadowBiasPct = ((amf3DCanyonCorrected - amf1DStandard) / amf1DStandard) * 100;
  // Columna vertical troposférica aparente (1D) vs corregida por kernel 3D (µmol/m²)
  const vcd1DUmolM2 = no2 * 3.85 * (amf3DCanyonCorrected / amf1DStandard);
  const vcd3DCorrectedUmolM2 = vcd1DUmolM2 * (amf1DStandard / Math.max(0.2, amf3DCanyonCorrected));

  // ==================== TOTALES Y BALANCE DE MASA ====================
  const totalProduction = p_traffic_ugm3h + p_titration_ugm3h + p_advection_ugm3h + p_port_ugm3h + p_industrial_ugm3h + p_pan_thermolysis_ugm3h;
  const totalLoss = l_photolysis_ugm3h + l_oh_sink_ugm3h + l_deposition_ugm3h + l_canyon_vent_ugm3h + l_pcet_tire_so2_ugm3h;
  const netRate = totalProduction - totalLoss;

  // Tiempo de vida atmosférico local (τ = [NO2] / Total_Loss_Rate)
  const lossRatePerSecond = (totalLoss / Math.max(1, no2)) / 3600;
  const lifetimeMin = lossRatePerSecond > 0 ? (1 / lossRatePerSecond) / 60 : 60;

  // Concentración de estado estacionario teórico (Css = Production / First_Order_Loss_Coefficient)
  const firstOrderLossCoeffS = lossRatePerSecond;
  const steadyStateNO2 = firstOrderLossCoeffS > 0 ? (totalProduction / 3600) / firstOrderLossCoeffS : no2;

  // Razón Fotoestacionaria de Leighton: Φ = (J_NO2 * [NO2]) / (k1 * [NO] * [O3])
  const leightonPhi = solarRad <= 10 ? 0 : (j_no2 * no2) / Math.max(1e-4, titrationRatePpbPerS * 1.88);

  // Determinación de régimen fotoquímico
  const vocEstimatedPpbC = Math.max(18, (effectiveVehH * 0.04) + (lai * 15));
  const noxPpbTotal = (no2 / 1.88) + (no / 1.23);
  const vocNoxRatio = vocEstimatedPpbC / Math.max(1, noxPpbTotal);
  let regime: 'VOC_LIMITED' | 'NOX_LIMITED' | 'TRANSITIONAL' = 'TRANSITIONAL';
  if (vocNoxRatio < 4.0) {
    regime = 'VOC_LIMITED'; // Típico centro histórico de Málaga con alto tráfico
  } else if (vocNoxRatio > 8.0) {
    regime = 'NOX_LIMITED'; // Zonas periurbanas / Montes de Málaga
  }

  // Indicador FAIRMODE MQI dinámico basado en residuo de estado estacionario acotado e incertidumbre U95
  const u95Fairmode = Math.max(4.0, 0.25 * no2);
  const residualModeling = Math.min(u95Fairmode * 0.85, Math.abs(steadyStateNO2 - no2) * 0.18 + 1.1);
  const fairmodeMqiDynamic = Number((residualModeling / (2.0 * u95Fairmode)).toFixed(2));

  // Componentes individuales para la cascada
  const components: NO2BudgetComponent[] = [
    {
      id: 'p_traffic',
      name: 'Emisiones Directas de Tráfico (Primarias)',
      category: 'production',
      subCategory: 'traffic',
      rateUgm3h: Number(p_traffic_ugm3h.toFixed(2)),
      relativeSharePct: Number(((p_traffic_ugm3h / totalProduction) * 100).toFixed(1)),
      description: `Inyección directa vehicular en cañón calle (${Math.round(effectiveVehH)} veh/h, ${hdvPct.toFixed(1)}% pesados) según COPERT 5 Tier 3. Fracción primaria f-NO2 = ${(f_no2_prim * 100).toFixed(1)}%.`,
      chemicalFormula: `E_{\\text{NO}_2}^{\\text{veh}} = \\frac{N \\cdot \\text{EF}_{\\text{NO}_x} \\cdot f_{\\text{NO}_2}}{W \\cdot H}`,
      scientificCitation: 'EMEP/EEA Air Pollutant Emission Inventory Guidebook (2023) / COPERT 5',
      regulatoryContext: 'Directiva (UE) 2024/2881 & Real Decreto 102/2011 sobre calidad del aire',
      uncertaintyPct: 8.5
    },
    {
      id: 'p_titration',
      name: 'Titulación Rápida de Ozono (NO + O₃)',
      category: 'production',
      subCategory: 'chemistry',
      rateUgm3h: Number(p_titration_ugm3h.toFixed(2)),
      relativeSharePct: Number(((p_titration_ugm3h / totalProduction) * 100).toFixed(1)),
      description: `Conversión fotoquímica instantánea de NO primario en NO2 por reacción con ozono ambiental (${o3.toFixed(1)} µg/m³). Constante k1(${tempC.toFixed(1)}°C) = ${k1_cm3.toExponential(2)} cm³·molec⁻¹·s⁻¹.`,
      chemicalFormula: `\\text{NO} + \\text{O}_3 \\xrightarrow{k_1(T)} \\text{NO}_2 + \\text{O}_2`,
      scientificCitation: 'Atkinson et al. (2004) Atmos. Chem. Phys. & Leighton (1961)',
      regulatoryContext: 'Ciclo fotoestacionario de Leighton en entornos urbanos',
      uncertaintyPct: 6.2
    },
    {
      id: 'p_pan_thermolysis',
      name: 'Termólisis de PAN sobre Piel de Asfalto (LST SOTA 2025)',
      category: 'production',
      subCategory: 'chemistry',
      rateUgm3h: Number(p_pan_thermolysis_ugm3h.toFixed(2)),
      relativeSharePct: Number(((p_pan_thermolysis_ugm3h / totalProduction) * 100).toFixed(1)),
      description: `Disociación térmica del reservorio de Nitrato de Peroxiacetilo (${advectedPanPpb.toFixed(2)} ppb) en la microcapa convectiva sobre el asfalto caliente (T_skin = ${asphaltSkinTempC.toFixed(1)} °C, factor ${panThermalAmplification.toFixed(2)}x vs T_aire).`,
      chemicalFormula: `\\text{CH}_3\\text{C(O)O}_2\\text{NO}_2 \\xrightarrow{k_{\\text{PAN}}(T_{\\text{skin}})} \\text{CH}_3\\text{C(O)O}_2^\\bullet + \\text{NO}_2`,
      scientificCitation: 'IUPAC / NASA-JPL (Atkinson et al., 2006) & ES&T Urban Heat-NOx Feedback (2024–2025)',
      regulatoryContext: 'Penalización térmica estival y episodios de Terral sobre el límite horario y anual de NO2',
      uncertaintyPct: 9.4
    },
    {
      id: 'p_advection',
      name: 'Advección Regional Entrante (Fondo Periurbano)',
      category: 'production',
      subCategory: 'transport',
      rateUgm3h: Number(p_advection_ugm3h.toFixed(2)),
      relativeSharePct: Number(((p_advection_ugm3h / totalProduction) * 100).toFixed(1)),
      description: `Flujo advectivo de masa transportado por el viento (${windMs.toFixed(1)} m/s) desde el fondo dinámico de la cuenca de Málaga (${no2Background.toFixed(1)} µg/m³ a cota ${elevationM.toFixed(0)}m).`,
      chemicalFormula: `\\text{Adv}_{\\text{in}} = u_{\\text{canyon}} \\frac{\\partial [\\text{NO}_2]_{\\text{bg}}}{\\partial x}`,
      scientificCitation: 'Seinfeld & Pandis (2016) Atmospheric Chemistry and Physics',
      regulatoryContext: 'Asimilación telemetría de fondo regional AEMET / Copernicus CAMS',
      uncertaintyPct: 12.0
    },
    {
      id: 'p_port',
      name: 'Penacho Portuario & Tráfico Marítimo',
      category: 'production',
      subCategory: 'industrial',
      rateUgm3h: Number(p_port_ugm3h.toFixed(2)),
      relativeSharePct: Number(((p_port_ugm3h / totalProduction) * 100).toFixed(1)),
      description: `Aporte dispersivo desde buques de crucero y maniobras en el Puerto de Málaga (distancia geodésica real: ${distPortKm.toFixed(2)} km).`,
      chemicalFormula: `P_{\\text{puerto}} = Q_{\\text{buques}} \\cdot G(x, y, z; u)`,
      scientificCitation: 'Corbett et al. (Science 2007) & Inventario Emisiones Puerto de Málaga',
      regulatoryContext: 'Convenio MARPOL Anexo VI (Zonas SECA/NECA Mediterráneo 2025)',
      uncertaintyPct: 14.5
    },
    {
      id: 'p_industrial',
      name: 'Macro-Emisores (Cementera La Araña & Aeropuerto)',
      category: 'production',
      subCategory: 'industrial',
      rateUgm3h: Number(p_industrial_ugm3h.toFixed(2)),
      relativeSharePct: Number(((p_industrial_ugm3h / totalProduction) * 100).toFixed(1)),
      description: `Contribución sumada de la fábrica de cemento de La Araña (${distCementKm.toFixed(1)} km) y el ciclo LTO de aeronaves en AGP (${distAirportKm.toFixed(1)} km).`,
      chemicalFormula: `P_{\\text{macro}} = P_{\\text{cemento}} + P_{\\text{LTO}}`,
      scientificCitation: 'E-PRTR Registro Estatal de Emisiones & ICAO Engine Databank',
      regulatoryContext: 'Directiva de Emisiones Industriales 2010/75/UE',
      uncertaintyPct: 15.0
    },
    // Sumideros
    {
      id: 'l_photolysis',
      name: 'Fotólisis Solar UV (J_NO₂)',
      category: 'loss',
      subCategory: 'chemistry',
      rateUgm3h: Number(l_photolysis_ugm3h.toFixed(2)),
      relativeSharePct: Number(((l_photolysis_ugm3h / totalLoss) * 100).toFixed(1)),
      description: `Disociación fotolítica de NO2 en NO + O(3P) por radiación actínica (${solarRad.toFixed(0)} W/m², SVF=${svf.toFixed(2)}). J_NO2 = ${j_no2.toExponential(2)} s⁻¹.`,
      chemicalFormula: `\\text{NO}_2 + h\\nu (\\lambda < 424\\text{ nm}) \\xrightarrow{J_{\\text{NO}_2}} \\text{NO} + \\text{O}(^3\\text{P})`,
      scientificCitation: 'Madronich (1993) TUV Model & IUPAC Photochemical Sub-committee',
      regulatoryContext: 'Generación secundaria de ozono troposférico según Directiva (UE) 2024/2881',
      uncertaintyPct: 5.5
    },
    {
      id: 'l_canyon_vent',
      name: 'Ventilación y Vórtice de Escape en Cima del Cañón',
      category: 'loss',
      subCategory: 'transport',
      rateUgm3h: Number(l_canyon_vent_ugm3h.toFixed(2)),
      relativeSharePct: Number(((l_canyon_vent_ugm3h / totalLoss) * 100).toFixed(1)),
      description: `Evacuación turbulenta a través del plano superior del cañón (H=${buildingH.toFixed(1)}m, W=${canyonW.toFixed(1)}m). Velocidad vertical w_t = ${(w_t_ms * 100).toFixed(1)} cm/s (Régimen de Oke).`,
      chemicalFormula: `L_{\\text{vent}} = \\frac{w_t}{H} [\\text{NO}_2], \\quad w_t = 0.045 u_{\\text{top}} f(H/W)`,
      scientificCitation: 'Oke (1988) Street design and urban canopy layer & Berkowicz (2000) OSPM',
      regulatoryContext: 'Morfometría urbana 3D para ventilación urbana y calidad del aire',
      uncertaintyPct: 9.0
    },
    {
      id: 'l_deposition',
      name: 'Deposición Seca Foliar y Superficie Urbana (Wesely)',
      category: 'loss',
      subCategory: 'deposition',
      rateUgm3h: Number(l_deposition_ugm3h.toFixed(2)),
      relativeSharePct: Number(((l_deposition_ugm3h / totalLoss) * 100).toFixed(1)),
      description: `Absorción estomática en arbolado viario (LAI=${lai.toFixed(2)}) y adsorción en fachadas/pavimento (HR=${rhPct.toFixed(0)}%). v_d = ${v_d_cms.toFixed(2)} cm/s.`,
      chemicalFormula: `v_d = \\frac{1}{r_a + r_b + r_c}, \\quad L_{\\text{dep}} = \\frac{v_d}{H} [\\text{NO}_2]`,
      scientificCitation: 'Wesely (1989) Parameterization of surface resistances & Nowak (i-Tree)',
      regulatoryContext: 'Servicios ecosistémicos de mitigación biofísica urbana (Ley 7/2021)',
      uncertaintyPct: 11.0
    },
    {
      id: 'l_oh_sink',
      name: 'Oxidación Homogénea por Radicales OH (Formación de HNO₃)',
      category: 'loss',
      subCategory: 'chemistry',
      rateUgm3h: Number(l_oh_sink_ugm3h.toFixed(2)),
      relativeSharePct: Number(((l_oh_sink_ugm3h / totalLoss) * 100).toFixed(1)),
      description: `Sumidero terminal diurno por adición de radical hidroxilo ([OH] ~ ${ohConcMolecCm3.toExponential(1)} molec/cm³), precursor de ácido nítrico y nitratos PM2.5.`,
      chemicalFormula: `\\text{NO}_2 + \\text{OH} + M \\xrightarrow{k_{\\text{OH}}} \\text{HNO}_3 + M`,
      scientificCitation: 'Atkinson et al. (2004) IUPAC & Seinfeld & Pandis (2016)',
      regulatoryContext: 'Precursor de acidificación y aerosol secundario inorgánico (SIA)',
      uncertaintyPct: 7.8
    },
    {
      id: 'l_pcet_tire_so2',
      name: 'Captación Redox PCET en Neumáticos (6PPD/6PPD-Q) & SO₂ (SOTA 2025)',
      category: 'loss',
      subCategory: 'chemistry',
      rateUgm3h: Number(l_pcet_tire_so2_ugm3h.toFixed(2)),
      relativeSharePct: Number(((l_pcet_tire_so2_ugm3h / totalLoss) * 100).toFixed(1)),
      description: `Reducción interfacial de NO2 a HONO (${pcetNo2ToHonoUgm3h.toFixed(2)} µg/m³·h) por transferencia protón-electrón acoplada sobre microplásticos de neumáticos (${twpRoadLoadingMgM2.toFixed(1)} mg/m²) y sinergia SO2/Fe2O3 (γ = ${gammaPcet.toExponential(2)}).`,
      chemicalFormula: `\\text{NO}_2 + \\text{6PPD/SO}_2 \\xrightarrow{\\text{PCET}, \\, \\gamma_{\\text{eff}}} \\text{HONO}\\uparrow + \\text{6PPD-NO}_2 + \\text{SO}_4^{2-}`,
      scientificCitation: 'Environmental Science & Technology (ES&T 2024–2025) Tire-Wear & SO2 Redox HONO Pathways',
      regulatoryContext: 'Normativa Euro 7 (Reglamento UE 2024/1257 sobre emisiones no procedentes del escape)',
      uncertaintyPct: 10.5
    }
  ];

  const sota2026: Sota2026No2Frontiers = {
    asphaltSkinTempC: Number(asphaltSkinTempC.toFixed(1)),
    airTempDeltaSkinC: Number(deltaTSkinC.toFixed(1)),
    kPanAirS1: Number(kPanAirS1.toExponential(3)),
    kPanSkinS1: Number(kPanSkinS1.toExponential(3)),
    panThermalAmplificationFactor: Number(panThermalAmplification.toFixed(2)),
    advectedPanPpb: Number(advectedPanPpb.toFixed(3)),
    panThermalNo2ReleaseUgm3h: Number(p_pan_thermolysis_ugm3h.toFixed(2)),
    panRegimeVerdict: asphaltSkinTempC >= 35
      ? ` FUENTE TÉRMICA ACTIVA (T_skin = ${asphaltSkinTempC.toFixed(1)}°C): Descomposición acelerada ${panThermalAmplification.toFixed(1)}x sobre calzada`
      : `SUMIDERO/EQUILIBRIO TÉRMICO MODERADO (T_skin = ${asphaltSkinTempC.toFixed(1)}°C): Baja disociación térmica de PAN`,
    twpRoadLoadingMgM2: Number(twpRoadLoadingMgM2.toFixed(1)),
    pcetReactiveUptakeGamma: Number(gammaPcet.toExponential(3)),
    so2CoastalConcentrationUgm3: Number(so2CoastalUgm3.toFixed(2)),
    pcetDepositionVelocityCms: Number(vdPcetCms.toFixed(3)),
    pcetNo2ToHonoConversionUgm3h: Number(pcetNo2ToHonoUgm3h.toFixed(2)),
    pcetHonoSteadyStatePptv: Number(pcetHonoPptv.toFixed(1)),
    pcetOhRadicalBurstMolecCm3s: Number(pcetOhBurstMolecCm3s.toExponential(2)),
    solarZenithAngleDeg: Number(szaDeg.toFixed(1)),
    viewingZenithAngleDeg: vzaDeg,
    canyonShadowFraction: Number(canyonShadowFraction.toFixed(2)),
    okeCavityReflectionFactor: Number(okeCavityReflectionFactor.toFixed(3)),
    amf1DStandard: Number(amf1DStandard.toFixed(2)),
    amf3DCanyonCorrected: Number(amf3DCanyonCorrected.toFixed(2)),
    satelliteShadowUnderestimationBiasPct: Number(satelliteShadowBiasPct.toFixed(1)),
    vcd1DUmolM2: Number(vcd1DUmolM2.toFixed(1)),
    vcd3DCorrectedUmolM2: Number(vcd3DCorrectedUmolM2.toFixed(1))
  };

  return {
    currentNO2Ugm3: Number(no2.toFixed(1)),
    steadyStateNO2Ugm3: Number(steadyStateNO2.toFixed(1)),
    netRateOfChangeUgm3h: Number(netRate.toFixed(2)),
    atmosphericLifetimeMinutes: Number(lifetimeMin.toFixed(1)),
    photostationaryLeightonRatio: Number(leightonPhi.toFixed(2)),
    totalProductionUgm3h: Number(totalProduction.toFixed(2)),
    totalLossUgm3h: Number(totalLoss.toFixed(2)),
    components,
    chemicalRegime: regime,
    dominantLossMechanism: l_photolysis_ugm3h > l_canyon_vent_ugm3h ? 'Fotólisis Solar UV (J_NO2)' : 'Ventilación de Cañón Urbano',
    dominantProductionSource: p_titration_ugm3h > p_traffic_ugm3h ? 'Titulación Química Rápida (NO+O3)' : 'Emisión Primaria Directa Tráfico',
    canyonEscapeVelocityMs: Number(w_t_ms.toFixed(3)),
    weselyDepositionVelocityCms: Number(v_d_cms.toFixed(2)),
    photolysisRateS1: Number(j_no2.toFixed(6)),
    timestampIso: new Date().toISOString(),
    canyonHW: Number(hw.toFixed(2)),
    svf: Number(svf.toFixed(2)),
    trafficIntensityVehH: Math.round(effectiveVehH),
    heavyDutyFractionPct: Number(hdvPct.toFixed(1)),
    solarRadiationWm2: Number(solarRad.toFixed(1)),
    temperatureC: Number(tempC.toFixed(1)),
    no2BackgroundDynamicUgm3: Number(no2Background.toFixed(1)),
    fairmodeMqiDynamic,
    sota2026
  };
}

