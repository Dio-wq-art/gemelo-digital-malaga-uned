/**
 * Computation Engine & LRU Caching Layer
 * Provides deterministic hashing, memoization, trigonometric fast paths,
 * typed array memory buffer recycling (zero GC pressure),
 * and adaptive hardware monitoring for real-time physics calculations.
 * Tesis Doctoral: Gemelo Digital de Málaga.
 */

export class BoundedCache<K, V> {
  private cache = new Map<K, V>();
  private maxItems: number;

  constructor(maxItems: number = 200) {
    this.maxItems = maxItems;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key)!;
    // Refresh position for LRU semantics
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxItems) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Pool de Buffers de Arrays Tipados (Float64Array / Float32Array)
 * Evita la sobrecarga del Garbage Collector durante la resolución continua de tensores numéricos
 */
export class TypedArrayBufferPool {
  private float64Pool = new Map<number, Float64Array[]>();
  private float32Pool = new Map<number, Float32Array[]>();

  public acquireFloat64(length: number): Float64Array {
    const list = this.float64Pool.get(length);
    if (list && list.length > 0) {
      const arr = list.pop()!;
      arr.fill(0);
      return arr;
    }
    return new Float64Array(length);
  }

  public releaseFloat64(arr: Float64Array): void {
    const len = arr.length;
    let list = this.float64Pool.get(len);
    if (!list) {
      list = [];
      this.float64Pool.set(len, list);
    }
    if (list.length < 25) {
      list.push(arr);
    }
  }

  public acquireFloat32(length: number): Float32Array {
    const list = this.float32Pool.get(length);
    if (list && list.length > 0) {
      const arr = list.pop()!;
      arr.fill(0);
      return arr;
    }
    return new Float32Array(length);
  }

  public releaseFloat32(arr: Float32Array): void {
    const len = arr.length;
    let list = this.float32Pool.get(len);
    if (!list) {
      list = [];
      this.float32Pool.set(len, list);
    }
    if (list.length < 25) {
      list.push(arr);
    }
  }
}

export const tensorBufferPool = new TypedArrayBufferPool();
export const geoJsonCache = new BoundedCache<string, any>(100);
export const pinnInferenceCache = new BoundedCache<string, any>(200);
export const odeSolverCache = new BoundedCache<string, any>(200);

/**
 * Genera un hash determinista a partir de un objeto de parámetros
 */
export function hashParams(params: Record<string, any>): string {
  if (!params) return '';
  try {
    const keys = Object.keys(params).sort();
    const str = keys.map(k => `${k}:${JSON.stringify(params[k])}`).join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(36);
  } catch {
    return 'default_hash';
  }
}

/**
 * Funciones trigonométricas aceleradas en grados
 */
const DEG_TO_RAD = Math.PI / 180;

export function fastSinDeg(deg: number): number {
  return Math.sin(deg * DEG_TO_RAD);
}

export function fastCosDeg(deg: number): number {
  return Math.cos(deg * DEG_TO_RAD);
}

/**
 * Monitor de rendimiento de hardware para adaptación dinámica del renderizado
 */
class HardwareMonitor {
  private lastTime: number = performance.now();
  private frameTimes: number[] = [];
  private currentFps: number = 60;
  private isLowEndDevice: boolean = false;

  tick(): void {
    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;

    if (dt > 0 && dt < 1000) {
      this.frameTimes.push(dt);
      if (this.frameTimes.length > 30) {
        this.frameTimes.shift();
      }

      const avgDt = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      this.currentFps = 1000 / avgDt;
      this.isLowEndDevice = this.currentFps < 35;
    }
  }

  getFps(): number {
    return Math.round(this.currentFps);
  }

  shouldThrottleParticleCount(): boolean {
    return this.isLowEndDevice;
  }
}

export const hardwareMonitor = new HardwareMonitor();

/**
 * Throttle mediante requestAnimationFrame (60 FPS Lock)
 * Sincroniza eventos de cursor y actualización de mapa con la frecuencia de refresco de pantalla.
 */
export function rafThrottle<T extends (...args: any[]) => void>(fn: T): T & { cancel: () => void } {
  let rafId: number | null = null;
  let lastArgs: any[] | null = null;

  const throttled = (...args: any[]) => {
    lastArgs = args;
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      });
    }
  };

  throttled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastArgs = null;
  };

  return throttled as T & { cancel: () => void };
}
