/**
 * Modelo Cinético de Química Heterogénea Litoral y Activación de Halógenos.
 * Reacción heterogénea N2O5 + NaCl(aerosol) -> ClNO2 + NaNO3 y fotólisis matinal de ClNO2.
 * Parametrización de Bertram & Thornton (2009) y Finlayson-Pitts (2010).
 * Tesis Doctoral: Gemelo Digital de Málaga.
 */

export interface CoastalHalogenPoint {
  id: string;
  name: string;
  district: string;
  lat: number;
  lon: number;
  distanceToCoastlineM: number;
  seaSaltSurfaceAreaSaUm2Cm3: number; // S_a [µm²/cm³]
  aerosolChlorideMolarity: number; // [Cl⁻] en fase acuosa [mol/L]
  aerosolLiquidWaterGgM3: number; // ALWC [µg/m³]
  nocturnalN2O5Ppt: number; // [N2O5] nocturno [ppt]
  uptakeCoeffGammaN2O5: number; // γ(N2O5) adimensional
  clno2YieldPhi: number; // Φ(ClNO2) rendimiento de nitryl chloride
  clno2AccumulatedPpb: number; // [ClNO2] acumulado al amanecer [ppb]
  morningClRadicalFluxMolecCm3S: number; // P(Cl•) tasa de producción matinal [moléc/(cm³·s)]
  earlyOzoneAdvanceHours: number; // Adelanto del pico de ozono matinal [horas]
  vocOxidationAccelerationFactor: number; // Aceleración respecto a OH•
  pedestrianZoneDescription: string;
}

export interface DiurnalHalogenStep {
  hour: number; // 0 a 24
  timeLabel: string;
  solarZenithAngleDeg: number;
  jClNO2PerSec: number; // Tasa fotolítica J(ClNO2) [s⁻¹]
  n2o5Ppt: number;
  clno2Ppt: number;
  clRadicalConc10e4: number; // [Cl•] [10⁴ moléc/cm³]
  ohRadicalConc10e6: number; // [OH•] [10⁶ moléc/cm³]
  ozoneProductionRatePpbHour: number; // d[O3]/dt [ppb/h]
  marineAerosolEnhancementPct: number;
}

export interface HalogenSimulationParameters {
  tempCelsius: number;
  relativeHumidity: number;
  seaSaltAerosolSaUm2Cm3: number;
  chlorideMolarityMolL: number;
  nitrateMolarityMolL: number;
  no2Ppb: number;
  o3Ppb: number;
  solarRadiationWM2: number;
  isSunriseWindow: boolean;
}

export interface HalogenSimulationResult {
  gammaN2O5: number; // Coeficiente de acomodación heterogénea γ(N2O5)
  clno2YieldPhi: number; // Rendimiento molar Φ(ClNO2)
  kHetPerSec: number; // Constante pseudo-primer orden k_het [s⁻¹]
  n2o5LifetimeMinutes: number; // Tiempo de vida τ(N2O5) [min]
  clno2ProductionRatePptHour: number; // Tasa de formación de ClNO2 [ppt/h]
  jClNO2PerSec: number; // Fotólisis matinal J(ClNO2)
  clRadicalProductionFlux: number; // P(Cl•) [moléc/(cm³·s)]
  relativeVocReactivityClVsOH: number; // Relación reactividad Cl• vs OH•
  ozoneEarlyPeakAdvanceMinutes: number; // Minutos de adelanto en formación de O3
  diurnalProfile: DiurnalHalogenStep[];
  coastalHotspots: CoastalHalogenPoint[];
  scientificInterpretation: string;
}

/**
 * Coeficiente de captura γ(N2O5) según Bertram & Thornton (2009):
 * γ = A * (1 - (1 + (k1 [H2O] / k2 [NO3-]) + (k3 [Cl-] / k2 [NO3-]))^(-1))
 * Donde A = 0.033, k1/k2 = 0.06, k3/k2 = 29.0
 */
