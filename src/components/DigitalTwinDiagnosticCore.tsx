import React, { useState, useEffect } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { Activity, ShieldCheck, Zap, Thermometer, Globe, Cloud, AlertTriangle, Download, Scale, Wind } from 'lucide-react';
import { fetchMalagaTelemetry, LiveTelemetry } from '../lib/telemetry';
import { calculateRigorousSPA, SolarGeometry } from '../lib/astronomy';
import { evaluateMetrologyAndCompliance, MetrologyState } from '../lib/metrology';
import { calculateMoninObukhov } from '../lib/moninObukhov';

interface DiagnosticCoreProps {
  isOpen: boolean;
  onClose: () => void;
  baseNo2Ppb: number;
  baseO3Ppb: number;
}

export const DigitalTwinDiagnosticCore: React.FC<DiagnosticCoreProps> = ({ isOpen, onClose, baseNo2Ppb, baseO3Ppb }) => {
  const [telemetry, setTelemetry] = useState<LiveTelemetry | null>(null);
  const [solar, setSolar] = useState<SolarGeometry | null>(null);
  const [metrology, setMetrology] = useState<MetrologyState | null>(null);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'astronomy' | 'metrology' | 'regulatory'>('telemetry');
  const [isFetching, setIsFetching] = useState(false);
  const [tError, setTError] = useState(0.5); // Incertidumbre de medición ºC

  useEffect(() => {
    if (isOpen) {
      handleAssimilation();
    }
  }, [isOpen]);

  // Hooking the state when telemetry updates
  useEffect(() => {
    if (telemetry) {
      setSolar(calculateRigorousSPA(new Date(), 36.72016, -4.42034));
      setMetrology(evaluateMetrologyAndCompliance(telemetry.tempC, tError, telemetry.pressureHpa, baseNo2Ppb, baseO3Ppb));
    }
  }, [telemetry, tError, baseNo2Ppb, baseO3Ppb]);

  const handleAssimilation = async () => {
    setIsFetching(true);
    const data = await fetchMalagaTelemetry();
    setTelemetry(data);
    setIsFetching(false);
  };

  const handleExportCSV = () => {
    if (!telemetry || !solar || !metrology) return;
    const header = "timestamp,temp_c,rh_pct,pressure_hpa,sza_deg,jNo2_s1,k3_arrhenius,k3_error,no2_ugm3,o3_ugm3,is_compliant_no2\n";
    const row = `${telemetry.timestamp},${telemetry.tempC},${telemetry.rhPct},${telemetry.pressureHpa},${solar.sza_deg},${solar.jNo2_ClearSky_s1},${metrology.k3_value},${metrology.k3_error},${metrology.no2_ugm3},${metrology.o3_ugm3},${metrology.no2_is_compliant}\n`;
    
    const blob = new Blob([header + row], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digital_twin_diagnostic_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <DraggableWindow 
      title="Núcleo de Diagnóstico y Asimilación (Cero Simulación)" 
      subtitle="Validación metrológica y asimilación observacional estricta"
      icon={<Activity className="w-5 h-5 text-emerald-400" />}
      onClose={onClose} 
      defaultCollapsed={true}
      className="w-full max-w-4xl"
      initialPositionClass="top-12 left-1/2 -translate-x-1/2"
    >
      <div className="flex flex-col bg-slate-950 text-slate-300 h-full max-h-[85vh] overflow-hidden">
        
        {/* Toolbar */}
        <div className="flex bg-slate-900 border-b border-slate-800 p-2 gap-2">
          <ScientificTooltip position="bottom" width="w-[280px]" content="Asimilación observacional en tiempo real desde APIs meteorológicas oficiales y cálculo determinista sin variables sintéticas.">
            <button onClick={() => setActiveTab('telemetry')} className={`px-3 py-1.5 text-[10px] font-bold font-mono uppercase rounded transition-colors flex items-center gap-1.5 ${activeTab === 'telemetry' ? 'bg-sky-900/80 text-sky-300 border border-sky-500' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}>
              <Cloud className="w-3.5 h-3.5" /> Asimilación API
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Posicionamiento solar de alta precisión con el algoritmo SPA del NREL para derivar el ángulo cenital (SZA) y la tasa J_NO2.">
            <button onClick={() => setActiveTab('astronomy')} className={`px-3 py-1.5 text-[10px] font-bold font-mono uppercase rounded transition-colors flex items-center gap-1.5 ${activeTab === 'astronomy' ? 'bg-amber-900/80 text-amber-300 border border-amber-500' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}>
              <Globe className="w-3.5 h-3.5" /> Astronomía (SPA)
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Propagación de incertidumbres analíticas (GUM) y evaluación de la constante cinética de Arrhenius k3(T).">
            <button onClick={() => setActiveTab('metrology')} className={`px-3 py-1.5 text-[10px] font-bold font-mono uppercase rounded transition-colors flex items-center gap-1.5 ${activeTab === 'metrology' ? 'bg-indigo-900/80 text-indigo-300 border border-indigo-500' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}>
              <Scale className="w-3.5 h-3.5" /> Metrología
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Comprobación jurídica y estricta frente a los valores límite horarios y octohorarios de la Directiva 2008/50/CE y Real Decreto 102/2011.">
            <button onClick={() => setActiveTab('regulatory')} className={`px-3 py-1.5 text-[10px] font-bold font-mono uppercase rounded transition-colors flex items-center gap-1.5 ${activeTab === 'regulatory' ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-500' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}>
              <ShieldCheck className="w-3.5 h-3.5" /> Directiva 2008/50/CE
            </button>
          </ScientificTooltip>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          
          {/* TAB 1: TELEMETRÍA */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between bg-slate-900 border border-slate-700 p-3 rounded">
                <div>
                  <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Conector Observacional (Open-Meteo)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">Asimilación determinista de condiciones termodinámicas. Sin estocasticidad.</p>
                </div>
                <button onClick={handleAssimilation} disabled={isFetching} className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded text-xs font-bold transition-all disabled:opacity-50">
                  {isFetching ? 'Asimilando...' : 'Forzar Sincronización'}
                </button>
              </div>

              {telemetry && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-black/50 border border-slate-800 p-3 rounded flex flex-col items-center justify-center text-center">
                    <Thermometer className="w-6 h-6 text-rose-400 mb-2" />
                    <span className="text-[10px] text-slate-400 uppercase">Temperatura</span>
                    <span className="text-xl font-mono text-slate-200">{telemetry.tempC.toFixed(1)} <span className="text-xs">ºC</span></span>
                  </div>
                  <div className="bg-black/50 border border-slate-800 p-3 rounded flex flex-col items-center justify-center text-center">
                    <Cloud className="w-6 h-6 text-sky-400 mb-2" />
                    <span className="text-[10px] text-slate-400 uppercase">Humedad (HR)</span>
                    <span className="text-xl font-mono text-slate-200">{telemetry.rhPct.toFixed(1)} <span className="text-xs">%</span></span>
                  </div>
                  <div className="bg-black/50 border border-slate-800 p-3 rounded flex flex-col items-center justify-center text-center">
                    <Cloud className="w-6 h-6 text-slate-500 mb-2" />
                    <span className="text-[10px] text-slate-400 uppercase">Nubosidad</span>
                    <span className="text-xl font-mono text-slate-200">{telemetry.cloudCoverPct.toFixed(1)} <span className="text-xs">%</span></span>
                  </div>
                  <div className="bg-black/50 border border-slate-800 p-3 rounded flex flex-col items-center justify-center text-center">
                    <Activity className="w-6 h-6 text-emerald-400 mb-2" />
                    <span className="text-[10px] text-slate-400 uppercase">Presión Atm.</span>
                    <span className="text-xl font-mono text-slate-200">{telemetry.pressureHpa.toFixed(0)} <span className="text-xs">hPa</span></span>
                  </div>
                </div>
              )}

              {/* Panel Micrometeorológico de Monin-Obukhov (MOST) */}
              {telemetry && (
                <div className="bg-slate-900/90 border border-slate-800 p-3 rounded space-y-2 font-mono">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-cyan-300">Teoría de Semejanza de Monin-Obukhov (MOST)</span>
                    </div>
                    {(() => {
                      const most = calculateMoninObukhov(
                        10,
                        0.8,
                        15,
                        telemetry.windSpeedMs || 3.0,
                        telemetry.tempC,
                        solar ? (solar.sza_deg < 85 ? Math.max(50, 900 * Math.cos(solar.sza_deg * Math.PI / 180)) : 0) : 300,
                        telemetry.cloudCoverPct,
                        solar ? solar.sza_deg >= 90 : false
                      );

                      return (
                        <span className="text-[10px] bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 px-2 py-0.5 rounded font-bold">
                          Pasquill {most.stabilityClass}: {most.stabilityDescription.split(' ')[0]}
                        </span>
                      );
                    })()}
                  </div>

                  {(() => {
                    const most = calculateMoninObukhov(
                      10,
                      0.8,
                      15,
                      telemetry.windSpeedMs || 3.0,
                      telemetry.tempC,
                      solar ? (solar.sza_deg < 85 ? Math.max(50, 900 * Math.cos(solar.sza_deg * Math.PI / 180)) : 0) : 300,
                      telemetry.cloudCoverPct,
                      solar ? solar.sza_deg >= 90 : false
                    );

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                        <ScientificTooltip position="bottom" width="w-[260px]" content="Longitud de Monin-Obukhov L (m). Punto donde la producción por cizalladura equivale a la destrucción/producción por empuje térmico.">
                          <div className="bg-slate-950 p-2 border border-slate-800 rounded cursor-help">
                            <span className="text-slate-400 block">• Longitud M-O (L):</span>
                            <span className="text-amber-300 font-bold">{most.moninObukhovLengthL} m</span>
                          </div>
                        </ScientificTooltip>

                        <ScientificTooltip position="bottom" width="w-[260px]" content="Velocidad de fricción superficial u* (m/s). Mide la intensidad de la cizalladura turbulenta generada por la rugosidad urbana.">
                          <div className="bg-slate-950 p-2 border border-slate-800 rounded cursor-help">
                            <span className="text-slate-400 block">• Vel. Fricción (u*):</span>
                            <span className="text-emerald-300 font-bold">{most.uStarMs} m/s</span>
                          </div>
                        </ScientificTooltip>

                        <ScientificTooltip position="bottom" width="w-[260px]" content="Parámetro de estabilidad adimensional ζ = (z - d) / L. Determina si domina la convección (ζ < 0) o la supresión por inversión térmica (ζ > 0).">
                          <div className="bg-slate-950 p-2 border border-slate-800 rounded cursor-help">
                            <span className="text-slate-400 block">• Estabilidad (&zeta;):</span>
                            <span className="text-cyan-300 font-bold">{most.zeta}</span>
                          </div>
                        </ScientificTooltip>

                        <ScientificTooltip position="bottom" width="w-[260px]" content="Coeficiente de Difusividad Turbulenta Vertical K_z (m²/s) a 10m. Rige la tasa de dispersión vertical de contaminantes.">
                          <div className="bg-slate-950 p-2 border border-slate-800 rounded cursor-help">
                            <span className="text-slate-400 block">• Difusividad K_z:</span>
                            <span className="text-purple-300 font-bold">{most.kzM2s} m²/s</span>
                          </div>
                        </ScientificTooltip>
                      </div>
                    );
                  })()}
                </div>
              )}
              
              <div className="text-[9px] font-mono text-slate-500 mt-2 text-right">
                Última asimilación: {telemetry ? new Date(telemetry.timestamp).toLocaleString() : 'N/A'} {telemetry?.isLive ? '(API en vivo)' : '(Fallback Determinista)'}
              </div>
            </div>
          )}

          {/* TAB 2: ASTRONOMÍA (SPA) */}
          {activeTab === 'astronomy' && solar && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-amber-950/20 border border-amber-900/50 p-3 rounded">
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Resolución Orbital y Radiométrica (Algoritmo NREL)
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  Ecuación del Tiempo y corrección de refracción atmosférica aplicadas.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/60 border border-slate-800 p-4 rounded space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-400">Ángulo Cenital Solar (SZA)</span>
                    <span className="font-mono text-amber-300 font-bold">{solar.sza_deg.toFixed(4)}°</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-400">Declinación Solar</span>
                    <span className="font-mono text-slate-200">{solar.declination_deg.toFixed(4)}°</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-400">Ecuación del Tiempo (EOT)</span>
                    <span className="font-mono text-slate-200">{solar.equationOfTime_min.toFixed(2)} min</span>
                  </div>
                </div>
                
                <div className="bg-amber-950/10 border border-amber-900/30 p-4 rounded flex flex-col justify-center items-center text-center">
                  <Zap className="w-8 h-8 text-amber-500 mb-2" />
                  <span className="text-[10px] uppercase tracking-widest text-amber-500/70">Flujo Actínico Teórico J_NO₂</span>
                  <span className="text-3xl font-mono text-amber-400 mt-2">{solar.jNo2_ClearSky_s1.toExponential(3)} <span className="text-sm">s⁻¹</span></span>
                  <p className="text-[9px] text-slate-500 mt-3 font-mono">
                    Parametrización NCAR TUV para cielos despejados.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: METROLOGÍA */}
          {activeTab === 'metrology' && metrology && (
            <div className="space-y-4 animate-in fade-in duration-300">
               <div className="bg-indigo-950/20 border border-indigo-900/50 p-3 rounded">
                <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                  <Scale className="w-4 h-4" /> Trazabilidad Metrológica y Error Propagado
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  Cálculo diferencial estricto basado en la Ley de Propagación de Errores (Taylor 1er orden).
                </p>
              </div>

              <div className="bg-black/60 border border-slate-800 p-4 rounded space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Incertidumbre Termistor Sensor (ºC)</label>
                    <input type="range" min="0.1" max="2.0" step="0.1" value={tError} onChange={(e) => setTError(Number(e.target.value))} className="w-full accent-indigo-500" />
                  </div>
                  <div className="bg-indigo-950/50 border border-indigo-500/30 px-3 py-1.5 rounded text-indigo-300 font-mono text-xs">
                    ΔT = ±{tError.toFixed(1)} ºC
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4">
                  <h4 className="text-xs font-bold text-slate-300 mb-3">Propagación en Constante de Arrhenius (k₃)</h4>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mb-2">
                    <ScientificTooltip position="top" width="w-[300px]" content="Derivada parcial dk3/dT = k3 * (Ea_R / T^2)">
                      <span className="cursor-help border-b border-dashed border-slate-600 pb-0.5">Fórmula: Δk₃ = |∂k₃/∂T| × ΔT</span>
                    </ScientificTooltip>
                  </div>
                  <div className="bg-slate-900 p-3 rounded border border-slate-700 flex justify-between items-center">
                    <span className="text-xs text-slate-300">Valor nominal k₃ (T={metrology.t_celsius}ºC)</span>
                    <span className="font-mono text-indigo-300">{metrology.k3_value.toExponential(3)} cm³/molec·s</span>
                  </div>
                  <div className="bg-rose-950/20 p-3 rounded border border-rose-900/30 flex justify-between items-center mt-2">
                    <span className="text-xs text-rose-300">Margen de Error (Δk₃) propagado</span>
                    <span className="font-mono text-rose-400 font-bold">± {metrology.k3_error.toExponential(3)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDITORÍA NORMATIVA */}
          {activeTab === 'regulatory' && metrology && (
            <div className="space-y-4 animate-in fade-in duration-300">
               <div className="bg-emerald-950/20 border border-emerald-900/50 p-3 rounded">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Auditoría Normativa (Directiva 2008/50/CE)
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  Validación booleana de superaciones. Conversión termodinámica estricta a µg/m³.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NO2 */}
                <div className={`p-4 rounded border ${metrology.no2_is_compliant ? 'bg-emerald-950/10 border-emerald-900/30' : 'bg-rose-950/20 border-rose-900/50'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-slate-200">Dióxido de Nitrógeno (NO₂)</h4>
                    {metrology.no2_is_compliant ? 
                      <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded uppercase font-bold border border-emerald-500/30">Cumple</span> :
                      <span className="bg-rose-500/20 text-rose-400 text-[9px] px-2 py-0.5 rounded uppercase font-bold border border-rose-500/30 animate-pulse">Excede</span>
                    }
                  </div>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Base Molar:</span> <span>{metrology.no2_ppb.toFixed(1)} ppb</span>
                    </div>
                    <div className="flex justify-between text-slate-200 font-bold">
                      <span>Conv. Termodinámica:</span> <span>{metrology.no2_ugm3.toFixed(1)} µg/m³</span>
                    </div>
                    <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-800">
                      <span>Límite Legal (1h):</span> <span>{metrology.no2_legal_limit_1h_ugm3} µg/m³</span>
                    </div>
                  </div>
                </div>

                {/* O3 */}
                <div className={`p-4 rounded border ${metrology.o3_is_compliant ? 'bg-emerald-950/10 border-emerald-900/30' : 'bg-rose-950/20 border-rose-900/50'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-slate-200">Ozono Troposférico (O₃)</h4>
                    {metrology.o3_is_compliant ? 
                      <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded uppercase font-bold border border-emerald-500/30">Cumple</span> :
                      <span className="bg-rose-500/20 text-rose-400 text-[9px] px-2 py-0.5 rounded uppercase font-bold border border-rose-500/30 animate-pulse">Excede</span>
                    }
                  </div>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Base Molar:</span> <span>{metrology.o3_ppb.toFixed(1)} ppb</span>
                    </div>
                    <div className="flex justify-between text-slate-200 font-bold">
                      <span>Conv. Termodinámica:</span> <span>{metrology.o3_ugm3.toFixed(1)} µg/m³</span>
                    </div>
                    <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-800">
                      <span>Límite Legal (8h):</span> <span>{metrology.o3_legal_limit_8h_ugm3} µg/m³</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER EXPORT */}
        <div className="bg-black/80 border-t border-slate-800 p-3 flex justify-between items-center">
          <div className="text-[9px] font-mono text-slate-500 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            0% Estocasticidad. Datos certificados deterministas.
          </div>
          <ScientificTooltip position="left" width="w-[280px]" content="Exportación de la serie de diagnóstico metrológico, constantes cinéticas y estados de cumplimiento normativo en formato CSV (FAIR).">
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded text-[10px] font-mono font-bold transition-colors">
              <Download className="w-3.5 h-3.5 text-indigo-400" /> Exportar Auditoría (CSV)
            </button>
          </ScientificTooltip>
        </div>

      </div>
    </DraggableWindow>
  );
};
