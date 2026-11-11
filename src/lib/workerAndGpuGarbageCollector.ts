/**
 * Gestor de 'Garbage Collection' Automático para WebWorkers y Buffers de Deck.GL
 * Tesis Doctoral - Gemelo Digital de Calidad del Aire de Málaga
 * 
 * Monitorea continuamente la saturación de VRAM/GPU y detecta cambios de vista
 * abruptos (desplazamientos kilométricos, saltos bruscos de zoom, variaciones de inclinación/pitch
 * o conmutación de mapa base), forzando la evacuación determinista de TypedArrays
 * y el reciclaje higiénico de WebWorkers (trafficWorker, physicsGeoWorker).
 * 
 * Reglas de Tesis: Cero aleatoriedad, trazabilidad estricta y métricas de desalojo deterministas.
 */

export type GCTriggerReason = 
  | 'GPU_SATURATION'
  | 'ABRUPT_VIEW_CHANGE'
  | 'VIEW_ZOOM_JUMP'
  | 'VIEW_PAN_JUMP'
  | 'VIEW_PITCH_JUMP'
  | 'MAP_STYLE_CHANGE'
  | 'MANUAL_PURGE'
  | 'WORKER_HEALTH_REBOOT';

export interface ViewStateSnapshot {
  lat: number;
  lon: number;
  zoom: number;
  pitch: number;
  bearing: number;
  style?: string;
  timestamp?: number;
}

export interface GCExecutionReport {
  id: string;
  timestamp: string;
  epoch: number;
  reason: GCTriggerReason;
  description: string;
  vramPctBefore: number;
  vramPctAfter: number;
  estimatedFreedMb: number;
  workersNotified: string[];
  workersRecycled: boolean;
  deckBuffersPurged: boolean;
  osmCachePrunedEntries: number;
  durationMs: number;
}

export interface GCMemoryStats {
  totalPurges: number;
  totalFreedMb: number;
  lastReport: GCExecutionReport | null;
  isPurging: boolean;
  purgesByReason: Record<GCTriggerReason, number>;
  vramCurrentPct: number;
  vramWarningThreshold: number;
  vramCriticalThreshold: number;
}

type GCListener = (report: GCExecutionReport, stats: GCMemoryStats) => void;

class WorkerAndGpuGarbageCollector {
  private static instance: WorkerAndGpuGarbageCollector | null = null;

  // Umbrales deterministas de VRAM GPU
  public readonly VRAM_WARNING_THRESHOLD_PCT = 78.0;
  public readonly VRAM_CRITICAL_THRESHOLD_PCT = 88.0;

  // Umbrales deterministas de cambio de vista abrupto
  public readonly ABRUPT_PAN_DISTANCE_KM = 0.95; // >950m de salto espacial instantáneo
  public readonly ABRUPT_ZOOM_DELTA = 1.95;       // >~2 niveles de escala cartográfica
  public readonly ABRUPT_PITCH_DELTA = 35.0;      // >35° de inclinación repentina
  public readonly VIEW_CHANGE_DEBOUNCE_MS = 600;  // Cooldown mínimo para evitar thrashing

  // Estado interno
  private lastViewState: ViewStateSnapshot | null = null;
  private lastGCTime = 0;
  private isPurging = false;
  private currentVramPct = 15.0;
  private history: GCExecutionReport[] = [];
  private listeners: Set<GCListener> = new Set();

  // Referencias a Workers
  private trafficWorkerRef: Worker | null = null;
  private physicsGeoWorkerRef: Worker | null = null;
  private trafficWorkerFactory: (() => Worker) | null = null;
  private physicsGeoWorkerFactory: (() => Worker) | null = null;
  private onWorkerRecycledCallback: ((workerType: 'traffic' | 'physics', newWorker: Worker) => void) | null = null;

  // Callbacks de desalojo
  private deckGlPurgeCallback: ((reason: GCTriggerReason) => number) | null = null;
  private osmCachePruneCallback: (() => number) | null = null;

  private constructor() {
    // Inicialización del gestor
  }

  public static getInstance(): WorkerAndGpuGarbageCollector {
    if (!WorkerAndGpuGarbageCollector.instance) {
      WorkerAndGpuGarbageCollector.instance = new WorkerAndGpuGarbageCollector();
    }
    return WorkerAndGpuGarbageCollector.instance;
  }

