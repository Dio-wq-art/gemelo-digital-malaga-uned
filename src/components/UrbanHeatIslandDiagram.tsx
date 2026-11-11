import React, { useState, useMemo } from 'react';
import { Thermometer, Moon, Sun, Wind, Download, Activity, ShieldCheck, Flame } from 'lucide-react';
import { downloadVectorSvg } from '../lib/vectorExporter';
import { ScientificTooltip } from './ScientificTooltip';

export interface UrbanHeatIslandDiagramProps {
  tempUrbanC: number;
  tempRuralC: number;
  windSpeedMs: number;
  hourOfDay?: number;
  pblHeightM?: number;
  onClose?: () => void;
}

export const UrbanHeatIslandDiagram: React.FC<UrbanHeatIslandDiagramProps> = ({
  tempUrbanC,
  tempRuralC,
  windSpeedMs,
  hourOfDay = 14,
  pblHeightM = 850,
  onClose
}) => {
  const [isNightMode, setIsNightMode] = useState<boolean>(hourOfDay < 7 || hourOfDay > 20);
  const [hoveredFlux, setHoveredFlux] = useState<string | null>(null);

  // 1. BALANCE DE ENERGÍA SUPERFICIAL URBANA (OKE 1982)
  // Q* + Qf = Qh + Qe + dQs
  const deltaTUhi = parseFloat((tempUrbanC - tempRuralC).toFixed(1));

  // Flujos de energía en W/m² deterministas
  const Q_solar = isNightMode ? 0 : 720;
  const Q_net = isNightMode ? -45 : 480; // Radiación neta Q*
  const Q_anthro = isNightMode ? 35 : 85; // Calor antropogénico Qf (vehículos + A/C)
  const Q_sensible = isNightMode ? -15 : 340; // Calor sensible turbulento Qh (calienta el aire)
  const Q_latent = isNightMode ? 5 : 45; // Evapotranspiración Qe (muy reducida en asfalto)
  const Q_storage = isNightMode ? -60 : 180; // Almacenamiento térmico en masa de hormigón dQs

  const handleExportSvg = () => {
    downloadVectorSvg('uhi-diagram-svg', `isla_calor_urbana_malaga_delta${deltaTUhi}C.svg`);
  };

  return (
    <div className="flex flex-col gap-3 bg-[#0a0f18] text-slate-200 p-3 rounded border border-rose-950/80 shadow-2xl">
      {/* HEADER CONTROL BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-2 border border-slate-800 rounded">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-rose-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-rose-300">
            BALANCE DE ENERGÍA SUPERFICIAL Y CÚPULA TÉRMICA URBANA (ISLA DE CALOR)
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          <ScientificTooltip topic="canyon_vortex_recirculation" position="bottom" width="w-[300px]" content="Conmuta entre la máxima intensidad de UHI nocturna (cuando el asfalto y hormigón de Málaga liberan el calor almacenado ΔQs en ausencia de radiación solar directa) y el régimen diurno con fuerte radiación solar neta Q*.">
            <button
              onClick={() => setIsNightMode(!isNightMode)}
              className={`px-2 py-0.5 border font-bold flex items-center gap-1 transition-all ${
                isNightMode
                  ? 'bg-indigo-950 border-indigo-500 text-indigo-200 shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                  : 'bg-amber-950 border-amber-500 text-amber-200'
              }`}
            >
              {isNightMode ? <Moon className="w-3 h-3 text-indigo-400" /> : <Sun className="w-3 h-3 text-amber-400" />}
              <span>{isNightMode ? 'MÁXIMA UHI NOCTURNA' : 'RÉGIMEN DIURNO'}</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip topic="canyon_vortex_recirculation" position="bottom" width="w-[260px]" content="Exportar diagrama analítico del balance energético de Oke y cúpula térmica urbana en formato vectorial SVG para estudios microclimáticos.">
            <button
              onClick={handleExportSvg}
              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded flex items-center gap-1 text-[10px] transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3 text-rose-400" />
              <span>SVG</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {/* SVG DIAGRAM CANVAS */}
      <div className="relative w-full bg-[#020617] border border-slate-800 rounded overflow-hidden">
        <svg
          id="uhi-diagram-svg"
          viewBox="0 0 740 390"
          className="w-full h-auto select-none"
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes domeCirc {
              0% { stroke-dashoffset: 60; }
              100% { stroke-dashoffset: 0; }
            }
            @keyframes heatShimmer {
              0% { transform: translateY(0); opacity: 0.7; }
              50% { transform: translateY(-8px); opacity: 1; }
              100% { transform: translateY(0); opacity: 0.7; }
            }
            .dome-flow { stroke-dasharray: 6 6; animation: domeCirc 2.2s linear infinite; }
            .shimmer { animation: heatShimmer 2s ease-in-out infinite; }
          `}} />

          <defs>
            <radialGradient id="uhi-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#881337" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#020617" stopOpacity="1" />
            </radialGradient>

            {/* Thermal Dome Warm Gradient */}
            <linearGradient id="grad-thermal-dome" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#fda4af" stopOpacity="0.05" />
            </linearGradient>

            <filter id="glow-rose-uhi"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="glow-amber-uhi"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>

            <marker id="arrow-rose-uhi" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#f43f5e" />
            </marker>
            <marker id="arrow-sky-uhi" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Background grid */}
          <rect width="100%" height="100%" fill="url(#uhi-bg)" />
          <pattern id="uhi-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1e293b" strokeWidth="0.4" strokeOpacity="0.4" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#uhi-grid)" />

          {/* 1. THERMAL DOME ARCH (CÚPULA TÉRMICA) */}
          <path
            d="M 60 300 Q 280 90 500 300 Z"
            fill="url(#grad-thermal-dome)"
            stroke="#f43f5e"
            strokeWidth="1.8"
            strokeDasharray="4 4"
            filter="url(#glow-rose-uhi)"
          />

          {/* CIRCULATION CELL ARROWS (HOT AIR RISES IN CENTER, INFLOWS FROM SIDES) */}
          <g transform="translate(0, 0)">
            {/* Center upward thermal updraft */}
            <path d="M 280 290 L 280 150" fill="none" stroke="#f43f5e" strokeWidth="3" className="dome-flow" markerEnd="url(#arrow-rose-uhi)" />
            {/* Divergence at top */}
            <path d="M 280 150 Q 200 130 140 180" fill="none" stroke="#fb7185" strokeWidth="2" className="dome-flow" />
            <path d="M 280 150 Q 360 130 420 180" fill="none" stroke="#fb7185" strokeWidth="2" className="dome-flow" />
            {/* Surface return inflow */}
            <path d="M 120 285 L 230 285" fill="none" stroke="#38bdf8" strokeWidth="2.5" className="dome-flow" markerEnd="url(#arrow-sky-uhi)" />
            <path d="M 440 285 L 330 285" fill="none" stroke="#38bdf8" strokeWidth="2.5" className="dome-flow" markerEnd="url(#arrow-sky-uhi)" />
          </g>

          <text x="280" y="115" fill="#fecdd3" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace" filter="url(#glow-rose-uhi)">
            CÚPULA TÉRMICA CONVECTIVA · Zi = {pblHeightM}m
          </text>
          <text x="280" y="130" fill="#fda4af" fontSize="8" textAnchor="middle" fontFamily="monospace">
            Brisa de calor urbana converge hacia el centro por baja presión térmica relativa
          </text>

          {/* 2. RURAL/SUBURBAN CROSS-SECTION ON LEFT */}
          <g transform="translate(60, 300)">
            <line x1="0" y1="0" x2="120" y2="0" stroke="#059669" strokeWidth="3" />
            {/* Rural trees & terrain */}
            <circle cx="25" cy="-14" r="12" fill="#047857" opacity="0.8" />
            <line x1="25" y1="-2" x2="25" y2="0" stroke="#78350f" strokeWidth="2" />
            <circle cx="55" cy="-18" r="14" fill="#059669" opacity="0.8" />
            <line x1="55" y1="-4" x2="55" y2="0" stroke="#78350f" strokeWidth="2" />
            <text x="60" y="18" fill="#6ee7b7" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              RURAL (AEROPUERTO)
            </text>
            <text x="60" y="30" fill="#a7f3d0" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {tempRuralC}°C
            </text>
            <text x="60" y="42" fill="#34d399" fontSize="7" textAnchor="middle" fontFamily="monospace">
              Alta Evapotranspiración Qe
            </text>
          </g>

          {/* 3. DENSE URBAN CANYON IN CENTER (CENTRO HISTÓRICO / ALAMEDA) */}
          <g transform="translate(180, 300)">
            <line x1="0" y1="0" x2="200" y2="0" stroke="#334155" strokeWidth="3" />
            {/* High albedo / thermal mass buildings */}
            <rect x="15" y="-55" width="28" height="55" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <rect x="47" y="-75" width="34" height="75" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <rect x="85" y="-60" width="30" height="60" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <rect x="119" y="-80" width="36" height="80" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <rect x="159" y="-50" width="28" height="50" fill="#1e293b" stroke="#475569" strokeWidth="1" />

            {/* Asphalt street ground */}
            <rect x="0" y="0" width="200" height="8" fill="#334155" />

            <text x="100" y="20" fill="#fca5a5" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              CENTRO URBANO (MALAGA)
            </text>
            <text x="100" y="34" fill="#f43f5e" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {tempUrbanC}°C (ΔT +{deltaTUhi}°C)
            </text>
            <text x="100" y="46" fill="#fb7185" fontSize="7" textAnchor="middle" fontFamily="monospace">
              Bajo SVF · Retención dQs · Emisión Qf
            </text>
          </g>

          {/* 4. COASTAL / SEA BOUNDARY ON RIGHT */}
          <g transform="translate(380, 300)">
            <line x1="0" y1="0" x2="120" y2="0" stroke="#0284c7" strokeWidth="3" />
            {/* Waves */}
            <path d="M 10 -4 Q 25 -10 40 -4 T 70 -4 T 100 -4" fill="none" stroke="#38bdf8" strokeWidth="2" />
            <text x="60" y="18" fill="#7dd3fc" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              BAHÍA DE MÁLAGA (MAR)
            </text>
            <text x="60" y="30" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {(tempRuralC + 0.4).toFixed(1)}°C
            </text>
            <text x="60" y="42" fill="#0ea5e9" fontSize="7" textAnchor="middle" fontFamily="monospace">
              Amortiguación Térmica Marina
            </text>
          </g>

          {/* 5. ENERGY FLUX VECTOR ARROWS (Q*, Qf, Qh, Qe, dQs) */}
          <g transform="translate(560, 30)">
            <rect x="0" y="0" width="165" height="180" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="82" y="20" fill="#e2e8f0" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              BALANCE ENERGÍA URBANA
            </text>
            <line x1="15" y1="28" x2="150" y2="28" stroke="#1e293b" strokeWidth="1" />

            {[
              { id: 'q_net', label: 'Radiación Neta Q*', val: `${Q_net} W/m²`, color: 'text-amber-400' },
              { id: 'q_anthro', label: 'Calor Antrópico Qf', val: `+${Q_anthro} W/m²`, color: 'text-rose-400' },
              { id: 'q_sensible', label: 'Calor Sensible Qh', val: `${Q_sensible} W/m²`, color: 'text-orange-300' },
              { id: 'q_latent', label: 'Latente Qe (Evap)', val: `${Q_latent} W/m²`, color: 'text-blue-300' },
              { id: 'q_storage', label: 'Almacenado ΔQs', val: `${Q_storage} W/m²`, color: 'text-purple-300' },
            ].map((f, i) => (
              <g key={f.id} transform={`translate(15, ${46 + i * 26})`}>
                <text x="0" y="0" fill="#94a3b8" fontSize="8" fontFamily="monospace">{f.label}</text>
                <text x="135" y="0" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="end" fontFamily="monospace">{f.val}</text>
              </g>
            ))}
          </g>

          {/* HUD CORE: DELTA T_UHI */}
          <g transform="translate(642, 290)">
            <circle cx="0" cy="0" r="75" fill="#881337" stroke="#f43f5e" strokeWidth="2.5" filter="url(#glow-rose-uhi)" opacity="0.95" />
            <circle cx="0" cy="0" r="66" fill="#4c0519" stroke="#fb7185" strokeWidth="1" strokeDasharray="4 4" />

            <text x="0" y="-38" fill="#fda4af" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              ISLA DE CALOR (UHI)
            </text>
            <text x="0" y="-12" fill="#ffffff" fontSize="24" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              +{deltaTUhi}°C
            </text>
            <text x="0" y="4" fill="#fecdd3" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              ΔT MÁLAGA-RURAL
            </text>

            <line x1="-45" y1="12" x2="45" y2="12" stroke="#e11d48" strokeWidth="1" />

            <text x="0" y="26" fill="#fed7aa" fontSize="8" textAnchor="middle" fontFamily="monospace">
              Urb: {tempUrbanC}°C
            </text>
            <text x="0" y="38" fill="#bae6fd" fontSize="8" textAnchor="middle" fontFamily="monospace">
              Rur: {tempRuralC}°C
            </text>
            <text x="0" y="50" fill="#a7f3d0" fontSize="7" textAnchor="middle" fontFamily="monospace">
              {isNightMode ? "🌙 INVERSIÓN NOCTURNA" : "☀ RADIACIÓN MÁXIMA"}
            </text>
          </g>
        </svg>
      </div>

      {/* SCIENTIFIC METRICS FOOTER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
        <ScientificTooltip topic="canyon_vortex_recirculation" position="top" width="w-[280px]" content="Intensidad de la Isla de Calor Urbana: Diferencia térmica neta ΔT entre el tejido denso de Málaga y el entorno rural periférico (Montes de Málaga / Campanillas).">
          <div className="p-2 bg-slate-950/80 border border-slate-800 rounded cursor-help hover:border-rose-500/50 transition-colors">
            <span className="text-[9px] text-slate-400 block">INTENSIDAD UHI (ΔT)</span>
            <strong className="text-rose-400 text-sm">+{deltaTUhi}°C</strong>
          </div>
        </ScientificTooltip>

        <ScientificTooltip topic="canyon_vortex_recirculation" position="top" width="w-[280px]" content="Calor antropogénico residual Qf: Emisión térmica directa procedente de motores de combustión del tráfico rodado y condensadoras de climatización urbana.">
          <div className="p-2 bg-slate-950/80 border border-slate-800 rounded cursor-help hover:border-amber-500/50 transition-colors">
            <span className="text-[9px] text-slate-400 block">CALOR ANTROPOGÉNICO Qf</span>
            <strong className="text-amber-400 text-sm">{Q_anthro} W/m²</strong>
          </div>
        </ScientificTooltip>

        <ScientificTooltip topic="canyon_vortex_recirculation" position="top" width="w-[300px]" content="Flujo de calor latente Qe (Evapotranspiración): Transferencia térmica por cambio de fase del agua. La impermeabilización asfáltica induce un déficit de refrigeración natural que agrava el sobrecalentamiento.">
          <div className="p-2 bg-slate-950/80 border border-slate-800 rounded cursor-help hover:border-cyan-500/50 transition-colors">
            <span className="text-[9px] text-slate-400 block">ENFRIAMIENTO EVAPORATIVO</span>
            <strong className="text-cyan-400 text-sm">{Q_latent} W/m² (Déficit urbano)</strong>
          </div>
        </ScientificTooltip>

        <ScientificTooltip topic="canyon_vortex_recirculation" position="top" width="w-[280px]" content="Régimen térmico microclimático: Cúpula convectiva urbana generada por el ascenso de aire cálido sobre el centro de la ciudad y subsidencia perimetral, favoreciendo la recirculación de contaminantes.">
          <div className="p-2 bg-slate-950/80 border border-slate-800 rounded cursor-help hover:border-rose-400/50 transition-colors">
            <span className="text-[9px] text-slate-400 block">RÉGIMEN TÉRMICO</span>
            <strong className="text-rose-300 text-sm">CÚPULA CONVECTIVA</strong>
          </div>
        </ScientificTooltip>
      </div>
    </div>
  );
};
