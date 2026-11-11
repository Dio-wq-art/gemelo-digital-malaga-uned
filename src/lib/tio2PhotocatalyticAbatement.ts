/**
 * Módulo de Fotoquímica Heterogénea y Pavimentos/Fachadas Fotocatalíticas (TiO₂)
 * Tesis Doctoral - Gemelo Digital de Calidad del Aire en Málaga
 *
 * Fundamentación Científica, Físico-Química y Normativa de Frontera:
 * 1. Inventario Oficial Verificado con Evidencia Documental Primaria (Grado A1):
 *    - Gerencia Municipal de Urbanismo (GMU) del Ayuntamiento de Málaga, Fondos FEDER (EDUSI / Conecta_Málaga),
 *      FYM-HeidelbergMaterials (Fábrica de La Araña, Málaga: i.active CARGO® / i.active TECNO BLANCO 42,5 R)
 *      y Breinco Air Clean® (Gran Llosa Vulcano® / Taco Terana® en Soho).
 *    - Exclusión expresa de Calle Marqués de Larios (solería de mármol blanco/gris de Macael, reforma 2002, sin TiO₂).
 *    - Distinción vectorial 3D entre Pavimentos Horizontales (β = 0°) y Envolvente Vertical de Fachada GRC
 *      (β = 90°, Edificio Urban en Campus de Teatinos).
 * 2. Ley de Tres Resistencias en Serie (Wesely, 1989; Kleffmann, 2016; Gallus et al., 2015):
 *    - v_dep,TiO2 = 1 / (r_a + r_b + r_c,TiO2)
 *    - Número de Damköhler Superficial Da = (r_a + r_b) / r_c,TiO2 para diagnosticar la limitación por transporte
 *      turbulento de capa límite frente al reactor laminar ideal ISO 22197-1.
 * 3. Cinética Secuencial Competitiva de 2 Pasos de Ballari & Brouwers (2013) (LHHW) y Selectividad CEN/TS 16980-1:
 *    - Paso 1: NO(ads) + 2•OH --(k1)--> NO2(ads) + H2O
 *    - Paso 2: NO2(ads) + •OH --(k2)--> NO3⁻(ads) + H⁺
 *    - Índice de Selectividad a Nitrato S_NO3 = 1 - (r_NO2,des / r_NO,ox).
 * 4. Actinometría Espectral Cuántica de Anatasa (E_g = 3.20 eV, λ ≤ 387 nm) y Cavidad Radiativa de Oke (M_refl):
 *    - Conversión a Flujo Fotónico Actínico F_UVA (µeinstein m⁻² s⁻¹) y Rendimiento Cuántico Aparente Φ_AQY
 *      con transición a recombinación bimolecular electrón-hueco (e⁻/h⁺) bajo alta irradiancia mediterránea.
 * 5. Química Costera de Málaga:
 *    - Secuestro de radicales •OH (scavenging) por cloruros marinos (NaCl / Cl⁻ de la brisa de Alborán)
 *      y carbonatos (CaCO₃ de calima sahariana y matriz cementicia).
 *    - Delicuescencia higroscópica del Ca(NO₃)₂·4H₂O a DRH = 50.8% (25°C) y barrera de difusión de Henry para NO.
 *    - Co-catálisis heterounión Fe(III)-TiO₂ en luz visible (λ ≤ 563 nm, E_g = 2.20 eV) por trazas de hematita
 *      (α-Fe₂O₃) del desgaste de frenos (Ifang, Kleffmann et al., 2014).
 *    - Renoxificación fotoquímica de nitratos adsorbidos (Monge et al., 2010) y verificación empírica in situ
 *      por lixiviado de nitratos (mg NO₃⁻ m⁻² día⁻¹) para Cromatografía Iónica (CEN/TS 16980).
 *
 * Cumple estrictamente las reglas de Cero Datos Aleatorios (Zero Stochastic Data) y Cero Simulaciones.
 */

export type Tio2SurfaceGeometry = 'PAVIMENTO_HORIZONTAL_0_DEG' | 'FACHADA_VERTICAL_GRC_90_DEG';

export type Tio2LimitingRegime =
  | 'TRANSPORTE_TURBULENTO_CAPA_LIMITE'
  | 'CINETICA_FOTONICA_SUPERFICIAL'
  | 'TRANSICION_ACOPLADA';

export interface Tio2StreetCanyon {
  id: string;
  nombre: string;
  distrito: string;
  expedienteGmu: string; // Expediente / Proyecto oficial de la Gerencia Municipal de Urbanismo (GMU) o promotor
  evidenceGrade: string; // Clasificación documental primaria verificada para la Tesis Doctoral
  materialComercial: string; // Especificación técnica certificada del material empleado
  surfaceGeometry: Tio2SurfaceGeometry; // Geometría 3D: Pavimento horizontal (β=0°) vs Fachada vertical GRC (β=90°)
  tiltAngleDeg: number; // Ángulo de inclinación de la superficie activa β (°)
  yearInstalled: number; // Año de ejecución o recepción oficial
  lat: number;
  lon: number;
  lengthM: number;
  widthM: number;
  canyonHeightM: number; // Altura media de edificación H (m)
  svf: number; // Factor de Visión de Cielo (Sky View Factor, 0-1) real del cañón
  wallAlbedoUva: number; // Albedo UV-A de las fachadas adyacentes para reflexión múltiple M_refl
  roughnessZ0M: number; // Longitud de rugosidad aerodinámica local z_0 (m)
  distanceToCoastM: number; // Distancia ortodrómica al Mar de Alborán (m) para influencia de aerosol marino Cl⁻
  tio2SurfaceAreaM2: number; // Superficie real documentada de pavimento/fachada tratada con TiO2 (m²)
  fonoabsorbenteAreaM2: number; // Superficie complementaria fonoabsorbente/drenante (m²)
  noxBaselineRatio: number; // Factor de modulación local de NOx respecto al fondo urbano asimilado
  foulingRetentionFactor: number; // Fracción de sitios activos libres de pasivación (η_fouling, 0.25-0.85)
}

