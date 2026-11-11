import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Atom, Cpu, Network, Sparkles, Activity, 
  Layers, ShieldCheck, Download, RefreshCw, Zap, Scale,
  BookOpen, Info, ExternalLink, MapPin, Compass, Flame, Wind,
  Sun, Eye, AlertTriangle, CheckCircle2, ChevronRight, Gauge, HeartPulse,
  TrendingUp, BarChart3, Database, FileText
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { useActivePoint } from '../context/ActivePointContext';
import { computeFnoMicroscaleTurbulence } from '../lib/fnoFourierNeuralOperator';
import { computeHomsAndUltrafines } from '../lib/homsAutoOxidation';
import { computeSpectralPhotolysisJNo2 } from '../lib/spectralPhotolysisJNo2';
import { computeOxidativePotential } from '../lib/oxidativePotentialDTT';
import { computeHybrid4DVarAssimilation } from '../lib/hybrid4DVarEnkf';
import { computeBayesianEmissionInversion } from '../lib/bayesianEmissionInversion';

export interface Q1FrontiersSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  ambientTempC?: number;
  windSpeedMs?: number;
  relativeHumidity?: number;
  no2BaseUgm3?: number;
  o3BaseUgm3?: number;
  pm25BaseUgm3?: number;
  onFlyToLocation?: (lat: number, lon: number, zoom?: number, bearing?: number) => void;
}

