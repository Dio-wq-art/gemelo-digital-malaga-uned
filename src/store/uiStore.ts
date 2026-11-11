import { create } from 'zustand';

interface UIState {
  activeView: string;
  activeBaseStyle: string;
  isDataLoading: boolean;
  showWindParticles: boolean;
  activeModal: string | null;
  
  // Layer Toggles
  is3DMode: boolean;
  showBuildings: boolean;
  showRoads: boolean;
  showHillshade: boolean;
  showAODLayer: boolean;
  showWindVector: boolean;
  showMarineFlowLayer: boolean;
  showContinuousContour: boolean;
  showOfficialStations: boolean;
  showSatelliteMarkers: boolean;
  showTrafficNoxLayer: boolean;
  showDeckGLMesh: boolean;
  showMalagaTreesLayer: boolean;
  showSentinel5PGrid: boolean;
  showPortCruiseLayer: boolean;
  showVolumetricMesh: boolean;
  showConfidenceLayer: boolean;
  setShowConfidenceLayer: (val: boolean) => void;
  toggleConfidenceLayer: () => void;
  confidenceVectorDensityMode: 'top5' | 'all';
  setConfidenceVectorDensityMode: (mode: 'top5' | 'all') => void;
  toggleConfidenceVectorDensityMode: () => void;
  selectedInstrumentalStationId: string | null;
  setSelectedInstrumentalStationId: (id: string | null) => void;
  
  // UI Panels
  isLegendOpen: boolean;
  showLeftSidebar: boolean;
  showRightSidebar: boolean;
  isExportMenuOpen: boolean;
  isDockExpanded: boolean;
  
  // Trees & Pollutants
  selectedPrimaryPollutant: 'NO2' | 'O3' | 'PM10' | 'PM2.5';
  deckGlActiveSpecies: 'no2' | 'o3' | 'pm10' | 'pm25';
  isMapToolbarOpen: boolean;
  selectedTreeStreetId: string;
  treeModalInitialTab: 'streets' | 'species_catalog' | 'wesely' | 'live_physiology' | 'species_config';
  treeNoxFilterLevel: 'all' | 'high' | 'medium' | 'low';
  treeSpeciesFilterId: string;
  speciesPhysicsOverrides: Record<string, { albedoCanopy?: number; z0RoughnessM?: number; cdDragCoef?: number; defaultLAI?: number }>;
  updateSpeciesPhysicsOverride: (speciesId: string, params: { albedoCanopy?: number; z0RoughnessM?: number; cdDragCoef?: number; defaultLAI?: number }) => void;
  resetSpeciesPhysicsOverrides: () => void;
  
  // Shortcuts & Pinned Tabs
  pinnedShortcuts: string[];
  togglePinnedShortcut: (modalId: string) => void;
  addPinnedShortcut: (modalId: string) => void;
  removePinnedShortcut: (modalId: string) => void;
  movePinnedShortcut: (modalId: string, direction: 'left' | 'right' | 'start') => void;
  isPinnedShortcut: (modalId: string) => boolean;
  resetPinnedShortcutsToDefault: () => void;
  
  // App Modes & Camera
  performanceMode: boolean;
  isOrbiting: boolean;
  activeCameraPreset: 'free' | 'canyon' | 'downwind' | 'bay' | 'zenith' | 'birdeye';
  forecastHorizon: '12h' | '24h' | '48h';

  // Point Selection Reliability Badge
  hasUserSelectedPoint: boolean;
  setHasUserSelectedPoint: (val: boolean) => void;

  // Setters
  setActiveView: (view: string) => void;
  setActiveBaseStyle: (style: string) => void;
  setIsDataLoading: (loading: boolean) => void;
  setShowWindParticles: (show: boolean) => void;
  setActiveModal: (modal: string | null) => void;
  
  setSelectedPrimaryPollutant: (species: 'NO2' | 'O3' | 'PM10' | 'PM2.5') => void;
  setDeckGlActiveSpecies: (species: 'no2' | 'o3' | 'pm10' | 'pm25') => void;
  setIsMapToolbarOpen: (val: boolean) => void;
  setExclusiveMeshLayer: (layerType: 'contour' | 'deckgl' | 'sentinel' | 'none') => void;
  
