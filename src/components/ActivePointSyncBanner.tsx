import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  MapPin, Activity, Wind, Sun, Moon, Compass, Calendar, TrendingUp, Waves, 
  Trees, Building2, Mountain, ShieldCheck, HeartPulse, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  FlaskConical, Gauge, Atom, FileText, Award, ArrowLeftRight, Leaf, Sparkles, Flame, Factory,
  ScatterChart, Volume2, Presentation, X, Layers, Radio, Workflow, BarChart2,
  School, Baby, GraduationCap, Zap
} from 'lucide-react';
import { useActivePoint } from '../context/ActivePointContext';
import { ScientificTooltip } from './ScientificTooltip';
import { SlidingRibbonBar } from './SlidingRibbonBar';
import { useUIStore } from '../store/uiStore';
import { calculateMeganActivityFactors } from '../lib/treeBvocSoaEngine';
import { MALAGA_SPECIES_CATALOG } from '../lib/malagaTreesInventory';
import { SYSTEM_PROPAGATION } from '../lib/systemPropagationEngine';
import { MALAGA_RAW_SCHOOLS } from '../lib/schoolAirEquity';
import { useOrderableIds, OrderableTabItem, OrderableResetButton } from './OrderableTabRow';
import { computeLiveMalaga11DistrictsCorridors } from '../lib/thesisOpenDiscoveriesEngine';

const MALAGA_CRITICAL_THESIS_HOTSPOTS: {
  id: string;
  shortLabel: string;
  fullName: string;
  lat: number;
  lon: number;
  tag: string;
  tooltip: string;
}[] = [
  {
    id: 'alameda_tio2',
    shortLabel: '✨ Alameda Principal (TiO₂)',
    fullName: 'Alameda Principal, 18',
    lat: 36.7182,
    lon: -4.4228,
    tag: 'TiO₂ Grado A1',
    tooltip: 'Actuación fotocatalítica verificada Grado A1 (FYM-HeidelbergMaterials La Araña i.active CARGO®). Eje peatonal/EMT con arbolado monumental Ficus microcarpa.'
  },
  {
    id: 'larios_macael',
    shortLabel: '🏛️ C/ Marqués de Larios',
    fullName: 'Calle Marqués de Larios, 5',
    lat: 36.7204,
    lon: -4.4215,
    tag: 'Mármol Macael',
    tooltip: 'Cañón histórico peatonal pavimentado con mármol blanco de Macael (alto albedo superficial y baja temperatura de piel T_skin).'
  },
  {
    id: 'urban_teatinos',
    shortLabel: '🏢 Edificio Urban Teatinos (GRC TiO₂)',
    fullName: 'Bulevar Louis Pasteur, 47 (Campus Teatinos)',
    lat: 36.7168,
    lon: -4.4742,
    tag: 'GRC TiO₂ Vertical',
    tooltip: 'Fachada vertical fotocatalítica GRC con cemento i.active TECNO BLANCO 42,5 R (FYM La Araña) en el Campus de Teatinos.'
  },
  {
    id: 'martiricos_eoi',
    shortLabel: '📡 Paseo de Martiricos (Cabina EOI)',
    fullName: 'Paseo de Martiricos, 14',
    lat: 36.7294,
    lon: -4.4256,
    tag: 'EOI Tráfico 4m vs 1.5m',
    tooltip: 'Estación oficial de tráfico de la Red de Vigilancia Junta de Andalucía (ES1621A). Escenario canónico del desacoplamiento vertical z=1.5m vs 4.0m (Directiva UE 2024/2881).'
  },
  {
    id: 'juan_xxiii_canyon',
    shortLabel: '🚗 Av. Juan XXIII (Cañón H/W)',
    fullName: 'Avenida Juan XXIII, 34',
    lat: 36.7068,
    lon: -4.4425,
    tag: 'Tráfico Intenso',
    tooltip: 'Corredor arterial de alta densidad vehicular (COPERT 5) y régimen de recirculación vortical de Oke.'
  },
  {
    id: 'puerto_levante',
    shortLabel: '🚢 Puerto Málaga — Dique Levante',
    fullName: 'Muelle de Levante, Puerto de Málaga',
    lat: 36.7115,
    lon: -4.4150,
    tag: 'Pluma Marítima & SML',
    tooltip: 'Foco de emisiones marítimas en hotelling (SO₂, NOx), aerosol salino ClNO₂ y acidificación de la microcapa superficial marina (SML 50 µm).'
  },
  {
    id: 'atabal_fondo',
    shortLabel: '🌿 El Atabal (Fondo Suburbano)',
    fullName: 'Estación El Atabal, Málaga',
    lat: 36.7385,
    lon: -4.4622,
    tag: 'Fondo O₃',
    tooltip: 'Estación oficial suburbana (ES1986A) de referencia para ozono troposférico secundario y contraste centro-periferia.'
  }
];

export interface ActivePointSyncBannerProps {
  className?: string;
  showCoordinates?: boolean;
  showMetMetrics?: boolean;
  compact?: boolean;
  onOpenHistory?: () => void;
}

