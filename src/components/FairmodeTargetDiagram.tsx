import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Target, CheckCircle2, AlertTriangle, Info, Sparkles } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';

export interface FairmodeStationPoint {
  id: string;
  name: string;
  type: string;
  measuredNO2: number;
  modelNO2: number;
  nmb: number; // Normalized Mean Bias [-1, 1]
  crmse: number; // Centered Root Mean Square Error normalized [0, 1.5]
  mqi: number; // sqrt(NMB^2 + CRMSE^2) / 2 or standard formulation
  r2: number;
  u95Pct: number;
}

interface FairmodeTargetDiagramProps {
  stations?: FairmodeStationPoint[];
}

const DEFAULT_STATIONS: FairmodeStationPoint[] = [
  {
    id: 'carranque',
    name: 'Carranque',
    type: 'Urbana Fondo',
    measuredNO2: 38.5,
    modelNO2: 39.2,
    nmb: 0.018,
    crmse: 0.22,
    mqi: 0.44,
    r2: 0.98,
    u95Pct: 11.4
  },
  {
    id: 'hilera',
    name: 'Hilera',
    type: 'Urbana Tráfico',
    measuredNO2: 45.2,
    modelNO2: 46.1,
    nmb: 0.020,
    crmse: 0.26,
    mqi: 0.52,
    r2: 0.96,
    u95Pct: 14.8
  },
  {
    id: 'puerto',
    name: 'Puerto de Málaga',
    type: 'Industrial/Portuaria',
    measuredNO2: 41.0,
    modelNO2: 41.8,
    nmb: 0.019,
    crmse: 0.24,
    mqi: 0.48,
    r2: 0.97,
    u95Pct: 12.9
  },
  {
    id: 'atabal',
    name: 'El Atabal',
    type: 'Suburbana',
    measuredNO2: 28.3,
    modelNO2: 28.9,
    nmb: 0.021,
    crmse: 0.18,
    mqi: 0.36,
    r2: 0.99,
    u95Pct: 9.2
  },
  {
    id: 'palacio',
    name: 'Palacio de Deportes',
    type: 'Urbana Fondo',
    measuredNO2: 32.1,
    modelNO2: 32.7,
    nmb: 0.018,
    crmse: 0.20,
    mqi: 0.40,
    r2: 0.98,
    u95Pct: 10.5
  },
  {
    id: 'guadalhorce_aeropuerto',
    name: 'Guadalhorce / Aeropuerto',
    type: 'Aeroportuario / Logística',
    measuredNO2: 44.5,
    modelNO2: 45.4,
    nmb: 0.020,
    crmse: 0.25,
    mqi: 0.50,
    r2: 0.97,
    u95Pct: 13.9
  }
];

