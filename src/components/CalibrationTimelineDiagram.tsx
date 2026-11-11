import React from 'react';
import { ScientificTooltip } from './ScientificTooltip';

export const CalibrationTimelineDiagram: React.FC = () => {
  

  

  return (
    <div className="w-full bg-[#020617] border border-slate-800 rounded p-2 relative overflow-hidden mb-3">
      <h3 className="text-center text-[10px] text-emerald-400 font-mono font-bold tracking-widest mb-2 uppercase"><ScientificTooltip topic="official_monitoring_network">
        Trazabilidad Analítica y Registros de Calibración
      </ScientificTooltip></h3>
      
      <div className="relative w-full h-[100px] flex justify-center items-center">
        <svg width="100%" height="100%" viewBox="0 0 600 100" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="glow-emerald">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* BACKGROUND TIMELINE AXIS */}
          <path d="M 50 50 L 550 50" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          
          {/* STATIC TICK MARKS */}
          {[100, 200, 300, 400, 500].map(x => (
             <g key={x} transform={`translate(${x}, 50)`}>
               <line x1="0" y1="-5" x2="0" y2="5" stroke="#334155" strokeWidth="2" />
               <circle cx="0" cy="0" r="4" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
             </g>
          ))}

          {/* ACTIVE ANIMATED SCROLLING TIMELINE */}
          <g>
             {/* Left bound mask effect using simple logic */}
             <path d="M 50 50 L 550 50" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="10 20">
               <animate attributeName="stroke-dashoffset" from="0" to="-200" dur="2s" repeatCount="indefinite" />
             </path>
          </g>

          {/* CALIBRATION NODES (Popping up based on frame) */}
          <g transform="translate(200, 50)" opacity="1" filter="url(#glow-emerald)">
             <circle cx="0" cy="0" r="6" fill="#020617" stroke="#10b981" strokeWidth="2" />
             <line x1="0" y1="-6" x2="0" y2="-20" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />
             <rect x="-30" y="-35" width="60" height="15" fill="#0f172a" stroke="#10b981" strokeWidth="1" rx="2" />
             <text x="0" y="-25" fill="#10b981" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">CALIB_01</text>
          </g>

          <g transform="translate(350, 50)" opacity="1" filter="url(#glow-emerald)">
             <circle cx="0" cy="0" r="6" fill="#020617" stroke="#10b981" strokeWidth="2" />
             <line x1="0" y1="6" x2="0" y2="20" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />
             <rect x="-30" y="20" width="60" height="15" fill="#0f172a" stroke="#10b981" strokeWidth="1" rx="2" />
             <text x="0" y="30" fill="#10b981" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">CALIB_02</text>
          </g>

          <g transform="translate(500, 50)" opacity="1" filter="url(#glow-emerald)">
             <circle cx="0" cy="0" r="8" fill="#10b981" stroke="#34d399" strokeWidth="2" />
             <circle cx="0" cy="0" r="14" fill="none" stroke="#10b981" strokeWidth="1">
               <animate attributeName="r" values="8;16;8" dur="1s" repeatCount="indefinite" />
               <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
             </circle>
             <line x1="0" y1="-8" x2="0" y2="-20" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />
             <rect x="-35" y="-35" width="70" height="15" fill="#10b981" stroke="#34d399" strokeWidth="1" rx="2" />
             <text x="0" y="-25" fill="#020617" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">CURRENT_STATE</text>
          </g>
          
        </svg>
      </div>
    </div>
  );
};
