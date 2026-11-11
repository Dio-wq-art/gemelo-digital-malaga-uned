import React, { useState } from 'react';
import { 
  GraduationCap, 
  ShieldCheck, 
  Award, 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  Download, 
  Info, 
  Sparkles, 
  FileText,
  ChevronRight
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import { getTribunalQuestions, TribunalQuestion } from '../lib/tribunalDefenseAdvisor';
import Papa from 'papaparse';

interface TribunalDefenseAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  dragConstraintsRef?: React.RefObject<any>;
}

export const TribunalDefenseAdvisorModal: React.FC<TribunalDefenseAdvisorModalProps> = ({
  isOpen,
  onClose,
  dragConstraintsRef
}) => {
  const [questions] = useState<TribunalQuestion[]>(getTribunalQuestions());
  const [selectedId, setSelectedId] = useState<string>(questions[0].id);

  const activeQ = questions.find(q => q.id === selectedId) || questions[0];

  const handleExportCSV = () => {
    const csvData = questions.map(q => ({
      ID: q.id,
      Categoria: q.category,
      Revisor: q.reviewerPersona,
      Pregunta: q.questionText,
      Argumento_Defensa: q.defenseArgument,
      Demostracion_Matematica: q.mathematicalProof,
      Referencia_Normativa: q.normativeReference,
      Puntuacion_Confianza: q.confidenceScore
    }));

    const csvString = Papa.unparse(csvData);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tribunal_defensa_eiduned_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportLatex = () => {
    const latexSnippet = `\\begin{table}[htbp]
\\centering
\\caption{Preguntas Simuladas del Tribunal de Tesis Doctoral y Argumentos de Defensa (EIDUNED)}
\\begin{tabular}{lll}
\\hline
Categoría & Pregunta de Revisores & Argumento Formal de Defensa \\\\ \\hline
${questions.map(q => `${q.category} & ${q.questionText} & ${q.defenseArgument} \\\\`).join('\n')}
\\hline
\\end{tabular}
\\label{tab:tribunal_defense_q1}
\\end{table}`;

    const blob = new Blob([latexSnippet], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tribunal_defensa_thesis.tex`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="Simulador de Defensa de Tesis & Tribunal EIDUNED (Q1 Review)"
      onClose={onClose}
      defaultCollapsed={true}
      dragConstraintsRef={dragConstraintsRef}
    >
      <div className="space-y-4 p-4 text-xs font-sans text-slate-200">
        <ActivePointSyncBanner />

        {/* Barra Superior Informativa */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="font-bold text-slate-100 flex items-center gap-2">
                <span>Preparación de Defensa de Tesis Doctoral (UNED / EIDUNED)</span>
                <ScientificTooltip content="Simulador de preguntas críticas de revisores internacionales y tribunal académico con demostraciones matemáticas formales y trazabilidad normativa.">
                  <span className="cursor-help px-1.5 py-0.5 bg-emerald-950 border border-emerald-700 text-emerald-300 font-mono text-[9px] rounded">
                    TRIBUNAL Q1
                  </span>
                </ScientificTooltip>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Garantía de rigor metodológico, ecuaciones de gobierno y cumplimiento FAIRMODE.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ScientificTooltip position="bottom" width="w-[260px]" content="Exporta las preguntas simuladas, perfiles de revisores, demostraciones matemáticas y referencias normativas en CSV estructurado FAIR.">
              <button
                onClick={handleExportCSV}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono flex items-center gap-1 text-slate-200 rounded transition-colors"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>CSV (FAIR)</span>
              </button>
            </ScientificTooltip>
            <ScientificTooltip position="bottom" width="w-[260px]" content="Exporta la tabla completa de defensa en código LaTeX tabular listo para compilar en el anexo de la memoria doctoral.">
              <button
                onClick={handleExportLatex}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono flex items-center gap-1 text-slate-200 rounded transition-colors"
              >
                <FileText className="w-3 h-3 text-indigo-400" />
                <span>LaTeX Tribunal</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Dos Columnas: Lista de Preguntas vs Detalle de Defensa */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Columna Izquierda: Preguntas */}
          <div className="md:col-span-5 space-y-1.5">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-bold px-1 mb-1">
              Preguntas Clave del Tribunal ({questions.length})
            </div>
            {questions.map(q => (
              <ScientificTooltip
                key={q.id}
                position="right"
                width="w-[280px]"
                content={`Revisor: ${q.reviewerPersona}. Referencia: ${q.normativeReference}. Nivel de confianza: ${q.confidenceScore}%.`}
              >
                <button
                  onClick={() => setSelectedId(q.id)}
                  className={`w-full text-left p-2.5 rounded border transition-all flex items-center justify-between cursor-pointer ${
                    selectedId === q.id
                      ? 'bg-emerald-950/80 border-emerald-500 text-slate-100 shadow'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="text-[9px] font-mono text-emerald-400 font-bold">{q.category}</div>
                    <div className="font-bold text-xs mt-0.5 line-clamp-1">{q.questionText}</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-300">
                    <span>{q.confidenceScore}%</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </ScientificTooltip>
            ))}
          </div>

          {/* Columna Derecha: Detalle y Argumento Formal */}
          <div className="md:col-span-7 bg-slate-950/80 border border-slate-800 p-3 rounded-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded font-bold">
                  {activeQ.category}
                </span>
                <h4 className="font-bold text-slate-100 text-xs mt-1">
                  {activeQ.reviewerPersona}
                </h4>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-mono text-slate-400">Nivel de Confianza:</div>
                <div className="text-sm font-bold text-emerald-400 font-mono">{activeQ.confidenceScore}% (Robusto)</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 block font-bold">Pregunta del Tribunal:</span>
              <p className="text-xs text-slate-200 italic bg-slate-900/60 p-2.5 border border-slate-800/80 rounded">
                "{activeQ.questionText}"
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-emerald-400 block font-bold">Argumento Formal de Defensa:</span>
              <p className="text-xs text-slate-300 bg-emerald-950/20 p-2.5 border border-emerald-900/50 rounded leading-relaxed">
                {activeQ.defenseArgument}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-cyan-400 block font-bold">Demostración Matemática / Ecuación Clave:</span>
              <div className="p-2 bg-black/60 border border-slate-800 font-mono text-cyan-300 text-[11px] rounded">
                {activeQ.mathematicalProof}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-amber-400 block font-bold">Referencia Normativa y Bibliográfica:</span>
              <div className="p-2 bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-300 rounded">
                {activeQ.normativeReference}
              </div>
            </div>
          </div>
        </div>

        {/* Nota Final */}
        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-300">Recomendación Doctoral EIDUNED:</strong> Esta herramienta consolida la solidez del gemelo digital ante el tribunal de tesis, cubriendo aspectos de física atmosférica, asimilación variacional, modelización de cañones urbanos y cumplimiento FAIRMODE.
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};
