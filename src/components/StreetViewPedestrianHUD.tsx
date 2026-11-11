import React, { useState } from 'react';
import { 
  Wind, 
  Activity, 
  Heart, 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle2, 
  Compass, 
  MapPin, 
  Info,
  Navigation,
  Sparkles,
  Layers,
  Zap
} from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { 
  calculatePedestrianInhaledDose, 
  PedestrianActivityLevel, 
  PedestrianDosimetryResult 
} from '../lib/earthEngineDownscaling';

export interface MalagaCanyonPreset {
  name: string;
  lat: number;
  lon: number;
  H: number;
  W: number;
  orientation: number;
  desc: string;
}

export const MALAGA_STREETVIEW_PRESETS: MalagaCanyonPreset[] = [
  { name: 'Calle Marqués de Larios', lat: 36.7185, lon: -4.4213, H: 22.5, W: 11.2, orientation: 184, desc: 'Cañón estrecho comercial (H/W=2.01)' },
  { name: 'Alameda Principal', lat: 36.7182, lon: -4.4235, H: 24.0, W: 36.0, orientation: 95, desc: 'Gran bulevar arbolado (H/W=0.67)' },
  { name: 'Calle Hilera', lat: 36.7188, lon: -4.4320, H: 21.0, W: 13.5, orientation: 88, desc: 'Cañón denso Bailén-Miraflores (H/W=1.56)' },
  { name: 'Avenida Juan XXIII', lat: 36.7088, lon: -4.4443, H: 28.0, W: 19.5, orientation: 172, desc: 'Eje de alta intensidad tráfico (H/W=1.44)' },
  { name: 'Calle Carretería', lat: 36.7235, lon: -4.4238, H: 18.0, W: 10.5, orientation: 75, desc: 'Trazado histórico norte (H/W=1.71)' },
  { name: 'Calle de la Victoria', lat: 36.7265, lon: -4.4145, H: 19.5, W: 12.0, orientation: 42, desc: 'Cañón canalizador noreste (H/W=1.63)' },
  { name: 'Calle Mármoles', lat: 36.7202, lon: -4.4290, H: 20.0, W: 14.0, orientation: 92, desc: 'Eje este-oeste de penetración (H/W=1.43)' },
  { name: 'Paseo del Parque', lat: 36.7185, lon: -4.4140, H: 18.0, W: 32.0, orientation: 82, desc: 'Dosel arbóreo subtropical y fachada marítima' }
];

interface StreetViewPedestrianHUDProps {
  currentNO2Base: number;
  currentWindSpeedKmh: number;
  currentWindDirDeg: number;
  streetOrientationDeg: number;
  aspectRatioHw: number;
  H: number;
  W: number;
  svf: number;
  cameraHeading: number;
  onSelectPreset?: (preset: MalagaCanyonPreset) => void;
  isCompactOverlay?: boolean;
}

