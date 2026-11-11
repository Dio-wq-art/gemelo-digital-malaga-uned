import React from 'react';
import { ScientificTooltip } from './ScientificTooltip';
import { SYSTEM_PROPAGATION } from '../lib/systemPropagationEngine';

export const PINNArchitectureDiagram: React.FC = () => {
  return (
    <div className="w-full bg-[#020617] border border-slate-800 rounded p-2 relative overflow-hidden mb-3">
      <div className="flex items-center justify-center mb-2">
        <ScientificTooltip topic="pinn_physics_informed_loss"
          width="w-96"
          content="Arquitectura PINN (Physics-Informed Neural Network, Raissi et al., 2019). Red neuronal multicapa que actúa como aproximador universal de funciones f_θ(x,y,t) integrando las leyes de Navier-Stokes y advección-difusión atmosférica como penalizaciones en la función de pérdida sin requerir discretización en malla rígida."
        >
          <h3 className="text-center text-[10px] text-cyan-400 font-mono font-bold tracking-widest uppercase cursor-help hover:text-cyan-300">
            Physics-Informed Neural Network (PINN) - Arquitectura y Función de Pérdida
          </h3>
        </ScientificTooltip>
      </div>
      
      <div className="relative w-full h-[150px] flex justify-center items-center">
        <svg width="100%" height="100%" viewBox="0 0 600 150" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="glow-nn">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="glow-math">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="grad-loss" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* INPUTS */}
          <g transform="translate(40, 75)">
            <circle cx="0" cy="-25" r="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <text x="-15" y="-22" fill="#38bdf8" fontSize="10" fontFamily="monospace" textAnchor="end">x,y</text>
            
            <circle cx="0" cy="25" r="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <text x="-15" y="28" fill="#38bdf8" fontSize="10" fontFamily="monospace" textAnchor="end">t</text>
          </g>

          {/* HIDDEN LAYERS (Deep Neural Network) */}
          <g transform="translate(120, 75)" stroke="#1e293b" strokeWidth="1">
            {/* Layer 1 to 2 connections */}
            <path d="M 0 -30 L 60 -40 M 0 -30 L 60 0 M 0 -30 L 60 40" />
            <path d="M 0 0 L 60 -40 M 0 0 L 60 0 M 0 0 L 60 40" />
            <path d="M 0 30 L 60 -40 M 0 30 L 60 0 M 0 30 L 60 40" />

            {/* Nodes L1 */}
            <circle cx="0" cy="-30" r="6" fill="#0f172a" stroke="#a855f7" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="6" fill="#0f172a" stroke="#a855f7" strokeWidth="1.5" />
            <circle cx="0" cy="30" r="6" fill="#0f172a" stroke="#a855f7" strokeWidth="1.5" />

            {/* Nodes L2 */}
            <circle cx="60" cy="-40" r="6" fill="#0f172a" stroke="#a855f7" strokeWidth="1.5" />
            <circle cx="60" cy="0" r="6" fill="#0f172a" stroke="#a855f7" strokeWidth="1.5" />
            <circle cx="60" cy="40" r="6" fill="#0f172a" stroke="#a855f7" strokeWidth="1.5" />
          </g>

          {/* SIGNAL ANIMATION (Data flowing through network) */}
          <g filter="url(#glow-nn)">
            <circle cx="120" cy="45" r="3" fill="#a855f7">
              <animateMotion path="M 0 0 L 60 -40" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx="120" cy="75" r="3" fill="#06b6d4">
              <animateMotion path="M 0 0 L 60 40" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="180" cy="35" r="3" fill="#ec4899">
              <animateMotion path="M 0 0 L 60 15" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* OUTPUTS (Predictions) */}
          <g transform="translate(240, 75)">
            <circle cx="0" cy="-20" r="10" fill="#0f172a" stroke="#10b981" strokeWidth="2" filter="url(#glow-nn)" />
            <text x="0" y="-17" fill="#10b981" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">u,v</text>
            
            <circle cx="0" cy="20" r="10" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" filter="url(#glow-nn)" />
            <text x="0" y="23" fill="#f59e0b" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">C</text>
          </g>

          {/* CONNECTIONS TO LOSS FUNCTION */}
          <g strokeDasharray="4 4" fill="none" strokeWidth="1.5">
            <path d="M 250 55 C 280 30, 320 20, 360 40" stroke="#10b981">
              <animate attributeName="stroke-dashoffset" values="0;-20" dur="1s" repeatCount="indefinite" />
            </path>
            <path d="M 250 95 C 280 120, 320 130, 360 110" stroke="#f59e0b">
              <animate attributeName="stroke-dashoffset" values="0;-20" dur="1s" repeatCount="indefinite" />
            </path>
          </g>

          {/* AUTOMATIC DIFFERENTIATION & LOSS FUNCTION */}
          <g transform="translate(360, 20)">
            <rect x="0" y="0" width="180" height="110" fill="#0f172a" stroke="url(#grad-loss)" strokeWidth="2" rx="6" />
            
            <text x="90" y="20" fill="#cbd5e1" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">Autograd (Diferenciación)</text>
            
            {/* Physics Loss Equation */}
            <rect x="10" y="30" width="160" height="30" fill="#1e293b" stroke="#ec4899" strokeWidth="1" rx="2" />
            <text x="90" y="48" fill="#ec4899" fontSize="9" fontFamily="serif" fontStyle="italic" textAnchor="middle" fontWeight="bold" filter="url(#glow-math)">
              L_f = ∂C/∂t + u·∇C - K∇²C - S
            </text>

            {/* Data Loss Equation */}
            <rect x="10" y="65" width="160" height="30" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" rx="2" />
            <text x="90" y="83" fill="#38bdf8" fontSize="9" fontFamily="serif" fontStyle="italic" textAnchor="middle" fontWeight="bold">
              L_data = || C_pred - C_obs ||²
            </text>
          </g>

          {/* BACKPROPAGATION ARROW */}
          <path d="M 450 130 L 450 140 L 150 140 L 150 105" fill="none" stroke="#ec4899" strokeWidth="2" strokeDasharray="6 6">
             <animate attributeName="stroke-dashoffset" values="24;0" dur="1.5s" repeatCount="indefinite" />
          </path>
          <polygon points="150,105 145,115 155,115" fill="#ec4899" />
          <text x="300" y="135" fill="#ec4899" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">Backpropagation (Minimizar L_total)</text>

        </svg>
      </div>

      {/* Interactive Micro-Badges for Deep Scientific Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-2 text-[9px] font-mono text-center">
        {/* 1. Wesely Dry Deposition Resistance Network */}
        <ScientificTooltip
          title="Red de Resistencias de Deposición Seca (Wesely 1989)"
          content="Flujo de sumidero en la canopia urbana acoplado a la pérdida PINN: F_dep = -v_d · C. El inverso de la velocidad de deposición v_d se modeliza como un circuito eléctrico análogo en serie y paralelo de resistencias atmosféricas, cuasi-laminares y foliares."
          formula={`v_d = \\frac{1}{R_a + R_b + R_c}, \\quad R_c = \\left( \\frac{1}{R_{st} + R_m} + \\frac{1}{R_{lu}} + \\frac{1}{R_{dc} + R_{cl}} + \\frac{1}{R_{ac} + R_{gs}} \\right)^{-1}`}
          regulatory="Guía EMEP/EEA 2023 & Protocolo de Deposición Atmosférica UNECE"
          citation="Wesely, M. L. (1989) Parameterization of surface resistances to gaseous dry deposition. Atmos. Environ. 23(6): 1293–1304"
          position="top"
          width="w-[420px]"
        >
          <div className="p-1.5 bg-emerald-950/60 border border-emerald-700/60 rounded text-emerald-300 cursor-help hover:border-emerald-400 hover:bg-emerald-900/60 transition-all">
            <div className="font-bold text-[8.5px] uppercase flex items-center justify-center gap-1">
              <span>🌿 Dep. Wesely: v_d</span>
            </div>
            <div className="text-[7.5px] text-emerald-400/80 mt-0.5">
              1 / (R_a + R_b + R_c)
            </div>
          </div>
        </ScientificTooltip>

        {/* 2. Monin-Obukhov Similarity Theory Stability Functions */}
        <ScientificTooltip
          title="Funciones de Estabilidad de Monin-Obukhov (MOST)"
          content="Parametrización micrometeorológica del perfil de velocidad del viento u(z) y tensor difusivo K_m(z) forzado por la flotabilidad térmica y fricción en la capa límite superficial de Málaga."
          formula={`u(z) = \\frac{u_*}{\\kappa}\\left[\\ln\\left(\\frac{z-d}{z_0}\\right) - \\psi_m\\left(\\frac{z}{L}\\right)\\right], \\quad \\psi_m(\\zeta) = \\begin{cases} 2\\ln\\frac{1+x}{2} + \\ln\\frac{1+x^2}{2} - 2\\arctan x + \\frac{\\pi}{2}, & \\zeta < 0 \\; (x=(1-16\\zeta)^{1/4}) \\\\ 0, & \\zeta = 0 \\\\ -5\\zeta, & \\zeta > 0 \\end{cases}`}
          regulatory="Estándares de Micrometeorología OMM Guía Nº 8 & Modelo OSPM"
          citation="Monin, A. S. & Obukhov, A. M. (1954) & Businger-Dyer (1971) Boundary-Layer Meteorology"
          position="top"
          width="w-[430px]"
        >
          <div className="p-1.5 bg-sky-950/60 border border-sky-700/60 rounded text-sky-300 cursor-help hover:border-sky-400 hover:bg-sky-900/60 transition-all">
            <div className="font-bold text-[8.5px] uppercase flex items-center justify-center gap-1">
              <span>💨 MOST: ψ_m(z/L)</span>
            </div>
            <div className="text-[7.5px] text-sky-400/80 mt-0.5">
              Businger-Dyer (1971)
            </div>
          </div>
        </ScientificTooltip>

        {/* 3. Physics Loss & Autograd */}
        <ScientificTooltip
          title="Pérdida Física Residual de Navier-Stokes (L_phys)"
          content="Evaluación exacta de derivadas espaciotemporales continuas mediante diferenciación automática (Autograd). Penaliza divergencias del balance advección-difusión y sumideros químicos."
          formula={`\\mathcal{L}_{\\text{phys}} = \\frac{1}{N_f} \\sum_{i=1}^{N_f} \\left| \\frac{\\partial C}{\\partial t} + \\mathbf{u}\\cdot\\nabla C - \\nabla\\cdot(K_m\\nabla C) + \\Lambda_{\\text{dep}} C - S_e - R_{\\text{chem}} \\right|^2`}
          regulatory="FAIRMODE WG1 Model Quality Objective for PINNs"
          citation="Raissi, M., Perdikaris, P., & Karniadakis, G. E. (2019) J. Comput. Phys."
          position="top"
          width="w-[400px]"
        >
          <div className="p-1.5 bg-pink-950/60 border border-pink-700/60 rounded text-pink-300 cursor-help hover:border-pink-400 hover:bg-pink-900/60 transition-all">
            <div className="font-bold text-[8.5px] uppercase flex items-center justify-center gap-1">
              <span>⚛️ Residuo PDE: L_f</span>
            </div>
            <div className="text-[7.5px] text-pink-400/80 mt-0.5">
              Autograd Chain Rule
            </div>
          </div>
        </ScientificTooltip>

        {/* 4. Telemetry Data Loss */}
        <ScientificTooltip
          title="Pérdida Observacional de Telemetría Oficial (L_data)"
          content="Anclaje supervisado a las estaciones de la Junta de Andalucía, AEMET y columnas satelitales TROPOMI Sentinel-5P en el área metropolitana de Málaga."
          formula={`\\mathcal{L}_{\\text{data}} = \\frac{1}{N_d}\\sum_{i=1}^{N_d} |C_{\\text{pred}}(x_i,t_i) - C_{\\text{obs},i}|^2 + \\left\\| \\int_0^H C_{\\text{pred}}(z) A_k(z) dz - \\text{VCD}_{\\text{S5P}} \\right\\|^2`}
          regulatory="Directiva 2008/50/CE Calidad de Mediciones In Situ"
          citation="Karniadakis et al. (2021) Nature Reviews Physics"
          position="top"
          width="w-[400px]"
        >
          <div className="p-1.5 bg-cyan-950/60 border border-cyan-700/60 rounded text-cyan-300 cursor-help hover:border-cyan-400 hover:bg-cyan-900/60 transition-all">
            <div className="font-bold text-[8.5px] uppercase flex items-center justify-center gap-1">
              <span>📡 Datos: L_data</span>
            </div>
            <div className="text-[7.5px] text-cyan-400/80 mt-0.5">
              {SYSTEM_PROPAGATION.sensorNetwork.totalTerrestrial} Est. + {SYSTEM_PROPAGATION.sensorNetwork.totalSatellites} Satélites
            </div>
          </div>
        </ScientificTooltip>
      </div>
    </div>
  );
};
