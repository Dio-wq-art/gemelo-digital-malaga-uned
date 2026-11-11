import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls, useMotionValue } from 'motion/react';
import { GripVertical, ChevronDown, ChevronUp, X, MapPin, Pin, Maximize2, Minimize2 } from 'lucide-react';
import { useActivePoint } from '../context/ActivePointContext';
import { ScientificTooltip } from './ScientificTooltip';
import { useUIStore } from '../store/uiStore';
import { resolveDirectorBadgeForWindow } from '../lib/systemPropagationEngine';

const WINDOW_POS_STORAGE_KEY = 'malaga_dt_window_pos_v1';

function readSavedWindowPos(id: string): { x: number; y: number } {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(WINDOW_POS_STORAGE_KEY);
      if (raw) {
        const map = JSON.parse(raw);
        const entry = map?.[id];
        if (entry && typeof entry.x === 'number' && typeof entry.y === 'number') {
          const maxW = Math.max(400, window.innerWidth * 0.85);
          const maxH = Math.max(300, window.innerHeight * 0.85);
          return {
            x: Math.max(-maxW, Math.min(maxW, entry.x)),
            y: Math.max(-maxH, Math.min(maxH, entry.y))
          };
        }
      }
    }
  } catch {
    // Ignore storage errors
  }
  return { x: 0, y: 0 };
}

function writeSavedWindowPos(id: string, x: number, y: number): void {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(WINDOW_POS_STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      map[id] = { x: Math.round(x), y: Math.round(y) };
      localStorage.setItem(WINDOW_POS_STORAGE_KEY, JSON.stringify(map));
    }
  } catch {
    // Ignore storage errors
  }
}

export interface DraggableWindowProps {
  windowId?: string;
  title: string | React.ReactNode;
  icon?: React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
  headerExtra?: React.ReactNode;
  onClose?: () => void;
  defaultCollapsed?: boolean;
  showActivePointBanner?: boolean;
  className?: string;
  headerColorClass?: string;
  borderColorClass?: string;
  children: React.ReactNode;
  dragConstraintsRef?: React.RefObject<any>;
  initialPositionClass?: string;
  initialWidth?: number;
  initialHeight?: number;
}