  /**
   * Registra los WebWorkers y sus fábricas para reciclaje seguro en caliente
   */
  public registerWorkers(
    trafficWorker: Worker | null,
    physicsGeoWorker: Worker | null,
    factories?: {
      createTrafficWorker: () => Worker;
      createPhysicsGeoWorker: () => Worker;
      onWorkerRecycled: (workerType: 'traffic' | 'physics', newWorker: Worker) => void;
    }
  ) {
    this.trafficWorkerRef = trafficWorker;
    this.physicsGeoWorkerRef = physicsGeoWorker;
    if (factories) {
      this.trafficWorkerFactory = factories.createTrafficWorker;
      this.physicsGeoWorkerFactory = factories.createPhysicsGeoWorker;
      this.onWorkerRecycledCallback = factories.onWorkerRecycled;
    }
  }

  /**
   * Registra el callback de desalojo de buffers de Deck.GL (Luma.gl/WebGL)
   */
  public registerDeckGlPurgeCallback(cb: (reason: GCTriggerReason) => number) {
    this.deckGlPurgeCallback = cb;
  }

  /**
   * Registra el callback de poda de caché espacial OSM
   */
  public registerOsmCachePruneCallback(cb: () => number) {
    this.osmCachePruneCallback = cb;
  }

  /**
   * Actualiza el porcentaje actual de VRAM reportado por el monitor de telemetría
   */
  public updateVramMetric(vramPct: number, vramBytes: number = 0) {
    this.currentVramPct = Math.max(0, Math.min(100, vramPct));
    
    // Disparador automático por saturación de VRAM
    if (this.currentVramPct >= this.VRAM_CRITICAL_THRESHOLD_PCT && !this.isPurging) {
      const now = Date.now();
      if (now - this.lastGCTime > 1200) {
        this.executeGarbageCollection('GPU_SATURATION', `VRAM alcanzó nivel crítico (${this.currentVramPct.toFixed(1)}% >= ${this.VRAM_CRITICAL_THRESHOLD_PCT}%)`);
      }
    }
  }

  /**
   * Evalúa si un nuevo estado de vista representa un cambio abrupto que requiera
   * evacuar buffers para evitar congelamiento de la GPU y fugas de memoria.
   */
  public registerViewChange(currentView: ViewStateSnapshot): boolean {
    const now = Date.now();
    const prev = this.lastViewState;
    this.lastViewState = { ...currentView, timestamp: now };

    if (!prev) {
      return false;
    }

    // 1. Detección de cambio de mapa base cartográfico
    if (prev.style && currentView.style && prev.style !== currentView.style) {
      this.executeGarbageCollection(
        'MAP_STYLE_CHANGE', 
        `Conmutación de capa base cartográfica: ${prev.style} → ${currentView.style}`
      );
      return true;
    }

    // 2. Distancia euclidiana proyectada en superficie de Málaga (WGS84 aproximado)
    const dLatKm = Math.abs(currentView.lat - prev.lat) * 111.0;
    const dLonKm = Math.abs(currentView.lon - prev.lon) * 88.0;
    const distanceKm = Math.sqrt(dLatKm * dLatKm + dLonKm * dLonKm);

    // 3. Delta de Zoom y Delta de Pitch
    const deltaZoom = Math.abs(currentView.zoom - prev.zoom);
    const deltaPitch = Math.abs(currentView.pitch - prev.pitch);

    // Si el cambio ocurre dentro de la ventana de debounce o es demasiado sutil, no disparar
    if (now - this.lastGCTime < this.VIEW_CHANGE_DEBOUNCE_MS) {
      return false;
    }

    // Evaluación de criterios deterministas de cambio abrupto
    if (distanceKm >= this.ABRUPT_PAN_DISTANCE_KM) {
      this.executeGarbageCollection(
        'VIEW_PAN_JUMP',
        `Desplazamiento espacial abrupto: Δd = ${distanceKm.toFixed(2)} km (umbral: ${this.ABRUPT_PAN_DISTANCE_KM} km)`
      );
      return true;
    }

    if (deltaZoom >= this.ABRUPT_ZOOM_DELTA) {
      this.executeGarbageCollection(
        'VIEW_ZOOM_JUMP',
        `Salto brusco de escala de zoom: Δz = ${deltaZoom.toFixed(2)} niveles (umbral: ${this.ABRUPT_ZOOM_DELTA})`
      );
      return true;
    }

    if (deltaPitch >= this.ABRUPT_PITCH_DELTA) {
      this.executeGarbageCollection(
        'VIEW_PITCH_JUMP',
        `Cambio abrupto de perspectiva 3D: Δpitch = ${deltaPitch.toFixed(1)}° (umbral: ${this.ABRUPT_PITCH_DELTA}°)`
      );
      return true;
    }

    return false;
  }

