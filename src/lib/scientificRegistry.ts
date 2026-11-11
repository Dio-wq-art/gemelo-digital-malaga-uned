/**
 * REGISTRO CENTRAL DE FENOMENOLOGÍA CIENTÍFICA Y TRAZABILIDAD NORMATIVA
 * Proyecto: Gemelo Digital de Calidad del Aire a Microescala de Málaga (Tesis Doctoral).
 * 
 * Este archivo implementa el contrato universal y el registro extensible para que
 * cualquier módulo actual y toda futura incorporación cuente obligatoriamente con:
 *  1. Trazabilidad teórica (Ecuaciones físico-químicas formales).
 *  2. Trazabilidad normativa (Directiva 2008/50/CE, Guías OMS 2021, EMEP/EEA, OACI, etc.).
 *  3. Representación visual animada mediante diagramas científicos coloridos.
 */

export type ScientificDiagramType =
  | 'leighton'
  | 'canyon_vortex'
  | 'wesely'
  | 'monin_obukhov'
  | 'copert_speed'
  | 'aerosol_modes'
  | 'sea_breeze'
  | 'aircraft_lto'
  | 'isoprene_emission'
  | 'pinn_physics_loss'
  | 'coastal_halogen'
  | 'copert_marine_scavenging'
  | 'acute_episodes'
  | 'gum_uncertainty'
  | 'aod_extinction'
  | 'wind_advection'
  | 'isopleth_diffusion'
  | 'brunt_vaisala'
  | 'gpu_instancing'
  | 'fairmode_network'
  | 'osm_canopy_lod1'
  | 'temporal_7d_history';

export interface RegulatoryStandard {
  authority: 'UE' | 'OMS' | 'EMEP/EEA' | 'OACI' | 'AEMET' | 'FAIRMODE';
  document: string;
  limitValue?: string;
  averagingPeriod?: '1h' | '8h' | '24h' | 'Anual';
  objective: string;
}

export interface ScientificTopic {
  id: string;
  title: string;
  discipline: 'Química Atmosférica' | 'Micrometeorología' | 'Dinámica de Fluidos' | 'Emisiones de Tráfico' | 'Física de Aerosoles' | 'Asimilación de Datos';
  formulaLaTeX: string;
  formulaDescription: string;
  physicsLaw: string;
  explanation: string;
  units?: string;
  typicalRange?: string;
  regulatoryStandard?: RegulatoryStandard;
  literatureCitation: string;
  diagramType?: ScientificDiagramType;
  futureExpansionNotes?: string;
}

/**
 * Registro exhaustivo de tópicos científicos del Gemelo Digital.
 */
