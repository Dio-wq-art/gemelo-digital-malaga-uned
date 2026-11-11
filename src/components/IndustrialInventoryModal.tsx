import React, { useState, useMemo } from 'react';
import { Factory, Wind, Download, FileJson, FileSpreadsheet, ShieldAlert, Thermometer, Layers, Flame } from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { IndustrialInventoryPlumeDiagram } from './IndustrialInventoryPlumeDiagram';
import { AranaKilnInteractiveDiagram } from './AranaKilnInteractiveDiagram';
import {
  calculateIndustrialInventorySummary,
  exportIndustrialGeoJson,
  exportIndustrialCsv,
} from '../lib/industrialInventoryPlume';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface IndustrialInventoryModalProps {
  onClose: () => void;
}

export function IndustrialInventoryModal({ onClose }: IndustrialInventoryModalProps) {
  const [terralSpeed, setTerralSpeed] = useState<number>(5.2); // Viento de Terral fuerte
  const [terralDir, setTerralDir] = useState<number>(315); // NW -> SE
  const [airTempC, setAirTempC] = useState<number>(32); // Calor de Terral

  const summary = useMemo(() => {
    return calculateIndustrialInventorySummary(terralSpeed, terralDir, airTempC);
  }, [terralSpeed, terralDir, airTempC]);

  const chartData = useMemo(() => {
    return summary.facilities.map((f) => ({
      name: f.facilityId === 'ind_arana_cementos'
        ? 'Cementera Araña'
        : f.facilityName
            .replace('Planta de Hormigón y Mezclas Asfálticas ', 'Hormigón ')
            .replace('Centro Logístico Pesado Diésel ', 'Logística ')
            .replace('Tenería y Procesamiento Térmico ', 'Tenería ')
            .replace('Central de Generación Auxiliar Calderas ', 'Calderas '),
      nox: f.noxGMs,
      so2: f.so2GMs,
      pm10: f.pm10GMs,
      impactTeatinos: f.downwindTeatinosUgm3NO2,
    }));
  }, [summary]);

  const handleDownloadGeoJson = () => {
    const jsonStr = exportIndustrialGeoJson(summary);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `industria_guadalhorce_terral_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const csvStr = exportIndustrialCsv(summary);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario_industrial_malaga_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="Micro-Inventario Industrial y Logístico (Guadalhorce, Viso, San Luis, La Araña)"
      subtitle="Emisiones fijas puntuales (E-PRTR), chimeneas Holland/Briggs y advección por Viento de Terral"
      icon={<Factory className="w-4 h-4 text-orange-400" />}
      badge={
        <span className="text-[9px] bg-orange-950 text-orange-300 border border-orange-700 px-1.5 py-0.5 font-mono font-bold">
          NOₓ Industrial: {summary.totalEmissionsKgH.nox} kg/h | Impacto Teatinos: +{summary.impactOnDistrictsUgm3.teatinosAvgNO2} µg/m³
        </span>
      }
      onClose={onClose}
      headerColorClass="text-orange-400"
      borderColorClass="border-slate-700"
      className="w-full max-w-5xl"
      initialPositionClass="top-6 left-1/2 -translate-x-1/2"
    >
      <div className="flex flex-col gap-4 p-4 bg-[#0a0f18] text-slate-200 max-h-[80vh] overflow-y-auto">
        {/* Diagrama Interactivo a Color del Macro-Emisor Cementera La Araña */}
        <AranaKilnInteractiveDiagram
          ambientTempC={airTempC}
          liveWindSpeedMs={terralSpeed}
          liveWindDirDeg={terralDir}
        />

        {/* PARÁMETROS DEL VIENTO DE TERRAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 p-3 flex flex-col gap-3">
            <h3 className="text-[10px] uppercase font-bold text-orange-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <Wind className="w-3.5 h-3.5" /> Episodio de Terral (Noroeste N/NW)
            </h3>

            <ScientificTooltip
              position="bottom"
              width="w-[300px]"
              content="Velocidad del Viento de Terral (m/s). El Terral recalienta la masa de aire al descender de los Montes de Málaga y transporta la pluma industrial de Guadalhorce hacia la costa."
            >
              <div className="space-y-1.5 cursor-help">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Velocidad del Terral (m/s)</span>
                  <span className="font-mono text-orange-300 font-bold">{terralSpeed} m/s</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="14.0"
                  step="0.2"
                  value={terralSpeed}
                  onChange={(e) => setTerralSpeed(parseFloat(e.target.value))}
                  className="w-full accent-orange-500 bg-slate-800 h-1.5 rounded"
                />
              </div>
            </ScientificTooltip>

            <ScientificTooltip
              position="bottom"
              width="w-[300px]"
              content="Dirección del viento en grados (315° = Noroeste pura de Terral). Conecta directamente el polígono Guadalhorce con Teatinos y Carretera de Cádiz."
            >
              <div className="space-y-1.5 cursor-help">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Dirección del Viento (° N)</span>
                  <span className="font-mono text-amber-300 font-bold">{terralDir}° NW</span>
                </div>
                <input
                  type="range"
                  min="270"
                  max="360"
                  step="5"
                  value={terralDir}
                  onChange={(e) => setTerralDir(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded"
                />
              </div>
            </ScientificTooltip>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 flex flex-col justify-between">
            <h3 className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <Flame className="w-3.5 h-3.5" /> Impacto por Advección en Distritos Residenciales
            </h3>

            <div className="space-y-1.5 text-xs">
              <ScientificTooltip position="left" width="w-[300px]" content="Incremento modelizado de NO2 en el distrito residencial y universitario de Teatinos debido al transporte advectivo de emisiones industriales del Valle del Guadalhorce bajo vientos de Terral.">
                <div className="flex justify-between border-b border-slate-800/60 pb-1 cursor-help">
                  <span className="text-slate-400">Impacto Teatinos (NO₂):</span>
                  <span className="font-mono text-orange-400 font-bold">+{summary.impactOnDistrictsUgm3.teatinosAvgNO2} µg/m³</span>
                </div>
              </ScientificTooltip>

              <ScientificTooltip position="left" width="w-[300px]" content="Concentración adicional de partículas PM10 transportadas desde instalaciones de tratamiento de áridos y logística hacia el corredor densamente poblado de Carretera de Cádiz.">
                <div className="flex justify-between border-b border-slate-800/60 pb-1 cursor-help">
                  <span className="text-slate-400">Impacto Carretera de Cádiz (PM₁₀):</span>
                  <span className="font-mono text-amber-300 font-bold">+{summary.impactOnDistrictsUgm3.carreteraCadizAvgPM10} µg/m³</span>
                </div>
              </ScientificTooltip>

              <ScientificTooltip position="left" width="w-[300px]" content="Aporte advectivo de NO2 sobre Cruz de Humilladero derivado de focos fijos industriales y combustión en calderas de cogeneración.">
                <div className="flex justify-between cursor-help">
                  <span className="text-slate-400">Impacto Cruz Humilladero (NO₂):</span>
                  <span className="font-mono text-cyan-300 font-bold">+{summary.impactOnDistrictsUgm3.cruzHumilladeroAvgNO2} µg/m³</span>
                </div>
              </ScientificTooltip>
            </div>
          </div>
        </div>

        {/* DIAGRAMA VECTORIAL ANIMADO DE ELEVACIÓN DE BRIGGS & PENACHO INDUSTRIAL */}
        <IndustrialInventoryPlumeDiagram
          terralSpeed={terralSpeed}
          terralDir={terralDir}
          airTempC={airTempC}
          facilities={summary.facilities}
        />

        {/* GRÁFICO RECHARTS DE EMISIONES POR PLANTA INDUSTRIAL */}
        <div className="bg-slate-900/90 border border-slate-800 p-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-orange-400" /> Tasas de Emisión Industrial (g/s) por Instalación
          </h4>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#f97316" tick={{ fontSize: 10 }} unit="g/s" />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="nox" name="NOₓ [g/s]" fill="#f97316" />
                <Bar dataKey="so2" name="SO₂ [g/s]" fill="#f59e0b" />
                <Bar dataKey="pm10" name="PM₁₀ [g/s]" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BOTONES DE EXPORTACIÓN FAIR */}
        <div className="flex justify-between items-center border-t border-slate-800 pt-3">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
            <span>Conforme a Directiva 2010/75/UE (DEI) y Guía EMEP/EEA 2023. Cero datos aleatorios.</span>
          </div>

          <div className="flex gap-2">
            <ScientificTooltip position="top" width="w-[280px]" content="Exportación FAIR en formato GeoJSON de las instalaciones industriales georreferenciadas con sus caudales y tasas másicas de emisión (NOx, SO2, PM10).">
              <button
                onClick={handleDownloadGeoJson}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 font-mono font-bold transition-colors"
              >
                <FileJson className="w-3.5 h-3.5 text-orange-400" /> GeoJSON Industrial
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="top" width="w-[280px]" content="Exportación tabular CSV del inventario de emisiones puntuales del polígono Guadalhorce y su balance de dispersión hacia distritos residenciales.">
              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 bg-orange-950 hover:bg-orange-900 text-orange-200 border border-orange-700 text-xs px-3 py-1.5 font-mono font-bold transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-orange-300" /> CSV FAIR Science
              </button>
            </ScientificTooltip>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
}
