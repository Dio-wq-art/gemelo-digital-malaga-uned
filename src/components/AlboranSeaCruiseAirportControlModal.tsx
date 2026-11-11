import React, { useState, useMemo } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { MathFormula } from './MathFormula';
import { AirportLtoInteractiveDiagram } from './AirportLtoInteractiveDiagram';
import {
  calculateSeawaterState,
  simulateCruisePlumeDispersion,
  simulateAirportGuadalhorceDynamics,
  simulateHalogenPortAirportSynergy,
  HalogenPortAirportSynergyResult,
  ALBORAN_WATER_MASSES,
  CRUISE_SHIP_PRESETS,
  CruiseShipPlumeConfig,
  AlboranWaterMass
} from '../lib/alboranSeaOceanography';
import { useActivePoint } from '../context/ActivePointContext';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import {
  Waves,
  Ship,
  Plane,
  Droplets,
  Wind,
  Thermometer,
  Gauge,
  Activity,
  Layers,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  Zap,
  Sliders,
  Sparkles,
  Compass,
  ArrowDownRight,
  RefreshCw,
  Info,
  Atom,
  BookOpen,
  Flame,
  CheckCircle2,
  Scale,
  AlertTriangle,
  FileText,
  ChevronRight,
  MapPin
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine
} from 'recharts';

interface Props {
  onClose: () => void;
  ambientTempC?: number;
  relativeHumidity?: number;
  windSpeedMS?: number;
  windDirectionDeg?: number;
}

type TabType = 'oceanography_3d' | 'cruise_plume' | 'airport_agp' | 'synergy_matrix' | 'fair_export';

