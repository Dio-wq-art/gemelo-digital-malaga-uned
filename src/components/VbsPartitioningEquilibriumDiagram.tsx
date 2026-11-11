import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { FlaskConical, Sun, Atom, ArrowRight, Download, RefreshCw, Zap, Sparkles, Droplets, MapPin } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { downloadVectorSvg } from '../lib/vectorExporter';
import { calculateVbsSoaSummary } from '../lib/vbsSecondaryOrganicAerosol';

export interface VbsPartitioningDiagramProps {
  airTempC: number;
  totalCoa: number; // Preexisting Organic Aerosol Mass in ug/m3
  uvA: number;
  bvocPrecursorPpb?: number;
  avocPrecursorPpb?: number;
}

export const VbsPartitioningEquilibriumDiagram: React.FC<VbsPartitioningDiagramProps> = ({
  airTempC,
  totalCoa,
  uvA,
  bvocPrecursorPpb = 12.5,
  avocPrecursorPpb = 8.2
}) => {
  const [selectedBinIndex, setSelectedBinIndex] = useState<number>(1);

  // Clausius-Clapeyron Enthalpy of Vaporization (Hvap = 70 kJ/mol)
  const T_K = airTempC + 273.15;
  const T_ref = 298.15; // 25°C
  const R = 8.314e-3; // kJ / (mol K)
  const deltaHvap = 70.0; // kJ/mol

  // Bins standard at 298.15K: C* = 1, 10, 100, 1000 ug/m3
  const baseBins = [
    { name: 'Bin 1 (LVOC/SVOC)', cStar298: 1.0, alphaBVOC: 0.05, alphaAVOC: 0.03, color: '#10b981', label: 'C*=1 µg/m³' },
    { name: 'Bin 2 (SVOC)', cStar298: 10.0, alphaBVOC: 0.15, alphaAVOC: 0.08, color: '#06b6d4', label: 'C*=10 µg/m³' },
    { name: 'Bin 3 (IVOC)', cStar298: 100.0, alphaBVOC: 0.25, alphaAVOC: 0.18, color: '#f59e0b', label: 'C*=100 µg/m³' },
    { name: 'Bin 4 (IVOC Alto)', cStar298: 1000.0, alphaBVOC: 0.35, alphaAVOC: 0.30, color: '#ef4444', label: 'C*=1000 µg/m³' },
  ];

  // Calculated partitioning fractions F_i = 1 / (1 + C_i*(T) / C_OA)
  const computedBins = useMemo(() => {
    return baseBins.map(b => {
      // Temperature correction for C* (Donahue 2006)
      const cStarT = b.cStar298 * (T_ref / T_K) * Math.exp((deltaHvap / R) * (1 / T_ref - 1 / T_K));
      const Fi = 1.0 / (1.0 + cStarT / Math.max(0.5, totalCoa));
      const aerosolYield = (b.alphaBVOC * 0.6 + b.alphaAVOC * 0.4) * Fi;
      return {
        ...b,
        cStarT: parseFloat(cStarT.toFixed(2)),
        FiPercentage: parseFloat((Fi * 100).toFixed(1)),
        gasFraction: parseFloat(((1 - Fi) * 100).toFixed(1)),
        aerosolYield: parseFloat((aerosolYield * 100).toFixed(1))
      };
    });
  }, [T_K, totalCoa]);

  const vbsSummary = useMemo(() => {
    return calculateVbsSoaSummary(airTempC, totalCoa, uvA);
  }, [airTempC, totalCoa, uvA]);

  const activeBin = computedBins[selectedBinIndex] || computedBins[0];

  const handleExportSvg = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 740 380" width="740" height="380" font-family="system-ui, sans-serif">
      <defs>
        <linearGradient id="vbsBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#090d16" />
          <stop offset="100%" stop-color="#030712" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#vbsBg)" rx="8" />
      <text x="30" y="36" fill="#34d399" font-size="14" font-weight="bold">MODELO DE PARTICIONAMIENTO VBS (VOLATILITY BASIS SET) / PANKOW</text>
      <text x="30" y="56" fill="#94a3b8" font-size="10">Equilibrio Gas-Partícula • C_OA = ${totalCoa} µg/m³ • T = ${airTempC}°C • UV-A = ${uvA} W/m²</text>
      ${computedBins.map((b, idx) => `
        <g transform="translate(${40 + idx * 170}, 90)">
          <rect width="150" height="230" fill="#1e293b" stroke="${b.color}" stroke-width="1.5" rx="6" />
          <text x="75" y="25" fill="#f8fafc" font-size="11" font-weight="bold" text-anchor="middle">${b.label}</text>
          <text x="75" y="42" fill="${b.color}" font-size="9" text-anchor="middle">C*(T) = ${b.cStarT} µg/m³</text>
          <rect x="20" y="70" width="110" height="60" fill="#0f172a" stroke="#334155" rx="3" />
          <text x="75" y="92" fill="#cbd5e1" font-size="8.5" text-anchor="middle">Fase Aerosol (F_i)</text>
          <text x="75" y="115" fill="${b.color}" font-size="14" font-weight="bold" text-anchor="middle">${b.FiPercentage}%</text>
          <rect x="20" y="145" width="110" height="55" fill="#0f172a" stroke="#334155" rx="3" />
          <text x="75" y="167" fill="#94a3b8" font-size="8.5" text-anchor="middle">Fase Gas (1-F_i)</text>
          <text x="75" y="188" fill="#e2e8f0" font-size="12" font-weight="bold" text-anchor="middle">${b.gasFraction}%</text>
        </g>
      `).join('')}
    </svg>`;
    downloadVectorSvg(svgContent, `VBS_Pankow_Partitioning_Malaga_${Date.now()}.svg`);
  };

  return (
    <div className="bg-slate-950 border border-emerald-900/60 rounded-lg p-3 space-y-3 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-emerald-400 animate-pulse" />
          <div>
            <span className="text-emerald-300 font-bold uppercase tracking-wider text-[10px] font-mono">
              Diagrama de Particionamiento Gas-Partícula VBS (Pankow / Donahue 2006)
            </span>
            <span className="text-[8px] text-slate-400 block font-mono">
              Masa de Aerosol Orgánico C_OA = {totalCoa} µg/m³ • T = {airTempC}°C (ΔH_vap = 70 kJ/mol) • UV-A = {uvA} W/m²
            </span>
          </div>
        </div>

        <ScientificTooltip topic="aerosol_multimodal_distribution"
          width="w-64"
          content="Exportación en vector vectorial SVG con descomposición en bins VBS, porcentajes de particionamiento y balance de masa condensada para artículos científicos e informes de tesis doctoral."
        >
          <button
            onClick={handleExportSvg}
            className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 rounded text-[8px] font-bold flex items-center gap-1 transition-colors font-mono"
          >
            <Download className="w-2.5 h-2.5 text-emerald-400" /> Vector SVG
          </button>
        </ScientificTooltip>
      </div>

      {/* Main Diagram Canvas: 4 Volatility Bins & Dynamic Aerosol Core */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
        {computedBins.map((bin, idx) => {
          const isSelected = selectedBinIndex === idx;
          return (
            <ScientificTooltip topic="aerosol_multimodal_distribution"
              key={bin.name}
              width="w-72"
              content={`Bin ${idx + 1} del VBS (Volatility Basis Set, Donahue 2006). Concentración de saturación efectiva corregida por temperatura C*(T)=${bin.cStarT} µg/m³. Fracción condensada en aerosol orgánico F_i=${bin.FiPercentage}%, fracción gaseosa=${bin.gasFraction}%. Rendimiento SOA ponderado: ${bin.aerosolYield}%.`}
            >
              <div
                onClick={() => setSelectedBinIndex(idx)}
                className={`p-2.5 rounded border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/95 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Bin Header */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 font-mono text-[9px]">
                  <span className="font-bold" style={{ color: bin.color }}>{bin.label}</span>
                  <span className="text-slate-400 text-[8px]">Bin {idx + 1}</span>
                </div>

                {/* Equilibrium Visual Bar */}
                <div className="my-2 space-y-1.5 font-mono">
                  <div className="flex justify-between text-[8px] text-slate-300">
                    <span>Fase Aerosol (Fᵢ):</span>
                    <span className="font-bold" style={{ color: bin.color }}>{bin.FiPercentage}%</span>
                  </div>
                  {/* Progress bar representing condensation into particle */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                    <div
                      className="h-full transition-all duration-500 rounded-l-full"
                      style={{
                        width: `${bin.FiPercentage}%`,
                        backgroundColor: bin.color,
                        boxShadow: `0 0 6px ${bin.color}`
                      }}
                    />
                    <div
                      className="h-full bg-slate-700/60 transition-all duration-500"
                      style={{ width: `${bin.gasFraction}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[7.5px] text-slate-400">
                    <span>Gas: {bin.gasFraction}%</span>
                    <span>C*(T): {bin.cStarT} µg/m³</span>
                  </div>
                </div>

                {/* Dynamic Condensation / Evaporation Kinetic Micro-Diagram */}
                <div className="relative h-16 bg-black/50 border border-slate-800/80 rounded p-1 flex items-center justify-between overflow-hidden">
                  {/* Gas Phase Precursors */}
                  <div className="flex flex-col items-center justify-center w-12 z-10">
                    <Atom className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-[7px] text-sky-300 font-mono">Gas</span>
                  </div>

                  {/* Animated Particle Flux Arrow */}
                  <div className="flex-1 flex flex-col items-center justify-center relative px-1">
                    <div className="w-full h-0.5 bg-slate-800 relative">
                      <motion.div
                        className="absolute top-[-3px] w-2 h-2 rounded-full"
                        style={{ backgroundColor: bin.color, boxShadow: `0 0 4px ${bin.color}` }}
                        animate={{
                          x: [0, 50],
                          opacity: [0, 1, 0]
                        }}
                        transition={{
                          duration: 1.8 / Math.max(0.1, bin.FiPercentage / 100),
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      />
                    </div>
                    <span className="text-[6.5px] text-slate-400 font-mono mt-1">k_cond (Pankow)</span>
                  </div>

                  {/* Aerosol Particle Core (C_OA) */}
                  <div className="flex flex-col items-center justify-center w-14 z-10">
                    <Droplets className="w-4 h-4 text-emerald-400" />
                    <span className="text-[7px] text-emerald-300 font-mono font-bold">C_OA</span>
                  </div>
                </div>

                {/* Yield summary */}
                <div className="mt-2 text-[7.5px] font-mono text-slate-400 flex justify-between pt-1 border-t border-slate-800/80">
                  <span>Rendimiento SOA:</span>
                  <strong className="text-white font-bold">{bin.aerosolYield}%</strong>
                </div>
              </div>
            </ScientificTooltip>
          );
        })}
      </div>

      {/* Thermodynamic Formulation & Reactive Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-900/60 p-2 border border-slate-800 rounded font-mono text-[8.5px]">
        <ScientificTooltip topic="aerosol_multimodal_distribution"
          width="w-72"
          content="Flujo actínico solar UV-A en banda 315-400 nm. Conduce la fotólisis de ozono y ácido nitroso (HONO), generando radicales hidroxilo (OH•) que foto-oxidan COVs biogénicos y antropogénicos a compuestos oxigenados de baja volatilidad."
        >
          <div className="flex items-center gap-2 cursor-help">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <div>
              <span className="text-slate-400 block">Radiación UV-A / Foto-oxidación:</span>
              <span className="text-amber-300 font-bold">{uvA} W/m² (Generación OH•)</span>
            </div>
          </div>
        </ScientificTooltip>

        <ScientificTooltip topic="aerosol_multimodal_distribution"
          width="w-72"
          content="Ley de particionamiento absorbente de Pankow (1994). La fracción F_i depende de la masa absorbente orgánica previa C_OA. A mayor C_OA o menor temperatura, mayor masa de semivolátiles condensa en fase particulada PM₂.₅."
        >
          <div className="flex items-center gap-2 cursor-help">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <div>
              <span className="text-slate-400 block">Ecuación de Particionamiento Pankow:</span>
              <span className="text-emerald-300 font-bold">Fᵢ = [1 + Cᵢ*(T) / C_OA]⁻¹</span>
            </div>
          </div>
        </ScientificTooltip>

        <ScientificTooltip topic="aerosol_multimodal_distribution"
          width="w-72"
          content="Ecuación integrada de Clausius-Clapeyron con entalpía efectiva de vaporización ΔH_vap = 70 kJ/mol. Ajusta logarítmicamente la volatilidad de saturación C* ante los gradientes térmicos de Málaga (efecto terral vs brisa marina)."
        >
          <div className="flex items-center gap-2 cursor-help">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <div>
              <span className="text-slate-400 block">Ajuste Clausius-Clapeyron:</span>
              <span className="text-cyan-300 font-bold">ΔH_vap = 70.0 kJ/mol (C*(T))</span>
            </div>
          </div>
        </ScientificTooltip>
      </div>

      {/* Síntesis Geográfica de Zonas Emisoras de Málaga */}
      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 text-[10px] space-y-1">
        <div className="flex items-center justify-between text-slate-300 font-bold border-b border-slate-800/60 pb-1">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <MapPin className="w-3.5 h-3.5" />
            Producción VBS en la Cuenca de Málaga: {vbsSummary.totalSoaProductionKgH} kg/h SOA
          </span>
          <span className="font-mono text-slate-400 text-[9px]">OH•: {vbsSummary.ohRadicalConcMolecCm3.toExponential(2)} moléc/cm³</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
          {vbsSummary.zones.map(z => (
            <div key={z.zoneId} className="bg-slate-950/70 p-1.5 rounded border border-slate-800/80 text-[9.5px]">
              <span className="text-slate-200 font-semibold block truncate">{z.zoneName}</span>
              <span className="text-cyan-400 font-mono">SOA: {z.soaProductionUgm3} µg/m³</span>
              <span className="text-slate-500 text-[8.5px] block font-mono">BVOC: {z.bvocEmissionKgH} kg/h</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