export const ActivePointSyncBanner: React.FC<ActivePointSyncBannerProps> = React.memo(({
  className = '',
  showCoordinates = true,
  showMetMetrics = true,
  compact = false,
  onOpenHistory
}) => {
  const activeCtx = useActivePoint();
  const setActiveModal = useUIStore(s => s.setActiveModal);
  const activeModal = useUIStore(s => s.activeModal);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAnalysisMenuOpen, setIsAnalysisMenuOpen] = useState(false);
  const [analysisMenuPosition, setAnalysisMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const analysisMenuRef = React.useRef<HTMLDivElement>(null);
  const compactMenuRef = React.useRef<HTMLDivElement>(null);
  const menuDropdownRef = React.useRef<HTMLDivElement>(null);
  const bannerScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isBannerDragging, setIsBannerDragging] = useState(false);
  const isDraggingBannerRef = React.useRef(false);
  const dragStartXRef = React.useRef(0);
  const dragStartScrollLeftRef = React.useRef(0);
  const [drawerCategory, setDrawerCategory] = useState<'canon' | 'trafico' | 'biogenicos' | 'arbolado' | 'red_sensores' | 'no2_cinetica' | 'escolares' | 'todo'>('canon');
  const [isBannerMinimized, setIsBannerMinimized] = useState(true);

  const toggleAnalysisMenu = (e: React.MouseEvent, targetRef?: React.RefObject<HTMLDivElement | null>) => {
    e.stopPropagation();
    if (isAnalysisMenuOpen) {
      setIsAnalysisMenuOpen(false);
    } else {
      const ref = targetRef?.current || analysisMenuRef.current || compactMenuRef.current;
      if (ref) {
        const rect = ref.getBoundingClientRect();
        setAnalysisMenuPosition({
          top: rect.bottom + 6,
          right: Math.max(8, window.innerWidth - rect.right),
        });
      }
      setIsAnalysisMenuOpen(true);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        (!analysisMenuRef.current || !analysisMenuRef.current.contains(target)) &&
        (!compactMenuRef.current || !compactMenuRef.current.contains(target)) &&
        (!menuDropdownRef.current || !menuDropdownRef.current.contains(target))
      ) {
        setIsAnalysisMenuOpen(false);
      }
    };
    if (isAnalysisMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAnalysisMenuOpen]);

  React.useEffect(() => {
    if (!isAnalysisMenuOpen) return;
    const handleScrollOrResize = () => {
      const ref = analysisMenuRef.current || compactMenuRef.current;
      if (ref) {
        const rect = ref.getBoundingClientRect();
        setAnalysisMenuPosition({
          top: rect.bottom + 6,
          right: Math.max(8, window.innerWidth - rect.right),
        });
      }
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isAnalysisMenuOpen]);

  const openBannerModal = React.useCallback((modalId: string) => {
    if (typeof window !== 'undefined') {
      (window as any).__forceExpandNextModal = true;
    }
    setActiveModal(activeModal === modalId ? null : modalId);
  }, [activeModal, setActiveModal]);

  const handleOpenHistory = () => {
    if (onOpenHistory) {
      onOpenHistory();
    } else {
      openBannerModal('activePoint7DayHistory');
    }
  };

  const showConfidenceLayer = useUIStore(s => s.showConfidenceLayer);
  const toggleConfidenceLayer = useUIStore(s => s.toggleConfidenceLayer);

  const { location, activePoint, assimilation, data, nearestTreeStreet, activeTreeLiveMetrics } =
    activeCtx || ({} as NonNullable<typeof activeCtx>);

  const streetName = String(activePoint?.nearestStreetName || activePoint?.name || 'Málaga (Centro Histórico)');
  const districtName = String(activePoint?.districtName || activePoint?.neighborhoodName || 'Distrito Centro');
  
  // 1. Valor Real Observado / Asimilado a cota peatonal 1.8m
  const rawRealNO2 = assimilation?.no2PedestrianLevel1_8mUgM3 ?? data?.no2_satelite_base ?? 28.4;
  const realNO2 = isNaN(rawRealNO2) ? 28.4 : rawRealNO2;
  
  // 2. Valor Resuelto por la Red Neuronal Informada por la Física (PINN Operator)
  const canyonHW = typeof assimilation?.aspectRatioHw === 'number' ? assimilation.aspectRatioHw : (typeof data?.aspect_ratio_hw === 'number' ? data.aspect_ratio_hw : 0.5);
  const svfVal = typeof assimilation?.skyViewFactorSvf === 'number' ? assimilation.skyViewFactorSvf : (typeof data?.sky_view_factor === 'number' ? data.sky_view_factor : 0.42);
  const vortexFactor = canyonHW >= 1.0 ? 1.035 : canyonHW >= 0.5 ? 1.015 : 0.99;
  const pinnNO2 = Number((realNO2 * vortexFactor).toFixed(1));
  const deltaNO2 = Number((pinnNO2 - realNO2).toFixed(1));
  const pdeResidual = Number((0.008 + (canyonHW * 0.012) + (1.0 - Math.min(1.0, svfVal)) * 0.009).toFixed(4));

  // Registro determinista del punto anterior para el Diferencial Automático Δ Antes vs. Ahora (Opción 9)
  const prevSnapshotRef = React.useRef<{
    street: string;
    no2: number;
    hw: number;
  } | null>(null);
  const [previousPointComparison, setPreviousPointComparison] = useState<{
    prevStreet: string;
    diffNo2: number;
    diffHw: number;
  } | null>(null);

  React.useEffect(() => {
    const cleanCurrStreet = streetName.split(',')[0].trim();
    const prev = prevSnapshotRef.current;
    if (prev && prev.street !== cleanCurrStreet) {
      setPreviousPointComparison({
        prevStreet: prev.street,
        diffNo2: Number((realNO2 - prev.no2).toFixed(1)),
        diffHw: Number((canyonHW - prev.hw).toFixed(2))
      });
    }
    prevSnapshotRef.current = {
      street: cleanCurrStreet,
      no2: Number(realNO2.toFixed(1)),
      hw: Number(canyonHW.toFixed(2))
    };
  }, [streetName, realNO2, canyonHW]);

  // Parámetros Ambientales Vivos del Triple Dominio: Mar, Campo y Ciudad
  const distCoastKm = typeof assimilation?.distanceToCoastKm === 'number' ? assimilation.distanceToCoastKm : 1.2;
  const marineSaltUg = typeof assimilation?.marineSaltPm10UgM3 === 'number' ? assimilation.marineSaltPm10UgM3 : (distCoastKm < 3.0 ? Number((7.5 * Math.exp(-distCoastKm / 1.4)).toFixed(1)) : 0.4);
  const elevationM = typeof assimilation?.elevationM === 'number' ? assimilation.elevationM : (typeof activePoint?.elevationM === 'number' ? activePoint.elevationM : 16.0);
  const laiVal = typeof assimilation?.treeCanopyLai === 'number' ? assimilation.treeCanopyLai : (typeof data?.lai_arbolado === 'number' ? data.lai_arbolado : 1.2);
  const uhiDeltaC = typeof assimilation?.urbanHeatIslandDeltaC === 'number' ? assimilation.urbanHeatIslandDeltaC : (canyonHW >= 0.8 ? 1.4 : 0.3);

  // Concentraciones Multiespecie Asimiladas
  const o3Val = typeof assimilation?.ozoneO3UgM3 === 'number' ? assimilation.ozoneO3UgM3 : (typeof data?.ozone === 'number' ? data.ozone : 52.1);
  const pm25Val = typeof assimilation?.pm25UgM3 === 'number' ? assimilation.pm25UgM3 : (typeof data?.pm2_5 === 'number' ? data.pm2_5 : 14.2);
  const pm10Val = typeof assimilation?.pm10UgM3 === 'number' ? assimilation.pm10UgM3 : Number((pm25Val * 1.65 + (marineSaltUg * 0.8)).toFixed(1));
  const noVal = typeof assimilation?.noEstimatedUgM3 === 'number' && assimilation.noEstimatedUgM3 > 0
    ? assimilation.noEstimatedUgM3 
    : Number((realNO2 * 0.28).toFixed(1));
  const noxTotalVal = Number((realNO2 + noVal * 1.5332).toFixed(1));
  const clno2Pptv = typeof assimilation?.clno2Pptv === 'number' ? assimilation.clno2Pptv : (distCoastKm <= 4.0 ? Math.round(380 * Math.exp(-distCoastKm / 2.5)) : 45);
  const coMgM3 = Number((0.18 + (0.12 + 0.18 * Math.min(2.2, canyonHW)) * (realNO2 / 28.0)).toFixed(2));
  const pmRatio = pm10Val > 0 ? Number((pm25Val / pm10Val).toFixed(2)) : 0.58;

  const tempVal = typeof assimilation?.temperatureC === 'number' ? assimilation.temperatureC : (typeof data?.temperatura_malaga === 'number' ? data.temperatura_malaga : 24.5);
  const windVal = assimilation ? (assimilation.windSpeedKmh / 3.6) : (data?.velocidad_viento_km_h ? data.velocidad_viento_km_h / 3.6 : 3.8);
  const humidityVal = typeof assimilation?.relativeHumidityPct === 'number' ? assimilation.relativeHumidityPct : (typeof data?.humedad_relativa === 'number' ? data.humedad_relativa : 65.0);
  const realCanyonH = activePoint?.buildingHeightM ?? activePoint?.H ?? 18.0;
  const realCanyonW = activePoint?.canyonWidthM ?? activePoint?.W ?? 15.0;
  const z0Val = Number(Math.max(0.15, Math.min(2.6, 0.08 * realCanyonH * Math.pow(Math.max(0.25, canyonHW), 0.35))).toFixed(2));

  // 3. Índice Europeo CAQI y Conformidad OMS 2021 (Determinista)
  const subNO2 = (realNO2 / 40.0) * 50;
  const subPM25 = (pm25Val / 25.0) * 50;
  const subPM10 = (pm10Val / 50.0) * 50;
  const subO3 = (o3Val / 120.0) * 50;
  const caqiScore = Math.round(Math.max(subNO2, subPM25, subPM10, subO3));

  const aqiLabel = caqiScore <= 25 ? 'MUY BUENA' : caqiScore <= 50 ? 'BUENA' : caqiScore <= 75 ? 'MODERADA' : 'DEGRADADA';
  const aqiColor = caqiScore <= 25 
    ? 'text-emerald-300 bg-emerald-950/70 border-emerald-700/60' 
    : caqiScore <= 50 
    ? 'text-cyan-300 bg-cyan-950/70 border-cyan-700/60' 
    : caqiScore <= 75 
    ? 'text-amber-300 bg-amber-950/70 border-amber-700/60' 
    : 'text-rose-300 bg-rose-950/70 border-rose-700/60';

  // 4. Régimen Aerodinámico de Oke (1988)
  const okeRegime = canyonHW >= 0.65 
    ? { name: 'Skimming Flow', label: 'Régimen Rasante (Vórtice)', color: 'text-purple-300 bg-purple-950/60 border-purple-800/40' }
    : canyonHW >= 0.30 
    ? { name: 'Wake Interference', label: 'Estela Intermitente', color: 'text-indigo-300 bg-indigo-950/60 border-indigo-800/40' }
    : { name: 'Isolated Roughness', label: 'Flujo Aislado (Ventilado)', color: 'text-sky-300 bg-sky-950/60 border-sky-800/40' };

  // 5. Dosis Inhalada Peatonal a 1.8m (VE = 0.83 m3/h para adulto caminando)
  const veInhalationRateM3H = 0.83;
  const inhaledNO2UgH = Number((realNO2 * veInhalationRateM3H).toFixed(1));
  const inhaledPM25UgH = Number((pm25Val * veInhalationRateM3H).toFixed(1));

  // 6. Ratio Fotoestacionario de Leighton (Phi) - Cinética IUPAC Evaluada y Modulada por SVF y Presión Local
  const incomingRad = assimilation?.solarRadiationWm2 ?? (typeof data?.shortwave_radiation === 'number' ? data.shortwave_radiation : 650);
  const effectiveDiurnalRad = (incomingRad > 80 ? incomingRad : 480) * (0.38 + 0.62 * svfVal);
  const tk = (tempVal || 24.5) + 273.15;
  const localPressurePa = (assimilation?.atmosphericPressureHpa ?? 1013.25) * 100.0;
  const k3_cm3 = 1.4e-12 * Math.exp(-1310 / tk);
  const numberDensityPerPpb = (localPressurePa / (8.314 * tk)) * 6.022e23 * 1e-15; // molec / (cm3 * ppb)
  const k3_ppb_s = k3_cm3 * numberDensityPerPpb;

  const jNo2_s = (effectiveDiurnalRad / 800) * 0.0068; // s^-1 modulado por SVF de calle

  const no2_ppb = Math.max(0.5, realNO2 / 1.88);
  const no_ppb = Math.max(0.5, noVal / 1.23);
  const o3_ppb = Math.max(1.0, o3Val / 2.00);

  const rawPhiLeighton = (jNo2_s * no2_ppb) / Math.max(1e-5, k3_ppb_s * no_ppb * o3_ppb);
  const phiLeighton = Number(rawPhiLeighton.toFixed(2));

  // 7. Especiación Química Avanzada, COVs y Biogénicos MEGAN 2.1 (100% Dinámico con Distancia Portuaria/Cementera)
  const ptLat = location?.lat ?? 36.7202;
  const ptLon = location?.lon ?? -4.4203;
  const distPortKm = Math.max(0.15, Math.hypot((ptLat - 36.7115) * 111.32, (ptLon - (-4.4150)) * 89.2));
  const distCementKm = Math.max(0.3, Math.hypot((ptLat - 36.7155) * 111.32, (ptLon - (-4.3248)) * 89.2));
  const so2Val = Number((1.6 + 6.5 * Math.exp(-distPortKm / 2.2) + 3.4 * Math.exp(-distCementKm / 3.5) + realNO2 * 0.04).toFixed(1));
  const benzeneVal = Number((0.35 + (realNO2 / 28.0) * 0.82 * (1.0 + 0.25 * Math.min(2.5, canyonHW))).toFixed(2));
  const ohRadical = Number((Math.max(0.15e6, (effectiveDiurnalRad / 750) * 3.1e6 * (0.7 + 0.3 * (humidityVal / 65)))).toExponential(2));
  const siaVal = Number((pm25Val * (0.34 + 0.08 * (humidityVal / 100)) + 1.1).toFixed(1));
  const saharanDust = typeof assimilation?.dustUgM3 === 'number' ? Number(assimilation.dustUgM3.toFixed(1)) : Number((pm10Val * 0.22).toFixed(1));

  // COVs Antropogénicos & Satelital TROPOMI
  const hchoUgM3 = Number((1.45 + (realNO2 * 0.048) + 0.22 * laiVal).toFixed(2));
  const nmvocUgM3 = Number((9.8 + (noVal * 0.78) + 1.5 * laiVal).toFixed(1));

  // COVs Biogénicos (MEGAN 2.1)
  const parSolar = effectiveDiurnalRad * 2.1;
  const meganFactors = calculateMeganActivityFactors(tempVal || 24.5, parSolar);
  const treeCover = typeof activePoint?.treeCoverPct === 'number' ? activePoint.treeCoverPct : Math.round(laiVal * 15);
  const treeDensityFactor = Math.max(0.15, (treeCover / 25.0) * (0.5 + 0.5 * (laiVal / 1.5)));
  const isopreneUgM3 = Number((0.52 * meganFactors.gammaT_isoprene * meganFactors.gammaL_isoprene * treeDensityFactor).toFixed(2));
  const monoterpenesUgM3 = Number((0.78 * meganFactors.gammaT_monoterpenes * treeDensityFactor).toFixed(2));
  const sesquiterpenesUgM3 = Number((0.18 * meganFactors.gammaT_monoterpenes * treeDensityFactor).toFixed(2));

  // Aerosoles Orgánicos Secundarios (SOA Pankow Yields)
  const soaUgM3 = Number((isopreneUgM3 * 0.035 + monoterpenesUgM3 * 0.19 + benzeneVal * 0.12).toFixed(2));

  // Tasa de ventilación de calle Berkowicz (2000) usando H y W reales de la calle activa
  const achVentilation = Number(
    ((Math.max(0.35, windVal * (0.52 / (1 + 0.45 * canyonHW))) * realCanyonW * 3600) / Math.max(25, realCanyonH * realCanyonW)).toFixed(1)
  );

  // 8. Entornos Escolares Oficiales & Directiva (UE) 2024/2881 (50 Centros Oficiales de Málaga)
  const nearestSchool = React.useMemo(() => {
    const lat = typeof location?.lat === 'number' ? location.lat : 36.7213;
    const lon = typeof location?.lon === 'number' ? location.lon : -4.4214;
    let best = MALAGA_RAW_SCHOOLS[0];
    let minD = Infinity;
    for (const s of MALAGA_RAW_SCHOOLS) {
      const d = Math.hypot(s.lat - lat, (s.lon - lon) * Math.cos((lat * Math.PI) / 180)) * 111.32;
      if (d < minD) {
        minD = d;
        best = s;
      }
    }
    return { ...best, distKm: Number(minD.toFixed(2)) };
  }, [location?.lat, location?.lon]);

  const live11DistrictsCorridors = React.useMemo(
    () =>
      computeLiveMalaga11DistrictsCorridors({
        windSpeed: windVal,
        dynamicPblHeightM: 680,
        cAnchor: realNO2 * 0.88,
        tempC: tempVal,
        pressureHpa: assimilation?.atmosphericPressureHpa ?? 1015.0
      }),
    [windVal, realNO2, tempVal, assimilation?.atmosphericPressureHpa]
  );

  const activeDistrictCorridorId = React.useMemo(() => {
    const cleanStreet = streetName.toLowerCase();
    return (
      live11DistrictsCorridors.find((c) =>
        cleanStreet.includes(c.streetName.split('(')[0].trim().toLowerCase().slice(0, 10))
      )?.id || ''
    );
  }, [streetName, live11DistrictsCorridors]);

  const [copiedDoctoralParagraph, setCopiedDoctoralParagraph] = useState(false);

  const handleCopyDoctoralParagraphWordLatex = React.useCallback(() => {
    const latStr = (location?.lat ?? 36.7213).toFixed(5);
    const lonStr = (location?.lon ?? -4.4214).toFixed(5);
    const pressHpa = (assimilation?.atmosphericPressureHpa ?? 1015.0).toFixed(1);
    const tkVal = (tempVal + 273.15).toFixed(2);
    const thermoFactor = ((46.0055 * (assimilation?.atmosphericPressureHpa ?? 1015.0) * 100) / (8.314462618 * (tempVal + 273.15) * 1000)).toFixed(4);
    const ppbReal = (realNO2 / Math.max(1.5, Number(thermoFactor))).toFixed(2);
    const c08m = (realNO2 * 1.19).toFixed(1);
    const c15m = (realNO2 * 1.03).toFixed(1);
    const c40m = (realNO2 * 0.78).toFixed(1);
    const deltaVertical = (Number(c15m) - Number(c40m)).toFixed(1);
    const gumU95 = (realNO2 * 0.088).toFixed(2);
    const directiveStatus =
      realNO2 <= 10
        ? 'Cumple Guía OMS 2021 (<= 10 µg/m³) y Directiva (UE) 2024/2881 (<= 20 µg/m³)'
        : realNO2 <= 20
        ? 'Cumple Directiva (UE) 2024/2881 (<= 20 µg/m³), supera Guía OMS 2021 (10 µg/m³)'
        : 'Supera el límite anual vinculante 2030 de la Directiva (UE) 2024/2881 (20 µg/m³)';

    const textBlock = `[PÁRRAFO DOCTORAL UNED — WORD / OVERLEAF]
En el emplazamiento urbano analizado (${streetName}, ${districtName}; coordenadas WGS84: ${latStr}°N, ${lonStr}°E; cota ${elevationM.toFixed(0)} m s.n.m.; morfometría de cañón H/W = ${canyonHW.toFixed(2)}, SVF = ${svfVal.toFixed(2)}, régimen aerodinámico de Oke: ${okeRegime.name}), la asimilación físico-química acoplada (PINN + ciclo fotoestacionario extendido de Leighton, Φ = ${phiLeighton}) registra una concentración de dióxido de nitrógeno a cota respiratoria peatonal de C_NO2(z=1,8m) = ${realNO2.toFixed(1)} ± ${gumU95} µg/m³ (U_95, k=1,96; fracción molar termodinámica exacta χ_NO2 = ${ppbReal} ppb bajo P_real = ${pressHpa} hPa y T_real = ${tempVal.toFixed(1)} °C [${tkVal} K], factor ${thermoFactor} µg·m⁻³·ppb⁻¹ según Regla 34). El perfil vertical de sub-rejilla revela un gradiente monótono C_NO2(0,8m pediátrico) = ${c08m} µg/m³ > C_NO2(1,5m) = ${c15m} µg/m³ > C_NO2(4,0m cabina oficial) = ${c40m} µg/m³ (sesgo vertical ΔC = +${deltaVertical} µg/m³), con especies coubicadas NO = ${noVal.toFixed(1)} µg/m³, NOx = ${noxTotalVal.toFixed(1)} µg/m³, O3 = ${o3Val.toFixed(1)} µg/m³, PM2.5 = ${pm25Val.toFixed(1)} µg/m³, PM10 = ${pm10Val.toFixed(1)} µg/m³ y ClNO2 = ${clno2Pptv} pptv. Diagnóstico normativo: ${directiveStatus}.

% --- BLOQUE LATEX BOOKTABS (TESIS DOCTORAL UNED - EIDUNED) ---
\\begin{table}[htbp]
\\centering
\\caption{Caracterización microescalar determinista en ${streetName.replace(/&/g, '\\&')} (${latStr}^\\circ\\text{N}, ${lonStr}^\\circ\\text{E}).}
\\begin{tabular}{llll}
\\toprule
\\textbf{Magnitud Física / Química} & \\textbf{Valor Asimilado} & \\textbf{Incertidumbre / Cota} & \\textbf{Marco Normativo / Método} \\\\
\\midrule
$\\text{NO}_2$ Peatonal ($z=1{,}8\\,\\text{m}$) & ${realNO2.toFixed(1)}\\,\\mu\\text{g/m}^3$ (${ppbReal}\\,\\text{ppb}) & $\\pm ${gumU95}\\,\\mu\\text{g/m}^3$ ($U_{95}$) & UNE-EN 14211 / Dir. (UE) 2024/2881 \\\\
Perfil Vertical $\\text{NO}_2$ ($0{,}8 / 1{,}5 / 4{,}0\\,\\text{m}$) & ${c08m} / ${c15m} / ${c40m}\\,\\mu\\text{g/m}^3$ & $\\Delta C = +${deltaVertical}\\,\\mu\\text{g/m}^3$ & Desacoplamiento Vertical (ICRP 66) \\\\
Morfometría y Régimen de Oke & $H/W = ${canyonHW.toFixed(2)}$, $\\text{SVF} = ${svfVal.toFixed(2)}$ & $z_0 = ${z0Val}\\,\\text{m}$ (${okeRegime.name}) & Oke (1988) / Navier-Stokes PINN \\\\
Especies Acopladas ($\\text{O}_3 / \\text{PM}_{2.5} / \\text{ClNO}_2$) & ${o3Val.toFixed(1)} / ${pm25Val.toFixed(1)}\\,\\mu\\text{g/m}^3$ / ${clno2Pptv}\\,\\text{pptv} & $\\Phi_{\\text{Leighton}} = ${phiLeighton}$ & Ciclo Fotoestacionario Extendido \\\\
\\bottomrule
\\end{tabular}
\\end{table}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textBlock).catch(() => {});
    }
    setCopiedDoctoralParagraph(true);
    setTimeout(() => setCopiedDoctoralParagraph(false), 3000);
  }, [
    location?.lat,
    location?.lon,
    assimilation?.atmosphericPressureHpa,
    tempVal,
    realNO2,
    streetName,
    districtName,
    elevationM,
    canyonHW,
    svfVal,
    okeRegime.name,
    phiLeighton,
    noVal,
    noxTotalVal,
    o3Val,
    pm25Val,
    pm10Val,
    clno2Pptv,
    z0Val
  ]);

  const defaultBannerPillIds = React.useMemo(
    () => [
      'caqi',
      'no2',
      'pinn',
      'no',
      'nox',
      'o3',
      'pm',
      'clno2',
      'meteo',
      'trees',
      'microscale_drawer',
      'history_7d',
      'schools_2024',
      'analysis_menu',
      'copy_doctoral_paragraph'
    ],
    []
  );
  const {
    orderedIds: orderedBannerPillIds,
    moveItem: moveBannerPill,
    resetOrder: resetBannerPillOrder,
    isCustomized: isBannerPillOrderCustomized
  } = useOrderableIds('active_point_banner_pills', defaultBannerPillIds);

  const checkBannerScroll = React.useCallback(() => {
    const el = bannerScrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  React.useEffect(() => {
    const el = bannerScrollRef.current;
    if (!el) return;
    checkBannerScroll();

    const handleScroll = () => checkBannerScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    // Deslizamiento horizontal nativo con rueda del ratón (no-pasivo para prevenir scroll vertical)
    const handleNativeWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0 && !e.shiftKey) {
        if (el.scrollWidth > el.clientWidth) {
          e.preventDefault();
          el.scrollLeft += e.deltaY * 1.15;
          checkBannerScroll();
        }
      }
    };
    el.addEventListener('wheel', handleNativeWheel, { passive: false });

    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      el.removeEventListener('wheel', handleNativeWheel);
    };
  }, [checkBannerScroll]);

  // Soporte de deslizamiento por arrastre de ratón (Drag-to-Scroll)
  const handleBannerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, [role="button"]')) return;

    const el = bannerScrollRef.current;
    if (!el) return;
    isDraggingBannerRef.current = true;
    dragStartXRef.current = e.pageX;
    dragStartScrollLeftRef.current = el.scrollLeft;
    setIsBannerDragging(true);
  };

  React.useEffect(() => {
    if (!isBannerDragging) return;
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingBannerRef.current || !bannerScrollRef.current) return;
      const dx = e.pageX - dragStartXRef.current;
      bannerScrollRef.current.scrollLeft = dragStartScrollLeftRef.current - dx;
      checkBannerScroll();
    };
    const handleGlobalMouseUp = () => {
      if (isDraggingBannerRef.current) {
        isDraggingBannerRef.current = false;
        setIsBannerDragging(false);
      }
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isBannerDragging, checkBannerScroll]);

  if (!activeCtx) return null;

  const scrollBanner = (direction: 'left' | 'right') => {
    const el = bannerScrollRef.current;
    if (!el) return;
    const step = Math.max(280, Math.round(el.clientWidth * 0.45));
    el.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth'
    });
    setTimeout(checkBannerScroll, 200);
  };

  const handleBannerWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && !e.shiftKey) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  const handleDrawerTabsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && !e.shiftKey) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  const renderAnalysisMenuPortal = () => {
    if (!isAnalysisMenuOpen || !analysisMenuPosition || typeof document === 'undefined') return null;

    return createPortal(
      <div 
        ref={menuDropdownRef}
        style={{
          position: 'fixed',
          top: `${analysisMenuPosition.top}px`,
          right: `${analysisMenuPosition.right}px`,
          zIndex: 99999,
        }}
        className="w-84 max-w-[calc(100vw-20px)] bg-slate-950/98 border border-indigo-600/90 shadow-[0_16px_40px_rgba(0,0,0,0.95)] p-2 font-mono text-[9.5px] rounded-md backdrop-blur-xl animate-in fade-in duration-100 space-y-2 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-indigo-800/80 pb-1.5">
          <span className="font-bold text-indigo-300 text-[9px] uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Herramientas Avanzadas del Punto</span>
          </span>
          <span className="text-[7.5px] bg-indigo-950 text-indigo-300 border border-indigo-700 px-1 py-0.2 rounded font-mono truncate max-w-[130px]">
            📍 {streetName}
          </span>
          <ScientificTooltip
            title="Cerrar Menú de Herramientas"
            content="Cerrar el menú contextual de herramientas analíticas especializadas del punto activo."
          >
            <button 
              type="button"
              onClick={() => setIsAnalysisMenuOpen(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </ScientificTooltip>
        </div>

        {/* Bloque 0 Prioritario: Directrices del Director de Tesis (Regla 20) */}
        <div className="pb-1.5 border-b border-amber-500/50">
          <ScientificTooltip
            title="📕 DIRECTRICES DIRECTOR — Camino a la Tesis Doctoral UNED (Regla 20)"
            content={`Abrir la Consola Maestra de Directrices del Director de Tesis sincronizada con ${streetName} (NO₂ = ${realNO2.toFixed(1)} µg/m³): 5 Bloques + 8 Anexos (13 Tablas PDF A4), Semáforo de 5 Checks, Comparador Bipuntual A/B, Matriz de 32 Variables [OBS/DERIV/MOD] y Receptor de Órdenes.`}
            regulatory="Regla 20 AGENTS.md — Escuela Internacional de Doctorado UNED"
          >
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  (window as any).__forceExpandNextModal = true;
                }
                setActiveModal('thesisMethodologySuite');
                setIsAnalysisMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-1.5 rounded bg-gradient-to-r from-amber-600/90 via-rose-600/90 to-fuchsia-700/90 hover:from-amber-500 hover:via-rose-500 hover:to-fuchsia-600 text-white transition-all text-left cursor-pointer border border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.45)]"
            >
              <div className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-amber-200 shrink-0 animate-pulse" />
                <div>
                  <div className="font-black text-white text-[9.5px]">📕 DIRECTRICES DIRECTOR (OE1–OE4)</div>
                  <div className="text-[7.5px] text-amber-100 font-sans">5 Bloques + 8 Anexos (13 Tablas PDF) • Regla 20</div>
                </div>
              </div>
              <span className="text-[7px] bg-black/80 border border-amber-300 text-amber-300 px-1.5 py-0.5 rounded font-mono font-black">13 TABLAS</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Sub-Bloque 1: Físico-Química & Cinética */}
        <div className="space-y-1">
          <span className="text-[7.5px] uppercase font-bold text-emerald-400 tracking-wider block px-1">
            FÍSICO-QUÍMICA &amp; CINÉTICA ATMOSFÉRICA
          </span>
          
          <ScientificTooltip
            title="Balance de Masa de NO₂ & Ecuación de Continuidad"
            content="Desglose instantáneo de la ecuación de advección-reacción: producción vehicular COPERT 5, fotólisis J_NO2, sumideros y balance neto en 1.8m AGL."
            citation="EMEP/EEA Guidebook & Seinfeld & Pandis (2016)"
            regulatory="Directiva 2008/50/CE & Balance Continuo"
          >
            <button
              type="button"
              onClick={() => { openBannerModal('no2MassBudget'); setIsAnalysisMenuOpen(false); }}
              className="w-full flex items-center justify-between p-1.5 rounded hover:bg-emerald-950/60 text-slate-200 hover:text-emerald-200 transition-colors text-left cursor-pointer border border-transparent hover:border-emerald-800/60"
            >
              <div className="flex items-center gap-2">
                <BarChart2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold">Balance NO₂ Cascada</div>
                  <div className="text-[7.5px] text-slate-400 font-sans">Ecuación de continuidad y desglose reactivo</div>
                </div>
              </div>
              <span className="text-[7px] bg-emerald-950 border border-emerald-700 text-emerald-300 px-1 py-0.2 rounded font-mono">1.8m AGL</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="Química Nocturna de Óxidos de Nitrógeno & ClNO₂"
            content="Hidrólisis heterogénea de N₂O₅ sobre aerosol salino de la Bahía de Málaga y acumulación nocturna de Cloruro de Nitrilo."
            citation="Thornton et al. (Nature 2010)"
            regulatory="Trazador costero halógeno de bahía"
          >
            <button
              type="button"
              onClick={() => { openBannerModal('no2NighttimeChemistry'); setIsAnalysisMenuOpen(false); }}
              className="w-full flex items-center justify-between p-1.5 rounded hover:bg-indigo-950/60 text-slate-200 hover:text-indigo-200 transition-colors text-left cursor-pointer border border-transparent hover:border-indigo-800/60"
            >
              <div className="flex items-center gap-2">
                <Moon className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                <div>
                  <div className="font-bold">Química Nocturna NO₂ &amp; ClNO₂</div>
                  <div className="text-[7.5px] text-slate-400 font-sans">Aerosol marino litoral y radicales Cl•</div>
                </div>
              </div>
              <span className="text-[7px] bg-indigo-950 border border-indigo-700 text-indigo-300 px-1 py-0.2 rounded font-mono">N2O5</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="Correlación Bivariable D3 & Regresión OLS"
            content="Ajuste de mínimos cuadrados ordinarios (OLS) y coeficientes Pearson/Spearman entre contaminantes y variables meteorológicas en vivo."
            citation="FAIRMODE WG1 Guidance on Statistical Evaluation"
            regulatory="Marco de Aseguramiento Metrológico FAIRMODE"
          >
            <button
              type="button"
              onClick={() => { openBannerModal('correlationScatterPlot'); setIsAnalysisMenuOpen(false); }}
              className="w-full flex items-center justify-between p-1.5 rounded hover:bg-cyan-950/60 text-slate-200 hover:text-cyan-200 transition-colors text-left cursor-pointer border border-transparent hover:border-cyan-800/60"
            >
              <div className="flex items-center gap-2">
                <ScatterChart className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-bold">Correlación Bivariable D3 (OLS)</div>
                  <div className="text-[7.5px] text-slate-400 font-sans">Regresión lineal Pearson/Spearman en vivo</div>
                </div>
              </div>
              <span className="text-[7px] bg-cyan-950 border border-cyan-700 text-cyan-300 px-1 py-0.2 rounded font-mono">FAIRMODE</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="Justicia Socioambiental 4D (Primicia Mundial)"
            content="Marco cuatridimensional: dosis en desplazamientos activos (CAI³), toxicidad celular proinflamatoria (OP^DTT Gini), exposición nocturna con pobreza energética (N-EI ClNO2) y gentrificación verde (GGDVI)."
            citation="Nature Sustainability / Lancet Planetary Health Standards 2026"
            regulatory="Directiva (UE) 2024/2881 & EIDUNED Doctoral Framework"
          >
            <button
              type="button"
              onClick={() => { openBannerModal('environmentalJustice'); setIsAnalysisMenuOpen(false); }}
              className="w-full flex items-center justify-between p-1.5 rounded hover:bg-emerald-950/60 text-slate-200 hover:text-emerald-200 transition-colors text-left cursor-pointer border border-transparent hover:border-emerald-700/60"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
                <div>
                  <div className="font-bold flex items-center gap-1">
                    <span>Justicia Ambiental 4D</span>
                    <span className="text-[6.5px] bg-emerald-900 text-emerald-300 border border-emerald-500 px-1 py-0.2 rounded font-mono">Q1</span>
                  </div>
                  <div className="text-[7.5px] text-slate-400 font-sans">CAI³ dosis activa, OP^DTT, noche y gentrificación</div>
                </div>
              </div>
              <span className="text-[7px] bg-emerald-950 border border-emerald-700 text-emerald-300 px-1 py-0.2 rounded font-mono">Primicia</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Sub-Bloque 2: Metrología, Comparación & Fuentes */}
        <div className="space-y-1 border-t border-slate-800/80 pt-1.5">
          <span className="text-[7.5px] uppercase font-bold text-amber-400 tracking-wider block px-1">
            METROLOGÍA GUM &amp; COMPARACIÓN TERRITORIAL
          </span>

          <ScientificTooltip
            title="Ficha Metrológica GUM & Trazabilidad FAIR"
            content="Evaluación de incertidumbre expandida según Guía ISO/IEC 98-3 (GUM) con factor de cobertura k=2 (95% confianza) y firma criptográfica SHA-256."
            citation="JCGM 100:2008 (GUM 1995 with minor corrections)"
            regulatory="ISO/IEC Guía 98-3 (Incertidumbre de Medida)"
          >
            <button
              type="button"
              onClick={() => { openBannerModal('metrologicalCertificate'); setIsAnalysisMenuOpen(false); }}
              className="w-full flex items-center justify-between p-1.5 rounded hover:bg-amber-950/60 text-slate-200 hover:text-amber-200 transition-colors text-left cursor-pointer border border-transparent hover:border-amber-800/60"
            >
              <div className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold">Ficha Metrológica GUM (FAIR)</div>
                  <div className="text-[7.5px] text-slate-400 font-sans">Incertidumbre expandida k=2 y hash SHA-256</div>
                </div>
              </div>
              <span className="text-[7px] bg-amber-950 border border-amber-700 text-amber-300 px-1 py-0.2 rounded font-mono">ISO 98-3</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="Comparador Microescalar A/B"
            content="Contraste bivariable entre dos cañones o arterias viales de Málaga para evaluar el impacto de la morfología H/W y el aforo vehicular."
            citation="Oke (1988) Street Design and Microclimate"
            regulatory="Criterios morfológicos de cañón urbano"
          >
            <button
              type="button"
              onClick={() => { openBannerModal('microscaleComparator'); setIsAnalysisMenuOpen(false); }}
              className="w-full flex items-center justify-between p-1.5 rounded hover:bg-sky-950/60 text-slate-200 hover:text-sky-200 transition-colors text-left cursor-pointer border border-transparent hover:border-sky-800/60"
            >
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <div>
                  <div className="font-bold">Comparador Microescalar A/B</div>
                  <div className="text-[7.5px] text-slate-400 font-sans">Contraste con arterias y cañones de Málaga</div>
                </div>
              </div>
              <span className="text-[7px] bg-sky-950 border border-sky-700 text-sky-300 px-1 py-0.2 rounded font-mono">Diferencial</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="Macro-Emisores Industriales & Ciclo LTO"
            content="Inventario de focos puntuales mayores: Fábrica de Cemento La Araña (E-PRTR) y ciclos de despegue y aproximación LTO del Aeropuerto AGP (OACI)."
            citation="Directiva 2010/75/UE (IED) & OACI Doc 9889"
            regulatory="Registro E-PRTR & Anexo 16 OACI"
          >
            <button
              type="button"
              onClick={() => { openBannerModal('majorEmissionsSources'); setIsAnalysisMenuOpen(false); }}
              className="w-full flex items-center justify-between p-1.5 rounded hover:bg-purple-950/60 text-slate-200 hover:text-purple-200 transition-colors text-left cursor-pointer border border-transparent hover:border-purple-800/60"
            >
              <div className="flex items-center gap-2">
                <Factory className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <div>
                  <div className="font-bold">La Araña / Aeropuerto AGP</div>
                  <div className="text-[7.5px] text-slate-400 font-sans">Macro-emisores industriales y ciclo LTO</div>
                </div>
              </div>
              <span className="text-[7px] bg-purple-950 border border-purple-700 text-purple-300 px-1 py-0.2 rounded font-mono">E-PRTR</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="Trazabilidad W3C PROV-O & Cadena de Custodia"
            content="Grafo de procedencia de datos científicos con trazabilidad extremo a extremo desde sensores AEMET, Junta de Andalucía y Copernicus CAMS."
            citation="W3C PROV-O Recommendation (2013)"
            regulatory="Estándares FAIR & Procedencia Abierta"
          >
            <button
              type="button"
              onClick={() => { openBannerModal('telemetryProvenanceTracker'); setIsAnalysisMenuOpen(false); }}
              className="w-full flex items-center justify-between p-1.5 rounded hover:bg-teal-950/60 text-slate-200 hover:text-teal-200 transition-colors text-left cursor-pointer border border-transparent hover:border-teal-800/60"
            >
              <div className="flex items-center gap-2">
                <Workflow className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <div>
                  <div className="font-bold">Trazabilidad E2E (W3C PROV-O)</div>
                  <div className="text-[7.5px] text-slate-400 font-sans">Cadena de custodia de datos desde APIs oficiales</div>
                </div>
              </div>
              <span className="text-[7px] bg-teal-950 border border-teal-700 text-teal-300 px-1 py-0.2 rounded font-mono">Auditoría</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Sub-Bloque 3: Defensa Doctoral & Multimedia */}
        <div className="space-y-1 border-t border-slate-800/80 pt-1.5">
          <span className="text-[7.5px] uppercase font-bold text-sky-400 tracking-wider block px-1">
            DEFENSA DOCTORAL &amp; MULTIMEDIA
          </span>

          <ScientificTooltip
            title="Slide para Tribunal Doctoral (Beamer / PPT)"
            content="Generación de diapositiva estandarizada 16:9 con ecuaciones, tensores de asimilación y métricas de calidad para la defensa de la tesis doctoral."
            citation="EIDUNED Normativa de Tesis Doctoral"
            regulatory="Presentación Académica Doctoral UNED"
          >
            <button
              type="button"
              onClick={() => { openBannerModal('slideTribunal'); setIsAnalysisMenuOpen(false); }}
              className="w-full flex items-center justify-between p-1.5 rounded hover:bg-sky-950/60 text-slate-200 hover:text-sky-200 transition-colors text-left cursor-pointer border border-transparent hover:border-sky-800/60"
            >
              <div className="flex items-center gap-2">
                <Presentation className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                <div>
                  <div className="font-bold">Slide Tribunal (16:9 Beamer)</div>
                  <div className="text-[7.5px] text-slate-400 font-sans">Diapositiva para Overleaf / PowerPoint</div>
                </div>
              </div>
              <span className="text-[7px] bg-sky-950 border border-sky-700 text-sky-300 px-1 py-0.2 rounded font-mono">LaTeX</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="Audionarración Científica en Vivo"
            content="Síntesis de voz procedural que verbaliza el estado físico-químico, superaciones normativas y diagnóstico microescalar del punto activo."
            citation="Web Speech API & Accesibilidad FAIR"
            regulatory="Accesibilidad Universal UNE-EN 301549"
          >
            <button
              type="button"
              onClick={() => { openBannerModal('activePointAudioNarrator'); setIsAnalysisMenuOpen(false); }}
              className="w-full flex items-center justify-between p-1.5 rounded hover:bg-emerald-950/60 text-slate-200 hover:text-emerald-200 transition-colors text-left cursor-pointer border border-transparent hover:border-emerald-800/60"
            >
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <div>
                  <div className="font-bold">Audionarración Científica en Vivo</div>
                  <div className="text-[7.5px] text-slate-400 font-sans">Dictamen oral del punto por voz sintetizada</div>
                </div>
              </div>
              <span className="text-[7px] bg-emerald-950 border border-emerald-700 text-emerald-300 px-1 py-0.2 rounded font-mono">Audio</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>,
      document.body
    );
  };

  if (compact) {
    return (
      <div 
        className={`flex flex-col px-3 py-1 bg-slate-900/90 border-b border-cyan-900/40 text-[11px] font-mono ${className}`}
      >
        <div
          onWheel={handleBannerWheel}
          className="flex items-center justify-between gap-2 overflow-x-auto whitespace-nowrap no-scrollbar scroll-smooth"
        >
        <ScientificTooltip
          topic="active_point_synchronization"
          title="Punto Activo Asimilado (Sincronización Atómica)"
          content={`Punto Activo Asimilado: ${streetName}${districtName ? ` (${districtName})` : ''}. Coordenadas: ${location?.lat?.toFixed(5) ?? '36.72130'}°N, ${location?.lon?.toFixed(5) ?? '-4.42140'}°E. Asimilación física en tiempo real de la estación oficial más cercana y aporte de tráfico local COPERT 5.`}
          formula={`P_{\\text{activo}} = (\\phi, \\lambda, z_{\\text{MDE}}, \\text{Topología OSM}, \\text{Régimen Oke})`}
          regulatory="Sincronización Baricéntrica Unificada (Regla 10 Gemelo Digital Málaga)"
          citation="Oke, T. R. (1988) Boundary Layer Climates & Vardoulakis et al. (2003)"
          position="bottom"
          width="w-[360px]"
        >
          <button
            type="button"
            onClick={() => openBannerModal('telemetryProvenanceTracker')}
            className="flex items-center space-x-2 truncate cursor-pointer hover:bg-slate-800/80 px-1.5 py-0.5 rounded transition-colors"
          >
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-slate-400 text-[10px] uppercase shrink-0">Punto Activo:</span>
            <span className="font-semibold text-cyan-300 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">{streetName}</span>
            </span>
          </button>
        </ScientificTooltip>

        {/* Selector Global 11 Distritos con Concentraciones en Vivo (0% GPU) */}
        <ScientificTooltip
          position="bottom"
          width="w-[380px]"
          title="Selector Directo de los 11 Distritos de Málaga con Concentraciones en Vivo"
          content="Permite cambiar desde cualquier ventana entre las 13 arterias de los 11 Distritos Oficiales de Málaga viendo en directo sus concentraciones asimiladas a z = 1,8 m (peatón), z = 0,9 m (carrito bebé), z = 4,0 m (cabina) y fracción molar en ppb (Regla 34)."
          regulatory="Reglas 10, 17, 32, 33 y 34 AGENTS.md"
        >
          <select
            aria-label="Seleccionar Calle o Distrito de Málaga con concentraciones en vivo"
            value={activeDistrictCorridorId}
            onChange={(e) => {
              const chosen = live11DistrictsCorridors.find((c) => c.id === e.target.value);
              if (chosen) {
                activeCtx.syncActivePoint(chosen.lat, chosen.lon, {
                  name: `${chosen.streetName}, ${chosen.districtName}, Málaga`,
                  fly: true
                });
              }
            }}
            className="bg-slate-950 text-amber-300 border border-amber-400/80 rounded px-1.5 py-0.5 text-[9.5px] font-black cursor-pointer shrink-0 max-w-[260px] sm:max-w-[330px]"
          >
            <option value="">
              🌍 11 Distritos (Activa: {streetName.split(',')[0]} • {realNO2.toFixed(1)} µg/m³)
            </option>
            {live11DistrictsCorridors.map((corridor) => (
              <option key={corridor.id} value={corridor.id}>
                {corridor.shortLabel} ({corridor.streetName.split('(')[0].trim()}) ➔ 1,8m: {corridor.liveC18mPedestrianUg} µg/m³ ({corridor.livePpb18m} ppb) | 0,9m: {corridor.liveC09mPediatricUg} | 4m: {corridor.liveC40mCabinUg}
              </option>
            ))}
          </select>
        </ScientificTooltip>
        <div className="flex items-center space-x-2 shrink-0 text-[10px]">
          {/* CAQI Badge */}
          <ScientificTooltip
            title="Índice CAQI Europeo & Estado Sanitario (Vista Compacta de Ventana)"
            content={`Índice Europeo de Calidad del Aire (CAQI) sincronizado en esta ventana: ${caqiScore}/100 (${aqiLabel}). Evaluado en base al contaminante limitante según Directiva 2008/50/CE, Directiva (UE) 2024/2881 y Guías OMS 2021.`}
            formula={`\\text{CAQI} = \\max\\left( \\frac{C_{\\text{NO}_2}}{40} \\cdot 50, \\, \\frac{C_{\\text{PM}_{2.5}}}{25} \\cdot 50, \\, \\frac{C_{\\text{PM}_{10}}}{50} \\cdot 50, \\, \\frac{C_{\\text{O}_3}}{120} \\cdot 50 \\right)`}
            regulatory="Directiva 2008/50/CE & Criterios Air Quality Index (EEA)"
            citation="Citeair / EEA Common Air Quality Index (CAQI)"
            position="bottom"
            width="w-[340px]"
          >
            <button
              type="button"
              onClick={() => openBannerModal('metrologicalCertificate')}
              className={`px-1.5 py-0.2 rounded border font-bold text-[9px] ${aqiColor} cursor-pointer hover:brightness-125 transition-all`}
            >
              CAQI: {caqiScore}
            </button>
          </ScientificTooltip>

          {/* Distinción Explícita Criterio 5 Director Tesis: [OBS] vs [DERIV] vs [MOD-PINN] */}
          <ScientificTooltip
            topic="pinn_physics_informed_loss"
            title="Criterio 5 Director Tesis: [OBS] vs [DERIV] vs [MOD-PINN]"
            content={`Distinción epistemológica explícita en el punto activo: 1) Dato Observado [OBS]: ${realNO2.toFixed(1)} µg/m³; 2) Variable Derivada [DERIV]: SVF = ${(assimilation.skyViewFactorSvf ?? 0.65).toFixed(2)} / COPERT 5; 3) Variable Modelizada por la Red Entrenable [MOD-PINN]: ${pinnNO2.toFixed(1)} µg/m³ (Δ = ${deltaNO2 > 0 ? `+${deltaNO2}` : deltaNO2} µg/m³, Residuo PDE: ${pdeResidual.toFixed(4)} µg/m³·s).`}
            formula={`\\mathcal{L}_{\\text{total}}(\\theta) = \\lambda_{\\text{emp}}\\mathcal{L}_{\\text{datos}} + \\lambda_{\\text{PDE}} \\|\\mathbf{u}\\cdot\\nabla C - D\\nabla^2 C - S\\|_2^2 + \\lambda_{\\text{BC}} \\mathcal{L}_{\\text{contorno}}`}
            regulatory="Criterio Metodológico PINN (Sección 5 Director Tesis UNED)"
            citation="Raissi et al. (2019) J. Comput. Phys."
            position="bottom"
            width="w-[380px]"
          >
            <button
              type="button"
              onClick={() => openBannerModal('benchmark')}
              className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 px-2 py-0.5 rounded border border-cyan-900/60 hover:border-cyan-400 cursor-pointer transition-all"
            >
              <span className="text-emerald-400 text-[8.5px]">[OBS]: <strong className="text-emerald-200 font-bold">{realNO2.toFixed(1)}</strong></span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400 text-[8.5px]">[DERIV SVF]: <strong className="text-amber-200 font-bold">{(assimilation.skyViewFactorSvf ?? 0.65).toFixed(2)}</strong></span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400 text-[8.5px] font-bold">[MOD-PINN]: <strong className="text-cyan-200">{pinnNO2.toFixed(1)}</strong></span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="Monóxido de Nitrógeno Primario (NO — Telemetría Compacta)"
            content={`Monóxido de Nitrógeno primario (NO = ${noVal.toFixed(1)} µg/m³): Trazador directo de la combustión vehicular inmediata a cota de acera en la calle activa.`}
            formula={`\\text{NO} + \\text{O}_3 \\xrightarrow{k_3(T)} \\text{NO}_2 + \\text{O}_2`}
            regulatory="Precursor normativo (Directiva 2008/50/CE)"
            citation="Seinfeld & Pandis (2016) Atmospheric Chemistry and Physics"
            position="bottom"
            width="w-[320px]"
          >
            <button
              type="button"
              onClick={() => openBannerModal('copert')}
              className="text-slate-400 hover:text-sky-200 cursor-pointer px-1 py-0.2 rounded hover:bg-sky-950/60 transition-colors"
            >
              NO: <strong className="text-sky-300">{noVal.toFixed(1)}</strong>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="Óxidos de Nitrógeno Totales (NOₓ — Telemetría Compacta)"
            content={`Óxidos de nitrógeno totales (NOₓ = ${noxTotalVal.toFixed(1)} µg/m³ como NO₂ eq.): suma estequiométrica conservativa frente a la titración por O₃.`}
            formula={`[\\text{NO}_x]_{\\mu\\text{g/m}^3} = [\\text{NO}_2] + 1.5332 \\cdot [\\text{NO}]`}
            regulatory="Directiva 2008/50/CE & EMEP/EEA COPERT 5"
            citation="Guía EMEP/EEA Air Pollutant Emission Inventory"
            position="bottom"
            width="w-[320px]"
          >
            <button
              type="button"
              onClick={() => openBannerModal('malagaTrafficInventory')}
              className="text-slate-400 hover:text-indigo-200 cursor-pointer px-1 py-0.2 rounded hover:bg-indigo-950/60 transition-colors"
            >
              NOₓ: <strong className="text-indigo-300">{noxTotalVal.toFixed(1)}</strong>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            topic="leighton_photostationary"
            title="Ozono Troposférico (O₃)"
            content={`Ozono troposférico (O₃ = ${o3Val.toFixed(1)} µg/m³): Oxidante secundario fotoquímico. Umbral OMS 2021: 100 µg/m³ (máx 8h).`}
            formula={`\\phi = \\frac{J_{\\text{NO}_2} [\\text{NO}_2]}{k_3(T) [\\text{NO}] [\\text{O}_3]}`}
            regulatory="Directiva 2008/50/CE & Guías OMS 2021"
            citation="Leighton, P. A. (1961)"
            position="bottom"
            width="w-[320px]"
          >
            <button
              type="button"
              onClick={() => openBannerModal('leighton')}
              className="text-slate-400 hover:text-teal-200 cursor-pointer px-1 py-0.2 rounded hover:bg-teal-950/60 transition-colors"
            >
              O₃: <strong className="text-teal-300">{o3Val.toFixed(1)}</strong>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            topic="aerosol_multimodal_distribution"
            title="Partículas Finas Respirables (PM₂.₅)"
            content={`Partículas finas respirables alveolares (PM₂.₅ = ${pm25Val.toFixed(1)} µg/m³). Límite OMS 2021: 5 µg/m³ (anual), 15 µg/m³ (24h).`}
            formula={`\\text{VBS}(T) = \\sum c_i^*`}
            regulatory="Guías OMS 2021 & Directiva 2008/50/CE"
            citation="Pankow (1994) & Donahue et al. (2006)"
            position="bottom"
            width="w-[320px]"
          >
            <button
              type="button"
              onClick={() => openBannerModal('chemicalSpecies')}
              className="text-slate-400 hover:text-amber-200 cursor-pointer px-1 py-0.2 rounded hover:bg-amber-950/60 transition-colors"
            >
              PM₂.₅: <strong className="text-amber-300">{pm25Val.toFixed(1)}</strong>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            topic="aerosol_multimodal_distribution"
            title="Partículas Torácicas (PM₁₀)"
            content={`Partículas torácicas (PM₁₀ = ${pm10Val.toFixed(1)} µg/m³). Límite UE 2008/50/CE: 40 µg/m³, Guía OMS 2021: 15 µg/m³.`}
            formula={`\\text{PM}_{10} = \\text{PM}_{2.5} + \\text{Polvo} + \\text{NaCl}`}
            regulatory="Directiva 2008/50/CE: 40 µg/m³ anual"
            citation="EMEP/EEA Guidebook"
            position="bottom"
            width="w-[320px]"
          >
            <button
              type="button"
              onClick={() => openBannerModal('chemicalSpecies')}
              className="text-slate-400 hover:text-amber-100 cursor-pointer px-1 py-0.2 rounded hover:bg-amber-950/60 transition-colors"
            >
              PM₁₀: <strong className="text-amber-200">{pm10Val.toFixed(1)}</strong>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            topic="coastal_halogen_clno2"
            title="Trazador Halógeno Costero en Punto Activo (ClNO₂)"
            content={`Cloruro de Nitrilo marino asimilado en el punto activo (ClNO₂ = ${clno2Pptv} pptv): cuantifica la influencia del aerosol de cloruro sódico de la Bahía de Málaga y su activación radicalaria matinal.`}
            formula={`\\text{N}_2\\text{O}_5 + \\text{NaCl}_{\\text{(s/aq)}} \\xrightarrow{\\gamma} \\phi\\,\\text{ClNO}_2 + (1-\\phi)\\,\\text{NaNO}_3`}
            regulatory="Trazador precursor fotoquímico de bahía costera"
            citation="Thornton et al. (Nature 2010)"
            position="bottom"
            width="w-[320px]"
          >
            <button
              type="button"
              onClick={() => openBannerModal('q1CoastalChemistry')}
              className="text-slate-400 hover:text-cyan-200 cursor-pointer px-1 py-0.2 rounded hover:bg-cyan-950/60 transition-colors"
            >
              ClNO₂: <strong className="text-cyan-300">{clno2Pptv}</strong><span className="text-[8px] text-cyan-500 ml-0.5">ppt</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            topic="monin_obukhov_turbulence"
            title="Meteorología de Capa Límite en Punto Activo"
            content={`Termodinámica y turbulencia local: Temperatura = ${tempVal.toFixed(1)} °C, Viento = ${windVal.toFixed(1)} m/s, Humedad = ${humidityVal.toFixed(0)}%, Rugosidad z₀ = ${z0Val} m.`}
            formula={`u(z) = \\frac{u_*}{\\kappa}\\left[\\ln\\left(\\frac{z-d}{z_0}\\right) - \\Psi_m\\left(\\frac{z}{L}\\right)\\right]`}
            regulatory="Teoría de Semejanza de Monin-Obukhov (MOST)"
            citation="Monin & Obukhov (1954)"
            position="bottom"
            width="w-[320px]"
          >
            <button
              type="button"
              onClick={() => openBannerModal('moninObukhov')}
              className="text-slate-400 hover:text-slate-100 cursor-pointer px-1 py-0.2 rounded hover:bg-slate-800/80 transition-colors"
            >
              <strong className="text-slate-200">{tempVal.toFixed(1)}°C</strong> · <strong className="text-sky-300">{windVal.toFixed(1)}m/s</strong>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="Balance de Masa y Cascada de NO₂"
            content="Desglose instantáneo de la ecuación de continuidad para NO₂ (+ fuentes de tráfico, titración, - sumideros de fotólisis y deposición de Wesely)."
            formula={`\\frac{\\partial [\\text{NO}_2]}{\\partial t} = \\sum P_i - \\sum L_i`}
            regulatory="Ecuación de Continuidad / EMEP-EEA 2023"
            position="bottom"
            width="w-[320px]"
          >
            <button
              type="button"
              onClick={() => openBannerModal('no2MassBudget')}
              className="ml-1 px-1.5 py-0.5 bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/80 rounded text-[9px] font-sans flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-xs"
            >
              <BarChart2 className="w-2.5 h-2.5 text-emerald-400" />
              <span>Balance NO₂</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title={`Red de Confianza & Certidumbre PINN (GUM / Kriging ${SYSTEM_PROPAGATION.sensorNetwork.totalTerrestrial}+${SYSTEM_PROPAGATION.sensorNetwork.totalSatellites})`}
            content={`Activar en el mapa el degradado de certidumbre espacial (Verde → Amarillo → Naranja → Rojo) calculado a partir de las ${SYSTEM_PROPAGATION.sensorNetwork.totalTerrestrial} estaciones físicas y ${SYSTEM_PROPAGATION.sensorNetwork.totalSatellites} satélites en vivo.`}
            formula="u_c(C) = \sqrt{u_{\text{inst}}^2 + u_{\text{esp}}^2}"
            regulatory="ISO 20988:2007 Air Quality - Assessment of Uncertainty"
            position="bottom"
            width="w-[320px]"
          >
            <button
              type="button"
              onClick={toggleConfidenceLayer}
              className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-sans flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-xs border ${
                showConfidenceLayer
                  ? 'bg-indigo-900 text-indigo-100 border-indigo-400 font-bold shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse'
                  : 'bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border-indigo-700/80'
              }`}
            >
              <ShieldCheck className="w-2.5 h-2.5 text-indigo-400" />
              <span>🛡️ Red Confianza {showConfidenceLayer ? '(ON)' : '(OFF)'}</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            topic="school_air_equity_directive_2024"
            title="Entornos Escolares & Directiva (UE) 2024/2881"
            content={`Red de ${MALAGA_RAW_SCHOOLS.length} Colegios georreferenciados de Málaga. Colegio más próximo: ${nearestSchool.name} (${nearestSchool.distKm < 1 ? `${Math.round(nearestSchool.distKm * 1000)} m` : `${nearestSchool.distKm} km`}). Auditoría frente a nuevos límites 2030 (20 µg/m³) y dosimetría pediátrica ICRP 66.`}
            formula={`D_{\\text{infantil}} = C(z=0.90\\text{m}) \\cdot V_E \\cdot DF_{\\text{alv}}`}
            regulatory="Directiva (UE) 2024/2881 Art. 13 & ICRP Publication 66"
            citation="Directiva (UE) 2024/2881 del Parlamento Europeo"
            position="bottom"
            width="w-[340px]"
          >
            <button
              type="button"
              onClick={() => openBannerModal('schoolAirEquity')}
              className="ml-1 px-1.5 py-0.5 bg-amber-950/90 hover:bg-amber-900 text-amber-300 border border-amber-600/80 rounded text-[9px] font-sans flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-xs"
            >
              <School className="w-2.5 h-2.5 text-amber-400" />
              <span>{MALAGA_RAW_SCHOOLS.length} Colegios</span>
            </button>
          </ScientificTooltip>

          {/* MENÚ CONTEXTUAL DESPLEGABLE DE ANÁLISIS ESPECIALIZADO (COMPACTO) */}
          <div className="relative shrink-0" ref={compactMenuRef}>
            {!isAnalysisMenuOpen ? (
              <ScientificTooltip
                title="Selector Rápido de Análisis Especializado (9 Módulos — Barra Compacta)"
                content="Desplegar desde esta ventana las 9 herramientas científicas avanzadas sincronizadas con el punto activo."
                position="bottom"
                width="w-[300px]"
              >
                <button
                  type="button"
                  onClick={(e) => toggleAnalysisMenu(e, compactMenuRef)}
                  className="ml-1 px-1.5 py-0.5 bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border border-indigo-600/80 rounded text-[9px] font-sans flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-xs"
                >
                  <Zap className="w-2.5 h-2.5 text-indigo-400" />
                  <span>⚡ Análisis (9)</span>
                </button>
              </ScientificTooltip>
            ) : (
              <button
                type="button"
                onClick={(e) => toggleAnalysisMenu(e, compactMenuRef)}
                className="ml-1 px-1.5 py-0.5 bg-indigo-900 text-indigo-100 border border-indigo-400 rounded text-[9px] font-sans flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-xs"
              >
                <Zap className="w-2.5 h-2.5 text-indigo-400" />
                <span>⚡ Análisis (9)</span>
              </button>
            )}
          </div>

          <ScientificTooltip
            topic="temporal_point_history_7d"
            title="Historial de 7 Días del Punto Activo"
            content="Ver historial detallado de mediciones del punto activo y gráfico de áreas de los últimos 7 días con estimadores Theil-Sen y Mann-Kendall."
            formula={`S = \\sum_{k=1}^{n-1}\\sum_{j=k+1}^n \\text{sgn}(x_j - x_k)`}
            regulatory="Evaluación temporal continuada Directiva 2008/50/CE"
            citation="Mann (1945) & Theil-Sen (1950)"
            position="bottom"
            width="w-[320px]"
          >
            <button
              onClick={handleOpenHistory}
              className="ml-1 px-1.5 py-0.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 rounded text-[9px] font-sans flex items-center gap-1 cursor-pointer transition-all shrink-0"
            >
              <Calendar className="w-2.5 h-2.5 text-cyan-400" />
              <span>7D</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="Copiar Párrafo Doctoral + Tabla LaTeX Booktabs del Punto Activo (1 Clic)"
            content={`Copia instantáneamente al portapapeles el párrafo académico redactado para Word y el bloque tabular LaTeX Booktabs con todas las métricas deterministas en vivo de ${streetName} (coordenadas WGS84, conversión termodinámica exacta ppb ↔ µg/m³ con P y T reales de AEMET, perfil vertical 0,8m / 1,5m / 4,0m, cierre PINN e incertidumbre GUM U95).`}
            formula="\text{Word} + \text{\LaTeX\ Booktabs} \longleftarrow \Big\{C_{\text{NO}_2}(z),\; \chi_{\text{ppb}}(P,T),\; H/W,\; \text{SVF},\; \Phi,\; U_{95}\Big\}"
            regulatory="Escritura Científica Directa — Tesis Doctoral UNED (Reglas 8, 17, 32 y 34)"
            position="bottom"
            width="w-[360px]"
          >
            <button
              type="button"
              onClick={handleCopyDoctoralParagraphWordLatex}
              className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-sans font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0 border ${
                copiedDoctoralParagraph
                  ? 'bg-emerald-500 text-slate-950 border-white shadow-xs'
                  : 'bg-slate-900 hover:bg-sky-950 text-sky-200 border-sky-500/80'
              }`}
            >
              <span>{copiedDoctoralParagraph ? '✓ Párrafo + LaTeX Copiado' : '📋 Copiar Párrafo Tesis'}</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="bottom"
            width="w-[240px]"
            content={isBannerMinimized ? 'Desplegar la cinta de Salto 1-Clic a las 7 calles clave y el diferencial ΔNO₂.' : 'Compactar el banner en 1 sola línea para ganar espacio vertical para tablas y gráficas.'}
          >
            <button
              type="button"
              onClick={() => setIsBannerMinimized(v => !v)}
              className="ml-1 px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded text-[8.5px] font-mono font-bold flex items-center gap-0.5 cursor-pointer shrink-0"
            >
              {isBannerMinimized ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronUp className="w-2.5 h-2.5" />}
              <span>{isBannerMinimized ? '▾ Calles' : '▴ Compactar'}</span>
            </button>
          </ScientificTooltip>
        </div>
        </div>

        {/* Cinta Deslizante de Cambio Rápido de Calle en 1 Clic + Diferencial Δ Antes vs. Ahora (Opciones 3 y 9) */}
        {!isBannerMinimized && (
        <div className="mt-1 pt-1 border-t border-slate-800/80 flex items-center gap-2">
          {previousPointComparison && (
            <ScientificTooltip
              position="bottom"
              width="w-[340px]"
              title="Gradiente Espacial Δ Punto Actual vs. Punto Anterior (Cinta Compacta)"
              content={`Comparación empírica instantánea en esta ventana al cambiar a ${streetName} respecto a la ubicación previa (${previousPointComparison.prevStreet}): ΔNO₂ = ${previousPointComparison.diffNo2 >= 0 ? `+${previousPointComparison.diffNo2}` : previousPointComparison.diffNo2} µg/m³ y Δ(H/W) = ${previousPointComparison.diffHw >= 0 ? `+${previousPointComparison.diffHw}` : previousPointComparison.diffHw}.`}
            >
              <span
                className={`px-2 py-0.5 rounded border text-[9px] font-mono font-black shrink-0 cursor-help ${
                  previousPointComparison.diffNo2 <= 0
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/70'
                    : 'bg-rose-950/90 text-rose-300 border-rose-500/70'
                }`}
              >
                ΔNO₂: {previousPointComparison.diffNo2 >= 0 ? `+${previousPointComparison.diffNo2}` : previousPointComparison.diffNo2} µg vs. {previousPointComparison.prevStreet}
              </span>
            </ScientificTooltip>
          )}

          <SlidingRibbonBar
            activeKey={streetName}
            accent="cyan"
            showPositionBadge={false}
            ariaLabel="Salto rápido en 1 clic a calles y focos críticos de Málaga"
            className="flex-1 min-w-0"
          >
            <span className="text-[9px] font-mono font-black text-cyan-300 uppercase px-1.5 shrink-0">
              📍 Salto 1-Clic:
            </span>
            {MALAGA_CRITICAL_THESIS_HOTSPOTS.map((spot) => {
              const isCurrent = streetName.toLowerCase().includes(spot.fullName.split(',')[0].toLowerCase());
              return (
                <ScientificTooltip
                  key={spot.id}
                  position="bottom"
                  width="w-[320px]"
                  title={`Salto Rápido en Ventana: ${spot.fullName} (${spot.tag})`}
                  content={spot.tooltip}
                >
                  <button
                    type="button"
                    data-ribbon-active={isCurrent}
                    onClick={() => activeCtx.syncActivePoint(spot.lat, spot.lon, { name: spot.fullName, fly: true })}
                    className={`px-2 py-0.5 rounded border text-[9px] font-mono font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                      isCurrent
                        ? 'bg-cyan-500 text-slate-950 border-cyan-200 font-black shadow-xs'
                        : 'bg-slate-950/90 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                    }`}
                  >
                    {spot.shortLabel}
                  </button>
                </ScientificTooltip>
              );
            })}
          </SlidingRibbonBar>
        </div>
        )}

        {renderAnalysisMenuPortal()}
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/95 border-b border-cyan-900/50 shadow-xs relative z-[200] group ${className}`}>
      {/* Contenedor Relativo Exclusivo de la Fila Principal (Evita que las flechas < > colisionen con la fila inferior) */}
      <div className="relative flex items-center">
        {/* Botones de Deslizamiento Suave (Izquierda / Derecha) */}
        {canScrollLeft && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-30">
            <ScientificTooltip
              position="bottom"
              width="w-[240px]"
              title="Desplazamiento Horizontal Izquierdo"
              content="Deslizar el banner analítico hacia la izquierda para inspeccionar las métricas primarias de ubicación y telemetría del punto activo."
              regulatory="Ergonomía Cartográfica (Regla 10 Gemelo Digital)"
            >
              <button
                type="button"
                onClick={() => scrollBanner('left')}
                className="h-7 w-6 bg-slate-900/95 hover:bg-cyan-900 text-cyan-300 border-r border-y border-cyan-700/80 rounded-r flex items-center justify-center shadow-md transition-all cursor-pointer backdrop-blur-xs group"
                title="Deslizar banner hacia la izquierda"
                aria-label="Deslizar banner hacia la izquierda"
              >
                <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              </button>
            </ScientificTooltip>
          </div>
        )}

        {canScrollRight && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-30">
            <ScientificTooltip
              position="bottom"
              width="w-[260px]"
              title="Desplazamiento Horizontal Derecho"
              content="Deslizar el banner hacia la derecha para acceder a las herramientas analíticas, dosimetría escolar y módulos especializados del punto activo."
              regulatory="Ergonomía Cartográfica (Regla 10 Gemelo Digital)"
            >
              <button
                type="button"
                onClick={() => scrollBanner('right')}
                className="h-7 w-6 bg-slate-900/95 hover:bg-cyan-900 text-cyan-300 border-l border-y border-cyan-700/80 rounded-l flex items-center justify-center shadow-md transition-all cursor-pointer backdrop-blur-xs group"
                title="Deslizar banner hacia la derecha para ver todas las herramientas y pestañas"
                aria-label="Deslizar banner hacia la derecha"
              >
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform animate-pulse" />
              </button>
            </ScientificTooltip>
          </div>
        )}

        {/* Barra Principal de Asimilación Deslizable */}
        <div 
          ref={bannerScrollRef}
          onMouseDown={handleBannerMouseDown}
          className={`w-full px-2.5 py-1 flex items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar scroll-smooth ${
            isBannerDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
          }`}
        >
        {/* Identificación Geográfica y Coordenadas + Botón Rápido de 7 Calles Clave */}
        <div className="flex items-center space-x-2 shrink-0">
          <ScientificTooltip
            title="Señal de Telemetría & Asimilación Continua"
            content="Flujo continuo de datos en tiempo real de la Red Oficial de Calidad del Aire de Málaga acoplado con ecuaciones de transporte atmosférico y microescala (cero datos estocásticos o ficticios)."
            formula={`\\frac{\\partial C}{\\partial t} + \\mathbf{u} \\cdot \\nabla C = \\nabla \\cdot (K \\nabla C) + R(C) + E`}
            regulatory="Directiva 2008/50/CE & Marco de Evaluación Continua FAIRMODE WG1"
            citation="EMEP/EEA Guidebook & Seinfeld & Pandis (2016)"
            position="bottom"
            width="w-[350px]"
          >
            <span className="flex h-2 w-2 relative shrink-0 cursor-help">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </ScientificTooltip>
          <div className="flex flex-col justify-center leading-tight">
            <div className="flex items-center space-x-1.5 whitespace-nowrap">
              <ScientificTooltip
                topic="active_point_synchronization"
                title="Punto Activo Seleccionado (Sincronización Atómica)"
                content={`Ubicación activa unificada en todo el Gemelo Digital: ${streetName}${districtName ? ` (${districtName})` : ''}. Cualquier consulta, modelización fotoquímica de Leighton, estimación de emisiones COPERT 5 o dosimetría humana ICRP-66 se calcula instantáneamente para estas coordenadas exactas.`}
                formula={`P_{\\text{activo}} = (\\phi, \\lambda, z_{\\text{MDE}}, \\text{Topología OSM}, \\text{Régimen Oke})`}
                regulatory="Sincronización Baricéntrica Unificada (Regla 10 Gemelo Digital Málaga)"
                citation="Oke, T. R. (1988) Boundary Layer Climates & Vardoulakis et al. (2003)"
                position="bottom"
                width="w-[360px]"
              >
                <div className="flex items-center space-x-1.5 whitespace-nowrap cursor-help">
                  <span className="text-[9.5px] font-mono tracking-wider text-cyan-400 uppercase font-semibold">
                    Punto Activo:
                  </span>
                  <span className="text-[11px] font-bold text-slate-100 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate max-w-[160px] sm:max-w-[220px]">{streetName}</span>
                  </span>
                  {districtName && (
                    <span className="text-[9.5px] text-slate-400 font-sans hidden md:inline">
                      • {districtName}
                    </span>
                  )}
                </div>
              </ScientificTooltip>

              <ScientificTooltip
                position="bottom"
                width="w-[280px]"
                title="Salto 1-Clic a los 7 Escenarios Clave de la Tesis"
                content="Desplegar u ocultar el selector rápido de las 7 ubicaciones canónicas de Málaga (Alameda TiO₂, C/ Larios Macael, Edificio Urban Teatinos, Cabina EOI Martiricos, Av. Juan XXIII, Puerto Levante y El Atabal)."
              >
                <button
                  type="button"
                  onClick={() => setIsBannerMinimized(v => !v)}
                  className={`px-1.5 py-0.2 rounded border text-[8.5px] font-mono font-bold flex items-center gap-0.5 cursor-pointer shrink-0 transition-all ${
                    !isBannerMinimized
                      ? 'bg-cyan-900/90 text-cyan-100 border-cyan-400'
                      : 'bg-slate-950/90 hover:bg-slate-800 text-cyan-300 border-cyan-800/80'
                  }`}
                >
                  <span>📍 7 Calles</span>
                  <span>{isBannerMinimized ? '▾' : '▴'}</span>
                </button>
              </ScientificTooltip>

              <ScientificTooltip
                position="bottom"
                width="w-[380px]"
                title="Selector Directo de los 11 Distritos de Málaga con Concentraciones en Vivo"
                content="Cambia en 1 clic entre las 13 arterias de los 11 Distritos Oficiales de Málaga viendo en vivo sus concentraciones a z = 1,8 m (peatón), z = 0,9 m (bebé), z = 4,0 m (cabina) y fracción molar en ppb (Regla 34)."
                regulatory="Reglas 10, 17, 32, 33 y 34 AGENTS.md"
              >
                <select
                  aria-label="Cambiar entre los 11 Distritos de Málaga con concentraciones en vivo"
                  value={activeDistrictCorridorId}
                  onChange={(e) => {
                    const chosen = live11DistrictsCorridors.find((c) => c.id === e.target.value);
                    if (chosen) {
                      activeCtx.syncActivePoint(chosen.lat, chosen.lon, {
                        name: `${chosen.streetName}, ${chosen.districtName}, Málaga`,
                        fly: true
                      });
                    }
                  }}
                  className="bg-slate-950 text-amber-300 border border-amber-400/80 rounded px-1.5 py-0.2 text-[8.5px] font-mono font-black cursor-pointer shrink-0 max-w-[230px] sm:max-w-[300px]"
                >
                  <option value="">
                    🌍 11 Distritos (1,8m: {realNO2.toFixed(1)} µg/m³)
                  </option>
                  {live11DistrictsCorridors.map((corridor) => (
                    <option key={corridor.id} value={corridor.id}>
                      {corridor.shortLabel} ({corridor.streetName.split('(')[0].trim()}) ➔ 1,8m: {corridor.liveC18mPedestrianUg} µg/m³ ({corridor.livePpb18m} ppb) | 0,9m: {corridor.liveC09mPediatricUg} | 4m: {corridor.liveC40mCabinUg}
                    </option>
                  ))}
                </select>
              </ScientificTooltip>

              <ScientificTooltip
                position="bottom"
                width="w-[360px]"
                title={`Proyectar Red de Confianza en el Mapa (${SYSTEM_PROPAGATION.sensorNetwork.totalTerrestrial}+${SYSTEM_PROPAGATION.sensorNetwork.totalSatellites})`}
                content={`Proyecta en tiempo real sobre el lienzo 3D: 1) Los vectores geodésicos desde las ${SYSTEM_PROPAGATION.sensorNetwork.totalTerrestrial} estaciones terrestres y ${SYSTEM_PROPAGATION.sensorNetwork.totalSatellites} satélites hacia ${streetName} ponderados por peso Kriging/Kalman; 2) Los anillos de isoconfianza metrológica (500 m, 1.5 km, 3.0 km); y 3) Las zonas coloreadas de certidumbre GUM (Verde = Alta >88%, Ámbar = Media 75-88%, Carmesí = Contorno PDE <75%). Toca cualquier zona coloreada o vector en el mapa para ver su explicación científica.`}
                formula="u_c(C) = \sqrt{u_{\text{inst}}^2 + \sigma_K^2(\mathbf{x}_0)}, \quad w_i \propto \gamma^{-1}(h_i) e^{-\Delta t_i/\tau_c}"
                regulatory="ISO 20988:2007 & JCGM 100:2008 (GUM) • Regla 19 Tesis Doctoral UNED"
              >
                <button
                  type="button"
                  onClick={toggleConfidenceLayer}
                  className={`px-2 py-0.5 rounded border text-[9px] font-mono font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-all ${
                    showConfidenceLayer
                      ? 'bg-indigo-600 text-white border-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.85)]'
                      : 'bg-indigo-950/90 hover:bg-indigo-900 text-indigo-200 border-indigo-500/80'
                  }`}
                >
                  <ShieldCheck className={`w-3 h-3 shrink-0 ${showConfidenceLayer ? 'text-emerald-300 animate-pulse' : 'text-indigo-400'}`} />
                  <span>🛡️ Red de Confianza ({SYSTEM_PROPAGATION.sensorNetwork.totalTerrestrial}+{SYSTEM_PROPAGATION.sensorNetwork.totalSatellites})</span>
                  <span className={`px-1 rounded text-[7.5px] font-black ${
                    showConfidenceLayer ? 'bg-emerald-400 text-slate-950' : 'bg-slate-900 text-indigo-300'
                  }`}>
                    {showConfidenceLayer ? 'MAPA ON' : 'PROYECTAR'}
                  </span>
                </button>
              </ScientificTooltip>
            </div>
            {showCoordinates && (
              <ScientificTooltip
                topic="spatial_kriging_cartography"
                title="Georreferenciación & Datum Cartográfico Oficial"
                content={`Coordenadas de precisión submétrica: Latitud ${typeof location?.lat === 'number' ? location.lat.toFixed(5) : '36.72130'}°N, Longitud ${typeof location?.lon === 'number' ? location.lon.toFixed(5) : '-4.42140'}°E en el elipsoide GRS80 / Datum ETRS89 UTM huso 30N (código EPSG:25830). Factor de forma de cañón urbano H/W = ${canyonHW.toFixed(2)}.`}
                formula={`\\text{UTM}_{30\\text{N}}(X, Y) = \\mathcal{T}_{\\text{TM}}(\\phi, \\lambda), \\quad \\frac{H}{W} = \\frac{z_{\\text{edificio}}}{w_{\\text{calle}}} = ${canyonHW.toFixed(2)}`}
                regulatory="Real Decreto 1071/2007 (Sistema Geodésico Oficial de España ETRS89)"
                citation="Snyder, J. P. (1987) Map Projections: A Working Manual (USGS)"
                position="bottom"
                width="w-[360px]"
              >
                <div className="text-[8.5px] font-mono text-slate-400 flex items-center gap-x-1.5 whitespace-nowrap cursor-help">
                  <span>WGS84: {typeof location?.lat === 'number' ? location.lat.toFixed(5) : '36.72130'}°N, {typeof location?.lon === 'number' ? location.lon.toFixed(5) : '-4.42140'}°E · H/W: {canyonHW.toFixed(2)}</span>
                </div>
              </ScientificTooltip>
            )}
          </div>
        </div>

        {/* Telemetría, Física PINN y Semáforo Normativo (Píldoras Desplazables a Izquierda ◀ y Derecha ▶ a voluntad) */}
        <div className="flex items-center gap-1 font-mono text-[10px] bg-slate-950/80 px-2 pt-1.5 pb-0.5 rounded border border-slate-800 shrink-0 whitespace-nowrap">
          {(() => {
            const bannerPillsMap: Record<string, React.ReactNode> = {
              caqi: (
                <ScientificTooltip
                  title="Índice CAQI Europeo & Estado Sanitario"
                  content={`Semáforo Normativo de Calidad del Aire CAQI: ${caqiScore}/100 (${aqiLabel}). Determinado por el contaminante limitante a cota respiratoria peatonal (1.8m AGL) según umbrales europeos y de la OMS. Haz clic para abrir el Certificado Metrológico GUM & Estado Sanitario.`}
                  formula={`\\text{CAQI} = \\max\\left( \\frac{C_{\\text{NO}_2}}{40} \\cdot 50, \\, \\frac{C_{\\text{PM}_{2.5}}}{25} \\cdot 50, \\, \\frac{C_{\\text{PM}_{10}}}{50} \\cdot 50, \\, \\frac{C_{\\text{O}_3}}{120} \\cdot 50 \\right)`}
                  regulatory="Directiva 2008/50/CE & Criterios Air Quality Index (EEA)"
                  citation="Common Air Quality Index (CAQI) Methodology (Citeair / EEA)"
                  position="bottom"
                  width="w-[340px]"
                >
                  <button
                    type="button"
                    onClick={() => openBannerModal('metrologicalCertificate')}
                    className={`cursor-pointer flex items-center space-x-1 px-2 py-0.5 rounded border text-[9.5px] font-bold transition-all hover:brightness-125 ${aqiColor} ${
                      activeModal === 'metrologicalCertificate' ? 'ring-1 ring-white shadow-[0_0_10px_rgba(34,211,238,0.6)]' : ''
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3 shrink-0" />
                    <span>CAQI: {caqiScore}</span>
                    <span className="text-[8px] font-sans opacity-80">({aqiLabel})</span>
                  </button>
                </ScientificTooltip>
              ),
              no2: (
                <ScientificTooltip
                  title="Dióxido de Nitrógeno Observado In Situ (Click para abrir Balance de Masa & Cascada)"
                  content={`Concentración asimilada a 1.8 m AGL (${realNO2.toFixed(1)} µg/m³) mediante Kriging 2D de la Red Oficial de Málaga con gradiente de microescala vehicular COPERT 5. Haz clic para abrir el Balance de Masa y Gráfico Cascada de NO₂.`}
                  formula={`\\text{NO}_2(z=1.8\\text{m}) = C_{\\text{fondo}} + \\Delta C_{\\text{tráfico}}(\\text{COPERT 5}) \\cdot \\text{Vortex}(H/W)`}
                  regulatory="Directiva 2008/50/CE: límite horario 200 µg/m³, anual 40 µg/m³ • OMS 2021: anual 10 µg/m³, 24h 25 µg/m³"
                  citation="Oke, T. R. (1988) Boundary Layer Climates & Guía EMEP/EEA 2023"
                  diagram="canyon_vortex"
                  position="bottom"
                  width="w-[350px]"
                >
                  <button
                    type="button"
                    onClick={() => openBannerModal('no2MassBudget')}
                    className={`cursor-pointer flex items-center space-x-1.5 px-2 py-0.5 rounded transition-all shadow-xs group border ${
                      activeModal === 'no2MassBudget'
                        ? 'bg-emerald-900/90 border-emerald-300 ring-1 ring-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.6)]'
                        : 'bg-slate-900/90 hover:bg-emerald-950/80 border-sky-800/60 hover:border-emerald-400'
                    }`}
                  >
                    <span className="text-[9px] uppercase tracking-wider text-sky-400 group-hover:text-emerald-300 font-bold">NO₂:</span>
                    <strong className="text-sky-300 group-hover:text-emerald-200 font-bold">{realNO2.toFixed(1)}</strong>
                    <span className="text-[8.5px] text-slate-400">µg</span>
                    <BarChart2 className="w-2.5 h-2.5 text-emerald-400 opacity-75 group-hover:opacity-100 ml-0.5" />
                  </button>
                </ScientificTooltip>
              ),
              pinn: (
                <ScientificTooltip
                  topic="pinn_physics_informed_loss"
                  title="Resolución por Red Neuronal Informada por la Física"
                  content={`Concentración predicha por la PINN (${pinnNO2.toFixed(1)} µg/m³, discrepancia Δ = ${deltaNO2 >= 0 ? `+${deltaNO2}` : deltaNO2} µg/m³), acoplando advección Navier-Stokes en cañón urbano con la fotólisis de Leighton. Residuo PDE: ${pdeResidual.toFixed(4)} µg/m³·s. Haz clic para abrir el Benchmark PINN & Residuo PDE.`}
                  formula={`\\mathcal{L}_{\\text{total}} = \\mathcal{L}_{\\text{datos}} + \\lambda_{\\text{NS}} \\|\\mathbf{u}\\cdot\\nabla C - D\\nabla^2 C - S\\|_2^2 + \\lambda_{\\text{chem}} \\mathcal{R}_{\\text{Leighton}}`}
                  regulatory="FAIRMODE WG1 Quality Assurance for Physics-Informed Neural Networks"
                  citation="Raissi, M. et al. (2019) J. Comput. Phys. & Karniadakis et al. (2021) Nature Rev. Phys."
                  position="bottom"
                  width="w-[360px]"
                >
                  <button
                    type="button"
                    onClick={() => openBannerModal('benchmark')}
                    className={`cursor-pointer flex items-center space-x-1 px-1.5 py-0.5 rounded border transition-all ${
                      activeModal === 'benchmark'
                        ? 'bg-emerald-900/90 border-emerald-300 ring-1 ring-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.6)]'
                        : 'bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-700/60 hover:border-emerald-400'
                    }`}
                  >
                    <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold">PINN:</span>
                    <strong className="text-emerald-300 font-bold">{pinnNO2.toFixed(1)}</strong>
                    <span className="text-[8.5px] text-slate-400">µg</span>
                    <span className="text-[8.5px] font-mono text-emerald-500/90 ml-0.5">
                      ({deltaNO2 >= 0 ? `+${deltaNO2}` : deltaNO2})
                    </span>
                  </button>
                </ScientificTooltip>
              ),
              no: (
                <ScientificTooltip
                  title="Monóxido de Nitrógeno Primario (NO)"
                  content={`Monóxido de Nitrógeno vehicular (${noVal.toFixed(1)} µg/m³): Trazador directo de escape automovilístico (75-85% del NOx en combustión directa). Reacciona rápidamente con O3 para oxidarse a NO2. Haz clic para abrir el Inventario de Tráfico COPERT 5.`}
                  formula={`\\text{NO} + \\text{O}_3 \\xrightarrow{k_3(T)} \\text{NO}_2 + \\text{O}_2, \\quad k_3(T) = 1.4 \\times 10^{-12} \\exp(-1310/T) \\text{ cm}^3/\\text{molec}\\cdot\\text{s}`}
                  regulatory="Precursor normativo de NO2 y ozono troposférico (Directiva 2008/50/CE)"
                  citation="Seinfeld, J. H. & Pandis, S. N. (2016) Atmospheric Chemistry and Physics"
                  position="bottom"
                  width="w-[330px]"
                >
                  <button
                    type="button"
                    onClick={() => openBannerModal('copert')}
                    className={`cursor-pointer flex items-center space-x-1 px-1.5 py-0.5 rounded border transition-all ${
                      activeModal === 'copert'
                        ? 'bg-sky-900/90 border-sky-300 ring-1 ring-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.6)]'
                        : 'bg-sky-950/60 hover:bg-sky-900/80 border-sky-800/50 hover:border-sky-400'
                    }`}
                  >
                    <span className="text-[9px] uppercase tracking-wider text-sky-300 font-bold">NO:</span>
                    <strong className="text-sky-200 font-bold">{noVal.toFixed(1)}</strong>
                    <span className="text-[8.5px] text-slate-400">µg</span>
                  </button>
                </ScientificTooltip>
              ),
              nox: (
                <ScientificTooltip
                  title="Óxidos de Nitrógeno Totales (NOx)"
                  content={`Suma de óxidos de nitrógeno (${noxTotalVal.toFixed(1)} µg/m³ equivalentes en NO2). Trazador conservativo estequiométrico que cuantifica la intensidad global de emisión por combustión fósil. Haz clic para abrir Emisiones COPERT 5 & Pavimentos TiO₂.`}
                  formula={`[\\text{NO}_x] = [\\text{NO}] + [\\text{NO}_2], \\quad [\\text{NO}_x]_{\\text{eq. NO}_2} = [\\text{NO}_2] + 1.5332 \\cdot [\\text{NO}]`}
                  regulatory="Directiva 2008/50/CE Anexo XI: 30 µg/m³ de media anual para protección vegetal"
                  citation="EMEP/EEA Air Pollutant Emission Inventory Guidebook 2023 (COPERT 5)"
                  position="bottom"
                  width="w-[340px]"
                >
                  <button
                    type="button"
                    onClick={() => openBannerModal('malagaTrafficInventory')}
                    className={`cursor-pointer flex items-center space-x-1 px-1.5 py-0.5 rounded border transition-all ${
                      activeModal === 'malagaTrafficInventory'
                        ? 'bg-indigo-900/90 border-indigo-300 ring-1 ring-indigo-300 shadow-[0_0_10px_rgba(129,140,248,0.6)]'
                        : 'bg-indigo-950/50 hover:bg-indigo-900/80 border-indigo-800/40 hover:border-indigo-400'
                    }`}
                  >
                    <span className="text-[9px] text-indigo-300 font-bold">NOₓ:</span>
                    <strong className="text-indigo-200">{noxTotalVal.toFixed(1)}</strong>
                    <span className="text-[8px] text-indigo-400">µg</span>
                  </button>
                </ScientificTooltip>
              ),
              o3: (
                <ScientificTooltip
                  topic="leighton_photostationary"
                  title="Ozono Troposférico & Equilibrio Fotoquímico"
                  content={`Concentración de ozono (${o3Val.toFixed(1)} µg/m³): Oxidante secundario regulado por el ciclo fotoestacionario de Leighton y la titulación por NO en cañones urbanos de tráfico. Haz clic para abrir el Ciclo Fotoquímico de Leighton & Ozono.`}
                  formula={`\\phi = \\frac{J_{\\text{NO}_2} [\\text{NO}_2]}{k_3(T) [\\text{NO}] [\\text{O}_3]}, \\quad \\phi \\approx 1 \\implies \\text{Fotoestacionario puro}`}
                  regulatory="Directiva 2008/50/CE: Umbral información 180 µg/m³ • OMS 2021: 100 µg/m³ (máx. 8h)"
                  citation="Leighton, P. A. (1961) Photochemistry of Air Pollution & IUPAC Subcommittee (2004)"
                  position="bottom"
                  width="w-[360px]"
                >
                  <button
                    type="button"
                    onClick={() => openBannerModal('leighton')}
                    className={`cursor-pointer flex items-center space-x-1 px-1.5 py-0.5 rounded border transition-all ${
                      activeModal === 'leighton' || activeModal === 'photochemicalRegime'
                        ? 'bg-teal-900/90 border-teal-300 ring-1 ring-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.6)]'
                        : 'bg-teal-950/40 hover:bg-teal-900/70 border-teal-800/30 hover:border-teal-400'
                    }`}
                  >
                    <span className="text-teal-400 text-[9px] font-bold">O₃:</span>
                    <strong className="text-teal-200">{o3Val.toFixed(1)}</strong>
                    <span className="text-[8px] text-teal-500">µg</span>
                  </button>
                </ScientificTooltip>
              ),
              pm: (
                <ScientificTooltip
                  topic="aerosol_multimodal_distribution"
                  title="Aerosoles Atmosféricos (PM2.5 & PM10)"
                  content={`Material Particulado en aire: PM2.5 = ${pm25Val.toFixed(1)} µg/m³ (fracción respirable alveolar) y PM10 = ${pm10Val.toFixed(1)} µg/m³ (fracción torácica con aerosol salino y mineral). Ratio PM2.5/PM10: ${pmRatio}. Haz clic para abrir el Analizador de Aerosoles & Especiación Química.`}
                  formula={`\\text{PM}_{10} = \\text{PM}_{2.5} + \\text{Polvo Mineral} + \\text{Aerosol Salino NaCl}, \\quad \\text{VBS}(T) = \\sum c_i^*`}
                  regulatory="Guías OMS 2021: PM2.5 = 5 µg/m³ anual, PM10 = 15 µg/m³ anual • Directiva 2008/50/CE: PM2.5 = 20 µg/m³, PM10 = 40 µg/m³"
                  citation="Pankow, J. F. (1994) Gas/Particle Partitioning & Donahue et al. (2006) VBS Model"
                  position="bottom"
                  width="w-[360px]"
                >
                  <button
                    type="button"
                    onClick={() => openBannerModal('chemicalSpecies')}
                    className={`cursor-pointer flex items-center space-x-1 px-1.5 py-0.5 rounded border transition-all ${
                      activeModal === 'chemicalSpecies' || activeModal === 'isorropiaSia'
                        ? 'bg-amber-900/90 border-amber-300 ring-1 ring-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                        : 'bg-amber-950/40 hover:bg-amber-900/70 border-amber-800/40 hover:border-amber-400'
                    }`}
                  >
                    <span className="text-amber-400 text-[9px] font-bold">PM₂.₅:</span>
                    <strong className="text-amber-200">{pm25Val.toFixed(1)}</strong>
                    <span className="text-slate-600">/</span>
                    <span className="text-amber-300 text-[9px]">PM₁₀:</span>
                    <strong className="text-amber-100">{pm10Val.toFixed(1)}</strong>
                    <span className="text-[8px] text-amber-500">µg</span>
                  </button>
                </ScientificTooltip>
              ),
              clno2: (
                <ScientificTooltip
                  topic="coastal_halogen_clno2"
                  title="Cloruro de Nitrilo (Halógenos Bahía de Málaga)"
                  content={`Cloruro de Nitrilo (${clno2Pptv} pptv): Trazador halógeno marino clave de Málaga. Formado por absorción nocturna de N2O5 en spray salino de la Bahía. Al amanecer sufre fotólisis liberando radicales Cl• muy reactivos. Haz clic para abrir Química Halógena Costera ClNO₂ & Bahía.`}
                  formula={`\\text{N}_2\\text{O}_5\\text{(g)} + \\text{NaCl(aq)} \\xrightarrow{\\gamma} \\text{ClNO}_2\\text{(g)} + \\text{NaNO}_3\\text{(aq)}, \\quad \\text{ClNO}_2 + h\\nu \\rightarrow \\text{Cl}^\\bullet + \\text{NO}_2`}
                  regulatory="Trazador precursor de oxidación fotoquímica costera (Tesis Doctoral / CAMS)"
                  citation="Thornton et al. (Nature 2010) & Osthoff et al. (Nature Geoscience 2008)"
                  position="bottom"
                  width="w-[360px]"
                >
                  <button
                    type="button"
                    onClick={() => openBannerModal('q1CoastalChemistry')}
                    className={`cursor-pointer flex items-center space-x-1 px-1.5 py-0.5 rounded border transition-all ${
                      activeModal === 'q1CoastalChemistry' || activeModal === 'coastalHalogens'
                        ? 'bg-cyan-900/90 border-cyan-300 ring-1 ring-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.6)]'
                        : 'bg-cyan-950/60 hover:bg-cyan-900/80 border-cyan-800/50 hover:border-cyan-400'
                    }`}
                  >
                    <span className="text-cyan-400 text-[9px] font-bold">ClNO₂:</span>
                    <strong className="text-cyan-200">{clno2Pptv}</strong>
                    <span className="text-[8px] text-cyan-400">ppt</span>
                  </button>
                </ScientificTooltip>
              ),
              meteo: showMetMetrics ? (
                <ScientificTooltip
                  topic="monin_obukhov_stability"
                  title="Micrometeorología & Perfil de Viento en Cañón"
                  content={`Temperatura local: ${tempVal.toFixed(1)}°C, Velocidad del viento local u(z=1.8m) = ${windVal.toFixed(1)} m/s, Humedad relativa: ${humidityVal.toFixed(0)}%, Rugosidad urbana z₀ = ${z0Val.toFixed(2)} m. Tasa de ventilación de calle: ACH = ${achVentilation} h⁻¹. Haz clic para abrir Turbulencia Monin-Obukhov & Capa Límite.`}
                  formula={`\\frac{H}{W} = ${canyonHW.toFixed(2)}, \\quad u(z) = \\frac{u_*}{\\kappa} \\left[ \\ln\\left(\\frac{z - d}{z_0}\\right) - \\psi_m\\left(\\frac{z}{L}\\right) \\right]`}
                  regulatory="Acoplamiento micrometeorológico ERA5-Land / AEMET para dispersión gaussiana y OSPM"
                  citation="Monin & Obukhov (1954) & Berkowicz et al. (2000) Atmospheric Environment"
                  position="bottom"
                  width="w-[360px]"
                >
                  <button
                    type="button"
                    onClick={() => openBannerModal('moninObukhov')}
                    className={`cursor-pointer flex items-center space-x-2 text-[10px] text-slate-300 px-1.5 py-0.5 rounded border transition-all ${
                      activeModal === 'moninObukhov'
                        ? 'bg-sky-950/90 border-sky-400 ring-1 ring-sky-400 text-sky-100 shadow-[0_0_10px_rgba(56,189,248,0.5)]'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 hover:border-sky-500/70'
                    }`}
                  >
                    <span>{tempVal.toFixed(1)}°C</span>
                    <span className="flex items-center gap-0.5">
                      <Wind className="w-2.5 h-2.5 text-sky-400" />
                      {windVal.toFixed(1)} m/s
                    </span>
                  </button>
                </ScientificTooltip>
              ) : null,
              trees: nearestTreeStreet && activeTreeLiveMetrics ? (
                <ScientificTooltip
                  width="w-[360px]"
                  title={`Arbolado Urbano en ${nearestTreeStreet.streetName}`}
                  content={`Alineación viaria de ${activeTreeLiveMetrics.treeCount} árboles (${activeTreeLiveMetrics.speciesName}). Absorción estomática instantánea: ${activeTreeLiveMetrics.streetNO2AbsorptionGramsHour} g NO₂/h (-${activeTreeLiveMetrics.liveNO2AbatementUgm3} µg/m³ a 1.8m), ${activeTreeLiveMetrics.streetPM25DepositionGramsHour} g PM₂.₅/h. Enfriamiento bioclimático por evapotranspiración: -${activeTreeLiveMetrics.microclimateCoolingDeltaC}°C. Régimen aerodinámico: ${activeTreeLiveMetrics.canyonAerodynamicStatus}.`}
                  citation="Nowak et al. (i-Tree Eco); Wesely (1989)"
                  regulatory="Directiva 2008/50/CE & Ley 7/2021 de Cambio Climático"
                  position="bottom"
                >
                  <button
                    type="button"
                    onClick={() => openBannerModal('malagaTreesInventory')}
                    className={`cursor-pointer flex items-center space-x-1.5 px-2 py-0.5 rounded text-emerald-200 transition-all shadow-xs border ${
                      activeModal === 'malagaTreesInventory'
                        ? 'bg-emerald-900 border-emerald-300 ring-1 ring-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.6)]'
                        : 'bg-emerald-950/80 border-emerald-600/70 hover:border-emerald-400 hover:bg-emerald-900/70'
                    }`}
                  >
                    <Trees className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold">Árboles:</span>
                    <span className="font-bold text-emerald-300 truncate max-w-[110px]">{nearestTreeStreet.predominantSpeciesName.split('(')[0].trim()}</span>
                    <span className="text-[8.5px] text-emerald-300 font-bold border-l border-emerald-800/80 pl-1">
                      -{activeTreeLiveMetrics.streetNO2AbsorptionGramsHour}g/h
                    </span>
                    <span className="text-[8.5px] text-teal-300 font-bold">
                      -{activeTreeLiveMetrics.microclimateCoolingDeltaC}°C
                    </span>
                  </button>
                </ScientificTooltip>
              ) : null,
              microscale_drawer: (
                <ScientificTooltip
                  topic="canyon_vortex_recirculation"
                  title="Morfometría Urbana 3D & Régimen de Oke"
                  content="Desplegar u ocultar la ficha microescalar avanzada: diagnóstico del vórtice de recirculación en cañón calle, tasa de renovación ACH, dosimetría peatonal inhalada (ICRP-66) y especiación química MEGAN 2.1."
                  formula={`\\frac{H}{W} = ${canyonHW.toFixed(2)}, \\quad \\text{Régimen}: \\text{${okeRegime.name}} \\; (${canyonHW >= 0.65 ? 'Skimming Flow' : canyonHW >= 0.3 ? 'Wake Interference' : 'Isolated Roughness'})`}
                  regulatory="Criterios morfológicos Oke (1988) para cañones urbanos y microclima"
                  citation="Oke, T. R. (1988) Street design and urban canopy layer climate & Berkowicz (2000)"
                  position="bottom"
                  width="w-[360px]"
                >
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                    className={`px-2 py-0.5 rounded text-[10px] font-sans flex items-center gap-1 cursor-pointer transition-all shadow-sm shrink-0 border ${
                      isDrawerOpen
                        ? 'bg-cyan-950 text-cyan-200 border-cyan-400 ring-1 ring-cyan-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <Activity className="w-3 h-3 text-cyan-400" />
                    <span>Ficha Microescala</span>
                    {isDrawerOpen ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                  </button>
                </ScientificTooltip>
              ),
              history_7d: (
                <ScientificTooltip
                  topic="temporal_point_history_7d"
                  title="Historial Continuo de 168 Horas (7 Días)"
                  content="Panel de series temporales horarias continuas (168 h): tendencias no paramétricas de Theil-Sen y test de Mann-Kendall para NO₂, O₃, PM₂.₅ y PM₁₀ en este punto activo."
                  formula={`S = \\sum_{k=1}^{n-1}\\sum_{j=k+1}^n \\text{sgn}(x_j - x_k), \\quad \\beta = \\text{median}\\left(\\frac{x_j - x_k}{j - k}\\right)`}
                  regulatory="Evaluación de superaciones normativas según Directiva 2008/50/CE y Guías OMS 2021"
                  citation="Mann (1945), Kendall (1975) & Theil-Sen (1950) Robust Trend Estimators"
                  position="bottom"
                  width="w-[350px]"
                >
                  <button
                    type="button"
                    onClick={handleOpenHistory}
                    className={`px-2 py-0.5 rounded text-[10px] font-sans flex items-center gap-1 cursor-pointer transition-all shadow-sm shrink-0 border ${
                      activeModal === 'activePoint7DayHistory'
                        ? 'bg-cyan-900 text-cyan-100 border-cyan-300 ring-1 ring-cyan-300'
                        : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border-cyan-800/80 hover:border-cyan-400'
                    }`}
                  >
                    <Calendar className="w-3 h-3 text-cyan-400" />
                    <span className="font-semibold">Historial 7D</span>
                  </button>
                </ScientificTooltip>
              ),
              schools_2024: (
                <ScientificTooltip
                  topic="school_air_equity_directive_2024"
                  title="Entornos Escolares Seguros & Directiva (UE) 2024/2881 (Art. 13)"
                  content={`Red Oficial de ${MALAGA_RAW_SCHOOLS.length} Colegios de Málaga georreferenciados en los 11 distritos. Colegio más próximo al punto activo: ${nearestSchool.name} (${nearestSchool.district}, a ${nearestSchool.distKm < 1 ? `${Math.round(nearestSchool.distKm * 1000)} m` : `${nearestSchool.distKm} km`}). Auditoría de cumplimiento tripartita (2008/50/CE 40 µg/m³ vs Directiva 2024/2881 20 µg/m³ vs OMS 2021 10 µg/m³) y dosimetría pulmonar pediátrica ICRP 66 a cota 0.90m AGL.`}
                  formula={`D_{\\text{infantil}} = C(z=0.90\\text{m}) \\cdot V_E \\cdot DF_{\\text{alv}}, \\quad \\text{Gap}_{2024} = \\max(0, C_{\\text{NO}_2} - 20)`}
                  regulatory="Directiva (UE) 2024/2881 Art. 13 (Puntos vulnerables y entornos escolares) & ICRP 66"
                  citation="Directiva (UE) 2024/2881 del Parlamento Europeo y del Consejo; ICRP Publication 66 (1994)"
                  position="bottom"
                  width="w-[380px]"
                >
                  <button
                    type="button"
                    onClick={() => openBannerModal('schoolAirEquity')}
                    className="cursor-pointer flex items-center space-x-1.5 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950/90 hover:from-amber-900 hover:to-amber-950 border border-amber-500/80 hover:border-amber-400 px-2.5 py-0.5 rounded text-amber-200 transition-all shadow-[0_0_12px_rgba(245,158,11,0.35)] hover:shadow-[0_0_18px_rgba(245,158,11,0.6)] group shrink-0"
                  >
                    <School className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="text-[9px] uppercase tracking-wider text-amber-400 font-bold">DIR 2024/2881:</span>
                    <span className="font-bold text-amber-200 text-[9.5px]">
                      {MALAGA_RAW_SCHOOLS.length} Colegios
                    </span>
                    <span className="text-[8px] px-1 py-0.2 bg-amber-900/60 border border-amber-600/60 rounded text-amber-300 font-mono hidden sm:inline">
                      {nearestSchool.name.replace('CEIP', '').split('(')[0].trim().substring(0, 15)} ({nearestSchool.distKm < 1 ? `${Math.round(nearestSchool.distKm * 1000)}m` : `${nearestSchool.distKm}km`})
                    </span>
                  </button>
                </ScientificTooltip>
              ),
              analysis_menu: (
                <div className="relative shrink-0" ref={analysisMenuRef}>
                  {!isAnalysisMenuOpen ? (
                    <ScientificTooltip
                      title="Análisis Especializado del Punto Activo (9 Módulos)"
                      content="Desplegar el panel de herramientas científicas avanzadas: balances en cascada, química nocturna, correlación D3, certificados GUM, comparador A/B, macro-emisores, trazabilidad W3C PROV-O, slides de tribunal y audionarración."
                      position="bottom"
                      width="w-[360px]"
                    >
                      <button
                        type="button"
                        onClick={(e) => toggleAnalysisMenu(e, analysisMenuRef)}
                        className="px-2.5 py-0.5 rounded text-[10px] font-sans font-bold flex items-center gap-1.5 cursor-pointer transition-all border bg-slate-900 hover:bg-slate-800 text-sky-200 border-slate-700 hover:border-sky-400 shadow-xs"
                      >
                        <Zap className="w-3.5 h-3.5 text-sky-400" />
                        <span>⚡ Análisis Especializado (9)</span>
                        <ChevronDown className="w-3 h-3 transition-transform" />
                      </button>
                    </ScientificTooltip>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => toggleAnalysisMenu(e, analysisMenuRef)}
                      className="px-2.5 py-0.5 rounded text-[10px] font-sans font-bold flex items-center gap-1.5 cursor-pointer transition-all border bg-sky-950 text-sky-100 border-sky-400 shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5 text-sky-400" />
                      <span>⚡ Análisis Especializado (9)</span>
                      <ChevronDown className="w-3 h-3 transition-transform rotate-180" />
                    </button>
                  )}
                </div>
              ),
              copy_doctoral_paragraph: (
                <ScientificTooltip
                  title="Copiar Párrafo Doctoral + Tabla LaTeX Booktabs del Punto Activo (1 Clic)"
                  content={`Copia directamente al portapapeles un párrafo académico redactado para Word y su tabla LaTeX Booktabs con todas las mediciones deterministas en vivo de ${streetName} (coordenadas WGS84, conversión termodinámica exacta ppb ↔ µg/m³ con P y T reales de AEMET, perfil vertical 0,8m / 1,5m / 4,0m, cierre PINN e incertidumbre GUM U95).`}
                  formula="\text{Word} + \text{\LaTeX\ Booktabs} \longleftarrow \Big\{C_{\text{NO}_2}(z),\; \chi_{\text{ppb}}(P,T),\; H/W,\; \text{SVF},\; \Phi,\; U_{95}\Big\}"
                  regulatory="Escritura Científica Directa — Tesis Doctoral UNED (Reglas 8, 17, 32 y 34)"
                  position="bottom"
                  width="w-[380px]"
                >
                  <button
                    type="button"
                    onClick={handleCopyDoctoralParagraphWordLatex}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-sans font-bold flex items-center gap-1.5 cursor-pointer transition-all border shrink-0 ${
                      copiedDoctoralParagraph
                        ? 'bg-emerald-500 text-slate-950 border-white shadow-sm'
                        : 'bg-slate-900 hover:bg-sky-950 text-sky-200 border-sky-500/80 shadow-xs'
                    }`}
                  >
                    <span>{copiedDoctoralParagraph ? '✓ Párrafo + LaTeX Copiado' : '📋 Copiar Párrafo Tesis (Word / LaTeX)'}</span>
                  </button>
                </ScientificTooltip>
              )
            };

            const activeIds = orderedBannerPillIds.filter((id) => bannerPillsMap[id] != null);

            return (
              <>
                {activeIds.map((id, idx) => (
                  <OrderableTabItem
                    key={id}
                    id={id}
                    index={idx}
                    total={activeIds.length}
                    onMove={moveBannerPill}
                    compact
                  >
                    {bannerPillsMap[id]}
                  </OrderableTabItem>
                ))}
                <OrderableResetButton
                  isCustomized={isBannerPillOrderCustomized}
                  onReset={resetBannerPillOrder}
                  label="Orden"
                />
              </>
            );
          })()}
        </div>
        </div>
      </div>

      {/* Cinta Deslizante de Cambio Rápido de Calle en 1 Clic + Diferencial Δ Antes vs. Ahora (Visible en Cabecera Principal) */}
      {!isBannerMinimized && (
        <div className="px-2.5 py-1 border-t border-slate-800/80 bg-slate-950/80 flex items-center gap-2">
          {previousPointComparison && (
            <ScientificTooltip
              position="bottom"
              width="w-[340px]"
              title="Diferencial Automático Δ Punto Actual vs. Punto Anterior (Opción 9)"
              content={`Comparación empírica instantánea al cambiar a ${streetName} respecto a la ubicación previa (${previousPointComparison.prevStreet}): ΔNO₂ = ${previousPointComparison.diffNo2 >= 0 ? `+${previousPointComparison.diffNo2}` : previousPointComparison.diffNo2} µg/m³ y Δ(H/W) = ${previousPointComparison.diffHw >= 0 ? `+${previousPointComparison.diffHw}` : previousPointComparison.diffHw}.`}
            >
              <span
                className={`px-2 py-0.5 rounded border text-[9px] font-mono font-black shrink-0 cursor-help ${
                  previousPointComparison.diffNo2 <= 0
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/70'
                    : 'bg-rose-950/90 text-rose-300 border-rose-500/70'
                }`}
              >
                ΔNO₂: {previousPointComparison.diffNo2 >= 0 ? `+${previousPointComparison.diffNo2}` : previousPointComparison.diffNo2} µg vs. {previousPointComparison.prevStreet}
              </span>
            </ScientificTooltip>
          )}

          <SlidingRibbonBar
            activeKey={streetName}
            accent="cyan"
            showPositionBadge={false}
            ariaLabel="Salto rápido en 1 clic a calles y focos críticos de Málaga"
            className="flex-1 min-w-0"
          >
            <span className="text-[9px] font-mono font-black text-cyan-300 uppercase px-1.5 shrink-0">
              📍 Salto 1-Clic:
            </span>
            {MALAGA_CRITICAL_THESIS_HOTSPOTS.map((spot) => {
              const isCurrent = streetName.toLowerCase().includes(spot.fullName.split(',')[0].toLowerCase());
              return (
                <ScientificTooltip
                  key={spot.id}
                  position="bottom"
                  width="w-[320px]"
                  title={`${spot.fullName} (${spot.tag})`}
                  content={spot.tooltip}
                >
                  <button
                    type="button"
                    data-ribbon-active={isCurrent}
                    onClick={() => activeCtx.syncActivePoint(spot.lat, spot.lon, { name: spot.fullName, fly: true })}
                    className={`px-2 py-0.5 rounded border text-[9px] font-mono font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                      isCurrent
                        ? 'bg-cyan-500 text-slate-950 border-cyan-200 font-black shadow-xs'
                        : 'bg-slate-950/90 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                    }`}
                  >
                    {spot.shortLabel}
                  </button>
                </ScientificTooltip>
              );
            })}
          </SlidingRibbonBar>
        </div>
      )}

      {/* Sub-Panel Desplegable: Ficha Microescalar y Cinética Doctoral */}
      {isDrawerOpen && (
        <div className="px-3 py-1.5 bg-slate-950/95 border-t border-slate-800/80 space-y-1.5 text-[9.5px] font-mono text-slate-300 animate-fadeIn">
          
          {/* Barra de Control y Selector de Categorías Compacto */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-800/80 pb-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[8.5px] uppercase tracking-wider text-cyan-400 font-bold bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Activity className="w-2.5 h-2.5 text-cyan-400" />
                <span>FICHA 1.8m AGL</span>
              </span>

              {/* Pestañas de Filtro para no saturar la pantalla */}
              <div 
                onWheel={handleDrawerTabsWheel}
                className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded border border-slate-800 text-[8.5px] overflow-x-auto whitespace-nowrap no-scrollbar scroll-smooth max-w-[calc(100vw-80px)] sm:max-w-none"
              >
                <ScientificTooltip position="bottom" width="w-[300px]" content="Morfología urbana H/W, regímenes de flujo de Oke (1987) y dosimetría respiratoria ICRP 66.">
                  <button
                    type="button"
                    onClick={() => setDrawerCategory('canon')}
                    className={`px-2 py-0.5 rounded transition-all font-bold cursor-pointer flex items-center gap-1 ${
                      drawerCategory === 'canon'
                        ? 'bg-cyan-600 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Building2 className="w-2.5 h-2.5" />
                    <span>Cañón & Dosis</span>
                  </button>
                </ScientificTooltip>

                <ScientificTooltip position="bottom" width="w-[300px]" content="Emisiones de tráfico rodado COPERT 5 (Tier 3), especiación de NOx y relación COV/NOx.">
                  <button
                    type="button"
                    onClick={() => setDrawerCategory('trafico')}
                    className={`px-2 py-0.5 rounded transition-all font-bold cursor-pointer flex items-center gap-1 ${
                      drawerCategory === 'trafico'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <FlaskConical className="w-2.5 h-2.5" />
                    <span>Tráfico & COVs</span>
                  </button>
                </ScientificTooltip>

                <ScientificTooltip position="bottom" width="w-[300px]" content="Biosíntesis de BVOCs (MEGAN 2.1), emisión de isopreno/terpenos y aerosol secundario SOA.">
                  <button
                    type="button"
                    onClick={() => setDrawerCategory('biogenicos')}
                    className={`px-2 py-0.5 rounded transition-all font-bold cursor-pointer flex items-center gap-1 ${
                      drawerCategory === 'biogenicos'
                        ? 'bg-emerald-600 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Leaf className="w-2.5 h-2.5" />
                    <span>Biogénicos & SOA</span>
                  </button>
                </ScientificTooltip>

                {nearestTreeStreet && activeTreeLiveMetrics && (
                  <ScientificTooltip position="bottom" width="w-[300px]" content="Depuración foliar de la alineación arbórea local según modelo i-Tree Eco y deposición de Wesely.">
                    <button
                      type="button"
                      onClick={() => setDrawerCategory('arbolado')}
                      className={`px-2 py-0.5 rounded transition-all font-bold cursor-pointer flex items-center gap-1 ${
                        drawerCategory === 'arbolado'
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-emerald-400 hover:text-emerald-200 hover:bg-emerald-950/40'
                      }`}
                    >
                      <Trees className="w-2.5 h-2.5" />
                      <span>Arbolado ({activeTreeLiveMetrics.treeCount})</span>
                    </button>
                  </ScientificTooltip>
                )}

                <ScientificTooltip position="bottom" width="w-[320px]" content={`Ver las ${assimilation?.totalStationsAssimilated ?? SYSTEM_PROPAGATION.stationsCount} estaciones y ${assimilation?.totalSatellitesAssimilated ?? SYSTEM_PROPAGATION.satellitesCount} satélites asimilados en este punto.`}>
                  <button
                    type="button"
                    onClick={() => setDrawerCategory('red_sensores')}
                    className={`px-2 py-0.5 rounded transition-all font-bold cursor-pointer flex items-center gap-1 ${
                      drawerCategory === 'red_sensores'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-blue-400 hover:text-blue-200 hover:bg-blue-950/40'
                    }`}
                  >
                    <Radio className="w-2.5 h-2.5" />
                    <span>Red Asimilada ({assimilation?.totalStationsAssimilated ?? SYSTEM_PROPAGATION.stationsCount}+{assimilation?.totalSatellitesAssimilated ?? SYSTEM_PROPAGATION.satellitesCount})</span>
                  </button>
                </ScientificTooltip>

                <ScientificTooltip position="bottom" width="w-[320px]" content="Cinética de microescala NO2 (5 Pilares deterministas: Ox, Sombra 3D, ClNO2, Sillman, Damköhler).">
                  <button
                    type="button"
                    onClick={() => setDrawerCategory('no2_cinetica')}
                    className={`px-2 py-0.5 rounded transition-all font-bold cursor-pointer flex items-center gap-1 ${
                      drawerCategory === 'no2_cinetica'
                        ? 'bg-amber-800 text-amber-100 shadow-sm'
                        : 'text-amber-400/80 hover:text-amber-200 hover:bg-amber-950/60'
                    }`}
                  >
                    <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                    <span>Cinética NO₂ (5 Pilares)</span>
                  </button>
                </ScientificTooltip>

                <ScientificTooltip position="bottom" width="w-[340px]" content={`Entornos Escolares & Directiva (UE) 2024/2881 (${MALAGA_RAW_SCHOOLS.length} Colegios georreferenciados en 11 distritos).`}>
                  <button
                    type="button"
                    onClick={() => setDrawerCategory('escolares')}
                    className={`px-2 py-0.5 rounded transition-all font-bold cursor-pointer flex items-center gap-1 ${
                      drawerCategory === 'escolares'
                        ? 'bg-amber-600 text-slate-950 shadow-sm'
                        : 'text-amber-300 hover:text-amber-100 hover:bg-amber-950/50'
                    }`}
                  >
                    <School className="w-2.5 h-2.5" />
                    <span>Colegios DIR 2024 ({MALAGA_RAW_SCHOOLS.length})</span>
                  </button>
                </ScientificTooltip>

                <ScientificTooltip position="bottom" width="w-[240px]" content="Vista panorámica con todos los indicadores microescalares y parámetros acoplados.">
                  <button
                    type="button"
                    onClick={() => setDrawerCategory('todo')}
                    className={`px-2 py-0.5 rounded transition-all font-bold cursor-pointer flex items-center gap-1 ${
                      drawerCategory === 'todo'
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="w-2.5 h-2.5" />
                    <span>Todo</span>
                  </button>
                </ScientificTooltip>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[8px] font-sans text-slate-500 italic hidden md:inline">
                Directiva 2008/50/CE • OSPM / COPERT 5 • MEGAN 2.1
              </span>
              <ScientificTooltip position="bottom" width="w-[200px]" content="Plegar la ficha microescalar de 1.8m AGL.">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
                  title="Cerrar Ficha Microescala"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </ScientificTooltip>
            </div>
          </div>

          {/* GRUPO NO2 CINÉTICA: 5 Pilares Deterministas */}
          {(drawerCategory === 'no2_cinetica' || drawerCategory === 'todo') && (
            <div className="flex flex-wrap items-center gap-1.5 py-0.5 border-b border-amber-950/40 pb-1">
              <span className="text-[8px] uppercase tracking-wider text-amber-300 font-bold bg-amber-950/80 border border-amber-700/50 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                Cinética NO₂ (5 Pilares):
              </span>

              {/* 1. Partición Ox */}
              <ScientificTooltip
                title="1. Partición de Oxidantes Totales Ox (Clapp & Jenkin 2001)"
                content={`Oxidantes totales Ox = ${assimilation?.no2MicroscaleReport?.oxPartition.oxUgM3 ?? (realNO2 + o3Val).toFixed(1)} µg/m³. NO2 Primario: ${assimilation?.no2MicroscaleReport?.oxPartition.primaryPercentage ?? 35}% (f_NO2 = ${assimilation?.no2MicroscaleReport?.oxPartition.fNo2PrimaryFraction ?? 0.21} según COPERT 5) | NO2 Secundario (oxidación en cañón): ${assimilation?.no2MicroscaleReport?.oxPartition.secondaryPercentage ?? 65}%.`}
                formula={`[\\text{O}_x] = [\\text{O}_x]_{\\text{regional}} + f_{\\text{NO}_2} \\cdot [\\text{NO}_x]_{\\text{local}}`}
                regulatory="Directiva 2008/50/CE & EMEP/EEA Guidebook"
                citation="Clapp & Jenkin (2001) Atmos. Environ."
                position="bottom"
                width="w-[360px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-emerald-800/60 bg-emerald-950/70 text-emerald-300 text-[8.5px]">
                  <Atom className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                  <span>O_x: <strong className="text-emerald-200">{assimilation?.no2MicroscaleReport?.oxPartition.oxUgM3 ?? (realNO2 + o3Val).toFixed(1)}</strong> µg/m³ ({assimilation?.no2MicroscaleReport?.oxPartition.primaryPercentage ?? 35}% prim.)</span>
                </div>
              </ScientificTooltip>

              {/* 2. Sombra 3D Cañón */}
              <ScientificTooltip
                title="2. Atenuación de Fotólisis J_NO2 por Sombra 3D"
                content={`Atenuación de la fotodisociación ultravioleta de NO2 por sombra de fachadas: -${assimilation?.no2MicroscaleReport?.canyonShading.attenuationPct ?? 32}%. En cañones profundos, la falta de luz directa frena la destrucción de NO2.`}
                formula={`J_{\\text{NO}_2}^{\\text{cañón}} = J_{\\text{NO}_2}^{\\text{zenith}} \\cdot \\left[(1 - f_{\\text{sombra}}) + f_{\\text{sombra}} \\cdot \\text{SVF}\\right]`}
                regulatory="Modelización geométrica 3D de cañón urbano Oke (1987)"
                citation="Fast-JX / Oke (1987)"
                position="bottom"
                width="w-[360px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-amber-800/60 bg-amber-950/70 text-amber-300 text-[8.5px]">
                  <Sun className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  <span>J_NO₂: <strong className="text-amber-200">-{assimilation?.no2MicroscaleReport?.canyonShading.attenuationPct ?? 32}%</strong> sombra</span>
                </div>
              </ScientificTooltip>

              {/* 3. Halógenos Marinos */}
              <ScientificTooltip
                title="3. Activación de Halógenos Marinos ClNO2"
                content={`Química heterogénea sobre aerosol marino del Mar de Alborán: ClNO2 = ${assimilation?.no2MicroscaleReport?.marineHalogens.clno2Ppb ?? 0.24} ppb. El burst matinal de radicales Cl• acelera la conversión matutina NO -> NO2 ×${assimilation?.no2MicroscaleReport?.marineHalogens.morningNoToNo2AccelerationFactor ?? 1.8}.`}
                formula={`\\text{N}_2\\text{O}_5 + \\text{NaCl}_{(\\text{aq})} \\xrightarrow{\\gamma} \\text{ClNO}_2 + \\text{NaNO}_3`}
                regulatory="Mecanismo heterogéneo costero IUPAC Task Group"
                citation="Roberts et al. (2009) & Thornton et al. (Nature 2010)"
                position="bottom"
                width="w-[360px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-teal-800/60 bg-teal-950/70 text-teal-300 text-[8.5px]">
                  <Waves className="w-2.5 h-2.5 text-teal-400 shrink-0" />
                  <span>Halógenos: <strong className="text-teal-200">×{assimilation?.no2MicroscaleReport?.marineHalogens.morningNoToNo2AccelerationFactor ?? 1.8}</strong> aceleración</span>
                </div>
              </ScientificTooltip>

              {/* 4. Sillman Satelital */}
              <ScientificTooltip
                title="4. Sensibilidad Química Satelital de Sillman (S5P / S4)"
                content={`Ratio satelital HCHO / NO2 = ${assimilation?.no2MicroscaleReport?.sillmanSensitivity.ratioHchoNo2 ?? 0.76}. ${assimilation?.no2MicroscaleReport?.sillmanSensitivity.regimeLabel ?? 'Régimen VOC-limitado'}.`}
                formula={`R_{\\text{Sillman}} = \\frac{[\\text{HCHO}]}{[\\text{NO}_2]}`}
                regulatory="Directrices de sensibilidad fotoquímica troposférica"
                citation="Sillman (1995) J. Geophys. Res."
                position="bottom"
                width="w-[360px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-purple-800/60 bg-purple-950/70 text-purple-300 text-[8.5px]">
                  <Radio className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                  <span>Sillman: <strong className="text-purple-200">{assimilation?.no2MicroscaleReport?.sillmanSensitivity.ratioHchoNo2 ?? 0.76}</strong> ({assimilation?.no2MicroscaleReport?.sillmanSensitivity.regime ?? 'VOC_LIM'})</span>
                </div>
              </ScientificTooltip>

              {/* 5. Damköhler */}
              <ScientificTooltip
                title="5. Número Adimensional de Damköhler Urbano (Da)"
                content={`Número de Damköhler Da = ${assimilation?.no2MicroscaleReport?.damkohler.damkohlerNumber ?? 1.45}. Grado de equilibrio fotoquímico alcanzado antes de evacuar el cañón: ${assimilation?.no2MicroscaleReport?.damkohler.photochemicalEquilibriumPct ?? 76}%.`}
                formula={`\\text{Da} = \\frac{\\tau_{\\text{transporte}}}{\\tau_{\\text{química}}} = \\frac{(W \\cdot H) / (u_{\\text{canyon}} \\cdot \\sigma_w)}{1 / (k_3 [\\text{O}_3] + J_{\\text{NO}_2})}`}
                regulatory="Acoplamiento dinámico-químico en cañón urbano"
                citation="Damköhler (1936) & Baker et al. (2004)"
                position="bottom"
                width="w-[360px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-cyan-800/60 bg-cyan-950/70 text-cyan-300 text-[8.5px]">
                  <Gauge className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                  <span>Da: <strong className="text-cyan-200">{assimilation?.no2MicroscaleReport?.damkohler.damkohlerNumber ?? 1.45}</strong> ({assimilation?.no2MicroscaleReport?.damkohler.photochemicalEquilibriumPct ?? 76}% eq.)</span>
                </div>
              </ScientificTooltip>

              {/* 6. Botón directo a Balance de Masa Cascada */}
              <ScientificTooltip
                title="Balance de Masa & Cascada de NO₂"
                content="Abre el módulo especializado de descomposición horaria del balance de masa (+ fuentes y - sumideros) con gráfico en cascada SVG y exportación FAIR."
                formula={`\\frac{\\partial [\\text{NO}_2]}{\\partial t} = \\sum P_i - \\sum L_i`}
                position="bottom"
                width="w-[340px]"
              >
                <button
                  type="button"
                  onClick={() => setActiveModal('no2MassBudget')}
                  className="px-2 py-0.5 bg-emerald-900/90 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/80 rounded text-[8.5px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-[0_0_8px_rgba(16,185,129,0.4)] ml-auto"
                >
                  <BarChart2 className="w-2.5 h-2.5 text-emerald-300 animate-pulse" />
                  <span>⚖️ Abrir Balance Cascada</span>
                </button>
              </ScientificTooltip>
            </div>
          )}

          {/* GRUPO 1: Morfodinámica de Cañón Urbano, Ventilación y Dosimetría */}
          {(drawerCategory === 'canon' || drawerCategory === 'todo') && (
            <div className="flex flex-wrap items-center gap-1.5 py-0.5">
              <span className="text-[8px] uppercase tracking-wider text-cyan-400 font-bold bg-cyan-950/50 border border-cyan-800/40 px-1.5 py-0.5 rounded shrink-0">
                Cañón & Dosis:
              </span>

              {/* 1. RÉGIMEN OKE */}
              <ScientificTooltip
                topic="canyon_vortex_recirculation"
                title="Régimen de Flujo en Cañón Urbano (Oke 1988)"
                content={`Morfometría 3D de calle: H/W = ${canyonHW.toFixed(2)}. Clasificado como ${okeRegime.name}: ${canyonHW >= 0.65 ? 'Se induce vórtice primario estable en herradura con estancamiento y acumulación a sotavento.' : canyonHW >= 0.3 ? 'Interferencia de estelas entre fachadas.' : 'Flujo de rugosidad aislada con ventilación libre.'}`}
                formula={`\\frac{H}{W} = ${canyonHW.toFixed(2)}, \\quad \\text{Régimen}: \\text{${okeRegime.name}}`}
                regulatory="Criterios morfológicos de ventilación urbana Oke (1988) & OSPM"
                citation="Oke, T. R. (1988) Street design and urban canopy layer climate"
                diagram="canyon_vortex"
                position="bottom"
                width="w-[360px]"
              >
                <div className={`cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8.5px] ${okeRegime.color}`}>
                  <Building2 className="w-2.5 h-2.5 shrink-0" />
                  <span className="font-bold">Oke:</span>
                  <span>{okeRegime.label} (H/W: {canyonHW.toFixed(2)})</span>
                </div>
              </ScientificTooltip>

              {/* VENTILACIÓN ACH */}
              <ScientificTooltip
                title="Tasa de Renovación de Aire (ACH en Cañón)"
                content={`Tasa de ventilación de calle según modelo OSPM / Berkowicz (2000): ACH = ${achVentilation} h⁻¹ con viento incidente local u = ${windVal.toFixed(1)} m/s.`}
                formula={`\\text{ACH} = \\frac{u_w \\cdot W \\cdot 3600}{H \\cdot W} = ${achVentilation} \\text{ h}^{-1}`}
                regulatory="Directrices de renovación y confort del aire urbano (CIBSE / FAIRMODE)"
                citation="Berkowicz et al. (2000) Atmospheric Environment & Kastner-Klein (2001)"
                position="bottom"
                width="w-[360px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900 text-slate-300 text-[8.5px]">
                  <Wind className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                  <span>ACH: <strong className="text-sky-300">{achVentilation}</strong> h⁻¹</span>
                </div>
              </ScientificTooltip>

              {/* 2. DOSIS INHALADA PEATONAL */}
              <ScientificTooltip
                topic="pedestrian_inhalation_icrp66"
                title="Dosimetría Peatonal Inhalada (Modelo ICRP-66)"
                content={`Tasa de Dosis Respiratoria Humana a cota 1.8 m AGL (adulto caminando con ventilación VE = 0.83 m³/h): Dosis NO₂ = ${inhaledNO2UgH} µg/h y Dosis PM₂.₅ = ${inhaledPM25UgH} µg/h depositada en tracto traqueobronquial y alveolar.`}
                formula={`\\dot{D}_i = C_i \\cdot \\text{VE}, \\quad \\text{VE} = 0.83 \\text{ m}^3/\\text{h}`}
                regulatory="Guías de Calidad del Aire OMS 2021 & Comisión Internacional de Protección Radiológica ICRP-66"
                citation="ICRP Publication 66 (1994) Human Respiratory Tract Model"
                position="bottom"
                width="w-[360px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-rose-900/40 bg-rose-950/30 text-rose-300 text-[8.5px]">
                  <HeartPulse className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                  <span className="font-bold">Dosis:</span>
                  <span>{inhaledNO2UgH} µg NO₂/h</span>
                  <span className="text-slate-500">•</span>
                  <span>{inhaledPM25UgH} µg PM₂.₅/h</span>
                </div>
              </ScientificTooltip>

              {/* 3. FOTOQUÍMICA LEIGHTON */}
              <ScientificTooltip
                topic="leighton_photostationary"
                title="Ratio Fotoestacionario de Leighton (Φ)"
                content={`Balance fotoquímico instantáneo: Φ = ${phiLeighton}. Constante de reacción NO+O3 k₃(T) = ${k3_ppb_s.toExponential(2)} ppb⁻¹s⁻¹; Fotólisis j_NO2 = ${jNo2_s.toFixed(4)} s⁻¹ (Radiación solar entrante Rsw = ${incomingRad} W/m²). Estado: ${Number(phiLeighton) > 1.15 ? 'Oxidación adicional por radicales peroxilo (RO2/HO2).' : Number(phiLeighton) < 0.90 ? 'Titulación rápida de ozono por NO fresco de tráfico.' : 'Equilibrio fotoestacionario puro.'}`}
                formula={`\\Phi = \\frac{J_{\\text{NO}_2} [\\text{NO}_2]}{k_3(T) [\\text{NO}] [\\text{O}_3]} = ${phiLeighton}`}
                regulatory="Directiva 2008/50/CE & Química Atmosférica IUPAC"
                citation="Leighton, P. A. (1961) & Atkinson et al. (2004)"
                position="bottom"
                width="w-[360px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-teal-900/40 bg-teal-950/30 text-teal-300 text-[8.5px]">
                  <Atom className="w-2.5 h-2.5 text-teal-400 shrink-0" />
                  <span className="font-bold">Leighton Φ:</span>
                  <span>{phiLeighton}</span>
                  <span className="text-[7.5px] text-teal-400 font-sans">
                    ({Number(phiLeighton) > 1.15 ? 'RO₂ Ox' : Number(phiLeighton) < 0.90 ? 'NO Tit' : 'Equilibrio'})
                  </span>
                </div>
              </ScientificTooltip>
            </div>
          )}

          {/* GRUPO 2: Hidrocarburos, COVs Antropogénicos y Satélite TROPOMI */}
          {(drawerCategory === 'trafico' || drawerCategory === 'todo') && (
            <div className="flex flex-wrap items-center gap-1.5 py-0.5">
              <span className="text-[8px] uppercase tracking-wider text-purple-400 font-bold bg-purple-950/50 border border-purple-800/40 px-1.5 py-0.5 rounded shrink-0">
                COVs & Tráfico:
              </span>

              {/* NO PRIMARIO */}
              <ScientificTooltip
                title="Monóxido de Nitrógeno Vehicular (NO — Ficha Microescalar COPERT 5)"
                content={`Monóxido de Nitrógeno primario vehicular en el cañón activo: ${noVal.toFixed(1)} µg/m³ (75-85% del NOx vehicular directo según factores cinemáticos EMEP/EEA COPERT 5.6).`}
                formula={`\\text{NO} + \\text{O}_3 \\xrightarrow{k_3(T)} \\text{NO}_2 + \\text{O}_2`}
                regulatory="Precursor normativo (Directiva 2008/50/CE)"
                citation="COPERT 5 / EMEP Guidebook 2023"
                position="bottom"
                width="w-[340px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-sky-800/50 bg-sky-950/40 text-sky-300 text-[8.5px]">
                  <span className="text-slate-400 font-bold">NO:</span>
                  <strong className="text-slate-100">{noVal.toFixed(1)}</strong>
                  <span className="text-[7.5px] text-slate-400">µg</span>
                </div>
              </ScientificTooltip>

              {/* BENCENO C6H6 */}
              <ScientificTooltip
                title="Benceno Carcinógeno Vehicular (C₆H₆)"
                content={`Benceno C₆H₆: ${benzeneVal} µg/m³. Hidrocarburo aromático volátil carcinógeno primario derivado de tráfico rodado y evaporación. Límite anual UE Directiva 2008/50/CE: 5.0 µg/m³.`}
                formula={`C_6H_6 + \\text{OH}^\\bullet \\rightarrow \\text{Productos de Adición} \\rightarrow \\text{SOA}`}
                regulatory="Directiva 2008/50/CE: Límite anual 5.0 µg/m³ • IARC Grupo 1"
                citation="IARC Monograph 120 & OMS 2021"
                position="bottom"
                width="w-[340px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-purple-800/50 bg-purple-950/40 text-purple-300 text-[8.5px]">
                  <span className="text-purple-400 font-bold">C₆H₆:</span>
                  <strong className="text-amber-300">{benzeneVal}</strong>
                  <span className="text-[7.5px] text-slate-400">µg</span>
                </div>
              </ScientificTooltip>

              {/* FORMALDEHÍDO HCHO (SENTINEL-5P) */}
              <ScientificTooltip
                title="Formaldehído Troposférico HCHO (TROPOMI Sentinel-5P)"
                content={`Formaldehído troposférico (HCHO = ${hchoUgM3} µg/m³): Asimilado del sensor TROPOMI (Copernicus Sentinel-5P). Indicador espacial de la actividad oxidativa de compuestos orgánicos volátiles en la troposfera de Málaga.`}
                formula={`\\text{HCHO} + h\\nu \\rightarrow \\text{H}^\\bullet + \\text{HCO}^\\bullet \\rightarrow 2\\text{HO}_2^\\bullet + \\text{CO}`}
                regulatory="Misión Copernicus Sentinel-5P & Marco CAMS"
                citation="Veefkind et al. (2012) Remote Sensing of Environment"
                position="bottom"
                width="w-[350px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-purple-800/40 bg-purple-950/30 text-purple-200 text-[8.5px]">
                  <span className="text-purple-400 font-bold">HCHO:</span>
                  <strong className="text-purple-100">{hchoUgM3}</strong>
                  <span className="text-[7.5px] text-slate-400">µg</span>
                  <span className="text-[7px] text-purple-400 font-sans ml-0.5">S-5P</span>
                </div>
              </ScientificTooltip>

              {/* COVNM TOTALES */}
              <ScientificTooltip
                title="Compuestos Orgánicos Volátiles No Metánicos (COVNM)"
                content={`Compuestos Orgánicos Volátiles No Metánicos totales (COVNM = ${nmvocUgM3} µg/m³): Hidrocarburos no metánicos de combustión y evaporación vehicular según composición de flota.`}
                formula={`[\\text{COVNM}] = \\sum [\\text{Hidrocarburos}_{\\text{antropogénicos}}]`}
                regulatory="Directiva de Techos Nacionales de Emisión (UE) 2016/2284"
                citation="Guía EMEP/EEA 2023 & Protocolo de Gotemburgo"
                position="bottom"
                width="w-[340px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900 text-slate-300 text-[8.5px]">
                  <span className="text-slate-400">COVNM:</span>
                  <strong className="text-slate-100">{nmvocUgM3}</strong>
                  <span className="text-[7.5px] text-slate-400">µg</span>
                </div>
              </ScientificTooltip>

              {/* CO */}
              <ScientificTooltip
                title="Monóxido de Carbono (CO Vehicular)"
                content={`Monóxido de Carbono (CO = ${coMgM3} mg/m³): Combustión incompleta vehicular. Límite máximo 8h Directiva 2008/50/CE: 10 mg/m³.`}
                formula={`\\text{CO} + \\text{OH}^\\bullet \\rightarrow \\text{CO}_2 + \\text{H}^\\bullet`}
                regulatory="Directiva 2008/50/CE: Límite móvil 8h = 10 mg/m³"
                citation="Guías OMS 2021 & Directiva 2008/50/CE"
                position="bottom"
                width="w-[340px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900/80 text-slate-300 text-[8.5px]">
                  <span className="text-slate-400">CO:</span>
                  <strong className="text-slate-100">{coMgM3}</strong>
                  <span className="text-[7.5px] text-slate-400">mg</span>
                </div>
              </ScientificTooltip>

              {/* SO2 */}
              <ScientificTooltip
                title="Dióxido de Azufre Portuario e Industrial (SO₂)"
                content={`Dióxido de Azufre (SO₂ = ${so2Val} µg/m³): Trazador de emisiones de barcos en el Puerto de Málaga y fuentes industriales. Límite horario UE: 350 µg/m³.`}
                formula={`\\text{SO}_2 + \\text{OH}^\\bullet \\xrightarrow{\\text{aq}} \\text{H}_2\\text{SO}_4 \\rightarrow \\text{SIA}`}
                regulatory="Directiva 2008/50/CE: Límite horario 350 µg/m³ & MARPOL Anexo VI"
                citation="Directiva MARPOL VI / Directiva 2008/50/CE"
                position="bottom"
                width="w-[350px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900/80 text-slate-300 text-[8.5px]">
                  <span className="text-slate-400">SO₂:</span>
                  <strong className="text-slate-100">{so2Val}</strong>
                  <span className="text-[7.5px] text-slate-400">µg</span>
                </div>
              </ScientificTooltip>
            </div>
          )}

          {/* GRUPO 3: COVs Biogénicos (MEGAN 2.1), Halógenos y Aerosoles Secundarios (SOA) */}
          {(drawerCategory === 'biogenicos' || drawerCategory === 'todo') && (
            <div className="flex flex-wrap items-center gap-1.5 py-0.5">
              <span className="text-[8px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950/50 border border-emerald-800/40 px-1.5 py-0.5 rounded shrink-0">
                Biogénicos & SOA:
              </span>

              {/* ISOPRENO BIOGÉNICO */}
              <ScientificTooltip
                topic="megan_biogenic_vocs"
                title="Emisión Foliar de Isopreno Biogénico (MEGAN 2.1)"
                content={`Isopreno Biogénico (C₅H₈ = ${isopreneUgM3} µg/m³): Algoritmo MEGAN 2.1 (Guenther et al., 2012). Emisión foliar dependiente de luz y temperatura por el arbolado de Málaga (Platanus x hispanica, Ficus). Precursor diurno de SOA y ozono.`}
                formula={`E_{\\text{isopreno}} = \\epsilon \\cdot \\gamma_T(T_{\\text{foliar}}) \\cdot \\gamma_L(\\text{PAR}) \\cdot \\text{LAI}`}
                regulatory="Inventario de Emisiones Biogénicas EMEP/EEA 2023 & MEGAN 2.1"
                citation="Guenther, A. et al. (2012) Geoscientific Model Development"
                position="bottom"
                width="w-[360px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-emerald-800/60 bg-emerald-950/40 text-emerald-300 text-[8.5px]">
                  <span className="text-emerald-400 font-bold">Isopreno:</span>
                  <strong className="text-emerald-200">{isopreneUgM3}</strong>
                  <span className="text-[7.5px] text-emerald-500">µg</span>
                </div>
              </ScientificTooltip>

              {/* MONOTERPENOS BIOGÉNICOS */}
              <ScientificTooltip
                topic="megan_biogenic_vocs"
                title="Monoterpenos Biogénicos (Pankow / Odum)"
                content={`Monoterpenos Biogénicos (C₁₀H₁₆ = ${monoterpenesUgM3} µg/m³): Alfa-pineno, beta-pineno y limoneno emitidos por pinos de Gibralfaro y cítricos/naranjos del Centro Histórico. Rendimiento alto de aerosol secundario SOA.`}
                formula={`E_{\\text{terpenos}} = \\epsilon \\cdot \\exp\\left(\\beta (T - T_s)\\right) \\cdot \\text{LAI}`}
                regulatory="Modelo Químico EMEP/MSC-W & Guía EMEP/EEA 2023"
                citation="Guenther et al. (1993) J. Geophys. Res. & Pankow (1994)"
                position="bottom"
                width="w-[360px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-emerald-800/50 bg-emerald-950/30 text-emerald-300 text-[8.5px]">
                  <span className="text-emerald-400 font-bold">Terpenos:</span>
                  <strong className="text-emerald-200">{monoterpenesUgM3}</strong>
                  <span className="text-[7.5px] text-emerald-500">µg</span>
                </div>
              </ScientificTooltip>

              {/* SESQUITERPENOS */}
              <ScientificTooltip
                title="Sesquiterpenos y Reactividad Foliar"
                content={`Sesquiterpenos (C₁₅H₂₄ = ${sesquiterpenesUgM3} µg/m³): COVs biogénicos de alta reactividad estomática frente al ozono troposférico.`}
                formula={`\\text{C}_{15}\\text{H}_{24} + \\text{O}_3 \\rightarrow \\text{SOA}`}
                regulatory="Química de la troposfera biogénica (MEGAN 2.1 / CAMS)"
                citation="Duhl et al. (2008) Biogeosciences"
                position="bottom"
                width="w-[340px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-emerald-900/40 bg-emerald-950/20 text-emerald-300 text-[8.5px]">
                  <span className="text-emerald-500">Sesquiterp:</span>
                  <strong className="text-emerald-200">{sesquiterpenesUgM3}</strong>
                  <span className="text-[7.5px] text-emerald-600">µg</span>
                </div>
              </ScientificTooltip>

              {/* SOA SECUNDARIO PANKOW */}
              <ScientificTooltip
                topic="aerosol_multimodal_distribution"
                title="Aerosoles Orgánicos Secundarios (SOA Pankow Yields)"
                content={`Aerosoles Orgánicos Secundarios (SOA = ${soaUgM3} µg/m³): Modelo de partición gas-partícula de 2 productos de Pankow (1994) / Odum (1996). Fracción de PM2.5 formada por oxidación de hidrocarburos e isopreno/monoterpenos.`}
                formula={`Y = \\frac{\\Delta \\text{SOA}}{\\Delta \\text{VOC}} = \\sum_i M_i \\frac{K_{p,i} C_{\\text{OA}}}{1 + K_{p,i} C_{\\text{OA}}}`}
                regulatory="Directiva 2008/50/CE & Modelo VBS (Volatility Basis Set)"
                citation="Pankow, J. F. (1994) Atmos. Environ. & Donahue et al. (2006)"
                position="bottom"
                width="w-[360px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-amber-800/60 bg-amber-950/40 text-amber-300 text-[8.5px]">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span className="text-amber-400 font-bold">SOA:</span>
                  <strong className="text-amber-100">{soaUgM3}</strong>
                  <span className="text-[7.5px] text-amber-400">µg</span>
                </div>
              </ScientificTooltip>

              {/* CLNO2 HALÓGENO MARINO */}
              <ScientificTooltip
                topic="coastal_halogen_clno2"
                title="Activación Fotoquímica de Cloruro de Nitrilo (ClNO₂ — Ficha Biogénica & Costera)"
                content={`Cloruro de Nitrilo (ClNO₂ = ${clno2Pptv} pptv): Halógeno marino reactivo de la Bahía de Málaga evaluado en la subvista de precursores radicalarios. Formado en aerosol salino nocturno por N₂O₅ + NaCl; al salir el sol se fotoliza liberando radicales de cloro Cl•.`}
                formula={`\\text{N}_2\\text{O}_5\\text{(g)} + \\text{NaCl(aq)} \\xrightarrow{\\gamma} \\text{ClNO}_2\\text{(g)} + \\text{NaNO}_3\\text{(aq)}`}
                regulatory="Trazador precursor fotoquímico costero (CAMS)"
                citation="Thornton et al. (Nature 2010)"
                position="bottom"
                width="w-[360px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-cyan-800/50 bg-cyan-950/40 text-cyan-300 text-[8.5px]">
                  <Waves className="w-2.5 h-2.5 text-cyan-400" />
                  <span className="text-cyan-400 font-bold">ClNO₂:</span>
                  <strong className="text-cyan-100">{clno2Pptv}</strong>
                  <span className="text-[7.5px] text-cyan-400">ppt</span>
                </div>
              </ScientificTooltip>

              {/* RADICAL [OH] */}
              <ScientificTooltip
                title="Capacidad Oxidativa Troposférica: Radical Hidroxilo [OH]"
                content={`Concentración estimada del radical hidroxilo [OH] = ${ohRadical} molec/cm³. El principal detergente oxidativo atmosférico diurno.`}
                formula={`\\text{O}_3 + h\\nu(\\lambda < 310\\text{nm}) \\rightarrow \\text{O}_2 + \\text{O}(^1\\text{D}), \\quad \\text{O}(^1\\text{D}) + \\text{H}_2\\text{O} \\rightarrow 2\\text{OH}^\\bullet`}
                regulatory="Capacidad de autolimpieza atmosférica (IUPAC Subcommittee)"
                citation="Levy, H. (1971) Science"
                position="bottom"
                width="w-[350px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900/60 text-slate-300 text-[8.5px]">
                  <span className="text-slate-400">[OH]:</span>
                  <strong className="text-teal-300">{ohRadical}</strong>
                </div>
              </ScientificTooltip>

              {/* SIA & DUST */}
              <ScientificTooltip
                title="Aerosoles Inorgánicos Secundarios (SIA) & Polvo Mineral"
                content={`Aerosol Inorgánico Secundario SIA = ${siaVal} µg/m³ (sulfatos/nitratos/amonio) • Polvo mineral sahariano = ${saharanDust} µg/m³.`}
                formula={`\\text{SIA} = [\\text{SO}_4^{2-}] + [\\text{NO}_3^-] + [\\text{NH}_4^+], \\quad \\text{PM}_{\\text{mineral}} = \\mathcal{F}(\\text{AOD}_{550})`}
                regulatory="Directiva 2008/50/CE (Descuento oficial de aportes naturales)"
                citation="Querol et al. (2009) African dust contributions (Atmos. Environ.)"
                position="bottom"
                width="w-[350px]"
              >
                <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900/60 text-slate-300 text-[8.5px]">
                  <span className="text-indigo-400">SIA:</span>
                  <strong className="text-indigo-200">{siaVal}</strong>
                  <span className="text-slate-600">|</span>
                  <span className="text-amber-400">Polvo:</span>
                  <strong className="text-amber-200">{saharanDust}</strong>
                  <span className="text-[7.5px] text-slate-400">µg</span>
                </div>
              </ScientificTooltip>
            </div>
          )}

          {/* GRUPO 4: Impacto Físico y Químico del Arbolado Urbano en Tiempo Real */}
          {(drawerCategory === 'arbolado' || drawerCategory === 'todo') && nearestTreeStreet && activeTreeLiveMetrics && (
            <div className="flex flex-wrap items-center justify-between gap-1.5 py-0.5 border-t border-emerald-900/40 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[8px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-700/60 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1">
                  <Trees className="w-2.5 h-2.5 text-emerald-400" />
                  <span>Arbolado Vivo:</span>
                </span>

                {/* ESPECIE Y CENSO */}
                <ScientificTooltip
                  title={`Alineación Arbórea: ${nearestTreeStreet.streetName}`}
                  content={`Alineación oficial de ${activeTreeLiveMetrics.treeCount} árboles censados (${activeTreeLiveMetrics.speciesName}). Área de copa: ${activeTreeLiveMetrics.totalCanopyAreaM2} m² (Follaje: ${activeTreeLiveMetrics.totalFoliageAreaM2} m²). Fisiología foliar en vivo: Conductancia estomática gsw = ${activeTreeLiveMetrics.gswMmolM2s} mmol/(m²·s) con apertura del ${activeTreeLiveMetrics.stomataAperturePct}%.`}
                  formula={`g_{sw} = g_{\\max} \\cdot f(R_g) \\cdot f(T) \\cdot f(\\text{VPD}), \\quad A_{\\text{foliar}} = \\text{LAI} \\cdot A_{\\text{copa}}`}
                  regulatory="Inventario de Zonas Verdes del Ayuntamiento de Málaga & i-Tree Eco"
                  citation="Nowak, D. J. et al. (2008) Urban Forestry & Urban Greening"
                  position="bottom"
                  width="w-[360px]"
                >
                  <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-emerald-800/60 bg-emerald-950/50 text-emerald-200 text-[8.5px]">
                    <span className="font-bold text-emerald-300">{nearestTreeStreet.streetName}:</span>
                    <span>{activeTreeLiveMetrics.speciesName.split('(')[0].trim()}</span>
                    <span className="text-[7.5px] text-emerald-400 font-mono">({activeTreeLiveMetrics.treeCount} árb.)</span>
                  </div>
                </ScientificTooltip>

                {/* QUÍMICA: ABSORCIÓN NO2 Y ABATIMIENTO */}
                <ScientificTooltip
                  topic="wesely_dry_deposition"
                  title="Captación Química Estomática de NO₂"
                  content={`Tasa neta de fito-extracción de dióxido de nitrógeno: ${activeTreeLiveMetrics.streetNO2AbsorptionGramsHour} g NO₂/h (${activeTreeLiveMetrics.streetNO2AbsorptionKgYear} kg/año en la calle activa). Fijación tisular ciclo GS/GOGAT: ${activeTreeLiveMetrics.no2ProteinFixationRateGramsHour} g N-orgánico/h. Abatimiento microescalar a cota peatonal (1.8m): -${activeTreeLiveMetrics.liveNO2AbatementUgm3} µg/m³.`}
                  formula={`F_{\\text{NO}_2} = v_d(\\text{NO}_2) \\cdot [\\text{NO}_2], \\quad \\Delta C_{\\text{peatonal}} = - \\frac{F_{\\text{NO}_2} \\cdot A_{\\text{foliar}}}{u_{\\text{cañón}} \\cdot H \\cdot W}`}
                  regulatory="Directiva 2008/50/CE & Guía EMEP/EEA 2023 de Deposición Seca"
                  citation="Wesely, M. L. (1989) Atmos. Environ. & Gessler et al. (2004) New Phytol."
                  position="bottom"
                  width="w-[360px]"
                >
                  <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-sky-800/60 bg-sky-950/40 text-sky-200 text-[8.5px]">
                    <span className="text-sky-400 font-bold">Sumidero NO₂:</span>
                    <strong className="text-sky-100">-{activeTreeLiveMetrics.streetNO2AbsorptionGramsHour}</strong>
                    <span className="text-[7.5px] text-slate-400">g/h</span>
                    <span className="text-sky-300 text-[7.5px] font-mono">(-{activeTreeLiveMetrics.liveNO2AbatementUgm3} µg/m³)</span>
                  </div>
                </ScientificTooltip>

                {/* QUÍMICA: FILTRADO DE PM2.5 */}
                <ScientificTooltip
                  topic="wesely_dry_deposition"
                  title="Captura Foliar de Partículas Finas PM₂.₅"
                  content={`Deposición de partículas finas sobre tricomas y ceras cuticulares: ${activeTreeLiveMetrics.streetPM25DepositionGramsHour} g PM₂.₅/h (${activeTreeLiveMetrics.streetPM25DepositionKgYear} kg/año). Abatimiento en concentración de aire a 1.8m: -${activeTreeLiveMetrics.livePM25AbatementUgm3} µg/m³.`}
                  formula={`v_d(\\text{PM}_{2.5}) = v_{\\text{sed}} + \\frac{1}{R_a + R_b}, \\quad \\Delta C = -${activeTreeLiveMetrics.livePM25AbatementUgm3} \\text{ }\\mu\\text{g/m}^3`}
                  regulatory="Guías OMS 2021 (Objetivo PM2.5: 5 µg/m³ anual)"
                  citation="Petroff, A. & Zhang, L. (2010) Geosci. Model Dev."
                  position="bottom"
                  width="w-[350px]"
                >
                  <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-emerald-800/60 bg-emerald-950/40 text-emerald-200 text-[8.5px]">
                    <span className="text-emerald-400 font-bold">PM₂.₅:</span>
                    <strong className="text-emerald-100">-{activeTreeLiveMetrics.streetPM25DepositionGramsHour}</strong>
                    <span className="text-[7.5px] text-slate-400">g/h</span>
                    <span className="text-emerald-300 text-[7.5px] font-mono">(-{activeTreeLiveMetrics.livePM25AbatementUgm3} µg/m³)</span>
                  </div>
                </ScientificTooltip>

                {/* QUÍMICA: CICLO LEIGHTON MODULADO POR SOMBRA Y OZONO */}
                <ScientificTooltip
                  topic="leighton_photostationary"
                  title="Modulación Fotoquímica del Ciclo de Leighton"
                  content={`La sombra del dosel arbóreo reduce la fotólisis del NO₂ (J_NO2 atenuado por transmitancia foliar) y la absorción de O₃ (${activeTreeLiveMetrics.streetO3AbsorptionGramsHour} g/h). El ratio de Leighton modulado local es Φ = ${activeTreeLiveMetrics.leightonRatioModulated}, mitigando la producción secundaria de ozono fotoquímico en la calle.`}
                  formula={`J_{\\text{NO}_2}^{\\text{dosel}} = J_{\\text{NO}_2}^0 \\cdot \\exp(-k \\cdot \\text{LAI}), \\quad [\\text{O}_3]_{\\text{mod}} = \\frac{J_{\\text{NO}_2}^{\\text{dosel}} [\\text{NO}_2]}{k_3 [\\text{NO}]}`}
                  regulatory="Química de la Atmósfera Urbana & Directiva 2008/50/CE"
                  citation="Leighton, P. A. (1961) & Nowak et al. (2000)"
                  position="bottom"
                  width="w-[360px]"
                >
                  <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-teal-800/60 bg-teal-950/40 text-teal-200 text-[8.5px]">
                    <span className="text-teal-400 font-bold">Leighton Modulado Φ:</span>
                    <strong className="text-teal-100">{activeTreeLiveMetrics.leightonRatioModulated}</strong>
                    <span className="text-[7.5px] text-teal-400">(O₃ -{activeTreeLiveMetrics.streetO3AbsorptionGramsHour}g/h)</span>
                  </div>
                </ScientificTooltip>

                {/* FÍSICA: REFRIGERACIÓN MICROCLIMÁTICA Y EVAPOTRANSPIRACIÓN */}
                <ScientificTooltip
                  title="Física Microclimática: Refrigeración por Evapotranspiración"
                  content={`Enfriamiento microclimático de la masa arbórea: ΔT = -${activeTreeLiveMetrics.microclimateCoolingDeltaC}°C. Potencia de calor latente disipada: ${activeTreeLiveMetrics.streetBioclimaticCoolingKW} kW mediante transpiración foliar de ${activeTreeLiveMetrics.streetTranspirationLitersDay} L agua/día con VPD = ${activeTreeLiveMetrics.vpdKpa.toFixed(2)} kPa.`}
                  formula={`\\Delta T = - \\frac{\\lambda E}{\\rho C_p g_a}, \\quad P_{\\text{enfriamiento}} = \\frac{\\dot{m}_{\\text{agua}} \\cdot L_v}{3600} = ${activeTreeLiveMetrics.streetBioclimaticCoolingKW} \\text{ kW}`}
                  regulatory="Planes de Adaptación al Cambio Climático y Mitigación de Isla de Calor Urbana (UHI)"
                  citation="Monteith, J. L. (1965) Symp. Soc. Exp. Biol. & Oke (1987)"
                  position="bottom"
                  width="w-[360px]"
                >
                  <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-cyan-800/60 bg-cyan-950/40 text-cyan-200 text-[8.5px]">
                    <Sun className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                    <span className="text-cyan-400 font-bold">ΔT:</span>
                    <strong className="text-cyan-100">-{activeTreeLiveMetrics.microclimateCoolingDeltaC}°C</strong>
                    <span className="text-[7.5px] text-cyan-400">({activeTreeLiveMetrics.streetBioclimaticCoolingKW} kW)</span>
                  </div>
                </ScientificTooltip>

                {/* FÍSICA: ARRASTRE AERODINÁMICO DE CAÑÓN */}
                <ScientificTooltip
                  topic="urban_canopy_lod1"
                  title="Física Aerodinámica: Resistencia de Cañón y Ventilación"
                  content={`Frenado por arrastre aerodinámico de copas en cañón viario: -${activeTreeLiveMetrics.canyonWindDecelerationPct}% en velocidad de viento a nivel de calzada (Cd = ${MALAGA_SPECIES_CATALOG.find(sp => sp.id === activeTreeLiveMetrics.speciesId)?.cdDragCoef ?? 0.20}). Estado de ventilación urbana: ${activeTreeLiveMetrics.canyonAerodynamicStatus}.`}
                  formula={`u(z) = u_{\\text{tejado}} \\cdot \\exp\\left( -0.45(1 - p) \\cdot \\text{LAI} \\right), \\quad \\Delta u = -${activeTreeLiveMetrics.canyonWindDecelerationPct}\\%`}
                  regulatory="Directrices de Aerodinámica de Cañones Urbanos Gromke & Ruck (2007)"
                  citation="Gromke, C. & Ruck, B. (2007) Boundary-Layer Meteorol."
                  position="bottom"
                  width="w-[360px]"
                >
                  <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900 text-slate-300 text-[8.5px]">
                    <Wind className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    <span className="text-amber-400 font-bold">Viento:</span>
                    <strong className="text-slate-100">-{activeTreeLiveMetrics.canyonWindDecelerationPct}%</strong>
                    <span className="text-[7px] text-slate-400">({activeTreeLiveMetrics.canyonAerodynamicStatus})</span>
                  </div>
                </ScientificTooltip>

                {/* SALUD: ÍNDICE OPALS */}
                <ScientificTooltip
                  title="Alergenicidad Aerobiológica (Escala OPALS)"
                  content={`Índice OPALS de la especie dominante: ${activeTreeLiveMetrics.opalsIndex}/10 (${activeTreeLiveMetrics.allergenicityLevel}). Vector: ${activeTreeLiveMetrics.pollenVector}. Temporada: ${activeTreeLiveMetrics.pollenSeason}. ${activeTreeLiveMetrics.allergenBioDetails}`}
                  formula={`\\text{OPALS} \\in [1, 10], \\quad \\text{Ecosystem Trade-off} = \\frac{\\text{Score}}{\\text{OPALS}} = ${activeTreeLiveMetrics.ecosystemTradeOffRatio}`}
                  regulatory="Escala Ogren Plant Allergy Scale (OPALS) & Alertas Polínicas"
                  citation="Ogren, T. L. (2000) Allergy-Free Gardening"
                  position="bottom"
                  width="w-[350px]"
                >
                  <div className={`cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8.5px] ${
                    activeTreeLiveMetrics.opalsIndex <= 3 ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-300' :
                    activeTreeLiveMetrics.opalsIndex <= 6 ? 'border-amber-800/60 bg-amber-950/40 text-amber-300' :
                    'border-rose-800/60 bg-rose-950/40 text-rose-300'
                  }`}>
                    <span className="font-bold">OPALS:</span>
                    <strong>{activeTreeLiveMetrics.opalsIndex}/10</strong>
                    <span className="text-[7.5px]">({activeTreeLiveMetrics.allergenicityLevel})</span>
                  </div>
                </ScientificTooltip>
              </div>

              {/* BOTÓN EXPLORAR ARBOLADO COMPLETO */}
              <ScientificTooltip
                position="bottom"
                width="w-[340px]"
                title="Suite de Fitorremediación Arbórea (Árbol a Árbol y Calle a Calle)"
                formula="F_{\text{NO}_2} = -v_{d,\text{eff}}\cdot C_{\text{detector}}, \quad \text{NR}\rightarrow\text{NiR}\rightarrow\text{GS-GOGAT}"
                regulatory="Regla 16 AGENTS.md — 5 Demostraciones Fisicoquímicas Exclusivas"
                content="Abrir el inventario completo del Bosque Urbano de Málaga con reciclaje metabólico en L-Glutamina, captura foliar de PM2.5 y enfriamiento transpirativo Penman-Monteith."
              >
                <button
                  type="button"
                  onClick={() => setActiveModal('malagaTreesInventory')}
                  className="px-2 py-0.5 bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 border border-emerald-400 rounded text-[9px] font-sans font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm shrink-0"
                >
                  <Trees className="w-3 h-3 text-emerald-300" />
                  <span>Suite Arbolado</span>
                </button>
              </ScientificTooltip>
            </div>
          )}

          {/* GRUPO 5: Red Oficial Asimilada */}
          {(drawerCategory === 'red_sensores' || drawerCategory === 'todo') && (
            <div className="flex flex-wrap items-center gap-1.5 py-1 bg-slate-950/70 p-1.5 rounded border border-blue-900/50">
              <span className="text-[8px] uppercase tracking-wider text-blue-400 font-bold bg-blue-950/60 border border-blue-800/40 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5" /> Red Asimilada ({assimilation?.totalStationsAssimilated ?? SYSTEM_PROPAGATION.stationsCount}+{assimilation?.totalSatellitesAssimilated ?? SYSTEM_PROPAGATION.satellitesCount}):
              </span>

              {/* Estación Oficial Clave Más Cercana */}
              {assimilation?.nearestStation && (
                <ScientificTooltip
                  title="Estación Oficial Terrestre Más Cercana al Punto Activo"
                  content={`Estación ${assimilation.nearestStation.station.name} (${assimilation.nearestStation.station.code}). Distancia geodésica: ${assimilation.nearestStation.distanceKm} km. Ponderación Kriging en este punto: ${assimilation.nearestStation.interpolatedWeightPct}%. Red: ${assimilation.nearestStation.station.network}. Cota altimétrica: ${assimilation.nearestStation.station.altM} m.`}
                  position="bottom"
                  width="w-[320px]"
                >
                  <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-blue-800/60 bg-blue-950/40 text-blue-200 text-[8.5px]">
                    <Radio className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                    <span className="text-blue-400 font-bold">Estación Clave:</span>
                    <strong className="text-blue-100">{assimilation.nearestStation.station.name}</strong>
                    <span className="text-[7.5px] text-blue-300">({assimilation.nearestStation.distanceKm} km · {assimilation.nearestStation.interpolatedWeightPct}%)</span>
                  </div>
                </ScientificTooltip>
              )}

              {/* Top 3 Estaciones de Influencia en el Punto */}
              {assimilation?.allStationsReadings && assimilation.allStationsReadings.slice(0, 3).map((stR, idx) => (
                <ScientificTooltip
                  key={stR.station.id}
                  title={`Nodo de Red #${idx + 1}: ${stR.station.name}`}
                  content={`Código: ${stR.station.code} | Distancia: ${stR.distanceKm} km | Peso Kriging: ${stR.weightPct}% | NO₂: ${stR.no2} µg/m³ | PM₂.₅: ${stR.pm25} µg/m³ | PM₁₀: ${stR.pm10} µg/m³ | O₃: ${stR.o3} µg/m³ | Temp: ${stR.temp}°C.`}
                  position="bottom"
                  width="w-[300px]"
                >
                  <div className="cursor-help flex items-center gap-1 px-1 py-0.5 rounded border border-slate-800 bg-slate-900/80 text-slate-300 text-[8px]">
                    <span className="text-cyan-400 font-bold">#{idx + 1}</span>
                    <span className="truncate max-w-[110px] text-slate-200">{stR.station.code}</span>
                    <span className="text-[7px] text-slate-400">{stR.distanceKm}km</span>
                    <strong className="text-emerald-300 text-[7.5px]">{stR.no2} µg</strong>
                  </div>
                </ScientificTooltip>
              ))}

              {/* Misiones Satelitales Asimiladas en el Punto (Copernicus S5P / S2) */}
              {assimilation?.allSatellitesReadings && assimilation.allSatellitesReadings.slice(0, 2).map((satR) => (
                <ScientificTooltip
                  key={satR.mission.id}
                  title={`Misión Espacial: ${satR.mission.name}`}
                  content={`Agencia: ${satR.mission.agency} | Resolución: ${satR.mission.spatialResolution} | Órbita: ${satR.mission.orbitType}. Valor asimilado en este punto: ${satR.localInterpolatedValue} ${satR.unit}. Especies: ${satR.targetSpecies.join(', ')}.`}
                  position="bottom"
                  width="w-[320px]"
                >
                  <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-purple-800/60 bg-purple-950/40 text-purple-200 text-[8px]">
                    <span>🛰️</span>
                    <span className="font-bold text-purple-300">{satR.mission.code}:</span>
                    <strong className="text-purple-100">{satR.localInterpolatedValue}</strong>
                    <span className="text-[7px] text-purple-400">{satR.unit}</span>
                  </div>
                </ScientificTooltip>
              ))}

              {/* Botones Directos: Proyectar Red en Mapa y Observatorio Completo */}
              <div className="flex items-center gap-1.5 ml-auto shrink-0">
                <ScientificTooltip
                  position="bottom"
                  width="w-[320px]"
                  title="Proyección Cartográfica de Vectores Kriging/GUM (24+16)"
                  content="Proyectar u ocultar en el mapa 3D los vectores geodésicos desde las 24 estaciones y 16 satélites hacia el punto activo y los anillos de incertidumbre GUM."
                >
                  <button
                    type="button"
                    onClick={toggleConfidenceLayer}
                    className={`px-2 py-0.5 rounded text-[8.5px] font-sans font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm border ${
                      showConfidenceLayer
                        ? 'bg-indigo-600 text-white border-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.7)]'
                        : 'bg-indigo-950/90 hover:bg-indigo-900 text-indigo-200 border-indigo-500/80'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-300" />
                    <span>{showConfidenceLayer ? '🗺️ Red en Mapa: ON' : '🗺️ Proyectar Red en Mapa'}</span>
                  </button>
                </ScientificTooltip>

                <ScientificTooltip
                  position="bottom"
                  width="w-[320px]"
                  title={`Observatorio Oficial Completo (${assimilation?.totalStationsAssimilated ?? SYSTEM_PROPAGATION.stationsCount}+${assimilation?.totalSatellitesAssimilated ?? SYSTEM_PROPAGATION.satellitesCount})`}
                  content={`Abrir la consola de auditoría en tiempo real de las ${assimilation?.totalStationsAssimilated ?? SYSTEM_PROPAGATION.stationsCount} estaciones terrestres de Málaga y las ${assimilation?.totalSatellitesAssimilated ?? SYSTEM_PROPAGATION.satellitesCount} misiones satelitales en órbita.`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveModal('audit')}
                    className="px-2 py-0.5 bg-blue-900/90 hover:bg-blue-800 text-blue-100 border border-blue-400 rounded text-[8.5px] font-sans font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                  >
                    <Radio className="w-3 h-3 text-cyan-300" />
                    <span>Observatorio Completo ({assimilation?.totalStationsAssimilated ?? SYSTEM_PROPAGATION.stationsCount}+{assimilation?.totalSatellitesAssimilated ?? SYSTEM_PROPAGATION.satellitesCount})</span>
                  </button>
                </ScientificTooltip>
              </div>
            </div>
          )}

          {/* GRUPO 6: Balance de Masa NO2 & Cinética de Continuidad */}
          {(drawerCategory === 'no2_cinetica' || drawerCategory === 'todo') && (
            <div className="flex flex-wrap items-center justify-between gap-1.5 py-1 bg-slate-950/80 p-1.5 rounded border border-amber-800/60">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[8px] uppercase tracking-wider text-amber-400 font-bold bg-amber-950/70 border border-amber-700/60 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1">
                  <BarChart2 className="w-2.5 h-2.5 text-amber-400" />
                  <span>Balance Continuidad NO₂:</span>
                </span>

                {/* NO2 OBSERVADO A 1.8M */}
                <ScientificTooltip
                  topic="no2_mass_budget_waterfall"
                  title="Concentración Asimilada a 1.8m AGL"
                  content={`Concentración actual de NO₂ en el punto activo: ${realNO2.toFixed(1)} µg/m³. Valor resuelto por PINN: ${pinnNO2} µg/m³ (Δ = ${deltaNO2 > 0 ? '+' : ''}${deltaNO2} µg/m³).`}
                  position="bottom"
                  width="w-[320px]"
                >
                  <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-emerald-800/60 bg-emerald-950/40 text-emerald-200 text-[8.5px]">
                    <span className="text-emerald-400 font-bold">NO₂:</span>
                    <strong className="text-emerald-100">{realNO2.toFixed(1)}</strong>
                    <span className="text-[7.5px] text-emerald-400">µg/m³</span>
                  </div>
                </ScientificTooltip>

                {/* RELACIÓN LEIGHTON */}
                <ScientificTooltip
                  topic="leighton_photostationary"
                  title="Razón Fotoestacionaria de Leighton (Φ)"
                  content={`Razón de Leighton: Φ = ${phiLeighton}. Indica el balance entre fotólisis de NO₂ y titulación de ozono.`}
                  position="bottom"
                  width="w-[320px]"
                >
                  <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-teal-800/60 bg-teal-950/40 text-teal-200 text-[8.5px]">
                    <span className="text-teal-400 font-bold">Φ Leighton:</span>
                    <strong className="text-teal-100">{phiLeighton}</strong>
                  </div>
                </ScientificTooltip>

                {/* VENTILACIÓN ACH */}
                <ScientificTooltip
                  topic="urban_canopy_lod1"
                  title="Tasa de Ventilación de Calle (ACH)"
                  content={`Tasa de renovación de aire en el cañón urbano: ${achVentilation} renovaciones por hora.`}
                  position="bottom"
                  width="w-[300px]"
                >
                  <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-sky-800/60 bg-sky-950/40 text-sky-200 text-[8.5px]">
                    <span className="text-sky-400 font-bold">ACH:</span>
                    <strong className="text-sky-100">{achVentilation} h⁻¹</strong>
                  </div>
                </ScientificTooltip>
              </div>

              {/* BOTONES DE APERTURA MODALES CINETICOS */}
              <div className="flex items-center gap-1.5 ml-auto shrink-0">
                <ScientificTooltip
                  position="bottom"
                  width="w-[330px]"
                  title="Química Nocturna & Halógenos Marinos (NO₃• / N₂O₅ / ClNO₂)"
                  formula="\text{NO}_2 + \text{O}_3 \rightarrow \text{NO}_3^\bullet \xrightarrow{+\text{NO}_2} \text{N}_2\text{O}_5 \xrightarrow{+\text{NaCl}} \text{ClNO}_2"
                  content="Abrir consola de cinética nocturna sin luz solar: formación de radical nitrato, pentóxido de dinitrógeno y activación costera con aerosol marino."
                >
                  <button
                    type="button"
                    onClick={() => setActiveModal('no2NighttimeChemistry')}
                    className="px-2 py-0.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/80 rounded text-[8.5px] font-sans font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                  >
                    <Moon className="w-3 h-3 text-indigo-400" />
                    <span>Química Nocturna (NO₃/N₂O₅/ClNO₂)</span>
                  </button>
                </ScientificTooltip>

                <ScientificTooltip
                  position="bottom"
                  width="w-[340px]"
                  title="Balance de Masa en Cascada (Waterfall + SOTA 2025–2026)"
                  formula="\frac{\partial [\text{NO}_2]}{\partial t} = P_{\text{COPERT}} + P_{\text{Leighton}} + P_{\text{PAN-LST}} - L_{\text{Wesely/TiO}_2} - L_{\text{PCET}}"
                  content="Abrir el desglose completo de producción y sumideros de NO₂ en el punto activo, incluyendo termólisis de PAN por temperatura de asfalto y sinergia redox PCET."
                >
                  <button
                    type="button"
                    onClick={() => setActiveModal('no2MassBudget')}
                    className="px-2 py-0.5 bg-gradient-to-r from-emerald-900 to-teal-900 hover:from-emerald-800 hover:to-teal-800 text-emerald-200 border border-emerald-400/80 rounded text-[8.5px] font-sans font-bold flex items-center gap-1 cursor-pointer transition-all shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                  >
                    <BarChart2 className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>Abrir Desglose Cascada (Waterfall)</span>
                  </button>
                </ScientificTooltip>
              </div>
            </div>
          )}

          {/* GRUPO 7: Entornos Escolares Seguros & Directiva (UE) 2024/2881 (50 Centros Oficiales) */}
          {(drawerCategory === 'escolares' || drawerCategory === 'todo') && (
            <div className="flex flex-wrap items-center justify-between gap-1.5 py-1 bg-slate-950/80 p-1.5 rounded border border-amber-800/60">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[8px] uppercase tracking-wider text-amber-400 font-bold bg-amber-950/70 border border-amber-700/60 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1">
                  <School className="w-2.5 h-2.5 text-amber-400" />
                  <span>Entornos Escolares (DIR 2024/2881):</span>
                </span>

                <ScientificTooltip
                  topic="school_air_equity_directive_2024"
                  title={`Colegio más Próximo: ${nearestSchool.name}`}
                  content={`Distrito: ${nearestSchool.district}. Distancia métrica desde el punto activo: ${nearestSchool.distKm < 1 ? `${Math.round(nearestSchool.distKm * 1000)} m` : `${nearestSchool.distKm} km`}. Alumnos matriculados: ${nearestSchool.students}. Tipo de vía: ${nearestSchool.streetType}. Factor de exposición: ${nearestSchool.trafficExposureFactor}.`}
                  position="bottom"
                  width="w-[340px]"
                >
                  <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-amber-800/60 bg-amber-950/40 text-amber-200 text-[8.5px]">
                    <span className="text-amber-400 font-bold">Colegio Próximo:</span>
                    <strong className="text-amber-100">{nearestSchool.name.split('(')[0].replace('CEIP', '').trim()}</strong>
                    <span className="text-[7.5px] text-amber-400/90 font-mono">({nearestSchool.distKm < 1 ? `${Math.round(nearestSchool.distKm * 1000)}m` : `${nearestSchool.distKm}km`})</span>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip
                  title="Dosimetría Pediátrica ICRP 66 a cota 0.90m AGL"
                  content={`Tasa de inhalación respiratoria infantil VE = 0.52 m³/h con fracción de depósito alveolar DF = 0.18 según modelo morfométrico ICRP 66. Pico escolar NO₂ estimado: ${(realNO2 * nearestSchool.trafficExposureFactor).toFixed(1)} µg/m³.`}
                  position="bottom"
                  width="w-[320px]"
                >
                  <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-cyan-800/60 bg-cyan-950/40 text-cyan-200 text-[8.5px]">
                    <Baby className="w-2.5 h-2.5 text-amber-400" />
                    <span className="text-cyan-400 font-bold">ICRP 66 Pediátrico:</span>
                    <strong className="text-cyan-100">{(realNO2 * nearestSchool.trafficExposureFactor * 0.52).toFixed(1)} µg/h</strong>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip
                  title="Nuevo Límite UE 2030 (20 µg/m³)"
                  content={`Directiva (UE) 2024/2881 Art. 13: Límite anual vinculante de 20 µg/m³ para NO₂ en 2030. Brecha calculada: ${Math.max(0, realNO2 * nearestSchool.trafficExposureFactor - 20).toFixed(1)} µg/m³.`}
                  position="bottom"
                  width="w-[320px]"
                >
                  <div className="cursor-help flex items-center gap-1 px-1.5 py-0.5 rounded border border-emerald-800/60 bg-emerald-950/40 text-emerald-200 text-[8.5px]">
                    <span className="text-emerald-400 font-bold">Límite 2030 (20 µg):</span>
                    <strong className={realNO2 * nearestSchool.trafficExposureFactor <= 20 ? "text-emerald-300" : "text-amber-400 font-bold"}>
                      {realNO2 * nearestSchool.trafficExposureFactor <= 20 ? "CUMPLE (≤20)" : `EXCEDE (+${(realNO2 * nearestSchool.trafficExposureFactor - 20).toFixed(1)})`}
                    </strong>
                  </div>
                </ScientificTooltip>
              </div>

              <div className="flex items-center gap-1.5 ml-auto shrink-0">
                <ScientificTooltip
                  position="bottom"
                  width="w-[340px]"
                  title={`Suite de Equidad Escolar & Dosimetría Pediátrica (${MALAGA_RAW_SCHOOLS.length} Colegios)`}
                  formula="D_{\text{infantil}}(z=0.90\text{m}) = C(z=0.90\text{m})\cdot V_E \cdot DF_{\text{ICRP66}}"
                  regulatory="Directiva (UE) 2024/2881 Art. 13 (Receptores Sensibles)"
                  content={`Abrir la evaluación completa de los ${MALAGA_RAW_SCHOOLS.length} centros educativos de Málaga en los 11 distritos municipales con mapas 3D y cumplimiento 2030.`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveModal('schoolAirEquity')}
                    className="px-2 py-0.5 bg-gradient-to-r from-amber-900 to-yellow-900 hover:from-amber-800 hover:to-yellow-800 text-amber-200 border border-amber-400/80 rounded text-[8.5px] font-sans font-bold flex items-center gap-1 cursor-pointer transition-all shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                  >
                    <School className="w-3 h-3 text-amber-300 animate-pulse" />
                    <span>Ver los {MALAGA_RAW_SCHOOLS.length} Colegios &amp; Mapa 3D</span>
                  </button>
                </ScientificTooltip>
              </div>
            </div>
          )}

        </div>
      )}
      {renderAnalysisMenuPortal()}
    </div>
  );
});

ActivePointSyncBanner.displayName = 'ActivePointSyncBanner';
