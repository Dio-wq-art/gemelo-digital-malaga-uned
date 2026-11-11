/**
 * Modelo Cinético Determinista de Química Interfacial de Yodo y Bromo Marinos en la Bahía de Málaga.
 * Emisión de I2/HOI por reacción con O3 en la microlapa superficial marina (SML),
 * ciclos catalíticos de IO, formación de ácido yódico (HIO3) y nucleación de partículas ultrafinas litorales.
 * 
 * Fundamentación Científica:
 * - Carpenter et al. (2013): Atmospheric iodine levels influenced by sea surface chemistry (Nature Geoscience).
 * - Saiz-Lopez et al. (2012, 2014): Reactive halogen chemistry in the troposphere (Chemical Reviews).
 * - Sipilä et al. (2016): Molecular-scale identification of iodine oxide particle nucleation (Science).
 * - Tesis Doctoral: Gemelo Digital de Málaga.
 */

export interface MarineIodinePoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceToOpenSeaM: number;
  iodideMolarityNm: number; // [I⁻] en microlapa marina [nM] (20-120 nM)
  seaSurfaceTempC: number; // SST [°C]
  o3DepositionVelocityCmS: number; // v_d(O3) sobre agua de mar [cm/s]
  iodineEmissionFluxMolecCm2S: number; // F(I2 + HOI) [moléc/(cm²·s)]
  steadyStateIOPpt: number; // [IO] en fase gas [ppt]
  hio3NucleationRateJ1Cm3S: number; // Tasa de nucleación de HIO3 [cm⁻³·s⁻¹]
  ozoneDestructionRatePpbDay: number; // Destrucción neta de O3 por halógenos [ppb/día]
  description: string;
}

export interface MarineIodineParameters {
  seaSurfaceTempC: number; // SST [°C] (16 a 28°C en Málaga)
  seaSalinityPsu: number; // Salinidad [PSU] (~36.5 a 38.0 PSU)
  iodideConcentrationNm: number; // [I⁻] en agua de mar (nM)
  ozoneGasPpb: number; // [O3] atmosférico en superficie (ppb)
  windSpeedMs: number; // Velocidad del viento superficial (m/s)
  solarRadiationWm2: number; // Radiación solar incidente (W/m²)
  no2GasPpb: number; // [NO2] de fondo para formación de IONO2 (ppb)
}

export interface MarineIodineSimulationResult {
  hoiSurfaceFluxMolecCm2S: number; // Flujo interfacial de HOI [moléc/(cm²·s)]
  i2SurfaceFluxMolecCm2S: number; // Flujo interfacial de I2 [moléc/(cm²·s)]
  totalIodineFluxGramsKm2Day: number; // Emisión total de yodo reactivo [g I/(km²·día)]
  steadyStateIOPpt: number; // Concentración de IO en estado fotoestacionario [ppt]
  steadyStateIAtomCm3: number; // [I•] átomos libres [moléc/cm³]
  hio3GasConcentrationCm3: number; // [HIO3] ácido yódico gaseoso [moléc/cm³]
  nucleationRateJ1Cm3S: number; // J_1 tasa de nucleación de nuevas partículas [cm⁻³·s⁻¹]
  marineUltrafineParticleYieldUgm3: number; // Aporte a PM0.1 marino [µg/m³]
  catalyticOzoneLossPpbDay: number; // Tasa de pérdida de O3 catalizada por I/IO [ppb/día]
  iono2FormationRatePptHour: number; // Tasa de secuestro de NOx en IONO2 [ppt/h]
  malagaBayHotspots: MarineIodinePoint[];
  scientificInterpretation: string;
}

