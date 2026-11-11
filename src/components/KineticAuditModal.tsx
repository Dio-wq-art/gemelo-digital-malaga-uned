import React from 'react';
import { motion } from 'motion/react';
import { 
  Workflow, 
  ChevronRight, 
  Zap, 
  Wind, 
  Building2, 
  Atom, 
  Leaf, 
  FlaskConical,
  Activity,
  ShieldCheck,
  Search,
  Database,
  ArrowRight,
  Calculator,
  Info
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { useActivePoint } from '../context/ActivePointContext';
import { ScientificTooltip } from './ScientificTooltip';

export interface KineticAuditModalProps {
  onClose: () => void;
}

export const KineticAuditModal: React.FC<KineticAuditModalProps> = ({ onClose }) => {
  const activePointCtx = useActivePoint();
  
  if (!activePointCtx) return null;
  
  const { activePoint, assimilation, data, result } = activePointCtx;
  const c = result?.cinetica_quimica;

  return (
    <DraggableWindow
      title="Auditoría de Trazabilidad Física (Kinetic Audit)"
      onClose={onClose}
      defaultCollapsed={true}
      className="w-full max-w-4xl"
      showActivePointBanner={true}
    >
      <div className="p-4 space-y-6 font-mono text-[11px] text-slate-300">
        
        {/* Intro Doctrinal */}
        <div className="bg-emerald-950/20 border-l-2 border-emerald-500/50 p-3 text-[10px] italic leading-relaxed text-emerald-100/80">
          "La trazabilidad física garantiza que cada dato asimilado sea el resultado de una cadena determinista de ecuaciones cinéticas, eliminando la opacidad de los modelos estocásticos. Este log constituye la base de evidencia metodológica para la defensa de la tesis doctoral."
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Section 1: Morfodinámica */}
          <section className="space-y-3 bg-slate-900/40 p-3 rounded-sm border border-slate-800/50">
            <div className="flex items-center justify-between border-b border-amber-900/30 pb-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                <Building2 className="w-3.5 h-3.5" />
                <span>1. Morfodinámica (Oke 1987)</span>
              </div>
              <ScientificTooltip
                topic="canyon_vortex_recirculation"
                title="Morfodinámica de Cañones Urbanos (Oke 1987)"
              />
            </div>
            
            <div className="space-y-2.5">
              <div className="flex justify-between items-center bg-black/30 p-2 rounded-xs border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1">
                  <span>Relación de Aspecto (H/W):</span>
                  <ScientificTooltip
                    title="Aspect Ratio H/W"
                    content="Cociente entre la altura media del cañón y su anchura. Condiciona la formación del vórtice cerrado de recirculación."
                  />
                </span>
                <span className="text-amber-300 font-bold">{assimilation.aspectRatioHw}</span>
              </div>
              
              <div className="flex justify-between items-center bg-black/30 p-2 rounded-xs border border-slate-800">
                <span className="text-slate-400">Régimen de Flujo:</span>
                <span className={`font-bold px-1.5 py-0.5 rounded-xs text-[9px] ${
                  assimilation.aspectRatioHw >= 0.65 ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                  assimilation.aspectRatioHw >= 0.35 ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {assimilation.aspectRatioHw >= 0.65 ? 'SKIMMING FLOW (OKE)' : 
                   assimilation.aspectRatioHw >= 0.35 ? 'WAKE INTERFERENCE' : 'ISOLATED ROUGHNESS'}
                </span>
              </div>

              <div className="bg-slate-950/80 p-2 rounded-xs border border-slate-800 space-y-1">
                <div className="text-[9px] text-cyan-400 font-bold">Eq: f_canyon = 1 + 1.35(H/W)¹·²⁵</div>
                <div className="text-[8.5px] text-slate-400 leading-tight">
                  Factor de retención vortical que amortigua la ventilación horizontal cruzada por fricción geométrica.
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Micrometeorología */}
          <section className="space-y-3 bg-slate-900/40 p-3 rounded-sm border border-slate-800/50">
            <div className="flex items-center justify-between border-b border-sky-900/30 pb-1.5">
              <div className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider text-[10px]">
                <Wind className="w-3.5 h-3.5" />
                <span>2. Micromet. (Monin-Obukhov)</span>
              </div>
              <ScientificTooltip
                topic="monin_obukhov_stability"
                title="Teoría de Similitud de Monin-Obukhov (MOST)"
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center bg-black/30 p-2 rounded-xs border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1">
                  <span>Estabilidad (Pasquill-Gifford):</span>
                  <ScientificTooltip
                    title="Clase de Estabilidad Pasquill-Gifford"
                    content="Clasificación de la turbulencia térmica y mecánica atmosférica (A: Muy Inestable hasta F: Muy Estable)."
                  />
                </span>
                <span className="text-sky-300 font-bold">{result?.estabilidad_pg || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between items-center bg-black/30 p-2 rounded-xs border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1">
                  <span>Altura PBL (Zi):</span>
                  <ScientificTooltip
                    title="Capa Límite Planetaria (PBL Height, Zi)"
                    content="Espesor de la capa de mezcla convectiva/mecánica donde se confinan las emisiones urbanas."
                  />
                </span>
                <span className="text-sky-300 font-bold">{c?.pbl_height_m} m</span>
              </div>

              <div className="bg-slate-950/80 p-2 rounded-xs border border-slate-800 space-y-1">
                <div className="text-[9px] text-cyan-400 font-bold">Eq: u(z) = (u*/κ) · [ln((z-d)/z₀) - ψ_m]</div>
                <div className="text-[8.5px] text-slate-400 leading-tight">
                  Perfil de viento logarítmico corregido por el criterio de estabilidad Ri de Richardson.
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Cinética Química */}
          <section className="space-y-3 bg-slate-900/40 p-3 rounded-sm border border-slate-800/50">
            <div className="flex items-center justify-between border-b border-yellow-900/30 pb-1.5">
              <div className="flex items-center gap-2 text-yellow-400 font-bold uppercase tracking-wider text-[10px]">
                <Atom className="w-3.5 h-3.5" />
                <span>3. Cinética de Leighton (PSS)</span>
              </div>
              <ScientificTooltip
                topic="leighton_photostationary"
                title="Estado Fotoestacionario de Leighton (PSS)"
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center bg-black/30 p-2 rounded-xs border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1">
                  <span>Fotólisis J(NO₂):</span>
                  <ScientificTooltip
                    title="Tasa de Fotólisis J(NO2)"
                    content="Frecuencia de disociación fotolítica del NO₂ inducida por radiación actínica solar UV (λ < 420 nm)."
                    formula="NO_2 + h\nu \xrightarrow{J(NO_2)} NO + O(^3P)"
                  />
                </span>
                <span className="text-yellow-300 font-bold">{result?.j_no2} s⁻¹</span>
              </div>
              
              <div className="flex justify-between items-center bg-black/30 p-2 rounded-xs border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1">
                  <span>Ratio de Leighton (Φ):</span>
                  <ScientificTooltip
                    title="Ratio de Desviación de Leighton (Φ)"
                    content="Valor Φ = (J_NO2 * [NO2]) / (k3 * [O3] * [NO]). Si Φ ≈ 1 indica equilibrio puro; si Φ > 1 evidencia oxidación suplementaria por radicales peroxilo (RO2/HO2)."
                  />
                </span>
                <span className={`font-bold ${Math.abs((c?.ratio_leighton || 1) - 1) > 0.2 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {c?.ratio_leighton}
                </span>
              </div>

              <div className="bg-slate-950/80 p-2 rounded-xs border border-slate-800 space-y-1">
                <div className="text-[9px] text-yellow-400 font-bold">Eq: [O₃]_pss = (J_NO₂ · [NO₂]) / (k₃ · [NO])</div>
                <div className="text-[8.5px] text-slate-400 leading-tight">
                  Desviación Φ &gt; 1 indica sabotaje químico por radicales peróxilo (RO₂•) en la bahía de Málaga.
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Deposición y Remoción */}
          <section className="space-y-3 bg-slate-900/40 p-3 rounded-sm border border-slate-800/50">
            <div className="flex items-center justify-between border-b border-emerald-900/30 pb-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                <Leaf className="w-3.5 h-3.5" />
                <span>4. Deposición Seca (Wesely)</span>
              </div>
              <ScientificTooltip
                topic="wesely_dry_deposition"
                title="Deposición Seca Atmosférica (Wesely 1989)"
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center bg-black/30 p-2 rounded-xs border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1">
                  <span>Velocidad Dep. (v_d):</span>
                  <ScientificTooltip
                    title="Velocidad de Deposición Seca (v_d)"
                    content="Inverso de la suma de resistencias en serie (Ra + Rb + Rc) que cuantifica la captura del gas por superficies foliares y urbanas."
                    formula="v_d = \frac{1}{R_a + R_b + R_c}"
                  />
                </span>
                <span className="text-emerald-300 font-bold">{result?.vd} m/s</span>
              </div>
              
              <div className="flex justify-between items-center bg-black/30 p-2 rounded-xs border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1">
                  <span>Remoción NO₂:</span>
                  <ScientificTooltip
                    title="Masa Neta de NO₂ Removida"
                    content="Flujo de absorción fisiológica foliar integrado sobre el arbolado viario del cañón activo en kg/día."
                  />
                </span>
                <span className="text-emerald-300 font-bold">{c?.remocion_no2_kg_dia} kg/día</span>
              </div>

              <div className="bg-slate-950/80 p-2 rounded-xs border border-slate-800 space-y-1">
                <div className="text-[9px] text-emerald-400 font-bold">Eq: v_d = 1 / (R_a + R_b + R_c)</div>
                <div className="text-[8.5px] text-slate-400 leading-tight">
                  Circuito de resistencias de Wesely (1989) modulado por apertura estomática foliar f_light(Rs).
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer: Traceability ID */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-[9px] text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3 h-3 text-emerald-500/70" />
            <span>METODOLOGÍA CERTIFICADA EMEP/EEA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Database className="w-3 h-3" />
            <span className="font-mono">LINAGE: W3C PROV-O / GD-MLG-PHD-2026</span>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};
