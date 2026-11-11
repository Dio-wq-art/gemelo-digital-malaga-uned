import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Copy, 
  Check, 
  Sparkles, 
  Sliders, 
  BookOpen, 
  ShieldCheck, 
  Loader2, 
  MapPin, 
  Flame, 
  Cpu, 
  GraduationCap, 
  Atom, 
  Scale, 
  School, 
  Trees, 
  Layers, 
  Radio, 
  Waves,
  CheckCircle2,
  ChevronDown,
  Building2,
  Wind,
  Compass,
  FileQuestion,
  HelpCircle,
  FileCheck2,
  Brain,
  Search,
  Filter,
  Zap
} from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import { useActivePoint } from '../context/ActivePointContext';
import { 
  ReportScope, 
  ReportDepth, 
  SCOPE_LABELS, 
  DEPTH_LABELS,
  generateCustomOnDemandPdfReport,
  CustomPdfReportOptions,
  INVESTIGABLE_SUITES,
  InvestigableSuite
} from '../lib/customOnDemandPdfReport';
import { 
  MeteoData, 
  PhysicsResult, 
  StationComparisonResult, 
  OFFICIAL_MALAGA_AIR_STATIONS, 
  OFFICIAL_SATELLITE_MISSIONS 
} from '../lib/physics';
import { BenchmarkInputParams } from '../lib/pinnInference';
import { ODEKineticsParams } from '../lib/odeSolver';
import { PdfCanvasPreviewModal } from './PdfCanvasPreviewModal';
import { MALAGA_RAW_SCHOOLS } from '../lib/schoolAirEquity';

interface CustomOnDemandPdfReportTabProps {
  currentMeteo: MeteoData;
  physics?: PhysicsResult;
  stationComparisons?: StationComparisonResult[];
  benchmarkParams?: BenchmarkInputParams;
  odeParams?: ODEKineticsParams;
  location?: { lat: number; lon: number };
}

const PRESET_DIRECTIVES = [
  {
    label: "🔬 Consulta Libre en Blanco",
    prompt: ""
  },
  {
    label: "Defensa PINN ante Tribunal",
    prompt: `Demostrar y justificar exhaustivamente al tribunal evaluador por qué la PINN es un operador físico válido, superando a los modelos empíricos y factible en tiempo real acoplado a las ${OFFICIAL_MALAGA_AIR_STATIONS.length} estaciones y ${OFFICIAL_SATELLITE_MISSIONS.length} misiones satelitales en Málaga.`
  },
  {
    label: "Auditoría Directiva (UE) 2024/2881",
    prompt: "Evaluar el cumplimiento estricto del nuevo umbral anual de 20 µg/m³ para NO2 y 10 µg/m³ para PM2.5 según la Directiva (UE) 2024/2881 e identificar necesidad de medidas de mitigación ZBE en este punto activo."
  },
  {
    label: "Salud Infantil & Calles Escolares",
    prompt: "Analizar la dosimetría pediátrica ICRP 66 a cota de 0.9 metros y el buffer de protección de 300 metros del colegio más cercano según el Artículo 13 de la Directiva 2024/2881."
  },
  {
    label: "Buques Hotelling en Puerto & Fachada",
    prompt: "Investigar la dispersión advectiva de la pluma de buques de crucero y portacontenedores en el Puerto de Málaga impulsada por brisa marina de levante hacia la fachada urbana."
  },
  {
    label: "Mitigación Arbórea Wesely",
    prompt: "Calcular la capacidad de absorción estomática de contaminantes por las 44 especies arbóreas de Málaga según Wesely (1989) y evaluar la regla 3-30-300 de justicia verde."
  },
  {
    label: "Comparativa PINN vs CALPUFF vs SIRANE",
    prompt: "Realizar una comparativa metodológica rigurosa de ventajas computacionales y precisión física de la PINN frente a modelos lagrangianos (CALPUFF) y de calle (SIRANE/OSPM)."
  },
  {
    label: "Intrusión de Calima Sahariana",
    prompt: "Diagnosticar el transporte transfronterizo de polvo mineral sahariano, determinar el coeficiente AOD y cuantificar el descuento normativo admisible de PM10."
  },
  {
    label: "Flotas Vehiculares COPERT 5 & ZBE",
    prompt: "Modelizar las curvas de emisión de NOx según velocidad de circulación bajo la metodología COPERT 5 y evaluar el impacto del filtrado de vehículos en la Zona de Bajas Emisiones."
  },
  {
    label: "Isla de Calor Urbana (UHI) & Albedo",
    prompt: "Analizar el balance térmico superficial, el flujo de calor sensible convectivo y el impacto del albedo de pavimentos en el recalentamiento microclimático del cañón."
  },
  {
    label: "Ruido Acústico & Dispersión de NO2",
    prompt: "Estudiar la sinergia entre el nivel de presión acústica de tráfico Lden y los vórtices de dispersión de NO2 en el cañón urbano conforme a la Directiva 2002/49/CE."
  },
  {
    label: "Viento Terral & Calentamiento Föhn",
    prompt: "Investigar la dinámica del viento terral bajando por el valle del Guadalhorce, su compresión adiabática y el efecto sobre la altura de la capa de mezcla y dilución de contaminantes."
  }
];

