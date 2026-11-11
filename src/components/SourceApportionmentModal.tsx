import React, { useState, useMemo } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { SourceApportionmentMatrixDiagram } from './SourceApportionmentMatrixDiagram';
import {
  MALAGA_RECEPTOR_SITES,
  MALAGA_SOURCE_PROFILES,
  ReceptorSite,
  solveSourceApportionmentCMB,
  exportSourceApportionmentGeoJson,
  exportSourceApportionmentCsv
} from '../lib/sourceApportionment';
import { Download, PieChart as PieIcon, Activity, Anchor, Truck, Sun, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface Props {
  onClose: () => void;
  ambientTempC?: number;
  windSpeedKmH?: number;
  windDirDeg?: number;
  camsSaharaDustUgm3?: number;
}

const COLORS = ['#ef4444', '#3b82f6', '#06b6d4', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

export function SourceApportionmentModal({
  onClose,
  ambientTempC = 23.5,
  windSpeedKmH = 14,
  windDirDeg = 145,
  camsSaharaDustUgm3 = 12
}: Props) {
  const [selectedReceptor, setSelectedReceptor] = useState<ReceptorSite>(MALAGA_RECEPTOR_SITES[0]);
  const [saharaDustLevel, setSaharaDustLevel] = useState<number>(camsSaharaDustUgm3); // µg/m³
  const [portActivityFactor, setPortActivityFactor] = useState<number>(1.2); // Factor de buques
  const [customPM25, setCustomPM25] = useState<number>(selectedReceptor.pm25Measured);

  // Synchronize when receptor changes
  const handleReceptorChange = (siteId: string) => {
    const site = MALAGA_RECEPTOR_SITES.find(s => s.id === siteId) || MALAGA_RECEPTOR_SITES[0];
    setSelectedReceptor(site);
    setCustomPM25(site.pm25Measured);
  };

  // Solve deterministic CMB model
  const CMBResult = useMemo(() => {
    const siteWithCustomPM = {
      ...selectedReceptor,
      pm25Measured: customPM25
    };
    return solveSourceApportionmentCMB(siteWithCustomPM, saharaDustLevel, portActivityFactor);
  }, [selectedReceptor, customPM25, saharaDustLevel, portActivityFactor]);

  // Pie chart data
  const pieData = useMemo(() => {
    return CMBResult.contributions.map(c => ({
      name: c.sourceName,
      value: c.percentage,
      mass: c.massContributionUgm3
    }));
  }, [CMBResult]);

  // Download FAIR GeoJSON
  const handleDownloadGeoJSON = () => {
    const jsonStr = exportSourceApportionmentGeoJson(CMBResult);
    const blob = new Blob([jsonStr], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `source_apportionment_${selectedReceptor.id}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download FAIR CSV
  const handleDownloadCSV = () => {
    const csvStr = exportSourceApportionmentCsv(CMBResult);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `source_apportionment_${selectedReceptor.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title={
        <div className="flex items-center gap-2 text-indigo-300">
          <PieIcon className="w-5 h-5 text-indigo-400" />
          <span className="flex items-center gap-1">
            Modelización Inversa y Atribución de Fuentes (EPA-PMF 5.0 / CMB)
            <ScientificTooltip content="Descomposición matricial determinista para identificar el origen porcentual de la masa de contaminantes en los receptores urbanos de Málaga." />
          </span>
        </div>
      }
      
      onClose={onClose}
      
    >
      <div className="p-4 w-[880px] bg-slate-900 text-slate-200 space-y-4">
        {/* Top Header Controls */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-400" />
              Receptor y Condiciones Atmosféricas Inversas
            </h3>
            <p className="text-xs text-slate-400 max-w-lg">
              Resolución del sistema matricial <strong>y = A · x + ε</strong> mediante Balance de Masa Químico (CMB / EPA-PMF 5.0) acoplado a la red de estaciones oficiales.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadGeoJSON}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              GeoJSON (FAIR)
            </button>
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-indigo-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              CSV (FAIR)
            </button>
          </div>
        </div>

        {/* Sliders & Selector Bar */}
        <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3 rounded border border-slate-800">
          <div>
            <label className="text-[10px] text-slate-400 flex items-center justify-between mb-1">
              <span className="flex items-center gap-1">
                Punto Receptor
                <ScientificTooltip content="Estación de muestreo receptora en la que se analiza la huella química de los aerosoles." />
              </span>
              <span className="text-indigo-400 font-mono text-[11px] font-bold">{selectedReceptor.district}</span>
            </label>
            <select
              value={selectedReceptor.id}
              onChange={(e) => handleReceptorChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              {MALAGA_RECEPTOR_SITES.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 flex items-center justify-between mb-1">
              <span className="flex items-center gap-1">
                Polvo Sahariano CAMS (PM₁₀ Dust)
                <ScientificTooltip
                  title="Intrusión Mineral Sahariana (CAMS Dust)"
                  content="Carga de fondo mineral de origen norteafricano (Ca²⁺, Fe, Al, Si) asimilada desde el reanálisis regional Copernicus CAMS y descontable según art. 20 de la Directiva 2008/50/CE."
                  formula="[\text{PM}_{10,\text{neto}}] = [\text{PM}_{10,\text{obs}}] - [\text{PM}_{10,\text{Sahara}}]"
                />
              </span>
              <span className="text-amber-400 font-mono text-[11px] font-bold">{saharaDustLevel} µg/m³</span>
            </label>
            <input
              type="range"
              min="0"
              max="80"
              step="1"
              value={saharaDustLevel}
              onChange={(e) => setSaharaDustLevel(Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 flex items-center justify-between mb-1">
              <span className="flex items-center gap-1">
                Intensidad Tráfico Marítimo
                <ScientificTooltip content="Factor multiplicador de emisiones de buques en el Dique de Levante (trazadores SO₂ y Vanadio)." />
              </span>
              <span className="text-blue-400 font-mono text-[11px] font-bold">{portActivityFactor.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={portActivityFactor}
              onChange={(e) => setPortActivityFactor(Number(e.target.value))}
              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Quality Metrics Bar */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
              Masa Total Medida (PM₂.₅):
              <ScientificTooltip
                title="Concentración Gravimétrica Receptor (PM₂.₅)"
                content="Concentración total observada en el receptor expresada en µg/m³ (cierre estequiométrico ∑ Aᵢⱼ xⱼ)."
                formula="C_{\text{total}} = \sum_{j=1}^{p} g_j \sum_{i=1}^{m} f_{ij}"
              />
            </span>
            <strong className="text-base text-slate-100 font-mono">
              {CMBResult.totalMassUgm3} µg/m³
            </strong>
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
              Ajuste del Modelo (R²):
              <ScientificTooltip
                title="Coeficiente de Determinación Variacional (R²)"
                content="Fracción de la varianza explicada por el solver de factorización de matriz positiva (PMF). Valores R² > 0.90 indican excelente reconstrucción de masa."
                formula="R^2 = 1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}"
              />
            </span>
            <strong className="text-base text-emerald-400 font-mono">
              {CMBResult.fitQualityR2}
            </strong>
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
              Prueba χ² (Q-Value):
              <ScientificTooltip
                title="Estadístico χ² Reducido (EPA-PMF 5.0 Q-Value)"
                content="Métrica de bondad de ajuste de mínimos cuadrados ponderados por la incertidumbre analítica uᵢⱼ de cada trazador químico."
                formula="Q = \sum_{i=1}^{n} \sum_{j=1}^{m} \left( \frac{e_{ij}}{u_{ij}} \right)^2"
              />
            </span>
            <strong className="text-base text-indigo-300 font-mono">
              {CMBResult.chiSquareQValue}
            </strong>
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
              Fuente Principal Dominante:
              <ScientificTooltip content="Fuente de mayor porcentaje en la descomposición espectral del receptor." />
            </span>
            <strong className="text-xs text-rose-400 truncate block">
              {CMBResult.dominantSource}
            </strong>
          </div>
        </div>

        {/* DIAGRAMA VECTORIAL DINÁMICO DE CONVERGENCIA DE FUENTES */}
        <SourceApportionmentMatrixDiagram
          receptorName={selectedReceptor.name}
          totalPM25={CMBResult.totalMassUgm3}
          contributions={CMBResult.contributions}
        />

        {/* Charts Grid */}
        <div className="grid grid-cols-2 gap-4 h-[300px]">
          {/* Donut Chart */}
          <div className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col items-center justify-center relative">
            <h4 className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
              Descomposición Porcentual de Fuentes (%)
              <ScientificTooltip content="Proporción de masa atribuida a cada sector emisor mediante el trazador espectral característico." />
            </h4>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`pie-cell-${entry.name || index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                    formatter={(val: number, name: string, props: any) => [`${val}% (${props.payload.mass} µg/m³)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col justify-center">
            <h4 className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
              Aporte de Masa Absoluto (µg/m³)
              <ScientificTooltip content="Masa absoluta en µg/m³ transferida desde cada sector emisor hasta la estación de control." />
            </h4>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CMBResult.contributions} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="category" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 9 }} interval={0} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} label={{ value: 'µg/m³', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                    formatter={(val: number) => [`${val} µg/m³`, 'Contribución de Masa']}
                  />
                  <Bar dataKey="massContributionUgm3" name="Masa Absoluta" radius={[4, 4, 0, 0]}>
                    {CMBResult.contributions.map((entry, index) => (
                      <Cell key={`bar-cell-${entry.category || entry.sourceId || index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="bg-slate-950 border border-slate-800 rounded p-3 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium text-[10px] uppercase">
                <th className="p-1.5">Sector Emisor</th>
                <th className="p-1.5">Categoría</th>
                <th className="p-1.5 text-right">Masa (µg/m³)</th>
                <th className="p-1.5 text-right">Porcentaje (%)</th>
                <th className="p-1.5">Trazador Químico Clave</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {CMBResult.contributions.map((c, idx) => (
                <tr key={c.sourceId} className="hover:bg-slate-900/50">
                  <td className="p-1.5 font-sans font-medium text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    {c.sourceName}
                  </td>
                  <td className="p-1.5 text-slate-400">{c.category}</td>
                  <td className="p-1.5 text-right font-bold text-slate-100">{c.massContributionUgm3}</td>
                  <td className="p-1.5 text-right text-indigo-300">{c.percentage}%</td>
                  <td className="p-1.5 text-slate-400 font-sans text-[10px]">{c.primaryChemicalMarker}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actionable Regulatory Recommendation */}
        <div className="bg-indigo-950/40 border border-indigo-800/60 p-3 rounded flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-indigo-200 flex items-center gap-1">
              Recomendación de Mitigación Regulada (ZBE / Plan de Calidad del Aire)
              <ScientificTooltip content="Medida sugerida automáticamente en función del sector emisor dominante identificado por el algoritmo de atribución de fuentes." />
            </h4>
            <p className="text-xs text-indigo-300 leading-relaxed">
              {CMBResult.actionableRecommendation}
            </p>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
}
