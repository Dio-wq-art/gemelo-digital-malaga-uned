import React, { useState, useMemo } from 'react';
import { SpectralPoint, SpectralSimulationOutput } from '../lib/spectralRadiativeModel';
import { ScientificTooltip } from './ScientificTooltip';
import { Sun, Zap, Layers, Activity, Eye, Info, Sparkles } from 'lucide-react';

interface SpectralRadiationPhotolysisDiagramProps {
  simulation: SpectralSimulationOutput;
  className?: string;
  height?: number;
}

export const SpectralRadiationPhotolysisDiagram: React.FC<SpectralRadiationPhotolysisDiagramProps> = ({
  simulation,
  className = '',
  height = 360
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [visibleCurves, setVisibleCurves] = useState({
    solarToa: true,
    globalGround: true,
    actinicFlux: true,
    actionSpectrum: true,
    spectralJ: true
  });
  const [activeBandHighlight, setActiveBandHighlight] = useState<'all' | 'uvb' | 'uva' | 'no2_band' | 'par'>('all');
  const [scaleMode, setScaleMode] = useState<'linear' | 'normalized'>('linear');

  const spectrum = simulation.spectrum;

  // Rango espectral
  const minWl = 280;
  const maxWl = 750;
  const filteredSpectrum = useMemo(() => {
    return spectrum.filter(p => p.wavelengthNm >= minWl && p.wavelengthNm <= maxWl);
  }, [spectrum]);

  // Dimensiones del gráfico SVG
  const width = 800;
  const padding = { top: 30, right: 60, bottom: 45, left: 60 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Valores máximos para normalización y escalas
  const maxSolarToa = useMemo(() => Math.max(...filteredSpectrum.map(p => p.solarToaWm2Nm), 2.2), [filteredSpectrum]);
  const maxGlobal = useMemo(() => Math.max(...filteredSpectrum.map(p => p.globalIrradianceWm2Nm), 1.8), [filteredSpectrum]);
  const maxActinic = useMemo(() => Math.max(...filteredSpectrum.map(p => p.actinicFluxPhotonsCm2sNm), 1e15), [filteredSpectrum]);
  const maxAction = useMemo(() => Math.max(...filteredSpectrum.map(p => p.actionSpectrumProduct), 6e-19), [filteredSpectrum]);
  const maxJ = useMemo(() => Math.max(...filteredSpectrum.map(p => p.spectralPhotolysisRateS1Nm), 1e-4), [filteredSpectrum]);

  // Funciones de mapeo de coordenadas
  const getX = (wl: number) => {
    return padding.left + ((wl - minWl) / (maxWl - minWl)) * innerWidth;
  };

  const getY_Irradiance = (val: number) => {
    const norm = Math.max(0, Math.min(1, val / maxSolarToa));
    return padding.top + innerHeight - norm * innerHeight;
  };

  const getY_SpectralJ = (val: number) => {
    const norm = Math.max(0, Math.min(1, val / (maxJ * 1.1)));
    return padding.top + innerHeight - norm * innerHeight;
  };

  const getY_Action = (val: number) => {
    const norm = Math.max(0, Math.min(1, val / maxAction));
    return padding.top + innerHeight - norm * innerHeight;
  };

  // Generador de caminos SVG polilínea
  const buildSvgPath = (getYFunc: (p: SpectralPoint) => number) => {
    if (filteredSpectrum.length === 0) return '';
    return filteredSpectrum.map((p, idx) => {
      const x = getX(p.wavelengthNm);
      const y = getYFunc(p);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  };

  // Caminos de las curvas
  const pathSolarToa = useMemo(() => buildSvgPath(p => getY_Irradiance(p.solarToaWm2Nm)), [filteredSpectrum, maxSolarToa]);
  const pathGlobal = useMemo(() => buildSvgPath(p => getY_Irradiance(p.globalIrradianceWm2Nm)), [filteredSpectrum, maxSolarToa]);
  const pathAction = useMemo(() => buildSvgPath(p => getY_Action(p.actionSpectrumProduct)), [filteredSpectrum, maxAction]);
  const pathSpectralJ = useMemo(() => buildSvgPath(p => getY_SpectralJ(p.spectralPhotolysisRateS1Nm)), [filteredSpectrum, maxJ]);

  // Área bajo la curva para dJ_NO2/dλ
  const areaSpectralJ = useMemo(() => {
    if (filteredSpectrum.length === 0) return '';
    const firstX = getX(filteredSpectrum[0].wavelengthNm);
    const lastX = getX(filteredSpectrum[filteredSpectrum.length - 1].wavelengthNm);
    const bottomY = padding.top + innerHeight;
    const linePath = filteredSpectrum.map((p, idx) => {
      const x = getX(p.wavelengthNm);
      const y = getY_SpectralJ(p.spectralPhotolysisRateS1Nm);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
    return `${linePath} L ${lastX.toFixed(1)} ${bottomY} L ${firstX.toFixed(1)} ${bottomY} Z`;
  }, [filteredSpectrum, maxJ]);

  // Punto interactivo hovered
  const hoveredPoint = hoveredIndex !== null && filteredSpectrum[hoveredIndex] ? filteredSpectrum[hoveredIndex] : null;

  return (
    <div className={`flex flex-col bg-slate-950 border border-slate-800 rounded-none overflow-hidden ${className}`}>
      {/* Barra superior de controles interactivos */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
        {/* Selector de Bandas Espectrales */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400 font-bold flex items-center gap-1 mr-1">
            <Layers className="w-3 h-3 text-cyan-400" /> BANDA:
          </span>
          {[
            { id: 'all', label: 'Todo (280-750nm)' },
            { id: 'uvb', label: 'UV-B (280-315nm)', color: 'border-purple-500/80 text-purple-300' },
            { id: 'uva', label: 'UV-A (315-400nm)', color: 'border-indigo-500/80 text-indigo-300' },
            { id: 'no2_band', label: 'Actínica NO₂ (300-425nm)', color: 'border-amber-500/80 text-amber-300' },
            { id: 'par', label: 'PAR Visible (400-700nm)', color: 'border-emerald-500/80 text-emerald-300' }
          ].map(band => (
            <button
              key={band.id}
              onClick={() => setActiveBandHighlight(band.id as any)}
              className={`px-1.5 py-0.5 border text-[8.5px] transition-all ${
                activeBandHighlight === band.id
                  ? 'bg-cyan-950 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {band.label}
            </button>
          ))}
        </div>

        {/* Toggles de Curvas */}
        <div className="flex items-center gap-1.5">
          <ScientificTooltip topic="leighton_photostationary" position="bottom" width="w-[280px]" content="Irradiancia solar extraterrestre AM0 (Tope de la atmósfera). Máximo teórico según el espectro estándar ASTM E490 / Gueymard.">
            <button
              onClick={() => setVisibleCurves(v => ({ ...v, solarToa: !v.solarToa }))}
              className={`flex items-center gap-1 px-1.5 py-0.5 border text-[8px] transition-colors ${
                visibleCurves.solarToa ? 'bg-amber-950/80 border-amber-500/80 text-amber-300' : 'bg-black/40 border-slate-800 text-slate-600 line-through'
              }`}
            >
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
              <span>Solar TOA</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip topic="leighton_photostationary" position="bottom" width="w-[280px]" content="Irradiancia global a nivel de superficie (Directa + Difusa) tras la atenuación combinada de Rayleigh, capa de ozono y espesor óptico de aerosoles (AOD).">
            <button
              onClick={() => setVisibleCurves(v => ({ ...v, globalGround: !v.globalGround }))}
              className={`flex items-center gap-1 px-1.5 py-0.5 border text-[8px] transition-colors ${
                visibleCurves.globalGround ? 'bg-sky-950/80 border-sky-500/80 text-sky-300' : 'bg-black/40 border-slate-800 text-slate-600 line-through'
              }`}
            >
              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full"></div>
              <span>Irradiancia Superficie</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip topic="leighton_photostationary" position="bottom" width="w-[300px]" content="Espectro de acción molecular de NO2: Producto de la sección eficaz de absorción σ(λ, T) por el rendimiento cuántico de fotodisociación φ(λ, T). Cae a 0 en λ > 425 nm.">
            <button
              onClick={() => setVisibleCurves(v => ({ ...v, actionSpectrum: !v.actionSpectrum }))}
              className={`flex items-center gap-1 px-1.5 py-0.5 border text-[8px] transition-colors ${
                visibleCurves.actionSpectrum ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300' : 'bg-black/40 border-slate-800 text-slate-600 line-through'
              }`}
            >
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
              <span>Acción σ·φ (NO₂)</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip topic="leighton_photostationary" position="bottom" width="w-[320px]" content="Tasa diferencial de fotólisis dJ_NO2/dλ = σ(λ)·φ(λ)·F(λ). La integral bajo esta curva define la frecuencia de fotólisis total J_NO2 (s⁻¹).">
            <button
              onClick={() => setVisibleCurves(v => ({ ...v, spectralJ: !v.spectralJ }))}
              className={`flex items-center gap-1 px-1.5 py-0.5 border text-[8px] transition-colors ${
                visibleCurves.spectralJ ? 'bg-rose-950/80 border-rose-500/80 text-rose-300 font-bold shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-black/40 border-slate-800 text-slate-600 line-through'
              }`}
            >
              <div className="w-1.5 h-1.5 bg-rose-400 rounded-full"></div>
              <span>dJ_NO₂/dλ</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {/* Área del Gráfico SVG Espectral */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900/90 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ minHeight: `${height}px` }}
          onMouseLeave={() => setHoveredIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * width;
            if (mouseX >= padding.left && mouseX <= width - padding.right) {
              const fraction = (mouseX - padding.left) / innerWidth;
              const targetWl = minWl + fraction * (maxWl - minWl);
              let closestIdx = 0;
              let minDiff = Infinity;
              filteredSpectrum.forEach((p, idx) => {
                const diff = Math.abs(p.wavelengthNm - targetWl);
                if (diff < minDiff) {
                  minDiff = diff;
                  closestIdx = idx;
                }
              });
              setHoveredIndex(closestIdx);
            }
          }}
        >
          <defs>
            {/* Gradiente para el área bajo la curva de fotólisis dJ_NO2/dλ */}
            <linearGradient id="photolysisJGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>

            {/* Gradiente para la banda espectral UV-A / Fotolítica */}
            <linearGradient id="uvBandGradient" x1="0%" y1="0%" x2="1%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.08" />
              <stop offset="50%" stopColor="#c084fc" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          {/* Bandas de fondo destacadas */}
          {/* UV-B: 280-315 nm */}
          {(activeBandHighlight === 'all' || activeBandHighlight === 'uvb') && (
            <rect
              x={getX(280)}
              y={padding.top}
              width={getX(315) - getX(280)}
              height={innerHeight}
              fill="#a855f7"
              fillOpacity={activeBandHighlight === 'uvb' ? 0.22 : 0.06}
            />
          )}

          {/* UV-A: 315-400 nm */}
          {(activeBandHighlight === 'all' || activeBandHighlight === 'uva' || activeBandHighlight === 'no2_band') && (
            <rect
              x={getX(315)}
              y={padding.top}
              width={getX(400) - getX(315)}
              height={innerHeight}
              fill="#6366f1"
              fillOpacity={activeBandHighlight === 'uva' ? 0.22 : 0.08}
            />
          )}

          {/* Ventana crítica de fotólisis de NO2: 380 - 420 nm */}
          {(activeBandHighlight === 'no2_band') && (
            <rect
              x={getX(380)}
              y={padding.top}
              width={getX(420) - getX(380)}
              height={innerHeight}
              fill="#f43f5e"
              fillOpacity={0.25}
              stroke="#f43f5e"
              strokeDasharray="2 2"
              strokeWidth={1}
            />
          )}

          {/* PAR: 400-700 nm */}
          {(activeBandHighlight === 'all' || activeBandHighlight === 'par') && (
            <rect
              x={getX(400)}
              y={padding.top}
              width={getX(700) - getX(400)}
              height={innerHeight}
              fill="#10b981"
              fillOpacity={activeBandHighlight === 'par' ? 0.18 : 0.04}
            />
          )}

          {/* Rejilla y Guías Horizontales */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
            const y = padding.top + innerHeight - frac * innerHeight;
            const irrVal = (frac * maxSolarToa).toFixed(1);
            return (
              <g key={`grid-h-${frac}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#334155"
                  strokeOpacity={0.35}
                  strokeDasharray="3 3"
                />
                {/* Eje izquierdo: Irradiancia W/(m²·nm) */}
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="7.5"
                  fontFamily="monospace"
                >
                  {irrVal}
                </text>
              </g>
            );
          })}

          {/* Rejilla y Guías Verticales (Longitudes de onda clave) */}
          {[300, 350, 400, 450, 500, 550, 600, 650, 700].map((wl) => {
            const x = getX(wl);
            return (
              <g key={`grid-v-${wl}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + innerHeight}
                  stroke="#334155"
                  strokeOpacity={0.35}
                  strokeDasharray="3 3"
                />
                <text
                  x={x}
                  y={padding.top + innerHeight + 14}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {wl} nm
                </text>
              </g>
            );
          })}

          {/* Etiquetas de las Bandas en el encabezado del gráfico */}
          <text x={getX(297)} y={padding.top - 8} textAnchor="middle" fill="#c084fc" fontSize="8" fontWeight="bold" fontFamily="monospace">
            UV-B
          </text>
          <text x={getX(357)} y={padding.top - 8} textAnchor="middle" fill="#818cf8" fontSize="8" fontWeight="bold" fontFamily="monospace">
            UV-A (Fotólisis NO₂)
          </text>
          <text x={getX(550)} y={padding.top - 8} textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="bold" fontFamily="monospace">
            Espectro Visible (PAR / 400-700 nm)
          </text>

          {/* Curva de Fotólisis Espectral (Área y Línea dJ_NO2/dλ) */}
          {visibleCurves.spectralJ && (
            <>
              <path d={areaSpectralJ} fill="url(#photolysisJGradient)" />
              <path
                d={pathSpectralJ}
                fill="none"
                stroke="#f43f5e"
                strokeWidth={2.4}
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
              />
            </>
          )}

          {/* Curva Solar TOA (Extraterrestre AM0) */}
          {visibleCurves.solarToa && (
            <path
              d={pathSolarToa}
              fill="none"
              stroke="#fbbf24"
              strokeWidth={1.8}
              strokeDasharray="4 2"
              strokeOpacity={0.85}
            />
          )}

          {/* Curva Irradiancia en Superficie con Aerosoles */}
          {visibleCurves.globalGround && (
            <path
              d={pathGlobal}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={2.2}
              strokeLinecap="round"
              className="filter drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]"
            />
          )}

          {/* Curva Espectro de Acción Molecular σ·φ */}
          {visibleCurves.actionSpectrum && (
            <path
              d={pathAction}
              fill="none"
              stroke="#10b981"
              strokeWidth={1.8}
              strokeDasharray="2 2"
              strokeOpacity={0.9}
            />
          )}

          {/* Marcador del Pico de Fotólisis (λ_max ≈ 390 nm) */}
          <g transform={`translate(${getX(simulation.summary.peakPhotolysisWavelengthNm)}, ${getY_SpectralJ(maxJ)})`}>
            <circle r="4.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" className="animate-pulse" />
            <line x1="0" y1="6" x2="0" y2={padding.top + innerHeight - getY_SpectralJ(maxJ)} stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.7" />
            <text x="0" y="-8" textAnchor="middle" fill="#fda4af" fontSize="8" fontWeight="bold" fontFamily="monospace">
              Pico {simulation.summary.peakPhotolysisWavelengthNm} nm
            </text>
          </g>

          {/* Indicador de cursor hovered */}
          {hoveredPoint && (
            <g>
              <line
                x1={getX(hoveredPoint.wavelengthNm)}
                y1={padding.top}
                x2={getX(hoveredPoint.wavelengthNm)}
                y2={padding.top + innerHeight}
                stroke="#ffffff"
                strokeWidth={1.2}
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoveredPoint.wavelengthNm)}
                cy={getY_SpectralJ(hoveredPoint.spectralPhotolysisRateS1Nm)}
                r="4"
                fill="#f43f5e"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <circle
                cx={getX(hoveredPoint.wavelengthNm)}
                cy={getY_Irradiance(hoveredPoint.globalIrradianceWm2Nm)}
                r="3.5"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="1.2"
              />
            </g>
          )}

          {/* Títulos de los Ejes */}
          <text
            x={padding.left + innerWidth / 2}
            y={height - 8}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
          >
            Longitud de Onda λ (nm) • Espectro Ultravioleta y Visible
          </text>

          <text
            x={-padding.top - innerHeight / 2}
            y={16}
            transform="rotate(-90)"
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="8"
            fontFamily="monospace"
          >
            Irradiancia E(λ) [W/(m²·nm)]
          </text>

          <text
            x={-padding.top - innerHeight / 2}
            y={width - 8}
            transform="rotate(-90)"
            textAnchor="middle"
            fill="#f43f5e"
            fontSize="8"
            fontFamily="monospace"
          >
            Tasa Fotólisis dJ_NO₂/dλ [s⁻¹/nm]
          </text>
        </svg>

        {/* Floating Tooltip Hover HUD */}
        {hoveredPoint && (
          <div
            className="absolute top-4 right-4 bg-slate-950/95 border border-cyan-500/80 p-2.5 shadow-2xl text-[9px] font-mono space-y-1 z-30 pointer-events-none rounded backdrop-blur-md max-w-xs"
          >
            <div className="flex items-center justify-between border-b border-cyan-800 pb-1 text-cyan-300 font-bold">
              <span>λ = {hoveredPoint.wavelengthNm} nm</span>
              <span className="text-[7.5px] bg-cyan-950 px-1 py-0.2 border border-cyan-700 text-cyan-200">
                {hoveredPoint.wavelengthNm < 315 ? 'UV-B' : hoveredPoint.wavelengthNm <= 400 ? 'UV-A' : 'VIS'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-0.5 text-slate-300">
              <span className="text-amber-300">Solar TOA AM0:</span>
              <span className="text-right font-bold">{hoveredPoint.solarToaWm2Nm} W/(m²·nm)</span>

              <span className="text-sky-300">Irradiancia Suelo:</span>
              <span className="text-right font-bold">{hoveredPoint.globalIrradianceWm2Nm} W/(m²·nm)</span>

              <span className="text-purple-300">Espesor AOD τ_aer:</span>
              <span className="text-right font-bold">{hoveredPoint.aerosolOpticalDepth}</span>

              <span className="text-emerald-300">σ_NO₂·φ (Acción):</span>
              <span className="text-right font-bold">{hoveredPoint.actionSpectrumProduct.toExponential(2)} cm²</span>

              <span className="text-rose-300 font-bold">dJ_NO₂/dλ:</span>
              <span className="text-right font-bold text-rose-300">{hoveredPoint.spectralPhotolysisRateS1Nm.toExponential(3)} s⁻¹/nm</span>

              <span className="text-slate-400">Transmitancia I/I₀:</span>
              <span className="text-right font-bold">{(hoveredPoint.spectralAttenuationRatio * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Panel inferior de métricas integradas y desglose de bandas */}
      <div className="bg-slate-900/90 border-t border-slate-800 p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px] font-mono">
        <div className="bg-slate-950/80 p-2 border border-amber-950/80">
          <div className="text-slate-400 text-[8px] uppercase">Irradiancia Global Integrada</div>
          <div className="text-amber-300 font-bold text-sm">
            {simulation.summary.integratedGlobalIrradianceWm2} <span className="text-[8px] text-slate-400 font-normal">W/m²</span>
          </div>
          <div className="text-[7.5px] text-slate-500 mt-0.5">
            Directa: {simulation.summary.integratedDirectIrradianceWm2} | Difusa: {simulation.summary.integratedDiffuseIrradianceWm2} W/m²
          </div>
        </div>

        <div className="bg-slate-950/80 p-2 border border-rose-950/80">
          <div className="text-slate-400 text-[8px] uppercase">Tasa de Fotólisis Integrada (J_NO2)</div>
          <div className="text-rose-400 font-bold text-sm">
            {simulation.summary.jNO2_s1.toFixed(5)} <span className="text-[8px] text-slate-400 font-normal">s⁻¹</span>
          </div>
          <div className="text-[7.5px] text-slate-400 mt-0.5 flex justify-between">
            <span>{simulation.summary.jNO2_min1.toFixed(3)} min⁻¹</span>
            <span className="text-rose-300">τ = {simulation.summary.characteristicLifetimeS}s</span>
          </div>
        </div>

        <div className="bg-slate-950/80 p-2 border border-indigo-950/80">
          <div className="text-slate-400 text-[8px] uppercase">Contribución por Banda Actínica</div>
          <div className="text-indigo-300 font-bold text-xs flex justify-between pt-0.5">
            <span>UV-A: <strong className="text-white">{simulation.uvBandComparison.uvaJContributionPct}%</strong></span>
            <span>UV-B: <strong className="text-purple-300">{simulation.uvBandComparison.uvbJContributionPct}%</strong></span>
          </div>
          <div className="text-[7.5px] text-slate-500 mt-0.5">
            Visible (400-425 nm): {simulation.uvBandComparison.visJContributionPct}%
          </div>
        </div>

        <div className="bg-slate-950/80 p-2 border border-emerald-950/80">
          <div className="text-slate-400 text-[8px] uppercase">Equilibrio PSS de Ozono ([O₃]_pss)</div>
          <div className="text-emerald-400 font-bold text-sm">
            {simulation.summary.pssOzoneEstimatedPpb} <span className="text-[8px] text-slate-400 font-normal">ppb</span>
          </div>
          <div className="text-[7.5px] text-slate-400 mt-0.5 flex justify-between">
            <span>Ratio Leighton Φ: {simulation.summary.leightonRatioEstimated}</span>
            <span className="text-emerald-300">Aten. Aerosol: -{simulation.summary.aerosolExtinctionFractionPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
