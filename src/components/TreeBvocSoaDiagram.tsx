import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TreeBvocSimulationResult, TreeBvocSimulationInput } from '../lib/treeBvocSoaEngine';
import { Download, Trees, Sun, Wind, Sparkles, Droplets, Leaf, ShieldCheck, Flame, Info } from 'lucide-react';
import { downloadVectorSvg } from '../lib/vectorExporter';
import { ScientificTooltip } from './ScientificTooltip';
import { SYSTEM_PROPAGATION } from '../lib/systemPropagationEngine';

interface Props {
  input: TreeBvocSimulationInput;
  result: TreeBvocSimulationResult;
}

export function TreeBvocSoaDiagram({ input, result }: Props) {
  const [hoveredMolecule, setHoveredMolecule] = useState<string | null>(null);

  const handleExportSvg = () => {
    downloadVectorSvg('tree-bvoc-soa-diagram-svg', `bvoc_soa_${result.species.id}_malaga`);
  };

  const isNetPositive = result.netAirQualityBalanceScore >= 0;
  const isHighIsoprene = result.isopreneFluxUgm2H > 1000;

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-lg p-3 space-y-3 font-sans">
      {/* Header with Title and Export Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-950/80 border border-emerald-700/60 rounded text-emerald-400">
            <Trees className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Biosíntesis de BVOCs, Oxidación y Aerosol Secundario (SOA)</span>
              <span className="text-[8px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-1.5 py-0.2 rounded font-mono font-bold">
                MEGAN 2.1 / PANKOW 2-PRODUCT
              </span>
            </h4>
            <p className="text-[9.5px] text-slate-400">
              {result.species.commonName} (<em>{result.species.scientificName}</em>) • Ubicación típica: {result.species.typicalLocationInMalaga}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ScientificTooltip
            title="Biosíntesis de BVOCs y Formación de SOA (MEGAN 2.1 / Pankow)"
            content={`Determinación físico-química en tiempo real de la emisión foliar de isopreno y monoterpenos acoplada a la radiación fotosintéticamente activa (PAR) y temperatura medida por los detectores de la app (${SYSTEM_PROPAGATION.stationsCount} estaciones terrestres + ${SYSTEM_PROPAGATION.satellitesCount} satélites), junto con la partición gas-partícula de Pankow para aerosoles orgánicos secundarios (SOA) y potencial de formación de ozono (MIR Carter).`}
            formula="E_{\text{BVOC}} = \epsilon \cdot \gamma_T(T_{\text{leaf}}) \cdot \gamma_L(\text{PAR}) \cdot \text{LAI} \quad [\mu\text{g/m}^2/\text{h}]"
            regulatory="EMEP/EEA Air Pollutant Emission Inventory Guidebook - Natural Sources"
            citation="Guenther et al. (2012). The Model of Emissions of Gases and Aerosols from Nature version 2.1 (MEGAN2.1). Geosci. Model Dev."
            position="right"
          />
          <ScientificTooltip
            position="bottom"
            title="Exportación Vectorial del Balance Bioquímico BVOCs-SOA"
            formula="Y_{\text{SOA}} = M_o \sum_{i=1}^{2} \frac{\alpha_i K_{om,i}}{1 + K_{om,i} M_o}"
            explanation="Descarga el diagrama de emisión de terpenos y nucleación secundaria de Odum/Pankow en formato SVG vectorial."
            normativeRef="Odum et al. (1996) / Pankow (1994)"
          >
            <button
              onClick={handleExportSvg}
              className="flex items-center gap-1 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2 py-1 rounded transition-colors font-medium cursor-pointer"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>Exportar SVG Vectorial</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {/* SVG Canvas with Active Dynamic Visualizations */}
      <div className="relative bg-slate-900/90 rounded-md border border-slate-800/80 overflow-hidden flex items-center justify-center p-2">
        <svg
          id="tree-bvoc-soa-diagram-svg"
          viewBox="0 0 760 390"
          className="w-full h-auto max-h-[370px] select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="canopyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#047857" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#064e3b" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="50%" stopColor="#92400e" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>

            <linearGradient id="soaPlumeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#ec4899" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
            </linearGradient>

            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#facc15" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
            </radialGradient>

            <filter id="foliarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Atmospheric Domain */}
          <rect x="10" y="10" width="740" height="370" rx="8" fill="#090d16" stroke="#1e293b" strokeWidth="1.2" />

          {/* Sunlight & Photosynthetically Active Radiation (PAR) */}
          <g transform="translate(60, 45)">
            <circle cx="0" cy="0" r="28" fill="url(#sunGlow)" />
            <circle cx="0" cy="0" r="14" fill="#fbbf24" stroke="#fef08a" strokeWidth="1.5" />
            <text x="36" y="-6" fill="#fef08a" fontSize="10" fontWeight="bold">Radiación PAR (MEGAN)</text>
            <text x="36" y="8" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
              {input.parSolarUmolM2S} µmol/(m²·s) • γ_L = {result.gammaLightIsoprene.toFixed(2)}
            </text>
            <text x="36" y="21" fill="#fca5a5" fontSize="9" fontFamily="monospace">
              T = {input.tempCelsius}°C • γ_T = {result.gammaTempIsoprene.toFixed(2)}
            </text>
          </g>

          {/* Left / Center: Tree Crown and Foliar Sinks/Sources */}
          <g transform="translate(180, 290)">
            {/* Trunk */}
            <path d="M -16,0 L -12,-110 L 12,-110 L 16,0 Z" fill="url(#trunkGrad)" stroke="#292524" strokeWidth="1" />
            {/* Roots */}
            <path d="M -30,0 Q -10,-5 0,0 Q 10,-5 30,0" stroke="#78350f" strokeWidth="4" fill="none" />

            {/* Tree Foliage Canopy */}
            <g transform="translate(0, -145)">
              <ellipse cx="0" cy="0" rx="85" ry="75" fill="url(#canopyGrad)" stroke="#34d399" strokeWidth="1.8" filter="url(#foliarGlow)" />
              <ellipse cx="-35" cy="-25" rx="45" ry="40" fill="#059669" fillOpacity="0.8" />
              <ellipse cx="35" cy="-20" rx="48" ry="42" fill="#047857" fillOpacity="0.8" />
              <ellipse cx="0" cy="-45" rx="55" ry="40" fill="#10b981" fillOpacity="0.7" />

              {/* Canopy Info Label */}
              <text y="-8" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                {result.species.commonName}
              </text>
              <text y="7" textAnchor="middle" fill="#a7f3d0" fontSize="8" fontFamily="sans-serif">
                Área copa: {input.canopyAreaM2} m² | LAI: {result.species.laiDefault}
              </text>
              <text y="20" textAnchor="middle" fill="#e0e7ff" fontSize="7.5" fontFamily="monospace">
                v_d(NO₂) = {result.species.no2DepositionVelocityCmS} cm/s
              </text>
            </g>

            {/* NO2 Deposition Sink Arrows (Entering Canopy) */}
            <g stroke="#38bdf8" strokeWidth="1.8" fill="none" markerEnd="url(#arrow)">
              <path d="M -140,-180 Q -90,-160 -40,-160" />
              <path d="M -150,-130 Q -100,-130 -50,-140" />
              <text x="-160" y="-170" fill="#38bdf8" fontSize="8.5" fontWeight="bold" textAnchor="end">
                Captación NO₂ (-{result.no2RemovedGramsDay.toFixed(1)} g/día)
              </text>
            </g>
          </g>

          {/* BVOC Emission Plume Ascending to Atmospheric Oxidation Domain */}
          <g transform="translate(260, 130)">
            {/* Isoprene Molecule Branch */}
            <g
              transform="translate(40, -40)"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredMolecule('isoprene')}
              onMouseLeave={() => setHoveredMolecule(null)}
            >
              <path d="M -60,40 C -20,20 10,0 40,-20" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="5 3" fill="none" />
              <circle cx="40" cy="-20" r="14" fill="#0284c7" stroke="#7dd3fc" strokeWidth="1.5" />
              <text x="40" y="-16" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="bold">Isopreno</text>
              <text x="60" y="-18" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
                {result.isopreneFluxUgm2H.toFixed(0)} µg/m²·h
              </text>
            </g>

            {/* Monoterpenes Molecule Branch */}
            <g
              transform="translate(40, 10)"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredMolecule('monoterpenes')}
              onMouseLeave={() => setHoveredMolecule(null)}
            >
              <path d="M -60,0 C -10,0 20,-10 60,-5" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="5 3" fill="none" />
              <circle cx="60" cy="-5" r="14" fill="#d97706" stroke="#fde68a" strokeWidth="1.5" />
              <text x="60" y="-1" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">Terpenos</text>
              <text x="80" y="-3" fill="#f59e0b" fontSize="8" fontFamily="monospace" fontWeight="bold">
                {result.monoterpenesFluxUgm2H.toFixed(0)} µg/m²·h
              </text>
            </g>

            {/* Sesquiterpenes Molecule Branch */}
            <g
              transform="translate(40, 60)"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredMolecule('sesquiterpenes')}
              onMouseLeave={() => setHoveredMolecule(null)}
            >
              <path d="M -60,-20 C -20,0 10,20 50,35" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 2" fill="none" />
              <circle cx="50" cy="35" r="13" fill="#7e22ce" stroke="#e9d5ff" strokeWidth="1.2" />
              <text x="50" y="38" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="bold">Sesqui</text>
              <text x="70" y="38" fill="#c084fc" fontSize="8" fontFamily="monospace" fontWeight="bold">
                {result.sesquiterpenesFluxUgm2H.toFixed(0)} µg/m²·h
              </text>
            </g>
          </g>

          {/* Right: Atmospheric Reaction & SOA Formation Domain */}
          <g transform="translate(460, 40)">
            <rect width="270" height="230" rx="8" fill="#0f172a" fillOpacity="0.85" stroke="#475569" strokeWidth="1" />
            <text x="14" y="22" fill="#e2e8f0" fontSize="10.5" fontWeight="bold" fontFamily="sans-serif">
              Oxidación y Nucleación de SOA (PM₂.₅)
            </text>

            {/* Oxidants in Atmosphere */}
            <g transform="translate(14, 34)">
              <rect width="242" height="34" rx="4" fill="#1e293b" stroke="#334155" />
              <text x="8" y="14" fill="#94a3b8" fontSize="8">Oxidantes Atmosféricos Urbanos:</text>
              <text x="8" y="26" fill="#fbbf24" fontSize="9" fontFamily="monospace" fontWeight="bold">
                OH• + O₃ ({input.ambientO3Ppb} ppb) + NO₃• | NOx: {input.ambientNOxPpb} ppb
              </text>
            </g>

            {/* SOA Production Box */}
            <g transform="translate(14, 76)">
              <rect width="242" height="68" rx="4" fill="url(#soaPlumeGrad)" fillOpacity="0.25" stroke="#a855f7" strokeWidth="1.2" />
              <text x="10" y="18" fill="#f0abfc" fontSize="9.5" fontWeight="bold">Rendimiento Pankow SOA (PM₂.₅):</text>
              
              <text x="10" y="34" fill="#ffffff" fontSize="13" fontWeight="bold" fontFamily="monospace">
                +{result.soaMassProductionGramsDay.toFixed(2)} <tspan fontSize="9" fill="#e9d5ff">g SOA / día</tspan>
              </text>

              <text x="10" y="50" fill="#e2e8f0" fontSize="8" fontFamily="monospace">
                Yield Isopreno: {result.soaYieldIsoprenePct}% | Monoterp: {result.soaYieldMonoterpenesPct}% | Sesqui: {result.soaYieldSesquiterpenesPct}%
              </text>
              <text x="10" y="61" fill="#f472b6" fontSize="7.5" fontFamily="monospace">
                Rendimiento de 2 productos Odum/Pankow acoplado a M_o={input.ambientPM25Ugm3}µg/m³
              </text>
            </g>

            {/* Ozone Formation Potential (OFP) */}
            <g transform="translate(14, 152)">
              <rect width="242" height="66" rx="4" fill="#1e1b4b" stroke="#4338ca" strokeWidth="1" />
              <text x="10" y="16" fill="#818cf8" fontSize="9" fontWeight="bold">Potencial Fotoquímico O₃ (MIR Carter):</text>
              <text x="10" y="32" fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="monospace">
                +{result.totalOzoneFormationPotentialGramsDay.toFixed(1)} <tspan fontSize="8.5" fill="#94a3b8">g O₃ / día</tspan>
              </text>
              <text x="10" y="47" fill="#cbd5e1" fontSize="7.5" fontFamily="sans-serif">
                {isHighIsoprene ? '⚠ Especie con alto impacto en el pico de O3 estival.' : '✔ Bajo impacto fotoquímico en ozono troposférico.'}
              </text>
            </g>
          </g>

          {/* Bottom Bar: Net Air Quality Balance Verdict */}
          <g transform="translate(30, 285)">
            <rect width="700" height="85" rx="6" fill="#0b0f19" stroke={isNetPositive ? '#10b981' : '#f59e0b'} strokeWidth="1.2" />

            <g transform="translate(16, 20)">
              <text x="0" y="0" fill="#94a3b8" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">
                BALANCE NETO DE CALIDAD DEL AIRE (Filtración estomática vs. Precursores secundarios):
              </text>

              <div className="flex items-center">
                <text x="0" y="24" fill={isNetPositive ? '#34d399' : '#fbbf24'} fontSize="14" fontWeight="bold" fontFamily="monospace">
                  {isNetPositive ? '+' : ''}{result.netAirQualityBalanceScore.toFixed(2)} pts
                </text>
                <text x="120" y="22" fill="#cbd5e1" fontSize="9" fontFamily="sans-serif">
                  {result.recommendationClassification === 'highly_beneficial'
                    ? 'ALTAMENTE BENEFICIOSO: Purificación neta masiva sin generación excesiva de O3/SOA.'
                    : result.recommendationClassification === 'high_ozone_emitter'
                    ? 'ALERTA DE OZONO: Gran sombreado pero alta emisión de isopreno bajo radiación intensa.'
                    : 'EQUILIBRADO: Filtración adecuada y emisión moderada de terpenos.'}
                </text>
              </div>

              <text x="0" y="48" fill="#38bdf8" fontSize="8.5" fontFamily="sans-serif">
                <tspan fontWeight="bold" fill="#60a5fa">RECOMENDACIÓN URBANÍSTICA:</tspan> {result.doctoralAnalysisComment}
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Hovered Molecule Detail Banner */}
      {hoveredMolecule && (
        <div className="bg-slate-900 border border-emerald-700/60 p-2 rounded text-[10px] text-slate-300">
          <strong className="text-emerald-400 capitalize">{hoveredMolecule}:</strong> Emisión basal según temperatura foliar y PAR bajo formulación MEGAN 2.1 acoplada con constantes de partición de Pankow.
        </div>
      )}
    </div>
  );
}
