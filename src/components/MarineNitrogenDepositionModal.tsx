import React, { useState } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import { useActivePoint } from '../context/ActivePointContext';
import { 
  Waves, 
  Droplets, 
  ShieldCheck, 
  Download, 
  Activity, 
  Thermometer, 
  Wind, 
  Anchor, 
  Fish, 
  Compass, 
  Sparkles,
  TrendingUp
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { computeMarineNitrogenDeposition } from '../lib/marineNitrogenDeposition';

interface MarineNitrogenDepositionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MarineNitrogenDepositionModal: React.FC<MarineNitrogenDepositionModalProps> = ({
  isOpen,
  onClose
}) => {
  const activeCtx = useActivePoint();
  const ambientTemp = activeCtx?.assimilation?.temperatureC ?? 22.0;
  const [sst, setSst] = useState<number>(20.5);

  React.useEffect(() => {
    const dynamicSst = Number(Math.max(14.0, Math.min(27.0, ambientTemp * 0.85 + 1.8)).toFixed(1));
    setSst(dynamicSst);
  }, [ambientTemp]);

  if (!isOpen) return null;

  const ambientNO2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? 34.0;
  const ambientPM25 = activeCtx?.assimilation?.pm25UgM3 ?? 14.5;
  const windSpeedKmh = activeCtx?.assimilation?.windSpeedKmh ?? 14.0;

  const result = computeMarineNitrogenDeposition({
    ambientNO2UgM3: ambientNO2,
    ambientPM25UgM3: ambientPM25,
    windSpeedKmh,
    seaSurfaceTemperatureC: sst
  });

  const handleExportCSV = () => {
    const headers = 'Especie,Formula,Concentracion_ug_m3,Ra_s_m,Rb_s_m,Rc_s_m,Vd_cm_s,Flujo_ug_m2_s,Aporte_N_kg_ha_ano\n';
    const rows = result.speciesResults.map(s => 
      `"${s.speciesName}",${s.formula},${s.ambientConcentrationUgM3},${s.ra_sM},${s.rb_sM},${s.rc_sM},${s.depositionVelocityCmS},${s.depositionFluxUgM2S},${s.nitrogenFluxKgPerHaYear}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ieo_bahia_malaga_deposicion_nitrogeno_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = result.speciesResults.map(s => ({
    name: s.formula,
    flujoN: s.nitrogenFluxKgPerHaYear,
    vd: s.depositionVelocityCmS
  }));

  const COLORS = ['#38bdf8', '#fbbf24', '#34d399'];

  return (
    <DraggableWindow
      title="DEPOSICIÓN SECA EN LÁMINA MARINA Y APORTE DE NITRÓGENO AL IEO-CSIC"
      subtitle="Flujo Atmosférico de Nitrógeno Reactivo sobre la Bahía de Málaga (Slinn & Slinn 1980 / Charnock)"
      icon={<Waves className="w-5 h-5 text-cyan-400" />}
      badge={
        <span className="text-[8.5px] bg-cyan-950 text-cyan-300 border border-cyan-600 px-1.5 py-0.2 font-mono font-bold">
          AIR-SEA INTERFACE • IEO-CSIC
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[92vw] max-w-4xl max-h-[85vh]"
      headerColorClass="text-cyan-400"
      borderColorClass="border-cyan-500/80"
    >
      <div className="flex flex-col gap-3 font-mono text-xs p-3 text-slate-200 bg-slate-950">
        {/* Banner Unificado del Punto Activo */}
        <ActivePointSyncBanner compact={true} />

        {/* Banner Metodológico */}
        <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-blue-950/80 border border-cyan-500/60 p-3 rounded flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <div className="text-xs font-bold text-cyan-300 uppercase flex items-center gap-2">
              <Anchor className="w-4 h-4 text-cyan-400" />
              <span>{result.bayName} • {result.ieoStationName}</span>
              <span className={`text-[8.5px] font-mono px-1.5 py-0.5 border ${result.eutrophicationRiskLevel === 'ALTO_RIESGO_EUTROFIZACION' ? 'bg-amber-950 text-amber-300 border-amber-600' : 'bg-emerald-950 text-emerald-300 border-emerald-600'}`}>
                {result.eutrophicationRiskLevel}
              </span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-snug">
              Cuantificación analítica de la fertilización atmosférica por nitrógeno reactivo (HNO₃, NO₂ y p-NO₃⁻) depositado en las aguas costeras de Málaga mediante el circuito de resistencias en serie acoplado a la rugosidad de Charnock del oleaje.
            </p>
          </div>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar la matriz de resistencias y flujos de deposición al medio marino en formato CSV.">
            <button
              onClick={handleExportCSV}
              className="shrink-0 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[10.5px] uppercase font-bold py-2 px-3.5 rounded border border-cyan-400 flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>EXPORTAR FAIR CSV</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Control de Temperatura Superficial del Mar SST */}
        <div className="bg-slate-900 p-3 border border-slate-800 rounded space-y-2">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
              Temperatura Superficial del Agua del Mar SST (Boya REDCOS):
              <ScientificTooltip
                title="Solubilidad de Henry de Gases Reactivos en Agua de Mar"
                formula="H_{\text{eff}}(T_{\text{SST}}) = H^\circ \exp\left[\frac{-\Delta_{\text{sol}}H}{R}\left(\frac{1}{T_{\text{SST}}} - \frac{1}{298.15}\right)\right]"
                normative="Sander (2015) ACP • Boya Mareográfica REDCOS Puertos del Estado"
                content="La temperatura superficial del mar (SST) gobierna la constante de ley de Henry efectiva, la viscosidad cinemática del agua salada y la resistencia de transferencia interfacial r_c sobre la lámina marina."
              />
            </span>
            <span className="text-cyan-300 font-bold text-sm">{sst.toFixed(1)} °C</span>
          </div>
          <input
            type="range"
            min="14.0"
            max="27.0"
            step="0.5"
            value={sst}
            onChange={(e) => setSst(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-400">
            <span>14.0 °C (Invierno Marino)</span>
            <span>20.5 °C (Media Anual Bahía)</span>
            <span>27.0 °C (Pico Canicular Estival)</span>
          </div>
        </div>

        {/* Indicadores Clave de Eutrofización */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <ScientificTooltip
            position="top"
            title="Flujo Anual Integrado de Nitrógeno Reactivo (N_r)"
            formula="F_{\text{N}} = \sum_{i \in \{\text{HNO}_3, \text{NO}_2, \text{NO}_3^-\}} \frac{M_{\text{N}}}{M_i} \, v_{d,i} \, C_i"
            normative="Directiva Marco Estrategia Marina (Descriptor D5 Eutrofización) • OSPAR/ Barcelona Convention"
            content={`Aporte total de nitrógeno biodisponible (${result.totalReactiveNDepositionKgHaYear} kg N ha⁻¹ año⁻¹) que fertiliza directamente el fitoplancton (diatomeas y dinoflagelados) en la plataforma continental de Málaga.`}
          >
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">Depósito Total N</span>
              <span className="text-lg font-bold text-cyan-400 font-mono">
                {result.totalReactiveNDepositionKgHaYear} kg N
              </span>
              <span className="text-[9px] text-slate-400 block">por hectárea y año</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Velocidad de Fricción en Capa Límite Marina (u*_sea)"
            formula="u_{*,\text{sea}} = \sqrt{C_D(U_{10})}\, U_{10}"
            normative="Smith (1988) J. Geophys. Res. • Fairall et al. (2003) COARE 3.0"
            content={`Velocidad de fricción aerodinámica sobre el oleaje (${result.frictionVelocityMarineUStar} m/s) que controla la resistencia turbulenta r_a y cuasi-laminar r_b.`}
          >
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">Fricción Marina u*</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">{result.frictionVelocityMarineUStar} m/s</span>
              <span className="text-[9px] text-slate-400 block">Arrastre Smith (1988)</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Longitud de Rugosidad Hidrodinámica de Charnock (z₀)"
            formula="z_0 = \alpha_c \frac{u_*^2}{g} + \frac{0.11\,\nu}{u_*}, \quad \alpha_c = 0.018"
            normative="Charnock (1955) Q. J. R. Meteorol. Soc."
            content={`Rugosidad dinámica de la superficie del mar (${result.charnockRoughnessZ0M} m) acoplada al desarrollo de ondas gravitatorias-capilares por el viento costero.`}
          >
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">Rugosidad Charnock</span>
              <span className="text-lg font-bold text-amber-400 font-mono">{result.charnockRoughnessZ0M} m</span>
              <span className="text-[9px] text-slate-400 block">α = 0.018 (oleaje)</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Fuerza Iónica y Salinidad Práctica (PSS-78)"
            formula="I_{\text{ion}} \approx 0.0199 \times S_{\text{PSU}} \quad (\text{mol kg}^{-1})"
            normative="UNESCO PSS-78 • Red RADMED IEO-CSIC"
            content={`Salinidad práctica (${result.seaSalinityPsu} PSU) y pH superficial (${result.seawaterPh}) característicos de la mezcla Atlántica-Mediterránea en el giro norte del Mar de Alborán.`}
          >
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">Salinidad & pH</span>
              <span className="text-sm font-bold text-indigo-300 font-mono block">
                {result.seaSalinityPsu} PSU • pH {result.seawaterPh}
              </span>
              <span className="text-[9px] text-slate-400 block">Alborán Muelle San Andrés</span>
            </div>
          </ScientificTooltip>
        </div>

        {/* Gráfico y Tabla Comparativa por Especie */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-black/90 p-3 border border-slate-800 rounded space-y-2">
            <span className="text-xs font-bold text-cyan-300 block">
              Aporte de Nitrógeno Reactivo por Especie (kg N/ha·año)
            </span>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#38bdf8" tick={{ fontSize: 9 }} />
                  <RechartsTooltip cursor={{ fill: 'rgba(56, 189, 248, 0.1)' }} />
                  <Bar dataKey="flujoN" name="kg N/ha·año" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded p-2">
            <span className="text-xs font-bold text-slate-200 block mb-1">
              Desglose Resistivo (Slinn & Slinn 1980 / Wesely 1989)
            </span>
            <table className="w-full text-left text-[9.5px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-1 px-1">Especie</th>
                  <th className="py-1 px-1">Ra</th>
                  <th className="py-1 px-1">Rb</th>
                  <th className="py-1 px-1">Rc</th>
                  <th className="py-1 px-1 text-cyan-300">vd (cm/s)</th>
                </tr>
              </thead>
              <tbody>
                {result.speciesResults.map((sp, idx) => (
                  <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                    <td className="py-1 px-1 font-bold text-slate-200">{sp.formula}</td>
                    <td className="py-1 px-1 text-slate-400">{sp.ra_sM}</td>
                    <td className="py-1 px-1 text-slate-400">{sp.rb_sM}</td>
                    <td className="py-1 px-1 text-amber-300">{sp.rc_sM}</td>
                    <td className="py-1 px-1 text-cyan-300 font-bold">{sp.depositionVelocityCmS}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-[8.5px] text-slate-400 mt-2">
              * El HNO₃ presenta Rc ≈ 5 s/m (deposición ultrarrápida en agua salada), siendo el mayor vector de eutrofización costera.
            </div>
          </div>
        </div>

        {/* Diagnóstico Doctoral */}
        <div className="p-3 bg-cyan-950/30 border border-cyan-600/40 rounded space-y-1">
          <span className="text-[10.5px] font-bold text-cyan-300 uppercase flex items-center gap-1.5">
            <Fish className="w-4 h-4 text-cyan-400" />
            <span>Conclusión Ecológica y Oceanográfica para la Tesis</span>
          </span>
          <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
            {result.doctoralConclusion}
          </p>
        </div>
      </div>
    </DraggableWindow>
  );
};
