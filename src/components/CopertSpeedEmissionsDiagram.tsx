import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bus, Zap, Activity, Sliders, TrendingDown, Gauge } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';

export function CopertSpeedEmissionsDiagram() {
  const [speed, setSpeed] = useState<number>(18); // km/h (typical urban bus average in Malaga)

  // COPERT 5 Speed Emission Functions (g/km per vehicle)
  // Diesel Euro VI
  const noxDieselEuroVI = (v: number) => {
    // High emissions in stop-and-go (v < 15), minimum around 35-45 km/h
    return Math.max(0.2, 0.45 + 18.0 / (v + 2.0) - 0.004 * v);
  };

  // CNG (Gas Natural Comprimido)
  const noxCNG = (v: number) => {
    return Math.max(0.12, 0.28 + 9.5 / (v + 2.0) - 0.0025 * v);
  };

  // Electric
  const noxElectric = 0.0;

  const currentDiesel = noxDieselEuroVI(speed);
  const currentCNG = noxCNG(speed);

  // SVG dimensions
  const svgWidth = 440;
  const svgHeight = 220;
  const originX = 45;
  const originY = 185;
  const plotWidth = 370;
  const plotHeight = 150;

  // Max values for plotting
  const maxSpeed = 60; // km/h
  const maxEmission = 6.0; // g/km

  const toSvgX = (v: number) => originX + (v / maxSpeed) * plotWidth;
  const toSvgY = (ef: number) => originY - (Math.min(ef, maxEmission) / maxEmission) * plotHeight;

  // Generate curve path strings
  let pathDiesel = `M ${toSvgX(5)} ${toSvgY(noxDieselEuroVI(5))}`;
  let pathCNG = `M ${toSvgX(5)} ${toSvgY(noxCNG(5))}`;

  for (let v = 6; v <= 60; v += 1) {
    pathDiesel += ` L ${toSvgX(v)} ${toSvgY(noxDieselEuroVI(v))}`;
    pathCNG += ` L ${toSvgX(v)} ${toSvgY(noxCNG(v))}`;
  }

  const currentX = toSvgX(speed);
  const currentDieselY = toSvgY(currentDiesel);
  const currentCNGY = toSvgY(currentCNG);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 relative overflow-hidden shadow-inner font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <Bus className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Curvas Cinéticas de Emisión COPERT 5 (Guía EMEP/EEA)</span>
              <ScientificTooltip
                topic="copert_speed_emissions"
                title="Curvas de Emisión COPERT 5 Tier 3"
                content="Modelo analítico europeo de cálculo de emisiones para transporte por carretera en función de la velocidad media de marcha urbana v (km/h)."
                regulatory="Guía EMEP/EEA 2023 1.A.3.b & Metodología COPERT 5.5"
                citation="Ntziachristos, L. et al. (2009) Atmos. Environ., 43, 5869-5877."
              >
                <span className="text-[9.5px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-300 cursor-help">
                  Flota EMT Málaga
                </span>
              </ScientificTooltip>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Dependencia No Lineal del Factor de Emisión EF(v) frente a la Velocidad de Operación Comercial
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ScientificTooltip
            title="Velocidad Comercial de Autobuses Urbanos"
            content="Velocidad de operación real registrada por telemetría GTFS en la red EMT Málaga. Las congestiones en el centro (v < 15 km/h) penalizan fuertemente las emisiones."
          >
            <div className="flex items-center gap-1 cursor-help">
              <span className="text-slate-400 text-xs font-mono">Velocidad Media Comercial:</span>
              <span className="px-2 py-0.5 rounded font-bold font-mono text-xs bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                {speed} km/h
              </span>
            </div>
          </ScientificTooltip>
        </div>
      </div>

      {/* Main Grid: SVG Curve Diagram + Interactive Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* SVG Plot (Left) */}
        <div className="lg:col-span-7 relative bg-slate-900/60 rounded-lg border border-slate-800 p-2 flex justify-center">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-[420px] h-auto select-none">
            <defs>
              <linearGradient id="dieselCurveGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#fb7185" />
              </linearGradient>
              <linearGradient id="cngCurveGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[1, 2, 3, 4, 5].map(ef => (
              <g key={`y-grid-${ef}`}>
                <line x1={originX} y1={toSvgY(ef)} x2={originX + plotWidth} y2={toSvgY(ef)} stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" />
                <text x={originX - 6} y={toSvgY(ef) + 3} fill="#64748b" fontSize="7.5" textAnchor="end" fontFamily="monospace">
                  {ef.toFixed(1)}
                </text>
              </g>
            ))}

            {[10, 20, 30, 40, 50, 60].map(v => (
              <g key={`x-grid-${v}`}>
                <line x1={toSvgX(v)} y1={originY} x2={toSvgX(v)} y2={originY - plotHeight} stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" />
                <text x={toSvgX(v)} y={originY + 12} fill="#64748b" fontSize="7.5" textAnchor="middle" fontFamily="monospace">
                  {v}
                </text>
              </g>
            ))}

            {/* Axes */}
            <line x1={originX} y1={originY} x2={originX + plotWidth} y2={originY} stroke="#64748b" strokeWidth="1.5" />
            <line x1={originX} y1={originY} x2={originX} y2={originY - plotHeight - 10} stroke="#64748b" strokeWidth="1.5" />

            {/* Axis Labels */}
            <text x={originX + plotWidth} y={originY + 22} fill="#94a3b8" fontSize="8" textAnchor="end" fontFamily="sans-serif">
              Velocidad Media v (km/h) →
            </text>
            <text x={originX - 10} y={originY - plotHeight - 5} fill="#94a3b8" fontSize="8" textAnchor="start" fontFamily="sans-serif">
              EF_NOx (g/km·bus) ↑
            </text>

            {/* Curves */}
            {/* Diesel Euro VI Path */}
            <path d={pathDiesel} fill="none" stroke="url(#dieselCurveGlow)" strokeWidth="2.5" />

            {/* CNG Path */}
            <path d={pathCNG} fill="none" stroke="url(#cngCurveGlow)" strokeWidth="2" strokeDasharray="4 2" />

            {/* Electric Path (Zero Line) */}
            <line x1={toSvgX(5)} y1={toSvgY(0.0)} x2={toSvgX(60)} y2={toSvgY(0.0)} stroke="#10b981" strokeWidth="2.5" />

            {/* Active Speed Vertical Guideline */}
            <line x1={currentX} y1={originY} x2={currentX} y2={originY - plotHeight} stroke="#facc15" strokeWidth="1.2" strokeDasharray="2 2" />

            {/* Diesel Operational Point */}
            <circle cx={currentX} cy={currentDieselY} r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" className="animate-pulse" />
            <text x={currentX + 8} y={currentDieselY - 2} fill="#fda4af" fontSize="8" fontWeight="bold" fontFamily="monospace">
              {currentDiesel.toFixed(2)} g/km (Diesel)
            </text>

            {/* CNG Operational Point */}
            <circle cx={currentX} cy={currentCNGY} r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
            <text x={currentX + 8} y={currentCNGY + 10} fill="#bae6fd" fontSize="8" fontWeight="bold" fontFamily="monospace">
              {currentCNG.toFixed(2)} g/km (GNC)
            </text>

            {/* Electric Point */}
            <circle cx={currentX} cy={toSvgY(0.0)} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
            <text x={currentX + 8} y={toSvgY(0.0) - 5} fill="#86efac" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
              0.00 g/km (100% Eléctrico)
            </text>

            {/* Legend inside SVG */}
            <g transform={`translate(${originX + plotWidth - 130}, ${originY - plotHeight + 5})`}>
              <rect width="125" height="42" fill="#0f172a" opacity="0.9" rx="3" stroke="#334155" />
              <line x1="8" y1="10" x2="25" y2="10" stroke="#f43f5e" strokeWidth="2" />
              <text x="30" y="13" fill="#fca5a5" fontSize="7.5" fontFamily="monospace">Diésel Euro VI</text>
              <line x1="8" y1="22" x2="25" y2="22" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 2" />
              <text x="30" y="25" fill="#7dd3fc" fontSize="7.5" fontFamily="monospace">GNC Híbrido</text>
              <line x1="8" y1="34" x2="25" y2="34" stroke="#10b981" strokeWidth="2" />
              <text x="30" y="37" fill="#86efac" fontSize="7.5" fontFamily="monospace">Cero Emisiones (EV)</text>
            </g>
          </svg>
        </div>

        {/* Dynamic Controls & Instant Fleet Comparison (Right) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-2.5">
          {/* Slider box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 border-b border-slate-800 pb-1">
              <span className="flex items-center gap-1 text-cyan-400">
                <Gauge className="w-3.5 h-3.5" /> Régimen de Marcha Urbana
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-mono">Málaga Centro</span>
                <ScientificTooltip
                  title="Dinámica de Marcha Urbana COPERT 5"
                  content="A velocidades inferiores a 15 km/h, la baja temperatura de los gases de escape impide alcanzar la ventana térmica óptima del catalizador SCR (200-400°C), incrementando drásticamente el factor de emisión de NOx."
                  formula="\text{EF}_{NOx}(v) = a + \frac{b}{v + c} + d \cdot v"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <span className="text-slate-400">Velocidad de Tráfico:</span>
                <span className="font-bold text-cyan-300">{speed} km/h</span>
              </div>
              <input
                type="range"
                min="5"
                max="55"
                step="1"
                value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[8.5px] text-slate-500 font-mono mt-0.5">
                <span>Atasco (5 km/h)</span>
                <span>Urbana (18 km/h)</span>
                <span>Fluido (45 km/h)</span>
              </div>
            </div>
          </div>

          {/* Savings comparison card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-md p-2.5 text-[11px] font-mono space-y-1.5">
            <div className="text-slate-300 font-bold flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <span>Ahorro por Electrificación (100% EV):</span>
                <ScientificTooltip
                  title="Descarbonización y Mitigación Flota EMT"
                  content="Sustitución de autobuses diésel Euro VI y GNC por vehículos eléctricos de tracción directa con freno regenerativo, eliminando el 100% de las emisiones directas por tubo de escape en cañones urbanos."
                  regulatory="Directiva (UE) 2019/1161 de Vehículos Limpios"
                />
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> -100% NOx
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[9px]">Emisión Evitada (Diesel):</span>
                <span className="text-rose-400 font-bold">-{currentDiesel.toFixed(2)} g/km·bus</span>
              </div>
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[9px]">Emisión Evitada (GNC):</span>
                <span className="text-cyan-400 font-bold">-{currentCNG.toFixed(2)} g/km·bus</span>
              </div>
            </div>
          </div>

          {/* Mathematical Note */}
          <div className="p-2 rounded bg-slate-900/50 border border-slate-800 text-[9.5px] text-slate-400 leading-relaxed font-sans">
            <span className="text-emerald-400 font-bold font-mono">Formulación COPERT 5:</span> A bajas velocidades de parada y arranque (v &lt; 15 km/h), el factor de emisión de NOₓ se dispara debido a la menor eficiencia térmica del postratamiento SCR y la aceleración transitoria.
          </div>
        </div>
      </div>
    </div>
  );
}
