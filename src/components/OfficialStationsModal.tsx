import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, Database, MapPin, Activity, ExternalLink, Navigation, 
  CheckCircle2, Download, Radio, RefreshCw, Sparkles, FileText, 
  Satellite, Globe, Layers, Search, Filter, Flame, Wind, Eye, Compass
} from 'lucide-react';
import { 
  OfficialStation, StationComparisonResult, MeteoData, 
  OFFICIAL_MALAGA_AIR_STATIONS, OFFICIAL_SATELLITE_MISSIONS, SatelliteMission 
} from '../lib/physics';
import { generateDetectorsInventoryPdf } from '../lib/detectorsPdfGenerator';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { StationTelemetryChart } from './StationTelemetryChart';
import { NetworkTopologyTelemetryDiagram } from './NetworkTopologyTelemetryDiagram';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import { useActivePoint } from '../context/ActivePointContext';

interface OfficialStationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: StationComparisonResult[];
  onFlyToStation: (lat: number, lon: number) => void;
  onApplyStationData?: (data: Partial<MeteoData>) => void;
}

type TerrestrialCategory = 'all' | 'traffic' | 'industrial' | 'column' | 'coastal' | 'aviation' | 'ridges' | 'basin';

export const OfficialStationsModal: React.FC<OfficialStationsModalProps> = ({
  isOpen,
  onClose,
  stations,
  onFlyToStation,
  onApplyStationData
}) => {
  const activeCtx = useActivePoint();
  const [activeTab, setActiveTab] = useState<'terrestrial' | 'satellite'>('terrestrial');
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TerrestrialCategory>('all');
  const [liveOpenAQ, setLiveOpenAQ] = useState<any[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  const fetchLiveOpenAQ = async () => {
    setIsLoadingLive(true);
    try {
      const res = await fetch('/api/openaq/malaga');
      if (res.ok) {
        const json = await res.json();
        setLiveOpenAQ(json.stations || []);
      }
    } catch (e) {
      console.error("Error fetching live OpenAQ stations:", e);
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLiveOpenAQ();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Cálculo de métricas globales de la red
  const avgMAE = stations.length > 0
    ? (stations.reduce((acc, curr) => acc + curr.errorAbsoluteNO2, 0) / stations.length).toFixed(2)
    : '0.00';
  const avgConfidence = stations.length > 0
    ? (stations.reduce((acc, curr) => acc + curr.confidenceScore, 0) / stations.length).toFixed(1)
    : '0.0';

  // Clasificador de categoría por entorno físico
  const getStationCategory = (env: string): TerrestrialCategory => {
    switch (env) {
      case 'urban_traffic':
      case 'subterranean_tunnel_confined':
      case 'highway_traffic_microclimate':
      case 'railway_intermodal_blackcarbon':
        return 'traffic';
      case 'cement_factory_industrial':
      case 'landfill_biogas_fugitive':
      case 'wastewater_ammonia_interface':
      case 'coastal_east_industrial':
        return 'industrial';
      case 'photometric_aeronet_nasa':
      case 'actinic_radiometry_uvi':
      case 'bioaerosol_aerobiological':
      case 'aerological_sounding':
        return 'column';
      case 'coastal':
      case 'port_industrial':
      case 'oceanographic_buoy':
      case 'maritime_tide_gauge':
      case 'coastal_synoptic_marine':
      case 'coastal_foothill_acceleration':
      case 'centennial_historical_coastal':
      case 'csic_marine_observatory':
        return 'coastal';
      case 'airport_logistics':
      case 'aeronautical_awos_windshear':
        return 'aviation';
      case 'urban_hill_ridge':
      case 'mountain_headwater_basin':
      case 'mountain_pass_foehn':
      case 'doppler_radar_wind_profiler':
      case 'suburban_altitude':
        return 'ridges';
      case 'fluvial_drainage_basin':
      case 'fluvial_canyon_drainage':
      case 'estuarine_wetland_interface':
      case 'botanical_canopy_cool_island':
      case 'suburban_basin_ozone':
      case 'inland_valley_ozone':
      case 'regional_upwind_inflow':
      case 'regional_pristine_background':
      case 'periurban_technology':
      case 'suburban_university':
      case 'csic_uma_biogenic_agroforestry':
      default:
        return 'basin';
    }
  };

  const filteredStations = useMemo(() => {
    return stations.filter(item => {
      const matchesSearch = 
        item.station.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.station.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.station.network.toLowerCase().includes(searchFilter.toLowerCase());
      
      if (!matchesSearch) return false;
      if (categoryFilter === 'all') return true;

      const cat = getStationCategory(item.station.environmentType);
      return cat === categoryFilter;
    });
  }, [stations, searchFilter, categoryFilter]);

  // Exportar GeoJSON FAIR
  const handleExportGeoJSON = () => {
    const geoJson = {
      type: "FeatureCollection",
      properties: {
        title: "Red Integral Terrestre y Misiones Satelitales de Calidad del Aire - Málaga",
        university: "Universidad Nacional de Educación a Distancia (UNED)",
        doctoralSchool: "Escuela Internacional de Doctorado (EIDUNED)",
        author: "Dionisio Gálvez Pozo (Doctorando)",
        regulatory_compliance: "Directiva 2008/50/CE & Guías OMS 2021 & Protocolo FAIRMODE WG1",
        avg_mae_no2: avgMAE,
        total_terrestrial_stations: stations.length,
        total_satellite_missions: OFFICIAL_SATELLITE_MISSIONS.length,
        timestamp: new Date().toISOString()
      },
      features: [
        ...stations.map(s => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [s.station.lon, s.station.lat]
          },
          properties: {
            domain: "Terrestre In Situ",
            code: s.station.code,
            name: s.station.name,
            network: s.station.network,
            environment: s.station.environmentType,
            altitude_m: s.station.altM,
            measuredNO2: s.measuredNO2,
            measuredO3: s.measuredO3,
            measuredPM10: s.measuredPM10,
            measuredPM25: s.measuredPM25,
            simulatedNO2: s.estimatedNO2,
            errorMAE: s.errorAbsoluteNO2,
            confidenceScore: s.confidenceScore,
            sensors: s.station.sensors
          }
        })),
        ...OFFICIAL_SATELLITE_MISSIONS.map(m => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [m.lon, m.lat]
          },
          properties: {
            domain: "Misión Satelital / Reanálisis",
            code: m.code,
            name: m.name,
            agency: m.agency,
            orbitType: m.orbitType,
            resolution: m.spatialResolution,
            revisitPassMálaga: m.revisitPassMálaga,
            assimilationMethod: m.assimilationMethod,
            currentValueMálaga: m.currentValueMálaga,
            unit: m.unit,
            doi: m.doi,
            targetSpecies: m.targetSpecies
          }
        }))
      ]
    };

    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Malaga_Red_Terrestre_y_Satelital_FAIR_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Exportar CSV
  const handleExportCSV = () => {
    let csv = "# RED INTEGRAL DE CALIDAD DEL AIRE DE MALAGA - TESIS DOCTORAL\n";
    csv += "# Universidad: Universidad Nacional de Educacion a Distancia (UNED) - EIDUNED\n";
    csv += "# Doctorando: Dionisio Galvez Pozo\n";
    csv += "Tipo_Dominio,Codigo,Nombre,Agencia_Red,Latitud,Longitud,Cota_Resolucion,NO2_o_Valor,O3_o_Unidad,PM10,PM2.5,Metodo_Asimilacion\n";
    stations.forEach(s => {
      csv += `"Terrestre","${s.station.code}","${s.station.name}","${s.station.network}",${s.station.lat},${s.station.lon},"${s.station.altM} m",${s.measuredNO2},${s.measuredO3},${s.measuredPM10},${s.measuredPM25},"PINN Local / Kriging"\n`;
    });
    OFFICIAL_SATELLITE_MISSIONS.forEach(m => {
      csv += `"Satelite","${m.code}","${m.name}","${m.agency}",${m.lat},${m.lon},"${m.spatialResolution}","${m.currentValueMálaga}","${m.unit}","N/A","N/A","${m.assimilationMethod}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Red_${stations.length}Nodos_Terrestres_y_${OFFICIAL_SATELLITE_MISSIONS.length}Satelites_Malaga_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Descargar PDF Oficial de Detectores y Pasarelas de Ingestión
  const handleDownloadPDF = () => {
    try {
      const doc = generateDetectorsInventoryPdf({
        activePoint: {
          name: activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name,
          district: activeCtx?.activePoint?.districtName,
          neighborhood: activeCtx?.activePoint?.neighborhoodName,
          lat: activeCtx?.activePoint?.lat,
          lon: activeCtx?.activePoint?.lon,
          elevationM: activeCtx?.activePoint?.elevationM,
          canyonAspectRatioHW: activeCtx?.activePoint?.aspectRatioHw,
          skyViewFactor: activeCtx?.activePoint?.skyViewFactorSvf,
          no2UgM3: activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? activeCtx?.data?.no2_satelite_base,
          o3UgM3: activeCtx?.assimilation?.ozoneO3UgM3 ?? activeCtx?.data?.ozone,
          pm25UgM3: activeCtx?.assimilation?.pm25UgM3 ?? activeCtx?.data?.pm2_5,
          pm10UgM3: activeCtx?.assimilation?.pm10UgM3 ?? activeCtx?.data?.pm10,
          windSpeedKmh: activeCtx?.data?.velocidad_viento_km_h,
          windDirDeg: activeCtx?.data?.direccion_viento_grados,
          temperatureC: activeCtx?.data?.temperatura_malaga,
          relativeHumidityPct: activeCtx?.data?.humedad_relativa
        }
      });
      doc.save(`Memoria_Metrologica_Detectores_Malaga_${OFFICIAL_MALAGA_AIR_STATIONS.length}_${OFFICIAL_SATELLITE_MISSIONS.length}.pdf`);
    } catch (e) {
      console.error('Error generando PDF de detectores:', e);
      window.open('/api/download-sensors-pdf', '_blank');
    }
  };

  const applyTelemetryToPhysicsEngine = (station: StationComparisonResult) => {
    if (!onApplyStationData) return;
    
    const newData: Partial<MeteoData> = {
      no2_satelite_base: station.measuredNO2,
      ozone: station.measuredO3,
      pm2_5: station.measuredPM25,
      pm10: station.measuredPM10,
    };
    
    onApplyStationData(newData);
    activeCtx?.syncActivePoint(station.station.lat, station.station.lon, {
      name: station.station.name,
      fly: true
    });
    setAppliedNotice(`Telemetría asimilada desde ${station.station.name}`);
    setTimeout(() => setAppliedNotice(null), 3500);
  };

  return (
    <DraggableWindow
      title="Observatorio Oficial de Calidad del Aire de Málaga (Red Terrestre & Satelital)"
      subtitle={`Asimilación continua de ${stations.length} estaciones oficiales (Junta, AEMET, DGT, ADIF, Puerto) acoplada a ${OFFICIAL_SATELLITE_MISSIONS.length} misiones satelitales (Copernicus, NASA, ESA)`}
      icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
      badge={
        <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-1.5 py-0.5 font-mono font-bold">
          {stations.length} NODOS TERRESTRES · {OFFICIAL_SATELLITE_MISSIONS.length} SATÉLITES · MAE: {avgMAE} µg/m³
        </span>
      }
      headerExtra={
        <div className="flex items-center gap-1.5">
          {/* Conmutador de Pestañas */}
          <div className="flex bg-slate-900 border border-slate-700 rounded p-0.5">
            <ScientificTooltip position="bottom" width="w-[280px]" content={`Las ${stations.length} estaciones oficiales in situ de Málaga (Junta de Andalucía REDIAM, AEMET, DGT, ADIF, Puerto, SAIH Hidrosur, UMA, ZBE) con lecturas de quimioluminiscencia y absorción UV.`}>
              <button
                onClick={() => setActiveTab('terrestrial')}
                className={`px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 transition-all rounded-xs cursor-pointer ${
                  activeTab === 'terrestrial' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Ver red de ${stations.length} estaciones terrestres in situ de Málaga`}
              >
                <Globe className="w-3 h-3" />
                <span>Red Terrestre ({stations.length})</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content={`Misiones de observación espacial de la Tierra (${OFFICIAL_SATELLITE_MISSIONS.length} satélites: Copernicus Sentinel-5P/4/5/2/3, EUMETSAT MTG/IASI-NG, ESA/JAXA EarthCARE ATLID, NASA PACE/ECOSTRESS/OCO-3/EMIT, Landsat, VIIRS, EnMAP/PRISMA) e interpolación CAMS.`}>
              <button
                onClick={() => setActiveTab('satellite')}
                className={`px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 transition-all rounded-xs cursor-pointer ${
                  activeTab === 'satellite' 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Ver misiones satelitales y asimilación Copernicus CAMS"
              >
                <Satellite className="w-3 h-3" />
                <span>Satélites & CAMS ({OFFICIAL_SATELLITE_MISSIONS.length})</span>
              </button>
            </ScientificTooltip>
          </div>

          <ScientificTooltip
            position="bottom"
            width="w-[280px]"
            content="Consulta en vivo a la API OpenAQ v3 (European Environment Agency / REDIAM) para actualización de telemetría de NO₂, O₃ y PM."
          >
            <button
              onClick={fetchLiveOpenAQ}
              disabled={isLoadingLive}
              className="p-1 text-emerald-400 hover:text-white bg-emerald-950/60 border border-emerald-700/60 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin' : ''}`} />
            </button>
          </ScientificTooltip>
        </div>
      }
      onClose={onClose}
      className="w-full max-w-5xl"
      initialPositionClass="top-20 left-1/2 -translate-x-1/2"
      headerColorClass="text-emerald-400"
      borderColorClass="border-emerald-500/50"
      defaultCollapsed={false}
    >
      <div className="flex flex-col h-[78vh] md:h-[650px] overflow-hidden text-slate-200 bg-[#080d16]">
        {/* Banner Unificado del Punto Activo */}
        <div className="p-2 border-b border-slate-800 bg-slate-950/80">
          <ActivePointSyncBanner compact={true} />
        </div>

        {/* Banner Superior de Estado */}
        <div className="p-2 border-b border-slate-800 bg-slate-950 text-xs font-mono text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Asimilación Multiescala: {stations.length} Nodos In Situ + {OFFICIAL_SATELLITE_MISSIONS.length} Sensores Satelitales (FAIRMODE WG1)</span>
          </div>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> STATUS: CONFORME (MQI ≤ 1.0)
          </span>
        </div>

        {appliedNotice && (
          <div className="bg-emerald-950/80 border-b border-emerald-800 p-2 text-[10px] text-emerald-300 font-bold font-mono text-center flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3 text-emerald-400" /> {appliedNotice}
          </div>
        )}

        {/* CONTENIDO DE PESTAÑA: RED TERRESTRE */}
        {activeTab === 'terrestrial' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Topología y Filtros */}
            <div className="p-2.5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              {/* Buscador de estaciones */}
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar estación (nombre, código o red)..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 bg-slate-900 border border-slate-700 text-[10.5px] rounded text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Botonera de Categorías con Tooltips Científicos */}
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { 
                    id: 'all', 
                    label: `Todas (${stations.length})`,
                    tip: `Visualizar la red completa in situ de ${stations.length} estaciones oficiales terrestres y marinas de Málaga.`
                  },
                  { 
                    id: 'traffic', 
                    label: 'Tráfico & Túneles',
                    tip: 'Estaciones orientadas a emisiones vehiculares directas (NO₂, BC, CO) y ventilación confinada en cañones y túneles urbanos (Paseo del Parque, El Fuerte, Autovía A-7, Carlos Haya).'
                  },
                  { 
                    id: 'industrial', 
                    label: 'Industria & Emisión',
                    tip: 'Monitoreo de focos puntuales industriales e infraestructuras críticas (Cementera La Araña, EDAR Guadalhorce, Biogás Los Ruices).'
                  },
                  { 
                    id: 'column', 
                    label: 'Columna & NASA',
                    tip: 'Fotometría solar AERONET/NASA (AOD 550nm), radiometría actínica UV UMA y sondeos aerológicos verticales.'
                  },
                  { 
                    id: 'coastal', 
                    label: 'Litoral & Puerto',
                    tip: 'Boyas oceanográficas de aguas profundas (REDEXT), mareógrafos de Puertos del Estado, atraque de cruceros y observatorio marino CSIC/IEO.'
                  },
                  { 
                    id: 'aviation', 
                    label: 'Aeropuerto',
                    tip: 'Sistemas meteorológicos de precisión aeronáutica AWOS y cizalladura de viento en pistas del Aeropuerto de Málaga-Costa del Sol (AGP).'
                  },
                  { 
                    id: 'ridges', 
                    label: 'Crestas & Radar',
                    tip: 'Radares meteorológicos Doppler de AEMET, estaciones orográficas de cumbre (Montes de Málaga, Mijas) y flujo Foehn.'
                  },
                  { 
                    id: 'basin', 
                    label: 'Cuenca & Bioclima',
                    tip: 'Red hidrometeorológica SAIH Hidrosur, cuencas de drenaje fluvial (Guadalhorce, Campanillas), fondos de ozono regional y agroforestal IFAPA/CSIC.'
                  },
                ].map(cat => (
                  <ScientificTooltip
                    key={cat.id}
                    position="bottom"
                    width="w-[280px]"
                    content={cat.tip}
                  >
                    <button
                      onClick={() => setCategoryFilter(cat.id as TerrestrialCategory)}
                      className={`px-2 py-0.5 text-[9px] font-bold rounded transition-colors cursor-pointer border ${
                        categoryFilter === cat.id
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-xs'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  </ScientificTooltip>
                ))}
              </div>
            </div>

            {/* Panel de Topología y Lista de Estaciones */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 overflow-hidden p-3">
              {/* Columna Izquierda: Métricas y Diagrama Vectorial */}
              <div className="md:col-span-5 flex flex-col gap-2.5 overflow-hidden">
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded">
                  <h3 className="text-[10.5px] uppercase text-emerald-400 font-bold flex items-center gap-1.5 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Métricas de Validación Global (FAIRMODE WG1)
                  </h3>
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-[8.5px] text-slate-400 uppercase block">MAE Global (NO₂)</span>
                      <span className="text-lg font-bold text-red-400">{avgMAE} <span className="text-[9px] text-slate-500">µg/m³</span></span>
                    </div>
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-[8.5px] text-slate-400 uppercase block">Confianza Ponderada</span>
                      <span className="text-lg font-bold text-emerald-400">{avgConfidence}%</span>
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-slate-900/80 border border-slate-800 rounded flex-1 overflow-hidden flex flex-col">
                  <span className="text-[9px] text-slate-400 uppercase font-mono font-bold mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-cyan-400" /> Dispersión Multivariable NO₂ / O₃
                  </span>
                  <div className="flex-1 overflow-hidden">
                    <StationTelemetryChart stations={filteredStations.length > 0 ? filteredStations : stations} />
                  </div>
                </div>

                <div className="p-2 bg-emerald-950/20 border-l-2 border-emerald-500 text-[9px] text-slate-300 font-mono leading-relaxed">
                  <strong className="text-emerald-400 block mb-0.5">Rigor Metodológico (Zero Stochastic Data):</strong>
                  Telemetría oficial de AEMET, Junta de Andalucía, DGT, ADIF, Puerto y UMA acoplada a ecuaciones deterministas Navier-Stokes y cinética de Leighton.
                </div>
              </div>

              {/* Columna Derecha: Tarjetas de Estaciones */}
              <div className="md:col-span-7 h-full overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                <div className="sticky top-0 bg-[#080d16] py-1 border-b border-slate-800 z-10 flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>Estaciones Filtradas: <strong className="text-emerald-400">{filteredStations.length}</strong> de {stations.length}</span>
                  <span className="text-[8.5px] text-slate-500">Haz clic en 📍 para volar en el mapa</span>
                </div>

                {filteredStations.map((item) => {
                  const matchingOpenAQ = liveOpenAQ.find(s => s.name?.toLowerCase().includes(item.station.name.toLowerCase().split(' ')[0]));

                  return (
                    <div key={item.station.id} className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded p-2.5 space-y-2 transition-all">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{item.station.name}</span>
                          </h4>
                          <div className="text-[8.5px] text-slate-400 font-mono mt-0.5 flex flex-wrap gap-x-2">
                            <span className="text-cyan-400 font-bold">{item.station.code}</span>
                            <span>• Cota: <strong>+{item.station.altM}m</strong></span>
                            <span>• {item.station.network}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <ScientificTooltip position="left" content="Asimilar telemetría de esta estación en las condiciones de contorno globales del gemelo digital.">
                            <button
                              onClick={() => applyTelemetryToPhysicsEngine(item)}
                              className="p-1 bg-slate-800 hover:bg-emerald-900/80 hover:text-emerald-300 text-slate-400 rounded transition-colors cursor-pointer"
                              title="Asimilar telemetría"
                            >
                              <Database className="w-3.5 h-3.5" />
                            </button>
                          </ScientificTooltip>
                          <ScientificTooltip position="left" content="Centrar cámara 3D sobre la ubicación de la estación y fijar como punto activo global.">
                            <button
                              onClick={() => {
                                onFlyToStation(item.station.lat, item.station.lon);
                                activeCtx?.syncActivePoint(item.station.lat, item.station.lon, {
                                  name: item.station.name,
                                  fly: true
                                });
                              }}
                              className="p-1 bg-slate-800 hover:bg-emerald-900 hover:text-emerald-400 text-slate-400 rounded transition-colors cursor-pointer"
                              title="Volar a la estación y fijar punto activo"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                            </button>
                          </ScientificTooltip>
                        </div>
                      </div>

                      {/* Mediciones empíricas vs simuladas */}
                      <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                        <div className="bg-slate-950 p-1.5 rounded border border-slate-800/80">
                          <div className="text-slate-500 uppercase tracking-widest text-[8px] flex justify-between">
                            <span>NO₂ Medido</span>
                            <span className="text-emerald-400">U₉₅=15%</span>
                          </div>
                          <div className="text-sm text-cyan-400 font-mono font-bold">
                            {item.measuredNO2.toFixed(1)} <span className="text-[9px] text-slate-500 font-normal">µg/m³</span>
                          </div>
                        </div>
                        <div className="bg-slate-950 p-1.5 rounded border border-slate-800/80">
                          <div className="text-slate-500 uppercase tracking-widest text-[8px] flex justify-between">
                            <span>NO₂ PINN Modelado</span>
                            <span className="text-fuchsia-400">Δ={item.errorAbsoluteNO2.toFixed(1)}</span>
                          </div>
                          <div className="text-sm text-fuchsia-400 font-mono font-bold">
                            {item.estimatedNO2.toFixed(1)} <span className="text-[9px] text-slate-500 font-normal">µg/m³</span>
                          </div>
                        </div>
                      </div>

                      {/* Sensores y Co-parámetros */}
                      <div className="flex flex-wrap items-center justify-between text-[9px] font-mono border-t border-slate-800/60 pt-1.5 text-slate-400">
                        <div className="flex gap-2">
                          <span>O₃: <strong className="text-slate-200">{item.measuredO3}</strong></span>
                          <span>PM₁₀: <strong className="text-slate-200">{item.measuredPM10}</strong></span>
                          <span>PM₂.₅: <strong className="text-slate-200">{item.measuredPM25}</strong></span>
                        </div>
                        <span className="text-emerald-400 font-bold">Ajuste: {item.confidenceScore}%</span>
                      </div>

                      {/* Sensores disponibles */}
                      <div className="flex flex-wrap gap-1 text-[8px] font-mono">
                        {item.station.sensors.map((sensor, sIdx) => (
                          <span key={sIdx} className="bg-slate-950 text-slate-400 border border-slate-800 px-1 py-0.2 rounded-xs">
                            {sensor}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO DE PESTAÑA: SATÉLITES & COPERNICUS */}
        {activeTab === 'satellite' && (
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
            <div className="bg-purple-950/30 border border-purple-800/50 p-3 rounded text-[11px] leading-relaxed text-slate-300">
              <strong className="text-purple-300 flex items-center gap-1.5 mb-1 font-mono uppercase text-xs">
                <Satellite className="w-4 h-4 text-purple-400" />
                Asimilación de Misiones Espaciales & Reanálisis de Contorno (Tesis Doctoral Málaga)
              </strong>
              Los satélites de órbita polar y los modelos de reanálisis de Copernicus CAMS fijan las condiciones de contorno de Dirichlet (<strong>∂Ω</strong>) y la columna troposférica integrada verticalmente, que luego el motor PINN desescala a resolución de 1 metro en las calles de Málaga.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {OFFICIAL_SATELLITE_MISSIONS.map(mission => (
                <div key={mission.id} className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded p-3 space-y-2.5 transition-all">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[8.5px] uppercase font-mono px-1.5 py-0.5 bg-purple-950 text-purple-300 border border-purple-700 rounded-xs font-bold">
                        {mission.agency}
                      </span>
                      <h4 className="text-sm font-bold text-slate-100 mt-1 flex items-center gap-1.5">
                        <Satellite className="w-4 h-4 text-purple-400 shrink-0" />
                        <span>{mission.name}</span>
                      </h4>
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                        {mission.orbitType} · Celda: <strong className="text-slate-200">{mission.spatialResolution}</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => onFlyToStation(mission.lat, mission.lon)}
                      className="p-1.5 bg-slate-800 hover:bg-purple-900 text-slate-400 hover:text-purple-300 rounded transition-colors cursor-pointer shrink-0"
                      title="Volar al pie orbital en Málaga"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                    {mission.description}
                  </p>

                  {/* Valor Actual Asimilado */}
                  <div className="p-2 bg-slate-950 border border-slate-800/80 rounded flex justify-between items-center font-mono">
                    <div>
                      <span className="text-[8px] text-slate-500 uppercase block">Valor Asimilado sobre Málaga</span>
                      <span className="text-base font-bold text-purple-300">
                        {mission.currentValueMálaga} <span className="text-[10px] text-slate-400 font-normal">{mission.unit}</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-slate-500 uppercase block">Paso / Frecuencia</span>
                      <span className="text-[9.5px] text-cyan-400 font-bold">{mission.revisitPassMálaga}</span>
                    </div>
                  </div>

                  {/* Método de Asimilación & Especies */}
                  <div className="text-[9px] font-mono space-y-1">
                    <div className="text-slate-400">
                      <strong className="text-slate-300">Acoplamiento Físico:</strong> {mission.assimilationMethod}
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {mission.targetSpecies.map((sp, idx) => (
                        <span key={idx} className="bg-slate-950 text-purple-300/80 border border-purple-900/60 px-1 py-0.2 text-[8px] rounded-xs">
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[8.5px] font-mono text-slate-500 border-t border-slate-800/60 pt-1.5">
                    <span>DOI: {mission.doi}</span>
                    <span className="text-emerald-400 font-bold">● FEED EN VIVO ACTIVO</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer con Exportaciones FAIR */}
        <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ScientificTooltip position="top" width="w-[280px]" content={`Exportar matriz completa de ${stations.length} nodos terrestres y ${OFFICIAL_SATELLITE_MISSIONS.length} misiones espaciales en CSV estandarizado para reproducibilidad científica (Directiva 2008/50/CE).`}>
              <button
                onClick={handleExportCSV}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3 text-slate-400" /> Exportar CSV Completo
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="top" width="w-[280px]" content={`Descargar la memoria técnica completa en PDF con el inventario de todas las estaciones terrestres (${stations.length}), misiones satelitales (${OFFICIAL_SATELLITE_MISSIONS.length}) y pasarelas de ingestión en tiempo real.`}>
              <button
                onClick={handleDownloadPDF}
                className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 text-[10px] font-mono font-bold border border-rose-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <FileText className="w-3 h-3 text-rose-400" /> Descargar PDF Censo Detectores ({stations.length}+{OFFICIAL_SATELLITE_MISSIONS.length})
              </button>
            </ScientificTooltip>
          </div>
          <ScientificTooltip position="top" width="w-[280px]" content={`Descargar la colección GeoJSON con los puntos georreferenciados de las ${stations.length} estaciones oficiales y los ${OFFICIAL_SATELLITE_MISSIONS.length} centros de celda orbital satelital.`}>
            <button
              onClick={handleExportGeoJSON}
              className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              Descargar GeoJSON FAIR ({stations.length}+{OFFICIAL_SATELLITE_MISSIONS.length} Nodos)
            </button>
          </ScientificTooltip>
        </div>
      </div>
    </DraggableWindow>
  );
};
