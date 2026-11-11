import React, { useState } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { 
  Layers, 
  Wind, 
  ShieldCheck, 
  Download, 
  Radar, 
  Eye, 
  Sun, 
  Radio, 
  Sliders,
  Sparkles,
  TrendingDown
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
import { computeVerticalLidarRadarAssimilation } from '../lib/verticalLidarAssimilation';

interface VerticalLidarRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VerticalLidarRadarModal: React.FC<VerticalLidarRadarModalProps> = ({
  isOpen,
  onClose
}) => {
  const [columnAod, setColumnAod] = useState<number>(0.42); // AOD total
  const [pblHeightM, setPblHeightM] = useState<number>(750); // Cota zi (m)
  const [dustTopM, setDustTopM] = useState<number>(2800); // Tope de la calima (m)
  const [surfacePm10, setSurfacePm10] = useState<number>(38.0); // PM10 en suelo
  const [radarWindKmh, setRadarWindKmh] = useState<number>(45.0); // Viento en radar Mijas

  if (!isOpen) return null;

  const result = computeVerticalLidarRadarAssimilation({
    totalColumnAod550: columnAod,
    pblHeightMeters: pblHeightM,
    saharanDustLayerTopM: dustTopM,
    groundLevelPm10UgM3: surfacePm10,
    groundLevelNo2UgM3: 28.0,
    radarDopplerWindSpeedKmh: radarWindKmh
  });

  const handleExportCSV = () => {
    const headers = 'Altitud_m,Extincion_alpha_km1,Retrodispersion_beta_km1_sr1,Despolarizacion_delta,Viento_ms,Tipo_Particula\n';
    const rows = result.levels.map(l => `${l.altitudeM},${l.extinctionCoeffKm1},${l.backscatterBetaKm1Sr1},${l.depolarizationRatio},${l.windSpeedMs},${l.particleType}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lidar_caliop_radar_mijas_perfil_vertical_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="ASIMILACIÓN VERTICAL MULTI-CAPA: LIDAR HSRL ATLID EarthCARE (355 nm) & RADAR DOPPLER MIJAS"
      subtitle="Desacoplamiento de Calima Sahariana en Altura vs Respirabilidad a Cota de Acera"
      icon={<Radar className="w-5 h-5 text-amber-400" />}
      badge={
        <span className="text-[8.5px] bg-amber-950 text-amber-300 border border-amber-600 px-1.5 py-0.2 font-mono font-bold">
          ESA/JAXA EarthCARE ATLID • AEMET RADAR MIJAS
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[92vw] max-w-4xl max-h-[85vh]"
      headerColorClass="text-amber-400"
      borderColorClass="border-amber-500/80"
    >
      <div className="flex flex-col gap-3 font-mono text-xs p-3 text-slate-200 bg-slate-950">
        {/* Banner Metrológico Lidar-Radar */}
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border border-amber-500/60 p-3 rounded flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-300 uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Inversión Lidar Klett-Fernald & Radar Doppler VAD</span>
              <span className="bg-amber-900 text-amber-200 text-[8px] font-mono px-1.5 py-0.5 border border-amber-700">532 nm Polarimétrico</span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-snug">
              Desacopla la señal del polvo sahariano suspendido en capas elevadas (1.500–3.000 m) de las nanopartículas de combustión vehicular y aerosol marino confinados en la capa límite superficial (0–750 m), evitando la sobreestimación del riesgo respiratorio en superficie.
            </p>
          </div>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar el corte vertical Lidar-Radar en formato abierto CSV conforme a estándares FAIR.">
            <button
              onClick={handleExportCSV}
              className="shrink-0 bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10.5px] uppercase font-bold py-2 px-3.5 rounded border border-amber-400 flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>EXPORTAR FAIR CSV</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Panel de Controles Atmosféricos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 p-3 border border-slate-800 rounded">
          <ScientificTooltip position="top" width="w-[280px]" content="Espesor Óptico de Aerosol total en columna (AOD a 550nm) obtenido por satélite MODIS o el fotómetro solar AERONET UMA.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">AOD Columna Total:</span>
                <span className="text-amber-300 font-bold">{columnAod.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.20"
                step="0.02"
                value={columnAod}
                onChange={(e) => setColumnAod(parseFloat(e.target.value))}
                className="w-full accent-amber-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Altura de la Capa Límite Planetaria (zi) que confina la dispersión de contaminantes urbanos.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Altura Capa Límite (zi):</span>
                <span className="text-cyan-300 font-bold">{pblHeightM} m</span>
              </div>
              <input
                type="range"
                min="350"
                max="1600"
                step="25"
                value={pblHeightM}
                onChange={(e) => setPblHeightM(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Cota superior de la capa de calima sahariana detectada por retrodispersión Lidar CALIOP.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Tope Capa Calima:</span>
                <span className="text-orange-300 font-bold">{dustTopM} m</span>
              </div>
              <input
                type="range"
                min="1200"
                max="4000"
                step="50"
                value={dustTopM}
                onChange={(e) => setDustTopM(parseInt(e.target.value))}
                className="w-full accent-orange-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="PM10 registrado por los analizadores de referencia en estaciones a cota de calle (Carranque, Hilera, Puerto).">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">PM₁₀ en Superficie:</span>
                <span className="text-rose-300 font-bold">{surfacePm10.toFixed(1)} µg/m³</span>
              </div>
              <input
                type="range"
                min="10.0"
                max="110.0"
                step="1.0"
                value={surfacePm10}
                onChange={(e) => setSurfacePm10(parseFloat(e.target.value))}
                className="w-full accent-rose-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Velocidad del viento libre en cresta (1150m) registrada por el Radar Doppler de Sierra de Mijas.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Viento Radar Mijas:</span>
                <span className="text-teal-300 font-bold">{radarWindKmh.toFixed(1)} km/h</span>
              </div>
              <input
                type="range"
                min="10"
                max="85"
                step="2"
                value={radarWindKmh}
                onChange={(e) => setRadarWindKmh(parseFloat(e.target.value))}
                className="w-full accent-teal-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <div className="space-y-1 flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 block uppercase">Diagnóstico Vertical</span>
            <span className="text-xs font-bold text-amber-300 font-mono">
              {result.diagnosis === 'ELEVATED_SAHARAN_LAYER' && 'CAPA SAHARIANA EN ALTURA'}
              {result.diagnosis === 'SURFACE_DOMINATED' && 'PREDOMINIO DE EMISIÓN URBANA'}
              {result.diagnosis === 'PRISTINE_VERTICAL_COLUMN' && 'ATMÓSFERA PRÍSTINA'}
            </span>
          </div>
        </div>

        {/* Indicadores Clave de Desacoplamiento */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">% AOD Superficie (0-zi)</span>
            <span className="text-lg font-bold text-cyan-400 font-mono">{result.pblAodFractionPct}%</span>
            <span className="text-[9px] text-slate-400 block">Fracción urbana respirable</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">% AOD Calima en Altura</span>
            <span className="text-lg font-bold text-amber-400 font-mono">{result.elevatedDustAodFractionPct}%</span>
            <span className="text-[9px] text-slate-400 block">No inhalable en calle</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Carga de Calima en Altura</span>
            <span className="text-lg font-bold text-orange-400 font-mono">{result.loftedDustMassTonnesKm2} t/km²</span>
            <span className="text-[9px] text-slate-400 block">Masa mineral flotante</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Cizalladura Radar Mijas</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{result.radarWindShearS1} s⁻¹</span>
            <span className="text-[9px] text-slate-400 block">Gradiente vertical VAD</span>
          </div>
        </div>

        {/* Gráfico del Perfil Vertical (0 a 4000 m AGL) */}
        <div className="bg-black/90 p-3 border border-slate-800 rounded space-y-2">
          <span className="text-xs font-bold text-amber-300 block">
            Corte Vertical CALIOP: Coeficiente de Extinción Óptica α(z) (km⁻¹) y Despolarización δ(z)
          </span>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.levels} margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="altitudeM" stroke="#94a3b8" tick={{ fontSize: 9 }} label={{ value: 'Cota z sobre el suelo (m)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }} />
                <YAxis yAxisId="left" stroke="#f59e0b" tick={{ fontSize: 9 }} label={{ value: 'Extinción α (km⁻¹)', angle: -90, position: 'insideLeft', fill: '#f59e0b', fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" tick={{ fontSize: 9 }} domain={[0, 0.45]} label={{ value: 'Despolarización δ', angle: 90, position: 'insideRight', fill: '#38bdf8', fontSize: 10 }} />
                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                <ReferenceLine x={pblHeightM} stroke="#10b981" strokeDasharray="3 3" label={{ value: `zi = ${pblHeightM}m`, fill: '#10b981', fontSize: 9 }} />
                <Line yAxisId="left" type="monotone" dataKey="extinctionCoeffKm1" name="Extinción α (km⁻¹)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="depolarizationRatio" name="Despolarización δ" stroke="#38bdf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};
