import React, { useState } from 'react';
import { ScientificTooltip } from './ScientificTooltip';
import { motion } from 'motion/react';
import {
  IsorropiaEquilibriumResult,
  InorganicAerosolInput,
  AerosolPhaseState
} from '../lib/isorropiaInorganicAerosol';
import { Download, Layers, Droplets, Sparkles, Activity, ShieldCheck, Thermometer, Flame } from 'lucide-react';
import { downloadVectorSvg } from '../lib/vectorExporter';

interface Props {
  inputs: InorganicAerosolInput;
  result: IsorropiaEquilibriumResult;
}

export function IsorropiaPhaseDiagram({ inputs, result }: Props) {
  const [selectedIon, setSelectedIon] = useState<string | null>(null);

  const handleExportSvg = () => {
    downloadVectorSvg('isorropia-phase-diagram-svg', 'diagrama_termodinamico_isorropia2_malaga');
  };

  const isAqueous = result.phaseState !== 'dry_effloresced';
  const dropletRadius = isAqueous ? Math.min(110, Math.max(55, 50 + result.alwc_ugm3 * 2.8)) : 45;
  const isCondensing = result.saturationRatioS >= 1.0;

  // Gradiente de pH visual (0 a 14)
  const phNormalized = Math.max(0, Math.min(1, (result.aerosolPH - 1) / 6));

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-lg p-3 space-y-3 font-sans">
      {/* Header with Title and Export Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-950/80 border border-indigo-700/60 rounded text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Termodinámica Gas-Partícula ISORROPIA-II</span>
              <ScientificTooltip
                topic="aerosol_multimodal_distribution"
                title="Termodinámica de Aerosoles ISORROPIA-II"
                content="Modelo de equilibrio termodinámico multicomponente (sistema K⁺-Ca²⁺-Mg²⁺-NH₄⁺-Na⁺-SO₄²⁻-NO₃⁻-Cl⁻-H₂O) que resuelve las constantes de equilibrio químico y partición de fases gas-acuosa-sólida."
                regulatory="Modelo oficial US EPA / CMAQ & EMEP"
                citation="Fountoukis, C. & Nenes, A. (2007) Atmos. Chem. Phys., 7, 4639-4659."
              >
                <span className="text-[8px] bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-1.5 py-0.2 rounded font-mono font-bold cursor-help">
                  SEINFELD-PANDIS / MOZURKEWICH
                </span>
              </ScientificTooltip>
            </h4>
            <p className="text-[9.5px] text-slate-400">
              Equilibrio multifásico de nitrato amónico, sulfatos y contenido de agua líquida (ALWC) en Málaga
            </p>
          </div>
        </div>

        <ScientificTooltip
          title="Exportación SVG Vectorial del Diagrama de Fases"
          content="Exporta el gráfico vectorial completo a resolución nativa con trazabilidad de reactivos y productos iónicos para publicación en tesis."
        >
          <button
            onClick={handleExportSvg}
            className="flex items-center gap-1 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2 py-1 rounded transition-colors font-medium cursor-pointer"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>Exportar SVG Vectorial</span>
          </button>
        </ScientificTooltip>
      </div>

      {/* SVG Canvas with Active Dynamic Visualizations */}
      <div className="relative bg-slate-900/90 rounded-md border border-slate-800/80 overflow-hidden flex items-center justify-center p-2">
        <svg
          id="isorropia-phase-diagram-svg"
          viewBox="0 0 760 380"
          className="w-full h-auto max-h-[360px] select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <radialGradient id="dropletGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="65%" stopColor="#0284c7" stopOpacity="0.25" />
              <stop offset="90%" stopColor="#0369a1" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
            </radialGradient>

            <radialGradient id="solidCrystalGradient" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#94a3b8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#475569" stopOpacity="1" />
            </radialGradient>

            <linearGradient id="gasZoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="phScaleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="30%" stopColor="#f59e0b" />
              <stop offset="60%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Gas Domain */}
          <rect x="10" y="10" width="740" height="360" rx="8" fill="url(#gasZoneGradient)" stroke="#334155" strokeWidth="1.2" />

          {/* Title and Domain Labels */}
          <text x="30" y="36" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="bold">
            DOMINIO DE GAS ATMOSFÉRICO (Vapor de NH₃ + HNO₃ + H₂O)
          </text>
          <text x="730" y="36" textAnchor="end" fill="#38bdf8" fontSize="10" fontFamily="monospace">
            T = {inputs.tempCelsius.toFixed(1)} °C | HR = {inputs.relativeHumidityPct.toFixed(0)} %
          </text>

          {/* Left Panel: Gas Phase Species & Fluxes */}
          <g transform="translate(30, 60)">
            <rect width="180" height="175" rx="6" fill="#0f172a" fillOpacity="0.8" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 2" />
            <text x="14" y="24" fill="#60a5fa" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
              Precursores en Fase Gas
            </text>

            {/* NH3 Gas Box */}
            <g transform="translate(14, 38)">
              <rect width="152" height="42" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
              <text x="10" y="18" fill="#38bdf8" fontSize="10" fontWeight="bold">NH₃ (Amoníaco)</text>
              <text x="10" y="33" fill="#e2e8f0" fontSize="11" fontFamily="monospace" fontWeight="bold">
                {result.gasNH3_ppb.toFixed(2)} <tspan fontSize="8.5" fill="#94a3b8">ppb ({result.gasNH3_ugm3.toFixed(1)} µg/m³)</tspan>
              </text>
            </g>

            {/* HNO3 Gas Box */}
            <g transform="translate(14, 88)">
              <rect width="152" height="42" rx="4" fill="#1e293b" stroke="#f43f5e" strokeWidth="1" />
              <text x="10" y="18" fill="#fb7185" fontSize="10" fontWeight="bold">HNO₃ (Ácido Nítrico)</text>
              <text x="10" y="33" fill="#e2e8f0" fontSize="11" fontFamily="monospace" fontWeight="bold">
                {result.gasHNO3_ppb.toFixed(2)} <tspan fontSize="8.5" fill="#94a3b8">ppb ({result.gasHNO3_ugm3.toFixed(1)} µg/m³)</tspan>
              </text>
            </g>

            {/* Equilibrium Product vs Kp */}
            <g transform="translate(14, 138)">
              <text x="0" y="12" fill="#cbd5e1" fontSize="8.5" fontFamily="monospace">
                Producto: <tspan fill="#f59e0b" fontWeight="bold">{result.dissociationProduct_ppb2.toFixed(1)}</tspan> ppb²
              </text>
              <text x="0" y="24" fill="#cbd5e1" fontSize="8.5" fontFamily="monospace">
                Kp(T): <tspan fill="#38bdf8" fontWeight="bold">{result.kp_nh4no3_ppb2.toFixed(1)}</tspan> ppb²
              </text>
              <text x="0" y="35" fill={isCondensing ? '#34d399' : '#f87171'} fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                S = {result.saturationRatioS.toFixed(2)} ({isCondensing ? '▲ Condensando' : '▼ Evaporando'})
              </text>
            </g>
          </g>

          {/* Central Animated Aerosol Droplet / Crystal Matrix */}
          <g transform="translate(380, 160)">
            {isAqueous ? (
              <>
                {/* Water Shell (ALWC) */}
                <circle
                  r={dropletRadius}
                  fill="url(#dropletGradient)"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  filter="url(#glowEffect)"
                />
                
                {/* Droplet Interface Layer */}
                <circle
                  r={dropletRadius * 0.72}
                  fill="#0c4a6e"
                  fillOpacity="0.4"
                  stroke="#7dd3fc"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                />

                {/* Core Ions (Interactive Nodes) */}
                {/* NH4+ Node */}
                <g transform="translate(-32, -22)" className="cursor-pointer" onClick={() => setSelectedIon('NH4')}>
                  <circle r="18" fill="#0284c7" stroke="#bae6fd" strokeWidth="1.5" />
                  <text y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">NH₄⁺</text>
                  <text y="14" textAnchor="middle" fill="#e0f2fe" fontSize="7" fontFamily="monospace">
                    {result.aerosolNH4_ugm3.toFixed(1)}µg
                  </text>
                </g>

                {/* NO3- Node */}
                <g transform="translate(28, -24)" className="cursor-pointer" onClick={() => setSelectedIon('NO3')}>
                  <circle r="18" fill="#e11d48" stroke="#fecdd3" strokeWidth="1.5" />
                  <text y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">NO₃⁻</text>
                  <text y="14" textAnchor="middle" fill="#ffe4e6" fontSize="7" fontFamily="monospace">
                    {result.aerosolNO3_ugm3.toFixed(1)}µg
                  </text>
                </g>

                {/* SO4(2-) Node */}
                <g transform="translate(-15, 26)" className="cursor-pointer" onClick={() => setSelectedIon('SO4')}>
                  <circle r="20" fill="#d97706" stroke="#fde68a" strokeWidth="1.5" />
                  <text y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">SO₄²⁻</text>
                  <text y="14" textAnchor="middle" fill="#fef3c7" fontSize="7" fontFamily="monospace">
                    {result.aerosolSO4_ugm3.toFixed(1)}µg
                  </text>
                </g>

                {/* Na+ and Cl- Marine Nodes */}
                <g transform="translate(35, 24)" className="cursor-pointer" onClick={() => setSelectedIon('Na_Cl')}>
                  <circle r="14" fill="#059669" stroke="#a7f3d0" strokeWidth="1.2" />
                  <text y="3" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">Na⁺·Cl⁻</text>
                </g>

                {/* ALWC Label */}
                <text y={dropletRadius + 18} textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  Gotícula Acuosa ALWC: {result.alwc_ugm3.toFixed(1)} µg/m³
                </text>
              </>
            ) : (
              <>
                {/* Solid Crystalline Effloresced Salt */}
                <polygon
                  points="-45,-30 0,-55 45,-30 45,30 0,55 -45,30"
                  fill="url(#solidCrystalGradient)"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                />
                <text y="-5" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="bold">CRISTAL SÓLIDO</text>
                <text y="10" textAnchor="middle" fill="#1e293b" fontSize="8" fontFamily="monospace">
                  (NH₄)₂SO₄ + NH₄NO₃ (s)
                </text>
                <text y="70" textAnchor="middle" fill="#f59e0b" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                  Estado Eflorescido Seco (HR &lt; {result.erhPct.toFixed(0)}%)
                </text>
              </>
            )}

            {/* Condensation / Evaporation Flux Arrows */}
            {isCondensing ? (
              <g stroke="#34d399" strokeWidth="2" fill="none" markerEnd="url(#arrow)">
                <path d="M -140,-40 C -90,-20 -60,-10 -dropletRadius,0" />
                <path d="M -140,40 C -90,20 -60,10 -dropletRadius,0" />
                <text x="-145" y="0" fill="#34d399" fontSize="8.5" fontWeight="bold" textAnchor="end">
                  Flujo de Condensación (+ΔPM2.5)
                </text>
              </g>
            ) : (
              <g stroke="#f87171" strokeWidth="2" fill="none">
                <path d="M -dropletRadius,0 C -60,-20 -90,-40 -140,-40" />
                <path d="M -dropletRadius,0 C -60,20 -90,40 -140,40" />
                <text x="-145" y="0" fill="#f87171" fontSize="8.5" fontWeight="bold" textAnchor="end">
                  Flujo de Volatilización
                </text>
              </g>
            )}
          </g>

          {/* Right Panel: Phase & Equilibrium Metrics */}
          <g transform="translate(540, 60)">
            <rect width="190" height="175" rx="6" fill="#0f172a" fillOpacity="0.8" stroke="#6366f1" strokeWidth="1" />
            <text x="14" y="22" fill="#818cf8" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
              Métricas de Aerosol PM₂.₅
            </text>

            {/* Total SIA PM2.5 */}
            <g transform="translate(14, 34)">
              <text x="0" y="10" fill="#94a3b8" fontSize="8.5">Total SIA en PM2.5:</text>
              <text x="0" y="26" fill="#38bdf8" fontSize="14" fontWeight="bold" fontFamily="monospace">
                {result.totalSiaPM25_ugm3.toFixed(2)} <tspan fontSize="9" fill="#94a3b8">µg/m³</tspan>
              </text>
            </g>

            {/* Partitioning Fractions */}
            <g transform="translate(14, 76)">
              <div className="space-y-1">
                <text x="0" y="10" fill="#cbd5e1" fontSize="8.5" fontFamily="monospace">
                  ε(NO₃⁻) = {(result.nitratePartitioningEpsilon * 100).toFixed(1)}% <tspan fill="#64748b">(en PM2.5)</tspan>
                </text>
                <text x="0" y="24" fill="#cbd5e1" fontSize="8.5" fontFamily="monospace">
                  ε(NH₄⁺) = {(result.ammoniaPartitioningEpsilon * 100).toFixed(1)}% <tspan fill="#64748b">(en PM2.5)</tspan>
                </text>
                <text x="0" y="38" fill="#cbd5e1" fontSize="8.5" fontFamily="monospace">
                  DRH: {result.drhPct.toFixed(1)}% | ERH: {result.erhPct.toFixed(1)}%
                </text>
              </div>
            </g>

            {/* Regime Badge */}
            <g transform="translate(14, 128)">
              <rect width="162" height="32" rx="4" fill="#1e1b4b" stroke="#6366f1" strokeWidth="0.8" />
              <text x="8" y="14" fill="#a5b4fc" fontSize="7.5" fontWeight="bold" fontFamily="monospace">RÉGIMEN TERMODINÁMICO:</text>
              <text x="8" y="25" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
                {result.limitingPrecursor === 'HNO3_limited' ? 'Limitado por HNO₃ (Tráfico)' : 'Limitado por NH₃ (Amonio)'}
              </text>
            </g>
          </g>

          {/* Bottom Bar: pH Scale & Deliquescence Spectrum */}
          <g transform="translate(30, 260)">
            <rect width="700" height="95" rx="6" fill="#0b0f19" stroke="#1e293b" strokeWidth="1" />
            
            {/* pH Meter */}
            <g transform="translate(20, 20)">
              <text x="0" y="0" fill="#cbd5e1" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                Acidez del Aerosol (pH Acuoso): <tspan fill="#f59e0b" fontFamily="monospace">{result.aerosolPH.toFixed(2)}</tspan>
              </text>
              <rect x="0" y="10" width="300" height="10" rx="3" fill="url(#phScaleGrad)" />
              {/* Marker */}
              <circle cx={Math.max(6, Math.min(294, phNormalized * 300))} cy="15" r="7" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
              <text x="0" y="32" fill="#ef4444" fontSize="7.5" fontFamily="monospace">0 (Muy Ácido)</text>
              <text x="150" y="32" textAnchor="middle" fill="#f59e0b" fontSize="7.5" fontFamily="monospace">3.5 (Típico Málaga)</text>
              <text x="300" y="32" textAnchor="end" fill="#3b82f6" fontSize="7.5" fontFamily="monospace">7.0 (Neutro)</text>
            </g>

            {/* Deliquescence Phase Line */}
            <g transform="translate(360, 20)">
              <text x="0" y="0" fill="#cbd5e1" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                Estado Físico en Función de la Humedad (HR):
              </text>
              
              <div className="relative">
                <rect x="0" y="10" width="320" height="10" rx="3" fill="#1e293b" />
                {/* ERH Zone */}
                <rect x="0" y="10" width={(result.erhPct / 100) * 320} height="10" rx="2" fill="#64748b" fillOpacity="0.8" />
                {/* Metastable Zone */}
                <rect
                  x={(result.erhPct / 100) * 320}
                  y="10"
                  width={((result.drhPct - result.erhPct) / 100) * 320}
                  height="10"
                  fill="#f59e0b"
                  fillOpacity="0.7"
                />
                {/* Deliquescent Zone */}
                <rect
                  x={(result.drhPct / 100) * 320}
                  y="10"
                  width={(1 - result.drhPct / 100) * 320}
                  height="10"
                  fill="#0284c7"
                  fillOpacity="0.8"
                />

                {/* Current RH Cursor */}
                <polygon
                  points={`${(inputs.relativeHumidityPct / 100) * 320 - 4},7 ${(inputs.relativeHumidityPct / 100) * 320 + 4},7 ${(inputs.relativeHumidityPct / 100) * 320},13`}
                  fill="#ffffff"
                />
              </div>

              <text x="0" y="32" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">Seco (&lt;{result.erhPct.toFixed(0)}%)</text>
              <text x="160" y="32" textAnchor="middle" fill="#fbbf24" fontSize="7.5" fontFamily="monospace">Metaestable ({result.erhPct.toFixed(0)}-{result.drhPct.toFixed(0)}%)</text>
              <text x="320" y="32" textAnchor="end" fill="#38bdf8" fontSize="7.5" fontFamily="monospace">Gotícula Acuosa (&gt;{result.drhPct.toFixed(0)}%)</text>
            </g>

            {/* Recommendation Footer inside SVG */}
            <text x="20" y="78" fill="#38bdf8" fontSize="8.5" fontFamily="sans-serif">
              <tspan fontWeight="bold" fill="#60a5fa">DIAGNÓSTICO REGULATORIO:</tspan> {result.mitigationRecommendation}
            </text>
          </g>
        </svg>
      </div>

      {/* Interactive Detail Box on Click */}
      {selectedIon && (
        <div className="bg-slate-900 border border-indigo-700/60 p-2 rounded text-[10px] flex items-center justify-between text-slate-300">
          <div>
            <strong className="text-indigo-400">Ion Seleccionado: {selectedIon}</strong> — Equilibrio de fases termodinámico según constantes de Henry y coeficientes de actividad Pitzer/Kusick-Meissner.
          </div>
          <button
            onClick={() => setSelectedIon(null)}
            className="text-[9px] bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded text-slate-400 hover:text-white"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
