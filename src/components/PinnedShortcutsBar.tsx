import React, { useState, useEffect, useMemo } from 'react';
import {
  Pin,
  Plus,
  X,
  Sparkles,
  Sliders,
  Check,
  Search,
  RotateCcw,
  Zap,
  ExternalLink,
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  Building2,
  Atom,
  Wind,
  Sun,
  Leaf,
  Trees,
  Car,
  Waves,
  ShieldCheck,
  Scale,
  HeartPulse,
  Thermometer,
  GraduationCap,
  Eye,
  Cpu,
  FlaskConical,
  Activity,
  Anchor,
  Compass,
  PieChart as PieIcon,
  ShieldAlert,
  Flame,
  FileSpreadsheet
} from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { useUIStore } from '../store/uiStore';
import { SCIENTIFIC_CATEGORIES, ScientificModuleCategory } from './IntelligentDockTabs';
import { SCIENTIFIC_SUBTABS_CATALOG, SubtabShortcutItem, getSubtabShortcut } from '../lib/scientificSubtabsRegistry';
import { DraggableWindow } from './DraggableWindow';
import { OrderableTabItem } from './OrderableTabRow';

// Helper de iconos para subpestañas
const getSubtabIcon = (iconName: string): React.ReactNode => {
  switch (iconName) {
    case 'Building2': return <Building2 className="w-3 h-3 text-cyan-400" />;
    case 'Wind': return <Wind className="w-3 h-3 text-sky-400" />;
    case 'Layers': return <Layers className="w-3 h-3 text-amber-400" />;
    case 'Sun': return <Sun className="w-3 h-3 text-yellow-400" />;
    case 'Leaf': return <Leaf className="w-3 h-3 text-emerald-400" />;
    case 'Eye': return <Eye className="w-3 h-3 text-indigo-400" />;
    case 'Atom': return <Atom className="w-3 h-3 text-cyan-400" />;
    case 'Sliders': return <Sliders className="w-3 h-3 text-purple-400" />;
    case 'Cpu': return <Cpu className="w-3 h-3 text-emerald-400" />;
    case 'Trees': return <Trees className="w-3 h-3 text-emerald-400" />;
    case 'Car': return <Car className="w-3 h-3 text-rose-400" />;
    case 'Waves': return <Waves className="w-3 h-3 text-cyan-400" />;
    case 'FlaskConical': return <FlaskConical className="w-3 h-3 text-teal-400" />;
    case 'ShieldCheck': return <ShieldCheck className="w-3 h-3 text-emerald-400" />;
    case 'HeartPulse': return <HeartPulse className="w-3 h-3 text-rose-400" />;
    case 'GraduationCap': return <GraduationCap className="w-3 h-3 text-amber-400" />;
    case 'Scale': return <Scale className="w-3 h-3 text-purple-400" />;
    case 'Flame': return <Flame className="w-3 h-3 text-amber-400" />;
    case 'PieIcon': return <PieIcon className="w-3 h-3 text-indigo-400" />;
    case 'Activity': return <Activity className="w-3 h-3 text-cyan-400" />;
    case 'Sparkles': return <Sparkles className="w-3 h-3 text-yellow-400" />;
    case 'ShieldAlert': return <ShieldAlert className="w-3 h-3 text-red-400" />;
    case 'Anchor': return <Anchor className="w-3 h-3 text-sky-400" />;
    case 'Compass': return <Compass className="w-3 h-3 text-cyan-400" />;
    case 'Thermometer': return <Thermometer className="w-3 h-3 text-orange-400" />;
    default: return <Sparkles className="w-3 h-3 text-amber-400" />;
  }
};

