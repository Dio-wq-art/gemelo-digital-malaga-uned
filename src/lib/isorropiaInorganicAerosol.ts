/**
 * Modelo Termodinámico de Aerosoles Inorgánicos Secundarios (SIA): ISORROPIA-II.
 * Sistema NH4+ - SO4(2-) - NO3- - Cl- - Na+ - H2O.
 * Partición Gas-Partícula determinista según Seinfeld & Pandis (2016), Fountoukis & Nenes (2007) y Mozurkewich (1993).
 * Tesis Doctoral: Gemelo Digital de Málaga.
 */

export interface InorganicAerosolInput {
  tempCelsius: number;
  relativeHumidityPct: number; // 0 - 100%
  totalAmmoniaUgm3: number; // T_NH3 = NH3(g) + NH4+(p) [µg/m³]
  totalNitrateUgm3: number; // T_HNO3 = HNO3(g) + NO3-(p) [µg/m³]
  totalSulfateUgm3: number; // Total Sulfate SO4(2-) [µg/m³] (no volátil)
  totalSodiumUgm3?: number; // Na+ del aerosol marino de la bahía [µg/m³]
  totalChlorideUgm3?: number; // Cl- del aerosol marino de la bahía [µg/m³]
}

export type ThermodynamicRegime = 
  | 'sulfate_poor_nh3_rich'    // Exceso de NH3: Formación máxima de NH4NO3 en PM2.5
  | 'sulfate_neutralized'      // Relación R ≈ 2: (NH4)2SO4 formado, partición de nitrato sensible a T y RH
  | 'sulfate_rich_acidic'      // Déficit de NH3: Todo el amonio captado como NH4HSO4 / H2SO4, sin nitrato en aerosol
  | 'marine_aged_coastal';     // Sustitución de Cl- por NO3- en aerosol marino de la Bahía de Málaga

export type AerosolPhaseState = 'solid' | 'aqueous_metastable' | 'aqueous_deliquescent' | 'dry_effloresced';

export interface IsorropiaEquilibriumResult {
  // Fase Gas (µg/m³ y ppb)
  gasNH3_ugm3: number;
  gasNH3_ppb: number;
  gasHNO3_ugm3: number;
  gasHNO3_ppb: number;
  gasHCl_ugm3: number;

  // Fase Aerosol (µg/m³ en PM2.5)
  aerosolNH4_ugm3: number;
  aerosolNO3_ugm3: number;
  aerosolSO4_ugm3: number;
  aerosolNa_ugm3: number;
  aerosolCl_ugm3: number;
  totalSiaPM25_ugm3: number; // NH4 + NO3 + SO4

  // Agua del Aerosol y Acidez
  alwc_ugm3: number; // Aerosol Liquid Water Content [µg/m³]
  aerosolPH: number; // pH = -log10(a_H+)
  ionicStrengthMolKg: number; // Fuerza iónica I [mol/kg solvente]

  // Termodinámica de Partición
  kp_nh4no3_ppb2: number; // Constante de producto de solubilidad/volatilidad Kp(T) [ppb²]
  dissociationProduct_ppb2: number; // [NH3(g)] · [HNO3(g)] actual [ppb²]
  saturationRatioS: number; // S = P_NH3·P_HNO3 / Kp
  nitratePartitioningEpsilon: number; // ε(NO3-) = NO3-(p) / T_HNO3 (0 a 1)
  ammoniaPartitioningEpsilon: number; // ε(NH4+) = NH4+(p) / T_NH3 (0 a 1)

  // Delicuescencia y Estado de Fase
  drhPct: number; // Humedad Relativa de Delicuescencia del sistema mixto a T actual
  erhPct: number; // Humedad Relativa de Eflorescencia (~0.35 · DRH)
  phaseState: AerosolPhaseState;
  regime: ThermodynamicRegime;
  regimeDescription: string;
  limitingPrecursor: 'NH3_limited' | 'HNO3_limited' | 'SO4_acidic' | 'balanced';
  mitigationRecommendation: string;
}

export interface SiaHotspotBenchmark {
  id: string;
  name: string;
  district: string;
  lat: number;
  lon: number;
  typicalT_NH3: number;
  typicalT_HNO3: number;
  typicalT_SO4: number;
  typicalNa: number;
  typicalCl: number;
  urbanContext: string;
}