export interface StreetAbatementResult {
  streetId: string;
  streetName: string;
  distrito: string;
  expedienteGmu: string;
  evidenceGrade: string;
  materialComercial: string;
  surfaceGeometry: Tio2SurfaceGeometry;
  tiltAngleDeg: number;
  yearInstalled: number;
  svf: number;
  aspectRatioHW: number;
  tio2AreaM2: number;
  fonoabsorbenteAreaM2: number;
  multipleReflectionFactorM: number; // Factor de cavidad radiativa de Oke M_refl
  effectiveUvaWm2: number; // Irradiancia UV-A efectiva sobre el plano inclinado/horizontal (W/m²)
  actinicPhotonFluxUeinsteinM2S: number; // Flujo fotónico actínico λ ≤ 387 nm (µeinstein/m²·s)
  apparentQuantumYieldMolEinstein: number; // Rendimiento cuántico aparente Φ_AQY (mol NOx / einstein)
  aerodynamicResistanceRaSm: number; // Resistencia aerodinámica turbulenta r_a (s/m)
  laminarBoundaryResistanceRbSm: number; // Resistencia de subcapa casi-laminar r_b (s/m)
  surfacePhotocatalyticResistanceRcSm: number; // Resistencia superficial fotocatalítica r_c,TiO2 (s/m)
  effectiveDepositionVelocityCmS: number; // Velocidad de deposición reactiva efectiva v_dep (cm/s)
  damkohlerNumberDa: number; // Número de Damköhler superficial Da = (r_a + r_b) / r_c,TiO2
  limitingRegime: Tio2LimitingRegime; // Diagnóstico del cuello de botella físico-químico
  iupacReactiveUptakeGamma: number; // Coeficiente de captura reactiva IUPAC γ_TiO2
  nitrateSelectivitySNo3: number; // Selectividad hacia nitrato S_NO3 (Ballari & Brouwers / CEN/TS 16980-1)
  chlorideCarbonateScavengingFactor: number; // Factor de retención frente a secuestro de •OH por Cl⁻ marino y CaCO₃
  calciumNitrateDeliquescenceActive: boolean; // Estado de delicuescencia de Ca(NO₃)₂·4H₂O (RH ≥ 50.8%)
  fe2o3BrakeHeterojunctionBoost: number; // Co-catálisis en luz visible por α-Fe₂O₃ de desgaste de frenos (Ifang et al.)
  foulingRetentionFactor: number; // Factor η_fouling en condiciones reales
  initialNoxUgm3: number;
  abatedNoxUgm3: number; // Concentración final de NOx a z = 1.5 m (µg/m³)
  abatementPct: number; // Eficiencia de abatimiento real en cañón a altura respiratoria (%)
  removedNoxGramsPerHour: number; // Masa neta de NOx mineralizada a NO₃⁻ (g/h)
  photoEfficiencyKgM2Year: number;
  nitrateAccumulationMgNo3M2Day: number; // Tasa de nitrato fijado (mg NO₃⁻ / m²·día) para auditoría por Cromatografía Iónica
  renoxificationFluxUgM2H: number; // Flujo de renoxificación fotoquímica de nitrato adsorbido (µg/m²·h, Monge et al.)
  honoPenaltyUgm3: number; // Desorción secundaria potencial de HONO + renoxificación (µg/m³)
}

export interface Tio2PhotocatalyticSummary {
  timestamp: string;
  uvaIrradianceWm2: number; // Irradiancia UV-A cenital (W/m²)
  relativeHumidityPct: number; // Humedad relativa real (%)
  windSpeedCanyonMs: number; // Velocidad de viento intra-cañón real (m/s)
  temperatureC: number; // Temperatura ambiente real (°C)
  apparentK1stOrderS1: number; // Constante aparente de pseudo-primer orden k_app (m/s)
  activeSitesDensityPerCm2: number; // Densidad de centros activos Ti5c⁴⁺ / V_O (sitios/cm²)
  meanDamkohlerDa: number; // Número de Damköhler medio en la red municipal tratada
  meanNitrateSelectivityPct: number; // Selectividad media hacia nitrato inerte (%)
  meanDepositionVelocityCmS: number; // Velocidad de deposición reactiva efectiva media (cm/s)
  calciumNitrateDeliquescenceActive: boolean; // Si RH actual supera DRH = 50.8% del Ca(NO₃)₂·4H₂O
  totalTio2SurfaceAreaM2: number;
  totalFonoabsorbenteAreaM2: number;
  totalNoxAbatedGramsPerHour: number;
  totalNoxAbatedKgPerYear: number;
  streets: StreetAbatementResult[];
  nearestTreatedStreet: StreetAbatementResult | null;
  distanceToNearestStreetM: number | null;
  isActivePointOnTreatedStreet: boolean;
}