export const PinnedShortcutsBar: React.FC = () => {
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [managerTab, setManagerTab] = useState<'subtabs' | 'modules'>('subtabs');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const pinnedShortcuts = useUIStore((state) => state.pinnedShortcuts);
  const togglePinnedShortcut = useUIStore((state) => state.togglePinnedShortcut);
  const movePinnedShortcut = useUIStore((state) => state.movePinnedShortcut);
  const resetPinnedShortcutsToDefault = useUIStore((state) => state.resetPinnedShortcutsToDefault);
  const activeModal = useUIStore((state) => state.activeModal);
  const setActiveModal = useUIStore((state) => state.setActiveModal);

  // Mapa rápido unificado de metadatos (Soporta tanto Modales como Subpestañas Exactas)
  const unifiedShortcutsMap = useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      tag: string;
      icon: React.ReactNode;
      categoryName: string;
      formula?: string;
      description: string;
      isSubtab: boolean;
      parentSuiteName?: string;
    }>();

    // 1. Incorporar Subpestañas Exactas
    SCIENTIFIC_SUBTABS_CATALOG.forEach((sub) => {
      map.set(sub.id, {
        id: sub.id,
        name: sub.title,
        tag: sub.shortTag,
        icon: getSubtabIcon(sub.iconName),
        categoryName: sub.categoryName,
        formula: sub.formula,
        description: sub.description,
        isSubtab: true,
        parentSuiteName: sub.parentSuiteName
      });
    });

    // 2. Incorporar los 70 Módulos Maestros
    SCIENTIFIC_CATEGORIES.forEach((cat) => {
      cat.modules.forEach((mod) => {
        map.set(mod.id, {
          id: mod.id,
          name: mod.name,
          tag: mod.tag,
          icon: mod.icon,
          categoryName: cat.shortName,
          description: mod.description,
          isSubtab: false
        });
      });
    });

    return map;
  }, []);

  // Atajos de teclado globales: Alt + 1..9 para abrir accesos directos, Alt + P para fijar/desfijar activo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= 9) {
          const shortcutIndex = num - 1;
          if (shortcutIndex < pinnedShortcuts.length) {
            e.preventDefault();
            const targetModal = pinnedShortcuts[shortcutIndex];
            setActiveModal(activeModal === targetModal ? null : targetModal);
          }
        } else if (e.key.toLowerCase() === 'p') {
          if (activeModal) {
            e.preventDefault();
            togglePinnedShortcut(activeModal);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinnedShortcuts, activeModal, setActiveModal, togglePinnedShortcut]);

  // Filtrado de Subpestañas
  const filteredSubtabs = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return SCIENTIFIC_SUBTABS_CATALOG.filter((sub) => {
      if (!query) return true;
      return (
        sub.title.toLowerCase().includes(query) ||
        sub.shortTag.toLowerCase().includes(query) ||
        sub.description.toLowerCase().includes(query) ||
        (sub.formula && sub.formula.toLowerCase().includes(query)) ||
        sub.parentSuiteName.toLowerCase().includes(query)
      );
    });
  }, [searchTerm]);

  // Filtrado de Módulos Completos
  const filteredModules = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    const list: { id: string; name: string; tag: string; icon: React.ReactNode; categoryId: string; categoryName: string; description: string }[] = [];

    SCIENTIFIC_CATEGORIES.forEach((cat) => {
      if (selectedCategory !== 'all' && cat.id !== selectedCategory) return;
      cat.modules.forEach((mod) => {
        if (!query || mod.name.toLowerCase().includes(query) || mod.tag.toLowerCase().includes(query) || mod.description.toLowerCase().includes(query)) {
          list.push({
            id: mod.id,
            name: mod.name,
            tag: mod.tag,
            icon: mod.icon,
            categoryId: cat.id,
            categoryName: cat.shortName,
            description: mod.description
          });
        }
      });
    });

    return list;
  }, [searchTerm, selectedCategory]);

  const validPinnedShortcuts = useMemo(
    () => pinnedShortcuts.filter((id) => unifiedShortcutsMap.has(id)),
    [pinnedShortcuts, unifiedShortcutsMap]
  );

  return (
    <>
      {/* BARRA HORIZONTAL DE ATAJOS FIJADOS */}
      <div className="flex items-center gap-1 shrink-0 py-0.5 select-none">
        {/* Botón Gestor / Indicador de Atajos */}
        <div className="flex items-center gap-1 shrink-0">
          <ScientificTooltip
            position="bottom"
            width="w-[280px]"
            content="Gestor de Accesos Directos a Subpestañas y Módulos Favoritos. Pulsa Alt + 1 a Alt + 9 para abrir directamente o personaliza tus atajos fijados."
          >
            <button
              onClick={() => setIsManagerOpen(true)}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/50 hover:border-amber-400 text-amber-300 rounded text-[8px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
            >
              <Pin className="w-2.5 h-2.5 text-amber-400 fill-amber-400/30" />
              <span>GESTIONAR ({validPinnedShortcuts.length})</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Lista de Botones de Pestañas Fijadas (Desplazables a Izquierda ◀ y Derecha ▶ a voluntad) */}
        <div className="flex items-center gap-1 shrink-0 pt-2">
          {validPinnedShortcuts.map((shortcutId, idx) => {
            const meta = unifiedShortcutsMap.get(shortcutId);
            if (!meta) return null;
            const isActive = activeModal === shortcutId || (activeModal && activeModal.startsWith(`${shortcutId.split(':')[0]}:`));
            const hotkeyNumber = idx < 9 ? idx + 1 : null;

            return (
              <OrderableTabItem
                key={shortcutId}
                id={shortcutId}
                index={idx}
                total={validPinnedShortcuts.length}
                onMove={movePinnedShortcut}
                compact
              >
                <ScientificTooltip
                  position="bottom"
                  width="w-[320px]"
                  title={`${meta.name}${hotkeyNumber ? ` (Alt + ${hotkeyNumber})` : ''}`}
                  formula={meta.formula}
                  regulatory={`Categoría: ${meta.categoryName}${meta.parentSuiteName ? ` • Suite: ${meta.parentSuiteName}` : ''}`}
                  content={
                    <div className="space-y-1 font-mono text-[8.5px]">
                      <div className="text-amber-300 font-bold flex items-center justify-between">
                        <span className="truncate mr-2">{meta.name}</span>
                        {hotkeyNumber && (
                          <span className="bg-amber-950 border border-amber-600 px-1 py-0.2 rounded text-[7.5px] text-amber-200 shrink-0">
                            Alt + {hotkeyNumber}
                          </span>
                        )}
                      </div>
                      {meta.isSubtab && meta.parentSuiteName && (
                        <div className="text-cyan-300 text-[8px] flex items-center gap-1">
                          <span>Suite:</span>
                          <span className="font-bold">{meta.parentSuiteName}</span>
                        </div>
                      )}
                      {meta.formula && (
                        <div className="text-amber-200/90 text-[8px] bg-black/50 p-1 rounded border border-amber-800/40 font-bold">
                          {meta.formula}
                        </div>
                      )}
                      <div className="text-slate-300 text-[8px]">{meta.description}</div>
                      <div className="text-slate-400 text-[7.5px] border-t border-slate-700/60 pt-0.5">
                        Categoría: {meta.categoryName} • Pasa el ratón para desplazar ◀ / ▶ a voluntad.
                      </div>
                    </div>
                  }
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        (window as any).__forceExpandNextModal = true;
                      }
                      setActiveModal(activeModal === shortcutId ? null : shortcutId);
                    }}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-mono font-bold transition-all cursor-pointer border shrink-0 group ${
                      isActive
                        ? 'bg-amber-950 text-amber-200 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                        : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-800 hover:border-slate-600 hover:bg-slate-800'
                    }`}
                  >
                    <span className="shrink-0">{meta.icon}</span>
                    <span className="max-w-[120px] md:max-w-[155px] truncate">{meta.tag || meta.name}</span>
                    {meta.isSubtab && (
                      <span className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee] shrink-0" title="Subpestaña exacta" />
                    )}
                    {hotkeyNumber && (
                      <span className="text-[7px] px-1 py-0.1 bg-black/50 text-amber-400 border border-amber-700/50 rounded font-mono font-bold ml-0.5 group-hover:border-amber-400">
                        {hotkeyNumber}
                      </span>
                    )}
                  </button>
                </ScientificTooltip>
              </OrderableTabItem>
            );
          })}
        </div>

        {/* Botón rápido para Añadir / Gestionar Atajos */}
        <ScientificTooltip
          position="bottom"
          width="w-[260px]"
          content="Abrir Gestor de Atajos: Selecciona subpestañas exactas (Sondeo 0-50m, Leighton, Sobol, ICRP 66) o módulos completos para fijarlos en tu barra superior."
        >
          <button
            onClick={() => setIsManagerOpen(true)}
            className="flex items-center justify-center p-1 bg-slate-900/80 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-amber-500 text-slate-400 hover:text-amber-300 rounded text-[8px] transition-all cursor-pointer shrink-0"
            aria-label="Gestionar atajos"
          >
            <Plus className="w-2.5 h-2.5" />
          </button>
        </ScientificTooltip>
      </div>

      {/* MODAL GESTOR DE ATAJOS FAVORITOS (DRAGGABLE) */}
      {isManagerOpen && (
        <DraggableWindow
          title="Gestor de Atajos Directos a Subpestañas y Módulos"
          icon={<Pin className="w-4 h-4 text-amber-400 fill-amber-400/40" />}
          subtitle="Fija subpestañas exactas (Sondeo 0-50m, Leighton, Sobol, ICRP 66) o módulos completos para abrirlos en 1 clic (Alt + 1..9)"
          onClose={() => setIsManagerOpen(false)}
          defaultCollapsed={false}
          className="w-[95vw] sm:w-[780px] max-h-[85vh]"
          headerColorClass="text-amber-400"
          borderColorClass="border-amber-500/60"
        >
          <div className="space-y-3 font-mono text-[9px]">
            {/* Cabecera del Gestor con Resumen */}
            <div className="bg-amber-950/40 border border-amber-800/60 p-2.5 rounded flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-amber-300 font-bold text-[10px]">
                    {pinnedShortcuts.length} Pestañas y Subpestañas Fijadas en la Cabecera
                  </div>
                  <div className="text-slate-400 text-[8px]">
                    Las primeras 9 disponen de atajo automático de teclado (<span className="text-amber-300 font-bold">Alt + 1</span> a <span className="text-amber-300 font-bold">Alt + 9</span>).
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ScientificTooltip position="bottom" width="w-[260px]" content="Restablecer los atajos fijados a la configuración inicial recomendada para la tesis doctoral.">
                  <button
                    onClick={resetPinnedShortcutsToDefault}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded text-[8px] flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-400" />
                    <span>Restablecer por Defecto</span>
                  </button>
                </ScientificTooltip>
              </div>
            </div>

            {/* Pestañas Fijadas Actuales (Chips Interactivos con Desfijar) */}
            <div className="space-y-1 bg-slate-900/60 border border-slate-800 p-2 rounded">
              <div className="text-slate-400 text-[8px] uppercase tracking-wider font-bold">
                Tus Accesos Directos Activos:
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {pinnedShortcuts.map((id, index) => {
                  const meta = unifiedShortcutsMap.get(id);
                  if (!meta) return null;
                  return (
                    <div
                      key={id}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[8.5px] font-bold border ${
                        meta.isSubtab
                          ? 'bg-amber-950/70 border-amber-500/70 text-amber-200'
                          : 'bg-slate-900/90 border-slate-700 text-slate-200'
                      }`}
                    >
                      <span>{meta.icon}</span>
                      <span className="truncate max-w-[150px]">{meta.name}</span>
                      {meta.isSubtab && (
                        <span className="text-[7px] px-1 bg-cyan-950 text-cyan-300 border border-cyan-700 rounded">
                          SUB
                        </span>
                      )}
                      {index < 9 && (
                        <span className="text-[7.5px] px-1 bg-black/60 text-amber-300 rounded font-mono">
                          Alt+{index + 1}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => movePinnedShortcut(id, 'left')}
                        className="text-cyan-400 hover:text-white p-0.5 transition-colors cursor-pointer"
                        title="Mover atajo a la izquierda ◀"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => movePinnedShortcut(id, 'right')}
                        className="text-cyan-400 hover:text-white p-0.5 transition-colors cursor-pointer"
                        title="Mover atajo a la derecha ▶"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <ScientificTooltip position="bottom" width="w-[220px]" content={`Desfijar ${meta.name} de la barra superior.`}>
                        <button
                          onClick={() => togglePinnedShortcut(id)}
                          className="text-amber-400 hover:text-red-400 p-0.5 ml-0.5 transition-colors cursor-pointer"
                          title="Desfijar de la barra"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </ScientificTooltip>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selector de Nivel de Fijación (Subpestañas vs Módulos) */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <ScientificTooltip
                title="Atajos Directos a Subpestañas"
                content="Permite fijar en la barra superior subpestañas analíticas profundas (ej. Sondeo 0-50m, Cinética Leighton, Sobol, ICRP 66) para abrirlas directamente."
                citation="Ergonomía UI / EIDUNED"
              >
                <button
                  onClick={() => setManagerTab('subtabs')}
                  className={`px-3 py-1.5 rounded text-[9px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    managerTab === 'subtabs'
                      ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>🔬 Subpestañas & Ecuaciones Clave ({SCIENTIFIC_SUBTABS_CATALOG.length})</span>
                </button>
              </ScientificTooltip>

              <ScientificTooltip
                title="Atajos a Módulos y Suites Completas"
                content="Permite fijar en la barra superior los 70 módulos científicos y ventanas flotantes del gemelo digital de Málaga."
                citation="Arquitectura Modular / EIDUNED"
              >
                <button
                  onClick={() => setManagerTab('modules')}
                  className={`px-3 py-1.5 rounded text-[9px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    managerTab === 'modules'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>🏛️ Módulos & Suites Completas (70)</span>
                </button>
              </ScientificTooltip>
            </div>

            {/* Barra de Búsqueda */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  managerTab === 'subtabs'
                    ? "Buscar subpestaña o cálculo (ej. Sondeo 0-50m, Leighton, Sobol, ICRP 66, Oke, Wesely)..."
                    : "Buscar entre los 70 módulos de la tesis..."
                }
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded pl-8 pr-3 py-1.5 text-[9px] text-white placeholder-slate-500 font-mono outline-hidden"
              />
            </div>

            {/* TAB 1: LISTADO DE SUBPESTAÑAS EXACTAS */}
            {managerTab === 'subtabs' && (
              <div className="space-y-1.5 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                {filteredSubtabs.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 font-mono text-[9px]">
                    No se encontraron subpestañas con "{searchTerm}".
                  </div>
                ) : (
                  filteredSubtabs.map((sub) => {
                    const isPinned = pinnedShortcuts.includes(sub.id);
                    return (
                      <div
                        key={sub.id}
                        className={`p-2 rounded border flex items-center justify-between gap-2 transition-colors ${
                          isPinned
                            ? 'bg-amber-950/30 border-amber-700/60 text-slate-200'
                            : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="shrink-0">{getSubtabIcon(sub.iconName)}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[9px] text-white truncate">{sub.title}</span>
                              <span className="text-[7.5px] px-1 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-mono font-bold">
                                {sub.shortTag}
                              </span>
                              <span className="text-[7.5px] text-slate-500">
                                • {sub.parentSuiteName}
                              </span>
                            </div>
                            {sub.formula && (
                              <div className="text-[8px] text-amber-300 font-mono font-bold truncate mt-0.5">
                                {sub.formula}
                              </div>
                            )}
                            <div className="text-[8px] text-slate-400 truncate">{sub.description}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <ScientificTooltip position="left" width="w-[240px]" content={`Navegar directamente a la subpestaña ${sub.title}.`}>
                            <button
                              onClick={() => {
                                setActiveModal(sub.id);
                                setIsManagerOpen(false);
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[8px] flex items-center gap-1 transition-colors cursor-pointer"
                              title="Abrir directamente esta subpestaña"
                            >
                              <ExternalLink className="w-3 h-3 text-cyan-400" />
                              <span className="hidden sm:inline">Ir</span>
                            </button>
                          </ScientificTooltip>

                          <ScientificTooltip position="left" width="w-[240px]" content={isPinned ? `Quitar ${sub.title} de la barra superior de atajos.` : `Fijar ${sub.title} en la barra superior para acceso directo.`}>
                            <button
                              onClick={() => togglePinnedShortcut(sub.id)}
                              className={`px-2 py-1 rounded text-[8px] font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
                                isPinned
                                  ? 'bg-amber-900/80 text-amber-200 border-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]'
                                  : 'bg-slate-800 hover:bg-amber-950 text-slate-300 hover:text-amber-300 border-slate-700 hover:border-amber-600'
                              }`}
                            >
                              <Pin className={`w-3 h-3 ${isPinned ? 'text-amber-300 fill-amber-300' : 'text-slate-400'}`} />
                              <span>{isPinned ? 'Fijado ✓' : 'Fijar'}</span>
                            </button>
                          </ScientificTooltip>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: LISTADO DE MÓDULOS COMPLETOS */}
            {managerTab === 'modules' && (
              <div className="space-y-1.5 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                {filteredModules.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 font-mono text-[9px]">
                    No se encontraron módulos con "{searchTerm}".
                  </div>
                ) : (
                  filteredModules.map((mod) => {
                    const isPinned = pinnedShortcuts.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        className={`p-2 rounded border flex items-center justify-between gap-2 transition-colors ${
                          isPinned
                            ? 'bg-amber-950/30 border-amber-700/60 text-slate-200'
                            : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="shrink-0">{mod.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[9px] text-white truncate">{mod.name}</span>
                              <span className="text-[7.5px] px-1 py-0.2 bg-slate-800 text-slate-400 border border-slate-700 rounded font-mono">
                                {mod.tag}
                              </span>
                            </div>
                            <div className="text-[8px] text-slate-400 truncate">{mod.description}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <ScientificTooltip position="left" width="w-[240px]" content={`Abrir la ventana modal de ${mod.name}.`}>
                            <button
                              onClick={() => {
                                setActiveModal(mod.id);
                                setIsManagerOpen(false);
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[8px] flex items-center gap-1 transition-colors cursor-pointer"
                              title="Abrir este módulo"
                            >
                              <ExternalLink className="w-3 h-3 text-cyan-400" />
                              <span className="hidden sm:inline">Abrir</span>
                            </button>
                          </ScientificTooltip>

                          <ScientificTooltip position="left" width="w-[240px]" content={isPinned ? `Quitar ${mod.name} de la barra superior de atajos.` : `Fijar ${mod.name} en la barra superior para acceso en 1 clic.`}>
                            <button
                              onClick={() => togglePinnedShortcut(mod.id)}
                              className={`px-2 py-1 rounded text-[8px] font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
                                isPinned
                                  ? 'bg-amber-900/80 text-amber-200 border-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]'
                                  : 'bg-slate-800 hover:bg-amber-950 text-slate-300 hover:text-amber-300 border-slate-700 hover:border-amber-600'
                              }`}
                            >
                              <Pin className={`w-3 h-3 ${isPinned ? 'text-amber-300 fill-amber-300' : 'text-slate-400'}`} />
                              <span>{isPinned ? 'Fijado ✓' : 'Fijar'}</span>
                            </button>
                          </ScientificTooltip>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Footer Informativo de Atajos */}
            <div className="text-[8px] text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                <strong>Consejo Pro:</strong> Puedes pulsar <span className="text-amber-300 font-bold">Alt + P</span> en cualquier ventana abierta para fijarla directamente con su subpestaña activa a la barra superior.
              </span>
            </div>
          </div>
        </DraggableWindow>
      )}
    </>
  );
};
