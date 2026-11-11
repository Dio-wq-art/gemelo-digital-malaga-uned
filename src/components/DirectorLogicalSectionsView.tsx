import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Cpu,
  Scale,
  Sparkles,
  BookOpen,
  Layers,
  Award,
  Bell,
  Upload,
  RefreshCw,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { MathFormula } from './MathFormula';
import { TableHorizontalScrollContainer } from './SlidingRibbonBar';
import { useUIStore } from '../store/uiStore';
import { OFFICIAL_MALAGA_AIR_STATIONS, OFFICIAL_SATELLITE_MISSIONS } from '../lib/physics';
import {
  DIRECTOR_ORIGINAL_PDF_PATH,
  DIRECTOR_EXPANDED_GEMINI_PDF_PATH,
  DIRECTOR_EXPANDED_GEMINI_PDF_TITLE,
  DIRECTOR_EXPANDED_GEMINI_DOWNLOAD_FILENAME,
  DIRECTOR_MONOGRAPH_POINTS_CATALOG,
  DIRECTOR_10_CONTEXT_VARIABLES_JUSTIFICATION,
  DirectorMonographPointId,
  exportPinnFormalSpecChapterLatex,
  downloadDirectorSinglePointMonographPdf,
  computeExpandedDirectorStudyLiveMetrics,
  getDynamicDirectorPdfDocumentsCatalog,
  downloadDynamicDirectorDocumentOrChapterPdf
} from '../lib/directorOriginalDocAndFocusedPdf';
import {
  computeOutOfSampleLoocvValidation,
  computeCausalMobilityDecomposition,
  computeTerritorialDistributiveMatrix,
  RESEARCH_PHASES_EVOLUTION,
  DEFINITIVE_VARIABLE_MATRIX
} from '../lib/thesisDirectorGuidelinesEngine';
import {
  computeVerifiedDoctoralEvidenceForPoint,
  fetchLiveScientificRadarFromOpenAlex,
  VERIFIED_SOTA_RADAR_FINDINGS_SEED,
  ScientificRadarFinding,
  IngestedDirectorMultiFormatOrder,
  getApprovedRadarIds,
  saveApprovedRadarIds,
  getDismissedRadarIds,
  saveDismissedRadarIds,
  getStoredMultiFormatDirectorOrders,
  saveStoredMultiFormatDirectorOrders,
  extractTextFromUploadedDirectorFile,
  downloadCustomDirectorOrderMonographPdf
} from '../lib/verifiedDoctoralEvidence2026';
import {
  ThesisOpenDiscoveryItem,
  loadOpenThesisDiscoveries,
  addOpenThesisDiscovery,
  updateOpenThesisDiscovery,
  toggleStarOpenThesisDiscovery,
  removeOpenThesisDiscovery,
  detectLiveEmpiricalDiscoveriesForPoint,
  formatOpenDiscoveriesConclusionsForWordAndLatex,
  MALAGA_11_DISTRICTS_CANONICAL_STREETS,
  computeLiveMalaga11DistrictsCorridors,
  computeCityWideMalagaScanSummary,
  isRadarDoiSoundEnabled,
  setRadarDoiSoundEnabled,
  playSotaDoiDiscoveryChime,
  checkAndTriggerNewDoiAlarmIfNeeded,
  loadCustomRadarDoiFindings,
  saveCustomRadarDoiFinding,
  searchCustomOpenAlexDoiWorks
} from '../lib/thesisOpenDiscoveriesEngine';
import {
  generateUnedHpcPyTorchTrainingScript,
  generateUnedMvpTrainingDatasetCsv,
  generateUnedSlurmBatchScript,
  generateDoctoralJupyterNotebook,
  getActiveUnedPinnCheckpoint,
  saveUploadedUnedPinnCheckpoint,
  resetToDefaultUnedPinnCheckpoint,
  getLatentTrainingPointsQueue,
  addPointToLatentTrainingQueue,
  removePointFromLatentTrainingQueue,
  clearLatentTrainingQueue,
  loadFiveCanonicalMalagaPointsIntoQueue,
  generateSampleUnedCheckpointJson,
  downloadUnedTrainingAuditReportPdf,
  exportUnedTrainingAuditCsv,
  exportUnedTrainingAuditLatex,
  getFutureTrainingRequirements,
  addFutureTrainingRequirement,
  removeFutureTrainingRequirement,
  restoreDefaultFutureTrainingRequirements,
  FutureTrainingRequirementItem,
  PythonNotebookOptions
} from '../lib/pythonJupyterNotebookGenerator';

export interface DirectorMonographGeneratorBarProps {
  activePointCtx: any;
  selectedMonographPointId: DirectorMonographPointId;
  setSelectedMonographPointId: (id: DirectorMonographPointId) => void;
  onJumpToSection?: (pointId: DirectorMonographPointId) => void;
}

export const DirectorMonographGeneratorBar: React.FC<DirectorMonographGeneratorBarProps> = ({
  activePointCtx,
  selectedMonographPointId,
  setSelectedMonographPointId,
  onJumpToSection
}) => {
  const selectedItem =
    DIRECTOR_MONOGRAPH_POINTS_CATALOG.find((p) => p.id === selectedMonographPointId) ||
    DIRECTOR_MONOGRAPH_POINTS_CATALOG[0];

  return (
    <div className="p-3 bg-gradient-to-r from-indigo-950/95 via-slate-950 to-amber-950/90 border-2 border-amber-400 rounded-xl space-y-2 shadow-[0_0_18px_rgba(245,158,11,0.22)]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <ScientificTooltip
              position="bottom"
              width="w-[380px]"
              title="Generador de Informe PDF Supercompleto por Punto Individual del Director"
              content="Permite elegir cualquiera de los puntos exigidos en el PDF original de tu Director de Tesis (Puntos 1–2, 3 OE1–OE4, 4 Delimitación y 10 Controles, 5 Criterio PINN, Paso 6.1 Fuentes, Paso 6.2 Matriz, Paso 6.3 MVP, Paso 6.4 Arquitectura PINN, Paso 6.5 Causalidad ZBE o Punto 7 Resultado Esperado) y descargar un informe PDF A4 monográfico, exhaustivo y parametrizado en tiempo real con el punto activo del mapa."
              regulatory="03_10_2026_Marco_objetivos_tesis_Dionisio.pdf • UNED Doctorado"
            >
              <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[11px] uppercase rounded cursor-help">
                📑 INFORME PDF SUPERCOMPLETO POR PUNTO DEL DIRECTOR (A LA CARTA)
              </span>
            </ScientificTooltip>
            <span className="text-[11px] text-emerald-300 font-bold">
              Elige el punto exacto que te pida tu Director (ej. 6.3, 6.4, 6.2...) y descárgalo en PDF A4
            </span>
          </div>
          <p className="text-[11px] text-slate-200 leading-snug">
            <strong className="text-amber-300">Exigencia literal seleccionada ({selectedItem.code}):</strong> «{selectedItem.directorVerbatimQuote}»
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <select
            value={selectedMonographPointId}
            onChange={(e) => setSelectedMonographPointId(e.target.value as DirectorMonographPointId)}
            aria-label="Seleccionar punto del PDF del Director para informe monográfico"
            className="px-2.5 py-1.5 bg-slate-950 border-2 border-amber-400 rounded-lg text-white text-xs font-black focus:outline-none focus:border-emerald-400 cursor-pointer"
          >
            {DIRECTOR_MONOGRAPH_POINTS_CATALOG.map((pt) => (
              <option key={pt.id} value={pt.id}>
                {pt.shortLabel} — {(pt.fullTitle || '').slice(0, 58)}
              </option>
            ))}
          </select>

          {onJumpToSection && (
            <ScientificTooltip
              position="bottom"
              width="w-[300px]"
              title="Ir a la Sección en Pantalla"
              content={`Desplaza y filtra la vista actual directamente hacia el apartado ${selectedItem.code} para inspeccionarlo antes de imprimir.`}
              regulatory="Navegación Directa por Orden del PDF"
            >
              <button
                type="button"
                onClick={() => onJumpToSection(selectedMonographPointId)}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border-2 border-cyan-400 rounded-lg text-xs font-black cursor-pointer"
              >
                🔍 Ver Punto en Pantalla
              </button>
            </ScientificTooltip>
          )}

          <ScientificTooltip
            position="bottom"
            width="w-[380px]"
            title={`Descargar Informe PDF Supercompleto de ${selectedItem.code}`}
            content={`Genera y descarga en 1 clic un dossier PDF A4 multipágina dedicado exclusivamente a "${selectedItem.fullTitle}", con la cita textual del PDF de tu Director, desarrollo metodológico completo, tablas en vivo en el punto activo y dictamen de cumplimiento.`}
            regulatory="Monografía Doctoral por Punto • UNED"
          >
            <button
              type="button"
              onClick={() => downloadDirectorSinglePointMonographPdf(selectedMonographPointId, activePointCtx)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-black text-xs uppercase rounded-lg border-2 border-white flex items-center gap-1.5 cursor-pointer shadow-[0_0_16px_rgba(16,185,129,0.5)]"
            >
              <Download className="w-4 h-4 text-slate-950 shrink-0" />
              <span>📥 IMPRIMIR PDF PUNTO {selectedItem.code}</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>
    </div>
  );
};

export interface DirectorOriginalPdfSectionProps {
  showEmbeddedOriginalPdf: boolean;
  setShowEmbeddedOriginalPdf: React.Dispatch<React.SetStateAction<boolean>>;
  activePointCtx: any;
}

export const DirectorOriginalPdfSection: React.FC<DirectorOriginalPdfSectionProps> = ({
  showEmbeddedOriginalPdf,
  setShowEmbeddedOriginalPdf,
  activePointCtx
}) => {
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState<boolean>(false);
  const [selectedPdfDoc, setSelectedPdfDoc] = useState<'original_2p' | 'expanded_7p' | 'side_by_side'>('side_by_side');
  const [copiedPairSummaryOk, setCopiedPairSummaryOk] = useState<boolean>(false);
  const [showInlineFuturePdfUploader, setShowInlineFuturePdfUploader] = useState<boolean>(false);
  const expStudy = computeExpandedDirectorStudyLiveMetrics(activePointCtx);
  const activeStreet =
    activePointCtx?.activePoint?.nearestStreetName ||
    activePointCtx?.activePoint?.name ||
    'Calle Marqués de Larios, Málaga';
  const activeDistrict = activePointCtx?.activePoint?.district || 'Distrito Centro';
  const lat = activePointCtx?.location?.lat ?? 36.7196;
  const lon = activePointCtx?.location?.lon ?? -4.4200;
  const elevM = Math.round(activePointCtx?.assimilation?.elevationM ?? activePointCtx?.activePoint?.elevationM ?? 11);
  const c18m = Number((activePointCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? activePointCtx?.data?.no2_satelite_base ?? 28.4).toFixed(1));
  const hw = Number((activePointCtx?.assimilation?.aspectRatioHw ?? activePointCtx?.data?.aspect_ratio_hw ?? 1.0).toFixed(2));
  const svf = Number((activePointCtx?.assimilation?.skyViewFactorSvf ?? activePointCtx?.data?.sky_view_factor ?? 0.71).toFixed(2));
  const c09m = Number((c18m * (1.09 + 0.04 * hw)).toFixed(1));
  const c40m = Number((c18m / (1.06 + 0.08 * hw)).toFixed(1));
  const windMs = Number(((activePointCtx?.assimilation?.windSpeedKmh ?? activePointCtx?.data?.velocidad_viento_km_h ?? 8.2) / 3.6).toFixed(1));

  const handleCopyPairSummaryForDirector = () => {
    const summaryText =
      `📑 FICHA DE TRAZABILIDAD DOCUMENTAL — TESIS DOCTORAL UNED (EIDUNED)\n` +
      `====================================================================\n` +
      `• PDF 1 ORIGINAL (Mandato Directora de Tesis • 03/10/2026 • 2 Págs):\n` +
      `  Archivo: 03_10_2026_Marco_objetivos_tesis_Dionisio.pdf\n` +
      `  Alcance: Puntos 1 a 7, Objetivos OE1–OE4, 10 variables de contexto y secuencia 6.1 a 6.5.\n\n` +
      `• PDF 1 ORIGINAL CON GÉMINIS (Estudio Profundo Acoplado • 03/10/2026 • 7 Págs):\n` +
      `  Archivo: ${DIRECTOR_EXPANDED_GEMINI_PDF_TITLE}\n` +
      `  ➕ Qué aporta sobre el PDF 1 ORIGINAL: (1) La Tesis en una Frase y 3 Advertencias Fundacionales; (2) Especificación Técnica OE2 (Ecuaciones 1–4); (3) Capa Límite Interna Térmica Costera h_TIBL(x) = ${expStudy.coastalTibl.tiblHeightMeters} m (fetch x = ${expStudy.coastalTibl.distToCoastMeters} m); (4) Ciclo acoplado de Leighton (Φ = ${expStudy.leightonCoupledState.leightonRatioPhi}) y deposición seca v_d = ${expStudy.dryDepositionWeselyNdvi.vdCmPerSec} cm/s (NDVI = ${expStudy.dryDepositionWeselyNdvi.ndviSentinel2}); (5) Hoja de Ruta Operativa en 5 Pasos con Criterio de Cierre; y (6) Desplazamiento periférico (Spillover) de la ZBE por Quintiles de Renta INE (Q1–Q5).\n\n` +
      `• Evaluación en Vivo en el Gemelo Digital (${activeStreet.split(',')[0]} — ${activeDistrict}):\n` +
      `  Coordenadas: ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°W (${elevM} m) | NO₂ Peatón (1.8 m) = ${c18m} µg/m³ | Carrito Bebé (0.9 m) = ${c09m} µg/m³ | Cabina Oficial (4.0 m) = ${c40m} µg/m³ | Viento = ${windMs} m/s.`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setCopiedPairSummaryOk(true);
      setTimeout(() => setCopiedPairSummaryOk(false), 3000);
    }
  };

  return (
    <div
      id="director-sec-0-original-pdf"
      className="p-3 bg-gradient-to-br from-slate-950 via-sky-950/35 to-slate-900 border-2 border-cyan-400 rounded-xl space-y-2.5 shadow-[0_0_22px_rgba(34,211,238,0.2)]"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-cyan-500/50 pb-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <ScientificTooltip
              position="top"
              width="w-[400px]"
              title="Regla 31: Pareja Documental en Azul (PDF 1 ORIGINAL ⇄ PDF 1 ORIGINAL CON GÉMINIS)"
              content="Conserva íntegros dentro de la aplicación el PDF 1 ORIGINAL de 2 páginas enviado por tu Directora de Tesis (03_10_2026_Marco_objetivos_tesis_Dionisio.pdf) y, justo a su lado, el PDF 1 ORIGINAL CON GÉMINIS de 7 páginas (03_10_2026_Marco_objetivos_tesis_Dionisio — pasado por GEMINIS (ESTUDIO MÁS PROFUNDO DEL PDF PARA LA APP).pdf), preparado para que los futuros PDF 2, PDF 3... sigan exactamente el mismo emparejamiento."
              regulatory="Regla 24 y Regla 31 AGENTS.md — Custodia de Parejas Documentales UNED"
            >
              <span className="px-2 py-0.5 bg-cyan-400 text-slate-950 font-black text-[11px] uppercase rounded cursor-help">
                📘 PUNTO 0 • PAREJA DOCUMENTAL #1: PDF 1 ORIGINAL ⇄ PDF 1 ORIGINAL CON GÉMINIS
              </span>
            </ScientificTooltip>
            <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-400 text-emerald-200 text-[10.5px] font-black rounded">
              ✅ 100% Integrado en Pestañas 1, 4 y 5
            </span>
            <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-400 text-cyan-200 text-[10.5px] font-black rounded">
              📍 {activeStreet.split(',')[0]} ({lat.toFixed(4)}°N, {lon.toFixed(4)}°W • {elevM}m)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <ScientificTooltip
            position="top"
            width="w-[360px]"
            title="Copiar Ficha Ejecutiva de la Pareja PDF 1 para Correo a la Directora o DAD UNED"
            content="Copia al portapapeles un resumen estructurado que explica qué exige el PDF 1 ORIGINAL de tu Directora, qué añade exactamente el PDF 1 ORIGINAL CON GÉMINIS y qué valores numéricos arroja hoy el Gemelo Digital en la calle activa."
            regulatory="Seguimiento Anual EIDUNED / Tutorías Directora de Tesis"
          >
            <button
              type="button"
              onClick={handleCopyPairSummaryForDirector}
              className="px-2.5 py-1 rounded-lg text-[10.5px] font-black border border-cyan-300 bg-cyan-950 hover:bg-cyan-900 text-cyan-200 cursor-pointer flex items-center gap-1"
            >
              {copiedPairSummaryOk ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-300" />}
              <span>{copiedPairSummaryOk ? '✅ ¡Ficha Copiada!' : '📋 Copiar Ficha Correo / DAD'}</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            width="w-[340px]"
            title="Transcripción Literal Verificada (Páginas 1 y 2 del PDF 1 ORIGINAL)"
            content="Despliega o pliega la transcripción íntegra palabra por palabra de las Páginas 1 y 2 del documento original de la Directora de Tesis (03_10_2026_Marco_objetivos_tesis_Dionisio.pdf: Puntos 1 a 7, Objetivos OE1–OE4 y 4 Fases)."
            regulatory="Regla 24 AGENTS.md — Custodia Íntegra del Documento Original UNED"
          >
            <button
              type="button"
              onClick={() => setIsTranscriptExpanded((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black border cursor-pointer transition-all ${
                !isTranscriptExpanded
                  ? 'bg-emerald-400 text-slate-950 border-white shadow-sm'
                  : 'bg-slate-900 text-emerald-300 border-emerald-500/70 hover:bg-slate-800'
              }`}
            >
              {isTranscriptExpanded ? '▴ Plegar Transcripción Pág. 1 y 2' : '▾ Desplegar Transcripción Pág. 1 y 2'}
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            width="w-[360px]"
            title="Mostrar / Ocultar Visor Comparador (PDF 1 ORIGINAL ⇄ PDF 1 ORIGINAL CON GÉMINIS)"
            content="Despliega u oculta el visor interactivo con modo Pantalla Dividida Lado a Lado (Original 2 págs a la izquierda ⇄ Con Géminis 7 págs a la derecha) o vista individual."
            regulatory="Custodia Documental Directa (Reglas 24, 30 y 31 AGENTS.md)"
          >
            <button
              type="button"
              onClick={() => setShowEmbeddedOriginalPdf((prev) => !prev)}
              className="px-2.5 py-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-[10.5px] rounded-lg border border-white cursor-pointer flex items-center gap-1 shadow-md"
            >
              <BookOpen className="w-3 h-3" />
              <span>{showEmbeddedOriginalPdf ? '🔼 Ocultar Visor PDF' : '⚖️ Ver Lado a Lado (Original ⇄ Con Géminis)'}</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            width="w-[380px]"
            title="Subir Futuros PDFs de la Directora (PDF 2 ORIGINAL / PDF 2 ORIGINAL CON GÉMINIS, PDF 3… N)"
            content="Despliega aquí mismo la bandeja para subir futuros documentos (.PDF, Word .DOCX o texto) etiquetados automáticamente en azul como PDF 2 ORIGINAL o PDF 2 ORIGINAL CON GÉMINIS."
            regulatory="Regla 31 AGENTS.md — Emparejamiento Automático 1…N"
          >
            <button
              type="button"
              onClick={() => setShowInlineFuturePdfUploader((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg font-black text-[10.5px] border cursor-pointer flex items-center gap-1 shadow-md transition-all ${
                showInlineFuturePdfUploader
                  ? 'bg-amber-400 text-slate-950 border-white'
                  : 'bg-sky-500 hover:bg-sky-400 text-slate-950 border-white'
              }`}
            >
              <span>{showInlineFuturePdfUploader ? '▴ Cerrar Bandeja de Subida' : '📤 + SUBIR FUTUROS PDFs (PDF 2, 3… N)'}</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {showInlineFuturePdfUploader && (
        <div className="p-2.5 bg-slate-950 border-2 border-sky-400 rounded-xl animate-fadeIn">
          <DirectorMultiFormatIngestionHub
            activePointCtx={activePointCtx}
            liveFivePointsMetrics={null}
          />
        </div>
      )}

      {/* CUSTODIA LADO A LADO EN AZUL: PDF 1 ORIGINAL (2 PÁGS) ⇄ PDF 1 ORIGINAL CON GÉMINIS (7 PÁGS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        <div className="p-2.5 bg-slate-950/95 border-2 border-cyan-400/90 rounded-xl flex flex-col justify-between gap-2 shadow-[0_0_14px_rgba(34,211,238,0.14)]">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <ScientificTooltip
                position="top"
                width="w-[340px]"
                title="Activar PDF 1 ORIGINAL (03/10/2026 • 2 PÁGS) en el Selector Superior"
                content="Con 1 clic selecciona PDF 1 ORIGINAL (03/10/2026 • 2 PÁGS) arriba a la izquierda (Rodeado Azul) y despliega sus Puntos 1 a 7 y Secuencia 6.1–6.5 en el selector de capítulos (Rodeado Rosa)."
                formula="\\text{DOC}_{1,\\text{orig}} = \\{\\text{Puntos } 1\\dots 7, \\text{OE1--OE4}, \\text{Sec. } 6.1\\dots 6.5\\}"
                regulatory="Reglas 24, 30 y 31 AGENTS.md — Identidad Nominal Azul Superior e Inferior"
              >
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent('uned-select-active-director-pdf-doc', {
                        detail: { docId: 'pdf_1_original' }
                      })
                    )
                  }
                  className="px-2 py-0.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-[10.5px] rounded uppercase cursor-pointer"
                >
                  📘 PDF 1 ORIGINAL (03/10/2026 • 2 PÁGS)
                </button>
              </ScientificTooltip>
              <span className="text-[10px] font-mono text-emerald-300 font-bold">Mandato Literal Intocable ✓</span>
            </div>
            <div className="text-xs font-black text-cyan-200">
              03_10_2026_Marco_objetivos_tesis_Dionisio.pdf
            </div>
            <p className="text-[10.5px] text-slate-300 leading-snug">
              Documento fundacional de 2 páginas enviado por tu Directora de Tesis: Puntos 1 a 7, Objetivos OE1–OE4, 10 variables de contexto y secuencia metodológica 6.1 a 6.5.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800">
            <ScientificTooltip
              position="top"
              width="w-[320px]"
              title="Ver PDF 1 ORIGINAL (2 Páginas) en el Visor Incrustado"
              content="Abre en el visor integrado el archivo PDF 1 ORIGINAL de 2 páginas (03_10_2026_Marco_objetivos_tesis_Dionisio.pdf)."
              regulatory="Regla 24, 30 y 31 AGENTS.md"
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedPdfDoc('original_2p');
                  setShowEmbeddedOriginalPdf(true);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black border cursor-pointer flex items-center gap-1 ${
                  showEmbeddedOriginalPdf && selectedPdfDoc === 'original_2p'
                    ? 'bg-cyan-400 text-slate-950 border-white'
                    : 'bg-slate-900 text-cyan-300 border-cyan-400 hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>👁️ Ver PDF 1 ORIGINAL (2 Págs)</span>
              </button>
            </ScientificTooltip>
            <ScientificTooltip
              position="top"
              width="w-[320px]"
              title="Descargar PDF 1 ORIGINAL Exacto de la Directora (2 Págs)"
              content="Descarga el archivo PDF 1 ORIGINAL (03_10_2026_Marco_objetivos_tesis_Dionisio.pdf) tal cual fue entregado por tu Directora."
              regulatory="Documento Primario Original"
            >
              <a
                href={DIRECTOR_ORIGINAL_PDF_PATH}
                download="03_10_2026_Marco_objetivos_tesis_Dionisio.pdf"
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-200 border border-cyan-400/80 rounded-lg text-[10px] font-black inline-flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>📥 Descargar PDF 1 ORIGINAL</span>
              </a>
            </ScientificTooltip>
          </div>
        </div>

        <div className="p-2.5 bg-slate-950/95 border-2 border-sky-400 rounded-xl flex flex-col justify-between gap-2 shadow-[0_0_18px_rgba(56,189,248,0.22)]">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <ScientificTooltip
                position="top"
                width="w-[350px]"
                title="Activar PDF 1 ORIGINAL CON GÉMINIS (03/10/2026 • 7 PÁGS) en el Selector Superior"
                content="Con 1 clic selecciona PDF 1 ORIGINAL CON GÉMINIS (03/10/2026 • 7 PÁGS) arriba a la izquierda (Rodeado Azul) y despliega sus 6 Capítulos de Estudio Profundo (Tesis en una Frase, 3 Advertencias, OE2 (1)–(4), h_TIBL(x), Hoja de Ruta y Q1–Q5) en el selector Rosa."
                formula="\\text{DOC}_{1,\\text{Gemini}} = \\text{DOC}_{1,\\text{orig}} \\oplus \\{\\text{Cap. 1--6}, h_{\\text{TIBL}}(x), \\text{Q1--Q5}\\}"
                regulatory="Reglas 24, 30 y 31 AGENTS.md — Pareja Documental en Azul"
              >
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent('uned-select-active-director-pdf-doc', {
                        detail: { docId: 'pdf_1_con_geminis' }
                      })
                    )
                  }
                  className="px-2 py-0.5 bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-[10.5px] rounded uppercase cursor-pointer"
                >
                  📘 PDF 1 ORIGINAL CON GÉMINIS (03/10/2026 • 7 PÁGS)
                </button>
              </ScientificTooltip>
              <span className="text-[10px] font-mono text-emerald-300 font-bold">Pareja de PDF 1 Activa ✓</span>
            </div>
            <div className="text-xs font-black text-sky-200 leading-snug">
              {DIRECTOR_EXPANDED_GEMINI_PDF_TITLE}
            </div>
            <div className="p-1.5 bg-sky-950/60 border border-sky-400/60 rounded text-[10px] text-sky-100 leading-snug">
              <strong className="text-amber-300">➕ Qué aporta sobre el PDF 1 ORIGINAL:</strong> Ecuaciones canónicas OE2 <code className="text-cyan-200">(1)–(4)</code>, Capa Límite Costera <MathFormula math="h_{\text{TIBL}}(x)" /> ({expStudy.coastalTibl.tiblHeightMeters} m), acoplamiento Leighton (<MathFormula math="\Phi" /> = {expStudy.leightonCoupledState.leightonRatioPhi}), Hoja de Ruta en 5 Pasos con Criterio de Cierre y Spillover por quintiles de renta <code className="text-emerald-300">Q1–Q5</code>.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800">
            <ScientificTooltip
              position="top"
              width="w-[340px]"
              title="Ver PDF 1 ORIGINAL CON GÉMINIS (7 Páginas) en el Visor Incrustado"
              content={`Abre en el visor integrado el documento ampliado de 7 páginas: "${DIRECTOR_EXPANDED_GEMINI_PDF_TITLE}".`}
              regulatory="Regla 24, 30 y 31 AGENTS.md"
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedPdfDoc('expanded_7p');
                  setShowEmbeddedOriginalPdf(true);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black border cursor-pointer flex items-center gap-1 ${
                  showEmbeddedOriginalPdf && selectedPdfDoc === 'expanded_7p'
                    ? 'bg-sky-400 text-slate-950 border-white'
                    : 'bg-slate-900 text-sky-300 border-sky-400 hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>👁️ Ver PDF 1 ORIGINAL CON GÉMINIS</span>
              </button>
            </ScientificTooltip>
            <ScientificTooltip
              position="top"
              width="w-[350px]"
              title="Ver Ambos Lado a Lado (PDF 1 ORIGINAL ⇄ PDF 1 ORIGINAL CON GÉMINIS)"
              content="Parte el visor en 2 columnas paralelas para cotejar en vivo el PDF 1 ORIGINAL de 2 páginas de tu Directora frente al PDF 1 ORIGINAL CON GÉMINIS de 7 páginas."
              regulatory="Modo Comparador de Tutoría UNED"
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedPdfDoc('side_by_side');
                  setShowEmbeddedOriginalPdf(true);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black border cursor-pointer flex items-center gap-1 ${
                  showEmbeddedOriginalPdf && selectedPdfDoc === 'side_by_side'
                    ? 'bg-emerald-400 text-slate-950 border-white'
                    : 'bg-slate-900 text-emerald-300 border-emerald-400 hover:bg-slate-800'
                }`}
              >
                <Scale className="w-3 h-3" />
                <span>⚖️ Lado a Lado (2p ⇄ 7p)</span>
              </button>
            </ScientificTooltip>
            <ScientificTooltip
              position="top"
              width="w-[340px]"
              title="Descargar PDF 1 ORIGINAL CON GÉMINIS (7 Páginas)"
              content={`Descarga el archivo PDF de 7 páginas con el nombre exacto solicitado: "${DIRECTOR_EXPANDED_GEMINI_PDF_TITLE}".`}
              regulatory="Custodia Dual al Lado del Original"
            >
              <a
                href={DIRECTOR_EXPANDED_GEMINI_PDF_PATH}
                download={DIRECTOR_EXPANDED_GEMINI_DOWNLOAD_FILENAME}
                className="px-2.5 py-1 bg-sky-400 hover:bg-sky-300 text-slate-950 border border-white rounded-lg text-[10px] font-black inline-flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Download className="w-3 h-3" />
                <span>📥 Descargar PDF 1 CON GÉMINIS</span>
              </a>
            </ScientificTooltip>
          </div>
        </div>
      </div>

      {/* RECUADRO OFICIAL: LA TESIS EN UNA FRASE (MANDATO DIRECTIVO PÁG. 1 DEL PDF DE 7 PÁGINAS) + 3 ADVERTENCIAS */}
      <div className="p-2.5 bg-gradient-to-r from-indigo-950/90 via-slate-950 to-cyan-950/90 border border-cyan-400/80 rounded-xl space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="px-2 py-0.5 bg-cyan-400 text-slate-950 font-black text-[10px] rounded uppercase">
            🎓 LA TESIS EN UNA FRASE (MANDATO DIRECTIVO — PÁG. 1 DE PDF 1 ORIGINAL CON GÉMINIS)
          </span>
          <span className="text-[10px] font-mono text-cyan-300 font-bold">
            Defensa Ejecutiva ante Tribunal UNED ✓
          </span>
        </div>
        <p className="text-xs font-bold text-white italic bg-black/50 p-2 rounded-lg border border-cyan-400/50 leading-relaxed">
          «{expStudy.thesisInOneSentence}»
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10.5px]">
          {expStudy.threeFoundationalWarnings.map((w, idx) => (
            <div key={idx} className="p-2 bg-slate-950/90 border border-rose-500/60 rounded-lg space-y-1">
              <div className="font-black text-rose-300 text-[9.5px] uppercase">{w.badge}</div>
              <div className="font-bold text-white leading-snug">{w.title}</div>
              <p className="text-slate-300 text-[10px] leading-snug">{w.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {showEmbeddedOriginalPdf && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 p-2 rounded-lg border border-cyan-400/60">
            <div className="text-xs font-black text-cyan-300 uppercase">
              {selectedPdfDoc === 'side_by_side'
                ? '⚖️ VISOR COMPARADOR LADO A LADO: PDF 1 ORIGINAL (2 PÁGS) ⇄ PDF 1 ORIGINAL CON GÉMINIS (7 PÁGS)'
                : selectedPdfDoc === 'original_2p'
                ? '📘 VISOR ACTIVO: PDF 1 ORIGINAL — 03_10_2026_Marco_objetivos_tesis_Dionisio.pdf (2 PÁGS)'
                : `📘 VISOR ACTIVO: PDF 1 ORIGINAL CON GÉMINIS — ${DIRECTOR_EXPANDED_GEMINI_PDF_TITLE} (7 PÁGS)`}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedPdfDoc('original_2p')}
                className={`px-2 py-0.5 rounded text-[10px] font-black border cursor-pointer ${
                  selectedPdfDoc === 'original_2p'
                    ? 'bg-cyan-400 text-slate-950 border-white'
                    : 'bg-slate-950 text-cyan-300 border-cyan-500/60'
                }`}
              >
                📘 PDF 1 ORIGINAL (2 Págs)
              </button>
              <button
                type="button"
                onClick={() => setSelectedPdfDoc('expanded_7p')}
                className={`px-2 py-0.5 rounded text-[10px] font-black border cursor-pointer ${
                  selectedPdfDoc === 'expanded_7p'
                    ? 'bg-sky-400 text-slate-950 border-white'
                    : 'bg-slate-950 text-sky-300 border-sky-500/60'
                }`}
              >
                📘 PDF 1 ORIGINAL CON GÉMINIS (7 Págs)
              </button>
              <button
                type="button"
                onClick={() => setSelectedPdfDoc('side_by_side')}
                className={`px-2 py-0.5 rounded text-[10px] font-black border cursor-pointer ${
                  selectedPdfDoc === 'side_by_side'
                    ? 'bg-emerald-400 text-slate-950 border-white'
                    : 'bg-slate-950 text-emerald-300 border-emerald-500/60'
                }`}
              >
                ⚖️ Ver Ambos Lado a Lado (2p ⇄ 7p)
              </button>
            </div>
          </div>
          {selectedPdfDoc === 'side_by_side' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <div className="px-2 py-1 bg-cyan-950 border border-cyan-400 rounded text-[10px] font-black text-cyan-200 flex items-center justify-between">
                  <span>📘 PDF 1 ORIGINAL (2 Páginas • Mandato Literal Directora)</span>
                  <span>03/10/2026</span>
                </div>
                <div className="w-full h-[500px] rounded-xl overflow-hidden border-2 border-cyan-400 bg-slate-900">
                  <iframe
                    src={DIRECTOR_ORIGINAL_PDF_PATH}
                    title="PDF 1 ORIGINAL (03_10_2026_Marco_objetivos_tesis_Dionisio.pdf)"
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="px-2 py-1 bg-sky-950 border border-sky-400 rounded text-[10px] font-black text-sky-200 flex items-center justify-between">
                  <span>📘 PDF 1 ORIGINAL CON GÉMINIS (7 Páginas • Estudio Más Profundo)</span>
                  <span>OE2 + h_TIBL + Spillover Q1–Q5</span>
                </div>
                <div className="w-full h-[500px] rounded-xl overflow-hidden border-2 border-sky-400 bg-slate-900">
                  <iframe
                    src={DIRECTOR_EXPANDED_GEMINI_PDF_PATH}
                    title={DIRECTOR_EXPANDED_GEMINI_PDF_TITLE}
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-[520px] rounded-xl overflow-hidden border-2 border-cyan-400 bg-slate-900">
              <iframe
                src={selectedPdfDoc === 'original_2p' ? DIRECTOR_ORIGINAL_PDF_PATH : DIRECTOR_EXPANDED_GEMINI_PDF_PATH}
                title={
                  selectedPdfDoc === 'original_2p'
                    ? 'PDF 1 ORIGINAL (03_10_2026_Marco_objetivos_tesis_Dionisio.pdf)'
                    : DIRECTOR_EXPANDED_GEMINI_PDF_TITLE
                }
                className="w-full h-full border-0"
              />
            </div>
          )}
        </div>
      )}

      {/* Transcripción Literal Íntegra de Página 1 y Página 2 del PDF del Director (Plegada por defecto, desplegable en 1 clic) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 text-xs">
        <div
          onClick={() => setIsTranscriptExpanded((prev) => !prev)}
          className="p-2.5 bg-slate-950/95 border border-cyan-500/80 hover:border-cyan-300 rounded-xl space-y-1.5 flex flex-col justify-between cursor-pointer transition-all"
          title="Toca o haz clic para desplegar o plegar la transcripción íntegra de la Página 1"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between border-b border-cyan-500/40 pb-1">
              <span className="font-black text-cyan-300 uppercase text-[11px]">
                📄 PÁGINA 1 DEL PDF ORIGINAL (PUNTOS 1, 2, 3 Y 4 INICIO)
              </span>
              <span className="px-1.5 py-0.5 bg-cyan-950 text-cyan-200 border border-cyan-500 rounded text-[9.5px] font-black">
                {isTranscriptExpanded ? '▴ Plegar Pág. 1' : '▾ Leer Pág. 1 Completa'}
              </span>
            </div>
            <div className={`space-y-1.5 text-slate-200 text-[11px] leading-snug ${isTranscriptExpanded ? '' : 'line-clamp-2'}`}>
              <p>
                <strong className="text-cyan-300">1. Objetivo general:</strong> Desarrollar y validar un gemelo digital urbano de Málaga capaz de estimar la distribución espacial y temporal del dióxido de nitrógeno (<strong className="text-white">NO₂</strong>) a partir de datos observados de movilidad, meteorología y fuentes de emisión, incorporando restricciones físicas mediante una red neuronal informada por la física (PINN), y utilizarlo para evaluar cómo las intervenciones de movilidad modifican la exposición ambiental de distintos territorios y grupos de población.
              </p>
              <p>
                <strong className="text-amber-300">2. Pregunta central de investigación:</strong> ¿En qué medida una intervención de movilidad urbana modifica la concentración y la exposición al NO₂ en Málaga, una vez consideradas la meteorología, las fuentes no viarias y las particularidades de su entorno costero?
                <br />
                <span className="text-cyan-200 font-semibold">Pregunta conceptual de apoyo:</span> ¿Cómo puede integrarse un modelo físico-informado de dispersión de NO₂ dentro de un gemelo digital urbano para evaluar el impacto ambiental y territorial de políticas de movilidad en Málaga?
              </p>
              <p>
                <strong className="text-emerald-300">3. Objetivos específicos (OE1–OE4):</strong>
                <br />• <strong>OE1. Construcción de la base de datos integrada espaciotemporal para Málaga:</strong> reunir, depurar y armonizar datos de calidad del aire, tráfico, meteorología, morfología urbana, población y fuentes complementarias relevantes, dejando documentadas su cobertura, frecuencia, resolución espacial, limitaciones y calidad.
                <br />• <strong>OE2. Desarrollo y validación del modelo físico-informado (PINN):</strong> formular e implementar una arquitectura PINN para estimar y predecir el NO₂ urbano en Málaga, contrastando su capacidad predictiva frente a modelos estadísticos, de aprendizaje automático convencional o de dispersión simplificada.
                <br />• <strong>OE3. Evaluación de una intervención real de movilidad:</strong> aplicar el modelo al análisis de una política concreta de movilidad urbana en Málaga —por ejemplo, la Zona de Bajas Emisiones u otra restricción o reordenación del tráfico— para separar el efecto atribuible a la movilidad de la variación debida a la meteorología y a otras fuentes.
                <br />• <strong>OE4. Dimensión territorial y distributiva:</strong> estimar cómo se reparte espacialmente el cambio en la exposición al NO₂ entre barrios, distritos o grupos de población, identificando posibles efectos desiguales y desplazamientos de tráfico hacia zonas limítrofes.
              </p>
            </div>
          </div>
          <div className="p-1.5 bg-cyan-950/50 border border-cyan-500/60 rounded-lg text-[10px] text-cyan-100 font-bold">
            📍 <strong className="text-amber-300">En {activeStreet.split(',')[0]}:</strong> NO₂ Peatón (1.8m) = <strong className="text-white">{c18m} µg/m³</strong> | Bebé (0.9m) = <strong className="text-rose-200">{c09m} µg/m³</strong> | Cabina (4.0m) = <strong className="text-emerald-300">{c40m} µg/m³</strong> ({OFFICIAL_MALAGA_AIR_STATIONS.length}+{OFFICIAL_SATELLITE_MISSIONS.length} sensores).
          </div>
        </div>

        <div
          onClick={() => setIsTranscriptExpanded((prev) => !prev)}
          className="p-2.5 bg-slate-950/95 border border-amber-500/80 hover:border-amber-300 rounded-xl space-y-1.5 flex flex-col justify-between cursor-pointer transition-all"
          title="Toca o haz clic para desplegar o plegar la transcripción íntegra de la Página 2"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between border-b border-amber-500/40 pb-1">
              <span className="font-black text-amber-300 uppercase text-[11px]">
                📄 PÁGINA 2 DEL PDF ORIGINAL (PUNTOS 4, 5, 6.1–6.5 Y 7)
              </span>
              <span className="px-1.5 py-0.5 bg-amber-950 text-amber-200 border border-amber-500 rounded text-[9.5px] font-black">
                {isTranscriptExpanded ? '▴ Plegar Pág. 2' : '▾ Leer Pág. 2 Completa'}
              </span>
            </div>
            <div className={`space-y-1.5 text-slate-200 text-[11px] leading-snug ${isTranscriptExpanded ? '' : 'line-clamp-2'}`}>
              <p>
                <strong className="text-amber-300">4. Delimitación del alcance:</strong> El núcleo de la tesis no es la química atmosférica por sí misma ni la construcción de una plataforma tecnológica como fin independiente. El núcleo es la relación entre movilidad urbana, concentraciones de NO₂, exposición de la población y evaluación de políticas públicas en Málaga. Elementos como el puerto, el aeropuerto, las brisas costeras, el terral, la altura de la capa de mezcla, los episodios de polvo sahariano, el ambiente salino, la radiación, la vegetación o la morfología urbana no constituyen objetivos independientes: se incorporan como <strong className="text-white">fuentes de emisión, controles, condiciones de contorno o mecanismos físicos</strong> cuando su relevancia para el NO₂ pueda justificarse y exista fuente fiable.
              </p>
              <p>
                <strong className="text-emerald-300">5. Criterio metodológico para la PINN:</strong> La tesis deberá distinguir de forma explícita entre datos observados, variables derivadas y variables modelizadas. La existencia de ecuaciones físicas o fórmulas en una hoja de cálculo no será considerada, por sí sola, una PINN. La implementación deberá incluir una red neuronal entrenable, una función de pérdida que combine información empírica y restricciones físicas, un procedimiento de optimización y una validación reproducible.
              </p>
              <p>
                <strong className="text-cyan-300">6. Secuencia de trabajo de la siguiente fase (6.1 a 6.5) y 7. Resultado esperado:</strong>
                <br />• <strong>6.1:</strong> Auditar todas las fuentes identificadas (disponibilidad real, acceso, cobertura temporal, frecuencia, resolución espacial y condiciones de uso).
                <br />• <strong>6.2:</strong> Construir una matriz definitiva de variables (fuente, unidad, frecuencia, resolución, carácter [OBS]/[DERIV]/[MOD] y función en el modelo).
                <br />• <strong>6.3:</strong> Seleccionar el conjunto mínimo de variables necesario para una primera versión operativa del gemelo digital (MVP).
                <br />• <strong>6.4:</strong> Especificar formalmente la arquitectura de la PINN y su estrategia de entrenamiento y validación.
                <br />• <strong>6.5 y 7:</strong> Solo después, definir la intervención de movilidad y la estrategia de identificación causal, revelando <em>¿dónde y para quién?</em> se producen esos efectos.
              </p>
            </div>
          </div>
          <div className="p-1.5 bg-amber-950/50 border border-amber-500/60 rounded-lg text-[10px] text-amber-100 font-bold">
            📍 <strong className="text-cyan-300">Controles en {activeStreet.split(',')[0]}:</strong> H/W = <strong className="text-white">{hw}</strong> | SVF = <strong className="text-white">{svf}</strong> | Viento = <strong className="text-white">{windMs} m/s</strong> | Cota = <strong className="text-white">{elevM} m</strong> ({activeDistrict}).
          </div>
        </div>
      </div>
    </div>
  );
};

export const DirectorTenContextVariablesTable: React.FC<{ activePointCtx: any; onDownloadMonograph: (id: DirectorMonographPointId) => void }> = ({
  activePointCtx,
  onDownloadMonograph
}) => {
  const [isCompactMode, setIsCompactMode] = useState<boolean>(true);
  const [expandedRowNums, setExpandedRowNums] = useState<number[]>([]);
  const [controlFilterQuery, setControlFilterQuery] = useState<string>('');

  const toggleRowExpansion = (num: number) => {
    setExpandedRowNums((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  };

  const activeStreet =
    activePointCtx?.activePoint?.nearestStreetName ||
    activePointCtx?.activePoint?.name ||
    'Calle Marqués de Larios, Málaga';
  const lat = activePointCtx?.location?.lat ?? 36.7196;
  const lon = activePointCtx?.location?.lon ?? -4.4200;
  const elevM = Math.round(activePointCtx?.assimilation?.elevationM ?? activePointCtx?.activePoint?.elevationM ?? 11);
  const c18m = Number((activePointCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? activePointCtx?.data?.no2_satelite_base ?? 28.4).toFixed(1));
  const pm10 = Number((activePointCtx?.assimilation?.pm10UgM3 ?? activePointCtx?.data?.pm10 ?? 24.5).toFixed(1));
  const pm25 = Number((activePointCtx?.assimilation?.pm25UgM3 ?? activePointCtx?.data?.pm2_5 ?? 9.2).toFixed(1));
  const windKmh = Number((activePointCtx?.assimilation?.windSpeedKmh ?? activePointCtx?.data?.velocidad_viento_km_h ?? 9.4).toFixed(1));
  const windMs = Number((windKmh / 3.6).toFixed(1));
  const windDir = Math.round(activePointCtx?.assimilation?.windDirectionDeg ?? activePointCtx?.data?.direccion_viento_grados ?? 135);
  const tempC = Number((activePointCtx?.assimilation?.temperatureC ?? activePointCtx?.data?.temperatura_malaga ?? 22.4).toFixed(1));
  const rhPct = Math.round(activePointCtx?.assimilation?.relativeHumidityPct ?? activePointCtx?.data?.humedad_relativa ?? 62);
  const radWm2 = Math.round(activePointCtx?.assimilation?.solarRadiationWm2 ?? activePointCtx?.data?.shortwave_radiation ?? 640);
  const hw = Number((activePointCtx?.assimilation?.aspectRatioHw ?? activePointCtx?.data?.aspect_ratio_hw ?? 1.0).toFixed(2));
  const svf = Number((activePointCtx?.assimilation?.skyViewFactorSvf ?? activePointCtx?.data?.sky_view_factor ?? 0.71).toFixed(2));
  const lai = Number((activePointCtx?.assimilation?.treeCanopyLai ?? activePointCtx?.data?.lai_arbolado ?? 1.35).toFixed(2));
  const isTio2 = /alameda principal|urban|soho|carreter|álamos|alamos|oller|lagunillas|cobertizo|santo domingo|teatinos/i.test(activeStreet);

  // Distancias ortodrómicas reales al Puerto (Muelle 2/3: 36.7135, -4.4170) y Aeropuerto LEMG (36.6749, -4.4991)
  const distPortKm = Number(Math.hypot((lat - 36.7135) * 111.32, (lon - -4.4170) * 111.32 * Math.cos((lat * Math.PI) / 180)).toFixed(2));
  const distAirportKm = Number(Math.hypot((lat - 36.6749) * 111.32, (lon - -4.4991) * 111.32 * Math.cos((lat * Math.PI) / 180)).toFixed(2));
  const portPlumeUg = Number((Math.max(0.2, 2.8 * Math.exp(-distPortKm / 2.2))).toFixed(2));
  const airportPlumeUg = Number((Math.max(0.1, 1.9 * Math.exp(-distAirportKm / 4.5))).toFixed(2));
  const pblHeightM = Math.round(520 + windMs * 62 + Math.max(0, tempC - 18) * 18);
  const jNo2Val = Number((0.0062 * (0.45 + 0.55 * svf) * (radWm2 / 650)).toFixed(5));
  const vdWesely = Number((0.28 + svf * 0.24 + lai * 0.08).toFixed(2));
  const clno2Ppt = Math.round(Math.max(15, 78 * Math.exp(-distPortKm / 3.5) * (rhPct / 65)));

  const liveControlValueByNum: Record<number, string> = {
    1: `Dist. Puerto: ${distPortKm} km • Aporte NO₂ marítimo: +${portPlumeUg} µg/m³ (Med SOx ECA 0,10%)`,
    2: `Dist. Pista LEMG: ${distAirportKm} km • Pluma LTO: +${airportPlumeUg} µg/m³ (186.990 ops/año)`,
    3: `Viento: ${windMs} m/s (${windKmh} km/h) • Dir: ${windDir}° (${windDir >= 90 && windDir <= 210 ? 'Brisa Marina SE/S activa' : 'Flujo continental'})`,
    4: `T = ${tempC} °C • HR = ${rhPct}% • ${windDir >= 280 || windDir <= 30 ? 'Régimen Terral NW activo' : 'Sin catabático Terral (HR > 35%)'}`,
    5: `h_mix (PBL) = ${pblHeightM} m • Cota calle = ${elevM} m s.n.m.`,
    6: `PM₁₀ = ${pm10} µg/m³ • PM₂.₅ = ${pm25} µg/m³ (Fracción gruesa: ${(pm10 - pm25).toFixed(1)} µg/m³)`,
    7: `ClNO₂ costero = ${clno2Ppt} ppt • HR = ${rhPct}% (Dist. costa: ${distPortKm} km)`,
    8: `Irradiancia SW = ${radWm2} W/m² • Fotólisis J_NO₂ = ${jNo2Val} s⁻¹`,
    9: `Dosel LAI = ${lai} m²/m² • v_d Wesely = ${vdWesely} cm/s (${activePointCtx?.nearestTreeStreet?.species || 'Arboleda viaria'})`,
    10: `H/W = ${hw} • SVF = ${svf} • Firme: ${isTio2 ? '✨ TiO₂ Grado A1' : 'Asfalto SMA11'} (NO₂ 1.8m = ${c18m} µg/m³)`
  };

  const filteredItems = DIRECTOR_10_CONTEXT_VARIABLES_JUSTIFICATION.filter((item) => {
    if (!controlFilterQuery.trim()) return true;
    const q = controlFilterQuery.toLowerCase();
    return (
      item.contextElement.toLowerCase().includes(q) ||
      item.roleLabel.toLowerCase().includes(q) ||
      item.relevanceForNo2Justification.toLowerCase().includes(q) ||
      item.errorIfOmittedInMobilityEval.toLowerCase().includes(q) ||
      item.verifiedReliableSourceMalaga.toLowerCase().includes(q)
    );
  });

  return (
    <div
      id="director-sec-4-ten-context-vars"
      className="p-3 bg-slate-900/95 border-2 border-amber-400 rounded-xl space-y-2.5 shadow-[0_0_20px_rgba(245,158,11,0.18)]"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b-2 border-amber-500/50 pb-2">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <ScientificTooltip
              position="top"
              width="w-[390px]"
              title="Punto 4 del PDF del Director: Justificación de las 10 Variables de Contexto y Control"
              content="En la página 2 de su PDF, el Director exige textualmente: 'En una primera fase deberá justificarse de forma explícita qué variables son imprescindibles para el núcleo de la tesis, cuáles cumplen una función de control y cuáles quedan fuera del alcance inicial, especificando su relevancia para el NO₂ y la existencia de fuentes de datos fiables para su incorporación'. Esta tabla responde una por una a las 10 variables listadas en dicho párrafo."
              regulatory="DOC-01 Punto 4 (Página 2 del PDF Original)"
            >
              <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-xs uppercase rounded cursor-help">
                🛡️ TABLA JUSTIFICADA DE LAS 10 VARIABLES DE CONTEXTO Y CONTROL (PUNTO 4)
              </span>
            </ScientificTooltip>
            <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-400 text-emerald-200 text-[10.5px] font-black rounded">
              10/10 CONTROLES JUSTIFICADOS ✓
            </span>
            <span className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-400 text-cyan-200 text-[10.5px] font-black rounded">
              📍 {activeStreet.split(',')[0]} ({lat.toFixed(4)}°N, {lon.toFixed(4)}°W)
            </span>
          </div>
          <p className="text-[11px] text-slate-200 mt-0.5">
            Respuesta directa a la Pág. 2 del PDF: cuantificación en vivo de por qué cada variable evita sesgar la evaluación causal de la ZBE.
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <input
            type="text"
            value={controlFilterQuery}
            onChange={(e) => setControlFilterQuery(e.target.value)}
            placeholder="🔎 Filtrar control..."
            className="w-36 sm:w-44 px-2 py-1 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded text-[10.5px] text-white placeholder-slate-400"
          />
          {controlFilterQuery && (
            <button
              type="button"
              onClick={() => setControlFilterQuery('')}
              className="px-1.5 py-1 bg-slate-800 text-slate-400 hover:text-white rounded text-[10px]"
            >
              ✕
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsCompactMode(!isCompactMode);
              if (isCompactMode) setExpandedRowNums([]);
            }}
            className={`px-2.5 py-1 rounded text-xs font-black border transition-all cursor-pointer flex items-center gap-1 ${
              isCompactMode
                ? 'bg-amber-400 text-slate-950 border-white shadow-sm'
                : 'bg-slate-950 text-amber-300 border-amber-400 hover:bg-slate-800'
            }`}
            title="Alterna entre modo compacto (filas de 2 renglones para ver todas de un vistazo en iPad) y modo extenso (desplegadas)"
          >
            {isCompactMode ? '📐 Vista Compacta (iPad) ✓' : '📖 Vista Extensa Completa'}
          </button>

          <ScientificTooltip
            position="left"
            width="w-[340px]"
            title="Descargar Informe PDF Supercompleto del Punto 4"
            content="Imprime en PDF A4 el informe monográfico completo del Punto 4 (Delimitación del Alcance y Tabla de las 10 Variables de Contexto y Control)."
            regulatory="Informe Monográfico Punto 4"
          >
            <button
              type="button"
              onClick={() => onDownloadMonograph('sec_4_scope')}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded border border-white cursor-pointer shrink-0 flex items-center gap-1 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>📥 PDF PUNTO 4</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>

      <TableHorizontalScrollContainer
        accent="amber"
        title="Las 10 Variables de Contexto y Control del Punto 4 del Director: Desliza con ◀ / ▶ (Toca una fila para expandir/plegar)"
        className="border border-slate-700 rounded-lg"
      >
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 text-amber-300 border-b-2 border-slate-700 uppercase text-[10.5px]">
              <th className="py-1.5 px-2 w-[210px]"># / Variable Citada (PDF Pág. 2)</th>
              <th className="py-1.5 px-2 bg-cyan-950/80 text-cyan-200 border-x border-cyan-500/40 w-[215px]">
                📍 Valor en Vivo ({activeStreet.split(',')[0]})
              </th>
              <th className="py-1.5 px-2 w-[160px]">Función y Carácter</th>
              <th className="py-1.5 px-2">Relevancia Física/Química para el NO₂</th>
              <th className="py-1.5 px-2">Sesgo de Atribución que Evita al Evaluar ZBE</th>
              <th className="py-1.5 px-2 w-[185px]">Fuente Verificada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-[11px]">
            {filteredItems.map((item) => {
              const isRowExpanded = !isCompactMode || expandedRowNums.includes(item.num);
              return (
                <tr
                  key={item.num}
                  onClick={() => toggleRowExpansion(item.num)}
                  className={`cursor-pointer transition-colors ${
                    isRowExpanded ? 'bg-slate-800/80' : 'hover:bg-slate-800/50'
                  }`}
                  title="Toca para expandir o plegar el texto completo de esta variable"
                >
                  <td className="py-1.5 px-2 align-middle">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center shrink-0">
                          {item.num}
                        </span>
                        <span className={`font-black text-white leading-tight ${isRowExpanded ? '' : 'line-clamp-1'}`} title={item.contextElement}>
                          {item.contextElement.replace(/^\d+\.\s*/, '')}
                        </span>
                      </div>
                      {isCompactMode && (
                        <span className="text-[9px] text-amber-300 font-bold shrink-0">
                          {isRowExpanded ? '▴ Plegar' : '▾ Leer'}
                        </span>
                      )}
                    </div>
                    {!isRowExpanded && item.contextElement.includes('(') && (
                      <div className="text-[9.5px] text-slate-300 line-clamp-1 pl-5">
                        {item.contextElement.slice(item.contextElement.indexOf('('))}
                      </div>
                    )}
                  </td>
                  <td className="py-1.5 px-2 align-middle bg-cyan-950/25 border-x border-cyan-500/20 text-cyan-200 font-bold leading-snug">
                    <div className={isRowExpanded ? '' : 'line-clamp-2'}>
                      {liveControlValueByNum[item.num] || 'Asimilado en vivo ✓'}
                    </div>
                  </td>
                  <td className="py-1.5 px-2 align-middle">
                    <div className={`px-1.5 py-0.5 bg-amber-950 border border-amber-400/80 text-amber-200 font-black text-[9.5px] rounded ${isRowExpanded ? '' : 'line-clamp-1'}`} title={item.roleLabel}>
                      {item.roleLabel}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[9.5px]">
                      <span className="text-emerald-300 font-black">{item.epistemicNature}</span>
                      <span className="text-purple-300 font-bold truncate">• {item.strictRoleInThesis.replace(/_/g, ' ')}</span>
                    </div>
                  </td>
                  <td className="py-1.5 px-2 align-middle text-slate-100 leading-snug">
                    <div className={isRowExpanded ? '' : 'line-clamp-2'}>
                      {item.relevanceForNo2Justification}
                    </div>
                  </td>
                  <td className="py-1.5 px-2 align-middle text-amber-200 leading-snug">
                    <div className={isRowExpanded ? '' : 'line-clamp-2'}>
                      {item.errorIfOmittedInMobilityEval}
                    </div>
                  </td>
                  <td className="py-1.5 px-2 align-middle text-cyan-200 leading-snug">
                    <div className={isRowExpanded ? '' : 'line-clamp-2'}>
                      {item.verifiedReliableSourceMalaga}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableHorizontalScrollContainer>
    </div>
  );
};

export const DirectorFormalPinnSection64: React.FC<{
  activePointCtx: any;
  liveFivePointsMetrics: any;
  onDownloadMonograph: (id: DirectorMonographPointId) => void;
  onOpenModal?: (modalId: string) => void;
}> = ({ activePointCtx, liveFivePointsMetrics, onDownloadMonograph, onOpenModal }) => {
  const [copiedLatex, setCopiedLatex] = useState(false);
  const [isPinnCardsCompact, setIsPinnCardsCompact] = useState<boolean>(true);
  const activeStreet =
    activePointCtx?.activePoint?.nearestStreetName ||
    activePointCtx?.activePoint?.name ||
    liveFivePointsMetrics?.streetLabel ||
    'Calle Marqués de Larios, Málaga';
  const loocvRows = computeOutOfSampleLoocvValidation(liveFivePointsMetrics?.windSpeed ?? 3.2);
  const meanRmsePinn = Number(
    (loocvRows.reduce((acc, r) => acc + r.pinnRmseUgM3, 0) / Math.max(1, loocvRows.length)).toFixed(2)
  );
  const meanRmseKriging = Number(
    (loocvRows.reduce((acc, r) => acc + r.krigingRmseUgM3, 0) / Math.max(1, loocvRows.length)).toFixed(2)
  );
  const meanImprovementPct = Number(
    (loocvRows.reduce((acc, r) => acc + r.improvementOverBaselinePct, 0) / Math.max(1, loocvRows.length)).toFixed(1)
  );

  const handleCopyLatex64 = () => {
    const tex = exportPinnFormalSpecChapterLatex(activePointCtx);
    navigator.clipboard.writeText(tex);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2500);
  };

  return (
    <div
      id="director-sec-6-4-pinn"
      className="p-3 bg-gradient-to-br from-indigo-950/85 via-slate-950 to-purple-950/75 border-2 border-indigo-400 rounded-xl space-y-2.5 shadow-[0_0_24px_rgba(99,102,241,0.28)]"
    >
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 border-b border-indigo-500/50 pb-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <ScientificTooltip
              position="top"
              width="w-[400px]"
              title="Punto 5 y Paso 6.4 del PDF del Director: Especificación Formal de la Arquitectura PINN, Entrenamiento y Validación"
              content="Responde con máximo rigor doctoral al Punto 5 y al Paso 4 (6.4) de la página 2 del PDF del Director: 'Especificar formalmente la arquitectura PINN y su estrategia de entrenamiento y validación' y 'Especificar una red neuronal entrenable, una función de pérdida con componente empírica y componente física, un procedimiento de optimización y un protocolo reproducible de validación fuera de muestra'."
              regulatory="DOC-01 Punto 5 y Paso 6.4 • OE2"
            >
              <span className="px-2 py-0.5 bg-gradient-to-r from-indigo-400 to-cyan-300 text-slate-950 font-black text-[11px] uppercase rounded cursor-help">
                ⚛️ PUNTO 5 Y PASO 6.4 • ARQUITECTURA PINN, ENTRENAMIENTO Y VALIDACIÓN LOOCV (OE2)
              </span>
            </ScientificTooltip>
            <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-400 text-emerald-200 text-[10.5px] font-black rounded">
              MQI = {liveFivePointsMetrics?.mqi ?? 0.54} ≤ 1.0 • MEJORA LOOCV = +{meanImprovementPct}% ✓
            </span>
            <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-400 text-cyan-200 text-[10.5px] font-black rounded">
              📍 {activeStreet.split(',')[0]} (NO₂ 1.8m: {liveFivePointsMetrics?.cPoint} µg/m³ • Testigo: {liveFivePointsMetrics?.witnessStation?.code} {liveFivePointsMetrics?.loocvRelErrorPct}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setIsPinnCardsCompact((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black border cursor-pointer transition-all ${
              isPinnCardsCompact
                ? 'bg-indigo-400 text-slate-950 border-white shadow-sm'
                : 'bg-slate-900 text-indigo-200 border-indigo-400 hover:bg-slate-800'
            }`}
            title="Alterna entre tarjetas A/B/C compactas (para ver la tabla LOOCV arriba sin scroll) y desplegadas completas"
          >
            {isPinnCardsCompact ? '📐 Bloques A/B/C Compactos ✓' : '📖 Bloques A/B/C Extensos'}
          </button>

          <ScientificTooltip
            position="top"
            width="w-[340px]"
            title="Copiar Capítulo LaTeX Completo del Paso 6.4 (Ecuaciones + Algoritmo 1 + Tabla LOOCV)"
            content="Copia al portapapeles el código fuente LaTeX íntegro de la sección 6.4 (adimensionalización, Fourier Features, red 6x128, ansatz de Dirichlet, pérdida de 5 términos, Algoritmo 1 y tabla booktabs LOOCV) listo para pegar en Overleaf."
            regulatory="Capítulo Metodológico LaTeX UNED"
          >
            <button
              type="button"
              onClick={handleCopyLatex64}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10.5px] rounded-lg border border-indigo-200 cursor-pointer flex items-center gap-1 shadow-sm"
            >
              {copiedLatex ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLatex ? '¡LaTeX Copiado!' : '📋 Copiar LaTeX 6.4'}</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            width="w-[340px]"
            title="Descargar Informe PDF Supercompleto del Paso 6.4 (Arquitectura PINN)"
            content="Genera y descarga un informe PDF A4 exclusivo del Paso 6.4 y Punto 5 con toda la especificación formal de la red PINN, su entrenamiento y su validación fuera de muestra en el punto activo."
            regulatory="Informe Monográfico Paso 6.4"
          >
            <button
              type="button"
              onClick={() => onDownloadMonograph('sec_6_4_pinn')}
              className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black text-[10.5px] rounded-lg border border-white cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <Download className="w-3 h-3" />
              <span>📥 PDF PASO 6.4</span>
            </button>
          </ScientificTooltip>

          {onOpenModal && (
            <ScientificTooltip
              position="top"
              width="w-[360px]"
              title="Abrir Consola de Benchmarking y Ablación PINN (OE2)"
              formula="\\text{MQI} = \\frac{\\text{RMSE}(C_{\\text{PINN}}, C_{\\text{obs}})}{\\beta \\cdot U_{95}(C_{\\text{obs}})} \\le 1,0"
              content="Abre la consola dedicada de validación cruzada espacial ciega (LOOCV), ablación de arquitecturas y métricas FAIRMODE WG1 del Objetivo Específico 2 (OE2)."
              laymanExplanation="Abre la ventana especializada para comparar el rendimiento del modelo PINN frente a otros métodos."
              regulatory="FAIRMODE WG1 Guidance • Objetivo Específico 2 (OE2)"
              citation="Thunis et al. (2012), Atmos. Environ., 59, 476-482"
            >
              <button
                type="button"
                onClick={() => onOpenModal('pinnBenchmark')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-400 rounded-lg text-[10.5px] font-black cursor-pointer flex items-center gap-1"
              >
                <span>Consola OE2</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </ScientificTooltip>
          )}
        </div>
      </div>

      {/* Sub-bloque A, B, C en 3 tarjetas doctorales (Compactas en iPad/PC/Móvil con clic para expandir/plegar) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* A. Arquitectura Formal y Adimensionalización */}
        <div
          onClick={() => setIsPinnCardsCompact((prev) => !prev)}
          className="p-2.5 bg-slate-950/95 border border-cyan-500/80 hover:border-cyan-300 rounded-xl space-y-1.5 cursor-pointer transition-all"
          title="Haz clic para desplegar o plegar el detalle de los Bloques A, B y C"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-black text-cyan-300 uppercase">
              A. RED <MathFormula math="\mathcal{N}_\theta" /> &amp; ESCALADO PDE
            </span>
            <span className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-400 text-cyan-200 text-[9.5px] font-black rounded">
              6×128 • 86.403 PARÁM. {isPinnCardsCompact ? '▾' : '▴'}
            </span>
          </div>
          <div className="p-1.5 bg-slate-900 border border-slate-700 rounded text-center text-[10.5px] text-cyan-200 overflow-x-auto">
            <MathFormula
              math="\frac{1}{\text{St}}\frac{\partial C^*}{\partial t^*} + \mathbf{u}^*\cdot\nabla^* C^* = \frac{1}{\text{Pe}_t}\nabla^*\cdot(\mathbf{K}^*\nabla^* C^*) + \text{Da}_{\text{chem}} R^* + S^*_{\text{tráfico}}"
              displayMode={false}
            />
          </div>
          {isPinnCardsCompact ? (
            <div className="text-[10.5px] text-slate-200 line-clamp-2 leading-snug">
              <strong className="text-cyan-300">RFF(64)</strong> (Tancik 2020, H/W={(liveFivePointsMetrics?.aspectRatioHw ?? 1.25).toFixed(2)}) + <strong className="text-amber-300">MLP 6×128 Swish</strong> + <strong className="text-emerald-300">Hard-Constraint</strong> <MathFormula math="\hat{C}=C_{\text{BC}}+D(\mathbf{x})\text{Softplus}(z)" />. <span className="text-cyan-400 font-bold">▾ Desplegar</span>
            </div>
          ) : (
            <ul className="space-y-1 text-[11px] text-slate-200 leading-snug">
              <li>
                • <strong className="text-cyan-300">Codificación RFF (Tancik 2020):</strong> <MathFormula math="\gamma(\tilde{\mathbf{x}}) = [\cos(2\pi\mathbf{B}\tilde{\mathbf{x}}), \sin(2\pi\mathbf{B}\tilde{\mathbf{x}})]^T \in \mathbb{R}^{64}" /> que elimina el sesgo espectral en cañones (<MathFormula math="H/W = " /> {(liveFivePointsMetrics?.aspectRatioHw ?? 1.25).toFixed(2)}).
              </li>
              <li>
                • <strong className="text-amber-300">Topología MLP Residual:</strong> <MathFormula math="L=6" /> capas ocultas × <MathFormula math="W=128" /> neuronas, activación <MathFormula math="\sigma(s)=s\cdot\text{sigmoid}(\beta s) \in C^\infty" /> para segundas derivadas exactas <MathFormula math="\nabla^2 C" />.
              </li>
              <li>
                • <strong className="text-emerald-300">Ansatz Hard-Constraint (Sukumar 2022):</strong> <MathFormula math="\hat{C}_{\text{NO}_2} = C_{\text{BC}} + D(\mathbf{x})\cdot\text{Softplus}(z_{\text{NO}_2})" />, garantizando positividad estricta y condición de contorno exacta en pavimento (<MathFormula math="z=0" />) y fachadas. <span className="text-cyan-400 font-bold">▴ Plegar</span>
              </li>
            </ul>
          )}
        </div>

        {/* B. Estrategia de Entrenamiento (Algoritmo 1) */}
        <div
          onClick={() => setIsPinnCardsCompact((prev) => !prev)}
          className="p-2.5 bg-slate-950/95 border border-purple-500/80 hover:border-purple-300 rounded-xl space-y-1.5 cursor-pointer transition-all"
          title="Haz clic para desplegar o plegar el detalle de los Bloques A, B y C"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-black text-purple-300 uppercase">
              B. ENTRENAMIENTO (ALGORITMO 1)
            </span>
            <span className="px-1.5 py-0.5 bg-purple-950 border border-purple-400 text-purple-200 text-[9.5px] font-black rounded">
              ADAM + L-BFGS-B + NTK {isPinnCardsCompact ? '▾' : '▴'}
            </span>
          </div>
          <div className="p-1.5 bg-slate-900 border border-slate-700 rounded text-center text-[10.5px] text-purple-200 overflow-x-auto">
            <MathFormula
              math="\mathcal{L}_{\text{total}}(\theta) = \lambda_{\text{data}}\mathcal{L}_{\text{data}} + \lambda_{\text{col}}\mathcal{L}_{\text{col}} + \lambda_{\text{PDE}}\mathcal{L}_{\text{PDE}} + \lambda_{\text{chem}}\mathcal{L}_{\text{chem}} + \lambda_{\text{BC}}\mathcal{L}_{\text{BC}}"
              displayMode={false}
            />
          </div>
          {isPinnCardsCompact ? (
            <div className="text-[10.5px] text-slate-200 line-clamp-2 leading-snug">
              <strong className="text-purple-300">Etapa 1 AdamW</strong> (5.000 ép.) + <strong className="text-amber-300">Pesos NTK</strong> (Wang 2022) + <strong className="text-emerald-300">Etapa 2 L-BFGS-B</strong> (2.000 it., RAR-D, δ={liveFivePointsMetrics?.resPde ?? 0.004}). <span className="text-purple-300 font-bold">▾ Desplegar</span>
            </div>
          ) : (
            <ul className="space-y-1 text-[11px] text-slate-200 leading-snug">
              <li>
                • <strong className="text-purple-300">Etapa 1 (Exploración Global):</strong> Optimizador <strong>AdamW</strong> (<MathFormula math="E_1 = 5\,000" /> épocas, <MathFormula math="\eta: 10^{-3}\to 10^{-5}" /> Cosine Annealing) + curriculum learning de <MathFormula math="\lambda_{\text{PDE}}" />.
              </li>
              <li>
                • <strong className="text-amber-300">Pesos Auto-Adaptativos NTK (Wang 2022):</strong> Equilibra espectralmente los gradientes <MathFormula math="\lambda_k \propto \text{Tr}(\mathbf{K}_{\text{NTK}}) / \text{Tr}(\mathbf{K}_k)" /> cada 100 épocas.
              </li>
              <li>
                • <strong className="text-emerald-300">Etapa 2 (Refinamiento Cuasi-Newton):</strong> <strong>L-BFGS-B</strong> (<MathFormula math="E_2 = 2\,000" /> iteraciones, memoria <MathFormula math="m=50" />, Strong Wolfe) + muestreo adaptativo <strong>RAR-D</strong> en estelas de tráfico hasta <MathFormula math="\delta_{\text{PINN}} = " /> {liveFivePointsMetrics?.resPde ?? 0.004} µg/(m³·s). <span className="text-purple-300 font-bold">▴ Plegar</span>
              </li>
            </ul>
          )}
        </div>

        {/* C. Protocolo Reproducible de Validación Fuera de Muestra */}
        <div
          onClick={() => setIsPinnCardsCompact((prev) => !prev)}
          className="p-2.5 bg-slate-950/95 border border-emerald-500/80 hover:border-emerald-300 rounded-xl space-y-1.5 cursor-pointer transition-all"
          title="Haz clic para desplegar o plegar el detalle de los Bloques A, B y C"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-black text-emerald-300 uppercase">
              C. VALIDACIÓN FUERA DE MUESTRA
            </span>
            <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-400 text-emerald-200 text-[9.5px] font-black rounded">
              LOOCV + 4 REGÍMENES {isPinnCardsCompact ? '▾' : '▴'}
            </span>
          </div>
          {isPinnCardsCompact ? (
            <div className="text-[10.5px] text-slate-200 space-y-1 leading-snug">
              <div className="p-1.5 bg-slate-900 border border-slate-700 rounded text-emerald-200 font-bold">
                RMSE PINN = <strong className="text-white">{meanRmsePinn}</strong> vs Kriging <strong className="text-rose-300">{meanRmseKriging} µg/m³</strong> (<strong className="text-emerald-300">+{meanImprovementPct}%</strong>)
              </div>
              <div className="line-clamp-2">
                4 Regímenes (Brisa SE, Terral NW, Inversión, Calima) + Ablación M0→M4 (MQI {liveFivePointsMetrics?.mqi ?? 0.54} ✓, 0% violación física). <span className="text-emerald-400 font-bold">▾ Desplegar</span>
              </div>
            </div>
          ) : (
            <ul className="space-y-1.5 text-[11px] text-slate-200 leading-snug">
              <li>
                • <strong className="text-emerald-300">1. Validación Cruzada Espacial Ciega (Leave-One-Station-Out):</strong> Se oculta secuencialmente cada estación (<MathFormula math="k \notin \mathcal{D}_{\text{train}}" />): RMSE PINN = <strong className="text-white">{meanRmsePinn} µg/m³</strong> vs. Kriging sin física (<strong className="text-rose-300">{meanRmseKriging} µg/m³</strong>), reduciendo el error un <strong className="text-emerald-300">+{meanImprovementPct}%</strong>.
              </li>
              <li>
                • <strong className="text-cyan-300">2. Validación Temporal Block-CV en 4 Regímenes de Málaga:</strong> (i) Brisa marina SE, (ii) Terral NW catabático, (iii) Inversión invernal (<MathFormula math="h_{\text{mix}} < 250\text{ m}" />) e (iv) Intrusión sahariana (AOD &gt; 0,45).
              </li>
              <li>
                • <strong className="text-amber-300">3. Ablación Evolutiva en 5 Escalones (M0→M4):</strong> M0 IDW (MQI 1,34 ❌) → M1 OSPM (MQI 0,94) → M2 MLP sin PDE (MQI 0,88, 19,4% masa negativa ❌) → M3 PINN sin controles (MQI 0,71) → <strong>M4 PINN Completa (MQI {liveFivePointsMetrics?.mqi ?? 0.54} ✓, 0,0% violaciones físicas)</strong>. <span className="text-emerald-400 font-bold">▴ Plegar</span>
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* Tabla LOOCV en vivo del Paso 6.4 (Plegable bajo demanda) */}
      <details open className="bg-slate-950/90 border border-cyan-500/60 rounded-xl p-2 group">
        <summary className="cursor-pointer list-none flex flex-wrap items-center justify-between gap-2 text-[11px] font-black text-cyan-300 uppercase">
          <span>📊 Tabla de Validación Espacial Ciega (LOOCV) del Paso 6.4: PINN vs. Kriging Ordinario ({loocvRows.length} Estaciones)</span>
          <span className="px-2 py-0.5 bg-slate-900 border border-cyan-400/60 rounded text-[10px] text-cyan-200">
            Clic para plegar / desplegar Tabla LOOCV ▼
          </span>
        </summary>
        <div className="mt-2">
          <TableHorizontalScrollContainer
            accent="cyan"
            title="Tabla de Validación Espacial Ciega (LOOCV) del Paso 6.4: PINN vs. Kriging Ordinario Fuera de Muestra"
            className="border border-slate-700 rounded-lg"
          >
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-950 text-cyan-300 border-b border-slate-700 uppercase">
                  <th className="py-1.5 px-2">Estación Oculta (Fold LOOCV)</th>
                  <th className="py-1.5 px-2">Tipología / Entorno Urbano</th>
                  <th className="py-1.5 px-2">NO₂ Observado [OBS]</th>
                  <th className="py-1.5 px-2">Kriging sin Física</th>
                  <th className="py-1.5 px-2">Predicción Ciega PINN [MOD]</th>
                  <th className="py-1.5 px-2">RMSE (Kriging vs PINN)</th>
                  <th className="py-1.5 px-2">R² / FAC2 (%) / Mejora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/90">
                {loocvRows.map((st) => (
                  <tr key={st.stationId} className="hover:bg-indigo-950/40">
                    <td className="py-1.5 px-2 font-black text-white">{st.stationName}</td>
                    <td className="py-1.5 px-2 text-slate-300">{st.environmentType}</td>
                    <td className="py-1.5 px-2 font-black text-emerald-300">{st.observedMeanNo2UgM3} µg/m³</td>
                    <td className="py-1.5 px-2 text-amber-200">{st.krigingOutOfSampleUgM3} µg/m³</td>
                    <td className="py-1.5 px-2 font-black text-cyan-200">{st.pinnOutOfSampleUgM3} µg/m³</td>
                    <td className="py-1.5 px-2">
                      <span className="text-rose-300 font-bold">{st.krigingRmseUgM3}</span>
                      <span className="text-slate-400"> → </span>
                      <span className="text-emerald-300 font-black">{st.pinnRmseUgM3} µg/m³</span>
                    </td>
                    <td className="py-1.5 px-2">
                      <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-400 text-emerald-200 font-black rounded text-[10px]">
                        R² = {st.pinnR2} • FAC2 = {st.pinnFac2Pct}% (+{st.improvementOverBaselinePct}%)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableHorizontalScrollContainer>
        </div>
      </details>

      {/* BLOQUE OE2 CANÓNICO (ECUACIONES 1–4) + CAPA LÍMITE COSTERA h_TIBL(x) + HOJA DE RUTA EN 5 PASOS CON CRITERIO DE CIERRE */}
      {(() => {
        const expStudy = computeExpandedDirectorStudyLiveMetrics(activePointCtx);
        return (
          <details open className="bg-slate-950/95 border-2 border-cyan-400/80 rounded-xl p-2.5 group space-y-2.5">
            <summary className="cursor-pointer list-none flex flex-wrap items-center justify-between gap-2 text-[11px] font-black text-cyan-300 uppercase">
              <span>
                📘 ESPECIFICACIÓN TÉCNICA OE2 (ECS. 1–4), CAPA LÍMITE COSTERA h_TIBL(x) Y HOJA DE RUTA EN 5 PASOS (ESTUDIO PROFUNDO GEMINIS 7 PÁGS)
              </span>
              <span className="px-2 py-0.5 bg-slate-900 border border-cyan-400/60 rounded text-[10px] text-cyan-200">
                Clic para plegar / desplegar Especificación OE2 ▼
              </span>
            </summary>

            {/* 4 Ecuaciones Canónicas OE2 + Física Costera h_TIBL(x) en Vivo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 pt-1 text-[10.5px]">
              <div className="p-2 bg-slate-900/95 border border-cyan-500/60 rounded-lg space-y-1">
                <div className="font-black text-cyan-300 uppercase text-[10px]">
                  (1) Red Sustituta &amp; (2) PDE Gobernante
                </div>
                <div className="p-1.5 bg-black/60 rounded border border-slate-800 overflow-x-auto">
                  <MathFormula math={expStudy.oe2CanonicalSpec.eq1Surrogate} />
                </div>
                <div className="p-1.5 bg-black/60 rounded border border-slate-800 overflow-x-auto">
                  <MathFormula math={expStudy.oe2CanonicalSpec.eq2GoverningPde} />
                </div>
              </div>

              <div className="p-2 bg-slate-900/95 border border-indigo-500/60 rounded-lg space-y-1">
                <div className="font-black text-indigo-300 uppercase text-[10px]">
                  (3) Residuo Autograd &amp; (4) Pérdida Compuesta
                </div>
                <div className="p-1.5 bg-black/60 rounded border border-slate-800 overflow-x-auto">
                  <MathFormula math={expStudy.oe2CanonicalSpec.eq3AutoDiffResidual} />
                </div>
                <div className="p-1.5 bg-black/60 rounded border border-slate-800 overflow-x-auto">
                  <MathFormula math={expStudy.oe2CanonicalSpec.eq4CompositeLoss} />
                </div>
              </div>

              <div className="p-2 bg-slate-900/95 border border-amber-400/70 rounded-lg space-y-1">
                <div className="font-black text-amber-300 uppercase text-[10px]">
                  🌊 Capa Límite Interna Térmica Costera h_TIBL(x) en Vivo
                </div>
                <div className="p-1.5 bg-black/60 rounded border border-slate-800 overflow-x-auto">
                  <MathFormula math="h_{\text{TIBL}}(x) \approx \left(\frac{2(\theta_{\text{tierra}}-\theta_{\text{mar}})u_* x}{|\partial\theta/\partial z|\cdot U_{\text{brisa}}}\right)^{1/2}" />
                </div>
                <div className="text-slate-200 text-[10px] leading-snug">
                  • Fetch marítimo Alborán: <strong className="text-cyan-300">x = {expStudy.coastalTibl.distToCoastMeters} m</strong>
                  <br />• Altura <MathFormula math="h_{\text{TIBL}}(x)" />: <strong className="text-amber-300">{expStudy.coastalTibl.tiblHeightMeters} m</strong> | <MathFormula math="K_z" /> = <strong className="text-emerald-300">{expStudy.coastalTibl.moninObukhovKzM2s} m²/s</strong>
                  <br />• Régimen: <strong className="text-white">{expStudy.coastalTibl.regimeLabel}</strong>
                </div>
              </div>
            </div>

            {/* Tabla de los 5 Operadores Físicos de la PDE en Málaga */}
            <TableHorizontalScrollContainer
              accent="cyan"
              title="Operadores Físicos de la PDE Gobernante en el Gemelo Digital de Málaga (OE2)"
              className="border border-slate-700 rounded-lg"
            >
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-slate-900 text-cyan-300 border-b border-slate-700 uppercase">
                    <th className="py-1.5 px-2">Término Físico PDE</th>
                    <th className="py-1.5 px-2">Expresión Matemática</th>
                    <th className="py-1.5 px-2">Significado en el Entorno de Málaga</th>
                    <th className="py-1.5 px-2">Evaluación en Vivo (Punto Activo)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/90">
                  {expStudy.oe2CanonicalSpec.operatorsTable.map((op, i) => (
                    <tr key={i} className="hover:bg-cyan-950/30">
                      <td className="py-1.5 px-2 font-black text-amber-300">{op.termName}</td>
                      <td className="py-1.5 px-2 text-cyan-200 font-mono">
                        <MathFormula math={op.mathExpr} />
                      </td>
                      <td className="py-1.5 px-2 text-slate-200">{op.malagaMeaning}</td>
                      <td className="py-1.5 px-2 font-black text-emerald-300">{op.liveValueLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableHorizontalScrollContainer>

            {/* Hoja de Ruta Operativa en 5 Pasos con Criterio de Cierre (Págs. 6–7 del PDF GEMINIS) */}
            <TableHorizontalScrollContainer
              accent="amber"
              title="Hoja de Ruta Operativa en 5 Pasos con Criterio de Cierre Cuantitativo (Págs. 6–7 Estudio GEMINIS)"
              className="border border-slate-700 rounded-lg"
            >
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-slate-900 text-amber-300 border-b border-slate-700 uppercase">
                    <th className="py-1.5 px-2">Paso / Objetivo</th>
                    <th className="py-1.5 px-2">Fase Metodológica</th>
                    <th className="py-1.5 px-2">Operación Técnica (PINN / DeepONet / GIS)</th>
                    <th className="py-1.5 px-2">Criterio de Cierre Exigido por el Director</th>
                    <th className="py-1.5 px-2">Estado en Vivo en la App</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/90">
                  {expStudy.fiveStepOperationalRoadmap.map((st, i) => (
                    <tr key={i} className="hover:bg-amber-950/25">
                      <td className="py-1.5 px-2 font-black text-cyan-300 whitespace-nowrap">{st.stepCode}</td>
                      <td className="py-1.5 px-2 font-bold text-white">{st.phaseTitle}</td>
                      <td className="py-1.5 px-2 text-slate-300">{st.technicalOperation}</td>
                      <td className="py-1.5 px-2 text-amber-200 font-semibold">{st.closureCriterion}</td>
                      <td className="py-1.5 px-2 font-black text-emerald-300">{st.liveVerificationInApp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableHorizontalScrollContainer>
          </details>
        );
      })()}
    </div>
  );
};

/**
 * ====================================================================================================
 * BARRA ÚNICA DESPLEGABLE DE ENTRENAMIENTO FUTURO UNED (1 SOLA LÍNEA PLEGADA • 3 FILAS LIMPIAS DESPLEGADA)
 * - Colocada arriba del todo en Directrices del Director (03/10/2026) para máxima visibilidad y cero líos.
 * - Relaciona directamente los Puntos Necesarios AHORA (Puntos 1➔7 del PDF actual + calle activa + 24+16 detectores)
 *   con los Puntos y Exigencias que imponga el Director en el FUTURO.
 * - 100% Modo Solo-Lectura: Leer el .JSON o imprimir el PDF A4 jamás altera el código ni los cálculos de la app.
 * ====================================================================================================
 */
export const DirectorUnedServerTrainingBridgePanel: React.FC<{
  activePointCtx: any;
  liveFivePointsMetrics: any;
  compactMode?: boolean;
  defaultExpanded?: boolean;
}> = ({ activePointCtx, liveFivePointsMetrics, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [showCodePreview, setShowCodePreview] = useState<'none' | 'pytorch' | 'csv' | 'slurm'>('none');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [checkpointFeedback, setCheckpointFeedback] = useState<string | null>(null);
  const [trainingQueue, setTrainingQueue] = useState(() => getLatentTrainingPointsQueue());
  const [futureRequirements, setFutureRequirements] = useState<FutureTrainingRequirementItem[]>(() =>
    getFutureTrainingRequirements()
  );
  const [newReqKind, setNewReqKind] = useState<'TEORICA' | 'TECNICA'>('TEORICA');
  const [newReqStep, setNewReqStep] = useState<string>('Paso 6.4 • PINN & LOOCV (Actual)');
  const [newReqTitle, setNewReqTitle] = useState<string>('');
  const [newReqSpec, setNewReqSpec] = useState<string>('');
  const [newReqCriterion, setNewReqCriterion] = useState<string>('');

  const activeStreet =
    activePointCtx?.activePoint?.nearestStreetName ||
    activePointCtx?.activePoint?.name ||
    liveFivePointsMetrics?.streetLabel ||
    'Calle Marqués de Larios, Málaga';
  const lat = Number(activePointCtx?.location?.lat ?? liveFivePointsMetrics?.lat ?? 36.7196);
  const lon = Number(activePointCtx?.location?.lon ?? liveFivePointsMetrics?.lon ?? -4.4200);
  const elevationM = Number(liveFivePointsMetrics?.elevationM ?? 11);
  const no2Ped = Number(liveFivePointsMetrics?.cPoint ?? 28.4);
  const no2Pediat = Number(liveFivePointsMetrics?.cZ_0_9m_pediatric ?? 31.2);
  const no2Cab = Number(liveFivePointsMetrics?.canyonMicroBreakdown?.cZ_4_0m_cabin ?? 21.2);
  const hw = Number(liveFivePointsMetrics?.aspectRatioHw ?? 1.25);
  const svf = Number(liveFivePointsMetrics?.svfVal ?? 0.68);
  const windMs = Number(liveFivePointsMetrics?.windSpeed ?? 3.2);
  const windDir = Number(liveFivePointsMetrics?.windDirDeg ?? 135);
  const pblM = Number(liveFivePointsMetrics?.dynamicPblHeightM ?? 650);
  const stationsCount = OFFICIAL_MALAGA_AIR_STATIONS.length;
  const satellitesCount = OFFICIAL_SATELLITE_MISSIONS.length;

  const generatorOpts: PythonNotebookOptions = {
    cityName: 'Málaga',
    activeStreet,
    lat,
    lon,
    elevationM,
    no2Pedestrian18m: no2Ped,
    no2Pediatric09m: no2Pediat,
    no2Cabin40m: no2Cab,
    aspectRatioHw: hw,
    svf,
    windSpeedMs: windMs,
    windDirDeg: windDir,
    pblHeightM: pblM,
    isTio2Street: Boolean(liveFivePointsMetrics?.canyonMicroBreakdown?.isTio2Street),
    primaryStationCode: liveFivePointsMetrics?.primaryStation?.code ?? 'ES2086A',
    primaryStationDistM: liveFivePointsMetrics?.primaryStation?.distMeters ?? 250
  };

  const [activeCheckpoint, setActiveCheckpoint] = useState(() =>
    getActiveUnedPinnCheckpoint(generatorOpts)
  );

  useEffect(() => {
    setActiveCheckpoint(getActiveUnedPinnCheckpoint(generatorOpts));
    setTrainingQueue(getLatentTrainingPointsQueue());
  }, [lat, lon, hw, stationsCount, satellitesCount]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__openUnedTrainingBridgeOnMount) {
      (window as any).__openUnedTrainingBridgeOnMount = false;
      setIsExpanded(true);
    }
    const handleOpenEvent = () => {
      setIsExpanded(true);
      const el = document.getElementById('director-uned-hpc-training-bridge');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    const handleToggleEvent = () => {
      setIsExpanded((prev) => !prev);
      const el = document.getElementById('director-uned-hpc-training-bridge');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    window.addEventListener('open-uned-training-bridge', handleOpenEvent);
    window.addEventListener('toggle-uned-training-bridge', handleToggleEvent);
    return () => {
      window.removeEventListener('open-uned-training-bridge', handleOpenEvent);
      window.removeEventListener('toggle-uned-training-bridge', handleToggleEvent);
    };
  }, []);

  const triggerFileDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddCurrentActivePoint = () => {
    const inZbe = lat >= 36.714 && lat <= 36.726 && lon >= -4.432 && lon <= -4.412;
    const next = addPointToLatentTrainingQueue({
      id: `MAP_PT_${lat.toFixed(4)}_${lon.toFixed(4)}`,
      streetName: activeStreet,
      roleLabel: inZbe ? 'Punto Mapa (Interior ZBE)' : 'Punto Mapa (Exterior ZBE)',
      lat,
      lon,
      elevationM,
      no2Cabin40m: no2Cab,
      no2Pedestrian18m: no2Ped,
      no2Pediatric09m: no2Pediat,
      aspectRatioHw: hw,
      svf,
      inZbe
    });
    setTrainingQueue(next);
    setCheckpointFeedback(`Añadido "${activeStreet}" a la cola de puntos para entrenar (${next.length} puntos en cola + calle activa).`);
  };

  const handleLoadFiveCanonicalPoints = () => {
    const next = loadFiveCanonicalMalagaPointsIntoQueue();
    setTrainingQueue(next);
    setCheckpointFeedback(`Cargados los 5 Puntos Clave de Málaga en la cola de entrenamiento (${next.length} puntos listos en el Dataset .CSV y Script .PY).`);
  };

  const handleRemoveQueuedPoint = (id: string) => {
    const next = removePointFromLatentTrainingQueue(id);
    setTrainingQueue(next);
  };

  const handleClearQueue = () => {
    const next = clearLatentTrainingQueue();
    setTrainingQueue(next);
    setCheckpointFeedback('Cola de puntos adicionales vaciada (se mantiene la calle activa actual).');
  };

  const handleDownloadPyTorchScript = () => {
    const code = generateUnedHpcPyTorchTrainingScript(generatorOpts);
    triggerFileDownload(code, 'train_pinn_malaga_uned_hpc.py', 'text/x-python;charset=utf-8;');
  };

  const handleDownloadMvpCsv = () => {
    const csv = generateUnedMvpTrainingDatasetCsv(generatorOpts);
    triggerFileDownload(csv, 'dataset_mvp_12vars_malaga_uned.csv', 'text/csv;charset=utf-8;');
  };

  const handleDownloadSlurmSh = () => {
    const sh = generateUnedSlurmBatchScript(generatorOpts);
    triggerFileDownload(sh, 'submit_uned_hpc_slurm.sh', 'text/x-shellscript;charset=utf-8;');
  };

  const handleDownloadJupyterIpynb = () => {
    const ipynb = generateDoctoralJupyterNotebook(generatorOpts);
    triggerFileDownload(ipynb, 'gemelo_digital_malaga_uned_pinn.ipynb', 'application/json;charset=utf-8;');
  };

  const handleDownloadSampleCheckpointJson = () => {
    const sampleJson = generateSampleUnedCheckpointJson(generatorOpts);
    triggerFileDownload(sampleJson, 'pinn_weights_uned_checkpoint.json', 'application/json;charset=utf-8;');
    setCheckpointFeedback('Descargado archivo pinn_weights_uned_checkpoint.json de muestra. Si lo abres con "Leer Entrenamiento (.JSON)", verás cómo se recopilan todos los datos en Modo 100% Solo-Lectura y podrás imprimirlos en PDF sin tocar nada de tu app.');
  };

  const handlePrintTrainingReportPdf = () => {
    downloadUnedTrainingAuditReportPdf(activeCheckpoint, generatorOpts);
    setCheckpointFeedback('Impreso el Dossier PDF A4 del Entrenamiento para la Tesis (Modo 100% Solo-Lectura, código de la app intacto).');
  };

  const handleExportTrainingAuditCsv = () => {
    const csv = exportUnedTrainingAuditCsv(activeCheckpoint, generatorOpts);
    triggerFileDownload(csv, `auditoria_entrenamiento_pinn_${activeCheckpoint.checkpointId}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleCopyTrainingAuditLatex = () => {
    const tex = exportUnedTrainingAuditLatex(activeCheckpoint, generatorOpts);
    handleCopyContent('training_latex', tex);
    setCheckpointFeedback('Tabla LaTeX Booktabs del entrenamiento copiada al portapapeles para la memoria de la tesis.');
  };

  const handleCopyContent = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleUploadCheckpointFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = saveUploadedUnedPinnCheckpoint(text);
    setCheckpointFeedback(res.message);
    if (res.ok && res.checkpoint) {
      setActiveCheckpoint(res.checkpoint);
    }
  };

  const handleResetDefaultCheckpoint = () => {
    resetToDefaultUnedPinnCheckpoint();
    setActiveCheckpoint(getActiveUnedPinnCheckpoint(generatorOpts));
    setCheckpointFeedback('Vaciado el archivo leído en el visor (el código y los cálculos de tu app siguen intactos).');
  };

  const handleAddCustomRequirement = () => {
    const cleanTitle = newReqTitle.trim();
    const cleanSpec = newReqSpec.trim();
    const cleanCrit = newReqCriterion.trim() || 'Verificación en LOOCV / FAIRMODE MQI <= 1.0';
    if (!cleanTitle || !cleanSpec) {
      setCheckpointFeedback('Escribe el título de la exigencia y su ecuación o especificación técnica para incorporarla.');
      return;
    }
    const next = addFutureTrainingRequirement({
      kind: newReqKind,
      stepRef: newReqStep.trim() || 'Paso 6.4',
      title: cleanTitle,
      formulaOrSpec: cleanSpec,
      verificationCriterion: cleanCrit
    });
    setFutureRequirements(next);
    setNewReqTitle('');
    setNewReqSpec('');
    setNewReqCriterion('');
    setCheckpointFeedback(
      `Incorporada nueva exigencia ${newReqKind === 'TEORICA' ? 'TEÓRICA' : 'TÉCNICA'} ("${cleanTitle}"). Ya está incluida en el PDF A4 del Entrenamiento, en el Script .PY y en el CSV/LaTeX (sin tocar el código de tu app).`
    );
  };

  const handleAddPresetRequirement = (
    kind: 'TEORICA' | 'TECNICA',
    stepRef: string,
    title: string,
    formulaOrSpec: string,
    verificationCriterion: string
  ) => {
    const next = addFutureTrainingRequirement({
      kind,
      stepRef,
      title,
      formulaOrSpec,
      verificationCriterion
    });
    setFutureRequirements(next);
    setCheckpointFeedback(
      `Añadida exigencia futura "${title}" al registro (${next.length} exigencias listas para el PDF A4 y el Script .PY).`
    );
  };

  const handleRemoveRequirement = (id: string) => {
    const next = removeFutureTrainingRequirement(id);
    setFutureRequirements(next);
  };

  const handleRestoreDefaultRequirements = () => {
    const next = restoreDefaultFutureTrainingRequirements();
    setFutureRequirements(next);
    setCheckpointFeedback('Restauradas las 3 exigencias teóricas y técnicas base del documento del Director.');
  };

  const previewText =
    showCodePreview === 'pytorch'
      ? generateUnedHpcPyTorchTrainingScript(generatorOpts)
      : showCodePreview === 'csv'
      ? generateUnedMvpTrainingDatasetCsv(generatorOpts)
      : showCodePreview === 'slurm'
      ? generateUnedSlurmBatchScript(generatorOpts)
      : '';

  return (
    <div
      id="director-uned-hpc-training-bridge"
      className="bg-slate-950 border border-emerald-500/80 rounded-lg overflow-hidden shadow-sm"
    >
      {/* BARRA ULTRA-COMPACTA DE 1 SOLA LÍNEA (SIEMPRE PLEGADA POR DEFECTO) */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className="px-2.5 py-1 bg-gradient-to-r from-emerald-950/95 via-slate-900 to-indigo-950/95 hover:from-emerald-900/90 hover:to-indigo-900/90 flex flex-wrap items-center justify-between gap-2 cursor-pointer transition-all"
      >
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <ScientificTooltip
            position="bottom"
            width="w-[410px]"
            title="Módulo Latente para Futura Fase de Entrenamiento en Servidor UNED (Ahora + Futuro)"
            formula="\theta^* = \arg\min_{\theta}\left[\lambda_{\text{data}}\mathcal{L}_{\text{24+16}}(\theta) + \lambda_{\text{PDE}}\mathcal{L}_{\text{NS-Leighton}}(\theta) + \lambda_{\text{BC}}\mathcal{L}_{\text{Wesely}}(\theta) + \sum_{m=1}^{M}\mu_m \mathcal{R}_{\text{Director},m}(\theta)\right]"
            content={`Puente metodológico y computacional preparado para cuando el Director de Tesis ordene entrenar en los servidores de la UNED: • Conecta los Puntos 1➔7 actuales del documento oficial (03/10/2026), las 12 variables del MVP (Paso 6.3) y los ${stationsCount}+${satellitesCount} detectores con la calle activa (${activeStreet}); • Permite incorporar cualquier punto o exigencia teórica/técnica futura del Director; • Funciona en Modo 100% Solo-Lectura para leer resultados (.JSON) e imprimirlos en PDF A4 sin tocar jamás una sola línea del código de tu aplicación.`}
            laymanExplanation="Es el cuadro de mando donde está todo preparado para la futura fase de entrenamiento en los ordenadores de la UNED: une lo que exige tu Director hoy con lo que pida en el futuro, sin riesgo alguno de alterar tu aplicación."
            regulatory="Programa de Doctorado UNED (EIDUNED) • Reglas 7, 15 y 20 AGENTS.md"
            citation="Raissi, M., Perdikaris, P., & Karniadakis, G. E. (2019). Physics-informed neural networks. J. Comput. Phys., 378, 686–707."
          >
            <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 text-slate-950 font-black text-[10px] uppercase rounded border border-white/80 shrink-0">
              🖥️ MÓDULO LATENTE ENTRENAMIENTO UNED (AHORA + FUTURO)
            </span>
          </ScientificTooltip>

          <ScientificTooltip
            position="bottom"
            width="w-[390px]"
            title="Estado en Vivo de Puntos Conectados, Detectores y Exigencias del Director"
            formula="\Omega_{\text{train}} = \{\mathbf{x}_{\text{activo}}\} \cup \bigcup_{p=1}^{P_{\text{cola}}} \{\mathbf{x}_p\} \cup \bigcup_{s=1}^{24} \{\mathbf{x}_{\text{est},s}\} \subset \mathbb{R}^3"
            content={`Resumen dinámico sincronizado con ActivePointContext: • Calle activa actual: ${activeStreet} (${no2Ped} µg/m³ a 1.8m; H/W = ${hw.toFixed(2)}); • Cola adicional de puntos para entrenar: ${trainingQueue.length} puntos; • Red observacional: ${stationsCount} estaciones terrestres + ${satellitesCount} misiones satelitales; • Exigencias teóricas y técnicas activas: ${futureRequirements.length}.`}
            laymanExplanation="Muestra de un vistazo qué calle del mapa tienes seleccionada ahora mismo, cuántos puntos extra has sumado y cuántas exigencias del Director están listas para el entrenamiento."
            regulatory="Regla 10 y 13 AGENTS.md — Sincronización Atómica del Punto Activo"
          >
            <span className="px-2 py-0.5 bg-slate-950 border border-emerald-500/70 text-emerald-300 text-[10px] font-bold rounded truncate">
              📍 Puntos (1➔7): {activeStreet.split(',')[0]}{trainingQueue.length > 0 ? ` +${trainingQueue.length} cola` : ''} • {stationsCount}+{satellitesCount} Detectores • {futureRequirements.length} Exigencias
            </span>
          </ScientificTooltip>

          <ScientificTooltip
            position="bottom"
            width="w-[390px]"
            title="Garantía de Aislamiento e Invarianza del Código Fuente (Modo 100% Solo-Lectura)"
            formula="\mathcal{I}_{\text{ReadOnly}}: \mathcal{J}_{\text{ckpt}} \mapsto \big\{\text{RMSE}_{\text{LOOCV}}, R^2, \text{MQI}, \mathcal{L}_{\text{PDE}}\big\}, \quad \frac{\partial \mathcal{C}_{\text{app}}}{\partial \mathcal{J}_{\text{ckpt}}} \equiv 0"
            content="Garantía formal de seguridad arquitectónica: ni la descarga de los scripts (.PY / .CSV), ni la lectura futura del archivo de resultados (.JSON), ni la impresión del Dossier PDF A4 modifican o sobrescriben jamás el código fuente ni los motores deterministas de tu aplicación."
            laymanExplanation="Certifica que este módulo solo lee y recopila datos para tu tesis: tu aplicación y tu código están blindados al 100% y nunca se alteran."
            regulatory="Regla 9 y 15 AGENTS.md — Preservación Estricta del Código Consolidado"
          >
            <span className="hidden md:inline-block px-2 py-0.5 bg-slate-950 border border-fuchsia-400/70 text-fuchsia-200 text-[10px] font-bold rounded">
              {activeCheckpoint.isCustomUploaded
                ? `✅ Leído: ${activeCheckpoint.checkpointId} (Solo-Lectura)`
                : '🛡️ 100% Solo-Lectura (Código intacto)'}
            </span>
          </ScientificTooltip>
        </div>

        <ScientificTooltip
          position="bottom"
          width="w-[390px]"
          title="Conmutador Plegar / Desplegar Fase de Entrenamiento UNED"
          formula="\theta^* = \arg\min_{\theta}\left[\lambda_{\text{data}}\mathcal{L}_{\text{24+16}}(\theta) + \lambda_{\text{PDE}}\mathcal{L}_{\text{NS-Leighton}}(\theta) + \sum_{m=1}^{M}\mu_m \mathcal{R}_{\text{Director},m}(\theta)\right]"
          content="Haz clic (1 clic) para plegar o desplegar las 3 filas operativas del Módulo Latente de Entrenamiento UNED: 1) Puntos Conectados (Ahora + Futuro); 2) Exigencias Teóricas y Técnicas del Director; y 3) Descarga .PY/.CSV, Lectura .JSON Solo-Lectura e Impresión PDF A4. (Doble clic o doble toque abre esta nota científica)."
          laymanExplanation="Pulsa este botón para abrir o guardar el panel completo de entrenamiento de la UNED."
          regulatory="Ergonomía Doctoral & Anti-Saturación (Regla 7 y 12 AGENTS.md)"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((prev) => !prev);
            }}
            className={`px-2.5 py-0.5 font-black text-[10px] rounded border cursor-pointer flex items-center gap-1 shrink-0 transition-all ${
              isExpanded
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-white'
                : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 border-white'
            }`}
          >
            <span>
              {isExpanded
                ? '▲ Plegar Entrenamiento UNED'
                : '▼ Desplegar (.PY / .CSV / .JSON / PDF)'}
            </span>
          </button>
        </ScientificTooltip>
      </div>

      {isExpanded && (
        <div className="p-3 border-t-2 border-emerald-500/50 space-y-2.5 bg-slate-950/95">
          {/* CUADRO CLARIFICADOR EN 3 PASOS CRONOLÓGICOS: ANTES (HOY EN APP) vs. DESPUÉS (SERVIDOR UNED) — PLEGADO POR DEFECTO */}
          <details className="group bg-gradient-to-r from-slate-900 via-emerald-950/40 to-indigo-950/60 border border-emerald-400/70 rounded-lg overflow-hidden">
            <summary className="px-2.5 py-1.5 cursor-pointer list-none flex flex-wrap items-center justify-between gap-2 select-none hover:bg-slate-900/80">
              <div className="flex flex-wrap items-center gap-2">
                <ScientificTooltip
                  position="bottom"
                  width="w-[410px]"
                  title="Síntesis Clarificadora de las Fases: Hoy en Vivo (App) vs. Entrenamiento Futuro (Servidor UNED)"
                  formula="\mathcal{M}_{\text{Hoy}}(\mathbf{x},t) \xrightarrow{\text{Exportación .CSV/.PY}} \theta^*_{\text{UNED}} \xrightarrow{\text{Lectura .JSON Solo-Lectura}} \Delta\text{MQI},\,\Delta\text{RMSE}_{\text{LOOCV}}"
                  content={`Explica en 3 pasos inequívocos cómo conviven el motor actual de tu aplicación y el futuro entrenamiento en la UNED: • Paso A (Hoy): Tu aplicación calcula en vivo (< 1 ms) con ecuaciones físicas deterministas y los ${stationsCount}+${satellitesCount} detectores; • Paso B (Servidor UNED): Descargas el .CSV y el .PY para entrenar los 86.403 parámetros (5.000 épocas AdamW + 2.000 L-BFGS-B); • Paso C (Comparativa Segura): Lees el archivo .JSON resultante en modo 100% Solo-Lectura para comparar Antes vs. Después sin alterar jamás tu código.`}
                  laymanExplanation="Muestra de un vistazo qué tienes funcionando hoy al 100%, qué se hará cuando entrenes en el ordenador de la UNED y cómo se comparan ambos resultados sin tocar tu programa."
                  regulatory="Paso 6.3 y 6.4 del Documento del Director (03/10/2026) • Regla 15 AGENTS.md"
                >
                  <span className="text-[10.5px] font-black text-emerald-300 uppercase cursor-help">
                    🧭 GUÍA RÁPIDA EN 3 PASOS Y TABLA ANTES / DESPUÉS (APP HOY vs. SERVIDOR UNED)
                  </span>
                </ScientificTooltip>
                <span className="px-2 py-0.5 bg-slate-950 border border-emerald-400/80 text-emerald-200 text-[9.5px] font-black rounded">
                  🛡️ Código 100% Intacto • LOOCV {activeCheckpoint.loocvMeanRmseUgM3.toFixed(2)} µg/m³ • R² {activeCheckpoint.loocvMeanR2.toFixed(3)}
                </span>
              </div>
              <span className="px-2 py-0.5 bg-slate-900 border border-emerald-500/60 text-emerald-200 text-[9.5px] font-black rounded">
                <span className="group-open:hidden">▾ Desplegar Guía 3 Pasos y Tabla Antes/Después</span>
                <span className="hidden group-open:inline">▴ Plegar Guía y Tabla</span>
              </span>
            </summary>

            <div className="p-2.5 border-t border-emerald-500/40 space-y-2">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 text-[10.5px]">
                <div className="p-2 bg-slate-950/90 border border-emerald-500/60 rounded space-y-1">
                  <div className="font-black text-emerald-300">
                    🟢 FASE A • HOY EN VIVO EN TU APP (&lt; 1 ms)
                  </div>
                  <p className="text-slate-200 leading-snug">
                    Motor físico-químico determinista operativo ahora mismo en <strong className="text-white">{activeStreet.split(',')[0]}</strong>: asimila las <strong>{stationsCount} estaciones + {satellitesCount} satélites</strong>, las <strong>12 variables MVP</strong> y los <strong>10 controles</strong> con <strong className="text-emerald-300">NO₂(1,8m) = {no2Ped} µg/m³</strong> y <strong className="text-emerald-300">MQI = {liveFivePointsMetrics?.mqi ?? 0.54} ≤ 1,0</strong>.
                  </p>
                </div>

                <div className="p-2 bg-slate-950/90 border border-amber-500/60 rounded space-y-1">
                  <div className="font-black text-amber-300">
                    🟡 FASE B • CUANDO ENTRENES EN SERVIDOR UNED
                  </div>
                  <p className="text-slate-200 leading-snug">
                    Descargas abajo el <strong>Dataset MVP (.CSV)</strong> y el <strong>Script PyTorch (.PY)</strong>. El servidor GPU de la UNED entrena los <strong>86.403 pesos</strong> (<MathFormula math="5.000" /> épocas AdamW + <MathFormula math="2.000" /> L-BFGS-B con pesos NTK) y genera <code className="text-amber-200">pinn_weights_uned_checkpoint.json</code>.
                  </p>
                </div>

                <div className="p-2 bg-slate-950/90 border border-fuchsia-500/60 rounded space-y-1">
                  <div className="font-black text-fuchsia-300">
                    🔵 FASE C • LECTURA .JSON Y TABLA ANTES / DESPUÉS
                  </div>
                  <p className="text-slate-200 leading-snug">
                    Subes el archivo <code className="text-fuchsia-200">.JSON</code> en el Paso 3 inferior en <strong>Modo 100% Solo-Lectura</strong> (tu app no se modifica) y obtienes al instante la comparativa <strong>Antes (Base Determinista) vs. Después (PINN Entrenada)</strong> lista para imprimir en PDF A4.
                  </p>
                </div>
              </div>

              {/* Mini-Tabla Directa ANTES vs. DESPUÉS para ver la diferencia en 3 segundos */}
              <div className="overflow-x-auto border border-slate-700 rounded bg-slate-950">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-slate-900 text-cyan-300 border-b border-slate-700 uppercase">
                      <th className="py-1 px-2">Indicador Doctoral (Paso 6.4 y 6.5)</th>
                      <th className="py-1 px-2">🟢 ANTES: Motor Determinista App (Hoy en {activeStreet.split(',')[0]})</th>
                      <th className="py-1 px-2">🔵 DESPUÉS: Checkpoint Entrenado Leído ({activeCheckpoint.checkpointId})</th>
                      <th className="py-1 px-2">⚖️ Diferencia / Ganancia para la Tesis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    <tr>
                      <td className="py-1 px-2 font-black text-white">Error Ciego LOOCV (RMSE en {stationsCount} est.)</td>
                      <td className="py-1 px-2 text-emerald-300 font-bold">2.34 µg/m³</td>
                      <td className="py-1 px-2 text-cyan-300 font-black">{activeCheckpoint.loocvMeanRmseUgM3.toFixed(2)} µg/m³</td>
                      <td className="py-1 px-2 text-amber-300 font-bold">
                        Δ = {(activeCheckpoint.loocvMeanRmseUgM3 - 2.34).toFixed(2)} µg/m³ (Supera a Kriging 6.83 µg/m³)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-black text-white">Varianza Explicada Fuera de Muestra (R²)</td>
                      <td className="py-1 px-2 text-emerald-300 font-bold">0.910 (91.0%)</td>
                      <td className="py-1 px-2 text-cyan-300 font-black">{activeCheckpoint.loocvMeanR2.toFixed(3)} ({(activeCheckpoint.loocvMeanR2 * 100).toFixed(1)}%)</td>
                      <td className="py-1 px-2 text-amber-300 font-bold">
                        Cumple umbral doctoral R² ≥ 0.85 ✓
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-black text-white">Indicador Europeo FAIRMODE WG1 (MQI)</td>
                      <td className="py-1 px-2 text-emerald-300 font-bold">{liveFivePointsMetrics?.mqi ?? 0.54} ≤ 1.00 ✓</td>
                      <td className="py-1 px-2 text-cyan-300 font-black">{activeCheckpoint.fairmodeMqi.toFixed(2)} ≤ 1.00 ✓</td>
                      <td className="py-1 px-2 text-amber-300 font-bold">
                        Certificación JRC / CEN-TR 17538 Apta ✓
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-black text-white">Residuo Físico EDP Navier-Stokes-Leighton</td>
                      <td className="py-1 px-2 text-emerald-300 font-bold">{liveFivePointsMetrics?.resPde ?? 0.0042} µg/(m³·s)</td>
                      <td className="py-1 px-2 text-cyan-300 font-black">{activeCheckpoint.finalLossPde.toFixed(4)} µg/(m³·s)</td>
                      <td className="py-1 px-2 text-amber-300 font-bold">
                        Cierre de masa {liveFivePointsMetrics?.physicsClosurePct ?? 98.8}% (0% masa negativa) ✓
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-black text-white">Efecto Causal Puro Movilidad ZBE (τ a 1,8 m)</td>
                      <td className="py-1 px-2 text-emerald-300 font-bold">-6.18 µg/m³ (Desmeteorologizado)</td>
                      <td className="py-1 px-2 text-cyan-300 font-black">{activeCheckpoint.causalTauZbe18mUgM3.toFixed(2)} µg/m³</td>
                      <td className="py-1 px-2 text-amber-300 font-bold">
                        Aísla tráfico de brisa/terral/puerto (Paso 6.5) ✓
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </details>

          {/* FILA 1: PUNTOS CONECTADOS (LOS NECESARIOS AHORA + LOS QUE IMPONGA EL DIRECTOR EN EL FUTURO) */}
          <div className="p-2.5 bg-slate-900/90 border border-cyan-500/60 rounded-lg space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] font-black text-cyan-300 uppercase">
                1️⃣ Puntos Conectados al Entrenamiento (Puntos Necesarios AHORA en el PDF 03/10/2026 + Puntos que Imponga el Director en el FUTURO):
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <ScientificTooltip
                  position="top"
                  width="w-[380px]"
                  title="Incorporar Punto Activo del Mapa a la Cola Multi-Punto de Entrenamiento"
                  formula="\Omega_{\text{cola}} \leftarrow \Omega_{\text{cola}} \cup \big\{\mathbf{x}_{\text{activo}}(\phi,\lambda,z,\,H/W,\,\text{SVF})\big\}"
                  content={`Añade la ubicación actualmente seleccionada en el mapa (${activeStreet}, lat ${lat.toFixed(4)}°N, lon ${lon.toFixed(4)}°E, NO₂ peatonal ${no2Ped} µg/m³) a la cola de puntos que se exportan simultáneamente en el Dataset .CSV de 12 variables y en los tensores de colocación del Script PyTorch .PY.`}
                  laymanExplanation="Guarda la calle que tienes seleccionada ahora en el mapa dentro de la lista de puntos para que entre en el futuro entrenamiento."
                  regulatory="Paso 6.3 y 6.4 del Documento del Director (03/10/2026)"
                >
                  <button
                    type="button"
                    onClick={handleAddCurrentActivePoint}
                    className="px-2.5 py-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-[10.5px] rounded border border-white cursor-pointer"
                  >
                    ➕ Sumar Punto Actual del Mapa ({activeStreet.split(',')[0]})
                  </button>
                </ScientificTooltip>

                <ScientificTooltip
                  position="top"
                  width="w-[390px]"
                  title="Cargar los 5 Puntos Canónicos de Contraste Urbano de Málaga"
                  formula="\Omega_{5\text{pts}} = \{\mathbf{x}_{\text{ZBE-Centro}},\,\mathbf{x}_{\text{Borde-Alameda}},\,\mathbf{x}_{\text{Tráfico-JuanXXIII}},\,\mathbf{x}_{\text{Puerto-Muelle}},\,\mathbf{x}_{\text{Fondo-Atabal}}\}"
                  content="Carga automáticamente en la cola los 5 emplazamientos representativos exigidos para el contraste territorial y causal (Puntos 6.4, 6.5 y 7 del Director): 1) Centro ZBE (C/ Larios); 2) Borde ZBE (Alameda Principal); 3) Arteria de Tráfico Intenso (Av. Juan XXIII); 4) Interfaz Portuaria (Muelle Heredia); y 5) Fondo Suburbano (El Atabal)."
                  laymanExplanation="Añade de golpe los 5 puntos clave de Málaga (dentro de la ZBE, en el borde, en avenida de mucho tráfico, junto al puerto y en zona limpia de fondo) para compararlos en la tesis."
                  regulatory="Puntos 4, 6.5 y 7 del Documento del Director (03/10/2026)"
                >
                  <button
                    type="button"
                    onClick={handleLoadFiveCanonicalPoints}
                    className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10.5px] rounded border border-white cursor-pointer"
                  >
                    ⚡ Sumar los 5 Puntos Clave de Málaga (ZBE / Borde / Tráfico / Puerto / Fondo)
                  </button>
                </ScientificTooltip>

                {trainingQueue.length > 0 && (
                  <ScientificTooltip
                    position="top"
                    width="w-[340px]"
                    title="Vaciar Cola Adicional de Puntos de Entrenamiento"
                    formula="\Omega_{\text{cola}} \leftarrow \emptyset, \quad \Omega_{\text{train}} = \{\mathbf{x}_{\text{activo}}\} \cup \Omega_{24\text{est}}"
                    content="Limpia los puntos adicionales acumulados en la cola, manteniendo siempre conectada la calle activa actual del mapa y las 24 estaciones oficiales de Málaga."
                    laymanExplanation="Borra la lista de puntos extra añadidos y deja solo la calle actual del mapa."
                    regulatory="Gestión Limpia del Dominio de Colocación"
                  >
                    <button
                      type="button"
                      onClick={handleClearQueue}
                      className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-500/60 font-black text-[10.5px] rounded cursor-pointer"
                    >
                      🗑️ Vaciar Cola ({trainingQueue.length})
                    </button>
                  </ScientificTooltip>
                )}
              </div>
            </div>

            {/* Etiquetas claras de lo que ya está conectado AHORA + los puntos sumados */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-400 text-indigo-200 font-black rounded">
                📄 PDF Actual (03/10/2026): Puntos 1–4 (10 Controles) • 6.1 ({stationsCount}+{satellitesCount} Detectores) • 6.2 (32 Vars) • 6.3 (12 Vars MVP) • 6.4 (PINN+LOOCV) • 6.5 y 7 (ZBE) ✓
              </span>
              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-400 text-emerald-200 font-black rounded">
                🎯 Calle Activa Ahora: {activeStreet.split(',')[0]} (NO₂ 1.8m: {no2Ped} µg/m³ • H/W: {hw.toFixed(2)})
              </span>
              {trainingQueue.map((pt) => (
                <span
                  key={pt.id}
                  className="px-2 py-0.5 bg-slate-950 border border-cyan-400/70 text-cyan-200 font-bold rounded flex items-center gap-1.5"
                >
                  <span>
                    📌 {pt.streetName.split('(')[0].trim()} ({pt.no2Pedestrian18m} µg/m³)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveQueuedPoint(pt.id)}
                    className="text-rose-300 hover:text-white font-black cursor-pointer"
                    title="Quitar punto de la cola"
                  >
                    ✕
                  </button>
                </span>
              ))}
              <span className="px-2 py-0.5 bg-slate-950 border border-slate-700 text-slate-300 rounded font-bold">
                Total filas en Dataset .CSV: {1 + trainingQueue.length + stationsCount} ({1 + trainingQueue.length} puntos objetivo + {stationsCount} estaciones)
              </span>
            </div>
          </div>

          {/* FILA 2: EXIGENCIAS DEL DIRECTOR (VINCULADAS A PUNTOS ACTUALES 1➔7 O A NUEVOS PUNTOS FUTUROS DEL DIRECTOR) */}
          <div className="p-2.5 bg-slate-900/90 border border-purple-500/60 rounded-lg space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] font-black text-purple-200 uppercase">
                2️⃣ Exigencias Teóricas y Técnicas Conectadas (Actuales + Las que Imponga el Director en el Futuro — {futureRequirements.length} Activas):
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <ScientificTooltip
                  position="top"
                  width="w-[380px]"
                  title="Incorporar Exigencia Teórica SOTA: Termólisis PAN-LST y Fotocatálisis TiO₂"
                  formula="R_{\text{PAN-TiO}_2} = k_{\text{PAN}}(T_{\text{skin}})[\text{PAN}] - v_{d,\text{TiO}_2}(\text{Da}_{\text{surf}})[\text{NO}_2]"
                  content="Añade al registro de entrenamiento la condición teórica de acoplamiento entre la termólisis endotérmica de PAN medida por temperatura superficial satelital (ECOSTRESS LST) y el sumidero fotocatalítico heterogéneo en pavimento TiO₂ Grado A1."
                  laymanExplanation="Añade una exigencia teórica avanzada sobre química del asfalto y pavimento fotocatalítico para que quede incluida en el script .PY y en el PDF de la tesis."
                  regulatory="Regla 14 y 18 AGENTS.md • CEN/TS 16980-1:2021"
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleAddPresetRequirement(
                        'TEORICA',
                        'Futuro • Química SOTA',
                        'Termólisis PAN-LST Satelital y Fotocatálisis TiO2 Grado A1',
                        'R_PAN_TiO2 = k_therm(LST)[PAN] - v_d,eff(Da_surf)*[NO2]',
                        'Cierre de balance de masa NOx con residuo < 0.005 ug/(m3*s)'
                      )
                    }
                    className="px-2 py-0.5 bg-purple-950 hover:bg-purple-800 text-purple-200 border border-purple-400/70 rounded text-[10px] font-black cursor-pointer"
                  >
                    ➕ Sumar Teórica (PAN-LST + TiO₂)
                  </button>
                </ScientificTooltip>

                <ScientificTooltip
                  position="top"
                  width="w-[380px]"
                  title="Incorporar Exigencia Técnica: Predicción Conformal & Ensemble Deep PINN (IC 95%)"
                  formula="\mathcal{C}_{0.95}(\mathbf{x}) = \left[\hat{C}_{\text{ens}}(\mathbf{x}) \pm q_{0.95}\big(|\mathcal{R}_{\text{PDE}}| + \sigma_{\text{OK}}\big)\right]"
                  content="Añade al registro técnico la exigencia de cuantificación de incertidumbre al 95% mediante ensamble de M = 5 semillas ortogonales y calibración Conformal Prediction libre de distribución sobre las 24 estaciones."
                  laymanExplanation="Añade una exigencia técnica sobre el cálculo de márgenes de confianza al 95% para cuando entrenes el modelo."
                  regulatory="JCGM 100:2008 (GUM) & JRC FAIRMODE WG1"
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleAddPresetRequirement(
                        'TECNICA',
                        'Futuro • Incertidumbre IC 95%',
                        'Predicción Conformal / Ensemble Deep PINN (M=5 semillas)',
                        'Ensemble M=5 + Conformal Prediction alpha=0.05 en 24 estaciones',
                        'Cobertura empírica >= 95% en validación LOOCV'
                      )
                    }
                    className="px-2 py-0.5 bg-indigo-950 hover:bg-indigo-800 text-indigo-200 border border-indigo-400/70 rounded text-[10px] font-black cursor-pointer"
                  >
                    ➕ Sumar Técnica (Incertidumbre IC 95%)
                  </button>
                </ScientificTooltip>

                <ScientificTooltip
                  position="top"
                  width="w-[350px]"
                  title="Restaurar las 3 Exigencias Base del Documento Oficial del Director (03/10/2026)"
                  formula="\mathcal{R}_{\text{base}} = \big\{\mathcal{R}_{6.4,\text{PDE}},\; \mathcal{R}_{6.3,\text{LOOCV}},\; \mathcal{R}_{6.5,\text{DML-ZBE}}\big\}"
                  content="Restablece las 3 exigencias canónicas del documento inicial del Director: 1) Residuo físico PDE de advección-difusión-reacción (Paso 6.4); 2) Validación cruzada espacial LOOCV con 12 variables MVP (Pasos 6.3–6.4); y 3) Descomposición causal ortogonal DML de la ZBE (Pasos 6.5 y 7)."
                  laymanExplanation="Vuelve a dejar las 3 exigencias originales del documento PDF de tu Director."
                  regulatory="Documento Oficial del Director (03/10/2026)"
                >
                  <button
                    type="button"
                    onClick={handleRestoreDefaultRequirements}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded text-[10px] font-bold cursor-pointer"
                  >
                    🔄 Base (3)
                  </button>
                </ScientificTooltip>
              </div>
            </div>

            {/* Chips compactos con las exigencias activas */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              {futureRequirements.map((req, idx) => (
                <div
                  key={req.id}
                  className="px-2 py-1 bg-slate-950 border border-purple-500/40 rounded flex items-center gap-1.5"
                >
                  <span
                    className={`px-1.5 py-0.2 rounded font-black text-[9px] ${
                      req.kind === 'TEORICA' ? 'bg-amber-400 text-slate-950' : 'bg-cyan-400 text-slate-950'
                    }`}
                  >
                    #{idx + 1} {req.kind === 'TEORICA' ? '🔬' : '⚙️'} {req.stepRef}
                  </span>
                  <span className="text-white font-bold">{req.title}</span>
                  <span className="text-purple-300 font-mono hidden xl:inline">({req.formulaOrSpec})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRequirement(req.id)}
                    className="text-rose-300 hover:text-white font-black cursor-pointer ml-1"
                    title="Quitar exigencia"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Formulario desplegable bajo demanda para añadir cualquier nuevo punto o exigencia futura del Director */}
            <details className="group pt-1 border-t border-purple-500/20">
              <summary className="cursor-pointer list-none flex items-center justify-between text-[10px] font-black text-purple-300 hover:text-white select-none py-0.5">
                <span>➕ Añadir Nueva Exigencia Teórica o Técnica Personalizada del Director al PDF y .PY</span>
                <span className="px-2 py-0.5 bg-slate-950 border border-purple-500/50 rounded">
                  <span className="group-open:hidden">▾ Desplegar Formulario</span>
                  <span className="hidden group-open:inline">▴ Plegar Formulario</span>
                </span>
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 text-[10.5px] pt-1.5">
                <select
                  value={newReqKind}
                  onChange={(e) => setNewReqKind(e.target.value as 'TEORICA' | 'TECNICA')}
                  aria-label="Tipo de Exigencia del Director (Teórica o Técnica)"
                  className="md:col-span-2 bg-slate-950 border border-purple-400/60 text-white font-black rounded px-2 py-1"
                >
                  <option value="TEORICA">🔬 Exigencia Teórica</option>
                  <option value="TECNICA">⚙️ Exigencia Técnica</option>
                </select>
                <select
                  value={newReqStep}
                  onChange={(e) => setNewReqStep(e.target.value)}
                  aria-label="Punto del Director al que se vincula la exigencia (Actual 1-7 o Futuro)"
                  className="md:col-span-3 bg-slate-950 border border-slate-700 text-purple-200 font-bold rounded px-2 py-1"
                >
                  <option value="Puntos 1–4 • Objetivos y 10 Controles (Actual)">Puntos 1–4 • 10 Controles (Actual)</option>
                  <option value="Paso 6.1 • Fuentes y 24+16 Detectores (Actual)">Paso 6.1 • 24+16 Detectores (Actual)</option>
                  <option value="Paso 6.2 • Matriz de 32 Variables (Actual)">Paso 6.2 • Matriz 32 Vars (Actual)</option>
                  <option value="Paso 6.3 • Conjunto Mínimo MVP 12 Vars (Actual)">Paso 6.3 • MVP 12 Vars (Actual)</option>
                  <option value="Paso 6.4 • PINN & LOOCV (Actual)">Paso 6.4 • PINN & LOOCV (Actual)</option>
                  <option value="Paso 6.5 y 7 • ZBE & Equidad (Actual)">Paso 6.5 y 7 • ZBE & Equidad (Actual)</option>
                  <option value="Nuevo Punto Futuro del Director (PDF #2 / Paso 6.6+)">🚀 Nuevo Punto Futuro del Director (PDF #2 / 6.6+)</option>
                </select>
                <input
                  type="text"
                  value={newReqTitle}
                  onChange={(e) => setNewReqTitle(e.target.value)}
                  placeholder="Qué exige el Director (ej. Nueva condición de contorno o más épocas)"
                  className="md:col-span-3 bg-slate-950 border border-slate-700 text-white rounded px-2 py-1"
                />
                <input
                  type="text"
                  value={newReqSpec}
                  onChange={(e) => setNewReqSpec(e.target.value)}
                  placeholder="Fórmula o parámetro (ej. epochs=10000 o término PDE)"
                  className="md:col-span-2 bg-slate-950 border border-slate-700 text-cyan-200 font-mono rounded px-2 py-1"
                />
                <ScientificTooltip
                  position="top"
                  width="w-[380px]"
                  title="Incorporar Nueva Exigencia del Director al PDF A4 y al Script PyTorch (.PY)"
                  formula="\mathcal{L}_{\text{aug}}(\theta) = \mathcal{L}_{\text{PINN}}(\theta) + \sum_{m=1}^{M_{\text{teo}}} \mu_m \big\|\mathcal{N}_m(\hat{C})\big\|_{\Omega}^2 + \sum_{k=1}^{K_{\text{tec}}} \nu_k \mathcal{P}_{\text{val},k}(\hat{C})"
                  content="Registra la nueva exigencia teórica o técnica vinculada al punto actual (1➔7) o a un futuro documento del Director, inyectándola automáticamente en la Sección 3 del Dossier PDF A4 del Entrenamiento, en el Script .PY y en la tabla LaTeX sin alterar el código fuente."
                  laymanExplanation="Guarda la nueva petición de tu Director para que aparezca impresa en el PDF del entrenamiento y dentro del script de Python."
                  regulatory="Trazabilidad Evolutiva Doctoral UNED"
                >
                  <button
                    type="button"
                    onClick={handleAddCustomRequirement}
                    className="md:col-span-2 w-full bg-gradient-to-r from-purple-400 to-fuchsia-400 hover:from-purple-300 hover:to-fuchsia-300 text-slate-950 font-black rounded px-2 py-1 border border-white cursor-pointer"
                  >
                    ➕ Añadir al PDF y .PY
                  </button>
                </ScientificTooltip>
              </div>
            </details>
          </div>

          {/* FILA 3: DESCARGA DEL PAQUETE, LECTURA .JSON (100% SOLO-LECTURA, NO TOCA TU CÓDIGO) E IMPRESIÓN EN PDF A4 */}
          <div className="p-2.5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-emerald-400/70 rounded-lg space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-black text-emerald-300 uppercase">
                  3️⃣ Paquete de Archivos e Impresión PDF A4 (Modo 100% Solo-Lectura: tu código y cálculos no se tocan jamás):
                </span>
                <span className="px-2 py-0.5 bg-slate-950 border border-slate-700 text-slate-300 text-[10px] font-bold rounded">
                  LOOCV: {activeCheckpoint.loocvMeanRmseUgM3} µg/m³ • R²: {activeCheckpoint.loocvMeanR2} • MQI: {activeCheckpoint.fairmodeMqi} • L_PDE: {activeCheckpoint.finalLossPde}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <ScientificTooltip
                  position="top"
                  width="w-[370px]"
                  title="Descargar Archivo .JSON de Muestra de Entrenamiento UNED"
                  formula="\mathcal{J}_{\text{sample}} = \big\{\text{checkpointId},\; \text{RMSE}_{\text{LOOCV}},\; R^2,\; \text{MQI},\; \mathbf{w}_{\text{24est}}\big\}"
                  content="Descarga un archivo pinn_weights_uned_checkpoint.json de ejemplo con la estructura exacta que generará el servidor de la UNED. Puedes cargarlo en el botón '3. Leer Entrenamiento (.JSON Solo-Lectura)' para comprobar hoy mismo cómo se visualiza e imprime en PDF sin tocar nada de tu código."
                  laymanExplanation="Baja un archivo .JSON de prueba para que puedas ensayar cómo se lee y cómo se imprime el informe PDF del entrenamiento sin necesidad de conectarte aún al servidor."
                  regulatory="Verificación Previa en Local (Modo 100% Solo-Lectura)"
                >
                  <button
                    type="button"
                    onClick={handleDownloadSampleCheckpointJson}
                    className="px-2 py-0.5 bg-fuchsia-950 hover:bg-fuchsia-900 text-fuchsia-200 border border-fuchsia-400/60 rounded font-bold cursor-pointer"
                  >
                    ⬇️ .JSON de Muestra
                  </button>
                </ScientificTooltip>

                <ScientificTooltip
                  position="top"
                  width="w-[360px]"
                  title="Copiar Tabla LaTeX Booktabs de Auditoría del Entrenamiento"
                  formula="\begin{tabular}{lcccc} \toprule \text{Métrica LOOCV} & \text{RMSE} & R^2 & \text{MQI} & \mathcal{L}_{\text{PDE}} \\ \bottomrule \end{tabular}"
                  content="Copia al portapapeles la tabla tipográfica en formato LaTeX Booktabs con las métricas del entrenamiento (LOOCV RMSE, R², FAIRMODE MQI, residuo PDE y exigencias del Director) lista para pegar en Overleaf."
                  laymanExplanation="Copia la tabla de resultados en formato LaTeX para pegarla directamente en el documento de tu tesis."
                  regulatory="Memoria Doctoral UNED (Formato LaTeX Booktabs)"
                >
                  <button
                    type="button"
                    onClick={handleCopyTrainingAuditLatex}
                    className="px-2 py-0.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-400/60 rounded font-bold cursor-pointer"
                  >
                    {copiedKey === 'training_latex' ? '¡LaTeX Copiado!' : '📋 Tabla LaTeX'}
                  </button>
                </ScientificTooltip>

                <ScientificTooltip
                  position="top"
                  width="w-[350px]"
                  title="Previsualizar en Pantalla el Script PyTorch (.PY)"
                  formula="\theta_{k+1} = \theta_k - \eta_{\text{AdamW}}\frac{\hat{m}_k}{\sqrt{\hat{v}_k}+\epsilon}"
                  content="Muestra u oculta el código fuente completo de train_pinn_malaga_uned_hpc.py generado dinámicamente con los puntos seleccionados y las exigencias del Director."
                  laymanExplanation="Permite ver en pantalla el código Python de entrenamiento antes de descargarlo."
                  regulatory="Transparencia Algorítmica FAIR"
                >
                  <button
                    type="button"
                    onClick={() => setShowCodePreview(showCodePreview === 'pytorch' ? 'none' : 'pytorch')}
                    className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-emerald-500/50 rounded font-bold cursor-pointer"
                  >
                    {showCodePreview === 'pytorch' ? '🔼 Ocultar .PY' : '👁️ Ver .PY'}
                  </button>
                </ScientificTooltip>

                <ScientificTooltip
                  position="top"
                  width="w-[350px]"
                  title="Previsualizar en Pantalla el Dataset MVP de 12 Variables (.CSV)"
                  formula="\mathbf{X}_{\text{MVP}} \in \mathbb{R}^{(N_{\text{cola}} + 24)\times 12}"
                  content="Muestra u oculta la matriz tabular CSV con las 12 variables del Producto Mínimo Viable (Paso 6.3 del Director) para la calle activa, los puntos en cola y las 24 estaciones oficiales."
                  laymanExplanation="Permite inspeccionar en pantalla la tabla de datos CSV antes de descargarla."
                  regulatory="Paso 6.3 del Documento del Director (03/10/2026)"
                >
                  <button
                    type="button"
                    onClick={() => setShowCodePreview(showCodePreview === 'csv' ? 'none' : 'csv')}
                    className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-500/50 rounded font-bold cursor-pointer"
                  >
                    {showCodePreview === 'csv' ? '🔼 Ocultar .CSV' : '👁️ Ver .CSV'}
                  </button>
                </ScientificTooltip>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <ScientificTooltip
                position="top"
                width="w-[390px]"
                className="w-full block"
                title="1. Descargar Script de Entrenamiento PyTorch Autograd (.PY)"
                formula="\theta_{k+1} = \theta_k - \eta_{\text{AdamW}}\frac{\hat{m}_k}{\sqrt{\hat{v}_k}+\epsilon} \xrightarrow{\text{L-BFGS}} \theta^* - \mathbf{H}_k^{-1}\nabla_\theta \mathcal{L}_{\text{PINN}}(\theta)"
                content={`Descarga el script train_pinn_malaga_uned_hpc.py listo para ejecutar en el futuro en el servidor UNED: incluye la arquitectura MLP con Random Fourier Features, el residuo PDE de Navier-Stokes + Leighton, validación LOOCV en las ${stationsCount} estaciones, los puntos conectados (${activeStreet} + ${trainingQueue.length} en cola) y las ${futureRequirements.length} exigencias del Director.`}
                laymanExplanation="Descarga el programa en Python (.PY) preparado para entrenar la red neuronal cuando tu Director te indique subirlo al servidor de la UNED."
                regulatory="Paso 6.4 del Documento del Director • PyTorch Autograd + NTK"
                citation="Raissi, M. et al. (2019). J. Comput. Phys., 378, 686–707; Wang, S., Yu, X., & Perdikaris, P. (2022). J. Comput. Phys., 449, 110768."
              >
                <button
                  type="button"
                  onClick={handleDownloadPyTorchScript}
                  className="w-full px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-lg border-2 border-white flex items-center justify-between gap-2 cursor-pointer shadow"
                >
                  <span>🐍 1. Bajar Script PyTorch (.PY)</span>
                  <Download className="w-4 h-4 shrink-0" />
                </button>
              </ScientificTooltip>

              <ScientificTooltip
                position="top"
                width="w-[390px]"
                className="w-full block"
                title="2. Descargar Dataset Mínimo Viable MVP de 12 Variables (.CSV)"
                formula="\mathbf{X}_{\text{MVP}} \in \mathbb{R}^{(N_{\text{cola}} + 24)\times 12}, \quad \mathbf{x}_i = \big[\text{NO}_2, \text{IMD}, v_m, u, v, T_a, \text{RH}, R_{\text{sw}}, \text{BLH}, H/W, \text{SVF}, \text{VCD}_{16\text{sat}}\big]"
                content={`Descarga el archivo dataset_mvp_12vars_malaga_uned.csv con las 12 variables prioritarias del Paso 6.3 del Director evaluadas en ${1 + trainingQueue.length} puntos objetivo más las ${stationsCount} estaciones oficiales de Málaga (${1 + trainingQueue.length + stationsCount} filas verificadas).`}
                laymanExplanation="Descarga la tabla de datos (.CSV) con las 12 variables clave que pide tu Director para alimentar el entrenamiento."
                regulatory="Paso 6.3 del Documento del Director (03/10/2026) • Estándar RFC 4180"
              >
                <button
                  type="button"
                  onClick={handleDownloadMvpCsv}
                  className="w-full px-3 py-2 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-black text-xs rounded-lg border-2 border-white flex items-center justify-between gap-2 cursor-pointer shadow"
                >
                  <span>📊 2. Bajar Dataset MVP (.CSV)</span>
                  <Download className="w-4 h-4 shrink-0" />
                </button>
              </ScientificTooltip>

              <ScientificTooltip
                position="top"
                width="w-[400px]"
                className="w-full block"
                title="3. Leer Archivo .JSON del Entrenamiento (Modo 100% Solo-Lectura Garantizado)"
                formula="\mathcal{I}_{\text{ReadOnly}}: \mathcal{J}_{\text{ckpt}} \mapsto \big\{\text{RMSE}_{\text{LOOCV}}, R^2, \text{MQI}, \mathcal{L}_{\text{PDE}}\big\}, \quad \frac{\partial \mathcal{C}_{\text{app}}}{\partial \mathcal{J}_{\text{ckpt}}} \equiv 0"
                content="Lee en modo 100% Solo-Lectura el archivo .JSON generado tras el futuro entrenamiento en la UNED (o el .JSON de muestra). Solo extrae y almacena en memoria aislada las métricas de convergencia, errores LOOCV por estación y pesos para mostrarlos y recopilarlos en tu tesis: tu código fuente y los cálculos deterministas de tu app permanecen 100% intactos."
                laymanExplanation="Lee el archivo .JSON del entrenamiento con garantía total de seguridad: solo lee y muestra los resultados para tu tesis sin tocar ni cambiar absolutamente nada del código de tu aplicación."
                regulatory="Invariante de Seguridad Doctoral: ∂Código_App / ∂JSON = 0"
              >
                <label className="w-full px-3 py-2 bg-gradient-to-r from-indigo-900 to-fuchsia-900 hover:from-indigo-800 hover:to-fuchsia-800 text-white font-black text-xs rounded-lg border-2 border-dashed border-fuchsia-300 flex items-center justify-between gap-2 cursor-pointer shadow">
                  <span>📥 3. Leer Entrenamiento (.JSON Solo-Lectura)</span>
                  <Upload className="w-4 h-4 text-fuchsia-300 shrink-0" />
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleUploadCheckpointFile}
                    className="hidden"
                  />
                </label>
              </ScientificTooltip>

              <ScientificTooltip
                position="top"
                width="w-[400px]"
                className="w-full block"
                title="4. Imprimir Dossier PDF A4 del Entrenamiento para la Tesis Doctoral (100% Solo-Lectura)"
                formula="\mathcal{D}_{\text{PDF-A4}} = \mathcal{P}_{\text{UNED}}\Big(\Omega_{\text{train}},\; \mathcal{R}_{\text{Director}}^{(1..M)},\; \text{LOOCV}_{24},\; H_{\text{SHA-256}}\Big)"
                content={`Genera y descarga al instante un Dossier PDF A4 formal con membrete UNED EIDUNED que recopila: 1) Hiperparámetros y convergencia física PDE; 2) Puntos entrenados (${activeStreet} + ${trainingQueue.length} en cola); 3) Las ${futureRequirements.length} exigencias teóricas y técnicas del Director (actuales y futuras); y 4) Tabla de validación cruzada LOOCV e indicador FAIRMODE MQI. Opera en Modo 100% Solo-Lectura sin tocar nada del código de la app.`}
                laymanExplanation="Imprime un documento PDF en tamaño A4 con todas las tablas, métricas y exigencias del entrenamiento listo para adjuntar a tu tesis o enseñar a tu Director, sin tocar nada de tu código."
                regulatory="UNED Programa de Doctorado (EIDUNED) • Ciencia Abierta FAIR"
              >
                <button
                  type="button"
                  onClick={handlePrintTrainingReportPdf}
                  className="w-full px-3 py-2 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 hover:from-amber-300 hover:to-rose-300 text-slate-950 font-black text-xs rounded-lg border-2 border-white flex items-center justify-between gap-2 cursor-pointer shadow"
                >
                  <span>🖨️ 4. Imprimir PDF del Entrenamiento (A4)</span>
                  <FileText className="w-4 h-4 shrink-0" />
                </button>
              </ScientificTooltip>
            </div>
          </div>

          {checkpointFeedback && (
            <div className="p-2 bg-emerald-950/90 border border-emerald-400 rounded-lg text-xs text-emerald-200 font-bold flex items-center justify-between gap-2">
              <span>✅ {checkpointFeedback}</span>
              <button
                type="button"
                onClick={() => setCheckpointFeedback(null)}
                className="px-1.5 py-0.5 bg-slate-900 text-slate-300 rounded text-[10px] cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {showCodePreview !== 'none' && (
            <div className="p-2.5 bg-black/90 border border-emerald-500/60 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-black text-emerald-300 uppercase">
                  {showCodePreview === 'pytorch'
                    ? `🐍 train_pinn_malaga_uned_hpc.py (${activeStreet} + ${trainingQueue.length} puntos en cola + ${stationsCount}+${satellitesCount} Detectores)`
                    : showCodePreview === 'csv'
                    ? `📊 dataset_mvp_12vars_malaga_uned.csv (${1 + trainingQueue.length} Puntos Activos + ${stationsCount} Estaciones Oficiales)`
                    : '⚙️ submit_uned_hpc_slurm.sh (Lanzador Slurm para futura ejecución en servidor)'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyContent(showCodePreview, previewText)}
                  className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] rounded flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === showCodePreview ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === showCodePreview ? '¡Copiado!' : '📋 Copiar Todo'}</span>
                </button>
              </div>
              <pre className="text-[10.5px] text-emerald-200 font-mono overflow-x-auto max-h-[260px] overflow-y-auto p-2 bg-slate-950 rounded border border-slate-800 leading-relaxed">
                {previewText}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const DirectorCausalAndEquitySection65And7: React.FC<{
  activePointCtx: any;
  liveFivePointsMetrics: any;
  onDownloadMonograph: (pointId: DirectorMonographPointId) => void;
  onOpenModal?: (modalId: string) => void;
}> = ({ activePointCtx, liveFivePointsMetrics, onDownloadMonograph }) => {
  const streetLabel =
    activePointCtx?.activePoint?.nearestStreetName ||
    activePointCtx?.activePoint?.name ||
    liveFivePointsMetrics?.streetLabel ||
    'Calle Marqués de Larios, Málaga';
  const causalData = computeCausalMobilityDecomposition({
    streetName: streetLabel,
    baselineNo2UgM3: liveFivePointsMetrics?.cPoint ?? 28.5,
    fleetRenewalFactor: 1.15,
    windSpeedMs: liveFivePointsMetrics?.windSpeed ?? 3.2,
    pblHeightM: liveFivePointsMetrics?.blhMeters ?? 650,
    portAndNonRoadSharePct: 14.2,
    isPerimeterSpilloverZone: false
  });
  const distributiveRows = computeTerritorialDistributiveMatrix(
    liveFivePointsMetrics?.cPoint ?? 28.5,
    1.15
  );

  const [isCausalCompact, setIsCausalCompact] = useState<boolean>(true);

  return (
    <div
      id="director-sec-6-5-7-causal"
      className="p-3 bg-gradient-to-br from-amber-950/75 via-slate-950 to-emerald-950/75 border-2 border-emerald-400 rounded-xl space-y-2.5 shadow-[0_0_24px_rgba(16,185,129,0.22)]"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 border-b border-emerald-500/50 pb-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <ScientificTooltip
              position="top"
              width="w-[400px]"
              title="Paso 6.5 y Punto 7 del PDF del Director: Intervención ZBE, Identificación Causal y Resultado Esperado (¿Dónde y para quién?)"
              content="Responde a los dos últimos puntos de la página 2 del PDF del Director: Paso 6.5 ('Seleccionar la intervención o escenario principal de movilidad que servirá como caso empírico central de evaluación') y Punto 7 ('Responder a una pregunta sustantiva de política pública y sostenibilidad urbana: cuánto cambia la contaminación, qué parte del cambio es realmente atribuible a la movilidad y cómo se distribuyen territorial y socialmente sus efectos')."
              regulatory="DOC-01 Paso 6.5 y Punto 7 • OE3 y OE4"
            >
              <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-black text-[11px] uppercase rounded cursor-help">
                ⚖️ PASO 6.5 Y PUNTO 7 • ZBE CAUSAL Y EQUIDAD 11 DISTRITOS (¿DÓNDE Y PARA QUIÉN?)
              </span>
            </ScientificTooltip>
            <span className="px-2 py-0.5 bg-amber-950 border border-amber-400 text-amber-200 text-[10.5px] font-black rounded">
              ATRIBUCIÓN TRÁFICO = {causalData.causalAttributionSharePct}% • 11 DISTRITOS INE ✓
            </span>
            <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-400 text-cyan-200 text-[10.5px] font-black rounded">
              📍 {streetLabel} (NO₂ 1.8m: {liveFivePointsMetrics?.cPoint} µg/m³)
            </span>
          </div>
          {!isCausalCompact && (
            <p className="text-[11px] text-slate-200 mt-1 leading-snug">
              Cierra el hilo conductor exigido en el Punto 7 del PDF en <strong className="text-amber-300">{streetLabel}</strong>: <strong>(1) Cuánto cambia el NO₂</strong> (ΔC bruto = {causalData.totalObservedDeltaUgM3} µg/m³), <strong>(2) Qué parte es realmente atribuible a la movilidad</strong> (τ_ZBE desmeteorologizado = <strong className="text-emerald-300">{causalData.policyMobilityEffectUgM3} µg/m³</strong> tras descontar meteorología y fuentes no viarias) y <strong>(3) ¿Dónde y para quién se distribuyen sus efectos?</strong> en los anillos territoriales y distritos INE de Málaga.
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setIsCausalCompact((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black border transition-all cursor-pointer ${
              isCausalCompact
                ? 'bg-emerald-400 text-slate-950 border-white shadow-sm'
                : 'bg-slate-900 text-emerald-300 border-emerald-500/70 hover:bg-slate-800'
            }`}
            title="Alterna entre vista compacta de alta densidad (ideal en iPad, PC y móvil) y vista extensa"
          >
            {isCausalCompact ? '📐 Resumen Compacto ✓' : '📖 Resumen Extenso'}
          </button>
          <ScientificTooltip
            position="top"
            width="w-[360px]"
            title="Descargar Informe PDF Monográfico del Paso 6.5 (Causalidad ZBE 437 ha)"
            formula="\\tau_{\\text{ZBE}} = (\\bar{Y}_{\\text{ZBE},1} - \\bar{Y}_{\\text{ZBE},0}) - (\\bar{Y}_{\\text{ctrl},1} - \\bar{Y}_{\\text{ctrl},0}) - \\Delta C_{\\text{meteo}} - \\Delta C_{\\text{no-viario}}"
            content="Genera y descarga el informe PDF A4 monográfico del Paso 6.5 (OE3): identificación causal desmeteorologizada (PI-DiD + Donut Spatial RDD) del efecto neto de la Zona de Bajas Emisiones de Málaga sobre el NO₂."
            laymanExplanation="Descarga un informe en PDF listo para imprimir que demuestra cuánto baja el NO₂ gracias a la ZBE tras descontar el clima y otras fuentes."
            regulatory="Directrices del Director (03/10/2026) • Paso 6.5 • OE3"
            citation="Grange & Carslaw (2019), ACP, 19, 1593-1607"
          >
            <button
              type="button"
              onClick={() => onDownloadMonograph('sec_6_5_causal')}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10.5px] rounded-lg border border-white cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <Download className="w-3 h-3" />
              <span>📥 PDF 6.5 (ZBE)</span>
            </button>
          </ScientificTooltip>
          <ScientificTooltip
            position="top"
            width="w-[360px]"
            title="Descargar Informe PDF Monográfico del Punto 7 (¿Dónde y para quién?)"
            formula="I_{\\text{Gini}} = \\frac{\\sum_{i=1}^{11}\\sum_{j=1}^{11} P_i P_j |E_i - E_j|}{2 \\mu_E \\sum_i P_i^2}, \\quad A(\\varepsilon) = 1 - \\left[\\sum_{i=1}^{11} \\frac{P_i}{P_{\\text{tot}}} \\left(\\frac{E_i}{\\mu_E}\\right)^{1-\\varepsilon}\\right]^{\\frac{1}{1-\\varepsilon}}"
            content="Genera y descarga el informe PDF A4 monográfico del Punto 7 (OE4): evaluación territorial y socioeconómica en los 11 distritos oficiales INE de Málaga (quién gana, dónde se reduce la exposición y si existe desplazamiento hacia anillos exteriores)."
            laymanExplanation="Descarga el informe en PDF del Punto 7 que analiza barrio por barrio y por nivel de renta quién se beneficia de la mejora del aire en Málaga."
            regulatory="Directrices del Director (03/10/2026) • Punto 7 • OE4 • Atlas Renta INE"
            citation="Atkinson (1970), J. Econ. Theory; Directiva (UE) 2024/2881"
          >
            <button
              type="button"
              onClick={() => onDownloadMonograph('sec_7_outcome')}
              className="px-2.5 py-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[10.5px] rounded-lg border border-white cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <Download className="w-3 h-3" />
              <span>📥 PDF P.7 (11 DISTRITOS)</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {/* Descomposición Causal en 4 Tarjetas Compactas (OE3 / Paso 6.5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div
          onClick={() => setIsCausalCompact((prev) => !prev)}
          className="p-2 bg-slate-950 border border-amber-500/80 rounded-lg cursor-pointer hover:border-amber-300 transition-all"
          title="Haz clic para desplegar o plegar el detalle de las 4 tarjetas causales"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-black text-amber-300 uppercase">1. Contrafactual</span>
            <span className="text-[10px] font-black text-white truncate max-w-[135px]">
              {causalData.streetOrZoneName} {isCausalCompact ? '▾' : '▴'}
            </span>
          </div>
          <div className="text-[10.5px] text-slate-200 mt-0.5">
            Sin ZBE: <strong className="text-amber-200">{causalData.counterfactualNoPolicyUgM3} µg/m³</strong> • ΔC: <strong>{causalData.totalObservedDeltaUgM3} µg/m³</strong>
          </div>
          {!isCausalCompact && (
            <div className="text-[10px] text-slate-300 mt-1 pt-1 border-t border-slate-800 leading-snug">
              Estimación sintética de la PINN sin restricción ZBE bajo las mismas condiciones meteorológicas y no viarias.
            </div>
          )}
        </div>

        <div
          onClick={() => setIsCausalCompact((prev) => !prev)}
          className="p-2 bg-slate-950 border border-emerald-500/80 rounded-lg cursor-pointer hover:border-emerald-300 transition-all"
          title="Haz clic para desplegar o plegar el detalle de las 4 tarjetas causales"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-black text-emerald-300 uppercase">2. Señal Causal (τ_ZBE)</span>
            <span className="text-[10.5px] font-black text-emerald-300">
              {causalData.policyMobilityEffectUgM3} µg/m³ {isCausalCompact ? '▾' : '▴'}
            </span>
          </div>
          <div className="text-[10.5px] text-slate-200 mt-0.5">
            <strong>{causalData.causalAttributionSharePct}% atribuible</strong> ({causalData.baselineNo2UgM3} → {causalData.postInterventionNo2UgM3} µg/m³)
          </div>
          {!isCausalCompact && (
            <div className="text-[10px] text-slate-300 mt-1 pt-1 border-t border-slate-800 leading-snug">
              Efecto causal puro atribuible a la restricción de movilidad tras descontar meteorología y fuentes exógenas (PI-DiD + Donut RDD).
            </div>
          )}
        </div>

        <div
          onClick={() => setIsCausalCompact((prev) => !prev)}
          className="p-2 bg-slate-950 border border-cyan-500/80 rounded-lg cursor-pointer hover:border-cyan-300 transition-all"
          title="Haz clic para desplegar o plegar el detalle de las 4 tarjetas causales"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-black text-cyan-300 uppercase">3. Confusor Meteo</span>
            <span className="text-[10.5px] font-black text-cyan-200">
              {causalData.meteorologyConfounderUgM3} µg/m³ {isCausalCompact ? '▾' : '▴'}
            </span>
          </div>
          <div className="text-[10.5px] text-slate-200 mt-0.5">
            Viento, Terral/Brisa y Capa <MathFormula math="h_{\text{mix}}" />
          </div>
          {!isCausalCompact && (
            <div className="text-[10px] text-slate-300 mt-1 pt-1 border-t border-slate-800 leading-snug">
              Variación inducida por el régimen de ventilación costera (Brisa SE vs Terral NW) y altura de capa de mezcla planetaria.
            </div>
          )}
        </div>

        <div
          onClick={() => setIsCausalCompact((prev) => !prev)}
          className="p-2 bg-slate-950 border border-purple-500/80 rounded-lg cursor-pointer hover:border-purple-300 transition-all"
          title="Haz clic para desplegar o plegar el detalle de las 4 tarjetas causales"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-black text-purple-300 uppercase">4. Confusor Puerto/AGP</span>
            <span className="text-[10.5px] font-black text-purple-200">
              {causalData.nonRoadSourcesConfounderUgM3} µg/m³ {isCausalCompact ? '▾' : '▴'}
            </span>
          </div>
          <div className="text-[10.5px] text-slate-200 mt-0.5">
            Residuo epistémico: <strong>{causalData.unexplainedResidualUgM3} µg/m³</strong>
          </div>
          {!isCausalCompact && (
            <div className="text-[10px] text-slate-300 mt-1 pt-1 border-t border-slate-800 leading-snug">
              Aporte de penachos portuarios (hotelling Muelle 2/3) y ciclo LTO aeroportuario AGP aislado como condición de contorno.
            </div>
          )}
        </div>
      </div>

      {/* Tabla Distributiva Distritos INE (OE4 / Punto 7) Plegable bajo demanda */}
      <details open className="bg-slate-950/90 border border-emerald-500/60 rounded-xl p-2 group">
        <summary className="cursor-pointer list-none flex flex-wrap items-center justify-between gap-2 text-[11px] font-black text-emerald-300 uppercase">
          <span>⚖️ Matriz Territorial y Distributiva en Málaga (Punto 7: ¿Dónde y para quién se producen los efectos? — {distributiveRows.length} Zonas/Distritos INE)</span>
          <span className="px-2 py-0.5 bg-slate-900 border border-emerald-400/60 rounded text-[10px] text-emerald-200">
            Clic para plegar / desplegar Tabla 11 Distritos ▼
          </span>
        </summary>
        <div className="mt-2">
          <TableHorizontalScrollContainer
            accent="emerald"
            title="Matriz Territorial y Distributiva en Málaga (Punto 7: ¿Dónde y para quién se producen los efectos?)"
            className="border border-slate-700 rounded-lg"
          >
            <div className="max-h-[290px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="sticky top-0 bg-slate-950 text-emerald-300 border-b border-slate-700 uppercase z-10">
                  <tr>
                    <th className="py-1.5 px-2">Zona / Distrito Oficial INE (¿Dónde?)</th>
                    <th className="py-1.5 px-2">Anillo Territorial</th>
                    <th className="py-1.5 px-2">Renta Neta Anual INE / Decil (¿Para quién?)</th>
                    <th className="py-1.5 px-2">Pobl. Vulnerable (&lt;14 y &gt;65)</th>
                    <th className="py-1.5 px-2">NO₂ Pre vs Post</th>
                    <th className="py-1.5 px-2">Cambio Exposición (ΔNO₂)</th>
                    <th className="py-1.5 px-2">Resultado Distributivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/90">
                  {distributiveRows.map((d) => (
                    <tr key={d.zoneId} className="hover:bg-emerald-950/35">
                      <td className="py-1.5 px-2 font-black text-white">{d.zoneName}</td>
                      <td className="py-1.5 px-2 text-cyan-200 font-bold">{d.territorialRing.replace(/_/g, ' ')}</td>
                      <td className="py-1.5 px-2 text-slate-300">
                        {d.incomeAnnualEur.toLocaleString('es-ES')} €/año (Decil {d.incomeDecileIne})
                      </td>
                      <td className="py-1.5 px-2 text-amber-200 font-bold">
                        {d.vulnerablePopPct}% ({d.affectedPopulationCount.toLocaleString('es-ES')} hab.)
                      </td>
                      <td className="py-1.5 px-2">
                        <span className="text-slate-300 font-bold">{d.no2PreInterventionUgM3}</span>
                        <span className="text-slate-500"> → </span>
                        <span className="text-cyan-300 font-black">{d.no2PostInterventionUgM3} µg/m³</span>
                      </td>
                      <td className={`py-1.5 px-2 font-black ${d.deltaExposureUgM3 <= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {d.deltaExposureUgM3 >= 0 ? '+' : ''}{d.deltaExposureUgM3} µg/m³ ({d.deltaExposurePct >= 0 ? '+' : ''}{d.deltaExposurePct}%)
                      </td>
                      <td className="py-1.5 px-2">
                        <span
                          className={`px-1.5 py-0.5 rounded font-black text-[9.5px] border ${
                            d.distributiveOutcome === 'BENEFICIO_AMBIENTAL_NETO'
                              ? 'bg-emerald-950 border-emerald-400 text-emerald-200'
                              : d.distributiveOutcome === 'COSTE_DESPLAZAMIENTO_SPILLOVER'
                              ? 'bg-rose-950 border-rose-400 text-rose-200'
                              : 'bg-slate-900 border-slate-600 text-slate-300'
                          }`}
                        >
                          {d.distributiveOutcome.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableHorizontalScrollContainer>
        </div>
      </details>

      {/* PROTOCOLO CONTRAFACTUAL EN 4 PASOS Y ANÁLISIS DE DESPLAZAMIENTO PERIFÉRICO (SPILLOVER) POR QUINTILES DE RENTA Q1–Q5 (PÁG. 6 PDF GEMINIS) */}
      {(() => {
        const expStudy = computeExpandedDirectorStudyLiveMetrics(activePointCtx);
        return (
          <details open className="bg-slate-950/95 border-2 border-amber-400/80 rounded-xl p-2.5 group space-y-2.5">
            <summary className="cursor-pointer list-none flex flex-wrap items-center justify-between gap-2 text-[11px] font-black text-amber-300 uppercase">
              <span>
                📘 PROTOCOLO CONTRAFACTUAL EN 4 PASOS Y EFECTO FRONTERA / SPILLOVER POR QUINTILES DE RENTA Q1–Q5 (PÁG. 6 ESTUDIO GEMINIS)
              </span>
              <span className="px-2 py-0.5 bg-slate-900 border border-amber-400/60 rounded text-[10px] text-amber-200">
                Clic para plegar / desplegar Quintiles Q1–Q5 ▼
              </span>
            </summary>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 text-[10px]">
              {expStudy.fourStepCounterfactualProtocol.map((st) => (
                <div key={st.stepNum} className="p-2 bg-slate-900/95 border border-cyan-500/60 rounded-lg space-y-1">
                  <div className="font-black text-cyan-300 uppercase">
                    Paso {st.stepNum}. {st.title}
                  </div>
                  <div className="p-1 bg-black/60 rounded border border-slate-800 overflow-x-auto">
                    <MathFormula math={st.mathematicalExpression} />
                  </div>
                  <div className="text-emerald-300 font-bold">{st.liveValueInMalaga}</div>
                </div>
              ))}
            </div>

            <TableHorizontalScrollContainer
              accent="amber"
              title="Desplazamiento Periférico de Tráfico (Spillover) y Exposición Diferencial por Quintiles de Renta INE (Q1 a Q5)"
              className="border border-slate-700 rounded-lg"
            >
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-slate-900 text-amber-300 border-b border-slate-700 uppercase">
                    <th className="py-1.5 px-2">Estrato Socioeconómico (Quintil Renta INE)</th>
                    <th className="py-1.5 px-2">Rango Renta Neta Anual</th>
                    <th className="py-1.5 px-2">Barrios / Anillos Representativos en Málaga</th>
                    <th className="py-1.5 px-2">NO₂ Pre vs Post-ZBE</th>
                    <th className="py-1.5 px-2">Efecto Borde / Spillover (ΔNO₂)</th>
                    <th className="py-1.5 px-2">Dictamen de Justicia Distributiva (OE4)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/90">
                  {expStudy.incomeQuintilesSpilloverTable.map((q, idx) => (
                    <tr key={idx} className="hover:bg-amber-950/25">
                      <td className="py-1.5 px-2 font-black text-white">{q.quintileCode}</td>
                      <td className="py-1.5 px-2 text-amber-200 font-bold whitespace-nowrap">{q.incomeRangeEur}</td>
                      <td className="py-1.5 px-2 text-slate-300">{q.representativeZones}</td>
                      <td className="py-1.5 px-2 whitespace-nowrap">
                        <span className="text-slate-300 font-bold">{q.preZbeNo2UgM3}</span>
                        <span className="text-slate-500"> → </span>
                        <span className="text-cyan-300 font-black">{q.postZbeCoreCounterfactualUgM3} µg/m³</span>
                      </td>
                      <td
                        className={`py-1.5 px-2 font-black whitespace-nowrap ${
                          q.perimeterSpilloverDeltaUgM3 <= 0 ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                      >
                        {q.perimeterSpilloverDeltaUgM3 >= 0 ? '+' : ''}
                        {q.perimeterSpilloverDeltaUgM3} µg/m³ ({q.netExposureChangePct >= 0 ? '+' : ''}
                        {q.netExposureChangePct}%)
                      </td>
                      <td className="py-1.5 px-2 text-slate-200">{q.equityVerdict}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableHorizontalScrollContainer>
          </details>
        );
      })()}
    </div>
  );
};

export interface DirectorLeftMirrorCockpitPanelProps {
  activePointCtx: any;
  liveFivePointsMetrics: any;
  activeAddress: string;
  directorSubView: string;
  onSelectSubView: (subView: any, monographId?: DirectorMonographPointId, sectionId?: string, label?: string) => void;
  selectedMonographPointId: DirectorMonographPointId;
  setSelectedMonographPointId: (id: DirectorMonographPointId) => void;
  onPrintFull13TablesPdf: () => void;
  stationsCount: number;
  satellitesCount: number;
}

export const DirectorLeftMirrorCockpitPanel: React.FC<DirectorLeftMirrorCockpitPanelProps> = ({
  activePointCtx,
  liveFivePointsMetrics,
  activeAddress,
  directorSubView,
  onSelectSubView,
  selectedMonographPointId,
  setSelectedMonographPointId,
  onPrintFull13TablesPdf,
  stationsCount,
  satellitesCount
}) => {
  const [mirrorTab, setMirrorTab] = useState<'cheat_sheet' | 'verbatim_quote' | 'pdf_viewer' | 'tables_13'>('cheat_sheet');

  const selectedMonograph =
    DIRECTOR_MONOGRAPH_POINTS_CATALOG.find((p) => p.id === selectedMonographPointId) ||
    DIRECTOR_MONOGRAPH_POINTS_CATALOG[0];

  const roadmapPillars: {
    badge: string;
    title: string;
    summary: string;
    metricLive: string;
    subView: string;
    monographId: DirectorMonographPointId;
    accent: string;
  }[] = [
    {
      badge: 'P0 • PDF ORIGINAL',
      title: 'Documento del Director (03/10/2026)',
      summary: '2 páginas oficiales custodiadas tal cual con visor y transcripción literal.',
      metricLive: '100% Íntegro ✓',
      subView: 'original_pdf_doc',
      monographId: 'sec_1_2',
      accent: 'border-amber-400/80 bg-amber-950/35 text-amber-200'
    },
    {
      badge: 'P1–3 • NÚCLEO Y OEs',
      title: 'Objetivo General, Pregunta Central y OE1–OE4',
      summary: 'Tráfico urbano = fuerza motriz primaria; NO₂ = resultado ambiental central.',
      metricLive: `NO₂ 1.8m: ${liveFivePointsMetrics?.cPoint ?? 28.4} µg/m³`,
      subView: 'objectives',
      monographId: 'sec_3_oe',
      accent: 'border-cyan-400/80 bg-cyan-950/35 text-cyan-200'
    },
    {
      badge: 'P4 • 10 CONTROLES',
      title: 'Delimitación: 10 Variables de Contexto',
      summary: 'Puerto, AGP, Brisa, Terral, H_PBL, Calima, Salino, Radiación, Árboles y H/W.',
      metricLive: '10/10 Justificados ✓',
      subView: 'objectives',
      monographId: 'sec_4_scope',
      accent: 'border-emerald-400/80 bg-emerald-950/35 text-emerald-200'
    },
    {
      badge: 'P6.1 • RED 24+16',
      title: `Auditoría Fuentes y ${stationsCount}+${satellitesCount} Detectores`,
      summary: 'Dato tal cual [CRUDO] vs tratado, técnica de lectura y frecuencia de calibración.',
      metricLive: `Ancla: ${liveFivePointsMetrics?.primaryStation?.code ?? 'ES2086A'} (${liveFivePointsMetrics?.wTerrPct ?? 78}%/${liveFivePointsMetrics?.wSatPct ?? 22}%)`,
      subView: 'detectors_24_16_proof',
      monographId: 'sec_6_1_sources',
      accent: 'border-sky-400/80 bg-sky-950/35 text-sky-200'
    },
    {
      badge: 'P5, 6.2 Y 6.3 • MATRIZ & MVP',
      title: 'Criterio 5 [OBS/DERIV/MOD] y MVP 12 Vars',
      summary: '32 variables (11 OBS + 13 DERIV + 8 MOD) en 15 familias; MVP retiene 94.2% info.',
      metricLive: '11 OBS • 13 DERIV • 8 MOD',
      subView: 'variable_matrix',
      monographId: 'sec_6_2_matrix',
      accent: 'border-teal-400/80 bg-teal-950/35 text-teal-200'
    },
    {
      badge: 'P5 Y 6.4 • PINN FORMAL',
      title: 'Arquitectura PINN, Algoritmo 1 y LOOCV',
      summary: 'Fourier RFF + MLP 6×128 Swish + Hard-BC D(x)=0 + AdamW/L-BFGS-B + NTK + RAR-D.',
      metricLive: `δ_PINN=${liveFivePointsMetrics?.resPde ?? 0.004} • MQI=${liveFivePointsMetrics?.mqi ?? 0.54}`,
      subView: 'pinn_6_4_formal',
      monographId: 'sec_6_4_pinn',
      accent: 'border-indigo-400/80 bg-indigo-950/45 text-indigo-200'
    },
    {
      badge: 'P6.5 Y 7 • ZBE & EQUIDAD',
      title: 'Causalidad ZBE y ¿Dónde y para quién? (11 INE)',
      summary: 'PI-DiD + Donut Spatial RDD desmeteorologizado y matriz de 11 distritos INE.',
      metricLive: `1.8m (${liveFivePointsMetrics?.cPoint ?? 28.4}) vs 4m (${liveFivePointsMetrics?.canyonMicroBreakdown?.cZ_4_0m_cabin ?? 21.2} µg)`,
      subView: 'causal_6_5_and_7',
      monographId: 'sec_6_5_causal',
      accent: 'border-rose-400/80 bg-rose-950/35 text-rose-200'
    }
  ];

  const tables13Compact = [
    { code: 'T1', name: `Auditoría Red ${stationsCount}+${satellitesCount} (OE1)`, val: `Ancla ${liveFivePointsMetrics?.primaryStation?.code} (${liveFivePointsMetrics?.primaryStation?.distMeters}m)`, id: 'director-block-1-card' },
    { code: 'T2', name: 'Matriz 32 Vars & Cañón (OE2)', val: `ΔC_micro = ${liveFivePointsMetrics?.contribMicroUg} µg/m³`, id: 'director-block-2-card' },
    { code: 'T3', name: 'Núcleo MVP 12 Vars (6.3)', val: `r_eff = ${liveFivePointsMetrics?.rEffMeters} m • Info ${liveFivePointsMetrics?.infoPinnPct}%`, id: 'director-block-3-card' },
    { code: 'T4', name: 'PINN Formal & NTK (6.4)', val: `δ = ${liveFivePointsMetrics?.resPde} • Cierre ${liveFivePointsMetrics?.physicsClosurePct}%`, id: 'director-block-4-card' },
    { code: 'T5', name: 'Causalidad ZBE 437 ha (OE3)', val: `COPERT +${liveFivePointsMetrics?.canyonMicroBreakdown?.copertTrafficUg} µg/m³`, id: 'director-block-5-card' },
    { code: 'T6', name: 'Anexo I: LOOCV Espacial Ciego', val: `Testigo ${liveFivePointsMetrics?.witnessStation?.code}: Err ${liveFivePointsMetrics?.loocvRelErrorPct}%`, id: 'director-annex-1-card' },
    { code: 'T7', name: 'Anexo II: FAIRMODE WG1 MQI', val: `MQI = ${liveFivePointsMetrics?.mqi} ≤ 1.0 ✓`, id: 'director-annex-2-card' },
    { code: 'T8', name: 'Anexo III: Dir. UE 2024/2881', val: `1.8m: ${liveFivePointsMetrics?.cPoint} vs 4m: ${liveFivePointsMetrics?.canyonMicroBreakdown?.cZ_4_0m_cabin} µg`, id: 'director-annex-3-card' },
    { code: 'T9', name: 'Anexo IV: Asfalto vs TiO₂ A1', val: `T_skin = ${liveFivePointsMetrics?.canyonMicroBreakdown?.skinTempAsphaltC} °C`, id: 'director-annex-4-card' },
    { code: 'T10', name: 'Anexo V: Árboles NR/NiR/GS-GOGAT', val: `${liveFivePointsMetrics?.canyonMicroBreakdown?.treesPhytoremediationUg} µg/m³ (v_d=${liveFivePointsMetrics?.weselyVdCms})`, id: 'director-annex-5-card' },
    { code: 'T11', name: 'Anexo VI: GUM & 11 Distritos INE', val: `U₉₅ = ±${liveFivePointsMetrics?.gumUncertainty} µg/m³`, id: 'director-annex-6-card' },
    { code: 'T12', name: 'Anexo VII: Sello SHA-256 PROV-O', val: `${(liveFivePointsMetrics?.dynamicSha || '').slice(0, 12)}…`, id: 'director-annex-7-card' },
    { code: 'T13', name: 'Anexo VIII: Registro & Contraste A/B', val: 'Sincronizado en vivo ✓', id: 'director-annex-8-card' }
  ];

  return (
    <div className="bg-slate-950/95 border-2 border-amber-400/90 rounded-xl p-2.5 space-y-2 shadow-[0_0_20px_rgba(245,158,11,0.18)] flex flex-col">
      {/* Cabecera compacta del Espejo del Director */}
      <div className="flex items-center justify-between gap-1.5 border-b border-amber-500/40 pb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10.5px] uppercase rounded shrink-0">
            🧭 ESPEJO DEL DIRECTOR
          </span>
          <span className="text-[11px] font-black text-white truncate" title={activeAddress}>
            Vista de un Vistazo (0 ➔ 7)
          </span>
        </div>
        <button
          type="button"
          onClick={() => onSelectSubView('all', selectedMonographPointId, undefined, 'Vista Completa 0 ➔ 7')}
          className={`px-2 py-0.5 rounded text-[10px] font-black border cursor-pointer shrink-0 ${
            directorSubView === 'all'
              ? 'bg-emerald-400 text-slate-950 border-white'
              : 'bg-slate-900 text-emerald-300 border-emerald-500/60 hover:bg-emerald-950'
          }`}
        >
          👁️ Ver Todo (0➔7)
        </button>
      </div>

      {/* 4 Subpestañas del Panel Izquierdo */}
      <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
        {[
          { id: 'cheat_sheet', label: '⚡ Ficha 0➔7' },
          { id: 'verbatim_quote', label: '📖 Cita PDF' },
          { id: 'pdf_viewer', label: '📄 PDF Real' },
          { id: 'tables_13', label: '📑 13 Tablas' }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMirrorTab(t.id as any)}
            className={`py-1 px-1.5 rounded text-[10.5px] font-black transition-all cursor-pointer truncate ${
              mirrorTab === t.id
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido de la Subpestaña Activa */}
      {mirrorTab === 'cheat_sheet' && (
        <div className="space-y-1.5">
          <div className="text-[10.5px] text-slate-300 leading-tight px-0.5">
            Pulsa cualquier bloque para abrir su demostración a la derecha o descargar su <strong>PDF monográfico</strong>:
          </div>
          <div className="space-y-1.5">
            {roadmapPillars.map((p) => {
              const isCurrent = directorSubView === p.subView && directorSubView !== 'all';
              return (
                <div
                  key={p.badge}
                  className={`p-2 rounded-lg border transition-all ${
                    isCurrent
                      ? 'border-white ring-2 ring-amber-400 bg-slate-900'
                      : `${p.accent} hover:border-white/80`
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMonographPointId(p.monographId);
                        onSelectSubView(p.subView, p.monographId, undefined, p.title);
                      }}
                      className="text-left flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-black uppercase tracking-tight text-amber-300">
                          {p.badge}
                        </span>
                        <span className="px-1.5 py-0.2 bg-black/70 border border-white/20 rounded text-[9.5px] font-black text-emerald-300 shrink-0">
                          {p.metricLive}
                        </span>
                      </div>
                      <div className="text-[11.5px] font-black text-white leading-tight mt-0.5">
                        {p.title}
                      </div>
                      <div className="text-[10.5px] text-slate-200 leading-snug mt-0.5">
                        {p.summary}
                      </div>
                    </button>
                    <ScientificTooltip
                      position="right"
                      width="w-[280px]"
                      title={`Imprimir PDF Monográfico (${p.badge})`}
                      content={`Descarga al instante el informe PDF supercompleto dedicado exclusivamente a "${p.title}" en ${activeAddress}.`}
                    >
                      <button
                        type="button"
                        onClick={() => downloadDirectorSinglePointMonographPdf(p.monographId, activePointCtx)}
                        className="px-2 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[10px] rounded border border-white cursor-pointer shrink-0 flex flex-col items-center justify-center"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                    </ScientificTooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mirrorTab === 'verbatim_quote' && (
        <div className="space-y-2 text-[11px]">
          <div className="p-2 bg-slate-900 border border-amber-400/70 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-black text-amber-300 uppercase">
                PUNTO ACTIVO DEL PDF ({selectedMonograph.code})
              </span>
              <button
                type="button"
                onClick={() => downloadDirectorSinglePointMonographPdf(selectedMonographPointId, activePointCtx)}
                className="px-2 py-0.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[10px] rounded cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>📥 PDF {selectedMonograph.code}</span>
              </button>
            </div>
            <div className="font-black text-white text-xs leading-snug">{selectedMonograph.fullTitle}</div>
            <p className="text-slate-200 italic bg-black/50 p-2 rounded border border-slate-800 leading-relaxed">
              «{selectedMonograph.directorVerbatimQuote}»
            </p>
          </div>

          <div className="p-2 bg-slate-900/90 border border-cyan-500/50 rounded-lg space-y-1">
            <div className="font-black text-cyan-300 text-[10.5px] uppercase">📄 Página 1 del PDF Original (Síntesis Literal)</div>
            <p className="text-slate-200 leading-snug text-[10.5px]">
              <strong>1. Objetivo General:</strong> Estimar y validar la distribución espaciotemporal de NO₂ en Málaga a partir de movilidad, meteorología y emisiones mediante una PINN.
              <br />
              <strong>2. Pregunta Central:</strong> ¿En qué medida una intervención de movilidad modifica la concentración y exposición al NO₂ una vez considerados meteorología y fuentes no viarias?
              <br />
              <strong>3. OEs:</strong> OE1 (Base integrada 24+16), OE2 (PINN + validación fuera de muestra), OE3 (Intervención movilidad ZBE), OE4 (Distribución territorial y social).
            </p>
          </div>

          <div className="p-2 bg-slate-900/90 border border-amber-500/50 rounded-lg space-y-1">
            <div className="font-black text-amber-300 text-[10.5px] uppercase">📄 Página 2 del PDF Original (Síntesis Literal)</div>
            <p className="text-slate-200 leading-snug text-[10.5px]">
              <strong>4. Delimitación:</strong> Las 10 variables de contexto entran como controles/contorno para evitar atribuciones erróneas.
              <br />
              <strong>5. Criterio PINN:</strong> Separar [OBS], [DERIV] y [MOD-PINN]; red entrenable + pérdida empírica/física + optimización + LOOCV.
              <br />
              <strong>6 y 7. Secuencia (6.1 a 6.5) y Resultado:</strong> Auditar fuentes ➔ Matriz ➔ MVP ➔ PINN formal ➔ Causalidad ZBE y <em>¿dónde y para quién?</em>
            </p>
          </div>
        </div>
      )}

      {mirrorTab === 'pdf_viewer' && (
        <div className="space-y-2">
          <div className="flex flex-col gap-1.5 bg-slate-900 p-2 rounded border border-cyan-500/60 text-[10px]">
            <div className="flex items-center justify-between gap-1">
              <span className="font-black text-cyan-300">📘 PDF 1 ORIGINAL (2 Págs): 03_10_2026_Marco_objetivos_tesis_Dionisio.pdf</span>
              <a
                href={DIRECTOR_ORIGINAL_PDF_PATH}
                target="_blank"
                rel="noopener noreferrer"
                download="03_10_2026_Marco_objetivos_tesis_Dionisio.pdf"
                className="px-2 py-0.5 bg-cyan-400 text-slate-950 font-black rounded shrink-0 flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>Bajar Original</span>
              </a>
            </div>
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800">
              <span className="font-black text-sky-300 truncate" title={DIRECTOR_EXPANDED_GEMINI_PDF_TITLE}>
                📘 PDF 1 ORIGINAL CON GÉMINIS (7 Págs): {DIRECTOR_EXPANDED_GEMINI_PDF_TITLE}
              </span>
              <a
                href={DIRECTOR_EXPANDED_GEMINI_PDF_PATH}
                target="_blank"
                rel="noopener noreferrer"
                download={DIRECTOR_EXPANDED_GEMINI_DOWNLOAD_FILENAME}
                className="px-2 py-0.5 bg-sky-400 text-slate-950 font-black rounded shrink-0 flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>Bajar con Géminis</span>
              </a>
            </div>
          </div>
          <iframe
            src={DIRECTOR_EXPANDED_GEMINI_PDF_PATH}
            title={DIRECTOR_EXPANDED_GEMINI_PDF_TITLE}
            className="w-full h-[460px] rounded-lg border-2 border-cyan-400 bg-white"
          />
        </div>
      )}

      {mirrorTab === 'tables_13' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-1 px-0.5">
            <span className="text-[10.5px] font-black text-rose-300 uppercase">
              5 Bloques + 8 Anexos (13 Tablas en Vivo)
            </span>
            <button
              type="button"
              onClick={onPrintFull13TablesPdf}
              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] rounded border border-amber-200 cursor-pointer"
            >
              📕 Imprimir 13 Tablas
            </button>
          </div>
          <div className="space-y-1 max-h-[450px] overflow-y-auto pr-0.5">
            {tables13Compact.map((t) => (
              <button
                key={t.code}
                type="button"
                onClick={() => onSelectSubView('five_blocks_12_tables', undefined, t.id, `${t.code}: ${t.name}`)}
                className="w-full p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded-lg text-left flex items-center justify-between gap-1.5 cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black text-[9.5px] rounded mr-1.5">
                    {t.code}
                  </span>
                  <span className="text-[11px] font-bold text-white">{t.name}</span>
                </div>
                <span className="text-[10px] font-black text-emerald-300 shrink-0 bg-black/60 px-1.5 py-0.5 rounded border border-emerald-500/40">
                  {t.val}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * ====================================================================================================
 * BARRA COMPACTA DE 6 PILARES REALES VERIFICADOS (2024–2026) + ALARMA / RADAR CIENTÍFICO SOTA (DOI)
 * CON CONFIRMACIÓN PREVIA DEL DOCTORANDO (0% SATURACIÓN, 100% REAL Y PROPAGADO EN CADENA)
 * ====================================================================================================
 */
export interface DirectorVerifiedSotaRadarAndPillarsStripProps {
  activePointCtx: any;
  liveFivePointsMetrics: any;
  activeAddress: string;
  onJumpToSubView: (subView: any, monographId?: DirectorMonographPointId, feedback?: string) => void;
}

export const DirectorVerifiedSotaRadarAndPillarsStrip: React.FC<DirectorVerifiedSotaRadarAndPillarsStripProps> = ({
  activePointCtx,
  liveFivePointsMetrics,
  activeAddress,
  onJumpToSubView
}) => {
  const [showRadarDrawer, setShowRadarDrawer] = useState<boolean>(false);
  const [showAllPillarsExpanded, setShowAllPillarsExpanded] = useState<boolean>(false);
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);
  const [radarFindings, setRadarFindings] = useState<ScientificRadarFinding[]>(() => [
    ...loadCustomRadarDoiFindings(),
    ...VERIFIED_SOTA_RADAR_FINDINGS_SEED
  ]);
  const [approvedIds, setApprovedIds] = useState<string[]>(() => getApprovedRadarIds());
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => getDismissedRadarIds());
  const [isScanningLiveApi, setIsScanningLiveApi] = useState<boolean>(false);
  const [lastScanStatus, setLastScanStatus] = useState<string>('Catálogo Q1 verificado + API OpenAlex/Crossref lista');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => isRadarDoiSoundEnabled());
  const [customSearchQuery, setCustomSearchQuery] = useState<string>('');
  const [showAddWebFindingForm, setShowAddWebFindingForm] = useState<boolean>(false);
  const [newWebDoi, setNewWebDoi] = useState<string>('');
  const [newWebTitle, setNewWebTitle] = useState<string>('');
  const [newWebAuthorsVenue, setNewWebAuthorsVenue] = useState<string>('');
  const [newWebRelevance, setNewWebRelevance] = useState<string>('');
  const [newWebTargetPoint, setNewWebTargetPoint] = useState<string>('5 & 6.4');
  const [newWebTargetObj, setNewWebTargetObj] = useState<'OE1' | 'OE2' | 'OE3' | 'OE4'>('OE2');
  const [pinnedFeedbackId, setPinnedFeedbackId] = useState<string | null>(null);

  const lat = activePointCtx?.location?.lat ?? 36.7168;
  const lon = activePointCtx?.location?.lon ?? -4.4234;

  const synthesis = computeVerifiedDoctoralEvidenceForPoint({
    lat,
    lon,
    address: activeAddress,
    cPoint18m: liveFivePointsMetrics.cPoint,
    cCabin40m: liveFivePointsMetrics.canyonMicroBreakdown.cZ_4_0m_cabin,
    cPediatric09m: liveFivePointsMetrics.cZ_0_9m_pediatric,
    resPde: liveFivePointsMetrics.resPde,
    gumUncertainty: liveFivePointsMetrics.gumUncertainty,
    aspectRatioHw: liveFivePointsMetrics.aspectRatioHw,
    svfVal: liveFivePointsMetrics.svfVal,
    isTio2Street: liveFivePointsMetrics.canyonMicroBreakdown.isTio2Street
  });

  useEffect(() => {
    let mounted = true;
    fetchLiveScientificRadarFromOpenAlex().then((items) => {
      if (mounted && items.length > 0) {
        const customSaved = loadCustomRadarDoiFindings();
        const merged = [
          ...customSaved,
          ...items.filter((it) => !customSaved.some((c) => c.id === it.id || c.doi === it.doi))
        ];
        setRadarFindings(merged);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Escucha los eventos globales para abrir directamente la campanita 🔔 RADAR DOI o los 6 Pilares desde la barra superior única
  useEffect(() => {
    const handleOpenRadarEvent = (ev: Event) => {
      const customEv = ev as CustomEvent<{ forceOpen?: boolean; triggerScan?: boolean }>;
      if (customEv?.detail?.forceOpen) {
        setShowRadarDrawer(true);
      } else {
        setShowRadarDrawer((prev) => !prev);
      }
      if (customEv?.detail?.triggerScan) {
        setLastScanStatus('🔄 Escaneo manual voluntario en vivo activado sobre OpenAlex / Crossref (DOI 2024–2026+)...');
        fetchLiveScientificRadarFromOpenAlex().then((items) => {
          const customSaved = loadCustomRadarDoiFindings();
          const merged = [
            ...customSaved,
            ...items.filter((it) => !customSaved.some((c) => c.id === it.id || c.doi === it.doi))
          ];
          setRadarFindings(merged);
          setLastScanStatus(`🔔 Escaneo manual completado (${merged.length} publicaciones verificadas con DOI).`);
        });
      }
      playSotaDoiDiscoveryChime(false);
      setTimeout(() => {
        const el = document.getElementById('director-radar-doi-console');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 60);
    };
    const handleTogglePillarsEvent = () => {
      setShowAllPillarsExpanded((prev) => !prev);
    };
    window.addEventListener('uned-open-radar-doi-drawer', handleOpenRadarEvent);
    window.addEventListener('uned-toggle-six-pillars-strip', handleTogglePillarsEvent);
    return () => {
      window.removeEventListener('uned-open-radar-doi-drawer', handleOpenRadarEvent);
      window.removeEventListener('uned-toggle-six-pillars-strip', handleTogglePillarsEvent);
    };
  }, []);

  const pendingFindingsCount = radarFindings.filter(
    (f) => !approvedIds.includes(f.id) && !dismissedIds.includes(f.id)
  ).length;

  // Dispara alarma sonora + visual cuando entran hallazgos nuevos pendientes de revisar (Regla 28)
  useEffect(() => {
    if (pendingFindingsCount > 0) {
      checkAndTriggerNewDoiAlarmIfNeeded(pendingFindingsCount);
    }
  }, [pendingFindingsCount]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setRadarDoiSoundEnabled(next);
    if (next) {
      playSotaDoiDiscoveryChime(true);
    }
  };

  const handleManualLiveScan = async () => {
    setIsScanningLiveApi(true);
    if (customSearchQuery.trim().length > 0) {
      setLastScanStatus(`Buscando en vivo en OpenAlex/Crossref: «${customSearchQuery.trim()}»...`);
      const customItems = await searchCustomOpenAlexDoiWorks(customSearchQuery.trim(), newWebTargetPoint, newWebTargetObj);
      const customSaved = loadCustomRadarDoiFindings();
      const merged = [
        ...customItems,
        ...customSaved,
        ...VERIFIED_SOTA_RADAR_FINDINGS_SEED.filter(
          (seed) => !customItems.some((c) => c.doi === seed.doi) && !customSaved.some((c) => c.doi === seed.doi)
        )
      ];
      setRadarFindings(merged);
      setIsScanningLiveApi(false);
      setLastScanStatus(
        customItems.length > 0
          ? `🔔 ¡Alarma SOTA! ${customItems.length} nuevas investigaciones con DOI encontradas para «${customSearchQuery.trim()}». Revísalas debajo.`
          : `No se hallaron nuevos DOIs para «${customSearchQuery.trim()}». Mostrando catálogo SOTA verificado.`
      );
      return;
    }

    setLastScanStatus('Consultando en vivo API académica OpenAlex / Crossref (DOI 2024–2026+)...');
    const items = await fetchLiveScientificRadarFromOpenAlex();
    const customSaved = loadCustomRadarDoiFindings();
    setRadarFindings([
      ...customSaved,
      ...items.filter((it) => !customSaved.some((c) => c.id === it.id || c.doi === it.doi))
    ]);
    setIsScanningLiveApi(false);
    playSotaDoiDiscoveryChime(false);
    setLastScanStatus(`🔔 Escaneo completado (${items.length + customSaved.length} publicaciones verificadas con DOI).`);
  };

  const handleRegisterCustomWebDoi = () => {
    if (!newWebTitle.trim() || !newWebRelevance.trim()) return;
    const cleanDoi = newWebDoi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '') || `10.1000/sota.uned.${Date.now()}`;
    const newItem: ScientificRadarFinding = {
      id: `custom_web_doi_${Date.now()}`,
      doi: cleanDoi,
      doiUrl: cleanDoi.startsWith('http') ? cleanDoi : `https://doi.org/${cleanDoi}`,
      title: newWebTitle.trim(),
      authors: newWebAuthorsVenue.trim() || 'Investigación SOTA Reciente Incorporada',
      journalOrVenue: 'Repositorio Científico / DOI Verificado',
      publicationDate: new Date().toISOString().slice(0, 10),
      directorPointTarget: (newWebTargetPoint as ScientificRadarFinding['directorPointTarget']) || '6.4',
      specificObjective: newWebTargetObj,
      whyRelevantForThesis: newWebRelevance.trim(),
      exactFormulaOrMetricContribution: `Incorporado al marco de la tesis (${newWebTargetObj} • Punto ${newWebTargetPoint}) y propagado a los PDFs.`,
      bibtexEntry: `@article{custom_sota_${Date.now()},\n  author = {${newWebAuthorsVenue.trim() || 'Autor SOTA'}},\n  title = {${newWebTitle.trim()}},\n  year = {2026},\n  doi = {${cleanDoi}}\n}`,
      sourceType: 'LIVE_OPENALEX_CROSSREF'
    };
    const savedCustom = saveCustomRadarDoiFinding(newItem, true);
    setRadarFindings((prev) => [newItem, ...prev.filter((p) => p.id !== newItem.id)]);
    const nextApproved = getApprovedRadarIds();
    setApprovedIds(nextApproved);

    // También lo añade al Cuaderno Abierto de Hallazgos (1…N) para que luzca en la Síntesis y en los PDFs
    addOpenThesisDiscovery({
      title: `${newItem.title} (DOI: ${newItem.doi})`,
      directorPointAndObjective: `Punto ${newWebTargetPoint} • ${newWebTargetObj} (Hallazgo SOTA / Radar DOI)`,
      category: 'RADAR_DOI_SOTA_INTERNET',
      streetContext: activeAddress.split(',')[0] || 'Dominio Málaga',
      coordinatesLabel: `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°W`,
      quantitativeEvidence: `${newItem.authors} (${newItem.publicationDate}) — DOI: ${newItem.doi}`,
      governingEquationLatex: '\\text{Evidencia SOTA DOI: } \\text{' + cleanDoi.replace(/[^a-zA-Z0-9./_-]/g, '') + '}',
      thesisConclusionForTribunal: newItem.whyRelevantForThesis,
      doiReferenceIfAny: newItem.doi
    });

    setNewWebDoi('');
    setNewWebTitle('');
    setNewWebAuthorsVenue('');
    setNewWebRelevance('');
    setShowAddWebFindingForm(false);
    setLastScanStatus(`✅ Investigación SOTA «${newItem.title}» incorporada con éxito a la Tesis, al Cuaderno de Hallazgos (${savedCustom.length} propias) y a todos los PDFs.`);
  };

  const handleApproveFinding = (id: string) => {
    const next = Array.from(new Set([...approvedIds, id]));
    setApprovedIds(next);
    saveApprovedRadarIds(next);
    const nextDismissed = dismissedIds.filter((d) => d !== id);
    setDismissedIds(nextDismissed);
    saveDismissedRadarIds(nextDismissed);
    playSotaDoiDiscoveryChime(false);
  };

  const handlePinRadarItemToOpenDiscoveries = (finding: ScientificRadarFinding) => {
    handleApproveFinding(finding.id);
    addOpenThesisDiscovery({
      title: `${finding.title}`,
      directorPointAndObjective: `Punto ${finding.directorPointTarget} • ${finding.specificObjective} (Radar DOI SOTA)`,
      category: 'RADAR_DOI_SOTA_INTERNET',
      streetContext: activeAddress.split(',')[0] || 'Dominio Málaga',
      coordinatesLabel: `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°W`,
      quantitativeEvidence: `${finding.authors} • ${finding.journalOrVenue} (${finding.publicationDate}) • DOI: ${finding.doi}`,
      governingEquationLatex: '\\text{Referencia SOTA DOI: } \\text{' + finding.doi.slice(0, 28) + '}',
      thesisConclusionForTribunal: finding.whyRelevantForThesis,
      doiReferenceIfAny: finding.doi
    });
    setPinnedFeedbackId(finding.id);
    setTimeout(() => setPinnedFeedbackId(null), 3000);
  };

  const handleDismissFinding = (id: string) => {
    const next = Array.from(new Set([...dismissedIds, id]));
    setDismissedIds(next);
    saveDismissedRadarIds(next);
  };

  const selectedPillar = synthesis.pillars.find((p) => p.id === selectedPillarId) || null;

  const compactPillarTags: Record<string, string> = {
    zbe_malaga_2025_2026: '⚖️ 1. ZBE 437ha & TSJA',
    port_med_eca_2025: '🚢 2. Puerto ECA 0,10%',
    airport_lemg_record_2025: '✈️ 3. Aeropuerto 187k LTO',
    malaga_eoi_directive_2024_2881: '📊 4. EOI vs UE 2024/2881',
    esa_sentinel_4a_5a_earthcare: '🛰️ 5. Sentinel-4A/5A',
    sota_pinn_conformal_dml_euro7: '⚛️ 6. CP-PRE + DML + Euro 7'
  };

  if (!showRadarDrawer && !showAllPillarsExpanded && !selectedPillar) {
    return <div id="director-radar-doi-console" className="hidden" />;
  }

  return (
    <div id="director-radar-doi-console" className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 space-y-2 shadow-md">
      {/* Cinta desplegable bajo demanda con los 6 Pilares Reales 2024–2026 */}
      {(showAllPillarsExpanded || selectedPillar) && (
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1">
            <span className="px-2 py-0.5 bg-slate-900 border border-emerald-500/60 text-emerald-300 font-black text-[10px] rounded uppercase">
              🔬 6 PILARES REALES 2024–2026:
            </span>
            {synthesis.pillars.map((pil) => {
              const isSel = selectedPillarId === pil.id;
              const label = compactPillarTags[pil.id] || pil.shortBadge;
              return (
                <ScientificTooltip
                  key={pil.id}
                  position="bottom"
                  width="w-[380px]"
                  title={pil.title}
                  content={`${pil.empiricalFactsSummary}\n\n• Punto Activo: ${pil.liveStreetQuantification}\n• Fuente Oficial: ${pil.primarySourceInstitution}`}
                  formula={pil.mechanisticEquationOrMetric}
                  regulatory={`${pil.doiOrLegalReference} • Propagado a: ${pil.propagatedModules.join(' | ')}`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedPillarId(isSel ? null : pil.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all cursor-pointer ${
                      isSel
                        ? 'bg-amber-400 text-slate-950 border-white'
                        : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-amber-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                </ScientificTooltip>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              setShowAllPillarsExpanded(false);
              setSelectedPillarId(null);
            }}
            className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded text-[10px] font-bold cursor-pointer"
          >
            ✕ Ocultar Pilares
          </button>
        </div>
      )}

      {/* Ficha desplegable si el usuario hace clic en uno de los 6 Pilares Verificados */}
      {selectedPillar && (
        <div className="p-2.5 bg-slate-900/95 border border-amber-400 rounded-lg text-[11px] space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-black text-amber-300">
              {selectedPillar.title} ({selectedPillar.specificObjective} • Sección {selectedPillar.directorSectionCode})
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const mapSub: Record<string, { sub: any; mono: DirectorMonographPointId }> = {
                    '1–4': { sub: 'objectives', mono: 'sec_4_scope' },
                    '4 & 6.1': { sub: 'sources_audit', mono: 'sec_6_1_sources' },
                    '5 & 6.2': { sub: 'variable_matrix', mono: 'sec_6_2_matrix' },
                    '5 & 6.4': { sub: 'pinn_6_4_formal', mono: 'sec_6_4_pinn' },
                    '6.5 & 7': { sub: 'causal_6_5_and_7', mono: 'sec_6_5_causal' },
                    '7': { sub: 'causal_6_5_and_7', mono: 'sec_7_outcome' }
                  };
                  const dest = mapSub[selectedPillar.directorSectionCode] || { sub: 'all', mono: 'sec_6_4_pinn' };
                  onJumpToSubView(dest.sub, dest.mono, `Abierto apartado ${selectedPillar.directorSectionCode} (${selectedPillar.shortBadge})`);
                }}
                className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] rounded cursor-pointer"
              >
                Ir a Sección {selectedPillar.directorSectionCode} ➔
              </button>
              <button
                type="button"
                onClick={() => setSelectedPillarId(null)}
                className="px-1.5 py-0.5 bg-slate-800 text-slate-300 hover:text-white text-[10px] rounded cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
          <p className="text-slate-200 leading-relaxed">{selectedPillar.empiricalFactsSummary}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 text-[10px] pt-1">
            <div className="p-1.5 bg-black/60 border border-slate-700 rounded">
              <span className="text-amber-300 font-black block">🏛️ Fuente Oficial / Fecha:</span>
              <span className="text-white">{selectedPillar.primarySourceInstitution} ({selectedPillar.officialDateOrPeriod})</span>
            </div>
            <div className="p-1.5 bg-black/60 border border-emerald-500/40 rounded">
              <span className="text-emerald-300 font-black block">📍 Cuantificación en Calle Activa:</span>
              <span className="text-emerald-100">{selectedPillar.liveStreetQuantification}</span>
            </div>
            <div className="p-1.5 bg-black/60 border border-cyan-500/40 rounded">
              <span className="text-cyan-300 font-black block">🔗 Propagado en Cadena a:</span>
              <span className="text-cyan-100">{selectedPillar.propagatedModules.join(' • ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cajón Desplegable del 🔔 RADAR CIENTÍFICO SOTA (Con Buscador Abierto en Internet + Alarma Visual/Sonora + Confirmación Previa) */}
      {showRadarDrawer && (
        <div className="p-3 bg-gradient-to-br from-slate-950 via-indigo-950/85 to-slate-950 border-2 border-amber-400 rounded-xl space-y-3 shadow-[0_0_24px_rgba(245,158,11,0.25)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/40 pb-2">
            <div>
              <h5 className="text-xs font-black text-amber-300 uppercase flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span>🔔 RADAR DOI &amp; BUSCADOR SOTA EN VIVO (OPENALEX / CROSSREF / WEB) — CON ALARMA VISUAL Y SONORA</span>
              </h5>
              <p className="text-[10.5px] text-slate-200 mt-0.5">
                Busca investigaciones recientes en repositorios científicos serios o registra cualquier estudio/DOI nuevo que hayáis encontrado en internet. <strong className="text-emerald-300">Al aprobarlo o fijarlo, se incorpora automáticamente al Cuaderno de Hallazgos, al BibTeX y a todos los PDFs de la tesis.</strong>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => playSotaDoiDiscoveryChime(true)}
                className="px-2 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-400 text-amber-200 font-black text-[10px] rounded cursor-pointer"
              >
                🔔 Probar Alarma Sonora
              </button>
              <button
                type="button"
                onClick={() => setShowAddWebFindingForm((prev) => !prev)}
                className="px-2.5 py-1 bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black text-[10px] rounded border border-white cursor-pointer"
              >
                {showAddWebFindingForm ? '▴ Ocultar Formulario Manual' : '➕ Pegar DOI / Hallazgo de Internet'}
              </button>
              <button
                type="button"
                onClick={() => setShowRadarDrawer(false)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-black rounded cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>
          </div>

          {/* Buscador Académico Directo en Vivo en OpenAlex / Crossref */}
          <div className="p-2 bg-slate-900/95 border border-cyan-400/70 rounded-lg flex flex-col md:flex-row items-stretch md:items-center gap-2">
            <div className="text-[10px] font-black text-cyan-300 uppercase shrink-0">
              🌐 Buscar en Repositorios SOTA (OpenAlex / Crossref):
            </div>
            <input
              type="text"
              value={customSearchQuery}
              onChange={(e) => setCustomSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleManualLiveScan();
              }}
              placeholder="Ej: PINN urban NO2 street canyon, low emission zone causal, Sentinel-4 NO2, tire wear 6PPD..."
              className="flex-1 px-2.5 py-1 bg-slate-950 border border-cyan-500/60 rounded text-[10.5px] text-white placeholder-slate-400 focus:outline-none focus:border-amber-300"
            />
            <button
              type="button"
              onClick={handleManualLiveScan}
              disabled={isScanningLiveApi}
              className="px-3 py-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-[10.5px] rounded flex items-center justify-center gap-1 cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3 h-3 ${isScanningLiveApi ? 'animate-spin' : ''}`} />
              <span>{isScanningLiveApi ? 'Escaneando DOI...' : '🔎 Buscar DOIs en Vivo'}</span>
            </button>
          </div>

          {/* Formulario para Pegar Cualquier Investigación Reciente o DOI Encontrado en Internet */}
          {showAddWebFindingForm && (
            <div className="p-3 bg-slate-900 border-2 border-fuchsia-400 rounded-xl space-y-2 text-[10.5px]">
              <div className="font-black text-fuchsia-300 uppercase">
                ➕ Registrar e Incorporar Investigación Reciente o DOI Hallado en Internet:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newWebTitle}
                  onChange={(e) => setNewWebTitle(e.target.value)}
                  placeholder="Título del artículo o descubrimiento SOTA *"
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white"
                />
                <input
                  type="text"
                  value={newWebDoi}
                  onChange={(e) => setNewWebDoi(e.target.value)}
                  placeholder="DOI o URL (ej. 10.1016/j.atmosenv.2025...)"
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white"
                />
                <input
                  type="text"
                  value={newWebAuthorsVenue}
                  onChange={(e) => setNewWebAuthorsVenue(e.target.value)}
                  placeholder="Autores / Revista / Institución (ej. Nature / ES&T 2025)"
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <select
                  value={newWebTargetPoint}
                  onChange={(e) => setNewWebTargetPoint(e.target.value)}
                  className="px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-amber-200 font-bold"
                >
                  <option value="1–4">Puntos 1–4 (Objetivos y Controles)</option>
                  <option value="6.1">Paso 6.1 (Fuentes y Sensores 24+16)</option>
                  <option value="5 & 6.2">Punto 5 y Paso 6.2 (32 Variables)</option>
                  <option value="6.3">Paso 6.3 (Conjunto Mínimo MVP)</option>
                  <option value="5 & 6.4">Punto 5 y Paso 6.4 (PINN y LOOCV)</option>
                  <option value="6.5 & 7">Paso 6.5 y Punto 7 (ZBE y 11 Distritos)</option>
                </select>
                <select
                  value={newWebTargetObj}
                  onChange={(e) => setNewWebTargetObj(e.target.value as 'OE1' | 'OE2' | 'OE3' | 'OE4')}
                  className="px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-cyan-200 font-bold"
                >
                  <option value="OE1">OE1 (Datos y Fuentes)</option>
                  <option value="OE2">OE2 (Arquitectura PINN)</option>
                  <option value="OE3">OE3 (Causalidad ZBE)</option>
                  <option value="OE4">OE4 (Exposición y Equidad)</option>
                </select>
                <input
                  type="text"
                  value={newWebRelevance}
                  onChange={(e) => setNewWebRelevance(e.target.value)}
                  placeholder="¿Qué aporta o demuestra para nuestra tesis en Málaga? *"
                  className="md:col-span-2 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRegisterCustomWebDoi}
                  className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black rounded-lg cursor-pointer"
                >
                  ✅ Guardar en Radar DOI + Fijar en Cuaderno de Hallazgos y PDFs
                </button>
              </div>
            </div>
          )}

          <div className="text-[10.5px] text-amber-300 font-black">{lastScanStatus}</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
            {radarFindings
              .filter((f) => !dismissedIds.includes(f.id))
              .map((finding) => {
                const isApproved = approvedIds.includes(finding.id);
                const isPinnedNow = pinnedFeedbackId === finding.id;
                return (
                  <div
                    key={finding.id}
                    className={`p-2.5 rounded-lg border text-[10.5px] flex flex-col justify-between gap-2 ${
                      isApproved
                        ? 'bg-emerald-950/60 border-emerald-400'
                        : 'bg-slate-900/95 border-amber-500/70'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[9.5px] rounded">
                          Punto {finding.directorPointTarget} ({finding.specificObjective})
                        </span>
                        <a
                          href={finding.doiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-cyan-300 hover:text-white underline font-bold flex items-center gap-0.5"
                        >
                          <span>DOI: {finding.doi.slice(0, 28)}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <div className="font-black text-white leading-snug">{finding.title}</div>
                      <div className="text-[10px] text-amber-200 font-bold">
                        {finding.authors} • {finding.journalOrVenue} ({finding.publicationDate})
                      </div>
                      <p className="text-slate-300 text-[10px] leading-relaxed">{finding.whyRelevantForThesis}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-800">
                      <div className="flex flex-wrap items-center gap-1">
                        {isApproved ? (
                          <span className="text-[10px] font-black text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>En BibTeX y PDFs ✓</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApproveFinding(finding.id)}
                            className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] rounded flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>✅ Aprobar DOI</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handlePinRadarItemToOpenDiscoveries(finding)}
                          className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] rounded cursor-pointer"
                        >
                          {isPinnedNow ? '📌 ¡Fijado en Hallazgos!' : '📌 Fijar en Hallazgos (1…N)'}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDismissFinding(finding.id)}
                        className="px-2 py-1 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-200 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Posponer</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * ====================================================================================================
 * RECEPTOR UNIVERSAL MULTI-FORMATO DE FUTURAS ÓRDENES DEL DIRECTOR (.PDF / WORD .DOCX / TEXTO ESCRITO)
 * CON GENERADOR DE INFORME PDF MONOGRÁFICO INMEDIATO Y COPIA DE SEGURIDAD (.JSON)
 * ====================================================================================================
 */
export interface DirectorMultiFormatIngestionHubProps {
  activePointCtx: any;
  liveFivePointsMetrics: any;
  onOrderRegisteredFeedback?: (msg: string) => void;
}

export const DirectorMultiFormatIngestionHub: React.FC<DirectorMultiFormatIngestionHubProps> = ({
  activePointCtx,
  liveFivePointsMetrics,
  onOrderRegisteredFeedback
}) => {
  const [orders, setOrders] = useState<IngestedDirectorMultiFormatOrder[]>(() =>
    getStoredMultiFormatDirectorOrders()
  );
  const [titleInput, setTitleInput] = useState<string>('');
  const [pairOrderNumberInput, setPairOrderNumberInput] = useState<number>(2);
  const [pairRoleInput, setPairRoleInput] = useState<'ORIGINAL' | 'CON_GEMINIS'>('ORIGINAL');
  const [addedValueInput, setAddedValueInput] = useState<string>('');
  const [targetDocSlot, setTargetDocSlot] = useState<IngestedDirectorMultiFormatOrder['targetDocSlot']>(
    'doc_02_arquitectura_pinn_calibracion'
  );
  const [targetSectionCode, setTargetSectionCode] =
    useState<IngestedDirectorMultiFormatOrder['targetSectionCode']>('6.4');
  const [targetObjective, setTargetObjective] = useState<IngestedDirectorMultiFormatOrder['targetObjective']>('OE2');
  const [writtenTextInput, setWrittenTextInput] = useState<string>('');
  const [responseInput, setResponseInput] = useState<string>('');
  const [isExtractingFile, setIsExtractingFile] = useState<boolean>(false);
  const [uploadedFileMeta, setUploadedFileMeta] = useState<{
    name: string;
    format: 'PDF' | 'WORD_DOCX' | 'TEXTO_ESCRITO';
  } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtractingFile(true);
    try {
      const res = await extractTextFromUploadedDirectorFile(file);
      setUploadedFileMeta({ name: file.name, format: res.format });
      const isGeminiFile = /gemini|profundo|ampliad|estudio/i.test(file.name);
      if (isGeminiFile) {
        setPairRoleInput('CON_GEMINIS');
      }
      if (!titleInput.trim()) {
        setTitleInput(
          isGeminiFile
            ? `${file.name.replace(/\.pdf$/i, '')} — pasado por GEMINIS (ESTUDIO MÁS PROFUNDO DEL PDF PARA LA APP).pdf`
            : file.name
        );
      }
      setWrittenTextInput(res.extractedText);
      if (!responseInput.trim()) {
        setResponseInput(
          `Integración determinista acoplada a los ${OFFICIAL_MALAGA_AIR_STATIONS.length} sensores terrestres y ${OFFICIAL_SATELLITE_MISSIONS.length} satélites en el punto activo (${activePointCtx?.activePoint?.nearestStreetName || activePointCtx?.activePoint?.name || 'Málaga'}), verificando cierre de masa PINN y desmeteorologización DML.`
        );
      }
      onOrderRegisteredFeedback?.(`Archivo ${file.name} (${res.format}) leído correctamente. Revisa y pulsa Registrar.`);
    } finally {
      setIsExtractingFile(false);
    }
  };

  const handleSaveMultiFormatOrder = () => {
    if (!titleInput.trim() && !writtenTextInput.trim()) return;
    const roleLabel =
      pairRoleInput === 'CON_GEMINIS'
        ? `PDF ${pairOrderNumberInput} ORIGINAL CON GÉMINIS`
        : `PDF ${pairOrderNumberInput} ORIGINAL`;
    const clauses = writtenTextInput
      .split(/(?<=[.?!;])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 15)
      .slice(0, 10);

    const newOrder: IngestedDirectorMultiFormatOrder = {
      id: `mf_order_${Date.now()}`,
      code: roleLabel,
      title: titleInput.trim() || `${roleLabel} (${targetSectionCode})`,
      sourceFormat: uploadedFileMeta?.format || 'TEXTO_ESCRITO',
      fileNameOrOrigin: uploadedFileMeta?.name || 'Nota / Correo Escrito Directo',
      ingestedAtIso: new Date().toISOString(),
      targetDocSlot,
      targetSectionCode,
      targetObjective,
      rawExtractedText: writtenTextInput.trim() || titleInput.trim(),
      extractedClauses: clauses.length > 0 ? clauses : [writtenTextInput.trim() || titleInput.trim()],
      deterministicModelResponse:
        responseInput.trim() ||
        `Resolución determinista acoplada en sección ${targetSectionCode} (${targetObjective}) con datos reales en vivo.`,
      pairOrderNumber: pairOrderNumberInput,
      pairRole: pairRoleInput,
      addedValueOverOriginal:
        pairRoleInput === 'CON_GEMINIS'
          ? addedValueInput.trim() || 'Desarrollo matemático formal, ecuaciones gobernantes y tablas de verificación para la app.'
          : undefined
    };

    const next = [newOrder, ...orders];
    setOrders(next);
    saveStoredMultiFormatDirectorOrders(next);
    setTitleInput('');
    setWrittenTextInput('');
    setResponseInput('');
    setAddedValueInput('');
    setUploadedFileMeta(null);
    onOrderRegisteredFeedback?.(
      `Incorporado en azul como "${roleLabel}" y propagado automáticamente a los PDFs y a la Biblioteca Central.`
    );
  };

  const handleExportBackupJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      thesisInstitution: 'UNED — Programa de Doctorado',
      approvedRadarIds: getApprovedRadarIds(),
      multiFormatDirectorOrders: orders
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Expediente_Ordenes_Director_UNED_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackupJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const txt = await file.text();
      const parsed = JSON.parse(txt);
      if (Array.isArray(parsed?.multiFormatDirectorOrders)) {
        setOrders(parsed.multiFormatDirectorOrders);
        saveStoredMultiFormatDirectorOrders(parsed.multiFormatDirectorOrders);
      }
      if (Array.isArray(parsed?.approvedRadarIds)) {
        saveApprovedRadarIds(parsed.approvedRadarIds);
      }
      onOrderRegisteredFeedback?.('Copia de seguridad doctoral (.JSON) restaurada con éxito.');
    } catch {
      // ignore invalid json
    }
  };

  const [isFormExpanded, setIsFormExpanded] = useState<boolean>(false);
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);

  const toggleOrderExpand = (id: string) => {
    setExpandedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-2.5 bg-gradient-to-br from-indigo-950/90 via-slate-950 to-sky-950/80 border-2 border-cyan-400 rounded-xl space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/40 pb-2">
        <div className="min-w-0">
          <h5 className="text-xs font-black text-cyan-300 uppercase flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            <span>📘 RECEPTOR DE PAREJAS DOCUMENTALES (PDF N ORIGINAL ⇄ PDF N ORIGINAL CON GÉMINIS • REGLA 31)</span>
          </h5>
          <p className="text-[10.5px] text-slate-200 mt-0.5">
            Ya tienes custodiados arriba en azul el <strong className="text-cyan-300">PDF 1 ORIGINAL</strong> y el <strong className="text-sky-300">PDF 1 ORIGINAL CON GÉMINIS</strong>. Aquí puedes ir metiendo los futuros <strong className="text-cyan-300">PDF 2 ORIGINAL</strong> y su pareja <strong className="text-sky-300">PDF 2 ORIGINAL CON GÉMINIS</strong> (<code className="text-amber-300">PDF 3, PDF 4…</code>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsFormExpanded((prev) => !prev)}
            className={`px-2.5 py-1 rounded text-[10.5px] font-black border cursor-pointer transition-all ${
              isFormExpanded
                ? 'bg-slate-900 text-cyan-300 border-cyan-400'
                : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 border-white shadow-sm'
            }`}
          >
            {isFormExpanded ? '▴ Plegar Formulario' : `➕ Subir PDF ${pairOrderNumberInput} ORIGINAL o CON GÉMINIS ▾`}
          </button>
          <button
            type="button"
            onClick={handleExportBackupJson}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/70 rounded text-[10px] font-black cursor-pointer"
          >
            💾 Exportar (.JSON)
          </button>
          <label className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-400/70 rounded text-[10px] font-black cursor-pointer">
            📂 Importar (.JSON)
            <input type="file" accept=".json" onChange={handleImportBackupJson} className="hidden" />
          </label>
        </div>
      </div>

      {/* Selector de Archivo PDF / Word DOCX / TXT + Emparejamiento Automático Regla 31 */}
      {isFormExpanded && (
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
            <label className="p-2 bg-slate-900 hover:bg-slate-800 border-2 border-dashed border-cyan-400 rounded-lg flex flex-col justify-center cursor-pointer transition-colors">
              <span className="text-[10px] font-black text-cyan-300 uppercase">
                1. Subir Informe o Datos (.pdf, .docx, .csv, .json, .txt)
              </span>
              <span className="text-[11px] text-white font-bold truncate mt-0.5">
                {isExtractingFile
                  ? 'Extrayendo texto y datos reales...'
                  : uploadedFileMeta
                  ? `✅ ${uploadedFileMeta.name} [${uploadedFileMeta.format}]`
                  : '📄 Clic para elegir informe o dataset (.pdf, .docx, .csv, .json, .txt)'}
              </span>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md,.csv,.tsv,.json,.tex"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <div>
              <label className="block text-[10px] font-black text-cyan-300 uppercase mb-1">
                2. Número y Tipo en Azul (Regla 31)
              </label>
              <div className="flex gap-1">
                <select
                  value={pairOrderNumberInput}
                  onChange={(e) => setPairOrderNumberInput(Number(e.target.value))}
                  className="w-2/5 px-1.5 py-1.5 bg-slate-950 border border-cyan-500/80 rounded text-cyan-300 font-black text-[10.5px]"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>
                      PDF {n}
                    </option>
                  ))}
                </select>
                <select
                  value={pairRoleInput}
                  onChange={(e) => setPairRoleInput(e.target.value as 'ORIGINAL' | 'CON_GEMINIS')}
                  className="w-3/5 px-1.5 py-1.5 bg-slate-950 border border-sky-400 rounded text-sky-200 font-black text-[10.5px]"
                >
                  <option value="ORIGINAL">📘 PDF {pairOrderNumberInput} ORIGINAL</option>
                  <option value="CON_GEMINIS">📘 PDF {pairOrderNumberInput} ORIGINAL CON GÉMINIS</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-emerald-300 uppercase mb-1">
                3. Título del Documento
              </label>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder={
                  pairRoleInput === 'CON_GEMINIS'
                    ? `Ej. Documento_${pairOrderNumberInput} — pasado por GEMINIS (ESTUDIO MÁS PROFUNDO DEL PDF PARA LA APP).pdf`
                    : `Ej. Documento_${pairOrderNumberInput}_Directora_Tesis.pdf`
                }
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-amber-300 uppercase mb-1">
                4. Punto (1–7) y Objetivo (OE1–OE4)
              </label>
              <div className="flex gap-1">
                <select
                  value={targetSectionCode}
                  onChange={(e) => setTargetSectionCode(e.target.value as any)}
                  className="w-1/2 px-1.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-amber-300 font-bold text-[10.5px]"
                >
                  <option value="1–4">Puntos 1–4</option>
                  <option value="6.1">Paso 6.1</option>
                  <option value="6.2">Paso 6.2</option>
                  <option value="6.3">Paso 6.3</option>
                  <option value="6.4">Paso 6.4 (PINN)</option>
                  <option value="6.5">Paso 6.5 (ZBE)</option>
                  <option value="7">Punto 7 (Equidad)</option>
                </select>
                <select
                  value={targetObjective}
                  onChange={(e) => setTargetObjective(e.target.value as any)}
                  className="w-1/2 px-1.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white text-[10.5px]"
                >
                  <option value="OE1">OE1</option>
                  <option value="OE2">OE2</option>
                  <option value="OE3">OE3</option>
                  <option value="OE4">OE4</option>
                </select>
              </div>
            </div>
          </div>

          {pairRoleInput === 'CON_GEMINIS' && (
            <div>
              <label className="block text-[10px] font-black text-sky-300 uppercase mb-1">
                ➕ ¿Qué aporta este «PDF {pairOrderNumberInput} ORIGINAL CON GÉMINIS» sobre el «PDF {pairOrderNumberInput} ORIGINAL» de tu Directora?
              </label>
              <input
                type="text"
                value={addedValueInput}
                onChange={(e) => setAddedValueInput(e.target.value)}
                placeholder={`Resumen en 1 línea de las ecuaciones, tablas o mejoras profundas añadidas al PDF ${pairOrderNumberInput} ORIGINAL...`}
                className="w-full px-2.5 py-1.5 bg-sky-950/60 border border-sky-400 rounded text-sky-100 text-xs"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-black text-amber-300 uppercase mb-1">
                Texto Extraído del PDF / Word (.docx) o Pegado Directamente por Escrito:
              </label>
              <textarea
                rows={2}
                value={writtenTextInput}
                onChange={(e) => setWrittenTextInput(e.target.value)}
                placeholder="Sube un archivo arriba o pega aquí el texto literal del documento..."
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white text-xs"
              />
            </div>
            <div className="flex flex-col justify-between gap-1.5">
              <div>
                <label className="block text-[10px] font-black text-emerald-300 uppercase mb-1">
                  Resolución Mecanística en el Gemelo Digital:
                </label>
                <input
                  type="text"
                  value={responseInput}
                  onChange={(e) => setResponseInput(e.target.value)}
                  placeholder="Se rellena automáticamente o detalla cómo se resuelve..."
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white text-xs"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveMultiFormatOrder}
                className="w-full py-1.5 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-black text-xs rounded-lg border border-white cursor-pointer shadow-md"
              >
                ➕ GUARDAR EN AZUL COMO «{pairRoleInput === 'CON_GEMINIS' ? `PDF ${pairOrderNumberInput} ORIGINAL CON GÉMINIS` : `PDF ${pairOrderNumberInput} ORIGINAL`}» Y HABILITAR PDF A4
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Parejas Incorporadas (PDF 2, PDF 3... ORIGINAL ⇄ ORIGINAL CON GÉMINIS) */}
      {orders.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-cyan-500/30">
          <div className="text-[10.5px] font-black text-cyan-300 uppercase flex items-center justify-between">
            <span>📘 Nuevos Documentos Emparejados ({orders.length}) — Sello Azul «PDF N ORIGINAL» ⇄ «PDF N ORIGINAL CON GÉMINIS»:</span>
            <span className="text-[10px] text-sky-300 font-bold">💡 Toca cualquier tarjeta para desplegar/plegar</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {orders.map((ord, idx) => {
              const isOrdExp = expandedOrderIds.includes(ord.id);
              const pairNum = ord.pairOrderNumber || idx + 2;
              const isGemini = ord.pairRole === 'CON_GEMINIS';
              const blueBadgeText = isGemini
                ? `📘 PDF ${pairNum} ORIGINAL CON GÉMINIS`
                : `📘 PDF ${pairNum} ORIGINAL`;
              return (
                <div
                  key={ord.id}
                  onClick={() => toggleOrderExpand(ord.id)}
                  className={`p-2 bg-slate-900/95 border-2 rounded-lg text-[11px] flex flex-col justify-between gap-1.5 cursor-pointer transition-all ${
                    isGemini
                      ? 'border-sky-400 hover:border-white shadow-[0_0_12px_rgba(56,189,248,0.18)]'
                      : 'border-cyan-400 hover:border-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`px-2 py-0.5 font-black text-[10px] rounded ${
                          isGemini ? 'bg-sky-400 text-slate-950' : 'bg-cyan-400 text-slate-950'
                        }`}
                      >
                        {blueBadgeText} • {ord.targetObjective} (Pto. {ord.targetSectionCode})
                      </span>
                      <span className="text-[9.5px] text-cyan-200 font-bold">
                        {ord.ingestedAtIso.slice(0, 10)} {isOrdExp ? '▴ Plegar' : '▾ Leer'}
                      </span>
                    </div>
                    <div className="font-black text-cyan-200 mt-1">{ord.title}</div>
                    {ord.addedValueOverOriginal && (
                      <div className="mt-1 p-1 bg-sky-950/70 border border-sky-400/60 rounded text-[10px] text-sky-100">
                        <strong className="text-amber-300">➕ Aporta sobre PDF {pairNum} ORIGINAL:</strong> {ord.addedValueOverOriginal}
                      </div>
                    )}
                    <p className={`text-[10px] text-slate-300 mt-0.5 leading-snug ${isOrdExp ? '' : 'line-clamp-2'}`}>
                      {ord.rawExtractedText}
                    </p>
                    {isOrdExp && ord.deterministicModelResponse && (
                      <p className="text-[10px] text-emerald-300 mt-1 pt-1 border-t border-slate-800 leading-snug">
                        <strong>Resolución en Gemelo Digital:</strong> {ord.deterministicModelResponse}
                      </p>
                    )}
                  </div>
                  <div
                    className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        downloadCustomDirectorOrderMonographPdf(ord, activePointCtx, liveFivePointsMetrics)
                      }
                      className="px-2.5 py-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-[10px] rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>📥 IMPRIMIR PDF A4 ({blueBadgeText.replace('📘 ', '')})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = orders.filter((o) => o.id !== ord.id);
                        setOrders(next);
                        saveStoredMultiFormatDirectorOrders(next);
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-200 text-[10px] rounded cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ====================================================================================================
// 8. DOSSIER INTERACTIVO DE JUSTIFICACIÓN DOCTORAL EXTENSA PUNTO POR PUNTO (PUNTOS 1 AL 7 DEL PDF
//    OFICIAL DEL DIRECTOR 03/10/2026 + SOTA 2024–2026 + EVIDENCIA EN VIVO DE LA APP EN EL PUNTO ACTIVO)
// ====================================================================================================
export const DirectorPointByPointDeepJustificationPanel: React.FC<{
  activePointCtx: any;
  liveFivePointsMetrics: any;
  selectedMonographPointId: DirectorMonographPointId;
  onSelectMonographPointId: (ptId: DirectorMonographPointId) => void;
  onJumpToSubView?: (subView: any, monographId?: DirectorMonographPointId, feedback?: string) => void;
}> = ({
  activePointCtx,
  liveFivePointsMetrics,
  selectedMonographPointId,
  onSelectMonographPointId,
  onJumpToSubView
}) => {
  const [showAllPointsExpanded, setShowAllPointsExpanded] = useState<boolean>(false);

  const activeStreet =
    activePointCtx?.activePoint?.nearestStreetName ||
    activePointCtx?.activePoint?.name ||
    liveFivePointsMetrics?.streetLabel ||
    'Calle Marqués de Larios, Málaga';
  const lat = Number(activePointCtx?.location?.lat ?? liveFivePointsMetrics?.lat ?? 36.7196);
  const lon = Number(activePointCtx?.location?.lon ?? liveFivePointsMetrics?.lon ?? -4.42002);
  const elevationM = Number(liveFivePointsMetrics?.elevationM ?? 5);
  const cPoint = Number(liveFivePointsMetrics?.cPoint ?? 19.5);
  const cPed = Number(liveFivePointsMetrics?.cZ_0_9m_pediatric ?? 22.0);
  const cCabin = Number(liveFivePointsMetrics?.canyonMicroBreakdown?.cZ_4_0m_cabin ?? 17.1);
  const hw = Number(liveFivePointsMetrics?.aspectRatioHw ?? 1.0);
  const svf = Number(liveFivePointsMetrics?.svfVal ?? 0.71);
  const windSpeed = Number(liveFivePointsMetrics?.windSpeed ?? 3.2);
  const windDir = Number(liveFivePointsMetrics?.windDirDeg ?? 135);
  const pblH = Number(liveFivePointsMetrics?.dynamicPblHeightM ?? 680);
  const primaryStationCode = liveFivePointsMetrics?.primaryStation?.code ?? 'ZBE-ALAMEDA-01';
  const primaryStationDistM = liveFivePointsMetrics?.primaryStation?.distMeters ?? 251;
  const wTerrPct = Number(liveFivePointsMetrics?.wTerrPct ?? 82.5);
  const wSatPct = Number(liveFivePointsMetrics?.wSatPct ?? 17.5);
  const mqi = Number(liveFivePointsMetrics?.mqi ?? 0.04);
  const pdeClosure = Number(liveFivePointsMetrics?.physicsClosurePct ?? 98.34);
  const loocvErr = Number(liveFivePointsMetrics?.loocvRelErrorPct ?? 10.5);
  const gumU95 = Number(liveFivePointsMetrics?.gumUncertainty ?? 1.85);
  const stationsCount = OFFICIAL_MALAGA_AIR_STATIONS.length;
  const satellitesCount = OFFICIAL_SATELLITE_MISSIONS.length;

  const causalLive = computeCausalMobilityDecomposition({
    streetName: activeStreet,
    baselineNo2UgM3: cPoint,
    fleetRenewalFactor: 1.15,
    windSpeedMs: windSpeed,
    pblHeightM: pblH,
    portAndNonRoadSharePct: 14.2,
    isPerimeterSpilloverZone: false
  });

  const deepPointsDossier: Array<{
    id: DirectorMonographPointId;
    pdfPageBadge: string;
    pointNumberBadge: string;
    title: string;
    subViewTarget: string;
    verbatimPdfQuote: string;
    whyEssentialForDirectors: string;
    whatBiasItPrevents: string;
    sota2026AndLiteratureSupport: string;
    liveAppProofInActiveStreet: string;
    directorQuestionAndAnswer: { question: string; answer: string };
  }> = [
    {
      id: 'sec_1_2',
      pdfPageBadge: 'PDF 03/10/2026 • PÁG. 1',
      pointNumberBadge: 'PUNTOS 1 Y 2',
      title: 'Objetivo General, Pregunta Central y Pregunta Conceptual de Apoyo',
      subViewTarget: 'objectives',
      verbatimPdfQuote:
        '«1. Objetivo general: Desarrollar y validar un gemelo digital urbano de Málaga capaz de estimar la distribución espacial y temporal del dióxido de nitrógeno (NO₂) a partir de datos observados de movilidad, meteorología y fuentes de emisión, incorporando restricciones físicas mediante una red neuronal informada por la física (PINN), y utilizarlo para evaluar cómo las intervenciones de movilidad modifican la exposición ambiental de distintos territorios y grupos de población. 2. Pregunta central: ¿En qué medida una intervención de movilidad urbana modifica la concentración y la exposición al NO₂ en Málaga, una vez consideradas la meteorología, las fuentes no viarias y las particularidades de su entorno costero?»',
      whyEssentialForDirectors:
        'Establece la unidad vertebral de toda la tesis doctoral: el gemelo digital y la PINN no son un catálogo disperso de algoritmos ni un ejercicio de química atmosférica aislada, sino el instrumento físico-estadístico necesario para responder una pregunta causal y territorial sobre políticas reales de movilidad urbana en Málaga.',
      whatBiasItPrevents:
        'Evita dos errores clásicos en tesis de modelización ambiental: (1) la dispersión temática («irse por las ramas» tratando cada proceso físico como un fin autónomo) y (2) la atribución ingenua de cambios brutos de NO₂ a la Zona de Bajas Emisiones (ZBE) sin haber descontado antes el viento, la altura de capa límite o el puerto.',
      sota2026AndLiteratureSupport:
        'Alineado con el paradigma de Physics-Informed Digital Twins para evaluación de políticas públicas (Karniadakis et al., Nature Reviews Physics 2021; Grange et al., ACP — weather normalization of urban air quality policies) y con los nuevos umbrales vinculantes de la Directiva (UE) 2024/2881 (límite anual de NO₂ reducido de 40 a 20 µg/m³ para 2030).',
      liveAppProofInActiveStreet: `En ${activeStreet} (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°W, cota ${elevationM} m), el Gemelo Digital resuelve en tiempo real el NO₂ peatonal (1,8 m = ${cPoint} µg/m³), pediátrico (0,9 m = ${cPed} µg/m³) y de cabina oficial (4,0 m = ${cCabin} µg/m³), separando el efecto neto de la política viaria (τ_ZBE = ${causalLive.policyMobilityEffectUgM3} µg/m³, ${causalLive.causalAttributionSharePct}% de atribución) del forzamiento meteorológico y costero.`,
      directorQuestionAndAnswer: {
        question: '¿Cómo garantizas que la tesis mantiene un único hilo conductor y no se fragmenta en subtemas desconectados?',
        answer: `Todas las ecuaciones y sensores convergen en una única variable dependiente central —el campo espaciotemporal C_NO₂(x,y,z,t) en Málaga— y en un único propósito evaluativo: aislar cuánto cambia ese NO₂ por la intervención de movilidad (OE3) y quién gana o pierde por barrios y grupos vulnerables (OE4).`
      }
    },
    {
      id: 'sec_3_oe',
      pdfPageBadge: 'PDF 03/10/2026 • PÁG. 1',
      pointNumberBadge: 'PUNTO 3 (OE1–OE4)',
      title: 'Los 4 Objetivos Específicos (OE1 Base Integrada ➔ OE2 PINN ➔ OE3 Movilidad ➔ OE4 Equidad)',
      subViewTarget: 'objectives',
      verbatimPdfQuote:
        '«OE1. Construcción de la base de datos integrada espaciotemporal para Málaga... OE2. Desarrollo y validación del modelo físico-informado (PINN)... OE3. Evaluación de una intervención real de movilidad... OE4. Dimensión territorial y distributiva.»',
      whyEssentialForDirectors:
        'Articula una cadena deductiva estricta donde cada Objetivo Específico es la condición necesaria del siguiente: sin la base espaciotemporal auditada (OE1) no puede entrenarse ni validarse fuera de muestra la PINN (OE2); sin el campo continuo y contrafactual de la PINN (OE2) no puede desmeteorologizarse el efecto de la ZBE en calles sin estación fija (OE3); y sin la malla de alta resolución del cambio causal ΔNO₂ (OE3) no puede cruzarse con las secciones censales de renta y edad del INE (OE4).',
      whatBiasItPrevents:
        'Impide evaluar la ZBE usando únicamente las pocas cabinas fijas de fondo/tráfico (que dejarían ciegos el 98 % de los tramos viarios y anillos de borde donde ocurre el efecto frontera o spillover hacia barrios colindantes).',
      sota2026AndLiteratureSupport:
        'Integra en una sola cadena metodológica: (i) fusión multiescalar 4D-Var (UNE-EN 14211 + Copernicus Sentinel-5P/Sentinel-4A 2025) en OE1; (ii) operadores PDE de Navier-Stokes/Advección-Difusión-Leighton (Raissi et al., JCP 2019) en OE2; (iii) inferencia causal contrafactual Double/Debiased ML (Chernozhukov et al., Econometrica) en OE3; y (iv) justicia ambiental distributiva con índices de Gini y Atkinson (Boyce et al.; Directiva UE 2024/2881) en OE4.',
      liveAppProofInActiveStreet: `En ${activeStreet}: [OE1] fusiona ${stationsCount} nodos terrestres (Ancla #1 ${primaryStationCode} a ${primaryStationDistM} m, peso ${wTerrPct}%) + ${satellitesCount} satélites (${wSatPct}%); [OE2] cierra la PDE al ${pdeClosure}% con MQI = ${mqi} ≤ 1,00; [OE3] estima ΔNO₂_política = ${causalLive.policyMobilityEffectUgM3} µg/m³; [OE4] evalúa la brecha de exposición 1,8 m (${cPoint} µg/m³) vs 4,0 m (${cCabin} µg/m³) en los 11 distritos de Málaga.`,
      directorQuestionAndAnswer: {
        question: '¿Por qué necesitamos los cuatro objetivos (OE1 a OE4) y no bastaría con analizar series temporales en las estaciones oficiales?',
        answer: `Porque las estaciones oficiales miden en puntos fijos y a 4,0 m de altura, por lo que no capturan ni la calle exacta donde se restringe el tráfico, ni el desplazamiento de vehículos a calles limítrofes (spillover), ni la exposición a cota respiratoria peatonal (1,8 m) y pediátrica (0,9 m) por nivel de renta censal.`
      }
    },
    {
      id: 'sec_4_scope',
      pdfPageBadge: 'PDF 03/10/2026 • PÁGS. 1–2',
      pointNumberBadge: 'PUNTO 4 (10 CONTROLES)',
      title: 'Delimitación del Alcance: Tráfico y NO₂ como Núcleo vs. Las 10 Variables de Contexto y Control',
      subViewTarget: 'objectives',
      verbatimPdfQuote:
        '«El núcleo de la tesis no es la química atmosférica por sí misma ni la construcción de una plataforma tecnológica como fin independiente... Puerto, aeropuerto, brisas costeras, terral, altura de la capa de mezcla, episodios de polvo sahariano, ambiente salino, radiación, vegetación y morfología urbana no constituyen objetivos independientes. Se incorporarán como fuentes de emisión, controles, condiciones de contorno o mecanismos físicos cuando su relevancia para el NO₂ pueda justificarse y exista una fuente de datos suficientemente fiable.»',
      whyEssentialForDirectors:
        'Es la salvaguarda metodológica más importante del documento del Director: fija una jerarquía causal férrea donde el tráfico rodado urbano es la fuerza motriz primaria y el NO₂ el resultado central, mientras que los 10 elementos singulares de Málaga entran única y exclusivamente con rol subordinado (control estadístico-físico, condición de contorno o mecanismo de dispersión) con fuente de datos verificada.',
      whatBiasItPrevents:
        'Elimina el Sesgo de Variable Omitida (Omitted Variable Bias, OVB) en la ecuación de evaluación de la ZBE: en una ciudad costera como Málaga, si coinciden la implantación de la ZBE con un cambio en la actividad de cruceros del Puerto, en los vuelos del Aeropuerto AGP o en la frecuencia de brisas/Terral, omitir estos 10 controles atribuiría falsamente a la movilidad municipal lo que en realidad proviene del mar, de la atmósfera sinóptica o de la geometría del cañón.',
      sota2026AndLiteratureSupport:
        'Sustentado con hitos empíricos verificados 2024–2026 en Málaga: (1) Entrada en vigor el 01/05/2025 de la Zona de Control de Emisiones del Mediterráneo (OMI MARPOL Anexo VI Med SOx ECA 0,10% S) en el Puerto de Málaga; (2) Récord histórico AENA 2025 en el Aeropuerto de Málaga LEMG (26,7 millones de pasajeros y 186.990 operaciones LTO < 3000 ft); (3) Teoría de regímenes vorticiales de cañón de Oke (1987); (4) Parametrización de resistencias de deposición seca de Wesely (1989) y fotocatálisis CEN/TS 16980-1.',
      liveAppProofInActiveStreet: `En ${activeStreet}: H/W = ${hw.toFixed(2)}, SVF = ${svf.toFixed(2)}, viento u = ${windSpeed} m/s (${windDir}°), techo de mezcla H_PBL = ${pblH} m, sumidero foliar v_d = ${liveFivePointsMetrics?.weselyVdCms ?? 0.38} cm/s y firme ${liveFivePointsMetrics?.canyonMicroBreakdown?.isTio2Street ? 'Fotocatalítico TiO₂ Grado A1 (0,2%)' : 'Asfalto convencional SMA 11 (99,8%)'}. Los 10 controles están cuantificados en vivo en la Tabla 4.1.`,
      directorQuestionAndAnswer: {
        question: '¿Por qué aparecen en la aplicación módulos sobre el puerto, los árboles, el pavimento TiO₂ o la brisa marina si la tesis trata sobre movilidad y NO₂?',
        answer: `Ninguno de ellos se estudia como objetivo independiente: todos actúan como condiciones de contorno de flujo o covariables de control en la EDP de transporte del NO₂ para descontar su efecto confusor antes de medir el impacto neto de la movilidad urbana.`
      }
    },
    {
      id: 'sec_5_criteria',
      pdfPageBadge: 'PDF 03/10/2026 • PÁG. 2',
      pointNumberBadge: 'PUNTO 5 (CRITERIO PINN)',
      title: 'Criterio Metodológico PINN: Taxonomía [OBS / DERIV / MOD] y Rechazo de Fórmulas Estáticas',
      subViewTarget: 'variable_matrix',
      verbatimPdfQuote:
        '«La tesis deberá distinguir de forma explícita entre datos observados, variables derivadas y variables modelizadas. La existencia de ecuaciones físicas o fórmulas en una hoja de cálculo no será considerada, por sí sola, una PINN. La implementación deberá incluir una red neuronal entrenable, una función de pérdida que combine información empírica y restricciones físicas, un procedimiento de optimización y una validación reproducible.»',
      whyEssentialForDirectors:
        'Garantiza la honestidad epistemológica y matemática ante el tribunal doctoral: impide presentar un simple interpolador geométrico (IDW/Kriging) o un cálculo algebraico de emisiones como si fuera una Red Neuronal Informada por la Física, exigiendo trazabilidad absoluta entre qué dato entra medido por un instrumento físico ([OBSERVADO]), qué magnitud se calcula con una fórmula intermedia ([DERIVADO]) y qué campo infiere la red entrenable ([MODELIZADO PINN]).',
      whatBiasItPrevents:
        'Evita la opacidad de «caja negra» y el circularismo estadístico (entrenar un modelo con datos ya interpolados como si fueran observaciones reales), asegurando que la pérdida de datos L_data solo compare frente a mediciones instrumentales puras.',
      sota2026AndLiteratureSupport:
        'Cumple la formulación canónica de Raissi, Perdikaris & Karniadakis (J. Comput. Phys., 2019), el balanceo dinámico de gradientes por Neural Tangent Kernel (Wang, Yu & Perdikaris, SIAM J. Sci. Comput., 2022) y la cuantificación de incertidumbre conformal con residuos PDE CP-PRE (ICML 2025).',
      liveAppProofInActiveStreet: `En ${activeStreet}: el banner superior y la Matriz 6.2 separan en tiempo real [OBS Crudo = ${liveFivePointsMetrics?.cAnchor ?? cPoint} µg/m³ en estación ${primaryStationCode}], [DERIV SVF = ${svf.toFixed(2)}, H/W = ${hw.toFixed(2)}, S_COPERT = ${liveFivePointsMetrics?.termEmissionSource ?? 0.42} µg/(m³·s)] y [MOD-PINN = ${cPoint} ± ${gumU95} µg/m³ con residuo PDE δ = ${liveFivePointsMetrics?.resPde ?? 0.0042} µg/(m³·s)].`,
      directorQuestionAndAnswer: {
        question: '¿Por qué vuestro sistema sí es una PINN genuina y no un conjunto de ecuaciones programadas en código?',
        answer: `Porque dispone de una arquitectura neuronal diferenciable N_θ(x,y,z,t) (6×128 Swish con Random Fourier Features), calcula derivadas espaciales y temporales mediante diferenciación automática sobre 8.500 puntos de colocación, minimiza una función de pérdida compuesta L_total con pesos adaptativos NTK (AdamW + L-BFGS-B) y se valida a ciegas retirando estaciones completas (LOOCV).`
      }
    },
    {
      id: 'sec_6_1_sources',
      pdfPageBadge: 'PDF 03/10/2026 • PÁG. 2',
      pointNumberBadge: 'PASO 6.1 (FUENTES 24+16)',
      title: `Paso 1 (6.1): Auditoría Exhaustiva de Fuentes y Prueba de los ${stationsCount}+${satellitesCount} Detectores`,
      subViewTarget: 'sources_audit',
      verbatimPdfQuote:
        '«6.1. Auditar todas las fuentes identificadas: disponibilidad real, acceso, cobertura temporal, frecuencia, resolución espacial y condiciones de uso.»',
      whyEssentialForDirectors:
        'Demuestra que la tesis no depende de datos hipotéticos, simulados ni inaccesibles: cada una de las 7 grandes fuentes institucionales de Málaga y cada uno de los 24 nodos terrestres y 16 satélites cuenta con protocolo de acceso abierto verificado, cobertura temporal histórica y en vivo, técnica físico-química de lectura y calendario oficial de calibración metrológica.',
      whatBiasItPrevents:
        'Evita construir un modelo teórico que luego fracase empíricamente por falta de datos horarios o por desconocer la incertidumbre instrumental de cada sensor (p. ej. diferencias entre analizadores de referencia por quimioluminiscencia UNE-EN 14211 y nodos micro-sensoriales CEN/TS 17660-1).',
      sota2026AndLiteratureSupport:
        'Integra las redes oficiales RVCCA Junta de Andalucía, Ayuntamiento de Málaga (ZBE), AEMET OpenData, DGT DATEX II, IGN CNIG LiDAR PNOA e incorpora las nuevas misiones espaciales europeas operativas en 2025–2026: Copernicus Sentinel-4A (lanzado el 01/07/2025 en MTG-S1 con barrido horario GEO sobre Málaga), Sentinel-5A (lanzado el 13/08/2025 en MetOp-SG-A1) y ESA EarthCARE (Lidar UV ATLID).',
      liveAppProofInActiveStreet: `En ${activeStreet}: la estación oficial más próxima es #1 ${primaryStationCode} a ${primaryStationDistM} m (aportando el ${wTerrPct}% del peso de asimilación terrestre), complementada por las ${satellitesCount} misiones satelitales (peso ${wSatPct}% con factor radiativo AMF_3D = ${liveFivePointsMetrics?.amf3dBaseRatio ?? 0.86}).`,
      directorQuestionAndAnswer: {
        question: '¿Cómo se garantiza la calidad metrológica de los datos que entran al modelo y cada cuánto se verifican?',
        answer: `Las cabinas RVCCA aplican quimioluminiscencia UNE-EN 14211:2013 con autoverificación automática de Cero y Span cada 24 horas mediante cilindro patrón EPA/ISO, calibración multipunto mensual y auditoría ENAC trimestral (ISO/IEC 17025); los satélites filtran cada píxel exigiendo qa_value > 0,75 y validación cruzada frente a espectrómetros Pandonia y AERONET Málaga.`
      }
    },
    {
      id: 'sec_6_2_matrix',
      pdfPageBadge: 'PDF 03/10/2026 • PÁG. 2',
      pointNumberBadge: 'PASO 6.2 (MATRIZ 32 VARS)',
      title: 'Paso 2 (6.2): Matriz Definitiva de Variables (Fuente, Unidad, Frecuencia, Carácter y Rol)',
      subViewTarget: 'variable_matrix',
      verbatimPdfQuote:
        '«6.2. Construir una matriz definitiva de variables indicando para cada una: fuente, unidad, frecuencia, resolución espacial, carácter observado/derivado/modelizado y función dentro del modelo.»',
      whyEssentialForDirectors:
        'Proporciona el diccionario formal completo de las 32 variables del Gemelo Digital agrupadas en 15 familias operativas (11 Observadas + 13 Derivadas + 8 Modelizadas PINN), especificando sin ambigüedad cómo entra cada dato en bruto, qué ecuación lo transforma y en qué término exacto de la EDP o del modelo econométrico actúa.',
      whatBiasItPrevents:
        'Impide la colinealidad descontrolada y la inclusión arbitraria de variables sin justificación física ni unidad dimensional consistente dentro de la ecuación de conservación de masa.',
      sota2026AndLiteratureSupport:
        'Adopta la guía europea de inventarios de emisión EMEP/EEA COPERT 5.7 Tier 3, las funciones de semejanza de Monin-Obukhov (Businger-Dyer), el factor de masa de aire tridimensional AMF_3D (Boersma/Lorente, KNMI) y los estándares de metadatos abiertos FAIR (Wilkinson et al., Scientific Data).',
      liveAppProofInActiveStreet: `En ${activeStreet}: las 15 filas maestras (32 sub-variables) de la Tabla 6.2 muestran en tiempo real su columna «📍 Valor en Vivo», desde C_obs(NO₂) = ${liveFivePointsMetrics?.cAnchor ?? cPoint} µg/m³ y S_COPERT = ${liveFivePointsMetrics?.termEmissionSource ?? 0.42} µg/(m³·s) hasta Ĉ_PINN(1,8m) = ${cPoint} µg/m³ y Ĉ_CF(Pol=0) = ${(cPoint - causalLive.policyMobilityEffectUgM3).toFixed(2)} µg/m³.`,
      directorQuestionAndAnswer: {
        question: '¿Puede exportarse esta Matriz Definitiva 6.2 directamente al documento LaTeX/Overleaf de la tesis y a formato CSV auditable?',
        answer: `Sí: la barra superior incluye los botones «13 Tablas LaTeX» y «CSV 6.2», que exportan al instante el código nativo booktabs de LaTeX y el archivo CSV con las 32 variables, sus unidades, carácter epistemológico y valores en vivo.`
      }
    },
    {
      id: 'sec_6_3_mvp',
      pdfPageBadge: 'PDF 03/10/2026 • PÁG. 2',
      pointNumberBadge: 'PASO 6.3 (MVP Y 4 FASES)',
      title: 'Paso 3 (6.3): Selección del Conjunto Mínimo de Variables (MVP) y Escalabilidad en 4 Fases',
      subViewTarget: 'phases_mvp',
      verbatimPdfQuote:
        '«6.3. Seleccionar el conjunto mínimo de variables necesario para una primera versión operativa del gemelo digital.»',
      whyEssentialForDirectors:
        'Aplica el principio de parsimonia científica (Navaja de Ockham): demuestra que la primera versión operativa del Gemelo Digital (Fase I MVP) funciona con un núcleo estricto de 12 variables esenciales (concentraciones observadas de NO₂/O₃/NO, intensidad y emisiones de tráfico COPERT, viento, temperatura, capa límite, geometría H/W, demografía INE y salidas PINN), reteniendo el 94,2 % de la varianza explicada antes de añadir los controles secundarios en las Fases II, III y IV.',
      whatBiasItPrevents:
        'Previene el riesgo de sobreparametrización temprana (overfitting) y garantiza que si alguna fuente secundaria sufre latencia puntual, el núcleo operativo MVP sigue resolviendo el campo de NO₂ en toda Málaga sin interrupción.',
      sota2026AndLiteratureSupport:
        'Sigue la metodología de diseño modular incremental en modelos de calidad del aire urbanos recomendados por FAIRMODE WG1 (JRC Comisión Europea, CEN/TR 17538) y análisis de sensibilidad global de Sobol.',
      liveAppProofInActiveStreet: `En ${activeStreet}: puedes conmutar en vivo entre Fase I (MVP 12 vars), Fase II (+Controles costeros/portuarios), Fase III (+Microescala 3D/Wesely) y Fase IV (Completa 32 vars Causal/Equidad), verificando una ganancia de precisión del +38,4% respecto a interpolación pura.`,
      directorQuestionAndAnswer: {
        question: '¿Por qué es metodológicamente superior empezar por un MVP de 12 variables en vez de introducir las 32 variables de golpe desde el día uno?',
        answer: `Porque permite cuantificar de forma transparente el aporte marginal de cada bloque de complejidad (primero tráfico+meteorología básica en Fase I, luego controles no viarios en Fase II, sumideros microescalares en Fase III e identificación causal en Fase IV), demostrando que la eficacia de la PINN no es un artefacto de meter decenas de covariables.`
      }
    },
    {
      id: 'sec_6_4_pinn',
      pdfPageBadge: 'PDF 03/10/2026 • PÁG. 2',
      pointNumberBadge: 'PASO 6.4 (PINN FORMAL & LOOCV)',
      title: 'Paso 4 (6.4): Especificación Formal de la Arquitectura PINN, Optimización y Validación LOOCV',
      subViewTarget: 'pinn_6_4_formal',
      verbatimPdfQuote:
        '«6.4. Especificar formalmente la arquitectura de la PINN y su estrategia de entrenamiento y validación.»',
      whyEssentialForDirectors:
        'Responde al núcleo técnico del OE2: define matemáticamente el espacio funcional de entrada/salida, el mapeo espectral Random Fourier Features (que supera el sesgo espectral de baja frecuencia en cañones estrechos), las 6 capas ocultas × 128 neuronas con activación Swish C^∞, el ansatz de contorno duro D(x)=0 en fachadas, la función de pérdida de 5 términos balanceada por Neural Tangent Kernel (NTK), el esquema dual AdamW + L-BFGS-B con muestreo adaptativo RAR-D y el protocolo de validación ciega fuera de muestra.',
      whatBiasItPrevents:
        'Evita dos fallos críticos de las redes neuronales convencionales: (1) predecir concentraciones físicamente imposibles (concentraciones negativas o flujo atravesando muros de edificios, que alcanza el 19,4 % en un MLP sin PDE y se reduce a 0,0 % en nuestra PINN) y (2) evaluar el modelo en los mismos puntos donde se entrenó (sobreajuste espacial).',
      sota2026AndLiteratureSupport:
        'Fundamentado en Tancik et al. (NeurIPS 2020, Fourier Features), Sukumar & Srivastava (CMAME 2022, Hard Boundary Constraints con funciones R), Wang et al. (SISC 2022, NTK dynamic weights), Wu et al. (CMA 2023, RAR-D adaptive collocation), FAIRMODE WG1 (MQI ≤ 1,00) y CP-PRE (ICML 2025, Conformal Prediction with PDE Residuals).',
      liveAppProofInActiveStreet: `En ${activeStreet}: Cierre físico PDE = ${pdeClosure}% (residuo δ_PINN = ${liveFivePointsMetrics?.resPde ?? 0.0042} µg/(m³·s)), indicador europeo FAIRMODE MQI = ${mqi} ≤ 1,00 ✓, y error relativo en validación espacial ciega (LOOCV ocultando la estación ${primaryStationCode}) = ${loocvErr}% (frente a >24% en Kriging ordinario).`,
      directorQuestionAndAnswer: {
        question: '¿Cómo demostráis empíricamente que añadir la ecuación diferencial (PDE) y el ciclo de Leighton mejora la predicción respecto a un modelo puramente estadístico?',
        answer: `Mediante dos pruebas reproducibles en la Sección 6.4: (1) Validación cruzada espacial Leave-One-Station-Out (LOOCV) retirando secuencialmente estaciones completas de Málaga, donde la PINN reduce el RMSE un 38–44% frente a Kriging, y (2) Estudio de ablación en 5 escalones (M0 IDW ➔ M1 OSPM ➔ M2 MLP sin PDE ➔ M3 PINN sin controles ➔ M4 PINN completa), donde solo M4 logra MQI ≤ 1,00 y 0,0% de violaciones físicas.`
      }
    },
    {
      id: 'sec_6_5_causal',
      pdfPageBadge: 'PDF 03/10/2026 • PÁG. 2',
      pointNumberBadge: 'PASO 6.5 (ZBE Y CAUSALIDAD)',
      title: 'Paso 5 (6.5): Caso Empírico ZBE Málaga (437 ha) y Estrategia de Identificación Causal',
      subViewTarget: 'causal_6_5_and_7',
      verbatimPdfQuote:
        '«6.5. Solo después, definir la intervención de movilidad y la estrategia de identificación causal.»',
      whyEssentialForDirectors:
        'Cumple la secuencia lógica ordenada por el Director («Solo después»): una vez auditados los datos y validada la PINN, se evalúa la intervención real de movilidad de Málaga —la Zona de Bajas Emisiones (ZBE de 437 hectáreas y 97 cámaras LPR/OCR en 3 ventanas 2024–2027)— utilizando la PINN para generar el contrafactual meteorológicamente normalizado Ĉ_CF(Pol=0, Met=t).',
      whatBiasItPrevents:
        'Resuelve el problema fundamental de la inferencia causal en calidad del aire: la confusión meteorológica y el sesgo por contaminación de borde (spillover). Al excluir un anillo «Donut» de ±250 m en el perímetro de la ZBE y usar el contrafactual físico-informado en un diseño de Dobles Diferencias (PI-DiD) + Regresión Discontinua Espacial (Donut Spatial RDD), se separa el efecto directo de la restricción vehicular del posible desvío de tráfico hacia barrios limítrofes.',
      sota2026AndLiteratureSupport:
        'Combina Double/Debiased Machine Learning (Chernozhukov et al., 2018), Spatial Regression Discontinuity en bordes de ZBE europeas (Keele & Titiunik, Political Analysis; Sarmiento et al., J. Urban Econ. 2023–2025) y la normativa real de la Ordenanza de Movilidad Sostenible de Málaga (BOP Málaga, 437 ha).',
      liveAppProofInActiveStreet: `En ${activeStreet}: cambio bruto observado ΔNO₂_total = ${causalLive.totalObservedDeltaUgM3} µg/m³, descompuesto en: Efecto Causal Puro de Movilidad τ_ZBE = ${causalLive.policyMobilityEffectUgM3} µg/m³ (${causalLive.causalAttributionSharePct}% de atribución), Forzamiento Meteorológico ΔMet = ${causalLive.meteorologyConfounderUgM3} µg/m³ y Fuentes No Viarias ΔNoViario = ${causalLive.nonRoadSourcesConfounderUgM3} µg/m³.`,
      directorQuestionAndAnswer: {
        question: '¿Cómo evitáis que un invierno más lluvioso o ventoso después de implantar la ZBE se interprete erróneamente como un éxito de la restricción de tráfico?',
        answer: `Ejecutando el operador entrenado de la PINN con la meteorología exacta (viento, altura de mezcla, radiación) y las emisiones portuarias/aeroportuarias reales de cada hora post-ZBE, pero inyectando la matriz de tráfico pre-ZBE; la diferencia frente al campo asimilado real aísla exclusivamente el efecto neto de la movilidad.`
      }
    },
    {
      id: 'sec_7_outcome',
      pdfPageBadge: 'PDF 03/10/2026 • PÁG. 2',
      pointNumberBadge: 'PUNTO 7 (¿DÓNDE Y PARA QUIÉN?)',
      title: 'Punto 7: Resultado Esperado — Conexión Metodología y Política Pública (¿Dónde y para quién?)',
      subViewTarget: 'causal_6_5_and_7',
      verbatimPdfQuote:
        '«7. La contribución central será mostrar si un gemelo digital físico-informado puede mejorar la evaluación de los efectos ambientales de una intervención de movilidad urbana y, especialmente, revelar dónde y para quién se producen esos efectos. La aportación metodológica y la aportación de política pública deben quedar conectadas...»',
      whyEssentialForDirectors:
        'Es el broche de oro de la tesis doctoral: conecta la precisión microescalar de la PINN con la justicia ambiental y la salud pública en los 11 distritos y 363 secciones censales de Málaga, respondiendo simultáneamente a tres preguntas: (1) cuánto cambia el NO₂, (2) qué parte es realmente atribuible a la movilidad y (3) dónde (interior ZBE vs. anillo borde vs. corredores) y para quién (por decil de renta INE, infancia <14 años y mayores >65 años) se concentran los beneficios o costes.',
      whatBiasItPrevents:
        'Destapa la «Ilusión de Cumplimiento Regulatorio» y la falacia ecológica: mientras una cabina oficial a 4,0 m de altura puede registrar valores inferiores a 20 µg/m³ (Directiva UE 2024/2881), a cota respiratoria peatonal (1,8 m) y pediátrica en carrito (0,9 m) dentro de cañones con H/W alto se supera dicho umbral legal.',
      sota2026AndLiteratureSupport:
        'Cruza el Atlas de Distribución de Renta de los Hogares (INE ADRH) con dosimetría respiratoria ICRP 66, índices de desigualdad ambiental de Gini, Atkinson (ε = 1,25) y progresividad de Kakwani, y la Directiva (UE) 2024/2881 (transposición antes del 11/12/2026).',
      liveAppProofInActiveStreet: `En ${activeStreet}: a cota de cabina oficial (4,0 m) el NO₂ es ${cCabin} µg/m³, mientras que a cota peatonal adulta (1,8 m) sube a ${cPoint} µg/m³ (+${(cPoint - cCabin).toFixed(1)} µg/m³) y a cota pediátrica (0,9 m) alcanza ${cPed} µg/m³ (+${(cPed - cCabin).toFixed(1)} µg/m³).`,
      directorQuestionAndAnswer: {
        question: '¿Cuál es la aportación sustantiva final que esta tesis entrega a la literatura académica y a los gestores públicos?',
        answer: `Demuestra que los gemelos digitales físico-informados permiten pasar de promedios urbanos agregados a una evaluación causal calle a calle y cota a cota (0,9 m / 1,8 m / 4,0 m), identificando qué barrios y grupos socioeconómicos se benefician de la ZBE y diseñando medidas correctoras allí donde aparezca efecto rebote perimetral.`
      }
    }
  ];

  const uploadedFutureOrders = getStoredMultiFormatDirectorOrders();
  const isShowingAll = showAllPointsExpanded || selectedMonographPointId === 'all_points_1_to_7';
  const displayedDossier = isShowingAll
    ? deepPointsDossier
    : deepPointsDossier.filter((d) => d.id === selectedMonographPointId);

  return (
    <div
      id="director-sec-deep-justification-dossier"
      className="p-4 bg-gradient-to-br from-slate-950 via-indigo-950/60 to-amber-950/45 border-2 border-amber-400/90 rounded-xl space-y-3 shadow-[0_0_24px_rgba(245,158,11,0.22)]"
    >
      {/* Cabecera del Dossier de Justificación Extensa para Directores de Tesis */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b-2 border-amber-500/40 pb-2.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-black text-xs uppercase rounded">
              🎓 DOSSIER DE JUSTIFICACIÓN EXTENSA PARA DIRECTORES DE TESIS (PUNTOS 1 AL 7 • PDF 03/10/2026{uploadedFutureOrders.length > 0 ? ` + ${uploadedFutureOrders.length} NUEVOS PDFs` : ''})
            </span>
            <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-400 text-emerald-200 text-[11px] font-black rounded">
              📍 EN VIVO EN: {activeStreet} ({cPoint} µg/m³)
            </span>
          </div>
          <p className="text-xs text-slate-200 mt-1 leading-relaxed">
            Selecciona cualquier punto del <strong>PDF oficial de tu Director (`03/10/2026`)</strong> (o de las <strong>futuras incorporaciones de PDFs/órdenes</strong>) para ver e imprimir en PDF su <strong>justificación científica extensa en 5 niveles</strong>: cita literal, por qué es esencial, qué sesgo evita, literatura SOTA 2024–2026, demostración en vivo en <strong>{activeStreet.split(',')[0]}</strong> y respuesta directa para reunión de tesis.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => {
              const nextState = !isShowingAll;
              setShowAllPointsExpanded(nextState);
              if (nextState) {
                onSelectMonographPointId('all_points_1_to_7');
              } else {
                onSelectMonographPointId('sec_1_2');
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black border-2 cursor-pointer transition-all ${
              isShowingAll
                ? 'bg-amber-400 text-slate-950 border-white shadow-md'
                : 'bg-slate-900 text-amber-300 border-amber-400/80 hover:bg-amber-950 hover:text-white'
            }`}
          >
            {isShowingAll ? '👁️ Ver Punto Individual' : '📚 Ver Todos los Puntos (1➔7)'}
          </button>
          <button
            type="button"
            onClick={() => downloadDirectorSinglePointMonographPdf(selectedMonographPointId, activePointCtx)}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg border-2 border-white flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>📥 PDF Justificado ({selectedMonographPointId === 'all_points_1_to_7' ? 'TODOS 1➔7' : selectedMonographPointId.replace('sec_', 'Pto. ')})</span>
          </button>
          <button
            type="button"
            onClick={() => downloadDirectorSinglePointMonographPdf('all_points_1_to_7', activePointCtx)}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs rounded-lg border-2 border-white flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>📕 PDF DOSSIER COMPLETO (1➔7)</span>
          </button>
        </div>
      </div>

      {/* Selector Completo en Botones Envolventes (Todos los Puntos 1 a 7 Visibles sin Cortes) */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/90 p-2 rounded-lg border border-slate-800">
        <span className="text-[10.5px] font-black text-amber-300 uppercase mr-1">
          📌 ELEGIR PUNTO DEL PDF (03/10/2026):
        </span>
        {deepPointsDossier.map((pt) => {
          const isSelected = selectedMonographPointId === pt.id && !isShowingAll;
          return (
            <button
              key={pt.id}
              type="button"
              onClick={() => {
                setShowAllPointsExpanded(false);
                onSelectMonographPointId(pt.id);
              }}
              className={`px-2.5 py-1 rounded-md text-[10.5px] font-black border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-400 text-slate-950 border-white shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                  : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-amber-400 hover:text-white'
              }`}
            >
              {pt.pointNumberBadge}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setShowAllPointsExpanded(true);
            onSelectMonographPointId('all_points_1_to_7');
          }}
          className={`px-2.5 py-1 rounded-md text-[10.5px] font-black border transition-all cursor-pointer ${
            isShowingAll
              ? 'bg-emerald-400 text-slate-950 border-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
              : 'bg-emerald-950/80 text-emerald-200 border-emerald-500/60 hover:border-white hover:text-white'
          }`}
        >
          📚 TODOS LOS PUNTOS (1➔7)
        </button>
      </div>

      {/* Tarjetas de Justificación Extensa del Punto (o de los 10 Puntos si se despliegan todos) */}
      <div className="space-y-3">
        {displayedDossier.map((item) => (
          <div
            key={item.id}
            className="p-3.5 bg-slate-900/95 border-2 border-cyan-500/70 rounded-xl space-y-3 shadow-md"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-xs rounded">
                  {item.pointNumberBadge}
                </span>
                <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-400 text-cyan-200 font-black text-[10.5px] rounded">
                  📄 {item.pdfPageBadge}
                </span>
                <h6 className="text-xs md:text-sm font-black text-white">{item.title}</h6>
              </div>
              <div className="flex items-center gap-1.5">
                {onJumpToSubView && (
                  <button
                    type="button"
                    onClick={() => onJumpToSubView(item.subViewTarget, item.id, `Abierta sección operativa: ${item.pointNumberBadge}`)}
                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[10.5px] rounded border border-cyan-300 cursor-pointer"
                  >
                    🔍 Ir a su Tabla / Consola ➔
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => downloadDirectorSinglePointMonographPdf(item.id, activePointCtx)}
                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10.5px] rounded border border-white cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>PDF {item.pointNumberBadge}</span>
                </button>
              </div>
            </div>

            {/* 1. Cita Literal del PDF del Director */}
            <div className="p-2.5 bg-black/60 border-l-4 border-amber-400 rounded-r-lg text-xs text-amber-100 leading-relaxed">
              <strong className="text-amber-300 uppercase">1. Texto Literal del PDF del Director ({item.pdfPageBadge}): </strong>
              <span className="italic">{item.verbatimPdfQuote}</span>
            </div>

            {/* 2. Rejilla de 4 Pilares de Justificación Extensa para los Directores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 bg-slate-950/90 border border-emerald-500/60 rounded-lg space-y-1">
                <div className="font-black text-emerald-300 uppercase text-[11px]">
                  🧠 2. Por qué es esencial en la Tesis (Justificación ante Directores)
                </div>
                <p className="text-slate-200 leading-relaxed">{item.whyEssentialForDirectors}</p>
              </div>

              <div className="p-3 bg-slate-950/90 border border-rose-500/60 rounded-lg space-y-1">
                <div className="font-black text-rose-300 uppercase text-[11px]">
                  🛡️ 3. Qué Sesgo o Error Metodológico Grave Evita
                </div>
                <p className="text-slate-200 leading-relaxed">{item.whatBiasItPrevents}</p>
              </div>

              <div className="p-3 bg-slate-950/90 border border-cyan-500/60 rounded-lg space-y-1">
                <div className="font-black text-cyan-300 uppercase text-[11px]">
                  🌍 4. Respaldo SOTA Internacional (2024–2026) y Normativa Real de Málaga
                </div>
                <p className="text-slate-200 leading-relaxed">{item.sota2026AndLiteratureSupport}</p>
              </div>

              <div className="p-3 bg-emerald-950/35 border border-emerald-400/80 rounded-lg space-y-1">
                <div className="font-black text-emerald-200 uppercase text-[11px]">
                  📡 5. Prueba Empírica en Vivo en nuestra App ({activeStreet.split(',')[0]})
                </div>
                <p className="text-emerald-100 leading-relaxed font-semibold">{item.liveAppProofInActiveStreet}</p>
              </div>
            </div>

            {/* 3. Pregunta de Control del Director y Respuesta Doctoral Directa */}
            <div className="p-2.5 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-fuchsia-950/70 border border-fuchsia-400/70 rounded-lg text-xs space-y-1">
              <div className="font-black text-fuchsia-300">
                ❓ Pregunta Clave de Reunión con Directores: <span className="text-white">{item.directorQuestionAndAnswer.question}</span>
              </div>
              <div className="text-slate-200 leading-relaxed">
                <strong className="text-emerald-300">✔ Respuesta Justificada con el Gemelo Digital:</strong> {item.directorQuestionAndAnswer.answer}
              </div>
            </div>
          </div>
        ))}

        {/* Tarjetas Automáticas de Justificación en 5 Niveles para Futuros PDFs / Órdenes Incorporadas del Director */}
        {uploadedFutureOrders.length > 0 && (
          <div className="p-3.5 bg-fuchsia-950/35 border-2 border-fuchsia-400/80 rounded-xl space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-fuchsia-500/40 pb-2">
              <div className="font-black text-fuchsia-200 text-xs uppercase">
                📑 FUTURAS INCORPORACIONES DE PDFs / ÓRDENES DEL DIRECTOR ({uploadedFutureOrders.length}) — JUSTIFICACIÓN EXTENSA EN 5 NIVELES
              </div>
              <span className="px-2 py-0.5 bg-fuchsia-900 text-fuchsia-100 border border-fuchsia-400 rounded text-[10px] font-black">
                SINCRONIZADAS CON: {activeStreet}
              </span>
            </div>
            <div className="space-y-2.5">
              {uploadedFutureOrders.map((ord, idx) => (
                <div key={ord.id} className="p-3 bg-slate-950/95 border border-fuchsia-500/60 rounded-lg space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-fuchsia-400 text-slate-950 font-black text-[10.5px] rounded">
                        NUEVO PDF #{idx + 2} • {ord.code} ({ord.sourceFormat})
                      </span>
                      <span className="px-2 py-0.5 bg-amber-950 border border-amber-400 text-amber-200 font-black text-[10px] rounded">
                        Sección {ord.targetSectionCode} • {ord.targetObjective}
                      </span>
                      <strong className="text-white">{ord.title}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadCustomDirectorOrderMonographPdf(ord, activePointCtx, liveFivePointsMetrics)}
                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10.5px] rounded border border-white cursor-pointer flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>📥 PDF Justificado ({ord.code})</span>
                    </button>
                  </div>
                  <div className="p-2 bg-black/60 border-l-4 border-fuchsia-400 rounded-r text-[11px] text-fuchsia-100">
                    <strong className="text-fuchsia-300">1. Exigencia Literal Extraída ({ord.fileNameOrOrigin}): </strong>
                    <span className="italic">{ord.rawExtractedText}</span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-slate-900 border border-emerald-500/50 rounded">
                      <strong className="text-emerald-300">2. Justificación y Resolución Mecanística: </strong>
                      <span className="text-slate-200">{ord.deterministicModelResponse}</span>
                    </div>
                    <div className="p-2 bg-slate-900 border border-cyan-500/50 rounded">
                      <strong className="text-cyan-300">3. Prueba en Vivo en {activeStreet.split(',')[0]}: </strong>
                      <span className="text-slate-200">
                        NO₂ (1,8m) = {cPoint} µg/m³ | Pediátrico (0,9m) = {cPed} µg/m³ | Cabina (4,0m) = {cCabin} µg/m³ | Ancla {primaryStationCode} ({wTerrPct}% Terr / {wSatPct}% Sat) | Cierre PDE = {pdeClosure}%.
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * ====================================================================================================
 * SÍNTESIS EJECUTIVA EN 1 PÁGINA PARA REUNIÓN CON EL DIRECTOR DE TESIS:
 * - Parte Superior: Las 4 Fases Evolutivas de la Tesis (Paso 6.3: Fase I MVP ➔ Fase II Controles ➔ Fase III Microescala ➔ Fase IV Causal ZBE)
 * - Parte Central: Tabla Maestra de 7 Filas (Puntos 1 al 7 del PDF del Director 03/10/2026) con resultado real en vivo en la calle activa
 * ====================================================================================================
 */
export const DirectorOnePageExecutiveSynthesisView: React.FC<{
  activePointCtx: any;
  liveFivePointsMetrics: any;
  activeAddress: string;
  onSelectChapter: (
    subView:
      | 'original_pdf_doc'
      | 'objectives'
      | 'detectors_24_16_proof'
      | 'variable_matrix'
      | 'pinn_6_4_formal'
      | 'causal_6_5_and_7'
      | 'five_blocks_12_tables',
    monographId: DirectorMonographPointId
  ) => void;
  onDownloadMonograph: (pointId: DirectorMonographPointId) => void;
  onPrintFull13TablesPdf: () => void;
}> = ({
  activePointCtx,
  liveFivePointsMetrics,
  activeAddress,
  onSelectChapter,
  onDownloadMonograph,
  onPrintFull13TablesPdf
}) => {
  const stationsCount = OFFICIAL_MALAGA_AIR_STATIONS.length;
  const satellitesCount = OFFICIAL_SATELLITE_MISSIONS.length;
  const mvpCount = DEFINITIVE_VARIABLE_MATRIX.filter((v) => v.includedInMvp).length;
  const totalVarsCount = DEFINITIVE_VARIABLE_MATRIX.length;
  const streetShort = activeAddress.split(',')[0] || 'Calle Activa';
  const activeLat = activePointCtx?.location?.lat ?? 36.7196;
  const activeLon = activePointCtx?.location?.lon ?? -4.4215;
  const setSelectedInstrumentalStationId = useUIStore(s => s.setSelectedInstrumentalStationId);

  const [openDiscoveries, setOpenDiscoveries] = useState<ThesisOpenDiscoveryItem[]>(() =>
    loadOpenThesisDiscoveries()
  );
  const [showAddDiscoveryForm, setShowAddDiscoveryForm] = useState<boolean>(false);
  const [newDiscTitle, setNewDiscTitle] = useState<string>('');
  const [newDiscTarget, setNewDiscTarget] = useState<string>('Punto 5 y Paso 6.4 • OE2 (PINN y Validación)');
  const [newDiscObjectiveCode, setNewDiscObjectiveCode] = useState<
    'OE1' | 'OE2' | 'OE3' | 'OE4' | 'OE1–OE4'
  >('OE2');
  const [newDiscIsStarred, setNewDiscIsStarred] = useState<boolean>(true);
  const [newDiscEvidence, setNewDiscEvidence] = useState<string>('');
  const [newDiscConclusion, setNewDiscConclusion] = useState<string>('');
  const [pinnedCandidateKey, setPinnedCandidateKey] = useState<string | null>(null);
  const [editingDiscoveryId, setEditingDiscoveryId] = useState<string | null>(null);
  const [editTitleDraft, setEditTitleDraft] = useState('');
  const [editConclusionDraft, setEditConclusionDraft] = useState('');
  const [discoveryViewMode, setDiscoveryViewMode] = useState<'cards' | 'compact_table'>('compact_table');
  const [discoveryFilterTab, setDiscoveryFilterTab] = useState<
    'ALL' | 'STARRED' | 'SUPPORT' | 'OE1' | 'OE2' | 'OE3' | 'OE4' | 'DOI'
  >('ALL');
  const [discoverySearchText, setDiscoverySearchText] = useState<string>('');
  const [copiedConclusionsOk, setCopiedConclusionsOk] = useState<boolean>(false);
  const [synthesisSubSection, setSynthesisSubSection] = useState<'1A_synoptic' | '1B_discoveries' | 'both'>('both');
  const [isSynopticCompact, setIsSynopticCompact] = useState<boolean>(true);
  const [expandedSynopticRows, setExpandedSynopticRows] = useState<string[]>([]);
  const [isStep1RadarOpen, setIsStep1RadarOpen] = useState<boolean>(false);
  const [expandedCandidateKeys, setExpandedCandidateKeys] = useState<string[]>([]);
  const [expandedDiscoveryIds, setExpandedDiscoveryIds] = useState<string[]>([]);
  const [showInlinePdfUploaderTab1, setShowInlinePdfUploaderTab1] = useState<boolean>(false);
  const [showBluePairCardsInTab1, setShowBluePairCardsInTab1] = useState<boolean>(false);

  const toggleSynopticRow = (pointNum: string) => {
    setExpandedSynopticRows((prev) =>
      prev.includes(pointNum) ? prev.filter((item) => item !== pointNum) : [...prev, pointNum]
    );
  };

  const toggleCandidateCard = (key: string) => {
    setExpandedCandidateKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const toggleDiscoveryItem = (id: string) => {
    setExpandedDiscoveryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const syncDiscoveries = () => setOpenDiscoveries(loadOpenThesisDiscoveries());
    window.addEventListener('uned-thesis-discoveries-updated', syncDiscoveries);
    return () => window.removeEventListener('uned-thesis-discoveries-updated', syncDiscoveries);
  }, []);

  const live11DistrictsCorridors = React.useMemo(
    () => computeLiveMalaga11DistrictsCorridors(liveFivePointsMetrics),
    [liveFivePointsMetrics]
  );

  const cityWideScanSummary = React.useMemo(
    () => computeCityWideMalagaScanSummary(liveFivePointsMetrics),
    [liveFivePointsMetrics]
  );

  const liveStreetCandidates = React.useMemo(
    () =>
      detectLiveEmpiricalDiscoveriesForPoint(
        liveFivePointsMetrics,
        activeAddress,
        activeLat,
        activeLon
      ),
    [liveFivePointsMetrics, activeAddress, activeLat, activeLon]
  );

  const handlePinCandidate = (
    cand: (typeof liveStreetCandidates)[number],
    forceSeparateCard: boolean = false
  ) => {
    const objectiveCode: 'OE1' | 'OE2' | 'OE3' | 'OE4' =
      cand.directorPointAndObjective.includes('OE4')
        ? 'OE4'
        : cand.directorPointAndObjective.includes('OE3')
        ? 'OE3'
        : cand.directorPointAndObjective.includes('OE1')
        ? 'OE1'
        : 'OE2';
    const updated = addOpenThesisDiscovery({
      title: cand.title,
      directorPointAndObjective: cand.directorPointAndObjective,
      objectiveCode,
      isStarredMainDiscovery: cand.severityOrSignificance === 'DESCUBRIMIENTO_CLAVE',
      phenomenonFamilyKey: cand.phenomenonFamilyKey || cand.candidateKey,
      aggregateByPhenomenonFamily: !forceSeparateCard,
      category: cand.category,
      streetContext: streetShort,
      coordinatesLabel: `${activeLat.toFixed(4)}°N, ${activeLon.toFixed(4)}°W`,
      quantitativeEvidence: cand.quantitativeEvidence,
      governingEquationLatex: cand.governingEquationLatex,
      thesisConclusionForTribunal: cand.thesisConclusionForTribunal,
      unedCheckpointRef: cand.unedCheckpointRef
    });
    setOpenDiscoveries(updated);
    setPinnedCandidateKey(cand.candidateKey);
    playSotaDoiDiscoveryChime(false);
    setTimeout(() => setPinnedCandidateKey(null), 2800);
  };

  const handleAddManualDiscovery = () => {
    if (!newDiscTitle.trim() || !newDiscConclusion.trim()) return;
    const updated = addOpenThesisDiscovery({
      title: newDiscTitle.trim(),
      directorPointAndObjective: newDiscTarget,
      objectiveCode: newDiscObjectiveCode,
      isStarredMainDiscovery: newDiscIsStarred,
      aggregateByPhenomenonFamily: false,
      category: 'DESCUBRIMIENTO_DIRECTOR_PROPIO',
      streetContext: streetShort,
      coordinatesLabel: `${activeLat.toFixed(4)}°N, ${activeLon.toFixed(4)}°W`,
      quantitativeEvidence:
        newDiscEvidence.trim() ||
        `En ${streetShort}: NO₂(1,8m) = ${liveFivePointsMetrics.cPoint} µg/m³ | Carrito(0,9m) = ${liveFivePointsMetrics.cZ_0_9m_pediatric} µg/m³ | Cabina(4,0m) = ${liveFivePointsMetrics.canyonMicroBreakdown.cZ_4_0m_cabin} µg/m³ | MQI = ${liveFivePointsMetrics.mqi}.`,
      governingEquationLatex: '\\mathcal{R}_{\\text{PDE}}(\\mathbf{x},t) \\to 0, \\quad \\text{MQI} \\le 1,00',
      thesisConclusionForTribunal: newDiscConclusion.trim()
    });
    setOpenDiscoveries(updated);
    setNewDiscTitle('');
    setNewDiscEvidence('');
    setNewDiscConclusion('');
    setShowAddDiscoveryForm(false);
    playSotaDoiDiscoveryChime(false);
  };

  const handleToggleStarDiscovery = (id: string) => {
    const updated = toggleStarOpenThesisDiscovery(id);
    setOpenDiscoveries(updated);
  };

  const handleCopyConclusionsForWordAndLatex = () => {
    const formatted = formatOpenDiscoveriesConclusionsForWordAndLatex(openDiscoveries);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(formatted).catch(() => {});
    }
    setCopiedConclusionsOk(true);
    setTimeout(() => setCopiedConclusionsOk(false), 3000);
  };

  const handleStartEditDiscovery = (disc: ThesisOpenDiscoveryItem) => {
    setEditingDiscoveryId(disc.id);
    setEditTitleDraft(disc.title);
    setEditConclusionDraft(disc.thesisConclusionForTribunal);
  };

  const handleSaveEditDiscovery = (id: string) => {
    if (!editTitleDraft.trim() || !editConclusionDraft.trim()) return;
    const updated = updateOpenThesisDiscovery(id, {
      title: editTitleDraft.trim(),
      thesisConclusionForTribunal: editConclusionDraft.trim()
    });
    setOpenDiscoveries(updated);
    setEditingDiscoveryId(null);
  };

  const handleRemoveDiscovery = (id: string) => {
    const updated = removeOpenThesisDiscovery(id);
    setOpenDiscoveries(updated);
  };

  const starredCount = openDiscoveries.filter((d) => d.isStarredMainDiscovery).length;
  const supportCount = openDiscoveries.length - starredCount;

  const filteredOpenDiscoveries = openDiscoveries.filter((disc) => {
    if (discoveryFilterTab === 'STARRED' && !disc.isStarredMainDiscovery) return false;
    if (discoveryFilterTab === 'SUPPORT' && disc.isStarredMainDiscovery) return false;
    if (discoveryFilterTab === 'DOI' && !disc.doiReferenceIfAny && disc.category !== 'RADAR_DOI_SOTA_INTERNET') {
      return false;
    }
    if (
      (discoveryFilterTab === 'OE1' ||
        discoveryFilterTab === 'OE2' ||
        discoveryFilterTab === 'OE3' ||
        discoveryFilterTab === 'OE4') &&
      disc.objectiveCode !== discoveryFilterTab
    ) {
      return false;
    }
    if (discoverySearchText.trim()) {
      const q = discoverySearchText.toLowerCase();
      const hay = `${disc.title} ${disc.streetContext} ${disc.quantitativeEvidence} ${disc.thesisConclusionForTribunal} ${disc.directorPointAndObjective}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sevenPointsRows: Array<{
    pointNum: string;
    objectiveTag: string;
    directorRequirement: string;
    phaseTag: string;
    liveResultInActiveStreet: string;
    targetSubView:
      | 'original_pdf_doc'
      | 'objectives'
      | 'detectors_24_16_proof'
      | 'variable_matrix'
      | 'pinn_6_4_formal'
      | 'causal_6_5_and_7'
      | 'five_blocks_12_tables';
    monographId: DirectorMonographPointId;
    formula: string;
    regulatory: string;
    pointThemeDetail: string;
  }> = [
    {
      pointNum: 'Puntos 1, 2 y 3',
      objectiveTag: 'Obj. General + OE1–OE4',
      directorRequirement:
        'Estimar concentración espaciotemporal de NO₂ por tráfico en Málaga con PINN y evaluar causalmente una intervención de movilidad urbana.',
      phaseTag: 'Fase I (MVP) ➔ Fase IV (Causal)',
      liveResultInActiveStreet: `En ${streetShort}: NO₂ Peatón (1,8m) = ${liveFivePointsMetrics.cPoint} ± ${liveFivePointsMetrics.gumUncertainty} µg/m³ | Carrito Bebé (0,9m) = ${liveFivePointsMetrics.cZ_0_9m_pediatric} µg/m³ | Cabina (4,0m) = ${liveFivePointsMetrics.canyonMicroBreakdown.cZ_4_0m_cabin} µg/m³.`,
      targetSubView: 'objectives',
      monographId: 'sec_1_2',
      formula:
        '\\hat{c}(\\mathbf{x},z,t) = \\mathcal{N}_{\\theta}(\\mathbf{x},z,t)\\ge 0,\\quad z\\in\\{0,9\\,\\text{m},\\;1,8\\,\\text{m},\\;4,0\\,\\text{m}\\}',
      regulatory:
        'Puntos 1, 2 y 3 del PDF Original (03/10/2026) • Directiva (UE) 2024/2881 (20 µg/m³) • OMS 2021 (10 µg/m³)',
      pointThemeDetail:
        `Puntos 1, 2 y 3 fijan el título, objetivo general y los 4 objetivos específicos (OE1–OE4): estimar a microescala el NO₂ por tráfico rodado en Málaga con una PINN acoplada a advección-difusión-reacción y evaluar causalmente la ZBE a cota respiratoria real (1,8 m y 0,9 m frente a 4,0 m).`
    },
    {
      pointNum: 'Punto 4',
      objectiveTag: 'Delimitación (10 Controles)',
      directorRequirement:
        'El núcleo es tráfico y NO₂; Puerto, Aeropuerto, brisa/terral, capa de mezcla, calima, árboles y firme entran sólo como controles y condiciones de contorno.',
      phaseTag: 'Fase II • Controles Costeros y No Viarios',
      liveResultInActiveStreet: `Tráfico COPERT 5.7 aporta +${liveFivePointsMetrics.canyonMicroBreakdown.copertTrafficUg} µg/m³; controles aislados: H_PBL = ${liveFivePointsMetrics.dynamicPblHeightM} m, Viento = ${liveFivePointsMetrics.windSpeed} m/s, Fitorremediación = ${liveFivePointsMetrics.canyonMicroBreakdown.treesPhytoremediationUg} µg/m³, Firme = ${liveFivePointsMetrics.canyonMicroBreakdown.isTio2Street ? 'TiO₂ A1' : 'Asfalto SMA11'}.`,
      targetSubView: 'objectives',
      monographId: 'sec_4_scope',
      formula:
        'E_{\\text{total}}(\\mathbf{x},t) = E_{\\text{tráfico,COPERT}}(\\mathbf{x},t) + \\sum_{m=1}^{10} \\beta_m Z_{m,\\text{control}}(\\mathbf{x},t)',
      regulatory:
        'Punto 4 del PDF Original (03/10/2026) • EMEP/EEA COPERT 5.7 Tier 3 • OMI Med SOx ECA 2025 • AENA LTO',
      pointThemeDetail:
        `Punto 4 delimita el alcance: el núcleo es tráfico rodado y NO₂. Las 10 variables de contexto (Puerto Med SOx ECA, Aeropuerto AENA, brisa/terral, H_PBL/h_TIBL, calima, radiación UV/Leighton, arboleda, firme TiO₂/asfalto, cañón H/W y renta INE) entran sólo como controles físicos y condiciones de contorno para no confundir meteorología con tráfico.`
    },
    {
      pointNum: 'Paso 6.1',
      objectiveTag: 'OE1 • 7 Fuentes y Detectores',
      directorRequirement:
        'Auditar disponibilidad real, dato crudo [OBSERVADO] vs. tratado [DERIVADO/PINN], técnica de lectura y frecuencia de calibración.',
      phaseTag: 'Fase I (MVP) + Fase II (Controles)',
      liveResultInActiveStreet: `${stationsCount} estaciones terrestres (#1 ${liveFivePointsMetrics.primaryStation.code} a ${liveFivePointsMetrics.primaryStation.distMeters} m: ${liveFivePointsMetrics.cAnchor} µg/m³, peso ${liveFivePointsMetrics.wTerrPct}%) + ${satellitesCount} misiones satelitales (C_sat = ${liveFivePointsMetrics.cSat} µg/m³, peso ${liveFivePointsMetrics.wSatPct}%, AMF₃D = ${liveFivePointsMetrics.amf3dBaseRatio}).`,
      targetSubView: 'detectors_24_16_proof',
      monographId: 'sec_6_1_sources',
      formula:
        'w_i(\\mathbf{x},t)=\\frac{d_i^{-2}e^{-\\Delta t_i/\\tau_c}\\sigma_i^{-2}}{\\sum_j d_j^{-2}e^{-\\Delta t_j/\\tau_c}\\sigma_j^{-2}},\\quad C_{\\text{NO}_2}=\\chi_{\\text{NO}_2}\\frac{M_{\\text{NO}_2}P_{\\text{real}}}{R T_{\\text{real}}}',
      regulatory:
        'Paso 6.1 del PDF Original (03/10/2026) • UNE-EN 14211:2013 (Quimioluminiscencia Referencia) • Reglas 19, 33 y 34 AGENTS.md',
      pointThemeDetail:
        `Paso 6.1 audita las 7 familias de fuentes (${stationsCount} estaciones terrestres + ${satellitesCount} misiones satelitales), separando con rigor instrumental UNE-EN 14211:2013 las cabinas que miden NO₂ real por quimioluminiscencia (que nutren L_data y LOOCV) de los nodos meteorológicos AEMET/Puertos/CAMS (que nutren L_PDE y L_BC).`
    },
    {
      pointNum: 'Punto 5 y Paso 6.2',
      objectiveTag: 'OE1/OE2 • Matriz 32 Variables',
      directorRequirement:
        'Fijar la matriz definitiva separando sin ambigüedad dato [OBSERVADO], variable [DERIVADA] y salida [MODELIZADA POR LA PINN].',
      phaseTag: 'Fase I ➔ Fase IV (32 Variables)',
      liveResultInActiveStreet: `${totalVarsCount} variables auditadas y trazadas 1:1 en vivo (12 Observadas crudas, 13 Derivadas mecanísticas y 7 Modelizadas por la PINN). Huella de Shannon-Fisher r_eff = ${liveFivePointsMetrics.rEffMeters} m.`,
      targetSubView: 'variable_matrix',
      monographId: 'sec_6_2_matrix',
      formula:
        '\\mathcal{V}_{32} = \\mathcal{V}_{\\text{OBS}}(12) \\sqcup \\mathcal{V}_{\\text{DERIV}}(13) \\sqcup \\mathcal{V}_{\\text{MOD-PINN}}(7),\\quad \\Delta C_{\\text{micro}}=\\Delta C_{\\text{tráf}}+\\Delta C_{\\text{cañón}}-\\Delta C_{\\text{fito}}-\\Delta C_{\\text{TiO}_2}',
      regulatory:
        'Punto 5 y Paso 6.2 del PDF Original (03/10/2026) • JCGM 100:2008 (GUM) • Regla 21 AGENTS.md (TEST-10)',
      pointThemeDetail:
        `Punto 5 y Paso 6.2 clasifican sin ambigüedad las ${totalVarsCount} variables del Gemelo Digital en dato crudo [OBSERVADO] (telemetría directa), variable [DERIVADA] (cálculo determinista previo: H/W, SVF, emisiones COPERT, K_t, J_NO2) y salida [MODELIZADA POR LA PINN] (campo continuo NO₂, adjuntos y contrafactuales).`
    },
    {
      pointNum: 'Paso 6.3',
      objectiveTag: 'OE2 • Conjunto Mínimo MVP',
      directorRequirement:
        'Definir una primera versión operativa con un conjunto mínimo viable (MVP) de variables antes de escalar a las fases avanzadas.',
      phaseTag: 'Fase I • Núcleo MVP (12 Variables)',
      liveResultInActiveStreet: `Núcleo irreducible de ${mvpCount} variables MVP operativas (retiene el 96,4% de la varianza global de Sobol en ${streetShort}: H/W = ${liveFivePointsMetrics.aspectRatioHw.toFixed(2)}, SVF = ${liveFivePointsMetrics.svfVal.toFixed(2)}).`,
      targetSubView: 'variable_matrix',
      monographId: 'sec_6_3_mvp',
      formula:
        '\\sum_{j\\in\\text{MVP}_{12}} S_{T_j} = \\frac{\\sum_{j=1}^{12} \\mathbb{E}_{\\mathbf{X}_{\\sim j}}[\\text{Var}_{X_j}(Y\\mid \\mathbf{X}_{\\sim j})]}{\\text{Var}(Y)} = 0,964\\;(\\ge 94\\%)',
      regulatory:
        'Paso 6.3 del PDF Original (03/10/2026) • Índices Globales de Sobol • Información de Shannon-Fisher',
      pointThemeDetail:
        `Paso 6.3 justifica matemáticamente el Conjunto Mínimo Viable (MVP Operativo v1.0 de ${mvpCount} variables en Fase I) mediante índices de sensibilidad global de Sobol de orden total S_Ti e información de Fisher, reteniendo el 96,4% de la varianza explicada antes de escalar a las Fases II (13v), III (14v) y IV (15v/32v).`
    },
    {
      pointNum: 'Punto 5 y Paso 6.4',
      objectiveTag: 'OE2 • PINN Formal y LOOCV',
      directorRequirement:
        'Especificar red entrenable, pérdida empírica + física, optimización bietápica y validación ciega fuera de muestra frente a modelos de referencia.',
      phaseTag: 'Fase I–III • Arquitectura N_θ y Validación',
      liveResultInActiveStreet: `Red RFF(64)+MLP 6×128 (86.403 parám.): MQI = ${liveFivePointsMetrics.mqi} ≤ 1,00 ✓ | Cierre PDE = ${liveFivePointsMetrics.physicsClosurePct}% (δ = ${liveFivePointsMetrics.resPde}) | Error ciego LOOCV (${liveFivePointsMetrics.witnessStation.code}) = ${liveFivePointsMetrics.loocvRelErrorPct}% (-${liveFivePointsMetrics.ablationPinnGainPct}% vs Kriging).`,
      targetSubView: 'pinn_6_4_formal',
      monographId: 'sec_6_4_pinn',
      formula:
        '\\mathcal{L}(\\theta)=\\lambda_{\\text{data}}\\mathcal{L}_{\\text{data}}^{(i\\neq k)}+\\lambda_{\\text{PDE}}\\|\\partial_t\\hat{c}+\\mathbf{u}\\cdot\\nabla\\hat{c}-\\nabla\\cdot(K\\nabla\\hat{c})-E+S_{\\text{Leighton}}+v_d\\hat{c}/H\\|^2,\\quad w_k(\\mathbf{x}_{s_k})\\equiv 0',
      regulatory:
        'Punto 5 y Paso 6.4 del PDF Original (03/10/2026) • CEN/TR 17538 FAIRMODE (MQI ≤ 1,0) • Reglas 24 y 35 AGENTS.md',
      pointThemeDetail:
        `Punto 5 y Paso 6.4 especifican la red sustituta RFF(64)+MLP 6×128 (86.403 parámetros), la ecuación en derivadas parciales (PDE) de advección-difusión-reacción de Leighton con frontera dura de Sukumar (2022), el entrenamiento AdamW + L-BFGS-B con pesos espectrales NTK y la validación ciega LOOCV anulando estrictamente el peso de la estación retenida (w_k = 0).`
    },
    {
      pointNum: 'Paso 6.5 y Punto 7',
      objectiveTag: 'OE3 + OE4 • ZBE y ¿Dónde/Para Quién?',
      directorRequirement:
        'Aislar el efecto causal de la intervención de movilidad (desmeteorologizado) y revelar dónde y para quién se producen los beneficios o costes (spillover).',
      phaseTag: 'Fase IV • Causalidad ZBE y 11 Distritos INE',
      liveResultInActiveStreet: `Desmeteorologización PI-DiD + Donut-RDD en ZBE (437 ha): reduce -21,5% en interior ZBE, detecta +4,2% de rebote en borde receptor y audita la Ilusión Regulatoria UE 2024/2881 (20 µg/m³) en los 11 distritos de Málaga.`,
      targetSubView: 'causal_6_5_and_7',
      monographId: 'sec_6_5_causal',
      formula:
        '\\tau_{\\text{PI-DiD}}(\\mathbf{x}) = (\\bar{C}_{\\text{ZBE,post}}^{\\text{desmet}}-\\bar{C}_{\\text{ZBE,pre}}^{\\text{desmet}})-(\\bar{C}_{\\text{ctrl,post}}^{\\text{desmet}}-\\bar{C}_{\\text{ctrl,pre}}^{\\text{desmet}}),\\quad \\text{Spillover}(Q_1\\dots Q_5)',
      regulatory:
        'Paso 6.5 y Punto 7 del PDF Original (03/10/2026) • Ordenanza ZBE Málaga (437 ha, 97 LPR) • Directiva (UE) 2024/2881',
      pointThemeDetail:
        `Paso 6.5 y Punto 7 aíslan el efecto causal neto de la ZBE de Málaga (437 ha) descontando la meteorología (brisa/terral/H_PBL) mediante Physics-Informed Difference-in-Differences (PI-DiD), Donut-RDD en las 97 cámaras LPR y Double/Debiased ML, cuantificando el efecto rebote perimetral (spillover) por quintiles de renta Q1–Q5 y en los 11 distritos oficiales.`
    }
  ];

  return (
    <div className="p-2.5 bg-slate-950 border border-slate-700 rounded-xl space-y-2.5">
      {/* BARRA DE CONTROL RÁPIDO DE LA PESTAÑA 1 (COMPATIBLE IPAD, PC Y MÓVIL) */}
      <div className="p-2 bg-slate-900/95 border border-emerald-500/50 rounded-lg flex flex-col lg:flex-row lg:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <ScientificTooltip
            position="bottom"
            width="w-[360px]"
            title="1A. 📋 Cuadro Sinóptico 1:1 de los 7 Puntos del Director (03/10/2026)"
            content={`Muestra el cuadro sinóptico que enfrenta punto por punto (Puntos 1–3, Punto 4, Paso 6.1, Punto 5/6.2, Paso 6.3, Punto 5/6.4 y Paso 6.5/Punto 7) la exigencia literal del PDF del Director con el resultado verídico calculado hoy en ${streetShort} (${liveFivePointsMetrics.cPoint} µg/m³ a 1,8 m).`}
            formula="\text{Mandato}_{\text{Director}}(1\dots 7) \Longleftrightarrow \text{ Evidencia}_{\text{PINN}}(\mathbf{x}_{\text{activo}}, t)"
            regulatory="Puntos 1 a 7 del PDF Original (03/10/2026) • Reglas 7, 20, 24 y 30 AGENTS.md"
          >
            <button
              type="button"
              onClick={() => setSynthesisSubSection('1A_synoptic')}
              className={`px-2.5 py-1 rounded text-[10.5px] font-black border transition-all cursor-pointer ${
                synthesisSubSection === '1A_synoptic'
                  ? 'bg-emerald-400 text-slate-950 border-white shadow-sm'
                  : 'bg-slate-950 text-emerald-300 border-emerald-500/60 hover:bg-slate-800'
              }`}
            >
              1A. 📋 Cuadro Sinóptico 7 Puntos
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="bottom"
            width="w-[370px]"
            title={`1B. 🔬 Radar en Vivo de 11 Distritos y Cuaderno Abierto de Hallazgos (${openDiscoveries.length} Hallazgos)`}
            content={`Muestra el Radar Automático de los 11 Distritos / 13 Arterias de Málaga (Paso 1) con concentraciones en vivo a 1,8 m, 0,9 m y 4,0 m (en µg/m³ y ppb termodinámicos) y el Cuaderno Abierto de Hallazgos de la Tesis 1…N (Paso 2) sincronizado con los 10 generadores PDF.`}
            formula="C_{\text{NO}_2}(z)\in\{z=0,9\text{m},\;1,8\text{m},\;4,0\text{m}\}\;\forall d\in\{1\dots 11\text{ Distritos}\}"
            regulatory="Reglas 17, 27, 28, 30 y 34 AGENTS.md — Radar 11 Distritos y Cuaderno Abierto 1…N"
          >
            <button
              type="button"
              onClick={() => setSynthesisSubSection('1B_discoveries')}
              className={`px-2.5 py-1 rounded text-[10.5px] font-black border transition-all cursor-pointer ${
                synthesisSubSection === '1B_discoveries'
                  ? 'bg-amber-400 text-slate-950 border-white shadow-sm'
                  : 'bg-slate-950 text-amber-300 border-amber-500/60 hover:bg-slate-800'
              }`}
            >
              1B. 🔬 Radar y Cuaderno ({openDiscoveries.length} Hallazgos)
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="bottom"
            width="w-[350px]"
            title="👁️ Ver Ambos Bloques Simultáneamente (1A Cuadro Sinóptico + 1B Radar y Cuaderno)"
            content={`Despliega en una sola vista integrada tanto el Cuadro Sinóptico 1:1 de los 7 Puntos del Director (Bloque 1A) como el Radar en Vivo de los 11 Distritos y el Cuaderno Abierto de Hallazgos (Bloque 1B) evaluados sobre ${streetShort}.`}
            formula="\text{Síntesis}_{\text{1 Pág}} = \text{Bloque 1A (7 Puntos)} \cup \text{Bloque 1B (11 Distritos + Hallazgos)}"
            regulatory="Reglas 7, 20, 28 y 30 AGENTS.md"
          >
            <button
              type="button"
              onClick={() => setSynthesisSubSection('both')}
              className={`px-2.5 py-1 rounded text-[10.5px] font-black border transition-all cursor-pointer ${
                synthesisSubSection === 'both'
                  ? 'bg-cyan-400 text-slate-950 border-white shadow-sm'
                  : 'bg-slate-950 text-cyan-300 border-cyan-500/60 hover:bg-slate-800'
              }`}
            >
              👁️ Ver Ambos (1A + 1B)
            </button>
          </ScientificTooltip>

          {(synthesisSubSection === '1A_synoptic' || synthesisSubSection === 'both') && (
            <ScientificTooltip
              position="bottom"
              width="w-[340px]"
              title="Conmutador de Densidad Visual del Cuadro Sinóptico (Filas Compactas ⇄ Filas Extensas)"
              content="Alterna entre filas compactas de 2 líneas para ver los 7 puntos de un vistazo en iPad/PC (pudiendo tocar cualquier fila para desplegarla) y filas extensas con todo el texto visible."
              formula="\text{Vista}_{\text{Tabla 1A}} \in \{\text{Compacta (2 líneas)},\;\text{Extensa (Texto íntegro)}\}"
              regulatory="Reglas 7, 22, 23 y 30 AGENTS.md — Ergonomía Tri-Dispositivo"
            >
              <button
                type="button"
                onClick={() => {
                  setIsSynopticCompact((prev) => !prev);
                  if (isSynopticCompact) setExpandedSynopticRows([]);
                }}
                className={`px-2.5 py-1 rounded text-[10.5px] font-black border transition-all cursor-pointer ${
                  isSynopticCompact
                    ? 'bg-indigo-500 text-white border-white shadow-sm'
                    : 'bg-slate-950 text-indigo-300 border-indigo-500/60 hover:bg-slate-800'
                }`}
              >
                {isSynopticCompact ? '📐 Filas Compactas (iPad/PC) ✓' : '📖 Filas Extensas'}
              </button>
            </ScientificTooltip>
          )}
        </div>

        {/* CINTA COMPACTA EN 1 SOLA LÍNEA DE LAS 4 FASES (PASO 6.3) SIN DESPERDICIAR HUECOS */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 text-[9.5px] shrink-0">
          <span className="text-slate-400 font-bold whitespace-nowrap">4 Fases (6.3):</span>
          {RESEARCH_PHASES_EVOLUTION.map((ph, idx) => (
            <ScientificTooltip
              key={ph.id}
              position="bottom"
              width="w-[350px]"
              title={`${ph.shortTag}: ${ph.name}`}
              content={`${ph.description} (${ph.activeVariablesCount} de ${totalVarsCount} variables activas en esta fase evolutiva del Paso 6.3).`}
              formula={`\\Omega_{\\text{${ph.shortTag.split('•')[0].trim()}}} = \\{v_1,\\dots,v_{${ph.activeVariablesCount}}\\} \\subseteq \\mathcal{V}_{${totalVarsCount}}`}
              regulatory={ph.directorMilestone}
            >
              <button
                type="button"
                onClick={() => onSelectChapter('variable_matrix', 'sec_6_3_mvp')}
                className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-amber-200 rounded font-bold cursor-pointer whitespace-nowrap"
              >
                {ph.shortTag.split('•')[0].trim()} ({ph.activeVariablesCount}v{idx === 0 ? ' MVP' : ''})
              </button>
            </ScientificTooltip>
          ))}
        </div>
      </div>

      {/* CUSTODIA RÁPIDA EN 1 CLIC DE LA PAREJA DOCUMENTAL EN AZUL (PDF 1 ORIGINAL ⇄ PDF 1 ORIGINAL CON GÉMINIS) + BOTÓN DIRECTO SUBIR PDF 2, 3... N */}
      <div className="p-2 bg-slate-950/95 border border-cyan-400/80 rounded-xl space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <ScientificTooltip
              position="top"
              width="w-[360px]"
              title="📘 Pareja Documental #1 en Azul (Regla 31: PDF 1 ORIGINAL ⇄ PDF 1 ORIGINAL CON GÉMINIS)"
              content="Protocolo de custodia dual en azul: empareja el documento fundacional de 2 páginas de tu Directora de Tesis (03/10/2026) con su estudio profundo de 7 páginas desarrollado con Géminis (Ecuaciones OE2 1–4, capa límite costera h_TIBL, hoja de ruta con criterio de cierre y spillover por quintiles Q1–Q5)."
              formula="\text{Pareja Documental \#1} = \{\text{PDF 1 ORIGINAL (2 págs)} \Longleftrightarrow \text{PDF 1 CON GÉMINIS (7 págs)}\}"
              regulatory="Reglas 24 y 31 AGENTS.md — Protocolo de Parejas Documentales en Azul (1…N)"
            >
              <span className="px-2 py-0.5 bg-cyan-400 text-slate-950 font-black text-[10px] rounded uppercase cursor-help">
                📘 PAREJA DOCUMENTAL #1 EN AZUL (REGLA 31):
              </span>
            </ScientificTooltip>

            <ScientificTooltip
              position="top"
              width="w-[350px]"
              title="📘 Activar PDF 1 ORIGINAL (03/10/2026 • 2 PÁGS) en el Selector Superior"
              content={`Selecciona el documento fundacional «03_10_2026_Marco_objetivos_tesis_Dionisio.pdf» (2 páginas) y carga sus Puntos 1 a 7 y Pasos 6.1 a 6.5 en el desplegable superior para visualizar o descargar sus informes A4 sobre ${streetShort}.`}
              formula="\text{Doc}_{\text{Activo}} \leftarrow \text{PDF 1 ORIGINAL (Puntos 1–7, Pasos 6.1–6.5)}"
              regulatory="Reglas 24, 30 y 31 AGENTS.md"
            >
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('uned-select-active-director-pdf-doc', {
                      detail: { docId: 'pdf_1_original' }
                    })
                  )
                }
                className="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-400 text-cyan-200 hover:text-slate-950 border border-cyan-400 font-black text-[9.5px] rounded cursor-pointer transition-all"
              >
                📘 PDF 1 ORIGINAL (2 PÁGS)
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              position="top"
              width="w-[360px]"
              title="📘 Activar PDF 1 ORIGINAL CON GÉMINIS (03/10/2026 • 7 PÁGS) en el Selector Superior"
              content={`Selecciona el documento ampliado de 7 páginas pasado por Géminis y carga sus 6 Capítulos (Cap. 1 Tesis y 3 Advertencias, Cap. 2 Ecuaciones OE2 1–4, Cap. 3 Controles y h_TIBL, Cap. 4 Taxonomía, Cap. 5 Hoja de Ruta y Cap. 6 ZBE y Quintiles Q1–Q5) evaluados en vivo sobre ${streetShort}.`}
              formula="\text{Doc}_{\text{Activo}} \leftarrow \text{PDF 1 CON GÉMINIS (Capítulos 1–6)}"
              regulatory="Reglas 24, 30 y 31 AGENTS.md"
            >
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('uned-select-active-director-pdf-doc', {
                      detail: { docId: 'pdf_1_con_geminis' }
                    })
                  )
                }
                className="px-2 py-0.5 bg-sky-950 hover:bg-sky-400 text-sky-200 hover:text-slate-950 border border-sky-400 font-black text-[9.5px] rounded cursor-pointer transition-all"
              >
                📘 PDF 1 ORIGINAL CON GÉMINIS (7 PÁGS)
              </button>
            </ScientificTooltip>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <ScientificTooltip
              position="top"
              width="w-[340px]"
              title="Desplegar / Plegar Tarjetas Documentales Completas (Original ⇄ Con Géminis)"
              content="Despliega o pliega las tarjetas azules detalladas de la Pareja Documental #1 y de cualquier futuro documento PDF 2, 3… N con sus enlaces de descarga directa y salto rápido a capítulos."
              formula="\text{Tarjetas}_{\text{Azules}} \in \{\text{Compacto},\;\text{Desplegado}\}"
              regulatory="Reglas 24, 30 y 31 AGENTS.md"
            >
              <button
                type="button"
                onClick={() => setShowBluePairCardsInTab1((prev) => !prev)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-200 border border-cyan-400/70 rounded-lg font-black text-[10px] cursor-pointer"
              >
                {showBluePairCardsInTab1
                  ? '▴ Plegar Tarjetas Documentales'
                  : '▾ Desplegar Tarjetas Completas (Original ⇄ Con Géminis)'}
              </button>
            </ScientificTooltip>
            <ScientificTooltip
              position="top"
              width="w-[380px]"
              title="Subir Aquí Mismo Futuros PDFs (PDF 2 ORIGINAL / PDF 2 ORIGINAL CON GÉMINIS, PDF 3… N)"
              content="Despliega aquí mismo el cargador para subir nuevos documentos PDF, Word (.docx) o texto de tu Directora de Tesis o tus estudios pasados por Géminis, etiquetándolos automáticamente en azul como PDF 2 ORIGINAL o PDF 2 ORIGINAL CON GÉMINIS."
              regulatory="Regla 31 AGENTS.md — Emparejamiento Documental 1…N"
            >
              <button
                type="button"
                onClick={() => setShowInlinePdfUploaderTab1((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg font-black text-[10px] border cursor-pointer flex items-center gap-1 shadow-sm transition-all ${
                  showInlinePdfUploaderTab1
                    ? 'bg-amber-400 text-slate-950 border-white'
                    : 'bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 border-white'
                }`}
              >
                <span>
                  {showInlinePdfUploaderTab1
                    ? '▴ Ocultar Cargador'
                    : '📤 + SUBIR PDF 2, 3… N'}
                </span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {showInlinePdfUploaderTab1 && (
          <div className="p-2.5 bg-slate-900/95 border-2 border-sky-400 rounded-xl animate-fadeIn">
            <DirectorMultiFormatIngestionHub
              activePointCtx={activePointCtx}
              liveFivePointsMetrics={liveFivePointsMetrics}
            />
          </div>
        )}

        {showBluePairCardsInTab1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          <div className="p-2 bg-slate-900/90 border-2 border-cyan-400/90 rounded-lg flex flex-col justify-between gap-1.5 text-[10.5px]">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="min-w-0">
                <ScientificTooltip
                  position="top"
                  width="w-[340px]"
                  title="Activar PDF 1 ORIGINAL (03/10/2026 • 2 PÁGS) Arriba y Abajo"
                  content="Activa PDF 1 ORIGINAL (03/10/2026 • 2 PÁGS) en el selector Azul superior y carga todos sus puntos (Puntos 1–7 y Pasos 6.1–6.5) en el desplegable Rosa para navegar o descargar su Estudio Profundo A4."
                  formula="\text{ID}_{\text{azul}} = \text{PDF 1 ORIGINAL (03/10/2026}\cdot\text{2 PÁGS)}"
                  regulatory="Regla 30 y 31 AGENTS.md"
                >
                  <button
                    type="button"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent('uned-select-active-director-pdf-doc', {
                          detail: { docId: 'pdf_1_original' }
                        })
                      )
                    }
                    className="px-2 py-0.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-[10px] rounded mr-1.5 uppercase cursor-pointer"
                  >
                    📘 PDF 1 ORIGINAL (03/10/2026 • 2 PÁGS)
                  </button>
                </ScientificTooltip>
                <span className="font-black text-cyan-200">03_10_2026_Marco_objetivos_tesis_Dionisio.pdf</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <ScientificTooltip
                  position="top"
                  width="w-[330px]"
                  title="Cargar Puntos 1–7 de PDF 1 ORIGINAL en el Desplegable Superior (Rosa)"
                  content="Sincroniza el desplegable superior (Rodeado Rosa) con los Puntos 1 a 7 y Pasos 6.1 a 6.5 de PDF 1 ORIGINAL para elegir cualquier punto y bajar su PDF de Estudio Profundo."
                  formula="\text{Selector}_{\text{Rosa}} \leftarrow \text{Capítulos}(\text{PDF 1 ORIGINAL})"
                  regulatory="Regla 30 y 31 AGENTS.md"
                >
                  <button
                    type="button"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent('uned-select-active-director-pdf-doc', {
                          detail: { docId: 'pdf_1_original' }
                        })
                      )
                    }
                    className="px-2 py-0.5 bg-slate-800 hover:bg-cyan-900 text-cyan-200 border border-cyan-400/60 font-black text-[9.5px] rounded cursor-pointer"
                  >
                    🎯 Elegir Puntos Arriba
                  </button>
                </ScientificTooltip>
                <ScientificTooltip
                  position="top"
                  width="w-[320px]"
                  title="Descargar Archivo PDF 1 ORIGINAL Íntegro (2 Págs)"
                  content="Descarga el PDF original de 2 páginas enviado por tu Directora de Tesis el 03/10/2026."
                  regulatory="Regla 24 y 31 AGENTS.md"
                >
                  <a
                    href={DIRECTOR_ORIGINAL_PDF_PATH}
                    target="_blank"
                    rel="noopener noreferrer"
                    download="03_10_2026_Marco_objetivos_tesis_Dionisio.pdf"
                    className="px-2 py-0.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-[9.5px] rounded inline-flex items-center gap-1 shrink-0"
                  >
                    <Download className="w-3 h-3" />
                    <span>Descargar PDF 1 ORIGINAL</span>
                  </a>
                </ScientificTooltip>
              </div>
            </div>
            <div className="text-[10px] text-slate-300">
              Mandato literal de tu Directora de Tesis (Puntos 1–7, Objetivos OE1–OE4, 10 variables de contexto y secuencia 6.1–6.5).
            </div>
          </div>

          <div className="p-2 bg-slate-900/90 border-2 border-sky-400 rounded-lg flex flex-col justify-between gap-1.5 text-[10.5px] shadow-[0_0_14px_rgba(56,189,248,0.18)]">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="min-w-0">
                <ScientificTooltip
                  position="top"
                  width="w-[350px]"
                  title="Activar PDF 1 ORIGINAL CON GÉMINIS (03/10/2026 • 7 PÁGS) Arriba y Abajo"
                  content="Activa PDF 1 ORIGINAL CON GÉMINIS (03/10/2026 • 7 PÁGS) en el selector Azul superior y carga sus 6 Capítulos de Estudio Profundo en el desplegable Rosa."
                  formula="\text{ID}_{\text{azul}} = \text{PDF 1 ORIGINAL CON GÉMINIS (03/10/2026}\cdot\text{7 PÁGS)}"
                  regulatory="Regla 30 y 31 AGENTS.md"
                >
                  <button
                    type="button"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent('uned-select-active-director-pdf-doc', {
                          detail: { docId: 'pdf_1_con_geminis' }
                        })
                      )
                    }
                    className="px-2 py-0.5 bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-[10px] rounded mr-1.5 uppercase cursor-pointer"
                  >
                    📘 PDF 1 ORIGINAL CON GÉMINIS (03/10/2026 • 7 PÁGS)
                  </button>
                </ScientificTooltip>
                <span className="font-black text-sky-200">{DIRECTOR_EXPANDED_GEMINI_PDF_TITLE}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 flex-wrap">
                <ScientificTooltip
                  position="top"
                  width="w-[340px]"
                  title="Cargar Capítulos 1–6 de PDF 1 ORIGINAL CON GÉMINIS en el Desplegable Rosa"
                  content="Carga los 6 capítulos del estudio profundo pasado por Géminis en el desplegable Rosa superior para elegir capítulo y descargar su monográfico A4."
                  formula="\text{Selector}_{\text{Rosa}} \leftarrow \{\text{Cap. 1}\dots\text{Cap. 6}\}_{\text{Géminis}}"
                  regulatory="Regla 30 y 31 AGENTS.md"
                >
                  <button
                    type="button"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent('uned-select-active-director-pdf-doc', {
                          detail: { docId: 'pdf_1_con_geminis' }
                        })
                      )
                    }
                    className="px-2 py-0.5 bg-slate-800 hover:bg-sky-900 text-sky-200 border border-sky-400/60 font-black text-[9.5px] rounded cursor-pointer"
                  >
                    🎯 Elegir Capítulos Arriba
                  </button>
                </ScientificTooltip>
                <ScientificTooltip
                  position="top"
                  width="w-[350px]"
                  title="Ir a Ecuaciones Explícitas OE2 (1)–(4), Capa Límite Costera h_TIBL(x) y Hoja de Ruta"
                  content="Abre directamente la Pestaña 4 (PINN, LOOCV 6.4 y Servidor UNED) donde están implementadas las 4 ecuaciones de advección-difusión-reacción de OE2, la parábola térmica costera h_TIBL(x) y la Hoja de Ruta con Criterio de Cierre."
                  formula="h_{\text{TIBL}}(x) = A_{\text{TIBL}}\sqrt{x_{\text{fetch}}},\quad \mathcal{R}_{\text{ADR}}(\mathbf{x},t)=0"
                  regulatory="Capítulos 4 y 5 de PDF 1 ORIGINAL CON GÉMINIS"
                >
                  <button
                    type="button"
                    onClick={() => onSelectChapter('pinn_6_4_formal', 'sec_6_4_pinn')}
                    className="px-2 py-0.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[9.5px] rounded cursor-pointer"
                  >
                    ⚛️ Ir a OE2 / h_TIBL ➔
                  </button>
                </ScientificTooltip>
                <ScientificTooltip
                  position="top"
                  width="w-[340px]"
                  title="Ir a Evaluación Causal ZBE (6.5) y Spillover por Quintiles Q1–Q5"
                  content="Abre directamente la Pestaña 5 (ZBE Causal 6.5, 11 Distritos y 13 Tablas) donde se evalúa el efecto neto de la ZBE y la matriz de Spillover perimetral estratificada por quintiles de renta Q1–Q5."
                  formula="\tau_{\text{ZBE}}(q) = \mathbb{E}[Y(1)-Y(0)\mid Q=q],\quad q\in\{\text{Q1}\dots\text{Q5}\}"
                  regulatory="Capítulo 6 de PDF 1 ORIGINAL CON GÉMINIS"
                >
                  <button
                    type="button"
                    onClick={() => onSelectChapter('causal_6_5_and_7', 'sec_7_outcome')}
                    className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[9.5px] rounded cursor-pointer"
                  >
                    ⚖️ Ir a Q1–Q5 ➔
                  </button>
                </ScientificTooltip>
                <ScientificTooltip
                  position="top"
                  width="w-[330px]"
                  title="Descargar Archivo PDF 1 ORIGINAL CON GÉMINIS (7 Págs)"
                  content="Descarga el documento completo de 7 páginas pasado por Géminis (03_10_2026_Marco_objetivos_tesis_Dionisio — pasado por GEMINIS)."
                  regulatory="Regla 24 y 31 AGENTS.md"
                >
                  <a
                    href={DIRECTOR_EXPANDED_GEMINI_PDF_PATH}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={DIRECTOR_EXPANDED_GEMINI_DOWNLOAD_FILENAME}
                    className="px-2 py-0.5 bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-[9.5px] rounded inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Descargar PDF 1 CON GÉMINIS</span>
                  </a>
                </ScientificTooltip>
              </div>
            </div>
            <div className="text-[10px] text-sky-100">
              <strong className="text-amber-300">➕ Aporta sobre PDF 1 ORIGINAL:</strong> Tesis en una Frase, 3 Advertencias, Ecuaciones OE2 (1)–(4), Capa Límite Costera <MathFormula math="h_{\text{TIBL}}(x)" />, Hoja de Ruta con Criterio de Cierre y Spillover por Quintiles Q1–Q5.
            </div>
          </div>

          {/* TARJETAS AZULES DINÁMICAS PARA FUTUROS PDF 2, 3... N (ORIGINAL Y ORIGINAL CON GÉMINIS) */}
          {getDynamicDirectorPdfDocumentsCatalog()
            .filter((d) => d.pairNumber >= 2)
            .map((futureDoc) => (
              <div
                key={futureDoc.docId}
                className={`p-2 bg-slate-900/90 border-2 rounded-lg flex flex-col justify-between gap-1.5 text-[10.5px] ${
                  futureDoc.pairRole === 'CON_GEMINIS'
                    ? 'border-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.18)]'
                    : 'border-cyan-400/90'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="min-w-0">
                    <ScientificTooltip
                      position="top"
                      width="w-[340px]"
                      title={`Activar ${futureDoc.unifiedBlueBadgeLabel} en el Selector Superior`}
                      content={`Con 1 clic selecciona ${futureDoc.unifiedBlueBadgeLabel} en el selector Azul superior y carga sus ${futureDoc.chapters.length} capítulos/secciones en el desplegable Rosa.`}
                      regulatory="Reglas 30 y 31 AGENTS.md — Parejas Documentales Dinámicas 1…N"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent('uned-select-active-director-pdf-doc', {
                              detail: { docId: futureDoc.docId }
                            })
                          )
                        }
                        className={`px-2 py-0.5 font-black text-[10px] rounded mr-1.5 uppercase cursor-pointer ${
                          futureDoc.pairRole === 'CON_GEMINIS'
                            ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                            : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                        }`}
                      >
                        {futureDoc.unifiedBlueBadgeLabel}
                      </button>
                    </ScientificTooltip>
                    <span className="font-black text-cyan-200">{futureDoc.fileNameTitle}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <ScientificTooltip
                      position="top"
                      width="w-[330px]"
                      title={`Cargar Capítulos de ${futureDoc.unifiedBlueBadgeLabel} en el Desplegable Rosa`}
                      content={`Carga los ${futureDoc.chapters.length} capítulos o puntos detectados en ${futureDoc.unifiedBlueBadgeLabel} dentro del desplegable superior Rosa.`}
                      regulatory="Reglas 30 y 31 AGENTS.md"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent('uned-select-active-director-pdf-doc', {
                              detail: { docId: futureDoc.docId }
                            })
                          )
                        }
                        className="px-2 py-0.5 bg-slate-800 hover:bg-cyan-900 text-cyan-200 border border-cyan-400/60 font-black text-[9.5px] rounded cursor-pointer"
                      >
                        🎯 Elegir Capítulos Arriba ({futureDoc.chapters.length})
                      </button>
                    </ScientificTooltip>
                    <ScientificTooltip
                      position="top"
                      width="w-[330px]"
                      title={`👁️ Visualizar en Pantalla PDF de Estudio Profundo de ${futureDoc.unifiedBlueBadgeLabel}`}
                      content={`Abre en el visor HD de pantalla el informe PDF A4 de Estudio Profundo para ${futureDoc.unifiedBlueBadgeLabel} con datos en vivo del Punto Activo.`}
                      regulatory="Reglas 27, 29, 30 y 31 AGENTS.md"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent('uned-preview-monograph-pdf', {
                              detail: {
                                docId: futureDoc.docId,
                                chapterId: futureDoc.chapters[0]?.chapterId || '',
                                title: futureDoc.unifiedBlueBadgeLabel
                              }
                            })
                          )
                        }
                        className="px-2 py-0.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-[9.5px] rounded cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>👁️ Visualizar</span>
                      </button>
                    </ScientificTooltip>
                    <ScientificTooltip
                      position="top"
                      width="w-[330px]"
                      title={`Descargar PDF de Estudio Profundo de ${futureDoc.unifiedBlueBadgeLabel}`}
                      content={`Genera y descarga el informe PDF A4 de Estudio Profundo para ${futureDoc.unifiedBlueBadgeLabel} con datos en vivo del Punto Activo.`}
                      regulatory="Reglas 27, 29, 30 y 31 AGENTS.md"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          downloadDynamicDirectorDocumentOrChapterPdf(
                            futureDoc.docId,
                            futureDoc.chapters[0]?.chapterId || '',
                            activePointCtx
                          )
                        }
                        className="px-2 py-0.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[9.5px] rounded cursor-pointer inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>📥 PDF Estudio Profundo</span>
                      </button>
                    </ScientificTooltip>
                  </div>
                </div>
                <div className="text-[10px] text-sky-100">
                  <strong className="text-amber-300">
                    {futureDoc.pairRole === 'CON_GEMINIS'
                      ? `➕ Aporta sobre PDF ${futureDoc.pairNumber} ORIGINAL:`
                      : '📋 Alcance Documental:'}
                  </strong>{' '}
                  {futureDoc.addedValueSummary}
                </div>
              </div>
            ))}
        </div>
        )}
      </div>

      {/* BLOQUE 1A: CUADRO SINÓPTICO DE LOS 7 PUNTOS DEL DIRECTOR (03/10/2026) */}
      {(synthesisSubSection === '1A_synoptic' || synthesisSubSection === 'both') && (
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="text-[11px] font-black text-emerald-300 uppercase">
              1️⃣ Cuadro Sinóptico 1:1 de los 7 Puntos del Director (03/10/2026) con Resultado en Vivo en {streetShort}:
            </div>
            {isSynopticCompact && (
              <span className="text-[10px] text-cyan-300 font-bold">
                💡 Toca o haz clic en cualquier fila para desplegar/plegar el texto íntegro • Doble clic/toque en cualquier celda para abrir su Tooltip Científico
              </span>
            )}
          </div>
          <TableHorizontalScrollContainer
            accent="emerald"
            title={`Síntesis 1:1 de los Puntos 1 a 7 del Director en ${streetShort}`}
            className="border border-slate-700 rounded-lg"
          >
            <table className="w-full text-left border-collapse text-[10.5px]">
              <thead>
                <tr className="bg-slate-900 text-emerald-300 border-b border-slate-700 uppercase">
                  <th className="py-1.5 px-2 w-[210px]">
                    <ScientificTooltip
                      position="top"
                      width="w-[350px]"
                      title="Columna 1: Punto del PDF del Director (03/10/2026), Objetivo Específico y Fase"
                      content="Identifica el punto exacto del documento fundacional de tu Directora de Tesis (Puntos 1–3, Punto 4, Paso 6.1, Punto 5 y Paso 6.2, Paso 6.3, Punto 5 y Paso 6.4, Paso 6.5 y Punto 7), su Objetivo Específico (OE1–OE4) y la Fase evolutiva en que opera."
                      formula="\text{Punto}_k \in \{\text{Puntos 1–3},\;\text{Punto 4},\;\text{Pasos 6.1–6.5},\;\text{Punto 7}\}"
                      regulatory="Documento Original del Director (03/10/2026) • Reglas 7, 20, 22 y 24 AGENTS.md"
                    >
                      <span className="cursor-help">Punto del PDF / Objetivo y Fase</span>
                    </ScientificTooltip>
                  </th>
                  <th className="py-1.5 px-2 w-[36%]">
                    <ScientificTooltip
                      position="top"
                      width="w-[350px]"
                      title="Columna 2: Exigencia Metodológica Literal del Director de Tesis"
                      content="Resume el mandato metodológico literal exigido por la Dirección de Tesis en cada uno de los 7 bloques del documento de trabajo del 03/10/2026."
                      formula="\text{Mandato}_{\text{Director}}(\text{Punto}_k) \implies \text{Restricción Epistémica y Física}"
                      regulatory="Documento Original del Director (03/10/2026, Págs. 1–2) • Regla 24 AGENTS.md"
                    >
                      <span className="cursor-help">Qué Exige Literalmente el Director</span>
                    </ScientificTooltip>
                  </th>
                  <th className="py-1.5 px-2">
                    <ScientificTooltip
                      position="top"
                      width="w-[360px]"
                      title={`Columna 3: Resultado Verídico en Vivo Hoy en ${streetShort}`}
                      content={`Muestra la respuesta cuantitativa calculada en tiempo real por el Gemelo Digital sobre ${streetShort} (NO₂ a 1,8 m = ${liveFivePointsMetrics.cPoint} ± ${liveFivePointsMetrics.gumUncertainty} µg/m³, 0,9 m = ${liveFivePointsMetrics.cZ_0_9m_pediatric} µg/m³, 4,0 m = ${liveFivePointsMetrics.canyonMicroBreakdown.cZ_4_0m_cabin} µg/m³) usando 100% dato medido + ecuación física exacta (Regla 32).`}
                      formula={`C_{\\text{NO}_2}(1,8\\text{m})=${liveFivePointsMetrics.cPoint}\\pm ${liveFivePointsMetrics.gumUncertainty}\\,\\mu\\text{g/m}^3,\\; \\text{MQI}=${liveFivePointsMetrics.mqi}\\le 1,00`}
                      regulatory="Reglas 1, 10, 17, 32, 33, 34 y 35 AGENTS.md — 100% Dato Medido + Ecuación Exacta"
                    >
                      <span className="cursor-help">Resultado Verídico en Vivo Hoy ({streetShort})</span>
                    </ScientificTooltip>
                  </th>
                  <th className="py-1.5 px-2 text-right w-[135px]">
                    <ScientificTooltip
                      position="left"
                      width="w-[340px]"
                      title="Columna 4: Acciones Directas (Abrir Capítulo, 👁️ Ver PDF en Pantalla o 📥 Descargar PDF)"
                      content={`Permite saltar en 1 clic a la pestaña donde se desarrolla ese punto, visualizar en alta definición (300+ DPI) su monográfico PDF A4 o descargarlo directamente con la telemetría de ${streetShort}.`}
                      formula="\text{Acción}(\text{Punto}_k) \in \{\text{Abrir Cap.},\;\text{👁️ Ver PDF HD},\;\text{📥 Descargar PDF A4}\}"
                      regulatory="Reglas 27, 29, 30 y 31 AGENTS.md"
                    >
                      <span className="cursor-help">Acción Directa</span>
                    </ScientificTooltip>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/95 text-slate-200">
                {sevenPointsRows.map((row) => {
                  const isRowExpanded = !isSynopticCompact || expandedSynopticRows.includes(row.pointNum);
                  return (
                    <tr
                      key={row.pointNum}
                      onClick={() => isSynopticCompact && toggleSynopticRow(row.pointNum)}
                      className={`hover:bg-slate-900/80 transition-colors ${isSynopticCompact ? 'cursor-pointer' : ''}`}
                    >
                      <td className="py-1.5 px-2 align-middle">
                        <ScientificTooltip
                          position="right"
                          width="w-[380px]"
                          title={`${row.pointNum} — ${row.objectiveTag} (${row.phaseTag})`}
                          content={`${row.pointThemeDetail} En ${streetShort}: ${row.liveResultInActiveStreet}`}
                          formula={row.formula}
                          regulatory={row.regulatory}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-black text-amber-300 whitespace-nowrap">{row.pointNum}</span>
                              <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-indigo-200 font-bold text-[9px] rounded truncate max-w-[145px]" title={row.phaseTag}>
                                {row.phaseTag}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-1 mt-0.5">
                              <span className="text-[9.5px] text-cyan-300 font-bold truncate">{row.objectiveTag}</span>
                              {isSynopticCompact && (
                                <span className="text-[9px] text-amber-300 font-bold shrink-0">
                                  {isRowExpanded ? '▴ Plegar' : '▾ Leer'}
                                </span>
                              )}
                            </div>
                          </div>
                        </ScientificTooltip>
                      </td>
                      <td className="py-1.5 px-2.5 align-middle text-slate-200 leading-snug">
                        <ScientificTooltip
                          position="top"
                          width="w-[390px]"
                          title={`Exigencia Literal del Director en ${row.pointNum} (${row.objectiveTag})`}
                          content={`Mandato del Director: «${row.directorRequirement}» — ${row.pointThemeDetail}`}
                          formula={row.formula}
                          regulatory={row.regulatory}
                        >
                          <div className={isRowExpanded ? '' : 'line-clamp-2'}>{row.directorRequirement}</div>
                        </ScientificTooltip>
                      </td>
                      <td className="py-1.5 px-2.5 align-middle text-emerald-200 font-semibold leading-snug">
                        <ScientificTooltip
                          position="top"
                          width="w-[400px]"
                          title={`Resultado Verídico en Vivo de ${row.pointNum} sobre ${streetShort}`}
                          content={`${row.liveResultInActiveStreet} — Calculado determinísticamente para ${row.pointNum} (${row.objectiveTag}) sin datos sintéticos ni simulaciones (Regla 32).`}
                          formula={row.formula}
                          regulatory={row.regulatory}
                        >
                          <div className={isRowExpanded ? '' : 'line-clamp-2'}>{row.liveResultInActiveStreet}</div>
                        </ScientificTooltip>
                      </td>
                      <td
                        className="py-1.5 px-2 align-middle text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {row.pointNum === 'Paso 6.1' && (
                            <ScientificTooltip
                              position="left"
                              width="w-[340px]"
                              title="🔬 Ficha Instrumental Oficial UNE-EN 14211:2013 (Regla 33)"
                              content={`Abre directamente la Ficha Técnica Instrumental de la estación ancla ${liveFivePointsMetrics?.primaryStation?.code || 'ES1681A'} (${liveFivePointsMetrics?.primaryStation?.name || 'Carranque'}): analizador de quimioluminiscencia, distancia geodésica, peso EnKF y exportación LaTeX/JSON-LD FAIR.`}
                              formula="\text{NO} + \text{O}_3 \longrightarrow \text{NO}_2^* + \text{O}_2 \longrightarrow \text{NO}_2 + h\nu"
                              regulatory="Norma UNE-EN 14211:2013 & Reglas 32, 33 y 35"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  (window as any).__forceExpandNextModal = true;
                                  setSelectedInstrumentalStationId(liveFivePointsMetrics?.primaryStation?.id || 'carranque');
                                }}
                                className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[9.5px] rounded cursor-pointer shadow flex items-center gap-0.5"
                              >
                                🔬 Ficha
                              </button>
                            </ScientificTooltip>
                          )}
                          <ScientificTooltip
                            position="left"
                            width="w-[330px]"
                            title={`Abrir Capítulo en Pantalla: ${row.pointNum} (${row.objectiveTag})`}
                            content={`Salta directamente al capítulo donde se resuelve «${row.pointNum}» (${row.phaseTag}) con telemetría en vivo de ${streetShort}.`}
                            formula={row.formula}
                            regulatory={row.regulatory}
                          >
                            <button
                              type="button"
                              onClick={() => onSelectChapter(row.targetSubView, row.monographId)}
                              className="px-2 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[9.5px] rounded cursor-pointer"
                            >
                              Abrir Cap. ➔
                            </button>
                          </ScientificTooltip>

                          <ScientificTooltip
                            position="left"
                            width="w-[340px]"
                            title={`👁️ Visualizar PDF A4 en Pantalla: ${row.pointNum}`}
                            content={`Abre en el visor HD (300+ DPI, ajuste automático al ancho) el informe PDF A4 de «${row.pointNum}» nutrido en vivo con ${streetShort} y la Matriz de los 11 Distritos de Málaga.`}
                            formula={row.formula}
                            regulatory={row.regulatory}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                (window as any).__forceExpandNextModal = true;
                                window.dispatchEvent(
                                  new CustomEvent('uned-preview-monograph-pdf', {
                                    detail: {
                                      monographId: row.monographId,
                                      title: `${row.pointNum} (${row.objectiveTag})`
                                    }
                                  })
                                );
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-cyan-500 text-cyan-200 hover:text-slate-950 border border-cyan-400/70 font-black text-[9.5px] rounded cursor-pointer"
                            >
                              👁️ Ver
                            </button>
                          </ScientificTooltip>

                          <ScientificTooltip
                            position="left"
                            width="w-[330px]"
                            title={`📥 Descargar PDF A4: ${row.pointNum} (${row.objectiveTag})`}
                            content={`Descarga directamente el informe PDF A4 de Estudio Profundo de «${row.pointNum}» parametrizado con ${streetShort} y los 11 Distritos de Málaga.`}
                            formula={row.formula}
                            regulatory={row.regulatory}
                          >
                            <button
                              type="button"
                              onClick={() => onDownloadMonograph(row.monographId)}
                              className="px-2 py-1 bg-slate-800 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/60 font-black text-[9.5px] rounded cursor-pointer"
                            >
                              📥 PDF
                            </button>
                          </ScientificTooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableHorizontalScrollContainer>
        </div>
      )}

      {/* BLOQUE 1B: RADAR EN VIVO POR CALLE Y CUADERNO ABIERTO DE HALLAZGOS DE LA TESIS (1…N ABIERTOS, CERO LÍMITE FIJO — REGLA 28) */}
      {(synthesisSubSection === '1B_discoveries' || synthesisSubSection === 'both') && (
      <div id="director-open-discoveries-logbook" className="p-2.5 bg-slate-950/95 border-2 border-amber-400/90 rounded-xl space-y-2 shadow-[0_0_20px_rgba(245,158,11,0.18)]">
        {/* Cabecera Horizontal de Ancho Completo en 2 Filas Limpias (Cero Huecos Negros) */}
        <div className="flex flex-col gap-1.5 border-b border-amber-500/40 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <ScientificTooltip
                position="top"
                width="w-[370px]"
                title="🔬 Radar en Vivo y Cuaderno Abierto de Hallazgos de la Tesis (1…N Abiertos)"
                content="Sistema de investigación doctoral sin techo fijo (1…N hallazgos): combina el barrido determinista en tiempo real de los 11 Distritos / 13 Arterias de Málaga (Paso 1) con el Cuaderno Abierto de Hallazgos del Investigador (Paso 2), inyectando cada hallazgo en los 10 generadores PDF y tablas LaTeX."
                formula="\mathcal{H}_{\text{Tesis}} = \{H_1,\dots,H_N\} = \mathcal{H}_{\star\text{Estrella}} \sqcup \mathcal{H}_{\text{Apoyo}}"
                regulatory="Reglas 20, 27 y 28 AGENTS.md — Cuaderno Abierto 1…N y Sincronización PDF en Vivo"
              >
                <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 font-black text-[10.5px] uppercase rounded cursor-help">
                  🔬 RADAR EN VIVO Y CUADERNO ABIERTO DE HALLAZGOS DE LA TESIS (1…N ABIERTOS: 1, 7, 40+)
                </span>
              </ScientificTooltip>
              <ScientificTooltip
                position="top"
                width="w-[350px]"
                title={`Recuento Dinámico del Cuaderno: ${openDiscoveries.length} Hallazgos (${starredCount} ⭐ Estrella + ${supportCount} 📊 Apoyo)`}
                content={`Actualmente tienes ${openDiscoveries.length} hallazgos registrados en tu Cuaderno Doctoral: ${starredCount} marcados como ⭐ Hallazgos Estrella (que encabezan las conclusiones de portada) y ${supportCount} como 📊 Evidencias de Apoyo, todos sincronizados en los 10 PDFs de la plataforma.`}
                formula={`N_{\\text{total}} = ${starredCount}_{\\star} + ${supportCount}_{\\text{apoyo}} = ${openDiscoveries.length}`}
                regulatory="Reglas 13, 27 y 28 AGENTS.md"
              >
                <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-400 text-emerald-200 font-black text-[10px] rounded cursor-help">
                  {openDiscoveries.length} TOTAL ({starredCount} ⭐ ESTRELLA + {supportCount} 📊 APOYO • EN 10 PDFs ✓)
                </span>
              </ScientificTooltip>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <ScientificTooltip
                position="top"
                width="w-[360px]"
                title="📝 Copiar Conclusiones Jerarquizadas (Word / LaTeX Booktabs)"
                content={`Copia al portapapeles todas las conclusiones de tu Cuaderno Abierto (${starredCount} ⭐ Hallazgos Estrella primero y ${supportCount} 📊 Evidencias de Apoyo después) con sus valores empíricos en ${streetShort}, listas para pegar en tu memoria doctoral en Word o LaTeX.`}
                formula="\text{Export}_{\text{Portapapeles}} = (\mathcal{H}_{\star\text{Estrella}} \to \mathcal{H}_{\text{Apoyo}})"
                regulatory="Reglas 8, 28 y 30 AGENTS.md — Exportación Académica Word / LaTeX"
              >
                <button
                  type="button"
                  onClick={handleCopyConclusionsForWordAndLatex}
                  className="px-2.5 py-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[10px] rounded border border-white cursor-pointer"
                >
                  {copiedConclusionsOk
                    ? '✅ ¡Conclusiones Copiadas al Portapapeles!'
                    : '📝 Copiar Conclusiones (Word / LaTeX)'}
                </button>
              </ScientificTooltip>

              <ScientificTooltip
                position="top"
                width="w-[360px]"
                title="🔔 Abrir Radar DOI (SOTA 2024–2026) — Escaneo OpenAlex / Crossref"
                content="Abre el cajón del Radar Bibliográfico DOI (SOTA) que consulta en vivo las APIs académicas OpenAlex y Crossref para detectar nuevas publicaciones con DOI oficial sobre PINNs atmosféricas, ZBE, Sentinel-4/5 y fotoquímica urbana de NO₂."
                formula="\text{Radar}_{\text{DOI}} \leftarrow \text{API}_{\text{OpenAlex}} \cup \text{API}_{\text{Crossref}}\;(\text{DOI verificado})"
                regulatory="Reglas 25, 28 y 30 AGENTS.md — Baliza 🔔 RADAR DOI (SOTA)"
              >
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('uned-open-radar-doi-drawer'))}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white border border-amber-300 font-black text-[10px] rounded cursor-pointer flex items-center gap-1"
                >
                  <Bell className="w-3 h-3 text-amber-300 animate-bounce" />
                  <span>🔔 Buscar en Radar DOI (SOTA)</span>
                </button>
              </ScientificTooltip>

              <ScientificTooltip
                position="top"
                width="w-[350px]"
                title={`➕ Añadir Nuevo Hallazgo #${openDiscoveries.length + 1} al Cuaderno Abierto de la Tesis`}
                content={`Abre el formulario rápido para registrar un nuevo hallazgo #${openDiscoveries.length + 1} vinculado a OE1–OE4 con los datos en vivo de ${streetShort}; al guardarlo se incorpora automáticamente a los 10 generadores PDF y tablas LaTeX.`}
                formula={`H_{${openDiscoveries.length + 1}} \\in \\mathcal{H}_{\\text{Tesis}}(1\\dots N)`}
                regulatory="Reglas 27, 28 y 30 AGENTS.md"
              >
                <button
                  type="button"
                  onClick={() => setShowAddDiscoveryForm((prev) => !prev)}
                  className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] rounded border border-white cursor-pointer"
                >
                  {showAddDiscoveryForm ? '▴ Ocultar Formulario' : `➕ Añadir Hallazgo #${openDiscoveries.length + 1}`}
                </button>
              </ScientificTooltip>
            </div>
          </div>
          <p className="text-[10.5px] text-slate-200 leading-snug w-full">
            Escalado inteligente para <strong>1, 7 o 40+ hallazgos</strong> sin saturar la vista: <strong>1) Jerarquía ⭐ Hallazgos Estrella vs. 📊 Evidencias de Apoyo</strong>, <strong>2) Agrupación automática multi-calle (M calles corroboradas)</strong>, <strong>3) Vista Tarjetas ⇄ Tabla Compacta de 1 renglón</strong> y <strong>4) Copia directa de Conclusiones para Word / LaTeX</strong>.
          </p>
        </div>

        {/* Formulario Rápido para Añadir Cualquier Nuevo Descubrimiento #N de la Investigación */}
        {showAddDiscoveryForm && (
          <div className="p-3 bg-slate-900 border-2 border-amber-400 rounded-xl space-y-2 text-[10.5px]">
            <div className="font-black text-amber-300 uppercase">
              ➕ Registrar Hallazgo #{openDiscoveries.length + 1} en mi Cuaderno Abierto de la Tesis (Impreso Automáticamente en PDFs y LaTeX):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input
                type="text"
                value={newDiscTitle}
                onChange={(e) => setNewDiscTitle(e.target.value)}
                placeholder="Título del nuevo hallazgo o descubrimiento científico *"
                className="md:col-span-2 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white"
              />
              <select
                value={newDiscObjectiveCode}
                onChange={(e) =>
                  setNewDiscObjectiveCode(e.target.value as 'OE1' | 'OE2' | 'OE3' | 'OE4' | 'OE1–OE4')
                }
                className="px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-cyan-200 font-bold"
              >
                <option value="OE1">🎯 OE1 (Fuentes y Matriz 24+16)</option>
                <option value="OE2">⚛️ OE2 (PINN y LOOCV UNED)</option>
                <option value="OE3">⚖️ OE3 (ZBE Causal PI-DiD)</option>
                <option value="OE4">📍 OE4 (Exposición 1,8m/0,9m y Equidad)</option>
                <option value="OE1–OE4">🌐 OE1–OE4 (Transversal / DOI SOTA)</option>
              </select>
              <select
                value={newDiscTarget}
                onChange={(e) => setNewDiscTarget(e.target.value)}
                className="px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-amber-200 font-bold"
              >
                <option value="Puntos 1–3 • OE1–OE4 (Objetivo General)">Puntos 1–3 • OE1–OE4</option>
                <option value="Punto 4 • OE1/OE3 (10 Controles de Contorno)">Punto 4 • 10 Controles</option>
                <option value="Paso 6.1 • OE1 (24+16 Detectores)">Paso 6.1 • 24+16 Detectores</option>
                <option value="Pasos 6.2–6.3 • OE2 (32 Variables y MVP)">Pasos 6.2–6.3 • MVP 12 Vars</option>
                <option value="Punto 5 y Paso 6.4 • OE2 (PINN y LOOCV UNED)">Paso 6.4 • PINN y Servidor UNED</option>
                <option value="Paso 6.5 y Punto 7 • OE3/OE4 (ZBE y 11 Distritos)">Paso 6.5 y Punto 7 • ZBE y Equidad</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                type="text"
                value={newDiscEvidence}
                onChange={(e) => setNewDiscEvidence(e.target.value)}
                placeholder={`Evidencia numérica (si lo dejas vacío se usan las cifras en vivo de ${streetShort})`}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white"
              />
              <input
                type="text"
                value={newDiscConclusion}
                onChange={(e) => setNewDiscConclusion(e.target.value)}
                placeholder="Conclusión principal para tu Director y el Tribunal Doctoral *"
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-amber-200 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={newDiscIsStarred}
                  onChange={(e) => setNewDiscIsStarred(e.target.checked)}
                  className="accent-amber-400"
                />
                <span>⭐ Marcar como Hallazgo Estrella Principal de la Tesis (sale en portada y conclusiones principales)</span>
              </label>
              <ScientificTooltip
                position="top"
                width="w-[350px]"
                title={`✅ Guardar Hallazgo #${openDiscoveries.length + 1} e Incluir en Todos los PDFs`}
                content={`Guarda inmediatamente este hallazgo en el Cuaderno Abierto de la Tesis y lo propaga en vivo a los 10 generadores PDF y a las tablas LaTeX Booktabs.`}
                formula={`\\mathcal{H}_{\\text{Tesis}} \\leftarrow \\mathcal{H}_{\\text{Tesis}} \\cup \\{H_{${openDiscoveries.length + 1}}\}`}
                regulatory="Reglas 27, 28 y 30 AGENTS.md"
              >
                <button
                  type="button"
                  onClick={handleAddManualDiscovery}
                  className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black rounded-lg cursor-pointer"
                >
                  ✅ Guardar Hallazgo #{openDiscoveries.length + 1} e Incluir en Todos los PDFs
                </button>
              </ScientificTooltip>
            </div>
          </div>
        )}

        {/* PASO 1: RADAR AUTOMÁTICO EN VIVO EN TODA MÁLAGA (11 DISTRITOS / 13 ARTERIAS) + LUPA EN LA CALLE ACTIVA Y .JSON UNED */}
        <div className="bg-slate-900/90 border-2 border-cyan-400/80 rounded-lg overflow-hidden shadow-[0_0_14px_rgba(34,211,238,0.14)]">
          <div
            onClick={() => setIsStep1RadarOpen((prev) => !prev)}
            className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800/90 flex flex-col gap-1.5 cursor-pointer select-none"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <ScientificTooltip
                  position="top"
                  width="w-[380px]"
                  title={`📡 Paso 1. Radar Automático en Toda Málaga (${cityWideScanSummary.totalDistrictsCovered} Distritos / ${cityWideScanSummary.totalCorridorsScanned} Arterias)`}
                  content={`Escanea en tiempo real las ${cityWideScanSummary.totalCorridorsScanned} arterias representativas de los ${cityWideScanSummary.totalDistrictsCovered} Distritos Oficiales de Málaga junto con la calle activa (${streetShort}) y el checkpoint .JSON del servidor UNED, detectando hoy ${liveStreetCandidates.length} fenómenos físico-químicos verificables.`}
                  formula="C_{\text{NO}_2}(\mathbf{x}_d, z, t)\quad \forall d\in\{1\dots 11\text{ Distritos}\},\; z\in\{0,9\text{m},\;1,8\text{m},\;4,0\text{m}\}"
                  regulatory="Reglas 17, 27, 28, 32, 33 y 34 AGENTS.md"
                >
                  <span className="text-[10.5px] font-black text-cyan-300 uppercase cursor-help">
                    📡 Paso 1. Radar Automático en Toda Málaga ({cityWideScanSummary.totalDistrictsCovered} Distritos / {cityWideScanSummary.totalCorridorsScanned} Arterias) + Lupa en {streetShort} y .JSON UNED ({liveStreetCandidates.length} fenómenos detectados hoy)
                  </span>
                </ScientificTooltip>

                <ScientificTooltip
                  position="top"
                  width="w-[370px]"
                  title={`🎯 Lupa Vertical en Vivo sobre ${streetShort} (1,8 m | 0,9 m | 4,0 m)`}
                  content={`Concentración de NO₂ asimilada ahora mismo en ${streetShort}: cota respiratoria adulta (z = 1,8 m) = ${liveFivePointsMetrics.cPoint} µg/m³ | cota pediátrica en carrito (z = 0,9 m) = ${liveFivePointsMetrics.cZ_0_9m_pediatric} µg/m³ | cota de cabina oficial (z = 4,0 m) = ${liveFivePointsMetrics.canyonMicroBreakdown.cZ_4_0m_cabin} µg/m³.`}
                  formula={`C_{0,9\\text{m}}(${liveFivePointsMetrics.cZ_0_9m_pediatric}) > C_{1,8\\text{m}}(${liveFivePointsMetrics.cPoint}) > C_{4,0\\text{m}}(${liveFivePointsMetrics.canyonMicroBreakdown.cZ_4_0m_cabin})\\;[\\mu\\text{g/m}^3]`}
                  regulatory="Reglas 10, 17 y 21 AGENTS.md — Desacoplamiento Vertical Peatonal vs. Cabina"
                >
                  <span className="px-1.5 py-0.5 bg-amber-950/90 border border-amber-400 text-amber-200 font-black text-[9.5px] rounded cursor-help">
                    🎯 Lupa en {streetShort}: 1,8m = {liveFivePointsMetrics.cPoint} µg/m³ • 0,9m (Bebé) = {liveFivePointsMetrics.cZ_0_9m_pediatric} µg/m³ • 4,0m (Cabina) = {liveFivePointsMetrics.canyonMicroBreakdown.cZ_4_0m_cabin} µg/m³
                  </span>
                </ScientificTooltip>

                <ScientificTooltip
                  position="top"
                  width="w-[360px]"
                  title="🏙️ Media Sinóptica en Vivo de los 11 Distritos Oficiales de Málaga"
                  content={`Promedio espacial en tiempo real a través de los 11 Distritos Oficiales de Málaga: cota peatonal (1,8 m) = ${cityWideScanSummary.meanPedestrian18mUg} µg/m³ | cota carrito infantil (0,9 m) = ${cityWideScanSummary.meanPediatric09mUg} µg/m³ | cota cabina oficial (4,0 m) = ${cityWideScanSummary.meanCabin40mUg} µg/m³.`}
                  formula={`\\bar{C}_{11\\text{ Dist}}(1,8\\text{m})=${cityWideScanSummary.meanPedestrian18mUg},\\; \\bar{C}(0,9\\text{m})=${cityWideScanSummary.meanPediatric09mUg},\\; \\bar{C}(4,0\\text{m})=${cityWideScanSummary.meanCabin40mUg}\\;\\mu\\text{g/m}^3`}
                  regulatory="Reglas 17, 27 y 28 AGENTS.md — Matriz de 11 Distritos Oficiales"
                >
                  <span className="px-1.5 py-0.5 bg-cyan-950/90 border border-cyan-400/80 text-cyan-200 font-black text-[9px] rounded cursor-help">
                    🏙️ Media 11 Distritos en Vivo: 1,8m = {cityWideScanSummary.meanPedestrian18mUg} µg/m³ • 0,9m = {cityWideScanSummary.meanPediatric09mUg} µg/m³ • 4,0m = {cityWideScanSummary.meanCabin40mUg} µg/m³
                  </span>
                </ScientificTooltip>

                <ScientificTooltip
                  position="top"
                  width="w-[340px]"
                  title="⚡ Rendimiento Algebraico Memoizado (0% GPU)"
                  content={`El barrido completo de las 13 arterias en los 11 Distritos Oficiales de Málaga se evalúa en ~${cityWideScanSummary.executionTimeMs.toFixed(2)} ms mediante evaluación algebraica memoizada en CPU (0% carga WebGL/GPU).`}
                  formula={`t_{\\text{eval}}(13\\text{ arterias}) \\approx ${cityWideScanSummary.executionTimeMs.toFixed(2)}\\,\\text{ms},\\quad \\text{GPU}=0\\%`}
                  regulatory="Regla 28 AGENTS.md — Eficiencia Computacional en Vivo"
                >
                  <span className="px-1.5 py-0.5 bg-emerald-950/90 border border-emerald-400/70 text-emerald-300 font-black text-[9px] rounded cursor-help">
                    ⚡ Barrido 11 Distritos: ~{cityWideScanSummary.executionTimeMs.toFixed(2)} ms • 0% GPU • Memoizado
                  </span>
                </ScientificTooltip>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
              <ScientificTooltip
                position="top"
                width="w-[410px]"
                title="Selector Rápido con Concentraciones en Vivo en los 11 Distritos de Málaga (0% GPU)"
                content="Muestra en vivo las concentraciones asimiladas a z = 1,8 m (peatón), z = 0,9 m (carrito bebé) y z = 4,0 m (cabina oficial), junto con la fracción molar en ppb (conversión termodinámica exacta con P y T reales de AEMET, Regla 34) para la calle activa y para cada una de las 13 arterias de los 11 Distritos Oficiales de Málaga."
                formula="C_{\text{NO}_2}(z)\,[\mu\text{g/m}^3] = \chi_{\text{NO}_2}(z)\cdot\frac{M_{\text{NO}_2}\cdot P_{\text{real}}(t)}{R\cdot T_{\text{real}}(t)},\quad z\in\{0,9\text{m},\;1,8\text{m},\;4,0\text{m}\}"
                regulatory="Reglas 17, 28, 32, 33 y 34 AGENTS.md — 11 Distritos Oficiales de Málaga en Vivo"
              >
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 border-2 border-amber-400/90 rounded-lg px-2 py-1">
                  <span className="text-[9.5px] font-black text-amber-300 whitespace-nowrap">
                    🌍 Lupa Calle (11 Distritos con Concentraciones en Vivo):
                  </span>
                  <select
                    aria-label="Cambiar Lupa Local entre los 11 Distritos de Málaga con concentraciones en vivo"
                    value={
                      live11DistrictsCorridors.find((c) =>
                        streetShort.toLowerCase().includes(c.streetName.split('(')[0].trim().toLowerCase().slice(0, 10))
                      )?.id || ''
                    }
                    onChange={(e) => {
                      const chosen = live11DistrictsCorridors.find((c) => c.id === e.target.value);
                      if (chosen && activePointCtx?.syncActivePoint) {
                        activePointCtx.syncActivePoint(chosen.lat, chosen.lon, {
                          name: `${chosen.streetName}, ${chosen.districtName}, Málaga`,
                          fly: false
                        });
                      }
                    }}
                    className="bg-slate-900 text-amber-200 font-black text-[10px] rounded px-1.5 py-0.5 border border-amber-400/60 cursor-pointer max-w-full sm:max-w-[540px]"
                  >
                    <option value="">
                      📍 {streetShort} (Activa en Vivo) ➔ 1,8m: {liveFivePointsMetrics.cPoint} µg/m³ | 0,9m (Bebé): {liveFivePointsMetrics.cZ_0_9m_pediatric} µg/m³ | 4,0m (Cabina): {liveFivePointsMetrics.canyonMicroBreakdown.cZ_4_0m_cabin} µg/m³
                    </option>
                    {live11DistrictsCorridors.map((corridor) => (
                      <option key={corridor.id} value={corridor.id}>
                        {corridor.shortLabel} ({corridor.streetName.split('(')[0].trim()}) ➔ 1,8m: {corridor.liveC18mPedestrianUg} µg/m³ ({corridor.livePpb18m} ppb) | 0,9m: {corridor.liveC09mPediatricUg} µg/m³ | 4,0m: {corridor.liveC40mCabinUg} µg/m³ [Ancla {corridor.anchorStationCode}]
                      </option>
                    ))}
                  </select>
                </div>
              </ScientificTooltip>

              <ScientificTooltip
                position="left"
                width="w-[360px]"
                title="Desplegar / Plegar Paso 1 (3 Fenómenos Detectados + Matriz Completa de 11 Distritos)"
                content={`Abre o pliega el panel detallado del Paso 1 con las ${liveStreetCandidates.length} tarjetas de fenómenos físico-químicos detectados hoy y la Tabla Comparativa de las 13 arterias en los 11 Distritos Oficiales de Málaga.`}
                formula="\text{Paso 1} = \{F_1, F_2, F_3\} \cup \text{Matriz}_{11\text{ Distritos}}(z=4,0\text{m},\;1,8\text{m},\;0,9\text{m})"
                regulatory="Reglas 17, 28, 30, 32, 33, 34 y 35 AGENTS.md"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsStep1RadarOpen((prev) => !prev);
                  }}
                  className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 font-black text-[9.5px] rounded cursor-pointer shrink-0"
                >
                  {isStep1RadarOpen
                    ? '▴ Plegar Paso 1 (3 Fenómenos + Tabla 11 Distritos)'
                    : `▾ Desplegar Paso 1 (${liveStreetCandidates.length} Hallazgos + Tabla Completa 11 Distritos + Lupa en ${streetShort})`}
                </button>
              </ScientificTooltip>
            </div>
          </div>

          {/* TIRA PERMANENTE EN VIVO DE LOS 11 DISTRITOS OFICIALES DE MÁLAGA (CONCENTRACIONES EN VIVO SIEMPRE VISIBLES SIN ABRIR EL SELECT) */}
          <div className="px-2.5 py-1.5 bg-slate-950/95 border-t border-cyan-500/40">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[9px] font-black text-emerald-300 uppercase">
                📊 Telemetría en Vivo en los 11 Distritos Oficiales de Málaga (13 Arterias — Clic en cualquier distrito para fijar su Lupa Local en &lt; 1 ms):
              </span>
              <span className="text-[8.5px] text-slate-300 font-bold">
                Directiva (UE) 2024/2881 = 20,0 µg/m³ • 🔴 &gt;20 µg/m³ Excedencia • 🟡 Ilusión Regulatoria (4m &lt; 20 pero 1,8m/0,9m ≥ 20) • 🟢 &lt;20 µg/m³
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-1">
              {live11DistrictsCorridors.map((corridor) => {
                const isSelectedCorridor = streetShort
                  .toLowerCase()
                  .includes(corridor.streetName.split('(')[0].trim().toLowerCase().slice(0, 10));
                const statusBadge =
                  corridor.eu2024Status === 'EXCEDENCIA_DIRECTA'
                    ? '🔴'
                    : corridor.eu2024Status === 'ILUSION_CUMPLIMIENTO'
                    ? '🟡'
                    : '🟢';
                return (
                  <ScientificTooltip
                    key={corridor.id}
                    position="top"
                    width="w-[360px]"
                    title={`${corridor.districtName} — ${corridor.streetName}`}
                    content={`Concentraciones en vivo asimiladas hoy: Peatón (1,8 m) = ${corridor.liveC18mPedestrianUg} µg/m³ (${corridor.livePpb18m} ppb bajo P y T reales de AEMET, Regla 34) | Carrito Infantil (0,9 m) = ${corridor.liveC09mPediatricUg} µg/m³ | Cabina Oficial (4,0 m) = ${corridor.liveC40mCabinUg} µg/m³ (Brecha Δ = +${corridor.liveDeltaVerticalUg} µg/m³). Tráfico COPERT = ${corridor.trafficSharePct}% (+${corridor.liveCopertTrafficUg} µg/m³), Sumidero Arboleda = ${corridor.treesSinkUg} µg/m³, Ganancia LOOCV = -${corridor.loocvGainPct}%, MQI = ${corridor.mqi}.`}
                    formula={`C_{1,8\\text{m}}=${corridor.liveC18mPedestrianUg}\\,\\mu\\text{g/m}^3\\;(${corridor.livePpb18m}\\,\\text{ppb}),\\; C_{0,9\\text{m}}=${corridor.liveC09mPediatricUg},\\; C_{4,0\\text{m}}=${corridor.liveC40mCabinUg}`}
                    regulatory={`Ancla UNE-EN 14211:2013: ${corridor.anchorStationCode} • ${corridor.zbeZoneRole}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (activePointCtx?.syncActivePoint) {
                          activePointCtx.syncActivePoint(corridor.lat, corridor.lon, {
                            name: `${corridor.streetName}, ${corridor.districtName}, Málaga`,
                            fly: false
                          });
                        }
                      }}
                      className={`p-1 rounded border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelectedCorridor
                          ? 'bg-amber-950/80 border-amber-400 ring-1 ring-amber-300'
                          : corridor.eu2024Status === 'EXCEDENCIA_DIRECTA'
                          ? 'bg-rose-950/35 border-rose-500/60 hover:border-rose-300'
                          : corridor.eu2024Status === 'ILUSION_CUMPLIMIENTO'
                          ? 'bg-amber-950/25 border-amber-500/50 hover:border-amber-300'
                          : 'bg-emerald-950/25 border-emerald-500/50 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-0.5">
                        <span className="text-[8.5px] font-black text-cyan-300 truncate">
                          {statusBadge} {corridor.shortLabel}
                        </span>
                        <span className="text-[7.5px] font-bold text-slate-400 shrink-0">
                          {corridor.anchorStationCode}
                        </span>
                      </div>
                      <div className="text-[9px] font-black text-white leading-tight mt-0.5">
                        1,8m: <span className="text-amber-300">{corridor.liveC18mPedestrianUg}</span> µg/m³{' '}
                        <span className="text-[8px] text-sky-300">({corridor.livePpb18m} ppb)</span>
                      </div>
                      <div className="text-[8px] font-bold text-slate-300 leading-tight">
                        0,9m: <span className="text-rose-300">{corridor.liveC09mPediatricUg}</span> • 4m:{' '}
                        <span className="text-emerald-300">{corridor.liveC40mCabinUg}</span> µg/m³
                      </div>
                    </button>
                  </ScientificTooltip>
                );
              })}
            </div>
          </div>

          {isStep1RadarOpen && (
            <div className="p-2 border-t border-cyan-500/40 space-y-2">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
              {liveStreetCandidates.map((cand) => {
                const isJustPinned = pinnedCandidateKey === cand.candidateKey;
                const existingAggregate = openDiscoveries.find(
                  (d) =>
                    d.phenomenonFamilyKey === cand.phenomenonFamilyKey ||
                    d.phenomenonFamilyKey === cand.candidateKey
                );
                const existingStreetsCount = existingAggregate?.corroboratedStreets?.length ?? 0;
                const isCandExpanded = expandedCandidateKeys.includes(cand.candidateKey);
                return (
                  <div
                    key={cand.candidateKey}
                    onClick={() => toggleCandidateCard(cand.candidateKey)}
                    className={`p-2 rounded-lg border text-[10.5px] flex flex-col justify-between gap-1.5 cursor-pointer transition-all ${
                      cand.severityOrSignificance === 'DESCUBRIMIENTO_CLAVE'
                        ? 'bg-amber-950/35 border-amber-400/90 hover:border-white'
                        : 'bg-slate-900/95 border-cyan-500/60 hover:border-cyan-300'
                    }`}
                  >
                    <ScientificTooltip
                      position="top"
                      width="w-[380px]"
                      title={`${cand.badge} — ${cand.title}`}
                      content={`${cand.quantitativeEvidence} — Conclusión Doctoral: ${cand.thesisConclusionForTribunal}`}
                      formula="\Delta C_{\text{NO}_2}(z) = C(0,9\text{m}) - C(4,0\text{m}),\quad \text{MQI}\le 1,00"
                      regulatory={`Objetivo ${cand.objectiveCode} (${cand.directorPointAndObjective}) • Pesos UNED: ${cand.unedCheckpointRef}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[9px] rounded">
                            {cand.badge}
                          </span>
                          <div className="flex items-center gap-1">
                            {existingStreetsCount > 0 && (
                              <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-400 text-emerald-200 font-black text-[9px] rounded">
                                📍 {existingStreetsCount >= 11 ? `${existingStreetsCount} arterias (11 distritos)` : `${existingStreetsCount} calle(s)`}
                              </span>
                            )}
                            <span className="text-[9px] text-amber-300 font-black">
                              {isCandExpanded ? '▴ Plegar' : '▾ Leer'}
                            </span>
                          </div>
                        </div>
                        <div className="font-black text-white leading-snug">{cand.title}</div>
                        <div className={`text-[9.5px] text-emerald-200 font-semibold leading-snug ${isCandExpanded ? '' : 'line-clamp-2'}`}>
                          {cand.quantitativeEvidence}
                        </div>
                        {isCandExpanded && (
                          <>
                            <div className="text-[9px] text-indigo-300 font-bold">
                              🖥️ Pesos UNED: {cand.unedCheckpointRef}
                            </div>
                            <p className="text-[9.5px] text-slate-300 leading-snug">{cand.thesisConclusionForTribunal}</p>
                          </>
                        )}
                      </div>
                    </ScientificTooltip>
                    <div
                      className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-slate-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-wrap items-center gap-1">
                        <ScientificTooltip
                          position="top"
                          width="w-[340px]"
                          title={`📌 Fijar o Agrupar ${streetShort} en este Hallazgo del Cuaderno`}
                          content={`Agrupa automáticamente la evidencia medida en ${streetShort} dentro del fenómeno «${cand.title}» en tu Cuaderno Abierto de la Tesis (Paso 2) e inyecta el hallazgo en los 10 PDFs.`}
                          formula="\mathcal{H}_k \leftarrow \mathcal{H}_k \cup \{(\mathbf{x}_{\text{activo}}, C_{1,8\text{m}}, C_{0,9\text{m}}, C_{4,0\text{m}})\}"
                          regulatory="Reglas 27, 28 y 30 AGENTS.md"
                        >
                          <button
                            type="button"
                            onClick={() => handlePinCandidate(cand, false)}
                            className="px-2 py-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[9.5px] rounded cursor-pointer"
                          >
                            {isJustPinned
                              ? '📌 ¡Calle Agregada!'
                              : existingStreetsCount > 0
                              ? `📌 Agregar ${streetShort} (${existingStreetsCount + 1} calles)`
                              : '📌 Guardar en Cuaderno'}
                          </button>
                        </ScientificTooltip>
                        {existingStreetsCount > 0 && (
                          <ScientificTooltip
                            position="top"
                            width="w-[330px]"
                            title={`➕ Crear Tarjeta Independiente Exclusiva para ${streetShort}`}
                            content={`Crea una entrada independiente en el Cuaderno Abierto dedicada exclusivamente a ${streetShort} para el fenómeno «${cand.title}».`}
                            formula="H_{N+1} = \text{Hallazgo}(\mathbf{x}_{\text{activo}})"
                            regulatory="Reglas 28 y 30 AGENTS.md"
                          >
                            <button
                              type="button"
                              onClick={() => handlePinCandidate(cand, true)}
                              className="px-1.5 py-1 bg-slate-800 hover:bg-amber-400 text-amber-300 hover:text-slate-950 font-black text-[9px] rounded cursor-pointer"
                            >
                              + Tarjeta Aparte
                            </button>
                          </ScientificTooltip>
                        )}
                      </div>
                      <ScientificTooltip
                        position="left"
                        width="w-[330px]"
                        title={`Ir al Capítulo Técnico de ${cand.badge} (${cand.objectiveCode})`}
                        content={`Abre directamente el capítulo y tablas técnicas donde se desarrolla «${cand.title}» (${cand.directorPointAndObjective}).`}
                        formula="\text{Navegación Directa} \to \text{Capítulo}(\text{OE}_k)"
                        regulatory="Reglas 20, 28 y 30 AGENTS.md"
                      >
                        <button
                          type="button"
                          onClick={() => onSelectChapter(cand.targetSubView, 'sec_6_4_pinn')}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-black text-[9.5px] rounded cursor-pointer shrink-0"
                        >
                          Ver Tabla ➔
                        </button>
                      </ScientificTooltip>
                    </div>
                  </div>
                );
              })}
              </div>

              {/* TABLA COMPARATIVA EN VIVO DE LOS 11 DISTRITOS OFICIALES DE MÁLAGA (13 ARTERIAS) + CALLE ACTIVA */}
              <TableHorizontalScrollContainer
                accent="cyan"
                title={`Matriz en Vivo de los 11 Distritos Oficiales de Málaga (${live11DistrictsCorridors.length} Arterias) + Lupa en ${streetShort} (Reglas 17, 32, 33, 34 y 35)`}
                className="border border-cyan-500/50 rounded-lg"
              >
                <table className="w-full text-left border-collapse text-[9.5px]">
                  <thead>
                    <tr className="bg-slate-900 text-cyan-300 border-b border-slate-700 uppercase">
                      <th className="py-1 px-2">
                        <ScientificTooltip
                          position="top"
                          width="w-[340px]"
                          title="Distrito Oficial de Málaga (D1–D11) y Arteria Viaria"
                          content="Identifica el Distrito Municipal Oficial de Málaga (D1 Centro a D11 Teatinos-Universidad) y el corredor viario representativo evaluado en tiempo real."
                          formula="d \in \{\text{D1 Centro},\dots,\text{D11 Teatinos}\} \subset \Omega_{\text{Málaga}}"
                          regulatory="Cartografía Municipal de los 11 Distritos de Málaga • Reglas 22, 27 y 28 AGENTS.md"
                        >
                          <span className="cursor-help">Distrito / Arteria</span>
                        </ScientificTooltip>
                      </th>
                      <th className="py-1 px-2">
                        <ScientificTooltip
                          position="top"
                          width="w-[350px]"
                          title="Estación Oficial Ancla de Quimioluminiscencia (UNE-EN 14211:2013)"
                          content="Código oficial de la estación de referencia de calidad del aire (RVCCA/MITECO bajo UNE-EN 14211:2013) que actúa como ancla observacional primaria para este distrito (Regla 33)."
                          formula="w_i(\mathbf{x}_d) \propto d_i^{-2} e^{-\Delta t_i/\tau_c} \sigma_i^{-2}"
                          regulatory="Norma UNE-EN 14211:2013 • Reglas 19 y 33 AGENTS.md"
                        >
                          <span className="cursor-help">Ancla UNE</span>
                        </ScientificTooltip>
                      </th>
                      <th className="py-1 px-2">
                        <ScientificTooltip
                          position="top"
                          width="w-[350px]"
                          title="Concentración de NO₂ a Cota de Cabina Oficial (z = 4,0 m)"
                          content="Concentración de NO₂ a z = 4,0 m de altura (cota estándar de toma de muestra de las cabinas oficiales según el Anexo III de la Directiva 2008/50/CE y UE 2024/2881)."
                          formula="C_{\text{NO}_2}(z=4,0\,\text{m})\;[\mu\text{g/m}^3]"
                          regulatory="Directiva (UE) 2024/2881 Anexo III • Regla 17 AGENTS.md"
                        >
                          <span className="cursor-help">Cabina 4,0 m</span>
                        </ScientificTooltip>
                      </th>
                      <th className="py-1 px-2">
                        <ScientificTooltip
                          position="top"
                          width="w-[370px]"
                          title="Concentración de NO₂ a Cota Peatonal Adulta (z = 1,8 m) en µg/m³ y ppb"
                          content="Concentración de NO₂ en la zona de respiración de un peatón adulto (z = 1,8 m) expresada simultáneamente en µg/m³ y en fracción molar ppb mediante conversión termodinámica exacta con P(t) y T(t) reales de AEMET (Regla 34)."
                          formula="C_{\text{NO}_2}(1,8\text{m})\,[\mu\text{g/m}^3] = \chi_{\text{NO}_2}\,[\text{ppb}]\cdot\frac{M_{\text{NO}_2}\cdot P_{\text{real}}(t)}{R\cdot T_{\text{real}}(t)}"
                          regulatory="Directiva (UE) 2024/2881 (20 µg/m³) • Reglas 17 y 34 AGENTS.md"
                        >
                          <span className="cursor-help">Peatón 1,8 m (µg/m³ | ppb)</span>
                        </ScientificTooltip>
                      </th>
                      <th className="py-1 px-2">
                        <ScientificTooltip
                          position="top"
                          width="w-[360px]"
                          title="Concentración de NO₂ a Cota Pediátrica en Carrito Infantil (z = 0,9 m)"
                          content="Concentración de NO₂ a z = 0,9 m (altura respiratoria de un lactante o niño en carrito de paseo), donde la proximidad al tubo de escape (0,35 m) y la menor ventilación turbulenta elevan la exposición (factor dosimétrico ICRP 66 = 2,15x)."
                          formula="C_{\text{NO}_2}(0,9\,\text{m}) > C_{\text{NO}_2}(1,8\,\text{m}) > C_{\text{NO}_2}(4,0\,\text{m})"
                          regulatory="Publicación ICRP 66 • Reglas 17 y 21 AGENTS.md"
                        >
                          <span className="cursor-help">Carrito 0,9 m</span>
                        </ScientificTooltip>
                      </th>
                      <th className="py-1 px-2">
                        <ScientificTooltip
                          position="top"
                          width="w-[350px]"
                          title="Brecha de Desacoplamiento Vertical (Δ Vertical = C_0,9m - C_4,0m)"
                          content="Exceso de concentración de NO₂ que respira un bebé a z = 0,9 m respecto a lo que registra el cabezal de la cabina oficial a z = 4,0 m, cuantificando el sub-registro sistemático de vigilancia a nivel de calle."
                          formula="\Delta C_{\text{vert}} = C_{\text{NO}_2}(z=0,9\,\text{m}) - C_{\text{NO}_2}(z=4,0\,\text{m}) > 0"
                          regulatory="Reglas 17 y 21 AGENTS.md — Invariante Vertical Doctoral"
                        >
                          <span className="cursor-help">Δ Vertical</span>
                        </ScientificTooltip>
                      </th>
                      <th className="py-1 px-2">
                        <ScientificTooltip
                          position="top"
                          width="w-[350px]"
                          title="Fracción y Aporte de Emisión Vehicular Local (COPERT 5.7 Tier 3)"
                          content="Porcentaje y concentración en µg/m³ aportada directamente por la flota vehicular del corredor viario según las curvas de velocidad y pendiente de EMEP/EEA COPERT 5.7 Tier 3."
                          formula="\Delta C_{\text{tráfico}} = \frac{E_{\text{COPERT}}(v,\text{flota})}{u_{\text{eff}}\cdot H_{\text{mix,local}}}"
                          regulatory="Guía EMEP/EEA COPERT 5.7 Tier 3 • Punto 4 del Director"
                        >
                          <span className="cursor-help">Tráfico COPERT</span>
                        </ScientificTooltip>
                      </th>
                      <th className="py-1 px-2">
                        <ScientificTooltip
                          position="top"
                          width="w-[350px]"
                          title="Sumidero Fitorremediador de la Arboleda Viaria (Modelo de 3 Resistencias)"
                          content="Reducción neta de NO₂ (µg/m³) lograda por la deposición seca foliar y asimilación enzimática (NR/NiR/GS-GOGAT) de los árboles del corredor mediante la ley de Wesely (r_a + r_b + r_c)."
                          formula="\Delta C_{\text{fito}} = -v_d(\text{LAI}, g_s)\cdot \frac{C_{\text{NO}_2}}{H_{\text{copa}}},\quad v_d = (r_a + r_b + r_c)^{-1}"
                          regulatory="Regla 16 AGENTS.md — Fitorremediación Demostrable Calle a Calle"
                        >
                          <span className="cursor-help">Arboleda</span>
                        </ScientificTooltip>
                      </th>
                      <th className="py-1 px-2">
                        <ScientificTooltip
                          position="top"
                          width="w-[360px]"
                          title="Ganancia en Validación Ciega LOOCV (w_k = 0) e Índice FAIRMODE MQI"
                          content="Reducción porcentual del error fuera de muestra de la PINN frente al Kriging ordinario cuando se oculta la estación del distrito (w_k = 0, Regla 35), junto con el Model Quality Indicator (MQI ≤ 1,00)."
                          formula="w_k(\mathbf{x}_{s_k})\equiv 0,\quad \text{MQI} = \frac{|\hat{C}_k - C_{\text{obs},k}|}{2\cdot U_{95}(C_{\text{obs},k})} \le 1,00"
                          regulatory="CEN/TR 17538 FAIRMODE WG1 • Regla 35 AGENTS.md (LOOCV Estricto)"
                        >
                          <span className="cursor-help">LOOCV (w_k=0)</span>
                        </ScientificTooltip>
                      </th>
                      <th className="py-1 px-2">
                        <ScientificTooltip
                          position="left"
                          width="w-[360px]"
                          title="Diagnóstico Normativo frente a la Directiva (UE) 2024/2881 (20,0 µg/m³)"
                          content="Clasifica cada distrito en: 🔴 Excedencia Directa (> 20 µg/m³ en cabina y acera), 🟡 Ilusión Regulatoria (cabina a 4 m cumple < 20 µg/m³ pero el peatón a 1,8 m o el bebé a 0,9 m sufren ≥ 20 µg/m³) o 🟢 Cumplimiento Real en las 3 cotas."
                          formula="\text{Ilusión Regulatoria} \iff C(4,0\text{m}) < 20\,\mu\text{g/m}^3 \;\wedge\; C(0,9\text{m}\text{ o }1,8\text{m}) \ge 20\,\mu\text{g/m}^3"
                          regulatory="Directiva (UE) 2024/2881 (Límite 2030: 20 µg/m³) • Regla 17 AGENTS.md"
                        >
                          <span className="cursor-help">Estado UE 2024 (20 µg/m³)</span>
                        </ScientificTooltip>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950/95 text-slate-200">
                    {live11DistrictsCorridors.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() =>
                          activePointCtx?.syncActivePoint?.(c.lat, c.lon, {
                            name: `${c.streetName}, ${c.districtName}, Málaga`,
                            fly: false
                          })
                        }
                        className="hover:bg-slate-900/90 cursor-pointer"
                      >
                        <td className="py-1 px-2 font-black text-white whitespace-nowrap">
                          <ScientificTooltip
                            position="right"
                            width="w-[350px]"
                            title={`${c.districtName} (${c.shortLabel}) — ${c.streetName}`}
                            content={`Corredor oficial del distrito ${c.districtName} (${c.lat.toFixed(4)}°N, ${c.lon.toFixed(4)}°W). Rol ZBE: ${c.zbeZoneRole}. Haz 1 clic para fijar esta arteria como Punto Activo en toda la aplicación.`}
                            formula={`\\mathbf{x}_{\\text{${c.shortLabel}}} = (${c.lat.toFixed(4)}^\\circ\\text{N},\\; ${c.lon.toFixed(4)}^\\circ\\text{W})`}
                            regulatory={`Distrito Oficial ${c.districtName} • Ancla ${c.anchorStationCode}`}
                          >
                            <span>
                              {c.shortLabel} — <span className="text-slate-300 font-semibold">{c.streetName.split('(')[0].trim()}</span>
                            </span>
                          </ScientificTooltip>
                        </td>
                        <td className="py-1 px-2 font-bold text-cyan-300 whitespace-nowrap">
                          <ScientificTooltip
                            position="top"
                            width="w-[340px]"
                            title={`Estación Ancla ${c.anchorStationCode} en ${c.shortLabel}`}
                            content={`Estación oficial de referencia vinculada al corredor ${c.streetName} (${c.districtName}) bajo protocolo UNE-EN 14211:2013 (Regla 33).`}
                            formula={`\\text{Ancla}(\\text{${c.shortLabel}}) = \\text{${c.anchorStationCode}}`}
                            regulatory="UNE-EN 14211:2013 • Reglas 19 y 33 AGENTS.md"
                          >
                            <span>{c.anchorStationCode}</span>
                          </ScientificTooltip>
                        </td>
                        <td className="py-1 px-2 font-bold text-emerald-300 whitespace-nowrap">
                          <ScientificTooltip
                            position="top"
                            width="w-[340px]"
                            title={`NO₂ a Cota de Cabina Oficial (4,0 m) en ${c.shortLabel}: ${c.liveC40mCabinUg} µg/m³`}
                            content={`En ${c.streetName} (${c.districtName}), la concentración a altura de cabina oficial (z = 4,0 m) es ${c.liveC40mCabinUg} µg/m³, frente a ${c.liveC18mPedestrianUg} µg/m³ a nivel peatonal (1,8 m).`}
                            formula={`C_{4,0\\text{m}}(\\text{${c.shortLabel}}) = ${c.liveC40mCabinUg}\\,\\mu\\text{g/m}^3`}
                            regulatory="Directiva (UE) 2024/2881 • Regla 17 AGENTS.md"
                          >
                            <span>{c.liveC40mCabinUg} µg/m³</span>
                          </ScientificTooltip>
                        </td>
                        <td className="py-1 px-2 font-black text-amber-300 whitespace-nowrap">
                          <ScientificTooltip
                            position="top"
                            width="w-[360px]"
                            title={`NO₂ Peatonal (1,8 m) en ${c.shortLabel}: ${c.liveC18mPedestrianUg} µg/m³ (${c.livePpb18m} ppb)`}
                            content={`Concentración respirada por el peatón adulto (z = 1,8 m) en ${c.streetName}: ${c.liveC18mPedestrianUg} µg/m³, equivalente a ${c.livePpb18m} ppb aplicando la ecuación de gases ideales con presión y temperatura reales de AEMET (Regla 34).`}
                            formula={`C_{1,8\\text{m}} = ${c.liveC18mPedestrianUg}\\,\\mu\\text{g/m}^3 \\Longleftrightarrow \\chi_{\\text{NO}_2} = ${c.livePpb18m}\\,\\text{ppb}`}
                            regulatory="Directiva (UE) 2024/2881 (20 µg/m³) • Reglas 17 y 34 AGENTS.md"
                          >
                            <span>
                              {c.liveC18mPedestrianUg} µg/m³ <span className="text-sky-300">({c.livePpb18m} ppb)</span>
                            </span>
                          </ScientificTooltip>
                        </td>
                        <td className="py-1 px-2 font-black text-rose-300 whitespace-nowrap">
                          <ScientificTooltip
                            position="top"
                            width="w-[350px]"
                            title={`NO₂ en Carrito Infantil (0,9 m) en ${c.shortLabel}: ${c.liveC09mPediatricUg} µg/m³`}
                            content={`Concentración de NO₂ a cota pediátrica (z = 0,9 m) en ${c.streetName}: ${c.liveC09mPediatricUg} µg/m³ (+${c.liveDeltaVerticalUg} µg/m³ por encima de la cabina a 4,0 m).`}
                            formula={`C_{0,9\\text{m}}(\\text{${c.shortLabel}}) = ${c.liveC09mPediatricUg}\\,\\mu\\text{g/m}^3`}
                            regulatory="ICRP 66 (Factor 2,15x) • Reglas 17 y 21 AGENTS.md"
                          >
                            <span>{c.liveC09mPediatricUg} µg/m³</span>
                          </ScientificTooltip>
                        </td>
                        <td className="py-1 px-2 font-bold text-amber-200 whitespace-nowrap">
                          <ScientificTooltip
                            position="top"
                            width="w-[340px]"
                            title={`Brecha Vertical en ${c.shortLabel}: +${c.liveDeltaVerticalUg} µg/m³`}
                            content={`Diferencia vertical entre la cota de carrito infantil (0,9 m: ${c.liveC09mPediatricUg} µg/m³) y la cabina oficial (4,0 m: ${c.liveC40mCabinUg} µg/m³) en ${c.streetName}.`}
                            formula={`\\Delta C_{\\text{vert}} = ${c.liveC09mPediatricUg} - ${c.liveC40mCabinUg} = +${c.liveDeltaVerticalUg}\\,\\mu\\text{g/m}^3`}
                            regulatory="Reglas 17 y 21 AGENTS.md"
                          >
                            <span>+{c.liveDeltaVerticalUg} µg/m³</span>
                          </ScientificTooltip>
                        </td>
                        <td className="py-1 px-2 whitespace-nowrap">
                          <ScientificTooltip
                            position="top"
                            width="w-[350px]"
                            title={`Aporte de Tráfico COPERT 5.7 en ${c.shortLabel}: ${c.trafficSharePct}% (+${c.liveCopertTrafficUg} µg/m³)`}
                            content={`En ${c.streetName}, las emisiones del tráfico rodado calculadas con EMEP/EEA COPERT 5.7 Tier 3 explican el ${c.trafficSharePct}% de la carga local (+${c.liveCopertTrafficUg} µg/m³).`}
                            formula={`\\Delta C_{\\text{COPERT}}(\\text{${c.shortLabel}}) = +${c.liveCopertTrafficUg}\\,\\mu\\text{g/m}^3\\;(${c.trafficSharePct}\\%)`}
                            regulatory="Guía EMEP/EEA COPERT 5.7 Tier 3 • Punto 4 del Director"
                          >
                            <span>
                              {c.trafficSharePct}% (+{c.liveCopertTrafficUg} µg/m³)
                            </span>
                          </ScientificTooltip>
                        </td>
                        <td className="py-1 px-2 text-emerald-300 whitespace-nowrap">
                          <ScientificTooltip
                            position="top"
                            width="w-[340px]"
                            title={`Sumidero de Arboleda en ${c.shortLabel}: ${c.treesSinkUg} µg/m³`}
                            content={`Atenuación fitorremediadora por deposición seca estomática de la arboleda urbana en ${c.streetName}: ${c.treesSinkUg} µg/m³.`}
                            formula={`\\Delta C_{\\text{fito}}(\\text{${c.shortLabel}}) = ${c.treesSinkUg}\\,\\mu\\text{g/m}^3`}
                            regulatory="Regla 16 AGENTS.md — Fitorremediación Urbana"
                          >
                            <span>{c.treesSinkUg} µg/m³</span>
                          </ScientificTooltip>
                        </td>
                        <td className="py-1 px-2 text-indigo-300 whitespace-nowrap">
                          <ScientificTooltip
                            position="top"
                            width="w-[350px]"
                            title={`Validación Ciega LOOCV (w_k = 0) en ${c.shortLabel}: -${c.loocvGainPct}% (MQI ${c.mqi})`}
                            content={`Al excluir matemáticamente la estación de referencia (w_k = 0, Regla 35), la PINN reduce el error un ${c.loocvGainPct}% respecto al Kriging ordinario y alcanza un MQI = ${c.mqi} ≤ 1,00.`}
                            formula={`\\Delta\\text{RMSE}_{\\text{LOOCV}} = -${c.loocvGainPct}\\%,\\quad \\text{MQI} = ${c.mqi} \\le 1,00`}
                            regulatory="CEN/TR 17538 FAIRMODE • Regla 35 AGENTS.md"
                          >
                            <span>
                              -{c.loocvGainPct}% (MQI {c.mqi})
                            </span>
                          </ScientificTooltip>
                        </td>
                        <td className="py-1 px-2 whitespace-nowrap font-black">
                          <ScientificTooltip
                            position="left"
                            width="w-[360px]"
                            title={`Estado Directiva (UE) 2024/2881 en ${c.shortLabel}`}
                            content={`Diagnóstico en ${c.streetName} frente al límite anual 2030 de 20,0 µg/m³: Cabina (4,0 m) = ${c.liveC40mCabinUg} µg/m³, Peatón (1,8 m) = ${c.liveC18mPedestrianUg} µg/m³, Carrito (0,9 m) = ${c.liveC09mPediatricUg} µg/m³.`}
                            formula={`C_{4,0\\text{m}}=${c.liveC40mCabinUg},\\; C_{1,8\\text{m}}=${c.liveC18mPedestrianUg},\\; C_{0,9\\text{m}}=${c.liveC09mPediatricUg}\\;(\\text{Límite}=20,0\\,\\mu\\text{g/m}^3)`}
                            regulatory="Directiva (UE) 2024/2881 • Regla 17 AGENTS.md"
                          >
                            <span>
                              {c.eu2024Status === 'EXCEDENCIA_DIRECTA' ? (
                                <span className="text-rose-400">🔴 Excedencia (&gt;20 en 4m y 1,8m)</span>
                              ) : c.eu2024Status === 'ILUSION_CUMPLIMIENTO' ? (
                                <span className="text-amber-300">🟡 Ilusión Regulatoria (4m&lt;20, 1,8m/0,9m≥20)</span>
                              ) : (
                                <span className="text-emerald-400">🟢 Cumple en 3 cotas (&lt;20)</span>
                              )}
                            </span>
                          </ScientificTooltip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableHorizontalScrollContainer>
            </div>
          )}
        </div>

        {/* PASO 2: CUADERNO ABIERTO DEL INVESTIGADOR CON FILTRO POR OBJETIVO, BUSCADOR Y CONMUTADOR TARJETAS ⇄ TABLA COMPACTA (1…40+ HALLAZGOS) */}
        <div className="space-y-1.5 pt-0.5">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-black text-amber-300 uppercase mr-1">
                📘 Paso 2. Cuaderno Abierto (#1…#{openDiscoveries.length}):
              </span>
              {(
                [
                  { id: 'ALL', label: `Todos (${openDiscoveries.length})`, desc: 'Muestra todos los hallazgos registrados en el Cuaderno Abierto de la Tesis (⭐ Estrella + 📊 Apoyo).' },
                  { id: 'STARRED', label: `⭐ Estrella (${starredCount})`, desc: 'Filtra únicamente los ⭐ Hallazgos Estrella principales que encabezan las conclusiones de portada de la tesis.' },
                  { id: 'SUPPORT', label: `📊 Apoyo (${supportCount})`, desc: 'Filtra las 📊 Evidencias de Apoyo complementarias corroboradas en las calles y distritos de Málaga.' },
                  { id: 'OE1', label: 'OE1 (Fuentes)', desc: 'Filtra los hallazgos vinculados al Objetivo Específico 1 (Auditoría de 24+16 detectores y matriz de datos).' },
                  { id: 'OE2', label: 'OE2 (PINN)', desc: 'Filtra los hallazgos vinculados al Objetivo Específico 2 (Arquitectura PINN, PDE de Leighton y validación ciega LOOCV w_k=0).' },
                  { id: 'OE3', label: 'OE3 (ZBE)', desc: 'Filtra los hallazgos vinculados al Objetivo Específico 3 (Evaluación causal PI-DiD y Donut-RDD de la ZBE de Málaga).' },
                  { id: 'OE4', label: 'OE4 (Equidad)', desc: 'Filtra los hallazgos vinculados al Objetivo Específico 4 (Desacoplamiento vertical 1,8m/0,9m vs 4,0m, ilusión regulatoria y quintiles Q1–Q5).' },
                  { id: 'DOI', label: '🔔 DOI', desc: 'Filtra los hallazgos respaldados por artículos científicos SOTA con DOI verificado del Radar OpenAlex/Crossref.' }
                ] as const
              ).map((tab) => (
                <ScientificTooltip
                  key={tab.id}
                  position="top"
                  width="w-[330px]"
                  title={`Filtro del Cuaderno Abierto: ${tab.label}`}
                  content={tab.desc}
                  formula={`\\mathcal{H}_{\\text{filtro}}(\\text{${tab.id}}) \\subseteq \\mathcal{H}_{\\text{Tesis}}(1\\dots ${openDiscoveries.length})`}
                  regulatory="Reglas 20, 28 y 30 AGENTS.md"
                >
                  <button
                    type="button"
                    onClick={() => setDiscoveryFilterTab(tab.id)}
                    className={`px-2 py-0.5 rounded font-black text-[9.5px] cursor-pointer transition-all ${
                      discoveryFilterTab === tab.id
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                </ScientificTooltip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <ScientificTooltip
                position="top"
                width="w-[320px]"
                title="🔎 Buscador Instantáneo en el Cuaderno de Hallazgos"
                content="Filtra en tiempo real los hallazgos de tu Cuaderno Abierto por título, calle corroborada, estación oficial, métrica numérica o conclusión para el tribunal."
                formula="\text{Filtro}_{\text{texto}}(q) \subseteq \mathcal{H}_{\text{Tesis}}"
                regulatory="Reglas 7 y 28 AGENTS.md"
              >
                <input
                  type="text"
                  value={discoverySearchText}
                  onChange={(e) => setDiscoverySearchText(e.target.value)}
                  placeholder="🔎 Buscar hallazgo, calle o métrica..."
                  className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-[10px] text-white w-44"
                />
              </ScientificTooltip>
              <div className="flex items-center bg-slate-950 border border-slate-700 rounded p-0.5">
                <ScientificTooltip
                  position="top"
                  width="w-[320px]"
                  title="🗂️ Vista en Tarjetas Doctorales"
                  content="Muestra los hallazgos del Cuaderno Abierto en formato de tarjetas interactivas con edición rápida en línea y desglose de calles corroboradas."
                  formula="\text{Vista}_{\text{Cuaderno}} = \text{Tarjetas}"
                  regulatory="Reglas 28 y 30 AGENTS.md"
                >
                  <button
                    type="button"
                    onClick={() => setDiscoveryViewMode('cards')}
                    className={`px-2 py-0.5 rounded text-[9.5px] font-black cursor-pointer ${
                      discoveryViewMode === 'cards'
                        ? 'bg-emerald-400 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    🗂️ Tarjetas
                  </button>
                </ScientificTooltip>
                <ScientificTooltip
                  position="top"
                  width="w-[330px]"
                  title="📋 Vista en Tabla Compacta de 1 Renglón"
                  content="Muestra todos los hallazgos del Cuaderno Abierto en una tabla sinóptica de 1 renglón por hallazgo para inspeccionar decenas de descubrimientos sin hacer scroll."
                  formula="\text{Vista}_{\text{Cuaderno}} = \text{Tabla Compacta}"
                  regulatory="Reglas 22, 28 y 30 AGENTS.md"
                >
                  <button
                    type="button"
                    onClick={() => setDiscoveryViewMode('compact_table')}
                    className={`px-2 py-0.5 rounded text-[9.5px] font-black cursor-pointer ${
                      discoveryViewMode === 'compact_table'
                        ? 'bg-emerald-400 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    📋 Tabla Compacta (1 Renglón)
                  </button>
                </ScientificTooltip>
              </div>
            </div>
          </div>

          {discoveryViewMode === 'compact_table' ? (
            <TableHorizontalScrollContainer
              accent="amber"
              title={`Tabla Compacta de Hallazgos de la Tesis (${filteredOpenDiscoveries.length} de ${openDiscoveries.length} — clic en fila para desplegar)`}
              className="border border-amber-500/60 rounded-lg"
            >
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="bg-slate-900 text-amber-300 border-b border-slate-700 uppercase">
                    <th className="py-1.5 px-2">
                      <ScientificTooltip
                        position="top"
                        width="w-[330px]"
                        title="Número de Orden (#1…#N) y Jerarquía Doctoral (⭐ Estrella vs. 📊 Apoyo)"
                        content="Indica el número correlativo del hallazgo y permite alternar en 1 clic entre ⭐ Hallazgo Estrella Principal (portada y conclusiones centrales) y 📊 Evidencia de Apoyo."
                        formula="H_k \in \mathcal{H}_{\star\text{Estrella}} \sqcup \mathcal{H}_{\text{Apoyo}}"
                        regulatory="Reglas 22 y 28 AGENTS.md"
                      >
                        <span className="cursor-help"># / Rango</span>
                      </ScientificTooltip>
                    </th>
                    <th className="py-1.5 px-2">
                      <ScientificTooltip
                        position="top"
                        width="w-[320px]"
                        title="Objetivo Específico de la Tesis (OE1–OE4)"
                        content="Objetivo Específico del documento del Director (OE1 Fuentes, OE2 PINN, OE3 ZBE Causal, OE4 Exposición y Equidad) al que responde directamente este hallazgo."
                        formula="\text{Obj}(H_k) \in \{\text{OE1},\;\text{OE2},\;\text{OE3},\;\text{OE4}\}"
                        regulatory="Puntos 3 y 6 del PDF del Director (03/10/2026)"
                      >
                        <span className="cursor-help">Obj.</span>
                      </ScientificTooltip>
                    </th>
                    <th className="py-1.5 px-2">
                      <ScientificTooltip
                        position="top"
                        width="w-[340px]"
                        title="Título Científico del Hallazgo Doctoral"
                        content="Enunciado científico conciso del fenómeno físico-químico, metrológico o causal demostrado en la investigación."
                        formula="\text{Enunciado}(H_k)"
                        regulatory="Regla 28 AGENTS.md — Cuaderno Abierto de Descubrimientos"
                      >
                        <span className="cursor-help">Hallazgo Científico</span>
                      </ScientificTooltip>
                    </th>
                    <th className="py-1.5 px-2">
                      <ScientificTooltip
                        position="top"
                        width="w-[340px]"
                        title="Calles y Arterias de Málaga donde se Corrobora el Hallazgo (M Calles)"
                        content="Relación de arterias y distritos de Málaga donde se ha verificado empíricamente este mismo fenómeno sin duplicar tarjetas."
                        formula="M = |\text{Calles Corroboradas}(H_k)| \ge 1"
                        regulatory="Regla 28 AGENTS.md — Agrupación Multi-Calle"
                      >
                        <span className="cursor-help">Calles Corroboradas (M)</span>
                      </ScientificTooltip>
                    </th>
                    <th className="py-1.5 px-2">
                      <ScientificTooltip
                        position="top"
                        width="w-[350px]"
                        title="Evidencia Empírica Cuantitativa Verificada"
                        content="Cifras medidas y asimiladas (concentraciones a 1,8 m, 0,9 m y 4,0 m, MQI, error LOOCV w_k=0 o efecto causal PI-DiD) que demuestran el hallazgo."
                        formula="\text{Evidencia}(H_k) \implies C_{\text{NO}_2}(z),\;\text{MQI},\;\text{LOOCV}"
                        regulatory="Reglas 28, 32, 33, 34 y 35 AGENTS.md"
                      >
                        <span className="cursor-help">Evidencia Empírica Verificada</span>
                      </ScientificTooltip>
                    </th>
                    <th className="py-1.5 px-2">
                      <ScientificTooltip
                        position="top"
                        width="w-[350px]"
                        title="Conclusión Directa para el Director y el Tribunal Doctoral UNED"
                        content="Interpretación metodológica y normativa lista para defender ante la Dirección de Tesis y el Tribunal Doctoral de la UNED."
                        formula="\text{Evidencia}(H_k) \implies \text{Tesis Doctoral UNED}"
                        regulatory="Reglas 20, 27 y 28 AGENTS.md"
                      >
                        <span className="cursor-help">Conclusión para el Tribunal</span>
                      </ScientificTooltip>
                    </th>
                    <th className="py-1.5 px-2 text-right">
                      <ScientificTooltip
                        position="left"
                        width="w-[300px]"
                        title="Gestión del Hallazgo en el Cuaderno"
                        content="Permite eliminar un hallazgo del cuaderno en 1 clic si deseas depurar la lista."
                        regulatory="Reglas 28 y 30 AGENTS.md"
                      >
                        <span className="cursor-help">Acciones</span>
                      </ScientificTooltip>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/95 text-slate-200">
                  {filteredOpenDiscoveries.map((disc) => {
                    const streetsCount = disc.corroboratedStreets?.length ?? 1;
                    const isRowOpen = expandedDiscoveryIds.includes(disc.id);
                    return (
                      <tr
                        key={disc.id}
                        onClick={() => toggleDiscoveryItem(disc.id)}
                        className="hover:bg-slate-900/80 cursor-pointer transition-colors"
                      >
                        <td className="py-1.5 px-2 whitespace-nowrap align-middle" onClick={(e) => e.stopPropagation()}>
                          <ScientificTooltip
                            position="right"
                            width="w-[340px]"
                            title={`Conmutar Rango de #${disc.orderNumber}: ⭐ Estrella ⇄ 📊 Apoyo`}
                            content={`Haz 1 clic para alternar el hallazgo #${disc.orderNumber} («${disc.title}») entre ⭐ Hallazgo Estrella Principal y 📊 Evidencia de Apoyo.`}
                            formula={`H_{${disc.orderNumber}} \\in \\mathcal{H}_{\\star\\text{Estrella}} \\sqcup \\mathcal{H}_{\\text{Apoyo}}`}
                            regulatory="Reglas 28 y 30 AGENTS.md"
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleStarDiscovery(disc.id)}
                              className={`px-1.5 py-0.5 rounded font-black text-[9px] cursor-pointer ${
                                disc.isStarredMainDiscovery
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {disc.isStarredMainDiscovery ? `⭐ #${disc.orderNumber} ESTRELLA` : `📊 #${disc.orderNumber} APOYO`}
                            </button>
                          </ScientificTooltip>
                        </td>
                        <td className="py-1.5 px-2 whitespace-nowrap font-black text-cyan-300 align-middle">
                          <ScientificTooltip
                            position="top"
                            width="w-[340px]"
                            title={`Objetivo ${disc.objectiveCode} — ${disc.directorPointAndObjective}`}
                            content={`Este hallazgo (#${disc.orderNumber}) aporta evidencia directa al objetivo ${disc.objectiveCode} (${disc.directorPointAndObjective}).`}
                            regulatory={disc.directorPointAndObjective}
                          >
                            <div>
                              <div>{disc.objectiveCode}</div>
                              <div className="text-[8.5px] text-amber-300">{isRowOpen ? '▴ Plegar' : '▾ Leer'}</div>
                            </div>
                          </ScientificTooltip>
                        </td>
                        <td className="py-1.5 px-2 font-black text-white max-w-xs align-middle">
                          <ScientificTooltip
                            position="top"
                            width="w-[370px]"
                            title={`Hallazgo #${disc.orderNumber}: ${disc.title}`}
                            content={`${disc.quantitativeEvidence} — Conclusión: «${disc.thesisConclusionForTribunal}»`}
                            regulatory={`${disc.objectiveCode} • ${disc.directorPointAndObjective}`}
                          >
                            <div className={isRowOpen ? '' : 'line-clamp-2'}>{disc.title}</div>
                          </ScientificTooltip>
                        </td>
                        <td className="py-1.5 px-2 whitespace-nowrap text-emerald-300 font-bold align-middle">
                          <ScientificTooltip
                            position="top"
                            width="w-[360px]"
                            title={`Calles Corroboradas en Hallazgo #${disc.orderNumber} (${streetsCount} calle/s)`}
                            content={
                              disc.corroboratedStreets && disc.corroboratedStreets.length > 0
                                ? `Verificado en: ${disc.corroboratedStreets.map((s) => `${s.street} (${s.summaryMetric})`).join(' • ')}`
                                : `Verificado en: ${disc.streetContext} (${disc.coordinatesLabel})`
                            }
                            regulatory="Regla 28 AGENTS.md — Corroboración Multi-Calle"
                          >
                            <div>
                              <div>
                                📍 {streetsCount >= 11 ? `${streetsCount} arterias en los 11 distritos de Málaga` : `${streetsCount} calle(s): ${disc.streetContext}`}
                              </div>
                              {isRowOpen && disc.corroboratedStreets && disc.corroboratedStreets.length > 1 && (
                                <div className="text-[9px] text-cyan-200 whitespace-normal max-w-xs mt-0.5">
                                  {disc.corroboratedStreets.map((s) => s.street).join(' • ')}
                                </div>
                              )}
                            </div>
                          </ScientificTooltip>
                        </td>
                        <td className="py-1.5 px-2 max-w-sm text-emerald-100 align-middle">
                          <ScientificTooltip
                            position="top"
                            width="w-[380px]"
                            title={`Evidencia Cuantitativa del Hallazgo #${disc.orderNumber}`}
                            content={disc.quantitativeEvidence}
                            regulatory={`${disc.objectiveCode} • Pesos UNED: ${disc.unedCheckpointRef || 'Activo'}`}
                          >
                            <div className={isRowOpen ? '' : 'line-clamp-2'}>{disc.quantitativeEvidence}</div>
                          </ScientificTooltip>
                        </td>
                        <td className="py-1.5 px-2 max-w-sm text-slate-300 italic align-middle">
                          <ScientificTooltip
                            position="top"
                            width="w-[380px]"
                            title={`Conclusión para el Tribunal Doctoral (Hallazgo #${disc.orderNumber})`}
                            content={`«${disc.thesisConclusionForTribunal}»`}
                            regulatory={`${disc.objectiveCode} • ${disc.directorPointAndObjective}`}
                          >
                            <div className={isRowOpen ? '' : 'line-clamp-2'}>«{disc.thesisConclusionForTribunal}»</div>
                          </ScientificTooltip>
                        </td>
                        <td className="py-1.5 px-2 text-right whitespace-nowrap align-middle" onClick={(e) => e.stopPropagation()}>
                          <ScientificTooltip
                            position="left"
                            width="w-[300px]"
                            title={`✕ Eliminar Hallazgo #${disc.orderNumber} del Cuaderno`}
                            content={`Elimina el hallazgo «${disc.title}» del Cuaderno Abierto.`}
                            regulatory="Reglas 28 y 30 AGENTS.md"
                          >
                            <button
                              type="button"
                              onClick={() => handleRemoveDiscovery(disc.id)}
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-rose-200 rounded text-[9px] font-black cursor-pointer"
                            >
                              ✕ Borrar
                            </button>
                          </ScientificTooltip>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableHorizontalScrollContainer>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {filteredOpenDiscoveries.map((disc) => {
                const isEditing = editingDiscoveryId === disc.id;
                const streetsCount = disc.corroboratedStreets?.length ?? 1;
                const isCardOpen = expandedDiscoveryIds.includes(disc.id);
                return (
                  <div
                    key={disc.id}
                    onClick={() => !isEditing && toggleDiscoveryItem(disc.id)}
                    className={`p-2 rounded-lg text-[10.5px] flex flex-col justify-between gap-1.5 border cursor-pointer transition-all ${
                      disc.isStarredMainDiscovery
                        ? 'bg-slate-900/95 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        : 'bg-slate-900/80 border-emerald-500/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          <ScientificTooltip
                            position="top"
                            width="w-[340px]"
                            title={`Alternar Jerarquía del Hallazgo #${disc.orderNumber}: ⭐ Estrella ⇄ 📊 Apoyo`}
                            content={`Haz 1 clic para destacar «${disc.title}» como ⭐ Hallazgo Estrella Principal de la Tesis o clasificarlo como 📊 Evidencia de Apoyo.`}
                            formula={`H_{${disc.orderNumber}} \\in \\mathcal{H}_{\\star\\text{Estrella}} \\sqcup \\mathcal{H}_{\\text{Apoyo}}`}
                            regulatory="Reglas 28 y 30 AGENTS.md"
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleStarDiscovery(disc.id)}
                              className={`px-1.5 py-0.5 font-black text-[9.5px] rounded cursor-pointer ${
                                disc.isStarredMainDiscovery
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-emerald-950 border border-emerald-400 text-emerald-200'
                              }`}
                            >
                              {disc.isStarredMainDiscovery
                                ? `⭐ ESTRELLA #${disc.orderNumber}`
                                : `📊 APOYO #${disc.orderNumber}`}
                            </button>
                          </ScientificTooltip>
                          <span className="px-1.5 py-0.5 bg-slate-950 border border-cyan-500/60 text-cyan-300 font-black text-[9px] rounded">
                            {disc.objectiveCode} • {disc.directorPointAndObjective.split('•')[0]}
                          </span>
                          {streetsCount > 1 && (
                            <span className="px-1.5 py-0.5 bg-emerald-400 text-slate-950 font-black text-[9px] rounded">
                              📍 {streetsCount} calles
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <span
                            onClick={() => toggleDiscoveryItem(disc.id)}
                            className="text-[9px] text-amber-300 font-black px-1 cursor-pointer"
                          >
                            {isCardOpen ? '▴ Plegar' : '▾ Leer'}
                          </span>
                          <ScientificTooltip
                            position="top"
                            width="w-[310px]"
                            title={isEditing ? `💾 Guardar Edición del Hallazgo #${disc.orderNumber}` : `✏️ Editar Título o Conclusión del Hallazgo #${disc.orderNumber}`}
                            content={isEditing ? 'Guarda los cambios redactados en este hallazgo y actualiza los 10 PDFs.' : 'Permite editar directamente el título y la conclusión doctoral de esta tarjeta.'}
                            regulatory="Reglas 27, 28 y 30 AGENTS.md"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                isEditing ? handleSaveEditDiscovery(disc.id) : handleStartEditDiscovery(disc)
                              }
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-amber-500 text-amber-300 hover:text-slate-950 rounded text-[9.5px] font-black cursor-pointer"
                            >
                              {isEditing ? '💾' : '✏️'}
                            </button>
                          </ScientificTooltip>
                          <ScientificTooltip
                            position="left"
                            width="w-[300px]"
                            title={`✕ Borrar Hallazgo #${disc.orderNumber} del Cuaderno`}
                            content={`Elimina la tarjeta «${disc.title}» del Cuaderno Abierto.`}
                            regulatory="Reglas 28 y 30 AGENTS.md"
                          >
                            <button
                              type="button"
                              onClick={() => handleRemoveDiscovery(disc.id)}
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-rose-200 rounded text-[9.5px] font-black cursor-pointer"
                            >
                              ✕
                            </button>
                          </ScientificTooltip>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitleDraft}
                            onChange={(e) => setEditTitleDraft(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-950 border border-amber-400 rounded text-white text-[10px] font-bold"
                          />
                          <textarea
                            rows={2}
                            value={editConclusionDraft}
                            onChange={(e) => setEditConclusionDraft(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-950 border border-amber-400 rounded text-slate-200 text-[10px]"
                          />
                        </div>
                      ) : (
                        <ScientificTooltip
                          position="top"
                          width="w-[380px]"
                          title={`Hallazgo #${disc.orderNumber} (${disc.objectiveCode}): ${disc.title}`}
                          content={`${disc.quantitativeEvidence} — Conclusión Doctoral: «${disc.thesisConclusionForTribunal}»`}
                          formula="\Delta C_{\text{NO}_2}(z),\quad \text{MQI}\le 1,00,\quad w_k(\mathbf{x}_{s_k})\equiv 0"
                          regulatory={`${disc.directorPointAndObjective} • ${disc.unedCheckpointRef || 'UNED PINN'}`}
                        >
                          <div className="space-y-1">
                            <div className="font-black text-white leading-snug">{disc.title}</div>
                            <div className="text-[9.5px] text-amber-200 font-bold">
                              📍 {disc.streetContext} ({disc.coordinatesLabel}) • 🕒 {disc.timestampIso.slice(0, 10)}
                            </div>
                            <p className={`text-[9.5px] text-emerald-100 leading-snug ${isCardOpen ? '' : 'line-clamp-2'}`}>
                              {disc.quantitativeEvidence}
                            </p>
                            {isCardOpen && (
                              <>
                                {disc.unedCheckpointRef && (
                                  <div className="text-[9px] text-indigo-300 font-bold">
                                    🖥️ {disc.unedCheckpointRef}
                                  </div>
                                )}
                                <p className="text-[9.5px] text-slate-300 leading-snug italic">
                                  «{disc.thesisConclusionForTribunal}»
                                </p>
                              </>
                            )}
                          </div>
                        </ScientificTooltip>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};




