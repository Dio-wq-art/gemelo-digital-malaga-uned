import React from 'react';
import { ScientificTooltip } from './ScientificTooltip';

export const EnkfCycleDiagram: React.FC = () => {
  

  
  

  return (
    <div className="w-full bg-[#020617] border border-slate-800 rounded p-2 relative overflow-hidden mb-3">
      <h3 className="text-center text-[10px] text-fuchsia-400 font-mono font-bold tracking-widest mb-2 uppercase"><ScientificTooltip topic="pinn_physics_informed_loss">
        Algoritmo Ensemble Kalman Filter (EnKF) - Ciclo de Asimilación
      </ScientificTooltip></h3>
      
      <div className="relative w-full h-[140px] flex justify-center items-center">
        <svg width="100%" height="100%" viewBox="0 0 600 140" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="glow-purple">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* BACKGROUND GRID */}
          <path d="M 0 20 L 600 20 M 0 40 L 600 40 M 0 60 L 600 60 M 0 80 L 600 80 M 0 100 L 600 100 M 0 120 L 600 120" stroke="#0f172a" strokeWidth="1" />

          {/* STEP 1: PRIOR (PREDICT) */}
          <g transform="translate(30, 45)">
            <rect x="0" y="0" width="120" height="50" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" rx="4" />
            <text x="60" y="20" fill="#3b82f6" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">PREDICCIÓN PINN</text>
            <text x="60" y="35" fill="#94a3b8" fontSize="10" fontFamily="serif" textAnchor="middle" fontStyle="italic">x_k⁻ = M(x_k-1)</text>
          </g>

          {/* STEP 2: OBSERVATION */}
          <g transform="translate(240, 10)">
            <rect x="0" y="0" width="120" height="40" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" rx="4" />
            <text x="60" y="15" fill="#f59e0b" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">TELEMETRÍA</text>
            <text x="60" y="30" fill="#94a3b8" fontSize="10" fontFamily="serif" textAnchor="middle" fontStyle="italic">y_k (AEMET/CAMS)</text>
          </g>

          {/* KALMAN GAIN MATRIX COMPUTATION */}
          <g transform="translate(240, 90)">
            <rect x="0" y="0" width="120" height="30" fill="#1e1b4b" stroke="#a855f7" strokeWidth="1" strokeDasharray="2 2" rx="4" />
            <text x="60" y="19" fill="#a855f7" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold" filter="url(#glow-purple)">KALMAN GAIN (K)</text>
          </g>

          {/* STEP 3: UPDATE (POSTERIOR) */}
          <g transform="translate(450, 45)">
            <rect x="0" y="0" width="120" height="50" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" rx="4" />
            <text x="60" y="20" fill="#10b981" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">ESTADO ASIMILADO</text>
            <text x="60" y="35" fill="#94a3b8" fontSize="10" fontFamily="serif" textAnchor="middle" fontStyle="italic">x_k⁺ = x_k⁻ + K(y_k - Hx_k⁻)</text>
          </g>

          {/* FLOW LINES & ANIMATIONS */}
          
          {/* Prior to Gain */}
          <path d="M 150 70 L 220 70 L 220 105 L 240 105" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="3" fill="#3b82f6" filter="url(#glow-purple)">
            <animateMotion path="M 150 70 L 220 70 L 220 105 L 240 105" dur="3s" repeatCount="indefinite" />
          </circle>

          {/* Obs to Gain */}
          <path d="M 300 50 L 300 90" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="3" fill="#f59e0b" filter="url(#glow-purple)">
            <animateMotion path="M 300 50 L 300 90" dur="1.5s" repeatCount="indefinite" />
          </circle>

          {/* Prior direct to Update */}
          <path d="M 150 70 L 450 70" fill="none" stroke="url(#line-gradient)" strokeWidth="1" strokeDasharray="4 4" />
          
          {/* Gain to Update */}
          <path d="M 360 105 L 420 105 L 420 70 L 450 70" fill="none" stroke="#a855f7" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="3" fill="#a855f7" filter="url(#glow-purple)">
            <animateMotion path="M 360 105 L 420 105 L 420 70 L 450 70" dur="3s" repeatCount="indefinite" />
          </circle>

          {/* Glowing Math Operator */}
          <circle cx="420" cy="70" r="8" fill="#020617" stroke="#10b981" strokeWidth="1.5" />
          <text x="420" y="74" fill="#10b981" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">+</text>

          {/* Covariance Spread visualization inside Predict */}
          <g transform="translate(30, 45)" opacity="0.5">
            <ellipse cx="60" cy="25" rx="45" ry="15" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />
            <ellipse cx="60" cy="25" rx="35" ry="10" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.5" />
          </g>

          {/* Contracted Covariance visualization inside Update */}
          <g transform="translate(450, 45)">
            <ellipse cx="60" cy="25" rx="20" ry="8" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.8" />
            <ellipse cx="60" cy="25" rx="15" ry="5" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.9" filter="url(#glow-purple)" />
          </g>
          
        </svg>
      </div>
    </div>
  );
};
