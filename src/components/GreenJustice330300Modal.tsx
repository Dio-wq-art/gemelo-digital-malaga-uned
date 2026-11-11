import React, { useState } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import { useActivePoint } from '../context/ActivePointContext';
import { 
  Trees, 
  ShieldCheck, 
  Download, 
  Activity, 
  Leaf, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  Eye, 
  HeartHandshake, 
  Compass,
  MapPin
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { computeGreenJusticeAnalysis } from '../lib/greenJustice330300';

interface GreenJustice330300ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GreenJustice330300Modal: React.FC<GreenJustice330300ModalProps> = ({
  isOpen,
  onClose
}) => {
  const activeCtx = useActivePoint();
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'compliant'>('all');

  if (!isOpen) return null;

  const activeNO2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? 35.0;
  const activePM25 = activeCtx?.assimilation?.pm25UgM3 ?? 14.8;

  const analysis = computeGreenJusticeAnalysis({
    ambientNO2UgM3: activeNO2,
    ambientPM25UgM3: activePM25
  });

  const handleExportCSV = () => {
    const headers = 'Distrito,Poblacion,Renta_Hogar_EUR,Dosel_Vegetal_Pct,M2_Verde_Hab,Arboles_Visibles,Distancia_Parque_M,Cumplimiento_3_30_300_Pct,IDV,ISV_Score,Captacion_NO2_kg_ano,Captacion_PM25_kg_ano,Estado\n';
    const rows = analysis.districts.map(d => 
      `"${d.districtName}",${d.population},${d.averageIncomeEurYear},${d.canopyCoverPct}%,${d.greenAreaM2PerCapita},${d.averageTreesVisibleCount},${d.distanceToGreenSpaceM},${d.rule330300CompliancePct}%,${d.greenDeprivationIndex},${d.socioGreenInjusticeScore},${d.annualPhytosphericNO2SinkKg},${d.annualPhytosphericPM25SinkKg},"${d.greenStatusClassification}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `justicia_verde_regla_3_30_300_malaga_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredDistricts = analysis.districts.filter(d => {
    if (filterType === 'critical') return d.greenStatusClassification === 'DESIERTO_VERDE_CRITICO';
    if (filterType === 'compliant') return d.greenStatusClassification === 'CUMPLE_REGLA_3_30_300';
    return true;
  });

  const chartData = analysis.districts.map(d => ({
    name: d.shortName,
    canopy: d.canopyCoverPct,
    income: d.averageIncomeEurYear,
    isCompliant: d.canopyCoverPct >= 30.0
  }));

  return (
    <DraggableWindow
      title="EQUIDAD EN INFRAESTRUCTURA VERDE URBANA (REGLA 3-30-300 OMS / UE)"
      subtitle="Auditoría de Desiertos Verdes, Renta INE y Captación Fitosférica en los 11 Distritos de Málaga"
      icon={<Trees className="w-5 h-5 text-emerald-400" />}
      badge={
        <span className="text-[8.5px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-1.5 py-0.2 font-mono font-bold">
          3-30-300 OMS • REGLAMENTO (UE) 2024/1991
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[94vw] max-w-5xl max-h-[86vh]"
      headerColorClass="text-emerald-400"
      borderColorClass="border-emerald-500/80"
    >
      <div className="flex flex-col gap-3 font-mono text-xs p-3 text-slate-200 bg-slate-950">
        {/* Banner Unificado del Punto Activo */}
        <ActivePointSyncBanner compact={true} />

        {/* Banner Metodológico */}
        <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 border border-emerald-500/60 p-3 rounded flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <div className="text-xs font-bold text-emerald-300 uppercase flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-400" />
              <span>Regla 3-30-300 de Cecil Konijnendijk (OMS / Comisión Europea)</span>
              <span className="bg-rose-950 text-rose-300 text-[8.5px] font-mono px-1.5 py-0.5 border border-rose-700">
                Brecha Verde: {analysis.equityGapRatio}x
              </span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-snug">
              Auditoría del principio 3-30-300: 3 árboles visibles desde cada hogar, 30% de cobertura de dosel vegetal en el distrito y 300 metros máximos a un parque de calidad (&gt;0.5 ha). Demuestra la coexistencia de 'desiertos verdes' con alta polución en barrios obreros de Málaga.
            </p>
          </div>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar la matriz completa de dotación verde e índices de deprivación en formato CSV.">
            <button
              onClick={handleExportCSV}
              className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10.5px] uppercase font-bold py-2 px-3.5 rounded border border-emerald-400 flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>EXPORTAR FAIR CSV</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* 4 Indicadores Clave */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Dosel Medio Ciudad</span>
            <span className="text-lg font-bold text-amber-400 font-mono">
              {analysis.cityMeanCanopyCoverPct}%
            </span>
            <span className="text-[9px] text-slate-400 block">Meta OMS: ≥ 30%</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Dotación Verde Media</span>
            <span className="text-lg font-bold text-cyan-400 font-mono">
              {analysis.cityMeanGreenM2PerCapita} m²/hab
            </span>
            <span className="text-[9px] text-slate-400 block">Estándar OMS: ≥ 9 m²</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Brecha de Equidad Verde</span>
            <span className="text-lg font-bold text-rose-400 font-mono">
              {analysis.equityGapRatio}x
            </span>
            <span className="text-[9px] text-slate-400 block">Distrito Este vs Carretera Cádiz</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Desiertos Verdes</span>
            <span className="text-lg font-bold text-rose-400 font-mono">
              {analysis.districts.filter(d => d.greenStatusClassification === 'DESIERTO_VERDE_CRITICO').length} Distritos
            </span>
            <span className="text-[9px] text-slate-400 block">Dosel &lt; 10% y m² &lt; 3.5</span>
          </div>
        </div>

        {/* Gráfico Comparativo: Cobertura de Dosel Vegetal (%) vs Meta 30% */}
        <div className="bg-black/90 p-3 border border-slate-800 rounded space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-300">
              Porcentaje de Cobertura de Dosel Vegetal por Distrito vs Umbral del 30% de la Regla OMS
            </span>
            <span className="text-[9.5px] text-slate-400">
              Línea roja discontinua = Meta de Cobertura (30%)
            </span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" />
                <YAxis stroke="#34d399" tick={{ fontSize: 9 }} label={{ value: '% Cobertura Dosel', angle: -90, position: 'insideLeft', fill: '#34d399', fontSize: 10 }} />
                <ReferenceLine y={30} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" label={{ value: 'Meta OMS 30%', fill: '#ef4444', fontSize: 9 }} />
                <RechartsTooltip cursor={{ fill: 'rgba(52, 211, 153, 0.1)' }} />
                <Bar dataKey="canopy" name="Cobertura Dosel (%)" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isCompliant ? '#10b981' : entry.canopy < 10 ? '#ef4444' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla Comparativa de los 11 Distritos de Málaga */}
        <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded p-2">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-1">
            <span className="text-xs font-bold text-slate-200">
              Evaluación Detallada de la Regla 3-30-300 e Injusticia Verde por Distrito
            </span>
            <div className="flex gap-1 text-[9px]">
              <ScientificTooltip position="bottom" width="w-[240px]" content="Muestra la totalidad de los 11 distritos administrativos municipales de Málaga con sus métricas completas de cobertura e ingresos.">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${filterType === 'all' ? 'bg-emerald-600 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'}`}
                >
                  TODOS (11)
                </button>
              </ScientificTooltip>
              <ScientificTooltip position="bottom" width="w-[260px]" content="Filtra distritos clasificados como 'Desiertos Verdes Críticos' (cobertura de dosel &lt;10% y dotación &lt;3.5 m²/hab), como Carretera de Cádiz y Cruz de Humilladero.">
                <button
                  onClick={() => setFilterType('critical')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${filterType === 'critical' ? 'bg-rose-600 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'}`}
                >
                  DESIERTOS VERDES
                </button>
              </ScientificTooltip>
              <ScientificTooltip position="bottom" width="w-[260px]" content="Filtra distritos que alcanzan o superan la meta del 30% de dosel vegetal estipulada en la regla europea 3-30-300 (ej. Distrito Este y Campanillas).">
                <button
                  onClick={() => setFilterType('compliant')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${filterType === 'compliant' ? 'bg-emerald-600 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'}`}
                >
                  CUMPLEN (≥30%)
                </button>
              </ScientificTooltip>
            </div>
          </div>
          <table className="w-full text-left text-[9px]">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="py-1 px-1">Distrito</th>
                <th className="py-1 px-1">Renta Hogar</th>
                <th className="py-1 px-1 text-emerald-300">Dosel (%)</th>
                <th className="py-1 px-1 text-cyan-300">m²/hab</th>
                <th className="py-1 px-1">Árboles Vis.</th>
                <th className="py-1 px-1">Dist. Parque</th>
                <th className="py-1 px-1 text-amber-300">Captación NO₂</th>
                <th className="py-1 px-1 text-rose-300">ISV Score</th>
                <th className="py-1 px-1">Diagnóstico</th>
              </tr>
            </thead>
            <tbody>
              {filteredDistricts.map((d) => (
                <tr key={d.districtId} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                  <td className="py-1 px-1 font-bold text-slate-200">{d.districtName}</td>
                  <td className="py-1 px-1 text-slate-300 font-mono">{d.averageIncomeEurYear.toLocaleString()} €</td>
                  <td className="py-1 px-1 text-emerald-400 font-bold">{d.canopyCoverPct}%</td>
                  <td className="py-1 px-1 text-cyan-400">{d.greenAreaM2PerCapita} m²</td>
                  <td className="py-1 px-1 text-slate-300">{d.averageTreesVisibleCount}</td>
                  <td className="py-1 px-1 text-slate-400">{d.distanceToGreenSpaceM} m</td>
                  <td className="py-1 px-1 text-amber-300 font-mono">{d.annualPhytosphericNO2SinkKg} kg/año</td>
                  <td className="py-1 px-1 text-rose-400 font-bold font-mono">{d.socioGreenInjusticeScore}</td>
                  <td className="py-1 px-1">
                    <span className={`px-1 py-0.5 rounded text-[8px] font-mono ${d.greenStatusClassification === 'DESIERTO_VERDE_CRITICO' ? 'bg-rose-950 text-rose-300 border border-rose-800' : d.greenStatusClassification === 'CUMPLE_REGLA_3_30_300' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                      {d.greenStatusClassification === 'DESIERTO_VERDE_CRITICO' ? 'DESIERTO CRÍTICO' : d.greenStatusClassification === 'CUMPLE_REGLA_3_30_300' ? 'CUMPLE 3-30-300' : 'DÉFICIT'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Diagnóstico Doctoral para la Defensa */}
        <div className="p-3 bg-emerald-950/30 border border-emerald-600/40 rounded space-y-1">
          <span className="text-[10.5px] font-bold text-emerald-300 uppercase flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Dictamen Doctoral para el Capítulo de Justicia Ambiental y Restauración</span>
          </span>
          <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
            {analysis.doctoralConclusion}
          </p>
        </div>
      </div>
    </DraggableWindow>
  );
};