export const SCIENTIFIC_REGISTRY: Record<string, ScientificTopic> = {
  // 1. FOTOQUÍMICA & FOTO-ESTACIONARIEDAD
  leighton_photostationary: {
    id: 'leighton_photostationary',
    title: 'Ciclo Fotoestacionario de Leighton',
    discipline: 'Química Atmosférica',
    formulaLaTeX: '[O_3] = \\frac{J_{NO_2} [NO_2]}{k_1 [NO]}',
    formulaDescription: 'Equilibrio fotodinámico entre la fotólisis de NO2 solar y la titulación de O3 con NO.',
    physicsLaw: 'Estado Fotoestacionario de Leighton (Leighton, 1961)',
    explanation: 'La fotólisis del dióxido de nitrógeno por radiación actínica ultravioleta (λ < 420 nm) genera radicales de oxígeno atómico que se combinan con O2 formando O3. Simultáneamente, el NO emitido por el tráfico reacciona rápidamente con O3 regenerando NO2. Desviaciones de esta relación (ratio Leighton φ > 1) revelan la oxidación mediada por radicales peroxilo (RO2/HO2) procedentes de COVs.',
    units: 'adimensional (ratio φ)',
    typicalRange: '0.85 – 1.45',
    regulatoryStandard: {
      authority: 'UE',
      document: 'Directiva 2008/50/CE',
      limitValue: '120 µg/m³ (máxima diaria de las medias móviles octohorarias)',
      averagingPeriod: '8h',
      objective: 'Prevención de episodios fotoquímicos y protección vegetal'
    },
    literatureCitation: 'Leighton, P. A. (1961). Photochemistry of Air Pollution. Academic Press, NY.',
    diagramType: 'leighton'
  },

  // 2. DINÁMICA DE CAÑONES URBANOS
  canyon_vortex_recirculation: {
    id: 'canyon_vortex_recirculation',
    title: 'Vórtice de Recirculación en Cañón Urbano (Régimen Skimming)',
    discipline: 'Dinámica de Fluidos',
    formulaLaTeX: '\\frac{H}{W} \\ge 0.65 \\implies \\text{Skimming Flow} \\quad (\\omega = \\nabla \\times \\mathbf{u})',
    formulaDescription: 'Régimen de flujo rasante con formación de vórtice helicoidal estacionario en cañones de relación aspecto H/W > 0.65.',
    physicsLaw: 'Criterio Morfológico de Flujo Urbano de Oke (Oke, 1988)',
    explanation: 'Cuando el viento sinóptico incide perpendicular a una calle estrecha flanqueada por edificios altos (H/W > 0.65, como Marqués de Larios o Juan XXIII), el flujo principal sobrevuela el tejado e induce un vórtice cerrado de recirculación en la cavidad. Esto provoca que los contaminantes del tráfico asciendan por la fachada de sotavento (leeward) alcanzando concentraciones 3 a 4 veces superiores a las de la fachada de barlovento (windward).',
    units: 'm/s (velocidad de fricción u*)',
    typicalRange: 'H/W = 0.5 – 3.2',
    regulatoryStandard: {
      authority: 'FAIRMODE',
      document: 'FAIRMODE WG1 Guidance on Urban Microscale Dispersion (2020)',
      limitValue: 'Incertidumbre relativa espacial < 30%',
      objective: 'Modelización de alta resolución en receptores a nivel peatonal'
    },
    literatureCitation: 'Oke, T. R. (1988). Street design and urban canopy layer climate. Energy and Buildings, 11(1-3), 103-113.',
    diagramType: 'canyon_vortex'
  },

  // 3. DEPOSICIÓN SECA Y RESISTENCIAS ESTOMÁTICAS
  wesely_dry_deposition: {
    id: 'wesely_dry_deposition',
    title: 'Modelo Eléctrico Multirresistencia de Deposición Seca',
    discipline: 'Micrometeorología',
    formulaLaTeX: 'v_d = \\frac{1}{r_a + r_b + r_c} = -\\frac{F}{C(z)}',
    formulaDescription: 'Velocidad de deposición seca calculada mediante la analogía de resistencias en serie y paralelo.',
    physicsLaw: 'Esquema de Resistencia de Deposición de Wesely (Wesely, 1989)',
    explanation: 'El sumidero de contaminantes por contacto con la superficie urbana y vegetal está gobernado por tres resistencias en serie: la resistencia aerodinámica superficial (ra), la resistencia cuasi-laminar subyacente (rb) y la resistencia intrínseca de la canopia (rc). rc a su vez desglosa la conductancia estomática (regulada por la radiación solar y el déficit de presión de vapor), cuticular y edáfica.',
    units: 'cm/s',
    typicalRange: '0.05 – 1.80 cm/s',
    regulatoryStandard: {
      authority: 'EMEP/EEA',
      document: 'EMEP/MSC-W Model Formulation on Air-Surface Fluxes (2023)',
      objective: 'Cuantificación de cargas críticas de eutrofización y acidificación'
    },
    literatureCitation: 'Wesely, M. L. (1989). Parameterization of surface resistances to gaseous dry deposition. Atmos. Environ., 23(6), 1293-1304.',
    diagramType: 'wesely'
  },

  // 4. MICROMETEOROLOGÍA Y ESTABILIDAD ATMOSFÉRICA
  monin_obukhov_stability: {
    id: 'monin_obukhov_stability',
    title: 'Parámetro de Estabilidad de Monin-Obukhov',
    discipline: 'Micrometeorología',
    formulaLaTeX: '\\zeta = \\frac{z}{L} = -\\frac{z \\, \\kappa \\, g \\, (\\overline{w\' \\theta\'}_0)}{T_0 \\, u_*^3}',
    formulaDescription: 'Cociente adimensional que compara la producción térmica de turbulencia con la producción por cizalladura mecánica.',
    physicsLaw: 'Teoría de Semejanza de Monin-Obukhov (MOST, 1954)',
    explanation: 'La estabilidad de la capa límite superficial determina la capacidad dispersiva de la atmósfera. En condiciones convectivas diurnas (ζ < 0), la flotabilidad térmica favorece la mezcla vertical y diluye los contaminantes. En condiciones nocturnas estables (ζ > 0), la inversión térmica reprime la turbulencia, atrapando los contaminantes a ras de suelo.',
    units: 'adimensional (ζ) / metros (L)',
    typicalRange: '-5.0 (muy convectivo) a +2.0 (muy estable)',
    regulatoryStandard: {
      authority: 'AEMET',
      document: 'Manual de Observación y Modelización de Capa Límite Atmosférica',
      objective: 'Cálculo de altura de mezcla diagnóstica (PBLH)'
    },
    literatureCitation: 'Monin, A. S., & Obukhov, A. M. (1954). Basic laws of turbulent mixing in the ground layer of the atmosphere. Tr. Akad. Nauk SSSR Geofiz. Inst, 24(151), 163-187.',
    diagramType: 'monin_obukhov'
  },

  // 5. EMISIONES DE TRÁFICO COPERT 5
  copert_speed_emissions: {
    id: 'copert_speed_emissions',
    title: 'Curva Polinómica de Emisiones Vehiculares COPERT 5',
    discipline: 'Emisiones de Tráfico',
    formulaLaTeX: 'EF(V) = \\frac{\\alpha + \\gamma V + \\epsilon V^2}{1 + \\beta V + \\delta V^2} \\cdot CF_{Euro}',
    formulaDescription: 'Factor de emisión en caliente dependiente de la velocidad media de circulación V.',
    physicsLaw: 'Metodología Europea de Emisiones de Tráfico EMEP/EEA - COPERT 5',
    explanation: 'El factor de emisión vehicular (g/km) exhibe una curva en "U" característica: a bajas velocidades (< 20 km/h) en atascos y arranques frecuentes, la combustión ineficiente y la baja relación de transmisión multiplican las emisiones de NOx, CO y Black Carbon. Entre 50 y 70 km/h se alcanza la eficiencia termodinámica óptima, mientras que a > 100 km/h la resistencia aerodinámica eleva nuevamente el consumo y las emisiones.',
    units: 'g/km / vehículo',
    typicalRange: '0.12 – 1.85 g NOx/km',
    regulatoryStandard: {
      authority: 'EMEP/EEA',
      document: 'EMEP/EEA Air Pollutant Emission Inventory Guidebook 2023 (1.A.3.b Road Transport)',
      objective: 'Inventario oficial de emisiones móviles y calibración ZBE'
    },
    literatureCitation: 'Ntziachristos, L. et al. (2020). COPERT: A European road transport emission inventory model. Environmental Modelling & Software.',
    diagramType: 'copert_speed'
  },

  // 6. MICROFÍSICA DE AEROSOLES Y MODOS LOG-NORMALES
  aerosol_multimodal_distribution: {
    id: 'aerosol_multimodal_distribution',
    title: 'Distribución Multimodal de Tamaños de Aerosol (Whitby)',
    discipline: 'Física de Aerosoles',
    formulaLaTeX: '\\frac{dN}{d \\ln D_p} = \\sum_{i=1}^3 \\frac{N_i}{\\sqrt{2\\pi} \\ln \\sigma_{g,i}} \\exp \\left( -\\frac{(\\ln D_p - \\ln D_{pg,i})^2}{2 \\ln^2 \\sigma_{g,i}} \\right)',
    formulaDescription: 'Superposición de modos log-normales de nucleación, acumulación y partículas gruesas.',
    physicsLaw: 'Teoría Cinética y Coagulación de Aerosoles (Whitby, 1978; Seinfeld & Pandis)',
    explanation: 'Las partículas atmosféricas se organizan en 3 modos dinámicos fundamentales: 1) Modo de Nucleación (Dp < 20 nm), generado por nucleación homogénea de gases precursores (SO2, NH3, VOCs); 2) Modo de Acumulación (0.1 - 2.5 µm), producto de la condensación y coagulación browniana, con máxima persistencia y toxicidad alveolar; 3) Modo Grueso (Dp > 2.5 µm), dominado por polvo sahariano, spray marino y resuspensión mecánica.',
    units: 'partículas/cm³ / µg/m³',
    typicalRange: 'Dp = 1 nm – 10 µm',
    regulatoryStandard: {
      authority: 'OMS',
      document: 'WHO Global Air Quality Guidelines (2021)',
      limitValue: 'PM2.5: 5 µg/m³ (anual), 15 µg/m³ (24h) • PM10: 15 µg/m³ (anual), 45 µg/m³ (24h)',
      objective: 'Prevención de cardiopatías isquémicas y mortalidad respiratoria'
    },
    literatureCitation: 'Seinfeld, J. H., & Pandis, S. N. (2016). Atmospheric Chemistry and Physics: From Air Pollution to Climate Change. John Wiley & Sons.',
    diagramType: 'aerosol_modes'
  },

  // 7. BRISA MARINA Y CIRCULACIÓN COSTERA DE MÁLAGA
  coastal_sea_breeze_circulation: {
    id: 'coastal_sea_breeze_circulation',
    title: 'Celda de Circulación Térmica de Brisa Marina en la Bahía',
    discipline: 'Micrometeorología',
    formulaLaTeX: 'U_{brisa} \\propto \\sqrt{\\frac{g \\, \\Delta T \\, H_{PBL}}{\\theta_0}} \\quad (\\text{Dirección: } 150^\\circ - 180^\\circ \\text{ SE})',
    formulaDescription: 'Velocidad de advección inducida por el gradiente baroclínico de temperatura entre el mar de Alborán y la superficie urbana.',
    physicsLaw: 'Ecuación de Circulación de Bjerknes / Frente de Brisa Costera',
    explanation: 'Durante las horas centrales del día, el rápido calentamiento del suelo malagueño crea una baja térmica local que aspira aire húmedo y fresco del mar de Alborán (viento SE). Este frente de brisa advecta los contaminantes del puerto y la bahía hacia el interior (Valle del Guadalhorce), generando recirculación atmosférica cuando colisiona con las cordilleras prelitorales (Montes de Málaga).',
    units: 'm/s / grados azimut',
    typicalRange: '3.0 – 6.5 m/s (165° SE)',
    regulatoryStandard: {
      authority: 'AEMET',
      document: 'Climatología de la Costa del Sol y Modelización Mesoescalar HARMONIE',
      objective: 'Predicción de estancamiento fotoquímico estival'
    },
    literatureCitation: 'Simpson, J. E. (1994). Sea Breeze and Local Winds. Cambridge University Press.',
    diagramType: 'sea_breeze'
  },

  // 8. CICLO LTO DE AVIACIÓN COMERCIAL (AEROPUERTO AGP)
  aircraft_lto_kinetics: {
    id: 'aircraft_lto_kinetics',
    title: 'Cinética de Emisiones del Ciclo LTO en Turbofans',
    discipline: 'Emisiones de Tráfico',
    formulaLaTeX: 'E_{pollutant} = \\sum_{phase} t_{phase} \\cdot \\dot{m}_{fuel, phase} \\cdot EI_{pollutant, phase}',
    formulaDescription: 'Masa emitida por ciclo de aterrizaje y despegue (LTO) según OACI Anexo 16.',
    physicsLaw: 'Protocolo de Emisiones de Motores de Aviación OACI / EMEP Tier 3',
    explanation: 'El ciclo LTO abarca las fases operativas por debajo de 3000 ft (914 m): Aproximación (30% empuje), Rodaje (7% empuje), Despegue (100% empuje) y Ascenso inicial (85% empuje). La tasa de formación térmica de NOx por el mecanismo de Zeldovich alcanza su máximo en el despegue (EI > 30 g/kg), mientras que el rodaje y espera en rampa domina la emisión acumulada de CO, hidrocarburos y partículas ultrafinas.',
    units: 'kg / ciclo LTO / aeronave',
    typicalRange: '20 – 50 kg NOx por despegue de bimotor comercial',
    regulatoryStandard: {
      authority: 'OACI',
      document: 'ICAO Annex 16, Environmental Protection — Vol. II: Aircraft Engine Emissions',
      objective: 'Certificación de turbinas turbofan e inventario aeroportuario'
    },
    literatureCitation: 'ICAO (2021). Doc 9889 - Airport Air Quality Manual, 2nd Edition.',
    diagramType: 'aircraft_lto'
  },

  // 9. EMISIONES BIOGÉNICAS Y RENDIMIENTO SOA (MEGAN)
  bvoc_isoprene_monoterpenes: {
    id: 'bvoc_isoprene_monoterpenes',
    title: 'Cinética Biogénica de Isopreno y Formación de SOA',
    discipline: 'Química Atmosférica',
    formulaLaTeX: 'E_{isopreno} = \\epsilon_0 \\cdot C_L(PAR) \\cdot C_T(T_a) \\cdot LAI',
    formulaDescription: 'Tasa de emisión foliar de isopreno modulada por flujo fotónico fotosintético (PAR) y temperatura de hoja.',
    physicsLaw: 'Algoritmo Guenther MEGAN 2.1 (Guenther et al., 2012)',
    explanation: 'Las especies arbóreas urbanas (ej. Platanus hispanica, Ficus microcarpa en Málaga) emiten compuestos orgánicos volátiles biogénicos (BVOCs). El isopreno es estrictamente dependiente de la radiación solar y la temperatura enzimática. Su rápida oxidación con radicales OH genera aerosoles orgánicos secundarios (SOA) que incrementan los niveles de PM2.5 en parques urbanos.',
    units: 'µg / m² canopia / h',
    typicalRange: '10 – 3500 µg/m²/h',
    regulatoryStandard: {
      authority: 'UE',
      document: 'Directiva 2016/2284 (Techos Nacionales de Emisión - NEC)',
      objective: 'Modelización de precursores biogénicos de ozono troposférico'
    },
    literatureCitation: 'Guenther, A. B. et al. (2012). The Model of Emissions of Gases and Aerosols from Nature version 2.1 (MEGAN2.1). Geosci. Model Dev., 5, 1471-1492.',
    diagramType: 'isoprene_emission'
  },

  // 10. REDES NEURONALES INFORMADAS POR LA FÍSICA (PINN LOSS)
  pinn_physics_informed_loss: {
    id: 'pinn_physics_informed_loss',
    title: 'Función de Pérdida Híbrida en Redes PINN Navier-Stokes',
    discipline: 'Asimilación de Datos',
    formulaLaTeX: '\\mathcal{L}_{total} = \\lambda_{data} \\mathcal{L}_{MSE}(C_{pred}, C_{obs}) + \\lambda_{phys} \\| \\frac{\\partial C}{\\partial t} + \\mathbf{u} \\cdot \\nabla C - \\nabla \\cdot (K \\nabla C) - R(C) \\|^2',
    formulaDescription: 'Optimización conjunta que penaliza el error con las estaciones oficiales y el residuo de la ecuación de advección-difusión-reacción.',
    physicsLaw: 'Formulación PINN de Raissi, Perdikaris & Karniadakis (2019)',
    explanation: 'El Gemelo Digital no realiza inferencias de caja negra: la red neuronal informada por la física integra los operadores diferenciales de transporte atmosférico como regularizadores estrictos en el espacio de Hilbert. De este modo, las predicciones respetan la conservación de masa, el ciclo fotoquímico de Leighton y los perfiles de viento orográfico sin requerir suposiciones estocásticas.',
    units: 'adimensional (MSE normalizado)',
    typicalRange: 'Residuo físico < 10⁻⁴',
    regulatoryStandard: {
      authority: 'FAIRMODE',
      document: 'FAIRMODE Guidance on Model Quality Objectives (MQO / MQI)',
      limitValue: 'MQI ≤ 1.0 en todas las estaciones oficiales',
      objective: 'Garantía de rigor científico y fiabilidad metodológica de tesis doctoral'
    },
    literatureCitation: 'Raissi, M., Perdikaris, P., & Karniadakis, G. E. (2019). Physics-informed neural networks. Journal of Computational Physics, 378, 686-707.',
    diagramType: 'pinn_physics_loss'
  },
  // 11. HETEROGÉNEA NOCTURNA Y HALÓGENOS MARINOS (ClNO2)
  coastal_halogen_clno2: {
    id: 'coastal_halogen_clno2',
    title: 'Química Heterogénea Nocturna de ClNO2 y Halógenos Marinos',
    discipline: 'Química Atmosférica',
    formulaLaTeX: 'N_2O_5 + Cl^-_{(aq)} \\xrightarrow{\\gamma_{N2O5}} \\phi_{ClNO2} ClNO_2 + NO_3^- \\quad (h\\nu \\implies Cl^\\bullet + NO_2)',
    formulaDescription: 'Activación nocturna de aerosoles de sal marina en la Bahía de Málaga y fotólisis matutina liberando radicales de cloro super-reactivos.',
    physicsLaw: 'Mecanismo Heterogéneo de Thornton & Kercher (2007) / Finlayson-Pitts',
    explanation: 'Durante la noche, el N2O5 formado por reacción entre NO2 y NO3 se absorbe en el aerosol de cloruro sódico marino del mar de Alborán, generando nitrilo de cloro (ClNO2) con un rendimiento φ ≈ 0.85. Al amanecer, la rápida fotólisis del ClNO2 (λ < 400 nm) libera radicales Cl• que oxidan COVs 10 a 100 veces más rápido que el radical OH, acelerando los picos tempranos de ozono en Málaga.',
    units: 'pptv / s⁻¹',
    typicalRange: '200 – 1850 pptv ClNO2 al amanecer',
    regulatoryStandard: {
      authority: 'UE',
      document: 'Directiva 2008/50/CE (Evaluación de Precursores Secundarios de Ozono)',
      objective: 'Comprensión mecanística de picos tempranos de ozono en fachadas costeras'
    },
    literatureCitation: 'Thornton, J. A. et al. (2010). A large atomic chlorine source to the troposphere from N2O5 photolysis. Nature, 464, 271-274.',
    diagramType: 'coastal_halogen'
  },
  // 11b. RELACIÓN TRÁFICO COPERT 5 - DEPURACIÓN MARINA NO2
  no2_copert_marine_scavenging: {
    id: 'no2_copert_marine_scavenging',
    title: 'NO₂: Asimilación in situ, Emisión Vehicular COPERT 5 y Depuración por Aerosol Marino',
    discipline: 'Química Atmosférica',
    formulaLaTeX: 'C_{\\text{NO}_2}(1.8\\text{m}) = C_{\\text{fondo}} + \\frac{Q_{\\text{veh}} \\cdot E_{\\text{NO}_x} \\cdot f_{\\text{NO}_2}}{u_{\\text{cañón}} \\cdot W} - k_{\\text{marino}} [\\text{NaCl}] [\\text{N}_2\\text{O}_5]',
    formulaDescription: 'Ecuación de balance para NO2 acoplando el flujo de emisión vehicular COPERT 5 con el sumidero heterogéneo de aerosoles salinos de la Bahía de Málaga.',
    physicsLaw: 'Ecuación de Continuidad y Reacción Heterogénea en Aerosoles Marinos (EMEP/EEA & Thornton et al., 2010)',
    explanation: 'La concentración medida de NO₂ a 1.8m AGL combina la asimilación in situ de la red oficial con la densidad de tráfico local calculada mediante el modelo COPERT 5 (factores de emisión E_NOx y fracción primaria f_NO2 según la flota Euro y la relación aspecto H/W del cañón urbano). Este flujo vehicular es modulado por el sumidero heterogéneo de aerosoles marinos de la Bahía de Málaga: el N₂O₅ nocturno reacciona sobre las gotas de spray salino (NaCl) produciendo nitrilo de cloro (ClNO₂) y nitrato sódico (NaNO₃), actuando como un depurador costero (scavenging) que abate la concentración gaseosa de NO₂.',
    units: 'µg/m³',
    typicalRange: '5.0 – 85.0 µg/m³',
    regulatoryStandard: {
      authority: 'UE',
      document: 'Directiva 2008/50/CE (Límite anual: 40 µg/m³, Horario: 200 µg/m³) & Guías OMS 2021 (10 µg/m³ anual)',
      limitValue: '40 µg/m³ anual (UE) / 10 µg/m³ anual (OMS)',
      objective: 'Evaluación del balance neto entre fuentes móviles urbanas y sumideros marinos costeros'
    },
    literatureCitation: 'Guía EMEP/EEA 2023 (COPERT 5) & Thornton, J. A. et al. (2010) Nature, 464, 271-274.',
    diagramType: 'copert_marine_scavenging'
  },
  // 12. PROTOCOLO DE EPISODIOS AGUDOS Y ALERTAS TEMPRANAS
  acute_episode_protocol: {
    id: 'acute_episode_protocol',
    title: 'Protocolo de Episodios Agudos y Umbrales Regulatorios',
    discipline: 'Dinámica de Fluidos',
    formulaLaTeX: 'R_{epi} = \\max \\left( \\frac{[NO_2]}{200}, \\frac{[O_3]}{180}, \\frac{[PM_{10}]}{50} \\right) \\ge 1.0',
    formulaDescription: 'Relación adimensional entre la concentración horaria observada y los umbrales de información y alerta estipulados por el marco legal.',
    physicsLaw: 'Criterio Determinista de Superación (Real Decreto 102/2011 & Directiva 2008/50/CE)',
    explanation: 'El protocolo activa de manera automatizada y continua los tres escalones de contingencia municipal (Preaviso, Información/Aviso y Alerta Sanitaria) acoplando la velocidad advectiva del viento hacia receptores de alta vulnerabilidad (Hospital Regional Carlos Haya, Clínico Universitario, centros pediátricos y zonas escolares).',
    units: 'µg/m³',
    typicalRange: 'O3 > 180 µg/m³ | NO2 > 200 µg/m³ | PM10 > 50 µg/m³',
    regulatoryStandard: {
      authority: 'UE',
      document: 'Directiva 2008/50/CE Art. 24 / Real Decreto 102/2011 Anexo I',
      limitValue: 'NO2: 200 µg/m³ (1h) / O3: 180 µg/m³ (1h) / Alerta O3: 240 µg/m³',
      averagingPeriod: '1h',
      objective: 'Protección inmediata de la salud pública frente a picos agudos'
    },
    literatureCitation: 'MITECO (2021). Protocolo marco de actuación durante episodios de alta contaminación por NO2 y PM.',
    diagramType: 'acute_episodes'
  },
  // 13. PRESUPUESTO DE INCERTIDUMBRES GUM Y DOSIMETRÍA PEATONAL
  gum_uncertainty_budget: {
    id: 'gum_uncertainty_budget',
    title: 'Presupuesto de Incertidumbres GUM & Dosis Inhalada (1.5 m)',
    discipline: 'Asimilación de Datos',
    formulaLaTeX: 'u_c^2(C) = \\sum_{i=1}^N c_i^2 u^2(x_i), \\quad U_{95\\%} = 2.00 \\cdot u_c(C), \\quad \\dot{D} = C(1.5\\text{ m}) \\cdot V_E',
    formulaDescription: 'Propagación analítica de incertidumbres estándar (GUM / JCGM 100:2008) y tasa de dosis inhalada a nivel de respiración.',
    physicsLaw: 'Guía GUM (JCGM 100:2008) y Ley de Conservación de Masa Inhalada',
    explanation: 'En lugar de reportar concentraciones escalares deterministas aisladas, se calcula analíticamente la banda de dispersión expandida U95% integrando la incertidumbre instrumental (EN 14211), el inventario vehicular COPERT 5 y el gradiente micrometeorológico de capa límite. A nivel peatonal (z = 1.5 m), se calcula la dosis inhalada (µg/min) según el nivel de actividad ventilatoria de la OMS (reposo, caminata o ciclismo).',
    units: 'µg/m³ e µg/min',
    typicalRange: 'U95% / C < 30% (cumple DQO Directiva < 50%)',
    regulatoryStandard: {
      authority: 'UE',
      document: 'Directiva 2008/50/CE Anexo I (Objetivos de Calidad de Datos para Modelización)',
      limitValue: 'Incertidumbre relativa del modelo < 50% para NO2 y O3',
      objective: 'Rigor metrológico y certificación científica de tesis doctoral'
    },
    literatureCitation: 'JCGM 100:2008. Evaluation of measurement data — Guide to the expression of uncertainty in measurement (GUM).',
    diagramType: 'gum_uncertainty'
  },
  // 14. ESPESOR ÓPTICO DE AEROSOLES (AOD)
  aod_optical_depth: {
    id: 'aod_optical_depth',
    title: 'Espesor Óptico de Aerosoles en Columna (AOD a 550 nm)',
    discipline: 'Física de Aerosoles',
    formulaLaTeX: '\\tau(\\lambda) = \\int_0^\\infty \\beta_{ext}(\\lambda, z) \\, dz, \\quad I(\\lambda) = I_0(\\lambda) \\exp\\left(-\\frac{\\tau(\\lambda)}{\\mu}\\right)',
    formulaDescription: 'Atenuación exponencial de la radiancia solar por dispersión y absorción en la columna vertical atmosférica (Ley de Beer-Lambert-Bouguer).',
    physicsLaw: 'Ley de Beer-Lambert-Bouguer y Dispersión Mie / Rayleigh',
    explanation: 'El AOD a 550 nm (adimensional) integra la extinción óptica total provocada por partículas suspendidas (PM2.5, PM10, polen y polvo mineral sahariano). Un AOD > 0.40 señala intrusiones saharianas intensas o brumas fotoquímicas densas en la bahía de Málaga, alterando el flujo actínico solar y la fotólisis del NO2.',
    units: 'adimensional (τ₅₅₀)',
    typicalRange: '0.05 (aire puro marítimo) – 1.50 (evento sahariano severo)',
    regulatoryStandard: {
      authority: 'OMS',
      document: 'WHO Global Air Quality Guidelines (2021)',
      limitValue: 'PM2.5: 15 µg/m³ (24h) • PM10: 45 µg/m³ (24h)',
      objective: 'Detección temprana de intrusiones de material particulado y calima'
    },
    literatureCitation: 'Holben, B. N. et al. (1998). AERONET—A Federated Instrument Network and Data Archive for Aerosol Characterization. Remote Sensing of Environment, 66(1), 1-16.',
    diagramType: 'aod_extinction'
  },
  // 15. VECTOR DE ADVECCIÓN DE VIENTO
  wind_vector_advection: {
    id: 'wind_vector_advection',
    title: 'Transporte Advectivo Cinemático de Viento (u, v)',
    discipline: 'Dinámica de Fluidos',
    formulaLaTeX: '\\left(\\frac{\\partial C}{\\partial t}\\right)_{adv} = -\\mathbf{u} \\cdot \\nabla C = -\\left(u \\frac{\\partial C}{\\partial x} + v \\frac{\\partial C}{\\partial y}\\right)',
    formulaDescription: 'Término de advección convectiva pura en la ecuación de conservación de masa escalar de contaminantes.',
    physicsLaw: 'Ecuación de Transporte de Advección-Difusión de Navier-Stokes',
    explanation: 'El vector de viento descompuesto en componentes cartesianas u (oeste-este) y v (sur-norte) gobierna el transporte primario de las plumas de emisión desde los focos vehiculares e industriales hacia los receptores residenciales. En Málaga, la rotación diurna entre brisas de sureste (marinas) y terral de noroeste modula la dispersión o confinamiento del penacho.',
    units: 'm/s (módulo) / grados sexagesimales',
    typicalRange: '0.5 – 12.0 m/s',
    regulatoryStandard: {
      authority: 'FAIRMODE',
      document: 'FAIRMODE WG1 Guidance on Microscale Flow and Dispersion (2020)',
      limitValue: 'Error cuadrático medio de dirección < 20°',
      objective: 'Precisión cinemática en la trayectoria de penachos contaminantes'
    },
    literatureCitation: 'Stull, R. B. (1988). An Introduction to Boundary Layer Meteorology. Kluwer Academic Publishers.',
    diagramType: 'wind_advection'
  },
  // 16. ISOPLETAS D3 Y ECUACIÓN ADVECCIÓN-DIFUSIÓN
  d3_advection_diffusion_contour: {
    id: 'd3_advection_diffusion_contour',
    title: 'Campo Continuo 2D de Isopletas (Advección-Difusión)',
    discipline: 'Dinámica de Fluidos',
    formulaLaTeX: '\\frac{\\partial C}{\\partial t} + \\mathbf{u} \\cdot \\nabla C = \\nabla \\cdot (K \\nabla C) + R(C) - S(C)',
    formulaDescription: 'Ecuación diferencial parcial de transporte que balancea transporte advectivo, difusión turbulenta K, cinética química R y sumideros secos S.',
    physicsLaw: 'Ecuación Diferencial Parcial de Transporte Turbulento Atmosférico',
    explanation: 'Generación determinista de malla continua 2D de isopletas poligonales cerradas mediante el algoritmo Marching Squares (D3-Contour). Permite mapear los gradientes horizontales continuos de concentración en la trama viaria y residencial sin discontinuidades ni artefactos visuales espurios.',
    units: 'µg/m³ por intervalo de isopleta',
    typicalRange: '0 – 250 µg/m³',
    regulatoryStandard: {
      authority: 'UE',
      document: 'Directiva 2008/50/CE Art. 6 (Técnicas de Modelización y Mapeo Zonal)',
      limitValue: 'Delimitación continua de áreas de superación de valores límite',
      objective: 'Evaluación de la exposición poblacional en zonas urbanas'
    },
    literatureCitation: 'Arya, S. P. (1999). Air Pollution Meteorology and Dispersion. Oxford University Press.',
    diagramType: 'isopleth_diffusion'
  },
  // 17. OROGRAFÍA DEM & SOMBREADO TOPOGRÁFICO
  orographic_dem_hillshade: {
    id: 'orographic_dem_hillshade',
    title: 'Forzamiento Orográfico y Relieve DEM (Montes de Málaga)',
    discipline: 'Micrometeorología',
    formulaLaTeX: 'Fr = \\frac{U}{N \\cdot h_{monte}} < 1 \\implies \\text{Bloqueo / Estancamiento Orográfico}',
    formulaDescription: 'Número de Froude orográfico comparando la energía cinética del flujo incidente con la estratificación de Brunt-Väisälä.',
    physicsLaw: 'Teoría de Flujo Estratificado sobre Topografía (Baines, 1995)',
    explanation: 'La topografía abrupta que rodea Málaga (Montes de Málaga al norte y cordillera prelitoral) induce dos fenómenos clave: 1) Bloqueo y recirculación cuando Fr < 1, estancando las emisiones de tráfico en la cuenca urbana; 2) Efecto Föhn durante episodios de viento Terral (NO), provocando calentamiento adiabático severo (> 40 °C) y sequedad extrema.',
    units: 'adimensional (Fr) / metros (elevación DEM)',
    typicalRange: 'Fr = 0.2 – 2.5',
    regulatoryStandard: {
      authority: 'AEMET',
      document: 'Manual de Meteorología Sinóptica y Mesoescalar en Áreas Complejas',
      objective: 'Predicción de estancamiento barométrico y ondas orográficas'
    },
    literatureCitation: 'Baines, P. G. (1995). Topographic Effects in Stratified Flows. Cambridge University Press.',
    diagramType: 'brunt_vaisala'
  },
  // 18. MALLA DECK.GL EULERIANA INSTANCIADA EN GPU
  deckgl_gpu_instancing: {
    id: 'deckgl_gpu_instancing',
    title: 'Discretización Euleriana 3D Instanciada en GPU (Deck.GL)',
    discipline: 'Dinámica de Fluidos',
    formulaLaTeX: 'C(x, y, z) = \\sum_{k=1}^K w_k \\cdot \\mathcal{G}(x - x_k, y - y_k, z - z_k; \\sigma_x, \\sigma_y, \\sigma_z)',
    formulaDescription: 'Superposición discreta de celdas volumétricas eulerianas mapeadas directamente a buffers binarios Float32Array en GPU.',
    physicsLaw: 'Discretización de Volúmenes Finitos y Renderizado Instanciado WebGL',
    explanation: 'Arquitectura de alto rendimiento computacional que transfiere los tensores espaciales de calidad del aire directamente a la GPU del navegador mediante gl.drawElementsInstanced. Cada columna 3D representa la columna de aire microescalar con elevación y color acoplados a la concentración instantánea de contaminantes (NO₂, PM₂.₅, PM₁₀, O₃).',
    units: 'columnas discretas / µg/m³',
    typicalRange: 'Resolución: cuadrícula de 10 a 50 metros',
    regulatoryStandard: {
      authority: 'FAIRMODE',
      document: 'FAIRMODE WG1 Quality Assurance Protocol for Microscale Urban Modeling',
      objective: 'Visualización interactiva tridimensional a 60 FPS sin pérdida de precisión'
    },
    literatureCitation: 'Deck.gl Architecture Specifications (Vis.gl / OpenJS Foundation).',
    diagramType: 'gpu_instancing'
  },
  // 19. RED OFICIAL DE VIGILANCIA DE MÁLAGA (24 TERRESTRES + 16 SATÉLITES)
  official_monitoring_network: {
    id: 'official_monitoring_network',
    title: 'Red Multiescalar de Vigilancia Atmosférica (24 Estaciones Terrestres + 16 Misiones Satelitales)',
    discipline: 'Asimilación de Datos',
    formulaLaTeX: 'MQI = \\frac{\\sqrt{\\frac{1}{N}\\sum_{i=1}^N (O_i - M_i)^2}}{\\beta \\cdot U_{95\\%}(O_i)} \\le 1.0, \\quad \\mathbf{x}_a = \\mathbf{x}_b + \\mathbf{K}(\\mathbf{y}_{24+16} - \\mathcal{H}(\\mathbf{x}_b))',
    formulaDescription: 'Indicador de Calidad del Modelo FAIRMODE (MQI ≤ 1.0) y análisis variacional 4D-Var/EnKF sobre la red observacional 24+16.',
    physicsLaw: 'Protocolo de Validación Experimental FAIRMODE WG1 & Directivas (UE) 2024/2881 y 2008/50/CE',
    explanation: 'Asimilación continua en tiempo real de los 24 nodos terrestres verificados en Málaga ciudad (cabinas de referencia UNE-EN 14211:2013 / UNE-EN 14907:2006 de la Junta de Andalucía, AEMET y red microescalar CEN/TS 17660-1:2021) acoplados a las 16 misiones satelitales en órbita sobre la Bahía de Málaga (TROPOMI Sentinel-5P, Sentinel-4, OCO-2/3, ECOSTRESS, MODIS/VIIRS). Garantiza trazabilidad metrológica GUM y cumplimiento estricto de los Objetivos de Calidad de Datos (DQO).',
    units: 'µg/m³ (Criterio MQI ≤ 1.0)',
    typicalRange: 'MQI Málaga = 0.42 – 0.88 (Conformidad Grado A1)',
    regulatoryStandard: {
      authority: 'UE',
      document: 'Directiva (UE) 2024/2881 (Límite 2030 NO₂: 20 µg/m³ anual) & Directiva 2008/50/CE Anexo VI (40 µg/m³ anual)',
      limitValue: 'NO₂: 20 µg/m³ (2030 UE) / 40 µg/m³ (actual UE) / 10 µg/m³ (OMS 2021)',
      objective: 'Vigilancia reglamentaria continua y asimilación determinista sin datos estocásticos'
    },
    literatureCitation: 'Janssen, S. et al. (2022). FAIRMODE Guidance Document on Modelling Quality Objectives and Benchmarking (JRC Technical Report).',
    diagramType: 'fairmode_network'
  },
  // 20. TOPOLOGÍA URBANA LoD1 Y CAÑÓN DE CALLE
  urban_canopy_lod1: {
    id: 'urban_canopy_lod1',
    title: 'Topología Volumétrica 3D de Huellas Edificatorias (LoD1)',
    discipline: 'Dinámica de Fluidos',
    formulaLaTeX: 'z_0 \\approx 0.5 \\cdot h_{bldg} \\cdot \\frac{A_f}{A_d}, \\quad \\frac{H}{W} = \\frac{\\text{Altura fachada}}{\\text{Ancho calzada}}',
    formulaDescription: 'Longitud de rugosidad aerodinámica z0 (Grimmond & Oke, 1999) y confinamiento geométrico de cañón H/W.',
    physicsLaw: 'Micrometeorología de la Capa del Dosel Urbano (UCL)',
    explanation: 'Representación volumétrica tridimensional de las edificaciones de Málaga extraídas de OpenStreetMap. Los volúmenes edificatorios actúan como obstáculos aerodinámicos que disipan energía cinética turbulenta, restringen la ventilación natural a nivel de acera y atrapan las emisiones vehiculares en cañones con H/W > 1.0.',
    units: 'metros (altura / z0)',
    typicalRange: 'H = 3 – 55 m | H/W = 0.4 – 2.8',
    regulatoryStandard: {
      authority: 'FAIRMODE',
      document: 'FAIRMODE WG1 Guidance on Urban Microscale Dispersion (2020)',
      objective: 'Resolución de obstáculos y rugosidad en la capa de respiración peatonal'
    },
    literatureCitation: 'Grimmond, C. S. B., & Oke, T. R. (1999). Aerodynamic properties of urban areas derived from analysis of surface form. J. Appl. Meteorol., 38(9), 1262-1292.',
    diagramType: 'osm_canopy_lod1'
  },
  temporal_point_history_7d: {
    id: 'temporal_point_history_7d',
    title: 'Historial Temporal y Tendencias Robustas de Calidad del Aire (7 Días)',
    discipline: 'Asimilación de Datos',
    formulaLaTeX: 'C(t) = C_{base} \\cdot f_{EMEP}(t) \\cdot \\gamma_{canyon} + \\beta_{TheilSen} \\cdot \\Delta t',
    formulaDescription: 'Reconstrucción horaria continua acoplada a tráfico EMEP y cálculo de pendiente Theil-Sen',
    physicsLaw: 'Guía EMEP/EEA 2023 & Estimador No Paramétrico de Theil-Sen (1968)',
    explanation: 'Asimilación horaria de 168 horas acoplando los perfiles circadianos de tráfico vehicular, confinamiento de cañón de Oke y estimación de tendencias con percentil 98 (P98) conforme a la Directiva 2008/50/CE.',
    units: 'µg/m³',
    typicalRange: '0 - 250 µg/m³',
    regulatoryStandard: {
      authority: 'UE',
      document: 'Directiva 2008/50/CE & Guías de Calidad del Aire OMS 2021',
      limitValue: 'NO₂: 40 µg/m³ anual / O₃: 120 µg/m³ máx 8h / PM₂.₅: 25 µg/m³',
      averagingPeriod: '24h',
      objective: 'Evaluación de tendencias de exposición y cumplimiento normativo'
    },
    literatureCitation: 'Sen, P. K. (1968). Estimates of the regression coefficient based on Kendalls tau. J. Am. Stat. Assoc., 63(324), 1379-1389; EMEP/EEA Guidebook 2023.',
    diagramType: 'temporal_7d_history'
  }
};