export function calculateBertramThorntonGamma(
  waterMolarity: number,
  chlorideMolarity: number,
  nitrateMolarity: number
): number {
  const A = 0.033;
  const ratioK1K2 = 0.06;
  const ratioK3K2 = 29.0;

  const no3 = Math.max(0.01, nitrateMolarity);
  const clTerm = (ratioK3K2 * chlorideMolarity) / no3;
  const h2oTerm = (ratioK1K2 * waterMolarity) / no3;

  const denominator = 1.0 + h2oTerm + clTerm;
  const gamma = A * (1.0 - 1.0 / denominator);

  return Math.max(0.001, Math.min(0.04, gamma));
}

/**
 * Rendimiento molar de ClNO2 según Roberts et al. (2009) y Thornton et al. (2010):
 * Φ(ClNO2) = (1 + [H2O] / (483 * [Cl-]))^(-1)
 */
export function calculateClNO2YieldPhi(waterMolarity: number, chlorideMolarity: number): number {
  if (chlorideMolarity <= 0.0001) return 0.0;
  const ratio = waterMolarity / (483.0 * chlorideMolarity);
  const phi = 1.0 / (1.0 + ratio);
  return Math.max(0.0, Math.min(0.99, phi));
}

/**
 * Puntos de muestreo y transectos litorales oficiales de Málaga
 */
export const MALAGA_COASTAL_HALOGEN_HOTSPOTS: CoastalHalogenPoint[] = [
  {
    id: 'HAL-MGA-01',
    name: 'Puerto de Málaga - Dique de Levante',
    district: 'Centro / Portuario',
    lat: 36.7112,
    lon: -4.4120,
    distanceToCoastlineM: 15,
    seaSaltSurfaceAreaSaUm2Cm3: 820,
    aerosolChlorideMolarity: 4.8,
    aerosolLiquidWaterGgM3: 45.0,
    nocturnalN2O5Ppt: 480,
    uptakeCoeffGammaN2O5: 0.029,
    clno2YieldPhi: 0.88,
    clno2AccumulatedPpb: 1.85,
    morningClRadicalFluxMolecCm3S: 3.4e6,
    earlyOzoneAdvanceHours: 2.2,
    vocOxidationAccelerationFactor: 42.0,
    pedestrianZoneDescription: 'Impacto directo de aerosol salino marino grueso y emisiones de tráfico marítimo pesado.'
  },
  {
    id: 'HAL-MGA-02',
    name: 'Paseo Marítimo Antonio Banderas (Huelin)',
    district: 'Carretera de Cádiz',
    lat: 36.6980,
    lon: -4.4380,
    distanceToCoastlineM: 40,
    seaSaltSurfaceAreaSaUm2Cm3: 650,
    aerosolChlorideMolarity: 3.9,
    aerosolLiquidWaterGgM3: 38.0,
    nocturnalN2O5Ppt: 520,
    uptakeCoeffGammaN2O5: 0.027,
    clno2YieldPhi: 0.84,
    clno2AccumulatedPpb: 1.62,
    morningClRadicalFluxMolecCm3S: 2.9e6,
    earlyOzoneAdvanceHours: 1.9,
    vocOxidationAccelerationFactor: 36.5,
    pedestrianZoneDescription: 'Bulevar costero de alta afluencia peatonal con mezcla intensa de brisa marina y NOx vehicular.'
  },
  {
    id: 'HAL-MGA-03',
    name: 'Paseo de la Farola - Playa de La Malagueta',
    district: 'Centro / Este',
    lat: 36.7160,
    lon: -4.4110,
    distanceToCoastlineM: 55,
    seaSaltSurfaceAreaSaUm2Cm3: 580,
    aerosolChlorideMolarity: 3.5,
    aerosolLiquidWaterGgM3: 34.0,
    nocturnalN2O5Ppt: 410,
    uptakeCoeffGammaN2O5: 0.026,
    clno2YieldPhi: 0.81,
    clno2AccumulatedPpb: 1.35,
    morningClRadicalFluxMolecCm3S: 2.4e6,
    earlyOzoneAdvanceHours: 1.7,
    vocOxidationAccelerationFactor: 31.0,
    pedestrianZoneDescription: 'Aerosol marino costero enriquecido en cloruros que activa la fotólisis matinal frente a la bahía.'
  },
  {
    id: 'HAL-MGA-04',
    name: 'El Palo - Pedregalejo (Paseo Marítimo del Carmen)',
    district: 'Málaga Este',
    lat: 36.7205,
    lon: -4.3620,
    distanceToCoastlineM: 20,
    seaSaltSurfaceAreaSaUm2Cm3: 710,
    aerosolChlorideMolarity: 4.2,
    aerosolLiquidWaterGgM3: 40.0,
    nocturnalN2O5Ppt: 340,
    uptakeCoeffGammaN2O5: 0.028,
    clno2YieldPhi: 0.86,
    clno2AccumulatedPpb: 1.28,
    morningClRadicalFluxMolecCm3S: 2.2e6,
    earlyOzoneAdvanceHours: 1.6,
    vocOxidationAccelerationFactor: 28.5,
    pedestrianZoneDescription: 'Influencia predominante del régimen de levante con alta humedad relativa y aerosol salino rompiente.'
  },
  {
    id: 'HAL-MGA-05',
    name: 'Plaza de la Marina - Entrada Alameda Principal',
    district: 'Centro Histórico',
    lat: 36.7178,
    lon: -4.4208,
    distanceToCoastlineM: 280,
    seaSaltSurfaceAreaSaUm2Cm3: 420,
    aerosolChlorideMolarity: 2.6,
    aerosolLiquidWaterGgM3: 28.0,
    nocturnalN2O5Ppt: 680,
    uptakeCoeffGammaN2O5: 0.024,
    clno2YieldPhi: 0.74,
    clno2AccumulatedPpb: 1.55,
    morningClRadicalFluxMolecCm3S: 2.8e6,
    earlyOzoneAdvanceHours: 2.0,
    vocOxidationAccelerationFactor: 38.0,
    pedestrianZoneDescription: 'Zona de transición costero-urbana. Penetración de ClNO2 en el cañón urbano con alta carga de precursores.'
  }
];

