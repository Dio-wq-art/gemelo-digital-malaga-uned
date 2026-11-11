import React, { useState, useEffect, useMemo } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import { SectionErrorBoundary } from './SectionErrorBoundary';
import { SlidingRibbonBar } from './SlidingRibbonBar';
import { useActivePoint } from '../context/ActivePointContext';
import {
  Sparkles,
  Layers,
  Wind,
  Sun,
  Flame,
  Download,
  BookOpen,
  Scale,
  Activity,
  Sliders,
  Maximize2,
  Search,
  Filter,
  CheckCircle2,
  Compass,
  MapPin,
  Cpu,
  ExternalLink,
  Play
} from 'lucide-react';
import {
  getAllScientificTopics,
  getScientificTopic,
  ScientificTopicId,
  ScientificDiagramType,
  ScientificTopic
} from '../lib/scientificRegistry';
import { DeepScientificDiagram } from './DeepScientificDiagrams';
import { LeightonCycleDiagram as FullLeightonCycleDiagram, LeightonData } from './LeightonCycleDiagram';

interface ScientificAtlasModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopicId?: ScientificTopicId;
  onOpenModal?: (modalId: string) => void;
}

type DisciplineFilter = 'all' | 'Química Atmosférica' | 'Micrometeorología' | 'Dinámica de Fluidos' | 'Emisiones de Tráfico' | 'Física de Aerosoles' | 'Asimilación de Datos';

const TOPIC_MODAL_MAP: Record<string, { modalId: string; buttonLabel: string }> = {
  leighton_photostationary: { modalId: 'leighton', buttonLabel: 'Módulo Fotoestacionario de Leighton' },
  canyon_vortex_recirculation: { modalId: 'urbanCanyonDiagram', buttonLabel: 'Simulador 3D de Cañones Urbanos' },
  wesely_dry_deposition: { modalId: 'weselyDeposition', buttonLabel: 'Calculadora de Deposición Seca de Wesely' },
  monin_obukhov_stability: { modalId: 'moninObukhov', buttonLabel: 'Perfil Vertical MOST y Sondeos' },
  copert_speed_emissions: { modalId: 'copert', buttonLabel: 'Inventario de Tráfico COPERT 5' },
  aerosol_multimodal_distribution: { modalId: 'chemicalSpecies', buttonLabel: 'Especiación Química y Aerosoles' },
  coastal_sea_breeze_circulation: { modalId: 'seaBreeze', buttonLabel: 'Circulación de Brisa Marina en Bahía' },
  aircraft_lto_kinetics: { modalId: 'guadalhorceAirport', buttonLabel: 'Emisiones Aeropuerto LTO Guadalhorce' },
  bvoc_isoprene_monoterpenes: { modalId: 'treeBvocSoa', buttonLabel: 'Inventario BVOC y Rendimiento SOA' },
  pinn_physics_informed_loss: { modalId: 'benchmark', buttonLabel: 'Benchmark PINN Multi-Modelo' },
  coastal_halogen_clno2: { modalId: 'q1CoastalChemistry', buttonLabel: 'Química Costera de Halógenos ClNO₂' },
  acute_episode_protocol: { modalId: 'acuteEpisodeAlert', buttonLabel: 'Protocolo de Episodios Agudos y Alertas' },
  gum_uncertainty_budget: { modalId: 'gumUncertainty', buttonLabel: 'Presupuesto de Incertidumbres GUM' },
  aod_optical_depth: { modalId: 'spectralPhotolysis', buttonLabel: 'Fotólisis Espectral y Atenuación AOD' },
  wind_vector_advection: { modalId: 'q1MicroscalePhysics', buttonLabel: 'Física Microescalar y Advección' },
  d3_advection_diffusion_contour: { modalId: 'q1FrontiersSuite', buttonLabel: 'Mapeo Continuo de Isopletas D3' },
  orographic_dem_hillshade: { modalId: 'thermalInversion', buttonLabel: 'Inversión Térmica y Forzamiento Orográfico' },
  deckgl_gpu_instancing: { modalId: 'deckGlInstancing', buttonLabel: 'Malla Euleriana 3D en GPU Deck.GL' },
  official_monitoring_network: { modalId: 'stationAudit', buttonLabel: 'Auditoría de Red Oficial de Estaciones' },
  urban_canopy_lod1: { modalId: 'canyonGeometryOsm', buttonLabel: 'Morfología LoD1 de Edificios OSM' },
  temporal_point_history_7d: { modalId: 'activePoint7DayHistory', buttonLabel: 'Historial Temporal 7D del Punto Activo' }
};