export const MALAGA_BAY_IODINE_HOTSPOTS: MarineIodinePoint[] = [
  {
    id: 'muelle_uno_darsena',
    name: 'Muelle Uno / Dársena de Guadiaro',
    lat: 36.7165,
    lon: -4.4132,
    distanceToOpenSeaM: 150,
    iodideMolarityNm: 78.5,
    seaSurfaceTempC: 22.4,
    o3DepositionVelocityCmS: 0.045,
    iodineEmissionFluxMolecCm2S: 4.8e9,
    steadyStateIOPpt: 1.45,
    hio3NucleationRateJ1Cm3S: 12.8,
    ozoneDestructionRatePpbDay: 2.85,
    description: 'Aguas confinadas portuarias con materia orgánica enriquecida y contacto con plumas diésel'
  },
  {
    id: 'playa_la_malagueta',
    name: 'Playa de la Malagueta (Zona de Rompientes)',
    lat: 36.7188,
    lon: -4.4065,
    distanceToOpenSeaM: 20,
    iodideMolarityNm: 92.0,
    seaSurfaceTempC: 21.8,
    o3DepositionVelocityCmS: 0.058,
    iodineEmissionFluxMolecCm2S: 7.2e9,
    steadyStateIOPpt: 2.10,
    hio3NucleationRateJ1Cm3S: 24.5,
    ozoneDestructionRatePpbDay: 4.15,
    description: 'Elevada oxigenación en rompiente, mayor recambio de microlapa y flujo máximo de I2/HOI'
  },
  {
    id: 'desembocadura_guadalhorce',
    name: 'Paraje Natural Desembocadura del Guadalhorce',
    lat: 36.6685,
    lon: -4.4485,
    distanceToOpenSeaM: 50,
    iodideMolarityNm: 110.0,
    seaSurfaceTempC: 23.1,
    o3DepositionVelocityCmS: 0.062,
    iodineEmissionFluxMolecCm2S: 8.9e9,
    steadyStateIOPpt: 2.65,
    hio3NucleationRateJ1Cm3S: 38.0,
    ozoneDestructionRatePpbDay: 5.30,
    description: 'Estuario hipersalino con alta productividad biológica, algas pardas y máxima emisión de halocarbonos'
  },
  {
    id: 'pedregalejo_el_palo',
    name: 'Playas de Pedregalejo y El Palo',
    lat: 36.7205,
    lon: -4.3725,
    distanceToOpenSeaM: 30,
    iodideMolarityNm: 68.0,
    seaSurfaceTempC: 21.5,
    o3DepositionVelocityCmS: 0.042,
    iodineEmissionFluxMolecCm2S: 3.9e9,
    steadyStateIOPpt: 1.20,
    hio3NucleationRateJ1Cm3S: 8.4,
    ozoneDestructionRatePpbDay: 2.10,
    description: 'Franja litoral urbana con brisa marina diurna directa hacia el paseo marítimo'
  }
];

/**
 * Cálculo del flujo interfacial de HOI e I2 según Carpenter et al. (2013) y Macdonald et al. (2014):
 * F(HOI) = [O3]_gas * ([I-] / (a + b [I-])) * f(T, u10)
 * F(I2) = [O3]_gas * [I-]² / (c + d [I-]²) * f(T, u10)
 */
export function calculateInterfacialIodineFluxes(
  o3GasPpb: number,
  iodideNm: number,
  sstCelsius: number,
  windSpeedMs: number
): { fluxHoi: number; fluxI2: number } {
  // Constante de Henry y solubilidad térmica de O3
  const sstK = sstCelsius + 273.15;
  const tempFactor = Math.exp(1800 * (1 / 298.15 - 1 / sstK));

  // Dependencia del viento en el intercambio gaseoso interfacial (k_w)
  const scNum = 1000.0; // Número de Schmidt para gases traza marinos
  const kwCmH = 0.31 * Math.pow(Math.max(0.5, windSpeedMs), 2) * Math.pow(scNum / 660, -0.5);
  const kwNorm = Math.min(2.5, Math.max(0.5, kwCmH / 5.0));

  // Parametrización de Macdonald et al. (2014) en moléc/(cm²·s) por ppb de O3
  const iodideTermHoi = iodideNm / (15.0 + 0.35 * iodideNm);
  const fluxHoi = o3GasPpb * iodideTermHoi * 8.5e7 * tempFactor * kwNorm;

  const iodideTermI2 = Math.pow(iodideNm, 2) / (1200.0 + Math.pow(iodideNm, 2));
  const fluxI2 = o3GasPpb * iodideTermI2 * 2.4e7 * tempFactor * kwNorm;

  return { fluxHoi, fluxI2 };
}

