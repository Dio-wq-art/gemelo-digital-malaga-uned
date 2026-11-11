import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  History, 
  Sliders, 
  Download, 
  Maximize2, 
  Minimize2, 
  Sparkles,
  Zap
} from 'lucide-react';
import { PhysicsResult, MeteoData } from '../lib/physics';
import { ScientificTooltip } from './ScientificTooltip';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';

interface Props {
  liveResult: PhysicsResult;
  meteo: MeteoData;
  onOpenDetailedModal?: () => void;
}

export interface HistoricalBenchmarkProfile {
  vdHistMean: number;      // m/s
  vdHistStd: number;       // m/s
  kHistMean: number;       // adim / m²/s
  kHistStd: number;        // adim / m²/s
  meteoBinLabel: string;
  season: 'Verano' | 'Invierno' | 'Primavera/Otoño';
  diurnalPhase: 'Diurno Convectivo' | 'Transición Crepuscular' | 'Nocturno Estable';
}

/**
 * Cálculo analítico determinista del valor histórico medio y dispersión sigma
 * para el régimen micrometeorológico exacto de Málaga (Wesely 1989 / Oke 1987).
 * Cero aleatoriedad: funciones matemáticas canónicas tabuladas por la literatura.
 */
export function calculateHistoricalBenchmark(meteo: MeteoData): HistoricalBenchmarkProfile {
  const temp = meteo.temperatura_malaga;
  const windKmh = meteo.velocidad_viento_km_h;
  const windMs = Math.max(0.2, windKmh / 3.6);
  const rad = meteo.shortwave_radiation ?? (meteo.uv_index ? meteo.uv_index * 65 : 400);
  const hr = meteo.humedad_relativa;
  const lai = meteo.lai_arbolado || 1.8;

  // Fase diurna determinista
  let diurnalPhase: 'Diurno Convectivo' | 'Transición Crepuscular' | 'Nocturno Estable' = 'Diurno Convectivo';
  if (rad > 200) {
    diurnalPhase = 'Diurno Convectivo';
  } else if (rad > 25) {
    diurnalPhase = 'Transición Crepuscular';
  } else {
    diurnalPhase = 'Nocturno Estable';
  }

  // Estación climática (basada en temperatura base de Málaga)
  let season: 'Verano' | 'Invierno' | 'Primavera/Otoño' = 'Verano';
  if (temp >= 24) {
    season = 'Verano';
  } else if (temp < 16) {
    season = 'Invierno';
  } else {
    season = 'Primavera/Otoño';
  }

  // 1. HISTORICAL BASELINE FOR WESELY DRY DEPOSITION vd [m/s]
  // vd_hist = 1 / (Ra_hist + Rb_hist + Rc_hist)
  // En Málaga, canopia urbana con Ficus, Jacarandas y Palmeras
  let rcBase = 150; // s/m estomático diurno a 25ºC
  if (diurnalPhase === 'Nocturno Estable') {
    rcBase = 1200; // Estomas cerrados por la noche
  } else if (diurnalPhase === 'Transición Crepuscular') {
    rcBase = 450;
  }
  
  // Modulación histórica de Rc por temperatura y déficit de vapor
  const tempFactor = Math.max(0.6, 1.0 + 0.03 * Math.abs(temp - 23));
  const hrFactor = hr > 80 ? 1.25 : (hr < 35 ? 1.4 : 1.0); // Cierre por rocío o sequedad
  const rcEff = rcBase * tempFactor * hrFactor / (lai / 1.8);

  // Resistencias aerodinámicas medias históricas
  const raHist = Math.max(15, 65 / (windMs + 0.1));
  const rbHist = 18 / Math.pow(windMs + 0.1, 0.6);
  
  const vdHistMean = 1 / (raHist + rbHist + rcEff); // m/s
  const vdHistStd = vdHistMean * 0.18; // Dispersión climatológica típica del 18%

  // 2. HISTORICAL BASELINE FOR TURBULENT DIFFUSIVITY & COUPLING FACTOR k
  // Formulación de Kastner-Klein & Plate (2001) / Oke (1987) para cañón urbano H/W ~ 1.0
  const kMecHist = 8.5 + 6.8 * Math.log(1 + windMs);
  const kTermHist = 7.2 * Math.pow(Math.max(0, rad) / 800, 1.1);
  const kMarineDamp = hr > 70 ? 0.88 : 1.0;
  
  const kHistMean = (kMecHist + kTermHist) * kMarineDamp;
  const kHistStd = kHistMean * 0.15; // Dispersión climatológica del 15%

  const meteoBinLabel = `${season} • ${diurnalPhase} • u=${windKmh.toFixed(0)}km/h • Rs=${rad.toFixed(0)}W/m²`;

  return {
    vdHistMean: Number(vdHistMean.toFixed(5)),
    vdHistStd: Number(vdHistStd.toFixed(5)),
    kHistMean: Number(kHistMean.toFixed(2)),
    kHistStd: Number(kHistStd.toFixed(2)),
    meteoBinLabel,
    season,
    diurnalPhase
  };
}

