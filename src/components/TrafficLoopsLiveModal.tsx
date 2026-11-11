import React, { useState, useEffect } from 'react';
import { Activity, Car, Gauge, ShieldAlert, ArrowUpRight, RefreshCw, Layers, Zap, Info, MapPin, Download } from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';

interface TrafficLoopSensor {
  sensorId: string;
  name: string;
  street: string;
  district: string;
  lat: number;
  lon: number;
  capacityVehHour: number;
  currentFlowVehHour: number;
  currentSpeedKmh: number;
  occupancyPct: number;
  copertNOxGramsPerHour: number;
  copertPM25GramsPerHour: number;
}

interface LiveTrafficData {
  source: string;
  timestamp: string;
  currentHour: number;
  hourlyTrafficFactor: number;
  totalActiveLoops: number;
  networkSummary: {
    totalVehiclesPerHour: number;
    avgSpeedKmh: number;
    totalNOxEmittedGramsHour: number;
    totalPM25EmittedGramsHour: number;
  };
  sensors: TrafficLoopSensor[];
}

interface TrafficLoopsModalProps {
  onClose: () => void;
  onFlyTo?: (lat: number, lon: number) => void;
}

export const TrafficLoopsLiveModal: React.FC<TrafficLoopsModalProps> = ({ onClose, onFlyTo }) => {
  const [data, setData] = useState<LiveTrafficData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);

  const fetchTrafficLoops = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/malaga-open-data/live-traffic-loops');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.sensors?.length > 0 && !selectedSensor) {
          setSelectedSensor(json.sensors[0].sensorId);
        }
      }
    } catch (err) {
      console.error('Error fetching traffic loops:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficLoops();
    const interval = setInterval(fetchTrafficLoops, 30000);
    return () => clearInterval(interval);
  }, []);

  const activeSensor = data?.sensors?.find(s => s.sensorId === selectedSensor) || data?.sensors?.[0];

  const exportGeoJson = () => {
    if (!data) return;
    const geojson = {
      type: 'FeatureCollection',
      properties: {
        title: 'Red de Espiras de Tráfico y Emisiones COPERT 5 - Málaga',
        source: data.source,
        timestamp: data.timestamp,
        networkSummary: data.networkSummary
      },
      features: data.sensors.map(s => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [s.lon, s.lat]
        },
        properties: { ...s }
      }))
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `espiras_trafico_malaga_${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    if (!data) return;
    const headers = 'sensorId,name,district,lat,lon,capacityVehHour,currentFlowVehHour,currentSpeedKmh,occupancyPct,copertNOxGramsPerHour,copertPM25GramsPerHour\n';
    const rows = data.sensors.map(s => `"${s.sensorId}","${s.name}","${s.district}",${s.lat},${s.lon},${s.capacityVehHour},${s.currentFlowVehHour},${s.currentSpeedKmh},${s.occupancyPct},${s.copertNOxGramsPerHour},${s.copertPM25GramsPerHour}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `espiras_trafico_malaga_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="Espiras y Aforos de Tráfico en Tiempo Real (Málaga)"
      icon={<Activity className="w-4 h-4 text-rose-400" />}
      badge={
        <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-700 px-1.5 py-0.5 font-mono font-bold">
          AYTO. MÁLAGA LIVE
        </span>
      }
      onClose={onClose}
      headerColorClass="text-rose-400"
      borderColorClass="border-rose-900/60"
      className="w-full max-w-4xl"
      initialPositionClass="top-12 left-1/2 -translate-x-1/2"
    >
      <div className="p-4 bg-slate-950/95 space-y-4 text-xs font-sans select-text">
        {/* Banner Unificado del Punto Activo */}
        <ActivePointSyncBanner compact={true} />

        {/* Header Summary Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <ScientificTooltip
            position="top"
            title="Caudal Horario Integrado de Espiras Electromagnéticas (IMD_h)"
            formula="Q_{\text{red}}(t) = \sum_{k=1}^{N_{\text{loops}}} q_k(t) \quad (\text{veh h}^{-1})"
            normative="Centro de Gestión de Tráfico Ayto. Málaga • Directiva ITS 2010/40/UE"
            content="Intensidad horaria vehicular agregada medida por las espiras inductivas enterradas en el firme de los corredores arteriales de Málaga."
          >
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded cursor-help">
              <div className="text-[9px] font-mono text-slate-400 uppercase">Caudal Red Asimilada</div>
              <div className="text-base font-bold text-rose-300 font-mono flex items-center gap-1.5 mt-0.5">
                <Car className="w-4 h-4 text-rose-400" />
                <span>{data?.networkSummary?.totalVehiclesPerHour.toLocaleString() || '---'} veh/h</span>
              </div>
              <div className="text-[8px] text-slate-500 font-mono mt-0.5">{data?.sensors?.length || 8} Ejes Estratégicos de Málaga</div>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Velocidad Media Armónica Espacial (v̄_s)"
            formula="\bar{v}_s = \frac{N}{\sum_{k=1}^N v_k^{-1}} \quad (\text{km h}^{-1})"
            normative="Highway Capacity Manual (HCM) • Guía EMEP/EEA COPERT 5"
            content="Velocidad media de circulación en red que parametriza la curva no lineal en 'U' de factores de emisión dependientes de la velocidad."
          >
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded cursor-help">
              <div className="text-[9px] font-mono text-slate-400 uppercase">Velocidad Media Red</div>
              <div className="text-base font-bold text-cyan-300 font-mono flex items-center gap-1.5 mt-0.5">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span>{data?.networkSummary?.avgSpeedKmh || '---'} km/h</span>
              </div>
              <div className="text-[8px] text-slate-500 font-mono mt-0.5">Cinemática Fluida COPERT 5</div>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Factor de Emisión Cinemático COPERT 5 para NOₓ"
            formula="EF_{\text{NO}_x}(v) = \frac{\alpha v^2 + \beta v + \gamma + \delta / v}{\varepsilon v^2 + \zeta v + \eta}\,(1 - RF)"
            normative="EMEP/EEA Air Pollutant Emission Inventory Guidebook (2023) Tier 3"
            content="Tasa másica horaria de NOₓ térmico (mecanismo de Zeldovich extendido) integrado sobre el parque circulante de Málaga."
          >
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded cursor-help">
              <div className="text-[9px] font-mono text-slate-400 uppercase">Emisión Total NOx</div>
              <div className="text-base font-bold text-amber-300 font-mono flex items-center gap-1.5 mt-0.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{data?.networkSummary?.totalNOxEmittedGramsHour || '---'} g/h</span>
              </div>
              <div className="text-[8px] text-slate-500 font-mono mt-0.5">Mecanismo Zeldovich & EMEP</div>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Emisiones de PM₂.₅ de Combustión y No-Escape (Euro 7)"
            formula="E_{\text{PM}_{2.5}} = E_{\text{exhaust}}(v) + E_{\text{brake}}(\text{Cu, Fe, Sb}) + E_{\text{tyre}}(\text{TWP/6PPD})"
            normative="EMEP/EEA Non-Exhaust Guidebook • Reglamento (UE) 2024/1257 (Euro 7)"
            content="Suma de partículas finas de tubo de escape más abrasión mecánica de pastillas de freno, banda de rodadura y resuspensión."
          >
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded cursor-help">
              <div className="text-[9px] font-mono text-slate-400 uppercase">Emisión PM2.5 Escape/Freno</div>
              <div className="text-base font-bold text-purple-300 font-mono flex items-center gap-1.5 mt-0.5">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>{data?.networkSummary?.totalPM25EmittedGramsHour || '---'} g/h</span>
              </div>
              <div className="text-[8px] text-slate-500 font-mono mt-0.5">Abrasión Neumático / Pastilla</div>
            </div>
          </ScientificTooltip>
        </div>

        {/* Toolbar de Exportación FAIR */}
        <div className="flex items-center justify-between px-2 py-1.5 bg-slate-900/50 border border-slate-800/80 rounded text-[10px]">
          <span className="text-slate-400 font-mono">
            Sensores Activos: <strong className="text-rose-300">{data?.sensors?.length || 0}</strong> • Fuente: Red de Aforos Movilidad Málaga / DGT
          </span>
          <div className="flex items-center gap-2">
            <ScientificTooltip content="Exportar geolocalización y emisiones COPERT 5 de todas las espiras en formato GeoJSON.">
              <button
                onClick={exportGeoJson}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3 text-rose-400" />
                <span>GeoJSON</span>
              </button>
            </ScientificTooltip>
            <ScientificTooltip content="Descargar serie temporal de caudal, velocidad y factores de emisión en CSV.">
              <button
                onClick={exportCsv}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>CSV</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Sensor List and Detail Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Sensor Select List */}
          <div className="md:col-span-5 space-y-2">
            <div className="text-[9.5px] font-mono font-bold text-slate-300 uppercase flex items-center justify-between">
              <span>Espiras Electromagnéticas</span>
              <button
                onClick={fetchTrafficLoops}
                disabled={loading}
                className="text-[8px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-mono hover:underline"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refrescar</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
              {data?.sensors?.map((s) => (
                <div
                  key={s.sensorId}
                  onClick={() => setSelectedSensor(s.sensorId)}
                  className={`p-2 rounded border cursor-pointer transition-all ${
                    selectedSensor === s.sensorId
                      ? 'bg-rose-950/60 border-rose-500 text-rose-100 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-[10px] text-rose-300">{s.street}</span>
                    <span className="text-[8px] px-1 py-0.2 bg-slate-950 border border-slate-700 text-slate-400 rounded">
                      {s.sensorId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[8.5px] font-mono text-slate-400 mt-1">
                    <span>{s.currentFlowVehHour} veh/h ({s.occupancyPct}% ocup.)</span>
                    <span className="text-cyan-300 font-bold">{s.currentSpeedKmh} km/h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Sensor Full Analysis Card */}
          {activeSensor && (
            <div className="md:col-span-7 bg-slate-900/80 border border-slate-800 rounded p-3 space-y-3">
              <div className="flex items-start justify-between border-b border-slate-800 pb-2">
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-rose-400" />
                    <span>{activeSensor.name}</span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>{activeSensor.street} • {activeSensor.district} ({activeSensor.lat.toFixed(4)}°N, {activeSensor.lon.toFixed(4)}°W)</span>
                  </div>
                </div>

                {onFlyTo && (
                  <button
                    onClick={() => onFlyTo(activeSensor.lat, activeSensor.lon)}
                    className="text-[9px] font-mono bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-200 px-2 py-1 rounded flex items-center gap-1 transition-all"
                    title="Volar al punto de aforo en el mapa 3D"
                  >
                    <span>VOLAR</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Progress Bar: Capacity vs Flow */}
              <div className="space-y-1">
                <div className="flex items-center justify-between font-mono text-[9px]">
                  <span className="text-slate-400">Saturación de Capacidad Vía:</span>
                  <span className="font-bold text-rose-300">
                    {activeSensor.currentFlowVehHour} / {activeSensor.capacityVehHour} veh/h ({Math.round((activeSensor.currentFlowVehHour / activeSensor.capacityVehHour) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded border border-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      activeSensor.occupancyPct > 80 ? 'bg-rose-500' : activeSensor.occupancyPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (activeSensor.currentFlowVehHour / activeSensor.capacityVehHour) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* COPERT 5 Differential Metrics */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-2.5 rounded border border-slate-800/80">
                <div>
                  <div className="text-[8.5px] font-mono text-slate-400">Tasa Emisión NOx (Zeldovich)</div>
                  <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
                    {activeSensor.copertNOxGramsPerHour} g/h
                  </div>
                  <div className="text-[7.5px] text-slate-500 mt-0.5">Factor EMEP/EEA Tier 3 acoplado a {activeSensor.currentSpeedKmh} km/h</div>
                </div>

                <div>
                  <div className="text-[8.5px] font-mono text-slate-400">Tasa Emisión PM2.5 Total</div>
                  <div className="text-sm font-bold text-purple-300 font-mono mt-0.5">
                    {activeSensor.copertPM25GramsPerHour} g/h
                  </div>
                  <div className="text-[7.5px] text-slate-500 mt-0.5">Incluye desgaste de frenos y neumáticos</div>
                </div>
              </div>

              {/* Scientific Note / Methodology Box */}
              <div className="p-2 bg-rose-950/30 border border-rose-900/50 rounded text-[8.5px] text-slate-300 font-mono leading-relaxed space-y-1">
                <div className="text-rose-300 font-bold flex items-center gap-1">
                  <Info className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>Asimilación Determinista de Movilidad (Málaga)</span>
                </div>
                <div>
                  Los datos se integran directamente con la API de aforos del Ayuntamiento de Málaga, modulando el término fuente <span className="text-white font-bold">S_c(t, v)</span> en la ecuación de advección-difusión de la PINN para el cañón urbano específico.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DraggableWindow>
  );
};
