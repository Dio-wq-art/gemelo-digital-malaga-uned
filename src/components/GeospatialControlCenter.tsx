import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GripHorizontal, MapPin, Orbit, Camera, Radio, FileText, Layers, Compass,
  Building2, Navigation, RotateCw, Search, ChevronRight, Zap, Eye, RotateCcw, Trees
} from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { useUIStore } from '../store/uiStore';
import { PRESET_ZONES } from '../lib/zones';
import {
  MALAGA_HOTSPOT_PRESETS,
  HotspotPreset,
  cinematicOrbitController,
  calculateKinematicFlightParams
} from '../lib/mapKinematicEngine';
import { useActivePoint } from '../context/ActivePointContext';
import { SYSTEM_PROPAGATION } from '../lib/systemPropagationEngine';

interface GeospatialControlCenterProps {
  location: { lat: number; lon: number };
  flyToLocation: (lat: number, lon: number, zoom?: number, bearing?: number, title?: string) => void;
  applyCameraPreset: (preset: 'free' | 'canyon' | 'downwind' | 'bay' | 'zenith' | 'birdeye') => void;
  showStreetViewOverlay: boolean;
  setShowStreetViewOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  setStreetViewLocation: React.Dispatch<React.SetStateAction<{ lat: number; lon: number }>>;
  showPointInspector: boolean;
  setShowPointInspector: React.Dispatch<React.SetStateAction<boolean>>;
  setPointInspectorLocation: React.Dispatch<React.SetStateAction<any>>;
  showLayerControls: boolean;
  setShowLayerControls: React.Dispatch<React.SetStateAction<boolean>>;
  mapContainerRef?: React.RefObject<HTMLElement | null>;
  mapRef?: React.RefObject<any>;
  is3DMode?: boolean;
  setIs3DMode?: (is3D: boolean) => void;
  currentBearing?: number;
  currentPitch?: number;
  onFlyTo?: (lat: number, lon: number, zoom?: number, pitch?: number, bearing?: number, name?: string) => void;
  showOfficialStations?: boolean;
  setShowOfficialStations?: (show: boolean) => void;
  showSatelliteMarkers?: boolean;
  setShowSatelliteMarkers?: (show: boolean) => void;
  showSentinel5PGrid?: boolean;
  setShowSentinel5PGrid?: (show: boolean) => void;
}

