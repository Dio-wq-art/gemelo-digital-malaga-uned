import React from 'react';
import { motion } from 'motion/react';
import { Orbit, Sun, Globe, Activity, Layers, Download, CheckCircle2, Zap } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';

interface TropomiRetrievalSwathDiagramProps {
  no2ColumnMolesM2: number;
  troposphericAmf: number;
  cloudFraction: number;
  albedo: number;
  solarZenithAngleDeg: number;
}

export function TropomiRetrievalSwathDiagram({
  no2ColumnMolesM2,
  troposphericAmf,
  cloudFraction,
  albedo,
  solarZenithAngleDeg
}: TropomiRetrievalSwathDiagramProps) {
  // SVG Canvas dimensions: 620x350
  const width = 620;
  const height = 350;

  const no2VcdUmolM2 = (no2ColumnMolesM2 * 1e6).toFixed(1);

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-3 font-sans shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-500/10 border border-indigo-500/30">
            <Orbit className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              Geometría de Adquisición TROPOMI / Sentinel-5P &amp; DOAS Radiativo
              <ScientificTooltip
                title="Espectroscopía de Absorción Óptica Diferencial (DOAS 405–465 nm)"
                formula="VCD_{\text{trop}} = \frac{SCD_{\text{total}} - SCD_{\text{strat}}}{AMF_{\text{trop}}(\theta_0, \theta_v, A_s, p_{\text{cloud}})}"
                normative="Copernicus Sentinel-5P ATBD KNMI (van Geffen et al., 2022; Eskes et al., 2024)"
                content="Esquema físico de inversión espectral UV-Vis de Sentinel-5P TROPOMI sobre la Bahía de Málaga. Separa la columna oblicua estratosférica de la columna vertical troposférica mediante transporte químico TM5-MP y aplica el Factor de Masa de Aire (AMF) resuelto por transferencia radiativa Doubling-Adding KNMI (DAK)."
              />
            </h4>
            <p className="text-[9.5px] text-slate-400">
              Transferencia radiativa (DISORT) • Factor de Masa de Aire Troposférico (AMF) y Kernels de Promediado
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ScientificTooltip
            position="left"
            title="Factor de Masa de Aire Troposférico (AMF)"
            formula="AMF_{\text{trop}} = \frac{\sum_l m_l(\theta_0, \theta_v, A_s) \cdot x_{a,l}}{\sum_l x_{a,l}}"
            normative="Boersma et al. (2018) AMT • Lorente et al. (2017) KNMI"
            content={`Cociente entre la columna oblicua (Slant Column Density) y la columna vertical (Vertical Column Density) integrado con los pesos ópticos por altitud m_l (box-AMFs) y el perfil a priori CAMS/TM5 x_{a,l}. Valor actual: ${troposphericAmf.toFixed(2)}.`}
          >
            <span className="cursor-help text-[10px] font-bold px-2.5 py-1 rounded-full border bg-indigo-950 text-indigo-300 border-indigo-700 flex items-center gap-1">
              <Activity className="w-3 h-3 text-indigo-400 animate-pulse" />
              AMF Tropo: {troposphericAmf.toFixed(2)}
            </span>
          </ScientificTooltip>
        </div>
      </div>

      {/* SVG Retrieval Geometry */}
      <div className="relative w-full overflow-hidden bg-slate-900/60 rounded-lg border border-slate-800/60">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          id="tropomi-swath-svg"
        >
          <defs>
            <linearGradient id="spaceAtmGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#020617" />
              <stop offset="40%" stopColor="#0f172a" />
              <stop offset="75%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="pblPollutionGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="80%" stopColor="#0284c7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
            </linearGradient>

            <filter id="satGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Atmospheric Vertical Slices */}
          <rect x="0" y="0" width={width} height={height} fill="url(#spaceAtmGrad)" />

          {/* Top of Atmosphere (TOA) & Stratosphere line */}
          <line x1="30" y1="90" x2="590" y2="90" stroke="#64748b" strokeWidth="1" strokeDasharray="5 3" />
          <text x="580" y="82" fill="#94a3b8" fontSize="8" textAnchor="end">Tope de la Atmósfera (TOA ~50 km)</text>

          {/* Free Troposphere line */}
          <line x1="30" y1="180" x2="590" y2="180" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
          <text x="580" y="172" fill="#94a3b8" fontSize="8" textAnchor="end">Troposfera Libre (~3-10 km)</text>

          {/* Planetary Boundary Layer (PBL ~ 1.2 km) with Malaga NO2 plume */}
          <rect x="30" y="240" width="560" height="50" fill="url(#pblPollutionGrad)" rx="4" />
          <line x1="30" y1="240" x2="590" y2="240" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="580" y="232" fill="#fbbf24" fontSize="8" textAnchor="end">Capa Límite Planetaria (PBL ~1200 m)</text>

          {/* Ground Terrain (Malaga coastline & mountains) */}
          <path
            d="M 30 290 Q 140 275, 240 290 T 400 290 Q 480 270, 590 290 L 590 340 L 30 340 Z"
            fill="#090d16"
            stroke="#334155"
            strokeWidth="1.5"
          />
          <text x="180" y="325" fill="#64748b" fontSize="8.5" fontWeight="bold">Montes de Málaga</text>
          <text x="360" y="325" fill="#38bdf8" fontSize="8.5" fontWeight="bold">Bahía de Málaga / Puerto</text>
          <text x="500" y="325" fill="#64748b" fontSize="8.5" fontWeight="bold">Valle del Guadalhorce</text>

          {/* 2. Sun & Incident Direct Solar Ray */}
          <g transform="translate(90, 45)">
            <circle cx="0" cy="0" r="16" fill="#f59e0b" filter="url(#satGlow)" />
            <circle cx="0" cy="0" r="10" fill="#fbbf24" />
            <text x="0" y="30" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="middle">Sol (SZA {solarZenithAngleDeg}°)</text>
          </g>

          {/* Solar Downward Beam to Surface */}
          <line
            x1="95"
            y1="55"
            x2="360"
            y2="290"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="6 3"
            opacity="0.8"
          />
          <text x="210" y="160" fill="#fbbf24" fontSize="8" transform="rotate(40 210 160)">
            Radiación Solar Directa I₀(λ)
          </text>

          {/* 3. Surface Backscatter / Albedo Reflection */}
          <ellipse cx="360" cy="290" rx="35" ry="10" fill="#fbbf24" opacity="0.2" />
          <text x="360" y="305" fill="#fbbf24" fontSize="7.5" textAnchor="middle">
            Albedo A_s = {albedo.toFixed(2)}
          </text>

          {/* 4. Sentinel-5P Satellite in Orbit */}
          <g transform="translate(420, 40)">
            {/* Solar panels */}
            <rect x="-35" y="-6" width="22" height="12" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
            <rect x="13" y="-6" width="22" height="12" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
            {/* Satellite body */}
            <rect x="-12" y="-10" width="24" height="20" rx="4" fill="#cbd5e1" stroke="#ffffff" strokeWidth="1.5" filter="url(#satGlow)" />
            {/* TROPOMI UVN Telescope aperture */}
            <circle cx="0" cy="8" r="4" fill="#0f172a" stroke="#f43f5e" strokeWidth="1.5" />
            <text x="0" y="-16" fill="#e2e8f0" fontSize="9" fontWeight="bold" textAnchor="middle">
              Sentinel-5P (TROPOMI)
            </text>
            <text x="0" y="-28" fill="#38bdf8" fontSize="7.5" textAnchor="middle">
              Órbita LEO Sincrona Solar ~824 km
            </text>
          </g>

          {/* Upward Scattered Beam to Satellite Aperture */}
          <line
            x1="360"
            y1="290"
            x2="420"
            y2="48"
            stroke="#38bdf8"
            strokeWidth="2.2"
            strokeDasharray="4 2"
          />
          <text x="400" y="180" fill="#38bdf8" fontSize="8" transform="rotate(-76 400 180)">
            Radiancia Retroesparcida I(λ) (DOAS 405-465 nm)
          </text>

          {/* 5. TROPOMI Ground Pixel Footprint (3.5 × 5.5 km²) */}
          <polygon
            points="310,290 340,280 410,285 380,295"
            fill="#6366f1"
            opacity="0.3"
            stroke="#818cf8"
            strokeWidth="1.5"
          />
          <text x="360" y="275" fill="#c7d2fe" fontSize="8" fontWeight="bold" textAnchor="middle">
            Pixel TROPOMI (3.5 × 5.5 km²)
          </text>

          {/* 6. Retrieval Mathematical Box (Right Side) */}
          <g transform="translate(450, 85)">
            <rect width="140" height="135" rx="6" fill="#0f172a" stroke="#6366f1" strokeWidth="1.2" opacity="0.95" />
            <text x="10" y="18" fill="#c7d2fe" fontSize="8.5" fontWeight="bold">Inversión DOAS / VCD:</text>
            <text x="10" y="34" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">SCD = ∫ ρ(z) · ds</text>
            <text x="10" y="48" fill="#a5b4fc" fontSize="8" fontFamily="monospace" fontWeight="bold">
              VCD = SCD / AMF_trop
            </text>
            <line x1="10" y1="56" x2="130" y2="56" stroke="#334155" strokeWidth="1" />
            
            <text x="10" y="70" fill="#e2e8f0" fontSize="7.5">Columna NO₂ Troposf:</text>
            <text x="10" y="84" fill="#fbbf24" fontSize="9" fontFamily="monospace" fontWeight="bold">
              {no2VcdUmolM2} µmol/m²
            </text>
            
            <text x="10" y="100" fill="#e2e8f0" fontSize="7.5">Nubosidad Efectiva:</text>
            <text x="10" y="114" fill="#38bdf8" fontSize="8" fontFamily="monospace">
              f_cloud = {(cloudFraction * 100).toFixed(0)}% (FRESCO)
            </text>
            <text x="10" y="128" fill="#34d399" fontSize="7.5" fontFamily="monospace">
              QA Quality Flag = 0.92 ✓
            </text>
          </g>
        </svg>
      </div>

      {/* Synthesis Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[9.5px] font-mono bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
        <ScientificTooltip
          position="top"
          title="Factor Geométrico y Radiativo de Masa de Aire"
          formula="AMF_{\text{geom}} = \sec\theta_0 + \sec\theta_v"
          normative="Palmer et al. (2001) JGR • Algoritmo FRESCO+"
          content={`Combina la trayectoria geométrica solar (SZA = ${solarZenithAngleDeg}°) y nadir con la dispersión múltiple de Rayleigh/Mie y reflectancia superficial de Lambert (Albedo A_s = ${albedo.toFixed(2)}, fracción nubosa ${(cloudFraction * 100).toFixed(0)}%).`}
        >
          <div className="cursor-help">
            <span className="text-slate-400 block">Factor Masa de Aire (AMF):</span>
            <span className="text-indigo-300 font-bold text-xs">{troposphericAmf.toFixed(2)} (Geométrico + Radiativo)</span>
          </div>
        </ScientificTooltip>
        <ScientificTooltip
          position="top"
          title="Densidad de Columna Vertical Troposférica (VCD NO₂)"
          formula="1\text{ mol m}^{-2} = 6.02214 \times 10^{19}\text{ molec cm}^{-2}"
          normative="Copernicus S5P-NP-L2-NO2 (qa_value > 0.75)"
          content={`Densidad integrada de NO₂ en la columna troposférica (${no2VcdUmolM2} µmol/m²), equivalente a ${(parseFloat(no2VcdUmolM2) * 0.0602).toFixed(1)}×10¹⁵ moléculas/cm² tras corrección de sesgo de apantallamiento 3D en cañones urbanos.`}
        >
          <div className="cursor-help">
            <span className="text-slate-400 block">Columna NO₂ Asimilada:</span>
            <span className="text-amber-400 font-bold text-xs">{no2VcdUmolM2} µmol/m² (~{(parseFloat(no2VcdUmolM2) * 0.0602).toFixed(1)}×10¹⁵ molec/cm²)</span>
          </div>
        </ScientificTooltip>
        <ScientificTooltip
          position="top"
          title="Vector de Sensibilidad Vertical (Averaging Kernel AK)"
          formula="A_l = \frac{m_l(\theta_0, \theta_v, A_s)}{AMF_{\text{trop}}}"
          normative="Eskes & Boersma (2003) ACP"
          content="El Averaging Kernel (AK) cuantifica la sensibilidad relativa de la medición satelital a las variaciones de NO₂ en la Capa Límite Planetaria (0–1 km) para acoplarla sin sesgo representativo al filtro EnKF."
        >
          <div className="cursor-help">
            <span className="text-slate-400 block">Sensibilidad en Capa Límite:</span>
            <span className="text-emerald-400 font-bold text-xs">AK(0-1km) = {(0.78 + albedo * 1.1 - cloudFraction * 0.35).toFixed(2)} (Alta resolución)</span>
          </div>
        </ScientificTooltip>
      </div>
    </div>
  );
}
