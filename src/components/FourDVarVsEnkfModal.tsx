import React, { useState } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { useActivePoint } from '../context/ActivePointContext';
import { 
  GitCompare, 
  ShieldCheck, 
  Download, 
  Activity, 
  Orbit,
  Radio,
  Sliders, 
  TrendingDown, 
  Zap, 
  Cpu, 
  CheckCircle2, 
  Layers,
  Sparkles
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { computeFourDVarVsEnkfAssimilation } from '../lib/fourDVarAssimilation';

interface FourDVarVsEnkfModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FourDVarVsEnkfModal: React.FC<FourDVarVsEnkfModalProps> = ({
  isOpen,
  onClose
}) => {
  const activeCtx = useActivePoint();
  const [sigmaB, setSigmaB] = useState<number>(6.5);
  const [sigmaO, setSigmaO] = useState<number>(2.8);
  const [viewTab, setViewTab] = useState<'terrestrial' | 'satellites'>('terrestrial');

  const activeNo2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? 34.0;
  const streetName = activeCtx?.activePoint?.name || activeCtx?.activePoint?.nearestStreetName || 'Alameda Principal / Centro';

  if (!isOpen) return null;

  const result = computeFourDVarVsEnkfAssimilation(activeNo2, sigmaB, sigmaO);

  const handleExportCSV = () => {
    const stationHeaders = 'ESTACIONES TERRESTRES OFICIALES\nEstacion,Tipo,NO2_Observado_ug_m3,NO2_Background_ug_m3,NO2_EnKF_ug_m3,NO2_4DVar_ug_m3,Residuo_EnKF,Residuo_4DVar,Chi2_Contribucion\n';
    const stationRows = result.stationComparisons.map(sc => 
      `"${sc.station.name}",${sc.station.environmentType},${sc.observedNO2},${sc.backgroundNO2},${sc.enkfAnalysisNO2},${sc.fourDVarAnalysisNO2},${sc.enkfResidualUgM3},${sc.fourDVarResidualUgM3},${sc.chiSquareContribution}`
    ).join('\n');

    const satHeaders = '\n\nMISIONES SATELITALES OFICIALES\nMision,Agencia,Observado,Background,Analisis_4DVar,Residuo,Unidad\n';
    const satRows = result.satelliteComparisons.map(sat => 
      `"${sat.mission.name} (${sat.mission.code})",${sat.mission.agency},${sat.observedValue},${sat.backgroundValue},${sat.fourDVarAnalysisValue},${sat.residual},"${sat.unit}"`
    ).join('\n');

    const blob = new Blob([stationHeaders + stationRows + satHeaders + satRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asimilacion_4dvar_pinn_terrestres_satelitales_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="ASIMILACIÓN 4D-VAR PINN: 65 ESTACIONES TERRESTRES + 26 SATÉLITES"
      subtitle="Minimización Variacional del Funcional de Coste J(x) sobre la Red Oficial de Referencia"
      icon={<GitCompare className="w-5 h-5 text-indigo-400" />}
      badge={
        <span className="text-[8.5px] bg-indigo-950 text-indigo-300 border border-indigo-600 px-1.5 py-0.2 font-mono font-bold">
          {result.totalEntitiesAssimilated} CANALES OFICIALES (ENAC / COPERNICUS)
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[92vw] max-w-4xl max-h-[85vh]"
      headerColorClass="text-indigo-400"
      borderColorClass="border-indigo-500/80"
    >
      <div className="flex flex-col gap-3 font-mono text-xs p-3 text-slate-200 bg-slate-950">
        {/* Banner Metodológico */}
        <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-sky-950/80 border border-indigo-500/60 p-3 rounded flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <div className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Punto Sincronizado: {streetName} (NO₂: {activeNo2} µg/m³)</span>
              <span className="bg-indigo-900 text-indigo-200 text-[8px] font-mono px-1.5 py-0.5 border border-indigo-700">Ventana: 3 Horas</span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-snug">
              Asimilación variacional 4D-Var PINN sobre {result.totalTerrestrialStations} estaciones terrestres de referencia (ISO 17025) + {result.totalSatelliteMissions} misiones satelitales (Copernicus/NASA).
            </p>
          </div>

          <ScientificTooltip position="bottom" width="w-[280px]" content={`Exportar la matriz completa de asimilación para las ${result.totalTerrestrialStations} estaciones terrestres y ${result.totalSatelliteMissions} misiones satelitales en CSV.`}>
            <button
              onClick={handleExportCSV}
              className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-slate-950 text-[10.5px] uppercase font-bold py-2 px-3.5 rounded border border-indigo-400 flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>EXPORTAR FAIR CSV ({result.totalEntitiesAssimilated} ENTIDADES)</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Panel de Controles de Covarianza B y R */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900 p-3 border border-slate-800 rounded">
          <ScientificTooltip position="top" width="w-[280px]" content="Desviación típica del error del modelo a priori (matriz B). Representa la incertidumbre de la física antes de asimilar observaciones.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Incertidumbre Modelo a Priori (σ_b):</span>
                <span className="text-cyan-300 font-bold">{sigmaB.toFixed(1)} µg/m³</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="12.0"
                step="0.5"
                value={sigmaB}
                onChange={(e) => setSigmaB(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Incertidumbre de medición instrumental de las estaciones oficiales (matriz R) certificada según norma europea EN 14211.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Incertidumbre Instrumental EN 14211 (σ_o):</span>
                <span className="text-emerald-300 font-bold">{sigmaO.toFixed(1)} µg/m³</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="6.0"
                step="0.2"
                value={sigmaO}
                onChange={(e) => setSigmaO(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>
        </div>

        {/* Indicadores Clave de Comparación */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Reducción Coste J(x)</span>
            <span className="text-lg font-bold text-indigo-400 font-mono">-{result.costReductionPct}%</span>
            <span className="text-[9px] text-slate-400 block">{result.priorCostJ0} → {result.optimalCostJOpt}</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Consistencia χ² / N</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{result.chiSquareOverN}</span>
            <span className="text-[9px] text-slate-400 block">Óptimo teórico: ~1.00</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Grados Señal (DFS)</span>
            <span className="text-lg font-bold text-amber-400 font-mono">{result.degreesOfFreedomForSignal}</span>
            <span className="text-[9px] text-slate-400 block">De {result.totalEntitiesAssimilated} entidades</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Entidades Asimiladas</span>
            <span className="text-lg font-bold text-cyan-400 font-mono">{result.totalEntitiesAssimilated}</span>
            <span className="text-[9px] text-slate-400 block">{result.totalTerrestrialStations} terr + {result.totalSatelliteMissions} sat</span>
          </div>
        </div>

        {/* Gráfico de Convergencia del Funcional de Coste */}
        <div className="bg-black/90 p-3 border border-slate-800 rounded space-y-2">
          <span className="text-xs font-bold text-indigo-300 block">
            Trayectoria de Descenso del Funcional de Coste 4D-Var: J(x), Fondo J_b y Observaciones J_o
          </span>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.convergenceHistory} margin={{ top: 10, right: 15, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="iteration" stroke="#94a3b8" tick={{ fontSize: 9 }} label={{ value: 'Iteraciones del Operador Adjunto', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }} />
                <YAxis stroke="#818cf8" tick={{ fontSize: 9 }} label={{ value: 'Coste J', angle: -90, position: 'insideLeft', fill: '#818cf8', fontSize: 10 }} />
                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                <Line type="monotone" dataKey="costJ" name="Coste Total J" stroke="#818cf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="costJo" name="Observaciones Jo" stroke="#38bdf8" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="costJb" name="Fondo Jb" stroke="#34d399" strokeWidth={1.5} dot={false} strokeDasharray="2 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Toggle para la vista de la tabla */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
          <button
            onClick={() => setViewTab('terrestrial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10.5px] font-bold font-mono transition-all cursor-pointer ${
              viewTab === 'terrestrial'
                ? 'bg-indigo-900 text-indigo-200 border border-indigo-500'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            <span>ESTACIONES TERRESTRES OFICIALES ({result.totalTerrestrialStations})</span>
          </button>

          <button
            onClick={() => setViewTab('satellites')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10.5px] font-bold font-mono transition-all cursor-pointer ${
              viewTab === 'satellites'
                ? 'bg-cyan-900 text-cyan-200 border border-cyan-500'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Orbit className="w-3.5 h-3.5 text-cyan-400" />
            <span>MISIONES SATELITALES COPERNICUS/NASA ({result.totalSatelliteMissions})</span>
          </button>
        </div>

        {/* Tabla Detallada por Estación o Satélite */}
        <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded p-2 max-h-56">
          {viewTab === 'terrestrial' ? (
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 sticky top-0 bg-slate-900">
                  <th className="py-1 px-1.5">Estación Oficial</th>
                  <th className="py-1 px-1.5">Red / Entorno</th>
                  <th className="py-1 px-1.5">Obs (y)</th>
                  <th className="py-1 px-1.5">Fondo (xb)</th>
                  <th className="py-1 px-1.5 text-cyan-300">EnKF (xa)</th>
                  <th className="py-1 px-1.5 text-indigo-300">4D-Var (xa)</th>
                  <th className="py-1 px-1.5 text-emerald-300">Residuo 4D-Var</th>
                </tr>
              </thead>
              <tbody>
                {result.stationComparisons.map((sc, idx) => (
                  <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                    <td className="py-1 px-1.5 font-bold text-slate-200">{sc.station.name}</td>
                    <td className="py-1 px-1.5 text-slate-400 text-[9px]">{sc.station.network.split('/')[0]}</td>
                    <td className="py-1 px-1.5 text-amber-300">{sc.observedNO2} µg/m³</td>
                    <td className="py-1 px-1.5 text-slate-400">{sc.backgroundNO2} µg/m³</td>
                    <td className="py-1 px-1.5 text-cyan-300 font-bold">{sc.enkfAnalysisNO2}</td>
                    <td className="py-1 px-1.5 text-indigo-300 font-bold">{sc.fourDVarAnalysisNO2}</td>
                    <td className="py-1 px-1.5 text-emerald-400">±{sc.fourDVarResidualUgM3} µg/m³</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 sticky top-0 bg-slate-900">
                  <th className="py-1 px-1.5">Misión Satelital</th>
                  <th className="py-1 px-1.5">Agencia / Órbita</th>
                  <th className="py-1 px-1.5">Resolución</th>
                  <th className="py-1 px-1.5">Observado (y)</th>
                  <th className="py-1 px-1.5">A Priori (xb)</th>
                  <th className="py-1 px-1.5 text-cyan-300">Asimilado 4D-Var</th>
                  <th className="py-1 px-1.5 text-emerald-300">Residuo</th>
                </tr>
              </thead>
              <tbody>
                {result.satelliteComparisons.map((sat, idx) => (
                  <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                    <td className="py-1 px-1.5 font-bold text-slate-200">{sat.mission.name}</td>
                    <td className="py-1 px-1.5 text-slate-400 text-[9px]">{sat.mission.agency}</td>
                    <td className="py-1 px-1.5 text-slate-300 font-mono text-[9px]">{sat.mission.spatialResolution}</td>
                    <td className="py-1 px-1.5 text-amber-300 font-bold">{sat.observedValue} {sat.unit}</td>
                    <td className="py-1 px-1.5 text-slate-400">{sat.backgroundValue}</td>
                    <td className="py-1 px-1.5 text-cyan-300 font-bold">{sat.fourDVarAnalysisValue}</td>
                    <td className="py-1 px-1.5 text-emerald-400">±{sat.residual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DraggableWindow>
  );
};
