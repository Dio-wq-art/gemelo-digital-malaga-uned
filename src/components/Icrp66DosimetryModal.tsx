import React, { useState } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import { useActivePoint } from '../context/ActivePointContext';
import { 
  HeartPulse, 
  ShieldCheck, 
  Download, 
  Activity, 
  Sliders, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  User, 
  Baby,
  Wind,
  Layers,
  FileJson
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  computeIcrp66Dosimetry, 
  PhysicalActivityLevel,
  Icrp66Cohort
} from '../lib/icrp66Dosimetry';

interface Icrp66DosimetryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Icrp66DosimetryModal: React.FC<Icrp66DosimetryModalProps> = ({
  isOpen,
  onClose
}) => {
  const activeCtx = useActivePoint();
  const activePoint = activeCtx?.activePoint;

  const [activity, setActivity] = useState<PhysicalActivityLevel>('WALKING');
  const [durationMin, setDurationMin] = useState<number>(60);
  const [cohort, setCohort] = useState<Icrp66Cohort>('CHILD_8Y');

  // Concentraciones asimiladas del punto activo o base oficial
  const activeNo2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? 32.5;
  const activePm25 = activeCtx?.assimilation?.pm25UgM3 ?? 14.8;
  const activePm10 = activeCtx?.assimilation?.pm10UgM3 ?? 26.2;
  const activeLat = activeCtx?.activePoint?.lat ?? 36.7213;
  const activeLon = activeCtx?.activePoint?.lon ?? -4.4214;
  const streetName = activeCtx?.activePoint?.name || activeCtx?.activePoint?.nearestStreetName || 'Alameda Principal / Centro';

  if (!isOpen) return null;

  const result = computeIcrp66Dosimetry({
    no2ConcentrationUgM3: activeNo2,
    pm25ConcentrationUgM3: activePm25,
    pm10ConcentrationUgM3: activePm10,
    activityLevel: activity,
    exposureDurationMinutes: durationMin,
    cohort
  });

  const chartData = [
    { name: 'Extratorácico (ET)', dose: result.compartments.extrathoracic.depositedDosePmUg, pct: result.compartments.extrathoracic.fractionPercent, clearance: `${result.compartments.extrathoracic.ciliaryClearanceHours}h`, color: '#38bdf8' },
    { name: 'Traqueobronquial (BB)', dose: result.compartments.bronchial.depositedDosePmUg, pct: result.compartments.bronchial.fractionPercent, clearance: `${result.compartments.bronchial.ciliaryClearanceHours}h`, color: '#34d399' },
    { name: 'Bronquiolar (bb)', dose: result.compartments.bronchiolar.depositedDosePmUg, pct: result.compartments.bronchiolar.fractionPercent, clearance: `${result.compartments.bronchiolar.ciliaryClearanceHours}h`, color: '#fbbf24' },
    { name: 'Alveolar Profundo (AI)', dose: result.compartments.alveolar.depositedDosePmUg, pct: result.compartments.alveolar.fractionPercent, clearance: `${result.compartments.alveolar.ciliaryClearanceHours}h (~100d)`, color: '#f43f5e' },
  ];

  const handleExportCSV = () => {
    const headers = 'Compartimento,Estructura,Mecanismo,Fraccion_Retenida_Pct,Dosis_Depositada_PM25_ug,Dosis_Total_Inhalada_NO2_ug,Dosis_Estres_Oxidativo_DTT_nmol,Volumen_Inhalado_m3,Cohorte,Cota_Inhalacion_m,Calle\n';
    const rows = [
      `ET,${result.compartments.extrathoracic.anatomicalTarget},${result.compartments.extrathoracic.depositionMechanism},${result.compartments.extrathoracic.fractionPercent},${result.compartments.extrathoracic.depositedDosePmUg},${result.totalInhaledNo2DoseUg},0.0,${result.inhaledAirVolumeM3},"${cohort}",${result.inhalationHeightM},"${streetName}"`,
      `BB,${result.compartments.bronchial.anatomicalTarget},${result.compartments.bronchial.depositionMechanism},${result.compartments.bronchial.fractionPercent},${result.compartments.bronchial.depositedDosePmUg},${result.totalInhaledNo2DoseUg},0.0,${result.inhaledAirVolumeM3},"${cohort}",${result.inhalationHeightM},"${streetName}"`,
      `bb,${result.compartments.bronchiolar.anatomicalTarget},${result.compartments.bronchiolar.depositionMechanism},${result.compartments.bronchiolar.fractionPercent},${result.compartments.bronchiolar.depositedDosePmUg},${result.totalInhaledNo2DoseUg},0.0,${result.inhaledAirVolumeM3},"${cohort}",${result.inhalationHeightM},"${streetName}"`,
      `AI,${result.compartments.alveolar.anatomicalTarget},${result.compartments.alveolar.depositionMechanism},${result.compartments.alveolar.fractionPercent},${result.compartments.alveolar.depositedDosePmUg},${result.totalInhaledNo2DoseUg},${result.biologicallyEffectiveOxidativeDoseNmol},${result.inhaledAirVolumeM3},"${cohort}",${result.inhalationHeightM},"${streetName}"`
    ].join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `icrp66_dosimetria_pulmonar_${cohort}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportGeoJSON = () => {
    const geoJson = {
      type: 'FeatureCollection',
      name: 'icrp66_punto_activo_dosimetria',
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [activeLon, activeLat] },
          properties: {
            ubicacion: streetName,
            cohorte: cohort,
            pesoCorporalKg: result.bodyWeightKg,
            cotaInhalacionM: result.inhalationHeightM,
            frecuenciaRespiratoriaBpm: result.breathingFrequencyBpm,
            tasaVentilacionLMin: result.ventilationRateLMin,
            volumenInhaladoM3: result.inhaledAirVolumeM3,
            dosisNo2Ug: result.totalInhaledNo2DoseUg,
            dosisPm25Ug: result.totalInhaledPm25DoseUg,
            dosisAlveolarPm25Ug: result.compartments.alveolar.depositedDosePmUg,
            dosisOxidativaDttNmol: result.biologicallyEffectiveOxidativeDoseNmol,
            retencionPulmonarTotalPct: result.totalPulmonaryRetentionPct,
            no2Excede2030: result.directiveAudit.no2Exceedance2030,
            pm25Excede2030: result.directiveAudit.pm25Exceedance2030,
            conformidad2030: result.directiveAudit.complianceStatus
          }
        }
      ]
    };
    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/geo+json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `icrp66_dosimetria_geolocalizada_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const COHORTS: { id: Icrp66Cohort; label: string; desc: string; height: string }[] = [
    { id: 'INFANT_1Y', label: 'Lactante (1 año)', desc: '10 kg, 34 resp/min, V_E = 2.5 L/min', height: '0.50m' },
    { id: 'CHILD_5Y', label: 'Niño Preescolar (5 años)', desc: '19 kg, 26 resp/min, V_E = 5.3 L/min', height: '0.75m' },
    { id: 'CHILD_8Y', label: 'Niño Escolar (8-10 años)', desc: '26 kg, 22 resp/min, V_E = 7.5 L/min', height: '0.90m' },
    { id: 'ADULT_SEDENTARY', label: 'Adulto Sedentario', desc: '70 kg, 14 resp/min, V_E = 8.5 L/min', height: '1.70m' },
    { id: 'ADULT_ATHLETE', label: 'Adulto Deportista', desc: '70 kg, 32 resp/min, respiración oronasal', height: '1.70m' },
    { id: 'ELDERLY_75Y', label: 'Anciano Vulnerable (>75)', desc: '65 kg, aclaramiento ciliar retardado (-35%)', height: '1.65m' }
  ];

  return (
    <DraggableWindow
      windowId="icrp66Dosimetry"
      title="MODELO DOSIMÉTRICO PULMONAR ICRP 66 & AUDITORÍA DIRECTIVA (UE) 2024/2881"
      subtitle="Depósito Regional Tracto Respiratorio Humano & Cumplimiento Normativo 2030"
      icon={<HeartPulse className="w-5 h-5 text-rose-400" />}
      badge={
        <span className="text-[8.5px] bg-rose-950 text-rose-300 border border-rose-600 px-1.5 py-0.2 font-mono font-bold">
          📍 {activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name || 'Málaga'} • NO₂: {activeNo2.toFixed(1)} µg/m³
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[92vw] max-w-4xl max-h-[85vh]"
      headerColorClass="text-rose-400"
      borderColorClass="border-rose-500/80"
    >
      <div className="flex flex-col gap-3 font-mono text-xs p-3 text-slate-200 bg-slate-950">
        {/* Banner Unificado del Punto Activo */}
        <ActivePointSyncBanner compact={true} />

        {/* Banner Metodológico y Exportación FAIR */}
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-indigo-950/80 border border-rose-500/60 p-3 rounded flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <div className="text-xs font-bold text-rose-300 uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Dosimetría del Tracto Respiratorio Humano (ICRP Pub. 66)</span>
              <span className="bg-rose-900 text-rose-200 text-[8px] font-mono px-1.5 py-0.5 border border-rose-700">
                Cota Inhalación: {result.inhalationHeightM}m AGL
              </span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-snug">
              Cálculo analítico del depósito anatómico regional (ET, BB, bb, AI) acoplado a la ventilación alveolar específica ({result.ventilationRateLMin} L/min), estrés oxidativo DTT y contraste metrológico contra los nuevos límites 2030 de la Directiva Europea 2024/2881 y Guías OMS 2021.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar la auditoría dosimétrica y de cumplimiento normativo en formato abierto tabular CSV.">
              <button
                onClick={handleExportCSV}
                className="shrink-0 bg-rose-600 hover:bg-rose-500 text-slate-950 text-[10.5px] uppercase font-bold py-2 px-3 rounded border border-rose-400 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5 text-slate-950" />
                <span>CSV</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar la dosimetría geolocalizada del punto activo en formato GeoJSON para SIG e interoperabilidad FAIR.">
              <button
                onClick={handleExportGeoJSON}
                className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white text-[10.5px] uppercase font-bold py-2 px-3 rounded border border-indigo-400 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span>GEOJSON</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Selector de Cohortes Demográficas ICRP 66 */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
            <span className="flex items-center gap-1.5 text-amber-300">
              <User className="w-3.5 h-3.5" />
              <span>Cohorte Fisiológica ICRP 66 (Tabla 7):</span>
            </span>
            <span className="text-slate-400 text-[10px]">
              Ratio Ventilación/Peso vs Adulto: <b className="text-rose-400">{result.pediatricAdultVentilationFactor}x</b>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
            {COHORTS.map(c => (
              <ScientificTooltip
                key={c.id}
                position="top"
                width="w-[240px]"
                content={`Parámetros ICRP 66: ${c.desc}. Cota de inhalación: ${c.height} sobre el suelo.`}
              >
                <button
                  onClick={() => setCohort(c.id)}
                  className={`p-1.5 text-left rounded border transition-all cursor-pointer flex flex-col justify-between h-full ${cohort === c.id ? 'bg-rose-950/80 text-rose-200 border-rose-500 shadow-md' : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-850'}`}
                >
                  <span className="text-[10px] font-bold block">{c.label}</span>
                  <span className="text-[8px] text-slate-400 font-mono block mt-0.5">Cota: {c.height}</span>
                </button>
              </ScientificTooltip>
            ))}
          </div>
        </div>

        {/* Panel de Controles de Actividad y Exposición */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900 p-3 border border-slate-800 rounded">
          <ScientificTooltip position="top" width="w-[280px]" content="Nivel de esfuerzo físico según ICRP 66. A mayor esfuerzo, la ventilación se multiplica y la respiración oronasal incrementa el depósito alveolar profundo.">
            <div className="space-y-1">
              <span className="text-slate-400 text-[11px] block">Nivel de Esfuerzo / Actividad Metabólica:</span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setActivity('REST')}
                  className={`py-1 text-[10px] rounded border transition-all cursor-pointer font-bold ${activity === 'REST' ? 'bg-cyan-600 text-slate-950 border-cyan-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                >
                  Reposo (8.5 L/m)
                </button>
                <button
                  onClick={() => setActivity('WALKING')}
                  className={`py-1 text-[10px] rounded border transition-all cursor-pointer font-bold ${activity === 'WALKING' ? 'bg-amber-600 text-slate-950 border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                >
                  Paseo (21 L/m)
                </button>
                <button
                  onClick={() => setActivity('HEAVY_EXERCISE_RUNNING')}
                  className={`py-1 text-[10px] rounded border transition-all cursor-pointer font-bold ${activity === 'HEAVY_EXERCISE_RUNNING' ? 'bg-rose-600 text-slate-950 border-rose-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                >
                  Running (52 L/m)
                </button>
              </div>
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Tiempo total transcurrido en el microambiente urbano a cota de respirador (0.50m - 1.70m AGL).">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Duración Exposición:</span>
                <span className="text-cyan-300 font-bold">{durationMin} min ({(durationMin / 60).toFixed(1)} h)</span>
              </div>
              <input
                type="range"
                min="10"
                max="360"
                step="10"
                value={durationMin}
                onChange={(e) => setDurationMin(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>
        </div>

        {/* Tarjeta de Auditoría Directiva (UE) 2024/2881 & OMS 2021 */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-2 uppercase">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Auditoría de Conformidad Directiva (UE) 2024/2881 (Metas 2030)</span>
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${result.directiveAudit.complianceStatus === 'COMPLIANT_2030' ? 'bg-emerald-950 text-emerald-300 border-emerald-600' : result.directiveAudit.complianceStatus === 'MODERATE_EXCEEDANCE' ? 'bg-amber-950 text-amber-300 border-amber-600' : 'bg-rose-950 text-rose-300 border-rose-600'}`}>
              {result.directiveAudit.complianceStatus === 'COMPLIANT_2030' && '✓ CONFORME DIRECTIVA 2030'}
              {result.directiveAudit.complianceStatus === 'MODERATE_EXCEEDANCE' && '⚠ RIESGO DE NO CONFORMIDAD 2030'}
              {result.directiveAudit.complianceStatus === 'CRITICAL_EXCEEDANCE' && '✗ NO CONFORME DIRECTIVA 2030'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[10px]">
            <div className="p-2 bg-slate-950 border border-slate-800 rounded flex justify-between items-center">
              <span>NO₂: <b>{activeNo2} µg/m³</b></span>
              <span className={result.directiveAudit.no2Exceedance2030 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                Límite: 20 ({result.directiveAudit.no2GapUgM3 > 0 ? `+${result.directiveAudit.no2GapUgM3}` : result.directiveAudit.no2GapUgM3})
              </span>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800 rounded flex justify-between items-center">
              <span>PM2.5: <b>{activePm25} µg/m³</b></span>
              <span className={result.directiveAudit.pm25Exceedance2030 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                Límite: 10 ({result.directiveAudit.pm25GapUgM3 > 0 ? `+${result.directiveAudit.pm25GapUgM3}` : result.directiveAudit.pm25GapUgM3})
              </span>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800 rounded flex justify-between items-center">
              <span>PM10: <b>{activePm10} µg/m³</b></span>
              <span className={result.directiveAudit.pm10Exceedance2030 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                Límite: 20 ({result.directiveAudit.pm10GapUgM3 > 0 ? `+${result.directiveAudit.pm10GapUgM3}` : result.directiveAudit.pm10GapUgM3})
              </span>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800 rounded flex justify-between items-center">
              <span>Guía OMS 2021:</span>
              <span className={result.directiveAudit.who2021No2Exceedance || result.directiveAudit.who2021Pm25Exceedance ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {result.directiveAudit.who2021No2Exceedance || result.directiveAudit.who2021Pm25Exceedance ? 'EXCEDIDA (NO2>10)' : 'CUMPLIDA'}
              </span>
            </div>
          </div>
        </div>

        {/* 5 Indicadores Clave Dosimetría y Toxicología */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          <ScientificTooltip
            title="Volumen Total de Aire Inhalado (V_inh)"
            content="Volumen de aire inspirado en función de la ventilación minuto V_E (L/min) según el nivel de actividad metabólica fijado por el modelo ICRP 66."
            formula={`V_{\\text{inh}} = V_E \\cdot t_{\\text{exp}} = ${result.ventilationRateLMin}\\,\\text{L/min} \\times ${durationMin}\\,\\text{min} = ${result.inhaledAirVolumeM3}\\,\\text{m}^3`}
            citation="ICRP Publication 66 (1994) Table 7"
          >
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">Aire Inhalado</span>
              <span className="text-base font-bold text-cyan-400 font-mono">{result.inhaledAirVolumeM3} m³</span>
              <span className="text-[8.5px] text-slate-400 block">Flujo: {result.ventilationRateLMin} L/min</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            title="Dosis Inhalada Total de NO₂"
            content="Masa total de NO2 inhalada a cota de respirador y fracción reactiva absorbida por disolución y transferencia de masa en el epitelio alveolar."
            formula={`D_{\\text{NO}_2} = C_{\\text{NO}_2} \\cdot V_{\\text{inh}} = ${result.totalInhaledNo2DoseUg}\\,\\mu\\text{g}`}
            citation="ICRP Publication 66 / Miller et al. (1982)"
          >
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">Dosis NO₂</span>
              <span className="text-base font-bold text-orange-400 font-mono">{result.totalInhaledNo2DoseUg} µg</span>
              <span className="text-[8.5px] text-slate-400 block">Absorbida: {result.alveolarNo2AbsorptionUg} µg</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            title="Dosis Depositada en Sacos Alveolares (AI)"
            content="Fracción de partículas finas PM2.5 que penetran hasta los alvéolos profundos por difusión browniana e impacto inercial, con riesgo de translocación al torrente sanguíneo."
            formula={`D_{\\text{AI}} = C_{\\text{PM}_{2.5}} \\cdot V_{\\text{inh}} \\cdot \\text{DF}_{\\text{AI}} = ${result.compartments.alveolar.depositedDosePmUg}\\,\\mu\\text{g}`}
            citation="ICRP Publication 66 Human Respiratory Tract Model"
          >
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">Dosis Alveolar PM2.5</span>
              <span className="text-base font-bold text-rose-400 font-mono">{result.compartments.alveolar.depositedDosePmUg} µg</span>
              <span className="text-[8.5px] text-slate-400 block">Sacos profundos (AI)</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            title="Dosis Biológicamente Efectiva de Estrés Oxidativo (OP-DTT)"
            content="Capacidad oxidativa transferida al epitelio alveolar por el consumo de ditiotreitol (DTT) impulsado por metales de transición de tráfico (Cu, Fe) y compuestos orgánicos."
            formula={`D_{\\text{eff}}^{\\text{DTT}} = D_{\\text{AI}} \\times \\text{OP}_{\\text{mass}} = ${result.biologicallyEffectiveOxidativeDoseNmol}\\,\\text{nmol DTT}`}
            citation="Charrier & Anastasio (2012) / Fang et al. (2015)"
          >
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">Estrés Oxidativo</span>
              <span className="text-base font-bold text-amber-400 font-mono">{result.biologicallyEffectiveOxidativeDoseNmol} nmol</span>
              <span className="text-[8.5px] text-slate-400 block">Carga celular DTT</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            title="Fracción Global de Retención Pulmonar"
            content="Porcentaje acumulado de masa particulada retenida en los cuatro compartimentos del tracto respiratorio (ET, BB, bb, AI)."
            formula={`\\text{Retención}(\\%) = \\sum_{i} \\text{DF}_i = ${result.totalPulmonaryRetentionPct}\\%`}
            citation="ICRP Publication 66"
          >
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">Retención Total</span>
              <span className="text-base font-bold text-emerald-400 font-mono">{result.totalPulmonaryRetentionPct}%</span>
              <span className="text-[8.5px] text-slate-400 block">Aclaramiento ~100d</span>
            </div>
          </ScientificTooltip>
        </div>

        {/* Gráfico de Depósito Anatómico Regional */}
        <div className="bg-black/90 p-3 border border-slate-800 rounded space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-300 block">
              Distribución Anatómica de la Dosis de PM2.5 Depositada (µg) & Tiempo de Aclaramiento Ciliar
            </span>
            <span className="text-[9px] text-slate-400">
              Cota Inhalación: {result.inhalationHeightM}m | Peso: {result.bodyWeightKg}kg
            </span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                <YAxis stroke="#f43f5e" tick={{ fontSize: 9 }} label={{ value: 'Dosis Depositada (µg)', angle: -90, position: 'insideLeft', fill: '#f43f5e', fontSize: 10 }} />
                <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="dose" name="Dosis Depositada (µg)" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Nota Científica Doctoral */}
        <div className="p-2.5 bg-rose-950/30 border border-rose-600/40 rounded text-[9.5px] text-slate-300 leading-relaxed font-sans">
          <b>Dictamen Dosimétrico Doctoral:</b> {result.scientificNote}
        </div>
      </div>
    </DraggableWindow>
  );
};