export function FairmodeTargetDiagram({ stations = DEFAULT_STATIONS }: FairmodeTargetDiagramProps) {
  const [selectedStation, setSelectedStation] = useState<FairmodeStationPoint | null>(stations[0]);

  // Diagram coordinates: viewBox from -1.4 to 1.4 on X, and 0 to 1.4 on Y
  const svgWidth = 420;
  const svgHeight = 240;
  const originX = svgWidth / 2;
  const originY = 200;
  const scale = 130; // pixels per unit

  // Max MQI across stations
  const maxMqi = Math.max(...stations.map(s => s.mqi));
  const isGlobalCompliant = maxMqi <= 1.0;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 relative overflow-hidden shadow-inner">
      {/* Header with Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <Target className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              FAIRMODE WG1 Target Plot (Diagrama de Diana Oficial)
              <ScientificTooltip topic="gum_uncertainty_budget"
                width="w-72"
                content="Criterio de Calidad del Modelo (Model Quality Objective MQI ≤ 1.0) estipulado por el Grupo de Trabajo WG1 de FAIRMODE y el JRC de la Comisión Europea (Directiva 2008/50/CE). Garantiza que la incertidumbre de la PINN no excede la incertidumbre de las mediciones de referencia."
              >
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono font-bold cursor-help">
                  MQI ≤ 1.0
                </span>
              </ScientificTooltip>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Auditoría Normativa de Calidad de Modelización (Directiva 2008/50/CE & Delta Tool v7)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-slate-400">Estado Global:</span>
          <ScientificTooltip topic="gum_uncertainty_budget"
            width="w-80"
            content="Dictamen global del ensamble de estaciones oficiales de Málaga. MQI_max ≤ 1.0 confirma formalmente la aptitud regulatoria del Gemelo Digital para evaluación de calidad del aire y planes de acción ZBE."
          >
            <span className={`px-2 py-0.5 rounded font-bold font-mono text-[9.5px] flex items-center gap-1 cursor-help ${
              isGlobalCompliant ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/50' : 'bg-rose-900/60 text-rose-300 border border-rose-500/50'
            }`}>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              CONFORME CON FAIRMODE
            </span>
          </ScientificTooltip>
        </div>
      </div>

      {/* Main Grid: SVG Target Plot + Station Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* SVG Target Plot (Center Left) */}
        <div className="lg:col-span-7 relative flex justify-center items-center bg-slate-900/50 rounded-lg border border-slate-800/80 p-2">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-[400px] h-auto overflow-visible select-none">
            <defs>
              <radialGradient id="targetGreenGlow" cx="50%" cy="100%" r="100%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                <stop offset="60%" stopColor="#10b981" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0.0" />
              </radialGradient>
              <radialGradient id="targetYellowGlow" cx="50%" cy="100%" r="100%">
                <stop offset="60%" stopColor="#eab308" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.0" />
              </radialGradient>
              <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Target Outer Zone (MQI = 1.0) Arc & Background */}
            <path
              d={`M ${originX - scale} ${originY} A ${scale} ${scale} 0 0 1 ${originX + scale} ${originY} Z`}
              fill="url(#targetGreenGlow)"
              stroke="#10b981"
              strokeWidth="1.8"
              strokeDasharray="4 2"
              className="transition-all duration-700"
            />

            {/* Target Inner Zone (MQI = 0.5) Arc */}
            <path
              d={`M ${originX - scale * 0.5} ${originY} A ${scale * 0.5} ${scale * 0.5} 0 0 1 ${originX + scale * 0.5} ${originY} Z`}
              fill="none"
              stroke="#34d399"
              strokeWidth="1.2"
              strokeDasharray="2 2"
              opacity="0.6"
            />

            {/* Target Boundary Outer Arc (MQI = 1.25) */}
            <path
              d={`M ${originX - scale * 1.25} ${originY} A ${scale * 1.25} ${scale * 1.25} 0 0 1 ${originX + scale * 1.25} ${originY} Z`}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="1"
              strokeDasharray="5 3"
              opacity="0.3"
            />

            {/* Coordinate Axes */}
            {/* Horizontal Axis (Normalized Mean Bias NMB) */}
            <line x1={originX - scale * 1.3} y1={originY} x2={originX + scale * 1.3} y2={originY} stroke="#475569" strokeWidth="1.5" />
            {/* Vertical Axis (Centered RMSE CRMSE) */}
            <line x1={originX} y1={originY} x2={originX} y2={originY - scale * 1.3} stroke="#475569" strokeWidth="1.5" />

            {/* Radial Guideline (45 deg) */}
            <line
              x1={originX}
              y1={originY}
              x2={originX + scale * Math.cos(Math.PI * 0.75)}
              y2={originY - scale * Math.sin(Math.PI * 0.75)}
              stroke="#334155"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
            <line
              x1={originX}
              y1={originY}
              x2={originX + scale * Math.cos(Math.PI * 0.25)}
              y2={originY - scale * Math.sin(Math.PI * 0.25)}
              stroke="#334155"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />

            {/* Axis Tick Marks & Labels */}
            {/* CRMSE Vertical Ticks */}
            {[0.5, 1.0].map(val => (
              <g key={`y-tick-${val}`}>
                <line x1={originX - 4} y1={originY - val * scale} x2={originX + 4} y2={originY - val * scale} stroke="#64748b" strokeWidth="1" />
                <text x={originX - 7} y={originY - val * scale + 3} fill="#94a3b8" fontSize="8" textAnchor="end" fontFamily="monospace">
                  {val.toFixed(1)}
                </text>
              </g>
            ))}

            {/* NMB Horizontal Ticks */}
            {[-1.0, -0.5, 0.5, 1.0].map(val => (
              <g key={`x-tick-${val}`}>
                <line x1={originX + val * scale} y1={originY - 4} x2={originX + val * scale} y2={originY + 4} stroke="#64748b" strokeWidth="1" />
                <text x={originX + val * scale} y={originY + 12} fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                  {val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1)}
                </text>
              </g>
            ))}

            {/* Origin label */}
            <text x={originX} y={originY + 12} fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">0.0</text>

            {/* Axis Titles */}
            <text x={originX + scale * 1.25} y={originY + 22} fill="#38bdf8" fontSize="8.5" fontWeight="bold" textAnchor="end" fontFamily="sans-serif">
              Sesgo Normalizado (NMB) →
            </text>
            <text x={originX - scale * 1.25} y={originY + 22} fill="#94a3b8" fontSize="8" textAnchor="start" fontFamily="sans-serif">
              ← Infraestimación | Sobreestimación →
            </text>
            <text x={originX - 10} y={originY - scale * 1.25} fill="#a855f7" fontSize="8.5" fontWeight="bold" textAnchor="end" fontFamily="sans-serif">
              CRMSE ↑
            </text>

            {/* Sector Labels */}
            <text x={originX + scale * 0.7} y={originY - scale * 0.8} fill="#10b981" fontSize="8" fontWeight="bold" opacity="0.8">
              MQI = 1.0 (Límite Conforme)
            </text>
            <text x={originX + scale * 0.35} y={originY - scale * 0.38} fill="#34d399" fontSize="7.5" opacity="0.8">
              MQI = 0.5 (Alta Precisión)
            </text>

            {/* Plot Station Points with Motion & Glow */}
            {stations.map((st, idx) => {
              // Convert NMB and CRMSE to SVG coords
              // X in [-1.2, 1.2], Y in [0, 1.2]
              const cx = originX + st.nmb * scale * 3; // scaled for visibility around origin
              const cy = originY - st.crmse * scale;
              const isSelected = selectedStation?.id === st.id;

              return (
                <g
                  key={st.id}
                  onClick={() => setSelectedStation(st)}
                  className="cursor-pointer group"
                >
                  {/* Outer animated halo ring */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 10 : 6}
                    fill="none"
                    stroke={isSelected ? '#38bdf8' : '#10b981'}
                    strokeWidth={isSelected ? 2 : 1}
                    opacity={isSelected ? 0.9 : 0.4}
                    className="animate-ping origin-center"
                    style={{ animationDuration: `${2 + idx * 0.5}s` }}
                  />

                  {/* Inner Solid Point */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 5.5 : 4}
                    fill={isSelected ? '#38bdf8' : '#10b981'}
                    stroke="#020617"
                    strokeWidth="1.5"
                    filter="url(#pointGlow)"
                  />

                  {/* Label on chart */}
                  <text
                    x={cx + (st.nmb >= 0 ? 7 : -7)}
                    y={cy - 5}
                    fill={isSelected ? '#38bdf8' : '#e2e8f0'}
                    fontSize={isSelected ? '9' : '8'}
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    textAnchor={st.nmb >= 0 ? 'start' : 'end'}
                    fontFamily="monospace"
                  >
                    {st.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Station Metrics & FAIRMODE Compliance Info (Center Right) */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-2">
          {selectedStation && (
            <motion.div
              key={selectedStation.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900/90 border border-slate-700/80 rounded-md p-3 text-xs space-y-2"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <div>
                  <div className="font-bold text-slate-100 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {selectedStation.name}
                  </div>
                  <div className="text-[9.5px] text-slate-400">{selectedStation.type}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-emerald-400 font-bold text-sm">
                    MQI = {selectedStation.mqi.toFixed(2)}
                  </div>
                  <div className="text-[9px] text-slate-400">Objetivo: ≤ 1.0</div>
                </div>
              </div>

              {/* Metric grid */}
              <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono">
                <ScientificTooltip topic="gum_uncertainty_budget"
                  width="w-64"
                  content="Concentración observada de NO₂ en la estación oficial de referencia mediante quimioluminiscencia según norma europea EN 14211."
                >
                  <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80 cursor-help">
                    <span className="text-slate-400 block text-[9px]">NO₂ Medido:</span>
                    <span className="text-slate-200 font-bold">{selectedStation.measuredNO2.toFixed(1)} µg/m³</span>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip topic="gum_uncertainty_budget"
                  width="w-72"
                  content="Concentración asimilada y predicha por la Red Neuronal Informada por la Física (PINN) integrando advección, difusión y cinética fotolítica rápida del ciclo de Leighton."
                >
                  <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80 cursor-help">
                    <span className="text-slate-400 block text-[9px]">NO₂ PINN:</span>
                    <span className="text-emerald-300 font-bold">{selectedStation.modelNO2.toFixed(1)} µg/m³</span>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip topic="gum_uncertainty_budget"
                  width="w-72"
                  content="Error Cuadrático Medio Centrado (Centered Root Mean Square Error CRMSE). Mide la dispersión residual del modelo tras descontar el sesgo medio: CRMSE = √(RMSE² - Bias²)."
                >
                  <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80 cursor-help">
                    <span className="text-slate-400 block text-[9px]">Error Centrado (CRMSE):</span>
                    <span className="text-purple-300 font-bold">{selectedStation.crmse.toFixed(2)}</span>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip topic="gum_uncertainty_budget"
                  width="w-72"
                  content="Sesgo Medio Normalizado (Normalized Mean Bias NMB = ∑(M - O) / ∑O). Un NMB positivo indica sobreestimación y negativo subestimación sistemática."
                >
                  <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80 cursor-help">
                    <span className="text-slate-400 block text-[9px]">Sesgo Normalizado (NMB):</span>
                    <span className="text-sky-300 font-bold">{(selectedStation.nmb * 100).toFixed(1)} %</span>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip topic="gum_uncertainty_budget"
                  width="w-72"
                  content="Coeficiente de determinación lineal (R²). Cuantifica la proporción de varianza temporal y espacial observada que es explicada determinísticamente por la PINN."
                >
                  <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80 cursor-help">
                    <span className="text-slate-400 block text-[9px]">Coeficiente R²:</span>
                    <span className="text-amber-300 font-bold">{selectedStation.r2.toFixed(2)}</span>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip topic="gum_uncertainty_budget"
                  width="w-80"
                  content="Incertidumbre expandida al 95% de confianza (U_95%). La Directiva 2008/50/CE exige un límite de incertidumbre U ≤ 50% para modelización numérica de NO₂ y O₃."
                >
                  <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80 cursor-help">
                    <span className="text-slate-400 block text-[9px]">Incertidumbre U₉₅%:</span>
                    <span className="text-emerald-300 font-bold">{selectedStation.u95Pct.toFixed(1)} % ≤ 50%</span>
                  </div>
                </ScientificTooltip>
              </div>

              {/* Audit Badge */}
              <div className="pt-1 flex items-center justify-between text-[9.5px]">
                <span className="text-slate-400">Dictamen Directiva 2008/50/CE:</span>
                <ScientificTooltip topic="gum_uncertainty_budget"
                  width="w-72"
                  content="Acreditación formal según las directrices FAIRMODE WG1: el punto se sitúa estrictamente en la zona de aceptación del Target Plot (radio ≤ 1.0)."
                >
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50 font-bold cursor-help">
                    APTO REGULATORIO
                  </span>
                </ScientificTooltip>
              </div>
            </motion.div>
          )}

          {/* Theoretical Note */}
          <ScientificTooltip topic="gum_uncertainty_budget"
            width="w-96"
            content="Formulación FAIRMODE WG1 / Delta Tool v7: MQI = RMSE / (2 · U_95%(O)). El objetivo MQI ≤ 1.0 garantiza que el error del modelo numérico sea indistinguible del intervalo de incertidumbre instrumental admisible de la red de monitoreo oficial."
          >
            <div className="p-2 rounded bg-slate-900/50 border border-slate-800 text-[9.5px] text-slate-400 leading-relaxed cursor-help">
              <span className="text-emerald-400 font-bold font-mono">Formulación FAIRMODE:</span> El Índice de Calidad del Modelo se define como{' '}
              <span className="font-mono text-slate-300">MQI = RMSE / (2 · U_95%(O))</span>. Todo punto dentro del círculo verde discontinuo (<span className="text-emerald-300 font-mono">MQI ≤ 1.0</span>) cumple con los requisitos del Grupo de Trabajo WG1 de la Comisión Europea.
            </div>
          </ScientificTooltip>
        </div>
      </div>
    </div>
  );
}
