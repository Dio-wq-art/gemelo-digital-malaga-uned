import React from 'react';
import { ScientificTooltip } from './ScientificTooltip';

export const InstancedWebGLPipelineDiagram: React.FC = () => {
  

  

  return (
    <div className="w-full bg-[#020617] border border-slate-800 rounded p-2 relative overflow-hidden mb-3">
      <h3 className="text-center text-[10px] text-cyan-400 font-mono font-bold tracking-widest mb-2 uppercase"><ScientificTooltip topic="deckgl_gpu_instancing">
        GPU Instancing Pipeline (deck.gl / WebGL2)
      </ScientificTooltip></h3>
      
      <div className="relative w-full h-[120px] flex justify-center items-center">
        <svg width="100%" height="100%" viewBox="0 0 600 120" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="glow-cyan">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="data-bus" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.2"/>
            </linearGradient>
          </defs>

          {/* CPU MEMORY / JS THREAD */}
          <g transform="translate(20, 35)">
            <rect x="0" y="0" width="100" height="50" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" rx="4" />
            <text x="50" y="20" fill="#cbd5e1" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">CPU (V8)</text>
            <text x="50" y="35" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">TypedArrays (JS)</text>
          </g>

          {/* VRAM UPLOAD BUS */}
          <path d="M 120 60 L 220 60" fill="none" stroke="url(#data-bus)" strokeWidth="6" strokeLinecap="round" />
          <path d="M 120 60 L 220 60" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 4" />
          
          <g transform="translate(120, 60)">
            <animateTransform attributeName="transform" type="translate" from="120 60" to="220 60" dur="2s" repeatCount="indefinite" />
            <circle cx="0" cy="0" r="4" fill="#fff" filter="url(#glow-cyan)" />
            <circle cx="-15" cy="0" r="3" fill="#06b6d4" filter="url(#glow-cyan)" />
            <circle cx="-30" cy="0" r="2" fill="#06b6d4" opacity="0.5" />
          </g>

          <text x="170" y="45" fill="#06b6d4" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold" filter="url(#glow-cyan)">
            GPU UPLOAD (O(1))
          </text>
          <text x="170" y="80" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">
            Float32Array
          </text>

          {/* GPU VRAM INSTANCES */}
          <g transform="translate(240, 20)">
            <rect x="0" y="0" width="140" height="80" fill="#020617" stroke="#0ea5e9" strokeWidth="1.5" rx="4" />
            <text x="70" y="15" fill="#0ea5e9" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">WebGL GPU Buffer</text>
            
            {/* Array memory blocks */}
            <g transform="translate(10, 30)">
              <rect x="0" y="0" width="120" height="15" fill="#0f172a" stroke="#0ea5e9" strokeWidth="1" />
              <text x="60" y="10" fill="#38bdf8" fontSize="8" fontFamily="monospace" textAnchor="middle">instancePositions[]</text>
              
              <rect x="0" y="25" width="120" height="15" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
              <text x="60" y="35" fill="#fcd34d" fontSize="8" fontFamily="monospace" textAnchor="middle">instanceColors[]</text>
            </g>
          </g>

          {/* INSTANCED DRAWING NODE */}
          <path d="M 380 60 L 440 60" fill="none" stroke="#0ea5e9" strokeWidth="2" />
          <polygon points="435,55 445,60 435,65" fill="#0ea5e9" />

          <g transform="translate(450, 20)">
            <rect x="0" y="0" width="120" height="80" fill="#0f172a" stroke="#8b5cf6" strokeWidth="1.5" rx="4" />
            <text x="60" y="15" fill="#c084fc" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">VERTEX SHADER</text>
            
            {/* Shader code viz */}
            <g transform="translate(10, 30)">
              <rect x="0" y="0" width="100" height="3" fill="#8b5cf6" opacity="0.6" />
              <rect x="0" y="10" width="80" height="3" fill="#8b5cf6" opacity="0.6" />
              <rect x="10" y="20" width="60" height="3" fill="#c084fc" filter="url(#glow-cyan)" />
              <rect x="0" y="30" width="90" height="3" fill="#8b5cf6" opacity="0.6" />
            </g>
            
            <text x="60" y="70" fill="#a78bfa" fontSize="8" fontFamily="monospace" textAnchor="middle">
              gl_Position = transform()
            </text>
          </g>
          
        </svg>
      </div>
    </div>
  );
};
