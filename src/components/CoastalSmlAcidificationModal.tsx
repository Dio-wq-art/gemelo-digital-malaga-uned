import React, { useState } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import { TableHorizontalScrollContainer } from './SlidingRibbonBar';
import { useActivePoint } from '../context/ActivePointContext';
import { 
  Waves, 
  ShieldCheck, 
  Download, 
  Activity, 
  Ship, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  Fish, 
  Sliders, 
  Wind 
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { computeCoastalSmlAcidification } from '../lib/coastalSmlAcidification';

interface CoastalSmlAcidificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoastalSmlAcidificationModal: React.FC<CoastalSmlAcidificationModalProps> = ({
  isOpen,
  onClose
}) => {
  const activeCtx = useActivePoint();
  const [cruiseCount, setCruiseCount] = useState<number>(2);

  if (!isOpen) return null;

  const windSpeedKmh = activeCtx?.data?.velocidad_viento_km_h ?? 14.5;
  const windDirDeg = activeCtx?.data?.direccion_viento_grados ?? 160;
  const activeNO2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? 35.0;

  const analysis = computeCoastalSmlAcidification({
    windSpeedKmh,
    windDirectionDeg: windDirDeg,
    activeNO2UgM3: activeNO2,
    cruiseBerthOccupancy: cruiseCount
  });

  const handleExportCSV = () => {
    const headers = 'Zona_Costera,Distancia_Puerto_km,Aporte_Buques_Pct,HNO3_ug_m3,SO2_ug_m3,Flujo_Acido_umol_m2_dia,pH_SML_50um,Delta_pH,Omega_Aragonito,Estado_Calcificacion\n';
    const rows = analysis.zones.map(z => 
      `"${z.zoneName}",${z.distanceFromPortKm},${z.shipPlumeContributionPct}%,${z.atmosphericHNO3UgM3},${z.atmosphericSO2UgM3},${z.acidDepositionFluxUmolM2Day},${z.smlPH},${z.deltaPH},${z.aragoniteSaturationOmega},"${z.larvalCalcificationStress}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acidificacion_sml_bahia_malaga_ieo_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = analysis.zones.map(z => ({
    name: z.zoneName.split('(')[0].replace('Playa de', '').trim(),
    dist: z.distanceFromPortKm,
    ph: z.smlPH,
    omega: z.aragoniteSaturationOmega
  }));

  return (
    <DraggableWindow
      title="ACIDIFICACIÓN DE LA MICROCAPA SUPERFICIAL MARINA (SML) • PUERTO DE MÁLAGA"
      subtitle="Química de la Interfaz Océano-Atmósfera (IEO-CSIC): Deposición de HNO3 y SO4 de Buques en la Bahía"
      icon={<Waves className="w-5 h-5 text-cyan-400" />}
      badge={
        <span className="text-[8.5px] bg-cyan-950 text-cyan-300 border border-cyan-600 px-1.5 py-0.2 font-mono font-bold">
          SML 50 µm • MARPOL ANEXO VI • IEO-CSIC
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[94vw] max-w-5xl max-h-[86vh]"
      headerColorClass="text-cyan-400"
      borderColorClass="border-cyan-500/80"
    >
      <div className="flex flex-col gap-3 font-mono text-xs p-3 text-slate-200 bg-slate-950">
        {/* Banner Unificado del Punto Activo */}
        <ActivePointSyncBanner compact={true} />

        {/* Banner Metodológico */}
        <div className="bg-gradient-to-r from-cyan-950/90 via-slate-900 to-blue-950/90 border border-cyan-500/60 p-3 rounded flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <div className="text-xs font-bold text-cyan-300 uppercase flex items-center gap-2">
              <Ship className="w-4 h-4 text-cyan-400" />
              <span>Interfase Costera de la Bahía de Málaga y Red RADMED (IEO-CSIC)</span>
              <span className={`text-[8.5px] font-mono px-1.5 py-0.5 border ${analysis.minPHRecorded < 7.98 ? 'bg-rose-950 text-rose-300 border-rose-700' : 'bg-emerald-950 text-emerald-300 border-emerald-700'}`}>
                pH Mínimo SML: {analysis.minPHRecorded}
              </span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-snug">
              Cuantifica la caída transitoria de pH en la Microcapa Superficial Marina (SML, 50 micrómetros) originada por la deposición seca de penachos de combustión de cruceros y ferris en el Puerto de Málaga y su repercusión en la calcificación larvaria de la concha fina y boquerón.
            </p>
          </div>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar la matriz de acidificación superficial marina y flujo de deposición ácida en CSV.">
            <button
              onClick={handleExportCSV}
              className="shrink-0 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[10.5px] uppercase font-bold py-2 px-3.5 rounded border border-cyan-400 flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>EXPORTAR FAIR CSV</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Control Interactivo de Buques Atracados */}
        <div className="bg-slate-900 p-3 border border-slate-800 rounded space-y-2">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Cruceros de Gran Tonelaje Simultáneamente Atracados en Muelle de Levante:
              <ScientificTooltip
                title="Emisiones en Hotelling Portuario y Flujo Ácido (HNO₃ + H₂SO₄)"
                formula="F_{\text{acid}} = v_d(\text{HNO}_3)[\text{HNO}_3] + 2\,v_d(\text{SO}_2)[\text{SO}_2]"
                normative="MARPOL Anexo VI (0.1% S SECA/MedECA 2025) • Guía EMEP/EEA Navigation"
                content="Controla la carga térmica de motores auxiliares diésel en maniobra y atraque (hotelling) en los Muelles de Levante y Palmeral, modulando la pluma ácida advectada hacia la Bahía de Málaga."
              />
            </span>
            <span className="text-cyan-300 font-bold text-sm">{cruiseCount} buques (+2 ferris Melilla)</span>
          </div>
          <input
            type="range"
            min="0"
            max="4"
            step="1"
            value={cruiseCount}
            onChange={(e) => setCruiseCount(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
          />
          <div className="flex justify-between text-[8.5px] text-slate-400">
            <span>0 Cruceros (Fondo Basal)</span>
            <span>2 Cruceros (Operativa Habitual Primavera/Otoño)</span>
            <span>4 Cruceros (Pico de Temporada de Escalas)</span>
          </div>
        </div>

        {/* 4 Indicadores Clave Oceanográficos */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <ScientificTooltip
            position="top"
            title="pH Basal del Mar de Alborán y Capacidad Tampón"
            formula="\text{TA} = [\text{HCO}_3^-] + 2[\text{CO}_3^{2-}] + [\text{B(OH)}_4^-] + [\text{OH}^-] - [\text{H}^+]"
            normative="Serie Histórica RADMED IEO-CSIC Málaga"
            content="Estado ácido-base de referencia de las aguas superficiales del Mar de Alborán previo a la deposición de penachos portuarios, gobernado por la alcalinidad total (TA ≈ 2450 µmol/kg) y el factor de Revelle."
          >
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">pH Basal Mar Alborán</span>
              <span className="text-lg font-bold text-cyan-400 font-mono">8.12</span>
              <span className="text-[9px] text-slate-400 block">Alcalinidad: 2.450 µmol/kg</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Caída de pH en la Microcapa Superficial (SML)"
            formula="\Delta\text{pH}_{\text{SML}} = -\beta_{\text{buf}}^{-1} \frac{F_{\text{H}^+} \cdot \tau_{\text{renewal}}}{\delta_{\text{SML}}}"
            normative="Wurl et al. (2017) Elem. Sci. Anth. • Liss & Duce (2005)"
            content={`pH mínimo registrado (${analysis.minPHRecorded}) en los primeros 50 µm de la columna de agua antes de la mezcla turbulenta por capilaridad y oleaje.`}
          >
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">pH Mínimo SML</span>
              <span className={`text-lg font-bold font-mono ${analysis.minPHRecorded < 7.98 ? 'text-rose-400' : 'text-amber-400'}`}>
                {analysis.minPHRecorded}
              </span>
              <span className="text-[9px] text-slate-400 block">ΔpH máx: {(analysis.minPHRecorded - 8.12).toFixed(3)}</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Estado de Saturación de Aragonito (Ω_arag)"
            formula="\Omega_{\text{arag}} = \frac{[\text{Ca}^{2+}][\text{CO}_3^{2-}]}{K_{\text{sp,arag}}^*(T, S, P)}"
            normative="Mucci (1983) Am. J. Sci. • Directiva Marco Estrategia Marina (2008/56/CE)"
            content={`Índice termodinámico de saturación del polimorfo aragonítico de CaCO₃ (${analysis.zones[0].aragoniteSaturationOmega}). Valores Ω < 2.5 comprometen la formación de la prodissoconcha en larvas velígeras de bivalvos (Callista chione).`}
          >
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">Saturación Aragonito (Ω)</span>
              <span className={`text-lg font-bold font-mono ${analysis.zones[0].aragoniteSaturationOmega < 2.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {analysis.zones[0].aragoniteSaturationOmega}
              </span>
              <span className="text-[9px] text-slate-400 block">Umbral disolución: &lt; 2.0</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Espesor Difusivo de la Microcapa Superficial Marina (SML)"
            formula="\delta_{\text{SML}} \approx 50\,\mu\text{m} \quad (\text{Re}_{\text{cap}} \ll 1)"
            normative="Cunliffe et al. (2013) Prog. Oceanogr. • SCOR WG 141"
            content="Grosor característico de la película interfacial océano-atmósfera donde se concentra el neuston, huevos pelágicos de boquerón (Engraulis encrasicolus) y tensioactivos biogénicos."
          >
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
              <span className="text-[10px] text-slate-400 block uppercase">Espesor Microcapa</span>
              <span className="text-lg font-bold text-slate-200 font-mono">50 µm</span>
              <span className="text-[9px] text-slate-400 block">Neuston y larvas pelágicas</span>
            </div>
          </ScientificTooltip>
        </div>

        {/* Gráfico de Transecto Costero: Perfil de pH en la Microcapa (50 µm) */}
        <div className="bg-black/90 p-3 border border-slate-800 rounded space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-cyan-300">
              Perfil de pH en la Microcapa Superficial Marina (SML) a lo Largo del Transecto Bahía de Málaga
            </span>
            <span className="text-[9.5px] text-slate-400">
              Línea verde = pH Basal (8.12)
            </span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -5, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                <YAxis domain={[7.90, 8.16]} stroke="#38bdf8" tick={{ fontSize: 9 }} label={{ value: 'pH SML', angle: -90, position: 'insideLeft', fill: '#38bdf8', fontSize: 10 }} />
                <ReferenceLine y={8.12} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Fondo Basal 8.12', fill: '#10b981', fontSize: 9 }} />
                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                <Line type="monotone" dataKey="ph" name="pH SML (50 µm)" stroke="#38bdf8" strokeWidth={2.5} dot={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla Detallada por Zonas Costeras de Málaga */}
        <TableHorizontalScrollContainer
          label="Zonas Costeras SML — Bahía de Málaga"
          className="bg-slate-900 border border-slate-800 rounded p-2"
        >
          <table className="w-full text-left text-[9px]">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="py-1 px-1">Zona Costera / Receptora</th>
                <th className="py-1 px-1">Distancia Puerto</th>
                <th className="py-1 px-1 text-cyan-300">Aporte Buques</th>
                <th className="py-1 px-1 text-indigo-300">HNO₃ (µg/m³)</th>
                <th className="py-1 px-1 text-amber-300">SO₂ (µg/m³)</th>
                <th className="py-1 px-1 text-cyan-400 font-bold">pH SML</th>
                <th className="py-1 px-1 text-rose-300 font-bold">ΔpH</th>
                <th className="py-1 px-1 text-emerald-300">Ω Aragonito</th>
                <th className="py-1 px-1">Estrés Larvario</th>
              </tr>
            </thead>
            <tbody>
              {analysis.zones.map((z) => (
                <tr key={z.zoneId} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                  <td className="py-1 px-1 font-bold text-slate-200">{z.zoneName}</td>
                  <td className="py-1 px-1 text-slate-400">{z.distanceFromPortKm} km</td>
                  <td className="py-1 px-1 text-cyan-300">{z.shipPlumeContributionPct}%</td>
                  <td className="py-1 px-1 text-indigo-300">{z.atmosphericHNO3UgM3}</td>
                  <td className="py-1 px-1 text-amber-300">{z.atmosphericSO2UgM3}</td>
                  <td className="py-1 px-1 text-cyan-400 font-bold font-mono">{z.smlPH}</td>
                  <td className="py-1 px-1 text-rose-400 font-mono">{z.deltaPH}</td>
                  <td className="py-1 px-1 text-emerald-400 font-bold font-mono">{z.aragoniteSaturationOmega}</td>
                  <td className="py-1 px-1">
                    <span className={`px-1 py-0.5 rounded text-[8px] font-mono ${z.larvalCalcificationStress === 'CRITICO_DISOLUCION' ? 'bg-rose-950 text-rose-300 border border-rose-800' : z.larvalCalcificationStress === 'ESTRES_MODERADO' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                      {z.larvalCalcificationStress === 'CRITICO_DISOLUCION' ? 'CRÍTICO' : z.larvalCalcificationStress === 'ESTRES_MODERADO' ? 'ESTRÉS MODERADO' : 'ÓPTIMO'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableHorizontalScrollContainer>

        {/* Diagnóstico Doctoral para la Defensa de Tesis */}
        <div className="p-3 bg-cyan-950/30 border border-cyan-600/40 rounded space-y-1">
          <span className="text-[10.5px] font-bold text-cyan-300 uppercase flex items-center gap-1.5">
            <Fish className="w-4 h-4 text-cyan-400" />
            <span>Diagnóstico Doctoral: Interfase Océano-Atmósfera y Toxicología Larvaria</span>
          </span>
          <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
            {analysis.doctoralConclusion}
          </p>
        </div>
      </div>
    </DraggableWindow>
  );
};
