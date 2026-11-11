import React from 'react';
import { motion } from 'motion/react';
import { Zap, Sun, Moon, Waves, Sparkles, Activity, ShieldCheck, Flame, Compass } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';

interface RadicalKineticsDiagramProps {
  ohConcentrationMoleculesCm3: number;
  no3ConcentrationPpt: number;
  clConcentrationMoleculesCm3: number;
  honoPpb: number;
  clno2Ppt: number;
  svf: number;
  uvIndex: number;
  isDaytime: boolean;
}

export function RadicalKineticsDiagram({
  ohConcentrationMoleculesCm3,
  no3ConcentrationPpt,
  clConcentrationMoleculesCm3,
  honoPpb,
  clno2Ppt,
  svf,
  uvIndex,
  isDaytime
}: RadicalKineticsDiagramProps) {
  // SVG Canvas dimensions: 620x360
  const width = 620;
  const height = 360;

  // Formatting helpers
  const formatSci = (val: number) => {
    if (val === 0) return '0';
    const exp = Math.floor(Math.log10(val));
    const mant = (val / Math.pow(10, exp)).toFixed(2);
    return `${mant}×10${exp >= 0 ? `⁺${exp}` : `⁻${Math.abs(exp)}`}`;
  };

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-3 font-sans shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-purple-500/10 border border-purple-500/30">
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Red Fotoquímica de Radicales Libres &amp; Capacidad Oxidativa (AOC)</span>
              <ScientificTooltip
                topic="coastal_halogen_clno2"
                title="Capacidad Oxidativa Atmosférica (AOC) en Málaga"
                content="La AOC representa la suma de las velocidades de oxidación de COVs por los tres oxidantes primarios: •OH (diurno), Cl• (costero/amanecer) y •NO₃ (nocturno), según los mecanismos químicos MCM v3.3.1 e IUPAC."
                formula="\text{AOC} = \sum_i k_{\text{OH},i}[\text{OH}][\text{VOC}_i] + \sum_i k_{\text{Cl},i}[\text{Cl}][\text{VOC}_i] + \sum_i k_{\text{NO}_3,i}[\text{NO}_3][\text{VOC}_i]"
                position="bottom"
              />
            </h4>
            <p className="text-[9.5px] text-slate-400">
              Mecanismo IUPAC / MCM v3.3.1 • Iniciación, propagación y terminación de •OH, •NO₃ y Cl• en Málaga
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <ScientificTooltip
            title="Factor de Visión de Cielo & Flujo Actínico"
            content="El confinamiento del cañón calle reduce la radiación UV actínica disponible para la fotólisis de O3, HONO y ClNO2 en proporción directa al SVF."
            position="bottom"
          >
            <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-purple-300 cursor-help">
              SVF: {(svf * 100).toFixed(0)}% • UV: {uvIndex.toFixed(1)}
            </span>
          </ScientificTooltip>
          <ScientificTooltip
            title="Régimen Fotoquímico Diurno / Nocturno"
            content="La alternancia día/noche conmuta radicalmente el eje oxidativo troposférico entre el radical hidroxilo (•OH diurno) y el radical nitrato (•NO3 nocturno)."
            position="bottom"
          >
            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded flex items-center gap-1 cursor-help ${
              isDaytime
                ? 'bg-amber-950/80 text-amber-300 border border-amber-700/80'
                : 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/80'
            }`}>
              {isDaytime ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-indigo-400" />}
              {isDaytime ? 'Régimen Diurno' : 'Régimen Nocturno'}
            </span>
          </ScientificTooltip>
        </div>
      </div>

      {/* SVG Kinetic Diagram */}
      <div className="relative w-full overflow-hidden bg-slate-900/60 rounded-lg border border-slate-800/60">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          id="radical-kinetics-svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="ohNodeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>
            <linearGradient id="no3NodeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="clNodeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0e7490" />
            </linearGradient>

            {/* Marker Arrows */}
            <marker id="arrowPurple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#a78bfa" />
            </marker>
            <marker id="arrowAmber" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#fbbf24" />
            </marker>
            <marker id="arrowCyan" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#22d3ee" />
            </marker>
            <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#60a5fa" />
            </marker>

            {/* Glowing filter */}
            <filter id="radicalGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Photochemical Sources (Left Box) */}
          {/* O3 + hv -> O(1D) + H2O -> 2 OH */}
          <rect x="20" y="25" width="130" height="65" rx="6" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.2" opacity="0.9" />
          <text x="30" y="42" fill="#fbbf24" fontSize="9.5" fontWeight="bold">Fotólisis de O₃ (UV-B)</text>
          <text x="30" y="56" fill="#94a3b8" fontSize="8" fontFamily="monospace">O₃ + hν → O(¹D) + O₂</text>
          <text x="30" y="70" fill="#cbd5e1" fontSize="8" fontFamily="monospace">O(¹D) + H₂O → 2 •OH</text>

          {/* HONO + hv -> NO + OH */}
          <rect x="20" y="105" width="130" height="55" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.2" opacity="0.9" />
          <text x="30" y="122" fill="#f59e0b" fontSize="9.5" fontWeight="bold">Fotólisis HONO (Amanecer)</text>
          <text x="30" y="136" fill="#94a3b8" fontSize="8" fontFamily="monospace">HONO + hν → NO + •OH</text>
          <text x="30" y="149" fill="#fde68a" fontSize="7.5" fontFamily="monospace">Pico matutino: {honoPpb.toFixed(2)} ppb</text>

          {/* ClNO2 + hv -> Cl + NO2 (Marine spray) */}
          <rect x="20" y="175" width="130" height="65" rx="6" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.2" opacity="0.9" />
          <text x="30" y="192" fill="#22d3ee" fontSize="9.5" fontWeight="bold">Halógenos Litorales</text>
          <text x="30" y="206" fill="#94a3b8" fontSize="8" fontFamily="monospace">N₂O₅(g) + Cl⁻(aq) → ClNO₂</text>
          <text x="30" y="220" fill="#cbd5e1" fontSize="8" fontFamily="monospace">ClNO₂ + hν → Cl• + NO₂</text>
          <text x="30" y="233" fill="#a5f3fc" fontSize="7.5" fontFamily="monospace">Nivel Bahía: {clno2Ppt.toFixed(0)} ppt</text>

          {/* Nocturnal NO2 + O3 -> NO3 */}
          <rect x="20" y="255" width="130" height="65" rx="6" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.2" opacity="0.9" />
          <text x="30" y="272" fill="#60a5fa" fontSize="9.5" fontWeight="bold">Química Nocturna NO₃</text>
          <text x="30" y="286" fill="#94a3b8" fontSize="8" fontFamily="monospace">NO₂ + O₃ → •NO₃ + O₂</text>
          <text x="30" y="300" fill="#cbd5e1" fontSize="8" fontFamily="monospace">•NO₃ + NO₂ ⇌ N₂O₅</text>
          <text x="30" y="313" fill="#bfdbfe" fontSize="7.5" fontFamily="monospace">Vida media: ~4.5 s</text>

          {/* 2. Reaction Connecting Paths with Flow Arrows */}
          {/* Path 1: O3/HONO -> OH Radical Node */}
          <path d="M 150 55 C 200 55, 220 90, 260 100" fill="none" stroke="#fbbf24" strokeWidth="1.8" markerEnd="url(#arrowAmber)" />
          <path d="M 150 130 C 200 130, 220 115, 260 110" fill="none" stroke="#f59e0b" strokeWidth="1.8" markerEnd="url(#arrowAmber)" />

          {/* Path 2: ClNO2 -> Cl Radical Node */}
          <path d="M 150 205 C 200 205, 220 205, 260 205" fill="none" stroke="#22d3ee" strokeWidth="1.8" markerEnd="url(#arrowCyan)" />

          {/* Path 3: Nocturnal -> NO3 Radical Node */}
          <path d="M 150 285 C 200 285, 220 285, 260 285" fill="none" stroke="#60a5fa" strokeWidth="1.8" markerEnd="url(#arrowBlue)" />

          {/* 3. Central Core: Primary Radical Oxidants */}
          {/* OH Radical (El "Detergente de la Atmósfera") */}
          <g transform="translate(260, 75)">
            <rect width="130" height="70" rx="8" fill="url(#ohNodeGrad)" stroke="#c4b5fd" strokeWidth="2" filter="url(#radicalGlow)" />
            <circle cx="115" cy="18" r="4" fill="#ffffff" className="animate-ping" />
            <text x="12" y="24" fill="#ffffff" fontSize="12" fontWeight="bold">Radical Hidroxilo •OH</text>
            <text x="12" y="42" fill="#ede9fe" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
              {formatSci(ohConcentrationMoleculesCm3)} molec/cm³
            </text>
            <text x="12" y="58" fill="#ddd6fe" fontSize="8" fontFamily="monospace">
              τ ≈ 0.8 s • Oxidante Diurno Mayor
            </text>
          </g>

          {/* Cl Radical (Ultra-reactivo litoral) */}
          <g transform="translate(260, 170)">
            <rect width="130" height="65" rx="8" fill="url(#clNodeGrad)" stroke="#67e8f9" strokeWidth="1.8" filter="url(#radicalGlow)" />
            <text x="12" y="22" fill="#ffffff" fontSize="11" fontWeight="bold">Átomo de Cloro Cl•</text>
            <text x="12" y="38" fill="#ecfeff" fontSize="9" fontFamily="monospace" fontWeight="bold">
              {formatSci(clConcentrationMoleculesCm3)} molec/cm³
            </text>
            <text x="12" y="53" fill="#cffafe" fontSize="8" fontFamily="monospace">
              k_VOC hasta 100× k_OH
            </text>
          </g>

          {/* NO3 Radical (Oxidante Nocturno) */}
          <g transform="translate(260, 255)">
            <rect width="130" height="65" rx="8" fill="url(#no3NodeGrad)" stroke="#93c5fd" strokeWidth="1.8" filter="url(#radicalGlow)" />
            <text x="12" y="22" fill="#ffffff" fontSize="11" fontWeight="bold">Radical Nitrato •NO₃</text>
            <text x="12" y="38" fill="#eff6ff" fontSize="9" fontFamily="monospace" fontWeight="bold">
              {no3ConcentrationPpt.toFixed(1)} ppt ({(no3ConcentrationPpt * 2.46e7).toExponential(1)} cm⁻³)
            </text>
            <text x="12" y="53" fill="#dbeafe" fontSize="8" fontFamily="monospace">
              Oxida alquenos y BVOCs de noche
            </text>
          </g>

          {/* 4. Propagating Catalytic Oxidation Cycles (Right Side) */}
          {/* VOC Oxidation & RO2 -> HO2 Cycle */}
          <path d="M 390 105 C 430 105, 440 85, 470 85" fill="none" stroke="#a78bfa" strokeWidth="1.8" markerEnd="url(#arrowPurple)" />
          <path d="M 390 200 C 430 200, 440 120, 470 105" fill="none" stroke="#22d3ee" strokeWidth="1.8" markerEnd="url(#arrowCyan)" />
          <path d="M 390 285 C 430 285, 440 240, 470 230" fill="none" stroke="#60a5fa" strokeWidth="1.8" markerEnd="url(#arrowBlue)" />

          {/* Propagating Box 1: VOC/BVOCs Degradation */}
          <rect x="470" y="45" width="135" height="110" rx="6" fill="#0f172a" stroke="#8b5cf6" strokeWidth="1.2" opacity="0.95" />
          <text x="480" y="62" fill="#c4b5fd" fontSize="9.5" fontWeight="bold">Ciclo Catalítico HOₓ / ROₓ</text>
          <text x="480" y="78" fill="#cbd5e1" fontSize="8" fontFamily="monospace">VOC + •OH (+O₂) → RO₂•</text>
          <text x="480" y="93" fill="#cbd5e1" fontSize="8" fontFamily="monospace">RO₂• + NO → RO• + NO₂</text>
          <text x="480" y="108" fill="#cbd5e1" fontSize="8" fontFamily="monospace">RO• + O₂ → R'CHO + HO₂•</text>
          <text x="480" y="123" fill="#38bdf8" fontSize="8" fontFamily="monospace">HO₂• + NO → •OH + NO₂</text>
          <text x="480" y="138" fill="#fbbf24" fontSize="8" fontWeight="bold">➡ Reciclaje neto de •OH y O₃</text>

          {/* Termination Sinks (Bottom Right Box) */}
          <rect x="470" y="175" width="135" height="145" rx="6" fill="#0f172a" stroke="#ef4444" strokeWidth="1.2" opacity="0.95" />
          <text x="480" y="193" fill="#f87171" fontSize="9.5" fontWeight="bold">Sumideros de Terminación</text>
          
          <text x="480" y="212" fill="#cbd5e1" fontSize="8" fontFamily="monospace">•OH + NO₂ + M → HNO₃(g)</text>
          <text x="480" y="225" fill="#fca5a5" fontSize="7.5">(Ácido Nítrico / SIA PM₂.₅)</text>

          <text x="480" y="244" fill="#cbd5e1" fontSize="8" fontFamily="monospace">HO₂• + HO₂• → H₂O₂ + O₂</text>
          <text x="480" y="257" fill="#fca5a5" fontSize="7.5">(Peróxido de Hidrógeno)</text>

          <text x="480" y="276" fill="#cbd5e1" fontSize="8" fontFamily="monospace">•NO₃ + VOC → Org-Nitratos</text>
          <text x="480" y="289" fill="#fca5a5" fontSize="7.5">(Nitrato Orgánico Aerosol)</text>

          <text x="480" y="306" fill="#94a3b8" fontSize="7.5" fontStyle="italic">
            Pérdida neta de radicales
          </text>
        </svg>
      </div>

      {/* Scientific Synthesis Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[9.5px] font-mono bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
        <ScientificTooltip
          title="Flujo de Oxidación Radicalaria Diurno"
          content="Durante las horas de sol en Málaga, el radical hidroxilo (•OH) domina más del 85% de la iniciación oxidativa de la troposfera urbana."
          position="top"
        >
          <div className="cursor-help">
            <span className="text-slate-400 block">Flujo de Oxidación Diurno:</span>
            <span className="text-purple-300 font-bold text-xs">
              {isDaytime ? 'Dominado por •OH (85%)' : 'Inhibido por falta de UV'}
            </span>
          </div>
        </ScientificTooltip>

        <ScientificTooltip
          topic="coastal_halogen_clno2"
          title="Amplificación por Química Halógena Costera"
          content="La fotólisis del cloruro de nitrilo (ClNO2) liberado del aerosol marino al amanecer adelanta e intensifica el pico matutino de oxidación en la bahía de Málaga."
          position="top"
        >
          <div className="cursor-help">
            <span className="text-slate-400 block">Contribución Halógena Litoral:</span>
            <span className="text-cyan-300 font-bold text-xs">
              +{(clno2Ppt / 8.5).toFixed(1)}% al amanecer en Bahía
            </span>
          </div>
        </ScientificTooltip>

        <ScientificTooltip
          title="Atenuación Actínica en Cañón por SVF"
          content="Los edificios reducen el ángulo sólido celeste disponible para la irradiancia UV, alargando los tiempos de vida de precursores y retrasando la química radicalaria."
          position="top"
        >
          <div className="cursor-help">
            <span className="text-slate-400 block">Regulación por Cañón (SVF):</span>
            <span className="text-amber-300 font-bold text-xs">
              Atenuación actinica: -{((1 - svf) * 100).toFixed(0)}%
            </span>
          </div>
        </ScientificTooltip>
      </div>
    </div>
  );
}
