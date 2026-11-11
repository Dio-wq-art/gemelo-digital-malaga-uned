import React, { useState } from 'react';
import { Ship, Wind, Flame, Download, Info, Zap } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { MathFormula } from './MathFormula';

interface BriggsPlumeRiseDiagramProps {
  stackHeightM: number;
  plumeRiseDeltaHM: number;
  effectiveHeightM: number;
  maxConcentrationDistM: number;
  windSpeedMs: number;
  windDirDeg: number;
  stabilityClass: string;
  impactAlamedaUgm3NO2: number;
  so2EmissionKgH: number;
  noxEmissionKgH: number;
}

export function BriggsPlumeRiseDiagram({
  stackHeightM = 35,
  plumeRiseDeltaHM = 28.4,
  effectiveHeightM = 63.4,
  maxConcentrationDistM = 1250,
  windSpeedMs = 3.8,
  windDirDeg = 190,
  stabilityClass = 'D',
  impactAlamedaUgm3NO2 = 14.8,
  so2EmissionKgH = 12.3,
  noxEmissionKgH = 46.5
}: BriggsPlumeRiseDiagramProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const downloadVectorSvg = () => {
    const svgEl = document.getElementById('briggs-plume-svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `briggs_plume_diagram_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-950/95 border border-amber-900/40 rounded-lg p-4 font-mono shadow-xl relative overflow-hidden">
      {/* Header with Title and SVG Export */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            <Flame className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              Diagrama Físico de Sobreelevación de Pluma de Briggs (1969/1975)
              <ScientificTooltip topic="pinn_physics_informed_loss" content="Ecuación de flotabilidad térmica de Briggs F_b = g * w_s * r_s^2 * (T_s - T_a) / T_s. Determina la trayectoria convectiva de los gases calientes de chimenea marina frente a la fuerza horizontal del viento advectivo." />
            </h3>
            <span className="text-[10px] text-slate-400">
              Dinámica Gaussiana de Emisiones Portuarias • Clase Pasquill: <strong className="text-purple-300">{stabilityClass}</strong> • Viento: <strong className="text-cyan-300">{windSpeedMs} m/s ({windDirDeg}°)</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ScientificTooltip
            position="bottom"
            title="Exportación Vectorial de Pluma Gaussiana de Briggs"
            formula="\Delta h(x) = \frac{1.6 \, F_b^{1/3} \, x^{2/3}}{u} \quad [\text{m}]"
            explanation="Descarga el esquema físico de sobreelevación térmica y fumigación costera en formato SVG vectorial escalable sin pérdida para la memoria doctoral."
            normativeRef="Briggs (1969, 1975) Plume Rise Predictions / US EPA AERMOD"
          >
            <button
              onClick={downloadVectorSvg}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-200 rounded transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Exportar SVG</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {/* Embedded Animation Styles */}
      <style>{`
        @keyframes plumeFlow {
          0% { stroke-dashoffset: 200; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes plumePuff {
          0% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.03); opacity: 0.95; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
        @keyframes boatFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
          100% { transform: translateY(0px); }
        }
        @keyframes groundImpactPulse {
          0% { r: 5; opacity: 0.3; }
          50% { r: 12; opacity: 0.8; }
          100% { r: 5; opacity: 0.3; }
        }
      `}</style>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto">
        <svg
          id="briggs-plume-svg"
          viewBox="0 0 900 380"
          className="w-full h-auto min-w-[750px] select-none"
        >
          <defs>
            {/* Plume Gradient */}
            <linearGradient id="plumeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
              <stop offset="30%" stopColor="#ef4444" stopOpacity="0.65" />
              <stop offset="65%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.15" />
            </linearGradient>

            {/* Sea Gradient */}
            <linearGradient id="seaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#082f49" stopOpacity="0.8" />
            </linearGradient>

            {/* Ground Gradient */}
            <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </linearGradient>

            {/* Gaussian Bell Profile Filter */}
            <filter id="plumeBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Sky background */}
          <rect x="0" y="0" width="900" height="320" fill="#050a14" />

          {/* Sea water (Port Basin x=0 to 350) */}
          <rect x="0" y="320" width="350" height="60" fill="url(#seaGrad)" />
          <line x1="0" y1="320" x2="350" y2="320" stroke="#38bdf8" strokeWidth="2" />
          <text x="120" y="345" fill="#38bdf8" fontSize="11" fontWeight="bold">DÁRSENA PUERTO DE MÁLAGA</text>

          {/* Quay Wall (Cantil de muelle) */}
          <rect x="345" y="315" width="10" height="65" fill="#475569" stroke="#64748b" />

          {/* Urban Land Surface (Alameda/Parque x=355 to 900) */}
          <rect x="355" y="320" width="545" height="60" fill="url(#groundGrad)" />
          <line x1="355" y1="320" x2="900" y2="320" stroke="#10b981" strokeWidth="2" strokeDasharray="6 3" />
          <text x="560" y="345" fill="#10b981" fontSize="11" fontWeight="bold">CANOPÍA URBANA (PASEO DEL PARQUE / ALAMEDA)</text>

          {/* Wind advection arrows aloft */}
          <g opacity="0.6">
            <line x1="180" y1="40" x2="260" y2="40" stroke="#38bdf8" strokeWidth="2" strokeDasharray="5 3" />
            <polygon points="265,40 255,36 255,44" fill="#38bdf8" />
            <line x1="450" y1="40" x2="530" y2="40" stroke="#38bdf8" strokeWidth="2" strokeDasharray="5 3" />
            <polygon points="535,40 525,36 525,44" fill="#38bdf8" />
            <text x="275" y="44" fill="#38bdf8" fontSize="10" fontWeight="bold">
              VIENTO ADVECCIÓN (Brisa Marina Sur-Norte: {windSpeedMs} m/s)
            </text>
          </g>

          {/* Ship Graphic at Berth */}
          <g style={{ animation: 'boatFloat 4s ease-in-out infinite' }}>
            {/* Ship Hull */}
            <polygon points="80,320 280,320 260,280 110,280" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            {/* Superstructure */}
            <rect x="130" y="240" width="110" height="40" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
            <rect x="145" y="210" width="80" height="30" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
            
            {/* Exhaust Funnel / Chimney (Stack) */}
            <rect x="175" y="160" width="20" height="50" fill="#dc2626" stroke="#f87171" strokeWidth="1.5" />
            <polygon points="170,160 200,160 195,150 175,150" fill="#991b1b" stroke="#fca5a5" strokeWidth="1.5" />

            {/* Hot exhaust efflux core */}
            <circle cx="185" cy="150" r="7" fill="#fbbf24" opacity="0.9" />
            <circle cx="185" cy="150" r="14" fill="#f59e0b" opacity="0.4" />
          </g>

          {/* Plume Envelope Curve (Upper and Lower Briggs Expansion) */}
          {/* Stack top: x=185, y=150. Peak of plume: x=480, y=90. Downward dispersion to ground: touches near x=680, y=320 */}
          <path
            d="M 185 150 
               Q 270 110, 420 95 
               T 720 140 
               T 890 220 
               L 890 320 
               L 660 320 
               Q 440 260, 310 180 
               Z"
            fill="url(#plumeGrad)"
            opacity="0.55"
            filter="url(#plumeBlur)"
            style={{ animation: 'plumePuff 5s ease-in-out infinite' }}
          />

          {/* Plume Centerline (Briggs 2/3 law trajectory: Delta_h(x) = (1.6 * F^(1/3) * x^(2/3)) / u) */}
          <path
            d="M 185 150 Q 280 115, 430 100 T 700 120 T 900 160"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="3"
            strokeDasharray="8 4"
            style={{ animation: 'plumeFlow 3s linear infinite' }}
          />

          {/* Lower touchdown boundary to ground (Maximum concentration footprint x_max) */}
          <path
            d="M 280 175 C 400 240, 520 310, 670 320"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />

          {/* Animated ground touchdown node at x_max */}
          <circle cx="670" cy="320" r="8" fill="#f43f5e" style={{ animation: 'groundImpactPulse 2s infinite' }} />
          <circle cx="670" cy="320" r="4" fill="#ffffff" />

          {/* Dimension Guidelines & Scientific Annotations */}
          {/* 1. Stack Height (h_s) */}
          <line x1="60" y1="320" x2="60" y2="150" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="55" y1="320" x2="65" y2="320" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="55" y1="150" x2="65" y2="150" stroke="#94a3b8" strokeWidth="1.5" />
          <text x="15" y="240" fill="#94a3b8" fontSize="11" fontWeight="bold">h_s = {stackHeightM}m</text>
          <text x="15" y="255" fill="#64748b" fontSize="9">Chimenea</text>

          {/* 2. Plume Rise (Delta h) */}
          <line x1="430" y1="150" x2="430" y2="100" stroke="#34d399" strokeWidth="2" />
          <polygon points="430,95 426,105 434,105" fill="#34d399" />
          <polygon points="430,155 426,145 434,145" fill="#34d399" />
          <line x1="185" y1="150" x2="450" y2="150" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="390" y1="100" x2="450" y2="100" stroke="#34d399" strokeWidth="1" strokeDasharray="2 2" />
          <text x="445" y="128" fill="#34d399" fontSize="12" fontWeight="bold">Δh = +{plumeRiseDeltaHM}m</text>
          <text x="445" y="140" fill="#a7f3d0" fontSize="9">Sobreelevación Térmica</text>

          {/* 3. Effective Height (H_e) */}
          <line x1="860" y1="320" x2="860" y2="100" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 2" />
          <line x1="855" y1="320" x2="865" y2="320" stroke="#fbbf24" strokeWidth="2" />
          <line x1="855" y1="100" x2="865" y2="100" stroke="#fbbf24" strokeWidth="2" />
          <text x="770" y="200" fill="#fbbf24" fontSize="12" fontWeight="bold">H_e = {effectiveHeightM}m</text>
          <text x="770" y="215" fill="#fde68a" fontSize="9">Altura Efectiva Total</text>

          {/* 4. Ground Touchdown Distance x_max */}
          <line x1="355" y1="365" x2="670" y2="365" stroke="#f43f5e" strokeWidth="2" />
          <polygon points="675,365 665,361 665,369" fill="#f43f5e" />
          <polygon points="350,365 360,361 360,369" fill="#f43f5e" />
          <text x="450" y="360" fill="#f43f5e" fontSize="11" fontWeight="bold">
            x_max ≈ {maxConcentrationDistM} m (Pico en Suelo)
          </text>

          {/* Floating Telemetry Badge on Ground Impact */}
          <g transform="translate(620, 245)">
            <rect x="0" y="0" width="170" height="52" rx="4" fill="#0f172a" stroke="#f43f5e" strokeWidth="1.5" />
            <text x="8" y="18" fill="#f43f5e" fontSize="10" fontWeight="bold">IMPACTO EN ALAMEDA:</text>
            <text x="8" y="34" fill="#ffffff" fontSize="13" fontWeight="bold">+{impactAlamedaUgm3NO2} µg/m³ NO₂</text>
            <text x="8" y="46" fill="#94a3b8" fontSize="8.5">Recepción en Canopía Peatonal</text>
          </g>
        </svg>
      </div>

      {/* Physics & Chemical Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-800 text-xs">
        <ScientificTooltip
          position="top"
          title="Parámetro de Flujo de Flotabilidad Térmica de Briggs (F_b)"
          formula="F_b = g \cdot v_s \cdot r_s^2 \cdot \left(\frac{T_s - T_a}{T_s}\right) \quad [\text{m}^4\text{ s}^{-3}]"
          explanation={`Gobierna el ascenso convectivo inicial Δh = +${plumeRiseDeltaHM} m hasta alcanzar la altura efectiva H_e = ${effectiveHeightM} m sobre la dársena portuaria.`}
          normativeRef="Briggs (1975) Lectures on Air Pollution and Environmental Impact Analyses"
        >
          <div className="bg-slate-900/90 border border-amber-900/40 p-2.5 rounded cursor-help h-full">
            <span className="text-[10px] text-amber-400 font-bold block uppercase mb-1 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> Flotabilidad Térmica <MathFormula math="F_b" />
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
              Impulso térmico (<MathFormula math="\Delta h \propto F_b^{1/3} x^{2/3} u^{-1}" />) generado por gases de escape (~320°C) hasta <MathFormula math={`H_e = ${effectiveHeightM}\\text{ m}`} />.
            </p>
          </div>
        </ScientificTooltip>

        <ScientificTooltip
          position="top"
          title="Advección Costera y Fumigación en Capa Límite Interna (TIBL)"
          formula="C(x,0,0) = \frac{Q}{\pi u \sigma_y \sigma_z} \exp\left(-\frac{H_e^2}{2\sigma_z^2}\right)"
          explanation={`La brisa marina (${windSpeedMs} m/s, clase Pasquill ${stabilityClass}) abate el penacho hacia la Alameda Principal con máximo impacto en superficie a x_max ≈ ${maxConcentrationDistM} m.`}
          normativeRef="Dispersión Gaussiana Pasquill-Gifford / Fumigación Costera"
        >
          <div className="bg-slate-900/90 border border-cyan-900/40 p-2.5 rounded cursor-help h-full">
            <span className="text-[10px] text-cyan-400 font-bold block uppercase mb-1 flex items-center gap-1">
              <Wind className="w-3.5 h-3.5" /> Cizalladura y Advección Marina
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
              Viento advectivo {windSpeedMs} m/s ({windDirDeg}°) doblega la pluma hacia el centro histórico, desplazando el eje de máxima mezcla horizontalmente.
            </p>
          </div>
        </ScientificTooltip>

        <ScientificTooltip
          position="top"
          title="Tasa de Emisión Marítima en Atraque (Hoteling EMEP/EEA)"
          formula="E_i = P_{\text{aux}} \cdot LF \cdot EF_i(\text{S}\% \le 0.10\%)"
          explanation="Caudal másico continuo de motores auxiliares diésel generadores de energía eléctrica a bordo durante la estancia en muelle sin conexión OPS."
          normativeRef="Guía EMEP/EEA 2023 (1.A.3.d Navigation) / Anexo VI MARPOL"
        >
          <div className="bg-slate-900/90 border border-emerald-900/40 p-2.5 rounded cursor-help h-full">
            <span className="text-[10px] text-emerald-400 font-bold block uppercase mb-1 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Emisiones Totales en Atraque
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
              Emisión constante de motores auxiliares (hoteling): <strong className="text-emerald-300">{noxEmissionKgH} kg/h NOₓ</strong> y <strong className="text-amber-300">{so2EmissionKgH} kg/h SO₂</strong>.
            </p>
          </div>
        </ScientificTooltip>
      </div>
    </div>
  );
}