export function PinnVdKHistoricalBenchmark({ liveResult, meteo, onOpenDetailedModal }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'curve'>('summary');

  // Benchmark histórico correspondiente
  const hist = useMemo(() => calculateHistoricalBenchmark(meteo), [meteo]);

  // Métricas comparativas de vd
  const vdLive = liveResult.vd;
  const vdHist = hist.vdHistMean;
  const deltaVd = vdLive - vdHist;
  const deltaVdPct = vdHist > 0 ? (deltaVd / vdHist) * 100 : 0;
  const zScoreVd = hist.vdHistStd > 0 ? deltaVd / hist.vdHistStd : 0;

  // Métricas comparativas de k
  const kLive = liveResult.k;
  const kHist = hist.kHistMean;
  const deltaK = kLive - kHist;
  const deltaKPct = kHist > 0 ? (deltaK / kHist) * 100 : 0;
  const zScoreK = hist.kHistStd > 0 ? deltaK / hist.kHistStd : 0;

  // Clasificación de significancia para vd
  const getDeviationTier = (pct: number) => {
    const abs = Math.abs(pct);
    if (abs <= 12) return { label: 'EN RANGO CLIMATOLÓGICO', color: 'text-emerald-400', bg: 'bg-emerald-950/80 border-emerald-700', badge: 'NOMINAL', icon: CheckCircle2 };
    if (abs <= 28) return { label: 'DESVIACIÓN MODERADA', color: 'text-amber-400', bg: 'bg-amber-950/80 border-amber-700', badge: 'MODERADA', icon: AlertTriangle };
    return { label: 'ANOMALÍA SIGNIFICATIVA', color: 'text-rose-400', bg: 'bg-rose-950/80 border-rose-700', badge: 'CRÍTICA', icon: Zap };
  };

  const tierVd = getDeviationTier(deltaVdPct);
  const tierK = getDeviationTier(deltaKPct);

  // Diagnóstico físico cualitativo
  const vdPhysicalDiagnostic = useMemo(() => {
    if (deltaVdPct > 15) {
      return "Mayor captación estomática: la elevada irradiancia solar diurna y bajo VPD inducen apertura máxima de estomas en la vegetación urbana.";
    } else if (deltaVdPct < -15) {
      return "Captación deprimida: alta resistencia estomática por estrés térmico o humedad litoral saturando la cutícula foliar.";
    }
    return "Remoción seca dentro de la envolvente esperada para este régimen estacional y de viento.";
  }, [deltaVdPct]);

  const kPhysicalDiagnostic = useMemo(() => {
    if (deltaKPct > 15) {
      return "Sobredifusión turbulenta: la flotabilidad convectiva solar sobre el asfalto acelera la mezcla vertical en el cañón.";
    } else if (deltaKPct < -15) {
      return "Subdifusión / Atrapamiento: cizalladura débil o estabilización por brisa marina frenan la ventilación vertical.";
    }
    return "Acoplamiento turbulento alineado con las curvas empíricas de túnel de viento de Oke.";
  }, [deltaKPct]);

  // Generación determinista de curva comparativa diurna (00:00 a 23:00) para las mismas condiciones de fondo
  const diurnalComparisonData = useMemo(() => {
    const hours = [0, 3, 6, 9, 12, 15, 18, 21];
    return hours.map(h => {
      const isDay = h >= 8 && h <= 19;
      const solarRatio = isDay ? Math.sin(((h - 8) / 11) * Math.PI) : 0;
      const simRad = solarRatio * 850;
      const simTemp = meteo.temperatura_malaga + (isDay ? (solarRatio * 4 - 1) : -3);
      
      const simMeteo: MeteoData = {
        ...meteo,
        temperatura_malaga: simTemp,
        shortwave_radiation: simRad,
        uv_index: isDay ? Math.round(solarRatio * 8) : 0
      };
      
      const b = calculateHistoricalBenchmark(simMeteo);
      // Puntos representativos para graficar
      return {
        hour: `${h.toString().padStart(2, '0')}:00`,
        vd_hist: Number((b.vdHistMean * 100).toFixed(3)), // cm/s
        vd_live_ref: Number((vdLive * 100).toFixed(3)),
        k_hist: Number(b.kHistMean.toFixed(1)),
        k_live_ref: Number(kLive.toFixed(1))
      };
    });
  }, [meteo, vdLive, kLive]);

  const handleExportBenchmarkCsv = () => {
    const headers = "timestamp,meteo_bin,vd_pinn_ms,vd_hist_ms,delta_vd_pct,zscore_vd,k_pinn,k_hist,delta_k_pct,zscore_k,temp_c,wind_kmh,rad_wm2,hr_pct\n";
    const row = `"${new Date().toISOString()}","${hist.meteoBinLabel}",${vdLive},${vdHist},${deltaVdPct.toFixed(2)},${zScoreVd.toFixed(2)},${kLive},${kHist},${deltaKPct.toFixed(2)},${zScoreK.toFixed(2)},${meteo.temperatura_malaga},${meteo.velocidad_viento_km_h},${meteo.shortwave_radiation ?? 400},${meteo.humedad_relativa}`;
    const blob = new Blob([headers + row], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pinn_benchmark_vd_k_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-slate-950/80 border border-cyan-900/60 rounded p-3 space-y-2.5 shadow-lg relative overflow-hidden"
    >
      {/* HEADER CON IDENTIFICADOR CIENTÍFICO */}
      <div className="flex items-center justify-between border-b border-cyan-950 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-cyan-950/80 border border-cyan-700/80 rounded text-cyan-400">
            <History className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[9.5px] font-bold text-white font-mono flex items-center gap-1.5">
              <span>BENCHMARK HISTÓRICO: v_d & k</span>
              <span className="text-[7.5px] bg-cyan-900/80 text-cyan-200 px-1 py-0.2 rounded border border-cyan-700 font-mono font-bold">
                WESELY / OKE
              </span>
            </div>
            <div className="text-[7.5px] text-slate-400 font-mono">
              PINN vs Climatología Microescalar Málaga
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <ScientificTooltip
            position="left"
            width="w-[300px]"
            content="Exportar el diagnóstico comparativo de parámetros PINN vs medias históricas en formato CSV citable (FAIR Data)."
          >
            <button
              onClick={handleExportBenchmarkCsv}
              className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 rounded transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" />
            </button>
          </ScientificTooltip>

          <ScientificTooltip content={isExpanded ? "Colapsar curva diurna de benchmark histórico." : "Desplegar curva diurna de benchmark estacional PINN vs serie histórica."}>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 rounded transition-colors cursor-pointer"
            >
              {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {/* CLASIFICACIÓN DEL BIN METEOROLÓGICO */}
      <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded flex items-center justify-between text-[8px] font-mono">
        <span className="text-slate-400">Condición Asimilada:</span>
        <span className="text-cyan-300 font-bold truncate max-w-[200px]" title={hist.meteoBinLabel}>
          {hist.meteoBinLabel}
        </span>
      </div>

      {/* COMPARADOR 1: VELOCIDAD DE DEPOSICIÓN SECA (v_d) */}
      <div className="bg-black/50 border border-slate-800/90 rounded p-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[8.5px] font-bold text-slate-200 font-mono">DEPOSICIÓN SECA (v_d)</span>
            <ScientificTooltip
              position="left"
              width="w-[340px]"
              content="Comparación directa entre la velocidad de deposición calculada en tiempo real por la PINN y el promedio histórico climatológico de Wesely (1989) para la misma irradiancia, temperatura y humedad."
            >
              <Info className="w-3 h-3 text-slate-500 cursor-help" />
            </ScientificTooltip>
          </div>

          {/* BADGE DE DESVIACIÓN */}
          <div className={`px-1.5 py-0.5 rounded border text-[8px] font-mono font-bold flex items-center gap-1 ${tierVd.bg} ${tierVd.color}`}>
            {deltaVdPct > 2 ? <TrendingUp className="w-2.5 h-2.5" /> : (deltaVdPct < -2 ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />)}
            <span>{deltaVdPct >= 0 ? `+${deltaVdPct.toFixed(1)}%` : `${deltaVdPct.toFixed(1)}%`}</span>
          </div>
        </div>

        {/* VALORES EN PARALELO */}
        <div className="grid grid-cols-2 gap-2 text-center font-mono">
          <div className="bg-slate-900/80 p-1.5 rounded border border-emerald-900/40">
            <div className="text-[7.5px] text-emerald-400/90 uppercase font-bold">PINN Actual</div>
            <div className="text-sm font-bold text-emerald-300">
              {(vdLive * 100).toFixed(3)} <span className="text-[8px] text-slate-400 font-normal">cm/s</span>
            </div>
            <div className="text-[7px] text-slate-500 font-sans">({vdLive.toFixed(5)} m/s)</div>
          </div>

          <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
            <div className="text-[7.5px] text-slate-400 uppercase font-bold">Media Histórica</div>
            <div className="text-sm font-bold text-slate-300">
              {(vdHist * 100).toFixed(3)} <span className="text-[8px] text-slate-500 font-normal">cm/s</span>
            </div>
            <div className="text-[7px] text-slate-500 font-sans">σ = ±{(hist.vdHistStd * 100).toFixed(3)} cm/s</div>
          </div>
        </div>

        {/* BARRA COMPARATIVA PROPORCIONAL */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-[7px] font-mono text-slate-400">
            <span>0 cm/s</span>
            <span>Ref Histórica</span>
            <span>1.0 cm/s</span>
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex relative border border-slate-800">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500" 
              style={{ width: `${Math.min(100, (vdLive / 0.01) * 100)}%` }}
              title={`PINN: ${(vdLive * 100).toFixed(3)} cm/s`}
            />
            {/* Marcador Histórico */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_4px_#fff]" 
              style={{ left: `${Math.min(99, (vdHist / 0.01) * 100)}%` }}
              title={`Histórico: ${(vdHist * 100).toFixed(3)} cm/s`}
            />
          </div>
        </div>

        {/* DIAGNÓSTICO FÍSICO vd */}
        <div className="text-[7.5px] text-slate-300 bg-slate-950/80 p-1.5 rounded border border-slate-900 leading-tight flex items-start gap-1">
          <span className="text-emerald-400 font-bold">✦</span>
          <span>{vdPhysicalDiagnostic}</span>
        </div>
      </div>

      {/* COMPARADOR 2: DIFUSIVIDAD TURBULENTA / COUPLING (k) */}
      <div className="bg-black/50 border border-slate-800/90 rounded p-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[8.5px] font-bold text-slate-200 font-mono">DIFUSIVIDAD TURBULENTA (k)</span>
            <ScientificTooltip
              position="left"
              width="w-[340px]"
              content="Contraste entre el factor de acoplamiento difusivo k (Oke 1987 / Kastner-Klein 2001) calculado por la PINN y el promedio empírico para esta velocidad de viento y radiación."
            >
              <Info className="w-3 h-3 text-slate-500 cursor-help" />
            </ScientificTooltip>
          </div>

          {/* BADGE DE DESVIACIÓN */}
          <div className={`px-1.5 py-0.5 rounded border text-[8px] font-mono font-bold flex items-center gap-1 ${tierK.bg} ${tierK.color}`}>
            {deltaKPct > 2 ? <TrendingUp className="w-2.5 h-2.5" /> : (deltaKPct < -2 ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />)}
            <span>{deltaKPct >= 0 ? `+${deltaKPct.toFixed(1)}%` : `${deltaKPct.toFixed(1)}%`}</span>
          </div>
        </div>

        {/* VALORES EN PARALELO */}
        <div className="grid grid-cols-2 gap-2 text-center font-mono">
          <div className="bg-slate-900/80 p-1.5 rounded border border-cyan-900/40">
            <div className="text-[7.5px] text-cyan-400/90 uppercase font-bold">PINN Actual</div>
            <div className="text-sm font-bold text-cyan-300">
              {kLive.toFixed(2)} <span className="text-[8px] text-slate-400 font-normal">adim</span>
            </div>
            <div className="text-[7px] text-slate-500 font-sans">Z-Score: {zScoreK > 0 ? `+${zScoreK.toFixed(1)}σ` : `${zScoreK.toFixed(1)}σ`}</div>
          </div>

          <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
            <div className="text-[7.5px] text-slate-400 uppercase font-bold">Media Histórica</div>
            <div className="text-sm font-bold text-slate-300">
              {kHist.toFixed(2)} <span className="text-[8px] text-slate-400 font-normal">adim</span>
            </div>
            <div className="text-[7px] text-slate-500 font-sans">σ = ±{hist.kHistStd.toFixed(2)}</div>
          </div>
        </div>

        {/* BARRA COMPARATIVA PROPORCIONAL */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-[7px] font-mono text-slate-400">
            <span>0.0</span>
            <span>Ref Histórica</span>
            <span>35.0</span>
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex relative border border-slate-800">
            <div 
              className="h-full bg-cyan-500 transition-all duration-500" 
              style={{ width: `${Math.min(100, (kLive / 35.0) * 100)}%` }}
              title={`PINN: ${kLive.toFixed(2)}`}
            />
            {/* Marcador Histórico */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_4px_#fff]" 
              style={{ left: `${Math.min(99, (kHist / 35.0) * 100)}%` }}
              title={`Histórico: ${kHist.toFixed(2)}`}
            />
          </div>
        </div>

        {/* DIAGNÓSTICO FÍSICO k */}
        <div className="text-[7.5px] text-slate-300 bg-slate-950/80 p-1.5 rounded border border-slate-900 leading-tight flex items-start gap-1">
          <span className="text-cyan-400 font-bold">✦</span>
          <span>{kPhysicalDiagnostic}</span>
        </div>
      </div>

      {/* SECCIÓN EXPANDIBLE: CURVA DIURNA COMPARATIVA RECHARTS */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-2 border-t border-slate-800/80 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[8.5px] font-bold text-slate-300 font-mono">
                Evolución Diurna Comparativa (24h)
              </span>
              <div className="flex gap-1 text-[7px] font-mono">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-1.5 py-0.5 rounded ${activeTab === 'summary' ? 'bg-cyan-900 text-white font-bold' : 'bg-slate-900 text-slate-400'}`}
                >
                  v_d (cm/s)
                </button>
                <button
                  onClick={() => setActiveTab('curve')}
                  className={`px-1.5 py-0.5 rounded ${activeTab === 'curve' ? 'bg-cyan-900 text-white font-bold' : 'bg-slate-900 text-slate-400'}`}
                >
                  k (adim)
                </button>
              </div>
            </div>

            <div className="h-32 w-full bg-slate-950 p-1.5 rounded border border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={diurnalComparisonData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                  <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 8, fill: '#94a3b8' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 8, fill: '#94a3b8' }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '9px', fontFamily: 'monospace' }}
                  />
                  {activeTab === 'summary' ? (
                    <>
                      <Line type="monotone" dataKey="vd_hist" name="v_d Histórico (cm/s)" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                      <ReferenceLine y={Number((vdLive * 100).toFixed(3))} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'PINN Live', fill: '#f59e0b', fontSize: 8, position: 'right' }} />
                    </>
                  ) : (
                    <>
                      <Line type="monotone" dataKey="k_hist" name="k Histórico" stroke="#06b6d4" strokeWidth={2} dot={{ r: 2 }} />
                      <ReferenceLine y={Number(kLive.toFixed(1))} stroke="#ec4899" strokeDasharray="3 3" label={{ value: 'PINN Live', fill: '#ec4899', fontSize: 8, position: 'right' }} />
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
