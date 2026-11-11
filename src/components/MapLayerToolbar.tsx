import React from 'react';
import { 
  Wind, 
  Building2, 
  Navigation, 
  Mountain, 
  SunMedium, 
  Waves, 
  Sparkles, 
  Trees, 
  Globe, 
  Anchor, 
  Car, 
  Radio, 
  Palette,
  Layers,
  X,
  BookmarkCheck,
  CheckCircle2,
  ShieldCheck,
  SlidersHorizontal,
  Leaf,
  Filter,
  Activity
} from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { ScientificPalette } from '../lib/physics';
import { useUIStore } from '../store/uiStore';
import { MALAGA_SPECIES_CATALOG } from '../lib/malagaTreesInventory';
import { SYSTEM_PROPAGATION } from '../lib/systemPropagationEngine';

export interface MapLayerToolbarProps {
  onClose?: () => void;
  inline?: boolean;
  is3DMode: boolean;
  toggle3D: () => void;
  showHillshade: boolean;
  setShowHillshade: (val: boolean) => void;
  showAODLayer: boolean;
  setShowAODLayer: (val: boolean) => void;
  aodValue?: string | number;
  showMarineFlowLayer: boolean;
  setShowMarineFlowLayer: (val: boolean) => void;
  windSpeedKmH: number;
  showWindVector: boolean;
  setShowWindVector: (val: boolean) => void;
  windSpeedMs: string | number;
  showWindParticles: boolean;
  setShowWindParticles: (val: boolean) => void;
  showContinuousContour: boolean;
  setShowContinuousContour: (val: boolean) => void;
  showMalagaTreesLayer: boolean;
  setShowMalagaTreesLayer: (val: boolean) => void;
  showDeckGLMesh: boolean;
  setShowDeckGLMesh: (val: boolean) => void;
  showSentinel5PGrid: boolean;
  setShowSentinel5PGrid: (val: boolean) => void;
  showPortCruiseLayer: boolean;
  setShowPortCruiseLayer: (val: boolean) => void;
  showVolumetricMesh: boolean;
  setShowVolumetricMesh: (val: boolean) => void;
  showRoads: boolean;
  setShowRoads: (val: boolean) => void;
  showTrafficNoxLayer: boolean;
  setShowTrafficNoxLayer: (val: boolean) => void;
  showOfficialStations: boolean;
  setShowOfficialStations: (val: boolean) => void;
  onOpenOfficialStationsModal?: () => void;
  handleSaveCalibration?: () => void;
  calibrationLogsCount?: number;
  scientificPalette: ScientificPalette;
  setScientificPalette: (palette: ScientificPalette) => void;
  activeBaseStyle: string;
  setActiveBaseStyle: (style: 'google_hybrid' | 'osm' | 'google_sat' | 'google_terrain' | 'satellite' | 'dark' | 'positron') => void;
}

