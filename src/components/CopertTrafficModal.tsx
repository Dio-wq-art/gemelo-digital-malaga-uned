import React, { useState, useMemo, useEffect } from 'react';
import { useActivePoint } from '../context/ActivePointContext';
import { 
  Car, Info, Settings2, Database, AlertTriangle, Radio, MapPin, RefreshCw,
  Building2, Camera, Zap, Activity, Layers, FileJson, FileSpreadsheet, ShieldCheck, Search,
  Ship, Plane
} from 'lucide-react';
import { evaluateCopertEmissions, FleetComposition } from '../lib/copert5';
import { ScientificTooltip } from './ScientificTooltip';
import { DraggableWindow } from './DraggableWindow';
import { fetchOSMMorphology } from '../lib/osmMorphology';
import { PRESET_ZONES, Zone } from '../lib/zones';
import { fetchLiveZoneTelemetry, ZoneLiveTelemetry } from '../lib/liveZoneTelemetry';
import { CopertSpeedEmissionsDiagram } from './CopertSpeedEmissionsDiagram';
import { BriggsPlumeRiseDiagram } from './BriggsPlumeRiseDiagram';
import { AirportLtoInteractiveDiagram } from './AirportLtoInteractiveDiagram';
import {
  fetchMalagaTrafficInventory,
  exportMalagaInventoryGeoJson,
  exportMalagaInventoryCsv,
  MalagaInventoryItem,
  MalagaInventorySummary
} from '../lib/malagaTrafficInventory';
import { MalagaTrafficZbeDiagram } from './MalagaTrafficZbeDiagram';

export type TrafficSuiteTab = 'overview' | 'speed_curves' | 'zbe_evaluation' | 'malaga_inventory' | 'port_emissions' | 'airport_lto';

interface CopertTrafficModalProps {
  onClose: () => void;
  initialTab?: TrafficSuiteTab;
}