export function AlboranSeaCruiseAirportControlModal({
  onClose,
  ambientTempC = 23.5,
  relativeHumidity = 72,
  windSpeedMS = 3.8,
  windDirectionDeg = 135
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('oceanography_3d');

  // --- Oceanographic State Sliders ---
  const [salinityPsu, setSalinityPsu] = useState<number>(36.85); // Salinidad superficial Alborán
  const [sstTempC, setSstTempC] = useState<number>(20.2); // Temperatura superficial del mar (SST)
  const [probeDepthM, setProbeDepthM] = useState<number>(85); // Profundidad de sondeo CTD (m)

  // --- Cruise Ship State ---
  const [selectedCruisePreset, setSelectedCruisePreset] = useState<CruiseShipPlumeConfig>(CRUISE_SHIP_PRESETS[0]);
  const [cruiseEngineLoadPct, setCruiseEngineLoadPct] = useState<number>(65);
  const [cruiseFuelSulfurPct, setCruiseFuelSulfurPct] = useState<number>(0.10); // Med-ECA 0.10%

  // --- Airport AGP State ---
  const [hourlyFlightMovements, setHourlyFlightMovements] = useState<number>(44); // Operaciones LTO/h punta
  const [activeRunway, setActiveRunway] = useState<'13_31' | '12_30'>('13_31');
  const [guadalhorceInversionCeilingM, setGuadalhorceInversionCeilingM] = useState<number>(180);

  // --- Sincronización Global del Punto Activo (Regla 10 & 11) ---
  const activePointCtx = useActivePoint();
  const activePointName = activePointCtx?.activePoint?.nearestStreetName || activePointCtx?.activePoint?.name || 'Bahía de Málaga';
  const activePointNo2 = (activePointCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? 24.5).toFixed(1);

  // --- Acoplamiento Tripartito Halógenos, Puerto & Aeropuerto ---
  const [synergyBerths, setSynergyBerths] = useState<number>(4);
  const [synergyAirportTaxiMin, setSynergyAirportTaxiMin] = useState<number>(24);
  const [synergySeaSaltSa, setSynergySeaSaltSa] = useState<number>(520); // µm²/cm³
  const [synergyChlorideMolarity, setSynergyChlorideMolarity] = useState<number>(3.5); // mol/L
  const [synergySolarRadiation, setSynergySolarRadiation] = useState<number>(680); // W/m²
  const [activeSuggestionTab, setActiveSuggestionTab] = useState<'clno2' | 'port' | 'agp' | 'experiments' | 'regulations'>('clno2');

  // --- Physical-Chemical Solvers Execution (Strictly Deterministic) ---
  const seawaterState = useMemo(() => {
    return calculateSeawaterState(salinityPsu, sstTempC, probeDepthM);
  }, [salinityPsu, sstTempC, probeDepthM]);

  // Perfil vertical del Mar de Alborán (0 a 1000 m)
  const verticalCtdProfile = useMemo(() => {
    const depths = [0, 15, 30, 50, 75, 100, 150, 200, 300, 450, 600, 800, 1000];
    return depths.map(z => {
      // Perfil analítico característico del Mar de Alborán:
      // Capa superior MAW (T desciende de SST a ~14°C, S sube de 36.6 a 38.2)
      // Capa intermedia LIW (S sube a 38.55, T se estabiliza en ~13.2°C)
      // Capa profunda WMDW (T = 12.8°C, S = 38.45)
      let sZ = salinityPsu;
      let tZ = sstTempC;

      if (z <= 150) {
        const frac = z / 150;
        sZ = salinityPsu + frac * (38.20 - salinityPsu);
        tZ = sstTempC - frac * (sstTempC - 13.8);
      } else if (z <= 600) {
        const frac = (z - 150) / 450;
        sZ = 38.20 + frac * (38.55 - 38.20);
        tZ = 13.8 - frac * (13.8 - 13.2);
      } else {
        const frac = (z - 600) / 400;
        sZ = 38.55 - frac * (38.55 - 38.45);
        tZ = 13.2 - frac * (13.2 - 12.8);
      }

      const st = calculateSeawaterState(sZ, tZ, z);
      // Velocidad de corriente calculada analíticamente:
      // Superficie dominada por Chorro Atlántico (0.85 m/s); fondo por flujo WMDW (0.05 m/s)
      const currentVelMs = z < 100 ? 0.85 * Math.exp(-z / 90) + 0.15 : 0.08 + 0.04 * Math.sin(z / 200);

      return {
        depthM: -z,
        depthPositiveM: z,
        salinityPsu: parseFloat(sZ.toFixed(2)),
        temperatureC: parseFloat(tZ.toFixed(2)),
        densityKgM3: parseFloat(st.densityKgM3.toFixed(2)),
        sigmaThetaKgM3: parseFloat(st.sigmaThetaKgM3.toFixed(2)),
        currentVelocityMs: parseFloat(currentVelMs.toFixed(2)),
        soundSpeedMs: Math.round(st.soundSpeedMs)
      };
    });
  }, [salinityPsu, sstTempC]);

  // Simulación de penacho de cruceros
  const cruiseConfig: CruiseShipPlumeConfig = useMemo(() => ({
    ...selectedCruisePreset,
    engineLoadPct: cruiseEngineLoadPct,
    fuelSulfurPct: cruiseFuelSulfurPct
  }), [selectedCruisePreset, cruiseEngineLoadPct, cruiseFuelSulfurPct]);

  const cruisePlumeResult = useMemo(() => {
    return simulateCruisePlumeDispersion(
      cruiseConfig,
      ambientTempC,
      sstTempC,
      windSpeedMS,
      salinityPsu,
      relativeHumidity
    );
  }, [cruiseConfig, ambientTempC, sstTempC, windSpeedMS, salinityPsu, relativeHumidity]);

  // Simulación del Aeropuerto AGP
  const airportResult = useMemo(() => {
    return simulateAirportGuadalhorceDynamics(
      hourlyFlightMovements,
      activeRunway,
      ambientTempC,
      guadalhorceInversionCeilingM,
      windSpeedMS
    );
  }, [hourlyFlightMovements, activeRunway, ambientTempC, guadalhorceInversionCeilingM, windSpeedMS]);

  // Simulación del acoplamiento tripartito Halógenos + Puerto + Aeropuerto
  const synergyResult: HalogenPortAirportSynergyResult = useMemo(() => {
    return simulateHalogenPortAirportSynergy({
      ambientTempC,
      relativeHumidity,
      windSpeedMs: windSpeedMS,
      solarRadiationWm2: synergySolarRadiation,
      portActiveBerths: synergyBerths,
      portFuelSulfurPct: cruiseFuelSulfurPct,
      airportHourlyMovements: hourlyFlightMovements,
      airportTaxiTimeMin: synergyAirportTaxiMin,
      seaSaltSurfaceAreaSa: synergySeaSaltSa,
      chlorideMolarity: synergyChlorideMolarity,
      receptorLat: activePointCtx?.location?.lat,
      receptorLon: activePointCtx?.location?.lon
    });
  }, [
    ambientTempC,
    relativeHumidity,
    windSpeedMS,
    synergySolarRadiation,
    synergyBerths,
    cruiseFuelSulfurPct,
    hourlyFlightMovements,
    synergyAirportTaxiMin,
    synergySeaSaltSa,
    synergyChlorideMolarity,
    activePointCtx
  ]);

  // Descarga FAIR en CSV
  const handleExportCsv = () => {
    const headers = [
      'Transecto_Distancia_m',
      'Hito_Geografico',
      'Crucero_NO2_ugm3',
      'Crucero_SO2_ugm3',
      'Crucero_PM25_ugm3',
      'Crucero_CO2_ppm',
      'Aeropuerto_Distancia_km',
      'Aeropuerto_Hito',
      'Aeropuerto_UFP_sub10nm_part_cm3',
      'Aeropuerto_NOx_ugm3',
      'Aeropuerto_JetA1_SOA_ugm3',
      'Sinergia_ClNO2_ppt',
      'Sinergia_Cl_Radical_10e4',
      'Sinergia_OH_Radical_10e6',
      'Sinergia_O3_Rate_Coupled_ppb_h'
    ].join(',');

    const maxRows = Math.max(cruisePlumeResult.transect.length, airportResult.transectGuadalhorce.length, synergyResult.diurnalCoupling.length);
    const rows: string[] = [];

    for (let i = 0; i < maxRows; i++) {
      const c = cruisePlumeResult.transect[i] || {
        downwindDistanceM: 0,
        geographicLandmark: 'N/A',
        centerlineNO2UgM3: 0,
        centerlineSO2UgM3: 0,
        centerlinePM25UgM3: 0,
        centerlineCO2Ppm: 0
      };
      const a = airportResult.transectGuadalhorce[i] || {
        distKm: 0,
        landmark: 'N/A',
        ufpConcentrationPartCm3: 0,
        noxUgM3: 0,
        jetA1SoaUgM3: 0
      };
      const s = synergyResult.diurnalCoupling[i] || {
        clno2Ppt: 0,
        clRadical10e4: 0,
        ohRadical10e6: 0,
        ozoneRateCoupledPpbHr: 0
      };

      rows.push([
        c.downwindDistanceM,
        `"${c.geographicLandmark}"`,
        c.centerlineNO2UgM3,
        c.centerlineSO2UgM3,
        c.centerlinePM25UgM3,
        c.centerlineCO2Ppm,
        a.distKm,
        `"${a.landmark}"`,
        a.ufpConcentrationPartCm3,
        a.noxUgM3,
        a.jetA1SoaUgM3,
        s.clno2Ppt,
        s.clRadical10e4,
        s.ohRadical10e6,
        s.ozoneRateCoupledPpbHr
      ].join(','));
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `alboran_cruceros_aeropuerto_halogenos_malaga_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DraggableWindow
      title="Hidrodinámica Alborán, Penachos de Cruceros & Aeropuerto AGP"
      subtitle={`Ecuación TEOS-10, Dispersión Briggs (Muelle Levante) y Dinámica AGP • [📍 ${activePointName} • NO₂: ${activePointNo2} µg/m³]`}
      onClose={onClose}
      defaultCollapsed={true}
      className="w-full max-w-5xl max-h-[88vh]"
      headerColorClass="text-cyan-400"
      borderColorClass="border-cyan-500/50"
    >
      <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans text-xs">
        
        {/* Banner de Sincronización del Punto Activo Unificado (Regla 10) */}
        <div className="px-3 pt-2">
          <ActivePointSyncBanner compact={true} showCoordinates={true} />
        </div>

        {/* Barra Superior de Métricas Clave */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-900/90 border-b border-slate-800">
          <ScientificTooltip
            title="Ecuación Internacional de Estado del Agua de Mar (TEOS-10)"
            content="Calcula la densidad in-situ ρ(S, T, p) y anomalía de densidad potencial σθ mediante la formulación termodinámica Gibbs Seawater (GSW / IOC-UNESCO)."
            citation="TEOS-10 / IOC-UNESCO 2010"
          >
            <div className="bg-slate-950/70 p-2 rounded border border-cyan-900/50 cursor-help">
              <div className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                <Waves className="w-3.5 h-3.5" /> Densidad Mar Alborán (TEOS-10)
              </div>
              <div className="text-sm font-bold text-white mt-0.5 font-mono">
                {seawaterState.densityKgM3.toFixed(2)} <span className="text-[10px] text-slate-400">kg/m³</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                σθ: {seawaterState.sigmaThetaKgM3.toFixed(2)} kg/m³ | c: {Math.round(seawaterState.soundSpeedMs)} m/s
              </div>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            title="Modelo de Ascenso de Penacho de Briggs (1984)"
            content="Determina el sobrealzamiento térmico Δh = 1.6 F₀^(1/3) x^(2/3) / u del penacho de chimenea de buques atracados en el Dique de Levante del Puerto de Málaga."
            citation="Briggs (1984) / EPA SCICHEM"
          >
            <div className="bg-slate-950/70 p-2 rounded border border-sky-900/50 cursor-help">
              <div className="text-[10px] text-sky-400 font-semibold flex items-center gap-1">
                <Ship className="w-3.5 h-3.5" /> Ascenso Penacho Crucero (Briggs)
              </div>
              <div className="text-sm font-bold text-sky-200 mt-0.5 font-mono">
                +{cruisePlumeResult.plumeRiseDeltaHM} m <span className="text-[10px] text-slate-400">(Cota: {cruisePlumeResult.effectivePlumeHeightM}m)</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                F₀: {cruisePlumeResult.buoyancyFluxF0M4S3} m⁴/s³ | MABL: {cruisePlumeResult.mablHeightM}m
              </div>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            title="Circulación de Vórtices de Punta de Ala (Teoría de Prandtl)"
            content="Circulación inicial Γ₀ = (M · g) / (ρ · b_eff · V) y velocidad de descenso de los torbellinos generados durante las maniobras de despegue y aterrizaje en AGP."
            citation="Prandtl Lifting-Line / ICAO Doc 9882"
          >
            <div className="bg-slate-950/70 p-2 rounded border border-amber-900/50 cursor-help">
              <div className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                <Plane className="w-3.5 h-3.5" /> Vórtices de Estela AGP (Γ₀)
              </div>
              <div className="text-sm font-bold text-amber-200 mt-0.5 font-mono">
                {airportResult.wingtipVortexCirculationM2S} <span className="text-[10px] text-slate-400">m²/s</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                Descenso: {airportResult.vortexDescentSpeedMs} m/s | Pista {activeRunway}
              </div>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            title="Oxidación Acuosa Heterogénea de SO₂ en Niebla Marina (Taró)"
            content="Cinética de conversión de dióxido de azufre a sulfato catalizada por sales marinas y metales de transición (Fe/Mn) en el aerosol litoral de la Bahía de Málaga."
            citation="Seinfeld & Pandis (2016) / EMEP MSC-W"
          >
            <div className="bg-slate-950/70 p-2 rounded border border-emerald-900/50 cursor-help">
              <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5" /> Oxidación Acuosa SO₂ (Taró)
              </div>
              <div className="text-sm font-bold text-emerald-200 mt-0.5 font-mono">
                {cruisePlumeResult.aqueousSo2OxidationRatePctPerHr} <span className="text-[10px] text-slate-400">%/h</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                ΔT Mar-Aire: {cruisePlumeResult.seaAirDeltaTC > 0 ? `+${cruisePlumeResult.seaAirDeltaTC}` : cruisePlumeResult.seaAirDeltaTC}°C
              </div>
            </div>
          </ScientificTooltip>
        </div>

        {/* Selector de Pestañas Principales */}
        <div className="flex items-center gap-1 px-3 pt-2 bg-slate-900 border-b border-slate-800 overflow-x-auto">
          <ScientificTooltip
            title="Hidrodinámica del Mar de Alborán"
            content="Estratificación termohalina en 3D (0 a 1000m), termoclina estacional y transporte del chorro atlántico superficial frente a las aguas mediterráneas profundas (WMDW)."
            citation="Gascard & Richez (1985) / TEOS-10"
          >
            <button
              onClick={() => setActiveTab('oceanography_3d')}
              className={`px-3 py-1.5 font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'oceanography_3d'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-950/70'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              <span>1. Mar de Alborán & TEOS-10</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="Dispersión de Penacho de Buques en Atraque"
            content="Simulación analítica de penacho Gaussiano térmico (Briggs) con abatimiento por azufre MARPOL Anexo VI y penetración en la capa límite costera (TIBL)."
            citation="MARPOL Anexo VI / EMEP/EEA 1.A.3.d"
          >
            <button
              onClick={() => setActiveTab('cruise_plume')}
              className={`px-3 py-1.5 font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'cruise_plume'
                  ? 'border-sky-400 text-sky-300 bg-slate-950/70'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Ship className="w-3.5 h-3.5 text-sky-400" />
              <span>2. Penacho Cruceros (Muelle Levante)</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="Dinámica de Emisiones LTO Aeropuerto AGP"
            content="Ciclo Landing-Takeoff (LTO OACI Anexo 16), dispersión de vórtices de estela en pista 13/31 y atrapamiento térmico bajo la inversión del Valle del Guadalhorce."
            citation="OACI Anexo 16 / FAA EDMS"
          >
            <button
              onClick={() => setActiveTab('airport_agp')}
              className={`px-3 py-1.5 font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'airport_agp'
                  ? 'border-amber-400 text-amber-300 bg-slate-950/70'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plane className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Aeropuerto AGP & Valle Guadalhorce</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="Sinergia Fotoquímica y Halógenos Marinos"
            content="Activación de cloruro a nitrilo de cloro (ClNO₂) en aerosoles de sal marina catalizada por el NO₂ de buques y aeronaves antes del amanecer."
            citation="Thornton et al. (Nature 2010) / Tesis EIDUNED"
          >
            <button
              onClick={() => setActiveTab('synergy_matrix')}
              className={`px-3 py-1.5 font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'synergy_matrix'
                  ? 'border-purple-400 text-purple-300 bg-slate-950/70'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Atom className="w-3.5 h-3.5 text-purple-400" />
              <span>4. Sinergia Halógenos-Puerto-AGP & Tesis</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="Exportación Científica Abierta FAIR"
            content="Descarga citable en GeoJSON y CSV de los perfiles oceanográficos, trazabilidad de plumas y tablas de sinergia para inclusión directa en LaTeX."
            citation="FAIR Data Principles / Directiva INSPIRE"
          >
            <button
              onClick={() => setActiveTab('fair_export')}
              className={`px-3 py-1.5 font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'fair_export'
                  ? 'border-emerald-400 text-emerald-300 bg-slate-950/70'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>5. Exportación FAIR / LaTeX</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Contenedor de Contenido Principal */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          
          {/* ================= PESTAÑA 1: HIDRODINÁMICA ALBORÁN ================= */}
          {activeTab === 'oceanography_3d' && (
            <div className="space-y-3">
              {/* Controles del Agua de Mar */}
              <div className="bg-slate-900/80 p-3 rounded border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-semibold flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-cyan-400" /> Salinidad Superficial (S):
                    </span>
                    <span className="font-mono text-cyan-300">{salinityPsu.toFixed(2)} PSU</span>
                  </div>
                  <input
                    type="range"
                    min={35.0}
                    max={39.0}
                    step={0.05}
                    value={salinityPsu}
                    onChange={(e) => setSalinityPsu(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 h-1 bg-slate-800 rounded"
                  />
                  <span className="text-[9px] text-slate-500">MAW Atlántico: ~36.6 • Salida Mediterránea: &gt;38.4</span>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-semibold flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-rose-400" /> Temp. Superficial Mar (SST):
                    </span>
                    <span className="font-mono text-rose-300">{sstTempC.toFixed(1)} °C</span>
                  </div>
                  <input
                    type="range"
                    min={13.0}
                    max={27.0}
                    step={0.2}
                    value={sstTempC}
                    onChange={(e) => setSstTempC(parseFloat(e.target.value))}
                    className="w-full accent-rose-400 h-1 bg-slate-800 rounded"
                  />
                  <span className="text-[9px] text-slate-500">Invernal: ~14.5°C • Estival: ~23.5°C • Afloramiento: ~16°C</span>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-semibold flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-sky-400" /> Cota de Sondeo CTD:
                    </span>
                    <span className="font-mono text-sky-300">{probeDepthM} m ({seawaterState.pressureDbar.toFixed(0)} dbar)</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1000}
                    step={10}
                    value={probeDepthM}
                    onChange={(e) => setProbeDepthM(parseInt(e.target.value))}
                    className="w-full accent-sky-400 h-1 bg-slate-800 rounded"
                  />
                  <span className="text-[9px] text-slate-500">Termoclina: 40-120m • Fondo Bahía: 20-90m</span>
                </div>
              </div>

              {/* Gráficos de Perfil Vertical Oceanográfico */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-cyan-300 flex items-center gap-1 text-[11px]">
                      <Waves className="w-3.5 h-3.5" /> Perfil Vertical CTD Mar de Alborán (0 - 1000 m)
                    </h4>
                    <span className="text-[9px] text-slate-400 font-mono">Ecuación TEOS-10</span>
                  </div>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={verticalCtdProfile} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="depthPositiveM" stroke="#94a3b8" label={{ value: 'Profundidad (m)', position: 'insideBottom', offset: -4, fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis stroke="#94a3b8" />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Line type="monotone" dataKey="temperatureC" name="Temp (°C)" stroke="#f43f5e" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="salinityPsu" name="Salinidad (PSU)" stroke="#38bdf8" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="sigmaThetaKgM3" name="σθ (kg/m³-1000)" stroke="#a855f7" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-sky-300 flex items-center gap-1 text-[11px]">
                      <Compass className="w-3.5 h-3.5" /> Velocidad de Corrientes de Fondo y Superficie
                    </h4>
                    <span className="text-[9px] text-slate-400 font-mono">Giro Anticiclónico WAG</span>
                  </div>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={verticalCtdProfile} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="depthPositiveM" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" unit=" m/s" />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                        <Area type="monotone" dataKey="currentVelocityMs" name="Vel. Corriente (m/s)" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Cuadrícula de Masas de Agua del Mar de Alborán */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {ALBORAN_WATER_MASSES.map((mass) => (
                  <div key={mass.code} className="bg-slate-900/90 p-2.5 rounded border border-slate-800 hover:border-cyan-500/50 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-[11px]">{mass.name}</span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                        {mass.depthRangeM[0]}-{mass.depthRangeM[1]} m
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-1.5 leading-relaxed">{mass.description}</p>
                    <div className="grid grid-cols-2 gap-1 text-[9px] font-mono bg-slate-950 p-1.5 rounded border border-slate-800">
                      <div><span className="text-slate-500">S:</span> {mass.typicalSalinityPsu} PSU</div>
                      <div><span className="text-slate-500">θ:</span> {mass.typicalPotentialTempC}°C</div>
                      <div><span className="text-slate-500">σθ:</span> {mass.typicalDensitySigmaTheta} kg/m³</div>
                      <div><span className="text-slate-500">Vel:</span> {mass.currentVelocityRangeMs[0]}-{mass.currentVelocityRangeMs[1]} m/s</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= PESTAÑA 2: PENACHO DE CRUCEROS ================= */}
          {activeTab === 'cruise_plume' && (
            <div className="space-y-3">
              {/* Selector de Buques y Controles */}
              <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-300 font-semibold text-[11px]">Tipo de Buque de Pasaje / Crucero:</span>
                  {CRUISE_SHIP_PRESETS.map((preset) => (
                    <button
                      key={preset.shipClass}
                      onClick={() => setSelectedCruisePreset(preset)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                        selectedCruisePreset.shipClass === preset.shipClass
                          ? 'bg-sky-600 text-white shadow-[0_0_8px_rgba(2,132,199,0.5)]'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-semibold">Carga del Motor Principal:</span>
                      <span className="font-mono text-sky-300">{cruiseEngineLoadPct}%</span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={100}
                      step={5}
                      value={cruiseEngineLoadPct}
                      onChange={(e) => setCruiseEngineLoadPct(parseInt(e.target.value))}
                      className="w-full accent-sky-400 h-1 bg-slate-800 rounded"
                    />
                    <span className="text-[9px] text-slate-500">Hoteling: 20% • Maniobra dársena: 60-70% • Navegación: 85%</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-semibold">Azufre en Combustible (Med-ECA):</span>
                      <span className="font-mono text-amber-300">{cruiseFuelSulfurPct.toFixed(2)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={0.50}
                      step={0.01}
                      value={cruiseFuelSulfurPct}
                      onChange={(e) => setCruiseFuelSulfurPct(parseFloat(e.target.value))}
                      className="w-full accent-amber-400 h-1 bg-slate-800 rounded"
                    />
                    <span className="text-[9px] text-slate-500">Límite legal OMI Med-ECA 2025: 0.10% masa S</span>
                  </div>

                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-semibold">Parámetros de Chimenea:</div>
                    <div className="text-[9px] text-slate-300 font-mono mt-0.5 grid grid-cols-2 gap-1">
                      <div>Altura: {selectedCruisePreset.stackHeightM} m</div>
                      <div>Diámetro: {selectedCruisePreset.stackDiameterM} m</div>
                      <div>Tª Gas: {selectedCruisePreset.exhaustGasTempC} °C</div>
                      <div>Vel. Salida: {selectedCruisePreset.exhaustVelocityMs} m/s</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico de Transecto Espacial de Dispersión */}
              <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-sky-300 flex items-center gap-1 text-[11px]">
                    <Ship className="w-3.5 h-3.5" /> Transecto de Concentración en el Eje de Viento (Muelle Levante → Centro)
                  </h4>
                  <span className="text-[9px] text-slate-400 font-mono">Dispersión Gaussiana Marina (Briggs)</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cruisePlumeResult.transect} margin={{ top: 5, right: 10, left: -10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="downwindDistanceM"
                        stroke="#94a3b8"
                        unit="m"
                        label={{ value: 'Distancia desde la Chimenea del Crucero (m)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }}
                      />
                      <YAxis stroke="#94a3b8" unit=" µg/m³" />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px', bottom: 0 }} />
                      <Line type="monotone" dataKey="centerlineNO2UgM3" name="NO₂ (µg/m³)" stroke="#f43f5e" strokeWidth={2} />
                      <Line type="monotone" dataKey="centerlineSO2UgM3" name="SO₂ (µg/m³)" stroke="#fbbf24" strokeWidth={2} />
                      <Line type="monotone" dataKey="centerlinePM25UgM3" name="PM₂.₅ (µg/m³)" stroke="#38bdf8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabla de Hitos Geográficos Afectados */}
              <div className="bg-slate-900/80 p-3 rounded border border-slate-800 overflow-x-auto">
                <table className="w-full text-left font-mono text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-1">Distancia</th>
                      <th>Hito de Málaga</th>
                      <th>Cota Penacho</th>
                      <th>NO₂ (µg/m³)</th>
                      <th>SO₂ (µg/m³)</th>
                      <th>PM₂.₅ (µg/m³)</th>
                      <th>Inversión Marina</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cruisePlumeResult.transect.map((p) => (
                      <tr key={p.downwindDistanceM} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                        <td className="py-1 text-cyan-400">{p.downwindDistanceM} m</td>
                        <td className="text-white font-sans">{p.geographicLandmark}</td>
                        <td className="text-slate-300">{p.plumeHeightM} m</td>
                        <td className="text-rose-400 font-bold">{p.centerlineNO2UgM3}</td>
                        <td className="text-amber-400">{p.centerlineSO2UgM3}</td>
                        <td className="text-sky-400">{p.centerlinePM25UgM3}</td>
                        <td>
                          {p.marineInversionCapping ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[9px]">Atrapado MABL</span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px]">Dispersión Libre</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= PESTAÑA 3: AEROPUERTO AGP ================= */}
          {activeTab === 'airport_agp' && (
            <div className="space-y-3">
              {/* Diagrama Interactivo a Color del Aeropuerto AGP */}
              <AirportLtoInteractiveDiagram
                ambientTempC={ambientTempC}
                liveWindSpeedMs={windSpeedMS}
                liveWindDirDeg={windDirectionDeg}
                dailyFlightOps={hourlyFlightMovements * 10}
              />

              {/* Controles de Operativa del Aeropuerto AGP */}
              <div className="bg-slate-900/80 p-3 rounded border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-semibold flex items-center gap-1">
                      <Plane className="w-3 h-3 text-amber-400" /> Movimientos Horarios LTO:
                    </span>
                    <span className="font-mono text-amber-300">{hourlyFlightMovements} ops/h</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={65}
                    step={1}
                    value={hourlyFlightMovements}
                    onChange={(e) => setHourlyFlightMovements(parseInt(e.target.value))}
                    className="w-full accent-amber-400 h-1 bg-slate-800 rounded"
                  />
                  <span className="text-[9px] text-slate-500">Valle: 12 ops/h • Hora Punta Estival: 48-60 ops/h</span>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-semibold">Configuración de Pista Activa:</span>
                    <span className="font-mono text-sky-300">Pista {activeRunway === '13_31' ? '13/31 (Principal)' : '12/30 (Secundaria)'}</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setActiveRunway('13_31')}
                      className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all ${
                        activeRunway === '13_31' ? 'bg-sky-950 border-sky-400 text-sky-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Pista 13/31 (3.200 m)
                    </button>
                    <button
                      onClick={() => setActiveRunway('12_30')}
                      className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all ${
                        activeRunway === '12_30' ? 'bg-sky-950 border-sky-400 text-sky-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Pista 12/30 (2.750 m)
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-semibold">Inversión Térmica Guadalhorce:</span>
                    <span className="font-mono text-purple-300">{guadalhorceInversionCeilingM} m</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={400}
                    step={10}
                    value={guadalhorceInversionCeilingM}
                    onChange={(e) => setGuadalhorceInversionCeilingM(parseInt(e.target.value))}
                    className="w-full accent-purple-400 h-1 bg-slate-800 rounded"
                  />
                  <span className="text-[9px] text-slate-500">Inversión matinal por radiación: 80-150 m</span>
                </div>
              </div>

              {/* Gráfico de Partículas Ultrafinas y NOx del Aeropuerto */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-amber-300 flex items-center gap-1 text-[11px]">
                      <Zap className="w-3.5 h-3.5" /> Concentración de Partículas Ultrafinas (nvPM sub-10nm)
                    </h4>
                    <span className="text-[9px] text-slate-400 font-mono">Valle del Guadalhorce</span>
                  </div>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={airportResult.transectGuadalhorce} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="distKm" stroke="#94a3b8" unit=" km" />
                        <YAxis stroke="#94a3b8" />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                        <Area type="monotone" dataKey="ufpConcentrationPartCm3" name="UFP (part/cm³)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} />
                        <ReferenceLine y={20000} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Fondo Urbano', fill: '#ef4444', fontSize: 9 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-sky-300 flex items-center gap-1 text-[11px]">
                      <Activity className="w-3.5 h-3.5" /> NOx y Aerosol Orgánico Secundario Jet-A1 (SOA)
                    </h4>
                    <span className="text-[9px] text-slate-400 font-mono">Oxidación Fotoquímica</span>
                  </div>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={airportResult.transectGuadalhorce} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="distKm" stroke="#94a3b8" unit=" km" />
                        <YAxis stroke="#94a3b8" unit=" µg/m³" />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Line type="monotone" dataKey="noxUgM3" name="NOx (µg/m³)" stroke="#f43f5e" strokeWidth={2} />
                        <Line type="monotone" dataKey="jetA1SoaUgM3" name="SOA Jet-A1 (µg/m³)" stroke="#38bdf8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Desglose de Puntos Receptores del Aeropuerto */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {airportResult.transectGuadalhorce.slice(0, 4).map((p) => (
                  <div key={p.distKm} className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400">{p.distKm} km • {p.landmark}</div>
                    <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
                      {p.ufpConcentrationPartCm3.toLocaleString()} <span className="text-[9px] text-slate-500">part/cm³</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                      NOx: {p.noxUgM3} µg/m³ | SOA: {p.jetA1SoaUgM3} µg/m³
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= PESTAÑA 4: MATRIZ DE SINERGIA ================= */}
          {activeTab === 'synergy_matrix' && (
            <div className="space-y-3">
              {/* Encabezado Teórico */}
              <div className="bg-slate-900/90 p-3 rounded border border-purple-900/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <h4 className="font-bold text-purple-300 text-xs flex items-center gap-1.5">
                    <Atom className="w-4 h-4 text-purple-400" />
                    Acoplamiento Tripartito: Ciclos de Halógenos Litorales, Pluma Portuaria y Aeropuerto AGP
                  </h4>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                    Bertram & Thornton (2009) • Riedel et al. (2014) • Finlayson-Pitts (2010)
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  En la atmósfera litoral de Málaga, la modelización aislada genera un <span className="text-amber-300 font-semibold">grave sesgo de subestimación fotoquímica</span>. El <span className="text-rose-400 font-semibold">NOx nocturno emitido por los cruceros en atraque</span> (Puerto) y el <span className="text-amber-400 font-semibold">drenaje catabático fluvial de aviación</span> (Aeropuerto AGP) es confinado en la inversión térmica superficial sobre la bahía. Al entrar en contacto con el aerosol salino marino (<span className="text-cyan-400 font-mono">NaCl</span>), se activa la reacción heterogénea de captura de <span className="text-indigo-300 font-mono">N₂O₅</span> que acumula nitryl chloride (<span className="text-cyan-300 font-mono">ClNO₂</span>). Al amanecer, su rápida fotólisis desata un pulso violento de radicales de cloro (<span className="text-yellow-400 font-mono">Cl•</span>) que oxida los hidrocarburos inquemados del queroseno (<span className="text-sky-300 font-mono">Jet-A1</span>) hasta 40 veces más rápido que el radical <span className="text-emerald-400 font-mono">OH•</span>, provocando un adelanto de casi 2 horas en la formación de ozono matinal.
                </p>
              </div>

              {/* Sliders Interactivos de Control de Escenario Tripartito */}
              <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-purple-400" /> Controles Cinemáticos de la Interacción Litoral:
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">Parámetros deterministas acoplados</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-300 font-semibold flex items-center gap-1">
                        <Ship className="w-3 h-3 text-sky-400" /> Buques Atraque (Puerto):
                      </span>
                      <span className="font-mono text-sky-300">{synergyBerths} buques</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={8}
                      step={1}
                      value={synergyBerths}
                      onChange={(e) => setSynergyBerths(parseInt(e.target.value))}
                      className="w-full accent-sky-400 h-1 bg-slate-800 rounded"
                    />
                    <div className="text-[9px] text-slate-500 mt-1">Dique de Levante & Muelle 1</div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-300 font-semibold flex items-center gap-1">
                        <Plane className="w-3 h-3 text-amber-400" /> Rodaje Taxi AGP:
                      </span>
                      <span className="font-mono text-amber-300">{synergyAirportTaxiMin} min</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={45}
                      step={1}
                      value={synergyAirportTaxiMin}
                      onChange={(e) => setSynergyAirportTaxiMin(parseInt(e.target.value))}
                      className="w-full accent-amber-400 h-1 bg-slate-800 rounded"
                    />
                    <div className="text-[9px] text-slate-500 mt-1">Combustión rica a 7% thrust</div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-300 font-semibold flex items-center gap-1">
                        <Waves className="w-3 h-3 text-cyan-400" /> Superficie Aerosol Sₐ:
                      </span>
                      <span className="font-mono text-cyan-300">{synergySeaSaltSa} µm²/cm³</span>
                    </div>
                    <input
                      type="range"
                      min={150}
                      max={1100}
                      step={25}
                      value={synergySeaSaltSa}
                      onChange={(e) => setSynergySeaSaltSa(parseInt(e.target.value))}
                      className="w-full accent-cyan-400 h-1 bg-slate-800 rounded"
                    />
                    <div className="text-[9px] text-slate-500 mt-1">Área salina interfacial</div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-300 font-semibold flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-teal-400" /> Cloruros [Cl⁻]:
                      </span>
                      <span className="font-mono text-teal-300">{synergyChlorideMolarity.toFixed(1)} M</span>
                    </div>
                    <input
                      type="range"
                      min={0.8}
                      max={5.5}
                      step={0.1}
                      value={synergyChlorideMolarity}
                      onChange={(e) => setSynergyChlorideMolarity(parseFloat(e.target.value))}
                      className="w-full accent-teal-400 h-1 bg-slate-800 rounded"
                    />
                    <div className="text-[9px] text-slate-500 mt-1">Molaridad salina acuosa</div>
                  </div>
                </div>
              </div>

              {/* Indicadores Clave del Acoplamiento Físico-Químico */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                <div className="bg-slate-900 p-2 rounded border border-rose-900/40">
                  <div className="text-[9px] text-rose-400 font-semibold flex items-center gap-1">
                    NOx Nocturno Total
                  </div>
                  <div className="text-sm font-bold text-rose-200 mt-0.5 font-mono">
                    {synergyResult.combinedNo2Ppb} <span className="text-[9px] text-slate-400">ppb</span>
                  </div>
                  <div className="text-[8px] text-slate-400 font-mono mt-0.5">
                    Puerto + AGP + Fondo
                  </div>
                </div>

                <div className="bg-slate-900 p-2 rounded border border-indigo-900/40">
                  <div className="text-[9px] text-indigo-400 font-semibold flex items-center gap-1">
                    ClNO₂ al Amanecer
                  </div>
                  <div className="text-sm font-bold text-indigo-200 mt-0.5 font-mono">
                    {synergyResult.accumulatedClno2PpbDawn} <span className="text-[9px] text-slate-400">ppb</span>
                  </div>
                  <div className="text-[8px] text-slate-400 font-mono mt-0.5">
                    P: {synergyResult.nocturnalClno2ProdRatePptHr} ppt/h
                  </div>
                </div>

                <div className="bg-slate-900 p-2 rounded border border-yellow-900/40">
                  <div className="text-[9px] text-yellow-400 font-semibold flex items-center gap-1">
                    Pulso Radical Cl•
                  </div>
                  <div className="text-sm font-bold text-yellow-200 mt-0.5 font-mono">
                    {synergyResult.peakMorningClRadical10e4} <span className="text-[9px] text-slate-400">x10⁴</span>
                  </div>
                  <div className="text-[8px] text-slate-400 font-mono mt-0.5">
                    moléc/cm³ (J: {synergyResult.jClno2PerSec} s⁻¹)
                  </div>
                </div>

                <div className="bg-slate-900 p-2 rounded border border-cyan-900/40">
                  <div className="text-[9px] text-cyan-400 font-semibold flex items-center gap-1">
                    Oxidación Jet-A1
                  </div>
                  <div className="text-sm font-bold text-cyan-200 mt-0.5 font-mono">
                    +{synergyResult.jetA1KeroseneOxidationAccRatio}x
                  </div>
                  <div className="text-[8px] text-slate-400 font-mono mt-0.5">
                    k(Cl•)/k(OH•) al alba
                  </div>
                </div>

                <div className="bg-slate-900 p-2 rounded border border-emerald-900/40">
                  <div className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                    Adelanto Pico O₃
                  </div>
                  <div className="text-sm font-bold text-emerald-200 mt-0.5 font-mono">
                    +{synergyResult.ozonePeakAdvanceHours} <span className="text-[9px] text-slate-400">horas</span>
                  </div>
                  <div className="text-[8px] text-slate-400 font-mono mt-0.5">
                    +{synergyResult.morningOzoneSurplusUgM3} µg/m³ matinal
                  </div>
                </div>

                <div className="bg-slate-900 p-2 rounded border border-amber-900/40">
                  <div className="text-[9px] text-amber-400 font-semibold flex items-center gap-1">
                    Desplazam. Ácido SO₂
                  </div>
                  <div className="text-sm font-bold text-amber-200 mt-0.5 font-mono">
                    {synergyResult.aerosolPHDropDelta} <span className="text-[9px] text-slate-400">pH</span>
                  </div>
                  <div className="text-[8px] text-slate-400 font-mono mt-0.5">
                    {synergyResult.halogenAcidDisplacementFluxMgM2Hr} mg/m²·h HCl↑
                  </div>
                </div>

                <div className="bg-slate-900 p-2 rounded border border-purple-900/40">
                  <div className="text-[9px] text-purple-400 font-semibold flex items-center gap-1">
                    Estrés OP^DTT
                  </div>
                  <div className="text-sm font-bold text-purple-200 mt-0.5 font-mono">
                    {synergyResult.synergisticOpDttNmolMinM3}
                  </div>
                  <div className="text-[8px] text-slate-400 font-mono mt-0.5">
                    nmol DTT/(min·m³)
                  </div>
                </div>
              </div>

              {/* Gráficos de Simulación Diurna: Acoplamiento vs Clásico */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-bold text-emerald-300 flex items-center gap-1 text-[11px]">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" /> Tasa de Formación de O₃: Acoplado (Halógenos+Puerto+AGP) vs Clásico
                    </h5>
                    <span className="text-[9px] text-slate-400 font-mono">d[O₃]/dt (ppb/h)</span>
                  </div>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={synergyResult.diurnalCoupling} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="timeLabel" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" unit=" ppb/h" />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Area type="monotone" dataKey="ozoneRateCoupledPpbHr" name="Acoplado (Halógenos+Puerto+AGP)" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                        <Area type="monotone" dataKey="ozoneRateClassicalPpbHr" name="Modelo Tradicional (Sin Halógenos)" stroke="#64748b" fill="#64748b" fillOpacity={0.15} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 italic">
                    Nótese el estallido matinal entre 06:00 y 09:00: el pulso de Cl• inicia la oxidación de VOCs 2 horas antes de que el radical OH• sea significativo.
                  </p>
                </div>

                <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-bold text-yellow-300 flex items-center gap-1 text-[11px]">
                      <Zap className="w-3.5 h-3.5 text-yellow-400" /> Cinética de Fotólisis de ClNO₂ y Radicales Cl• vs OH•
                    </h5>
                    <span className="text-[9px] text-slate-400 font-mono">Evolución de Especies Reactivas</span>
                  </div>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={synergyResult.diurnalCoupling} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="timeLabel" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Line type="monotone" dataKey="clno2Ppt" name="[ClNO₂] (ppt)" stroke="#818cf8" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="clRadical10e4" name="[Cl•] (x10⁴ moléc/cm³)" stroke="#facc15" strokeWidth={2} />
                        <Line type="monotone" dataKey="ohRadical10e6" name="[OH•] (x10⁶ moléc/cm³)" stroke="#38bdf8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 italic">
                    El ClNO₂ se agota rápidamente al salir el sol alimentando el pico de Cl•, mientras que el OH• alcanza su cénit solar pasado el mediodía.
                  </p>
                </div>
              </div>

              {/* Matriz Territorial de Receptores Afectados en Málaga */}
              <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    Impacto en la Red Territorial de Receptores de Málaga:
                  </h5>
                  <span className="text-[9px] text-slate-400 font-mono">Asimilación acoplada multiescala</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[10px]">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400">
                        <th className="py-1">Punto Receptor</th>
                        <th>Dist. Puerto</th>
                        <th>Dist. AGP</th>
                        <th>NO₂ (µg/m³)</th>
                        <th>ClNO₂ (ppt)</th>
                        <th>UFP (part/cm³)</th>
                        <th>Δ O₃ Matinal</th>
                        <th>Mecanismo Físico-Químico Dominante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {synergyResult.receptorHotspots.map((r, i) => (
                        <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                          <td className="py-1.5 font-sans font-semibold text-white">{r.name}</td>
                          <td className="text-cyan-400">{r.distancePortKm} km</td>
                          <td className="text-amber-400">{r.distanceAirportKm} km</td>
                          <td className="text-rose-400 font-bold">{r.no2UgM3}</td>
                          <td className="text-indigo-300 font-bold">{r.clno2Ppt}</td>
                          <td className="text-amber-300">{r.ufpPartCm3.toLocaleString()}</td>
                          <td className="text-emerald-400 font-bold">+{r.earlyOzoneSurplusUgM3} µg/m³</td>
                          <td className="text-slate-300 font-sans text-[9px]">{r.dominantMechanism}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MÓDULO DE SUGERENCIAS Y RECOMENDACIONES METODOLÓGICAS PARA LA TESIS DOCTORAL */}
              <div className="bg-slate-900/90 p-3.5 rounded border border-purple-500/40 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    <div>
                      <h4 className="font-bold text-purple-200 text-xs">
                        Sugerencias y Recomendaciones Metodológicas para la Tesis Doctoral
                      </h4>
                      <div className="text-[10px] text-slate-400">
                        Directrices para tribunal evaluador, publicaciones Q1 y modelización del Gemelo Digital
                      </div>
                    </div>
                  </div>
                  
                  {/* Selectores de Ejes */}
                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: 'clno2', label: '1. ClNO₂ & Pulso Cl•' },
                      { id: 'port', label: '2. Puerto & Med-ECA' },
                      { id: 'agp', label: '3. AGP & nvPM' },
                      { id: 'experiments', label: '4. Campaña CIMS/DOAS' },
                      { id: 'regulations', label: '5. Sesgo de Modelos' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSuggestionTab(tab.id as any)}
                        className={`px-2 py-1 rounded text-[9px] font-bold transition-all border ${
                          activeSuggestionTab === tab.id
                            ? 'bg-purple-900 border-purple-400 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contenido Dinámico de las Sugerencias */}
                {activeSuggestionTab === 'clno2' && (
                  <div className="space-y-2 text-[11px] text-slate-300">
                    <div className="font-bold text-purple-300 flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Eje 1: Formulación Cinemática y Mecanística del Pulso Matinal de Cl•
                    </div>
                    <p className="leading-relaxed">
                      Para la memoria de la tesis, se sugiere <span className="text-white font-semibold">formalizar el acoplamiento interfacial</span> entre el solver de captación de N₂O₅ en gotas de aerosol salino según la parametrización de <span className="text-cyan-300 font-semibold">Bertram & Thornton (2009)</span>:
                    </p>
                    <div className="p-2 rounded bg-slate-950 text-[10.5px] text-slate-200 border border-slate-800 overflow-x-auto">
                      <MathFormula math="\gamma(\text{N}_2\text{O}_5) = 0.033 \cdot \left[ 1 - \left( 1 + \frac{0.06 [\text{H}_2\text{O}]}{[\text{NO}_3^-]} + \frac{29.0 [\text{Cl}^-]}{[\text{NO}_3^-]} \right)^{-1} \right]" displayMode={true} />
                    </div>
                    <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-400">
                      <li><strong className="text-slate-200">Recomendación de Discusión:</strong> Explicar cómo la brisa marina densa de la Bahía de Málaga ([Cl⁻] &gt; 3.0 M) maximiza el rendimiento molar Φ(ClNO₂) superando el 85%, transformando el penacho nocturno portuario en un reservorio letal de halógenos.</li>
                      <li><strong className="text-slate-200">Aceleración Cinética:</strong> Demostrar analíticamente que la constante bimolecular k(Cl• + alcanos) es de 10 a 50 veces superior a k(OH• + alcanos), desencadenando la producción de radicales peroxilo (RO₂•) antes de las 08:00 AM.</li>
                    </ul>
                  </div>
                )}

                {activeSuggestionTab === 'port' && (
                  <div className="space-y-2 text-[11px] text-slate-300">
                    <div className="font-bold text-sky-300 flex items-center gap-1.5 text-xs">
                      <Ship className="w-3.5 h-3.5 text-sky-400" />
                      Eje 2: Acoplamiento Multiescala Puerto-Litoral (Med-ECA y OPS Cold Ironing)
                    </div>
                    <p className="leading-relaxed">
                      El Puerto de Málaga presenta atraques de cruceros turísticos de gran porte contiguos al Centro Histórico (Dique de Levante, a escasos 1.2 km de la Alameda Principal).
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <div className="font-bold text-amber-300 mb-1">Impacto de la Norma OMI Med-ECA 2025:</div>
                        <p className="text-slate-400">
                          La reducción del límite de azufre del fuel de navegación de 0.50% a 0.10% en masa frena la acidificación del aerosol salino. La tesis debe cuantificar la amortiguación del desplazamiento ácido de halógenos: menor formación de H₂SO₄ secundario implica un pH del aerosol más alto (pH &gt; 4.5), lo que estabiliza los cloruros y atenúa la emisión espontánea de Cl₂ gaseoso.
                        </p>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <div className="font-bold text-emerald-300 mb-1">Electrificación OPS (Cold Ironing):</div>
                        <p className="text-slate-400">
                          Proponer en el capítulo de medidas correctoras la implantación prioritaria de OPS (Onshore Power Supply) en Muelle 1 y Dique de Levante. La conexión a la red eléctrica terrestre durante el hotelling nocturno reduce a cero las emisiones auxiliares de NOx, desactivando en un 65% la fuente del precursor nocturno N₂O₅ en la dársena.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeSuggestionTab === 'agp' && (
                  <div className="space-y-2 text-[11px] text-slate-300">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                      <Plane className="w-3.5 h-3.5 text-amber-400" />
                      Eje 3: Microfísica de Partículas Ultrafinas nvPM y Vórtices de Estela en AGP
                    </div>
                    <p className="leading-relaxed">
                      El Aeropuerto de Málaga-Costa del Sol (AGP / LEMG) opera con dos pistas (13/31 y 12/30) orientadas a lo largo del <span className="text-white font-semibold">Valle del Bajo Guadalhorce</span>, generando un patrón de dispersión estrechamente acoplado con la topografía:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-400">
                      <li><strong className="text-slate-200">Fase Crítica de Rodaje (Taxiing):</strong> Los motores turbofan (CFM56, LEAP-1A) operan al 7% de empuje durante los ~25 min de rodaje medio. En este régimen de baja temperatura de turbina, la combustión incompleta maximiza la emisión de partículas ultrafinas no volátiles (nvPM sub-10nm) y formaldehído.</li>
                      <li><strong className="text-slate-200">Circulación de Vórtices de Estela (Spalart 1998):</strong> La circulación inicial Γ₀ (~350-400 m²/s) desciende e interactúa con el techo de inversión térmica fluvial (80-150 m), forzando el atrapamiento de contaminantes a cota de suelo hacia los núcleos residenciales de Guadalmar, San Julián y Churriana.</li>
                      <li><strong className="text-slate-200">Drenaje Catabático Nocturno:</strong> Por la noche, la brisa de tierra (terral del valle) transporta la pluma de AGP hacia la costa, donde colisiona directamente con el spray marino salino.</li>
                    </ul>
                  </div>
                )}

                {activeSuggestionTab === 'experiments' && (
                  <div className="space-y-2 text-[11px] text-slate-300">
                    <div className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Eje 4: Diseño de Campaña Experimental de Validación (Instrumentación Avanzada)
                    </div>
                    <p className="leading-relaxed">
                      Para la defensa doctoral y futura publicación Q1, se aconseja incluir un <span className="text-white font-semibold">protocolo de validación observacional de alta resolución</span> con instrumentación de referencia internacional:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <div className="font-bold text-cyan-300 mb-0.5">ToF-CIMS (Ion I⁻):</div>
                        <div className="text-slate-400">
                          Espectrometría de masas por ionización química con tiempo de vuelo para detección unívoca a nivel de ppt de ClNO₂, N₂O₅, BrCl e I₂ en la estación del Puerto y Guadalmar.
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <div className="font-bold text-amber-300 mb-0.5">PTR-TOF-MS:</div>
                        <div className="text-slate-400">
                          Espectrometría por transferencia de protones para discriminar COVs de queroseno Jet-A1 (alcanos C8-C14, trimetilbenceno) frente a COVs biogénicos de pinos de los Montes de Málaga.
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <div className="font-bold text-indigo-300 mb-0.5">MAX-DOAS:</div>
                        <div className="text-slate-400">
                          Espectroscopía de absorción óptica diferencial multi-eje desde el Faro de Málaga o Gibralfaro para obtener perfiles verticales en la bahía de NO₂, SO₂, BrO e IO.
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <div className="font-bold text-rose-300 mb-0.5">SMPS + CPC:</div>
                        <div className="text-slate-400">
                          Clasificador electrostático y contador de partículas para resolver la distribución granulométrica de UFP en cabecera de pista 13/31 de AGP (5 a 500 nm).
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSuggestionTab === 'regulations' && (
                  <div className="space-y-2 text-[11px] text-slate-300">
                    <div className="font-bold text-rose-300 flex items-center gap-1.5 text-xs">
                      <Scale className="w-3.5 h-3.5 text-rose-400" />
                      Eje 5: Cuantificación del Sesgo Sistemático en Modelos Regulatorios Tradicionales
                    </div>
                    <p className="leading-relaxed">
                      El Gemelo Digital de Málaga aporta una contribución doctrinal clave demostrando que los modelos estáticos oficiales (CALPUFF, CHIMERE estándar sin química halógena explícita) presentan un <span className="text-amber-300 font-semibold">error sistemático por defecto de entre 25% y 45% en los picos matinales de ozono</span>:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-400">
                      <li><strong className="text-slate-200">Retraso Falso en la Formación de O₃:</strong> Los modelos convencionales asumen que la fotoquímica no comienza hasta que la fotólisis del ozono genera OH• (09:30-10:00 AM). En la realidad costera de Málaga, la fotólisis de ClNO₂ arranca a las 06:45 AM, adelantando la producción oxidante.</li>
                      <li><strong className="text-slate-200">Relevancia Jurídica y Sanitaria:</strong> Este adelanto matinal coincide exactamente con la hora punta de entrada a colegios y desplazamientos laborales hacia el Centro y PTA, multiplicando la dosis inhalada por poblaciones vulnerables.</li>
                      <li><strong className="text-slate-200">Políticas Públicas Integradas:</strong> Demostrar que las medidas de la ZBE (Zona de Bajas Emisiones) municipal son insuficientes si no se coordinan con la Autoridad Portuaria (OPS) y ENAIRE/AENA (Green Taxiing y despegues continuos CDA).</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= PESTAÑA 5: EXPORTACIÓN FAIR ================= */}
          {activeTab === 'fair_export' && (
            <div className="space-y-3">
              <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    Exportación Abierta FAIR y Ecuaciones LaTeX para Tesis Doctoral
                  </h4>
                  <button
                    onClick={handleExportCsv}
                    className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Dataset Completo (.CSV)</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                  Los datos asimilados y observacionales en tiempo real cumplen los principios FAIR (Findable, Accessible, Interoperable, Reusable) e incorporan las métricas del acoplamiento tripartito: Hidrodinámica TEOS-10, Penachos de Cruceros, Vórtices de Aviación AGP y Cinética Heterogénea de Halógenos ClNO₂.
                </p>

                <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto">
                  <pre>{`% --- CÓDIGO LATEX DE LAS TABLAS OCEANOGRÁFICAS, DISPERSIÓN Y HALÓGENOS ---
\\begin{table}[h!]
\\centering
\\caption{Parámetros de Hidrodinámica, Emisiones Litorales y Acoplamiento de Halógenos en Málaga}
\\label{tab:alboran_cruises_agp_halogens}
\\begin{tabular}{lcccc}
\\hline
\\textbf{Dominio / Fuente} & \\textbf{Variable Clave} & \\textbf{Valor Asimilado} & \\textbf{Unidades} & \\textbf{Régimen Físico} \\\\
\\hline
Mar de Alborán (MAW) & Densidad TEOS-10 $\\rho$ & ${seawaterState.densityKgM3.toFixed(2)} & kg/m$^3$ & Salinidad: ${salinityPsu.toFixed(2)} PSU \\\\
Crucero ${selectedCruisePreset.shipClass} & Ascenso Briggs $\\Delta h$ & +${cruisePlumeResult.plumeRiseDeltaHM} & m & Flujo $F_0 = ${cruisePlumeResult.buoyancyFluxF0M4S3}$ m$^4$/s$^3$ \\\\
Aeropuerto AGP (Pista ${activeRunway}) & Circulación Vórtice $\\Gamma_0$ & ${airportResult.wingtipVortexCirculationM2S} & m$^2$/s & Techo inversión: ${airportResult.trappingAltitudeM} m \\\\
Acoplamiento Halógenos & $ClNO_2$ Acumulado & ${synergyResult.accumulatedClno2PpbDawn} & ppb & Rendimiento $\\Phi = ${(synergyResult.clno2YieldPhi * 100).toFixed(1)}\\%$ \\\\
Pulso Matinal de Cloro & $[Cl^\\bullet]$ Máximo & ${synergyResult.peakMorningClRadical10e4} \\times 10^4$ & moléc/cm$^3$ & Adelanto $O_3$: +${synergyResult.ozonePeakAdvanceHours} h \\\\
Desplazamiento Ácido $SO_2$ & Variación de pH & ${synergyResult.aerosolPHDropDelta} & $\\Delta$pH & Desgasificación HCl: ${synergyResult.halogenAcidDisplacementFluxMgM2Hr}$ mg/m$^2$h \\\\
Estrés Oxidativo Sinérgico & Potencial $OP^{DTT}$ & ${synergyResult.synergisticOpDttNmolMinM3} & nmol/(min$\\cdot$m$^3$) & Interacción nvPM-Sulfato-Sal \\\\
\\hline
\\end{tabular}
\\end{table}`}</pre>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Pie de Ventana */}
        <div className="p-2 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Formulaciones Deterministas TEOS-10 / Briggs / OACI Anexo 16 • Tesis Doctoral UMA</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
          >
            Cerrar Panel
          </button>
        </div>

      </div>
    </DraggableWindow>
  );
}
