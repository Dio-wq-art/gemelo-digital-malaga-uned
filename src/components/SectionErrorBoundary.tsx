import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  silentFallback?: boolean;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn(`[SectionErrorBoundary] Capturada anomalía en sección "${this.props.fallbackTitle || 'Componente'}":`, error, errorInfo);
  }

  public reset = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.silentFallback) {
        return null;
      }

      return (
        <div className="p-3 bg-slate-900/90 border border-amber-800/60 rounded-lg text-xs font-mono text-slate-300 space-y-2 m-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{this.props.fallbackTitle || 'Módulo Protegido'}</span>
            </div>
            <ScientificTooltip position="bottom" width="w-[240px]" content="Reintenta renderizar de forma segura este componente científico sin interrumpir el Gemelo Digital.">
              <button
                onClick={this.reset}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Reintentar
              </button>
            </ScientificTooltip>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Se ha contenido un error de renderizado en esta capa para preservar la operatividad continua del Gemelo Digital.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