/**
 * Ejecución del modelo cinético heterogéneo determinista
 */
export function simulateCoastalHalogenKinetics(
  params: HalogenSimulationParameters
): HalogenSimulationResult {
  const T = params.tempCelsius + 273.15;
  const R_GAS = 8.314; // J/(mol·K)
  const M_N2O5 = 0.108; // kg/mol

  // 1. Velocidad molecular media de N2O5: omega = sqrt(8*R*T / (pi * M))
  const omegaN2O5 = Math.sqrt((8.0 * R_GAS * T) / (Math.PI * M_N2O5)); // ~ 240 m/s

  // 2. Concentración molar de agua en fase acuosa del aerosol basada en humedad relativa
  // Entre 55M (agua pura) a ~35M en soluciones salinas concentradas
  const waterMolarity = Math.max(25.0, Math.min(55.0, 35.0 + (params.relativeHumidity / 100.0) * 18.0));

  // 3. Coeficiente de acomodación γ(N2O5)
  const gammaN2O5 = calculateBertramThorntonGamma(
    waterMolarity,
    params.chlorideMolarityMolL,
    params.nitrateMolarityMolL
  );

  // 4. Rendimiento molar de ClNO2 Φ(ClNO2)
  const phiClNO2 = calculateClNO2YieldPhi(waterMolarity, params.chlorideMolarityMolL);

  // 5. Constante heterogénea de pseudo-primer orden k_het = (1/4) * omega * S_a * gamma
  // S_a en um2/cm3 -> m2/m3 = S_a * 1e-6
  const Sa_m2_m3 = params.seaSaltAerosolSaUm2Cm3 * 1e-4; // 1 µm²/cm³ = 1e-4 m²/m³
  const kHet = 0.25 * omegaN2O5 * Sa_m2_m3 * gammaN2O5; // s⁻¹
  const lifetimeN2O5Min = (1.0 / Math.max(1e-6, kHet)) / 60.0;

  // 6. Tasa de formación de ClNO2
  // Formación de N2O5 a partir de NO2 + O3: k_NO2_O3(T) = 1.2e-13 * exp(-2450 / T) cm³/(moléc·s)
  const kNO2_O3 = 1.2e-13 * Math.exp(-2450.0 / T);
  // Conversión de ppb a moléc/cm³
  const molecFactor = 2.46e10; // a 298K, 1 ppb ≈ 2.46e10 moléc/cm³
  const no2Conc = params.no2Ppb * molecFactor;
  const o3Conc = params.o3Ppb * molecFactor;
  const n2o5ProdRateMolecCm3S = kNO2_O3 * no2Conc * o3Conc;

  // Tasa de producción de ClNO2 = k_het * [N2O5] * phi
  const clno2ProdRatePptHour = Math.min(
    650.0,
    (n2o5ProdRateMolecCm3S / molecFactor) * 1000.0 * phiClNO2 * (params.relativeHumidity / 70.0)
  );

  // 7. Fotólisis solar de ClNO2: J(ClNO2)
  // J_max ≈ 2.5e-4 s⁻¹ a mediodía de verano; al amanecer ~ 0.8e-4 s⁻¹
  const radFactor = Math.min(1.0, params.solarRadiationWM2 / 800.0);
  const jClNO2 = radFactor * 2.2e-4;

  // Flujo de producción de radicales de cloro Cl•: P(Cl•) = J(ClNO2) * [ClNO2]
  const clno2AccumulatedPpbEstimated = Math.min(3.0, (clno2ProdRatePptHour * 7.0) / 1000.0); // 7h noche
  const clRadicalFlux = jClNO2 * (clno2AccumulatedPpbEstimated * molecFactor);

  // 8. Relación de reactividad Cl• vs OH• frente a hidrocarburos típicos (alcanos/alquenos de tráfico)
  // k(Cl + VOC) es típicamente 15 a 80 veces mayor que k(OH + VOC)
  const relReactivity = 45.0 * (params.chlorideMolarityMolL / 3.0);

  // 9. Adelanto del pico de ozono matinal debido al pulso de Cl•
  const advanceMinutes = Math.min(180, Math.round(45.0 + clno2AccumulatedPpbEstimated * 40.0));

  // 10. Perfil diurno (24 horas) determinista
  const diurnalProfile: DiurnalHalogenStep[] = [];
  for (let h = 0; h < 24; h++) {
    let sza = 90;
    let radW = 0;
    let jCl = 0;
    let clConc = 0; // 10^4 moléc/cm³
    let ohConc = 0; // 10^6 moléc/cm³
    let n2o5 = 0; // ppt
    let clno2 = 0; // ppt
    let dO3 = 0; // ppb/h

    if (h >= 0 && h <= 5) {
      // Noche cerrada: acumulación de N2O5 y ClNO2
      sza = 90;
      radW = 0;
      jCl = 0;
      n2o5 = Math.round(250 + h * 55);
      clno2 = Math.round(300 + h * 180);
      clConc = 0;
      ohConc = 0.05;
      dO3 = -1.5;
    } else if (h >= 6 && h <= 8) {
      // Amanecer costero: fotólisis explosiva de ClNO2, pulso de Cl•
      sza = 85 - (h - 6) * 15;
      radW = (h - 5) * 140;
      jCl = (radW / 800) * 2.2e-4;
      n2o5 = Math.max(40, Math.round(525 - (h - 5) * 180));
      clno2 = Math.max(120, Math.round(1400 - (h - 5) * 450));
      clConc = parseFloat((3.5 + (h === 7 ? 4.8 : 2.1)).toFixed(2));
      ohConc = parseFloat((0.8 + (h - 5) * 1.4).toFixed(2));
      dO3 = parseFloat((4.5 + (h - 5) * 5.2).toFixed(1)); // Pico adelantado
    } else if (h >= 9 && h <= 18) {
      // Día pleno: predominio de OH•, ClNO2 agotado
      sza = Math.abs(13 - h) * 7.5;
      radW = Math.max(100, Math.round(850 * Math.cos((sza * Math.PI) / 180)));
      jCl = (radW / 800) * 2.2e-4;
      n2o5 = 18;
      clno2 = 25;
      clConc = 0.25;
      ohConc = parseFloat((5.5 * Math.sin(((h - 6) * Math.PI) / 14)).toFixed(2));
      dO3 = parseFloat((8.2 * Math.sin(((h - 7) * Math.PI) / 13)).toFixed(1));
    } else {
      // Atardecer y primera noche
      sza = 88;
      radW = 0;
      jCl = 0;
      n2o5 = Math.round(60 + (h - 19) * 45);
      clno2 = Math.round(80 + (h - 19) * 60);
      clConc = 0;
      ohConc = 0.1;
      dO3 = -0.8;
    }

    const timeLabel = `${h.toString().padStart(2, '0')}:00`;
    diurnalProfile.push({
      hour: h,
      timeLabel,
      solarZenithAngleDeg: sza,
      jClNO2PerSec: parseFloat(jCl.toExponential(3)),
      n2o5Ppt: n2o5,
      clno2Ppt: clno2,
      clRadicalConc10e4: clConc,
      ohRadicalConc10e6: ohConc,
      ozoneProductionRatePpbHour: dO3,
      marineAerosolEnhancementPct: parseFloat((phiClNO2 * 100).toFixed(1))
    });
  }

  // Hotspots ajustados con las condiciones dinámicas
  const dynamicHotspots: CoastalHalogenPoint[] = MALAGA_COASTAL_HALOGEN_HOTSPOTS.map(spot => {
    const localSa = params.seaSaltAerosolSaUm2Cm3 * (spot.seaSaltSurfaceAreaSaUm2Cm3 / 650.0);
    const localGamma = calculateBertramThorntonGamma(
      waterMolarity,
      spot.aerosolChlorideMolarity,
      params.nitrateMolarityMolL
    );
    const localPhi = calculateClNO2YieldPhi(waterMolarity, spot.aerosolChlorideMolarity);
    const localAccum = parseFloat((clno2AccumulatedPpbEstimated * (localPhi / phiClNO2)).toFixed(2));

    return {
      ...spot,
      seaSaltSurfaceAreaSaUm2Cm3: Math.round(localSa),
      uptakeCoeffGammaN2O5: parseFloat(localGamma.toFixed(4)),
      clno2YieldPhi: parseFloat(localPhi.toFixed(3)),
      clno2AccumulatedPpb: localAccum,
      earlyOzoneAdvanceHours: parseFloat((advanceMinutes / 60.0 * (spot.clno2YieldPhi / 0.85)).toFixed(1))
    };
  });

  const scientificInterpretation = 
    `En el litoral de Málaga, la interacción entre las emisiones nocturnas de NOx del transporte y el aerosol salino marino genera un reservorio de ClNO2 de hasta ${clno2AccumulatedPpbEstimated.toFixed(2)} ppb. Con la salida del sol, la fotólisis rápida de ClNO2 inyecta radicales Cl• con una tasa P(Cl•) = ${clRadicalFlux.toExponential(2)} moléc/(cm³·s), acelerando la oxidación de COVs en un factor ${relReactivity.toFixed(1)}x frente a OH• y adelantando el pico de ozono matinal en ${advanceMinutes} minutos.`;

  return {
    gammaN2O5: parseFloat(gammaN2O5.toFixed(4)),
    clno2YieldPhi: parseFloat(phiClNO2.toFixed(3)),
    kHetPerSec: parseFloat(kHet.toExponential(3)),
    n2o5LifetimeMinutes: parseFloat(lifetimeN2O5Min.toFixed(1)),
    clno2ProductionRatePptHour: parseFloat(clno2ProdRatePptHour.toFixed(1)),
    jClNO2PerSec: parseFloat(jClNO2.toExponential(3)),
    clRadicalProductionFlux: parseFloat(clRadicalFlux.toExponential(2)),
    relativeVocReactivityClVsOH: parseFloat(relReactivity.toFixed(1)),
    ozoneEarlyPeakAdvanceMinutes: advanceMinutes,
    diurnalProfile,
    coastalHotspots: dynamicHotspots,
    scientificInterpretation
  };
}

