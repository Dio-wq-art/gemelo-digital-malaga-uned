import React, { useMemo } from 'react';
import { ScientificTooltip } from './ScientificTooltip';
import { Atom, ShieldCheck, Compass, Info, Flame, Sun } from 'lucide-react';

export interface PhotochemicalTernaryDiagramProps {
  noxPpb: number;
  vocPpbC: number;
  o3Ppb: number;
  no2Ppb?: number;
  locationName?: string;
  className?: string;
}

/**
 * Diagrama Ternario Fotoquímico (NOx - VOC - Ox)
 * Representa en coordenadas baricéntricas triangulares equiláteras
 * la posición del sistema fotoquímico urbano para determinar
 * la sensibilidad del régimen (VOC-limited vs Transition vs NOx-limited).
 */
export const PhotochemicalTernaryDiagram: React.FC<PhotochemicalTernaryDiagramProps> = ({
  noxPpb,
  vocPpbC,
  o3Ppb,
  no2Ppb,
  locationName = 'Málaga (Centro Histórico)',
  className = ''
}) => {
  // Proporciones normalizadas al 100%
  const total = Math.max(1, noxPpb + vocPpbC + o3Ppb);
  const fracNOx = (noxPpb / total) * 100;
  const fracVOC = (vocPpbC / total) * 100;
  const fracO3 = (o3Ppb / total) * 100;

  // Régimen fotoquímico analítico basado en ratio VOC/NOx (ppbC / ppb)
  const vocNoxRatio = noxPpb > 0 ? vocPpbC / noxPpb : 10;
  const regime = vocNoxRatio < 4.5 
    ? { name: 'Régimen VOC-Limitado (Sensible a COVs)', color: 'text-amber-400', bg: 'bg-amber-950/70 border-amber-800/60', desc: 'La reducción de NOx incrementa el O₃ por menor titulación. Se deben abatir COVs (tráfico y disolventes).' }
    : vocNoxRatio > 8.0 
    ? { name: 'Régimen NOx-Limitado (Sensible a NOx)', color: 'text-sky-400', bg: 'bg-sky-950/70 border-sky-800/60', desc: 'La formación de O₃ está controlada por la disponibilidad de NOx. Abatir emisiones vehiculares reduce O₃.' }
    : { name: 'Zona de Transición Óptima (Sillman, 1999)', color: 'text-emerald-400', bg: 'bg-emerald-950/70 border-emerald-800/60', desc: 'Máxima eficiencia de producción neta P(O₃). Se requiere abatimiento coordinado VOC + NOx.' };

  // Geometría del triángulo equilátero en canvas SVG (400x340)
  // Vértice Superior (A): Ozono Ox (fracO3) en (200, 30)
  // Vértice Inferior Izquierdo (B): NOx (fracNOx) en (40, 310)
  // Vértice Inferior Derecho (C): VOC (fracVOC) en (360, 310)
  const Ax = 200, Ay = 30;
  const Bx = 40,  By = 310;
  const Cx = 360, Cy = 310;

  // Conversión de coordenadas baricéntricas (a = fracO3/100, b = fracNOx/100, c = fracVOC/100)
  const a = fracO3 / 100;
  const b = fracNOx / 100;
  const c = fracVOC / 100;

  const pointX = a * Ax + b * Bx + c * Cx;
  const pointY = a * Ay + b * By + c * Cy;

  return (
    <div className={`p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 font-mono ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Atom className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            Diagrama Ternario Fotoquímico (NOₓ - VOC - Oₓ)
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
            {locationName}
          </span>
        </div>

        <ScientificTooltip content="Diagnóstico del régimen de producción de ozono fotoquímico según las relaciones de concentración relativa de precursores (Sillman et al., 1999; Dodge, 1977).">
          <div className={`px-2 py-0.5 rounded border text-[10px] font-bold ${regime.bg} ${regime.color} cursor-help`}>
            {regime.name}
          </div>
        </ScientificTooltip>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* SVG Ternary Diagram */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="relative w-full max-w-[380px] bg-slate-900/80 p-2 rounded border border-slate-800 shadow-inner">
            <svg viewBox="0 0 400 340" className="w-full h-auto">
              <defs>
                {/* Gradiente del triángulo */}
                <radialGradient id="ternaryGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
                </radialGradient>
              </defs>

              {/* Triángulo base */}
              <polygon
                points={`${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}`}
                fill="url(#ternaryGlow)"
                stroke="#334155"
                strokeWidth="1.5"
              />

              {/* Zonas de régimen sombreadas */}
              {/* Zona VOC-limited (lado NOx alto, izquierda) */}
              <polygon
                points={`${Ax},${Ay} ${Bx},${By} ${(Ax + Bx) / 2 + 20},${(Ay + By) / 2 + 30}`}
                fill="#f59e0b"
                fillOpacity="0.08"
              />
              {/* Zona NOx-limited (lado VOC alto, derecha) */}
              <polygon
                points={`${Ax},${Ay} ${Cx},${Cy} ${(Ax + Cx) / 2 - 20},${(Ay + Cy) / 2 + 30}`}
                fill="#38bdf8"
                fillOpacity="0.08"
              />

              {/* Líneas de cuadrícula ternaria (Grid lines 20%, 40%, 60%, 80%) */}
              {[0.2, 0.4, 0.6, 0.8].map((t, idx) => {
                // Paralela a base (constante O3)
                const y1 = Ay + (By - Ay) * (1 - t);
                const x1 = Ax - (Ax - Bx) * (1 - t);
                const x2 = Ax + (Cx - Ax) * (1 - t);
                return (
                  <line
                    key={`o3-grid-${idx}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y1}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                );
              })}

              {/* Vértice Superior: O3 */}
              <text x={Ax} y={Ay - 10} fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="middle">
                Oₓ / O₃ ({fracO3.toFixed(1)}%)
              </text>
              {/* Vértice Inferior Izquierdo: NOx */}
              <text x={Bx - 10} y={By + 18} fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="start">
                NOₓ ({fracNOx.toFixed(1)}%)
              </text>
              {/* Vértice Inferior Derecho: VOC */}
              <text x={Cx + 10} y={By + 18} fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="end">
                VOC ({fracVOC.toFixed(1)}%)
              </text>

              {/* Líneas guía desde el punto activo a los vértices */}
              <line x1={pointX} y1={pointY} x2={Ax} y2={Ay} stroke="#34d399" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />
              <line x1={pointX} y1={pointY} x2={Bx} y2={By} stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />
              <line x1={pointX} y1={pointY} x2={Cx} y2={Cy} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />

              {/* Punto de Estado Activo Asimilado */}
              <circle cx={pointX} cy={pointY} r="7" fill="#10b981" fillOpacity="0.4" className="animate-ping" />
              <circle cx={pointX} cy={pointY} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Panel Diagnóstico y Fundamento de Tesis */}
        <div className="lg:col-span-5 space-y-2.5 text-xs">
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1.5">
            <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
              <span>Coordenadas Baricéntricas:</span>
              <span className="text-[10px] text-emerald-400 font-mono">Σ = 100%</span>
            </div>
            <div className="space-y-1 text-[10.5px]">
              <div className="flex justify-between text-slate-400">
                <span className="text-amber-300">NOₓ (Precursor Titulante):</span>
                <span className="font-bold text-slate-200">{noxPpb.toFixed(1)} ppb ({fracNOx.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span className="text-sky-300">VOC (Carbonos Reactivos):</span>
                <span className="font-bold text-slate-200">{vocPpbC.toFixed(1)} ppbC ({fracVOC.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span className="text-emerald-300">O₃ / Ox Fotostacionario:</span>
                <span className="font-bold text-slate-200">{o3Ppb.toFixed(1)} ppb ({fracO3.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1 text-slate-400">
                <span>Ratio VOC/NOₓ (ppbC/ppb):</span>
                <span className="font-bold text-purple-300">{vocNoxRatio.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              Implicación en Políticas ZBE / Mitigación:
            </span>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {regime.desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
