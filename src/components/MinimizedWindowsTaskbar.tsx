import React, { useState, useMemo } from 'react';
import { 
  X, MapPin, LayoutGrid, Sparkles, Activity, ShieldCheck, 
  Compass, Building2, Trees, Car, Database, BarChart3, Wind, Globe, Leaf, Flame, Award, Search, RotateCcw
} from 'lucide-react';
import { useActivePoint } from '../context/ActivePointContext';
import { ScientificTooltip } from './ScientificTooltip';
import { SlidingRibbonBar } from './SlidingRibbonBar';
import { SYSTEM_PROPAGATION } from '../lib/systemPropagationEngine';

export interface MinimizedWindowsTaskbarProps {
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  className?: string;
}

interface ModalDescriptor {
  id: string;
  name: string;
  category: string;
  keywords?: string;
  icon: React.ReactNode;
}

const MODAL_DESCRIPTORS: Record<string, ModalDescriptor> = {
  stationAudit: { id: 'stationAudit', name: SYSTEM_PROPAGATION.observatoryTaskbarName, category: 'OBSERVATORIO', keywords: 'estaciones sensores 24 16 red telemetria', icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> },
  audit: { id: 'audit', name: SYSTEM_PROPAGATION.observatoryTaskbarName, category: 'OBSERVATORIO', keywords: 'auditoria estaciones', icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> },
  thesisMethodologySuite: { id: 'thesisMethodologySuite', name: 'Directrices Director & Metodología (13 Tablas)', category: 'TESIS', keywords: 'director tablas matriz 32 variables anexos pdf', icon: <Award className="w-3.5 h-3.5 text-amber-400" /> },
  fairmodeValidation: { id: 'fairmodeValidation', name: 'Validación FAIRMODE WG1', category: 'AUDITORÍA', keywords: 'fairmode mqi incertidumbre', icon: <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> },
  verticalCanyonSounding: { id: 'verticalCanyonSounding', name: 'Perfil Vertical (1.5m vs 4m) & Bebé', category: 'MICROESCALA', keywords: 'bebe carrito peaton 1.5m 4m directiva 2030 ilusion cumplimiento', icon: <Building2 className="w-3.5 h-3.5 text-amber-400" /> },
  pointInspector: { id: 'pointInspector', name: 'Inspector de Punto', category: 'TELEMETRÍA', keywords: 'punto calle direccion', icon: <MapPin className="w-3.5 h-3.5 text-emerald-400" /> },
  scientificAtlas: { id: 'scientificAtlas', name: 'Atlas Cartográfico Doctoral', category: 'ANÁLISIS', keywords: 'atlas ecuaciones leighton fluidos', icon: <Compass className="w-3.5 h-3.5 text-indigo-400" /> },
  photochemicalRegime: { id: 'photochemicalRegime', name: 'Ciclo de Leighton & Fotoquímica', category: 'CINÉTICA', keywords: 'leighton ozono o3 radicales ro2 pan', icon: <Activity className="w-3.5 h-3.5 text-purple-400" /> },
  verifier: { id: 'verifier', name: 'Auditoría Telemetría', category: 'CALIDAD', keywords: 'verificador calidad', icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> },
  liveIngestion: { id: 'liveIngestion', name: 'Ingesta Satelital En Vivo', category: 'INGESTA', keywords: 'satelite copernicus cams', icon: <Database className="w-3.5 h-3.5 text-sky-400" /> },
  malagaTrafficInventory: { id: 'malagaTrafficInventory', name: 'Tráfico COPERT 5 & Pavimentos TiO₂', category: 'TRÁFICO', keywords: 'tio2 fotocatalisis asfalto 6ppd frenos trafico copert alameda larios', icon: <Car className="w-3.5 h-3.5 text-amber-400" /> },
  malagaTreesInventory: { id: 'malagaTreesInventory', name: 'Fitorremediación Bosque Urbano (Árbol a Árbol)', category: 'VEGETACIÓN', keywords: 'arboles fitorremediacion bvoc soa ficus jacaranda glutamina', icon: <Trees className="w-3.5 h-3.5 text-emerald-400" /> },
  camsBoundary: { id: 'camsBoundary', name: 'Frontera Copernicus CAMS', category: 'COPÉRNICO', keywords: 'cams polvo sahariano', icon: <Wind className="w-3.5 h-3.5 text-cyan-400" /> },
  canyonGeometryOsm: { id: 'canyonGeometryOsm', name: 'Cañón Urbano 3D & Oke', category: '3D', keywords: 'canon 3d oke edificios hw svf', icon: <Building2 className="w-3.5 h-3.5 text-amber-400" /> },
  emtGtfsCopert: { id: 'emtGtfsCopert', name: 'Flota Autobuses EMT GTFS', category: 'TRANSPORTE', keywords: 'emt autobuses transporte', icon: <Car className="w-3.5 h-3.5 text-sky-400" /> },
  moninObukhov: { id: 'moninObukhov', name: 'Turbulencia Monin-Obukhov', category: 'MICROMETEO', keywords: 'monin obukhov capa limite', icon: <Wind className="w-3.5 h-3.5 text-purple-400" /> },
  coastalHalogens: { id: 'coastalHalogens', name: 'Halógenos Marinos (ClNO₂) & SML Puerto', category: 'QUÍMICA', keywords: 'clno2 mar puerto sml ph acidificacion buques', icon: <Activity className="w-3.5 h-3.5 text-teal-400" /> },
  thermalInversion: { id: 'thermalInversion', name: 'Inversión Térmica', category: 'METEO', keywords: 'inversion termica estabilidad', icon: <Activity className="w-3.5 h-3.5 text-rose-400" /> },
  googleMaps3DCanyon: { id: 'googleMaps3DCanyon', name: 'Google Maps 3D Cañón', category: 'VISUALIZADOR', keywords: 'google maps 3d', icon: <Compass className="w-3.5 h-3.5 text-emerald-400" /> },
  sourceApportionment: { id: 'sourceApportionment', name: 'Source Apportionment PMF', category: 'FUENTES', keywords: 'pmf fuentes contribucion', icon: <BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> },
  guadalhorceAirport: { id: 'guadalhorceAirport', name: 'Receptor Aeropuerto AGP', category: 'DISPERSIÓN', keywords: 'aeropuerto aviones lto guadalhorce', icon: <Wind className="w-3.5 h-3.5 text-cyan-400" /> },
  advancedTransect: { id: 'advancedTransect', name: 'Transecto Multicriterio', category: 'TRANSECTO', keywords: 'transecto perfil corte', icon: <LayoutGrid className="w-3.5 h-3.5 text-amber-400" /> },
  tropomiIntercomparison: { id: 'tropomiIntercomparison', name: 'Matriz Intercomparación TROPOMI', category: 'SATÉLITE', keywords: 'tropomi sentinel amf3d satelite', icon: <Globe className="w-3.5 h-3.5 text-purple-400" /> },
  earthEngineSatellite: { id: 'earthEngineSatellite', name: 'Earth Engine & TROPOMI', category: 'SATÉLITE', keywords: 'earth engine landsat ecostress lst', icon: <Globe className="w-3.5 h-3.5 text-purple-400" /> },
  correlationScatterPlot: { id: 'correlationScatterPlot', name: 'Correlación D3 Scatter (OLS)', category: 'METROLOGÍA', keywords: 'correlacion scatter regresion', icon: <BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> },
  activePoint7DayHistory: { id: 'activePoint7DayHistory', name: 'Historial 7 Días (168h)', category: 'TELEMETRÍA', keywords: 'historial 7 dias serie temporal', icon: <Activity className="w-3.5 h-3.5 text-cyan-400" /> },
  no2MassBudget: { id: 'no2MassBudget', name: 'Balance Masa NO₂ (PAN + PCET + AMF-3D)', category: 'CINÉTICA', keywords: 'balance no2 cascada waterfall pan 6ppd pcet amf3d', icon: <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> },
  weselyDryDeposition: { id: 'weselyDryDeposition', name: 'Deposición Seca Wesely & Fotocatálisis TiO₂', category: 'SUMIDERO', keywords: 'wesely deposicion tio2 resistencias damkohler', icon: <Leaf className="w-3.5 h-3.5 text-emerald-400" /> },
  terralMicrophysics: { id: 'terralMicrophysics', name: 'Microfísica del Terral (Foehn)', category: 'METEO FOEHN', keywords: 'terral foehn viento calor', icon: <Flame className="w-3.5 h-3.5 text-amber-400" /> },
  metrologicalCertificate: { id: 'metrologicalCertificate', name: 'Certificado Metrológico GUM', category: 'TESIS', keywords: 'certificado gum iso sha256', icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> },
  environmentalJustice: { id: 'environmentalJustice', name: 'Justicia Socioambiental (Gini / Atkinson / ZBE)', category: 'EQUIDAD', keywords: 'justicia gini atkinson renta zbe vulnerabilidad', icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> },
  schoolAirEquity: { id: 'schoolAirEquity', name: 'Entornos Escolares & Directiva 2030', category: 'COLEGIOS', keywords: 'colegios escuelas ninos pediatria icrp66 2030', icon: <Award className="w-3.5 h-3.5 text-amber-400" /> },
  q1CoastalChemistry: { id: 'q1CoastalChemistry', name: '1. Química Urbana-Costera Q1', category: 'FRONTERAS Q1', keywords: 'q1 quimica costera', icon: <Activity className="w-3.5 h-3.5 text-cyan-400" /> },
  q1MicroscalePhysics: { id: 'q1MicroscalePhysics', name: '2. Física Microescala Q1', category: 'FRONTERAS Q1', keywords: 'q1 fisica microescala', icon: <Wind className="w-3.5 h-3.5 text-sky-400" /> },
  q1FrontiersSuite: { id: 'q1FrontiersSuite', name: 'Fronteras Q1 (2025–2027)', category: 'VANGUARDIA', keywords: 'fronteras 2026', icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> },
  q1ResearchSuite: { id: 'q1ResearchSuite', name: 'Suite Investigación PINN & LBM', category: 'PINN & LBM', keywords: 'pinn lbm boltzmann', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> }
};

