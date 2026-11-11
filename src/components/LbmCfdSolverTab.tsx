/**
 * PESTAÑA DEL SOLVER DE MICROESCALA LATTICE BOLTZMANN (LBM D2Q9)
 * =============================================================
 * Tesis Doctoral - Dinámica de Fluidos y Transporte de Contaminantes en Cañones.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Wind, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Activity, 
  Sliders, 
  ShieldCheck, 
  Layers, 
  Zap,
  Flame,
  Maximize2
} from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { LbmUrbanCanyonSolver, LbmConfig, LbmState } from '../utils/lbmSolver';

interface LbmCfdSolverTabProps {
  canyon: {
    id: string;
    name: string;
    H: number;
    W: number;
    orientationDeg: number;
  };
  currentWindSpeedKmh: number;
}

export const LbmCfdSolverTab: React.FC<LbmCfdSolverTabProps> = ({
  canyon,
  currentWindSpeedKmh
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [displayMode, setDisplayMode] = useState<'vorticity' | 'speed' | 'pollutant' | 'streamlines'>('vorticity');
  const [uRoofInput, setURoofInput] = useState<number>(Math.max(0.04, Math.min(0.14, (currentWindSpeedKmh / 3.6) * 0.025)));
  const [tauInput, setTauInput] = useState<number>(0.60);
  const [emissionInput, setEmissionInput] = useState<number>(1.2);
  const [lbmTelemetry, setLbmTelemetry] = useState<{
    step: number;
    timeSec: number;
    reynolds: number;
    maxVel: number;
  }>({ step: 0, timeSec: 0, reynolds: 0, maxVel: 0 });

  // Instancia única determinista del Solver LBM
  const solverRef = useRef<LbmUrbanCanyonSolver | null>(null);

  // Inicialización del solver adaptado a la geometría H y W del cañón
  useEffect(() => {
    const nx = 84;
    const ny = 54;
    // Mapear la relación H/W a las celdas del retículo
    const hw = canyon.H / canyon.W;
    const canyonWidthCells = 32;
    const buildingHeightCells = Math.min(42, Math.max(16, Math.round(canyonWidthCells * hw)));
    const canyonLeftX = Math.floor((nx - canyonWidthCells) / 2);
    const canyonRightX = canyonLeftX + canyonWidthCells;

    const newSolver = new LbmUrbanCanyonSolver({
      nx,
      ny,
      canyonLeftX,
      canyonRightX,
      buildingHeightY: buildingHeightCells,
      tau: tauInput,
      uRoof: uRoofInput,
      trafficEmissionRate: emissionInput
    });

    solverRef.current = newSolver;
    setLbmTelemetry({
      step: 0,
      timeSec: 0,
      reynolds: 0,
      maxVel: 0
    });
  }, [canyon.id, canyon.H, canyon.W]);

  // Actualizar parámetros dinámicos sin reiniciar geometría
  useEffect(() => {
    if (solverRef.current) {
      solverRef.current.updateConfig({
        tau: tauInput,
        uRoof: uRoofInput,
        trafficEmissionRate: emissionInput
      });
    }
  }, [tauInput, uRoofInput, emissionInput]);

  // Bucle de simulación y renderizado en Canvas WebGL/2D
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      if (solverRef.current && canvasRef.current) {
        if (isRunning) {
          // Ejecutar 5 pasos computacionales por cuadro de renderizado para acelerar convergencia
          const state = solverRef.current.stepN(5);
          
          setLbmTelemetry({
            step: state.step,
            timeSec: state.timeSec,
            reynolds: state.reynoldsNumber,
            maxVel: state.maxVelocity
          });

          drawLbmField(canvasRef.current, state, displayMode, solverRef.current.getConfig());
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, displayMode]);

  // Función de pintado determinista sobre Canvas
  const drawLbmField = (
    canvas: HTMLCanvasElement,
    state: LbmState,
    mode: 'vorticity' | 'speed' | 'pollutant' | 'streamlines',
    config: LbmConfig
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { nx, ny } = config;
    const width = canvas.width;
    const height = canvas.height;
    const cellW = width / nx;
    const cellH = height / ny;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // Pintar celdas de fluido
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const idx = y * nx + x;
        const px = x * cellW;
        // Invertir Y para que y=0 esté en la base del cañón
        const py = height - (y + 1) * cellH;

        if (state.obstacleMask[idx] === 1) {
          // Obstáculo sólido (Edificio)
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(px, py, cellW + 0.5, cellH + 0.5);
          continue;
        }

        let r = 10, g = 15, b = 25;

        if (mode === 'vorticity') {
          // Paleta de vorticidad: azul = rotación antihoraria (ω < 0), rojo/ámbar = rotación horaria (ω > 0)
          const omega = state.vorticityMatrix[idx];
          const normOmega = Math.max(-1, Math.min(1, omega * 18.0));
          if (normOmega > 0) {
            r = Math.floor(255 * normOmega);
            g = Math.floor(120 * normOmega);
            b = 30;
          } else {
            r = 20;
            g = Math.floor(100 * -normOmega);
            b = Math.floor(240 * -normOmega);
          }
        } else if (mode === 'speed') {
          // Paleta de velocidad: Viridis / Jet
          const s = state.velocityMagnitudeMatrix[idx];
          const normSpeed = Math.min(1.0, s / Math.max(0.01, config.uRoof * 1.2));
          r = Math.floor(240 * Math.pow(normSpeed, 1.5));
          g = Math.floor(210 * normSpeed);
          b = Math.floor(255 * (1 - normSpeed));
        } else if (mode === 'pollutant') {
          // Paleta de contaminante NOx emitido: verde -> amarillo -> rojo oscuro
          const c = state.pollutantMatrix[idx];
          const normC = Math.min(1.0, c / 50.0);
          r = Math.floor(255 * Math.min(1.0, normC * 1.5));
          g = Math.floor(220 * (1.0 - normC * 0.7));
          b = Math.floor(50 * (1.0 - normC));
        } else if (mode === 'streamlines') {
          // Fondo oscuro para líneas de corriente
          const s = state.velocityMagnitudeMatrix[idx];
          const val = Math.min(255, Math.floor((s / (config.uRoof || 0.08)) * 140));
          r = val; g = val + 20; b = val + 50;
        }

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(px, py, cellW + 0.5, cellH + 0.5);
      }
    }

    // Si el modo es líneas de corriente o vectores, dibujar trazas de velocidad
    if (mode === 'streamlines') {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1;
      const step = 3;
      for (let y = 1; y < ny - 1; y += step) {
        for (let x = 1; x < nx - 1; x += step) {
          const idx = y * nx + x;
          if (state.obstacleMask[idx] === 1) continue;

          const px = (x + 0.5) * cellW;
          const py = height - (y + 0.5) * cellH;
          const vx = state.uXMatrix[idx] * cellW * 35;
          const vy = -state.uYMatrix[idx] * cellH * 35;

          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + vx, py + vy);
          ctx.stroke();
        }
      }
    }

    // Contorno de los Edificios
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    const bLeftPx = config.canyonLeftX * cellW;
    const bRightPx = config.canyonRightX * cellW;
    const bHeightPx = config.buildingHeightY * cellH;
    const roofCanvasY = height - bHeightPx;

    // Fachada izquierda
    ctx.strokeRect(0, roofCanvasY, bLeftPx, bHeightPx);
    // Fachada derecha
    ctx.strokeRect(bRightPx, roofCanvasY, width - bRightPx, bHeightPx);

    // Texto indicador de viento de cubierta
    ctx.fillStyle = '#38bdf8';
    ctx.font = '9px monospace';
    ctx.fillText(`Viento Roof U = ${(config.uRoof * 50).toFixed(1)} m/s ➔`, bLeftPx + 10, roofCanvasY - 6);

    // Etiqueta del vórtice cavitario
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Núcleo Vórtice Oke', (bLeftPx + bRightPx) / 2 - 40, height - bHeightPx / 2);
  };

  // Reiniciar simulación determinista
  const handleReset = () => {
    if (solverRef.current) {
      solverRef.current.resetField();
      setLbmTelemetry({ step: 0, timeSec: 0, reynolds: 0, maxVel: 0 });
    }
  };

  // Exportar matriz LBM a CSV
  const handleExportCsv = () => {
    if (!solverRef.current) return;
    const state = solverRef.current.stepN(0);
    const config = solverRef.current.getConfig();
    const { nx, ny } = config;

    const rows: string[] = ['i_X,j_Y,Es_Solido,Velocidad_Ux,Velocidad_Uy,Magnitud_Vel,Vorticidad_Omega,Concentracion_NOx'];

    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const idx = y * nx + x;
        rows.push([
          x,
          y,
          state.obstacleMask[idx],
          state.uXMatrix[idx].toFixed(5),
          state.uYMatrix[idx].toFixed(5),
          state.velocityMagnitudeMatrix[idx].toFixed(5),
          state.vorticityMatrix[idx].toFixed(5),
          state.pollutantMatrix[idx].toFixed(3)
        ].join(','));
      }
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lbm_canyon_cfd_${canyon.id}_step${state.step}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3.5 text-slate-200">
      {/* Barra de Control y Telemetría LBM */}
      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-sm space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-xs text-white">
              Solver Navier-Stokes a Microescala • Lattice Boltzmann D2Q9 (BGK Collision)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ScientificTooltip position="bottom" width="w-[260px]" content="Pausar o reanudar el bucle de integración temporal de las funciones de distribución D2Q9 del solver Lattice Boltzmann.">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold flex items-center gap-1 border rounded-sm transition-colors cursor-pointer ${
                  isRunning 
                    ? 'bg-amber-950/80 border-amber-600 text-amber-300 hover:bg-amber-900'
                    : 'bg-emerald-950/80 border-emerald-600 text-emerald-300 hover:bg-emerald-900'
                }`}
              >
                {isRunning ? <><Pause className="w-3 h-3" /> Pausar</> : <><Play className="w-3 h-3" /> Reanudar</>}
              </button>
            </ScientificTooltip>

            <ScientificTooltip content="Reinicializar el campo de flujo y función de distribución de velocidades D2Q9 del método Lattice Boltzmann (LBM) a las condiciones de contorno iniciales.">
              <button
                onClick={handleReset}
                className="px-2 py-1 bg-black/60 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-mono flex items-center gap-1 rounded-sm cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" /> Reiniciar
              </button>
            </ScientificTooltip>

            <ScientificTooltip content="Descarga de la matriz reticular completa (84x54 nodos) con campos de velocidad u_x, u_y, vorticidad y concentración en CSV abierto.">
              <button
                onClick={handleExportCsv}
                className="px-2 py-1 bg-black/60 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-mono flex items-center gap-1 rounded-sm"
              >
                <Download className="w-3 h-3 text-cyan-400" /> Exportar CSV
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Parámetros Dinámicos del Solver */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Velocidad en Cubierta */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Viento Cubierta (U_roof):</span>
              <span className="text-cyan-300 font-bold">{(uRoofInput * 50).toFixed(1)} m/s</span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.14"
              step="0.005"
              value={uRoofInput}
              onChange={(e) => setURoofInput(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Tiempo de Relajación Tau / Viscosidad */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Relajación BGK (τ):</span>
              <span className="text-purple-300 font-bold">{tauInput.toFixed(2)} [ν={( (tauInput - 0.5)/3 ).toFixed(3)}]</span>
            </div>
            <input
              type="range"
              min="0.52"
              max="0.85"
              step="0.01"
              value={tauInput}
              onChange={(e) => setTauInput(parseFloat(e.target.value))}
              className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Tasa de Emisión de Tráfico */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Tasa Emisión Vehicular:</span>
              <span className="text-amber-300 font-bold">{emissionInput.toFixed(1)}x COPERT 5</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={emissionInput}
              onChange={(e) => setEmissionInput(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Selector de Modo de Visualización del Campo Físico */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-black/60 border border-slate-800 rounded-sm">
        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-slate-400" /> Variable Renderizada:
        </span>
        <div className="flex flex-wrap gap-1.5">
          <ScientificTooltip position="bottom" width="w-[280px]" content="Vorticidad escalar ω = ∂v/∂x - ∂u/∂y (s⁻¹): Cuantifica la rotación del vórtice primario en el centro del cañón y vórtices secundarios en esquinas.">
            <button
              onClick={() => setDisplayMode('vorticity')}
              className={`px-2 py-0.5 text-[9.5px] font-mono rounded-sm border cursor-pointer ${
                displayMode === 'vorticity'
                  ? 'bg-blue-900 border-blue-500 text-white font-bold'
                  : 'bg-black/50 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Vorticidad (ω)
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Módulo del campo de velocidades del aire |u| = √(u_x² + u_y²) (m/s). Resuelve la atenuación del flujo desde la cubierta al fondo de acera.">
            <button
              onClick={() => setDisplayMode('speed')}
              className={`px-2 py-0.5 text-[9.5px] font-mono rounded-sm border cursor-pointer ${
                displayMode === 'speed'
                  ? 'bg-emerald-900 border-emerald-500 text-white font-bold'
                  : 'bg-black/50 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Módulo Velocidad |u|
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Campo escalar de concentración de NOx (µg/m³). Muestra la asimetría de dispersión por recirculación entre acera de sotavento y barlovento.">
            <button
              onClick={() => setDisplayMode('pollutant')}
              className={`px-2 py-0.5 text-[9.5px] font-mono rounded-sm border cursor-pointer ${
                displayMode === 'pollutant'
                  ? 'bg-amber-900 border-amber-500 text-white font-bold'
                  : 'bg-black/50 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Contaminante NOx
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[260px]" content="Líneas de corriente instantáneas tangentes al vector velocidad: visualizan el patrón circulatorio del régimen de flujo de Oke.">
            <button
              onClick={() => setDisplayMode('streamlines')}
              className={`px-2 py-0.5 text-[9.5px] font-mono rounded-sm border cursor-pointer ${
                displayMode === 'streamlines'
                  ? 'bg-cyan-900 border-cyan-500 text-white font-bold'
                  : 'bg-black/50 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Líneas de Corriente
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {/* Lienzo Canvas LBM */}
      <div className="relative border border-slate-800 bg-black rounded-sm overflow-hidden flex justify-center">
        <canvas
          ref={canvasRef}
          width={520}
          height={280}
          className="w-full h-[280px] object-contain block bg-slate-950"
        />

        {/* Telemetría Numérica Superpuesta */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 backdrop-blur-sm border border-slate-800 text-[9px] font-mono space-y-0.5 pointer-events-none">
          <div>Paso: <strong className="text-white">{lbmTelemetry.step}</strong> ({lbmTelemetry.timeSec.toFixed(1)}s sim)</div>
          <div>Reynolds Cañón: <strong className="text-cyan-400">{lbmTelemetry.reynolds}</strong></div>
          <div>Velocidad Máx: <strong className="text-emerald-400">{(lbmTelemetry.maxVel * 50).toFixed(2)} m/s</strong></div>
          <div className="text-slate-400 text-[8px]">Malla: 84x54 celdas D2Q9</div>
        </div>

        {/* Leyenda de la Variable */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-sm border border-slate-800 text-[8.5px] font-mono text-slate-300 pointer-events-none">
          {displayMode === 'vorticity' && <span>Rojo = Giro Horario | Azul = Giro Antihorario</span>}
          {displayMode === 'speed' && <span>Amarillo/Blanco = Alta Vel | Azul = Estancamiento</span>}
          {displayMode === 'pollutant' && <span>Rojo = NOx Atrapado en Sotavento | Verde = Disperso</span>}
          {displayMode === 'streamlines' && <span>Vectores de velocidad local u(x,y)</span>}
        </div>
      </div>

      {/* Tarjetas Metodológicas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[9.5px]">
        <div className="p-2 bg-slate-900/70 border border-slate-800 rounded-sm">
          <div className="text-slate-400 font-mono text-[8.5px]">CONDICIÓN DE CONTORNO</div>
          <div className="font-bold text-slate-200 mt-0.5">Rebote No-Deslizante (Bounce-Back)</div>
          <div className="text-slate-400 mt-0.5 text-[8.5px]">u = 0 en paredes y calzada de edificios.</div>
        </div>

        <div className="p-2 bg-slate-900/70 border border-slate-800 rounded-sm">
          <div className="text-slate-400 font-mono text-[8.5px]">FLUJO RASANTE (ROOF-TOP)</div>
          <div className="font-bold text-slate-200 mt-0.5">Condición Zou-He Suprayacente</div>
          <div className="text-slate-400 mt-0.5 text-[8.5px]">Cizalladura impuesta sobre la cubierta del cañón.</div>
        </div>

        <div className="p-2 bg-slate-900/70 border border-slate-800 rounded-sm">
          <div className="text-slate-400 font-mono text-[8.5px]">RESOLUCIÓN NAVIER-STOKES</div>
          <div className="font-bold text-slate-200 mt-0.5">Simulación Directa (DNS) 2D</div>
          <div className="text-slate-400 mt-0.5 text-[8.5px]">Ecuación cinética BGK acoplada a transporte.</div>
        </div>
      </div>
    </div>
  );
};
