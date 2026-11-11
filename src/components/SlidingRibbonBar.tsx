import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Columns, Search, Copy, Check, Pin, X } from 'lucide-react';
import { useOrderableIds, OrderableTabItem, OrderableResetButton } from './OrderableTabRow';

export interface SlidingRibbonBarProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  accent?: 'emerald' | 'amber' | 'cyan' | 'indigo' | 'rose' | 'purple';
  scrollStep?: number;
  activeKey?: string | number;
  ariaLabel?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  showPositionBadge?: boolean;
  compact?: boolean;
}

const ACCENT_STYLES: Record<NonNullable<SlidingRibbonBarProps['accent']>, {
  buttonActive: string;
  buttonIdle: string;
  scrollbar: string;
  badge: string;
}> = {
  emerald: {
    buttonActive: 'bg-emerald-950/95 hover:bg-emerald-800 text-emerald-200 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.45)]',
    buttonIdle: 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 border-slate-700/80',
    scrollbar: '[scrollbar-color:#10b981_#020617]',
    badge: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80'
  },
  amber: {
    buttonActive: 'bg-amber-950/95 hover:bg-amber-800 text-amber-200 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.45)]',
    buttonIdle: 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 border-slate-700/80',
    scrollbar: '[scrollbar-color:#f59e0b_#020617]',
    badge: 'bg-amber-950/90 text-amber-300 border-amber-700/80'
  },
  cyan: {
    buttonActive: 'bg-cyan-950/95 hover:bg-cyan-800 text-cyan-200 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.45)]',
    buttonIdle: 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 border-slate-700/80',
    scrollbar: '[scrollbar-color:#06b6d4_#020617]',
    badge: 'bg-cyan-950/90 text-cyan-300 border-cyan-700/80'
  },
  indigo: {
    buttonActive: 'bg-indigo-950/95 hover:bg-indigo-800 text-indigo-200 border-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.45)]',
    buttonIdle: 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 border-slate-700/80',
    scrollbar: '[scrollbar-color:#6366f1_#020617]',
    badge: 'bg-indigo-950/90 text-indigo-300 border-indigo-700/80'
  },
  rose: {
    buttonActive: 'bg-rose-950/95 hover:bg-rose-800 text-rose-200 border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.45)]',
    buttonIdle: 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 border-slate-700/80',
    scrollbar: '[scrollbar-color:#f43f5e_#020617]',
    badge: 'bg-rose-950/90 text-rose-300 border-rose-700/80'
  },
  purple: {
    buttonActive: 'bg-purple-950/95 hover:bg-purple-800 text-purple-200 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.45)]',
    buttonIdle: 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 border-slate-700/80',
    scrollbar: '[scrollbar-color:#a855f7_#020617]',
    badge: 'bg-purple-950/90 text-purple-300 border-purple-700/80'
  }
};

/**
 * Componente Universal de Cinta Deslizante Continua (Regla 22 AGENTS.md):
 * - Cero huecos negros (justify-start + whitespace-nowrap + shrink-0)
 * - Botones laterales ◀ / ▶ con pulsación mantenida (hold-to-scroll) e iluminación dinámica
 * - Desplazamiento horizontal suave con rueda de ratón (onWheel) y flechas de teclado (⬅️ / ➡️)
 * - Auto-centrado inteligente de la pestaña activa + contador de posición [X/N] (Opción 6)
 */
