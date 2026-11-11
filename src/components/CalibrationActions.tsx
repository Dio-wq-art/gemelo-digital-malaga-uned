import React, { useState } from 'react';
import { History, Save } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { MeteoData } from '../lib/physics';

interface Props {
  onSave: () => void;
  onOpenHistory: () => void;
}

export function CalibrationActions({ onSave, onOpenHistory }: Props) {
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = () => {
    onSave();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <div className="flex space-x-2 mt-3 pt-3 border-t border-slate-800">
      <ScientificTooltip
        position="top"
        width="w-[280px]"
        content="Registrar los valores actuales de vd y k en el historial persistente de la sesión junto con las condiciones meteorológicas."
      >
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center space-x-1.5 bg-emerald-900/30 hover:bg-emerald-800/40 border border-emerald-800/50 text-emerald-400 py-1.5 px-2 rounded transition-colors text-[10px] font-medium"
        >
          <Save className="w-3 h-3" />
          <span>{justSaved ? 'Registrado' : 'Guardar Calibración'}</span>
        </button>
      </ScientificTooltip>

      <ScientificTooltip
        position="top"
        width="w-[280px]"
        content="Abrir el panel de tendencias históricas de calibración (Series Temporales y Registros Tabulares CSV)."
      >
        <button
          onClick={onOpenHistory}
          className="flex-1 flex items-center justify-center space-x-1.5 bg-sky-900/30 hover:bg-sky-800/40 border border-sky-800/50 text-sky-400 py-1.5 px-2 rounded transition-colors text-[10px] font-medium"
        >
          <History className="w-3 h-3" />
          <span>Ver Historial / Tendencias</span>
        </button>
      </ScientificTooltip>
    </div>
  );
}
