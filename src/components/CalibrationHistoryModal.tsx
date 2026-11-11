import React, { useState } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { History, Table as TableIcon, LineChart as LineChartIcon, Download, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { ScientificTooltip } from './ScientificTooltip';
import { format } from 'date-fns';
import { MeteoData, PhysicsResult } from '../lib/physics';
import { calculateHistoricalBenchmark } from './PinnVdKHistoricalBenchmark';
import { CalibrationTimelineDiagram } from './CalibrationTimelineDiagram';

export interface CalibrationLog {
  id: string;
  timestamp: string;
  lat: number;
  lon: number;
  result: PhysicsResult;
  meteo: MeteoData;
  justification: string;
}

interface Props {
  logs: CalibrationLog[];
  onClose: () => void;
}

export function CalibrationHistoryModal({ logs, onClose }: Props) {
  const [activeView, setActiveView] = useState<'chart' | 'table' | 'timeline'>('chart');

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = 'timestamp,lat,lon,vd_pinn_ms,vd_hist_ms,delta_vd_pct,k_pinn,k_hist,delta_k_pct,temp_c,wind_dir_deg,wind_speed_kmh,no2_sat,lai,hr_pct,sw_rad_wm2,justification\n';
    const csv = logs.map(r => {
      const b = calculateHistoricalBenchmark(r.meteo);
      const dVdPct = b.vdHistMean > 0 ? ((r.result.vd - b.vdHistMean) / b.vdHistMean * 100).toFixed(2) : '0';
      const dKPct = b.kHistMean > 0 ? ((r.result.k - b.kHistMean) / b.kHistMean * 100).toFixed(2) : '0';
      return `${r.timestamp},${r.lat},${r.lon},${r.result.vd},${b.vdHistMean},${dVdPct},${r.result.k},${b.kHistMean},${dKPct},${r.meteo.temperatura_malaga},${r.meteo.direccion_viento_grados},${r.meteo.velocidad_viento_km_h},${r.meteo.no2_satelite_base},${r.meteo.lai_arbolado || 1.8},${r.meteo.humedad_relativa},${r.meteo.shortwave_radiation || 520},"${r.justification.replace(/"/g, '""')}"`;
    }).join('\n');
    
    const blob = new Blob([headers + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'calibraciones_vd_k_benchmark.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = logs.map(r => {
    const b = calculateHistoricalBenchmark(r.meteo);
    return {
      time: format(new Date(r.timestamp), 'HH:mm:ss'),
      vd: r.result.vd,
      vd_hist: b.vdHistMean,
      k: r.result.k,
      k_hist: b.kHistMean,
      fullDate: format(new Date(r.timestamp), 'dd/MM/yyyy HH:mm:ss')
    };
  });

  return (
    <DraggableWindow
      title="Historial de Calibración PINN (v_d & k)"
      icon={<History className="w-4 h-4 text-emerald-400" />}
      onClose={onClose}
      className="w-[700px]"
    >
      <div className="p-4 bg-slate-900/95 space-y-4 text-sm">
        <div className="flex items-center justify-between">
          <div className="flex bg-slate-800 rounded p-1 space-x-1">
            <ScientificTooltip position="bottom" width="w-[260px]" content="Gráfica temporal de dispersión y evolución de los parámetros cinéticos v_d (velocidad de deposición seca, m/s) y k (difusividad turbulenta, m²/s) inferidos por la PINN.">
              <button
                onClick={() => setActiveView('chart')}
                className={`flex items-center px-3 py-1.5 rounded transition-colors ${activeView === 'chart' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
              >
                <LineChartIcon className="w-4 h-4 mr-1.5" />
                Tendencias
              </button>
            </ScientificTooltip>
            <ScientificTooltip position="bottom" width="w-[260px]" content="Matriz estructurada con cada evento de calibración asimilado: coordenadas, resultados cinéticos, meteorología asociada y desviación frente a benchmarks históricos.">
              <button
                onClick={() => setActiveView('table')}
                className={`flex items-center px-3 py-1.5 rounded transition-colors ${activeView === 'table' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
              >
                <TableIcon className="w-4 h-4 mr-1.5" />
                Registros Crudos
              </button>
            </ScientificTooltip>
            <ScientificTooltip position="bottom" width="w-[260px]" content="Diagrama interactivo de trazabilidad temporal y linaje de datos de calibración conforme a los estándares de ciencia abierta FAIR.">
              <button
                onClick={() => setActiveView('timeline')}
                className={`flex items-center px-3 py-1.5 rounded transition-colors ${activeView === 'timeline' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
              >
                <History className="w-4 h-4 mr-1.5" />
                Línea Temporal (FAIR)
              </button>
            </ScientificTooltip>
          </div>
          <div className="flex space-x-2">
            <ScientificTooltip position="bottom" width="w-[250px]" content="Exportar registros tabulares FAIR en formato CSV para validación y reanálisis externo.">
              <button
                onClick={handleExportCSV}
                className="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded transition-colors border border-slate-700"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Exportar CSV
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {activeView === 'chart' && (
          <div className="bg-slate-950/80 border border-slate-800 rounded p-4 h-[350px]">
            {logs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis yAxisId="left" stroke="#34d399" tick={{ fontSize: 11, fill: '#34d399' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" tick={{ fontSize: 11, fill: '#38bdf8' }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="vd" name="v_d (m/s)" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line yAxisId="right" type="monotone" dataKey="k" name="k (m²/s)" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 flex-col">
                <LineChartIcon className="w-8 h-8 mb-2 opacity-50" />
                <p>No hay datos de calibración registrados.</p>
              </div>
            )}
          </div>
        )}

        {activeView === 'table' && (
          <div className="bg-slate-950/80 border border-slate-800 rounded overflow-hidden">
            <div className="overflow-y-auto max-h-[350px] custom-scrollbar">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-900 border-b border-slate-700 sticky top-0 text-slate-300">
                  <tr>
                    <th className="px-3 py-2 font-medium">Timestamp</th>
                    <th className="px-3 py-2 font-medium text-emerald-400">v_d PINN (m/s)</th>
                    <th className="px-3 py-2 font-medium text-emerald-300">Δ v_d (%)</th>
                    <th className="px-3 py-2 font-medium text-sky-400">k PINN (m²/s)</th>
                    <th className="px-3 py-2 font-medium text-sky-300">Δ k (%)</th>
                    <th className="px-3 py-2 font-medium">Meteo (T / Viento)</th>
                    <th className="px-3 py-2 font-medium">Diagnóstico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {logs.length > 0 ? (
                    logs.map((r) => {
                      const b = calculateHistoricalBenchmark(r.meteo);
                      const dVdPct = b.vdHistMean > 0 ? ((r.result.vd - b.vdHistMean) / b.vdHistMean * 100) : 0;
                      const dKPct = b.kHistMean > 0 ? ((r.result.k - b.kHistMean) / b.kHistMean * 100) : 0;
                      const isVdAnom = Math.abs(dVdPct) > 25;
                      const isKAnom = Math.abs(dKPct) > 25;

                      return (
                        <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-3 py-2 text-slate-400">{format(new Date(r.timestamp), 'dd/MM HH:mm:ss')}</td>
                          <td className="px-3 py-2 text-emerald-300 font-mono">
                            {r.result.vd.toFixed(5)}
                            <span className="text-[9px] text-slate-500 block">Ref: {b.vdHistMean.toFixed(5)}</span>
                          </td>
                          <td className="px-3 py-2 font-mono">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isVdAnom ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950/60 text-emerald-300'}`}>
                              {dVdPct >= 0 ? `+${dVdPct.toFixed(1)}%` : `${dVdPct.toFixed(1)}%`}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sky-300 font-mono">
                            {r.result.k.toFixed(2)}
                            <span className="text-[9px] text-slate-500 block">Ref: {b.kHistMean.toFixed(2)}</span>
                          </td>
                          <td className="px-3 py-2 font-mono">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isKAnom ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-sky-950/60 text-sky-300'}`}>
                              {dKPct >= 0 ? `+${dKPct.toFixed(1)}%` : `${dKPct.toFixed(1)}%`}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-300 font-mono">
                            {r.meteo.temperatura_malaga.toFixed(1)}°C / {r.meteo.velocidad_viento_km_h.toFixed(0)} km/h
                          </td>
                          <td className="px-3 py-2 text-slate-400 max-w-[150px] truncate" title={r.justification || b.meteoBinLabel}>
                            {r.justification || b.meteoBinLabel}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                        No hay registros en el historial
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'timeline' && (
          <div className="space-y-3">
            <CalibrationTimelineDiagram />
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded font-mono text-xs space-y-2 text-slate-300">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-1">
                <span>Registros Asimilados en Memoria: <strong className="text-emerald-400">{logs.length}</strong></span>
                <span>Trazabilidad Citable: <strong className="text-sky-400">FAIR Data (DOIs / ISO 19115)</strong></span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Cada evento de calibración asimila la discrepancia observada entre la red de telemetría oficial y la inferencia a priori de la red PINN, actualizando las velocidades de deposición seca ($v_d$) y los coeficientes de difusión turbulenta ($k$). Los estados persisten temporalmente con sellado criptográfico determinista sin generar sesgos estocásticos.
              </p>
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
}
