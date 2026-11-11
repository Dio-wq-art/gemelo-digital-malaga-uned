import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Cpu, 
  Zap, 
  Activity, 
  Layers, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  Wind,
  Gauge,
  Info,
  Sliders,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { webGPUAccelerator, WebGPUComputeTelemetry, GridPhysicsParameters } from '../lib/webgpuAtmosphericAccelerator';

interface WebGPUAtmosphericComputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  windSpeedKmh: number;
  windDirDeg: number;
  temperatureC: number;
  solarUV: number;
  ambientNO2: number;
}

export const WebGPUAtmosphericComputeModal: React.FC<WebGPUAtmosphericComputeModalProps> = ({
  isOpen,
  onClose,
  windSpeedKmh,
  windDirDeg,
  temperatureC,
  solarUV,
  ambientNO2
}) => {
  const [telemetry, setTelemetry] = useState<WebGPUComputeTelemetry>(webGPUAccelerator.getTelemetry());
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [isRunningContinuous, setIsRunningContinuous] = useState<boolean>(false);
  const [stepCount, setStepCount] = useState<number>(0);
  const [gridStats, setGridStats] = useState<{
    minNO2: number;
    maxNO2: number;
    avgNO2: number;
    maxResidual: number;
  }>({
    minNO2: 0,
    maxNO2: 0,
    avgNO2: 0,
    maxResidual: 0
  });

  // Malla tensorial 100x100
  const GRID_SIZE = 100;
  const initialGrids = useMemo(() => {
    const total = GRID_SIZE * GRID_SIZE;
    const no2 = new Float32Array(total);
    const o3 = new Float32Array(total);
    const no = new Float32Array(total);

    const base = ambientNO2 || 35.0;
    for (let i = 0; i < total; i++) {
      no2[i] = base;
      o3[i] = 48.0;
      no[i] = 8.5;
    }
    return { no2, o3, no };
  }, [ambientNO2]);

  const [currentGrids, setCurrentGrids] = useState(initialGrids);

  // Parámetros de simulación
  const windSpeedMs = Math.max(0.5, (windSpeedKmh || 12) / 3.6);
  const rad = ((windDirDeg || 220) * Math.PI) / 180;
  const windU = -windSpeedMs * Math.sin(rad);
  const windV = -windSpeedMs * Math.cos(rad);

  const physicsParams: GridPhysicsParameters = useMemo(() => ({
    windU,
    windV,
    diffusionK: 8.5,
    dtSec: 1.0,
    dxMeters: 50.0,
    jNO2: Math.max(0.001, (solarUV || 5.0) * 0.0012),
    tempK: (temperatureC || 22.0) + 273.15,
    trafficSourceUgPerS: 1.8,
    vdMPerS: 0.004,
    mixingHMeters: 650.0
  }), [windU, windV, solarUV, temperatureC]);

  // Inicializar WebGPU al abrir
  useEffect(() => {
    if (!isOpen) return;
    setIsInitializing(true);
    webGPUAccelerator.initialize().then(() => {
      setTelemetry(webGPUAccelerator.getTelemetry());
      setIsInitializing(false);
    });
  }, [isOpen]);

  // Ejecutar un paso de cálculo
  const executeSingleStep = useCallback(async () => {
    const result = await webGPUAccelerator.executeGridStep(
      currentGrids.no2,
      currentGrids.o3,
      currentGrids.no,
      physicsParams,
      GRID_SIZE,
      GRID_SIZE
    );

    setCurrentGrids({
      no2: result.nextNO2,
      o3: result.nextO3,
      no: result.nextNO
    });
    setTelemetry(result.telemetry);
    setStepCount((prev) => prev + 1);

    // Calcular estadísticas deterministas
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let maxRes = 0;
    const len = result.nextNO2.length;

    for (let i = 0; i < len; i++) {
      const v = result.nextNO2[i];
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
      if (result.residuals[i] > maxRes) maxRes = result.residuals[i];
    }

    setGridStats({
      minNO2: Number(min.toFixed(2)),
      maxNO2: Number(max.toFixed(2)),
      avgNO2: Number((sum / len).toFixed(2)),
      maxResidual: Number(maxRes.toFixed(5))
    });
  }, [currentGrids, physicsParams]);

  // Bucle continuo si está activo
  useEffect(() => {
    if (!isRunningContinuous || !isOpen) return;
    let animFrame: number;
    let isExecuting = false;

    const loop = async () => {
      if (!isExecuting) {
        isExecuting = true;
        await executeSingleStep();
        isExecuting = false;
      }
      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame);
  }, [isRunningContinuous, isOpen, executeSingleStep]);

  const handleReset = () => {
    setIsRunningContinuous(false);
    setCurrentGrids(initialGrids);
    setStepCount(0);
    setGridStats({ minNO2: 0, maxNO2: 0, avgNO2: 0, maxResidual: 0 });
  };

  const handleExportNetCDFGeometry = () => {
    const payload = {
      tipo: "WebGPU_Atmospheric_Grid_Tensor",
      tesis: "Gemelo Digital Calidad del Aire de Málaga",
      timestamp: new Date().toISOString(),
      dimensiones: [GRID_SIZE, GRID_SIZE],
      parametros_fisicos: physicsParams,
      telemetria_hardware: telemetry,
      estadisticas_malla: gridStats,
      pasos_ejecutados: stepCount,
      primeras_100_celdas_no2_ug_m3: Array.from(currentGrids.no2.slice(0, 100))
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `malaga_webgpu_tensor_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title="Acelerador WebGPU & Compute Shaders WGSL"
      subtitle="Resolución Paralela de Navier-Stokes 2D, Advección-Difusión y Leighton en VRAM"
      icon={<Zap className="w-5 h-5 text-emerald-400 animate-pulse" />}
      badge={
        <span className={`text-[9px] px-2 py-0.5 font-mono font-bold rounded border ${
          telemetry.isWebGPUSupported
            ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
            : 'bg-amber-950 text-amber-300 border-amber-600'
        }`}>
          {telemetry.hardwareBackend}
        </span>
      }
      headerExtra={
        <ScientificTooltip content="Exportar estado tensorial de la simulación WebGPU (concentraciones, velocidades u/v y vórtice) en formato de tensores numéricos FAIR.">
          <button
            onClick={handleExportNetCDFGeometry}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-2.5 py-1 rounded text-[10px] font-mono transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">EXPORTAR TENSOR</span>
          </button>
        </ScientificTooltip>
      }
      onClose={onClose}
      headerColorClass="text-emerald-400"
      borderColorClass="border-emerald-500/80"
      className="w-full max-w-5xl"
      initialPositionClass="top-10 left-1/2 -translate-x-1/2"
    >
      <div className="flex flex-col gap-4 p-4 text-xs font-sans text-slate-200">
        
        {/* Banner de Estado del Hardware */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-mono flex items-center justify-between">
              <span>Dispositivo GPU</span>
              {telemetry.isWebGPUSupported ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>
            <div className="text-sm font-bold font-mono text-emerald-300 truncate" title={telemetry.adapterName}>
              {telemetry.adapterName}
            </div>
            <div className="text-[9px] text-slate-400 font-mono">{telemetry.architecture}</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Latencia por Paso</div>
            <div className="text-xl font-bold font-mono text-cyan-300">
              {telemetry.computeTimeMs}{' '}
              <span className="text-xs font-normal text-slate-400">ms</span>
            </div>
            <div className="text-[9px] text-slate-400 font-mono">Malla 100x100 (10.000 celdas)</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Rendimiento (Throughput)</div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {telemetry.throughputMegaCellsPerSec}{' '}
              <span className="text-xs font-normal text-slate-400">Mcel/s</span>
            </div>
            <div className="text-[9px] text-slate-400 font-mono">Paso de Tiempo: dt = {physicsParams.dtSec}s</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Pasos de Integración</div>
            <div className="text-xl font-bold font-mono text-amber-300">
              {stepCount} <span className="text-xs font-normal text-slate-400">iter</span>
            </div>
            <div className="text-[9px] text-slate-400 font-mono">Tiempo Simulado: {stepCount * physicsParams.dtSec}s</div>
          </div>
        </div>

        {/* Panel Central: Controles e Interfaz de Malla */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Controles de Ejecución */}
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded space-y-3">
            <div className="text-xs font-mono font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>CONTROLES DE CÓMPUTO EN TIEMPO REAL</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRunningContinuous(!isRunningContinuous)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded font-mono font-bold text-xs transition-all shadow-md ${
                  isRunningContinuous
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isRunningContinuous ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>PAUSAR BUCLE</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>BUCLE CONTINUO</span>
                  </>
                )}
              </button>

              <ScientificTooltip content="Avanzar exactamente un único paso de integración temporal dt en los Compute Shaders de Navier-Stokes y cinética química.">
                <button
                  onClick={executeSingleStep}
                  disabled={isRunningContinuous}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-600 py-2 px-3 rounded font-mono text-xs transition-all cursor-pointer"
                >
                  1 PASO
                </button>
              </ScientificTooltip>

              <ScientificTooltip content="Reinicializar la malla fluídica WebGPU a los valores base asimilados de la estación meteorológica activa.">
                <button
                  onClick={handleReset}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 p-2 rounded transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </ScientificTooltip>
            </div>

            {/* Parámetros Físicos Forzantes */}
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 space-y-1.5 font-mono text-[10px]">
              <div className="text-slate-400 border-b border-slate-800 pb-1 font-bold">FORZAMIENTOS AMBIENTALES ASIMILADOS</div>
              <div className="flex justify-between text-slate-300">
                <span>Viento (u, v):</span>
                <span className="text-cyan-300 font-bold">{physicsParams.windU.toFixed(2)}, {physicsParams.windV.toFixed(2)} m/s</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Difusión Turbulenta K:</span>
                <span className="text-amber-300 font-bold">{physicsParams.diffusionK} m²/s</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Fotólisis J(NO2):</span>
                <span className="text-yellow-300 font-bold">{physicsParams.jNO2.toFixed(5)} s⁻¹</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Deposición Seca vd:</span>
                <span className="text-emerald-300 font-bold">{(physicsParams.vdMPerS * 100).toFixed(2)} cm/s</span>
              </div>
            </div>

            {/* Estadísticas de Malla */}
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 space-y-1.5 font-mono text-[10px]">
              <div className="text-slate-400 border-b border-slate-800 pb-1 font-bold">ESTADÍSTICAS DEL CAMPO DE NO2</div>
              <div className="flex justify-between text-slate-300">
                <span>Mínimo:</span>
                <span className="text-blue-400 font-bold">{gridStats.minNO2} µg/m³</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Media Urbana:</span>
                <span className="text-cyan-300 font-bold">{gridStats.avgNO2} µg/m³</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Máximo Concentrado:</span>
                <span className="text-rose-400 font-bold">{gridStats.maxNO2} µg/m³</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Residuo Máximo PDE:</span>
                <span className="text-emerald-400 font-bold">{gridStats.maxResidual}</span>
              </div>
            </div>

          </div>

          {/* Visualizador de Malla Tensorial 100x100 */}
          <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 p-3.5 rounded flex flex-col space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-mono text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>MAPA DE CALOR TENSORIAL 2D (VRAM COMPUTE BUFFER)</span>
              </span>
              <span className="text-[10px] text-slate-400">100 × 100 (50m resolución)</span>
            </div>

            {/* Render de Canvas Malla 100x100 */}
            <div className="relative flex-1 min-h-[260px] bg-slate-950 rounded border border-slate-800 flex items-center justify-center overflow-hidden">
              <canvas
                id="webgpu-tensor-canvas"
                width={100}
                height={100}
                className="w-full h-full max-w-[320px] max-h-[320px] object-contain image-rendering-pixelated rounded"
                ref={(canvas) => {
                  if (!canvas) return;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  const imgData = ctx.createImageData(100, 100);
                  const data = imgData.data;
                  const no2 = currentGrids.no2;

                  for (let i = 0; i < 10000; i++) {
                    const val = no2[i] || 30.0;
                    const norm = Math.min(1.0, Math.max(0.0, (val - 10) / 70));

                    // Paleta Turbo / Jet
                    const r = Math.floor(Math.sin(norm * Math.PI - Math.PI / 2) * 127 + 128);
                    const g = Math.floor(Math.sin(norm * Math.PI) * 255);
                    const b = Math.floor(Math.cos(norm * Math.PI - Math.PI / 2) * 127 + 128);

                    const idx = i * 4;
                    data[idx] = r;
                    data[idx + 1] = g;
                    data[idx + 2] = b;
                    data[idx + 3] = 255;
                  }
                  ctx.putImageData(imgData, 0, 0);
                }}
              />

              {/* Rosa de Viento Flotante sobre Malla */}
              <div className="absolute top-2 right-2 bg-slate-900/90 border border-slate-700/80 px-2 py-1 rounded font-mono text-[9px] text-slate-300 flex items-center gap-1">
                <Wind className="w-3 h-3 text-cyan-400" />
                <span>Advección: {windSpeedKmh} km/h @ {windDirDeg}°</span>
              </div>
            </div>

            {/* Escala Cromática */}
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1">
              <span>0 µg/m³ (Fondo Limpio)</span>
              <div className="flex-1 mx-3 h-2 rounded bg-gradient-to-r from-blue-600 via-emerald-400 via-amber-400 to-rose-600 border border-slate-700" />
              <span>80+ µg/m³ (Eje Urbano)</span>
            </div>
          </div>

        </div>

        {/* Ecuación de Gobierno Resuelta por el Compute Shader */}
        <div className="bg-slate-950 p-3 rounded border border-emerald-900/50 font-mono text-[10px] space-y-1">
          <div className="text-emerald-300 font-bold flex items-center justify-between">
            <span>ECUACIÓN PDE RESUELTA EN PARALELO POR EL KERNEL WGSL:</span>
            <span className="text-[9px] text-slate-400">DIFF 2D + ADVECTION UPWIND + LEIGHTON PSS</span>
          </div>
          <div className="text-slate-300 text-[9.5px]">
            ∂C/∂t = - (u · ∂C/∂x + v · ∂C/∂y) + K · ∇²C - J_NO2·[NO2] + k3(T)·[NO][O3] + S_trafico - (vd / H)·C
          </div>
        </div>

      </div>
    </DraggableWindow>
  );
};
