import React from 'react';
import { ScientificTooltip } from './ScientificTooltip';

export const SaharaDustTransportDiagram: React.FC = () => {
  

  return (
    <div className="w-full bg-[#020617] border border-slate-800 rounded p-2 relative overflow-hidden mb-3">
      <h3 className="text-center text-[10px] text-amber-500 font-mono font-bold tracking-widest mb-2 uppercase"><ScientificTooltip topic="aod_optical_depth">
        Intrusión Sahariana (Capa de Aire Sahariano - SAL) - Transporte Transmediterráneo
      </ScientificTooltip></h3>
      
      <div className="relative w-full h-[150px] flex justify-center items-center">
        <svg width="100%" height="100%" viewBox="0 0 600 150" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="glow-dust">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="sal-layer" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.8"/>
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.5"/>
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.1"/>
            </linearGradient>
          </defs>

          {/* TERRAIN: AFRICA (Left), MEDITERRANEAN (Middle), MALAGA/IBERIA (Right) */}
          <path d="M 0 130 L 150 130" fill="none" stroke="#b45309" strokeWidth="6" />
          <path d="M 150 130 C 200 130, 250 140, 300 140 C 350 140, 400 130, 450 130" fill="none" stroke="#0ea5e9" strokeWidth="4" />
          <path d="M 450 130 L 600 130" fill="none" stroke="#65a30d" strokeWidth="6" />
          
          <text x="75" y="145" fill="#b45309" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">N. ÁFRICA (Sahara)</text>
          <text x="300" y="145" fill="#0ea5e9" fontSize="9" fontFamily="monospace" textAnchor="middle">Mar Mediterráneo</text>
          <text x="525" y="145" fill="#65a30d" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">MÁLAGA (Península)</text>

          {/* ATMOSPHERIC LAYERS */}
          <path d="M 0 50 C 200 50, 400 60, 600 80" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" />
          <text x="500" y="70" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">Capa Límite (PBL)</text>

          {/* SAL LAYER GRADIENT PATH */}
          <path d="M -50 20 C 150 -10, 350 10, 500 70 L 600 90 L 600 20 Z" fill="url(#sal-layer)" opacity="0.3" />

          {/* DUST PARTICLES (Animated) */}
          <g>
            {/* Upper Transport */}
            <circle cx="0" cy="0" r="3" fill="#fbbf24" filter="url(#glow-dust)">
              <animateMotion path="M 0 20 C 150 -10, 350 10, 500 70" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="0" r="3" fill="#f59e0b" filter="url(#glow-dust)">
              <animateMotion path="M 0 20 C 150 -10, 350 10, 500 70" dur="4s" begin="2s" repeatCount="indefinite" />
            </circle>

            {/* Mid Transport (Subsidence into Malaga) */}
            <circle cx="0" cy="0" r="2" fill="#d97706">
              <animateMotion path="M 0 40 C 200 20, 400 40, 550 100 L 550 130" dur="5s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="0" r="2.5" fill="#b45309">
              <animateMotion path="M 0 40 C 200 20, 400 40, 550 100 L 550 130" dur="5s" begin="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="0" r="2" fill="#d97706">
              <animateMotion path="M 0 40 C 200 20, 400 40, 550 100 L 550 130" dur="5s" begin="3s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* SENSOR / RECEPTOR IN MALAGA */}
          <g transform="translate(530, 100)">
            <rect x="0" y="0" width="30" height="30" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" rx="2" />
            <circle cx="15" cy="15" r="8" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="2 2">
              <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <text x="15" y="38" fill="#fbbf24" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">PM10 / PM2.5</text>
          </g>

          {/* WIND VECTORS */}
          <g stroke="#64748b" strokeWidth="1.5" opacity="0.5">
            <path d="M 100 20 L 140 10 M 135 5 L 140 10 L 130 13" />
            <path d="M 250 15 L 290 20 M 285 15 L 290 20 L 280 23" />
            <path d="M 400 35 L 440 50 M 435 43 L 440 50 L 430 52" />
          </g>

          {/* TEXT LABELS */}
          <text x="250" y="40" fill="#f59e0b" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold" filter="url(#glow-dust)">Capa de Aire Sahariano (SAL)</text>
          <text x="450" y="100" fill="#fbbf24" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">Subsidencia y Mezcla</text>

        </svg>
      </div>
    </div>
  );
};
