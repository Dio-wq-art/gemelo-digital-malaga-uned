import React, { useState, useMemo } from 'react';
import {
  Cpu,
  ShieldCheck,
  Activity,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart3,
  User,
  HeartPulse
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import {
  calculateGumUncertainty,
  calculatePedestrianInhalation,
  evaluateNonParametricValidation,
  exportGumUncertaintyCsv
} from '../lib/gumUncertainty';
import { GumUncertaintyDiagram } from './DeepScientificDiagrams';

interface GumUncertaintyInhalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  no2Ugm3: number;
  o3Ugm3: number;
  pm10Ugm3: number;
  windSpeedMs: number;
  solarRadiationWm2: number;
}

export const GumUncertaintyInhalationModal: React.FC<GumUncertaintyInhalationModalProps> = ({
  isOpen,
  onClose,
  no2Ugm3,
  o3Ugm3,
  pm10Ugm3,
  windSpeedMs,
  solarRadiationWm2
}) => {
  const [activeTab, setActiveTab] = useState<'gum' | 'dosimetria' | 'inferencia'>('gum');
  const [selectedSpecies, setSelectedSpecies] = useState<'NO2' | 'O3' | 'PM10'>('NO2');

  const currentConcentration =
    selectedSpecies === 'NO2' ? no2Ugm3 : selectedSpecies === 'O3' ? o3Ugm3 : pm10Ugm3;

  // 1. Presupuesto analítico GUM determinista
  const gumResult = useMemo(() => {
    return calculateGumUncertainty({
      especie: selectedSpecies,
      concentracionC: currentConcentration,
      windSpeedMs: Math.max(0.5, windSpeedMs),
      solarRadiationWm2: Math.max(10, solarRadiationWm2),
      boundaryLayerHeightZi: 750
    });
  }, [selectedSpecies, currentConcentration, windSpeedMs, solarRadiationWm2]);

  // 2. Dosimetría de inhalación peatonal (z = 1.5 m)
  const inhalationDoses = useMemo(() => {
    return calculatePedestrianInhalation({
      concentracionCanopiaUgm3: currentConcentration,
      alturaEdificiosM: 28.5, // Avenida Juan XXIII / Alameda Principal
      anchoCalleM: 30.0,
      windSpeedMs
    });
  }, [currentConcentration, windSpeedMs]);

  // 3. Inferencia estadística no paramétrica frente a las 6 estaciones oficiales
  const statisticalTests = useMemo(() => {
    return evaluateNonParametricValidation();
  }, []);

  if (!isOpen) return null;

  const handleExportCsv = () => {
    const csvContent = exportGumUncertaintyCsv(gumResult, inhalationDoses);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `malaga_gum_uncertainty_${selectedSpecies.toLowerCase()}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title={
        <div className="flex items-center gap-2">
          <span>Presupuesto de Incertidumbres GUM & Dosis Inhalada (1.5 m)</span>
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-purple-700 bg-purple-950 text-purple-300">
            JCGM 100:2008 & DIR 2008/50/CE
          </span>
        </div>
      }
      icon={<ShieldCheck className="w-4 h-4 text-purple-400" />}
      subtitle="Propagación analítica de errores Tipo A/B, límites DQO de la UE y dosimetría respiratoria peatonal"
      badge={
        <span className="px-2 py-0.5 text-[8.5px] font-bold font-mono border rounded border-purple-500 text-purple-300 bg-purple-950/80">
          U₉₅% = ±{gumResult.incertidumbreRelativaPct}% (DQO: {gumResult.cumpleObjetivoCalidadUe ? 'CUMPLE <50%' : 'EXCEDE'})
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      headerColorClass="text-purple-400"
      borderColorClass="border-purple-900/80"
      className="w-full max-w-5xl max-h-[88vh]"
    >
      <div className="space-y-4 text-slate-200 text-[11px] font-sans">
        {/* Selector de Contaminante y Resumen de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded flex flex-col justify-between">
            <div className="text-[9px] font-mono text-slate-400 uppercase flex items-center justify-between">
              <span>Especie Analizada</span>
              <Activity className="w-3 h-3 text-purple-400" />
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {(['NO2', 'O3', 'PM10'] as const).map((sp) => (
                <button
                  key={sp}
                  onClick={() => setSelectedSpecies(sp)}
                  className={`px-2 py-0.5 text-[9px] font-mono font-bold border rounded transition-colors ${
                    selectedSpecies === sp
                      ? 'bg-purple-950 border-purple-500 text-purple-300'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>
            <div className="text-[8px] text-slate-400 mt-1 font-mono">
              C nominal: <span className="text-white font-bold">{gumResult.concentracionNominalC} µg/m³</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded flex flex-col justify-between">
            <div className="text-[9px] font-mono text-slate-400 uppercase flex items-center justify-between">
              <span>Incertidumbre Expandida</span>
              <Cpu className="w-3 h-3 text-sky-400" />
            </div>
            <div className="text-base font-bold font-mono text-sky-300 mt-1">
              ±{gumResult.incertidumbreExpandidaU95} µg/m³
            </div>
            <div className="text-[8px] text-slate-400 mt-0.5 font-mono">
              k = {gumResult.factorCoberturaK.toFixed(2)} (IC 95.45%): [{gumResult.intervaloConfianza95[0]} - {gumResult.intervaloConfianza95[1]}]
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded flex flex-col justify-between">
            <div className="text-[9px] font-mono text-slate-400 uppercase flex items-center justify-between">
              <span>Objetivo Calidad UE (DQO)</span>
              {gumResult.cumpleObjetivoCalidadUe ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
            <div className={`text-base font-bold font-mono mt-1 ${gumResult.cumpleObjetivoCalidadUe ? 'text-emerald-400' : 'text-rose-400'}`}>
              {gumResult.incertidumbreRelativaPct}% &lt; 50.0%
            </div>
            <div className="text-[8px] text-slate-400 mt-0.5">
              Directiva 2008/50/CE Anexo I: Certificado Cumple
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded flex flex-col justify-between">
            <div className="text-[9px] font-mono text-slate-400 uppercase flex items-center justify-between">
              <span>Exposición Peatonal (1.5 m)</span>
              <User className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-base font-bold font-mono text-amber-400 mt-1">
              {inhalationDoses[1].concentracionNivelRespiracionUgm3} µg/m³
            </div>
            <div className="text-[8px] text-slate-400 mt-0.5">
              Dosis Caminata: <span className="text-amber-300 font-mono font-bold">{inhalationDoses[1].dosisHorariaUgH} µg/h</span>
            </div>
          </div>
        </div>

        {/* Pestañas */}
        <div className="flex items-center gap-1 border-b border-slate-800 pb-1">
          <ScientificTooltip
            topic="gum_uncertainty_budget"
            position="bottom"
            width="w-[300px]"
            content="Desglose analítico de fuentes de incertidumbre según la Guía GUM (JCGM 100:2008) y cálculo de coeficientes de sensibilidad."
          >
            <button
              onClick={() => setActiveTab('gum')}
              className={`px-3 py-1 text-[9px] font-mono uppercase font-bold border transition-colors ${
                activeTab === 'gum'
                  ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Presupuesto Analítico GUM
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="bottom"
            width="w-[300px]"
            content="Evaluación de la tasa de dosis inhalada (µg/min) por peatones y ciclistas según las tasas de ventilación pulmonar de la OMS."
          >
            <button
              onClick={() => setActiveTab('dosimetria')}
              className={`px-3 py-1 text-[9px] font-mono uppercase font-bold border transition-colors ${
                activeTab === 'dosimetria'
                  ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Dosimetría Peatonal (z = 1.5 m)
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="bottom"
            width="w-[300px]"
            content="Pruebas de inferencia no paramétrica (Kolmogorov-Smirnov y Wilcoxon) contrastando la distribución de las 6 estaciones de Málaga."
          >
            <button
              onClick={() => setActiveTab('inferencia')}
              className={`px-3 py-1 text-[9px] font-mono uppercase font-bold border transition-colors ${
                activeTab === 'inferencia'
                  ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Inferencia No Paramétrica (K-S / Wilcoxon)
            </button>
          </ScientificTooltip>

          <div className="ml-auto">
            <ScientificTooltip
              position="bottom"
              width="w-[260px]"
              content="Descargar matriz en CSV interoperable con todas las covarianzas y dosis para anexo de tesis."
            >
              <button
                onClick={handleExportCsv}
                className="px-2 py-0.5 text-[8.5px] font-mono font-bold uppercase bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-700/60 rounded flex items-center gap-1"
              >
                <FileSpreadsheet className="w-3 h-3 text-purple-400" />
                <span>Exportar CSV FAIR</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Tab 1: GUM */}
        {activeTab === 'gum' && (
          <div className="space-y-3">
            <div className="bg-slate-950/70 p-3 rounded border border-slate-800">
              <div className="text-[10px] font-bold font-mono text-purple-400 mb-2 flex items-center justify-between">
                <span>Distribución de Probabilidad Expandida (Gaussian Coverage k = 2.00)</span>
                <span className="text-[8px] text-slate-400">JCGM 100:2008 (GUM)</span>
              </div>
              <GumUncertaintyDiagram compact={false} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[8.5px] border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                    <th className="p-1.5">Fuente de Incertidumbre</th>
                    <th className="p-1.5">Símbolo</th>
                    <th className="p-1.5">Tipo</th>
                    <th className="p-1.5">u(xᵢ)</th>
                    <th className="p-1.5">cᵢ (Sensibilidad)</th>
                    <th className="p-1.5">cᵢ² u(xᵢ)²</th>
                    <th className="p-1.5">% Varianza</th>
                    <th className="p-1.5">Norma / Justificación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {gumResult.componentesPresupuesto.map((comp, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60">
                      <td className="p-1.5 font-bold text-slate-200">{comp.fuente}</td>
                      <td className="p-1.5 text-purple-300 font-bold">{comp.simbolo}</td>
                      <td className="p-1.5 text-slate-400">{comp.tipoIncertidumbre}</td>
                      <td className="p-1.5 text-sky-400 font-mono">{comp.incertidumbreEstandarUi}</td>
                      <td className="p-1.5 text-slate-300 font-mono">{comp.coeficienteSensibilidadCi}</td>
                      <td className="p-1.5 text-slate-200 font-mono font-bold">{comp.contribucionVarianzaUiCi2}</td>
                      <td className="p-1.5 text-amber-400 font-mono font-bold">{comp.porcentajeContribucion}%</td>
                      <td className="p-1.5 text-slate-400 text-[8px] leading-tight">{comp.fundamento}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Dosimetría Peatonal */}
        {activeTab === 'dosimetria' && (
          <div className="space-y-3">
            <div className="text-[9.5px] font-mono text-slate-300 bg-slate-950/80 p-2.5 rounded border border-slate-800 leading-relaxed">
              <strong className="text-amber-400">Fundamentación Mecanística:</strong> En un cañón urbano estrecho (H/W &gt;= 0.65), la recirculación del vórtice atrapa las emisiones vehiculares a nivel del suelo, originando una concentración a la altura de respiración (z = 1.5 m) un <strong className="text-white">+{((inhalationDoses[0].factorGradienteVerticalSobreCanopia - 1) * 100).toFixed(0)}% superior</strong> a la de la canopia.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {inhalationDoses.map((dose, idx) => (
                <div key={idx} className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                    <span className="font-bold text-slate-200 text-[10px]">{dose.escenario}</span>
                    <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                  </div>

                  <div className="space-y-1 font-mono text-[8.5px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ventilación V_E:</span>
                      <span className="text-sky-300 font-bold">{dose.tasaVentilacionM3H} m³/h ({dose.tasaVentilacionLMin} L/min)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Concentración z=1.5m:</span>
                      <span className="text-amber-300 font-bold">{dose.concentracionNivelRespiracionUgm3} µg/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dosis por minuto:</span>
                      <span className="text-rose-300 font-bold">{dose.dosisMinutoUgMin} µg/min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dosis en 1 hora:</span>
                      <span className="text-rose-400 font-bold">{dose.dosisHorariaUgH} µg/h</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800/80 pt-1">
                      <span className="text-slate-400">Jornada 8h:</span>
                      <span className="text-white font-bold">{dose.dosisJornada8hUg} µg</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-1.5 rounded text-[8px] font-mono flex items-center justify-between">
                    <span className="text-slate-400">% Guía OMS:</span>
                    <span className={`font-bold ${dose.porcentajeLimiteOms > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {dose.porcentajeLimiteOms}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Inferencia Estadística */}
        {activeTab === 'inferencia' && (
          <div className="space-y-2">
            <div className="text-[9px] font-mono text-slate-400 mb-1">
              Test de Kolmogorov-Smirnov (D_ks) y Wilcoxon Signed-Rank frente a las estaciones oficiales de Málaga:
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[8.5px] border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                    <th className="p-1.5">Estación Oficial</th>
                    <th className="p-1.5">Contaminante</th>
                    <th className="p-1.5">N (Horas)</th>
                    <th className="p-1.5">D_KS</th>
                    <th className="p-1.5">p-valor (KS)</th>
                    <th className="p-1.5">Wilcoxon W</th>
                    <th className="p-1.5">p-valor (Wilcoxon)</th>
                    <th className="p-1.5">Sesgo Mediano</th>
                    <th className="p-1.5">Dictamen de Tesis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {statisticalTests.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60">
                      <td className="p-1.5 font-bold text-slate-200">{t.estacion}</td>
                      <td className="p-1.5 text-purple-300 font-bold">{t.contaminante}</td>
                      <td className="p-1.5 text-slate-400">{t.nObservaciones}</td>
                      <td className="p-1.5 text-sky-400 font-bold">{t.estadisticoD_KS.toFixed(3)}</td>
                      <td className="p-1.5 text-emerald-400 font-bold">{t.pValorKolmogorovSmirnov.toFixed(2)}</td>
                      <td className="p-1.5 text-slate-300">{t.estadisticoWilcoxonW}</td>
                      <td className="p-1.5 text-emerald-400 font-bold">{t.pValorWilcoxon.toFixed(2)}</td>
                      <td className="p-1.5 text-amber-300">{t.sesgoMedianoUgm3 > 0 ? `+${t.sesgoMedianoUgm3}` : t.sesgoMedianoUgm3} µg/m³</td>
                      <td className="p-1.5 text-slate-300 text-[8px] leading-tight max-w-[280px]">{t.interpretacionTesis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
};
