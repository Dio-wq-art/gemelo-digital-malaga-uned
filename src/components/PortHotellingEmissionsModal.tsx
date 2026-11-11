import React, { useState, useEffect, useMemo } from 'react';
import { 
  Anchor, Ship, Fuel, Flame, AlertCircle, RefreshCw, Layers, 
  ArrowUpRight, MapPin, Wind, Thermometer, ShieldAlert, Download, 
  FileJson, FileSpreadsheet 
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import {
  calculatePortEmissionsAndPlume,
  exportPortGeoJson,
  exportPortCsv,
  MALAGA_PORT_BERTHS,
  PasquillStabilityClass,
} from '../lib/portEmissionsBriggs';
import { PRESET_ZONES, Zone } from '../lib/zones';
import { fetchLiveZoneTelemetry } from '../lib/liveZoneTelemetry';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { BriggsPlumeRiseDiagram } from './BriggsPlumeRiseDiagram';
import { useActivePoint } from '../context/ActivePointContext';

interface VesselEmission {
  imo: string;
  name: string;
  type: string;
  dock: string;
  lat: number;
  lon: number;
  status: string;
  auxiliaryEnginePowerKw: number;
  fuelType: string;
  emissionsKgPerHour: {
    nox: number;
    so2: number;
    pm25: number;
    co2: number;
  };
}

interface PortHotellingData {
  source: string;
  timestamp: string;
  portLocation: string;
  activeVesselsCount: number;
  hotellingTotalsPerHourKg: {
    noxKgHour: number;
    so2KgHour: number;
    pm25KgHour: number;
    co2KgHour: number;
  };
  plumeDispersionEffect: string;
  vessels: VesselEmission[];
}

interface PortHotellingModalProps {
  onClose: () => void;
  initialTab?: 'hotelling' | 'briggs';
  onFlyTo?: (lat: number, lon: number) => void;
}

export const PortHotellingEmissionsModal: React.FC<PortHotellingModalProps> = ({ 
  onClose, 
  initialTab = 'hotelling',
  onFlyTo 
}) => {
  const activeCtx = useActivePoint();
  const activePoint = activeCtx?.activePoint;
  const assimilation = activeCtx?.assimilation;
  const [activeTab, setActiveTab] = useState<'hotelling' | 'briggs'>(initialTab);

  // Live hotelling vessels state
  const [data, setData] = useState<PortHotellingData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);

  // Briggs Plume rise analytical parameters
  const [activeZone, setActiveZone] = useState<Zone>(
    PRESET_ZONES.find(z => z.tag.includes("Port") || z.name.includes("Puerto") || z.name.includes("Parque")) || PRESET_ZONES[1] || PRESET_ZONES[0]
  );
  const [activeBerthsCount, setActiveBerthsCount] = useState<number>(4);
  const [fuelSulfurPct, setFuelSulfurPct] = useState<number>(0.1); // 0.1% ECA
  const [airTempC, setAirTempC] = useState<number>(assimilation?.temperatureC ?? 24);
  const [windSpeedMs, setWindSpeedMs] = useState<number>(assimilation?.windSpeedMs ?? 3.8);
  const [windDirDeg, setWindDirDeg] = useState<number>(assimilation?.windDirectionDeg ?? 190); // Brisa marina Sur -> Norte
  const [stabilityClass, setStabilityClass] = useState<PasquillStabilityClass>('D');
  const [telemetryFeedback, setTelemetryFeedback] = useState<string | null>(null);

  const fetchPortEmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/malaga-open-data/port-emissions-hotelling');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.vessels?.length > 0 && !selectedVessel) {
          setSelectedVessel(json.vessels[0].imo);
        }
      }
    } catch (err) {
      console.error('Error fetching port emissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortEmissions();
  }, []);

  // Sincronización reactiva inmediata con el punto activo seleccionado en el mapa (ActivePointContext)
  useEffect(() => {
    if (!activePoint && !assimilation) return;
    if (activePoint) {
      let closestZone = PRESET_ZONES[0];
      let minDist = Infinity;
      for (const z of PRESET_ZONES) {
        const d = Math.hypot(z.lat - activePoint.lat, z.lon - activePoint.lon);
        if (d < minDist) {
          minDist = d;
          closestZone = z;
        }
      }
      setActiveZone(closestZone);
    }
    if (assimilation) {
      setAirTempC(Number(assimilation.temperatureC.toFixed(1)));
      setWindSpeedMs(Number(assimilation.windSpeedMs.toFixed(1)));
      setWindDirDeg(Math.round(assimilation.windDirectionDeg));
      const rad = assimilation.solarRadiationWm2 ?? 550;
      const u = assimilation.windSpeedMs;
      let pasquill: PasquillStabilityClass = 'D';
      if (rad > 650 && u < 3.0) pasquill = 'B';
      else if (rad > 350 && u < 5.0) pasquill = 'C';
      else if (rad < 40 && u < 2.5) pasquill = 'E';
      setStabilityClass(pasquill);
      setTelemetryFeedback(
        `ActivePoint Sync • [${activePoint?.streetName || 'Puerto/Málaga'}] T=${assimilation.temperatureC.toFixed(1)}°C, Viento=${assimilation.windSpeedMs.toFixed(1)}m/s (${Math.round(assimilation.windDirectionDeg)}°), Pasquill=${pasquill}`
      );
    }
  }, [activePoint, assimilation]);

  // Live coastal meteo assimilation when user changes zone manually
  useEffect(() => {
    if (activePoint) return;
    let isMounted = true;
    fetchLiveZoneTelemetry(activeZone).then(tel => {
      if (!isMounted) return;
      setAirTempC(tel.meteo.tempC);
      setWindSpeedMs(tel.meteo.windSpeedMs);
      setWindDirDeg(tel.meteo.windDirDeg);
      setTelemetryFeedback(`${tel.source} • T=${tel.meteo.tempC}°C, Viento=${tel.meteo.windSpeedKmh}km/h (${tel.meteo.windSpeedMs}m/s), Dir=${tel.meteo.windDirDeg}°`);
    }).catch(err => console.warn(err));
    return () => { isMounted = false; };
  }, [activeZone]);

  const summary = useMemo(() => {
    return calculatePortEmissionsAndPlume(
      airTempC,
      windSpeedMs,
      windDirDeg,
      fuelSulfurPct,
      activeBerthsCount,
      stabilityClass
    );
  }, [airTempC, windSpeedMs, windDirDeg, fuelSulfurPct, activeBerthsCount, stabilityClass]);

  const plumeChartData = useMemo(() => {
    const mainBerth = summary.berths[0];
    if (!mainBerth) return [];

    const resultData = [];
    const stackH = mainBerth.briggsParams.stackHeightM;
    const deltaH = mainBerth.briggsParams.plumeRiseDeltaHM;
    const xMax = mainBerth.briggsParams.maxConcentrationDistM;
    const peakSo2 = mainBerth.briggsParams.maxGroundConcentrationUgm3.so2;
    const peakNox = mainBerth.briggsParams.maxGroundConcentrationUgm3.nox;

    for (let x = 0; x <= 2000; x += 100) {
      const fraction = Math.min(1.0, Math.pow(x / Math.max(1, xMax), 0.66));
      const zPlume = stackH + deltaH * fraction;
      const xRatio = x / Math.max(1, xMax);
      const cSo2 = peakSo2 * Math.exp(-0.5 * Math.pow(Math.log(Math.max(0.01, xRatio)), 2));
      const cNox = peakNox * Math.exp(-0.5 * Math.pow(Math.log(Math.max(0.01, xRatio)), 2));

      resultData.push({
        xM: x,
        zPlumeM: parseFloat(zPlume.toFixed(1)),
        cSo2Ugm3: parseFloat(cSo2.toFixed(1)),
        cNoxUgm3: parseFloat(cNox.toFixed(1)),
      });
    }
    return resultData;
  }, [summary]);

  const handleDownloadGeoJson = () => {
    const jsonStr = exportPortGeoJson(summary);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `puerto_malaga_briggs_plume_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const csvStr = exportPortCsv(summary);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `puerto_malaga_emisiones_emep_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeVessel = data?.vessels?.find(v => v.imo === selectedVessel) || data?.vessels?.[0];

  return (
    <DraggableWindow
      title="Emisiones Portuarias Tier 3 EMEP/EEA, Hotelling y Pluma de Briggs"
      subtitle="Modelo determinista de buques atracados (Muelles 1, 2, 3, 9) y advección por brisa marina hacia Alameda/Parque"
      icon={<Anchor className="w-4 h-4 text-cyan-400" />}
      badge={
        <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-1.5 py-0.5 font-mono font-bold">
          SO₂: {summary.totalEmissionsKgH.so2} kg/h | NOₓ: {summary.totalEmissionsKgH.nox} kg/h
        </span>
      }
      onClose={onClose}
      headerColorClass="text-cyan-400"
      borderColorClass="border-slate-700"
      className="w-full max-w-5xl"
      initialPositionClass="top-6 left-1/2 -translate-x-1/2"
    >
      <div className="flex flex-col gap-4 p-4 bg-[#0a0f18] text-slate-200 max-h-[80vh] overflow-y-auto font-sans text-xs">
        {/* SUBTABS */}
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('hotelling')}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded-sm transition-colors ${
              activeTab === 'hotelling'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            1. Buques Atracados en Vivo (Hotelling EMEP/EEA)
          </button>
          <button
            onClick={() => setActiveTab('briggs')}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded-sm transition-colors ${
              activeTab === 'briggs'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            2. Pluma Térmica y Elevación de Briggs (Gaussiana)
          </button>
        </div>

        {activeTab === 'hotelling' && (
          <div className="space-y-4 select-text">
            {/* Top Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded">
                <div className="text-[9px] font-mono text-slate-400 uppercase">NOx Total en Muelle</div>
                <div className="text-base font-bold text-amber-300 font-mono flex items-center gap-1.5 mt-0.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>{data?.hotellingTotalsPerHourKg?.noxKgHour || summary.totalEmissionsKgH.nox} kg/h</span>
                </div>
                <div className="text-[8px] text-slate-500 font-mono mt-0.5">Generadores Diésel Marinos</div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded">
                <div className="text-[9px] font-mono text-slate-400 uppercase">SO₂ Total (ECA 0.1%)</div>
                <div className="text-base font-bold text-rose-300 font-mono flex items-center gap-1.5 mt-0.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>{data?.hotellingTotalsPerHourKg?.so2KgHour || summary.totalEmissionsKgH.so2} kg/h</span>
                </div>
                <div className="text-[8px] text-slate-500 font-mono mt-0.5">Combustible MGO Certificado</div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded">
                <div className="text-[9px] font-mono text-slate-400 uppercase">PM2.5 Primario (Hollín)</div>
                <div className="text-base font-bold text-purple-300 font-mono flex items-center gap-1.5 mt-0.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>{data?.hotellingTotalsPerHourKg?.pm25KgHour || summary.totalEmissionsKgH.pm25} kg/h</span>
                </div>
                <div className="text-[8px] text-slate-500 font-mono mt-0.5">Trazadores V y Ni</div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded">
                <div className="text-[9px] font-mono text-slate-400 uppercase">CO₂ Fósil Emitido</div>
                <div className="text-base font-bold text-cyan-300 font-mono flex items-center gap-1.5 mt-0.5">
                  <Fuel className="w-4 h-4 text-cyan-400" />
                  <span>{data?.hotellingTotalsPerHourKg?.co2KgHour || '1,840'} kg/h</span>
                </div>
                <div className="text-[8px] text-slate-500 font-mono mt-0.5">Huella de Carbono Portuaria</div>
              </div>
            </div>

            {/* Vessel List and Details */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Vessel Selector */}
              <div className="md:col-span-5 space-y-2">
                <div className="text-[9.5px] font-mono font-bold text-slate-300 uppercase flex items-center justify-between">
                  <span>Buques en Dársena ({data?.activeVesselsCount || 0})</span>
                  <button
                    onClick={fetchPortEmissions}
                    disabled={loading}
                    className="text-[8px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono hover:underline"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Actualizar</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                  {data?.vessels?.map((v) => (
                    <div
                      key={v.imo}
                      onClick={() => setSelectedVessel(v.imo)}
                      className={`p-2 rounded border cursor-pointer transition-all ${
                        selectedVessel === v.imo
                          ? 'bg-cyan-950/60 border-cyan-500 text-cyan-100 shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-[10px] text-cyan-300 truncate">{v.name}</span>
                        <span className="text-[7.5px] px-1 py-0.2 bg-slate-950 border border-slate-700 text-slate-400 rounded">
                          {v.imo}
                        </span>
                      </div>
                      <div className="text-[8.5px] text-slate-400 font-mono mt-0.5 truncate">
                        {v.type} • {v.dock}
                      </div>
                      <div className="text-[8px] text-amber-300 font-mono mt-0.5">
                        NOx: {v.emissionsKgPerHour.nox} kg/h | Aux: {v.auxiliaryEnginePowerKw} kW
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Vessel Full Specs */}
              {activeVessel && (
                <div className="md:col-span-7 bg-slate-900/80 border border-slate-800 rounded p-3 space-y-3">
                  <div className="flex items-start justify-between border-b border-slate-800 pb-2">
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                        <Ship className="w-4 h-4 text-cyan-400" />
                        <span>{activeVessel.name}</span>
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>{activeVessel.dock} ({activeVessel.lat.toFixed(4)}°N, {activeVessel.lon.toFixed(4)}°W)</span>
                      </div>
                    </div>

                    {onFlyTo && (
                      <button
                        onClick={() => onFlyTo(activeVessel.lat, activeVessel.lon)}
                        className="text-[9px] font-mono bg-cyan-950 hover:bg-cyan-900 border border-cyan-600 text-cyan-200 px-2 py-1 rounded flex items-center gap-1 transition-all"
                        title="Volar al atraque en el Puerto de Málaga"
                      >
                        <span>VOLAR</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Emissions breakdown grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/80 p-2.5 rounded border border-slate-800">
                    <div>
                      <div className="text-[8px] font-mono text-slate-400">NOx (Zeldovich)</div>
                      <div className="text-sm font-bold text-amber-300 font-mono">{activeVessel.emissionsKgPerHour.nox} kg/h</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-mono text-slate-400">SO₂ (Azufre)</div>
                      <div className="text-sm font-bold text-rose-300 font-mono">{activeVessel.emissionsKgPerHour.so2} kg/h</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-mono text-slate-400">PM2.5 (SIA/BC)</div>
                      <div className="text-sm font-bold text-purple-300 font-mono">{activeVessel.emissionsKgPerHour.pm25} kg/h</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-mono text-slate-400">Potencia Aux.</div>
                      <div className="text-sm font-bold text-cyan-300 font-mono">{activeVessel.auxiliaryEnginePowerKw} kW</div>
                    </div>
                  </div>

                  {/* Plume note */}
                  <div className="p-2 bg-cyan-950/30 border border-cyan-900/50 rounded text-[8.5px] text-slate-300 font-mono leading-relaxed space-y-1">
                    <div className="text-cyan-300 font-bold">
                      Impacto en la Calidad del Aire del Centro Histórico de Málaga
                    </div>
                    <div>
                      {data?.plumeDispersionEffect || 'Las emisiones de atraque se acoplan al ascenso de pluma térmica de Briggs y se advectan hacia el Paseo del Parque durante el régimen diurno de brisa marina.'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'briggs' && (
          <div className="space-y-4">
            {/* BARRA DE SELECCIÓN DE ZONA Y ASIMILACIÓN METEOROLÓGICA DE BRISA */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900/90 border border-slate-800 rounded-sm">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-sm px-2 py-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <select
                    value={activeZone.name}
                    onChange={(e) => {
                      const z = PRESET_ZONES.find(zone => zone.name === e.target.value);
                      if (z) setActiveZone(z);
                    }}
                    className="bg-transparent text-[10px] font-mono text-slate-300 font-bold outline-none cursor-pointer appearance-none pr-4"
                  >
                    {PRESET_ZONES.map(z => (
                      <option key={z.name} value={z.name} className="bg-slate-900">{z.name} ({z.tag})</option>
                    ))}
                  </select>
                </div>

                <ScientificTooltip position="bottom" width="w-[320px]" content="Asimilación en vivo de la velocidad y dirección del viento costero/terrestre para simular la advección gaussiana de la pluma de Briggs sobre la fachada marítima y el centro histórico.">
                  <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider cursor-help">
                    Asimilación de Brisa In Situ
                  </span>
                </ScientificTooltip>
              </div>

              {telemetryFeedback && (
                <span className="text-[9px] text-cyan-300 font-mono bg-cyan-950/80 border border-cyan-800/70 px-2 py-0.5 rounded-sm">
                  {telemetryFeedback}
                </span>
              )}
            </div>

            {/* PARÁMETROS DE CONFIGURACIÓN Y CONTROLES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Columna 1: Buques y Combustible */}
              <div className="bg-slate-900/80 border border-slate-800 p-3 flex flex-col gap-3">
                <h3 className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Ship className="w-3.5 h-3.5" /> Tráfico Portuario y MARPOL
                </h3>

                <ScientificTooltip
                  position="bottom"
                  width="w-[300px]"
                  content="Atracaderos activos en la dársena del Puerto de Málaga (Cruceros Muelle Levante, Ferries Muelle 3, Contenedores Muelle 9)."
                >
                  <div className="space-y-1.5 cursor-help">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Buques Atracados Activos</span>
                      <span className="font-mono text-cyan-300 font-bold">{activeBerthsCount} atracaderos</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={activeBerthsCount}
                      onChange={(e) => setActiveBerthsCount(parseInt(e.target.value))}
                      className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded"
                    />
                  </div>
                </ScientificTooltip>

                <ScientificTooltip
                  position="bottom"
                  width="w-[320px]"
                  content="Límite del Anexo VI del Convenio MARPOL. En zonas de control de emisiones ECA el límite es 0.1% S."
                >
                  <div className="space-y-1.5 cursor-help">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Azufre en Combustible (MARPOL % S)</span>
                      <span className="font-mono text-amber-300 font-bold">{fuelSulfurPct}% S</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.50"
                      step="0.05"
                      value={fuelSulfurPct}
                      onChange={(e) => setFuelSulfurPct(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded"
                    />
                  </div>
                </ScientificTooltip>
              </div>

              {/* Columna 2: Parámetros Meteorológicos */}
              <div className="bg-slate-900/80 border border-slate-800 p-3 flex flex-col gap-3">
                <h3 className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Wind className="w-3.5 h-3.5" /> Capa Límite y Brisa Marina
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Viento (u, m/s)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="15"
                      value={windSpeedMs}
                      onChange={(e) => setWindSpeedMs(parseFloat(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-cyan-300 p-1 font-mono rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Dirección (° N)</label>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      max="360"
                      value={windDirDeg}
                      onChange={(e) => setWindDirDeg(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-cyan-300 p-1 font-mono rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Temperatura Aire (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={airTempC}
                    onChange={(e) => setAirTempC(parseFloat(e.target.value) || 20)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-rose-300 p-1 font-mono rounded"
                  />
                </div>
              </div>

              {/* Columna 3: Parámetros de Pluma de Briggs */}
              <div className="bg-slate-900/80 border border-slate-800 p-3 flex flex-col justify-between">
                <h3 className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Flame className="w-3.5 h-3.5" /> Parámetros de Penacho Briggs
                </h3>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Flujo de Flotabilidad (Fb):</span>
                    <span className="font-mono text-amber-300 font-bold">{summary.berths[0]?.briggsParams.buoyancyFluxF} m⁴/s³</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Ascenso Térmico (Δh):</span>
                    <span className="font-mono text-cyan-300 font-bold">+{summary.berths[0]?.briggsParams.plumeRiseDeltaHM} m</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Altura Efectiva Chimenea (H_eff):</span>
                    <span className="font-mono text-purple-300 font-bold">{summary.berths[0]?.briggsParams.effectiveHeightHM} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Impacto Máximo Terrestre:</span>
                    <span className="font-mono text-rose-400 font-bold">{summary.berths[0]?.briggsParams.maxConcentrationDistM} m (Alameda)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* DIAGRAMA ANIMADO BRIGGS */}
            <BriggsPlumeRiseDiagram
              stackHeightM={summary.berths[0]?.briggsParams.stackHeightM || 35}
              plumeRiseDeltaHM={summary.berths[0]?.briggsParams.plumeRiseDeltaHM || 28.4}
              effectiveHeightM={summary.berths[0]?.briggsParams.effectiveHeightHM || 63.4}
              maxConcentrationDistM={summary.berths[0]?.briggsParams.maxConcentrationDistM || 1250}
              windSpeedMs={windSpeedMs}
              windDirDeg={windDirDeg}
              stabilityClass={stabilityClass}
              impactAlamedaUgm3NO2={summary.berths[0]?.briggsParams.maxGroundConcentrationUgm3.nox || 14.8}
              so2EmissionKgH={summary.totalEmissionsKgH.so2}
              noxEmissionKgH={summary.totalEmissionsKgH.nox}
            />

            {/* GRÁFICO RECHARTS DE PERFIL VERTICAL DE PLUMA */}
            <div className="bg-slate-900/90 border border-slate-800 p-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" /> Perfil de Elevación z(x) y Concentración Superficial C(x)
              </h4>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={plumeChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="xM" stroke="#64748b" tick={{ fontSize: 10 }} unit="m" />
                    <YAxis yAxisId="left" stroke="#38bdf8" tick={{ fontSize: 10 }} unit="m" />
                    <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" tick={{ fontSize: 10 }} unit=" µg/m³" />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area yAxisId="left" type="monotone" dataKey="zPlumeM" name="Altura Centroide Pluma [m]" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} />
                    <Area yAxisId="right" type="monotone" dataKey="cSo2Ugm3" name="Concentración SO₂ Superficie [µg/m³]" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} />
                    <Area yAxisId="right" type="monotone" dataKey="cNoxUgm3" name="Concentración NOₓ Superficie [µg/m³]" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.05} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* BOTONES DE EXPORTACIÓN */}
        <div className="flex justify-between items-center border-t border-slate-800 pt-3">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            <span>Guía EMEP/EEA 1.A.3.d y Modelo Físico de Briggs. Cumplimiento FAIRMODE.</span>
          </div>

          <div className="flex gap-2">
            <ScientificTooltip position="top" width="w-[280px]" content="Exportación FAIR en formato GeoJSON de puntos de emisión portuaria con atributos EMEP/EEA y parámetros de pluma calculados.">
              <button
                onClick={handleDownloadGeoJson}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 font-mono font-bold transition-colors"
              >
                <FileJson className="w-3.5 h-3.5 text-cyan-400" /> GeoJSON FAIR
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="top" width="w-[280px]" content="Exportación tabular de factores de emisión, tasas de emisión horarias y parámetros de chimenea en formato CSV estándar.">
              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-700 text-xs px-3 py-1.5 font-mono font-bold transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-300" /> CSV FAIR Science
              </button>
            </ScientificTooltip>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};
