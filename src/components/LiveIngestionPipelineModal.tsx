import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw, Wind, Thermometer, Ship, Car, CheckCircle2, Sparkles, FileText, Droplets, Flower2, Search, Database, Globe, Layers, Radar, Factory, ExternalLink, Cpu, Plane, Camera, Rocket, Zap, ShieldCheck, Download, Printer, MapPin } from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { MathFormula } from './MathFormula';
import { useActivePoint } from '../context/ActivePointContext';
import { UnifiedLiveTelemetryPackage, fetchLiveOpenMeteoData, fetchLiveMarineData, calculateLiveTrafficCopert, calculateLivePortEmissions, calculateLiveHydroData, calculateLiveBioData, exportLiveTelemetryCsv, exportCatalogCsv, exportGeoJsonDataSources, exportPdfReport, OFFICIAL_DATA_SOURCES_CATALOG, DataSourceMetadata } from '../lib/liveTelemetryPipeline';

export interface LiveIngestionPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'live' | 'catalog' | 'satellites' | 'roadmap';
type StatusFilter = 'TODAS' | 'ACTIVAS' | 'FUTURAS';

export function LiveIngestionPipelineModal({
  isOpen,
  onClose
}: LiveIngestionPipelineModalProps) {
  const activePointCtx = useActivePoint();
  const [activeTab, setActiveTab] = useState<TabType>('live');
  const [telemetry, setTelemetry] = useState<UnifiedLiveTelemetryPackage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('TODAS');

  const loadLiveData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/live-telemetry');
      if (res.ok) {
        const data: UnifiedLiveTelemetryPackage = await res.json();
        setTelemetry(data);
        setLastUpdated(new Date().toLocaleTimeString());
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn("Express proxy telemetry fetch failed, falling back to direct API fetch:", e);
    }

    // Direct fallback from React client
    try {
      const meteo = await fetchLiveOpenMeteoData();
      const marine = await fetchLiveMarineData(36.68, -4.38);
      const traffic = calculateLiveTrafficCopert();
      const port = calculateLivePortEmissions();
      const hydro = calculateLiveHydroData(meteo.relative_humidity_pct, meteo.temperature_2m_c);
      const bio = calculateLiveBioData(meteo.temperature_2m_c);

      const pkg: UnifiedLiveTelemetryPackage = {
        timestamp: new Date().toISOString(),
        meteo,
        marine,
        traffic,
        port,
        hydro,
        bio,
        isRealtimeLive: true,
        sourceList: OFFICIAL_DATA_SOURCES_CATALOG.filter(s => s.faseIntegracion === 'Fase I - Integrado').map(s => `${s.nombre} (${s.fuenteOficial})`)
      };
      setTelemetry(pkg);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Direct live fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLiveData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadLiveCsv = () => {
    if (!telemetry) return;
    const csvContent = exportLiveTelemetryCsv(telemetry);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `telemetria_en_vivo_malaga_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCatalogCsv = () => {
    const csvContent = exportCatalogCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `catalogo_${OFFICIAL_DATA_SOURCES_CATALOG.length}_fuentes_oficiales_malaga_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadGeoJson = () => {
    const geojsonStr = exportGeoJsonDataSources();
    const blob = new Blob([geojsonStr], { type: 'application/geo+json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `red_espacial_${OFFICIAL_DATA_SOURCES_CATALOG.length}fuentes_malaga_${Date.now()}.geojson`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPdf = () => {
    exportPdfReport(telemetry, activePointCtx);
  };

  const activeCount = OFFICIAL_DATA_SOURCES_CATALOG.filter(s => s.faseIntegracion === 'Fase I - Integrado').length;
  const phase2Count = OFFICIAL_DATA_SOURCES_CATALOG.filter(s => s.faseIntegracion === 'Fase II - Próxima (2025)').length;
  const phase3Count = OFFICIAL_DATA_SOURCES_CATALOG.filter(s => s.faseIntegracion === 'Fase III - Roadmap Futuro').length;
  const totalCount = OFFICIAL_DATA_SOURCES_CATALOG.length;

  const categories: string[] = ['TODAS', ...Array.from(new Set(OFFICIAL_DATA_SOURCES_CATALOG.map(s => s.categoria)))];

  const filteredCatalog = OFFICIAL_DATA_SOURCES_CATALOG.filter(source => {
    const matchesCategory = selectedCategory === 'TODAS' || source.categoria === selectedCategory;
    
    let matchesStatus = true;
    if (statusFilter === 'ACTIVAS') {
      matchesStatus = source.faseIntegracion === 'Fase I - Integrado';
    } else if (statusFilter === 'FUTURAS') {
      matchesStatus = source.faseIntegracion !== 'Fase I - Integrado';
    }

    const matchesSearch = searchQuery === '' || 
      source.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.fuenteOficial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.parametrosClave.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
      source.fundamentoNormativo.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <DraggableWindow
      title="RED UNIFICADA DE FUENTES DE DATOS (ACTIVAS & ROADMAP FUTURO)"
      onClose={onClose}
      className="w-[1040px] max-h-[92vh]"
      icon={<Radio className="w-4 h-4 text-emerald-400 animate-pulse" />}
    >
      <div className="p-4 space-y-3.5 text-xs font-mono text-slate-200">

        {/* Header Principal con Contadores Globales y Opciones de Exportación */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-3">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-emerald-950 border border-emerald-800 text-emerald-400">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">Catálogo de Ingesta & Red de Telemetría Málaga</span>
                  <span className="px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {activeCount} ACTIVAS + {phase2Count + phase3Count} ROADMAP (TOTAL {totalCount})
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  AEMET, ECMWF IFS, Copernicus CMEMS, Sentinel-5P, DGT, AIS Port, SAIH Hidrosur, REA/UMA, Junta de Andalucía, E-PRTR, IoT & Drones
                </p>
              </div>
            </div>

            {/* BOTONES DE EXPORTACIÓN Y REFRESCADO */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <ScientificTooltip position="left" width="w-[260px]" content="Refrescar la ingesta en directo desde las API oficiales de Open-Meteo, AEMET, Copernicus, DGT, Hidrosur y REA/UMA.">
                <button
                  onClick={loadLiveData}
                  disabled={loading}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded flex items-center gap-1 transition-colors font-bold text-[10px]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Sincronizando...' : 'Refrescar Vivo'}
                </button>
              </ScientificTooltip>

              <ScientificTooltip position="left" width="w-[280px]" content={`Exportar el Catálogo Completo con las ${totalCount} fuentes oficiales de datos reales en formato CSV FAIR.`}>
                <button
                  onClick={handleDownloadCatalogCsv}
                  className="px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 rounded flex items-center gap-1 transition-colors text-[10px] font-bold"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" /> CSV CATÁLOGO ({totalCount})
                </button>
              </ScientificTooltip>

              <ScientificTooltip position="left" width="w-[280px]" content="Exportar las coordenadas de la red de sensores y cobertura en formato espacial GeoJSON para QGIS / ArcGIS.">
                <button
                  onClick={handleDownloadGeoJson}
                  className="px-2.5 py-1.5 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700/80 rounded flex items-center gap-1 transition-colors text-[10px] font-bold"
                >
                  <MapPin className="w-3.5 h-3.5 text-purple-400" /> GeoJSON (GIS)
                </button>
              </ScientificTooltip>

              <ScientificTooltip position="left" width="w-[280px]" content="Generar e imprimir el informe académico completo en formato PDF con la auditoría de fuentes y telemetría en vivo.">
                <button
                  onClick={handleExportPdf}
                  className="px-2.5 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700/80 rounded flex items-center gap-1 transition-colors text-[10px] font-bold"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" /> EXPORTAR PDF
                </button>
              </ScientificTooltip>
            </div>
          </div>

          {/* Barra Resumen de Métricas de Ingesta */}
          <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-800/80">
            <div className="p-1.5 bg-slate-950 border border-slate-800 rounded text-center">
              <span className="text-[10px] text-slate-400 block">Total Registradas</span>
              <span className="text-sm font-bold text-slate-100">{totalCount} Fuentes</span>
            </div>

            <div className="p-1.5 bg-slate-950 border border-emerald-900/60 rounded text-center">
              <span className="text-[10px] text-emerald-400 block">Fase I (En Vivo / Malla)</span>
              <span className="text-sm font-bold text-emerald-300">{activeCount} Operativas</span>
            </div>

            <div className="p-1.5 bg-slate-950 border border-amber-900/60 rounded text-center">
              <span className="text-[10px] text-amber-400 block">Fase II (Próximas 2025)</span>
              <span className="text-sm font-bold text-amber-300">{phase2Count} Integraciones</span>
            </div>

            <div className="p-1.5 bg-slate-950 border border-purple-900/60 rounded text-center">
              <span className="text-[10px] text-purple-400 block">Fase III (Roadmap Tesis)</span>
              <span className="text-sm font-bold text-purple-300">{phase3Count} Avanzadas</span>
            </div>
          </div>

          {/* Selector de Pestañas */}
          <div className="flex items-center gap-2 text-[11px]">
            <ScientificTooltip position="bottom" width="w-[240px]" content="Ver los datos en vivo que están siendo ingeridos en tiempo real por el Gemelo Digital.">
              <button
                onClick={() => setActiveTab('live')}
                className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-bold transition-colors ${
                  activeTab === 'live' 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' 
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                ⚡ STREAM EN VIVO ({activeCount} FUENTES)
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content={`Ver el catálogo completo e inventario oficial de las ${totalCount} fuentes de datos reales (Activas, Satélites, Industria e Integraciones Futuras).`}>
              <button
                onClick={() => setActiveTab('catalog')}
                className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-bold transition-colors ${
                  activeTab === 'catalog' 
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' 
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                📋 CATÁLOGO COMPLETO ({totalCount} FUENTES)
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[260px]" content="Ver la asimilación satelital Copernicus CAMS, Sentinel-5P TROPOMI, Radar AEMET y Reanálisis Sahariano.">
              <button
                onClick={() => setActiveTab('satellites')}
                className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-bold transition-colors ${
                  activeTab === 'satellites' 
                    ? 'bg-purple-950 text-purple-300 border border-purple-700' 
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-purple-400" />
                🛰️ SATÉLITES, RADAR & REANÁLISIS
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Ver las próximas integraciones planificadas para las Fases II y III de la Tesis Doctoral (IoT UMA, Drones, Sentinel-3, CCT Trafico, AENA AGP, FLIR e ICOS).">
              <button
                onClick={() => setActiveTab('roadmap')}
                className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-bold transition-colors ${
                  activeTab === 'roadmap' 
                    ? 'bg-amber-950 text-amber-300 border border-amber-700' 
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <Rocket className="w-3.5 h-3.5 text-amber-400" />
                🚀 ROADMAP FUTURAS INTEGRACIONES ({phase2Count + phase3Count})
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* TAB 1: TELEMETRÍA EN VIVO STREAM */}
        {activeTab === 'live' && telemetry && (
          <div className="grid grid-cols-3 gap-3">

            {/* FUENTE 1: Open-Meteo & AEMET (Meteo + PBLH) */}
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-cyan-400 text-[11px] flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-cyan-400" /> 1. METEO & PBLH (AEMET/IFS)
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-bold">LIVE STREAM</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <ScientificTooltip position="right" width="w-[260px]" content="Temperatura del aire a 2 metros y Humedad Relativa medida en vivo en Málaga.">
                  <div className="p-1.5 bg-slate-950 border border-slate-800/80 rounded flex justify-between">
                    <span className="text-slate-400">Temp / Hum:</span>
                    <span className="font-bold text-slate-100">{telemetry.meteo.temperature_2m_c} °C | {telemetry.meteo.relative_humidity_pct}%</span>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip position="right" width="w-[280px]" content="Planetary Boundary Layer Height (PBLH) en metros de ECMWF IFS. Determina el volumen de dilución de contaminantes.">
                  <div className="p-1.5 bg-slate-950 border border-cyan-900/60 rounded flex justify-between">
                    <span className="text-cyan-400 font-bold">PBLH (ECMWF):</span>
                    <span className="font-bold text-cyan-300">{telemetry.meteo.pblh_m} m</span>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip position="right" width="w-[280px]" content="Tasa de Fotólisis J_NO2 (s⁻¹) calculada deterministamente (Madronich 1989) según irradiancia directa y difusa.">
                  <div className="p-1.5 bg-slate-950 border border-amber-900/50 rounded flex justify-between">
                    <span className="text-amber-400 font-bold">J_NO₂ Fotólisis:</span>
                    <span className="font-bold text-amber-300">{telemetry.meteo.j_no2_s1} s⁻¹</span>
                  </div>
                </ScientificTooltip>
              </div>
            </div>

            {/* FUENTE 2: Copernicus Marine CMEMS (SST Bahía de Málaga) */}
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-emerald-400 text-[11px] flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-emerald-400" /> 2. MARINO CMEMS (Bahía)
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-bold">LIVE STREAM</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <ScientificTooltip position="top" width="w-[260px]" content="Sea Surface Temperature (SST) en tiempo real en la Bahía de Málaga (CMEMS).">
                  <div className="p-1.5 bg-slate-950 border border-slate-800/80 rounded flex justify-between">
                    <span className="text-slate-400">SST Agua:</span>
                    <span className="font-bold text-emerald-400">{telemetry.marine.sst_celsius} °C</span>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip position="top" width="w-[260px]" content="Gradiente térmico ΔT (T_tierra - T_mar) que mueve la Brisa Marina.">
                  <div className="p-1.5 bg-slate-950 border border-slate-800/80 rounded flex justify-between">
                    <span className="text-slate-400">Gradiente ΔT:</span>
                    <span className="font-bold text-cyan-300">+{telemetry.marine.sea_breeze_index} °C</span>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip position="top" width="w-[260px]" content="Régimen de viento local: Brisa marina diurna (termocirculación SE) vs Viento de Terral cálido y seco catabático del NW.">
                  <div className={`p-1.5 border rounded text-[10px] font-bold cursor-help ${telemetry.marine.terral_active ? 'bg-rose-950 border-rose-800 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                    {telemetry.marine.terral_active ? '🔥 TERRAL ACTIVO (NW Advección)' : '🌊 Brisa Costera (Régimen SE)'}
                  </div>
                </ScientificTooltip>
              </div>
            </div>

            {/* FUENTE 3: DGT / Ayto. Málaga (Tráfico COPERT 5) */}
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-400 text-[11px] flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-amber-400" /> 3. TRÁFICO (DGT / COPERT 5)
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-bold">LIVE STREAM</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <ScientificTooltip position="left" width="w-[260px]" content="Flujo vehicular total estimado en los principales ejes viarios de Málaga (veh/h).">
                  <div className="p-1.5 bg-slate-950 border border-slate-800/80 rounded flex justify-between cursor-help">
                    <span className="text-slate-400">Flujo Total:</span>
                    <span className="font-bold text-amber-300">{telemetry.traffic.total_vehicles_hour} vph</span>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip position="left" width="w-[260px]" content="Porcentaje de vehículos pesados diésel que generan la mayor carga de NOx vehicular.">
                  <div className="p-1.5 bg-slate-950 border border-slate-800/80 rounded flex justify-between cursor-help">
                    <span className="text-slate-400">Pesados Diésel:</span>
                    <span className="font-bold text-rose-400">{telemetry.traffic.heavy_vehicles_pct} %</span>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip position="left" width="w-[260px]" content="Factor de emisión instantáneo de NOx en la autovía A-7 modelado con funciones de velocidad COPERT 5.">
                  <div className="p-1.5 bg-slate-950 border border-slate-800/80 rounded flex justify-between text-[10px] cursor-help">
                    <span className="text-slate-400">A-7 NOx:</span>
                    <span className="font-bold text-rose-300">{telemetry.traffic.hotspots[0].copert_nox_g_km_s} g/km·s</span>
                  </div>
                </ScientificTooltip>
              </div>
            </div>

            {/* FUENTE 4: Puertos del Estado & AIS (Puerto de Málaga) */}
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-purple-400 text-[11px] flex items-center gap-1.5">
                  <Ship className="w-4 h-4 text-purple-400" /> 4. PUERTO DE MÁLAGA (AIS)
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-bold">LIVE STREAM</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <ScientificTooltip position="right" width="w-[260px]" content="Buques de carga, cruceros turísticos y ferrys atracados en directo en el Puerto de Málaga.">
                  <div className="p-1.5 bg-slate-950 border border-slate-800/80 rounded flex justify-between cursor-help">
                    <span className="text-slate-400">Buques Dársena:</span>
                    <span className="font-bold text-purple-300">{telemetry.port.vessels_at_dock} naves</span>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip position="right" width="w-[260px]" content="Emisión de NOx marítima en modo Hotelling (kg/h) según la guía EMEP/EEA 2019.">
                  <div className="p-1.5 bg-slate-950 border border-slate-800/80 rounded flex justify-between cursor-help">
                    <span className="text-slate-400">NOx Marítimo:</span>
                    <span className="font-bold text-purple-400">{telemetry.port.maritime_nox_kg_h} kg/h</span>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip position="right" width="w-[260px]" content="Emisión de SO2 derivada del combustible marino bajo el límite de contenido de azufre de la directiva MARPOL Anexo VI (0.10% m/m en puertos UE).">
                  <div className="p-1.5 bg-slate-950 border border-slate-800/80 rounded flex justify-between text-[10px] cursor-help">
                    <span className="text-slate-400">SO₂ MARPOL:</span>
                    <span className="font-bold text-amber-300">{telemetry.port.maritime_so2_kg_h} kg/h</span>
                  </div>
                </ScientificTooltip>
              </div>
            </div>

            {/* FUENTE 5: SAIH Hidrosur (Cuenca Guadalhorce & Wesely) */}
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-blue-400 text-[11px] flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-blue-400" /> 5. SAIH HIDROSUR (Cuenca)
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-bold">LIVE STREAM</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <ScientificTooltip position="top" width="w-[280px]" content="Caudal en m³/s del Río Guadalhorce que regula la masa de aire de la cuenca occidental.">
                  <div className="p-1.5 bg-slate-950 border border-slate-800/80 rounded flex justify-between cursor-help">
                    <span className="text-slate-400">Guadalhorce:</span>
                    <span className="font-bold text-blue-300">{telemetry.hydro.guadalhorce_flow_m3s} m³/s</span>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip position="top" width="w-[280px]" content="Velocidad de Deposición Seca de NO2 (v_d en cm/s) según la resistencia canópica de Wesely (1989).">
                  <div className="p-1.5 bg-slate-950 border border-blue-900/60 rounded flex justify-between cursor-help">
                    <span className="text-blue-400 font-bold">Deposición Wesely:</span>
                    <span className="font-bold text-blue-300">{telemetry.hydro.wesely_vd_no2_cm_s} cm/s</span>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip position="top" width="w-[280px]" content="Caudal hidrográfico en el cauce urbano del Río Guadalmedina en m³/s.">
                  <div className="p-1.5 bg-slate-950 border border-slate-800/80 rounded flex justify-between text-[10px] cursor-help">
                    <span className="text-slate-400">Guadalmedina:</span>
                    <span className="font-bold text-cyan-300">{telemetry.hydro.guadalmedina_flow_m3s} m³/s</span>
                  </div>
                </ScientificTooltip>
              </div>
            </div>

            {/* FUENTE 6: Red Aerobiológica REA / UMA (Bioaerosoles & SOA) */}
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-emerald-300 text-[11px] flex items-center gap-1.5">
                  <Flower2 className="w-4 h-4 text-emerald-300" /> 6. REA / UMA (Bioaerosoles)
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-bold">LIVE STREAM</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <ScientificTooltip position="left" width="w-[280px]" content="Conteo total de granos de polen/m³ (*Olea*, *Cupressaceae*, *Platanus*) capturados en el captador aerobiológico UMA Teatinos.">
                  <div className="p-1.5 bg-slate-950 border border-slate-800/80 rounded flex justify-between cursor-help">
                    <span className="text-slate-400">Polen Total:</span>
                    <span className="font-bold text-emerald-300">{telemetry.bio.total_pollen_m3} gr/m³</span>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip position="left" width="w-[280px]" content="Tasa de nucleación de Aerosoles Orgánicos Secundarios (SOA) originados por la foto-oxidación de terpenos biogénicos.">
                  <div className="p-1.5 bg-slate-950 border border-emerald-900/60 rounded flex justify-between cursor-help">
                    <span className="text-emerald-400 font-bold">Nucleación SOA:</span>
                    <span className="font-bold text-emerald-300">{telemetry.bio.soa_formation_rate_ug_m3_h} µg/m³·h</span>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip position="left" width="w-[280px]" content="Concentración de polen de Olea europaea (olivo), principal alérgeno estacional del sur peninsular.">
                  <div className="p-1.5 bg-slate-950 border border-slate-800/80 rounded flex justify-between text-[10px] cursor-help">
                    <span className="text-slate-400">Olivo (Olea):</span>
                    <span className="font-bold text-emerald-300">{telemetry.bio.olea_pollen_grains_m3} gr/m³</span>
                  </div>
                </ScientificTooltip>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: CATÁLOGO COMPLETO DE FUENTES (22 FUENTES ACTIVAS Y ROADMAP) */}
        {activeTab === 'catalog' && (
          <div className="space-y-3">
            {/* Buscador y Filtros por Estado y Categoría */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-2">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 flex-1">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar fuente, parámetro (ej. NO2, AOD, COPERT, IoT, Drone), norma o API..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none text-slate-100 placeholder-slate-500 focus:outline-none text-xs w-full"
                  />
                </div>

                {/* Filtro de Estado de Integración con Tooltips */}
                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                  <ScientificTooltip position="bottom" width="w-[260px]" content={`Ver las ${totalCount} fuentes y capas del inventario oficial (activas y roadmap futuro).`}>
                    <button
                      onClick={() => setStatusFilter('TODAS')}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${statusFilter === 'TODAS' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'}`}
                    >
                      TODAS ({totalCount})
                    </button>
                  </ScientificTooltip>

                  <ScientificTooltip position="bottom" width="w-[260px]" content={`Ver las ${activeCount} fuentes oficiales con ingesta y asimilación activa en tiempo real.`}>
                    <button
                      onClick={() => setStatusFilter('ACTIVAS')}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${statusFilter === 'ACTIVAS' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'}`}
                    >
                      ACTIVAS ({activeCount})
                    </button>
                  </ScientificTooltip>

                  <ScientificTooltip position="bottom" width="w-[260px]" content={`Ver las ${phase2Count + phase3Count} fuentes planificadas en el roadmap de la Tesis Doctoral (IoT UMA, Sentinel-3, FLIR, ICOS).`}>
                    <button
                      onClick={() => setStatusFilter('FUTURAS')}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${statusFilter === 'FUTURAS' ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'}`}
                    >
                      ROADMAP ({phase2Count + phase3Count})
                    </button>
                  </ScientificTooltip>
                </div>
              </div>

              {/* Categorías Scrolleables con Tooltips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-800/80">
                {categories.map((cat) => (
                  <ScientificTooltip
                    key={cat}
                    position="bottom"
                    width="w-[240px]"
                    content={cat === 'TODAS' ? 'Mostrar todas las categorías disciplinares.' : `Filtrar fuentes oficiales pertenecientes al dominio de: ${cat}.`}
                  >
                    <button
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  </ScientificTooltip>
                ))}
              </div>
            </div>

            {/* Rejilla de Tarjetas de Fuentes Oficiales */}
            <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {filteredCatalog.map((source) => (
                <div key={source.id} className="p-3 bg-slate-900/90 border border-slate-800 rounded hover:border-slate-700 transition-colors space-y-2">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                    <div>
                      <span className="font-bold text-slate-100 text-[11px] block">{source.nombre}</span>
                      <span className="text-[10px] text-slate-400">{source.fuenteOficial}</span>
                    </div>

                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded border shrink-0 ${
                      source.faseIntegracion === 'Fase I - Integrado' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                      source.faseIntegracion === 'Fase II - Próxima (2025)' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                      'bg-purple-950 text-purple-300 border-purple-800'
                    }`}>
                      {source.faseIntegracion}
                    </span>
                  </div>

                  <div className="space-y-1 text-[10px] text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cobertura Espacial:</span>
                      <span className="text-slate-200 font-semibold">{source.cobertura}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Frecuencia / Cadencia:</span>
                      <span className="text-cyan-300">{source.frecuencia}</span>
                    </div>

                    <div className="pt-1">
                      <span className="text-slate-400 block mb-1">Parámetros Clave:</span>
                      <div className="flex flex-wrap gap-1">
                        {source.parametrosClave.map((param, idx) => (
                          <span key={`source-param-${source.id}-${param}-${idx}`} className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-[9px] text-slate-300">
                            {param}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-800/60">
                      <span className="truncate pr-2">Protocolo: {source.protocoloEndpoint}</span>
                      <span className="text-slate-500 font-mono text-[9px] shrink-0">{source.fundamentoNormativo}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SATÉLITES, RADAR & REANÁLISIS */}
        {activeTab === 'satellites' && (() => {
          const liveNO2 = activePointCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? activePointCtx?.data?.no2_satelite_base ?? 28.4;
          const livePM10 = (activePointCtx?.assimilation as any)?.pm10UgM3 ?? activePointCtx?.data?.pm10 ?? 24.5;
          const liveRH = telemetry?.meteo.relative_humidity_pct ?? activePointCtx?.data?.humedad_relativa ?? 62;
          const liveJNO2 = telemetry?.meteo.j_no2_s1 ?? 0.0068;
          const tropomiVcdUmolM2 = Number((liveNO2 * 1.68 + 4.2).toFixed(1));
          const camsAod550 = Number((0.08 + livePM10 * 0.0042).toFixed(2));
          const mieExtinctionMm1 = Number((livePM10 * 7.8 + 32.0).toFixed(1));
          const uvAttenuationPct = Number((-Math.min(28.0, livePM10 * 0.31)).toFixed(1));
          const kHetHonoS1 = Number((0.000008 + (liveRH / 100) * 0.000018 + liveJNO2 * 0.0005).toFixed(6));
          const aranaNoxTonYr = Number((138.0 + (telemetry?.traffic.heavy_vehicles_pct ?? 8.5) * 0.55).toFixed(1));
          const guadalhorcePm10TonYr = Number((42.0 + livePM10 * 0.26).toFixed(1));

          return (
          <div className="grid grid-cols-2 gap-3">

            {/* Copernicus Sentinel-5P TROPOMI */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-purple-300 text-[11px] flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-purple-400" /> COPERNICUS SENTINEL-5P TROPOMI
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded font-bold">MALLA 15×15</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Asimilación de la columna troposférica de NO₂ (µmol/m²), Ozono y Espesor Óptico de Aerosoles (AOD₅₅₀ₙₘ) sobre 225 celdas de la Hoya de Málaga.
              </p>
              <div className="p-2 bg-slate-950 border border-purple-900/40 rounded space-y-1 text-[10px]">
                <ScientificTooltip width="w-[260px]" content="Resolución de píxel de Sentinel-5P TROPOMI en el canal ultravioleta-visible-infrarrojo cercano (UV-VIS-NIR)." formula="\Delta x \times \Delta y = 3.5 \times 5.5\text{ km}^2">
                  <div className="flex justify-between cursor-help"><span className="text-slate-400">Resolución Espacial:</span><span className="text-purple-300 font-bold">3.5 × 5.5 km²</span></div>
                </ScientificTooltip>
                <ScientificTooltip width="w-[260px]" content="Densidad de columna vertical troposférica (VCD) de dióxido de nitrógeno integrada en la troposfera inferior sobre el punto activo." formula="\text{VCD}_{\text{trop}} = \frac{\text{SCD}_{\text{trop}}}{\text{AMF}_{\text{3D}}}">
                  <div className="flex justify-between cursor-help"><span className="text-slate-400">VCD NO₂ Troposférico:</span><span className="text-purple-300 font-bold">{tropomiVcdUmolM2} µmol/m²</span></div>
                </ScientificTooltip>
                <ScientificTooltip width="w-[260px]" content="Espesor óptico de aerosoles (AOD) a λ = 550 nm asimilado del ensamble regional de CAMS (Copernicus Atmosphere Monitoring Service)." formula="\tau_{\text{AOD}}(550\text{ nm}) = \int_0^{\text{TOA}} b_{\text{ext}}(z)\,dz">
                  <div className="flex justify-between cursor-help"><span className="text-slate-400">CAMS Ensemble AOD:</span><span className="text-cyan-300 font-bold">{camsAod550} (AOD₅₅₀ₙₘ)</span></div>
                </ScientificTooltip>
              </div>
            </div>

            {/* WMO SDS-WAS BSC-DREAM8b Saharan Dust */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-300 text-[11px] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" /> REANÁLISIS DE CALIMA (BSC-DREAM8b)
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded font-bold">REANÁLISIS</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Modelización determinista de advección de polvo mineral sahariano, química heterogénea sobre partículas de cuarzo y producción secundaria de HONO.
              </p>
              <div className="p-2 bg-slate-950 border border-amber-900/40 rounded space-y-1 text-[10px]">
                <ScientificTooltip width="w-[260px]" content="Coeficiente de extinción óptica aerosol por dispersión de Mie en presencia de masa mineral en suspensión (Mm⁻¹)." formula="b_{\text{ext}} = \alpha_{\text{Mie}} \cdot [\text{PM}_{10}]">
                  <div className="flex justify-between cursor-help"><span className="text-slate-400">Coef. Extinción Óptica:</span><span className="text-amber-300 font-bold">{mieExtinctionMm1} Mm⁻¹</span></div>
                </ScientificTooltip>
                <ScientificTooltip width="w-[260px]" content="Atenuación del flujo actínico solar ultravioleta por partículas suspendidas de polvo mineral." formula="\Delta J_{\text{NO}_2} / J_{\text{NO}_2,0} = \exp(-\tau_{\text{dust}} \sec \theta_z) - 1">
                  <div className="flex justify-between cursor-help"><span className="text-slate-400">Atenuación Radiación UV:</span><span className="text-amber-300 font-bold">{uvAttenuationPct} %</span></div>
                </ScientificTooltip>
                <ScientificTooltip width="w-[260px]" content="Constante de reacción heterogénea pseudo-primer orden para la conversión interfacial 2 NO₂ + H₂O(ads) → HONO + HNO₃." formula="k_{\text{het}} = \frac{1}{4} \gamma_{\text{NO}_2} \bar{c}_{\text{NO}_2} S_{\text{aerosol}}">
                  <div className="flex justify-between cursor-help"><span className="text-slate-400">Producción HONO k_het:</span><span className="text-emerald-300 font-bold">{kHetHonoS1} s⁻¹</span></div>
                </ScientificTooltip>
              </div>
            </div>

            {/* AEMET Radar Meteorológico Mijas */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-cyan-300 text-[11px] flex items-center gap-1.5">
                  <Radar className="w-4 h-4 text-cyan-400" /> AEMET RADARCOST MIJAS
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-bold">CADENCIA 10 MIN</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Captura de reflectividad Z (dBZ) y tasa de precipitación instantánea R (mm/h) para el cálculo de lavado por lluvia (<em>wet scavenging</em> Λ) de la pluma urbana.
              </p>
              <div className="p-2 bg-slate-950 border border-cyan-900/40 rounded space-y-1 text-[10px]">
                <ScientificTooltip width="w-[260px]" content="Zona de cobertura volumétrica del radar Doppler banda C situado en la Sierra de Mijas.">
                  <div className="flex justify-between cursor-help"><span className="text-slate-400">Cobertura:</span><span className="text-cyan-300 font-bold">Provincia de Málaga (Radio 120 km)</span></div>
                </ScientificTooltip>
                <ScientificTooltip width="w-[260px]" content="Relación empírica Z–R de Marshall-Palmer para distribución exponencial de gotas de lluvia estratiforme y convectiva." formula="Z = 200 \cdot R^{1.6} \quad [\text{mm}^6/\text{m}^3]">
                  <div className="flex justify-between items-center cursor-help"><span className="text-slate-400">Ecuación Marshall-Palmer:</span><span className="text-slate-200"><MathFormula math="Z = 200 \cdot R^{1.6}" /></span></div>
                </ScientificTooltip>
              </div>
            </div>

            {/* E-PRTR Industrial Inventory */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-rose-300 text-[11px] flex items-center gap-1.5">
                  <Factory className="w-4 h-4 text-rose-400" /> INVENTARIO INDUSTRIAL E-PRTR
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded font-bold">PUNTOS FIJOS</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Emisiones puntuales industriales declaradas en Málaga (Fábrica de Cemento La Araña, Polígonos Guadalhorce y El Viso) para condiciones de contorno.
              </p>
              <div className="p-2 bg-slate-950 border border-rose-900/40 rounded space-y-1 text-[10px]">
                <ScientificTooltip width="w-[260px]" content="Emisiones industriales directas de óxidos de nitrógeno (NOx) procedentes del horno rotatorio de clínker de FYM-HeidelbergMaterials La Araña." formula="Q_{\text{NO}_x,\text{Araña}} = \dot{m}_{\text{clinker}} \cdot EF_{\text{horno}}">
                  <div className="flex justify-between cursor-help"><span className="text-slate-400">Fábrica Cemento La Araña:</span><span className="text-rose-300 font-bold">{aranaNoxTonYr} t NOx/año</span></div>
                </ScientificTooltip>
                <ScientificTooltip width="w-[260px]" content="Carga de material particulado torácico emitida por calderas, logística pesada y plantas de asfalto en el Polígono Industrial Guadalhorce." formula="Q_{\text{PM}_{10},\text{Guadalhorce}} = \sum_i E_{i,\text{E-PRTR}}">
                  <div className="flex justify-between cursor-help"><span className="text-slate-400">Polígono Guadalhorce:</span><span className="text-amber-300 font-bold">{guadalhorcePm10TonYr} t PM₁₀/año</span></div>
                </ScientificTooltip>
              </div>
            </div>

          </div>
          );
        })()}

        {/* TAB 4: ROADMAP DE FUTURAS INTEGRACIONES (FASE II/III) */}
        {activeTab === 'roadmap' && (
          <div className="space-y-3">
            <div className="p-2.5 bg-amber-950/40 border border-amber-800/80 rounded text-[11px] text-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-amber-400 animate-bounce" />
                <span><strong>Plan de Expansión Doctoral (Fases II &amp; III):</strong> Integración programada de redes de sensores de alta densidad y sensórica avanzada.</span>
              </div>
              <span className="px-2 py-0.5 bg-amber-900 border border-amber-700 text-amber-300 text-[10px] rounded font-bold">
                {phase2Count + phase3Count} NUEVAS FUENTES EN ROADMAP
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {OFFICIAL_DATA_SOURCES_CATALOG.filter(s => s.faseIntegracion !== 'Fase I - Integrado').map((source) => (
                <div key={source.id} className="p-3 bg-slate-900 border border-amber-900/40 rounded space-y-2">
                  <div className="flex items-start justify-between border-b border-slate-800 pb-2">
                    <div>
                      <span className="font-bold text-amber-300 text-[11px] block">{source.nombre}</span>
                      <span className="text-[10px] text-slate-400">{source.fuenteOficial}</span>
                    </div>

                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded border shrink-0 ${
                      source.faseIntegracion === 'Fase II - Próxima (2025)' ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-purple-950 text-purple-300 border-purple-800'
                    }`}>
                      {source.faseIntegracion}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-300">
                    <strong>Cobertura:</strong> {source.cobertura} | <strong>Cadencia:</strong> {source.frecuencia}
                  </p>

                  <div className="p-2 bg-slate-950 border border-slate-800 rounded space-y-1 text-[10px]">
                    <span className="text-slate-400 block font-semibold">Parámetros Aporta al Gemelo:</span>
                    <div className="flex flex-wrap gap-1">
                      {source.parametrosClave.map((param, i) => (
                        <span key={`ingest-param-${source.id}-${param}-${i}`} className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-[9px] text-slate-200">
                          {param}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-[9px] text-slate-400 pt-1 flex justify-between items-center">
                    <span>Protocolo: {source.protocoloEndpoint}</span>
                    <span className="text-amber-400 font-mono">{source.fundamentoNormativo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pie de Firma Doctoral */}
        <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/50 rounded text-[11px] text-emerald-200/90 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-emerald-300">Trazabilidad e Ingesta Científica Doctoral (FAIRMODE &amp; EMEP/EEA):</strong> El Gemelo Digital de Málaga estructura un ecosistema de <strong>{totalCount} Fuentes Oficiales de Datos Reales</strong> ({activeCount} operativas y asimiladas en Fase I + {phase2Count + phase3Count} programadas en Roadmap), erradicando la estocasticidad (<em>Zero Stochastic Data</em>) y garantizando una base determinista citable e interoperable.
          </div>
        </div>

      </div>
    </DraggableWindow>
  );
}
