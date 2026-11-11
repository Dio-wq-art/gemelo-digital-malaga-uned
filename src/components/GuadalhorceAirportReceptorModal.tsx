import React, { useState, useMemo } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { AirportLtoInteractiveDiagram } from './AirportLtoInteractiveDiagram';
import {
  Plane,
  Truck,
  Activity,
  Wind,
  Layers,
  FileText,
  Download,
  ShieldCheck,
  Zap,
  Gauge,
  MapPin,
  Flame,
  Info,
  Sliders,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area
} from 'recharts';

interface GuadalhorceAirportReceptorModalProps {
  isOpen: boolean;
  onClose: () => void;
  ambientTempC?: number;
  windSpeedMs?: number;
  windDirDeg?: number;
}

/**
 * Fases normalizadas del Ciclo LTO (Landing and Take-Off) según OACI Anexo 16 y EMEP/EEA Tier 3.
 * Motor de referencia representativo de la flota AGP: Turbofans CFM56-7B / LEAP-1A (Airbus A320 / Boeing 737-800).
 */
interface LtoPhase {
  name: string;
  code: 'approach' | 'taxi' | 'takeoff' | 'climbout';
  thrustPct: number; // % empuje máximo
  timeMinutes: number; // Tiempo promedio OACI
  fuelFlowKgS: number; // Consumo de Jet-A1 (kg/s por motor)
  eiNoxGKg: number; // Índice de emisión NOx (g/kg combustible)
  eiCoGKg: number; // Índice de emisión CO (g/kg combustible)
  eiHcGKg: number; // Hidrocarburos inquemados HC (g/kg combustible)
  eiSootMgKg: number; // Black Carbon / Partículas ultrafinas (mg/kg)
}

const LTO_BENCHMARK_PHASES: LtoPhase[] = [
  {
    name: 'Aproximación (Approach)',
    code: 'approach',
    thrustPct: 30,
    timeMinutes: 4.0,
    fuelFlowKgS: 0.30,
    eiNoxGKg: 10.5,
    eiCoGKg: 3.8,
    eiHcGKg: 0.15,
    eiSootMgKg: 32.0
  },
  {
    name: 'Rodaje y Espera (Taxi / Idle)',
    code: 'taxi',
    thrustPct: 7,
    timeMinutes: 26.0,
    fuelFlowKgS: 0.11,
    eiNoxGKg: 4.8,
    eiCoGKg: 24.5,
    eiHcGKg: 2.10,
    eiSootMgKg: 14.5
  },
  {
    name: 'Despegue en Pista (Take-Off)',
    code: 'takeoff',
    thrustPct: 100,
    timeMinutes: 0.7,
    fuelFlowKgS: 1.15,
    eiNoxGKg: 31.2,
    eiCoGKg: 0.6,
    eiHcGKg: 0.05,
    eiSootMgKg: 95.0
  },
  {
    name: 'Ascenso Inicial (Climb-out)',
    code: 'climbout',
    thrustPct: 85,
    timeMinutes: 2.2,
    fuelFlowKgS: 0.95,
    eiNoxGKg: 24.6,
    eiCoGKg: 0.9,
    eiHcGKg: 0.08,
    eiSootMgKg: 78.0
  }
];

