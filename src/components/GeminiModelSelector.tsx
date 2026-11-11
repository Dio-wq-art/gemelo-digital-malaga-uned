import React from 'react';
import { Cpu, Sparkles, Zap, ShieldCheck, ChevronDown } from 'lucide-react';
import { useGeminiModel } from '../context/GeminiModelContext';
import { ScientificTooltip } from './ScientificTooltip';
import { GeminiModelOption } from '../types/geminiModels';

interface GeminiModelSelectorProps {
  variant?: 'compact' | 'expanded' | 'dropdown';
  className?: string;
  onModelChange?: (model: GeminiModelOption) => void;
}

export const GeminiModelSelector: React.FC<GeminiModelSelectorProps> = ({
  variant = 'compact',
  className = '',
  onModelChange
}) => {
  const { selectedModelId, setSelectedModelId, activeModel, availableModels } = useGeminiModel();

  const handleSelect = (modelId: string) => {
    setSelectedModelId(modelId);
    const found = availableModels.find(m => m.id === modelId);
    if (found && onModelChange) {
      onModelChange(found);
    }
  };

  if (variant === 'dropdown') {
    return (
      <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
        <label className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
          <Cpu className="w-3 h-3 text-purple-400" />
          <span>Motor IA:</span>
        </label>
        <select
          value={selectedModelId}
          onChange={(e) => handleSelect(e.target.value)}
          className="bg-slate-900 border border-purple-700/70 text-purple-200 text-[10px] font-mono font-bold rounded px-2 py-1 focus:outline-none focus:border-purple-400 cursor-pointer shadow-sm"
        >
          {availableModels.map((m) => (
            <option key={m.id} value={m.id} className="bg-slate-950 text-slate-200">
              {m.shortName} [{m.tag}] - {m.speed}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (variant === 'expanded') {
    return (
      <div className={`space-y-2 bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold text-slate-300 flex items-center gap-1.5 font-mono">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            CATÁLOGO DE MOTORES GEMINI PARA ANÁLISIS DOCTORAL
          </span>
          <span className="bg-purple-950 border border-purple-600/80 text-purple-300 px-2 py-0.5 rounded text-[9.5px] font-mono font-bold">
            ACTIVO: {activeModel.tag}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {availableModels.map((m) => {
            const isSelected = m.id === selectedModelId;
            return (
              <ScientificTooltip
                key={m.id}
                position="top"
                width="w-[300px]"
                content={`${m.name}: ${m.description} Recomendado para: ${m.recommendedFor}. Razonamiento: ${m.reasoning}. Velocidad: ${m.speed}.`}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(m.id)}
                  className={`w-full p-2 rounded border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-purple-950/90 border-purple-500 text-purple-100 shadow-md shadow-purple-950/60 ring-1 ring-purple-400/40'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-[11px] truncate flex items-center gap-1.5 text-slate-100">
                      {m.isPro ? <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      <span>{m.shortName}</span>
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold shrink-0 ${
                      m.category === 'pro'
                        ? 'bg-amber-950 text-amber-300 border border-amber-600/60'
                        : m.category === 'flash'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/60'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {m.tag}
                    </span>
                  </div>
                  <p className="text-[9.5px] text-slate-300 line-clamp-2 leading-relaxed">
                    {m.description}
                  </p>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-0.5 border-t border-slate-800/60">
                    <span>Razonamiento: <strong className="text-purple-300">{m.reasoning}</strong></span>
                    <span>Latencia: <strong className="text-emerald-400">{m.speed}</strong></span>
                  </div>
                </button>
              </ScientificTooltip>
            );
          })}
        </div>
      </div>
    );
  }

  // Variant compact (pill buttons)
  return (
    <div className={`flex flex-wrap items-center gap-1.5 font-mono ${className}`}>
      <span className="text-[10px] text-slate-400 flex items-center gap-1 mr-0.5">
        <Cpu className="w-3 h-3 text-purple-400" />
        <span className="hidden sm:inline">Modelo:</span>
      </span>
      {availableModels.map((m) => {
        const isSelected = m.id === selectedModelId;
        return (
          <ScientificTooltip
            key={m.id}
            position="top"
            width="w-[280px]"
            content={`${m.name}: ${m.description} (Velocidad: ${m.speed}, Razonamiento: ${m.reasoning})`}
          >
            <button
              type="button"
              onClick={() => handleSelect(m.id)}
              className={`px-2 py-0.8 rounded text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                isSelected
                  ? 'bg-purple-950 border-purple-500 text-purple-200 shadow-sm'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {m.isPro && <Sparkles className="w-2.5 h-2.5 text-amber-400" />}
              <span>{m.shortName}</span>
            </button>
          </ScientificTooltip>
        );
      })}
    </div>
  );
};
