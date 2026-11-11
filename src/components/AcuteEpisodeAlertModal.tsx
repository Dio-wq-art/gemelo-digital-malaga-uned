import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Bell,
  Activity,
  FileSpreadsheet,
  Globe,
  Wind,
  Thermometer,
  Sun,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Hospital
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import {
  evaluateAcuteEpisodeProtocol,
  exportProtocolGeoJson,
  exportProtocolCsv,
  REGULATORY_THRESHOLDS,
  SensitiveReceptor
} from '../lib/acuteEpisodeProtocol';
import { AcuteEpisodesDiagram } from './DeepScientificDiagrams';

interface AcuteEpisodeAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  ambientTempC: number;
  windSpeedKmH: number;
  windDirDeg: number;
  relativeHumidity: number;
  solarRadiationWm2: number;
  no2Ugm3: number;
  o3Ugm3: number;
  pm10Ugm3: number;
  pm25Ugm3: number;
}

export const AcuteEpisodeAlertModal: React.FC<AcuteEpisodeAlertModalProps> = ({
  isOpen,
  onClose,
  ambientTempC,
  windSpeedKmH,
  windDirDeg,
  relativeHumidity,
  solarRadiationWm2,
  no2Ugm3,
  o3Ugm3,
  pm10Ugm3,
  pm25Ugm3
}) => {
  const [activeTab, setActiveTab] = useState<'panel' | 'receptores' | 'acciones' | 'normativa'>('panel');
  const [selectedReceptorId, setSelectedReceptorId] = useState<string | null>(null);

  // Evaluación puramente determinista acoplada a la física y telemetría
  const episodeResult = useMemo(() => {
    return evaluateAcuteEpisodeProtocol({
      no2Ugm3,
      o3Ugm3,
      pm10Ugm3,
      pm25Ugm3,
      tempC: ambientTempC,
      windSpeedKmH,
      windDirDeg,
      relativeHumidity,
      solarRadiationWm2
    });
  }, [
    no2Ugm3,
    o3Ugm3,
    pm10Ugm3,
    pm25Ugm3,
    ambientTempC,
    windSpeedKmH,
    windDirDeg,
    relativeHumidity,
    solarRadiationWm2
  ]);

  if (!isOpen) return null;

  const handleDownloadGeoJson = () => {
    const data = exportProtocolGeoJson(episodeResult);
    const blob = new Blob([data], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `malaga_acute_episode_${episodeResult.nivelGlobal.toLowerCase()}_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const data = exportProtocolCsv(episodeResult);
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `malaga_acute_episode_receptors_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const levelColor =
    episodeResult.nivelGlobal === 'ALERTA_EMERGENCIA'
      ? 'border-rose-500 text-rose-400 bg-rose-950/80'
      : episodeResult.nivelGlobal === 'AVISO_INFORMACION'
      ? 'border-amber-500 text-amber-400 bg-amber-950/80'
      : episodeResult.nivelGlobal === 'PREAVISO'
      ? 'border-sky-500 text-sky-400 bg-sky-950/80'
      : 'border-emerald-500 text-emerald-400 bg-emerald-950/80';

  return (
    <DraggableWindow
      title={
        <div className="flex items-center gap-2">
          <span>Protocolo Predictivo de Episodios Agudos y Alertas Tempranas</span>
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900 text-slate-300">
            RD 102/2011 & DIR 2008/50/CE
          </span>
        </div>
      }
      icon={<ShieldAlert className="w-4 h-4 text-rose-400" />}
      subtitle="Vigilancia continua de umbrales horarios oficiales y salvaguarda de receptores sensibles de Málaga"
      badge={
        <span className={`px-2 py-0.5 text-[8.5px] font-bold font-mono border rounded ${levelColor}`}>
          FASE: {episodeResult.nivelGlobal}
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      headerColorClass="text-rose-400"
      borderColorClass="border-rose-900/80"
      className="w-full max-w-5xl max-h-[88vh]"
    >
      <div className="space-y-4 text-slate-200 text-[11px] font-sans">
        {/* Banner de Estado Normativo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded flex flex-col justify-between">
            <div className="text-[9px] font-mono text-slate-400 uppercase flex items-center justify-between">
              <span>Contaminante Crítico</span>
              <Activity className="w-3 h-3 text-rose-400" />
            </div>
            <div className="text-base font-bold font-mono text-rose-400 mt-1">
              {episodeResult.contaminanteGobernante}: {episodeResult.valorMaximoUgm3} µg/m³
            </div>
            <div className="text-[8px] text-slate-400 mt-0.5">
              Umbral Legal: {episodeResult.umbralSuperadoUgm3} µg/m³ (Ratio: {(episodeResult.valorMaximoUgm3 / episodeResult.umbralSuperadoUgm3).toFixed(2)}x)
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded flex flex-col justify-between">
            <div className="text-[9px] font-mono text-slate-400 uppercase flex items-center justify-between">
              <span>Riesgo Poblacional</span>
              <AlertTriangle className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-base font-bold font-mono text-amber-400 mt-1">
              {episodeResult.indiceRiesgoPoblacional} / 100
            </div>
            <div className="text-[8px] text-slate-400 mt-0.5">
              Estabilidad Pasquill: <span className="text-sky-300 font-mono">{episodeResult.estabilidadAtmosfericaPasquill}</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded flex flex-col justify-between">
            <div className="text-[9px] font-mono text-slate-400 uppercase flex items-center justify-between">
              <span>Condición Meteorológica</span>
              <Wind className="w-3 h-3 text-sky-400" />
            </div>
            <div className="text-base font-bold font-mono text-sky-300 mt-1">
              {windSpeedKmH.toFixed(1)} km/h • {windDirDeg.toFixed(0)}°
            </div>
            <div className="text-[8px] text-slate-400 mt-0.5">
              {episodeResult.condicionMeteorologicaAdversa ? '⚠️ Dispersión muy limitada (Estancamiento)' : '✓ Dispersión advectiva moderada'}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded flex flex-col justify-between">
            <div className="text-[9px] font-mono text-slate-400 uppercase flex items-center justify-between">
              <span>Acciones Activadas</span>
              <Bell className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-base font-bold font-mono text-emerald-300 mt-1">
              {episodeResult.accionesRecomendadas.length} Medidas
            </div>
            <div className="text-[8px] text-slate-400 mt-0.5">
              Reducción estimada: <span className="text-emerald-400 font-bold">-{episodeResult.accionesRecomendadas.reduce((a, b) => a + b.reduccionEsperadaUgm3, 0).toFixed(1)} µg/m³</span>
            </div>
          </div>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex items-center gap-1 border-b border-slate-800 pb-1">
          <ScientificTooltip
            topic="acute_episode_protocol"
            position="bottom"
            width="w-[300px]"
            content="Visualización del Nowcasting horario y curva de superación de los umbrales de información y alerta estipulados por la Directiva 2008/50/CE."
          >
            <button
              onClick={() => setActiveTab('panel')}
              className={`px-3 py-1 text-[9px] font-mono uppercase font-bold border transition-colors ${
                activeTab === 'panel'
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Curva de Episodio & Nowcasting
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="bottom"
            width="w-[300px]"
            content="Censo geoespacial de receptores de alta vulnerabilidad respiratoria de Málaga (Hospital Regional, Clínico, Materno, colegios y residencias)."
          >
            <button
              onClick={() => setActiveTab('receptores')}
              className={`px-3 py-1 text-[9px] font-mono uppercase font-bold border transition-colors ${
                activeTab === 'receptores'
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Receptores Vulnerables ({episodeResult.receptoresAfectados.length})
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="bottom"
            width="w-[300px]"
            content="Catálogo de intervenciones operativas municipales según los 3 escalones de contingencia del Plan de Calidad del Aire de Málaga."
          >
            <button
              onClick={() => setActiveTab('acciones')}
              className={`px-3 py-1 text-[9px] font-mono uppercase font-bold border transition-colors ${
                activeTab === 'acciones'
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Medidas de Mitigación
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="bottom"
            width="w-[300px]"
            content="Valores límite legales y umbrales de aviso según Real Decreto 102/2011 y Directiva 2008/50/CE."
          >
            <button
              onClick={() => setActiveTab('normativa')}
              className={`px-3 py-1 text-[9px] font-mono uppercase font-bold border transition-colors ${
                activeTab === 'normativa'
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Marco Legal & Umbrales
            </button>
          </ScientificTooltip>

          <div className="ml-auto flex items-center gap-1">
            <ScientificTooltip
              position="bottom"
              width="w-[260px]"
              content="Descargar dataset espacial en GeoJSON citable con coordenadas, nivel de exposición de receptores y campos de viento."
            >
              <button
                onClick={handleDownloadGeoJson}
                className="px-2 py-0.5 text-[8.5px] font-mono font-bold uppercase bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-700/60 rounded flex items-center gap-1"
              >
                <Globe className="w-3 h-3 text-indigo-400" />
                <span>GeoJSON FAIR</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              position="bottom"
              width="w-[260px]"
              content="Descargar matriz en CSV interoperable para inclusión en anexos de tesis doctoral."
            >
              <button
                onClick={handleDownloadCsv}
                className="px-2 py-0.5 text-[8.5px] font-mono font-bold uppercase bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-700/60 rounded flex items-center gap-1"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                <span>CSV</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Contenido de Pestañas */}
        {activeTab === 'panel' && (
          <div className="space-y-3">
            <div className="bg-slate-950/70 p-3 rounded border border-slate-800">
              <div className="text-[10px] font-bold font-mono text-rose-400 mb-2 flex items-center justify-between">
                <span>Diagrama de Nowcasting y Escalones de Alerta</span>
                <span className="text-[8px] text-slate-400">Modelo Físico Advectivo + Dispersión en Cañón</span>
              </div>
              <AcuteEpisodesDiagram compact={false} />
            </div>

            <div className="bg-slate-900/60 p-3 rounded border border-slate-800 text-[9.5px] leading-relaxed text-slate-300 space-y-1.5 font-mono">
              <div className="text-amber-300 font-bold">Mecanismo de Activación Automática:</div>
              <p>
                A diferencia de las aproximaciones estadísticas pasivas, el Gemelo Digital evalúa continuamente el balance advectivo entre las fuentes lineales (red viaria de Málaga vía COPERT 5) y la tasa de foto-fotólisis J(NO2) combinada con la brisa marina litoral. Si la concentración horaria proyectada en cualquier celda de la trama urbana supera los 180 µg/m³ para O3 o 200 µg/m³ para NO2, se dispara la prealerta municipal para evitar el paso a la fase de Alerta Sanitaria de 240 µg/m³.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'receptores' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {episodeResult.receptoresAfectados.map((rec) => {
                const isSelected = selectedReceptorId === rec.receptor.id;
                const badgeRisk =
                  rec.nivelRiesgo === 'CRITICO'
                    ? 'bg-rose-950 text-rose-300 border-rose-600'
                    : rec.nivelRiesgo === 'ALTO'
                    ? 'bg-amber-950 text-amber-300 border-amber-600'
                    : rec.nivelRiesgo === 'MODERADO'
                    ? 'bg-yellow-950 text-yellow-300 border-yellow-600'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-600';

                return (
                  <div
                    key={rec.receptor.id}
                    onClick={() => setSelectedReceptorId(isSelected ? null : rec.receptor.id)}
                    className={`p-2.5 rounded border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.25)]'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5">
                        <Hospital className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="font-bold text-slate-200 text-[10px]">{rec.receptor.nombre}</span>
                      </div>
                      <span className={`text-[7.5px] font-mono px-1.5 py-0.5 border rounded font-bold ${badgeRisk}`}>
                        {rec.nivelRiesgo}
                      </span>
                    </div>

                    <div className="text-[8.5px] text-slate-400 mt-1">
                      {rec.receptor.barrio} • Distancia a vial: {rec.receptor.distanciaVialPrincipalM} m
                    </div>

                    <div className="grid grid-cols-3 gap-1 mt-2 text-[8px] font-mono bg-slate-950/80 p-1.5 rounded border border-slate-800/80">
                      <div>
                        <span className="text-slate-500">NO₂:</span> <span className="text-rose-300 font-bold">{rec.concentracionLocalNo2} µg/m³</span>
                      </div>
                      <div>
                        <span className="text-slate-500">O₃:</span> <span className="text-cyan-300 font-bold">{rec.concentracionLocalO3} µg/m³</span>
                      </div>
                      <div>
                        <span className="text-slate-500">PM₁₀:</span> <span className="text-amber-300 font-bold">{rec.concentracionLocalPm10} µg/m³</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[8px] text-slate-400 mt-1.5 pt-1 border-t border-slate-800/60">
                      <span>Población vulnerable: <strong className="text-slate-300">{rec.receptor.poblacionVulnerableEstimada} hab.</strong></span>
                      <span className="text-sky-300 font-mono">Tiempo advección: {rec.tiempoImpactoMin} min</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'acciones' && (
          <div className="space-y-2">
            <div className="text-[9px] font-mono text-slate-400 mb-1">
              Catálogo de intervención escalonada según la Guía MITECO y Plan de Calidad del Aire:
            </div>
            <div className="space-y-1.5">
              {episodeResult.accionesRecomendadas.map((action, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/80 p-2.5 rounded border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                        {action.fase}
                      </span>
                      <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {action.ambito}
                      </span>
                      <strong className="text-[10px] text-slate-200">{action.titulo}</strong>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-relaxed">{action.descripcion}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[8px] text-emerald-400 font-mono font-bold block">
                      -{action.reduccionEsperadaUgm3} µg/m³
                    </span>
                    <span className="text-[7px] text-slate-500 font-mono">Abatimiento</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'normativa' && (
          <div className="space-y-2">
            <div className="text-[9px] font-mono text-slate-400 mb-1">
              Umbrales oficiales certificados según Directiva 2008/50/CE y Real Decreto 102/2011:
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[8.5px] border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                    <th className="p-1.5">Contaminante</th>
                    <th className="p-1.5">Preaviso</th>
                    <th className="p-1.5">Información</th>
                    <th className="p-1.5">Alerta</th>
                    <th className="p-1.5">Promediado</th>
                    <th className="p-1.5">Norma Legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {REGULATORY_THRESHOLDS.map((t) => (
                    <tr key={t.contaminante} className="hover:bg-slate-900/60">
                      <td className="p-1.5 font-bold text-slate-200">{t.nombreLargo} ({t.contaminante})</td>
                      <td className="p-1.5 text-sky-400">{t.umbralPreavisoUgm3} {t.unidad}</td>
                      <td className="p-1.5 text-amber-400">{t.umbralInformacionUgm3} {t.unidad}</td>
                      <td className="p-1.5 text-rose-400 font-bold">{t.umbralAlertaUgm3} {t.unidad}</td>
                      <td className="p-1.5 text-slate-400">{t.tiempoPromediado}</td>
                      <td className="p-1.5 text-slate-500">{t.normaLegal}</td>
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
