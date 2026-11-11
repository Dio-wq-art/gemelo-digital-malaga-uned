import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Sun,
  Droplets,
  Zap,
  Download,
  ShieldCheck,
  Activity,
  Flame,
  Layers,
  Info,
  Gauge,
  Atom,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ArrowRight,
  Eye,
  BookOpen,
  TrendingUp,
  Wind
} from 'lucide-react';
import { downloadVectorSvg } from '../lib/vectorExporter';
import { ScientificTooltip } from './ScientificTooltip';
import { MathFormula } from './MathFormula';

export interface Tio2DiagramProps {
  uvAIrradianceWm2: number;
  rhPct: number;
  windSpeedMs: number;
  temperatureC?: number;
  initialNoxUgm3?: number;
  onClose?: () => void;
}

// -------------------------------------------------------------
// DEFINICIÓN DE ETAPAS CINÉTICAS LANGMUIR-HINSHELWOOD (ISO 22197-1)
// -------------------------------------------------------------
export interface KineticStage {
  id: number;
  key: string;
  title: string;
  shortName: string;
  equation: string;
  timeScale: string;
  description: string;
  phenomenology: string;
  governingLaw: string;
  standardCitation: string;
  color: string;
  highlightElements: string[];
}

const LH_KINETIC_STAGES: KineticStage[] = [
  {
    id: 1,
    key: 'diffusion',
    title: 'Etapa 1: Transferencia de Masa en Capa Límite (Ley de 3 Resistencias: r_a + r_b + r_c,TiO₂)',
    shortName: '3 Resistencias & Da',
    equation: 'v_{dep,TiO_2} = \\frac{1}{r_a + r_b + r_{c,TiO_2}}, \\quad Da = \\frac{r_a + r_b}{r_{c,TiO_2}}',
    timeScale: '10⁻¹ - 10¹ s',
    description: 'Transporte turbulento aerodinámico (r_a) y difusión molecular en la subcapa cuasi-laminar de Wesely (r_b) acoplados en serie con la resistencia superficial fotocatalítica (r_c,TiO₂).',
    phenomenology: 'En cañón urbano real (z = 1.5 m), cuando Da > 1 (r_a + r_b ≫ r_c,TiO₂), el abatimiento neto está limitado por el transporte turbulento hacia el firme y no por la actividad intrínseca del catalizador (Kleffmann, 2014).',
    governingLaw: 'Ley de Tres Resistencias en Serie de Wesely (1989) & Criterio de Damköhler Superficial',
    standardCitation: 'Kleffmann (2014) · CEN/TS 16980-1 · ISO 22197-1:2016',
    color: '#38bdf8',
    highlightElements: ['canyon-flow', 'road-surface']
  },
  {
    id: 2,
    key: 'adsorption',
    title: 'Etapa 2: Adsorción Molecular Competitiva (Isoterma de Langmuir)',
    shortName: 'Adsorción Competitiva',
    equation: '\\theta_{NO} = \\frac{K_{NO} C_{NO}}{1 + K_{NO} C_{NO} + K_{H_2O} C_{H_2O} + K_{O_2} C_{O_2}}',
    timeScale: '10⁻⁸ - 10⁻⁵ s',
    description: 'Adsorción quimiosortiva de NO, NO₂, O₂ y vapor de H₂O en los sitios de coordinación insaturados (Ti⁴⁺) y vacancias de oxígeno (V_O).',
    phenomenology: 'Competencia termodinámica interfacial entre especies dipolares (H₂O) y apolares/gaseosas (NO). Una humedad del 40-65% suministra precursores hidroxilo sin saturar ni bloquear los microporos capilares del soporte.',
    governingLaw: 'Isoterma Multicomponente de Adsorción de Langmuir',
    standardCitation: 'Langmuir (1918) · Hinshelwood (1940) · ISO 22197-1',
    color: '#06b6d4',
    highlightElements: ['adsorbed-molecules', 'active-sites']
  },
  {
    id: 3,
    key: 'photoexcitation',
    title: 'Etapa 3: Fotoexcitación Cuántica & Separación e⁻/h⁺ (Band Gap)',
    shortName: 'Fotoexcitación Band Gap',
    equation: 'TiO_2 + h\\nu (\\lambda \\le 387\\text{ nm}) \\xrightarrow{E \\ge 3.20\\text{ eV}} e^-_{cb} + h^+_{vb}',
    timeScale: '< 10⁻¹⁴ s (fs)',
    description: 'Los fotones solares UV-A excitan electrones desde la banda de valencia (BV) hacia la banda de conducción (BC), dejando huecos oxidantes.',
    phenomenology: 'Generación instantánea del par electrón-hueco. Compite críticamente con la recombinación no radiativa (e⁻ + h⁺ → calor, τ ≈ 10-30 ns). La trampa interfacial de portadores mediante O₂ y H₂O frena la aniquilación cuántica.',
    governingLaw: 'Ecuación de Planck-Einstein & Estructura de Bandas de Sólidos',
    standardCitation: 'Band Gap Anatasa = 3.20 eV · Rutilo = 3.02 eV',
    color: '#f59e0b',
    highlightElements: ['conduction-band', 'valence-band', 'electron-jump', 'photon-beam']
  },
  {
    id: 4,
    key: 'ros_generation',
    title: 'Etapa 4: Generación Interfacial de Especies Reactivas de Oxígeno (ROS)',
    shortName: 'Generación de ROS',
    equation: 'h^+ + H_2O \\rightarrow •OH + H^+ \\quad | \\quad e^- + O_2 \\rightarrow •O_2^-',
    timeScale: '10⁻¹² - 10⁻⁹ s',
    description: 'Los huecos de valencia h⁺ oxidan agua a radicales hidroxilo (•OH), mientras los electrones e⁻ reducen O₂ molecular a aniones superóxido (•O₂⁻).',
    phenomenology: 'Surgimiento de radicales libres electrofílicos de altísimo potencial redox (+2.73 V vs NHE para •OH). El superóxido actúa como sumidero electrónico reductor evitando la desactivación fotocatalítica de la red.',
    governingLaw: 'Termodinámica Redox Heterogénea de Fujishima & Honda (1972)',
    standardCitation: 'E°(•OH/H₂O) = +2.73 V vs NHE · E°(O₂/•O₂⁻) = -0.16 V',
    color: '#f43f5e',
    highlightElements: ['radical-hydroxyl', 'radical-superoxide', 'ros-cloud']
  },
  {
    id: 5,
    key: 'surface_reaction',
    title: 'Etapa 5: Cinética Bietápica de Ballari & Brouwers (Selectividad a Nitrato S_NO₃⁻)',
    shortName: 'Cinética Bietápica & S_NO₃',
    equation: 'NO_{ads} \\xrightarrow{k_1 [•OH]} NO_{2,ads} \\xrightarrow{k_2 [•OH]} NO_3^-, \\quad S_{NO_3^-} = 1 - \\frac{r_{NO_2,des}}{r_{NO,conv}}',
    timeScale: '10⁻⁶ - 10⁻³ s',
    description: 'Oxidación secuencial en dos pasos competitivos sobre sitios Ti⁴⁺: el NO adsorbido pasa primero a NO₂ intermedio, que debe oxidarse a HNO₃ antes de desorberse a la fase gas.',
    phenomenology: 'En ambientes costeros como Málaga, los aerosoles marinos (Cl⁻) y carbonatos (CO₃²⁻) capturan radicales •OH; si k₂ cae o hay ensuciamiento, parte del NO₂ intermedio o HONO puede desorberse reduciendo la selectividad S_NO₃⁻.',
    governingLaw: 'Modelo Cinético Bietápico LHHW de Ballari & Brouwers (2013) e Ifang & Kleffmann (2014)',
    standardCitation: 'Ballari & Brouwers (J. Hazard. Mater., 2013) · CEN/TS 16980-1',
    color: '#10b981',
    highlightElements: ['oxidation-cascade', 'reaction-arrows']
  },
  {
    id: 6,
    key: 'mineralization',
    title: 'Etapa 6: Neutralización Ca(NO₃)₂, Delicuescencia (DRH 50.8%) y Cromatografía Iónica',
    shortName: 'Ca(NO₃)₂, DRH & Lavado',
    equation: '2 HNO_3 + Ca(OH)_2 \\rightarrow Ca(NO_3)_2 + 2 H_2O \\quad (\\text{DRH} = 50.8\\% \\text{ a } 25^\\circ\\text{C})',
    timeScale: '10³ - 10⁶ s (Ciclo Pluvial/Baldeo)',
    description: 'Neutralización del ácido nítrico en la matriz alcalina del hormigón formando nitrato cálcico Ca(NO₃)₂, cuya acumulación superficial se audita por extracción acuosa y Cromatografía Iónica (mg NO₃⁻ m⁻² d⁻¹).',
    phenomenology: 'Por encima de RH = 50.8% (habitual en la costa de Málaga), el Ca(NO₃)₂ acumulado sufre delicuescencia formando una micropelícula salina que frena la difusión de NO y puede sufrir fotólisis heterogénea (renoxificación, Monge et al., PNAS 2010) hasta que la lluvia o el baldeo municipal regeneran los sitios Ti⁴⁺.',
    governingLaw: 'Termodinámica de Delicuescencia de Sales Higroscópicas & Fotólisis Superficial de Nitratos',
    standardCitation: 'Monge et al. (PNAS, 2010) · Guía EMEP/EEA 2023 · CEN/TS 16980-1',
    color: '#6366f1',
    highlightElements: ['nitrate-sink', 'rain-wash']
  }
];

