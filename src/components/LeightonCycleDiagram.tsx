import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Sun, Wind, Zap, AlertTriangle, CheckCircle2, RefreshCw, Flame, ArrowRight, ShieldCheck, Activity, Compass, Download, Layers, Play, Cpu, Database, FileText } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend } from 'recharts';
import { ScientificTooltip } from './ScientificTooltip';
import { generateDiurnalPhotolysisProfileForMalaga, calculateSolarZenithAndPhotolysis } from '../lib/physics';
import { downloadVectorSvg } from '../lib/vectorExporter';
import { solvePhotochemicalODE, exportOdeCsv, exportOdeLatex, ODESolverResult } from '../lib/odeSolver';
import { useComlinkStiffODESolver } from '../lib/comlinkPhotochemicalDispatcher';

export interface LeightonData {
  no2_ppb: number;
  no_ppb: number;
  o3_ppb: number;
  j_no2: number; // s-1
  k3: number; // ppb-1 s-1 or min-1
  ratio_leighton: number;
  voc_ppb: number;
  voc_nox_ratio: number;
  regimen_ozono: string;
  isCortocircuito: boolean;
  rate_photolysis: number; // tasa R1 (ppb/min)
  rate_o3_formation: number; // tasa R2 (ppb/min)
  rate_titration: number; // tasa R3 (ppb/min)
  rate_ro2_shunt: number; // tasa R4 bypass (ppb/min)
  aod: number;
  damkohlerNumber: number;
  lat: number;
  lon: number;
  zona_malaga: string;
}

interface LeightonDiagramProps {
  data: LeightonData;
  onClose?: () => void;
  isExpanded?: boolean;
}

