import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Globe, ArrowRight, ShieldCheck, Waves, Wind, Layers, Sparkles } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';

export function CamsBoundaryTransportDiagram() {
  const [selectedSpecies, setSelectedSpecies] = useState<'o3' | 'pm25' | 'no2'>('o3');

  const speciesData = {
    o3: {
      name: 'Ozono Troposférico (O₃)',
      regionalBgPct: 78.0,
      localGenPct: 22.0,
      regionalConcentration: '34.2 µg/m³',
      localIncrement: '+8.4 µg/m³',
      color: '#06b6d4',
      bgDescription: 'Fondo mesoescalar del Mediterráneo occidental + transporte troposférico libre dominado por fotoquímica regional.'
    },
    pm25: {
      name: 'Partículas Finas (PM₂.₅)',
      regionalBgPct: 52.0,
      localGenPct: 48.0,
      regionalConcentration: '6.8 µg/m³',
      localIncrement: '+5.4 µg/m³',
      color: '#10b981',
      bgDescription: 'Aerosol marino de salpicadura (sal común) + aerosol orgánico secundario biogénico regional.'
    },
    no2: {
      name: 'Dióxido de Nitrógeno (NO₂)',
      regionalBgPct: 18.0,
      localGenPct: 82.0,
      regionalConcentration: '5.2 µg/m³',
      localIncrement: '+32.8 µg/m³',
      color: '#f59e0b',
      bgDescription: 'Fondo regional limpio; concentración dominada en un 82% por el tráfico urbano y fuentes móviles locales.'
    }
  };

  const current = speciesData[selectedSpecies];

  const svgWidth = 440;
  const svgHeight = 220;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 relative overflow-hidden shadow-inner">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Acoplamiento Multiescala: Copernicus CAMS (0.1°) → Malla Urbana Málaga (10m)</span>
              <ScientificTooltip
                title="Copernicus CAMS ECMWF Ensemble"
                content="Modelo químico regional europeo del ECMWF compuesto por un ensamble de 11 modelos químicos (CHIMERE, EMEP, LOTOS-EUROS, MOCAGE, etc.) a resolución de 0.1° (~11 km)."
                regulatory="Copernicus Atmosphere Monitoring Service (CAMS)"
                citation="Marécal, V. et al. (2015) Geosci. Model Dev., 8, 2777-2813."
              >
                <span className="text-[9.5px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-950 border border-cyan-500/40 text-cyan-300 cursor-help">
                  ECMWF ENSEMBLE
                </span>
              </ScientificTooltip>
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <span>Condiciones de Contorno Dirichlet/Neumann & Asimilación Transfronteriza</span>
              <ScientificTooltip
                title="Condiciones de Contorno de Contaminantes"
                content="Imposición matemática de valores Dirichlet c|_{contorno} = c_{CAMS}(t) en las fronteras de entrada y gradiente nulo Neumann \partial c/\partial n = 0 en las salidas de la malla microescalar 10m."
                formula="c(\mathbf{x}_{in}, t) = c_{CAMS}(t), \quad \frac{\partial c}{\partial \mathbf{n}}\Big|_{\mathbf{x}_{out}} = 0"
              />
            </div>
          </div>
        </div>

        {/* Species selector pills */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded border border-slate-800">
          {(['o3', 'pm25', 'no2'] as const).map(sp => {
            const tipTitles = {
              o3: 'Ozono Troposférico: Dominancia de Fondo Regional',
              pm25: 'PM₂.₅: Partición Aerosol Marino / Tráfico',
              no2: 'NO₂: Dominancia de Tráfico Urbano Local'
            };
            const tipDesc = {
              o3: 'El O₃ está gobernado en un 78% por el transporte mesoescalar de la cuenca mediterránea y fotólisis regional.',
              pm25: 'Las partículas finas combinan spray marino de salpicadura y aerosoles secundarios generados por combustión interna.',
              no2: 'El dióxido de nitrógeno es un trazador local primario generado en un 82% por la combustión vehicular urbana.'
            };
            return (
              <ScientificTooltip
                key={sp}
                title={tipTitles[sp]}
                content={tipDesc[sp]}
              >
                <button
                  onClick={() => setSelectedSpecies(sp)}
                  className={`px-2 py-0.5 text-[9.5px] font-mono font-bold rounded transition-all cursor-pointer ${
                    selectedSpecies === sp
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sp === 'o3' ? 'Ozono (O₃)' : sp === 'pm25' ? 'PM₂.₅' : 'NO₂'}
                </button>
              </ScientificTooltip>
            );
          })}
        </div>
      </div>

      {/* Main Diagram Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* SVG Multi-scale Nested Grid Visualizer (Left) */}
        <div className="lg:col-span-7 relative bg-slate-900/60 rounded-lg border border-slate-800 p-2 flex justify-center">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-[420px] h-auto select-none">
            <defs>
              <linearGradient id="camsGridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#083344" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.2" />
              </linearGradient>

              <radialGradient id="malagaUrbanGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                <stop offset="80%" stopColor="#10b981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </radialGradient>
            </defs>

            {/* Macro CAMS 0.1° Grid Cells */}
            <rect x="20" y="20" width="400" height="180" fill="url(#camsGridGrad)" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4 3" rx="4" />
            
            {/* Grid Subdivision Lines (Copernicus 0.1° ~= 11km) */}
            <line x1="150" y1="20" x2="150" y2="200" stroke="#0369a1" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
            <line x1="290" y1="20" x2="290" y2="200" stroke="#0369a1" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
            <line x1="20" y1="110" x2="420" y2="110" stroke="#0369a1" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />

            <text x="30" y="36" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">
              Dominio Regional CAMS (0.1° ~ 11 km)
            </text>

            {/* Influx Vector Lines (Advective Transport into Urban Core) */}
            {/* North Influx */}
            <g className="animate-pulse" style={{ animationDuration: '2.5s' }}>
              <line x1="220" y1="25" x2="220" y2="70" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
              <polygon points="220,75 216,66 224,66" fill="#38bdf8" />
              <text x="225" y="48" fill="#bae6fd" fontSize="7.5" fontFamily="monospace">Flujo Norte</text>
            </g>

            {/* South Marine Influx (Alboran Sea) */}
            <g className="animate-pulse" style={{ animationDuration: '3s' }}>
              <line x1="220" y1="195" x2="220" y2="150" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="4 2" />
              <polygon points="220,145 216,154 224,154" fill="#2dd4bf" />
              <text x="225" y="175" fill="#99f6e4" fontSize="7.5" fontFamily="monospace">Brisa Marítima (Alborán)</text>
            </g>

            {/* West Influx */}
            <g className="animate-pulse" style={{ animationDuration: '2.8s' }}>
              <line x1="30" y1="110" x2="160" y2="110" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
              <polygon points="165,110 156,106 156,114" fill="#38bdf8" />
            </g>

            {/* Nested Urban Domain (Málaga 10m Microscale Tensor) */}
            <rect
              x="170"
              y="75"
              width="100"
              height="70"
              fill="url(#malagaUrbanGlow)"
              stroke="#10b981"
              strokeWidth="2"
              rx="4"
            />

            {/* Microscale Grid Details */}
            <line x1="170" y1="98" x2="270" y2="98" stroke="#059669" strokeWidth="0.8" opacity="0.6" />
            <line x1="170" y1="122" x2="270" y2="122" stroke="#059669" strokeWidth="0.8" opacity="0.6" />
            <line x1="203" y1="75" x2="203" y2="145" stroke="#059669" strokeWidth="0.8" opacity="0.6" />
            <line x1="236" y1="75" x2="236" y2="145" stroke="#059669" strokeWidth="0.8" opacity="0.6" />

            {/* Urban Center Landmark */}
            <circle cx="220" cy="110" r="4" fill="#f59e0b" className="animate-ping origin-center" style={{ transformOrigin: '220px 110px' }} />
            <circle cx="220" cy="110" r="3" fill="#f59e0b" />
            <text x="220" y="125" fill="#f8fafc" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
              Málaga Centro (10m)
            </text>
            <text x="220" y="136" fill="#34d399" fontSize="7" textAnchor="middle" fontFamily="monospace">
              PINN + Navier-Stokes
            </text>

            {/* Boundary Condition Tags */}
            <rect x="274" y="80" width="130" height="24" fill="#0f172a" stroke="#334155" rx="3" />
            <text x="280" y="92" fill="#38bdf8" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
              Cond. Dirichlet (c_contorno)
            </text>
            <text x="280" y="100" fill="#94a3b8" fontSize="6.5" fontFamily="monospace">
              Asimilación CAMS horario
            </text>
          </svg>
        </div>

        {/* Transboundary Partition Analysis (Right) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-2.5">
          {/* Species Badge & Breakdown */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-md p-3 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: current.color }}></span>
                {current.name}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono text-cyan-400 font-bold">Desglose de Origen</span>
                <ScientificTooltip
                  title="Atribución de Fuentes Transfronterizas (EMEP / FAIRMODE)"
                  content="Partición determinista de concentraciones entre la masa de aire sinóptica que ingresa en la bahía de Málaga y las emisiones directas dentro del término municipal."
                  formula="c_{total} = c_{regional} + \Delta c_{local}"
                  citation="Kiesewetter, G. et al. (2015) Atmos. Environ., 117, 216-229."
                />
              </div>
            </div>

            {/* Visual Partition Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-cyan-400 font-bold">Fondo Regional: {current.regionalBgPct.toFixed(0)}%</span>
                <span className="text-amber-400 font-bold">Generación Local: {current.localGenPct.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-cyan-500 transition-all duration-700"
                  style={{ width: `${current.regionalBgPct}%` }}
                />
                <div
                  className="h-full bg-amber-500 transition-all duration-700"
                  style={{ width: `${current.localGenPct}%` }}
                />
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono pt-1">
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 block text-[9px]">Fondo CAMS (c_bnd):</span>
                  <ScientificTooltip
                    title="Fondo Regional de Contorno (c_bnd)"
                    content="Concentración asimilada desde la frontera de dominio CAMS antes de entrar en la interacción orográfica de los Montes de Málaga."
                  />
                </div>
                <span className="text-cyan-300 font-bold">{current.regionalConcentration}</span>
              </div>
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 block text-[9px]">Incremento Urbano (Δc):</span>
                  <ScientificTooltip
                    title="Incremento Urbano de Microescala (Δc)"
                    content="Aporte adicional generado dentro de la ciudad por tráfico rodado, combustión portuaria e industria, retenido por la rugosidad edilicia."
                  />
                </div>
                <span className="text-amber-300 font-bold">{current.localIncrement}</span>
              </div>
            </div>
          </div>

          {/* Scientific Context */}
          <div className="p-2 rounded bg-slate-900/50 border border-slate-800 text-[9.5px] text-slate-400 leading-relaxed">
            <span className="text-cyan-400 font-bold font-mono">Dinámica de Transporte:</span> {current.bgDescription}
          </div>
        </div>
      </div>
    </div>
  );
}