export const SlidingRibbonBar: React.FC<SlidingRibbonBarProps> = ({
  children,
  className = '',
  innerClassName = '',
  accent = 'emerald',
  scrollStep = 280,
  activeKey,
  ariaLabel,
  leftAddon,
  rightAddon,
  showPositionBadge = true
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [tabPositionInfo, setTabPositionInfo] = useState<{ current: number; total: number } | null>(null);

  // Extraer hijos y permitir reordenar izquierda/derecha de forma persistente para esta barra y todas las futuras
  const rawChildrenArray = useMemo(() => React.Children.toArray(children), [children]);

  const { fixedPrefixNodes, orderableEntries, storageId } = useMemo(() => {
    const prefix: React.ReactNode[] = [];
    const entries: { id: string; node: React.ReactNode }[] = [];

    rawChildrenArray.forEach((child, idx) => {
      if (
        React.isValidElement(child) &&
        child.type === 'span' &&
        !(child.props as any)?.onClick &&
        entries.length === 0
      ) {
        prefix.push(child);
        return;
      }
      const rawKey = React.isValidElement(child) && child.key != null ? String(child.key) : `tab_${idx}`;
      const cleanId = rawKey.replace(/^\.\$?/, '');
      entries.push({ id: cleanId, node: child });
    });

    const rawStorageKey = (
      ariaLabel ||
      entries.map((e) => e.id).join('_') ||
      'default_ribbon'
    )
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '_')
      .slice(0, 64);

    return {
      fixedPrefixNodes: prefix,
      orderableEntries: entries,
      storageId: `ribbon_${rawStorageKey}`
    };
  }, [rawChildrenArray, ariaLabel]);

  const defaultTabIds = useMemo(() => orderableEntries.map((e) => e.id), [orderableEntries]);
  const { orderedIds, moveItem, resetOrder, isCustomized } = useOrderableIds(storageId, defaultTabIds);

  const orderedEntries = useMemo(() => {
    const map = new Map(orderableEntries.map((e) => [e.id, e.node]));
    return orderedIds
      .map((id) => ({ id, node: map.get(id) }))
      .filter((item): item is { id: string; node: React.ReactNode } => item.node !== undefined);
  }, [orderableEntries, orderedIds]);

  const updateScrollIndicators = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);

    // Calcular posición [X/N] de la pestaña activa (Opción 6)
    const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>('button[data-ribbon-active], button[aria-selected]'));
    if (buttons.length > 1) {
      const idx = buttons.findIndex(
        b => b.getAttribute('data-ribbon-active') === 'true' || b.getAttribute('aria-selected') === 'true'
      );
      if (idx >= 0) {
        setTabPositionInfo({ current: idx + 1, total: buttons.length });
      } else {
        setTabPositionInfo({ current: 1, total: buttons.length });
      }
    } else {
      setTabPositionInfo(null);
    }
  }, []);

  useEffect(() => {
    updateScrollIndicators();
    const el = containerRef.current;
    if (!el) return;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScrollIndicators) : null;
    ro?.observe(el);
    window.addEventListener('resize', updateScrollIndicators);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateScrollIndicators);
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, [updateScrollIndicators, children, orderedIds]);

  // Auto-centrado inteligente de la pestaña activa (Opción 5)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || activeKey === undefined) return;
    const activeChild = el.querySelector<HTMLElement>('[data-ribbon-active="true"], [aria-selected="true"]');
    if (activeChild) {
      const targetLeft = activeChild.offsetLeft - el.clientWidth / 2 + activeChild.clientWidth / 2;
      el.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    }
    setTimeout(updateScrollIndicators, 220);
  }, [activeKey, updateScrollIndicators]);

  const handleScrollBy = useCallback((dir: 'left' | 'right', stepOverride?: number) => {
    const el = containerRef.current;
    if (!el) return;
    const s = stepOverride ?? scrollStep;
    el.scrollBy({ left: dir === 'left' ? -s : s, behavior: 'smooth' });
    setTimeout(updateScrollIndicators, 200);
  }, [scrollStep, updateScrollIndicators]);

  const startHoldScroll = (dir: 'left' | 'right') => {
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    holdTimerRef.current = setInterval(() => {
      handleScrollBy(dir, 140);
    }, 120);
  };

  const stopHoldScroll = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.currentTarget.scrollLeft += e.deltaY;
      updateScrollIndicators();
    }
  };

  // Navegación con flechas de teclado ⬅️ / ➡️ (Opción 6)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const el = containerRef.current;
    if (!el) return;
    const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>('button[data-ribbon-active], button[aria-selected]'));
    if (buttons.length > 1) {
      const idx = buttons.findIndex(
        b => b.getAttribute('data-ribbon-active') === 'true' || b.getAttribute('aria-selected') === 'true'
      );
      if (idx >= 0) {
        e.preventDefault();
        const nextIdx = e.key === 'ArrowRight'
          ? (idx + 1) % buttons.length
          : (idx - 1 + buttons.length) % buttons.length;
        buttons[nextIdx]?.click();
        buttons[nextIdx]?.focus();
        return;
      }
    }
    handleScrollBy(e.key === 'ArrowLeft' ? 'left' : 'right');
  };

  const styles = ACCENT_STYLES[accent];

  return (
    <div
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`relative flex items-center gap-1 min-w-0 outline-none ${className}`}
    >
      {leftAddon && (
        <div className="shrink-0 flex items-center mr-1 pr-1.5 border-r border-slate-700/80">
          {leftAddon}
        </div>
      )}

      <button
        type="button"
        onClick={() => handleScrollBy('left')}
        onMouseDown={() => startHoldScroll('left')}
        onMouseUp={stopHoldScroll}
        onMouseLeave={stopHoldScroll}
        title="Deslizar cinta a la izquierda (clic mantenido, rueda del ratón o teclas ⬅️/➡️)"
        className={`shrink-0 z-10 px-1.5 py-1.5 border rounded-l cursor-pointer transition-all ${
          canScrollLeft ? styles.buttonActive : styles.buttonIdle
        }`}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      <div
        ref={containerRef}
        onScroll={updateScrollIndicators}
        onWheel={handleWheel}
        className={`flex items-center justify-start gap-1.5 overflow-x-auto whitespace-nowrap flex-1 min-w-0 pt-2 pb-0.5 scroll-smooth [scrollbar-width:thin] ${styles.scrollbar} ${innerClassName}`}
      >
        {fixedPrefixNodes}
        {orderedEntries.map((entry, idx) => (
          <OrderableTabItem
            key={entry.id}
            id={entry.id}
            index={idx}
            total={orderedEntries.length}
            onMove={moveItem}
            compact
          >
            {entry.node}
          </OrderableTabItem>
        ))}
      </div>

      <OrderableResetButton isCustomized={isCustomized} onReset={resetOrder} label="Orden" />

      {showPositionBadge && tabPositionInfo && (
        <span
          title={`Pestaña activa ${tabPositionInfo.current} de ${tabPositionInfo.total} (usa ⬅️ / ➡️ para cambiar o pasa el ratón sobre cualquier pestaña para moverla ◀ / ▶)`}
          className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] font-mono font-black shrink-0 select-none ${styles.badge}`}
        >
          {tabPositionInfo.current}/{tabPositionInfo.total}
        </span>
      )}

      <button
        type="button"
        onClick={() => handleScrollBy('right')}
        onMouseDown={() => startHoldScroll('right')}
        onMouseUp={stopHoldScroll}
        onMouseLeave={stopHoldScroll}
        title="Deslizar cinta a la derecha (clic mantenido, rueda del ratón o teclas ⬅️/➡️)"
        className={`shrink-0 z-10 px-1.5 py-1.5 border rounded-r cursor-pointer transition-all ${
          canScrollRight ? styles.buttonActive : styles.buttonIdle
        }`}
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {rightAddon && (
        <div className="shrink-0 flex items-center ml-1 pl-1.5 border-l border-slate-700/80">
          {rightAddon}
        </div>
      )}
    </div>
  );
};

export interface TableHorizontalScrollContainerProps {
  children: React.ReactNode;
  title?: string;
  label?: string;
  accent?: 'emerald' | 'amber' | 'cyan' | 'indigo' | 'rose' | 'purple';
  className?: string;
  scrollStep?: number;
  defaultStickyFirstCol?: boolean;
}

/**
 * Contenedor de Tabla Científica Doctoral (Opciones 2, 4 y 6 / Regla 22):
 * - Botones superiores ◀ Columna | Columna ▶ sin bajar al final de la tabla
 * - 1.ª Columna Fija (Sticky First Column) + Cabecera Fija (Sticky Header) conmutables
 * - Buscador instantáneo en vivo (🔍 Filtrar fila...) sobre las filas de la tabla
 * - Botón 📋 Copiar Tabla en 1 clic (formato TSV compatible con Word, Excel y LaTeX)
 */
export const TableHorizontalScrollContainer: React.FC<TableHorizontalScrollContainerProps> = ({
  children,
  title,
  label,
  accent = 'emerald',
  className = 'border-2 border-slate-700 rounded-lg',
  scrollStep = 340,
  defaultStickyFirstCol = true
}) => {
  const effectiveTitle = title || label || 'Deslizador Horizontal de Columnas de la Tabla';
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [stickyFirstCol, setStickyFirstCol] = useState(defaultStickyFirstCol);
  const [filterQuery, setFilterQuery] = useState('');
  const [matchStats, setMatchStats] = useState<{ shown: number; total: number } | null>(null);
  const [copiedTable, setCopiedTable] = useState(false);

  const updateIndicators = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateIndicators();
    const el = scrollRef.current;
    if (!el) return;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateIndicators) : null;
    ro?.observe(el);
    window.addEventListener('resize', updateIndicators);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateIndicators);
    };
  }, [updateIndicators, children]);

  // Filtro instantáneo de filas en el DOM de la tabla (Opción 4 — 0 ms re-render overhead)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const rows = Array.from(el.querySelectorAll<HTMLTableRowElement>('tbody tr'));
    if (rows.length === 0) {
      setMatchStats(null);
      return;
    }
    const q = filterQuery.trim().toLowerCase();
    if (!q) {
      rows.forEach(r => {
        r.style.display = '';
      });
      setMatchStats(null);
      return;
    }
    let shown = 0;
    rows.forEach(r => {
      const txt = (r.textContent || '').toLowerCase();
      const matched = txt.includes(q);
      r.style.display = matched ? '' : 'none';
      if (matched) shown++;
    });
    setMatchStats({ shown, total: rows.length });
  }, [filterQuery, children]);

  const scrollCols = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -scrollStep : scrollStep, behavior: 'smooth' });
    setTimeout(updateIndicators, 220);
  };

  // Copiar tabla completa o filtrada al portapapeles para Word/Excel/LaTeX (Opción 4)
  const handleCopyTable = () => {
    const el = scrollRef.current;
    if (!el) return;
    const table = el.querySelector('table');
    if (!table) return;
    const lines: string[] = [];
    const allRows = Array.from(table.querySelectorAll('tr'));
    allRows.forEach(tr => {
      if ((tr as HTMLElement).style.display === 'none') return;
      const cells = Array.from(tr.querySelectorAll('th, td')).map(c =>
        (c.textContent || '').replace(/\s+/g, ' ').trim()
      );
      if (cells.length > 0) {
        lines.push(cells.join('\t'));
      }
    });
    if (lines.length > 0 && navigator.clipboard) {
      navigator.clipboard.writeText(lines.join('\n')).then(() => {
        setCopiedTable(true);
        setTimeout(() => setCopiedTable(false), 2000);
      });
    }
  };

  const styles = ACCENT_STYLES[accent];

  // Clases CSS para fijar 1.ª columna a la izquierda y cabecera arriba (Opción 2)
  const stickyTableClasses = stickyFirstCol
    ? '[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-20 [&_thead_th]:bg-slate-950 [&_th:first-child]:sticky [&_th:first-child]:left-0 [&_th:first-child]:z-30 [&_th:first-child]:bg-slate-950 [&_td:first-child]:sticky [&_td:first-child]:left-0 [&_td:first-child]:z-10 [&_td:first-child]:bg-slate-950/95 [&_td:first-child]:shadow-[2px_0_6px_rgba(0,0,0,0.65)]'
    : '[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-20 [&_thead_th]:bg-slate-950';

  return (
    <div className={`overflow-hidden bg-slate-950/90 ${className}`}>
      {/* Barra superior compacta en 1 sola línea (iPad/PC) y adaptable en móvil para deslizar columnas, fijar 1.ª columna, filtrar y copiar */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 px-2.5 py-1 bg-slate-900/95 border-b border-slate-800 text-[10px] font-mono">
        <span className="flex items-center gap-1.5 text-slate-200 font-bold min-w-0 flex-1 truncate">
          <Columns className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate" title={effectiveTitle}>{effectiveTitle}</span>
        </span>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 shrink-0 ml-auto">
          {/* Buscador instantáneo de filas (Opción 4) */}
          <div className="relative flex items-center">
            <Search className="w-3 h-3 text-slate-400 absolute left-1.5 pointer-events-none" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filtrar fila..."
              className="bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded pl-5 pr-4 py-0.5 text-[9.5px] text-slate-100 placeholder-slate-400 outline-none w-24 sm:w-28 md:w-32 transition-all"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="absolute right-1 text-slate-400 hover:text-white cursor-pointer"
                title="Limpiar filtro"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
          {matchStats && (
            <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 text-[9px] font-black">
              {matchStats.shown}/{matchStats.total}
            </span>
          )}

          {/* Conmutador de 1.ª Columna Fija (Opción 2) */}
          <button
            type="button"
            onClick={() => setStickyFirstCol(prev => !prev)}
            className={`px-2 py-0.5 border rounded text-[9px] font-black flex items-center gap-1 cursor-pointer transition-all ${
              stickyFirstCol
                ? 'bg-cyan-950/90 text-cyan-200 border-cyan-500/80'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Mantener fija la 1.ª columna de la izquierda al desplazar la tabla hacia la derecha"
          >
            <Pin className={`w-2.5 h-2.5 ${stickyFirstCol ? 'text-cyan-300 fill-cyan-300' : ''}`} />
            <span>1.ª Col Fija</span>
          </button>

          {/* Copiar Tabla en 1 Clic (Opción 4) */}
          <button
            type="button"
            onClick={handleCopyTable}
            className={`px-2 py-0.5 border rounded text-[9px] font-black flex items-center gap-1 cursor-pointer transition-all ${
              copiedTable
                ? 'bg-emerald-700 text-white border-emerald-300'
                : 'bg-slate-900 hover:bg-slate-800 text-emerald-300 border-emerald-700/80'
            }`}
            title="Copiar tabla completa (o filas filtradas) lista para pegar en Word, Excel o LaTeX"
          >
            {copiedTable ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
            <span>{copiedTable ? 'Copiada' : 'Copiar'}</span>
          </button>

          {/* Botones de desplazamiento de columnas (Opción 6) */}
          <button
            type="button"
            onClick={() => scrollCols('left')}
            className={`px-2 py-0.5 border rounded text-[9.5px] font-black flex items-center gap-1 cursor-pointer transition-all ${
              canScrollLeft ? styles.buttonActive : styles.buttonIdle
            }`}
            title="Deslizar columnas de la tabla hacia la izquierda"
          >
            <ChevronLeft className="w-3 h-3" />
            <span>◀ Columna</span>
          </button>
          <button
            type="button"
            onClick={() => scrollCols('right')}
            className={`px-2 py-0.5 border rounded text-[9.5px] font-black flex items-center gap-1 cursor-pointer transition-all ${
              canScrollRight ? styles.buttonActive : styles.buttonIdle
            }`}
            title="Deslizar columnas de la tabla hacia la derecha"
          >
            <span>Columna ▶</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={updateIndicators}
        className={`overflow-x-auto scroll-smooth [scrollbar-width:thin] ${styles.scrollbar} ${stickyTableClasses}`}
      >
        {children}
      </div>
    </div>
  );
};
