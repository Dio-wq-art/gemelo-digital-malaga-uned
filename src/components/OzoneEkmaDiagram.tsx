import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Activity, ArrowRight, Flame, ShieldAlert, Wind, TrendingDown } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { calculatePankowSoaYield } from '../lib/ozoneEkmaSoaModel';
import { useActivePoint } from '../context/ActivePointContext';
import { MathFormula } from './MathFormula';

interface OzoneEkmaDiagramProps {
  noxPpb: number;
  vocPpbC: number;
  maxO3Ppb: number;
  regime: 'VOC-Limited' | 'NOx-Limited' | 'Transitional' | 'voc_limited' | 'nox_limited' | 'transition' | 'transitional';
  optimumRatio?: number;
  soaYieldUgm3?: number;
}

export function OzoneEkmaDiagram({
  noxPpb,
  vocPpbC,
  maxO3Ppb,
  regime,
  optimumRatio,
  soaYieldUgm3
}: OzoneEkmaDiagramProps) {
  // SVG Canvas dimensions: 600x380
  const width = 600;
  const height = 360;
  const padding = { top: 30, right: 40, bottom: 50, left: 60 };

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // Domain ranges: NOx 0 to 120 ppb, VOC 0 to 600 ppbC
  const maxNox = 120;
  const maxVoc = 600;

  // Coordinate transforms
  const getX = (nox: number) => padding.left + (nox / maxNox) * plotW;
  const getY = (voc: number) => padding.top + plotH - (voc / maxVoc) * plotH;

  const currentX = Math.min(width - padding.right, Math.max(padding.left, getX(noxPpb)));
  const currentY = Math.min(padding.top + plotH, Math.max(padding.top, getY(vocPpbC)));

  // Generate EKMA Isopleth Contour Curves
  // An empirical analytical EKMA function: O3(NOx, VOC) = k * (VOC^0.7 * NOx^0.6) / (1 + a*NOx + b*VOC)
  const isopleths = useMemo(() => {
    const contours = [40, 60, 80, 100, 120, 140, 160, 180, 200];
    return contours.map((targetO3) => {
      const points: { x: number; y: number }[] = [];
      for (let nx = 4; nx <= maxNox; nx += 3) {
        // Solve for approximate VOC given target O3 and NOx
        // Simplified parabolic isopleth trajectory: VOC ≈ (O3_target^1.4) / (nx^0.55) + 2.2*nx
        const vocEst = Math.pow(targetO3, 1.45) / Math.pow(nx, 0.58) + 1.8 * nx - 15;
        if (vocEst > 0 && vocEst <= maxVoc) {
          points.push({ x: getX(nx), y: getY(vocEst) });
        }
      }
      return {
        o3Level: targetO3,
        path: points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '')
      };
    }).filter(c => c.path.length > 5);
  }, []);

  // Ridge Line (Cresta de Ozono / Ozone Ridge Line: VOC/NOx ≈ 8:1)
  const ridgePoints = useMemo(() => {
    const pts = [];
    for (let nx = 0; nx <= 75; nx += 5) {
      const voc = nx * 8.0;
      if (voc <= maxVoc) {
        pts.push({ x: getX(nx), y: getY(voc) });
      }
    }
    return pts.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '');
  }, []);

  const activeCtx = useActivePoint();
  const liveTempC = activeCtx?.assimilation?.temperatureC ?? 24.5;
  const liveSolarWm2 = activeCtx?.assimilation?.solarRadiationWm2 ?? 620;

  const effectiveSoaYield = useMemo(() => {
    if (soaYieldUgm3 !== undefined && soaYieldUgm3 > 0) return soaYieldUgm3;
    const pankow = calculatePankowSoaYield(liveTempC, 2.5, liveSolarWm2, Math.max(5.0, vocPpbC * 0.12));
    return pankow.soaConcentrationUgm3;
  }, [soaYieldUgm3, vocPpbC, liveTempC, liveSolarWm2]);

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-3 font-sans shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/30">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              Diagrama de Isopletas Fotoquímicas EKMA &amp; Régimen de Sensibilidad
              <ScientificTooltip
                title="Enfoque Cinético Empírico de Modelización (EKMA)"
                formula="P(O_3) = k_{HO_2+NO}[HO_2^\bullet][NO] + \sum k_{RO_2,i+NO}[RO_{2,i}^\bullet][NO]"
                normative="US EPA Dodge (1977) • Seinfeld & Pandis (2016) Cap. 6 • Directiva (UE) 2024/2881"
                content="Proyección bidimensional de las superficies de isoconcentración de O₃ troposférico en función de los precursores iniciales NOₓ (ppb) y COVs (ppbC). Identifica la línea de cresta fotoquímica (VOC/NOₓ ≈ 8:1) que separa el régimen limitado por COVs (centro urbano denso con titulación por NO) del régimen limitado por NOₓ (sotavento periurbano)."
              />
            </h4>
            <p className="text-[9.5px] text-slate-400">
              Metodología Dodge (EPA) / Seinfeld &amp; Pandis (2016) • Formación de O₃ troposférico y SOA en Málaga
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ScientificTooltip
            position="left"
            title="Diagnóstico de Sensibilidad Fotoquímica Sillman (1995)"
            formula="\text{Ratio Sillman} = \frac{P(H_2O_2)}{P(HNO_3)} \quad \Big| \quad \frac{[\text{VOC}]_{\text{ppbC}}}{[\text{NO}_x]_{\text{ppb}}}"
            normative="Sillman (1995) Atmos. Environ. • EMEP/EEA Guidebook"
            content={`Régimen fotoquímico diagnosticado (${regime}): cuando la terminación radicalaria domina por OH + NO₂ → HNO₃ (VOC/NOₓ < 8), reducir NOₓ a corto plazo disminuye la titulación de O₃ provocando el 'efecto fin de semana'. Por encima de la cresta (VOC/NOₓ > 8), la terminación ocurre vía HO₂ + HO₂ → H₂O₂ y el abatimiento de NOₓ reduce linealmente el O₃.`}
          >
            <span className={`cursor-help text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
              regime === 'VOC-Limited'
                ? 'bg-rose-950/80 text-rose-300 border-rose-700/80'
                : regime === 'NOx-Limited'
                ? 'bg-sky-950/80 text-sky-300 border-sky-700/80'
                : 'bg-amber-950/80 text-amber-300 border-amber-700/80'
            }`}>
              <Activity className="w-3 h-3 animate-pulse" />
              Régimen: {regime}
            </span>
          </ScientificTooltip>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden bg-slate-900/60 rounded-lg border border-slate-800/60">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          id="ekma-svg-diagram"
        >
          <defs>
            {/* Background Grid Gradients */}
            <linearGradient id="vocLimitedGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="noxLimitedGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
            </linearGradient>

            {/* Point Pulse Filter */}
            <filter id="glowPoint" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Regime Shaded Zones */}
          {/* VOC-Limited Polygon (Above Ridge Line) */}
          <polygon
            points={`${padding.left},${padding.top} ${padding.left + plotW * 0.62},${padding.top} ${padding.left},${padding.top + plotH}`}
            fill="url(#vocLimitedGrad)"
          />
          {/* NOx-Limited Polygon (Below Ridge Line) */}
          <polygon
            points={`${padding.left},${padding.top + plotH} ${padding.left + plotW},${padding.top + plotH} ${padding.left + plotW},${padding.top + plotH * 0.2} ${padding.left + plotW * 0.62},${padding.top}`}
            fill="url(#noxLimitedGrad)"
          />

          {/* 2. Grid Lines */}
          {/* NOx Vertical grid lines */}
          {[20, 40, 60, 80, 100].map((nx) => (
            <g key={`grid-nx-${nx}`}>
              <line
                x1={getX(nx)}
                y1={padding.top}
                x2={getX(nx)}
                y2={padding.top + plotH}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.4"
              />
              <text
                x={getX(nx)}
                y={padding.top + plotH + 16}
                fill="#94a3b8"
                fontSize="9"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {nx}
              </text>
            </g>
          ))}

          {/* VOC Horizontal grid lines */}
          {[100, 200, 300, 400, 500].map((voc) => (
            <g key={`grid-voc-${voc}`}>
              <line
                x1={padding.left}
                y1={getY(voc)}
                x2={padding.left + plotW}
                y2={getY(voc)}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.4"
              />
              <text
                x={padding.left - 8}
                y={getY(voc) + 3}
                fill="#94a3b8"
                fontSize="9"
                textAnchor="end"
                fontFamily="monospace"
              >
                {voc}
              </text>
            </g>
          ))}

          {/* 3. Axes */}
          <line
            x1={padding.left}
            y1={padding.top + plotH}
            x2={padding.left + plotW}
            y2={padding.top + plotH}
            stroke="#64748b"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + plotH}
            stroke="#64748b"
            strokeWidth="1.5"
          />

          {/* Axis Labels */}
          <text
            x={padding.left + plotW / 2}
            y={height - 10}
            fill="#cbd5e1"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
          >
            Concentración de Precursores NOₓ [NO + NO₂] (ppb)
          </text>
          <text
            x={18}
            y={padding.top + plotH / 2}
            fill="#cbd5e1"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            transform={`rotate(-90 18 ${padding.top + plotH / 2})`}
          >
            Compuestos Orgánicos Volátiles COVs (ppbC)
          </text>

          {/* 4. Isopleth Lines */}
          {isopleths.map((c) => (
            <g key={`iso-${c.o3Level}`}>
              <path
                d={c.path}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeOpacity="0.6"
              />
              {/* Isopleth label */}
              <text
                x={getX(c.o3Level > 140 ? 30 : 50)}
                y={getY(Math.pow(c.o3Level, 1.45) / Math.pow(c.o3Level > 140 ? 30 : 50, 0.58) + 1.8 * (c.o3Level > 140 ? 30 : 50) - 15) - 4}
                fill="#fbbf24"
                fontSize="8"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {c.o3Level} ppb
              </text>
            </g>
          ))}

          {/* 5. Ozone Ridge Line (Cresta de Máxima Producción VOC/NOx ≈ 8:1) */}
          <path
            d={ridgePoints}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.2"
            strokeDasharray="5 3"
          />
          <text
            x={getX(45)}
            y={getY(45 * 8.0) - 8}
            fill="#f43f5e"
            fontSize="8.5"
            fontWeight="bold"
            transform={`rotate(-32 ${getX(45)} ${getY(45 * 8.0) - 8})`}
          >
            Cresta de Ozono (VOC/NOₓ ≈ 8:1)
          </text>

          {/* 6. Text Annotations for Regimes */}
          <text
            x={padding.left + 35}
            y={padding.top + 35}
            fill="#f87171"
            fontSize="10"
            fontWeight="bold"
          >
            Régimen Limitado por VOC
          </text>
          <text
            x={padding.left + 35}
            y={padding.top + 48}
            fill="#94a3b8"
            fontSize="8"
          >
            (Sensible a solventes/BVOCs; bajar NOₓ puede elevar O₃ por menor titulación)
          </text>

          <text
            x={padding.left + plotW - 20}
            y={padding.top + plotH - 35}
            fill="#38bdf8"
            fontSize="10"
            fontWeight="bold"
            textAnchor="end"
          >
            Régimen Limitado por NOₓ
          </text>
          <text
            x={padding.left + plotW - 20}
            y={padding.top + plotH - 22}
            fill="#94a3b8"
            fontSize="8"
            textAnchor="end"
          >
            (Sensible al tráfico rodado/LEZ; bajar NOₓ reduce O₃ eficazmente)
          </text>

          {/* 7. Current State Operating Point */}
          {/* Target guidelines */}
          <line
            x1={padding.left}
            y1={currentY}
            x2={currentX}
            y2={currentY}
            stroke="#fbbf24"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.8"
          />
          <line
            x1={currentX}
            y1={currentY}
            x2={currentX}
            y2={padding.top + plotH}
            stroke="#fbbf24"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.8"
          />

          {/* Vector reduction arrows for mitigation analysis */}
          {/* Action 1: Reduce NOx (-30%) */}
          <line
            x1={currentX}
            y1={currentY}
            x2={Math.max(padding.left, currentX - 35)}
            y2={currentY}
            stroke="#38bdf8"
            strokeWidth="2"
            markerEnd="url(#arrow)"
          />
          {/* Action 2: Reduce VOC (-30%) */}
          <line
            x1={currentX}
            y1={currentY}
            x2={currentX}
            y2={Math.min(padding.top + plotH, currentY + 30)}
            stroke="#f43f5e"
            strokeWidth="2"
          />

          {/* Pulsing Animated Point */}
          <circle
            cx={currentX}
            cy={currentY}
            r="12"
            fill="#f59e0b"
            opacity="0.25"
            className="animate-ping"
          />
          <circle
            cx={currentX}
            cy={currentY}
            r="6.5"
            fill="#fbbf24"
            stroke="#ffffff"
            strokeWidth="2"
            filter="url(#glowPoint)"
          />

          {/* Operating Point Badge */}
          <g transform={`translate(${Math.min(width - padding.right - 140, currentX + 12)}, ${Math.max(padding.top + 15, currentY - 30)})`}>
            <rect
              width="135"
              height="36"
              rx="4"
              fill="#0f172a"
              stroke="#fbbf24"
              strokeWidth="1"
              opacity="0.95"
            />
            <text x="6" y="14" fill="#fbbf24" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
              Punto Operativo Actual
            </text>
            <text x="6" y="27" fill="#e2e8f0" fontSize="8" fontFamily="monospace">
              NOₓ: {noxPpb} | VOC: {vocPpbC} ppbC
            </text>
          </g>
        </svg>
      </div>

      {/* Numerical Synthesis Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[9.5px] font-mono bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
        <ScientificTooltip
          position="top"
          title="Potencial Fotoquímico Máximo de O₃"
          formula="[O_3]_{\max} = f([NO_x]_0, [VOC]_0, J_{NO_2})"
          normative="Directiva (UE) 2024/2881 (Valor Objetivo 120 µg/m³ octohorario; OMS 100 µg/m³)"
          content={`Concentración pico de ozono troposférico (${maxO3Ppb.toFixed(1)} ppb ≈ ${(maxO3Ppb * 2.0).toFixed(0)} µg/m³ a 293 K y 1013 hPa) generada en la pluma urbana advectada bajo irradiancia solar activa.`}
        >
          <div className="space-y-0.5 cursor-help">
            <span className="text-slate-400 block">Máximo Potencial O₃:</span>
            <span className="text-amber-400 font-bold text-xs flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              {maxO3Ppb.toFixed(1)} ppb ({(maxO3Ppb * 2.0).toFixed(0)} µg/m³)
            </span>
          </div>
        </ScientificTooltip>

        <ScientificTooltip
          position="top"
          title="Cociente Reactivo Carbono-Nitrógeno (VOC/NOₓ)"
          formula="R_{C/N} = \frac{\sum_i N_{C,i}[VOC_i]_{\text{ppb}}}{[NO + NO_2]_{\text{ppb}}}"
          normative="Dodge (1977) EKMA Ridge Line (R* ≈ 8.0 ppbC/ppb)"
          content={`Razón instantánea entre Carbono Orgánico Volátil reactivo (${vocPpbC} ppbC) y Óxidos de Nitrógeno (${noxPpb} ppb). La línea de cresta (≈ ${optimumRatio ? optimumRatio.toFixed(1) : '8.0'}:1) marca la máxima eficiencia cuántica de propagación de radicales peroxilo RO₂•.`}
        >
          <div className="space-y-0.5 cursor-help">
            <span className="text-slate-400 block">Razón VOC/NOₓ Actual:</span>
            <span className="text-sky-400 font-bold text-xs flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-sky-400" />
              {(vocPpbC / Math.max(1, noxPpb)).toFixed(2)} : 1 (Cresta ~ {optimumRatio ? optimumRatio.toFixed(1) : '8'}:1)
            </span>
          </div>
        </ScientificTooltip>

        <ScientificTooltip
          position="top"
          title="Partición Gas-Partícula de Pankow (SOA)"
          formula="Y_{\text{SOA}} = M_o \sum_i \frac{\alpha_i K_{om,i}}{1 + K_{om,i} M_o} \Delta\text{ROG}"
          normative="Pankow (1994) Atmos. Environ. • Odum et al. (1996) Volatility Basis Set (VBS)"
          content={`Rendimiento de Aerosol Orgánico Secundario (${effectiveSoaYield.toFixed(2)} µg/m³) formado por oxidación fotoquímica de monoterpenos, isopreno y aromáticos antropogénicos y su condensación sobre masa orgánica preexistente (M₀).`}
        >
          <div className="space-y-0.5 cursor-help">
            <span className="text-slate-400 block">Rendimiento SOA Pankow:</span>
            <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              {effectiveSoaYield.toFixed(2)} µg/m³
            </span>
          </div>
        </ScientificTooltip>
      </div>
    </div>
  );
}
