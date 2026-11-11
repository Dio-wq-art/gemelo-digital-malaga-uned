import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Download, 
  CheckCircle2, 
  Award, 
  BookOpen, 
  FileText, 
  Compass, 
  Activity, 
  Wind,
  Maximize2,
  Minimize2,
  Sparkles,
  Bot,
  Zap,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Clock,
  MapPin,
  HeartPulse
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { MathFormula } from './MathFormula';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import { MeteoData, PhysicsResult, StationComparisonResult } from '../lib/physics';
import { EnkfAssimilationResult } from '../lib/enkfAssimilation';
import { generatePhDDefenseSlides, DefenseSlide } from '../lib/phdDefenseModel';
import { generateDoctoralThesisBeamerSlides } from '../lib/latexThesisExporter';
import { generateDoctoralRealtimeAdvice, DoctoralPointAdvice } from '../lib/aiDoctoralConsultant';
import { useActivePoint } from '../context/ActivePointContext';

export interface PhDDefenseWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  meteo: MeteoData;
  physics: PhysicsResult;
  enkf?: EnkfAssimilationResult;
  stationComparisons?: StationComparisonResult[];
  onOpenLatexModal?: () => void;
  onOpenPdfReportModal?: () => void;
}

export function PhDDefenseWalkthroughModal({
  isOpen,
  onClose,
  meteo,
  physics,
  enkf,
  stationComparisons = [],
  onOpenLatexModal,
  onOpenPdfReportModal
}: PhDDefenseWalkthroughModalProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'slides' | 'proofs' | 'ai_advice' | 'notes'>('slides');
  const [isAuditoriumMode, setIsAuditoriumMode] = useState<boolean>(false);
  const [showLaserPointer, setShowLaserPointer] = useState<boolean>(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const activePointCtx = useActivePoint();
  const currentPoint = activePointCtx?.activePoint;
  const lat = currentPoint?.lat ?? 36.7213;
  const lon = currentPoint?.lon ?? -4.4214;
  const streetName = currentPoint?.nearestStreetName || currentPoint?.name || 'Alameda Principal / Calle Larios, Málaga';

  const slides: DefenseSlide[] = generatePhDDefenseSlides(meteo, physics, enkf, stationComparisons, streetName, lat, lon);
  const currentSlide = slides[currentSlideIndex] || slides[0];

  const aiAdvice: DoctoralPointAdvice = generateDoctoralRealtimeAdvice(
    lat,
    lon,
    streetName,
    meteo,
    physics,
    enkf,
    stationComparisons
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'f' || e.key === 'F') {
        setIsAuditoriumMode((prev) => !prev);
      } else if (e.key === 'l' || e.key === 'L') {
        setShowLaserPointer((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, slides.length]);

  // Laser pointer mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showLaserPointer) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setLaserPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  if (!isOpen) return null;

  const handleDownloadBeamer = () => {
    const beamerCode = generateDoctoralThesisBeamerSlides({
      meteo,
      physics,
      enkf,
      stationComparisons
    });
    const blob = new Blob([beamerCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentacion_defensa_tesis_beamer.tex';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="SUITE DE DEFENSA DOCTORAL EN VIVO (Live PhD Defense, Beamer & Proofs Verifier)"
      subtitle="Tesis Doctoral UNED (EIDUNED) • Doctorando: Dionisio Gálvez Pozo • Diapositivas Académicas, Pruebas Físico-Matemáticas y Notas para el Tribunal"
      onClose={onClose}
      defaultCollapsed={true}
      className={isAuditoriumMode ? 'w-[98vw] h-[95vh] max-w-none' : 'w-[1020px] max-h-[92vh]'}
      icon={<GraduationCap className="w-4 h-4 text-amber-400" />}
      badge={
        <span className="bg-amber-950/80 border border-amber-500 text-amber-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
          <Award className="w-3 h-3 text-amber-400" />
          TRIBUNAL UNED • DIAPOSITIVA {currentSlide.number} / {slides.length}
        </span>
      }
    >
      <div 
        className="flex flex-col h-full bg-slate-950 text-slate-100 text-xs select-none relative overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        {/* Puntero Láser Virtual para Presentación */}
        {showLaserPointer && (
          <div 
            className="pointer-events-none absolute z-50 w-4 h-4 rounded-full bg-rose-500 shadow-[0_0_15px_4px_rgba(244,63,94,0.9)] transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
            style={{ left: laserPos.x, top: laserPos.y }}
          />
        )}

        {/* Banner de Sincronización Atómica del Punto Activo (Regla 10) */}
        <ActivePointSyncBanner compact={true} />

        {/* Barra Superior de Herramientas de Defensa */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900 border-b border-slate-800 text-xs font-mono">
          
          {/* Selector de Pestañas de la Suite */}
          <div className="flex items-center gap-1.5">
            <ScientificTooltip
              position="bottom"
              width="w-[320px]"
              title="Exposición Académica de Defensa Doctoral"
              content={`Presentación estructurada de ${slides.length} diapositivas académicas acopladas en vivo al punto activo (${streetName}) para la defensa ante el tribunal de la UNED.`}
              formula="\mathcal{L}_{\text{PINN}} = w_{\text{data}}\mathcal{L}_{\text{obs}} + w_{\text{PDE}}\|\mathcal{N}[C]\|^2"
              regulatory="RD 99/2011 Doctorado UNED / Directiva (UE) 2024/2881"
            >
              <button
                onClick={() => setActiveTab('slides')}
                className={`px-3 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'slides'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500 shadow-md shadow-amber-950/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>Diapositivas ({slides.length})</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              position="bottom"
              width="w-[340px]"
              title="Batería de Demostraciones Físico-Matemáticas"
              content={`Verificación formal determinista de las ${aiAdvice.proofs.length} pruebas físico-matemáticas (Ciclo de Leighton, Similitud de Monin-Obukhov, Vórtice de Oke, Dosimetría ICRP-66 y FAIRMODE WG1) evaluadas en tiempo real sobre ${streetName}.`}
              formula="\Phi = \frac{j_{\text{NO}_2}[\text{NO}_2]}{k_3(T)[\text{NO}][\text{O}_3]}, \quad \text{MQI} \le 1.00"
              regulatory="FAIRMODE WG1 (EUR 28245 EN) / CEN/TR 17536"
            >
              <button
                onClick={() => setActiveTab('proofs')}
                className={`px-3 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'proofs'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pruebas Matemáticas en Vivo ({aiAdvice.proofs.length})</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              position="bottom"
              width="w-[320px]"
              title="Prescripción Física ZBE & Dosimetría Peatonal"
              content="Diagnóstico mecanístico de mitigación urbana (gestión semafórica por vórtice, silvicultura NR/NiR/GS-GOGAT, acera de barlovento y asimilación satelital) para el punto activo."
              formula="\Delta C = -\eta_{\text{ZBE}} S_{\text{COPERT}} - v_d \frac{C}{H}"
              regulatory="Ley 7/2021 ZBE / Directrices OMS 2021"
            >
              <button
                onClick={() => setActiveTab('ai_advice')}
                className={`px-3 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'ai_advice'
                    ? 'bg-purple-950 text-purple-300 border border-purple-500 shadow-md shadow-purple-950/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span>Consejos IA & Mitigación ZBE</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              position="bottom"
              width="w-[300px]"
              title="Guion Epistemológico para el Tribunal"
              content="Notas metodológicas y réplicas estructuradas para responder con rigor a las cuestiones del tribunal durante el acto de defensa doctoral."
              regulatory="EIDUNED — Escuela Internacional de Doctorado UNED"
            >
              <button
                onClick={() => setActiveTab('notes')}
                className={`px-3 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'notes'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Notas de Defensa</span>
              </button>
            </ScientificTooltip>
          </div>

          {/* Botones de Control y Exportación Directa */}
          <div className="flex items-center gap-2">
            <ScientificTooltip position="bottom" width="w-[240px]" title="Puntero Láser Óptico" content="Activa/desactiva el puntero láser virtual sobre las diapositivas y ecuaciones para guiar la atención del tribunal (Atajo: Tecla L).">
              <button
                onClick={() => setShowLaserPointer((prev) => !prev)}
                className={`px-2 py-1.5 rounded border text-[11px] font-bold flex items-center gap-1 transition-all ${
                  showLaserPointer
                    ? 'bg-rose-950 text-rose-300 border-rose-500'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${showLaserPointer ? 'bg-rose-500 animate-ping' : 'bg-slate-600'}`} />
                <span>Puntero Láser (L)</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[240px]" title="Modo Proyector Sala de Grados" content="Expande la ventana a formato panorámico de auditorio (98vw × 95vh) para proyección directa ante el tribunal (Atajo: Tecla F).">
              <button
                onClick={() => setIsAuditoriumMode((prev) => !prev)}
                className="px-2 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded flex items-center gap-1 font-bold text-[11px]"
              >
                {isAuditoriumMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isAuditoriumMode ? 'Ventana' : 'Proyector (F)'}</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" title="Exportación LaTeX Beamer (.TEX)" content="Descarga el código fuente completo de la presentación en formato LaTeX Beamer (tema Madrid/UNED) listo para compilar en Overleaf o TeXLive." regulatory="Estándar Ciencia Abierta FAIR">
              <button
                onClick={handleDownloadBeamer}
                className="px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500 text-emerald-300 rounded flex items-center gap-1.5 font-bold text-[11px] transition-all shadow-[0_0_8px_rgba(16,185,129,0.2)] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Beamer (.TEX)</span>
              </button>
            </ScientificTooltip>

            {onOpenPdfReportModal && (
              <ScientificTooltip position="bottom" width="w-[260px]" title="Generador de Memoria PDF HD" content="Abre el generador e impresor de informes doctorales de alta resolución (PDF vectorial A4) sincronizado con el punto activo.">
                <button
                  onClick={onOpenPdfReportModal}
                  className="px-2.5 py-1.5 bg-purple-950 hover:bg-purple-900 border border-purple-500 text-purple-300 rounded flex items-center gap-1.5 font-bold text-[11px] transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">PDF HD UNED</span>
                </button>
              </ScientificTooltip>
            )}

            {onOpenLatexModal && (
              <ScientificTooltip position="bottom" width="w-[260px]" title="Exportador de Capítulos LaTeX/BibTeX" content="Abre el exportador modular de capítulos, tablas dinámicas, ecuaciones y bibliografía en LaTeX (.TEX/.BIB).">
                <button
                  onClick={onOpenLatexModal}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Memoria LaTeX</span>
                </button>
              </ScientificTooltip>
            )}
          </div>
        </div>

        {/* Contenido Principal según Pestaña */}
        <div className="p-4 space-y-4 font-mono text-slate-200 overflow-y-auto flex-1">
          
          {/* PESTAÑA 1: DIAPOSITIVAS DE DEFENSA */}
          {activeTab === 'slides' && (
            <div className="space-y-4">
              
              {/* Barra de Trackers de Diapositivas */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {slides.map((slide, idx) => (
                  <ScientificTooltip
                    key={slide.id}
                    position="bottom"
                    width="w-[300px]"
                    title={slide.title}
                    content={slide.subtitle}
                    formula={slide.scientificFormula}
                    regulatory={slide.regulatoryReference}
                  >
                    <button
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        idx === currentSlideIndex
                          ? 'bg-amber-950 text-amber-300 border border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-black">
                        {slide.number}
                      </span>
                      <span>{slide.categoryLabel}</span>
                    </button>
                  </ScientificTooltip>
                ))}
              </div>

              {/* Contenedor Estilo Diapositiva 16:9 */}
              <div className="bg-slate-950 border-2 border-slate-800 rounded-xl p-5 shadow-2xl relative space-y-4">
                
                {/* Cabecera de Diapositiva */}
                <div className="border-b border-slate-800 pb-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 max-w-[78%]">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-600 text-amber-300 font-bold text-[10px] uppercase tracking-wider">
                        Bloque {currentSlide.number} de {slides.length} • {currentSlide.categoryLabel}
                      </span>
                      {currentSlide.regulatoryReference && (
                        <span className="text-[10px] text-slate-400 truncate">
                          Marco: {currentSlide.regulatoryReference}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-slate-100 leading-snug">
                      {currentSlide.title}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {currentSlide.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded border border-amber-600">
                      Diapositiva {currentSlide.number} / {slides.length}
                    </span>
                  </div>
                </div>

                {/* Declaración Doctrinal de Tesis */}
                <div className="p-3 bg-slate-900/90 border-l-4 border-amber-500 rounded-r text-xs leading-relaxed text-amber-200">
                  <div className="font-bold text-[10px] uppercase text-amber-400 tracking-wider mb-0.5 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Declaración Doctrinal de Tesis Doctoral:</span>
                  </div>
                  {currentSlide.coreThesisStatement}
                </div>

                {/* Fórmulas y Telemetría Experimental en Tiempo Real */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* Caja de Formulación Matemática Renderizada con KaTeX */}
                  {currentSlide.scientificFormula && (
                    <ScientificTooltip
                      position="top"
                      width="w-[360px]"
                      title={currentSlide.formulaCaption || 'Ecuación Gobernante del Bloque'}
                      content={currentSlide.coreThesisStatement}
                      formula={currentSlide.scientificFormula}
                      regulatory={currentSlide.regulatoryReference}
                      className="block w-full"
                    >
                      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded space-y-1.5 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Layers className="w-3 h-3 text-sky-400" />
                            Formulación Matemática Formal
                          </span>
                          <span className="text-[9px] text-slate-500">Operador PDE / PINN</span>
                        </div>
                        <div className="py-2.5 px-3 bg-slate-950 border border-slate-800 rounded text-center text-sm text-sky-300 overflow-x-auto">
                          <MathFormula math={currentSlide.scientificFormula} displayMode={true} />
                        </div>
                        {currentSlide.formulaCaption && (
                          <p className="text-[10px] text-slate-400 text-center italic">
                            {currentSlide.formulaCaption}
                          </p>
                        )}
                      </div>
                    </ScientificTooltip>
                  )}

                  {/* Telemetría y Estado Asimilado en Vivo (Cero Mocking) */}
                  {currentSlide.liveExperimentalData && (
                    <div className="p-3 bg-slate-900/60 border border-slate-800 rounded space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Activity className="w-3 h-3 text-emerald-400" />
                          Telemetría Observacional Asimilada en Vivo
                        </span>
                        <span className="text-[9px] text-emerald-400 font-bold">100% Determinista</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {currentSlide.liveExperimentalData.map((item, idx) => (
                          <ScientificTooltip
                            key={idx}
                            position="top"
                            width="w-[280px]"
                            title={`Parámetro en Vivo: ${item.label}`}
                            content={`Valor determinista asimilado en tiempo real para ${streetName}: ${item.value}${item.badge ? ` (${item.badge})` : ''}.`}
                            regulatory={currentSlide.regulatoryReference}
                            className="block w-full"
                          >
                            <div className="p-2 bg-slate-950 border border-slate-800/80 rounded hover:border-emerald-700/60 transition-colors">
                              <div className="text-[9px] text-slate-400 truncate">{item.label}</div>
                              <div className="text-xs font-bold text-slate-200 mt-0.5 flex items-center justify-between">
                                <span>{item.value}</span>
                                {item.badge && (
                                  <span className="text-[8px] px-1 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-700 rounded">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          </ScientificTooltip>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Argumentación Clave para el Tribunal */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    Argumentación Clave para la Defensa ante el Tribunal Académico
                  </span>
                  <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded space-y-2">
                    {currentSlide.keyArgumentsForTribunal.map((arg, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300">{arg}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botones de Navegación de Diapositiva */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <ScientificTooltip position="top" width="w-[220px]" content="Retrocede a la diapositiva anterior (Tecla ← o RePág).">
                    <button
                      onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentSlideIndex === 0}
                      className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
                        currentSlideIndex === 0
                          ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 cursor-pointer'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Diapositiva Anterior</span>
                    </button>
                  </ScientificTooltip>

                  <span className="text-[10px] text-slate-500 hidden sm:inline">
                    Usa las teclas ← / → o Barra Espaciadora para navegar
                  </span>

                  <ScientificTooltip position="top" width="w-[220px]" content="Avanza a la siguiente diapositiva de defensa (Tecla → o Barra Espaciadora).">
                    <button
                      onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                      disabled={currentSlideIndex === slides.length - 1}
                      className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
                        currentSlideIndex === slides.length - 1
                          ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                          : 'bg-amber-900 hover:bg-amber-800 text-amber-200 border border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)] cursor-pointer'
                      }`}
                    >
                      <span>Siguiente Diapositiva</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </ScientificTooltip>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 2: PRUEBAS MATEMÁTICAS EN VIVO */}
          {activeTab === 'proofs' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-300 text-xs">
                    Batería de Pruebas y Demostraciones Físico-Matemáticas en Tiempo Real
                  </div>
                  <div className="text-[10.5px] text-slate-400">
                    Evaluación analítica determinista para el punto activo ({streetName}). Cero aleatoriedad / Cero simulación no verificada.
                  </div>
                </div>
                <ScientificTooltip
                  position="left"
                  width="w-[300px]"
                  title="Verificación Analítica en Tiempo Real"
                  content={`Las ${aiAdvice.proofs.length} pruebas se recalculan instantáneamente al cambiar el punto activo (${streetName}), acoplando meteorología AEMET, morfología OSM 3D y asimilación EnKF.`}
                  regulatory="Directiva (UE) 2024/2881 & FAIRMODE WG1"
                >
                  <span className="px-2 py-0.5 bg-emerald-900 text-emerald-300 border border-emerald-500 rounded text-[10px] font-bold">
                    {aiAdvice.proofs.length} PRUEBAS VERIFICADAS
                  </span>
                </ScientificTooltip>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {aiAdvice.proofs.map((proof, idx) => (
                  <div key={proof.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <ScientificTooltip
                          position="top"
                          width="w-[340px]"
                          title={proof.name}
                          content={proof.analyticalDemonstration}
                          formula={proof.theoremFormula}
                          regulatory={proof.normativeContext}
                        >
                          <span className="font-bold text-slate-200 text-xs hover:text-emerald-300 transition-colors">
                            {proof.name}
                          </span>
                        </ScientificTooltip>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ScientificTooltip
                          position="top"
                          width="w-[260px]"
                          title={`Estado: ${proof.status}`}
                          content={`Resultado verificado: ${proof.calculatedValue}. Nivel de confianza: ${proof.confidenceLevel}.`}
                          regulatory={proof.normativeContext}
                        >
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                            proof.status === 'COMPLIANT' ? 'bg-emerald-950 text-emerald-300 border-emerald-500' :
                            proof.status === 'VERIFIED' ? 'bg-cyan-950 text-cyan-300 border-cyan-500' :
                            'bg-amber-950 text-amber-300 border-amber-500'
                          }`}>
                            {proof.status}
                          </span>
                        </ScientificTooltip>
                        <span className="text-[9px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {proof.confidenceLevel}
                        </span>
                      </div>
                    </div>

                    <ScientificTooltip
                      position="top"
                      width="w-[360px]"
                      title={`Formulación: ${proof.name}`}
                      content={proof.analyticalDemonstration}
                      formula={proof.theoremFormula}
                      regulatory={proof.normativeContext}
                      className="block w-full"
                    >
                      <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded text-center text-xs text-emerald-300 overflow-x-auto hover:border-emerald-700/60 transition-colors">
                        <MathFormula math={proof.theoremFormula} displayMode={true} />
                      </div>
                    </ScientificTooltip>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {proof.analyticalDemonstration}
                    </p>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/60 text-slate-400">
                      <span className="text-emerald-400 font-bold font-mono">
                        Resultado: {proof.calculatedValue}
                      </span>
                      <span>Marco: {proof.normativeContext}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PESTAÑA 3: CONSEJOS IA Y PLAN DE MITIGACIÓN ZBE */}
          {activeTab === 'ai_advice' && (
            <div className="space-y-3">
              
              {/* Resumen Ejecutivo del Punto */}
              <div className="p-3 bg-purple-950/40 border border-purple-800 rounded space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-purple-300 text-xs">
                    <Bot className="w-4 h-4 text-purple-400" />
                    <span>Diagnóstico Doctoral Multidimensional (Telemetría en Vivo — {streetName})</span>
                  </div>
                  <ScientificTooltip
                    position="left"
                    width="w-[280px]"
                    title={`Nivel de Exposición: ${aiAdvice.exposureRiskLevel}`}
                    content="Clasificación determinista de riesgo respiratorio basada en umbrales de la Directiva (UE) 2024/2881 y Directrices OMS 2021 para NO₂ y PM₂.₅."
                    regulatory="Directiva (UE) 2024/2881 / Guías OMS 2021"
                  >
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${
                      aiAdvice.exposureRiskLevel === 'CRÍTICO' ? 'bg-rose-950 text-rose-300 border-rose-500' :
                      aiAdvice.exposureRiskLevel === 'ELEVADO' ? 'bg-amber-950 text-amber-300 border-amber-500' :
                      'bg-emerald-950 text-emerald-300 border-emerald-500'
                    }`}>
                      RIESGO: {aiAdvice.exposureRiskLevel}
                    </span>
                  </ScientificTooltip>
                </div>
                <p className="text-[11px] text-purple-100 leading-relaxed">
                  {aiAdvice.executiveSummary}
                </p>
              </div>

              {/* Evaluación Dosimétrica Peatonal ICRP-66 */}
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                <div className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-cyan-400" />
                  <span>Dosimetría Peatonal Respiratoria ICRP-66 (Cota Respiratoria z = 1.5 m)</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <ScientificTooltip
                    position="top"
                    width="w-[280px]"
                    title="Volumen Corriente Pulmonar (Vₜ)"
                    content="Volumen de aire movilizado en cada ciclo respiratorio de un peatón adulto en marcha urbana, ajustado por la cota topográfica MDE del punto activo."
                    formula="V_T = V_{T,0} \cdot (1 + \alpha_{\text{pendiente}} \Delta z_{\text{MDE}})"
                    regulatory="ICRP Publicación 66 (Human Respiratory Tract Model)"
                    className="block w-full"
                  >
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded">
                      <div className="text-[9.5px] text-slate-400">Volumen Corriente (Vₜ)</div>
                      <div className="font-bold text-slate-200 mt-0.5">{aiAdvice.dosimetricPedestrianAssessment.tidalVolumeL} Litros</div>
                    </div>
                  </ScientificTooltip>
                  <ScientificTooltip
                    position="top"
                    width="w-[280px]"
                    title="Frecuencia Respiratoria (fᵣ)"
                    content="Número de inspiraciones por minuto durante el tránsito peatonal activo en el cañón urbano seleccionado."
                    formula="\dot{V}_E = V_T \cdot f_R \quad [\text{L/min}]"
                    regulatory="ICRP Publicación 66"
                    className="block w-full"
                  >
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded">
                      <div className="text-[9.5px] text-slate-400">Frecuencia Respiratoria (fᵣ)</div>
                      <div className="font-bold text-slate-200 mt-0.5">{aiAdvice.dosimetricPedestrianAssessment.breathingRateMin} rpm</div>
                    </div>
                  </ScientificTooltip>
                  <ScientificTooltip
                    position="top"
                    width="w-[300px]"
                    title="Tasa de Dosis Inhalada de NO₂"
                    content="Masa de dióxido de nitrógeno que ingresa en el tracto respiratorio por hora de exposición en la cota peatonal z = 1.5 m."
                    formula="\dot{D}_{\text{NO}_2} = C_{\text{NO}_2}(z=1.5\,\text{m}) \cdot \dot{V}_E"
                    regulatory="Directiva (UE) 2024/2881 / Guías OMS 2021"
                    className="block w-full"
                  >
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded">
                      <div className="text-[9.5px] text-slate-400">Dosis Inhalada NO₂</div>
                      <div className="font-bold text-rose-400 mt-0.5">{aiAdvice.dosimetricPedestrianAssessment.no2InhalationDosePerHourMicrograms.toFixed(2)} µg/h</div>
                    </div>
                  </ScientificTooltip>
                  <ScientificTooltip
                    position="top"
                    width="w-[300px]"
                    title="Deposición Alveolar Profunda de PM₂.₅"
                    content="Masa de aerosol fino que alcanza y se deposita en la región alveolar-intersticial según la fracción de retención de ICRP-66."
                    formula="\dot{D}_{\text{alv}} = C_{\text{PM}_{2.5}} \cdot \dot{V}_E \cdot \eta_{\text{alv}}"
                    regulatory="ICRP Publicación 66 / OMS 2021"
                    className="block w-full"
                  >
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded">
                      <div className="text-[9.5px] text-slate-400">Dosis Alveolar PM₂.₅</div>
                      <div className="font-bold text-amber-400 mt-0.5">{aiAdvice.dosimetricPedestrianAssessment.pm25AlveolarDosePerHourMicrograms.toFixed(2)} µg/h</div>
                    </div>
                  </ScientificTooltip>
                </div>
                <div className="p-2 bg-slate-950 border border-slate-800/80 rounded flex items-center justify-between text-[10.5px]">
                  <span className="text-slate-300">Acera recomendada para tránsito peatonal ({streetName}):</span>
                  <ScientificTooltip
                    position="top"
                    width="w-[300px]"
                    title="Selección de Acera de Barlovento"
                    content="En un vórtice de recirculación de Oke (1988), la acera de barlovento recibe aire descendente limpio de la capa superior, reduciendo drásticamente la dosis inhalada frente a sotavento."
                    formula="C_{\text{lee}} = C_{\text{wind}} \cdot \left(1 + \alpha_{\text{Oke}} \frac{H}{W}\right)"
                    regulatory="CEN/TR 17536 Microscale Street Canyon"
                  >
                    <span className="font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                      {aiAdvice.dosimetricPedestrianAssessment.recommendedSidewalk}
                    </span>
                  </ScientificTooltip>
                </div>
              </div>

              {/* Acciones de Mitigación ZBE Detalladas */}
              <div className="space-y-2">
                <div className="font-bold text-slate-200 text-xs">
                  Plan Maestro Didáctico de Mitigación Urbana (4 Ejes Físicos):
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {aiAdvice.actions.map((act, idx) => (
                    <ScientificTooltip
                      key={idx}
                      position="top"
                      width="w-[340px]"
                      title={act.actionTitle}
                      content={`${act.physicalRationale} Evidencia: ${act.empiricalEvidence}.`}
                      regulatory={act.empiricalEvidence}
                      className="block w-full"
                    >
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1.5 hover:border-purple-700/60 transition-colors h-full">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="text-[10px] font-bold text-emerald-400">{act.domainLabel}</span>
                          <span className="px-1.5 py-0.2 rounded text-[8.5px] bg-slate-950 text-amber-300 border border-slate-800">
                            {act.priority}
                          </span>
                        </div>
                        <div className="font-bold text-slate-100 text-xs">{act.actionTitle}</div>
                        <p className="text-[10.5px] text-slate-300 leading-relaxed">{act.physicalRationale}</p>
                        <div className="p-1.5 bg-slate-950 border border-slate-800/80 rounded text-[9.5px] text-emerald-300 font-mono">
                          Objetivo: {act.quantitativeTarget} ({act.expectedReductionEffect})
                        </div>
                      </div>
                    </ScientificTooltip>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 4: NOTAS DE DEFENSA PARA EL CANDIDATO */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              <div className="p-3 bg-cyan-950/40 border border-cyan-800 rounded">
                <div className="font-bold text-cyan-300 text-xs">
                  Notas de Defensa y Argumentación Epistemológica para el Tribunal Académico
                </div>
                <div className="text-[10.5px] text-slate-400">
                  Directrices doctrinales para responder preguntas técnicas durante la defensa de la tesis doctoral en la UNED.
                </div>
              </div>

              <div className="space-y-3">
                {slides.map((s) => (
                  <ScientificTooltip
                    key={s.id}
                    position="top"
                    width="w-[340px]"
                    title={`Guion de Defensa — Diapositiva ${s.number}`}
                    content={s.coreThesisStatement}
                    formula={s.scientificFormula}
                    regulatory={s.regulatoryReference}
                    className="block w-full"
                  >
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1.5 hover:border-cyan-700/60 transition-colors">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="font-bold text-amber-300 text-xs">Diapositiva {s.number}: {s.title}</span>
                        <span className="text-[9.5px] text-slate-400">{s.categoryLabel}</span>
                      </div>
                      {s.defenseNotesForCandidate && s.defenseNotesForCandidate.length > 0 ? (
                        <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                          {s.defenseNotesForCandidate.map((n, idx) => (
                            <li key={idx} className="leading-relaxed">{n}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[10.5px] text-slate-400 italic">
                          Demostrar el cumplimiento analítico de las ecuaciones de Navier-Stokes y los objetivos de calidad FAIRMODE MQI ≤ 1.0.
                        </p>
                      )}
                    </div>
                  </ScientificTooltip>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </DraggableWindow>
  );
}
