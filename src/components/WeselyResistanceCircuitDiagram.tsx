import React, { useState, useMemo } from 'react';
import { Leaf, Sun, Wind, Droplets, Zap, Download, Layers, ShieldCheck } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { downloadVectorSvg } from '../lib/vectorExporter';
import { useActivePoint } from '../context/ActivePointContext';
import { MathFormula } from './MathFormula';

export interface WeselyDiagramProps {
  parWm2: number;
  airTempC: number;
  rhPct: number;
  ustarMs: number;
  selectedSpecies?: 'O3' | 'NO2' | 'PM25' | 'SO2';
  onClose?: () => void;
}

export const WeselyResistanceCircuitDiagram: React.FC<WeselyDiagramProps> = ({
  parWm2: propParWm2,
  airTempC: propAirTempC,
  rhPct: propRhPct,
  ustarMs: propUstarMs,
  selectedSpecies: initialSpecies = 'O3',
  onClose
}) => {
  const activeCtx = useActivePoint();
  const parWm2 = propParWm2 || ((activeCtx?.assimilation?.solarRadiationWm2 ?? 600) * 0.48);
  const airTempC = propAirTempC || (activeCtx?.assimilation?.temperatureC ?? 23.5);
  const rhPct = propRhPct || (activeCtx?.assimilation?.relativeHumidityPct ?? 58);
  const ustarMs = propUstarMs || Math.max(0.12, (activeCtx?.assimilation?.windSpeedMs ?? 3.2) * 0.11);

  const [species, setSpecies] = useState<'O3' | 'NO2' | 'PM25' | 'SO2'>(initialSpecies);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // 1. CÁLCULO ANALÍTICO DETERMINISTA DE RESISTENCIAS SEGÚN WESELY (1989)
  // Ra: Resistencia aerodinámica atmosférica (s/cm)
  // Ra = (1 / (k * u*)) * [ln(z/z0) - psi_h]
  const Ra = useMemo(() => {
    const k = 0.40; // Von Kármán
    const ustar = Math.max(0.05, ustarMs); // m/s
    const z = 10.0; // altura de referencia (m)
    const z0 = 0.8; // rugosidad urbana/dosel arbóreo (m)
    const ra_s_m = (1 / (k * ustar)) * Math.log(z / z0);
    return Math.max(0.05, parseFloat((ra_s_m / 100).toFixed(3))); // s/cm
  }, [ustarMs]);

  // Rb: Resistencia de subcapa cuasilaminar foliácea (s/cm)
  // Rb = (2 / (k * u*)) * (Sc / Pr)^(2/3)
  const Rb = useMemo(() => {
    const k = 0.40;
    const ustar = Math.max(0.05, ustarMs);
    // Relación de difusividades según especie
    const scPrRatio = species === 'O3' ? 1.3 : species === 'NO2' ? 1.4 : species === 'SO2' ? 1.5 : 2.2;
    const rb_s_m = (2 / (k * ustar)) * Math.pow(scPrRatio, 2 / 3);
    return Math.max(0.02, parseFloat((rb_s_m / 100).toFixed(3))); // s/cm
  }, [ustarMs, species]);

  // Rc: Red de resistencias de cubierta vegetal en paralelo (s/cm)
  // Rst: Resistencia estomática (regulada por PAR y temperatura)
  const Rst = useMemo(() => {
    const rst_min = species === 'O3' ? 1.2 : species === 'NO2' ? 1.5 : species === 'SO2' ? 1.0 : 999;
    if (species === 'PM25') return 999; // PM2.5 no entra por estomas
    const f_par = Math.max(0.1, Math.min(1.0, parWm2 / 800));
    const f_temp = (airTempC > 0 && airTempC < 40) ? Math.sin((airTempC / 40) * Math.PI) : 0.1;
    const rst = rst_min / (Math.max(0.05, f_par * f_temp));
    return parseFloat(rst.toFixed(2));
  }, [parWm2, airTempC, species]);

  // Rmes: Resistencia mesofílica
  const Rmes = useMemo(() => {
    if (species === 'O3') return 0.1; // Reacción instantánea con agua y antioxidantes
    if (species === 'NO2') return 1.0;
    if (species === 'SO2') return 0.05;
    return 999;
  }, [species]);

  // Rcut: Resistencia cuticular
  const Rcut = useMemo(() => {
    const rhFactor = rhPct > 70 ? 0.7 : 1.0;
    if (species === 'O3') return parseFloat((20.0 * rhFactor).toFixed(1));
    if (species === 'NO2') return parseFloat((35.0 * rhFactor).toFixed(1));
    if (species === 'SO2') return parseFloat((8.0 * rhFactor).toFixed(1));
    return 15.0; // PM2.5 impactación foliar
  }, [rhPct, species]);

  // Rsoil: Resistencia de suelo y hojarasca
  const Rsoil = useMemo(() => {
    if (species === 'O3') return 5.0;
    if (species === 'NO2') return 8.0;
    if (species === 'SO2') return 2.5;
    return 20.0;
  }, [species]);

  // Resistencia total de cubierta Rc (conductancias en paralelo)
  const Rc = useMemo(() => {
    if (species === 'PM25') {
      // Para partículas: impactación y difusión browniana
      return parseFloat((1 / (1 / Rcut + 1 / Rsoil)).toFixed(3));
    }
    const g_st = 1 / (Rst + Rmes);
    const g_cut = 1 / Rcut;
    const g_soil = 1 / Rsoil;
    const g_total = g_st + g_cut + g_soil;
    return parseFloat((1 / g_total).toFixed(3));
  }, [Rst, Rmes, Rcut, Rsoil, species]);

  // Resistencia total R_total = Ra + Rb + Rc
  const Rtotal = parseFloat((Ra + Rb + Rc).toFixed(3));
  
  // Velocidad de deposición seca vd = 1 / Rtotal (cm/s)
  const Vd_cm_s = parseFloat((1 / Rtotal).toFixed(3));
  const Vd_m_s = parseFloat((Vd_cm_s / 100).toFixed(5));

  // Exportar SVG vectorial
  const handleExportSvg = () => {
    downloadVectorSvg('wesely-circuit-svg', `circuito_resistencias_wesely_${species}_malaga.svg`);
  };

  const isDay = parWm2 > 30;

  return (
    <div className="flex flex-col gap-3 bg-[#0a0f18] text-slate-200 p-3 rounded border border-emerald-900/60 shadow-2xl">
      {/* HEADER CONTROL BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-2 border border-slate-800 rounded">
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-emerald-300">
            CIRCUITO ANÁLOGO DE RESISTENCIAS DE WESELY (1989)
          </span>
        </div>

        {/* SELECTOR DE ESPECIE QUÍMICA */}
        <div className="flex items-center gap-1 font-mono text-[10px]">
          {(['O3', 'NO2', 'PM25', 'SO2'] as const).map((sp) => (
            <ScientificTooltip
              key={sp}
              position="bottom"
              title={`Parametrización Difusiva y Estomática para ${sp}`}
              formula={sp === 'PM25' ? "v_d = v_{\\text{sed}} + \\frac{1}{r_a + r_b + r_a r_b v_{\\text{imp}}}" : "r_{st,i} = r_{st,\\text{H}_2\\text{O}} \\cdot \\frac{D_{\\text{H}_2\\text{O}}}{D_i} + r_{\\text{mes},i}"}
              explanation={`Conmuta las constantes de difusividad molecular (Sc/Pr), reactividad mesofílica (H* y f₀ de Wesely) y resistencia cuticular para ${sp}.`}
              normativeRef="Wesely (1989) Atmos. Environ. 23(6), 1293-1304"
            >
              <button
                onClick={() => setSpecies(sp)}
                className={`px-2 py-0.5 border font-bold transition-all cursor-pointer ${
                  species === sp
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {sp === 'O3' ? 'O₃ (Ozono)' : sp === 'NO2' ? 'NO₂' : sp === 'PM25' ? 'PM₂.₅' : 'SO₂'}
              </button>
            </ScientificTooltip>
          ))}

          <ScientificTooltip topic="wesely_dry_deposition" position="bottom" width="w-[280px]" content="Exportar diagrama del circuito resistivo de Wesely (1989) y velocidad de deposición seca v_d en formato vectorial SVG de alta resolución.">
            <button
              onClick={handleExportSvg}
              className="ml-2 px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded flex items-center gap-1 text-[10px] font-mono transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>SVG</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {/* SVG DIAGRAM CANVAS */}
      <div className="relative w-full bg-[#020617] border border-slate-800 rounded overflow-hidden">
        <svg
          id="wesely-circuit-svg"
          viewBox="0 0 720 380"
          className="w-full h-auto select-none"
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes flowDown {
              from { stroke-dashoffset: 40; }
              to { stroke-dashoffset: 0; }
            }
            @keyframes pulseNode {
              0% { r: 18; opacity: 0.8; }
              50% { r: 21; opacity: 1; }
              100% { r: 18; opacity: 0.8; }
            }
            @keyframes pulseCore {
              0% { transform: scale(0.98); opacity: 0.85; }
              50% { transform: scale(1.02); opacity: 1; }
              100% { transform: scale(0.98); opacity: 0.85; }
            }
            .anim-flow { stroke-dasharray: 6 6; animation: flowDown 1.4s linear infinite; }
            .anim-flow-fast { stroke-dasharray: 6 6; animation: flowDown 0.8s linear infinite; }
            .anim-pulse { animation: pulseNode 2.5s ease-in-out infinite; }
            .circuit-core { transform-origin: 590px 190px; animation: pulseCore 3s ease-in-out infinite; }
          `}} />

          <defs>
            <radialGradient id="wesely-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#064e3b" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#020617" stopOpacity="1" />
            </radialGradient>

            <linearGradient id="grad-atm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="grad-stoma" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="grad-cuticle" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="grad-soil" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="1" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.8" />
            </linearGradient>

            {/* Glowing filters */}
            <filter id="glow-cyan"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="glow-emerald"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="glow-amber"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="glow-purple"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>

            {/* Directional arrow heads */}
            <marker id="arrow-c" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#38bdf8" />
            </marker>
            <marker id="arrow-g" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#34d399" />
            </marker>
            <marker id="arrow-a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#fbbf24" />
            </marker>
            <marker id="arrow-p" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#a78bfa" />
            </marker>
          </defs>

          {/* Background grid */}
          <rect width="100%" height="100%" fill="url(#wesely-bg)" />
          <pattern id="grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1e293b" strokeWidth="0.4" strokeOpacity="0.4" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />

          {/* ATMOSPHERE SOURCE HEADER NODE */}
          <g transform="translate(240, 30)">
            <rect x="-160" y="-16" width="320" height="32" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" filter="url(#glow-cyan)" />
            <text x="0" y="-2" fill="#bae6fd" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              ATMÓSFERA LIBRE (Z = 10 m) · C({species})
            </text>
            <text x="0" y="10" fill="#7dd3fc" fontSize="8" textAnchor="middle" fontFamily="monospace">
              u* = {ustarMs.toFixed(2)} m/s · PAR = {parWm2} W/m² · T = {airTempC}°C
            </text>
          </g>

          {/* VERTICAL FLOW: ATMOSPHERE -> Ra */}
          <path d="M 240 46 L 240 90" fill="none" stroke="#38bdf8" strokeWidth="3" markerEnd="url(#arrow-c)" className="anim-flow" filter="url(#glow-cyan)" />

          {/* NODE 1: Ra (AERODYNAMIC RESISTANCE) */}
          <g
            transform="translate(240, 110)"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredNode('Ra')}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <rect x="-70" y="-20" width="140" height="40" rx="4" fill="#0c4a6e" stroke="#0284c7" strokeWidth="1.8" filter="url(#glow-cyan)" />
            {/* Resistor symbol */}
            <path d="M -50 0 L -35 -8 L -20 8 L -5 -8 L 10 8 L 25 -8 L 35 0 L 50 0" fill="none" stroke="#38bdf8" strokeWidth="1.8" />
            <text x="0" y="-8" fill="#e0f2fe" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Ra (Aerodinámica)</text>
            <text x="0" y="12" fill="#7dd3fc" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{Ra.toFixed(3)} s/cm</text>
          </g>

          {/* FLOW: Ra -> Rb */}
          <path d="M 240 130 L 240 170" fill="none" stroke="#38bdf8" strokeWidth="3" markerEnd="url(#arrow-c)" className="anim-flow" filter="url(#glow-cyan)" />

          {/* NODE 2: Rb (BOUNDARY SUBLAYER RESISTANCE) */}
          <g
            transform="translate(240, 190)"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredNode('Rb')}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <rect x="-70" y="-20" width="140" height="40" rx="4" fill="#042f2e" stroke="#0d9488" strokeWidth="1.8" filter="url(#glow-emerald)" />
            {/* Resistor symbol */}
            <path d="M -50 0 L -35 -8 L -20 8 L -5 -8 L 10 8 L 25 -8 L 35 0 L 50 0" fill="none" stroke="#2dd4bf" strokeWidth="1.8" />
            <text x="0" y="-8" fill="#ccfbf1" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Rb (Subcapa Foliar)</text>
            <text x="0" y="12" fill="#5eead4" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{Rb.toFixed(3)} s/cm</text>
          </g>

          {/* FLOW: Rb -> PARALLEL CANOPY SPLIT */}
          <path d="M 240 210 L 240 235" fill="none" stroke="#34d399" strokeWidth="3" className="anim-flow" filter="url(#glow-emerald)" />
          {/* Horizontal distribution bar */}
          <path d="M 80 235 L 400 235" fill="none" stroke="#34d399" strokeWidth="3" filter="url(#glow-emerald)" />

          {/* BRANCH 1: STOMATA + MESOPHYLL (Rst + Rmes) */}
          <path d="M 80 235 L 80 260" fill="none" stroke="#34d399" strokeWidth="2.5" markerEnd="url(#arrow-g)" className="anim-flow" filter="url(#glow-emerald)" />
          <g
            transform="translate(80, 290)"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredNode('Rst')}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <rect x="-55" y="-28" width="110" height="56" rx="4" fill="#022c22" stroke={isDay ? "#059669" : "#475569"} strokeWidth="1.8" filter={isDay ? "url(#glow-emerald)" : "none"} />
            <text x="0" y="-12" fill="#6ee7b7" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Rst + Rmes</text>
            <text x="0" y="2" fill="#a7f3d0" fontSize="8" textAnchor="middle" fontFamily="monospace">Estomas</text>
            <text x="0" y="16" fill={isDay ? "#34d399" : "#94a3b8"} fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {species === 'PM25' ? '∞ (Bloqueado)' : `${(Rst + Rmes).toFixed(2)} s/cm`}
            </text>
            {/* Animated Stoma Eye Icon */}
            <circle cx="38" cy="-14" r="5" fill={isDay ? "#10b981" : "#334155"} className={isDay ? "anim-pulse" : ""} />
          </g>

          {/* BRANCH 2: CUTICLE (Rcut) */}
          <path d="M 240 235 L 240 260" fill="none" stroke="#fbbf24" strokeWidth="2.5" markerEnd="url(#arrow-a)" className="anim-flow" filter="url(#glow-amber)" />
          <g
            transform="translate(240, 290)"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredNode('Rcut')}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <rect x="-55" y="-28" width="110" height="56" rx="4" fill="#451a03" stroke="#d97706" strokeWidth="1.8" filter="url(#glow-amber)" />
            <text x="0" y="-12" fill="#fde68a" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Rcut (Cutícula)</text>
            <text x="0" y="2" fill="#fcd34d" fontSize="8" textAnchor="middle" fontFamily="monospace">Foliar Cerosa</text>
            <text x="0" y="16" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{Rcut.toFixed(1)} s/cm</text>
          </g>

          {/* BRANCH 3: SOIL / LITTER (Rsoil) */}
          <path d="M 400 235 L 400 260" fill="none" stroke="#a78bfa" strokeWidth="2.5" markerEnd="url(#arrow-p)" className="anim-flow" filter="url(#glow-purple)" />
          <g
            transform="translate(400, 290)"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredNode('Rsoil')}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <rect x="-55" y="-28" width="110" height="56" rx="4" fill="#2e1065" stroke="#7c3aed" strokeWidth="1.8" filter="url(#glow-purple)" />
            <text x="0" y="-12" fill="#ddd6fe" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Rsoil (Suelo)</text>
            <text x="0" y="2" fill="#c4b5fd" fontSize="8" textAnchor="middle" fontFamily="monospace">Tierra y Hojarasca</text>
            <text x="0" y="16" fill="#a78bfa" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{Rsoil.toFixed(1)} s/cm</text>
          </g>

          {/* PARALLEL REJOIN PATH TO GROUND / SUMIDERO */}
          <path d="M 80 318 L 80 345 L 400 345 L 400 318" fill="none" stroke="#10b981" strokeWidth="2.5" filter="url(#glow-emerald)" />
          <path d="M 240 318 L 240 345" fill="none" stroke="#10b981" strokeWidth="2.5" filter="url(#glow-emerald)" />
          <path d="M 240 345 L 240 365" fill="none" stroke="#10b981" strokeWidth="3" markerEnd="url(#arrow-g)" className="anim-flow-fast" filter="url(#glow-emerald)" />

          {/* GROUND SUMIDERO RECEPTOR */}
          <g transform="translate(240, 370)">
            <line x1="-30" y1="0" x2="30" y2="0" stroke="#10b981" strokeWidth="3" />
            <line x1="-20" y1="4" x2="20" y2="4" stroke="#10b981" strokeWidth="2" />
            <line x1="-10" y1="8" x2="10" y2="8" stroke="#10b981" strokeWidth="1.5" />
          </g>

          {/* HUD CORE: VELOCIDAD DE DEPOSICIÓN Vd */}
          <g className="circuit-core" transform="translate(585, 175)">
            <circle cx="0" cy="0" r="85" fill="#022c22" stroke="#10b981" strokeWidth="2.5" filter="url(#glow-emerald)" opacity="0.95" />
            <circle cx="0" cy="0" r="75" fill="#064e3b" stroke="#059669" strokeWidth="1" strokeDasharray="4 4" />
            
            <text x="0" y="-45" fill="#a7f3d0" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              SUMIDERO {species}
            </text>
            <text x="0" y="-20" fill="#ecfdf5" fontSize="24" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {Vd_cm_s.toFixed(3)}
            </text>
            <text x="0" y="-4" fill="#6ee7b7" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              cm / s
            </text>

            <line x1="-55" y1="8" x2="55" y2="8" stroke="#047857" strokeWidth="1" />

            <text x="0" y="24" fill="#bae6fd" fontSize="9" textAnchor="middle" fontFamily="monospace">
              vd = {(Vd_m_s * 1000).toFixed(2)} mm/s
            </text>
            <text x="0" y="38" fill="#cbd5e1" fontSize="8" textAnchor="middle" fontFamily="monospace">
              R_total = {Rtotal.toFixed(2)} s/cm
            </text>
            <text x="0" y="52" fill="#34d399" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              Rc_canopy = {Rc.toFixed(2)} s/cm
            </text>
            <text x="0" y="66" fill="#fef08a" fontSize="7" textAnchor="middle" fontFamily="monospace">
              {isDay ? "☀ FOTÓLISIS ACTIVA" : "🌙 RÉGIMEN NOCTURNO"}
            </text>
          </g>

          {/* EQUATION BANNER */}
          <g transform="translate(585, 335)">
            <rect x="-105" y="-20" width="210" height="40" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="0" y="-4" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
              vd = 1 / (Ra + Rb + Rc)
            </text>
            <text x="0" y="10" fill="#38bdf8" fontSize="8" textAnchor="middle" fontFamily="monospace">
              F = vd · C_aire · LAI [µg/(m²·s)]
            </text>
          </g>
        </svg>

        {/* FLOATING SCIENTIFIC HOVER TOOLTIP */}
        {hoveredNode && (
          <div className="absolute top-2 left-2 max-w-xs bg-slate-900/95 border border-emerald-500/80 rounded p-2 text-xs font-mono text-slate-200 shadow-xl backdrop-blur-md">
            {hoveredNode === 'Ra' && (
              <div>
                <span className="font-bold text-sky-400">Resistencia Aerodinámica (<MathFormula math="R_a" />):</span>
                <p className="text-[10px] text-slate-300 mt-1">
                  Resistencia al transporte turbulento en la capa superficial atmosférica (0 a 10m). Regulada por la velocidad de fricción <MathFormula math={`u_* = ${ustarMs.toFixed(2)}\\text{ m/s}`} /> y rugosidad <MathFormula math="z_0 = 0.8\text{ m}" />.
                </p>
                <span className="text-[9px] text-emerald-400 mt-1 block">
                  <MathFormula math={`R_a = \\frac{\\ln(z/z_0)}{\\kappa \\cdot u_*} = ${Ra.toFixed(3)}\\text{ s/cm}`} /> ({( (Ra/Rtotal)*100 ).toFixed(1)}% del total)
                </span>
              </div>
            )}
            {hoveredNode === 'Rb' && (
              <div>
                <span className="font-bold text-teal-400">Resistencia Subcapa Cuasilaminar (<MathFormula math="R_b" />):</span>
                <p className="text-[10px] text-slate-300 mt-1">
                  Transporte molecular a través de la película de aire estancado adherida a la superficie de las hojas. Depende del número de Schmidt molecular (<MathFormula math="\text{Sc}" />).
                </p>
                <span className="text-[9px] text-emerald-400 mt-1 block">
                  <MathFormula math={`R_b = \\frac{2}{\\kappa u_*}\\left(\\frac{\\text{Sc}}{\\text{Pr}}\\right)^{2/3} = ${Rb.toFixed(3)}\\text{ s/cm}`} /> ({( (Rb/Rtotal)*100 ).toFixed(1)}% del total)
                </span>
              </div>
            )}
            {hoveredNode === 'Rst' && (
              <div>
                <span className="font-bold text-emerald-400">Resistencia Estomática y Mesofílica (Rst + Rmes):</span>
                <p className="text-[10px] text-slate-300 mt-1">
                  Apertura de estomas vegetales estimulada por PAR solar ({parWm2} W/m²) y temperatura ({airTempC}°C). Para gases solubles y reactivos (O₃), la absorción interna mesofílica es casi instantánea.
                </p>
                <span className="text-[9px] text-emerald-300 mt-1 block">Rst+Rmes = {species === 'PM25' ? 'Inaccesible para partículas' : `${(Rst+Rmes).toFixed(2)} s/cm`}</span>
              </div>
            )}
            {hoveredNode === 'Rcut' && (
              <div>
                <span className="font-bold text-amber-400">Resistencia Cuticular (Rcut):</span>
                <p className="text-[10px] text-slate-300 mt-1">
                  Adsorción e impactación sobre la epidermis y ceras cuticulares externas de las hojas. Favorecida por humedad relativa (RH = {rhPct}%).
                </p>
                <span className="text-[9px] text-amber-300 mt-1 block">Rcut = {Rcut.toFixed(1)} s/cm</span>
              </div>
            )}
            {hoveredNode === 'Rsoil' && (
              <div>
                <span className="font-bold text-purple-400">Resistencia de Suelo y Necromasa (Rsoil):</span>
                <p className="text-[10px] text-slate-300 mt-1">
                  Reacción de gases y sedimentación gravitacional sobre el sustrato edáfico y hojarasca urbana.
                </p>
                <span className="text-[9px] text-purple-300 mt-1 block">Rsoil = {Rsoil.toFixed(1)} s/cm</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SCIENTIFIC METRICS FOOTER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
        <ScientificTooltip
          position="top"
          title="Trazador Químico Evaluado en el Circuito"
          formula={`\\text{Sc/Pr}(${species}) = ${species === 'O3' ? '1.30' : species === 'NO2' ? '1.40' : species === 'SO2' ? '1.50' : '2.20'}`}
          explanation="Determina el cociente entre la viscosidad cinemática del aire y la difusividad molecular del contaminante en la subcapa cuasilaminar Rb."
          normativeRef="Wesely (1989) / Guía EMEP/EEA"
        >
          <div className="p-2 bg-slate-950/80 border border-slate-800 rounded cursor-help">
            <span className="text-[9px] text-slate-400 block">ESPECIE ANALIZADA</span>
            <strong className="text-emerald-400 text-sm">{species}</strong>
          </div>
        </ScientificTooltip>
        <ScientificTooltip
          position="top"
          title="Conductancia Total del Dosel Urbano (G_c = 1/R_c)"
          formula="G_c = \\frac{1}{R_c} = \\frac{1}{R_{st} + R_{mes}} + \\frac{1}{R_{cut}} + \\frac{1}{R_{soil}}"
          explanation="Suma de conductancias en paralelo a través de los estomas foliares, la cutícula cerosa epicuticular y el sustrato edáfico del alcorque."
          normativeRef="Jarvis (1976) / Ball-Berry (1987) / Wesely (1989)"
        >
          <div className="p-2 bg-slate-950/80 border border-slate-800 rounded cursor-help">
            <span className="text-[9px] text-slate-400 block">CONDUCTANCIA CANOPY</span>
            <strong className="text-cyan-400 text-sm">{(1 / Rc).toFixed(3)} cm/s</strong>
          </div>
        </ScientificTooltip>
        <ScientificTooltip
          position="top"
          title="Velocidad Efectiva de Deposición Seca (v_d)"
          formula="v_d = \\frac{1}{R_a + R_b + R_c} \\quad [\\text{cm s}^{-1}]"
          explanation={`Flujo vertical de sumidero F = -v_d · C acoplado en serie desde la capa superficial turbulenta (u* = ${ustarMs.toFixed(2)} m/s) hasta el interior foliar.`}
          normativeRef="Ley de Tres Resistencias en Serie (Wesely, 1989)"
        >
          <div className="p-2 bg-slate-950/80 border border-slate-800 rounded cursor-help">
            <span className="text-[9px] text-slate-400 block">VELOCIDAD DEPOSICIÓN vd</span>
            <strong className="text-emerald-300 text-sm">{Vd_cm_s.toFixed(3)} cm/s</strong>
          </div>
        </ScientificTooltip>
        <ScientificTooltip
          position="top"
          title="Régimen Fisiológico Estomático"
          formula={`\\text{PAR} = ${parWm2.toFixed(0)}\\text{ W/m}^2 \\implies R_{st} = ${Rst}\\text{ s/cm}`}
          explanation="Con irradiancia fotosintéticamente activa PAR > 30 W/m², las células oclusivas abren el poro estomático activando la asimilación enzimática NR/NiR/GS-GOGAT."
          normativeRef="Fisiología Vegetal FvCB / Sparks et al. (2001)"
        >
          <div className="p-2 bg-slate-950/80 border border-slate-800 rounded cursor-help">
            <span className="text-[9px] text-slate-400 block">RÉGIMEN FOLIAR</span>
            <strong className={isDay ? "text-amber-400 text-sm" : "text-indigo-400 text-sm"}>
              {isDay ? "ESTOMAS ABIERTOS" : "NOCTURNO CERRADO"}
            </strong>
          </div>
        </ScientificTooltip>
      </div>
    </div>
  );
};