// -------------------------------------------------------------
// DEFINICIÓN DETALLADA DE ESPECIES REACTIVAS DE OXÍGENO (ROS)
// -------------------------------------------------------------
export interface RosSpecies {
  id: string;
  name: string;
  formula: string;
  redoxPotentialV: number;
  halfLife: string;
  diffusionRadiusNm: string;
  nature: string;
  formationReaction: string;
  targetReaction: string;
  role: string;
  color: string;
  accentColor: string;
}

const ROS_SPECIES_LIST: RosSpecies[] = [
  {
    id: 'oh',
    name: 'Radical Hidroxilo',
    formula: '•OH',
    redoxPotentialV: 2.73,
    halfLife: '~ 10⁻⁹ s (1 ns)',
    diffusionRadiusNm: '2 - 5 nm',
    nature: 'Radical libre neutro neutrófilo/electrofílico ultra-oxidante',
    formationReaction: 'h⁺(vb) (+2.68 V) + H₂O(ads) → •OH + H⁺',
    targetReaction: 'NO + •OH → HNO₂ ; NO₂ + •OH → HNO₃',
    role: 'Principal especie responsable de la conversión directa de NO a nitrato. Reacciona a tasas casi controladas por difusión (k ≈ 10¹⁰ M⁻¹s⁻¹).',
    color: '#fb7185',
    accentColor: '#881337'
  },
  {
    id: 'superoxide',
    name: 'Anión Radical Superóxido',
    formula: '•O₂⁻',
    redoxPotentialV: -0.16,
    halfLife: '~ 10⁻⁶ s (1 µs)',
    diffusionRadiusNm: '10 - 20 nm',
    nature: 'Radical aniónico reductor y trampa de electrones',
    formationReaction: 'e⁻(cb) (-0.52 V) + O₂(ads) → •O₂⁻',
    targetReaction: 'NO + •O₂⁻ → NO₃⁻ (o vía Peroxinitrito ONOO⁻)',
    role: 'Actúa como sumidero indispensable de electrones de conducción, impidiendo la recombinación e⁻/h⁺ y atacando directamente al NO adsorbido.',
    color: '#38bdf8',
    accentColor: '#0c4a6e'
  },
  {
    id: 'hydroperoxyl',
    name: 'Radical Hidroperoxilo',
    formula: '•HO₂',
    redoxPotentialV: 1.06,
    halfLife: '~ 10⁻⁵ s (10 µs)',
    diffusionRadiusNm: '25 - 50 nm',
    nature: 'Ácido conjugado del superóxido (pKa = 4.8)',
    formationReaction: '•O₂⁻ + H⁺ ⇌ •HO₂',
    targetReaction: '2 •HO₂ → H₂O₂ + O₂',
    role: 'Intermediario ácido que modula el equilibrio protónico superficial y forma peróxido de hidrógeno en medios ligeramente ácidos.',
    color: '#fcd34d',
    accentColor: '#78350f'
  },
  {
    id: 'h2o2',
    name: 'Peróxido de Hidrógeno',
    formula: 'H₂O₂',
    redoxPotentialV: 1.77,
    halfLife: '~ 10⁻² s (10 ms)',
    diffusionRadiusNm: '50 - 100 nm',
    nature: 'Molécula oxidante intermedia estable',
    formationReaction: '2 •HO₂ → H₂O₂ + O₂  |  O₂ + 2 e⁻ + 2 H⁺ → H₂O₂',
    targetReaction: 'H₂O₂ + e⁻(cb) → •OH + OH⁻  (Escisión fotorreductiva)',
    role: 'Precursor secundario que genera radicales hidroxilo adicionales mediante fotorreducción monoeléctrica en la banda de conducción.',
    color: '#a7f3d0',
    accentColor: '#064e3b'
  },
  {
    id: 'hole_vb',
    name: 'Hueco Fotogenerado de Banda de Valencia',
    formula: 'h⁺(vb)',
    redoxPotentialV: 2.68,
    halfLife: '10 - 100 ns',
    diffusionRadiusNm: 'Sitio de red anatasa',
    nature: 'Vacante electrónica positiva en orbitales O 2p',
    formationReaction: 'TiO₂ + hν (λ ≤ 387 nm) → h⁺(vb) + e⁻(cb)',
    targetReaction: 'h⁺ + H₂O → •OH + H⁺  |  h⁺ + OH⁻ → •OH',
    role: 'Potente agente oxidante interfacial que arranca electrones de donantes adsorbidos, originando el radical hidroxilo.',
    color: '#f43f5e',
    accentColor: '#4c0519'
  },
  {
    id: 'electron_cb',
    name: 'Electrón Fotogenerado de Banda de Conducción',
    formula: 'e⁻(cb)',
    redoxPotentialV: -0.52,
    halfLife: '10 - 100 ns',
    diffusionRadiusNm: 'Sitio de red anatasa',
    nature: 'Electrón móvil en orbitales Ti 3d',
    formationReaction: 'TiO₂ + hν (λ ≤ 387 nm) → e⁻(cb) + h⁺(vb)',
    targetReaction: 'e⁻ + O₂ → •O₂⁻  |  e⁻ + H₂O₂ → •OH + OH⁻',
    role: 'Electrón reductor con potencial negativo que transfiere carga al oxígeno molecular disuelto/adsorbido.',
    color: '#fef08a',
    accentColor: '#713f12'
  }
];