export const GeospatialControlCenter: React.FC<GeospatialControlCenterProps> = ({
  location,
  flyToLocation,
  applyCameraPreset,
  showStreetViewOverlay,
  setShowStreetViewOverlay,
  setStreetViewLocation,
  showPointInspector,
  setShowPointInspector,
  setPointInspectorLocation,
  showLayerControls,
  setShowLayerControls,
  mapContainerRef,
  mapRef,
  is3DMode = true,
  setIs3DMode,
  currentBearing = 0,
  currentPitch = 0,
  onFlyTo,
  showOfficialStations = true,
  setShowOfficialStations,
  showSatelliteMarkers = true,
  setShowSatelliteMarkers,
  showSentinel5PGrid = false,
  setShowSentinel5PGrid
}) => {
  const {
    isMapToolbarOpen, setIsMapToolbarOpen,
    selectedPrimaryPollutant, setSelectedPrimaryPollutant,
    showMalagaTreesLayer, setShowMalagaTreesLayer,
    activeCameraPreset,
    isOrbiting, setIsOrbiting,
    activeModal, setActiveModal
  } = useUIStore();

  const activeCtx = useActivePoint();
  const [isAtalayasOpen, setIsAtalayasOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Control de inicio/parada de órbita 360°
  const toggleOrbit = useCallback(() => {
    if (!mapRef?.current) {
      setIsOrbiting(!isOrbiting);
      return;
    }
    if (isOrbiting) {
      cinematicOrbitController.stopOrbit();
      setIsOrbiting(false);
    } else {
      cinematicOrbitController.startOrbit(
        mapRef.current.getMap ? mapRef.current.getMap() : mapRef.current,
        location.lat,
        location.lon,
        is3DMode ? 60 : 45,
        17.2
      );
      setIsOrbiting(true);
    }
  }, [mapRef, isOrbiting, location, is3DMode, setIsOrbiting]);

  // Manejo de salto rápido a un preset de atalaya o zona
  const handleJumpToPreset = useCallback((preset: HotspotPreset) => {
    if (isOrbiting) {
      cinematicOrbitController.stopOrbit();
      setIsOrbiting(false);
    }

    const currentLat = location.lat;
    const currentLon = location.lon;
    const flight = calculateKinematicFlightParams(currentLat, currentLon, preset.lat, preset.lon, is3DMode);

    if (mapRef?.current) {
      mapRef.current.flyTo({
        center: [preset.lon, preset.lat],
        zoom: preset.zoom,
        pitch: is3DMode ? preset.pitch : 0,
        bearing: preset.bearing,
        duration: flight.duration,
        essential: true,
        curve: flight.curve,
        speed: flight.speed
      });
    }

    if (onFlyTo) {
      onFlyTo(preset.lat, preset.lon, preset.zoom, is3DMode ? preset.pitch : 0, preset.bearing, preset.name);
    } else {
      flyToLocation(preset.lat, preset.lon, preset.zoom, preset.bearing, preset.name);
    }
    setIsAtalayasOpen(false);
  }, [location, is3DMode, isOrbiting, mapRef, onFlyTo, flyToLocation, setIsOrbiting]);

  // Reset Norte (Bearing 0°, Pitch 0° / 2D Top View)
  const handleResetNorth = useCallback(() => {
    if (isOrbiting) {
      cinematicOrbitController.stopOrbit();
      setIsOrbiting(false);
    }
    if (mapRef?.current) {
      mapRef.current.easeTo({
        bearing: 0,
        pitch: 0,
        duration: 350
      });
    }
    if (setIs3DMode) {
      setIs3DMode(false);
    }
  }, [mapRef, isOrbiting, setIs3DMode, setIsOrbiting]);

  // Alternar Perspectiva 3D (Pitch 60° con inclinación isométrica)
  const handleToggle3D = useCallback(() => {
    const next3D = !is3DMode;
    if (setIs3DMode) {
      setIs3DMode(next3D);
    }
    if (mapRef?.current) {
      mapRef.current.easeTo({
        pitch: next3D ? 60 : 0,
        bearing: next3D ? -35 : 0,
        duration: 400
      });
    }
  }, [is3DMode, setIs3DMode, mapRef]);

  // Atajos de teclado globales (1-6 para hotspots, R: reset norte, P: toggle 3D, O: órbita)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key >= '1' && e.key <= '6') {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < MALAGA_HOTSPOT_PRESETS.length) {
          e.preventDefault();
          handleJumpToPreset(MALAGA_HOTSPOT_PRESETS[idx]);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleResetNorth();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handleToggle3D();
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        toggleOrbit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJumpToPreset, handleResetNorth, handleToggle3D, toggleOrbit]);

  const filteredHotspots = useMemo(() => {
    if (!searchQuery.trim()) return MALAGA_HOTSPOT_PRESETS;
    const q = searchQuery.toLowerCase();
    return MALAGA_HOTSPOT_PRESETS.filter(h => 
      h.name.toLowerCase().includes(q) ||
      h.shortName.toLowerCase().includes(q) ||
      h.typology.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <motion.div 
      drag
      dragConstraints={mapContainerRef}
      dragElastic={0.08}
      dragMomentum={false}
      whileDrag={{ scale: 1.01 }}
      className="absolute top-3 right-3 z-30 flex flex-col gap-1 items-end max-w-[calc(100%-80px)] pointer-events-auto select-none"
    >
      {/* Header Unificado / Drag Handle con Atajos Rápidos */}
      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 px-2 py-1 flex items-center justify-between gap-2.5 w-full max-w-full overflow-x-auto no-scrollbar shadow-lg cursor-grab active:cursor-grabbing text-[8.5px] font-mono">
        <ScientificTooltip
          position="bottom"
          width="w-[340px]"
          title="Consola Flotante de Control Geoespacial 3D & Atalayas"
          content="Barra de mando cartográfico arrastrable: permite activar o desactivar estaciones oficiales (24), satélites (16), arboleda urbana, perspectiva isométrica 3D, órbita de dron 360°, visor a cota peatonal 1.8m y selector de capas físicas."
          regulatory="Regla 6 y Regla 7 AGENTS.md — Cartografía Híbrida & Trazabilidad Geoespacial"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAtalayasOpen(!isAtalayasOpen);
            }}
            className="flex items-center gap-1.5 text-slate-300 shrink-0 cursor-pointer hover:text-emerald-300 transition-colors"
            title="Clic: Desplegar/plegar Atalayas • Arrastrar: Mover barra • Doble clic/toque: Explicación científica"
          >
            <GripHorizontal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-extrabold tracking-wider text-slate-200 hidden sm:inline">CONTROL GEOESPACIAL &amp; ATALAYAS</span>
            <span className="font-extrabold tracking-wider text-slate-200 sm:hidden">CONTROL 3D</span>
            <span className="text-[7px] text-slate-500 font-mono hidden md:inline">(Arrastrable)</span>
          </button>
        </ScientificTooltip>

        {/* Atajos Rápidos Incrustados en el Header */}
        <div
          className="flex items-center gap-1 shrink-0"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Toggle Estaciones Oficiales */}
          {setShowOfficialStations && (
            <ScientificTooltip position="bottom" width="w-[260px]" content={`Conmutar visibilidad de las ${SYSTEM_PROPAGATION.stationsCount} estaciones oficiales in situ en el mapa.`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOfficialStations(!showOfficialStations);
                }}
                className={`px-1.5 py-0.5 rounded flex items-center gap-1 font-bold text-[8px] border transition-all cursor-pointer ${
                  showOfficialStations
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
                }`}
                title={`${SYSTEM_PROPAGATION.stationsCount} Estaciones Terrestres`}
              >
                <Radio className="w-2.5 h-2.5 text-emerald-400" />
                <span>{SYSTEM_PROPAGATION.stationsToggleHeader} {showOfficialStations ? 'ON' : 'OFF'}</span>
              </button>
            </ScientificTooltip>
          )}

          {/* Toggle Satélites */}
          {setShowSatelliteMarkers && (
            <ScientificTooltip position="bottom" width="w-[260px]" content={`Conmutar marcadores de ${SYSTEM_PROPAGATION.satellitesCount} misiones satelitales (Copernicus / NASA).`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSatelliteMarkers(!showSatelliteMarkers);
                }}
                className={`px-1.5 py-0.5 rounded flex items-center gap-1 font-bold text-[8px] border transition-all cursor-pointer ${
                  showSatelliteMarkers
                    ? 'bg-purple-950 text-purple-200 border-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.3)]'
                    : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
                }`}
                title={`${SYSTEM_PROPAGATION.satellitesCount} Satélites`}
              >
                <span>🛰️</span>
                <span>{SYSTEM_PROPAGATION.satellitesToggleHeader} {showSatelliteMarkers ? 'ON' : 'OFF'}</span>
              </button>
            </ScientificTooltip>
          )}

          {/* Toggle Arboleda de Málaga (Marcadores por Calles + Dosel Foliar) */}
          <ScientificTooltip
            position="bottom"
            width="w-[270px]"
            content="Conmutar a voluntad la visualización de la Arboleda Urbana de Málaga (etiquetas de calles arboladas, ejemplares censados y sumidero foliar FvCB/Wesely) para despejar el mapa."
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMalagaTreesLayer(!showMalagaTreesLayer);
              }}
              className={`px-1.5 py-0.5 rounded flex items-center gap-1 font-bold text-[8px] border transition-all cursor-pointer ${
                showMalagaTreesLayer
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.35)]'
                  : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
              }`}
              title="Mostrar / Ocultar Arboleda de Málaga en el mapa"
            >
              <Trees className="w-2.5 h-2.5 text-emerald-400" />
              <span>ARBOLEDA {showMalagaTreesLayer ? 'ON' : 'OFF'}</span>
            </button>
          </ScientificTooltip>

          {/* Toggle S5P */}
          {setShowSentinel5PGrid && (
            <ScientificTooltip position="bottom" width="w-[220px]" content="Proyectar la malla poligonal de resolución espacial de Sentinel-5P TROPOMI.">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSentinel5PGrid(!showSentinel5PGrid);
                }}
                className={`hidden md:flex px-1.5 py-0.5 rounded items-center gap-1 font-bold text-[8px] border transition-all cursor-pointer ${
                  showSentinel5PGrid
                    ? 'bg-indigo-950 text-indigo-200 border-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.3)]'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
                title="Malla Sentinel-5P"
              >
                <span>S5P</span>
              </button>
            </ScientificTooltip>
          )}

          <span className="text-slate-700 select-none px-0.5">|</span>

          {/* Reset Norte */}
          <ScientificTooltip position="bottom" width="w-[220px]" content="Resetear Norte y volver a vista 2D cenital (Tecla R).">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResetNorth();
              }}
              className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 rounded flex items-center gap-1 font-bold text-[8px] cursor-pointer"
              title="Reset Norte (Tecla R)"
            >
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>{Math.round(currentBearing)}°</span>
            </button>
          </ScientificTooltip>

          {/* Toggle 3D */}
          <ScientificTooltip position="bottom" width="w-[220px]" content="Alternar entre modo 3D isométrico a 60° y 2D cenital (Tecla P).">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggle3D();
              }}
              className={`px-1.5 py-0.5 rounded flex items-center gap-1 font-bold text-[8px] border transition-all cursor-pointer ${
                is3DMode
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600 shadow-[0_0_6px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
              title="Alternar Modo 3D (Tecla P)"
            >
              <Building2 className="w-3 h-3" />
              <span>{is3DMode ? '3D' : '2D'}</span>
            </button>
          </ScientificTooltip>

          {/* Toggle Órbita */}
          <ScientificTooltip position="bottom" width="w-[220px]" content="Iniciar / Detener giro orbital 360° continuo (Tecla O).">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleOrbit();
              }}
              className={`px-1.5 py-0.5 rounded flex items-center gap-1 font-bold text-[8px] border transition-all cursor-pointer ${
                isOrbiting
                  ? 'bg-amber-950 text-amber-300 border-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-amber-300'
              }`}
              title="Giro Órbita Dron 360° (Tecla O)"
            >
              <RotateCw className={`w-3 h-3 ${isOrbiting ? 'animate-spin' : ''}`} />
              <span>{isOrbiting ? 'ÓRBITA ON' : 'ÓRBITA'}</span>
            </button>
          </ScientificTooltip>

          {/* Desplegable de Atalayas */}
          <div className="relative">
            <ScientificTooltip position="bottom" width="w-[240px]" content={SYSTEM_PROPAGATION.atalayasTooltip}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAtalayasOpen(!isAtalayasOpen);
                }}
                className={`px-1.5 py-0.5 rounded flex items-center gap-1 font-bold text-[8px] border transition-all cursor-pointer ${
                  isAtalayasOpen
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-cyan-300'
                }`}
                title={`Desplegar Atalayas de Málaga (1-${SYSTEM_PROPAGATION.hotspotsCount})`}
              >
                <Navigation className="w-3 h-3 text-cyan-400" />
                <span>{SYSTEM_PROPAGATION.atalayasLabel}</span>
              </button>
            </ScientificTooltip>

            {/* Menú Flotante de Atalayas */}
            <AnimatePresence>
              {isAtalayasOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1.5 w-[300px] bg-slate-950/95 backdrop-blur-md border border-slate-700 p-2 rounded shadow-2xl space-y-1.5 z-50 text-[9px] font-mono"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                    <span className="font-bold text-cyan-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {SYSTEM_PROPAGATION.atalayasLabel}
                    </span>
                    <span className="text-[7.5px] text-slate-500">Flatbush &lt;0.05ms</span>
                  </div>

                  {/* Input de Búsqueda Rápida */}
                  <div className="relative">
                    <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filtrar atalayas (Larios, Muelle 1, etc.)..."
                      className="w-full bg-slate-900 border border-slate-800 rounded pl-7 pr-2 py-1 text-[8.5px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Lista de Atalayas */}
                  <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                    {filteredHotspots.map((h, i) => (
                      <ScientificTooltip
                        key={h.id}
                        position="left"
                        width="w-[330px]"
                        title={`Atalaya Microescalar #${i + 1}: ${h.name}`}
                        content={`Vuelo balístico 3D hacia ${h.name} (${h.lat.toFixed(4)}°N, ${h.lon.toFixed(4)}°W). Tipología morfológica: ${h.typology} con Factor de Visión de Cielo SVF = ${h.svf}. Sincroniza instantáneamente el Punto Activo en todas las consolas.`}
                        formula={`\\text{SVF} = ${h.svf}, \\quad C(z=1.8\\text{m}) = C_{\\text{fondo}} + \\Delta C_{\\text{Oke}}(\\text{SVF}, H/W)`}
                        regulatory="Regla 6 y Regla 10 AGENTS.md — Sincronización Geoespacial Atómica"
                        citation="Oke, T. R. (1988) Street design and urban canopy layer climate"
                      >
                        <button
                          type="button"
                          onClick={() => handleJumpToPreset(h)}
                          className="w-full text-left p-1 rounded bg-slate-900/60 hover:bg-cyan-950/80 border border-slate-800/80 hover:border-cyan-600 transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-4 h-4 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-300 text-[8px] shrink-0">
                              {i < 6 ? i + 1 : '•'}
                            </span>
                            <div className="truncate">
                              <div className="font-bold text-slate-200 group-hover:text-cyan-300 truncate text-[8.5px]">
                                {h.name}
                              </div>
                              <div className="text-[7px] text-slate-500 truncate">
                                {h.typology} • SVF: {h.svf}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 shrink-0" />
                        </button>
                      </ScientificTooltip>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span className="text-slate-700 select-none px-0.5">|</span>

          {/* Selector Compacto de Especie Química Primaria */}
          <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-700/80 p-0.5 rounded">
            {(['NO2', 'O3', 'PM10', 'PM2.5'] as const).map(spec => {
              const specMeta: Record<string, { title: string; formula: string; reg: string; desc: string }> = {
                NO2: {
                  title: 'Campo Espacial de Dióxido de Nitrógeno (NO₂)',
                  formula: '\\frac{\\partial [\\text{NO}_2]}{\\partial t} + \\mathbf{u}\\cdot\\nabla [\\text{NO}_2] = D_t \\nabla^2 [\\text{NO}_2] + k_3[\\text{NO}][\\text{O}_3] - J_{\\text{NO}_2}[\\text{NO}_2] + E_{\\text{COPERT5}}',
                  reg: 'Directiva (UE) 2024/2881: 20 µg/m³ anual (2030) • OMS 2021: 10 µg/m³',
                  desc: 'Conmuta la malla cartográfica e isopletas al campo asimilado de NO₂ a cota respiratoria (1.8 m AGL).'
                },
                O3: {
                  title: 'Campo Espacial de Ozono Troposférico (O₃)',
                  formula: '[\\text{O}_3]_{\\text{PSS}} = \\frac{J_{\\text{NO}_2}[\\text{NO}_2]}{k_3(T)[\\text{NO}]}',
                  reg: 'Directiva (UE) 2024/2881: 120 µg/m³ máx octohoraria • OMS 2021: 100 µg/m³',
                  desc: 'Conmuta la malla cartográfica al campo fotoquímico secundario de O₃ gobernado por el estado fotoestacionario de Leighton.'
                },
                PM10: {
                  title: 'Campo Espacial de Material Particulado Torácico (PM₁₀)',
                  formula: '\\text{PM}_{10} = \\text{PM}_{2.5} + \\text{PM}_{\\text{resusp+frenos}} + \\text{NaCl}_{\\text{marino}} + \\text{Polvo}_{\\text{CAMS}}',
                  reg: 'Directiva (UE) 2024/2881: 20 µg/m³ anual (2030) • OMS 2021: 15 µg/m³',
                  desc: 'Conmuta la malla cartográfica a la fracción torácica PM₁₀ (combustión + abrasión vehicular + aerosol marino + intrusión sahariana).'
                },
                'PM2.5': {
                  title: 'Campo Espacial de Partículas Finas Alveolares (PM₂.₅)',
                  formula: '\\text{PM}_{2.5} = \\text{BC}_{\\text{escape}} + \\text{SIA}_{(\\text{NH}_4)_2\\text{SO}_4/\\text{NH}_4\\text{NO}_3} + \\text{SOA}_{\\text{Pankow}}',
                  reg: 'Directiva (UE) 2024/2881: 10 µg/m³ anual (2030) • OMS 2021: 5 µg/m³',
                  desc: 'Conmuta la malla cartográfica a la fracción fina alveolar PM₂.₅ con partición termodinámica gas-partícula.'
                }
              };
              const m = specMeta[spec];
              return (
                <ScientificTooltip
                  key={spec}
                  position="bottom"
                  width="w-[320px]"
                  title={m.title}
                  content={m.desc}
                  formula={m.formula}
                  regulatory={m.reg}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedPrimaryPollutant(spec)}
                    className={`text-[8px] font-mono px-1 py-0.2 font-bold rounded-xs transition-all cursor-pointer ${
                      selectedPrimaryPollutant === spec
                        ? 'bg-emerald-500 text-black shadow-[0_0_6px_rgba(16,185,129,0.7)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spec}
                  </button>
                </ScientificTooltip>
              );
            })}
          </div>

          {/* Google Street View Quick Toggle */}
          <ScientificTooltip position="bottom" width="w-[280px]" content="Perspectiva fotorrealista a cota de calle (1.8m AGL) con Google Street View: Proporciona visión de 360° en las coordenadas seleccionadas.">
            <button
              onClick={() => {
                setStreetViewLocation({ lat: location.lat, lon: location.lon });
                setShowStreetViewOverlay(prev => !prev);
              }}
              className={`px-1.5 py-0.5 rounded border font-bold text-[8px] flex items-center gap-1 transition-all cursor-pointer ${
                showStreetViewOverlay 
                  ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-amber-300'
              }`}
              title="Activar/Desactivar visor Google Street View a Cota de Calle (1.8m AGL)"
            >
              <Camera className="w-3 h-3 text-amber-400" />
              <span>1.8m</span>
            </button>
          </ScientificTooltip>

          {/* Point Inspector Quick Toggle */}
          <ScientificTooltip position="bottom" width="w-[280px]" content="Inspector Georreferenciado Completo de Variables: Muestra u oculta el Inspector del punto seleccionado en el mapa.">
            <button
              onClick={() => {
                const activeStreet =
                  activeCtx?.activePoint?.name ||
                  activeCtx?.activePoint?.nearestStreetName ||
                  `Cota Focal Málaga (${location.lat.toFixed(4)}, ${location.lon.toFixed(4)})`;
                useUIStore.getState().setHasUserSelectedPoint(true);
                setPointInspectorLocation((prev: any) => ({
                  ...prev,
                  lat: location.lat,
                  lon: location.lon,
                  streetName: activeStreet,
                  highwayType: activeCtx?.activePoint?.highwayType || prev?.highwayType || 'urban_street',
                  clickedFeatureType: activeCtx?.activePoint?.clickedFeatureType || prev?.clickedFeatureType || 'blank_terrain',
                  metadata: activeCtx?.activePoint || prev?.metadata
                }));
                setShowPointInspector(prev => !prev);
              }}
              className={`px-1.5 py-0.5 rounded border font-bold text-[8px] flex items-center gap-1 transition-all cursor-pointer ${
                showPointInspector 
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-emerald-300'
              }`}
              title="Activar/Desactivar Inspector de Variables del Punto Seleccionado"
            >
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>Inspector</span>
            </button>
          </ScientificTooltip>

          {/* Botón de Control Unificado de Capas & Cartografía */}
          <ScientificTooltip position="bottom" width="w-[300px]" content="Control Unificado de Capas Cartográficas & Físicas: Alterna ortofotos satelitales, mallas 2D/3D, arbolado viario, tráfico COPERT 5, flujo marino, relieve DEM y estaciones oficiales.">
            <button
              onClick={() => setShowLayerControls(prev => !prev)}
              className={`px-1.5 py-0.5 rounded border font-bold text-[8px] flex items-center gap-1 transition-all cursor-pointer ${
                showLayerControls 
                  ? 'bg-emerald-950 border-emerald-400 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.6)]' 
                  : 'bg-emerald-950/70 border-emerald-600/80 text-emerald-300 hover:bg-emerald-900 hover:text-white'
              }`}
              title="Abrir Selector Unificado de Capas del Mapa"
            >
              <Layers className="w-3 h-3 text-emerald-400" />
              <span className="font-extrabold">CAPAS</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>
    </motion.div>
  );
};
