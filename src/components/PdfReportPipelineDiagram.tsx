import React from 'react';
import { motion } from 'motion/react';
import { FileText, Camera, Activity, Cpu, ShieldCheck, Sparkles } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { SYSTEM_PROPAGATION } from '../lib/systemPropagationEngine';

export const PdfReportPipelineDiagram: React.FC = () => {
  return (
    <div className="w-full bg-[#020617] border border-slate-800 rounded-lg p-3 relative overflow-hidden mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-widest uppercase flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          Pipeline de Renderizado &amp; Compilación Vectorial de Informe (PDF)
          <ScientificTooltip
            title="Arquitectura de Compilación Documental ISO 32000-1"
            formula="\mathcal{D}_{\text{PDF}} = \Phi_{\text{Vector}}(\text{WebGL}_{300\text{dpi}} \oplus \mathbf{x}_a^{\text{EnKF}} \oplus \mathcal{R}_{\text{PINN}} \oplus \text{MQI}_{\text{FAIRMODE}})"
            normative="ISO 32000-1:2008 • Principios FAIR (Wilkinson et al., 2016) • UNED Doctorado"
            content="Flujo determinista de generación de informes periciales y capítulos de tesis doctoral. Sincroniza el framebuffer WebGL de alta densidad con el vector de estado asimilado en tiempo real y el sello criptográfico SHA-256."
          />
        </span>
        <span className="text-[9px] text-slate-500 font-mono">
          ISO 32000-1 • Tesis Doctoral UNED
        </span>
      </div>

      <div className="relative w-full h-[120px] flex justify-center items-center">
        <svg width="100%" height="100%" viewBox="0 0 620 120" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="glow-pdf-emerald">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="glow-pdf-sky">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="stream-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2"/>
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.3"/>
            </linearGradient>
          </defs>

          {/* BACKBONE PIPELINE BUS */}
          <path d="M 50 60 L 570 60" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          
          {/* ANIMATED PULSE PARTICLES ALONG BUS */}
          <motion.path
            d="M 50 60 L 570 60"
            stroke="url(#stream-gradient)"
            strokeWidth="3"
            fill="none"
            strokeDasharray="12 24"
            animate={{ strokeDashoffset: [-72, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
          />

          {/* NODE 1: WebGL / MapLibre 3D Snapshot */}
          <g transform="translate(40, 25)">
            <rect x="0" y="0" width="90" height="70" rx="6" fill="#0b1329" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="45" cy="22" r="12" fill="#0369a1" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1" />
            <text x="45" y="26" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">3D</text>
            <text x="45" y="47" fill="#e2e8f0" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">Buffer WebGL</text>
            <text x="45" y="58" fill="#94a3b8" fontSize="7" fontFamily="monospace" textAnchor="middle">MapLibre 300DPI</text>
          </g>

          {/* NODE 2: Real Telemetry & EnKF */}
          <g transform="translate(165, 25)">
            <rect x="0" y="0" width="95" height="70" rx="6" fill="#0b1329" stroke="#06b6d4" strokeWidth="1.5" />
            <circle cx="47" cy="22" r="12" fill="#0891b2" fillOpacity="0.4" stroke="#06b6d4" strokeWidth="1" />
            <text x="47" y="26" fill="#06b6d4" fontSize="9" fontWeight="bold" textAnchor="middle">EnKF</text>
            <text x="47" y="47" fill="#e2e8f0" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">Telemetría Red</text>
            <text x="47" y="58" fill="#94a3b8" fontSize="7" fontFamily="monospace" textAnchor="middle">{SYSTEM_PROPAGATION.stationsCount} Est. + {SYSTEM_PROPAGATION.satellitesCount} Sat</text>
          </g>

          {/* NODE 3: PINN & Kinetic Models */}
          <g transform="translate(295, 25)">
            <rect x="0" y="0" width="95" height="70" rx="6" fill="#0b1329" stroke="#a855f7" strokeWidth="1.5" />
            <circle cx="47" cy="22" r="12" fill="#7e22ce" fillOpacity="0.4" stroke="#a855f7" strokeWidth="1" />
            <text x="47" y="26" fill="#c084fc" fontSize="9" fontWeight="bold" textAnchor="middle">PINN</text>
            <text x="47" y="47" fill="#e2e8f0" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">Física &amp; Química</text>
            <text x="47" y="58" fill="#94a3b8" fontSize="7" fontFamily="monospace" textAnchor="middle">OSPM + Leighton</text>
          </g>

          {/* NODE 4: FAIRMODE Target Plot & MQI */}
          <g transform="translate(425, 25)">
            <rect x="0" y="0" width="95" height="70" rx="6" fill="#0b1329" stroke="#f59e0b" strokeWidth="1.5" />
            <circle cx="47" cy="22" r="12" fill="#d97706" fillOpacity="0.4" stroke="#f59e0b" strokeWidth="1" />
            <text x="47" y="26" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="middle">MQI</text>
            <text x="47" y="47" fill="#e2e8f0" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">FAIRMODE WG1</text>
            <text x="47" y="58" fill="#94a3b8" fontSize="7" fontFamily="monospace" textAnchor="middle">Validación Directiva</text>
          </g>

          {/* NODE 5: Final Vectorial PDF Compilation */}
          <g transform="translate(545, 18)">
            <rect x="0" y="0" width="70" height="84" rx="6" fill="#064e3b" stroke="#34d399" strokeWidth="2" filter="url(#glow-pdf-emerald)" />
            <rect x="18" y="10" width="34" height="20" rx="3" fill="#022c22" stroke="#6ee7b7" strokeWidth="1" />
            <text x="35" y="24" fill="#a7f3d0" fontSize="9" fontWeight="bold" textAnchor="middle">PDF</text>
            <text x="35" y="46" fill="#ecfdf5" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">Compilador</text>
            <text x="35" y="57" fill="#6ee7b7" fontSize="7" fontFamily="monospace" textAnchor="middle">300 DPI</text>
            <text x="35" y="70" fill="#a7f3d0" fontSize="7" fontFamily="monospace" textAnchor="middle">Citable Tesis</text>
          </g>

          {/* Connecting arrowheads */}
          <polygon points="145,57 155,60 145,63" fill="#38bdf8" />
          <polygon points="275,57 285,60 275,63" fill="#06b6d4" />
          <polygon points="405,57 415,60 405,63" fill="#a855f7" />
          <polygon points="530,57 540,60 530,63" fill="#34d399" />
        </svg>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
        <ScientificTooltip
          position="top"
          title="Captura Síncrona del Framebuffer WebGL2"
          formula="I_{\text{RGB}}(x,y) = \text{gl.readPixels}(\text{preserveDrawingBuffer})"
          normative="Khronos WebGL 2.0 Specification"
          content="Extracción directa del lienzo cartográfico 3D (MapLibre GL + Deck.gl) a 300 DPI sin artefactos de compresión para figuras de calidad editorial Q1."
        >
          <div className="flex items-center gap-1.5 cursor-help">
            <Camera className="w-3 h-3 text-sky-400" />
            <span>Fusión Buffer WebGL / Canvas</span>
          </div>
        </ScientificTooltip>
        <ScientificTooltip
          position="top"
          title="Asimilación de Datos por Filtro de Kalman de Conjuntos (EnKF)"
          formula="\mathbf{x}_a = \mathbf{x}_f + \mathbf{K}(\mathbf{y}_o - \mathbf{H}\mathbf{x}_f)"
          normative="Evensen (2003) Ocean Dynamics • Cero Aleatoriedad"
          content={`Fusión variacional determinista de las ${SYSTEM_PROPAGATION.stationsCount} estaciones in situ y ${SYSTEM_PROPAGATION.satellitesCount} plataformas satelitales sobre el punto geográfico activo.`}
        >
          <div className="flex items-center gap-1.5 cursor-help">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>Asimilación EnKF Sin Ruido</span>
          </div>
        </ScientificTooltip>
        <ScientificTooltip
          position="top"
          title="Redes Neuronales Informadas por la Física (PINN)"
          formula="\mathcal{L}_{\text{PINN}} = \mathcal{L}_{\text{data}} + \lambda_{\text{PDE}}\|\partial_t C + \mathbf{u}\cdot\nabla C - \nabla\cdot(\mathbf{K}\nabla C) - R\|^2"
          normative="Raissi et al. (2019) J. Comput. Phys."
          content="Acoplamiento de la ecuación de advección-difusión-reacción (Navier-Stokes + ciclo fotoquímico de Leighton extendido) para garantizar conservación estricta de masa."
        >
          <div className="flex items-center gap-1.5 cursor-help">
            <Cpu className="w-3 h-3 text-purple-400" />
            <span>PINN Mecanística Determinista</span>
          </div>
        </ScientificTooltip>
        <ScientificTooltip
          position="top"
          title="Índice de Calidad de Modelización FAIRMODE (MQI)"
          formula="\text{MQI} = \frac{\text{RMSE}}{\beta \cdot \sqrt{\frac{1}{N}\sum U^2(O_i)}} \le 1.0"
          normative="JRC FAIRMODE WG1 Guidance (Janssen et al., 2022) • Directiva (UE) 2024/2881"
          content="Certificación de aptitud regulatoria del modelo frente a la incertidumbre expandida de referencia de las estaciones oficiales (MQI ≤ 1.0)."
        >
          <div className="flex items-center gap-1.5 cursor-help">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Cumplimiento FAIRMODE MQI &le; 1</span>
          </div>
        </ScientificTooltip>
      </div>
    </div>
  );
};