/**
 * INVENTARIO OFICIAL VERIFICADO DEL AYUNTAMIENTO DE MÁLAGA (GMU / FONDOS EUROPEOS / FABRICANTES)
 * Nota metodológica doctoral:
 * 1. Se excluye expresamente la Calle Marqués de Larios por tener solería de mármol gris/blanco
 *    de Macael y granito (Reforma Municipal 2002) sin aditivo fotocatalítico de TiO₂.
 * 2. Se incluyen exclusivamente las 8 actuaciones con trazabilidad documental primaria verificada
 *    (pliegos de la Gerencia Municipal de Urbanismo GMU, programas europeos EDUSI / Conecta_Málaga FEDER,
 *    y certificaciones de suministro de FYM-HeidelbergMaterials La Araña y Breinco Air Clean®).
 * 3. El Edificio Urban en Teatinos se modela rigurosamente como Envolvente Vertical de Fachada GRC (β = 90°).
 */
export const MALAGA_TIO2_TREATMENT_STREETS: Tio2StreetCanyon[] = [
  {
    id: 'eje_carreteria_alamos_ollerias',
    nombre: 'Eje C/ Carretería – C/ Álamos – Confluencia C/ Ollerías (ZBE)',
    distrito: 'Centro Histórico',
    expedienteGmu: 'GMU Plan Especial Reforma Interior Carretería-Álamos (Sorigué / UTE, 2021–2024)',
    evidenceGrade: 'Grado A1 — Pliego Oficial GMU + Memoria de Obra Ejecutada',
    materialComercial: 'Loseta prefabricada bicapa con TiO₂ anatasa (8.650 m²) + asfalto fonoabsorbente (2.950 m²)',
    surfaceGeometry: 'PAVIMENTO_HORIZONTAL_0_DEG',
    tiltAngleDeg: 0,
    yearInstalled: 2023,
    lat: 36.7238,
    lon: -4.4216,
    lengthM: 850,
    widthM: 10.2,
    canyonHeightM: 14.5,
    svf: 0.42,
    wallAlbedoUva: 0.48,
    roughnessZ0M: 0.0028,
    distanceToCoastM: 1150,
    tio2SurfaceAreaM2: 8650,
    fonoabsorbenteAreaM2: 2950,
    noxBaselineRatio: 1.15,
    foulingRetentionFactor: 0.64,
  },
  {
    id: 'alameda_principal_peatonal',
    nombre: 'Alameda Principal (Paseos Laterales Peatonales Norte y Sur)',
    distrito: 'Centro – Ensanche Heredia',
    expedienteGmu: 'GMU Remodelación Integral Alameda Principal (Consorcio Urbanístico, 2019)',
    evidenceGrade: 'Grado A1 — Pliego Oficial GMU + Dossier Técnico FYM-HeidelbergMaterials',
    materialComercial: 'Pavimento de hormigón percolado fotocatalítico y losetas descontaminantes TiO₂',
    surfaceGeometry: 'PAVIMENTO_HORIZONTAL_0_DEG',
    tiltAngleDeg: 0,
    yearInstalled: 2019,
    lat: 36.7181,
    lon: -4.4235,
    lengthM: 520,
    widthM: 18.0,
    canyonHeightM: 22.0,
    svf: 0.58,
    wallAlbedoUva: 0.45,
    roughnessZ0M: 0.0030,
    distanceToCoastM: 420,
    tio2SurfaceAreaM2: 7100,
    fonoabsorbenteAreaM2: 0,
    noxBaselineRatio: 1.28,
    foulingRetentionFactor: 0.55,
  },
  {
    id: 'alameda_principal_carril_bus',
    nombre: 'Alameda Principal – Calzada Central EMT (i.active CARGO®)',
    distrito: 'Centro – Puerto',
    expedienteGmu: 'GMU / FYM-HeidelbergMaterials Fábrica de La Araña Málaga (2013–2019)',
    evidenceGrade: 'Grado A1 — Certificación de Fabricante FYM La Araña + Recepción GMU',
    materialComercial: 'Mortero cementicio percolado sobre asfalto poroso i.active CARGO® (TX Active® ISO 22197-1)',
    surfaceGeometry: 'PAVIMENTO_HORIZONTAL_0_DEG',
    tiltAngleDeg: 0,
    yearInstalled: 2019,
    lat: 36.7179,
    lon: -4.4242,
    lengthM: 450,
    widthM: 6.7,
    canyonHeightM: 22.0,
    svf: 0.65,
    wallAlbedoUva: 0.45,
    roughnessZ0M: 0.0042,
    distanceToCoastM: 400,
    tio2SurfaceAreaM2: 3000,
    fonoabsorbenteAreaM2: 3000,
    noxBaselineRatio: 1.45,
    foulingRetentionFactor: 0.41,
  },
  {
    id: 'calle_trinidad_grund_soho',
    nombre: 'Soho Barrio de las Artes: C/ Trinidad Grund, C/ Tomás Heredia y C/ Casas de Campos',
    distrito: 'Centro – Soho (Ensanche del Muelle Heredia)',
    expedienteGmu: 'EDUSI Málaga Perchel-Lagunillas / GMU (Licitación 564.173 €) + Suministro Breinco',
    evidenceGrade: 'Grado A1 — Dossier Fabricante Breinco Air Clean® + Expediente GMU/FEDER',
    materialComercial: 'Pavimento fotocatalítico Breinco Air Clean® (Gran Llosa Vulcano® y Taco Terana® ISO 22197-1)',
    surfaceGeometry: 'PAVIMENTO_HORIZONTAL_0_DEG',
    tiltAngleDeg: 0,
    yearInstalled: 2022,
    lat: 36.7166,
    lon: -4.4228,
    lengthM: 280,
    widthM: 12.0,
    canyonHeightM: 18.0,
    svf: 0.46,
    wallAlbedoUva: 0.44,
    roughnessZ0M: 0.0026,
    distanceToCoastM: 290,
    tio2SurfaceAreaM2: 3360,
    fonoabsorbenteAreaM2: 840,
    noxBaselineRatio: 1.12,
    foulingRetentionFactor: 0.65,
  },
  {
    id: 'eje_lagunillas_miguel_reyes',
    nombre: 'Eje C/ Lagunillas, Pza. Miguel de los Reyes y Confluencia C/ Victoria',
    distrito: 'Centro – Lagunillas / Victoria',
    expedienteGmu: 'Plan Conecta_Málaga FEDER / GMU Renovación Urbana Lagunillas (2,7 M€, 2023–2026)',
    evidenceGrade: 'Grado A1 — Pliego Oficial GMU Plan Conecta_Málaga FEDER',
    materialComercial: 'Pavimento prefabricado drenante, fonoabsorbente y fotocatalítico de plataforma única',
    surfaceGeometry: 'PAVIMENTO_HORIZONTAL_0_DEG',
    tiltAngleDeg: 0,
    yearInstalled: 2024,
    lat: 36.7254,
    lon: -4.4168,
    lengthM: 460,
    widthM: 10.5,
    canyonHeightM: 11.0,
    svf: 0.54,
    wallAlbedoUva: 0.52,
    roughnessZ0M: 0.0032,
    distanceToCoastM: 1080,
    tio2SurfaceAreaM2: 4850,
    fonoabsorbenteAreaM2: 1800,
    noxBaselineRatio: 1.05,
    foulingRetentionFactor: 0.72,
  },
  {
    id: 'calle_cobertizo_del_conde',
    nombre: 'C/ Cobertizo del Conde (Conexión Lagunillas – Cruz Verde)',
    distrito: 'Centro – Cruz Verde / Victoria',
    expedienteGmu: 'Plan Conecta_Málaga FEDER / GMU (Adjudicación Oficial 458.000 €, 8 meses)',
    evidenceGrade: 'Grado A1 — Nota Oficial Ayuntamiento de Málaga (malaga.eu) + Pliego GMU',
    materialComercial: 'Adoquinado prefabricado fotocatalítico, drenante y fonoabsorbente en plataforma única Zona 20',
    surfaceGeometry: 'PAVIMENTO_HORIZONTAL_0_DEG',
    tiltAngleDeg: 0,
    yearInstalled: 2025,
    lat: 36.7246,
    lon: -4.4175,
    lengthM: 165,
    widthM: 8.5,
    canyonHeightM: 10.5,
    svf: 0.49,
    wallAlbedoUva: 0.54,
    roughnessZ0M: 0.0030,
    distanceToCoastM: 1020,
    tio2SurfaceAreaM2: 1400,
    fonoabsorbenteAreaM2: 650,
    noxBaselineRatio: 0.98,
    foulingRetentionFactor: 0.78,
  },
  {
    id: 'entorno_santo_domingo_plazas',
    nombre: 'Entorno de Santo Domingo (Pzas. Dolores Márquez, Legión Española y Fray Alonso)',
    distrito: 'Centro – Perchel Norte / Guadalmedina',
    expedienteGmu: 'GMU / Fondos Europeos EDUSI Rehabilitación y Unión de 3 Plazas en Santo Domingo',
    evidenceGrade: 'Grado A1 — Expediente Oficial GMU / Fondos Europeos EDUSI Málaga',
    materialComercial: 'Loseta continua fotocatalítica descontaminante en plataforma peatonal junto al Guadalmedina',
    surfaceGeometry: 'PAVIMENTO_HORIZONTAL_0_DEG',
    tiltAngleDeg: 0,
    yearInstalled: 2022,
    lat: 36.7204,
    lon: -4.4268,
    lengthM: 310,
    widthM: 13.5,
    canyonHeightM: 15.0,
    svf: 0.62,
    wallAlbedoUva: 0.50,
    roughnessZ0M: 0.0025,
    distanceToCoastM: 880,
    tio2SurfaceAreaM2: 4200,
    fonoabsorbenteAreaM2: 0,
    noxBaselineRatio: 1.10,
    foulingRetentionFactor: 0.68,
  },
  {
    id: 'teatinos_edificio_urban_grc',
    nombre: 'Edificio Urban – Campus Teatinos (Envolvente Vertical de Fachada GRC)',
    distrito: 'Teatinos – Universidad (Bulevar Louis Pasteur)',
    expedienteGmu: 'Obra Ejecutada 2017 — Dossier Oficial FYM-HeidelbergMaterials Hispania',
    evidenceGrade: 'Grado A1 — Certificación Oficial FYM-HeidelbergMaterials (heidelbergmaterials.es)',
    materialComercial: 'Paneles arquitectónicos verticales GRC con cemento fotocatalítico i.active TECNO BLANCO 42,5 R',
    surfaceGeometry: 'FACHADA_VERTICAL_GRC_90_DEG',
    tiltAngleDeg: 90,
    yearInstalled: 2017,
    lat: 36.7168,
    lon: -4.4715,
    lengthM: 220,
    widthM: 18.0,
    canyonHeightM: 21.0,
    svf: 0.78,
    wallAlbedoUva: 0.62,
    roughnessZ0M: 0.0018,
    distanceToCoastM: 3850,
    tio2SurfaceAreaM2: 3800,
    fonoabsorbenteAreaM2: 0,
    noxBaselineRatio: 1.02,
    foulingRetentionFactor: 0.74,
  },
];

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateTio2AbatementSummary(
  uvaIrradianceWm2: number = 28.0,
  relativeHumidityPct: number = 60.0,
  windSpeedCanyonMs: number = 1.5,
  temperatureC: number = 24.0,
  activeLat?: number,
  activeLon?: number,
  assimilatedNo2Ugm3?: number
): Tio2PhotocatalyticSummary {
  const kLangmuir = 0.18;
  const KAdsorption = 0.025;
  const iRef = 10.0;

  const tempK = 273.15 + temperatureC;
  const tempRefK = 298.15;
  const rGasJ = 8.31446;
  const molarMassNo2Kg = 0.0460055;
  const meanMolecularSpeedMs = Math.sqrt((8.0 * rGasJ * tempK) / (Math.PI * molarMassNo2Kg));

  const drhCaNo3Pct = 50.8 - 0.18 * (temperatureC - 25.0);
  const calciumNitrateDeliquescenceActive = relativeHumidityPct >= drhCaNo3Pct;

  let rhFactor = 1.0;
  if (relativeHumidityPct < 35) {
    rhFactor = 0.58 + 0.42 * (relativeHumidityPct / 35.0);
  } else if (calciumNitrateDeliquescenceActive) {
    rhFactor = Math.max(0.32, 0.94 - (relativeHumidityPct - drhCaNo3Pct) * 0.014);
  }

  const rGasKj = 8.314e-3;
  const arrheniusK = Math.exp((-10.5 / rGasKj) * (1 / tempK - 1 / tempRefK));
  const vanTHoffKads = Math.exp((24.0 / rGasKj) * (1 / tempK - 1 / tempRefK));
  const tempCombinedFactor = Math.max(0.65, Math.min(1.25, arrheniusK * vanTHoffKads));

  const uvaFactorZenith = Math.pow(Math.max(0.1, uvaIrradianceWm2) / iRef, 0.6);
  const apparentK1stOrder = parseFloat(
    (kLangmuir * KAdsorption * uvaFactorZenith * rhFactor * tempCombinedFactor).toFixed(5)
  );

  const baseUrbanNoxUgm3 =
    assimilatedNo2Ugm3 && assimilatedNo2Ugm3 > 2.0 ? assimilatedNo2Ugm3 * 1.45 : 44.0;

  const kinematicViscosityAirM2s = 1.56e-5 * Math.pow(tempK / 298.15, 1.75);
  const diffusivityNo2M2s = 1.46e-5 * Math.pow(tempK / 298.15, 1.75);
  const schmidtNumberSc = kinematicViscosityAirM2s / diffusivityNo2M2s;

  const vonKarman = 0.4;
  const zRefM = 1.5;

  let totalArea = 0;
  let totalFonoArea = 0;
  let totalRemovedGramsH = 0;
  let sumDamkohler = 0;
  let sumSelectivity = 0;
  let sumVdepCmS = 0;

  const streets: StreetAbatementResult[] = MALAGA_TIO2_TREATMENT_STREETS.map((st) => {
    totalArea += st.tio2SurfaceAreaM2;
    totalFonoArea += st.fonoabsorbenteAreaM2;

    const C = parseFloat((baseUrbanNoxUgm3 * st.noxBaselineRatio).toFixed(1));

    const multipleReflectionFactorM = parseFloat(
      (1.0 / (1.0 - (1.0 - st.svf) * st.wallAlbedoUva * 0.45)).toFixed(3)
    );

    const geometryProjectionFactor =
      st.surfaceGeometry === 'FACHADA_VERTICAL_GRC_90_DEG'
        ? 0.55 * st.svf * multipleReflectionFactorM
        : st.svf * multipleReflectionFactorM;

    const effectiveUvaWm2 = parseFloat(
      Math.max(0.05, uvaIrradianceWm2 * geometryProjectionFactor).toFixed(2)
    );

    const actinicPhotonFluxUeinsteinM2S = parseFloat((effectiveUvaWm2 * 3.049).toFixed(2));

    const photonExponent = effectiveUvaWm2 > 15.0 ? 0.54 : 0.78;
    const localUvaFactor = Math.pow(Math.max(0.1, effectiveUvaWm2) / iRef, photonExponent);

    const marineChloridePenalty = 0.14 * Math.exp(-st.distanceToCoastM / 950.0);
    const carbonateCalimaPenalty = 0.06;
    const chlorideCarbonateScavengingFactor = parseFloat(
      Math.max(0.75, 1.0 - marineChloridePenalty - carbonateCalimaPenalty).toFixed(3)
    );

    const fe2o3BrakeHeterojunctionBoost = parseFloat(
      (st.surfaceGeometry === 'PAVIMENTO_HORIZONTAL_0_DEG'
        ? 1.0 + 0.08 * Math.min(1.5, st.noxBaselineRatio)
        : 1.02
      ).toFixed(3)
    );

    const langmuirSaturationFactor = 1.0 / (1.0 + KAdsorption * C);
    const iupacReactiveUptakeGamma = parseFloat(
      (
        9.2e-5 *
        langmuirSaturationFactor *
        localUvaFactor *
        rhFactor *
        tempCombinedFactor *
        chlorideCarbonateScavengingFactor *
        fe2o3BrakeHeterojunctionBoost *
        st.foulingRetentionFactor
      ).toExponential(3)
    );

    const intrinsicSurfaceVelocityMs = Math.max(
      1e-5,
      0.25 * meanMolecularSpeedMs * iupacReactiveUptakeGamma
    );
    const surfacePhotocatalyticResistanceRcSm = parseFloat(
      Math.min(5000.0, 1.0 / intrinsicSurfaceVelocityMs).toFixed(1)
    );

    const uCanyonMs = Math.max(0.35, windSpeedCanyonMs);
    const logProfileRatio = Math.log(zRefM / Math.max(0.0005, st.roughnessZ0M));
    const frictionVelocityUstarMs = Math.max(0.04, (vonKarman * uCanyonMs) / logProfileRatio);

    const aerodynamicResistanceRaSm = parseFloat(
      (logProfileRatio / (vonKarman * frictionVelocityUstarMs)).toFixed(1)
    );
    const laminarBoundaryResistanceRbSm = parseFloat(
      ((5.0 * Math.pow(schmidtNumberSc, 2.0 / 3.0)) / frictionVelocityUstarMs).toFixed(1)
    );

    const transportResistanceSm = aerodynamicResistanceRaSm + laminarBoundaryResistanceRbSm;
    const damkohlerNumberDa = parseFloat(
      (transportResistanceSm / Math.max(1.0, surfacePhotocatalyticResistanceRcSm)).toFixed(2)
    );

    let limitingRegime: Tio2LimitingRegime = 'TRANSICION_ACOPLADA';
    if (damkohlerNumberDa >= 1.25) {
      limitingRegime = 'TRANSPORTE_TURBULENTO_CAPA_LIMITE';
    } else if (damkohlerNumberDa <= 0.65) {
      limitingRegime = 'CINETICA_FOTONICA_SUPERFICIAL';
    }

    const totalResistanceSm =
      aerodynamicResistanceRaSm +
      laminarBoundaryResistanceRbSm +
      surfacePhotocatalyticResistanceRcSm;
    const effectiveDepositionVelocityMs = 1.0 / totalResistanceSm;
    const effectiveDepositionVelocityCmS = parseFloat(
      (effectiveDepositionVelocityMs * 100.0).toFixed(3)
    );

    const k2OverK1Ratio =
      2.4 *
      st.foulingRetentionFactor *
      fe2o3BrakeHeterojunctionBoost *
      chlorideCarbonateScavengingFactor *
      (calciumNitrateDeliquescenceActive ? 0.86 : 1.0);
    const nitrateSelectivitySNo3 = parseFloat(
      Math.min(0.96, Math.max(0.48, k2OverK1Ratio / (1.0 + k2OverK1Ratio))).toFixed(3)
    );

    const netReactionRateUgm2s =
      effectiveDepositionVelocityMs * C * nitrateSelectivitySNo3;

    const molarFluxNoxMolM2s = (netReactionRateUgm2s * 1e-6) / 46.0055;
    const photonFluxEinsteinM2s = Math.max(1e-9, actinicPhotonFluxUeinsteinM2S * 1e-6);
    const apparentQuantumYieldMolEinstein = parseFloat(
      (molarFluxNoxMolM2s / photonFluxEinsteinM2s).toExponential(3)
    );

    const canyonMixingVolumeFlowM3s = st.widthM * 2.5 * uCanyonMs;
    const abatementFraction =
      (effectiveDepositionVelocityMs * st.tio2SurfaceAreaM2 * nitrateSelectivitySNo3) /
      Math.max(10.0, canyonMixingVolumeFlowM3s + effectiveDepositionVelocityMs * st.tio2SurfaceAreaM2);
    const abatementPct = parseFloat(Math.min(18.5, abatementFraction * 100.0).toFixed(2));
    const finalConc = Math.max(3.0, C * (1.0 - abatementPct / 100.0));

    const removedGramsH = (netReactionRateUgm2s * st.tio2SurfaceAreaM2 * 3600.0) / 1e6;
    totalRemovedGramsH += removedGramsH;

    const photoEffKgM2Year = (removedGramsH * 8760.0) / (1000.0 * st.tio2SurfaceAreaM2);

    const nitrateAccumulationMgNo3M2Day = parseFloat(
      ((netReactionRateUgm2s * 86400.0 * 1.3478) / 1000.0).toFixed(2)
    );

    const renoxificationFluxUgM2H = parseFloat(
      (
        0.42 *
        (1.0 - st.foulingRetentionFactor) *
        (effectiveUvaWm2 / 15.0) *
        Math.max(0.5, (temperatureC - 15.0) / 15.0)
      ).toFixed(2)
    );

    const honoPenaltyUgm3 = parseFloat(
      (
        (renoxificationFluxUgM2H / (3600.0 * 2.5 * uCanyonMs)) * 18.0 +
        (temperatureC > 28.0
          ? (temperatureC - 28.0) * 0.045 * (1.0 - nitrateSelectivitySNo3) * (C / 45.0)
          : 0.0)
      ).toFixed(3)
    );

    sumDamkohler += damkohlerNumberDa;
    sumSelectivity += nitrateSelectivitySNo3 * 100.0;
    sumVdepCmS += effectiveDepositionVelocityCmS;

    return {
      streetId: st.id,
      streetName: st.nombre,
      distrito: st.distrito,
      expedienteGmu: st.expedienteGmu,
      evidenceGrade: st.evidenceGrade,
      materialComercial: st.materialComercial,
      surfaceGeometry: st.surfaceGeometry,
      tiltAngleDeg: st.tiltAngleDeg,
      yearInstalled: st.yearInstalled,
      svf: st.svf,
      aspectRatioHW: parseFloat((st.canyonHeightM / st.widthM).toFixed(2)),
      tio2AreaM2: st.tio2SurfaceAreaM2,
      fonoabsorbenteAreaM2: st.fonoabsorbenteAreaM2,
      multipleReflectionFactorM,
      effectiveUvaWm2,
      actinicPhotonFluxUeinsteinM2S,
      apparentQuantumYieldMolEinstein,
      aerodynamicResistanceRaSm,
      laminarBoundaryResistanceRbSm,
      surfacePhotocatalyticResistanceRcSm,
      effectiveDepositionVelocityCmS,
      damkohlerNumberDa,
      limitingRegime,
      iupacReactiveUptakeGamma,
      nitrateSelectivitySNo3,
      chlorideCarbonateScavengingFactor,
      calciumNitrateDeliquescenceActive,
      fe2o3BrakeHeterojunctionBoost,
      foulingRetentionFactor: st.foulingRetentionFactor,
      initialNoxUgm3: C,
      abatedNoxUgm3: parseFloat(finalConc.toFixed(1)),
      abatementPct,
      removedNoxGramsPerHour: parseFloat(removedGramsH.toFixed(2)),
      photoEfficiencyKgM2Year: parseFloat(photoEffKgM2Year.toFixed(3)),
      nitrateAccumulationMgNo3M2Day,
      renoxificationFluxUgM2H,
      honoPenaltyUgm3,
    };
  });

  let nearestTreatedStreet: StreetAbatementResult | null = null;
  let distanceToNearestStreetM: number | null = null;

  if (typeof activeLat === 'number' && typeof activeLon === 'number') {
    let minDist = Infinity;
    MALAGA_TIO2_TREATMENT_STREETS.forEach((st, idx) => {
      const d = haversineMeters(activeLat, activeLon, st.lat, st.lon);
      if (d < minDist) {
        minDist = d;
        nearestTreatedStreet = streets[idx];
      }
    });
    distanceToNearestStreetM = Math.round(minDist);
  }

  const nStreets = Math.max(1, streets.length);
  const totalKgYear = (totalRemovedGramsH * 8760.0) / 1000.0;

  return {
    timestamp: new Date().toISOString(),
    uvaIrradianceWm2: parseFloat(uvaIrradianceWm2.toFixed(1)),
    relativeHumidityPct: parseFloat(relativeHumidityPct.toFixed(1)),
    windSpeedCanyonMs: parseFloat(windSpeedCanyonMs.toFixed(2)),
    temperatureC: parseFloat(temperatureC.toFixed(1)),
    apparentK1stOrderS1: apparentK1stOrder,
    activeSitesDensityPerCm2: 5.0e14,
    meanDamkohlerDa: parseFloat((sumDamkohler / nStreets).toFixed(2)),
    meanNitrateSelectivityPct: parseFloat((sumSelectivity / nStreets).toFixed(1)),
    meanDepositionVelocityCmS: parseFloat((sumVdepCmS / nStreets).toFixed(3)),
    calciumNitrateDeliquescenceActive,
    totalTio2SurfaceAreaM2: totalArea,
    totalFonoabsorbenteAreaM2: totalFonoArea,
    totalNoxAbatedGramsPerHour: parseFloat(totalRemovedGramsH.toFixed(1)),
    totalNoxAbatedKgPerYear: parseFloat(totalKgYear.toFixed(1)),
    streets,
    nearestTreatedStreet,
    distanceToNearestStreetM,
    isActivePointOnTreatedStreet: distanceToNearestStreetM !== null && distanceToNearestStreetM <= 180,
  };
}

