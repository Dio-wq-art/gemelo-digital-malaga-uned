import React, { useState, useEffect } from 'react';
import { Zap, ServerCrash, RefreshCw, Trash2, Cpu, Layers } from 'lucide-react';
import { InstancedBinaryBuffers } from '../lib/instancedPollutantEngine';
import { garbageCollector, GCMemoryStats, GCExecutionReport } from '../lib/workerAndGpuGarbageCollector';
import { ScientificTooltip } from './ScientificTooltip';

export interface VramTelemetryBufferMetrics {
  instanceCount: number;
  vramInstancedBytes: number;
  vramTraditionalMeshBytes?: number;
  memoryReductionPct?: number;
}

interface VramTelemetryMonitorProps {
  showDeckGL: boolean;
  buffers: VramTelemetryBufferMetrics | InstancedBinaryBuffers | null;
  onForceGC: () => void;
}

export const VramTelemetryMonitor: React.FC<VramTelemetryMonitorProps> = ({ showDeckGL, buffers, onForceGC }) => {
  const [vramUsagePct, setVramUsagePct] = useState(15);
  const [isGCActive, setIsGCActive] = useState(false);
  const [lastReason, setLastReason] = useState<string | null>(null);
  const [stats, setStats] = useState<GCMemoryStats>(garbageCollector.getStats());

  // Suscribirse a eventos automáticos de Garbage Collection
  useEffect(() => {
    const unsubscribe = garbageCollector.subscribe((report, newStats) => {
      setStats(newStats);
      if (newStats.isPurging) {
        setIsGCActive(true);
        setLastReason(report.reason);
      } else {
        setIsGCActive(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let interval: any;
    
    const calculateVram = () => {
      // Cálculo determinista estricto (Zero Stochastic)
      let baseVramMB = 120; // OSM Base Tiles (120MB)
      
      // Contexto WebGL Luma.GL activo
      if (showDeckGL) {
        baseVramMB += 180;
      }
      
      let bufferVramMB = 0;
      if (showDeckGL && buffers) {
        // Float32Arrays + Uint8Arrays en VRAM + overhead de framebuffers
        bufferVramMB = (buffers.vramInstancedBytes * 8.5) / (1024 * 1024);
      }
      
      const totalVramMB = baseVramMB + bufferVramMB;
      
      // Hard limit de cuota VRAM en arquitectura compartida de Digital Twin (512MB)
      const maxVramMB = 512;
      const pct = Math.min(100, Math.max(0, (totalVramMB / maxVramMB) * 100));
      
      setVramUsagePct(pct);
      garbageCollector.updateVramMetric(pct, bufferVramMB * 1024 * 1024);
      
      if (pct >= garbageCollector.VRAM_CRITICAL_THRESHOLD_PCT && !isGCActive) {
        setIsGCActive(true);
        onForceGC();
        
        setTimeout(() => {
          setIsGCActive(false);
        }, 1500);
      }
    };
    
    // Evaluador determinista periódico
    interval = setInterval(calculateVram, 1000);
    calculateVram();
    
    return () => clearInterval(interval);
  }, [showDeckGL, buffers, isGCActive, onForceGC]);

  const isWarning = vramUsagePct > garbageCollector.VRAM_WARNING_THRESHOLD_PCT;
  const isCritical = vramUsagePct >= garbageCollector.VRAM_CRITICAL_THRESHOLD_PCT;

  const handleManualPurgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    garbageCollector.forceManualGC();
    onForceGC();
  };

  const getReasonLabel = (reason: string | null) => {
    if (!reason) return 'GC ACTIVO';
    switch (reason) {
      case 'GPU_SATURATION': return 'SATURACIÓN VRAM';
      case 'ABRUPT_VIEW_CHANGE': return 'CAMBIO VISTA BRUSCO';
      case 'VIEW_PAN_JUMP': return 'SALTO ESPACIAL';
      case 'VIEW_ZOOM_JUMP': return 'SALTO DE ZOOM';
      case 'VIEW_PITCH_JUMP': return 'CAMBIO PERSPECTIVA';
      case 'MAP_STYLE_CHANGE': return 'CAMBIO MAPA BASE';
      case 'MANUAL_PURGE': return 'PURGA MANUAL';
      default: return 'GC PURGE';
    }
  };

  const tooltipContent = (
    <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
      <div className="text-sky-300 font-bold border-b border-sky-800/80 pb-1 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Trash2 className="w-3 h-3 text-emerald-400" />
          <span>Gestor Automático de Garbage Collection</span>
        </span>
        <span className="text-[7.5px] bg-slate-800 text-slate-300 border border-slate-700 px-1 py-0.2 rounded">
          WebWorkers &amp; Deck.GL
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[8px] bg-slate-900/90 p-2 rounded border border-slate-800">
        <div>
          <span className="text-slate-400 block">VRAM GPU Actual:</span>
          <strong className={isCritical ? 'text-red-400 font-bold' : isWarning ? 'text-amber-400' : 'text-emerald-400'}>
            {vramUsagePct.toFixed(1)}% (Cuota: 512 MB)
          </strong>
        </div>
        <div>
          <span className="text-slate-400 block">Total Purgas Ejecutadas:</span>
          <strong className="text-sky-300 font-bold">{stats.totalPurges} eventos</strong>
        </div>
        <div>
          <span className="text-slate-400 block">Memoria VRAM/Heap Liberada:</span>
          <strong className="text-emerald-400 font-bold">~{stats.totalFreedMb} MB</strong>
        </div>
        <div>
          <span className="text-slate-400 block">Último Disparador:</span>
          <strong className="text-amber-300 truncate block">
            {stats.lastReport ? getReasonLabel(stats.lastReport.reason) : 'Ninguno'}
          </strong>
        </div>
      </div>

      <div className="space-y-1 text-[7.5px] text-slate-300 bg-slate-950/80 p-1.5 rounded border border-slate-800/80">
        <div className="flex items-center gap-1 text-cyan-300 font-bold">
          <Cpu className="w-2.5 h-2.5" />
          <span>Políticas de Desalojo Automático:</span>
        </div>
        <ul className="list-disc pl-3 space-y-0.5 text-slate-400">
          <li><strong>Saturación GPU:</strong> Purga forzada al superar {garbageCollector.VRAM_CRITICAL_THRESHOLD_PCT}% VRAM.</li>
          <li><strong>Salto Espacial Abrupto:</strong> Purgado al saltar &gt;{garbageCollector.ABRUPT_PAN_DISTANCE_KM} km instantáneos.</li>
          <li><strong>Salto de Escala:</strong> Purgado al cambiar &gt;{garbageCollector.ABRUPT_ZOOM_DELTA} niveles de zoom.</li>
          <li><strong>Cambio de Perspectiva:</strong> Evacuación al girar &gt;{garbageCollector.ABRUPT_PITCH_DELTA}° de inclinación.</li>
          <li><strong>Workers Reciclados:</strong> Reinicio de trafficWorker y physicsGeoWorker para eliminar fragmentación.</li>
        </ul>
      </div>

      <div className="pt-1 flex items-center justify-between border-t border-slate-800 text-[8px]">
        <span className="text-slate-400">Click para forzar evacuación manual inmediata.</span>
        <span className="text-emerald-400 font-bold">ACTIVO 24/7</span>
      </div>
    </div>
  );

  return (
    <ScientificTooltip width="w-[340px]" position="bottom" content={tooltipContent}>
      <button
        onClick={handleManualPurgeClick}
        className="flex items-center gap-1 px-1.5 py-0.5 font-mono text-[9px] min-w-[70px] justify-center tracking-tight border border-slate-800/80 hover:border-slate-700 bg-slate-950/60 rounded transition-all cursor-pointer group"
      >
        {isGCActive ? (
          <>
            <ServerCrash className="w-3 h-3 text-rose-500 animate-pulse shrink-0" />
            <span className="text-rose-400 font-bold whitespace-nowrap animate-pulse">
              {getReasonLabel(lastReason)}
            </span>
          </>
        ) : (
          <>
            <Zap className={`w-3 h-3 shrink-0 transition-transform group-hover:scale-110 ${isCritical ? 'text-red-500 animate-pulse' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span className={`${isCritical ? 'text-red-500' : isWarning ? 'text-amber-400' : 'text-emerald-400'} font-bold whitespace-nowrap`}>
              {vramUsagePct.toFixed(1)}% VRAM
            </span>
            <RefreshCw className="w-2.5 h-2.5 text-slate-500 group-hover:text-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
          </>
        )}
      </button>
    </ScientificTooltip>
  );
};
