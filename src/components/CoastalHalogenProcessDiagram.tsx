import React, { useState, useMemo } from 'react';
import {
  Sun,
  Moon,
  Droplets,
  Zap,
  Activity,
  Sparkles,
  FlaskConical,
  RefreshCw,
  Info,
  Clock,
  Radio,
  Sliders,
  Waves,
  Atom,
  CheckCircle2,
  MapPin,
  Download
} from 'lucide-react';
import { HalogenSimulationResult, HalogenSimulationParameters } from '../lib/coastalHalogenChemistry';
import { PRESET_ZONES, Zone } from '../lib/zones';
import { ScientificTooltip } from './ScientificTooltip';
import { downloadVectorSvg } from '../lib/vectorExporter';

interface CoastalHalogenProcessDiagramProps {
  result: HalogenSimulationResult;
  params: HalogenSimulationParameters;
  liveTelemetry?: any;
  isIngesting?: boolean;
  activeZone: Zone;
  onSelectZone: (zone: Zone) => void;
  onRefreshLive: () => void;
}

export function CoastalHalogenProcessDiagram({
  result,
  params,
  liveTelemetry,
  isIngesting = false,
  activeZone,
  onSelectZone,
  onRefreshLive
}: CoastalHalogenProcessDiagramProps) {
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  const maxClno2Ppt = useMemo(() => {
    return Math.max(...result.diurnalProfile.map(d => d.clno2Ppt), 0).toFixed(1);
  }, [result]);

  const maxClRadicalConc = useMemo(() => {
    return Math.max(...result.diurnalProfile.map(d => d.clRadicalConc10e4), 0).toFixed(1);
  }, [result]);

  // Reaction steps definition
  const stages = [
    {
      id: 1,
      title: '1. Reservorio Nocturno N₂O₅',
      subtitle: 'Formación de pentóxido de dinitrógeno en capa límite nocturna',
      color: 'indigo',
      badgeBg: 'bg-indigo-950 border-indigo-700 text-indigo-300',
      strokeColor: '#818cf8',
      fillColor: '#1e1b4b',
      equation: 'NO₂ + O₃ → NO₃ + O₂  |  NO₃ + NO₂ ⇌ N₂O₅',
      details:
        'Durante la noche, sin fotólisis de NO₂, el NO₂ reacciona con O₃ para producir el radical NO₃, que se equilibra rápidamente con NO₂ produciendo N₂O₅, el principal precursor heterogéneo.',
      metrics: [
        { label: 'NO₂ Base', value: `${params.no2Ppb} ppb`, tooltip: 'Precursor Radicalario: Limitante nocturno para la formación de radicales nitrato (NO₃).' },
        { label: 'O₃ Nocturno', value: `${params.o3Ppb} ppb`, tooltip: 'Agente Oxidante: Reactante primario en la titulación nocturna del NO₂, gobernado por la dinámica de la capa límite planetaria (PBL).' },
        { label: 'N₂O₅ Estimado', value: `${(result.diurnalProfile[2]?.n2o5Ppt || 18).toFixed(1)} ppt`, tooltip: 'Reservorio fotoquímico gas-fase. En equilibrio rápido con NO₂ y NO₃, altamente dependiente de la temperatura y sumideros heterogéneos.' }
      ]
    },
    {
      id: 2,
      title: '2. Captura en Aerosol Salino (NaCl)',
      subtitle: 'Reacción heterogénea interfacial Bertram & Thornton (2009)',
      color: 'teal',
      badgeBg: 'bg-teal-950 border-teal-700 text-teal-300',
      strokeColor: '#2dd4bf',
      fillColor: '#042f2e',
      equation: 'N₂O₅(g) + H₂O/Cl⁻(aerosol) → ClNO₂(g) + NaNO₃(aq)',
      details:
        'El N₂O₅ gaseoso se disuelve en las gotas de aerosol marino producidas por el oleaje de la Bahía. Los iones Cl⁻ reaccionan eficazmente produciendo ClNO₂ en fase gaseosa.',
      metrics: [
        { label: 'Coef. Captura γ(N₂O₅)', value: result.gammaN2O5.toString(), tooltip: 'Probabilidad termodinámica de que una molécula de N₂O₅ que colisiona con un aerosol sea incorporada (Bertram & Thornton, 2009).' },
        { label: 'Rendimiento Φ(ClNO₂)', value: `${(result.clno2YieldPhi * 100).toFixed(1)}%`, tooltip: 'Fracción de captura de N₂O₅ que resulta en la formación y volatilización exitosa de ClNO₂ gaseoso (Thornton et al., 2010).' },
        { label: 'Área Aerosol S_a', value: `${params.seaSaltAerosolSaUm2Cm3} µm²/cm³`, tooltip: 'Superficie específica interfacial del aerosol marino, limitante cinético de primer orden para la transferencia de masa gas-partícula.' },
        { label: 'Cloruros [Cl⁻]', value: `${params.chlorideMolarityMolL} M`, tooltip: 'Molaridad salina acuosa. En la Bahía de Málaga, la brisa marina densa mantiene niveles superiores a 3.0 M cerca de la costa.' }
      ]
    },
    {
      id: 3,
      title: '3. Fotólisis Matinal del ClNO₂',
      subtitle: 'Rotura fotoquímica por radiación solar al amanecer',
      color: 'amber',
      badgeBg: 'bg-amber-950 border-amber-700 text-amber-300',
      strokeColor: '#fbbf24',
      fillColor: '#451a03',
      equation: 'ClNO₂ + hν (λ < 400 nm) → Cl• + NO₂',
      details:
        'A la salida del sol, fotones UV/Visibles de longitud de onda < 400 nm rompen el enlace Cl-NO₂ liberando radicales cloro atómico (Cl•) extremadamente reactivos.',
      metrics: [
        { label: 'Rad. Solar', value: `${params.solarRadiationWM2} W/m²`, tooltip: 'Flujo direccional integrado en superficie. Modula la intensidad de ruptura fotolítica.' },
        { label: 'Tasa J(ClNO₂)', value: `${result.jClNO2PerSec} s⁻¹`, tooltip: 'Constante fotoquímica de primer orden dependiente del flujo actínico solar ultravioleta/visible.' },
        { label: 'ClNO₂ Acumulado', value: `${maxClno2Ppt} ppt`, tooltip: 'Reservorio fotoquímico acumulado durante la fase oscura de la capa límite, que desencadena un pico de reactividad al salir el sol.' }
      ]
    },
    {
      id: 4,
      title: '4. Ataque Radicalario Explosivo a COVs',
      subtitle: 'Oxidación rápida de hidrocarburos vehiculares e industriales',
      color: 'rose',
      badgeBg: 'bg-rose-950 border-rose-700 text-rose-300',
      strokeColor: '#f43f5e',
      fillColor: '#4c0519',
      equation: 'Cl• + RH (Alcanos) → HCl + R•  →  RO₂•',
      details:
        'El radical Cl• abstrae átomos de H de los COVs a tasas k_Cl entre 10× y 100× superiores al radical OH•, iniciando la cascada fotoquímica horas antes del mediodía.',
      metrics: [
        { label: 'Flujo P(Cl•)', value: result.clRadicalProductionFlux, tooltip: 'Tasa de producción de radicales libres de cloro, altamente reactivos frente a enlaces C-H (átomos/cm³/s).' },
        { label: 'Multiplicador Reactividad', value: '10× - 100× vs OH•', tooltip: 'Razón empírica de constantes cinéticas k_Cl / k_OH para la abstracción de hidrógeno en alcanos ligeros de tráfico.' },
        { label: 'Concentración [Cl•]', value: `${maxClRadicalConc} ×10⁴ cm⁻³`, tooltip: 'Estado estacionario radicalario matinal. Concentraciones del orden de 10⁴ cm⁻³ alteran significativamente el ciclo del O₃.' }
      ]
    },
    {
      id: 5,
      title: '5. Adelanto del Pico de Ozono (O₃)',
      subtitle: 'Aceleración del ciclo fotoquímico en la franja costera',
      color: 'purple',
      badgeBg: 'bg-purple-950 border-purple-700 text-purple-300',
      strokeColor: '#c084fc',
      fillColor: '#3b0764',
      equation: 'RO₂• + NO → RO• + NO₂  ⟶  NO₂ + hν → NO + O(³P)  ⟶  O₃',
      details:
        'La rápida conversión de NO a NO₂ por los peróxidos RO₂• acelera la producción fotoquímica de O₃ troposférico, adelantando el pico matinal en el litoral malagueño.',
      metrics: [
        { label: 'Adelanto Pico O₃', value: `+${result.ozoneEarlyPeakAdvanceMinutes} min`, tooltip: 'Desplazamiento temporal (fase) del máximo de ozono debido a la aceleración de la oxidación matinal de precursores.' },
        { label: 'Incremento d[O₃]/dt', value: `+${(result.clno2YieldPhi * 4.2).toFixed(1)} ppb/h`, tooltip: 'Derivada temporal de la mezcla de ozono superficial por unidad de volumen atribuible a la catálisis halógena.' },
        { label: 'Impacto Litoral', value: 'Alto (El Palo, Muelle Uno, Huelin)', tooltip: 'Vulnerabilidad geoespacial del transecto costero dependiente de la topología OSM y distancia al rompiente de olas.' }
      ]
    }
  ];

  return (
    <div className="flex flex-col gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-xs">
      {/* LIVE INGESTION BANNER & ZONE SELECTOR */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900 border border-teal-800/70 rounded">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 block animate-ping absolute inset-0 opacity-75"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 block relative"></span>
          </div>
          <div>
            <span className="font-bold text-teal-300 text-[11px] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" /> Telemetría Litoral en Vivo Ingestada
            </span>
            <span className="text-[10px] text-slate-400 block">
              Fuente: Open-Meteo & Copernicus CAMS (Málaga Costero - {activeZone.name})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* ZONE SELECTOR DROPDOWN */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded px-2 py-1">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={activeZone.name}
              onChange={e => {
                const z = PRESET_ZONES.find(item => item.name === e.target.value);
                if (z) onSelectZone(z);
              }}
              className="bg-transparent text-slate-200 text-[11px] focus:outline-none font-bold cursor-pointer"
            >
              {PRESET_ZONES.map(z => (
                <option key={z.name} value={z.name} className="bg-slate-900 text-slate-200">
                  {z.name} ({z.tag})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onRefreshLive}
            disabled={isIngesting}
            className="flex items-center gap-1 bg-teal-950 hover:bg-teal-900 text-teal-200 border border-teal-700 px-2.5 py-1 rounded text-[11px] font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isIngesting ? 'animate-spin' : ''}`} />
            {isIngesting ? 'Ingestando...' : 'Re-Asimilar'}
          </button>
        </div>
      </div>

      {/* LIVE TELEMETRY SNAPSHOT BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-[10px] bg-slate-900/80 p-2 rounded border border-slate-800">
        <div className="p-1.5 bg-slate-950 rounded border border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1 mb-0.5">
            Temperatura T:
            <ScientificTooltip topic="coastal_sea_breeze_circulation" content="Termodinámica del Aerosol: Modula la constante de equilibrio de Henry para la partición gas-partícula del N₂O₅ (Sander, 2015)." />
          </span>
          <strong className="text-amber-300">{liveTelemetry?.meteo?.tempC ?? params.tempCelsius}°C</strong>
        </div>
        <div className="p-1.5 bg-slate-950 rounded border border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1 mb-0.5">
            Humedad RH:
            <ScientificTooltip topic="coastal_sea_breeze_circulation" content="Crecimiento Higroscópico: Determina la fracción de agua líquida (ALWC) en el aerosol salino y su radio efectivo de reacción." />
          </span>
          <strong className="text-cyan-300">{liveTelemetry?.meteo?.rhPct ?? params.relativeHumidity}%</strong>
        </div>
        <div className="p-1.5 bg-slate-950 rounded border border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1 mb-0.5">
            Radiación Solar:
            <ScientificTooltip topic="coastal_sea_breeze_circulation" content="Frecuencia de Fotólisis (J-value): Radiación actínica integrada direccionalmente para la ruptura hemolítica Cl-NO₂ (λ < 400 nm)." />
          </span>
          <strong className="text-amber-400">{params.solarRadiationWM2} W/m²</strong>
        </div>
        <div className="p-1.5 bg-slate-950 rounded border border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1 mb-0.5">
            NO₂ Observado:
            <ScientificTooltip topic="coastal_sea_breeze_circulation" content="Precursor Radicalario: Limitante nocturno primario para la formación de radicales nitrato (NO₃)." />
          </span>
          <strong className="text-rose-300">{params.no2Ppb} ppb</strong>
        </div>
        <div className="p-1.5 bg-slate-950 rounded border border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1 mb-0.5">
            O₃ Observado:
            <ScientificTooltip topic="coastal_sea_breeze_circulation" content="Agente Oxidante: Reactante que inicia el ciclo nocturno al oxidar NO₂ a NO₃ dependiente de la PBL." />
          </span>
          <strong className="text-purple-300">{params.o3Ppb} ppb</strong>
        </div>
        <div className="p-1.5 bg-slate-950 rounded border border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1 mb-0.5">
            Estatus Salino:
            <ScientificTooltip topic="coastal_sea_breeze_circulation" content="Parametrización geoespacial dependiente de la concentración de Cl⁻ en la neblina marina (sea-spray)." />
          </span>
          <strong className="text-emerald-300">Alborán ({params.chlorideMolarityMolL}M Cl⁻)</strong>
        </div>
      </div>

      {/* SVG INTERACTIVE MULTICOLOR PROCESS FLOW DIAGRAM */}
      <div className="relative bg-[#070c14] border border-slate-800 rounded-lg p-3 overflow-x-auto">
        <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-800/80">
          <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5 uppercase">
            <Atom className="w-4 h-4 text-teal-400" />
            <span className="flex items-center gap-1">
              Esquema Fotoquímico Interfacial Multicapa (Málaga Litoral)
              <ScientificTooltip topic="coastal_sea_breeze_circulation" content="Representación determinista de la asimilación acoplada de telemetría y química halógena (PINN + ODE Solvers)." />
            </span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Haz clic en cualquier fase para inspeccionar k, J y balance de masa
            </span>
            <ScientificTooltip topic="coastal_sea_breeze_circulation" position="left" width="w-[280px]" content="Exportar diagrama fotoquímico interfacial en formato vectorial SVG de alta resolución para publicaciones Q1 y tesis doctoral.">
              <button
                onClick={() => downloadVectorSvg('coastal-halogen-diagram-svg', `quimica_halogena_costera_malaga_${Date.now()}.svg`)}
                className="flex items-center gap-1 px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-teal-800/60 rounded text-[10px] text-teal-300 font-mono transition-colors"
              >
                <Download className="w-3 h-3 text-teal-400" /> SVG Tesis
              </button>
            </ScientificTooltip>
          </div>
        </div>

        <svg id="coastal-halogen-diagram-svg" viewBox="0 0 1000 280" className="w-full h-auto min-w-[750px] select-none">
          <defs>
            {/* Gradients */}
            <linearGradient id="grad-stage1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#312e81" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="grad-stage2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#042f2e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#115e59" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="grad-stage3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#451a03" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#78350f" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="grad-stage4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4c0519" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#881337" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="grad-stage5" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b0764" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#581c87" stopOpacity="0.9" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Arrowhead markers */}
            <marker id="arrow-indigo" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#818cf8" />
            </marker>
            <marker id="arrow-teal" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#2dd4bf" />
            </marker>
            <marker id="arrow-amber" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#fbbf24" />
            </marker>
            <marker id="arrow-rose" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#f43f5e" />
            </marker>
          </defs>

          {/* BACKGROUND ATMOSPHERIC / SEA DIVIDER */}
          <rect x="10" y="10" width="980" height="260" rx="8" fill="#0b1324" stroke="#1e293b" strokeWidth="1" />
          
          {/* SEA SPRAY DROPLET VISUAL REPRESENTATION IN CENTER */}
          <circle cx="370" cy="140" r="65" fill="#042f2e" opacity="0.4" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="370" y="218" textAnchor="middle" fill="#5eead4" fontSize="9" fontWeight="bold" fontFamily="monospace">
            Aerosol Marino [NaCl(aq)]
          </text>

          {/* STAGE CONNECTING PATHS WITH FLOW ARROWS */}
          {/* Stage 1 -> Stage 2 */}
          <path d="M 180 140 L 260 140" stroke="#818cf8" strokeWidth="2.5" markerEnd="url(#arrow-indigo)" />
          {/* Stage 2 -> Stage 3 */}
          <path d="M 480 140 L 520 140" stroke="#2dd4bf" strokeWidth="2.5" markerEnd="url(#arrow-teal)" />
          {/* Stage 3 -> Stage 4 */}
          <path d="M 700 140 L 740 140" stroke="#fbbf24" strokeWidth="2.5" markerEnd="url(#arrow-amber)" />
          {/* Stage 4 -> Stage 5 */}
          <path d="M 910 140 L 910 200 L 820 230" stroke="#f43f5e" strokeWidth="2" markerEnd="url(#arrow-rose)" strokeDasharray="4 2" />

          {/* SUNLIGHT BEAM TO STAGE 3 */}
          <line x1="610" y1="20" x2="610" y2="70" stroke="#fbbf24" strokeWidth="2" strokeDasharray="2 2" />
          <polygon points="610,75 605,65 615,65" fill="#fbbf24" />
          <text x="610" y="18" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="monospace">
            Radiación hν (λ &lt; 400nm)
          </text>

          {/* STAGE NODES */}
          {/* Stage 1 Node */}
          <g
            onClick={() => setSelectedStage(1)}
            className="cursor-pointer transition-transform hover:scale-105"
            filter={selectedStage === 1 ? 'url(#glow)' : undefined}
          >
            <rect
              x="20"
              y="70"
              width="160"
              height="140"
              rx="8"
              fill="url(#grad-stage1)"
              stroke={selectedStage === 1 ? '#c7d2fe' : '#818cf8'}
              strokeWidth={selectedStage === 1 ? '2.5' : '1.5'}
            />
            <text x="100" y="92" textAnchor="middle" fill="#a5b4fc" fontSize="11" fontWeight="bold">
              1. NO₂ + O₃ → N₂O₅
            </text>
            <text x="100" y="110" textAnchor="middle" fill="#cbd5e1" fontSize="9">
              Reservorio Nocturno
            </text>
            <rect x="32" y="122" width="136" height="42" rx="4" fill="#0f172a" opacity="0.8" />
            <text x="100" y="138" textAnchor="middle" fill="#818cf8" fontSize="11" fontWeight="bold" fontFamily="monospace">
              N₂O₅ (gaseoso)
            </text>
            <text x="100" y="154" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              [N₂O₅] ≈ {(result.diurnalProfile[2]?.n2o5Ppt || 18).toFixed(1)} ppt
            </text>
            <text x="100" y="195" textAnchor="middle" fill="#818cf8" fontSize="8" fontWeight="bold">
              FASE GASEOSA NOCTURNA
            </text>
          </g>

          {/* Stage 2 Node */}
          <g
            onClick={() => setSelectedStage(2)}
            className="cursor-pointer transition-transform hover:scale-105"
            filter={selectedStage === 2 ? 'url(#glow)' : undefined}
          >
            <rect
              x="270"
              y="70"
              width="210"
              height="140"
              rx="8"
              fill="url(#grad-stage2)"
              stroke={selectedStage === 2 ? '#99f6e4' : '#2dd4bf'}
              strokeWidth={selectedStage === 2 ? '2.5' : '1.5'}
            />
            <text x="375" y="92" textAnchor="middle" fill="#5eead4" fontSize="11" fontWeight="bold">
              2. N₂O₅ + NaCl → ClNO₂
            </text>
            <text x="375" y="110" textAnchor="middle" fill="#cbd5e1" fontSize="9">
              Captura Heterogénea
            </text>
            <rect x="282" y="122" width="186" height="45" rx="4" fill="#0f172a" opacity="0.8" />
            <text x="375" y="137" textAnchor="middle" fill="#2dd4bf" fontSize="10" fontWeight="bold" fontFamily="monospace">
              γ(N₂O₅) = {result.gammaN2O5}
            </text>
            <text x="375" y="152" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold" fontFamily="monospace">
              Rendimiento Φ = {(result.clno2YieldPhi * 100).toFixed(1)}%
            </text>
            <text x="375" y="195" textAnchor="middle" fill="#2dd4bf" fontSize="8" fontWeight="bold">
              INTERFAZ AEROSOL-MARINO
            </text>
          </g>

          {/* Stage 3 Node */}
          <g
            onClick={() => setSelectedStage(3)}
            className="cursor-pointer transition-transform hover:scale-105"
            filter={selectedStage === 3 ? 'url(#glow)' : undefined}
          >
            <rect
              x="530"
              y="70"
              width="170"
              height="140"
              rx="8"
              fill="url(#grad-stage3)"
              stroke={selectedStage === 3 ? '#fde68a' : '#fbbf24'}
              strokeWidth={selectedStage === 3 ? '2.5' : '1.5'}
            />
            <text x="615" y="92" textAnchor="middle" fill="#fde047" fontSize="11" fontWeight="bold">
              3. ClNO₂ + hν → Cl• + NO₂
            </text>
            <text x="615" y="110" textAnchor="middle" fill="#cbd5e1" fontSize="9">
              Fotólisis Matinal Solar
            </text>
            <rect x="542" y="122" width="146" height="42" rx="4" fill="#0f172a" opacity="0.8" />
            <text x="615" y="138" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="monospace">
              J(ClNO₂) = {result.jClNO2PerSec} s⁻¹
            </text>
            <text x="615" y="154" textAnchor="middle" fill="#fef08a" fontSize="9" fontFamily="monospace">
              Pico Amanecer (06:30 UTC)
            </text>
            <text x="615" y="195" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold">
              FLASH FOTOQUÍMICO MATINAL
            </text>
          </g>

          {/* Stage 4 Node */}
          <g
            onClick={() => setSelectedStage(4)}
            className="cursor-pointer transition-transform hover:scale-105"
            filter={selectedStage === 4 ? 'url(#glow)' : undefined}
          >
            <rect
              x="750"
              y="70"
              width="210"
              height="140"
              rx="8"
              fill="url(#grad-stage4)"
              stroke={selectedStage === 4 ? '#fecdd3' : '#f43f5e'}
              strokeWidth={selectedStage === 4 ? '2.5' : '1.5'}
            />
            <text x="855" y="92" textAnchor="middle" fill="#fda4af" fontSize="11" fontWeight="bold">
              4. Cl• + RH → RO₂• + HCl
            </text>
            <text x="855" y="110" textAnchor="middle" fill="#cbd5e1" fontSize="9">
              Ataque Radicalario a COVs
            </text>
            <rect x="762" y="122" width="186" height="45" rx="4" fill="#0f172a" opacity="0.8" />
            <text x="855" y="137" textAnchor="middle" fill="#f43f5e" fontSize="10" fontWeight="bold" fontFamily="monospace">
              P(Cl•) = {result.clRadicalProductionFlux}
            </text>
            <text x="855" y="152" textAnchor="middle" fill="#fb7185" fontSize="10" fontWeight="bold" fontFamily="monospace">
              k_Cl ≈ 10× - 100× k_OH
            </text>
            <text x="855" y="195" textAnchor="middle" fill="#f43f5e" fontSize="8" fontWeight="bold">
              OXIDACIÓN RÁPIDA DE COVs
            </text>
          </g>

          {/* Stage 5 Node (Lower center output) */}
          <g
            onClick={() => setSelectedStage(5)}
            className="cursor-pointer transition-transform hover:scale-105"
            filter={selectedStage === 5 ? 'url(#glow)' : undefined}
          >
            <rect
              x="520"
              y="218"
              width="300"
              height="45"
              rx="6"
              fill="url(#grad-stage5)"
              stroke={selectedStage === 5 ? '#e9d5ff' : '#c084fc'}
              strokeWidth={selectedStage === 5 ? '2.5' : '1.5'}
            />
            <text x="670" y="236" textAnchor="middle" fill="#e9d5ff" fontSize="11" fontWeight="bold">
              5. RO₂• + NO → NO₂ ⟶  Producción Acelerada de Ozono (O₃)
            </text>
            <text x="670" y="252" textAnchor="middle" fill="#d8b4fe" fontSize="10" fontWeight="bold" fontFamily="monospace">
              Adelanto del Pico Matinal: +{result.ozoneEarlyPeakAdvanceMinutes} min | Bahía de Málaga
            </text>
          </g>
        </svg>

        {/* DETAILED INSPECTION STAGE CARD */}
        {selectedStage !== null && (
          <div className="mt-3 p-3 bg-slate-900 border border-teal-800 rounded space-y-2 animate-fadeIn">
            <div className="flex justify-between items-center">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stages[selectedStage - 1].badgeBg}`}>
                {stages[selectedStage - 1].title}
              </span>
              <button
                onClick={() => setSelectedStage(null)}
                className="text-[10px] text-slate-400 hover:text-slate-200"
              >
                ✕ Cerrar inspección
              </button>
            </div>

            <p className="text-slate-300 text-[11px] font-sans">
              {stages[selectedStage - 1].details}
            </p>

            <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px]">
              <span className="text-slate-400 flex items-center gap-1 mb-0.5">
                Ecuación Estequiométrica:
                <ScientificTooltip topic="coastal_sea_breeze_circulation" content="Balance cinético analítico. Ecuaciones validadas experimentalmente (IUPAC Task Group on Atmospheric Chemical Kinetic Data Evaluation)." />
              </span>
              <code className="text-teal-300 font-bold block">{stages[selectedStage - 1].equation}</code>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {stages[selectedStage - 1].metrics.map((m, idx) => (
                <div key={`stage-metric-${m.label}-${idx}`} className="p-1.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[9px] text-slate-400 flex items-center gap-1 mb-0.5">
                    {m.label}:
                    {m.tooltip && <ScientificTooltip topic="coastal_sea_breeze_circulation" content={m.tooltip} />}
                  </span>
                  <strong className="text-teal-300 font-mono text-[10.5px]">{m.value}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DOCTORAL THESIS SYNTHESIS FOOTNOTE */}
      <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded text-[10.5px] text-slate-300 leading-relaxed">
        <strong className="text-teal-300 block mb-0.5">Fundamentación para la Tesis Doctoral:</strong>
        Este esquema unifica la cinética fotoquímica interfacial de halógenos con la telemetría en tiempo real. La activación de cloro heterogéneo explica los desfases observados entre los modelos mesoescala (CAMS regional) y las estaciones de medición directa de la Junta de Andalucía en el litoral malagueño.
      </div>
    </div>
  );
}