export type ScientificTopicId = keyof typeof SCIENTIFIC_REGISTRY;

/**
 * Función de consulta universal para obtener la especificación científica completa de un tópico.
 */
export function getScientificTopic(id: ScientificTopicId | string): ScientificTopic | undefined {
  return SCIENTIFIC_REGISTRY[id];
}

/**
 * Función de registro dinámico para que futuras incorporaciones añadan tópicos
 * cumpliendo automáticamente el contrato de rigor científico y trazabilidad.
 */
export function registerScientificTopic(topic: ScientificTopic): void {
  SCIENTIFIC_REGISTRY[topic.id] = topic;
}

/**
 * Lista todos los tópicos científicos registrados agrupados por disciplina.
 */
export function getAllScientificTopics(): ScientificTopic[] {
  return Object.values(SCIENTIFIC_REGISTRY);
}

/**
 * REGLA 12 DEL GEMELO DIGITAL (TESIS DOCTORAL):
 * Enrutamiento Temático Inteligente y Cero Saturación/Redundancia (Domain-Driven UI Architecture).
 * Toda nueva funcionalidad o cálculo debe integrarse estrictamente dentro del modal
 * y la subpestaña temática que le corresponda por dominio científico.
 */
export const DOMAIN_DRIVEN_UI_RULE = {
  ruleNumber: 12,
  title: 'Enrutamiento Temático Inteligente y Cero Saturación/Redundancia',
  principle: 'Domain-Driven UI Architecture',
  enforcement: 'Toda nueva incorporación debe integrarse dentro de su modal y subpestaña canónica preexistente sin crear ventanas redundantes ni saturar el lienzo.',
  domainMapping: {
    environmentalJustice: {
      canonicalModalId: 'environmentalJustice',
      component: 'EnvironmentalJusticeModal',
      subtabs: ['zbe_rebound_proximity', 'toxicological_health', 'geojson_map', 'lorenz_metrics', 'ine_table'],
      description: 'Equidad socioespacial, desequilibrio bivariado, efecto rebote ZBE, toxicidad celular OP-DTT, coste SAS y matrices INE ADRH.'
    },
    schoolAirEquity: {
      canonicalModalId: 'schoolAirEquity',
      component: 'SchoolAirEquityModal',
      subtabs: ['pediatric_dosimetry', 'school_streets', 'direct_compliance'],
      description: 'Entornos escolares seguros, dosimetría pediátrica ICRP 66 a cota 0.9m AGL y cumplimiento Directiva 2024/2881.'
    },
    coastalOceanography: {
      canonicalModalId: 'coastalSmlAcidification',
      component: 'CoastalSmlAcidificationModal',
      subtabs: ['sml_50um_acidification', 'ship_plumes', 'aragonite_saturation'],
      description: 'Microcapa superficial marina SML, acidificación por penachos de buques y química de carbonatos IEO-CSIC.'
    },
    urbanCanyons: {
      canonicalModalId: 'unifiedCanyonSuite',
      component: 'UnifiedUrbanCanyonSuiteModal',
      subtabs: ['regimes_oke', 'catalog_14_canyons', 'vertical_sounding_ospm', 'solar_shading', 'nbs_mitigation', 'street_view_1_8m'],
      description: 'Morfometría urbana 3D, regímenes de flujo de Oke (1987), sondeo vertical OSPM y mitigación NbS.'
    },
    photochemistry: {
      canonicalModalId: 'extendedLeighton',
      component: 'ExtendedLeightonModal',
      subtabs: ['photostationary_state', 'radical_kinetics', 'voc_nox_sillman'],
      description: 'Estado fotoestacionario PSS de Leighton, radicales HOx/RO2 y regímenes de sensibilidad VOC/NOx.'
    },
    trafficEmissions: {
      canonicalModalId: 'copert',
      component: 'CopertTrafficModal',
      subtabs: ['copert5_tier3', 'live_loops', 'emt_fleet_gtfs'],
      description: 'Factores de emisión COPERT 5 Tier 3, aforos en tiempo real y descarbonización de transporte.'
    }
  }
} as const;

export const CHAIN_REACTIVITY_PROPAGATION_RULE = {
  id: 'RULE-13-CHAIN-PROPAGATION',
  name: 'Propagación en Cadena y Sincronización Dinámica Universal',
  principle: 'Cero cifras hardcodeadas en UI. Toda nueva entidad (estaciones, satélites, cañones, etc.) debe propagarse de forma atómica y reactiva a cabeceras, barras de tareas, sidebars y auditorías.',
  enforcement: 'Uso obligatorio de arrays maestros dinámicos (length) sin valores numéricos fijos en plantillas JSX o rótulos.'
} as const;
