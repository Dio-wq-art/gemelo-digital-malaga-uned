import React, { useState } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import { useActivePoint } from '../context/ActivePointContext';
import { 
  Coins, 
  ShieldCheck, 
  Download, 
  Activity, 
  Sliders, 
  Building2, 
  HeartHandshake, 
  TrendingUp, 
  CheckCircle2, 
  Hospital, 
  HeartPulse 
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { computeHealthEconomicsAnalysis } from '../lib/healthEconomicsSas';

interface HealthEconomicsSasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HealthEconomicsSasModal: React.FC<HealthEconomicsSasModalProps> = ({
  isOpen,
  onClose
}) => {
  const activeCtx = useActivePoint();
  const activeNO2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? activeCtx?.assimilation?.no2Ugm3 ?? 32.5;
  const activePM25 = activeCtx?.assimilation?.pm25UgM3 ?? activeCtx?.assimilation?.pm25Ugm3 ?? 14.8;

  const [deltaNO2, setDeltaNO2] = useState<number>(4.5);
  const [deltaPM25, setDeltaPM25] = useState<number>(2.2);

  // Sincronización reactiva: ajusta el objetivo de abatimiento ΔNO2 y ΔPM2.5 según el exceso real del punto activo frente a los objetivos 2030/OMS
  React.useEffect(() => {
    const dynamicDeltaNo2 = Number(Math.max(1.5, Math.min(25.0, Math.max(activeNO2 - 20.0, activeNO2 * 0.22))).toFixed(1));
    const dynamicDeltaPm25 = Number(Math.max(0.8, Math.min(12.0, Math.max(activePM25 - 9.0, activePM25 * 0.20))).toFixed(1));
    setDeltaNO2(dynamicDeltaNo2);
    setDeltaPM25(dynamicDeltaPm25);
  }, [activeNO2, activePM25]);

  if (!isOpen) return null;

  const result = computeHealthEconomicsAnalysis({
    deltaNO2ReductionUgM3: deltaNO2,
    deltaPM25ReductionUgM3: deltaPM25
  });

  const handleExportCSV = () => {
    const headers = 'Hospital,Poblacion_Cobertura,Urgencias_Evitadas_Ano,Ingresos_Evitados_Ano,Ahorro_Directo_SAS_EUR,Area_Referencia\n';
    const rows = result.hospitals.map(h => 
      `"${h.hospitalName}",${h.coveragePopulation},${h.avoidedAnnualEmergencyVisits},${h.avoidedAnnualHospitalizations},${h.directSasCostSavingsEurYear},"${h.primaryReferralArea}"`
    ).join('\n');

    const summary = `\nMetricas_Globales_Malaga\nMuertes_Prematuras_Evitadas,${result.avoidedPrematureDeathsYear}\nAnos_Vida_Ganados_YLL,${result.avoidedYLLYearsLostYear}\nBeneficio_Bienestar_VSL_EUR,${result.welfareSavingsVslEurYear}\nAhorro_Directo_SAS_EUR,${result.directHospitalSavingsSasEurYear}\nRatio_Beneficio_Coste_ZBE,${result.benefitCostRatioZbe}\n`;

    const blob = new Blob([headers + rows + summary], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluacion_coste_beneficio_salud_sas_malaga_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = result.hospitals.map(h => ({
    name: h.hospitalName.includes('Regional') ? 'H. Regional' : h.hospitalName.includes('Victoria') ? 'H. Clínico' : 'H. Materno',
    ahorroEur: Math.round(h.directSasCostSavingsEurYear / 1000), // en miles de euros
    ingresos: h.avoidedAnnualHospitalizations
  }));

  const COLORS = ['#38bdf8', '#34d399', '#f43f5e'];

  return (
    <DraggableWindow
      windowId="healthEconomicsSas"
      title="VALORACIÓN ECONÓMICA DEL DAÑO EN SALUD (COST-BENEFIT OCDE / SAS)"
      subtitle="Ahorro Presupuestario en el SAS & Valor Estadístico de la Vida (VSL 3.6 M€ / OMS AirQ+)"
      icon={<Coins className="w-5 h-5 text-emerald-400" />}
      badge={
        <span className="text-[8.5px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-1.5 py-0.2 font-mono font-bold">
          📍 {activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name || 'Málaga'} • B/C: {result.benefitCostRatioZbe}x
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[92vw] max-w-4xl max-h-[85vh]"
      headerColorClass="text-emerald-400"
      borderColorClass="border-emerald-500/80"
    >
      <div className="flex flex-col gap-3 font-mono text-xs p-3 text-slate-200 bg-slate-950">
        {/* Banner Unificado del Punto Activo */}
        <ActivePointSyncBanner compact={true} />

        {/* Banner Metodológico */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/60 p-3 rounded flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <div className="text-xs font-bold text-emerald-300 uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Aglomeración Urbana de Málaga ({result.malagaUrbanPopulation.toLocaleString()} hab.)</span>
              <span className="bg-emerald-900 text-emerald-200 text-[8.5px] font-mono px-1.5 py-0.5 border border-emerald-700">
                Ratio B/C: {result.benefitCostRatioZbe}x Inversión
              </span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-snug">
              Cuantificación econométrica del ahorro sanitario público y social según el estándar VSL de la OCDE (3.6 M€ por vida estadística) y los costes de hospitalización y urgencias en los centros del Servicio Andaluz de Salud (SAS).
            </p>
          </div>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar la matriz econométrica y de costes sanitarios del SAS en formato abierto CSV.">
            <button
              onClick={handleExportCSV}
              className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10.5px] uppercase font-bold py-2 px-3.5 rounded border border-emerald-400 flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>EXPORTAR FAIR CSV</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Controles de Escenario de Reducción */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900 p-3 border border-slate-800 rounded">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-300 font-bold flex items-center gap-1">
                Reducción Media de NO₂ (ZBE + Tráfico):
                <ScientificTooltip
                  title="Función Concentración-Respuesta (CRF) para NO₂"
                  formula="RR_{\text{NO}_2}(\Delta C) = \exp(\beta_{\text{NO}_2} \cdot \Delta C_{\text{NO}_2}), \quad RR_{10} = 1.023"
                  normative="OMS HRAPIE / AirQ+ (2021) • COMEAP (2018)"
                  content="Abatimiento medio anual de NO₂ acoplado al exceso del punto activo respecto al límite de la Directiva (UE) 2024/2881 (20 µg/m³)."
                />
              </span>
              <span className="text-emerald-300 font-bold">-{deltaNO2.toFixed(1)} µg/m³</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="12.0"
              step="0.5"
              value={deltaNO2}
              onChange={(e) => setDeltaNO2(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[8.5px] text-slate-400">
              <span>-1.0 µg (Mínima)</span>
              <span>-4.5 µg (Escenario Base ZBE)</span>
              <span>-12.0 µg (Meta OMS 2021)</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-300 font-bold flex items-center gap-1">
                Reducción Media de PM2.5:
                <ScientificTooltip
                  title="Función Concentración-Respuesta (CRF) para PM₂.₅"
                  formula="RR_{\text{PM}_{2.5}}(\Delta C) = \exp(\beta_{\text{PM}_{2.5}} \cdot \Delta C_{\text{PM}_{2.5}}), \quad RR_{10} = 1.080"
                  normative="Chen & Hoek (2020) Environ. Int. • Guías OMS 2021"
                  content="Abatimiento medio anual de partículas finas PM₂.₅ por renovación de flota, reducción de abrasión de frenos/neumáticos y filtración vegetativa urbana."
                />
              </span>
              <span className="text-cyan-300 font-bold">-{deltaPM25.toFixed(1)} µg/m³</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="6.0"
              step="0.2"
              value={deltaPM25}
              onChange={(e) => setDeltaPM25(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[8.5px] text-slate-400">
              <span>-0.5 µg (Inercial)</span>
              <span>-2.2 µg (Escenario ZBE 2030)</span>
              <span>-6.0 µg (Estándar OMS)</span>
            </div>
          </div>
        </div>

        {/* 4 Indicadores Clave Macro-Económicos */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <ScientificTooltip
            position="top"
            title="Mortalidad Prematura Evitada y Años de Vida Ganados (YLL)"
            formula="\Delta M = M_0 \cdot P_{\text{exp}} \cdot \left(1 - e^{-\beta \Delta C}\right)"
            normative="Metodología OMS AirQ+ • Global Burden of Disease (GBD)"
            content={`Fracción atribuible poblacional evitada anualmente (+${result.avoidedPrematureDeathsYear} vidas/año y ${result.avoidedYLLYearsLostYear} años de vida potencialmente perdidos evitados en Málaga).`}
          >
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">Vidas Salvadas</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                +{result.avoidedPrematureDeathsYear} al año
              </span>
              <span className="text-[9px] text-slate-400 block">{result.avoidedYLLYearsLostYear} años de vida ganados</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Valor Estadístico de la Vida (VSL OCDE)"
            formula="B_{\text{VSL}} = \Delta M \times \text{VSL}_{\text{OCDE}\;2024} \quad (3.60\,\text{M€})"
            normative="OECD Mortality Risk Valuation in Environment, Health and Transport Policies"
            content={`Valoración monetaria del bienestar social ganado (${(result.welfareSavingsVslEurYear / 1e6).toFixed(1)} M€/año) aplicando la disponibilidad marginal a pagar (WTP) armonizada por la OCDE y la AEMA.`}
          >
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">Ahorro Social VSL</span>
              <span className="text-lg font-bold text-cyan-400 font-mono">
                {(result.welfareSavingsVslEurYear / 1e6).toFixed(1)} M€
              </span>
              <span className="text-[9px] text-slate-400 block">Estándar OCDE / EEA</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Ahorro Presupuestario Directo en Hospitales del SAS"
            formula="S_{\text{SAS}} = \sum_h \left(\Delta N_{\text{urg},h} C_{\text{urg}} + \Delta N_{\text{ing},h} C_{\text{GRD}}\right)"
            normative="Precios Públicos Servicio Andaluz de Salud (BOJA) • Grupos Relacionados por el Diagnóstico (GRD)"
            content={`Ahorro contable directo (${(result.directHospitalSavingsSasEurYear / 1000).toFixed(0)} k€/año) en urgencias cardiorrespiratorias e ingresos hospitalarios evitados en el H. Regional, H. Clínico Virgen de la Victoria y H. Materno-Infantil.`}
          >
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">Ahorro Directo SAS</span>
              <span className="text-lg font-bold text-amber-400 font-mono">
                {(result.directHospitalSavingsSasEurYear / 1000).toFixed(0)} k€
              </span>
              <span className="text-[9px] text-slate-400 block">Presupuesto hospitalario</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Ratio Beneficio-Coste Social (BCR)"
            formula="\text{BCR} = \frac{B_{\text{VSL}} + S_{\text{SAS}} + S_{\text{absentismo}}}{C_{\text{CAPEX,anual}} + C_{\text{OPEX}}}"
            normative="Guía de Análisis Coste-Beneficio de la Comisión Europea (DG REGIO)"
            content={`Rentabilidad socioeconómica neta (${result.benefitCostRatioZbe}:1) de la implantación de infraestructuras de mitigación (ZBE, renaturalización y fotocatálisis) frente a su coste anualizado.`}
          >
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">Rentabilidad B/C</span>
              <span className="text-lg font-bold text-indigo-400 font-mono">{result.benefitCostRatioZbe} : 1</span>
              <span className="text-[9px] text-slate-400 block">Beneficio vs Coste ZBE</span>
            </div>
          </ScientificTooltip>
        </div>

        {/* Gráfico Comparativo: Ahorro Presupuestario por Hospital */}
        <div className="bg-black/90 p-3 border border-slate-800 rounded space-y-2">
          <span className="text-xs font-bold text-emerald-300 block">
            Ahorro Presupuestario Directo Anual en Centros del SAS (Miles de Euros / k€)
          </span>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#34d399" tick={{ fontSize: 9 }} label={{ value: 'k€ Ahorrados', angle: -90, position: 'insideLeft', fill: '#34d399', fontSize: 10 }} />
                <RechartsTooltip cursor={{ fill: 'rgba(52, 211, 153, 0.1)' }} />
                <Bar dataKey="ahorroEur" name="Ahorro SAS (k€)" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla de Hospitales del SAS en Málaga */}
        <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded p-2">
          <table className="w-full text-left text-[9.5px]">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="py-1 px-1">Centro Hospitalario SAS</th>
                <th className="py-1 px-1">Población Cobertura</th>
                <th className="py-1 px-1 text-emerald-300">Urgencias Evitadas</th>
                <th className="py-1 px-1 text-cyan-300">Ingresos Evitados</th>
                <th className="py-1 px-1 text-amber-300 font-bold">Ahorro Directo Anual</th>
              </tr>
            </thead>
            <tbody>
              {result.hospitals.map((h, idx) => (
                <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                  <td className="py-1 px-1 font-bold text-slate-200">{h.hospitalName}</td>
                  <td className="py-1 px-1 text-slate-400">{h.coveragePopulation.toLocaleString()} hab.</td>
                  <td className="py-1 px-1 text-emerald-400 font-bold">{h.avoidedAnnualEmergencyVisits} urg/año</td>
                  <td className="py-1 px-1 text-cyan-400 font-bold">{h.avoidedAnnualHospitalizations} ing/año</td>
                  <td className="py-1 px-1 text-amber-400 font-mono font-bold">{h.directSasCostSavingsEurYear.toLocaleString()} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Diagnóstico Doctoral para la Defensa de Tesis */}
        <div className="p-3 bg-emerald-950/30 border border-emerald-600/40 rounded space-y-1">
          <span className="text-[10.5px] font-bold text-emerald-300 uppercase flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Diagnóstico Socioeconómico y Conclusión Macro-Sanitaria</span>
          </span>
          <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
            {result.doctoralConclusion}
          </p>
        </div>
      </div>
    </DraggableWindow>
  );
};
