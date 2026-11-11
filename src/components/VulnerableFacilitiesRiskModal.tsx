import React, { useState, useMemo } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import { useActivePoint } from '../context/ActivePointContext';
import { 
  Building2, 
  HeartPulse, 
  GraduationCap, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Sliders, 
  Download, 
  MapPin, 
  FileText, 
  Flame, 
  TrendingUp, 
  Activity, 
  Scale, 
  Coins, 
  Compass, 
  Layers, 
  Baby, 
  Heart,
  TreeDeciduous,
  Trees,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from 'recharts';
import { 
  computeVulnerableFacilitiesRisk, 
  FacilityRiskAssessment,
  computeFacilityBioBarrierPlan,
  MALAGA_RECOMMENDED_BIO_SPECIES,
  FacilityBioBarrierPlan
} from '../lib/vulnerableFacilitiesRisk';

interface VulnerableFacilitiesRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFlyToLocation?: (lat: number, lon: number, zoom?: number, bearing?: number) => void;
}

export function VulnerableFacilitiesRiskModal({
  isOpen,
  onClose,
  onFlyToLocation
}: VulnerableFacilitiesRiskModalProps) {
  const activeCtx = useActivePoint();
  const [activeTab, setActiveTab] = useState<'vulnerability_matrix' | 'heatmap_hotspots' | 'bio_barrier_prescription' | 'deprivation_analysis' | 'fair_export'>('vulnerability_matrix');
  const [filterType, setFilterType] = useState<'ALL' | 'HOSPITALS_HEALTH' | 'SCHOOLS'>('ALL');
  const [betaDeprivation, setBetaDeprivation] = useState<number>(0.85);
  const [selectedFacility, setSelectedFacility] = useState<FacilityRiskAssessment | null>(null);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('celtis_australis');

  if (!isOpen) return null;

  const activeNO2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? 35.0;
  const activePM25 = activeCtx?.assimilation?.pm25UgM3 ?? 14.8;

  const riskSummary = computeVulnerableFacilitiesRisk({
    ambientNO2UgM3: activeNO2,
    ambientPM25UgM3: activePM25,
    incomeDeprivationBeta: betaDeprivation
  });

  const filteredFacilities = useMemo(() => {
    if (filterType === 'HOSPITALS_HEALTH') {
      return riskSummary.facilities.filter(f => f.facility.category === 'HOSPITAL' || f.facility.category === 'CENTRO_DE_SALUD');
    }
    if (filterType === 'SCHOOLS') {
      return riskSummary.facilities.filter(f => f.facility.category === 'COLEGIO_PUBLICO' || f.facility.category === 'COLEGIO_CONCERTADO_PRIVADO');
    }
    return riskSummary.facilities;
  }, [riskSummary.facilities, filterType]);

  const currentSelection = selectedFacility || riskSummary.highestRiskFacility;

  const currentBioPlan: FacilityBioBarrierPlan = useMemo(() => {
    return computeFacilityBioBarrierPlan(currentSelection, selectedSpeciesId);
  }, [currentSelection, selectedSpeciesId]);

  const handleSyncActivePoint = (f: FacilityRiskAssessment) => {
    if (activeCtx?.syncActivePoint) {
      activeCtx.syncActivePoint(f.facility.lat, f.facility.lon, {
        name: f.facility.name,
        fly: true,
        zoom: 16.5,
        pitch: 30
      });
    }
    if (onFlyToLocation) {
      onFlyToLocation(f.facility.lat, f.facility.lon, 16.5, 30);
    }
  };

  const handleExportCSV = () => {
    const headers = 'Equipamiento,Categoria,Direccion,Distrito,Renta_Hogar_EUR,Cota_Inhalacion_m,NO2_ug_m3,PM25_ug_m3,Dosis_Horaria_ug_h,Factor_Privacion,Indice_IRSV,Diagnostico,Directiva_2030,Accion_Recomendada\n';
    const rows = riskSummary.facilities.map(f => 
      `"${f.facility.name}","${f.facility.category}","${f.facility.address}","${f.facility.districtName}",${f.facility.incomeEurYear},${f.facility.inhalationHeightM},${f.baselineNO2UgM3},${f.baselinePM25UgM3},${f.pediatricGeriatricHourlyDoseUg},${f.deprivationFactor},${f.irsvIndex},"${f.irsvCategory}","${f.directive2030Compliance}","${f.recommendedMitigationAction}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IRSV_Equipamientos_Vulnerables_Malaga_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="Índice de Riesgo Socioambiental Integrado (IRSV) en Hospitales y Escuelas"
      icon={<ShieldAlert className="w-4 h-4 text-rose-400" />}
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[95vw] sm:w-full max-w-4xl max-h-[85vh]"
      badge={<span className="text-[9px] font-mono text-rose-300">📍 {riskSummary.facilitiesCount} Equipamientos • Hotspots: {riskSummary.criticalHotspotsCount}</span>}
    >
      <div className="p-3 bg-slate-950 text-slate-100 font-sans space-y-3">
        {/* Banner de Asimilación Atómica */}
        <ActivePointSyncBanner />

        {/* Barra de Navegación de Pestañas */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex gap-1.5 text-xs">
            <ScientificTooltip position="bottom" content="Ranking interactivo de vulnerabilidad socioambiental en hospitales, centros de salud y colegios.">
              <button
                onClick={() => setActiveTab('vulnerability_matrix')}
                className={`px-3 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'vulnerability_matrix' ? 'bg-rose-600 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Matriz de Riesgo IRSV</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" content="Capa de calor bivariada (IRSV) con Kernel de Densidad Exponencial y localización de Hotspots.">
              <button
                onClick={() => setActiveTab('heatmap_hotspots')}
                className={`px-3 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'heatmap_hotspots' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Capa de Calor & Hotspots</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" content="Prescripción analítica determinista de barreras vegetales de alta deposición seca (Wesely vd) y retorno económico sanitario en el equipamiento seleccionado.">
              <button
                onClick={() => setActiveTab('bio_barrier_prescription')}
                className={`px-3 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'bio_barrier_prescription' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
              >
                <TreeDeciduous className="w-3.5 h-3.5" />
                <span>Prescripción Bio-Barrera (Wesely)</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" content="Análisis de sensibilidad de la ecuación IRSV según el parámetro de privación de renta (beta).">
              <button
                onClick={() => setActiveTab('deprivation_analysis')}
                className={`px-3 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'deprivation_analysis' ? 'bg-indigo-600 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Sensibilidad & Privación INE</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" content="Exportación citable FAIR (CSV/LaTeX) para la memoria y defensa de la Tesis Doctoral.">
              <button
                onClick={() => setActiveTab('fair_export')}
                className={`px-3 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'fair_export' ? 'bg-emerald-600 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportación FAIR Data</span>
              </button>
            </ScientificTooltip>
          </div>

          <ScientificTooltip position="left" content="Descargar la matriz completa de riesgo de equipamientos vulnerables en formato CSV estandarizado.">
            <button
              onClick={handleExportCSV}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold py-1.5 px-2.5 rounded border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>CSV FAIR</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* 4 Cards de Resumen de Riesgo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-0.5">
            <span className="text-[9.5px] text-slate-400 uppercase font-mono block">Equipamientos Mapeados</span>
            <div className="text-base font-bold text-slate-100 font-mono flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>{riskSummary.facilitiesCount} Nodos</span>
            </div>
            <span className="text-[8.5px] text-slate-400 block">Hospitales + Centros Salud + Colegios</span>
          </div>

          <div className="p-2.5 bg-slate-900 border border-rose-900/60 rounded space-y-0.5">
            <span className="text-[9.5px] text-rose-300 uppercase font-mono block">Hotspots de Alto Riesgo</span>
            <div className="text-base font-bold text-rose-400 font-mono flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>{riskSummary.criticalHotspotsCount} Hotspots</span>
            </div>
            <span className="text-[8.5px] text-rose-300/80 block">IRSV &ge; 2.4 (Intervención Necesaria)</span>
          </div>

          <div className="p-2.5 bg-slate-900 border border-amber-900/60 rounded space-y-0.5">
            <span className="text-[9.5px] text-amber-300 uppercase font-mono block">Exceden Directiva 2030</span>
            <div className="text-base font-bold text-amber-400 font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>{riskSummary.exceeding2030DirectiveCount} Equipamientos</span>
            </div>
            <span className="text-[8.5px] text-amber-300/80 block">&gt; 20 µg/m³ NO₂ (Directiva UE 2024/2881)</span>
          </div>

          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-0.5">
            <span className="text-[9.5px] text-slate-400 uppercase font-mono block">Máximo Riesgo Identificado</span>
            <div className="text-xs font-bold text-rose-300 font-mono truncate">
              {riskSummary.highestRiskFacility.facility.name.split('(')[0]}
            </div>
            <span className="text-[8.5px] text-slate-400 block">IRSV = {riskSummary.highestRiskFacility.irsvIndex}</span>
          </div>
        </div>

        {/* PESTAÑA 1: MATRIZ DE RIESGO IRSV */}
        {activeTab === 'vulnerability_matrix' && (
          <div className="space-y-3">
            {/* Filtros de Categorial */}
            <div className="flex justify-between items-center bg-slate-900 p-2 border border-slate-800 rounded text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <FilterIcon />
                Filtrar Equipamientos por Categoría:
              </span>
              <div className="flex gap-1 text-[10px]">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-2.5 py-1 rounded cursor-pointer font-bold ${filterType === 'ALL' ? 'bg-indigo-600 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                >
                  TODOS ({riskSummary.facilitiesCount})
                </button>
                <button
                  onClick={() => setFilterType('HOSPITALS_HEALTH')}
                  className={`px-2.5 py-1 rounded cursor-pointer font-bold ${filterType === 'HOSPITALS_HEALTH' ? 'bg-rose-600 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                >
                  HOSPITALES Y CENTROS SALUD
                </button>
                <button
                  onClick={() => setFilterType('SCHOOLS')}
                  className={`px-2.5 py-1 rounded cursor-pointer font-bold ${filterType === 'SCHOOLS' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                >
                  COLEGIOS Y CENTROS EDUCATIVOS
                </button>
              </div>
            </div>

            {/* Tabla Principal */}
            <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded p-2">
              <table className="w-full text-left text-[9.5px]">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="py-1.5 px-1.5">Equipamiento Sensible</th>
                    <th className="py-1.5 px-1.5">Distrito INE</th>
                    <th className="py-1.5 px-1.5">Renta Hogar</th>
                    <th className="py-1.5 px-1.5 text-indigo-300">NO₂ Asimilado</th>
                    <th className="py-1.5 px-1.5 text-rose-300">Dosis Inhalada</th>
                    <th className="py-1.5 px-1.5 text-amber-300">Factor Privación</th>
                    <th className="py-1.5 px-1.5 text-rose-400 font-bold">Índice IRSV</th>
                    <th className="py-1.5 px-1.5">Directiva 2030</th>
                    <th className="py-1.5 px-1.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacilities.map((f) => (
                    <tr 
                      key={f.facility.id} 
                      className={`border-b border-slate-800/60 hover:bg-slate-800/50 cursor-pointer ${currentSelection.facility.id === f.facility.id ? 'bg-indigo-950/40 border-l-2 border-l-indigo-400' : ''}`}
                      onClick={() => setSelectedFacility(f)}
                    >
                      <td className="py-1.5 px-1.5 font-bold text-slate-100 flex items-center gap-1.5">
                        {f.facility.category === 'HOSPITAL' || f.facility.category === 'CENTRO_DE_SALUD' ? (
                          <HeartPulse className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : (
                          <GraduationCap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span className="truncate max-w-[200px]">{f.facility.name}</span>
                      </td>
                      <td className="py-1.5 px-1.5 text-slate-300">{f.facility.districtName.split(':')[1]?.trim() || f.facility.districtName}</td>
                      <td className="py-1.5 px-1.5 text-slate-300 font-mono">{f.facility.incomeEurYear.toLocaleString()} €</td>
                      <td className="py-1.5 px-1.5 text-indigo-300 font-bold font-mono">{f.baselineNO2UgM3} µg/m³</td>
                      <td className="py-1.5 px-1.5 text-rose-300 font-mono">{f.pediatricGeriatricHourlyDoseUg} µg/h ({f.facility.inhalationHeightM}m)</td>
                      <td className="py-1.5 px-1.5 text-amber-300 font-mono">{f.deprivationFactor}</td>
                      <td className="py-1.5 px-1.5 font-bold font-mono text-xs">
                        <span className={`px-1.5 py-0.5 rounded ${f.irsvIndex >= 3.5 ? 'bg-rose-950 text-rose-300 border border-rose-700' : f.irsvIndex >= 2.4 ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-slate-800 text-slate-300'}`}>
                          {f.irsvIndex}
                        </span>
                      </td>
                      <td className="py-1.5 px-1.5">
                        <span className={`px-1 py-0.5 rounded text-[8px] font-mono ${f.directive2030Compliance === 'CONFORME_2030' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
                          {f.directive2030Compliance === 'CONFORME_2030' ? '✓ CONFORME' : '⚠️ > 20 µg'}
                        </span>
                      </td>
                      <td className="py-1.5 px-1.5 text-right">
                        <ScientificTooltip position="left" content="Sincronizar las coordenadas de este hospital o colegio como punto activo del mapa.">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSyncActivePoint(f);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-slate-950 text-[9px] font-bold px-2 py-0.5 rounded border border-indigo-400 cursor-pointer"
                          >
                            📍 SINCRONIZAR
                          </button>
                        </ScientificTooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Ficha Detallada del Equipamiento Seleccionado */}
            {currentSelection && (
              <div className="p-3 bg-gradient-to-r from-slate-900 to-rose-950/40 border border-rose-600/50 rounded space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>Ficha de Diagnóstico Socioambiental: {currentSelection.facility.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-300">
                      Dirección: <strong>{currentSelection.facility.address}</strong> ({currentSelection.facility.districtName})
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-700 font-mono text-[9px] font-bold rounded uppercase">
                    Índice IRSV: {currentSelection.irsvIndex}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9.5px] bg-black/60 p-2 rounded border border-slate-800">
                  <div>👥 Grupo Sensible: <strong>{currentSelection.facility.vulnerableAgeGroup.replace(/_/g, ' ')}</strong></div>
                  <div>💶 Renta Sección Censal: <strong>{currentSelection.facility.incomeEurYear.toLocaleString()} €/año</strong></div>
                  <div>📏 Cota Inhalación: <strong>{currentSelection.facility.inhalationHeightM} m AGL</strong></div>
                  <div className="text-amber-300">⚠️ Prescripción: <strong>{currentSelection.recommendedMitigationAction}</strong></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: CAPA DE CALOR & HOTSPOTS */}
        {activeTab === 'heatmap_hotspots' && (
          <div className="space-y-3">
            <div className="bg-slate-900 p-3 border border-slate-800 rounded space-y-2">
              <span className="text-xs font-bold text-amber-300 block">
                Visualización de Hotspots IRSV: Concentración NO₂ vs Factor de Privación Económica
              </span>
              <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                El gráfico de dispersión relaciona la concentración asimilada de NO₂ en la fachada del equipamiento con el factor de privación de renta del INE. Los puntos ubicados en el cuadrante superior derecho corresponden a los <strong>Hotspots de Injusticia Severa</strong> (Alta contaminación en barrios con baja renta).
              </p>

              <div className="h-64 w-full bg-black/80 rounded border border-slate-800 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 15, right: 20, bottom: 25, left: -5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      type="number" 
                      dataKey="baselineNO2UgM3" 
                      name="NO2 Asimilado" 
                      unit=" µg/m³" 
                      stroke="#94a3b8" 
                      tick={{ fontSize: 9 }}
                      label={{ value: 'Concentración NO₂ Asimilada (µg/m³)', position: 'insideBottom', offset: -12, fill: '#94a3b8', fontSize: 9.5 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="deprivationFactor" 
                      name="Factor Privación Renta" 
                      stroke="#fbbf24" 
                      tick={{ fontSize: 9 }}
                      label={{ value: 'Factor Privación INE (Renta_Ref / Renta_i)', angle: -90, position: 'insideLeft', fill: '#fbbf24', fontSize: 9.5 }}
                    />
                    <ZAxis type="number" dataKey="irsvIndex" range={[60, 300]} name="IRSV" />
                    <RechartsTooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as FacilityRiskAssessment;
                          return (
                            <div className="bg-slate-950 border border-slate-700 p-2 text-[10px] font-mono text-slate-200 rounded shadow-xl">
                              <div className="font-bold text-amber-300">{data.facility.name}</div>
                              <div>Distrito: {data.facility.districtName}</div>
                              <div>NO₂ Asimilado: <strong className="text-indigo-300">{data.baselineNO2UgM3} µg/m³</strong></div>
                              <div>Renta Hogar: <strong className="text-emerald-300">{data.facility.incomeEurYear.toLocaleString()} €</strong></div>
                              <div className="text-rose-400 font-bold">Índice IRSV: {data.irsvIndex}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter name="Equipamientos" data={riskSummary.facilities}>
                      {riskSummary.facilities.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.irsvIndex >= 3.5 ? '#f43f5e' : entry.irsvIndex >= 2.4 ? '#f59e0b' : '#38bdf8'} 
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: PRESCRIPCIÓN DE BIO-BARRERA (WESELY) */}
        {activeTab === 'bio_barrier_prescription' && (
          <div className="space-y-3">
            {/* Cabecera del Equipamiento Seleccionado para Prescripción */}
            <div className="p-3 bg-gradient-to-r from-slate-900 to-emerald-950/40 border border-emerald-600/50 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <TreeDeciduous className="w-4 h-4 text-emerald-400" />
                  <span>Prescripción de Barrera Vegetal: {currentBioPlan.facilityName}</span>
                </div>
                <p className="text-[10px] text-slate-300">
                  {currentBioPlan.districtName} • Frontal viario: <strong>{currentBioPlan.façadeLengthM} metros</strong> • Exceso legal: <strong>{currentBioPlan.excessNO2UgM3} µg/m³</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-300 font-bold">Especie Arbórea:</span>
                <select
                  value={selectedSpeciesId}
                  onChange={(e) => setSelectedSpeciesId(e.target.value)}
                  className="bg-slate-950 border border-emerald-600/80 text-emerald-200 text-[10px] rounded px-2 py-1 font-mono cursor-pointer"
                >
                  {MALAGA_RECOMMENDED_BIO_SPECIES.map((sp) => (
                    <option key={sp.speciesId} value={sp.speciesId}>
                      {sp.commonName} ({sp.scientificName}) • LAI: {sp.lai}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4 Métricas Clave de la Prescripción */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-0.5">
                <span className="text-[9.5px] text-slate-400 uppercase font-mono block">Árboles Requeridos</span>
                <div className="text-base font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                  <Trees className="w-4 h-4 text-emerald-500" />
                  <span>{currentBioPlan.recommendedTreeCount} Ejemplares</span>
                </div>
                <span className="text-[8.5px] text-slate-400 block">Separación: {currentBioPlan.bestSpecies.optimalTreeSpacingM}m ({currentBioPlan.barrierLengthM}m pantalla)</span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-0.5">
                <span className="text-[9.5px] text-slate-400 uppercase font-mono block">Velocidad Deposición Wesely</span>
                <div className="text-base font-bold text-indigo-300 font-mono flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span>{currentBioPlan.bestSpecies.vdNO2_cm_s} cm/s</span>
                </div>
                <span className="text-[8.5px] text-slate-400 block">Extracción: {currentBioPlan.bestSpecies.dailyNO2RemovalPerTreeGrams} g/día/árbol</span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-0.5">
                <span className="text-[9.5px] text-slate-400 uppercase font-mono block">Captura Anual de NO₂</span>
                <div className="text-base font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-cyan-400" />
                  <span>{currentBioPlan.totalAnnualNO2CapturedKg} kg/año</span>
                </div>
                <span className="text-[8.5px] text-slate-400 block">Atenuación: -{currentBioPlan.projectedNO2ReductionUgM3} µg/m³</span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-0.5">
                <span className="text-[9.5px] text-slate-400 uppercase font-mono block">Retorno Inversión Sanitaria</span>
                <div className="text-base font-bold text-amber-300 font-mono flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>{currentBioPlan.paybackYears} años</span>
                </div>
                <span className="text-[8.5px] text-slate-400 block">Ahorro SAS: {currentBioPlan.annualHealthCostSavingsEur.toLocaleString()} €/año</span>
              </div>
            </div>

            {/* Diagnóstico Comparativo Antes vs Después de la Barrera */}
            <div className="p-3 bg-black/80 border border-slate-800 rounded space-y-2">
              <span className="text-xs font-bold text-emerald-300 block">
                Balance Atmosférico de la Intervención Verde (Directiva UE 2024/2881)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                <div className="p-2 bg-slate-900/80 rounded border border-rose-900/60 space-y-1">
                  <div className="text-rose-400 font-bold">1. Estado Basal Previo:</div>
                  <div>NO₂ Fachada: <strong>{currentBioPlan.currentNO2UgM3} µg/m³</strong></div>
                  <div className="text-rose-300">Exceso 2030: +{currentBioPlan.excessNO2UgM3} µg/m³</div>
                </div>

                <div className="p-2 bg-slate-900/80 rounded border border-indigo-900/60 space-y-1">
                  <div className="text-indigo-300 font-bold">2. Acción Biofísica:</div>
                  <div>Especie: <strong>{currentBioPlan.bestSpecies.commonName}</strong></div>
                  <div>Inversión Municipal: <strong>{currentBioPlan.totalInvestmentEur.toLocaleString()} €</strong></div>
                </div>

                <div className="p-2 bg-slate-900/80 rounded border border-emerald-900/60 space-y-1">
                  <div className="text-emerald-300 font-bold">3. Proyección Post-Intervención:</div>
                  <div>NO₂ Estimado: <strong>{currentBioPlan.postInterventionNO2UgM3} µg/m³</strong></div>
                  <div className="text-emerald-400 font-bold">
                    {currentBioPlan.achieves2030Compliance ? '✓ CONFORME DIRECTIVA 2030' : '⚠️ REQUIERE MEDIDAS ADICIONALES'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 4: SENSIBILIDAD & PRIVACIÓN INE */}
        {activeTab === 'deprivation_analysis' && (
          <div className="space-y-3">
            <div className="bg-slate-900 p-3 border border-slate-800 rounded space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Sensibilidad del Factor de Privación Económica (&beta; de Atkinson-Inequality):
                </span>
                <span className="text-indigo-300 font-bold text-sm font-mono">&beta; = {betaDeprivation.toFixed(2)}</span>
              </div>

              <input
                type="range"
                min="0.20"
                max="1.50"
                step="0.05"
                value={betaDeprivation}
                onChange={(e) => setBetaDeprivation(parseFloat(e.target.value))}
                className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />

              <div className="flex justify-between text-[8.5px] text-slate-400 font-mono">
                <span>0.20 (Baja ponderación de renta)</span>
                <span>0.85 (Estándar Unión Europea / INE)</span>
                <span>1.50 (Aversión social máxima rawlsiana)</span>
              </div>
            </div>

            <div className="p-3 bg-black/80 border border-slate-800 rounded space-y-1.5 text-[10px] text-slate-300 font-mono">
              <span className="text-xs font-bold text-indigo-300 block">
                Formulación Analítica Determinista del Índice IRSV:
              </span>
              <p className="leading-relaxed font-bold text-indigo-200">
                {"IRSV_i = ([NO₂]_i / 20 µg/m³) · (31.800 € / Renta_i)^β · w_categoría · w_edad"}
              </p>
              <p className="text-[9px] text-slate-400">
                Donde 20 µg/m³ es el límite anual 2030 de la Directiva (UE) 2024/2881, 31.800 € es la renta media municipal de Málaga (INE ADRH), y β controla la aversión ética a la desigualdad socioeconómica.
              </p>
            </div>
          </div>
        )}

        {/* PESTAÑA 4: EXPORTACIÓN FAIR DATA */}
        {activeTab === 'fair_export' && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-2 text-[10px] text-slate-300 font-mono">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                Resumen Citable para la Memoria Doctoral (FAIR Principles)
              </span>

              <div className="bg-black/90 p-2.5 rounded border border-slate-800 text-[9.5px] text-slate-200 leading-relaxed font-sans">
                {riskSummary.doctoralConclusion}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleExportCSV}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10px] font-bold py-1.5 px-3 rounded flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORTAR MATRIZ COMPLETA CSV</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
}

function FilterIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}
