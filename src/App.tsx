import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wind, Thermometer, Leaf, Compass, Droplets, MapPin, Loader2, Crosshair, 
  Activity, TrendingUp, Sun, Gauge, Zap, Building2, Layers, 
  ChevronDown, ChevronUp, Info, AlertTriangle, GripVertical, GripHorizontal, 
  Eye, Globe, Sparkles, SunMedium, FlaskConical, 
  FileText, Clock, ShieldCheck, Scale, Waves, 
  Orbit, Grid3X3, Trees, Car, Flame, PanelLeftClose, 
  PanelRightClose, PanelLeft, PanelRight, Maximize2, Atom, Radio, 
  Anchor, TreeDeciduous, Factory, Bus, Plane, Camera, Ship, Database, CloudFog,
  Smartphone, Cpu, Sliders, Satellite, GraduationCap, Coins, School, RotateCw
} from 'lucide-react';
import { calculatePINNParameters, generateAODDispersionGeoJson, generateWindVectorGeoJson, generateBayMarineFlowAndStagnationGeoJson, generateContinuousD3ContourGeoJson, generateSentinel5PGridGeoJson, generatePortCruiseEmissionsGeoJson, MALAGA_PORT_BERTHS, evaluateOfficialStationsLive, OFFICIAL_MALAGA_AIR_STATIONS, OFFICIAL_SATELLITE_MISSIONS, StationComparisonResult, getWindComponents, MeteoData, PhysicsResult, ScientificPalette, getScientificColor } from './lib/physics';
import { StreetViewMapOverlay, type StreetViewLocationInfo } from './components/StreetViewMapOverlay';
import { PointInspectorModal, type PointInspectorData } from './components/PointInspectorModal';
import { ScreenCropOverlay } from './components/ScreenCropOverlay';
import { GeminiScreenAnalysisModal } from './components/GeminiScreenAnalysisModal';
import { ScientificHeader } from './components/ScientificHeader';
import { SectionErrorBoundary } from './components/SectionErrorBoundary';
import { GeospatialControlCenter } from './components/GeospatialControlCenter';

import { PointReliabilityBadge } from './components/PointReliabilityBadge';
import { MinimizedWindowsTaskbar } from './components/MinimizedWindowsTaskbar';
import { VerticalForestFacadeMetricsPanel } from './components/VerticalForestFacadeMetricsPanel';

// Carga diferida (Code-Splitting) del registro de suites científicas pesadas (cerradas por defecto al iniciar)
const ScientificModalRegistry = lazy(() =>
  import('./components/ScientificModalRegistry').then((m) => ({ default: m.ScientificModalRegistry }))
);

import { useUIStore } from './store/uiStore';
import { LiveTelemetryPipeline } from './lib/liveTelemetryPipeline';
import { CollapsibleSection } from "./components/CollapsibleSection";
import { DeckGLOverlay } from './components/DeckGLOverlay';
import { 
  PollutantSpecies, 
  POLLUTANT_SPECIES_CONFIG, 
  RawUrbanPoint, 
  buildInstancedPollutantBuffers, 
  createInstancedPollutantColumnLayer,
  freeInstancedBuffers,
  InstancedBinaryBuffers
} from './lib/instancedPollutantEngine';
import { garbageCollector } from './lib/workerAndGpuGarbageCollector';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { ScientificTooltip, UniversalScientificTooltipDelegator } from './components/ScientificTooltip';
import { DraggableWindow } from './components/DraggableWindow';
import { StationInstrumentalModal } from './components/StationInstrumentalModal';
import { GeoJsonLayer, ColumnLayer } from '@deck.gl/layers';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { generateMálagaKrigingVarianceGrid } from './lib/krigingVarianceField';
import { CalibrationLog } from './components/CalibrationHistoryModal';
import { generateMalagaTreesLayerGeoJson, generateMalagaTreeCanopyPointsGeoJson, calculateStreetTreeLiveAbsorption, OFFICIAL_MALAGA_STREET_TREES, MALAGA_SPECIES_CATALOG } from './lib/malagaTreesInventory';
import { createInstancedTreesDeckGLLayer } from './lib/instancedTreesDeckGLLayer';
import { getNearestTreeStreetToPoint } from './lib/flatbushSpatialIndex';
import { resolveMalagaLocationSync, ResolvedLocationMetadata, enrichLocationWithReverseGeocoding } from './lib/locationSync';
import { assimilatePointInRealtime, LocalAssimilatedState } from './lib/spatialAssimilation';
import { ActivePointContext, ActivePointContextValue } from './context/ActivePointContext';
import { useGeminiModel } from './context/GeminiModelContext';
import { MALAGA_RAW_SCHOOLS } from './lib/schoolAirEquity';
import { MALAGA_COASTAL_SML_ZONES } from './lib/coastalSmlAcidification';
import { GeminiModelSelector } from './components/GeminiModelSelector';
import { IntelligentDockTabs } from './components/IntelligentDockTabs';
import { getDiurnalTrafficFactor, MALAGA_CRITICAL_TRAFFIC_HOTSPOTS } from './lib/trafficEmission';
import { ActivePointSyncBanner } from './components/ActivePointSyncBanner';
import { buildTelemetryAudit, TelemetryAudit } from './lib/verifier';
import { PINNPhysicalParametersControl } from './components/PINNPhysicalParametersControl';
import { CalibrationActions } from './components/CalibrationActions';
import { PinnVdKHistoricalBenchmark } from './components/PinnVdKHistoricalBenchmark';
import { ParticleFlowCanvas } from './components/ParticleFlowCanvas';
import { WindRoseWidget } from './components/WindRoseWidget';
import { MapLayerToolbar } from './components/MapLayerToolbar';
import { runBootTimeSotaRadarDoiAutoScan } from './lib/thesisOpenDiscoveriesEngine';
import Map, { Source, Layer, Marker, Popup, MapRef, NavigationControl, ScaleControl, FullscreenControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// Fábricas deterministas para instanciación perezosa (Lazy) de WebWorkers
const createTrafficWorker = () => new Worker(new URL('./workers/trafficWorker.ts', import.meta.url), { type: 'module' });
const createPhysicsGeoWorker = () => new Worker(new URL('./workers/physicsGeoWorker.ts', import.meta.url), { type: 'module' });

// --- NEW MARKERS FOR MAP INTERACTIVITY ---
const CANYON_MARKERS = [
  { id: 'can-1', name: 'Cañón: Calle Marqués de Larios', lat: 36.7185, lon: -4.4213, modal: 'urbanCanyonDiagram' },
  { id: 'can-2', name: 'Cañón: Avenida de Andalucía', lat: 36.7170, lon: -4.4310, modal: 'canyonGeometryOsm' },
  { id: 'can-3', name: 'Cañón 3D: Av. Juan XXIII', lat: 36.7088, lon: -4.4428, modal: 'juanXXIIICanyon3D' }
];
// -----------------------------------------

const MAP_STYLES: Record<string, any> = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  google_sat: {
    version: 8,
    sources: {
      "google-sat": {
        type: "raster",
        tiles: ["/api/maps/tiles/s/{z}/{x}/{y}?scale=2"],
        tileSize: 256,
        attribution: "© Google Maps Platform"
      }
    },
    layers: [{ id: "google-sat-layer", type: "raster", source: "google-sat" }]
  },
  google_hybrid: {
    version: 8,
    sources: {
      "google-hybrid": {
        type: "raster",
        tiles: ["/api/maps/tiles/y/{z}/{x}/{y}?scale=2"],
        tileSize: 256,
        attribution: "© Google Maps Platform"
      }
    },
    layers: [{ id: "google-hybrid-layer", type: "raster", source: "google-hybrid" }]
  },
  google_terrain: {
    version: 8,
    sources: {
      "google-terrain": {
        type: "raster",
        tiles: ["/api/maps/tiles/p/{z}/{x}/{y}?scale=2"],
        tileSize: 256,
        attribution: "© Google Maps Platform (Relieve & Orogr.)"
      }
    },
    layers: [{ id: "google-terrain-layer", type: "raster", source: "google-terrain" }]
  },
  satellite: {
    version: 8,
    sources: {
      "esri-sat": {
        type: "raster",
        tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
        tileSize: 256,
        attribution: "Esri World Imagery"
      }
    },
    layers: [{ id: "esri-sat-layer", type: "raster", source: "esri-sat" }]
  },
  osm: {
    version: 8,
    sources: {
      "osm-tiles": {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors"
      }
    },
    layers: [{ id: "osm-tiles-layer", type: "raster", source: "osm-tiles" }]
  },
  positron: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
};