  /**
   * Ejecuta el ciclo completo de Garbage Collection forzado
   */
  public executeGarbageCollection(reason: GCTriggerReason, customDescription?: string): GCExecutionReport {
    const startTime = performance.now();
    this.isPurging = true;
    this.lastGCTime = Date.now();

    const vramBefore = this.currentVramPct;
    let estimatedFreedMb = 0;
    const workersNotified: string[] = [];
    let workersRecycled = false;
    let deckBuffersPurged = false;
    let osmCachePrunedEntries = 0;

    // FASE 1: Notificar a los WebWorkers para purga interna inmediata
    try {
      if (this.trafficWorkerRef) {
        this.trafficWorkerRef.postMessage({
          type: 'PURGE_MEMORY',
          reason,
          timestamp: Date.now()
        });
        workersNotified.push('trafficWorker');
        estimatedFreedMb += 14.5; // Estimación determinista Arrow Table + GeoJSON residual
      }
    } catch (err) {
      console.warn('[GC Manager] Error al purgar trafficWorker:', err);
    }

    try {
      if (this.physicsGeoWorkerRef) {
        this.physicsGeoWorkerRef.postMessage({
          type: 'PURGE_MEMORY',
          reason,
          timestamp: Date.now()
        });
        workersNotified.push('physicsGeoWorker');
        estimatedFreedMb += 18.2; // Estimación determinista AOD + D3 Contours + TextEncoder buffers
      }
    } catch (err) {
      console.warn('[GC Manager] Error al purgar physicsGeoWorker:', err);
    }

    // FASE 2: Reciclaje completo de Workers si la saturación es crítica (VRAM >= 88%)
    if ((reason === 'GPU_SATURATION' || vramBefore >= this.VRAM_CRITICAL_THRESHOLD_PCT) && this.trafficWorkerFactory && this.physicsGeoWorkerFactory && this.onWorkerRecycledCallback) {
      try {
        if (this.trafficWorkerRef) {
          this.trafficWorkerRef.terminate();
          const newTrafficWorker = this.trafficWorkerFactory();
          this.trafficWorkerRef = newTrafficWorker;
          this.onWorkerRecycledCallback('traffic', newTrafficWorker);
          estimatedFreedMb += 25.0; // Desalojo de memoria heap de V8
        }
        if (this.physicsGeoWorkerRef) {
          this.physicsGeoWorkerRef.terminate();
          const newPhysicsWorker = this.physicsGeoWorkerFactory();
          this.physicsGeoWorkerRef = newPhysicsWorker;
          this.onWorkerRecycledCallback('physics', newPhysicsWorker);
          estimatedFreedMb += 32.0; // Desalojo de memoria heap de V8
        }
        workersRecycled = true;
      } catch (err) {
        console.warn('[GC Manager] Error en reciclaje de workers:', err);
      }
    }

    // FASE 3: Desalojo de Buffers de Deck.GL / WebGL (Luma.gl)
    if (this.deckGlPurgeCallback) {
      try {
        const freedBytes = this.deckGlPurgeCallback(reason);
        estimatedFreedMb += (freedBytes / (1024 * 1024));
        deckBuffersPurged = true;
      } catch (err) {
        console.warn('[GC Manager] Error al desalojar buffers de Deck.GL:', err);
      }
    }

    // FASE 4: Poda de Caché Espacial OSM
    if (this.osmCachePruneCallback) {
      try {
        osmCachePrunedEntries = this.osmCachePruneCallback();
        estimatedFreedMb += osmCachePrunedEntries * 0.45; // ~450KB por bloque GeoJSON parseado
      } catch (err) {
        console.warn('[GC Manager] Error al podar caché OSM:', err);
      }
    }

    // FASE 5: Forzar Garbage Collection nativo del navegador si está habilitado (--expose-gc)
    if (typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
      } catch {
        // Ignorar si no está soportado en modo producción
      }
    }

