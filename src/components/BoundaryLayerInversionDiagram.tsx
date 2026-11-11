import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Layers, Wind, Thermometer, ShieldAlert, ArrowUp, Sparkles, Activity, Sun, Moon } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';

export interface BoundaryLayerInversionDiagramProps {
  hPBL?: number;
  stability?: 'Unstable' | 'Neutral' | 'Stable';
  surfaceTemp?: number;
  inversionStrength?: number;
  surfaceConcentration?: number;
}

export const BoundaryLayerInversionDiagram: React.FC<BoundaryLayerInversionDiagramProps> = ({
  hPBL = 850,
  stability = 'Unstable',
  surfaceTemp = 24.5,
  inversionStrength = 2.5,
  surfaceConcentration = 48
}) => {
  // SVG Dimensions: 620 x 360
  const width = 620;
  const height = 360;
  const groundY = 310;
  const topY = 40;

  // Normalized PBL height position: 150m to 1400m -> Y between 260 and 70
  const pblY = useMemo(() => {
    const clampedH = Math.max(150, Math.min(1400, hPBL));
    const factor = (clampedH - 150) / (1400 - 150);
    return 260 - factor * (260 - 70);
  }, [hPBL]);

  // Color scheme based on atmospheric stability
  const stabilityConfig = useMemo(() => {
    switch (stability) {
      case 'Stable':
        return {
          label: 'Atmósfera Estable / Inversión Térmica Fuerte (dT/dz > 0)',
          badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-600',
          gradientColor: '#f43f5e',
          pblLabel: 'Inversión Radiativa Nocturna / Subsidencia',
          trappingIntensity: 0.85,
          entrainmentFlux: '-0.05 K·m/s'
        };
      case 'Neutral':
        return {
          label: 'Atmósfera Neutra / Cizalla Mecánica Dominante',
          badgeColor: 'bg-sky-950/80 text-sky-300 border-sky-600',
          gradientColor: '#38bdf8',
          pblLabel: 'Capa Límite Mecánica (Cizalla de Viento)',
          trappingIntensity: 0.55,
          entrainmentFlux: '-0.12 K·m/s'
        };
      case 'Unstable':
      default:
        return {
          label: 'Atmósfera Convectiva Inestable / Mezcla Diurna Vigorosa',
          badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-600',
          gradientColor: '#f59e0b',
          pblLabel: 'Capa de Mezcla Convectiva (Convective Boundary Layer)',
          trappingIntensity: 0.35,
          entrainmentFlux: '-0.20 K·m/s (Deardorff 1970)'
        };
    }
  }, [stability]);

  // Generate dynamic thermal lapse rate line points (T(z))
  const lapseRatePath = useMemo(() => {
    const xBase = 520;
    const xPbl = stability === 'Stable' ? xBase - 15 : xBase - 45;
    const xInversionTop = stability === 'Stable' ? xPbl + 40 : xPbl + (inversionStrength * 10);
    const xFreeTropo = xInversionTop - 25;

    return `M ${xBase} ${groundY} L ${xPbl} ${pblY} L ${xInversionTop} ${Math.max(topY, pblY - 35)} L ${xFreeTropo} ${topY}`;
  }, [groundY, pblY, topY, stability, inversionStrength]);

  return (
    <div className="w-full bg-[#020617] border border-slate-800 rounded-xl p-3 relative overflow-hidden space-y-3 font-sans shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30">
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              Estructura Vertical de la Capa Límite Planetaria (PBLH) &amp; Tapa de Inversión
            </h4>
            <p className="text-[9.5px] text-slate-400">
              Teoría de similitud de Monin-Obukhov • Entrainment de Deardorff • Topografía Litoral de Málaga
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ScientificTooltip topic="monin_obukhov_stability"
            position="bottom"
            width="w-[320px]"
            content="Clasificación de estabilidad estática atmosférica gobernada por el flujo superficial de calor sensible y la cizalla eólica de rugosidad en cañones urbanos."
          >
            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded border ${stabilityConfig.badgeColor}`}>
              {stabilityConfig.label}
            </span>
          </ScientificTooltip>
        </div>
      </div>

      {/* Main SVG Vector Canvas */}
      <div className="relative w-full overflow-hidden bg-slate-950/80 rounded-lg border border-slate-800/60">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          id="boundary-layer-inversion-svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="pblMixGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={stabilityConfig.trappingIntensity * 0.4} />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity={stabilityConfig.trappingIntensity * 0.25} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
            </linearGradient>

            <linearGradient id="inversionCapGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="seaBreezeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
            </linearGradient>

            <filter id="glowCap" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Background Grid & Vertical Scale */}
          <rect x="0" y="0" width={width} height={height} fill="#020617" />
          
          {/* Vertical Height Scale on Left */}
          <line x1="45" y1={topY} x2="45" y2={groundY} stroke="#334155" strokeWidth="1.5" />
          {[1400, 1000, 800, 500, 250, 0].map((alt) => {
            const y = alt === 0 ? groundY : 260 - ((alt - 150) / (1400 - 150)) * (260 - 70);
            return (
              <g key={alt}>
                <line x1="40" y1={y} x2="48" y2={y} stroke="#64748b" strokeWidth="1" />
                <text x="35" y={y + 3} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="end">
                  {alt}m
                </text>
                <line x1="50" y1={y} x2="580" y2={y} stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
              </g>
            );
          })}

          {/* 2. Boundary Layer Mixing Volume (Below PBL Height) */}
          <rect
            x="50"
            y={pblY}
            width="530"
            height={groundY - pblY}
            fill="url(#pblMixGrad)"
          />

          {/* 3. Convective Thermals / Updraft Plumes (Rising Eddy Loops) */}
          {stability === 'Unstable' && (
            <g opacity="0.6">
              {[120, 220, 320, 420].map((xPos, idx) => (
                <g key={idx}>
                  <path
                    d={`M ${xPos} ${groundY} C ${xPos - 15} ${(groundY + pblY) / 2}, ${xPos + 20} ${(groundY + pblY) / 2 - 20}, ${xPos} ${pblY + 10}`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                  />
                  <polygon
                    points={`${xPos},${pblY + 5} ${xPos - 4},${pblY + 14} ${xPos + 4},${pblY + 14}`}
                    fill="#f59e0b"
                  />
                </g>
              ))}
            </g>
          )}

          {/* 4. Inversion Cap Barrier Line with Entrainment Zone */}
          <rect
            x="50"
            y={pblY - 8}
            width="530"
            height="16"
            fill="url(#inversionCapGrad)"
            opacity="0.18"
          />
          <line
            x1="50"
            y1={pblY}
            x2="580"
            y2={pblY}
            stroke="#f43f5e"
            strokeWidth="2.5"
            strokeDasharray="8 4"
            filter="url(#glowCap)"
          />

          {/* Inversion Cap Banner */}
          <g transform={`translate(220, ${pblY - 14})`}>
            <rect x="-10" y="-8" width="220" height="16" rx="3" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1" />
            <text x="100" y="3.5" fill="#c7d2fe" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              TAPA DE INVERSIÓN (zᵢ = {hPBL} m)
            </text>
          </g>

          {/* 5. Free Troposphere Above Cap */}
          <text x="290" y={Math.max(topY + 15, pblY - 30)} fill="#94a3b8" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
            Troposfera Libre • Flujo Geostrófico Estratificado (K_z ≈ 0.1 m²/s)
          </text>

          {/* 6. Topography & Urban Skyline (Málaga, Bahía & Montes) */}
          {/* Ground Surface */}
          <line x1="50" y1={groundY} x2="580" y2={groundY} stroke="#475569" strokeWidth="2" />

          {/* Sea on West (Bahía de Málaga) */}
          <path
            d={`M 50 ${groundY} L 120 ${groundY} Q 100 ${groundY + 15} 50 ${groundY + 15} Z`}
            fill="url(#seaBreezeGrad)"
          />
          <text x="80" y={groundY + 18} fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle">
            Bahía de Málaga
          </text>

          {/* City Buildings (Canopy Layer z ≤ 25m) */}
          <g fill="#1e293b" stroke="#334155" strokeWidth="1">
            <rect x="140" y={groundY - 26} width="24" height="26" rx="1" />
            <rect x="170" y={groundY - 38} width="30" height="38" rx="1" />
            <rect x="205" y={groundY - 22} width="20" height="22" rx="1" />
            <rect x="235" y={groundY - 34} width="28" height="34" rx="1" />
            <rect x="270" y={groundY - 45} width="32" height="45" rx="1" />
            <rect x="310" y={groundY - 30} width="22" height="30" rx="1" />
            <rect x="340" y={groundY - 28} width="26" height="28" rx="1" />
            <rect x="375" y={groundY - 36} width="30" height="36" rx="1" />
          </g>
          <text x="260" y={groundY + 18} fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">
            Cañones Urbanos (Centro / Carretera de Cádiz)
          </text>

          {/* Mountain Ridge on East (Montes de Málaga ~ 1031m) */}
          <path
            d={`M 440 ${groundY} Q 500 ${groundY - 140} 560 ${groundY - 170} L 580 ${groundY - 170} L 580 ${groundY} Z`}
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1.2"
          />
          <text x="520" y={groundY - 110} fill="#cbd5e1" fontSize="8" fontWeight="bold" textAnchor="middle">
            Montes de Málaga
          </text>
          <text x="520" y={groundY - 100} fill="#64748b" fontSize="7" textAnchor="middle">
            (Bloqueo Orográfico)
          </text>

          {/* 7. Trapped Traffic Emissions Plume */}
          <g opacity={stabilityConfig.trappingIntensity}>
            <ellipse cx="270" cy={groundY - 15} rx="85" ry="14" fill="#ef4444" opacity="0.3" />
            <ellipse cx="270" cy={groundY - 45} rx="120" ry="24" fill="#f59e0b" opacity="0.2" />
            <text x="270" y={groundY - 8} fill="#fee2e2" fontSize="7.5" fontWeight="bold" textAnchor="middle">
              Emisión Vehicular NOₓ + PM₂.₅ ({surfaceConcentration} µg/m³)
            </text>
          </g>

          {/* 8. Temperature Lapse Rate Curve T(z) & Legend */}
          <g>
            <path
              d={lapseRatePath}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Legend label for curve */}
            <g transform="translate(480, 50)">
              <rect width="90" height="22" rx="3" fill="#0f172a" stroke="#ef4444" strokeWidth="1" opacity="0.9" />
              <text x="45" y="10" fill="#ef4444" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                Perfil T(z)
              </text>
              <text x="45" y="18" fill="#cbd5e1" fontSize="6.5" textAnchor="middle">
                Inversión: +{inversionStrength} K/100m
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Numerical Synthesis Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9.5px] font-mono bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
        <ScientificTooltip
          position="top"
          title="Altura de la Capa Límite Planetaria (z_i / h_PBL)"
          formula="z_i : \text{Ri}_b(z_i) = \frac{g/\theta_v \, (\theta_v(z_i) - \theta_{v0}) \, z_i}{u(z_i)^2} = \text{Ri}_{cr} \approx 0.25"
          explanation="Espesor efectivo de dilución vertical turbulenta sobre la hoya de Málaga antes de encontrar la tapadera de inversión por subsidencia."
          normativeRef="Stull (1988) Boundary Layer Meteorology / ERA5-Land"
        >
          <div className="cursor-help">
            <span className="text-slate-400 block">Tope Capa Mezcla:</span>
            <span className="text-cyan-400 font-bold text-xs">{hPBL} metros</span>
          </div>
        </ScientificTooltip>

        <ScientificTooltip
          position="top"
          title="Temperatura Superficial del Aire (T_{2m})"
          formula="\theta_0 = T_{2\text{m}} \left(\frac{P_0}{P}\right)^{R_d/c_p}"
          explanation="Determina el flujo de calor sensible superficial H₀ que alimenta la flotabilidad convectiva diurna o el enfriamiento radiativo nocturno."
          normativeRef="AEMET / OMM (WMO) Observación Sinóptica"
        >
          <div className="cursor-help">
            <span className="text-slate-400 block">Temperatura Superficial:</span>
            <span className="text-amber-400 font-bold text-xs">{surfaceTemp.toFixed(1)} °C</span>
          </div>
        </ScientificTooltip>

        <ScientificTooltip
          position="top"
          title="Gradiente Térmico de Inversión en la Cima (∂T/∂z > 0)"
          formula="\Gamma_{\text{inv}} = +\frac{\Delta T}{\Delta z} > 0 \implies N^2 = \frac{g}{\theta}\frac{\partial \theta}{\partial z} \gg 0"
          explanation="Frecuencia de Brunt-Väisälä positiva que suprime el transporte turbulento vertical (K_z → 0.1 m²/s), confinando los contaminantes emitidos bajo la tapa."
          normativeRef="Termodinámica Atmosférica / Estabilidad de Pasquill"
        >
          <div className="cursor-help">
            <span className="text-slate-400 block">Fuerza de la Tapa:</span>
            <span className="text-rose-400 font-bold text-xs">+{inversionStrength.toFixed(1)} K/100m</span>
          </div>
        </ScientificTooltip>

        <ScientificTooltip
          position="top"
          title="Velocidad de Entrainment en la Interfase (w_e)"
          formula="w_e = \frac{\partial z_i}{\partial t} - w_L(z_i) \approx \frac{0.2 \, \overline{(w'\theta_v')}_0}{\Delta \theta_v}"
          explanation="Tasa de incorporación de aire limpio desde la troposfera libre hacia el interior de la capa de mezcla urbana."
          normativeRef="Deardorff (1979) / Cierre de Entrainment PBL"
        >
          <div className="cursor-help">
            <span className="text-slate-400 block">Flujo de Entrainment:</span>
            <span className="text-emerald-400 font-bold text-xs">{stabilityConfig.entrainmentFlux}</span>
          </div>
        </ScientificTooltip>
      </div>
    </div>
  );
};
