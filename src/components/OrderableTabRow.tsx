import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, ChevronsLeft } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';

const STORAGE_PREFIX = 'malaga_dt_tab_order_v1_';

function readStoredOrder(storageKey: string): string[] | null {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
          return parsed;
        }
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
}

function writeStoredOrder(storageKey: string, ids: string[]): void {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, JSON.stringify(ids));
    }
  } catch {
    // Ignore storage write errors
  }
}

function clearStoredOrder(storageKey: string): void {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(`${STORAGE_PREFIX}${storageKey}`);
    }
  } catch {
    // Ignore storage remove errors
  }
}

/**
 * Reconcilia el orden guardado por el usuario con la lista actual de IDs disponibles.
 * - Respeta el orden personalizado de las pestañas existentes.
 * - Si en el futuro se añade una pestaña nueva a la aplicación, se incorpora automáticamente al final sin perder la personalización.
 */
function reconcileOrder(savedIds: string[] | null, defaultIds: string[]): string[] {
  if (!savedIds || savedIds.length === 0) return defaultIds;
  const defaultSet = new Set(defaultIds);
  const validSaved = savedIds.filter((id) => defaultSet.has(id));
  const savedSet = new Set(validSaved);
  const newAdditions = defaultIds.filter((id) => !savedSet.has(id));
  return [...validSaved, ...newAdditions];
}

export interface UseOrderableIdsResult {
  orderedIds: string[];
  moveItem: (id: string, direction: 'left' | 'right' | 'start') => void;
  resetOrder: () => void;
  isCustomized: boolean;
}

/**
 * Hook quirúrgico y reutilizable para ordenar pestañas a izquierda/derecha a voluntad con memoria persistente.
 */
export function useOrderableIds(storageKey: string, defaultIds: string[]): UseOrderableIdsResult {
  const defaultSignature = defaultIds.join('|');

  const [savedOrder, setSavedOrder] = useState<string[] | null>(() => readStoredOrder(storageKey));

  useEffect(() => {
    setSavedOrder(readStoredOrder(storageKey));
    const handleCloudUpdate = () => {
      setSavedOrder(readStoredOrder(storageKey));
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('doctoral-workspace-sync-updated', handleCloudUpdate);
      return () => window.removeEventListener('doctoral-workspace-sync-updated', handleCloudUpdate);
    }
  }, [storageKey]);

  const orderedIds = useMemo(
    () => reconcileOrder(savedOrder, defaultIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [savedOrder, defaultSignature]
  );

  const isCustomized = useMemo(() => {
    if (orderedIds.length !== defaultIds.length) return false;
    return orderedIds.some((id, idx) => id !== defaultIds[idx]);
  }, [orderedIds, defaultIds]);

  const moveItem = useCallback(
    (id: string, direction: 'left' | 'right' | 'start') => {
      if (
        typeof window !== 'undefined' &&
        ((window as any).__DOCTORAL_DEFENSE_LOCK__ === true ||
          window.localStorage?.getItem('malaga_phd_defense_lock_v1') === 'true')
      ) {
        return;
      }
      const current = reconcileOrder(readStoredOrder(storageKey) ?? savedOrder, defaultIds);
      const index = current.indexOf(id);
      if (index === -1) return;

      const next = [...current];
      if (direction === 'start') {
        if (index === 0) return;
        const [removed] = next.splice(index, 1);
        next.unshift(removed);
      } else if (direction === 'left') {
        const targetIndex = index === 0 ? next.length - 1 : index - 1;
        const temp = next[targetIndex];
        next[targetIndex] = next[index];
        next[index] = temp;
      } else {
        const targetIndex = index === next.length - 1 ? 0 : index + 1;
        const temp = next[targetIndex];
        next[targetIndex] = next[index];
        next[index] = temp;
      }

      setSavedOrder(next);
      writeStoredOrder(storageKey, next);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('doctoral-workspace-sync-updated'));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storageKey, savedOrder, defaultSignature]
  );

  const resetOrder = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      ((window as any).__DOCTORAL_DEFENSE_LOCK__ === true ||
        window.localStorage?.getItem('malaga_phd_defense_lock_v1') === 'true')
    ) {
      return;
    }
    clearStoredOrder(storageKey);
    setSavedOrder(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('doctoral-workspace-sync-updated'));
    }
  }, [storageKey]);

  return {
    orderedIds,
    moveItem,
    resetOrder,
    isCustomized
  };
}

