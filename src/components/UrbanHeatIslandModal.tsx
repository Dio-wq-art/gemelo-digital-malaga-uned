import React, { useState, useEffect, useMemo } from 'react';
import { 
  Thermometer, Moon, Sun, Download, FileJson, FileSpreadsheet, ShieldAlert, 
  Layers, MapPin, Sliders, Flame, Droplets, Wind, Sparkles 
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import {
  calculateUrbanHeatIslandSummary,
  exportUhiGeoJson,
  exportUhiCsv,
} from '../lib/urbanHeatIslandInversion';
import { PRESET_ZONES, Zone } from '../lib/zones';
import { fetchLiveZoneTelemetry } from '../lib/liveZoneTelemetry';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { UrbanHeatIslandDiagram } from './UrbanHeatIslandDiagram';
import { useActivePoint } from '../context/ActivePointContext';

interface SurfaceMaterial {
  id: string;
  name: string;
  category: 'pavement' | 'roof' | 'vegetation' | 'water' | 'mitigation';
  albedo: number;
  emissivity: number;
  thermalInertia: number;
  evapFraction: number;
  description: string;
}

const URBAN_MATERIALS: SurfaceMaterial[] = [
  {
    id: 'asphalt',
    name: 'Asfalto Convencional (Alameda / Andalucía)',
    category: 'pavement',
    albedo: 0.12,
    emissivity: 0.95,
    thermalInertia: 1550,
    evapFraction: 0.0,
    description: 'Pavimento rodado oscuro de alta absorción y retención de calor durante el ocaso.'
  },
  {
    id: 'larios_marble',
    name: 'Mármol Bidasoa / Granito (Calle Larios)',
    category: 'pavement',
    albedo: 0.38,
    emissivity: 0.90,
    thermalInertia: 2100,
    evapFraction: 0.02,
    description: 'Pavimento peatonal pulido de color claro con mayor reflectancia solar.'
  },
  {
    id: 'clay_tiles',
    name: 'Teja Cerámica Tradicional (Centro Histórico)',
    category: 'roof',
    albedo: 0.28,
    emissivity: 0.92,
    thermalInertia: 1380,
    evapFraction: 0.0,
    description: 'Cubierta tradicional inclinada de arcilla cocida en caseríos malagueños.'
  },
  {
    id: 'urban_canopy',
    name: 'Dosel Arbóreo Ficus / Plátano (Paseo del Parque)',
    category: 'vegetation',
    albedo: 0.18,
    emissivity: 0.98,
    thermalInertia: 950,
    evapFraction: 0.72,
    description: 'Bóveda vegetal con fuerte refrigeración microclimática por evapotranspiración latente.'
  },
  {
    id: 'harbour_water',
    name: 'Lámina de Agua (Dársena del Puerto)',
    category: 'water',
    albedo: 0.06,
    emissivity: 0.97,
    thermalInertia: 3200,
    evapFraction: 0.88,
    description: 'Cuerpo de agua marina con gran capacidad calorífica que amortigua oscilaciones térmicas.'
  },
  {
    id: 'cool_roof',
    name: 'Cubierta Fría Reflectiva (Pintura Cool Roof / Albedo > 0.75)',
    category: 'mitigation',
    albedo: 0.78,
    emissivity: 0.92,
    thermalInertia: 1200,
    evapFraction: 0.0,
    description: 'Estrategia de mitigación bioclimática recomendada por la directiva europea UHI.'
  }
];

interface UrbanHeatIslandModalProps {
  onClose: () => void;
  initialTab?: 'diurnal' | 'surface_balance';
}

export function UrbanHeatIslandModal({ onClose, initialTab = 'diurnal' }: UrbanHeatIslandModalProps) {
  const activeCtx = useActivePoint();
  const activePoint = activeCtx?.activePoint;
  const assimilation = activeCtx?.assimilation;
  const [activeTab, setActiveTab] = useState<'diurnal' | 'surface_balance'>(initialTab);
  const [activeZone, setActiveZone] = useState<Zone>(PRESET_ZONES[0]);
  const [hourOfDay, setHourOfDay] = useState<number>(new Date().getHours());
  const [baseRuralTemp, setBaseRuralTemp] = useState<number>(19.5);
  const [windSpeed, setWindSpeed] = useState<number>(1.8);
  const [cloudCoverPct, setCloudCoverPct] = useState<number>(0);
  const [telemetryFeedback, setTelemetryFeedback] = useState<string | null>(null);

  // Surface Balance State
  const [customSolarRad, setCustomSolarRad] = useState<number>(850);
  const [customTair, setCustomTair] = useState<number>(28.5);
  const [customWindSpeed, setCustomWindSpeed] = useState<number>(2.5);

  // Sincronización reactiva con el punto/calle activo seleccionado en el mapa (ActivePointContext)
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
      const uhiDelta = assimilation.urbanHeatIslandDeltaC ?? 2.4;
      const ruralRef = Number((assimilation.temperatureC - uhiDelta).toFixed(1));
      setBaseRuralTemp(ruralRef);
      setWindSpeed(Number(assimilation.windSpeedMs.toFixed(1)));
      setCustomTair(Number(assimilation.temperatureC.toFixed(1)));
      setCustomWindSpeed(Number(assimilation.windSpeedMs.toFixed(1)));
      setCustomSolarRad(Math.round(assimilation.solarRadiationWm2 ?? 720));
      setTelemetryFeedback(
        `ActivePoint Sync • [${activePoint?.streetName || 'Málaga'}] T_urbana=${assimilation.temperatureC.toFixed(1)}°C (ΔUHI=+${uhiDelta.toFixed(2)}°C), T_rural=${ruralRef}°C, Rad=${Math.round(assimilation.solarRadiationWm2 ?? 720)} W/m²`
      );
    }
  }, [activePoint, assimilation]);

  // Asimilación en vivo según la zona geográfica seleccionada manualmente
  useEffect(() => {
    if (activePoint) return;
    let isMounted = true;
    fetchLiveZoneTelemetry(activeZone).then(tel => {
      if (!isMounted) return;
      const ruralRef = Number((tel.meteo.tempC - 2.6).toFixed(1));
      setBaseRuralTemp(ruralRef);
      setWindSpeed(tel.meteo.windSpeedMs);
      setCustomTair(tel.meteo.tempC);
      setCustomWindSpeed(tel.meteo.windSpeedMs);
      setHourOfDay(new Date().getHours());
      setTelemetryFeedback(`${tel.source} • T_urbana=${tel.meteo.tempC}°C, T_rural_ref=${ruralRef}°C, u=${tel.meteo.windSpeedMs}m/s`);
    }).catch(err => console.warn(err));
    return () => { isMounted = false; };
  }, [activeZone]);

  const summary = useMemo(() => {
    return calculateUrbanHeatIslandSummary(hourOfDay, baseRuralTemp, windSpeed, cloudCoverPct);
  }, [hourOfDay, baseRuralTemp, windSpeed, cloudCoverPct]);

  const chartData = useMemo(() => {
    return summary.diurnalProfile.map((pt) => ({
      hour: `${pt.hourOfDay}:00`,
      tempRural: pt.tempRuralC,
      tempCentro: pt.tempUrbanCenterC,
      pblM: pt.pblHeightM,
      trappedFactor: pt.trappedSurfaceFactor,
    }));
  }, [summary]);

  // Balance energético superficial
  const surfaceCalculations = useMemo(() => {
    const sigma = 5.67e-8;
    const Tair_K = customTair + 273.15;
    const hc = 5.7 + 3.8 * Math.max(0.5, customWindSpeed);
    const L_down = 0.82 * sigma * Math.pow(Tair_K, 4);

    return URBAN_MATERIALS.map((mat) => {
      const S_abs = (1 - mat.albedo) * customSolarRad;
      const radLinearCoef = 4 * mat.emissivity * sigma * Math.pow(Tair_K, 3);
      const evapEquivalentConductance = mat.evapFraction * 35.0;
      const groundConductance = (mat.thermalInertia / 1500) * 8.0;

      const numerator = S_abs + mat.emissivity * (L_down - sigma * Math.pow(Tair_K, 4));
      const denominator = hc + radLinearCoef + evapEquivalentConductance + groundConductance;

      const deltaT = numerator / denominator;
      const Ts = customTair + deltaT;

      const Ts_K = Ts + 273.15;
      const L_up = mat.emissivity * sigma * Math.pow(Ts_K, 4);
      const Rn = S_abs + mat.emissivity * L_down - L_up;
      const H_flux = hc * (Ts - customTair);
      const LE_flux = evapEquivalentConductance * Math.max(0, Ts - customTair);
      const G_flux = groundConductance * (Ts - customTair);
      const suhi = Ts - customTair;

      return {
        ...mat,
        Ts: Number(Ts.toFixed(1)),
        suhi: Number(suhi.toFixed(1)),
        S_abs: Math.round(S_abs),
        Rn: Math.round(Rn),
        H_flux: Math.round(H_flux),
        LE_flux: Math.round(LE_flux),
        G_flux: Math.round(G_flux)
      };
    }).sort((a, b) => b.Ts - a.Ts);
  }, [customTair, customSolarRad, customWindSpeed]);

  const handleDownloadGeoJson = () => {
    const jsonStr = exportUhiGeoJson(summary);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uhi_isla_calor_malaga_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const csvStr = exportUhiCsv(summary);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uhi_isla_calor_malaga_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="Isla de Calor Urbana (UHI) & Balance Energético Superficial"
      subtitle="Ecuación de Oke (1982), Capa Límite PBL y Balance Térmico de Superficie (Stefan-Boltzmann)"
      icon={<Thermometer className="w-4 h-4 text-rose-400" />}
      badge={
        <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-700 px-1.5 py-0.5 font-mono font-bold">
          UHI Máx: +{summary.maxUhiIntensityC} °C | PBLH: {summary.nocturnalInversionPblHeightM} m
        </span>
      }
      onClose={onClose}
      headerColorClass="text-rose-400"
      borderColorClass="border-slate-700"
      className="w-full max-w-5xl"
      initialPositionClass="top-6 left-1/2 -translate-x-1/2"
    >
      <div className="flex flex-col gap-4 p-4 bg-[#0a0f18] text-slate-200 max-h-[80vh] overflow-y-auto">
        {/* SUBTABS CON TOOLTIPS CIENTÍFICOS */}
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <ScientificTooltip position="bottom" width="w-[300px]" content="Evolución diurna de la temperatura urbana vs rural de referencia, altura de capa de mezcla (PBLH) e intensidad de la isla de calor según Oke (1982).">
            <button
              onClick={() => setActiveTab('diurnal')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-sm transition-colors cursor-pointer ${
                activeTab === 'diurnal'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-700'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              1. Perfil Diurno y Capa Límite (Oke 1982)
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[320px]" content="Balance de radiación neta y flujos superficiales (Rn = H + LE + G) resuelto mediante Stefan-Boltzmann, albedo, emisividad e inercia térmica de materiales urbanos.">
            <button
              onClick={() => setActiveTab('surface_balance')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-sm transition-colors cursor-pointer ${
                activeTab === 'surface_balance'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-700'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              2. Balance Energético y Materiales (Rn = H + LE + G)
            </button>
          </ScientificTooltip>
        </div>

        {/* BARRA DE SELECCIÓN DE ZONA Y ASIMILACIÓN TELEMÉTRICA */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900/90 border border-slate-800 rounded-sm">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-sm px-2 py-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
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

            <ScientificTooltip position="bottom" width="w-[320px]" content="Asimila en tiempo real la temperatura ambiente y velocidad de viento de la zona geográfica seleccionada, contrastándola contra la estación rural de referencia para calcular la intensidad UHI real.">
              <span className="text-[10px] text-rose-400 font-mono font-bold uppercase tracking-wider cursor-help">
                Asimilación In Situ Microescalar
              </span>
            </ScientificTooltip>
          </div>

          {telemetryFeedback && (
            <span className="text-[9px] text-rose-300 font-mono bg-rose-950/80 border border-rose-800/70 px-2 py-0.5 rounded-sm">
              {telemetryFeedback}
            </span>
          )}
        </div>

        {activeTab === 'diurnal' && (
          <>
            {/* PARÁMETROS DE HORA Y VIENTO */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 p-3 flex flex-col gap-3">
                <h3 className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Moon className="w-3.5 h-3.5" /> Ciclo Diurno y Radiación
                </h3>
                <ScientificTooltip position="bottom" width="w-[300px]" content="Hora del día (0 a 23h). La máxima intensidad de UHI ocurre durante las horas nocturnas por enfriamiento radiativo diferencial del asfalto.">
                  <div className="space-y-1.5 cursor-help">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Hora del Día</span>
                      <span className="font-mono text-rose-300 font-bold">{hourOfDay}:00 h</span>
                    </div>
                    <input
                      type="range" min="0" max="23" step="1"
                      value={hourOfDay} onChange={(e) => setHourOfDay(parseInt(e.target.value))}
                      className="w-full accent-rose-500 bg-slate-800 h-1.5 rounded"
                    />
                  </div>
                </ScientificTooltip>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-3 flex flex-col gap-3">
                <h3 className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Thermometer className="w-3.5 h-3.5" /> Fondo Rural y Viento
                </h3>
                <ScientificTooltip position="bottom" width="w-[300px]" content="Temperatura en la estación rural de referencia (Aeropuerto de Málaga) sin sesgo de edificación.">
                  <div className="space-y-1.5 cursor-help">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Temp. Rural Aeropuerto (°C)</span>
                      <span className="font-mono text-amber-300 font-bold">{baseRuralTemp} °C</span>
                    </div>
                    <input
                      type="range" min="5" max="35" step="0.5"
                      value={baseRuralTemp} onChange={(e) => setBaseRuralTemp(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded"
                    />
                  </div>
                </ScientificTooltip>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-3 flex flex-col gap-3">
                <h3 className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Moon className="w-3.5 h-3.5" /> Cobertura Nubosa
                </h3>
                <ScientificTooltip position="bottom" width="w-[300px]" content="La nubosidad actúa como una manta térmica de onda larga, reduciendo el enfriamiento radiativo nocturno e inhibiendo parcialmente la Isla de Calor (Oke, 1982).">
                  <div className="space-y-1.5 cursor-help">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Nubosidad (%)</span>
                      <span className="font-mono text-cyan-300 font-bold">{cloudCoverPct}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" step="5"
                      value={cloudCoverPct} onChange={(e) => setCloudCoverPct(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded"
                    />
                  </div>
                </ScientificTooltip>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-3 flex flex-col justify-between">
                <h3 className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Layers className="w-3.5 h-3.5" /> Atrapamiento de Contaminación
                </h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Altura Capa Límite PBL:</span>
                    <span className="font-mono text-purple-300 font-bold">{summary.nocturnalInversionPblHeightM} m</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Exceso Temp. Centro:</span>
                    <span className="font-mono text-rose-400 font-bold">+{summary.districts[0]?.deltaT_UHI_C} °C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">NO₂ Atrapado en Centro:</span>
                    <span className="font-mono text-cyan-300 font-bold">{summary.districts[0]?.trappedNO2_Ugm3} µg/m³</span>
                  </div>
                </div>
              </div>
            </div>

            {/* DIAGRAMA ANIMADO DE ISLA DE CALOR URBANA */}
            <UrbanHeatIslandDiagram
              tempUrbanC={Number((baseRuralTemp + (summary.districts[0]?.deltaT_UHI_C ?? 3.2)).toFixed(1))}
              tempRuralC={baseRuralTemp}
              windSpeedMs={windSpeed}
              hourOfDay={hourOfDay}
              pblHeightM={summary.nocturnalInversionPblHeightM}
            />

            {/* GRÁFICO RECHARTS DE PERFIL DIURNO */}
            <div className="bg-slate-900/90 border border-slate-800 p-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase mb-2 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Perfil Diurno 24h: Temperatura Centro vs. Rural y Colapso PBL
              </h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" stroke="#f43f5e" tick={{ fontSize: 10 }} unit="°C" />
                    <YAxis yAxisId="right" orientation="right" stroke="#a855f7" tick={{ fontSize: 10 }} unit="m" />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area yAxisId="left" type="monotone" dataKey="tempCentro" name="Temp. Centro Histórico [°C]" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} />
                    <Area yAxisId="left" type="monotone" dataKey="tempRural" name="Temp. Rural Aeropuerto [°C]" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                    <Area yAxisId="right" type="monotone" dataKey="pblM" name="Altura Capa Límite PBL [m]" stroke="#a855f7" fill="#a855f7" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {activeTab === 'surface_balance' && (
          <div className="space-y-4">
            {/* CONTROLES DE BALANCE SUPERFICIAL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/80 border border-slate-800 p-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Radiación Solar Incidente</span>
                  <span className="font-mono text-amber-300 font-bold">{customSolarRad} W/m²</span>
                </div>
                <input
                  type="range" min="0" max="1100" step="25"
                  value={customSolarRad} onChange={(e) => setCustomSolarRad(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Temp. Aire (T_air)</span>
                  <span className="font-mono text-rose-300 font-bold">{customTair} °C</span>
                </div>
                <input
                  type="range" min="10" max="45" step="0.5"
                  value={customTair} onChange={(e) => setCustomTair(parseFloat(e.target.value))}
                  className="w-full accent-rose-500 bg-slate-800 h-1.5 rounded"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Velocidad Viento</span>
                  <span className="font-mono text-sky-300 font-bold">{customWindSpeed} m/s</span>
                </div>
                <input
                  type="range" min="0.2" max="12" step="0.2"
                  value={customWindSpeed} onChange={(e) => setCustomWindSpeed(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded"
                />
              </div>
            </div>

            {/* TABLA DE MATERIALES Y FLUJOS */}
            <div className="border border-slate-800 bg-slate-900/60 rounded overflow-hidden">
              <table className="w-full text-left text-[11px] font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2">Material Superficial</th>
                    <th className="p-2 text-center">Albedo</th>
                    <th className="p-2 text-center">Emisividad</th>
                    <th className="p-2 text-right">Ts (°C)</th>
                    <th className="p-2 text-right">ΔTs (K)</th>
                    <th className="p-2 text-right">Rn (W/m²)</th>
                    <th className="p-2 text-right">H (Sensible)</th>
                    <th className="p-2 text-right">LE (Latente)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {surfaceCalculations.map((mat) => (
                    <tr key={mat.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-2 font-sans font-medium text-slate-200">
                        {mat.name}
                        <div className="text-[9.5px] font-normal text-slate-400">{mat.description}</div>
                      </td>
                      <td className="p-2 text-center text-slate-300">{mat.albedo}</td>
                      <td className="p-2 text-center text-slate-300">{mat.emissivity}</td>
                      <td className="p-2 text-right font-bold text-rose-300">{mat.Ts} °C</td>
                      <td className="p-2 text-right font-bold text-amber-300">+{mat.suhi} K</td>
                      <td className="p-2 text-right text-slate-300">{mat.Rn}</td>
                      <td className="p-2 text-right text-rose-400">{mat.H_flux}</td>
                      <td className="p-2 text-right text-cyan-400">{mat.LE_flux}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BOTONES DE EXPORTACIÓN FAIR */}
        <div className="flex justify-between items-center border-t border-slate-800 pt-3">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Modelo Físico de Oke (1982) y Balance Térmico de Superficie. Cero datos aleatorios.</span>
          </div>

          <div className="flex gap-2">
            <ScientificTooltip position="top" width="w-[280px]" content="Exportación FAIR en formato GeoJSON de polígonos distritales con cálculo mecanístico de intensidad UHI y concentración atrapada de contaminantes.">
              <button
                onClick={handleDownloadGeoJson}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 font-mono font-bold transition-colors"
              >
                <FileJson className="w-3.5 h-3.5 text-rose-400" /> GeoJSON UHI
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="top" width="w-[280px]" content="Exportación tabular de series horarias (0-23h) de temperatura rural vs. urbana y altura de capa límite PBLH en formato CSV estándar.">
              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-700 text-xs px-3 py-1.5 font-mono font-bold transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-rose-300" /> CSV FAIR Science
              </button>
            </ScientificTooltip>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
}