export const DraggableWindow: React.FC<DraggableWindowProps> = React.memo(({
  windowId,
  title,
  icon,
  subtitle,
  badge,
  headerExtra,
  onClose,
  defaultCollapsed = true,
  showActivePointBanner = true,
  className = "w-[95vw] sm:w-full max-w-4xl max-h-[85vh]",
  headerColorClass = "text-emerald-400",
  borderColorClass = "border-slate-700/80",
  children,
  dragConstraintsRef,
  initialPositionClass = "top-32 left-1/2 -translate-x-1/2",
  initialWidth,
  initialHeight
}) => {
  const activeModal = useUIStore((state) => state.activeModal);
  const setActiveModal = useUIStore((state) => state.setActiveModal);
  const pinnedShortcuts = useUIStore((state) => state.pinnedShortcuts);
  const togglePinnedShortcut = useUIStore((state) => state.togglePinnedShortcut);

  const effectiveWindowId = windowId || activeModal || undefined;
  const isPrimaryActiveModalWindow = !windowId || windowId === activeModal;
  const posStorageId =
    effectiveWindowId ||
    (typeof title === 'string' ? title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48) : 'default');

  const initialPos = readSavedWindowPos(posStorageId);
  const dragX = useMotionValue(initialPos.x);
  const dragY = useMotionValue(initialPos.y);

  useEffect(() => {
    const saved = readSavedWindowPos(posStorageId);
    dragX.set(saved.x);
    dragY.set(saved.y);
  }, [posStorageId, dragX, dragY]);

  const isAmbientWidget =
    effectiveWindowId === 'pointReliability' || effectiveWindowId === 'pointInspector';
  const isUserOpenedModal = Boolean(activeModal) && isPrimaryActiveModalWindow && !isAmbientWidget;

  const forcedExpandRef = useRef<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (isUserOpenedModal) {
      return false;
    }
    if (
      isPrimaryActiveModalWindow &&
      typeof window !== 'undefined' &&
      (window as any).__forceExpandNextModal
    ) {
      forcedExpandRef.current = true;
      return false;
    }
    return defaultCollapsed;
  });
  const [isMaximized, setIsMaximized] = useState(false);
  const zoomStorageKey = effectiveWindowId
    ? `malaga_dt_window_zoom_${effectiveWindowId}`
    : 'malaga_dt_window_zoom_default';
  const [contentZoomPct, setContentZoomPctState] = useState<number>(() => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const specific = localStorage.getItem(zoomStorageKey);
        if (specific) {
          const parsed = Number(specific);
          if (!isNaN(parsed) && parsed >= 75 && parsed <= 160) return parsed;
        }
        const globalZoom = localStorage.getItem('malaga_dt_window_zoom_global_v1');
        if (globalZoom) {
          const parsedGlobal = Number(globalZoom);
          if (!isNaN(parsedGlobal) && parsedGlobal >= 75 && parsedGlobal <= 160) return parsedGlobal;
        }
      }
    } catch {
      // Ignore storage errors
    }
    return 100;
  });

  const setContentZoomPct = useCallback(
    (updater: number | ((prev: number) => number)) => {
      setContentZoomPctState((prev) => {
        const nextRaw = typeof updater === 'function' ? updater(prev) : updater;
        const clamped = Math.max(75, Math.min(160, nextRaw));
        try {
          if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            localStorage.setItem(zoomStorageKey, String(clamped));
            localStorage.setItem('malaga_dt_window_zoom_global_v1', String(clamped));
          }
        } catch {
          // Ignore storage errors
        }
        return clamped;
      });
    },
    [zoomStorageKey]
  );
  const [customSize, setCustomSize] = useState<{ width?: number; height?: number }>({
    width: initialWidth,
    height: initialHeight
  });
  const [isResizing, setIsResizing] = useState(false);
  const [viewport, setViewport] = useState<{ w: number; h: number }>(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 800
  }));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleViewportChange = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener('resize', handleViewportChange, { passive: true });
    window.addEventListener('orientationchange', handleViewportChange, { passive: true });
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, []);

  const isSmallMobile = viewport.w < 640;
  const isTabletOrMobile = viewport.w < 1024;

  const [dynamicZIndex, setDynamicZIndex] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const nextZ = ((window as any).__draggableTopZIndex || 255) + 1;
      (window as any).__draggableTopZIndex = nextZ;
      return nextZ;
    }
    return 255;
  });

  const bringToFront = useCallback(() => {
    if (typeof window !== 'undefined') {
      const currentTop = (window as any).__draggableTopZIndex || 255;
      setDynamicZIndex((prevZ) => {
        if (prevZ < currentTop) {
          const nextZ = currentTop + 1;
          (window as any).__draggableTopZIndex = nextZ;
          return nextZ;
        }
        return prevZ;
      });
    }
  }, []);
  
  const dragControls = useDragControls();
  const activePointCtx = useActivePoint();
  const windowRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    if (!isPrimaryActiveModalWindow) return;
    if (isUserOpenedModal) {
      if (typeof window !== 'undefined') {
        (window as any).__forceExpandNextModal = false;
      }
      setIsCollapsed(false);
      bringToFront();
      return;
    }
    if (typeof window !== 'undefined' && (window as any).__forceExpandNextModal) {
      (window as any).__forceExpandNextModal = false;
      forcedExpandRef.current = true;
      setIsCollapsed(false);
      bringToFront();
      return;
    }
    if (forcedExpandRef.current) {
      forcedExpandRef.current = false;
      setIsCollapsed(false);
      bringToFront();
      return;
    }
    if (defaultCollapsed !== undefined) {
      setIsCollapsed(defaultCollapsed);
    }
  }, [defaultCollapsed, activeModal, isPrimaryActiveModalWindow, isUserOpenedModal, bringToFront]);

  // Al seleccionar un nuevo punto en el mapa, asegurar que Confiabilidad e Inspector de Punto salten minimizados por defecto
  useEffect(() => {
    if (
      defaultCollapsed &&
      (effectiveWindowId === 'pointReliability' || effectiveWindowId === 'pointInspector')
    ) {
      setIsCollapsed(true);
    }
  }, [
    activePointCtx?.location?.lat,
    activePointCtx?.location?.lon,
    defaultCollapsed,
    effectiveWindowId
  ]);

  const isPinned = effectiveWindowId ? pinnedShortcuts.includes(effectiveWindowId) : false;

  const activePoint = activePointCtx?.activePoint;
  const assim = activePointCtx?.assimilation;
  const loc = activePointCtx?.location;

  // Normalizar nombre de calle y conservar siempre el número de portal (ej. "Calle Mariblanca, 8")
  const formattedStreetLabel = React.useMemo(() => {
    const rawName = (activePoint?.name || '').trim();
    const fallbackStreet = (activePoint?.nearestStreetName || '').trim();
    if (!rawName && !fallbackStreet) return 'Málaga Centro';
    const parts = rawName.split(',').map((s) => s.trim()).filter(Boolean);
    const isPortalNumber = (s?: string) => Boolean(s && /^(?:n\.?º?\s*|s\/n|[0-9]+[a-zA-Z/-]*)$/i.test(s.trim()));

    if (parts.length >= 2 && isPortalNumber(parts[0])) {
      return `${parts[1]}, ${parts[0]}`;
    }
    if (parts.length === 1 && isPortalNumber(parts[0])) {
      const cleanStreet = fallbackStreet && !isPortalNumber(fallbackStreet) ? fallbackStreet : 'Calle Mariblanca';
      return `${cleanStreet}, ${parts[0]}`;
    }
    if (parts.length >= 2 && isPortalNumber(parts[1])) {
      return `${parts[0]}, ${parts[1]}`;
    }
    return parts[0] || fallbackStreet || 'Málaga Centro';
  }, [activePoint?.name, activePoint?.nearestStreetName]);

  // Construir subtítulo contextual limpio con la georreferencia activa
  const resolvedSubtitle = activePoint && loc
    ? subtitle
      ? `${subtitle} • 📍 ${formattedStreetLabel} (CP ${activePoint.postalCode}) • ${loc.lat.toFixed(5)}°N, ${loc.lon.toFixed(5)}°W`
      : `📍 ${formattedStreetLabel} • ${activePoint.neighborhoodName} (${activePoint.districtName}, CP ${activePoint.postalCode}) • WGS84: ${loc.lat.toFixed(5)}°N, ${loc.lon.toFixed(5)}°W • Cota: ${activePoint.elevationM}m • Costa: ${activePoint.distanceToCoastM}m`
    : subtitle;

  // Manejo interactivo de redimensionamiento desde la esquina inferior derecha (Estilo Windows + Táctil)
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    bringToFront();
    
    if (!windowRef.current || isMaximized || isCollapsed) return;

    const rect = windowRef.current.getBoundingClientRect();
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: rect.width,
      h: rect.height
    };

    setIsResizing(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!resizeStartRef.current) return;
      const dx = moveEvent.clientX - resizeStartRef.current.x;
      const dy = moveEvent.clientY - resizeStartRef.current.y;

      const minW = Math.min(310, window.innerWidth - 16);
      const maxW = Math.min(window.innerWidth * 0.98, 1600);
      const minH = 200;
      const maxH = Math.min(window.innerHeight * 0.92, 1200);

      const newW = Math.round(Math.max(minW, Math.min(maxW, resizeStartRef.current.w + dx)));
      const newH = Math.round(Math.max(minH, Math.min(maxH, resizeStartRef.current.h + dy)));

      setCustomSize({ width: newW, height: newH });
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [isMaximized, isCollapsed, bringToFront]);

  // Alternar estado maximizado (Pantalla completa / tamaño restaurado)
  const toggleMaximize = useCallback(() => {
    bringToFront();
    setIsMaximized(prev => !prev);
    if (isCollapsed) {
      setIsCollapsed(false);
    }
  }, [isCollapsed, bringToFront]);

  const inlineStyle: React.CSSProperties = {
    zIndex: isMaximized ? 290 : dynamicZIndex,
    maxWidth: isMaximized ? 'calc(100vw - 16px)' : '96vw'
  };
  if (!isMaximized && !isCollapsed) {
    if (customSize.width) {
      const clampedW = Math.min(Math.round(customSize.width), Math.max(300, viewport.w - 14));
      inlineStyle.width = `${clampedW}px`;
    } else if (isSmallMobile) {
      inlineStyle.width = `${Math.max(300, viewport.w - 14)}px`;
    }
    if (customSize.height) {
      const clampedH = Math.min(Math.round(customSize.height), Math.max(240, viewport.h - (isTabletOrMobile ? 96 : 64)));
      inlineStyle.height = `${clampedH}px`;
    }
  }

  const showDirectorBadge =
    effectiveWindowId !== 'thesisMethodologySuite' &&
    !(typeof title === 'string' && title.includes('DIRECTRICES DEL DIRECTOR'));

  const dirSpec = showDirectorBadge
    ? resolveDirectorBadgeForWindow(effectiveWindowId, typeof title === 'string' ? title : '')
    : null;

  const directorBadgeNode = dirSpec ? (
    <ScientificTooltip
      title={`Trazabilidad Directrices Director (${dirSpec.objectiveCode} • ${dirSpec.tableRef})`}
      content={dirSpec.tooltip}
      regulatory="Regla 20 AGENTS.md — Camino a la Tesis Doctoral UNED"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (typeof window !== 'undefined') {
            (window as any).__forceExpandNextModal = true;
            (window as any).__directorDeepLink = {
              subView: dirSpec.targetSubView,
              sectionId: dirSpec.targetSectionId,
              label: `${dirSpec.objectiveCode} • ${dirSpec.blockLabel} (${dirSpec.tableRef})`
            };
            window.dispatchEvent(new CustomEvent('uned-director-deep-link'));
          }
          setActiveModal('thesisMethodologySuite');
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="px-2 py-0.5 text-[9px] font-mono font-black bg-gradient-to-r from-amber-500/95 via-rose-600/95 to-fuchsia-600/95 hover:from-amber-400 hover:via-rose-500 hover:to-fuchsia-500 text-white border border-amber-200 rounded flex items-center gap-1 shrink-0 cursor-pointer shadow-[0_0_8px_rgba(245,158,11,0.4)] transition-all whitespace-nowrap"
      >
        <span>{dirSpec.shortBadge}</span>
      </button>
    </ScientificTooltip>
  ) : null;

  // Normalizar posición vertical inicial para que ninguna ventana flotante ni barra minimizada
  // aparezca jamás superpuesta sobre la cabecera superior o el banner del punto activo (evita efecto sándwich).
  // En teléfonos y tabletas (< 1180px), apila limpiamente las 2 barras minimizadas (Confiabilidad + Inspector)
  // una debajo de la otra para evitar solapamientos horizontales; en escritorio ancho (>= 1180px) las muestra en paralelo (izq/der) acotadas a < 50vw cada una.
  const isCompactStackViewport = viewport.w < 1180;
  const safeInitialPositionClass = React.useMemo(() => {
    const base = initialPositionClass.replace(
      /\btop-(?:[0-9]|1[0-9]|2[0-8])\b/g,
      'top-32'
    );
    if (!isCompactStackViewport) return base;

    if (isCollapsed) {
      if (effectiveWindowId === 'pointInspector' || base.includes('right-3') || base.includes('right-4')) {
        return isSmallMobile ? 'top-[174px] left-2 right-2' : 'top-[174px] left-3';
      }
      if (effectiveWindowId === 'pointReliability' || base.includes('left-3') || base.includes('left-4')) {
        return isSmallMobile ? 'top-32 left-2 right-2' : 'top-32 left-3';
      }
    } else if (isSmallMobile) {
      // Expandida en móvil: encaje centrado limpio dentro del ancho del teléfono
      return 'top-28 left-1.5';
    }
    return base;
  }, [initialPositionClass, isCompactStackViewport, isSmallMobile, isCollapsed, effectiveWindowId]);

  return (
    <motion.div
      drag={!isMaximized}
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={dragConstraintsRef}
      dragElastic={0.05}
      dragMomentum={false}
      onDragEnd={() => {
        if (!isMaximized) {
          writeSavedWindowPos(posStorageId, dragX.get(), dragY.get());
        }
      }}
      onPointerDownCapture={bringToFront}
      data-draggable-window-container="true"
      data-window-id={effectiveWindowId || ''}
      className={`fixed draggable-window-container ${
        isMaximized
          ? 'top-2 left-2 right-2 bottom-2 w-[calc(100vw-16px)] h-[calc(100dvh-16px)]'
          : isCollapsed
            ? `${safeInitialPositionClass} ${isSmallMobile ? 'w-[calc(100vw-16px)]' : 'w-auto'} ${
                isCompactStackViewport
                  ? 'max-w-[min(96vw,680px)]'
                  : 'max-w-[min(calc(50vw-18px),660px)]'
              }`
            : `${safeInitialPositionClass} ${!customSize.width ? className : ''}`
      } shadow-2xl pointer-events-auto flex flex-col subpixel-antialiased`}
      style={{
        ...inlineStyle,
        ...(isMaximized ? { x: 0, y: 0 } : { x: dragX, y: dragY })
      }}
    >
      <div 
        ref={windowRef}
        data-draggable-window="true"
        data-window-id={effectiveWindowId || ''}
        className={`draggable-window-content bg-slate-950/98 border ${borderColorClass} shadow-2xl rounded-lg text-slate-100 flex flex-col overflow-hidden ${
          isMaximized ? 'h-full w-full' : 'max-h-[84dvh] sm:max-h-[90vh]'
        } relative`}
      >
        {/* Header Bar - Two-Row Anti-Collision Architecture */}
        <div
          onPointerDown={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest('button, a, input, select, [role="button"], [data-tooltip-action-btn="true"], [data-scientific-portal="true"]')) {
              return;
            }
            bringToFront();
            if (!isMaximized) {
              dragControls.start(e);
            }
          }}
          onDoubleClick={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest('button, a, input, select, [role="button"], [data-tooltip-action-btn="true"], [data-scientific-tooltip-explicit="true"]')) {
              return;
            }
            toggleMaximize();
          }}
          className="bg-slate-900 border-b border-slate-700/90 px-3 py-2 flex flex-col gap-1.5 cursor-grab active:cursor-grabbing group shrink-0 select-none touch-none"
          title="Arrastre el encabezado para mover libremente la ventana. Doble clic en barra vacía para maximizar/restaurar."
        >
          {/* FILA 1: Título Principal, Punto Activo y Controles de Ventana (Cero Solapamiento) */}
          <div className="flex items-center justify-between gap-2 min-w-0 w-full">
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
              <GripVertical className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0" />
              {icon && <div className={`${headerColorClass} shrink-0`}>{icon}</div>}
              <ScientificTooltip
                position="bottom"
                width="w-[340px]"
                title={typeof title === 'string' ? title : 'Consola Analítica del Gemelo Digital'}
                content={`Ventana modular interactiva sincronizada en tiempo real con ${formattedStreetLabel}. Arrastre el encabezado para desplazarla libremente por el mapa o haga doble clic para maximizarla.`}
                regulatory="Regla 5 y Regla 10 AGENTS.md — Ergonomía DraggableWindow & Punto Activo"
              >
                <span className={`text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase truncate cursor-help ${headerColorClass}`}>
                  {title}
                </span>
              </ScientificTooltip>
              {badge && <div className="shrink-0 hidden xs:inline-flex items-center">{badge}</div>}
              {/* En modo colapsado mostramos el sello del Director de forma compacta si cabe */}
              {isCollapsed && directorBadgeNode && (
                <div className="hidden md:inline-flex shrink-0">{directorBadgeNode}</div>
              )}
              {/* Badge permanente de ubicación activa y asimilación en vivo */}
              {activePoint && assim && (
                <ScientificTooltip
                  title={`Sincronización Atómica: ${formattedStreetLabel}`}
                  formula="C_{\text{NO}_2}(z=1.8\text{m}) = C_{\text{fondo}} + \Delta C_{\text{cañón}} + K_{\text{EnKF}}\mathbf{d}"
                  regulatory="Directiva (UE) 2024/2881 (Límite 2030: 20 µg/m³) & Regla 10 AGENTS.md"
                  content={`Punto activo global: ${formattedStreetLabel} (${activePoint.neighborhoodName}, ${activePoint.districtName}, CP ${activePoint.postalCode}). Asimilación microescalar a 1.8 m AGL (cota respiratoria): NO₂ = ${assim.no2PedestrianLevel1_8mUgM3} µg/m³ acoplado a la topología y meteorología en tiempo real.`}
                >
                  <span
                    className="px-2 py-0.5 text-[9.5px] font-mono font-bold bg-slate-800 text-emerald-200 border border-emerald-500/60 rounded inline-flex items-center gap-1 shrink-0 cursor-help shadow-xs max-w-[165px] sm:max-w-[240px]"
                  >
                    <MapPin className="w-2.5 h-2.5 text-emerald-400 animate-pulse shrink-0" />
                    <span className="truncate">{formattedStreetLabel}</span>
                    <span className="text-slate-400 shrink-0">•</span>
                    <span className="shrink-0">NO₂: {assim.no2PedestrianLevel1_8mUgM3} µg/m³</span>
                  </span>
                </ScientificTooltip>
              )}
            </div>

            {/* Controles Estándar de Ventana (Derecha Fila 1) */}
            <div
              className="flex items-center gap-1 shrink-0"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {effectiveWindowId && (
                <ScientificTooltip content={isPinned ? "Desfijar este módulo de la barra de atajos rápidos (Alt + P)." : "Fijar este módulo como acceso directo en la barra superior (Alt + P)."}>
                  <button
                    type="button"
                    onClick={() => togglePinnedShortcut(effectiveWindowId)}
                    className={`p-1 transition-all cursor-pointer rounded flex items-center gap-1 ${
                      isPinned
                        ? 'bg-amber-950/90 text-amber-200 border border-amber-500/70 hover:bg-amber-900 shadow-[0_0_6px_rgba(245,158,11,0.4)]'
                        : 'text-slate-300 hover:text-amber-200 hover:bg-slate-800'
                    }`}
                    aria-label={isPinned ? "Desfijar atajo" : "Fijar atajo"}
                    title={isPinned ? "Desfijar de la barra de atajos rápidos (Alt + P)" : "Fijar a la barra de atajos rápidos (Alt + P)"}
                  >
                    <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-amber-400 fill-amber-400' : ''}`} />
                    <span className="text-[9px] font-mono font-bold hidden xl:inline">
                      {isPinned ? 'FIJADO' : 'FIJAR'}
                    </span>
                  </button>
                </ScientificTooltip>
              )}

              <ScientificTooltip content="Arrastre este encabezado para mover la ventana libremente por el lienzo (drag & drop sin interferencia con el contenido interno).">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-mono hidden lg:inline group-hover:text-slate-200 transition-colors cursor-grab font-semibold px-1">
                  ARRASTRAR
                </span>
              </ScientificTooltip>

              {/* Controles de Tamaño de Letra / Zoom de Lectura A- | 100% | A+ con Memoria Persistente */}
              {!isCollapsed && (
                <ScientificTooltip content={`Tamaño de letra y escala de lectura de las ventanas (${contentZoomPct}%). Usa A- / A+ (75% a 160%) o pulsa en el porcentaje para volver a 100%. Se guarda automáticamente en memoria para futuras aperturas.`}>
                  <div className="inline-flex items-center bg-slate-950/95 border border-cyan-700/70 rounded px-1 py-0.5 text-[9px] font-mono shadow-xs">
                    <button
                      type="button"
                      onClick={() => setContentZoomPct(z => Math.max(75, z - 10))}
                      className="px-1 text-slate-200 hover:text-cyan-300 font-black cursor-pointer"
                      title="Reducir tamaño de letra de la ventana (A-)"
                    >
                      A-
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentZoomPct(100)}
                      className="px-1 text-emerald-300 hover:text-white font-bold cursor-pointer border-x border-slate-800"
                      title="Restablecer tamaño de letra al 100%"
                    >
                      {contentZoomPct}%
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentZoomPct(z => Math.min(160, z + 10))}
                      className="px-1 text-slate-200 hover:text-cyan-300 font-black cursor-pointer"
                      title="Ampliar tamaño de letra de la ventana (A+)"
                    >
                      A+
                    </button>
                  </div>
                </ScientificTooltip>
              )}

              {/* Botón Maximizar / Restaurar Pantalla Completa (Opción 8) */}
              <ScientificTooltip content={isMaximized ? "Restaurar tamaño y posición flotante original de la ventana." : "Maximizar ventana a pantalla completa (98% del visor) para inspeccionar tablas anchas y diagramas con total amplitud."}>
                <button
                  type="button"
                  onClick={toggleMaximize}
                  className={`px-1.5 py-1 transition-all cursor-pointer rounded flex items-center gap-1 border ${
                    isMaximized
                      ? 'bg-cyan-950/90 text-cyan-200 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.35)]'
                      : 'text-slate-300 hover:text-cyan-300 border-slate-700/70 hover:bg-slate-800/80'
                  }`}
                  aria-label={isMaximized ? "Restaurar ventana" : "Maximizar ventana"}
                >
                  {isMaximized ? <Minimize2 className="w-3.5 h-3.5 text-cyan-300" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span className="text-[8.5px] font-mono font-bold hidden md:inline">
                    {isMaximized ? 'RESTAURAR' : 'MAXIMIZAR'}
                  </span>
                </button>
              </ScientificTooltip>

              {/* Botón Contraer / Minimizar */}
              <ScientificTooltip content={isCollapsed ? "Expandir ventana de análisis para visualizar todas sus gráficas y métricas." : "Minimizar/contraer ventana a una barra compacta para despejar el mapa."}>
                <button
                  type="button"
                  onClick={() => {
                    bringToFront();
                    setIsCollapsed(!isCollapsed);
                  }}
                  className={`p-1 transition-all cursor-pointer rounded flex items-center gap-1 ${
                    isCollapsed
                      ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/70 hover:bg-emerald-900 px-2 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                  aria-label="Toggle collapse"
                >
                  {isCollapsed ? (
                    <>
                      <span className="text-[9px] font-mono font-bold">ABRIR</span>
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                    </>
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>
              </ScientificTooltip>

              {/* Botón Cerrar */}
              {onClose && (
                <ScientificTooltip content="Cerrar esta suite y devolver el foco completo al lienzo cartográfico.">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-slate-400 hover:text-red-400 p-1 transition-colors cursor-pointer rounded hover:bg-slate-800/80"
                    aria-label="Close tab"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </ScientificTooltip>
              )}
            </div>
          </div>

          {/* FILA 2 (Visible cuando la ventana está desplegada): Subtítulo Georreferenciado + Sello Director + Acciones Extra */}
          {!isCollapsed && (resolvedSubtitle || directorBadgeNode || headerExtra) && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/90 min-w-0 w-full flex-wrap sm:flex-nowrap">
              <ScientificTooltip
                position="bottom"
                width="w-[360px]"
                title="Metadatos Geodésicos & Topográficos del Receptor Activo"
                formula="(\phi, \lambda)_{\text{WGS84}} \leftrightarrow (X, Y)_{\text{ETRS89 UTM 30N}}, \quad z_{\text{MDE}} \text{ (IGN MDT02)}"
                regulatory="Real Decreto 1071/2007 (Datum Oficial ETRS89) & Regla 10 AGENTS.md"
                content={`Georreferenciación exacta de la ventana: ${resolvedSubtitle}. Incluye barrio, distrito municipal, código postal, altitud sobre el nivel del mar (MDE) y distancia ortodrómica a la línea de costa del Mar de Alborán.`}
              >
                <div className="text-[9.5px] text-slate-300 font-mono truncate min-w-0 flex-1 cursor-help">
                  {resolvedSubtitle}
                </div>
              </ScientificTooltip>
              <div
                className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {directorBadgeNode}
                {headerExtra}
              </div>
            </div>
          )}
        </div>

        {/* Content Body - Collapsible with 100% Free Interaction */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: isMaximized ? '100%' : 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.12, ease: "easeInOut" }}
              className="flex-1 overflow-y-auto custom-scrollbar flex flex-col select-text relative"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div
                className="p-2.5 sm:p-4 text-slate-200 flex-1"
                style={contentZoomPct !== 100 ? ({ zoom: `${contentZoomPct}%` } as React.CSSProperties) : undefined}
              >
                {children}
              </div>

              {/* Esquina Arrastrable de Redimensionamiento (Windows Corner Resize Handle + Soporte Táctil) */}
              {!isMaximized && (
                <div
                  onPointerDown={handleResizePointerDown}
                  className="absolute bottom-0 right-0 w-6 h-6 sm:w-4 sm:h-4 cursor-nwse-resize flex items-end justify-end p-0.5 group z-30 select-none touch-none"
                  title="Arrastre para redimensionar ancho y alto a voluntad (Estilo Windows / Táctil)"
                >
                  <div className="w-3 h-3 sm:w-2.5 sm:h-2.5 border-r-2 border-b-2 border-slate-500 group-hover:border-cyan-400 transition-colors" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
