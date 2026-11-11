import React, { useState, useMemo, useCallback } from 'react';
import { ScientificTooltip } from './ScientificTooltip';
import {
  AerosolAttenuationConfig,
  computeSpectralRadiationAndPhotolysis,
  SPECTRAL_AEROSOL_PRESETS,
  SpectralSimulationOutput
} from '../lib/spectralRadiativeModel';
import {
  Sun,
  Zap,
  Sliders,
  Maximize2,
  Layers,
  Sparkles,
  Flame,
  Activity,
  Waves,
  RefreshCw
} from 'lucide-react';

export interface PINNPhysicalParametersControlProps {
  currentAOD?: number;
  currentShortwaveRadiation?: number;
  currentHumidity?: number;
  currentTemp?: number;
  onOpenFullModal?: () => void;
  onAerosolFactorChange?: (config: AerosolAttenuationConfig) => void;
}

const PINNPhysicalParametersControlBase: React.FC<PINNPhysicalParametersControlProps> = ({
  currentAOD = 0.25,
  currentShortwaveRadiation = 550,
  currentHumidity = 62,
  currentTemp = 24.5,
  onOpenFullModal,
  onAerosolFactorChange
}) => {
  // Centralized memoized calculation callback for hygroscopic factor
  const computeInitialFRh = useCallback((rh: number) => {
    const rh_norm = Math.min(0.98, Math.max(0.05, rh / 100));
    return Number(Math.min(3.5, 1.0 + 0.85 * Math.pow(rh_norm / (1.0 - rh_norm + 0.05), 0.65)).toFixed(2));
  }, []);

  const initialFRh = useMemo(() => computeInitialFRh(currentHumidity), [computeInitialFRh, currentHumidity]);

  const [aod550, setAod550] = useState<number>(currentAOD || 0.25);
  const [angstromAlpha, setAngstromAlpha] = useState<number>(1.35);
  const [singleScatteringAlbedo, setSingleScatteringAlbedo] = useState<number>(0.92);
  const [hygroscopicFactor, setHygroscopicFactor] = useState<number>(initialFRh);
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');

  // Centralized memoized physics computation callback for radiative-photolytic transfer
  const computeSpectralPhysics = useCallback((config: AerosolAttenuationConfig) => {
    return computeSpectralRadiationAndPhotolysis(config);
  }, []);

  // Configuración actual determinista
  const currentConfig: AerosolAttenuationConfig = useMemo(() => {
    return {
      aod550,
      angstromAlpha,
      singleScatteringAlbedo,
      asymmetryFactor: 0.68,
      hygroscopicFactor,
      surfaceAlbedo: 0.16,
      solarZenithAngleDeg: 35,
      temperatureC: currentTemp || 24.5,
      pressureHpa: 1013.25,
      totalOzoneDobson: 315
    };
  }, [aod550, angstromAlpha, singleScatteringAlbedo, hygroscopicFactor, currentTemp]);

  // Simulación espectral determinista usando el callback centralizado
  const simulation: SpectralSimulationOutput = useMemo(() => {
    const res = computeSpectralPhysics(currentConfig);
    if (onAerosolFactorChange) {
      onAerosolFactorChange(currentConfig);
    }
    return res;
  }, [currentConfig, computeSpectralPhysics, onAerosolFactorChange]);

  const handleSelectPreset = useCallback((key: string) => {
    setSelectedPreset(key);
    const p = SPECTRAL_AEROSOL_PRESETS[key];
    if (p && p.config) {
      if (p.config.aod550 !== undefined) setAod550(p.config.aod550);
      if (p.config.angstromAlpha !== undefined) setAngstromAlpha(p.config.angstromAlpha);
      if (p.config.singleScatteringAlbedo !== undefined) setSingleScatteringAlbedo(p.config.singleScatteringAlbedo);
      if (p.config.hygroscopicFactor !== undefined) setHygroscopicFactor(p.config.hygroscopicFactor);
    }
  }, []);

  const handleReset = useCallback(() => {
    setSelectedPreset('custom');
    setAod550(currentAOD || 0.25);
    setAngstromAlpha(1.35);
    setSingleScatteringAlbedo(0.92);
    setHygroscopicFactor(initialFRh);
  }, [currentAOD, initialFRh]);

  // Centralized memoized curve generator callback for spectral SVG plotting
  const computeSpectralCurves = useCallback((spectrum: SpectralSimulationOutput['spectrum']) => {
    const miniPoints = spectrum.filter(p => p.wavelengthNm >= 290 && p.wavelengthNm <= 450);
    const maxMiniJ = Math.max(...miniPoints.map(p => p.spectralPhotolysisRateS1Nm), 1e-4);
    const maxMiniSolar = Math.max(...miniPoints.map(p => p.solarToaWm2Nm), 1.8);

    const svgWidth = 240;
    const svgHeight = 65;
    const padX = 15;
    const padY = 8;
    const innerW = svgWidth - padX * 2;
    const innerH = svgHeight - padY * 2;

    const pathMiniJ = miniPoints.map((p, idx) => {
      const x = padX + ((p.wavelengthNm - 290) / (450 - 290)) * innerW;
      const y = padY + innerH - (p.spectralPhotolysisRateS1Nm / maxMiniJ) * innerH;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');

    const pathMiniSolar = miniPoints.map((p, idx) => {
      const x = padX + ((p.wavelengthNm - 290) / (450 - 290)) * innerW;
      const y = padY + innerH - (p.globalIrradianceWm2Nm / maxMiniSolar) * innerH;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');

    const areaMiniJ = `${pathMiniJ} L ${padX + innerW} ${padY + innerH} L ${padX} ${padY + innerH} Z`;

    return { pathMiniJ, pathMiniSolar, areaMiniJ, svgWidth, svgHeight, padX, padY, innerW, innerH };
  }, []);

  const { pathMiniJ, pathMiniSolar, areaMiniJ, svgWidth, svgHeight, padX, padY, innerW, innerH } = useMemo(
    () => computeSpectralCurves(simulation.spectrum),
    [computeSpectralCurves, simulation.spectrum]
  );

  return (
    <div className="bg-slate-950/70 border border-amber-900/40 p-2.5 space-y-2 font-mono text-[9px]">
      {/* Encabezado con Tooltip Científico y Botón de Expansión */}
      <div className="flex items-center justify-between border-b border-amber-900/40 pb-1.5">
        <ScientificTooltip
          width="w-[420px]"
          position="left"
          content={
            <div className="space-y-1.5 font-mono text-[9px] leading-relaxed text-slate-200">
              <div className="text-amber-300 font-bold border-b border-amber-700/80 pb-1 flex items-center justify-between">
                <span>Comparador Espectral &amp; Atenuación por Aerosoles</span>
                <span className="text-[7.5px] bg-amber-950 text-amber-300 border border-amber-700 px-1 py-0.5 rounded font-bold">
                  ASTM E490 / IUPAC
                </span>
              </div>
              <p className="text-slate-300 text-[8.5px]">
                Evalúa la extinción espectral de la radiación solar en la ventana actínica del UV-A/B (290-420 nm) según la ley de Beer-Lambert acoplada:
              </p>
              <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800 text-[8px] text-amber-200 text-center font-bold">
                J_NO2 = ∫ [ σ_NO2(λ,T) · φ_NO2(λ,T) · F(λ, AOD, α, ω₀, f(RH)) ] dλ
              </div>
              <p className="text-[8px] text-slate-400">
                Permite ajustar en tiempo real el espesor óptico de aerosoles (AOD), el exponente de Ångström (α) y la dispersión simple (ω₀) para analizar la respuesta fotoquímica del ciclo de Leighton y la formación de O₃ en Málaga.
              </p>
            </div>
          }
        >
          <div className="flex items-center gap-1.5 text-amber-300 font-bold uppercase tracking-wider cursor-help">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Comparador Espectral &amp; Atenuación Aerosol</span>
          </div>
        </ScientificTooltip>

        <div className="flex items-center gap-1">
          <ScientificTooltip content="Restablecer espesor óptico de aerosoles (AOD) y coeficientes de Ångström a valores atmosféricos certificados.">
            <button
              onClick={handleReset}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-2.5 h-2.5" />
            </button>
          </ScientificTooltip>
          {onOpenFullModal && (
            <ScientificTooltip content="Abrir comparador espectral avanzado multi-longitud de onda y atenuación de radiación actínica solar en ventana modal.">
              <button
                onClick={onOpenFullModal}
                className="px-1.5 py-0.5 bg-amber-950/80 border border-amber-500/80 text-amber-300 hover:bg-amber-900 flex items-center gap-1 text-[8px] font-bold transition-all shadow-[0_0_6px_rgba(245,158,11,0.3)] cursor-pointer"
              >
                <Maximize2 className="w-2.5 h-2.5" />
                <span>EXPANDIR ↗</span>
              </button>
            </ScientificTooltip>
          )}
        </div>
      </div>

      {/* Mini Visualizador Espectral (Radiación Incidente vs Fotólisis Calculada) */}
      <div className="bg-slate-900/90 border border-slate-800 p-2 flex items-center justify-between gap-2">
        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-center text-[8px]">
            <span className="text-sky-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full inline-block"></span> E(λ) Irradiancia
            </span>
            <span className="text-rose-300 flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full inline-block"></span> dJ_NO₂/dλ Fotólisis
            </span>
          </div>

          {/* SVG Mini Gráfico */}
          <div className="relative bg-black/50 border border-slate-800/80 rounded-none overflow-hidden h-[65px]">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
              <defs>
                <linearGradient id="miniJGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Guía vertical en 390 nm (Pico de fotólisis) */}
              <line
                x1={padX + ((390 - 290) / (450 - 290)) * innerW}
                y1={padY}
                x2={padX + ((390 - 290) / (450 - 290)) * innerW}
                y2={padY + innerH}
                stroke="#f43f5e"
                strokeWidth={1}
                strokeDasharray="2 2"
                strokeOpacity={0.6}
              />

              {/* Curva Irradiancia en Suelo */}
              <path d={pathMiniSolar} fill="none" stroke="#38bdf8" strokeWidth={1.5} strokeOpacity={0.85} />

              {/* Curva Tasa Fotólisis dJ_NO2 */}
              <path d={areaMiniJ} fill="url(#miniJGrad)" />
              <path d={pathMiniJ} fill="none" stroke="#f43f5e" strokeWidth={2} className="filter drop-shadow-[0_0_4px_rgba(244,63,94,0.7)]" />

              {/* Etiquetas de rango */}
              <text x={padX} y={svgHeight - 2} fill="#64748b" fontSize="6.5" fontFamily="monospace">290 nm (UV-B)</text>
              <text x={padX + ((390 - 290) / (450 - 290)) * innerW} y={8} textAnchor="middle" fill="#f43f5e" fontSize="6.5" fontWeight="bold" fontFamily="monospace">λ_max 390nm</text>
              <text x={svgWidth - padX} y={svgHeight - 2} textAnchor="end" fill="#64748b" fontSize="6.5" fontFamily="monospace">450 nm</text>
            </svg>
          </div>
        </div>

        {/* Métricas clave calculadas */}
        <div className="w-28 bg-black/60 border border-slate-800 p-1.5 space-y-1 shrink-0 text-[8px]">
          <div>
            <span className="text-slate-400 block text-[7px] uppercase">J_NO2 Calculado:</span>
            <span className="text-rose-400 font-bold text-xs">{simulation.summary.jNO2_s1.toFixed(5)} <span className="text-[7px] text-slate-400">s⁻¹</span></span>
          </div>
          <div>
            <span className="text-slate-400 block text-[7px] uppercase">Tiempo Vida τ:</span>
            <span className="text-indigo-300 font-bold">{simulation.summary.characteristicLifetimeS} s</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[7px] uppercase">Atenuación:</span>
            <span className="text-amber-300 font-bold">-{simulation.summary.aerosolExtinctionFractionPct}%</span>
          </div>
        </div>
      </div>

      {/* Presets Rápidos de Aerosol */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
        <span className="text-[7.5px] text-slate-500 font-bold shrink-0">PRESETS:</span>
        {[
          { key: 'clean_mediterranean', label: 'Limpio', color: 'border-cyan-700 text-cyan-300' },
          { key: 'saharan_calima', label: 'Calima', color: 'border-amber-700 text-amber-300' },
          { key: 'urban_traffic_smog', label: 'Tráfico PM2.5', color: 'border-rose-700 text-rose-300' },
          { key: 'marine_sea_breeze', label: 'Brisa Salina', color: 'border-emerald-700 text-emerald-300' }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => handleSelectPreset(item.key)}
            className={`px-1.5 py-0.5 text-[7.5px] border whitespace-nowrap transition-colors ${
              selectedPreset === item.key
                ? 'bg-slate-800 border-amber-400 text-amber-200 font-bold'
                : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Sliders Interactivos de Factores de Atenuación */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
        {/* Slider 1: AOD (τ₅₅₀) */}
        <ScientificTooltip
          position="top"
          width="w-[280px]"
          content="Espesor óptico de aerosoles (AOD a 550nm). Atenúa exponencialmente la radiación directa I = I₀ · exp(-m·τ) según la ley de Beer-Lambert."
        >
          <div className="bg-black/40 p-1.5 border border-slate-800 space-y-0.5">
            <div className="flex justify-between text-amber-300 font-bold text-[8px]">
              <span>AOD (τ₅₅₀):</span>
              <span className="text-white">{aod550.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.02"
              max="1.80"
              step="0.02"
              value={aod550}
              onChange={(e) => {
                setSelectedPreset('custom');
                setAod550(parseFloat(e.target.value));
              }}
              className="w-full accent-amber-400 cursor-pointer h-1 bg-slate-800 rounded"
            />
          </div>
        </ScientificTooltip>

        {/* Slider 2: Ångström Alpha */}
        <ScientificTooltip
          position="top"
          width="w-[280px]"
          content="Exponente de Ångström α (distribución de tamaño). Valores bajos (α ≈ 0.25) corresponden a polvo sahariano grueso; valores altos (α ≈ 1.7) a hollín urbano de combustión diésel."
        >
          <div className="bg-black/40 p-1.5 border border-slate-800 space-y-0.5">
            <div className="flex justify-between text-sky-300 font-bold text-[8px]">
              <span>Ångström (α):</span>
              <span className="text-white">{angstromAlpha.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="2.20"
              step="0.05"
              value={angstromAlpha}
              onChange={(e) => {
                setSelectedPreset('custom');
                setAngstromAlpha(parseFloat(e.target.value));
              }}
              className="w-full accent-sky-400 cursor-pointer h-1 bg-slate-800 rounded"
            />
          </div>
        </ScientificTooltip>

        {/* Slider 3: Albedo Dispersión Simple ω₀ */}
        <ScientificTooltip
          position="top"
          width="w-[280px]"
          content="Albedo de dispersión simple ω₀. Modula la absorción de carbono negro (ω₀ ≈ 0.80) frente a aerosoles dispersores como sulfatos y sales marinas (ω₀ ≈ 0.98)."
        >
          <div className="bg-black/40 p-1.5 border border-slate-800 space-y-0.5">
            <div className="flex justify-between text-emerald-300 font-bold text-[8px]">
              <span>Dispersión (ω₀):</span>
              <span className="text-white">{singleScatteringAlbedo.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.70"
              max="0.99"
              step="0.01"
              value={singleScatteringAlbedo}
              onChange={(e) => {
                setSelectedPreset('custom');
                setSingleScatteringAlbedo(parseFloat(e.target.value));
              }}
              className="w-full accent-emerald-400 cursor-pointer h-1 bg-slate-800 rounded"
            />
          </div>
        </ScientificTooltip>

        {/* Slider 4: Crecimiento Higroscópico f(RH) */}
        <ScientificTooltip
          position="top"
          width="w-[280px]"
          content="Factor de crecimiento higroscópico f(RH) por humedad de la Bahía de Málaga. Multiplica el AOD efectivo debido a la hidratación acuosa de aerosoles marinos."
        >
          <div className="bg-black/40 p-1.5 border border-slate-800 space-y-0.5">
            <div className="flex justify-between text-indigo-300 font-bold text-[8px]">
              <span>Higroscópico f(RH):</span>
              <span className="text-white">{hygroscopicFactor.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="1.00"
              max="3.00"
              step="0.05"
              value={hygroscopicFactor}
              onChange={(e) => {
                setSelectedPreset('custom');
                setHygroscopicFactor(parseFloat(e.target.value));
              }}
              className="w-full accent-indigo-400 cursor-pointer h-1 bg-slate-800 rounded"
            />
          </div>
        </ScientificTooltip>
      </div>
    </div>
  );
};

export const PINNPhysicalParametersControl = React.memo<PINNPhysicalParametersControlProps>(
  PINNPhysicalParametersControlBase,
  (prev, next) => {
    // Prevent re-rendering this physics calculation panel when map bearing, pitch or camera moves!
    return (
      prev.currentAOD === next.currentAOD &&
      prev.currentShortwaveRadiation === next.currentShortwaveRadiation &&
      prev.currentHumidity === next.currentHumidity &&
      prev.currentTemp === next.currentTemp
    );
  }
);