export interface OrderableTabItemProps {
  id: string;
  index: number;
  total: number;
  onMove: (id: string, direction: 'left' | 'right' | 'start') => void;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}

/**
 * Envoltorio quirúrgico para cualquier pestaña, píldora o botón:
 * Muestra controles flotantes ◀ / ▶ al pasar el ratón (y soporta Shift+◀ para traer al principio)
 * sin alterar el ancho ni saturar la interfaz.
 */
export const OrderableTabItem: React.FC<OrderableTabItemProps> = ({
  id,
  index,
  total,
  onMove,
  children,
  className = '',
  compact = false
}) => {
  if (total <= 1) {
    return <div className={`inline-flex items-center shrink-0 ${className}`}>{children}</div>;
  }

  return (
    <div
      className={`relative inline-flex items-center shrink-0 group/orderable ${className}`}
      onContextMenu={(e) => {
        if (e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          onMove(id, 'right');
        }
      }}
      onClickCapture={(e) => {
        if (e.altKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          onMove(id, e.shiftKey ? 'start' : 'left');
        }
      }}
    >
      {children}

      {/* Micro-controles flotantes ◀ ▶ posicionados en el borde superior sin tapar el clic de la pestaña */}
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className={`hidden [@media(hover:hover)_and_(pointer:fine)]:group-hover/orderable:inline-flex items-center gap-0.5 absolute ${
          compact ? '-top-2 right-0 scale-90 origin-top-right' : '-top-2 right-0.5 scale-90 origin-top-right'
        } z-[80] bg-slate-950/95 border border-cyan-500/80 rounded px-0.5 py-0 shadow-[0_2px_8px_rgba(0,0,0,0.9)] backdrop-blur-xs select-none pointer-events-auto`}
      >
        {index > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMove(id, 'start');
            }}
            className="p-0.5 text-amber-300 hover:text-white hover:bg-amber-800/80 rounded-xs cursor-pointer transition-colors"
            title="Llevar esta pestaña a la 1.ª posición de la izquierda (o Alt+Shift+Clic)"
            aria-label="Mover al inicio"
          >
            <ChevronsLeft className="w-2.5 h-2.5" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMove(id, e.shiftKey ? 'start' : 'left');
          }}
          className="p-0.5 text-cyan-300 hover:text-white hover:bg-cyan-800/80 rounded-xs cursor-pointer transition-colors"
          title="Desplazar pestaña a la izquierda ◀ (Shift+Clic para llevar al inicio, o Alt+Clic)"
          aria-label="Mover pestaña a la izquierda"
        >
          <ChevronLeft className="w-2.5 h-2.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMove(id, 'right');
          }}
          className="p-0.5 text-cyan-300 hover:text-white hover:bg-cyan-800/80 rounded-xs cursor-pointer transition-colors"
          title="Desplazar pestaña a la derecha ▶ (o Alt+Clic Derecho)"
          aria-label="Mover pestaña a la derecha"
        >
          <ChevronRight className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
};

export interface OrderableResetButtonProps {
  isCustomized: boolean;
  onReset: () => void;
  label?: string;
}

export const OrderableResetButton: React.FC<OrderableResetButtonProps> = ({
  isCustomized,
  onReset,
  label = 'Orden'
}) => {
  if (!isCustomized) return null;

  return (
    <ScientificTooltip
      position="bottom"
      width="w-[250px]"
      title="Restaurar Orden Original de Pestañas"
      content="Has personalizado el orden de las pestañas en esta barra (se guarda automáticamente para futuras sesiones). Pulsa aquí si deseas restaurar la disposición por defecto."
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onReset();
        }}
        className="px-1.5 py-0.5 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-700/70 rounded text-[7.5px] font-mono font-bold inline-flex items-center gap-0.5 cursor-pointer shrink-0 transition-colors"
        title="Restaurar orden por defecto de las pestañas"
      >
        <RotateCcw className="w-2.5 h-2.5 text-cyan-400" />
        <span>{label}</span>
      </button>
    </ScientificTooltip>
  );
};