    // Calcular VRAM resultante de forma determinista
    const vramReductionPct = Math.min(vramBefore - 15.0, (estimatedFreedMb / 512.0) * 100);
    const vramAfter = Math.max(15.0, Number((vramBefore - vramReductionPct).toFixed(1)));
    this.currentVramPct = vramAfter;

    const durationMs = Number((performance.now() - startTime).toFixed(2));

    const report: GCExecutionReport = {
      id: `gc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      epoch: Date.now(),
      reason,
      description: customDescription || `Purga de memoria disparada por ${reason}`,
      vramPctBefore: vramBefore,
      vramPctAfter: vramAfter,
      estimatedFreedMb: Number(estimatedFreedMb.toFixed(2)),
      workersNotified,
      workersRecycled,
      deckBuffersPurged,
      osmCachePrunedEntries,
      durationMs
    };

    // Registrar en histórico (máximo 25 reportes)
    this.history.unshift(report);
    if (this.history.length > 25) {
      this.history.pop();
    }

    console.info(
      `%c[Garbage Collector] ${reason} ejecutado en ${durationMs}ms | VRAM: ${vramBefore.toFixed(1)}% → ${vramAfter.toFixed(1)}% | Liberados: ~${estimatedFreedMb.toFixed(1)}MB`,
      'background: #0f172a; color: #38bdf8; font-weight: bold; border-left: 3px solid #38bdf8; padding: 2px 6px;'
    );

    // Notificar a observadores
    this.notifyListeners(report);

    // Cooldown para resetear bandera de purga
    setTimeout(() => {
      this.isPurging = false;
      this.notifyListeners(report);
    }, 450);

    return report;
  }

  /**
   * Forzado manual por el usuario o interfaz de auditoría
   */
  public forceManualGC(): GCExecutionReport {
    return this.executeGarbageCollection('MANUAL_PURGE', 'Purga manual forzada desde el panel de control o telemetría');
  }

  /**
   * Suscribe observadores para actualizaciones en tiempo real de GC
   */
  public subscribe(listener: GCListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(report: GCExecutionReport) {
    const stats = this.getStats();
    this.listeners.forEach((listener) => {
      try {
        listener(report, stats);
      } catch (err) {
        console.error('[GC Manager] Error en listener:', err);
      }
    });
  }

  /**
   * Obtiene estadísticas agregadas de uso de memoria y desalojo
   */
  public getStats(): GCMemoryStats {
    const purgesByReason: Record<GCTriggerReason, number> = {
      GPU_SATURATION: 0,
      ABRUPT_VIEW_CHANGE: 0,
      VIEW_ZOOM_JUMP: 0,
      VIEW_PAN_JUMP: 0,
      VIEW_PITCH_JUMP: 0,
      MAP_STYLE_CHANGE: 0,
      MANUAL_PURGE: 0,
      WORKER_HEALTH_REBOOT: 0
    };

    let totalFreedMb = 0;
    this.history.forEach((rep) => {
      purgesByReason[rep.reason] = (purgesByReason[rep.reason] || 0) + 1;
      totalFreedMb += rep.estimatedFreedMb;
    });

    return {
      totalPurges: this.history.length,
      totalFreedMb: Number(totalFreedMb.toFixed(1)),
      lastReport: this.history[0] || null,
      isPurging: this.isPurging,
      purgesByReason,
      vramCurrentPct: this.currentVramPct,
      vramWarningThreshold: this.VRAM_WARNING_THRESHOLD_PCT,
      vramCriticalThreshold: this.VRAM_CRITICAL_THRESHOLD_PCT
    };
  }

  public getHistory(): GCExecutionReport[] {
    return [...this.history];
  }
}

export const garbageCollector = WorkerAndGpuGarbageCollector.getInstance();
