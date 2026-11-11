import React, { useState, useMemo, useEffect } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import { useActivePoint } from '../context/ActivePointContext';
import { BoundaryLayerInversionDiagram } from './BoundaryLayerInversionDiagram';
import { MoninObukhovTurbulenceDiagram } from './MoninObukhovTurbulenceDiagram';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart, Line
} from 'recharts';
import { 
  Cloud, Sliders, Activity, Info, Download, Wind, Thermometer, Layers, Compass, ArrowDownToLine, Flame, FileJson
} from 'lucide-react';
import { calculateMoninObukhov, calculateMoninObukhovState, exportMoninObukhovGeoJson } from '../lib/moninObukhov';

export type BoundaryLayerTab = 'sounding' | 'diffusivity' | 'most_turbulence' | 'diagram';

interface BoundaryLayerVerticalProfileModalProps {
  onClose: () => void;
  initialTab?: BoundaryLayerTab;
  baseTempC?: number;
  windSpeedSurface?: number;
  windDirDeg?: number;
  solarRadiationWm2?: number;
  relativeHumidity?: number;
  surfaceNOxUgm3?: number;
}

export function BoundaryLayerVerticalProfileModal({
  onClose,
  initialTab = 'sounding',
  baseTempC = 23.5,
  windSpeedSurface = 3.8,
  windDirDeg = 145,
  solarRadiationWm2 = 540,
  relativeHumidity = 68,
  surfaceNOxUgm3 = 48
}: BoundaryLayerVerticalProfileModalProps) {
  const activePointCtx = useActivePoint();
  const activePoint = activePointCtx?.activePoint;
  const assimilation = activePointCtx?.assimilation;

  const [activeTab, setActiveTab] = useState<BoundaryLayerTab>(initialTab);
  const [hPBL, setHPBL] = useState<number>(850); // m
  const [surfaceTemp, setSurfaceTemp] = useState<number>(assimilation?.temperatureC ?? baseTempC);
  const [inversionStrength, setInversionStrength] = useState<number>(2.5); // K/100m
  const [stability, setStability] = useState<'Unstable' | 'Neutral' | 'Stable'>('Unstable');
  const [ug, setUg] = useState<number>(11.5); // Geostrophic wind speed m/s
  const [surfaceZ0, setSurfaceZ0] = useState<number>(1.2); // m
  const [surfaceConcentration, setSurfaceConcentration] = useState<number>(assimilation?.no2PedestrianLevel1_8mUgM3 ?? surfaceNOxUgm3);

  // Asimilación reactiva de datos meteorológicos y químicos del punto activo
  useEffect(() => {
    if (assimilation) {
      if (assimilation.temperatureC !== undefined) setSurfaceTemp(assimilation.temperatureC);
      if (assimilation.no2PedestrianLevel1_8mUgM3 !== undefined) setSurfaceConcentration(assimilation.no2PedestrianLevel1_8mUgM3);
    }
  }, [assimilation]);

  const liveWindSpeed = assimilation?.windSpeedKmh ?? windSpeedSurface;
  const liveWindDir = assimilation?.windDirectionDeg ?? windDirDeg;
  const liveRH = assimilation?.relativeHumidityPct ?? relativeHumidity;
  const liveSolarRad = solarRadiationWm2;

  // MOST parameters calculation for baseline
  const mostBase = useMemo(() => {
    return calculateMoninObukhov(
      10,
      surfaceZ0,
      18,
      windSpeedSurface,
      surfaceTemp,
      stability === 'Unstable' ? solarRadiationWm2 : 10,
      stability === 'Neutral' ? 85 : 15,
      stability === 'Stable'
    );
  }, [surfaceZ0, windSpeedSurface, surfaceTemp, stability, solarRadiationWm2]);

  // Generador determinista del perfil vertical z in [0, 1500] m
  const verticalProfileData = useMemo(() => {
    const data = [];
    const zMax = 1500;
    const dz = 15; // Paso de integración de 15 metros
    const z0 = surfaceZ0; // Rugosidad aerodinámica
    const kappa = 0.40; // Constante de Von Kármán
    const ustar = Math.max(0.08, (windSpeedSurface * kappa) / Math.log(10 / z0));
    
    // Gradiente adiabático seco (K/m)
    const Gamma_d = 0.0098; 
    const p0 = 1013.25; // hPa

    for (let z = 5; z <= zMax; z += dz) {
      // 1. Presión barométrica estándar p(z)
      const p_z = p0 * Math.pow(1 - (0.0065 * z) / 288.15, 5.255);

      // 2. Perfil de Velocidad del Viento u(z) con transición suave a flujo geostrófico
      let u_z = 0;
      if (z <= hPBL) {
        let psi_m = 0;
        const zeta = z / (mostBase.moninObukhovLengthL || 9999);
        if (zeta < 0) {
          const x = Math.pow(1 - 16 * zeta, 0.25);
          psi_m = 2 * Math.log((1 + x) / 2) + Math.log((1 + x * x) / 2) - 2 * Math.atan(x) + Math.PI / 2;
        } else if (zeta > 0) {
          psi_m = -5 * Math.min(zeta, 2.5);
        }
        
        const u_most = (ustar / kappa) * (Math.log(Math.max(1.1, z / z0)) - psi_m);
        const blend = Math.pow(z / hPBL, 1.4);
        u_z = Math.min(ug * 1.5, Math.max(0.2, (1 - blend) * u_most + blend * ug));
      } else {
        u_z = ug; // Viento geostrófico libre
      }

      // 3. Perfil de Temperatura T(z) y Temperatura Potencial Theta(z)
      let T_z = surfaceTemp;
      if (stability === 'Unstable' || stability === 'Neutral') {
        if (z <= hPBL) {
          T_z = surfaceTemp - (Gamma_d * z);
        } else {
          // Inversión de subsidencia / entrainment en el tope de la PBL
          T_z = (surfaceTemp - Gamma_d * hPBL) + (inversionStrength * ((z - hPBL) / 100));
        }
      } else {
        // Inversión Térmica Radiativa de Superficie (Estable)
        const inversionDepth = Math.min(320, hPBL);
        if (z <= inversionDepth) {
          T_z = surfaceTemp + (inversionStrength * 1.8 * (z / 100));
        } else if (z <= hPBL) {
          T_z = (surfaceTemp + inversionStrength * 1.8 * (inversionDepth / 100)) - (0.006 * (z - inversionDepth));
        } else {
          T_z = (surfaceTemp + inversionStrength * 1.8 * (inversionDepth / 100)) - (0.006 * (hPBL - inversionDepth)) + (0.0025 * (z - hPBL));
        }
      }

      // Temperatura Potencial Theta = T * (p0 / p)^0.286 en Kelvin
      const tempK = T_z + 273.15;
      const theta_K = tempK * Math.pow(p0 / p_z, 0.286);
      const theta_C = theta_K - 273.15;

      // 4. Difusividad Turbulenta Vertical K_z(z) [m²/s]
      let kz = 0.1;
      if (z < hPBL) {
        const normZ = z / hPBL;
        if (stability === 'Unstable') {
          // Convección diurna (Holtslag & Boville)
          const wStar = Math.pow((9.81 / tempK) * Math.max(0.01, (mostBase.sensibleHeatFluxWm2 / (1.2 * 1005))) * hPBL, 1 / 3);
          kz = kappa * (ustar + 0.6 * wStar) * z * Math.pow(1 - normZ, 1.8);
        } else if (stability === 'Neutral') {
          kz = kappa * ustar * z * Math.pow(1 - normZ, 1.5);
        } else {
          // Estable (Inversión nocturna: turbulencia suprimida)
          kz = (kappa * ustar * z / (1 + 5 * (z / Math.max(10, mostBase.moninObukhovLengthL)))) * Math.pow(1 - normZ, 2.0);
        }
      } else {
        kz = 0.05; // Difusividad residual en troposfera libre
      }

      // 5. Frecuencia de Brunt-Väisälä N² = (g / theta) * (d theta / dz) [s⁻²]
      let bruntVaisalaN2 = 0;
      if (stability === 'Stable' && z <= Math.min(320, hPBL)) {
        bruntVaisalaN2 = (9.81 / tempK) * (inversionStrength * 0.018); // Muy estable (N² > 0)
      } else if (z > hPBL) {
        bruntVaisalaN2 = (9.81 / tempK) * (inversionStrength * 0.01);
      } else {
        bruntVaisalaN2 = stability === 'Unstable' ? -0.00015 : 0.00002;
      }

      // 6. Perfil de Concentración de Contaminantes C(z) [ug/m³]
      let c_z = 0;
      if (stability === 'Unstable') {
        if (z <= hPBL) {
          // Capa bien mezclada
          c_z = surfaceConcentration * (1 - 0.15 * Math.pow(z / hPBL, 1.5));
        } else {
          // Decaimiento exponencial supranivel
          c_z = surfaceConcentration * 0.85 * Math.exp(-(z - hPBL) / 60);
        }
      } else if (stability === 'Neutral') {
        if (z <= hPBL) {
          c_z = surfaceConcentration * Math.exp(-1.4 * (z / hPBL));
        } else {
          c_z = surfaceConcentration * Math.exp(-1.4) * Math.exp(-(z - hPBL) / 50);
        }
      } else {
        // Inversión térmica: fuerte atrapamiento en superficie
        const inversionDepth = Math.min(320, hPBL);
        if (z <= inversionDepth) {
          c_z = surfaceConcentration * 2.2 * Math.exp(-0.7 * (z / inversionDepth));
        } else {
          c_z = surfaceConcentration * 2.2 * Math.exp(-0.7) * Math.exp(-(z - inversionDepth) / 35);
        }
      }

      data.push({
        z: Math.round(z),
        u_velocity: Number(Math.max(0.1, u_z).toFixed(2)),
        temperature: Number(T_z.toFixed(2)),
        theta_c: Number(theta_C.toFixed(2)),
        kz_diffusivity: Number(Math.max(0.01, kz).toFixed(2)),
        brunt_n2: Number((bruntVaisalaN2 * 1000).toFixed(3)), // 10^-3 s^-2
        concentration: Number(Math.max(0.2, c_z).toFixed(1))
      });
    }
    return data;
  }, [hPBL, surfaceTemp, inversionStrength, stability, ug, windSpeedSurface, surfaceZ0, surfaceConcentration, mostBase]);

  // Exportar CSV según principios de Ciencia Abierta FAIR
  const handleExportCSV = () => {
    const headers = 'altitude_m,wind_speed_ms,temperature_c,potential_temp_c,diffusivity_kz_m2s,brunt_vaisala_10e3_s2,concentration_no2_ugm3,stability_class,h_pbl_m,geostrophic_ug_ms\n';
    const rows = verticalProfileData.map(d => 
      `${d.z},${d.u_velocity},${d.temperature},${d.theta_c},${d.kz_diffusivity},${d.brunt_n2},${d.concentration},${stability},${hPBL},${ug}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sondeo_pbl_monin_obukhov_${stability.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportGeoJson = () => {
    const moState = calculateMoninObukhovState(
      windSpeedSurface,
      stability === 'Unstable' ? solarRadiationWm2 : 0,
      surfaceTemp,
      stability === 'Stable',
      surfaceZ0
    );
    const str = exportMoninObukhovGeoJson(moState);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pbl_monin_obukhov_malaga_${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Preset selector
  const applyPreset = (preset: 'convective' | 'neutral' | 'inversion' | 'marine') => {
    if (preset === 'convective') {
      setStability('Unstable');
      setHPBL(1100);
      setInversionStrength(2.0);
      setUg(9.5);
      setSurfaceTemp(27.0);
    } else if (preset === 'neutral') {
      setStability('Neutral');
      setHPBL(750);
      setInversionStrength(1.5);
      setUg(14.0);
      setSurfaceTemp(21.0);
    } else if (preset === 'inversion') {
      setStability('Stable');
      setHPBL(380);
      setInversionStrength(3.8);
      setUg(7.0);
      setSurfaceTemp(14.5);
    } else if (preset === 'marine') {
      setStability('Stable');
      setHPBL(450);
      setInversionStrength(2.8);
      setUg(8.5);
      setSurfaceTemp(19.0);
    }
  };

  return (
    <DraggableWindow
      title={
        <div className="flex items-center gap-2 text-cyan-300">
          <Cloud className="w-4 h-4 text-cyan-400" />
          <span>Perfilado Vertical de la Capa Límite Planetaria (PBL Zᵢ &amp; MOST)</span>
        </div>
      }
      subtitle="Teoría de Semejanza de Monin-Obukhov, Sondeo 1D e Inversión Térmica en la Bahía de Málaga"
      icon={<Layers className="w-4 h-4 text-cyan-400" />}
      onClose={onClose}
      className="w-[96vw] max-w-[1100px] h-[85vh] max-h-[750px]"
    >
      <div className="flex flex-col h-full bg-slate-950 text-slate-200 text-xs overflow-hidden">
        {/* Banner de Sincronización del Punto Activo */}
        <ActivePointSyncBanner />

        {/* Top Header Controls Bar */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-black/50 border border-slate-700 px-2 py-1 rounded">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] text-slate-300 font-mono">
                Viento Sup: <strong className="text-emerald-400">{liveWindSpeed.toFixed(1)} m/s</strong> ({liveWindDir}°)
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/50 border border-slate-700 px-2 py-1 rounded">
              <Thermometer className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[10px] text-slate-300 font-mono">
                T_sup: <strong className="text-rose-400">{surfaceTemp.toFixed(1)} °C</strong> | HR: <strong className="text-sky-400">{liveRH}%</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/50 border border-slate-700 px-2 py-1 rounded">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-slate-300 font-mono">
                L_MO: <strong className="text-amber-400">{mostBase.moninObukhovLengthL.toFixed(1)} m</strong> ({mostBase.stabilityClass})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers con Tooltips Científicos */}
            <div className="flex bg-slate-950 border border-slate-700 rounded p-0.5">
              <ScientificTooltip content="Perfil vertical 1D de temperatura y viento resolviendo la ecuación barométrica y el gradiente adiabático seco Γ_d = 9.8 K/km (Stull 1988)." position="bottom">
                <button
                  onClick={() => setActiveTab('sounding')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                    activeTab === 'sounding' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sondeo 1D
                </button>
              </ScientificTooltip>
              <ScientificTooltip content="Difusividad turbulenta vertical K_z(z) (Holtslag & Boville 1993) y frecuencia de estabilidad estática de Brunt-Väisälä N² = (g/θ)(∂θ/∂z)." position="bottom">
                <button
                  onClick={() => setActiveTab('diffusivity')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                    activeTab === 'diffusivity' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Difusividad K_z &amp; N²
                </button>
              </ScientificTooltip>
              <ScientificTooltip content="Teoría de Semejanza de Monin-Obukhov (MOST 1954) con funciones empíricas universales de Businger-Dyer para flujos superficiales." position="bottom">
                <button
                  onClick={() => setActiveTab('most_turbulence')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                    activeTab === 'most_turbulence' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Turbulencia MOST
                </button>
              </ScientificTooltip>
              <ScientificTooltip content="Estructura estratificada de la capa de mezcla h_PBL, inversiones térmicas de subsidencia y brisa marina en Málaga." position="bottom">
                <button
                  onClick={() => setActiveTab('diagram')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                    activeTab === 'diagram' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Diagrama Inversión
                </button>
              </ScientificTooltip>
            </div>

            {/* FAIR Export */}
            <div className="flex items-center gap-1.5">
              <ScientificTooltip content="Exportar perfil micrometeorológico en formato estándar espacial GeoJSON." position="bottom">
                <button
                  onClick={handleExportGeoJson}
                  className="flex items-center gap-1 px-2 py-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-300 rounded text-[10px] font-bold transition-colors"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>GeoJSON</span>
                </button>
              </ScientificTooltip>
              <ScientificTooltip content="Exportar matriz vertical completa (altitud 0-1500m, u(z), T(z), Kz, N² y C(z)) en formato estandarizado CSV FAIR para reanálisis." position="bottom">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1 px-2 py-1 bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700 text-emerald-300 rounded text-[10px] font-bold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV (FAIR)</span>
                </button>
              </ScientificTooltip>
            </div>
          </div>
        </div>

        {/* Preset Quick Buttons con Tooltips Científicos */}
        <div className="px-3 py-1.5 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Escenarios Canónicos:</span>
            <ScientificTooltip content="Régimen convectivo inestable diurno dominado por flotabilidad térmica (Flujo de calor sensible H > 0, L_MO < 0)." position="bottom">
              <button
                onClick={() => applyPreset('convective')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-900/50 rounded text-[9px] font-mono transition-colors"
              >
                ☀ Convectivo Diurno
              </button>
            </ScientificTooltip>
            <ScientificTooltip content="Régimen casi-neutro dominado por cizalla mecánica del viento fuerte (Flujo de calor H ≈ 0, |L_MO| >> 1000m)." position="bottom">
              <button
                onClick={() => applyPreset('neutral')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-900/50 rounded text-[9px] font-mono transition-colors"
              >
                💨 Neutro Viento Fuerte
              </button>
            </ScientificTooltip>
            <ScientificTooltip content="Régimen estable nocturno con inversión térmica radiativa de superficie y supresión de la turbulencia vertical (H < 0, L_MO > 0)." position="bottom">
              <button
                onClick={() => applyPreset('inversion')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-900/50 rounded text-[9px] font-mono transition-colors"
              >
                🛑 Inversión Nocturna
              </button>
            </ScientificTooltip>
            <ScientificTooltip content="Inversión térmica marina costera por advección de brisa húmeda sobre la Bahía de Málaga (Gryning & Batchvarova 1994)." position="bottom">
              <button
                onClick={() => applyPreset('marine')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-900/50 rounded text-[9px] font-mono transition-colors"
              >
                🌊 Inversión Marina Litoral
              </button>
            </ScientificTooltip>
          </div>

          <div className="text-[9px] font-mono text-slate-400">
            Criterio: <strong className="text-cyan-300">Gryning-Batchvarova &amp; MOST Businger-Dyer</strong>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 flex-1 min-h-0 overflow-y-auto">
          {/* Controls Sidebar */}
          <div className="md:col-span-1 space-y-3 bg-slate-900/60 p-3 rounded border border-slate-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Parámetros de Forzamiento
                </span>
                <span className="text-[9px] font-mono text-cyan-400">{stability}</span>
              </div>

              {/* Regime Selector */}
              <div>
                <label className="text-[9.5px] text-slate-400 flex justify-between mb-1">
                  <span>Régimen de Estabilidad:</span>
                  <ScientificTooltip content="Clase de estabilidad térmica y mecánica según el flujo de calor sensible y cizalla del viento." position="right">
                    <Info className="w-3 h-3 text-slate-500" />
                  </ScientificTooltip>
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-700 text-[10px] rounded p-1 text-slate-200 focus:outline-none focus:border-cyan-500"
                  value={stability}
                  onChange={(e) => setStability(e.target.value as any)}
                >
                  <option value="Unstable">Inestable (Convección Diurna / H &gt; 0)</option>
                  <option value="Neutral">Neutro (Cizalla Mecánica / H ≈ 0)</option>
                  <option value="Stable">Estable (Inversión Térmica / H &lt; 0)</option>
                </select>
              </div>

              {/* PBL Height Slider */}
              <div>
                <div className="flex justify-between text-[9.5px] mb-1">
                  <span className="text-slate-300 flex items-center gap-1">
                    Tope Capa Mezcla (h_PBL):
                    <ScientificTooltip content="Altura de la capa límite planetaria donde cesa la mezcla turbulenta superficial (m)." position="right">
                      <Info className="w-3 h-3 text-slate-500" />
                    </ScientificTooltip>
                  </span>
                  <span className="text-cyan-400 font-mono font-bold">{hPBL} m</span>
                </div>
                <input
                  type="range"
                  min={150}
                  max={1400}
                  step={25}
                  value={hPBL}
                  onChange={(e) => setHPBL(Number(e.target.value))}
                  className="w-full accent-cyan-500 h-1 bg-slate-800 rounded"
                />
              </div>

              {/* Geostrophic Wind Slider */}
              <div>
                <div className="flex justify-between text-[9.5px] mb-1">
                  <span className="text-slate-300 flex items-center gap-1">
                    Viento Geostrófico (U_g):
                    <ScientificTooltip content="Velocidad del flujo libre en la troposfera media no afectada por la rugosidad superficial (m/s)." position="right">
                      <Info className="w-3 h-3 text-slate-500" />
                    </ScientificTooltip>
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">{ug.toFixed(1)} m/s</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={25}
                  step={0.5}
                  value={ug}
                  onChange={(e) => setUg(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1 bg-slate-800 rounded"
                />
              </div>

              {/* Inversion Strength Slider */}
              <div>
                <div className="flex justify-between text-[9.5px] mb-1">
                  <span className="text-slate-300 flex items-center gap-1">
                    Gradiente Térmico Inversión:
                    <ScientificTooltip content="Tasa de calentamiento vertical en la zona de inversión de subsidencia o radiativa (K/100m)." position="right">
                      <Info className="w-3 h-3 text-slate-500" />
                    </ScientificTooltip>
                  </span>
                  <span className="text-rose-400 font-mono font-bold">{inversionStrength.toFixed(1)} K/100m</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={6.0}
                  step={0.1}
                  value={inversionStrength}
                  onChange={(e) => setInversionStrength(Number(e.target.value))}
                  className="w-full accent-rose-500 h-1 bg-slate-800 rounded"
                />
              </div>

              {/* Surface NOx Concentration Slider */}
              <div>
                <div className="flex justify-between text-[9.5px] mb-1">
                  <span className="text-slate-300 flex items-center gap-1">
                    Concentración Base Superficial:
                    <ScientificTooltip content="Concentración en nivel de calle generada por tráfico y emisiones urbanas (µg/m³)." position="right">
                      <Info className="w-3 h-3 text-slate-500" />
                    </ScientificTooltip>
                  </span>
                  <span className="text-purple-400 font-mono font-bold">{surfaceConcentration} µg/m³</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={120}
                  step={2}
                  value={surfaceConcentration}
                  onChange={(e) => setSurfaceConcentration(Number(e.target.value))}
                  className="w-full accent-purple-500 h-1 bg-slate-800 rounded"
                />
              </div>
            </div>

            {/* Diagnostic Summary Panel */}
            <div className="p-2.5 bg-black/60 border border-slate-800 rounded text-[9px] font-mono space-y-1 text-slate-300">
              <div className="text-cyan-300 font-bold border-b border-slate-800 pb-0.5 mb-1">
                Diagnóstico Micrometeorológico
              </div>
              <div className="flex justify-between">
                <span>Velocidad Fricción u*:</span>
                <span className="text-emerald-400">{mostBase.uStarMs.toFixed(3)} m/s</span>
              </div>
              <div className="flex justify-between">
                <span>Flujo Calor H_s:</span>
                <span className="text-amber-400">{mostBase.sensibleHeatFluxWm2.toFixed(1)} W/m²</span>
              </div>
              <div className="flex justify-between">
                <span>Difusividad Máxima Kz_max:</span>
                <span className="text-sky-400">
                  {Math.max(...verticalProfileData.map(d => d.kz_diffusivity)).toFixed(1)} m²/s
                </span>
              </div>
              <div className="flex justify-between">
                <span>Ratio Atrapamiento:</span>
                <span className="text-rose-400">
                  {stability === 'Stable' ? '2.2x (Crítico)' : stability === 'Neutral' ? '1.3x' : '1.0x (Dispersivo)'}
                </span>
              </div>
            </div>
          </div>

          {/* Visualization Canvas (Right 3 columns) */}
          <div className="md:col-span-3 flex flex-col gap-3 min-h-0">
            {activeTab === 'sounding' && (
              <div className="grid grid-cols-3 gap-2 h-full min-h-[380px]">
                {/* 1. Perfil de Velocidad */}
                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-emerald-400 font-mono">VIENTO u(z) [m/s]</span>
                    <span className="text-[8.5px] text-slate-400">Logarítmico MOST</span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={verticalProfileData} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" stroke="#64748b" fontSize={9} domain={[0, 25]} />
                        <YAxis dataKey="z" type="number" stroke="#64748b" fontSize={9} domain={[0, 1500]} unit="m" />
                        <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '10px', fontFamily: 'monospace' }} />
                        <ReferenceLine y={hPBL} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `Tope h=${hPBL}m`, fill: '#f59e0b', fontSize: 9, position: 'insideTopLeft' }} />
                        <Line type="monotone" dataKey="u_velocity" name="Viento u(z)" stroke="#10b981" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Perfil de Temperatura y Theta */}
                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-rose-400 font-mono">TEMPERATURA T(z) [°C]</span>
                    <span className="text-[8.5px] text-slate-400">Inversión Termal</span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={verticalProfileData} layout="vertical" margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" stroke="#64748b" fontSize={9} domain={['dataMin - 1', 'dataMax + 1']} />
                        <YAxis dataKey="z" type="number" stroke="#64748b" fontSize={9} domain={[0, 1500]} hide />
                        <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '10px', fontFamily: 'monospace' }} />
                        <ReferenceLine y={hPBL} stroke="#f59e0b" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="temperature" name="T(z) Real" stroke="#ef4444" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="theta_c" name="θ(z) Potencial" stroke="#f97316" strokeDasharray="4 2" strokeWidth={1.5} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. Perfil de Concentración */}
                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-purple-400 font-mono">CONCENTRACIÓN C(z) [µg/m³]</span>
                    <span className="text-[8.5px] text-slate-400">Atrapamiento</span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={verticalProfileData} layout="vertical" margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" stroke="#64748b" fontSize={9} domain={[0, 'dataMax + 5']} />
                        <YAxis dataKey="z" type="number" stroke="#64748b" fontSize={9} domain={[0, 1500]} hide />
                        <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '10px', fontFamily: 'monospace' }} />
                        <ReferenceLine y={hPBL} stroke="#f59e0b" strokeDasharray="3 3" />
                        <Area type="monotone" dataKey="concentration" name="NOx/PM (µg/m³)" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'diffusivity' && (
              <div className="grid grid-cols-2 gap-3 h-full min-h-[380px]">
                {/* 1. Difusividad Turbulenta Kz */}
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-cyan-400 font-mono">DIFUSIVIDAD VERTICAL K_z(z) [m²/s]</span>
                    <span className="text-[8.5px] text-slate-400">Holtslag &amp; Boville</span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={verticalProfileData} layout="vertical" margin={{ top: 5, right: 15, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" stroke="#64748b" fontSize={9} />
                        <YAxis dataKey="z" type="number" stroke="#64748b" fontSize={9} domain={[0, 1500]} unit="m" />
                        <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '10px', fontFamily: 'monospace' }} />
                        <ReferenceLine y={hPBL} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `Tope h=${hPBL}m`, fill: '#f59e0b', fontSize: 9 }} />
                        <Area type="monotone" dataKey="kz_diffusivity" name="Kz (m²/s)" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Brunt-Väisälä N² */}
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-amber-400 font-mono">ESTABILIDAD ESTÁTICA N²(z) [10⁻³ s⁻²]</span>
                    <span className="text-[8.5px] text-slate-400">Frecuencia Brunt-Väisälä</span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={verticalProfileData} layout="vertical" margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" stroke="#64748b" fontSize={9} />
                        <YAxis dataKey="z" type="number" stroke="#64748b" fontSize={9} domain={[0, 1500]} hide />
                        <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '10px', fontFamily: 'monospace' }} />
                        <ReferenceLine x={0} stroke="#64748b" />
                        <ReferenceLine y={hPBL} stroke="#f59e0b" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="brunt_n2" name="N² (x10⁻³ s⁻²)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'most_turbulence' && (
              <div className="h-full flex flex-col justify-start">
                <MoninObukhovTurbulenceDiagram
                  windSpeedMs={windSpeedSurface}
                  solarRadWm2={stability === 'Unstable' ? solarRadiationWm2 : 10}
                  airTempC={surfaceTemp}
                  isNight={stability === 'Stable'}
                  roughnessZ0={surfaceZ0}
                />
              </div>
            )}

            {activeTab === 'diagram' && (
              <div className="h-full flex flex-col justify-center">
                <BoundaryLayerInversionDiagram
                  hPBL={hPBL}
                  stability={stability}
                  surfaceTemp={surfaceTemp}
                  inversionStrength={inversionStrength}
                  surfaceConcentration={surfaceConcentration}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
}
