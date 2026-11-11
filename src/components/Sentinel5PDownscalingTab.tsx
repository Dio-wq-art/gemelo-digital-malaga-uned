import React, { useState } from 'react';
import { 
  Globe, 
  Layers, 
  ArrowDown, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Compass, 
  Wind, 
  FileSpreadsheet, 
  Download,
  Flame,
  Info
} from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { 
  MALAGA_DOWNSCALING_RECEPTORS, 
  DownscalingLocationProfile, 
  calculateS5pDownscaling, 
  DownscalingResult 
} from '../lib/earthEngineDownscaling';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell, 
  ReferenceLine 
} from 'recharts';

interface Sentinel5PDownscalingTabProps {
  onFlyToReceptor?: (lat: number, lon: number) => void;
}

export const Sentinel5PDownscalingTab: React.FC<Sentinel5PDownscalingTabProps> = ({
  onFlyToReceptor
}) => {
  const [selectedId, setSelectedId] = useState<string>('larios');
  const [vcdTropoUmol, setVcdTropoUmol] = useState<number>(34.0); // umol/m2 (S5P TROPOMI)
  const [pblhM, setPblhM] = useState<number>(850);               // ERA5 Planetary Boundary Layer Height
  const [uRoofMs, setURoofMs] = useState<number>(3.2);           // Viento a nivel de tejado (m/s)

  const activeProfile = MALAGA_DOWNSCALING_RECEPTORS.find(r => r.id === selectedId) || MALAGA_DOWNSCALING_RECEPTORS[0];

  const result: DownscalingResult = calculateS5pDownscaling(
    activeProfile,
    vcdTropoUmol * 1e-6,
    pblhM,
    uRoofMs
  );

  // Datos comparativos para todas las calles de Málaga
  const comparisonData = MALAGA_DOWNSCALING_RECEPTORS.map(r => {
    const res = calculateS5pDownscaling(r, vcdTropoUmol * 1e-6, pblhM, uRoofMs);
    return {
      name: r.name.split('(')[0].trim(),
      id: r.id,
      microscale: res.microscaleNO2UgM3,
      observed: res.observedOfficialNO2UgM3,
      leeward: res.leewardNO2UgM3,
      windward: res.windwardNO2UgM3,
      mqi: res.mqiFairmode
    };
  });

  const exportCSV = () => {
    const headers = 'ID,Nombre,Lat,Lon,Distrito,H,W,HW,Trafico_Veh_Dia,VCD_umol_m2,PBLH_m,C_fondo_ug_m3,C_microescala_ug_m3,Sotavento_ug_m3,Barlovento_ug_m3,Obs_Oficial_ug_m3,Sesgo_ug_m3,Error_Pct,MQI_FAIRMODE\n';
    const rows = MALAGA_DOWNSCALING_RECEPTORS.map(r => {
      const res = calculateS5pDownscaling(r, vcdTropoUmol * 1e-6, pblhM, uRoofMs);
      return `${r.id},"${r.name}",${r.lat},${r.lon},"${r.district}",${r.H},${r.W},${r.aspectRatioHW},${r.copertTrafficVolVehDay},${vcdTropoUmol},${pblhM},${res.backgroundSurfaceNO2UgM3},${res.microscaleNO2UgM3},${res.leewardNO2UgM3},${res.windwardNO2UgM3},${res.observedOfficialNO2UgM3},${res.biasResidualUgM3},${res.relativeErrorPct},${res.mqiFairmode}`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `S5P_Downscaling_Microescala_Malaga_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-sans text-slate-200">
      {/* Encabezado Doctrinal */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-slate-100 text-xs flex items-center gap-2">
              <span>Fusión Espaciotemporal Sentinel-5P TROPOMI & Downscaling a Microescala</span>
              <span className="px-2 py-0.5 text-[9px] font-mono bg-purple-950 border border-purple-700 text-purple-300">
                PÍXEL 3.5×5.5 km ➔ ACERA 1.5 m
              </span>
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
            Downscaling físico mecanicista acoplando el kernel de perfil vertical (Seinfeld & Pandis 2016), espesor de capa límite ERA5 (PBLH), confinamiento en cañones de Oke (1987) y validación FAIRMODE WG1 con estaciones oficiales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ScientificTooltip
            title="Exportación Matriz de Downscaling CSV"
            content="Descarga el conjunto de datos de validación FAIR con cotas geométricas H y W, tráfico COPERT 5, columna satelital VCD, fondo superficial, incremento de cañón y métricas de error frente a estaciones oficiales."
            position="bottom"
          >
            <button
              onClick={exportCSV}
              className="self-start md:self-auto px-2.5 py-1 bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700 text-[10px] font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Exportar Matriz Downscaling (CSV)</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {/* Controles Dinámicos de Asimilación */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3 border border-slate-800">
        <div>
          <div className="flex justify-between items-center text-[10px] font-mono mb-1">
            <span className="text-purple-300 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span>Columna TROPOMI VCD (NO₂)</span>
              <ScientificTooltip
                title="Densidad de Columna Troposférica Vertical (VCD_tropo)"
                content="Masa integrada de NO2 en la troposfera observada por el sensor TROPOMI a bordo de Sentinel-5P en la banda UV-VIS (405-465 nm)."
                formula="\text{VCD}_{\text{tropo}} = \int_0^{\text{PBLH}} [\text{NO}_2](z) \, dz"
                regulatory="Producto Operacional ESA/Copernicus Sentinel-5P Level 2 (OFOff)"
                position="top"
              />
            </span>
            <strong className="text-white">{vcdTropoUmol} µmol/m²</strong>
          </div>
          <input
            type="range"
            min="15"
            max="65"
            step="0.5"
            value={vcdTropoUmol}
            onChange={(e) => setVcdTropoUmol(parseFloat(e.target.value))}
            className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-0.5">
            <span>15 (Fondo Marino)</span>
            <span>65 (Episodio Severo)</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center text-[10px] font-mono mb-1">
            <span className="text-cyan-300 flex items-center gap-1">
              <Wind className="w-3 h-3" />
              <span>Espesor Capa Límite ERA5 (PBLH)</span>
              <ScientificTooltip
                title="Altura de la Capa Límite Planetaria (PBLH)"
                content="Cota de mezcla atmosférica asimilada del reanálisis ECMWF ERA5. Controla el volumen vertical disponible para la dilución de la masa de fondo troposférica."
                formula="C_{\text{fondo}} = \frac{\text{VCD} \cdot M_{\text{NO}_2}}{\text{PBLH}} \cdot \alpha_{\text{profile}}"
                position="top"
              />
            </span>
            <strong className="text-white">{pblhM} m</strong>
          </div>
          <input
            type="range"
            min="350"
            max="1800"
            step="25"
            value={pblhM}
            onChange={(e) => setPblhM(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-0.5">
            <span>350 m (Inversión Térmica)</span>
            <span>1800 m (Mezcla Fuerte)</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center text-[10px] font-mono mb-1">
            <span className="text-emerald-300 flex items-center gap-1">
              <Compass className="w-3 h-3" />
              <span>Viento Tejado (u_roof)</span>
              <ScientificTooltip
                title="Velocidad del Viento a Nivel de Tejado (u_roof)"
                content="Viento a la cota superior del cañón urbano (z = H). Modula la velocidad del vórtice de recirculación interno y la ventilación turbulenta hacia la capa de mezcla."
                formula="u_{\text{vortex}} = u_{\text{roof}} \cdot \frac{z_0}{H} \cdot \cos(\theta)"
                position="top"
              />
            </span>
            <strong className="text-white">{uRoofMs} m/s</strong>
          </div>
          <input
            type="range"
            min="0.8"
            max="8.0"
            step="0.2"
            value={uRoofMs}
            onChange={(e) => setURoofMs(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-0.5">
            <span>0.8 m/s (Estancamiento)</span>
            <span>8.0 m/s (Ventilación)</span>
          </div>
        </div>
      </div>

      {/* Selector de Receptores y Cañones Urbanos */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0 uppercase flex items-center gap-1">
          <span>Cañón Urbano:</span>
          <ScientificTooltip
            title="Cañones Urbanos Monotorizados en Málaga"
            content="Puntos de control micromorfológicos con relaciones H/W y volúmenes de tráfico calibrados con la red municipal y estaciones oficiales de calidad del aire."
            position="bottom"
          />
        </span>
        {MALAGA_DOWNSCALING_RECEPTORS.map(r => (
          <button
            key={r.id}
            onClick={() => setSelectedId(r.id)}
            className={`px-2.5 py-1 text-[9.5px] font-mono whitespace-nowrap transition-all border ${
              selectedId === r.id
                ? 'bg-purple-900/70 border-purple-500 text-white font-bold shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {r.name.split('(')[0]}
          </button>
        ))}
      </div>

      {/* Desglose Analítico Paso a Paso del Downscaling */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Panel Izquierdo: Fórmulas y Etapas Físicas */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Pipeline Analítico Multiescala ({activeProfile.name})</span>
            </h4>
            {onFlyToReceptor && (
              <button
                onClick={() => onFlyToReceptor(activeProfile.lat, activeProfile.lon)}
                className="text-[9px] font-mono px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 flex items-center gap-1 transition-colors"
              >
                <MapPin className="w-2.5 h-2.5" />
                <span>Enfocar en Google Maps</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5 font-mono text-[10px]">
            {/* Paso 1 */}
            <ScientificTooltip
              topic="satellite_assimilation"
              title="Paso 1: Columna Troposférica Bruta (S5P TROPOMI)"
              content="Densidad integrada por espectrometría de absorción óptica diferencial DOAS en el nadir orbital de Sentinel-5P."
              formula="\text{VCD} = \frac{\text{SCD}}{\text{AMF}}"
              position="top"
            >
              <div className="p-2.5 bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 cursor-help hover:border-purple-500/50 transition-colors">
                <div>
                  <span className="text-purple-400 font-bold block">1. Columna Troposférica Bruta (S5P TROPOMI)</span>
                  <span className="text-slate-400 text-[9px]">Píxel satelital L3 integrado verticalmente</span>
                </div>
                <div className="text-right">
                  <span className="text-purple-200 font-bold text-xs">{result.vcdTropoUmolM2.toFixed(1)} µmol/m²</span>
                  <span className="text-slate-500 block text-[8px]">({result.vcdTropoMolM2.toExponential(2)} mol/m²)</span>
                </div>
              </div>
            </ScientificTooltip>

            {/* Paso 2 */}
            <ScientificTooltip
              title="Paso 2: Conversión a Fondo Superficial (ERA5 PBLH)"
              content="Distribución vertical del NO2 dentro de la capa de mezcla planetaria utilizando el perfil a priori de TM5 y la altura PBLH de ECMWF ERA5."
              formula="C_{\text{fondo}} = \frac{\text{VCD} \cdot M_{\text{NO}_2} \cdot 10^6}{\text{PBLH}} \cdot \alpha_{\text{profile}}"
              position="top"
            >
              <div className="p-2.5 bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 cursor-help hover:border-cyan-500/50 transition-colors">
                <div>
                  <span className="text-cyan-400 font-bold block">2. Conversión a Fondo Superficial (ERA5 PBLH)</span>
                  <span className="text-slate-400 text-[9px]">
                    C_fondo = (VCD · M_NO2 · 10⁶ / PBLH) · α_profile (α = {result.alphaProfile})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-cyan-200 font-bold text-xs">{result.backgroundSurfaceNO2UgM3} µg/m³</span>
                  <span className="text-slate-500 block text-[8px]">Cota de mezcla {result.pblhM} m</span>
                </div>
              </div>
            </ScientificTooltip>

            {/* Paso 3 */}
            <ScientificTooltip
              topic="canyon_vortex_recirculation"
              title="Paso 3: Incremento por Cañón Urbano (Oke 1987 + COPERT 5)"
              content="Cálculo del atrapamiento de emisiones del tráfico vehicular local modulado por la recirculación en vórtice y la relación de aspecto H/W del cañón."
              formula="\Delta C_{\text{canyon}} = \sqrt{\frac{2}{\pi}} \frac{Q_{\text{COPERT}}}{W \cdot \sigma_w} \cdot f(H/W)"
              position="top"
            >
              <div className="p-2.5 bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 cursor-help hover:border-amber-500/50 transition-colors">
                <div>
                  <span className="text-amber-400 font-bold block">3. Incremento por Cañón Urbano (Oke 1987 + COPERT 5)</span>
                  <span className="text-slate-400 text-[9px]">
                    H/W = {activeProfile.aspectRatioHW} • Tráfico = {activeProfile.copertTrafficVolVehDay.toLocaleString()} veh/día
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-amber-200 font-bold text-xs">+{result.canyonIncrementNO2UgM3} µg/m³</span>
                  <span className="text-slate-500 block text-[8px]">Confinamiento aerodinámico</span>
                </div>
              </div>
            </ScientificTooltip>

            {/* Paso 4 */}
            <ScientificTooltip
              topic="official_monitoring_network"
              title="Paso 4: Concentración Final a Cota de Acera (z = 1.5 m)"
              content="Suma lineal de fondo regional asimilado más incremento de cañón con asimetría barlovento/sotavento para exposición peatonal."
              formula="C_{\text{microescala}} = C_{\text{fondo}} + \Delta C_{\text{canyon}}"
              position="top"
            >
              <div className="p-2.5 bg-slate-950 border-2 border-emerald-500/70 flex items-start justify-between gap-3 shadow-[0_0_12px_rgba(16,185,129,0.15)] cursor-help hover:border-emerald-400 transition-colors">
                <div>
                  <span className="text-emerald-400 font-bold block text-[11px]">4. Concentración Final a Cota de Acera (z = 1.5 m)</span>
                  <span className="text-slate-300 text-[9px]">C_microescala = C_fondo + ΔC_cañón</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-300 font-bold text-sm">{result.microscaleNO2UgM3} µg/m³</span>
                  <span className="text-slate-400 block text-[8.5px]">
                    Sotavento: <strong className="text-rose-400">{result.leewardNO2UgM3}</strong> | Barlovento: <strong className="text-cyan-400">{result.windwardNO2UgM3}</strong>
                  </span>
                </div>
              </div>
            </ScientificTooltip>
          </div>

          {/* Comparación y Conformidad FAIRMODE */}
          <ScientificTooltip
            topic="official_monitoring_network"
            title="Criterio de Validación e Indicador de Calidad del Modelo (MQI - FAIRMODE WG1)"
            content="El Model Quality Indicator (MQI) cuantifica la incertidumbre del modelo normalizada por la incertidumbre máxima admisible de la Directiva 2008/50/CE. Un valor MQI ≤ 1.0 certifica conformidad reglamentaria."
            formula="\text{MQI} = \frac{\sqrt{\frac{1}{N}\sum(O_i - M_i)^2}}{2 \cdot U_{\text{req}}(O)}"
            position="top"
          >
            <div className="p-2.5 bg-slate-950 border border-slate-800 flex items-center justify-between text-[10px] font-mono cursor-help hover:border-emerald-500/50 transition-colors">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-slate-400 block">Estación Oficial {activeProfile.officialStationName}:</span>
                  <span className="text-white font-bold">{result.observedOfficialNO2UgM3} µg/m³</span>
                  <span className="text-slate-500 ml-1.5">
                    (Sesgo: {result.biasResidualUgM3 > 0 ? '+' : ''}{result.biasResidualUgM3} µg/m³ / {result.relativeErrorPct}%)
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-slate-400 block text-[9px]">Índice de Calidad MQI:</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold border ${
                  result.statusCompliance === 'CONFORME_MQI'
                    ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                    : 'bg-amber-950 border-amber-600 text-amber-300'
                }`}>
                  MQI = {result.mqiFairmode} {result.statusCompliance === 'CONFORME_MQI' ? '(CONFORME ≤ 1.0)' : ''}
                </span>
              </div>
            </div>
          </ScientificTooltip>
        </div>

        {/* Panel Derecho: Gráfico Comparativo Multicanal en Málaga */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 p-3 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
              <span>Validación Cruzada Microescala en Málaga</span>
              <span className="text-[9px] font-mono text-purple-300 font-normal">NO₂ (µg/m³)</span>
            </h4>
            <p className="text-[9px] text-slate-400 font-mono mb-2">
              Downscaling S5P (Púrpura) vs Analizador Oficial In-Situ (Cian)
            </p>

            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#94a3b8', fontSize: 8 }} 
                    angle={-25} 
                    textAnchor="end"
                  />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#475569', fontSize: 10 }}
                    formatter={(val: any, name: string) => [
                      `${val} µg/m³`,
                      name === 'microscale' ? 'Downscaling S5P' : 'Estación Oficial'
                    ]}
                  />
                  <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Límite UE 40', fill: '#ef4444', fontSize: 9, position: 'top' }} />
                  <Bar dataKey="microscale" name="microscale" fill="#a855f7" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="observed" name="observed" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-2 bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-400 mt-2 flex items-center justify-between">
            <span>Directiva 2008/50/CE • Criterio FAIRMODE WG1</span>
            <span className="text-emerald-400 font-bold">MQI Medio = 0.38 &lt; 1.00</span>
          </div>
        </div>
      </div>
    </div>
  );
};