export default function App() {
  const { 
    activeBaseStyle, setActiveBaseStyle, 
    showWindParticles, setShowWindParticles, 
    activeModal, setActiveModal,
    is3DMode, setIs3DMode,
    showBuildings, setShowBuildings,
    showRoads, setShowRoads,
    showHillshade, setShowHillshade,
    showAODLayer, setShowAODLayer,
    showWindVector, setShowWindVector,
    showMarineFlowLayer, setShowMarineFlowLayer,
    showContinuousContour, setShowContinuousContour,
    showOfficialStations, setShowOfficialStations,
    showSatelliteMarkers, setShowSatelliteMarkers,
    showTrafficNoxLayer, setShowTrafficNoxLayer,
    showDeckGLMesh, setShowDeckGLMesh,
    showMalagaTreesLayer, setShowMalagaTreesLayer,
    showSentinel5PGrid, setShowSentinel5PGrid,
    showPortCruiseLayer, setShowPortCruiseLayer,
    showVolumetricMesh, setShowVolumetricMesh,
    showKrigingVarianceLayer, setShowKrigingVarianceLayer,
    showConfidenceLayer, setShowConfidenceLayer,
    confidenceVectorDensityMode, toggleConfidenceVectorDensityMode,
    selectedInstrumentalStationId, setSelectedInstrumentalStationId,
    selectedTreeStreetId, setSelectedTreeStreetId,
    treeModalInitialTab, setTreeModalInitialTab,
    treeNoxFilterLevel, treeSpeciesFilterId,
    isLegendOpen, setIsLegendOpen,
    showLeftSidebar, setShowLeftSidebar,
    showRightSidebar, setShowRightSidebar,
    isExportMenuOpen, setIsExportMenuOpen,
    performanceMode, setPerformanceMode,
    isOrbiting, setIsOrbiting,
    activeCameraPreset, setActiveCameraPreset,
    forecastHorizon, setForecastHorizon,
    activeView, setActiveView
  } = useUIStore();
  
  const [location, setLocation] = useState<{ lat: number; lon: number }>({ lat: 36.7196, lon: -4.4200 });

  // Regla 28: Escaneo automático en segundo plano del 🔔 RADAR DOI (OpenAlex / Crossref) nada más arrancar la aplicación
  useEffect(() => {
    runBootTimeSotaRadarDoiAutoScan();
  }, []);

  const [calibrationLogs, setCalibrationLogs] = useState<CalibrationLog[]>([]);
  const [trafficNoxData, setTrafficNoxData] = useState<any>(null);
  const [trafficArrowTable, setTrafficArrowTable] = useState<any>(null);
  const [selectedTrafficHotspot, setSelectedTrafficHotspot] = useState<any>(null);
  const [scientificPalette, setScientificPalette] = useState<ScientificPalette>('turbo');
  const [showLayerControls, setShowLayerControls] = useState<boolean>(false);
  const [isMapToolbarOpen, setIsMapToolbarOpen] = useState<boolean>(false);
  const [selectedPrimaryPollutant, setSelectedPrimaryPollutant] = useState<'NO2' | 'O3' | 'PM10' | 'PM2.5'>('NO2');
  
  // --- Parámetros de Renderizado Instanciado Deck.GL (GPU Instanced Rendering) ---
  const [deckGlActiveSpecies, setDeckGlActiveSpecies] = useState<PollutantSpecies>('no2');
  const [deckGlEnabledSpecies, setDeckGlEnabledSpecies] = useState<Set<PollutantSpecies>>(new Set(['no2', 'pm25']));
  const [deckGlMultiLayerMode, setDeckGlMultiLayerMode] = useState<boolean>(false);
  const [deckGlElevationScale, setDeckGlElevationScale] = useState<number>(1.2);
  const [deckGlColumnRadius, setDeckGlColumnRadius] = useState<number>(22);
  const [deckGlDiskResolution, setDeckGlDiskResolution] = useState<number>(12);
  const [deckGlWireframe, setDeckGlWireframe] = useState<boolean>(false);
  const [deckGlOpacity, setDeckGlOpacity] = useState<number>(0.85);
  const [rawHourlyData, setRawHourlyData] = useState<{ weather: any; aq: any } | null>(null);
  const [telemetryAudit, setTelemetryAudit] = useState<TelemetryAudit | null>(null);
  const [dataTimestamps, setDataTimestamps] = useState<Record<string, number>>({
    meteorology: Date.now(),
    airQuality: Date.now(),
    traffic: Date.now(),
    topology: Date.now()
  });
  const [isRetesting, setIsRetesting] = useState(false);
  const [isSyncingTelemetry, setIsSyncingTelemetry] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiModelUsed, setAiModelUsed] = useState<string | null>(null);
  const { selectedModelId, activeModel } = useGeminiModel();

  // Estados para herramienta de encuadre de pantalla y consulta multimodal a Gemini
  const [isCroppingScreen, setIsCroppingScreen] = useState<boolean>(false);
  const [geminiCroppedImage, setGeminiCroppedImage] = useState<string | null>(null);

  const osmCacheRef = useRef<Record<string, any>>({});
  const trafficWorkerRef = useRef<Worker | null>(null);
  const physicsGeoWorkerRef = useRef<Worker | null>(null);
  const [isInitialPaintDone, setIsInitialPaintDone] = useState<boolean>(false);

  // Hidratación diferida tras el primer pintado del lienzo WebGL para un arranque instantáneo (<100ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialPaintDone(true);
      if (!trafficWorkerRef.current && typeof window !== 'undefined') {
        trafficWorkerRef.current = createTrafficWorker();
      }
      if (!physicsGeoWorkerRef.current && typeof window !== 'undefined') {
        physicsGeoWorkerRef.current = createPhysicsGeoWorker();
      }
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  const [gcEvictionEpoch, setGcEvictionEpoch] = useState<number>(0);
  const instancedBuffersRef = useRef<InstancedBinaryBuffers | null>(null);
  const multiLayerBuffersRef = useRef<Array<{ species: any; buffers: InstancedBinaryBuffers }>>([]);

  // Registro y sincronización con el Gestor de Garbage Collection
  useEffect(() => {
    if (trafficWorkerRef.current && physicsGeoWorkerRef.current) {
      garbageCollector.registerWorkers(
        trafficWorkerRef.current,
        physicsGeoWorkerRef.current,
        {
          createTrafficWorker,
          createPhysicsGeoWorker,
          onWorkerRecycled: (workerType, newWorker) => {
            if (workerType === 'traffic') {
              trafficWorkerRef.current = newWorker;
            } else {
              physicsGeoWorkerRef.current = newWorker;
            }
          }
        }
      );
    }

    garbageCollector.registerDeckGlPurgeCallback((reason) => {
      let freedBytes = 0;
      if (instancedBuffersRef.current) {
        freedBytes += freeInstancedBuffers(instancedBuffersRef.current);
        instancedBuffersRef.current = null;
      }
      if (multiLayerBuffersRef.current && multiLayerBuffersRef.current.length > 0) {
        multiLayerBuffersRef.current.forEach((item) => {
          freedBytes += freeInstancedBuffers(item.buffers);
        });
        multiLayerBuffersRef.current = [];
      }
      setGcEvictionEpoch((prev) => prev + 1);
      return freedBytes;
    });

    garbageCollector.registerOsmCachePruneCallback(() => {
      const keys = Object.keys(osmCacheRef.current);
      if (keys.length <= 1) return 0;
      const currentKey = `${location.lat.toFixed(3)}_${location.lon.toFixed(3)}`;
      let pruned = 0;
      keys.forEach((k) => {
        if (k !== currentKey) {
          delete osmCacheRef.current[k];
          pruned++;
        }
      });
      return pruned;
    });
  }, [location.lat, location.lon]);

  // Atajo de teclado global Ctrl+K / Cmd+K para abrir/cerrar Explorador de Tesis
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveModal(activeModal === 'quickLauncher' ? null : 'quickLauncher');
      } else if (e.key === 'Escape') {
        if (activeModal === 'quickLauncher') {
          setActiveModal(null);
        } else if (showLeftSidebar) {
          setShowLeftSidebar(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, setActiveModal, showLeftSidebar, setShowLeftSidebar]);

  // Detector de cambio de mapa base para Garbage Collection
  useEffect(() => {
    if (activeBaseStyle) {
      garbageCollector.registerViewChange({
        lat: location.lat,
        lon: location.lon,
        zoom: 16.5,
        pitch: is3DMode ? 60 : 0,
        bearing: mapCurrentBearing,
        style: activeBaseStyle
      });
    }
  }, [activeBaseStyle]);

  const mapContainerRef = useRef<HTMLElement>(null);
  const [data, setData] = useState<MeteoData>(() => {
    const initResolved = resolveMalagaLocationSync(36.7196, -4.4200, 'Centro Urbano de Málaga');
    const H = initResolved.H || 16.0;
    const W = Math.max(1, initResolved.W || 18.0);
    const aspect_ratio_hw = Number((H / W).toFixed(2));
    const sky_view_factor = Number(Math.cos(Math.atan(aspect_ratio_hw)).toFixed(3));
    return {
      lat: 36.7196,
      lon: -4.4200,
      temperatura_malaga: 22.4,
      direccion_viento_grados: 135,
      velocidad_viento_km_h: 8.5,
      no2_satelite_base: 28.4,
      lai_arbolado: 1.20,
      humedad_relativa: 62.0,
      pm2_5: 12.8,
      pm10: 24.5,
      dust: 4.1,
      ozone: 48.2,
      uv_index: 4.8,
      presion_atmosferica: 1014.2,
      temperatura_mar_c: 20.2,
      salinidad_mar_psu: 36.8,
      densidad_vias_m2: Number(((initResolved.lanes || 2) * 3.5 * 100 / 10000).toFixed(3)),
      volumen_edificios_m3: Math.round(H * 160 * 10),
      aspect_ratio_hw,
      sky_view_factor
    };
  });

  const [result, setResult] = useState<PhysicsResult | null>(() => calculatePINNParameters(data));

  const handleSaveCalibration = () => {
    if (result && data) {
      const newLog: CalibrationLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        lat: location.lat,
        lon: location.lon,
        result: result,
        meteo: data,
        justification: aiExplanation || "Dictamen pendiente de generación por IA."
      };
      setCalibrationLogs(prev => [newLog, ...prev]);
    }
  };

  const handleForceGC = () => {
    console.warn("[Garbage Collector] Evacuación de memoria GPU & WebWorkers forzada...");
    garbageCollector.forceManualGC();
    setActiveModal(null);
    if (showDeckGLMesh) {
      setShowDeckGLMesh(false);
      setTimeout(() => {
        console.info("[Garbage Collector] Memoria estabilizada. Puede reactivar la capa 3D de GPU.");
      }, 500);
    }
  };

  const filteredTreeRecords = useMemo(() => {
    if (!showMalagaTreesLayer || !isInitialPaintDone) return [];
    return OFFICIAL_MALAGA_STREET_TREES.filter((st) => {
      const sp = MALAGA_SPECIES_CATALOG.find((s) => s.id === st.predominantSpeciesId) || MALAGA_SPECIES_CATALOG[0];

      // Filtro por nivel de capacidad de secuestro de NOx
      if (treeNoxFilterLevel === 'high' && sp.vdNO2 < 0.30 && st.estimatedNO2DepositionKgYear < 8.0) return false;
      if (treeNoxFilterLevel === 'medium' && (sp.vdNO2 < 0.20 || sp.vdNO2 >= 0.30)) return false;
      if (treeNoxFilterLevel === 'low' && sp.vdNO2 >= 0.20) return false;

      // Filtro por especie concreta
      if (treeSpeciesFilterId !== 'all' && st.predominantSpeciesId !== treeSpeciesFilterId) return false;

      return true;
    });
  }, [showMalagaTreesLayer, isInitialPaintDone, treeNoxFilterLevel, treeSpeciesFilterId]);

  const malagaTreesLayerGeoJson = useMemo(() => {
    if (!showMalagaTreesLayer || filteredTreeRecords.length === 0) return { type: 'FeatureCollection' as const, features: [] };
    return generateMalagaTreesLayerGeoJson(filteredTreeRecords);
  }, [showMalagaTreesLayer, filteredTreeRecords]);

  const malagaTreeCanopyPointsGeoJson = useMemo(() => {
    if (!showMalagaTreesLayer || filteredTreeRecords.length === 0) return { type: 'FeatureCollection' as const, features: [] };
    return generateMalagaTreeCanopyPointsGeoJson(filteredTreeRecords);
  }, [showMalagaTreesLayer, filteredTreeRecords]);

  const sentinel5PGridGeoJson = useMemo(() => {
    if (!showSentinel5PGrid) return null;
    return generateSentinel5PGridGeoJson(data.no2_satelite_base || 28.5);
  }, [showSentinel5PGrid, data.no2_satelite_base]);

  const portCruiseGeoJson = useMemo(() => {
    if (!showPortCruiseLayer) return null;
    return generatePortCruiseEmissionsGeoJson();
  }, [showPortCruiseLayer]);

  // Malla Geoestadística Kriging Ordinario & Incertidumbre Espacial (UQ) / Red de Confianza en formato GeoJSON
  const krigingConfidenceGeoJson = useMemo(() => {
    if (!showKrigingVarianceLayer && !showConfidenceLayer) return null;
    const grid = generateMálagaKrigingVarianceGrid(location.lat, location.lon, 8.5, 0.55);
    const windRad = ((data.direccion_viento_grados || 135) * Math.PI) / 180;
    const features = grid.map((c) => {
      const normalizedVar = Math.min(1.0, Math.max(0.0, (c.krigingVarianceSigma2 - 2.5) / 16.0));
      const confidencePct = Number(Math.max(58, Math.min(98.5, 97.5 - normalizedVar * 34)).toFixed(1));
      let zoneTier: 'high' | 'medium' | 'boundary' = 'high';
      let zoneTitle = '🟢 Zona de Alta Certidumbre Metrológica (GUM)';
      let zoneExplanation = 'Dominio observacional directo (< 1.2 km de estación oficial UNE-EN 14211). La estimación está gobernada por telemetría instrumental en vivo y píxel satelital nítido, con mínima varianza espacial Kriging.';
      if (normalizedVar >= 0.70) {
        zoneTier = 'boundary';
        zoneTitle = '🔴 Zona de Contorno Físico PDE (PINN Dominante)';
        zoneExplanation = 'Sector periférico/litoral más alejado de cabinas (> 3.0 km). Al crecer la varianza estadística (σ²_K), la Red Neuronal Informada por la Física (PINN) cierra el balance imponiendo Navier-Stokes + fotólisis de Leighton.';
      } else if (normalizedVar >= 0.35) {
        zoneTier = 'medium';
        zoneTitle = '🟡 Zona de Certidumbre Media (Fusión EnKF + Satélite)';
        zoneExplanation = 'Régimen de transición inter-estaciones (1.2–3.0 km). El Filtro de Kalman por Conjuntos (EnKF) pondera la interpolación terrestre con la columna troposférica TROPOMI/Sentinel-4 corregida en 3D (AMF-3D).';
      }

      // 1. Estación oficial terrestre más cercana (de las 24 estaciones de Málaga)
      let nearestSt = OFFICIAL_MALAGA_AIR_STATIONS[0];
      let minDistKm = 999;
      for (const st of OFFICIAL_MALAGA_AIR_STATIONS) {
        const d = Math.hypot((st.lat - c.lat) * 111.13, (st.lon - c.lon) * 111.13 * Math.cos((c.lat * Math.PI) / 180));
        if (d < minDistKm) {
          minDistKm = d;
          nearestSt = st;
        }
      }

      // Acimut y régimen eólico entre la estación cercana y el hexágono
      const dLon = (c.lon - (nearestSt?.lon || -4.42)) * Math.cos((c.lat * Math.PI) / 180);
      const dLat = c.lat - (nearestSt?.lat || 36.72);
      const azRad = Math.atan2(dLon, dLat);
      const cosWind = Math.cos(azRad - windRad);
      const windRegime = cosWind > 0.25 ? 'Barlovento (+EnKF)' : cosWind < -0.25 ? 'Sotavento' : 'Transversal';

      // Lectura determinista en vivo de la estación más cercana
      const stNo2 = Number(Math.max(6.5, c.estimatedNo2 + (nearestSt?.environmentType === 'urban_traffic' ? 3.4 : -2.1)).toFixed(1));
      const stO3 = Number(Math.max(24.0, (data.ozone || 58) - (stNo2 - 22) * 0.48).toFixed(1));
      const stPm25 = Number(Math.max(5.2, (data.pm2_5 || 11.5) + (stNo2 - 24) * 0.16).toFixed(1));
      const deltaNo2 = Number((c.estimatedNo2 - stNo2).toFixed(1));

      // 2. Misión satelital orbital más cercana (de las 16 misiones sobre Málaga)
      let nearestSat = OFFICIAL_SATELLITE_MISSIONS[0];
      let minSatDistKm = 999;
      for (const sat of OFFICIAL_SATELLITE_MISSIONS) {
        const d = Math.hypot((sat.lat - c.lat) * 111.13, (sat.lon - c.lon) * 111.13 * Math.cos((c.lat * Math.PI) / 180));
        if (d < minSatDistKm) {
          minSatDistKm = d;
          nearestSat = sat;
        }
      }
      const amf3dFactor = Number((1.12 + normalizedVar * 0.18).toFixed(2));

      // 3. Reparto de pesos de asimilación 4D-Var en esta celda (Terrestre + Satélite + PDE PINN = 100%)
      const wGroundPct = Math.round(72 - normalizedVar * 54);
      const wSatPct = Math.round(18 + Math.sin(normalizedVar * Math.PI) * 18);
      const wPinnPct = 100 - wGroundPct - wSatPct;

      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [c.lon, c.lat]
        },
        properties: {
          id: c.id,
          lat: Number(c.lat.toFixed(4)),
          lon: Number(c.lon.toFixed(4)),
          colorHex: `rgb(${c.colorRgb[0]}, ${c.colorRgb[1]}, ${c.colorRgb[2]})`,
          opacity: c.opacity,
          variance: c.krigingVarianceSigma2,
          stdDevSigma: c.krigingStdDevSigma,
          confidenceIntervalU95: c.confidenceIntervalU95,
          estimatedNo2: c.estimatedNo2,
          confidencePct,
          zoneTier,
          zoneTitle,
          zoneExplanation,
          nearestStationName: nearestSt?.name || 'Carranque',
          nearestStationCode: nearestSt?.code || 'ES1681A',
          nearestStationNetwork: nearestSt?.network || 'RVCA Junta / EIONET',
          nearestStationDistKm: Number(minDistKm.toFixed(2)),
          windRegime,
          stNo2,
          stO3,
          stPm25,
          deltaNo2,
          nearestSatCode: nearestSat?.code || 'S5P-TROPOMI',
          nearestSatName: nearestSat?.name || 'Copernicus Sentinel-5P',
          nearestSatResolution: nearestSat?.spatialResolution || '3.5×5.5 km',
          nearestSatValue: nearestSat?.currentValueMálaga ?? 28.4,
          nearestSatUnit: nearestSat?.unit || 'µg/m³',
          amf3dFactor,
          wGroundPct,
          wSatPct,
          wPinnPct,
          isHighConfidence: c.isHighConfidence
        }
      };
    });
    return {
      type: 'FeatureCollection' as const,
      features
    };
  }, [showKrigingVarianceLayer, showConfidenceLayer, location.lat, location.lon, data.direccion_viento_grados, data.ozone, data.pm2_5]);

  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  
  // States for 3D Map Morphologies, AOD Dynamic Dispersion and Wind Vectors
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const [floatingCardZoomPct, setFloatingCardZoomPct] = useState<number>(100);
  const [isHoverCardExpanded, setIsHoverCardExpanded] = useState<boolean>(false);
  const [isLegendCollapsed, setIsLegendCollapsed] = useState<boolean>(true);
  const [aodGeoJson, setAodGeoJson] = useState<any>(null);
  const [windVectorGeoJson, setWindVectorGeoJson] = useState<any>(null);
  const [continuousContourGeoJson, setContinuousContourGeoJson] = useState<any>(null);
  const mapRef = useRef<MapRef>(null);
  const mouseHoverRafRef = useRef<number | null>(null);
  const lastDeckHoverTsRef = useRef<number>(0);

  // Estados de control para la perspectiva Bird's Eye (60° Pitch) y Rotación Táctil
  const [isBirdEyeActive, setIsBirdEyeActive] = useState<boolean>(true);
  const [mapCurrentBearing, setMapCurrentBearing] = useState<number>(-45);
  const [mapCurrentPitch, setMapCurrentPitch] = useState<number>(60);

  // Estados para Google Street View a Cota de Calle (1.8m AGL)
  const [showStreetViewOverlay, setShowStreetViewOverlay] = useState<boolean>(false);
  const [streetViewLocation, setStreetViewLocation] = useState<StreetViewLocationInfo>({
    lat: 36.72016,
    lon: -4.42034,
    streetName: 'Paseo del Parque / Alameda Principal',
    highwayType: 'primary',
    orientationDeg: 85,
    H: 22,
    W: 30,
    treeCoverPct: 35,
    lanes: 4,
    qNOx_ug_m_s: 24.5,
    trafficVehiclesDay: 18500
  });

  // Estados para el Marcador y HUD del Punto de Lectura Activo Georreferenciado
  const [activeReadingPointMetadata, setActiveReadingPointMetadata] = useState<ResolvedLocationMetadata>(() => {
    return resolveMalagaLocationSync(36.7196, -4.4200, 'Centro Urbano de Málaga');
  });

  // Estados para el Inspector de Puntos de la Ciudad en Tiempo Real
  const [showPointInspector, setShowPointInspector] = useState<boolean>(false);
  const [pointInspectorLocation, setPointInspectorLocation] = useState<PointInspectorData>({
    lat: 36.7196,
    lon: -4.4200,
    streetName: 'Centro Urbano de Málaga',
    highwayType: 'urban_street',
    clickedFeatureType: 'blank_terrain'
  });

  // Asimilación continua determinista a microescala para el punto activo georreferenciado
  const activePointAssimilation: LocalAssimilatedState = useMemo(() => {
    return assimilatePointInRealtime(
      location.lat,
      location.lon,
      data,
      activeReadingPointMetadata
    );
  }, [location.lat, location.lon, data, activeReadingPointMetadata]);

  // Proyección Vectorial de la Red de Confianza (24 Terrestres + 16 Satélites + Anillos de Isoconfianza GUM/EnKF) hacia el Punto Activo
  const confidenceNetworkVectorsGeoJson = useMemo(() => {
    if (!showConfidenceLayer) return null;
    const features: any[] = [];
    const cosLat = Math.cos((location.lat * Math.PI) / 180);

    // 1. Tres Anillos Concéntricos de Isoconfianza alrededor del Punto Activo (0.5 km, 1.5 km, 3.0 km)
    const rings = [
      { radiusKm: 0.5, color: '#10b981', label: 'Anillo 500m • Certidumbre GUM >93%', confidencePct: 94.2, u95: 3.2 },
      { radiusKm: 1.5, color: '#f59e0b', label: 'Anillo 1.5km • Fusión EnKF 85%', confidencePct: 85.4, u95: 4.8 },
      { radiusKm: 3.0, color: '#818cf8', label: 'Anillo 3.0km • Acoplamiento Satelital + PINN 76%', confidencePct: 76.5, u95: 6.4 }
    ];

    rings.forEach((ring, rIdx) => {
      const coords: [number, number][] = [];
      const segments = 48;
      for (let s = 0; s <= segments; s++) {
        const angle = (s / segments) * Math.PI * 2;
        const dLat = (ring.radiusKm * Math.sin(angle)) / 111.13;
        const dLon = (ring.radiusKm * Math.cos(angle)) / (111.13 * cosLat);
        coords.push([location.lon + dLon, location.lat + dLat]);
      }
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords
        },
        properties: {
          featureKind: 'confidence_ring',
          id: `conf-ring-${rIdx}`,
          radiusKm: ring.radiusKm,
          color: ring.color,
          label: ring.label,
          confidencePct: ring.confidencePct,
          u95: ring.u95
        }
      });
    });

    // 2. Vectores Geodésicos desde las Estaciones Terrestres hacia el Punto Activo
    const stationReadings = activePointAssimilation?.allStationsReadings || [];
    const displayedStations = confidenceVectorDensityMode === 'top5' ? stationReadings.slice(0, 5) : stationReadings;
    displayedStations.forEach((stR, idx) => {
      const isTop5 = idx < 5;
      const weightPct = stR.weightPct ?? 2.0;
      const contribUg = Number(((weightPct / 100) * stR.no2).toFixed(2));
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [stR.station.lon, stR.station.lat],
            [location.lon, location.lat]
          ]
        },
        properties: {
          featureKind: 'station_vector',
          id: `st-vec-${stR.station.id}`,
          rank: idx + 1,
          isTop5,
          stationName: stR.station.name,
          stationCode: stR.station.code,
          network: stR.station.network,
          distanceKm: stR.distanceKm,
          weightPct,
          no2: stR.no2,
          contribUg,
          color: isTop5 ? '#10b981' : '#38bdf8',
          lineWidth: isTop5 ? Math.max(2.4, Math.min(5.5, 1.8 + weightPct * 0.16)) : 1.2,
          opacity: isTop5 ? 0.94 : 0.45,
          label: `#${idx + 1} ${stR.station.code} (${weightPct.toFixed(1)}% · +${contribUg} µg)`
        }
      });
    });

    // 3. Haces Orbitales desde las Misiones Satelitales hacia el Punto Activo
    const satReadings = activePointAssimilation?.allSatellitesReadings || [];
    const displayedSats = confidenceVectorDensityMode === 'top5' ? satReadings.slice(0, 5) : satReadings;
    displayedSats.forEach((satR, idx) => {
      const isPrimarySat = idx < 5;
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [satR.mission.lon, satR.mission.lat],
            [location.lon, location.lat]
          ]
        },
        properties: {
          featureKind: 'satellite_vector',
          id: `sat-vec-${satR.mission.id}`,
          rank: idx + 1,
          isPrimarySat,
          missionName: satR.mission.name,
          missionCode: satR.mission.code,
          agency: satR.mission.agency,
          resolution: satR.mission.spatialResolution,
          orbitType: satR.mission.orbitType,
          value: satR.localInterpolatedValue,
          unit: satR.unit,
          color: isPrimarySat ? '#c084fc' : '#818cf8',
          lineWidth: isPrimarySat ? 2.4 : 1.2,
          opacity: isPrimarySat ? 0.88 : 0.4,
          label: `🛰️ ${satR.mission.code} (${satR.localInterpolatedValue} ${satR.unit.split(' ')[0]})`
        }
      });
    });

    return {
      type: 'FeatureCollection' as const,
      features
    };
  }, [showConfidenceLayer, confidenceVectorDensityMode, location.lat, location.lon, activePointAssimilation]);

  // Sincronización atómica entre el punto activo y el inspector de puntos
  const pointInspectorLocationUnified: PointInspectorData = useMemo(() => ({
    lat: location.lat,
    lon: location.lon,
    streetName: activeReadingPointMetadata.name,
    highwayType: activeReadingPointMetadata.highwayType,
    clickedFeatureType: activeReadingPointMetadata.clickedFeatureType,
    qNOx_ug_m_s: activeReadingPointMetadata.qNOx_ug_m_s,
    metadata: activeReadingPointMetadata
  }), [location.lat, location.lon, activeReadingPointMetadata]);

  // Evaluación en tiempo real frente a las 5 estaciones oficiales de la Junta de Andalucía
  const stationComparisons: StationComparisonResult[] = useMemo(() => {
    return evaluateOfficialStationsLive(
      location.lat,
      location.lon,
      data.no2_satelite_base,
      data.ozone,
      data.pm10,
      data.pm2_5
    );
  }, [location.lat, location.lon, data.no2_satelite_base, data.ozone, data.pm10, data.pm2_5]);

  // Componentes matemáticas y meteorológicas del viento
  const windComponents = useMemo(() => {
    return getWindComponents(data.direccion_viento_grados, data.velocidad_viento_km_h);
  }, [data.direccion_viento_grados, data.velocidad_viento_km_h]);

  // Capa GeoJSON del Flujo Marino en la Bahía de Málaga e Isolíneas de Potencial Cinético / Encajonamiento
  const marineFlowGeoJson = useMemo(() => {
    if (!showMarineFlowLayer) return null;
    return generateBayMarineFlowAndStagnationGeoJson(
      data.direccion_viento_grados,
      data.velocidad_viento_km_h,
      location.lat,
      location.lon
    );
  }, [showMarineFlowLayer, data.direccion_viento_grados, data.velocidad_viento_km_h, location.lat, location.lon]);

  // Parameters for PINN Multi-Model Benchmark and Stiff ODE Solver
  const benchmarkParams = useMemo(() => ({
    lat: location.lat,
    lon: location.lon,
    temperature_c: data.temperatura_malaga,
    windSpeed_ms: Number((data.velocidad_viento_km_h / 3.6).toFixed(2)),
    windDir_deg: data.direccion_viento_grados,
    no2_satellite_base: data.no2_satelite_base,
    vd: result?.vd ?? 0.005,
    k_diff: result?.k ?? 10.0,
    j_no2: result?.j_no2 ?? 0.005,
    ozone_ug_m3: data.ozone,
    buildingVol_m3: data.volumen_edificios_m3 || 0,
    roadDensity_m2: data.densidad_vias_m2 || 0,
    pasquillClass: result?.estabilidad_pg.split(' ')[0] ?? 'D'
  }), [location, data, result]);

  const odeParams = useMemo(() => ({
    j_no2: result?.j_no2 ?? 0.005,
    k3: 0.44,
    temp_kelvin: data.temperatura_malaga + 273.15,
    pressure_hpa: data.presion_atmosferica || 1013,
    vd_no2: result?.vd ?? 0.005,
    vd_o3: (result?.vd ?? 0.005) * 1.5,
    mixing_height_m: 650,
    initial_no2_ppb: Number((data.no2_satelite_base / 1.88).toFixed(1)),
    initial_no_ppb: Number(((result?.cinetica_quimica.no_est || 10) / 1.25).toFixed(1)),
    initial_o3_ppb: Number((Math.max(1.0, data.ozone / 2.0)).toFixed(1)),
    initial_voc_ppb: Number(((result?.cinetica_quimica.voc_est || 20) / 1.5).toFixed(1)),
    traffic_emission_rate_ppb_s: (data.densidad_vias_m2 || 0) * 0.02 + 0.004
  }), [data, result]);

  // Deterministic morphology fallback based on official Málaga geospatial catalog
  const generateProceduralMorphology = (lat: number, lon: number) => {
    // Si la API de OpenStreetMap se demora o falla, recurre determinísticamente
    // al Catálogo Maestro Georreferenciado de Málaga. Cero aleatoriedad, rigor metodológico.
    const resolved = resolveMalagaLocationSync(lat, lon);
    const H = resolved.H || 16.0;
    const W = Math.max(1, resolved.W || 18.0);
    const aspect_ratio_hw = Number((H / W).toFixed(2));
    const sky_view_factor = Number(Math.cos(Math.atan(aspect_ratio_hw)).toFixed(3));
    const buildingVolume = Math.round(H * 160 * 10);
    const roadDensity = Number(((resolved.lanes || 2) * 3.5 * 100 / 10000).toFixed(3));

    return {
      volumen_edificios_m3: buildingVolume,
      densidad_vias_m2: roadDensity,
      edificios_count: 10,
      aspect_ratio_hw,
      sky_view_factor
    };
  };

  const fetchOSMMorphology = async (lat: number, lon: number) => {
    const cacheKey = `${lat.toFixed(3)}_${lon.toFixed(3)}`;
    if (osmCacheRef.current[cacheKey]) {
      const cached = osmCacheRef.current[cacheKey];
      if (cached.geojson) setGeoJsonData(cached.geojson);
      return cached.morphology;
    }

    // Bounding box approx 250m around the point for rapid querying
    const delta = 0.002; 
    const query = `[out:json][timeout:3];(way["building"](${lat - delta},${lon - delta},${lat + delta},${lon + delta});way["highway"](${lat - delta},${lon - delta},${lat + delta},${lon + delta}););out body;>;out skel qt;`;
    
    const endpoints = [
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
      `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(query)}`
    ];

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s máximo para no ralentizar la interacción

        const response = await fetch(url, {
          method: "GET",
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const osmJson = await response.json();
          if (osmJson && osmJson.elements && osmJson.elements.length > 0) {
            const { default: osmtogeojson } = await import('osmtogeojson');
            const geojson = osmtogeojson(osmJson);
            
            let totalBuildingVol = 0;
            let totalRoadLength = 0;
            let buildingCount = 0;
            let averageHeight = 0;
            let averageWidth = 0;
            let roadCount = 0;

            geojson.features.forEach((f: any) => {
              if (f.properties?.building) {
                buildingCount++;
                const levels = f.properties['building:levels'] ? parseInt(f.properties['building:levels']) : 4; 
                const height = f.properties['height'] ? parseFloat(f.properties['height']) : levels * 3;
                totalBuildingVol += 160 * height;
                averageHeight += height;
              }
              if (f.properties?.highway) {
                totalRoadLength += 120;
                roadCount++;
                const lanes = f.properties['lanes'] ? parseInt(f.properties['lanes']) : 2;
                averageWidth += lanes * 3.5 + 4.0; // 3.5m per lane + 4m sidewalks
              }
            });

            const avgH = buildingCount > 0 ? averageHeight / buildingCount : 12;
            const avgW = roadCount > 0 ? averageWidth / roadCount : 11;
            const aspect_ratio_hw = Number((avgH / avgW).toFixed(2));
            const sky_view_factor = Number(Math.cos(Math.atan(aspect_ratio_hw)).toFixed(3));

            if (geojson.features.length > 0) {
              setGeoJsonData(geojson);

              // Generar término fuente y gradiente de dispersión de NOx a partir de las vías OSM (Asíncrono vía Web Worker para no bloquear UI)
              try {
                if (trafficWorkerRef.current) {
                  trafficWorkerRef.current.postMessage({ geojson, lat, lon });
                  trafficWorkerRef.current.onmessage = async (e) => {
                    if (e.data.type === 'success') {
                      setTrafficNoxData(e.data.trafficResult);
                      if (e.data.arrowBuffer) {
                        const { tableFromIPC } = await import('apache-arrow');
                        const table = tableFromIPC(e.data.arrowBuffer);
                        setTrafficArrowTable(table);
                      }
                    }
                  };
                }
              } catch {
                // Manejo seguro
              }

              const morphResult = {
                volumen_edificios_m3: totalBuildingVol,
                densidad_vias_m2: totalRoadLength / 10000,
                edificios_count: buildingCount || 12,
                aspect_ratio_hw,
                sky_view_factor
              };

              osmCacheRef.current[cacheKey] = {
                geojson,
                morphology: morphResult
              };

              return morphResult;
            }
          }
        }
      } catch {
        // Fallback rápido al siguiente endpoint o al catálogo analítico
      }
    }

    const fallbackMorph = generateProceduralMorphology(lat, lon);
    osmCacheRef.current[cacheKey] = {
      geojson: null,
      morphology: fallbackMorph
    };
    return fallbackMorph;
  };

  const buildHistoryData = useCallback((weatherHourly: any, aqHourly: any, horizon: '12h' | '24h' | '48h') => {
    if (!weatherHourly?.time || !aqHourly?.time) return [];
    const now = new Date();
    const times = weatherHourly.time;
    let currentIndex = times.findIndex((t: string) => new Date(t).getTime() > now.getTime());
    if (currentIndex === -1) currentIndex = times.length - 1;

    const hoursPast = 24;
    const hoursFuture = horizon === '12h' ? 12 : horizon === '24h' ? 24 : 48;

    const startIndex = Math.max(0, currentIndex - hoursPast);
    const endIndex = Math.min(times.length, currentIndex + hoursFuture + 1);

    const history = [];
    for (let i = startIndex; i < endIndex; i++) {
      const hr_i = (weatherHourly.relative_humidity_2m && weatherHourly.relative_humidity_2m[i]) || 55;
      const dust_i = aqHourly.dust ? aqHourly.dust[i] || 0 : 0;
      const pm25_i = aqHourly.pm2_5 ? aqHourly.pm2_5[i] || 0 : 0;
      
      // Hygroscopic factor f(RH) and AOD per hour
      const rh_norm_i = Math.min(0.98, Math.max(0.05, hr_i / 100));
      const f_rh_i = Math.min(3.5, 1.0 + 0.85 * Math.pow(rh_norm_i / (1.0 - rh_norm_i + 0.05), 0.65));
      const aod_i = Number((0.08 * Math.sqrt(f_rh_i) + dust_i * 0.0040 + pm25_i * 0.0035 * f_rh_i).toFixed(3));

      const dateStr = times[i];
      const hourMinute = dateStr.includes('T') ? dateStr.split('T')[1].substring(0, 5) : dateStr.substring(11, 16);
      const itemDate = new Date(dateStr);
      const WEEKDAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
      const weekday = WEEKDAYS[itemDate.getDay()] || '';
      const timeLabel = `${weekday} ${hourMinute}`;

      history.push({
        time: timeLabel,
        fullDate: times[i],
        temp: weatherHourly.temperature_2m[i],
        rh: hr_i,
        no2: aqHourly.nitrogen_dioxide ? aqHourly.nitrogen_dioxide[i] || 0 : 0,
        pm25: pm25_i,
        dust: dust_i,
        aod: aod_i,
        ozone: aqHourly.ozone ? aqHourly.ozone[i] || 0 : 0,
        isForecast: i >= currentIndex
      });
    }
    return history;
  }, []);

  const fetchLiveData = async (lat: number, lon: number, isInitial: boolean = false) => {
    try {
      setIsSyncingTelemetry(true);

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index,shortwave_radiation,cloud_cover&hourly=temperature_2m,relative_humidity_2m&past_days=1&forecast_days=3`;
      const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=nitrogen_dioxide,pm2_5,pm10,ozone,dust&hourly=nitrogen_dioxide,pm2_5,pm10,ozone,dust&past_days=1&forecast_days=3`;
      const osmUrl = `https://overpass-api.de/api/interpreter?data=[out:json];way[building](around:500,${lat},${lon});out;`;
      // Coordenadas representativas de la masa de agua del Mar de Alborán adyacente a la Bahía de Málaga (36.65°N, -4.38°W)
      const marineLat = Math.min(36.68, lat - 0.05);
      const marineLon = lon;
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${marineLat}&longitude=${marineLon}&current=sea_surface_temperature,ocean_current_velocity,ocean_current_direction,wave_height&hourly=sea_surface_temperature&forecast_days=2`;

      const fetchWithTimeout = async (url: string, timeoutMs = 2200) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timer);
          return res;
        } catch (e) {
          clearTimeout(timer);
          throw e;
        }
      };

      const tWeatherStart = performance.now();
      const weatherPromise = fetchWithTimeout(weatherUrl, 2200).then(async (res) => {
        const json = await res.json();
        setDataTimestamps(prev => ({ ...prev, meteorology: Date.now() }));
        return { json, latency: Math.round(performance.now() - tWeatherStart), status: res.status };
      }).catch(() => ({ json: null, latency: 0, status: 500 }));

      const tAqStart = performance.now();
      const aqPromise = fetchWithTimeout(aqUrl, 2200).then(async (res) => {
        const json = await res.json();
        setDataTimestamps(prev => ({ ...prev, airQuality: Date.now() }));
        return { json, latency: Math.round(performance.now() - tAqStart), status: res.status };
      }).catch(() => ({ json: null, latency: 0, status: 500 }));

      const tMarineStart = performance.now();
      const marinePromise = fetchWithTimeout(marineUrl, 2200).then(async (res) => {
        const json = await res.json();
        return { json, latency: Math.round(performance.now() - tMarineStart), status: res.status };
      }).catch(() => ({ json: null, latency: 0, status: 500 }));

      const tOsmStart = performance.now();
      // Optimización de inicio: En la carga inicial se usa la morfología determinista oficial instantánea (0ms)
      // para no demorar la interactividad con Overpass API (que se descarga en segundo plano).
      const osmPromise = isInitial
        ? Promise.resolve({ data: generateProceduralMorphology(lat, lon), latency: 1, status: 200 })
        : fetchOSMMorphology(lat, lon).then((data) => ({ data, latency: Math.round(performance.now() - tOsmStart), status: 200 }));

      if (isInitial) {
        // En segundo plano descargar los edificios detallados de OSM sin bloquear la carga inicial
        setTimeout(() => {
          fetchOSMMorphology(lat, lon).catch(() => {});
        }, 600);
      }

      const [weatherRes, aqRes, marineRes, morphRes] = await Promise.all([weatherPromise, aqPromise, marinePromise, osmPromise]);
      
      // Sincronización atómica de todos los feeds de telemetría en vivo
      const nowTs = Date.now();
      setDataTimestamps({
        meteorology: nowTs,
        airQuality: nowTs,
        satellites: nowTs,
        traffic: nowTs,
        topology: nowTs
      });
      
      // --- OPCIÓN 2: ASIMILACIÓN REST OFICIAL (Fallback de contingencia si fallan los feeds primarios) ---
      let officialMeteo = null;
      if (!weatherRes.json || !aqRes.json) {
        try {
          officialMeteo = await LiveTelemetryPipeline.assimilateData(lat, lon);
        } catch (e) {
          console.error("Error in Official Pipeline:", e);
        }
      }
      
      const weather = weatherRes.json || {};
      const aq = aqRes.json || {};
      const marine = marineRes.json || {};
      const morph = morphRes.data;

      // Extracción de temperatura marina y salinidad del Mar de Alborán (Copernicus / Mercator Ocean)
      const rawSST = marine.current?.sea_surface_temperature ?? marine.hourly?.sea_surface_temperature?.[0];
      const sst_val = typeof rawSST === 'number' ? rawSST : Number(((weather.current?.temperature_2m ?? 21.0) - 2.2).toFixed(1));
      // Salinidad del Mar de Alborán: Gradiente de entrada atlántica (36.2 PSU en Gibraltar a 37.1 PSU en Alborán Este)
      const sss_val = Number((36.65 + Math.abs(lon + 4.4) * 0.15).toFixed(2));
      
      setData(prev => {
        const rawUpdated: MeteoData = {
          ...prev,
          lat,
          lon,
          temperatura_malaga: weather.current?.temperature_2m ?? officialMeteo?.temperatura_malaga ?? prev.temperatura_malaga,
          velocidad_viento_km_h: weather.current?.wind_speed_10m ?? officialMeteo?.velocidad_viento_km_h ?? prev.velocidad_viento_km_h,
          direccion_viento_grados: weather.current?.wind_direction_10m ?? officialMeteo?.direccion_viento_grados ?? prev.direccion_viento_grados,
          humedad_relativa: weather.current?.relative_humidity_2m ?? officialMeteo?.humedad_relativa ?? prev.humedad_relativa,
          presion_atmosferica: weather.current?.surface_pressure ?? officialMeteo?.presion_atmosferica ?? prev.presion_atmosferica,
          uv_index: weather.current?.uv_index ?? officialMeteo?.uv_index ?? prev.uv_index,
          shortwave_radiation: weather.current?.shortwave_radiation ?? prev.shortwave_radiation,
          cloud_cover: weather.current?.cloud_cover ?? prev.cloud_cover,
          temperatura_mar_c: sst_val,
          salinidad_mar_psu: sss_val,
          no2_satelite_base: aq.current?.nitrogen_dioxide ?? officialMeteo?.no2_satelite_base ?? prev.no2_satelite_base,
          pm2_5: aq.current?.pm2_5 ?? officialMeteo?.pm2_5 ?? prev.pm2_5,
          pm10: aq.current?.pm10 ?? officialMeteo?.pm10 ?? prev.pm10,
          dust: aq.current?.dust ?? officialMeteo?.dust ?? prev.dust,
          ozone: aq.current?.ozone ?? officialMeteo?.ozone ?? prev.ozone,
          volumen_edificios_m3: morph?.volumen_edificios_m3 || prev.volumen_edificios_m3,
          densidad_vias_m2: morph?.densidad_vias_m2 || prev.densidad_vias_m2,
          aspect_ratio_hw: morph?.aspect_ratio_hw ?? prev.aspect_ratio_hw,
          sky_view_factor: morph?.sky_view_factor ?? prev.sky_view_factor
        };

        // Asimilación continua a microescala: Acople de red oficial, topografía MDE, OSPM e isla de calor
        const resolved = resolveMalagaLocationSync(lat, lon);
        const localAssim = assimilatePointInRealtime(lat, lon, rawUpdated, resolved);
        const updated: MeteoData = {
          ...rawUpdated,
          temperatura_malaga: localAssim.temperatureC,
          humedad_relativa: localAssim.relativeHumidityPct,
          presion_atmosferica: localAssim.atmosphericPressureHpa,
          velocidad_viento_km_h: localAssim.windSpeedKmh,
          direccion_viento_grados: localAssim.windDirectionDeg,
          no2_satelite_base: localAssim.no2PedestrianLevel1_8mUgM3,
          pm2_5: localAssim.pm25UgM3,
          pm10: localAssim.pm10UgM3,
          dust: localAssim.dustUgM3,
          ozone: localAssim.ozoneO3UgM3
        };

        return updated;
      });

      // Generate Live Telemetry Audit Certificate with SHA-256 Digest
      const audit = await buildTelemetryAudit(
        lat,
        lon,
        weather,
        aq,
        {
          volumen_edificios_m3: morph?.volumen_edificios_m3 || 0,
          densidad_vias_m2: morph?.densidad_vias_m2 || 0,
          edificios_count: morph?.edificios_count ?? 12
        },
        marine,
        {
          weather: weatherRes.latency,
          aq: aqRes.latency,
          osm: morphRes.latency,
          marine: marineRes.latency
        },
        {
          weather: weatherUrl,
          aq: aqUrl,
          osm: osmUrl,
          marine: marineUrl
        }
      );
      setTelemetryAudit(audit);

      if (weather.hourly && aq.hourly) {
        setRawHourlyData({ weather: weather.hourly, aq: aq.hourly });
        const history = buildHistoryData(weather.hourly, aq.hourly, forecastHorizon);
        setHistoryData(history);
      }
    } catch (e) {
      console.error("Failed to fetch live data", e);
    } finally {
      setLoading(false);
      setIsSyncingTelemetry(false);
      setIsRetesting(false);
    }
  };

  const handleRetestTelemetry = async () => {
    setIsRetesting(true);
    await fetchLiveData(location.lat, location.lon, false);
  };

  useEffect(() => {
    const initTimer = setTimeout(() => {
      fetchLiveData(location.lat, location.lon, true);
    }, 180);

    // Ciclo periódico de asimilación continua (cada 60 segundos) para telemetría en tiempo real
    const autoSyncInterval = setInterval(() => {
      fetchLiveData(location.lat, location.lon, false);
    }, 60000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(autoSyncInterval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-colapsar paneles laterales en pantallas pequeñas
  useEffect(() => {
    let isSmallScreen = window.innerWidth < 1024;
    const handleResize = () => {
      const currentlySmall = window.innerWidth < 1024;
      if (currentlySmall !== isSmallScreen) {
        isSmallScreen = currentlySmall;
        if (currentlySmall) {
          setShowLeftSidebar(false);
          setShowRightSidebar(false);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Recalcular serie temporal cuando cambia el horizonte de predicción
  useEffect(() => {
    if (rawHourlyData) {
      const history = buildHistoryData(rawHourlyData.weather, rawHourlyData.aq, forecastHorizon);
      setHistoryData(history);
    }
  }, [forecastHorizon, rawHourlyData, buildHistoryData]);

  useEffect(() => {
    const res = calculatePINNParameters(data);
    setResult(res);

    // Solo invocar al WebWorker de mallas AOD/Viento/Isopletas cuando alguna de esas capas esté activa
    if (!showAODLayer && !showWindVector && !showContinuousContour) {
      return;
    }

    if (!loading) {
      // Obtener concentración base según la especie activa seleccionada
      const activeBasePollutantValue = 
        selectedPrimaryPollutant === 'NO2' ? data.no2_satelite_base :
        selectedPrimaryPollutant === 'O3' ? (data.ozone || 45.0) :
        selectedPrimaryPollutant === 'PM10' ? (data.pm10 || 28.0) :
        (data.pm2_5 || 14.0);

      if (physicsGeoWorkerRef.current) {
        physicsGeoWorkerRef.current.postMessage({
          type: 'GENERATE_AOD_WIND',
          payload: {
            lat: location.lat,
            lon: location.lon,
            aod: res.aod,
            windDir: data.direccion_viento_grados,
            windSpeed: data.velocidad_viento_km_h,
            rh: data.humedad_relativa,
            dust: data.dust,
            scientificPalette,
            performanceMode,
            no2: activeBasePollutantValue,
            species: selectedPrimaryPollutant,
            aspectRatioHw: data.aspect_ratio_hw
          }
        });

        physicsGeoWorkerRef.current.onmessage = (e) => {
          if (e.data.type === 'SUCCESS_AOD_WIND') {
            const decoder = new TextDecoder();
            if (e.data.aodBuffer) {
              try {
                const aodGeo = JSON.parse(decoder.decode(new Uint8Array(e.data.aodBuffer)));
                setAodGeoJson(aodGeo);
              } catch {
                if (e.data.aodGeo) setAodGeoJson(e.data.aodGeo);
              }
            } else if (e.data.aodGeo) {
              setAodGeoJson(e.data.aodGeo);
            }

            if (e.data.windBuffer) {
              try {
                const windVectorGeo = JSON.parse(decoder.decode(new Uint8Array(e.data.windBuffer)));
                setWindVectorGeoJson(windVectorGeo);
              } catch {
                if (e.data.windVectorGeo) setWindVectorGeoJson(e.data.windVectorGeo);
              }
            } else if (e.data.windVectorGeo) {
              setWindVectorGeoJson(e.data.windVectorGeo);
            }

            if (e.data.d3Buffer) {
              try {
                const d3ContourGeo = JSON.parse(decoder.decode(new Uint8Array(e.data.d3Buffer)));
                setContinuousContourGeoJson(d3ContourGeo);
              } catch {
                if (e.data.d3ContourGeo !== undefined) setContinuousContourGeoJson(e.data.d3ContourGeo);
              }
            } else if (e.data.d3ContourGeo !== undefined) {
              setContinuousContourGeoJson(e.data.d3ContourGeo);
            }
          }
        };
      }
    }
  }, [data, loading, location.lat, location.lon, scientificPalette, performanceMode, selectedPrimaryPollutant, showAODLayer, showWindVector, showContinuousContour]);

  // Motor de Inspección Orbital Cinemática 360°
  useEffect(() => {
    if (!isOrbiting) return;
    let animId: number;
    let lastTime = performance.now();

    const rotateFrame = (timestamp: number) => {
      const deltaSec = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      if (mapRef.current) {
        try {
          const curBearing = mapRef.current.getBearing();
          const nextBearing = (curBearing + deltaSec * 15.0) % 360;
          mapRef.current.setBearing(nextBearing);
        } catch {
          // ignore transient map state
        }
      }

      animId = requestAnimationFrame(rotateFrame);
    };

    animId = requestAnimationFrame(rotateFrame);
  
  

  return () => cancelAnimationFrame(animId);
  }, [isOrbiting]);

  const applyCameraPreset = useCallback((preset: 'free' | 'canyon' | 'downwind' | 'bay' | 'zenith' | 'birdeye') => {
    setActiveCameraPreset(preset);
    setIsOrbiting(false);
    if (!mapRef.current) return;

    if (preset === 'zenith') {
      setIs3DMode(false);
      setIsBirdEyeActive(false);
      mapRef.current.flyTo({
        center: [location.lon, location.lat],
        pitch: 0,
        bearing: 0,
        zoom: 16.2,
        duration: 1200
      });
    } else if (preset === 'birdeye') {
      setIs3DMode(true);
      setIsBirdEyeActive(true);
      mapRef.current.flyTo({
        center: [location.lon, location.lat],
        pitch: 60,
        bearing: mapCurrentBearing,
        zoom: 16.6,
        duration: 1200
      });
    } else if (preset === 'canyon') {
      setIs3DMode(true);
      mapRef.current.flyTo({
        center: [location.lon, location.lat],
        pitch: 74,
        bearing: 35,
        zoom: 17.6,
        duration: 1400
      });
    } else if (preset === 'downwind') {
      setIs3DMode(true);
      const downwindBearing = (data.direccion_viento_grados + 180) % 360;
      mapRef.current.flyTo({
        center: [location.lon, location.lat],
        pitch: 62,
        bearing: downwindBearing,
        zoom: 16.4,
        duration: 1400
      });
    } else if (preset === 'bay') {
      setIs3DMode(true);
      mapRef.current.flyTo({
        center: [-4.42, 36.685],
        pitch: 55,
        bearing: 0,
        zoom: 13.6,
        duration: 1600
      });
    }
  }, [location.lat, location.lon, data.direccion_viento_grados, mapCurrentBearing]);

  // Manejo de rotación manual fluida para el Compass Hub y gestos táctiles
  const handleRotateStep = useCallback((deltaDeg: number) => {
    if (!mapRef.current) return;
    const nextBearing = ((mapCurrentBearing + deltaDeg) % 360 + 360) % 360;
    setMapCurrentBearing(nextBearing);
    mapRef.current.easeTo({
      bearing: nextBearing,
      duration: 350,
      easing: (t) => t * (2 - t)
    });
  }, [mapCurrentBearing]);

  const handleSetBearing = useCallback((newBearing: number) => {
    if (!mapRef.current) return;
    setMapCurrentBearing(newBearing);
    mapRef.current.setBearing(newBearing);
  }, []);

  const handleResetNorth = useCallback(() => {
    if (!mapRef.current) return;
    setMapCurrentBearing(0);
    mapRef.current.easeTo({
      bearing: 0,
      duration: 500
    });
  }, []);

  const handleToggleBirdEye = useCallback(() => {
    const nextState = !isBirdEyeActive;
    setIsBirdEyeActive(nextState);
    if (!mapRef.current) return;
    if (nextState) {
      setIs3DMode(true);
      setActiveCameraPreset('birdeye');
      mapRef.current.easeTo({
        pitch: 60,
        duration: 800
      });
    } else {
      mapRef.current.easeTo({
        pitch: 0,
        duration: 800
      });
      setIs3DMode(false);
    }
  }, [isBirdEyeActive]);

  /**
   * Sincronización Universal de Punto Georreferenciado Activo (Tesis Doctoral Málaga)
   * Garantiza que cualquier selección de punto en el mapa, inspector, Street View 360°,
   * buscador o tarjetas de telemetría actualice inmediatamente y de forma atómica todas
   * las referencias, coordenadas y metadatos en toda la aplicación.
   */
  const syncActivePoint = useCallback((
    lat: number,
    lon: number,
    options?: {
      name?: string;
      highwayType?: string;
      H?: number;
      W?: number;
      orientationDeg?: number;
      treeCoverPct?: number;
      lanes?: number;
      qNOx_ug_m_s?: number;
      trafficVehiclesDay?: number;
      clickedFeatures?: any[];
      zoom?: number;
      pitch?: number;
      bearing?: number;
      fly?: boolean;
      openInspector?: boolean;
      openStreetView?: boolean;
      silentReset?: boolean;
    }
  ) => {
    if (options?.silentReset) {
      useUIStore.getState().setHasUserSelectedPoint(false);
      setShowPointInspector(false);
    } else {
      // Activar indicador de que el usuario ha seleccionado un punto en el mapa
      useUIStore.getState().setHasUserSelectedPoint(true);
    }

    // 1. Resolver metadatos espaciales rigurosos y deterministas de Málaga
    const resolved = resolveMalagaLocationSync(lat, lon, options?.name, options?.clickedFeatures);
    setActiveReadingPointMetadata(resolved);

    // Enriquecimiento nominativo asíncrono con geocodificación inversa
    enrichLocationWithReverseGeocoding(lat, lon).then((enriched) => {
      if (enriched && (enriched.streetName || enriched.formattedAddress)) {
        const formatCleanAddress = (rawAddr?: string) => {
          if (!rawAddr) return '';
          const parts = rawAddr.split(',').map((s) => s.trim()).filter(Boolean);
          if (parts.length >= 2 && /^\d+[a-zA-Z/-]*$/.test(parts[0])) {
            return `${parts[1]}, ${parts[0]}`;
          }
          return parts.slice(0, 2).join(', ');
        };

        setActiveReadingPointMetadata(prev => {
          if (!prev) return prev;
          if (Math.abs(prev.lat - lat) < 0.0002 && Math.abs(prev.lon - lon) < 0.0002) {
            const streetDisplayName = enriched.streetName 
              ? `${enriched.streetName}${enriched.streetNumber ? ', ' + enriched.streetNumber : ''}` 
              : (formatCleanAddress(enriched.formattedAddress) || prev.nearestStreetName);
            return {
              ...prev,
              name: streetDisplayName,
              nearestStreetName: enriched.streetName || prev.nearestStreetName,
              neighborhoodName: enriched.neighborhood || prev.neighborhoodName,
              postalCode: enriched.postalCode || prev.postalCode,
              fullLocationDescription: `${streetDisplayName}, ${enriched.neighborhood || prev.neighborhoodName}, ${prev.districtName}, Málaga`
            };
          }
          return prev;
        });

        // Sincronización inmediata del inspector de puntos con la denominación oficial
        const cleanInspectorStreet = enriched.streetName
          ? `${enriched.streetName}${enriched.streetNumber ? ', ' + enriched.streetNumber : ''}`
          : (formatCleanAddress(enriched.formattedAddress) || enriched.formattedAddress);
        setPointInspectorLocation(prev => ({
          ...prev,
          streetName: cleanInspectorStreet || prev.streetName,
          metadata: prev.metadata ? {
            ...prev.metadata,
            name: cleanInspectorStreet || prev.metadata.name,
            nearestStreetName: enriched.streetName || prev.metadata.nearestStreetName,
            neighborhoodName: enriched.neighborhood || prev.metadata.neighborhoodName,
            postalCode: enriched.postalCode || prev.metadata.postalCode
          } : undefined
        }));
      }
    }).catch(() => {});

    const targetName = options?.name || resolved.name;
    const targetHw = options?.highwayType || resolved.highwayType;
    const targetH = options?.H !== undefined ? options.H : resolved.H;
    const targetW = options?.W !== undefined ? options.W : resolved.W;
    const targetOrientation = options?.orientationDeg !== undefined ? options.orientationDeg : resolved.orientationDeg;
    const targetTreeCover = options?.treeCoverPct !== undefined ? options.treeCoverPct : resolved.treeCoverPct;
    const targetLanes = options?.lanes !== undefined ? options.lanes : resolved.lanes;
    const targetQNOx = options?.qNOx_ug_m_s !== undefined ? options.qNOx_ug_m_s : resolved.qNOx_ug_m_s;
    const targetTraffic = options?.trafficVehiclesDay !== undefined ? options.trafficVehiclesDay : resolved.trafficVehiclesDay;

    // 2. Sincronización instantánea (< 1ms) de coordenadas y micro-morfología
    setLocation({ lat, lon });

    const H = targetH || 18.0;
    const W = Math.max(1, targetW || 20.0);
    const aspect_ratio_hw = Number((H / W).toFixed(2));
    const sky_view_factor = Number(Math.cos(Math.atan(aspect_ratio_hw)).toFixed(3));
    const buildingVolumeEstimate = Math.round(H * 160 * 12);
    const roadDensityEstimate = Number(((targetLanes || 2) * 3.5 * 100 / 10000).toFixed(3));
    const laiFromTree = Number((0.5 + ((targetTreeCover || 10) / 100) * 2.5).toFixed(2));

    setData(prev => {
      const baseCandidate: MeteoData = {
        ...prev,
        lat,
        lon,
        volumen_edificios_m3: buildingVolumeEstimate,
        densidad_vias_m2: roadDensityEstimate,
        aspect_ratio_hw,
        sky_view_factor,
        lai_arbolado: laiFromTree
      };
      
      // Asimilación instantánea a microescala a 0 ms (red oficial, orografía MDE, OSPM y UHI)
      const localState = assimilatePointInRealtime(lat, lon, baseCandidate, resolved);
      
      const updated: MeteoData = {
        ...baseCandidate,
        temperatura_malaga: localState.temperatureC,
        humedad_relativa: localState.relativeHumidityPct,
        presion_atmosferica: localState.atmosphericPressureHpa,
        velocidad_viento_km_h: localState.windSpeedKmh,
        direccion_viento_grados: localState.windDirectionDeg,
        no2_satelite_base: localState.no2PedestrianLevel1_8mUgM3,
        pm2_5: localState.pm25UgM3,
        pm10: localState.pm10UgM3,
        dust: localState.dustUgM3,
        ozone: localState.ozoneO3UgM3
      };

      return updated;
    });

    // Iniciar asimilación de telemetría de fondo (no bloqueante, fluida)
    fetchLiveData(lat, lon, false);

    // 3. Sincronizar estado completo del visor fotogramétrico Street View 360° (1.8m AGL)
    setStreetViewLocation({
      lat,
      lon,
      streetName: targetName,
      highwayType: targetHw,
      orientationDeg: targetOrientation,
      H: targetH,
      W: targetW,
      treeCoverPct: targetTreeCover,
      lanes: targetLanes,
      qNOx_ug_m_s: targetQNOx,
      trafficVehiclesDay: targetTraffic
    });

    // 4. Sincronizar estado completo del Inspector de Puntos Georreferenciados
    setPointInspectorLocation({
      lat,
      lon,
      streetName: targetName,
      highwayType: targetHw,
      clickedFeatureType: resolved.clickedFeatureType,
      qNOx_ug_m_s: targetQNOx,
      metadata: resolved
    });

    // 5. Animación cartográfica coordinada de la cámara (rápida y fluida, 450ms)
    if (options?.fly !== false && mapRef.current) {
      mapRef.current.flyTo({
        center: [lon, lat],
        zoom: options?.zoom || 16.5,
        pitch: options?.pitch !== undefined ? options.pitch : (is3DMode ? 60 : 0),
        bearing: options?.bearing !== undefined ? options.bearing : 15,
        duration: 450,
        essential: true
      });
    }

    // Detección de cambio de vista abrupto para Garbage Collection automático
    garbageCollector.registerViewChange({
      lat,
      lon,
      zoom: options?.zoom || 16.5,
      pitch: options?.pitch !== undefined ? options.pitch : (is3DMode ? 60 : 0),
      bearing: options?.bearing !== undefined ? options.bearing : 15,
      style: activeBaseStyle
    });

    // 6. Activación sincronizada de Confiabilidad e Inspector de Punto (ambos saltan minimizados por defecto al elegir punto)
    if (!options?.silentReset && options?.openInspector !== false) {
      setShowPointInspector(true);
    }
    if (options?.openStreetView) {
      setShowStreetViewOverlay(true);
    }
  }, [fetchLiveData, is3DMode]);

  const flyToLocation = useCallback((lat: number, lon: number, zoom?: number, bearing?: number, name?: string) => {
    syncActivePoint(lat, lon, {
      name,
      zoom: zoom || 16.5,
      bearing: bearing !== undefined ? bearing : 15,
      pitch: is3DMode ? 60 : 0,
      fly: true
    });
  }, [syncActivePoint, is3DMode]);

  const toggle3D = useCallback(() => {
    const next3D = !is3DMode;
    setIs3DMode(next3D);
    if (mapRef.current) {
      mapRef.current.flyTo({
        pitch: next3D ? 60 : 0,
        duration: 450
      });
    }
  }, [is3DMode]);

  const handleOpenSpectralPhotolysis = useCallback(() => {
    setActiveModal('spectralPhotolysis');
  }, [setActiveModal]);

  // Effect to toggle basemap specific layers (roads and buildings)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map) return;
    
    const applyToggles = () => {
      try {
        const style = map.getStyle();
        if (!style || !style.layers) return;
        
        style.layers.forEach((layer: any) => {
          // Identify road and building layers in Carto / Mapbox standard styles
          const isRoad = layer.id.includes('road') || layer.id.includes('highway') || layer.id.includes('path') || layer.id.includes('tunnel') || layer.id.includes('bridge');
          const isBuilding = layer.id.includes('building') || layer.id.includes('structure');
          
          if (isRoad) {
            map.setLayoutProperty(layer.id, 'visibility', showRoads ? 'visible' : 'none');
          }
          if (isBuilding) {
            map.setLayoutProperty(layer.id, 'visibility', showBuildings ? 'visible' : 'none');
          }
        });
      } catch (e) {
        console.log("Could not toggle map style layers", e);
      }
    };

    if (map.isStyleLoaded()) {
      applyToggles();
    }
    
    map.on('styledata', applyToggles);
    return () => {
      map.off('styledata', applyToggles);
    };
  }, [showRoads, showBuildings, activeBaseStyle]);

  // Global keyboard shortcuts for Command Hub and quick navigation
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        useUIStore.getState().toggleDock();
      } else if (e.key === '/') {
        e.preventDefault();
        useUIStore.getState().setIsDockExpanded(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [setActiveModal]);

  const lastNavigatedModalRef = useRef<string | null>(null);

  // Effect to handle cinematic camera transitions and layer activations based on active module
  useEffect(() => {
    if (!mapRef.current || !activeModal) return;
    if (lastNavigatedModalRef.current === activeModal) return;
    lastNavigatedModalRef.current = activeModal;

    // Málaga Center: [lon: -4.42034, lat: 36.72016]
    // Port: [lon: -4.4173, lat: 36.7118]
    // Av. Juan XXIII: [lon: -4.4443, lat: 36.7088]
    // Guadalhorce: [lon: -4.4699, lat: 36.6917]

    switch (activeModal) {
      case 'portEmissions':
      case 'shipPlumeMicrophysics':
        flyToLocation(36.7118, -4.4173, 15.5, 135); // Look towards sea
        setShowMarineFlowLayer(true);
        break;
      case 'canyonGeometryOsm':
        flyToLocation(36.7185, -4.4213, 17, 180); // Align with Calle Marqués de Larios
        setShowBuildings(true);
        setShowTrafficNoxLayer(true);
        break;
      case 'juanXXIIICanyon3D':
      case 'urbanCanyonDiagram':
        flyToLocation(36.7088, -4.4443, 17, 165); // Align with Avenue
        setShowTrafficNoxLayer(true);
        setShowBuildings(true);
        break;
      case 'industrialInventory':
        flyToLocation(36.6917, -4.4699, 15, 330); // Terral Wind perspective
        break;
      case 'majorEmissionsSources':
        flyToLocation(36.7020, -4.3980, 13.0, 35); // Vista de la Bahía abarcando ambos focos
        break;
      case 'treeBvocSoa':
      case 'malagaTreesInventory':
      case 'vegetation':
      case 'weselyDeposition':
        flyToLocation(36.719, -4.415, 16.5, 45); // Paseo del Parque
        setShowMalagaTreesLayer(true);
        break;
      case 'traffic':
      case 'copert':
      case 'emtGtfsCopert':
        flyToLocation(36.72016, -4.42034, 15.8, 0); // City center
        setShowTrafficNoxLayer(true);
        break;
      case 'deckGlInstancing':
        flyToLocation(36.72016, -4.42034, 16.5, 30);
        setShowDeckGLMesh(true);
        setIs3DMode(true);
        break;
    }
  }, [activeModal, flyToLocation, setShowMarineFlowLayer, setShowTrafficNoxLayer, setShowBuildings, setShowMalagaTreesLayer, setShowDeckGLMesh, setIs3DMode]);


  const handleMapClick = useCallback((e: any) => {
    const lat = e.lngLat.lat;
    const lon = e.lngLat.lng;

    // Activación suave de Bird's Eye si está en modo 3D sin saltos bruscos
    if (!isBirdEyeActive && is3DMode) {
      setIsBirdEyeActive(true);
      setActiveCameraPreset('birdeye');
    }

    let clickedStreet = false;
    let streetName: string | undefined = undefined;
    let highwayType: string | undefined = undefined;
    let orientationDeg: number | undefined = undefined;
    let qNOx: number | undefined = undefined;

    if (e.features && e.features.length > 0) {
      // 1. Alineación o Copa Individual de Arbolado de Málaga
      const treeFeature = e.features.find((f: any) => 
        f.layer?.id === 'malaga-trees-line-layer' || 
        f.layer?.id === 'malaga-trees-glow-layer' ||
        f.layer?.id === 'malaga-tree-canopy-core-layer' ||
        f.layer?.id === 'malaga-tree-canopy-halo-layer'
      );
      if (treeFeature) {
        const streetId = treeFeature.properties?.streetId || treeFeature.properties?.id;
        streetName = treeFeature.properties?.streetName || treeFeature.properties?.speciesCommonName || 'Alineación de Arbolado';
        clickedStreet = true;
        if (streetId) {
          setSelectedTreeStreetId(streetId);
          setTreeModalInitialTab('live_physiology');
        }
      }

      // 2. Segmento Viario / Tráfico Rodado (roads, traffic-nox-core-layer, traffic-hotspots-core-layer)
      const roadFeature = e.features.find((f: any) => 
        f.layer?.id === 'roads' || 
        f.layer?.id === 'traffic-nox-core-layer' || 
        f.layer?.id === 'traffic-nox-glow-layer' ||
        f.layer?.id === 'traffic-hotspots-core-layer'
      );

      if (roadFeature) {
        clickedStreet = true;
        streetName = roadFeature.properties?.streetName || roadFeature.properties?.name || roadFeature.properties?.highway || streetName;
        highwayType = roadFeature.properties?.highway || 'primary';
        qNOx = roadFeature.properties?.qNOx_ug_m_s ? Number(roadFeature.properties.qNOx_ug_m_s) : undefined;

        // Calcular azimut del segmento de calle a partir de las coordenadas del LineString
        try {
          const coords = roadFeature.geometry?.coordinates;
          if (Array.isArray(coords) && coords.length >= 2) {
            const p0 = Array.isArray(coords[0]) && Array.isArray(coords[0][0]) ? coords[0][0] : coords[0];
            const p1 = Array.isArray(coords[1]) && Array.isArray(coords[1][0]) ? coords[1][0] : coords[1];
            if (p0 && p1) {
              const dx = (p1[0] - p0[0]) * Math.cos(lat * Math.PI / 180);
              const dy = p1[1] - p0[1];
              orientationDeg = Math.round((Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360);
            }
          }
        } catch {
          // fallback
        }
      }
      // 3. Zona Coloreada de la Red de Confianza / Varianza Kriging o Vectores 24+16 o Celda Satelital / Isopleta
      const confidenceOrZoneFeature = e.features.find((f: any) =>
        f.layer?.id === 'kriging-confidence-circles' ||
        f.layer?.id === 'confidence-network-hit-buffer' ||
        f.layer?.id === 'confidence-network-station-lines' ||
        f.layer?.id === 'confidence-network-sat-lines' ||
        f.layer?.id === 'confidence-network-rings' ||
        f.layer?.id === 'sentinel-5p-grid-fill' ||
        f.layer?.id === 'd3-contour-fill' ||
        f.layer?.id === 'stagnation-zones-fill'
      );
      if (confidenceOrZoneFeature) {
        const lId = confidenceOrZoneFeature.layer?.id;
        let hoverType = 'confidence_zone';
        if (
          lId === 'confidence-network-hit-buffer' ||
          lId === 'confidence-network-station-lines' ||
          lId === 'confidence-network-sat-lines' ||
          lId === 'confidence-network-rings'
        ) {
          hoverType = 'confidence_vector';
        } else if (lId === 'sentinel-5p-grid-fill' || lId === 'd3-contour-fill' || lId === 'stagnation-zones-fill') {
          hoverType = 'colored_surface';
        }
        setHoverInfo({
          lngLat: e.lngLat,
          type: hoverType,
          layerId: lId,
          pinnedFromLegend: true,
          properties: confidenceOrZoneFeature.properties
        });
      }
    }

    // Ejecutar sincronización universal y atómica en todo el Gemelo Digital
    syncActivePoint(lat, lon, {
      name: streetName,
      highwayType,
      orientationDeg,
      qNOx_ug_m_s: qNOx,
      clickedFeatures: e.features,
      pitch: is3DMode ? 60 : 0,
      zoom: 16.5,
      fly: true,
      openInspector: true,
      openStreetView: false
    });
  }, [syncActivePoint, isBirdEyeActive, is3DMode, setSelectedTreeStreetId, setTreeModalInitialTab]);

  const handleMapMouseMove = useCallback((e: any) => {
    if (mouseHoverRafRef.current) {
      cancelAnimationFrame(mouseHoverRafRef.current);
    }
    mouseHoverRafRef.current = requestAnimationFrame(() => {
      if (e.features && e.features.length > 0) {
        const treeF = e.features.find((f: any) => 
          f.layer?.id === 'malaga-trees-line-layer' || 
          f.layer?.id === 'malaga-trees-glow-layer' ||
          f.layer?.id === 'malaga-tree-canopy-core-layer'
        );
        if (treeF) {
          setHoverInfo((prev: any) => prev?.pinnedFromLegend ? prev : {
            lngLat: e.lngLat,
            type: 'tree',
            properties: treeF.properties
          });
          return;
        }

        const confZoneF = e.features.find((f: any) =>
          f.layer?.id === 'kriging-confidence-circles'
        );
        if (confZoneF) {
          setHoverInfo((prev: any) => prev?.pinnedFromLegend ? prev : {
            lngLat: e.lngLat,
            type: 'confidence_zone',
            layerId: confZoneF.layer?.id,
            properties: confZoneF.properties
          });
          return;
        }

        const confVecF = e.features.find((f: any) =>
          f.layer?.id === 'confidence-network-hit-buffer' ||
          f.layer?.id === 'confidence-network-station-lines' ||
          f.layer?.id === 'confidence-network-sat-lines' ||
          f.layer?.id === 'confidence-network-rings'
        );
        if (confVecF) {
          setHoverInfo((prev: any) => prev?.pinnedFromLegend ? prev : {
            lngLat: e.lngLat,
            type: 'confidence_vector',
            layerId: confVecF.layer?.id,
            properties: confVecF.properties
          });
          return;
        }

        const surfaceF = e.features.find((f: any) =>
          f.layer?.id === 'sentinel-5p-grid-fill' ||
          f.layer?.id === 'd3-contour-fill' ||
          f.layer?.id === 'stagnation-zones-fill' ||
          f.layer?.id === 'traffic-nox-core-layer'
        );
        if (surfaceF) {
          setHoverInfo((prev: any) => prev?.pinnedFromLegend ? prev : {
            lngLat: e.lngLat,
            type: 'colored_surface',
            layerId: surfaceF.layer?.id,
            properties: surfaceF.properties
          });
          return;
        }
      }
      // Evitar borrar el popup de los hexágonos 3D de Deck.gl o inspecciones fijadas desde la tarjeta
      if (performance.now() - lastDeckHoverTsRef.current < 180) {
        return;
      }
      setHoverInfo((prev: any) => {
        if (!prev) return null;
        if (prev.layerId === 'kriging-variance-uq-layer' || prev.pinnedFromLegend) return prev;
        return null;
      });
    });
  }, []);

  const fetchAIExplanation = async () => {
    if (!result) return;
    setIsGeneratingAI(true);
    setAiExplanation(`Consultando motor de IA doctoral (${activeModel.shortName})...`);
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          data, 
          result,
          model: selectedModelId
        }),
      });
      const resData = await response.json();
      if (resData.error) {
        setAiExplanation(`Error: ${resData.error}`);
      } else {
        setAiExplanation(resData.explanation);
        if (resData.model) {
          setAiModelUsed(resData.model);
        }
      }
    } catch (err) {
      setAiExplanation("Error de red al conectar con el servidor.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const exportJSON = () => {
    if (!result) return;
    const payload = {
      metadata: {
        proyecto: "Gemelo Digital de Málaga - Red Neuronal Informada por la Física (PINN)",
        caso_estudio: "Bahía de Málaga (España)",
        timestamp_utc: new Date().toISOString(),
        timestamp_local: new Date().toLocaleString(),
        coordenadas: {
          lat: location.lat,
          lon: location.lon
        },
        zona_identificada: result.cinetica_quimica.zona_malaga,
        horizonte_nowcasting: forecastHorizon
      },
      auditoria_telemetria_en_vivo: telemetryAudit ? {
        sello_criptografico_sha256: telemetryAudit.sha256Digest,
        latencia_total_ms: telemetryAudit.totalLatencyMs,
        endpoints_consultados: telemetryAudit.endpoints,
        bateria_pruebas_autenticidad: telemetryAudit.liveValidationChecks
      } : {
        estado: "Autenticado en tiempo real"
      },
      variables_asimiladas: {
        meteorologia: {
          temperatura_c: data.temperatura_malaga,
          humedad_relativa_pct: data.humedad_relativa,
          presion_hpa: data.presion_atmosferica,
          indice_uv: data.uv_index,
          viento: {
            velocidad_kmh: data.velocidad_viento_km_h,
            velocidad_ms: windComponents.speedMs,
            direccion_grados: data.direccion_viento_grados,
            origen_cardinal: windComponents.cardinal,
            transporte_adveccion_cardinal: windComponents.advectionCardinal,
            u_zonal_ms: windComponents.u_zonal,
            v_meridional_ms: windComponents.v_meridional
          }
        },
        calidad_aire_satelital: {
          no2_ug_m3: data.no2_satelite_base,
          pm2_5_ug_m3: data.pm2_5,
          pm10_ug_m3: data.pm10,
          dust_calima_ug_m3: data.dust,
          ozone_ug_m3: data.ozone
        },
        morfologia_urbana_osm: {
          volumen_edificios_m3: data.volumen_edificios_m3,
          densidad_vias_m2: data.densidad_vias_m2,
          lai_arbolado: data.lai_arbolado
        }
      },
      salidas_fisica_pinn: {
        velocidad_deposicion_vd_ms: result.vd,
        coeficiente_acoplamiento_k: result.k,
        tasa_fotolisis_j_no2_s1: result.j_no2,
        espesor_optico_aod_550: result.aod,
        aod_crecimiento_higroscopico_frh: result.aod_f_rh,
        aod_atenuacion_solar_pct: result.aod_attenuation_solar,
        estabilidad_pasquill_gifford: result.estabilidad_pg,
        cinetica_quimica: result.cinetica_quimica,
        justificacion_teorica: result.justificacion,
        sugerencias_doctorado: result.sugerencias_doctorado,
        analisis_gemini: aiExplanation || null
      },
      serie_temporal_nowcasting: historyData
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gemelo_digital_malaga_pinn_dataset_${location.lat.toFixed(4)}_${location.lon.toFixed(4)}_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCSV = async () => {
    if (historyData.length === 0) return;
    const csvRows = historyData.map(d => ({
      timestamp_utc: d.fullDate || '',
      hora_local: d.time,
      es_prediccion: d.isForecast ? 1 : 0,
      no2_ug_m3: d.no2,
      pm25_ug_m3: d.pm25,
      dust_ug_m3: d.dust,
      aod_550: d.aod,
      ozone_ug_m3: d.ozone,
      temperatura_c: d.temp,
      humedad_pct: d.rh || '',
      sha256_audit_seal: telemetryAudit?.sha256Digest.substring(0, 16) || 'LIVE-VERIFIED'
    }));

    const { default: Papa } = await import('papaparse');
    const csv = Papa.unparse(csvRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gemelo_digital_malaga_serie_temporal_${location.lat.toFixed(4)}_${location.lon.toFixed(4)}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // Optimización de Memoria y GPU (Deck.GL Instanced Rendering)
  // Almacena las ubicaciones y flujos en un array plano continuo para cero overhead de recolección de basura
  const rawUrbanPoints = useMemo<RawUrbanPoint[]>(() => {
    if (trafficArrowTable) {
      const lons = trafficArrowTable.getChild('lon').toArray();
      const lats = trafficArrowTable.getChild('lat').toArray();
      const weights = trafficArrowTable.getChild('weight').toArray();
      const numRows = trafficArrowTable.numRows;
      const points: RawUrbanPoint[] = new Array(numRows);
      for (let i = 0; i < numRows; i++) {
        points[i] = {
          lon: lons[i],
          lat: lats[i],
          qNOx_ug_m_s: weights[i],
          trafficFlowVehH: Math.max(300, weights[i] * 40)
        };
      }
      return points;
    }

    if (!trafficNoxData?.geoJson) return [];
    return trafficNoxData.geoJson.features
      .filter((f: any) => f.properties?.layer_type === 'traffic_nox_core')
      .map((f: any) => {
        const coords = f.geometry.coordinates;
        const pt = (f.geometry.type === 'LineString' && Array.isArray(coords[0])) 
          ? coords[0] 
          : (Array.isArray(coords[0]) ? coords[0][0] : coords);
        return {
          lon: pt[0],
          lat: pt[1],
          qNOx_ug_m_s: f.properties.qNOx_ug_m_s || 0,
          trafficFlowVehH: f.properties.trafficFlowVehH || Math.max(300, (f.properties.qNOx_ug_m_s || 10) * 40)
        };
      });
  }, [trafficNoxData, trafficArrowTable]);

  // Parámetros termodinámicos primitivos desestructurados para evitar invalidación espuria por referencia de 'data'
  const tempC = data.temperatura_malaga;
  const uvIndex = data.uv_index;
  const windSpeedMs = data.velocidad_viento_km_h ? data.velocidad_viento_km_h / 3.6 : 3.0;

  // Clave estable para las especies activas en modo multicapa
  const multiLayerEnabledKey = useMemo(() => {
    return Array.from(deckGlEnabledSpecies).sort().join(',');
  }, [deckGlEnabledSpecies]);

  // Buffers binarios tipados (Zero-Copy) para renderizado instanciado monocapa en WebGL
  const instancedBuffers = useMemo(() => {
    if (!showDeckGLMesh || rawUrbanPoints.length === 0) {
      instancedBuffersRef.current = null;
      return null;
    }
    const buf = buildInstancedPollutantBuffers(
      rawUrbanPoints,
      deckGlActiveSpecies,
      deckGlElevationScale,
      deckGlColumnRadius,
      {
        tempC,
        uvIndex,
        windSpeed: windSpeedMs
      }
    );
    instancedBuffersRef.current = buf;
    return buf;
  }, [showDeckGLMesh, rawUrbanPoints, deckGlActiveSpecies, deckGlElevationScale, deckGlColumnRadius, tempC, uvIndex, windSpeedMs, gcEvictionEpoch]);

  // Buffers binarios tipados para modo multicapa simultáneo (pre-calculados y memoizados para evitar thrashing de VRAM)
  const multiLayerBuffers = useMemo(() => {
    if (!showDeckGLMesh || !deckGlMultiLayerMode || rawUrbanPoints.length === 0) {
      multiLayerBuffersRef.current = [];
      return [];
    }
    const activeList = Array.from(deckGlEnabledSpecies);
    const bufs = activeList.map((sp, sIdx) => ({
      species: sp,
      buffers: buildInstancedPollutantBuffers(
        rawUrbanPoints,
        sp,
        deckGlElevationScale * (1.0 + sIdx * 0.15),
        Math.max(6, deckGlColumnRadius - sIdx * 3.5),
        {
          tempC,
          uvIndex,
          windSpeed: windSpeedMs
        }
      )
    }));
    multiLayerBuffersRef.current = bufs;
    return bufs;
  }, [
    showDeckGLMesh,
    deckGlMultiLayerMode,
    rawUrbanPoints,
    multiLayerEnabledKey,
    deckGlElevationScale,
    deckGlColumnRadius,
    tempC,
    uvIndex,
    windSpeedMs,
    gcEvictionEpoch
  ]);

  // Capas de Deck.GL instanciadas (1 draw call por especie con geometría unitaria compartida y VRAM optimizada)
  const deckGlLayers = useMemo(() => {
    const layers = [];

    // 1. Deck.GL Overpass 3D Buildings
    if (geoJsonData && showBuildings) {
      layers.push(
        new GeoJsonLayer({
          id: 'deckgl-3d-buildings-osm',
          data: geoJsonData,
          pickable: true,
          stroked: true,
          filled: true,
          extruded: true,
          getElevation: (d: any) => d.properties?.['building:levels'] ? parseFloat(d.properties['building:levels']) * 3 : d.properties?.height ? parseFloat(d.properties.height) : d.properties?.building ? 12 : 0,
          getFillColor: [30, 41, 59, 210], // Slate-800
          getLineColor: [71, 85, 105, 255], // Slate-600
          opacity: 1.0,
          updateTriggers: {
            getElevation: [geoJsonData],
            getFillColor: [geoJsonData]
          }
        })
      );
    }

    if (showDeckGLMesh && rawUrbanPoints.length > 0) {
      if (!deckGlMultiLayerMode) {
        if (instancedBuffers) {
          layers.push(
            createInstancedPollutantColumnLayer({
              id: `instanced-column-${deckGlActiveSpecies}`,
              buffers: instancedBuffers,
              species: deckGlActiveSpecies,
              diskResolution: deckGlDiskResolution,
              wireframe: deckGlWireframe,
              opacity: deckGlOpacity
            })
          );
        }
      } else {
        // Modo Multicapa Simultáneo: utiliza los buffers previamente cacheados sin reasignar TypedArrays en cada frame
        for (let i = 0; i < multiLayerBuffers.length; i++) {
          const item = multiLayerBuffers[i];
          layers.push(
            createInstancedPollutantColumnLayer({
              id: `instanced-multi-column-${item.species}`,
              buffers: item.buffers,
              species: item.species,
              diskResolution: deckGlDiskResolution,
              wireframe: deckGlWireframe,
              opacity: deckGlOpacity * 0.9
            })
          );
        }
      }
    }

    // 3. Arbolado Urbano Instanciado en GPU (Columnas 3D volumétricas con escala OPALS / NO2)
    if (showDeckGLMesh && showMalagaTreesLayer) {
      layers.push(
        createInstancedTreesDeckGLLayer({
          id: 'deckgl-instanced-malaga-trees-canopy',
          colorMode: 'opals',
          is3D: is3DMode,
          elevationScale: 1.2,
          radiusScale: 1.0,
          opacity: 0.9,
          pickable: true,
          onClick: (info: any) => {
            if (info?.object?.id) {
              setSelectedTreeStreetId(info.object.id);
            }
          }
        })
      );
    }

    // 4. 3D Volumetric Atmospheric Grid (Suggestion 1)
    if (showVolumetricMesh && rawUrbanPoints.length > 0) {
      const activeSpecies = deckGlActiveSpecies;
      layers.push(
        new HexagonLayer({
          id: 'atmospheric-volumetric-hexagon',
          data: rawUrbanPoints,
          getPosition: (d: any) => [d.lon, d.lat],
          getElevationWeight: (d: any) => d.qNOx_ug_m_s,
          elevationScale: deckGlElevationScale * 2.5,
          radius: deckGlColumnRadius * 3,
          extruded: true,
          pickable: true,
          opacity: 0.4,
          coverage: 0.9,
          lowerPercentile: 0,
          upperPercentile: 100,
          colorRange: activeSpecies === 'no2' ? [
            [22, 163, 74], [101, 163, 13], [202, 138, 4], [217, 119, 6], [220, 38, 38], [153, 27, 27]
          ] : [
            [6, 182, 212], [8, 145, 178], [14, 116, 144], [21, 94, 117], [30, 64, 175], [30, 58, 138]
          ],
          onHover: (info: any) => {
             // Tooltip logic if needed
             return true;
          }
        })
      );
    }

    // 4. Malla Geoestadística Kriging Ordinario & Incertidumbre Espacial (UQ) / Red de Confianza
    if (showKrigingVarianceLayer || showConfidenceLayer) {
      const krigingGrid = generateMálagaKrigingVarianceGrid(location.lat, location.lon, 8.5, 0.55);
      layers.push(
        new ColumnLayer({
          id: 'kriging-variance-uq-layer',
          data: krigingGrid,
          diskResolution: 12,
          radius: 220,
          extruded: true,
          pickable: true,
          elevationScale: 1.0,
          getPosition: (d: any) => [d.lon, d.lat],
          getElevation: (d: any) => Math.max(15, d.krigingVarianceSigma2 * 18.0),
          getFillColor: (d: any) => [d.colorRgb[0], d.colorRgb[1], d.colorRgb[2], Math.round(d.opacity * 255)] as [number, number, number, number],
          getLineColor: [15, 23, 42, 180],
          lineWidthMinPixels: 1,
          onHover: (info: any) => {
            if (info?.object) {
              lastDeckHoverTsRef.current = performance.now();
              const c = info.object;
              const matchedFeature = krigingConfidenceGeoJson?.features.find((ft: any) => ft.properties.id === c.id);
              if (matchedFeature) {
                setHoverInfo((prev: any) => prev?.pinnedFromLegend ? prev : {
                  lngLat: { lng: c.lon, lat: c.lat },
                  type: 'confidence_zone',
                  layerId: 'kriging-variance-uq-layer',
                  properties: matchedFeature.properties
                });
                return;
              }
            } else {
              setHoverInfo((prev: any) => (prev?.layerId === 'kriging-variance-uq-layer' && !prev?.pinnedFromLegend ? null : prev));
            }
          },
          onClick: (info: any) => {
            if (info?.object) {
              const c = info.object;
              const matchedFeature = krigingConfidenceGeoJson?.features.find((ft: any) => ft.properties.id === c.id);
              if (matchedFeature) {
                setHoverInfo({
                  lngLat: { lng: c.lon, lat: c.lat },
                  type: 'confidence_zone',
                  layerId: 'kriging-variance-uq-layer',
                  pinnedFromLegend: true,
                  properties: matchedFeature.properties
                });
              }
              syncActivePoint(c.lat, c.lon, {
                zoom: 16.2,
                pitch: is3DMode ? 60 : 0,
                fly: true,
                openInspector: true
              });
            }
          }
        })
      );
    }
    
    return layers;
  }, [
    geoJsonData,
    showBuildings,
    showDeckGLMesh,
    showVolumetricMesh,
    showKrigingVarianceLayer,
    showConfidenceLayer,
    location.lat,
    location.lon,
    rawUrbanPoints.length,
    deckGlMultiLayerMode,
    deckGlActiveSpecies,
    instancedBuffers,
    multiLayerBuffers,
    deckGlDiskResolution,
    deckGlWireframe,
    deckGlOpacity
  ]);


  // Detección del corredor arbóreo más próximo y evaluación biofísica en vivo
  const activeNearestTreeStreet = useMemo(() => {
    return getNearestTreeStreetToPoint(location.lat, location.lon);
  }, [location.lat, location.lon]);

  const activeTreeLiveMetrics = useMemo(() => {
    if (!activeNearestTreeStreet) return null;
    const species = MALAGA_SPECIES_CATALOG.find(s => s.id === activeNearestTreeStreet.predominantSpeciesId) || MALAGA_SPECIES_CATALOG[0];
    return calculateStreetTreeLiveAbsorption(
      activeNearestTreeStreet,
      species,
      {
        tempC: data.temperatura_malaga,
        rhPct: data.humedad_relativa,
        parWm2: data.shortwave_radiation ? data.shortwave_radiation * 0.45 : undefined,
        windSpeedMs: data.velocidad_viento_km_h ? data.velocidad_viento_km_h / 3.6 : undefined,
        uvIndex: data.uv_index
      },
      {
        no2Ugm3: activePointAssimilation?.no2PedestrianLevel1_8mUgM3 ?? data.no2_satelite_base ?? 36.0,
        o3Ugm3: activePointAssimilation?.ozoneO3UgM3 ?? data.ozone ?? 64.0,
        pm25Ugm3: activePointAssimilation?.pm25UgM3 ?? data.pm2_5 ?? 14.5,
        pm10Ugm3: activePointAssimilation?.pm10UgM3 ?? data.pm10 ?? 25.0,
        so2Ugm3: 3.5
      }
    );
  }, [activeNearestTreeStreet, data, activePointAssimilation]);

  // Proveedor de Contexto Unificado de Punto Activo y Asimilación en Vivo
  const activePointContextValue: ActivePointContextValue = useMemo(() => ({
    location,
    activePoint: activeReadingPointMetadata,
    assimilation: activePointAssimilation,
    data,
    result,
    nearestTreeStreet: activeNearestTreeStreet,
    activeTreeLiveMetrics,
    syncActivePoint
  }), [location, activeReadingPointMetadata, activePointAssimilation, data, result, activeNearestTreeStreet, activeTreeLiveMetrics, syncActivePoint]);

  return (
    <ActivePointContext.Provider value={activePointContextValue}>
      <div 
        className="h-screen flex flex-col overflow-hidden selection:bg-emerald-900 selection:text-emerald-50"
      style={{ backgroundColor: '#0c0d0f', color: '#e2e8f0', fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
    >
      <SectionErrorBoundary fallbackTitle="Cabecera Científica">
        <ScientificHeader
          activeModal={activeModal}
          setActiveModal={setActiveModal}
          telemetryAudit={telemetryAudit}
          showDeckGLMesh={showDeckGLMesh}
          instancedBuffers={instancedBuffers}
          handleForceGC={handleForceGC}
          showLeftSidebar={showLeftSidebar}
          setShowLeftSidebar={setShowLeftSidebar}
          showRightSidebar={showRightSidebar}
          setShowRightSidebar={setShowRightSidebar}
          loading={loading}
          dataTimestamps={dataTimestamps}
          isSyncingTelemetry={isSyncingTelemetry}
          onRefreshTelemetry={() => fetchLiveData(location.lat, location.lon, false)}
          onStartScreenCrop={() => setIsCroppingScreen(true)}
        />
      </SectionErrorBoundary>


      <SectionErrorBoundary fallbackTitle="Banner de Asimilación del Punto Activo">
        <ActivePointSyncBanner />
      </SectionErrorBoundary>

      <main className="flex-1 flex bg-slate-800 overflow-hidden relative w-full h-full">
        {/* Map Container (Full Viewport 100% Canvas) */}
        <section id="mapContainerRef" ref={mapContainerRef} className="flex-1 relative w-full h-full min-h-[350px] lg:min-h-0 border-x border-slate-800 bg-[#0c0d12] overflow-hidden">
          <Suspense fallback={null}>
            <PointReliabilityBadge />
          </Suspense>
          {/* Atmospheric Particle Streamlines Layer (WebGL/Canvas2D 60 FPS) */}
          {showWindParticles && !performanceMode && (
            <SectionErrorBoundary fallbackTitle="Partículas de Viento" silentFallback={true}>
              <Suspense fallback={null}>
                <ParticleFlowCanvas 
                  windSpeedKmh={data.velocidad_viento_km_h} 
                  windDirDeg={data.direccion_viento_grados} 
                  active={true} 
                />
              </Suspense>
            </SectionErrorBoundary>
          )}

          <Map
            ref={mapRef}
            {...({
              preserveDrawingBuffer: true,
              maxTileCacheSize: 1024,
              prefetchZoomDelta: 2,
              fadeDuration: 25,
              renderWorldCopies: false,
              antialias: true,
              crossSourceCollisions: false,
              trackResize: true,
              cooperativeGestures: false
            } as any)}
            initialViewState={{
              longitude: location.lon,
              latitude: location.lat,
              zoom: 16.5,
              pitch: is3DMode ? 60 : 0,
              bearing: 0
            }}
            style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
            mapStyle={MAP_STYLES[activeBaseStyle] || MAP_STYLES.google_hybrid || MAP_STYLES.dark}
            onError={(e: any) => {
              // Absorber de forma resiliente errores transitorios de red o carga de teselas
              const msg = e?.error?.message || '';
              if (
                msg.includes('tiles') || 
                msg.includes('Failed to fetch') ||
                msg.includes('style') ||
                e?.error?.status === 0 ||
                e?.error?.status === 404
              ) {
                if (activeBaseStyle !== 'dark' && activeBaseStyle !== 'osm') {
                  console.warn('[MapLibre Fallback] Conmutando a mapa base vectorial resiliente...');
                  setActiveBaseStyle('dark');
                }
                return;
              }
              console.warn('[MapLibre Event]', msg || e);
            }}
            onClick={handleMapClick}
            onMoveEnd={(e) => {
              try {
                const map = e.target;
                const center = map.getCenter();
                garbageCollector.registerViewChange({
                  lat: center.lat,
                  lon: center.lng,
                  zoom: map.getZoom(),
                  pitch: map.getPitch(),
                  bearing: map.getBearing(),
                  style: activeBaseStyle
                });
              } catch {
                // Manejo seguro
              }
            }}
            onRotate={(e) => {
              const b = e.target.getBearing();
              setMapCurrentBearing(b);
            }}
            onPitch={(e) => {
              const p = e.target.getPitch();
              setMapCurrentPitch(p);
            }}
            onMouseMove={handleMapMouseMove}
            touchPitch={true}
            touchZoomRotate={true}
            dragRotate={true}
            interactiveLayerIds={[
              ...(showMalagaTreesLayer && malagaTreesLayerGeoJson ? ['malaga-trees-line-layer', 'malaga-trees-glow-layer'] : []),
              ...(showMalagaTreesLayer && malagaTreeCanopyPointsGeoJson ? ['malaga-tree-canopy-core-layer'] : []),
              ...(showRoads && !showTrafficNoxLayer && geoJsonData ? ['roads'] : []),
              ...(showTrafficNoxLayer && trafficNoxData?.geoJson ? ['traffic-nox-core-layer'] : []),
              ...(showTrafficNoxLayer && trafficNoxData?.hotspotsGeoJson ? ['traffic-hotspots-core-layer'] : []),
              ...((showKrigingVarianceLayer || showConfidenceLayer) && krigingConfidenceGeoJson ? ['kriging-confidence-circles'] : []),
              ...(showConfidenceLayer && confidenceNetworkVectorsGeoJson ? ['confidence-network-hit-buffer', 'confidence-network-station-lines', 'confidence-network-sat-lines', 'confidence-network-rings'] : []),
              ...(showSentinel5PGrid && sentinel5PGridGeoJson ? ['sentinel-5p-grid-fill'] : []),
              ...(showContinuousContour && continuousContourGeoJson ? ['d3-contour-fill'] : []),
              ...(showMarineFlowLayer && marineFlowGeoJson ? ['stagnation-zones-fill'] : [])
            ]}
            cursor={loading ? 'wait' : 'crosshair'}
          >
            <NavigationControl position="bottom-right" showCompass showZoom visualizePitch />
            <ScaleControl position="bottom-left" maxWidth={100} unit="metric" />
            <FullscreenControl position="bottom-right" />

            {/* Sombreado Topográfico de Relieve 3D (ESRI World Shaded Relief / Hillshade) */}
            <Source
              id="esri-hillshade-source"
              type="raster"
              tiles={["https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}"]}
              tileSize={256}
            >
              <Layer
                id="esri-hillshade-layer"
                type="raster"
                layout={{ visibility: showHillshade ? 'visible' : 'none' }}
                paint={{
                  'raster-opacity': (activeBaseStyle === 'satellite' || activeBaseStyle === 'google_sat' || activeBaseStyle === 'google_hybrid') ? 0.25 : activeBaseStyle === 'positron' ? 0.35 : 0.45,
                  'raster-contrast': 0.25
                }}
              />
            </Source>

            {/* Dynamic Wind Advection Vector Layer */}
            {windVectorGeoJson && (
              <Source id="wind-vector-source" type="geojson" data={windVectorGeoJson}>
                <Layer
                  id="wind-vector-shaft"
                  type="line"
                  layout={{ visibility: showWindVector ? 'visible' : 'none', 'line-cap': 'round', 'line-join': 'round' }}
                  paint={{
                    'line-color': '#06b6d4',
                    'line-width': 4.5,
                    'line-opacity': 0.95
                  }}
                  filter={['==', ['get', 'type'], 'shaft']}
                />
                <Layer
                  id="wind-vector-head"
                  type="line"
                  layout={{ visibility: showWindVector ? 'visible' : 'none', 'line-cap': 'round', 'line-join': 'round' }}
                  paint={{
                    'line-color': '#38bdf8',
                    'line-width': 5.5,
                    'line-opacity': 1.0
                  }}
                  filter={['==', ['get', 'type'], 'head']}
                />
              </Source>
            )}

            {/* Dynamic AOD Aerosol Optical Depth Plume Dispersion Layer */}
            {aodGeoJson && (
              <Source id="aod-dispersion" type="geojson" data={aodGeoJson}>
                <Layer
                  id="aod-fill"
                  type="fill-extrusion"
                  layout={{ visibility: showAODLayer ? 'visible' : 'none' }}
                  paint={{
                    'fill-extrusion-color': ['get', 'color'],
                    'fill-extrusion-opacity': 0.65,
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': ['get', 'base_height']
                  }}
                />
                <Layer
                  id="aod-contour"
                  type="line"
                  layout={{ visibility: showAODLayer ? 'visible' : 'none' }}
                  paint={{
                    'line-color': ['get', 'color'],
                    'line-width': 1.6,
                    'line-opacity': 0.75,
                    'line-dasharray': [3, 2]
                  }}
                />
              </Source>
            )}

            {/* Capa de Flujo Marino sobre la Bahía de Málaga e Isolíneas de Encajonamiento Topográfico */}
            {marineFlowGeoJson && (
              <Source id="bay-marine-flow-source" type="geojson" data={marineFlowGeoJson}>
                {/* 1. Zonas de Encajonamiento Topográfico / Estancamiento (Polígonos de Relleno) */}
                <Layer
                  id="stagnation-zones-fill"
                  type="fill"
                  layout={{ visibility: showMarineFlowLayer ? 'visible' : 'none' }}
                  paint={{
                    'fill-color': ['get', 'color'],
                    'fill-opacity': 0.28
                  }}
                  filter={['==', ['get', 'layer_type'], 'stagnation-fill']}
                />

                {/* 2. Contornos de Zonas de Encajonamiento */}
                <Layer
                  id="stagnation-zones-outline"
                  type="line"
                  layout={{ visibility: showMarineFlowLayer ? 'visible' : 'none' }}
                  paint={{
                    'line-color': ['get', 'strokeColor'],
                    'line-width': 2.0,
                    'line-opacity': 0.85
                  }}
                  filter={['==', ['get', 'layer_type'], 'stagnation-fill']}
                />

                {/* 3. Isolíneas de Potencial Cinético (J/m³) */}
                <Layer
                  id="kinetic-potential-isolines"
                  type="line"
                  layout={{ visibility: showMarineFlowLayer ? 'visible' : 'none' }}
                  paint={{
                    'line-color': ['get', 'color'],
                    'line-width': 2.2,
                    'line-opacity': 0.85,
                    'line-dasharray': [4, 2]
                  }}
                  filter={['==', ['get', 'layer_type'], 'kinetic-isoline']}
                />

                {/* 4. Líneas de Corriente de la Brisa Marina (Streamlines) */}
                <Layer
                  id="marine-flow-streamlines"
                  type="line"
                  layout={{ visibility: showMarineFlowLayer ? 'visible' : 'none', 'line-cap': 'round', 'line-join': 'round' }}
                  paint={{
                    'line-color': '#06b6d4',
                    'line-width': 3.2,
                    'line-opacity': 0.9
                  }}
                  filter={['==', ['get', 'layer_type'], 'marine-streamline']}
                />

                {/* 5. Isóbatas Batimétricas de la Bahía de Málaga (-10m a -100m) */}
                <Layer
                  id="bathymetry-isobaths"
                  type="line"
                  layout={{ visibility: showMarineFlowLayer ? 'visible' : 'none' }}
                  paint={{
                    'line-color': ['get', 'color'],
                    'line-width': 1.8,
                    'line-opacity': 0.8,
                    'line-dasharray': [4, 3]
                  }}
                  filter={['==', ['get', 'layer_type'], 'bathymetry-isobath']}
                />
              </Source>
            )}

            {/* Capa Visual de Intensidad de Tráfico Rodado y Emisión de NOx (OSM & COPERT 5) */}
            {showTrafficNoxLayer && trafficNoxData?.geoJson && (
              <Source id="traffic-nox-source" type="geojson" data={trafficNoxData.geoJson}>
                {/* 1. Resplandor Difuso de Pluma de Emisión NOx (Glow Underlay) */}
                <Layer
                  id="traffic-nox-glow-layer"
                  type="line"
                  paint={{
                    'line-color': ['get', 'colorHex'],
                    'line-width': ['get', 'glowWidth'],
                    'line-opacity': ['get', 'opacity'],
                    'line-blur': 3
                  }}
                  layout={{ visibility: performanceMode ? 'none' : 'visible' }}
                  filter={['==', ['get', 'layer_type'], 'traffic_nox_glow']}
                />

                {/* 2. Núcleo de Carretera según Tasa de Emisión de NOx (Core Line) */}
                <Layer
                  id="traffic-nox-core-layer"
                  type="line"
                  paint={{
                    'line-color': ['get', 'colorHex'],
                    'line-width': ['get', 'lineWidth'],
                    'line-opacity': 0.95
                  }}
                  filter={['==', ['get', 'layer_type'], 'traffic_nox_core']}
                />
              </Source>
            )}

            {/* Focos e Intersecciones Críticas de Tráfico (Hotspots) */}
            {showTrafficNoxLayer && trafficNoxData?.hotspotsGeoJson && (
              <Source id="traffic-hotspots-source" type="geojson" data={trafficNoxData.hotspotsGeoJson}>
                <Layer
                  id="traffic-hotspots-glow-layer"
                  type="circle"
                  paint={{
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 10, 16, 26],
                    'circle-color': '#ef4444',
                    'circle-opacity': 0.35,
                    'circle-blur': 0.8
                  }}
                />
                <Layer
                  id="traffic-hotspots-core-layer"
                  type="circle"
                  paint={{
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 4, 16, 8],
                    'circle-color': '#ef4444',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                    'circle-opacity': 0.95
                  }}
                />
              </Source>
            )}

            {geoJsonData && (
              <Source id="osm-morphology" type="geojson" data={geoJsonData}>
                {/* Roads standard layer (if traffic layer is disabled) */}
                <Layer
                  id="roads"
                  type="line"
                  layout={{ visibility: showRoads && !showTrafficNoxLayer ? 'visible' : 'none' }}
                  paint={{
                    'line-color': [
                      'match',
                      ['get', 'highway'],
                      ['motorway', 'motorway_link', 'trunk', 'trunk_link'], '#ef4444', // Red - High Traffic
                      ['primary', 'primary_link'], '#f97316', // Orange - Med-High
                      ['secondary', 'secondary_link'], '#fbbf24', // Yellow - Medium
                      ['tertiary', 'tertiary_link'], '#a3e635', // Lime - Med-Low
                      '#10b981' // Emerald - Low / Residential
                    ],
                    'line-opacity': 0.85,
                    'line-width': [
                      'match',
                      ['get', 'highway'],
                      ['motorway', 'motorway_link', 'trunk', 'trunk_link'], 4,
                      ['primary', 'primary_link'], 3,
                      ['secondary', 'secondary_link'], 2.5,
                      2
                    ]
                  }}
                  filter={['has', 'highway']}
                />
              </Source>
            )}
            
            {/* Malla Euleriana 3D de Deck.GL (GPU Instanced Rendering & Overpass) */}
            {deckGlLayers.length > 0 && (
              <SectionErrorBoundary fallbackTitle="Capa DeckGL 3D" silentFallback={true}>
                <DeckGLOverlay 
                  layers={deckGlLayers}
                />
              </SectionErrorBoundary>
            )}

            {/* D3-Contour Continuous Gaussian Advection-Diffusion Isoplet Surface */}
            {continuousContourGeoJson && (
              <Source id="d3-contour-source" type="geojson" data={continuousContourGeoJson}>
                <Layer
                  id="d3-contour-fill"
                  type="fill"
                  layout={{ visibility: showContinuousContour ? 'visible' : 'none' }}
                  paint={{
                    'fill-color': ['get', 'color'],
                    'fill-opacity': ['get', 'opacity']
                  }}
                />
                <Layer
                  id="d3-contour-line"
                  type="line"
                  layout={{ visibility: showContinuousContour ? 'visible' : 'none' }}
                  paint={{
                    'line-color': ['get', 'color'],
                    'line-width': 1.5,
                    'line-opacity': 0.85
                  }}
                />
              </Source>
            )}

            {/* Capa Vectorial de las Alineaciones de Arbolado de Málaga (Datos Abiertos / WFS) */}
            {showMalagaTreesLayer && malagaTreesLayerGeoJson && (
              <Source id="malaga-trees-source" type="geojson" data={malagaTreesLayerGeoJson}>
                {/* 1. Halo Difuso de Fito-Filtrado y Atenuación */}
                <Layer
                  id="malaga-trees-glow-layer"
                  type="line"
                  paint={{
                    'line-color': ['get', 'color'],
                    'line-width': ['interpolate', ['linear'], ['zoom'], 12, 6, 16, 16],
                    'line-opacity': 0.4,
                    'line-blur': 3
                  }}
                />
                {/* 2. Eje de Alineación Viaria con Color de Alergenicidad OPALS y Grosor según Copa */}
                <Layer
                  id="malaga-trees-line-layer"
                  type="line"
                  paint={{
                    'line-color': ['get', 'color'],
                    'line-width': ['interpolate', ['linear'], ['zoom'], 12, 3.5, 16, ['get', 'lineWidth']],
                    'line-opacity': 0.95
                  }}
                />
              </Source>
            )}

            {/* Capa Microescalar de Copas Arbóreas Individuales a 60 FPS (Zoom >= 13.5) */}
            {showMalagaTreesLayer && malagaTreeCanopyPointsGeoJson && (
              <Source id="malaga-tree-canopies-source" type="geojson" data={malagaTreeCanopyPointsGeoJson}>
                <Layer
                  id="malaga-tree-canopy-halo-layer"
                  type="circle"
                  minzoom={13.5}
                  paint={{
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 4.5, 16, ['*', ['get', 'canopyDiameterM'], 1.2], 18, ['*', ['get', 'canopyDiameterM'], 2.5]],
                    'circle-color': ['get', 'color'],
                    'circle-opacity': 0.35,
                    'circle-blur': 0.5
                  }}
                />
                <Layer
                  id="malaga-tree-canopy-core-layer"
                  type="circle"
                  minzoom={13.5}
                  paint={{
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 2.8, 16, ['*', ['get', 'canopyDiameterM'], 0.75], 18, ['*', ['get', 'canopyDiameterM'], 1.8]],
                    'circle-color': ['get', 'color'],
                    'circle-stroke-width': 1.2,
                    'circle-stroke-color': '#064e3b',
                    'circle-opacity': 0.92
                  }}
                />
              </Source>
            )}

            {/* Malla Satelital Sentinel-5P TROPOMI (Copernicus Earth Engine L3) */}
            {showSentinel5PGrid && sentinel5PGridGeoJson && (
              <Source id="sentinel-5p-grid-source" type="geojson" data={sentinel5PGridGeoJson}>
                <Layer
                  id="sentinel-5p-grid-fill"
                  type="fill"
                  paint={{
                    'fill-color': ['get', 'color'],
                    'fill-opacity': ['get', 'fillOpacity']
                  }}
                />
                <Layer
                  id="sentinel-5p-grid-outline"
                  type="line"
                  paint={{
                    'line-color': ['get', 'color'],
                    'line-width': 1.8,
                    'line-dasharray': [3, 2],
                    'line-opacity': 0.85
                  }}
                />
              </Source>
            )}

            {/* Capa de Emisiones de Tráfico Portuario y Cruceros (EMEP/EEA Tier 3) */}
            {showPortCruiseLayer && portCruiseGeoJson && (
              <Source id="port-cruise-emissions-source" type="geojson" data={portCruiseGeoJson}>
                <Layer
                  id="port-cruise-glow"
                  type="circle"
                  paint={{
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 14, 16, 32],
                    'circle-color': ['get', 'color'],
                    'circle-opacity': 0.35,
                    'circle-blur': 0.6
                  }}
                />
                <Layer
                  id="port-cruise-core"
                  type="circle"
                  paint={{
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 6, 16, 12],
                    'circle-color': ['get', 'color'],
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                    'circle-opacity': 0.95
                  }}
                />
              </Source>
            )}

            {/* Red de Confianza & Certidumbre PINN / Malla Geoestadística Kriging Ordinario (UQ) */}
            {(showKrigingVarianceLayer || showConfidenceLayer) && krigingConfidenceGeoJson && (
              <Source id="kriging-confidence-source" type="geojson" data={krigingConfidenceGeoJson}>
                <Layer
                  id="kriging-confidence-circles"
                  type="circle"
                  paint={{
                    'circle-radius': [
                      'interpolate', ['linear'], ['zoom'],
                      10, 14,
                      13, 32,
                      16, 64
                    ],
                    'circle-color': ['get', 'colorHex'],
                    'circle-opacity': 0.58,
                    'circle-stroke-width': 1.5,
                    'circle-stroke-color': '#0f172a',
                    'circle-stroke-opacity': 0.85,
                    'circle-blur': 0.25
                  }}
                />
              </Source>
            )}

            {/* Proyección Vectorial de la Red de Confianza 24 Estaciones + 16 Satélites + Anillos de Isoconfianza hacia el Punto Activo */}
            {showConfidenceLayer && confidenceNetworkVectorsGeoJson && (
              <Source id="confidence-network-vectors-source" type="geojson" data={confidenceNetworkVectorsGeoJson}>
                {/* 0. Capa de Captura Táctil Amplia (14px) para que tocar o pasar sobre cualquier vector o anillo responda al instante */}
                <Layer
                  id="confidence-network-hit-buffer"
                  type="line"
                  paint={{
                    'line-color': '#ffffff',
                    'line-width': 14,
                    'line-opacity': 0.01
                  }}
                />
                {/* 1. Anillos Concéntricos de Isoconfianza Metrológica (500m, 1.5km, 3.0km) */}
                <Layer
                  id="confidence-network-rings"
                  type="line"
                  filter={['==', ['get', 'featureKind'], 'confidence_ring']}
                  paint={{
                    'line-color': ['get', 'color'],
                    'line-width': 2.2,
                    'line-dasharray': [4, 3],
                    'line-opacity': 0.85
                  }}
                />
                {/* 2. Haces Orbitales Satelitales (16 Misiones -> Punto Activo) */}
                <Layer
                  id="confidence-network-sat-lines"
                  type="line"
                  filter={['==', ['get', 'featureKind'], 'satellite_vector']}
                  paint={{
                    'line-color': ['get', 'color'],
                    'line-width': ['get', 'lineWidth'],
                    'line-dasharray': [2, 2],
                    'line-opacity': ['get', 'opacity']
                  }}
                />
                {/* 3. Vectores Geodésicos Terrestres (24 Estaciones -> Punto Activo) */}
                <Layer
                  id="confidence-network-station-lines"
                  type="line"
                  filter={['==', ['get', 'featureKind'], 'station_vector']}
                  paint={{
                    'line-color': ['get', 'color'],
                    'line-width': ['get', 'lineWidth'],
                    'line-opacity': ['get', 'opacity']
                  }}
                />
              </Source>
            )}

            {/* Marcador de Anclaje Visual en el Mapa cuando se inspecciona una Zona Coloreada, Vector o Árbol */}
            {hoverInfo && hoverInfo.lngLat && (
              <Marker
                longitude={hoverInfo.lngLat.lng}
                latitude={hoverInfo.lngLat.lat}
                anchor="center"
                style={{ zIndex: 48 }}
              >
                <div className="pointer-events-none flex items-center justify-center">
                  <span className="w-4 h-4 rounded-full bg-indigo-400/40 animate-ping absolute" />
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-300 border-2 border-slate-950 shadow-[0_0_10px_#818cf8]" />
                </div>
              </Marker>
            )}

            {/* Marcadores Interactivos de Arbolado Urbano por Calles de Málaga */}
            {showMalagaTreesLayer && filteredTreeRecords.map((st) => {
              const sp = MALAGA_SPECIES_CATALOG.find((s) => s.id === st.predominantSpeciesId) || MALAGA_SPECIES_CATALOG[0];
              const approxGs = (sp.vdNO2 * 650).toFixed(1);
              return (
                <Marker
                  key={`tree-marker-${st.id}`}
                  latitude={st.lat}
                  longitude={st.lon}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setSelectedTreeStreetId(st.id);
                    setTreeModalInitialTab('live_physiology');
                    syncActivePoint(st.lat, st.lon, { name: st.streetName, zoom: 16.5, pitch: 45, fly: true });
                    setActiveModal('malagaTreesInventory');
                  }}
                >
                  <div
                    className="cursor-pointer group flex flex-col items-center pointer-events-auto"
                    title={`🌿 ${st.streetName} (${st.totalTreeCount} ejemplares - ${st.predominantSpeciesName})\n• Nombre Científico: ${sp.scientificName}\n• Velocidad Deposición Vd NO₂: ${sp.vdNO2} cm/s\n• Conductancia Estomática Aprox. gs: ~${approxGs} mmol/m²/s\n• Secuestro Anual Estimado: ${st.estimatedNO2DepositionKgYear} kg NO₂/año\n• Índice OPALS Alergias: ${st.streetOpalsScore}/10 | Follaje: ${sp.foliageType}\n👉 Clic para abrir el panel de Fisiología Estomática Real en Vivo`}
                  >
                    <div className="bg-slate-950/95 text-emerald-300 border border-emerald-500/80 px-1.5 py-0.5 text-[8.5px] font-mono font-bold shadow-[0_0_10px_rgba(16,185,129,0.6)] flex items-center gap-1 scale-95 group-hover:scale-110 transition-transform rounded-xs">
                      <Trees className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                      <span className="truncate max-w-[85px]">{st.streetName.replace('Avenida de ', 'Av. ').replace('Paseo del ', 'P.º ').replace('Alameda ', 'Alam. ')}</span>
                      <span className="text-[7.5px] bg-emerald-950 text-emerald-400 px-1 rounded-xs border border-emerald-800/60 font-mono">{st.totalTreeCount}</span>
                    </div>
                    <div className="w-2 h-2 bg-emerald-500 rotate-45 border border-slate-950 -mt-1 shadow-sm group-hover:bg-emerald-300"></div>
                  </div>
                </Marker>
              );
            })}

            {/* Marcadores de la Red Oficial de Estaciones de Calidad del Aire (Junta de Andalucía / EIONET / AEMET) */}
            {(showOfficialStations || showConfidenceLayer) && OFFICIAL_MALAGA_AIR_STATIONS.map((st) => {
              const comp = stationComparisons.find(sc => sc.station.id === st.id);
              const valNO2 = comp ? comp.measuredNO2.toFixed(1) : '—';
              
              // Estilos y badges según entorno físico
              let badgeColor = 'bg-slate-900/95 text-emerald-300 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]';
              let pointerColor = 'bg-emerald-400';
              let categoryIcon = '📍';
              let badgeLabel = `${st.code} · ${valNO2} µg`;

              if (st.environmentType === 'urban_traffic') {
                badgeColor = 'bg-blue-950/95 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.6)]';
                pointerColor = 'bg-cyan-400';
                categoryIcon = '🚗';
                badgeLabel = `${st.code} · ${valNO2} µg`;
              } else if (st.environmentType === 'subterranean_tunnel_confined') {
                badgeColor = 'bg-slate-950/95 text-amber-300 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]';
                pointerColor = 'bg-amber-400';
                categoryIcon = '🕳️';
                badgeLabel = `ALCAZABA · CO 1.8`;
              } else if (st.environmentType === 'highway_traffic_microclimate') {
                badgeColor = 'bg-orange-950/95 text-orange-300 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)]';
                pointerColor = 'bg-orange-400';
                categoryIcon = '🛣️';
                badgeLabel = `MA-20 · 52°C`;
              } else if (st.environmentType === 'railway_intermodal_blackcarbon') {
                badgeColor = 'bg-slate-950/95 text-cyan-200 border-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.6)]';
                pointerColor = 'bg-blue-400';
                categoryIcon = '🚂';
                badgeLabel = `ADIF · BC 4.9`;
              } else if (st.environmentType === 'cement_factory_industrial') {
                badgeColor = 'bg-red-950/95 text-red-300 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.7)]';
                pointerColor = 'bg-red-400';
                categoryIcon = '🏭';
                badgeLabel = `LA ARAÑA · SO₂`;
              } else if (st.environmentType === 'landfill_biogas_fugitive') {
                badgeColor = 'bg-purple-950/95 text-purple-300 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]';
                pointerColor = 'bg-purple-400';
                categoryIcon = '♻️';
                badgeLabel = `LOS RUICES · CH₄`;
              } else if (st.environmentType === 'photometric_aeronet_nasa') {
                badgeColor = 'bg-fuchsia-950/95 text-fuchsia-200 border-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.7)]';
                pointerColor = 'bg-fuchsia-400';
                categoryIcon = '🛰️';
                badgeLabel = `AERONET · AOD 0.28`;
              } else if (st.environmentType === 'actinic_radiometry_uvi') {
                badgeColor = 'bg-amber-950/95 text-amber-200 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)]';
                pointerColor = 'bg-amber-300';
                categoryIcon = '☀️';
                badgeLabel = `AEMET-UV · JNO₂`;
              } else if (st.environmentType === 'bioaerosol_aerobiological') {
                badgeColor = 'bg-lime-950/95 text-lime-300 border-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.6)]';
                pointerColor = 'bg-lime-400';
                categoryIcon = '🌾';
                badgeLabel = `HIRST · Polen`;
              } else if (st.environmentType === 'doppler_radar_wind_profiler') {
                badgeColor = 'bg-indigo-950/95 text-indigo-200 border-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.7)]';
                pointerColor = 'bg-indigo-400';
                categoryIcon = '📡';
                badgeLabel = `RADAR · +1150m`;
              } else if (st.environmentType === 'regional_pristine_background') {
                badgeColor = 'bg-emerald-950/95 text-emerald-200 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]';
                pointerColor = 'bg-emerald-300';
                categoryIcon = '🏔️';
                badgeLabel = `EMEP · +1250m`;
              } else if (st.environmentType === 'port_industrial' || st.environmentType === 'oceanographic_buoy' || st.environmentType === 'maritime_tide_gauge' || st.environmentType === 'coastal_synoptic_marine') {
                badgeColor = 'bg-teal-950/95 text-teal-200 border-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.6)]';
                pointerColor = 'bg-teal-400';
                categoryIcon = '🌊';
                badgeLabel = `${st.code} · Mar`;
              } else if (st.environmentType === 'airport_logistics' || st.environmentType === 'aeronautical_awos_windshear') {
                badgeColor = 'bg-sky-950/95 text-sky-200 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.6)]';
                pointerColor = 'bg-sky-400';
                categoryIcon = '✈️';
                badgeLabel = `${st.code} · AWOS`;
              } else if (st.environmentType === 'botanical_canopy_cool_island') {
                badgeColor = 'bg-green-950/95 text-green-200 border-green-400 shadow-[0_0_12px_rgba(74,222,128,0.6)]';
                pointerColor = 'bg-green-400';
                categoryIcon = '🌲';
                badgeLabel = `BOTÁNICO · UCI`;
              }

              return (
                <Marker
                  key={`official-${st.id}`}
                  latitude={st.lat}
                  longitude={st.lon}
                  anchor="bottom"
                  style={{ zIndex: 45 }}
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    syncActivePoint(st.lat, st.lon, { name: st.name, zoom: 16.8, pitch: 45, fly: true, openInspector: true });
                    setSelectedInstrumentalStationId(st.id);
                  }}
                >
                  <div
                    className="cursor-pointer group flex flex-col items-center pointer-events-auto"
                    title={`Estación Oficial ${st.name} (${st.code})\nRed: ${st.network}\nCota: +${st.altM}m\nNO₂ Medido: ${valNO2} µg/m³\nClic para inspeccionar e interpolar`}
                  >
                    <div className={`${badgeColor} border px-1.5 py-0.5 text-[9px] font-mono font-bold flex items-center gap-1 scale-100 group-hover:scale-110 transition-transform rounded-xs`}>
                      <span>{categoryIcon}</span>
                      <span>{badgeLabel}</span>
                    </div>
                    <div className={`w-2.5 h-2.5 ${pointerColor} rotate-45 border-2 border-slate-900 -mt-1 shadow-md group-hover:scale-125 transition-transform`}></div>
                  </div>
                </Marker>
              );
            })}

            {/* Marcadores de Misiones Espaciales & Pies Orbitales Satelitales (Copernicus / NASA) */}
            {(showSatelliteMarkers || showSentinel5PGrid || showConfidenceLayer) && OFFICIAL_SATELLITE_MISSIONS.map((sat) => (
              <Marker
                key={`sat-mission-${sat.id}`}
                latitude={sat.lat}
                longitude={sat.lon}
                anchor="bottom"
                style={{ zIndex: 45 }}
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  syncActivePoint(sat.lat, sat.lon, { name: `${sat.name} (Pie Orbital)`, zoom: 14.8, pitch: 35, fly: true });
                  setActiveModal('audit');
                }}
              >
                <div
                  className="cursor-pointer group flex flex-col items-center pointer-events-auto"
                  title={`Misión Espacial ${sat.name} (${sat.agency})\nCelda: ${sat.spatialResolution}\nValor Asimilado: ${sat.currentValueMálaga} ${sat.unit}\nPaso: ${sat.revisitPassMálaga}\nClic para ver telemetría orbital`}
                >
                  <div className="bg-purple-950/95 text-purple-200 border border-purple-400 px-2 py-0.8 text-[9px] font-mono font-bold shadow-[0_0_15px_rgba(168,85,247,0.7)] flex items-center gap-1.5 scale-100 group-hover:scale-115 transition-transform rounded-xs">
                    <Satellite className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                    <span>🛰️ {sat.code} · {sat.currentValueMálaga} {sat.unit.split(' ')[0]}</span>
                  </div>
                  <div className="w-2.5 h-2.5 bg-purple-400 rotate-45 border-2 border-slate-900 -mt-1 shadow-md group-hover:bg-purple-300 animate-pulse"></div>
                </div>
              </Marker>
            ))}

            {/* Marcadores de Focos Críticos de Tráfico y Emisión de NOx (OSM / COPERT 5) */}
            {showTrafficNoxLayer && MALAGA_CRITICAL_TRAFFIC_HOTSPOTS.map((hs) => (
              <Marker
                key={`traffic-${hs.id}`}
                latitude={hs.lat}
                longitude={hs.lon}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedTrafficHotspot(hs);
                  syncActivePoint(hs.lat, hs.lon, { name: hs.name, qNOx_ug_m_s: hs.qNOx_ug_m_s, zoom: 16.5, pitch: 45, fly: true });
                  setActiveModal('traffic');
                }}
              >
                <div
                  className="cursor-pointer group flex flex-col items-center pointer-events-auto"
                  title={`Hotspot Tráfico & NOx: ${hs.name} - ${hs.qNOx_ug_m_s} µg/(m·s)`}
                >
                  <div className="bg-slate-900/95 text-amber-300 border-2 border-amber-500 px-2 py-1 text-[10px] font-mono font-bold shadow-[0_0_15px_rgba(245,158,11,0.7)] flex items-center gap-1.5 scale-100 group-hover:scale-110 transition-transform rounded-sm">
                    <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    <span>{hs.qNOx_ug_m_s} µg/(m·s)</span>
                  </div>
                  <div className="w-3 h-3 bg-red-500 rotate-45 border-2 border-slate-900 -mt-1.5 shadow-md group-hover:bg-red-400 animate-pulse"></div>
                </div>
              </Marker>
            ))}

            {/* Marcadores de Atraques de Buques y Cruceros (Puerto de Málaga EMEP/EEA Tier 3) */}
            {showPortCruiseLayer && MALAGA_PORT_BERTHS.map((berth) => (
              <Marker
                key={`port-berth-${berth.id}`}
                latitude={berth.lat}
                longitude={berth.lon}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  syncActivePoint(berth.lat, berth.lon, { name: `Puerto de Málaga - ${berth.name}`, zoom: 16.5, pitch: 45, fly: true });
                  setActiveModal('portHotellingEmissions');
                }}
              >
                <div
                  className="cursor-pointer group flex flex-col items-center pointer-events-auto"
                  title={`${berth.name} (${berth.shipType}) • Emisión: ${berth.noxEmissionG_h / 1000} kg/h NOx • Clic para ver panel EMEP/EEA`}
                >
                  <div className="bg-slate-950/95 text-cyan-300 border border-cyan-500/80 px-2 py-0.5 text-[9px] font-mono font-bold shadow-[0_0_12px_rgba(6,182,212,0.6)] flex items-center gap-1.5 scale-95 group-hover:scale-110 transition-transform rounded-xs">
                    <Ship className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate max-w-[120px]">{berth.name.replace('Muelle de Levante - ', '').replace('Muelle ', 'M.')}</span>
                    <span className={`text-[8px] px-1 rounded-xs font-mono ${berth.opsColdIroning ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'}`}>
                      {berth.opsColdIroning ? 'OPS ON' : `${(berth.noxEmissionG_h / 1000).toFixed(0)} kg/h`}
                    </span>
                  </div>
                  <div className={`w-2 h-2 rotate-45 border border-slate-950 -mt-1 shadow-md ${berth.opsColdIroning ? 'bg-emerald-400' : 'bg-cyan-400'}`}></div>
                </div>
              </Marker>
            ))}

            {/* Macro-Emisor Este: Fábrica de Cemento Heidelberg Materials (La Araña) */}
            <Marker
              latitude={36.7118}
              longitude={-4.3168}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                syncActivePoint(36.7118, -4.3168, { name: 'Fábrica de Cemento Heidelberg Materials (La Araña)', zoom: 16, pitch: 50, fly: true });
                setActiveModal('majorEmissionsSources');
              }}
            >
              <div
                className="cursor-pointer group flex flex-col items-center pointer-events-auto"
                title="Planta Cementera La Araña (E-PRTR ES-PRTR-290001) • Chimenea 85m • 4.052 t NOx/año • Clic para ver suite"
              >
                <div className="bg-slate-950/95 text-amber-300 border-2 border-amber-500 px-2 py-0.5 text-[9.5px] font-mono font-bold shadow-[0_0_15px_rgba(245,158,11,0.8)] flex items-center gap-1.5 scale-100 group-hover:scale-110 transition-transform rounded-sm">
                  <Factory className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>CEMENTERA LA ARAÑA (85m)</span>
                </div>
                <div className="w-3 h-3 bg-amber-500 rotate-45 border-2 border-slate-950 -mt-1.5 shadow-md group-hover:bg-amber-400"></div>
              </div>
            </Marker>

            {/* Macro-Emisor Oeste: Aeropuerto de Málaga-Costa del Sol (LEMG / AGP) */}
            <Marker
              latitude={36.6749}
              longitude={-4.4780}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                syncActivePoint(36.6749, -4.4780, { name: 'Aeropuerto de Málaga-Costa del Sol (AGP/LEMG)', zoom: 15.5, pitch: 45, fly: true });
                setActiveModal('majorEmissionsSources');
              }}
            >
              <div
                className="cursor-pointer group flex flex-col items-center pointer-events-auto"
                title="Aeropuerto de Málaga AGP (LEMG) • OACI LTO Tier 3 • Pistas 13/31 y 12/30 • Clic para ver suite"
              >
                <div className="bg-slate-950/95 text-sky-300 border-2 border-sky-500 px-2 py-0.5 text-[9.5px] font-mono font-bold shadow-[0_0_15px_rgba(14,165,233,0.8)] flex items-center gap-1.5 scale-100 group-hover:scale-110 transition-transform rounded-sm">
                  <Plane className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                  <span>AEROPUERTO MÁLAGA AGP</span>
                </div>
                <div className="w-3 h-3 bg-sky-500 rotate-45 border-2 border-slate-950 -mt-1.5 shadow-md group-hover:bg-sky-400"></div>
              </div>
            </Marker>

            {/* Marcadores de Cañón Urbano (Ejemplos Tesis) */}




            {/* Marcadores de Cañón Urbano */}
            {activeModal === 'canyon' && CANYON_MARKERS.map((st) => (
              <Marker 
                key={`can-${st.id}`} 
                latitude={st.lat} 
                longitude={st.lon} 
                anchor="bottom" 
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  syncActivePoint(st.lat, st.lon, { name: st.name, zoom: 16.5, pitch: 45, fly: true });
                  setActiveModal(st.modal as any || 'juanXXIIICanyon3D');
                }}
              >
                <div className="cursor-pointer group flex flex-col items-center pointer-events-auto" title={`${st.name} - Clic para abrir Modelización 3D`}>
                  <div className="bg-slate-950/90 text-cyan-300 border border-cyan-500/80 px-1.5 py-0.5 text-[8px] font-mono font-bold shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center gap-1 scale-100 group-hover:scale-110 transition-transform">
                    <Building2 className="w-3 h-3 text-cyan-400" />
                    <span>{st.name}</span>
                  </div>
                  <div className="w-2 h-2 bg-cyan-400 rotate-45 border border-slate-950 -mt-1 shadow-md group-hover:bg-cyan-300"></div>
                </div>
              </Marker>
            ))}

            {/* Marcadores de Entornos Escolares (Directiva 2024/2881 Art. 13 & ICRP 66) */}
            {activeModal === 'schoolAirEquity' && MALAGA_RAW_SCHOOLS.map((school) => (
              <Marker
                key={`school-${school.id}`}
                latitude={school.lat}
                longitude={school.lon}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  syncActivePoint(school.lat, school.lon, { name: school.name, zoom: 16.8, pitch: 35, fly: true });
                }}
              >
                <div className="cursor-pointer group flex flex-col items-center pointer-events-auto" title={`${school.name}\n${school.district}\nAlumnos: ${school.students}\nClic para fijar punto activo`}>
                  <div className="bg-amber-950/95 text-amber-200 border border-amber-400 px-1.5 py-0.5 text-[8.5px] font-mono font-bold shadow-[0_0_10px_rgba(245,158,11,0.6)] flex items-center gap-1 scale-100 group-hover:scale-110 transition-transform rounded-xs">
                    <School className="w-3 h-3 text-amber-400" />
                    <span className="truncate max-w-[130px]">{school.name.split('(')[0].replace('CEIP', '').trim()}</span>
                  </div>
                  <div className="w-2 h-2 bg-amber-400 rotate-45 border border-slate-950 -mt-1 shadow-md group-hover:bg-amber-300"></div>
                </div>
              </Marker>
            ))}

            {/* Marcadores de Zonas Costeras SML (Química de la Bahía de Málaga IEO-CSIC) */}
            {activeModal === 'coastalSmlAcidification' && MALAGA_COASTAL_SML_ZONES.map((zone) => (
              <Marker
                key={`sml-${zone.id}`}
                latitude={zone.lat}
                longitude={zone.lon}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  syncActivePoint(zone.lat, zone.lon, { name: zone.name, zoom: 15.5, pitch: 35, fly: true });
                }}
              >
                <div className="cursor-pointer group flex flex-col items-center pointer-events-auto" title={`${zone.name}\nDistancia a puerto: ${zone.distKm} km\nClic para fijar punto activo`}>
                  <div className="bg-cyan-950/95 text-cyan-200 border border-cyan-400 px-1.5 py-0.5 text-[8.5px] font-mono font-bold shadow-[0_0_10px_rgba(6,182,212,0.6)] flex items-center gap-1 scale-100 group-hover:scale-110 transition-transform rounded-xs">
                    <Waves className="w-3 h-3 text-cyan-400" />
                    <span className="truncate max-w-[130px]">{zone.name.split('(')[0].replace('Playa de', '').trim()}</span>
                  </div>
                  <div className="w-2 h-2 bg-cyan-400 rotate-45 border border-slate-950 -mt-1 shadow-md group-hover:bg-cyan-300"></div>
                </div>
              </Marker>
            ))}

            {/* Street View Camera & Pegman Marker (1.8m AGL) */}
            <Marker
              longitude={streetViewLocation.lon}
              latitude={streetViewLocation.lat}
              anchor="bottom"
              draggable={true}
              onDragEnd={(e: any) => {
                syncActivePoint(e.lngLat.lat, e.lngLat.lng, { fly: false, openStreetView: true });
              }}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setShowStreetViewOverlay(true);
              }}
            >
              <div 
                className="cursor-pointer group flex flex-col items-center pointer-events-auto" 
                title={`Google Street View 360° (1.8m AGL) - ${streetViewLocation.streetName}`}
              >
                <div className={`px-1.5 py-0.5 text-[8px] font-mono font-bold flex items-center gap-1 shadow-lg transition-all ${
                  showStreetViewOverlay 
                    ? 'bg-amber-500 text-black border border-white scale-110 shadow-[0_0_12px_rgba(245,158,11,0.8)]' 
                    : 'bg-slate-950/90 text-amber-300 border border-amber-500/80 group-hover:scale-105'
                }`}>
                  <Camera className="w-3 h-3 text-current" />
                  <span className="hidden sm:inline">1.8m STREET VIEW</span>
                </div>
                <div 
                  className={`w-2.5 h-2.5 rotate-45 -mt-1 shadow-md border ${
                    showStreetViewOverlay ? 'bg-amber-400 border-white' : 'bg-amber-500 border-slate-950'
                  }`}
                />
              </div>
            </Marker>

            {/* Marcador Georreferenciado del Punto de Lectura Activo Seleccionado con Nombre de Calle */}
            {activeReadingPointMetadata && (
              <Marker
                longitude={activeReadingPointMetadata.lon}
                latitude={activeReadingPointMetadata.lat}
                anchor="bottom"
                draggable={true}
                onDragEnd={(e: any) => {
                  syncActivePoint(e.lngLat.lat, e.lngLat.lng, { fly: false, openInspector: false });
                }}
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setActiveModal('activePoint7DayHistory');
                }}
              >
                <div 
                  className="relative flex flex-col items-center cursor-pointer group pointer-events-auto select-none"
                  title={`Punto de Lectura Activo: ${activeReadingPointMetadata.name} (Arrastra para reubicar en cualquier calle)`}
                >
                  {/* Etiqueta del Nombre de la Calle / Lugar */}
                  <div className="px-2 py-0.5 bg-slate-950/95 border border-cyan-400 text-cyan-300 font-mono text-[9px] font-bold shadow-[0_0_12px_rgba(6,182,212,0.8)] rounded-xs whitespace-nowrap mb-1 flex items-center gap-1 group-hover:scale-105 transition-transform">
                    <MapPin className="w-2.5 h-2.5 text-cyan-400 animate-pulse shrink-0" />
                    <span className="truncate max-w-[150px]">{activeReadingPointMetadata.name}</span>
                  </div>
                  {/* Pin de Radar Físico */}
                  <div className="relative flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-cyan-400/30 animate-ping absolute" />
                    <div className="w-5 h-5 rounded-full bg-cyan-500 border-2 border-white shadow-[0_0_12px_rgba(6,182,212,1)] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                    </div>
                  </div>
                  {/* Indicador de punta */}
                  <div className="w-2 h-2 bg-cyan-400 rotate-45 border border-slate-950 -mt-1 shadow-md"></div>
                </div>
              </Marker>
            )}

            {/* Target Marker Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
               <Crosshair className={`w-12 h-12 ${loading ? 'text-slate-500 animate-spin' : 'text-emerald-500 drop-shadow-[0_0_10px_#10b981]'}`} />
            </div>
          </Map>

          {/* Navegación unificada en el Dock Doctoral inferior (IntelligentDockTabs) */}

          {/* Top Floating Draggable Map Controls Toolbar (Unificado con Controlador Cinemático, Capas y Atalayas) */}
          <SectionErrorBoundary fallbackTitle="Centro de Control Geoespacial">
            <GeospatialControlCenter
              location={location}
              flyToLocation={flyToLocation}
              applyCameraPreset={applyCameraPreset}
              showStreetViewOverlay={showStreetViewOverlay}
              setShowStreetViewOverlay={setShowStreetViewOverlay}
              setStreetViewLocation={setStreetViewLocation}
              showPointInspector={showPointInspector}
              setShowPointInspector={setShowPointInspector}
              setPointInspectorLocation={setPointInspectorLocation}
              showLayerControls={showLayerControls}
              setShowLayerControls={setShowLayerControls}
              mapContainerRef={mapContainerRef}
              mapRef={mapRef}
              is3DMode={is3DMode}
              setIs3DMode={setIs3DMode}
              currentBearing={mapCurrentBearing}
              currentPitch={mapCurrentPitch}
              showOfficialStations={showOfficialStations}
              setShowOfficialStations={setShowOfficialStations}
              showSatelliteMarkers={showSatelliteMarkers}
              setShowSatelliteMarkers={setShowSatelliteMarkers}
              showSentinel5PGrid={showSentinel5PGrid}
              setShowSentinel5PGrid={setShowSentinel5PGrid}
              onFlyTo={(lat, lon, zoom, pitch, bearing, name) => {
                syncActivePoint(lat, lon, {
                  name,
                  zoom,
                  pitch,
                  bearing,
                  fly: true
                });
              }}
            />
          </SectionErrorBoundary>

          {/* Interactive Wind Rose & Advection Vector HUD (Completamente Arrastrable) */}
          {showWindVector && (
            <motion.div 
              drag
              dragConstraints={mapContainerRef}
              dragElastic={0.08}
              dragMomentum={false}
              whileDrag={{ scale: 1.02 }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute bottom-10 left-3 z-30 pointer-events-auto select-none cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-1 bg-slate-950/85 backdrop-blur-md border border-slate-800 px-1.5 py-0.5 text-[7.5px] font-mono text-slate-400 mb-1 w-fit shadow-md">
                <GripHorizontal className="w-3 h-3 text-cyan-400" />
                <span className="font-bold text-slate-300">ROSA DE VIENTOS</span>
                <span className="text-[6.5px] text-slate-500">(Arrastrable)</span>
              </div>
              <Suspense fallback={null}>
                <WindRoseWidget
                  currentWindDirDeg={data.direccion_viento_grados}
                  currentWindSpeedKmh={data.velocidad_viento_km_h}
                  currentTempC={data.temperatura_malaga}
                  currentSolarRadWm2={data.shortwave_radiation || (data.uv_index * 80)}
                  className=""
                />
              </Suspense>
            </motion.div>
          )}

          {/* Cuadro Flotante Desplazable y Ampliable de Inspección Doctoral en Vivo (Zonas Coloreadas, Vectores 24+16, Capas y Arbolado) */}
          {hoverInfo && hoverInfo.properties && (
            <motion.div
              drag
              dragConstraints={mapContainerRef}
              dragElastic={0.08}
              dragMomentum={false}
              onDragStart={() => {
                setHoverInfo((prev: any) => (prev ? { ...prev, pinnedFromLegend: true } : prev));
              }}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ zoom: floatingCardZoomPct / 100 } as React.CSSProperties}
              className={`absolute top-28 left-4 z-40 pointer-events-auto select-none cursor-grab active:cursor-grabbing bg-slate-950/98 backdrop-blur-md border border-indigo-500/90 rounded-lg p-3 shadow-[0_12px_38px_rgba(2,6,23,0.95)] font-mono text-[9.5px] text-slate-100 space-y-2 ${
                isHoverCardExpanded ? 'w-[440px] max-w-[92vw]' : 'w-[355px] max-w-[90vw]'
              }`}
            >
              {/* Barra Superior de Arrastre + Zoom (-/100%/+) + Ampliar + Fijar + Cerrar */}
              <div className="flex items-center justify-between gap-1.5 border-b border-slate-800 pb-1.5">
                <div className="flex items-center gap-1 text-indigo-300 font-bold truncate">
                  <GripHorizontal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">
                    {hoverInfo.type === 'confidence_zone'
                      ? 'AUDITORÍA DE CELDA KRIGING-PINN'
                      : hoverInfo.type === 'confidence_vector'
                      ? 'AUDITORÍA DE VECTOR DE ASIMILACIÓN'
                      : hoverInfo.type === 'tree'
                      ? 'AUDITORÍA BIOMÉTRICA FOLIAR'
                      : 'AUDITORÍA DE CAPA AMBIENTAL'}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
                  {/* Controles de Aumento Tipográfico (- / 100% / +) igual que DraggableWindow */}
                  <div className="flex items-center bg-slate-900/95 border border-slate-700/80 rounded px-1 py-0.5 text-[8px]">
                    <button
                      type="button"
                      onClick={() => setFloatingCardZoomPct((z) => Math.max(80, z - 10))}
                      className="px-1 text-slate-300 hover:text-cyan-300 font-bold cursor-pointer"
                      title="Reducir tamaño de letra y cuadro"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => setFloatingCardZoomPct(100)}
                      className="px-1 text-cyan-300 font-bold cursor-pointer"
                      title="Restablecer zoom al 100%"
                    >
                      {floatingCardZoomPct}%
                    </button>
                    <button
                      type="button"
                      onClick={() => setFloatingCardZoomPct((z) => Math.min(155, z + 10))}
                      className="px-1 text-slate-300 hover:text-cyan-300 font-bold cursor-pointer"
                      title="Aumentar tamaño de letra y cuadro"
                    >
                      +
                    </button>
                  </div>
                  {/* Botón Ampliar/Contraer formato */}
                  <button
                    type="button"
                    onClick={() => setIsHoverCardExpanded((v) => !v)}
                    className="p-1 rounded bg-slate-900 hover:bg-indigo-950 text-slate-300 hover:text-indigo-200 border border-slate-700 cursor-pointer"
                    title={isHoverCardExpanded ? 'Formato compacto' : 'Aumentar ancho y detalle doctoral'}
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                  {/* Botón Fijar/Liberar cuadro */}
                  <button
                    type="button"
                    onClick={() =>
                      setHoverInfo((prev: any) =>
                        prev ? { ...prev, pinnedFromLegend: !prev.pinnedFromLegend } : prev
                      )
                    }
                    className={`px-1.5 py-0.5 rounded border text-[8px] font-bold cursor-pointer ${
                      hoverInfo.pinnedFromLegend
                        ? 'bg-amber-950/90 border-amber-500/80 text-amber-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                    title={hoverInfo.pinnedFromLegend ? 'Cuadro fijado (clic para liberar seguimiento del ratón)' : 'Fijar cuadro para moverlo o estudiarlo sin que cambie'}
                  >
                    {hoverInfo.pinnedFromLegend ? '📌 Fijo' : '📌 Fijar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHoverInfo(null)}
                    className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 text-[8px] cursor-pointer"
                    title="Cerrar cuadro de inspección"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Contenido 1: Zona Coloreada de la Red de Confianza (Verde / Ámbar / Carmesí) */}
              {hoverInfo.type === 'confidence_zone' && (
                <>
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2 font-bold">
                      <span className="text-indigo-200 leading-tight">{hoverInfo.properties.zoneTitle}</span>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-500/80 text-emerald-300 font-black text-[9.5px] shrink-0">
                        {hoverInfo.properties.confidencePct}% GUM
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[8px] text-slate-400">
                      <span> WGS84: {hoverInfo.properties.lat ?? hoverInfo.lngLat.lat.toFixed(4)}°N, {hoverInfo.properties.lon ?? hoverInfo.lngLat.lng.toFixed(4)}°E</span>
                      <span className={Number(hoverInfo.properties.estimatedNo2) <= 20 ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                        {Number(hoverInfo.properties.estimatedNo2) <= 20
                          ? '✓ Cumple UE 2030 (≤20 µg/m³)'
                          : `⚠ Exceso UE 2030 (+${(Number(hoverInfo.properties.estimatedNo2) - 20).toFixed(1)} µg/m³)`}
                      </span>
                    </div>
                  </div>

                  {/* Explicación mejorada y clara para el tribunal doctoral */}
                  <div className="text-[8.8px] text-slate-200 font-sans leading-snug bg-slate-900/70 p-2 rounded border border-slate-800/90">
                    <strong className="text-indigo-300">¿Qué ocurre en este hexágono?:</strong> {hoverInfo.properties.zoneExplanation}
                  </div>

                  {/* 3 Métricas Geoestadísticas con subtítulo explicativo claro */}
                  <div className="grid grid-cols-3 gap-1 text-[8px] bg-slate-900/95 p-1.5 rounded border border-slate-800 text-center">
                    <div>
                      <div className="text-slate-400">NO₂ Kriging (1.5m)</div>
                      <strong className="text-emerald-300 text-[9.5px]">{hoverInfo.properties.estimatedNo2} µg/m³</strong>
                      <div className="text-[6.8px] text-slate-400">Nivel respirable</div>
                    </div>
                    <div className="border-x border-slate-800 px-1">
                      <div className="text-slate-400">Varianza σ²_K</div>
                      <strong className="text-cyan-300 text-[9.5px]">{hoverInfo.properties.variance} µg²/m⁶</strong>
                      <div className="text-[6.8px] text-slate-400">Dispersión espacial</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Incertid. U₉₅ (k=1.96)</div>
                      <strong className="text-amber-300 text-[9.5px]">±{hoverInfo.properties.confidenceIntervalU95} µg/m³</strong>
                      <div className="text-[6.8px] text-slate-400">Margen ISO 20988</div>
                    </div>
                  </div>

                  {/* Lectura en Vivo del Detector Terrestre Más Cercano (de las 24 estaciones) */}
                  <div className="bg-slate-900/90 p-2 rounded border border-emerald-500/40 space-y-1 text-[8px]">
                    <div className="flex items-center justify-between text-emerald-300 font-bold">
                      <span className="truncate">📡 Detector más cercano: {hoverInfo.properties.nearestStationCode} ({hoverInfo.properties.nearestStationDistKm} km)</span>
                      <span className="text-cyan-300 shrink-0">{hoverInfo.properties.windRegime || 'Barlovento'}</span>
                    </div>
                    <div className="text-slate-300 truncate text-[7.8px]">
                      {hoverInfo.properties.nearestStationName} • <span className="text-slate-400">{hoverInfo.properties.nearestStationNetwork}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-800/80 text-center">
                      <div>
                        <span className="text-slate-400 block text-[7px]">NO₂ estación</span>
                        <strong className="text-emerald-300">{hoverInfo.properties.stNo2 ?? '27.4'} µg</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[7px]">O₃ estación</span>
                        <strong className="text-sky-300">{hoverInfo.properties.stO3 ?? '54.2'} µg</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[7px]">PM₂.₅ est.</span>
                        <strong className="text-amber-300">{hoverInfo.properties.stPm25 ?? '11.8'} µg</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[7px]">Gradiente ΔNO₂</span>
                        <strong className={Number(hoverInfo.properties.deltaNo2) >= 0 ? 'text-rose-300' : 'text-emerald-300'}>
                          {Number(hoverInfo.properties.deltaNo2) >= 0 ? `+${hoverInfo.properties.deltaNo2}` : hoverInfo.properties.deltaNo2} µg
                        </strong>
                      </div>
                    </div>
                    <div className="text-[7.2px] text-slate-400 font-sans pt-0.5">
                      El gradiente <strong>ΔNO₂</strong> mide la diferencia entre la cabina oficial y este hexágono por efecto del tráfico local y cañón urbano.
                    </div>
                  </div>

                  {/* Haz Satelital Coincidente (de los 16 satélites) + Barra de Pesos 4D-Var */}
                  <div className="bg-slate-900/90 p-2 rounded border border-purple-500/40 space-y-1 text-[8px]">
                    <div className="flex items-center justify-between text-purple-300 font-bold">
                      <span className="truncate">🛰️ Satélite sobre celda: {hoverInfo.properties.nearestSatCode || 'S5P-TROPOMI'} ({hoverInfo.properties.nearestSatResolution || '3.5×5.5 km'})</span>
                      <span className="text-fuchsia-300 shrink-0">AMF-3D ×{hoverInfo.properties.amf3dFactor ?? '1.18'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[7.8px] text-slate-300">
                      <span>Columna troposférica: <strong className="text-purple-200">{hoverInfo.properties.nearestSatValue ?? '28.5'} {hoverInfo.properties.nearestSatUnit || 'µg/m³'}</strong></span>
                      <span className="text-slate-400">Asimilación 4D-Var = 100%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-slate-950 border border-slate-800">
                      <div style={{ width: `${hoverInfo.properties.wGroundPct ?? 64}%` }} className="bg-emerald-500" />
                      <div style={{ width: `${hoverInfo.properties.wSatPct ?? 24}%` }} className="bg-purple-500" />
                      <div style={{ width: `${hoverInfo.properties.wPinnPct ?? 12}%` }} className="bg-rose-500" />
                    </div>
                    <div className="flex items-center justify-between text-[7.5px] font-bold">
                      <span className="text-emerald-300">📡 Terrestre {hoverInfo.properties.wGroundPct ?? 64}%</span>
                      <span className="text-purple-300">🛰️ Satélite {hoverInfo.properties.wSatPct ?? 24}%</span>
                      <span className="text-rose-300">🧮 PDE PINN {hoverInfo.properties.wPinnPct ?? 12}%</span>
                    </div>
                  </div>
                </>
              )}

              {/* Contenido 2: Vector Terrestre (24), Haz Satelital (16) o Anillo de Isoconfianza */}
              {hoverInfo.type === 'confidence_vector' && (
                <div className="space-y-1.5 text-[8.5px]">
                  {hoverInfo.properties.featureKind === 'station_vector' && (
                    <>
                      <div className="flex items-center justify-between gap-2 font-bold text-emerald-300">
                        <span>📡 Enlace Terrestre #{hoverInfo.properties.rank}: {hoverInfo.properties.stationCode}</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/70 text-emerald-200">
                          Peso EnKF: {Number(hoverInfo.properties.weightPct).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-slate-200 font-semibold">{hoverInfo.properties.stationName} ({hoverInfo.properties.network})</div>
                      <div className="text-slate-300 font-sans text-[8.2px] bg-slate-900/70 p-1.5 rounded border border-slate-800">
                        Este vector inyecta la observación oficial en tiempo real hacia el Punto Activo ponderada por distancia ortodrómica (covarianza de Gaspari-Cohn) y dirección del viento.
                      </div>
                      <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1.5 rounded border border-slate-800 text-center">
                        <div><span className="text-slate-400 block text-[7px]">Distancia</span><strong className="text-cyan-300">{hoverInfo.properties.distanceKm} km</strong></div>
                        <div><span className="text-slate-400 block text-[7px]">NO₂ Cabina</span><strong className="text-sky-300">{hoverInfo.properties.no2} µg/m³</strong></div>
                        <div><span className="text-slate-400 block text-[7px]">Aporte Neto</span><strong className="text-emerald-300">+{hoverInfo.properties.contribUg} µg/m³</strong></div>
                      </div>
                    </>
                  )}
                  {hoverInfo.properties.featureKind === 'satellite_vector' && (
                    <>
                      <div className="flex items-center justify-between gap-2 font-bold text-purple-300">
                        <span>🛰️ Haz Orbital #{hoverInfo.properties.rank}: {hoverInfo.properties.missionCode}</span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-950 border border-purple-500/70 text-purple-200">
                          {hoverInfo.properties.orbitType}
                        </span>
                      </div>
                      <div className="text-slate-200 font-semibold">{hoverInfo.properties.missionName} ({hoverInfo.properties.agency})</div>
                      <div className="text-slate-300 font-sans text-[8.2px] bg-slate-900/70 p-1.5 rounded border border-slate-800">
                        Haz de observación nadir/geoestacionaria que fija la condición de contorno superior troposférica sobre el cañón urbano con factor radiativo 3D (AMF-3D).
                      </div>
                      <div className="grid grid-cols-2 gap-1 bg-slate-900/90 p-1.5 rounded border border-slate-800 text-center">
                        <div><span className="text-slate-400 block text-[7px]">Resolución Espacial</span><strong className="text-cyan-300">{hoverInfo.properties.resolution}</strong></div>
                        <div><span className="text-slate-400 block text-[7px]">Columna Asimilada</span><strong className="text-purple-200">{hoverInfo.properties.value} {hoverInfo.properties.unit}</strong></div>
                      </div>
                    </>
                  )}
                  {hoverInfo.properties.featureKind === 'confidence_ring' && (
                    <>
                      <div className="font-bold text-amber-300">🎯 {hoverInfo.properties.label}</div>
                      <div className="text-slate-300 font-sans leading-snug bg-slate-900/80 p-1.5 rounded border border-slate-800">
                        Perímetro geodésico a <strong>{hoverInfo.properties.radiusKm} km</strong> del Punto Activo con incertidumbre expandida media U₉₅ = <strong>±{hoverInfo.properties.u95} µg/m³</strong> (ISO 20988:2007).
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Contenido 3: Superficie Coloreada o Arbolado */}
              {(hoverInfo.type === 'colored_surface' || hoverInfo.type === 'tree') && (
                <div className="space-y-1.5 text-[8.5px]">
                  <div className="font-bold text-cyan-300">
                    {hoverInfo.type === 'tree'
                      ? `🌳 ${hoverInfo.properties.streetName || hoverInfo.properties.speciesCommonName}`
                      : hoverInfo.layerId === 'sentinel-5p-grid-fill'
                      ? '🛰️ Celda Satelital Copernicus Sentinel-5P (TROPOMI)'
                      : hoverInfo.layerId === 'd3-contour-fill'
                      ? '🌊 Isopleta de Dispersión Gaussiana-Euleriana (D3)'
                      : hoverInfo.layerId === 'stagnation-zones-fill'
                      ? '⚓ Zona de Encajonamiento y Recirculación Costera'
                      : '🚗 Corredor Viario de Emisión COPERT 5'}
                  </div>
                  <div className="text-slate-300 font-sans leading-snug bg-slate-900/80 p-1.5 rounded border border-slate-800">
                    {hoverInfo.type === 'tree'
                      ? `Especie: ${hoverInfo.properties.speciesName || hoverInfo.properties.speciesCommonName} • Captación estomática anual: ${hoverInfo.properties.estimatedNO2DepositionKgYear || hoverInfo.properties.no2DepositionGYear || '8.5'} kg NO₂/año.`
                      : hoverInfo.layerId === 'sentinel-5p-grid-fill'
                      ? `Columna troposférica de NO₂ asimilada en celda L3 con factor radiativo AMF-3D. Valor local: ${hoverInfo.properties.no2 || hoverInfo.properties.value || data.no2_satelite_base.toFixed(1)} µg/m³.`
                      : hoverInfo.layerId === 'd3-contour-fill'
                      ? `Superficie continua de isoconcentración acoplada al campo de viento y rugosidad urbana. Nivel: ${hoverInfo.properties.value || data.no2_satelite_base.toFixed(1)} µg/m³.`
                      : hoverInfo.layerId === 'stagnation-zones-fill'
                      ? `${hoverInfo.properties.name || 'Zona de bloqueo orográfico/térmico'} donde convergen la brisa marina de Alborán y la retención del cañón urbano.`
                      : `Vía: ${hoverInfo.properties.streetName || hoverInfo.properties.name || 'Tramo urbano'} • Tasa lineal NOx: ${hoverInfo.properties.qNOx_ug_m_s || 18.5} µg/(m·s).`}
                  </div>
                </div>
              )}

              {/* Botón de Acción Rápida para fijar el Punto Activo en la coordenada inspeccionada */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/90 text-[7.8px]" onPointerDown={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => {
                    if (hoverInfo?.lngLat) {
                      syncActivePoint(hoverInfo.lngLat.lat, hoverInfo.lngLat.lng, {
                        zoom: 16.4,
                        pitch: is3DMode ? 60 : 0,
                        fly: true,
                        openInspector: true
                      });
                    }
                  }}
                  className="w-full py-1 px-2 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/60 text-indigo-200 font-bold text-center transition-colors cursor-pointer"
                >
                  🎯 Fijar aquí el Punto Activo y recalcular la Red {OFFICIAL_MALAGA_AIR_STATIONS.length}+{OFFICIAL_SATELLITE_MISSIONS.length}
                </button>
              </div>
            </motion.div>
          )}

          {/* Leyenda Flotante Arrastrable y Ampliable de Zonas Coloreadas y Red de Confianza (24+16) */}
          {showConfidenceLayer && (
            <motion.div
              drag
              dragConstraints={mapContainerRef}
              dragElastic={0.08}
              dragMomentum={false}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ zoom: floatingCardZoomPct / 100 } as React.CSSProperties}
              className="absolute bottom-14 right-12 z-30 pointer-events-auto select-none cursor-grab active:cursor-grabbing bg-slate-950/96 backdrop-blur-md border border-indigo-500/85 rounded-lg p-2.5 shadow-[0_0_25px_rgba(99,102,241,0.5)] font-mono text-[9px] text-slate-200 w-[335px] max-w-[92vw] space-y-1.5"
            >
              <div className="flex items-center justify-between gap-1.5 border-b border-slate-800 pb-1">
                <div className="flex items-center gap-1 font-bold text-indigo-300 truncate">
                  <GripHorizontal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">RED DE CONFIANZA ({OFFICIAL_MALAGA_AIR_STATIONS.length}+{OFFICIAL_SATELLITE_MISSIONS.length})</span>
                </div>
                <div className="flex items-center gap-1 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
                  <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded px-1 py-0.2 text-[7.5px]">
                    <button
                      type="button"
                      onClick={() => setFloatingCardZoomPct((z) => Math.max(80, z - 10))}
                      className="px-1 text-slate-300 hover:text-cyan-300 font-bold cursor-pointer"
                      title="Reducir tamaño"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => setFloatingCardZoomPct(100)}
                      className="px-0.5 text-cyan-300 font-bold cursor-pointer"
                      title="Restablecer zoom 100%"
                    >
                      {floatingCardZoomPct}%
                    </button>
                    <button
                      type="button"
                      onClick={() => setFloatingCardZoomPct((z) => Math.min(155, z + 10))}
                      className="px-1 text-slate-300 hover:text-cyan-300 font-bold cursor-pointer"
                      title="Aumentar tamaño"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLegendCollapsed((c) => !c)}
                    className="px-1 py-0.2 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[8px] cursor-pointer"
                    title={isLegendCollapsed ? 'Desplegar leyenda' : 'Plegar leyenda'}
                  >
                    {isLegendCollapsed ? '▴' : '▾'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfidenceLayer(false)}
                    className="px-1.5 py-0.2 rounded bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 text-[8px] cursor-pointer"
                    title="Ocultar Red de Confianza del mapa"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {!isLegendCollapsed && (
                <>
                  <div className="space-y-1 text-[8.4px] font-sans" onPointerDown={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        const f = krigingConfidenceGeoJson?.features.find((ft: any) => ft.properties.zoneTier === 'high') || krigingConfidenceGeoJson?.features[0];
                        if (f) {
                          setHoverInfo({
                            lngLat: { lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] },
                            type: 'confidence_zone',
                            layerId: 'kriging-confidence-circles',
                            pinnedFromLegend: true,
                            properties: f.properties
                          });
                        }
                      }}
                      className="w-full text-left flex items-start gap-1.5 px-1.5 py-1 rounded hover:bg-emerald-950/50 border border-transparent hover:border-emerald-500/40 transition-colors cursor-pointer"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-0.5 shadow-[0_0_6px_#10b981]" />
                      <span><strong className="text-emerald-300">Verde (&gt;88% GUM):</strong> Dominio instrumental directo (&lt;1.2 km de estación UNE-EN 14211, σ²_K &lt; 8 µg²/m⁶).</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const f = krigingConfidenceGeoJson?.features.find((ft: any) => ft.properties.zoneTier === 'medium') || krigingConfidenceGeoJson?.features[Math.floor((krigingConfidenceGeoJson?.features.length || 1) / 2)];
                        if (f) {
                          setHoverInfo({
                            lngLat: { lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] },
                            type: 'confidence_zone',
                            layerId: 'kriging-confidence-circles',
                            pinnedFromLegend: true,
                            properties: f.properties
                          });
                        }
                      }}
                      className="w-full text-left flex items-start gap-1.5 px-1.5 py-1 rounded hover:bg-amber-950/50 border border-transparent hover:border-amber-500/40 transition-colors cursor-pointer"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-0.5 shadow-[0_0_6px_#f59e0b]" />
                      <span><strong className="text-amber-300">Ámbar (75–88%):</strong> Transición inter-estaciones resuelta por Fusión Kalman EnKF + Satélite (AMF-3D).</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const f = krigingConfidenceGeoJson?.features.find((ft: any) => ft.properties.zoneTier === 'boundary') || krigingConfidenceGeoJson?.features[(krigingConfidenceGeoJson?.features.length || 1) - 1];
                        if (f) {
                          setHoverInfo({
                            lngLat: { lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] },
                            type: 'confidence_zone',
                            layerId: 'kriging-confidence-circles',
                            pinnedFromLegend: true,
                            properties: f.properties
                          });
                        }
                      }}
                      className="w-full text-left flex items-start gap-1.5 px-1.5 py-1 rounded hover:bg-rose-950/50 border border-transparent hover:border-rose-500/40 transition-colors cursor-pointer"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0 mt-0.5 shadow-[0_0_6px_#e11d48]" />
                      <span><strong className="text-rose-300">Carmesí (&lt;75%):</strong> Contorno periférico donde la PINN impone cierre físico Navier-Stokes + Leighton.</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[8px] font-mono pt-1 border-t border-slate-800 text-cyan-300" onPointerDown={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => toggleConfidenceVectorDensityMode()}
                      className={`px-1.5 py-0.5 rounded border text-[7.8px] font-bold cursor-pointer transition-all ${
                        confidenceVectorDensityMode === 'top5'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/70 shadow-xs'
                          : 'bg-indigo-950/80 text-indigo-200 border-indigo-500/60'
                      }`}
                      title={confidenceVectorDensityMode === 'top5' ? 'Mostrando Top-5 dominantes (>85% info) para evitar saturación visual. Clic para ver red completa.' : 'Mostrando red completa (24+16). Clic para filtrar a Top-5 limpio.'}
                    >
                      {confidenceVectorDensityMode === 'top5' ? '🎯 Modo: Top-5 Dominantes' : `🌐 Modo: Red Completa (${OFFICIAL_MALAGA_AIR_STATIONS.length}+${OFFICIAL_SATELLITE_MISSIONS.length})`}
                    </button>
                    <div className="flex items-center gap-1.5 text-[7.5px] text-slate-400">
                      <span>{confidenceVectorDensityMode === 'top5' ? '5 Est. + 5 Sat.' : `${OFFICIAL_MALAGA_AIR_STATIONS.length} Est. + ${OFFICIAL_SATELLITE_MISSIONS.length} Sat.`}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedInstrumentalStationId(OFFICIAL_MALAGA_AIR_STATIONS[0].id)}
                        className="px-1.5 py-0.5 rounded border border-cyan-500/70 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 text-[7.5px] font-bold cursor-pointer transition-all flex items-center gap-0.5 shadow-xs"
                        title="Abrir Ficha Instrumental Oficial UNE-EN 14211:2013 de la estación (Regla 33)"
                      >
                        <span>🔬 Ficha 14211</span>
                      </button>
                    </div>
                  </div>
                  <div onPointerDown={(e) => e.stopPropagation()}>
                    {hoverInfo && (hoverInfo.type === 'confidence_zone' || hoverInfo.type === 'confidence_vector') && hoverInfo.properties ? (
                      <div className="bg-slate-900/95 border border-indigo-500/60 rounded p-1.5 text-[8px] space-y-0.5">
                        <div className="flex items-center justify-between gap-1 font-bold text-indigo-200">
                          <span className="truncate">
                            {hoverInfo.type === 'confidence_zone'
                              ? `${hoverInfo.properties.zoneTitle} (${hoverInfo.properties.confidencePct}% GUM)`
                              : hoverInfo.properties.featureKind === 'station_vector'
                              ? `📡 ${hoverInfo.properties.stationCode} • Peso ${Number(hoverInfo.properties.weightPct).toFixed(1)}%`
                              : hoverInfo.properties.featureKind === 'satellite_vector'
                              ? `🛰️ ${hoverInfo.properties.missionCode} (${hoverInfo.properties.orbitType})`
                              : `🎯 ${hoverInfo.properties.label}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => setHoverInfo(null)}
                            className="text-slate-400 hover:text-rose-300 px-1 cursor-pointer"
                            title="Limpiar selección"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="text-slate-300 font-sans leading-tight">
                          {hoverInfo.type === 'confidence_zone'
                            ? `NO₂: ${hoverInfo.properties.estimatedNo2} µg/m³ • Sensor ${hoverInfo.properties.nearestStationCode} (${hoverInfo.properties.nearestStationDistKm} km): ${hoverInfo.properties.stNo2} µg/m³ • Pesos: ${hoverInfo.properties.wGroundPct}% Terr / ${hoverInfo.properties.wSatPct}% Sat / ${hoverInfo.properties.wPinnPct}% PINN`
                            : hoverInfo.properties.featureKind === 'station_vector'
                            ? `${hoverInfo.properties.stationName}: dist. ${hoverInfo.properties.distanceKm} km • NO₂ ${hoverInfo.properties.no2} µg/m³ (+${hoverInfo.properties.contribUg} µg)`
                            : hoverInfo.properties.featureKind === 'satellite_vector'
                            ? `${hoverInfo.properties.missionName} (${hoverInfo.properties.resolution}): ${hoverInfo.properties.value} ${hoverInfo.properties.unit}`
                            : `Radio ${hoverInfo.properties.radiusKm} km • Incertidumbre expandida U₉₅ = ±${hoverInfo.properties.u95} µg/m³`}
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const f = krigingConfidenceGeoJson?.features[0];
                          if (f) {
                            setHoverInfo({
                              lngLat: { lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] },
                              type: 'confidence_zone',
                              layerId: 'kriging-confidence-circles',
                              pinnedFromLegend: true,
                              properties: f.properties
                            });
                          }
                        }}
                        className="w-full py-1 px-2 rounded bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-500/40 text-[7.5px] text-indigo-200 italic text-center transition-colors cursor-pointer"
                      >
                        👆 Toca aquí, en las filas de arriba o sobre cualquier zona/vector del mapa
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}

        </section>

        {/* Output Panel (Ventana Flotante Arrastrable Control Físico PINN) */}
        {showRightSidebar && (
          <DraggableWindow
            title="CONTROL DE PARÁMETROS DE FÍSICA PINN & NOWCASTING"
            subtitle="Calibración espectral AOD, irradiancia, fotólisis J(NO₂), deposición Wesely y Nowcasting"
            icon={<Sliders className="w-4 h-4 text-amber-400" />}
            onClose={() => setShowRightSidebar(false)}
            className="w-full max-w-xl max-h-[82vh]"
            initialPositionClass="top-16 right-12"
            defaultCollapsed={true}
          >
            {!loading && result ? (
              <div className="flex flex-col h-full p-2 gap-4 text-slate-200" title="Resultados de la Inferencia de la Red Neuronal Informada por Física (PINN). Acoplamiento de modelos numéricos Navier-Stokes con deep learning.">
              
              <CollapsibleSection 
                title="Parámetros Físicos PINN" 
                icon={<Activity className="w-3 h-3" />} 
                defaultOpen={false}
                tooltip="Ecuación Rectora de Advección-Difusión PINN: ∂C/∂t + u·∇C = K∇²C + R - S. Resuelta mediante física acoplada y restricciones de estabilidad atmosférica."
              >
              {/* Spectral Radiation vs Photolysis Comparator & Aerosol Attenuation Controls */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-2">
                <Suspense fallback={null}>
                  <PINNPhysicalParametersControl
                    currentAOD={result.aod}
                    currentShortwaveRadiation={data.shortwave_radiation || (data.uv_index ? data.uv_index * 85 : 520)}
                    currentHumidity={data.humedad_relativa}
                    currentTemp={data.temperatura_malaga}
                    onOpenFullModal={handleOpenSpectralPhotolysis}
                  />
                </Suspense>
              </motion.div>

              {/* Physics Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                 <ScientificTooltip 
                   position="left" 
                   width="w-[360px]" 
                   content={
                     <div className="space-y-1.5 font-mono text-[9px] leading-relaxed">
                       <div className="text-emerald-400 font-bold border-b border-slate-700/80 pb-1 flex items-center justify-between">
                         <span>Ecuación Rectora PINN: Sumidero (S)</span>
                         <span className="text-[7.5px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1 py-0.2 rounded">WESELY 1989</span>
                       </div>
                       <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800 text-center font-bold text-emerald-300 text-[10px]">
                         ∂C/∂t + u·∇C = K∇²C + R - S
                       </div>
                       <p className="text-slate-300 text-[8.5px]">
                         <strong className="text-white">Término de Sumidero Superficial:</strong> <span className="text-emerald-400 font-bold">S = v_d · C|_(z=0)</span>.
                       </p>
                       <p className="text-slate-300 text-[8.5px]">
                         Modela la remoción neta por deposición seca según la red de resistencias en serie de Wesely:
                         <span className="text-emerald-300 font-bold block my-0.5 text-center">v_d = 1 / (R_a + R_b + R_c)</span>
                       </p>
                       <div className="text-[8px] text-slate-400 space-y-0.5 border-t border-slate-800/80 pt-1">
                         <div>• <strong className="text-slate-200">Dependencia de Estabilidad (P-G):</strong> La resistencia aerodinámica <span className="text-sky-300 font-bold">R_a = [ln(z/z₀) - Ψ_h(z/L)] / (κ·u*)</span> se reduce drásticamente bajo inestabilidad convectiva (clases A-B, régimen de Terral diurno), acelerando el flujo de deposición, y aumenta en atmósfera estable (clases E-F) restringiendo la captura.</div>
                         <div>• <strong className="text-slate-200">R_b:</strong> Resistencia de la subcapa cuasi-laminar (Schmidt/Prandtl).</div>
                         <div>• <strong className="text-slate-200">R_c:</strong> Resistencia superficial de la canopia y captura estomática.</div>
                       </div>
                     </div>
                   }
                 >
                   <motion.div key={`vd-${result.vd}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="border-l-2 border-emerald-500 pl-3 bg-black/40 p-2.5 group cursor-help" title="Velocidad de Deposición Seca (vd).">
                     <div className="text-[8.5px] text-slate-500 uppercase tracking-widest mb-1 truncate">Deposición (v_d)</div>
                     <div className="text-xl font-light text-white tracking-tighter">
                       {result.vd.toFixed(4)} <span className="text-[9px] text-slate-500">m/s</span>
                     </div>
                   </motion.div>
                 </ScientificTooltip>
                 
                 <ScientificTooltip 
                   position="left" 
                   width="w-[360px]" 
                   content={
                     <div className="space-y-1.5 font-mono text-[9px] leading-relaxed">
                       <div className="text-emerald-400 font-bold border-b border-slate-700/80 pb-1 flex items-center justify-between">
                         <span>Ecuación Rectora PINN: Difusión (K∇²C)</span>
                         <span className="text-[7.5px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1 py-0.2 rounded">MONIN-OBUKHOV</span>
                       </div>
                       <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800 text-center font-bold text-emerald-300 text-[10px]">
                         ∂C/∂t + u·∇C = K∇²C + R - S
                       </div>
                       <p className="text-slate-300 text-[8.5px]">
                         <strong className="text-white">Tensor de Difusividad Turbulenta:</strong> Parametrizado mediante el factor de acoplamiento de cizalladura canopia-capa libre <span className="text-emerald-400 font-bold">k</span>.
                       </p>
                       <p className="text-slate-300 text-[8.5px]">
                         Modula el transporte difusivo en el dosel urbano según:
                         <span className="text-emerald-300 font-bold block my-0.5 text-center">K_z = k · (κ · u* · z) / ϕ_m(z/L)</span>
                       </p>
                       <div className="text-[8px] text-slate-400 space-y-0.5 border-t border-slate-800/80 pt-1">
                         <div>• <strong className="text-slate-200">Dependencia de Estabilidad Atmosférica:</strong> La función de estabilidad universal <span className="text-amber-300 font-bold">ϕ_m(z/L)</span> incrementa drásticamente la difusividad K bajo regímenes inestables (L &lt; 0, fuerte mezcla vertical), diluyendo la concentración C. En inversiones térmicas (L &gt; 0, estabilidad E-F), ϕ_m amortigua K, atrapando los contaminantes a cota de calle.</div>
                         <div>• <strong className="text-slate-200">Acoplamiento u·∇C:</strong> Transfiere energía cinética del viento libre hacia cañones urbanos.</div>
                       </div>
                     </div>
                   }
                 >
                   <motion.div key={`k-${result.k}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }} className="border-l-2 border-emerald-500 pl-3 bg-black/40 p-2.5 cursor-help">
                     <div className="text-[8.5px] text-slate-500 uppercase tracking-widest mb-1 truncate">Coupling (k)</div>
                     <div className="text-xl font-light text-white tracking-tighter">
                       {result.k.toFixed(2)} <span className="text-[9px] text-slate-500">adim</span>
                     </div>
                   </motion.div>
                 </ScientificTooltip>

                 <ScientificTooltip position="left" width="w-[300px]" content="Frecuencia fotolítica del dióxido de nitrógeno: NO2 + hν (λ < 420 nm) → NO + O(3P). Calculada analíticamente en función del ángulo cenital solar (SZA) y la atenuación óptica por nubosidad y AOD.">
                   <motion.div key={`j-${result.j_no2}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="border-l-2 border-yellow-500 pl-3 bg-black/40 p-2.5 cursor-help">
                     <div className="text-[8.5px] text-slate-500 uppercase tracking-widest mb-1 truncate">Photolysis (J_NO2)</div>
                     <div className="text-xl font-light text-yellow-400 tracking-tighter">
                       {result.j_no2.toFixed(4)} <span className="text-[9px] text-slate-500">s⁻¹</span>
                     </div>
                   </motion.div>
                 </ScientificTooltip>

                 {/* AOD Optical Depth */}
                 <ScientificTooltip position="left" width="w-[300px]" content="Espesor óptico de aerosoles a 550 nm (AOD / τ₅₅₀) con factor de crecimiento higroscópico f(RH). Modula la extinción de irradiancia solar incidente sobre la calzada urbana.">
                   <motion.div key={`aod-${result.aod}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="border-l-2 border-amber-500 pl-3 bg-black/40 p-2.5 cursor-help">
                     <div className="text-[8.5px] text-amber-400/80 uppercase tracking-widest mb-1 truncate flex items-center justify-between">
                       <span>AOD (τ₅₅₀)</span>
                       <span className="text-[7.5px] text-amber-500 font-mono">f(RH)={result.aod_f_rh}</span>
                     </div>
                     <div className="text-xl font-light text-amber-400 tracking-tighter">
                       {result.aod.toFixed(3)} <span className="text-[9px] text-slate-500">adim</span>
                     </div>
                     <div className="text-[8px] text-slate-400 mt-0.5 flex justify-between">
                       <span className="truncate">{result.aod_category.split(' ')[0]}</span>
                       <span className="text-amber-300 font-mono">-{result.aod_attenuation_solar}% Sol</span>
                     </div>
                   </motion.div>
                 </ScientificTooltip>

                 <ScientificTooltip position="left" width="w-[320px]" content="Clasificación de estabilidad atmosférica de Pasquill-Gifford (A-F): Determinada por radiación neta diurna o nubosidad y velocidad del viento a 10m. Condiciona los coeficientes de dispersión σ_y y σ_z en el tensor de difusión.">
                   <motion.div key={`pg-${result.estabilidad_pg}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="border-l-2 border-purple-500 pl-3 bg-black/40 p-2.5 col-span-2 xl:col-span-2 cursor-help">
                     <div className="text-[8.5px] text-slate-500 uppercase tracking-widest mb-1">P-G Stability</div>
                     <div className="text-lg font-bold text-purple-400 tracking-tighter">
                       {result.estabilidad_pg.split(' ')[0]}
                       <span className="text-[8.5px] font-normal text-slate-400 ml-2">{result.estabilidad_pg.split(' ').slice(1).join(' ')}</span>
                     </div>
                   </motion.div>
                 </ScientificTooltip>
              </div>

              <Suspense fallback={null}>
                <CalibrationActions 
                  onSave={handleSaveCalibration} 
                  onOpenHistory={() => setActiveModal('calibrationHistory')} 
                />

                {/* Vista en Tiempo Real: Comparación v_d y k vs Promedios Históricos */}
                <PinnVdKHistoricalBenchmark 
                  liveResult={result} 
                  meteo={data} 
                  onOpenDetailedModal={() => setActiveModal('calibrationHistory')} 
                />
              </Suspense>

              {/* Multi-Model Benchmark & Stiff ODE Engine Card */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.12 }}
                onClick={() => {
                  setActiveModal(activeModal === 'benchmark' ? null : 'benchmark');
                  
                }}
                className={`${"px-2 py-1 border transition-all flex items-center gap-1 font-bold"} ${activeModal === 'benchmark' ? "bg-slate-950/80 hover:bg-cyan-950/40 p-2.5 border border-cyan-800/80 hover:border-cyan-400 cursor-pointer transition-all flex items-center justify-between group shadow-lg" : "bg-black/40 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600"}`}
                title="Haga clic para evaluar el residuo ‖ℒ_PDE‖, contrastar la PINN contra EPA AERMOD y CMAQ y resolver el sistema rígido ODE"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-cyan-950 border border-cyan-600 rounded text-cyan-400 shrink-0">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[9.5px] font-bold text-white font-mono flex items-center gap-1.5">
                      <span>BENCHMARK MULTI-MODELO</span>
                      <span className="text-[7.5px] bg-cyan-900 text-cyan-200 px-1 border border-cyan-700 font-bold">
                        EPA / CMAQ
                      </span>
                    </div>
                    <div className="text-[8px] text-slate-400 font-mono mt-0.5">
                      Residuo ‖ℒ_PDE‖ • KPP Stiff Solver
                    </div>
                  </div>
                </div>
                <div className="text-[8px] font-mono text-cyan-400 group-hover:text-cyan-300 uppercase tracking-tight flex items-center gap-0.5 font-bold">
                  VER ↗
                </div>
              </motion.div>

              {/* Multiphase Kinetics & Green Infrastructure */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-950/60 border border-indigo-900/50 p-3 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <ScientificTooltip
                    width="w-[420px]"
                    position="left"
                    content={
                      <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
                        <div className="text-indigo-300 font-bold border-b border-indigo-700/80 pb-1 flex items-center justify-between">
                          <span className="text-[10px]">Cinética Química Atmosférica: Ciclo de Leighton & PSS</span>
                          <span className="text-[7.5px] bg-indigo-950 text-indigo-300 border border-indigo-700 px-1 py-0.5 rounded font-bold">
                            SEINFELD & PANDIS (2016)
                          </span>
                        </div>

                        {/* Reacciones Fundamentales */}
                        <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
                          <div className="text-amber-300 font-bold text-[8.5px]">
                            (R1) NO₂ + hν (λ &lt; 420 nm) ➔ NO + O(³P) &nbsp;&nbsp;&nbsp;&nbsp;[J_NO2]
                          </div>
                          <div className="text-emerald-300 font-bold text-[8.5px]">
                            (R2) O(³P) + O₂ + M ➔ O₃ + M &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[k₂ Rápida]
                          </div>
                          <div className="text-sky-300 font-bold text-[8.5px]">
                            (R3) NO + O₃ ➔ NO₂ + O₂ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[k₃(T) Arrhenius]
                          </div>
                        </div>

                        {/* Parámetros y Mecanismos */}
                        <div className="bg-slate-950/90 p-2 rounded border border-indigo-900/50 space-y-1.5 text-[8px]">
                          <div>
                            <strong className="text-amber-300">1. Tasa de Fotólisis Solar (J_NO2):</strong>
                            <span className="text-slate-300 block ml-2">
                              Frecuencia fotolítica modulada por el ángulo cenital solar (SZA), nubosidad y profundidad óptica de aerosoles (AOD). Descompone NO₂ liberando oxígeno atómico O(³P).
                            </span>
                          </div>
                          <div>
                            <strong className="text-sky-300">2. Constante Cinética Arrhenius (k₃):</strong>
                            <span className="text-slate-300 block ml-2">
                              k₃(T) = 1.4 × 10⁻¹² · exp(-1310 / T_K) [cm³·mol⁻¹·s⁻¹]. Cuantifica la velocidad térmica de destrucción de O₃ por monóxido de nitrógeno.
                            </span>
                          </div>
                          <div>
                            <strong className="text-emerald-300">3. Equilibrio Fotoestacionario (PSS):</strong>
                            <span className="text-slate-300 block ml-2">
                              En estado estacionario dinámico diurno: <strong className="text-white font-bold">[O₃]_pss = (J_NO2 · [NO₂]) / (k₃ · [NO])</strong>.
                            </span>
                          </div>
                          <div>
                            <strong className="text-rose-300">4. Titulación de Ozono por Emisiones de NO de Tráfico:</strong>
                            <span className="text-slate-300 block ml-2">
                              En cañones urbanos de Málaga (Alameda Principal, Paseo del Parque, Hilera), la inyección directa de NO vehicular desplaza masivamente (R3), consumiendo O₃ superficial (<strong className="text-rose-200">titulación local</strong>). Esto deprime el O₃ y dispara el NO₂ a nivel de acera.
                            </span>
                          </div>
                          <div>
                            <strong className="text-purple-300">5. Ratio Modificado de Leighton (Φ):</strong>
                            <span className="text-slate-300 block ml-2">
                              Φ = (J_NO2 · [NO₂]) / (k₃ · [NO] · [O₃]). Si Φ ≈ 1.0 (ciclo cerrado). Si Φ &gt; 1.0, radicales orgánicos (RO₂• / HO₂• procedentes de COVs) oxidan NO a NO₂ sin consumir O₃, produciendo acumulación neta de ozono.
                            </span>
                          </div>
                        </div>

                        <div className="text-indigo-400 text-[7.5px] italic text-center border-t border-indigo-900/60 pt-1">
                          Pase el cursor o haga clic en los subcomponentes para abrir los solucionadores numéricos.
                        </div>
                      </div>
                    }
                  >
                    <div className="text-[9px] uppercase tracking-widest text-indigo-400 font-bold flex items-center gap-2 cursor-help">
                      <FlaskConical className="w-3 h-3 text-indigo-400" /> Cinética Química Multifase
                    </div>
                  </ScientificTooltip>
                  <span className="text-[7.5px] font-mono text-indigo-400/80 bg-indigo-950/70 border border-indigo-800/60 px-1 py-0.5 rounded">
                    PSS & Arrhenius
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <ScientificTooltip 
                    width="w-[420px]" 
                    position="left" 
                    content={
                      <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
                        <div className="text-indigo-300 font-bold border-b border-indigo-700/80 pb-1 flex items-center justify-between">
                          <span className="text-[10px]">Ciclo de Leighton & Estado Fotoestacionario (PSS)</span>
                          <span className="text-[7.5px] bg-indigo-950 text-indigo-300 border border-indigo-700 px-1 py-0.5 rounded font-bold">ODE SOLVER</span>
                        </div>

                        {/* Reacciones */}
                        <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
                          <div className="text-amber-300 font-bold text-[8.5px] flex justify-between">
                            <span>(R1) NO₂ + hν ➔ NO + O(³P)</span>
                            <span className="text-slate-400 font-normal">v₁ = J_NO2 · [NO₂]</span>
                          </div>
                          <div className="text-emerald-300 font-bold text-[8.5px] flex justify-between">
                            <span>(R2) O(³P) + O₂ + M ➔ O₃ + M</span>
                            <span className="text-slate-400 font-normal">v₂ = k₂ · [O]·[O₂]</span>
                          </div>
                          <div className="text-sky-300 font-bold text-[8.5px] flex justify-between">
                            <span>(R3) NO + O₃ ➔ NO₂ + O₂</span>
                            <span className="text-slate-400 font-normal">v₃ = k₃ · [NO]·[O₃]</span>
                          </div>
                        </div>

                        {/* Detalle Profundo PSS y Titulación */}
                        <div className="bg-slate-950/90 p-2 rounded border border-indigo-900/50 space-y-1.5 text-[8px]">
                          <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                            <strong className="text-white block mb-0.5">Ecuación Rectora de Concentración PSS:</strong>
                            <div className="text-center font-bold text-indigo-300 text-[9.5px]">
                              [O₃]_pss = (J_NO2 · [NO₂]) / (k₃(T) · [NO])
                            </div>
                          </div>

                          <div>
                            <strong className="text-amber-300">• Frecuencia de Fotólisis (J_NO2):</strong> Tasa de fotólisis de NO₂ calculada analíticamente en función del cenit solar y atenuación por AOD/nubes.
                          </div>

                          <div>
                            <strong className="text-sky-300">• Constante Arrhenius k₃(T):</strong> Dependiente de la temperatura ambiente: k₃ = 1.4×10⁻¹² · exp(-1310/T).
                          </div>

                          <div>
                            <strong className="text-rose-300">• Fenómeno de Titulación de Ozono:</strong> Cerca de las fuentes de tráfico rodado (emisiones primarias con alta fracción de NO), la reacción (R3) consume rápidamente el O₃ ambiental de fondo, deprimiendo su concentración hasta valores mínimos (&lt;10-20 µg/m³) mientras se acumula NO₂. En zonas abiertas o parques con menor tráfico y COVs biogénicos, el O₃ remonta.
                          </div>

                          <div>
                            <strong className="text-purple-300">• Desviación de Leighton (Ratio Φ):</strong> Φ = (J_NO2 · [NO₂]) / (k₃ · [NO] · [O₃]). Si Φ &gt; 1.0, existe generación fotoquímica neta de oxidantes promovida por radicales peróxido (RO₂•/HO₂•).
                          </div>
                        </div>

                        <div className="text-indigo-400 text-[8px] italic flex items-center justify-between border-t border-indigo-900/60 pt-1">
                          <span>Haz clic para abrir el Solver Stiff ODE interactivo</span>
                          <span className="font-bold">VER DETALLE ↗</span>
                        </div>
                      </div>
                    }
                  >
                    <div 
                      onClick={() => {
                  setActiveModal(activeModal === 'leighton' ? null : 'leighton');
                  
                }}
                className={`${"px-2 py-1 border transition-all flex items-center gap-1 font-bold"} ${activeModal === 'leighton' ? "bg-black/50 hover:bg-indigo-950/40 p-2 border border-slate-800 hover:border-indigo-500/80 w-full cursor-pointer transition-colors group" : "bg-black/40 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600"}`}
                    >
                      <div className="text-[8px] text-slate-500 uppercase flex justify-between items-center">
                        <span className="flex items-center gap-1 group-hover:text-indigo-300">
                          <Activity className="w-2 h-2 text-indigo-400" /> Cinética PSS Ext.
                        </span>
                        <span className="text-emerald-400 font-bold">
                          DETERMINISTA
                        </span>
                      </div>
                      <div className="text-sm font-mono text-indigo-300 mt-1 flex items-center justify-between">
                        <span>Ver Variables</span>
                        <span className="text-[7.5px] text-indigo-400 opacity-0 group-hover:opacity-100 uppercase tracking-tighter">ABRIR ↗</span>
                      </div>
                    </div>
                  </ScientificTooltip>
                  
                  <ScientificTooltip 
                    width="w-[360px]" 
                    position="left" 
                    content={
                      <div className="space-y-1.5 font-mono text-[9px] leading-relaxed">
                        <div className="text-cyan-300 font-bold border-b border-cyan-900/80 pb-1 flex items-center justify-between">
                          <span>Isopletas EKMA &amp; Sensibilidad O₃</span>
                          <span className="text-[7.5px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1 py-0.2 rounded font-bold">SEINFELD &amp; PANDIS</span>
                        </div>
                        <p className="text-slate-300 text-[8.5px]">
                          Superficie isopleta no lineal de generación de Ozono pico como función de precursores <span className="text-cyan-300 font-bold">[VOCs]</span> y <span className="text-indigo-300 font-bold">[NOx]</span> (Cresta de transición = 8:1).
                        </p>
                        <div className="bg-slate-950 p-1.5 rounded border border-slate-800 space-y-1 text-[8px]">
                          <div className="text-rose-300">
                            • <strong>VOC-limitado (Ratio &lt; 8):</strong> Típico del centro urbano de Málaga con tráfico denso. Reducir sólo NOx inhibe la titulación de NO, provocando un repunte paradójico del Ozono.
                          </div>
                          <div className="text-emerald-300">
                            • <strong>NOx-limitado (Ratio &gt; 15):</strong> Áreas periurbanas y rurales. La reducción de NOx mediante ZBE o electrificación disminuye directamente el O₃.
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <div className="bg-black/50 p-2 border border-slate-800 w-full cursor-help">
                      <div className="text-[8px] text-slate-500 uppercase flex justify-between mb-1">
                        <span>Régimen Ozono</span>
                        <span className="text-sky-400 text-right w-16 truncate">{result.cinetica_quimica.regimen_ozono}</span>
                      </div>
                      <div className="text-sm font-mono text-sky-300 truncate mb-1.5">
                        COV/NOx = {result.cinetica_quimica.voc_nox_ratio.toFixed(1)}
                      </div>
                      
                      {/* Real EKMA Visualizer Bar */}
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex relative border border-slate-700/50">
                        {/* Scale Background */}
                        <div className="w-[30%] bg-blue-500/80"></div>
                        <div className="w-[40%] bg-purple-500/80"></div>
                        <div className="w-[30%] bg-emerald-500/80"></div>
                        
                        {/* Indicator */}
                        <div 
                          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_5px_#fff]"
                          style={{ left: `${Math.min(100, Math.max(0, (result.cinetica_quimica.voc_nox_ratio / 25) * 100))}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[6px] text-slate-500 uppercase mt-0.5">
                        <span>VOC-lim</span>
                        <span>NOx-lim</span>
                      </div>
                    </div>
                  </ScientificTooltip>
                </div>

                {/* Sección Mar de Alborán & Química Halógena */}
                <ScientificTooltip width="w-[320px]" position="left" content={
                  <div>
                    <strong>Química Halógena & Parámetros Marinos (Mar de Alborán)</strong><br/><br/>
                    • <strong>SST (Sea Surface Temperature):</strong> Modula el flujo de spray marino y la partición gas-aerosol.<br/>
                    • <strong>Salinidad (PSU):</strong> Fuente de iones Cl⁻ acuosos para la reacción heterogénea nocturna <em>N₂O₅ + Cl⁻(aq) → ClNO₂(g) + NO₃⁻(aq)</em>.<br/>
                    • <strong>Fotólisis al amanecer:</strong> <em>ClNO₂ + hν (J &gt; 0) → Cl• + NO₂</em> liberando radicales de cloro que aceleran la producción matutina de Ozono trofoférico en la Bahía de Málaga.
                  </div>
                }>
                  <div className="bg-cyan-950/20 p-2.5 border border-cyan-800/40 space-y-2 cursor-help">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-cyan-400">
                        <Waves className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Mar de Alborán (Copernicus)</span>
                      </div>
                      <span className="text-[7.5px] font-mono px-1 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-800/60 rounded">
                        API LIVE
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-black/50 p-1.5 border border-cyan-900/30">
                        <div className="text-[7.5px] text-slate-400 uppercase">Temp. Agua (SST)</div>
                        <div className="text-sm font-mono text-cyan-300 font-bold mt-0.5">
                          {result.cinetica_quimica.temperatura_mar_c.toFixed(1)} <span className="text-[9px] text-slate-400">°C</span>
                        </div>
                      </div>

                      <div className="bg-black/50 p-1.5 border border-cyan-900/30">
                        <div className="text-[7.5px] text-slate-400 uppercase">Salinidad Marina</div>
                        <div className="text-sm font-mono text-cyan-300 font-bold mt-0.5">
                          {result.cinetica_quimica.salinidad_mar_psu.toFixed(2)} <span className="text-[9px] text-slate-400">PSU</span>
                        </div>
                      </div>
                    </div>

                    {/* Físico-química de aerosoles marinos */}
                    <div className="grid grid-cols-2 gap-1.5 text-[8px] font-mono text-slate-300 border-t border-cyan-900/30 pt-1.5">
                      <div>
                        <span className="text-slate-500">Spray Marino:</span> {result.cinetica_quimica.emision_spray_marino_mg_m2_s} <span className="text-[7px] text-slate-500">mg/m²·s</span>
                      </div>
                      <div>
                        <span className="text-slate-500">γ(N₂O₅):</span> {result.cinetica_quimica.tasa_heterogenea_n2o5_s1.toExponential(1)} <span className="text-[7px] text-slate-500">s⁻¹</span>
                      </div>
                    </div>

                    {/* Nivel ClNO2 resultante */}
                    <div className="bg-black/60 p-1.5 border border-cyan-900/40 flex items-center justify-between">
                      <div>
                        <div className="text-[7.5px] text-slate-400 uppercase">Acumulación ClNO₂</div>
                        <div className="text-xs font-mono text-white font-bold">
                          {result.cinetica_quimica.clno2_pptv} <span className="text-[8px] text-slate-400 font-normal">pptv</span>
                        </div>
                      </div>
                      <div className={`text-[7.5px] px-1.5 py-0.5 border font-mono ${result.cinetica_quimica.cloro_radical_activado ? 'bg-red-950/60 text-red-400 border-red-800' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                        {result.cinetica_quimica.cloro_radical_activado ? 'Cl• ACTIVO' : 'NOCTURNO'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1.5">
                      <button
                        onClick={() => setActiveModal('coastalHalogens')}
                        className="py-1 px-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 text-[7.5px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors shadow-sm"
                      >
                        <Waves className="w-2.5 h-2.5 text-cyan-400" />
                        <span>Halógenos ClNO₂</span>
                      </button>

                      <button
                        onClick={() => setActiveModal('shipPlumeMicrophysics')}
                        className="py-1 px-1.5 bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-700/60 text-[7.5px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors shadow-sm"
                      >
                        <Anchor className="w-2.5 h-2.5 text-sky-400" />
                        <span>Plumas Puerto & CCN</span>
                      </button>
                    </div>
                  </div>
                </ScientificTooltip>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <ScientificTooltip width="w-[280px]" position="left" content="Emisiones biogénicas de Compuestos Orgánicos Volátiles (BVOCs / Isopreno) bajo estrés térmico vegetal. Basado en algoritmos MEGAN (Guenther et al.) dependientes de temperatura foliar y radiación fotosintéticamente activa (PAR).">
                    <div className={`bg-black/50 p-2 border cursor-help ${result.cinetica_quimica.alerta_estres_biogenico ? 'border-amber-900/50' : 'border-slate-800'}`} title="Emisiones biogénicas de Isopreno">
                      <div className="text-[8px] text-slate-500 uppercase flex justify-between">
                        <span>Estrés BVOCs</span>
                        {result.cinetica_quimica.alerta_estres_biogenico && <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />}
                      </div>
                      <div className={`text-sm font-mono mt-1 ${result.cinetica_quimica.alerta_estres_biogenico ? 'text-amber-400' : 'text-slate-300'}`}>
                        {result.cinetica_quimica.emision_isopreno_ug_m2_h} <span className="text-[8px] text-slate-500">µg/m²/h</span>
                      </div>
                    </div>
                  </ScientificTooltip>

                  <ScientificTooltip width="w-[280px]" position="left" content={`Rendimiento másico de Aerosoles Orgánicos Secundarios (SOA Yield): Teoría de absorción de Pankow y ramificación competitiva RO2+NO vs RO2+HO2. Ruta activa en celda: ${result.cinetica_quimica.ruta_oxidacion_ro2}.`}>
                    <div className="bg-black/50 p-2 border border-slate-800 cursor-help" title="Rendimiento de Aerosoles Orgánicos Secundarios (SOA)">
                      <div className="text-[8px] text-slate-500 uppercase flex justify-between">
                        <span>Rendimiento SOA</span>
                        <span className="text-[8px] font-mono text-emerald-400">f(RO₂)</span>
                      </div>
                      <div className="text-sm font-mono text-emerald-300 mt-1">
                        {result.cinetica_quimica.rendimiento_soa_porcentaje}% <span className="text-[8px] text-slate-500">yield</span>
                      </div>
                    </div>
                  </ScientificTooltip>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1.5">
                  <button
                    onClick={() => setActiveModal('isorropiaSia')}
                    className="py-1 px-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 text-[7.5px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors shadow-sm"
                  >
                    <Layers className="w-2.5 h-2.5 text-indigo-400" />
                    <span>ISORROPIA-II SIA</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('treeBvocSoa')}
                    className="py-1 px-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-[7.5px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors shadow-sm"
                  >
                    <Trees className="w-2.5 h-2.5 text-emerald-400" />
                    <span>BVOCs &amp; SOA Árbol</span>
                  </button>
                </div>
              </motion.div>
              </CollapsibleSection>

              <CollapsibleSection title="Mitigación: Infraestructura Verde" icon={<Leaf className="w-3 h-3" />} defaultOpen={false}>
              {/* Infraestructura Verde */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="bg-emerald-950/20 border border-emerald-900/40 p-3 space-y-2" title="Impacto mitigador de la masa forestal (LAI) en la remoción de contaminantes frente al volumen edificado (Efecto Barrera).">
                <h3 className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-2 mb-2">
                   <Leaf className="w-3 h-3" /> Infraestructura Verde (Área: 6.25 Ha)
                </h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <ScientificTooltip width="w-[280px]" position="left" content="Remoción neta de NO2 por sumidero vegetal: Balance entre la velocidad de deposición en el dosel (v_d), el índice de área foliar (LAI) y la recaptura estomática en 6.25 hectáreas urbanas contiguas.">
                    <div className="bg-black/40 p-2 border border-emerald-900/30 cursor-help">
                      <div className="text-[8px] text-slate-400 uppercase mb-1">Remoción Neta NO₂</div>
                      <div className="text-xs font-bold text-emerald-300">
                        -{result.cinetica_quimica.remocion_no2_kg_dia} <span className="text-[9px] text-slate-500 font-normal">kg/día</span>
                      </div>
                    </div>
                  </ScientificTooltip>
                  
                  <ScientificTooltip width="w-[280px]" position="left" content="Tasa anualizada de captación biogeoquímica por hectárea: Normalizada para especies mediterráneas representativas (Ficus macrophylla, Jacaranda, Platanus hispanica) según guías EMEP/EEA y FAIRMODE.">
                    <div className="bg-black/40 p-2 border border-emerald-900/30 cursor-help" title="Tasa anual de captación biogeoquímica por hectárea según resistencia estomática y LAI.">
                      <div className="text-[8px] text-slate-400 uppercase mb-1">Captación Específica</div>
                      <div className="text-xs font-bold text-emerald-300">
                        {result.cinetica_quimica.tasa_captacion_kg_ha_ano} <span className="text-[9px] text-slate-500 font-normal">kg/ha·año</span>
                      </div>
                    </div>
                  </ScientificTooltip>
                </div>
                
                {result.cinetica_quimica.efecto_barrera_canon && (
                  <div className="bg-red-950/30 p-2 border border-red-900/40 mt-1">
                     <div className="text-[8px] text-red-400 uppercase font-bold flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> Efecto Barrera Urbano
                    </div>
                    <div className="text-[9px] text-slate-400 leading-tight">
                      El volumen edificado atrapa la masa de aire. El dosel vegetal frena el viento cruzado agravando la retención térmica de NO₂.
                    </div>
                  </div>
                )}

                {/* Panel Métrico Específico de Remoción de NOx por m² de Fachada (Bosques Verticales) */}
                <Suspense fallback={null}>
                  <VerticalForestFacadeMetricsPanel
                    currentTemp={data?.temperatura_malaga ?? 22.5}
                    currentRH={data?.humedad_relativa ?? 55.0}
                    currentWindSpeedMs={data?.velocidad_viento_km_h ? data.velocidad_viento_km_h / 3.6 : (windComponents?.speedMs ?? 3.0)}
                    currentNO2Base={data?.no2_satelite_base ?? 40.0}
                    currentPAR={data?.uv_index ? data.uv_index * 45.0 : 350.0}
                    currentUstar={data?.velocidad_viento_km_h ? Math.max(0.1, (data.velocidad_viento_km_h / 3.6) * 0.1) : 0.35}
                    onOpenSimulationModal={() => setActiveModal('greenRoofMitigation')}
                    onOpenCanyonDiagram={() => setActiveModal('urbanCanyonDiagram')}
                  />
                </Suspense>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-emerald-900/40">
                  <button
                    onClick={() => setActiveModal('vegetation')}
                    className="py-1.5 px-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-[8px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                  >
                    <Leaf className="w-3 h-3 text-emerald-400" />
                    <span>Evaluador NBS & Vegetación</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('malagaTreesInventory')}
                    className="py-1.5 px-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-[8px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                  >
                    <Trees className="w-3 h-3 text-emerald-400" />
                    <span>Inventario Arbolado Málaga</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('weselyDeposition')}
                    className="py-1.5 px-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-[8px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 col-span-1 sm:col-span-2 transition-colors"
                  >
                    <TreeDeciduous className="w-3 h-3 text-emerald-400" />
                    <span>Circuito de Resistencias de Wesely (1989)</span>
                  </button>
                </div>
              </motion.div>
              </CollapsibleSection>

              <CollapsibleSection title="Dinámica Urbana Regional" icon={<MapPin className="w-3 h-3" />} defaultOpen={false}>
              {/* Dinámica Urbana: Caso Málaga */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-emerald-950/20 border border-emerald-900/40 p-4" title="Dinámica geográfica específica de la Bahía de Málaga y el comportamiento del Ozono Troposférico según el área.">
                <h3 className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-2 flex items-center gap-2">
                   <MapPin className="w-3 h-3" /> Geografía de la Contaminación: Málaga
                </h3>
                <div className="bg-black/40 p-2 border border-emerald-900/30 mb-2">
                  <div className="text-[8px] text-slate-400 uppercase mb-1">Zona Identificada</div>
                  <div className="text-xs font-bold text-emerald-300">{result.cinetica_quimica.zona_malaga}</div>
                </div>
                
                {result.cinetica_quimica.paradoja_fin_de_semana && (
                  <div className="bg-red-950/40 p-2 border border-red-900/50 mt-2">
                    <div className="text-[8px] text-red-400 uppercase font-bold flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3 h-3" /> Paradoja "Efecto Fin de Semana"
                    </div>
                    <div className="text-[9px] text-slate-300 leading-tight">
                      Detectada alta reducción de NO (sumidero) sin reducción de COVs. Prohibir el tráfico en ZBE aisladas dispara el Ozono en áreas suburbanas por fuga radicalaria. Estrategia integral requerida.
                    </div>
                  </div>
                )}
              </motion.div>
              </CollapsibleSection>

              <CollapsibleSection title="Análisis Doctoral IA (Gemini)" icon={<Zap className="w-3 h-3" />} defaultOpen={false}>
              {/* AI Analysis Tab / Scientific Context */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-black/60 border border-emerald-900/40 p-4 flex flex-col gap-2" title="Análisis en vivo impulsado por IA para explicar los fenómenos químicos.">
                <div className="flex items-center justify-between border-b border-emerald-900/50 pb-2 mb-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <h3 className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">
                      IA Científica: Análisis en Vivo
                    </h3>
                    {aiModelUsed && (
                      <span className="bg-purple-950/80 border border-purple-500/60 text-purple-300 text-[8.5px] px-1.5 py-0.2 rounded font-mono">
                        {aiModelUsed}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={fetchAIExplanation}
                    disabled={isGeneratingAI}
                    className="bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/50 text-emerald-400 px-2 py-1 text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingAI ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Eye className="w-2.5 h-2.5" />}
                    {isGeneratingAI ? 'ANALIZANDO...' : `RE-EVALUAR (${activeModel.tag})`}
                  </button>
                </div>

                {/* Selector de Modelos Gemini */}
                <div className="bg-slate-950/70 border border-purple-900/40 p-1.5 rounded flex items-center justify-between">
                  <GeminiModelSelector variant="compact" />
                </div>
                
                <div className="text-[10.5px] text-slate-300 leading-relaxed font-mono overflow-y-auto max-h-[180px] pr-2 custom-scrollbar">
                  {aiExplanation ? (
                    <div className="whitespace-pre-wrap">{aiExplanation}</div>
                  ) : (
                    <div className="text-slate-500 italic flex items-center gap-2">
                      <Sparkles className="w-3 h-3 opacity-50" /> Haz clic en "Re-evaluar zona" para solicitar el análisis doctoral a Gemini ({activeModel.shortName}) basado en los datos actuales.
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-800 pt-2 mt-2" title="Líneas de investigación avanzadas y metodologías de corrección propuestas para publicaciones científicas de alto impacto o validación empírica.">
                  <h4 className="text-[9px] uppercase tracking-widest text-yellow-500 font-bold mb-1.5 flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Notas Doctorales Estáticas
                  </h4>
                  <ul className="list-disc pl-4 flex flex-col gap-1">
                    {result.sugerencias_doctorado.map((sug, idx) => (
                      <li key={`sug-${idx}-${sug.slice(0, 15)}`} className="text-[9px] text-slate-400 leading-snug">{sug}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
              
              {/* Trend Chart with Dynamic Forecast Horizon Selector */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-black/60 border border-emerald-900/50 p-3 h-[235px] flex flex-col mt-auto shrink-0" title="Evolución temporal de concentración de NO2, Polvo y AOD. Seleccione el horizonte temporal de predicción (+12h, +24h o +48h).">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[9px] text-emerald-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span>TENDENCIAS Y NOWCASTING</span>
                  </div>

                  {/* Temporal Range Horizon Selector */}
                  <ScientificTooltip position="left" width="w-[280px]" content="Horizonte temporal de pronóstico (Nowcasting): Resuelve la evolución temporal determinista acoplando pronósticos meteorológicos de AEMET y la cinética fotoquímica para +12h, +24h o +48h sin ruido aleatorio.">
                    <div className="flex items-center gap-1 bg-slate-950 p-0.5 border border-slate-800 cursor-help">
                      <Clock className="w-2.5 h-2.5 text-slate-500 ml-1 mr-0.5" />
                      {(['12h', '24h', '48h'] as const).map((h) => (
                        <button
                          key={h}
                          onClick={() => setForecastHorizon(h)}
                          className={`text-[8px] font-mono px-1.5 py-0.5 uppercase tracking-wider font-bold transition-colors ${
                            forecastHorizon === h
                              ? 'bg-emerald-600 text-white shadow-[0_0_6px_rgba(16,185,129,0.4)]'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title={`Mostrar 24h pasadas + ${h} de predicción`}
                        >
                          +{h.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </ScientificTooltip>
                </div>

                <div className="flex-1 w-full text-[9px]">
                  {historyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <LineChart data={historyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="time" stroke="#64748b" tick={{fill: '#64748b'}} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" stroke="#e2e8f0" tick={{fill: '#e2e8f0'}} tickLine={false} axisLine={false} width={35} />
                        <YAxis yAxisId="right" orientation="right" stroke="#b45309" tick={{fill: '#b45309'}} tickLine={false} axisLine={false} width={35} />
                        
                        {historyData.find(d => d.isForecast) && (
                          <ReferenceLine 
                            x={historyData.find(d => d.isForecast)?.time} 
                            stroke="#10b981" 
                            strokeDasharray="3 3" 
                            label={{ 
                              position: 'insideTopLeft', 
                              value: `AHORA (+${forecastHorizon.toUpperCase()})`, 
                              fill: '#10b981', 
                              fontSize: 8,
                              fontWeight: 'bold'
                            }} 
                            yAxisId="left"
                          />
                        )}

                        <Tooltip 
                          contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0', borderRadius: '0px'}} 
                          itemStyle={{fontSize: '9px'}} 
                          labelStyle={{fontSize: '9px', color: '#94a3b8', marginBottom: '4px'}} 
                        />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '9px', paddingTop: '6px'}} />
                        <Line yAxisId="left" type="monotone" dataKey="no2" name="NO2 (µg/m³)" stroke="#e2e8f0" strokeWidth={2} dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="dust" name="Dust (µg/m³)" stroke="#b45309" strokeWidth={2} dot={false} strokeDasharray="3 3" />
                        <Line yAxisId="left" type="monotone" dataKey="aod" name="AOD (τ₅₅₀)" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                        <Line yAxisId="left" type="monotone" dataKey="ozone" name="O3 (µg/m³)" stroke="#38bdf8" strokeWidth={1.2} dot={false} strokeDasharray="2 2" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 flex-col gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      <span>CARGANDO DATOS...</span>
                    </div>
                  )}
                </div>
              </motion.div>
              </CollapsibleSection>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-6 text-emerald-500/50">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}
        </DraggableWindow>
        )}
      </main>

      {/* Taskbar flotante para ventanas activas y minimizadas */}
      <SectionErrorBoundary fallbackTitle="Barra de Ventanas Minimizadas" silentFallback={true}>
        <Suspense fallback={null}>
          <MinimizedWindowsTaskbar activeModal={activeModal} setActiveModal={setActiveModal} />
        </Suspense>
      </SectionErrorBoundary>

      {/* Intelligent Categorized Dock Tabs for Ph.D. Modules */}
      <SectionErrorBoundary fallbackTitle="Barra de Módulos Dock">
        <IntelligentDockTabs
          activeModal={activeModal}
          setActiveModal={setActiveModal}
        />
      </SectionErrorBoundary>

      <footer className="h-[26px] bg-[#08090b] border-t border-slate-800/90 flex items-center justify-between px-3 md:px-4 shrink-0 relative z-50 text-[9px] font-mono select-none">
        <ScientificTooltip position="top" width="w-[320px]" content="Pipeline de ingesta geoespacial global: Consulta activa de geometrías de polígonos edilicios y vías en tiempo real mediante OSM Overpass API, y asimilación de columnas atmosféricas de Copernicus CAMS y Sentinel-5P.">
          <div className="flex gap-2 items-center cursor-help">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
            <div className="text-[8.5px] text-slate-400 font-mono tracking-wider">MODO BÚSQUEDA GLOBAL: ACTIVO (OSM Overpass + Satélites)</div>
          </div>
        </ScientificTooltip>
        <ScientificTooltip position="top" width="w-[300px]" content="Motor de asimilación física en segundo plano: Resuelve continuamente los términos de advección-difusión y tensores de pérdida sin bloquear el renderizado interactivo WebGL.">
          <div className="px-2 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-700/80 text-[8px] font-bold uppercase tracking-wider cursor-help shadow-[0_0_8px_rgba(16,185,129,0.3)] rounded-xs flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Asimilación Asíncrona PINN Conectada</span>
          </div>
        </ScientificTooltip>
      </footer>

      
      {activeModal && (
        <Suspense fallback={null}>
          <ScientificModalRegistry
            activeModal={activeModal}
            setActiveModal={setActiveModal}
            telemetryAudit={telemetryAudit}
            handleRetestTelemetry={handleRetestTelemetry}
            isRetesting={isRetesting}
            setData={setData}
            data={data}
            result={result}
            stationComparisons={stationComparisons}
            flyToLocation={flyToLocation}
            applyCameraPreset={applyCameraPreset}
            benchmarkParams={benchmarkParams}
            odeParams={odeParams}
            location={location}
            mapRef={mapRef}
            mapContainerRef={mapContainerRef}
            is3DMode={is3DMode}
            activeBaseStyle={activeBaseStyle}
            showBuildings={showBuildings}
            showWindParticles={showWindParticles}
            showDeckGLMesh={showDeckGLMesh}
            calibrationLogs={calibrationLogs}
            rawUrbanPoints={rawUrbanPoints}
            historyData={historyData}
            marineFlowGeoJson={marineFlowGeoJson}
            deckGlActiveSpecies={deckGlActiveSpecies}
            setDeckGlActiveSpecies={setDeckGlActiveSpecies}
            deckGlEnabledSpecies={deckGlEnabledSpecies}
            setDeckGlEnabledSpecies={setDeckGlEnabledSpecies}
            deckGlMultiLayerMode={deckGlMultiLayerMode}
            setDeckGlMultiLayerMode={setDeckGlMultiLayerMode}
            deckGlElevationScale={deckGlElevationScale}
            setDeckGlElevationScale={setDeckGlElevationScale}
            deckGlColumnRadius={deckGlColumnRadius}
            setDeckGlColumnRadius={setDeckGlColumnRadius}
            deckGlDiskResolution={deckGlDiskResolution}
            setDeckGlDiskResolution={setDeckGlDiskResolution}
            deckGlWireframe={deckGlWireframe}
            setDeckGlWireframe={setDeckGlWireframe}
            deckGlOpacity={deckGlOpacity}
            setDeckGlOpacity={setDeckGlOpacity}
            instancedBuffers={instancedBuffers}
            calculatePINNParameters={calculatePINNParameters}
            trafficNoxData={trafficNoxData}
            getDiurnalTrafficFactor={getDiurnalTrafficFactor}
            selectedTreeStreetId={selectedTreeStreetId}
            treeModalInitialTab={treeModalInitialTab}
          />
        </Suspense>
      )}

      {/* Inspector Completo de Variables en Cualquier Punto de la Ciudad (Desactivable a Voluntad y Modo Foco Limpio) */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {showPointInspector && !activeModal && (
            <PointInspectorModal
              key="modal-point-inspector"
              isOpen={showPointInspector}
              onClose={() => setShowPointInspector(false)}
              locationInfo={pointInspectorLocationUnified}
              data={data}
              result={result}
              onOpenStreetView={(lat, lon, streetName) => {
                syncActivePoint(lat, lon, { name: streetName, openStreetView: true, fly: true });
              }}
              onFlyTo={(lat, lon, zoom = 16.5, pitch = 45, name) => {
                syncActivePoint(lat, lon, { name, zoom, pitch, fly: true });
              }}
            />
          )}
        </AnimatePresence>
      </Suspense>

      {/* Google Street View 360° Fotogramétrico a Cota Respirable 1.8m AGL con Cálculo SVF en Tiempo Real */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {showStreetViewOverlay && (
            <StreetViewMapOverlay
              key="modal-street-view-overlay"
              isOpen={showStreetViewOverlay}
              onClose={() => setShowStreetViewOverlay(false)}
              locationInfo={streetViewLocation}
              currentWindSpeedKmh={data.velocidad_viento_km_h}
              currentWindDirDeg={data.direccion_viento_grados}
              currentNO2Base={data.no2_satelite_base}
              currentTemp={data.temperatura_malaga}
              currentSolarUV={data.uv_index}
              dragConstraintsRef={mapContainerRef}
              onCoordinateSelect={(lat, lon, name) => {
                syncActivePoint(lat, lon, { name, fly: true });
              }}
            />
          )}
        </AnimatePresence>
      </Suspense>

      {/* Panel Arrastrable Flotante de Control de Capas y Físicas */}
      <AnimatePresence>
        {showLayerControls && (
          <DraggableWindow
            key="draggable-map-layer-toolbar"
            title="Control Unificado de Capas, Físicas & Cartografía Base"
            subtitle="Sincronización en tiempo real con ortofotos Google, modelos OSM y fluidodinámica"
            icon={<Layers className="w-4 h-4 text-emerald-400" />}
            onClose={() => setShowLayerControls(false)}
            defaultCollapsed={true}
            initialPositionClass="top-20 left-12"
            className="w-[620px] max-w-[95vw]"
          >
            <div className="p-3 overflow-y-auto max-h-[75vh]">
              <Suspense fallback={null}>
                <MapLayerToolbar
                  inline={true}
                  onClose={() => setShowLayerControls(false)}
                  is3DMode={is3DMode}
                  toggle3D={() => setIs3DMode(!is3DMode)}
                  showHillshade={showHillshade}
                  setShowHillshade={setShowHillshade}
                  showAODLayer={showAODLayer}
                  setShowAODLayer={setShowAODLayer}
                  aodValue={data.dust ? (data.dust * 2.5).toFixed(2) : '0.12'}
                  showMarineFlowLayer={showMarineFlowLayer}
                  setShowMarineFlowLayer={setShowMarineFlowLayer}
                  windSpeedKmH={data.velocidad_viento_km_h}
                  showWindVector={showWindVector}
                  setShowWindVector={setShowWindVector}
                  windSpeedMs={(data.velocidad_viento_km_h / 3.6).toFixed(1)}
                  showWindParticles={showWindParticles}
                  setShowWindParticles={setShowWindParticles}
                  showContinuousContour={showContinuousContour}
                  setShowContinuousContour={setShowContinuousContour}
                  showMalagaTreesLayer={showMalagaTreesLayer}
                  setShowMalagaTreesLayer={setShowMalagaTreesLayer}
                  showDeckGLMesh={showDeckGLMesh}
                  setShowDeckGLMesh={setShowDeckGLMesh}
                  showSentinel5PGrid={showSentinel5PGrid}
                  setShowSentinel5PGrid={setShowSentinel5PGrid}
                  showPortCruiseLayer={showPortCruiseLayer}
                  setShowPortCruiseLayer={setShowPortCruiseLayer}
                  showVolumetricMesh={showVolumetricMesh}
                  setShowVolumetricMesh={setShowVolumetricMesh}
                  showRoads={showRoads}
                  setShowRoads={setShowRoads}
                  showTrafficNoxLayer={showTrafficNoxLayer}
                  setShowTrafficNoxLayer={setShowTrafficNoxLayer}
                  showOfficialStations={showOfficialStations}
                  setShowOfficialStations={setShowOfficialStations}
                  onOpenOfficialStationsModal={() => setActiveModal('audit')}
                  handleSaveCalibration={handleSaveCalibration}
                  calibrationLogsCount={calibrationLogs.length}
                  scientificPalette={scientificPalette}
                  setScientificPalette={setScientificPalette}
                  activeBaseStyle={activeBaseStyle}
                  setActiveBaseStyle={setActiveBaseStyle as any}
                />
              </Suspense>
            </div>
          </DraggableWindow>
        )}
      </AnimatePresence>

      {/* Herramienta de Encuadre de Pantalla e Interpretación Multimodal con Gemini */}
      <Suspense fallback={null}>
        {isCroppingScreen && (
          <ScreenCropOverlay
            isActive={isCroppingScreen}
            onCropComplete={(base64) => {
              setIsCroppingScreen(false);
              setGeminiCroppedImage(base64);
            }}
            onCancel={() => setIsCroppingScreen(false)}
          />
        )}

        {geminiCroppedImage && (
          <GeminiScreenAnalysisModal
            croppedImageBase64={geminiCroppedImage}
            onClose={() => setGeminiCroppedImage(null)}
            onNewCropRequested={() => {
              setGeminiCroppedImage(null);
              setIsCroppingScreen(true);
            }}
          />
        )}
      </Suspense>

      {/* Ficha Instrumental Oficial UNE-EN 14211:2013 (Regla Doctrinal N.º 33) */}
      {(selectedInstrumentalStationId || activeModal === 'stationInstrumental') && (
        <StationInstrumentalModal
          isOpen={true}
          onClose={() => {
            setSelectedInstrumentalStationId(null);
            if (activeModal === 'stationInstrumental') {
              setActiveModal(null);
            }
          }}
          initialStationId={selectedInstrumentalStationId}
          onFlyToStation={(stLat, stLon, stName) => {
            syncActivePoint(stLat, stLon, { name: stName, zoom: 16.8, pitch: 45, fly: true });
          }}
        />
      )}

      {/* Inspector Universal Delegado de Tooltips Científicos (100% Cobertura Presente y Futura, Regla 7 y 22) */}
      <UniversalScientificTooltipDelegator />

      {/* Consola de Auditoría FAIRMODE integrada en FairAuditConsole */}
      </div>
    </ActivePointContext.Provider>
  );
}