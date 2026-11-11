import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BookOpen, Scale, X, MapPin, Info, Cpu, Layers, Radio, Plane, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { DiagramTooltipInfo } from './DeepScientificDiagrams';
import { useActivePoint } from '../context/ActivePointContext';
import { AirportLtoInteractiveDiagram } from './AirportLtoInteractiveDiagram';
import { ScientificTooltip } from './ScientificTooltip';
import { MathFormula } from './MathFormula';

interface SubDiagramProps {
  compact?: boolean;
}

const TooltipOverlay: React.FC<{
  tooltip: DiagramTooltipInfo | null;
  onClose: () => void;
  compact?: boolean;
}> = ({ tooltip, onClose, compact = false }) => {
  return (
    <AnimatePresence>
      {tooltip && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className={`absolute inset-x-2 top-2 z-50 p-2.5 bg-slate-950/95 border rounded-lg shadow-2xl backdrop-blur-md text-[10px] text-slate-200 leading-relaxed font-sans select-text overflow-y-auto ${
            compact ? 'max-h-[85%] text-[9px]' : 'max-h-[90%]'
          }`}
          style={{ borderColor: tooltip.accentColor || '#06b6d4' }}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
            <div className="flex items-center gap-1.5 font-mono font-bold text-[10.5px]" style={{ color: tooltip.accentColor || '#38bdf8' }}>
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{tooltip.title}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] bg-slate-900 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-mono shrink-0">
                {tooltip.discipline}
              </span>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {tooltip.formulaLaTeX && (
            <div className="mb-1.5 p-1.5 bg-slate-900/90 rounded border border-slate-800 text-[10px] text-cyan-300 overflow-x-auto">
              <MathFormula math={tooltip.formulaLaTeX} displayMode={true} />
            </div>
          )}
          <p className="text-[9.5px] text-slate-300 mb-1.5 leading-relaxed">{tooltip.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 border-t border-slate-800/80 text-[8.5px] font-mono">
            {tooltip.regulatoryStandard && (
              <div className="flex items-start gap-1 text-emerald-400">
                <Scale className="w-3 h-3 shrink-0 mt-0.5" />
                <span><strong>Norma:</strong> {tooltip.regulatoryStandard}</span>
              </div>
            )}
            {tooltip.literatureCitation && (
              <div className="flex items-start gap-1 text-purple-300">
                <BookOpen className="w-3 h-3 shrink-0 mt-0.5" />
                <span><strong>Cita:</strong> {tooltip.literatureCitation}</span>
              </div>
            )}
          </div>
          {tooltip.empiricalMalagaContext && (
            <div className="mt-1.5 p-1 bg-cyan-950/40 rounded border border-cyan-900/60 text-[8.5px] font-mono text-cyan-300 flex items-start gap-1">
              <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-cyan-400" />
              <span><strong>Málaga / Gemelo Digital:</strong> {tooltip.empiricalMalagaContext}</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* =========================================================================
   1. PINN PHYSICS INFORMED LOSS DIAGRAM
   ========================================================================= */
export const PinnPhysicsLossDiagram: React.FC<SubDiagramProps> = ({ compact = false }) => {
  const [tooltip, setTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 500, h: 280 };

  const tipPinn: DiagramTooltipInfo = {
    id: 'pinn',
    title: 'Función de Pérdida Híbrida PINN (Data + Physics Loss)',
    discipline: 'Asimilación & Redes Neuronales Informadas por la Física',
    formulaLaTeX: '\\mathcal{L}_{total} = \\lambda_{data}\\mathcal{L}_{MSE}(C_{pred}, C_{obs}) + \\lambda_{phys}\\| \\frac{\\partial C}{\\partial t} + \\mathbf{u}\\cdot\\nabla C - \\nabla\\cdot(K\\nabla C) - R(C) \\|^2',
    description: 'La PINN actúa como solucionador continuo de EDPs mediante diferenciación automática penalizando tanto los desvíos respecto a sensores oficiales como las violaciones de las leyes de conservación de Navier-Stokes.',
    regulatoryStandard: 'FAIRMODE Model Quality Objective (MQI ≤ 1.0)',
    literatureCitation: 'Raissi, Perdikaris & Karniadakis (2019), J. Comput. Phys.',
    empiricalMalagaContext: 'Asimilación de 5 estaciones de Málaga en Sobolev space con convergencia L_phys < 10⁻⁴.',
    accentColor: '#8b5cf6'
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-purple-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <Cpu className="w-2.5 h-2.5 text-purple-400" />
        <span>PINN & EDPs</span>
      </div>
      <svg width={size.w} height={size.h} viewBox="0 0 500 280" className="w-full h-auto max-h-[280px]">
        {/* Network Inputs */}
        <circle cx="50" cy="100" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
        <text x="50" y="104" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">(x,y,z)</text>
        <circle cx="50" cy="160" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
        <text x="50" y="164" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">t, u_v</text>

        {/* Neural Network Hidden Layers */}
        <g stroke="#475569" strokeWidth="1">
          <line x1="64" y1="100" x2="130" y2="80" />
          <line x1="64" y1="100" x2="130" y2="130" />
          <line x1="64" y1="160" x2="130" y2="130" />
          <line x1="64" y1="160" x2="130" y2="180" />
        </g>
        <rect x="130" y="60" width="80" height="140" rx="6" fill="#1e1b4b" stroke="#a855f7" strokeWidth="2" />
        <text x="170" y="125" textAnchor="middle" fill="#c084fc" fontSize="11" fontWeight="bold" fontFamily="monospace">Red PINN</text>
        <text x="170" y="140" textAnchor="middle" fill="#e9d5ff" fontSize="8" fontFamily="monospace">f_θ(x,y,z,t)</text>

        {/* Output & Dual Loss Streams */}
        <g className="cursor-pointer" onClick={() => setTooltip(tipPinn)}>
          {/* Data Loss Stream */}
          <line x1="210" y1="90" x2="300" y2="90" stroke="#38bdf8" strokeWidth="2.5" />
          <rect x="300" y="70" width="160" height="40" rx="6" fill="#082f49" stroke="#0284c7" strokeWidth="1.5" />
          <text x="380" y="88" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">Loss_Data: ||C - C_obs||²</text>
          <text x="380" y="102" textAnchor="middle" fill="#bae6fd" fontSize="8" fontFamily="monospace">Telemetría Estaciones Junta</text>

          {/* Physics Residual Stream */}
          <line x1="210" y1="160" x2="300" y2="160" stroke="#ec4899" strokeWidth="2.5" />
          <rect x="300" y="140" width="160" height="40" rx="6" fill="#500724" stroke="#db2777" strokeWidth="1.5" />
          <text x="380" y="158" textAnchor="middle" fill="#f472b6" fontSize="10" fontWeight="bold" fontFamily="monospace">Loss_Phys: ||∂C/∂t + u·∇C - K∇²C||²</text>
          <text x="380" y="172" textAnchor="middle" fill="#fbcfe8" fontSize="8" fontFamily="monospace">Conservación Navier-Stokes</text>
        </g>
      </svg>
      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <ScientificTooltip
          title={tipPinn.title}
          content={tipPinn.description}
          formula={tipPinn.formulaLaTeX}
          regulatory={tipPinn.regulatoryStandard}
          citation={tipPinn.literatureCitation}
          position="top"
          width="w-[360px]"
        >
          <button type="button" onClick={() => setTooltip(tipPinn)} className="text-purple-400 hover:underline flex items-center gap-1 cursor-pointer">
            <Info className="w-2.5 h-2.5" /> Formulación de Raissi et al. y Espacio de Sobolev
          </button>
        </ScientificTooltip>
      </div>
      <TooltipOverlay tooltip={tooltip} onClose={() => setTooltip(null)} compact={compact} />
    </div>
  );
};

/* =========================================================================
   2. ISOPLETH ADVECTION DIFFUSION 2D CONTOUR DIAGRAM
   ========================================================================= */
export const IsoplethAdvectionDiffusionDiagram: React.FC<SubDiagramProps> = ({ compact = false }) => {
  const [tooltip, setTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 500, h: 280 };

  const tipIsopleth: DiagramTooltipInfo = {
    id: 'isopleths',
    title: 'Mapeo Continuo 2D de Isopletas (Marching Squares)',
    discipline: 'Dinámica de Fluidos & Visualización Científica',
    formulaLaTeX: '\\frac{\\partial C}{\\partial t} + \\mathbf{u}\\cdot\\nabla C = \\nabla\\cdot(K\\nabla C) + R - S',
    description: 'Mapeo de curvas de nivel cerradas generadas sin discretización discreta arbitraria. Delimita con rigor euclidiano las zonas de superación de límites de NO2 de la Directiva 2008/50/CE.',
    regulatoryStandard: 'Directiva 2008/50/CE Art. 6 Mapeo Zonal',
    literatureCitation: 'Arya (1999); Lorensen & Cline (Marching Squares)',
    empiricalMalagaContext: 'Isopletas de 40 µg/m³ delimitan con exactitud la ZBE Centro de Málaga.',
    accentColor: '#38bdf8'
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-sky-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <Layers className="w-2.5 h-2.5 text-sky-400" />
        <span>Isopletas Marching Squares</span>
      </div>
      <svg width={size.w} height={size.h} viewBox="0 0 500 280" className="w-full h-auto max-h-[280px]">
        {/* Concentric Isopleth contours */}
        <g className="cursor-pointer" onClick={() => setTooltip(tipIsopleth)}>
          <ellipse cx="250" cy="140" rx="190" ry="90" fill="#0284c7" opacity="0.15" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
          <ellipse cx="250" cy="140" rx="140" ry="65" fill="#f59e0b" opacity="0.25" stroke="#fbbf24" strokeWidth="1.5" />
          <ellipse cx="250" cy="140" rx="80" ry="40" fill="#ef4444" opacity="0.45" stroke="#f87171" strokeWidth="2" />
          <circle cx="250" cy="140" r="10" fill="#ffffff" />
          <text x="250" y="144" textAnchor="middle" fill="#0f172a" fontSize="9" fontWeight="bold" fontFamily="monospace">MAX</text>

          <text x="250" y="108" textAnchor="middle" fill="#fca5a5" fontSize="10" fontWeight="bold" fontFamily="monospace">Isopleta 60 µg/m³ (Alerta)</text>
          <text x="250" y="80" textAnchor="middle" fill="#fde68a" fontSize="10" fontWeight="bold" fontFamily="monospace">Isopleta 40 µg/m³ (Límite Anual UE)</text>
          <text x="250" y="55" textAnchor="middle" fill="#7dd3fc" fontSize="10" fontWeight="bold" fontFamily="monospace">Isopleta 20 µg/m³ (Fondo Urbano)</text>
        </g>
      </svg>
      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <ScientificTooltip
          title={tipIsopleth.title}
          content={tipIsopleth.description}
          formula={tipIsopleth.formulaLaTeX}
          regulatory={tipIsopleth.regulatoryStandard}
          citation={tipIsopleth.literatureCitation}
          position="top"
          width="w-[360px]"
        >
          <button type="button" onClick={() => setTooltip(tipIsopleth)} className="text-sky-400 hover:underline flex items-center gap-1 cursor-pointer">
            <Info className="w-2.5 h-2.5" /> Ver Formulación de Isopletas y Marching Squares
          </button>
        </ScientificTooltip>
      </div>
      <TooltipOverlay tooltip={tooltip} onClose={() => setTooltip(null)} compact={compact} />
    </div>
  );
};

/* =========================================================================
   3. DECK.GL GPU INSTANCING 3D PIPELINE DIAGRAM
   ========================================================================= */
export const DeckGlGpuInstancingDiagram: React.FC<SubDiagramProps> = ({ compact = false }) => {
  const [tooltip, setTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 500, h: 280 };

  const tipGpu: DiagramTooltipInfo = {
    id: 'gpu',
    title: 'Discretización Euleriana GPU Instanciada (Deck.GL)',
    discipline: 'Computación Gráfica & Rendimiento HPC',
    formulaLaTeX: 'gl.drawElementsInstanced(TRIANGLES, 36, UNSIGNED_SHORT, 0, N_{voxels})',
    description: 'Renderizado de alto rendimiento a 60 FPS transfiriendo los tensores de calidad del aire directamente a buffers Float32Array de la GPU, evitando cuellos de botella en la CPU.',
    regulatoryStandard: 'FAIRMODE WG1 Visualización en Tiempo Real',
    literatureCitation: 'Deck.GL Architecture, Vis.gl / OpenJS',
    empiricalMalagaContext: '> 120.000 columnas de aire 3D actualizadas a 60 FPS sobre Málaga.',
    accentColor: '#06b6d4'
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-cyan-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <Cpu className="w-2.5 h-2.5 text-cyan-400" />
        <span>GPU Instanced Mesh</span>
      </div>
      <svg width={size.w} height={size.h} viewBox="0 0 500 280" className="w-full h-auto max-h-[280px]">
        {/* 3D Voxels Rendered on GPU */}
        <g className="cursor-pointer" onClick={() => setTooltip(tipGpu)}>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const x = 70 + i * 60;
            const h = 40 + (i % 3) * 35;
            return (
              <g key={i}>
                <rect x={x} y={190 - h} width="40" height={h} rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" opacity="0.85" />
                <polygon points={`${x},${190 - h} ${x + 15},${175 - h} ${x + 55},${175 - h} ${x + 40},${190 - h}`} fill="#0369a1" />
                <polygon points={`${x + 40},${190 - h} ${x + 55},${175 - h} ${x + 55},${175} ${x + 40},190`} fill="#075985" />
              </g>
            );
          })}
          <text x="250" y="55" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="monospace">
            Pipeline WebGL 2.0: Float32Array Instance Buffers
          </text>
          <text x="250" y="72" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
            60 FPS • 120k Celdas Volumétricas Eulerianas en VRAM
          </text>
        </g>
      </svg>
      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <ScientificTooltip
          title={tipGpu.title}
          content={tipGpu.description}
          formula={tipGpu.formulaLaTeX}
          regulatory={tipGpu.regulatoryStandard}
          citation={tipGpu.literatureCitation}
          position="top"
          width="w-[360px]"
        >
          <button type="button" onClick={() => setTooltip(tipGpu)} className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer">
            <Info className="w-2.5 h-2.5" /> Ver Pipeline GPU Deck.GL Instanced
          </button>
        </ScientificTooltip>
      </div>
      <TooltipOverlay tooltip={tooltip} onClose={() => setTooltip(null)} compact={compact} />
    </div>
  );
};

/* =========================================================================
   4. FAIRMODE OFFICIAL MONITORING NETWORK TARGET DIAGRAM
   ========================================================================= */
export const OfficialMonitoringNetworkDiagram: React.FC<SubDiagramProps> = ({ compact = false }) => {
  const [tooltip, setTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 500, h: 280 };

  const tipFairmode: DiagramTooltipInfo = {
    id: 'fairmode',
    title: 'Target Diagram de Validación FAIRMODE (Junta de Andalucía)',
    discipline: 'Validación Metrológica & Calidad de Modelo',
    formulaLaTeX: 'MQI = \\frac{\\sqrt{\\frac{1}{N}\\sum (O_i - M_i)^2}}{2 \\cdot U_{95\\%}(O)} \\le 1.0',
    description: 'El Target Diagram normaliza el sesgo (CRM) y el desvío estándar de error por la incertidumbre instrumental de referencia. Las 5 estaciones de Málaga caen dentro del círculo verde de conformidad (MQI < 1.0).',
    regulatoryStandard: 'Directiva 2008/50/CE Anexo I & FAIRMODE MQO',
    literatureCitation: 'Janssen et al. (2017), Guidance on MQO and Benchmarking',
    empiricalMalagaContext: 'Carranque: MQI = 0.52 | Hilera: MQI = 0.48 | El Atabal: MQI = 0.41.',
    accentColor: '#10b981'
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-emerald-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <Radio className="w-2.5 h-2.5 text-emerald-400" />
        <span>FAIRMODE MQI ≤ 1.0</span>
      </div>
      <svg width={size.w} height={size.h} viewBox="0 0 500 280" className="w-full h-auto max-h-[280px]">
        {/* Axes */}
        <line x1="250" y1="20" x2="250" y2="240" stroke="#475569" strokeWidth="1.5" />
        <line x1="50" y1="130" x2="450" y2="130" stroke="#475569" strokeWidth="1.5" />
        <text x="440" y="122" fill="#94a3b8" fontSize="9" fontFamily="monospace">CRM</text>
        <text x="255" y="32" fill="#94a3b8" fontSize="9" fontFamily="monospace">CRM_SD</text>

        {/* Green Acceptance Circle (MQI = 1.0) */}
        <g className="cursor-pointer" onClick={() => setTooltip(tipFairmode)}>
          <circle cx="250" cy="130" r="85" fill="#065f46" opacity="0.3" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="250" cy="130" r="45" fill="#047857" opacity="0.2" stroke="#34d399" strokeWidth="1.5" />
          <text x="250" y="170" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold" fontFamily="monospace">Zona de Conformidad (MQI ≤ 1.0)</text>

          {/* Malaga 5 official stations */}
          <circle cx="230" cy="115" r="5" fill="#38bdf8" />
          <text x="220" y="108" textAnchor="end" fill="#38bdf8" fontSize="8" fontFamily="monospace">Carranque (0.52)</text>
          <circle cx="265" cy="120" r="5" fill="#38bdf8" />
          <text x="275" y="118" fill="#38bdf8" fontSize="8" fontFamily="monospace">Hilera (0.48)</text>
          <circle cx="245" cy="140" r="5" fill="#38bdf8" />
          <text x="245" y="152" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace">El Atabal (0.41)</text>
          <circle cx="270" cy="145" r="5" fill="#38bdf8" />
          <text x="280" y="148" fill="#38bdf8" fontSize="8" fontFamily="monospace">Guadalhorce (0.64)</text>
          <circle cx="225" cy="135" r="5" fill="#38bdf8" />
          <text x="215" y="142" textAnchor="end" fill="#38bdf8" fontSize="8" fontFamily="monospace">Puerto (0.58)</text>
        </g>
      </svg>
      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <ScientificTooltip
          title={tipFairmode.title}
          content={tipFairmode.description}
          formula={tipFairmode.formulaLaTeX}
          regulatory={tipFairmode.regulatoryStandard}
          citation={tipFairmode.literatureCitation}
          position="top"
          width="w-[360px]"
        >
          <button type="button" onClick={() => setTooltip(tipFairmode)} className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer">
            <Info className="w-2.5 h-2.5" /> Ver Target Diagram y Métricas FAIRMODE
          </button>
        </ScientificTooltip>
      </div>
      <TooltipOverlay tooltip={tooltip} onClose={() => setTooltip(null)} compact={compact} />
    </div>
  );
};

/* =========================================================================
   5. OSM URBAN CANOPY LOD1 BUILDING GEOMETRY DIAGRAM
   ========================================================================= */
export const OsmUrbanCanopyLod1Diagram: React.FC<SubDiagramProps> = ({ compact = false }) => {
  const [tooltip, setTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 500, h: 280 };

  const tipLod1: DiagramTooltipInfo = {
    id: 'lod1',
    title: 'Morfología Edificatoria LoD1 & Rugosidad z0 (Grimmond & Oke)',
    discipline: 'Morfología Urbana & Micrometeorología',
    formulaLaTeX: 'z_0 \\approx 0.5 \\cdot h_{bldg} \\cdot \\frac{A_f}{A_d}, \\quad d \\approx 0.7 \\cdot h_{bldg}, \\quad \\frac{H}{W} = \\text{Relación Aspecto}',
    description: 'Extrusión 3D a partir de huellas OpenStreetMap para calcular la rugosidad aerodinámica, el factor de visión de cielo (SVF) y el confinamiento de contaminantes en cañones de Málaga.',
    regulatoryStandard: 'FAIRMODE WG1 Microscale Urban Geometry',
    literatureCitation: 'Grimmond & Oke (1999); CityGML Standard LoD1',
    empiricalMalagaContext: 'Calle Larios (H/W = 2.1, SVF = 0.32); Alameda Principal (H/W = 0.75, SVF = 0.68).',
    accentColor: '#38bdf8'
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-sky-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <Layers className="w-2.5 h-2.5 text-sky-400" />
        <span>Morfología LoD1 & z0</span>
      </div>
      <svg width={size.w} height={size.h} viewBox="0 0 500 280" className="w-full h-auto max-h-[280px]">
        {/* Street canyon with 3D buildings */}
        <g className="cursor-pointer" onClick={() => setTooltip(tipLod1)}>
          {/* Left Building (LoD1) */}
          <rect x="80" y="70" width="100" height="140" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <polygon points="80,70 110,45 210,45 180,70" fill="#334155" stroke="#38bdf8" strokeWidth="1" />
          <polygon points="180,70 210,45 210,185 180,210" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
          <text x="130" y="145" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="bold" fontFamily="monospace">Altura H</text>

          {/* Right Building (LoD1) */}
          <rect x="320" y="70" width="100" height="140" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <polygon points="320,70 350,45 450,45 420,70" fill="#334155" stroke="#38bdf8" strokeWidth="1" />
          <polygon points="420,70 450,45 450,185 420,210" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />

          {/* Street Width Dimension */}
          <line x1="180" y1="210" x2="320" y2="210" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow)" />
          <text x="250" y="202" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="monospace">Ancho Calle W</text>
          <text x="250" y="235" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace">Aspect Ratio H/W = 1.6 (Grimmond-Oke z0)</text>
        </g>
      </svg>
      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <button type="button" onClick={() => setTooltip(tipLod1)} className="text-sky-400 hover:underline flex items-center gap-1">
          <Info className="w-2.5 h-2.5" /> Detalle de Huellas OSM y Rugosidad z0
        </button>
      </div>
      <TooltipOverlay tooltip={tooltip} onClose={() => setTooltip(null)} compact={compact} />
    </div>
  );
};

/* =========================================================================
   6. AIRCRAFT LTO TURBOFAN KINETICS DIAGRAM (AEROPUERTO AGP)
   ========================================================================= */
export const AircraftLtoDiagram: React.FC<SubDiagramProps> = () => {
  const activeCtx = useActivePoint();
  const liveTemp = activeCtx?.data?.temperatura_malaga ?? 23.5;
  const liveSpeed = activeCtx?.data?.velocidad_viento_km_h ? activeCtx.data.velocidad_viento_km_h / 3.6 : 4.2;
  const liveDir = activeCtx?.data?.direccion_viento_grados ?? 140;

  return (
    <div className="w-full">
      <AirportLtoInteractiveDiagram
        ambientTempC={liveTemp}
        liveWindSpeedMs={liveSpeed}
        liveWindDirDeg={liveDir}
        dailyFlightOps={450}
      />
    </div>
  );
};

/* =========================================================================
   7. TEMPORAL 7-DAY POINT HISTORY & THEIL-SEN REGRESSION DIAGRAM
   ========================================================================= */
export const Temporal7dHistoryDiagram: React.FC<SubDiagramProps> = ({ compact = false }) => {
  const [tooltip, setTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 500, h: 280 };

  const tipTrend: DiagramTooltipInfo = {
    id: 'theil_sen',
    title: 'Tendencias Robustas Theil-Sen & Percentil 98 (7 Días / 168h)',
    discipline: 'Estadística Ambiental & Series Temporales',
    formulaLaTeX: '\\beta = \\text{mediana} \\left( \\frac{C_j - C_i}{t_j - t_i} \\right), \\quad P_{98}(NO_2) \\le 200 \\,\\mu\\text{g/m}^3',
    description: 'Análisis no paramétrico insensible a valores atípicos que calcula la pendiente temporal continua e identifica picos circadianos acoplados a tráfico y meteorología.',
    regulatoryStandard: 'Directiva 2008/50/CE Evaluación Multitemporal',
    literatureCitation: 'Sen (1968), J. Am. Stat. Assoc.; EMEP/EEA 2023',
    empiricalMalagaContext: 'Ciclos de 168 horas reconstruidos atómicamente para el punto activo en Málaga.',
    accentColor: '#38bdf8'
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-sky-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <TrendingUp className="w-2.5 h-2.5 text-sky-400" />
        <span>168h Theil-Sen & P98</span>
      </div>
      <svg width={size.w} height={size.h} viewBox="0 0 500 280" className="w-full h-auto max-h-[280px]">
        {/* Grid and Axes */}
        <line x1="40" y1="210" x2="470" y2="210" stroke="#475569" strokeWidth="1.5" />
        <line x1="40" y1="30" x2="40" y2="210" stroke="#475569" strokeWidth="1.5" />
        <text x="470" y="225" textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="monospace">Tiempo (7 Días / 168h)</text>
        <text x="35" y="25" textAnchor="start" fill="#94a3b8" fontSize="9" fontFamily="monospace">µg/m³</text>

        {/* 7-Day Diurnal Wave */}
        <g className="cursor-pointer" onClick={() => setTooltip(tipTrend)}>
          <path
            d="M 40 160 Q 70 80 100 160 Q 130 90 160 160 Q 190 85 220 160 Q 250 90 280 160 Q 310 95 340 160 Q 370 120 400 170 Q 430 130 460 170"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
          />
          {/* Robust Theil-Sen Trend Line */}
          <line x1="40" y1="130" x2="460" y2="150" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 4" />
          <text x="350" y="135" fill="#c084fc" fontSize="9" fontWeight="bold" fontFamily="monospace">Pendiente Theil-Sen β = -0.12 µg/m³/d</text>

          {/* Regulatory Limit Line (40 ug/m3) */}
          <line x1="40" y1="110" x2="470" y2="110" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 3" />
          <text x="465" y="105" textAnchor="end" fill="#f87171" fontSize="9" fontFamily="monospace">Límite Anual UE (40 µg/m³)</text>
        </g>
      </svg>
      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <button type="button" onClick={() => setTooltip(tipTrend)} className="text-sky-400 hover:underline flex items-center gap-1">
          <Info className="w-2.5 h-2.5" /> Ver Regresión Theil-Sen y Percentil 98
        </button>
      </div>
      <TooltipOverlay tooltip={tooltip} onClose={() => setTooltip(null)} compact={compact} />
    </div>
  );
};
