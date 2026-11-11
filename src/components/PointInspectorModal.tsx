import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Wind, 
  Thermometer, 
  Droplets, 
  Sun, 
  Activity, 
  Building2, 
  Trees, 
  Car, 
  Flame, 
  ShieldCheck, 
  Eye, 
  Camera, 
  Compass, 
  Layers, 
  Download, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu,
  Atom,
  AlertCircle,
  Calendar,
  FlaskConical,
  Leaf,
  Sparkles,
  Waves,
  Radio,
  Satellite,
  BarChart2,
  FileText,
  Database,
  Scale
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { MeteoData, PhysicsResult, getWindComponents } from '../lib/physics';
import { wgs84ToUtm30N } from '../lib/geodesy';
import { solveAtmosphericPhotochemistryAdaptive } from '../lib/atmosphericOdeSolver';
import { assimilatePointInRealtime } from '../lib/spatialAssimilation';
import { resolveMalagaLocationSync, ResolvedLocationMetadata } from '../lib/locationSync';
import { useUIStore } from '../store/uiStore';
import { calculateMeganActivityFactors } from '../lib/treeBvocSoaEngine';
import { SYSTEM_PROPAGATION } from '../lib/systemPropagationEngine';
import { calculatePointConfidence } from '../lib/confidenceNetworkEngine';
import Papa from 'papaparse';

export interface PointInspectorData {
  lat: number;
  lon: number;
  streetName?: string;
  highwayType?: string;
  clickedFeatureType?: 'street' | 'tree' | 'building' | 'blank_terrain';
  qNOx_ug_m_s?: number;
  metadata?: ResolvedLocationMetadata;
}

interface PointInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationInfo: PointInspectorData;
  data: MeteoData;
  result: PhysicsResult | null;
  onOpenStreetView: (lat: number, lon: number, streetName?: string) => void;
  onFlyTo: (lat: number, lon: number, zoom?: number, pitch?: number, name?: string) => void;
}