export const MapLayerToolbar: React.FC<MapLayerToolbarProps> = React.memo(({
  onClose,
  inline = false,
  is3DMode,
  toggle3D,
  showHillshade,
  setShowHillshade,
  showAODLayer,
  setShowAODLayer,
  aodValue,
  showMarineFlowLayer,
  setShowMarineFlowLayer,
  windSpeedKmH,
  showWindVector,
  setShowWindVector,
  windSpeedMs,
  showWindParticles,
  setShowWindParticles,
  showContinuousContour,
  setShowContinuousContour,
  showMalagaTreesLayer,
  setShowMalagaTreesLayer,
  showDeckGLMesh,
  setShowDeckGLMesh,
  showSentinel5PGrid,
  setShowSentinel5PGrid,
  showPortCruiseLayer,
  setShowPortCruiseLayer,
  showVolumetricMesh,
  setShowVolumetricMesh,
  showRoads,
  setShowRoads,
  showTrafficNoxLayer,
  setShowTrafficNoxLayer,
  showOfficialStations,
  setShowOfficialStations,
  onOpenOfficialStationsModal,
  handleSaveCalibration,
  calibrationLogsCount = 0,
  scientificPalette,
  setScientificPalette,
  activeBaseStyle,
  setActiveBaseStyle,
}) => {
  const {
    treeNoxFilterLevel,
    setTreeNoxFilterLevel,
    treeSpeciesFilterId,
    setTreeSpeciesFilterId,
    setActiveModal,
    setTreeModalInitialTab,
    showKrigingVarianceLayer,
    setShowKrigingVarianceLayer,
    showConfidenceLayer,
    toggleConfidenceLayer
  } = useUIStore();

  const kineticEnergy = (0.5 * 1.225 * Math.pow(Math.max(0.8, (windSpeedKmH || 0) / 3.6), 2)).toFixed(1);

  // Selector coordinado para evitar solapamiento saturante de mallas escalares
  const activeMeshType = showKrigingVarianceLayer ? 'kriging' : showContinuousContour ? 'd3' : showDeckGLMesh ? 'deckgl' : showSentinel5PGrid ? 's5p' : showVolumetricMesh ? 'volumetric' : 'none';

  const handleSelectMesh = (type: 'none' | 'd3' | 'deckgl' | 's5p' | 'volumetric' | 'kriging') => {
    if (type === 'none') {
      setShowContinuousContour(false);
      setShowDeckGLMesh(false);
      setShowSentinel5PGrid(false);
      setShowVolumetricMesh(false);
      setShowKrigingVarianceLayer(false);
    } else if (type === 'd3') {
      setShowContinuousContour(true);
      setShowDeckGLMesh(false);
      setShowSentinel5PGrid(false);
      setShowVolumetricMesh(false);
      setShowKrigingVarianceLayer(false);
    } else if (type === 'deckgl') {
      setShowContinuousContour(false);
      setShowDeckGLMesh(true);
      setShowSentinel5PGrid(false);
      setShowVolumetricMesh(false);
      setShowKrigingVarianceLayer(false);
    } else if (type === 's5p') {
      setShowContinuousContour(false);
      setShowDeckGLMesh(false);
      setShowSentinel5PGrid(true);
      setShowVolumetricMesh(false);
      setShowKrigingVarianceLayer(false);
    } else if (type === 'volumetric') {
      setShowContinuousContour(false);
      setShowDeckGLMesh(false);
      setShowSentinel5PGrid(false);
      setShowVolumetricMesh(true);
      setShowKrigingVarianceLayer(false);
    } else if (type === 'kriging') {
      setShowContinuousContour(false);
      setShowDeckGLMesh(false);
      setShowSentinel5PGrid(false);
      setShowVolumetricMesh(false);
      setShowKrigingVarianceLayer(true);
    }
  };

  return (
    <div className={`layer-control-panel flex flex-col gap-2.5 text-[9px] ${
      inline 
        ? 'w-full p-0 bg-transparent border-0 shadow-none' 
        : 'bg-slate-950/95 backdrop-blur-md border border-slate-800 p-3 shadow-2xl max-w-2xl w-full'
    }`}>
      {/* Barra de cabecera con botón de cierre (solo en modo flotante no-DraggableWindow) */}
      {!inline && (
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-200">
              Selector Unificado de Capas & Físicas
            </span>
            <span className="text-[7.5px] px-1.5 py-0.2 bg-emerald-950/90 text-emerald-300 border border-emerald-700/80 font-mono font-semibold">
              PINN MÁLAGA
            </span>
          </div>
          {onClose && (
            <ScientificTooltip content="Cerrar el selector unificado de capas y mantener despejado el mapa 3D.">
              <button 
                onClick={onClose} 
                className="p-0.5 px-2 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-700/60 text-[8px] font-mono flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3 text-slate-400 hover:text-white" />
                <span>CERRAR</span>
              </button>
            </ScientificTooltip>
          )}
        </div>
      )}

      {/* 1. CARTOGRAFÍA BASE & ESTILOS DE MAPA */}
      <div className="bg-slate-900/60 border border-slate-800/90 p-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[8px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-emerald-400" /> 1. Cartografía Base & Ortofoto
          </span>
          <span className="text-[7.5px] text-slate-400 font-mono">
            {activeBaseStyle === 'google_hybrid' ? 'HÍBRIDO ACTIVO' : activeBaseStyle.toUpperCase()}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              { key: 'google_hybrid', label: 'GOOGLE HÍBRIDO', desc: 'Google Maps Satélite con etiquetado vectorial de calles de alta resolución.' },
              { key: 'osm', label: 'OPENSTREETMAP', desc: 'Cartografía vectorial estándar OpenStreetMap.' },
              { key: 'satellite', label: 'ESRI SATÉLITE', desc: 'Ortofoto satelital global ESRI World Imagery.' },
              { key: 'google_sat', label: 'GOOGLE SAT', desc: 'Ortofoto satelital pura de Google sin capas superpuestas.' },
              { key: 'google_terrain', label: 'RELIEVE DEM', desc: 'Mapa físico topográfico con sombreado de curvas de nivel.' },
              { key: 'dark', label: 'MODO OSCURO', desc: 'Cartografía vectorial CartoDB Dark Matter de alto contraste.' },
              { key: 'positron', label: 'MODO CLARO', desc: 'Cartografía vectorial CartoDB Positron de fondo blanco neutro.' },
            ] as const
          ).map((item) => (
            <ScientificTooltip key={item.key} position="bottom" width="w-[280px]" content={item.desc}>
              <button
                onClick={() => setActiveBaseStyle(item.key)}
                className={`px-2 py-1 text-[8px] uppercase tracking-wider font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                  activeBaseStyle === item.key
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                    : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {activeBaseStyle === item.key && <CheckCircle2 className="w-2.5 h-2.5 text-white shrink-0" />}
                <span>{item.label}</span>
              </button>
            </ScientificTooltip>
          ))}
        </div>
      </div>

      {/* 2. ATMÓSFERA, FLUIDODINÁMICA & METEOROLOGÍA */}
      <div className="bg-slate-900/60 border border-slate-800/90 p-2 space-y-1.5">
        <span className="text-[8px] uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
          <Wind className="w-3 h-3 text-cyan-400" /> 2. Atmósfera, Fluidodinámica & Meteorología
        </span>
        <div className="flex flex-wrap items-center gap-1">
          {/* 3D Mode */}
          <ScientificTooltip position="bottom" width="w-[280px]" content="Alternar inclinación 3D (pitch 60°) o vista 2D cenital ortogonal: Permite inspeccionar el dosel urbano tridimensional o análisis planimétrico.">
            <button
              onClick={toggle3D}
              className={`px-2 py-1 border transition-all flex items-center gap-1 font-bold cursor-pointer ${
                is3DMode 
                  ? 'bg-blue-950/90 border-blue-400 text-blue-200 shadow-[0_0_8px_rgba(59,130,246,0.4)]' 
                  : 'bg-black/40 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Navigation className={`w-3 h-3 ${is3DMode ? 'rotate-45 text-blue-400' : 'text-slate-400'}`} />
              <span>{is3DMode ? 'INCLINACIÓN 3D (60°)' : 'PLANO CENITAL 2D'}</span>
            </button>
          </ScientificTooltip>

          {/* Vector Viento */}
          <ScientificTooltip position="bottom" width="w-[300px]" content="Vector cartesiano de velocidad (u, v) y módulo en m/s derivado de la estación AEMET en vivo. Gobierna el transporte advectivo PINN: ∂C/∂t + u·∇C.">
            <button
              onClick={() => setShowWindVector(!showWindVector)}
              className={`px-2 py-1 border transition-all flex items-center gap-1 font-bold cursor-pointer ${
                showWindVector 
                  ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.4)]' 
                  : 'bg-black/40 border-slate-700 text-slate-500 line-through'
              }`}
            >
              <Wind className="w-3 h-3 text-cyan-400" />
              <span>VECTOR VIENTO ({windSpeedMs} m/s)</span>
            </button>
          </ScientificTooltip>

          {/* Partículas Lagrangianas */}
          <ScientificTooltip position="bottom" width="w-[300px]" content="Visualización Monte Carlo de líneas de corriente (Streamlines) en WebGL. Muestra la turbulencia del fluido atmosférico sin alterar los tensores de concentración.">
            <button
              onClick={() => setShowWindParticles(!showWindParticles)}
              className={`px-2 py-1 border transition-all flex items-center gap-1 font-bold cursor-pointer ${
                showWindParticles 
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
                  : 'bg-black/40 border-slate-700 text-slate-500 line-through'
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>PARTÍCULAS LAGRANGIANAS</span>
            </button>
          </ScientificTooltip>

          {/* AOD Óptico */}
          <ScientificTooltip position="bottom" width="w-[300px]" content="Espesor Óptico de Aerosoles (AOD a 550nm): Atenuación de la radiación solar por polvo sahariano y aerosoles secundarios. Formulación Hänel-Petters.">
            <button
              onClick={() => setShowAODLayer(!showAODLayer)}
              className={`px-2 py-1 border transition-all flex items-center gap-1 font-bold cursor-pointer ${
                showAODLayer 
                  ? 'bg-amber-950/90 border-amber-400 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.4)]' 
                  : 'bg-black/40 border-slate-700 text-slate-500 line-through'
              }`}
            >
              <SunMedium className="w-3 h-3 text-amber-400" />
              <span>AOD ÓPTICO</span>
              {aodValue !== undefined && <span className="text-[7.5px] bg-amber-500/20 px-1 py-0.2 border border-amber-500/40 text-amber-200 font-mono">τ = {aodValue}</span>}
            </button>
          </ScientificTooltip>

          {/* Flujo Marino Bahía */}
          <ScientificTooltip position="bottom" width="w-[320px]" content="Flujo dinámico marino de la Bahía de Málaga y densidad de energía cinética (J/m³). Revela el gradiente de presión mesoescala mar-tierra y las zonas de recirculación en la costa.">
            <button
              onClick={() => setShowMarineFlowLayer(!showMarineFlowLayer)}
              className={`px-2 py-1 border transition-all flex items-center gap-1 font-bold cursor-pointer ${
                showMarineFlowLayer 
                  ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
                  : 'bg-black/40 border-slate-700 text-slate-500 line-through'
              }`}
            >
              <Waves className="w-3 h-3 text-cyan-400" />
              <span>FLUJO MARINO</span>
              <span className="text-[7.5px] bg-cyan-900/60 px-1 py-0.2 border border-cyan-700/60 text-cyan-200 font-mono">
                {kineticEnergy} J/m³
              </span>
            </button>
          </ScientificTooltip>

          {/* Hillshade Relieve */}
          <ScientificTooltip position="bottom" width="w-[300px]" content="Relieve y sombreado orográfico DEM (ESRI World Hillshade): Proyecta la topografía montañosa para identificar barreras geográficas que inducen estancamiento.">
            <button
              onClick={() => setShowHillshade(!showHillshade)}
              className={`px-2 py-1 border transition-all flex items-center gap-1 font-bold cursor-pointer ${
                showHillshade 
                  ? 'bg-amber-950/90 border-amber-400 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.4)]' 
                  : 'bg-black/40 border-slate-700 text-slate-500 line-through'
              }`}
            >
              <Mountain className="w-3 h-3 text-amber-400" />
              <span>RELIEVE DEM</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {/* 3. MALLA ESCALAR & CONCENTRACIÓN DE CONTAMINANTES */}
      <div className="bg-slate-900/60 border border-slate-800/90 p-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[8px] uppercase tracking-wider text-fuchsia-400 font-bold flex items-center gap-1.5">
            <Building2 className="w-3 h-3 text-fuchsia-400" /> 3. Malla Escalar & Concentración (Anti-Saturación)
          </span>
          <span className="text-[7.5px] text-slate-400 font-mono">
            {activeMeshType === 'none' ? 'SIN MALLA ACTIVA' : activeMeshType === 'd3' ? 'ISOPLETAS 2D' : activeMeshType === 'deckgl' ? '3D GPU' : 'SATÉLITE S5P'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <ScientificTooltip position="bottom" width="w-[260px]" content="Desactivar toda malla superpuesta para despejar la vista ortofotográfica y visualización morfológica pura.">
            <button
              onClick={() => handleSelectMesh('none')}
              className={`px-2 py-1 border text-[8px] font-mono transition-all font-bold cursor-pointer ${
                activeMeshType === 'none'
                  ? 'bg-slate-800 border-slate-500 text-white shadow-[0_0_8px_rgba(255,255,255,0.15)]'
                  : 'bg-black/40 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              SIN MALLA
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[300px]" content="Isopletas continuas 2D calculadas mediante interpolación física y gradientes espaciales continuos D3.">
            <button
              onClick={() => handleSelectMesh('d3')}
              className={`px-2 py-1 border text-[8px] font-mono transition-all font-bold cursor-pointer ${
                activeMeshType === 'd3'
                  ? 'bg-fuchsia-950/90 border-fuchsia-400 text-fuchsia-200 shadow-[0_0_10px_rgba(217,70,239,0.5)]'
                  : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              ISOPLETAS 2D (D3)
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[300px]" content="Columnas tridimensionales aceleradas por hardware WebGL/Deck.gl con extrusión proporcional a la concentración superficial.">
            <button
              onClick={() => handleSelectMesh('deckgl')}
              className={`px-2 py-1 border text-[8px] font-mono transition-all font-bold cursor-pointer ${
                activeMeshType === 'deckgl'
                  ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                  : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              COLUMNAS 3D (GPU)
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[300px]" content="Malla de celdas satelitales Sentinel-5P TROPOMI de Copernicus con asimilación de columnas troposféricas.">
            <button
              onClick={() => handleSelectMesh('s5p')}
              className={`px-2 py-1 border text-[8px] font-mono transition-all font-bold cursor-pointer ${
                activeMeshType === 's5p'
                  ? 'bg-purple-950/90 border-purple-400 text-purple-200 font-bold shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                  : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              SATÉLITE S5P TROPOMI
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[320px]" content="Visualización Volumétrica 3D Atmosférica (Hexagon Layer): Agrupa las emisiones NOx por micro-celdas hexagonales con extrusión vertical agresiva para revelar cañones urbanos y puntos calientes de dispersión limitada.">
            <button
              onClick={() => handleSelectMesh('volumetric')}
              className={`px-2 py-1 border text-[8px] font-mono transition-all font-bold cursor-pointer ${
                activeMeshType === 'volumetric'
                  ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_10px_rgba(217,119,6,0.5)]'
                  : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              VOLUMÉTRICO 3D
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[340px]" content={SYSTEM_PROPAGATION.spatialKrigingTooltip}>
            <button
              onClick={() => handleSelectMesh('kriging')}
              className={`px-2 py-1 border text-[8px] font-mono transition-all font-bold cursor-pointer ${
                activeMeshType === 'kriging'
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 font-bold shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                  : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              KRIGING UQ (σ²)
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[320px]" content={`Capa Cartográfica de Red de Confianza & Certidumbre PINN: Muestra un degradado térmico continuo (Verde → Amarillo → Naranja → Rojo) indicando la certidumbre de asimilación calculada sobre la totalidad de las ${SYSTEM_PROPAGATION.sensorNetwork.totalTerrestrial} estaciones terrestres y ${SYSTEM_PROPAGATION.sensorNetwork.totalSatellites} satélites.`}>
            <button
              onClick={() => toggleConfidenceLayer()}
              className={`px-2 py-1 border text-[8px] font-mono transition-all font-bold cursor-pointer flex items-center gap-1 ${
                showConfidenceLayer
                  ? 'bg-indigo-950/90 border-indigo-400 text-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                  : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              <span>RED CONFIANZA PINN {showConfidenceLayer ? '(ON)' : '(OFF)'}</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {/* 4. EMISIONES URBANAS, MOVILIDAD & ARBOLADO */}
      <div className="bg-slate-900/60 border border-slate-800/90 p-2 space-y-1.5">
        <span className="text-[8px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
          <Car className="w-3 h-3 text-amber-400" /> 4. Emisiones Urbanas, Movilidad & Arbolado
        </span>
        <div className="flex flex-wrap items-center gap-1">
          {/* Tráfico COPERT 5 */}
          <ScientificTooltip position="bottom" width="w-[320px]" content="Emisiones de NOx del tráfico vehicular calculadas mediante metodología europea Tier 3 COPERT 5 (EMEP/EEA) por tramo de calle en g/(s·m).">
            <button
              onClick={() => setShowTrafficNoxLayer(!showTrafficNoxLayer)}
              className={`px-2 py-1 border transition-all flex items-center gap-1 font-bold cursor-pointer ${
                showTrafficNoxLayer 
                  ? 'bg-amber-950/90 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.4)]' 
                  : 'bg-black/40 border-slate-700 text-slate-500 line-through'
              }`}
            >
              <Car className="w-3 h-3 text-amber-400" />
              <span>TRÁFICO NOₓ (COPERT 5)</span>
            </button>
          </ScientificTooltip>

          {/* Arbolado Urbano Ciudad Completa */}
          <ScientificTooltip position="bottom" width="w-[340px]" content="Alineaciones de arbolado viario y copas de los 11 distritos de Málaga (Portal de Datos Abiertos / WFS). Coloreado por índice de alergenicidad OPALS, halo de fitorremediación y grosor foliar. Muestra en vivo la fito-extracción de NO₂, PM₂.₅, O₃ y la refrigeración microclimática.">
            <button
              onClick={() => setShowMalagaTreesLayer(!showMalagaTreesLayer)}
              className={`px-2 py-1 border transition-all flex items-center gap-1 font-bold cursor-pointer ${
                showMalagaTreesLayer 
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                  : 'bg-black/40 border-slate-700 text-slate-500 line-through'
              }`}
            >
              <Trees className="w-3 h-3 text-emerald-400" />
              <span>ARBOLADO URBANO (CIUDAD COMPLETA)</span>
            </button>
          </ScientificTooltip>

          {/* Subpanel Dedicado: Selector de Especies y Filtro de Secuestro de NOx */}
          {showMalagaTreesLayer && (
            <div className="w-full bg-emerald-950/80 border border-emerald-500/60 p-2 rounded flex flex-wrap items-center justify-between gap-2 mt-1 shadow-lg font-mono text-[10px]">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-emerald-300 font-bold">
                  <Filter className="w-3 h-3 text-emerald-400" />
                  <span>FILTRO NOₓ:</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-950/90 p-0.5 rounded border border-emerald-800/80">
                  <ScientificTooltip content="Mostrar todo el censo arbóreo municipal georreferenciado de Málaga sin restricciones de captación.">
                    <button
                      onClick={() => setTreeNoxFilterLevel('all')}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer ${treeNoxFilterLevel === 'all' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      TODAS
                    </button>
                  </ScientificTooltip>
                  <ScientificTooltip content="Filtrar árboles con alta velocidad de deposición seca de Wesely (Vd NO₂ ≥ 0.30 cm/s y >8 kg NOx/año por árbol, ej. Platanus, Melia, Celtis).">
                    <button
                      onClick={() => setTreeNoxFilterLevel('high')}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer ${treeNoxFilterLevel === 'high' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      ALTA (Vd ≥ 0.30)
                    </button>
                  </ScientificTooltip>
                  <ScientificTooltip content="Filtrar árboles con capacidad media de absorción foliar de NOx (Vd NO₂ entre 0.20 y 0.30 cm/s, ej. Citrus, Jacaranda).">
                    <button
                      onClick={() => setTreeNoxFilterLevel('medium')}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer ${treeNoxFilterLevel === 'medium' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      MEDIA
                    </button>
                  </ScientificTooltip>
                  <ScientificTooltip content="Filtrar árboles con baja conductancia estomática o dosel reducido para NOx (Vd NO₂ < 0.20 cm/s).">
                    <button
                      onClick={() => setTreeNoxFilterLevel('low')}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer ${treeNoxFilterLevel === 'low' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      BAJA
                    </button>
                  </ScientificTooltip>
                </div>

                <div className="flex items-center gap-1.5 ml-1">
                  <ScientificTooltip content="Filtrar la masa arbórea por especie botánica certificada del inventario municipal de Málaga para evaluar su resistencia de Wesely y balance BVOC.">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-300 font-bold flex items-center gap-1 cursor-help">
                        <Trees className="w-3 h-3 text-emerald-400" />
                        <span>ESPECIE:</span>
                      </span>
                      <select
                        value={treeSpeciesFilterId}
                        onChange={(e) => setTreeSpeciesFilterId(e.target.value)}
                        className="bg-slate-950 border border-emerald-700/80 text-emerald-200 text-[9.5px] px-2 py-0.5 rounded font-mono focus:outline-none focus:border-emerald-400 cursor-pointer"
                      >
                        <option value="all">Todas las Especies de Málaga ({MALAGA_SPECIES_CATALOG.length})</option>
                        {MALAGA_SPECIES_CATALOG.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.commonName} ({sp.scientificName}) • Vd: {sp.vdNO2} cm/s
                          </option>
                        ))}
                      </select>
                    </div>
                  </ScientificTooltip>
                </div>
              </div>

              <ScientificTooltip content="Abrir la ficha técnica de fisiología estomática real: conductancia gs en tiempo real acoplada a VPD y radiación solar, resistencia canópica de Wesely Rc y tasa neta de absorción foliar.">
                <button
                  onClick={() => {
                    setTreeModalInitialTab('live_physiology');
                    setActiveModal('malagaTreesInventory');
                  }}
                  className="bg-emerald-900/90 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/80 px-2 py-1 rounded flex items-center gap-1.5 text-[9.5px] font-bold transition-all shadow-[0_0_8px_rgba(16,185,129,0.3)] cursor-pointer"
                >
                  <Leaf className="w-3 h-3 text-emerald-300 animate-pulse" />
                  <span>FISIOLOGÍA ESTOMÁTICA REAL (g_s)</span>
                </button>
              </ScientificTooltip>
            </div>
          )}

          {/* Puerto & Cruceros */}
          <ScientificTooltip position="bottom" width="w-[320px]" content="Emisiones en atraque (hotelling) de buques y cruceros en el Puerto de Málaga (Dársena de Levante, Muelle 2) según Tier 3 EMEP/EEA.">
            <button
              onClick={() => setShowPortCruiseLayer(!showPortCruiseLayer)}
              className={`px-2 py-1 border transition-all flex items-center gap-1 font-bold cursor-pointer ${
                showPortCruiseLayer 
                  ? 'bg-indigo-950/90 border-indigo-400 text-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.4)]' 
                  : 'bg-black/40 border-slate-700 text-slate-500 line-through'
              }`}
            >
              <Anchor className="w-3 h-3 text-indigo-400" />
              <span>PUERTO & CRUCEROS</span>
            </button>
          </ScientificTooltip>

          {/* Panel de Control Hidrodinámico Alborán & Aeropuerto AGP */}
          <ScientificTooltip position="bottom" width="w-[340px]" content="Panel de control hidrodinámico: Corrientes de fondo en Mar de Alborán (WAG/EAG), densidad TEOS-10, salinidad PSU, dispersión de penachos de cruceros (Briggs) y vórtices nvPM del Aeropuerto AGP.">
            <button
              onClick={() => useUIStore.getState().setActiveModal('alboranCruiseAirport')}
              className="px-2 py-1 border transition-all flex items-center gap-1 font-bold cursor-pointer bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.4)] hover:bg-cyan-900"
            >
              <Waves className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>ALBORÁN, CRUCEROS & AGP</span>
            </button>
          </ScientificTooltip>

          {/* Vías OSM */}
          <ScientificTooltip position="bottom" width="w-[300px]" content="Trazado de red viaria de OpenStreetMap (highway=motorway, primary, secondary, residential) que define los ejes de cañón urbano.">
            <button
              onClick={() => setShowRoads(!showRoads)}
              className={`px-2 py-1 border transition-colors flex items-center gap-1 font-bold cursor-pointer ${
                showRoads 
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200' 
                  : 'bg-black/40 border-slate-700 text-slate-500 line-through'
              }`}
            >
              <span>🛣️</span>
              <span>RED VIARIA OSM</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {/* 5. RED OFICIAL DE VIGILANCIA & CALIBRACIÓN */}
      <div className="bg-slate-900/60 border border-slate-800/90 p-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[8px] uppercase tracking-wider text-blue-400 font-bold flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-blue-400" /> 5. Red Oficial de Vigilancia & Calibración
          </span>
          {calibrationLogsCount > 0 && (
            <span className="text-[7.5px] bg-blue-950 text-blue-300 border border-blue-700 px-1 py-0.2 font-mono">
              {calibrationLogsCount} CALIBRACIONES
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {/* Estaciones Oficiales */}
          <ScientificTooltip position="bottom" width="w-[340px]" content={SYSTEM_PROPAGATION.stationsLayerTooltip}>
            <button
              onClick={() => setShowOfficialStations(!showOfficialStations)}
              className={`px-2 py-1 border transition-all flex items-center gap-1 font-bold cursor-pointer ${
                showOfficialStations 
                  ? 'bg-blue-950/90 border-blue-400 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.4)]' 
                  : 'bg-black/40 border-slate-700 text-slate-500 line-through'
              }`}
            >
              <Radio className="w-3 h-3 text-blue-400" />
              <span>{SYSTEM_PROPAGATION.stationsButtonLabel}</span>
            </button>
          </ScientificTooltip>

          {/* Abrir Modal Observatorio */}
          {onOpenOfficialStationsModal && (
            <ScientificTooltip position="bottom" width="w-[300px]" content={SYSTEM_PROPAGATION.observatoryTooltip}>
              <button
                onClick={onOpenOfficialStationsModal}
                className="px-2 py-1 border border-cyan-600/80 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 text-[8px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_8px_rgba(6,182,212,0.3)]"
              >
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                <span>VER {SYSTEM_PROPAGATION.observatoryCapsule}</span>
              </button>
            </ScientificTooltip>
          )}

          {/* Guardar Calibración */}
          {handleSaveCalibration && (
            <ScientificTooltip position="bottom" width="w-[280px]" content="Guardar registro de calibración cruzada en el log auditable FAIRMODE para reproducibilidad científica.">
              <button
                onClick={handleSaveCalibration}
                className="px-2 py-1 border border-emerald-600/80 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 text-[8px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              >
                <BookmarkCheck className="w-3 h-3 text-emerald-400" />
                <span>GUARDAR CALIBRACIÓN</span>
              </button>
            </ScientificTooltip>
          )}
        </div>
      </div>

      {/* 6. PALETA PERCEPTUAL FAIRMODE */}
      <div className="bg-slate-900/60 border border-slate-800/90 p-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Palette className="w-3 h-3 text-fuchsia-400 shrink-0" />
          <span className="text-[8px] uppercase tracking-wider text-slate-300 font-bold">6. Paleta Perceptual FAIRMODE:</span>
          {(['turbo', 'viridis', 'plasma', 'magma'] as const).map((pal) => (
            <ScientificTooltip key={pal} position="bottom" width="w-[240px]" content={`Paleta científica continua ${pal.toUpperCase()} recomendada para gradientes escalares uniformes.`}>
              <button
                onClick={() => setScientificPalette(pal)}
                className={`px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-bold border transition-all cursor-pointer ${
                  scientificPalette === pal
                    ? 'bg-fuchsia-600 border-fuchsia-400 text-white shadow-[0_0_8px_rgba(217,70,239,0.5)]'
                    : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {pal}
              </button>
            </ScientificTooltip>
          ))}
        </div>
      </div>
    </div>
  );
});