export function Q1FrontiersSuiteModal({
  isOpen,
  onClose,
  ambientTempC = 24.5,
  windSpeedMs = 4.2,
  relativeHumidity = 62,
  no2BaseUgm3 = 28.4,
  o3BaseUgm3 = 52.1,
  pm25BaseUgm3 = 14.8,
  onFlyToLocation
}: Q1FrontiersSuiteModalProps) {
  const activePointCtx = useActivePoint();
  const [activeTab, setActiveTab] = useState<'fno' | 'homs' | 'spectralJ' | 'opDtt' | 'hybrid4dvar' | 'bayesianInversion'>('fno');

  // Punto Activo Sincronizado
  const activeStreetName = activePointCtx?.activePoint?.nearestStreetName 
    || activePointCtx?.activePoint?.name 
    || (activePointCtx?.activePoint?.neighborhoodName ? `${activePointCtx.activePoint.neighborhoodName}, Málaga` : 'Calle Larios / Centro Histórico');
  
  const curNo2 = activePointCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? no2BaseUgm3;
  const curO3 = activePointCtx?.assimilation?.ozoneO3UgM3 ?? o3BaseUgm3;
  const curPm25 = activePointCtx?.assimilation?.pm25UgM3 ?? pm25BaseUgm3;
  const curTemp = activePointCtx?.assimilation?.temperatureC ?? ambientTempC;
  const curWind = activePointCtx?.assimilation ? (activePointCtx.assimilation.windSpeedKmh / 3.6) : windSpeedMs;
  const curRelHum = activePointCtx?.assimilation?.relativeHumidityPct ?? relativeHumidity;

  // 1. FNO Parameters
  const [spectralModesK, setSpectralModesK] = useState(32);
  const [buildingHeightM, setBuildingHeightM] = useState(24.0);
  const [canyonWidthM, setCanyonWidthM] = useState(16.0);
  const [windAngleDeg, setWindAngleDeg] = useState(145);

  // 2. HOMs Parameters
  const [alphaPinenePpb, setAlphaPinenePpb] = useState(1.45);
  const [sunlightWm2, setSunlightWm2] = useState(680);

  // 3. Spectral Photolysis Parameters
  const [solarZenithDeg, setSolarZenithDeg] = useState(35.0);
  const [aod550Calima, setAod550Calima] = useState(0.28);
  const [albedoUrban, setAlbedoUrban] = useState(0.16);

  // 4. Oxidative Potential Parameters
  const [brakeCuNgM3, setBrakeCuNgM3] = useState(34.2);
  const [exhaustFeNgM3, setExhaustFeNgM3] = useState(110.5);
  const [organicCarbonUgm3, setOrganicCarbonUgm3] = useState(2.4);
  const [distIntersectionM, setDistIntersectionM] = useState(25);

  // 5. Hybrid 4D-Var Parameters
  const [ensembleSizeN, setEnsembleSizeN] = useState(32);
  const [tropomiCol, setTropomiCol] = useState(3.65);
  const [assimWindowH, setAssimWindowH] = useState(6);

  // 6. Bayesian Inversion Parameters
  const [trafficVehHour, setTrafficVehHour] = useState(1450);
  const [heavyDutyFractionPct, setHeavyDutyFractionPct] = useState(8.5);
  const [distLaneCenterM, setDistLaneCenterM] = useState(4.5);

  // Calculations
  const fnoResults = useMemo(() => {
    return computeFnoMicroscaleTurbulence({
      inletWindSpeedMs: curWind,
      windDirectionDeg: windAngleDeg,
      buildingHeightM,
      canyonWidthM,
      spectralModesK
    });
  }, [curWind, windAngleDeg, buildingHeightM, canyonWidthM, spectralModesK]);

  const homsResults = useMemo(() => {
    return computeHomsAndUltrafines({
      alphaPinenePpb,
      ozonePpb: curO3,
      temperatureC: curTemp,
      relHumidityPct: curRelHum,
      sunlightRadWm2: sunlightWm2
    });
  }, [alphaPinenePpb, curO3, curTemp, curRelHum, sunlightWm2]);

  const spectralResults = useMemo(() => {
    return computeSpectralPhotolysisJNo2({
      solarZenithAngleDeg: solarZenithDeg,
      aerosolOpticalDepth550: aod550Calima,
      temperatureC: curTemp,
      urbanSurfaceAlbedo: albedoUrban,
      totalOzoneColDobson: 310
    });
  }, [solarZenithDeg, aod550Calima, curTemp, albedoUrban]);

  const opResults = useMemo(() => {
    return computeOxidativePotential({
      pm25ConcentrationUgm3: curPm25,
      brakeWearCuNgM3: brakeCuNgM3,
      exhaustFeNgM3: exhaustFeNgM3,
      organicCarbonUgm3,
      distanceToIntersectionM: distIntersectionM
    });
  }, [curPm25, brakeCuNgM3, exhaustFeNgM3, organicCarbonUgm3, distIntersectionM]);

  const varResults = useMemo(() => {
    return computeHybrid4DVarAssimilation({
      ensembleSizeN,
      tropomiNo2Column1015MolecCm2: tropomiCol,
      officialStationsCount: 5,
      backgroundErrorVarianceRatio: 1.2,
      assimilationWindowHours: assimWindowH
    });
  }, [ensembleSizeN, tropomiCol, assimWindowH]);

  const bayesianResults = useMemo(() => {
    return computeBayesianEmissionInversion({
      measuredNo2Ugm3: curNo2,
      streetName: activeStreetName,
      trafficHourlyVehicles: trafficVehHour,
      heavyDutyPct: heavyDutyFractionPct,
      canyonAspectRatioHW: buildingHeightM / Math.max(1, canyonWidthM),
      windSpeedU10: curWind,
      windDirectionAngleDeg: windAngleDeg,
      distanceToCenterM: distLaneCenterM
    });
  }, [curNo2, activeStreetName, trafficVehHour, heavyDutyFractionPct, buildingHeightM, canyonWidthM, curWind, windAngleDeg, distLaneCenterM]);

  // Export full JSON / CSV scientific dossier
  const handleExportDossier = () => {
    const reportData = {
      title: "Dictamen Científico de Fronteras de Investigación Q1 (2025/2026/2027)",
      institution: "UNED - Escuela Internacional de Doctorado / Gemelo Digital de Málaga",
      activePoint: {
        street: activeStreetName,
        lat: activePointCtx?.location?.lat ?? 36.7213,
        lon: activePointCtx?.location?.lon ?? -4.4214,
        telemetry: {
          no2_ugm3: curNo2,
          o3_ugm3: curO3,
          pm25_ugm3: curPm25,
          windSpeed_ms: curWind,
          temp_c: curTemp
        }
      },
      timestamp: new Date().toISOString(),
      models: {
        fourierNeuralOperator3D: fnoResults,
        homsAutoOxidationUltrafines: homsResults,
        spectralRadiativePhotolysis: spectralResults,
        oxidativePotentialToxicology: opResults,
        hybrid4DVarAssimilationAndDesroziers: varResults,
        bayesianEmissionInversionFluxPinpointing: bayesianResults
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe_fronteras_q1_malaga_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title="Fronteras de Investigación Q1 (2025–2027) • Física & Química Atmosférica"
      icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
      subtitle="UNED EIDUNED • Physics-Informed Microscale Digital Twin de Málaga"
      onClose={onClose}
      defaultCollapsed={true}
      className="w-full max-w-5xl max-h-[88vh]"
    >
      <div className="flex flex-col h-full bg-slate-950 text-slate-100 text-xs">
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3 py-2">
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <ScientificTooltip
              title="Fourier Neural Operators (FNO 3D)"
              content="Aproximación de campos continuos de turbulencia en espacio de Fourier con resolución invariante en cañones urbanos de Málaga."
              citation="Li et al. (ICLR 2021) / Fourier Neural Operator"
            >
              <button
                onClick={() => setActiveTab('fno')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'fno'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>1. FNO 3D Turbulencia</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Mecanismo de Auto-Oxidación de HOMs"
              content="Ruta de adición intramolecular de O₂ a radicales peroxilo (RO₂•) derivados de monoterpenos (Monte Victoria) para nucleación de nanopartículas ultrafinas (UFP)."
              citation="Ehn et al. (Nature 2014) / HOMs Theory"
            >
              <button
                onClick={() => setActiveTab('homs')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'homs'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Atom className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. HOMs Auto-Oxidación</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Transferencia Radiativa Espectral y J(NO₂)"
              content="Cálculo fotolítico de alta resolución acoplado a la columna de ozono total de OMI/TROPOMI y al flujo actínico de Meteosat MTG-I1 FCI."
              citation="TUV Model / Madronich (1993)"
            >
              <button
                onClick={() => setActiveTab('spectralJ')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'spectralJ'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>3. Fotólisis Espectral J_NO2</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Potencial Oxidativo Toxico-Celular (OP-DTT)"
              content="Capacidad de las partículas PM2.5 (hidrocarburos aromáticos policíclicos y metales de transición) para agotar el ditiotreitol e inducir estrés oxidativo pulmonar."
              citation="Cho et al. (Environ. Res. 2005) / Charrier et al. (2012)"
            >
              <button
                onClick={() => setActiveTab('opDtt')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'opDtt'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                <span>4. Potencial Oxidativo OP^DTT</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Asimilación Variacional Híbrida 4D-Var EnKF"
              content="Fusión óptima de la covarianza de fondo B del ensamble con la ventana temporal 4D y diagnóstico Desroziers para la autoconsistencia de errores observacionales."
              citation="Lorenc (QJRMS 2003) / Desroziers et al. (2005)"
            >
              <button
                onClick={() => setActiveTab('hybrid4dvar')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'hybrid4dvar'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Network className="w-3.5 h-3.5 text-purple-400" />
                <span>5. 4D-Var EnKF & Desroziers</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Inversión Bayesiana de Emisiones (MCMC)"
              content="Estimación retrospectiva de la tasa real de emisión de NOx vehicular y portuaria resolviendo el problema inverso mediante cadenas de Markov Monte Carlo."
              citation="Tarantola (2005) / Inverse Problem Theory"
            >
              <button
                onClick={() => setActiveTab('bayesianInversion')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'bayesianInversion'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                <span>6. Inversión Bayesiana Flujos</span>
              </button>
            </ScientificTooltip>
          </div>

          <div className="flex items-center space-x-2 pl-2">
            <ScientificTooltip
              title="Exportar Dictamen Científico Completo (FAIR JSON)"
              content="Genera el archivo estructurado con todos los tensores FNO, tasas cinéticas HOMs, espectros J(NO₂) e inversiones bayesianas para el tribunal doctoral."
              citation="EIDUNED / FAIR Principles"
            >
              <button
                onClick={handleExportDossier}
                className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Exportar FAIR JSON</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* TAB 1: FNO 3D TURBULENCIA */}
          {activeTab === 'fno' && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-lg flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-cyan-300">Fourier Neural Operator 3D (3D-FNO Navier-Stokes en GPU)</h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-900/60 text-cyan-200 border border-cyan-700">JCP / Nat. Mach. Intell. 2025</span>
                  </div>
                  <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                    Operador espectral continuo que resuelve el campo 3D de micro-turbulencia u(x,y,z) en cañones urbanos a resolución infinitesimal mediante transformadas de Fourier neuronales en GPU sin dependencia de mallas fijas.
                  </p>
                </div>
                {onFlyToLocation && (
                  <ScientificTooltip position="left" width="w-[280px]" content="Desplazar la cámara al cañón de Calle Larios (H/W=1.35) para inspeccionar el campo 3D continuo de micro-turbulencia resuelto por el FNO.">
                    <button
                      onClick={() => onFlyToLocation(36.7185, -4.4213, 17, 30)}
                      className="flex items-center space-x-1 px-2 py-1 bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-200 border border-cyan-600/40 rounded text-[11px] transition-colors shrink-0 ml-3 cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>Calle Larios</span>
                    </button>
                  </ScientificTooltip>
                )}
              </div>

              {/* Parametric Controls */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Modos Fourier K:</label>
                  <ScientificTooltip position="bottom" width="w-[280px]" content="Número de modos de Fourier truncados en el operador espectral continuo. Mayor K captura vórtices turbulentos de menor escala.">
                    <select
                      value={spectralModesK}
                      onChange={(e) => setSpectralModesK(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono cursor-pointer"
                    >
                      <option value={16}>K = 16 (Ultra-Rápido 144 FPS)</option>
                      <option value={32}>K = 32 (Resolución Óptima 120 FPS)</option>
                      <option value={64}>K = 64 (Máxima Precisión 75 FPS)</option>
                    </select>
                  </ScientificTooltip>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Altura Edificio H (m):</label>
                  <input
                    type="number"
                    value={buildingHeightM}
                    onChange={(e) => setBuildingHeightM(Number(e.target.value))}
                    min={6}
                    max={60}
                    step={1}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Anchura Cañón W (m):</label>
                  <input
                    type="number"
                    value={canyonWidthM}
                    onChange={(e) => setCanyonWidthM(Number(e.target.value))}
                    min={4}
                    max={50}
                    step={1}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Ángulo Incidencia Viento (°):</label>
                  <input
                    type="number"
                    value={windAngleDeg}
                    onChange={(e) => setWindAngleDeg(Number(e.target.value))}
                    min={0}
                    max={360}
                    step={5}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Outputs Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Vorticidad Máx. ω</span>
                  <div className="text-base font-bold text-cyan-300 mt-1 font-mono">{fnoResults.maxVorticityS1} <span className="text-xs text-slate-400">s⁻¹</span></div>
                  <span className="text-[10px] text-slate-500">Cizalladura en vórtice</span>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Velocidad Recirculación</span>
                  <div className="text-base font-bold text-emerald-300 mt-1 font-mono">{fnoResults.recirculationVelocityMs} <span className="text-xs text-slate-400">m/s</span></div>
                  <span className="text-[10px] text-slate-500">Fondo de cañón</span>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Energía Cinética Turb. k</span>
                  <div className="text-base font-bold text-amber-300 mt-1 font-mono">{fnoResults.tkeM2S2} <span className="text-xs text-slate-400">m²/s²</span></div>
                  <span className="text-[10px] text-slate-500">TKE en capa de corte</span>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Velocidad Inferencia</span>
                  <div className="text-base font-bold text-purple-300 mt-1 font-mono">{fnoResults.inferenceFps} <span className="text-xs text-slate-400">FPS</span></div>
                  <span className="text-[10px] text-slate-500">Residuo L2: {fnoResults.spectralResidualL2}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: HOMS AUTO-OXIDACION */}
          {activeTab === 'homs' && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-emerald-300">Auto-Oxidación de Monoterpenos & Partículas Ultrafinas (PM0.1)</h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-900/60 text-emerald-200 border border-emerald-700">ACP / Science 2025</span>
                  </div>
                  <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                    Formación de Moléculas Altamente Oxigenadas (HOMs) y aerosoles orgánicos extremadamente no volátiles (ELVOC) por desplazamiento intramolecular de hidrógeno (H-shift) que inducen nucleación espontánea de partículas PM0.1 en la brisa de los Montes de Málaga.
                  </p>
                </div>
                {onFlyToLocation && (
                  <ScientificTooltip position="left" width="w-[280px]" content="Centrar la cámara en la masa forestal de los Montes de Málaga para analizar la biosíntesis de monoterpenos y auto-oxidación de HOMs.">
                    <button
                      onClick={() => onFlyToLocation(36.7550, -4.4100, 14, 0)}
                      className="flex items-center space-x-1 px-2 py-1 bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-200 border border-emerald-600/40 rounded text-[11px] transition-colors shrink-0 ml-3 cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>Montes de Málaga</span>
                    </button>
                  </ScientificTooltip>
                )}
              </div>

              {/* Parametric Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">α-Pineno / Terpenos (ppb):</label>
                  <input
                    type="number"
                    value={alphaPinenePpb}
                    onChange={(e) => setAlphaPinenePpb(Number(e.target.value))}
                    min={0.1}
                    max={8.0}
                    step={0.1}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Radiación Solar G (W/m²):</label>
                  <input
                    type="number"
                    value={sunlightWm2}
                    onChange={(e) => setSunlightWm2(Number(e.target.value))}
                    min={50}
                    max={1100}
                    step={25}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Régimen de Oxidación Detectado:</label>
                  <div className="px-2 py-1 bg-slate-950 border border-emerald-600/40 rounded text-emerald-300 font-mono text-[11px]">
                    {homsResults.oxidationRegime}
                  </div>
                </div>
              </div>

              {/* Output Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Producción HOMs</span>
                  <div className="text-base font-bold text-emerald-300 mt-1 font-mono">{homsResults.homsProductionRateMolecCm3S} <span className="text-[10px] text-slate-400">molec/cm³·s</span></div>
                  <span className="text-[10px] text-slate-500">Tasa de branching</span>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Concentración ELVOC</span>
                  <div className="text-base font-bold text-teal-300 mt-1 font-mono">{homsResults.elvocConcentrationUgm3} <span className="text-xs text-slate-400">µg/m³</span></div>
                  <span className="text-[10px] text-slate-500">Fracción no volátil</span>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Tasa Nucleación J1</span>
                  <div className="text-base font-bold text-amber-300 mt-1 font-mono">{homsResults.nucleationRateJ1Cm3S} <span className="text-[10px] text-slate-400">cm⁻³·s⁻¹</span></div>
                  <span className="text-[10px] text-slate-500">Partículas nuevas</span>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Ultrafinas PM0.1</span>
                  <div className="text-base font-bold text-cyan-300 mt-1 font-mono">{homsResults.pm01UltrafineUgm3} <span className="text-xs text-slate-400">µg/m³</span></div>
                  <span className="text-[10px] text-slate-500">Masa alveolar</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: FOTOLISIS ESPECTRAL */}
          {activeTab === 'spectralJ' && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-amber-300">Atenuación Radiativa Espectral & Fotólisis J_NO2(θz, τ_aer, SVF, Albedo)</h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-900/60 text-amber-200 border border-amber-700">JQSRT / ACP 2025</span>
                  </div>
                  <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                    Cálculo de transferencia radiativa espectral en la banda UV-A (290–420 nm) acoplado al ángulo cenital solar astronómico, morfología de cañón urbano y al espesor óptico de calima sahariana.
                  </p>
                </div>
                {onFlyToLocation && (
                  <ScientificTooltip position="left" width="w-[280px]" content="Centrar en el Puerto de Málaga para evaluar el flujo actínico solar UV-A, albedo marino y fotólisis J_NO2 bajo calima sahariana.">
                    <button
                      onClick={() => onFlyToLocation(36.7145, -4.4170, 16, 180)}
                      className="flex items-center space-x-1 px-2 py-1 bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 border border-amber-600/40 rounded text-[11px] transition-colors shrink-0 ml-3 cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>Puerto de Málaga</span>
                    </button>
                  </ScientificTooltip>
                )}
              </div>

              {/* Parametric Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Ángulo Cenital Solar θz (°):</label>
                  <input
                    type="number"
                    value={solarZenithDeg}
                    onChange={(e) => setSolarZenithDeg(Number(e.target.value))}
                    min={0}
                    max={85}
                    step={1}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Espesor Óptico Calima τ_550:</label>
                  <input
                    type="number"
                    value={aod550Calima}
                    onChange={(e) => setAod550Calima(Number(e.target.value))}
                    min={0.05}
                    max={1.5}
                    step={0.05}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Albedo Superficie Urbana α:</label>
                  <input
                    type="number"
                    value={albedoUrban}
                    onChange={(e) => setAlbedoUrban(Number(e.target.value))}
                    min={0.08}
                    max={0.40}
                    step={0.02}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Outputs Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Tasa Fotólisis J_NO2</span>
                  <div className="text-base font-bold text-amber-300 mt-1 font-mono">{spectralResults.jNo2RateS1} <span className="text-xs text-slate-400">s⁻¹</span></div>
                  <span className="text-[10px] text-slate-500">Vida media: {spectralResults.photolysisLifetimeSec} s</span>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Flujo Actínico UV-A</span>
                  <div className="text-base font-bold text-yellow-300 mt-1 font-mono">{spectralResults.uvAEffectiveFluxWm2} <span className="text-xs text-slate-400">W/m²</span></div>
                  <span className="text-[10px] text-slate-500">Transmitancia: {spectralResults.transmittanceFactorPct}%</span>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Flujo UV-B Efectivo</span>
                  <div className="text-base font-bold text-orange-300 mt-1 font-mono">{spectralResults.uvBEffectiveFluxWm2} <span className="text-xs text-slate-400">W/m²</span></div>
                  <span className="text-[10px] text-slate-500">Atenuado por O3</span>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Atenuación por Calima</span>
                  <div className="text-base font-bold text-rose-300 mt-1 font-mono">{spectralResults.calimaSaharianaAttenuationPct}%</div>
                  <span className="text-[10px] text-slate-500">Descuento Sahariano</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: POTENCIAL OXIDATIVO */}
          {activeTab === 'opDtt' && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-rose-300">Potencial Oxidativo del Particulado (OP_DTT / OP_AA - Estrés Celular)</h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-900/60 text-rose-200 border border-rose-700">EHP / ES&T 2025</span>
                  </div>
                  <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                    Evaluación toxicológica del particulado en la ZBE basada en la actividad redox del Cobre (Cu) y Hierro (Fe) por desgaste de pastillas de freno en intersecciones.
                  </p>
                </div>
                {onFlyToLocation && (
                  <ScientificTooltip position="left" width="w-[280px]" content="Centrar en la Alameda Principal para inspeccionar el potencial oxidativo celular derivado del desgaste de frenos (Cu) y escape vehicular (Fe).">
                    <button
                      onClick={() => onFlyToLocation(36.7175, -4.4230, 17, 0)}
                      className="flex items-center space-x-1 px-2 py-1 bg-rose-900/40 hover:bg-rose-800/60 text-rose-200 border border-rose-600/40 rounded text-[11px] transition-colors shrink-0 ml-3 cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-rose-400" />
                      <span>Rotonda Alameda</span>
                    </button>
                  </ScientificTooltip>
                )}
              </div>

              {/* Parametric Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Cobre Frenos Cu (ng/m³):</label>
                  <input
                    type="number"
                    value={brakeCuNgM3}
                    onChange={(e) => setBrakeCuNgM3(Number(e.target.value))}
                    min={5}
                    max={150}
                    step={5}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Hierro Fe (ng/m³):</label>
                  <input
                    type="number"
                    value={exhaustFeNgM3}
                    onChange={(e) => setExhaustFeNgM3(Number(e.target.value))}
                    min={20}
                    max={400}
                    step={10}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Carbono Orgánico OC (µg/m³):</label>
                  <input
                    type="number"
                    value={organicCarbonUgm3}
                    onChange={(e) => setOrganicCarbonUgm3(Number(e.target.value))}
                    min={0.5}
                    max={12}
                    step={0.5}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Distancia a Semáforo (m):</label>
                  <input
                    type="number"
                    value={distIntersectionM}
                    onChange={(e) => setDistIntersectionM(Number(e.target.value))}
                    min={5}
                    max={200}
                    step={5}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Outputs Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Actividad OP_DTT</span>
                  <div className="text-base font-bold text-rose-300 mt-1 font-mono">{opResults.opDttVolumeNormNmolMinM3} <span className="text-[10px] text-slate-400">nmol/min·m³</span></div>
                  <span className="text-[10px] text-slate-500">Volumétrica</span>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Toxicidad Intrínseca</span>
                  <div className="text-base font-bold text-amber-300 mt-1 font-mono">{opResults.opDttMassNormPmolMinUg} <span className="text-[10px] text-slate-400">pmol/min·µg</span></div>
                  <span className="text-[10px] text-slate-500">Por masa de PM2.5</span>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Generación ROS Celular</span>
                  <div className="text-base font-bold text-purple-300 mt-1 font-mono">{opResults.cellularRosRatio}x</div>
                  <span className="text-[10px] text-slate-500">Vs nivel basal</span>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Nivel de Riesgo Redox</span>
                  <div className="text-xs font-bold text-rose-400 mt-1 font-mono">{opResults.cellOxidativeStressRisk}</div>
                  <span className="text-[10px] text-slate-500">{opResults.mainContributorSource}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: ASIMILACION 4D-VAR & DESROZIERS */}
          {activeTab === 'hybrid4dvar' && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-lg flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-purple-300">Asimilación 4D-Var EnKF Híbrida & Diagnóstico de Desroziers</h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-900/60 text-purple-200 border border-purple-700">QJRMS / RSE 2025</span>
                  </div>
                  <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                    Minimización variacional cuatridimensional con matriz de covarianza de error dinámica B_t y diagnóstico de consistencia de Desroziers (E[d_b^o (d_a^o)^T] = R) certificando la calibración óptima de incertidumbre entre estaciones oficiales y Sentinel-5P TROPOMI.
                  </p>
                </div>
                {onFlyToLocation && (
                  <ScientificTooltip position="left" width="w-[280px]" content="Centrar en el dominio metropolitano de Málaga para visualizar la ventana temporal de asimilación híbrida 4D-Var EnKF.">
                    <button
                      onClick={() => onFlyToLocation(36.7196, -4.4200, 15, 0)}
                      className="flex items-center space-x-1 px-2 py-1 bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-600/40 rounded text-[11px] transition-colors shrink-0 ml-3 cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-purple-400" />
                      <span>Dominio Metropolitano</span>
                    </button>
                  </ScientificTooltip>
                )}
              </div>

              {/* Parametric Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Miembros del Ensamble EnKF (N):</label>
                  <ScientificTooltip position="bottom" width="w-[280px]" content="Tamaño del ensamble EnKF (N). Mayor tamaño reduce el error de muestreo en la estimación de la matriz de covarianza de fondo B_t.">
                    <select
                      value={ensembleSizeN}
                      onChange={(e) => setEnsembleSizeN(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono cursor-pointer"
                    >
                      <option value={16}>N = 16 Miembros (Muestreo Rápido)</option>
                      <option value={32}>N = 32 Miembros (Estándar Operacional)</option>
                      <option value={64}>N = 64 Miembros (Alta Fidelidad)</option>
                    </select>
                  </ScientificTooltip>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Columna Troposférica TROPOMI (10¹⁵ molec/cm²):</label>
                  <input
                    type="number"
                    value={tropomiCol}
                    onChange={(e) => setTropomiCol(Number(e.target.value))}
                    min={1.0}
                    max={12.0}
                    step={0.1}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Ventana 4D-Var Temporal (Horas):</label>
                  <ScientificTooltip position="bottom" width="w-[280px]" content="Longitud de la ventana temporal 4D-Var. Permite acoplar la dinámica temporal de las observaciones satelitales TROPOMI y estaciones terrestres.">
                    <select
                      value={assimWindowH}
                      onChange={(e) => setAssimWindowH(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono cursor-pointer"
                    >
                      <option value={3}>Ventana 3 Horas</option>
                      <option value={6}>Ventana 6 Horas (Óptimo)</option>
                      <option value={12}>Ventana 12 Horas</option>
                    </select>
                  </ScientificTooltip>
                </div>
              </div>

              {/* Outputs Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Reducción Coste J</span>
                  <div className="text-base font-bold text-purple-300 mt-1 font-mono">{varResults.costReductionPct}%</div>
                  <span className="text-[10px] text-slate-500">J_opt = {varResults.costFunctionOptimizedJopt}</span>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Grados Libertad (DFS)</span>
                  <div className="text-base font-bold text-cyan-300 mt-1 font-mono">{varResults.degreesOfFreedomForSignalDfs}</div>
                  <span className="text-[10px] text-slate-500">Tr(KH) = {varResults.kalmanGainTraceTrK}</span>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Ajuste Sesgo Satelital</span>
                  <div className="text-base font-bold text-amber-300 mt-1 font-mono">{varResults.tropomiBiasCorrectionPct}%</div>
                  <span className="text-[10px] text-slate-500">TROPOMI Columna</span>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Reducción Incertidumbre</span>
                  <div className="text-base font-bold text-emerald-300 mt-1 font-mono">{varResults.analysisUncertaintyReductionPct}%</div>
                  <span className="text-[10px] text-slate-500">En análisis final</span>
                </div>
              </div>

              {/* Banner Desroziers */}
              <div className="p-3 bg-purple-950/40 border border-purple-700/60 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-slate-200">Diagnóstico de Consistencia Estadística de Desroziers (QJRMS 2005)</span>
                  </div>
                  <span className="bg-emerald-950 border border-emerald-500/60 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono">
                    RATIO DESROZIERS = {varResults.desroziers.desroziersConsistencyRatio} (ÓPTIMO ~1.00)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Error Observacional Estimado σ_o (R):</span>
                    <strong className="text-purple-300 font-mono">{varResults.desroziers.desroziersObsErrorEstimatedR} µg/m³</strong>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Error de Fondo Estimado σ_b (B):</span>
                    <strong className="text-cyan-300 font-mono">{varResults.desroziers.desroziersBgErrorEstimatedB} µg/m³</strong>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Consistencia Chi-Cuadrado χ²/N:</span>
                    <strong className="text-emerald-300 font-mono">{varResults.desroziers.chiSquareNormalized} (Normalizado)</strong>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: INVERSION BAYESIANA DE FLUJOS (FLUX PINPOINTING) */}
          {activeTab === 'bayesianInversion' && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-lg flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-blue-300">Balance de Masa Inverso Bayesiano de Emisiones (Microscale Flux Pinpointing)</h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-900/60 text-blue-200 border border-blue-700">AMT / ACP 2025</span>
                  </div>
                  <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                    Inversión de la ecuación de advección-difusión para inferir la tasa de emisión real Q_NOx en el vial seleccionado ({activeStreetName}) y contrastar con el inventario estático oficial COPERT 5.
                  </p>
                </div>
                {onFlyToLocation && (
                  <ScientificTooltip position="left" width="w-[280px]" content="Centrar en Av. Manuel Agustín Heredia para contrastar la emisión real invertida por Bayes con el inventario estático COPERT 5.">
                    <button
                      onClick={() => onFlyToLocation(36.7160, -4.4260, 17, 90)}
                      className="flex items-center space-x-1 px-2 py-1 bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 border border-blue-600/40 rounded text-[11px] transition-colors shrink-0 ml-3 cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-blue-400" />
                      <span>Av. Manuel Agustín Heredia</span>
                    </button>
                  </ScientificTooltip>
                )}
              </div>

              {/* Parametric Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Aforo Vehicular Horario (veh/h):</label>
                  <input
                    type="number"
                    value={trafficVehHour}
                    onChange={(e) => setTrafficVehHour(Number(e.target.value))}
                    min={100}
                    max={6000}
                    step={50}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Fracción Vehículos Pesados / Diésel (%):</label>
                  <input
                    type="number"
                    value={heavyDutyFractionPct}
                    onChange={(e) => setHeavyDutyFractionPct(Number(e.target.value))}
                    min={1}
                    max={40}
                    step={0.5}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Distancia al Eje de Calzada (m):</label>
                  <input
                    type="number"
                    value={distLaneCenterM}
                    onChange={(e) => setDistLaneCenterM(Number(e.target.value))}
                    min={2}
                    max={30}
                    step={0.5}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Outputs Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Emisión A Priori COPERT 5</span>
                  <div className="text-base font-bold text-slate-300 mt-1 font-mono">{bayesianResults.priorEmissionRateGsM} <span className="text-[10px] text-slate-400">g/s·m</span></div>
                  <span className="text-[10px] text-slate-500">x_a inventario base</span>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Emisión Inversa Estimada</span>
                  <div className="text-base font-bold text-blue-300 mt-1 font-mono">{bayesianResults.posteriorEmissionRateGsM} <span className="text-[10px] text-slate-400">g/s·m</span></div>
                  <span className="text-[10px] text-slate-500">x_hat Bayesiano MAP</span>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Factor Escalado vs COPERT</span>
                  <div className={`text-base font-bold mt-1 font-mono ${bayesianResults.emissionScalingFactor > 1.2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {bayesianResults.emissionScalingFactor}x
                  </div>
                  <span className="text-[10px] text-slate-500">Discrepancia: {bayesianResults.copertDiscrepancyPct > 0 ? `+${bayesianResults.copertDiscrepancyPct}%` : `${bayesianResults.copertDiscrepancyPct}%`}</span>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Información de Shannon</span>
                  <div className="text-base font-bold text-teal-300 mt-1 font-mono">{bayesianResults.informationContentShannonBits} <span className="text-[10px] text-slate-400">bits</span></div>
                  <span className="text-[10px] text-slate-500">DFS Total = {bayesianResults.degreesOfFreedomSignalDFS}</span>
                </div>
              </div>

              {/* Banner Diagnóstico de Anomalías de Emisión */}
              <div className={`p-3 rounded-lg border ${bayesianResults.emissionAnomalyDetected ? 'bg-amber-950/40 border-amber-600/70' : 'bg-blue-950/40 border-blue-700/60'} space-y-2`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-slate-200">Diagnóstico Inverso en {activeStreetName}</span>
                  </div>
                  <span className="bg-slate-900 border border-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono">
                    SENSIBILIDAD JACOBIANA K = {bayesianResults.jacobianSensitivityDCDQ} µg/m³ por g/s·m
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {bayesianResults.anomalyDiagnosis}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] pt-1">
                  <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400">Kernel Tráfico:</span> <strong className="text-blue-300 font-mono">{bayesianResults.averagingKernelDiagonalA.trafficSource}</strong>
                  </div>
                  <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400">Kernel Transporte Fondo:</span> <strong className="text-cyan-300 font-mono">{bayesianResults.averagingKernelDiagonalA.backgroundTransport}</strong>
                  </div>
                  <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400">Reducción Incertidumbre:</span> <strong className="text-emerald-300 font-mono">-{bayesianResults.posteriorUncertaintyReductionPct}%</strong>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </DraggableWindow>
  );
}
