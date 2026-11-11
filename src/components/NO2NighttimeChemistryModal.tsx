import React, { useState, useMemo } from 'react';
import { 
  Moon, Sun, Waves, Sparkles, Activity, ShieldCheck, Download, Copy, Check, 
  FileText, Database, Layers, Flame, Leaf, Wind, Calculator, Compass,
  TrendingUp, TrendingDown, Scale, RefreshCw, BarChart2, Radio, Atom
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { MathFormula } from './MathFormula';
import { useActivePoint } from '../context/ActivePointContext';
import { 
  computeNO2NighttimeChemistry, 
  NighttimeChemistryResult, 
  DiurnalCycleHourlyPoint,
  getKNo2O3RateConstant,
  getN2O5EquilibriumConstant
} from '../lib/no2NighttimeChemistryEngine';

export interface NO2NighttimeChemistryModalProps {
  onClose: () => void;
  className?: string;
}

export const NO2NighttimeChemistryModal: React.FC<NO2NighttimeChemistryModalProps> = ({ onClose }) => {
  const activeCtx = useActivePoint();
  const [activeTab, setActiveTab] = useState<'cycle' | 'pathways' | 'coastal' | 'export'>('cycle');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Extraer parámetros en tiempo real del punto activo
  const no2Val = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? activeCtx?.assimilation?.no2Ugm3 ?? activeCtx?.data?.no2_satelite_base ?? 28.4;
  const o3Val = activeCtx?.assimilation?.ozoneO3UgM3 ?? activeCtx?.assimilation?.o3Ugm3 ?? activeCtx?.data?.ozone ?? 52.0;
  const noVal = activeCtx?.assimilation?.noEstimatedUgM3 ?? (no2Val * 0.22);
  const tempVal = activeCtx?.assimilation?.temperatureC ?? activeCtx?.data?.temperatura_malaga ?? activeCtx?.data?.temperatura_mar_c ?? 20.0;
  const rhVal = activeCtx?.assimilation?.relativeHumidityPct ?? activeCtx?.assimilation?.humidityPct ?? activeCtx?.data?.humedad_relativa ?? 70;
  const radiationVal = activeCtx?.assimilation?.solarRadiationWm2 ?? activeCtx?.data?.shortwave_radiation ?? (typeof activeCtx?.data?.uv_index === 'number' ? activeCtx.data.uv_index * 60 : 0);
  const distCoastKm = activeCtx?.assimilation?.distanceToCoastKm ?? ((activeCtx?.activePoint?.distanceToCoastM ?? 1200) / 1000);
  const marineSaltUgM3 = activeCtx?.assimilation?.marineSaltPm10UgM3 ?? (distCoastKm < 3.0 ? 5.8 * Math.exp(-distCoastKm / 1.5) : 0.6);
  const treeLai = activeCtx?.assimilation?.treeCanopyLai ?? activeCtx?.data?.lai_arbolado ?? 1.2;
  const streetName = activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name || 'Málaga (Centro Histórico)';
  const districtName = activeCtx?.activePoint?.districtName || 'Distrito Centro';
  const dynamicTrafficVehH = useMemo(() => {
    const isPed = activeCtx?.activePoint?.isPedestrian ?? (activeCtx?.activePoint?.highwayType === 'pedestrian');
    if (isPed) return 0;
    const baseDaily = activeCtx?.activePoint?.trafficVehiclesDay ?? 14500;
    const diurnalFactor = activeCtx?.assimilation?.diurnalTrafficFactor ?? 0.65;
    return Math.max(25, Math.round((baseDaily / 24) * diurnalFactor));
  }, [activeCtx?.activePoint?.isPedestrian, activeCtx?.activePoint?.highwayType, activeCtx?.activePoint?.trafficVehiclesDay, activeCtx?.assimilation?.diurnalTrafficFactor]);

  // Ejecución determinista del motor cinético nocturno
  const chemistry: NighttimeChemistryResult = useMemo(() => {
    return computeNO2NighttimeChemistry({
      no2Ugm3: no2Val,
      o3Ugm3: o3Val,
      noUgm3: noVal,
      temperatureC: tempVal,
      relativeHumidityPct: rhVal,
      solarRadiationWm2: radiationVal,
      distanceToCoastKm: distCoastKm,
      marineSaltUgM3: marineSaltUgM3,
      treeLai: treeLai,
      trafficVehH: dynamicTrafficVehH
    });
  }, [no2Val, o3Val, noVal, tempVal, rhVal, radiationVal, distCoastKm, marineSaltUgM3, treeLai, dynamicTrafficVehH]);

  // Copia con feedback visual
  const handleCopy = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  // Exportación GeoJSON
  const handleExportGeoJSON = () => {
    const geojson = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [activeCtx?.location?.lon ?? -4.42, activeCtx?.location?.lat ?? 36.72]
      },
      properties: {
        title: "NO2 Nighttime Chemistry & Halogen Activation Assessment",
        streetName,
        districtName,
        timestamp: chemistry.timestampIso,
        no2_ugm3: chemistry.currentSnapshot.no2Ugm3,
        no3_radical_pptv: chemistry.currentSnapshot.no3RadicalPpt,
        n2o5_pptv: chemistry.currentSnapshot.n2o5Ppt,
        clno2_pptv: chemistry.currentSnapshot.clno2Ppt,
        cl_radical_molec_cm3: chemistry.currentSnapshot.clRadicalMolecCm3,
        gamma_n2o5: chemistry.gammaN2O5Heterogeneous,
        phi_clno2_yield: chemistry.clno2YieldPhi,
        nighttime_no2_lifetime_hours: chemistry.nighttimeNO2LifetimeHours,
        morning_ozone_advance_min: chemistry.morningOzoneAdvanceMinutes,
        dominant_nighttime_sink: chemistry.dominantNighttimeSink,
        hourly_diurnal_cycle: chemistry.hourlyDiurnalCycle
      }
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quimica_nocturna_no2_${streetName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Exportación CSV
  const handleExportCSV = () => {
    const headers = "Hora,Es_Noche,Radiacion_WM2,NO2_ug_m3,O3_ug_m3,NO_ug_m3,NO3_pptv,N2O5_pptv,ClNO2_pptv,J_NO2_s1,J_ClNO2_s1,Cl_Radical_10e4\n";
    const rows = chemistry.hourlyDiurnalCycle.map(p => 
      `"${p.hourLabel}",${p.isNight},${p.solarRadiationWm2},${p.no2UgM3},${p.o3UgM3},${p.noUgM3},${p.no3RadicalPpt},${p.n2o5Ppt},${p.clno2Ppt},${p.jNo2PerSec},${p.jClNO2PerSec},${p.clRadicalConc}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serie_nictemeral_no2_${streetName.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Tabla en Código LaTeX para Tesis Doctoral
  const latexTableCode = useMemo(() => {
    return `% Tabla LaTeX para Tesis Doctoral: Química Nocturna NO2 y ClNO2 en ${streetName}
\\begin{table}[htbp]
\\centering
\\caption{Evaluación cinético-heterogénea de especies nocturnas de nitrógeno reactivo y activación de halógenos en ${streetName} (Málaga).}
\\label{tab:no2_nighttime_chemistry_${districtName.toLowerCase().replace(/\\s+/g, '_')}}
\\begin{tabular}{lccc}
\\hline
\\textbf{Parámetro / Especie Reactiva} & \\textbf{Valor Simulado} & \\textbf{Unidades} & \\textbf{Referencia Metodológica} \\\\
\\hline
Dióxido de Nitrógeno $[\\text{NO}_2]$ & ${chemistry.currentSnapshot.no2Ugm3} & $\\mu\\text{g/m}^3$ & Telemetría / Asimilación PINN \\\\
Radical Nitrato $[\\text{NO}_3^\\bullet]$ (nocturno) & ${chemistry.currentSnapshot.no3RadicalPpt} & pptv & Atkinson et al. (2004) IUPAC \\\\
Pentóxido de Dinitrógeno $[\\text{N}_2\\text{O}_5]$ & ${chemistry.currentSnapshot.n2o5Ppt} & pptv & Seinfeld \\& Pandis (2016) \\\\
Cloruro de Nitrilo $[\\text{ClNO}_2]$ (acumulado amanecer) & ${chemistry.currentSnapshot.clno2Ppt} & pptv & Thornton et al. (2010 Nature) \\\\
Coeficiente de Acomodación Heterogénea $\\gamma(\\text{N}_2\\text{O}_5)$ & ${chemistry.gammaN2O5Heterogeneous} & adimensional & Bertram \\& Thornton (2009) \\\\
Rendimiento Molar $\\Phi(\\text{ClNO}_2)$ & ${chemistry.clno2YieldPhi} & adimensional & Osthoff et al. (2008 Nat. Geosci.) \\\\
Pulso Matutino de Radicales $\\text{Cl}^\\bullet$ & ${chemistry.currentSnapshot.clRadicalMolecCm3} & $\\text{moléc/cm}^3\\cdot\\text{s}$ & Fotólisis al Amanecer $J_{\\text{ClNO}_2}$ \\\\
Tiempo de Vida Nocturno $\\tau(\\text{NO}_2)$ & ${chemistry.nighttimeNO2LifetimeHours} & horas & Sumidero Heterogéneo Coastal \\\\
Adelanto del Pico de Ozono Matutino & +${chemistry.morningOzoneAdvanceMinutes} & minutos & Aceleración por Cloro Reactivo \\\\
\\hline
\\end{tabular}
\\end{table}`;
  }, [chemistry, streetName, districtName]);

  return (
    <DraggableWindow
      windowId="no2NighttimeChemistry"
      title="Química Nocturna del NO₂, Radical Nitrato (NO₃•) y ClNO₂"
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[920px] max-w-[95vw] h-[685px] max-h-[85vh]"
      badge={`📍 ${streetName} • ClNO₂: ${chemistry.currentSnapshot.clno2Ppt} pptv`}
    >
      <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
        
        {/* Banner Superior de Estado Nictemeral */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-950 via-slate-950 to-cyan-950 border-b border-indigo-900/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-900/80 border border-indigo-500/50 rounded-lg text-indigo-300">
              <Moon className="w-5 h-5 animate-pulse text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">{streetName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                  {districtName} ({chemistry.distanceToCoastKm} km del Mar)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  γ(N₂O₅) = {chemistry.gammaN2O5Heterogeneous}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>[NO₂]: <strong className="text-indigo-300">{chemistry.currentSnapshot.no2Ugm3} µg/m³</strong></span>
                <span>•</span>
                <span>[NO₃•]: <strong className="text-purple-300">{chemistry.currentSnapshot.no3RadicalPpt} pptv</strong></span>
                <span>•</span>
                <span>[N₂O₅]: <strong className="text-sky-300">{chemistry.currentSnapshot.n2o5Ppt} pptv</strong></span>
                <span>•</span>
                <span>[ClNO₂]: <strong className="text-cyan-300">{chemistry.currentSnapshot.clno2Ppt} pptv</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ScientificTooltip
              topic="coastal_halogen_clno2"
              title="Adelanto del Pico Matutino de Ozono Troposférico"
              content="La fotólisis del ClNO2 acumulado de noche genera un pulso de radicales Cl• al amanecer, acelerando la oxidación de COVs y adelantando la producción matutina de ozono."
              formula={`\\text{ClNO}_2 + h\\nu \\xrightarrow{J_{\\text{ClNO}_2}} \\text{Cl}^\\bullet + \\text{NO}_2, \\quad \\Delta t_{\\text{O}_3} = +${chemistry.morningOzoneAdvanceMinutes} \\text{ min}`}
              regulatory="Aceleración fotoquímica costera (Thornton et al. 2010 Nature)"
              position="left"
              width="w-[320px]"
            >
              <div className="px-3 py-1 bg-cyan-950/80 border border-cyan-500/70 rounded flex items-center gap-1.5 font-mono text-xs font-bold text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Adelanto O₃ Matutino: +{chemistry.morningOzoneAdvanceMinutes} min</span>
              </div>
            </ScientificTooltip>
          </div>
        </div>

        {/* Barra de Subpestañas Temáticas */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-1.5 shrink-0">
          <div className="flex items-center gap-1">
            <ScientificTooltip
              title="Ciclo Nictemeral Diurno-Nocturno (24 Horas)"
              content="Evolución temporal continua de especies fotoquímicas de nitrógeno y halógenos marinos en las 24 horas del día."
              position="bottom"
              width="w-[280px]"
            >
              <button
                type="button"
                onClick={() => setActiveTab('cycle')}
                className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'cycle'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Ciclo Diurno-Nocturno 24H</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Mecanismos Cinéticos y Constantes de Tasa"
              content="Reacciones químicas en fase gas y heterogénea en superficie de aerosol salino marino."
              position="bottom"
              width="w-[280px]"
            >
              <button
                type="button"
                onClick={() => setActiveTab('pathways')}
                className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'pathways'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Atom className="w-3.5 h-3.5" />
                <span>Mecanismos Cinéticos</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Acoplamiento Marino Bahía de Málaga"
              content="Influencia de la distancia al mar, spray salino y humedad relativa en la formación de ClNO2."
              position="bottom"
              width="w-[280px]"
            >
              <button
                type="button"
                onClick={() => setActiveTab('coastal')}
                className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'coastal'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Waves className="w-3.5 h-3.5" />
                <span>Acoplamiento Marino</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Exportación FAIR del Ciclo Nocturno (NO₃• / N₂O₅ / ClNO₂)"
              content="Exporta la serie nictemeral de 24 h de química oscura (NO₃•, N₂O₅, ClNO₂ y fotólisis matinal) en GeoJSON, CSV y tabla LaTeX para la tesis doctoral."
              formula="\mathcal{D}_{\text{noct}} = \{\text{GeoJSON}, \text{CSV}_{24\text{h}}, \text{LaTeX}\}\left([\text{NO}_3^\bullet], [\text{N}_2\text{O}_5], [\text{ClNO}_2]\right)"
              position="bottom"
              width="w-[290px]"
            >
              <button
                type="button"
                onClick={() => setActiveTab('export')}
                className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'export'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportación FAIR</span>
              </button>
            </ScientificTooltip>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
            <span>Rendimiento Molar Φ(ClNO₂): <strong className="text-cyan-300">{chemistry.clno2YieldPhi}</strong></span>
          </div>
        </div>

        {/* Contenido Principal de las Subpestañas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* 1. SUBPESTAÑA CICLO DIURNO-NOCTURNO 24H */}
          {activeTab === 'cycle' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Tarjetas de Resumen Nictemeral */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <ScientificTooltip
                  title="Radical Nitrato Nocturno (NO₃•)"
                  content="Principal oxidante nocturno derivado de NO2 + O3. Fotolizable rápidamente durante el día por la luz solar."
                  formula="\text{NO}_2 + \text{O}_3 \rightarrow \text{NO}_3 + \text{O}_2"
                  regulatory="Atkinson et al. (2004) Química nocturna troposférica"
                  position="bottom"
                  width="w-[280px]"
                >
                  <div className="bg-slate-900/90 border border-indigo-800/50 rounded-lg p-3 cursor-help hover:border-indigo-500/70 transition-all">
                    <div className="flex items-center justify-between text-indigo-400 text-xs font-bold mb-1">
                      <span>Radical Nitrato (NO₃•)</span>
                      <Moon className="w-4 h-4" />
                    </div>
                    <div className="text-lg font-mono font-bold text-indigo-300">
                      {chemistry.currentSnapshot.no3RadicalPpt} <span className="text-xs font-normal text-slate-400">pptv</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Oxidante nocturno primario en fase gas</p>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip
                  title="Pentóxido de Dinitrógeno Anhidro (N₂O₅)"
                  content="Especie reservorio en equilibrio térmico reversible con NO3 y NO2 (K_eq). Especie clave en reacciones heterogéneas."
                  formula="\text{NO}_2 + \text{NO}_3 \rightleftharpoons \text{N}_2\text{O}_5"
                  regulatory="Wayne et al. (1991) The nitrate radical in the atmosphere"
                  position="bottom"
                  width="w-[280px]"
                >
                  <div className="bg-slate-900/90 border border-sky-800/50 rounded-lg p-3 cursor-help hover:border-sky-500/70 transition-all">
                    <div className="flex items-center justify-between text-sky-400 text-xs font-bold mb-1">
                      <span>N₂O₅ Anhidro</span>
                      <Atom className="w-4 h-4" />
                    </div>
                    <div className="text-lg font-mono font-bold text-sky-300">
                      {chemistry.currentSnapshot.n2o5Ppt} <span className="text-xs font-normal text-slate-400">pptv</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Reserva térmica en equilibrio con NO₃•</p>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip
                  title="Cloruro de Nitrilo (ClNO₂)"
                  content="Sintetizado por absorción heterogénea de N2O5 en aerosoles salinos marinos con rendimiento Phi(ClNO2)."
                  formula="\text{N}_2\text{O}_5 + \text{Cl}^-_{\text{aq}} \xrightarrow{\gamma} \phi \text{ClNO}_2 + (1-\phi) \text{NO}_3^-"
                  regulatory="Thornton et al. (Nature 2010) Halogen activation in coastal environments"
                  position="bottom"
                  width="w-[280px]"
                >
                  <div className="bg-slate-900/90 border border-cyan-800/50 rounded-lg p-3 cursor-help hover:border-cyan-500/70 transition-all">
                    <div className="flex items-center justify-between text-cyan-400 text-xs font-bold mb-1">
                      <span>Cloruro de Nitrilo (ClNO₂)</span>
                      <Waves className="w-4 h-4" />
                    </div>
                    <div className="text-lg font-mono font-bold text-cyan-300">
                      {chemistry.currentSnapshot.clno2Ppt} <span className="text-xs font-normal text-slate-400">pptv</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Acumulado por reacción en spray salino</p>
                  </div>
                </ScientificTooltip>

                <ScientificTooltip
                  title="Inyección Matutina de Radicales Cloro (Cl•)"
                  content="Fotólisis matutina rápida de ClNO2 con la primera luz solar, adelantando la producción de ozono urbano."
                  formula="\text{ClNO}_2 + h\nu \xrightarrow{\text{amanecer}} \text{Cl}\cdot + \text{NO}_2"
                  regulatory="Osthoff et al. (Nature Geoscience 2008) High levels of nitryl chloride in air"
                  position="bottom"
                  width="w-[280px]"
                >
                  <div className="bg-slate-900/90 border border-amber-800/50 rounded-lg p-3 cursor-help hover:border-amber-500/70 transition-all">
                    <div className="flex items-center justify-between text-amber-400 text-xs font-bold mb-1">
                      <span>Pulso Matutino Cl•</span>
                      <Sun className="w-4 h-4" />
                    </div>
                    <div className="text-lg font-mono font-bold text-amber-300">
                      {chemistry.currentSnapshot.clRadicalMolecCm3} <span className="text-xs font-normal text-slate-400">moléc/cm³·s</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Activación de radicales al amanecer</p>
                  </div>
                </ScientificTooltip>
              </div>

              {/* Gráfico 24 Horas SVG de Especies Nocturnas */}
              <div className="bg-slate-900/95 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      <span>Evolución Temporal Nictemeral (24 Horas): NO₂, O₃, NO₃•, N₂O₅ y ClNO₂</span>
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Visualización analítica del acoplamiento entre la sombra nocturna, el spray salino y la fotólisis al amanecer.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-400 rounded-xs"></span> NO₂</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-teal-400 rounded-xs"></span> O₃</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-purple-400 rounded-xs"></span> NO₃•</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-cyan-400 rounded-xs"></span> ClNO₂</span>
                  </div>
                </div>

                {/* Gráfico SVG de Barras/Líneas 24H */}
                <div className="w-full overflow-x-auto pt-2">
                  <div className="min-w-[760px] h-48 flex items-end gap-1.5 bg-slate-950 p-3 rounded-lg border border-slate-800 relative">
                    {chemistry.hourlyDiurnalCycle.map((hr, idx) => {
                      const maxNO2 = 80;
                      const maxClNO2 = 1200;
                      const no2BarHeight = Math.min(100, (hr.no2UgM3 / maxNO2) * 100);
                      const clno2BarHeight = Math.min(100, (hr.clno2Ppt / maxClNO2) * 100);

                      return (
                        <div key={hr.hour} className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer">
                          {/* Sombra nocturna de fondo */}
                          {hr.isNight && (
                            <div className="absolute inset-0 bg-indigo-950/20 rounded-xs border-x border-indigo-900/30 pointer-events-none" />
                          )}

                          {/* Tooltip flotante al pasar el cursor */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 z-20 bg-slate-900 border border-slate-700 p-2 rounded text-[10px] font-mono whitespace-nowrap shadow-xl pointer-events-none">
                            <strong className="text-cyan-300 block mb-1">{hr.hourLabel} {hr.isNight ? '🌙 (Noche)' : '☀️ (Día)'}</strong>
                            <div>NO₂: {hr.no2UgM3} µg/m³</div>
                            <div>O₃: {hr.o3UgM3} µg/m³</div>
                            <div>NO₃•: {hr.no3RadicalPpt} pptv</div>
                            <div>ClNO₂: {hr.clno2Ppt} pptv</div>
                            <div>J(NO₂): {hr.jNo2PerSec} s⁻¹</div>
                          </div>

                          {/* Barra ClNO2 */}
                          <div 
                            className="w-full bg-cyan-500/80 hover:bg-cyan-400 transition-all rounded-t-xs relative"
                            style={{ height: `${clno2BarHeight}%` }}
                          />

                          {/* Indicador NO2 */}
                          <div 
                            className="w-1.5 bg-indigo-400 rounded-full absolute bottom-0 shadow-sm"
                            style={{ height: `${no2BarHeight}%` }}
                          />

                          <span className="text-[8px] font-mono text-slate-500 mt-1 shrink-0">{hr.hour}h</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 2. SUBPESTAÑA MECANISMOS CINÉTICOS */}
          {activeTab === 'pathways' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Atom className="w-4 h-4 text-indigo-400" />
                  <span>Cadena Cinética Nocturna y Heterogénea en la Bahía de Málaga</span>
                </h3>

                <div className="space-y-3 pt-2">
                  
                  {/* Reacción 1 */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <strong className="text-indigo-300">1. Formación Nocturna del Radical Nitrato (NO₃•)</strong>
                      <span className="font-mono text-[10px] text-slate-400">k_NO3 = {getKNo2O3RateConstant(tempVal).toExponential(2)} cm³·molec⁻¹·s⁻¹</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800/90 text-cyan-300">
                      <MathFormula math="\text{NO}_2 + \text{O}_3 \xrightarrow{k_{\text{NO}_3}(T)} \text{NO}_3^\bullet + \text{O}_2" />
                    </div>
                    <p className="text-xs text-slate-400">
                      Reacción homogénea diurna y nocturna. De día, el radical NO₃• sufre fotólisis ultrarrápida; de noche se acumula actuando como el principal oxidante atmosférico.
                    </p>
                  </div>

                  {/* Reacción 2 */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <strong className="text-sky-300">2. Equilibrio Térmico Rápido NO₃• / N₂O₅</strong>
                      <span className="font-mono text-[10px] text-slate-400">K_eq = {getN2O5EquilibriumConstant(tempVal).toExponential(2)} cm³·molec⁻¹</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800/90 text-sky-300">
                      <MathFormula math="\text{NO}_3^\bullet + \text{NO}_2 \xleftrightarrow{K_{\text{eq}}(T)} \text{N}_2\text{O}_5" />
                    </div>
                    <p className="text-xs text-slate-400">
                      Equilibrio fuertemente dependiente de la temperatura. Temperaturas frías desplazan el equilibrio hacia N₂O₅.
                    </p>
                  </div>

                  {/* Reacción 3 */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <strong className="text-cyan-300">3. Captación Heterogénea en Spray Salino Marino (Málaga)</strong>
                      <span className="font-mono text-[10px] text-slate-400">γ(N₂O₅) = {chemistry.gammaN2O5Heterogeneous} • Φ(ClNO₂) = {chemistry.clno2YieldPhi}</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800/90 text-cyan-300">
                      <MathFormula math="\text{N}_2\text{O}_5\text{(g)} + \text{NaCl(aq)} \xrightarrow{\gamma(\text{N}_2\text{O}_5)} \text{ClNO}_2\text{(g)} + \text{NaNO}_3\text{(aq)}" />
                    </div>
                    <p className="text-xs text-slate-400">
                      Absorción de N₂O₅ gaseoso sobre la superficie acuosa del aerosol salino de la Bahía. Produce cloruro de nitrilo volatilizado a la atmósfera nocturna.
                    </p>
                  </div>

                  {/* Reacción 4 */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <strong className="text-amber-300">4. Fotólisis Matutina al Amanecer y Liberación de Cl•</strong>
                      <span className="font-mono text-[10px] text-slate-400">J(ClNO₂) ~ 0.25 · J(NO₂)</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800/90 text-amber-300">
                      <MathFormula math="\text{ClNO}_2 + h\nu (\lambda < 460\text{ nm}) \xrightarrow{J_{\text{ClNO}_2}} \text{Cl}^\bullet + \text{NO}_2" />
                    </div>
                    <p className="text-xs text-slate-400">
                      Al salir el sol, la radiación fotoliza el ClNO₂ liberando radicales de cloro (Cl•) extremadamente reactivos que oxidan COVs 10 a 100 veces más rápido que el radical OH•.
                    </p>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* 3. SUBPESTAÑA ACOPLAMIENTO MARINO */}
          {activeTab === 'coastal' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Waves className="w-4 h-4 text-cyan-400" />
                  <span>Acoplamiento Biofísico con la Bahía de Málaga y Aerosol Salino</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block">Distancia a la Línea de Costa</span>
                    <strong className="text-cyan-300 text-base">{distCoastKm.toFixed(2)} km</strong>
                    <p className="text-[10px] text-slate-500 font-sans mt-1">Proximidad directa al aerosol marino</p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block">Masa de Spray Salino (PM₁₀)</span>
                    <strong className="text-teal-300 text-base">{marineSaltUgM3.toFixed(1)} µg/m³</strong>
                    <p className="text-[10px] text-slate-500 font-sans mt-1">Superficie disponible de aerosol S_a</p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block">Acomodación Heterogénea γ</span>
                    <strong className="text-indigo-300 text-base">{chemistry.gammaN2O5Heterogeneous}</strong>
                    <p className="text-[10px] text-slate-500 font-sans mt-1">Modelo Bertram & Thornton (2009)</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans pt-2">
                  La Bahía de Málaga actúa como un reactor heterogéneo natural. Durante las horas nocturnas, la brisa marina transporta aerosol salino cargado de <MathFormula math="\text{NaCl}" /> hacia el cañón urbano, donde reacciona con la masa de <MathFormula math="\text{NO}_2" /> emitida por el tráfico vehicular.
                </p>
              </div>
            </div>
          )}

          {/* 4. SUBPESTAÑA EXPORTACIÓN FAIR */}
          {activeTab === 'export' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Exportación FAIR y Tablas LaTeX para la Tesis Doctoral</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Descarga directa del ciclo nictemeral completo en formatos abiertos normalizados.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <ScientificTooltip
                    title="Descargar GeoJSON de Química Nocturna y Halógenos"
                    content="Archivo GeoJSON RFC 7946 con coordenadas del punto activo, distancia al litoral, rendimiento de ClNO₂ (ϕ) y velocidades de captación heterogénea γ(N₂O₅)."
                    position="bottom"
                    width="w-[290px]"
                  >
                    <button
                      type="button"
                      onClick={handleExportGeoJSON}
                      className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-600 text-white font-bold rounded-lg text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar GeoJSON (.geojson)</span>
                    </button>
                  </ScientificTooltip>

                  <ScientificTooltip
                    title="Descargar Serie Temporal 24H CSV"
                    content="Tabla horaria de las 24 horas del día con NO2, O3, NO3, N2O5, ClNO2 y fotólisis."
                    position="bottom"
                    width="w-[280px]"
                  >
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="px-3.5 py-2 bg-sky-800 hover:bg-sky-700 text-white font-bold rounded-lg text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Descargar Serie 24H CSV (.csv)</span>
                    </button>
                  </ScientificTooltip>

                  <ScientificTooltip
                    title="Copiar Tabla LaTeX del Ciclo Nictemeral (24h)"
                    content="Copia el código LaTeX booktabs con los perfiles horarios nocturnos y diurnos de NO₂, O₃, NO₃•, N₂O₅ y ClNO₂ para compilación en Overleaf."
                    position="bottom"
                    width="w-[290px]"
                  >
                    <button
                      type="button"
                      onClick={() => handleCopy(latexTableCode, 'latex')}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-700 shadow-sm"
                    >
                      {copiedFormat === 'latex' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                      <span>{copiedFormat === 'latex' ? '¡Copiado al Portapapeles!' : 'Copiar Tabla LaTeX (.tex)'}</span>
                    </button>
                  </ScientificTooltip>
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-mono text-slate-400">Previsualización del código LaTeX generado:</span>
                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-48 leading-relaxed select-text">
                    {latexTableCode}
                  </pre>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Inferior de Estado */}
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800/90 text-[10px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Modelo Cinético Nocturno Determinista (Bertram & Thornton / IUPAC)</span>
          </div>
          <div>
            <span>Tesis Doctoral Calidad del Aire Málaga • Química Heterogénea de Halógenos</span>
          </div>
        </div>

      </div>
    </DraggableWindow>
  );
};