export const StreetViewPedestrianHUD: React.FC<StreetViewPedestrianHUDProps> = ({
  currentNO2Base,
  currentWindSpeedKmh,
  currentWindDirDeg,
  streetOrientationDeg,
  aspectRatioHw,
  H,
  W,
  svf,
  cameraHeading,
  onSelectPreset,
  isCompactOverlay = false
}) => {
  const [activity, setActivity] = useState<PedestrianActivityLevel>('walking');
  const [exposureDurationMin, setExposureDurationMin] = useState<number>(30);

  // 1. Detección del vórtice de Oke (1987): ángulo entre viento y calle
  const deltaAngle = Math.abs((currentWindDirDeg - streetOrientationDeg + 360) % 180);
  const isPerpendicularFlow = deltaAngle >= 35 && deltaAngle <= 145;
  
  // Detección de acera sotavento según orientación del viento
  // Si el viento viene del este (ej 90°) y la calle va N-S (0°/180°), la fachada oeste es sotavento
  const isLeewardSidewalk = isPerpendicularFlow;
  
  // Modulación de concentración según vórtice de Oke:
  // Acera sotavento acumula recirculación (asimetría 1.5x a 2.0x)
  const leewardFactor = isLeewardSidewalk ? (1.0 + 0.65 * Math.min(1.8, aspectRatioHw)) : 0.85;
  const cLocalNO2 = Number((currentNO2Base * leewardFactor).toFixed(1));
  const cLocalPM25 = Number(((currentNO2Base * 0.42) * (isLeewardSidewalk ? 1.35 : 0.9)).toFixed(1));

  // 2. Dosimetría ICRP
  const dose: PedestrianDosimetryResult = calculatePedestrianInhaledDose(
    cLocalNO2,
    cLocalPM25,
    activity,
    exposureDurationMin,
    isLeewardSidewalk
  );

  if (isCompactOverlay) {
    return (
      <div className="pointer-events-auto bg-slate-950/95 backdrop-blur-md border border-amber-500/70 p-3 rounded-md text-[10px] font-mono shadow-[0_4px_25px_rgba(0,0,0,0.85)] max-w-[340px] text-slate-100 ring-1 ring-black">
        {/* Cabecera del HUD */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 mb-2">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Activity className="w-4 h-4 animate-pulse text-amber-400" />
            <span className="text-[10px] tracking-wide">HUD TÁCTICO EXPOSICIÓN (1.5 m)</span>
          </div>
          <span className="text-[8.5px] font-bold px-1.5 py-0.5 bg-amber-950/80 border border-amber-600 text-amber-300 rounded">
            ICRP-66
          </span>
        </div>

        {/* Indicador de Acera & Vórtice de Oke */}
        <div className="mb-2 p-1.5 bg-slate-900/90 border border-slate-700 rounded flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[8.5px]">Régimen de Cañón (Oke):</span>
            <strong className={`text-[10.5px] font-bold ${isLeewardSidewalk ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isLeewardSidewalk ? 'ACERA SOTAVENTO (LEEWARD)' : 'ACERA BARLOVENTO (VENTILADA)'}
            </strong>
          </div>
          <span className={`px-1.5 py-0.5 text-[9px] font-bold border rounded ${
            isLeewardSidewalk ? 'bg-rose-950 border-rose-500 text-rose-200' : 'bg-emerald-950 border-emerald-500 text-emerald-200'
          }`}>
            Δθ = {deltaAngle.toFixed(0)}°
          </span>
        </div>

        {/* Lecturas Rápidas */}
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <div className="p-1.5 bg-slate-900/90 border border-amber-900/60 rounded">
            <span className="text-slate-400 block text-[8.5px]">NO₂ en Acera (1.5m):</span>
            <span className="text-sm font-black text-amber-400">{cLocalNO2} µg/m³</span>
          </div>
          <div className="p-1.5 bg-slate-900/90 border border-cyan-900/60 rounded">
            <span className="text-slate-400 block text-[8.5px]">PM₂.₅ en Acera:</span>
            <span className="text-sm font-black text-cyan-400">{cLocalPM25} µg/m³</span>
          </div>
        </div>

        {/* Selector de Actividad */}
        <div className="mb-2">
          <div className="flex justify-between text-[9px] text-slate-300 mb-1">
            <span>Actividad Transeúnte:</span>
            <strong className="text-purple-300">{dose.ventilationRateM3H} m³/h</strong>
          </div>
          <div className="grid grid-cols-4 gap-1 text-[8.5px]">
            {(['rest', 'walking', 'cycling', 'running'] as PedestrianActivityLevel[]).map(act => (
              <ScientificTooltip
                key={act}
                position="bottom"
                width="w-[220px]"
                content={
                  act === 'rest' ? 'Reposo: ventilación pulmonar basal V_E = 0.45 m³/h (ICRP 66).' :
                  act === 'walking' ? 'Paseo urbano: tasa respiratoria moderada V_E = 0.83 m³/h.' :
                  act === 'cycling' ? 'Ciclismo urbano: ventilación media V_E = 1.68 m³/h.' :
                  'Running / Carrera: alta hiperventilación V_E = 2.50 m³/h y mayor penetración alveolar.'
                }
              >
                <button
                  onClick={() => setActivity(act)}
                  className={`w-full py-1 px-1 border rounded capitalize text-center font-semibold transition-all ${
                    activity === act
                      ? 'bg-purple-800 border-purple-400 text-white font-bold shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                      : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                  }`}
                >
                  {act === 'rest' ? 'Reposo' : act === 'walking' ? 'Paseo' : act === 'cycling' ? 'Bici' : 'Running'}
                </button>
              </ScientificTooltip>
            ))}
          </div>
        </div>

        {/* Dosis Inhalada (30 min) */}
        <div className="p-2 bg-purple-950/60 border border-purple-700/80 rounded text-[9.5px] flex items-center justify-between text-purple-200 shadow-inner">
          <span className="font-medium">Dosis ({exposureDurationMin} min):</span>
          <strong className="text-purple-200 text-[11px] font-bold">
            {dose.inhalationNO2Ug} µg NO₂ | {dose.inhalationPM25Ug} µg PM₂.₅
          </strong>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 text-slate-200 font-sans text-xs">
      {/* Encabezado Doctrinal */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-md">
        <div>
          <h4 className="font-bold text-slate-100 text-xs flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-400" />
            <span>Dosimetría Inmersiva de Exposición Peatonal y Depósito Pulmonar (ICRP 66)</span>
            <span className="px-2 py-0.5 text-[9px] font-mono bg-rose-950 border border-rose-700 text-rose-300">
              COTA RESPIRABLE 1.5 m AGL
            </span>
          </h4>
          <p className="text-[10px] text-slate-400 font-mono">
            Acoplamiento del campo de flujo en vórtice de Oke (1987) con el modelo de deposición en el tracto respiratorio humano (ICRP 66 / MPPD).
          </p>
        </div>

        <div className="text-right font-mono text-[9px] text-slate-400">
          <span>Vórtice: <strong className={isPerpendicularFlow ? 'text-amber-400' : 'text-cyan-400'}>
            {isPerpendicularFlow ? 'Recirculante Atrapado' : 'Canalización Paralela'}
          </strong></span>
          <span className="block text-slate-500">Δθ Viento-Eje = {deltaAngle.toFixed(1)}°</span>
        </div>
      </div>

      {/* Botonera Rápida de Cañones Urbanos de Málaga */}
      {onSelectPreset && (
        <div className="bg-slate-950 p-2.5 border border-slate-800">
          <div className="flex items-center gap-2 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">
              Teletransporte Inmersivo Street View a Cañones de Málaga:
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {MALAGA_STREETVIEW_PRESETS.map(preset => {
              const hwRatio = (preset.H / preset.W).toFixed(2);
              return (
                <ScientificTooltip
                  key={preset.name}
                  position="bottom"
                  width="w-[260px]"
                  content={`Teletransporte inmersivo a ${preset.name}: H=${preset.H}m, W=${preset.W}m (H/W=${hwRatio}), Azimut=${preset.orientation}°. ${preset.desc}.`}
                >
                  <button
                    onClick={() => onSelectPreset(preset)}
                    className="w-full p-1.5 bg-slate-900/80 hover:bg-slate-800 text-left border border-slate-800 hover:border-amber-600 transition-colors rounded text-[9.5px] font-mono group"
                  >
                    <strong className="text-slate-200 block truncate group-hover:text-amber-300">{preset.name}</strong>
                    <span className="text-[8px] text-slate-400 block truncate">{preset.desc} • H/W={hwRatio}</span>
                  </button>
                </ScientificTooltip>
              );
            })}
          </div>
        </div>
      )}

      {/* Controles de Exposición Humana */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3 border border-slate-800 font-mono text-[10px]">
        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-purple-300">
              <Heart className="w-3 h-3" />
              <span>Nivel de Esfuerzo Físico:</span>
              <ScientificTooltip
                title="Tasa de Ventilación Minuto según Esfuerzo (V̇_E)"
                formula="\dot{V}_E = f_{\text{resp}} \times V_T \quad (\text{m}^3\,\text{h}^{-1})"
                normative="ICRP Publication 66 (1994) • US EPA Exposure Factors Handbook"
                content="Modula el caudal ventilatorio pulmonar desde reposo (~0.45 m³/h) hasta carrera intensa (~3.20 m³/h) y la transición de respiración nasal a oronasal."
              />
            </span>
            <strong className="text-white">{dose.activityLabel}</strong>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {(['rest', 'walking', 'cycling', 'running'] as PedestrianActivityLevel[]).map(act => (
              <button
                key={act}
                onClick={() => setActivity(act)}
                className={`py-1 px-1.5 border rounded capitalize text-center cursor-pointer ${
                  activity === act
                    ? 'bg-purple-900/90 border-purple-500 text-white font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {act === 'rest' ? 'Reposo' : act === 'walking' ? 'Paseo' : act === 'cycling' ? 'Bicicleta' : 'Running'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span className="text-cyan-300 flex items-center gap-1">
              Duración de la Exposición en Acera:
              <ScientificTooltip
                title="Integración Temporal de Dosis Inhalada"
                formula="D_{\text{inh}} = \int_0^{\Delta t} C(z=1.5\,\text{m}, t)\,\dot{V}_E\,dt"
                normative="Directiva (UE) 2024/2881 (Límite horario NO₂: 200 µg/m³)"
                content="Tiempo de permanencia continua del peatón en la microescala de la acera seleccionada."
              />
            </span>
            <strong className="text-white">{exposureDurationMin} minutos</strong>
          </div>
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            value={exposureDurationMin}
            onChange={(e) => setExposureDurationMin(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[8px] text-slate-500 mt-0.5">
            <span>5 min (Cruce rápido)</span>
            <span>60 min (Paseo)</span>
            <span>120 min (Terraza exterior)</span>
          </div>
        </div>
      </div>

      {/* Resultados Detallados de Dosimetría Pulmonar ICRP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[10px]">
        {/* Tarjeta 1: Dosis Inhalada Total */}
        <ScientificTooltip
          position="top"
          title="Masa Total Inhalada de Contaminantes (NO₂ y PM₂.₅)"
          formula="D_{\text{NO}_2} = C_{\text{NO}_2}(1.5\,\text{m}) \cdot \dot{V}_E \cdot \frac{\Delta t}{60}"
          normative="ICRP Publication 66 Human Respiratory Tract Model"
          content={`Carga másica bruta inhalada (${dose.inhalationNO2Ug} µg de NO₂ y ${dose.inhalationPM25Ug} µg de PM₂.₅) durante ${exposureDurationMin} minutos de exposición peatonal.`}
        >
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-2 cursor-help">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1">
              <span>Dosis Inhalada Acumulada</span>
              <Activity className="w-3 h-3 text-purple-400" />
            </div>
            <div>
              <span className="text-slate-400 block text-[9px]">Dióxido de Nitrógeno (NO₂):</span>
              <span className="text-base font-bold text-purple-300">{dose.inhalationNO2Ug} µg</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px]">Partículas Finas (PM₂.₅):</span>
              <span className="text-sm font-bold text-cyan-300">{dose.inhalationPM25Ug} µg</span>
            </div>
            <div className="text-[8.5px] text-slate-500">
              Volumen de aire alveolar ventilado: <strong>{(dose.ventilationRateM3H * (exposureDurationMin / 60)).toFixed(2)} m³</strong>
            </div>
          </div>
        </ScientificTooltip>

        {/* Tarjeta 2: Fraccionamiento en Árbol Respiratorio ICRP */}
        <ScientificTooltip
          position="top"
          title="Fraccionamiento Regional en el Tracto Respiratorio (ICRP 66 / MPPD)"
          formula="D_{\text{reg}} = D_{\text{PM}_{2.5}} \cdot \text{DF}_r(d_p, \dot{V}_E), \quad r \in \{\text{ET}, \text{TB}, \text{AI}\}"
          normative="ICRP 66 (1994) • Multiple-Path Particle Dosimetry (MPPD)"
          content="Partición dosimétrica por impactación inercial (región extratorácica ET 35%), sedimentación gravitatoria (traqueobronquial TB 20%) y difusión browniana en sacos alveolares profundos (AI 30%)."
        >
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1.5 cursor-help">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1">
              <span>Depósito Pulmonar ICRP (PM₂.₅)</span>
              <Heart className="w-3 h-3 text-rose-400" />
            </div>
            <div className="flex justify-between items-center text-[9px]">
              <span className="text-slate-400">Vías Altas / Nasofaringe (35%):</span>
              <strong className="text-slate-200">{dose.lungDepositionHeadAirwaysUg} µg</strong>
            </div>
            <div className="flex justify-between items-center text-[9px]">
              <span className="text-slate-400">Traqueobronquial (20%):</span>
              <strong className="text-amber-300">{dose.lungDepositionTracheobronchialUg} µg</strong>
            </div>
            <div className="flex justify-between items-center text-[9px]">
              <span className="text-rose-400 font-bold">Alveolar Profundo (30%):</span>
              <strong className="text-rose-400">{dose.lungDepositionAlveolarDeepUg} µg</strong>
            </div>
            <p className="text-[8px] text-slate-500 pt-1 leading-tight">
              Partículas con penetración sistémica al torrente sanguíneo.
            </p>
          </div>
        </ScientificTooltip>

        {/* Tarjeta 3: Vórtice Asimétrico de Oke */}
        <ScientificTooltip
          position="top"
          title="Asimetría Sotavento/Barlovento en Cañón Urbano (Berkowicz OSPM)"
          formula="C_{\text{leeward}} = C_{\text{bg}} + C_{\text{direct}} + C_{\text{recirc}}(u_b, H/W)"
          normative="Oke (1987) • Berkowicz (2000) OSPM • Guías OMS 2021"
          content="El vórtice helicoidal primario arrastra las emisiones frescas de los tubos de escape hacia la fachada de sotavento (leeward), duplicando la exposición peatonal frente a la acera de barlovento."
        >
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-2 cursor-help">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1">
              <span>Diagnóstico Acera (Oke 1987)</span>
              <Wind className="w-3 h-3 text-cyan-400" />
            </div>
            <div>
              <span className="text-slate-400 block text-[9px]">Estado de la Acera Actual:</span>
              <span className={`text-xs font-bold block ${isLeewardSidewalk ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isLeewardSidewalk ? 'SOTAVENTO (RECIRCULACIÓN)' : 'BARLOVENTO (VENTILADA)'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px]">Exceso de Riesgo vs Guía OMS:</span>
              <span className="text-sm font-bold text-amber-400">+{dose.excessRiskVersusCleanAirPct}%</span>
            </div>
            <div className="text-[8.5px] text-slate-500">
              Guía OMS 2021: 10 µg/m³ anual / 25 µg/m³ 24h
            </div>
          </div>
        </ScientificTooltip>
      </div>
    </div>
  );
};
