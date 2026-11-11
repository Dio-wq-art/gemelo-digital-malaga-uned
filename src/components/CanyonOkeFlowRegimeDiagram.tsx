import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Building2, Wind, RotateCw, AlertTriangle, Sliders, MapPin, Gauge, ShieldCheck, ArrowRight } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { calculateStreetVortexDynamics, MALAGA_STREET_CANYONS_GEOMETRY } from '../lib/canyonGeometryOsm';

interface CanyonOkeFlowRegimeDiagramProps {
  initialH?: number;
  initialW?: number;
  initialUroof?: number;
  onSelectStreet?: (streetName: string) => void;
}

export function CanyonOkeFlowRegimeDiagram({
  initialH = 22.5,
  initialW = 11.2,
  initialUroof = 3.5,
  onSelectStreet
}: CanyonOkeFlowRegimeDiagramProps) {
  const [h, setH] = useState<number>(initialH);
  const [w, setW] = useState<number>(initialW);
  const [uRoof, setURoof] = useState<number>(initialUroof);
  const [selectedStreetPreset, setSelectedStreetPreset] = useState<string>('Calle Marqués de Larios');

  const dynamics = calculateStreetVortexDynamics(h, w, uRoof, 90);
  const aspectRatio = dynamics.aspectRatioHW;

  const handleSelectPreset = (streetName: string) => {
    const canyon = MALAGA_STREET_CANYONS_GEOMETRY.find(c => c.streetName === streetName);
    if (canyon) {
      setH(canyon.avgBuildingHeightM);
      setW(canyon.streetWidthM);
      setSelectedStreetPreset(streetName);
      if (onSelectStreet) onSelectStreet(streetName);
    }
  };

  // SVG diagram sizing
  const svgWidth = 460;
  const svgHeight = 250;
  const groundY = 205;
  
  // Normalized drawing dimensions
  const scale = 4.8; // px per meter
  const bHeightPx = Math.min(145, Math.max(45, h * scale));
  const streetWidthPx = Math.min(220, Math.max(55, w * scale));
  const bWidthPx = 70;

  const leftBuildingX = Math.max(10, (svgWidth - (2 * bWidthPx + streetWidthPx)) / 2);
  const streetLeftX = leftBuildingX + bWidthPx;
  const streetRightX = streetLeftX + streetWidthPx;
  const rightBuildingX = streetRightX;
  const roofY = groundY - bHeightPx;

  const vortexCenterX = streetLeftX + streetWidthPx / 2;
  const vortexCenterY = groundY - bHeightPx / 2;
  const vortexRadiusX = Math.max(14, streetWidthPx / 2 - 10);
  const vortexRadiusY = Math.max(14, bHeightPx / 2 - 10);

  // Position on the Oke transition scale (0 to 2.5 H/W)
  const scalePercent = Math.min(100, (aspectRatio / 2.5) * 100);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 relative overflow-hidden shadow-2xl font-mono text-xs">
      {/* Header with Title & Regime Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Dinámica de Cañón Urbano y Régimen de Flujo (Oke, 1987)</span>
              <ScientificTooltip
                topic="canyon_vortex_recirculation"
                width="w-72"
                content="Relación de aspecto o factor de forma geométrico del cañón urbano: H/W = Altura media de cornisa / Anchura de fachada a fachada. Determina la transición aerodinámica entre los 3 regímenes canónicos de Oke (1987)."
              >
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-950/80 border border-amber-500/60 text-amber-300 cursor-help">
                  H/W = {aspectRatio.toFixed(2)}
                </span>
              </ScientificTooltip>
            </div>
            <div className="text-[10px] text-slate-400">
              Desacoplamiento de capa límite, vórtice cerrado de cavidad e intercambio turbulento de masa
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ScientificTooltip
            topic="canyon_vortex_recirculation"
            width="w-80"
            content={dynamics.regimeDescription}
          >
            <div
              className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono border cursor-help ${
                dynamics.regimeCode === 'SKIMMING_FLOW'
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                  : dynamics.regimeCode === 'WAKE_INTERFERENCE'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                  : 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
              }`}
            >
              {dynamics.regimeLabel}
            </div>
          </ScientificTooltip>
        </div>
      </div>

      {/* HORIZONTAL OKE REGIME SCALE */}
      <div className="mb-3 bg-slate-900/90 border border-slate-800 rounded p-2 text-[10px]">
        <div className="flex justify-between items-center mb-1 text-[9.5px]">
          <span className="text-slate-400 font-bold uppercase">Espacio de Fase Hidrodinámico de Oke (1987)</span>
          <span className="text-slate-300 font-mono">
            Punto de Operación Actual: <strong className="text-amber-300">H/W = {aspectRatio.toFixed(2)}</strong>
          </span>
        </div>
        
        {/* Continuous Bar with 3 Oke Zones */}
        <div className="relative h-5 rounded overflow-hidden flex border border-slate-700">
          <div
            style={{ width: '12%' }}
            className="bg-emerald-950/80 border-r border-emerald-700/60 flex items-center justify-center text-[8.5px] font-bold text-emerald-300"
            title="Isolated Roughness Flow: H/W < 0.30"
          >
            Rugosidad Aislada (&lt;0.30)
          </div>
          <div
            style={{ width: '14%' }}
            className="bg-amber-950/80 border-r border-amber-700/60 flex items-center justify-center text-[8.5px] font-bold text-amber-300"
            title="Wake Interference Flow: 0.30 <= H/W < 0.65"
          >
            Estelas (0.30 - 0.65)
          </div>
          <div
            style={{ width: '74%' }}
            className="bg-rose-950/80 flex items-center justify-center text-[8.5px] font-bold text-rose-300"
            title="Skimming Flow: H/W >= 0.65"
          >
            Flujo Rasante de Cavidad / Skimming Flow (&ge; 0.65) — Vórtice Cerrado Estable
          </div>

          {/* Marker pin */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_#ffffff] transition-all duration-300"
            style={{ left: `${scalePercent}%` }}
          />
        </div>
      </div>

      {/* QUICK PRESET SELECTOR FOR MALAGA STREETS */}
      <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] scrollbar-thin">
        <span className="text-slate-400 flex items-center gap-1 shrink-0 font-bold">
          <MapPin className="w-3 h-3 text-amber-400" /> Cañones de Málaga:
        </span>
        {MALAGA_STREET_CANYONS_GEOMETRY.slice(0, 7).map(c => (
          <ScientificTooltip
            key={c.streetId}
            content={`Cargar geometría real de ${c.streetName}: H=${c.avgBuildingHeightM}m, W=${c.streetWidthM}m (H/W=${c.aspectRatioHW}) y simular régimen de flujo de Oke (1987).`}
          >
            <button
              onClick={() => handleSelectPreset(c.streetName)}
              className={`px-2 py-0.5 rounded border transition-all shrink-0 font-mono text-[9.5px] cursor-pointer ${
                selectedStreetPreset === c.streetName
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {c.streetName.replace('Calle ', 'C/ ').replace('Avenida ', 'Av. ')} ({c.aspectRatioHW})
            </button>
          </ScientificTooltip>
        ))}
      </div>

      {/* Main Container: SVG Physics Canvas + Interactive Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
        {/* SVG Fluid Dynamics Canvas (Left) */}
        <div className="lg:col-span-7 relative bg-slate-900/80 rounded-lg border border-slate-800 p-2 overflow-hidden flex justify-center shadow-inner">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-[440px] h-auto select-none">
            <defs>
              {/* Leeward Wall High-Pollution Gradient (Left Building East Face) */}
              <linearGradient id="leewardGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.45" />
              </linearGradient>

              {/* Windward Wall Low-Pollution Gradient */}
              <linearGradient id="windwardGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              {/* Canyon Air Cavity Pollution Density */}
              <radialGradient id="cavityPollutionGlow" cx="25%" cy="75%" r="75%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={dynamics.regimeCode === 'SKIMMING_FLOW' ? 0.65 : 0.25} />
                <stop offset="55%" stopColor="#f59e0b" stopOpacity={dynamics.regimeCode === 'SKIMMING_FLOW' ? 0.35 : 0.15} />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
              </radialGradient>
            </defs>

            {/* Sky Background */}
            <rect x="0" y="0" width={svgWidth} height={groundY} fill="#0a0f1d" />

            {/* Above-Roof Free Wind Flow Arrows (Incoming from Left) */}
            <g className="animate-pulse" style={{ animationDuration: '3s' }}>
              <line x1="15" y1={roofY - 18} x2={svgWidth - 15} y2={roofY - 18} stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" />
              <line x1="35" y1={roofY - 32} x2={svgWidth - 35} y2={roofY - 32} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.7" />
              <polygon points={`${svgWidth - 12},${roofY - 18} ${svgWidth - 22},${roofY - 22} ${svgWidth - 22},${roofY - 14}`} fill="#38bdf8" />
              <text x={leftBuildingX - 8} y={roofY - 22} fill="#38bdf8" fontSize="8.5" fontWeight="bold" textAnchor="end" fontFamily="monospace">
                U_roof = {uRoof.toFixed(1)} m/s →
              </text>
            </g>

            {/* Street Cavity Air Mesh with Pollutant Accumulation */}
            <rect
              x={streetLeftX}
              y={roofY}
              width={streetWidthPx}
              height={bHeightPx}
              fill="url(#cavityPollutionGlow)"
            />

            {/* Left Building (Leeward Wall / Sotavento) */}
            <rect
              x={leftBuildingX}
              y={roofY}
              width={bWidthPx}
              height={bHeightPx}
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="1.5"
            />
            {/* Leeward Accumulation Layer on Building Facade */}
            <rect
              x={streetLeftX - 5}
              y={roofY}
              width="5"
              height={bHeightPx}
              fill="#ef4444"
              opacity={dynamics.regimeCode === 'SKIMMING_FLOW' ? 0.9 : 0.4}
            />
            <text x={streetLeftX - 8} y={roofY + bHeightPx / 2} fill="#f43f5e" fontSize="7.5" fontWeight="bold" textAnchor="end">
              SOTAVENTO
            </text>
            <text x={streetLeftX - 8} y={roofY + bHeightPx / 2 + 9} fill="#fca5a5" fontSize="6.5" textAnchor="end" fontFamily="monospace">
              ({dynamics.ratioLeeward}x C_wind)
            </text>

            {/* Right Building (Windward Wall / Barlovento) */}
            <rect
              x={rightBuildingX}
              y={roofY}
              width={bWidthPx}
              height={bHeightPx}
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="1.5"
            />
            {/* Windward Wash Layer */}
            <rect
              x={rightBuildingX}
              y={roofY}
              width="5"
              height={bHeightPx}
              fill="#38bdf8"
              opacity="0.8"
            />
            <text x={rightBuildingX + 8} y={roofY + bHeightPx / 2} fill="#38bdf8" fontSize="7.5" fontWeight="bold">
              BARLOVENTO
            </text>
            <text x={rightBuildingX + 8} y={roofY + bHeightPx / 2 + 9} fill="#bae6fd" fontSize="6.5" fontFamily="monospace">
              (Aire limpio)
            </text>

            {/* Ground / Street Surface */}
            <line x1="0" y1={groundY} x2={svgWidth} y2={groundY} stroke="#334155" strokeWidth="3" />
            <rect x="0" y={groundY} width={svgWidth} height={svgHeight - groundY} fill="#0b1120" />

            {/* Road Traffic Emission Line */}
            <line
              x1={streetLeftX + 10}
              y1={groundY - 2}
              x2={streetRightX - 10}
              y2={groundY - 2}
              stroke="#f59e0b"
              strokeWidth="3"
              strokeDasharray="4 3"
            />
            <text x={vortexCenterX} y={groundY + 12} fill="#f59e0b" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              Emisión Tráfico COPERT 5 (z = 0m)
            </text>

            {/* HYDRODYNAMIC REGIME SPECIFIC VORTEX & STREAMLINES */}
            {dynamics.regimeCode === 'SKIMMING_FLOW' && (
              <g>
                {/* Closed Recirculating Cavity Vortex */}
                <ellipse
                  cx={vortexCenterX}
                  cy={vortexCenterY}
                  rx={vortexRadiusX}
                  ry={vortexRadiusY}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="8 4"
                  className="animate-spin origin-center"
                  style={{
                    animationDuration: `${Math.max(2, 6 - uRoof)}s`,
                    transformOrigin: `${vortexCenterX}px ${vortexCenterY}px`
                  }}
                />
                <ellipse
                  cx={vortexCenterX}
                  cy={vortexCenterY}
                  rx={vortexRadiusX * 0.55}
                  ry={vortexRadiusY * 0.55}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeDasharray="5 3"
                  className="animate-spin origin-center"
                  style={{
                    animationDuration: `${Math.max(1.5, 4.5 - uRoof * 0.8)}s`,
                    transformOrigin: `${vortexCenterX}px ${vortexCenterY}px`,
                    animationDirection: 'reverse'
                  }}
                />
                <circle cx={vortexCenterX} cy={vortexCenterY} r="3" fill="#38bdf8" />
                <text x={vortexCenterX} y={vortexCenterY - 6} fill="#f8fafc" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                  Vórtice Cerrado Estable ({dynamics.vVortexMs} m/s)
                </text>
              </g>
            )}

            {dynamics.regimeCode === 'WAKE_INTERFERENCE' && (
              <g>
                {/* Descending Wake Path Intersecting Windward */}
                <path
                  d={`M ${streetLeftX + 5} ${roofY + 5} Q ${vortexCenterX} ${vortexCenterY + 15} ${streetRightX - 5} ${roofY + bHeightPx * 0.6}`}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                />
                <path
                  d={`M ${streetRightX - 8} ${groundY - 10} Q ${vortexCenterX} ${groundY - 15} ${streetLeftX + 8} ${groundY - 20}`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text x={vortexCenterX} y={vortexCenterY} fill="#f59e0b" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                  Interferencia de Estelas (Flujo Inestable)
                </text>
              </g>
            )}

            {dynamics.regimeCode === 'ISOLATED_ROUGHNESS' && (
              <g>
                {/* Free Streamlines Flushing All the Way to the Road */}
                <path
                  d={`M ${leftBuildingX + bWidthPx + 5} ${roofY + 15} Q ${vortexCenterX - 20} ${groundY - 10} ${streetRightX - 10} ${groundY - 10}`}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                />
                <text x={vortexCenterX} y={groundY - 30} fill="#10b981" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                  Ventilación Directa a Nivel de Acera
                </text>
              </g>
            )}

            {/* Pedestrian Breathing Height Line (z = 1.5m) */}
            <line
              x1={streetLeftX}
              y1={groundY - 1.5 * scale}
              x2={streetRightX}
              y2={groundY - 1.5 * scale}
              stroke="#22c55e"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.8"
            />
            <text x={streetLeftX + 5} y={groundY - 1.5 * scale - 3} fill="#4ade80" fontSize="6.5" fontFamily="monospace">
              Cota Peatonal z = 1.5m AGL
            </text>

            {/* Height H Marker */}
            <line x1={leftBuildingX - 18} y1={roofY} x2={leftBuildingX - 18} y2={groundY} stroke="#94a3b8" strokeWidth="1" />
            <line x1={leftBuildingX - 21} y1={roofY} x2={leftBuildingX - 15} y2={roofY} stroke="#94a3b8" strokeWidth="1" />
            <line x1={leftBuildingX - 21} y1={groundY} x2={leftBuildingX - 15} y2={groundY} stroke="#94a3b8" strokeWidth="1" />
            <text x={leftBuildingX - 23} y={roofY + bHeightPx / 2 + 3} fill="#94a3b8" fontSize="7.5" fontWeight="bold" textAnchor="end" fontFamily="monospace">
              H={h}m
            </text>

            {/* Width W Marker */}
            <line x1={streetLeftX} y1={groundY + 22} x2={streetRightX} y2={groundY + 22} stroke="#94a3b8" strokeWidth="1" />
            <line x1={streetLeftX} y1={groundY + 19} x2={streetLeftX} y2={groundY + 25} stroke="#94a3b8" strokeWidth="1" />
            <line x1={streetRightX} y1={groundY + 19} x2={streetRightX} y2={groundY + 25} stroke="#94a3b8" strokeWidth="1" />
            <text x={vortexCenterX} y={groundY + 31} fill="#94a3b8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              W = {w}m (SVF = {dynamics.skyViewFactorSVF})
            </text>
          </svg>
        </div>

        {/* Interactive Controls & Physical Indicators (Right) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-2.5">
          {/* Sliders Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-md p-2.5 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-200 border-b border-slate-800 pb-1">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Sliders className="w-3.5 h-3.5" /> Parámetros Geométricos
              </span>
              <span className="font-mono text-[9.5px] text-slate-400">{selectedStreetPreset}</span>
            </div>

            {/* Height Slider */}
            <div>
              <div className="flex justify-between text-[10.5px] mb-0.5">
                <span className="text-slate-400">Altura de Fachada (H):</span>
                <span className="font-mono font-bold text-amber-300">{h} m</span>
              </div>
              <input
                type="range"
                min="6"
                max="45"
                step="0.5"
                value={h}
                onChange={e => {
                  setH(Number(e.target.value));
                  setSelectedStreetPreset('Personalizado');
                }}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Width Slider */}
            <div>
              <div className="flex justify-between text-[10.5px] mb-0.5">
                <span className="text-slate-400">Anchura de Calzada (W):</span>
                <span className="font-mono font-bold text-cyan-300">{w} m</span>
              </div>
              <input
                type="range"
                min="5"
                max="55"
                step="0.5"
                value={w}
                onChange={e => {
                  setW(Number(e.target.value));
                  setSelectedStreetPreset('Personalizado');
                }}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Wind Speed Slider */}
            <div>
              <div className="flex justify-between text-[10.5px] mb-0.5">
                <span className="text-slate-400">Viento en Cornisa (U_roof):</span>
                <span className="font-mono font-bold text-sky-400">{uRoof.toFixed(1)} m/s</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.5"
                value={uRoof}
                onChange={e => setURoof(Number(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>
          </div>

          {/* Derived Physical Indicators */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
            <ScientificTooltip
              topic="canyon_vortex_recirculation"
              width="w-72"
              content="Tiempo medio de residencia del aire en el volumen del cañón τ_res = H / σ_w según Yamartino y Wiegand (1986). Valores altos implican confinamiento prolongado de contaminantes."
            >
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800 cursor-help">
                <span className="text-slate-400 block text-[9px]">Tiempo Residencia (τ_res):</span>
                <span className="text-amber-300 font-bold text-xs">
                  {dynamics.tauResSec} s <span className="text-[9px] text-slate-400 font-normal">({dynamics.tauResMin} min)</span>
                </span>
              </div>
            </ScientificTooltip>

            <ScientificTooltip
              topic="canyon_vortex_recirculation"
              width="w-72"
              content="Renovaciones de aire por hora en la cavidad del cañón ACH = 3600 / τ_res. Cuantifica la capacidad de renovación del aire por intercambio turbulento en la cota de cornisa."
            >
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800 cursor-help">
                <span className="text-slate-400 block text-[9px]">Renovaciones Aire (ACH):</span>
                <span className="text-emerald-400 font-bold text-xs">{dynamics.achPerHour} h⁻¹</span>
              </div>
            </ScientificTooltip>

            <ScientificTooltip
              topic="canyon_vortex_recirculation"
              width="w-72"
              content="Ratio de asimetría de concentración acera de sotavento (leeward) vs barlovento (windward): C_lee / C_wind. En cañones profundos, los peatones en sotavento sufren mucha mayor exposición a NO2 y partículas."
            >
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800 cursor-help">
                <span className="text-slate-400 block text-[9px]">Asimetría C_lee / C_wind:</span>
                <span className="text-rose-400 font-bold text-xs">{dynamics.ratioLeeward}x</span>
              </div>
            </ScientificTooltip>

            <ScientificTooltip
              topic="canyon_vortex_recirculation"
              width="w-72"
              content="Índice sintético de ventilabilidad urbana del cañón (0 = bloqueo total con atrapamiento, 10 = barrido libre y dispersión inmediata)."
            >
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800 cursor-help">
                <span className="text-slate-400 block text-[9px]">Score Ventilabilidad:</span>
                <span className="text-cyan-300 font-bold text-xs">{dynamics.ventilationScore} / 10</span>
              </div>
            </ScientificTooltip>
          </div>

          {/* Verdict Box */}
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800 text-[9.5px] text-slate-300 leading-snug">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-400 inline" /> Dictamen Hidrodinámico:
            </span>
            <span className="text-slate-300">{dynamics.verdict}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
