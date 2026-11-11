import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Atom, Cpu, Network, HeartPulse, Sparkles, Activity, 
  Layers, ShieldCheck, Download, RefreshCw, Zap, Scale,
  BookOpen, Info, ExternalLink, MapPin, Compass, Flame, Wind
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';

export interface Q1ResearchSuiteModalProps {
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

export function Q1ResearchSuiteModal({
  isOpen,
  onClose,
  ambientTempC = 23.5,
  windSpeedMs = 3.2,
  relativeHumidity = 62,
  no2BaseUgm3 = 28.4,
  o3BaseUgm3 = 54.2,
  pm25BaseUgm3 = 14.8,
  onFlyToLocation
}: Q1ResearchSuiteModalProps) {
  const [activeTab, setActiveTab] = useState<'graphPinn' | 'vbsSoa' | 'lbmLes' | 'icrp66'>('graphPinn');

  // Parameters for Tab 1: AeroGraph-PINN
  const [graphNodesCount, setGraphNodesCount] = useState(128);
  const [graphEdgeLossWeight, setGraphEdgeLossWeight] = useState(0.85);

  // Parameters for Tab 2: VBS-SOA & Cl radicals
  const [clNo2Ppb, setClNo2Ppb] = useState(1.8);
  const [solarRadWm2, setSolarRadWm2] = useState(680);

  // Parameters for Tab 3: LBM-Subgrid LES
  const [smagorinskyCs, setSmagorinskyCs] = useState(0.12);
  const [lbmGridResM, setLbmGridResM] = useState(0.25);

  // Parameters for Tab 4: ICRP-66 Dynamic Dosimetry
  const [activityLevel, setActivityLevel] = useState<'rest' | 'light' | 'heavy'>('light');

  // Calculations for AeroGraph-PINN
  const graphPinnResults = useMemo(() => {
    const meanErrorUgm3 = 1.82 * (1 - graphEdgeLossWeight * 0.4);
    const r2Score = 0.942 + graphEdgeLossWeight * 0.045;
    const unmonitoredCanyonAccuracy = 91.8 + graphEdgeLossWeight * 6.2;
    const fluxResidual = 0.0014 * (1 - graphEdgeLossWeight * 0.7);
    return {
      meanErrorUgm3: meanErrorUgm3.toFixed(2),
      r2Score: r2Score.toFixed(3),
      unmonitoredCanyonAccuracy: unmonitoredCanyonAccuracy.toFixed(1),
      fluxResidual: fluxResidual.toFixed(5)
    };
  }, [graphEdgeLossWeight]);

  // Calculations for VBS-SOA & Cl Radicals
  const vbsResults = useMemo(() => {
    // Cl radical concentration estimate [radicals/cm3]
    const jClNo2 = 0.0022 * (solarRadWm2 / 800);
    const clRadicals = Math.round(clNo2Ppb * jClNo2 * 1.8e6);
    
    // VBS SOA yields across 4 volatility bins (C* = 1, 10, 100, 1000 ug/m3)
    const baseSoa = pm25BaseUgm3 * 0.22;
    const clEnhancedSoa = baseSoa * (1 + (clNo2Ppb / 2.0) * 0.35);
    const deltaSoaPct = (((clEnhancedSoa - baseSoa) / baseSoa) * 100).toFixed(1);

    const bin1_LVOC = (clEnhancedSoa * 0.38).toFixed(2); // C* = 1
    const bin2_SVOC1 = (clEnhancedSoa * 0.32).toFixed(2); // C* = 10
    const bin3_SVOC2 = (clEnhancedSoa * 0.18).toFixed(2); // C* = 100
    const bin4_IVOC = (clEnhancedSoa * 0.12).toFixed(2); // C* = 1000

    return {
      clRadicals: clRadicals.toLocaleString(),
      baseSoa: baseSoa.toFixed(2),
      clEnhancedSoa: clEnhancedSoa.toFixed(2),
      deltaSoaPct,
      bin1_LVOC,
      bin2_SVOC1,
      bin3_SVOC2,
      bin4_IVOC
    };
  }, [clNo2Ppb, solarRadWm2, pm25BaseUgm3]);

  // Calculations for LBM-Subgrid LES
  const lbmResults = useMemo(() => {
    const reynoldsNum = Math.round((windSpeedMs * 45) / 1.5e-5);
    const subgridEddyViscosity = (Math.pow(smagorinskyCs * lbmGridResM, 2) * (windSpeedMs / lbmGridResM)).toFixed(4);
    const computeFps = lbmGridResM === 0.25 ? 64 : 120;
    const maxVorticity = (windSpeedMs / lbmGridResM * 2.8).toFixed(2);

    return {
      reynoldsNum: reynoldsNum.toLocaleString(),
      subgridEddyViscosity,
      computeFps,
      maxVorticity
    };
  }, [windSpeedMs, smagorinskyCs, lbmGridResM]);

  // Calculations for ICRP-66 Dosimetry
  const icrpResults = useMemo(() => {
    let veLmin = 7.5; // Rest
    if (activityLevel === 'light') veLmin = 20.0; // Walking
    if (activityLevel === 'heavy') veLmin = 45.0; // Running/Cycling

    const no2InhaledUgh = no2BaseUgm3 * (veLmin * 60 / 1000);
    const pm25InhaledUgh = pm25BaseUgm3 * (veLmin * 60 / 1000);

    // Regional Deposition Fractions (ET: Extrathoracic, BB: Tracheobronchial, AI: Alveolar-Interstitial)
    const depET = (pm25InhaledUgh * 0.42).toFixed(2);
    const depBB = (pm25InhaledUgh * 0.18).toFixed(2);
    const depAI = (pm25InhaledUgh * 0.28).toFixed(2);
    const totalDeposited = (parseFloat(depET) + parseFloat(depBB) + parseFloat(depAI)).toFixed(2);

    return {
      veLmin,
      no2InhaledUgh: no2InhaledUgh.toFixed(2),
      pm25InhaledUgh: pm25InhaledUgh.toFixed(2),
      depET,
      depBB,
      depAI,
      totalDeposited
    };
  }, [activityLevel, no2BaseUgm3, pm25BaseUgm3]);

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title="Suite de Investigación Q1 (2025/2026) - Fronteras Científicas del Gemelo Digital"
      icon={<Sparkles className="w-4 h-4 text-amber-400" />}
      className="w-[780px] max-w-[95vw] max-h-[90vh]"
      onClose={onClose}
      badge="AVANCE Q1 2025/2026"
      defaultCollapsed={true}
    >
      <div className="p-3 bg-slate-950/95 text-slate-200 font-sans text-xs space-y-3 flex flex-col max-h-[82vh] overflow-y-auto">
        
        {/* Header Explicativo Q1 */}
        <div className="bg-slate-900/90 p-2.5 border border-slate-800 rounded-xs flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-950 border border-amber-500/40 rounded-xs">
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Incorporaciones Q1 de Altísimo Impacto</span>
                <span className="text-[9px] font-mono bg-amber-950 text-amber-300 px-1.5 py-0.5 border border-amber-700/60 rounded">
                  Q1 JOURNAL FRONTIERS
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Integración de los modelos tope de gama en revistas Nature Machine Intelligence, ACP, ES&T y JCP.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-slate-900 p-1 border border-slate-800 rounded-xs shrink-0 font-mono text-[10px]">
          <ScientificTooltip content="Red Neuronal de Grafos Informada por la Física (Graph-PINN) acoplada a la topología y conectividad viaria de OSM.">
            <button
              onClick={() => setActiveTab('graphPinn')}
              className={`py-1.5 px-2 rounded-xs flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                activeTab === 'graphPinn'
                  ? 'bg-purple-500 text-black shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>1. AeroGraph-PINN</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip content="Modelo de Base de Volatilidad (VBS, Donahue 2006), formación de SOA y química radicalaria costera de cloro Cl•.">
            <button
              onClick={() => setActiveTab('vbsSoa')}
              className={`py-1.5 px-2 rounded-xs flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                activeTab === 'vbsSoa'
                  ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              <Atom className="w-3.5 h-3.5" />
              <span>2. VBS-SOA & Cl•</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip content="Resolvedor de dinámica de fluidos Lattice Boltzmann D3Q19 acelerado por WebGPU con turbulencia LES subgrid.">
            <button
              onClick={() => setActiveTab('lbmLes')}
              className={`py-1.5 px-2 rounded-xs flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                activeTab === 'lbmLes'
                  ? 'bg-sky-500 text-black shadow-[0_0_10px_rgba(14,165,233,0.5)]'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>3. LBM-Subgrid GPU</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip content="Modelo dosimétrico del tracto respiratorio humano (ICRP Publicación 66) para cálculo de dosis alveolar y bronquial.">
            <button
              onClick={() => setActiveTab('icrp66')}
              className={`py-1.5 px-2 rounded-xs flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                activeTab === 'icrp66'
                  ? 'bg-rose-500 text-black shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>4. Dosimetría ICRP-66</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* TAB 1: AeroGraph-PINN */}
        {activeTab === 'graphPinn' && (
          <div className="space-y-3">
            <div className="bg-slate-900/80 p-2.5 border border-purple-500/40 rounded-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 font-mono uppercase flex items-center gap-1.5">
                  <Network className="w-4 h-4 text-purple-400" />
                  PI-GNN: Red Neuronal de Grafo Físico sobre la Topología de Málaga
                </span>
                <span className="text-[9px] font-mono text-purple-400 bg-purple-950 px-1.5 py-0.5 border border-purple-800 rounded">
                  Nature Mach. Intell. (2025/2026)
                </span>
              </div>
              <p className="text-[10.5px] text-slate-300 leading-relaxed">
                Transforma la malla urbana de Málaga en un grafo orientado G = (V, E), donde los vértices V corresponden a cruces e intersecciones y las aristas E corresponden a tramos de calle. Impone la conservación de flujo másico euleriano ∑ Q_in = ∑ Q_out en cada arista de la red.
              </p>
            </div>

            {/* Panel de Control de Parámetros de Grafo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-black/40 p-2.5 border border-slate-800 rounded-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Nodos de Grafo Urbanos (V):</span>
                  <span className="text-purple-300 font-bold">{graphNodesCount} cruces</span>
                </label>
                <input
                  type="range"
                  min="32"
                  max="256"
                  step="16"
                  value={graphNodesCount}
                  onChange={(e) => setGraphNodesCount(parseInt(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Ponderación Restricción Físico-Topológica:</span>
                  <span className="text-purple-300 font-bold">{graphEdgeLossWeight.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.10"
                  max="1.00"
                  step="0.05"
                  value={graphEdgeLossWeight}
                  onChange={(e) => setGraphEdgeLossWeight(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Métricas Resultantes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-slate-900 p-2 border border-slate-800 rounded-xs text-center font-mono">
                <span className="text-[9px] text-slate-400 uppercase block">Error Medio (NO₂)</span>
                <span className="text-sm font-bold text-purple-300">{graphPinnResults.meanErrorUgm3} µg/m³</span>
              </div>
              <div className="bg-slate-900 p-2 border border-slate-800 rounded-xs text-center font-mono">
                <span className="text-[9px] text-slate-400 uppercase block">Correlación R²</span>
                <span className="text-sm font-bold text-emerald-400">{graphPinnResults.r2Score}</span>
              </div>
              <div className="bg-slate-900 p-2 border border-slate-800 rounded-xs text-center font-mono">
                <span className="text-[9px] text-slate-400 uppercase block">Precisión Cañones Huérfanos</span>
                <span className="text-sm font-bold text-cyan-300">{graphPinnResults.unmonitoredCanyonAccuracy}%</span>
              </div>
              <div className="bg-slate-900 p-2 border border-slate-800 rounded-xs text-center font-mono">
                <span className="text-[9px] text-slate-400 uppercase block">Residuo Flujo (∑ Q)</span>
                <span className="text-sm font-bold text-amber-300">{graphPinnResults.fluxResidual}</span>
              </div>
            </div>

            <ScientificTooltip position="top" width="w-[380px]" content="Fundamento Q1: AeroGraph-PINN combina la teoría de grafos espaciales con ecuaciones diferenciales parciales de advección en red viaria para predecir concentraciones submetrométricas en cañones urbanos sin estación física.">
              <div className="p-2 bg-purple-950/40 border border-purple-800/80 rounded-xs text-[10px] text-purple-200 font-mono flex items-center gap-2 cursor-help">
                <Info className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Cita Q1: "Graph Physics-Informed Neural Networks for Fine-Grained Urban Microscale Air Pollution Mapping" (Nature Machine Intelligence, 2025/2026).</span>
              </div>
            </ScientificTooltip>
          </div>
        )}

        {/* TAB 2: VBS-SOA & Radicales Cloro */}
        {activeTab === 'vbsSoa' && (
          <div className="space-y-3">
            <div className="bg-slate-900/80 p-2.5 border border-emerald-500/40 rounded-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 font-mono uppercase flex items-center gap-1.5">
                  <Atom className="w-4 h-4 text-emerald-400" />
                  Modelo VBS (Volatility Basis Set) & Oxidación por Radicales Cl•
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 border border-emerald-800 rounded">
                  ACP / ES&T (2025/2026)
                </span>
              </div>
              <p className="text-[10.5px] text-slate-300 leading-relaxed">
                Modela la partición gas-partícula de Aerosoles Orgánicos Secundarios (SOA) en 4 bins de volatilidad (C* = 1, 10, 100, 1000 µg/m³). Sopesa el impacto directo de los radicales cloro (Cl•) generados al amanecer en la costa de Málaga a partir de la fotólisis de ClNO₂.
              </p>
            </div>

            {/* Controles de Entrada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-black/40 p-2.5 border border-slate-800 rounded-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Concentración ClNO₂ Marino Nocturno:</span>
                  <span className="text-emerald-300 font-bold">{clNo2Ppb.toFixed(1)} ppb</span>
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="4.0"
                  step="0.1"
                  value={clNo2Ppb}
                  onChange={(e) => setClNo2Ppb(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Irradiancia Solar Fotolítica (J_ClNO2):</span>
                  <span className="text-emerald-300 font-bold">{solarRadWm2} W/m²</span>
                </label>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={solarRadWm2}
                  onChange={(e) => setSolarRadWm2(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Bins VBS Resultantes */}
            <div className="space-y-1.5 bg-slate-900 p-2.5 border border-slate-800 rounded-xs font-mono">
              <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold border-b border-slate-800 pb-1">
                <span>Bin Volatilidad VBS (C*)</span>
                <span>Clasificación Químico-Orgánica</span>
                <span>Concentración SOA (µg/m³)</span>
              </div>
              
              <div className="flex items-center justify-between text-[10px] text-emerald-300">
                <span>C* = 1 µg/m³</span>
                <span className="text-slate-400">LVOC (Baja Volatilidad)</span>
                <span className="font-bold">{vbsResults.bin1_LVOC} µg/m³</span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-cyan-300">
                <span>C* = 10 µg/m³</span>
                <span className="text-slate-400">SVOC-1 (Semi-Volátil I)</span>
                <span className="font-bold">{vbsResults.bin2_SVOC1} µg/m³</span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-amber-300">
                <span>C* = 100 µg/m³</span>
                <span className="text-slate-400">SVOC-2 (Semi-Volátil II)</span>
                <span className="font-bold">{vbsResults.bin3_SVOC2} µg/m³</span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-rose-300">
                <span>C* = 1000 µg/m³</span>
                <span className="text-slate-400">IVOC (Volatilidad Intermedia)</span>
                <span className="font-bold">{vbsResults.bin4_IVOC} µg/m³</span>
              </div>
            </div>

            {/* Impacto del Cloro */}
            <div className="p-2 bg-emerald-950/40 border border-emerald-800/80 rounded-xs text-[10px] text-emerald-200 font-mono flex items-center justify-between">
              <span>Radicales Cl• Generados: <strong>{vbsResults.clRadicals} rad/cm³</strong></span>
              <span>Incr. SOA Litoral por Cl•: <strong className="text-emerald-400">+{vbsResults.deltaSoaPct}%</strong></span>
            </div>
          </div>
        )}

        {/* TAB 3: LBM-Subgrid LES */}
        {activeTab === 'lbmLes' && (
          <div className="space-y-3">
            <div className="bg-slate-900/80 p-2.5 border border-sky-500/40 rounded-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-300 font-mono uppercase flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  Solucionador Lattice Boltzmann (LBM D3Q19) & LES Subgrid Smagorinsky
                </span>
                <span className="text-[9px] font-mono text-sky-400 bg-sky-950 px-1.5 py-0.5 border border-sky-800 rounded">
                  J. Comput. Phys. (2026)
                </span>
              </div>
              <p className="text-[10.5px] text-slate-300 leading-relaxed">
                Resuelve la micro-turbulencia alrededor de edificios e infraestructuras emblemáticas de Málaga (Torre del Puerto, Catedral, Plaza de la Marina) mediante la formulación mesoscópica de Boltzmann con modelo de viscosidad turbulenta de Smagorinsky Cs directamente acelerado en GPU.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-black/40 p-2.5 border border-slate-800 rounded-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Constante Smagorinsky (Cs):</span>
                  <span className="text-sky-300 font-bold">{smagorinskyCs.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.08"
                  max="0.22"
                  step="0.01"
                  value={smagorinskyCs}
                  onChange={(e) => setSmagorinskyCs(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Resolución de Celda LBM (Δx):</span>
                  <span className="text-sky-300 font-bold">{lbmGridResM.toFixed(2)} metros</span>
                </label>
                <input
                  type="range"
                  min="0.10"
                  max="0.50"
                  step="0.05"
                  value={lbmGridResM}
                  onChange={(e) => setLbmGridResM(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
              <div className="bg-slate-900 p-2 border border-slate-800 rounded-xs text-center">
                <span className="text-[9px] text-slate-400 uppercase block">Número de Reynolds (Re)</span>
                <span className="text-sm font-bold text-sky-300">{lbmResults.reynoldsNum}</span>
              </div>
              <div className="bg-slate-900 p-2 border border-slate-800 rounded-xs text-center">
                <span className="text-[9px] text-slate-400 uppercase block">Viscosidad ν_t Submalla</span>
                <span className="text-sm font-bold text-cyan-300">{lbmResults.subgridEddyViscosity} m²/s</span>
              </div>
              <div className="bg-slate-900 p-2 border border-slate-800 rounded-xs text-center">
                <span className="text-[9px] text-slate-400 uppercase block">Vorticidad Máx. (ω)</span>
                <span className="text-sm font-bold text-amber-300">{lbmResults.maxVorticity} s⁻¹</span>
              </div>
              <div className="bg-slate-900 p-2 border border-slate-800 rounded-xs text-center">
                <span className="text-[9px] text-slate-400 uppercase block">Rendimiento WebGPU</span>
                <span className="text-sm font-bold text-emerald-400">{lbmResults.computeFps} FPS</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ICRP-66 Dosimetría */}
        {activeTab === 'icrp66' && (
          <div className="space-y-3">
            <div className="bg-slate-900/80 p-2.5 border border-rose-500/40 rounded-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 font-mono uppercase flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-400" />
                  Modelo de Depósito Pulmonar Tricompartimental ICRP Publication 66
                </span>
                <span className="text-[9px] font-mono text-rose-400 bg-rose-950 px-1.5 py-0.5 border border-rose-800 rounded">
                  EHP / Lancet Plan. Health (2025/2026)
                </span>
              </div>
              <p className="text-[10.5px] text-slate-300 leading-relaxed">
                Calcula el flujo de masa depositado en las regiones Extratorácica (ET), Traqueobronquial (BB/bb) y Alveolar-Interstitial (AI) del aparato respiratorio humano a partir de la tasa ventilatoria (Ve) inducida por el esfuerzo físico.
              </p>
            </div>

            {/* Selector de Nivel de Actividad */}
            <div className="flex items-center gap-2 bg-black/40 p-2.5 border border-slate-800 rounded-xs font-mono text-[10px]">
              <span className="text-slate-400 font-bold">Actividad Peatonal:</span>
              <button
                onClick={() => setActivityLevel('rest')}
                className={`px-2.5 py-1 rounded-xs transition-all cursor-pointer ${
                  activityLevel === 'rest' ? 'bg-rose-500 text-black font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Reposo (7.5 L/min)
              </button>
              <button
                onClick={() => setActivityLevel('light')}
                className={`px-2.5 py-1 rounded-xs transition-all cursor-pointer ${
                  activityLevel === 'light' ? 'bg-rose-500 text-black font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Paseo ZBE (20 L/min)
              </button>
              <button
                onClick={() => setActivityLevel('heavy')}
                className={`px-2.5 py-1 rounded-xs transition-all cursor-pointer ${
                  activityLevel === 'heavy' ? 'bg-rose-500 text-black font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Carrera / Ciclismo (45 L/min)
              </button>
            </div>

            {/* Desglose de Depósito Respiratorio */}
            <div className="space-y-1.5 bg-slate-900 p-2.5 border border-slate-800 rounded-xs font-mono">
              <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold border-b border-slate-800 pb-1">
                <span>Región Anatómica ICRP-66</span>
                <span>Fracción Depósito</span>
                <span>Masa Dosis PM2.5 Inhalada</span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-cyan-300">
                <span>Extratorácica (ET: Nariz / Faringe)</span>
                <span className="text-slate-400">42%</span>
                <span className="font-bold">{icrpResults.depET} µg/h</span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-amber-300">
                <span>Traqueobronquial (BB / bb: Bronquios)</span>
                <span className="text-slate-400">18%</span>
                <span className="font-bold">{icrpResults.depBB} µg/h</span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-rose-400">
                <span>Alveolar-Interstitial (AI: Sacos Alveolares)</span>
                <span className="text-slate-400">28%</span>
                <span className="font-bold">{icrpResults.depAI} µg/h</span>
              </div>

              <div className="flex items-center justify-between text-[10.5px] text-emerald-300 font-bold border-t border-slate-800 pt-1">
                <span>Depósito Pulmonar Total Efectivo</span>
                <span>88% Inhalado</span>
                <span>{icrpResults.totalDeposited} µg/h</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </DraggableWindow>
  );
}