export const MALAGA_SIA_HOTSPOTS: SiaHotspotBenchmark[] = [
  {
    id: 'sia_guadalhorce',
    name: 'Polígono Guadalhorce / Depuradora',
    district: 'Churriana / Carretera de Cádiz',
    lat: 36.6870,
    lon: -4.4680,
    typicalT_NH3: 8.5, // Alto NH3 de EDAR y actividades agroindustriales
    typicalT_HNO3: 12.0,
    typicalT_SO4: 4.8,
    typicalNa: 1.8,
    typicalCl: 2.5,
    urbanContext: 'Punto caliente de NH3 biogénico/industrial. Alto potencial de formación de NH4NO3.'
  },
  {
    id: 'sia_puerto',
    name: 'Terminal de Cruceros y Muelle Levante',
    district: 'Centro / Puerto',
    lat: 36.7115,
    lon: -4.4120,
    typicalT_NH3: 2.2,
    typicalT_HNO3: 18.5, // Alto NOx/HNO3 de pluma de buques
    typicalT_SO4: 7.2,  // Alto SO4 de combustión marítima HFO/MGO
    typicalNa: 4.2,
    typicalCl: 5.8,
    urbanContext: 'Régimen marino ácido. Alta concentración de sulfatos y sal marina envejecida.'
  },
  {
    id: 'sia_alameda',
    name: 'Alameda Principal / Calle Larios',
    district: 'Centro Histórico',
    lat: 36.7175,
    lon: -4.4215,
    typicalT_NH3: 3.8,
    typicalT_HNO3: 16.0, // Tráfico denso y fotólisis
    typicalT_SO4: 3.5,
    typicalNa: 1.5,
    typicalCl: 1.8,
    urbanContext: 'Cañón urbano con fuerte fotooxidación de NOx a HNO3 y partición modulada por la isla de calor.'
  },
  {
    id: 'sia_carranque',
    name: 'Estación de Calidad de Carranque',
    district: 'Cruz de Humilladero',
    lat: 36.7167,
    lon: -4.4444,
    typicalT_NH3: 4.5,
    typicalT_HNO3: 14.2,
    typicalT_SO4: 3.8,
    typicalNa: 1.2,
    typicalCl: 1.5,
    urbanContext: 'Estación urbana de fondo. Monitor de validación de partición de nitratos en PM2.5.'
  },
  {
    id: 'sia_atabal',
    name: 'El Atabal / Montes de Málaga',
    district: 'Puerto de la Torre',
    lat: 36.7320,
    lon: -4.4780,
    typicalT_NH3: 2.0,
    typicalT_HNO3: 6.5,
    typicalT_SO4: 2.2,
    typicalNa: 0.8,
    typicalCl: 0.9,
    urbanContext: 'Estación suburbana de fondo. Aire limpio con baja carga de aerosoles inorgánicos.'
  }
];

/**
 * Calcula la constante de equilibrio Kp(T) para el sistema NH4NO3(s/aq) <=> NH3(g) + HNO3(g)
 * Parametrización termodinámica de Mozurkewich (1993) / Seinfeld & Pandis (Eq. 10.92).
 * Retorna Kp en ppb² (a 1 atm).
 */
export function calculateMozurkewichKp(tempCelsius: number): number {
  const T = tempCelsius + 273.15; // Kelvin
  const T0 = 298.15; // 25 °C

  // ln(Kp) = 118.87 - 24084 / T - 6.025 · ln(T)
  // Forma refinada en función de T0:
  const lnKpAtm2 = 118.87 - (24084 / T) - 6.025 * Math.log(T);
  const kpAtm2 = Math.exp(Math.max(-40, Math.min(20, lnKpAtm2)));

  // Conversión de atm² a ppb²: 1 atm = 1e9 ppb -> atm² = 1e18 ppb²
  const kpPpb2 = kpAtm2 * 1e18;
  return kpPpb2;
}

/**
 * Humedad Relativa de Delicuescencia (DRH) en función de la temperatura (Wexler & Seinfeld, 1991).
 */
