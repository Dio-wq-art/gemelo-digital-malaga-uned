import React from 'react';
import { motion } from 'motion/react';
import { Trees, Leaf, Building2, Wind, Sun, ArrowDownRight, Droplets, Zap, ShieldCheck } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';

export interface UrbanGreenInfrastructureDiagramProps {
  quadrantName?: string;
  no2Baseline?: number;
  no2Mitigated?: number;
  totalGreenAreaM2?: number;
  weightedVd?: number;
  annualRemovalKg?: number;
  laiMean?: number;
  windSpeed?: number;
  parWm2?: number;
}

export const UrbanGreenInfrastructureDiagram: React.FC<UrbanGreenInfrastructureDiagramProps> = ({
  quadrantName = 'Centro Histórico - Alameda',
  no2Baseline = 42.8,
  no2Mitigated = 36.2,
  totalGreenAreaM2 = 14200,
  weightedVd = 0.58,
  annualRemovalKg = 485,
  laiMean = 3.8,
  windSpeed = 3.2,
  parWm2 = 450
}) => {
  const width = 620;
  const height = 260;

  const deltaNO2 = Math.max(0, no2Baseline - no2Mitigated);
  const efficiencyPct = ((deltaNO2 / Math.max(1, no2Baseline)) * 100).toFixed(1);

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-xl p-3 space-y-2.5 font-sans shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30">
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              Filtro Biológico: Cubiertas Vegetales, Fachadas Vivas &amp; Arbolado Viario
            </h4>
            <p className="text-[9.5px] text-slate-400">
              Sector: {quadrantName} • Sumidero de NO₂ y PM₂.₅ (Modelo Wesely 1989 / Pugh et al. 2012)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ScientificTooltip topic="wesely_dry_deposition"
            position="bottom"
            width="w-[300px]"
            content="Abatimiento de dióxido de nitrógeno por deposición seca sobre superficies vegetales: Delta NO2 = -F_d · A_veg / (W · H · U)."
          >
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-emerald-950/80 text-emerald-300 border-emerald-700 flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
              Eficacia Biofiltrante: -{efficiencyPct}% NO₂ (-{deltaNO2.toFixed(1)} µg/m³)
            </span>
          </ScientificTooltip>
        </div>
      </div>

      {/* Main SVG Vector Canvas */}
      <div className="relative w-full overflow-hidden bg-slate-900/70 rounded-lg border border-slate-800/60">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          id="urban-green-infra-svg"
        >
          <defs>
            {/* Sky / Air Gradient */}
            <linearGradient id="skyAtmosphere" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#0284c7" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.9" />
            </linearGradient>

            {/* Pollution Plume Gradient */}
            <linearGradient id="pollutionPlume" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
            </linearGradient>

            {/* Vegetal Foliage Texture Pattern */}
            <pattern id="sedumPattern" width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1.8" fill="#10b981" opacity="0.8" />
              <circle cx="0" cy="0" r="1.2" fill="#059669" opacity="0.6" />
            </pattern>

            <filter id="bioGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Sky */}
          <rect x="0" y="0" width={width} height={height} fill="url(#skyAtmosphere)" />

          {/* Grid lines */}
          {[40, 90, 140, 190, 230].map(y => (
            <line key={`y-${y}`} x1="20" y1={y} x2="600" y2={y} stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
          ))}

          {/* Solar Flux / PAR Radiation Rays */}
          <g transform="translate(480, 20)">
            <circle cx="0" cy="0" r="14" fill="#fbbf24" opacity="0.85" filter="url(#bioGlow)" />
            <line x1="-25" y1="15" x2="-65" y2="45" stroke="#fde047" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />
            <line x1="-15" y1="25" x2="-45" y2="75" stroke="#fde047" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />
            <line x1="-35" y1="5" x2="-110" y2="45" stroke="#fde047" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />
            <text x="-4" y="28" fill="#fef08a" fontSize="7" fontWeight="bold" textAnchor="middle">
              PAR {parWm2} W/m²
            </text>
          </g>

          {/* Advection Wind Flow Arrows */}
          <g transform="translate(30, 35)">
            <path d="M 0 0 L 80 0 M 70 -4 L 80 0 L 70 4" stroke="#38bdf8" strokeWidth="2" fill="none" opacity="0.8" />
            <text x="40" y="-6" fill="#38bdf8" fontSize="7.5" fontWeight="bold" textAnchor="middle">
              Viento U = {windSpeed} m/s
            </text>
          </g>

          {/* STREET CANYON BUILDINGS PROFILE */}
          {/* Ground Asphalt (Street) */}
          <rect x="0" y="225" width={width} height="35" fill="#090d16" />
          <line x1="0" y1="225" x2={width} y2="225" stroke="#334155" strokeWidth="2" />
          {/* Road markings */}
          <line x1="240" y1="242" x2="380" y2="242" stroke="#64748b" strokeWidth="2" strokeDasharray="10 8" />

          {/* Left Building: 5 Floors with Extensive Green Roof */}
          <rect x="40" y="80" width="160" height="145" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          {/* Windows */}
          {[100, 130, 160, 190].map(wy => (
            <g key={`win-l-${wy}`}>
              <rect x="60" y={wy} width="22" height="16" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
              <rect x="100" y={wy} width="22" height="16" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
              <rect x="140" y={wy} width="22" height="16" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
            </g>
          ))}

          {/* EXTENSIVE GREEN ROOF (Sedum / Suculentas) on Left Building */}
          <g transform="translate(36, 68)">
            {/* Substrate & Drainage Tray */}
            <rect x="0" y="8" width="168" height="6" rx="1" fill="#78350f" />
            {/* Vegetal Sedum Layer */}
            <rect x="0" y="0" width="168" height="8" rx="2" fill="#059669" stroke="#10b981" strokeWidth="1" />
            <rect x="0" y="0" width="168" height="8" rx="2" fill="url(#sedumPattern)" />
            {/* Deposition Sink Downward Arrows */}
            {[25, 60, 95, 130].map(ax => (
              <path key={`roof-flx-${ax}`} d={`M ${ax} -10 L ${ax} -2 M ${ax - 3} -5 L ${ax} -2 L ${ax + 3} -5`} stroke="#34d399" strokeWidth="1.5" fill="none" />
            ))}
            <text x="84" y="-12" fill="#6ee7b7" fontSize="7.5" fontWeight="bold" textAnchor="middle">
              Cubierta Vegetal (Sedum) • Vd = 0.52 cm/s
            </text>
          </g>

          {/* Right Building: 6 Floors with Living Wall / Vertical Forest */}
          <rect x="420" y="50" width="160" height="175" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          {/* Windows */}
          {[75, 105, 135, 165, 195].map(wy => (
            <g key={`win-r-${wy}`}>
              <rect x="440" y={wy} width="22" height="16" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
              <rect x="480" y={wy} width="22" height="16" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
              <rect x="520" y={wy} width="22" height="16" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
            </g>
          ))}

          {/* VERTICAL FOREST / JARDÍN VERTICAL FACHADA (Left face of right building) */}
          <g transform="translate(410, 55)">
            {/* Living wall trellis panel */}
            <rect x="0" y="0" width="10" height="165" rx="3" fill="#047857" stroke="#10b981" strokeWidth="1.2" />
            {/* Climbing foliage tufts */}
            {[15, 35, 55, 75, 95, 115, 135, 155].map(fy => (
              <g key={`foliage-${fy}`}>
                <ellipse cx="-2" cy={fy} rx="7" ry="9" fill="#10b981" opacity="0.9" />
                <ellipse cx="2" cy={fy - 2} rx="6" ry="7" fill="#34d399" opacity="0.8" />
                {/* Horizontal Uptake Vector into facade */}
                <path d={`M -18 ${fy} L -8 ${fy} M -11 ${fy - 3} L -8 ${fy} L -11 ${fy + 3}`} stroke="#6ee7b7" strokeWidth="1.2" fill="none" />
              </g>
            ))}
            <text x="-25" y="85" fill="#34d399" fontSize="7.5" fontWeight="bold" textAnchor="end" transform="rotate(-90, -25, 85)">
              Fachada Viva (Hedera / Muro Verde) • Vd = 0.64 cm/s
            </text>
          </g>

          {/* STREET LEVEL: CANOPY TREES (Jacarandas / Naranjos en Aceras) */}
          {/* Tree 1 (West Sidewalk) */}
          <g transform="translate(230, 225)">
            {/* Tree Trunk */}
            <rect x="-4" y="-55" width="8" height="55" fill="#78350f" rx="1" />
            {/* Tree Foliage Canopy */}
            <circle cx="0" cy="-65" r="28" fill="#059669" stroke="#10b981" strokeWidth="1.5" opacity="0.9" />
            <circle cx="-10" cy="-72" r="18" fill="#10b981" opacity="0.8" />
            <circle cx="10" cy="-60" r="20" fill="#34d399" opacity="0.75" />
            {/* Trapping Vortex Label */}
            <text x="0" y="-100" fill="#a7f3d0" fontSize="7" fontWeight="bold" textAnchor="middle">
              Arbolado (LAI: {laiMean})
            </text>
          </g>

          {/* Tree 2 (East Sidewalk) */}
          <g transform="translate(380, 225)">
            <rect x="-4" y="-55" width="8" height="55" fill="#78350f" rx="1" />
            <circle cx="0" cy="-65" r="26" fill="#059669" stroke="#10b981" strokeWidth="1.5" opacity="0.9" />
            <circle cx="-8" cy="-62" r="18" fill="#10b981" opacity="0.8" />
            <circle cx="9" cy="-70" r="17" fill="#34d399" opacity="0.75" />
          </g>

          {/* STREET TRAFFIC VEHICLE EMISSION SOURCE */}
          <g transform="translate(305, 235)">
            {/* Car silhouette */}
            <rect x="-16" y="-10" width="32" height="12" rx="3" fill="#475569" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="-10" y="-16" width="20" height="8" rx="2" fill="#334155" />
            <circle cx="-10" cy="2" r="3.5" fill="#020617" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="10" cy="2" r="3.5" fill="#020617" stroke="#94a3b8" strokeWidth="1" />

            {/* Exhaust plume rising */}
            <path
              d="M -16 -4 Q -35 -20 -20 -45 Q -5 -70 10 -90"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="12"
              strokeLinecap="round"
              opacity="0.3"
            />
            <text x="0" y="-22" fill="#fda4af" fontSize="6.5" fontWeight="bold" textAnchor="middle">
              Emisión Tráfico NOₓ
            </text>
          </g>

          {/* Clean Air Evapotranspiration Microclimate Halo */}
          <g transform="translate(310, 140)">
            <ellipse cx="0" cy="0" rx="45" ry="25" fill="#06b6d4" opacity="0.08" />
            <text x="0" y="4" fill="#38bdf8" fontSize="7" fontWeight="bold" textAnchor="middle">
              Enfriamiento Evaporativo ΔT = -2.4°C
            </text>
          </g>
        </svg>
      </div>

      {/* Numerical Synthesis Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9.5px] font-mono bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
        <ScientificTooltip
          position="top"
          title="Superficie Total de Infraestructura Verde Urbana (A_{\text{verde}})"
          formula="A_{\text{verde}} = \sum A_{\text{cubiertas}} + \sum A_{\text{fachadas}} + \sum A_{\text{arbolado}} \quad [\text{m}^2]"
          explanation="Área foliar y de sustrato vegetado proyectada que actúa como sumidero estomático y cuticular en el cañón urbano."
          normativeRef="Pugh et al. (2012) Environ. Sci. Technol. 46(14)"
        >
          <div className="cursor-help">
            <span className="text-slate-400 block">Superficie Vegetal:</span>
            <span className="text-emerald-400 font-bold text-xs">{totalGreenAreaM2.toLocaleString()} m²</span>
          </div>
        </ScientificTooltip>

        <ScientificTooltip
          position="top"
          title="Velocidad Media Ponderada de Deposición Seca (\overline{v_d})"
          formula="\overline{v_d} = \frac{\sum A_k \cdot v_{d,k}}{\sum A_k} \quad [\text{cm s}^{-1}]"
          explanation="Pondera la transferencia hacia muros verdes en cañón (Hedera helix) y copas arbóreas según el modelo de tres resistencias de Wesely."
          normativeRef="Wesely (1989) / Nowak et al. (2006) i-Tree Eco"
        >
          <div className="cursor-help">
            <span className="text-slate-400 block">Vel. Deposición (Vd):</span>
            <span className="text-cyan-400 font-bold text-xs">{weightedVd.toFixed(2)} cm/s</span>
          </div>
        </ScientificTooltip>

        <ScientificTooltip
          position="top"
          title="Masa Anual de NO₂ Secuestrada y Metabolizada"
          formula="M_{\text{NO}_2,\text{anual}} = \int_{0}^{365\text{d}} A_{\text{verde}} \cdot \text{LAI} \cdot v_d(t) \cdot \max(0, C_{\text{NO}_2}(t) - C_{\text{comp}}) \, dt"
          explanation="Secuestro estomático neto anual descontando el punto de compensación apoplástico (C_comp ≈ 1.1 µg/m³) y asimilado vía NR/NiR/GS-GOGAT."
          normativeRef="Sparks et al. (2001) / Cierre Estequiométrico UNED"
        >
          <div className="cursor-help">
            <span className="text-slate-400 block">Remoción Anual NO₂:</span>
            <span className="text-amber-400 font-bold text-xs">{annualRemovalKg.toLocaleString()} kg/año</span>
          </div>
        </ScientificTooltip>

        <ScientificTooltip
          position="top"
          title="Índice de Área Foliar Efectivo (LAI)"
          formula="\text{LAI} = -\frac{\ln(I / I_0)}{k_{\text{ext}}(\theta_z)} \quad [\text{m}^2\text{ hoja} / \text{m}^2\text{ suelo}]"
          explanation="Relación adimensional de superficie hemisférica foliar por unidad de superficie de pavimento, derivada de inversión radiativa Sentinel-2 MSI (bandas B4/B8)."
          normativeRef="Ley de Beer-Lambert-Monsi-Saeki / Copernicus Sentinel-2"
        >
          <div className="cursor-help">
            <span className="text-slate-400 block">Índice Foliar Medio (LAI):</span>
            <span className="text-emerald-300 font-bold text-xs">{laiMean.toFixed(1)} m²/m²</span>
          </div>
        </ScientificTooltip>
      </div>
    </div>
  );
};
