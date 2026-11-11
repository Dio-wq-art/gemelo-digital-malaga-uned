import React, { createContext, useContext, useState, useEffect } from 'react';
import { GeminiModelOption, GEMINI_MODELS, DEFAULT_GEMINI_MODEL } from '../types/geminiModels';

export interface GeminiModelContextValue {
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
  activeModel: GeminiModelOption;
  availableModels: GeminiModelOption[];
}

export const GeminiModelContext = createContext<GeminiModelContextValue | null>(null);

export const GeminiModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedModelId, setSelectedModelIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('gemini_selected_model_id');
      if (saved && GEMINI_MODELS.some(m => m.id === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return DEFAULT_GEMINI_MODEL;
  });

  const setSelectedModelId = (id: string) => {
    setSelectedModelIdState(id);
    try {
      localStorage.setItem('gemini_selected_model_id', id);
    } catch {
      // ignore
    }
  };

  const activeModel = GEMINI_MODELS.find(m => m.id === selectedModelId) || GEMINI_MODELS[0];

  return (
    <GeminiModelContext.Provider
      value={{
        selectedModelId,
        setSelectedModelId,
        activeModel,
        availableModels: GEMINI_MODELS,
      }}
    >
      {children}
    </GeminiModelContext.Provider>
  );
};

export const useGeminiModel = (): GeminiModelContextValue => {
  const context = useContext(GeminiModelContext);
  if (!context) {
    const fallbackModel = GEMINI_MODELS[0];
    return {
      selectedModelId: fallbackModel.id,
      setSelectedModelId: () => {},
      activeModel: fallbackModel,
      availableModels: GEMINI_MODELS,
    };
  }
  return context;
};
