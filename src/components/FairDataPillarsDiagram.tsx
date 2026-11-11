import React from 'react';
import { motion } from 'motion/react';
import { Database, Search, Unlock, Shuffle, RefreshCw, ShieldCheck, CheckCircle2, FileJson, FileSpreadsheet } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';

export const FairDataPillarsDiagram: React.FC = () => {
  const width = 380;
  const height = 150;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 space-y-2 font-sans shadow-inner">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded bg-cyan-500/10 border border-cyan-500/30">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-200 block">Arquitectura FAIR (Ciencia Abierta)</span>
            <span className="text-[9px] text-slate-400">Principios de Wilkinson et al. (2016) • EOSC Ready</span>
          </div>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded border bg-emerald-950/80 text-emerald-300 border-emerald-700">
          ODbL / CC-BY 4.0
        </span>
      </div>

      {/* SVG Pipeline Diagram */}
      <div className="relative w-full overflow-hidden bg-slate-900/60 rounded border border-slate-800/60">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none" id="fair-pillars-svg">
          <defs>
            <linearGradient id="fairLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="33%" stopColor="#10b981" />
              <stop offset="66%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            <filter id="fairGlow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Bus line connecting all 4 pillars */}
          <line x1="45" y1="75" x2="335" y2="75" stroke="url(#fairLineGrad)" strokeWidth="2.5" strokeDasharray="4 3" opacity="0.6" />

          {/* Animated data pulses moving along bus */}
          <circle cx="0" cy="0" r="3" fill="#38bdf8" filter="url(#fairGlow)">
            <animateMotion path="M 45 75 L 335 75" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="0" cy="0" r="3" fill="#34d399" filter="url(#fairGlow)">
            <animateMotion path="M 45 75 L 335 75" dur="3s" begin="1.5s" repeatCount="indefinite" />
          </circle>

          {/* PILLAR 1: FINDABLE (F) */}
          <g transform="translate(45, 75)">
            <circle cx="0" cy="0" r="24" fill="#083344" stroke="#06b6d4" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="18" fill="#0e7490" opacity="0.5" />
            <text x="0" y="4" fill="#67e8f9" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">F</text>
            <text x="0" y="-30" fill="#22d3ee" fontSize="8" fontWeight="bold" textAnchor="middle">Findable</text>
            <text x="0" y="38" fill="#94a3b8" fontSize="7" textAnchor="middle" fontFamily="monospace">DOI / Metadatos</text>
          </g>

          {/* PILLAR 2: ACCESSIBLE (A) */}
          <g transform="translate(140, 75)">
            <circle cx="0" cy="0" r="24" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="18" fill="#047857" opacity="0.5" />
            <text x="0" y="4" fill="#6ee7b7" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">A</text>
            <text x="0" y="-30" fill="#34d399" fontSize="8" fontWeight="bold" textAnchor="middle">Accessible</text>
            <text x="0" y="38" fill="#94a3b8" fontSize="7" textAnchor="middle" fontFamily="monospace">REST / GeoJSON</text>
          </g>

          {/* PILLAR 3: INTEROPERABLE (I) */}
          <g transform="translate(235, 75)">
            <circle cx="0" cy="0" r="24" fill="#3b0764" stroke="#a855f7" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="18" fill="#7e22ce" opacity="0.5" />
            <text x="0" y="4" fill="#d8b4fe" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">I</text>
            <text x="0" y="-30" fill="#c084fc" fontSize="8" fontWeight="bold" textAnchor="middle">Interoperable</text>
            <text x="0" y="38" fill="#94a3b8" fontSize="7" textAnchor="middle" fontFamily="monospace">RFC 7946 / CSV</text>
          </g>

          {/* PILLAR 4: REUSABLE (R) */}
          <g transform="translate(330, 75)">
            <circle cx="0" cy="0" r="24" fill="#451a03" stroke="#f59e0b" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="18" fill="#b45309" opacity="0.5" />
            <text x="0" y="4" fill="#fcd34d" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">R</text>
            <text x="0" y="-30" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="middle">Reusable</text>
            <text x="0" y="38" fill="#94a3b8" fontSize="7" textAnchor="middle" fontFamily="monospace">Licencia Libre</text>
          </g>
        </svg>
      </div>

      {/* 4 Interactive Pillars Explanation */}
      <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
        <ScientificTooltip topic="gum_uncertainty_budget"
          position="top"
          width="w-[240px]"
          content="Findable: Identificador unívoco y metadatos estructurados compatibles con catálogos OGC/INSPIRE."
        >
          <div className="p-1.5 bg-slate-900 border border-cyan-900/60 rounded flex items-center gap-1.5 cursor-help">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span className="text-slate-300"><strong>F</strong>indable (Metadatos)</span>
          </div>
        </ScientificTooltip>

        <ScientificTooltip topic="gum_uncertainty_budget"
          position="top"
          width="w-[240px]"
          content="Accessible: Protocolos abiertos estandarizados sin autenticación opaca ni bloqueos propietarios."
        >
          <div className="p-1.5 bg-slate-900 border border-emerald-900/60 rounded flex items-center gap-1.5 cursor-help">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300"><strong>A</strong>ccessible (API / HTTP)</span>
          </div>
        </ScientificTooltip>

        <ScientificTooltip topic="gum_uncertainty_budget"
          position="top"
          width="w-[240px]"
          content="Interoperable: Formatos abiertos universales RFC 7946 (GeoJSON) y RFC 4180 (CSV) listos para SIG (QGIS/ArcGIS)."
        >
          <div className="p-1.5 bg-slate-900 border border-purple-900/60 rounded flex items-center gap-1.5 cursor-help">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            <span className="text-slate-300"><strong>I</strong>nteroperable (QGIS/GIS)</span>
          </div>
        </ScientificTooltip>

        <ScientificTooltip topic="gum_uncertainty_budget"
          position="top"
          width="w-[240px]"
          content="Reusable: Código y conjuntos de datos reproducibles con procedencia mecanicista determinista y licencia abierta."
        >
          <div className="p-1.5 bg-slate-900 border border-amber-900/60 rounded flex items-center gap-1.5 cursor-help">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span className="text-slate-300"><strong>R</strong>eusable (Reproducible)</span>
          </div>
        </ScientificTooltip>
      </div>
    </div>
  );
};
