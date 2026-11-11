import React, { useState, useMemo } from 'react';
import { 
  Building2, Wind, Layers, ArrowDownUp, Compass, Download, ShieldCheck, 
  Activity, Info, Gauge, Zap, Waves, Sparkles, Copy, Check 
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { useActivePoint } from '../context/ActivePointContext';
import { calculateVerticalCanyonProfile, VerticalCanyonProfileResult, VerticalCanyonLevel } from '../lib/spatialAssimilation';
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Area } from 'recharts';

export interface VerticalCanyonSoundingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VerticalCanyonSoundingModal: React.FC<VerticalCanyonSoundingModalProps> = ({
  isOpen,
  onClose
}) => {
  const activePointCtx = useActivePoint();
  const [selectedSpecies, setSelectedSpecies] = useState<'NO2' | 'PM2.5' | 'PM10' | 'O3' | 'WIND'>('NO2');
  const [hoveredAltitude, setHoveredAltitude] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const profile: VerticalCanyonProfileResult | null = useMemo(() => {
    if (!activePointCtx?.assimilation) return null;
    return calculateVerticalCanyonProfile(activePointCtx.assimilation);
  }, [activePointCtx?.assimilation]);

  if (!isOpen || !activePointCtx || !profile) return null;

  const { activePoint, location } = activePointCtx;

  const chartData = profile.levels.map((lvl) => ({
    altitudeM: lvl.altitudeM,
    no2: lvl.no2UgM3,
    pm25: lvl.pm25UgM3,
    pm10: lvl.pm10UgM3,
    o3: lvl.ozoneUgM3,
    wind: lvl.windSpeedMs,
    tke: Number((lvl.tkeM2s2 * 10).toFixed(2)), // escalado para visualización
    regimeLabel: lvl.regimeLabel
  }));

  const handleExportCSV = () => {
    const headers = "Altitud_m,NO2_ug_m3,PM25_ug_m3,PM10_ug_m3,O3_ug_m3,Viento_m_s,TKE_m2_s2,Regimen\n";
    const rows = profile.levels.map(l => 
      `${l.altitudeM},${l.no2UgM3},${l.pm25UgM3},${l.pm10UgM3},${l.ozoneUgM3},${l.windSpeedMs},${l.tkeM2s2},"${l.regimeLabel}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sondeo_Vertical_Canon_${activePoint.name.replace(/\s+/g, '_')}_0_50m.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    const text = `Sondeo Vertical de Cañón Urbano: ${activePoint.name} (H=${profile.H}m, W=${profile.W}m, H/W=${profile.aspectRatioHw}) | Cota 1.8m: NO2=${profile.pedestrianNO2UgM3} ug/m3 | Cota Cornisa (${profile.H}m): NO2=${profile.roofNO2UgM3} ug/m3 | Fondo Libre: NO2=${profile.backgroundNO2UgM3} ug/m3 | u*=${profile.uStarMs} m/s, z0=${profile.z0_m} m, d=${profile.d_m} m`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DraggableWindow
      title="Microperfil Vertical de Cañón Urbano (0 a 50 m AGL)"
      icon={<Building2 className="w-4 h-4 text-emerald-400" />}
      onClose={onClose}
      defaultCollapsed={true}
      className="w-full max-w-4xl max-h-[85vh]"
      showActivePointBanner={true}
      headerExtra={
        <div className="flex items-center gap-1.5 mr-2">
          <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar tabla completa de las 28 cotas de altitud (0.5m a 50m) en formato CSV estándar FAIR.">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-2 py-0.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/60 rounded-xs flex items-center gap-1 transition-colors cursor-pointer text-[9px] font-bold"
            >
              <Download className="w-2.5 h-2.5" />
              <span>CSV</span>
            </button>
          </ScientificTooltip>
          <ScientificTooltip position="bottom" width="w-[280px]" content="Copiar al portapapeles el resumen de parámetros micromorfológicos y gradientes de dispersión vertical.">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600/60 rounded-xs flex items-center gap-1 transition-colors cursor-pointer text-[9px]"
            >
              {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
              <span>{copied ? 'OK' : 'SUMARIO'}</span>
            </button>
          </ScientificTooltip>
        </div>
      }
    >
      <div className="space-y-3 font-mono text-[11px]">
        {/* Morphometric and Aerodynamic Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-center">
          <div className="bg-black/50 border border-slate-800 p-2 rounded-xs">
            <div className="text-slate-500 text-[8.5px] uppercase">Altura Edificación (H)</div>
            <div className="text-emerald-400 font-bold text-sm">{profile.H} m</div>
            <div className="text-[8px] text-slate-500">Cota de Cornisa</div>
          </div>

          <div className="bg-black/50 border border-slate-800 p-2 rounded-xs">
            <div className="text-slate-500 text-[8.5px] uppercase">Ancho Cañón (W)</div>
            <div className="text-cyan-400 font-bold text-sm">{profile.W} m</div>
            <div className="text-[8px] text-slate-500">Separación Fachadas</div>
          </div>

          <div className="bg-black/50 border border-slate-800 p-2 rounded-xs">
            <div className="text-slate-500 text-[8.5px] uppercase">Relación H/W</div>
            <div className="text-amber-400 font-bold text-sm">{profile.aspectRatioHw}</div>
            <div className="text-[8px] text-slate-500">{profile.aspectRatioHw >= 0.7 ? 'Régimen Vórtice' : 'Ventilación Libre'}</div>
          </div>

          <div className="bg-black/50 border border-slate-800 p-2 rounded-xs">
            <div className="text-slate-500 text-[8.5px] uppercase">Rugosidad z₀ / d</div>
            <div className="text-indigo-400 font-bold text-sm">{profile.z0_m}m / {profile.d_m}m</div>
            <div className="text-[8px] text-slate-500">Grimmond & Oke (1999)</div>
          </div>

          <div className="bg-black/50 border border-slate-800 p-2 rounded-xs">
            <div className="text-slate-500 text-[8.5px] uppercase">Vel. Fricción u*</div>
            <div className="text-rose-400 font-bold text-sm">{profile.uStarMs} m/s</div>
            <div className="text-[8px] text-slate-500">Monin-Obukhov</div>
          </div>

          <div className="bg-black/50 border border-slate-800 p-2 rounded-xs">
            <div className="text-slate-500 text-[8.5px] uppercase">Flujo Ventilación</div>
            <div className="text-teal-400 font-bold text-sm">{profile.canyonVentilationFluxM2s} m²/s</div>
            <div className="text-[8px] text-slate-500">Intercambio Turbulento</div>
          </div>
        </div>

        {/* Species & Variables Selector Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-900/60 p-1.5 border border-slate-800 rounded-xs">
          <div className="text-slate-400 text-[9.5px] font-bold uppercase flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Variable en Eje Horizontal (X) frente a Cota z (0 - 50m):</span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {(['NO2', 'PM2.5', 'PM10', 'O3', 'WIND'] as const).map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => setSelectedSpecies(spec)}
                className={`px-2 py-0.5 rounded-xs text-[9.5px] font-bold transition-all cursor-pointer ${
                  selectedSpecies === spec
                    ? 'bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                    : 'bg-black/40 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {spec === 'WIND' ? 'VIENTO u(z) (m/s)' : `${spec} (µg/m³)`}
              </button>
            ))}
          </div>
        </div>

        {/* Main Chart Section: Altitud Z (0 a 50m) vs Concentración / Velocidad */}
        <div className="bg-black/70 border border-slate-800 p-3 rounded-xs h-[300px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                type="number" 
                stroke="#64748b" 
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                unit={selectedSpecies === 'WIND' ? ' m/s' : ' µg/m³'}
              />
              <YAxis 
                dataKey="altitudeM" 
                type="number" 
                domain={[0, 50]} 
                ticks={[0, 1.8, 5, 10, profile.H, 25, 35, 50]}
                stroke="#64748b" 
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                unit="m"
                reversed={false}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-emerald-500/80 p-2 rounded-xs shadow-xl text-[10px] font-mono">
                        <div className="text-emerald-400 font-bold">Cota z: {d.altitudeM} m AGL</div>
                        <div className="text-slate-300 text-[9px] mb-1">{d.regimeLabel}</div>
                        <div className="space-y-0.5 border-t border-slate-800 pt-1">
                          <div className="text-emerald-300">NO₂: {d.no2} µg/m³</div>
                          <div className="text-amber-300">PM₂.₅: {d.pm25} µg/m³</div>
                          <div className="text-amber-400">PM₁₀: {d.pm10} µg/m³</div>
                          <div className="text-cyan-300">O₃: {d.o3} µg/m³</div>
                          <div className="text-sky-300">Viento u(z): {d.wind} m/s</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Reference Lines for Key Physical Layers */}
              <ReferenceLine y={1.8} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '1.8m (Plano Respiratorio OMS)', position: 'insideTopRight', fill: '#10b981', fontSize: 9 }} />
              <ReferenceLine y={profile.H} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: `H = ${profile.H}m (Cornisa Edificio)`, position: 'insideTopRight', fill: '#f59e0b', fontSize: 9 }} />
              <ReferenceLine y={profile.d_m} stroke="#818cf8" strokeDasharray="2 2" strokeWidth={1} label={{ value: `d = ${profile.d_m}m (Plano Desplazamiento)`, position: 'insideBottomRight', fill: '#818cf8', fontSize: 8.5 }} />

              {selectedSpecies === 'NO2' && (
                <Line type="monotone" dataKey="no2" stroke="#10b981" strokeWidth={2.5} dot={{ r: 2.5, fill: '#10b981' }} name="NO₂" />
              )}
              {selectedSpecies === 'PM2.5' && (
                <Line type="monotone" dataKey="pm25" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 2.5, fill: '#f59e0b' }} name="PM₂.₅" />
              )}
              {selectedSpecies === 'PM10' && (
                <Line type="monotone" dataKey="pm10" stroke="#d97706" strokeWidth={2.5} dot={{ r: 2.5, fill: '#d97706' }} name="PM₁₀" />
              )}
              {selectedSpecies === 'O3' && (
                <Line type="monotone" dataKey="o3" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 2.5, fill: '#06b6d4' }} name="O₃" />
              )}
              {selectedSpecies === 'WIND' && (
                <Line type="monotone" dataKey="wind" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 2.5, fill: '#38bdf8' }} name="Viento u(z)" />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Stratification Description Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[9.5px]">
          <div className="bg-slate-950/70 border border-emerald-800/40 p-2 rounded-xs">
            <div className="text-emerald-400 font-bold flex items-center gap-1 mb-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              1. Plano Peatonal (0 - 2 m AGL)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Máxima exposición humana a emisiones primarias de escape vehicular. Concentración máxima en cota 1.8 m ({profile.pedestrianNO2UgM3} µg/m³ NO₂).
            </p>
          </div>

          <div className="bg-slate-950/70 border border-amber-800/40 p-2 rounded-xs">
            <div className="text-amber-400 font-bold flex items-center gap-1 mb-1">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              2. Vórtice del Cañón (2 m - {profile.H} m)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Decaimiento exponencial modulado por la relación H/W ({profile.aspectRatioHw}). Retención turbulenta y recirculación interna de contaminantes.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-indigo-800/40 p-2 rounded-xs">
            <div className="text-indigo-400 font-bold flex items-center gap-1 mb-1">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              3. Atmósfera Libre (z &gt; {profile.H} m)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Perfil logarítmico de Monin-Obukhov (u* = {profile.uStarMs} m/s, z₀ = {profile.z0_m} m). Transición asintótica al fondo regional ({profile.backgroundNO2UgM3} µg/m³ NO₂).
            </p>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};
