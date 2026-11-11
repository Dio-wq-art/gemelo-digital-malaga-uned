import React from 'react';
import { ScientificTooltip } from './ScientificTooltip';

export const BiogenicEmissionsDiagram: React.FC = () => {
  

  return (
    <div className="w-full bg-[#020617] border border-slate-800 rounded p-2 relative overflow-hidden mb-3">
      <h3 className="text-center text-[10px] text-lime-400 font-mono font-bold tracking-widest mb-2 uppercase"><ScientificTooltip topic="bvoc_isoprene_monoterpenes">
        Emisiones Biogénicas (BVOCs) e Isopreno
      </ScientificTooltip></h3>
      
      <div className="relative w-full h-[140px] flex justify-center items-center">
        <svg width="100%" height="100%" viewBox="0 0 600 140" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="glow-lime">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="glow-sun">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* BACKGROUND */}
          <rect x="0" y="0" width="600" height="140" fill="#020617" />
          <path d="M 0 120 L 600 120" stroke="#064e3b" strokeWidth="4" />

          {/* SUN (Driving factor for emissions) */}
          <circle cx="100" cy="40" r="20" fill="#facc15" filter="url(#glow-sun)">
             <animate attributeName="r" values="18;22;18" dur="3s" repeatCount="indefinite" />
          </circle>
          <text x="100" y="80" fill="#facc15" fontSize="8" fontFamily="monospace" textAnchor="middle">Radiación PAR</text>
          
          {/* RADIATION RAYS TO TREES */}
          <g stroke="#facc15" strokeWidth="1" strokeDasharray="4 4" opacity="0.6">
            <path d="M 120 50 L 250 80" />
            <path d="M 120 40 L 400 70" />
          </g>

          {/* PINE TREE 1 (Isoprene Emitter) */}
          <g transform="translate(250, 120)">
            <rect x="-4" y="-30" width="8" height="30" fill="#78350f" />
            <polygon points="0,-70 -25,-20 25,-20" fill="#166534" />
            <polygon points="0,-50 -30,0 30,0" fill="#14532d" />
            
            {/* Emission Particles */}
            <circle cx="-10" cy="-30" r="3" fill="#bef264" filter="url(#glow-lime)">
               <animateMotion path="M 0 0 C -10 -20, 10 -40, -20 -60" dur="2s" repeatCount="indefinite" />
               <animate attributeName="opacity" values="1;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="10" cy="-20" r="3" fill="#bef264" filter="url(#glow-lime)">
               <animateMotion path="M 0 0 C 15 -20, -5 -50, 20 -70" dur="2.5s" begin="1s" repeatCount="indefinite" />
               <animate attributeName="opacity" values="1;0" dur="2.5s" begin="1s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* OAK TREE 2 (Monoterpene Emitter) */}
          <g transform="translate(420, 120)">
            <rect x="-5" y="-40" width="10" height="40" fill="#451a03" />
            <circle cx="0" cy="-40" r="25" fill="#065f46" />
            <circle cx="-15" cy="-30" r="20" fill="#064e3b" />
            <circle cx="15" cy="-30" r="20" fill="#064e3b" />
            <circle cx="0" cy="-60" r="20" fill="#047857" />

            {/* Emission Particles */}
            <circle cx="0" cy="-40" r="3" fill="#86efac" filter="url(#glow-lime)">
               <animateMotion path="M 0 0 C 20 -30, -20 -60, 30 -80" dur="3s" repeatCount="indefinite" />
               <animate attributeName="opacity" values="1;0" dur="3s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* ATMOSPHERIC CHEMISTRY REACTION (Isoprene + OH -> SOA) */}
          <g transform="translate(340, 25)">
            <rect x="0" y="0" width="120" height="30" fill="#0f172a" stroke="#bef264" strokeWidth="1" rx="4" />
            <text x="60" y="14" fill="#bef264" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">Isopreno + OH/O3</text>
            <text x="60" y="24" fill="#a3e635" fontSize="7" fontFamily="monospace" textAnchor="middle">-&gt; Aerosol Orgánico (SOA)</text>
          </g>
          
          {/* SOA Particles forming in the sky */}
          <g transform="translate(340, 60)">
             <circle cx="20" cy="0" r="2" fill="#d8b4fe" opacity="0.8">
               <animate attributeName="r" values="2;4;2" dur="3s" repeatCount="indefinite" />
             </circle>
             <circle cx="40" cy="-10" r="2.5" fill="#d8b4fe" opacity="0.8">
               <animate attributeName="r" values="2.5;5;2.5" dur="3s" begin="0.5s" repeatCount="indefinite" />
             </circle>
             <circle cx="60" cy="5" r="1.5" fill="#d8b4fe" opacity="0.8">
               <animate attributeName="r" values="1.5;3;1.5" dur="3s" begin="1s" repeatCount="indefinite" />
             </circle>
             <text x="80" y="3" fill="#d8b4fe" fontSize="8" fontFamily="monospace">SOA</text>
          </g>
          
          <text x="250" y="115" fill="#166534" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">Pinus halepensis</text>
          <text x="420" y="115" fill="#064e3b" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">Quercus ilex</text>

        </svg>
      </div>
    </div>
  );
};
