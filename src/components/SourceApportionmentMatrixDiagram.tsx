import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PieChart as PieIcon, Truck, Anchor, Sun, Waves, Sparkles, Download, Layers, Activity } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { downloadVectorSvg } from '../lib/vectorExporter';

export interface SourceApportionmentDiagramProps {
  receptorName: string;
  totalPM25: number;
  contributions: Array<{
    sourceId: string;
    sourceName: string;
    category?: string;
    percentage: number;
    massContributionUgm3: number;
    primaryChemicalMarker?: string;
    uncertaintyUgm3: number;
  }>;
}

export const SourceApportionmentMatrixDiagram: React.FC<SourceApportionmentDiagramProps> = ({
  receptorName,
  totalPM25,
  contributions
}) => {
  const [selectedSourceId, setSelectedSourceId] = useState<string>(contributions[0]?.sourceId || 'traffic');

  const sourceMetadata: Record<string, { color: string; icon: any; category: string; description: string }> = {
    traffic: {
      color: '#ef4444',
      icon: Truck,
      category: 'Tráfico Rodado y Desgaste',
      description: 'Emisiones de escape COPERT 5 + Desgaste de frenos/neumáticos (Cu, Sb, Ba, EC/OC).'
    },
    shipping: {
      color: '#3b82f6',
      icon: Anchor,
      category: 'Tráfico Marítimo & Portuario',
      description: 'Combustión de fuelóleo pesado en buques y cruceros (V, Ni, SO₄²⁻).'
    },
    sahara_dust: {
      color: '#f59e0b',
      icon: Sun,
      category: 'Polvo Mineral Sahariano',
      description: 'Intrusión de polvo sahariano del norte de África en microescala litoral (Al, Si, Ca, Fe).'
    },
    sea_salt: {
      color: '#10b981',
      icon: Waves,
      category: 'Aerosol Marino Primario',
      description: 'Spray marino costero generado por el oleaje en la bahía de Málaga (Na⁺, Cl⁻, Mg²⁺).'
    },
    secondary_inorganic: {
      color: '#8b5cf6',
      icon: Sparkles,
      category: 'Aerosol Secundario Inorgánico (SIA)',
      description: 'Formación de sulfato amónico y nitrato amónico ((NH₄)₂SO₄, NH₄NO₃).'
    }
  };

  const selectedSource = contributions.find(c => c.sourceId === selectedSourceId) || contributions[0];
  const currentMeta = sourceMetadata[selectedSource?.sourceId] || sourceMetadata.traffic;

  const handleExportSvg = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 400" width="760" height="400" font-family="system-ui, sans-serif">
      <defs>
        <linearGradient id="cmbBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#090d16" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#cmbBg)" rx="8" />
      <text x="30" y="36" fill="#818cf8" font-size="14" font-weight="bold">MODELIZACIÓN DE RECEPTORES (EPA PMF 5.0 / CHEMICAL MASS BALANCE)</text>
      <text x="30" y="56" fill="#94a3b8" font-size="10">Receptor: ${receptorName} • Masa Total PM2.5 = ${totalPM25} µg/m³</text>
      ${contributions.map((c, idx) => {
        const meta = sourceMetadata[c.sourceId] || sourceMetadata.traffic;
        return `
          <g transform="translate(40, ${90 + idx * 56})">
            <rect width="260" height="46" fill="#1e293b" stroke="${meta.color}" stroke-width="1.5" rx="4" />
            <text x="12" y="20" fill="#f8fafc" font-size="10" font-weight="bold">${c.sourceName}</text>
            <text x="12" y="35" fill="${meta.color}" font-size="9">${c.percentage}% (${c.massContributionUgm3} µg/m³)</text>
            <line x1="260" y1="23" x2="480" y2="120" stroke="${meta.color}" stroke-width="${Math.max(1, c.percentage / 8)}" stroke-dasharray="4 2" opacity="0.7" />
          </g>
        `;
      }).join('')}
      <!-- Receptor Box -->
      <g transform="translate(500, 160)">
        <rect width="220" height="120" fill="#0f172a" stroke="#6366f1" stroke-width="2" rx="6" />
        <text x="110" y="30" fill="#c7d2fe" font-size="12" font-weight="bold" text-anchor="middle">FILTRO RECEPTOR URBANO</text>
        <text x="110" y="50" fill="#94a3b8" font-size="9" text-anchor="middle">${receptorName}</text>
        <text x="110" y="85" fill="#38bdf8" font-size="18" font-weight="bold" text-anchor="middle">${totalPM25} µg/m³</text>
      </g>
    </svg>`;
    downloadVectorSvg(svgContent, `Source_Apportionment_CMB_${selectedSourceId}_${Date.now()}.svg`);
  };

  return (
    <div className="bg-slate-950 border border-indigo-900/60 rounded-lg p-3 space-y-3 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-indigo-400 animate-pulse" />
          <div>
            <span className="text-indigo-300 font-bold uppercase tracking-wider text-[10px] font-mono">
              Flujo de Atribución de Fuentes (EPA-PMF 5.0 / Balance de Masa Químico)
            </span>
            <span className="text-[8px] text-slate-400 block font-mono">
              Receptor: {receptorName} • Masa Total PM₂.₅ = {totalPM25} µg/m³
            </span>
          </div>
        </div>

        <ScientificTooltip topic="aerosol_multimodal_distribution"
          width="w-64"
          content="Exportación en vector vectorial SVG con el diagrama de convergencia espectral, flujos de trazadores y contribuciones de masa PM₂.₅ conforme al protocolo de reporte FAIRMODE WG1."
        >
          <button
            onClick={handleExportSvg}
            className="px-2 py-1 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-300 rounded text-[8px] font-bold flex items-center gap-1 transition-colors font-mono"
          >
            <Download className="w-2.5 h-2.5 text-indigo-400" /> Vector SVG
          </button>
        </ScientificTooltip>
      </div>

      {/* Interactive Flow Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Side: 5 Chemical Source Profiles */}
        <div className="lg:col-span-6 space-y-1.5 font-mono">
          {contributions.map((c) => {
            const meta = sourceMetadata[c.sourceId] || sourceMetadata.traffic;
            const Icon = meta.icon;
            const isSelected = selectedSourceId === c.sourceId;

            return (
              <ScientificTooltip topic="aerosol_multimodal_distribution"
                key={c.sourceId}
                width="w-72"
                content={`Perfil de fuente ${c.sourceName}. Trazador diagnóstico: ${c.primaryChemicalMarker || 'Marcadores químicos certificados'}. Aporte másico: ${c.massContributionUgm3} ± ${c.uncertaintyUgm3} µg/m³ (${c.percentage}% de la masa total PM₂.₅ en ${receptorName}).`}
              >
                <div
                  onClick={() => setSelectedSourceId(c.sourceId)}
                  className={`p-2 rounded border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="p-1.5 rounded"
                      style={{ backgroundColor: `${meta.color}20`, border: `1px solid ${meta.color}80` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold block text-slate-200">{c.sourceName}</span>
                      <span className="text-[7.5px] text-slate-400 block">
                        Trazador: {c.primaryChemicalMarker || 'Marcador certificado'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-bold block" style={{ color: meta.color }}>
                      {c.percentage}%
                    </span>
                    <span className="text-[7.5px] text-slate-400 block">
                      {c.massContributionUgm3} ± {c.uncertaintyUgm3} µg/m³
                    </span>
                  </div>
                </div>
              </ScientificTooltip>
            );
          })}
        </div>

        {/* Right Side: Active Mass Convergence Stage & Particle Stream */}
        <div className="lg:col-span-6 bg-[#070b14] border border-slate-800 rounded p-3 flex flex-col justify-between relative overflow-hidden font-mono">
          {/* Background Chemical Beams Canvas */}
          <div className="relative h-44 w-full flex items-center justify-center">
            {/* Animated Dynamic Stream Beams */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {contributions.map((c, idx) => {
                const meta = sourceMetadata[c.sourceId] || sourceMetadata.traffic;
                const startY = 25 + idx * 28;
                return (
                  <g key={c.sourceId}>
                    <path
                      d={`M 10 ${startY} C 100 ${startY}, 140 88, 240 88`}
                      fill="none"
                      stroke={meta.color}
                      strokeWidth={Math.max(1.5, (c.percentage / 100) * 8)}
                      strokeDasharray="4 2"
                      opacity="0.8"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Particle pulses animation */}
            <div className="absolute inset-0 pointer-events-none">
              {contributions.map((c, idx) => {
                const meta = sourceMetadata[c.sourceId] || sourceMetadata.traffic;
                const startY = 25 + idx * 28;
                return (
                  <motion.div
                    key={c.sourceId}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: meta.color,
                      boxShadow: `0 0 6px ${meta.color}`,
                      left: 10,
                      top: startY - 4
                    }}
                    animate={{
                      x: [0, 90, 230],
                      y: [0, (88 - startY) * 0.6, 88 - startY],
                      opacity: [0.9, 0.7, 0]
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: idx * 0.4
                    }}
                  />
                );
              })}
            </div>

            {/* Central Receptor Station Node */}
            <ScientificTooltip topic="aerosol_multimodal_distribution"
              width="w-64"
              content={`Estación receptora ${receptorName}. Concentración total de masa aerosol reconstituida: ${totalPM25} µg/m³ PM₂.₅ por resolución multivariable de mínimos cuadrados ponderados.`}
            >
              <div className="relative z-10 w-28 h-28 bg-slate-900/90 border-2 border-indigo-500 rounded-full flex flex-col items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] cursor-help">
                <span className="text-[7.5px] text-indigo-300 uppercase tracking-widest font-bold">RECEPTOR</span>
                <span className="text-[15px] font-bold text-white my-0.5">{totalPM25}</span>
                <span className="text-[7px] text-slate-400">µg/m³ PM₂.₅</span>
              </div>
            </ScientificTooltip>
          </div>

          {/* Selected Source Diagnostic Inspector */}
          <ScientificTooltip topic="aerosol_multimodal_distribution"
            width="w-72"
            content={`${currentMeta.description} Clasificación basada en perfiles de referencia certificados CSIC / EMEP para el sur de Europa.`}
          >
            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded text-[8px] space-y-1 cursor-help">
              <div className="flex justify-between items-center text-slate-300">
                <strong style={{ color: currentMeta.color }}>{selectedSource.sourceName}</strong>
                <span className="text-white font-bold">{selectedSource.massContributionUgm3} µg/m³ ({selectedSource.percentage}%)</span>
              </div>
              <p className="text-slate-400 text-[7.5px]">{currentMeta.description}</p>
            </div>
          </ScientificTooltip>
        </div>
      </div>
    </div>
  );
};
