import React, { useState, useMemo } from 'react';
import { Wind, Thermometer, Sun, Moon, Zap, Activity, Download, Compass, ShieldCheck } from 'lucide-react';
import { downloadVectorSvg } from '../lib/vectorExporter';
import { ScientificTooltip } from './ScientificTooltip';

export interface MoninObukhovDiagramProps {
  windSpeedMs: number;
  solarRadWm2: number;
  airTempC: number;
  isNight?: boolean;
  roughnessZ0?: number;
  onClose?: () => void;
}

export const MoninObukhovTurbulenceDiagram: React.FC<MoninObukhovDiagramProps> = ({
  windSpeedMs,
  solarRadWm2,
  airTempC,
  isNight: initialNight = false,
  roughnessZ0 = 0.8,
  onClose
}) => {
  const [isNight, setIsNight] = useState<boolean>(initialNight);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  // 1. CÁLCULO ANALÍTICO DE TURBULENCIA MICROMETEOROLÓGICA (MONIN-OBUKHOV 1954)
  const kappa = 0.40; // Constante de Von Kármán
  const g = 9.81; // Aceleración gravitatoria (m/s²)
  const T_kelvin = airTempC + 273.15;
  const rho_cp = 1200; // Calor volumétrico del aire (J/(m³·K))

  // Flujo de calor sensible H (W/m²)
  const H_sensible = useMemo(() => {
    if (isNight) return -25.0; // Enfriamiento radiativo nocturno
    return Math.max(10, solarRadWm2 * 0.35); // Fracción convectiva diurna
  }, [isNight, solarRadWm2]);

  // Velocidad de fricción u* (m/s)
  const ustar = useMemo(() => {
    const u = Math.max(0.4, windSpeedMs);
    const z_ref = 10.0;
    const u_star = (u * kappa) / Math.log(z_ref / roughnessZ0);
    return Math.max(0.08, parseFloat(u_star.toFixed(3)));
  }, [windSpeedMs, roughnessZ0]);

  // Longitud de Obukhov L = -(u*³ · T) / (κ · g · (H / ρ·cp))
  const ObukhovLength = useMemo(() => {
    const denom = kappa * (g / T_kelvin) * (H_sensible / rho_cp);
    if (Math.abs(denom) < 1e-6) return 9999;
    const L = -Math.pow(ustar, 3) / denom;
    return parseFloat(L.toFixed(1));
  }, [ustar, T_kelvin, H_sensible]);

  // Parámetro de estabilidad zeta = z / L (a z = 10m)
  const zeta = parseFloat((10.0 / ObukhovLength).toFixed(3));

  // Clasificación de estabilidad
  const stabilityState = useMemo(() => {
    if (zeta < -0.5) return { name: 'FUERTEMENTE INESTABLE', pasquill: 'A', color: 'text-amber-400', stroke: '#f59e0b', desc: 'Convección térmica dominante sobre la cizalla mecánica. Grandes plumas térmicas ascendentes.' };
    if (zeta < -0.1) return { name: 'MODERADAMENTE INESTABLE', pasquill: 'B/C', color: 'text-yellow-300', stroke: '#eab308', desc: 'Convección y cizalla en interacción acoplada. Torbellinos turbulentos de gran escala.' };
    if (Math.abs(zeta) <= 0.1) return { name: 'NEUTRO (CIZALLA PURA)', pasquill: 'D', color: 'text-cyan-400', stroke: '#06b6d4', desc: 'Mecánicamente dominado por la fricción del viento con los edificios de Málaga. Vórtices de rodillo.' };
    if (zeta <= 0.5) return { name: 'MODERADAMENTE ESTABLE', pasquill: 'E', color: 'text-indigo-300', stroke: '#818cf8', desc: 'Estratificación térmica amortigua los torbellinos verticales. Flujo cuasi-laminar.' };
    return { name: 'FUERTEMENTE ESTABLE', pasquill: 'F', color: 'text-purple-400', stroke: '#a855f7', desc: 'Inversión térmica superficial. Turbulencia casi suprimida, acumulación crítica de NOx.' };
  }, [zeta]);

  // Tasa de disipación de energía cinética turbulenta epsilon = u*³ / (kappa * z)
  const epsilon_z10 = parseFloat((Math.pow(ustar, 3) / (kappa * 10.0)).toFixed(5));

  const handleExportSvg = () => {
    downloadVectorSvg('monin-obukhov-svg', `turbulencia_monin_obukhov_${stabilityState.pasquill}_malaga.svg`);
  };

  return (
    <div className="flex flex-col gap-3 bg-[#0a0f18] text-slate-200 p-3 rounded border border-cyan-900/60 shadow-2xl">
      {/* HEADER CONTROL BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-2 border border-slate-800 rounded">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-cyan-300">
            TURBULENCIA Y CAPA SUPERFICIAL DE MONIN-OBUKHOV (1954)
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          <ScientificTooltip topic="monin_obukhov_stability" position="bottom" width="w-[300px]" content="Conmuta entre el régimen diurno dominado por radiación solar (flujo de calor sensible H > 0, inestabilidad convectiva) y el régimen nocturno por enfriamiento radiativo infrarrojo (H < 0, inversión térmica y amortiguamiento turbulento).">
            <button
              onClick={() => setIsNight(!isNight)}
              className={`px-2 py-0.5 border font-bold flex items-center gap-1 transition-all ${
                isNight
                  ? 'bg-indigo-950 border-indigo-500 text-indigo-200 shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                  : 'bg-amber-950 border-amber-500 text-amber-200'
              }`}
            >
              {isNight ? <Moon className="w-3 h-3 text-indigo-400" /> : <Sun className="w-3 h-3 text-amber-400" />}
              <span>{isNight ? 'RÉGIMEN NOCTURNO' : 'RÉGIMEN DIURNO'}</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip topic="monin_obukhov_stability" position="bottom" width="w-[260px]" content="Exportar diagrama analítico de turbulencia de Monin-Obukhov en formato vectorial SVG para publicación científica o reporte técnico de dispersión.">
            <button
              onClick={handleExportSvg}
              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded flex items-center gap-1 text-[10px] transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>SVG</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {/* SVG DIAGRAM CANVAS */}
      <div className="relative w-full bg-[#020617] border border-slate-800 rounded overflow-hidden">
        <svg
          id="monin-obukhov-svg"
          viewBox="0 0 740 390"
          className="w-full h-auto select-none"
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes rotateCW {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes rotateCCW {
              from { transform: rotate(0deg); }
              to { transform: rotate(-360deg); }
            }
            @keyframes thermalRise {
              0% { transform: translateY(0) scale(0.9); opacity: 0.8; }
              50% { transform: translateY(-40px) scale(1.1); opacity: 1; }
              100% { transform: translateY(-80px) scale(1.3); opacity: 0.1; }
            }
            @keyframes windFlow {
              from { stroke-dashoffset: 40; }
              to { stroke-dashoffset: 0; }
            }
            .eddy-cw { transform-origin: center; animation: rotateCW 3s linear infinite; }
            .eddy-ccw { transform-origin: center; animation: rotateCCW 2.5s linear infinite; }
            .eddy-cw-fast { transform-origin: center; animation: rotateCW 1.5s linear infinite; }
            .wind-stream { stroke-dasharray: 6 6; animation: windFlow 1.5s linear infinite; }
          `}} />

          <defs>
            <radialGradient id="mo-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#082f49" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#020617" stopOpacity="1" />
            </radialGradient>

            <linearGradient id="grad-buoyancy" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
            </linearGradient>

            {/* Glowing filters */}
            <filter id="glow-c"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="glow-y"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="glow-p"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>

            <marker id="arrow-blue-mo" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Background grid */}
          <rect width="100%" height="100%" fill="url(#mo-bg)" />
          <pattern id="mo-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1e293b" strokeWidth="0.4" strokeOpacity="0.4" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#mo-grid)" />

          {/* WIND VELOCITY SHEAR STREAMLINES u(z) */}
          <g transform="translate(60, 0)">
            <path d="M 0 60 Q 220 50 480 60" fill="none" stroke="#38bdf8" strokeWidth="3" className="wind-stream" markerEnd="url(#arrow-blue-mo)" filter="url(#glow-c)" />
            <text x="495" y="64" fill="#7dd3fc" fontSize="9" fontWeight="bold" fontFamily="monospace">u(z=30m) = {(windSpeedMs * 1.35).toFixed(1)} m/s</text>

            <path d="M 0 130 Q 220 120 480 130" fill="none" stroke="#0ea5e9" strokeWidth="2.5" className="wind-stream" markerEnd="url(#arrow-blue-mo)" />
            <text x="495" y="134" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace">u(z=10m) = {windSpeedMs.toFixed(1)} m/s</text>

            <path d="M 0 210 Q 220 200 480 210" fill="none" stroke="#0284c7" strokeWidth="2" className="wind-stream" markerEnd="url(#arrow-blue-mo)" />
            <text x="495" y="214" fill="#0284c7" fontSize="9" fontWeight="bold" fontFamily="monospace">u(z=3m) = {(windSpeedMs * 0.65).toFixed(1)} m/s</text>
          </g>

          {/* TURBULENT EDDIES (ROLL VORTICES & CONVECTIVE CELLS) */}
          <g transform="translate(180, 160)">
            {/* Main Eddy 1 */}
            <g
              className="cursor-pointer"
              onMouseEnter={() => setHoveredElement('eddy_main')}
              onMouseLeave={() => setHoveredElement(null)}
            >
              <g className="eddy-cw">
                <circle cx="0" cy="0" r="42" fill="none" stroke={stabilityState.stroke} strokeWidth="2.5" strokeDasharray="14 10" filter="url(#glow-c)" />
                <circle cx="0" cy="0" r="26" fill="none" stroke={stabilityState.stroke} strokeWidth="1.5" strokeDasharray="8 6" opacity="0.8" />
                <polygon points="42 0, 36 -6, 48 -6" fill={stabilityState.stroke} />
                <polygon points="-42 0, -48 6, -36 6" fill={stabilityState.stroke} />
              </g>
              <circle cx="0" cy="0" r="10" fill="#0f172a" stroke={stabilityState.stroke} strokeWidth="1.5" />
              <text x="0" y="3" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">τ_xy</text>
            </g>
          </g>

          {/* Eddy 2 (Counter-Rotating) */}
          <g transform="translate(300, 175)">
            <g className="eddy-ccw">
              <circle cx="0" cy="0" r="32" fill="none" stroke={stabilityState.stroke} strokeWidth="2" strokeDasharray="10 8" opacity="0.85" />
              <circle cx="0" cy="0" r="18" fill="none" stroke={stabilityState.stroke} strokeWidth="1.2" strokeDasharray="6 4" opacity="0.6" />
              <polygon points="0 32, -6 26, -6 38" fill={stabilityState.stroke} />
              <polygon points="0 -32, 6 -26, 6 -38" fill={stabilityState.stroke} />
            </g>
          </g>

          {/* Eddy 3 (Smaller High-Frequency Dissipation) */}
          <g transform="translate(400, 150)">
            <g className="eddy-cw-fast">
              <circle cx="0" cy="0" r="22" fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeDasharray="7 5" opacity="0.9" />
              <polygon points="22 0, 18 -4, 26 -4" fill="#22d3ee" />
            </g>
          </g>

          {/* BUOYANT CONVECTIVE PLUMES (If daytime / unstable) */}
          {!isNight && (
            <g transform="translate(100, 270)">
              <path d="M 0 0 Q -10 -35 0 -70" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="4 4" className="wind-stream" />
              <polygon points="0 -72, -4 -64, 4 -64" fill="#f59e0b" />
              <text x="0" y="14" fill="#fcd34d" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                FLUX CALOR H &gt; 0
              </text>
            </g>
          )}

          {/* URBAN GROUND PROFILE (z = 0 m to z = z0) */}
          <g transform="translate(60, 300)">
            <line x1="0" y1="0" x2="480" y2="0" stroke="#334155" strokeWidth="2" />
            {/* Zero plane displacement d and roughness z0 band */}
            <rect x="0" y="-12" width="480" height="12" fill="#1e293b" opacity="0.5" />
            <text x="240" y="-3" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">
              DOSÉL URBANO (z₀ = {roughnessZ0}m · d = 2.4m) · C/ LARIOS Y ALAMEDA
            </text>

            {/* Buildings */}
            <rect x="30" y="-40" width="28" height="40" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
            <rect x="70" y="-55" width="36" height="55" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
            <rect x="200" y="-48" width="32" height="48" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
            <rect x="330" y="-60" width="40" height="60" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
            <rect x="420" y="-38" width="30" height="38" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
          </g>

          {/* HUD CORE: LONGITUD DE OBUKHOV L & ESTABILIDAD */}
          <g transform="translate(620, 185)">
            <circle cx="0" cy="0" r="90" fill="#0f172a" stroke={stabilityState.stroke} strokeWidth="2.5" filter="url(#glow-c)" opacity="0.95" />
            <circle cx="0" cy="0" r="78" fill="#082f49" stroke={stabilityState.stroke} strokeWidth="1" strokeDasharray="4 4" />

            <text x="0" y="-48" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              ESTABILIDAD PASQUILL
            </text>
            <text x="0" y="-20" fill="#ffffff" fontSize="28" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              CLASE {stabilityState.pasquill}
            </text>
            <text x="0" y="-4" fill={stabilityState.stroke} fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {stabilityState.name.split(' ')[0]}
            </text>

            <line x1="-55" y1="8" x2="55" y2="8" stroke="#334155" strokeWidth="1" />

            <text x="0" y="24" fill="#7dd3fc" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              L = {Math.abs(ObukhovLength) > 5000 ? '∞ (Neutro)' : `${ObukhovLength} m`}
            </text>
            <text x="0" y="38" fill="#cbd5e1" fontSize="9" textAnchor="middle" fontFamily="monospace">
              u* = {ustar.toFixed(3)} m/s
            </text>
            <text x="0" y="52" fill="#38bdf8" fontSize="9" textAnchor="middle" fontFamily="monospace">
              ζ (z/L) = {zeta.toFixed(3)}
            </text>
            <text x="0" y="66" fill="#fcd34d" fontSize="8" textAnchor="middle" fontFamily="monospace">
              H = {H_sensible.toFixed(1)} W/m²
            </text>
          </g>

          {/* EQUATION BANNER */}
          <g transform="translate(620, 345)">
            <rect x="-100" y="-18" width="200" height="36" rx="4" fill="#020617" stroke="#334155" strokeWidth="1" />
            <text x="0" y="-4" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
              L = -u*³·T / (κ·g·H/ρ·cp)
            </text>
            <text x="0" y="9" fill="#38bdf8" fontSize="8" textAnchor="middle" fontFamily="monospace">
              ε = u*³ / (κ·z) = {epsilon_z10} m²/s³
            </text>
          </g>
        </svg>

        {/* FLOATING HOVER DETAILS */}
        {hoveredElement && (
          <div className="absolute top-3 left-16 max-w-sm bg-slate-900/95 border border-cyan-500/80 rounded p-2 text-xs font-mono text-slate-200 shadow-2xl backdrop-blur-md">
            <span className="font-bold text-cyan-400">Torbellino Convectivo-Mecánico (Eddy):</span>
            <p className="text-[10px] text-slate-300 mt-1">
              Estructura coherente de vorticidad que transporta momentum vertical y dispersa el penacho de contaminación. La velocidad de disipación viscosa en la cascada de Kolmogorov es ε = {epsilon_z10} m²/s³.
            </p>
          </div>
        )}
      </div>

      {/* SCIENTIFIC METRICS FOOTER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
        <ScientificTooltip topic="monin_obukhov_stability" position="top" width="w-[280px]" content="Velocidad de fricción u* = (u · κ) / ln(z/z₀): Escala de velocidad que caracteriza la tensión de cizalla del viento (shear stress) sobre la rugosidad aerodinámica de los edificios de Málaga.">
          <div className="p-2 bg-slate-950/80 border border-slate-800 rounded cursor-help hover:border-cyan-500/50 transition-colors">
            <span className="text-[9px] text-slate-400 block">VELOCIDAD FRICCIÓN u*</span>
            <strong className="text-cyan-400 text-sm">{ustar.toFixed(3)} m/s</strong>
          </div>
        </ScientificTooltip>

        <ScientificTooltip topic="monin_obukhov_stability" position="top" width="w-[300px]" content="Longitud de Obukhov L = -(u*³ · T) / (κ · g · (H / ρ·cp)): Altura a la cual la producción de energía cinética turbulenta por flotabilidad convectiva iguala a la producción por cizalla mecánica. L < 0 inestable, L > 0 estable.">
          <div className="p-2 bg-slate-950/80 border border-slate-800 rounded cursor-help hover:border-emerald-500/50 transition-colors">
            <span className="text-[9px] text-slate-400 block">LONGITUD OBUKHOV L</span>
            <strong className="text-emerald-400 text-sm">{Math.abs(ObukhovLength) > 5000 ? '∞' : `${ObukhovLength} m`}</strong>
          </div>
        </ScientificTooltip>

        <ScientificTooltip topic="monin_obukhov_stability" position="top" width="w-[280px]" content="Flujo de calor sensible turbulento H (W/m²): Tasa de transferencia de calor vertical por convección entre el asfalto/edificios de Málaga y la capa límite superficial.">
          <div className="p-2 bg-slate-950/80 border border-slate-800 rounded cursor-help hover:border-amber-500/50 transition-colors">
            <span className="text-[9px] text-slate-400 block">FLUJO CALOR SENSIBLE H</span>
            <strong className="text-amber-400 text-sm">{H_sensible.toFixed(1)} W/m²</strong>
          </div>
        </ScientificTooltip>

        <ScientificTooltip topic="monin_obukhov_stability" position="top" width="w-[300px]" content="Clasificación de estabilidad atmosférica Pasquill-Gifford-Turner derivada determinísticamente del parámetro ζ = z/L. La clase A/B indica dispersión vertical acelerada, D neutra y E/F estancamiento con acumulación de NOx.">
          <div className="p-2 bg-slate-950/80 border border-slate-800 rounded cursor-help hover:border-purple-500/50 transition-colors">
            <span className="text-[9px] text-slate-400 block">PASQUILL-GIFFORD</span>
            <strong className="text-purple-400 text-sm">CLASE {stabilityState.pasquill}</strong>
          </div>
        </ScientificTooltip>
      </div>
    </div>
  );
};
