import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface DoctoralFoldableBlockProps {
  id?: string;
  title: React.ReactNode;
  badge?: React.ReactNode;
  summaryLine?: React.ReactNode;
  defaultOpen?: boolean;
  borderColorClass?: string;
  headerBgClass?: string;
  rightActions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Contenedor Plegable Estándar de Futuro para el Gemelo Digital (UNED Doctorado).
 * - Nace plegado por defecto (`defaultOpen = false`) en 1 barra compacta de resumen.
 * - Aplica `self-start` para impedir huecos negros verticales en rejillas (`grid items-start`).
 * - Preserva el 100 % de los datos internos accesibles con 1 clic en `▾ Desplegar / ▴ Plegar`.
 */
export const DoctoralFoldableBlock: React.FC<DoctoralFoldableBlockProps> = ({
  id,
  title,
  badge,
  summaryLine,
  defaultOpen = false,
  borderColorClass = 'border-slate-800 hover:border-cyan-500/50',
  headerBgClass = 'bg-slate-900/75',
  rightActions,
  children
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  return (
    <div
      id={id}
      className={`rounded-lg border ${borderColorClass} bg-slate-950/90 overflow-hidden self-start transition-all`}
    >
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={`px-3 py-2 ${headerBgClass} flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-bold text-white uppercase tracking-tight">
              {title}
            </span>
            {badge && <span className="shrink-0">{badge}</span>}
          </div>
          {!isOpen && summaryLine && (
            <div className="text-[10px] font-mono text-slate-300 truncate mt-0.5">
              {summaryLine}
            </div>
          )}
        </div>

        <div
          className="flex items-center gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {rightActions}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-[9.5px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{isOpen ? '▴ Plegar' : '▾ Desplegar'}</span>
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-3 border-t border-slate-800/90 space-y-2.5">
          {children}
        </div>
      )}
    </div>
  );
};
