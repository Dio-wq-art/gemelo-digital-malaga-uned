import React, { useState, useEffect } from "react";
import { DraggableWindow } from "./DraggableWindow";
import { ScientificTooltip } from "./ScientificTooltip";
import { SlidingRibbonBar } from "./SlidingRibbonBar";
import { ActivePointSyncBanner } from "./ActivePointSyncBanner";
import { useActivePoint } from "../context/ActivePointContext";
import { 
  GraduationCap, 
  ShieldCheck, 
  Download, 
  Activity, 
  Baby, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  MapPin, 
  HeartPulse, 
  School,
  Scale,
  Car,
  FileSpreadsheet,
  AlertOctagon
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { computeSchoolAirEquity, generateSchoolsGeoJson, SchoolVulnerabilityProfile } from "../lib/schoolAirEquity";

export type SchoolAirEquitySubtab = "overview" | "directive2024" | "dosimetry";

interface SchoolAirEquityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubtab?: SchoolAirEquitySubtab;
}

export const SchoolAirEquityModal: React.FC<SchoolAirEquityModalProps> = ({
  isOpen,
  onClose,
  initialSubtab = "directive2024"
}) => {
  const activeCtx = useActivePoint();
  const [activeSubtab, setActiveSubtab] = useState<SchoolAirEquitySubtab>(initialSubtab);
  const [filterDistrict, setFilterDistrict] = useState<string>("ALL");

  useEffect(() => {
    if (initialSubtab) {
      setActiveSubtab(initialSubtab);
    }
  }, [initialSubtab]);

  if (!isOpen) return null;

  const activeNO2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? 35.0;
  const activePM25 = activeCtx?.assimilation?.pm25UgM3 ?? 14.8;

  const analysis = computeSchoolAirEquity({
    ambientNO2UgM3: activeNO2,
    ambientPM25UgM3: activePM25
  });

  const handleExportCSV = () => {
    let csv = "# CENSO DE ENTORNOS ESCOLARES Y DOSIMETRIA PEDIATRICA ICRP 66 - MALAGA\n";
    csv += "# Universidad: Universidad Nacional de Educacion a Distancia (UNED) - EIDUNED\n";
    csv += "# Doctorando: Dionisio Galvez Pozo\n";
    const headers = "Colegio,Distrito,Renta_Hogar_EUR,Alumnos,Tipo_Calle,NO2_Hora_Punta_ug_m3,PM25_ug_m3,Dosis_NO2_ug_h,Dosis_Alveolar_PM25_ug_dia,Buffer,Dir2008_40,Dir2024_20,OMS2021_10,Gap_2024_ug_m3,Reduccion_Trafico_Req_Pct,Estado\n";
    const rows = analysis.schools.map(s => 
      `"${s.schoolName}","${s.districtName}",${s.averageIncomeEurYear},${s.studentsCount},"${s.streetType}",${s.schoolHoursPeakNO2UgM3},${s.baselinePM25UgM3},${s.childHourlyNO2DoseUg},${s.childAlveolarPM25DoseUgDay},"${s.trafficBufferStatus}","${s.dir2008Compliance}","${s.dir2024Compliance}","${s.who2021Compliance}",${s.gap2024DirectiveNO2},${s.requiredTrafficReductionPercent},"${s.directiveComplianceStatus}"`
    ).join("\n");
    const blob = new Blob([csv + headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `entornos_escolares_directiva2024_malaga_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportGeoJSON = () => {
    const geoJson = generateSchoolsGeoJson(analysis.schools);
    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: "application/geo+json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `red_entornos_escolares_malaga_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectSchool = (school: SchoolVulnerabilityProfile) => {
    if (activeCtx?.syncActivePoint) {
      activeCtx.syncActivePoint(school.lat, school.lon, {
        name: `${school.schoolName} (${school.districtName})`,
        fly: true
      });
    }
  };

  const filteredSchools = filterDistrict === "ALL" 
    ? analysis.schools 
    : analysis.schools.filter(s => s.districtName.includes(filterDistrict));

  const chartData = filteredSchools.map(s => ({
    name: s.schoolName.split("(")[0].replace("CEIP", "").trim(),
    no2: s.schoolHoursPeakNO2UgM3,
    gap: s.gap2024DirectiveNO2,
    reductionReq: s.requiredTrafficReductionPercent,
    alveolarDose: s.childAlveolarPM25DoseUgDay,
    income: s.averageIncomeEurYear
  }));

  const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#dc2626", "#059669", "#ea580c", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

  return (
    <DraggableWindow
      windowId="schoolAirEquity"
      title="ENTORNOS ESCOLARES SEGUROS & DIRECTIVA (UE) 2024/2881"
      subtitle="Evaluación Regulatoria Tripartita (2008/50/CE vs 2024/2881 Art. 13 vs OMS 2021) e ICRP 66 Infantil"
      icon={<School className="w-5 h-5 text-amber-400" />}
      badge={
        <span className="text-[8.5px] bg-amber-950 text-amber-300 border border-amber-600 px-1.5 py-0.2 font-mono font-bold">
          📍 {activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name || "Málaga"} • NO₂ Escolar: {activeNO2.toFixed(1)} µg/m³
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[94vw] max-w-5xl max-h-[88vh]"
      headerColorClass="text-amber-400"
      borderColorClass="border-amber-500/80"
    >
      <div className="flex flex-col gap-3 font-mono text-xs p-3 text-slate-200 bg-slate-950">
        {/* Banner Unificado del Punto Activo */}
        <ActivePointSyncBanner compact={true} />

        {/* Barra de Subpestañas Temáticas Científicas — Cinta Deslizante Continua (Regla 22) */}
        <SlidingRibbonBar
          activeKey={activeSubtab}
          ariaLabel="Subpestañas de Entornos Escolares y Dosimetría Pediátrica"
          className="border-b border-slate-800 pb-2"
          rightAddon={
            <div className="flex items-center gap-2 shrink-0">
              <ScientificTooltip position="bottom" width="w-[260px]" content="Exportar la matriz tabular completa con indicadores tripartitos y dosimetría pediátrica en CSV citable.">
                <button
                  onClick={handleExportCSV}
                  className="bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] uppercase font-bold py-1.5 px-2.5 rounded border border-amber-400 flex items-center gap-1 cursor-pointer transition-all shrink-0 whitespace-nowrap"
                >
                  <Download className="w-3 h-3 text-slate-950" />
                  <span>CSV FAIR</span>
                </button>
              </ScientificTooltip>

              <ScientificTooltip position="bottom" width="w-[260px]" content="Exportar la capa cartográfica de colegios como GeoJSON estándar con atributos normativos de 2024/2881.">
                <button
                  onClick={handleExportGeoJSON}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] uppercase font-bold py-1.5 px-2.5 rounded border border-indigo-400 flex items-center gap-1 cursor-pointer transition-all shrink-0 whitespace-nowrap"
                >
                  <Download className="w-3 h-3 text-white" />
                  <span>GEOJSON</span>
                </button>
              </ScientificTooltip>
            </div>
          }
        >
          <ScientificTooltip position="bottom" width="w-[280px]" content="Auditoría tripartita de cumplimiento legal frente al nuevo límite vinculante 2030 (20 µg/m³), la directiva derogada 2008/50/CE (40 µg/m³) y la recomendación OMS 2021 (10 µg/m³).">
            <button
              data-ribbon-active={activeSubtab === "directive2024"}
              onClick={() => setActiveSubtab("directive2024")}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
                activeSubtab === "directive2024"
                  ? "bg-amber-600 text-slate-950 border border-amber-400 shadow-md"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Auditoría Directiva (UE) 2024/2881</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Fisiología y biofísica respiratoria del niño según ICRP 66 (cota 0.90m AGL, ventilación 2.1x mayor que adultos, depósito alveolar profundo).">
            <button
              data-ribbon-active={activeSubtab === "dosimetry"}
              onClick={() => setActiveSubtab("dosimetry")}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
                activeSubtab === "dosimetry"
                  ? "bg-rose-600 text-white border border-rose-400 shadow-md"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <Baby className="w-3.5 h-3.5" />
              <span>Dosimetría ICRP 66 (0.90m AGL)</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Vista panorámica de la red de entornos escolares de Málaga con gráfico comparativo de exposición socioespacial.">
            <button
              data-ribbon-active={activeSubtab === "overview"}
              onClick={() => setActiveSubtab("overview")}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
                activeSubtab === "overview"
                  ? "bg-indigo-600 text-white border border-indigo-400 shadow-md"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Red & Gráfico de Gradiente</span>
            </button>
          </ScientificTooltip>
        </SlidingRibbonBar>

        {/* Resumen Tripartito de Conformidad Europea */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <ScientificTooltip position="bottom" width="w-[280px]" content="Directiva 2008/50/CE (antiguo marco): Límite anual de NO2 = 40 µg/m³. Prácticamente todos los colegios aparentaban cumplir formalmente a macroescala.">
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1">
              <span className="text-[9px] text-slate-400 block uppercase">Marco Antiguo 2008/50/CE</span>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {analysis.tripartiteSummary.dir2008CompliantCount} / {analysis.schools.length}
                </span>
                <span className="text-[9px] text-slate-400">Límite 40 µg</span>
              </div>
              <span className="text-[8.5px] text-emerald-300 block">Cumplimiento aparente formal</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[300px]" content="Nueva Directiva (UE) 2024/2881 (Art. 13): Límite anual de NO2 = 20 µg/m³ para 2030 con obligación expresa de identificar focos a microescala en colegios.">
            <div className="p-2.5 bg-amber-950/40 border border-amber-600/60 rounded space-y-1">
              <span className="text-[9px] text-amber-300 font-bold block uppercase">Directiva (UE) 2024/2881 (2030)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-rose-400 font-mono">
                  {analysis.tripartiteSummary.dir2024CompliantCount} / {analysis.schools.length}
                </span>
                <span className="text-[9px] text-amber-300 font-bold">Límite 20 µg</span>
              </div>
              <span className="text-[8.5px] text-rose-300 font-bold block">
                {analysis.schools.length - analysis.tripartiteSummary.dir2024CompliantCount} centros en superación legal
              </span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Guías OMS 2021 de Calidad del Aire basadas en evidencia epidemiológica pura: Nivel guía NO2 = 10 µg/m³.">
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1">
              <span className="text-[9px] text-slate-400 block uppercase">Guía OMS 2021 (Salud)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-rose-400 font-mono">
                  {analysis.tripartiteSummary.who2021CompliantCount} / {analysis.schools.length}
                </span>
                <span className="text-[9px] text-slate-400">Guía 10 µg</span>
              </div>
              <span className="text-[8.5px] text-slate-400 block">Exposición de riesgo pediátrico</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Porcentaje máximo de reducción de emisiones de tráfico necesario en el cañón viario más saturado para alcanzar el límite 2030 de 20 µg/m³.">
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1">
              <span className="text-[9px] text-slate-400 block uppercase">Reducción Vial Máxima</span>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-amber-400 font-mono">
                  -{analysis.tripartiteSummary.maxTrafficReductionRequiredPercent}%
                </span>
                <span className="text-[9px] text-slate-400">Objetivo 2030</span>
              </div>
              <span className="text-[8.5px] text-amber-300/80 block">Pacificación vial obligatoria</span>
            </div>
          </ScientificTooltip>
        </div>

        {/* Subpestaña 1: Auditoría Tripartita Exhaustiva */}
        {activeSubtab === "directive2024" && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                  <Scale className="w-4 h-4 text-amber-400" />
                  <span>Matriz de Auditoría Tripartita por Centro Educativo</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9.5px] text-slate-400">Filtrar Distrito:</span>
                  <select
                    value={filterDistrict}
                    onChange={(e) => setFilterDistrict(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-slate-200 text-[9.5px] rounded px-2 py-0.5"
                  >
                    <option value="ALL">Todos los 11 Distritos</option>
                    <option value="Distrito 1">Distrito 1: Centro</option>
                    <option value="Distrito 2">Distrito 2: Este</option>
                    <option value="Distrito 3">Distrito 3: Ciudad Jardín</option>
                    <option value="Distrito 4">Distrito 4: Bailén-Miraflores</option>
                    <option value="Distrito 5">Distrito 5: Palma-Palmilla</option>
                    <option value="Distrito 6">Distrito 6: Cruz de Humilladero</option>
                    <option value="Distrito 7">Distrito 7: Carretera de Cádiz</option>
                    <option value="Distrito 8">Distrito 8: Churriana</option>
                    <option value="Distrito 9">Distrito 9: Campanillas</option>
                    <option value="Distrito 10">Distrito 10: Puerto de la Torre</option>
                    <option value="Distrito 11">Distrito 11: Teatinos</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[9px]">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800">
                      <th className="py-1 px-1">Centro Educativo</th>
                      <th className="py-1 px-1">Distrito & Renta INE</th>
                      <th className="py-1 px-1 text-amber-300">
                        <ScientificTooltip position="top" width="w-[240px]" content="Concentración de NO2 calculada a cota pediátrica 0.90m AGL durante el pico matinal (08:30-09:15).">
                          <span className="underline decoration-dotted cursor-help">NO₂ Pico (0.9m)</span>
                        </ScientificTooltip>
                      </th>
                      <th className="py-1 px-1 text-emerald-400">
                        <ScientificTooltip position="top" width="w-[240px]" content="Directiva 2008/50/CE (Límite 40 µg/m³).">
                          <span className="underline decoration-dotted cursor-help">Dir. 2008 (40 µg)</span>
                        </ScientificTooltip>
                      </th>
                      <th className="py-1 px-1 text-amber-400">
                        <ScientificTooltip position="top" width="w-[260px]" content="Nueva Directiva (UE) 2024/2881 (Límite vinculante para 2030 de 20 µg/m³).">
                          <span className="underline decoration-dotted cursor-help">Dir. 2024 (20 µg)</span>
                        </ScientificTooltip>
                      </th>
                      <th className="py-1 px-1 text-rose-400">
                        <ScientificTooltip position="top" width="w-[240px]" content="Exceso cuantitativo de NO2 respecto al límite 2030 de la Directiva 2024/2881.">
                          <span className="underline decoration-dotted cursor-help">Gap 2030 (µg)</span>
                        </ScientificTooltip>
                      </th>
                      <th className="py-1 px-1 text-cyan-300">
                        <ScientificTooltip position="top" width="w-[260px]" content="Porcentaje de reducción de tráfico requerido según modelo COPERT para situarse por debajo de 20 µg/m³.">
                          <span className="underline decoration-dotted cursor-help">Reducción Tráfico</span>
                        </ScientificTooltip>
                      </th>
                      <th className="py-1 px-1 text-center">Fijar Punto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSchools.map((s) => (
                      <tr
                        key={s.schoolId}
                        onClick={() => handleSelectSchool(s)}
                        className="border-b border-slate-800/60 hover:bg-slate-800/60 cursor-pointer transition-colors"
                      >
                        <td className="py-1 px-1 font-bold text-slate-200 flex items-center gap-1.5">
                          <School className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{s.schoolName}</span>
                        </td>
                        <td className="py-1 px-1 text-slate-400">
                          {s.districtName} ({s.averageIncomeEurYear.toLocaleString()} €)
                        </td>
                        <td className="py-1 px-1 text-amber-300 font-bold font-mono">
                          {s.schoolHoursPeakNO2UgM3} µg/m³
                        </td>
                        <td className="py-1 px-1 font-mono">
                          <span className={`px-1 py-0.5 rounded text-[8px] ${
                            s.dir2008Compliance === "CONFORME" 
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800" 
                              : "bg-rose-950 text-rose-300 border border-rose-800 font-bold"
                          }`}>
                            {s.dir2008Compliance === "CONFORME" ? "✓ CONFORME" : "SUPERACIÓN"}
                          </span>
                        </td>
                        <td className="py-1 px-1 font-mono">
                          <span className={`px-1 py-0.5 rounded text-[8px] ${
                            s.dir2024Compliance === "CONFORME" 
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800" 
                              : "bg-rose-950 text-rose-300 border border-rose-800 font-bold"
                          }`}>
                            {s.dir2024Compliance === "CONFORME" ? "✓ CONFORME" : "⚠️ SUPERA 2030"}
                          </span>
                        </td>
                        <td className="py-1 px-1 font-mono">
                          {s.gap2024DirectiveNO2 > 0 ? (
                            <span className="text-rose-400 font-bold">+{s.gap2024DirectiveNO2} µg</span>
                          ) : (
                            <span className="text-emerald-400">0.0 µg</span>
                          )}
                        </td>
                        <td className="py-1 px-1 font-mono text-cyan-300 font-bold">
                          {s.requiredTrafficReductionPercent > 0 ? (
                            <span>-{s.requiredTrafficReductionPercent}%</span>
                          ) : (
                            <span className="text-slate-500">0% (Conforme)</span>
                          )}
                        </td>
                        <td className="py-1 px-1 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectSchool(s);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-slate-950 transition-colors"
                          >
                            <MapPin className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cuadro de Justificación Legal para la Memoria Doctoral */}
            <div className="p-3 bg-amber-950/30 border border-amber-600/50 rounded space-y-1.5">
              <span className="text-[10.5px] font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                <span>Implicación Doctoral: Por qué la Directiva 2024/2881 invalida la modelización a macroescala</span>
              </span>
              <p className="text-[9.5px] text-slate-300 leading-relaxed font-sans">
                El <strong>Artículo 13 de la Directiva (UE) 2024/2881</strong> impone que los Estados miembros deben evaluar y mitigar prioritariamente la contaminación atmosférica en las proximidades de centros escolares, infantiles y de atención médica. Bajo la antigua Directiva 2008/50/CE (límite de 40 µg/m³ medido en estaciones de fondo a 3-4 metros de altura), el 100% de los colegios de Málaga se clasificaban formalmente como "zonas conformes". Sin embargo, la asimilación física del Gemelo Digital a cota respiratoria pediátrica (0.90 m AGL) demuestra que en las horas punta de entrada matinal se superan holgadamente los 20 µg/m³ fijados para 2030, exigiendo reducciones de tráfico rodado de hasta el {analysis.tripartiteSummary.maxTrafficReductionRequiredPercent}% en las arterias adyacentes.
              </p>
            </div>
          </div>
        )}

        {/* Subpestaña 2: Dosimetría Pediátrica ICRP 66 */}
        {activeSubtab === "dosimetry" && (
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded space-y-2">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase">
                <Baby className="w-4 h-4 text-rose-400" />
                <span>Fundamento Biofísico del Depósito Pulmonar Infantil (ICRP Publicación 66)</span>
              </span>
              <p className="text-[9.5px] text-slate-300 leading-snug">
                El tracto respiratorio infantil difiere radicalmente del adulto: a los 8 años de edad (26 kg), el volumen tidal y la frecuencia respiratoria (22 rpm) resultan en una tasa de ventilación específica de <strong>0.42 m³/(h·kg)</strong>, duplicando la tasa adulta (0.20 m³/(h·kg)). Además, su cota respiratoria de 0.90 m coincide con el penacho de eyección de los tubos de escape antes de que la turbulencia térmica lo diluya.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-black/80 border border-slate-800 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Centro Más Expuesto (Hora Punta)</span>
                <span className="text-sm font-bold text-rose-400 font-mono">{analysis.mostExposedSchool}</span>
                <span className="text-[9px] text-slate-400 block">Sometido a tráfico perimetral de desvío ZBE</span>
              </div>
              <div className="p-3 bg-black/80 border border-slate-800 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Centro Menos Expuesto</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{analysis.leastExposedSchool}</span>
                <span className="text-[9px] text-slate-400 block">Calle escolar pacificada en zona residencial</span>
              </div>
            </div>

            <div className="p-3 bg-rose-950/30 border border-rose-600/40 rounded space-y-1">
              <span className="text-[10px] font-bold text-rose-300 uppercase">Conclusión Biofísica para la Tesis</span>
              <p className="text-[9.5px] text-slate-300 font-sans leading-relaxed">
                {analysis.doctoralConclusion}
              </p>
            </div>
          </div>
        )}

        {/* Subpestaña 3: Vista de Red y Gráfico Comparativo */}
        {activeSubtab === "overview" && (
          <div className="space-y-3">
            <div className="bg-black/90 p-3 border border-slate-800 rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 block">
                  Concentración de NO₂ en Entorno Escolar a Cota 0.90m AGL (µg/m³) vs Gap Directiva 2024/2881
                </span>
                <span className="text-[9px] text-slate-400">Línea de corte: 20 µg/m³ (2030)</span>
              </div>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" />
                    <YAxis stroke="#fbbf24" tick={{ fontSize: 9 }} label={{ value: "NO₂ (µg/m³)", angle: -90, position: "insideLeft", fill: "#fbbf24", fontSize: 10 }} />
                    <RechartsTooltip cursor={{ fill: "rgba(251, 191, 36, 0.1)" }} />
                    <Bar dataKey="no2" name="NO₂ Pico 0.9m (µg/m³)" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded flex items-center justify-between text-[9.5px]">
              <span className="text-slate-300">
                Brecha de equidad socioespacial en Málaga: <strong>{analysis.inequalityRatioLowVsHighIncome}x</strong>
              </span>
              <span className="text-amber-300">
                {analysis.regulatoryVerdict}
              </span>
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
};