export const LeightonCycleDiagram: React.FC<LeightonDiagramProps> = ({
  data,
  onClose
}) => {
  const [hoveredFlux, setHoveredFlux] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'vector' | 'diurnal_curve' | 'ekma' | 'ode_trajectory'>('vector');

  // ODE Solver Parameter States
  const [odeDurationSec, setOdeDurationSec] = useState<number>(1800);
  const [odeDtSec, setOdeDtSec] = useState<number>(2.0);
  const [trafficRatePpbS, setTrafficRatePpbS] = useState<number>(0.02);
  const [mixingHeightM, setMixingHeightM] = useState<number>(800);
  const [odeSubView, setOdeSubView] = useState<'concentrations' | 'rates' | 'phase_portrait'>('concentrations');

  const diurnalPoints = useMemo(() => {
    return generateDiurnalPhotolysisProfileForMalaga(data.lat || 36.7196, data.lon || -4.4200);
  }, [data.lat, data.lon]);

  const currentSolarData = useMemo(() => {
    return calculateSolarZenithAndPhotolysis(data.lat || 36.7196, data.lon || -4.4200);
  }, [data.lat, data.lon]);

  // Parameters for Real-Time ODE Integration Call
  const odeParams = useMemo(() => ({
    j_no2: data.j_no2 || 0.006,
    k3: (data.k3 || 0.44) / 60.0,
    temp_kelvin: 298.15,
    pressure_hpa: 1013.25,
    vd_no2: 0.001,
    vd_o3: 0.003,
    mixing_height_m: mixingHeightM,
    initial_no2_ppb: data.no2_ppb,
    initial_no_ppb: data.no_ppb,
    initial_o3_ppb: data.o3_ppb,
    initial_voc_ppb: data.voc_ppb || 25,
    traffic_emission_rate_ppb_s: trafficRatePpbS
  }), [data.j_no2, data.k3, data.no2_ppb, data.no_ppb, data.o3_ppb, data.voc_ppb, mixingHeightM, trafficRatePpbS]);

  const { result: workerOdeResult, isComputing: isOdeComputing, metrics: odeMetrics } = useComlinkStiffODESolver(
    odeParams,
    odeDurationSec,
    odeDtSec,
    true
  );

  const fallbackOdeResult = useMemo(() => {
    return solvePhotochemicalODE(
      odeParams,
      odeDurationSec,
      odeDtSec
    );
  }, [odeParams, odeDurationSec, odeDtSec]);

  const odeResult = workerOdeResult || fallbackOdeResult;

  const {
    no2_ppb,
    no_ppb,
    o3_ppb,
    j_no2,
    ratio_leighton,
    voc_ppb,
    voc_nox_ratio,
    regimen_ozono,
    isCortocircuito,
    rate_photolysis,
    rate_titration,
    rate_ro2_shunt,
    aod,
    damkohlerNumber,
    zona_malaga
  } = data;

  // 1. CÁLCULO ANALÍTICO DE TASAS NETAS DIFERENCIALES d[C]/dt (ppb/min) - CERO SIMULACIÓN
  const r1_photolysis_ppb_min = rate_photolysis;
  const r3_titration_ppb_min = rate_titration;
  const r4_shunt_ppb_min = rate_ro2_shunt;

  const dO3_dt = parseFloat((r1_photolysis_ppb_min - r3_titration_ppb_min).toFixed(3));
  const dNO_dt = parseFloat((r1_photolysis_ppb_min - r3_titration_ppb_min - r4_shunt_ppb_min).toFixed(3));
  const dNO2_dt = parseFloat((-r1_photolysis_ppb_min + r3_titration_ppb_min + r4_shunt_ppb_min).toFixed(3));

  // 2. Malla Analítica Isopletas EKMA (Empírica Seinfeld & Pandis / Gery PSS)
  const ekmaCurveData = useMemo(() => {
    const points = [];
    const nox_current = no_ppb + no2_ppb;
    
    // Varía NOx desde 10 ppb hasta 120 ppb a concentración fija de VOCs
    for (let nox = 10; nox <= 120; nox += 5) {
      const voc = voc_ppb || 30;
      const vocNoxRatio = nox > 0 ? voc / nox : 0;
      // Formulación analítica empírica EKMA PSS (Seinfeld & Pandis Cap. 6)
      const o3_peak = Math.max(5, (18 * Math.pow(voc, 0.55) * Math.pow(nox, 0.35)) / (1 + 0.05 * nox));
      
      points.push({
        nox_ppb: nox,
        o3_peak_ppb: parseFloat(o3_peak.toFixed(1)),
        ridge_line_o3: parseFloat(((nox * 8 * 0.4) / (1 + 0.03 * nox)).toFixed(1)),
        isCurrentNox: Math.abs(nox - nox_current) < 3,
        vocNoxRatio: parseFloat(vocNoxRatio.toFixed(1)),
      });
    }
    return points;
  }, [no_ppb, no2_ppb, voc_ppb]);

  // Phase Space Trajectory data: [O3] vs [NOx]
  const phaseSpaceData = useMemo(() => {
    return odeResult.timeline.map((item) => ({
      nox_ppb: parseFloat((item.no_ppb + item.no2_ppb).toFixed(2)),
      o3_ppb: item.o3_ppb,
      t_min: parseFloat((item.t_sec / 60).toFixed(1)),
      no2_no_ratio: item.no_ppb > 0 ? parseFloat((item.no2_ppb / item.no_ppb).toFixed(2)) : 0
    }));
  }, [odeResult]);

  // Export handlers
  const handleDownloadOdeCsv = () => {
    const csvContent = exportOdeCsv(odeResult);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ODE_Leighton_Trajectory_Malaga_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadOdeLatex = () => {
    const latexContent = exportOdeLatex(odeResult);
    const blob = new Blob([latexContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ODE_Leighton_Formulation_Tesis_${new Date().toISOString().slice(0, 10)}.tex`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // 4. Exportación Vectorial SVG del Diagrama
  const handleExportDiagramSvg = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" width="600" height="350" font-family="'Times New Roman', serif">
      <rect width="100%" height="100%" fill="#ffffff" />
      <text x="300" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#111827">Ciclo Fotoquímico Nulo de Leighton &amp; Cortocircuito Radicalario RO2</text>
      <text x="300" y="48" text-anchor="middle" font-size="11" font-style="italic" fill="#4b5563">Gemelo Digital de Málaga · Diagrama Citable JCR / ISO 31-11</text>
      
      <!-- Nodos Moleculares -->
      <g transform="translate(120, 150)">
        <circle r="40" fill="#e0e7ff" stroke="#3730a3" stroke-width="2" />
        <text x="0" y="-5" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e1b4b">NO₂</text>
        <text x="0" y="12" text-anchor="middle" font-size="11" fill="#312e81">${no2_ppb.toFixed(1)} ppb</text>
      </g>
      
      <g transform="translate(480, 100)">
        <circle r="36" fill="#e0f2fe" stroke="#075985" stroke-width="2" />
        <text x="0" y="-5" text-anchor="middle" font-size="14" font-weight="bold" fill="#0c4a6e">NO</text>
        <text x="0" y="12" text-anchor="middle" font-size="11" fill="#0369a1">${no_ppb.toFixed(1)} ppb</text>
      </g>

      <g transform="translate(480, 220)">
        <circle r="36" fill="#d1fae5" stroke="#065f46" stroke-width="2" />
        <text x="0" y="-5" text-anchor="middle" font-size="14" font-weight="bold" fill="#064e3b">O₃</text>
        <text x="0" y="12" text-anchor="middle" font-size="11" fill="#047857">${o3_ppb.toFixed(1)} ppb</text>
      </g>

      <!-- Reacciones R1, R2, R3, R4 -->
      <!-- R1: Fotólisis -->
      <path d="M 160 120 Q 300 60 440 100" fill="none" stroke="#d97706" stroke-width="2.5" stroke-dasharray="none" />
      <polygon points="440 100, 430 95, 432 105" fill="#d97706" />
      <text x="300" y="70" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">(R1) NO₂ + hν ➔ NO + O(³P) [J = ${j_no2.toFixed(4)} s⁻¹]</text>

      <!-- R3: Titulación -->
      <path d="M 440 220 Q 300 260 160 170" fill="none" stroke="#2563eb" stroke-width="2.5" />
      <polygon points="160 170, 172 168, 170 178" fill="#2563eb" />
      <text x="300" y="255" text-anchor="middle" font-size="11" font-weight="bold" fill="#1d4ed8">(R3) NO + O₃ ➔ NO₂ + O₂ [k₃ = 0.44 ppb⁻¹m⁻¹]</text>

      <!-- R4: Bypass RO2 -->
      <path d="M 440 110 C 360 160 240 160 160 140" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="4 4" />
      <polygon points="160 140, 170 135, 170 145" fill="#dc2626" />
      <text x="300" y="150" text-anchor="middle" font-size="10" font-weight="bold" fill="#991b1b">(R4) Cortocircuito RO₂• / HO₂• [f_shunt = ${((r4_shunt_ppb_min / (r3_titration_ppb_min + 0.001)) * 100).toFixed(1)}%]</text>

      <!-- Ratio Leighton -->
      <rect x="250" y="10" width="100" height="30" rx="4" fill="#f3f4f6" stroke="#9ca3af" />
      <text x="300" y="30" text-anchor="middle" font-size="12" font-weight="bold" fill="#111827">Φ = ${ratio_leighton.toFixed(2)}</text>
    </svg>`;

    downloadVectorSvg('Leighton_Cycle_Diagram_Malaga_JCR', svgContent);
  };

  const getTooltipContent = () => {
    switch (hoveredFlux) {
      case 'R1': return { title: 'R1: Fotólisis de NO₂', desc: 'La radiación UV rompe el Dióxido de Nitrógeno (NO₂) en Monóxido de Nitrógeno (NO) y un átomo de oxígeno radical O(³P). Tasa dependiente de irradiación SW, cobertura nubosa y atenuación óptica de aerosoles (AOD) según Ley de Beer-Lambert.' };
      case 'R2': return { title: 'R2: Generación de Ozono', desc: 'El radical O(³P) se combina casi instantáneamente con el oxígeno molecular (O₂) del aire para formar Ozono Troposférico (O₃).' };
      case 'R3': return { title: 'R3: Titulación (Sumidero)', desc: 'El NO primario reacciona rápidamente con el O₃ ambiental para regenerar NO₂, consumiendo el ozono en el proceso. Es el sumidero natural nocturno.' };
      case 'R4': return { title: 'R4: Cortocircuito RO₂/HO₂', desc: 'Radicales libres de COVs oxidan el NO a NO₂ sin consumir Ozono. Esto rompe el equilibrio de Leighton (Φ > 1) y dispara el smog fotoquímico.' };
      default: return null;
    }
  };
  const tooltip = getTooltipContent();

  const isEquilibrium = ratio_leighton >= 0.85 && ratio_leighton <= 1.15;
  const isNight = j_no2 < 0.0005;

  return (
    <div className="flex flex-col gap-3 text-slate-200">
      {/* Sub-header Navigation Tabs */}
      <div className="flex items-center justify-between bg-black/50 p-1 border border-slate-800 font-mono text-[9px]">
        <div className="flex items-center gap-1">
          <ScientificTooltip topic="leighton_photostationary" position="bottom" width="w-[280px]" content="Representación vectorial interactiva del ciclo nulo fotoquímico de Leighton y los flujos R1-R4 entre NO, NO2 y Ozono.">
            <button
              onClick={() => setActiveTab('vector')}
              className={`px-2 py-1 border transition-all flex items-center gap-1.5 ${
                activeTab === 'vector'
                  ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 font-bold shadow-[0_0_8px_rgba(99,102,241,0.3)]'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className="w-3 h-3 text-indigo-400" />
              <span>Vector Fotoquímico R1-R4</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip topic="leighton_photostationary" position="bottom" width="w-[280px]" content="Evolución horaria diurna de la constante de fotólisis j_NO2 en función del ángulo cenital solar Z(t) para la latitud de Málaga.">
            <button
              onClick={() => setActiveTab('diurnal_curve')}
              className={`px-2 py-1 border transition-all flex items-center gap-1.5 ${
                activeTab === 'diurnal_curve'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Curva Diurna j_NO₂(Z)</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip topic="leighton_photostationary" position="bottom" width="w-[300px]" content="Diagrama de Isopletas de Ozono EKMA (Empirical Kinetic Modeling Approach). Permite evaluar la sensibilidad del pico de ozono frente a reducciones de VOCs o NOx.">
            <button
              onClick={() => setActiveTab('ekma')}
              className={`px-2 py-1 border transition-all flex items-center gap-1.5 ${
                activeTab === 'ekma'
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>Isopletas EKMA (O₃)</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip topic="leighton_photostationary" position="bottom" width="w-[340px]" content="Solucionador numérico ODE rígido (Stiff Rosenbrock / RK45) acoplado a la física en tiempo real. Resuelve d[NO2]/dt, d[NO]/dt, d[O3]/dt y d[RO2]/dt calculando autovalores, ratio de rigidez y trayectoria espacio-estado.">
            <button
              onClick={() => setActiveTab('ode_trajectory')}
              className={`px-2 py-1 border transition-all flex items-center gap-1.5 ${
                activeTab === 'ode_trajectory'
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 font-bold shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3 h-3 text-rose-400" />
              <span>Solucionador Stiff ODE</span>
            </button>
          </ScientificTooltip>
        </div>

        <div className="flex items-center gap-2 text-[8.5px] text-slate-400">
          <ScientificTooltip content="Exportar diagrama físico-químico vectorial en formato SVG de alta resolución listo para su inclusión en publicaciones Q1 (JCR) y memoria doctoral.">
            <button
              onClick={handleExportDiagramSvg}
              className="px-2 py-0.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-600/60 text-indigo-200 font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3 text-indigo-400" /> SVG (JCR)
            </button>
          </ScientificTooltip>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1">
            <Compass className="w-3 h-3 text-amber-400" />
            <span>Z = <strong className="text-amber-300">{currentSolarData.solarZenithDeg}°</strong></span>
          </span>
        </div>
      </div>

      {/* 1. MÓDULO DE TASAS NETAS DIFERENCIALES d[C]/dt (ppb/min) Y PARÁMETROS URBANOS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-slate-900/90 border border-slate-800 p-2 rounded text-[9.5px] font-mono">
        <div className="bg-slate-950 p-1.5 border border-slate-800 rounded flex justify-between items-center">
          <span className="text-slate-400">d[O₃]/dt:</span>
          <strong className={`font-bold ${dO3_dt >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {dO3_dt >= 0 ? `+${dO3_dt}` : dO3_dt} ppb/min
          </strong>
        </div>
        <div className="bg-slate-950 p-1.5 border border-slate-800 rounded flex justify-between items-center">
          <span className="text-slate-400">d[NO]/dt:</span>
          <strong className={`font-bold ${dNO_dt >= 0 ? 'text-sky-400' : 'text-amber-400'}`}>
            {dNO_dt >= 0 ? `+${dNO_dt}` : dNO_dt} ppb/min
          </strong>
        </div>
        <div className="bg-slate-950 p-1.5 border border-slate-800 rounded flex justify-between items-center">
          <span className="text-slate-400">d[NO₂]/dt:</span>
          <strong className={`font-bold ${dNO2_dt >= 0 ? 'text-indigo-400' : 'text-slate-400'}`}>
            {dNO2_dt >= 0 ? `+${dNO2_dt}` : dNO2_dt} ppb/min
          </strong>
        </div>
        <ScientificTooltip topic="leighton_photostationary" position="top" width="w-[200px]" content="Número de Damköhler (Da = L/(u * tau_chem)). Si Da > 1, domina la química. Si Da < 1, domina la advección (viento).">
          <div className="bg-slate-950 p-1.5 border border-slate-800 rounded flex justify-between items-center cursor-help">
            <span className="text-slate-400">Da:</span>
            <strong className={`font-bold ${damkohlerNumber > 1 ? 'text-rose-400' : 'text-cyan-400'}`}>
              {damkohlerNumber.toFixed(2)}
            </strong>
          </div>
        </ScientificTooltip>
        <ScientificTooltip topic="leighton_photostationary" position="top" width="w-[200px]" content="Profundidad Óptica de Aerosoles (AOD). Atenúa la radiación J_NO2 incidente.">
          <div className="bg-slate-950 p-1.5 border border-slate-800 rounded flex justify-between items-center cursor-help">
            <span className="text-slate-400">AOD:</span>
            <strong className="font-bold text-stone-400">
              {aod.toFixed(3)}
            </strong>
          </div>
        </ScientificTooltip>
      </div>

      {/* Tab 1: Interactive Vector Reaction Graphic (SVG Dynamic Canvas) */}
      {activeTab === 'vector' && (
        <div className="relative w-full h-[260px] bg-[#020617] border-2 border-slate-800 rounded-lg overflow-hidden flex items-center justify-center p-1 shadow-inner">
          <svg 
            viewBox="0 0 480 240" className="w-full h-full select-none" style={{ filter: 'drop-shadow(0px 0px 10px rgba(0,0,0,0.5))' }}>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes flowAnim {
                0% { stroke-dashoffset: 60; }
                100% { stroke-dashoffset: 0; }
              }
              @keyframes flowReverse {
                0% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: 60; }
              }
              @keyframes pulseCore {
                0% { opacity: 0.7; transform: scale(0.98); }
                50% { opacity: 1; transform: scale(1.02); }
                100% { opacity: 0.7; transform: scale(0.98); }
              }
              .animated-flow-fast { stroke-dasharray: 8 8; animation: flowAnim 1s linear infinite; }
              .animated-flow-normal { stroke-dasharray: 8 8; animation: flowAnim 2s linear infinite; }
              .animated-flow-reverse { stroke-dasharray: 8 8; animation: flowReverse 1.5s linear infinite; }
              .core-pulse { transform-origin: 240px 120px; animation: pulseCore 3s ease-in-out infinite; }
            `}} />

            <defs>
              <radialGradient id="bg-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={isCortocircuito ? "#4c1d95" : "#0f172a"} stopOpacity="0.6" />
                <stop offset="100%" stopColor="#020617" stopOpacity="1" />
              </radialGradient>
              
              <linearGradient id="grad-photolysis" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="grad-titration" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="grad-shunt" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="1" />
                <stop offset="100%" stopColor="#fb7185" stopOpacity="0.9" />
              </linearGradient>
              
              {/* Arrow Markers */}
              <marker id="arrow-yellow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                <polygon points="0 0, 5 2.5, 0 5" fill="#f59e0b" />
              </marker>
              <marker id="arrow-blue" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                <polygon points="0 0, 5 2.5, 0 5" fill="#38bdf8" />
              </marker>
              <marker id="arrow-emerald" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                <polygon points="0 0, 5 2.5, 0 5" fill="#34d399" />
              </marker>
              <marker id="arrow-red" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                <polygon points="0 0, 5 2.5, 0 5" fill="#f43f5e" />
              </marker>
              
              <filter id="glow-yellow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="glow-blue"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="glow-red"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="glow-emerald"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>

            {/* Background Grid Accent */}
            <rect width="100%" height="100%" fill="url(#bg-glow)" />
            <pattern id="leighton-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#leighton-grid)" />

            {/* HUD CORE: LEIGHTON RATIO */}
            <g className="core-pulse">
              <circle cx="240" cy="120" r="32" fill={isCortocircuito ? "#4c0519" : isNight ? "#082f49" : "#022c22"} stroke={isCortocircuito ? "#e11d48" : isNight ? "#0284c7" : "#059669"} strokeWidth="2" filter={isCortocircuito ? "url(#glow-red)" : "url(#glow-emerald)"} />
              <text x="240" y="117" fill={isCortocircuito ? "#fda4af" : isNight ? "#bae6fd" : "#6ee7b7"} fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Φ = {ratio_leighton.toFixed(2)}</text>
              <text x="240" y="132" fill={isCortocircuito ? "#f43f5e" : isNight ? "#38bdf8" : "#34d399"} fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                {isNight ? "NOCTURNO" : isCortocircuito ? "SMOG / BYPASS" : "EQUILIBRIO"}
              </text>
            </g>

            {/* REACTION PATHS */}
            <path
              onMouseEnter={() => setHoveredFlux('R1')} onMouseLeave={() => setHoveredFlux(null)}
              d="M 120 70 Q 240 20 360 70" fill="none" stroke="url(#grad-photolysis)" strokeWidth={isNight ? 1 : Math.min(6, Math.max(2, j_no2 * 600))}
              strokeDasharray={isNight ? "4 4" : "none"} markerEnd={!isNight ? "url(#arrow-yellow)" : ""}
              className={`cursor-pointer transition-all duration-300 hover:stroke-amber-300 ${!isNight ? "animated-flow-normal" : ""}`}
              filter="url(#glow-yellow)"
            />
            <path onMouseEnter={() => setHoveredFlux('R1')} onMouseLeave={() => setHoveredFlux(null)} d="M 120 70 Q 240 20 360 70" fill="none" stroke="transparent" strokeWidth="24" className="cursor-pointer" />
            <text x="240" y="28" fill="#fcd34d" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              (R1) NO₂ + hν ➔ NO + O(³P)
            </text>
            <text x="240" y="40" fill="#fbbf24" fontSize="8" textAnchor="middle" fontFamily="monospace">
              R₁ = {rate_photolysis.toFixed(2)} ppb/min [J = {j_no2.toFixed(4)} s⁻¹]
            </text>

            <path
              onMouseEnter={() => setHoveredFlux('R2')} onMouseLeave={() => setHoveredFlux(null)}
              d="M 380 95 Q 410 120 380 145" fill="none" stroke="#34d399" strokeWidth="3"
              markerEnd="url(#arrow-emerald)" className="animated-flow-fast cursor-pointer" filter="url(#glow-emerald)"
            />
            <path onMouseEnter={() => setHoveredFlux('R2')} onMouseLeave={() => setHoveredFlux(null)} d="M 380 95 Q 410 120 380 145" fill="none" stroke="transparent" strokeWidth="24" className="cursor-pointer" />
            <text x="435" y="112" fill="#6ee7b7" fontSize="8" textAnchor="middle" fontFamily="monospace">
              (R2) O(³P) + O₂ ➔ O₃
            </text>
            <text x="435" y="122" fill="#34d399" fontSize="7" textAnchor="middle" fontFamily="monospace">
              R₂ ≈ R₁ (Instantánea)
            </text>

            <path
              onMouseEnter={() => setHoveredFlux('R3')} onMouseLeave={() => setHoveredFlux(null)}
              d="M 360 170 Q 240 220 120 170" fill="none" stroke="url(#grad-titration)" strokeWidth={Math.min(6, Math.max(2, rate_titration * 2))}
              markerEnd="url(#arrow-blue)" className="animated-flow-normal cursor-pointer" filter="url(#glow-blue)"
            />
            <path onMouseEnter={() => setHoveredFlux('R3')} onMouseLeave={() => setHoveredFlux(null)} d="M 360 170 Q 240 220 120 170" fill="none" stroke="transparent" strokeWidth="24" className="cursor-pointer" />
            <text x="240" y="200" fill="#7dd3fc" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              (R3) NO + O₃ ➔ NO₂ + O₂
            </text>
            <text x="240" y="212" fill="#38bdf8" fontSize="8" textAnchor="middle" fontFamily="monospace">
              R₃ = {rate_titration.toFixed(2)} ppb/min [k₃ = {data.k3?.toFixed(3) || '0.44'} ppb⁻¹min⁻¹]
            </text>

            {voc_ppb > 2 && (
              <g>
                <path
                  onMouseEnter={() => setHoveredFlux('R4')} onMouseLeave={() => setHoveredFlux(null)}
                  d="M 350 90 C 290 120 190 120 130 90" fill="none" stroke="url(#grad-shunt)" strokeWidth={Math.min(5, Math.max(2, (rate_ro2_shunt || 1) * 2))}
                  markerEnd="url(#arrow-red)" className={`cursor-pointer transition-all duration-300 ${isCortocircuito ? "animated-flow-fast" : ""}`}
                  filter="url(#glow-red)"
                />
                <path onMouseEnter={() => setHoveredFlux('R4')} onMouseLeave={() => setHoveredFlux(null)} d="M 350 90 C 290 120 190 120 130 90" fill="none" stroke="transparent" strokeWidth="24" className="cursor-pointer" />
                
                <rect x="180" y="70" width="120" height="26" rx="4" fill="#4c0519" stroke="#f43f5e" strokeWidth="1" opacity="0.9" />
                <text x="240" y="80" fill="#fda4af" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">⚡ BYPASS RO₂• (R₄ = {rate_ro2_shunt.toFixed(2)} ppb/min)</text>
                <text x="240" y="90" fill="#fecdd3" fontSize="7" textAnchor="middle" fontFamily="monospace">NO + RO₂• ➔ NO₂ + RO•</text>
              </g>
            )}

            {/* MOLECULAR NODES */}
            <g transform="translate(80, 120)">
              <circle r="38" fill="#1e1b4b" stroke={isCortocircuito ? "#6366f1" : "#4338ca"} strokeWidth="1.5" opacity="0.8" filter="url(#glow-blue)"/>
              <circle cx="0" cy="0" r="10" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
              <circle cx="-14" cy="-10" r="8" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
              <circle cx="-14" cy="10" r="8" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
              <text x="0" y="24" fill="#a5b4fc" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">NO₂</text>
              <text x="0" y="34" fill="#818cf8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{no2_ppb.toFixed(1)} ppb</text>
            </g>

            <g transform="translate(380, 70)">
              <circle r="34" fill="#082f49" stroke="#0284c7" strokeWidth="1.5" opacity="0.8" filter="url(#glow-blue)" />
              <circle cx="-6" cy="0" r="10" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
              <circle cx="10" cy="0" r="8" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
              <text x="0" y="20" fill="#7dd3fc" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">NO</text>
              <text x="0" y="29" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{no_ppb.toFixed(1)} ppb</text>
            </g>

            <g transform="translate(380, 170)">
              <circle r="34" fill="#022c22" stroke="#059669" strokeWidth="1.5" opacity="0.8" filter="url(#glow-emerald)" />
              <circle cx="0" cy="-8" r="8" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
              <circle cx="-9" cy="4" r="8" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
              <circle cx="9" cy="4" r="8" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
              <text x="0" y="20" fill="#6ee7b7" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">O₃</text>
              <text x="0" y="29" fill="#34d399" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{o3_ppb.toFixed(1)} ppb</text>
            </g>

            <g transform="translate(240, 56)">
              {!isNight ? (
                <g className="animate-spin-slow origin-center" filter="url(#glow-yellow)">
                  <circle r="12" fill="#fef08a" stroke="#eab308" strokeWidth="2" />
                  <path d="M 0 -18 L 0 -14 M 0 14 L 0 18 M -18 0 L -14 0 M 14 0 L 18 0 M -12 -12 L -9 -9 M 9 9 L 12 12 M -12 12 L -9 9 M 9 -9 L 12 -12" stroke="#eab308" strokeWidth="2" />
                </g>
              ) : (
                <g>
                  <circle r="10" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                  <path d="M 2 -4 A 8 8 0 0 1 2 4 A 10 10 0 0 0 2 -4" fill="#94a3b8" />
                </g>
              )}
            </g>

            {tooltip && (
              <foreignObject x="70" y="130" width="340" height="90" className="pointer-events-none z-50">
                <div className="bg-slate-900/95 border border-indigo-500/50 rounded p-2 text-white shadow-2xl shadow-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                  <h4 className="text-[11px] font-bold text-indigo-300 mb-0.5 font-mono">{tooltip.title}</h4>
                  <p className="text-[9.5px] text-slate-300 leading-tight font-sans">
                    {tooltip.desc}
                  </p>
                </div>
              </foreignObject>
            )}
          </svg>
        </div>
      )}

      {/* Tab 2: Curva Diurna Fotolítica j_NO2(Z) */}
      {activeTab === 'diurnal_curve' && (
        <div className="bg-black/80 border border-slate-800 rounded p-2.5 space-y-2">
          <div className="flex items-center justify-between text-[9px] font-mono">
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Variación Diurna de Tasa Fotolítica j_NO₂(Z) [24h]</span>
            </span>
            <span className="text-slate-400 bg-slate-900 px-1.5 py-0.5 border border-slate-800">
              Málaga: 36.72°N, -4.42°W
            </span>
          </div>

          <div className="h-[170px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={diurnalPoints} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hourStr" stroke="#64748b" fontSize={8} tickLine={false} />
                <YAxis yAxisId="left" stroke="#f59e0b" fontSize={8} tickLine={false} domain={[0, 0.0125]} />
                <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" fontSize={8} tickLine={false} domain={[0, 90]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-amber-900/80 p-2 text-[9px] font-mono text-slate-200 shadow-xl space-y-1">
                          <div className="text-amber-300 font-bold flex justify-between border-b border-slate-800 pb-1">
                            <span>Hora: {dataPoint.hourStr}</span>
                            <span>{dataPoint.isDaylight ? '☀️ Diurno' : '🌙 Nocturno'}</span>
                          </div>
                          <div>j_NO₂: <strong className="text-amber-400">{dataPoint.j_no2_s1.toFixed(5)} s⁻¹</strong></div>
                          <div>Ángulo Cenital Solar (Z): <strong className="text-sky-300">{dataPoint.solarZenithDeg}°</strong></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine 
                  x={`${new Date().getHours().toString().padStart(2, '0')}:00`} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3"
                  label={{ value: "Hora Actual", fill: "#fca5a5", fontSize: 8, position: "top" }} 
                />
                <Line yAxisId="left" type="monotone" dataKey="j_no2_s1" stroke="#f59e0b" strokeWidth={2} dot={false} name="j_NO2" />
                <Line yAxisId="right" type="monotone" dataKey="solarZenithDeg" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Ángulo Z" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 2. Tab 3: DIAGNÓSTICO DEL RÉGIMEN EKMA (ISOPLETAS DE OZONO) - FORMULACIÓN ANALÍTICA STRICTA */}
      {activeTab === 'ekma' && (
        <div className="bg-slate-950 border border-slate-800 rounded p-2.5 space-y-2">
          <div className="flex items-center justify-between text-[9px] font-mono border-b border-slate-800 pb-1.5">
            <span className="text-cyan-400 font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Diagrama de Isopletas EKMA: Pico de O₃ vs Precursores (NOₓ)</span>
            </span>
            <span className="text-slate-400">
              Ratio VOC/NOₓ Actual: <strong className="text-cyan-300">{voc_nox_ratio.toFixed(1)}</strong> ({regimen_ozono})
            </span>
          </div>

          <div className="h-[170px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ekmaCurveData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="nox_ppb" stroke="#64748b" fontSize={8} tickLine={false} label={{ value: "Concentración NOₓ (ppb)", position: "insideBottom", offset: -2, fill: "#94a3b8", fontSize: 8 }} />
                <YAxis stroke="#06b6d4" fontSize={8} tickLine={false} label={{ value: "O₃ Máx (ppb)", angle: -90, position: "insideLeft", fill: "#06b6d4", fontSize: 8 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dp = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-cyan-800 p-2 text-[9px] font-mono text-slate-200 shadow-xl space-y-1">
                          <div className="text-cyan-300 font-bold">NOₓ: {dp.nox_ppb} ppb</div>
                          <div>Pico Ozono Estimado: <strong className="text-emerald-400">{dp.o3_peak_ppb} ppb</strong></div>
                          <div>Régimen: <strong className={dp.vocNoxRatio < 8 ? "text-rose-400" : "text-emerald-400"}>{dp.vocNoxRatio < 8 ? "VOC-limitado" : "NOx-limitado"}</strong></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine x={no_ppb + no2_ppb} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Málaga NOₓ", fill: "#fca5a5", fontSize: 8, position: "top" }} />
                <Line type="monotone" dataKey="o3_peak_ppb" stroke="#06b6d4" strokeWidth={2} dot={false} name="Isopleta O3" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[8px] font-mono text-slate-400 bg-slate-900/80 p-1.5 border border-slate-800 flex justify-between items-center">
            <span>Diagnóstico ZBE Málaga: {voc_nox_ratio < 8 ? 'Reducir NOₓ puede AUMENTAR O₃ local (Titulación inhibida).' : 'Reducir NOₓ REDUCE O₃ eficientemente.'}</span>
            <span className="text-cyan-300 font-bold">Línea Cresta VOC:NOₓ = 8:1</span>
          </div>
        </div>
      )}

      {/* Tab 4: Solucionador Numérico Stiff ODE en Tiempo Real (RK45 / Rosenbrock-W) */}
      {activeTab === 'ode_trajectory' && (
        <div className="bg-slate-950 border border-rose-900/50 rounded p-2.5 space-y-2.5 shadow-2xl">
          {/* Header Bar & Control Panel */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 text-[9px] font-mono">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-rose-400 animate-pulse" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-300 font-bold uppercase tracking-wider">
                    Solucionador Stiff ODE (Comlink WebWorker RPC)
                  </span>
                  <div className="flex items-center gap-1 text-[7.5px] bg-rose-950/70 border border-rose-700/60 px-1.5 py-0.5 rounded text-rose-200">
                    <span className={`w-1 h-1 rounded-full ${odeMetrics.workerActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                    <span>{odeMetrics.workerType}</span>
                    <span>• {odeMetrics.lastExecutionMs} ms</span>
                    {isOdeComputing && <span className="text-amber-300 animate-pulse font-bold">(Calculando...)</span>}
                  </div>
                </div>
                <span className="text-[8px] text-slate-400 block">
                  Integración temporal determinista acoplada: NO₂ + NO + O₃ + RO₂• (60 FPS estables)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
                <button
                  onClick={() => setOdeSubView('concentrations')}
                  className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${
                    odeSubView === 'concentrations' ? 'bg-rose-950 text-rose-300 border border-rose-700' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Concentraciones (ppb)
                </button>
                <button
                  onClick={() => setOdeSubView('rates')}
                  className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${
                    odeSubView === 'rates' ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tasas Cinéticas (ppb/min)
                </button>
                <button
                  onClick={() => setOdeSubView('phase_portrait')}
                  className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${
                    odeSubView === 'phase_portrait' ? 'bg-indigo-950 text-indigo-300 border border-indigo-700' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Espacio de Fases [O₃] vs [NOₓ]
                </button>
              </div>

              <ScientificTooltip content="Descargar serie temporal de trayectoria numérica calculada por el integrador ODE stiff en formato CSV bajo principios FAIR.">
                <button
                  onClick={handleDownloadOdeCsv}
                  className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-300 rounded text-[8px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Download className="w-2.5 h-2.5 text-emerald-400" /> CSV
                </button>
              </ScientificTooltip>
              <ScientificTooltip content="Generar bloque de ecuaciones diferenciales ordinarias del ciclo de Leighton en sintaxis LaTeX \\begin{equation} para la memoria de tesis.">
                <button
                  onClick={handleDownloadOdeLatex}
                  className="px-2 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-600/70 text-indigo-300 rounded text-[8px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <FileText className="w-2.5 h-2.5 text-indigo-400" /> LaTeX
                </button>
              </ScientificTooltip>
            </div>
          </div>

          {/* ODE Sliders and Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/60 p-2 border border-slate-800/80 rounded text-[8.5px] font-mono">
            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span>Horizonte (t)</span>
                <span className="text-rose-400 font-bold">{odeDurationSec} s ({Math.round(odeDurationSec / 60)} min)</span>
              </div>
              <input
                type="range"
                min="300"
                max="3600"
                step="300"
                value={odeDurationSec}
                onChange={(e) => setOdeDurationSec(Number(e.target.value))}
                className="w-full accent-rose-500 h-1 bg-slate-800"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span>Paso Integración (Δt)</span>
                <span className="text-cyan-400 font-bold">{odeDtSec} s</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.5"
                value={odeDtSec}
                onChange={(e) => setOdeDtSec(Number(e.target.value))}
                className="w-full accent-cyan-500 h-1 bg-slate-800"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span>Inyección Tráfico (S_NO)</span>
                <span className="text-sky-400 font-bold">{trafficRatePpbS.toFixed(3)} ppb/s</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.1"
                step="0.005"
                value={trafficRatePpbS}
                onChange={(e) => setTrafficRatePpbS(Number(e.target.value))}
                className="w-full accent-sky-500 h-1 bg-slate-800"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span>Capa de Mezcla (H_PBL)</span>
                <span className="text-indigo-400 font-bold">{mixingHeightM} m</span>
              </div>
              <input
                type="range"
                min="200"
                max="2000"
                step="100"
                value={mixingHeightM}
                onChange={(e) => setMixingHeightM(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-slate-800"
              />
            </div>
          </div>

          {/* ODE Charts by SubView */}
          {odeSubView === 'concentrations' && (
            <div className="h-[180px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={odeResult.timeline} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="t_sec"
                    stroke="#64748b"
                    fontSize={8}
                    tickLine={false}
                    tickFormatter={(v) => `${Math.round(v / 60)}m`}
                  />
                  <YAxis yAxisId="left" stroke="#cbd5e1" fontSize={8} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" fontSize={8} tickLine={false} unit=" ppt" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const dp = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-rose-900/80 p-2 text-[9px] font-mono text-slate-200 shadow-2xl space-y-1">
                            <div className="text-rose-300 font-bold border-b border-slate-800 pb-1">
                              t = {dp.t_sec}s ({(dp.t_sec / 60).toFixed(1)} min)
                            </div>
                            <div className="text-indigo-400">NO₂: <strong className="text-white">{dp.no2_ppb} ppb</strong></div>
                            <div className="text-sky-400">NO: <strong className="text-white">{dp.no_ppb} ppb</strong></div>
                            <div className="text-emerald-400">O₃: <strong className="text-white">{dp.o3_ppb} ppb</strong></div>
                            <div className="text-rose-400">RO₂•: <strong className="text-white">{dp.ro2_ppt} ppt</strong></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '8.5px', fontFamily: 'monospace', paddingTop: '4px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="no2_ppb" stroke="#818cf8" strokeWidth={2} dot={false} name="[NO2] (ppb)" />
                  <Line yAxisId="left" type="monotone" dataKey="no_ppb" stroke="#38bdf8" strokeWidth={2} dot={false} name="[NO] (ppb)" />
                  <Line yAxisId="left" type="monotone" dataKey="o3_ppb" stroke="#34d399" strokeWidth={2} dot={false} name="[O3] (ppb)" />
                  <Line yAxisId="right" type="monotone" dataKey="ro2_ppt" stroke="#fb7185" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="[RO2•] (ppt)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {odeSubView === 'rates' && (
            <div className="h-[180px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={odeResult.timeline} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="t_sec"
                    stroke="#64748b"
                    fontSize={8}
                    tickLine={false}
                    tickFormatter={(v) => `${Math.round(v / 60)}m`}
                  />
                  <YAxis stroke="#f59e0b" fontSize={8} tickLine={false} unit=" ppb/m" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const dp = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-amber-900/80 p-2 text-[9px] font-mono text-slate-200 shadow-2xl space-y-1">
                            <div className="text-amber-300 font-bold border-b border-slate-800 pb-1">
                              t = {dp.t_sec}s ({(dp.t_sec / 60).toFixed(1)} min)
                            </div>
                            <div className="text-amber-400">R₁ (Fotólisis): <strong className="text-white">{dp.rate_photolysis} ppb/min</strong></div>
                            <div className="text-sky-400">R₃ (Titulación): <strong className="text-white">{dp.rate_titration} ppb/min</strong></div>
                            <div className="text-rose-400">R₄ (Bypass RO₂): <strong className="text-white">{dp.rate_ro2_shunt} ppb/min</strong></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '8.5px', fontFamily: 'monospace', paddingTop: '4px' }} />
                  <Line type="monotone" dataKey="rate_photolysis" stroke="#f59e0b" strokeWidth={2} dot={false} name="R1: Fotólisis NO2" />
                  <Line type="monotone" dataKey="rate_titration" stroke="#38bdf8" strokeWidth={2} dot={false} name="R3: Titulación NO+O3" />
                  <Line type="monotone" dataKey="rate_ro2_shunt" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="R4: Shunt RO2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {odeSubView === 'phase_portrait' && (
            <div className="h-[180px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={phaseSpaceData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="nox_ppb" stroke="#818cf8" fontSize={8} tickLine={false} label={{ value: "[NOₓ] = [NO] + [NO₂] (ppb)", position: "insideBottom", offset: -2, fill: "#818cf8", fontSize: 8 }} />
                  <YAxis dataKey="o3_ppb" stroke="#34d399" fontSize={8} tickLine={false} label={{ value: "[O₃] (ppb)", angle: -90, position: "insideLeft", fill: "#34d399", fontSize: 8 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const dp = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-indigo-900 p-2 text-[9px] font-mono text-slate-200 shadow-2xl space-y-1">
                            <div className="text-indigo-300 font-bold border-b border-slate-800 pb-1">
                              Espacio-Estado (t = {dp.t_min} min)
                            </div>
                            <div>NOₓ Total: <strong className="text-indigo-400">{dp.nox_ppb} ppb</strong></div>
                            <div>Ozono: <strong className="text-emerald-400">{dp.o3_ppb} ppb</strong></div>
                            <div>Ratio NO₂/NO: <strong className="text-sky-400">{dp.no2_no_ratio}</strong></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="o3_ppb" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 2, fill: '#ec4899' }} name="Trayectoria Dinámica" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Stiff Diagnostics & Eigenvalues Footnote */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-black/60 p-2 border border-slate-800 rounded text-[8.5px] font-mono">
            <div className="flex flex-col justify-between">
              <span className="text-slate-400">Ratio Rigidez (S):</span>
              <strong className="text-rose-400 font-bold">{odeResult.diagnostics.stiffnessRatio} (Stiff System)</strong>
            </div>
            <div className="flex flex-col justify-between">
              <span className="text-slate-400">Autovalores λ(J):</span>
              <strong className="text-cyan-300 font-bold">[{odeResult.diagnostics.eigenvalues.join(', ')}] s⁻¹</strong>
            </div>
            <div className="flex flex-col justify-between">
              <span className="text-slate-400">Relax τ(O₃) / τ(NOₓ):</span>
              <strong className="text-amber-300 font-bold">{odeResult.diagnostics.tauO3_sec}s / {odeResult.diagnostics.tauNOx_sec}s</strong>
            </div>
            <div className="flex flex-col justify-between">
              <span className="text-slate-400">Equilibrio PSS Final (Φ):</span>
              <strong className={`font-bold ${odeResult.steadyState.leightonRatio > 1.2 ? 'text-rose-400' : 'text-emerald-400'}`}>
                Φ = {odeResult.steadyState.leightonRatio} (NO₂: {odeResult.steadyState.no2_ppb} ppb)
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Live Reactions Balance Table */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[9px] font-mono">
        <ScientificTooltip topic="leighton_photostationary" position="top" width="w-[280px]" content="Reacción R1: Fotodisociación de NO2 por radiación UV actínica (λ < 420 nm). Produce NO y el átomo radicalario de oxígeno O(3P) generador de O3.">
          <div className="bg-black/60 p-2 border border-amber-900/40 rounded flex flex-col justify-between cursor-help">
            <div className="flex items-center justify-between text-amber-400 font-bold mb-1">
              <span className="flex items-center gap-1"><Sun className="w-2.5 h-2.5" /> (R1) Fotólisis NO₂</span>
              <span>J = {j_no2.toFixed(4)} s⁻¹</span>
            </div>
            <div className="text-[8px] text-slate-400 leading-tight">
              Tasa de producción de NO + O(³P): <strong className="text-amber-200">{(j_no2 * no2_ppb * 60).toFixed(2)} ppb/min</strong>
            </div>
          </div>
        </ScientificTooltip>

        <ScientificTooltip topic="leighton_photostationary" position="top" width="w-[280px]" content="Reacción R3: Titulación térmica NO + O3 -> NO2 + O2 con constante de Arrhenius k3(T). Sumidero fundamental nocturno de ozono troposférico.">
          <div className="bg-black/60 p-2 border border-sky-900/40 rounded flex flex-col justify-between cursor-help">
            <div className="flex items-center justify-between text-sky-400 font-bold mb-1">
              <span className="flex items-center gap-1"><Wind className="w-2.5 h-2.5" /> (R3) Titulación (k₃)</span>
              <span>k₃ = {data.k3 || 0.44}</span>
            </div>
            <div className="text-[8px] text-slate-400 leading-tight">
              Tasa de recombinación NO+O₃: <strong className="text-sky-200">{r3_titration_ppb_min.toFixed(2)} ppb/min</strong>
            </div>
          </div>
        </ScientificTooltip>

        <ScientificTooltip topic="leighton_photostationary" position="top" width="w-[280px]" content="Reacción R4: Bypass de radicales peroxilo RO2/HO2 generados por degradación de COVs. Oxida NO a NO2 sin titulación de O3, induciendo cortocircuito y smog fotoquímico.">
          <div className={`p-2 border rounded flex flex-col justify-between cursor-help ${
            isCortocircuito ? 'bg-red-950/50 border-red-800/70 text-red-300' : 'bg-black/60 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center justify-between font-bold mb-1">
              <span className="flex items-center gap-1"><Flame className="w-2.5 h-2.5 text-rose-400" /> (R4) Fuga Radicalaria</span>
              <span className={isCortocircuito ? 'text-rose-300' : 'text-slate-500'}>
                VOCs: {voc_ppb.toFixed(1)} ppb
              </span>
            </div>
            <div className="text-[8px] leading-tight">
              Régimen: <strong className="text-white">{regimen_ozono}</strong> (COV/NOx = {voc_nox_ratio.toFixed(1)})
            </div>
          </div>
        </ScientificTooltip>
      </div>

      {/* Diagnostic Footnote */}
      <div className="text-[8.5px] font-mono text-slate-400 bg-slate-900/80 p-2 border-l-2 border-indigo-500 flex items-start gap-2">
        <Zap className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          {isCortocircuito ? (
            <span>
              <strong className="text-red-300">CORTOCIRCUITO FOTOQUÍMICO ACTIVO:</strong> El exceso de radicales orgánicos (RO₂•) procedentes de COVs está regenerando NO₂ sin requerir la titulación de Ozono. Esto anula el sumidero natural de NO y provoca acumulación neta de smog secundario en la Bahía de Málaga.
            </span>
          ) : isNight ? (
            <span>
              <strong className="text-slate-300">RÉGIMEN NOCTURNO:</strong> Sin radiación actínica solar (J_NO₂ ≈ 0), el ciclo entra en fase de titulación pura. El NO primario de las emisiones viarias consume el O₃ residual presente en la capa de mezcla.
            </span>
          ) : (
            <span>
              <strong className="text-emerald-300">ESTADO ESTACIONARIO ESTABLE:</strong> La tasa de fotólisis de NO₂ se encuentra balanceada dinámicamente con la tasa de recombinación con Ozono (Φ ≈ 1.0), manteniendo la respiración natural de la atmósfera urbana.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
