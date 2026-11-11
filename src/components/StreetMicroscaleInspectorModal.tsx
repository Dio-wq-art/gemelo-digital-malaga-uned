import React, { useState } from 'react';
import { 
  Compass, 
  Wind, 
  Sun, 
  Car, 
  Activity, 
  ShieldCheck, 
  Layers, 
  Download, 
  FileText, 
  Info, 
  MapPin, 
  ArrowRight,
  Eye,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Cpu,
  FlaskConical,
  Atom,
  Waves
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { MathFormula } from './MathFormula';
import { MeteoData, PhysicsResult, StationComparisonResult } from '../lib/physics';
import { EnkfAssimilationResult } from '../lib/enkfAssimilation';
import { MALAGA_STREET_CANYONS_GEOMETRY, StreetCanyonGeometryProfile } from '../lib/canyonGeometryOsm';
import { auditStreetMicroscale, StreetMicroscaleAuditResult } from '../lib/streetMicroscaleInspector';

export interface StreetMicroscaleInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  meteo: MeteoData;
  physics: PhysicsResult;
  enkf?: EnkfAssimilationResult;
  stationComparisons?: StationComparisonResult[];
  onFlyToLocation?: (lat: number, lon: number, name?: string) => void;
}

export function StreetMicroscaleInspectorModal({
  isOpen,
  onClose,
  meteo,
  physics,
  enkf,
  stationComparisons = [],
  onFlyToLocation
}: StreetMicroscaleInspectorModalProps) {
  const [selectedStreetId, setSelectedStreetId] = useState<string>(MALAGA_STREET_CANYONS_GEOMETRY[0].streetId);
  const [activeSubTab, setActiveSubTab] = useState<'audit_card' | 'canyon_cross_section' | 'latex_derivation'>('audit_card');

  if (!isOpen) return null;

  const currentStreetProfile = MALAGA_STREET_CANYONS_GEOMETRY.find(s => s.streetId === selectedStreetId) || MALAGA_STREET_CANYONS_GEOMETRY[0];
  const audit: StreetMicroscaleAuditResult = auditStreetMicroscale(
    currentStreetProfile,
    meteo,
    physics,
    enkf,
    stationComparisons
  );

  const handleExportCsv = () => {
    const csvContent = `Parámetro,Valor,Unidad,Fundamento_Científico
Calle,"${audit.streetName} (${audit.district})",-,OpenStreetMap (OSM)
Altura Media Edificios (H),${audit.morphology.buildingHeightM},m,Criterio CEN/TR 17536
Ancho de Calle (W),${audit.morphology.streetWidthM},m,OpenStreetMap (OSM)
Relación de Aspecto (H/W),${audit.morphology.aspectRatioHW},-,Oke (1987)
Factor de Visión de Cielo (SVF),${audit.morphology.skyViewFactorSVF},adimensional,SVF = cos(arctan(2H/W))
Régimen de Flujo Oke,"${audit.morphology.okeRegimeLabel}",-,Grimmond & Oke (1999)
Atenuación Fotólisis j(NO2),${audit.morphology.jAttenuationPct},%,Radiative Transfer en Cañón Urbano
Vehículos Estimados Horarios,${audit.traffic.estimatedHourlyVehicles},veh/h,Aforo Real / EMT Málaga
Emisión Lineal NOx (q),${audit.traffic.linearEmissionNOxUgmS},µg/(m·s),Guía EMEP/EEA COPERT 5
Emisión Lineal PM2.5 (q),${audit.traffic.linearEmissionPM25UgmS},µg/(m·s),Guía EMEP/EEA COPERT 5
Renovaciones Aire Horarias (ACH),${audit.aerodynamics.airChangesPerHourACH},h⁻¹,Yamartino & Wiegand (1986)
Tiempo Residencia Aire (tau),${audit.aerodynamics.airResidenceTimeSec},s,H / sigma_w
NO2 Medio en Cañón,${audit.sidewalkConcentrations.canyonAverageNO2Ugm3},µg/m³,PINN + Leighton
NO2 Acera Sotavento (Leeward),${audit.sidewalkConcentrations.leewardSidewalkNO2Ugm3},µg/m³,Vórtice Asimétrico de Oke
NO2 Acera Barlovento (Windward),${audit.sidewalkConcentrations.windwardSidewalkNO2Ugm3},µg/m³,Vórtice Asimétrico de Oke
Ratio Asimetría Sotavento/Barlovento,${audit.sidewalkConcentrations.leewardToWindwardRatio},-,1 + 1.65 (H/W) sin(theta)
O3 Residual Intramuro,${audit.photochemistry.residualO3Ugm3},µg/m³,Titulación NO + O3 -> NO2
SO2 Dióxido Azufre,${audit.chemicalSpeciation.so2Ugm3},µg/m³,Directiva 2008/50/CE
Benceno C6H6,${audit.chemicalSpeciation.benzeneUgm3},µg/m³,Límite Anual UE 5.0 µg/m³
Monóxido de Carbono CO,${audit.chemicalSpeciation.coMgM3},mg/m³,Límite 8h UE 10 mg/m³
Cloruro de Nitrilo ClNO2,${audit.chemicalSpeciation.clno2Pptv},pptv,Química Halógena Marina Alborán
Radical Hidroxilo [OH],${audit.chemicalSpeciation.ohRadicalMolecCm3},molec/cm³,Fotólisis O3 + H2O
Aerosol Inorgánico Secundario (SIA),${audit.chemicalSpeciation.siaSecondaryInorganicUgm3},µg/m³,NO3- + SO4= + NH4+
Polvo Sahariano Mineral,${audit.chemicalSpeciation.saharanDustUgm3},µg/m³,Aporte Natural Africano
Spray Salino Marino NaCl,${audit.chemicalSpeciation.marineAerosolNaClUgm3},µg/m³,Brisa Marina de Bahía
Estación Oficial Ancla,"${audit.enkfCorrection.nearestOfficialStation}",-,Red Oficial Junta de Andalucía
Distancia a Estación,${audit.enkfCorrection.distanceToStationM},m,Geodesia Euclídea
Ganancia de Kalman (K),${audit.enkfCorrection.kalmanGainWeightK},adimensional,Filtro EnKF Covarianza Gaspari-Cohn
Innovación EnKF Aplicada,${audit.enkfCorrection.enkfInnovationDeltaUgm3},µg/m³,K * Delta_estacion
Concentración Final Asimilada NO2,${audit.enkfCorrection.finalAssimilatedNO2Ugm3},µg/m³,Gemelo Digital Málaga
Incertidumbre Expandida U95,${audit.enkfCorrection.uncertainty95ExpandedUgm3},µg/m³,Guía ISO/GUM (k=2)
`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_calle_${audit.streetId}_${audit.streetName.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportLatex = () => {
    const latexText = `% --- DEDUCCIÓN DETERMINISTA MICROESCALAR PARA CALLE NO MONITORIZADA ---
\\subsection{Auditoría Física y Química: ${audit.streetName} (${audit.district})}
\\textbf{Coordenadas:} (${audit.coordinates.lat}, ${audit.coordinates.lon}) \\\\
\\textbf{Morfología del Cañón:} $H = ${audit.morphology.buildingHeightM}\\,\\text{m}$, $W = ${audit.morphology.streetWidthM}\\,\\text{m}$, relación de aspecto $H/W = ${audit.morphology.aspectRatioHW}$, $\\text{SVF} = ${audit.morphology.skyViewFactorSVF}$. \\\\
\\textbf{Régimen de Oke (1987):} ${audit.morphology.okeRegimeLabel} (${audit.morphology.okeRegime}). \\\\

\\subsubsection*{1. Balance de Masa y Cinética Intramuro}
La concentración a nivel de acera en ausencia de detector físico se deriva deterministamente como:
\\begin{equation}
  C_{\\text{NO}_2}(\\mathbf{x}) = C_{\\text{fondo}} + \\Delta C_{\\text{tráfico}} + R_{\\text{química}} + K_{\\text{EnKF}} \\cdot (y_{\\text{obs}} - H x_b)
\\end{equation}

Desglose de términos calculados:
\\begin{itemize}
  \\item \\textbf{Fondo Regional:} $C_{\\text{fondo}} = ${audit.enkfCorrection.backgroundRegionalNO2Ugm3}\\,\\mu\\text{g/m}^3$.
  \\item \\textbf{Emisión Vehicular COPERT 5:} $q_{\\text{NO}_x} = ${audit.traffic.linearEmissionNOxUgmS}\\,\\mu\\text{g/(m}\\cdot\\text{s)}$ (${audit.traffic.estimatedHourlyVehicles}\\,\\text{veh/h}, ${audit.traffic.heavyVehicleSharePct}\\%\\,\\text{pesados}$).
  \\item \\textbf{Ventilación Turbulenta:} $ACH = ${audit.aerodynamics.airChangesPerHourACH}\\,\\text{h}^{-1}$, tiempo de residencia $\\tau = ${audit.aerodynamics.airResidenceTimeSec}\\,\\text{s}$.
  \\item \\textbf{Atenuación Solar por SVF:} Fotólisis en fondo $j_{\\text{NO}_2} = ${audit.morphology.canyonShadedJNO2}\\,\\text{s}^{-1}$ (atenuación del ${audit.morphology.jAttenuationPct}\\% por sombreado).
  \\item \\textbf{Asimetría de Aceras (Vórtice de Oke):} Acera Sotavento $C_{\\text{lee}} = ${audit.sidewalkConcentrations.leewardSidewalkNO2Ugm3}\\,\\mu\\text{g/m}^3$, Acera Barlovento $C_{\\text{wind}} = ${audit.sidewalkConcentrations.windwardSidewalkNO2Ugm3}\\,\\mu\\text{g/m}^3$ (Ratio = ${audit.sidewalkConcentrations.leewardToWindwardRatio}).
  \\item \\textbf{Asimilación EnKF:} Estación ancla \\textbf{${audit.enkfCorrection.nearestOfficialStation}} a $d = ${audit.enkfCorrection.distanceToStationM}\\,\\text{m}$, ganancia $K = ${audit.enkfCorrection.kalmanGainWeightK}$, innovación $\\Delta = ${audit.enkfCorrection.enkfInnovationDeltaUgm3}\\,\\mu\\text{g/m}^3$.
\\end{itemize}

\\textbf{Concentración Final Estimada:} $C_{\\text{final}} = ${audit.enkfCorrection.finalAssimilatedNO2Ugm3} \\pm ${audit.enkfCorrection.uncertainty95ExpandedUgm3}\\,\\mu\\text{g/m}^3$ ($k=2$, $95\\%$ confianza GUM).
`;
    const blob = new Blob([latexText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deduccion_calle_${audit.streetId}.tex`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="INSPECTOR FÍSICO DE CALLES NO MONITORIZADAS (Deterministic Microscale & SVF Audit)"
      onClose={onClose}
      className="w-[980px] max-h-[92vh]"
      icon={<Compass className="w-4 h-4 text-sky-400" />}
    >
      <div className="p-4 space-y-3.5 text-xs font-mono text-slate-200">
        
        {/* Top Header Bar: Street Selector & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded">
          <div className="flex items-center gap-2 flex-1 min-w-[320px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Calle a Inspeccionar:
            </span>
            <ScientificTooltip position="bottom" width="w-[280px]" content="Catálogo microescalar de cañones urbanos de Málaga (OSM Topología): altura media de edificios (H), anchura de calzada (W), orientación azimutal y ratio de aspecto H/W (Oke 1987).">
              <select
                value={selectedStreetId}
                onChange={(e) => setSelectedStreetId(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 text-slate-100 rounded text-xs font-bold focus:outline-none focus:border-sky-500 w-full"
              >
                {MALAGA_STREET_CANYONS_GEOMETRY.map((st) => (
                  <option key={st.streetId} value={st.streetId}>
                    {st.streetName} — {st.district} (H/W = {st.aspectRatioHW})
                  </option>
                ))}
              </select>
            </ScientificTooltip>
            {onFlyToLocation && (
              <ScientificTooltip position="bottom" width="w-[260px]" content="Mueve la cámara y el centro de asimilación del Gemelo Digital a las coordenadas de esta calle, disparando la ingesta de telemetría y morfología OSM en tiempo real.">
                <button
                  type="button"
                  onClick={() => onFlyToLocation(currentStreetProfile.lat, currentStreetProfile.lon, currentStreetProfile.streetName)}
                  className="px-2 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 transition-colors"
                >
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>Volar y Asimilar</span>
                </button>
              </ScientificTooltip>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800">
              <ScientificTooltip position="bottom" width="w-[280px]" content="Auditoría secuencial en 7 pasos físicos: morfología OSM, SVF, ventilación u_can, aforos COPERT, fotólisis J(NO2), atenuación vegetal y balance final de concentraciones.">
                <button
                  onClick={() => setActiveSubTab('audit_card')}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                    activeSubTab === 'audit_card' ? 'bg-sky-950 text-sky-300 border border-sky-600' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Auditoría en 7 Pasos
                </button>
              </ScientificTooltip>
              <ScientificTooltip position="bottom" width="w-[280px]" content="Corte transversal esquemático 2D del cañón urbano: vórtice de recirculación, régimen de Oke (1987), gradientes barlovento/sotavento e interacción de copas arbóreas.">
                <button
                  onClick={() => setActiveSubTab('canyon_cross_section')}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                    activeSubTab === 'canyon_cross_section' ? 'bg-sky-950 text-sky-300 border border-sky-600' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Corte Transversal 2D
                </button>
              </ScientificTooltip>
              <ScientificTooltip position="bottom" width="w-[280px]" content="Formulaciones analíticas rigurosas en LaTeX: ecuaciones de Hotchkiss & Harlow, modelo OSPM de Berkowicz, factor de vista celeste SVF y balance de Leighton.">
                <button
                  onClick={() => setActiveSubTab('latex_derivation')}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                    activeSubTab === 'latex_derivation' ? 'bg-sky-950 text-sky-300 border border-sky-600' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Ecuaciones LaTeX
                </button>
              </ScientificTooltip>
            </div>

            <ScientificTooltip position="bottom" width="w-[240px]" content="Exporta los parámetros microescalares y el desglose físico de la calle en CSV estructurado.">
              <button
                onClick={handleExportCsv}
                className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[240px]" content="Exporta la deducción analítica formal en código LaTeX para la memoria de tesis.">
              <button
                onClick={handleExportLatex}
                className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-purple-400" />
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Global Summary Badge of the Selected Street */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-100">{audit.streetName}</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">
                {audit.district}
              </span>
              <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-700 text-[10px] font-bold">
                {audit.morphology.okeRegimeLabel}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 max-w-3xl leading-relaxed">
              {audit.scientificExplanation}
            </p>
          </div>

          <div className="p-2.5 bg-slate-900 border border-slate-700 rounded text-right flex-shrink-0">
            <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">NO₂ Estimado Asimilado</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">
              {audit.enkfCorrection.finalAssimilatedNO2Ugm3} <span className="text-xs text-slate-400 font-normal">µg/m³</span>
            </div>
            <div className="text-[9px] text-slate-400">
              ± {audit.enkfCorrection.uncertainty95ExpandedUgm3} µg/m³ (U₉₅, k=2)
            </div>
          </div>
        </div>

        {/* TAB 1: 6-STEP DETERMINISTIC AUDIT CARDS */}
        {activeSubTab === 'audit_card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            
            {/* Step 1: Geometry & Sky View Factor */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[10.5px] font-bold text-amber-300 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  1. Geometría OSM &amp; SVF
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                  H/W = {audit.morphology.aspectRatioHW}
                </span>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between text-slate-400">
                  <span>Altura Edificios (H):</span>
                  <span className="font-bold text-slate-200">{audit.morphology.buildingHeightM} m</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Ancho Calle (W):</span>
                  <span className="font-bold text-slate-200">{audit.morphology.streetWidthM} m</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Factor Visión Cielo (SVF):</span>
                  <span className="font-bold text-amber-300">{audit.morphology.skyViewFactorSVF}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Atenuación Fotólisis j(NO₂):</span>
                  <span className="font-bold text-red-400">-{audit.morphology.jAttenuationPct}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>j(NO₂) en fondo cañón:</span>
                  <span className="font-bold text-sky-300">{audit.morphology.canyonShadedJNO2} s⁻¹</span>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 italic mt-1">
                El sombreado reduce la descomposición de NO₂ favoreciendo su acumulación en el fondo.
              </p>
            </div>

            {/* Step 2: Traffic Emission COPERT 5 */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[10.5px] font-bold text-emerald-300 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-emerald-400" />
                  2. Emisiones COPERT 5
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                  {audit.traffic.roadCategory.replace('_', ' ')}
                </span>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between text-slate-400">
                  <span>Flujo Estimado:</span>
                  <span className="font-bold text-slate-200">{audit.traffic.estimatedHourlyVehicles} veh/h</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Cuota Vehículos Pesados:</span>
                  <span className="font-bold text-slate-200">{audit.traffic.heavyVehicleSharePct}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Emisión Lineal q(NOx):</span>
                  <span className="font-bold text-emerald-300">{audit.traffic.linearEmissionNOxUgmS} µg/(m·s)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Emisión Lineal q(PM2.5):</span>
                  <span className="font-bold text-emerald-300">{audit.traffic.linearEmissionPM25UgmS} µg/(m·s)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Fracción Primaria f(NO₂):</span>
                  <span className="font-bold text-slate-200">{audit.traffic.primaryNO2FractionPct}%</span>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 italic mt-1">
                Tasa lineal q según factores de emisión de la Guía EMEP/EEA 1.A.3.b.
              </p>
            </div>

            {/* Step 3: Aerodynamics & Ventilation */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[10.5px] font-bold text-sky-300 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-sky-400" />
                  3. Fluidodinámica &amp; Oke
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                  {audit.aerodynamics.ventilationClass}
                </span>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between text-slate-400">
                  <span>Viento Perpendicular u⊥:</span>
                  <span className="font-bold text-slate-200">{audit.aerodynamics.uPerpMs} m/s</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Velocidad del Vórtice:</span>
                  <span className="font-bold text-slate-200">{audit.aerodynamics.vortexSpeedMs} m/s</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tiempo Residencia τ:</span>
                  <span className="font-bold text-amber-300">{audit.aerodynamics.airResidenceTimeSec} s</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Renovaciones Aire (ACH):</span>
                  <span className="font-bold text-sky-300">{audit.aerodynamics.airChangesPerHourACH} h⁻¹</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Ángulo de Ataque:</span>
                  <span className="font-bold text-slate-200">{audit.aerodynamics.angleToStreetDeg}°</span>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 italic mt-1">
                Intercambio turbulento en la cota de cornisa según Yamartino &amp; Wiegand.
              </p>
            </div>

            {/* Step 4: Sidewalk Asymmetry (Leeward vs Windward) */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[10.5px] font-bold text-purple-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  4. Asimetría de Aceras
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  Ratio: {audit.sidewalkConcentrations.leewardToWindwardRatio}x
                </span>
              </div>
              <div className="space-y-1.5 text-[10px]">
                <div className="p-1.5 bg-red-950/40 border border-red-800/60 rounded flex justify-between items-center">
                  <div>
                    <div className="font-bold text-red-300">Acera Sotavento (Leeward)</div>
                    <div className="text-[8.5px] text-slate-400">Riesgo: {audit.sidewalkConcentrations.leewardExposureRisk}</div>
                  </div>
                  <div className="text-right font-black text-red-400 text-xs">
                    {audit.sidewalkConcentrations.leewardSidewalkNO2Ugm3} µg/m³
                  </div>
                </div>

                <div className="p-1.5 bg-emerald-950/40 border border-emerald-800/60 rounded flex justify-between items-center">
                  <div>
                    <div className="font-bold text-emerald-300">Acera Barlovento (Windward)</div>
                    <div className="text-[8.5px] text-slate-400">Zona de limpieza relativa</div>
                  </div>
                  <div className="text-right font-black text-emerald-400 text-xs">
                    {audit.sidewalkConcentrations.windwardSidewalkNO2Ugm3} µg/m³
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 italic mt-1">
                El vórtice arrastra las emisiones hacia la fachada de sotavento.
              </p>
            </div>

            {/* Step 5: Leighton Photochemistry */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[10.5px] font-bold text-cyan-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  5. Ciclo de Leighton
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                  Φ = {audit.photochemistry.leightonRatioPhi}
                </span>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between text-slate-400">
                  <span>O₃ Fondo Regional:</span>
                  <span className="font-bold text-slate-200">{audit.photochemistry.backgroundO3Ugm3} µg/m³</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>O₃ Titulado por NO:</span>
                  <span className="font-bold text-cyan-300">{audit.photochemistry.titratedO3Ugm3} µg/m³</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>O₃ Residual en Acera:</span>
                  <span className="font-bold text-slate-200">{audit.photochemistry.residualO3Ugm3} µg/m³</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Régimen Fotoquímico:</span>
                  <span className="font-bold text-purple-300">{audit.photochemistry.photochemicalRegime}</span>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 italic mt-1">
                Titulación rápida NO + O₃ → NO₂ catalizada por el tráfico denso.
              </p>
            </div>

            {/* Step 6: EnKF Spatial Correction */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[10.5px] font-bold text-emerald-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  6. Asimilación EnKF
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  K = {audit.enkfCorrection.kalmanGainWeightK}
                </span>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between text-slate-400">
                  <span>Estación Ancla Más Próxima:</span>
                  <span className="font-bold text-emerald-300">{audit.enkfCorrection.nearestOfficialStation}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Distancia a la Estación:</span>
                  <span className="font-bold text-slate-200">{audit.enkfCorrection.distanceToStationM} m</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Innovación Transmitida:</span>
                  <span className="font-bold text-emerald-400">
                    {audit.enkfCorrection.enkfInnovationDeltaUgm3 > 0 ? '+' : ''}{audit.enkfCorrection.enkfInnovationDeltaUgm3} µg/m³
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Incertidumbre U₉₅ (k=2):</span>
                  <span className="font-bold text-slate-200">± {audit.enkfCorrection.uncertainty95ExpandedUgm3} µg/m³</span>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 italic mt-1">
                La estación oficial propaga deterministamente su corrección por covarianza espacial.
              </p>
            </div>

            {/* Step 7: Chemical Speciation & Atmospheric Tracers */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2 md:col-span-2 lg:col-span-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[10.5px] font-bold text-amber-300 flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                  7. Especiación Química Avanzada &amp; Trazadores Atmosféricos (Directiva 2008/50/CE)
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800/60 text-amber-300 font-bold">
                  8 Especies Modelizadas
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                {/* SO2 */}
                <div className="p-2 bg-slate-900 border border-slate-800 rounded space-y-0.5">
                  <div className="text-slate-400 text-[9px] flex justify-between">
                    <span>SO₂ (Dióxido Azufre)</span>
                    <span className="text-slate-500">UE: 350µg</span>
                  </div>
                  <div className="text-base font-bold text-slate-100">{audit.chemicalSpeciation?.so2Ugm3 ?? 5.2} <span className="text-[9px] text-slate-400 font-normal">µg/m³</span></div>
                  <div className="text-[8.5px] text-slate-500 truncate">Trazador portuario/industrial</div>
                </div>

                {/* Benceno C6H6 */}
                <div className="p-2 bg-slate-900 border border-slate-800 rounded space-y-0.5">
                  <div className="text-slate-400 text-[9px] flex justify-between">
                    <span>Benceno (C₆H₆)</span>
                    <span className="text-amber-400">UE: 5.0µg</span>
                  </div>
                  <div className="text-base font-bold text-amber-300">{audit.chemicalSpeciation?.benzeneUgm3 ?? 0.85} <span className="text-[9px] text-slate-400 font-normal">µg/m³</span></div>
                  <div className="text-[8.5px] text-slate-500 truncate">Evaporación/combustión COPERT</div>
                </div>

                {/* CO */}
                <div className="p-2 bg-slate-900 border border-slate-800 rounded space-y-0.5">
                  <div className="text-slate-400 text-[9px] flex justify-between">
                    <span>CO (Monóxido Carbono)</span>
                    <span className="text-slate-500">UE: 10mg</span>
                  </div>
                  <div className="text-base font-bold text-slate-100">{audit.chemicalSpeciation?.coMgM3 ?? 0.35} <span className="text-[9px] text-slate-400 font-normal">mg/m³</span></div>
                  <div className="text-[8.5px] text-slate-500 truncate">Combustión incompleta en cañón</div>
                </div>

                {/* Radical [OH] */}
                <div className="p-2 bg-slate-900 border border-slate-800 rounded space-y-0.5">
                  <div className="text-slate-400 text-[9px] flex justify-between">
                    <span>Radical [OH] Diurno</span>
                    <span className="text-teal-400">Fotólisis</span>
                  </div>
                  <div className="text-base font-bold text-teal-300">{audit.chemicalSpeciation?.ohRadicalMolecCm3 ?? '1.8e6'} <span className="text-[8px] text-slate-400 font-normal">molec/cm³</span></div>
                  <div className="text-[8.5px] text-slate-500 truncate">Detergente oxidante atmosférico</div>
                </div>

                {/* ClNO2 */}
                <div className="p-2 bg-slate-900 border border-slate-800 rounded space-y-0.5">
                  <div className="text-slate-400 text-[9px] flex justify-between">
                    <span>ClNO₂ (Halógenos)</span>
                    <span className="text-cyan-400">Alborán</span>
                  </div>
                  <div className="text-base font-bold text-cyan-300">{audit.chemicalSpeciation?.clno2Pptv ?? 120} <span className="text-[9px] text-slate-400 font-normal">pptv</span></div>
                  <div className="text-[8.5px] text-slate-500 truncate">Química nocturna N₂O₅ + Cl⁻</div>
                </div>

                {/* SIA */}
                <div className="p-2 bg-slate-900 border border-slate-800 rounded space-y-0.5">
                  <div className="text-slate-400 text-[9px] flex justify-between">
                    <span>Aerosol Secundario (SIA)</span>
                    <span className="text-indigo-400">ISORROPIA</span>
                  </div>
                  <div className="text-base font-bold text-indigo-300">{audit.chemicalSpeciation?.siaSecondaryInorganicUgm3 ?? 3.8} <span className="text-[9px] text-slate-400 font-normal">µg/m³</span></div>
                  <div className="text-[8.5px] text-slate-500 truncate">Fracción NO₃⁻ + SO₄²⁻ + NH₄⁺</div>
                </div>

                {/* Polvo Sahariano */}
                <div className="p-2 bg-slate-900 border border-slate-800 rounded space-y-0.5">
                  <div className="text-slate-400 text-[9px] flex justify-between">
                    <span>Polvo Sahariano Mineral</span>
                    <span className="text-amber-400">Natural</span>
                  </div>
                  <div className="text-base font-bold text-amber-200">{audit.chemicalSpeciation?.saharanDustUgm3 ?? 2.1} <span className="text-[9px] text-slate-400 font-normal">µg/m³</span></div>
                  <div className="text-[8.5px] text-slate-500 truncate">Fracción geológica en PM₁₀</div>
                </div>

                {/* Spray Marino NaCl */}
                <div className="p-2 bg-slate-900 border border-slate-800 rounded space-y-0.5">
                  <div className="text-slate-400 text-[9px] flex justify-between">
                    <span>Spray Marino (NaCl)</span>
                    <span className="text-sky-400">Bahía</span>
                  </div>
                  <div className="text-base font-bold text-sky-300">{audit.chemicalSpeciation?.marineAerosolNaClUgm3 ?? 4.2} <span className="text-[9px] text-slate-400 font-normal">µg/m³</span></div>
                  <div className="text-[8.5px] text-slate-500 truncate">Aerosol primario salino</div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: CANYON CROSS-SECTION 2D DIAGRAM */}
        {activeSubTab === 'canyon_cross_section' && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-400" />
                Corte Transversal 2D del Cañón: Dinámica del Vórtice de Oke &amp; Aceras
              </span>
              <span className="text-[10px] text-slate-400">
                Orientación: {audit.morphology.streetOrientationDeg}° | Viento: {audit.aerodynamics.windDirectionDeg}° ({audit.aerodynamics.uPerpMs} m/s ⊥)
              </span>
            </div>

            {/* SVG Visual Scheme */}
            <div className="w-full h-64 bg-slate-900 border border-slate-800 rounded-lg relative overflow-hidden flex items-center justify-center p-2">
              <svg viewBox="0 0 700 240" className="w-full h-full">
                {/* Sky and sun rays */}
                <rect x="0" y="0" width="700" height="240" fill="#090d16" />
                <circle cx="580" cy="30" r="16" fill="#f59e0b" opacity="0.85" />
                <line x1="560" y1="40" x2="350" y2="200" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
                
                {/* Free flow wind above roofs */}
                <path d="M 100,25 L 600,25" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrow)" />
                <text x="350" y="18" fill="#38bdf8" fontSize="11" textAnchor="middle" fontWeight="bold">
                  Viento libre a nivel de cornisa U_roof = {audit.aerodynamics.windSpeedRoofMs} m/s
                </text>

                {/* Left Building (Leeward Wall) */}
                <rect x="120" y="40" width="120" height="170" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                <text x="180" y="125" fill="#94a3b8" fontSize="10" textAnchor="middle" transform="rotate(-90 180 125)">
                  Fachada Sotavento (H = {audit.morphology.buildingHeightM}m)
                </text>

                {/* Right Building (Windward Wall) */}
                <rect x="460" y="40" width="120" height="170" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                <text x="520" y="125" fill="#94a3b8" fontSize="10" textAnchor="middle" transform="rotate(90 520 125)">
                  Fachada Barlovento (H = {audit.morphology.buildingHeightM}m)
                </text>

                {/* Street Asphalt Bed */}
                <rect x="240" y="200" width="220" height="10" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                <text x="350" y="222" fill="#64748b" fontSize="9" textAnchor="middle">
                  Calzada W = {audit.morphology.streetWidthM}m (Emisión q = {audit.traffic.linearEmissionNOxUgmS} µg/m·s)
                </text>

                {/* Oke Circulation Vortex (Circular Arrow) */}
                <ellipse cx="350" cy="120" rx="65" ry="50" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="5 3" />
                <polygon points="340,68 355,70 345,78" fill="#a855f7" />
                <text x="350" y="123" fill="#c084fc" fontSize="10" textAnchor="middle" fontWeight="bold">
                  Vórtice Oke ({audit.aerodynamics.vortexSpeedMs} m/s)
                </text>

                {/* Sidewalk Leeward Highlight */}
                <rect x="240" y="170" width="45" height="30" fill="#7f1d1d" opacity="0.45" rx="3" />
                <text x="262" y="184" fill="#fca5a5" fontSize="8.5" textAnchor="middle" fontWeight="bold">Sotavento</text>
                <text x="262" y="195" fill="#ef4444" fontSize="9" textAnchor="middle" fontWeight="black">
                  {audit.sidewalkConcentrations.leewardSidewalkNO2Ugm3}
                </text>

                {/* Sidewalk Windward Highlight */}
                <rect x="415" y="170" width="45" height="30" fill="#064e3b" opacity="0.45" rx="3" />
                <text x="437" y="184" fill="#6ee7b7" fontSize="8.5" textAnchor="middle" fontWeight="bold">Barlovento</text>
                <text x="437" y="195" fill="#10b981" fontSize="9" textAnchor="middle" fontWeight="black">
                  {audit.sidewalkConcentrations.windwardSidewalkNO2Ugm3}
                </text>
              </svg>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 block">Factor Visión Cielo (SVF)</span>
                <span className="text-xs font-bold text-amber-300">{audit.morphology.skyViewFactorSVF}</span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 block">Renovación Horaria (ACH)</span>
                <span className="text-xs font-bold text-sky-300">{audit.aerodynamics.airChangesPerHourACH} h⁻¹</span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 block">Asimetría Peatonal</span>
                <span className="text-xs font-bold text-purple-300">{audit.sidewalkConcentrations.leewardToWindwardRatio}x</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LATEX DERIVATION CODE */}
        {activeSubTab === 'latex_derivation' && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-400" />
                Formulación Analítica Formal en LaTeX
              </span>
              <ScientificTooltip position="bottom" width="w-[260px]" content="Descarga el fichero .TEX con la formulación física completa, balances y deducciones analíticas compilables en LaTeX para la memoria doctoral.">
                <button
                  onClick={handleExportLatex}
                  className="px-2 py-1 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                >
                  <Download className="w-3 h-3" />
                  <span>Descargar .TEX</span>
                </button>
              </ScientificTooltip>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-300 space-y-2.5">
              <div className="font-mono text-cyan-300">{audit.analyticalBreakdownEquation}</div>
              <div className="p-2 bg-slate-950 border border-slate-800 rounded space-y-1">
                <div className="text-[9px] text-slate-400 font-mono">Deducción de Aceras según Vórtices de Oke (1987):</div>
                <MathFormula
                  math={`C_{\\text{lee}} = C_{\\text{wind}} \\cdot \\left[ 1 + 1.65 \\frac{H}{W} \\sin|\\theta_{\\text{viento}} - \\theta_{\\text{calle}}| \\right] = ${audit.sidewalkConcentrations.windwardSidewalkNO2Ugm3} \\cdot ${audit.sidewalkConcentrations.leewardToWindwardRatio} = ${audit.sidewalkConcentrations.leewardSidewalkNO2Ugm3}\\,\\mu\\text{g/m}^3`}
                  displayMode={true}
                />
              </div>
              <div className="p-2 bg-slate-950 border border-slate-800 rounded space-y-1">
                <div className="text-[9px] text-slate-400 font-mono">Corrección Espacial por Asimilación EnKF:</div>
                <MathFormula
                  math={`K = \\exp\\left(-\\frac{d^2}{2 L_{\\text{corr}}^2}\\right) = ${audit.enkfCorrection.kalmanGainWeightK} \\quad (d = ${audit.enkfCorrection.distanceToStationM}\\,\\text{m}) \\implies C_{\\text{final}} = ${audit.enkfCorrection.finalAssimilatedNO2Ugm3} \\pm ${audit.enkfCorrection.uncertainty95ExpandedUgm3}\\,\\mu\\text{g/m}^3\\ (U_{95}, k=2)`}
                  displayMode={true}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </DraggableWindow>
  );
}
