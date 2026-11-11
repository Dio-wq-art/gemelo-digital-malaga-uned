import React, { useState, useMemo } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { useActivePoint } from '../context/ActivePointContext';
import {
  ARANA_CEMENT_PLANT_DATA,
  MALAGA_AIRPORT_LEMG_DATA,
  evaluateAranaCementPlume,
  evaluateAirportWesternImpact,
  evaluateActivePointMacroSourcesImpact,
  ARANA_NEARBY_DETECTORS,
  AIRPORT_NEARBY_DETECTORS
} from '../lib/majorEmissionsSources';
import { AranaKilnInteractiveDiagram } from './AranaKilnInteractiveDiagram';
import { AirportLtoInteractiveDiagram } from './AirportLtoInteractiveDiagram';
import { CementToxicologyThesisReport } from './CementToxicologyThesisReport';
import {
  Factory,
  Plane,
  Wind,
  MapPin,
  ShieldCheck,
  Activity,
  Download,
  Copy,
  Check,
  Flame,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Building2,
  Car,
  Compass,
  FileText,
  FileSpreadsheet,
  FileJson,
  Sparkles,
  Scale,
  Biohazard,
  BookOpen,
  Radio,
  Satellite,
  Waves
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export interface MajorEmissionsSourcesModalProps {
  onClose: () => void;
  initialTab?: 'arana_east' | 'airport_west' | 'overview' | 'open_science';
  flyToLocation?: (lat: number, lon: number, zoom?: number, pitch?: number) => void;
}

export const MajorEmissionsSourcesModal: React.FC<MajorEmissionsSourcesModalProps> = ({
  onClose,
  initialTab = 'arana_east',
  flyToLocation
}) => {
  const [activeTab, setActiveTab] = useState<'arana_east' | 'airport_west' | 'overview' | 'open_science'>(initialTab);
  const [aranaViewMode, setAranaViewMode] = useState<'todo' | 'toxicologia_tesis' | 'operativa'>('todo');
  const [copiedType, setCopiedType] = useState<'latex' | 'geojson' | 'csv' | null>(null);

  const activePointCtx = useActivePoint();
  const activePoint = activePointCtx?.activePoint;
  const assimilation = activePointCtx?.assimilation;
  const data: any = activePointCtx?.data || {};

  const windSpeedMs = assimilation ? (assimilation.windSpeedKmh / 3.6) : (data?.velocidad_viento_km_h ? data.velocidad_viento_km_h / 3.6 : 3.8);
  const windDirDeg = typeof data?.direccion_viento_grados === 'number' ? data.direccion_viento_grados : 160;
  const tempVal = typeof assimilation?.temperatureC === 'number' ? assimilation.temperatureC : (typeof data?.temperatura_malaga === 'number' ? data.temperatura_malaga : 24.5);
  const solarRad = typeof data?.shortwave_radiation === 'number' ? data.shortwave_radiation : 650;

  const latPoint = activePointCtx?.location?.lat || 36.7213;
  const lonPoint = activePointCtx?.location?.lon || -4.4214;
  const pointName = activePoint?.name || 'Centro de Málaga';

  // Evaluaciones físicas deterministas
  const aranaPlume = useMemo(() => {
    return evaluateAranaCementPlume(windSpeedMs, windDirDeg, tempVal, solarRad);
  }, [windSpeedMs, windDirDeg, tempVal, solarRad]);

  const airportImpact = useMemo(() => {
    return evaluateAirportWesternImpact(windSpeedMs, windDirDeg, tempVal, 450);
  }, [windSpeedMs, windDirDeg, tempVal]);

  const activePointMacroImpact = useMemo(() => {
    return evaluateActivePointMacroSourcesImpact(pointName, latPoint, lonPoint, windSpeedMs, windDirDeg, tempVal);
  }, [pointName, latPoint, lonPoint, windSpeedMs, windDirDeg, tempVal]);

  // Datos comparativos anuales de masa
  const massComparisonData = useMemo(() => [
    {
      pollutant: 'NOx (t/año)',
      'Cementera La Araña (Este)': ARANA_CEMENT_PLANT_DATA.annualNOxTon,
      'Aeropuerto AGP (LTO Oeste)': MALAGA_AIRPORT_LEMG_DATA.annualNOxLtoTon,
      'Autovía MA-21 Acceso': MALAGA_AIRPORT_LEMG_DATA.corridorRoadNOxTonYear
    },
    {
      pollutant: 'SO2 (t/año)',
      'Cementera La Araña (Este)': ARANA_CEMENT_PLANT_DATA.annualSO2Ton,
      'Aeropuerto AGP (LTO Oeste)': 45,
      'Autovía MA-21 Acceso': 8
    },
    {
      pollutant: 'PM10 (t/año)',
      'Cementera La Araña (Este)': ARANA_CEMENT_PLANT_DATA.annualPM10Ton,
      'Aeropuerto AGP (LTO Oeste)': MALAGA_AIRPORT_LEMG_DATA.annualNvPmSootTon,
      'Autovía MA-21 Acceso': 72
    }
  ], []);

  // Generadores FAIR
  const generateGeoJson = () => {
    return JSON.stringify({
      type: 'FeatureCollection',
      metadata: {
        title: 'Macro-Emisores de Málaga: La Araña vs Aeropuerto AGP',
        project: 'Tesis Doctoral - Gemelo Digital de Málaga',
        timestampISO: new Date().toISOString(),
        windConditions: { windSpeedMs, windDirDeg, tempVal }
      },
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [ARANA_CEMENT_PLANT_DATA.lon, ARANA_CEMENT_PLANT_DATA.lat] },
          properties: {
            facilityId: ARANA_CEMENT_PLANT_DATA.facilityId,
            name: ARANA_CEMENT_PLANT_DATA.facilityName,
            type: 'Planta de Cemento (Chimenea 85m)',
            annualNOxTon: ARANA_CEMENT_PLANT_DATA.annualNOxTon,
            annualSO2Ton: ARANA_CEMENT_PLANT_DATA.annualSO2Ton,
            plumeEffectiveHeightM: aranaPlume.effectiveReleaseHeightM,
            downwindBearingDeg: aranaPlume.downwindAngleDeg
          }
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [MALAGA_AIRPORT_LEMG_DATA.lon, MALAGA_AIRPORT_LEMG_DATA.lat] },
          properties: {
            facilityId: MALAGA_AIRPORT_LEMG_DATA.facilityId,
            name: MALAGA_AIRPORT_LEMG_DATA.facilityName,
            type: 'Infraestructura Aeroportuaria (Pistas LTO)',
            annualNOxTon: MALAGA_AIRPORT_LEMG_DATA.annualNOxLtoTon,
            annualCOLtoTon: MALAGA_AIRPORT_LEMG_DATA.annualCOLtoTon,
            corridorAadt: MALAGA_AIRPORT_LEMG_DATA.corridorRoadTrafficAadt,
            primaryImpactDistrict: 'Carretera de Cádiz (Distrito 7)'
          }
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lonPoint, latPoint] },
          properties: {
            pointName,
            deltaNO2AranaUgM3: activePointMacroImpact.deltaNO2AranaUgM3,
            deltaNO2AirportUgM3: activePointMacroImpact.deltaNO2AirportUgM3,
            predominantMacroSource: activePointMacroImpact.predominantMacroSource
          }
        }
      ]
    }, null, 2);
  };

  const generateLatex = () => {
    return `% -------------------------------------------------------------
% BALANCE COMPARATIVO DE MACRO-EMISORES DE MÁLAGA
% Tesis Doctoral: Planta de La Araña (Este) vs Aeropuerto AGP (Oeste)
% -------------------------------------------------------------
\\begin{table}[htbp]
\\centering
\\small
\\caption{Balance de Emisiones y Parámetros Físicos: La Araña vs Aeropuerto AGP}
\\label{tab:macro_emisores_malaga}
\\begin{tabular}{lrrrl}
\\hline
\\textbf{Parámetro / Especie} & \\textbf{La Araña (Este)} & \\textbf{Aeropuerto AGP (Oeste)} & \\textbf{Unidad} & \\textbf{Normativa / Fuente} \\\\
\\hline
Identificador Oficial & ES-PRTR-290001 & LEMG / AGP & --- & E-PRTR / OACI Anexo 16 \\\\
Régimen de Emisión & Continuo Elevado & Multifásico (LTO) & --- & IPPC vs OACI \\\\
Altura Física de Foco & 85.0 & Superficial (0--15) & m & Chimenea vs Pistas \\\\
Sobreelevación Holland $\\Delta h$ & ${aranaPlume.plumeRiseDeltaHM.toFixed(1)} & --- & m & Ecuación de Holland (1953) \\\\
Altura Efectiva $H_{\\text{eff}}$ & ${aranaPlume.effectiveReleaseHeightM.toFixed(1)} & 15.0 & m & Cota de dispersión \\\\
Emisión Anual $\\text{NO}_x$ & ${ARANA_CEMENT_PLANT_DATA.annualNOxTon.toLocaleString()} & ${MALAGA_AIRPORT_LEMG_DATA.annualNOxLtoTon.toLocaleString()} & t/año & Declaración PRTR / OACI \\\\
Emisión Anual $\\text{SO}_2$ & ${ARANA_CEMENT_PLANT_DATA.annualSO2Ton.toLocaleString()} & 45 & t/año & Clinkerización vs Jet-A1 \\\\
Emisión Anual Partículas & ${ARANA_CEMENT_PLANT_DATA.annualPM10Ton} ($\\text{PM}_{10}$) & ${MALAGA_AIRPORT_LEMG_DATA.annualNvPmSootTon} (Soot) & t/año & Molienda vs Black Carbon \\\\
Emisión Anual $\\text{CO}_2$ Fósil & ${ARANA_CEMENT_PLANT_DATA.annualCO2FossilTon.toLocaleString()} & ${(MALAGA_AIRPORT_LEMG_DATA.annualFuelBurnTon * 3.16).toFixed(0)} & t/año & Descarbonatación vs Turbinas \\\\
Zona Principal de Inmisión & La Araña / El Palo & Carretera de Cádiz & --- & Este vs Distrito 7 \\\\
Población Directa Expuesta & $\\approx 25.000$ & $> 120.000$ & hab. & Censo Municipal Málaga \\\\
\\hline
\\end{tabular}
\\end{table}`;
  };

  const generateCsv = () => {
    return `Parametro,La_Arana_Este,Aeropuerto_AGP_Oeste,Unidad,Marco_Regulatorio
Identificador,ES-PRTR-290001,LEMG_AGP,---,E-PRTR / OACI
Regimen_Emision,Continuo_Elevado,Multifasico_LTO,---,IPPC vs OACI
Altura_Foco_m,85.0,15.0,m,Chimenea vs Pistas
Elevacion_Holland_m,${aranaPlume.plumeRiseDeltaHM.toFixed(1)},0.0,m,Holland (1953)
Altura_Efectiva_m,${aranaPlume.effectiveReleaseHeightM.toFixed(1)},15.0,m,Cota de dispersion
Emision_Anual_NOx_t,${ARANA_CEMENT_PLANT_DATA.annualNOxTon},${MALAGA_AIRPORT_LEMG_DATA.annualNOxLtoTon},t/ano,E-PRTR / OACI
Emision_Anual_SO2_t,${ARANA_CEMENT_PLANT_DATA.annualSO2Ton},45,t/ano,E-PRTR / Jet-A1
Emision_Anual_PM10_t,${ARANA_CEMENT_PLANT_DATA.annualPM10Ton},${MALAGA_AIRPORT_LEMG_DATA.annualNvPmSootTon},t/ano,E-PRTR / Black Carbon
Emision_Anual_CO2_t,${ARANA_CEMENT_PLANT_DATA.annualCO2FossilTon},${(MALAGA_AIRPORT_LEMG_DATA.annualFuelBurnTon * 3.16).toFixed(0)},t/ano,Fosil vs Queroseno
Poblacion_Expuesta,25000,120000,hab,Censo Municipal`;
  };

  const handleCopy = (type: 'latex' | 'geojson' | 'csv', content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDownload = (type: 'json' | 'csv' | 'tex', content: string, filename: string) => {
    const mimeTypes: Record<string, string> = {
      json: 'application/json',
      csv: 'text/csv;charset=utf-8;',
      tex: 'text/plain;charset=utf-8;'
    };
    const blob = new Blob([content], { type: mimeTypes[type] });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="MACRO-EMISORES DE MÁLAGA: LA ARAÑA (ESTE) VS AEROPUERTO AGP (OESTE)"
      subtitle="Modelización Físico-Química de Grandes Focos • E-PRTR vs OACI LTO • Tesis Doctoral"
      icon={<Factory className="w-4 h-4 text-amber-400" />}
      onClose={onClose}
      className="w-full max-w-4xl max-h-[90vh]"
      initialPositionClass="top-12 left-1/2 -translate-x-1/2"
      defaultCollapsed={false}
    >
      <div className="p-4 overflow-y-auto max-h-[78vh] space-y-4 font-sans text-slate-200">
        
        {/* 1. NAVEGADOR DE PESTAÑAS ERGONÓMICO */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 font-mono text-xs w-full sm:w-auto">
            <ScientificTooltip
              title="Cementera de La Araña (Foco Industrial Este)"
              content="Emisiones térmicas de horno continuo de clínker (E-PRTR), combustión mixta gas/coque, metales pesados y transporte litoral bajo régimen de brisas."
              citation="Registro E-PRTR España / Directiva 2010/75/UE"
            >
              <button
                onClick={() => setActiveTab('arana_east')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 font-bold cursor-pointer ${
                  activeTab === 'arana_east'
                    ? 'bg-amber-600 text-slate-950 shadow-md scale-102'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Factory className="w-3.5 h-3.5" />
                <span>1. La Araña (Este)</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Aeropuerto de Málaga-Costa del Sol AGP (Foco Oeste)"
              content="Ciclo Landing-Takeoff (LTO OACI Anexo 16), turbinas CFM56/LEAP, mecanismo térmico de Zeldovich y dispersión en la cuenca del Guadalhorce."
              citation="OACI Doc 9889 / EMEP/EEA 1.A.3.a"
            >
              <button
                onClick={() => setActiveTab('airport_west')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 font-bold cursor-pointer ${
                  activeTab === 'airport_west'
                    ? 'bg-sky-500 text-slate-950 shadow-md scale-102'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Plane className="w-3.5 h-3.5" />
                <span>2. Aeropuerto AGP (Oeste)</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Balance Comparativo y Especiación Química"
              content="Comparativa cruzada de flujos masivos anuales (t/año), razón NOx/PM/SO₂ y firma toxicológica relativa en la bahía de Málaga."
              citation="Directiva 2008/50/CE / EIDUNED"
            >
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 font-bold cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-purple-600 text-white shadow-md scale-102'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>3. Balance Comparativo</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Ciencia Abierta y Exportación FAIR"
              content="Descarga interoperable de los inventarios de emisión, metadatos certificados y tablas analíticas para integración en la memoria de tesis."
              citation="FAIR Data Principles / Directiva INSPIRE"
            >
              <button
                onClick={() => setActiveTab('open_science')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 font-bold cursor-pointer ${
                  activeTab === 'open_science'
                    ? 'bg-emerald-600 text-slate-950 shadow-md scale-102'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>4. Ciencia Abierta FAIR</span>
              </button>
            </ScientificTooltip>
          </div>

          <div className="text-[10px] font-mono text-slate-400 text-right hidden sm:block">
            <span>AEMET: <strong>{windSpeedMs.toFixed(1)} m/s</strong> ({windDirDeg}°) • {tempVal.toFixed(1)}°C</span>
          </div>
        </div>

        {/* 2. BANNER DE IMPACTO EN EL PUNTO ACTIVO SELECCIONADO */}
        <div className="bg-[#0b1324] border border-cyan-800/40 p-2.5 rounded-xl text-[11px] font-mono space-y-2 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Punto Activo:</span>{' '}
                <strong className="text-cyan-300 font-bold">{pointName}</strong>{' '}
                <span className="text-[9.5px] text-slate-500">({latPoint.toFixed(4)}°N, {lonPoint.toFixed(4)}°W)</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-slate-950/80 px-2 py-1 rounded-md border border-slate-800 text-[10.5px]">
                <span className="text-amber-400 font-bold">La Araña (d={activePointMacroImpact.distToAranaKm} km):</span>{' '}
                <span className="text-slate-200 font-bold">+{activePointMacroImpact.deltaNO2AranaUgM3} µg/m³</span>
              </div>
              <div className="bg-slate-950/80 px-2 py-1 rounded-md border border-slate-800 text-[10.5px]">
                <span className="text-sky-400 font-bold">Aeropuerto (d={activePointMacroImpact.distToAirportKm} km):</span>{' '}
                <span className="text-slate-200 font-bold">+{activePointMacroImpact.deltaNO2AirportUgM3} µg/m³</span>
              </div>

              {flyToLocation && (
                <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
                  <ScientificTooltip content="Navegación cinemática 3D a la chimenea de la Fábrica de Cemento de La Araña (Foco Industrial Este).">
                    <button
                      onClick={() => flyToLocation(36.7118, -4.3168, 16, 50)}
                      className="px-2 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 text-[9.5px] font-bold rounded-md transition-all cursor-pointer"
                    >
                      La Araña
                    </button>
                  </ScientificTooltip>
                  <ScientificTooltip content="Navegación cinemática 3D a las cabeceras de pista del Aeropuerto de Málaga-Costa del Sol AGP (Foco Oeste).">
                    <button
                      onClick={() => flyToLocation(36.6749, -4.4780, 15.5, 45)}
                      className="px-2 py-1 bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 text-[9.5px] font-bold rounded-md transition-all cursor-pointer"
                    >
                      Aeropuerto AGP
                    </button>
                  </ScientificTooltip>
                </div>
              )}
            </div>
          </div>

          {/* Fila explicativa de rumbo sotavento y dispersión física */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-800/80 text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-slate-400">Trayectoria Sotavento:</span>
              <span className="text-amber-300 font-semibold">{activePointMacroImpact.aranaTrajectoryDescription}</span>
            </div>
            <div className="text-[9px] text-slate-500 italic hidden sm:block">
              * +0 µg/m³ indica que el cono gaussiano de dispersión no incide sobre el punto activo con el viento AEMET en vivo.
            </div>
          </div>
        </div>

        {/* =========================================================
            PESTAÑA 1: PLANTA CEMENTERA LA ARAÑA (ESTE)
            ========================================================= */}
        {activeTab === 'arana_east' && (
          <div className="space-y-3">
            {/* Sub-Navegación de La Araña: Operativa vs Toxicología/Tesis */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-1 bg-slate-900/90 rounded-lg border border-slate-800 text-[10.5px] font-mono">
              <span className="text-[10px] text-slate-400 font-bold px-2 uppercase flex items-center gap-1.5">
                <Factory className="w-3.5 h-3.5 text-amber-400" />
                <span>Vistas de La Araña:</span>
              </span>

              <div className="flex flex-wrap gap-1">
                <ScientificTooltip content="Ver expediente completo: parámetros de ingeniería del horno, dispersión Holland y evaluación toxicológica integral.">
                  <button
                    onClick={() => setAranaViewMode('todo')}
                    className={`px-2.5 py-1 rounded-md transition-all font-bold cursor-pointer ${
                      aranaViewMode === 'todo'
                        ? 'bg-amber-600 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    📑 Todo el Dossier
                  </button>
                </ScientificTooltip>
                <ScientificTooltip content="Parámetros cinéticos de chimenea (diámetro, velocidad de salida, temperatura) y cálculo analítico de sobrelevación de penacho según fórmula de Holland (1953).">
                  <button
                    onClick={() => setAranaViewMode('operativa')}
                    className={`px-2.5 py-1 rounded-md transition-all font-bold cursor-pointer ${
                      aranaViewMode === 'operativa'
                        ? 'bg-amber-600 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    🏭 Operativa & Holland en Vivo
                  </button>
                </ScientificTooltip>
                <ScientificTooltip content="Evidencia toxicológica epidemiológica del Centro Nacional de Epidemiología (ISCIII) sobre co-combustión de harinas cárnicas/neumáticos y riesgo relativo de neoplasias.">
                  <button
                    onClick={() => setAranaViewMode('toxicologia_tesis')}
                    className={`px-2.5 py-1 rounded-md transition-all font-bold cursor-pointer flex items-center gap-1 ${
                      aranaViewMode === 'toxicologia_tesis'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-red-950/80 text-red-300 hover:bg-red-900 border border-red-800/80'
                    }`}
                  >
                    <Biohazard className="w-3 h-3 text-red-400" />
                    <span>☣️ ¿Por qué son tan Dañinas? (ISCIII & Tesis)</span>
                  </button>
                </ScientificTooltip>
              </div>
            </div>

            {/* SECCIÓN OPERATIVA Y DIAGRAMA DE HOLLAND */}
            {(aranaViewMode === 'operativa' || aranaViewMode === 'todo') && (
              <div className="space-y-3">
                {/* Diagrama a Color Interactivo de La Araña */}
                <AranaKilnInteractiveDiagram
                  ambientTempC={tempVal}
                  liveWindSpeedMs={windSpeedMs}
                  liveWindDirDeg={windDirDeg}
                  onFlyToMap={flyToLocation ? () => flyToLocation(36.7118, -4.3168, 16, 50) : undefined}
                />

                {/* DETECTORES Y ESTACIONES ASIMILADAS EN EL ENTORNO (LA ARAÑA) */}
                <div className="bg-slate-950/80 border border-emerald-800/40 p-3 rounded-xl space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-emerald-400" />
                      <span>DETECTORES & REDES OFICIALES ASIMILADAS (ENTORNO LA ARAÑA)</span>
                    </span>
                    <span className="text-[9.5px] text-emerald-400 font-bold bg-emerald-950/90 border border-emerald-700/60 px-2 py-0.5 rounded">
                      3 Sensores Oficiales
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {ARANA_NEARBY_DETECTORS.map(det => (
                      <ScientificTooltip
                        key={det.id}
                        title={det.name}
                        content={det.operationalRole}
                        regulatory={det.referenceStandard}
                        citation={det.network}
                        position="bottom"
                      >
                        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 hover:border-emerald-600/60 transition-all cursor-help space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">{det.typeLabel}</span>
                            <span className="text-[8.5px] text-slate-400 font-mono">d={det.distanceToSourceKm} km</span>
                          </div>
                          <h4 className="text-[10px] font-bold text-slate-100 truncate">{det.name}</h4>
                          <p className="text-[8.5px] text-slate-400 leading-tight">{det.directionFromSource}</p>
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {det.keySensors.map(s => (
                              <span key={s} className="px-1 py-0.2 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 rounded text-[7.5px]">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </ScientificTooltip>
                    ))}
                  </div>
                </div>

                {/* Parámetros Técnicos de Chimenea */}
                <div className="bg-slate-950/80 border border-amber-900/40 p-3 rounded-xl space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Factory className="w-4 h-4 text-amber-400" />
                      <span>PARÁMETROS TÉCNICOS DE LA CHIMENEA (E-PRTR ES-PRTR-290001)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Directiva 2010/75/UE</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                    <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[8.5px]">Altura Chimenea (Hs):</span>
                      <span className="font-bold text-slate-100 text-xs">{ARANA_CEMENT_PLANT_DATA.stackHeightM} m</span>
                      <span className="text-[8px] text-slate-400 block">Cota base: +15 m s.n.m.</span>
                    </div>
                    <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[8.5px]">Diámetro Interior (d):</span>
                      <span className="font-bold text-slate-100 text-xs">{ARANA_CEMENT_PLANT_DATA.stackDiameterM} m</span>
                      <span className="text-[8px] text-slate-400 block">Área: 6.16 m²</span>
                    </div>
                    <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[8.5px]">Velocidad de Salida (vs):</span>
                      <span className="font-bold text-cyan-300 text-xs">{ARANA_CEMENT_PLANT_DATA.stackVelocityMs} m/s</span>
                      <span className="text-[8px] text-slate-400 block">Caudal: 410.000 Nm³/h</span>
                    </div>
                    <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[8.5px]">Temperatura Gases (Ts):</span>
                      <span className="font-bold text-amber-300 text-xs">{ARANA_CEMENT_PLANT_DATA.gasTemperatureC} °C</span>
                      <span className="text-[8px] text-slate-400 block">483.15 K</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN DE TOXICOLOGÍA & INFORME DE TESIS CIENTÍFICA (ISCIII) */}
            {(aranaViewMode === 'toxicologia_tesis' || aranaViewMode === 'todo') && (
              <div className="space-y-3 pt-1">
                <CementToxicologyThesisReport />
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            PESTAÑA 2: AEROPUERTO DE MÁLAGA AGP (OESTE)
            ========================================================= */}
        {activeTab === 'airport_west' && (
          <div className="space-y-3">
            {/* Único Diagrama Maestro Interactivo del Aeropuerto AGP */}
            <AirportLtoInteractiveDiagram
              ambientTempC={tempVal}
              liveWindSpeedMs={windSpeedMs}
              liveWindDirDeg={windDirDeg}
              dailyFlightOps={450}
              onFlyToMap={flyToLocation ? () => flyToLocation(36.6749, -4.4780, 15.5, 45) : undefined}
            />

            {/* DETECTORES Y ESTACIONES ASIMILADAS EN EL ENTORNO (AEROPUERTO AGP) */}
            <div className="bg-slate-950/80 border border-sky-800/40 p-3 rounded-xl space-y-2 font-mono text-[11px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-sky-400" />
                  <span>DETECTORES & REDES OFICIALES ASIMILADAS (ENTORNO AEROPUERTO AGP)</span>
                </span>
                <span className="text-[9.5px] text-sky-400 font-bold bg-sky-950/90 border border-sky-700/60 px-2 py-0.5 rounded">
                  3 Sensores Oficiales
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {AIRPORT_NEARBY_DETECTORS.map(det => (
                  <ScientificTooltip
                    key={det.id}
                    title={det.name}
                    content={det.operationalRole}
                    regulatory={det.referenceStandard}
                    citation={det.network}
                    position="bottom"
                  >
                    <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 hover:border-sky-500/60 transition-all cursor-help space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider">{det.typeLabel}</span>
                        <span className="text-[8.5px] text-slate-400 font-mono">d={det.distanceToSourceKm} km</span>
                      </div>
                      <h4 className="text-[10px] font-bold text-slate-100 truncate">{det.name}</h4>
                      <p className="text-[8.5px] text-slate-400 leading-tight">{det.directionFromSource}</p>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {det.keySensors.map(s => (
                          <span key={s} className="px-1 py-0.2 bg-sky-950/80 text-sky-300 border border-sky-800/60 rounded text-[7.5px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </ScientificTooltip>
                ))}
              </div>
            </div>

            {/* Afección Poblacional a Carretera de Cádiz */}
            <div className="bg-slate-950/80 border border-sky-900/40 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-mono">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>AFECCIÓN POBLACIONAL: DISTRITO 7 (CARRETERA DE CÁDIZ)</span>
                </span>
                <span className="text-[10px] text-slate-400">Población expuesta: &gt;115.000 hab.</span>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-slate-300 font-sans text-[11px] leading-relaxed">
                <p>
                  El distrito de <strong>Carretera de Cádiz</strong> (barrios de <em>Huelin, La Paz, San Andrés, Girón</em>) presenta la mayor densidad demográfica de Málaga (&gt;30.000 hab/km²). Durante las horas centrales del día, el régimen de <strong>Brisa Marina del Suroeste (180° - 230°)</strong> advecta los penachos de despegue de la Pista 13/31 y las emisiones de la autovía MA-21 directamente sobre este corredor urbano.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                  <strong className="text-emerald-400 block font-sans">Medida 1: Rodaje Monomotor (Single-Engine Taxiing)</strong>
                  <span className="text-slate-400 text-[9.5px]">Reduce un 35% el consumo de Jet-A1 y las emisiones de CO/HC durante los 26 min de rodaje en plataforma.</span>
                </div>
                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                  <strong className="text-sky-400 block font-sans">Medida 2: Electrificación 400Hz en Fingers AENA</strong>
                  <span className="text-slate-400 text-[9.5px]">Prohíbe el uso de la turbina auxiliar APU diésel en estacionamiento, reduciendo el NOx superficial en 42 t/año.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            PESTAÑA 3: BALANCE COMPARATIVO (ESTE VS OESTE)
            ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            
            {/* Tarjetas Comparativas de los 2 Polos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
              
              {/* Tarjeta La Araña (Este) */}
              <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-600/40 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between border-b border-amber-800/40 pb-1.5">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                    <Factory className="w-4 h-4 text-amber-400" />
                    <span>POLO ORIENTAL: LA ARAÑA</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[9px] font-bold">
                    E-PRTR IPPC
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-300 text-[10.5px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Instalación:</span>
                    <span className="text-slate-200 font-bold">Heidelberg Materials (La Araña)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Chimenea Principal:</span>
                    <span className="text-amber-200 font-bold">Hs = 85 m • Ø 2.8 m • 210 °C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Elevación Holland (Δh):</span>
                    <span className="text-emerald-300 font-bold">+{aranaPlume.plumeRiseDeltaHM} m (Heff: {aranaPlume.effectiveReleaseHeightM} m)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Emisión Anual NOx:</span>
                    <span className="text-amber-300 font-bold">{ARANA_CEMENT_PLANT_DATA.annualNOxTon.toLocaleString()} t/año (128.5 g/s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Emisión Anual SO2:</span>
                    <span className="text-slate-200 font-bold">{ARANA_CEMENT_PLANT_DATA.annualSO2Ton.toLocaleString()} t/año (34.2 g/s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Emisión Anual CO2 Fósil:</span>
                    <span className="text-rose-300 font-bold">{ARANA_CEMENT_PLANT_DATA.annualCO2FossilTon.toLocaleString()} t/año</span>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-2 rounded-lg border border-amber-900/40 text-[10px] text-slate-300 font-sans">
                  <strong>Régimen Actual:</strong> {aranaPlume.dispersionRegimeName}. {aranaPlume.receptorImpactSummary}
                </div>

                <button
                  onClick={() => {
                    setActiveTab('arana_east');
                    setAranaViewMode('toxicologia_tesis');
                  }}
                  className="w-full py-1.5 px-2 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Biohazard className="w-3.5 h-3.5 text-red-400" />
                  <span>Dossier Tesis: ¿Por qué son tan Dañinas? (ISCIII)</span>
                </button>
              </div>

              {/* Tarjeta Aeropuerto AGP (Oeste) */}
              <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-sky-600/40 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between border-b border-sky-800/40 pb-1.5">
                  <span className="font-bold text-sky-300 flex items-center gap-1.5 text-xs">
                    <Plane className="w-4 h-4 text-sky-400" />
                    <span>POLO OCCIDENTAL: AEROPUERTO AGP</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 text-[9px] font-bold">
                    OACI LTO TIER 3
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-300 text-[10.5px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Infraestructura:</span>
                    <span className="text-slate-200 font-bold">Aeropuerto Málaga-Costa del Sol</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pistas Operativas:</span>
                    <span className="text-sky-200 font-bold">13/31 (3.200 m) & 12/30 (2.750 m)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tráfico Diario Medio:</span>
                    <span className="text-sky-300 font-bold">450 operaciones LTO/día</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Emisión Anual NOx LTO:</span>
                    <span className="text-amber-300 font-bold">{MALAGA_AIRPORT_LEMG_DATA.annualNOxLtoTon.toLocaleString()} t/año (turbofans)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Autovía MA-21 (Acceso):</span>
                    <span className="text-rose-300 font-bold">86.500 veh/día ({MALAGA_AIRPORT_LEMG_DATA.corridorRoadNOxTonYear} t NOx/año)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Black Carbon (Soot nvPM):</span>
                    <span className="text-slate-200 font-bold">{MALAGA_AIRPORT_LEMG_DATA.annualNvPmSootTon} t/año</span>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-2 rounded-lg border border-sky-900/40 text-[10px] text-slate-300 font-sans">
                  <strong>Régimen Actual:</strong> {airportImpact.dispersionRegimeName}. {airportImpact.receptorImpactSummary}
                </div>
              </div>
            </div>

            {/* Gráfico Comparativo de Emisiones Anuales */}
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2 font-mono">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>COMPARACIÓN DE MASA ANUAL EMITIDA (TONELADAS / AÑO)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Fuentes: E-PRTR vs OACI Doc 9889</span>
              </div>

              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={massComparisonData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="pollutant" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} unit=" t" />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Cementera La Araña (Este)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Aeropuerto AGP (LTO Oeste)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Autovía MA-21 Acceso" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            PESTAÑA 4: CIENCIA ABIERTA (FAIR EXPORT)
            ========================================================= */}
        {activeTab === 'open_science' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="bg-slate-950/80 border border-emerald-800/40 p-3.5 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-emerald-300 text-xs">REPRODUCIBILIDAD CIENTÍFICA & EXPORTACIÓN FAIR</h4>
                </div>
                <span className="text-[10px] text-slate-400">FAIR Data Principles</span>
              </div>

              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                Descargue o copie directamente los datos del balance territorial de macro-emisores de Málaga para su inclusión en publicaciones científicas, informes regulatorios o modelos geoespaciales GIS.
              </p>

              {/* Botones de Exportación */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* 1. LaTeX */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="font-bold text-amber-300 text-xs block">Tabla LaTeX (Tesis)</span>
                    <span className="text-[10px] text-slate-400 font-sans">Formato citable para memorias doctorales y papers IEEE/Elsevier.</span>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <ScientificTooltip content="Copiar tabla LaTeX \begin{table} al portapapeles con formato citable para la memoria doctoral.">
                      <button
                        onClick={() => handleCopy('latex', generateLatex())}
                        className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedType === 'latex' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedType === 'latex' ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </ScientificTooltip>
                    <ScientificTooltip content="Descargar archivo fuente .tex compilable con los datos certificados de los macroemisores.">
                      <button
                        onClick={() => handleDownload('tex', generateLatex(), 'tabla_macro_emisores_malaga.tex')}
                        className="py-1 px-2 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>.tex</span>
                      </button>
                    </ScientificTooltip>
                  </div>
                </div>

                {/* 2. GeoJSON */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="font-bold text-cyan-300 text-xs block">GeoJSON Espacial</span>
                    <span className="text-[10px] text-slate-400 font-sans">Capas georreferenciadas WGS84 para QGIS, ArcGIS y Mapbox.</span>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <ScientificTooltip content="Copiar FeatureCollection GeoJSON estandarizada al portapapeles.">
                      <button
                        onClick={() => handleCopy('geojson', generateGeoJson())}
                        className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedType === 'geojson' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedType === 'geojson' ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </ScientificTooltip>
                    <ScientificTooltip content="Descargar archivo espacial .geojson georreferenciado (WGS84 EPSG:4326).">
                      <button
                        onClick={() => handleDownload('json', generateGeoJson(), 'macro_emisores_malaga.geojson')}
                        className="py-1 px-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>.json</span>
                      </button>
                    </ScientificTooltip>
                  </div>
                </div>

                {/* 3. CSV */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="font-bold text-emerald-300 text-xs block">Dataset Tabular CSV</span>
                    <span className="text-[10px] text-slate-400 font-sans">Matriz de emisiones para análisis estadístico en R o Python Pandas.</span>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <ScientificTooltip content="Copiar dataset CSV de emisiones tabulares al portapapeles.">
                      <button
                        onClick={() => handleCopy('csv', generateCsv())}
                        className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedType === 'csv' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedType === 'csv' ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </ScientificTooltip>
                    <ScientificTooltip content="Descargar matriz tabular .csv para procesado con Python (Pandas) o R.">
                      <button
                        onClick={() => handleDownload('csv', generateCsv(), 'balance_macro_emisores_malaga.csv')}
                        className="py-1 px-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>.csv</span>
                      </button>
                    </ScientificTooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </DraggableWindow>
  );
};