export function calculateDeliquescenceRH(tempCelsius: number): { drhNH4NO3: number; drhNH42SO4: number; drhEutectic: number } {
  const T = tempCelsius + 273.15;
  const T0 = 298.15;

  // DRH_NH4NO3(298K) = 61.8%
  const drhNH4NO3 = 61.8 * Math.exp(852 * (1 / T - 1 / T0));
  // DRH_(NH4)2SO4(298K) = 79.9%
  const drhNH42SO4 = 79.9 * Math.exp(80 * (1 / T - 1 / T0));
  // Punto eutéctico mixto de delicuescencia mutua (MDRH)
  const drhEutectic = Math.min(drhNH4NO3, drhNH42SO4) * 0.88;

  return {
    drhNH4NO3: Math.max(45, Math.min(85, drhNH4NO3)),
    drhNH42SO4: Math.max(65, Math.min(92, drhNH42SO4)),
    drhEutectic: Math.max(40, Math.min(75, drhEutectic))
  };
}

/**
 * Resuelve el equilibrio termodinámico ISORROPIA-II para el sistema inorgánico.
 */
export function solveIsorropiaEquilibrium(input: InorganicAerosolInput): IsorropiaEquilibriumResult {
  const {
    tempCelsius,
    relativeHumidityPct,
    totalAmmoniaUgm3,
    totalNitrateUgm3,
    totalSulfateUgm3,
    totalSodiumUgm3 = 1.2,
    totalChlorideUgm3 = 1.5
  } = input;

  const T_K = tempCelsius + 273.15;
  const RH = Math.max(5, Math.min(99, relativeHumidityPct));

  // Pesos Moleculares (g/mol)
  const MW_NH3 = 17.03;
  const MW_NH4 = 18.04;
  const MW_HNO3 = 63.01;
  const MW_NO3 = 62.00;
  const MW_SO4 = 96.06;
  const MW_H2SO4 = 98.08;
  const MW_NH4NO3 = 80.04;
  const MW_Na = 22.99;
  const MW_Cl = 35.45;

  // Factores de conversión µg/m³ -> ppb a T y 1 atm:
  // C(ppb) = C(µg/m³) · (R_gas · T / P) / MW · 1000 = C(µg/m³) · (8.314 · T / 101325) / MW · 1e6
  const volMolar_L_mol = (0.082057 * T_K); // ~24.45 L/mol a 298K
  const ugm3_to_ppb_NH3 = volMolar_L_mol / MW_NH3;
  const ugm3_to_ppb_HNO3 = volMolar_L_mol / MW_HNO3;

  // 1. Concentraciones molares totales (µmol/m³)
  const mol_NH3_tot = totalAmmoniaUgm3 / MW_NH3;
  const mol_HNO3_tot = totalNitrateUgm3 / MW_HNO3;
  const mol_SO4_tot = totalSulfateUgm3 / MW_SO4;
  const mol_Na_tot = totalSodiumUgm3 / MW_Na;
  const mol_Cl_tot = totalChlorideUgm3 / MW_Cl;

  // 2. Cálculo de Delicuescencia
  const { drhNH4NO3, drhEutectic } = calculateDeliquescenceRH(tempCelsius);
  const erhPct = drhNH4NO3 * 0.35;

  let phaseState: AerosolPhaseState = 'aqueous_deliquescent';
  if (RH < erhPct) {
    phaseState = 'dry_effloresced';
  } else if (RH < drhNH4NO3) {
    phaseState = 'aqueous_metastable';
  } else {
    phaseState = 'aqueous_deliquescent';
  }

  // 3. Relación de neutralización del sulfato por amonio y sodio
  // Capacidad de cationes para neutralizar sulfato:
  // (Na+ + NH4+) / (2 * SO4(2-))
  const catAvailableForSO4 = mol_NH3_tot + mol_Na_tot;
  const sulfateDemand = 2 * mol_SO4_tot;

  let regime: ThermodynamicRegime;
  let regimeDescription = '';
  let limitingPrecursor: 'NH3_limited' | 'HNO3_limited' | 'SO4_acidic' | 'balanced' = 'balanced';
  let mitigationRecommendation = '';

  let mol_SO4_aer = mol_SO4_tot; // Todo el sulfato permanece en fase aerosol (no volátil)
  let mol_Na_aer = mol_Na_tot;
  let mol_NH4_aer = 0;
  let mol_NO3_aer = 0;
  let mol_Cl_aer = 0;
  let mol_NH3_gas = 0;
  let mol_HNO3_gas = 0;

  // Constante de equilibrio Kp
  const kpPpb2 = calculateMozurkewichKp(tempCelsius);

  if (catAvailableForSO4 < mol_SO4_tot) {
    // Régimen muy ácido (Sulfate-rich / H2SO4 + NH4HSO4)
    regime = 'sulfate_rich_acidic';
    regimeDescription = 'Régimen hiperácido. Todo el amoníaco es consumido por sulfatos libres. Formación nula de nitrato amónico.';
    limitingPrecursor = 'SO4_acidic';
    mitigationRecommendation = 'Control urgente de SO2 portuario/industrial para neutralizar la acidez de la microcapa.';

    mol_NH4_aer = mol_NH3_tot;
    mol_NH3_gas = 0;
    mol_NO3_aer = 0; // No hay amonio libre para fijar nitrato
    mol_HNO3_gas = mol_HNO3_tot;
    mol_Cl_aer = 0;
  } else if (catAvailableForSO4 < sulfateDemand) {
    // Régimen intermedio: mezcla de NH4HSO4 y (NH4)2SO4
    regime = 'sulfate_rich_acidic';
    regimeDescription = 'Régimen ácido intermedio. Sulfatos no totalmente neutralizados. Formación de nitrato amónico fuertemente inhibida.';
    limitingPrecursor = 'NH3_limited';
    mitigationRecommendation = 'La reducción de emisiones de NOx tiene poco impacto en PM2.5 inorgánico; el sistema está limitado por NH3.';

    mol_NH4_aer = mol_NH3_tot;
    mol_NH3_gas = 0;
    mol_NO3_aer = 0;
    mol_HNO3_gas = mol_HNO3_tot;
    mol_Cl_aer = Math.max(0, mol_Cl_tot * 0.15);
  } else {
    // Régimen neutralizado / exceso de amonio
    // Amonio residual libre tras neutralizar sulfato:
    const mol_NH3_free = Math.max(0, mol_NH3_tot - Math.max(0, sulfateDemand - mol_Na_tot));

    if (mol_NH3_free <= 0) {
      regime = 'sulfate_neutralized';
      regimeDescription = 'Régimen balanceado estequiométrico. Sulfato exactamente neutralizado.';
      mol_NH4_aer = mol_NH3_tot;
      mol_NH3_gas = 0;
      mol_NO3_aer = 0;
      mol_HNO3_gas = mol_HNO3_tot;
    } else {
      // Amonio y Nitrato compiten por formar NH4NO3 según Kp(T, RH)
      // Reacción: NH3(g) + HNO3(g) <=> NH4NO3(s/aq)
      // En el equilibrio: P_NH3 * P_HNO3 = Kp
      // Si P_NH3_tot * P_HNO3_tot <= Kp -> Todo permanece en fase gas
      const maxP_NH3_ppb = mol_NH3_free * MW_NH3 * ugm3_to_ppb_NH3;
      const maxP_HNO3_ppb = mol_HNO3_tot * MW_HNO3 * ugm3_to_ppb_HNO3;
      const initialProduct = maxP_NH3_ppb * maxP_HNO3_ppb;

      if (initialProduct <= kpPpb2 || phaseState === 'dry_effloresced') {
        // No se supera el producto de solubilidad o ambiente excesivamente seco
        mol_NH4_aer = mol_NH3_tot - mol_NH3_free;
        mol_NH3_gas = mol_NH3_free;
        mol_NO3_aer = 0;
        mol_HNO3_gas = mol_HNO3_tot;
        regime = 'sulfate_neutralized';
        regimeDescription = 'Temperatura elevada o baja humedad: Kp supera el producto de presiones. El nitrato amónico se disocia a fase gas.';
        limitingPrecursor = maxP_NH3_ppb < maxP_HNO3_ppb ? 'NH3_limited' : 'HNO3_limited';
        mitigationRecommendation = 'El calor diurno mantiene el nitrato en fase gas; la condensación ocurrirá durante el enfriamiento nocturno.';
      } else {
        // Precipita / condensa NH4NO3 en aerosol
        // Sea x = moles de NH4NO3 formados (µmol/m³)
        // (mol_NH3_free - x) · (mol_HNO3_tot - x) · F_conv = Kp
        // F_conv = ugm3_to_ppb_NH3 * MW_NH3 * ugm3_to_ppb_HNO3 * MW_HNO3
        const convFactor = (MW_NH3 * ugm3_to_ppb_NH3) * (MW_HNO3 * ugm3_to_ppb_HNO3);
        const kp_mol2 = kpPpb2 / Math.max(1e-6, convFactor);

        const b_coeff = -(mol_NH3_free + mol_HNO3_tot);
        const c_coeff = (mol_NH3_free * mol_HNO3_tot) - kp_mol2;
        const discr = Math.max(0, b_coeff * b_coeff - 4 * c_coeff);
        const x_formed_mol = Math.max(0, Math.min(Math.min(mol_NH3_free, mol_HNO3_tot), (-b_coeff - Math.sqrt(discr)) / 2));

        mol_NO3_aer = x_formed_mol;
        mol_HNO3_gas = Math.max(0, mol_HNO3_tot - x_formed_mol);
        mol_NH4_aer = (mol_NH3_tot - mol_NH3_free) + x_formed_mol;
        mol_NH3_gas = Math.max(0, mol_NH3_free - x_formed_mol);

        regime = mol_NH3_free > mol_HNO3_tot ? 'sulfate_poor_nh3_rich' : 'marine_aged_coastal';
        regimeDescription = `Formación activa de NH4NO3 en PM2.5 (${(mol_NO3_aer * MW_NO3).toFixed(1)} µg/m³ condensados). Acoplamiento con brisa marina y humedad.`;
        limitingPrecursor = mol_NH3_gas < mol_HNO3_gas ? 'NH3_limited' : 'HNO3_limited';
        mitigationRecommendation = limitingPrecursor === 'HNO3_limited'
          ? 'Régimen limitado por HNO3: La reducción de emisiones de tráfico (NOx en ZBE) reducirá directamente los niveles de PM2.5 inorgánico.'
          : 'Régimen limitado por NH3: Reducir emisiones agrícolas y de depuradoras amortigua el pico de aerosoles secundarios.';
      }
    }
  }

  // 4. Conversión final de unidades (µg/m³)
  const aerosolNH4_ugm3 = mol_NH4_aer * MW_NH4;
  const aerosolNO3_ugm3 = mol_NO3_aer * MW_NO3;
  const aerosolSO4_ugm3 = mol_SO4_aer * MW_SO4;
  const aerosolNa_ugm3 = mol_Na_aer * MW_Na;
  const aerosolCl_ugm3 = Math.max(0, mol_Cl_tot * 0.4) * MW_Cl;
  const totalSiaPM25_ugm3 = aerosolNH4_ugm3 + aerosolNO3_ugm3 + aerosolSO4_ugm3;

  const gasNH3_ugm3 = mol_NH3_gas * MW_NH3;
  const gasNH3_ppb = gasNH3_ugm3 * ugm3_to_ppb_NH3;
  const gasHNO3_ugm3 = mol_HNO3_gas * MW_HNO3;
  const gasHNO3_ppb = gasHNO3_ugm3 * ugm3_to_ppb_HNO3;
  const gasHCl_ugm3 = Math.max(0, totalChlorideUgm3 - aerosolCl_ugm3);

  // 5. Contenido de Agua Líquida (ALWC) según Zdanovskii-Stokes-Robinson (ZSR)
  // ALWC = sum( M_i / m_0i(RH) )
  const rhFrac = RH / 100;
  const waterActivityCoeff = Math.max(0.05, 1 - rhFrac);
  const alwc_ugm3 = phaseState === 'dry_effloresced' 
    ? 0.05 
    : Math.max(0.1, (aerosolSO4_ugm3 * 1.8 + aerosolNO3_ugm3 * 1.4 + aerosolNH4_ugm3 * 1.2 + aerosolNa_ugm3 * 2.5) * (rhFrac / waterActivityCoeff));

  // 6. pH del Aerosol (Esquema ISORROPIA-II simplificado)
  // [H+] en mol/L de agua del aerosol
  const alwc_L_per_m3 = alwc_ugm3 * 1e-9; // 1 µg/m³ agua = 1e-9 L/m³
  const freeH_mol_m3 = Math.max(1e-12, (2 * mol_SO4_aer - (mol_NH4_aer + mol_Na_aer)));
  const h_conc_mol_L = Math.min(10, freeH_mol_m3 / Math.max(1e-12, alwc_L_per_m3));
  const aerosolPH = Math.max(0.5, Math.min(7.8, -Math.log10(Math.max(1e-8, h_conc_mol_L))));

  // 7. Fuerza Iónica I
  const totalIons_mol_kg = (mol_NH4_aer + mol_NO3_aer + 4 * mol_SO4_aer + mol_Na_aer) / Math.max(1e-6, alwc_ugm3 * 1e-6);
  const ionicStrengthMolKg = Math.max(0.1, Math.min(60, totalIons_mol_kg * 0.5));

  // 8. Partición ε
  const nitratePartitioningEpsilon = totalNitrateUgm3 > 0 ? Math.max(0, Math.min(1, aerosolNO3_ugm3 / totalNitrateUgm3)) : 0;
  const ammoniaPartitioningEpsilon = totalAmmoniaUgm3 > 0 ? Math.max(0, Math.min(1, aerosolNH4_ugm3 / totalAmmoniaUgm3)) : 0;

  const dissociationProduct_ppb2 = gasNH3_ppb * gasHNO3_ppb;
  const saturationRatioS = kpPpb2 > 0 ? dissociationProduct_ppb2 / kpPpb2 : 0;

  return {
    gasNH3_ugm3,
    gasNH3_ppb,
    gasHNO3_ugm3,
    gasHNO3_ppb,
    gasHCl_ugm3,
    aerosolNH4_ugm3,
    aerosolNO3_ugm3,
    aerosolSO4_ugm3,
    aerosolNa_ugm3,
    aerosolCl_ugm3,
    totalSiaPM25_ugm3,
    alwc_ugm3,
    aerosolPH,
    ionicStrengthMolKg,
    kp_nh4no3_ppb2: kpPpb2,
    dissociationProduct_ppb2,
    saturationRatioS,
    nitratePartitioningEpsilon,
    ammoniaPartitioningEpsilon,
    drhPct: drhNH4NO3,
    erhPct,
    phaseState,
    regime,
    regimeDescription,
    limitingPrecursor,
    mitigationRecommendation
  };
}

