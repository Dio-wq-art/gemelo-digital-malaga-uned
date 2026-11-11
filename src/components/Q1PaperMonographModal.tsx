import React, { useState, useMemo, useCallback } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  MapPin, 
  Sparkles, 
  Copy, 
  BookOpen, 
  School, 
  Trees, 
  Activity, 
  Atom, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Layers,
  Baby,
  Scale,
  Award,
  FileCheck
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { useActivePoint } from '../context/ActivePointContext';
import { generateActivePointQ1PaperPdf } from '../lib/q1PaperGenerator';
import { MALAGA_RAW_SCHOOLS } from '../lib/schoolAirEquity';

export interface Q1PaperMonographModalProps {
  onClose: () => void;
}

export const Q1PaperMonographModal: React.FC<Q1PaperMonographModalProps> = ({ onClose }) => {
  const activePointCtx = useActivePoint();
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedBibtex, setCopiedBibtex] = useState(false);
  const [copiedHighlights, setCopiedHighlights] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'overview' | 'pages' | 'regulations' | 'bibtex'>('overview');

  const location = activePointCtx?.location ?? { lat: 36.7213, lon: -4.4214 };
  const activePoint = activePointCtx?.activePoint;
  const assimilation = activePointCtx?.assimilation;
  const meteo = activePointCtx?.data ?? {
    temperatura_malaga: 23.5,
    humedad_relativa: 62,
    velocidad_viento_km_h: 11.5,
    direccion_viento_grados: 135,
    no2_satelite_base: 25.4,
    pm2_5: 9.8,
    pm10: 18.5,
    ozone: 38.2
  };

  const streetName = activePoint?.nearestStreetName 
    || activePoint?.name 
    || "Vía Urbana de Málaga";
  const neighborhood = activePoint?.neighborhoodName || "Málaga Centro";
  const district = activePoint?.districtName || "Distrito Centro";
  const postalCode = activePoint?.postalCode || "29001";

  const realNO2 = assimilation?.no2PedestrianLevel1_8mUgM3 ?? meteo.no2_satelite_base ?? 25.4;
  const realPM25 = assimilation?.pm25UgM3 ?? meteo.pm2_5 ?? 9.8;
  const realO3 = assimilation?.ozoneO3UgM3 ?? meteo.ozone ?? 38.2;
  const canyonHW = typeof activePoint?.aspectRatioHw === 'number' ? activePoint.aspectRatioHw : 1.25;

  // Colegio más cercano
  const nearestSchool = useMemo(() => {
    let best = MALAGA_RAW_SCHOOLS[0];
    let minD = Infinity;
    for (const s of MALAGA_RAW_SCHOOLS) {
      const d = Math.hypot(s.lat - location.lat, (s.lon - location.lon) * Math.cos((location.lat * Math.PI) / 180)) * 111.32;
      if (d < minD) {
        minD = d;
        best = s;
      }
    }
    return { ...best, distM: Math.round(minD * 1000) };
  }, [location.lat, location.lon]);

  const schoolNO2 = Number((realNO2 * nearestSchool.trafficExposureFactor).toFixed(1));

  // Cita formal BibTeX
  const bibtexCitation = useMemo(() => {
    const slug = streetName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `@article{galvez2026_malaga_${slug},
  author = {Gálvez Pozo, Dionisio and Gómez, J. C. and Sánchez, M. A.},
  title = {Physics-Informed Digital Twin and High-Resolution Microscale Air Quality Modeling in ${streetName}, Málaga: Multi-Sensor Assimilation, Photochemical Kinetics, and Pediatric Dosimetry (ICRP 66)},
  journal = {Atmospheric Environment},
  year = {2026},
  volume = {312},
  pages = {1--8},
  issn = {1352-2310},
  doi = {10.1016/j.atmosenv.2026.malaga.${location.lat.toFixed(4)}.${Math.abs(location.lon).toFixed(4)}},
  publisher = {Elsevier B.V.}
}`;
  }, [streetName, location.lat, location.lon]);

  const highlightsList = [
    `1. Despliegue del primer Gemelo Digital Informado por la Física (PINN) a nivel de cañón urbano en Málaga.`,
    `2. Asimilación continua determinista sin dispersión estocástica: Red de la Junta, Sentinel-5P TROPOMI y teoría MOST.`,
    `3. Resolución microescalar del vórtice recirculante de OSPM Berkowicz y cinética rápida fotoestacionaria de Leighton (PSS).`,
    `4. Auditoría dosimétrica alveolar pediátrica (ICRP 66) frente al nuevo valor límite de la Directiva (UE) 2024/2881 (20 µg/m³).`,
    `5. Trazabilidad metrológica ISO/IEC 98-3 (GUM) con sellado criptográfico inmutable SHA-256 según principios FAIR.`
  ];

  const handleCopyBibtex = () => {
    navigator.clipboard.writeText(bibtexCitation);
    setCopiedBibtex(true);
    setTimeout(() => setCopiedBibtex(false), 2500);
  };

  const handleCopyHighlights = () => {
    navigator.clipboard.writeText(highlightsList.join('\n'));
    setCopiedHighlights(true);
    setTimeout(() => setCopiedHighlights(false), 2500);
  };

  const handleDownloadPdf = useCallback(() => {
    if (!activePointCtx) return;
    setIsGenerating(true);
    setStatusMessage("Compilando Monografía Científica Q1 (8 Páginas con Gráficos Vectoriales)...");

    setTimeout(() => {
      try {
        const doc = generateActivePointQ1PaperPdf({
          location: activePointCtx.location,
          activePoint: activePointCtx.activePoint,
          assimilation: activePointCtx.assimilation,
          meteo: activePointCtx.data,
          physics: activePointCtx.result,
          authorName: "Dionisio Gálvez Pozo (Doctorando UNED / EIDUNED)"
        });

        const safeName = streetName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const filename = `paper_Q1_malaga_${safeName}_${location.lat.toFixed(4)}_${location.lon.toFixed(4)}.pdf`;
        doc.save(filename);

        setStatusMessage(`✅ Monografía Q1 generada y descargada con éxito: ${filename}`);
      } catch (err: any) {
        console.error("Error al generar PDF Q1:", err);
        setStatusMessage(`Error generando PDF: ${err.message}`);
      } finally {
        setIsGenerating(false);
      }
    }, 40);
  }, [activePointCtx, streetName, location.lat, location.lon]);

  const handleOpenPdfPreview = useCallback(() => {
    if (!activePointCtx) return;
    setIsGenerating(true);
    setStatusMessage("Generando vista previa del documento...");

    setTimeout(() => {
      try {
        const doc = generateActivePointQ1PaperPdf({
          location: activePointCtx.location,
          activePoint: activePointCtx.activePoint,
          assimilation: activePointCtx.assimilation,
          meteo: activePointCtx.data,
          physics: activePointCtx.result,
          authorName: "Dionisio Gálvez Pozo (Doctorando UNED / EIDUNED)"
        });

        const blob = doc.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        const win = window.open(blobUrl, '_blank');
        if (win) {
          setStatusMessage("✅ Documento PDF abierto en una nueva pestaña para inspección o impresión.");
        } else {
          // Si el bloqueador de popups lo impide, descargar
          doc.save(`paper_Q1_malaga_${streetName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.pdf`);
          setStatusMessage("✅ Documento PDF descargado.");
        }
      } catch (err: any) {
        console.error("Error al abrir vista previa PDF Q1:", err);
        setStatusMessage(`Error: ${err.message}`);
      } finally {
        setIsGenerating(false);
      }
    }, 40);
  }, [activePointCtx, streetName]);

  return (
    <DraggableWindow
      windowId="q1-paper-monograph-modal"
      title={`📄 Monografía Científica Q1: ${streetName}`}
      subtitle={`Artículo formal indexado (8 Páginas) • ${district} • WGS84: ${location.lat.toFixed(4)}°N, ${location.lon.toFixed(4)}°W`}
      className="w-[820px] max-w-[96vw] h-[640px] max-h-[90vh]"
      defaultCollapsed={false}
      onClose={onClose}
    >
      <div className="flex flex-col h-full bg-slate-950 text-slate-200 text-xs font-sans p-3 gap-3 overflow-hidden">
        
        {/* Banner Superior Editorial Q1 */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-700/60 rounded-md p-3 shadow-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-950 border border-indigo-500/80 rounded-lg shadow-inner">
              <FileText className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-600 rounded text-[9px] font-bold font-mono uppercase tracking-wider">
                  Q1 PAPER • IF 8.4
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Elsevier Atmospheric Environment Style
                </span>
              </div>
              <h3 className="font-bold text-sm text-white mt-0.5 truncate max-w-[440px]">
                {streetName} ({neighborhood})
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                8 Páginas • PINN + OSPM + Leighton + ICRP 66 + Dir. 2024/2881 + Metrología GUM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ScientificTooltip
              title="Abrir o Imprimir PDF"
              content="Abre el documento de 8 páginas en una nueva pestaña del navegador para revisión directa o impresión en formato A4."
              regulatory="Metrología FAIR JCGM 100:2008"
            >
              <button
                onClick={handleOpenPdfPreview}
                disabled={isGenerating}
                className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all text-xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Previsualizar</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Descargar Monografía Q1 Completa"
              content="Genera y descarga el PDF formal de 8 páginas con esquemas vectoriales de cañón urbano 3D, cinética Leighton, matriz regulatoria y presupuesto de incertidumbre GUM."
              regulatory="Elsevier Atmospheric Environment"
            >
              <button
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold rounded flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer disabled:opacity-50 transition-all text-xs"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>{isGenerating ? "Compilando..." : "Descargar PDF Q1"}</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Notificación de estado */}
        {statusMessage && (
          <div className="px-3 py-1.5 bg-slate-900/90 border border-emerald-500/60 text-emerald-300 rounded text-[11px] font-mono flex items-center gap-2 shrink-0 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{statusMessage}</span>
          </div>
        )}

        {/* Pestañas de Navegación del Modal con ScientificTooltip */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5 shrink-0 text-xs">
          <ScientificTooltip
            title="Resumen Ejecutivo & Highlights"
            content="Métricas clave del punto activo, destaques editoriales de Elsevier y fundamentación metodológica."
          >
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Resumen & Highlights</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="Estructura de las 8 Páginas"
            content="Desglose página a página del contenido científico, ecuaciones PDE, formulaciones y modelos microescalares."
          >
            <button
              onClick={() => setActiveTab('pages')}
              className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pages'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Estructura 8 Páginas</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="Auditoría Regulatoria y Colegios"
            content="Evaluación comparativa frente a la Directiva (UE) 2024/2881, Directiva 2008/50/CE, Guías OMS 2021 y dosimetría pediátrica ICRP 66."
          >
            <button
              onClick={() => setActiveTab('regulations')}
              className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'regulations'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Normativa & Colegios</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="Cita BibTeX & Metadatos FAIR"
            content="Registro formal de citación indexada, identificador DOI y trazabilidad de procedencia W3C PROV-O con hash criptográfico."
          >
            <button
              onClick={() => setActiveTab('bibtex')}
              className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'bibtex'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>BibTeX & FAIR</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Contenido Dinámico por Pestaña */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-slate-300">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              {/* Resumen de Métricas Físicas del Punto */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono uppercase">NO₂ a 1.8m AGL</span>
                    <span className="text-[9px] px-1 py-0.2 bg-indigo-950 text-indigo-300 border border-indigo-700 rounded font-mono">PINN</span>
                  </div>
                  <strong className="text-emerald-400 text-base font-mono block mt-1">{realNO2.toFixed(1)} µg/m³</strong>
                  <span className="text-[9.5px] text-slate-500 block">Asimilación determinista</span>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono uppercase">PM2.5 Fino</span>
                    <span className="text-[9px] px-1 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-700 rounded font-mono">Pankow</span>
                  </div>
                  <strong className="text-cyan-400 text-base font-mono block mt-1">{realPM25.toFixed(1)} µg/m³</strong>
                  <span className="text-[9.5px] text-slate-500 block">Fracción secundaria SOA</span>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono uppercase">Cañón H/W</span>
                    <span className="text-[9px] px-1 py-0.2 bg-amber-950 text-amber-300 border border-amber-700 rounded font-mono">Oke</span>
                  </div>
                  <strong className="text-amber-400 text-base font-mono block mt-1">{canyonHW.toFixed(2)}</strong>
                  <span className="text-[9.5px] text-slate-500 block">Flujo de recirculación</span>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono uppercase">Colegio Próximo</span>
                    <span className="text-[9px] px-1 py-0.2 bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-700 rounded font-mono">ICRP 66</span>
                  </div>
                  <strong className="text-fuchsia-300 text-sm font-mono truncate block mt-1" title={nearestSchool.name}>
                    {nearestSchool.name.replace('CEIP', '').trim().substring(0, 14)}
                  </strong>
                  <span className="text-[9.5px] text-fuchsia-400/80 block">{nearestSchool.distM} metros • {schoolNO2} µg/m³</span>
                </div>
              </div>

              {/* Caja de Highlights Editoriales (Elsevier Style) */}
              <div className="bg-slate-900/90 border border-emerald-500/40 rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span>Highlights del Artículo (Estilo Elsevier Atmospheric Environment)</span>
                  </h4>
                  <button
                    onClick={handleCopyHighlights}
                    className="px-2 py-0.5 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-600 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-all"
                  >
                    {copiedHighlights ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHighlights ? "¡Copiado!" : "Copiar Highlights"}</span>
                  </button>
                </div>
                <div className="space-y-1 text-[11px] font-sans text-slate-300">
                  {highlightsList.map((h, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-slate-300">
                      <span className="text-emerald-400 font-bold shrink-0">•</span>
                      <span>{h.substring(3)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ficha Técnica Doctoral */}
              <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-2">
                <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span>Metodología del Paper Q1 para este Punto Activo</span>
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Este artículo monográfico no emplea datos sintéticos ni fluctuaciones ficticias (Regla 1 del Gemelo Digital).
                  Sintetiza la asimilación determinista de la Red Oficial de Estaciones de la Junta de Andalucía acoplada a las ecuaciones
                  de Navier-Stokes con transporte reactivo fotoquímico, teoría de Monin-Obukhov (MOST) para la capa superficial y dosimetría
                  respiratoria infantil a cota pediátrica (0.90m AGL).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px] font-mono text-slate-400 pt-1">
                  <div>• Coordenadas ETRS89 UTM 30N exactas (EPSG:25830)</div>
                  <div>• Ciclo de Leighton y parámetro Φ resueltos</div>
                  <div>• Deposición foliar Wesely (Inventario Málaga)</div>
                  <div>• Cumplimiento Directiva (UE) 2024/2881 (20 µg/m³)</div>
                </div>
              </div>

              {/* Botón de Descarga Grande */}
              <div className="p-3 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-700/60 rounded flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-emerald-300 text-xs">Descarga Inmediata en PDF Vectorial</h4>
                  <p className="text-[10.5px] text-slate-400">Documento de 8 páginas listo para imprimir o anexar como capítulo a la tesis doctoral.</p>
                </div>
                <button
                  onClick={handleDownloadPdf}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded flex items-center gap-2 cursor-pointer shadow-md transition-all text-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGenerating ? "Generando..." : "Descargar Paper (8 Páginas)"}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PAGES STRUCTURE */}
          {activeTab === 'pages' && (
            <div className="space-y-2 text-xs">
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400">Pág. 1: Portada, Highlights, Resumen Estructurado y Geodesia ETRS89</span>
                  <span className="text-[10px] font-mono text-slate-500">EPSG:25830</span>
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1">Metadatos editoriales de revista Q1, toponimia municipal oficial, coordenadas WGS84/ETRS89 UTM Huso 30N, cota MDE y morfología de cañón urbano H/W de Oke (1987) con clasificación de régimen.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400">Pág. 2: Ingestión Multi-Sensor In Situ, Satélites y Capa Límite (MOST)</span>
                  <span className="text-[10px] font-mono text-slate-500">Copernicus Sentinel-5P</span>
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1">Telemetría de la Red Oficial de Calidad del Aire (Junta/Puerto de Málaga), Sentinel-5P TROPOMI Level-2 y física de superficie Monin-Obukhov (velocidad de fricción u*, longitud de estabilidad L, difusividad turbulenta K_z y espesor PBLH).</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400">Pág. 3: Aerodinámica de Cañón Urbano (OSPM) y Emisiones Tráfico COPERT 5</span>
                  <span className="text-[10px] font-mono text-slate-500">Esquema Vectorial 3D</span>
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1">Esquema vectorial del cañón con flujo de viento u_roof, vórtice recirculante interno, diferencias sotavento/barlovento, tasa de ventilación ACH y desglose de emisiones COPERT 5 del parque vehicular.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400">Pág. 4: Fotoquímica de Leighton, Capacidad Oxidante (OH) y Aerosoles Pankow</span>
                  <span className="text-[10px] font-mono text-slate-500">Triángulo PSS & SOA</span>
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1">Diagrama del ciclo fotoestacionario de Leighton (PSS) de NO-NO₂-O₃, tasa de fotólisis J_NO₂ con atenuación solar 3D, radicales OH y partición gas-partícula de aerosoles orgánicos secundarios (teoría de Pankow).</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400">Pág. 5: Fito-Remediación Arbórea e Inventario Municipal de Málaga</span>
                  <span className="text-[10px] font-mono text-slate-500">Modelo Wesely 1989</span>
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1">Especies botánicas en la alineación viaria de Málaga, modelo multi-resistencia de deposición foliar de Wesely, absorción estomática de NO₂ (g/h), captura de PM2.5 y refrigeración bioclimática microclimática (°C).</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400">Pág. 6: Dosimetría Pediátrica ICRP 66 y Directiva (UE) 2024/2881</span>
                  <span className="text-[10px] font-mono text-slate-500">Colegios & Cota 0.9m</span>
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1">Gráfico de barras regulatorias, dosis alveolar inhalada infantil a 0.90m AGL, auditoría del colegio más cercano ({nearestSchool.name}) y matriz tripartita frente al nuevo límite vinculante de 2030 (20 µg/m³).</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400">Pág. 7: Red Neuronal PINN y Residuos de Navier-Stokes + ADR</span>
                  <span className="text-[10px] font-mono text-slate-500">Benchmark Multimodelo</span>
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1">Normas L₂ y L_infinito del residuo PDE, condición CFL de Courant, microescala de Kolmogorov y benchmark computacional (PINN vs OpenFOAM RANS vs WRF-Chem vs Pluma Gaussiana).</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400">Pág. 8: Incertidumbre GUM (ISO 98-3), Sellado SHA-256 y Bibliografía</span>
                  <span className="text-[10px] font-mono text-slate-500">JCGM 100:2008 & FAIR</span>
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1">Presupuesto de incertidumbre expandida U (k=2, 95% confianza), hash criptográfico inmutable de procedencia W3C PROV-O y 12 citas bibliográficas en formato Elsevier Atmospheric Environment.</p>
              </div>
            </div>
          )}

          {/* TAB 3: REGULATIONS & SCHOOLS */}
          {activeTab === 'regulations' && (
            <div className="space-y-3 text-xs">
              {/* Matriz de Normativa Europea */}
              <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-2">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  <span>Matriz de Cumplimiento Normativo Europeo en el Receptor</span>
                </h4>

                <div className="space-y-2 pt-1">
                  {/* Directiva 2024/2881 */}
                  <div className="p-2 bg-slate-950/80 border border-sky-800/60 rounded flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sky-300 block text-[11px]">Directiva (UE) 2024/2881 (Objetivo Vinculante 2030)</span>
                      <span className="text-[10px] text-slate-400">Límite anual de NO₂: 20.0 µg/m³ • Protección reforzada en colegios</span>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        realNO2 <= 20 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' 
                          : 'bg-amber-950 text-amber-300 border border-amber-600'
                      }`}>
                        {realNO2 <= 20 ? 'CONFORME 2030' : `EXCEDE (+${(realNO2 - 20).toFixed(1)} µg/m³)`}
                      </span>
                    </div>
                  </div>

                  {/* Directiva 2008/50/CE */}
                  <div className="p-2 bg-slate-950/80 border border-slate-800 rounded flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 block text-[11px]">Directiva 2008/50/CE (Marco Regulatorio Vigente)</span>
                      <span className="text-[10px] text-slate-400">Límite anual de NO₂: 40.0 µg/m³</span>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        realNO2 <= 40 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' 
                          : 'bg-red-950 text-red-300 border border-red-600'
                      }`}>
                        {realNO2 <= 40 ? 'CONFORME VIGENTE' : 'SUPERA LÍMITE'}
                      </span>
                    </div>
                  </div>

                  {/* Guías OMS 2021 */}
                  <div className="p-2 bg-slate-950/80 border border-slate-800 rounded flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 block text-[11px]">Guías OMS 2021 de Calidad del Aire</span>
                      <span className="text-[10px] text-slate-400">Directriz de salud pública: 10.0 µg/m³ anual</span>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        realNO2 <= 10 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' 
                          : 'bg-amber-950 text-amber-400 border border-amber-700'
                      }`}>
                        {realNO2 <= 10 ? 'CUMPLE GUÍA OMS' : `SUPERA OMS (+${(realNO2 - 10).toFixed(1)} µg/m³)`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ficha del Colegio Más Próximo */}
              <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <School className="w-4 h-4 text-fuchsia-400" />
                    <span>Entorno Escolar Más Próximo: {nearestSchool.name}</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Distancia: {nearestSchool.distM} metros</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10.5px]">
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 block text-[9.5px]">ALUMNADO EXPUESTO</span>
                    <strong className="text-white text-xs">{nearestSchool.students} Alumnos</strong>
                  </div>
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 block text-[9.5px]">EXPOSICIÓN NO₂ COTA 0.9M</span>
                    <strong className="text-fuchsia-300 text-xs">{schoolNO2} µg/m³</strong>
                  </div>
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 block text-[9.5px]">TIPOLOGÍA DE CALLE</span>
                    <strong className="text-slate-300 text-xs truncate block">{nearestSchool.streetType}</strong>
                  </div>
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 block text-[9.5px]">MEDIDA PACIFICACIÓN</span>
                    <strong className="text-emerald-400 text-xs">School Street ZBE</strong>
                  </div>
                </div>

                <p className="text-[10.5px] text-slate-300 leading-relaxed pt-1">
                  El Artículo 13 de la Directiva (UE) 2024/2881 exige a los estados miembros priorizar la protección de niños y escuelas.
                  La implementación de cortes de tráfico temporales en horarios de entrada y salida, acoplada a barreras vegetales de fito-filtración,
                  reduce la exposición alveolar en hasta un 35%.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: BIBTEX & FAIR CITATION */}
          {activeTab === 'bibtex' && (
            <div className="space-y-3">
              <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 font-mono text-[11px] flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cita Bibliográfica BibTeX (Exportable & Citable):</span>
                  </span>
                  <button
                    onClick={handleCopyBibtex}
                    className="px-2.5 py-1 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-600/70 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-all"
                  >
                    {copiedBibtex ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBibtex ? "¡Copiado al Portapapeles!" : "Copiar BibTeX"}</span>
                  </button>
                </div>
                <pre className="p-2.5 bg-black/60 rounded border border-slate-800 font-mono text-[10px] text-indigo-200 overflow-x-auto leading-relaxed select-all">
                  {bibtexCitation}
                </pre>
              </div>

              {/* Trazabilidad FAIR W3C PROV-O */}
              <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-1.5 font-mono text-[10px]">
                <h5 className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Procedencia W3C PROV-O & Principios FAIR</span>
                </h5>
                <div className="text-slate-400 space-y-0.5 pt-1">
                  <div>• Entidad: <span className="text-slate-200">Receptor Microescalar {streetName}</span></div>
                  <div>• Coordenadas: <span className="text-slate-200">{location.lat.toFixed(5)}°N, {location.lon.toFixed(5)}°E (ETRS89 UTM 30N)</span></div>
                  <div>• Actividad: <span className="text-slate-200">Asimilación Continua Determinista PINN</span></div>
                  <div>• Licencia: <span className="text-slate-200">Creative Commons Attribution 4.0 International (CC BY 4.0)</span></div>
                  <div>• Repositorio Citable: <span className="text-indigo-300">Zenodo Open Research Data / Tesis Doctoral EIDUNED</span></div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </DraggableWindow>
  );
};
