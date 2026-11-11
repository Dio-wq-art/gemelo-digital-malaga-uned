import React, { useState } from 'react';
import { BookOpen, Copy, Download, Check, FileText, Table, Sigma, Layers, ChevronDown, ChevronUp, Sparkles, Archive, Loader2 } from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { LatexCompilationDiagram } from './LatexCompilationDiagram';
import { MeteoData, PhysicsResult, StationComparisonResult } from '../lib/physics';
import { EnkfAssimilationResult } from '../lib/enkfAssimilation';
import { 
  generateDoctoralThesisLatexDocument, 
  generateThesisTablesLatex,
  generateThesisEquationsLatex,
  generateDoctoralThesisBibtex,
  generateDoctoralThesisBeamerSlides,
  generateDoctoralThesisQ1Manuscripts
} from '../lib/latexThesisExporter';
import { generateDoctoralPdfReport } from '../lib/pdfReportGenerator';
import { generateFairResearchBundleZip } from '../lib/fairResearchBundleZip';
import { useActivePoint } from '../context/ActivePointContext';

export interface LatexThesisExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  meteo: MeteoData;
  physics: PhysicsResult;
  enkf?: EnkfAssimilationResult;
  stationComparisons?: StationComparisonResult[];
}

type TabType = 'full_tex' | 'beamer_tex' | 'tables_tex' | 'equations_tex' | 'bib' | 'q1_papers_tex';

