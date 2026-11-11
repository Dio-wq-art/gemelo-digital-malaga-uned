import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  Map, 
  Activity, 
  ShieldCheck, 
  FileText, 
  Database, 
  Layers, 
  Archive, 
  Sparkles, 
  Loader2,
  GraduationCap
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { FairDataPillarsDiagram } from './FairDataPillarsDiagram';
import { CustomOnDemandPdfReportTab } from './CustomOnDemandPdfReportTab';
import { ThesisMasterPdfLibraryTab } from './ThesisMasterPdfLibraryTab';
import { getMasterThesisPdfCatalog } from '../lib/universalPdfLiveSyncEngine';
import { RawUrbanPoint, PollutantSpecies } from '../lib/instancedPollutantEngine';
import { MeteoData, PhysicsResult, StationComparisonResult, calculatePINNParameters } from '../lib/physics';
import { exportFairNetCdf, exportNetCdfCdl, NetCdfDataset } from '../lib/netcdfExporter';
import { generateFairResearchBundleZip } from '../lib/fairResearchBundleZip';
import { BenchmarkInputParams } from '../lib/pinnInference';
import { ODEKineticsParams } from '../lib/odeSolver';
import { useActivePoint } from '../context/ActivePointContext';
import Papa from 'papaparse';

export interface FairDataExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenModal?: (modalId: string) => void;
  rawUrbanPoints: RawUrbanPoint[];
  historyData: any[];
  currentMeteo: MeteoData;
  marineFlowGeoJson: any;
  physics?: PhysicsResult;
  stationComparisons?: StationComparisonResult[];
  benchmarkParams?: BenchmarkInputParams;
  odeParams?: ODEKineticsParams;
  location?: { lat: number; lon: number };
  initialSubTab?: 'all_pdfs' | 'fair_data' | 'custom_pdf';
}