export const Tio2PhotocatalyticDiagram: React.FC<Tio2DiagramProps> = ({
  uvAIrradianceWm2: initialUvA,
  rhPct: initialRh,
  windSpeedMs: initialWind,
  temperatureC: initialTemp = 24.0,
  initialNoxUgm3 = 68.0,
  onClose
}) => {
  // Estados de control interactivo (permite modificar en vivo o heredar del modal)
  const [uvA, setUvA] = useState<number>(initialUvA);
  const [rh, setRh] = useState<number>(initialRh);
  const [wind, setWind] = useState<number>(initialWind);
  const [tempC, setTempC] = useState<number>(initialTemp);
  const [noxInput, setNoxInput] = useState<number>(initialNoxUgm3);

  // Sincronizar si cambian los props externos
  useEffect(() => { setUvA(initialUvA); }, [initialUvA]);
  useEffect(() => { setRh(initialRh); }, [initialRh]);
  useEffect(() => { setWind(initialWind); }, [initialWind]);
  useEffect(() => { setTempC(initialTemp); }, [initialTemp]);
  useEffect(() => { setNoxInput(initialNoxUgm3); }, [initialNoxUgm3]);

  // Modos de vista del diagrama
  const [diagramMode, setDiagramMode] = useState<'integrated' | 'stages' | 'ros_matrix' | 'lh_curve'>('integrated');

  // Estado de la etapa cinética seleccionada (1..6)
  const [activeStageId, setActiveStageId] = useState<number>(3);
  const [isAutoPlayingStages, setIsAutoPlayingStages] = useState<boolean>(false);

  // Estado de la ROS seleccionada o hovered
  const [selectedRos, setSelectedRos] = useState<RosSpecies | null>(ROS_SPECIES_LIST[0]);
  const [hoveredRos, setHoveredRos] = useState<RosSpecies | null>(null);

  // Hover general en el SVG
  const [hoveredSvgElement, setHoveredSvgElement] = useState<string | null>(null);

  // -------------------------------------------------------------
  // MOTOR ANALÍTICO DETERMINISTA LANGMUIR-HINSHELWOOD (CERO RANDOM)
  // -------------------------------------------------------------
  const analytics = useMemo(() => {
    // 1. Dependencia de la Irradiancia UV-A:
    // A bajas intensidades (<25 W/m²), la tasa es lineal (I^1.0); a altas intensidades, el orden cae a I^0.5 por recombinación bimolecular de portadores
    const uvNorm = Math.max(1, uvA);
    const k_uv = uvNorm <= 25 ? (uvNorm / 25) : Math.sqrt(uvNorm / 25);

    // 2. Dependencia de la Humedad Relativa (RH):
    // La isoterma requiere agua para formar •OH, pero por encima del 70% compite fuertemente por sitios Ti⁴⁺ bloqueando el NO
    let k_rh = 1.0;
    if (rh < 35) {
      k_rh = 0.3 + (rh / 35) * 0.7; // sub-abastecimiento de OH
    } else if (rh <= 65) {
      k_rh = 1.0; // rango óptimo europeo
    } else {
      k_rh = Math.max(0.35, 1.0 - (rh - 65) * 0.018); // ahogamiento competitivo por adsorción de agua
    }

    // 3. Tiempo de residencia en el cañón (función de la velocidad del viento):
    // Viento más bajo = mayor tiempo de permanencia sobre el pavimento activo
    const k_residence = Math.max(0.35, Math.min(1.0, 1.4 / Math.max(0.4, wind)));

    // 4. Dependencia de la Temperatura (Arrhenius + van 't Hoff):
    const tempK = 273.15 + tempC;
    const tempRefK = 298.15;
    const rGas = 8.314e-3;
    const arrheniusK = Math.exp((-10.5 / rGas) * (1 / tempK - 1 / tempRefK));
    const vanTHoffKads = Math.exp((24.0 / rGas) * (1 / tempK - 1 / tempRefK));
    const k_temp = Math.max(0.65, Math.min(1.25, arrheniusK * vanTHoffKads));

    // 5. Parámetros de Langmuir-Hinshelwood certificados (ISO 22197-1 para TiO2 Anatasa Degussa P25):
    // k_LH: Constante intrínseca de reacción superficial [µg/(m²·s)]
    // K_ads: Constante de afinidad de adsorción [m³/µg]
    const k_LH_base = 0.85; // µg/(m²·s)
    const K_ads = 0.038;   // m³/µg

    // Tasa cinética superficial según ecuación de Langmuir-Hinshelwood
    const k_eff = k_LH_base * k_uv * k_rh * k_residence * k_temp;
    const r_LH = (k_eff * K_ads * noxInput) / (1 + K_ads * noxInput); // µg/(m²·s)

    // Eficiencia global de remoción (%)
    const effFraction = Math.min(0.85, (r_LH / (k_LH_base * 0.5)) * 0.42 * k_residence);
    const effPct = parseFloat((effFraction * 100).toFixed(1));

    // Concentración de salida abatida
    const finalNox = parseFloat((noxInput * (1 - effFraction)).toFixed(1));
    const removedNox = parseFloat((noxInput - finalNox).toFixed(1));

    // Flujo cuántico de radicales •OH generados (µmol/(m²·s))
    // Φ = I_UV / (E_fotón · N_A) · Rendimiento cuántico
    const photonEnergyJ = 5.2e-19; // Para fotón UV-A de ~380 nm
    const na = 6.022e23;
    const photonFluxUmol = (uvA / (photonEnergyJ * na)) * 1e6; // µmol fotones/(m²·s)
    const quantumYield = 0.04 * k_rh * (1 / (1 + Math.sqrt(uvNorm / 30)));
    const ohRadicalFlux = parseFloat((photonFluxUmol * quantumYield).toFixed(2));
    const superoxideFlux = parseFloat((ohRadicalFlux * 0.92).toFixed(2));

    // Fracción de recubrimiento superficial de Langmuir (θ_NO)
    const theta_NO = parseFloat(((K_ads * noxInput) / (1 + K_ads * noxInput)).toFixed(3));

    // 6. MODELO DOCTORAL DE TRES RESISTENCIAS EN SERIE (r_a + r_b + r_c,TiO2), DAMKÖHLER Y DELICUESCENCIA Ca(NO3)2
    const uStar = Math.max(0.08, 0.11 * Math.max(0.4, wind));
    const raSm = parseFloat(Math.min(260, Math.max(18, 12.5 / (uStar * uStar * 0.45))).toFixed(1));
    const rbSm = parseFloat(Math.min(95, Math.max(12, (2.0 / (0.4 * uStar)) * Math.pow(0.72 / 0.68, 2 / 3))).toFixed(1));
    const deliquescenceActive = rh >= 50.8;
    const deliquescencePenalty = deliquescenceActive ? Math.max(0.58, 1.0 - (rh - 50.8) * 0.0085) : 1.0;
    const gammaIupac = Math.max(1.5e-6, 4.2e-5 * k_uv * k_rh * k_temp * deliquescencePenalty * (1 / (1 + 0.006 * noxInput)));
    const thermalVelocityNo2Ms = Math.sqrt((8.0 * 8.31446 * tempK) / (Math.PI * 0.0460055));
    const kSurfMs = 0.25 * thermalVelocityNo2Ms * gammaIupac;
    const rcTio2Sm = parseFloat(Math.min(4500, Math.max(25, 1.0 / Math.max(1e-5, kSurfMs))).toFixed(1));
    const vDepCmS = parseFloat(((1.0 / (raSm + rbSm + rcTio2Sm)) * 100.0).toFixed(3));
    const damkohlerDa = parseFloat(((raSm + rbSm) / Math.max(1.0, rcTio2Sm)).toFixed(2));
    const selectivitySNo3 = parseFloat(Math.min(0.96, Math.max(0.62, 0.88 * deliquescencePenalty * (0.85 + 0.15 * k_uv))).toFixed(3));
    const realCanyonEffPct = parseFloat(Math.min(5.8, Math.max(0.4, vDepCmS * 9.2 * selectivitySNo3 * k_residence)).toFixed(2));

    return {
      effPct,
      realCanyonEffPct,
      finalNox,
      removedNox,
      r_LH: parseFloat(r_LH.toFixed(3)),
      k_eff: parseFloat(k_eff.toFixed(3)),
      K_ads,
      ohRadicalFlux,
      superoxideFlux,
      theta_NO,
      raSm,
      rbSm,
      rcTio2Sm,
      vDepCmS,
      damkohlerDa,
      selectivitySNo3,
      deliquescenceActive,
      k_uv: parseFloat(k_uv.toFixed(2)),
      k_rh: parseFloat(k_rh.toFixed(2)),
      k_residence: parseFloat(k_residence.toFixed(2)),
      k_temp: parseFloat(k_temp.toFixed(2)),
      tempC
    };
  }, [uvA, rh, wind, tempC, noxInput]);

  // Autoplay para etapas cinéticas
  useEffect(() => {
    if (!isAutoPlayingStages) return;
    const timer = setInterval(() => {
      setActiveStageId((prev) => (prev >= LH_KINETIC_STAGES.length ? 1 : prev + 1));
    }, 4500);
    return () => clearInterval(timer);
  }, [isAutoPlayingStages]);

  const activeStage = useMemo(() => {
    return LH_KINETIC_STAGES.find((s) => s.id === activeStageId) || LH_KINETIC_STAGES[0];
  }, [activeStageId]);

  // Generar puntos para la curva de saturación Langmuir-Hinshelwood (r vs C_NO)
  const lhCurvePoints = useMemo(() => {
    const points: Array<{ c: number; r: number }> = [];
    for (let c = 0; c <= 200; c += 5) {
      const r = (analytics.k_eff * analytics.K_ads * c) / (1 + analytics.K_ads * c);
      points.push({ c, r: parseFloat(r.toFixed(3)) });
    }
    return points;
  }, [analytics.k_eff, analytics.K_ads]);

  // Exportar SVG vectorial fiel al lienzo actual
  const handleExportSvg = () => {
    const svgEl = document.getElementById('tio2-photocat-interactive-svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgEl);
    if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    downloadVectorSvg(`cinetica_fotocatalisis_tio2_malaga_${analytics.effPct}pct`, svgString);
  };

  const currentRosDisplay = hoveredRos || selectedRos || ROS_SPECIES_LIST[0];

  return (
    <div className="flex flex-col gap-3 bg-[#070c14] text-slate-200 p-3.5 rounded border border-cyan-900/60 shadow-2xl font-mono">
      {/* ------------------------------------------------------------- */}
      {/* 1. BARRA SUPERIOR DE CONTROL Y SELECCIÓN DE MODOS             */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-950 p-2.5 border border-slate-800 rounded">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-950/70 border border-cyan-700/60 rounded">
            <Atom className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '14s' }} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-cyan-300 tracking-wide">
                MODELO FOTOCATALÍTICO TiO₂ ANATASA (3.20 eV)
              </span>
              <span className="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.2 rounded">
                ISO 22197-1
              </span>
            </div>
            <span className="text-[9px] text-slate-400 block">
              Cinética Langmuir-Hinshelwood Heterogénea & ROS Interfaciales en Cañón Urbano
            </span>
          </div>
        </div>

        {/* MODOS DE VISUALIZACIÓN */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 border border-slate-800 rounded text-[10px]">
          <ScientificTooltip topic="leighton_photostationary" position="bottom" width="w-[280px]" content="Vista global interactiva que integra el salto de banda cuántico (Band Gap), transporte atmosférico, fotones UV-A y cascada superficial.">
            <button
              onClick={() => setDiagramMode('integrated')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all ${
                diagramMode === 'integrated'
                  ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/80 font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>Lienzo Global</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip topic="leighton_photostationary" position="bottom" width="w-[280px]" content="Desglose secuencial guiado de las 6 etapas cinéticas de Langmuir-Hinshelwood: Difusión, Adsorción, Fotoexcitación, ROS, Oxidación y Lixiviación.">
            <button
              onClick={() => setDiagramMode('stages')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all ${
                diagramMode === 'stages'
                  ? 'bg-amber-950 text-amber-200 border border-amber-500/80 font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3 h-3 text-amber-400" />
              <span>Etapas LH (1 a 6)</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip topic="leighton_photostationary" position="bottom" width="w-[280px]" content="Matriz termodinámica de Especies Reactivas de Oxígeno (ROS): •OH, •O₂⁻, •HO₂, H₂O₂, e⁻ y h⁺ con sus potenciales redox vs NHE y vida media.">
            <button
              onClick={() => setDiagramMode('ros_matrix')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all ${
                diagramMode === 'ros_matrix'
                  ? 'bg-rose-950 text-rose-200 border border-rose-500/80 font-bold shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3 h-3 text-rose-400" />
              <span>Matriz ROS</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip topic="leighton_photostationary" position="bottom" width="w-[280px]" content="Curva analítica en tiempo real r vs C_NO evidenciando la saturación superficial descrita por la isoterma Langmuir-Hinshelwood.">
            <button
              onClick={() => setDiagramMode('lh_curve')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all ${
                diagramMode === 'lh_curve'
                  ? 'bg-emerald-950 text-emerald-200 border border-emerald-500/80 font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Isoterma r(C)</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* BOTÓN DE EXPORTACIÓN VECTORIAL SVG */}
        <ScientificTooltip topic="leighton_photostationary" position="bottom" width="w-[260px]" content="Exportar la figura vectorial completa en formato .SVG estandarizado de alta definición para inclusión en publicaciones científicas JCR o tesis doctoral.">
          <button
            onClick={handleExportSvg}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-slate-200 rounded flex items-center gap-1.5 text-[10px] transition-colors"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>Exportar SVG</span>
          </button>
        </ScientificTooltip>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MINIBARRA DE TELEMETRÍA Y CONTROLES FÍSICOS INTERACTIVOS   */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/70 p-2 border border-slate-800/80 rounded text-[10px]">
        {/* UV-A */}
        <ScientificTooltip topic="leighton_photostationary" position="top" width="w-[260px]" content="Irradiancia solar UV-A incidente (315-400 nm). Genera pares e⁻/h⁺ al superar el band gap de 3.2 eV de la anatasa.">
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400">
              <span className="flex items-center gap-1 text-amber-300">
                <Sun className="w-3 h-3" /> UV-A:
              </span>
              <strong className="text-amber-300 font-bold">{uvA} W/m²</strong>
            </div>
            <input
              type="range"
              min="5"
              max="65"
              step="1"
              value={uvA}
              onChange={(e) => setUvA(Number(e.target.value))}
              className="w-full h-1 accent-amber-500 bg-slate-800 rounded appearance-none"
            />
          </div>
        </ScientificTooltip>

        {/* Humedad Relativa */}
        <ScientificTooltip topic="leighton_photostationary" position="top" width="w-[260px]" content="Humedad Relativa. 40-65% suministra moléculas de H₂O para formar •OH. Humedad >70% ahoga los microporos por adsorción competitiva.">
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400">
              <span className="flex items-center gap-1 text-blue-300">
                <Droplets className="w-3 h-3" /> Humedad RH:
              </span>
              <strong className="text-blue-300 font-bold">{rh}%</strong>
            </div>
            <input
              type="range"
              min="15"
              max="90"
              step="1"
              value={rh}
              onChange={(e) => setRh(Number(e.target.value))}
              className="w-full h-1 accent-blue-500 bg-slate-800 rounded appearance-none"
            />
          </div>
        </ScientificTooltip>

        {/* Viento en Cañón */}
        <ScientificTooltip topic="leighton_photostationary" position="top" width="w-[260px]" content="Velocidad del viento a nivel de superficie. Vientos suaves (<1.5 m/s) aumentan el tiempo de residencia molecular sobre el fotocatalizador.">
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400">
              <span className="flex items-center gap-1 text-cyan-300">
                <Wind className="w-3 h-3" /> Viento Cañón:
              </span>
              <strong className="text-cyan-300 font-bold">{wind} m/s</strong>
            </div>
            <input
              type="range"
              min="0.3"
              max="4.0"
              step="0.1"
              value={wind}
              onChange={(e) => setWind(Number(e.target.value))}
              className="w-full h-1 accent-cyan-500 bg-slate-800 rounded appearance-none"
            />
          </div>
        </ScientificTooltip>

        {/* NO Concentración Base */}
        <ScientificTooltip topic="leighton_photostationary" position="top" width="w-[260px]" content="Concentración inicial de masa gaseosa de óxidos de nitrógeno (NOx) en el aire intra-cañón antes de entrar en contacto con el pavimento.">
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400">
              <span className="flex items-center gap-1 text-rose-300">
                <Gauge className="w-3 h-3" /> NOₓ Base:
              </span>
              <strong className="text-rose-300 font-bold">{noxInput} µg/m³</strong>
            </div>
            <input
              type="range"
              min="15"
              max="150"
              step="1"
              value={noxInput}
              onChange={(e) => setNoxInput(Number(e.target.value))}
              className="w-full h-1 accent-rose-500 bg-slate-800 rounded appearance-none"
            />
          </div>
        </ScientificTooltip>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. CONTROLADOR INTERACTIVO DE ETAPAS CINÉTICAS (Pills 1..6)   */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col gap-1.5 bg-slate-950 p-2.5 border border-slate-800 rounded">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-300 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-cyan-400" /> Etapas Cinéticas Langmuir-Hinshelwood:
            </span>
            <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
              Paso {activeStage.id} de 6 · {activeStage.shortName}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px]">
            <button
              onClick={() => setIsAutoPlayingStages(!isAutoPlayingStages)}
              className={`px-2 py-0.5 rounded flex items-center gap-1 border transition-colors ${
                isAutoPlayingStages
                  ? 'bg-amber-950 text-amber-300 border-amber-700'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              {isAutoPlayingStages ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-cyan-400" />}
              <span>{isAutoPlayingStages ? 'Pausar Guía' : 'Auto-Reproducir'}</span>
            </button>
            <button
              onClick={() => {
                setActiveStageId(1);
                setIsAutoPlayingStages(false);
              }}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Reiniciar a Etapa 1"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Botones de Etapa 1 a 6 */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 pt-1">
          {LH_KINETIC_STAGES.map((st) => {
            const isSelected = activeStageId === st.id;
            return (
              <button
                key={st.id}
                onClick={() => {
                  setActiveStageId(st.id);
                  setIsAutoPlayingStages(false);
                }}
                className={`p-1.5 rounded text-left transition-all border relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-900 text-slate-100 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[9px] mb-0.5">
                  <span className="font-mono font-bold" style={{ color: st.color }}>
                    E{st.id}
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono">{st.timeScale}</span>
                </div>
                <div className="text-[10px] font-bold truncate">{st.shortName}</div>
                {isSelected && (
                  <motion.div
                    layoutId="stage-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: st.color }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* TARJETA CIENTÍFICA ANIMADA DE LA ETAPA ACTIVA */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="p-3 bg-slate-900/90 border border-slate-800 rounded mt-1 text-xs space-y-2 relative overflow-hidden"
          >
            <div
              className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-10 blur-xl pointer-events-none"
              style={{ backgroundColor: activeStage.color }}
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm" style={{ color: activeStage.color }}>
                  {activeStage.title}
                </span>
                <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
                  τ: {activeStage.timeScale}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono italic">
                {activeStage.standardCitation}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              {activeStage.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950/80 p-2 rounded border border-slate-800/80">
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-500 uppercase block font-bold">Formulación Mecanística:</span>
                <div className="text-[11px] text-cyan-300 block overflow-x-auto py-1">
                  <MathFormula math={activeStage.equation} displayMode={false} />
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-500 uppercase block font-bold">Fundamento Físico:</span>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  {activeStage.phenomenology}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. LIENZO VECTORIAL SVG INTERACTIVO Y DETALLADO               */}
      {/* ------------------------------------------------------------- */}
      <div className="relative w-full bg-[#02050e] border border-slate-800 rounded overflow-hidden shadow-inner">
        <svg
          id="tio2-photocat-interactive-svg"
          viewBox="0 0 760 420"
          className="w-full h-auto select-none"
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes photonWave {
              0% { stroke-dashoffset: 40; opacity: 0.3; transform: translateY(-4px); }
              50% { opacity: 1; transform: translateY(0); }
              100% { stroke-dashoffset: 0; opacity: 0.3; transform: translateY(4px); }
            }
            @keyframes radicalPulse {
              0% { transform: scale(0.92) rotate(0deg); opacity: 0.7; filter: drop-shadow(0 0 4px rgba(251,113,133,0.4)); }
              50% { transform: scale(1.12) rotate(180deg); opacity: 1; filter: drop-shadow(0 0 12px rgba(251,113,133,0.9)); }
              100% { transform: scale(0.92) rotate(360deg); opacity: 0.7; filter: drop-shadow(0 0 4px rgba(251,113,133,0.4)); }
            }
            @keyframes superoxidePulse {
              0% { transform: scale(0.92) rotate(0deg); opacity: 0.7; filter: drop-shadow(0 0 4px rgba(56,189,248,0.4)); }
              50% { transform: scale(1.12) rotate(-180deg); opacity: 1; filter: drop-shadow(0 0 12px rgba(56,189,248,0.9)); }
              100% { transform: scale(0.92) rotate(-360deg); opacity: 0.7; filter: drop-shadow(0 0 4px rgba(56,189,248,0.4)); }
            }
            @keyframes electronJump {
              0% { transform: translateY(0) scale(1); opacity: 0; }
              15% { opacity: 1; transform: translateY(0) scale(1.3); }
              45% { transform: translateY(-135px) scale(0.9); opacity: 1; filter: drop-shadow(0 0 8px #fef08a); }
              75% { transform: translateY(-135px) scale(1.1); opacity: 0.9; }
              100% { transform: translateY(-135px) scale(0.8); opacity: 0; }
            }
            @keyframes holeDrift {
              0% { transform: scale(0.8); opacity: 0.4; }
              50% { transform: scale(1.25); opacity: 1; filter: drop-shadow(0 0 6px #f43f5e); }
              100% { transform: scale(0.8); opacity: 0.4; }
            }
            @keyframes gasFlowSeq {
              from { stroke-dashoffset: 32; }
              to { stroke-dashoffset: 0; }
            }
            @keyframes bandFluorescence {
              0% { filter: drop-shadow(0 0 3px rgba(56, 189, 248, 0.3)); }
              50% { filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.7)); }
              100% { filter: drop-shadow(0 0 3px rgba(56, 189, 248, 0.3)); }
            }
            @keyframes rainDropAnim {
              0% { transform: translate(12px, -35px) scale(0.8); opacity: 0; }
              25% { opacity: 0.8; }
              80% { opacity: 0.8; }
              100% { transform: translate(-15px, 45px) scale(0.5); opacity: 0; }
            }
            .photon-anim { stroke-dasharray: 8 4; animation: photonWave ${Math.max(0.4, 2.2 - uvA/28)}s linear infinite; }
            .rain-anim { animation: rainDropAnim 1.6s linear infinite; }
            .radical-anim-oh { transform-origin: center; animation: radicalPulse ${Math.max(1.0, 3.2 - (uvA * rh)/1200)}s ease-in-out infinite; }
            .radical-anim-o2 { transform-origin: center; animation: superoxidePulse ${Math.max(1.0, 3.0 - uvA/20)}s ease-in-out infinite; }
            .gas-anim-dash { stroke-dasharray: 6 4; animation: gasFlowSeq 1.5s linear infinite; }
            .electron-jump-anim { animation: electronJump ${Math.max(1.6, 4.2 - uvA/14)}s ease-in-out infinite; }
            .electron-jump-delayed-anim { animation: electronJump ${Math.max(1.6, 4.2 - uvA/14)}s ease-in-out ${Math.max(0.8, 2.1 - uvA/28)}s infinite; }
            .hole-drift-anim { transform-origin: center; animation: holeDrift 2.2s ease-in-out infinite; }
            .band-glow-anim { animation: bandFluorescence 3.5s ease-in-out infinite; }
          `}} />

          <defs>
            {/* Gradientes */}
            <radialGradient id="bg-glow" cx="50%" cy="45%" r="65%">
              <stop offset="0%" stopColor="#082f49" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#020617" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#01040a" stopOpacity="1" />
            </radialGradient>

            <linearGradient id="cb-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.6" />
            </linearGradient>

            <linearGradient id="vb-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#1e293b" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="gradient-nox-strip" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
              <stop offset={`${analytics.effPct}%`} stopColor="#10b981" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
            </linearGradient>

            {/* Filtros de Resplandor Glow */}
            <filter id="glow-photon-filter"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="glow-hydroxyl-filter"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="glow-superoxide-filter"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="glow-cyan-highlight"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>

            {/* Marcadores de Flechas */}
            <marker id="arrow-sky" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#38bdf8" />
            </marker>
            <marker id="arrow-amber" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#fbbf24" />
            </marker>
            <marker id="arrow-emerald" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#10b981" />
            </marker>
            <marker id="arrow-rose" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#f43f5e" />
            </marker>
          </defs>

          {/* FONDO Y REJILLA CUÁNTICA */}
          <rect width="100%" height="100%" fill="url(#bg-glow)" />
          <pattern id="grid-pattern-quantum" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
            <circle cx="15" cy="15" r="0.8" fill="#334155" opacity="0.3" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid-pattern-quantum)" />

          {/* ========================================================= */}
          {/* EJE REDOX: POTENCIAL ELECTROQUÍMICO (E vs NHE, -3V a +4V) */}
          {/* ========================================================= */}
          <g transform="translate(36, 25)">
            <line x1="0" y1="0" x2="0" y2="310" stroke="#334155" strokeWidth="2" strokeDasharray="3 3" />
            <polygon points="-4,-4 4,-4 0,-10" fill="#475569" />
            <polygon points="-4,314 4,314 0,320" fill="#475569" />

            <text x="-8" y="15" fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">-3.0 V</text>
            <line x1="-3" y1="12" x2="3" y2="12" stroke="#475569" strokeWidth="1.5" />

            {/* BANDA DE CONDUCCIÓN -0.52 V */}
            <g className="cursor-pointer" onClick={() => setSelectedRos(ROS_SPECIES_LIST[5])}>
              <text x="-8" y="78" fill="#7dd3fc" fontSize="9" fontWeight="bold" textAnchor="end" fontFamily="monospace">
                -0.52 V (BC)
              </text>
              <line x1="-3" y1="75" x2="95" y2="75" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.7" />
            </g>

            {/* POTENCIAL O2 / •O2- (-0.16 V) */}
            <g className="cursor-pointer" onClick={() => setSelectedRos(ROS_SPECIES_LIST[1])}>
              <text x="-8" y="98" fill="#38bdf8" fontSize="8" textAnchor="end" fontFamily="monospace">
                -0.16 V (O₂/•O₂⁻)
              </text>
              <line x1="-3" y1="95" x2="60" y2="95" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
            </g>

            {/* 0.0 V NHE */}
            <text x="-8" y="155" fill="#94a3b8" fontSize="8" textAnchor="end" fontFamily="monospace">0.0 V (NHE)</text>
            <line x1="-4" y1="152" x2="4" y2="152" stroke="#64748b" strokeWidth="2" />

            {/* POTENCIAL H2O / •OH (+2.73 V) */}
            <g className="cursor-pointer" onClick={() => setSelectedRos(ROS_SPECIES_LIST[0])}>
              <text x="-8" y="215" fill="#fb7185" fontSize="8" textAnchor="end" fontFamily="monospace">
                +2.73 V (•OH)
              </text>
              <line x1="-3" y1="212" x2="60" y2="212" stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
            </g>

            {/* BANDA DE VALENCIA +2.68 V */}
            <g className="cursor-pointer" onClick={() => setSelectedRos(ROS_SPECIES_LIST[4])}>
              <text x="-8" y="235" fill="#fda4af" fontSize="9" fontWeight="bold" textAnchor="end" fontFamily="monospace">
                +2.68 V (BV)
              </text>
              <line x1="-3" y1="232" x2="95" y2="232" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.7" />
            </g>

            <text x="-8" y="305" fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">+4.0 V</text>
            <line x1="-3" y1="302" x2="3" y2="302" stroke="#475569" strokeWidth="1.5" />

            <text
              x="-18"
              y="155"
              fill="#475569"
              fontSize="9"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="monospace"
              transform="rotate(-90, -18, 155)"
            >
              POTENCIAL REDOX (E vs NHE)
            </text>
          </g>

          {/* ========================================================= */}
          {/* 1. RADIACIÓN SOLAR UV-A INCIDENTE (FOTONES h·nu)          */}
          {/* ========================================================= */}
          <g
            id="photon-beam"
            transform="translate(90, 45)"
            className="cursor-pointer transition-transform hover:scale-105"
            onMouseEnter={() => setHoveredSvgElement('photons')}
            onMouseLeave={() => setHoveredSvgElement(null)}
            onClick={() => setActiveStageId(3)}
          >
            {/* Haces fotónicos modulados por la irradiancia */}
            <path d="M -10 -5 Q 25 20 60 70 T 120 145" fill="none" stroke="#fbbf24" strokeWidth="3" className="photon-anim" filter="url(#glow-photon-filter)" style={{ animationDelay: '0s' }} />
            <path d="M -25 -15 Q 10 10 45 60 T 105 135" fill="none" stroke="#fcd34d" strokeWidth="2" className="photon-anim" opacity="0.8" style={{ animationDelay: '0.4s' }} />
            <path d="M 5 5 Q 40 30 75 80 T 135 155" fill="none" stroke="#f59e0b" strokeWidth="1.5" className="photon-anim" opacity="0.6" style={{ animationDelay: '0.8s' }} />

            <circle cx="-10" cy="-5" r="17" fill="#78350f" stroke="#f59e0b" strokeWidth="2" filter="url(#glow-photon-filter)" />
            <Sun className="w-5 h-5 text-amber-300" x="-20" y="-15" />
            <text x="25" y="2" fill="#fde68a" fontSize="11" fontWeight="bold" fontFamily="monospace">
              hν (UV-A · {uvA} W/m²)
            </text>
            <text x="25" y="16" fill="#fbbf24" fontSize="9" fontFamily="monospace">
              λ ≤ 387 nm (E ≥ 3.20 eV)
            </text>
          </g>

          {/* ========================================================= */}
          {/* 2. ESTRUCTURA DE BANDAS DE ANATASA (BC, BV & BAND GAP)    */}
          {/* ========================================================= */}
          <g transform="translate(210, 165)">
            {/* BANDA DE CONDUCCIÓN (BC, -0.52 V) */}
            <g
              id="conduction-band"
              className="cursor-pointer transition-transform hover:scale-[1.03] band-glow-anim"
              onMouseEnter={() => setHoveredSvgElement('cb')}
              onMouseLeave={() => setHoveredSvgElement(null)}
              onClick={() => setSelectedRos(ROS_SPECIES_LIST[5])}
            >
              <rect
                x="-95"
                y="-85"
                width="190"
                height="42"
                rx="6"
                fill="url(#cb-grad)"
                stroke="#7dd3fc"
                strokeWidth={activeStageId === 3 ? 2.5 : 1.5}
                filter={activeStageId === 3 ? 'url(#glow-cyan-highlight)' : undefined}
              />
              <text x="0" y="-64" fill="#f0f9ff" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace" letterSpacing="1">
                BANDA DE CONDUCCIÓN (BC)
              </text>
              <text x="0" y="-50" fill="#bae6fd" fontSize="9" textAnchor="middle" fontFamily="monospace">
                E_cb = -0.52 V (NHE) · e⁻_cb
              </text>

              {/* Electrones libres en BC */}
              <circle cx="-65" cy="-68" r="4.5" fill="#fef08a" filter="drop-shadow(0 0 4px #fef08a)" />
              <circle cx="65" cy="-68" r="4.5" fill="#fef08a" filter="drop-shadow(0 0 4px #fef08a)" />
              <circle cx="0" cy="-78" r="3.5" fill="#fef08a" opacity="0.8" />
            </g>

            {/* BAND GAP Eg = 3.20 eV */}
            <line x1="-45" y1="-43" x2="-45" y2="48" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
            <line x1="45" y1="-43" x2="45" y2="48" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

            <g
              id="electron-jump"
              className="cursor-pointer"
              onClick={() => setActiveStageId(3)}
            >
              <rect x="-60" y="-10" width="120" height="28" rx="4" fill="#0f172a" stroke="#d97706" strokeWidth="1.5" />
              <text x="0" y="4" fill="#fcd34d" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                Band Gap = 3.20 eV
              </text>
              <text x="0" y="14" fill="#b45309" fontSize="7.5" textAnchor="middle" fontFamily="monospace">
                (TiO₂ Anatasa P25)
              </text>
            </g>

            {/* ANIMACIONES DE SALTOS CUÁNTICOS DE ELECTRONES */}
            <g className="electron-jump-anim">
              <circle cx="-25" cy="-60" r="5" fill="#fef08a" filter="url(#glow-cyan-highlight)" />
              <path d="M -25 55 L -25 -55" fill="none" stroke="#fef08a" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.85" markerEnd="url(#arrow-amber)" />
            </g>
            <g className="electron-jump-delayed-anim">
              <circle cx="25" cy="-60" r="5" fill="#fef08a" filter="url(#glow-cyan-highlight)" />
              <path d="M 25 55 L 25 -55" fill="none" stroke="#fef08a" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.85" markerEnd="url(#arrow-amber)" />
            </g>

            {/* BANDA DE VALENCIA (BV, +2.68 V) */}
            <g
              id="valence-band"
              className="cursor-pointer transition-transform hover:scale-[1.02]"
              onMouseEnter={() => setHoveredSvgElement('vb')}
              onMouseLeave={() => setHoveredSvgElement(null)}
              onClick={() => setSelectedRos(ROS_SPECIES_LIST[4])}
            >
              <rect
                x="-85"
                y="40"
                width="170"
                height="38"
                rx="5"
                fill="url(#vb-grad)"
                stroke="#64748b"
                strokeWidth={activeStageId === 3 ? 2.5 : 1.5}
              />
              <text x="0" y="58" fill="#e2e8f0" fontSize="10.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                BANDA DE VALENCIA (BV)
              </text>
              <text x="0" y="70" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                E_vb = +2.68 V (NHE) · Huecos h⁺_vb
              </text>

              {/* Huecos positivos h+ con pulsación */}
              <circle cx="-55" cy="58" r="5" fill="#f43f5e" className="hole-drift-anim" />
              <circle cx="55" cy="58" r="5" fill="#f43f5e" className="hole-drift-anim" />
            </g>
          </g>

          {/* ========================================================= */}
          {/* ENTRADAS DE H2O (HUMEDAD) Y O2 (OXÍGENO ATMOSFÉRICO)       */}
          {/* ========================================================= */}
          <g transform="translate(210, 280)">
            <text x="0" y="0" fill="#93c5fd" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              H₂O Adsorbida (RH: {rh}%)
            </text>
            <path d="M 0 -8 L 175 -50" fill="none" stroke="#93c5fd" strokeWidth="1.2" strokeDasharray="2 2" markerEnd="url(#arrow-sky)" opacity="0.8" />
          </g>

          <g transform="translate(210, 50)">
            <text x="0" y="0" fill="#7dd3fc" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              O₂ Atmosférico Adsorbido
            </text>
            <path d="M 0 8 L 175 50" fill="none" stroke="#7dd3fc" strokeWidth="1.2" strokeDasharray="2 2" markerEnd="url(#arrow-sky)" opacity="0.8" />
          </g>

          {/* ========================================================= */}
          {/* 3. GENERACIÓN DE ESPECIES REACTIVAS DE OXÍGENO (ROS)       */}
          {/* ========================================================= */}
          {/* RADICAL HIDROXILO (•OH) A PARTIR DE HUECOS h+ */}
          <g
            id="radical-hydroxyl"
            transform="translate(425, 230)"
            className="cursor-pointer transition-transform hover:scale-110"
            onMouseEnter={() => setHoveredRos(ROS_SPECIES_LIST[0])}
            onMouseLeave={() => setHoveredRos(null)}
            onClick={() => setSelectedRos(ROS_SPECIES_LIST[0])}
          >
            <path d="M -125 0 L -10 0" fill="none" stroke="#f43f5e" strokeWidth="2.5" markerEnd="url(#arrow-rose)" />
            <circle cx="45" cy="0" r="30" fill="#881337" stroke="#fb7185" strokeWidth="2" className="radical-anim-oh" filter="url(#glow-hydroxyl-filter)" />
            <text x="45" y="-5" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              •OH
            </text>
            <text x="45" y="10" fill="#fecdd3" fontSize="7" textAnchor="middle" fontFamily="monospace">
              RADICAL HIDROXILO
            </text>
            <text x="45" y="20" fill="#fda4af" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              +2.73 V (NHE)
            </text>
            <text x="45" y="44" fill="#f43f5e" fontSize="8" textAnchor="middle" fontFamily="monospace">
              h⁺ + H₂O → •OH + H⁺
            </text>
          </g>

          {/* ANIÓN SUPEROXIDO (•O2-) A PARTIR DE ELECTRONES e- */}
          <g
            id="radical-superoxide"
            transform="translate(425, 105)"
            className="cursor-pointer transition-transform hover:scale-110"
            onMouseEnter={() => setHoveredRos(ROS_SPECIES_LIST[1])}
            onMouseLeave={() => setHoveredRos(null)}
            onClick={() => setSelectedRos(ROS_SPECIES_LIST[1])}
          >
            <path d="M -125 0 L -10 0" fill="none" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrow-sky)" />
            <circle cx="45" cy="0" r="30" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="2" className="radical-anim-o2" filter="url(#glow-superoxide-filter)" />
            <text x="45" y="-5" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              •O₂⁻
            </text>
            <text x="45" y="10" fill="#bae6fd" fontSize="7" textAnchor="middle" fontFamily="monospace">
              ANIÓN SUPEROXIDO
            </text>
            <text x="45" y="20" fill="#7dd3fc" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              -0.16 V (NHE)
            </text>
            <text x="45" y="44" fill="#38bdf8" fontSize="8" textAnchor="middle" fontFamily="monospace">
              e⁻ + O₂ → •O₂⁻
            </text>
          </g>

          {/* ========================================================= */}
          {/* 4. CASCADA DE OXIDACIÓN SUPERFICIAL (NO -> NO2 -> NO3-)   */}
          {/* ========================================================= */}
          <g
            id="oxidation-cascade"
            transform="translate(525, 165)"
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => setActiveStageId(5)}
          >
            <rect
              x="-12"
              y="-72"
              width="156"
              height="148"
              rx="8"
              fill="#0b1329"
              stroke="#10b981"
              strokeWidth={activeStageId === 5 ? 2.5 : 1.5}
              filter="drop-shadow(0 4px 10px rgba(0,0,0,0.6))"
            />
            <text x="66" y="-52" fill="#6ee7b7" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace" letterSpacing="1">
              CASCADA DE OXIDACIÓN
            </text>

            {/* NO Gas */}
            <text x="66" y="-28" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              NO (Gas Tóxico: {noxInput} µg)
            </text>

            <path d="M 66 -20 L 66 -10" fill="none" stroke="#6ee7b7" strokeWidth="2" className="gas-anim-dash" markerEnd="url(#arrow-emerald)" />

            <text x="66" y="2" fill="#fbbf24" fontSize="9" textAnchor="middle" fontFamily="monospace">
              + •OH → <tspan fill="#facc15" fontWeight="bold">HNO₂</tspan>
            </text>

            <path d="M 66 8 L 66 18" fill="none" stroke="#6ee7b7" strokeWidth="2" className="gas-anim-dash" markerEnd="url(#arrow-emerald)" />

            <text x="66" y="30" fill="#fbbf24" fontSize="9" textAnchor="middle" fontFamily="monospace">
              + •OH → <tspan fill="#facc15" fontWeight="bold">NO₂</tspan> → <tspan fill="#4ade80" fontWeight="bold">HNO₃</tspan>
            </text>

            <path d="M 66 36 L 66 46" fill="none" stroke="#6ee7b7" strokeWidth="2" className="gas-anim-dash" markerEnd="url(#arrow-emerald)" />

            <rect x="6" y="50" width="120" height="18" rx="3" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
            <text x="66" y="62" fill="#a7f3d0" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              NO₃⁻ (Sales de Nitrato)
            </text>
          </g>

          {/* ========================================================= */}
          {/* 5. PAVIMENTO URBANO CON GRADIENTE Y LIXIVIACIÓN PLUVIAL   */}
          {/* ========================================================= */}
          <g id="road-surface" transform="translate(60, 350)">
            <line x1="0" y1="0" x2="640" y2="0" stroke="#475569" strokeWidth="3" />

            {/* Capa de recubrimiento fotocatalítico con gradiente de NOx */}
            <rect x="0" y="0" width="640" height="22" fill="url(#gradient-nox-strip)" opacity="0.85" />

            {/* Asfalto / matriz de adoquines */}
            <path d="M 0 22 L 640 22 L 640 42 L 0 42 Z" fill="#0f172a" opacity="0.95" />
            <path d="M 0 22 L 640 22" stroke="#334155" strokeWidth="1.5" strokeDasharray="8 8" />

            <text x="320" y="15" fill="#f8fafc" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              TiO₂ ANATASA: Cámara ISO 22197-1: {analytics.effPct}% | Cañón Real (z=1.5m, r_a+r_b+r_c): -{analytics.realCanyonEffPct}% (v_dep={analytics.vDepCmS} cm/s)
            </text>
            <text x="320" y="34" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
              Neutralización Ca(NO₃)₂ (DRH=50.8%: {analytics.deliquescenceActive ? 'Film Húmedo Activo' : 'Fase Cristalina'}) • Selectividad S_NO₃⁻: {(analytics.selectivitySNo3 * 100).toFixed(1)}% • Da: {analytics.damkohlerDa}
            </text>

            {/* Gotas de Lluvia Animadas (Lavado Pluvial) */}
            <g id="rain-wash" opacity={rh > 40 ? 1 : 0.3}>
              <path d="M 420 0 L 415 12" fill="none" stroke="#60a5fa" strokeWidth="1.5" className="rain-anim" style={{ animationDelay: '0.1s' }} />
              <path d="M 460 -10 L 455 2" fill="none" stroke="#93c5fd" strokeWidth="1.2" className="rain-anim" style={{ animationDelay: '0.4s' }} />
              <path d="M 500 -5 L 495 7" fill="none" stroke="#60a5fa" strokeWidth="1.5" className="rain-anim" style={{ animationDelay: '0.7s' }} />
              <path d="M 540 0 L 535 12" fill="none" stroke="#3b82f6" strokeWidth="2" className="rain-anim" style={{ animationDelay: '0.2s' }} />
              <path d="M 580 -12 L 575 0" fill="none" stroke="#93c5fd" strokeWidth="1.2" className="rain-anim" style={{ animationDelay: '0.9s' }} />
            </g>

            {/* Marcadores de Concentración Inicial y Final */}
            <text x="10" y="15" fill="#fecdd3" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
              NOₓ in: {noxInput} µg/m³
            </text>
            <text x="630" y="15" fill="#cffafe" fontSize="8.5" fontWeight="bold" textAnchor="end" fontFamily="monospace">
              ISO out: {analytics.finalNox} µg/m³
            </text>
          </g>

          {/* ========================================================= */}
          {/* 6. HUD CORE: INDICADOR DE EFICIENCIA CUÁNTICA Y KINETICS  */}
          {/* ========================================================= */}
          <g transform="translate(685, 175)">
            <circle cx="0" cy="0" r="68" fill="#064e3b" stroke="#10b981" strokeWidth="2" filter="url(#glow-superoxide-filter)" opacity="0.95" />
            <circle cx="0" cy="0" r="60" fill="#022c22" stroke="#059669" strokeWidth="1" strokeDasharray="4 4" />

            <text x="0" y="-36" fill="#a7f3d0" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              CÁMARA ISO / CAÑÓN z=1.5m
            </text>
            <text x="0" y="-12" fill="#ecfdf5" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {analytics.effPct}% / -{analytics.realCanyonEffPct}%
            </text>
            <text x="0" y="4" fill="#6ee7b7" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              Da={analytics.damkohlerDa} • v_d={analytics.vDepCmS} cm/s
            </text>

            <line x1="-40" y1="12" x2="40" y2="12" stroke="#047857" strokeWidth="1" />

            <text x="0" y="24" fill="#cbd5e1" fontSize="7.5" textAnchor="middle" fontFamily="monospace">
              r_LH: {analytics.r_LH} µg/m²s
            </text>
            <text x="0" y="36" fill="#34d399" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              S_NO₃⁻: {(analytics.selectivitySNo3 * 100).toFixed(1)}%
            </text>
            <text x="0" y="48" fill="#fde68a" fontSize="7" textAnchor="middle" fontFamily="monospace">
              r_a+r_b: {(analytics.raSm + analytics.rbSm).toFixed(0)} | r_c: {analytics.rcTio2Sm.toFixed(0)} s/m
            </text>
          </g>
        </svg>

        {/* ----------------------------------------------------------- */}
        {/* OVERLAY FLOTANTE PARA HOVERS DEL SVG                        */}
        {/* ----------------------------------------------------------- */}
        {hoveredSvgElement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-2 right-2 max-w-xs bg-slate-950/95 border border-cyan-500/70 p-3 rounded-lg shadow-2xl backdrop-blur-md text-xs font-mono z-20"
          >
            {hoveredSvgElement === 'photons' && (
              <div>
                <span className="font-bold text-amber-400 text-xs block border-b border-amber-900/50 pb-1 mb-1">
                  Fotones Solares UV-A Incidentes:
                </span>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  Flujo de irradiancia <strong className="text-amber-200">{uvA} W/m²</strong> (315-400 nm). La energía del fotón (hν ≥ 3.20 eV) excita los electrones desde la banda de valencia de la anatasa, superando la barrera del band gap.
                </p>
              </div>
            )}
            {hoveredSvgElement === 'cb' && (
              <div>
                <span className="font-bold text-sky-400 text-xs block border-b border-sky-900/50 pb-1 mb-1">
                  Banda de Conducción (e⁻_cb, -0.52 V):
                </span>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  Electrones móviles con alto potencial termodinámico reductor. Son atrapados por el oxígeno molecular atmosférico para formar aniones superóxido (•O₂⁻), frenando la aniquilación de pares.
                </p>
              </div>
            )}
            {hoveredSvgElement === 'vb' && (
              <div>
                <span className="font-bold text-rose-400 text-xs block border-b border-rose-900/50 pb-1 mb-1">
                  Banda de Valencia (h⁺_vb, +2.68 V):
                </span>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  Vacantes electrónicas altamente oxidantes (+2.68 V vs NHE). Arrancan electrones del agua ambiental o grupos Ti-OH para liberar radicales hidroxilo (•OH).
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. VISTA SECUNDARIA SEGÚN PESTAÑA SELECCIONADA                */}
      {/* ------------------------------------------------------------- */}

      {/* MODO ROS_MATRIX: INSPECTOR DE ESPECIES REACTIVAS DE OXÍGENO */}
      {diagramMode === 'ros_matrix' && (
        <div className="bg-slate-950 p-3.5 border border-rose-950 rounded space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-rose-300 text-xs flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" /> Matriz Termodinámica de Especies Reactivas de Oxígeno (ROS)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Selecciona cualquier especie para inspeccionar su reactividad cuántica
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {ROS_SPECIES_LIST.map((ros) => {
              const isSelected = currentRosDisplay.id === ros.id;
              return (
                <button
                  key={ros.id}
                  onClick={() => setSelectedRos(ros)}
                  onMouseEnter={() => setHoveredRos(ros)}
                  onMouseLeave={() => setHoveredRos(null)}
                  className={`p-2 rounded border text-left transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)] text-slate-100'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[9px] mb-1">
                    <span className="font-bold font-mono" style={{ color: ros.color }}>
                      {ros.formula}
                    </span>
                    <span className="text-[8px] font-mono text-slate-400">
                      {ros.redoxPotentialV > 0 ? `+${ros.redoxPotentialV}` : ros.redoxPotentialV} V
                    </span>
                  </div>
                  <div className="text-[10px] font-bold truncate text-slate-200">{ros.name}</div>
                  <div className="text-[8px] text-slate-500 font-mono mt-0.5">{ros.halfLife}</div>
                </button>
              );
            })}
          </div>

          {/* Tarjeta de Detalle Cuántico del ROS */}
          <motion.div
            key={currentRosDisplay.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 bg-slate-900/90 border border-slate-800 rounded text-xs space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold font-mono" style={{ color: currentRosDisplay.color }}>
                  {currentRosDisplay.formula} · {currentRosDisplay.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-950 rounded border border-slate-800 font-mono text-slate-300">
                  E° = {currentRosDisplay.redoxPotentialV > 0 ? `+${currentRosDisplay.redoxPotentialV}` : currentRosDisplay.redoxPotentialV} V vs NHE
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                τ ≈ {currentRosDisplay.halfLife} · Radio difusión: {currentRosDisplay.diffusionRadiusNm}
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              {currentRosDisplay.role}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <span className="text-slate-500 uppercase block font-bold mb-1">Mecanismo de Generación:</span>
                <code className="text-cyan-300 font-bold block">{currentRosDisplay.formationReaction}</code>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <span className="text-slate-500 uppercase block font-bold mb-1">Ataque a Óxidos de Nitrógeno:</span>
                <code className="text-emerald-300 font-bold block">{currentRosDisplay.targetReaction}</code>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODO LH_CURVE: GRÁFICO ANALÍTICO INTERACTIVO r vs C_NO */}
      {diagramMode === 'lh_curve' && (
        <div className="bg-slate-950 p-3.5 border border-emerald-950 rounded space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-emerald-300 text-xs flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Isoterma Cinética de Langmuir-Hinshelwood r vs C_NO
            </span>
            <span className="text-[10px] text-emerald-400/80 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">
              r = (k_eff · K_ads · C) / (1 + K_ads · C)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="md:col-span-2 bg-[#020617] p-3 border border-slate-800 rounded relative h-48 flex flex-col justify-end">
              {/* Gráfico SVG en miniatura */}
              <svg viewBox="0 0 400 160" className="w-full h-full overflow-visible">
                {/* Ejes */}
                <line x1="40" y1="10" x2="40" y2="135" stroke="#475569" strokeWidth="1.5" />
                <line x1="40" y1="135" x2="380" y2="135" stroke="#475569" strokeWidth="1.5" />

                <text x="35" y="15" fill="#64748b" fontSize="8" textAnchor="end">r [µg/m²s]</text>
                <text x="380" y="147" fill="#64748b" fontSize="8" textAnchor="end">C_NO [µg/m³]</text>

                {/* Marcadores */}
                <text x="40" y="147" fill="#64748b" fontSize="8" textAnchor="middle">0</text>
                <text x="200" y="147" fill="#64748b" fontSize="8" textAnchor="middle">100</text>
                <text x="360" y="147" fill="#64748b" fontSize="8" textAnchor="middle">200</text>

                {/* Trazado de la curva LH */}
                {(() => {
                  const maxR = analytics.k_eff * 1.05 || 1;
                  const scaleX = (c: number) => 40 + (c / 200) * 320;
                  const scaleY = (r: number) => 135 - (r / maxR) * 115;
                  const pathD = lhCurvePoints
                    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(pt.c)} ${scaleY(pt.r)}`)
                    .join(' ');

                  const curX = scaleX(noxInput);
                  const curY = scaleY(analytics.r_LH);

                  return (
                    <>
                      <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" />
                      {/* Punto de operación actual */}
                      <circle cx={curX} cy={curY} r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                      <line x1={curX} y1="135" x2={curX} y2={curY} stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2" />
                      <line x1="40" y1={curY} x2={curX} y2={curY} stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2" />
                      <text x={curX + 6} y={curY - 6} fill="#fecdd3" fontSize="8.5" fontWeight="bold">
                        Punto Op. ({noxInput} µg/m³, {analytics.r_LH} µg/m²s)
                      </text>
                    </>
                  );
                })()}
              </svg>
            </div>

            <div className="bg-slate-900/80 p-3 border border-slate-800 rounded space-y-2 text-[11px]">
              <span className="font-bold text-slate-200 block border-b border-slate-800 pb-1 text-xs">
                Regímenes de la Cinética LH:
              </span>
              <div className="space-y-1 text-slate-400">
                <p>
                  <strong className="text-emerald-300">1. Régimen de 1.ᵉʳ Orden:</strong> A bajas concentraciones (K·C ≪ 1), la tasa r crece linealmente con la concentración de NO.
                </p>
                <p>
                  <strong className="text-amber-300">2. Régimen de Orden Cero:</strong> A altas concentraciones (K·C ≫ 1), los sitios activos de TiO₂ se saturan por completo y la tasa tiende a su ainsi máxima k_eff = <strong className="text-cyan-300">{analytics.k_eff} µg/m²s</strong>.
                </p>
                <p>
                  <strong className="text-rose-300">Recubrimiento Actual:</strong> θ_NO = {(analytics.theta_NO * 100).toFixed(1)}% de sitios activos ocupados.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. PIE CIENTÍFICO NORMATIVO Y TRAZABILIDAD                      */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
        <div className="p-2 bg-slate-950/80 border border-slate-800 rounded">
          <span className="text-[9px] text-slate-400 block">LEY 3 RESISTENCIAS (r_a+r_b+r_c)</span>
          <strong className="text-cyan-400 text-xs">v_dep = {analytics.vDepCmS} cm/s • Da = {analytics.damkohlerDa}</strong>
        </div>
        <div className="p-2 bg-slate-950/80 border border-slate-800 rounded">
          <span className="text-[9px] text-slate-400 block">FLUJO DE •OH & SELECTIVIDAD S_NO₃⁻</span>
          <strong className="text-rose-400 text-xs">{analytics.ohRadicalFlux} µmol/m²s • S={(analytics.selectivitySNo3 * 100).toFixed(1)}%</strong>
        </div>
        <div className="p-2 bg-slate-950/80 border border-slate-800 rounded">
          <span className="text-[9px] text-slate-400 block">CÁMARA ISO vs CAÑÓN REAL (z=1.5m)</span>
          <strong className="text-emerald-400 text-xs">ISO: {analytics.effPct}% | Calle: -{analytics.realCanyonEffPct}%</strong>
        </div>
        <div className="p-2 bg-slate-950/80 border border-slate-800 rounded">
          <span className="text-[9px] text-slate-400 block">MATRIZ Ca(NO₃)₂ (DRH = 50.8%)</span>
          <strong className="text-teal-300 text-xs">{analytics.deliquescenceActive ? 'DELICUESCENTE (Lavado IC)' : 'FASE SÓLIDA (Cromatografía IC)'}</strong>
        </div>
      </div>
    </div>
  );
};