const QUICK_DOCK_SUITES: { id: string; label: string }[] = [
  { id: 'thesisMethodologySuite', label: '📕 Directrices (13 Tablas)' },
  { id: 'no2MassBudget', label: '⚖️ Balance NO₂' },
  { id: 'stationAudit', label: `📡 Red ${SYSTEM_PROPAGATION.sensorNetwork.label}` },
  { id: 'canyonGeometryOsm', label: '🏙️ Cañones 3D' },
  { id: 'malagaTreesInventory', label: '🌳 Fitorremediación' },
  { id: 'environmentalJustice', label: '⚖️ Justicia 5D/4D' },
  { id: 'schoolAirEquity', label: '🏫 Colegios UE 2030' }
];

export const MinimizedWindowsTaskbar: React.FC<MinimizedWindowsTaskbarProps> = ({
  activeModal,
  setActiveModal,
  className = ''
}) => {
  const activePointCtx = useActivePoint();
  const [quickQuery, setQuickQuery] = useState('');
  const [isDockExpanded, setIsDockExpanded] = useState(true);

  const searchableModals = useMemo(() => {
    const seen = new Set<string>();
    return Object.values(MODAL_DESCRIPTORS).filter((m) => {
      if (m.id === 'audit' || seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, []);

  const filteredSuites = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    if (!q) return [];
    return searchableModals
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          (m.keywords && m.keywords.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [quickQuery, searchableModals]);

  // Unificado en la barra inferior de IntelligentDockTabs para evitar doble barra inferior y duplicidad visual
  if (!activeModal || activeModal) {
    return null;
  }

  const activePointName = activePointCtx?.activePoint?.name || 'Málaga Centro';
  const no2Val = activePointCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? '--';

  const currentDesc = activeModal
    ? MODAL_DESCRIPTORS[activeModal] || {
        id: activeModal,
        name: activeModal,
        category: 'MÓDULO',
        icon: <Activity className="w-3.5 h-3.5 text-emerald-400" />
      }
    : null;

  const handleResetCleanHome = () => {
    setQuickQuery('');
    setActiveModal(null);
    activePointCtx?.syncActivePoint(36.7182, -4.4228, {
      name: 'Alameda Principal, 18',
      fly: true
    });
  };

  // Solo si el usuario pulsa manualmente "▾ Plegar", se recoge en una píldora discreta
  if (!activeModal && !isDockExpanded) {
    return (
      <aside
        aria-label="Píldora discreta de acceso rápido al buscador de suites"
        className={`fixed bottom-14 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-1.5 bg-slate-950/90 hover:bg-slate-900 border border-emerald-500/60 backdrop-blur-md rounded-full px-3 py-1 shadow-xl font-mono text-[10px] select-none transition-all ${className}`}
      >
        <ScientificTooltip
          position="top"
          width="w-[260px]"
          content="Desplegar buscador rápido de las 35 suites científicas y accesos directos de tesis doctoral."
        >
          <button
            type="button"
            onClick={() => setIsDockExpanded(true)}
            className="flex items-center gap-1.5 text-emerald-300 hover:text-white font-black cursor-pointer whitespace-nowrap"
          >
            <Search className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>🧭 Mostrar Barra Inferior (Buscador & 7 Suites) ▴</span>
          </button>
        </ScientificTooltip>
        <span className="text-slate-600">|</span>
        <span className="text-[9px] text-slate-300 flex items-center gap-1 whitespace-nowrap">
          <MapPin className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
          <span className="truncate max-w-[150px]">{activePointName}</span>
          <span className="text-emerald-300 font-bold">• NO₂: {no2Val} µg/m³</span>
        </span>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Bandeja deslizante de ventanas activas (Opción 5 / Regla 22)"
      className={`fixed bottom-14 left-1/2 -translate-x-1/2 z-[150] bg-slate-950/95 border border-emerald-500/60 backdrop-blur-md rounded-md px-2.5 py-1 shadow-2xl font-mono text-[10px] select-none w-[min(96vw,1040px)] ${className}`}
    >
      {/* Resultados instantáneos del buscador "Ir a suite..." */}
      {filteredSuites.length > 0 && (
        <div className="mb-1.5 p-1.5 bg-slate-900/98 border border-cyan-500/70 rounded shadow-2xl flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] font-black text-cyan-300 uppercase px-1">
            🔍 Ir directo a ({filteredSuites.length}):
          </span>
          {filteredSuites.map((item) => (
            <ScientificTooltip
              key={item.id}
              position="top"
              width="w-[320px]"
              title={`${item.name} [${item.category}]`}
              content={`Abrir directamente la suite analítica «${item.name}» sincronizada en tiempo real con ${activePointName} (NO₂ = ${no2Val} µg/m³).`}
              regulatory="Regla 10 y Regla 30 AGENTS.md — Activación Directa 1 Clic + Tooltip Doble Clic"
            >
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    (window as any).__forceExpandNextModal = true;
                  }
                  setActiveModal(item.id);
                  setQuickQuery('');
                }}
                className="px-2 py-0.5 rounded bg-cyan-950/90 hover:bg-cyan-600 text-cyan-200 hover:text-slate-950 border border-cyan-500/60 text-[9.5px] font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                {item.icon}
                <span>{item.name}</span>
                <span className="text-[8px] opacity-75">[{item.category}]</span>
              </button>
            </ScientificTooltip>
          ))}
        </div>
      )}

      <SlidingRibbonBar
        activeKey={activeModal}
        accent="emerald"
        showPositionBadge={false}
        ariaLabel="Conmutador Rápido de Suites Doctorales y Despeje de Mapa"
        leftAddon={
          <div className="relative flex items-center shrink-0">
            <Search className="w-3 h-3 text-cyan-400 absolute left-1.5 pointer-events-none" />
            <input
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder="Ir a suite (ej. TiO2, Bebé, PAN)..."
              aria-label="Buscador rápido de suites científicas"
              className="pl-5 pr-4 py-0.5 bg-slate-900/95 border border-cyan-500/60 focus:border-cyan-300 rounded text-[9.5px] text-white placeholder-slate-400 outline-none w-44 sm:w-52 font-mono"
            />
            {quickQuery && (
              <button
                type="button"
                onClick={() => setQuickQuery('')}
                className="absolute right-1 text-slate-400 hover:text-white cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        }
        rightAddon={
          <div className="flex items-center gap-1 shrink-0">
            <ScientificTooltip position="top" width="w-[260px]" content="Cerrar todas las ventanas flotantes y centrar el punto activo en la vista inicial limpia de Málaga (Alameda Principal).">
              <button
                type="button"
                onClick={handleResetCleanHome}
                className="px-2 py-1 bg-cyan-950/90 hover:bg-cyan-800 text-cyan-200 hover:text-white border border-cyan-500/70 rounded flex items-center gap-1 transition-all cursor-pointer text-[9.5px] font-black shrink-0 whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" />
                <span>🏠 INICIO LIMPIO</span>
              </button>
            </ScientificTooltip>

            {activeModal ? (
              <ScientificTooltip position="top" width="w-[260px]" content="Cerrar todas las ventanas modales activas y despejar el lienzo cartográfico de Málaga en 1 clic.">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-2 py-1 bg-rose-950/90 hover:bg-rose-800 text-rose-200 hover:text-white border border-rose-500/70 rounded flex items-center gap-1 transition-all cursor-pointer text-[9.5px] font-black shrink-0 whitespace-nowrap"
                >
                  <X className="w-3 h-3" />
                  <span>🧹 DESPEJAR MAPA</span>
                </button>
              </ScientificTooltip>
            ) : (
              <ScientificTooltip
                position="top"
                width="w-[260px]"
                title="Plegar Barra Inferior en Píldora Compacta"
                content="Recoge la barra inferior en una píldora discreta para maximizar la visibilidad cartográfica del mapa de Málaga."
                regulatory="Regla 11 y Regla 22 AGENTS.md — Ergonomía de Lienzo Limpio"
              >
                <button
                  type="button"
                  onClick={() => {
                    setQuickQuery('');
                    setIsDockExpanded(false);
                  }}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded flex items-center gap-1 transition-all cursor-pointer text-[9.5px] font-black shrink-0 whitespace-nowrap"
                >
                  <span>▾ Plegar</span>
                </button>
              </ScientificTooltip>
            )}
          </div>
        }
      >
        {/* Ventana Activa Actual (si existe) */}
        {currentDesc && (
          <ScientificTooltip
            position="top"
            width="w-[320px]"
            title={`Ventana Activa: ${currentDesc.name}`}
            content={`Módulo activo en primer plano (${currentDesc.category}) sincronizado con ${activePointName} (NO₂ = ${no2Val} µg/m³).`}
            regulatory="Regla 10 AGENTS.md — Sincronización Atómica del Punto Activo"
          >
            <div className="flex items-center gap-2 bg-slate-900/95 border border-emerald-500/70 px-2.5 py-1 rounded text-slate-200 shrink-0 whitespace-nowrap cursor-help">
              <span className="shrink-0">{currentDesc.icon}</span>
              <span className="font-bold text-white uppercase text-[10px]">
                {currentDesc.name}
              </span>
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 text-[8px] px-1 py-0.2 rounded font-semibold">
                {currentDesc.category}
              </span>
              <span className="text-[8.5px] text-slate-300 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[140px]">{activePointName}</span>
                <span className="text-emerald-300 font-bold">• NO₂: {no2Val} µg/m³</span>
              </span>
            </div>
          </ScientificTooltip>
        )}

        {/* Conmutadores rápidos de suites en cinta deslizante (Opción 5) */}
        {QUICK_DOCK_SUITES.map((suite) => {
          const desc = MODAL_DESCRIPTORS[suite.id];
          return (
            <ScientificTooltip
              key={suite.id}
              position="top"
              width="w-[320px]"
              title={desc ? `${desc.name} (${desc.category})` : suite.label}
              content={`Acceso directo en 1 clic a la suite «${desc?.name || suite.label}» sincronizada en vivo con ${activePointName} (NO₂ = ${no2Val} µg/m³). Doble clic o doble toque para abrir su ficha físico-matemática completa.`}
              regulatory="Regla 10 y Regla 30 AGENTS.md — Clon DraggableWindow ⇄ ScientificTooltip"
            >
              <button
                type="button"
                data-ribbon-active={activeModal === suite.id}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    (window as any).__forceExpandNextModal = true;
                  }
                  setActiveModal(suite.id);
                }}
                className={`px-2 py-1 rounded text-[9.5px] font-bold border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeModal === suite.id
                    ? 'bg-emerald-600 text-slate-950 border-emerald-300 font-black'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {suite.label}
              </button>
            </ScientificTooltip>
          );
        })}
      </SlidingRibbonBar>
    </aside>
  );
};