/**
 * Exportador FAIR CSV de simulación termodinámica ISORROPIA-II.
 */
export function exportIsorropiaCsv(inputs: InorganicAerosolInput, result: IsorropiaEquilibriumResult): string {
  const headers = 'temp_c,rh_pct,tot_nh3_ugm3,tot_hno3_ugm3,tot_so4_ugm3,gas_nh3_ppb,gas_hno3_ppb,aer_nh4_ugm3,aer_no3_ugm3,aer_so4_ugm3,sia_pm25_ugm3,alwc_ugm3,aerosol_ph,kp_ppb2,eps_no3,eps_nh4,regime,phase_state\n';
  const row = `${inputs.tempCelsius},${inputs.relativeHumidityPct},${inputs.totalAmmoniaUgm3},${inputs.totalNitrateUgm3},${inputs.totalSulfateUgm3},${result.gasNH3_ppb.toFixed(2)},${result.gasHNO3_ppb.toFixed(2)},${result.aerosolNH4_ugm3.toFixed(2)},${result.aerosolNO3_ugm3.toFixed(2)},${result.aerosolSO4_ugm3.toFixed(2)},${result.totalSiaPM25_ugm3.toFixed(2)},${result.alwc_ugm3.toFixed(2)},${result.aerosolPH.toFixed(2)},${result.kp_nh4no3_ppb2.toFixed(1)},${result.nitratePartitioningEpsilon.toFixed(3)},${result.ammoniaPartitioningEpsilon.toFixed(3)},"${result.regime}","${result.phaseState}"`;
  return headers + row;
}
