import React, { useState } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { useActivePoint } from '../context/ActivePointContext';
import { 
  Car, 
  ShieldCheck, 
  Download, 
  Activity, 
  Sliders, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  TrendingDown, 
  Scale, 
  Zap, 
  FileText 
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
import { computeZbeDualAudit } from '../lib/zbeDualSpilloverHalo';
import {
  computeCausalMobilityDecomposition,
  computeDistributiveWhereAndForWhom
} from '../lib/thesisDirectorGuidelinesEngine';

interface ZbeDualSpilloverHaloModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZbeDualSpilloverHaloModal: React.FC<ZbeDualSpilloverHaloModalProps> = ({
  isOpen,
  onClose
}) => {
  const activeCtx = useActivePoint();
  const [renewalIntensity, setRenewalIntensity] = useState<number>(1.15);
  const [heavyDutyRestricted, setHeavyDutyRestricted] = useState<boolean>(true);

  if (!isOpen) return null;

  const baselineNO2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? 36.0;
  const activeWindMs = (activeCtx?.assimilation?.windSpeedKmh ?? 11.5) / 3.6;
  const activeStreetName = activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name || 'Eje Alameda Principal – Centro ZBE';

  const result = computeZbeDualAudit({
    baselineCoreNO2: baselineNO2,
    fleetRenewalIntensity: renewalIntensity,
    heavyDutyRestriction: heavyDutyRestricted
  });

  const causalDecomp = computeCausalMobilityDecomposition({
    streetName: activeStreetName,
    baselineNo2UgM3: baselineNO2,
    fleetRenewalFactor: renewalIntensity,
    windSpeedMs: activeWindMs,
    pblHeightM: 680,
    portAndNonRoadSharePct: 14.5
  });

  const distributiveRows = computeDistributiveWhereAndForWhom(baselineNO2, renewalIntensity);

  const handleExportCSV = () => {
    const headers = 'Corredor,Zona,Distancia_Km,NO2_Base_ug_m3,NO2_PostZBE_ug_m3,Variacion_Pct,Trafico_Veh_Dia,Flota_Limpia_Pct\n';
    const rows = result.corridors.map(c => 
      `"${c.corridorName}",${c.zoneType},${c.distanceFromCenterKm},${c.baselineNO2UgM3},${c.postZbeNO2UgM3},${c.netVariationPct}%,${c.trafficVolumeVehDay},${c.fleetCleanPct}%`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_zbe_halo_spillover_malaga_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = result.corridors.map(c => ({
    name: c.corridorName.split('(')[0].trim(),
    Base: c.baselineNO2UgM3,
    PostZBE: c.postZbeNO2UgM3,
    varPct: c.netVariationPct
  }));

  return (
    <DraggableWindow
      title="AUDITORÍA ZBE DUAL: DESBORDE PERIMETRAL vs EFECTO HALO A 5 KM"
      subtitle="Evaluación Conforme a RD 1052/2022 & Evidencia Europea Clean Cities (Bruselas/Londres ULEZ)"
      icon={<Car className="w-5 h-5 text-emerald-400" />}
      badge={
        <span className="text-[8.5px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-1.5 py-0.2 font-mono font-bold">
          RD 1052/2022 • BOUNDARY HALO
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[92vw] max-w-4xl max-h-[85vh]"
      headerColorClass="text-emerald-400"
      borderColorClass="border-emerald-500/80"
    >
      <div className="flex flex-col gap-3 font-mono text-xs p-3 text-slate-200 bg-slate-950">
        {/* Banner Metodológico */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/60 p-3 rounded flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <div className="text-xs font-bold text-emerald-300 uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{result.zbeName} ({result.regulatedAreaHa} ha)</span>
              <span className="bg-emerald-900 text-emerald-200 text-[8px] font-mono px-1.5 py-0.5 border border-emerald-700">
                {result.spatialEquityVerdict.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-snug">
              Cuantificación de las dos fuerzas contrapuestas de la ZBE: la sobrecarga local por tráfico de desvío en el anillo frontera (*spillover*) frente a la descontaminación metropolitana hasta 5 km (*efecto halo*) por renovación tecnológica del parque de vehículos.
            </p>
          </div>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar la matriz de impacto de la ZBE y justicia ambiental en formato abierto CSV.">
            <button
              onClick={handleExportCSV}
              className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10.5px] uppercase font-bold py-2 px-3.5 rounded border border-emerald-400 flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>EXPORTAR FAIR CSV</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Panel de Escenarios y Parámetros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900 p-3 border border-slate-800 rounded">
          <ScientificTooltip position="top" width="w-[280px]" content="Intensidad de renovación tecnológica del parque de vehículos impulsada por las restricciones de acceso.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300 font-bold">Intensidad Renovación Flota (Etiquetas ECO/0):</span>
                <span className="text-emerald-300 font-bold">{renewalIntensity.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="1.00"
                max="1.50"
                step="0.05"
                value={renewalIntensity}
                onChange={(e) => setRenewalIntensity(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[8.5px] text-slate-400">
                <span>1.0x (Tendencial)</span>
                <span>1.25x (Plan Municipal Málaga)</span>
                <span>1.5x (Electrificación Rápida)</span>
              </div>
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Restricción estricta a vehículos pesados diésel de distribución urbana de mercancías (DUM).">
            <div className="flex items-center justify-between h-full pt-1">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-300 block">Restricción Camiones / Furgonetas DUM:</span>
                <span className="text-[9px] text-slate-400">Obligatoriedad distintivo C o superior</span>
              </div>
              <button
                onClick={() => setHeavyDutyRestricted(!heavyDutyRestricted)}
                className={`py-1.5 px-3 rounded font-bold text-[10px] border transition-all cursor-pointer ${heavyDutyRestricted ? 'bg-emerald-600 text-slate-950 border-emerald-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
              >
                {heavyDutyRestricted ? 'ACTIVADA' : 'DESACTIVADA'}
              </button>
            </div>
          </ScientificTooltip>
        </div>

        {/* 4 Indicadores Clave */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Núcleo Centro/Soho</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{result.coreAverageReductionPct}%</span>
            <span className="text-[9px] text-slate-400 block">Reducción neta NO₂</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Anillo de Fricción</span>
            <span className="text-lg font-bold text-amber-400 font-mono">+{result.perimeterFrictionMaxSpilloverPct}%</span>
            <span className="text-[9px] text-slate-400 block">Sobrecarga por desvío</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Efecto Halo (5 km)</span>
            <span className="text-lg font-bold text-cyan-400 font-mono">{result.halo5kmAverageReductionPct}%</span>
            <span className="text-[9px] text-slate-400 block">Beneficio metropolitano</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Gini Ambiental</span>
            <span className="text-lg font-bold text-indigo-400 font-mono">{result.environmentalGiniIndex}</span>
            <span className="text-[9px] text-slate-400 block">G {'<'} 0.20: Equitativo</span>
          </div>
        </div>

        {/* Gráfico Comparativo: Antes vs Después de la ZBE */}
        <div className="bg-black/90 p-3 border border-slate-800 rounded space-y-2">
          <span className="text-xs font-bold text-emerald-300 block">
            Gradiente de Concentración de NO₂ (µg/m³): Escenario Base vs Post-ZBE por Corredor
          </span>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 8.5 }} angle={-15} textAnchor="end" />
                <YAxis stroke="#34d399" tick={{ fontSize: 9 }} label={{ value: 'NO₂ (µg/m³)', angle: -90, position: 'insideLeft', fill: '#34d399', fontSize: 10 }} />
                <RechartsTooltip cursor={{ fill: 'rgba(52, 211, 153, 0.1)' }} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />
                <Bar dataKey="Base" name="Línea Base (Pre-ZBE)" fill="#64748b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="PostZBE" name="Impacto Post-ZBE" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla Detallada por Corredor */}
        <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded p-2">
          <table className="w-full text-left text-[9.5px]">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="py-1 px-1">Corredor Estratégico</th>
                <th className="py-1 px-1">Zona</th>
                <th className="py-1 px-1">Dist.</th>
                <th className="py-1 px-1">Base</th>
                <th className="py-1 px-1 text-emerald-300">Post-ZBE</th>
                <th className="py-1 px-1 text-amber-300">Variación</th>
                <th className="py-1 px-1 text-cyan-300">Flota Limpia</th>
              </tr>
            </thead>
            <tbody>
              {result.corridors.map((c, idx) => (
                <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                  <td className="py-1 px-1 font-bold text-slate-200">{c.corridorName}</td>
                  <td className="py-1 px-1">
                    <span className={`px-1 py-0.5 rounded text-[8px] font-mono ${c.zoneType === 'ZBE_CORE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : c.zoneType === 'PERIMETER_FRICTION' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-sky-950 text-sky-300 border border-sky-800'}`}>
                      {c.zoneType === 'ZBE_CORE' ? 'NÚCLEO' : c.zoneType === 'PERIMETER_FRICTION' ? 'FRICCIÓN' : 'HALO 5KM'}
                    </span>
                  </td>
                  <td className="py-1 px-1 text-slate-400">{c.distanceFromCenterKm} km</td>
                  <td className="py-1 px-1 text-slate-400">{c.baselineNO2UgM3}</td>
                  <td className="py-1 px-1 text-emerald-400 font-bold">{c.postZbeNO2UgM3}</td>
                  <td className={`py-1 px-1 font-bold ${c.netVariationPct < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {c.netVariationPct > 0 ? `+${c.netVariationPct}%` : `${c.netVariationPct}%`}
                  </td>
                  <td className="py-1 px-1 text-cyan-300">{c.fleetCleanPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* OE3 & TAREA 6.5 DEL DIRECTOR: ESTRATEGIA DE IDENTIFICACIÓN CAUSAL (DESMETEOROLOGIZACIÓN PINN) */}
        <div className="p-3 bg-slate-900/95 border border-cyan-500/70 rounded space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-800/60 pb-2">
            <div>
              <span className="text-[10.5px] font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-cyan-400" />
                <span>OE3 &amp; Tarea 6.5. Identificación Causal: Separación del Efecto Política de la Meteorología y Fuentes No Viarias</span>
              </span>
              <p className="text-[9px] text-slate-300 mt-0.5">
                Descomposición físico-informada en <strong>{causalDecomp.streetOrZoneName}</strong> para evitar atribuir erróneamente a la ZBE variaciones causadas por brisas/terral o emisiones portuarias/aeroportuarias.
              </p>
            </div>
            <span className="px-2 py-0.5 bg-cyan-950 text-cyan-200 border border-cyan-600 text-[8.5px] font-bold shrink-0">
              CONTRAFACTUAL SIN POLÍTICA: {causalDecomp.counterfactualNoPolicyUgM3} µg/m³
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[9.5px]">
            <div className="p-2 bg-emerald-950/40 border border-emerald-700/70 rounded">
              <div className="text-[8px] text-emerald-400 font-bold uppercase">1. Efecto Puro Movilidad (ZBE)</div>
              <div className="text-sm font-bold text-emerald-300 mt-0.5">{causalDecomp.policyMobilityEffectUgM3} µg/m³</div>
              <div className="text-[8px] text-slate-400">Atribución causal: {causalDecomp.causalAttributionSharePct}%</div>
            </div>
            <div className="p-2 bg-amber-950/30 border border-amber-700/60 rounded">
              <div className="text-[8px] text-amber-400 font-bold uppercase">2. Control Meteorología (Viento/PBL)</div>
              <div className="text-sm font-bold text-amber-300 mt-0.5">
                {causalDecomp.meteorologyConfounderUgM3 >= 0 ? `+${causalDecomp.meteorologyConfounderUgM3}` : causalDecomp.meteorologyConfounderUgM3} µg/m³
              </div>
              <div className="text-[8px] text-slate-400">Brisa/Terral (u = {activeWindMs.toFixed(1)} m/s)</div>
            </div>
            <div className="p-2 bg-purple-950/30 border border-purple-700/60 rounded">
              <div className="text-[8px] text-purple-400 font-bold uppercase">3. Control Fuentes No Viarias</div>
              <div className="text-sm font-bold text-purple-300 mt-0.5">
                {causalDecomp.nonRoadSourcesConfounderUgM3 >= 0 ? `+${causalDecomp.nonRoadSourcesConfounderUgM3}` : causalDecomp.nonRoadSourcesConfounderUgM3} µg/m³
              </div>
              <div className="text-[8px] text-slate-400">Puerto, Aeropuerto y Calima</div>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-700 rounded">
              <div className="text-[8px] text-slate-400 font-bold uppercase">4. Cambio Total Observado</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {causalDecomp.totalObservedDeltaUgM3 >= 0 ? `+${causalDecomp.totalObservedDeltaUgM3}` : causalDecomp.totalObservedDeltaUgM3} µg/m³
              </div>
              <div className="text-[8px] text-slate-400">Post-ZBE: {causalDecomp.postInterventionNo2UgM3} µg/m³</div>
            </div>
          </div>
        </div>

        {/* OE4 & SECCIÓN 7 DEL DIRECTOR: DIMENSIÓN TERRITORIAL Y DISTRIBUTIVA ("¿DÓNDE Y PARA QUIÉN?") */}
        <div className="p-3 bg-slate-900/95 border border-emerald-600/60 rounded space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-emerald-300 uppercase flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>OE4 &amp; Sección 7. Dimensión Territorial y Distributiva: ¿Dónde y para quién se producen los efectos?</span>
            </span>
            <span className="text-[8.5px] text-slate-400">Cruce INE Renta ADRH + Población Vulnerable</span>
          </div>
          <div className="overflow-x-auto border border-slate-800">
            <table className="w-full text-left text-[9px]">
              <thead>
                <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 uppercase">
                  <th className="p-1.5">Territorio / Distrito de Málaga</th>
                  <th className="p-1.5">Renta Media (Decil INE)</th>
                  <th className="p-1.5">Pob. Vulnerable</th>
                  <th className="p-1.5">Pre-ZBE</th>
                  <th className="p-1.5">Post-ZBE</th>
                  <th className="p-1.5">Cambio Exposición</th>
                  <th className="p-1.5">Efecto Distributivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {distributiveRows.map((row) => (
                  <tr key={row.zoneId} className="hover:bg-slate-800/40">
                    <td className="p-1.5 font-bold text-slate-200">{row.zoneName}</td>
                    <td className="p-1.5 text-slate-300">{row.incomeAnnualEur.toLocaleString()} € (D{row.incomeDecileIne})</td>
                    <td className="p-1.5 text-slate-300">{row.vulnerablePopPct}% ({row.affectedPopulationCount.toLocaleString()} hab.)</td>
                    <td className="p-1.5 text-slate-400">{row.no2PreInterventionUgM3} µg/m³</td>
                    <td className="p-1.5 font-bold text-white">{row.no2PostInterventionUgM3} µg/m³</td>
                    <td className={`p-1.5 font-bold ${row.deltaExposureUgM3 < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {row.deltaExposureUgM3 > 0 ? `+${row.deltaExposureUgM3}` : row.deltaExposureUgM3} µg/m³ ({row.deltaExposurePct > 0 ? `+${row.deltaExposurePct}%` : `${row.deltaExposurePct}%`})
                    </td>
                    <td className="p-1.5">
                      <span
                        className={`px-1.5 py-0.5 text-[8px] font-bold border ${
                          row.distributiveOutcome === 'BENEFICIO_AMBIENTAL_NETO'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                            : row.distributiveOutcome === 'COSTE_DESPLAZAMIENTO_SPILLOVER'
                            ? 'bg-amber-950 text-amber-300 border-amber-600'
                            : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}
                      >
                        {row.distributiveOutcome.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conclusión Científica y Evidencia Internacional */}
        <div className="p-3 bg-emerald-950/30 border border-emerald-600/40 rounded space-y-1">
          <span className="text-[10.5px] font-bold text-emerald-300 uppercase flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Conclusión Metodológica para el Tribunal Doctoral</span>
          </span>
          <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
            {result.doctoralConclusion}
          </p>
        </div>
      </div>
    </DraggableWindow>
  );
};