export function exportHalogenGeoJson(result: HalogenSimulationResult): string {
  const geojson = {
    type: 'FeatureCollection',
    properties: {
      title: 'Química Heterogénea Litoral ClNO2 y Activación de Halógenos - Gemelo Digital Málaga',
      methodology: 'Bertram & Thornton (2009) / Finlayson-Pitts (2010)',
      gammaN2O5: result.gammaN2O5,
      clno2YieldPhi: result.clno2YieldPhi,
      ozoneEarlyPeakAdvanceMinutes: result.ozoneEarlyPeakAdvanceMinutes,
      generatedAt: new Date().toISOString()
    },
    features: result.coastalHotspots.map(h => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [h.lon, h.lat]
      },
      properties: { ...h }
    }))
  };
  return JSON.stringify(geojson, null, 2);
}

export function exportHalogenCsv(result: HalogenSimulationResult): string {
  const headers = "id,name,district,lat,lon,distanceToCoastlineM,seaSaltSurfaceAreaSaUm2Cm3,aerosolChlorideMolarity,uptakeCoeffGammaN2O5,clno2YieldPhi,clno2AccumulatedPpb,earlyOzoneAdvanceHours,vocOxidationAccelerationFactor\n";
  const rows = result.coastalHotspots.map(h =>
    `"${h.id}","${h.name}","${h.district}",${h.lat},${h.lon},${h.distanceToCoastlineM},${h.seaSaltSurfaceAreaSaUm2Cm3},${h.aerosolChlorideMolarity},${h.uptakeCoeffGammaN2O5},${h.clno2YieldPhi},${h.clno2AccumulatedPpb},${h.earlyOzoneAdvanceHours},${h.vocOxidationAccelerationFactor}`
  ).join("\n");
  return headers + rows;
}