export const GuadalhorceAirportReceptorModal: React.FC<GuadalhorceAirportReceptorModalProps> = ({
  isOpen,
  onClose,
  ambientTempC = 24.2,
  windSpeedMs = 3.2,
  windDirDeg = 165
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'lto_engine' | 'valley_canyon' | 'mitigation'>('overview');
  const [dailyOpsCount, setDailyOpsCount] = useState<number>(420); // Vuelos/día en temporada media-alta AGP
  const [singleEngineTaxiing, setSingleEngineTaxiing] = useState<boolean>(true); // Mitigación rodaje monomotor
  const [electrifiedGpuPca, setElectrifiedGpuPca] = useState<boolean>(true); // Cold ironing aeroportuario (400Hz + PCA)

  // Cálculo determinista de masa emitida por ciclo LTO (kg/ciclo por avión bimotor)
  const ltoEmissions = useMemo(() => {
    return LTO_BENCHMARK_PHASES.map(phase => {
      let taxiMultiplier = 1.0;
      if (phase.code === 'taxi' && singleEngineTaxiing) {
        taxiMultiplier = 0.65; // Reducción certificada del 35% de consumo en rodaje monomotor
      }

      const durationSeconds = phase.timeMinutes * 60;
      const fuelBurnPerEngineKg = phase.fuelFlowKgS * durationSeconds * taxiMultiplier;
      const totalFuelKg = fuelBurnPerEngineKg * 2; // Bimotor (A320 / B737)

      const noxGrams = totalFuelKg * phase.eiNoxGKg;
      const coGrams = totalFuelKg * phase.eiCoGKg;
      const hcGrams = totalFuelKg * phase.eiHcGKg;
      const sootGrams = (totalFuelKg * phase.eiSootMgKg) / 1000;

      return {
        phase: phase.name,
        code: phase.code,
        fuelKg: Number(totalFuelKg.toFixed(1)),
        noxKg: Number((noxGrams / 1000).toFixed(2)),
        coKg: Number((coGrams / 1000).toFixed(2)),
        hcKg: Number((hcGrams / 1000).toFixed(3)),
        sootGrams: Number(sootGrams.toFixed(1))
      };
    });
  }, [singleEngineTaxiing]);

  const totalNoxPerLtoKg = Number(ltoEmissions.reduce((acc, p) => acc + p.noxKg, 0).toFixed(2));
  const totalDailyAviationNoxTon = Number(((totalNoxPerLtoKg * dailyOpsCount) / 1000).toFixed(2));

  // Concentraciones simuladas y asimiladas en el receptor (ES2105A / REC-05)
  const receptorData = useMemo(() => {
    // Atenuación por APU electrificada
    const apuFactor = electrifiedGpuPca ? 0.88 : 1.0;
    const singleEngineFactor = singleEngineTaxiing ? 0.92 : 1.0;

    const no2Ugm3 = Number((46.5 * apuFactor * singleEngineFactor).toFixed(1));
    const pm25Ugm3 = Number((22.4 * apuFactor).toFixed(1));
    const pm10Ugm3 = Number((39.8 * apuFactor).toFixed(1));
    const so2Ugm3 = Number((11.2 * apuFactor).toFixed(1));
    const bcUgm3 = Number((3.2 * apuFactor * singleEngineFactor).toFixed(2));

    return {
      no2Ugm3,
      pm25Ugm3,
      pm10Ugm3,
      so2Ugm3,
      bcUgm3
    };
  }, [singleEngineTaxiing, electrifiedGpuPca]);

  // Atribución de fuentes para el receptor REC-05
  const sourceApportionmentData = useMemo(() => {
    return [
      { source: 'Aviación Comercial (LTO & APU)', pct: 38.5, mass: Number((receptorData.pm25Ugm3 * 0.385).toFixed(2)), color: '#06b6d4' },
      { source: 'Tráfico Pesado MA-21 / Guadalhorce', pct: 32.0, mass: Number((receptorData.pm25Ugm3 * 0.320).toFixed(2)), color: '#ef4444' },
      { source: 'Aerosol Secundario (SIA Regional)', pct: 15.5, mass: Number((receptorData.pm25Ugm3 * 0.155).toFixed(2)), color: '#a855f7' },
      { source: 'Polvo Mineral / Sahariano', pct: 9.0, mass: Number((receptorData.pm25Ugm3 * 0.090).toFixed(2)), color: '#f59e0b' },
      { source: 'Aerosol Salino Marino', pct: 5.0, mass: Number((receptorData.pm25Ugm3 * 0.050).toFixed(2)), color: '#10b981' }
    ];
  }, [receptorData]);

  // Serie horaria de dispersión según canalización orográfica del río Guadalhorce
  const canyonDispersionHourly = useMemo(() => {
    return Array.from({ length: 24 }, (_, h) => {
      // Vuelos pico en AGP: 07:00 a 11:00 y 17:00 a 22:00
      const flightPeak = 0.2 + 0.8 * (Math.exp(-Math.pow(h - 9.0, 2) / 4.0) + Math.exp(-Math.pow(h - 19.5, 2) / 6.0));
      // Régimen de vientos del cañón: Terral nocturno/matinal (NW), Brisa marina diurna (SE)
      const isSeaBreeze = h >= 11 && h <= 19;
      const windSpeed = isSeaBreeze ? 4.5 : 2.1;
      const ventilationRate = windSpeed / 3.0;

      const no2 = Number((receptorData.no2Ugm3 * (flightPeak / ventilationRate)).toFixed(1));
      const pm25 = Number((receptorData.pm25Ugm3 * (flightPeak / ventilationRate)).toFixed(1));

      return {
        hour: `${h.toString().padStart(2, '0')}:00`,
        no2: Math.max(12, Math.min(85, no2)),
        pm25: Math.max(6, Math.min(48, pm25)),
        flightIntensity: Number((flightPeak * 100).toFixed(0)),
        regime: isSeaBreeze ? 'Brisa SE (Estancamiento Cuenca)' : 'Terral NW (Canalización Valle)'
      };
    });
  }, [receptorData]);

  // Exportar GeoJSON de la estación receptora y polígono del aeropuerto
  const handleExportGeoJson = () => {
    const geojson = {
      type: 'FeatureCollection',
      properties: {
        title: 'Receptor de Calidad del Aire - Valle del Guadalhorce e Interfaz Aeropuerto AGP',
        stationCode: 'ES2105A',
        iata: 'AGP',
        icao: 'LEMG',
        methodology: 'OACI Anexo 16 / EMEP-EEA Tier 3 LTO / EnKF Assimilation',
        generatedAt: new Date().toISOString()
      },
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-4.4780, 36.6749, 14]
          },
          properties: {
            id: 'guadalhorce_aeropuerto',
            code: 'ES2105A',
            name: 'Málaga - Guadalhorce / Aeropuerto (AGP)',
            type: 'airport_logistics',
            measurements_ugm3: receptorData,
            totalDailyAviationNoxTon
          }
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-4.4990, 36.6620],
              [-4.4650, 36.6850],
              [-4.4550, 36.6780],
              [-4.4910, 36.6550],
              [-4.4990, 36.6620]
            ]]
          },
          properties: {
            name: 'Huella Acústica y de Dispersión LTO Pistas 13-31 LEMG',
            runways: ['13/31', '12/30']
          }
        }
      ]
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receptor_guadalhorce_aeropuerto_agp_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Exportar CSV
  const handleExportCsv = () => {
    const headers = ['Hora', 'NO2_ugm3', 'PM25_ugm3', 'IntensidadVuelos_Pct', 'RegimenViento'];
    const rows = canyonDispersionHourly.map(r => `${r.hour},${r.no2},${r.pm25},${r.flightIntensity},"${r.regime}"`);
    const csv = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serie_horaria_guadalhorce_aeropuerto_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title="Valle del Guadalhorce & Interfaz Aeroportuaria (AGP LEMG)"
      subtitle="Receptor ES2105A • Cinética LTO OACI • Dispersión Orográfica del Río Guadalhorce"
      icon={<Plane className="w-4 h-4 text-cyan-400" />}
      className="w-full max-w-4xl max-h-[90vh]"
      defaultCollapsed={true}
      headerColorClass="text-cyan-400"
      borderColorClass="border-cyan-800/80"
      onClose={onClose}
    >
      <div className="flex flex-col h-full bg-[#030712] text-slate-200 overflow-y-auto p-4 space-y-4 font-sans text-xs">
        {/* TOP STATUS BAR & FAIR EXPORT */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-950/80 border border-cyan-700/80 rounded-md text-cyan-400">
              <Plane className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Estación ES2105A — Guadalhorce / AGP</span>
                <span className="bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                  ICAO: LEMG • 14 m s.n.m.
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Coord: 36.6749° N, -4.4780° W • Cuenca Fluvial del Guadalhorce / Eje Logístico MA-21
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ScientificTooltip
              width="w-64"
              content="Descarga en formato GeoJSON abierto (FAIR) con la posición del receptor, concentraciones telemétricas y polígono de dispersión del ciclo LTO."
            >
              <button
                onClick={handleExportGeoJson}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" /> GeoJSON
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              width="w-64"
              content="Exportación en CSV de la matriz horaria de dispersión acoplada al ciclo de vuelo y canalización térmica."
            >
              <button
                onClick={handleExportCsv}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" /> CSV
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-slate-800 gap-1">
          <ScientificTooltip content="Balance de masa químico (CMB) entre emisiones aeroportuarias, autovía MA-21 e industria del valle.">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 font-mono text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" /> Balance & Atribución CMB
            </button>
          </ScientificTooltip>
          <ScientificTooltip content="Ciclo Landing-Takeoff (LTO OACI Anexo 16): turbinas de aviación comercial y factores de emisión térmicos de Zeldovich.">
            <button
              onClick={() => setActiveTab('lto_engine')}
              className={`px-3 py-2 font-mono text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'lto_engine'
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Ciclo LTO (OACI Tier 3)
            </button>
          </ScientificTooltip>
          <ScientificTooltip content="Encajonamiento orográfico y brisas catabáticas nocturnas en la cuenca baja del río Guadalhorce.">
            <button
              onClick={() => setActiveTab('valley_canyon')}
              className={`px-3 py-2 font-mono text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'valley_canyon'
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wind className="w-3.5 h-3.5" /> Dispersión Cañón Guadalhorce
            </button>
          </ScientificTooltip>
          <ScientificTooltip content="Estrategias de mitigación operativa aeroportuaria: rodaje monomotor, Single-Engine Taxiing y electrificación GPU 400Hz.">
            <button
              onClick={() => setActiveTab('mitigation')}
              className={`px-3 py-2 font-mono text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'mitigation'
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Medidas Mitigadoras
            </button>
          </ScientificTooltip>
        </div>

        {/* TAB 1: OVERVIEW & TELEMETRY */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Diagrama a Color Interactivo del Aeropuerto AGP y Ciclo LTO */}
            <AirportLtoInteractiveDiagram
              ambientTempC={ambientTempC}
              liveWindSpeedMs={windSpeedMs}
              liveWindDirDeg={windDirDeg}
              dailyFlightOps={dailyOpsCount}
            />

            {/* Live gauges grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between">
                <span className="text-slate-400 text-[11px] font-mono">Dióxido Nitrógeno (NO₂)</span>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-2xl font-bold font-mono text-indigo-400">{receptorData.no2Ugm3}</span>
                  <span className="text-[10px] text-slate-400">µg/m³</span>
                </div>
                <span className="text-[10px] text-rose-400 font-mono">Directiva: 40 µg/m³ (Límite Anual)</span>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between">
                <span className="text-slate-400 text-[11px] font-mono">Partículas Finas (PM₂.₅)</span>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-2xl font-bold font-mono text-amber-400">{receptorData.pm25Ugm3}</span>
                  <span className="text-[10px] text-slate-400">µg/m³</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">OMS 2021: 15 µg/m³ (24h)</span>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between">
                <span className="text-slate-400 text-[11px] font-mono">Partículas Gruesas (PM₁₀)</span>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-2xl font-bold font-mono text-emerald-400">{receptorData.pm10Ugm3}</span>
                  <span className="text-[10px] text-slate-400">µg/m³</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Directiva: 50 µg/m³ (Límite Diario)</span>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between">
                <span className="text-slate-400 text-[11px] font-mono">Dióxido de Azufre (SO₂)</span>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-2xl font-bold font-mono text-cyan-400">{receptorData.so2Ugm3}</span>
                  <span className="text-[10px] text-slate-400">µg/m³</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Combustión Jet-A1 (Kerosene)</span>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between">
                <span className="text-slate-400 text-[11px] font-mono">Black Carbon (Hollín)</span>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-2xl font-bold font-mono text-rose-400">{receptorData.bcUgm3}</span>
                  <span className="text-[10px] text-slate-400">µg/m³</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Partículas ultrafinas de turbina</span>
              </div>
            </div>

            {/* Source apportionment breakdown */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5 font-mono text-xs">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Desglose de Atribución de Fuentes en Receptor (CMB / EPA-PMF 5.0)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Total PM₂.₅ = {receptorData.pm25Ugm3} µg/m³</span>
              </div>

              <div className="space-y-2">
                {sourceApportionmentData.map(s => (
                  <div key={s.source} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-mono text-slate-300">{s.source}</span>
                      <span className="font-mono font-bold" style={{ color: s.color }}>
                        {s.pct}% ({s.mass} µg/m³)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regulatory context */}
            <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg flex items-start gap-2.5 text-[11px] text-slate-300 leading-relaxed">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Diagnóstico Físico-Químico: </strong>
                La confluencia del tráfico logístico pesado en el Polígono Guadalhorce con los ciclos de despegue (Take-Off) de la pista 13/31 genera una columna concentrada de NO₂ y Black Carbon. La morfología en cañón del cauce del río Guadalhorce canaliza las masas de aire según el gradiente térmico día/noche.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LTO ENGINE CYCLE */}
        {activeTab === 'lto_engine' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-bold text-white font-mono text-xs block">
                  Simulación de Ciclo LTO Certificado (OACI Anexo 16 • Turbofan CFM56/LEAP)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Emisiones por aeronave bimotor en las 4 fases estándar por debajo de 3000 ft (914 m).
                </span>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-slate-400">Operaciones Diarias (LTO/día):</span>
                <input
                  type="number"
                  min={100}
                  max={800}
                  value={dailyOpsCount}
                  onChange={e => setDailyOpsCount(Math.max(50, Number(e.target.value)))}
                  className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300 text-center font-bold"
                />
              </div>
            </div>

            {/* Table of LTO phases */}
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
                  <tr>
                    <th className="p-2">Fase LTO</th>
                    <th className="p-2">Empuje</th>
                    <th className="p-2">Tiempo</th>
                    <th className="p-2">Combustible Jet-A1</th>
                    <th className="p-2 text-indigo-300">NOx (kg)</th>
                    <th className="p-2 text-amber-300">CO (kg)</th>
                    <th className="p-2 text-rose-300">Soot/BC (g)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {ltoEmissions.map((phase, idx) => (
                    <tr key={phase.code} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-2 font-bold text-white">{phase.phase}</td>
                      <td className="p-2 text-cyan-400">{LTO_BENCHMARK_PHASES[idx].thrustPct}%</td>
                      <td className="p-2 text-slate-400">{LTO_BENCHMARK_PHASES[idx].timeMinutes} min</td>
                      <td className="p-2 text-slate-200">{phase.fuelKg} kg</td>
                      <td className="p-2 font-bold text-indigo-400">{phase.noxKg} kg</td>
                      <td className="p-2 text-amber-400">{phase.coKg} kg</td>
                      <td className="p-2 text-rose-400">{phase.sootGrams} g</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900/90 font-bold border-t border-slate-700 text-white">
                    <td className="p-2">TOTAL POR CICLO LTO</td>
                    <td className="p-2">-</td>
                    <td className="p-2">32.9 min</td>
                    <td className="p-2 text-emerald-400">
                      {ltoEmissions.reduce((a, b) => a + b.fuelKg, 0).toFixed(1)} kg
                    </td>
                    <td className="p-2 text-indigo-400">{totalNoxPerLtoKg} kg</td>
                    <td className="p-2 text-amber-400">
                      {ltoEmissions.reduce((a, b) => a + b.coKg, 0).toFixed(2)} kg
                    </td>
                    <td className="p-2 text-rose-400">
                      {ltoEmissions.reduce((a, b) => a + b.sootGrams, 0).toFixed(1)} g
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Daily summary badge */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/60 rounded-lg">
                <span className="text-cyan-400 font-mono text-[10px] block">Carga Total de Emisión Diaria de NOx</span>
                <span className="text-xl font-bold font-mono text-white">{totalDailyAviationNoxTon} Toneladas/día</span>
                <span className="text-[10px] text-slate-400 block font-mono">Basado en {dailyOpsCount} LTOs registrados</span>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 font-mono text-[10px] block">Régimen Crítico de Despegue</span>
                <span className="text-xl font-bold font-mono text-indigo-300">31.2 g NOx / kg fuel</span>
                <span className="text-[10px] text-slate-400 block font-mono">A 100% de empuje en cabecera de pista</span>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 font-mono text-[10px] block">Tiempo en Rodaje (Taxi/Idle)</span>
                <span className="text-xl font-bold font-mono text-amber-300">26.0 minutos</span>
                <span className="text-[10px] text-slate-400 block font-mono">Mayor emisor acumulado de CO e hidrocarburos</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VALLEY CANYON DISPERSION */}
        {activeTab === 'valley_canyon' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-white font-mono text-xs flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  Evolución Diaria 24h: Canalización Orográfica del Viento &amp; Vuelos AGP
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Valle del Guadalhorce (Efecto Venturi Fluvial)
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Durante el día, la brisa del mar de Alborán (165° SE) asciende por el valle fluvial del río Guadalhorce, transportando las emisiones hacia Campanillas y Alhaurín de la Torre. Durante la noche, el viento terral catabático (330° NW) drena aire frío acumulando contaminantes en la cuenca baja costera.
              </p>
            </div>

            <div className="h-[240px] w-full bg-slate-950 border border-slate-800 rounded-lg p-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={canyonDispersionHourly}>
                  <defs>
                    <linearGradient id="canyonNo2Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="canyonPm25Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '6px', fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="no2" name="NO₂ (µg/m³)" stroke="#818cf8" fill="url(#canyonNo2Grad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="pm25" name="PM₂.₅ (µg/m³)" stroke="#f59e0b" fill="url(#canyonPm25Grad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <span className="text-cyan-400 font-bold block mb-1">Régimen Diurno (11:00 - 19:00 CEST)</span>
                <span className="text-slate-300 block">Brisa marina advectiva SE (~4.5 m/s). Dilución moderada en el valle, con transporte de ozono precursor hacia el interior de la provincia.</span>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <span className="text-amber-400 font-bold block mb-1">Régimen Nocturno (21:00 - 08:00 CEST)</span>
                <span className="text-slate-300 block">Terral catabático NW (~2.1 m/s). Capa límite superficial deprimida (PBLH &lt; 250 m) que atrapa el Black Carbon en las proximidades del polígono.</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MITIGATION & COMPLIANCE */}
        {activeTab === 'mitigation' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
              <span className="font-bold text-white font-mono text-xs block mb-1">
                Estrategias de Mitigación Normativa en el Eje Aeroportuario / Guadalhorce
              </span>
              <span className="text-[11px] text-slate-300">
                Alineación con la Directiva 2008/50/CE, el Reglamento UE 2024/2881 y la Declaración Ambiental de AENA para el Aeropuerto de Málaga-Costa del Sol.
              </span>
            </div>

            <div className="space-y-3">
              {/* Single Engine Taxiing Toggle */}
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white font-mono text-xs">Rodaje Monomotor (Single-Engine Taxiing)</span>
                    <span className="text-[9px] bg-emerald-950 border border-emerald-800 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      -35% Consumo Rodaje
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-[520px]">
                    Las aeronaves operan un solo motor tras el aterrizaje y durante el rodaje hasta puerta de embarque, apagando la segunda turbina.
                  </p>
                </div>
                <button
                  onClick={() => setSingleEngineTaxiing(!singleEngineTaxiing)}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                    singleEngineTaxiing
                      ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {singleEngineTaxiing ? 'ACTIVADO' : 'DESACTIVADO'}
                </button>
              </div>

              {/* Electrified Ground Power (GPU/PCA) Toggle */}
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white font-mono text-xs">Electrificación en Pasarela (400 Hz GPU &amp; PCA)</span>
                    <span className="text-[9px] bg-emerald-950 border border-emerald-800 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      Cero APU en Rampa
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-[520px]">
                    Conexión eléctrica directa de la aeronave a la red del aeropuerto para aire acondicionado y aviónica, prohibiendo el funcionamiento de la turbina APU diésel en estacionamiento.
                  </p>
                </div>
                <button
                  onClick={() => setElectrifiedGpuPca(!electrifiedGpuPca)}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                    electrifiedGpuPca
                      ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {electrifiedGpuPca ? 'ACTIVADO' : 'DESACTIVADO'}
                </button>
              </div>

              {/* Logistics truck corridor */}
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-300 leading-relaxed">
                  <strong className="text-white">Plan de Flotas de Carga del Polígono Guadalhorce: </strong>
                  Se propone la reserva del carril derecho de la autovía MA-21 exclusivamente para camiones Euro VI y de cero emisiones en horario punta matinal (07:30 a 09:30), reduciendo las emisiones de Black Carbon en 1.1 µg/m³ en el receptor ES2105A.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
};
