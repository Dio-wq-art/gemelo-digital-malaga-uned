import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BookOpen, Scale, X, MapPin, Info, Wind, Sun, Waves, Mountain, Droplets } from 'lucide-react';
import { DiagramTooltipInfo } from './DeepScientificDiagrams';
import { useActivePoint } from '../context/ActivePointContext';
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
   1. MONIN-OBUKHOV TURBULENCE & STABILITY DIAGRAM
   ========================================================================= */
export const MoninObukhovDiagram: React.FC<SubDiagramProps> = ({ compact = false }) => {
  const [tooltip, setTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 500, h: 280 };

  const tipConvective: DiagramTooltipInfo = {
    id: 'convective',
    title: 'Régimen Convectivo Inestable (ζ = z/L < 0)',
    discipline: 'Micrometeorología de Capa Límite',
    formulaLaTeX: '\\zeta = \\frac{z}{L} = -\\frac{z \\, \\kappa \\, g \\, H}{T_0 \\, c_p \\, \\rho \\, u_*^3} < -0.1',
    description: 'En horas diurnas con alta insolación en Málaga, el flujo de calor sensible H > 0 genera plumas térmicas ascendentes que potencian la mezcla vertical y diluyen contaminantes primarios.',
    regulatoryStandard: 'AEMET / COST Action 715 Urban Boundary Layer',
    literatureCitation: 'Monin & Obukhov (1954); Stull (1988)',
    empiricalMalagaContext: 'Frecuente entre 11:00 y 16:00 UTC con L = -20 a -80 m en el centro de Málaga.',
    accentColor: '#f59e0b'
  };

  const tipStable: DiagramTooltipInfo = {
    id: 'stable',
    title: 'Régimen Estable / Inversión Térmica (ζ = z/L > 0)',
    discipline: 'Micrometeorología Nocturna',
    formulaLaTeX: 'L > 0, \\quad \\frac{\\partial \\theta}{\\partial z} > 0 \\implies \\text{Amortiguación de Turbulencia}',
    description: 'El enfriamiento radiativo nocturno del suelo estabiliza la atmósfera, reprimiendo los torbellinos mecánicos y atrapando emisiones vehiculares cerca de la superficie.',
    regulatoryStandard: 'Directiva 2008/50/CE Protocolo de Inversiones',
    literatureCitation: 'Garratt (1992), The Atmospheric Boundary Layer',
    empiricalMalagaContext: 'Inversiones frecuentes en invierno y madrugadas en el valle del Guadalhorce.',
    accentColor: '#818cf8'
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-indigo-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
        <span>Teoría MOST (z/L)</span>
      </div>
      <svg width={size.w} height={size.h} viewBox="0 0 500 280" className="w-full h-auto max-h-[280px]">
        <defs>
          <linearGradient id="moSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="moSunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <rect x="10" y="10" width="480" height="230" rx="8" fill="url(#moSkyGrad)" stroke="#334155" strokeWidth="1" />
        {/* Ground */}
        <line x1="20" y1="210" x2="480" y2="210" stroke="#64748b" strokeWidth="3" />
        <text x="30" y="228" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="bold">Superficie Urbana (z = 0, z0 ≈ 0.8m)</text>

        {/* Daytime Convection (Left Side) */}
        <g className="cursor-pointer" onClick={() => setTooltip(tipConvective)}>
          <circle cx="90" cy="50" r="18" fill="url(#moSunGrad)" opacity="0.9" />
          <text x="90" y="54" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace">SOL</text>
          <text x="140" y="45" fill="#f59e0b" fontSize="11" fontWeight="bold" fontFamily="monospace">DÍA: ζ &lt; 0 (Inestable)</text>
          <text x="140" y="60" fill="#cbd5e1" fontSize="9" fontFamily="monospace">Flujo de Calor H &gt; 0 (Mezcla Activa)</text>
          {/* Thermal plume arrows */}
          <motion.path
            d="M 80 200 C 70 140, 110 110, 100 75"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeDasharray="6 4"
            animate={{ strokeDashoffset: [20, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          />
          <motion.path
            d="M 140 200 C 130 150, 160 120, 150 85"
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            strokeDasharray="6 4"
            animate={{ strokeDashoffset: [20, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
          />
          <rect x="60" y="150" width="120" height="32" rx="6" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1" opacity="0.9" />
          <text x="120" y="166" textAnchor="middle" fill="#a5b4fc" fontSize="9" fontWeight="bold" fontFamily="monospace">u* fricción + w'θ'</text>
          <text x="120" y="177" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace">Turbulencia Convectiva</text>
        </g>

        {/* Divider */}
        <line x1="250" y1="20" x2="250" y2="230" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" />

        {/* Nighttime Stability (Right Side) */}
        <g className="cursor-pointer" onClick={() => setTooltip(tipStable)}>
          <circle cx="430" cy="50" r="14" fill="#6366f1" opacity="0.7" />
          <path d="M 426 38 A 12 12 0 1 0 438 60 A 10 10 0 1 1 426 38 Z" fill="#e0e7ff" />
          <text x="340" y="45" textAnchor="middle" fill="#818cf8" fontSize="11" fontWeight="bold" fontFamily="monospace">NOCHE: ζ &gt; 0 (Estable)</text>
          <text x="340" y="60" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">Inversión Térmica ∂θ/∂z &gt; 0</text>
          {/* Stratified laminar lines */}
          <line x1="270" y1="110" x2="470" y2="110" stroke="#818cf8" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="270" y1="140" x2="470" y2="140" stroke="#6366f1" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="270" y1="170" x2="470" y2="170" stroke="#4f46e5" strokeWidth="2" strokeDasharray="3 3" />
          <rect x="290" y="180" width="160" height="24" rx="4" fill="#311042" stroke="#e879f9" strokeWidth="1" />
          <text x="370" y="195" textAnchor="middle" fill="#f472b6" fontSize="9" fontWeight="bold" fontFamily="monospace">Atrapamiento de Contaminantes</text>
        </g>
      </svg>
      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <ScientificTooltip
          title={tipConvective.title}
          content={tipConvective.description}
          formula={tipConvective.formulaLaTeX}
          regulatory={tipConvective.regulatoryStandard}
          citation={tipConvective.literatureCitation}
          position="top"
          width="w-[340px]"
        >
          <button type="button" onClick={() => setTooltip(tipConvective)} className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer">
            <Info className="w-2.5 h-2.5" /> Régimen Diurno (ζ &lt; 0)
          </button>
        </ScientificTooltip>

        <ScientificTooltip
          title={tipStable.title}
          content={tipStable.description}
          formula={tipStable.formulaLaTeX}
          regulatory={tipStable.regulatoryStandard}
          citation={tipStable.literatureCitation}
          position="top"
          width="w-[340px]"
        >
          <button type="button" onClick={() => setTooltip(tipStable)} className="text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer">
            <Info className="w-2.5 h-2.5" /> Régimen Nocturno (ζ &gt; 0)
          </button>
        </ScientificTooltip>
      </div>
      <TooltipOverlay tooltip={tooltip} onClose={() => setTooltip(null)} compact={compact} />
    </div>
  );
};

/* =========================================================================
   2. SEA BREEZE CIRCULATION DIAGRAM (BAHÍA DE MÁLAGA)
   ========================================================================= */
export const SeaBreezeCirculationDiagram: React.FC<SubDiagramProps> = ({ compact = false }) => {
  const [tooltip, setTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 500, h: 280 };

  const tipSeaBreeze: DiagramTooltipInfo = {
    id: 'sea_breeze',
    title: 'Celda Convectiva de Brisa Marina (Bahía de Málaga)',
    discipline: 'Meteorología Costera & Mesoscala',
    formulaLaTeX: 'U_{brisa} = C \\sqrt{\\frac{g \\, \\Delta T \\, H_{PBL}}{\\theta_0}} \\approx 3.5 - 6.5 \\text{ m/s}',
    description: 'El gradiente térmico entre el mar de Alborán (agua fría) y el suelo continental recalentado genera una corriente de sureste que advecta aire marino hacia el interior y recircula en altura contra los Montes de Málaga.',
    regulatoryStandard: 'AEMET Modelización HARMONIE-AROME',
    literatureCitation: 'Simpson (1994), Sea Breeze and Local Winds',
    empiricalMalagaContext: 'Comienza hacia las 11:30 UTC con giro de viento a 160°-180° SE en el Puerto y Muelle Uno.',
    accentColor: '#0ea5e9'
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-sky-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <Waves className="w-2.5 h-2.5 text-cyan-400" />
        <span>Circulación Térmica Costera</span>
      </div>
      <svg width={size.w} height={size.h} viewBox="0 0 500 280" className="w-full h-auto max-h-[280px]">
        <defs>
          <linearGradient id="seaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>
        {/* Sea (Left) */}
        <rect x="20" y="190" width="220" height="50" rx="4" fill="url(#seaGrad)" />
        <text x="130" y="218" textAnchor="middle" fill="#e0f2fe" fontSize="11" fontWeight="bold" fontFamily="monospace">MAR DE ALBORÁN (T_mar ≈ 21°C)</text>
        {/* Land (Right) */}
        <rect x="240" y="190" width="240" height="50" rx="4" fill="url(#landGrad)" />
        <text x="360" y="218" textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="bold" fontFamily="monospace">CIUDAD / INTERIOR (T_suelo ≈ 34°C)</text>

        {/* Sun over land */}
        <circle cx="430" cy="45" r="18" fill="#f59e0b" />
        <text x="430" y="49" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="monospace">SOL</text>

        {/* Mountains in background */}
        <path d="M 380 190 L 430 110 L 480 190 Z" fill="#334155" opacity="0.6" />
        <text x="430" y="140" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontFamily="monospace">Montes de Málaga</text>

        {/* Circulation Flow Loop */}
        <g className="cursor-pointer" onClick={() => setTooltip(tipSeaBreeze)}>
          {/* Surface Inflow (Sea to Land) */}
          <motion.path
            d="M 120 170 L 330 170"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeDasharray="8 4"
            animate={{ strokeDashoffset: [-24, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
          />
          <text x="220" y="162" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">Frente de Brisa SE (3.5 - 6 m/s) →</text>

          {/* Updraft over warm land */}
          <motion.path
            d="M 350 160 C 370 120, 370 90, 340 70"
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            strokeDasharray="6 3"
            animate={{ strokeDashoffset: [-18, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          />
          <text x="390" y="110" fill="#ef4444" fontSize="9" fontWeight="bold" fontFamily="monospace">Convección</text>

          {/* Upper Return Flow (Land to Sea) */}
          <motion.path
            d="M 320 65 L 140 65"
            fill="none"
            stroke="#818cf8"
            strokeWidth="2.5"
            strokeDasharray="8 4"
            animate={{ strokeDashoffset: [24, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
          />
          <text x="230" y="58" textAnchor="middle" fill="#a5b4fc" fontSize="9" fontWeight="bold" fontFamily="monospace">← Retorno en Altura (800 - 1200 m)</text>

          {/* Subsidence over sea */}
          <motion.path
            d="M 130 75 C 100 100, 100 130, 120 160"
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeDasharray="6 3"
            animate={{ strokeDashoffset: [-18, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          />
          <text x="65" y="120" fill="#38bdf8" fontSize="8" fontFamily="monospace">Subsidencia</text>
        </g>
      </svg>
      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <ScientificTooltip
          title={tipSeaBreeze.title}
          content={tipSeaBreeze.description}
          formula={tipSeaBreeze.formulaLaTeX}
          regulatory={tipSeaBreeze.regulatoryStandard}
          citation={tipSeaBreeze.literatureCitation}
          position="top"
          width="w-[340px]"
        >
          <button type="button" onClick={() => setTooltip(tipSeaBreeze)} className="text-sky-400 hover:underline flex items-center gap-1 cursor-pointer">
            <Info className="w-2.5 h-2.5" /> Ver Formulación de Bjerknes y Frente de Brisa
          </button>
        </ScientificTooltip>
      </div>
      <TooltipOverlay tooltip={tooltip} onClose={() => setTooltip(null)} compact={compact} />
    </div>
  );
};

/* =========================================================================
   3. WIND VECTOR ADVECTION DIAGRAM (KINEMATIC U, V)
   ========================================================================= */
export const WindVectorAdvectionDiagram: React.FC<SubDiagramProps> = ({ compact = false }) => {
  const [tooltip, setTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 500, h: 280 };

  const tipAdvection: DiagramTooltipInfo = {
    id: 'advection',
    title: 'Advección Cinemática Bidimensional de Contaminantes',
    discipline: 'Dinámica de Fluidos Atmosféricos',
    formulaLaTeX: '\\left(\\frac{\\partial C}{\\partial t}\\right)_{adv} = -\\mathbf{u} \\cdot \\nabla C = -\\left( u \\frac{\\partial C}{\\partial x} + v \\frac{\\partial C}{\\partial y} \\right)',
    description: 'El transporte direccional traslada el cono de dispersión desde la fuente emisora (avenidas con tráfico intenso, chimeneas) hacia zonas residenciales según las componentes zonal (u) y meridional (v).',
    regulatoryStandard: 'FAIRMODE WG1 Dispersion Modelling Guidance',
    literatureCitation: 'Arya (1999), Air Pollution Meteorology and Dispersion',
    empiricalMalagaContext: 'Brisa de SE advecta penachos del Puerto y Av. Manuel Agustín Heredia hacia Teatinos y Centro.',
    accentColor: '#22c55e'
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-emerald-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <Wind className="w-2.5 h-2.5 text-emerald-400" />
        <span>Campo Vectorial (u, v)</span>
      </div>
      <svg width={size.w} height={size.h} viewBox="0 0 500 280" className="w-full h-auto max-h-[280px]">
        {/* Source point */}
        <circle cx="80" cy="140" r="14" fill="#ef4444" opacity="0.9" />
        <text x="80" y="144" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace">FOCO</text>

        {/* Advection Plume Cone */}
        <path d="M 80 140 L 440 60 L 440 220 Z" fill="url(#plumeGrad)" opacity="0.45" />
        <defs>
          <linearGradient id="plumeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Wind vector arrows */}
        <g className="cursor-pointer" onClick={() => setTooltip(tipAdvection)}>
          {[80, 160, 240, 320, 400].map((x, i) => (
            <g key={i}>
              <motion.line
                x1={x}
                y1={140}
                x2={x + 50}
                y2={140}
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="6 3"
                animate={{ strokeDashoffset: [-18, 0] }}
                transition={{ repeat: Infinity, duration: 1.0, ease: 'linear' }}
              />
              <polygon points={`${x + 55},140 ${x + 45},135 ${x + 45},145`} fill="#10b981" />
            </g>
          ))}
          <text x="260" y="125" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="bold" fontFamily="monospace">
            Vector Velocidad u_vec = (u, v)
          </text>
          <text x="260" y="165" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
            Advección Convectiva -u · ∇C (Conservación de Masa)
          </text>
        </g>

        {/* Receptor Stations */}
        <circle cx="360" cy="100" r="8" fill="#38bdf8" />
        <text x="375" y="104" fill="#38bdf8" fontSize="9" fontFamily="monospace">Receptor A</text>
        <circle cx="420" cy="170" r="8" fill="#38bdf8" />
        <text x="435" y="174" fill="#38bdf8" fontSize="9" fontFamily="monospace">Receptor B</text>
      </svg>
      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <ScientificTooltip
          title={tipAdvection.title}
          content={tipAdvection.description}
          formula={tipAdvection.formulaLaTeX}
          regulatory={tipAdvection.regulatoryStandard}
          citation={tipAdvection.literatureCitation}
          position="top"
          width="w-[340px]"
        >
          <button type="button" onClick={() => setTooltip(tipAdvection)} className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer">
            <Info className="w-2.5 h-2.5" /> Detalle de Término Advectivo en Navier-Stokes
          </button>
        </ScientificTooltip>
      </div>
      <TooltipOverlay tooltip={tooltip} onClose={() => setTooltip(null)} compact={compact} />
    </div>
  );
};

/* =========================================================================
   4. OROGRAPHIC BRUNT-VÄISÄLÄ & FROUDE NUMBER DIAGRAM
   ========================================================================= */
export const OrographicBruntVaisalaDiagram: React.FC<SubDiagramProps> = ({ compact = false }) => {
  const [tooltip, setTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 500, h: 280 };

  const tipFroude: DiagramTooltipInfo = {
    id: 'froude',
    title: 'Forzamiento Orográfico y Número de Froude (Fr)',
    discipline: 'Dinámica Orográfica & Ondas de Montaña',
    formulaLaTeX: 'Fr = \\frac{U}{N \\cdot h_{monte}}, \\quad N = \\sqrt{\\frac{g}{\\theta_0}\\frac{\\partial \\theta}{\\partial z}}',
    description: 'Si Fr < 1, el flujo no tiene suficiente energía cinética para superar los Montes de Málaga y queda bloqueado/estancado. Si Fr > 1, sobrevuele la cresta generando ondas de sotavento y calentamiento adiabático (Efecto Föhn / Terral).',
    regulatoryStandard: 'AEMET Predicción de Vientos Terrales y Ondas de Gravedad',
    literatureCitation: 'Baines (1995), Topographic Effects in Stratified Flows',
    empiricalMalagaContext: 'Terral de verano provoca picos térmicos > 42°C y sequedad con Fr > 1.2 en la cuenca malagueña.',
    accentColor: '#f97316'
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-orange-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <Mountain className="w-2.5 h-2.5 text-orange-400" />
        <span>Estratificación Brunt-Väisälä (N, Fr)</span>
      </div>
      <svg width={size.w} height={size.h} viewBox="0 0 500 280" className="w-full h-auto max-h-[280px]">
        {/* Mountain Profile (Montes de Málaga) */}
        <path d="M 40 230 L 160 230 Q 250 80 320 80 Q 380 80 460 230 Z" fill="#334155" stroke="#64748b" strokeWidth="2" />
        <text x="320" y="110" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="bold" fontFamily="monospace">Montes de Málaga (h ≈ 1000m)</text>

        {/* Upwind stratified streamlines */}
        <g className="cursor-pointer" onClick={() => setTooltip(tipFroude)}>
          <motion.path
            d="M 50 180 Q 180 180 240 190"
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            strokeDasharray="6 3"
            animate={{ strokeDashoffset: [-18, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          />
          <text x="110" y="170" fill="#f87171" fontSize="9" fontWeight="bold" fontFamily="monospace">Fr &lt; 1: Bloqueo / Estancamiento</text>

          {/* Over-the-top Fohn streamline */}
          <motion.path
            d="M 50 120 Q 220 120 300 70 Q 360 70 450 200"
            fill="none"
            stroke="#f97316"
            strokeWidth="3.5"
            strokeDasharray="8 4"
            animate={{ strokeDashoffset: [-24, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          />
          <text x="390" y="145" fill="#fb923c" fontSize="10" fontWeight="bold" fontFamily="monospace">Fr &gt; 1: Terral / Föhn (+ΔT)</text>
          <text x="390" y="160" fill="#fed7aa" fontSize="8" fontFamily="monospace">Calentamiento Adiabático</text>
        </g>
      </svg>
      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <ScientificTooltip
          title={tipFroude.title}
          content={tipFroude.description}
          formula={tipFroude.formulaLaTeX}
          regulatory={tipFroude.regulatoryStandard}
          citation={tipFroude.literatureCitation}
          position="top"
          width="w-[340px]"
        >
          <button type="button" onClick={() => setTooltip(tipFroude)} className="text-orange-400 hover:underline flex items-center gap-1 cursor-pointer">
            <Info className="w-2.5 h-2.5" /> Frecuencia de Brunt-Väisälä y Criterio de Froude
          </button>
        </ScientificTooltip>
      </div>
      <TooltipOverlay tooltip={tooltip} onClose={() => setTooltip(null)} compact={compact} />
    </div>
  );
};

/* =========================================================================
   5. AOD OPTICAL EXTINCTION & BEER-LAMBERT DIAGRAM
   ========================================================================= */
export const AodOpticalExtinctionDiagram: React.FC<SubDiagramProps> = ({ compact = false }) => {
  const [tooltip, setTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 500, h: 280 };

  const tipAod: DiagramTooltipInfo = {
    id: 'aod',
    title: 'Atenuación Óptica de Aerosoles (AOD a 550 nm)',
    discipline: 'Física Radiativa & Teledetección',
    formulaLaTeX: '\\tau_{550} = \\int_0^\\infty \\beta_{ext}(z) \\, dz, \\quad I = I_0 \\exp\\left(-\\frac{\\tau_{550}}{\\cos\\theta_z}\\right)',
    description: 'La presencia de partículas de calima sahariana y aerosoles secundarios extingue la radiación solar directa por dispersión Mie, alterando el flujo actínico de fotólisis de NO2.',
    regulatoryStandard: 'NASA AERONET / Sentinel-5P TROPOMI Cal/Val',
    literatureCitation: 'Holben et al. (1998); Seinfeld & Pandis (2016)',
    empiricalMalagaContext: 'AOD > 0.60 en episodios de calima sahariana africana en la bahía.',
    accentColor: '#eab308'
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-yellow-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <Sun className="w-2.5 h-2.5 text-yellow-400" />
        <span>Beer-Lambert & AERONET</span>
      </div>
      <svg width={size.w} height={size.h} viewBox="0 0 500 280" className="w-full h-auto max-h-[280px]">
        {/* Sun */}
        <circle cx="80" cy="45" r="22" fill="#facc15" />
        <text x="80" y="50" textAnchor="middle" fill="#713f12" fontSize="10" fontWeight="bold" fontFamily="monospace">I_0 (TOA)</text>

        {/* Atmospheric Column Layer */}
        <rect x="150" y="30" width="200" height="190" rx="8" fill="#ca8a04" opacity="0.25" stroke="#eab308" strokeWidth="1.5" strokeDasharray="4 4" />
        <text x="250" y="50" textAnchor="middle" fill="#fde047" fontSize="10" fontWeight="bold" fontFamily="monospace">Columna de Aerosoles / Calima</text>
        <text x="250" y="65" textAnchor="middle" fill="#fef08a" fontSize="8" fontFamily="monospace">Espesor Óptico τ_550 (Dispersión Mie)</text>

        {/* Extinction Beams */}
        <g className="cursor-pointer" onClick={() => setTooltip(tipAod)}>
          <motion.line
            x1="105"
            y1="50"
            x2="380"
            y2="200"
            stroke="#facc15"
            strokeWidth="3.5"
            strokeDasharray="8 4"
            animate={{ strokeDashoffset: [-24, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          />
          <text x="430" y="210" textAnchor="middle" fill="#fde047" fontSize="10" fontWeight="bold" fontFamily="monospace">I_sup = I_0 e^(-τ/μ)</text>
          <text x="430" y="225" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">Radiancia Transmitida</text>
        </g>
      </svg>
      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <ScientificTooltip
          title={tipAod.title}
          content={tipAod.description}
          formula={tipAod.formulaLaTeX}
          regulatory={tipAod.regulatoryStandard}
          citation={tipAod.literatureCitation}
          position="top"
          width="w-[340px]"
        >
          <button type="button" onClick={() => setTooltip(tipAod)} className="text-yellow-400 hover:underline flex items-center gap-1 cursor-pointer">
            <Info className="w-2.5 h-2.5" /> Ver Ley de Beer-Lambert y Espesor Óptico AOD
          </button>
        </ScientificTooltip>
      </div>
      <TooltipOverlay tooltip={tooltip} onClose={() => setTooltip(null)} compact={compact} />
    </div>
  );
};

/* =========================================================================
   6. COASTAL HALOGEN ClNO2 ACTIVATION DIAGRAM
   ========================================================================= */
export const CoastalHalogenClno2Diagram: React.FC<SubDiagramProps> = ({ compact = false }) => {
  const [tooltip, setTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 500, h: 280 };

  const tipClno2: DiagramTooltipInfo = {
    id: 'clno2',
    title: 'Química Heterogénea Nocturna de ClNO2 & Spray Salino',
    discipline: 'Química Atmosférica Costera',
    formulaLaTeX: 'N_2O_5 + Cl^-_{(aq)} \\xrightarrow{\\gamma} \\phi \\, ClNO_2 + NO_3^-, \\quad ClNO_2 + h\\nu \\to Cl^\\bullet + NO_2',
    description: 'En la bahía de Málaga, el N2O5 nocturno reacciona con aerosoles de sal marina generando nitrilo de cloro. Al amanecer, la fotólisis libera radicales Cl• superreactivos que aceleran la oxidación temprana de COVs y la formación de ozono.',
    regulatoryStandard: 'Directiva 2008/50/CE Precursores Fotoquímicos',
    literatureCitation: 'Thornton et al. (2010), Nature; Osthoff et al. (2008)',
    empiricalMalagaContext: 'Picos de hasta 850 pptv de ClNO2 observados en el litoral de Málaga al amanecer.',
    accentColor: '#06b6d4'
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-cyan-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <Droplets className="w-2.5 h-2.5 text-cyan-400" />
        <span>Halógenos Marinos (ClNO₂)</span>
      </div>
      <svg width={size.w} height={size.h} viewBox="0 0 500 280" className="w-full h-auto max-h-[280px]">
        {/* Nocturnal aerosol droplet */}
        <circle cx="150" cy="140" r="45" fill="#083344" stroke="#06b6d4" strokeWidth="2.5" />
        <text x="150" y="135" textAnchor="middle" fill="#67e8f9" fontSize="11" fontWeight="bold" fontFamily="monospace">Spray Marino</text>
        <text x="150" y="150" textAnchor="middle" fill="#a5f3fc" fontSize="9" fontFamily="monospace">NaCl(aq) + N₂O₅</text>

        {/* Reaction arrow to ClNO2 */}
        <g className="cursor-pointer" onClick={() => setTooltip(tipClno2)}>
          <motion.path
            d="M 200 140 L 320 140"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="3"
            strokeDasharray="6 3"
            animate={{ strokeDashoffset: [-18, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          />
          <text x="260" y="125" textAnchor="middle" fill="#22d3ee" fontSize="10" fontWeight="bold" fontFamily="monospace">γ(N₂O₅) ≈ 0.03</text>
          <text x="260" y="160" textAnchor="middle" fill="#cffafe" fontSize="9" fontFamily="monospace">Rendimiento φ ≈ 0.85</text>

          {/* Morning ClNO2 & Cl radical */}
          <rect x="330" y="110" width="130" height="60" rx="8" fill="#164e63" stroke="#22d3ee" strokeWidth="1.5" />
          <text x="395" y="132" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="monospace">ClNO₂ (pptv)</text>
          <text x="395" y="152" textAnchor="middle" fill="#a5f3fc" fontSize="9" fontWeight="bold" fontFamily="monospace">hν → Cl• + NO₂</text>
        </g>
      </svg>
      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <ScientificTooltip
          title={tipClno2.title}
          content={tipClno2.description}
          formula={tipClno2.formulaLaTeX}
          regulatory={tipClno2.regulatoryStandard}
          citation={tipClno2.literatureCitation}
          position="top"
          width="w-[340px]"
        >
          <button type="button" onClick={() => setTooltip(tipClno2)} className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer">
            <Info className="w-2.5 h-2.5" /> Ver Mecanismo Heterogéneo de Activación de ClNO₂
          </button>
        </ScientificTooltip>
      </div>
      <TooltipOverlay tooltip={tooltip} onClose={() => setTooltip(null)} compact={compact} />
    </div>
  );
};

/* =========================================================================
   7. BVOC ISOPRENE EMISSION & SOA YIELD DIAGRAM (MEGAN 2.1)
   ========================================================================= */
export const BvocIsopreneSoaDiagram: React.FC<SubDiagramProps> = ({ compact = false }) => {
  const [tooltip, setTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 500, h: 280 };

  const tipBvoc: DiagramTooltipInfo = {
    id: 'bvoc',
    title: 'Cinética Biogénica de Isopreno & Rendimiento SOA (MEGAN)',
    discipline: 'Química Biogénica & Aerosoles Secundarios',
    formulaLaTeX: 'E_{iso} = \\epsilon_0 \\cdot C_L(PAR) \\cdot C_T(T_f) \\cdot LAI, \\quad SOA = Y_{soa} \\cdot \\Delta BVOC',
    description: 'La vegetación urbana emite isopreno y terpenos activados por luz PAR y temperatura foliar. Su rápida oxidación con radicales OH genera aerosoles orgánicos secundarios (SOA) que incrementan PM2.5.',
    regulatoryStandard: 'Directiva UE 2016/2284 Techos Nacionales de Emisión',
    literatureCitation: 'Guenther et al. (2012), MEGAN2.1; Odum et al. (1996)',
    empiricalMalagaContext: 'Parque de Málaga y Alameda Principal emiten picos de BVOCs en verano con T > 30°C.',
    accentColor: '#10b981'
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-emerald-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
        <span>MEGAN 2.1 & SOA</span>
      </div>
      <svg width={size.w} height={size.h} viewBox="0 0 500 280" className="w-full h-auto max-h-[280px]">
        {/* Tree Canopy */}
        <circle cx="100" cy="140" r="40" fill="#065f46" stroke="#10b981" strokeWidth="2" />
        <rect x="94" y="180" width="12" height="40" fill="#78350f" />
        <text x="100" y="145" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontWeight="bold" fontFamily="monospace">Canopia (LAI)</text>

        {/* BVOC Emission Flow */}
        <g className="cursor-pointer" onClick={() => setTooltip(tipBvoc)}>
          <motion.path
            d="M 145 130 L 250 100"
            fill="none"
            stroke="#34d399"
            strokeWidth="3"
            strokeDasharray="6 3"
            animate={{ strokeDashoffset: [-18, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          />
          <text x="200" y="90" fill="#6ee7b7" fontSize="10" fontWeight="bold" fontFamily="monospace">Isopreno C₅H₈</text>

          {/* OH Oxidation Reactor */}
          <circle cx="280" cy="120" r="28" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
          <text x="280" y="124" textAnchor="middle" fill="#c7d2fe" fontSize="10" fontWeight="bold" fontFamily="monospace">+ •OH</text>

          {/* SOA Aerosol Yield */}
          <motion.path
            d="M 310 120 L 380 140"
            fill="none"
            stroke="#e879f9"
            strokeWidth="3"
            strokeDasharray="6 3"
            animate={{ strokeDashoffset: [-18, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
          />
          <rect x="390" y="115" width="90" height="50" rx="6" fill="#4a044e" stroke="#f472b6" strokeWidth="1.5" />
          <text x="435" y="136" textAnchor="middle" fill="#fdf2f8" fontSize="10" fontWeight="bold" fontFamily="monospace">SOA (PM₂.₅)</text>
          <text x="435" y="152" textAnchor="middle" fill="#fbcfe8" fontSize="8" fontFamily="monospace">Y_soa ≈ 5-15%</text>
        </g>
      </svg>
      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <ScientificTooltip
          title={tipBvoc.title}
          content={tipBvoc.description}
          formula={tipBvoc.formulaLaTeX}
          regulatory={tipBvoc.regulatoryStandard}
          citation={tipBvoc.literatureCitation}
          position="top"
          width="w-[340px]"
        >
          <button type="button" onClick={() => setTooltip(tipBvoc)} className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer">
            <Info className="w-2.5 h-2.5" /> Modelo MEGAN 2.1 y Rendimiento SOA
          </button>
        </ScientificTooltip>
      </div>
      <TooltipOverlay tooltip={tooltip} onClose={() => setTooltip(null)} compact={compact} />
    </div>
  );
};

/* =========================================================================
   8. NO₂ COPERT 5 TRAFFIC & MARINE SCAVENGING BALANCE DIAGRAM
   ========================================================================= */
export const No2CopertMarineScavengingDiagram: React.FC<SubDiagramProps> = ({ compact = false }) => {
  const [tooltip, setTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 500, h: 280 };

  const tipScavenging: DiagramTooltipInfo = {
    id: 'copert_marine_scavenging',
    title: 'Balance NO₂: Emisión COPERT 5 & Depuración por Aerosol Marino',
    discipline: 'Química y Transporte Atmosférico',
    formulaLaTeX: 'C_{\\text{NO}_2}(1.8\\text{m}) = C_{\\text{fondo}} + \\frac{Q_{\\text{veh}} \\cdot E_{\\text{NO}_x} \\cdot f_{\\text{NO}_2}}{u_{\\text{cañón}} \\cdot W} - k_{\\text{marino}} [\\text{NaCl}] [\\text{N}_2\\text{O}_5]',
    description: 'Balance acoplado entre la inyección directa de NOx vehicular (modelo COPERT 5 Tier 3 en cañones urbanos de Málaga) y el sumidero heterogéneo de aerosoles salinos marinos en la bahía de Málaga.',
    regulatoryStandard: 'Directiva 2008/50/CE (Límite Anual 40 µg/m³ / Horario 200 µg/m³) & Guía EMEP/EEA 2023',
    literatureCitation: 'Guía EMEP/EEA 2023 (COPERT 5) & Thornton et al. (2010), Nature 464, 271-274',
    empiricalMalagaContext: 'Atenuación de hasta -14% de NO₂ en la fachada litoral de Málaga por spray salino mediterráneo.',
    accentColor: '#38bdf8'
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-sky-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-sky-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-sky-800/40 z-10 pointer-events-none">
        <Droplets className="w-2.5 h-2.5 text-sky-400" />
        <span>Tráfico COPERT 5 ↔ Spray Marino</span>
      </div>

      <svg width={size.w} height={size.h} viewBox="0 0 500 280" className="w-full h-auto max-h-[280px]">
        {/* Fuente Urbana de Tráfico COPERT 5 */}
        <g className="cursor-pointer" onClick={() => setTooltip(tipScavenging)}>
          <rect x="25" y="100" width="135" height="75" rx="8" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.5" />
          <text x="92" y="125" textAnchor="middle" fill="#c7d2fe" fontSize="11" fontWeight="bold" fontFamily="monospace">
            COPERT 5 (Flota)
          </text>
          <text x="92" y="145" textAnchor="middle" fill="#a5b4fc" fontSize="9" fontFamily="monospace">
            Q_veh · E_NOx · f_NO₂
          </text>
          <text x="92" y="162" textAnchor="middle" fill="#818cf8" fontSize="8" fontFamily="monospace">
            Cañón Urbano H/W
          </text>
        </g>

        {/* Flecha de emisión hacia receptor 1.8m */}
        <motion.path
          d="M 160 137 L 235 137"
          fill="none"
          stroke="#818cf8"
          strokeWidth="3"
          strokeDasharray="6 3"
          animate={{ strokeDashoffset: [-18, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        />

        {/* Receptor peatonal a 1.8m AGL */}
        <g className="cursor-pointer" onClick={() => setTooltip(tipScavenging)}>
          <circle cx="250" cy="137" r="28" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="2" />
          <text x="250" y="133" textAnchor="middle" fill="#e0f2fe" fontSize="10" fontWeight="bold" fontFamily="monospace">
            NO₂
          </text>
          <text x="250" y="148" textAnchor="middle" fill="#7dd3fc" fontSize="8" fontFamily="monospace">
            1.8m AGL
          </text>
        </g>

        {/* Flecha hacia sumidero marino */}
        <motion.path
          d="M 280 137 L 355 137"
          fill="none"
          stroke="#0284c7"
          strokeWidth="3"
          strokeDasharray="6 3"
          animate={{ strokeDashoffset: [-18, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        />

        {/* Spray Marino Bahía de Málaga (Sumidero heterogéneo) */}
        <g className="cursor-pointer" onClick={() => setTooltip(tipScavenging)}>
          <rect x="355" y="100" width="125" height="75" rx="8" fill="#082f49" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="417" y="125" textAnchor="middle" fill="#bae6fd" fontSize="11" fontWeight="bold" fontFamily="monospace">
            Spray Marino
          </text>
          <text x="417" y="143" textAnchor="middle" fill="#7dd3fc" fontSize="9" fontFamily="monospace">
            NaCl(aq) + N₂O₅
          </text>
          <text x="417" y="160" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace">
            Sumidero: -14% NO₂
          </text>
        </g>
      </svg>

      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <ScientificTooltip
          title={tipScavenging.title}
          content={tipScavenging.description}
          formula={tipScavenging.formulaLaTeX}
          regulatory={tipScavenging.regulatoryStandard}
          citation={tipScavenging.literatureCitation}
          position="top"
          width="w-[340px]"
        >
          <button type="button" onClick={() => setTooltip(tipScavenging)} className="text-sky-400 hover:underline flex items-center gap-1 cursor-pointer">
            <Info className="w-2.5 h-2.5" /> Balance COPERT 5 y Depuración por Spray Marino (Bahía de Málaga)
          </button>
        </ScientificTooltip>
      </div>
      <TooltipOverlay tooltip={tooltip} onClose={() => setTooltip(null)} compact={compact} />
    </div>
  );
};