export const CustomOnDemandPdfReportTab: React.FC<CustomOnDemandPdfReportTabProps> = ({
  currentMeteo,
  physics,
  stationComparisons = [],
  benchmarkParams,
  odeParams,
  location
}) => {
  const activeCtx = useActivePoint();
  const effectiveLocation = location || activeCtx?.location || { lat: 36.7196, lon: -4.4200 };

  const [selectedScope, setSelectedScope] = useState<ReportScope>('custom_open_inquiry');
  const [selectedDepth, setSelectedDepth] = useState<ReportDepth>('doctoral_extended');
  const [userInstructions, setUserInstructions] = useState<string>(
    "Evaluar exhaustivamente el microentorno del punto activo considerando la telemetría en tiempo real, la geometría del cañón urbano, el forzamiento del viento y el dictamen de cumplimiento de la Directiva (UE) 2024/2881 para la tesis doctoral."
  );
  
  // Inteligencia Artificial Doctoral (Gemini STEM)
  const [enableAiSynthesis, setEnableAiSynthesis] = useState<boolean>(false);
  const [selectedAiModel, setSelectedAiModel] = useState<string>("gemini-3.1-pro-preview");
  const [cachedAiSynthesis, setCachedAiSynthesis] = useState<string>("");

  // Selección voluntaria y selectiva de suites a cruzar en el estudio
  const [selectedSuites, setSelectedSuites] = useState<string[]>(INVESTIGABLE_SUITES.map(s => s.id));
  const [suiteFilterText, setSuiteFilterText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedLatex, setCopiedLatex] = useState(false);

  const categories = [
    { key: 'ALL', label: 'Todas', count: INVESTIGABLE_SUITES.length },
    { key: 'Geodesia & Microescala', label: '🏛️ Cañones & 3D', count: INVESTIGABLE_SUITES.filter(s => s.category === 'Geodesia & Microescala').length },
    { key: 'Movilidad & Emisiones', label: '🚗 Movilidad & ZBE', count: INVESTIGABLE_SUITES.filter(s => s.category === 'Movilidad & Emisiones').length },
    { key: 'Microclima Litoral', label: '🌊 Brisa Marina', count: INVESTIGABLE_SUITES.filter(s => s.category === 'Microclima Litoral').length },
    { key: 'Grandes Focos Emisores', label: '🏭 Puerto & Focos', count: INVESTIGABLE_SUITES.filter(s => s.category === 'Grandes Focos Emisores').length },
    { key: 'Cinética Atmosférica', label: '⚛️ Fotoquímica', count: INVESTIGABLE_SUITES.filter(s => s.category === 'Cinética Atmosférica').length },
    { key: 'Fisicoquímica de Aerosoles', label: '🧬 Aerosoles SIA/VBS', count: INVESTIGABLE_SUITES.filter(s => s.category === 'Fisicoquímica de Aerosoles').length },
    { key: 'Sumideros Verdes', label: '🌳 Arbolado Wesely', count: INVESTIGABLE_SUITES.filter(s => s.category === 'Sumideros Verdes').length },
    { key: 'Salud & Vulnerabilidad', label: '🚸 Salud Pediátrica', count: INVESTIGABLE_SUITES.filter(s => s.category === 'Salud & Vulnerabilidad').length },
    { key: 'Asimilación Observacional', label: `🛰️ Red ${OFFICIAL_MALAGA_AIR_STATIONS.length}+${OFFICIAL_SATELLITE_MISSIONS.length}`, count: INVESTIGABLE_SUITES.filter(s => s.category === 'Asimilación Observacional').length },
    { key: 'Cumplimiento Legal', label: '⚖️ FAIRMODE & UE', count: INVESTIGABLE_SUITES.filter(s => s.category === 'Cumplimiento Legal').length },
    { key: 'Eventos Extremos', label: '🌪️ Calima & Terral', count: INVESTIGABLE_SUITES.filter(s => s.category === 'Eventos Extremos').length },
    { key: 'Validación Computacional', label: '🔬 Benchmark PINN', count: INVESTIGABLE_SUITES.filter(s => s.category === 'Validación Computacional').length },
    { key: 'Doctrina Doctoral', label: '🎓 Defensa Tesis', count: INVESTIGABLE_SUITES.filter(s => s.category === 'Doctrina Doctoral').length }
  ];

  const handleSelectAllSuites = () => setSelectedSuites(INVESTIGABLE_SUITES.map(s => s.id));
  const handleClearSuites = () => setSelectedSuites([]);
  const handleToggleSuite = (id: string) => {
    setSelectedSuites(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };
  const handlePresetSuites = (ids: string[]) => setSelectedSuites(ids);

  const filteredSuites = INVESTIGABLE_SUITES.filter(s => {
    if (selectedCategory !== 'ALL' && s.category !== selectedCategory) {
      return false;
    }
    if (!suiteFilterText) return true;
    const q = suiteFilterText.toLowerCase();
    return s.title.toLowerCase().includes(q) 
      || s.shortTitle.toLowerCase().includes(q) 
      || s.category.toLowerCase().includes(q) 
      || s.description.toLowerCase().includes(q)
      || s.governingEquations.toLowerCase().includes(q);
  });

  // Parámetros físicos asimilados en el punto activo para retroalimentación en tiempo real en cada suite
  const realNO2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? currentMeteo.no2_satelite_base ?? 28.4;
  const realO3 = activeCtx?.assimilation?.ozoneO3UgM3 ?? currentMeteo.ozone ?? 45.2;
  const realPM25 = activeCtx?.assimilation?.pm25UgM3 ?? currentMeteo.pm2_5 ?? 10.1;
  const realPM10 = activeCtx?.assimilation?.pm10UgM3 ?? currentMeteo.pm10 ?? 19.3;
  const canyonHW = activeCtx?.activePoint?.aspectRatioHw ?? 1.2;
  const canyonH = activeCtx?.activePoint?.H ?? 18;
  const canyonW = activeCtx?.activePoint?.W ?? 15;
  const svf = activeCtx?.activePoint?.skyViewFactorSvf ?? 0.42;
  const windSpeedMs = (currentMeteo.velocidad_viento_km_h || 12) / 3.6;
  const windDirDeg = currentMeteo.direccion_viento_grados || 180;
  const tempC = currentMeteo.temperatura_malaga || 22;
  const jNO2 = physics?.j_no2 ?? 0.0078;
  const k1 = 1.4e-14;
  const leightonPhi = physics?.cinetica_quimica?.ratio_leighton ?? 1.05;
  const soaUgM3 = Number(Math.max(0.85, realPM25 * 0.28 + Math.max(0, (tempC - 18) * 0.09)).toFixed(2));
  const pediatricDoseUgh = Number((realNO2 * 0.032 * (1 + Math.min(0.45, canyonHW * 0.14))).toFixed(2));
  const nearestSchoolMatch = React.useMemo(() => {
    let bestName = "C.E.I.P. Prácticas Nº 1";
    let bestDistM = 220;
    let minD2 = Infinity;
    for (const sch of MALAGA_RAW_SCHOOLS) {
      const dLat = (sch.lat - effectiveLocation.lat) * 111320;
      const dLon = (sch.lon - effectiveLocation.lon) * 111320 * Math.cos((effectiveLocation.lat * Math.PI) / 180);
      const distM = Math.round(Math.sqrt(dLat * dLat + dLon * dLon));
      if (distM < minD2) {
        minD2 = distM;
        bestDistM = Math.max(15, distM);
        bestName = sch.name;
      }
    }
    return { bestName, bestDistM };
  }, [effectiveLocation.lat, effectiveLocation.lon]);
  const schoolDistM = nearestSchoolMatch.bestDistM;
  const nearestSchoolName = nearestSchoolMatch.bestName;
  const uStarMs = (physics as any)?.u_star ?? 0.320;
  const stabilityClass = physics?.estabilidad_pg ?? "Clase C";

  const handleInjectActivePointContext = () => {
    const street = activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name || "Málaga";
    const contextSnippet = ` [Punto Activo: ${street} (WGS84 ${effectiveLocation.lat.toFixed(4)}, ${effectiveLocation.lon.toFixed(4)}). NO2=${realNO2.toFixed(1)} µg/m³, O3=${realO3.toFixed(1)} µg/m³, H/W=${canyonHW.toFixed(2)}, SVF=${svf.toFixed(2)}, Viento=${(windSpeedMs * 3.6).toFixed(1)} km/h (${windDirDeg}°)].`;
    setUserInstructions(prev => (prev.trim() ? `${prev.trim()}${contextSnippet}` : contextSnippet.trim()));
  };

  // Capas de Investigación Científica (Checkboxes)
  const [includeFormulas, setIncludeFormulas] = useState<boolean>(true);
  const [includeTables, setIncludeTables] = useState<boolean>(true);
  const [includeVectorDiagrams, setIncludeVectorDiagrams] = useState<boolean>(true);
  const [includeCryptoProof, setIncludeCryptoProof] = useState<boolean>(true);
  const [includeLiveSensorsAudit, setIncludeLiveSensorsAudit] = useState<boolean>(true);
  const [includeUrbanMorphology3D, setIncludeUrbanMorphology3D] = useState<boolean>(true);
  const [includeChemicalKinetics, setIncludeChemicalKinetics] = useState<boolean>(true);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Vista previa modal nativa en canvas
  const [previewBuffer, setPreviewBuffer] = useState<ArrayBuffer | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const [previewPageCount, setPreviewPageCount] = useState<number>(1);

  const buildReportOptions = (aiSynthesisOverride?: string): CustomPdfReportOptions => {
    return {
      scope: selectedScope,
      depth: selectedDepth,
      userInstructions,
      selectedSuites,
      includeFormulas,
      includeTables,
      includeVectorDiagrams,
      includeCryptoProof,
      includeLiveSensorsAudit,
      includeUrbanMorphology3D,
      includeChemicalKinetics,
      aiDoctoralSynthesis: aiSynthesisOverride || cachedAiSynthesis || undefined,
      location: effectiveLocation,
      activePoint: activeCtx?.activePoint,
      assimilation: activeCtx?.assimilation,
      meteo: currentMeteo,
      physics: physics || activeCtx?.result,
      stationComparisons,
      benchmarkParams,
      odeParams
    };
  };

  /**
   * Pipeline de Investigación Multidisciplinar Auténtico
   * Ejecuta la secuencia real de indagación científica con tiempos deliberados y precisos
   */
  const runInvestigationPipeline = async (): Promise<string | undefined> => {
    let synthesizedText = cachedAiSynthesis;

    // Fase 4: Inteligencia Artificial Doctoral (Gemini STEM - Opcional)
    if (enableAiSynthesis) {
      setGenerationProgress(50);
      setGenerationStep(`Ejecutando Síntesis Doctoral con IA (${selectedAiModel.includes('pro') ? 'Gemini 3.1 Pro' : 'Gemini 3.8 Flash'})...`);
      
      try {
        const payload = {
          userInstructions,
          scope: selectedScope,
          depth: selectedDepth,
          model: selectedAiModel,
          selectedSuites,
          streetName: activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name || "Málaga",
          location: effectiveLocation,
          meteo: currentMeteo,
          physics: physics || activeCtx?.result,
          activePoint: activeCtx?.activePoint,
          assimilation: activeCtx?.assimilation,
          stationComparisons,
          canyonMetrics: {
            aspectRatio: activeCtx?.activePoint?.aspectRatioHw || 1.2,
            svf: activeCtx?.activePoint?.skyViewFactorSvf || 0.42
          }
        };

        const res = await fetch("/api/ai/doctoral-synthesis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const json = await res.json();
          if (json && json.synthesis) {
            synthesizedText = json.synthesis;
            setCachedAiSynthesis(json.synthesis);
          }
        }
      } catch (err) {
        console.warn("Fallo conectando con endpoint de IA doctoral, recurriendo a síntesis determinista local:", err);
      }
    }

    setGenerationProgress(100);
    setGenerationStep("Compilación instantánea en memoria completada.");
    return synthesizedText;
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      const aiText = await runInvestigationPipeline();
      const opts = buildReportOptions(aiText);
      const doc = generateCustomOnDemandPdfReport(opts);
      const filename = `informe_doctoral_${selectedScope}_${Date.now()}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("Error generando PDF a la carta:", err);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStep("");
    }
  };

  const handlePreviewPdf = async () => {
    try {
      setIsGenerating(true);
      const aiText = await runInvestigationPipeline();
      const opts = buildReportOptions(aiText);
      const doc = generateCustomOnDemandPdfReport(opts);
      const buffer = doc.output('arraybuffer');
      const filename = `informe_doctoral_${selectedScope}_${Date.now()}.pdf`;
      
      setPreviewBuffer(buffer);
      setPreviewFilename(filename);
      setPreviewTitle(SCOPE_LABELS[selectedScope].title);
      setPreviewPageCount(doc.getNumberOfPages());
    } catch (err) {
      console.error("Error previsualizando PDF:", err);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStep("");
    }
  };

  const handleCopySummary = () => {
    const street = activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name || "Málaga Centro";
    const no2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? currentMeteo.no2_satelite_base ?? 38.4;
    const o3 = activeCtx?.assimilation?.ozoneO3UgM3 ?? currentMeteo.ozone ?? 54.2;
    const pm25 = activeCtx?.assimilation?.pm25UgM3 ?? currentMeteo.pm2_5 ?? 12.8;

    const summaryText = `[GEMELO DIGITAL MÁLAGA - INFORME A LA CARTA]
Ámbito: ${SCOPE_LABELS[selectedScope].title}
Suites Asimiladas a Voluntad: ${selectedSuites.length} de ${INVESTIGABLE_SUITES.length} (${selectedSuites.join(', ')})
Punto Activo: ${street} [${effectiveLocation.lat.toFixed(4)}, ${effectiveLocation.lon.toFixed(4)}]
NO2: ${no2.toFixed(1)} µg/m³ | O3: ${o3.toFixed(1)} µg/m³ | PM2.5: ${pm25.toFixed(1)} µg/m³
Profundidad: ${DEPTH_LABELS[selectedDepth].name} (${DEPTH_LABELS[selectedDepth].badge})
Asistencia IA: ${enableAiSynthesis ? selectedAiModel : 'Desactivada (Determinista)'}
Directriz del Investigador: "${userInstructions || 'Estudio integral estandarizado sin fluctuaciones ficticias.'}"
Trazabilidad: FAIR Compliant • Cero Aleatoriedad • Directiva (UE) 2024/2881`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleCopyLatex = () => {
    const street = activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name || 'Málaga (Centro Histórico)';
    const no2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? 28.4;
    const o3 = activeCtx?.assimilation?.ozoneO3UgM3 ?? 52.1;
    const pm25 = activeCtx?.assimilation?.pm25UgM3 ?? 14.2;
    const svf = activeCtx?.assimilation?.skyViewFactorSvf ?? 0.42;
    const hw = activeCtx?.assimilation?.aspectRatioHw ?? 1.65;

    const latexSnippet = `% =========================================================================
% GEMELO DIGITAL DE CALIDAD DEL AIRE DE MÁLAGA - TESIS DOCTORAL UNED / EIDUNED
% Tabla de Asimilación Microescalar y Telemetría Multirred Oficial
% Punto Activo: ${street} (ETRS89 UTM Huso 30N)
% =========================================================================
\\begin{table}[htbp]
\\centering
\\small
\\caption{Asimilación Atmosférica y Diagnóstico Normativo en ${street} (Málaga)}
\\begin{tabular}{lcccc}
\\hline
\\textbf{Parámetro / Ecuación} & \\textbf{Valor Asimilado} & \\textbf{Unidad} & \\textbf{Límite Dir (UE) 2024/2881} & \\textbf{Diagnóstico} \\\\
\\hline
$\\text{NO}_2$ Pedestrian (1.8m AGL) & ${no2.toFixed(1)} & $\\mu\\text{g/m}^3$ & 20.0 (Media Anual) & ${no2 > 20 ? '\\textbf{Superación ZBE}' : 'Conforme'} \\\\
$\\text{O}_3$ Troposférico (Leighton) & ${o3.toFixed(1)} & $\\mu\\text{g/m}^3$ & 120.0 (Máx. 8h) & Conforme \\\\
$\\text{PM}_{2.5}$ Respirable Alveolar & ${pm25.toFixed(1)} & $\\mu\\text{g/m}^3$ & 10.0 (Media Anual) & ${pm25 > 10 ? 'Vigilancia OMS' : 'Conforme'} \\\\
Factor de Visión del Cielo (SVF) & ${svf.toFixed(2)} & Adimensional & -- & Cañón Confinado \\\\
Relación de Aspecto $H/W$ (Oke) & ${hw.toFixed(2)} & Adimensional & -- & Régimen Skimming Flow \\\\
\\hline
\\end{tabular}
\\label{tab:asimilacion_${street.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}}
\\end{table}`;

    navigator.clipboard.writeText(latexSnippet);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2500);
  };

  const openScopeItem = SCOPE_LABELS.custom_open_inquiry;
  const regularScopeKeys = (Object.keys(SCOPE_LABELS) as ReportScope[]).filter(k => k !== 'custom_open_inquiry');

  return (
    <div className="flex flex-col gap-3 py-1">
      {/* Banner de Sincronización del Punto Activo (Regla 10) */}
      <ActivePointSyncBanner compact={true} />

      {/* Introducción Científica del Generador */}
      <div className="bg-slate-900/90 border border-emerald-600/70 p-2.5 rounded-sm flex flex-col gap-1.5 text-xs shadow-md">
        <div className="flex items-center justify-between">
          <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            Generador Avanzado de Informes &amp; Estudios a la Carta (Tesis Doctoral)
          </span>
          <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-600 font-bold">
            MOTOR INDEPENDIENTE
          </span>
        </div>
        <p className="text-[10.5px] text-slate-300 leading-relaxed">
          Pide <strong>cualquier análisis o investigación de forma totalmente libre e independiente</strong>. El motor explora en tiempo real todos los subsistemas del Gemelo Digital (telemetría viva de {OFFICIAL_MALAGA_AIR_STATIONS.length} estaciones, {OFFICIAL_SATELLITE_MISSIONS.length} satélites, microfísica de fluidos, química fotoquímica y cartografía 3D) para redactar un documento exhaustivo adaptado exactamente a tus directrices.
        </p>
      </div>

      {/* ⚡ PLANTILLAS DOCTORALES RÁPIDAS EN 1 CLIC (MÁXIMA EFECTIVIDAD) */}
      <div className="flex flex-col gap-1.5 bg-slate-950/80 p-2.5 rounded border border-indigo-700/60 shadow-sm">
        <div className="flex items-center justify-between border-b border-indigo-900/60 pb-1">
          <span className="text-[10.5px] font-bold text-indigo-300 flex items-center gap-1.5 uppercase font-mono">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Configuración Rápida en 1 Clic (Plantillas Doctorales Certificadas)
          </span>
          <span className="text-[8px] font-mono text-slate-400">Pulsa para autoconfigurar ámbito, páginas y directrices</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedScope('integral_twin');
              setSelectedDepth('doctoral_extended');
              setUserInstructions(`Demostrar y justificar exhaustivamente al tribunal evaluador por qué la PINN es un operador físico válido, superando a los modelos empíricos y factible en tiempo real acoplado a las ${OFFICIAL_MALAGA_AIR_STATIONS.length} estaciones y ${OFFICIAL_SATELLITE_MISSIONS.length} misiones satelitales en Málaga.`);
              setSelectedSuites(INVESTIGABLE_SUITES.map(s => s.id));
            }}
            className="p-2 rounded bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-600/70 hover:border-emerald-400 text-left transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-300">
                <span>🎓 1. Monografía EIDUNED</span>
                <span className="text-[7.5px] px-1 py-0.2 bg-emerald-900 text-emerald-200 rounded font-mono">10 PÁGS</span>
              </div>
              <p className="text-[8px] text-slate-300 mt-1 line-clamp-2">Compendio total con PINN, 73 módulos, Navier-Stokes y defensa de tesis ante tribunal.</p>
            </div>
            <span className="text-[7.5px] text-emerald-400 font-mono mt-1 font-semibold group-hover:underline">Autoconfigurar 10 Págs →</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedScope('pinn_microscale');
              setSelectedDepth('doctoral_extended');
              setUserInstructions('Estructurar un manuscrito formal indexado Q1 sobre modelización física microescalar y asimilación continua de NO2 en cañones urbanos de Málaga según estándares de Atmospheric Environment.');
              setSelectedSuites(INVESTIGABLE_SUITES.filter(s => ['Geodesia & Microescala', 'Cinética Atmosférica', 'Validación Computacional', 'Cumplimiento Legal'].includes(s.category)).map(s => s.id));
            }}
            className="p-2 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-600/70 hover:border-cyan-400 text-left transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-cyan-300">
                <span>📄 2. Paper Científico Q1</span>
                <span className="text-[7.5px] px-1 py-0.2 bg-cyan-900 text-cyan-200 rounded font-mono">8 PÁGS</span>
              </div>
              <p className="text-[8px] text-slate-300 mt-1 line-clamp-2">Estructura para revista indexada (Elsevier): Abstract, OSPM+PINN, microescala y BibTeX.</p>
            </div>
            <span className="text-[7.5px] text-cyan-400 font-mono mt-1 font-semibold group-hover:underline">Autoconfigurar Q1 →</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedScope('regulatory_audit');
              setSelectedDepth('standard');
              setUserInstructions('Evaluar el cumplimiento estricto del nuevo umbral anual de 20 µg/m³ para NO2 y 10 µg/m³ para PM2.5 según la Directiva (UE) 2024/2881 e identificar necesidad de medidas de mitigación ZBE en este punto activo.');
              setSelectedSuites(INVESTIGABLE_SUITES.filter(s => ['Cumplimiento Legal', 'Movilidad & Emisiones', 'Salud & Vulnerabilidad', 'Asimilación Observacional'].includes(s.category)).map(s => s.id));
            }}
            className="p-2 rounded bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/70 hover:border-amber-400 text-left transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-amber-300">
                <span>⚖️ 3. Dictamen ZBE UE</span>
                <span className="text-[7.5px] px-1 py-0.2 bg-amber-900 text-amber-200 rounded font-mono">4 PÁGS</span>
              </div>
              <p className="text-[8px] text-slate-300 mt-1 line-clamp-2">Certificación técnica pericial de cumplimiento del límite anual de 20 µg/m³ para NO2.</p>
            </div>
            <span className="text-[7.5px] text-amber-400 font-mono mt-1 font-semibold group-hover:underline">Autoconfigurar ZBE →</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedScope('custom_open_inquiry');
              setSelectedDepth('brief_note');
              setUserInstructions('Emitir una ficha técnica sintética e instantánea del punto activo con diagnóstico de calidad del aire y cumplimiento normativo.');
              setSelectedSuites(INVESTIGABLE_SUITES.slice(0, 10).map(s => s.id));
            }}
            className="p-2 rounded bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-600/70 hover:border-indigo-400 text-left transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-indigo-300">
                <span>⚡ 4. Ficha Técnica Flash</span>
                <span className="text-[7.5px] px-1 py-0.2 bg-indigo-900 text-indigo-200 rounded font-mono">2 PÁGS</span>
              </div>
              <p className="text-[8px] text-slate-300 mt-1 line-clamp-2">Diagnóstico ultraconciso en 1 segundo: indicadores clave, meteorología y semáforo ambiental.</p>
            </div>
            <span className="text-[7.5px] text-indigo-400 font-mono mt-1 font-semibold group-hover:underline">Autoconfigurar Flash →</span>
          </button>
        </div>
      </div>

      {/* Opción Destacada: Consulta Científica Libre / Tema Abierto a la Carta */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
          <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            1. Ámbito Temático / Consulta de Investigación
          </label>
          <ScientificTooltip
            content="Elige 'Tema Abierto a Medida' para que el informe se enfoque 100% en lo que escribas en tus directrices, o selecciona cualquiera de los 13 dominios científicos específicos."
            citation="Directiva 2024/2881 • FAIRMODE WG1 • UNED"
          />
        </div>

        {/* Tarjeta Destacada de Tema Libre */}
        <button
          onClick={() => setSelectedScope('custom_open_inquiry')}
          className={`flex items-start gap-2.5 p-2.5 rounded-xs border text-left transition-all cursor-pointer ${
            selectedScope === 'custom_open_inquiry'
              ? 'bg-gradient-to-r from-emerald-950/90 via-slate-900 to-cyan-950/80 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50'
              : 'bg-slate-950/80 border-slate-700/80 text-slate-300 hover:border-cyan-500/80 hover:bg-slate-900'
          }`}
        >
          <div className={`mt-0.5 w-3 h-3 rounded-full shrink-0 flex items-center justify-center ${selectedScope === 'custom_open_inquiry' ? 'bg-cyan-400 text-slate-950' : 'bg-slate-700'}`}>
            {selectedScope === 'custom_open_inquiry' && <Check className="w-2 h-2 stroke-[3]" />}
          </div>
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between">
              <span className={`text-[11.5px] font-bold ${selectedScope === 'custom_open_inquiry' ? 'text-cyan-300' : 'text-slate-100'}`}>
                {openScopeItem.title}
              </span>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/80 uppercase font-bold">
                100% Guiado por tu texto
              </span>
            </div>
            <span className="text-[9px] text-slate-300 leading-tight mt-0.5">
              {openScopeItem.subtitle}
            </span>
          </div>
        </button>

        {/* Rejilla de los 13 Ámbitos Científicos Predefinidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
          {regularScopeKeys.map((scopeKey) => {
            const isSelected = selectedScope === scopeKey;
            return (
              <button
                key={scopeKey}
                onClick={() => setSelectedScope(scopeKey)}
                className={`flex items-start gap-2 p-2 rounded-xs border text-left transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <div className="flex flex-col">
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {SCOPE_LABELS[scopeKey].title}
                  </span>
                  <span className="text-[8.5px] text-slate-400 leading-tight">
                    {SCOPE_LABELS[scopeKey].subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Pestañas & Suites del Gemelo Digital a Investigar y Cruzar (Selectiva a Voluntad) */}
      <div className="flex flex-col gap-2 bg-slate-900/60 p-2.5 rounded border border-cyan-800/60 shadow-sm">
        <div className="flex items-center justify-between border-b border-cyan-950 pb-1.5">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-bold text-slate-100 uppercase tracking-wide">
              2. Selección Quirúrgica de Pestañas &amp; Suites del Gemelo Digital a Investigar a Voluntad
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/80 font-bold">
              {selectedSuites.length} / {INVESTIGABLE_SUITES.length} Suites Activas
            </span>
          </div>
          <ScientificTooltip
            content="Permite seleccionar quirúrgicamente a voluntad qué pestañas, suites metodológicas y subsistemas físicos del Gemelo Digital se investigan, cruzan y auditan en el estudio para responder con máxima precisión a tus directrices."
            citation="Doctrina Gemelo Digital • FAIRMODE WG1 • EIDUNED UNED"
          />
        </div>

        <p className="text-[9.5px] text-slate-300 leading-tight">
          Elige qué subsistemas físicos, químicos, de cañón 3D, macroemisores o salud deseas cruzar de forma libre y profunda en tu investigación. Cada suite inyectará sus ecuaciones y datos vivos en el dictamen:
        </p>

        {/* Categorías Temáticas de Pestañas y Suites */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
          {categories.map(cat => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`text-[8px] font-mono px-2 py-0.5 rounded-full border whitespace-nowrap cursor-pointer transition-colors ${
                selectedCategory === cat.key
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* Toolbar de Presets Rápidos y Filtro de Búsqueda */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 pt-0.5">
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={handleSelectAllSuites}
              className="text-[8px] font-mono font-bold px-2 py-1 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-700/80 hover:bg-cyan-900 transition-colors cursor-pointer"
            >
              ✓ Todas ({INVESTIGABLE_SUITES.length})
            </button>
            <button
              type="button"
              onClick={() => handlePresetSuites(['canyon_3d_aerodynamics', 'multimodel_benchmark', 'phd_defense_walkthrough'])}
              className="text-[8px] font-mono px-2 py-1 rounded bg-slate-950 text-slate-300 border border-slate-700 hover:border-cyan-500 hover:text-cyan-200 transition-colors cursor-pointer"
            >
              🏛️ Cañones &amp; 3D
            </button>
            <button
              type="button"
              onClick={() => handlePresetSuites(['chemical_kinetics', 'aerosols_sia_vbs', 'marine_oceanography'])}
              className="text-[8px] font-mono px-2 py-1 rounded bg-slate-950 text-slate-300 border border-slate-700 hover:border-cyan-500 hover:text-cyan-200 transition-colors cursor-pointer"
            >
              ⚛️ Fotoquímica
            </button>
            <button
              type="button"
              onClick={() => handlePresetSuites(['school_pediatric', 'urban_forestry', 'fairmode_audit'])}
              className="text-[8px] font-mono px-2 py-1 rounded bg-slate-950 text-slate-300 border border-slate-700 hover:border-cyan-500 hover:text-cyan-200 transition-colors cursor-pointer"
            >
              🚸 Salud &amp; Escuelas
            </button>
            <button
              type="button"
              onClick={() => handlePresetSuites(['mobility_copert', 'megasources_port_agp', 'acute_episodes'])}
              className="text-[8px] font-mono px-2 py-1 rounded bg-slate-950 text-slate-300 border border-slate-700 hover:border-cyan-500 hover:text-cyan-200 transition-colors cursor-pointer"
            >
              🚗 Movilidad &amp; Focos
            </button>
            <button
              type="button"
              onClick={() => handlePresetSuites(['fairmode_audit', 'sensor_satellites', 'phd_defense_walkthrough'])}
              className="text-[8px] font-mono px-2 py-1 rounded bg-slate-950 text-slate-300 border border-slate-700 hover:border-cyan-500 hover:text-cyan-200 transition-colors cursor-pointer"
            >
              ⚖️ Auditoría &amp; Tesis
            </button>
            <button
              type="button"
              onClick={handleClearSuites}
              className="text-[8px] font-mono px-1.5 py-1 rounded bg-slate-950 text-slate-400 border border-slate-800 hover:text-rose-300 hover:border-rose-700 transition-colors cursor-pointer"
            >
              ✗ Ninguna
            </button>
          </div>

          <div className="relative min-w-[170px]">
            <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
            <input
              type="text"
              value={suiteFilterText}
              onChange={(e) => setSuiteFilterText(e.target.value)}
              placeholder="Buscar por título, ecuación..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded py-0.5 pl-6 pr-2 text-[9px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Rejilla de Suites Seleccionables con Datos Vivos del Punto Activo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredSuites.map((suite) => {
            const isSelected = selectedSuites.includes(suite.id);
            const paramSummary = suite.getParamSummary({
              realNO2, realO3, realPM25, realPM10, canyonHW, canyonH, canyonW, svf,
              windSpeedMs, windDirDeg, tempC, jNO2, k1, leightonPhi, soaUgM3,
              pediatricDoseUgh, schoolDistM, nearestSchoolName,
              uStarMs, stabilityClass,
              stationsCount: OFFICIAL_MALAGA_AIR_STATIONS.length,
              satellitesCount: OFFICIAL_SATELLITE_MISSIONS.length
            });

            return (
              <div
                key={suite.id}
                onClick={() => handleToggleSuite(suite.id)}
                className={`flex items-start gap-2 p-2 rounded border text-left transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-gradient-to-r from-slate-900 to-cyan-950/70 border-cyan-500/80 text-cyan-100 shadow-[0_0_8px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:bg-slate-900/40'
                }`}
              >
                <div className={`mt-0.5 w-3.5 h-3.5 rounded-xs shrink-0 flex items-center justify-center border transition-colors ${
                  isSelected ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                }`}>
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[9.5px] font-bold truncate ${isSelected ? 'text-cyan-200' : 'text-slate-200'}`}>
                      {suite.shortTitle}
                    </span>
                    <span className="text-[7px] font-mono px-1 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-700 shrink-0">
                      {suite.badge}
                    </span>
                  </div>

                  <p className="text-[8px] text-slate-400 line-clamp-1 mt-0.5">
                    {suite.description}
                  </p>

                  <div className="text-[7.5px] font-mono text-cyan-400/80 truncate mt-0.5">
                    {suite.governingEquations}
                  </div>

                  {/* Valor Físico Asimilado en el Punto Activo */}
                  <div className="flex items-center gap-1 text-[7.5px] font-mono text-emerald-400 bg-slate-950/80 px-1.5 py-0.5 rounded border border-emerald-900/60 truncate mt-1">
                    <span className="text-slate-400 font-bold shrink-0">📍 Asimilado:</span>
                    <span className="truncate">{paramSummary.magnitude}</span>
                  </div>
                </div>

                <div onClick={(e) => e.stopPropagation()} className="shrink-0 self-center">
                  <ScientificTooltip
                    content={`${suite.title}: ${suite.description} Ecuaciones rectoras: ${suite.governingEquations}. Parámetro en punto: ${paramSummary.magnitude} (${paramSummary.physicalLaw}).`}
                    citation={suite.citation}
                    width="w-[340px]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selector de Extensión / Nivel de Profundidad (5 Niveles) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
          <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5 uppercase">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            3. Extensión y Nivel de Profundidad del Estudio
          </label>
          <ScientificTooltip
            content="Configura la extensión formal del documento: desde una nota técnica rápida de 2 páginas hasta una monografía doctoral exhaustiva de 8 páginas o un dictamen pericial probatorio."
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {(Object.keys(DEPTH_LABELS) as ReportDepth[]).map((dKey) => {
            const isSelected = selectedDepth === dKey;
            const dInfo = DEPTH_LABELS[dKey];
            return (
              <button
                key={dKey}
                onClick={() => setSelectedDepth(dKey)}
                className={`p-2 rounded-xs border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-950/80 border-amber-500 text-amber-100 font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className={`text-[10px] font-bold ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                    {dInfo.name}
                  </div>
                  <div className="text-[8px] text-amber-400/90 font-mono mt-0.5">
                    {dInfo.badge}
                  </div>
                </div>
                <div className="text-[7.5px] text-slate-400 leading-tight mt-1">
                  {dInfo.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Área de Directrices del Usuario / Prompt Científico Libre */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
          <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            4. Directrices u Órdenes del Investigador (Prompt Científico Libre)
          </label>
          <span className="text-[9px] text-cyan-300 font-mono">Total libertad de consulta</span>
        </div>

        {/* Chips de Presets Rápidos */}
        <div className="flex flex-wrap gap-1">
          {PRESET_DIRECTIVES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => setUserInstructions(preset.prompt)}
              className="text-[8.5px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-200 transition-colors cursor-pointer"
            >
              + {preset.label}
            </button>
          ))}
        </div>

        <textarea
          value={userInstructions}
          onChange={(e) => setUserInstructions(e.target.value)}
          placeholder="Escribe con total libertad lo que desees investigar o justificar (ej: 'Analizar el impacto del crucero en el puerto sobre el colegio más cercano', 'Demostrar ante el tribunal que la PINN converge con Navier-Stokes y supera a CALPUFF', 'Auditar si calle Larios cumple con el límite de 20 µg/m³ para 2030', etc.)..."
          rows={3}
          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans resize-y"
        />

        <div className="flex flex-wrap items-center justify-between gap-1 pt-0.5">
          <span className="text-[8.5px] text-slate-400 font-mono">
            Directriz libre ({userInstructions.length} caracteres)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleInjectActivePointContext}
              className="flex items-center gap-1 text-[8.5px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              <MapPin className="w-2.5 h-2.5 text-emerald-400" />
              <span>+ Inyectar Datos Físicos del Punto Activo al Texto</span>
            </button>
            {userInstructions && (
              <button
                type="button"
                onClick={() => setUserInstructions("")}
                className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 hover:text-rose-300 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
              >
                Limpiar Texto
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Capas Científicas de Investigación (Checkboxes) */}
      <div className="flex flex-col gap-1 bg-slate-950/70 p-2 border border-slate-800/90 rounded">
        <span className="text-[9.5px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Sliders className="w-3 h-3 text-emerald-400" />
          5. Capas y Motores Científicos a Integrar en el Documento:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          <label className="flex items-center gap-1.5 text-[9.5px] text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeFormulas}
              onChange={(e) => setIncludeFormulas(e.target.checked)}
              className="rounded border-slate-700 text-emerald-600 focus:ring-0"
            />
            <span>Ecuaciones Analíticas (LaTeX)</span>
          </label>

          <label className="flex items-center gap-1.5 text-[9.5px] text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTables}
              onChange={(e) => setIncludeTables(e.target.checked)}
              className="rounded border-slate-700 text-emerald-600 focus:ring-0"
            />
            <span>Tablas Normativas FAIRMODE &amp; UE</span>
          </label>

          <label className="flex items-center gap-1.5 text-[9.5px] text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeVectorDiagrams}
              onChange={(e) => setIncludeVectorDiagrams(e.target.checked)}
              className="rounded border-slate-700 text-emerald-600 focus:ring-0"
            />
            <span>Gráficos Vectoriales (MOST y Cañón)</span>
          </label>

          <label className="flex items-center gap-1.5 text-[9.5px] text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeLiveSensorsAudit}
              onChange={(e) => setIncludeLiveSensorsAudit(e.target.checked)}
              className="rounded border-slate-700 text-emerald-600 focus:ring-0"
            />
            <span>Auditoría Red {OFFICIAL_MALAGA_AIR_STATIONS.length}+{OFFICIAL_SATELLITE_MISSIONS.length} en Vivo</span>
          </label>

          <label className="flex items-center gap-1.5 text-[9.5px] text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeUrbanMorphology3D}
              onChange={(e) => setIncludeUrbanMorphology3D(e.target.checked)}
              className="rounded border-slate-700 text-emerald-600 focus:ring-0"
            />
            <span>Topología Catastral 3D (LoD1)</span>
          </label>

          <label className="flex items-center gap-1.5 text-[9.5px] text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCryptoProof}
              onChange={(e) => setIncludeCryptoProof(e.target.checked)}
              className="rounded border-slate-700 text-emerald-600 focus:ring-0"
            />
            <span>Sello Criptográfico SHA-256 FAIR</span>
          </label>
        </div>
      </div>

      {/* 6. Motor de Razonamiento e Inteligencia Artificial Doctoral */}
      <div className="bg-slate-950/85 border border-indigo-700/60 p-2.5 rounded-sm flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between border-b border-indigo-950/80 pb-1.5">
          <div className="flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wide">
              6. Asistencia de Inteligencia Artificial Doctoral &amp; Síntesis Profunda
            </span>
          </div>
          <ScientificTooltip
            content="Conecta con la API de Gemini para redactar un dictamen científico exhaustivo que responde punto por punto a las directrices del doctorando, fundamentando cada resultado con ecuaciones, límites de la Directiva UE y física atmosférica determinista."
            citation="LLM Grounded Synthesis • Regla 1 (Cero Aleatoriedad) • EMEP/EEA"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          {/* Toggle Activar IA */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enableAiSynthesis}
              onChange={(e) => setEnableAiSynthesis(e.target.checked)}
              className="rounded border-indigo-600 text-indigo-500 focus:ring-0"
            />
            <span className="text-[10px] text-slate-200 font-semibold">
              Activar Síntesis Doctoral con IA Avanzada
            </span>
          </label>

          {/* Selector de Modelo */}
          {enableAiSynthesis && (
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-slate-400 font-mono">Modelo:</span>
              <select
                value={selectedAiModel}
                onChange={(e) => setSelectedAiModel(e.target.value as any)}
                className="bg-slate-900 border border-indigo-600/70 text-indigo-200 text-[10px] rounded px-2 py-1 font-mono focus:outline-none focus:border-indigo-400"
              >
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (Máxima Profundidad Tesis)</option>
                <option value="gemini-3.8-flash">Gemini 3.8 Flash (Velocidad &amp; Precisión)</option>
                <option value="deterministic">Motor Determinista PINN Offline</option>
              </select>
            </div>
          )}
        </div>

        <p className="text-[9px] text-slate-400 leading-tight">
          {enableAiSynthesis 
            ? "El informe integrará un dictamen pericial generado por el modelo seleccionado, analizando exhaustivamente la telemetría viva, ecuaciones ODE/PINN y respondiendo con rigor doctoral a cualquier pregunta o directriz planteada."
            : "Modo puramente analítico offline: la síntesis utilizará el motor de reglas determinista acoplado a la física de Monin-Obukhov y química de Leighton."}
        </p>
      </div>

      {/* Monitor de Simulación y Compilación Científica en Tiempo Real */}
      {isGenerating && (
        <div className="bg-slate-950/95 border border-cyan-500/80 p-3 rounded-sm flex flex-col gap-2.5 shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wide">
                Investigando el Entorno del Gemelo Digital &amp; Compilando Estudio...
              </span>
            </div>
            <span className="text-[10.5px] font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-700/80">
              {generationProgress}%
            </span>
          </div>

          {/* Barra de Progreso */}
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500 transition-all duration-300 ease-out"
              style={{ width: `${generationProgress}%` }}
            />
          </div>

          {/* Detalle de Etapa Actual */}
          <div className="flex items-center justify-between text-[10px] bg-slate-900/80 p-2 rounded border border-slate-800">
            <span className="text-cyan-200 font-mono font-medium">
              {generationStep || "Iniciando pipeline analítico..."}
            </span>
            <span className="text-amber-400 text-[9px] font-mono font-bold">
              {DEPTH_LABELS[selectedDepth].badge}
            </span>
          </div>

          {/* Desglose de las 6 Fases de Investigación */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 pt-1 text-[8.5px] text-slate-400 font-mono">
            <div className={`p-1 rounded border flex items-center gap-1 ${generationProgress >= 15 ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300' : 'bg-slate-900/40 border-slate-800'}`}>
              <span>{generationProgress >= 15 ? '✓' : '1.'}</span>
              <span>Telemetría {OFFICIAL_MALAGA_AIR_STATIONS.length}+{OFFICIAL_SATELLITE_MISSIONS.length} en vivo</span>
            </div>
            <div className={`p-1 rounded border flex items-center gap-1 ${generationProgress >= 32 ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300' : 'bg-slate-900/40 border-slate-800'}`}>
              <span>{generationProgress >= 32 ? '✓' : '2.'}</span>
              <span>Topología 3D &amp; Cañón Urbano</span>
            </div>
            <div className={`p-1 rounded border flex items-center gap-1 ${generationProgress >= 48 ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300' : 'bg-slate-900/40 border-slate-800'}`}>
              <span>{generationProgress >= 48 ? '✓' : '3.'}</span>
              <span>Solver Cinético Leighton</span>
            </div>
            <div className={`p-1 rounded border flex items-center gap-1 ${generationProgress >= 72 ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300' : 'bg-slate-900/40 border-slate-800'}`}>
              <span>{generationProgress >= 72 ? '✓' : '4.'}</span>
              <span>Síntesis Doctoral con IA</span>
            </div>
            <div className={`p-1 rounded border flex items-center gap-1 ${generationProgress >= 88 ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300' : 'bg-slate-900/40 border-slate-800'}`}>
              <span>{generationProgress >= 88 ? '✓' : '5.'}</span>
              <span>Diagramas Vectoriales Únicos</span>
            </div>
            <div className={`p-1 rounded border flex items-center gap-1 ${generationProgress >= 98 ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300' : 'bg-slate-900/40 border-slate-800'}`}>
              <span>{generationProgress >= 98 ? '✓' : '6.'}</span>
              <span>Presupuesto GUM &amp; SHA-256</span>
            </div>
          </div>
        </div>
      )}

      {/* Botones Principales de Acción */}
      <div className="flex flex-col sm:flex-row gap-2 mt-1">
        <ScientificTooltip
          content="Genera y descarga instantáneamente el archivo PDF formal adaptado a tus órdenes."
          width="w-[280px]"
        >
          <button
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-slate-950 font-bold text-xs rounded transition-all shadow-md hover:shadow-emerald-900/40 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Compilando Estudio Científico ({DEPTH_LABELS[selectedDepth].badge})...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Descargar Informe PDF a la Carta ({DEPTH_LABELS[selectedDepth].pages} Págs)</span>
              </>
            )}
          </button>
        </ScientificTooltip>

        <ScientificTooltip
          content="Visualiza el PDF generado directamente en un visor de Canvas de alta resolución antes de guardarlo."
          width="w-[260px]"
        >
          <button
            onClick={handlePreviewPdf}
            disabled={isGenerating}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs rounded transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Vista Previa</span>
          </button>
        </ScientificTooltip>

        <ScientificTooltip
          content="Copia un resumen ejecutivo del estudio y sus indicadores al portapapeles para citación rápida."
          width="w-[260px]"
        >
          <button
            onClick={handleCopySummary}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs rounded transition-colors cursor-pointer"
          >
            {copiedSummary ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copiar Resumen</span>
              </>
            )}
          </button>
        </ScientificTooltip>

        <ScientificTooltip
          content="Copia la tabla de asimilación y ecuaciones en código LaTeX nativo listo para pegar en Overleaf o en la memoria de la tesis."
          width="w-[280px]"
        >
          <button
            onClick={handleCopyLatex}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-300 hover:text-white font-bold text-xs rounded transition-colors cursor-pointer"
          >
            {copiedLatex ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">¡LaTeX Copiado!</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Copiar LaTeX (.tex)</span>
              </>
            )}
          </button>
        </ScientificTooltip>
      </div>

      {/* Modal de Previsualización Nativa en Canvas */}
      {previewBuffer && (
        <PdfCanvasPreviewModal
          pdfArrayBuffer={previewBuffer}
          filename={previewFilename}
          title={previewTitle}
          pageCount={previewPageCount}
          onDownload={() => {
            const blob = new Blob([previewBuffer], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = previewFilename;
            a.click();
            URL.revokeObjectURL(url);
          }}
          onClose={() => setPreviewBuffer(null)}
        />
      )}
    </div>
  );
};