export function LatexThesisExporterModal({
  isOpen,
  onClose,
  meteo,
  physics,
  enkf,
  stationComparisons
}: LatexThesisExporterModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('full_tex');
  const [copied, setCopied] = useState<boolean>(false);
  const [showPipelineDiagram, setShowPipelineDiagram] = useState<boolean>(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState<boolean>(false);
  const activeCtx = useActivePoint();

  if (!isOpen) return null;

  const exportData = {
    meteo,
    physics,
    enkf,
    stationComparisons,
    activePoint: activeCtx?.activePoint,
    assimilation: activeCtx?.assimilation,
    location: activeCtx?.location
  };

  const fullLatexCode = generateDoctoralThesisLatexDocument(exportData);
  const beamerLatexCode = generateDoctoralThesisBeamerSlides(exportData);
  const tablesLatexCode = generateThesisTablesLatex(exportData);
  const equationsLatexCode = generateThesisEquationsLatex();
  const bibtexCode = generateDoctoralThesisBibtex();
  const q1PapersLatexCode = generateDoctoralThesisQ1Manuscripts(exportData);

  const getCurrentCode = (): string => {
    switch (activeTab) {
      case 'full_tex':
        return fullLatexCode;
      case 'beamer_tex':
        return beamerLatexCode;
      case 'tables_tex':
        return tablesLatexCode;
      case 'equations_tex':
        return equationsLatexCode;
      case 'bib':
        return bibtexCode;
      case 'q1_papers_tex':
        return q1PapersLatexCode;
    }
  };

  const getCurrentFilename = (): string => {
    switch (activeTab) {
      case 'full_tex':
        return 'anexo_asimilacion_tesis_malaga.tex';
      case 'beamer_tex':
        return 'presentacion_defensa_tesis_beamer.tex';
      case 'tables_tex':
        return 'tablas_metodologicas_tesis.tex';
      case 'equations_tex':
        return 'ecuaciones_gobierno_gemelo_digital.tex';
      case 'bib':
        return 'referencias_tesis_malaga.bib';
      case 'q1_papers_tex':
        return 'manuscritos_articulos_q1_malaga.tex';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const code = getCurrentCode();
    const filename = getCurrentFilename();
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
    try {
      setIsGeneratingZip(true);
      const zipBlob = await generateFairResearchBundleZip({
        meteo,
        physics,
        stationComparisons,
        activePoint: activeCtx?.activePoint,
        assimilation: activeCtx?.assimilation,
        location: activeCtx?.location,
        includeLatex: true,
        includeCsv: true,
        includeGeoJson: true,
        includeProvenance: true
      });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proyecto_tesis_doctoral_malaga_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al generar paquete ZIP de tesis:", err);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleDownloadPdf = () => {
    const activeLat = activeCtx?.activePoint?.lat ?? activeCtx?.location?.lat ?? 36.7196;
    const activeLon = activeCtx?.activePoint?.lon ?? activeCtx?.location?.lon ?? -4.4200;
    const streetName = activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name || 'Calle Marqués de Larios';
    const pdf = generateDoctoralPdfReport({
      meteo,
      physics,
      enkf,
      stationComparisons,
      activePoint: activeCtx?.activePoint,
      assimilation: activeCtx?.assimilation,
      mapMeta: {
        lat: activeLat,
        lon: activeLon,
        zoom: 16.5,
        pitch: 60,
        bearing: -45,
        baseStyle: 'google_hybrid',
        activeLayers: ['Edificios 3D OSM'],
        streetName
      }
    });
    pdf.save('informe_tecnico_asimilacion_gemelo_digital_malaga.pdf');
  };

  return (
    <DraggableWindow
      title="EXPORTADOR ACADÉMICO PARA TESIS DOCTORAL (LaTeX .TEX / BibTeX .BIB)"
      onClose={onClose}
      className="w-[920px] max-h-[88vh]"
      icon={<BookOpen className="w-4 h-4 text-emerald-400" />}
    >
      <div className="p-4 space-y-3 text-xs font-mono text-slate-200">
        
        {/* Toggle Diagram Button */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Pipeline de Compilación Académica (LaTeX / Overleaf / BibTeX)
            </span>
          </div>
          <button
            onClick={() => setShowPipelineDiagram(!showPipelineDiagram)}
            className="flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 font-semibold transition-colors"
          >
            {showPipelineDiagram ? (
              <>
                <span>Ocultar Diagrama</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Ver Diagrama de Flujo</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Optional LaTeX Compilation Diagram */}
        {showPipelineDiagram && (
          <div className="animate-in fade-in duration-200">
            <LatexCompilationDiagram />
          </div>
        )}

        {/* Controls and Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900 border border-slate-800 rounded">
          <div className="flex items-center gap-1.5 flex-wrap">
            <ScientificTooltip position="bottom" width="w-[280px]" content="Capítulo completo en LaTeX con preámbulo, estructura book/report, secciones teóricas y tablas acopladas.">
              <button
                onClick={() => setActiveTab('full_tex')}
                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'full_tex' ? 'bg-emerald-950/90 border border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Documento (.TEX)</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Presentación formal de diapositivas en LaTeX Beamer (\documentclass{beamer}) con esquema de 8 frames, ecuaciones y validación FAIRMODE para la defensa de tesis.">
              <button
                onClick={() => setActiveTab('beamer_tex')}
                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'beamer_tex' ? 'bg-amber-950/90 border border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Beamer Diapositivas (.TEX)</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Fichero modular con tablas booktabs listas para incrustar (\input{tablas.tex}) con métricas FAIRMODE e intercomparación de estaciones.">
              <button
                onClick={() => setActiveTab('tables_tex')}
                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'tables_tex' ? 'bg-emerald-950/90 border border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <Table className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tablas (.TEX)</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Fichero modular con las ecuaciones analíticas de advección-difusión PDE, Monin-Obukhov MOST, Leighton y EnKF.">
              <button
                onClick={() => setActiveTab('equations_tex')}
                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'equations_tex' ? 'bg-emerald-950/90 border border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <Sigma className="w-3.5 h-3.5 text-amber-400" />
                <span>Ecuaciones (.TEX)</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Fichero BibTeX (.bib) con todas las citas académicas citadas (Pankow, Wesely, Raissi PINN, FAIRMODE WG1, Evensen EnKF, Seinfeld-Pandis).">
              <button
                onClick={() => setActiveTab('bib')}
                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'bib' ? 'bg-emerald-950/90 border border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>Referencias (.BIB)</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[300px]" content="Manuscritos completos en formato LaTeX para los 2 artículos científicos Q1 propuestos: 1. Química Multifásica Litoral (ACP/ES&T) • 2. Dinámica Microescalar FNO-3D y TIBL (JCP/Nat. Mach. Intell.).">
              <button
                onClick={() => setActiveTab('q1_papers_tex')}
                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'q1_papers_tex' ? 'bg-cyan-950/90 border border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)]' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-cyan-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Papers Q1 (.TEX)</span>
              </button>
            </ScientificTooltip>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ScientificTooltip position="bottom" width="w-[240px]" content="Copia el fragmento o documento actual al portapapeles.">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-200 flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Descarga directa del fichero individual actualmente seleccionado.">
              <button
                onClick={handleDownload}
                className="px-2.5 py-1.5 bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-500 text-emerald-200 rounded flex items-center gap-1.5 font-bold transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar {activeTab === 'bib' ? '.BIB' : '.TEX'}</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Descarga en un único archivo comprimido .zip todos los ficheros LaTeX (.tex), BibTeX (.bib), Beamer, tablas y papers Q1 listos para Overleaf.">
              <button
                onClick={handleDownloadAll}
                disabled={isGeneratingZip}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 border border-slate-600 text-slate-200 rounded flex items-center gap-1.5 font-bold transition-all cursor-pointer"
              >
                {isGeneratingZip ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    <span>Generando .ZIP...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Bundle Tesis (.ZIP)</span>
                  </>
                )}
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[300px]" content="Genera un informe vectorial oficial en formato PDF con tablas, micrometeorología MOST, EnKF y FAIRMODE.">
              <button
                onClick={handleDownloadPdf}
                className="px-2.5 py-1.5 bg-sky-900/80 hover:bg-sky-800 border border-sky-500 text-sky-200 rounded flex items-center gap-1.5 font-bold transition-all shadow-[0_0_10px_rgba(56,189,248,0.2)]"
              >
                <FileText className="w-3.5 h-3.5 text-sky-300" />
                <span>Informe PDF</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Code Viewer */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] leading-relaxed text-slate-300 h-[440px] overflow-y-auto whitespace-pre selection:bg-emerald-900 selection:text-emerald-100">
          {getCurrentCode()}
        </div>
      </div>
    </DraggableWindow>
  );
}
