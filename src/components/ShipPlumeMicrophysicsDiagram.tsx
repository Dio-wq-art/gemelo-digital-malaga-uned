import React, { useState } from 'react';
import { ScientificTooltip } from './ScientificTooltip';
import { motion } from 'motion/react';
import { ShipPlumeSimulationResult, ShipPlumeInput } from '../lib/shipPlumeMicrophysics';
import { Download, Ship, Wind, Sparkles, Droplets, ShieldAlert, ShieldCheck, Flame, Compass } from 'lucide-react';
import { downloadVectorSvg } from '../lib/vectorExporter';

interface Props {
  input: ShipPlumeInput;
  result: ShipPlumeSimulationResult;
}

export function ShipPlumeMicrophysicsDiagram({ input, result }: Props) {
  const [activeZoneInspect, setActiveZoneInspect] = useState<'stack' | 'aging' | 'ccn' | null>(null);

  const handleExportSvg = () => {
    downloadVectorSvg('ship-plume-diagram-svg', `pluma_buque_${result.ship.id}_microfisica_malaga`);
  };

  const isCritical = result.urbanPenetrationLevel === 'high_critical';

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-lg p-3 space-y-3 font-sans">
      {/* Header with Title and Export Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sky-950/80 border border-sky-700/60 rounded text-sky-400">
            <Ship className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Microfísica de Pluma Portuaria y Activación Köhler CCN</span>
              <ScientificTooltip
                topic="coastal_halogen_clno2"
                title="Teoría Köhler Unificada (Petters & Kreidenweis 2007)"
                content="Modela la higroscopicidad monodispersa del aerosol portuario mediante el parámetro único kappa (κ). Determina el diámetro crítico D_pc para que las partículas de hollín y sulfato actúen como núcleos de condensación de nubes (CCN)."
                formula="S(D) = \frac{D^3 - D_d^3}{D^3 - D_d^3(1-\kappa)} \exp\left(\frac{4\sigma_{s/a} M_w}{R T \rho_w D}\right)"
                regulatory="Reglamento Marítimo IMO MARPOL Anexo VI (Zonas SECA/ECA Mediterráneo 2025)"
                position="bottom"
              >
                <span className="text-[8px] bg-sky-950 text-sky-300 border border-sky-700/60 px-1.5 py-0.2 rounded font-mono font-bold cursor-help">
                  PETTERS &amp; KREIDENWEIS (κ-KÖHLER)
                </span>
              </ScientificTooltip>
            </h4>
            <p className="text-[9.5px] text-slate-400">
              {result.ship.name} • Atraque: {result.ship.typicalBerthInMalaga} • Distancia a la costa: {input.downwindDistanceM} m
            </p>
          </div>
        </div>

        <ScientificTooltip
          title="Exportación Vectorial SVG de la Pluma"
          content="Exporta el trazado vectorial SVG con curvas de dispersión gaussiana, perfil de concentración SO2/BC y microfísica CCN."
          position="bottom"
        >
          <button
            onClick={handleExportSvg}
            className="flex items-center gap-1 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2 py-1 rounded transition-colors font-medium cursor-pointer"
          >
            <Download className="w-3 h-3 text-sky-400" />
            <span>Exportar SVG Vectorial</span>
          </button>
        </ScientificTooltip>
      </div>

      {/* Interactive Legend & Zone Selector */}
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono bg-slate-900/60 p-2 rounded border border-slate-800">
        <span className="text-slate-400 text-[9px] uppercase font-bold">Etapas Microfísicas:</span>
        <ScientificTooltip
          title="Etapa 1: Salida de Chimenea & Nucleación"
          content="Nucleación binaria homogénea ultrarrápida H2SO4-H2O con emisión masiva de nanopartículas (>10⁶ part/cm³) y núcleos de carbonilla (Black Carbon)."
          position="bottom"
        >
          <button
            onClick={() => setActiveZoneInspect('stack')}
            className={`px-2 py-0.5 rounded text-[9px] border transition-colors ${
              activeZoneInspect === 'stack' ? 'bg-amber-950 border-amber-500 text-amber-300 font-bold' : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            1. Chimenea (Nucleación)
          </button>
        </ScientificTooltip>

        <ScientificTooltip
          title="Etapa 2: Envejecimiento & Coagulación en Bahía"
          content="Coagulación browniana y condensación de sulfatos y compuestos orgánicos secundarios que aumentan el diámetro modal en el trayecto sobre la bahía de Málaga."
          position="bottom"
        >
          <button
            onClick={() => setActiveZoneInspect('aging')}
            className={`px-2 py-0.5 rounded text-[9px] border transition-colors ${
              activeZoneInspect === 'aging' ? 'bg-sky-950 border-sky-500 text-sky-300 font-bold' : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            2. Envejecimiento Marino
          </button>
        </ScientificTooltip>

        <ScientificTooltip
          title="Etapa 3: Activación Köhler CCN en Brisa Litoral"
          content="A sobresaturaciones típicas marinas (0.2-0.6%), las partículas superan el diámetro crítico Köhler convirtiéndose en gotas nubosas y aerosol respirable."
          position="bottom"
        >
          <button
            onClick={() => setActiveZoneInspect('ccn')}
            className={`px-2 py-0.5 rounded text-[9px] border transition-colors ${
              activeZoneInspect === 'ccn' ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold' : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            3. Activación CCN Litoral
          </button>
        </ScientificTooltip>
      </div>

      {/* SVG Canvas with Active Dynamic Visualizations */}
      <div className="relative bg-slate-900/90 rounded-md border border-slate-800/80 overflow-hidden flex items-center justify-center p-2">
        <svg
          id="ship-plume-diagram-svg"
          viewBox="0 0 760 390"
          className="w-full h-auto max-h-[370px] select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="seaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#082f49" stopOpacity="0.95" />
            </linearGradient>

            <linearGradient id="shipHullGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="plumeDispersionGrad" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
              <stop offset="30%" stopColor="#f59e0b" stopOpacity="0.65" />
              <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.25" />
            </linearGradient>

            <radialGradient id="stackFlame" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>

            <filter id="plumeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Sky and Sea Domain */}
          <rect x="10" y="10" width="740" height="370" rx="8" fill="#0b1120" stroke="#1e293b" strokeWidth="1.2" />

          {/* Sea Layer at Bottom */}
          <rect x="10" y="270" width="740" height="110" fill="url(#seaGrad)" />
          {/* Waves */}
          <path d="M 10,270 Q 60,265 110,270 T 210,270 T 310,270 T 410,270 T 510,270 T 610,270 T 710,270 T 750,270" stroke="#0284c7" strokeWidth="1.5" fill="none" opacity="0.6" />

          {/* Port Shoreline & Coast of Málaga (Right) */}
          <g transform="translate(580, 190)">
            {/* Muelle de Levante & La Farola Silhouette */}
            <rect x="0" y="70" width="160" height="20" fill="#334155" stroke="#475569" strokeWidth="1" />
            {/* La Farola Lighthouse */}
            <path d="M 60,70 L 64,15 L 76,15 L 80,70 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
            <rect x="62" y="5" width="16" height="10" rx="2" fill="#38bdf8" fillOpacity="0.8" />
            <polygon points="70,5 50,-10 90,-10" fill="#facc15" fillOpacity="0.5" />
            <text x="70" y="85" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">LA FAROLA / MUELLE 1</text>
          </g>

          {/* Cruise Ship at Left Berth */}
          <g transform="translate(60, 230)">
            {/* Ship Hull */}
            <path d="M 0,40 L 160,40 L 190,10 L 175,-25 L 10,-25 L 0,10 Z" fill="url(#shipHullGrad)" stroke="#64748b" strokeWidth="1.5" />
            {/* Superstructure decks */}
            <rect x="25" y="-60" width="125" height="35" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
            <rect x="35" y="-80" width="95" height="20" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            {/* Portholes */}
            <circle cx="45" cy="-45" r="2.5" fill="#38bdf8" />
            <circle cx="65" cy="-45" r="2.5" fill="#38bdf8" />
            <circle cx="85" cy="-45" r="2.5" fill="#38bdf8" />
            <circle cx="105" cy="-45" r="2.5" fill="#38bdf8" />
            <circle cx="125" cy="-45" r="2.5" fill="#38bdf8" />

            {/* Chimney Funnel */}
            <path d="M 75,-80 L 70,-115 L 105,-115 L 98,-80 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
            <rect x="68" y="-118" width="39" height="4" fill="#1e293b" />
            {/* Stack Flame Glow */}
            <circle cx="87" cy="-120" r="10" fill="url(#stackFlame)" />

            <text x="90" y="55" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="bold">
              {result.ship.shipType}
            </text>
          </g>

          {/* Plume Dispersion Trajectory (Expanding Cone) */}
          <g transform="translate(148, 112)">
            <path
              d="M 0,0 C 120,-30 280,-40 580,20 L 580,90 C 280,30 120,20 0,0 Z"
              fill="url(#plumeDispersionGrad)"
              filter="url(#plumeGlow)"
            />

            {/* Plume Centerline Streamline */}
            <path
              d="M 0,0 C 120,-10 280,-10 580,55"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeDasharray="6 3"
              fill="none"
              opacity="0.8"
            />
          </g>

          {/* Interactive Inspection Nodes along Plume */}
          {/* 1. Chimney Exit (Fresh Nucleation) */}
          <g
            transform="translate(160, 95)"
            className="cursor-pointer"
            onClick={() => setActiveZoneInspect('stack')}
          >
            <circle r="22" fill="#0f172a" fillOpacity="0.9" stroke="#ef4444" strokeWidth="2" />
            <circle r="6" fill="#ef4444" />
            <text x="0" y="32" textAnchor="middle" fill="#fca5a5" fontSize="8" fontWeight="bold">1. Nucleación Primaria</text>
            <text x="0" y="42" textAnchor="middle" fill="#cbd5e1" fontSize="7" fontFamily="monospace">Dp ≈ 22 nm</text>
          </g>

          {/* 2. Plume Aging & Coagulation (Midway) */}
          <g
            transform="translate(380, 100)"
            className="cursor-pointer"
            onClick={() => setActiveZoneInspect('aging')}
          >
            <circle r="26" fill="#0f172a" fillOpacity="0.9" stroke="#f59e0b" strokeWidth="2" />
            <circle r="10" fill="#f59e0b" fillOpacity="0.7" stroke="#fde68a" strokeWidth="1" />
            <text x="0" y="36" textAnchor="middle" fill="#fde68a" fontSize="8" fontWeight="bold">2. Coagulación &amp; H₂SO₄</text>
            <text x="0" y="46" textAnchor="middle" fill="#cbd5e1" fontSize="7" fontFamily="monospace">
              Dp ≈ {result.geometricMeanDiameterNm.toFixed(0)} nm
            </text>
          </g>

          {/* 3. Köhler Droplet Activation (Coastline) */}
          <g
            transform="translate(600, 140)"
            className="cursor-pointer"
            onClick={() => setActiveZoneInspect('ccn')}
          >
            <circle r="30" fill="#0f172a" fillOpacity="0.9" stroke="#38bdf8" strokeWidth="2" />
            <circle r="14" fill="#0284c7" fillOpacity="0.6" stroke="#7dd3fc" strokeWidth="1.5" />
            <text x="0" y="40" textAnchor="middle" fill="#7dd3fc" fontSize="8" fontWeight="bold">3. Activación CCN (κ-Köhler)</text>
            <text x="0" y="50" textAnchor="middle" fill="#cbd5e1" fontSize="7" fontFamily="monospace">
              N_ccn = {result.ccnNumberConcentrationCm3} cm⁻³
            </text>
          </g>

          {/* Top-Right: Meteorological & Chemical Summary Badge */}
          <g transform="translate(480, 25)">
            <rect width="250" height="70" rx="6" fill="#0f172a" fillOpacity="0.9" stroke="#334155" strokeWidth="1" />
            <text x="10" y="18" fill="#e2e8f0" fontSize="9" fontWeight="bold">Telemetría de Pluma Portuaria:</text>
            
            <text x="10" y="34" fill="#38bdf8" fontSize="8.5" fontFamily="monospace">
              SO₂ Sotavento: <tspan fontWeight="bold" fill="#ffffff">{result.so2DownwindUgm3.toFixed(1)} µg/m³</tspan>
            </text>
            <text x="10" y="47" fill="#f43f5e" fontSize="8.5" fontFamily="monospace">
              Black Carbon (Hollín): <tspan fontWeight="bold" fill="#ffffff">{result.blackCarbonDownwindUgm3.toFixed(2)} µg/m³</tspan>
            </text>
            <text x="10" y="60" fill="#34d399" fontSize="8.5" fontFamily="monospace">
              N_tot: <tspan fontWeight="bold" fill="#ffffff">{result.totalParticleNumberCm3.toLocaleString()} cm⁻³</tspan> | κ={result.effectiveKappa.toFixed(2)}
            </text>
          </g>

          {/* Bottom Bar: Environmental & Port Regulation Verdict */}
          <g transform="translate(30, 290)">
            <rect width="700" height="80" rx="6" fill="#090d16" stroke={isCritical ? '#ef4444' : '#38bdf8'} strokeWidth="1.2" />

            <g transform="translate(16, 20)">
              <text x="0" y="0" fill="#94a3b8" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">
                EVALUACIÓN DE IMPACTO EN EL FRENTE URBANO DE MÁLAGA (IMO MARPOL / MED-ECA):
              </text>

              <div className="flex items-center">
                <text x="0" y="22" fill={isCritical ? '#f87171' : '#38bdf8'} fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                  {result.urbanPenetrationLevel === 'high_critical' ? '🔴 IMPACTO CRÍTICO' : '🟢 IMPACTO MODERADO/CONTROLADO'}
                </text>
                <text x="170" y="21" fill="#cbd5e1" fontSize="8.5" fontFamily="sans-serif">
                  Fracción activada CCN: {(result.activatedFractionCCN * 100).toFixed(1)}% | Diámetro crítico seco D_pc: {result.criticalDryDiameterNm.toFixed(0)} nm
                </text>
              </div>

              <text x="0" y="44" fill="#38bdf8" fontSize="8.5" fontFamily="sans-serif">
                <tspan fontWeight="bold" fill="#60a5fa">PLAN DE MITIGACIÓN:</tspan> {result.mitigationVerdict}
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Detail Window on Stage Click */}
      {activeZoneInspect && (
        <div className="bg-slate-900 border border-sky-700/60 p-2.5 rounded text-[10px] text-slate-300 flex justify-between items-center">
          <div>
            {activeZoneInspect === 'stack' && (
              <span><strong>Etapa 1 (Salida de Chimenea):</strong> Nucleación homogénea binaria rápida H₂SO₄–H₂O con alta densidad de partículas ultrafinas (&gt;10⁶ part/cm³) y núcleo de carbono elemental.</span>
            )}
            {activeZoneInspect === 'aging' && (
              <span><strong>Etapa 2 (Envejecimiento en Bahía):</strong> Coagulación browniana y condensación de sulfatos que engrosan el diámetro modal hasta ~{result.geometricMeanDiameterNm.toFixed(0)} nm.</span>
            )}
            {activeZoneInspect === 'ccn' && (
              <span><strong>Etapa 3 (Activación Köhler):</strong> La higroscopicidad κ = {result.effectiveKappa.toFixed(2)} permite la activación en núcleos de condensación a S = {input.supersaturationPct}% al penetrar en la brisa litoral.</span>
            )}
          </div>
          <button
            onClick={() => setActiveZoneInspect(null)}
            className="text-[9px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300 ml-3"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
