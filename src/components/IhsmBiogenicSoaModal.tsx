import React, { useState } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { 
  Leaf, 
  Wind, 
  ShieldCheck, 
  Download, 
  Sun, 
  Activity, 
  Flame, 
  Compass, 
  Sliders,
  TrendingUp,
  Atom
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { computeIhsmBiogenicSoa } from '../lib/ihsmBiogenicSoa';

interface IhsmBiogenicSoaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IhsmBiogenicSoaModal: React.FC<IhsmBiogenicSoaModalProps> = ({
  isOpen,
  onClose
}) => {
  const [solarParWm2, setSolarParWm2] = useState<number>(450); // Radiación PAR W/m²
  const [tempC, setTempC] = useState<number>(29.5); // Temperatura °C
  const [levanteSpeedKmh, setLevanteSpeedKmh] = useState<number>(18.0); // Viento Levante km/h
  const [urbanNo2UgM3, setUrbanNo2UgM3] = useState<number>(36.0); // NO2 en Málaga
  const [preexistingMo, setPreexistingMo] = useState<number>(6.5); // Mo aerosol orgánico
  const [subtropicalPct, setSubtropicalPct] = useState<number>(65); // % aguacate/mango

  if (!isOpen) return null;

  const currentResult = computeIhsmBiogenicSoa({
    solarRadiationParWm2: solarParWm2,
    airTemperatureC: tempC,
    levanteWindSpeedKmh: levanteSpeedKmh,
    urbanNo2ConcentrationUgM3: urbanNo2UgM3,
    preexistingOrganicAerosolUgM3: preexistingMo,
    subtropicalCanopyFractionPct: subtropicalPct
  });

  // Perfil diurno estimado de 06:00 a 20:00 (15 horas)
  const diurnalProfile = Array.from({ length: 15 }, (_, i) => {
    const hour = 6 + i;
    const par = Math.max(0, Math.sin(((hour - 6) / 14) * Math.PI) * solarParWm2 * 1.15);
    const hourlyTemp = tempC - 4.0 + Math.sin(((hour - 8) / 12) * Math.PI) * 5.0;
    const res = computeIhsmBiogenicSoa({
      solarRadiationParWm2: par,
      airTemperatureC: hourlyTemp,
      levanteWindSpeedKmh: levanteSpeedKmh,
      urbanNo2ConcentrationUgM3: urbanNo2UgM3,
      preexistingOrganicAerosolUgM3: preexistingMo,
      subtropicalCanopyFractionPct: subtropicalPct
    });
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      bvocMassKgH: res.totalBvocMassKgH,
      newSoaUgM3: res.newSoaFormedUgM3,
      panPptv: res.panOrganicNitratesPptv
    };
  });

  const handleExportCSV = () => {
    const headers = 'Hora,BVOC_Total_KgH,Nuevo_SOA_ugM3,PAN_Pptv,PAR_Wm2,Temp_C,Viento_Levante_kmh,NO2_Urbano_ugM3\n';
    const rows = diurnalProfile.map(p => `${p.hour},${p.bvocMassKgH},${p.newSoaUgM3},${p.panPptv},${solarParWm2},${tempC},${levanteSpeedKmh},${urbanNo2UgM3}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ihsm_la_mayora_csic_uma_bvoc_soa_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="BALANCE FOTOQUÍMICO REGIONAL IHSM LA MAYORA (CSIC - UMA) — PRECURSORES BVOC & SOA"
      subtitle="Estación Experimental Algarrobo / Axarquía & Modelo MEGAN / Absorción Pankow"
      icon={<Leaf className="w-5 h-5 text-emerald-400" />}
      badge={
        <span className="text-[8.5px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-1.5 py-0.2 font-mono font-bold">
          IHSM LA MAYORA • CSIC - UMA
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[92vw] max-w-4xl max-h-[85vh]"
      headerColorClass="text-emerald-400"
      borderColorClass="border-emerald-500/80"
    >
      <div className="flex flex-col gap-3 font-mono text-xs p-3 text-slate-200 bg-slate-950">
        {/* Banner Metrológico IHSM La Mayora */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-green-950/80 border border-emerald-500/60 p-3 rounded flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <div className="text-xs font-bold text-emerald-300 uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Instituto de Hortofruticultura Subtropical y Mediterránea La Mayora</span>
              <span className="bg-emerald-900 text-emerald-200 text-[8px] font-mono px-1.5 py-0.5 border border-emerald-700">CSIC - UMA</span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-snug">
              Cuantificación determinista de emisiones de isopreno y monoterpenos procedentes de cultivos subtropicales y monte oriental, su advección por vientos de Levante (34 km) e interacción con el NO₂ urbano para formar Aerosoles Orgánicos Secundarios (SOA) y PAN.
            </p>
          </div>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar la serie temporal de emisiones biogénicas y rendimiento SOA en formato abierto CSV citable.">
            <button
              onClick={handleExportCSV}
              className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10.5px] uppercase font-bold py-2 px-3.5 rounded border border-emerald-400 flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>EXPORTAR FAIR CSV</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Panel de Controles Agroforestales y Atmosféricos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 p-3 border border-slate-800 rounded">
          <ScientificTooltip position="top" width="w-[280px]" content="Radiación fotosintéticamente activa (PAR) registrada en La Mayora. Modula la síntesis enzimática foliar de isopreno.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Radiación PAR Solar:</span>
                <span className="text-amber-300 font-bold">{solarParWm2} W/m²</span>
              </div>
              <input
                type="range"
                min="0"
                max="800"
                step="25"
                value={solarParWm2}
                onChange={(e) => setSolarParWm2(parseInt(e.target.value))}
                className="w-full accent-amber-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Temperatura del aire foliar en La Mayora. Gobierna la volatilización de monoterpenos y la desnaturalización enzimática.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Temperatura Ambiente:</span>
                <span className="text-rose-300 font-bold">{tempC.toFixed(1)} °C</span>
              </div>
              <input
                type="range"
                min="16.0"
                max="42.0"
                step="0.5"
                value={tempC}
                onChange={(e) => setTempC(parseFloat(e.target.value))}
                className="w-full accent-rose-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Velocidad del viento de Levante que transporta los precursores biogénicos desde Algarrobo hasta la Bahía de Málaga.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Viento Levante hacia Málaga:</span>
                <span className="text-cyan-300 font-bold">{levanteSpeedKmh.toFixed(1)} km/h</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={levanteSpeedKmh}
                onChange={(e) => setLevanteSpeedKmh(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Concentración de NO2 vehicular en la cuenca receptora de Málaga con la que reaccionan los radicales peróxido de BVOC.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">NO₂ Urbano Receptor:</span>
                <span className="text-orange-300 font-bold">{urbanNo2UgM3.toFixed(0)} µg/m³</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="2"
                value={urbanNo2UgM3}
                onChange={(e) => setUrbanNo2UgM3(parseFloat(e.target.value))}
                className="w-full accent-orange-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Masa de aerosol orgánico preexistente (Mo) que actúa como fase receptora para la absorción de vapores de baja volatilidad (Pankow 1994).">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Aerosol Orgánico Preexistente:</span>
                <span className="text-purple-300 font-bold">{preexistingMo.toFixed(1)} µg/m³</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="25.0"
                step="0.5"
                value={preexistingMo}
                onChange={(e) => setPreexistingMo(parseFloat(e.target.value))}
                className="w-full accent-purple-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Porcentaje de superficie ocupada por cultivos subtropicales (aguacatero Persea americana y mango) en la vega de Algarrobo.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Fracción Cultivo Subtropical:</span>
                <span className="text-emerald-300 font-bold">{subtropicalPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={subtropicalPct}
                onChange={(e) => setSubtropicalPct(parseInt(e.target.value))}
                className="w-full accent-emerald-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>
        </div>

        {/* Indicadores Clave BVOC & SOA */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Emisión Regional BVOC</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{currentResult.totalBvocMassKgH} kg/h</span>
            <span className="text-[9px] text-slate-400 block">Cuenca oriental Axarquía</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Tiempo Advección a Málaga</span>
            <span className="text-lg font-bold text-cyan-400 font-mono">{currentResult.advectionTravelTimeHours} h</span>
            <span className="text-[9px] text-slate-400 block">34 km por Levante</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Nuevo SOA Formado</span>
            <span className="text-lg font-bold text-purple-400 font-mono">+{currentResult.newSoaFormedUgM3} µg/m³</span>
            <span className="text-[9px] text-slate-400 block">Rendimiento: {currentResult.soaYieldPercent}%</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Peroxiacetil Nitrato (PAN)</span>
            <span className="text-lg font-bold text-amber-400 font-mono">{currentResult.panOrganicNitratesPptv} pptv</span>
            <span className="text-[9px] text-slate-400 block">Nitratos orgánicos acumulados</span>
          </div>
        </div>

        {/* Gráfico Diurno de Emisión BVOC y Formación de SOA */}
        <div className="bg-black/90 p-3 border border-slate-800 rounded space-y-2">
          <span className="text-xs font-bold text-emerald-300 block">
            Evolución Diurna de la Emisión BVOC (kg/h) y Rendimiento de Aerosol Orgánico Secundario SOA (µg/m³)
          </span>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={diurnalProfile} margin={{ top: 10, right: 15, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="left" stroke="#10b981" />
                <YAxis yAxisId="right" orientation="right" stroke="#c084fc" />
                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                <Area yAxisId="left" type="monotone" dataKey="bvocMassKgH" name="Emisión BVOC (kg/h)" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                <Area yAxisId="right" type="monotone" dataKey="newSoaUgM3" name="Nuevo SOA Formado (µg/m³)" stroke="#c084fc" fill="#c084fc" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};
