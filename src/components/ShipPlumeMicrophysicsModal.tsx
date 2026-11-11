import React, { useState, useMemo } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { ShipPlumeMicrophysicsDiagram } from './ShipPlumeMicrophysicsDiagram';
import {
  simulateShipPlumeMicrophysics,
  exportShipPlumeCsv,
  MALAGA_PORT_SHIPS,
  ShipPlumeInput,
  ShipEngineProfile
} from '../lib/shipPlumeMicrophysics';
import {
  Ship,
  Wind,
  Droplets,
  Thermometer,
  ShieldCheck,
  FileSpreadsheet,
  MapPin,
  Sliders,
  Flame,
  Activity,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine
} from 'recharts';

interface Props {
  onClose: () => void;
  ambientTempC?: number;
  relativeHumidity?: number;
  windSpeedMS?: number;
}

export function ShipPlumeMicrophysicsModal({
  onClose,
  ambientTempC = 24.0,
  relativeHumidity = 70,
  windSpeedMS = 3.5
}: Props) {
  const [selectedShip, setSelectedShip] = useState<ShipEngineProfile>(MALAGA_PORT_SHIPS[0]);

  // Simulation Sliders
  const [engineLoadPct, setEngineLoadPct] = useState<number>(65); // 65% en maniobra/aproximación
  const [fuelSulfurPct, setFuelSulfurPct] = useState<number>(0.10); // Med-ECA 0.10%
  const [windSpeed, setWindSpeed] = useState<number>(windSpeedMS);
  const [downwindDistM, setDownwindDistM] = useState<number>(1200); // 1.2 km hasta La Farola/Alameda
  const [supersatPct, setSupersatPct] = useState<number>(0.30); // 0.3% típico de nubes/nieblas litorales

  // Tab State
  const [activeTab, setActiveTab] = useState<'diagram' | 'size_distribution' | 'kohler_curve'>('diagram');

  // Solver Execution
  const input: ShipPlumeInput = useMemo(() => ({
    shipId: selectedShip.id,
    engineLoadPct,
    fuelSulfurPct,
    windSpeedMS: windSpeed,
    ambientTempC,
    relativeHumidityPct: relativeHumidity,
    downwindDistanceM: downwindDistM,
    supersaturationPct: supersatPct
  }), [selectedShip, engineLoadPct, fuelSulfurPct, windSpeed, ambientTempC, relativeHumidity, downwindDistM, supersatPct]);

  const result = useMemo(() => simulateShipPlumeMicrophysics(input), [input]);

  // Köhler Curve Data Calculation across Wet Droplet Diameter D_wet (5 nm to 5000 nm)
  const kohlerCurveData = useMemo(() => {
    const dryDp = result.geometricMeanDiameterNm;
    const kappa = result.effectiveKappa;
    const A_coeff = 2.1; // nm
    const points = [];

    for (let factor = 1.05; factor <= 25; factor += 0.8) {
      const dWet = dryDp * factor;
      // Kelvin term
      const kelvin = A_coeff / dWet;
      // Raoult term (kappa-Köhler)
      const raoult = (kappa * Math.pow(dryDp, 3)) / (Math.pow(dWet, 3) - Math.pow(dryDp, 3));
      const lnS = kelvin - raoult;
      const sPct = (Math.exp(lnS) - 1) * 100;

      points.push({
        dWetNm: Math.round(dWet),
        supersaturationPct: parseFloat(sPct.toFixed(3)),
        dDryNm: Math.round(dryDp)
      });
    }
    return points;
  }, [result]);

  // Export CSV
  const handleExportCSV = () => {
    const csvContent = exportShipPlumeCsv(input, result);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `microfisica_pluma_${selectedShip.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="Microfísica de Plumas Portuarias y Activación CCN (κ-Köhler)"
      icon={<Ship className="w-4 h-4 text-sky-400" />}
      onClose={onClose}
      defaultCollapsed={true}
      className="w-full max-w-4xl max-h-[85vh] bg-slate-950/95 border border-sky-700/80 rounded-xl overflow-hidden p-0"
      headerColorClass="text-sky-300"
    >
      <div className="space-y-3 font-sans text-slate-200">
        {/* Ship Profile Selector */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
              <Ship className="w-3.5 h-3.5" /> Tipología de Buque en Puerto de Málaga:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {MALAGA_PORT_SHIPS.map((sp) => (
                <ScientificTooltip key={sp.id} position="bottom" width="w-[260px]" content={`Buque: ${sp.name}. Potencia: ${sp.enginePowerKw} kW, Caudal chimenea: ${sp.exhaustFlowM3S} m³/s, Altura chimenea: ${sp.stackHeightM} m, Atranque habitual: ${sp.typicalBerthInMalaga}.`}>
                  <button
                    onClick={() => setSelectedShip(sp)}
                    className={`px-2 py-1 rounded text-[9.5px] font-medium transition-all cursor-pointer ${
                      selectedShip.id === sp.id
                        ? 'bg-sky-600 text-white font-bold shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                    title={`Seleccionar buque ${sp.name} (${sp.typicalBerthInMalaga})`}
                  >
                    {sp.name}
                  </button>
                </ScientificTooltip>
              ))}
            </div>
          </div>
          <p className="text-[9.5px] text-slate-400 italic">
            Potencia: {selectedShip.enginePowerKw.toLocaleString()} kW • Caudal chimenea: {selectedShip.exhaustFlowM3S} m³/s • Ubicación: {selectedShip.typicalBerthInMalaga}
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
          <div className="flex gap-2">
            <ScientificTooltip position="bottom" width="w-[280px]" content="Diagrama interactivo de elevación de pluma por flotabilidad térmica (Briggs, 1969) y dispersión gaussiana de penacho en el puerto de Málaga.">
              <button
                onClick={() => setActiveTab('diagram')}
                className={`px-3 py-1 text-xs font-semibold rounded-t-md transition-colors cursor-pointer ${
                  activeTab === 'diagram'
                    ? 'bg-slate-800 text-sky-300 border-b-2 border-sky-500 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Ver diagrama interactivo de elevación de pluma y dispersión"
              >
                Diagrama de Pluma &amp; Dispersión
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Distribución numérico-granulométrica del aerosol de combustión marina dN/dlog(Dp) para modos de nucleación, acumulación y núcleos de condensación de nubes (CCN).">
              <button
                onClick={() => setActiveTab('size_distribution')}
                className={`px-3 py-1 text-xs font-semibold rounded-t-md transition-colors cursor-pointer ${
                  activeTab === 'size_distribution'
                    ? 'bg-slate-800 text-sky-300 border-b-2 border-sky-500 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Ver espectro granulométrico dN/dlog(Dp)"
              >
                Espectro Granulométrico dN/dlog(Dp)
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Curva termodinámica de activación Köhler (teoría kappa-Köhler, Petters & Kreidenweis 2007) para el crecimiento de gotas de agua por higroscopicidad.">
              <button
                onClick={() => setActiveTab('kohler_curve')}
                className={`px-3 py-1 text-xs font-semibold rounded-t-md transition-colors cursor-pointer ${
                  activeTab === 'kohler_curve'
                    ? 'bg-slate-800 text-sky-300 border-b-2 border-sky-500 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Ver curva de activación termodinámica Köhler"
              >
                Curva Termodinámica de Köhler
              </button>
            </ScientificTooltip>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-[10px] bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-700/80 px-2.5 py-1 rounded transition-colors font-medium cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar CSV FAIR</span>
          </button>
        </div>

        {/* Sliders for Physical & Chemical Parameters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 text-[10px]">
          {/* Carga del Motor */}
          <ScientificTooltip content="Porcentaje de carga del motor diésel marítimo. Escala linealmente el caudal de gases de combustión y masa de hollín.">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-medium">
                <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-red-400" /> Carga Motor (%):</span>
                <span className="font-mono text-red-300 font-bold">{engineLoadPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                step="5"
                value={engineLoadPct}
                onChange={(e) => setEngineLoadPct(parseInt(e.target.value))}
                className="w-full accent-red-500 h-1 bg-slate-700 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          {/* Contenido de Azufre */}
          <ScientificTooltip content="Contenido de azufre en el combustible. Regulado por IMO MARPOL Anexo VI (0.10% en zona Med-ECA). Modula la nucleación de sulfatos H2SO4.">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-medium">
                <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-amber-400" /> Azufre Comb. (% S):</span>
                <span className="font-mono text-amber-300 font-bold">{fuelSulfurPct.toFixed(2)}%</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.50"
                step="0.01"
                value={fuelSulfurPct}
                onChange={(e) => setFuelSulfurPct(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1 bg-slate-700 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          {/* Distancia a Sotavento */}
          <ScientificTooltip content="Distancia a sotavento desde la chimenea del buque hasta la fachada litoral urbana (La Farola, Muelle 1, Paseo del Parque).">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-medium">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-sky-400" /> Distancia (m):</span>
                <span className="font-mono text-sky-300 font-bold">{downwindDistM} m</span>
              </div>
              <input
                type="range"
                min="100"
                max="4000"
                step="100"
                value={downwindDistM}
                onChange={(e) => setDownwindDistM(parseInt(e.target.value))}
                className="w-full accent-sky-500 h-1 bg-slate-700 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          {/* Velocidad del Viento */}
          <ScientificTooltip content="Velocidad del viento ambiental. Controla la tasa de dilución volumétrica y el tiempo de tránsito para coagulación.">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-medium">
                <span className="flex items-center gap-1"><Wind className="w-3 h-3 text-cyan-400" /> Viento (m/s):</span>
                <span className="font-mono text-cyan-300 font-bold">{windSpeed.toFixed(1)} m/s</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="12"
                step="0.2"
                value={windSpeed}
                onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1 bg-slate-700 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>
        </div>

        {/* Tab Content */}
        {activeTab === 'diagram' && (
          <ShipPlumeMicrophysicsDiagram input={input} result={result} />
        )}

        {activeTab === 'size_distribution' && (
          <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-lg space-y-3">
            <div className="text-xs font-bold text-slate-200 flex justify-between items-center">
              <span>Espectro Granulométrico Log-Normal dN/dlog(Dp)</span>
              <span className="text-[10px] text-sky-400 font-mono font-bold">
                N_tot: {result.totalParticleNumberCm3.toLocaleString()} part/cm³ • D_pg: {result.geometricMeanDiameterNm.toFixed(1)} nm
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.sizeDistribution} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="diameterNm" stroke="#94a3b8" fontSize={9} unit=" nm" />
                  <YAxis stroke="#94a3b8" fontSize={9} unit=" cm⁻³" />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }}
                  />
                  <ReferenceLine x={result.criticalDryDiameterNm} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: `D_pc=${result.criticalDryDiameterNm.toFixed(0)}nm (CCN)`, fill: '#f43f5e', fontSize: 9 }} />
                  <Area type="monotone" dataKey="dNdlogDp" name="Concentración dN/dlog(Dp)" stroke="#38bdf8" fill="#0284c7" fillOpacity={0.4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[9px] font-mono bg-slate-900/80 p-2 rounded border border-slate-800">
              <div>
                <span className="text-slate-400 block">Black Carbon (Hollín):</span>
                <span className="text-rose-400 font-bold text-xs">{result.blackCarbonDownwindUgm3.toFixed(2)} µg/m³</span>
              </div>
              <div>
                <span className="text-slate-400 block">SO₂ a Sotavento:</span>
                <span className="text-amber-400 font-bold text-xs">{result.so2DownwindUgm3.toFixed(1)} µg/m³</span>
              </div>
              <div>
                <span className="text-slate-400 block">Activación CCN:</span>
                <span className="text-sky-400 font-bold text-xs">{result.ccnNumberConcentrationCm3.toLocaleString()} cm⁻³ ({(result.activatedFractionCCN * 100).toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kohler_curve' && (
          <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-lg space-y-3">
            <div className="text-xs font-bold text-slate-200 flex justify-between items-center">
              <span>Curva Termodinámica de Köhler (Efecto Kelvin vs. Raoult)</span>
              <span className="text-[10px] text-indigo-400 font-mono">
                κ = {result.effectiveKappa.toFixed(3)} • Petters &amp; Kreidenweis (2007)
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kohlerCurveData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="dWetNm" stroke="#94a3b8" fontSize={9} unit=" nm" />
                  <YAxis stroke="#94a3b8" fontSize={9} unit=" %" />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }}
                  />
                  <ReferenceLine y={supersatPct} stroke="#10b981" strokeDasharray="4 2" label={{ value: `Sobresaturación S=${supersatPct}%`, fill: '#10b981', fontSize: 9 }} />
                  <Line type="monotone" dataKey="supersaturationPct" name="Sobresaturación de Equilibrio S (%)" stroke="#38bdf8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[9.5px] text-slate-300 bg-sky-950/40 border border-sky-800/60 p-2 rounded leading-relaxed">
              <strong className="text-sky-300">Fundamentación de Microfísica:</strong> El aerosol de combustión marítima rico en sulfatos adquiere un parámetro de higroscopicidad κ ≈ {result.effectiveKappa.toFixed(2)}, lo que desplaza el pico de la curva de Köhler hacia la izquierda, facilitando su activación en núcleos de condensación de gotas de niebla costera en la Bahía de Málaga.
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
}
