import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BookOpen, Scale, X, MapPin, Info } from 'lucide-react';
import { ScientificDiagramType } from '../lib/scientificRegistry';
import { useActivePoint } from '../context/ActivePointContext';
import { MathFormula } from './MathFormula';
import { ScientificTooltip } from './ScientificTooltip';

export interface DiagramTooltipInfo {
  id: string;
  title: string;
  discipline: string;
  formulaLaTeX?: string;
  description: string;
  regulatoryStandard?: string;
  literatureCitation?: string;
  empiricalMalagaContext?: string;
  accentColor?: string;
}

interface DiagramProps {
  type: ScientificDiagramType;
  compact?: boolean;
  className?: string;
  interactiveParams?: {
    solarFlux?: number;
    windSpeed?: number;
    canyonAspect?: number;
    trafficSpeed?: number;
  };
}

/**
 * Overlay flotante unificado para notas y tooltips científicos profundos en diagramas
 */
const DiagramTooltipOverlay: React.FC<{
  tooltip: DiagramTooltipInfo | null;
  onClose: () => void;
  compact?: boolean;
}> = ({ tooltip, onClose, compact = false }) => {
  return (
    <AnimatePresence>
      {tooltip && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className={`absolute inset-x-2 top-2 z-50 p-2.5 bg-slate-950/95 border rounded-lg shadow-2xl backdrop-blur-md text-[10px] text-slate-200 leading-relaxed font-sans select-text overflow-y-auto ${
            compact ? 'max-h-[85%] text-[9px]' : 'max-h-[90%]'
          }`}
          style={{ borderColor: tooltip.accentColor || '#06b6d4' }}
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
            <div
              className="flex items-center gap-1.5 font-mono font-bold text-[10.5px]"
              style={{ color: tooltip.accentColor || '#38bdf8' }}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{tooltip.title}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] bg-slate-900 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-mono shrink-0">
                {tooltip.discipline}
              </span>
              <ScientificTooltip content="Cerrar la nota científica metodológica y regresar al diagrama interactivo.">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </ScientificTooltip>
            </div>
          </div>

          {/* Ecuación / Formulación Diferencial renderizada con KaTeX */}
          {tooltip.formulaLaTeX && (
            <div className="mb-1.5 p-2 bg-slate-900/95 rounded border border-cyan-900/60 font-mono text-[9.5px] text-cyan-200 overflow-x-auto">
              <MathFormula math={tooltip.formulaLaTeX} displayMode={true} />
            </div>
          )}

          {/* Explicación Física y Mecanística */}
          <p className="text-[9.5px] text-slate-300 mb-1.5 leading-relaxed">
            {tooltip.description}
          </p>

          {/* Metadatos: Norma y Literatura Científica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 border-t border-slate-800/80 text-[8.5px] font-mono">
            {tooltip.regulatoryStandard && (
              <div className="flex items-start gap-1 text-emerald-400">
                <Scale className="w-3 h-3 shrink-0 mt-0.5" />
                <span><strong>Norma:</strong> {tooltip.regulatoryStandard}</span>
              </div>
            )}
            {tooltip.literatureCitation && (
              <div className="flex items-start gap-1 text-purple-300">
                <BookOpen className="w-3 h-3 shrink-0 mt-0.5" />
                <span><strong>Cita:</strong> {tooltip.literatureCitation}</span>
              </div>
            )}
          </div>

          {/* Contexto en Málaga */}
          {tooltip.empiricalMalagaContext && (
            <div className="mt-1.5 p-1 bg-cyan-950/40 rounded border border-cyan-900/60 text-[8.5px] font-mono text-cyan-300 flex items-start gap-1">
              <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-cyan-400" />
              <span><strong>Málaga / Gemelo Digital:</strong> {tooltip.empiricalMalagaContext}</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* =========================================================================
   1. DIAGRAMA DEL CICLO FOTOESTACIONARIO DE LEIGHTON
   ========================================================================= */
const LEIGHTON_TOOLTIPS: Record<string, DiagramTooltipInfo> = {
  uv: {
    id: 'uv',
    title: 'Radiación Solar Actínica (hν, λ < 420 nm)',
    discipline: 'Fotoquímica Troposférica',
    formulaLaTeX: 'J_{NO_2} = \\int \\sigma_{NO_2}(\\lambda, T) \\, \\phi_{NO_2}(\\lambda, T) \\, F(\\lambda) \\, d\\lambda',
    description: 'Los fotones de longitud de onda inferior a 420 nm aportan la energía (hν > 284 kJ/mol) necesaria para romper el enlace nitrógeno-oxígeno del NO2 y generar oxígeno atómico O(³P).',
    regulatoryStandard: 'WMO/GAW Global Atmospheric Watch No. 172',
    literatureCitation: 'Finlayson-Pitts & Pitts (2000); Leighton (1961)',
    empiricalMalagaContext: 'En Málaga, en horas centrales de verano con cielo despejado, J_NO2 alcanza picos de 8.5 a 9.2 × 10⁻³ s⁻¹.',
    accentColor: '#f59e0b'
  },
  no2: {
    id: 'no2',
    title: 'Dióxido de Nitrógeno (NO₂)',
    discipline: 'Química de la Calidad del Aire',
    formulaLaTeX: '[NO_2] = \\frac{k_1 [NO][O_3]}{J_{NO_2}}',
    description: 'Gas tóxico pardo-rojizo oxidante. Se emite en tubos de escape (10-15% en vehículos diésel) y se genera por oxidación ultrarrápida del óxido nítrico.',
    regulatoryStandard: 'Directiva 2008/50/CE: Valor límite horario 200 µg/m³; anual 40 µg/m³ (OMS 2021: 10 µg/m³)',
    literatureCitation: 'Seinfeld & Pandis (2016), Atmospheric Chemistry and Physics',
    empiricalMalagaContext: 'Estaciones de tráfico de Málaga (Carranque, Hilera, Juan XXIII) registran máximos en las horas punta de 08:00 y 20:00 UTC.',
    accentColor: '#818cf8'
  },
  photolysis: {
    id: 'photolysis',
    title: 'Fotólisis de NO₂ (J_NO₂ • [NO₂])',
    discipline: 'Cinética Unimolecular Fotoquímica',
    formulaLaTeX: 'NO_2 + h\\nu \\xrightarrow{J_{NO_2}} NO + O(^3P)',
    description: 'Fotodisociación unimolecular que inicia la cascada fotoquímica urbana. El átomo libre O(³P) liberado se recombina inmediatamente con O2 para sintetizar ozono.',
    regulatoryStandard: 'Guía EMEP/EEA 2023 sobre Fotooxidantes',
    literatureCitation: 'Leighton (1961), Photochemistry of Air Pollution',
    empiricalMalagaContext: 'Mecanismo dominante entre las 11:00 y 17:00 en toda la bahía de Málaga.',
    accentColor: '#38bdf8'
  },
  no: {
    id: 'no',
    title: 'Óxido Nítrico Primario (NO)',
    discipline: 'Emisiones de Tráfico y Combustión',
    formulaLaTeX: 'N_2 + O_2 \\rightleftharpoons 2 NO \\quad (\\text{Mecanismo térmico de Zeldovich})',
    description: 'Radical incoloro formado a alta temperatura en cámaras de combustión. Actúa como sumidero y titulador primario de ozono a nivel de calle en zonas de tráfico intenso.',
    regulatoryStandard: 'Reglamento Euro 6d / Euro 7 de Emisiones Vehiculares',
    literatureCitation: 'Heywood, J.B. (2018), Internal Combustion Engine Fundamentals',
    empiricalMalagaContext: 'Representa el 85-90% de los NOx primarios emitidos en los ejes de Alameda Principal, Paseo del Parque y MA-20.',
    accentColor: '#ec4899'
  },
  titration: {
    id: 'titration',
    title: 'Titulación de Ozono por NO (k₁ • [NO][O₃])',
    discipline: 'Cinética Gas-Gas Homogénea',
    formulaLaTeX: 'NO + O_3 \\xrightarrow{k_1} NO_2 + O_2, \\quad k_1 = 1.4 \\times 10^{-12} \\exp(-1310/T) \\, cm^3/(molec\\cdot s)',
    description: 'Reacción bimolecular rápida en escala de segundos que destruye el ozono en las calles con alta densidad de tráfico, convirtiendo el NO en NO2.',
    regulatoryStandard: 'Guía Metodológica FAIRMODE WG1 para Modelización Urbana',
    literatureCitation: 'Atkinson et al. (2004), IUPAC Kinetic Data Evaluation',
    empiricalMalagaContext: 'Provoca que en el centro denso de Málaga el ozono se mantenga bajo, mientras que en la periferia (El Atabal) se dispara al no haber NO fresco.',
    accentColor: '#fb7185'
  },
  o3: {
    id: 'o3',
    title: 'Ozono Troposférico Secundario (O₃)',
    discipline: 'Fotoquímica y Toxicología Alveolar',
    formulaLaTeX: '[O_3]_{PSS} = \\frac{J_{NO_2} [NO_2]}{k_1 [NO]}',
    description: 'Contaminante secundario oxidante generado en la troposfera. Daña el epitelio pulmonar, provoca hiperreactividad bronquial y necrosa el tejido foliar vegetal.',
    regulatoryStandard: 'Real Decreto 102/2011: Umbral Información 180 µg/m³; Alerta 240 µg/m³; Objetivo protección salud 120 µg/m³ (máx. 8h)',
    literatureCitation: 'Monks et al. (2015), Tropospheric Ozone Review',
    empiricalMalagaContext: 'El penacho fotoquímico de Málaga es arrastrado por la brisa marina hacia el valle del Guadalhorce y estribaciones montañosas.',
    accentColor: '#06b6d4'
  },
  ro2: {
    id: 'ro2',
    title: 'Desvío por Radicales Peroxilo (RO₂• / HO₂•)',
    discipline: 'Química de Compuestos Orgánicos Volátiles (COVs)',
    formulaLaTeX: 'NO + RO_2^\\bullet \\to NO_2 + RO^\\bullet \\quad (\\text{Régimen COV-sensible / NOx-saturado})',
    description: 'Los radicales peroxilo derivados de COVs oxidan el NO a NO2 sin consumir ozono, rompiendo el equilibrio estático de Leighton y originando la acumulación neta de smog fotoquímico.',
    regulatoryStandard: 'Guía EMEP/EEA 2023: NMVOC Emissions',
    literatureCitation: 'Sillman, S. (1999), The relation between ozone, NOx and hydrocarbons in urban air',
    empiricalMalagaContext: 'Emisiones biogénicas de terpenos de los Montes de Málaga sumadas a COVs del tráfico alimentan esta vía en días cálidos.',
    accentColor: '#c084fc'
  }
};

export const LeightonCycleDiagram: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [activeTooltip, setActiveTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 500, h: 280 };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-indigo-900/60 shadow-inner overflow-hidden select-none">
      {/* Badge de interacción */}
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
        <span>Nodos interactivos</span>
      </div>

      <svg
        width={size.w}
        height={size.h}
        viewBox="0 0 500 280"
        className="w-full h-auto max-h-[280px]"
      >
        <defs>
          <linearGradient id="uvGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <linearGradient id="no2Grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="o3Grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="noGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#be185d" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Rayos UV incidentes (hν, λ < 420 nm) */}
        <g
          className="cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setActiveTooltip(LEIGHTON_TOOLTIPS.uv)}
          onMouseEnter={() => setActiveTooltip(LEIGHTON_TOOLTIPS.uv)}
        >
          <motion.path
            d="M 50 30 L 150 90"
            stroke="url(#uvGrad)"
            strokeWidth="3"
            strokeDasharray="6 4"
            animate={{ strokeDashoffset: [-20, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          />
          <circle cx="50" cy="30" r="16" fill="#f59e0b" filter="url(#glow)" opacity="0.85" />
          <text x="50" y="34" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="monospace">
            hν (UV)
          </text>
          <text x="115" y="55" fill="#f59e0b" fontSize="9" fontWeight="bold" fontFamily="monospace">
            λ &lt; 420 nm
          </text>
        </g>

        {/* NODO NO2 */}
        <g
          transform="translate(180, 80)"
          className="cursor-pointer hover:opacity-95 transition-all"
          onClick={() => setActiveTooltip(LEIGHTON_TOOLTIPS.no2)}
          onMouseEnter={() => setActiveTooltip(LEIGHTON_TOOLTIPS.no2)}
        >
          <rect x="-35" y="-20" width="70" height="40" rx="10" fill="url(#no2Grad)" filter="url(#glow)" stroke="#a5b4fc" strokeWidth="1.5" />
          <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold" fontFamily="monospace">
            NO₂
          </text>
          <text x="0" y="-26" textAnchor="middle" fill="#c7d2fe" fontSize="9" fontFamily="sans-serif">
            Dióxido Nitrógeno
          </text>
        </g>

        {/* Flecha Fotólisis: NO2 -> NO + O(3P) */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(LEIGHTON_TOOLTIPS.photolysis)}
          onMouseEnter={() => setActiveTooltip(LEIGHTON_TOOLTIPS.photolysis)}
        >
          <path d="M 215 90 C 270 120, 270 160, 215 190" fill="none" stroke="#818cf8" strokeWidth="2.5" />
          <motion.circle
            r="4"
            fill="#38bdf8"
            animate={{ cx: [215, 260, 215], cy: [90, 140, 190] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          />
          <text x="275" y="145" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">
            J_NO₂ • [NO₂]
          </text>
        </g>

        {/* NODO NO */}
        <g
          transform="translate(180, 200)"
          className="cursor-pointer hover:opacity-95 transition-all"
          onClick={() => setActiveTooltip(LEIGHTON_TOOLTIPS.no)}
          onMouseEnter={() => setActiveTooltip(LEIGHTON_TOOLTIPS.no)}
        >
          <rect x="-35" y="-20" width="70" height="40" rx="10" fill="url(#noGrad)" filter="url(#glow)" stroke="#f472b6" strokeWidth="1.5" />
          <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold" fontFamily="monospace">
            NO
          </text>
          <text x="0" y="32" textAnchor="middle" fill="#fbcfe8" fontSize="9" fontFamily="sans-serif">
            Óxido Nítrico (Tráfico)
          </text>
        </g>

        {/* Flecha Titulación: NO + O3 -> NO2 + O2 */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(LEIGHTON_TOOLTIPS.titration)}
          onMouseEnter={() => setActiveTooltip(LEIGHTON_TOOLTIPS.titration)}
        >
          <path d="M 145 190 C 95 160, 95 120, 145 90" fill="none" stroke="#f43f5e" strokeWidth="2.5" />
          <motion.circle
            r="4"
            fill="#fb7185"
            animate={{ cx: [145, 100, 145], cy: [190, 140, 90] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          />
          <text x="45" y="145" fill="#fb7185" fontSize="10" fontWeight="bold" fontFamily="monospace">
            k₁ • [NO][O₃]
          </text>
        </g>

        {/* NODO O3 */}
        <g
          transform="translate(380, 140)"
          className="cursor-pointer hover:opacity-95 transition-all"
          onClick={() => setActiveTooltip(LEIGHTON_TOOLTIPS.o3)}
          onMouseEnter={() => setActiveTooltip(LEIGHTON_TOOLTIPS.o3)}
        >
          <rect x="-40" y="-22" width="80" height="44" rx="12" fill="url(#o3Grad)" filter="url(#glow)" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="0" y="6" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="bold" fontFamily="monospace">
            O₃
          </text>
          <text x="0" y="-28" textAnchor="middle" fill="#bae6fd" fontSize="9" fontFamily="sans-serif">
            Ozono Troposférico
          </text>
        </g>

        {/* Generación rápida O(3P) + O2 -> O3 */}
        <path d="M 245 110 L 340 135" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4 3" />
        <text x="310" y="115" fill="#06b6d4" fontSize="9" fontWeight="bold" fontFamily="monospace">
          + O₂ + M
        </text>

        {/* Desviación VOCs: Radicales Peroxilo RO2 */}
        <g
          transform="translate(320, 220)"
          className="cursor-pointer hover:opacity-95 transition-all"
          onClick={() => setActiveTooltip(LEIGHTON_TOOLTIPS.ro2)}
          onMouseEnter={() => setActiveTooltip(LEIGHTON_TOOLTIPS.ro2)}
        >
          <motion.rect
            x="-45"
            y="-15"
            width="90"
            height="30"
            rx="6"
            fill="#581c87"
            stroke="#c084fc"
            strokeWidth="1"
            animate={{ opacity: [0.75, 1, 0.75] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <text x="0" y="4" textAnchor="middle" fill="#e9d5ff" fontSize="10" fontWeight="bold" fontFamily="monospace">
            RO₂• / HO₂•
          </text>
          <text x="0" y="24" textAnchor="middle" fill="#c084fc" fontSize="8" fontFamily="sans-serif">
            Derivación por COVs
          </text>
        </g>
        <path d="M 275 220 L 215 210" fill="none" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>

      {/* Barra de Badges Interactivas Inferiores */}
      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <ScientificTooltip content="Ver fundamento físico de la radiación actínica solar (hν), ángulo cenital solar y tasa de fotólisis J_NO₂.">
          <button
            type="button"
            onClick={() => setActiveTooltip(LEIGHTON_TOOLTIPS.uv)}
            className="text-amber-400 hover:text-amber-300 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>Radiación Solar (hν)</span>
          </button>
        </ScientificTooltip>
        <ScientificTooltip content="Ver constantes cinéticas de fotólisis de NO₂ y titulación por ozono k₁ según IUPAC/Atkinson.">
          <button
            type="button"
            onClick={() => setActiveTooltip(LEIGHTON_TOOLTIPS.photolysis)}
            className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>Fotólisis J_NO₂ ⇄ Titulación k₁</span>
          </button>
        </ScientificTooltip>
        <ScientificTooltip content="Ver cinética de oxidación por radicales peroxilo orgánicos RO₂ que rompe el fotostacionario y acumula ozono troposférico.">
          <button
            type="button"
            onClick={() => setActiveTooltip(LEIGHTON_TOOLTIPS.ro2)}
            className="text-purple-400 hover:text-purple-300 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>Fuga Radicales RO₂ (Acumula O₃)</span>
          </button>
        </ScientificTooltip>
      </div>

      {/* Tooltip Científico Flotante */}
      <DiagramTooltipOverlay
        tooltip={activeTooltip}
        onClose={() => setActiveTooltip(null)}
        compact={compact}
      />
    </div>
  );
};

/* =========================================================================
   2. DIAGRAMA DEL VÓRTICE EN CAÑÓN URBANO (OKE 1988)
   ========================================================================= */
const CANYON_TOOLTIPS: Record<string, DiagramTooltipInfo> = {
  wind_aloft: {
    id: 'wind_aloft',
    title: 'Viento Sinóptico Superior (U_top en Capa Límite Urbana)',
    discipline: 'Micrometeorología Urbana',
    formulaLaTeX: 'U(z) = \\frac{u_*}{\\kappa} \\ln\\left(\\frac{z - d}{z_0}\\right) \\quad (z > H)',
    description: 'Flujo atmosférico sobre la cota de cornisas. Al incidir transversalmente al eje de la calle (|θ| > 60°), crea una capa de cizalladura turbulenta que impulsa la recirculación en el cañón.',
    regulatoryStandard: 'Criterios de Confort y Dispersión Eólica (COST Action 732)',
    literatureCitation: 'Oke, T.R. (1988), Street design and urban canopy layer climate',
    empiricalMalagaContext: 'Vientos de Terral o Levante perpendiculares a las calles ensanche de Málaga generan este patrón en Alameda de Colón y Paseo de Sancha.',
    accentColor: '#38bdf8'
  },
  leeward: {
    id: 'leeward',
    title: 'Fachada de Sotavento (Leeward Facade)',
    discipline: 'Dinámica de Exposición Residencial',
    formulaLaTeX: 'C_{lee} \\approx 2.5 \\text{ a } 4.0 \\times C_{windward}',
    description: 'Fachada contra la que asciende el flujo recirculante del vórtice. Concentra las emisiones de tubos de escape, multiplicando la exposición humana en plantas bajas y aceras.',
    regulatoryStandard: 'Directiva 2008/50/CE: Requisitos de representatividad de microescala en estaciones de tráfico',
    literatureCitation: 'Vardoulakis et al. (2003), Modelling air quality in street canyons',
    empiricalMalagaContext: 'En Calle Hilera y Calle Salitre, las aceras de sotavento registran hasta un +300% de NO2 frente a barlovento.',
    accentColor: '#f87171'
  },
  accumulation_zone: {
    id: 'accumulation_zone',
    title: 'Zona de Máxima Acumulación de NO₂ en Sotavento',
    discipline: 'Dispersión Microescalar de Reactivos',
    formulaLaTeX: '\\frac{\\partial C}{\\partial t} + u_i \\frac{\\partial C}{\\partial x_i} = \\frac{\\partial}{\\partial x_i}\\left( K_c \\frac{\\partial C}{\\partial x_i} \\right) + S_c',
    description: 'Bolsa de estancamiento donde el gradiente de presión adverso en la esquina inferior de sotavento impide la dispersión de contaminantes primarios (NO, NO2, ultrafinas y hollín).',
    regulatoryStandard: 'Valores límite de protección a la salud (Real Decreto 102/2011)',
    literatureCitation: 'Hunter et al. (1992); Kastner-Klein & Plate (1999)',
    empiricalMalagaContext: 'Punto crítico de superación de 200 µg/m³ en horas punta con viento sinóptico débil (< 2.5 m/s).',
    accentColor: '#ef4444'
  },
  skimming_flow: {
    id: 'skimming_flow',
    title: 'Régimen de Flujo Rasante (Skimming Flow, H/W ≥ 0.65)',
    discipline: 'Aerodinámica de Flujos Urbanos',
    formulaLaTeX: '\\frac{H}{W} \\ge 0.65 \\quad (H = \\text{altura cornisas}, W = \\text{ancho de calle})',
    description: 'Clasificación de Oke (1988). Cuando la calle es estrecha respecto a la altura de los edificios, el viento superior no penetra directamente hasta el suelo, sino que sobrevuela los tejados y atrapa un vórtice rotatorio cerrado.',
    regulatoryStandard: 'Directrices FAIRMODE WG1 sobre Clasificación Morfológica',
    literatureCitation: 'Oke, T.R. (1987), Boundary Layer Climates',
    empiricalMalagaContext: 'Gran parte del centro histórico y ensanche de Málaga opera en régimen de Skimming Flow (H/W entre 0.9 y 1.6).',
    accentColor: '#f59e0b'
  },
  traffic_sources: {
    id: 'traffic_sources',
    title: 'Emisiones Vehiculares en Calzada (COPERT 5 / EMEP)',
    discipline: 'Inventario Dinámico de Emisiones',
    formulaLaTeX: 'q = \\sum_k \\frac{N_k}{3600} \\cdot EF_k(V, \\text{Euro}) \\quad [g/(s\\cdot m)]',
    description: 'Fuente lineal continua a cota z = 0.3 m. Considera factores de emisión según tipología vehicular (diésel, gasolina, híbridos, autobuses EMT) y régimen cinemático.',
    regulatoryStandard: 'Metodología Oficial Europea COPERT 5 (Guía EMEP/EEA)',
    literatureCitation: 'Ntziachristos et al. (2009); EEA Report No 11/2023',
    empiricalMalagaContext: 'La flota circulante en los corredores arteriales de Málaga aporta un 72% de la masa de NOx en horas diurnas.',
    accentColor: '#ef4444'
  },
  windward: {
    id: 'windward',
    title: 'Fachada de Barlovento y Aire Limpio Descendente',
    discipline: 'Ventilación y Renovación de Aire',
    formulaLaTeX: 'C_{windward} \\approx 0.25 \\text{ a } 0.40 \\times C_{leeward}',
    description: 'El flujo del vórtice desciende por la fachada de barlovento inyectando aire fresco desde el nivel de tejados, dando como resultado niveles sustancialmente más bajos de polución.',
    literatureCitation: 'Solazzo et al. (2009); Britter & Hanna (2003)',
    empiricalMalagaContext: 'Las aceras de barlovento presentan concentraciones notablemente inferiores de partículas respirables y óxidos de nitrógeno.',
    accentColor: '#10b981'
  },
  vortex_core: {
    id: 'vortex_core',
    title: 'Núcleo del Vórtice de Recirculación (Criterio Q de Hunt)',
    discipline: 'Estructuras Coherentes en Fluidos Urbanos',
    formulaLaTeX: 'Q = \\frac{1}{2}(||\\mathbf{\\Omega}||^2 - ||\\mathbf{S}||^2) > 0, \\quad ACH = \\frac{W \\sigma_w}{\\sqrt{2\\pi} H}',
    description: 'Estructura rotacional coherente que gobierna el tiempo de renovación de aire (Air Change Rate, ACH) entre la calle y la atmósfera libre.',
    literatureCitation: 'Hunt et al. (1988), Eddies and convergence zones; Yamartino & Wiegand (1986)',
    empiricalMalagaContext: 'El Gemelo Digital resuelve este vórtice analíticamente en tiempo real para todas las manzanas de la trama OSM de Málaga.',
    accentColor: '#fbbf24'
  }
};

export const UrbanCanyonVortexDiagram: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [activeTooltip, setActiveTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 480, h: 260 };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-amber-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
        <span>Nodos interactivos</span>
      </div>

      <svg
        width={size.w}
        height={size.h}
        viewBox="0 0 480 260"
        className="w-full h-auto max-h-[260px]"
      >
        <defs>
          <linearGradient id="leewardPollution" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="windwardClean" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Viento sinóptico superior horizontal */}
        <g
          className="cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setActiveTooltip(CANYON_TOOLTIPS.wind_aloft)}
          onMouseEnter={() => setActiveTooltip(CANYON_TOOLTIPS.wind_aloft)}
        >
          <motion.line
            x1="20"
            y1="35"
            x2="460"
            y2="35"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeDasharray="12 6"
            animate={{ strokeDashoffset: [-36, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          />
          <text x="40" y="25" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace">
            Viento Sinóptico Perpendicular (U_top) →
          </text>
        </g>

        {/* Edificio Izquierdo (Sotavento / Leeward) */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(CANYON_TOOLTIPS.leeward)}
          onMouseEnter={() => setActiveTooltip(CANYON_TOOLTIPS.leeward)}
        >
          <rect x="50" y="60" width="100" height="170" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <text x="100" y="80" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
            Edificio H (Sotavento)
          </text>
          {[95, 125, 155, 185].map((y, i) => (
            <g key={`win-l-${i}`}>
              <rect x="65" y={y} width="16" height="18" fill="#0f172a" stroke="#334155" />
              <rect x="95" y={y} width="16" height="18" fill="#0f172a" stroke="#334155" />
              <rect x="125" y={y} width="16" height="18" fill="#0f172a" stroke="#334155" />
            </g>
          ))}
        </g>

        {/* Mancha de acumulación de contaminantes en Sotavento (Leeward) */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(CANYON_TOOLTIPS.accumulation_zone)}
          onMouseEnter={() => setActiveTooltip(CANYON_TOOLTIPS.accumulation_zone)}
        >
          <rect x="150" y="100" width="45" height="130" fill="url(#leewardPollution)" />
          <text x="175" y="125" textAnchor="middle" fill="#f87171" fontSize="9" fontWeight="bold" fontFamily="monospace" transform="rotate(-90 175 125)">
            Acumulación Máxima NO₂
          </text>
        </g>

        {/* Calle (Callejero con vehículos) */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(CANYON_TOOLTIPS.skimming_flow)}
          onMouseEnter={() => setActiveTooltip(CANYON_TOOLTIPS.skimming_flow)}
        >
          <rect x="150" y="225" width="180" height="10" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <text x="240" y="248" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
            Ancho Calle W = 18 m (H/W ≈ 1.25)
          </text>
        </g>

        {/* Vehículos emisores en calzada */}
        <g
          transform="translate(190, 220)"
          className="cursor-pointer"
          onClick={() => setActiveTooltip(CANYON_TOOLTIPS.traffic_sources)}
          onMouseEnter={() => setActiveTooltip(CANYON_TOOLTIPS.traffic_sources)}
        >
          <rect x="-12" y="-8" width="24" height="8" rx="2" fill="#ef4444" />
          <motion.circle
            cx="14"
            cy="-4"
            r="3"
            fill="#f97316"
            animate={{ scale: [1, 2.5], opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 1.0 }}
          />
        </g>
        <g
          transform="translate(260, 220)"
          className="cursor-pointer"
          onClick={() => setActiveTooltip(CANYON_TOOLTIPS.traffic_sources)}
          onMouseEnter={() => setActiveTooltip(CANYON_TOOLTIPS.traffic_sources)}
        >
          <rect x="-12" y="-8" width="24" height="8" rx="2" fill="#3b82f6" />
        </g>

        {/* Edificio Derecho (Barlovento / Windward) */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(CANYON_TOOLTIPS.windward)}
          onMouseEnter={() => setActiveTooltip(CANYON_TOOLTIPS.windward)}
        >
          <rect x="330" y="60" width="100" height="170" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <text x="380" y="80" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
            Edificio H (Barlovento)
          </text>
          {[95, 125, 155, 185].map((y, i) => (
            <g key={`win-r-${i}`}>
              <rect x="345" y={y} width="16" height="18" fill="#0f172a" stroke="#334155" />
              <rect x="375" y={y} width="16" height="18" fill="#0f172a" stroke="#334155" />
              <rect x="405" y={y} width="16" height="18" fill="#0f172a" stroke="#334155" />
            </g>
          ))}
        </g>

        {/* Zona más limpia en Barlovento */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(CANYON_TOOLTIPS.windward)}
          onMouseEnter={() => setActiveTooltip(CANYON_TOOLTIPS.windward)}
        >
          <rect x="285" y="130" width="45" height="95" fill="url(#windwardClean)" />
          <text x="305" y="180" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="bold" fontFamily="monospace" transform="rotate(90 305 180)">
            Aire Diluido Limpio
          </text>
        </g>

        {/* Vórtice de recirculación animado (Sentido antihorario) */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(CANYON_TOOLTIPS.vortex_core)}
          onMouseEnter={() => setActiveTooltip(CANYON_TOOLTIPS.vortex_core)}
        >
          <motion.path
            d="M 240 95 C 310 95, 315 190, 240 200 C 170 200, 165 95, 240 95"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeDasharray="8 6"
            animate={{ strokeDashoffset: [0, 60] }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          />
          <circle cx="240" cy="148" r="4" fill="#f59e0b" />
          <text x="240" y="165" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="monospace">
            Vórtice Recirculación
          </text>
        </g>
      </svg>

      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <ScientificTooltip content="Fachada sotavento (leeward): acumulación crítica de contaminantes por el flujo ascendente del vórtice de recirculación.">
          <button
            type="button"
            onClick={() => setActiveTooltip(CANYON_TOOLTIPS.leeward)}
            className="text-rose-400 hover:text-rose-300 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>Fachada Sotavento (+300% NO₂)</span>
          </button>
        </ScientificTooltip>
        <ScientificTooltip content="Régimen de flujo rasante (Skimming Flow, Oke 1987) para relaciones de aspecto H/W ≥ 0.65 con confinamiento de torbellino.">
          <button
            type="button"
            onClick={() => setActiveTooltip(CANYON_TOOLTIPS.skimming_flow)}
            className="text-amber-400 hover:text-amber-300 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>H/W &ge; 0.65 Skimming Flow</span>
          </button>
        </ScientificTooltip>
        <ScientificTooltip content="Fachada barlovento (windward): arrastre descendente de aire limpio desde la capa superior de canopia urbana.">
          <button
            type="button"
            onClick={() => setActiveTooltip(CANYON_TOOLTIPS.windward)}
            className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>Fachada Barlovento (Limpia)</span>
          </button>
        </ScientificTooltip>
      </div>

      <DiagramTooltipOverlay
        tooltip={activeTooltip}
        onClose={() => setActiveTooltip(null)}
        compact={compact}
      />
    </div>
  );
};

/* =========================================================================
   3. DIAGRAMA DE RESISTENCIAS DE DEPOSICIÓN SECA (WESELY 1989)
   ========================================================================= */
const WESELY_TOOLTIPS: Record<string, DiagramTooltipInfo> = {
  cz: {
    id: 'cz',
    title: 'Concentración en la Capa Límite Superficial C(z)',
    discipline: 'Transferencia de Masa Atmosférica',
    formulaLaTeX: 'C(z) = C_0 - \\frac{F_{dep}}{\\kappa u_*} \\left[ \\ln\\left(\\frac{z}{z_0}\\right) - \\Psi_c\\left(\\frac{z}{L}\\right) \\right]',
    description: 'Concentración de gas o partícula a la altura de referencia sobre la canopia urbana. Punto de partida del flujo vertical hacia el suelo.',
    literatureCitation: 'Monin & Obukhov (1954); Seinfeld & Pandis (2016)',
    empiricalMalagaContext: 'Telemetría asimilada en tiempo real desde la red de estaciones de Málaga acoplada a TROPOMI.',
    accentColor: '#34d399'
  },
  ra: {
    id: 'ra',
    title: 'Resistencia Aerodinámica ra',
    discipline: 'Micrometeorología y Turbulencia',
    formulaLaTeX: 'r_a = \\frac{1}{\\kappa u_*} \\left[ \\ln\\left(\\frac{z - d}{z_0}\\right) - \\Psi_h\\left(\\frac{z - d}{L}\\right) \\right] \\quad [s/m]',
    description: 'Resistencia al transporte turbulento vertical en la capa superficial. Depende inversamente de la velocidad de fricción u* y de la estabilidad térmica de Monin-Obukhov L.',
    regulatoryStandard: 'Formulación EMEP/MSC-W de Deposición Seca',
    literatureCitation: 'Wesely, M.L. (1989), Atmospheric Environment 23(6)',
    empiricalMalagaContext: 'En noches con inversión térmica y calma en Málaga, ra supera los 180 s/m, desacoplando el aire superficial.',
    accentColor: '#10b981'
  },
  rb: {
    id: 'rb',
    title: 'Resistencia de Subcapa Cuasilaminar rb',
    discipline: 'Difusión Molecular en Superficies',
    formulaLaTeX: 'r_b = \\frac{2}{\\kappa u_*} \\left( \\frac{Sc}{Pr} \\right)^{2/3}, \\quad Sc = \\frac{\\nu}{D_i}',
    description: 'Resistencia por difusión molecular a través de la delgada película laminar estancada en contacto con las hojas o pavimentos. Función del número de Schmidt (Sc) de cada gas.',
    literatureCitation: 'Hicks et al. (1987), Water, Air, and Soil Pollution 36',
    empiricalMalagaContext: 'Especies reactivas y solubles (como HNO3) tienen un rb muy bajo; para O3 ronda los 12-25 s/m.',
    accentColor: '#059669'
  },
  rst: {
    id: 'rst',
    title: 'Resistencia Estomática Vegetal r_st',
    discipline: 'Fisiología Vegetal y Mitigación Verde (NBS)',
    formulaLaTeX: 'r_{st} = r_{st,min} \\cdot \\left(1 + \\frac{200}{PAR}\\right) \\cdot \\frac{1 + b_v VPD}{f(T) f(\\Psi_{suelo})}',
    description: 'Resistencia a la absorción biológica a través de los estomas foliares. Se abre con la radiación fotosintética (PAR) y se cierra ante estrés hídrico o sequía edáfica.',
    regulatoryStandard: 'Directrices UNECE CLRTAP sobre Cargas Críticas',
    literatureCitation: 'Jarvis, P.G. (1976); Wesely (1989)',
    empiricalMalagaContext: 'Arbolado del Parque de Málaga (Ficus microcarpa, Jacaranda) absorbe ozono activamente por la mañana, cerrando estomas al mediodía estival.',
    accentColor: '#a7f3d0'
  },
  rcut: {
    id: 'rcut',
    title: 'Resistencia Cuticular Foliar r_cut',
    discipline: 'Adsorción en Ceras Vegetales',
    formulaLaTeX: 'r_{cut} = \\frac{r_{cut,0}}{10^{-5} H^* + f_0} \\quad [s/m]',
    description: 'Vía de captación sobre las ceras externas de las hojas. La presencia de rocío o alta humedad relativa (> 75%) acelera la remoción de gases hidrosolubles.',
    literatureCitation: 'Massad et al. (2010), Biogeosciences',
    empiricalMalagaContext: 'La humedad marina nocturna de Málaga potencia la captación cuticular de oxidantes.',
    accentColor: '#6ee7b7'
  },
  rsoil: {
    id: 'rsoil',
    title: 'Resistencia de Suelo y Pavimentos r_soil',
    discipline: 'Fijación en Superficies Minerales',
    formulaLaTeX: 'r_{soil} = \\frac{r_{soil,0}}{10^{-5} H^* + f_0} \\cdot f(humedad)',
    description: 'Resistencia a la deposición en suelos orgánicos, alcorques o asfalto. Modulada por el pH del sustrato y la porosidad.',
    literatureCitation: 'Garland, J.A. (1977), Atmospheric Environment',
    empiricalMalagaContext: 'Los suelos calizos de Málaga con pH alcalino (> 7.5) neutralizan eficientemente los depósitos ácidos.',
    accentColor: '#34d399'
  },
  vd: {
    id: 'vd',
    title: 'Velocidad de Deposición vd y Flujo de Remoción',
    discipline: 'Balance de Masa Ecosistémico',
    formulaLaTeX: 'v_d = \\frac{1}{r_a + r_b + r_c}, \\quad F_{dep} = -v_d \\cdot C \\quad [cm/s]',
    description: 'Velocidad efectiva a la que la atmósfera limpia los contaminantes contra la superficie. Base para evaluar el impacto depurador de cubiertas vegetales y arbolado.',
    regulatoryStandard: 'Metodología FAIRMODE para Evaluación de Soluciones Basadas en la Naturaleza',
    literatureCitation: 'Wesely & Hicks (2000), Atmospheric Environment',
    empiricalMalagaContext: 'La infraestructura verde de Málaga aporta velocidades vd de 0.4 a 1.1 cm/s para ozono y 0.2 a 0.5 cm/s para NO2 en primavera.',
    accentColor: '#059669'
  }
};

export const WeselyDepositionDiagram: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [activeTooltip, setActiveTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 480, h: 260 };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-emerald-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
        <span>Nodos interactivos</span>
      </div>

      <svg
        width={size.w}
        height={size.h}
        viewBox="0 0 480 260"
        className="w-full h-auto max-h-[260px]"
      >
        {/* Flujo atmosférico superior C(z) */}
        <g
          transform="translate(240, 25)"
          className="cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setActiveTooltip(WESELY_TOOLTIPS.cz)}
          onMouseEnter={() => setActiveTooltip(WESELY_TOOLTIPS.cz)}
        >
          <circle cx="0" cy="0" r="14" fill="#047857" stroke="#34d399" strokeWidth="2" />
          <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="monospace">
            C(z)
          </text>
          <text x="75" y="4" fill="#a7f3d0" fontSize="9" fontFamily="monospace">
            Concentración Capa Límite
          </text>
        </g>

        {/* Línea de flujo descendente */}
        <motion.line
          x1="240"
          y1="40"
          x2="240"
          y2="75"
          stroke="#34d399"
          strokeWidth="3"
          strokeDasharray="4 4"
          animate={{ strokeDashoffset: [-16, 0] }}
          transition={{ repeat: Infinity, duration: 1.0, ease: "linear" }}
        />

        {/* Resistencia Aerodinámica ra */}
        <g
          transform="translate(240, 85)"
          className="cursor-pointer hover:opacity-95 transition-all"
          onClick={() => setActiveTooltip(WESELY_TOOLTIPS.ra)}
          onMouseEnter={() => setActiveTooltip(WESELY_TOOLTIPS.ra)}
        >
          <rect x="-60" y="-12" width="120" height="24" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
          <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="monospace">
            r_a (Aerodinámica)
          </text>
          <text x="90" y="4" fill="#6ee7b7" fontSize="8" fontFamily="monospace">
            Viento U*, Rugosidad z0
          </text>
        </g>

        <motion.line
          x1="240"
          y1="97"
          x2="240"
          y2="125"
          stroke="#34d399"
          strokeWidth="3"
          strokeDasharray="4 4"
          animate={{ strokeDashoffset: [-16, 0] }}
          transition={{ repeat: Infinity, duration: 1.0, ease: "linear" }}
        />

        {/* Resistencia Cuasilaminar rb */}
        <g
          transform="translate(240, 135)"
          className="cursor-pointer hover:opacity-95 transition-all"
          onClick={() => setActiveTooltip(WESELY_TOOLTIPS.rb)}
          onMouseEnter={() => setActiveTooltip(WESELY_TOOLTIPS.rb)}
        >
          <rect x="-60" y="-12" width="120" height="24" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
          <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="monospace">
            r_b (Subcapa Laminar)
          </text>
          <text x="90" y="4" fill="#6ee7b7" fontSize="8" fontFamily="monospace">
            Difusión Molecular Sc, Pr
          </text>
        </g>

        {/* Bifurcación en paralelo a la canopia (rc) */}
        <path d="M 240 147 L 240 165 L 120 165 L 120 185" fill="none" stroke="#10b981" strokeWidth="2" />
        <path d="M 240 165 L 240 185" fill="none" stroke="#10b981" strokeWidth="2" />
        <path d="M 240 165 L 360 165 L 360 185" fill="none" stroke="#10b981" strokeWidth="2" />

        {/* Resistencia Estomática r_st */}
        <g
          transform="translate(120, 195)"
          className="cursor-pointer hover:opacity-95 transition-all"
          onClick={() => setActiveTooltip(WESELY_TOOLTIPS.rst)}
          onMouseEnter={() => setActiveTooltip(WESELY_TOOLTIPS.rst)}
        >
          <rect x="-45" y="-10" width="90" height="20" rx="3" fill="#022c22" stroke="#34d399" strokeWidth="1" />
          <text x="0" y="4" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontWeight="bold" fontFamily="monospace">
            r_st (Estomas)
          </text>
          <text x="0" y="24" textAnchor="middle" fill="#6ee7b7" fontSize="8" fontFamily="monospace">
            Luz PAR / VPD
          </text>
        </g>

        {/* Resistencia Cuticular r_cut */}
        <g
          transform="translate(240, 195)"
          className="cursor-pointer hover:opacity-95 transition-all"
          onClick={() => setActiveTooltip(WESELY_TOOLTIPS.rcut)}
          onMouseEnter={() => setActiveTooltip(WESELY_TOOLTIPS.rcut)}
        >
          <rect x="-45" y="-10" width="90" height="20" rx="3" fill="#022c22" stroke="#34d399" strokeWidth="1" />
          <text x="0" y="4" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontWeight="bold" fontFamily="monospace">
            r_cut (Cutícula)
          </text>
          <text x="0" y="24" textAnchor="middle" fill="#6ee7b7" fontSize="8" fontFamily="monospace">
            Humedad HR / Rocío
          </text>
        </g>

        {/* Resistencia de Suelo r_soil */}
        <g
          transform="translate(360, 195)"
          className="cursor-pointer hover:opacity-95 transition-all"
          onClick={() => setActiveTooltip(WESELY_TOOLTIPS.rsoil)}
          onMouseEnter={() => setActiveTooltip(WESELY_TOOLTIPS.rsoil)}
        >
          <rect x="-45" y="-10" width="90" height="20" rx="3" fill="#022c22" stroke="#34d399" strokeWidth="1" />
          <text x="0" y="4" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontWeight="bold" fontFamily="monospace">
            r_soil (Suelo)
          </text>
          <text x="0" y="24" textAnchor="middle" fill="#6ee7b7" fontSize="8" fontFamily="monospace">
            pH / Porosidad
          </text>
        </g>

        {/* Suelo sumidero final */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(WESELY_TOOLTIPS.vd)}
          onMouseEnter={() => setActiveTooltip(WESELY_TOOLTIPS.vd)}
        >
          <line x1="80" y1="230" x2="400" y2="230" stroke="#059669" strokeWidth="3" />
          <text x="240" y="248" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold" fontFamily="monospace">
            Sumidero: F_dep = - v_d • C = - C / (r_a + r_b + r_c)
          </text>
        </g>
      </svg>

      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <ScientificTooltip content="Resistencia aerodinámica r_a: gobernada por la velocidad de fricción u*, rugosidad z₀ y estabilidad Monin-Obukhov.">
          <button
            type="button"
            onClick={() => setActiveTooltip(WESELY_TOOLTIPS.ra)}
            className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>r_a (Turbulencia u*)</span>
          </button>
        </ScientificTooltip>
        <ScientificTooltip content="Resistencia estomática r_st: función biológica del flujo de fotones fotosintéticos (PAR) y déficit de presión de vapor (VPD).">
          <button
            type="button"
            onClick={() => setActiveTooltip(WESELY_TOOLTIPS.rst)}
            className="text-teal-300 hover:text-teal-200 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>r_st (Estomas PAR/VPD)</span>
          </button>
        </ScientificTooltip>
        <ScientificTooltip content="Velocidad neta de deposición seca v_d = 1 / (r_a + r_b + r_c) según el esquema resistivo de Wesely (1989).">
          <button
            type="button"
            onClick={() => setActiveTooltip(WESELY_TOOLTIPS.vd)}
            className="text-emerald-300 hover:text-emerald-200 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>v_d (Velocidad de Deposición)</span>
          </button>
        </ScientificTooltip>
      </div>

      <DiagramTooltipOverlay
        tooltip={activeTooltip}
        onClose={() => setActiveTooltip(null)}
        compact={compact}
      />
    </div>
  );
};

/* =========================================================================
   4. DIAGRAMA DE MODOS LOG-NORMALES DE AEROSOLES (WHITBY 1978)
   ========================================================================= */
const AEROSOL_TOOLTIPS: Record<string, DiagramTooltipInfo> = {
  nucleation: {
    id: 'nucleation',
    title: 'Modo Nucleación (Dp < 0.02 µm = 20 nm)',
    discipline: 'Microfísica de Nanopartículas Atmosféricas',
    formulaLaTeX: 'J_{nuc} = \\frac{dN}{dt} \\propto [H_2SO_4]^p [NH_3]^q [Org]^r \\quad [part/(cm^3\\cdot s)]',
    description: 'Partículas ultrafinas recién formadas por nucleación gas-a-partícula a partir de ácido sulfúrico, amoniaco y vapores orgánicos de muy baja volatilidad (ELVOC). Máxima concentración numérica pero masa minúscula.',
    regulatoryStandard: 'Guías de la OMS 2021 sobre Partículas Ultrafinas (UFP < 100 nm)',
    literatureCitation: 'Whitby, K.T. (1978); Kulmala et al. (2004), Science',
    empiricalMalagaContext: 'Eventos de nucleación regional en Málaga al mediodía solar impulsados por radiación UV y emisiones de SO2 portuario.',
    accentColor: '#a855f7'
  },
  coagulation: {
    id: 'coagulation',
    title: 'Coagulación Browniana y Condensación',
    discipline: 'Cinética de Colisiones en Aerosoles',
    formulaLaTeX: '\\frac{dN}{dt} = -K_{12} N_1 N_2, \\quad K_{12} \\approx \\frac{2 k_B T}{3 \\mu} \\left( \\frac{1}{d_1} + \\frac{1}{d_2} \\right)(d_1 + d_2)',
    description: 'Colisión irreversible inducida por el movimiento térmico browniano. Hace que las nanopartículas crezcan en volumen y se transfieran al modo de acumulación.',
    literatureCitation: 'Smoluchowski, M. (1916); Seinfeld & Pandis (2016)',
    empiricalMalagaContext: 'En menos de 2 horas tras ser emitidas por los tubos de escape en la MA-20, las partículas ultrafinas coalescen en el modo PM2.5.',
    accentColor: '#ec4899'
  },
  accumulation: {
    id: 'accumulation',
    title: 'Modo Acumulación (0.1 µm ≤ Dp ≤ 2.5 µm • PM2.5)',
    discipline: 'Partículas Respirables y Óptica Atmosférica',
    formulaLaTeX: 'n(D_p) = \\frac{N_i}{\\sqrt{2\\pi} \\ln \\sigma_g D_p} \\exp\\left( -\\frac{(\\ln D_p - \\ln D_{pg})^2}{2 \\ln^2 \\sigma_g} \\right)',
    description: 'Modo de máxima longevidad en el aire (5 a 10 días). Compuesto por sulfatos, nitratos, hollín diésel (black carbon) y SOA. Penetra profundamente hasta los alvéolos pulmonares.',
    regulatoryStandard: 'Directiva 2008/50/CE: Valor límite anual PM2.5 = 20 µg/m³; Guía OMS 2021 = 5 µg/m³',
    literatureCitation: 'Pope & Dockery (2006); EMEP/EEA 2023',
    empiricalMalagaContext: 'El tráfico rodado metropolitano y los buques del Puerto de Málaga son las principales fuentes emisoras de esta fracción.',
    accentColor: '#06b6d4'
  },
  coarse: {
    id: 'coarse',
    title: 'Modo Grueso (2.5 µm < Dp ≤ 10 µm • PM10)',
    discipline: 'Aerosoles Mecánicos y Minerales',
    formulaLaTeX: 'v_{sed} = \\frac{\\rho_p D_p^2 g C_c}{18 \\mu} \\quad (\\text{Sedimentación gravitatoria de Stokes})',
    description: 'Partículas generadas por erosión mecánica: resuspensión por rodadura en pavimento, polvo mineral sahariano y spray salino marino. Vida media corta (horas a pocos días).',
    regulatoryStandard: 'Directiva 2008/50/CE: Límite diario PM10 50 µg/m³ (máx. 35 superaciones/año); OMS 2021: 15 µg/m³ anual',
    literatureCitation: 'Querol et al. (2004); Pey et al. (2013)',
    empiricalMalagaContext: 'Las intrusiones de calima sahariana y el oleaje litoral en el Paseo Marítimo de Málaga disparan este modo por encima de 100 µg/m³.',
    accentColor: '#f59e0b'
  }
};

export const AerosolModesDiagram: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [activeTooltip, setActiveTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 480, h: 250 };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-cyan-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
        <span>Nodos interactivos</span>
      </div>

      <svg
        width={size.w}
        height={size.h}
        viewBox="0 0 480 250"
        className="w-full h-auto max-h-[250px]"
      >
        <defs>
          <linearGradient id="nucGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="accGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="crsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Ejes Log Dp vs dN/dlnDp */}
        <line x1="50" y1="210" x2="440" y2="210" stroke="#475569" strokeWidth="2" />
        <line x1="50" y1="210" x2="50" y2="30" stroke="#475569" strokeWidth="2" />
        <text x="440" y="225" textAnchor="end" fill="#94a3b8" fontSize="10" fontFamily="monospace">
          Diámetro D_p (µm) [Escala Logarítmica]
        </text>
        <text x="40" y="30" textAnchor="end" fill="#94a3b8" fontSize="10" fontFamily="monospace" transform="rotate(-90 40 30)">
          dN / d ln D_p
        </text>

        {/* Marcas de diámetro */}
        <text x="110" y="225" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">0.01 µm (10 nm)</text>
        <text x="230" y="225" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">0.1 µm</text>
        <text x="310" y="225" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">1.0 µm</text>
        <text x="400" y="225" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">10.0 µm</text>

        {/* Modo 1: Nucleación (Dp < 20 nm) */}
        <g
          className="cursor-pointer hover:opacity-95 transition-all"
          onClick={() => setActiveTooltip(AEROSOL_TOOLTIPS.nucleation)}
          onMouseEnter={() => setActiveTooltip(AEROSOL_TOOLTIPS.nucleation)}
        >
          <path
            d="M 60 210 Q 110 50 160 210 Z"
            fill="url(#nucGrad)"
            stroke="#a855f7"
            strokeWidth="2"
          />
          <text x="110" y="70" textAnchor="middle" fill="#d8b4fe" fontSize="10" fontWeight="bold" fontFamily="monospace">
            Nucleación
          </text>
          <text x="110" y="85" textAnchor="middle" fill="#c084fc" fontSize="8">
            Precursores SO₂, NH₃
          </text>
        </g>

        {/* Modo 2: Acumulación (0.1 a 2.5 µm - PM2.5) */}
        <g
          className="cursor-pointer hover:opacity-95 transition-all"
          onClick={() => setActiveTooltip(AEROSOL_TOOLTIPS.accumulation)}
          onMouseEnter={() => setActiveTooltip(AEROSOL_TOOLTIPS.accumulation)}
        >
          <path
            d="M 170 210 Q 260 80 340 210 Z"
            fill="url(#accGrad)"
            stroke="#06b6d4"
            strokeWidth="2.5"
          />
          <text x="255" y="105" textAnchor="middle" fill="#67e8f9" fontSize="11" fontWeight="bold" fontFamily="monospace">
            Acumulación (PM₂.₅)
          </text>
          <text x="255" y="120" textAnchor="middle" fill="#22d3ee" fontSize="8">
            Coagulación + Combustión
          </text>
        </g>

        {/* Flecha de Coagulación Browniana */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(AEROSOL_TOOLTIPS.coagulation)}
          onMouseEnter={() => setActiveTooltip(AEROSOL_TOOLTIPS.coagulation)}
        >
          <motion.path
            d="M 130 160 L 200 160"
            stroke="#ec4899"
            strokeWidth="2"
            strokeDasharray="4 2"
            animate={{ strokeDashoffset: [-12, 0] }}
            transition={{ repeat: Infinity, duration: 1.0, ease: "linear" }}
          />
          <text x="165" y="152" textAnchor="middle" fill="#f472b6" fontSize="8" fontWeight="bold" fontFamily="monospace">
            Coagulación
          </text>
        </g>

        {/* Modo 3: Grueso (Dp > 2.5 µm - PM10) */}
        <g
          className="cursor-pointer hover:opacity-95 transition-all"
          onClick={() => setActiveTooltip(AEROSOL_TOOLTIPS.coarse)}
          onMouseEnter={() => setActiveTooltip(AEROSOL_TOOLTIPS.coarse)}
        >
          <path
            d="M 330 210 Q 380 120 430 210 Z"
            fill="url(#crsGrad)"
            stroke="#f59e0b"
            strokeWidth="2"
          />
          <text x="380" y="135" textAnchor="middle" fill="#fde68a" fontSize="10" fontWeight="bold" fontFamily="monospace">
            Modo Grueso (PM₁₀)
          </text>
          <text x="380" y="150" textAnchor="middle" fill="#fbbf24" fontSize="8">
            Polvo Sahariano / Spray Marino
          </text>
        </g>
      </svg>

      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <ScientificTooltip content="Modo nucleación (D_p < 20 nm): nanopartículas ultra-finas de escape vehicular directo con penetración alveolar profunda.">
          <button
            type="button"
            onClick={() => setActiveTooltip(AEROSOL_TOOLTIPS.nucleation)}
            className="text-purple-400 hover:text-purple-300 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>Nucleación (&lt; 20 nm)</span>
          </button>
        </ScientificTooltip>
        <ScientificTooltip content="Modo acumulación (0.1 - 2.5 µm): aerosoles secundarios inorgánicos (SIA) y orgánicos (SOA) con máxima persistencia atmosférica.">
          <button
            type="button"
            onClick={() => setActiveTooltip(AEROSOL_TOOLTIPS.accumulation)}
            className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>PM₂.₅ Acumulación</span>
          </button>
        </ScientificTooltip>
        <ScientificTooltip content="Modo grueso (2.5 - 10 µm): intrusiones saharianas de polvo mineral y aerosoles marinos de sal con sedimentación gravitatoria.">
          <button
            type="button"
            onClick={() => setActiveTooltip(AEROSOL_TOOLTIPS.coarse)}
            className="text-amber-400 hover:text-amber-300 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>PM₁₀ Grueso (Calima/Spray)</span>
          </button>
        </ScientificTooltip>
      </div>

      <DiagramTooltipOverlay
        tooltip={activeTooltip}
        onClose={() => setActiveTooltip(null)}
        compact={compact}
      />
    </div>
  );
};

/* =========================================================================
   5. DIAGRAMA DE VELOCIDAD vs EMISIONES COPERT 5
   ========================================================================= */
const COPERT_TOOLTIPS: Record<string, DiagramTooltipInfo> = {
  congestion: {
    id: 'congestion',
    title: 'Régimen de Congestión Severa (V = 15 km/h • Stop-and-Go)',
    discipline: 'Emisiones Dinámicas en Conducción Urbana',
    formulaLaTeX: 'EF_{NO_x}(V = 15) \\approx 2.80 \\times EF_{óptimo} \\quad [g/km]',
    description: 'En retenciones con marchas cortas y constantes arrancadas, la baja temperatura del catalizador (< 200°C) reduce drásticamente la tasa de reducción de NOx, disparando las emisiones.',
    regulatoryStandard: 'Directivas ZBE según Ley 7/2021 de Cambio Climático',
    literatureCitation: 'EEA COPERT 5 Model; Barlow et al. (2001)',
    empiricalMalagaContext: 'Fundamenta la ZBE de Málaga en el centro urbano para suprimir atascos y circulación pasante.',
    accentColor: '#ef4444'
  },
  optimal: {
    id: 'optimal',
    title: 'Ventana Óptima de Eficiencia (50 a 70 km/h)',
    discipline: 'Termodinámica de Post-tratamiento de Gases',
    formulaLaTeX: 'EF_{mínimo} \\approx 0.32 \\text{ a } 0.38 \\, g\\, NO_x/km \\quad (V \\in [50, 70] \\text{ km/h})',
    description: 'El motor opera con par constante en marchas intermedias-altas, el catalizador está caliente (> 300°C) y el arrastre aerodinámico aún es moderado.',
    literatureCitation: 'Ntziachristos & Samaras (2018), COPERT European Model',
    empiricalMalagaContext: 'Velocidad de coordinación semafórica recomendada en Avenida de Andalucía y Manuel Agustín Heredia.',
    accentColor: '#10b981'
  },
  high_speed: {
    id: 'high_speed',
    title: 'Arrastre Aerodinámico en Vías Rápidas (V > 90 km/h)',
    discipline: 'Dinámica Longitudinal de Vehículos',
    formulaLaTeX: 'P_{req} \\propto \\frac{1}{2} \\rho_{aire} C_d A V^3, \\quad F_{drag} \\propto V^2',
    description: 'A altas velocidades, la potencia requerida crece con el cubo de la velocidad debido a la resistencia aerodinámica, duplicando el consumo específico de combustible y los óxidos de nitrógeno.',
    regulatoryStandard: 'Protocolos DGT de Gestión de Velocidad Variable en Accesos Metropolitanos',
    literatureCitation: 'Gillespie, T.D. (1992), Fundamentals of Vehicle Dynamics',
    empiricalMalagaContext: 'Limitar la velocidad a 80 km/h en las rondas MA-20 y A-7 reduce hasta un 22% la emisión lineal en episodios agudos.',
    accentColor: '#f59e0b'
  }
};

export const CopertSpeedEmissionsDiagram: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [activeTooltip, setActiveTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 480, h: 250 };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-rose-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
        <span>Nodos interactivos</span>
      </div>

      <svg
        width={size.w}
        height={size.h}
        viewBox="0 0 480 250"
        className="w-full h-auto max-h-[250px]"
      >
        <defs>
          <linearGradient id="copertCurveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        <line x1="50" y1="210" x2="440" y2="210" stroke="#475569" strokeWidth="2" />
        <line x1="50" y1="210" x2="50" y2="30" stroke="#475569" strokeWidth="2" />

        <text x="440" y="225" textAnchor="end" fill="#94a3b8" fontSize="10" fontFamily="monospace">
          Velocidad Media V (km/h)
        </text>
        <text x="40" y="30" textAnchor="end" fill="#94a3b8" fontSize="10" fontFamily="monospace" transform="rotate(-90 40 30)">
          Factor Emisión EF (g NOx/km)
        </text>

        {/* Velocidades en eje X */}
        <text x="90" y="225" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">15 (Atasco)</text>
        <text x="210" y="225" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">60 (Óptimo)</text>
        <text x="320" y="225" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">90 (Ronda MA-20)</text>
        <text x="410" y="225" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">120 (Autovía)</text>

        {/* Curva en U COPERT */}
        <path
          d="M 70 60 Q 210 240 420 110"
          fill="none"
          stroke="url(#copertCurveGrad)"
          strokeWidth="3.5"
        />

        {/* Punto de congestión crítica (15 km/h) */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(COPERT_TOOLTIPS.congestion)}
          onMouseEnter={() => setActiveTooltip(COPERT_TOOLTIPS.congestion)}
        >
          <circle cx="90" cy="85" r="5" fill="#ef4444" />
          <text x="95" y="70" fill="#f87171" fontSize="9" fontWeight="bold" fontFamily="monospace">
            Atasco urbano: +280% NOx
          </text>
        </g>

        {/* Punto óptimo (60 km/h) */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(COPERT_TOOLTIPS.optimal)}
          onMouseEnter={() => setActiveTooltip(COPERT_TOOLTIPS.optimal)}
        >
          <circle cx="210" cy="188" r="5" fill="#10b981" />
          <text x="210" y="175" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="bold" fontFamily="monospace">
            Eficiencia Óptima (0.35 g/km)
          </text>
        </g>

        {/* Resistencia aerodinámica (> 100 km/h) */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(COPERT_TOOLTIPS.high_speed)}
          onMouseEnter={() => setActiveTooltip(COPERT_TOOLTIPS.high_speed)}
        >
          <circle cx="410" cy="115" r="5" fill="#f59e0b" />
          <text x="400" y="95" textAnchor="end" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="monospace">
            Arrastre Aerodinámico ∝ V²
          </text>
        </g>
      </svg>

      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <ScientificTooltip content="Régimen de congestión (V < 15 km/h): parada y arranque continuo con emisión máxima de NOx por ciclo transitorio ineficiente.">
          <button
            type="button"
            onClick={() => setActiveTooltip(COPERT_TOOLTIPS.congestion)}
            className="text-rose-400 hover:text-rose-300 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>Atascos (ZBE Crítica)</span>
          </button>
        </ScientificTooltip>
        <ScientificTooltip content="Régimen óptimo de crucero (50 - 70 km/h): eficiencia térmica del motor máxima con factor de emisión específico mínimo en g/km.">
          <button
            type="button"
            onClick={() => setActiveTooltip(COPERT_TOOLTIPS.optimal)}
            className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>Régimen Óptimo 50-70 km/h</span>
          </button>
        </ScientificTooltip>
        <ScientificTooltip content="Régimen de alta velocidad en autovías (MA-20/A-7): la potencia requerida crece con V³ disparando la emisión térmica de NOx.">
          <button
            type="button"
            onClick={() => setActiveTooltip(COPERT_TOOLTIPS.high_speed)}
            className="text-amber-400 hover:text-amber-300 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>Autovías MA-20 / A-7</span>
          </button>
        </ScientificTooltip>
      </div>

      <DiagramTooltipOverlay
        tooltip={activeTooltip}
        onClose={() => setActiveTooltip(null)}
        compact={compact}
      />
    </div>
  );
};

/* =========================================================================
   6. DIAGRAMA DEL PROTOCOLO DE EPISODIOS AGUDOS Y ESCALONES DE CONTINGENCIA
   ========================================================================= */
const EPISODES_TOOLTIPS: Record<string, DiagramTooltipInfo> = {
  alert: {
    id: 'alert',
    title: 'Umbral de Alerta Sanitaria (240 µg/m³ O₃ / 400 µg/m³ NO₂)',
    discipline: 'Epidemiología y Protección Civil',
    formulaLaTeX: '[O_3]_{1h} \\ge 240 \\, \\mu g/m^3 \\quad \\text{o} \\quad [NO_2]_{1h} \\ge 400 \\, \\mu g/m^3 \\text{ (3h consec.)}',
    description: 'Nivel a partir del cual una exposición breve presenta riesgos para la salud de toda la población en general. Activa la fase de Intervención con restricciones drásticas de tráfico y aviso sanitario.',
    regulatoryStandard: 'Real Decreto 102/2011, Anexo II y Directiva 2008/50/CE',
    literatureCitation: 'WHO Global Air Quality Guidelines (2021)',
    empiricalMalagaContext: 'Plan de Contingencia de Málaga: Desvío forzoso de tráfico pesado fuera de la ronda urbana y EMT gratuito.',
    accentColor: '#ef4444'
  },
  warning: {
    id: 'warning',
    title: 'Umbral de Información y Aviso (180 µg/m³ O₃ / 200 µg/m³ NO₂)',
    discipline: 'Salud Pública y Difusión Preventiva',
    formulaLaTeX: '[O_3]_{1h} \\ge 180 \\, \\mu g/m^3 \\quad \\text{o} \\quad [NO_2]_{1h} \\ge 200 \\, \\mu g/m^3',
    description: 'Nivel donde la exposición breve puede afectar a grupos vulnerables (infancia, ancianos, asma y patologías cardiopulmonares). Obliga a comunicar por medios públicos y restringir velocidad.',
    regulatoryStandard: 'Directiva 2008/50/CE y Real Decreto 102/2011',
    literatureCitation: 'Anderson et al. (2012), Clearing the air review',
    empiricalMalagaContext: 'Aviso al Servicio Andaluz de Salud (SAS) y reducción temporal de velocidad a 70 km/h en rondas de circunvalación.',
    accentColor: '#fbbf24'
  },
  prealert: {
    id: 'prealert',
    title: 'Umbral de Preaviso Municipal Preventivo (160 µg/m³)',
    discipline: 'Nowcasting Predictivo con Gemelo Digital',
    formulaLaTeX: '[C]_{pronosticado, 3h} \\ge 0.85 \\cdot [C]_{umbral}',
    description: 'Mecanismo anticipatorio físico del Gemelo Digital. En lugar de esperar a la superación pasiva en los analizadores, proyecta la advección acoplada a la fotólisis 3 horas antes del pico.',
    regulatoryStandard: 'Criterios FAIRMODE WG1 sobre Sistemas de Alerta Temprana',
    literatureCitation: 'Denby et al. (2010), Real-time air quality forecasting',
    empiricalMalagaContext: 'Alerta a los operadores municipales de movilidad para calibrar ciclos semafóricos y preparar la red de transporte.',
    accentColor: '#38bdf8'
  },
  peak: {
    id: 'peak',
    title: 'Pico Fotoquímico Vespertino Diurno (16:00 UTC)',
    discipline: 'Mesoescala y Brisas Litorales',
    formulaLaTeX: '\\frac{\\partial [O_3]}{\\partial t} = -\\mathbf{u}\\cdot\\nabla [O_3] + K_z \\frac{\\partial^2 [O_3]}{\\partial z^2} + P_{quim} - L_{quim}',
    description: 'Conjunción del máximo de insolación diurna acumulada con la llegada de la brisa marina cargada de precursores transportados desde las arterias litorales.',
    literatureCitation: 'Millán, M.M. et al. (1997), Western Mediterranean Ozone Cycles',
    empiricalMalagaContext: 'Fenómeno clásico entre mayo y septiembre en el valle del Guadalhorce y vertientes septentrionales de Málaga.',
    accentColor: '#06b6d4'
  },
  hospitals: {
    id: 'hospitals',
    title: 'Receptores Vulnerables (Hospitales Carlos Haya y Clínico)',
    discipline: 'Dosimetría y Vulnerabilidad Geoespacial',
    formulaLaTeX: '\\text{Dosis Habitante} = \\int_0^T C_{inhalada}(t) \\cdot V_E(t) \\, dt',
    description: 'Censo de equipamientos altamente sensibles ubicados en el radio de impacto directo del penacho de la MA-20 y rondas urbanas.',
    regulatoryStandard: 'Plan Andaluz de Salud y Medio Ambiente (PASA)',
    literatureCitation: 'Jerrett et al. (2005), Spatial analysis of air pollution',
    empiricalMalagaContext: 'Hospital Regional Carlos Haya y Clínico Universitario de Teatinos reciben vigilancia prioritaria.',
    accentColor: '#fca5a5'
  }
};

export const AcuteEpisodesDiagram: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [activeTooltip, setActiveTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 500, h: 280 };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-rose-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
        <span>Nodos interactivos</span>
      </div>

      <svg width={size.w} height={size.h} viewBox="0 0 500 280" className="w-full h-auto max-h-[280px]">
        <defs>
          <linearGradient id="alertGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="warnGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Ejes */}
        <line x1="60" y1="240" x2="470" y2="240" stroke="#475569" strokeWidth="1.5" />
        <line x1="60" y1="240" x2="60" y2="30" stroke="#475569" strokeWidth="1.5" />

        {/* Zona Alerta (> 240 µg/m³) */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(EPISODES_TOOLTIPS.alert)}
          onMouseEnter={() => setActiveTooltip(EPISODES_TOOLTIPS.alert)}
        >
          <rect x="60" y="50" width="410" height="50" fill="url(#alertGrad)" />
          <line x1="60" y1="50" x2="470" y2="50" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" />
          <text x="465" y="45" textAnchor="end" fill="#f87171" fontSize="9" fontWeight="bold" fontFamily="monospace">
            ALERTA SANITARIA (240 µg/m³ O₃ / 400 NO₂)
          </text>
        </g>

        {/* Zona Información / Aviso (> 180 µg/m³) */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(EPISODES_TOOLTIPS.warning)}
          onMouseEnter={() => setActiveTooltip(EPISODES_TOOLTIPS.warning)}
        >
          <rect x="60" y="100" width="410" height="50" fill="url(#warnGrad)" />
          <line x1="60" y1="100" x2="470" y2="100" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="465" y="95" textAnchor="end" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="monospace">
            AVISO / INFORMACIÓN (180 µg/m³ O₃ / 200 NO₂)
          </text>
        </g>

        {/* Zona Preaviso (160 µg/m³) */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(EPISODES_TOOLTIPS.prealert)}
          onMouseEnter={() => setActiveTooltip(EPISODES_TOOLTIPS.prealert)}
        >
          <line x1="60" y1="150" x2="470" y2="150" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
          <text x="465" y="145" textAnchor="end" fill="#38bdf8" fontSize="8" fontFamily="monospace">
            PREAVISO MUNICIPAL (160 µg/m³)
          </text>
        </g>

        {/* Curva determinista de Nowcasting con superación vespertina */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(EPISODES_TOOLTIPS.peak)}
          onMouseEnter={() => setActiveTooltip(EPISODES_TOOLTIPS.peak)}
        >
          <path
            d="M 60 210 Q 140 200 200 160 T 300 70 T 380 90 T 470 190"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="3"
          />
          <circle cx="200" cy="160" r="4" fill="#38bdf8" />
          <circle cx="260" cy="100" r="5" fill="#f59e0b" />
          <motion.circle
            cx="300"
            cy="70"
            r="6"
            fill="#ef4444"
            animate={{ r: [5, 8, 5], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </g>

        {/* Etiquetas de receptores impactados */}
        <g
          transform="translate(305, 65)"
          className="cursor-pointer"
          onClick={() => setActiveTooltip(EPISODES_TOOLTIPS.hospitals)}
          onMouseEnter={() => setActiveTooltip(EPISODES_TOOLTIPS.hospitals)}
        >
          <rect x="0" y="0" width="150" height="28" rx="4" fill="#0f172a" stroke="#ef4444" strokeWidth="1" />
          <text x="6" y="12" fill="#fca5a5" fontSize="8" fontWeight="bold" fontFamily="monospace">
            Hosp. Carlos Haya & Clínico
          </text>
          <text x="6" y="22" fill="#cbd5e1" fontSize="7" fontFamily="monospace">
            Dosis: +210% • Alerta SAS
          </text>
        </g>

        {/* Eje X (Horas) */}
        <text x="80" y="255" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">08:00</text>
        <text x="180" y="255" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">12:00</text>
        <text x="300" y="255" textAnchor="middle" fill="#f87171" fontSize="8" fontWeight="bold" fontFamily="monospace">16:00 (Pico)</text>
        <text x="400" y="255" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">20:00</text>
      </svg>

      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <ScientificTooltip content="Escalón 1 - Preaviso: superación de 180 µg/m³ durante 2 horas consecutivas; recomendación ciudadana y vigilancia activa.">
          <button
            type="button"
            onClick={() => setActiveTooltip(EPISODES_TOOLTIPS.prealert)}
            className="text-sky-400 hover:text-sky-300 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>Escalón 1: Preaviso</span>
          </button>
        </ScientificTooltip>
        <ScientificTooltip content="Escalón 2 - Aviso: limitación de velocidad metropolitana a 70 km/h y refuerzo de transporte público eléctrico.">
          <button
            type="button"
            onClick={() => setActiveTooltip(EPISODES_TOOLTIPS.warning)}
            className="text-amber-400 hover:text-amber-300 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>Escalón 2: Aviso (70 km/h)</span>
          </button>
        </ScientificTooltip>
        <ScientificTooltip content="Escalón 3 - Alerta Sanitaria: superación del umbral de alerta (400 µg/m³ NO₂ o 240 µg/m³ O₃); restricción de tráfico e intervención SAS.">
          <button
            type="button"
            onClick={() => setActiveTooltip(EPISODES_TOOLTIPS.alert)}
            className="text-rose-400 hover:text-rose-300 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>Escalón 3: Alerta Sanitaria</span>
          </button>
        </ScientificTooltip>
      </div>

      <DiagramTooltipOverlay
        tooltip={activeTooltip}
        onClose={() => setActiveTooltip(null)}
        compact={compact}
      />
    </div>
  );
};

/* =========================================================================
   7. DIAGRAMA DE INCERTIDUMBRE GUM Y DISTRIBUCIÓN EXPANDIDA (U95%)
   ========================================================================= */
const GUM_TOOLTIPS: Record<string, DiagramTooltipInfo> = {
  pdf: {
    id: 'pdf',
    title: 'Distribución Gaussiana de Probabilidad GUM N(C, uc²)',
    discipline: 'Metrología Física y Evaluación de la Incertidumbre',
    formulaLaTeX: 'f(C) = \\frac{1}{\\sqrt{2\\pi} u_c} \\exp\\left( -\\frac{(C - \\mu)^2}{2 u_c^2} \\right), \\quad u_c^2 = \\sum c_i^2 u_i^2',
    description: 'Distribución estadística formal según JCGM 100:2008 (GUM). Integra varianzas instrumentales de analizadores Tipo A con incertidumbres Tipo B de microfísica y emisiones.',
    regulatoryStandard: 'Guía JCGM 100:2008 (GUM) y UNE-EN ISO/IEC 17025',
    literatureCitation: 'BIPM, IEC, IFCC, ILAC, ISO, IUPAC, IUPAP, OIML (2008)',
    empiricalMalagaContext: 'Asegura el rigor metrológico y la trazabilidad de los datos asimilados en el Gemelo Digital.',
    accentColor: '#c084fc'
  },
  expanded: {
    id: 'expanded',
    title: 'Incertidumbre Expandida U_95% (k = 2.00)',
    discipline: 'Estadística Aplicada a Modelos de Transporte',
    formulaLaTeX: 'U_{95\\%} = k \\cdot u_c = 2.00 \\cdot u_c \\quad (p = 95.45\\%)',
    description: 'Banda simétrica en torno al valor nominal predicho que contiene el 95.45% de las observaciones experimentales certificadas.',
    regulatoryStandard: 'Normas Europeas EN 14211 (NO2) y EN 14625 (O3)',
    literatureCitation: 'EURACHEM / CITAC Guide CG 4 (2012)',
    empiricalMalagaContext: 'En Málaga, U_95% es de ±12.0 µg/m³ para una media nominal de 48.5 µg/m³ (±24.8% relativo).',
    accentColor: '#38bdf8'
  },
  dqo: {
    id: 'dqo',
    title: 'Objetivo de Calidad de Datos (DQO) de la UE (< 50%)',
    discipline: 'Trazabilidad y Conformidad Normativa',
    formulaLaTeX: '\\text{DQO Relativo} = \\frac{U_{95\\%}}{C_{límite}} \\le 50\\% \\quad (\\text{Requisito Directiva 2008/50/CE})',
    description: 'Exigencia jurídica comunitaria para que las simulaciones puedan utilizarse en planificación y evaluación oficial. Con un 24.8%, el Gemelo Digital supera holgadamente el umbral legal.',
    regulatoryStandard: 'Directiva 2008/50/CE, Anexo I, Sección A',
    literatureCitation: 'Thunis et al. (2012), Model Quality Objectives (FAIRMODE WG1)',
    empiricalMalagaContext: 'Certificado frente a las 6 estaciones fijas oficiales de Málaga (Junta de Andalucía y Autoridad Portuaria).',
    accentColor: '#10b981'
  },
  nominal: {
    id: 'nominal',
    title: 'Concentración Nominal Estimada (Media C)',
    discipline: 'Inferencia y Estimación Óptima',
    formulaLaTeX: '\\hat{C} = \\mathbb{E}[C | \\mathbf{x}_{OSM}, \\mathbf{y}_{telemetría}, \\mathbf{\\theta}_{física}]',
    description: 'Estimador insesgado obtenido por asimilación continua de telemetría acoplada a las ecuaciones de Navier-Stokes y cinética de microescala.',
    literatureCitation: 'Evensen, G. (2009), Data Assimilation EnKF',
    empiricalMalagaContext: 'Actualizado ciclo a ciclo en tiempo real cada 60 segundos.',
    accentColor: '#e2e8f0'
  }
};

export const GumUncertaintyDiagram: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [activeTooltip, setActiveTooltip] = useState<DiagramTooltipInfo | null>(null);
  const size = compact ? { w: 280, h: 160 } : { w: 500, h: 280 };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/90 border border-purple-900/60 shadow-inner overflow-hidden select-none">
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/40 z-10 pointer-events-none">
        <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
        <span>Nodos interactivos</span>
      </div>

      <svg width={size.w} height={size.h} viewBox="0 0 500 280" className="w-full h-auto max-h-[280px]">
        <defs>
          <linearGradient id="gaussGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Ejes */}
        <line x1="50" y1="230" x2="460" y2="230" stroke="#475569" strokeWidth="1.5" />
        <line x1="250" y1="230" x2="250" y2="40" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Curva Gaussiana de Probabilidad GUM N(C, u_c^2) */}
        <g
          className="cursor-pointer hover:opacity-95 transition-all"
          onClick={() => setActiveTooltip(GUM_TOOLTIPS.pdf)}
          onMouseEnter={() => setActiveTooltip(GUM_TOOLTIPS.pdf)}
        >
          <path
            d="M 90 230 Q 170 230 200 170 T 250 50 T 300 170 Q 330 230 410 230"
            fill="url(#gaussGrad)"
            stroke="#c084fc"
            strokeWidth="3"
          />
        </g>

        {/* Banda de Confianza Expandida k = 2.00 (95.45%) */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(GUM_TOOLTIPS.expanded)}
          onMouseEnter={() => setActiveTooltip(GUM_TOOLTIPS.expanded)}
        >
          <line x1="160" y1="180" x2="340" y2="180" stroke="#38bdf8" strokeWidth="2.5" />
          <circle cx="160" cy="180" r="4" fill="#38bdf8" />
          <circle cx="340" cy="180" r="4" fill="#38bdf8" />
          <text x="250" y="172" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace">
            U_95% = ±2.00 · u_c (±24.8%)
          </text>
        </g>

        {/* Objetivo de Calidad de la UE (< 50%) */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(GUM_TOOLTIPS.dqo)}
          onMouseEnter={() => setActiveTooltip(GUM_TOOLTIPS.dqo)}
        >
          <line x1="100" y1="210" x2="400" y2="210" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x="405" y="208" fill="#34d399" fontSize="8" fontFamily="monospace">
            Límite DQO UE: 50%
          </text>
        </g>

        {/* Mediana / Concentración Nominal */}
        <g
          className="cursor-pointer"
          onClick={() => setActiveTooltip(GUM_TOOLTIPS.nominal)}
          onMouseEnter={() => setActiveTooltip(GUM_TOOLTIPS.nominal)}
        >
          <text x="250" y="32" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold" fontFamily="monospace">
            Concentración Nominal C = 48.5 µg/m³
          </text>
        </g>

        {/* Eje X (Valores) */}
        <text x="160" y="245" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
          C - U95 (36.5)
        </text>
        <text x="250" y="245" textAnchor="middle" fill="#c084fc" fontSize="8" fontWeight="bold" fontFamily="monospace">
          Media C (48.5)
        </text>
        <text x="340" y="245" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
          C + U95 (60.5)
        </text>
      </svg>

      <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-2 border-t border-slate-900 pt-1">
        <ScientificTooltip content="Guía JCGM 100:2008 (GUM): propagación analítica de incertidumbres combinadas u_c(C) a partir de varianzas componentes.">
          <button
            type="button"
            onClick={() => setActiveTooltip(GUM_TOOLTIPS.pdf)}
            className="text-purple-400 hover:text-purple-300 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>JCGM 100:2008 (GUM)</span>
          </button>
        </ScientificTooltip>
        <ScientificTooltip content="Incertidumbre expandida U_95 = k · u_c con factor de cobertura k = 2.00 correspondiente al 95.45% de nivel de confianza.">
          <button
            type="button"
            onClick={() => setActiveTooltip(GUM_TOOLTIPS.expanded)}
            className="text-sky-400 hover:text-sky-300 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>Factor k = 2.00 (95.45%)</span>
          </button>
        </ScientificTooltip>
        <ScientificTooltip content="Objetivos de Calidad de Datos (DQO, Directiva 2008/50/CE): incertidumbre máxima permitida del 15% para medidas fijas y 50% para modelización.">
          <button
            type="button"
            onClick={() => setActiveTooltip(GUM_TOOLTIPS.dqo)}
            className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors flex items-center gap-1 text-left cursor-pointer"
          >
            <Info className="w-2.5 h-2.5 shrink-0" />
            <span>DQO Directiva 2008/50/CE</span>
          </button>
        </ScientificTooltip>
      </div>

      <DiagramTooltipOverlay
        tooltip={activeTooltip}
        onClose={() => setActiveTooltip(null)}
        compact={compact}
      />
    </div>
  );
};

/* =========================================================================
   COMPONENTE SWITCH MASTER PARA DIAGRAMAS CIENTÍFICOS
   ========================================================================= */
import {
  MoninObukhovDiagram,
  SeaBreezeCirculationDiagram,
  WindVectorAdvectionDiagram,
  OrographicBruntVaisalaDiagram,
  AodOpticalExtinctionDiagram,
  CoastalHalogenClno2Diagram,
  BvocIsopreneSoaDiagram,
  No2CopertMarineScavengingDiagram
} from './AtlasAtmosphericDiagrams';
import {
  PinnPhysicsLossDiagram,
  IsoplethAdvectionDiffusionDiagram,
  DeckGlGpuInstancingDiagram,
  OfficialMonitoringNetworkDiagram,
  OsmUrbanCanopyLod1Diagram,
  AircraftLtoDiagram,
  Temporal7dHistoryDiagram
} from './AtlasComputationalDiagrams';

export const DeepScientificDiagram: React.FC<DiagramProps> = ({
  type,
  compact = false,
  className = ""
}) => {
  switch (type) {
    case 'leighton':
      return <LeightonCycleDiagram compact={compact} />;
    case 'canyon_vortex':
      return <UrbanCanyonVortexDiagram compact={compact} />;
    case 'wesely':
      return <WeselyDepositionDiagram compact={compact} />;
    case 'monin_obukhov':
      return <MoninObukhovDiagram compact={compact} />;
    case 'copert_speed':
      return <CopertSpeedEmissionsDiagram compact={compact} />;
    case 'aerosol_modes':
      return <AerosolModesDiagram compact={compact} />;
    case 'sea_breeze':
      return <SeaBreezeCirculationDiagram compact={compact} />;
    case 'aircraft_lto':
      return <AircraftLtoDiagram compact={compact} />;
    case 'isoprene_emission':
      return <BvocIsopreneSoaDiagram compact={compact} />;
    case 'pinn_physics_loss':
      return <PinnPhysicsLossDiagram compact={compact} />;
    case 'coastal_halogen':
      return <CoastalHalogenClno2Diagram compact={compact} />;
    case 'copert_marine_scavenging':
      return <No2CopertMarineScavengingDiagram compact={compact} />;
    case 'acute_episodes':
      return <AcuteEpisodesDiagram compact={compact} />;
    case 'gum_uncertainty':
      return <GumUncertaintyDiagram compact={compact} />;
    case 'aod_extinction':
      return <AodOpticalExtinctionDiagram compact={compact} />;
    case 'wind_advection':
      return <WindVectorAdvectionDiagram compact={compact} />;
    case 'isopleth_diffusion':
      return <IsoplethAdvectionDiffusionDiagram compact={compact} />;
    case 'brunt_vaisala':
      return <OrographicBruntVaisalaDiagram compact={compact} />;
    case 'gpu_instancing':
      return <DeckGlGpuInstancingDiagram compact={compact} />;
    case 'fairmode_network':
      return <OfficialMonitoringNetworkDiagram compact={compact} />;
    case 'osm_canopy_lod1':
      return <OsmUrbanCanopyLod1Diagram compact={compact} />;
    case 'temporal_7d_history':
      return <Temporal7dHistoryDiagram compact={compact} />;
    default:
      return <LeightonCycleDiagram compact={compact} />;
  }
};
