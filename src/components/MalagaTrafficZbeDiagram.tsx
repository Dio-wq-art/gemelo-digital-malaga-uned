import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Camera, Car, ShieldCheck, Zap, Activity, Layers, Radio, MapPin } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';

export interface MalagaTrafficZbeDiagramProps {
  totalDevices?: number;
  zbeCamerasCount?: number;
  inductionLoopsCount?: number;
  smartCrossingsCount?: number;
  avgTrafficReductionPct?: number;
}

export const MalagaTrafficZbeDiagram: React.FC<MalagaTrafficZbeDiagramProps> = ({
  totalDevices = 184,
  zbeCamerasCount = 56,
  inductionLoopsCount = 72,
  smartCrossingsCount = 38,
  avgTrafficReductionPct = 28.5
}) => {
  const width = 620;
  const height = 340;

  // Cordon ZBE Waypoints (Málaga Centro & Soho)
  const zbePolygon = "130,70 320,50 480,90 520,190 410,260 210,270 110,190";

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-xl p-3 space-y-3 font-sans shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-rose-500/10 border border-rose-500/30">
            <Camera className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              Cinturón Tecnológico ZBE &amp; Telemetría de Tráfico (Ayuntamiento de Málaga)
            </h4>
            <p className="text-[9.5px] text-slate-400">
              Cámaras OCR/ANPR • Espiras Inductivas en Calzada • Regulación EMEP/EEA COPERT 5
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ScientificTooltip topic="copert_speed_emissions"
            position="bottom"
            width="w-[300px]"
            content="Reducción estimada del flujo de vehículos sin distintivo ambiental en el perímetro ZBE de Málaga Centro conforme a la Ley 7/2021 de Cambio Climático."
          >
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-emerald-950/80 text-emerald-300 border-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Eficacia ZBE: -{avgTrafficReductionPct}% Emisiones
            </span>
          </ScientificTooltip>
        </div>
      </div>

      {/* Main SVG Vector Canvas */}
      <div className="relative w-full overflow-hidden bg-slate-900/70 rounded-lg border border-slate-800/60">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          id="malaga-zbe-traffic-svg"
        >
          <defs>
            {/* ZBE Area Gradient */}
            <radialGradient id="zbeZoneGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#f43f5e" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </radialGradient>

            {/* ANPR Laser Scanner Gradient */}
            <linearGradient id="anprLaser" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
            </linearGradient>

            <filter id="zbeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Grid */}
          <rect x="0" y="0" width={width} height={height} fill="#020617" />
          
          {/* Spatial Grid Lines */}
          {[60, 120, 180, 240, 300].map((y) => (
            <line key={`gy-${y}`} x1="30" y1={y} x2="590" y2={y} stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
          ))}
          {[100, 200, 300, 400, 500].map((x) => (
            <line key={`gx-${x}`} x1={x} y1="30" x2={x} y2="310" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
          ))}

          {/* Guadalmedina River (Blue vertical spine) */}
          <path
            d="M 230 30 Q 240 120 225 200 Q 215 260 210 320"
            fill="none"
            stroke="#0284c7"
            strokeWidth="8"
            opacity="0.35"
          />
          <text x="215" y="45" fill="#38bdf8" fontSize="7.5" fontWeight="bold" transform="rotate(-75, 215, 45)">
            Río Guadalmedina
          </text>

          {/* Sea / Port of Málaga (Bottom-right) */}
          <path
            d="M 360 280 Q 450 250 590 270 L 590 330 L 360 330 Z"
            fill="#0369a1"
            opacity="0.25"
          />
          <text x="510" y="305" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle">
            Puerto de Málaga (Dársena de Guadiaro)
          </text>

          {/* 1. ZBE Protected Area Polygon */}
          <polygon
            points={zbePolygon}
            fill="url(#zbeZoneGrad)"
            stroke="#f43f5e"
            strokeWidth="1.8"
            strokeDasharray="6 3"
            filter="url(#zbeGlow)"
          />

          {/* ZBE Watermark Label */}
          <g transform="translate(320, 150)">
            <rect x="-65" y="-12" width="130" height="24" rx="4" fill="#1e1b4b" stroke="#f43f5e" strokeWidth="1" />
            <text x="0" y="4" fill="#fda4af" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              ZONA BAJAS EMISIONES
            </text>
          </g>

          {/* 2. Main Street Axes of Málaga */}
          {/* Alameda Principal */}
          <line x1="180" y1="185" x2="330" y2="185" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
          <text x="250" y="178" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle">
            Alameda Principal
          </text>

          {/* Paseo del Parque */}
          <line x1="330" y1="185" x2="490" y2="165" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
          <text x="410" y="160" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle">
            Paseo del Parque
          </text>

          {/* Calle Carretería (Northern boundary) */}
          <path d="M 230 110 Q 320 85 410 110" fill="none" stroke="#475569" strokeWidth="3" />
          <text x="320" y="96" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle">
            Calle Carretería / Álamos
          </text>

          {/* Muelle Heredia / Avda. Manuel Agustín Heredia */}
          <line x1="210" y1="225" x2="380" y2="225" stroke="#475569" strokeWidth="3.5" />
          <text x="290" y="238" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle">
            Avda. Manuel Agustín Heredia (Soho)
          </text>

          {/* 3. Sensor Deployment Icons & Optical Beams */}
          {/* Camera Access Points on Cordon */}
          {[
            { x: 130, y: 70, label: 'Acceso Puente Aurora' },
            { x: 320, y: 50, label: 'Acceso Capuchinos' },
            { x: 480, y: 90, label: 'Acceso Plaza de la Merced' },
            { x: 520, y: 190, label: 'Acceso Plaza General Torrijos' },
            { x: 410, y: 260, label: 'Acceso Plaza de la Marina' },
            { x: 210, y: 270, label: 'Acceso Alameda de Colón' },
            { x: 110, y: 190, label: 'Acceso Puente de Tetuán' }
          ].map((pt, i) => (
            <g key={i}>
              {/* Scan Beam Polygon */}
              <polygon
                points={`${pt.x},${pt.y} ${pt.x - 18},${pt.y + 35} ${pt.x + 18},${pt.y + 35}`}
                fill="url(#anprLaser)"
                opacity="0.35"
              />
              {/* Camera Pole Node */}
              <circle cx={pt.x} cy={pt.y} r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx={pt.x} cy={pt.y} r="9" fill="#f43f5e" opacity="0.25" />
            </g>
          ))}

          {/* 4. Induction Loops & Smart Crossings */}
          {/* Induction Loop Markers (Puntos de Aforo) */}
          {[
            { x: 270, y: 185 },
            { x: 370, y: 175 },
            { x: 280, y: 225 },
            { x: 330, y: 95 }
          ].map((loop, idx) => (
            <g key={`loop-${idx}`}>
              <rect x={loop.x - 6} y={loop.y - 4} width="12" height="8" rx="2" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
              <text x={loop.x} y={loop.y - 7} fill="#fbbf24" fontSize="6" fontWeight="bold" textAnchor="middle">
                AFORO
              </text>
            </g>
          ))}

          {/* Smart Pedestrian Crossings (LED) */}
          {[
            { x: 220, y: 185 },
            { x: 325, y: 185 },
            { x: 440, y: 170 }
          ].map((led, idx) => (
            <g key={`led-${idx}`}>
              <line x1={led.x} y1={led.y - 6} x2={led.x} y2={led.y + 6} stroke="#38bdf8" strokeWidth="3" strokeDasharray="2 2" />
              <circle cx={led.x} cy={led.y} r="2" fill="#38bdf8" />
            </g>
          ))}

          {/* 5. Fleet Badge Distribution Bar (Side Card) */}
          <g transform="translate(420, 20)">
            <rect width="180" height="95" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" opacity="0.95" />
            <text x="10" y="16" fill="#f8fafc" fontSize="8" fontWeight="bold">
              Composición de Parque Móvil ZBE:
            </text>

            {/* DGT Badges */}
            <g transform="translate(10, 25)">
              <rect x="0" y="0" width="30" height="12" rx="2" fill="#059669" />
              <text x="15" y="9" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle">CERO</text>
              <text x="36" y="9" fill="#94a3b8" fontSize="7" fontFamily="monospace">8.5%</text>

              <rect x="75" y="0" width="30" height="12" rx="2" fill="#0284c7" />
              <text x="90" y="9" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle">ECO</text>
              <text x="111" y="9" fill="#94a3b8" fontSize="7" fontFamily="monospace">24.0%</text>
            </g>

            <g transform="translate(10, 42)">
              <rect x="0" y="0" width="30" height="12" rx="2" fill="#0284c7" />
              <text x="15" y="9" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle">C</text>
              <text x="36" y="9" fill="#94a3b8" fontSize="7" fontFamily="monospace">41.2%</text>

              <rect x="75" y="0" width="30" height="12" rx="2" fill="#d97706" />
              <text x="90" y="9" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle">B</text>
              <text x="111" y="9" fill="#94a3b8" fontSize="7" fontFamily="monospace">21.8%</text>
            </g>

            <g transform="translate(10, 59)">
              <rect x="0" y="0" width="45" height="12" rx="2" fill="#dc2626" />
              <text x="22.5" y="9" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle">SIN DIST.</text>
              <text x="52" y="9" fill="#f87171" fontSize="7" fontWeight="bold" fontFamily="monospace">4.5% (Restringido)</text>
            </g>

            <text x="10" y="85" fill="#38bdf8" fontSize="6.5" fontFamily="monospace">
              Factor Emisión COPERT 5: -{avgTrafficReductionPct}% NOx
            </text>
          </g>
        </svg>
      </div>

      {/* Numerical Synthesis Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9.5px] font-mono bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
        <ScientificTooltip
          position="top"
          title="Puntos de Control Automático de Matrículas (ANPR / OCR)"
          formula="E_{\text{ZBE}} = \sum_{k} N_k \cdot (1 - \eta_{\text{restricción},k}) \cdot EF_{k,\text{COPERT 5}}"
          explanation="Fiscalización óptica infrarroja del distintivo ambiental DGT (CERO, ECO, C, B, Sin Distintivo) en el perímetro de 437 hectáreas de la ZBE de Málaga."
          normativeRef="Ley 7/2021 de Cambio Climático / RD 1052/2022 ZBE"
        >
          <div className="cursor-help">
            <span className="text-slate-400 block">Cámaras ANPR OCR:</span>
            <span className="text-rose-400 font-bold text-xs">{zbeCamerasCount} en Círculo ZBE</span>
          </div>
        </ScientificTooltip>

        <ScientificTooltip
          position="top"
          title="Espiras Electromagnéticas Inductivas de Aforo (IMD)"
          formula="\frac{\Delta L}{L_0} \propto \mu_r \implies q_{\text{veh/h}}, \, v_{\text{km/h}}, \, \%_{\text{HDV}}"
          explanation="Detectores enterrados en calzada que miden intensidad horaria, ocupación y longitud metálica del vehículo para discriminar ligeros (LDV) de pesados (HDV)."
          normativeRef="Centro de Gestión de Tráfico (Movilidad Ayto. Málaga)"
        >
          <div className="cursor-help">
            <span className="text-slate-400 block">Espiras Inductivas:</span>
            <span className="text-amber-400 font-bold text-xs">{inductionLoopsCount} Nudos de Aforo</span>
          </div>
        </ScientificTooltip>

        <ScientificTooltip
          position="top"
          title="Pasos de Peatones Sensorizados con Balizamiento LED"
          formula="v_{\text{crucero}} \rightarrow v_{\text{calmado}} \implies \Delta EF_{\text{frenos/neumáticos}}"
          explanation="Infraestructura de calmado de tráfico y seguridad vial peatonal integrada en la red de telemetría inteligente."
          normativeRef="Plan de Movilidad Urbana Sostenible (PMUS Málaga)"
        >
          <div className="cursor-help">
            <span className="text-slate-400 block">Pasos Inteligentes:</span>
            <span className="text-cyan-400 font-bold text-xs">{smartCrossingsCount} con Óptica LED</span>
          </div>
        </ScientificTooltip>

        <ScientificTooltip
          position="top"
          title="Inventario Consolidado de Sensores Viales Georreferenciados"
          formula={`N_{\\text{vial}} = ${zbeCamerasCount} + ${inductionLoopsCount} + ${smartCrossingsCount} = ${totalDevices}`}
          explanation="Total de nodos de monitorización de tráfico rodado asimilados para el cálculo mecánico de emisiones lineales COPERT 5 / EMEP/EEA."
          normativeRef="Guía EMEP/EEA 2023 (1.A.3.b.i-iv Road Transport)"
        >
          <div className="cursor-help">
            <span className="text-slate-400 block">Total Dispositivos:</span>
            <span className="text-emerald-400 font-bold text-xs">{totalDevices} Sensores Viales</span>
          </div>
        </ScientificTooltip>
      </div>
    </div>
  );
};
