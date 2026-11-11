import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Globe, Radio, Layers, Activity, Sparkles, Compass, ShieldCheck, Cpu } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { CamsRegionalBoundary } from '../lib/camsRealtimeAssimilation';

export interface CamsKrigingInterpolationDiagramProps {
  boundary: CamsRegionalBoundary;
  nugget: number;
  sill: number;
  rangeKm: number;
  avgNO2: number;
  avgO3: number;
  spatialVariance: number;
}

export const CamsKrigingInterpolationDiagram: React.FC<CamsKrigingInterpolationDiagramProps> = ({
  boundary,
  nugget,
  sill,
  rangeKm,
  avgNO2,
  avgO3,
  spatialVariance
}) => {
  // SVG Canvas dimensions: 620x350
  const width = 620;
  const height = 350;

  // Theoretical semivariogram points for small embedded graph
  const variogramPoints = useMemo(() => {
    const pts = [];
    const maxH = 25; // km
    const plotW = 160;
    const plotH = 80;
    const originX = 420;
    const originY = 140;

    for (let h = 0; h <= maxH; h += 2) {
      // Exponential model: gamma(h) = nugget + (sill - nugget) * (1 - exp(-h / (rangeKm / 3)))
      const gamma = nugget + (sill - nugget) * (1 - Math.exp(-h / (rangeKm / 3)));
      const x = originX + (h / maxH) * plotW;
      const y = originY - (gamma / (sill * 1.25)) * plotH;
      pts.push({ x, y });
    }
    return pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
  }, [nugget, sill, rangeKm]);

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-3 font-sans shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30">
            <Globe className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Geoestadística Kriging Ordinario &amp; Asimilación Regional Copernicus CAMS</span>
              <ScientificTooltip
                title="Kriging Ordinario (Estimador BLUE)"
                content="Best Linear Unbiased Estimator (BLUE) que minimiza la varianza de estimación del campo de fondo continuo a partir de los datos asimilados de la red y CAMS."
                formula="\hat{Z}(x_0) = \sum_{i=1}^n \lambda_i Z(x_i), \quad \sum_{i=1}^n \lambda_i = 1"
                citation="Cressie, N. (1993) Statistics for Spatial Data. John Wiley & Sons."
              />
            </h4>
            <p className="text-[9.5px] text-slate-400">
              Interpolación espacial BLUE (Best Linear Unbiased Estimator) • Semivariograma Exponencial γ(h)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ScientificTooltip
            title="Rango Práctico Espacial (a)"
            content="Distancia a partir de la cual la covarianza espacial entre observaciones se vuelve despreciable (gamma alcanza el 95% de la meseta sill)."
            formula="a_{practico} = 3 \cdot a_0 \quad (\text{Modelo Exponencial})"
          >
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-cyan-950/80 text-cyan-300 border-cyan-700 flex items-center gap-1 cursor-help">
              <Cpu className="w-3 h-3 text-cyan-400" />
              Rango Práctico a: {rangeKm} km
            </span>
          </ScientificTooltip>
        </div>
      </div>

      {/* Main SVG Vector Canvas */}
      <div className="relative w-full overflow-hidden bg-slate-900/60 rounded-lg border border-slate-800/60">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          id="cams-kriging-diagram-svg"
        >
          <defs>
            <linearGradient id="krigingHeat" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.7" />
              <stop offset="45%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
            </linearGradient>

            <radialGradient id="meshRadial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#0284c7" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </radialGradient>

            <filter id="camsGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Background Grid & Domain Outline */}
          <rect x="0" y="0" width={width} height={height} fill="#020617" />
          
          {/* Spatial Map of Málaga Basin */}
          <g transform="translate(30, 30)">
            {/* Domain Box */}
            <rect
              width="360"
              height="280"
              rx="8"
              fill="#0b1329"
              stroke="#1e293b"
              strokeWidth="1.5"
            />

            {/* Coastal Outline (Bahía de Málaga) */}
            <path
              d="M 10 210 Q 120 220 200 170 T 350 140 L 350 270 L 10 270 Z"
              fill="#0369a1"
              opacity="0.25"
            />
            <text x="180" y="240" fill="#38bdf8" fontSize="9" fontWeight="bold" opacity="0.6">
              Mar de Alborán (Bahía de Málaga)
            </text>

            {/* Kriging Interpolation Continuous Mesh (Isopleth Contours) */}
            <path
              d="M 60 160 Q 150 130 240 100 Q 280 140 200 170 Z"
              fill="url(#krigingHeat)"
              opacity="0.45"
            />
            <path
              d="M 110 130 Q 160 110 210 120 Q 230 145 180 155 Z"
              fill="#f59e0b"
              opacity="0.5"
              filter="url(#camsGlow)"
            />

            {/* Kriging Grid Points (Nodes of 12x12 Mesh) */}
            {[
              { x: 50, y: 70, val: boundary.no2_regional_ug_m3 * 0.8 },
              { x: 100, y: 60, val: boundary.no2_regional_ug_m3 * 0.9 },
              { x: 150, y: 70, val: boundary.no2_regional_ug_m3 * 1.1 },
              { x: 200, y: 65, val: boundary.no2_regional_ug_m3 * 1.2 },
              { x: 260, y: 80, val: boundary.no2_regional_ug_m3 * 1.05 },
              { x: 70, y: 120, val: boundary.no2_regional_ug_m3 * 0.95 },
              { x: 130, y: 110, val: avgNO2 * 1.15 },
              { x: 180, y: 115, val: avgNO2 * 1.3 }, // Urban Peak
              { x: 240, y: 125, val: avgNO2 * 1.0 },
              { x: 90, y: 170, val: boundary.no2_regional_ug_m3 * 0.75 },
              { x: 150, y: 165, val: avgNO2 * 1.05 },
              { x: 210, y: 160, val: boundary.no2_regional_ug_m3 * 0.85 }
            ].map((node, i) => (
              <g key={i}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="3.5"
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="8"
                  fill="#38bdf8"
                  opacity="0.2"
                />
              </g>
            ))}

            {/* Regional CAMS Boundary Flux Vectors (Incoming from Europe/Gibraltar) */}
            <g stroke="#06b6d4" strokeWidth="2" strokeDasharray="3 3">
              <line x1="10" y1="40" x2="60" y2="60" markerEnd="url(#arrowCams)" />
              <line x1="10" y1="100" x2="50" y2="110" />
              <line x1="10" y1="160" x2="60" y2="160" />
            </g>

            <rect x="15" y="15" width="130" height="20" rx="3" fill="#0f172a" stroke="#06b6d4" strokeWidth="1" />
            <text x="80" y="28" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle">
              Flujo Frontera CAMS 0.1°
            </text>

            {/* Landmark Labels */}
            <text x="180" y="105" fill="#fef08a" fontSize="8" fontWeight="bold" textAnchor="middle">
              Centro Histórico / Alameda
            </text>
            <circle cx="180" cy="115" r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
          </g>

          {/* 2. Side Panel: Semivariogram Function & Parameters */}
          <g transform="translate(410, 30)">
            <rect
              width="190"
              height="280"
              rx="8"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="1"
            />

            <text x="95" y="22" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">
              Semivariograma γ(h)
            </text>
            <text x="95" y="34" fill="#94a3b8" fontSize="7.5" textAnchor="middle">
              γ(h) = c₀ + c · (1 - e^(-3h/a))
            </text>

            {/* Variogram Graph Axes */}
            <line x1="20" y1="120" x2="175" y2="120" stroke="#475569" strokeWidth="1" />
            <line x1="20" y1="50" x2="20" y2="120" stroke="#475569" strokeWidth="1" />

            {/* Variogram Curve Path */}
            <path
              d={variogramPoints}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
            />

            {/* Sill Line */}
            <line x1="20" y1="65" x2="175" y2="65" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3 3" />
            <text x="175" y="62" fill="#f43f5e" fontSize="7.5" textAnchor="end">
              Meseta (Sill): {sill}
            </text>

            {/* Nugget Mark */}
            <circle cx="20" cy={120 - (nugget / (sill * 1.25)) * 80} r="3" fill="#f59e0b" />
            <text x="25" y={115 - (nugget / (sill * 1.25)) * 80} fill="#f59e0b" fontSize="7.5">
              Pepita (c₀): {nugget}
            </text>

            {/* Mathematical System Info */}
            <g transform="translate(15, 140)">
              <rect width="160" height="60" rx="4" fill="#020617" stroke="#1e293b" strokeWidth="1" />
              <text x="8" y="16" fill="#e2e8f0" fontSize="8" fontWeight="bold">
                Sistema Kriging Ordinario:
              </text>
              <text x="8" y="30" fill="#38bdf8" fontSize="7.5" fontFamily="monospace">
                Γ · λ = γ₀  |  Σ λᵢ = 1
              </text>
              <text x="8" y="44" fill="#94a3b8" fontSize="7" fontFamily="monospace">
                Varianza Estimación: σ²ₖ = {spatialVariance.toFixed(2)}
              </text>
            </g>

            {/* Real-time Averages */}
            <g transform="translate(15, 210)">
              <rect width="160" height="58" rx="4" fill="#020617" stroke="#1e293b" strokeWidth="1" />
              <text x="8" y="16" fill="#94a3b8" fontSize="7.5">Media Asimilada NO₂:</text>
              <text x="8" y="30" fill="#f59e0b" fontSize="9" fontWeight="bold" fontFamily="monospace">
                {avgNO2.toFixed(1)} µg/m³
              </text>

              <text x="8" y="44" fill="#94a3b8" fontSize="7.5">Fondo Regional O₃:</text>
              <text x="8" y="54" fill="#38bdf8" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                {avgO3.toFixed(1)} µg/m³
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Numerical Synthesis Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9.5px] font-mono bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 block">Efecto Pepita (Nugget):</span>
            <ScientificTooltip
              title="Efecto Pepita (Nugget Effect, c₀)"
              content="Discontinuidad en el origen del semivariograma que representa la variabilidad a distancias menores que la resolución mínima de muestreo y el error de medición instrumental de los sensores."
              formula="\lim_{h \to 0^+} \gamma(h) = c_0"
            />
          </div>
          <span className="text-amber-400 font-bold text-xs">{nugget.toFixed(1)} (Error Microescala)</span>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 block">Meseta Total (Sill):</span>
            <ScientificTooltip
              title="Meseta Total (Sill, c₀ + c)"
              content="Valor asintótico del semivariograma que converge con la varianza a priori de la variable espacializada en todo el dominio urbano de Málaga."
              formula="\lim_{h \to \infty} \gamma(h) = c_0 + c = \text{Var}(Z)"
            />
          </div>
          <span className="text-rose-400 font-bold text-xs">{sill.toFixed(1)} (Varianza A priori)</span>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 block">Rango Práctico (a):</span>
            <ScientificTooltip
              title="Rango Práctico (Range, a)"
              content="Distancia espacial de correlación efectiva más allá de la cual dos observaciones atmosféricas se consideran estadísticamente independientes."
            />
          </div>
          <span className="text-cyan-400 font-bold text-xs">{rangeKm.toFixed(1)} km</span>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 block">Varianza Espacial σ²:</span>
            <ScientificTooltip
              title="Varianza de Estimación Kriging (σ²_k)"
              content="Medida rigurosa de la incertidumbre geoestadística asociada al estimador BLUE en cada punto interpolado de la ciudad."
              formula="\sigma_k^2(x_0) = \sum_{i=1}^n \lambda_i \gamma(x_i - x_0) + \mu"
            />
          </div>
          <span className="text-emerald-400 font-bold text-xs">{spatialVariance.toFixed(2)} (µg/m³)²</span>
        </div>
      </div>
    </div>
  );
};