  setIs3DMode: (val: boolean) => void;
  setShowBuildings: (val: boolean) => void;
  setShowRoads: (val: boolean) => void;
  setShowHillshade: (val: boolean) => void;
  setShowAODLayer: (val: boolean) => void;
  setShowWindVector: (val: boolean) => void;
  setShowMarineFlowLayer: (val: boolean) => void;
  setShowContinuousContour: (val: boolean) => void;
  setShowOfficialStations: (val: boolean) => void;
  setShowSatelliteMarkers: (val: boolean) => void;
  setShowTrafficNoxLayer: (val: boolean) => void;
  setShowDeckGLMesh: (val: boolean) => void;
  setShowMalagaTreesLayer: (val: boolean) => void;
  setShowSentinel5PGrid: (val: boolean) => void;
  setShowPortCruiseLayer: (val: boolean) => void;
  setShowVolumetricMesh: (val: boolean) => void;
  showKrigingVarianceLayer: boolean;
  setShowKrigingVarianceLayer: (val: boolean) => void;
  setSelectedTreeStreetId: (id: string) => void;
  setTreeModalInitialTab: (tab: 'streets' | 'species_catalog' | 'wesely' | 'live_physiology' | 'species_config') => void;
  setTreeNoxFilterLevel: (level: 'all' | 'high' | 'medium' | 'low') => void;
  setTreeSpeciesFilterId: (id: string) => void;
  
  setIsLegendOpen: (val: boolean) => void;
  setShowLeftSidebar: (val: boolean) => void;
  setShowRightSidebar: (val: boolean) => void;
  setIsExportMenuOpen: (val: boolean) => void;
  setIsDockExpanded: (val: boolean) => void;
  toggleDock: () => void;
  
  setPerformanceMode: (val: boolean) => void;
  setIsOrbiting: (val: boolean) => void;
  setActiveCameraPreset: (preset: 'free' | 'canyon' | 'downwind' | 'bay' | 'zenith' | 'birdeye') => void;
  setForecastHorizon: (val: '12h' | '24h' | '48h') => void;
}

const PINNED_SHORTCUTS_STORAGE_KEY = 'malaga_digital_twin_pinned_shortcuts_v2';
export const DEFAULT_PINNED_SHORTCUTS: string[] = [
  'pinnBenchmark:worldFrontiers',
  'unifiedCanyonSuite:vertical_profile',
  'scientificAtlas:leighton_photostationary',
  'scientificAtlas:sobol_sensitivity_analysis',
  'populationExposure:pediatric_icrp66',
  'extendedLeighton:radicals_oxidation',
  'copertTraffic:speed_curves',
  'unifiedCanyonSuite:regimes'
];

function getInitialPinnedShortcuts(): string[] {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(PINNED_SHORTCUTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Error al leer atajos fijados de localStorage:', e);
  }
  return DEFAULT_PINNED_SHORTCUTS;
}

function savePinnedShortcuts(shortcuts: string[]): void {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(PINNED_SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcuts));
    }
  } catch (e) {
    console.warn('Error al guardar atajos fijados en localStorage:', e);
  }
}

