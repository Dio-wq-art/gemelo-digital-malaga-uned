import React, { useState } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { 
  Waves, 
  Wind, 
  ShieldCheck, 
  Download, 
  Compass, 
  Thermometer, 
  Sliders, 
  Eye, 
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { computeTiblProfile, generateTiblTransect } from '../lib/tiblCoastalBreeze';

interface IeoCoastalTiblModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IeoCoastalTiblModal: React.FC<IeoCoastalTiblModalProps> = ({
  isOpen,
  onClose
}) => {
  const [fetchDistanceM, setFetchDistanceM] = useState<number>(250); // Distancia desde la orilla (m)
  const [sstTempC, setSstTempC] = useState<number>(18.5); // Temperatura mar SST
  const [landTempC, setLandTempC] = useState<number>(27.0); // Temperatura suelo urbano
  const [breezeSpeedMs, setBreezeSpeedMs] = useState<number>(3.8); // Brisa marina (m/s)
  const [urbanHeatFluxWm2, setUrbanHeatFluxWm2] = useState<number>(120); // Flujo calor sensible H0
  const [coastalQugMs, setCoastalQugMs] = useState<number>(28); // Emisión viaria litoral

  if (!isOpen) return null;

  const currentResult = computeTiblProfile({
    fetchDistanceM,
    seaSurfaceTempC: sstTempC,
    landSurfaceTempC: landTempC,
    seaBreezeSpeedMs: breezeSpeedMs,
    urbanSensibleHeatWm2: urbanHeatFluxWm2,
    marineLapseRateKm: 0.006,
    backgroundNo2UgM3: 16.0,
    coastalEmissionRateUgMs: coastalQugMs
  });

  const transectData = generateTiblTransect({
    seaSurfaceTempC: sstTempC,
    landSurfaceTempC: landTempC,
    seaBreezeSpeedMs: breezeSpeedMs,
    urbanSensibleHeatWm2: urbanHeatFluxWm2,
    marineLapseRateKm: 0.006,
    backgroundNo2UgM3: 16.0,
    coastalEmissionRateUgMs: coastalQugMs
  });

  const handleExportCSV = () => {
    const headers = 'Distancia_m,Sector,h_TIBL_m,NO2_Respirador_ug_m3,Factor_Atrapamiento,SST_C,T_Suelo_C,Brisa_u_ms\n';
    const rows = transectData.map(d => `${d.distanceM},${d.label},${d.tiblHeightM},${d.no2Concentration},${d.trappingFactor},${sstTempC},${landTempC},${breezeSpeedMs}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ieo_csic_tibl_brisa_malaga_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="ACOPLAMIENTO FÍSICO IEO-CSIC — CAPA LÍMITE TÉRMICA INTERNA (TIBL)"
      subtitle="Centro Oceanográfico de Málaga (Muelle San Andrés) & Ecuación de Garratt / Venkatram"
      icon={<Waves className="w-5 h-5 text-cyan-400" />}
      badge={
        <span className="text-[8.5px] bg-cyan-950 text-cyan-300 border border-cyan-600 px-1.5 py-0.2 font-mono font-bold">
          IEO-CSIC • MARETO BAHÍA MÁLAGA
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[92vw] max-w-4xl max-h-[85vh]"
      headerColorClass="text-cyan-400"
      borderColorClass="border-cyan-500/80"
    >
      <div className="flex flex-col gap-3 font-mono text-xs p-3 text-slate-200 bg-slate-950">
        {/* Banner Metrológico IEO-CSIC */}
        <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-blue-950/80 border border-cyan-500/60 p-3 rounded flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <div className="text-xs font-bold text-cyan-300 uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Centro Oceanográfico de Málaga (CSIC - IEO)</span>
              <span className="bg-cyan-900 text-cyan-200 text-[8px] font-mono px-1.5 py-0.5 border border-cyan-700">Muelle 9 San Andrés</span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-snug">
              Modelización analítica de la Capa Límite Térmica Interna Litoral (<strong>h_TIBL(x) = c · √x</strong>) originada por el contraste térmico aire-mar en la Bahía de Málaga y su confinamiento vertical sobre el NO₂ vehicular costero.
            </p>
          </div>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar el transecto de dispersión costera TIBL en formato abierto CSV conforme a los estándares de ciencia abierta FAIR.">
            <button
              onClick={handleExportCSV}
              className="shrink-0 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[10.5px] uppercase font-bold py-2 px-3.5 rounded border border-cyan-400 flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>EXPORTAR FAIR CSV</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Panel de Controles Hidrodinámicos y Térmicos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 p-3 border border-slate-800 rounded">
          <ScientificTooltip position="top" width="w-[280px]" content="Distancia perpendicular desde la línea de costa (orilla de San Andrés/Huelin) hacia el interior urbano.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Distancia Costa (Fetch x):</span>
                <span className="text-cyan-300 font-bold">{fetchDistanceM} m</span>
              </div>
              <input
                type="range"
                min="20"
                max="4000"
                step="20"
                value={fetchDistanceM}
                onChange={(e) => setFetchDistanceM(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Temperatura Superficial del Mar (SST) registrada por la boya oceanográfica MARETO del IEO-CSIC.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">SST Mar de Alborán:</span>
                <span className="text-blue-300 font-bold">{sstTempC.toFixed(1)} °C</span>
              </div>
              <input
                type="range"
                min="14.0"
                max="26.0"
                step="0.2"
                value={sstTempC}
                onChange={(e) => setSstTempC(parseFloat(e.target.value))}
                className="w-full accent-blue-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Temperatura superficial del suelo urbano en distritos litorales (Huelin / San Andrés / Malagueta).">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Temperatura Suelo Urbano:</span>
                <span className="text-amber-300 font-bold">{landTempC.toFixed(1)} °C</span>
              </div>
              <input
                type="range"
                min="18.0"
                max="42.0"
                step="0.5"
                value={landTempC}
                onChange={(e) => setLandTempC(parseFloat(e.target.value))}
                className="w-full accent-amber-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Velocidad de la brisa marina (u) que penetra desde la bahía hacia la ciudad.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Velocidad Brisa Marina (u):</span>
                <span className="text-teal-300 font-bold">{breezeSpeedMs.toFixed(1)} m/s</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.2"
                value={breezeSpeedMs}
                onChange={(e) => setBreezeSpeedMs(parseFloat(e.target.value))}
                className="w-full accent-teal-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Flujo de calor sensible urbano (H0) que impulsa el crecimiento convectivo de la TIBL.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Calor Sensible Urbano (H0):</span>
                <span className="text-orange-300 font-bold">{urbanHeatFluxWm2} W/m²</span>
              </div>
              <input
                type="range"
                min="20"
                max="350"
                step="10"
                value={urbanHeatFluxWm2}
                onChange={(e) => setUrbanHeatFluxWm2(parseInt(e.target.value))}
                className="w-full accent-orange-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Tasa de emisión de tráfico vehicular en arterias costeras de Málaga (Paseo Marítimo Antonio Machado / Muelle Heredia).">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Emisión Viaria Costera:</span>
                <span className="text-rose-300 font-bold">{coastalQugMs} µg/m·s</span>
              </div>
              <input
                type="range"
                min="5"
                max="75"
                step="1"
                value={coastalQugMs}
                onChange={(e) => setCoastalQugMs(parseInt(e.target.value))}
                className="w-full accent-rose-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>
        </div>

        {/* Indicadores Clave TIBL */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Espesor h_TIBL Local</span>
            <span className="text-lg font-bold text-cyan-400 font-mono">{currentResult.tiblHeightM} m</span>
            <span className="text-[9px] text-slate-400 block">Cota de mezcla marina</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Factor Confinamiento</span>
            <span className="text-lg font-bold text-amber-400 font-mono">{currentResult.coastalTrappingFactor}×</span>
            <span className="text-[9px] text-slate-400 block">Amplificación de humo</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">NO₂ Superficial (Respirador)</span>
            <span className="text-lg font-bold text-rose-400 font-mono">{currentResult.groundLevelNo2UgM3} µg/m³</span>
            <span className="text-[9px] text-slate-400 block">Nivel de acera litoral</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Penetración de la Brisa</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{currentResult.penetrationLimitKm} km</span>
            <span className="text-[9px] text-slate-400 block">Límite orográfico cuenca</span>
          </div>
        </div>

        {/* Gráfico del Transecto Costa -> Interior */}
        <div className="bg-black/90 p-3 border border-slate-800 rounded space-y-2">
          <span className="text-xs font-bold text-cyan-300 block">
            Evolución Espacial del Espesor TIBL (m) y NO₂ Superficial (µg/m³) desde la Orilla
          </span>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={transectData} margin={{ top: 10, right: 15, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="left" stroke="#38bdf8" />
                <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" />
                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                <Area yAxisId="left" type="monotone" dataKey="tiblHeightM" name="Espesor TIBL (m)" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.25} />
                <Area yAxisId="right" type="monotone" dataKey="no2Concentration" name="NO₂ Superficie (µg/m³)" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};