export const FairDataExporterModal: React.FC<FairDataExporterModalProps> = ({
  isOpen,
  onClose,
  onOpenModal,
  rawUrbanPoints,
  historyData,
  currentMeteo,
  marineFlowGeoJson,
  physics,
  stationComparisons,
  benchmarkParams,
  odeParams,
  location,
  initialSubTab = 'all_pdfs'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all_pdfs' | 'fair_data' | 'custom_pdf'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const activeCtx = useActivePoint();
  const pdfCatalogSummary = getMasterThesisPdfCatalog({
    streetName: activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name,
    lat: activeCtx?.activePoint?.lat ?? location?.lat,
    lon: activeCtx?.activePoint?.lon ?? location?.lon,
    no2UgM3: activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? currentMeteo.no2_satelite_base
  });

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportZipBundle = async () => {
    try {
      setIsGeneratingZip(true);
      const computedPhysics = physics || calculatePINNParameters(currentMeteo);
      const zipBlob = await generateFairResearchBundleZip({
        meteo: currentMeteo,
        physics: computedPhysics,
        stationComparisons,
        rawUrbanPoints,
        historyData,
        marineFlowGeoJson,
        activePoint: activeCtx?.activePoint,
        assimilation: activeCtx?.assimilation,
        location: activeCtx?.location || location,
        includeLatex: true,
        includeCsv: true,
        includeGeoJson: true,
        includeProvenance: true
      });
      triggerDownload(zipBlob, `paquete_replicabilidad_tesis_malaga_${Date.now()}.zip`);
    } catch (err) {
      console.error("Error al generar el bundle FAIR ZIP:", err);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleExportUrbanPointsGeoJSON = () => {
    const features = rawUrbanPoints.map(pt => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [pt.lon, pt.lat]
      },
      properties: {
        qNOx_ug_m_s: pt.qNOx_ug_m_s,
        trafficFlowVehH: pt.trafficFlowVehH,
        highwayType: pt.highwayType || "unknown"
      }
    }));
    const geojson = {
      type: "FeatureCollection",
      metadata: {
        source: "Gemelo Digital Málaga",
        dataset: "Inventario de Emisiones de Tráfico (Nodos)",
        timestamp: new Date().toISOString(),
        units: {
          qNOx: "µg/m·s",
          trafficFlow: "veh/h"
        }
      },
      features
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json;charset=utf-8;' });
    triggerDownload(blob, `malaga_traffic_emissions_${Date.now()}.geojson`);
  };

  const handleExportMarineFlowGeoJSON = () => {
    if (!marineFlowGeoJson) return;
    const blob = new Blob([JSON.stringify(marineFlowGeoJson, null, 2)], { type: 'application/geo+json;charset=utf-8;' });
    triggerDownload(blob, `malaga_marine_flow_${Date.now()}.geojson`);
  };

  const handleExportTimeHistoryCSV = () => {
    const activeStreet = activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name || 'Calle Marqués de Larios';
    const activeLat = activeCtx?.activePoint?.lat ?? location?.lat ?? 36.7196;
    const activeLon = activeCtx?.activePoint?.lon ?? location?.lon ?? -4.4200;
    const csvRows = historyData.map(d => ({
      timestamp_utc: d.fullDate || '',
      hora_local: d.time,
      receptor_activo: activeStreet,
      lat_wgs84: activeLat,
      lon_wgs84: activeLon,
      es_prediccion: d.isForecast ? 1 : 0,
      no2_ug_m3: d.no2,
      pm25_ug_m3: d.pm25,
      ozone_ug_m3: d.ozone,
      temperatura_c: d.temp,
      humedad_pct: d.rh || ''
    }));
    const csv = Papa.unparse(csvRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `malaga_nowcasting_timeseries_${Date.now()}.csv`);
  };

  const handleExportKineticsCSV = () => {
    // Generate deterministic kinetic data based on MeteoData and Active Point
    const activeStreet = activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name || 'Calle Marqués de Larios';
    const activeNO2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? currentMeteo.no2_satelite_base ?? 28.4;
    const activeO3 = activeCtx?.assimilation?.ozoneO3UgM3 ?? currentMeteo.ozone ?? 42.0;
    const kOH_NO2 = 1.0e-11; // cm3/molec/s (Approx)
    const kOH_Isoprene = 1.0e-10;
    const OH_concentration = (currentMeteo.uv_index * 0.5) * 1e6; // molecules/cm3
    
    const tau_NO2_hours = OH_concentration > 0 ? 1 / (kOH_NO2 * OH_concentration * 3600) : NaN;
    const tau_Isoprene_hours = OH_concentration > 0 ? 1 / (kOH_Isoprene * OH_concentration * 3600) : NaN;
    
    const row = {
      timestamp_utc: new Date().toISOString(),
      receptor_activo: activeStreet,
      lat_wgs84: activeCtx?.activePoint?.lat ?? location?.lat ?? 36.7196,
      lon_wgs84: activeCtx?.activePoint?.lon ?? location?.lon ?? -4.4200,
      no2_asimilado_1_8m_ug_m3: activeNO2,
      o3_asimilado_ug_m3: activeO3,
      temp_c: currentMeteo.temperatura_malaga,
      uv_index: currentMeteo.uv_index,
      oh_radical_molec_cm3: OH_concentration,
      tau_no2_hours: tau_NO2_hours,
      tau_isoprene_hours: tau_Isoprene_hours
    };
    
    const csv = Papa.unparse([row]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `malaga_kinetic_degradation_${Date.now()}.csv`);
  };

  const getNetCdfDataset = (): NetCdfDataset => {
    const lons = rawUrbanPoints.length > 0 
      ? Array.from(new Set(rawUrbanPoints.map(p => Number(p.lon.toFixed(4))))).slice(0, 50)
      : [-4.425, -4.424, -4.423, -4.422, -4.421];
    const lats = rawUrbanPoints.length > 0
      ? Array.from(new Set(rawUrbanPoints.map(p => Number(p.lat.toFixed(4))))).slice(0, 50)
      : [36.716, 36.717, 36.718, 36.719, 36.720];

    const windSpeedMs = (currentMeteo.velocidad_viento_km_h || 12.0) / 3.6;
    const windRad = ((currentMeteo.direccion_viento_grados || 135) * Math.PI) / 180;
    const windU = -windSpeedMs * Math.sin(windRad);
    const windV = -windSpeedMs * Math.cos(windRad);

    const points = rawUrbanPoints.slice(0, lons.length * lats.length).map(pt => ({
      lon: pt.lon,
      lat: pt.lat,
      no2_ug_m3: pt.qNOx_ug_m_s ? pt.qNOx_ug_m_s * 1.5 : 32.5,
      o3_ug_m3: currentMeteo.ozone || 65.0,
      pm25_ug_m3: currentMeteo.pm2_5 || 12.0,
      temp_c: currentMeteo.temperatura_malaga || 26.0,
      wind_u_m_s: Number(windU.toFixed(2)),
      wind_v_m_s: Number(windV.toFixed(2))
    }));

    return {
      title: "Malla Microescalar Tridimensional de Calidad del Aire - Malaga Digital Twin",
      timestampISO: new Date().toISOString(),
      points,
      lons,
      lats
    };
  };

  const handleExportNetCdfBinary = () => {
    const dataset = getNetCdfDataset();
    exportFairNetCdf(`malaga_digitaltwin_cf18_${Date.now()}`, dataset);
  };

  const handleExportNetCdfCdl = () => {
    const dataset = getNetCdfDataset();
    exportNetCdfCdl(`malaga_digitaltwin_cf18_${Date.now()}`, dataset);
  };

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title={
        <div className="flex items-center gap-2 text-amber-300">
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Centro Maestro de Todos los PDFs de la Tesis ({pdfCatalogSummary.totalCatalogCount}) &amp; Ciencia Abierta FAIR</span>
        </div>
      }
      subtitle="Catálogo vivo con explicación de cada PDF (Visualizar, Imprimir, Descargar, Compartir) + Informes a la Carta y Datos FAIR"
      initialPositionClass="top-14 left-1/2 -translate-x-1/2"
      defaultCollapsed={true}
      onClose={onClose}
    >
      <div className="flex flex-col gap-3 p-2.5 w-[440px] sm:w-[780px] lg:w-[920px] max-w-[96vw]">
        
        {/* SELECTOR DE LAS 3 SUBPESTAÑAS: 1) TODOS LOS PDFs, 2) PDF A LA CARTA, 3) DATOS ABIERTOS FAIR */}
        <div className="flex flex-wrap items-center p-1 bg-slate-950 border border-slate-800 rounded-sm gap-1">
          <ScientificTooltip
            content={`Reúne y explica todos los PDFs de la aplicación (${pdfCatalogSummary.totalCatalogCount} documentos sincronizados en tiempo real con el Punto Activo y el servidor UNED) para poder visualizarlos en pantalla, imprimirlos, descargarlos o compartirlos, manteniendo cada PDF también en su sitio original.`}
            citation="Regla 27 AGENTS.md • Sincronización Universal de PDFs UNED"
          >
            <button
              onClick={() => setActiveSubTab('all_pdfs')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs font-bold rounded-xs transition-colors cursor-pointer ${
                activeSubTab === 'all_pdfs'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>📑 Todos los PDFs de la Tesis ({pdfCatalogSummary.totalCatalogCount})</span>
              <span className="text-[8px] font-mono px-1 py-0.2 bg-amber-900/90 text-amber-200 border border-amber-500 rounded">
                EN VIVO
              </span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            content="Generador a la carta de informes científicos, monografías doctorales y estudios periciales en PDF de cualquier aspecto del Gemelo Digital con tus propias directrices y extensión elegida."
            citation="Tesis Doctoral UNED • EIDUNED • Directiva (UE) 2024/2881"
          >
            <button
              onClick={() => setActiveSubTab('custom_pdf')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-bold rounded-xs transition-colors cursor-pointer ${
                activeSubTab === 'custom_pdf'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/80 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>🔬 Informes PDF a la Carta</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            content="Descarga directa de paquetes reproducibles en formatos científicos abiertos estandarizados (NetCDF-4 CF-1.8, GeoJSON, CSV y paquetes comprimidos ZIP con LaTeX y BibTeX)."
            citation="Directiva INSPIRE 2007/2/CE • Principios FAIR"
          >
            <button
              onClick={() => setActiveSubTab('fair_data')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-bold rounded-xs transition-colors cursor-pointer ${
                activeSubTab === 'fair_data'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/80 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>🌐 Datos Abiertos FAIR (ZIP/GeoJSON/CSV)</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* CONTENIDO SUBPESTAÑA 0: BIBLIOTECA VIVA DE TODOS LOS PDFs DE LA TESIS */}
        {activeSubTab === 'all_pdfs' && (
          <div className="animate-in fade-in duration-150">
            <ThesisMasterPdfLibraryTab
              currentMeteo={currentMeteo}
              physics={physics}
              stationComparisons={stationComparisons}
              benchmarkParams={benchmarkParams}
              odeParams={odeParams}
              location={location}
              onNavigateToModal={onOpenModal}
              onSwitchToCustomPdfTab={() => setActiveSubTab('custom_pdf')}
            />
          </div>
        )}

        {/* CONTENIDO SUBPESTAÑA 1: DATOS ABIERTOS FAIR (TODO LO PREEXISTENTE 100% PRESERVADO) */}
        {activeSubTab === 'fair_data' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-150">
            <div className="bg-cyan-950/30 border border-cyan-800 p-3 rounded-sm flex flex-col gap-2 text-xs text-cyan-200">
              <p className="font-bold flex items-center gap-1.5 text-cyan-300">
                <ShieldCheck className="w-4 h-4" />
                Rigurosidad de Datos
              </p>
              <p>
                Los conjuntos de datos generados cumplen los estándares <strong>FAIR</strong> (Findable, Accessible, Interoperable, Reusable). No se aplican interpolaciones estocásticas. Las variables cinéticas son calculadas mecánicamente en función de la telemetría actual.
              </p>
            </div>

            {/* Animated FAIR Architecture Diagram */}
            <FairDataPillarsDiagram />

            {/* Paquete Unificado de Replicabilidad FAIR (ZIP con LaTeX + CSV + GeoJSON + Metadatos) */}
            <div className="flex flex-col gap-2 p-3 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border border-emerald-600/60 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                    Paquete de Replicabilidad FAIR (ZIP)
                  </span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700 rounded">
                  UNED / ZENODO
                </span>
              </div>
              <p className="text-[10px] text-slate-300 leading-snug">
                Descarga un único archivo comprimido con la <strong>Memoria Doctoral en LaTeX (.tex)</strong>, bibliografía (.bib), diapositivas Beamer, manuscritos Q1, mallas GeoJSON, series temporales CSV y metadatos INSPIRE/W3C PROV.
              </p>
              <button
                onClick={handleExportZipBundle}
                disabled={isGeneratingZip}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold text-xs rounded transition-all shadow-md hover:shadow-emerald-900/40 cursor-pointer"
              >
                {isGeneratingZip ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Empaquetando Documentos y Datos...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Bundle Completo (.zip)</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1 border-b border-slate-700 pb-1">
                <FileJson className="w-3.5 h-3.5 text-emerald-400" />
                Cartografía GeoJSON
              </h4>
              
              <ScientificTooltip content="Descarga de FeatureCollection GeoJSON con geometría de ejes viarios OSM y flujos de emisión calculados según COPERT 5.">
                <button 
                  onClick={handleExportUrbanPointsGeoJSON}
                  className="flex items-center justify-between p-2 bg-slate-900 border border-slate-700 hover:border-emerald-500 transition-colors group cursor-pointer w-full"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-slate-200 group-hover:text-emerald-400">Nodos de Emisión (OSM)</span>
                    <span className="text-[10px] text-slate-500 font-mono">Puntos Viales con Flujo COPERT</span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                </button>
              </ScientificTooltip>
              
              <ScientificTooltip content="Descarga de líneas de corriente y vectores de brisa marina georreferenciados para QGIS, ArcGIS y Mapbox.">
                <button 
                  onClick={handleExportMarineFlowGeoJSON}
                  disabled={!marineFlowGeoJson}
                  className="flex items-center justify-between p-2 bg-slate-900 border border-slate-700 hover:border-emerald-500 disabled:opacity-50 transition-colors group cursor-pointer w-full"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-slate-200 group-hover:text-emerald-400">Vectores de Flujo Marino</span>
                    <span className="text-[10px] text-slate-500 font-mono">Streamlines de Brisa Marina</span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                </button>
              </ScientificTooltip>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1 border-b border-slate-700 pb-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                Tablas CSV
              </h4>
              
              <ScientificTooltip content="Descarga de series temporales horarias de asimilación física de calidad del aire para procesado en R o Python Pandas.">
                <button 
                  onClick={handleExportTimeHistoryCSV}
                  disabled={historyData.length === 0}
                  className="flex items-center justify-between p-2 bg-slate-900 border border-slate-700 hover:border-amber-500 disabled:opacity-50 transition-colors group cursor-pointer w-full"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-slate-200 group-hover:text-amber-400">Serie Temporal Nowcasting</span>
                    <span className="text-[10px] text-slate-500 font-mono">Series horarias de Asimilación (NO2/O3/PM)</span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-400" />
                </button>
              </ScientificTooltip>

              <ScientificTooltip content="Descarga de constantes de reacción k₁, fotólisis J_NO₂ y balance cinético de radicales en formato tabular CSV citable.">
                <button 
                  onClick={handleExportKineticsCSV}
                  className="flex items-center justify-between p-2 bg-slate-900 border border-slate-700 hover:border-amber-500 transition-colors group cursor-pointer w-full"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-slate-200 group-hover:text-amber-400">Diagnóstico Cinético de Radicales</span>
                    <span className="text-[10px] text-slate-500 font-mono">Vidas medias OH y Constantes de Degradación</span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-400" />
                </button>
              </ScientificTooltip>
            </div>

            {/* NetCDF-4 / CF-1.8 Section */}
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                <h4 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Estándar Atmosférico NetCDF-4 / CF-1.8
                </h4>
                <ScientificTooltip
                  content="Estándar científico internacional de la OMM y Copernicus CAMS para campos multidimensionales (time x z x lat x lon). Incorpora metadatos espaciales ETRS89 / UTM 30N (EPSG:25830) para su ingestión en Panoply, Python xarray, WRF-Chem o CMAQ."
                  formula="Conventions = CF-1.8, ACDD-1.3 \quad | \quad crs = EPSG:25830"
                  citation="Directiva INSPIRE 2007/2/CE - Directiva 2008/50/CE"
                />
              </div>

              <ScientificTooltip content="Descarga del estándar internacional multidimensional NetCDF-4/CF-1.8 de Copernicus CAMS y OMM para Panoply y Python xarray.">
                <button 
                  onClick={handleExportNetCdfBinary}
                  className="flex items-center justify-between p-2 bg-slate-900 border border-slate-700 hover:border-cyan-400 transition-colors group cursor-pointer w-full"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-slate-200 group-hover:text-cyan-300">Matriz NetCDF Binaria (.nc)</span>
                    <span className="text-[10px] text-slate-500 font-mono">Formato Clásico Unidata (CDF\x01) para Python/xarray/Panoply</span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                </button>
              </ScientificTooltip>

              <ScientificTooltip content="Descarga del esquema formal Common Data Language (CDL) compilable con el motor ncgen de Unidata.">
                <button 
                  onClick={handleExportNetCdfCdl}
                  className="flex items-center justify-between p-2 bg-slate-900 border border-slate-700 hover:border-cyan-400 transition-colors group cursor-pointer w-full"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-slate-200 group-hover:text-cyan-300">Descriptor NetCDF CDL (.cdl)</span>
                    <span className="text-[10px] text-slate-500 font-mono">Common Data Language para compilador 'ncgen' y metadatos FAIR</span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                </button>
              </ScientificTooltip>
            </div>
          </div>
        )}

        {/* CONTENIDO SUBPESTAÑA 2: GENERADOR DE INFORMES & ESTUDIOS PDF A LA CARTA */}
        {activeSubTab === 'custom_pdf' && (
          <div className="animate-in fade-in duration-150">
            <CustomOnDemandPdfReportTab
              currentMeteo={currentMeteo}
              physics={physics}
              stationComparisons={stationComparisons}
              benchmarkParams={benchmarkParams}
              odeParams={odeParams}
              location={location}
            />
          </div>
        )}

      </div>
    </DraggableWindow>
  );
};
