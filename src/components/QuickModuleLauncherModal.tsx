/**
 * EXPLORADOR RÁPIDO DE MÓDULOS CIENTÍFICOS (COMMAND PALETTE)
 * Proyecto: Gemelo Digital de Calidad del Aire de Málaga (Tesis Doctoral).
 * 
 * Centraliza el acceso intuitivo a todas las herramientas del sistema organizadas
 * en 4 Pilares Maestros con búsqueda instantánea y atajo global (Ctrl+K).
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SYSTEM_PROPAGATION } from '../lib/systemPropagationEngine';
import {
  Search,
  X,
  Sparkles,
  Zap,
  Globe,
  Building2,
  Atom,
  GraduationCap,
  ChevronRight,
  Radio,
  Layers,
  FileText,
  ShieldCheck,
  Award,
  Activity,
  Trees,
  Car,
  Compass,
  FileSpreadsheet,
  Wind,
  Waves,
  Cpu,
  Ship,
  Plane,
  Pin
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { useActivePoint } from '../context/ActivePointContext';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import { SCIENTIFIC_CATEGORIES, TOTAL_KEY_THESIS_MODULES } from './IntelligentDockTabs';
import { useUIStore } from '../store/uiStore';

export type ThematicAxisType = 'satellite' | 'canyons' | 'photochem' | 'mobility' | 'health_q1' | 'thesis_fair';

export interface ModuleLauncherItem {
  id: string;
  name: string;
  tag: string;
  pillar: ThematicAxisType;
  pillarLabel: string;
  pillarColor: string;
  icon: React.ReactNode;
  description: string;
  formula?: string;
  isKeyThesis?: boolean;
}

export const MASTER_PILLARS: {
  id: ThematicAxisType;
  label: string;
  icon: string;
  color: string;
  description: string;
}[] = [
  {
    id: 'satellite',
    label: '1. Satélite & Asimilación',
    icon: '🛰️',
    color: 'border-cyan-500 text-cyan-400 bg-cyan-950/40',
    description: `Red Oficial de Málaga (${SYSTEM_PROPAGATION.stationsCount} terrestres + ${SYSTEM_PROPAGATION.satellitesCount} espaciales), Copernicus CAMS, Sentinel-5P TROPOMI, telemetría e historial horario 7D.`
  },
  {
    id: 'canyons',
    label: '2. Cañones & Microfísica',
    icon: '🏙️',
    color: 'border-amber-500 text-amber-400 bg-amber-950/40',
    description: 'Morfología H/W Oke (1987), fotogrametría 3D, sondeo vertical 0-50m, árboles urbanos y CFD LBM.'
  },
  {
    id: 'photochem',
    label: '3. Fotoquímica & Aerosoles',
    icon: '⚛️',
    color: 'border-purple-500 text-purple-400 bg-purple-950/40',
    description: 'Ciclo de Leighton, radicales OH/NO3, química costera nocturna ClNO2, formación SOA y deposición seca de Wesely.'
  },
  {
    id: 'mobility',
    label: '4. Movilidad & Emisiones',
    icon: '🚗',
    color: 'border-rose-500 text-rose-400 bg-rose-950/40',
    description: 'Factores de emisión COPERT 5, flota real DGT/EMT, ZBE de Málaga, buques portuarios y dispersión LTO aeroportuaria.'
  },
  {
    id: 'health_q1',
    label: '5. Salud & Fronteras Q1',
    icon: '🫁',
    color: 'border-emerald-500 text-emerald-400 bg-emerald-950/40',
    description: 'Directiva (UE) 2024/2881, dosimetría pediátrica ICRP 66 en colegios, justicia ambiental, regla 3-30-300 y DALYs.'
  },
  {
    id: 'thesis_fair',
    label: '6. Metrología & Auditoría FAIR',
    icon: '🎓',
    color: 'border-indigo-500 text-indigo-400 bg-indigo-950/40',
    description: 'Validación FAIRMODE WG1 (MQI ≤ 1.0), incertidumbre GUM, cuaderno Jupyter, atlas de ecuaciones y exportación LaTeX/PDF.'
  }
];

const buildAllSystemModules = (): ModuleLauncherItem[] => {
  const map = new Map<string, ModuleLauncherItem>();



  SCIENTIFIC_CATEGORIES.forEach(cat => {
    let defaultPillar: ThematicAxisType = 'thesis_fair';
    let defaultPillarLabel = '6. Metrología & Auditoría FAIR';
    let defaultPillarColor = 'text-indigo-400 border-indigo-700 bg-indigo-950/60';

    if (cat.id === 'satellite_earth_engine') {
      defaultPillar = 'satellite';
      defaultPillarLabel = '1. Satélite & Asimilación';
      defaultPillarColor = 'text-cyan-400 border-cyan-700 bg-cyan-950/60';
    } else if (cat.id === 'geodesy_canyons' || cat.id === 'microclimate_pbl') {
      defaultPillar = 'canyons';
      defaultPillarLabel = '2. Cañones & Microfísica';
      defaultPillarColor = 'text-amber-400 border-amber-700 bg-amber-950/60';
    } else if (cat.id === 'chemistry_particles' || cat.id === 'chemical_kinetics') {
      defaultPillar = 'photochem';
      defaultPillarLabel = '3. Fotoquímica & Aerosoles';
      defaultPillarColor = 'text-purple-400 border-purple-700 bg-purple-950/60';
    } else if (cat.id === 'mobility_emissions' || cat.id === 'urban_traffic') {
      defaultPillar = 'mobility';
      defaultPillarLabel = '4. Movilidad & Emisiones';
      defaultPillarColor = 'text-rose-400 border-rose-700 bg-rose-950/60';
    } else if (cat.id === 'health_impact' || cat.id === 'q1_frontiers') {
      defaultPillar = 'health_q1';
      defaultPillarLabel = '5. Salud & Fronteras Q1';
      defaultPillarColor = 'text-emerald-400 border-emerald-700 bg-emerald-950/60';
    }

    cat.modules.forEach(m => {
      if (map.has(m.id)) return;

      let pillar: ThematicAxisType = defaultPillar;
      let pillarLabel = defaultPillarLabel;
      let pillarColor = defaultPillarColor;

      // Enrutamiento fino por eje temático
      if (['liveIngestion', 'officialStations', 'stationAudit', 'satelliteAssimilation', 'earthEngineSatellite', 'earthEngine3DVolumetric', 'tropomiIntercomparison', 'secretsManager', 'trafficLoopsLive'].includes(m.id)) {
        pillar = 'satellite';
        pillarLabel = '1. Satélite & Asimilación';
        pillarColor = 'text-cyan-400 border-cyan-700 bg-cyan-950/60';
      } else if (['urbanCanyonCriticality', 'canyonGeometryOsm', 'lbmCfd', 'streetCanyonProfiles', 'solarShadingCanyon', 'googleMaps3DCanyon', 'streetViewCanyon', 'googleStreetViewTab', 'malagaTreesInventory', 'streetTreePlanting', 'greenRoofMitigation', 'huntQCriterion'].includes(m.id)) {
        pillar = 'canyons';
        pillarLabel = '2. Cañones & Microfísica';
        pillarColor = 'text-amber-400 border-amber-700 bg-amber-950/60';
      } else if (['no2MassBudget', 'no2NighttimeChemistry', 'unifiedPhotochemistrySuite', 'extendedLeighton', 'coastalHalogens', 'photochemicalRegime', 'vbsSoa', 'photochemicalRadicals', 'chemicalSpecies', 'spectralPhotolysis', 'weselyDeposition', 'tio2Photocatalysis'].includes(m.id)) {
        pillar = 'photochem';
        pillarLabel = '3. Fotoquímica & Aerosoles';
        pillarColor = 'text-purple-400 border-purple-700 bg-purple-950/60';
      } else if (['malagaTrafficInventory', 'copertTraffic', 'rLineDispersion', 'trafficNoxInspector', 'trafficDiurnalPattern', 'portHotellingEmissions', 'shipPlumeMicrophysics', 'guadalhorceAirportReceptor', 'alboranSeaCruiseAirportControl'].includes(m.id)) {
        pillar = 'mobility';
        pillarLabel = '4. Movilidad & Emisiones';
        pillarColor = 'text-rose-400 border-rose-700 bg-rose-950/60';
      } else if (['populationExposure', 'schoolAirEquity', 'environmentalJustice', 'icrp66Dosimetry', 'gumUncertainty', 'greenJustice330300', 'healthyRouting', 'healthEconomicsSas', 'q1FrontiersSuite', 'q1ResearchSuite'].includes(m.id)) {
        pillar = 'health_q1';
        pillarLabel = '5. Salud & Fronteras Q1';
        pillarColor = 'text-emerald-400 border-emerald-700 bg-emerald-950/60';
      } else if (['thesisMethodologySuite', 'fairmodeValidation', 'scientificAtlas', 'latexThesis', 'phdDefenseWalkthrough', 'highResPdfReport', 'tribunalDefenseAdvisor', 'pythonJupyterNotebook', 'fairDataExporter', 'scientificInteroperability', 'w3cProvGraph', 'regulatoryAudit', 'sobolSensitivity', 'systemIntegrityAudit'].includes(m.id)) {
        pillar = 'thesis_fair';
        pillarLabel = '6. Metrología & Auditoría FAIR';
        pillarColor = 'text-indigo-400 border-indigo-700 bg-indigo-950/60';
      }

      map.set(m.id, {
        id: m.id,
        name: m.name,
        tag: m.tag,
        pillar,
        pillarLabel,
        pillarColor,
        icon: m.icon,
        description: m.description,
        isKeyThesis: m.isKeyThesis ?? true
      });
    });
  });

  return Array.from(map.values());
};

export const ALL_SYSTEM_MODULES: ModuleLauncherItem[] = buildAllSystemModules();

interface QuickModuleLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (moduleId: string) => void;
}

export const QuickModuleLauncherModal: React.FC<QuickModuleLauncherModalProps> = ({
  isOpen,
  onClose,
  onSelectModule
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPillar, setSelectedPillar] = useState<string>('all');
  const [onlyKeyThesis, setOnlyKeyThesis] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pinnedShortcuts = useUIStore((state) => state.pinnedShortcuts);
  const togglePinnedShortcut = useUIStore((state) => state.togglePinnedShortcut);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const filteredModules = useMemo(() => {
    return ALL_SYSTEM_MODULES.filter(mod => {
      if (selectedPillar !== 'all' && mod.pillar !== selectedPillar) {
        return false;
      }
      if (onlyKeyThesis && !mod.isKeyThesis) {
        return false;
      }
      if (!searchQuery.trim()) {
        return true;
      }
      const q = searchQuery.toLowerCase();
      return (
        mod.name.toLowerCase().includes(q) ||
        mod.tag.toLowerCase().includes(q) ||
        mod.description.toLowerCase().includes(q) ||
        (mod.formula && mod.formula.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedPillar, onlyKeyThesis]);

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title="EXPLORADOR DE MÓDULOS DE LA TESIS DOCTORAL"
      subtitle={`Acceso directo y búsqueda unificada en las ${TOTAL_KEY_THESIS_MODULES} suites metodológicas del Gemelo Digital`}
      icon={<GraduationCap className="w-4 h-4 text-emerald-400" />}
      onClose={onClose}
      className="w-full max-w-3xl max-h-[85vh]"
      badge={`TESIS DOCTORAL • ${TOTAL_KEY_THESIS_MODULES} MÓDULOS`}
      defaultCollapsed={false}
    >
      <div className="flex flex-col h-[75vh] md:h-[620px] overflow-hidden text-slate-200 bg-[#090d16] font-mono">
        {/* Banner de Sincronización Global del Punto Activo */}
        <div className="p-2 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <ActivePointSyncBanner compact={true} />
        </div>

        <div className="p-3 space-y-3 font-mono text-[11px] text-slate-200 flex-1 overflow-hidden flex flex-col">
          {/* Barra de Búsqueda Principal */}
          <div className="relative shrink-0">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, ecuación o concepto (ej. Leighton, Oke, Wesely, LaTeX, FAIRMODE, COPERT, NO2)..."
              className="w-full pl-9 pr-9 py-2 bg-black/60 border border-slate-700 text-[11.5px] text-emerald-200 placeholder-slate-500 rounded focus:outline-none focus:border-emerald-500 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtros por 6 Ejes Temáticos de la Tesis */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-800 shrink-0">
            <ScientificTooltip content="Mostrar todas las suites metodológicas y herramientas de modelización física disponibles en el Gemelo Digital.">
              <button
                onClick={() => setSelectedPillar('all')}
                className={`px-2.5 py-1 text-[10px] rounded font-bold border transition-all cursor-pointer ${
                  selectedPillar === 'all'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                TODOS ({ALL_SYSTEM_MODULES.length})
              </button>
            </ScientificTooltip>

          {MASTER_PILLARS.map((p) => {
            const isSelected = selectedPillar === p.id;
            const count = ALL_SYSTEM_MODULES.filter(m => m.pillar === p.id).length;

            return (
              <ScientificTooltip key={p.id} content={p.description}>
                <button
                  onClick={() => setSelectedPillar(p.id)}
                  className={`px-2.5 py-1 text-[10px] rounded font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? `${p.color} shadow-sm`
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                  <span className="text-[8.5px] px-1 bg-black/40 rounded border border-slate-700/60">
                    {count}
                  </span>
                </button>
              </ScientificTooltip>
            );
          })}

          <div className="ml-auto">
            <ScientificTooltip content="Filtrar exclusivamente las suites y módulos nucleares prioritarios para la memoria y defensa de la tesis doctoral.">
              <button
                onClick={() => setOnlyKeyThesis(!onlyKeyThesis)}
                className={`px-2 py-1 text-[9.5px] rounded font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  onlyKeyThesis
                    ? 'bg-amber-950 text-amber-300 border-amber-500'
                    : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-amber-300'
                }`}
              >
                <Award className="w-3 h-3 text-amber-400" />
                <span>SOLO TESIS</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Lista de Módulos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
          {filteredModules.map((item) => {
            const isPinned = pinnedShortcuts.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => {
                  onSelectModule(item.id);
                }}
                className={`text-left p-2 rounded border transition-all cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-md ${
                  isPinned
                    ? 'bg-amber-950/20 border-amber-800/60 hover:bg-slate-800/90'
                    : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      {item.icon}
                      <span className="font-bold text-[10.5px] text-slate-100 group-hover:text-emerald-300 truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-[8px] px-1.5 py-0.2 rounded border font-mono ${item.pillarColor}`}>
                        {item.tag}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinnedShortcut(item.id);
                        }}
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          isPinned
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/60'
                            : 'text-slate-500 hover:text-amber-300 hover:bg-slate-800'
                        }`}
                        title={isPinned ? "Desfijar de accesos directos" : "Fijar como acceso directo"}
                      >
                        <Pin className={`w-3 h-3 ${isPinned ? 'text-amber-400 fill-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {item.formula && (
                  <div className="mt-1.5 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[8.5px] text-amber-300/90 font-mono">
                    <span className="truncate">{item.formula}</span>
                    <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 shrink-0" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-500 font-mono shrink-0">
          <span>Mostrando {filteredModules.length} módulos científicos</span>
          <span className="text-slate-400">Atajo de teclado global: [Ctrl + K] o [/]</span>
        </div>
      </div>
    </div>
  </DraggableWindow>
  );
};