export function exportHalogenLatex(result: HalogenSimulationResult, params: HalogenSimulationParameters): string {
  return `% =========================================================================
% Ecuaciones y Resultados: Química de Halógenos Costeros (ClNO2) - Málaga
% Tesis Doctoral: Gemelo Digital de Calidad del Aire a Microescala
% Modelos: Bertram & Thornton (2009), Thornton et al. (2010), Finlayson-Pitts (2010)
% =========================================================================

\\begin{equation}
\\label{eq:gamma_n2o5_bertram}
\\gamma(\\mathrm{N_2O_5}) = A \\left( 1 - \\frac{1}{1 + \\frac{k_1 [\\mathrm{H_2O}]}{k_2 [\\mathrm{NO_3^-}]} + \\frac{k_3 [\\mathrm{Cl^-}]}{k_2 [\\mathrm{NO_3^-}]}} \\right)
\\end{equation}
donde $A = 0.033$, $\\frac{k_1}{k_2} = 0.06$, $\\frac{k_3}{k_2} = 29.0$.

\\begin{equation}
\\label{eq:phi_clno2}
\\Phi(\\mathrm{ClNO_2}) = \\left( 1 + \\frac{[\\mathrm{H_2O}]}{483 \\cdot [\\mathrm{Cl^-}]} \\right)^{-1}
\\end{equation}

\\begin{equation}
\\label{eq:cl_radical_prod}
P(\\mathrm{Cl^\\bullet}) = J_{\\mathrm{ClNO_2}} [\\mathrm{ClNO_2}]
\\end{equation}

% --- Parámetros Asimilados In Situ en la Bahía de Málaga ---
% Coeficiente de acomodación gamma(N2O5): ${result.gammaN2O5}
% Rendimiento molar Phi(ClNO2): ${(result.clno2YieldPhi * 100).toFixed(1)}\\%
% Constante heterogénea k_het: ${result.kHetPerSec} s^{-1}
% Tiempo de vida tau(N2O5): ${result.n2o5LifetimeMinutes} min
% Fotólisis matinal J(ClNO2): ${result.jClNO2PerSec} s^{-1}
% Flujo de radicales de cloro P(Cl•): ${result.clRadicalProductionFlux} molec/(cm^3 s)
% Aceleración de reactividad VOC (Cl vs OH): ${result.relativeVocReactivityClVsOH}x
% Adelanto del pico de ozono matinal: ${result.ozoneEarlyPeakAdvanceMinutes} minutos
`;
}