/**
 * Simulación Determinista de la Química de Halógenos Interfaciales y Nucleación de HIO3
 */
export function simulateMarineInterfacialHalogens(
  params: MarineIodineParameters
): MarineIodineSimulationResult {
  const {
    seaSurfaceTempC,
    seaSalinityPsu,
    iodideConcentrationNm,
    ozoneGasPpb,
    windSpeedMs,
    solarRadiationWm2,
    no2GasPpb
  } = params;

  // 1. Flujos interfaciales de emisión
  const { fluxHoi, fluxI2 } = calculateInterfacialIodineFluxes(
    ozoneGasPpb,
    iodideConcentrationNm,
    seaSurfaceTempC,
    windSpeedMs
  );

  // Flujo total de masa de yodo elemental [g I / (km²·día)]
  // Peso atómico del Yodo = 126.9 g/mol
  const totalMoleculesCm2S = fluxHoi + 2.0 * fluxI2;
  const totalMolesCm2S = totalMoleculesCm2S / 6.022e23;
  const gramsPerKm2Day = totalMolesCm2S * 126.9 * (1e10) * 86400; // 1 km² = 1e10 cm²

  // 2. Cinética fotoestacionaria de radicales de Yodo en capa superficial (0-50m)
  // Fotólisis de I2 es instantánea: J(I2) ~ 0.15 s⁻¹ en Málaga
  const jI2 = (solarRadiationWm2 / 1000.0) * 0.18;
  const jHoi = (solarRadiationWm2 / 1000.0) * 0.0045;

  // Producción de átomos de Yodo libre: P(I•) = 2 * J(I2)[I2] + J(HOI)[HOI]
  // En capa límite marina de espesor h_mbl = 80m
  const mblHeightCm = 8000.0;
  const prodIAtomRateCm3S = (2.0 * fluxI2 + fluxHoi) / mblHeightCm; // moléc/(cm³·s)

  // Reacción I• + O3 -> IO + O2 (k1 = 1.3e-12 cm³/(moléc·s))
  // Reacción IO + NO -> I• + NO2
  // Reacción IO + NO2 + M -> IONO2
  // Reacción IO + IO -> I2O2 -> HIO3
  const kI_O3 = 1.3e-12;
  const kIO_NO = 2.1e-11;
  const kIO_NO2 = 1.5e-11;
  const kIO_IO = 9.9e-11;

  const o3MoleculesCm3 = ozoneGasPpb * 2.46e10;
  const no2MoleculesCm3 = no2GasPpb * 2.46e10;
  const noMoleculesCm3 = no2MoleculesCm3 * 0.15;

  // Estado estacionario de [IO] (ppt)
  // [IO] ≈ P(I•) / (k_loss_effective)
  const kLossIO = (solarRadiationWm2 / 1000.0) * 0.25 + kIO_NO * noMoleculesCm3 + kIO_NO2 * no2MoleculesCm3;
  const steadyStateIOCm3 = prodIAtomRateCm3S > 0 ? (prodIAtomRateCm3S / Math.max(1e-3, kLossIO)) : 1e6;
  const steadyStateIOPpt = steadyStateIOCm3 / 2.46e7; // 1 ppt ≈ 2.46e7 moléc/cm³

  // Átomos I• libres
  const steadyStateICm3 = (prodIAtomRateCm3S + kIO_NO * steadyStateIOCm3 * noMoleculesCm3) / Math.max(1.0, kI_O3 * o3MoleculesCm3);

  // 3. Nucleación de ácido yódico (HIO3) según Sipilä et al. (Science 2016):
  // J1 ≈ k_nuc * [HIO3]² donde [HIO3] ≈ k_ox * [IO]² * [H2O] / k_cond
  const hio3MoleculesCm3 = Math.max(1e4, (kIO_IO * Math.pow(steadyStateIOCm3, 2)) * 12.0);
  // Tasa de nucleación de nuevas partículas J1 [cm⁻³·s⁻¹]
  const nucleationRateJ1 = Math.min(250.0, 1.8e-8 * Math.pow(hio3MoleculesCm3 / 1e6, 2.1));

  // Masa generada en aerosol ultrafino PM0.1 [µg/m³]
  // Masa molecular HIO3 = 175.9 g/mol, asumiendo diámetro crítico ~ 2.5 nm
  const massPerNucleatedParticleUg = (4/3) * Math.PI * Math.pow(1.5e-7, 3) * 4.62 * 1e6; // densidad HIO3 ~ 4.62 g/cm³
  const marineUltrafinesUgm3 = (nucleationRateJ1 * 3600.0 * 2.0) * massPerNucleatedParticleUg * 1e6;

  // 4. Pérdida catalítica de ozono por ciclo halógeno [ppb/día]
  // Ciclo nulo I + O3 -> IO + O2; IO + IO -> 2 I + O2 (destruye 2 O3)
  const o3LossRateMolecCm3S = 2.0 * kIO_IO * Math.pow(steadyStateIOCm3, 2);
  const o3LossPpbDay = (o3LossRateMolecCm3S * 86400) / 2.46e10;

  // Tasa de formación de IONO2 (secuestro temporal de NOx y enriquecimiento de nitrato en aerosol)
  const iono2ProdRateMolecCm3S = kIO_NO2 * steadyStateIOCm3 * no2MoleculesCm3;
  const iono2ProdRatePptH = (iono2ProdRateMolecCm3S * 3600) / 2.46e7;

  const scientificInterpretation = `En la interfaz aire-mar de la Bahía de Málaga, la reacción de ${ozoneGasPpb.toFixed(1)} ppb de O3 con ${iodideConcentrationNm.toFixed(0)} nM de ioduro (I⁻) genera un flujo interfacial de ${(fluxHoi/1e9).toFixed(2)}×10⁹ moléc/(cm²·s) de HOI y ${(fluxI2/1e9).toFixed(2)}×10⁹ moléc/(cm²·s) de I2. Esto sostiene una concentración fotoestacionaria de ${steadyStateIOPpt.toFixed(2)} ppt de IO diurno en la línea de costa. La auto-reacción IO + IO nuclea ácido yódico (HIO3) a una tasa J₁ = ${nucleationRateJ1.toFixed(1)} cm⁻³·s⁻¹, generando aerosol ultrafino marino (PM0.1) y destruyendo ${o3LossPpbDay.toFixed(2)} ppb/día de ozono costero de fondo sin necesidad de radiación solar directa.`;

  return {
    hoiSurfaceFluxMolecCm2S: parseFloat(fluxHoi.toExponential(3)),
    i2SurfaceFluxMolecCm2S: parseFloat(fluxI2.toExponential(3)),
    totalIodineFluxGramsKm2Day: parseFloat(gramsPerKm2Day.toFixed(2)),
    steadyStateIOPpt: parseFloat(steadyStateIOPpt.toFixed(3)),
    steadyStateIAtomCm3: parseFloat(steadyStateICm3.toFixed(1)),
    hio3GasConcentrationCm3: parseFloat(hio3MoleculesCm3.toFixed(0)),
    nucleationRateJ1Cm3S: parseFloat(nucleationRateJ1.toFixed(2)),
    marineUltrafineParticleYieldUgm3: parseFloat(marineUltrafinesUgm3.toFixed(3)),
    catalyticOzoneLossPpbDay: parseFloat(o3LossPpbDay.toFixed(2)),
    iono2FormationRatePptHour: parseFloat(iono2ProdRatePptH.toFixed(2)),
    malagaBayHotspots: MALAGA_BAY_IODINE_HOTSPOTS,
    scientificInterpretation
  };
}