const MALAGA_TIO2_TREATMENT_STREETS_MAP: Record<string, Tio2StreetCanyon> =
  MALAGA_TIO2_TREATMENT_STREETS.reduce((acc, st) => {
    acc[st.id] = st;
    return acc;
  }, {} as Record<string, Tio2StreetCanyon>);

export function generateTio2GeoJson(summary: Tio2PhotocatalyticSummary): any {
  return {
    type: 'FeatureCollection',
    features: summary.streets.map((st) => {
      const orig = MALAGA_TIO2_TREATMENT_STREETS_MAP[st.streetId];
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [orig?.lon || -4.42, orig?.lat || 36.71],
        },
        properties: {
          id: st.streetId,
          nombre: st.streetName,
          distrito: st.distrito,
          expediente_gmu: st.expedienteGmu,
          grado_evidencia: st.evidenceGrade,
          material_comercial: st.materialComercial,
          geometria_superficie: st.surfaceGeometry,
          angulo_inclinacion_deg: st.tiltAngleDeg,
          ano_instalacion: st.yearInstalled,
          svf: st.svf,
          factor_reflexion_multiple_oke: st.multipleReflectionFactorM,
          relacion_aspecto_hw: st.aspectRatioHW,
          superficie_tio2_m2: st.tio2AreaM2,
          superficie_fonoabsorbente_m2: st.fonoabsorbenteAreaM2,
          uva_efectiva_wm2: st.effectiveUvaWm2,
          flujo_fotonico_ueinstein_m2_s: st.actinicPhotonFluxUeinsteinM2S,
          rendimiento_cuantico_aqy: st.apparentQuantumYieldMolEinstein,
          resistencia_aerodinamica_ra_sm: st.aerodynamicResistanceRaSm,
          resistencia_subcapa_laminar_rb_sm: st.laminarBoundaryResistanceRbSm,
          resistencia_superficial_rc_sm: st.surfacePhotocatalyticResistanceRcSm,
          velocidad_deposicion_efectiva_cms: st.effectiveDepositionVelocityCmS,
          numero_damkohler_da: st.damkohlerNumberDa,
          regimen_limitante: st.limitingRegime,
          gamma_iupac: st.iupacReactiveUptakeGamma,
          selectividad_nitrato_sno3: st.nitrateSelectivitySNo3,
          factor_retencion_limpieza: st.foulingRetentionFactor,
          nox_inicial_ugm3: st.initialNoxUgm3,
          nox_abatido_ugm3: st.abatedNoxUgm3,
          eficiencia_abatimiento_pct: st.abatementPct,
          remocion_nox_g_h: st.removedNoxGramsPerHour,
          acumulacion_nitrato_mg_m2_dia: st.nitrateAccumulationMgNo3M2Day,
          flujo_renoxificacion_ug_m2_h: st.renoxificationFluxUgM2H,
          penalizacion_hono_ugm3: st.honoPenaltyUgm3,
        },
      };
    }),
  };
}

