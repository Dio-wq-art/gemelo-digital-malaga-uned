import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Cpu, Activity, Download, BarChart3, HelpCircle, Sparkles, Layers, RefreshCw } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { downloadVectorSvg } from '../lib/vectorExporter';

export interface SobolDiagramProps {
  targetVar: string;
  sampleN: number;
  indices: Array<{
    paramId: string;
    paramName: string;
    simbolo: string;
    firstOrderSi: number;
    totalOrderSTi: number;
    interactionDelta: number;
    clasificacion: 'Dominante' | 'Sustancial' | 'Secundario' | 'Despreciable';
  }>;
}

export const SobolVarianceDecompositionDiagram: React.FC<SobolDiagramProps> = ({
  targetVar,
  sampleN,
  indices
}) => {
  const [selectedParamIndex, setSelectedParamIndex] = useState<number>(0);

  const selectedIndex = indices[selectedParamIndex] || indices[0];

  const handleExportSvg = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 380" width="760" height="380" font-family="system-ui, sans-serif">
      <defs>
        <linearGradient id="sobolBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#090d16" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#sobolBg)" rx="8" />
      <text x="30" y="36" fill="#c084fc" font-size="14" font-weight="bold">DESCOMPOSICIÓN GLOBAL DE VARIANZA DE SOBOL (SALTELLI 2008)</text>
      <text x="30" y="56" fill="#94a3b8" font-size="10">Target: ${targetVar} • Muestreo Quasi-Monte Carlo N = ${sampleN}</text>
      ${indices.map((idx, i) => `
        <g transform="translate(40, ${90 + i * 42})">
          <rect width="200" height="34" fill="#1e293b" stroke="#6b21a8" rx="4" />
          <text x="12" y="21" fill="#e2e8f0" font-size="10" font-weight="bold">${idx.simbolo}: ${idx.paramName}</text>
          <!-- Si Bar -->
          <rect x="220" y="5" width="${idx.firstOrderSi * 260}" height="10" fill="#a855f7" rx="2" />
          <text x="${225 + idx.firstOrderSi * 260}" y="14" fill="#d8b4fe" font-size="8.5">S_i=${idx.firstOrderSi}</text>
          <!-- STi Bar -->
          <rect x="220" y="18" width="${idx.totalOrderSTi * 260}" height="10" fill="#f59e0b" rx="2" />
          <text x="${225 + idx.totalOrderSTi * 260}" y="27" fill="#fde68a" font-size="8.5">S_Ti=${idx.totalOrderSTi}</text>
        </g>
      `).join('')}
    </svg>`;
    downloadVectorSvg(svgContent, `Sobol_Variance_Decomposition_${targetVar}_${Date.now()}.svg`);
  };

  return (
    <div className="bg-slate-950 border border-purple-900/60 rounded-lg p-3 space-y-3 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400 animate-pulse" />
          <div>
            <span className="text-purple-300 font-bold uppercase tracking-wider text-[10px] font-mono">
              Espectro de Varianza Global de Sobol (Saltelli 2008)
            </span>
            <span className="text-[8px] text-slate-400 block font-mono">
              Sensibilidad PINN • Target: {targetVar} • Matriz N*(2k+2) = {sampleN}
            </span>
          </div>
        </div>

        <ScientificTooltip topic="gum_uncertainty_budget"
          width="w-64"
          content="Exportación en vector vectorial SVG con el espectro dual de índices de Sobol (S_i vs S_Ti), delta de interacción no lineal y varianza explicada según metodología de Saltelli 2008."
        >
          <button
            onClick={handleExportSvg}
            className="px-2 py-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-700/80 text-purple-300 rounded text-[8px] font-bold flex items-center gap-1 transition-colors font-mono"
          >
            <Download className="w-2.5 h-2.5 text-purple-400" /> Vector SVG
          </button>
        </ScientificTooltip>
      </div>

      {/* Main Interactive Diagram: Dual Spectrum S_i vs S_Ti */}
      <div className="space-y-2 font-mono">
        {indices.map((idx, i) => {
          const isSelected = selectedParamIndex === i;
          return (
            <ScientificTooltip topic="gum_uncertainty_budget"
              key={idx.simbolo}
              width="w-80"
              content={`Parámetro físico-químico ${idx.simbolo} (${idx.paramName}). Índice de primer orden S_i=${idx.firstOrderSi} (contribución directa a la varianza de salida sin interacciones). Índice de efecto total S_Ti=${idx.totalOrderSTi} (incluye acoplamientos no lineales de orden superior con otros parámetros del modelo PINN).`}
            >
              <div
                onClick={() => setSelectedParamIndex(i)}
                className={`p-2 rounded border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.25)]'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between text-[9px] mb-1">
                  <span className="font-bold text-slate-200">
                    <strong className="text-purple-400 font-mono">{idx.simbolo}</strong> — {idx.paramName}
                  </span>
                  <span className="text-slate-400 text-[8px]">
                    Interacción No Lineal: <strong className="text-amber-400">ΔS = +{idx.interactionDelta}</strong>
                  </span>
                </div>

                {/* Dual Bar Comparison: Si (First Order) vs STi (Total Order) */}
                <div className="space-y-1">
                  {/* First-Order Bar (Si) */}
                  <div className="flex items-center gap-2 text-[8px]">
                    <span className="w-14 text-purple-300">Sᵢ (Directo):</span>
                    <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(168,85,247,0.8)]"
                        style={{ width: `${idx.firstOrderSi * 100}%` }}
                      />
                    </div>
                    <span className="w-10 font-bold text-right text-purple-300">{(idx.firstOrderSi * 100).toFixed(1)}%</span>
                  </div>

                  {/* Total-Order Bar (STi) */}
                  <div className="flex items-center gap-2 text-[8px]">
                    <span className="w-14 text-amber-300">S_Ti (Total):</span>
                    <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]"
                        style={{ width: `${idx.totalOrderSTi * 100}%` }}
                      />
                    </div>
                    <span className="w-10 font-bold text-right text-amber-300">{(idx.totalOrderSTi * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </ScientificTooltip>
          );
        })}
      </div>

      {/* Selected Parameter Details */}
      <ScientificTooltip topic="gum_uncertainty_budget"
        width="w-80"
        content="Descomposición ortogonal ANOVA de varianza: Var(Y) = Σ V_i + Σ V_ij + ... + V_12..k. Permite identificar qué parámetros reducen más la incertidumbre diagnóstica si se calibran con mayor precisión en campo."
      >
        <div className="bg-slate-900/80 border border-purple-900/50 p-2.5 rounded font-mono text-[8.5px] space-y-1 cursor-help">
          <div className="flex justify-between items-center text-purple-300 border-b border-slate-800 pb-1">
            <strong className="text-white text-[9.5px]">{selectedIndex.paramName} ({selectedIndex.simbolo})</strong>
            <span>Varianza Explicada Directa: <strong className="text-purple-400 font-bold">{selectedIndex.firstOrderSi}</strong></span>
          </div>
          <p className="text-slate-300 text-[8px]">Clasificación de Sensibilidad Global: <strong className="text-amber-400">{selectedIndex.clasificacion}</strong></p>
          <div className="flex justify-between text-[7.5px] text-slate-400 pt-0.5">
            <span>Efecto Principal V(E[Y|Xᵢ]): {selectedIndex.firstOrderSi}</span>
            <span>Interacciones No Lineales Σ V(Xᵢ, Xⱼ): {selectedIndex.interactionDelta}</span>
          </div>
        </div>
      </ScientificTooltip>
    </div>
  );
};
