import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Factory, Wind, Thermometer, ArrowRight, ShieldAlert, Sparkles, Download, Layers } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { downloadVectorSvg } from '../lib/vectorExporter';

export interface IndustrialPlumeDiagramProps {
  terralSpeed: number;
  terralDir: number;
  airTempC: number;
  facilities: Array<{
    facilityId: string;
    facilityName: string;
    poligono: string;
    noxGMs: number;
    so2GMs: number;
    pm10GMs: number;
    effectiveStackHeightM: number;
    downwindTeatinosUgm3NO2: number;
    downwindCarreteraCadizUgm3PM10: number;
  }>;
}

export const IndustrialInventoryPlumeDiagram: React.FC<IndustrialPlumeDiagramProps> = ({
  terralSpeed,
  terralDir,
  airTempC,
  facilities
}) => {
  const [selectedFacilityIndex, setSelectedFacilityIndex] = useState<number>(0);
  const [activePollutant, setActivePollutant] = useState<'nox' | 'so2' | 'pm10'>('nox');

  const selectedFacility = facilities[selectedFacilityIndex] || facilities[0];
  const physicalStackHeight = Math.round(selectedFacility.effectiveStackHeightM * 0.6);
  const plumeRiseM = Math.max(5, selectedFacility.effectiveStackHeightM - physicalStackHeight);

  const handleExportSvg = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 380" width="760" height="380" font-family="system-ui, sans-serif">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#090d16" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
        <linearGradient id="plumeGradNox" x1="0%" y1="0%" x2="100%" y2="50%">
          <stop offset="0%" stop-color="#f97316" stop-opacity="0.9" />
          <stop offset="60%" stop-color="#ea580c" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#ea580c" stop-opacity="0.02" />
        </linearGradient>
        <linearGradient id="terralGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.9" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bgGrad)" rx="8" />
      <text x="30" y="36" fill="#fb923c" font-size="14" font-weight="bold">MODELO DE PENACHO INDUSTRIAL GAUSSIANO (BRIGGS) &amp; ADVECCIÓN POR TERRAL</text>
      <text x="30" y="56" fill="#94a3b8" font-size="10">Valle del Guadalhorce → Receptores Teatinos y Carretera de Cádiz (Málaga)</text>
      <!-- Base Ground -->
      <line x1="30" y1="320" x2="730" y2="320" stroke="#334155" stroke-width="2" />
      <!-- Emitting Stack -->
      <rect x="80" y="${320 - physicalStackHeight * 2.2}" width="24" height="${physicalStackHeight * 2.2}" fill="#475569" stroke="#94a3b8" stroke-width="1.5" />
      <!-- Plume Rise -->
      <path d="M 104 ${320 - physicalStackHeight * 2.2} Q 220 ${320 - (physicalStackHeight + plumeRiseM) * 1.8}, 700 ${320 - (physicalStackHeight + plumeRiseM) * 1.2} L 700 320 L 104 320 Z" fill="url(#plumeGradNox)" />
      <!-- Labels -->
      <text x="92" y="${300 - physicalStackHeight * 2.2}" fill="#f8fafc" font-size="11" font-weight="bold" text-anchor="middle">${selectedFacility.facilityName}</text>
      <text x="92" y="${314 - physicalStackHeight * 2.2}" fill="#cbd5e1" font-size="9" text-anchor="middle">hs = ${physicalStackHeight}m | Δh = +${plumeRiseM.toFixed(1)}m</text>
      <text x="640" y="305" fill="#fca5a5" font-size="10" font-weight="bold">Teatinos: +${selectedFacility.downwindTeatinosUgm3NO2} µg/m³</text>
    </svg>`;
    downloadVectorSvg(svgContent, `Industrial_Plume_Briggs_Malaga_${Date.now()}.svg`);
  };

  const pollutantColors = {
    nox: { stroke: '#f97316', fill: 'from-orange-500/80 to-amber-500/10', text: 'text-orange-400', unit: 'g/s', label: 'NOₓ (Óxidos de Nitrógeno)' },
    so2: { stroke: '#eab308', fill: 'from-yellow-500/80 to-amber-400/10', text: 'text-yellow-400', unit: 'g/s', label: 'SO₂ (Dióxido de Azufre)' },
    pm10: { stroke: '#ef4444', fill: 'from-rose-500/80 to-red-500/10', text: 'text-rose-400', unit: 'g/s', label: 'PM₁₀ (Material Particulado)' }
  };

  const currentPollutantRate = activePollutant === 'nox' 
    ? selectedFacility.noxGMs 
    : activePollutant === 'so2' 
      ? selectedFacility.so2GMs 
      : selectedFacility.pm10GMs;

  const stackHeightScaled = Math.min(130, Math.max(30, physicalStackHeight * 2.2));
  const plumeRiseScaled = Math.min(100, Math.max(20, plumeRiseM * 1.5));
  const effectiveHeightY = 240 - (stackHeightScaled + plumeRiseScaled);

  return (
    <div className="bg-slate-950 border border-orange-900/60 rounded-lg p-3 space-y-3 shadow-2xl">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Factory className="w-4 h-4 text-orange-400 animate-pulse" />
          <div>
            <span className="text-orange-300 font-bold uppercase tracking-wider text-[10px] font-mono">
              Diagrama Dinámico de Pluma Industrial &amp; Elevación de Briggs
            </span>
            <span className="text-[8px] text-slate-400 block font-mono">
              Microescala Guadalhorce • Advección por Terral ({terralSpeed} m/s, {terralDir}°) hacia Teatinos
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[8.5px] font-mono">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
            {(['nox', 'so2', 'pm10'] as const).map(pol => (
              <ScientificTooltip topic="gum_uncertainty_budget"
                key={pol}
                width="w-72"
                content={
                  pol === 'nox'
                    ? 'Óxidos de nitrógeno (NO + NO₂). Emisión térmica generada por combustión a alta temperatura (>1100°C) en hornos industriales. Regulado por Directiva 2010/75/UE (DEI) con VLE de 200 mg/Nm³.'
                    : pol === 'so2'
                      ? 'Dióxido de azufre derivado del contenido de azufre en fuelóleos y coque de petróleo. Precursor de sulfato amónico secundario [(NH₄)₂SO₄]. Directiva 2008/50/CE límite horario de 350 µg/m³.'
                      : 'Fracción gruesa y fina de partículas en suspensión generadas por molienda de áridos, manipulación de clínker y transporte de carga pesada. Guías OMS 2021: 15 µg/m³ media diaria.'
                }
              >
                <button
                  onClick={() => setActivePollutant(pol)}
                  className={`px-2 py-0.5 rounded uppercase font-bold transition-all ${
                    activePollutant === pol
                      ? 'bg-orange-950 text-orange-300 border border-orange-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {pol}
                </button>
              </ScientificTooltip>
            ))}
          </div>

          <ScientificTooltip topic="gum_uncertainty_budget"
            width="w-64"
            content="Exportación en gráficos vectoriales escalables (SVG estandarizado W3C). Mantiene capas de pluma gaussiana, ejes cartesianos y concentraciones receptoras para inclusión directa en memorias de tesis doctoral y artículos JCR."
          >
            <button
              onClick={handleExportSvg}
              className="px-2 py-1 bg-orange-950/80 hover:bg-orange-900 border border-orange-700/80 text-orange-300 rounded text-[8px] font-bold flex items-center gap-1 transition-colors"
            >
              <Download className="w-2.5 h-2.5 text-orange-400" /> Vector SVG
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {/* Facility Selection Chips */}
      <div className="flex flex-wrap gap-1.5 text-[8.5px] font-mono">
        {facilities.map((fac, idx) => (
          <ScientificTooltip topic="gum_uncertainty_budget"
            key={fac.facilityName}
            width="w-80"
            content={`Foco puntual industrial en Polígono ${fac.poligono}. Chimenea efectiva H_eff=${fac.effectiveStackHeightM}m. Emisiones certificadas E-PRTR: NOₓ=${fac.noxGMs} g/s, SO₂=${fac.so2GMs} g/s, PM₁₀=${fac.pm10GMs} g/s. Aporte a sotavento en Teatinos: +${fac.downwindTeatinosUgm3NO2} µg/m³.`}
          >
            <button
              onClick={() => setSelectedFacilityIndex(idx)}
              className={`px-2 py-1 rounded border transition-all flex items-center gap-1 ${
                selectedFacilityIndex === idx
                  ? 'bg-slate-800 border-orange-500 text-orange-200 font-bold shadow-[0_0_8px_rgba(249,115,22,0.3)]'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span>{fac.facilityName.split('(')[0].trim()}</span>
            </button>
          </ScientificTooltip>
        ))}
      </div>

      {/* Interactive Canvas / SVG Representation */}
      <div className="relative w-full h-[260px] bg-[#070b14] border border-slate-800/90 rounded overflow-hidden">
        {/* Sky / Atmosphere Gradient Background */}
        <svg className="w-full h-full" viewBox="0 0 700 260" preserveAspectRatio="none">
          <defs>
            {/* Plume Gaussian Gradient */}
            <linearGradient id="plumeGradActive" x1="0%" y1="0%" x2="100%" y2="40%">
              <stop offset="0%" stopColor={pollutantColors[activePollutant].stroke} stopOpacity="0.85" />
              <stop offset="40%" stopColor={pollutantColors[activePollutant].stroke} stopOpacity="0.45" />
              <stop offset="75%" stopColor={pollutantColors[activePollutant].stroke} stopOpacity="0.2" />
              <stop offset="100%" stopColor={pollutantColors[activePollutant].stroke} stopOpacity="0.01" />
            </linearGradient>

            {/* Gaussian concentration contour lines pattern */}
            <linearGradient id="groundSpreadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#f97316" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="60" x2="700" y2="60" stroke="#1e293b" strokeDasharray="3 3" />
          <line x1="0" y1="120" x2="700" y2="120" stroke="#1e293b" strokeDasharray="3 3" />
          <line x1="0" y1="180" x2="700" y2="180" stroke="#1e293b" strokeDasharray="3 3" />
          <line x1="0" y1="240" x2="700" y2="240" stroke="#475569" strokeWidth="2" />

          {/* Topographic Hills (Montes de Málaga / Valle Guadalhorce) */}
          <path d="M 0 240 Q 60 190, 110 240 L 700 240 L 700 260 L 0 260 Z" fill="#0f172a" />

          {/* Plume Dispersion Envelope (Gaussian Cone) */}
          <path
            d={`M 100 ${240 - stackHeightScaled} 
               Q 240 ${effectiveHeightY - 15}, 680 ${effectiveHeightY - 35} 
               L 680 240 
               Q 400 240, 100 240 Z`}
            fill="url(#plumeGradActive)"
          />

          {/* Plume Centerline (Trajectory of Maximum Concentration) */}
          <path
            d={`M 100 ${240 - stackHeightScaled} 
               Q 250 ${effectiveHeightY}, 680 ${effectiveHeightY}`}
            fill="none"
            stroke={pollutantColors[activePollutant].stroke}
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />

          {/* Ground level concentration footprint */}
          <path
            d="M 280 238 Q 480 220, 680 238 L 680 240 L 280 240 Z"
            fill="url(#groundSpreadGrad)"
          />

          {/* Industrial Chimney / Stack */}
          <g transform={`translate(88, ${240 - stackHeightScaled})`}>
            {/* Stack body */}
            <rect x="0" y="0" width="22" height={stackHeightScaled} fill="#334155" stroke="#64748b" strokeWidth="1.5" rx="1" />
            <rect x="-2" y="0" width="26" height="4" fill="#94a3b8" />
            {/* Warning stripes */}
            <rect x="0" y={stackHeightScaled * 0.25} width="22" height="6" fill="#ef4444" />
            <rect x="0" y={stackHeightScaled * 0.6} width="22" height="6" fill="#ef4444" />
            {/* Effluent exit arrow */}
            <line x1="11" y1="0" x2="11" y2="-18" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrow)" />
          </g>

          {/* Downwind Receptor: Teatinos University & Residential */}
          <g transform="translate(610, 195)">
            <rect x="0" y="10" width="45" height="35" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" rx="2" />
            <text x="22" y="24" fill="#93c5fd" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">TEATINOS</text>
            <text x="22" y="36" fill="#ef4444" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">+{selectedFacility.downwindTeatinosUgm3NO2} µg</text>
            <circle cx="22" cy="6" r="3" fill="#ef4444" className="animate-ping" />
          </g>

          {/* Terral Wind Vector Arrows */}
          <g transform="translate(20, 25)">
            <rect x="0" y="0" width="160" height="28" fill="#0f172a" stroke="#334155" rx="3" />
            <text x="10" y="12" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
              VIENTO TERRAL (NW): {terralSpeed} m/s
            </text>
            <text x="10" y="22" fill="#f59e0b" fontSize="7.5" fontFamily="monospace">
              T_aire: {airTempC}°C • Descenso adiabático
            </text>
          </g>

          {/* Briggs Effective Plume Height Indicator (H_eff = hs + Δh) */}
          <line x1="280" y1="240" x2="280" y2={effectiveHeightY} stroke="#94a3b8" strokeDasharray="2 2" />
          <text x="286" y={effectiveHeightY + 12} fill="#cbd5e1" fontSize="7.5" fontFamily="monospace">
            H_eff = {(physicalStackHeight + plumeRiseM).toFixed(1)} m
          </text>
          <text x="286" y={effectiveHeightY + 22} fill="#fb923c" fontSize="7" fontFamily="monospace">
            (hs={physicalStackHeight}m + Δh={plumeRiseM.toFixed(1)}m)
          </text>
        </svg>

        {/* Animated Particles floating in plume */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: pollutantColors[activePollutant].stroke,
                boxShadow: `0 0 6px ${pollutantColors[activePollutant].stroke}`,
                left: 100,
                top: 240 - stackHeightScaled
              }}
              animate={{
                x: [0, 150 + i * 40, 560],
                y: [0, -plumeRiseScaled * (0.6 + (i % 3) * 0.2), -(plumeRiseScaled * 0.4) + ((i % 5) * 20 - 40)],
                opacity: [0.9, 0.6, 0],
                scale: [0.8, 1.8, 3.5]
              }}
              transition={{
                duration: 3.5 + (i % 4) * 0.6,
                repeat: Infinity,
                ease: 'easeOut',
                delay: i * 0.3
              }}
            />
          ))}
        </div>
      </div>

      {/* Physics Diagnostics Footnote */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 p-2 border border-slate-800 rounded text-[8.5px] font-mono">
        <ScientificTooltip topic="gum_uncertainty_budget"
          width="w-64"
          content={`Flujo másico de emisión Q_${activePollutant.toUpperCase()} emitido en cabeza de chimenea, calculado a partir de la tasa de consumo de combustible y factores de emisión EMEP/EEA 2023.`}
        >
          <div className="flex flex-col justify-between cursor-help">
            <span className="text-slate-400">Emisión {activePollutant.toUpperCase()}:</span>
            <strong className={`font-bold ${pollutantColors[activePollutant].text}`}>
              {currentPollutantRate} {pollutantColors[activePollutant].unit}
            </strong>
          </div>
        </ScientificTooltip>

        <ScientificTooltip topic="gum_uncertainty_budget"
          width="w-64"
          content="Sobre-elevación térmica y mecánica del penacho según ecuaciones de Briggs para atmósfera inestable (Terral). Δh = 1.6 · F_b^(1/3) · x^(2/3) / u."
        >
          <div className="flex flex-col justify-between cursor-help">
            <span className="text-slate-400">Sobre-elevación Δh (Briggs):</span>
            <strong className="text-amber-300 font-bold">+{plumeRiseM.toFixed(1)} m</strong>
          </div>
        </ScientificTooltip>

        <ScientificTooltip topic="gum_uncertainty_budget"
          width="w-64"
          content="Altura física estructural del conducto de emisión (hs). Parámetro base que condiciona el plano de reflexión sobre la capa límite superficial (Ground Reflection)."
        >
          <div className="flex flex-col justify-between cursor-help">
            <span className="text-slate-400">Altura Física Chimenea:</span>
            <strong className="text-sky-300 font-bold">{physicalStackHeight} m</strong>
          </div>
        </ScientificTooltip>

        <ScientificTooltip topic="gum_uncertainty_budget"
          width="w-64"
          content="Concentración incremental a nivel del suelo estimada a 3.8 km a sotavento en el distrito residencial/universitario de Teatinos bajo régimen de viento Terral."
        >
          <div className="flex flex-col justify-between cursor-help">
            <span className="text-slate-400">Impacto en Teatinos:</span>
            <strong className="text-rose-400 font-bold">+{selectedFacility.downwindTeatinosUgm3NO2} µg/m³</strong>
          </div>
        </ScientificTooltip>
      </div>
    </div>
  );
};
