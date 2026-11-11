import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck, RotateCcw, Wrench } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary Global] Interceptada anomalía de ejecución:', error, errorInfo);
    this.setState({ errorInfo });

    // Si ocurre un desfase puntual de caché de chunks de Vite tras un reinicio del servidor,
    // refrescamos automáticamente una sola vez de forma transparente (sin borrar localStorage)
    try {
      const msg = error?.message || '';
      const isStaleChunkOrHookError =
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Importing a module script failed') ||
        msg.includes('Unable to preload CSS') ||
        msg.includes('Invalid hook call');
      if (isStaleChunkOrHookError) {
        const lastAutoReload = Number(sessionStorage.getItem('malaga_chunk_autorecover_ts') || '0');
        if (Date.now() - lastAutoReload > 15000) {
          sessionStorage.setItem('malaga_chunk_autorecover_ts', String(Date.now()));
          window.location.reload();
        }
      }
    } catch {
      // Ignorar si sessionStorage está restringido
    }
  }

  private handleSoftRecover = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReset = () => {
    try {
      // Jamás borrar localStorage: se preservan intactos los accesos directos, favoritos, notas y calibraciones
      sessionStorage.clear();
    } catch (e) {
      console.warn('No se pudo limpiar la sesión temporal:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-mono selection:bg-emerald-900">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-3 bg-amber-950/80 border border-amber-600/60 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                  <span>Recuperación Activa · Gemelo Digital de Málaga</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded">
                    Tesis Doctoral
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  El sistema ha interceptado una discrepancia en el árbol de componentes. El lienzo ha sido protegido contra cierres inesperados.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2.5">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" /> Aislamiento de Estado Activo
                </span>
                <span className="text-slate-500">Málaga AI Studio Physics Engine</span>
              </div>
              <div className="text-amber-300 font-bold overflow-x-auto p-2.5 bg-slate-900/90 rounded border border-amber-900/40 text-[11px] leading-relaxed">
                {this.state.error?.message || 'Error de renderizado no especificado.'}
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400">
                Seleccione el protocolo de restauración:
              </span>
              <div className="flex items-center gap-2">
                <ScientificTooltip position="top" width="w-[260px]" content="Restaura el estado de React e intenta re-renderizar los componentes sin recargar la página ni perder datos.">
                  <button
                    onClick={this.handleSoftRecover}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded border border-slate-600 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-sky-400" /> Reintentar Render
                  </button>
                </ScientificTooltip>
                <ScientificTooltip position="top" width="w-[280px]" content="Purga el almacenamiento local y de sesión para resolver discrepancias de caché y recarga el Gemelo Digital desde cero.">
                  <button
                    onClick={this.handleReset}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded border border-emerald-400 flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Limpiar Caché y Reiniciar
                  </button>
                </ScientificTooltip>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