export const useUIStore = create<UIState>((set, get) => ({
  activeView: 'dashboard',
  activeBaseStyle: 'google_hybrid', // A petición del usuario, Google Híbrido pasa a ser el primario (satélite + calles)
  isDataLoading: false,
  showWindParticles: false, // Desactivado por defecto
  activeModal: null, // Todas las ventanas cerradas al arrancar por defecto
  
  pinnedShortcuts: getInitialPinnedShortcuts(),
  
  togglePinnedShortcut: (modalId: string) => {
    set((state) => {
      const exists = state.pinnedShortcuts.includes(modalId);
      const nextShortcuts = exists
        ? state.pinnedShortcuts.filter((id) => id !== modalId)
        : [...state.pinnedShortcuts, modalId];
      savePinnedShortcuts(nextShortcuts);
      return { pinnedShortcuts: nextShortcuts };
    });
  },

  addPinnedShortcut: (modalId: string) => {
    set((state) => {
      if (state.pinnedShortcuts.includes(modalId)) return state;
      const nextShortcuts = [...state.pinnedShortcuts, modalId];
      savePinnedShortcuts(nextShortcuts);
      return { pinnedShortcuts: nextShortcuts };
    });
  },

  removePinnedShortcut: (modalId: string) => {
    set((state) => {
      const nextShortcuts = state.pinnedShortcuts.filter((id) => id !== modalId);
      savePinnedShortcuts(nextShortcuts);
      return { pinnedShortcuts: nextShortcuts };
    });
  },

  movePinnedShortcut: (modalId: string, direction: 'left' | 'right' | 'start') => {
    set((state) => {
      const idx = state.pinnedShortcuts.indexOf(modalId);
      if (idx === -1) return state;
      const next = [...state.pinnedShortcuts];
      if (direction === 'start') {
        if (idx === 0) return state;
        const [removed] = next.splice(idx, 1);
        next.unshift(removed);
      } else if (direction === 'left') {
        const targetIdx = idx === 0 ? next.length - 1 : idx - 1;
        const tmp = next[targetIdx];
        next[targetIdx] = next[idx];
        next[idx] = tmp;
      } else {
        const targetIdx = idx === next.length - 1 ? 0 : idx + 1;
        const tmp = next[targetIdx];
        next[targetIdx] = next[idx];
        next[idx] = tmp;
      }
      savePinnedShortcuts(next);
      return { pinnedShortcuts: next };
    });
  },

  isPinnedShortcut: (modalId: string) => {
    return get().pinnedShortcuts.includes(modalId);
  },

  resetPinnedShortcutsToDefault: () => {
    savePinnedShortcuts(DEFAULT_PINNED_SHORTCUTS);
    set({ pinnedShortcuts: DEFAULT_PINNED_SHORTCUTS });
  },
  
  is3DMode: false,
  showBuildings: false,
  showRoads: false,
  showHillshade: false,
  showAODLayer: false,
  showWindVector: false,
  showMarineFlowLayer: false,
  showContinuousContour: false,
  showOfficialStations: false, // Desactivado por defecto para no saturar el mapa
  showSatelliteMarkers: false, // Desactivado por defecto para no saturar el mapa
  showTrafficNoxLayer: false,
  showDeckGLMesh: false,
  showMalagaTreesLayer: false, // Desactivado por defecto al arrancar para no saturar el mapa
  showSentinel5PGrid: false,
  showPortCruiseLayer: false,
  showVolumetricMesh: false,
  showConfidenceLayer: false,
  confidenceVectorDensityMode: 'top5',
  setConfidenceVectorDensityMode: (mode) => set({ confidenceVectorDensityMode: mode }),
  toggleConfidenceVectorDensityMode: () => set((state) => ({
    confidenceVectorDensityMode: state.confidenceVectorDensityMode === 'top5' ? 'all' : 'top5'
  })),
  selectedInstrumentalStationId: null,
  setSelectedInstrumentalStationId: (id) => set({ selectedInstrumentalStationId: id }),
  
  isLegendOpen: false,
  showLeftSidebar: false,
  showRightSidebar: false,
  isExportMenuOpen: false,
  isDockExpanded: false, // Minimizado por defecto per Rules 6 y 11
  
  selectedPrimaryPollutant: 'NO2',
  deckGlActiveSpecies: 'no2',
  isMapToolbarOpen: false,
  selectedTreeStreetId: 'MGA-TREE-STR-01',
  treeModalInitialTab: 'streets',
  treeNoxFilterLevel: 'all',
  treeSpeciesFilterId: 'all',
  speciesPhysicsOverrides: {},

  updateSpeciesPhysicsOverride: (speciesId, params) => set((state) => ({
    speciesPhysicsOverrides: {
      ...state.speciesPhysicsOverrides,
      [speciesId]: {
        ...(state.speciesPhysicsOverrides[speciesId] || {}),
        ...params
      }
    }
  })),

  resetSpeciesPhysicsOverrides: () => set({ speciesPhysicsOverrides: {} }),
  
  performanceMode: false,
  isOrbiting: false,
  activeCameraPreset: 'free',
  forecastHorizon: '12h',

  setActiveView: (view) => set({ activeView: view }),
  setActiveBaseStyle: (style) => set({ activeBaseStyle: style }),
  setIsDataLoading: (loading) => set({ isDataLoading: loading }),
  setShowWindParticles: (show) => set({ showWindParticles: show }),
  setActiveModal: (modal) => set({ activeModal: modal }),
  
  setSelectedPrimaryPollutant: (species) => {
    const speciesMap: Record<'NO2' | 'O3' | 'PM10' | 'PM2.5', 'no2' | 'o3' | 'pm10' | 'pm25'> = {
      'NO2': 'no2',
      'O3': 'o3',
      'PM10': 'pm10',
      'PM2.5': 'pm25'
    };
    set({ selectedPrimaryPollutant: species, deckGlActiveSpecies: speciesMap[species] });
  },
  setDeckGlActiveSpecies: (species) => {
    const reverseMap: Record<'no2' | 'o3' | 'pm10' | 'pm25', 'NO2' | 'O3' | 'PM10' | 'PM2.5'> = {
      'no2': 'NO2',
      'o3': 'O3',
      'pm10': 'PM10',
      'pm25': 'PM2.5'
    };
    set({ deckGlActiveSpecies: species, selectedPrimaryPollutant: reverseMap[species] });
  },
  setIsMapToolbarOpen: (val) => set({ isMapToolbarOpen: val }),
  setExclusiveMeshLayer: (layerType) => set({
    showContinuousContour: layerType === 'contour',
    showDeckGLMesh: layerType === 'deckgl',
    showSentinel5PGrid: layerType === 'sentinel'
  }),
  
  setIs3DMode: (val) => set({ is3DMode: val }),
  setShowBuildings: (val) => set({ showBuildings: val }),
  setShowRoads: (val) => set({ showRoads: val }),
  setShowHillshade: (val) => set({ showHillshade: val }),
  setShowAODLayer: (val) => set({ showAODLayer: val }),
  setShowWindVector: (val) => set({ showWindVector: val }),
  setShowMarineFlowLayer: (val) => set({ showMarineFlowLayer: val }),
  setShowContinuousContour: (val) => set({ showContinuousContour: val }),
  setShowOfficialStations: (val) => set({ showOfficialStations: val }),
  setShowSatelliteMarkers: (val) => set({ showSatelliteMarkers: val }),
  setShowTrafficNoxLayer: (val) => set({ showTrafficNoxLayer: val }),
  setShowDeckGLMesh: (val) => set({ showDeckGLMesh: val }),
  setShowMalagaTreesLayer: (val) => set({ showMalagaTreesLayer: val }),
  setShowSentinel5PGrid: (val) => set({ showSentinel5PGrid: val }),
  setShowPortCruiseLayer: (val) => set({ showPortCruiseLayer: val }),
  setShowVolumetricMesh: (val) => set({ showVolumetricMesh: val }),
  setShowConfidenceLayer: (val) => set({ showConfidenceLayer: val, showKrigingVarianceLayer: val }),
  toggleConfidenceLayer: () => set((state) => {
    const nextVal = !state.showConfidenceLayer;
    return { showConfidenceLayer: nextVal, showKrigingVarianceLayer: nextVal };
  }),
  showKrigingVarianceLayer: false,
  setShowKrigingVarianceLayer: (val) => set({ showKrigingVarianceLayer: val, showConfidenceLayer: val }),
  setSelectedTreeStreetId: (id) => set({ selectedTreeStreetId: id }),
  setTreeModalInitialTab: (tab) => set({ treeModalInitialTab: tab }),
  setTreeNoxFilterLevel: (level) => set({ treeNoxFilterLevel: level }),
  setTreeSpeciesFilterId: (id) => set({ treeSpeciesFilterId: id }),
  
  setIsLegendOpen: (val) => set({ isLegendOpen: val }),
  setShowLeftSidebar: (val) => set({ showLeftSidebar: val }),
  setShowRightSidebar: (val) => set({ showRightSidebar: val }),
  setIsExportMenuOpen: (val) => set({ isExportMenuOpen: val }),
  setIsDockExpanded: (val) => set({ isDockExpanded: val }),
  toggleDock: () => set((state) => ({ isDockExpanded: !state.isDockExpanded })),
  
  setPerformanceMode: (val) => set({ performanceMode: val }),
  setIsOrbiting: (val) => set({ isOrbiting: val }),
  setActiveCameraPreset: (preset) => set({ activeCameraPreset: preset }),
  setForecastHorizon: (val) => set({ forecastHorizon: val }),

  hasUserSelectedPoint: false,
  setHasUserSelectedPoint: (val) => set({ hasUserSelectedPoint: val })
}));
