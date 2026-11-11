import React from 'react';
import { ScientificTooltip } from './ScientificTooltip';

export const LatexCompilationDiagram: React.FC = () => {
  

  

  return (
    <div className="w-full bg-[#020617] border border-slate-800 rounded p-2 relative overflow-hidden mb-3">
      <h3 className="text-center text-[10px] text-orange-400 font-mono font-bold tracking-widest mb-2 uppercase"><ScientificTooltip topic="acute_episode_protocol">
        Exportador de Tesis Doctoral (LaTeX / PDF)
      </ScientificTooltip></h3>
      
      <div className="relative w-full h-[120px] flex justify-center items-center">
        <svg width="100%" height="100%" viewBox="0 0 600 120" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="glow-orange">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="compile-bus" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.2"/>
              <stop offset="50%" stopColor="#fb923c" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.2"/>
            </linearGradient>
          </defs>

          {/* DATA SOURCES */}
          <g transform="translate(20, 20)">
            <rect x="0" y="0" width="80" height="20" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" rx="2" />
            <text x="40" y="14" fill="#38bdf8" fontSize="8" fontFamily="monospace" textAnchor="middle">GeoJSON</text>
            
            <rect x="0" y="30" width="80" height="20" fill="#0f172a" stroke="#10b981" strokeWidth="1" rx="2" />
            <text x="40" y="44" fill="#10b981" fontSize="8" fontFamily="monospace" textAnchor="middle">Fairmode CSV</text>
            
            <rect x="0" y="60" width="80" height="20" fill="#0f172a" stroke="#a855f7" strokeWidth="1" rx="2" />
            <text x="40" y="74" fill="#a855f7" fontSize="8" fontFamily="monospace" textAnchor="middle">Sobol Sens</text>
          </g>

          {/* PARSER LINES */}
          <path d="M 100 30 L 150 50" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M 100 60 L 150 60" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M 100 90 L 150 70" fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="2 2" />

          {/* TEX GENERATOR NODE */}
          <g transform="translate(150, 40)">
            <rect x="0" y="0" width="100" height="40" fill="#0f172a" stroke="#f97316" strokeWidth="1.5" rx="4" />
            <text x="50" y="16" fill="#f97316" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">Auto-TeX</text>
            <text x="50" y="28" fill="#fb923c" fontSize="7" fontFamily="monospace" textAnchor="middle">Parser</text>
          </g>

          {/* COMPILATION BUS */}
          <path d="M 250 60 L 400 60" fill="none" stroke="url(#compile-bus)" strokeWidth="4" />
          <path d="M 250 60 L 400 60" fill="none" stroke="#fb923c" strokeWidth="1" />
          
          <g transform="translate(250, 60)">
            <animateTransform attributeName="transform" type="translate" from="250 60" to="400 60" dur="2s" repeatCount="indefinite" />
            <circle cx="0" cy="0" r="3" fill="#fff" filter="url(#glow-orange)" />
            <circle cx="-10" cy="0" r="2" fill="#fb923c" />
            <circle cx="-20" cy="0" r="1.5" fill="#fb923c" opacity="0.5" />
          </g>

          {/* OVERLEAF CLOUD / OUTPUT */}
          <g transform="translate(420, 30)">
            <path d="M 0 20 Q 20 0 40 20 T 80 20 T 100 30 Q 120 40 100 60 T 50 70 T 0 60 Q -20 40 0 20" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
            <text x="50" y="42" fill="#10b981" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">Overleaf Sync</text>
            
            {/* Animated Code Document inside Cloud */}
            <rect x="35" y="10" width="30" height="40" fill="#020617" stroke="#10b981" strokeWidth="1" />
            <rect x="40" y="20" width="20" height="2" fill="#10b981" opacity="1" />
            <rect x="40" y="25" width="15" height="2" fill="#10b981" opacity="1" />
            <rect x="40" y="30" width="20" height="2" fill="#10b981" opacity="1" />
            <rect x="40" y="35" width="10" height="2" fill="#10b981" opacity="1" />
          </g>

          <text x="325" y="45" fill="#fb923c" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold" filter="url(#glow-orange)">
            .TEX COMPILATION
          </text>
          
        </svg>
      </div>
    </div>
  );
};
