import React from 'react';
import { ScientificTooltip } from './ScientificTooltip';

export const SeaBreezeCirculationDiagram: React.FC = () => {
  

  

  return (
    <div className="w-full bg-[#020617] border border-slate-800 rounded p-2 relative overflow-hidden mb-3">
      <h3 className="text-center text-[10px] text-cyan-400 font-mono font-bold tracking-widest mb-2 uppercase"><ScientificTooltip topic="coastal_sea_breeze_circulation">
        Célula Convectiva: Brisa Marina Diurna (Bahía de Málaga)
      </ScientificTooltip></h3>
      
      <div className="relative w-full h-[150px] flex justify-center items-center">
        <svg width="100%" height="100%" viewBox="0 0 600 150" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="glow-heat">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="glow-cool">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* TERRAIN: SEA (Left) and LAND (Right) */}
          <path d="M 0 130 L 300 130" fill="none" stroke="#0ea5e9" strokeWidth="4" />
          <path d="M 300 130 L 600 130" fill="none" stroke="#d97706" strokeWidth="4" />
          <text x="150" y="145" fill="#0ea5e9" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">MAR DE ALBORÁN (Frío)</text>
          <text x="450" y="145" fill="#d97706" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">SUELO CONTINENTAL (Caliente)</text>

          {/* SUN */}
          <circle cx="500" cy="30" r="15" fill="#facc15" filter="url(#glow-heat)">
            <animate attributeName="r" values="14;16;14" dur="2s" repeatCount="indefinite" />
          </circle>
          <path d="M 500 5 L 500 10 M 500 50 L 500 55 M 475 30 L 480 30 M 520 30 L 525 30 M 482 12 L 485 15 M 515 45 L 518 48 M 482 48 L 485 45 M 515 12 L 518 15" stroke="#facc15" strokeWidth="2" />

          {/* CIRCULATION CELL (The loop) */}
          {/* Bottom (Sea to Land): Cool Breeze */}
          <path d="M 200 115 L 400 115" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 6" />
          {/* Right (Updraft over land): Thermals */}
          <path d="M 450 110 C 450 60, 420 40, 380 40" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 6" />
          {/* Top (Land to Sea): Return flow */}
          <path d="M 350 40 L 200 40" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 6" />
          {/* Left (Downdraft over sea): Subsidence */}
          <path d="M 150 40 C 150 70, 150 115, 180 115" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 6" />

          {/* ANIMATED PARTICLES ON THE LOOP */}
          <g>
            {/* Sea Breeze (Surface) */}
            <circle cx="0" cy="0" r="4" fill="#38bdf8" filter="url(#glow-cool)">
              <animateMotion path="M 150 115 L 420 115" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="0" r="4" fill="#38bdf8" filter="url(#glow-cool)">
              <animateMotion path="M 150 115 L 420 115" dur="3s" begin="1.5s" repeatCount="indefinite" />
            </circle>

            {/* Updraft (Land) */}
            <circle cx="0" cy="0" r="4" fill="#ef4444" filter="url(#glow-heat)">
              <animateMotion path="M 450 110 C 450 60, 420 40, 380 40" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="0" r="4" fill="#ef4444" filter="url(#glow-heat)">
              <animateMotion path="M 450 110 C 450 60, 420 40, 380 40" dur="2s" begin="1s" repeatCount="indefinite" />
            </circle>

            {/* Return Flow (Aloft) */}
            <circle cx="0" cy="0" r="4" fill="#94a3b8">
              <animateMotion path="M 380 40 L 150 40" dur="3s" repeatCount="indefinite" />
            </circle>

            {/* Subsidence (Sea) */}
            <circle cx="0" cy="0" r="4" fill="#0ea5e9" filter="url(#glow-cool)">
              <animateMotion path="M 150 40 C 150 70, 150 115, 180 115" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* TEXT LABELS */}
          <text x="300" y="105" fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">Advección Contaminantes Tierra Adentro (Brisa)</text>
          <text x="480" y="80" fill="#ef4444" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">Ascenso Térmico</text>
          <text x="250" y="30" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">Flujo de Retorno (Capa de Mezcla)</text>
          <text x="100" y="80" fill="#0ea5e9" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">Subsidencia</text>

        </svg>
      </div>
    </div>
  );
};