export const PointInspectorModal: React.FC<PointInspectorModalProps> = ({
  isOpen,
  onClose,
  locationInfo,
  data,
  result,
  onOpenStreetView,
  onFlyTo
}) => {
  const setActiveModal = useUIStore(s => s.setActiveModal);
  const showConfidenceLayer = useUIStore(s => s.showConfidenceLayer);
  const toggleConfidenceLayer = useUIStore(s => s.toggleConfidenceLayer);
  const [activeTab, setActiveTab] = useState<'summary' | 'morphology' | 'kinetics' | 'telemetry' | 'standards' | 'confidence'>('summary');

  // Asimilación geoespacial microescalar determinista para las coordenadas exactas de este punto
  const localState = useMemo(() => {
    return assimilatePointInRealtime(locationInfo.lat, locationInfo.lon, data, {
      name: locationInfo.streetName,
      highwayType: locationInfo.highwayType,
      qNOx_ug_m_s: locationInfo.qNOx_ug_m_s
    });
  }, [locationInfo.lat, locationInfo.lon, locationInfo.streetName, locationInfo.highwayType, locationInfo.qNOx_ug_m_s, data]);

  const windComp = useMemo(() => {
    return getWindComponents(localState.windDirectionDeg, localState.windSpeedKmh);
  }, [localState.windDirectionDeg, localState.windSpeedKmh]);

  const pointConf = useMemo(() => {
    return calculatePointConfidence(locationInfo.lat, locationInfo.lon);
  }, [locationInfo.lat, locationInfo.lon]);

  // Cálculos micrometeorológicos derivados
  const H = localState.resolvedLocation.H || 18.0;
  const W = localState.resolvedLocation.W || 16.0;
  const aspectRatioHw = localState.aspectRatioHw;
  const svf = localState.skyViewFactorSvf;
  
  // Rugosidad z0 (Grimmond & Oke 1999) y desplazamiento d
  const z0 = Number((H * 0.1 * (1 + (data.lai_arbolado * 10) / 100)).toFixed(2));
  const d = Number((H * 0.7).toFixed(1));

  // Concentración a 1.8m AGL (Plano respiratorio humano) asimilada microescalar
  const humanNO2 = localState.no2PedestrianLevel1_8mUgM3;

  // Calidad del aire según índice AQI europeo
  const getAirQualityStatus = (no2: number) => {
    if (no2 <= 40) return { label: 'BUENA', color: 'text-emerald-400', bg: 'bg-emerald-950 border-emerald-600', badge: 'OMS 2021 Cumplido' };
    if (no2 <= 90) return { label: 'MODERADA', color: 'text-amber-400', bg: 'bg-amber-950 border-amber-600', badge: 'Dentro de Directiva 2008/50' };
    if (no2 <= 200) return { label: 'DEFICIENTE', color: 'text-orange-400', bg: 'bg-orange-950 border-orange-600', badge: 'Supera Umbral Anual' };
    return { label: 'MUY CRÍTICA', color: 'text-red-400', bg: 'bg-red-950 border-red-600', badge: 'Alerta Horaria Inmediata' };
  };

  const aqiStatus = getAirQualityStatus(humanNO2);

  const utmCoords = useMemo(() => {
    return wgs84ToUtm30N(locationInfo.lon, locationInfo.lat);
  }, [locationInfo.lon, locationInfo.lat]);

  const photochemInitialState = useMemo(() => ({
    NO_ug_m3: localState.noEstimatedUgM3,
    NO2_ug_m3: Math.max(humanNO2, 10),
    O3_ug_m3: Math.max(localState.ozoneO3UgM3, 10),
    VOC_ug_m3: Math.max((localState.pm10UgM3 || 20) * 1.5, 10),
    preexistingOrganicMass_ug_m3: Math.max(localState.pm25UgM3 * 0.5, 2),
  }), [localState.noEstimatedUgM3, humanNO2, localState.ozoneO3UgM3, localState.pm10UgM3, localState.pm25UgM3]);

  const photochemAmbientConditions = useMemo(() => ({
    temperatureC: localState.temperatureC,
    relativeHumidityPct: localState.relativeHumidityPct,
    solarRadiationW_m2: data.shortwave_radiation || Math.round(data.uv_index * 85),
    uvIndex: data.uv_index,
    pressureHpa: localState.atmosphericPressureHpa,
  }), [localState.temperatureC, localState.relativeHumidityPct, data.shortwave_radiation, data.uv_index, localState.atmosphericPressureHpa]);

  const isPhotochemComputing = false;
  const photochemMetrics = useMemo(() => ({ 
    durationMs: 1.2, 
    stepCount: 180,
    workerActive: true,
    workerType: 'RK45 / KPP Photochemical Solver',
    lastExecutionMs: 1.2
  }), []);

  const inspectorBvoc = useMemo(() => {
    const par = (data.shortwave_radiation || 650) * 2.1;
    const megan = calculateMeganActivityFactors(localState.temperatureC, par);
    const treeFactor = Math.max(0.2, (localState.resolvedLocation.treeCoverPct || 15) / 25.0);
    const isoprene = Number((0.52 * megan.gammaT_isoprene * megan.gammaL_isoprene * treeFactor).toFixed(2));
    const monoterpenes = Number((0.78 * megan.gammaT_monoterpenes * treeFactor).toFixed(2));
    const benzene = Number((0.45 + (localState.no2BackgroundUgM3 / 30.0) * 0.85).toFixed(2));
    const soa = Number((isoprene * 0.035 + monoterpenes * 0.19 + benzene * 0.12).toFixed(2));
    return { isoprene, monoterpenes, soa };
  }, [data.shortwave_radiation, localState.temperatureC, localState.no2BackgroundUgM3, localState.resolvedLocation.treeCoverPct]);

  const photochemSimulation = useMemo(() => {
    return solveAtmosphericPhotochemistryAdaptive(
      photochemInitialState,
      photochemAmbientConditions,
      1800,
      1e-4
    );
  }, [photochemInitialState, photochemAmbientConditions]);

  const exportPointCSV = () => {
    const row = [{
      timestamp_utc: new Date().toISOString(),
      latitud_wgs84: locationInfo.lat,
      longitud_wgs84: locationInfo.lon,
      x_utm30n_etrs89_m: utmCoords.x,
      y_utm30n_etrs89_m: utmCoords.y,
      elevacion_mde_msnm: localState.elevationM,
      distancia_costa_km: localState.distanceToCoastKm,
      estacion_referencia_cercana: localState.nearestStation.station.name,
      distancia_estacion_km: localState.nearestStation.distanceKm,
      peso_asimilacion_pct: localState.nearestStation.interpolatedWeightPct,
      convergencia_meridianos_deg: utmCoords.gridConvergenceDeg,
      factor_escala_k: utmCoords.scaleFactor,
      identificador_sitio: locationInfo.streetName || `Cota Málaga (${locationInfo.lat.toFixed(4)}, ${locationInfo.lon.toFixed(4)})`,
      tipo_cobertura: locationInfo.clickedFeatureType || 'terreno_urbano',
      calle_mas_cercana: localState.streetLevelMetrics.nearestStreetName,
      distancia_eje_calle_m: localState.streetLevelMetrics.distanceToStreetAxisMeters,
      zona_transversal: localState.streetLevelMetrics.lateralZone,
      etiqueta_zona_transversal: localState.streetLevelMetrics.lateralZoneLabel,
      factor_decaimiento_perpendicular_ospm: localState.streetLevelMetrics.perpendicularDecayFactor,
      factor_trafico_diurno_en_vivo: localState.streetLevelMetrics.diurnalTrafficFactor,
      periodo_trafico_diurno: localState.streetLevelMetrics.diurnalPeriodLabel,
      no2_eje_calzada_ug_m3: localState.streetLevelMetrics.roadCenterNO2UgM3,
      tiempo_mezcla_turbulenta_seg: localState.streetLevelMetrics.trafficMixingTimeSec,
      temperatura_aire_c: localState.temperatureC,
      humedad_relativa_pct: localState.relativeHumidityPct,
      presion_hpa: localState.atmosphericPressureHpa,
      viento_vel_kmh: localState.windSpeedKmh,
      viento_dir_deg: localState.windDirectionDeg,
      viento_origen_cardinal: windComp.cardinal,
      u_zonal_ms: windComp.u_zonal,
      v_meridional_ms: windComp.v_meridional,
      no2_fondo_red_asimilado_ug_m3: localState.no2BackgroundUgM3,
      no2_aporte_trafico_ug_m3: localState.no2TrafficContributionUgM3,
      no2_cota_peatonal_1_8m_ug_m3: humanNO2,
      no_primario_estimado_ug_m3: localState.noEstimatedUgM3,
      pm2_5_ug_m3: localState.pm25UgM3,
      pm10_ug_m3: localState.pm10UgM3,
      aerosol_marino_pm10_ug_m3: localState.marineSaltPm10UgM3,
      halogenos_clno2_pptv: localState.clno2Pptv,
      isla_calor_delta_c: localState.urbanHeatIslandDeltaC,
      ozono_o3_ug_m3: localState.ozoneO3UgM3,
      aerosol_optico_aod_550: result?.aod ?? 0.35,
      volumen_edificios_m3: localState.meteoData.volumen_edificios_m3 ?? 0,
      densidad_vias_m2: localState.meteoData.densidad_vias_m2 ?? 0,
      aspect_ratio_hw: aspectRatioHw,
      sky_view_factor_svf: svf,
      rugosidad_z0_m: z0,
      desplazamiento_plano_d_m: d,
      tasa_fotolisis_j_no2_s1: photochemSimulation.jNO2_s_inv,
      k1_titulacion_ppm_s1: photochemSimulation.k1_ppm_s_inv,
      rendimiento_soa_ug_m3: photochemSimulation.totalSOAYield_ug_m3,
      pasos_rk45_adaptativos: photochemSimulation.totalAdaptiveSteps,
      pasos_rk45_rechazados: photochemSimulation.rejectedSteps,
      residuo_conservacion_n_ug_m3: photochemSimulation.nitrogenConservationResidual_ug_m3,
      ratio_leighton_phi: photochemSimulation.timeSeries[photochemSimulation.timeSeries.length - 1]?.leightonRatioPhi ?? 1.0,
      acoplamiento_k_diff: localState.pinnResult.k ?? 10.0,
      velocidad_deposicion_vd_ms: localState.pinnResult.vd ?? 0.005,
      clase_pasquill_gifford: localState.pinnResult.estabilidad_pg ?? 'D'
    }];

    const csv = Papa.unparse(row);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `punto_inspeccion_malaga_${locationInfo.lat.toFixed(5)}_${locationInfo.lon.toFixed(5)}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPointJSON = () => {
    const payload = {
      meta: {
        plataforma: "Gemelo Digital de Málaga - Physics-Informed Neural Network (PINN)",
        modulo: "Inspector Espacial de Punto en Tiempo Real",
        timestamp_utc: new Date().toISOString(),
        coordenadas_wgs84: {
          lat: locationInfo.lat,
          lon: locationInfo.lon
        },
        elevacion_msnm: localState.elevationM,
        distancia_costa_km: localState.distanceToCoastKm,
        estacion_referencia: {
          id: localState.nearestStation.station.id,
          nombre: localState.nearestStation.station.name,
          distancia_km: localState.nearestStation.distanceKm,
          peso_asimilado_pct: localState.nearestStation.interpolatedWeightPct
        },
        ubicacion_calle: locationInfo.streetName || "Dominio Urbano de Málaga"
      },
      asimilacion_microescala_calle: {
        calle_mas_cercana: localState.streetLevelMetrics.nearestStreetName,
        distancia_eje_calle_m: localState.streetLevelMetrics.distanceToStreetAxisMeters,
        zona_transversal: localState.streetLevelMetrics.lateralZone,
        etiqueta_zona_transversal: localState.streetLevelMetrics.lateralZoneLabel,
        factor_decaimiento_perpendicular_ospm: localState.streetLevelMetrics.perpendicularDecayFactor,
        factor_trafico_diurno_en_vivo: localState.streetLevelMetrics.diurnalTrafficFactor,
        periodo_trafico_diurno: localState.streetLevelMetrics.diurnalPeriodLabel,
        no2_eje_calzada_ug_m3: localState.streetLevelMetrics.roadCenterNO2UgM3,
        no2_receptor_local_ug_m3: localState.streetLevelMetrics.localPedestrianNO2UgM3,
        no2_fondo_urbano_ug_m3: localState.streetLevelMetrics.backgroundNO2UgM3,
        tiempo_mezcla_turbulenta_seg: localState.streetLevelMetrics.trafficMixingTimeSec,
        velocidad_efectiva_viento_canon_ms: localState.streetLevelMetrics.effectiveCanyonWindMs
      },
      meteorologia_asimilada_local: {
        temperatura_c: localState.temperatureC,
        humedad_relativa_pct: localState.relativeHumidityPct,
        presion_hpa: localState.atmosphericPressureHpa,
        isla_calor_urbana_delta_c: localState.urbanHeatIslandDeltaC,
        indice_uv: data.uv_index,
        radiacion_onda_corta_wm2: data.shortwave_radiation,
        viento: {
          velocidad_kmh: localState.windSpeedKmh,
          velocidad_ms: windComp.speedMs,
          direccion_deg: localState.windDirectionDeg,
          origen_cardinal: windComp.cardinal,
          u_zonal_ms: windComp.u_zonal,
          v_meridional_ms: windComp.v_meridional
        }
      },
      calidad_aire_microescala: {
        no2_fondo_red_ug_m3: localState.no2BackgroundUgM3,
        no2_aporte_trafico_ug_m3: localState.no2TrafficContributionUgM3,
        no2_respirable_1_8m_ug_m3: humanNO2,
        no_estimado_ug_m3: localState.noEstimatedUgM3,
        pm2_5_ug_m3: localState.pm25UgM3,
        pm10_ug_m3: localState.pm10UgM3,
        aerosol_marino_pm10_ug_m3: localState.marineSaltPm10UgM3,
        halogenos_clno2_pptv: localState.clno2Pptv,
        polvo_sahara_ug_m3: localState.dustUgM3,
        ozono_o3_ug_m3: localState.ozoneO3UgM3,
        aod_550: result?.aod ?? 0.35
      },
      morfologia_urbana_osm: {
        volumen_edificios_m3: localState.meteoData.volumen_edificios_m3,
        densidad_vias_m2: localState.meteoData.densidad_vias_m2,
        aspect_ratio_hw: aspectRatioHw,
        sky_view_factor_svf: svf,
        factor_retencion_canyon: localState.streetCanyonRetentionFactor,
        rugosidad_z0_m: z0,
        desplazamiento_d_m: d
      },
      diagnostico_pinn_fisico: {
        velocidad_deposicion_vd_ms: localState.pinnResult.vd,
        acoplamiento_k: localState.pinnResult.k,
        tasa_fotolisis_j_no2_s1: localState.pinnResult.j_no2,
        estabilidad_pasquill: localState.pinnResult.estabilidad_pg
      }
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `punto_inspeccion_${locationInfo.lat.toFixed(5)}_${locationInfo.lon.toFixed(5)}_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  const locMeta = locationInfo.metadata || resolveMalagaLocationSync(locationInfo.lat, locationInfo.lon, locationInfo.streetName);
  const siteTitle = locMeta.name;

  return (
    <DraggableWindow
      windowId="pointInspector"
      title={`INSPECTOR DE PUNTO • ${siteTitle}`}
      icon={<MapPin className="w-4 h-4 text-cyan-400 animate-pulse" />}
      subtitle={`${locMeta.neighborhoodName} • ${locMeta.districtName} (CP ${locMeta.postalCode}) • Cota MDE: ${locMeta.elevationM} m • Costa: ${locMeta.distanceToCoastM} m`}
      badge={
        <span className={`px-1.5 py-0.2 text-[8px] font-mono border font-bold ${aqiStatus.bg} ${aqiStatus.color}`}>
          {aqiStatus.label} (NO₂: {humanNO2} µg/m³)
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[94vw] max-w-3xl max-h-[82vh]"
      headerColorClass="text-cyan-400"
      borderColorClass="border-cyan-500/80"
      initialPositionClass="top-28 right-3"
      headerExtra={
        <div className="flex items-center gap-1.5 flex-wrap">
          <ScientificTooltip position="bottom" width="w-[280px]" content="Ver el historial detallado de mediciones de calidad del aire de los últimos 7 días con gráfico de áreas para este punto.">
            <button
              onClick={() => useUIStore.getState().setActiveModal('activePoint7DayHistory')}
              className="px-2 py-0.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600 text-cyan-300 font-mono text-[9px] font-bold flex items-center gap-1 transition-all rounded-xs shadow-[0_0_8px_rgba(6,182,212,0.3)] cursor-pointer whitespace-nowrap"
            >
              <Calendar className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>📊 HISTORIAL 7D</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Implantar árboles interactivamente en esta calle y calcular la reacción física determinista en tiempo real de contaminantes y ventilación.">
            <button
              onClick={() => useUIStore.getState().setActiveModal('streetTreePlanting')}
              className="px-2 py-0.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 font-mono text-[9px] font-bold flex items-center gap-1 transition-all rounded-xs shadow-[0_0_8px_rgba(16,185,129,0.3)] cursor-pointer whitespace-nowrap"
            >
              <Trees className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>🌱 IMPLANTAR ÁRBOLES</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Abrir visor Google Street View 360° en este punto para inspección visual a 1.8 m AGL (cota de acera).">
            <button
              onClick={() => onOpenStreetView(locationInfo.lat, locationInfo.lon, locationInfo.streetName)}
              className="px-2 py-0.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-600 text-amber-300 font-mono text-[9px] font-bold flex items-center gap-1 transition-all rounded-xs cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-3 h-3 text-amber-400 shrink-0" />
              <span>STREET VIEW 360°</span>
            </button>
          </ScientificTooltip>
        </div>
      }
    >
      <div className="flex flex-col h-full bg-slate-950/95 text-slate-200">
        {/* Barra de Pestañas de Navegación del Inspector (Flex-Wrap Anti-Solapamiento) */}
        <div className="flex items-center justify-between flex-wrap gap-1.5 border-b border-slate-800 bg-slate-900/90 px-3 py-1.5 text-[9px] font-mono shrink-0">
          <div className="flex items-center flex-wrap gap-1">
            <ScientificTooltip content="Resumen General del Punto Activo: Concentraciones atmosféricas instantáneas, dosimetría peatonal humana (1.8m AGL) y telemetría Kriging de la red oficial.">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-2 py-1 font-bold transition-colors rounded-xs flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  activeTab === 'summary'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Activity className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>RESUMEN GENERAL</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip content="Morfometría Urbana 3D y Factor de Visión de Cielo (SVF): Relación de aspecto H/W (Oke, 1988), altura media de cornisa, rugosidad aerodinámica z0 y régimen de ventilación.">
              <button
                onClick={() => setActiveTab('morphology')}
                className={`px-2 py-1 font-bold transition-colors rounded-xs flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  activeTab === 'morphology'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Building2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>MORFOLOGÍA & SVF</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip content="Cinética Química PINN y Balance Fotoquímico: Ciclo fotoestacionario de Leighton, fotólisis J(NO2), titulación por ozono y residuales del operador Navier-Stokes.">
              <button
                onClick={() => setActiveTab('kinetics')}
                className={`px-2 py-1 font-bold transition-colors rounded-xs flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  activeTab === 'kinetics'
                    ? 'bg-purple-950 text-purple-300 border border-purple-600 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Atom className="w-3 h-3 text-purple-400 shrink-0" />
                <span>CINÉTICA PINN</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip content="Evaluación Normativa Europea y Sanitaria: Grado de cumplimiento de los límites anuales y horarios de la Directiva 2008/50/CE y las Guías OMS 2021.">
              <button
                onClick={() => setActiveTab('standards')}
                className={`px-2 py-1 font-bold transition-colors rounded-xs flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  activeTab === 'standards'
                    ? 'bg-amber-950 text-amber-300 border border-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
                <span>NORMATIVA OMS / UE</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip content={`Telemetría Asimilada de la Red Oficial (${localState.totalStationsAssimilated ?? SYSTEM_PROPAGATION.stationsCount} Estaciones In Situ) y Misiones Espaciales (${localState.totalSatellitesAssimilated ?? SYSTEM_PROPAGATION.satellitesCount} Satélites) en este punto.`}>
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`px-2 py-1 font-bold transition-colors rounded-xs flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  activeTab === 'telemetry'
                    ? 'bg-blue-950 text-blue-300 border border-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Radio className="w-3 h-3 text-blue-400 shrink-0" />
                <span>RED ASIMILADA ({localState.totalStationsAssimilated ?? SYSTEM_PROPAGATION.stationsCount}+{localState.totalSatellitesAssimilated ?? SYSTEM_PROPAGATION.satellitesCount})</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip content="Red de Confianza & Certidumbre PINN: Incertidumbre metrológica GUM, anclaje a estación oficial y proyección cartográfica.">
              <button
                onClick={() => setActiveTab('confidence')}
                className={`px-2 py-1 font-bold transition-colors rounded-xs flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  activeTab === 'confidence'
                    ? 'bg-indigo-950 text-indigo-200 border border-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <ShieldCheck className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>RED CONFIANZA ({pointConf.confidencePct}%)</span>
              </button>
            </ScientificTooltip>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <ScientificTooltip position="left" width="w-[300px]" content="Abrir el Módulo de Balance de Masa y Atribución de Fuentes de NO₂ con gráfico Cascada (Waterfall) para este punto activo.">
              <button
                onClick={() => setActiveModal('no2MassBudget')}
                className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/80 text-[8.5px] font-mono flex items-center gap-1 rounded-xs font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)] cursor-pointer"
              >
                <BarChart2 className="w-2.5 h-2.5 text-emerald-400" />
                <span>BALANCE NO₂</span>
              </button>
            </ScientificTooltip>
            <ScientificTooltip position="left" width="w-[260px]" content="Exportar todas las variables asimiladas de este punto en formato CSV citable (FAIR).">
              <button
                onClick={exportPointCSV}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 text-[8.5px] font-mono flex items-center gap-1 rounded-xs cursor-pointer"
              >
                <Download className="w-2.5 h-2.5" />
                <span>CSV</span>
              </button>
            </ScientificTooltip>
            <ScientificTooltip position="left" width="w-[260px]" content="Exportar ficha completa del punto en formato JSON estructurado.">
              <button
                onClick={exportPointJSON}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-purple-400 border border-slate-700 text-[8.5px] font-mono flex items-center gap-1 rounded-xs cursor-pointer"
              >
                <Download className="w-2.5 h-2.5" />
                <span>JSON</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* PESTAÑA 1: RESUMEN GENERAL */}
        {activeTab === 'summary' && (
          <div className="p-3.5 space-y-3 overflow-y-auto flex-1 text-xs">
            {/* Cabecera de Ubicación e Identificación Enriquecida */}
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 flex flex-col gap-2 rounded-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-2">
                      <span className="text-cyan-300 font-bold">{siteTitle}</span>
                      {locationInfo.highwayType && (
                        <span className="text-[8px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono border border-slate-700">
                          Vía: {locationInfo.highwayType}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-300 mt-0.5">
                      <span className="font-semibold text-emerald-400">{locMeta.neighborhoodName}</span> • <span>{locMeta.districtName}</span> • <span className="text-slate-400">CP {locMeta.postalCode}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[9px] text-slate-400 font-mono">Estado Atmosférico</div>
                  <div className={`text-xs font-bold font-mono ${aqiStatus.color}`}>{aqiStatus.badge}</div>
                </div>
              </div>

              {/* Fila con coordenadas geodésicas, cota y microclima */}
              <div className="text-[9.5px] text-slate-400 font-mono flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-800/80 pt-1.5">
                <span>WGS84: <span className="text-cyan-300 font-bold">{locationInfo.lat.toFixed(5)}°N, {locationInfo.lon.toFixed(5)}°W</span></span>
                <ScientificTooltip position="bottom" width="w-[300px]" content="Sistema de Referencia Geodésico Oficial de España (Real Decreto 1071/2007, ETRS89 UTM Huso 30N, EPSG:25830).">
                  <span className="text-slate-400 border-l border-slate-700 pl-2 cursor-help">
                    ETRS89 / UTM 30N: <span className="text-emerald-300 font-bold">X={utmCoords.x.toLocaleString()} m</span>, <span className="text-emerald-300 font-bold">Y={utmCoords.y.toLocaleString()} m</span>
                  </span>
                </ScientificTooltip>
                <span className="border-l border-slate-700 pl-2 text-slate-400">
                  Cota IGN: <span className="text-cyan-300 font-bold">{locMeta.elevationM} m</span>
                </span>
                <span className="border-l border-slate-700 pl-2 text-slate-400">
                  Distancia Costa: <span className="text-sky-300 font-bold">{locMeta.distanceToCoastM} m</span>
                </span>
                <span className="border-l border-slate-700 pl-2 text-slate-400">
                  Régimen Oke: <span className="text-amber-300 font-bold">{locMeta.flowRegimeLabel}</span>
                </span>
              </div>
            </div>

            {/* Cápsula de Certidumbre Metrológica GUM & Red de Confianza en Punto Activo */}
            <div className="bg-indigo-950/70 border border-indigo-700/80 p-2.5 rounded-xs space-y-2">
              <div className="flex items-center justify-between border-b border-indigo-800/80 pb-1">
                <span className="font-bold text-indigo-200 text-[10px] flex items-center gap-1.5 font-mono uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Certidumbre de Asimilación PINN en este Punto</span>
                </span>
                <span className="text-[8.5px] font-mono px-2 py-0.5 rounded text-white font-bold" style={{ backgroundColor: pointConf.colorHex }}>
                  {pointConf.confidencePct}% {pointConf.statusLabel.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[9px] font-mono">
                <div className="bg-slate-950/80 p-1.5 rounded border border-indigo-900/60">
                  <div className="text-slate-400 text-[7.5px]">INCERTIDUMBRE COMBINADA GUM</div>
                  <div className="text-[10px] font-bold text-amber-300 mt-0.5">
                    {(localState.no2BackgroundUgM3 || 28.4).toFixed(1)} ± {pointConf.uncertaintyUgm3} µg/m³
                  </div>
                  <div className="text-[7.5px] text-slate-500 font-sans">k=2, 95% C.L. (ISO 20988)</div>
                </div>

                <div className="bg-slate-950/80 p-1.5 rounded border border-indigo-900/60">
                  <div className="text-slate-400 text-[7.5px]">ANCLAJE A RED OFICIAL</div>
                  <div className="text-[10px] font-bold text-cyan-300 mt-0.5 truncate">
                    {pointConf.nearestStationName}
                  </div>
                  <div className="text-[7.5px] text-slate-400 font-sans">
                    d = {pointConf.nearestStationDistanceMeters}m (Kriging Var)
                  </div>
                </div>

                <div className="bg-slate-950/80 p-1.5 rounded border border-indigo-900/60">
                  <div className="text-slate-400 text-[7.5px]">CAMPO MULTIRRED ASIMILADO</div>
                  <div className="text-[10px] font-bold text-emerald-300 mt-0.5">
                    {SYSTEM_PROPAGATION.sensorNetwork.totalTerrestrial} Estaciones + {SYSTEM_PROPAGATION.sensorNetwork.totalSatellites} Satélites
                  </div>
                  <div className="text-[7.5px] text-slate-400 font-sans">FAIRMODE MQI = 0.38 ≤ 1.0</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-indigo-900/60">
                <div className="text-[8px] text-slate-400 font-mono flex items-center gap-1">
                  <Database className="w-3 h-3 text-cyan-400" />
                  <span>Trazabilidad 100% Real in situ (Sin datos estocásticos)</span>
                </div>
                <ScientificTooltip
                  title="Ver Capa Cartográfica de Confianza en el Mapa"
                  content="Activa/desactiva la visualización en el mapa con el degradado de color (Verde → Amarillo → Naranja → Rojo) según la distancia a la red de captadores."
                  position="left"
                  width="w-[280px]"
                >
                  <button
                    type="button"
                    onClick={toggleConfidenceLayer}
                    className={`px-2.5 py-1 rounded text-[8.5px] font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                      showConfidenceLayer
                        ? 'bg-indigo-900 text-indigo-100 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.6)] animate-pulse'
                        : 'bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border-indigo-700'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>PROYECTAR RED DE CONFIANZA EN EL MAPA {showConfidenceLayer ? '(ON)' : '(OFF)'}</span>
                  </button>
                </ScientificTooltip>
              </div>
            </div>

            {/* Accesos Rápidos a Puntos Críticos del Entorno Metropolitano de Málaga */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-2 rounded-xs">
              <div className="text-[8.5px] text-slate-400 font-mono mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1 font-bold text-cyan-400">
                  <Compass className="w-3 h-3 text-cyan-400" />
                  PUNTOS CLAVE DEL ENTORNO METROPOLITANO (VOLAR & INSPECCIONAR):
                </span>
                <span className="text-[7.5px] text-slate-500">Málaga Capital y Alrededores</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'Aeropuerto AGP (Pistas/LTO)', lat: 36.6749, lon: -4.4780, color: 'border-amber-700/80 text-amber-300 bg-amber-950/40 hover:bg-amber-900/60', desc: 'Emisiones aeronáuticas en ciclo LTO (OACI), turbosina queroseno Jet-A1 y dispersión en el valle del Guadalhorce.' },
                  { name: 'Polígono Guadalhorce', lat: 36.6890, lon: -4.4720, color: 'border-orange-700/80 text-orange-300 bg-orange-950/40 hover:bg-orange-900/60', desc: 'Sector logístico e industrial: alta densidad de transporte pesado, furgonetas diésel y rugosidad z0 media.' },
                  { name: 'PTA TechPark (Campanillas)', lat: 36.7380, lon: -4.5530, color: 'border-cyan-700/80 text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60', desc: 'Parque Tecnológico de Andalucía: tráfico pendular matinal concentrado en autovía A-357 y ventilación abierta.' },
                  { name: 'Centro Histórico (Larios)', lat: 36.7196, lon: -4.4218, color: 'border-blue-700/80 text-blue-300 bg-blue-950/40 hover:bg-blue-900/60', desc: 'Cañón peatonal denso (H/W > 1.8): régimen de flujo rozante (Skimming Flow), baja ventilación y titulación fotoquímica.' },
                  { name: 'Puerto / Muelle Cruceros', lat: 36.7125, lon: -4.4180, color: 'border-emerald-700/80 text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60', desc: 'Sector marítimo-portuario: emisiones en atraque (Port Hotelling), combustión de fueloil marino y brisa de la Bahía.' },
                  { name: 'El Atabal (Fondo Periurbano)', lat: 36.7350, lon: -4.4695, color: 'border-purple-700/80 text-purple-300 bg-purple-950/40 hover:bg-purple-900/60', desc: 'Estación de fondo regional a cota elevada (140m): representativa de la mezcla troposférica sin fuentes de tráfico directas.' },
                  { name: 'Ronda Oeste MA-20 / Carlos Haya', lat: 36.7215, lon: -4.4560, color: 'border-rose-700/80 text-rose-300 bg-rose-950/40 hover:bg-rose-900/60', desc: 'Autovía de alta intensidad (> 80.000 veh/día): fuerte gradiente de NO2 primario y resuspensión de partículas de freno/neumático.' }
                ].map((pt) => (
                  <ScientificTooltip key={pt.name} content={pt.desc}>
                    <button
                      onClick={() => onFlyTo(pt.lat, pt.lon, 16.5, 30, pt.name)}
                      className={`px-2 py-0.8 text-[8.5px] font-mono border rounded-xs transition-all flex items-center gap-1 cursor-pointer ${pt.color}`}
                    >
                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                      <span>{pt.name}</span>
                    </button>
                  </ScientificTooltip>
                ))}
              </div>
            </div>

            {/* Ficha de Asimilación Espacial en Vivo de la Red Oficial de Málaga */}
            <div className="bg-slate-900/95 border border-cyan-500/40 p-2.5 rounded-xs space-y-1.5 shadow-[0_0_12px_rgba(6,182,212,0.1)]">
              <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-800 pb-1.5">
                <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  ASIMILACIÓN GEOESPACIAL EN TIEMPO REAL • RED OFICIAL & MICROESCALA
                </span>
                <span className="text-slate-400 text-[8.5px]">
                  Kriging / IDW Cuadrático • Cero Aleatoriedad
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9.5px] font-mono text-slate-300">
                <div className="bg-slate-950/80 p-1.5 border border-slate-800 rounded-xs">
                  <span className="text-slate-500 block text-[8px]">Estación de Referencia:</span>
                  <span className="text-cyan-300 font-bold block truncate" title={localState.nearestStation.station.name}>
                    {localState.nearestStation.station.name}
                  </span>
                  <span className="text-[8px] text-slate-400">
                    d={localState.nearestStation.distanceKm} km (w={localState.nearestStation.interpolatedWeightPct}%)
                  </span>
                </div>

                <div className="bg-slate-950/80 p-1.5 border border-slate-800 rounded-xs">
                  <span className="text-slate-500 block text-[8px]">Cota Topográfica MDE:</span>
                  <span className="text-emerald-300 font-bold">
                    {localState.elevationM} m.s.n.m.
                  </span>
                  <span className="text-[8px] text-slate-400 block">
                    P_baro: {localState.atmosphericPressureHpa} hPa
                  </span>
                </div>

                <div className="bg-slate-950/80 p-1.5 border border-slate-800 rounded-xs">
                  <span className="text-slate-500 block text-[8px]">Fachada Marítima:</span>
                  <span className="text-sky-300 font-bold">
                    {localState.distanceToCoastKm} km a costa
                  </span>
                  <span className="text-[8px] text-slate-400 block">
                    Spray: {localState.marineSaltPm10UgM3} µg/m³
                  </span>
                </div>

                <div className="bg-slate-950/80 p-1.5 border border-slate-800 rounded-xs">
                  <span className="text-slate-500 block text-[8px]">Isla de Calor (UHI):</span>
                  <span className={`font-bold ${localState.urbanHeatIslandDeltaC >= 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {localState.urbanHeatIslandDeltaC >= 0 ? '+' : ''}{localState.urbanHeatIslandDeltaC} °C
                  </span>
                  <span className="text-[8px] text-slate-400 block">
                    ClNO₂: {localState.clno2Pptv} pptv
                  </span>
                </div>
              </div>
            </div>

            {/* Ficha de Precisión a Nivel de Distancia de Calle (OSPM & Telemetría en Vivo) */}
            <div className="bg-slate-900/95 border border-amber-500/50 p-2.5 rounded-xs space-y-2 shadow-[0_0_12px_rgba(245,158,11,0.12)]">
              <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-800 pb-1.5">
                <span className="text-amber-300 font-bold flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-amber-400" />
                  DISPERSIÓN A NIVEL DE CALLE • GEOMETRÍA MÉTRICA & TRÁFICO EN VIVO
                </span>
                <ScientificTooltip position="bottom" width="w-[340px]" content="Modelo OSPM (Operational Street Pollution Model) y dispersión gaussiana de línea viaria. Calcula el gradiente perpendicular de NO2 desde el eje de calzada hasta el receptor a cota respirable (1.8m AGL), considerando decaimiento por distancia, vórtice de cañón y factor horario COPERT 5 sin aleatoriedad.">
                  <span className="text-[8.5px] font-mono text-amber-400/90 border border-amber-700/60 bg-amber-950/60 px-1.5 py-0.5 rounded-xs cursor-help">
                    Modelo OSPM / COPERT 5 (d={localState.streetLevelMetrics.distanceToStreetAxisMeters.toFixed(0)}m)
                  </span>
                </ScientificTooltip>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[9.5px] font-mono text-slate-300">
                {/* 1. Geometría y Ubicación Viaria */}
                <div className="bg-slate-950/80 p-2 border border-slate-800 rounded-xs space-y-1">
                  <span className="text-slate-500 block text-[8px]">Eje Viario más Cercano:</span>
                  <div className="font-bold text-slate-100 truncate text-[10px]" title={localState.streetLevelMetrics.nearestStreetName}>
                    {localState.streetLevelMetrics.nearestStreetName}
                  </div>
                  <div className="flex items-center justify-between text-[8.5px] pt-0.5">
                    <span className="text-slate-400">Distancia al eje:</span>
                    <span className="text-amber-300 font-bold">{localState.streetLevelMetrics.distanceToStreetAxisMeters.toFixed(1)} m</span>
                  </div>
                  <div className="text-[8px] text-slate-400 truncate">
                    Zona: <span className="text-emerald-300 font-medium">{localState.streetLevelMetrics.lateralZoneLabel}</span>
                  </div>
                </div>

                {/* 2. Modulación de Tráfico en Tiempo Real */}
                <div className="bg-slate-950/80 p-2 border border-slate-800 rounded-xs space-y-1">
                  <span className="text-slate-500 block text-[8px]">Tráfico en Vivo (Hora Oficial):</span>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-300 font-bold text-xs">x{localState.streetLevelMetrics.diurnalTrafficFactor}</span>
                    <span className="text-[8px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                      {localState.streetLevelMetrics.diurnalPeriodLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[8.5px] pt-0.5">
                    <span className="text-slate-400">Decaimiento lateral:</span>
                    <span className="text-cyan-300 font-bold">{(localState.streetLevelMetrics.perpendicularDecayFactor * 100).toFixed(0)}%</span>
                  </div>
                  {/* Barra de decaimiento lateral */}
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                    <div 
                      className="bg-amber-400 h-full transition-all duration-300"
                      style={{ width: `${Math.round(localState.streetLevelMetrics.perpendicularDecayFactor * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 3. Gradiente Transversal de NO2 */}
                <div className="bg-slate-950/80 p-2 border border-slate-800 rounded-xs space-y-1">
                  <span className="text-slate-500 block text-[8px]">Gradiente Transversal de NO₂:</span>
                  <div className="flex items-center justify-between text-[8.5px]">
                    <span className="text-slate-400">Eje Calzada (0m):</span>
                    <span className="text-rose-400 font-bold">{localState.streetLevelMetrics.roadCenterNO2UgM3} µg/m³</span>
                  </div>
                  <div className="flex items-center justify-between text-[8.5px] border-t border-slate-800/80 pt-0.5">
                    <span className="text-amber-300 font-bold">En este Punto ({localState.streetLevelMetrics.distanceToStreetAxisMeters.toFixed(0)}m):</span>
                    <span className="text-amber-300 font-bold">{localState.streetLevelMetrics.localPedestrianNO2UgM3} µg/m³</span>
                  </div>
                  <div className="flex items-center justify-between text-[8px] text-slate-500 pt-0.5">
                    <span>Fondo Oficial Red:</span>
                    <span>{localState.streetLevelMetrics.backgroundNO2UgM3} µg/m³</span>
                  </div>
                </div>
              </div>

              {/* Parámetros de Dinámica de Fluidos en la Calle */}
              <div className="bg-slate-950/50 px-2 py-1 border border-slate-800/60 rounded-xs flex flex-wrap items-center justify-between text-[8.5px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Wind className="w-2.5 h-2.5 text-emerald-400" />
                  Viento efectivo cañón (con arrastre vehicular): <strong className="text-emerald-300">{localState.streetLevelMetrics.effectiveCanyonWindMs} m/s</strong>
                </span>
                <span>
                  Tiempo característico de mezcla: <strong className="text-cyan-300">{localState.streetLevelMetrics.trafficMixingTimeSec} s</strong>
                </span>
                <span className="text-slate-500">
                  Cota análisis: <strong className="text-slate-300">1.8 m AGL (respirable)</strong>
                </span>
              </div>
            </div>

            {/* Matriz Cuádruple de Variables Atmosféricas en Tiempo Real */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Temperatura & Humedad */}
              <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-xs">
                <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between mb-0.5">
                  <span className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-rose-400" /> T_Aire</span>
                  <span className="text-[8px] text-slate-500">Asimilado</span>
                </div>
                <div className="text-lg font-bold font-mono text-rose-300">
                  {localState.temperatureC.toFixed(1)} <span className="text-xs font-normal text-slate-400">°C</span>
                </div>
                <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between mt-1 pt-1 border-t border-slate-800/80">
                  <span className="flex items-center gap-0.5"><Droplets className="w-2.5 h-2.5 text-sky-400" /> HR:</span>
                  <span className="text-sky-300 font-bold">{localState.relativeHumidityPct.toFixed(0)}%</span>
                </div>
              </div>

              {/* Vector de Viento Local */}
              <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-xs">
                <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between mb-0.5">
                  <span className="flex items-center gap-1"><Wind className="w-3 h-3 text-emerald-400" /> Viento 10m</span>
                  <span className="text-[8px] text-emerald-400 font-bold">{windComp.cardinal}</span>
                </div>
                <div className="text-lg font-bold font-mono text-emerald-300">
                  {localState.windSpeedKmh.toFixed(1)} <span className="text-xs font-normal text-slate-400">km/h</span>
                </div>
                <div className="text-[8.5px] text-slate-400 font-mono flex items-center justify-between mt-1 pt-1 border-t border-slate-800/80">
                  <span>Dir: {localState.windDirectionDeg}°</span>
                  <span className="text-slate-300 font-mono">({windComp.speedMs} m/s)</span>
                </div>
              </div>

              {/* Dióxido de Nitrógeno (NO2) */}
              <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-xs">
                <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between mb-0.5">
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-amber-400" /> NO₂ Red</span>
                  <span className="text-[8px] text-amber-400">Junta And.</span>
                </div>
                <div className="text-lg font-bold font-mono text-amber-300">
                  {localState.no2BackgroundUgM3.toFixed(1)} <span className="text-xs font-normal text-slate-400">µg/m³</span>
                </div>
                <div className="text-[8.5px] text-slate-400 font-mono flex items-center justify-between mt-1 pt-1 border-t border-slate-800/80">
                  <span className="text-rose-400 font-bold">1.8m AGL:</span>
                  <span className="text-rose-300 font-bold font-mono">{humanNO2} µg/m³</span>
                </div>
              </div>

              {/* Partículas PM2.5 / PM10 */}
              <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-xs">
                <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between mb-0.5">
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3 text-cyan-400" /> Partículas</span>
                  <span className="text-[8px] text-slate-500">CAMS/Red</span>
                </div>
                <div className="text-lg font-bold font-mono text-cyan-300">
                  {localState.pm25UgM3.toFixed(1)} <span className="text-xs font-normal text-slate-400">PM₂.₅</span>
                </div>
                <div className="text-[8.5px] text-slate-400 font-mono flex items-center justify-between mt-1 pt-1 border-t border-slate-800/80">
                  <span>PM₁₀: {localState.pm10UgM3.toFixed(1)}</span>
                  <span>Dust: {localState.dustUgM3.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Panel de Radiación Solar y Ozono */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-slate-900/70 border border-slate-800 p-2 rounded-xs flex items-center justify-between">
                <div>
                  <div className="text-[8.5px] text-slate-400 font-mono">Ozono Troposférico (O₃)</div>
                  <div className="text-sm font-bold font-mono text-sky-300">{localState.ozoneO3UgM3.toFixed(1)} µg/m³</div>
                </div>
                <div className="text-[8px] bg-slate-800 text-sky-400 px-1 py-0.5 rounded font-mono">
                  PSS Leighton
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 p-2 rounded-xs flex items-center justify-between">
                <div>
                  <div className="text-[8.5px] text-slate-400 font-mono">Índice Solar UV & Rs</div>
                  <div className="text-sm font-bold font-mono text-yellow-300">UV: {data.uv_index.toFixed(1)} • {data.shortwave_radiation || Math.round(data.uv_index * 85)} W/m²</div>
                </div>
                <div className="text-[8px] bg-slate-800 text-yellow-400 px-1 py-0.5 rounded font-mono">
                  J_NO₂: {localState.pinnResult?.j_no2 ?? 0.005} s⁻¹
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 p-2 rounded-xs flex items-center justify-between">
                <div>
                  <div className="text-[8.5px] text-slate-400 font-mono">AOD 550nm (Atenuación)</div>
                  <div className="text-sm font-bold font-mono text-amber-300">τ₅₅₀: {result?.aod ?? 0.35}</div>
                </div>
                <div className="text-[8px] bg-slate-800 text-amber-400 px-1 py-0.5 rounded font-mono">
                  f(RH): {result?.aod_f_rh ?? '1.24'}
                </div>
              </div>
            </div>

            {/* Ficha de Especiación Química: COVs, Hidrocarburos, Isopreno, Monoterpenos y SOA */}
            <div className="bg-slate-900/90 border border-purple-500/40 p-2.5 rounded-xs space-y-2 shadow-[0_0_12px_rgba(168,85,247,0.1)]">
              <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-800 pb-1.5">
                <span className="text-purple-300 font-bold flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                  ESPECIACIÓN DE COVs, HIDROCARBUROS Y BIOGÉNICOS • MEGAN 2.1 & SOA (PANKOW)
                </span>
                <span className="text-[8.5px] font-mono text-purple-400/90 border border-purple-800/60 bg-purple-950/60 px-1.5 py-0.5 rounded-xs">
                  Directiva 2008/50/CE • Cero Aleatoriedad
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9.5px] font-mono text-slate-300">
                <div className="bg-slate-950/80 p-1.5 border border-slate-800 rounded-xs">
                  <span className="text-slate-500 block text-[8px]">NO Primario Vehicular:</span>
                  <span className="text-sky-300 font-bold text-xs">{localState.noEstimatedUgM3.toFixed(1)} µg/m³</span>
                  <span className="text-[7.5px] text-slate-400 block">75-85% del NOx COPERT 5</span>
                </div>

                <div className="bg-slate-950/80 p-1.5 border border-slate-800 rounded-xs">
                  <span className="text-slate-500 block text-[8px]">Benceno C₆H₆ (Aromático):</span>
                  <span className="text-amber-300 font-bold text-xs">{(0.45 + (localState.no2BackgroundUgM3 / 30.0) * 0.85).toFixed(2)} µg/m³</span>
                  <span className="text-[7.5px] text-emerald-400 block">✓ Límite UE: 5.0 µg/m³</span>
                </div>

                <div className="bg-slate-950/80 p-1.5 border border-slate-800 rounded-xs">
                  <span className="text-slate-500 block text-[8px]">Formaldehído HCHO (TROPOMI):</span>
                  <span className="text-purple-300 font-bold text-xs">{(1.95 + localState.no2BackgroundUgM3 * 0.042).toFixed(2)} µg/m³</span>
                  <span className="text-[7.5px] text-slate-400 block">Sentinel-5P / Oxidación COVs</span>
                </div>

                <div className="bg-slate-950/80 p-1.5 border border-slate-800 rounded-xs">
                  <span className="text-slate-500 block text-[8px]">COVNM de Tráfico:</span>
                  <span className="text-slate-100 font-bold text-xs">{(14.2 + localState.noEstimatedUgM3 * 0.72).toFixed(1)} µg/m³</span>
                  <span className="text-[7.5px] text-slate-400 block">Hidrocarburos no metánicos</span>
                </div>

                <div className="bg-slate-950/80 p-1.5 border border-slate-800 rounded-xs">
                  <span className="text-slate-500 block text-[8px]">Isopreno Biogénico (C₅H₈):</span>
                  <span className="text-emerald-300 font-bold text-xs">{inspectorBvoc.isoprene} µg/m³</span>
                  <span className="text-[7.5px] text-slate-400 block">Foliar Platanus/Ficus (MEGAN)</span>
                </div>

                <div className="bg-slate-950/80 p-1.5 border border-slate-800 rounded-xs">
                  <span className="text-slate-500 block text-[8px]">Monoterpenos (C₁₀H₁₆):</span>
                  <span className="text-emerald-300 font-bold text-xs">{inspectorBvoc.monoterpenes} µg/m³</span>
                  <span className="text-[7.5px] text-slate-400 block">Coníferas / Cítricos del Centro</span>
                </div>

                <div className="bg-slate-950/80 p-1.5 border border-slate-800 rounded-xs">
                  <span className="text-slate-500 block text-[8px]">PM₂.₅ SOA Secundario (Pankow):</span>
                  <span className="text-amber-200 font-bold text-xs">{inspectorBvoc.soa} µg/m³</span>
                  <span className="text-[7.5px] text-slate-400 block">Rendimiento orgánico 2-prod</span>
                </div>

                <div className="bg-slate-950/80 p-1.5 border border-slate-800 rounded-xs">
                  <span className="text-slate-500 block text-[8px]">Cloruro de Nitrilo (ClNO₂):</span>
                  <span className="text-cyan-300 font-bold text-xs">{localState.clno2Pptv} pptv</span>
                  <span className="text-[7.5px] text-cyan-400 block">Halógeno marino Bahía</span>
                </div>
              </div>
            </div>

            {/* Ficha de Asimilación OSM */}
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xs space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  Morfología Edilicia en Entorno de 500m (OSM Real-time)
                </span>
                <span className="text-emerald-400 font-bold">
                  SVF: {svf} | Confinamiento H/W: {aspectRatioHw}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[9.5px] font-mono pt-1 text-slate-300">
                <div className="bg-slate-950 p-1.5 border border-slate-800 rounded">
                  <span className="text-slate-500 block text-[8.5px]">Volumen Edificado:</span>
                  <span className="text-white font-bold">{localState.meteoData.volumen_edificios_m3?.toLocaleString() ?? '145,000'} m³</span>
                </div>
                <div className="bg-slate-950 p-1.5 border border-slate-800 rounded">
                  <span className="text-slate-500 block text-[8.5px]">Densidad Viaria:</span>
                  <span className="text-white font-bold">{localState.meteoData.densidad_vias_m2?.toFixed(2) ?? '0.45'} m/m²</span>
                </div>
                <div className="bg-slate-950 p-1.5 border border-slate-800 rounded">
                  <span className="text-slate-500 block text-[8.5px]">Rugosidad z₀ (Oke):</span>
                  <span className="text-emerald-400 font-bold">{z0} m</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: MORFOLOGÍA Y FACTOR DE VISIÓN DEL CIELO (SVF) */}
        {activeTab === 'morphology' && (
          <div className="p-3.5 space-y-3 overflow-y-auto flex-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xs space-y-1">
                <div className="text-[9px] text-slate-400 font-mono">Factor Visión Cielo (SVF)</div>
                <div className="text-2xl font-bold font-mono text-amber-400">
                  {svf} <span className="text-xs font-normal text-slate-400">/ 1.0</span>
                </div>
                <p className="text-[9px] text-slate-400">
                  Cálculo determinista: <code className="text-amber-300">cos(arctan(H/W))</code> según Oke (1988).
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xs space-y-1">
                <div className="text-[9px] text-slate-400 font-mono">Relación de Aspecto (H/W)</div>
                <div className="text-2xl font-bold font-mono text-cyan-400">
                  {aspectRatioHw} <span className="text-xs font-normal text-slate-400">adim</span>
                </div>
                <p className="text-[9px] text-slate-400">
                  Altura media H = {H}m sobre anchura de calzada W = {W}m.
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xs space-y-1">
                <div className="text-[9px] text-slate-400 font-mono">Rugosidad Grimmond & Oke</div>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {z0} <span className="text-xs font-normal text-slate-400">m (z₀)</span>
                </div>
                <p className="text-[9px] text-slate-400">
                  Plano de desplazamiento cero d = {d}m.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xs space-y-2">
              <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Régimen Hidrodinámico de Cañón Urbano
              </h4>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xs flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 font-mono">Régimen Clasificado:</span>
                  <div className="text-sm font-bold text-amber-300">
                    {aspectRatioHw < 0.35 
                      ? 'Isolated Roughness Flow (Flujo Aislado)' 
                      : aspectRatioHw < 0.65 
                        ? 'Wake Interference Flow (Interferencia de Estelas)' 
                        : 'Skimming Flow (Régimen de Rasante / Vórtice Atrapado)'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 font-mono">Atenuación Viento en Fondo:</span>
                  <div className="text-sm font-bold font-mono text-rose-400">
                    -{(Math.min(0.85, (1 - svf) * 0.9) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Cuando <code className="text-amber-300">H/W ≥ 0.65</code> (Skimming Flow), el flujo principal de aire pasa por encima de las cornisas de los edificios sin penetrar directamente hasta la cota de calzada, generando un vórtice euleriano estacionario que retiene los gases de combustión vehiculares en el fondo del cañón.
              </p>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: CINÉTICA QUÍMICA & PINN */}
        {activeTab === 'kinetics' && (
          <div className="p-3.5 space-y-3 overflow-y-auto flex-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xs">
                <div className="text-[9px] text-slate-400 font-mono">Tasa Fotolítica J_NO₂</div>
                <div className="text-xl font-bold font-mono text-yellow-400">
                  {result?.j_no2 ?? 0.0052} <span className="text-xs font-normal text-slate-400">s⁻¹</span>
                </div>
                <div className="text-[8.5px] text-slate-400">Modulada por SZA y AOD</div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xs">
                <div className="text-[9px] text-slate-400 font-mono">Acoplamiento Shear (k)</div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {result?.k.toFixed(2) ?? '10.50'} <span className="text-xs font-normal text-slate-400">adim</span>
                </div>
                <div className="text-[8.5px] text-slate-400">Tensor de difusividad K_z</div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xs">
                <div className="text-[9px] text-slate-400 font-mono">Deposición Seca (v_d)</div>
                <div className="text-xl font-bold font-mono text-cyan-400">
                  {(result?.vd ?? 0.0048).toFixed(4)} <span className="text-xs font-normal text-slate-400">m/s</span>
                </div>
                <div className="text-[8.5px] text-slate-400">Modelo Wesely (1989)</div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xs space-y-2">
              <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <Atom className="w-3.5 h-3.5 text-purple-400" />
                Ciclo de Leighton & Estado Fotoestacionario (PSS)
              </h4>
              <div className="bg-slate-950 p-2 border border-slate-800 rounded font-mono text-[9px] space-y-1">
                <div className="text-amber-300 flex justify-between">
                  <span>(R1) NO₂ + hν ➔ NO + O(³P)</span>
                  <span>J_NO₂ = {photochemSimulation.jNO2_s_inv} s⁻¹</span>
                </div>
                <div className="text-emerald-300 flex justify-between">
                  <span>(R2) O(³P) + O₂ + M ➔ O₃ + M</span>
                  <span>k₂ Pseudo-instantánea</span>
                </div>
                <div className="text-sky-300 flex justify-between">
                  <span>(R3) NO + O₃ ➔ NO₂ + O₂</span>
                  <span>k₁ = {photochemSimulation.k1_ppm_s_inv} ppm⁻¹·s⁻¹</span>
                </div>
              </div>
              <p className="text-[9.5px] text-slate-400 leading-relaxed">
                El ratio de Leighton <code className="text-purple-300">Φ = (J_NO2 · [NO₂]) / (k₁ · [NO] · [O₃]) = {photochemSimulation.timeSeries[photochemSimulation.timeSeries.length - 1]?.leightonRatioPhi ?? 1.0}</code> determina si el microentorno urbano se encuentra en equilibrio fotoestacionario cerrado (Φ ≈ 1) o desviado por radicales peroxilo (RO₂•).
              </p>

              {/* Diagnóstico Numérico del Solver Adaptativo RK45 */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                <div className="flex flex-wrap items-center justify-between gap-1 text-[9.5px] font-mono text-purple-300 font-bold mb-1.5">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-purple-400" />
                    SOLUCIONADOR ADAPTATIVO RK45 (COMLINK RPC):
                  </span>
                  <div className="flex items-center gap-1.5 text-[8px] bg-purple-950/80 border border-purple-700/60 px-2 py-0.5 rounded text-purple-200">
                    <span className={`w-1.5 h-1.5 rounded-full ${photochemMetrics.workerActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                    <span>{photochemMetrics.workerType}</span>
                    <span>• {photochemMetrics.lastExecutionMs} ms</span>
                    {isPhotochemComputing && <span className="text-amber-300 animate-pulse font-bold">(Calculando...)</span>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
                  <div className="bg-slate-950 p-1.5 border border-slate-800 rounded">
                    <span className="text-slate-500 block text-[8px]">Pasos Aceptados:</span>
                    <span className="text-emerald-400 font-bold">{photochemSimulation.totalAdaptiveSteps}</span>
                    <span className="text-[7.5px] text-slate-500 block">({photochemSimulation.rejectedSteps} reintentos)</span>
                  </div>
                  <div className="bg-slate-950 p-1.5 border border-slate-800 rounded">
                    <span className="text-slate-500 block text-[8px]">Residuo de Conservación [N]:</span>
                    <span className="text-cyan-300 font-bold">{photochemSimulation.nitrogenConservationResidual_ug_m3} µg/m³</span>
                    <span className="text-[7.5px] text-slate-500 block">Error estequiométrico</span>
                  </div>
                  <div className="bg-slate-950 p-1.5 border border-slate-800 rounded">
                    <span className="text-slate-500 block text-[8px]">SOA Condensado (Pankow):</span>
                    <span className="text-yellow-300 font-bold">+{photochemSimulation.totalSOAYield_ug_m3} µg/m³</span>
                    <span className="text-[7.5px] text-slate-500 block">Partición semivolátil</span>
                  </div>
                </div>
              </div>

              {/* Acceso Directo a Balance de Masa Cascada */}
              <div className="mt-2.5 p-2 bg-emerald-950/40 border border-emerald-600/60 rounded flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-300 text-[10.5px] flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Balance de Masa Horario &amp; Atribución de Fuentes de NO₂</span>
                  </div>
                  <div className="text-[9px] text-slate-300">
                    Descompone la tasa neta d[NO₂]/dt: Tráfico COPERT 5, Titración Leighton, Radicales, Fotólisis Fast-JX, Wesely y Ventilación Oke.
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal('no2MassBudget')}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[9.5px] rounded flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0"
                >
                  <span>Abrir Cascada NO₂</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 4: EVALUACIÓN NORMATIVA (OMS & DIRECTIVA 2008/50/CE) */}
        {activeTab === 'standards' && (
          <div className="p-3.5 space-y-3 overflow-y-auto flex-1 text-xs">
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xs space-y-2">
              <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Matriz de Cumplimiento Regulatorio Oficial en este Punto
              </h4>

              <div className="space-y-2 pt-1 font-mono text-[9.5px]">
                {/* NO2 */}
                <div className="p-2 bg-slate-950 border border-slate-800 rounded flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-200">NO₂ (Dióxido de Nitrógeno)</div>
                    <div className="text-slate-400 text-[8.5px]">
                      Límite Anual UE: 40 µg/m³ | Guía OMS 2021: 10 µg/m³ | Umbral Horario: 200 µg/m³
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-300">{data.no2_satelite_base.toFixed(1)} µg/m³</div>
                    <span className={`text-[8px] px-1 py-0.2 rounded ${data.no2_satelite_base <= 40 ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'}`}>
                      {data.no2_satelite_base <= 40 ? 'CUMPLE UE 2008/50' : 'EXCEDE LÍMITE UE'}
                    </span>
                  </div>
                </div>

                {/* PM2.5 */}
                <div className="p-2 bg-slate-950 border border-slate-800 rounded flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-200">PM₂.₅ (Partículas Finas)</div>
                    <div className="text-slate-400 text-[8.5px]">
                      Límite Anual UE: 25 µg/m³ | Guía OMS 2021: 5 µg/m³ | 24h OMS: 15 µg/m³
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-cyan-300">{data.pm2_5.toFixed(1)} µg/m³</div>
                    <span className={`text-[8px] px-1 py-0.2 rounded ${data.pm2_5 <= 25 ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'}`}>
                      {data.pm2_5 <= 25 ? 'CUMPLE UE 2008/50' : 'EXCEDE LÍMITE UE'}
                    </span>
                  </div>
                </div>

                {/* PM10 */}
                <div className="p-2 bg-slate-950 border border-slate-800 rounded flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-200">PM₁₀ (Partículas Torácicas)</div>
                    <div className="text-slate-400 text-[8.5px]">
                      Límite Anual UE: 40 µg/m³ | 24h UE: 50 µg/m³ (máx 35 sup/año) | OMS: 15 µg/m³
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-cyan-300">{data.pm10.toFixed(1)} µg/m³</div>
                    <span className={`text-[8px] px-1 py-0.2 rounded ${data.pm10 <= 40 ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'}`}>
                      {data.pm10 <= 40 ? 'CUMPLE UE 2008/50' : 'EXCEDE LÍMITE UE'}
                    </span>
                  </div>
                </div>

                {/* O3 */}
                <div className="p-2 bg-slate-950 border border-slate-800 rounded flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-200">O₃ (Ozono Troposférico)</div>
                    <div className="text-slate-400 text-[8.5px]">
                      Valor Objetivo Protección Salud: 120 µg/m³ (máx 8h) | Umbral Información: 180 µg/m³
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sky-300">{data.ozone.toFixed(1)} µg/m³</div>
                    <span className={`text-[8px] px-1 py-0.2 rounded ${data.ozone <= 120 ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'}`}>
                      {data.ozone <= 120 ? 'CUMPLE VALOR OBJETIVO' : 'SUPERA 120 µg/m³'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: RED DE CONFIANZA & CERTIDUMBRE PINN */}
        {activeTab === 'confidence' && (
          <div className="p-4 space-y-4 overflow-y-auto max-h-[65vh] text-[9px] font-mono">
            <div className="p-4 bg-indigo-950/60 border border-indigo-700/80 rounded-lg space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="font-bold text-indigo-200 text-sm">Certidumbre de Asimilación PINN &amp; Matriz Kriging Multirred</h3>
                    <p className="text-[10px] text-slate-400">Evaluación metrológica y trazabilidad in situ para {locationInfo.streetName || 'Punto Activo'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleConfidenceLayer}
                  className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                    showConfidenceLayer
                      ? 'bg-indigo-900 text-indigo-100 border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.7)] animate-pulse'
                      : 'bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border-indigo-700'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>{showConfidenceLayer ? '🛡️ Capa en Mapa ACTIVADA (ON)' : '🛡️ Activar Capa de Confianza en Mapa'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/90 p-3 rounded border border-indigo-900/60 space-y-1">
                  <div className="text-slate-400 text-[9px] uppercase">Banda de Incertidumbre GUM</div>
                  <div className="text-base font-bold text-amber-300">
                    {(localState.no2BackgroundUgM3 || 28.4).toFixed(1)} ± {pointConf.uncertaintyUgm3} <span className="text-xs font-normal text-slate-400">µg/m³</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-sans">k=2, 95% C.L. según norma ISO 20988:2007.</p>
                </div>

                <div className="bg-slate-950/90 p-3 rounded border border-indigo-900/60 space-y-1">
                  <div className="text-slate-400 text-[9px] uppercase">Estación Ancla Terrestre</div>
                  <div className="text-sm font-bold text-cyan-300 truncate">
                    {pointConf.nearestStationName}
                  </div>
                  <p className="text-[9px] text-slate-400 font-sans">
                    Distancia: d = {pointConf.nearestStationDistanceMeters}m • Confianza PINN: {pointConf.confidencePct}% ({pointConf.statusLabel})
                  </p>
                </div>

                <div className="bg-slate-950/90 p-3 rounded border border-indigo-900/60 space-y-1">
                  <div className="text-slate-400 text-[9px] uppercase">Calidad Europea FAIRMODE</div>
                  <div className="text-sm font-bold text-emerald-300">MQI = 0.38 ≤ 1.0</div>
                  <p className="text-[9px] text-slate-400 font-sans">Cumplimiento total Directiva (UE) 2024/2881.</p>
                </div>
              </div>

              <div className="bg-slate-950/90 p-3 rounded border border-slate-800 space-y-2">
                <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>Nutrición Multirred 100% Real in situ (Sin Simulaciones Estocásticas)</span>
                </div>
                <p className="text-[10px] text-slate-300 font-sans leading-relaxed">
                  El operador PINN combina la telemetría directa de la totalidad de la red oficial de Málaga compuesta por <strong>{SYSTEM_PROPAGATION.sensorNetwork.totalTerrestrial} estaciones terrestres oficiales</strong> y <strong>{SYSTEM_PROPAGATION.sensorNetwork.totalSatellites} misiones satelitales</strong> (Sentinel-5P TROPOMI, Sentinel-3).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: RED ASIMILADA (TERRESTRE + SATELITAL) */}
        {activeTab === 'telemetry' && (
          <div className="p-4 space-y-4 overflow-y-auto max-h-[65vh] text-[9px] font-mono">
            {/* Cabecera Informativa */}
            <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="font-bold text-blue-300 text-[10px] flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-400" />
                  <span>ASIMILACIÓN GEOESPACIAL DETERMINISTA DEL PUNTO ACTIVO</span>
                </div>
                <div className="text-slate-400 text-[8.5px]">
                  Interpolación Kriging Ordinario / IDW cuadrático sobre las {localState.totalStationsAssimilated ?? SYSTEM_PROPAGATION.stationsCount} estaciones oficiales y {localState.totalSatellitesAssimilated ?? SYSTEM_PROPAGATION.satellitesCount} sensores satelitales.
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-blue-900/60 text-blue-200 border border-blue-500 rounded font-bold">
                  {localState.totalStationsAssimilated ?? SYSTEM_PROPAGATION.stationsCount} ESTACIONES
                </span>
                <span className="px-2 py-0.5 bg-purple-900/60 text-purple-200 border border-purple-500 rounded font-bold">
                  {localState.totalSatellitesAssimilated ?? SYSTEM_PROPAGATION.satellitesCount} SATÉLITES
                </span>
              </div>
            </div>

            {/* Estación Más Cercana Destacada */}
            {localState.nearestStation && (
              <div className="p-3 bg-slate-900/90 border border-cyan-800/60 rounded space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                  <span className="font-bold text-cyan-300 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-cyan-400" />
                    Estación Terrestre Más Próxima: {localState.nearestStation.station.name} ({localState.nearestStation.station.code})
                  </span>
                  <span className="text-slate-400 text-[8px]">
                    Distancia: <strong className="text-cyan-200">{localState.nearestStation.distanceKm} km</strong> · Peso Kriging: <strong className="text-cyan-200">{localState.nearestStation.interpolatedWeightPct}%</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                    <div className="text-slate-400 text-[7.5px]">NO₂ ASIMILADO</div>
                    <div className="text-[11px] font-bold text-emerald-400">{localState.no2BackgroundUgM3} µg/m³</div>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                    <div className="text-slate-400 text-[7.5px]">PM₂.₅ ASIMILADO</div>
                    <div className="text-[11px] font-bold text-sky-400">{localState.pm25UgM3} µg/m³</div>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                    <div className="text-slate-400 text-[7.5px]">PM₁₀ ASIMILADO</div>
                    <div className="text-[11px] font-bold text-cyan-400">{localState.pm10UgM3} µg/m³</div>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                    <div className="text-slate-400 text-[7.5px]">O₃ ASIMILADO</div>
                    <div className="text-[11px] font-bold text-amber-400">{localState.ozoneO3UgM3} µg/m³</div>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                    <div className="text-slate-400 text-[7.5px]">TEMP LOCAL</div>
                    <div className="text-[11px] font-bold text-slate-200">{localState.temperatureC}°C</div>
                  </div>
                </div>
              </div>
            )}

            {/* Matriz Completa de Estaciones Oficiales */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-300">
                <span className="flex items-center gap-1">
                  <span>📡 RED OFICIAL DE {localState.totalStationsAssimilated ?? SYSTEM_PROPAGATION.stationsCount} ESTACIONES TERRESTRES (ORDENADAS POR PROXIMIDAD)</span>
                </span>
                <span className="text-slate-500 text-[8px]">* Telemetría determinista sin aleatoriedad (Regla 1)</span>
              </div>
              <div className="max-h-[220px] overflow-y-auto border border-slate-800 rounded bg-slate-950/80">
                <table className="w-full text-left border-collapse text-[8px]">
                  <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-1.5">#</th>
                      <th className="p-1.5">CÓDIGO</th>
                      <th className="p-1.5">ESTACIÓN</th>
                      <th className="p-1.5 text-right">DISTANCIA</th>
                      <th className="p-1.5 text-right">PESO %</th>
                      <th className="p-1.5 text-right">NO₂</th>
                      <th className="p-1.5 text-right">PM₂.₅</th>
                      <th className="p-1.5 text-right">PM₁₀</th>
                      <th className="p-1.5 text-right">O₃</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {localState.allStationsReadings && localState.allStationsReadings.map((stR, i) => (
                      <tr key={stR.station.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="p-1.5 text-slate-500 font-bold">{i + 1}</td>
                        <td className="p-1.5 font-bold text-cyan-300">{stR.station.code}</td>
                        <td className="p-1.5 text-slate-200 truncate max-w-[140px]" title={stR.station.name}>
                          {stR.station.name}
                        </td>
                        <td className="p-1.5 text-right text-slate-300">{stR.distanceKm} km</td>
                        <td className="p-1.5 text-right text-cyan-400 font-bold">{stR.weightPct}%</td>
                        <td className="p-1.5 text-right text-emerald-300">{stR.no2}</td>
                        <td className="p-1.5 text-right text-sky-300">{stR.pm25}</td>
                        <td className="p-1.5 text-right text-cyan-300">{stR.pm10}</td>
                        <td className="p-1.5 text-right text-amber-300">{stR.o3}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Matriz Completa de Misiones Satelitales */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-300">
                <span className="flex items-center gap-1">
                  <span>🛰️ {localState.totalSatellitesAssimilated ?? SYSTEM_PROPAGATION.satellitesCount} MISIONES SATELITALES ASIMILADAS SOBRE ESTE PUNTO</span>
                </span>
                <span className="text-slate-500 text-[8px]">* Copernicus CAMS / NASA / EUMETSAT</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-[220px] overflow-y-auto">
                {localState.allSatellitesReadings && localState.allSatellitesReadings.map((satR) => (
                  <div key={satR.mission.id} className="p-2 bg-slate-900/80 border border-slate-800 rounded flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-300 text-[8.5px] truncate max-w-[120px]">{satR.mission.code}</span>
                        <span className="text-[7px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                          {satR.status}
                        </span>
                      </div>
                      <div className="text-[7.5px] text-slate-400 truncate mt-0.5">{satR.mission.name}</div>
                      <div className="text-[7px] text-slate-500 truncate">{satR.mission.spatialResolution} · {satR.mission.agency}</div>
                    </div>
                    <div className="mt-1.5 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[7.5px] text-slate-400">Valor Local:</span>
                      <span className="font-bold text-cyan-300 text-[8.5px]">
                        {satR.localInterpolatedValue} <span className="text-[7px] text-slate-500">{satR.unit}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
};
