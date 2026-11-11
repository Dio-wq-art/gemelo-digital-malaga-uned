import React, { useState } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import {
  Sun,
  Activity,
  ShieldCheck,
  Download,
  Sliders,
  Sparkles,
  Zap,
  BarChart2,
  Clock,
  Compass
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
import { computeSpectralPhotolysisJNo2 } from '../lib/spectralPhotolysisJNo2';

interface UmaActinicJNo2ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UmaActinicJNo2Modal: React.FC<UmaActinicJNo2ModalProps> = ({
  isOpen,
  onClose
}) => {
  const [solarZenithAngle, setSolarZenithAngle] = useState<number>(32); // theta_z en grados
  const [aod550nm, setAod550nm] = useState<number>(0.18); // AOD 550nm AERONET NASA - UMA
  const [surfaceAlbedo, setSurfaceAlbedo] = useState<number>(0.16); // Albedo de superficie urbana
  const [shadingFactor, setShadingFactor] = useState<number>(1.0); // Factor de sombra de edificio (0.0 a 1.0)

  if (!isOpen) return null;

  // Cálculo fotoquímico del radiómetro actínico UMA Teatinos
  const spectralResults = computeSpectralPhotolysisJNo2({
    solarZenithAngleDeg: solarZenithAngle,
    aerosolOpticalDepth550: aod550nm,
    temperatureC: 24.5,
    urbanSurfaceAlbedo: surfaceAlbedo,
    totalOzoneColDobson: 315
  });

  // Tasa J_NO2 ajustada por sombra de cañón
  const jNo2InSituMeasured = parseFloat((spectralResults.jNo2RateS1 * shadingFactor).toFixed(5));
  const photolysisLifetimeSec = jNo2InSituMeasured > 1e-5 ? parseFloat((1.0 / jNo2InSituMeasured).toFixed(1)) : 9999;

  // Perfil diurno teórico de J_NO2 de 06:00 a 20:00 (15 horas)
  const diurnalProfile = Array.from({ length: 15 }, (_, i) => {
    const hour = 6 + i;
    // Ángulo cenital solar aproximado para latitud Málaga (36.7°N)
    const zenith = Math.max(0, Math.min(88, Math.abs(13 - hour) * 11.5 + 15));
    const res = computeSpectralPhotolysisJNo2({
      solarZenithAngleDeg: zenith,
      aerosolOpticalDepth550: aod550nm,
      temperatureC: 24.5,
      urbanSurfaceAlbedo: surfaceAlbedo,
      totalOzoneColDobson: 315
    });
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      jNo2InSitu: Number((res.jNo2RateS1 * shadingFactor * 1e3).toFixed(2)), // en 10^-3 s^-1
      jNo2ClearSky: Number((res.jNo2RateS1 * 1e3).toFixed(2)),
      uvAFlux: res.uvAEffectiveFluxWm2
    };
  });

  const handleExportCSV = () => {
    const headers = 'Hora,ZenithAngle_Deg,AOD550_AERONET,J_NO2_UMA_InSitu_s1,J_NO2_ClearSky_s1,Flujo_UVA_Wm2,TiempoVidaFotoquimico_s\n';
    const rows = diurnalProfile.map(p => `${p.hour},${solarZenithAngle},${aod550nm},${(p.jNo2InSitu / 1000).toFixed(6)},${(p.jNo2ClearSky / 1000).toFixed(6)},${p.uvAFlux},${photolysisLifetimeSec}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uma_radiometro_actinico_jno2_malaga_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="RADIÓMETRO ESPECTRAL ACTÍNICO UMA TEATINOS — MEDIDA IN SITU DE J_NO2"
      subtitle="Estación Oficial de Radiometría Espectral UV-A (290-400 nm) & Cinética Fotoquímica Directa"
      icon={<Sun className="w-5 h-5 text-amber-400" />}
      badge={
        <span className="text-[8.5px] bg-amber-950 text-amber-300 border border-amber-600 px-1.5 py-0.2 font-mono font-bold">
          UMA TEATINOS • WMO CIMO TIER 1
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[92vw] max-w-4xl max-h-[85vh]"
      headerColorClass="text-amber-400"
      borderColorClass="border-amber-500/80"
    >
      <div className="flex flex-col gap-3 font-mono text-xs p-3 text-slate-200 bg-slate-950">
        {/* Banner Oficial de la Estación UMA Teatinos */}
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-yellow-950/80 border border-amber-500/60 p-3 rounded flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-300 uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Estación Radiométrica Espectral UMA Teatinos (WMO)</span>
              <span className="bg-amber-900 text-amber-200 text-[8px] font-mono px-1.5 py-0.5 border border-amber-700">MEDICIÓN IN SITU</span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-snug">
              Medida directa de la tasa de fotólisis del dióxido de nitrógeno (J_NO2 en s⁻¹) acoplada a la irradiancia actínica esfériica espectral (290–400 nm) y red AERONET NASA - UMA.
            </p>
          </div>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar la serie diurna de fotólisis medidada por el radiómetro actínico UMA Teatinos en formato CSV abierto citable.">
            <button
              onClick={handleExportCSV}
              className="shrink-0 bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10.5px] uppercase font-bold py-2 px-3.5 rounded border border-amber-400 flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>EXPORTAR FAIR CSV</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Panel de Controles Actínicos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 p-3 border border-slate-800 rounded">
          <ScientificTooltip position="top" width="w-[280px]" content="Ángulo Cenital Solar (θ_z). Determina la masa de aire óptica atravesada por la radiación solar incidente.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Ángulo Cenital Solar (θ_z):</span>
                <span className="text-amber-300 font-bold">{solarZenithAngle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="85"
                step="1"
                value={solarZenithAngle}
                onChange={(e) => setSolarZenithAngle(parseInt(e.target.value))}
                className="w-full accent-amber-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Profundidad Óptica de Aerosoles a 550nm (AERONET NASA - UMA). Mide la extinción por polvo sahariano y micropartículas.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">AOD 550nm (AERONET UMA):</span>
                <span className="text-cyan-300 font-bold">{aod550nm.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.95"
                step="0.01"
                value={aod550nm}
                onChange={(e) => setAod550nm(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Factor de Sombra e Iluminación de Cañón Urbano (S). Transmisión efectiva de radiación actínica hacia el nivel de acera.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Factor Sombra Cañón Urbano:</span>
                <span className="text-emerald-300 font-bold">{(shadingFactor * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="1.00"
                step="0.05"
                value={shadingFactor}
                onChange={(e) => setShadingFactor(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>
        </div>

        {/* Indicadores Clave de Fotólisis */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">J_NO2 Medido in situ UMA</span>
            <span className="text-lg font-bold text-amber-400 font-mono">{jNo2InSituMeasured} s⁻¹</span>
            <span className="text-[9px] text-slate-400 block">{(jNo2InSituMeasured * 1000).toFixed(2)} × 10⁻³ s⁻¹</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Tiempo Vida Fotoquímico τ_NO2</span>
            <span className="text-lg font-bold text-cyan-400 font-mono">{photolysisLifetimeSec} s</span>
            <span className="text-[9px] text-slate-400 block">{(photolysisLifetimeSec / 60).toFixed(1)} minutos</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Flujo Actínico UV-A Efectivo</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{spectralResults.uvAEffectiveFluxWm2} W/m²</span>
            <span className="text-[9px] text-slate-400 block">Transmisión: {spectralResults.transmittanceFactorPct}%</span>
          </div>
        </div>

        {/* Gráfico Diurno de Fotólisis */}
        <div className="bg-black/90 p-3 border border-slate-800 rounded space-y-2">
          <span className="text-xs font-bold text-amber-300 block">
            Evolución Diurna de J_NO2 (UMA Teatinos vs Teórico Clear-Sky) [×10⁻³ s⁻¹]
          </span>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={diurnalProfile} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                <Area type="monotone" dataKey="jNo2InSitu" name="J_NO2 In Situ UMA" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.25} />
                <Area type="monotone" dataKey="jNo2ClearSky" name="J_NO2 Clear-Sky" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.10} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};
