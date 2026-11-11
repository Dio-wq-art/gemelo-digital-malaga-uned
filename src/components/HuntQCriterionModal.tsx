import React, { useState } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import { useActivePoint } from '../context/ActivePointContext';
import { 
  Wind, 
  RotateCw, 
  Layers, 
  ShieldCheck, 
  Download, 
  Activity, 
  Sliders, 
  AlertTriangle, 
  Compass, 
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { computeHuntQCriterion } from '../lib/huntQCriterion';

interface HuntQCriterionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HuntQCriterionModal: React.FC<HuntQCriterionModalProps> = ({
  isOpen,
  onClose
}) => {
  const activeCtx = useActivePoint();
  const activeHw = activeCtx?.assimilation?.aspectRatioHw ?? 1.25;
  const [canyonHW, setCanyonHW] = useState<number>(activeHw);

  React.useEffect(() => {
    setCanyonHW(Number(Math.max(0.3, Math.min(2.5, activeHw)).toFixed(2)));
  }, [activeHw]);

  if (!isOpen) return null;

  const streetName = activeCtx?.activePoint?.name || activeCtx?.activePoint?.nearestStreetName || 'Calle Marqués de Larios';
  const windSpeedKmh = activeCtx?.assimilation?.windSpeedKmh ?? 14.0;
  const windDirectionDeg = activeCtx?.assimilation?.windDirectionDeg ?? 135;
  const pedestrianNO2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? 36.5;

  const analysis = computeHuntQCriterion({
    streetName,
    canyonHW,
    windSpeedKmh,
    windDirectionDeg,
    pedestrianNO2UgM3: pedestrianNO2
  });

  const handleExportCSV = () => {
    const headers = 'Altura_m,Q_s2,Norma_Rotacion_Omega_s1,Norma_Cizalla_S_s1,Regimen,Intensidad_Vortice_Pct,Tiempo_Residencia_s\n';
    const rows = analysis.verticalProfile.map(p => 
      `${p.heightM},${p.Q_sMinus2},${p.omegaNormSMinus1},${p.strainNormSMinus1},${p.regime},${p.vortexIntensityPct},${p.residenceTimeSec}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hunt_q_criterion_${streetName.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="CRITERIO Q DE HUNT: ESTRUCTURA COHERENTE DE VÓRTICES URBANOS"
      subtitle="Invariante Tensorial de Galilei Q = 1/2(||Ω||² - ||S||²) & Atrapamiento de Contaminantes"
      icon={<RotateCw className="w-5 h-5 text-sky-400" />}
      badge={
        <span className="text-[8.5px] bg-sky-950 text-sky-300 border border-sky-600 px-1.5 py-0.2 font-mono font-bold">
          HUNT Q-CRITERION • VORTICITY TENSOR
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[92vw] max-w-4xl max-h-[85vh]"
      headerColorClass="text-sky-400"
      borderColorClass="border-sky-500/80"
    >
      <div className="flex flex-col gap-3 font-mono text-xs p-3 text-slate-200 bg-slate-950">
        {/* Banner Unificado del Punto Activo */}
        <ActivePointSyncBanner compact={true} />

        {/* Banner Metodológico */}
        <div className="bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border border-sky-500/60 p-3 rounded flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <div className="text-xs font-bold text-sky-300 uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Punto Activo: {streetName} (H/W: {canyonHW.toFixed(2)})</span>
              <span className={`text-[8.5px] font-mono px-1.5 py-0.5 border ${analysis.canyonTrapRisk === 'ALTO_ATRAPAMIENTO' ? 'bg-rose-950 text-rose-300 border-rose-600' : 'bg-emerald-950 text-emerald-300 border-emerald-600'}`}>
                {analysis.canyonTrapRisk === 'ALTO_ATRAPAMIENTO' ? '⚠️ ALTO ATRAPAMIENTO MECÁNICO' : 'VENTILACIÓN ADECUADA'}
              </span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-snug">
              El Criterio Q de Hunt et al. (1988) es un invariante de Galilei que cuantifica cuándo la rotación del fluido (||Ω||) supera la deformación por cizalla turbulenta (||S||), creando vórtices estables que confinan el NO₂ vehicular en acera.
            </p>
          </div>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar perfil vertical de tensores y valores Q en formato abierto CSV.">
            <button
              onClick={handleExportCSV}
              className="shrink-0 bg-sky-600 hover:bg-sky-500 text-slate-950 text-[10.5px] uppercase font-bold py-2 px-3.5 rounded border border-sky-400 flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>EXPORTAR FAIR CSV</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Control de Relación Altura/Anchura (H/W) */}
        <div className="bg-slate-900 p-3 border border-slate-800 rounded space-y-2">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              Relación Geométrica del Cañón H/W (Oke 1987):
              <ScientificTooltip
                title="Clasificación de Regímenes de Flujo en Cañones (Oke 1987)"
                formula="H/W > 0.65 \implies \text{Skimming Flow (Vórtice Recirculante Aislado)}"
                normative="Oke (1987) Boundary Layer Climates • Harman et al. (2004)"
                content="Controla la relación de aspecto morfológica entre la altura media de cornisa (H) y el ancho de vía (W). Sincronizado automáticamente con la geometría 3D OSM del punto activo."
              />
            </span>
            <span className="text-sky-300 font-bold text-sm">{canyonHW.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.30"
            max="2.50"
            step="0.05"
            value={canyonHW}
            onChange={(e) => setCanyonHW(parseFloat(e.target.value))}
            className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-400">
            <span>0.30 (Avenida Abierta)</span>
            <span>1.00 (Cañón Simétrico Oke)</span>
            <span>2.50 (Callejón Estrecho Centro Histórico)</span>
          </div>
        </div>

        {/* Indicadores Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <ScientificTooltip
            position="top"
            title="Segundo Invariante del Tensor Gradiente de Velocidad (Q)"
            formula="Q = \frac{1}{2}\left(\|\mathbf{\Omega}\|_F^2 - \|\mathbf{S}\|_F^2\right) = -\frac{1}{2}\frac{\partial u_i}{\partial x_j}\frac{\partial u_j}{\partial x_i}"
            normative="Hunt, Wray & Moin (1988) CTR Stanford"
            content={`Valor pico del invariante Q (${analysis.maxQValue} s⁻²). Cuando Q > 0, la enstrofia rotacional local supera la disipación por deformación extensional, identificando un vórtice coherente que recircula contaminantes.`}
          >
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">Pico Q Invariante</span>
              <span className={`text-lg font-bold font-mono ${analysis.maxQValue > 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                {analysis.maxQValue > 0 ? `+${analysis.maxQValue}` : analysis.maxQValue} s⁻²
              </span>
              <span className="text-[9px] text-slate-400 block">Q {'>'} 0: Rotación dominante</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Criterio λ₂ de Núcleo de Vórtice (Jeong & Hussain 1995)"
            formula="\lambda_2\left(\mathbf{S}^2 + \mathbf{\Omega}^2\right) < 0"
            normative="Jeong & Hussain (1995) J. Fluid Mech. 285, 69–94"
            content={`Segundo autovalor del tensor simétrico S² + Ω² (${analysis.minLambda2Value} s⁻²). Detecta mínimos locales de presión dinámica inducidos por rotación vortical pura en el plano transversal del cañón.`}
          >
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">Mínimo λ₂ Jeong & Hussain</span>
              <span className={`text-lg font-bold font-mono ${analysis.minLambda2Value < 0 ? 'text-purple-400' : 'text-slate-400'}`}>
                {analysis.minLambda2Value} s⁻²
              </span>
              <span className="text-[9px] text-slate-400 block">λ₂ {'<'} 0: Núcleo de vórtice 3D</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Tiempo de Residencia Aerodinámico en Acera (τ_res)"
            formula="\tau_{\text{res}} = \frac{H}{w_{\text{ent}}(u_*, H/W)}"
            normative="Soulhac et al. (2011) Atmos. Environ. (SIRANE)"
            content="Escala temporal característica de atrapamiento de una parcela de aire emitida por el tubo de escape antes de ser ventilada a través de la capa de cizalla de tejado."
          >
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">Tiempo Residencia (τ)</span>
              <span className="text-lg font-bold text-rose-400 font-mono">
                {analysis.verticalProfile[1]?.residenceTimeSec ?? 35} s
              </span>
              <span className="text-[9px] text-slate-400 block">A cota peatonal 1.8m</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Velocidad de Fricción de von Kármán (u*)"
            formula="u_* = \frac{\kappa \, U_{\text{ref}}}{\ln\left(\frac{z_{\text{ref}} - d}{z_0}\right)}"
            normative="Monin & Obukhov (1954) • κ = 0.40"
            content={`Velocidad de escala de transferencia turbulenta de cantidad de movimiento (${analysis.frictionVelocityUStar} m/s) en el límite superior del dosel urbano.`}
          >
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">Fricción u*</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">{analysis.frictionVelocityUStar} m/s</span>
              <span className="text-[9px] text-slate-400 block">Velocidad de cizalladura</span>
            </div>
          </ScientificTooltip>
        </div>

        {/* Gráfico de Perfil Vertical de Q, Rotación, Cizalla y Lambda-2 */}
        <div className="bg-black/90 p-3 border border-slate-800 rounded space-y-2">
          <span className="text-xs font-bold text-sky-300 block">
            Perfil Vertical: Invariante Q(z) vs Autovalor λ₂(z) (Jeong & Hussain) y Tensores ||Ω||, ||S||
          </span>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analysis.verticalProfile} margin={{ top: 10, right: 15, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="heightM" stroke="#94a3b8" tick={{ fontSize: 9 }} label={{ value: 'Altura sobre el Suelo z (m)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }} />
                <YAxis stroke="#38bdf8" tick={{ fontSize: 9 }} label={{ value: 'Magnitud (s⁻¹ / s⁻²)', angle: -90, position: 'insideLeft', fill: '#38bdf8', fontSize: 10 }} />
                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Umbral Crítico (0.0)', fill: '#ef4444', fontSize: 9 }} />
                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                <Line type="monotone" dataKey="Q_sMinus2" name="Invariante Q (s⁻²)" stroke="#38bdf8" strokeWidth={2.5} dot={true} />
                <Line type="monotone" dataKey="lambda2_sMinus2" name="Autovalor λ₂ (s⁻²)" stroke="#c084fc" strokeWidth={2} dot={true} />
                <Line type="monotone" dataKey="omegaNormSMinus1" name="Rotación ||Ω|| (s⁻¹)" stroke="#fbbf24" strokeWidth={1.2} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="strainNormSMinus1" name="Deformación ||S|| (s⁻¹)" stroke="#34d399" strokeWidth={1.2} dot={false} strokeDasharray="2 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diagnóstico Doctoral */}
        <div className="p-3 bg-sky-950/30 border border-sky-600/40 rounded space-y-1">
          <span className="text-[10.5px] font-bold text-sky-300 uppercase flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <span>Diagnóstico Mecanístico para la Defensa Oral</span>
          </span>
          <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
            {analysis.doctoralConclusion}
          </p>
        </div>
      </div>
    </DraggableWindow>
  );
};