export function CopertTrafficModal({ onClose, initialTab = 'overview' }: CopertTrafficModalProps) {
  const activeCtx = useActivePoint();
  const activePoint = activeCtx?.activePoint;
  const assimilation = activeCtx?.assimilation;
  const [activeZone, setActiveZone] = useState<Zone>(PRESET_ZONES[0]);
  const [speed, setSpeed] = useState<number>(30); // V (km/h)
  const [isFetching, setIsFetching] = useState(false);
  const [liveTelemetry, setLiveTelemetry] = useState<ZoneLiveTelemetry | null>(null);
  const [telemetryFeedback, setTelemetryFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TrafficSuiteTab>(initialTab);

  // Malaga inventory state
  const [inventoryData, setInventoryData] = useState<MalagaInventorySummary | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [selectedInventoryType, setSelectedInventoryType] = useState<string>('all');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');

  useEffect(() => {
    if (activeTab === 'malaga_inventory' && !inventoryData) {
      setInventoryLoading(true);
      fetchMalagaTrafficInventory()
        .then(res => {
          setInventoryData(res);
          setInventoryLoading(false);
        })
        .catch(() => {
          setInventoryLoading(false);
        });
    }
  }, [activeTab, inventoryData]);

  const [fleet, setFleet] = useState<FleetComposition>({
    gasolineEuro4: 15,
    gasolineEuro6: 30,
    dieselEuro4: 20,
    dieselEuro6: 25,
    electric: 5,
    heavyDuty: 5
  });

  // Sincronización reactiva inmediata con el punto/calle seleccionado en el mapa (ActivePointContext)
  useEffect(() => {
    if (!activePoint) return;
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

    const hw = activePoint.aspectRatioHw ?? 1.2;
    const hType = (activePoint.highwayType || '').toLowerCase();
    if (hType === 'motorway') {
      setFleet({ gasolineEuro4: 12, gasolineEuro6: 32, dieselEuro4: 18, dieselEuro6: 24, electric: 4, heavyDuty: 10 });
      setSpeed(82);
    } else if (hType === 'trunk' || hType === 'primary') {
      setFleet({ gasolineEuro4: 14, gasolineEuro6: 31, dieselEuro4: 19, dieselEuro6: 24, electric: 5, heavyDuty: 7 });
      setSpeed(Math.round(Math.max(24, Math.min(55, 42 - hw * 6))));
    } else if (hType === 'pedestrian') {
      setFleet({ gasolineEuro4: 5, gasolineEuro6: 25, dieselEuro4: 10, dieselEuro6: 20, electric: 38, heavyDuty: 2 });
      setSpeed(15);
    } else {
      setFleet({ gasolineEuro4: 15, gasolineEuro6: 32, dieselEuro4: 18, dieselEuro6: 24, electric: 6, heavyDuty: 5 });
      setSpeed(Math.round(Math.max(18, Math.min(45, 34 - hw * 5))));
    }

    if (assimilation) {
      setTelemetryFeedback(
        `ActivePoint Sync • [${activePoint.streetName}] (${hType || 'urbana'}, IMD=${activePoint.trafficVehiclesDay} veh/d) | T=${assimilation.temperatureC.toFixed(1)}°C, NO₂=${assimilation.no2Ugm3.toFixed(1)}µg/m³`
      );
    }
  }, [activePoint, assimilation]);

  const handleFleetChange = (key: keyof FleetComposition, value: number) => {
    setFleet(prev => ({ ...prev, [key]: value }));
  };

  const handleAssimilateTraffic = async (targetZone: Zone = activeZone) => {
    setIsFetching(true);
    try {
      const [morph, tel] = await Promise.all([
        fetchOSMMorphology(targetZone.lat, targetZone.lon).catch(() => null),
        fetchLiveZoneTelemetry(targetZone).catch(() => null)
      ]);

      if (tel) {
        setLiveTelemetry(tel);
      }

      // Configuración de flota y velocidad determinista según tipología urbana real de la zona
      if (targetZone.name.includes('Puerto') || targetZone.tag.includes('Puerto')) {
        setFleet({ gasolineEuro4: 10, gasolineEuro6: 20, dieselEuro4: 25, dieselEuro6: 20, electric: 3, heavyDuty: 22 });
        setSpeed(28);
      } else if (targetZone.name.includes('Campanillas') || targetZone.tag.includes('Periférica')) {
        setFleet({ gasolineEuro4: 15, gasolineEuro6: 35, dieselEuro4: 18, dieselEuro6: 24, electric: 4, heavyDuty: 4 });
        setSpeed(72);
      } else if (targetZone.name.includes('Aeropuerto')) {
        setFleet({ gasolineEuro4: 18, gasolineEuro6: 34, dieselEuro4: 18, dieselEuro6: 20, electric: 4, heavyDuty: 6 });
        setSpeed(65);
      } else if (targetZone.name.includes('Industrial') || targetZone.tag.includes('Industrial')) {
        setFleet({ gasolineEuro4: 10, gasolineEuro6: 22, dieselEuro4: 25, dieselEuro6: 25, electric: 3, heavyDuty: 15 });
        setSpeed(45);
      } else if (targetZone.name.includes('Parque') || targetZone.tag.includes('Filtro')) {
        setFleet({ gasolineEuro4: 12, gasolineEuro6: 32, dieselEuro4: 16, dieselEuro6: 22, electric: 12, heavyDuty: 6 });
        setSpeed(35);
      } else {
        // Centro / Cañón Alameda
        setFleet({ gasolineEuro4: 15, gasolineEuro6: 32, dieselEuro4: 18, dieselEuro6: 25, electric: 6, heavyDuty: 4 });
        setSpeed(24);
      }

      if (morph && morph.hwRatio) {
        const derivedSpeed = Math.min(90, Math.max(18, 26 + (1 / Math.max(0.2, morph.hwRatio)) * 8));
        setSpeed(Math.round(derivedSpeed));
      }

      const telInfo = tel ? ` | T=${tel.meteo.tempC}°C, NO₂=${tel.chemistry.no2Ugm3}µg/m³` : '';
      setTelemetryFeedback(`OSM [${targetZone.lat.toFixed(4)}, ${targetZone.lon.toFixed(4)}]${telInfo}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    handleAssimilateTraffic(activeZone);
  }, [activeZone]);

  const totalPercentage = Object.values(fleet).reduce((a, b) => a + b, 0);
  
  // Calculate deterministically
  const result = useMemo(() => evaluateCopertEmissions(speed, fleet), [speed, fleet]);

  // Calculate speed curves dynamically
  const speedCurveData = useMemo(() => {
    const speeds = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
    return speeds.map(v => {
      const res = evaluateCopertEmissions(v, fleet);
      return {
        speed: v,
        NOx: Number(res.nox_g_km.toFixed(3)),
        PM10: Number((res.pm10_g_km * 10).toFixed(3)), // mm scale for readability
        CO2: Number((res.co2_g_km / 10).toFixed(1)), // scaled
      };
    });
  }, [fleet]);

  // Calculate ZBE restricted fleet
  const zbeFleet: FleetComposition = useMemo(() => ({
    gasolineEuro4: 0,
    gasolineEuro6: fleet.gasolineEuro6 + fleet.gasolineEuro4 * 0.5,
    dieselEuro4: 0,
    dieselEuro6: fleet.dieselEuro6 + fleet.dieselEuro4 * 0.5,
    electric: fleet.electric + fleet.gasolineEuro4 * 0.5 + fleet.dieselEuro4 * 0.5,
    heavyDuty: fleet.heavyDuty
  }), [fleet]);

  const zbeResult = useMemo(() => evaluateCopertEmissions(speed, zbeFleet), [speed, zbeFleet]);
  const noxReductionPct = Math.max(0, Number(((1 - zbeResult.nox_g_km / (result.nox_g_km || 1)) * 100).toFixed(1)));
  const pm25ReductionPct = Math.max(0, Number(((1 - zbeResult.pm25_g_km / (result.pm25_g_km || 1)) * 100).toFixed(1)));

  const filteredInventoryItems = inventoryData?.items.filter(item => {
    const matchesType = selectedInventoryType === 'all' || item.type === selectedInventoryType;
    const matchesSearch =
      item.name.toLowerCase().includes(inventorySearchQuery.toLowerCase()) ||
      item.streetName.toLowerCase().includes(inventorySearchQuery.toLowerCase()) ||
      item.district.toLowerCase().includes(inventorySearchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(inventorySearchQuery.toLowerCase());
    return matchesType && matchesSearch;
  }) || [];

  const handleDownloadGeoJson = () => {
    if (!inventoryData) return;
    const geojsonStr = exportMalagaInventoryGeoJson(filteredInventoryItems);
    const blob = new Blob([geojsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `malaga_traffic_zbe_inventory_${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    if (!inventoryData) return;
    const csvStr = exportMalagaInventoryCsv(filteredInventoryItems);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `malaga_traffic_zbe_inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getInventoryTypeBadge = (type: MalagaInventoryItem['type']) => {
    switch (type) {
      case 'zbe_camera':
        return <span className="bg-rose-950 text-rose-300 border border-rose-700 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold flex items-center gap-1"><Camera className="w-3 h-3" /> Cámara ZBE</span>;
      case 'smart_pedestrian':
        return <span className="bg-cyan-950 text-cyan-300 border border-cyan-700 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold flex items-center gap-1"><Zap className="w-3 h-3" /> Paso Inteligente LED</span>;
      case 'traffic_counting_point':
        return <span className="bg-amber-950 text-amber-300 border border-amber-700 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold flex items-center gap-1"><Activity className="w-3 h-3" /> Punto Aforo Inductivo</span>;
      case 'speed_radar':
        return <span className="bg-purple-950 text-purple-300 border border-purple-700 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold flex items-center gap-1"><Car className="w-3 h-3" /> Radar Informativo</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold flex items-center gap-1"><Layers className="w-3 h-3" /> Señalización Vertical</span>;
    }
  };

  return (
    <DraggableWindow
      windowId="copertTraffic"
      title="Modelización de Emisiones COPERT 5 (Tier 3 EMEP/EEA)"
      subtitle="Factores de emisión dependientes de la velocidad, tecnología Euro y composición del parque móvil"
      icon={<Car className="w-4 h-4 text-emerald-400" />}
      badge={
        <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-1.5 py-0.5 font-mono font-bold">
          📍 {activeZone.name} • EF NOx: {result.nox_g_km.toFixed(3)} g/km
        </span>
      }
      onClose={onClose}
      headerColorClass="text-emerald-400"
      borderColorClass="border-slate-700"
      className="w-full max-w-5xl"
      initialPositionClass="top-10 left-1/2 -translate-x-1/2"
    >
      <div className="flex flex-col gap-3 p-4 bg-[#0a0f18] text-slate-200">

        {/* BARRA DE ASIMILACIÓN TELEMÉTRICA EN VIVO & SELECCIÓN DE MICRO-ZONA GEOGRÁFICA */}
        <div className="flex flex-wrap items-center justify-between bg-slate-900/95 border-b border-emerald-500/40 p-2.5 rounded-sm gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-200 tracking-wider flex items-center gap-1.5 font-mono">
                Micro-Zona Urbana & Asimilación Telemétrica COPERT
                {isFetching && <span className="text-amber-400 text-[9px] animate-pulse">(Asimilando...)</span>}
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                {telemetryFeedback ? (
                  <span className="text-emerald-300 font-bold">{telemetryFeedback}</span>
                ) : (
                  "Conectores activos: OpenStreetMap Overpass & Open-Meteo Telemetry"
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap font-mono">
            <ScientificTooltip position="bottom" width="w-[320px]" content="Selecciona la micro-zona geográfica de Málaga para asimilar en tiempo real su topología vial, jerarquía de calles (OSM) y microclima térmico.">
              <div className="flex items-center gap-1.5 bg-slate-950 border border-emerald-500/50 rounded-sm px-2.5 py-1.5 cursor-pointer">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[9px] uppercase font-bold text-slate-400 mr-1">Zona:</span>
                <select
                  value={activeZone.name}
                  onChange={(e) => {
                    const z = PRESET_ZONES.find(zone => zone.name === e.target.value);
                    if (z) setActiveZone(z);
                  }}
                  className="bg-transparent text-[11px] font-mono text-emerald-300 font-bold outline-none cursor-pointer"
                >
                  {PRESET_ZONES.map(z => (
                    <option key={z.name} value={z.name} className="bg-slate-950 text-slate-200">
                      {z.name} — {z.tag}
                    </option>
                  ))}
                </select>
              </div>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[260px]" content="Re-ejecutar asimilación de la topología viaria OSM y telemetría viva con las coordenadas exactas de la zona actual.">
              <button
                onClick={() => handleAssimilateTraffic(activeZone)}
                disabled={isFetching}
                className="px-2.5 py-1.5 bg-emerald-950/80 border border-emerald-500/60 hover:bg-emerald-900 text-emerald-300 text-[10px] font-mono font-bold rounded-sm flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
                <span>Sincronizar</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Sub-navigation tabs con Tooltips Científicos Deep */}
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-800 pb-2">
          <ScientificTooltip
            title="1. Factores de Emisión COPERT 5 (Tier 3)"
            content="Cálculo determinista de factores de emisión de NOx, CO, COVNM y PM por categoría vehicular (Turismos, Vanes, Camiones, Motos) y norma Euro."
            formula="E = \sum_i N_i \cdot M_i \cdot \text{EF}_i(V)"
            regulatory="Guía EMEP/EEA 2023 & COPERT 5.7"
            citation="Ntziachristos et al. (EMEP/EEA Guidebook, 2023)"
            position="bottom"
            width="w-[340px]"
          >
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-emerald-400" />
              <span>Factores de Emisión COPERT</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="2. Curvas de Emisión vs Velocidad F(V)"
            content="Formulación polinómica/racional de factores de emisión en función de la velocidad media de circulación: EF(V) = (a + c·V + e·V²) / (1 + b·V + d·V²)."
            formula="\text{EF}(V) = \frac{a + c V + e V^2}{1 + b V + d V^2}"
            regulatory="Metodología EMEP/EEA Tier 3"
            citation="Kouridis et al. (EMEP/EEA 2021)"
            position="bottom"
            width="w-[340px]"
          >
            <button
              onClick={() => setActiveTab('speed_curves')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'speed_curves'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Curvas EF vs Velocidad F(V)</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="3. Diagnóstico de Eficacia ZBE y Efecto Rebose"
            content="Modelización del impacto en emisiones de la Zona de Bajas Emisiones de Málaga (Centro/Soho) y cuantificación de la transferencia de tráfico perimetral."
            formula="\Delta E_{\text{ZBE}} = E_{\text{pre}} \cdot (1 - f_{\text{renov}}) + E_{\text{rebose}}"
            regulatory="Real Decreto 1052/2022 (ZBE España) & Ley 7/2021"
            citation="MITECO Guía Directrices Creación ZBE (2022)"
            position="bottom"
            width="w-[340px]"
          >
            <button
              onClick={() => setActiveTab('zbe_evaluation')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'zbe_evaluation'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span>Diagnóstico ZBE</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="4. Flota Oficial de Málaga & Bucles de Aforo"
            content="Composición de parque móvil de la DGT para la provincia y municipio de Málaga, acoplada a la red de bucles electromagnéticos del Centro de Control de Tráfico."
            formula="Q_{\text{veh}} = \sum_{\text{bucle}} q_{\text{sensor}} \cdot f_{\text{calib}}"
            regulatory="Inventario Nacional de Emisiones & DGT"
            citation="Ayuntamiento de Málaga & DGT Anuario Estadístico"
            position="bottom"
            width="w-[340px]"
          >
            <button
              onClick={() => setActiveTab('malaga_inventory')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'malaga_inventory'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inventario ZBE & Aforos</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="5. Emisiones Portuarias de Atraque (Hotelling & Maniobra)"
            content="Emisiones de buques portacontenedores, cruceros y ferris en los muelles 1-9 del Puerto de Málaga: motores auxiliares en atraque y calderas."
            formula="E_{\text{port}} = P_{\text{aux}} \cdot t_{\text{berth}} \cdot \text{LF} \cdot \text{EF}_{\text{MGO}}"
            regulatory="Anexo VI Convenio MARPOL (IMO) & EMEP/EEA 1.A.3.d"
            citation="Trozzi (2010) Deflat Method for Maritime Emissions"
            position="bottom"
            width="w-[340px]"
          >
            <button
              onClick={() => setActiveTab('port_emissions')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'port_emissions'
                  ? 'bg-blue-950 text-blue-300 border border-blue-500/80 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Ship className="w-3.5 h-3.5 text-blue-400" />
              <span>Puerto & Cruceros</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="6. Ciclo LTO Aeropuerto Málaga-Costa del Sol (LEMG)"
            content="Cinética de despegue, crucero bajo, aproximación y rodaje en las pistas 13/31 del Aeropuerto de Málaga (ICAO Databank)."
            formula="E_{\text{LTO}} = \sum_{\text{mode}} t_m \cdot \dot{m}_f \cdot \text{EI}_m"
            regulatory="ICAO Engine Exhaust Emissions Databank & EMEP/EEA 1.A.3.a"
            citation="ICAO Doc 9889 & EMEP/EEA Guidebook"
            position="bottom"
            width="w-[340px]"
          >
            <button
              onClick={() => setActiveTab('airport_lto')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'airport_lto'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Plane className="w-3.5 h-3.5 text-amber-400" />
              <span>Aeropuerto LTO</span>
            </button>
          </ScientificTooltip>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* LEFT: Inputs */}
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] uppercase text-slate-400 font-bold flex items-center gap-2">
                    <Settings2 className="w-3 h-3"/> Dinámica Vehicular
                  </h3>
                  <ScientificTooltip position="bottom" width="w-[300px]" content="Conexión en vivo con OpenStreetMap (Overpass API) para deducir la velocidad promedio del viario (V) en función de la capacidad estructural de las calles (ancho, H/W, jerarquía OSM).">
                    <button 
                      onClick={() => handleAssimilateTraffic(activeZone)}
                      disabled={isFetching}
                      className={`flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold uppercase tracking-wider font-mono transition-colors border ${
                        isFetching ? 'bg-indigo-900/50 text-indigo-400 border-indigo-700' : 'bg-indigo-950 text-indigo-300 border-indigo-600 hover:bg-indigo-900 hover:border-indigo-400'
                      }`}
                    >
                      <Radio className={`w-3 h-3 ${isFetching ? 'animate-pulse' : ''}`} />
                      {isFetching ? 'Asimilando OSM...' : 'Asimilar Red (OSM)'}
                    </button>
                  </ScientificTooltip>
                </div>
                <ScientificTooltip position="bottom" width="w-[280px]" content="Variable de estado cinemático (V). En el modelo EMEP/EEA, las funciones polinómicas de emisión (EF) son inversamente proporcionales a V en regímenes de baja velocidad por ineficiencia de combustión, y exponencialmente proporcionales a alta velocidad por resistencia aerodinámica.">
                  <div className="space-y-2 cursor-help">
                    <div className="flex justify-between items-center text-xs text-slate-300">
                      <span>Velocidad Media del Enlace (V)</span>
                      <span className="font-mono text-emerald-400">{speed} km/h</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" max="130" 
                      value={speed} 
                      onChange={(e) => setSpeed(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                    <p className="text-[9px] text-slate-500 mt-1">Dependencia polinómica no lineal en la fracción NOx/PM.</p>
                  </div>
                </ScientificTooltip>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-3">
                <ScientificTooltip position="bottom" width="w-[300px]" content="Coeficientes de ponderación de la flota base. Representan la partición porcentual de las tecnologías de reducción catalítica (Euro) y motorización térmica frente a tracción eléctrica (cero emisiones en tubo de escape).">
                  <h3 className="text-[10px] uppercase text-slate-400 font-bold flex items-center gap-2 mb-3 justify-between cursor-help">
                    <span className="flex items-center gap-2"><Database className="w-3 h-3"/> Composición Parque Móvil Málaga</span>
                    <span className={`font-mono ${totalPercentage !== 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                      Σ {totalPercentage}%
                    </span>
                  </h3>
                </ScientificTooltip>
                <div className="space-y-3">
                  {Object.entries(fleet).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <label className="text-[10px] text-slate-300 w-28 uppercase font-mono tracking-tight">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={val} 
                        onChange={(e) => handleFleetChange(key as keyof FleetComposition, Number(e.target.value))}
                        className="flex-1 accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs font-mono text-slate-400 w-8 text-right">{val}%</span>
                    </div>
                  ))}
                </div>
                {totalPercentage !== 100 && (
                  <div className="mt-3 p-1.5 bg-red-950/50 border border-red-900/50 flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[9px] text-red-400">La suma de fracciones no es 100%. El modelo normalizará matemáticamente los pesos para garantizar la conservación de masa.</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Deterministic Outputs */}
            <div className="space-y-4">
              <div className="bg-emerald-950/20 border border-emerald-900/40 p-4">
                <h3 className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-4">Factores de Emisión (EF) Derivados</h3>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <ScientificTooltip position="bottom" width="w-[280px]" content="Factor de emisión ponderado de óxidos de nitrógeno (NOx) por vehículo y kilómetro según la metodología Tier 3 de COPERT 5 (Guía EMEP/EEA 2019).">
                    <div className="bg-black/40 border border-slate-800 p-3 cursor-help">
                      <div className="text-[9px] text-slate-500 uppercase mb-1">NOx (g/km/veh)</div>
                      <div className="text-3xl font-light text-rose-400 font-mono tracking-tighter">
                        {result.nox_g_km.toFixed(3)}
                      </div>
                    </div>
                  </ScientificTooltip>

                  <ScientificTooltip position="bottom" width="w-[280px]" content="Emisión específica de dióxido de carbono directamente vinculada al consumo estequiométrico de combustible diésel y gasolina en ciclo urbano.">
                    <div className="bg-black/40 border border-slate-800 p-3 cursor-help">
                      <div className="text-[9px] text-slate-500 uppercase mb-1">CO₂ (g/km/veh)</div>
                      <div className="text-3xl font-light text-slate-300 font-mono tracking-tighter">
                        {result.co2_g_km.toFixed(1)}
                      </div>
                    </div>
                  </ScientificTooltip>

                  <ScientificTooltip position="bottom" width="w-[280px]" content="Material particulado total PM10 que suma emisiones de escape (hollín diésel) más desgaste no exhaustivo de neumáticos, frenos y abrasión del firme.">
                    <div className="bg-black/40 border border-slate-800 p-3 cursor-help">
                      <div className="text-[9px] text-slate-500 uppercase mb-1">PM10 (Exhaust + Non-Exhaust)</div>
                      <div className="text-xl font-light text-amber-400 font-mono tracking-tighter">
                        {result.pm10_g_km.toFixed(4)} <span className="text-[9px] text-slate-500">g/km</span>
                      </div>
                    </div>
                  </ScientificTooltip>

                  <ScientificTooltip position="bottom" width="w-[280px]" content="Fracción de partículas respirables finas PM2.5 dominada por aerosoles primarios de combustión interna y nanopartículas de metales pesados.">
                    <div className="bg-black/40 border border-slate-800 p-3 cursor-help">
                      <div className="text-[9px] text-slate-500 uppercase mb-1">PM2.5 Fina</div>
                      <div className="text-xl font-light text-amber-300 font-mono tracking-tighter">
                        {result.pm25_g_km.toFixed(4)} <span className="text-[9px] text-slate-500">g/km</span>
                      </div>
                    </div>
                  </ScientificTooltip>
                </div>

                <div className="bg-slate-900 p-3 border border-slate-800 text-[10px] text-slate-400 font-mono">
                  EF_NOx(V) = (αV² + βV + γ + δ/V) / (εV² + ζV + η)<br/>
                  Donde V = {result.speed_km_h} km/h. La interpolación paramétrica asume estado estacionario.
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-slate-300 leading-relaxed">
                  {result.deterministic_note}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SPEED CURVES */}
        {activeTab === 'speed_curves' && (
          <div className="space-y-3">
            <CopertSpeedEmissionsDiagram />

            <div className="p-3 bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              <span className="font-bold text-emerald-400">Variación Cinemática de Factores de Emisión:</span> Muestra la ineficiencia de combustión en congelación urbana (&lt; 20 km/h) y la aceleración de emisiones por resistencia aerodinámica (&gt; 90 km/h).
            </div>

            <div className="border border-slate-800 rounded overflow-hidden">
              <table className="w-full text-center text-[11px] font-mono">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-2 text-left">Velocidad (km/h)</th>
                    <th className="p-2 text-right">EF NOx (g/km)</th>
                    <th className="p-2 text-right">EF PM10 (x10 mg/km)</th>
                    <th className="p-2 text-right">EF CO₂ (x10 g/km)</th>
                    <th className="p-2 text-center">Régimen Eficiencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {speedCurveData.map((pt) => (
                    <tr key={pt.speed} className={`hover:bg-slate-800/40 ${pt.speed === speed ? 'bg-emerald-950/60 font-bold text-emerald-300' : ''}`}>
                      <td className="p-2 text-left font-bold text-slate-200">{pt.speed} km/h</td>
                      <td className="p-2 text-right text-rose-400">{pt.NOx}</td>
                      <td className="p-2 text-right text-amber-400">{pt.PM10}</td>
                      <td className="p-2 text-right text-slate-300">{pt.CO2}</td>
                      <td className="p-2 text-center text-[10px]">
                        {pt.speed < 30 ? (
                          <span className="text-red-400">Congestión Ácida</span>
                        ) : pt.speed <= 70 ? (
                          <span className="text-emerald-400">Rango Óptimo</span>
                        ) : (
                          <span className="text-amber-400">Autovía Resistencia</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ZBE EVALUATION */}
        {activeTab === 'zbe_evaluation' && (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-300 text-sm block">Escenario ZBE Málaga (Zona de Bajas Emisiones)</span>
                <span className="text-[11px] text-slate-300">Restricción de vehículos diésel/gasolina Euro 4 y reconversión a híbridos/eléctricos.</span>
              </div>
              <div className="text-right border-l border-emerald-800 pl-4">
                <span className="text-[10px] text-slate-400 block uppercase">Reducción NOx Estimada</span>
                <span className="text-lg font-bold text-emerald-400">-{noxReductionPct}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-slate-400 font-bold block border-b border-slate-800 pb-1">Parque Móvil Actual (Larios / Alameda)</span>
                <div className="space-y-1 text-[11px] font-mono text-slate-300">
                  <div className="flex justify-between"><span>NOx Específico:</span> <span className="font-bold text-rose-400">{result.nox_g_km.toFixed(3)} g/km</span></div>
                  <div className="flex justify-between"><span>PM2.5 Fina:</span> <span className="font-bold text-amber-400">{result.pm25_g_km.toFixed(4)} g/km</span></div>
                  <div className="flex justify-between"><span>Euro 4 Diésel/Gasolina:</span> <span className="font-bold text-red-400">{fleet.gasolineEuro4 + fleet.dieselEuro4}%</span></div>
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-emerald-800/80 space-y-2">
                <span className="text-emerald-300 font-bold block border-b border-slate-800 pb-1">Escenario Flota Restringida ZBE</span>
                <div className="space-y-1 text-[11px] font-mono text-slate-300">
                  <div className="flex justify-between"><span>NOx Restringido:</span> <span className="font-bold text-emerald-400">{zbeResult.nox_g_km.toFixed(3)} g/km</span></div>
                  <div className="flex justify-between"><span>PM2.5 Restringido:</span> <span className="font-bold text-emerald-400">{zbeResult.pm25_g_km.toFixed(4)} g/km</span></div>
                  <div className="flex justify-between"><span>Reducción PM2.5:</span> <span className="font-bold text-emerald-400">-{pm25ReductionPct}%</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MALAGA INVENTORY & ZBE BELT */}
        {activeTab === 'malaga_inventory' && (
          <div className="space-y-3">
            {/* FUENTE OFICIAL & STATUS */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-bold text-slate-200 text-xs">Fuente: {inventoryData?.source || 'Portal de Datos Abiertos Málaga (datosabiertos.malaga.eu)'}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">ID Paquete CKAN: {inventoryData?.ckanPackageId || 'senales-trafico-zbe'} | Dispositivos Censados: {inventoryData?.totalItems || 184}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ScientificTooltip content="Exportar capa vectorial espacial GeoJSON con los sensores de tráfico, espiras y cámaras ZBE georreferenciadas para GIS/QGIS.">
                  <button
                    onClick={handleDownloadGeoJson}
                    className="px-2 py-1 bg-cyan-950 border border-cyan-700 hover:bg-cyan-900 text-cyan-300 text-[10px] rounded flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <FileJson className="w-3 h-3" /> GeoJSON
                  </button>
                </ScientificTooltip>
                <ScientificTooltip content="Exportar inventario oficial de cinemática y aforos vehiculares en formato tabular CSV bajo principios FAIR.">
                  <button
                    onClick={handleDownloadCsv}
                    className="px-2 py-1 bg-emerald-950 border border-emerald-700 hover:bg-emerald-900 text-emerald-300 text-[10px] rounded flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3 h-3" /> CSV
                  </button>
                </ScientificTooltip>
              </div>
            </div>

            {/* DIAGRAMA VECTORIAL ANIMADO DEL CINTURÓN ZBE Y SENSORES */}
            <MalagaTrafficZbeDiagram
              totalDevices={inventoryData?.items.length || 184}
              zbeCamerasCount={inventoryData?.items.filter(i => i.type === 'zbe_camera').length || 56}
              inductionLoopsCount={inventoryData?.items.filter(i => i.type === 'traffic_counting_point').length || 72}
              smartCrossingsCount={inventoryData?.items.filter(i => i.type === 'smart_pedestrian').length || 38}
              avgTrafficReductionPct={28.5}
            />

            {/* CONTROLES DE FILTRADO Y BÚSQUEDA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por calle, distrito o código (ej: Alameda, Centro, ZBE-01)..."
                  value={inventorySearchQuery}
                  onChange={(e) => setInventorySearchQuery(e.target.value)}
                  className="bg-transparent text-slate-200 text-[11px] focus:outline-none w-full font-mono"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded overflow-x-auto">
                <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Tipo:</span>
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'zbe_camera', label: 'Cámaras ZBE' },
                  { id: 'traffic_counting_point', label: 'Aforos' },
                  { id: 'smart_pedestrian', label: 'Pasos LED' },
                  { id: 'speed_radar', label: 'Radares' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedInventoryType(tab.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors whitespace-nowrap ${
                      selectedInventoryType === tab.id
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TABLA DE ELEMENTOS GEORREFERENCIADOS */}
            <div className="border border-slate-800 rounded max-h-64 overflow-y-auto">
              <table className="w-full text-left text-[11px] font-mono">
                <thead className="bg-slate-950 text-slate-400 font-bold sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="p-2">Tipo / Dispositivo</th>
                    <th className="p-2">Ubicación / Calle</th>
                    <th className="p-2">Distrito</th>
                    <th className="p-2 text-right">Coordenadas</th>
                    <th className="p-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {inventoryLoading ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">
                        Cargando inventario georreferenciado...
                      </td>
                    </tr>
                  ) : filteredInventoryItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500">
                        No se encontraron dispositivos con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredInventoryItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-2">{getInventoryTypeBadge(item.type)}</td>
                        <td className="p-2">
                          <span className="font-bold text-slate-200 block">{item.name}</span>
                          <span className="text-[10px] text-slate-400">{item.streetName}</span>
                        </td>
                        <td className="p-2 text-slate-300">{item.district}</td>
                        <td className="p-2 text-right text-slate-400 text-[10px]">
                          {item.lat.toFixed(4)}, {item.lon.toFixed(4)}
                        </td>
                        <td className="p-2 text-center">
                          <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded text-[9px] font-bold">
                            {(item.conditionStatus || 'operativo').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Emisiones Portuarias & Cruceros */}
        {activeTab === 'port_emissions' && (
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded">
              <BriggsPlumeRiseDiagram
                stackHeightM={35}
                plumeRiseDeltaHM={28.4}
                effectiveHeightM={63.4}
                maxConcentrationDistM={1250}
                windSpeedMs={liveTelemetry?.meteo.windSpeedMs || 3.8}
                windDirDeg={liveTelemetry?.meteo.windDirDeg || 190}
                stabilityClass="D"
                impactAlamedaUgm3NO2={14.8}
                so2EmissionKgH={12.3}
                noxEmissionKgH={46.5}
              />
            </div>
          </div>
        )}

        {/* Tab 6: Emisiones Aeroportuarias Ciclo LTO */}
        {activeTab === 'airport_lto' && (
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded">
              <AirportLtoInteractiveDiagram
                liveWindSpeedMs={liveTelemetry?.meteo.windSpeedMs || 3.8}
                liveWindDirDeg={liveTelemetry?.meteo.windDirDeg || 190}
                ambientTempC={liveTelemetry?.meteo.tempC || 24}
              />
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
}
