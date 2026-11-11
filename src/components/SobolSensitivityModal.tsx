import React, { useState, useMemo } from 'react';
import { Cpu, Activity, Download, FileSpreadsheet, ShieldCheck, BarChart3, HelpCircle } from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { SobolVarianceDecompositionDiagram } from './SobolVarianceDecompositionDiagram';
import {
  calculateSobolSensitivitySummary,
  exportSobolCsv,
} from '../lib/sobolSensitivityAnalysis';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface SobolSensitivityModalProps {
  onClose: () => void;
}

export function SobolSensitivityModal({ onClose }: SobolSensitivityModalProps) {
  const [targetVar, setTargetVar] = useState<'NO2_Concentration' | 'O3_Peak' | 'SOA_Production'>('NO2_Concentration');
  const [sampleN, setSampleN] = useState<number>(1024);

  const summary = useMemo(() => {
    return calculateSobolSensitivitySummary(targetVar, sampleN);
  }, [targetVar, sampleN]);

  const chartData = useMemo(() => {
    return summary.indices.map((idx) => ({
      name: idx.simbolo,
      firstOrderSi: idx.firstOrderSi,
      totalOrderSTi: idx.totalOrderSTi,
      interactionDelta: idx.interactionDelta,
    }));
  }, [summary]);

  const handleDownloadCsv = () => {
    const csvStr = exportSobolCsv(summary);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sobol_sensibilidad_pinn_${targetVar}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="Análisis de Sensibilidad Global de Sobol (Índices S_i y S_Ti)"
      subtitle="Evaluación cuantitativa de la descomposición de varianza del modelo PINN (Saltelli 2008)"
      icon={<Cpu className="w-4 h-4 text-purple-400" />}
      badge={
        <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-700 px-1.5 py-0.5 font-mono font-bold">
          Target: {targetVar} | N = {sampleN}
        </span>
      }
      onClose={onClose}
      headerColorClass="text-purple-400"
      borderColorClass="border-slate-700"
      className="w-full max-w-5xl"
      initialPositionClass="top-6 left-1/2 -translate-x-1/2"
    >
      <div className="flex flex-col gap-4 p-4 bg-[#0a0f18] text-slate-200 max-h-[80vh] overflow-y-auto">
        {/* CONFIGURACIÓN DEL ANÁLISIS DE SOBOL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 p-3 flex flex-col gap-3">
            <h3 className="text-[10px] uppercase font-bold text-purple-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <Activity className="w-3.5 h-3.5" /> Variable Objetivo del Modelo PINN
            </h3>

            <ScientificTooltip
              position="bottom"
              width="w-[320px]"
              content="Variable de salida cuya varianza total V(Y) es descompuesta en contribuciones de primer orden e interacciones no lineales entre parámetros."
            >
              <div className="space-y-1 cursor-help">
                <label className="text-[10px] text-slate-400 block">Variable Objetivo Y</label>
                <select
                  value={targetVar}
                  onChange={(e) => setTargetVar(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-purple-300 p-1 font-mono rounded"
                >
                  <option value="NO2_Concentration">NO₂ Concentración Urbana (µg/m³)</option>
                  <option value="O3_Peak">Pico Máximo de Ozono O₃ (µg/m³)</option>
                  <option value="SOA_Production">Rendimiento SOA Aerosoles Secundarios (µg/m³)</option>
                </select>
              </div>
            </ScientificTooltip>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 flex flex-col gap-3">
            <h3 className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Tamaño de Muestra Muestreo Saltelli
            </h3>

            <ScientificTooltip
              position="bottom"
              width="w-[300px]"
              content="Tamaño de la matriz de muestreo determinista Saltelli N * (2k + 2). A mayor N, mayor convergencia de los índices S_i y S_Ti."
            >
              <div className="space-y-1.5 cursor-help">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Muestra Saltelli N</span>
                  <span className="font-mono text-amber-300 font-bold">N = {sampleN}</span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="4096"
                  step="256"
                  value={sampleN}
                  onChange={(e) => setSampleN(parseInt(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded"
                />
              </div>
            </ScientificTooltip>
          </div>
        </div>

        {/* DIAGRAMA ACTIVO DE DESCOMPOSICIÓN DE VARIANZA DE SOBOL */}
        <SobolVarianceDecompositionDiagram
          targetVar={targetVar}
          sampleN={sampleN}
          indices={summary.indices}
        />

        {/* GRÁFICO RECHARTS DE ÍNDICES DE SOBOL */}
        <div className="bg-slate-900/90 border border-slate-800 p-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase mb-2 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-purple-400" /> Índices de Sensibilidad: Primer Orden (S_i) vs. Total (S_Ti)
          </h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                <YAxis stroke="#a855f7" tick={{ fontSize: 10 }} domain={[0, 0.6]} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="firstOrderSi" name="Primer Orden (S_i - Efecto Directo)" fill="#38bdf8" />
                <Bar dataKey="totalOrderSTi" name="Efecto Total (S_Ti - Directo + Interacciones)" fill="#a855f7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TABLA DE PARÁMETROS Y CLASIFICACIÓN */}
        <div className="bg-slate-900 border border-slate-800 p-3 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="p-1">Parámetro</th>
                <th className="p-1">Símbolo</th>
                <th className="p-1">
                  <ScientificTooltip position="top" width="w-[280px]" content="Índice de Sobol de primer orden S_i = V_Xi(E_X~i[Y|Xi]) / V(Y). Cuantifica la fracción de varianza explicada individualmente por el parámetro sin interacciones.">
                    <span className="cursor-help underline decoration-dotted">S_i (Primer Orden)</span>
                  </ScientificTooltip>
                </th>
                <th className="p-1">
                  <ScientificTooltip position="top" width="w-[280px]" content="Índice de Sobol de orden total S_Ti = 1 - V_X~i(E_Xi[Y|X~i]) / V(Y). Cuantifica la contribución total del parámetro, incluyendo todas sus interacciones no lineales de orden superior.">
                    <span className="cursor-help underline decoration-dotted">S_Ti (Efecto Total)</span>
                  </ScientificTooltip>
                </th>
                <th className="p-1">
                  <ScientificTooltip position="top" width="w-[260px]" content="Diferencia S_Ti - S_i. Mide el grado de no linealidad e interacción del parámetro con los demás factores del modelo físico-químico.">
                    <span className="cursor-help underline decoration-dotted">Interacción (S_Ti - S_i)</span>
                  </ScientificTooltip>
                </th>
                <th className="p-1">
                  <ScientificTooltip position="top" width="w-[240px]" content="Categorización según el peso en la incertidumbre: Dominante (S_Ti > 0.35), Sustancial (S_Ti > 0.15), Secundario.">
                    <span className="cursor-help underline decoration-dotted">Clasificación</span>
                  </ScientificTooltip>
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.indices.map((idx) => (
                <tr key={idx.paramId} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="p-1 text-slate-200">{idx.paramName}</td>
                  <td className="p-1 text-purple-300 font-bold">{idx.simbolo}</td>
                  <td className="p-1 text-sky-400">{idx.firstOrderSi}</td>
                  <td className="p-1 text-purple-400 font-bold">{idx.totalOrderSTi}</td>
                  <td className="p-1 text-amber-400">+{idx.interactionDelta}</td>
                  <td className="p-1">
                    <span
                      className={`px-1.5 py-0.5 text-[9px] font-bold ${
                        idx.clasificacion === 'Dominante'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : idx.clasificacion === 'Sustancial'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx.clasificacion}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* BOTONES DE EXPORTACIÓN FAIR */}
        <div className="flex justify-between items-center border-t border-slate-800 pt-3">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Muestreo Saltelli / Sobol (2008). Cero datos aleatorios.</span>
          </div>

          <ScientificTooltip position="top" width="w-[280px]" content="Exportación tabular CSV con la descomposición de varianza e índices de Sobol S_i y S_Ti para reproducibilidad de la tesis doctoral.">
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700 text-xs px-3 py-1.5 font-mono font-bold transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-300" /> CSV FAIR Science
            </button>
          </ScientificTooltip>
        </div>
      </div>
    </DraggableWindow>
  );
}
