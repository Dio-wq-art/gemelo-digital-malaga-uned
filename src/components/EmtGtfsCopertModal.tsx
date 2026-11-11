import React, { useState, useEffect } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import {
  fetchEmtGtfsStatus,
  simulate100PctElectricFleetEmissions,
  exportEmtGtfsGeoJson,
  exportEmtGtfsCsv,
  EmtGtfsSummary,
  EmtLineFleetStatus
} from '../lib/emtGtfsCopert';
import {
  Bus,
  Zap,
  ShieldCheck,
  FileJson,
  FileSpreadsheet,
  Activity,
  Sparkles,
  BarChart3,
  Sliders
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { CopertSpeedEmissionsDiagram } from './CopertSpeedEmissionsDiagram';
import { EmtGtfsTransitEmissionDiagram } from './EmtGtfsTransitEmissionDiagram';

interface EmtGtfsCopertModalProps {
  onClose: () => void;
}

export function EmtGtfsCopertModal({ onClose }: EmtGtfsCopertModalProps) {
  const [data, setData] = useState<EmtGtfsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulateZeroEmissions, setSimulateZeroEmissions] = useState(false);

  useEffect(() => {
    fetchEmtGtfsStatus()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const simulatedLines = data ? simulate100PctElectricFleetEmissions(data.linesStatus) : [];

  const chartDataLines = data?.linesStatus.map(l => ({
    name: l.lineId,
    noxActual: l.totalNOxEmissionsGramsHour,
    noxSimulado: simulateZeroEmissions ? 0.0 : l.totalNOxEmissionsGramsHour
  })) || [];

  const handleDownloadGeoJson = () => {
    if (!data) return;
    const str = exportEmtGtfsGeoJson(data);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emt_gtfs_copert_malaga_${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    if (!data) return;
    const str = exportEmtGtfsCsv(data);
    const blob = new Blob([str], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emt_gtfs_copert_malaga_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="Flota EMT Málaga GTFS-RT & Modelo de Emisiones COPERT 5"
      subtitle="Geolocalización en Vivo de Autobuses Urbanos y Diagnóstico de Descarbonización (Flota Cero Emisiones)"
      icon={<Bus className="w-4 h-4 text-sky-400" />}
      badge={
        <span className="text-[9px] bg-sky-950 text-sky-300 border border-sky-700 px-1.5 py-0.5 font-mono font-bold">
          {data?.totalActiveBusesInService || 88} Buses en Servicio (GTFS-RT)
        </span>
      }
      onClose={onClose}
      headerColorClass="text-sky-400"
      borderColorClass="border-slate-700"
      className="w-full max-w-5xl"
      initialPositionClass="top-10 left-1/2 -translate-x-1/2"
    >
      <div className="flex flex-col gap-4 p-4 bg-[#0a0f18] text-slate-200 max-h-[80vh] overflow-y-auto font-mono text-xs">
        {/* HEADER STATUS */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <div>
              <span className="font-bold text-slate-200">Fuente: {data?.source}</span>
              <span className="text-[10px] text-slate-400 block">
                Última sincronización: {data?.lastUpdated?.slice(0, 19).replace('T', ' ')}
              </span>
            </div>
          </div>
          <ScientificTooltip position="bottom" width="w-[300px]" content="Simulación de la sustitución determinista de la flota de autobuses diésel e híbridos por vehículos 100% eléctricos (Zero Emission Vehicles ZEV), eliminando el 100% de emisiones directas de NOx en tubo de escape (Guía EMEP/EEA 2023).">
            <button
              onClick={() => setSimulateZeroEmissions(!simulateZeroEmissions)}
              className={`px-3 py-1.5 rounded text-[10.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                simulateZeroEmissions
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500'
              }`}
              title="Simular electrificación al 100% de la flota EMT de Málaga"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>{simulateZeroEmissions ? '✓ Escenario 100% Eléctrico Activado' : 'Evaluar Escenario 100% Cero Emisiones'}</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Dynamic COPERT 5 Speed Emission Curve Diagram */}
        <CopertSpeedEmissionsDiagram />

        {/* Real-time Bus Corridors & Electrification Diagram */}
        {data && (
          <EmtGtfsTransitEmissionDiagram
            summary={data}
            is100PctElectricSimulated={simulateZeroEmissions}
          />
        )}

        {/* FLEET ENGINES COMPOSITION */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {data?.fleetEngineDistribution.map(eng => (
            <div key={eng.engineType} className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1">
              <span className="text-[10px] font-bold text-slate-300 block">{eng.displayName}</span>
              <div className="flex justify-between items-baseline">
                <strong className="text-lg text-sky-400 font-mono">{eng.countInFleet}</strong>
                <span className="text-[10px] text-slate-400 font-mono">({eng.pctFleet}%)</span>
              </div>
              <div className="text-[9.5px] text-slate-400 font-mono">
                COPERT NOₓ: <strong className="text-amber-300">{eng.copert5NOxGramKm} g/km</strong>
              </div>
            </div>
          ))}
        </div>

        {/* LINES TABLE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                <th className="p-2.5">Línea EMT</th>
                <th className="p-2.5 text-center">Buses Activos</th>
                <th className="p-2.5 text-center">Desglose Motor</th>
                <th className="p-2.5 text-center">Hotspots de Ruta</th>
                <th className="p-2.5 text-right">Emisiones NOₓ (g/h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">
                    Sincronizando feed GTFS-RT de la EMT de Málaga...
                  </td>
                </tr>
              ) : data?.linesStatus.map(l => (
                <tr key={l.lineId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-2.5 font-bold text-sky-300">
                    {l.lineName}
                  </td>
                  <td className="p-2.5 text-center font-bold font-mono text-slate-200">
                    {l.activeBusesCount}
                  </td>
                  <td className="p-2.5 text-center font-mono text-[10px]">
                    <span className="text-rose-400">{l.dieselCount} D</span> / <span className="text-amber-400">{l.hybridCount} H</span> / <span className="text-cyan-400">{l.cngCount} CNG</span> / <span className="text-emerald-400">{l.electricCount} EV</span>
                  </td>
                  <td className="p-2.5 text-center text-[10px] text-slate-400">
                    {l.routeKeyHotspots.join(', ')}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold">
                    {simulateZeroEmissions ? (
                      <span className="text-emerald-400 line-through mr-1 opacity-50">
                        {l.totalNOxEmissionsGramsHour} g/h
                      </span>
                    ) : null}
                    <span className={simulateZeroEmissions ? 'text-emerald-400' : 'text-amber-300'}>
                      {simulateZeroEmissions ? '0.0 g/h (-100%)' : `${l.totalNOxEmissionsGramsHour} g/h`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RECHARTS COMPARISON */}
        <div className="bg-slate-900 border border-slate-800 p-3 rounded">
          <h4 className="text-xs font-bold text-sky-300 mb-2 flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5 text-sky-400" /> Comparativa de Emisiones COPERT 5 por Línea [g/h NOₓ]
          </h4>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataLines} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#38bdf8" tick={{ fontSize: 10 }} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="noxActual" name="Flota Actual GTFS-RT" fill="#f59e0b" />
                <Bar dataKey="noxSimulado" name="Flota Escenario 100% Cero Emisiones" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* EXPORT BUTTONS */}
        <div className="flex justify-between items-center border-t border-slate-800 pt-3">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Bus className="w-3.5 h-3.5 text-sky-400" /> Asimilación GTFS-RT y COPERT 5 para la tesis doctoral de Málaga.
          </span>
          <div className="flex gap-2">
            <ScientificTooltip position="top" width="w-[280px]" content="Exporta las líneas y puntos GPS en vivo de la flota de autobuses EMT de Málaga en formato GeoJSON estandarizado FAIR, con atributos de motor, velocidad media y tasa horaria de emisión NOₓ.">
              <button
                onClick={handleDownloadGeoJson}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 font-mono font-bold rounded transition-colors"
              >
                <FileJson className="w-3.5 h-3.5 text-sky-400" /> GeoJSON FAIR
              </button>
            </ScientificTooltip>
            <ScientificTooltip position="top" width="w-[280px]" content="Exporta la serie tabular de líneas, flota activa, distribución de motores Euro VI/híbrido/eléctrico y emisiones COPERT 5 (g/h NOₓ) en formato CSV citable para la tesis.">
              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 bg-sky-950 hover:bg-sky-900 text-sky-200 border border-sky-700 text-xs px-3 py-1.5 font-mono font-bold rounded transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-sky-300" /> CSV FAIR
              </button>
            </ScientificTooltip>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
}