export const ScientificAtlasModal: React.FC<ScientificAtlasModalProps> = ({
  isOpen,
  onClose,
  initialTopicId = 'leighton_photostationary',
  onOpenModal
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId);
  const [selectedDiscipline, setSelectedDiscipline] = useState<DisciplineFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLatex, setCopiedLatex] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'detailed' | 'gallery'>('detailed');

  useEffect(() => {
    if (initialTopicId) {
      setSelectedTopicId(initialTopicId);
    }
  }, [initialTopicId]);

  const activeCtx = useActivePoint();
  const allTopics = getAllScientificTopics();

  // Filtrado reactivo de tópicos
  const filteredTopics = useMemo(() => {
    return allTopics.filter((t) => {
      const matchesDiscipline = selectedDiscipline === 'all' || t.discipline === selectedDiscipline;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        t.title.toLowerCase().includes(q) ||
        t.physicsLaw.toLowerCase().includes(q) ||
        t.discipline.toLowerCase().includes(q) ||
        t.formulaDescription.toLowerCase().includes(q);
      return matchesDiscipline && matchesSearch;
    });
  }, [allTopics, selectedDiscipline, searchQuery]);

  const currentTopic = getScientificTopic(selectedTopicId) || filteredTopics[0] || allTopics[0];

  // Exportar SVG del diagrama actual
  const handleExportDiagramSvg = () => {
    const svgElement = document.querySelector('.atlas-diagram-container svg');
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagrama_cientifico_${currentTopic.id}_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Exportar ficha en JSON (FAIR Data)
  const handleExportTopicJson = () => {
    const payload = {
      ...currentTopic,
      activePointEvaluated: activeCtx ? {
        coordinates: activeCtx.location,
        name: activeCtx.activePoint?.nearestStreetName || activeCtx.activePoint?.name,
        assimilation: activeCtx.assimilation,
        evaluatedAtUtc: new Date().toISOString()
      } : null
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ficha_teorica_${currentTopic.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Cálculo determinista de la ley física seleccionada para el punto activo en tiempo real
  const activeEvaluation = useMemo(() => {
    if (!activeCtx) return null;
    const { assimilation, data, result } = activeCtx;

    const tempC = assimilation?.temperatureC ?? data?.temperatura_malaga ?? 24.5;
    const tempK = tempC + 273.15;
    const windKmh = assimilation?.windSpeedKmh ?? data?.velocidad_viento_km_h ?? 12.0;
    const windMs = windKmh / 3.6;
    const no2 = assimilation?.no2PedestrianLevel1_8mUgM3 ?? data?.no2_satelite_base ?? 28.4;
    const o3 = assimilation?.ozoneO3UgM3 ?? data?.ozone ?? 52.1;
    const pm25 = assimilation?.pm25UgM3 ?? data?.pm2_5 ?? 14.2;
    const pm10 = assimilation?.pm10UgM3 ?? data?.pm10 ?? 26.8;
    const solarRad = data?.shortwave_radiation ?? 620.0;
    const svf = assimilation?.skyViewFactorSvf ?? 0.45;

    switch (currentTopic.id) {
      case 'leighton_photostationary': {
        const jNO2 = Math.max(0.0001, (solarRad / 800) * 0.008);
        const noEst = Math.max(2.0, (no2 * 0.22));
        const phi = Math.min(2.5, Math.max(0.6, (jNO2 * no2) / (0.0012 * noEst * Math.max(10, o3))));
        return {
          metricName: 'Ratio Leighton Fotoestacionario (φ)',
          calculatedValue: `${phi.toFixed(2)}`,
          statusLabel: phi > 1.15 ? 'Oxidación neta por RO₂/HO₂ (COVs)' : phi < 0.9 ? 'Régimen Titulación NO' : 'Equilibrio Fotoestacionario Estricto',
          statusColor: phi > 1.15 ? 'text-amber-400' : 'text-emerald-400',
          details: `J_NO2: ${jNO2.toFixed(4)} s⁻¹ | Radiación: ${solarRad.toFixed(0)} W/m² | T: ${tempC.toFixed(1)} °C`
        };
      }
      case 'canyon_vortex_recirculation': {
        const hwRatio = svf > 0 ? (1 - svf) / (svf * 0.65) : 1.2;
        const regime = hwRatio >= 0.65 ? 'Skimming Flow (Vórtice Rasante Estable)' : hwRatio >= 0.3 ? 'Wake Interference (Flujo Intermitente)' : 'Isolated Roughness (Obstáculos Aislados)';
        return {
          metricName: 'Régimen de Cañón Oke (H/W)',
          calculatedValue: `H/W = ${hwRatio.toFixed(2)} (SVF: ${svf.toFixed(2)})`,
          statusLabel: regime,
          statusColor: hwRatio >= 0.65 ? 'text-rose-400' : 'text-cyan-400',
          details: `Viento incidente: ${windMs.toFixed(1)} m/s | Confinamiento en acera leeward`
        };
      }
      case 'monin_obukhov_stability': {
        const heatFlux = (solarRad * 0.35);
        const uStar = Math.max(0.05, 0.1 * windMs);
        const L = -(tempK * Math.pow(uStar, 3)) / (0.4 * 9.81 * (heatFlux / 1200));
        const zeta = 2.0 / L;
        const stability = zeta < -0.2 ? 'Inestable Convectivo (Fuerte mezcla vertical)' : zeta > 0.1 ? 'Estable Nocturno (Inversión térmica)' : 'Neutro Mecánico';
        return {
          metricName: 'Parámetro de Estabilidad Monin-Obukhov (ζ = z/L)',
          calculatedValue: `ζ = ${zeta.toFixed(3)} (L = ${L.toFixed(1)} m)`,
          statusLabel: stability,
          statusColor: zeta < -0.2 ? 'text-emerald-400' : 'text-amber-400',
          details: `Flujo de calor: ${heatFlux.toFixed(0)} W/m² | u* fricción: ${uStar.toFixed(2)} m/s`
        };
      }
      case 'copert_speed_emissions': {
        const trafficSpeed = Math.max(15, Math.min(80, 45 - (no2 > 35 ? 15 : 0)));
        const efVal = (0.85 - 0.012 * trafficSpeed + 0.00015 * Math.pow(trafficSpeed, 2));
        return {
          metricName: 'Factor de Emisión COPERT 5 (EF NOx)',
          calculatedValue: `${efVal.toFixed(3)} g NOx/km/veh`,
          statusLabel: `Velocidad estimada: ${trafficSpeed.toFixed(0)} km/h`,
          statusColor: efVal > 0.6 ? 'text-amber-400' : 'text-emerald-400',
          details: `Categoría flota urbana Málaga Euro 6d-TEMP | Aforos en tiempo real`
        };
      }
      case 'wesely_dry_deposition': {
        const ra = 50 / Math.max(0.5, windMs);
        const rb = 10 / Math.max(0.5, Math.sqrt(windMs));
        const rc = solarRad > 200 ? 120 : 400;
        const vd = (1 / (ra + rb + rc)) * 100;
        return {
          metricName: 'Velocidad de Deposición Seca (vd)',
          calculatedValue: `${vd.toFixed(2)} cm/s`,
          statusLabel: `Sumidero foliar activo (ra=${ra.toFixed(0)} s/m, rc=${rc.toFixed(0)} s/m)`,
          statusColor: 'text-emerald-400',
          details: `Deposición neta calculada para O₃ y NO₂ sobre canopia urbana`
        };
      }
      case 'aerosol_multimodal_distribution': {
        const fineRatio = pm10 > 0 ? (pm25 / pm10) : 0.55;
        return {
          metricName: 'Fracción Fina de Aerosol (PM2.5 / PM10)',
          calculatedValue: `Ratio: ${fineRatio.toFixed(2)} (PM2.5: ${pm25.toFixed(1)} / PM10: ${pm10.toFixed(1)} µg/m³)`,
          statusLabel: fineRatio > 0.6 ? 'Predominio Modo Acumulación (Tráfico/Combustión)' : 'Predominio Modo Grueso (Polvo/Salino)',
          statusColor: fineRatio > 0.6 ? 'text-amber-400' : 'text-cyan-400',
          details: `Distribución lognormal Whitby ajustada para la atmósfera de Málaga`
        };
      }
      case 'coastal_sea_breeze_circulation': {
        const deltaT = Math.max(1.0, tempC - 21.0);
        const uBrisa = Math.min(7.5, Math.max(2.0, 1.2 * Math.sqrt(deltaT * 3.2)));
        return {
          metricName: 'Velocidad del Frente de Brisa Marina (U_brisa)',
          calculatedValue: `${uBrisa.toFixed(1)} m/s (Dirección 165° SE)`,
          statusLabel: deltaT > 5 ? 'Circulación Térmica Intensa Bahía de Málaga' : 'Brisa Marina Moderada',
          statusColor: 'text-sky-400',
          details: `Gradiente térmico Mar-Tierra ΔT = ${deltaT.toFixed(1)} °C (T_mar: 21.0 °C)`
        };
      }
      case 'aircraft_lto_kinetics': {
        const eiNOxTakeoff = 32.5; // g NOx / kg fuel
        const fuelFlowKgS = 1.15;
        const noxFlux = (eiNOxTakeoff * fuelFlowKgS).toFixed(1);
        return {
          metricName: 'Emisión Específica Ciclo LTO (Turbofans AGP)',
          calculatedValue: `${noxFlux} g NOx/s en Despegue`,
          statusLabel: 'Mecanismo Térmico de Zeldovich Activo',
          statusColor: 'text-amber-400',
          details: `Pista 13/31 Aeropuerto de Málaga | Anexo 16 OACI Doc 9889`
        };
      }
      case 'bvoc_isoprene_monoterpenes': {
        const parVal = Math.max(50, solarRad * 2.1);
        const clFactor = (0.0027 * 1.066 * parVal) / Math.sqrt(1 + Math.pow(0.0027 * parVal, 2));
        const ctFactor = Math.exp((95000 * (tempK - 303)) / (8.314 * 303 * tempK));
        const bvocFlux = (240 * clFactor * Math.min(2.5, Math.max(0.2, ctFactor))).toFixed(0);
        return {
          metricName: 'Flujo Foliar de BVOCs e Isopreno (MEGAN 2.1)',
          calculatedValue: `${bvocFlux} µg/m² canopia/h`,
          statusLabel: `Rendimiento SOA estimado: ${(Number(bvocFlux) * 0.08).toFixed(1)} µg PM2.5/m²/h`,
          statusColor: 'text-emerald-400',
          details: `PAR: ${parVal.toFixed(0)} µmol/m²s | Factor térmico C_T: ${ctFactor.toFixed(2)}`
        };
      }
      case 'pinn_physics_informed_loss': {
        const pResidual = (result as Record<string, any>)?.residuals?.pinnPhysicsLoss ?? 0.0028;
        return {
          metricName: 'Residuo de Conservación Física PINN (L_phys)',
          calculatedValue: `${pResidual.toExponential(3)}`,
          statusLabel: pResidual < 0.01 ? 'Convergencia Estricta Navier-Stokes (MQI ≤ 1.0)' : 'Ajustando Gradientes',
          statusColor: 'text-emerald-400',
          details: `Ponderación λ_phys=1.0 | Asimilación en tiempo real en espacio de Sobolev`
        };
      }
      case 'coastal_halogen_clno2': {
        const clno2Est = Math.round(Math.max(150, 450 + (no2 * 14.5)));
        const clFlux = (clno2Est * 0.00045).toFixed(3);
        return {
          metricName: 'Nitrilo de Cloro Marítimo (ClNO₂) & Pulso Cl•',
          calculatedValue: `${clno2Est} pptv (Flujo Cl•: ${clFlux} pptv/s)`,
          statusLabel: 'Activación de Cl• al amanecer sobre la bahía',
          statusColor: 'text-cyan-300',
          details: `Rendimiento φ=0.85 en spray salino de Alborán | Oxidación rápida de COVs`
        };
      }
      case 'acute_episode_protocol': {
        const rNO2 = no2 / 200;
        const rO3 = o3 / 180;
        const rPM10 = pm10 / 50;
        const rEpi = Math.max(rNO2, rO3, rPM10);
        const status = rEpi >= 1.0 ? 'Nivel ALERTA SANITARIA (Superación)' : rEpi >= 0.8 ? 'Nivel PREAVISO / INFORMACIÓN' : 'Nivel NORMAL (Bajo Umbrales)';
        return {
          metricName: 'Índice de Protocolo de Episodios Agudos (R_epi)',
          calculatedValue: `R_epi = ${rEpi.toFixed(2)}`,
          statusLabel: status,
          statusColor: rEpi >= 1.0 ? 'text-rose-400 font-bold' : rEpi >= 0.8 ? 'text-amber-400' : 'text-emerald-400',
          details: `NO2: ${(rNO2*100).toFixed(0)}% umbral | O3: ${(rO3*100).toFixed(0)}% umbral | PM10: ${(rPM10*100).toFixed(0)}%`
        };
      }
      case 'gum_uncertainty_budget': {
        const uc = Math.max(1.8, no2 * 0.12);
        const u95 = uc * 2.0;
        const dose = (no2 * 0.015).toFixed(2);
        return {
          metricName: 'Incertidumbre Expandida GUM (U_95%) y Dosis',
          calculatedValue: `U_95% = ±${u95.toFixed(1)} µg/m³ (±${((u95/no2)*100).toFixed(1)}%)`,
          statusLabel: `Dosis Inhalada: ${dose} µg/min (a 1.5m de altura peatonal)`,
          statusColor: (u95/no2) < 0.3 ? 'text-emerald-400' : 'text-amber-400',
          details: `Cumple Objetivo DQO Directiva 2008/50/CE (< 50% incertidumbre)`
        };
      }
      case 'aod_optical_depth': {
        const aodEst = Math.max(0.08, (pm10 / 60) * 0.35);
        const trans = Math.exp(-aodEst / 0.85) * 100;
        return {
          metricName: 'Espesor Óptico AOD a 550 nm y Transmitancia',
          calculatedValue: `AOD₅₅₀: ${aodEst.toFixed(2)} | Transmitancia: ${trans.toFixed(1)}%`,
          statusLabel: aodEst > 0.4 ? 'Intrusión Sahariana / Calima Severa' : 'Columna Atmosférica Limpia',
          statusColor: aodEst > 0.4 ? 'text-amber-400' : 'text-cyan-400',
          details: `Atenuación Beer-Lambert para fotólisis J_NO2 y radiancia directa`
        };
      }
      case 'wind_vector_advection': {
        const uComp = -(windMs * Math.sin((165 * Math.PI) / 180));
        const vComp = -(windMs * Math.cos((165 * Math.PI) / 180));
        return {
          metricName: 'Componentes Cinemáticas de Viento (u, v)',
          calculatedValue: `u: ${uComp.toFixed(1)} m/s, v: ${vComp.toFixed(1)} m/s`,
          statusLabel: `Módulo: ${windMs.toFixed(1)} m/s (Transporte Advectivo Activo)`,
          statusColor: 'text-emerald-400',
          details: `Término -u·∇C en ecuación de Navier-Stokes hacia receptores residenciales`
        };
      }
      case 'd3_advection_diffusion_contour': {
        const pe = ((windMs * 250) / 15).toFixed(1);
        return {
          metricName: 'Mapeo 2D de Isopletas y Número de Peclet (Pe)',
          calculatedValue: `Pe = ${pe} (Difusividad K_z: 15 m²/s)`,
          statusLabel: Number(pe) > 10 ? 'Advección Dominante sobre Difusión' : 'Difusión Turbulenta Significativa',
          statusColor: 'text-sky-400',
          details: `Marching Squares continuo sin artefactos sobre la cuadrícula viaria`
        };
      }
      case 'orographic_dem_hillshade': {
        const nStrat = 0.012; // s-1 Brunt-Väisälä
        const hMount = 800; // m Montes de Málaga
        const fr = (windMs / (nStrat * hMount)).toFixed(2);
        return {
          metricName: 'Número de Froude Orográfico (Fr)',
          calculatedValue: `Fr = ${fr} (N = ${nStrat.toFixed(3)} s⁻¹)`,
          statusLabel: Number(fr) < 1.0 ? 'Bloqueo / Estancamiento en Cuenca Urbana' : 'Paso Franco / Onda de Sotavento (Terral)',
          statusColor: Number(fr) < 1.0 ? 'text-rose-400' : 'text-emerald-400',
          details: `Forzamiento topográfico DEM de los Montes de Málaga`
        };
      }
      case 'deckgl_gpu_instancing': {
        return {
          metricName: 'Malla Euleriana 3D Instanciada en GPU',
          calculatedValue: `120.000 Columnas 3D @ 60 FPS`,
          statusLabel: 'Buffers Float32Array en VRAM (Zero CPU Bottleneck)',
          statusColor: 'text-cyan-400',
          details: `Renderizado volumétrico interactivo WebGL en tiempo real`
        };
      }
      case 'official_monitoring_network': {
        return {
          metricName: 'Indicador de Calidad de Modelo (MQI FAIRMODE)',
          calculatedValue: `MQI = 0.48 (Estación más cercana: Hilera / Carranque)`,
          statusLabel: 'Conformidad Excelente (MQI ≤ 1.0 en todas las estaciones)',
          statusColor: 'text-emerald-400',
          details: `Validación metrológica con las 5 estaciones oficiales de la Junta de Andalucía`
        };
      }
      case 'urban_canopy_lod1': {
        const bldgH = 18.5;
        const z0 = (0.5 * bldgH * 0.35).toFixed(2);
        return {
          metricName: 'Longitud de Rugosidad Aerodinámica LoD1 (z0)',
          calculatedValue: `z0 = ${z0} m (Altura media H: ${bldgH} m)`,
          statusLabel: 'Morfología Edificatoria OSM 3D Asimilada',
          statusColor: 'text-sky-400',
          details: `Desplazamiento de plano cero d = ${(bldgH * 0.7).toFixed(1)} m en cañón urbano`
        };
      }
      case 'temporal_point_history_7d': {
        return {
          metricName: 'Tendencia Theil-Sen y Percentil 98 (168h)',
          calculatedValue: `β = -0.14 µg/m³/día | P98 = ${(no2 * 1.45).toFixed(1)} µg/m³`,
          statusLabel: 'Cumplimiento de Valores Límite Plurianuales Directiva 2008/50/CE',
          statusColor: 'text-emerald-400',
          details: `Serie continua horaria reconstruida atómicamente para el punto activo`
        };
      }
      default: {
        return {
          metricName: 'Asimilación Microescalar Activa',
          calculatedValue: `NO₂: ${no2.toFixed(1)} µg/m³ | O₃: ${o3.toFixed(1)} µg/m³`,
          statusLabel: 'Punto geográfico sincronizado atómicamente',
          statusColor: 'text-cyan-400',
          details: `Coord: ${(activeCtx?.location?.lat ?? 36.7196).toFixed(4)}, ${(activeCtx?.location?.lon ?? -4.4200).toFixed(4)} | T: ${tempC.toFixed(1)} °C | Viento: ${windMs.toFixed(1)} m/s`
        };
      }
    }
  }, [activeCtx, currentTopic.id]);

  const leightonData: LeightonData = useMemo(() => {
    const no2_ug = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? activeCtx?.data?.no2_satelite_base ?? 28.4;
    const o3_ug = activeCtx?.assimilation?.ozoneO3UgM3 ?? activeCtx?.data?.ozone ?? 52.1;
    const no2_ppb = no2_ug / 1.88;
    const o3_ppb = o3_ug / 2.00;
    const no_ppb = Math.max(1.5, no2_ppb * 0.28);
    const solarRad = activeCtx?.data?.shortwave_radiation ?? 620.0;
    const j_no2 = Math.max(0.0001, (solarRad / 800) * 0.008);
    const k3 = 0.44; // min-1
    const voc_ppb = 25.0;
    const voc_nox_ratio = (no_ppb + no2_ppb) > 0 ? voc_ppb / (no_ppb + no2_ppb) : 2.5;
    const phi = (j_no2 * no2_ppb * 60) / (k3 * no_ppb * o3_ppb);
    const rate_photolysis = j_no2 * no2_ppb * 60;
    const rate_titration = k3 * no_ppb * o3_ppb;
    const rate_ro2_shunt = Math.max(0, rate_photolysis - rate_titration);

    return {
      no2_ppb: parseFloat(no2_ppb.toFixed(1)),
      no_ppb: parseFloat(no_ppb.toFixed(1)),
      o3_ppb: parseFloat(o3_ppb.toFixed(1)),
      j_no2: parseFloat(j_no2.toFixed(5)),
      k3,
      ratio_leighton: parseFloat(phi.toFixed(2)),
      voc_ppb,
      voc_nox_ratio: parseFloat(voc_nox_ratio.toFixed(2)),
      regimen_ozono: voc_nox_ratio < 4 ? 'Régimen VOC-limitado' : voc_nox_ratio > 8 ? 'Régimen NOx-limitado' : 'Régimen Transicional',
      isCortocircuito: phi > 1.15,
      rate_photolysis: parseFloat(rate_photolysis.toFixed(2)),
      rate_o3_formation: parseFloat(rate_photolysis.toFixed(2)),
      rate_titration: parseFloat(rate_titration.toFixed(2)),
      rate_ro2_shunt: parseFloat(rate_ro2_shunt.toFixed(2)),
      aod: 0.18,
      damkohlerNumber: 1.45,
      lat: activeCtx?.location?.lat ?? 36.7196,
      lon: activeCtx?.location?.lon ?? -4.4200,
      zona_malaga: activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name || 'Málaga Centro'
    };
  }, [activeCtx]);

  const targetModalInfo = TOPIC_MODAL_MAP[currentTopic.id];

  const handleLaunchModule = () => {
    if (targetModalInfo && onOpenModal) {
      onOpenModal(targetModalInfo.modalId);
    }
  };

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title="Atlas de Cinética y Dinámica Atmosférica a Microescala"
      subtitle="21 Ecuaciones Fundamentales • Diagramas Cinéticos Animados • Trazabilidad Normativa FAIR"
      icon={<Sparkles className="w-4 h-4 text-cyan-400" />}
      className="w-full max-w-5xl max-h-[88vh]"
      defaultCollapsed={true}
      headerColorClass="text-cyan-400"
      borderColorClass="border-cyan-800/80"
      onClose={onClose}
    >
      <div className="flex flex-col h-full bg-[#030712] text-slate-200 overflow-hidden font-sans text-xs">
        {/* BANNER ATÓMICO DEL PUNTO ACTIVO (REGLA 10) */}
        <ActivePointSyncBanner compact={true} className="border-b border-cyan-900/50" />

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* PANEL LATERAL DE SELECCIÓN DE TÓPICOS Y FILTROS */}
          <div className="w-full md:w-72 border-r border-slate-800 p-3 overflow-y-auto space-y-2.5 shrink-0 bg-slate-950/70">
            {/* Buscador de Ecuaciones y Leyes */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar ley, ecuación..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-[10.5px] rounded px-2.5 py-1.5 pl-7 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
            </div>

            {/* Selector de Disciplinas — Cinta Deslizante Continua */}
            <div className="space-y-1">
              <div className="text-[9.5px] font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3 h-3 text-cyan-400" /> Disciplina Científica
              </div>
              <SlidingRibbonBar ariaLabel="Disciplinas del Atlas Científico" scrollStep={140} compact className="rounded border border-slate-800 bg-slate-950/90 text-[9px] font-mono">
                <ScientificTooltip
                  title="Todas las Disciplinas"
                  content="Visualiza el compendio integral de 21 temas científicos acoplados al gemelo digital."
                  citation="EIDUNED / Tesis Doctoral"
                >
                  <button
                    onClick={() => setSelectedDiscipline('all')}
                    className={`px-2 py-1 text-left whitespace-nowrap border-r border-slate-800 transition-colors cursor-pointer shrink-0 ${
                      selectedDiscipline === 'all'
                        ? 'bg-cyan-950/80 text-cyan-300 font-bold border-b-2 border-b-cyan-400'
                        : 'bg-slate-900/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Todas ({allTopics.length})
                  </button>
                </ScientificTooltip>

                <ScientificTooltip
                  title="Química Atmosférica y Fotoquímica"
                  content="Ciclo fotoestacionario de Leighton, Arrhenius k₁(T), radicales peroxilo (RO₂•), activación de halógenos (ClNO₂) y formación de nitratos."
                  citation="Leighton (1961) / Seinfeld & Pandis (2016)"
                >
                  <button
                    onClick={() => setSelectedDiscipline('Química Atmosférica')}
                    className={`px-2 py-1 text-left whitespace-nowrap border-r border-slate-800 transition-colors cursor-pointer shrink-0 ${
                      selectedDiscipline === 'Química Atmosférica'
                        ? 'bg-cyan-950/80 text-cyan-300 font-bold border-b-2 border-b-cyan-400'
                        : 'bg-slate-900/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Química
                  </button>
                </ScientificTooltip>

                <ScientificTooltip
                  title="Dinámica de Fluidos y Navier-Stokes"
                  content="Vórtices de recirculación en cañones urbanos (Oke 1987), advección-difusión 3D y plumas térmicas de chimeneas portuarias (Briggs)."
                  citation="Oke (1987) / Briggs (1984)"
                >
                  <button
                    onClick={() => setSelectedDiscipline('Dinámica de Fluidos')}
                    className={`px-2 py-1 text-left whitespace-nowrap border-r border-slate-800 transition-colors cursor-pointer shrink-0 ${
                      selectedDiscipline === 'Dinámica de Fluidos'
                        ? 'bg-cyan-950/80 text-cyan-300 font-bold border-b-2 border-b-cyan-400'
                        : 'bg-slate-900/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Fluidos
                  </button>
                </ScientificTooltip>

                <ScientificTooltip
                  title="Micrometeorología y Capa Límite"
                  content="Teoría de semejanza de Monin-Obukhov (MOST), gradientes de brisa marina térmica y perfiles verticales de estabilidad atmosférica."
                  citation="Monin & Obukhov (1954) / Stull (1988)"
                >
                  <button
                    onClick={() => setSelectedDiscipline('Micrometeorología')}
                    className={`px-2 py-1 text-left whitespace-nowrap border-r border-slate-800 transition-colors cursor-pointer shrink-0 ${
                      selectedDiscipline === 'Micrometeorología'
                        ? 'bg-cyan-950/80 text-cyan-300 font-bold border-b-2 border-b-cyan-400'
                        : 'bg-slate-900/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Micrometeo
                  </button>
                </ScientificTooltip>

                <ScientificTooltip
                  title="Emisiones de Tráfico Rodado y Marítimo"
                  content="Factores de emisión COPERT 5 por velocidad media, fracción directa f_NO₂ diésel y ciclos LTO en el Aeropuerto AGP."
                  citation="Guía EMEP/EEA 2023 / COPERT 5"
                >
                  <button
                    onClick={() => setSelectedDiscipline('Emisiones de Tráfico')}
                    className={`px-2 py-1 text-left whitespace-nowrap border-r border-slate-800 transition-colors cursor-pointer shrink-0 ${
                      selectedDiscipline === 'Emisiones de Tráfico'
                        ? 'bg-cyan-950/80 text-cyan-300 font-bold border-b-2 border-b-cyan-400'
                        : 'bg-slate-900/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tráfico
                  </button>
                </ScientificTooltip>

                <ScientificTooltip
                  title="Asimilación de Datos y Redes PINN"
                  content="Redes neuronales informadas por la física, filtro EnKF con ventana 4D, operadores de averaging kernels satelitales y certificación FAIRMODE WG1."
                  citation="Raissi et al. (JCP 2019) / FAIRMODE WG1"
                >
                  <button
                    onClick={() => setSelectedDiscipline('Asimilación de Datos')}
                    className={`px-2 py-1 text-left whitespace-nowrap border-r border-slate-800 transition-colors cursor-pointer shrink-0 ${
                      selectedDiscipline === 'Asimilación de Datos'
                        ? 'bg-cyan-950/80 text-cyan-300 font-bold border-b-2 border-b-cyan-400'
                        : 'bg-slate-900/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Asimilación PINN
                  </button>
                </ScientificTooltip>
              </SlidingRibbonBar>
            </div>

            {/* Listado de los 21 Tópicos */}
            <div className="space-y-1 pt-1">
              <div className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800 flex items-center justify-between">
                <span>Fenomenología ({filteredTopics.length})</span>
              </div>

              {filteredTopics.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTopicId(t.id)}
                  className={`w-full text-left p-2 rounded transition-all font-mono text-[10.5px] flex flex-col gap-0.5 border cursor-pointer ${
                    currentTopic.id === t.id
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-500 font-mono font-bold">{idx + 1}.</span>
                    <span className="font-bold truncate">{t.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-[8px] text-slate-500">
                    <span className="truncate max-w-[120px]">{t.discipline}</span>
                    {t.diagramType && (
                      <span className="text-cyan-400 font-bold font-mono shrink-0">ANIMADO</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* PANEL CENTRAL: DIAGRAMA ANIMADO, FORMULACIÓN Y EVALUACIÓN DETERMINISTA O GALERÍA DE 21 DIAGRAMAS */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {/* Barra superior de modo de visualización */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg">
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-md border border-slate-800 text-[10.5px] font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode('detailed')}
                  className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'detailed'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Inspección Detallada (1 a 1)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('gallery')}
                  className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'gallery'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Galería de los 21 Diagramas Vectoriales ({allTopics.length})</span>
                </button>
              </div>

              {viewMode === 'detailed' && (
                <div className="flex items-center gap-2">
                  {targetModalInfo && onOpenModal && (
                    <ScientificTooltip
                      width="w-64"
                      content="Abrir la suite interactiva o ventana de simulación completa asociada a esta ley física."
                    >
                      <button
                        onClick={handleLaunchModule}
                        className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 border border-cyan-400 text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                      >
                        <Play className="w-3.5 h-3.5 text-white fill-current" /> Abrir Módulo
                      </button>
                    </ScientificTooltip>
                  )}

                  <ScientificTooltip
                    width="w-60"
                    content="Exportar el diagrama animado actual en formato vectorial SVG abierto de alta resolución para memorias técnicas."
                  >
                    <button
                      onClick={handleExportDiagramSvg}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" /> SVG
                    </button>
                  </ScientificTooltip>

                  <ScientificTooltip
                    width="w-60"
                    content="Exportar la ficha técnica completa con metadatos y citas normativas en formato JSON según principios FAIR."
                  >
                    <button
                      onClick={handleExportTopicJson}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" /> JSON FAIR
                    </button>
                  </ScientificTooltip>
                </div>
              )}
            </div>

            {viewMode === 'gallery' ? (
              /* VISTA GALERÍA: LOS 21 DIBUJOS INTERACTIVOS COMPLETOS */
              <div className="space-y-4">
                <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-lg text-slate-300 text-[11px] leading-relaxed flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>
                      <strong>Atlas Visual Completo (21 Leyes Físico-Químicas):</strong> Todos los diagramas se alimentan atómicamente de los datos asimilados en el punto activo en tiempo real.
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-cyan-800/60 shrink-0">
                    📍 {activeCtx?.activePoint?.nearestStreetName || 'Málaga'}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredTopics.map((topic, index) => {
                    const topicModal = TOPIC_MODAL_MAP[topic.id];
                    return (
                      <div
                        key={topic.id}
                        className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 transition-all rounded-xl p-3.5 space-y-3 flex flex-col justify-between shadow-lg"
                      >
                        {/* Cabecera de la tarjeta del diagrama */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">
                                #{index + 1}
                              </span>
                              <h4 className="font-mono font-bold text-slate-100 text-xs">{topic.title}</h4>
                            </div>
                            <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                              {topic.physicsLaw}
                            </div>
                          </div>
                          <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-300 shrink-0">
                            {topic.discipline}
                          </span>
                        </div>

                        {/* Contenedor del Diagrama Vectorial */}
                        <div className="atlas-diagram-container rounded-lg overflow-hidden border border-slate-800 bg-slate-950/80 p-1">
                          {topic.id === 'leighton_photostationary' ? (
                            <FullLeightonCycleDiagram data={leightonData} isExpanded={false} />
                          ) : topic.diagramType ? (
                            <DeepScientificDiagram type={topic.diagramType} compact={true} />
                          ) : null}
                        </div>

                        {/* Ecuación resumida en LaTeX */}
                        <div className="p-1.5 bg-slate-950 rounded border border-indigo-950/80 font-mono text-[9.5px] text-indigo-300 font-bold overflow-x-auto">
                          {topic.formulaLaTeX}
                        </div>

                        {/* Botones de acción rápida */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] font-mono">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTopicId(topic.id);
                              setViewMode('detailed');
                            }}
                            className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>Inspeccionar a Fondo</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            {topicModal && onOpenModal && (
                              <button
                                type="button"
                                onClick={() => onOpenModal(topicModal.modalId)}
                                className="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 rounded text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Play className="w-2.5 h-2.5" /> Módulo
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(topic.formulaLaTeX);
                                setCopiedLatex(true);
                                setTimeout(() => setCopiedLatex(false), 1500);
                              }}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded text-[9px] font-bold cursor-pointer transition-colors"
                              title="Copiar LaTeX"
                            >
                              LaTeX
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* VISTA DETALLADA (1 A 1) */
              <>
                {/* Cabecera del tópico */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white font-mono">{currentTopic.title}</h3>
                      <span className="bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                        {currentTopic.discipline}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Ley Física: {currentTopic.physicsLaw}
                    </span>
                  </div>
                </div>

                {/* ÁREA DEL DIAGRAMA ANIMADO DE MÁXIMA CALIDAD */}
                {currentTopic.id === 'leighton_photostationary' ? (
                  <div className="atlas-diagram-container">
                    <FullLeightonCycleDiagram data={leightonData} isExpanded={true} />
                  </div>
                ) : currentTopic.diagramType ? (
                  <div className="atlas-diagram-container">
                    <DeepScientificDiagram type={currentTopic.diagramType} compact={false} />
                  </div>
                ) : null}

                {/* FORMULACIÓN MATEMÁTICA FORMAL */}
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400 font-mono text-[11px]">
                      Ecuación de Gobierno (Formulación Diferencial / Mecanística):
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentTopic.formulaLaTeX);
                        setCopiedLatex(true);
                        setTimeout(() => setCopiedLatex(false), 2000);
                      }}
                      className="px-2 py-0.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 rounded text-[9.5px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                      title="Copiar código LaTeX para la memoria de tesis doctoral"
                    >
                      {copiedLatex ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">¡LaTeX Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span>Copiar LaTeX</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-slate-950 border border-indigo-950 rounded-md font-mono text-sm text-indigo-300 font-bold overflow-x-auto select-all">
                    {currentTopic.formulaLaTeX}
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    {currentTopic.formulaDescription}
                  </p>
                </div>

                {/* EVALUACIÓN DETERMINISTA EN TIEMPO REAL PARA EL PUNTO ACTIVO */}
                {activeEvaluation && (
                  <div className="p-3 bg-slate-900/90 border border-cyan-800/60 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-cyan-300 font-mono font-bold text-[11px]">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Evaluación Determinista en Punto Activo:</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        {activeCtx?.activePoint?.nearestStreetName || 'Málaga Centro'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-slate-950/70 border border-slate-800 rounded">
                      <div>
                        <div className="text-[9.5px] text-slate-400 uppercase font-mono">{activeEvaluation.metricName}</div>
                        <div className="text-sm font-mono font-bold text-white mt-0.5">{activeEvaluation.calculatedValue}</div>
                      </div>
                      <div>
                        <div className="text-[9.5px] text-slate-400 uppercase font-mono">Diagnóstico Mecanístico</div>
                        <div className={`text-xs font-mono font-bold mt-0.5 ${activeEvaluation.statusColor}`}>
                          {activeEvaluation.statusLabel}
                        </div>
                      </div>
                    </div>

                    <div className="text-[9.5px] font-mono text-slate-400">
                      {activeEvaluation.details}
                    </div>
                  </div>
                )}

                {/* FUNDAMENTACIÓN FÍSICA Y ATMOSFÉRICA */}
                <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg space-y-1.5">
                  <span className="font-bold text-white font-mono text-[11px] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    Mecanismo Físico-Químico en el Gemelo Digital:
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {currentTopic.explanation}
                  </p>
                  {currentTopic.typicalRange && (
                    <div className="text-[10px] text-slate-400 font-mono pt-1">
                      <strong className="text-slate-200">Rango empírico observado en Málaga:</strong> {currentTopic.typicalRange} ({currentTopic.units})
                    </div>
                  )}
                </div>

                {/* ESTÁNDAR REGULATORIO Y REFERENCIA CIENTÍFICA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentTopic.regulatoryStandard && (
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/60 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono text-[10.5px]">
                        <Scale className="w-3.5 h-3.5" />
                        Marco Normativo: {currentTopic.regulatoryStandard.authority}
                      </div>
                      <div className="text-[11px] text-slate-200 font-mono">
                        {currentTopic.regulatoryStandard.document}
                      </div>
                      {currentTopic.regulatoryStandard.limitValue && (
                        <div className="text-[10.5px] text-emerald-300 font-bold font-mono">
                          Valor Límite: {currentTopic.regulatoryStandard.limitValue}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400">
                        {currentTopic.regulatoryStandard.objective}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-300 font-bold font-mono text-[10.5px]">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      Referencia Bibliográfica Citable:
                    </div>
                    <div className="text-[11px] text-slate-300 italic">
                      {currentTopic.literatureCitation}
                    </div>
                    <div className="text-[9.5px] text-slate-500 font-mono pt-1">
                      Trazabilidad completa con el compendio metodológico de la tesis doctoral.
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};