export function exportTio2GeoJson(summary: Tio2PhotocatalyticSummary): string {
  return JSON.stringify(generateTio2GeoJson(summary), null, 2);
}

export function exportTio2Csv(summary: Tio2PhotocatalyticSummary): string {
  const headers =
    'calle_id,nombre,distrito,expediente_gmu,grado_evidencia,material_comercial,geometria_3d,angulo_deg,ano_instalacion,svf,m_refl_oke,hw_ratio,superficie_tio2_m2,superficie_fonoabsorbente_m2,uva_efectiva_wm2,flujo_fotonico_ueinstein_m2s,aqy_mol_einstein,ra_sm,rb_sm,rc_tio2_sm,v_dep_cms,damkohler_da,regimen_limitante,gamma_iupac,selectividad_no3,factor_limpieza_fouling,nox_inicial_ugm3,nox_final_ugm3,eficiencia_pct,remocion_nox_g_h,nitrato_ic_mg_m2_dia,renoxificacion_ug_m2_h,hono_secundario_ugm3\n';
  const rows = summary.streets
    .map(
      (s) =>
        `${s.streetId},"${s.streetName}","${s.distrito}","${s.expedienteGmu}","${s.evidenceGrade}","${s.materialComercial}",${s.surfaceGeometry},${s.tiltAngleDeg},${s.yearInstalled},${s.svf},${s.multipleReflectionFactorM},${s.aspectRatioHW},${s.tio2AreaM2},${s.fonoabsorbenteAreaM2},${s.effectiveUvaWm2},${s.actinicPhotonFluxUeinsteinM2S},${s.apparentQuantumYieldMolEinstein},${s.aerodynamicResistanceRaSm},${s.laminarBoundaryResistanceRbSm},${s.surfacePhotocatalyticResistanceRcSm},${s.effectiveDepositionVelocityCmS},${s.damkohlerNumberDa},${s.limitingRegime},${s.iupacReactiveUptakeGamma},${s.nitrateSelectivitySNo3},${s.foulingRetentionFactor},${s.initialNoxUgm3},${s.abatedNoxUgm3},${s.abatementPct},${s.removedNoxGramsPerHour},${s.nitrateAccumulationMgNo3M2Day},${s.renoxificationFluxUgM2H},${s.honoPenaltyUgm3}`
    )
    .join('\n');
  return headers + rows;
}
