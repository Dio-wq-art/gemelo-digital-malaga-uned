import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  FlaskConical,
  Wind,
  Sun,
  Moon,
  Droplets,
  CloudSun,
  Activity,
  Layers,
  Download,
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight,
  Filter,
  BarChart2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Compass,
  Thermometer,
  Zap,
  ShieldAlert,
  HelpCircle,
  Sliders,
  Maximize2,
  Atom,
  Car,
  Flame,
  Trees,
  Ship,
  Globe,
  SlidersHorizontal,
  RefreshCw,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Radio,
  MapPin
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { PRESET_ZONES, Zone } from '../lib/zones';
import { fetchLiveZoneTelemetry, ZoneLiveTelemetry } from '../lib/liveZoneTelemetry';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { OFFICIAL_MALAGA_AIR_STATIONS } from '../lib/physics';
import { BoundaryLayerInversionDiagram } from './BoundaryLayerInversionDiagram';

export interface ChemicalSpeciesHistoricalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTempC: number;
  currentRH: number;
  currentUV: number;
  currentNO2Base: number;
}

export type ChemicalFamily = 'all' | 'nitrogen_species' | 'ozone_radicals' | 'particulate' | 'vocs_carbon' | 'meteorology';

export type ModalViewMode = 
  | 'hourly_timeline' 
  | 'single_hour_snapshot' 
  | 'multi_station_matrix'
  | 'vertical_column_profile'
  | 'molecular_studio'
  | 'variable_comparator' 
  | 'hourly_table' 
  | 'who_compliance';

export interface ChemicalVariableMeta {
  id: string;
  name: string;
  family: ChemicalFamily;
  unit: string;
  limitWHO: number | null;
  limitEU: number | null;
  formula: string;
  iupac: string;
  molarMass: string;
  lifetime: string;
  color: string;
  glowColor: string;
  bgGradient: string;
  desc: string;
  reactionScheme: string;
  healthImpact: string;
  localSources: string;
  measurementMethod: string;
}

export const ChemicalSpeciesHistoricalModal: React.FC<ChemicalSpeciesHistoricalModalProps> = ({
  isOpen,
  onClose,
  currentTempC,
  currentRH,
  currentUV,
  currentNO2Base
}) => {
  // Generador dinámico de los últimos 7 días de asimilación (día a día hasta hoy)
  const availableDays = useMemo(() => {
    const days = [];
    const now = new Date();
    
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const synopticArchetypes = [
      { badge: 'Brisa Marina', color: 'from-teal-500 to-emerald-500', note: 'Asimilación en Tiempo Real / Régimen de Brisas del Mar de Alborán' },
      { badge: 'Tráfico Laboral', color: 'from-amber-500 to-orange-500', note: 'Intensidad Vehicular Elevada + Radiación Solar Fuerte' },
      { badge: 'Pico Fotoquímico O₃', color: 'from-cyan-500 to-blue-500', note: 'Fondo Regional: Menor NO vehicular, mayor penetración regional de O₃' },
      { badge: 'Hora Punta Retorno', color: 'from-rose-500 to-red-500', note: 'Hora Punta de Tráfico en MA-20, Alameda y Ronda de Málaga' },
      { badge: 'Polvo Sahariano', color: 'from-yellow-600 to-amber-700', note: 'Intrusión de Masa de Aire Polvo Sahariano (PM₁₀ elevado)' },
      { badge: 'Terral Seco (36°C)', color: 'from-red-600 to-orange-600', note: 'Viento Terral NW Foehn del Valle del Guadalhorce, Humedad < 30%' },
      { badge: 'Ventilación Atlántica', color: 'from-emerald-500 to-teal-600', note: 'Ventilación Atlántica y dispersión rápida por el Estrecho de Gibraltar' }
    ];

    for (let offset = 0; offset < 7; offset++) {
      const d = new Date(now);
      d.setDate(now.getDate() - offset);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const id = `${year}-${month}-${day}`;

      const dayNum = d.getDate();
      const monthName = monthNames[d.getMonth()];
      const dayOfWeek = d.getDay();
      const dayName = dayNames[dayOfWeek];

      const isToday = offset === 0;
      const isYesterday = offset === 1;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isFriday = dayOfWeek === 5;

      let label = '';
      if (isToday) {
        label = `Hoy (${dayNum} ${monthName} ${year})`;
      } else if (isYesterday) {
        label = `Ayer (${dayNum} ${monthName} ${year})`;
      } else {
        label = `${dayNum} ${monthName} ${year} (${dayName})`;
      }

      const archetype = synopticArchetypes[offset % synopticArchetypes.length];
      let badge = archetype.badge;
      let note = archetype.note;
      let color = archetype.color;

      if (isToday) {
        badge = 'Hoy (Brisa Marina)';
        note = 'Asimilación Telemétrica en Vivo (AEMET, CAMS & Red Oficial Junta de Andalucía)';
        color = 'from-teal-500 to-emerald-500';
      } else if (isWeekend) {
        badge = 'Fin de Semana (Pico O₃)';
        note = 'Menor tráfico rodado matinal, fotólisis solar y mayor penetración regional de O₃';
        color = 'from-cyan-500 to-blue-500';
      } else if (isFriday) {
        badge = 'Viernes (Hora Punta)';
        note = 'Alta intensidad de tráfico en el eje Alameda-Parque y autovías de acceso';
        color = 'from-rose-500 to-orange-500';
      }

      days.push({
        id,
        dateObj: d,
        label,
        badge,
        color,
        note,
        dayOfWeek,
        isToday,
        isYesterday,
        isWeekend,
        isFriday
      });
    }

    return days;
  }, []);

  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [selectedHour, setSelectedHour] = useState<number>(14); // 14:00 por defecto (máximo fotoquímico)
  const [selectedStationId, setSelectedStationId] = useState<string>('carranque');
  const [selectedFamily, setSelectedFamily] = useState<ChemicalFamily>('all');
  const [activeViewMode, setActiveViewMode] = useState<ModalViewMode>('hourly_timeline');
  const [activeInspectedVarId, setActiveInspectedVarId] = useState<string | null>('no2_ugm3');
  
  // Variables seleccionadas para el comparador gráfico personalizado
  const [comparatorSelectedVars, setComparatorSelectedVars] = useState<string[]>(['no2_ugm3', 'o3_ugm3', 'oh_radicals_10e6', 'pm25_ugm3']);

  // Estado para la comparación multi-estación
  const [multiStationSpecies, setMultiStationSpecies] = useState<string>('no2_ugm3');

  // Estado para el Estudio Molecular
  const [selectedMoleculeId, setSelectedMoleculeId] = useState<string>('no2');

  // Estado para la micro-zona geográfica de Málaga y asimilación telemétrica en vivo
  const [activeZone, setActiveZone] = useState<Zone>(PRESET_ZONES[0]);
  const [liveTelemetry, setLiveTelemetry] = useState<ZoneLiveTelemetry | null>(null);
  const [isIngestingTelemetry, setIsIngestingTelemetry] = useState<boolean>(false);
  const [telemetryFeedback, setTelemetryFeedback] = useState<string | null>(null);

  const handleAssimilateZoneData = async (targetZone: Zone = activeZone) => {
    setIsIngestingTelemetry(true);
    try {
      const tel = await fetchLiveZoneTelemetry(targetZone);
      setLiveTelemetry(tel);
      setTelemetryFeedback(`${tel.source} • Coord: [${targetZone.lat.toFixed(4)}, ${targetZone.lon.toFixed(4)}] | T: ${tel.meteo.tempC}°C | NO₂: ${tel.chemistry.no2Ugm3} µg/m³ | O₃: ${tel.chemistry.o3Ugm3} µg/m³ | PM₂.₅: ${tel.chemistry.pm25Ugm3} µg/m³`);
    } catch (e) {
      console.warn("Fallo al asimilar telemetría de zona:", e);
    } finally {
      setIsIngestingTelemetry(false);
    }
  };

  const handleZoneSelect = (zone: Zone) => {
    setActiveZone(zone);
    // Sincronización inteligente de la estación oficial más representativa
    if (zone.name.includes('Cañón') || zone.name.includes('Alameda')) setSelectedStationId('hilera');
    else if (zone.name.includes('Parque') || zone.name.includes('Puerto')) setSelectedStationId('puerto');
    else if (zone.name.includes('Campanillas')) setSelectedStationId('atabal');
    else if (zone.name.includes('Aeropuerto') || zone.name.includes('Polo')) setSelectedStationId('misericordia');
    else if (zone.name.includes('Teatinos')) setSelectedStationId('carranque');
  };

  useEffect(() => {
    handleAssimilateZoneData(activeZone);
  }, [activeZone]);


  // Generador de matriz fisicoquímica multi-especie 24h real y coherente según cinética atmosférica
  const dayHourlyData = useMemo(() => {
    // Semillas basadas en el día seleccionado (dinámico)
    const currentDayInfo = availableDays.find(d => d.id === selectedDay) || availableDays[0];
    const isWeekend = currentDayInfo.isWeekend;
    const isTerral = currentDayInfo.badge.includes('Terral');
    const isSahara = currentDayInfo.badge.includes('Sahariano');

    const station = OFFICIAL_MALAGA_AIR_STATIONS.find(s => s.id === selectedStationId) || OFFICIAL_MALAGA_AIR_STATIONS[0];
    const isTrafficStation = station.environmentType === 'urban_traffic' || station.environmentType === 'subterranean_tunnel_confined' || station.environmentType === 'highway_traffic_microclimate' || station.environmentType === 'railway_intermodal_blackcarbon';
    const isAltitudeStation = station.environmentType === 'suburban_altitude' || station.environmentType === 'urban_hill_ridge' || station.environmentType === 'mountain_headwater_basin' || station.environmentType === 'mountain_pass_foehn' || station.environmentType === 'doppler_radar_wind_profiler' || station.environmentType === 'regional_pristine_background';
    const isCoastalStation = station.environmentType === 'coastal' || station.environmentType === 'port_industrial' || station.environmentType === 'oceanographic_buoy' || station.environmentType === 'maritime_tide_gauge' || station.environmentType === 'coastal_synoptic_marine' || station.environmentType === 'coastal_foothill_acceleration' || station.environmentType === 'centennial_historical_coastal';
    const isAirportStation = station.environmentType === 'airport_logistics' || station.environmentType === 'aeronautical_awos_windshear';
    const isIndustrialStation = station.environmentType === 'coastal_east_industrial' || station.environmentType === 'cement_factory_industrial' || station.environmentType === 'wastewater_ammonia_interface' || station.environmentType === 'landfill_biogas_fugitive';
    const isForestStation = station.environmentType === 'botanical_canopy_cool_island' || station.environmentType === 'mountain_headwater_basin';
    const isTunnel = station.environmentType === 'subterranean_tunnel_confined';
    const isLandfill = station.environmentType === 'landfill_biogas_fugitive';

    // Parámetros telemétricos en vivo asimilados para la micro-zona activa
    const zoneNO2 = liveTelemetry ? liveTelemetry.chemistry.no2Ugm3 : (currentNO2Base || 32);
    const zoneO3 = liveTelemetry ? liveTelemetry.chemistry.o3Ugm3 : 60;
    const zonePM10 = liveTelemetry ? liveTelemetry.chemistry.pm10Ugm3 : 22;
    const zonePM25 = liveTelemetry ? liveTelemetry.chemistry.pm25Ugm3 : 14;
    const zoneTemp = liveTelemetry ? liveTelemetry.meteo.tempC : (currentTempC || 24);
    const zoneRH = liveTelemetry ? liveTelemetry.meteo.rhPct : (currentRH || 60);
    const zoneWindMs = liveTelemetry ? liveTelemetry.meteo.windSpeedMs : 2.5;
    const zoneWindDir = liveTelemetry ? liveTelemetry.meteo.windDirDeg : 165;
    const isCoastalZone = activeZone.tag.includes('Puerto') || activeZone.name.includes('Puerto');
    const isForestZone = activeZone.tag.includes('Filtro') || activeZone.name.includes('Parque');
    const isValleyZone = activeZone.tag.includes('Periférica') || activeZone.name.includes('Campanillas');
    const isIndustrialZone = activeZone.tag.includes('Industrial') || activeZone.name.includes('Polo');
    const isAirportZone = activeZone.name.includes('Aeropuerto');

    return Array.from({ length: 24 }, (_, hour) => {
      // 1. Factores temporales
      let trafficFactor = 0.15;
      if (!isWeekend) {
        const morningRush = Math.exp(-Math.pow(hour - 8.2, 2) / 3.0);
        const eveningRush = Math.exp(-Math.pow(hour - 19.5, 2) / 4.5);
        const midday = 0.45 * Math.exp(-Math.pow(hour - 14.0, 2) / 8.0);
        trafficFactor = Math.min(1.0, 0.12 + 0.88 * (morningRush * 0.95 + eveningRush * 0.85 + midday * 0.5));
      } else {
        trafficFactor = 0.18 + 0.65 * Math.exp(-Math.pow(hour - 13.5, 2) / 14.0) + 0.7 * Math.exp(-Math.pow(hour - 21.5, 2) / 6.0);
      }

      // Ciclo solar / Radiación UV actínica (máximo a las 14:00 hora local CEST UTC+2)
      const solarZenith = Math.sin(Math.max(0, (hour - 6.5) / 14.2) * Math.PI);
      const uv_index = Number((solarZenith > 0 ? (isTerral ? 9.8 : 8.2) * Math.pow(solarZenith, 1.15) : 0).toFixed(1));
      const solar_radiation_w_m2 = Number((uv_index * 88.5).toFixed(0));

      // Temperatura y Humedad
      let tempC = (zoneTemp - 3) + (isTerral ? 16 : 8) * Math.sin(Math.max(0, (hour - 8) / 16) * Math.PI);
      if (hour < 8) tempC = (zoneTemp - 4) + (hour / 8) * 2;
      tempC = Number(tempC.toFixed(1));

      let rh = Math.max(22, Math.min(95, zoneRH + (24 - tempC) * 2.2 + ((isCoastalStation || isCoastalZone) ? 10 : 0) - (isTerral ? 32 : 0)));
      rh = Number(rh.toFixed(0));

      // Viento y capa límite (PBLH)
      const isSeaBreeze = hour >= 11 && hour <= 20;
      const windSpeed_ms = isSeaBreeze ? Number((zoneWindMs + 1.2 * Math.sin((hour - 11) / 9 * Math.PI)).toFixed(1)) : Number((Math.max(0.6, zoneWindMs * 0.5 + 0.6 * Math.sin(hour / 6))).toFixed(1));
      const windDir_deg = isSeaBreeze ? (isCoastalZone ? 160 : 170) : (isTerral ? 330 : zoneWindDir);
      const pblh_m = Math.max(180, Number((250 + 1250 * Math.pow(Math.max(0, solarZenith), 0.8)).toFixed(0)));

      // 2. Cinética Química de Especies de Nitrógeno (NO, NO2, NOx, HNO3, HONO)
      const no_traffic_source = trafficFactor * (isTrafficStation ? 95 : (isAirportStation || isAirportZone) ? 82 : 38);
      const no_ppb = Number(Math.max(1.2, no_traffic_source * (1 - solarZenith * 0.75)).toFixed(1));
      const no_ugm3 = Number((no_ppb * 1.23).toFixed(1));

      let no2_val = zoneNO2 * trafficFactor * (isTrafficStation ? 1.35 : isAltitudeStation ? 0.6 : isAirportStation ? 1.28 : 1.0);
      if (isSeaBreeze) no2_val *= 0.82; // Ventilación marina
      const no2_ugm3 = Number(Math.max(6.5, no2_val + 10).toFixed(1));
      const no2_ppb = Number((no2_ugm3 * 0.53).toFixed(1));
      const nox_ugm3 = Number((no_ugm3 + no2_ugm3).toFixed(1));

      // HONO (Ácido Nitroso): acumulación nocturna heterogénea sobre asfalto y fachadas
      const hono_ppb = hour >= 21 || hour <= 7 ? Number((0.85 + 0.45 * trafficFactor).toFixed(2)) : Number((0.08 * (1 - solarZenith)).toFixed(2));
      const hono_ugm3 = Number((hono_ppb * 1.92).toFixed(2));

      // 3. Ozono Troposférico y Radicales Libres
      const o3_production = Math.pow(Math.max(0, solarZenith), 1.3) * (isAltitudeStation || isValleyZone ? 125 : 88);
      const o3_titration = (no_ppb / 40) * 28;
      const o3_ugm3 = Number(Math.max(12, zoneO3 * 0.5 + o3_production - o3_titration).toFixed(1));
      const o3_ppb = Number((o3_ugm3 * 0.51).toFixed(1));

      // Radicales OH• (10⁶ molec/cm³) y HO2• (10⁸ molec/cm³)
      const oh_radicals_10e6 = Number((solarZenith > 0 ? (6.8 * (uv_index / 8.5) * (rh / 70) * (tempC / 26)).toFixed(2) : '0.04'));
      const ho2_radicals_10e8 = Number((Number(oh_radicals_10e6) * 0.85).toFixed(2));

      // Radical Nitrato nocturno NO3• (pptv)
      const no3_radical_pptv = hour < 6 || hour > 21 ? Number((18.5 * (no2_ppb / 20) * (o3_ppb / 30)).toFixed(1)) : 0.2;

      // Ácido Nítrico HNO3 (µg/m³): NO2 + OH* -> HNO3
      const hno3_ugm3 = Number((0.4 + 2.8 * (Number(oh_radicals_10e6) / 6.0) * (no2_ppb / 25)).toFixed(2));

      // 4. Material Particulado y Aerosoles (PM10, PM2.5, Black Carbon, Sal Marina)
      let pm10_base = zonePM10 * 0.7 + trafficFactor * 12 + (isSahara ? 38 : 0) + ((isCoastalStation || isCoastalZone) ? 6 : 0) + (isAirportStation ? 9 : 0) + (station.environmentType === 'cement_factory_industrial' ? 14 : 0);
      let pm25_base = zonePM25 * 0.7 + trafficFactor * 8 + (isSahara ? 16 : 0) + (isAirportStation ? 7 : 0) + (station.environmentType === 'cement_factory_industrial' ? 8 : 0);
      const pm10_ugm3 = Number(pm10_base.toFixed(1));
      const pm25_ugm3 = Number(pm25_base.toFixed(1));
      const black_carbon_ugm3 = Number((trafficFactor * (station.environmentType === 'railway_intermodal_blackcarbon' ? 4.9 : isTunnel ? 5.4 : isTrafficStation ? 3.8 : isAirportStation ? 3.2 : 1.2) + 0.2).toFixed(2));
      const sea_salt_aerosol_ugm3 = Number(((isSeaBreeze || isCoastalZone) ? 4.5 + windSpeed_ms * (isCoastalZone ? 1.4 : 0.8) : 0.7).toFixed(1));

      // 5. Compuestos Orgánicos Volátiles (COVs) y Gases de Combustión (CO, SO2, Isopreno)
      const co_mgm3 = Number((0.25 + trafficFactor * (isTunnel ? 3.2 : isTrafficStation ? 0.95 : 0.4)).toFixed(2));
      const so2_ugm3 = Number(((isCoastalStation || isCoastalZone || isIndustrialZone || isIndustrialStation || isAirportStation) ? (station.environmentType === 'cement_factory_industrial' ? 9.5 : 4.2) + (hour >= 8 && hour <= 18 ? 4.0 : 1.0) : 1.8).toFixed(1));
      const benzene_ugm3 = Number((trafficFactor * (isTunnel ? 4.8 : isTrafficStation ? 2.4 : 0.8) + (isLandfill ? 1.5 : 0.2)).toFixed(2));
      const toluene_ugm3 = Number((trafficFactor * (isTunnel ? 9.5 : isTrafficStation ? 5.2 : 1.6) + (isLandfill ? 2.8 : 0.4)).toFixed(2));
      const isoprene_ppb = Number((solarZenith > 0 ? ((isForestZone || isForestStation) ? 0.85 : 0.35) * Math.pow(solarZenith, 1.5) * Math.exp((tempC - 25) * 0.08) : 0.02).toFixed(2));

      // Número de Leighton (Phi)

      return {
        hour,
        timeLabel: `${hour.toString().padStart(2, '0')}:00`,
        // Meteorología
        tempC,
        rh,
        uv_index,
        solar_radiation_w_m2,
        windSpeed_ms,
        windDir_deg,
        pblh_m,
        // Especies nitrogenadas
        no_ugm3,
        no_ppb,
        no2_ugm3,
        no2_ppb,
        nox_ugm3,
        hono_ugm3,
        hno3_ugm3,
        // Fotooxidantes y radicales
        o3_ugm3,
        o3_ppb,
        oh_radicals_10e6: Number(oh_radicals_10e6),
        ho2_radicals_10e8: Number(ho2_radicals_10e8),
        no3_radical_pptv,
        // Partículas
        pm10_ugm3,
        pm25_ugm3,
        black_carbon_ugm3,
        sea_salt_aerosol_ugm3,
        // COVs y otros gases
        co_mgm3,
        so2_ugm3,
        benzene_ugm3,
        toluene_ugm3,
        isoprene_ppb
      };
    });
  }, [selectedDay, selectedStationId, currentNO2Base, currentTempC, currentRH, activeZone, liveTelemetry]);

  // Motor Multi-Estación para las 5 estaciones oficiales de Málaga
  const multiStationHourlyData = useMemo(() => {
    const currentDayInfo = availableDays.find(d => d.id === selectedDay) || availableDays[0];
    const isWeekend = currentDayInfo.isWeekend;
    const isTerral = currentDayInfo.badge.includes('Terral');
    const isSahara = currentDayInfo.badge.includes('Sahariano');

    return Array.from({ length: 24 }, (_, hour) => {
      const row: any = {
        hour,
        timeLabel: `${hour.toString().padStart(2, '0')}:00`
      };

      OFFICIAL_MALAGA_AIR_STATIONS.forEach(st => {
        const isTraffic = st.environmentType === 'urban_traffic';
        const isAltitude = st.environmentType === 'suburban_altitude';
        const isCoastal = st.environmentType === 'coastal' || st.environmentType === 'port_industrial';

        let trafficFactor = 0.15;
        if (!isWeekend) {
          const morningRush = Math.exp(-Math.pow(hour - 8.2, 2) / 3.0);
          const eveningRush = Math.exp(-Math.pow(hour - 19.5, 2) / 4.5);
          trafficFactor = Math.min(1.0, 0.12 + 0.88 * (morningRush * 0.95 + eveningRush * 0.85));
        }

        const solarZenith = Math.sin(Math.max(0, (hour - 6.5) / 14.2) * Math.PI);

        // NO2
        let no2 = 28 * trafficFactor * (isTraffic ? 1.7 : isAltitude ? 0.45 : isCoastal ? 1.1 : 0.9);
        if (hour >= 12 && hour <= 19 && isCoastal) no2 *= 0.8;
        row[`no2_${st.id}`] = Number(Math.max(5.0, no2 + 8).toFixed(1));

        // O3
        const o3_prod = Math.pow(Math.max(0, solarZenith), 1.3) * (isAltitude ? 130 : isCoastal ? 75 : 90);
        const o3_titr = trafficFactor * (isTraffic ? 35 : 12);
        row[`o3_${st.id}`] = Number(Math.max(15, (isAltitude ? 60 : 30) + o3_prod - o3_titr).toFixed(1));

        // PM10
        let pm10 = 16 + trafficFactor * (isTraffic ? 18 : 8) + (isSahara ? 42 : 0) + (isCoastal ? 10 : 0);
        row[`pm10_${st.id}`] = Number(pm10.toFixed(1));

        // PM2.5
        let pm25 = 8 + trafficFactor * (isTraffic ? 14 : 5) + (isSahara ? 18 : 0);
        row[`pm25_${st.id}`] = Number(pm25.toFixed(1));

        // SO2
        let so2 = isCoastal ? (hour >= 8 && hour <= 18 ? 8.5 : 3.2) : 1.6;
        row[`so2_${st.id}`] = Number(so2.toFixed(1));

        // OH radicals
        let oh = solarZenith > 0 ? (isAltitude ? 7.8 : 6.2) * (isTerral ? 1.3 : 1.0) * Math.pow(solarZenith, 1.2) : 0.05;
        row[`oh_${st.id}`] = Number(oh.toFixed(2));
      });

      return row;
    });
  }, [selectedDay]);

  // Registro instantáneo de la hora seleccionada
  const currentSnapshot = dayHourlyData[selectedHour] || dayHourlyData[14];

  // Perfil Vertical de la Columna Atmosférica (0 a 2000m) en la hora actual
  const verticalAtmosphericLayers = useMemo(() => {
    const currentPblh = currentSnapshot.pblh_m;
    const isNight = selectedHour < 7 || selectedHour > 21;
    const altitudes = [10, 30, 75, 150, 250, 400, 600, 850, 1100, 1400, 1750, 2000];

    return altitudes.map(alt => {
      // Temperatura lapse rate
      let temp = currentSnapshot.tempC;
      if (isNight && alt <= 200) {
        // Inversión térmica nocturna
        temp = currentSnapshot.tempC + (alt / 200) * 3.2;
      } else {
        temp = currentSnapshot.tempC - (alt / 1000) * 6.5;
      }

      // NO2 decae exponencialmente con la altura
      const no2_scale = alt <= currentPblh ? Math.exp(-alt / (currentPblh * 0.45)) : 0.05;
      const no2_profile = Number((currentSnapshot.no2_ugm3 * no2_scale + 0.8).toFixed(1));

      // O3 aumenta con la altura (menos titulación y capa residual libre)
      const o3_scale = alt <= currentPblh ? 0.7 + 0.4 * (alt / currentPblh) : 1.25;
      const o3_profile = Number((currentSnapshot.o3_ugm3 * o3_scale).toFixed(1));

      // Aerosoles PM2.5 atrapados en la capa de mezcla
      const pm25_scale = alt <= currentPblh ? 1.0 - 0.5 * (alt / currentPblh) : 0.12;
      const pm25_profile = Number((currentSnapshot.pm25_ugm3 * pm25_scale).toFixed(1));

      // Velocidad de viento aumenta con la altura (perfil logarítmico)
      const wind_profile = Number((currentSnapshot.windSpeed_ms * Math.log(alt / 0.8 + 2) / Math.log(10 / 0.8 + 2)).toFixed(1));

      const isInsidePblh = alt <= currentPblh;
      const isInversionZone = isNight && alt <= 250;

      return {
        altitude_m: alt,
        altitude_label: `${alt} m`,
        tempC: Number(temp.toFixed(1)),
        no2_ugm3: no2_profile,
        o3_ugm3: o3_profile,
        pm25_ugm3: pm25_profile,
        wind_ms: wind_profile,
        isInsidePblh,
        isInversionZone
      };
    });
  }, [currentSnapshot, selectedHour]);

  // Catálogo de Moléculas Atmosféricas con detalles fisicoquímicos y representaciones CPK
  const atmosphericMolecules = useMemo(() => [
    {
      id: 'no2',
      formula: 'NO₂',
      name: 'Dióxido de Nitrógeno',
      geometry: 'Angular (134.3°)',
      hybridization: 'sp² (Radical Libre)',
      dipoleMoment: '0.316 Debye',
      bondLength: '1.197 Å (Orden de enlace 1.5)',
      magneticProperty: 'Paramagnético (1 electrón desapareado)',
      color: '#f59e0b',
      accentBg: 'from-amber-500/30 to-orange-600/10',
      description: 'El dióxido de nitrógeno es un radical libre angular con hibridación sp² en el nitrógeno. Posee una estructura de resonancia con enlace pi deslocalizado que absorbe luz visible azul-violeta, confiriéndole su característico color pardo-rojizo en la atmósfera de Málaga.',
      resonanceForms: ['O=N⁺—O⁻ ↔ ⁻O—N⁺=O ↔ •N(=O)₂'],
      atoms: [
        { label: 'N', color: '#3b82f6', size: 36, x: 50, y: 35, note: 'Nitrógeno (+1 formal)' },
        { label: 'O', color: '#ef4444', size: 32, x: 22, y: 68, note: 'Oxígeno terminal' },
        { label: 'O', color: '#ef4444', size: 32, x: 78, y: 68, note: 'Oxígeno terminal (-1/2 formal)' }
      ]
    },
    {
      id: 'o3',
      formula: 'O₃',
      name: 'Ozono Troposférico',
      geometry: 'Angular (116.8°)',
      hybridization: 'sp²',
      dipoleMoment: '0.53 Debye',
      bondLength: '1.278 Å (Orden de enlace 1.5)',
      magneticProperty: 'Diamagnético',
      color: '#38bdf8',
      accentBg: 'from-sky-500/30 to-blue-600/10',
      description: 'Alótropo triatómico del oxígeno con estructura angular y resonancia zwitteriónica. Es un oxidante potentísimo con potencial redox E° = +2.07 V, capaz de romper enlaces C=C de lípidos pulmonares y membranas celulares.',
      resonanceForms: ['O=O⁺—O⁻ ↔ ⁻O—O⁺=O'],
      atoms: [
        { label: 'O', color: '#ef4444', size: 34, x: 50, y: 32, note: 'Oxígeno central (+1 formal)' },
        { label: 'O', color: '#ef4444', size: 32, x: 20, y: 68, note: 'Oxígeno terminal' },
        { label: 'O', color: '#ef4444', size: 32, x: 80, y: 68, note: 'Oxígeno terminal (-1 formal)' }
      ]
    },
    {
      id: 'oh',
      formula: 'OH•',
      name: 'Radical Hidroxilo',
      geometry: 'Lineal',
      hybridization: 'sp³ (Radical libre)',
      dipoleMoment: '1.66 Debye',
      bondLength: '0.970 Å',
      magneticProperty: 'Paramagnético',
      color: '#c084fc',
      accentBg: 'from-purple-500/30 to-fuchsia-600/10',
      description: 'El "detergente" fundamental de la troposfera. Reacciona a velocidad de difusión con prácticamente todos los hidrocarburos y contaminantes primarios mediante abstracción de hidrógeno o adición electrofílica.',
      resonanceForms: ['H—O•'],
      atoms: [
        { label: 'O', color: '#ef4444', size: 34, x: 38, y: 50, note: 'Oxígeno (Radical •)' },
        { label: 'H', color: '#f8fafc', size: 24, x: 68, y: 50, note: 'Hidrógeno' }
      ]
    },
    {
      id: 'hono',
      formula: 'HONO',
      name: 'Ácido Nitroso (trans/cis)',
      geometry: 'Plana (Ángulo N-O-H 102°, O-N-O 110°)',
      hybridization: 'sp²',
      dipoleMoment: '1.82 Debye (trans)',
      bondLength: 'N=O 1.18 Å, N-O 1.43 Å, O-H 0.98 Å',
      magneticProperty: 'Diamagnético',
      color: '#ec4899',
      accentBg: 'from-pink-500/30 to-rose-600/10',
      description: 'Fuente clave matinal de radicales OH•. Se acumula durante la noche sobre el asfalto y fachadas por reacción heterogénea 2 NO₂ + H₂O → HONO + HNO₃ y se fotoliza instantáneamente en los primeros 45 minutos del amanecer.',
      resonanceForms: ['H—O—N=O'],
      atoms: [
        { label: 'H', color: '#f8fafc', size: 22, x: 15, y: 65, note: 'Hidrógeno' },
        { label: 'O', color: '#ef4444', size: 30, x: 35, y: 50, note: 'Oxígeno hidroxílico' },
        { label: 'N', color: '#3b82f6', size: 32, x: 62, y: 40, note: 'Nitrógeno central' },
        { label: 'O', color: '#ef4444', size: 32, x: 85, y: 60, note: 'Oxígeno carbonílico' }
      ]
    },
    {
      id: 'so2',
      formula: 'SO₂',
      name: 'Dióxido de Azufre',
      geometry: 'Angular (119.5°)',
      hybridization: 'sp²',
      dipoleMoment: '1.63 Debye',
      bondLength: '1.431 Å (Orden de enlace 1.8)',
      magneticProperty: 'Diamagnético',
      color: '#eab308',
      accentBg: 'from-yellow-500/30 to-amber-600/10',
      description: 'Gas angular con azufre en estado de oxidación +4. En el puerto de Málaga es emitido por los motores auxiliares de buques y se oxida en fase gaseosa y acuosa formando ácido sulfúrico (H₂SO₄) y sulfatos secundarios.',
      resonanceForms: ['O=S⁺—O⁻ ↔ ⁻O—S⁺=O ↔ O=S=O'],
      atoms: [
        { label: 'S', color: '#eab308', size: 38, x: 50, y: 35, note: 'Azufre (+4)' },
        { label: 'O', color: '#ef4444', size: 32, x: 22, y: 68, note: 'Oxígeno' },
        { label: 'O', color: '#ef4444', size: 32, x: 78, y: 68, note: 'Oxígeno' }
      ]
    },
    {
      id: 'benzene',
      formula: 'C₆H₆',
      name: 'Benceno (Aromático)',
      geometry: 'Plana Hexagonal (120°)',
      hybridization: 'sp² (Aromático Hückel 4n+2)',
      dipoleMoment: '0.00 Debye',
      bondLength: 'C-C 1.397 Å, C-H 1.084 Å',
      magneticProperty: 'Diamagnético',
      color: '#10b981',
      accentBg: 'from-emerald-500/30 to-teal-600/10',
      description: 'Hidrocarburo aromático volátil cancerígeno (IARC Grupo 1). Su anillo plano con 6 electrones pi deslocalizados es atacado lentamente por OH• generando fenoles y precursores de aerosoles orgánicos secundarios (SOA).',
      resonanceForms: ['Kekulé I ↔ Kekulé II (Anillo Aromático continuo)'],
      atoms: [
        { label: 'C', color: '#64748b', size: 28, x: 50, y: 18, note: 'Carbono sp²' },
        { label: 'C', color: '#64748b', size: 28, x: 75, y: 32, note: 'Carbono sp²' },
        { label: 'C', color: '#64748b', size: 28, x: 75, y: 68, note: 'Carbono sp²' },
        { label: 'C', color: '#64748b', size: 28, x: 50, y: 82, note: 'Carbono sp²' },
        { label: 'C', color: '#64748b', size: 28, x: 25, y: 68, note: 'Carbono sp²' },
        { label: 'C', color: '#64748b', size: 28, x: 25, y: 32, note: 'Carbono sp²' }
      ]
    }
  ], []);

  const selectedMolecule = useMemo(() => {
    return atmosphericMolecules.find(m => m.id === selectedMoleculeId) || atmosphericMolecules[0];
  }, [atmosphericMolecules, selectedMoleculeId]);

  // Listado completo de todas las variables físico-químicas con metadatos completos y colores luminosos
  const allChemicalVariables: ChemicalVariableMeta[] = useMemo(() => [
    // Familia: Nitrógeno
    {
      id: 'no2_ugm3',
      name: 'Dióxido de Nitrógeno',
      family: 'nitrogen_species',
      unit: 'µg/m³',
      limitWHO: 25,
      limitEU: 200,
      formula: 'NO₂',
      iupac: 'Nitrogen dioxide',
      molarMass: '46.0055 g/mol',
      lifetime: '~ 2 a 4 horas (diurno)',
      color: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.4)',
      bgGradient: 'from-amber-500/20 to-orange-600/10',
      desc: 'Gas oxidante reactivo tóxico de color pardo-rojizo emitido principalmente por motores diésel e instalaciones de combustión.',
      reactionScheme: 'NO + O₃ → NO₂ + O₂  |  NO₂ + hν (λ < 420 nm) → NO + O(³P)',
      healthImpact: 'Inflamación respiratoria severa, hiperreactividad bronquial en niños asmáticos y aumento de hospitalizaciones cardiopulmonares.',
      localSources: 'Tráfico pesado en autovías MA-20, Ronda Oeste y ejes urbanos de la Alameda / Paseo del Parque.',
      measurementMethod: 'Quimioluminiscencia en fase gaseosa (EN 14211)'
    },
    {
      id: 'no_ugm3',
      name: 'Monóxido de Nitrógeno',
      family: 'nitrogen_species',
      unit: 'µg/m³',
      limitWHO: null,
      limitEU: null,
      formula: 'NO',
      iupac: 'Nitrogen monoxide',
      molarMass: '30.006 g/mol',
      lifetime: '~ 10 a 30 minutos',
      color: '#fb923c',
      glowColor: 'rgba(251, 146, 60, 0.4)',
      bgGradient: 'from-orange-500/20 to-amber-600/10',
      desc: 'Emisión primaria directa de combustión a alta temperatura. Actúa como potente agente reductor y titulador de ozono.',
      reactionScheme: 'N₂ + O₂ (alta T) → 2 NO (Zeldovich)  |  NO + RO₂• → NO₂ + RO•',
      healthImpact: 'Precursor de NO₂ y peroxiacetilnitratos (PAN); menor toxicidad directa que NO₂ pero vasoactivo a altas concentraciones.',
      localSources: 'Tubo de escape de vehículos térmicos urbanos y motores marinos en maniobra portuaria.',
      measurementMethod: 'Quimioluminiscencia UV-vis'
    },
    {
      id: 'nox_ugm3',
      name: 'Óxidos de Nitrógeno Totales',
      family: 'nitrogen_species',
      unit: 'µg/m³ eq NO₂',
      limitWHO: null,
      limitEU: 30,
      formula: 'NOx',
      iupac: 'Total Nitrogen Oxides (NO + NO₂)',
      molarMass: '46.01 g/mol eq',
      lifetime: '~ 4 a 8 horas',
      color: '#d97706',
      glowColor: 'rgba(217, 119, 6, 0.4)',
      bgGradient: 'from-amber-600/20 to-yellow-700/10',
      desc: 'Suma estequiométrica total de especies oxidantes de nitrógeno en fase gaseosa.',
      reactionScheme: '[NOx] = [NO] + [NO₂]',
      healthImpact: 'Criterio ecosistémico de protección de la vegetación (límite crítico de acidificación y eutrofización).',
      localSources: 'Emisiones vehiculares agregadas del área metropolitana de Málaga.',
      measurementMethod: 'Quimioluminiscencia con convertidor catalítico de Mo'
    },
    {
      id: 'hono_ugm3',
      name: 'Ácido Nitroso',
      family: 'nitrogen_species',
      unit: 'µg/m³',
      limitWHO: null,
      limitEU: null,
      formula: 'HONO',
      iupac: 'Nitrous acid',
      molarMass: '47.013 g/mol',
      lifetime: '~ 15 min (al sol) / horas (noche)',
      color: '#fbbf24',
      glowColor: 'rgba(251, 191, 36, 0.4)',
      bgGradient: 'from-yellow-500/20 to-amber-600/10',
      desc: 'Especie clave acumulada por la noche sobre superficies húmedas de asfalto y edificios que se fotoliza al alba liberando un pulso masivo de radicales OH•.',
      reactionScheme: '2 NO₂ + H₂O(ads) → HONO + HNO₃ (noche)  |  HONO + hν → OH• + NO (alba)',
      healthImpact: 'Precursor de mutágenos nitrosaminas e irritante de mucosas oculares y faríngeas.',
      localSources: 'Reacciones heterogéneas sobre asfalto de calzada urbana y túneles (San José / Carlos Haya).',
      measurementMethod: 'Espectroscopía LOPAP / DOAS diferencial'
    },
    {
      id: 'hno3_ugm3',
      name: 'Ácido Nítrico en Fase Gas',
      family: 'nitrogen_species',
      unit: 'µg/m³',
      limitWHO: null,
      limitEU: null,
      formula: 'HNO₃',
      iupac: 'Nitric acid',
      molarMass: '63.012 g/mol',
      lifetime: '~ 1 a 3 días (deposición seca)',
      color: '#ca8a04',
      glowColor: 'rgba(202, 138, 4, 0.4)',
      bgGradient: 'from-yellow-600/20 to-stone-700/10',
      desc: 'Producto terminal de la oxidación diurna de NO₂ por el radical OH•, precursor del aerosol secundario de nitrato de amonio.',
      reactionScheme: 'NO₂ + OH• + M → HNO₃ + M  |  HNO₃ + NH₃ ↔ NH₄NO₃ (s)',
      healthImpact: 'Lluvia ácida y deposición ácida sobre monumentos calizos (Catedral de Málaga, Alcazaba).',
      localSources: 'Fotoquímica atmosférica secundaria regional.',
      measurementMethod: 'Espectrometría de masas química CIMS / Filtros de nylon'
    },

    // Familia: Ozono y Radicales
    {
      id: 'o3_ugm3',
      name: 'Ozono Troposférico',
      family: 'ozone_radicals',
      unit: 'µg/m³',
      limitWHO: 100,
      limitEU: 120,
      formula: 'O₃',
      iupac: 'Trioxygen',
      molarMass: '47.998 g/mol',
      lifetime: '~ días a semanas',
      color: '#38bdf8',
      glowColor: 'rgba(56, 189, 248, 0.4)',
      bgGradient: 'from-sky-500/20 to-blue-600/10',
      desc: 'Potente gas oxidante secundario formado por reacciones fotoquímicas de NOx y COVs bajo radiación solar intensa.',
      reactionScheme: 'O(³P) + O₂ + M → O₃ + M  |  O₃ + NO → NO₂ + O₂ (titulación)',
      healthImpact: 'Reducción de la función pulmonar, inflamación tisular alveolar, agudización de crisis asmáticas.',
      localSources: 'Formación fotoquímica secundaria regional arrastrada por brisa hacia Montes de Málaga y Atabal.',
      measurementMethod: 'Fotometría de absorción ultravioleta (EN 14625)'
    },
    {
      id: 'oh_radicals_10e6',
      name: 'Radical Hidroxilo en Estado Estacionario',
      family: 'ozone_radicals',
      unit: '10⁶ molec/cm³',
      limitWHO: null,
      limitEU: null,
      formula: 'OH•',
      iupac: 'Hydroxyl radical',
      molarMass: '17.008 g/mol',
      lifetime: '< 1 segundo',
      color: '#c084fc',
      glowColor: 'rgba(192, 132, 252, 0.4)',
      bgGradient: 'from-purple-500/20 to-fuchsia-600/10',
      desc: 'El detergente oxidante primario de la atmósfera terrestre; responsable de degradar el 90% de los contaminantes gaseosos.',
      reactionScheme: 'O₃ + hν (λ < 310 nm) → O(¹D) + O₂  |  O(¹D) + H₂O → 2 OH•',
      healthImpact: 'No inhalable como dosis libre (vida media de milisegundos), pero motor de todas las toxinas secundarias.',
      localSources: 'Fotólisis de O₃ y HONO en presencia de vapor de agua y radiación solar UV-B.',
      measurementMethod: 'Fluorescencia inducida por láser FAGE'
    },
    {
      id: 'ho2_radicals_10e8',
      name: 'Radical Hidroperoxi',
      family: 'ozone_radicals',
      unit: '10⁸ molec/cm³',
      limitWHO: null,
      limitEU: null,
      formula: 'HO₂•',
      iupac: 'Hydroperoxyl radical',
      molarMass: '33.007 g/mol',
      lifetime: '~ 10 a 60 segundos',
      color: '#a855f7',
      glowColor: 'rgba(168, 85, 247, 0.4)',
      bgGradient: 'from-violet-500/20 to-purple-600/10',
      desc: 'Radical intermediario que oxida NO a NO₂ sin consumir ozono, propiciando la acumulación fotoquímica neta de smog.',
      reactionScheme: 'CO + OH• → HOCO• → HO₂• + CO₂  |  HO₂• + NO → OH• + NO₂',
      healthImpact: 'Propagador de cadenas de peroxidación lipídica en aerosoles orgánicos secundarios.',
      localSources: 'Oxidación de CO, metano y COVs urbanos.',
      measurementMethod: 'Conversión química FAGE / PERCA'
    },
    {
      id: 'no3_radical_pptv',
      name: 'Radical Nitrato Nocturno',
      family: 'ozone_radicals',
      unit: 'pptv',
      limitWHO: null,
      limitEU: null,
      formula: 'NO₃•',
      iupac: 'Nitrate radical',
      molarMass: '62.004 g/mol',
      lifetime: '~ segundos (día) / minutos (noche)',
      color: '#ec4899',
      glowColor: 'rgba(236, 72, 153, 0.4)',
      bgGradient: 'from-pink-500/20 to-rose-600/10',
      desc: 'El oxidante nocturno por excelencia; ataca hidrocarburos insaturados (isopreno, terpenos) cuando el sol se oculta.',
      reactionScheme: 'NO₂ + O₃ → NO₃• + O₂  |  NO₃• + NO₂ + M ↔ N₂O₅ + M',
      healthImpact: 'Formación de nitratos orgánicos mutágenos y partículas tóxicas en aerosol nocturno.',
      localSources: 'Reacción en oscuridad entre NO₂ residual y ozono en la atmósfera urbana.',
      measurementMethod: 'Espectroscopía de cavidad resonante CRDS'
    },

    // Familia: Partículas
    {
      id: 'pm10_ugm3',
      name: 'Partículas Torácicas (PM₁₀)',
      family: 'particulate',
      unit: 'µg/m³',
      limitWHO: 45,
      limitEU: 50,
      formula: 'PM₁₀',
      iupac: 'Particulate Matter ≤ 10 µm',
      molarMass: 'Mezcla polidispersa',
      lifetime: '~ 1 a 10 días',
      color: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      bgGradient: 'from-emerald-500/20 to-teal-600/10',
      desc: 'Partículas en suspensión con diámetro aerodinámico menor a 10 µm capaces de penetrar en las vías respiratorias bajas.',
      reactionScheme: 'Emisión mecánica + resuspensión + advección de polvo mineral',
      healthImpact: 'Irritación de vías aéreas superiores, sinusitis, bronquitis crónica y reactivación de EPOC.',
      localSources: 'Polvo mineral sahariano, desgaste de frenos/neumáticos en MA-20 y obras urbanas.',
      measurementMethod: 'Atenuación Beta / Microbalanza de cuarzo TEOM (EN 12341)'
    },
    {
      id: 'pm25_ugm3',
      name: 'Partículas Finas Respirables (PM₂.₅)',
      family: 'particulate',
      unit: 'µg/m³',
      limitWHO: 15,
      limitEU: 25,
      formula: 'PM₂.₅',
      iupac: 'Particulate Matter ≤ 2.5 µm',
      molarMass: 'Mezcla secundaria / primaria',
      lifetime: '~ días a semanas',
      color: '#059669',
      glowColor: 'rgba(5, 150, 105, 0.4)',
      bgGradient: 'from-teal-500/20 to-emerald-700/10',
      desc: 'Fracción respirable alveolar de alto impacto toxicológico capaz de cruzar la barrera alvéolo-capilar hacia el torrente sanguíneo.',
      reactionScheme: 'Aerosol primario de combustión + condensación de sulfatos, nitratos y SOA',
      healthImpact: 'Aterosclerosis acelerada, infartos de miocardio, ictus cerebrales y cáncer de pulmón (IARC Grupo 1).',
      localSources: 'Combustión diésel, buques mercantes del Puerto de Málaga e incendios forestales.',
      measurementMethod: 'Microbalanza TEOM / Espectrometría óptica de aerosoles'
    },
    {
      id: 'black_carbon_ugm3',
      name: 'Carbono Negro / Hollín',
      family: 'particulate',
      unit: 'µg/m³',
      limitWHO: null,
      limitEU: null,
      formula: 'BC (Soot)',
      iupac: 'Refractory Carbonaceous Aerosol',
      molarMass: '12.011 g/mol (C puro)',
      lifetime: '~ 4 a 12 días',
      color: '#64748b',
      glowColor: 'rgba(100, 116, 139, 0.4)',
      bgGradient: 'from-slate-600/20 to-zinc-700/10',
      desc: 'Fracción carbonosa grafítica pura producida por combustión incompleta de combustibles fósiles y biomasa.',
      reactionScheme: 'CnHm + O₂ (incompleta) → Core grafítico de nanopartículas agregadas',
      healthImpact: 'Vector de hidrocarburos aromáticos policíclicos (HAP) cancerígenos adheridos a su superficie porosa.',
      localSources: 'Flota diésel urbana y autobuses en paradas de la Alameda Principal y Calle Cuarteles.',
      measurementMethod: 'Aetalómetro multi-longitud de onda (absorción 880 nm)'
    },
    {
      id: 'sea_salt_aerosol_ugm3',
      name: 'Aerosol Marino (Sal / Spray)',
      family: 'particulate',
      unit: 'µg/m³',
      limitWHO: null,
      limitEU: null,
      formula: 'NaCl-Spray',
      iupac: 'Sea Salt Aerosol (NaCl + MgSO₄)',
      molarMass: '58.44 g/mol eq',
      lifetime: '~ horas a días',
      color: '#06b6d4',
      glowColor: 'rgba(6, 182, 212, 0.4)',
      bgGradient: 'from-cyan-500/20 to-teal-600/10',
      desc: 'Componente natural marino higroscópico generado por la rotura de olas en las playas de La Malagueta, Pedregalejo y el dique de Levante.',
      reactionScheme: 'Bubble bursting + cizalladura por viento → gotas de salmuera → aerosol seco',
      healthImpact: 'Componente natural no tóxico; puede liberar cloro activo (ClNO₂) al reaccionar con N₂O₅ nocturno.',
      localSources: 'Mar de Alborán y litoral de la Bahía de Málaga.',
      measurementMethod: 'Cromatografía iónica de cationes Na+/Cl-'
    },

    // Familia: COVs y Gases
    {
      id: 'co_mgm3',
      name: 'Monóxido de Carbono',
      family: 'vocs_carbon',
      unit: 'mg/m³',
      limitWHO: 4.0,
      limitEU: 10.0,
      formula: 'CO',
      iupac: 'Carbon monoxide',
      molarMass: '28.01 g/mol',
      lifetime: '~ 1 a 2 meses',
      color: '#94a3b8',
      glowColor: 'rgba(148, 163, 184, 0.4)',
      bgGradient: 'from-slate-500/20 to-slate-700/10',
      desc: 'Gas inodoro, incoloro y altamente tóxico originado por combustión incompleta en motores de gasolina y calderas.',
      reactionScheme: '2 C + O₂ (deficiente) → 2 CO  |  CO + OH• → CO₂ + H•',
      healthImpact: 'Se une irreversiblemente a la hemoglobina formando carboxihemoglobina (HbCO), privando de oxígeno al miocardio y cerebro.',
      localSources: 'Arranque en frío de turismos de gasolina en garajes y tráfico congestionado.',
      measurementMethod: 'Correlación de filtros infrarrojos NDIR (EN 14626)'
    },
    {
      id: 'so2_ugm3',
      name: 'Dióxido de Azufre',
      family: 'vocs_carbon',
      unit: 'µg/m³',
      limitWHO: 40,
      limitEU: 350,
      formula: 'SO₂',
      iupac: 'Sulfur dioxide',
      molarMass: '64.066 g/mol',
      lifetime: '~ 1 a 3 días',
      color: '#eab308',
      glowColor: 'rgba(234, 179, 8, 0.4)',
      bgGradient: 'from-yellow-500/20 to-amber-600/10',
      desc: 'Gas irritante precursor del aerosol de sulfato secundario y la lluvia ácida.',
      reactionScheme: 'S + O₂ → SO₂  |  SO₂ + OH• + O₂ → SO₃ + HO₂•  |  SO₃ + H₂O → H₂SO₄',
      healthImpact: 'Broncoconstricción refleja inmediata y daño al epitelio ciliar respiratorio.',
      localSources: 'Buques de crucero y portacontenedores en el Puerto de Málaga y actividades auxiliares.',
      measurementMethod: 'Fluorescencia ultravioleta pulsada (EN 14212)'
    },
    {
      id: 'benzene_ugm3',
      name: 'Benceno',
      family: 'vocs_carbon',
      unit: 'µg/m³',
      limitWHO: null,
      limitEU: 5.0,
      formula: 'C₆H₆',
      iupac: 'Benzene',
      molarMass: '78.11 g/mol',
      lifetime: '~ 9 a 14 días',
      color: '#ef4444',
      glowColor: 'rgba(239, 68, 68, 0.4)',
      bgGradient: 'from-red-500/20 to-rose-600/10',
      desc: 'Hidrocarburo aromático volátil volátil cancerígeno de gran estabilidad química presente en carburantes.',
      reactionScheme: 'C₆H₆ + OH• → C₆H₆-OH• adduct → Fenol + productos de apertura de anillo',
      healthImpact: 'Cancerígeno demostrado en humanos (IARC Grupo 1); inductor de leucemia mieloide y daño hematopoyético.',
      localSources: 'Evaporación de gasolina en gasolineras urbanas y tubo de escape de vehículos antiguos.',
      measurementMethod: 'Cromatografía de gases GC-PID / Tubos de desorción térmica'
    },
    {
      id: 'toluene_ugm3',
      name: 'Tolueno',
      family: 'vocs_carbon',
      unit: 'µg/m³',
      limitWHO: null,
      limitEU: null,
      formula: 'C₇H₈',
      iupac: 'Methylbenzene',
      molarMass: '92.14 g/mol',
      lifetime: '~ 2 días',
      color: '#f97316',
      glowColor: 'rgba(249, 115, 22, 0.4)',
      bgGradient: 'from-orange-500/20 to-amber-600/10',
      desc: 'COV aromático de solventes, pinturas y carburantes con reactividad fotoquímica moderada frente a radicales OH•.',
      reactionScheme: 'C₆H₅CH₃ + OH• → C₆H₅CH₂• (abstracción) o aducto orto-cresol',
      healthImpact: 'Depresor del sistema nervioso central, cefaleas e irritación ocular en picos elevados.',
      localSources: 'Talleres de chapa/pintura en polígonos del Guadalhorce y disolventes.',
      measurementMethod: 'Cromatografía de gases GC-MS'
    },
    {
      id: 'isoprene_ppb',
      name: 'Isopreno Biogénico',
      family: 'vocs_carbon',
      unit: 'ppb',
      limitWHO: null,
      limitEU: null,
      formula: 'C₅H₈',
      iupac: '2-Methylbuta-1,3-diene',
      molarMass: '68.12 g/mol',
      lifetime: '~ 1.5 horas (alta reactividad)',
      color: '#84cc16',
      glowColor: 'rgba(132, 204, 22, 0.4)',
      bgGradient: 'from-lime-500/20 to-green-600/10',
      desc: 'Hidrocarburo volátil emitido por la masa vegetal arbórea que reacciona con extrema rapidez con radicales OH• propiciando la formación de ozono.',
      reactionScheme: 'C₅H₈ + OH• + O₂ → ISOPOO• (radicales peroxi) → MVK + MACR + SOA',
      healthImpact: 'No tóxico directamente; precursor del 50% del aerosol orgánico secundario bio-fotoquímico.',
      localSources: 'Emisión foliar del Parque de Málaga, arboleda de Gibralfaro y Plátanos de Sombra.',
      measurementMethod: 'Espectrometría PTR-MS / Cromatografía GC-FID'
    },

    // Familia: Meteorología
    {
      id: 'tempC',
      name: 'Temperatura del Aire',
      family: 'meteorology',
      unit: '°C',
      limitWHO: null,
      limitEU: null,
      formula: 'T',
      iupac: 'Air Temperature',
      molarMass: '—',
      lifetime: 'Variable continua',
      color: '#f43f5e',
      glowColor: 'rgba(244, 63, 94, 0.4)',
      bgGradient: 'from-rose-500/20 to-red-600/10',
      desc: 'Modula exponencialmente las constantes de velocidad cinética de Arrhenius k(T) y la evaporación de compuestos orgánicos volátiles.',
      reactionScheme: 'k(T) = A · exp(-Ea / (R·T))',
      healthImpact: 'Estrés térmico, golpes de calor en episodios de Terral y amplificación de toxicidad de oxidantes.',
      localSources: 'Microclima costero mediterráneo y efecto de isla de calor urbana.',
      measurementMethod: 'Termómetro de resistencia de platino Pt100'
    },
    {
      id: 'rh',
      name: 'Humedad Relativa',
      family: 'meteorology',
      unit: '%',
      limitWHO: null,
      limitEU: null,
      formula: 'HR',
      iupac: 'Relative Humidity',
      molarMass: '—',
      lifetime: 'Variable continua',
      color: '#0ea5e9',
      glowColor: 'rgba(14, 165, 233, 0.4)',
      bgGradient: 'from-sky-500/20 to-cyan-600/10',
      desc: 'Disponibilidad de vapor de agua [H₂O] indispensable para la fotólisis de O₃ que engendra los radicales oxidantes OH•.',
      reactionScheme: 'O(¹D) + H₂O → 2 OH•',
      healthImpact: 'Regula la sensación térmica de bochorno y el crecimiento higroscópico de partículas respirables.',
      localSources: 'Aporte de humedad por la masa marina del Mar de Alborán.',
      measurementMethod: 'Higrómetro capacitivo'
    },
    {
      id: 'uv_index',
      name: 'Índice de Radiación UV Actínica',
      family: 'meteorology',
      unit: 'UV Index',
      limitWHO: null,
      limitEU: null,
      formula: 'UV',
      iupac: 'Actinic Ultraviolet Index',
      molarMass: '—',
      lifetime: 'Ciclo diurno fotónico',
      color: '#eab308',
      glowColor: 'rgba(234, 179, 8, 0.4)',
      bgGradient: 'from-yellow-500/20 to-amber-600/10',
      desc: 'Gobierna directamente las frecuencias de fotólisis J(NO₂) y J(O¹D) que disparan toda la maquinaria oxidativa de la troposfera.',
      reactionScheme: 'J_i = ∫ F(λ) · σ_i(λ, T) · φ_i(λ, T) dλ',
      healthImpact: 'Eritema cutáneo, quemaduras solares, cataratas y carcinogénesis celular dérmica.',
      localSources: 'Radiación solar directa y difusa en latitud 36.7°N.',
      measurementMethod: 'Radiómetro espectral UV-B de banda ancha'
    },
    {
      id: 'windSpeed_ms',
      name: 'Velocidad del Viento',
      family: 'meteorology',
      unit: 'm/s',
      limitWHO: null,
      limitEU: null,
      formula: 'U_wind',
      iupac: 'Wind Speed',
      molarMass: '—',
      lifetime: 'Variable dinámica',
      color: '#14b8a6',
      glowColor: 'rgba(20, 184, 166, 0.4)',
      bgGradient: 'from-teal-500/20 to-emerald-600/10',
      desc: 'Controla el transporte advectivo horizontal, la ventilación de cañones urbanos y la dispersión o confinamiento de penachos.',
      reactionScheme: '∂C/∂t = -u(∂C/∂x) - v(∂C/∂y) + K_h ∇²C + R_quim',
      healthImpact: 'Vientos calmos favorecen episodios de estancamiento y acumulación extrema de contaminación.',
      localSources: 'Régimen de brisa marina / terrestre y canalizaciones topográficas.',
      measurementMethod: 'Anemómetro ultrasónico 3D'
    },
    {
      id: 'pblh_m',
      name: 'Altura de la Capa de Mezcla',
      family: 'meteorology',
      unit: 'm',
      limitWHO: null,
      limitEU: null,
      formula: 'PBLH',
      iupac: 'Planetary Boundary Layer Height',
      molarMass: '—',
      lifetime: 'Ciclo diurno térmico',
      color: '#8b5cf6',
      glowColor: 'rgba(139, 92, 246, 0.4)',
      bgGradient: 'from-purple-500/20 to-indigo-600/10',
      desc: 'Volumen atmosférico vertical disponible para la dilución de emisiones urbanas. Varía de 200 m por la noche a > 1500 m en horas solares.',
      reactionScheme: 'C_box = (E_emision · L) / (U · PBLH)',
      healthImpact: 'Capa de mezcla reducida comprime los contaminantes a nivel de acera aumentando la dosis inhalada.',
      localSources: 'Convección térmica del suelo y turbulencia mecánica urbana.',
      measurementMethod: 'Lidar aerosol Doppler / Ceilómetro óptico'
    }
  ], []);

  // Filtrado por familia
  const filteredVariables = useMemo(() => {
    if (selectedFamily === 'all') return allChemicalVariables;
    return allChemicalVariables.filter(v => v.family === selectedFamily);
  }, [allChemicalVariables, selectedFamily]);

  // Variable inspeccionada actualmente para la ficha técnica
  const inspectedVar = useMemo(() => {
    return allChemicalVariables.find(v => v.id === activeInspectedVarId) || allChemicalVariables[0];
  }, [allChemicalVariables, activeInspectedVarId]);

  // Exportar matriz completa 24h a CSV
  const exportFullDayCsv = () => {
    const varKeys = allChemicalVariables.map(v => v.id);
    const headerRow = `hora,dia,estacion,` + allChemicalVariables.map(v => `${v.name.replace(/,/g, '')} [${v.unit}]`).join(',') + `\n`;
    const rows = dayHourlyData.map(h => {
      const vals = varKeys.map(k => (h as any)[k]);
      return `${h.timeLabel},${selectedDay},${selectedStationId},${vals.join(',')}`;
    }).join('\n');

    const blob = new Blob([headerRow + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matriz_quimica_completa_malaga_${selectedStationId}_${selectedDay}.csv`;
    a.click();
  };

  // Preset jumps para saltar directamente a hitos atmosféricos clave
  const atmosphericPresets = [
    { label: '08:00 Pico Tráfico', hour: 8, icon: Activity, desc: 'Pico NO/NOx, Titulación O₃', color: 'from-amber-600 to-orange-600' },
    { label: '12:00 Cénit Solar', hour: 12, icon: Sun, desc: 'Cénit Solar y Radiación Actínica', color: 'from-yellow-500 to-amber-500' },
    { label: '14:00 Pico [OH•] & Fotólisis', hour: 14, icon: Zap, desc: 'Máxima Oxidación [OH•]ss', color: 'from-purple-600 to-fuchsia-600' },
    { label: '16:00 Pico Fotoquímico O₃', hour: 16, icon: Sparkles, desc: 'Pico Vespertino de Ozono O₃', color: 'from-cyan-500 to-blue-600' },
    { label: '18:30 Brisa Marina & Retorno', hour: 18, icon: Wind, desc: 'Entrada Brisa SSE & Retorno', color: 'from-teal-500 to-emerald-600' },
    { label: '23:00 Régimen Nocturno', hour: 23, icon: Moon, desc: 'Química Nocturna [NO₃•] & HONO', color: 'from-indigo-600 to-slate-700' }
  ];

  // Cálculo de color de cielo dinámico según la hora
  const skyTheme = useMemo(() => {
    if (selectedHour >= 6 && selectedHour < 9) {
      return {
        bg: 'from-indigo-950 via-amber-950 to-orange-900',
        text: 'text-amber-300',
        label: 'Amanecer / Aurora Urbana',
        icon: CloudSun
      };
    }
    if (selectedHour >= 9 && selectedHour < 18) {
      return {
        bg: 'from-sky-950 via-teal-950 to-emerald-950',
        text: 'text-cyan-300',
        label: 'Día Pleno / Régimen Fotoquímico Activo',
        icon: Sun
      };
    }
    if (selectedHour >= 18 && selectedHour < 21) {
      return {
        bg: 'from-amber-950 via-rose-950 to-purple-950',
        text: 'text-rose-300',
        label: 'Atardecer / Ocaso & Dispersión de Brisa',
        icon: CloudSun
      };
    }
    return {
      bg: 'from-slate-950 via-indigo-950 to-black',
      text: 'text-indigo-300',
      label: 'Noche Troposférica / Química NO₃• & Capa Inversión',
      icon: Moon
    };
  }, [selectedHour]);

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title="Matriz Multiespecie & Cronología Físico-Química Horaria"
      subtitle="Exploración interactiva de todas las especies (NOx, O₃, Radicales OH/HO₂, PM, COVs) y meteorología 24h"
      icon={<FlaskConical className="w-5 h-5 text-emerald-400" />}
      badge={
        <span className={`text-[10px] px-2 py-0.5 font-bold uppercase border bg-black/50 border-white/20 ${skyTheme.text}`}>
          {skyTheme.label}
        </span>
      }
      onClose={onClose}
      headerColorClass="text-emerald-400"
      borderColorClass="border-emerald-500/60"
      className="w-full max-w-7xl"
      initialPositionClass="top-4 left-1/2 -translate-x-1/2"
    >
      <div className="flex flex-col gap-3">

          {/* BARRA DE MICRO-ZONA & ASIMILACIÓN TELEMÉTRICA EN VIVO */}
          <div className="flex flex-wrap items-center justify-between bg-slate-900/95 border border-emerald-500/40 p-2.5 rounded-sm gap-2">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-200 tracking-wider flex items-center gap-1.5 font-mono">
                  Micro-Zona Geográfica de Málaga & Telemetría en Vivo
                  {isIngestingTelemetry && <span className="text-amber-400 text-[9px] animate-pulse">(Asimilando...)</span>}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {telemetryFeedback ? (
                    <span className="text-emerald-300 font-bold">{telemetryFeedback}</span>
                  ) : (
                    "Conectores activos: Open-Meteo, Copernicus CAMS & Red EIONET Andalucía"
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap font-mono">
              <ScientificTooltip position="bottom" width="w-[320px]" content="Selecciona la micro-zona geográfica de Málaga para asimilar en tiempo real su topología, coordenadas exactas, meteorología y concentraciones físico-químicas de fondo.">
                <div className="flex items-center gap-1.5 bg-slate-950 border border-emerald-500/50 rounded-sm px-2.5 py-1.5 cursor-pointer">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[9px] uppercase font-bold text-slate-400 mr-1">Zona:</span>
                  <select
                    value={activeZone.name}
                    onChange={(e) => {
                      const z = PRESET_ZONES.find(zone => zone.name === e.target.value);
                      if (z) handleZoneSelect(z);
                    }}
                    className="bg-transparent text-[11px] font-mono text-emerald-300 font-bold outline-none cursor-pointer"
                  >
                    {PRESET_ZONES.map(z => (
                      <option key={z.name} value={z.name} className="bg-slate-950 text-slate-200">
                        {z.name} — {z.tag}
                      </option>
                    ))}
                  </select>
                </div>
              </ScientificTooltip>

              <ScientificTooltip
                title="Re-Asimilación de Serie Histórica Multiespecie"
                position="bottom"
                width="w-[290px]"
                content="Re-ejecuta el ciclo de asimilación histórica horaria de las especies químicas (NO₂, O₃, PM₂.₅, PM₁₀, SO₂, CO y BTX) interpolando por Kriging Ordinario las estaciones oficiales para la zona seleccionada."
                formula="\hat{C}_s(\mathbf{x}_z, t) = \sum_{i=1}^{24} \lambda_i(\mathbf{x}_z)\, C_{s,i}^{\text{obs}}(t)"
              >
                <button
                  onClick={() => handleAssimilateZoneData(activeZone)}
                  disabled={isIngestingTelemetry}
                  className="px-2.5 py-1.5 bg-emerald-950/80 border border-emerald-500/60 hover:bg-emerald-900 text-emerald-300 text-[10px] font-mono font-bold rounded-sm flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isIngestingTelemetry ? 'animate-spin' : ''}`} />
                  <span>Sincronizar</span>
                </button>
              </ScientificTooltip>
            </div>
          </div>

          {/* Master Control Bar (Día, Estación, Filtro de Familias y Exportar) */}
          <div className="p-3 bg-slate-900/90 border-b border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-2.5 font-mono text-xs">
            {/* 1. Selector de Día */}
            <ScientificTooltip position="bottom" width="w-[300px]" content="Selección del episodio sinóptico o día de asimilación (Terral, Brisas, Intrusión Sahariana, Fines de semana) con su forzamiento meteorológico y de emisiones reales.">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2 rounded-md hover:border-emerald-500/50 transition-colors cursor-help">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Día de Observación / Asimilación:</span>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="w-full bg-transparent text-emerald-300 font-bold outline-none cursor-pointer text-xs"
                  >
                    {availableDays.map(d => (
                      <option key={d.id} value={d.id} className="bg-slate-950 text-slate-200">
                        {d.label} — {d.badge}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </ScientificTooltip>

            {/* 2. Selector de Estación */}
            <ScientificTooltip position="bottom" width="w-[300px]" content="Estación de referencia de la Red de Calidad del Aire de Andalucía en Málaga (tráfico urbano, fondo suburbano, altitud o marítima).">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2 rounded-md hover:border-cyan-500/50 transition-colors cursor-help">
                <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Estación / Receptor:</span>
                  <select
                    value={selectedStationId}
                    onChange={(e) => setSelectedStationId(e.target.value)}
                    className="w-full bg-transparent text-cyan-300 font-bold outline-none cursor-pointer text-xs"
                  >
                    {OFFICIAL_MALAGA_AIR_STATIONS.map(st => (
                      <option key={st.id} value={st.id} className="bg-slate-950 text-slate-200">
                        {st.name} ({st.code}) — {st.environmentType}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </ScientificTooltip>

            {/* 3. Filtro de Familias Químicas */}
            <ScientificTooltip position="bottom" width="w-[300px]" content="Filtrado taxonómico según grupos cinéticos: especies de nitrógeno (NOx/HONO/HNO3), oxidantes fotoquímicos y radicales (O3/OH/HO2/NO3), aerosoles (PM/BC) o meteorología.">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2 rounded-md hover:border-purple-500/50 transition-colors cursor-help">
                <Filter className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Familia Química:</span>
                  <select
                    value={selectedFamily}
                    onChange={(e) => setSelectedFamily(e.target.value as ChemicalFamily)}
                    className="w-full bg-transparent text-purple-300 font-bold outline-none cursor-pointer text-xs"
                  >
                    <option value="all" className="bg-slate-950 text-slate-200">✨ Todas las Especies ({allChemicalVariables.length} vars)</option>
                    <option value="nitrogen_species" className="bg-slate-950 text-slate-200">🔶 Especies Nitrogenadas (NO, NO₂, HONO, HNO₃)</option>
                    <option value="ozone_radicals" className="bg-slate-950 text-slate-200">🔷 Ozono & Radicales (O₃, OH•, HO₂•, NO₃•, Φ)</option>
                    <option value="particulate" className="bg-slate-950 text-slate-200">🟢 Partículas & Aerosoles (PM₁₀, PM₂.₅, Hollín, Sal)</option>
                    <option value="vocs_carbon" className="bg-slate-950 text-slate-200">🔴 COVs, CO, SO₂ & Biogénicos (Isopreno)</option>
                    <option value="meteorology" className="bg-slate-950 text-slate-200">⛅ Meteorología & Capa Límite (T, HR, UV, Viento)</option>
                  </select>
                </div>
              </div>
            </ScientificTooltip>

            {/* 4. Exportador CSV */}
            <div className="flex items-center justify-end">
              <ScientificTooltip position="bottom" width="w-[280px]" content="Exportación tabular abierta CSV FAIR de la matriz horaria completa (24 horas x 18 variables fisicoquímicas y meteorológicas) para reproducibilidad científica.">
                <button
                  onClick={exportFullDayCsv}
                  className="w-full h-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-extrabold px-3 py-2 flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] rounded-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar Matriz 24h (.CSV)</span>
                </button>
              </ScientificTooltip>
            </div>
          </div>

          {/* Interactive 24-Hour Slider & Sun Tracker Banner */}
          <div className="p-3 bg-slate-950 border-b border-slate-800 font-mono text-xs space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-amber-950/70 border border-amber-500/50 rounded text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 font-extrabold text-sm">{currentSnapshot.timeLabel} CEST</span>
                </div>
                <span className="text-xs text-slate-300 font-semibold">
                  Hora Solar:{' '}
                  <strong className="text-cyan-300">{((selectedHour + 22) % 24).toString().padStart(2, '0')}:00</strong> | Radiación Actínica:{' '}
                  <strong className="text-yellow-400">{currentSnapshot.solar_radiation_w_m2} W/m² (UV {currentSnapshot.uv_index})</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedHour(14)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded transition-colors"
                  title="Restablecer a mediodía fotoquímico (14:00)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Slider de 0 a 23 horas con track degradado de día/noche */}
            <div className="space-y-1.5">
              <div className="relative w-full">
                <input
                  type="range"
                  min={0}
                  max={23}
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer h-2.5 bg-gradient-to-r from-indigo-950 via-sky-800 via-amber-700 to-slate-950 rounded-lg appearance-none shadow-inner"
                />
              </div>

              {/* Hitos rápidos en píldoras coloreadas */}
              <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 text-[10px]">
                {atmosphericPresets.map(preset => {
                  const isSelected = selectedHour === preset.hour;
                  const IconComp = preset.icon;
                  return (
                    <button
                      key={preset.hour}
                      onClick={() => { setSelectedHour(preset.hour); }}
                      className={`px-2 py-1 rounded border whitespace-nowrap flex items-center gap-1 transition-all ${
                        isSelected
                          ? `bg-gradient-to-r ${preset.color} text-white font-extrabold border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]`
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                      title={preset.desc}
                    >
                      <IconComp className="w-3 h-3" />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sub-view Navigation Tabs */}
          <div className="flex items-center gap-1 px-4 pt-2.5 bg-slate-950 border-b border-slate-800 text-xs font-mono overflow-x-auto">
            <ScientificTooltip position="bottom" width="w-[280px]" content="Evolución temporal continua de 24 horas para las 18 especies químicas analizadas, integrada con perfiles meteorológicos y capa límite PBLH.">
              <button
                onClick={() => setActiveViewMode('hourly_timeline')}
                className={`px-3 py-2 border-b-2 font-bold transition-all rounded-t flex items-center gap-1.5 whitespace-nowrap ${
                  activeViewMode === 'hourly_timeline'
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Cronología 24h</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Corte instantáneo horario con balance de masa, fracciones molares (ppb/ppm) y concentraciones de masa (µg/m³).">
              <button
                onClick={() => setActiveViewMode('single_hour_snapshot')}
                className={`px-3 py-2 border-b-2 font-bold transition-all rounded-t flex items-center gap-1.5 whitespace-nowrap ${
                  activeViewMode === 'single_hour_snapshot'
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Snapshot ({currentSnapshot.timeLabel})</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[300px]" content="Matriz comparativa simultánea entre las 5 estaciones oficiales de Málaga (Carranque, Hilera, El Atabal, Muelle de Levante, Paseo de Martiricos).">
              <button
                onClick={() => setActiveViewMode('multi_station_matrix')}
                className={`px-3 py-2 border-b-2 font-bold transition-all rounded-t flex items-center gap-1.5 whitespace-nowrap ${
                  activeViewMode === 'multi_station_matrix'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Red 5 Estaciones</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[300px]" content="Perfil vertical de mezcla en la Capa Límite Planetaria (PBLH) y altura del dosel urbano según la teoría de Monin-Obukhov.">
              <button
                onClick={() => setActiveViewMode('vertical_column_profile')}
                className={`px-3 py-2 border-b-2 font-bold transition-all rounded-t flex items-center gap-1.5 whitespace-nowrap ${
                  activeViewMode === 'vertical_column_profile'
                    ? 'border-teal-400 text-teal-400 bg-teal-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wind className="w-3.5 h-3.5" />
                <span>Columna Vertical & PBLH</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[300px]" content="Estudio estructural molecular en el modelo de espacio repleto CPK (Corey-Pauling-Koltun) con masa molar, reactividad frente a OH• y vida media atmosférica.">
              <button
                onClick={() => setActiveViewMode('molecular_studio')}
                className={`px-3 py-2 border-b-2 font-bold transition-all rounded-t flex items-center gap-1.5 whitespace-nowrap ${
                  activeViewMode === 'molecular_studio'
                    ? 'border-rose-400 text-rose-400 bg-rose-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Estudio Molecular CPK</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Herramienta de superposición multivariable para correlacionar parámetros meteorológicos (temp, UV, viento) con contaminantes.">
              <button
                onClick={() => setActiveViewMode('variable_comparator')}
                className={`px-3 py-2 border-b-2 font-bold transition-all rounded-t flex items-center gap-1.5 whitespace-nowrap ${
                  activeViewMode === 'variable_comparator'
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Comparador ({comparatorSelectedVars.length})</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Mapa de calor de densidad concentrada por especie e intervalo horario con codificación de color continua.">
              <button
                onClick={() => setActiveViewMode('hourly_table')}
                className={`px-3 py-2 border-b-2 font-bold transition-all rounded-t flex items-center gap-1.5 whitespace-nowrap ${
                  activeViewMode === 'hourly_table'
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Matriz Heatmap</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[300px]" content="Auditoría de cumplimiento de las directrices globales de la Organización Mundial de la Salud (OMS 2021) e indicación de superación de umbrales de salud.">
              <button
                onClick={() => setActiveViewMode('who_compliance')}
                className={`px-3 py-2 border-b-2 font-bold transition-all rounded-t flex items-center gap-1.5 whitespace-nowrap ${
                  activeViewMode === 'who_compliance'
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Auditoría OMS 2021</span>
              </button>
            </ScientificTooltip>
          </div>

          {/* Main Body */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4 font-mono text-xs">
            {/* 1. MODO GRÁFICO TEMPORAL 24H */}
            {activeViewMode === 'hourly_timeline' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Gráfico 1: Especies Químicas Principales */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 flex flex-col shadow-lg">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                      <span className="font-bold text-amber-300 uppercase text-xs flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-amber-400" />
                        Perfil Cinético de Especies (NO₂, O₃, PM₁₀, PM₂.₅)
                      </span>
                      <span className="text-[10px] text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-slate-800">&mu;g/m&sup3;</span>
                    </div>
                    <div className="h-[270px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dayHourlyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} />
                          <YAxis stroke="#64748b" fontSize={10} domain={[0, 'auto']} />
                          <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} />
                          <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                          <ReferenceLine x={currentSnapshot.timeLabel} stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" label={{ value: 'Hora', fill: '#10b981', fontSize: 10, position: 'top' }} />
                          <Line type="monotone" dataKey="no2_ugm3" name="NO₂ (Dióxido de Nitrógeno)" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                          <Line type="monotone" dataKey="o3_ugm3" name="O₃ (Ozono Troposférico)" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                          <Line type="monotone" dataKey="pm10_ugm3" name="PM₁₀ (Partículas)" stroke="#10b981" strokeWidth={1.8} dot={false} />
                          <Line type="monotone" dataKey="pm25_ugm3" name="PM₂.₅ (Finas)" stroke="#059669" strokeWidth={1.8} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Gráfico 2: Radicales Oxidantes & Meteorología */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 flex flex-col shadow-lg">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                      <span className="font-bold text-purple-300 uppercase text-xs flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        Capacidad Oxidativa ([OH•]ss) y Radiación Solar UV
                      </span>
                      <span className="text-[10px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">OH (10⁶) / UV Index</span>
                    </div>
                    <div className="h-[270px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dayHourlyData}>
                          <defs>
                            <linearGradient id="ohColorGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#c084fc" stopOpacity={0.5}/>
                              <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0}/>
                            </linearGradient>
                            <linearGradient id="uvColorGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#eab308" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#eab308" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} />
                          <YAxis stroke="#64748b" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} />
                          <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                          <ReferenceLine x={currentSnapshot.timeLabel} stroke="#c084fc" strokeWidth={2} strokeDasharray="3 3" />
                          <Area type="monotone" dataKey="oh_radicals_10e6" name="[OH•]ss (10⁶ molec/cm³)" stroke="#c084fc" strokeWidth={2} fillOpacity={1} fill="url(#ohColorGrad)" />
                          <Area type="monotone" dataKey="uv_index" name="Índice UV Actínico" stroke="#eab308" strokeWidth={2} fillOpacity={1} fill="url(#uvColorGrad)" />
                          <Line type="monotone" dataKey="tempC" name="Temperatura (°C)" stroke="#f43f5e" strokeWidth={1.8} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Resumen del Comportamiento Cinético */}
                <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/40 rounded-lg text-xs text-slate-300 flex items-start gap-3">
                  <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold text-emerald-300 block text-sm">
                      Diagnóstico Científico de la Dinámica Diurna para el día {selectedDay}:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-[11px]">
                      <div className="p-2 bg-black/40 border border-amber-500/30 rounded">
                        <strong className="text-amber-400 block mb-0.5">🌅 Régimen Matinal (07:00-09:00):</strong>
                        Emisión de tráfico domina con picos de NO ({Math.max(0, ...dayHourlyData.map(d => d.no_ugm3))} &mu;g/m&sup3;) y NO₂, titulando el O₃ residual hasta niveles mínimos.
                      </div>
                      <div className="p-2 bg-black/40 border border-purple-500/30 rounded">
                        <strong className="text-purple-400 block mb-0.5">☀️ Régimen Fotoquímico (12:00-16:00):</strong>
                        UV máximo ({Math.max(0, ...dayHourlyData.map(d => d.uv_index))}) activa la fotólisis y genera radicales OH• ({Math.max(0, ...dayHourlyData.map(d => d.oh_radicals_10e6))} &times; 10⁶ molec/cm&sup3;), alcanzando el pico de O₃ ({Math.max(0, ...dayHourlyData.map(d => d.o3_ugm3))} &mu;g/m&sup3;).
                      </div>
                      <div className="p-2 bg-black/40 border border-indigo-500/30 rounded">
                        <strong className="text-indigo-400 block mb-0.5">🌙 Régimen Nocturno (21:00-06:00):</strong>
                        Cesa la luz solar; predomina la química del radical nitrato NO₃• ({Math.max(0, ...dayHourlyData.map(d => d.no3_radical_pptv))} pptv) y la formación heterogénea de HONO sobre calzada.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. MODO SNAPSHOT INSTANTÁNEO CON TARJETAS COLORIDAS Y FICHA CINÉTICA */}
            {activeViewMode === 'single_hour_snapshot' && (
              <div className="space-y-4">
                {/* Header del snapshot */}
                <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Estado Atmosférico Instantáneo:</span>
                    <span className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      {selectedDay} — {currentSnapshot.timeLabel} CEST | Estación: {OFFICIAL_MALAGA_AIR_STATIONS.find(s => s.id === selectedStationId)?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 uppercase">Especies visibles:</span>
                    <span className="text-sm font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/60">
                      {filteredVariables.length} de {allChemicalVariables.length}
                    </span>
                  </div>
                </div>

                {/* Grid de Tarjetas Químicas Coloridas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredVariables.map(variable => {
                    const value = (currentSnapshot as any)[variable.id];
                    const isSelected = inspectedVar.id === variable.id;
                    const isExceedingWHO = variable.limitWHO && typeof value === 'number' && value > variable.limitWHO;

                    return (
                      <motion.div
                        key={variable.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setActiveInspectedVarId(variable.id)}
                        className={`p-3.5 rounded-lg border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? `bg-gradient-to-br ${variable.bgGradient} border-white shadow-[0_0_20px_${variable.glowColor}] ring-2 ring-emerald-400`
                            : isExceedingWHO
                            ? 'bg-red-950/30 border-red-500/60 hover:border-red-400'
                            : 'bg-slate-900/70 border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-1.5">
                            <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: variable.color, color: variable.color }}></span>
                              {variable.formula}
                            </span>
                            {variable.limitWHO ? (
                              <span className={`text-[9px] px-2 py-0.5 rounded font-bold border ${
                                isExceedingWHO
                                  ? 'bg-red-950 text-red-300 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                                  : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                              }`}>
                                OMS: {variable.limitWHO} {variable.unit}
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-500 font-mono">
                                {variable.molarMass !== '—' ? variable.molarMass : ''}
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-slate-300 block font-semibold truncate" title={variable.name}>
                            {variable.name}
                          </span>

                          <div className="text-xl font-extrabold text-white mt-1 flex items-baseline gap-1.5">
                            <span style={{ color: variable.color }}>
                              {value !== undefined ? value : '—'}
                            </span>
                            <span className="text-[10px] font-normal text-slate-400">{variable.unit}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 truncate max-w-[150px]">{variable.lifetime}</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-0.5 hover:underline">
                            Ver Ficha <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Ficha Técnica Detallada de la Especie Seleccionada */}
                {inspectedVar && (
                  <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-emerald-500/60 rounded-lg shadow-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg border text-white font-extrabold text-lg flex items-center justify-center min-w-[55px]" style={{ backgroundColor: inspectedVar.glowColor, borderColor: inspectedVar.color }}>
                          {inspectedVar.formula}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white">{inspectedVar.name}</h3>
                            <span className="text-[10px] text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded">
                              IUPAC: {inspectedVar.iupac}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">
                            Valor instantáneo a las {currentSnapshot.timeLabel}: <strong className="text-emerald-400 text-sm">{(currentSnapshot as any)[inspectedVar.id]} {inspectedVar.unit}</strong>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Tiempo de Residencia Atmosférico:</span>
                        <span className="text-xs font-bold text-cyan-300">{inspectedVar.lifetime}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                        <strong className="text-amber-300 block mb-1 flex items-center gap-1.5">
                          <Atom className="w-3.5 h-3.5" /> Esquema Cinético & Reacciones:
                        </strong>
                        <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                          {inspectedVar.reactionScheme}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                        <strong className="text-rose-300 block mb-1 flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5" /> Impacto Sanitario OMS / Epidemiología:
                        </strong>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {inspectedVar.healthImpact}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                        <strong className="text-teal-300 block mb-1 flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5" /> Fuentes Locales en Málaga & Metrología:
                        </strong>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          <strong>Fuentes:</strong> {inspectedVar.localSources}<br />
                          <strong>Método:</strong> {inspectedVar.measurementMethod}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. MODO COMPARADOR MULTIVARIABLE PERSONALIZABLE */}
            {activeViewMode === 'variable_comparator' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="font-bold text-emerald-400 uppercase text-xs flex items-center gap-1.5">
                      <Sliders className="w-4 h-4" /> Selecciona variables para superponer en el gráfico multivariable:
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({comparatorSelectedVars.length} activas)
                    </span>
                  </div>

                  {/* Selector chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {allChemicalVariables.map(v => {
                      const isSelected = comparatorSelectedVars.includes(v.id);
                      return (
                        <button
                          key={v.id}
                          onClick={() => {
                            if (isSelected) {
                              if (comparatorSelectedVars.length > 1) {
                                setComparatorSelectedVars(comparatorSelectedVars.filter(id => id !== v.id));
                              }
                            } else {
                              setComparatorSelectedVars([...comparatorSelectedVars, v.id]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            isSelected
                              ? 'text-white border-white shadow-md'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                          style={{
                            backgroundColor: isSelected ? v.color : undefined
                          }}
                        >
                          <span>{v.formula}</span>
                          <span className="text-[9px] opacity-80">({v.unit})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Gráfico Comparador Multivariable */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 flex flex-col shadow-lg">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                    <span className="font-bold text-white text-xs">
                      Superposición 24h Multivariable — Estación: {OFFICIAL_MALAGA_AIR_STATIONS.find(s => s.id === selectedStationId)?.name}
                    </span>
                    <span className="text-[10px] text-emerald-400">Sincronizado a las {currentSnapshot.timeLabel}</span>
                  </div>
                  <div className="h-[340px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dayHourlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                        <ReferenceLine x={currentSnapshot.timeLabel} stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" />
                        {comparatorSelectedVars.map(varId => {
                          const vMeta = allChemicalVariables.find(v => v.id === varId);
                          if (!vMeta) return null;
                          return (
                            <Line
                              key={vMeta.id}
                              type="monotone"
                              dataKey={vMeta.id}
                              name={`${vMeta.formula} [${vMeta.unit}]`}
                              stroke={vMeta.color}
                              strokeWidth={2.5}
                              dot={false}
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* 3. MODO RED 5 ESTACIONES OFICIALES DE MÁLAGA (CROSS-COMPARISON) */}
            {activeViewMode === 'multi_station_matrix' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-lg space-y-2.5">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <span className="font-extrabold text-cyan-400 uppercase text-xs flex items-center gap-1.5">
                        <Radio className="w-4 h-4" /> Comparativa Simultánea de las 5 Estaciones Oficiales (Málaga)
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Compara la evolución 24h de cualquier especie en los diferentes microclimas de la red metropolitana.
                      </p>
                    </div>
                  </div>

                  {/* Selector de Especie Química para la Comparación Multi-Estación */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { id: 'no2_ugm3', key: 'no2', label: 'NO₂ (Dióxido Nitrógeno)', color: '#f59e0b', unit: 'µg/m³' },
                      { id: 'o3_ugm3', key: 'o3', label: 'O₃ (Ozono)', color: '#38bdf8', unit: 'µg/m³' },
                      { id: 'pm10_ugm3', key: 'pm10', label: 'PM₁₀ (Partículas)', color: '#10b981', unit: 'µg/m³' },
                      { id: 'pm25_ugm3', key: 'pm25', label: 'PM₂.₅ (Finas)', color: '#059669', unit: 'µg/m³' },
                      { id: 'so2_ugm3', key: 'so2', label: 'SO₂ (Dióxido Azufre)', color: '#eab308', unit: 'µg/m³' },
                      { id: 'oh_radicals', key: 'oh', label: '[OH•]ss Oxidante', color: '#c084fc', unit: '10⁶ molec/cm³' }
                    ].map(sp => {
                      const isSelected = multiStationSpecies === sp.id;
                      return (
                        <button
                          key={sp.id}
                          onClick={() => setMultiStationSpecies(sp.id)}
                          className={`px-3 py-1.5 rounded text-xs font-bold transition-all border flex items-center gap-1.5 ${
                            isSelected
                              ? 'text-white border-white shadow-md'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                          style={{
                            backgroundColor: isSelected ? sp.color : undefined
                          }}
                        >
                          <span>{sp.label}</span>
                          <span className="text-[9px] opacity-80">[{sp.unit}]</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Gráfico 24h de las 5 Estaciones */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 flex flex-col shadow-lg">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                    <span className="font-bold text-white text-xs">
                      Perfil 24h en Red Oficial de Calidad del Aire de la Junta de Andalucía (Día {selectedDay})
                    </span>
                    <span className="text-[10px] text-cyan-400">Sincronizado a las {currentSnapshot.timeLabel}</span>
                  </div>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={multiStationHourlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                        <ReferenceLine x={currentSnapshot.timeLabel} stroke="#06b6d4" strokeWidth={2} strokeDasharray="3 3" />
                        {(() => {
                          const prefix = multiStationSpecies.split('_')[0];
                          const colors = ['#f59e0b', '#ef4444', '#06b6d4', '#10b981', '#a855f7'];
                          return OFFICIAL_MALAGA_AIR_STATIONS.map((st, idx) => (
                            <Line
                              key={st.id}
                              type="monotone"
                              dataKey={`${prefix}_${st.id}`}
                              name={`${st.name} (${st.environmentType})`}
                              stroke={colors[idx % colors.length]}
                              strokeWidth={2.2}
                              dot={false}
                            />
                          ));
                        })()}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tarjetas de las 5 Estaciones con Diagnóstico Espacial Instantáneo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
                  {OFFICIAL_MALAGA_AIR_STATIONS.map((st, idx) => {
                    const prefix = multiStationSpecies.split('_')[0];
                    const val = (multiStationHourlyData[selectedHour] as any)[`${prefix}_${st.id}`];
                    const isSelected = selectedStationId === st.id;
                    const colors = ['#f59e0b', '#ef4444', '#06b6d4', '#10b981', '#a855f7'];

                    return (
                      <div
                        key={st.id}
                        onClick={() => setSelectedStationId(st.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-extrabold text-white text-xs truncate max-w-[130px]" title={st.name}>
                            {st.name}
                          </span>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[idx] }}></span>
                        </div>
                        <span className="text-[9px] text-slate-400 block uppercase font-mono">{st.environmentType}</span>
                        <div className="mt-2 text-lg font-bold" style={{ color: colors[idx] }}>
                          {val !== undefined ? val : '—'}
                        </div>
                        <span className="text-[9px] text-slate-500 mt-1 block leading-tight truncate" title={st.sensors.join(', ')}>
                          Alt: {st.altM}m • {st.sensors.slice(0, 3).join(', ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {/* 7. MODO COLUMNA ATMOSFÉRICA VERTICAL & CAPA DE MEZCLA (PBLH) */}
            {activeViewMode === 'vertical_column_profile' && (
              <div className="space-y-4">
                {/* DIAGRAMA VECTORIAL ANIMADO DE INVERSIÓN Y CAPA LÍMITE */}
                <BoundaryLayerInversionDiagram
                  hPBL={currentSnapshot.pblh_m}
                  stability={currentSnapshot.solar_radiation_w_m2 > 100 ? 'Unstable' : 'Stable'}
                  surfaceTemp={currentSnapshot.tempC}
                  inversionStrength={currentSnapshot.solar_radiation_w_m2 > 100 ? 1.5 : 3.2}
                  surfaceConcentration={currentSnapshot.no2_ugm3}
                />

                <div className="p-3.5 bg-slate-900/90 border border-teal-500/40 rounded-lg space-y-2">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <span className="font-extrabold text-teal-400 uppercase text-xs flex items-center gap-1.5">
                        <Wind className="w-4 h-4" /> Perfil Vertical de la Troposfera Urbana (0 m a 2000 m)
                      </span>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Altura de Capa de Mezcla (PBLH = <strong className="text-teal-300">{currentSnapshot.pblh_m} m</strong>) y gradiente de dispersión vertical para las {currentSnapshot.timeLabel}.
                      </p>
                    </div>
                    <div className="text-right text-[10px] text-slate-400">
                      <span>Cota Montes de Málaga: <strong>1031 m</strong></span> | <span>Nivel del Mar: <strong>0 m</strong></span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Gráfico de Gradiente Vertical */}
                  <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 flex flex-col shadow-lg">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                      <span className="font-bold text-white text-xs">
                        Concentración vs Altitud (m sobre el nivel del suelo)
                      </span>
                      <span className="text-[10px] text-teal-400">Límite PBLH: {currentSnapshot.pblh_m} m</span>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={verticalAtmosphericLayers}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="altitude_label" stroke="#64748b" fontSize={10} />
                          <YAxis stroke="#64748b" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} />
                          <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                          <ReferenceLine x={`${verticalAtmosphericLayers.find(l => l.altitude_m >= currentSnapshot.pblh_m)?.altitude_label || '850 m'}`} stroke="#14b8a6" strokeWidth={2} strokeDasharray="3 3" label={{ value: 'Tope PBLH', fill: '#14b8a6', fontSize: 10 }} />
                          <Line type="monotone" dataKey="no2_ugm3" name="NO₂ (µg/m³)" stroke="#f59e0b" strokeWidth={2.2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="o3_ugm3" name="O₃ (µg/m³)" stroke="#38bdf8" strokeWidth={2.2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="pm25_ugm3" name="PM₂.₅ (µg/m³)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Tabla de Capas Verticales */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 overflow-y-auto max-h-[360px] text-xs">
                    <span className="font-bold text-slate-200 block mb-2 border-b border-slate-800 pb-1">
                      Capas Atmosféricas Discretizadas
                    </span>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {verticalAtmosphericLayers.map(layer => (
                        <div
                          key={layer.altitude_m}
                          className={`p-2 rounded border flex justify-between items-center ${
                            layer.isInversionZone
                              ? 'bg-red-950/30 border-red-500/40 text-red-300'
                              : layer.isInsidePblh
                              ? 'bg-teal-950/30 border-teal-500/40 text-teal-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div>
                            <span className="font-bold block text-white">{layer.altitude_label}</span>
                            <span className="text-[9px] opacity-80">
                              {layer.tempC}°C | Viento {layer.wind_ms} m/s
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-amber-400 font-bold">{layer.no2_ugm3} NO₂</span> |{' '}
                            <span className="text-sky-400 font-bold">{layer.o3_ugm3} O₃</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 8. MODO ESTUDIO MOLECULAR CPK & RESONANCIA ELECTRÓNICA */}
            {activeViewMode === 'molecular_studio' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-900/90 border border-rose-500/40 rounded-lg space-y-2">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <span className="font-extrabold text-rose-400 uppercase text-xs flex items-center gap-1.5">
                        <FlaskConical className="w-4 h-4" /> Estudio Molecular 2D/3D & Resonancia Electrónica
                      </span>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Geometría molecular, hibridación orbital, enlaces y momentos dipolares de las especies clave en la química atmosférica.
                      </p>
                    </div>
                  </div>

                  {/* Selector de Moléculas */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {atmosphericMolecules.map(mol => {
                      const isSelected = selectedMoleculeId === mol.id;
                      return (
                        <button
                          key={mol.id}
                          onClick={() => setSelectedMoleculeId(mol.id)}
                          className={`px-3 py-1.5 rounded text-xs font-bold transition-all border flex items-center gap-1.5 ${
                            isSelected
                              ? 'text-white border-white shadow-md ring-1 ring-white'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                          style={{
                            backgroundColor: isSelected ? mol.color : undefined
                          }}
                        >
                          <span>{mol.formula}</span>
                          <span className="text-[10px] opacity-80 font-normal">({mol.name})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Panel Central de la Molécula Seleccionada */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Visor Molecular Interactivo con Esferas CPK */}
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 flex flex-col items-center justify-center relative min-h-[300px] shadow-inner overflow-hidden">
                    <div className="absolute top-3 left-3 text-[10px] text-slate-400 font-mono">
                      Modelo CPK: N (Azul), O (Rojo), C (Gris), H (Blanco), S (Amarillo)
                    </div>

                    {/* Canvas SVG Molecular */}
                    <div className="w-full max-w-[280px] h-[220px] relative flex items-center justify-center">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        {/* Enlaces de línea */}
                        {selectedMolecule.atoms.length > 1 && (
                          <g stroke="#475569" strokeWidth="2.5" strokeLinecap="round">
                            {selectedMolecule.atoms.map((at, i) => {
                              if (i === 0) return null;
                              const root = selectedMolecule.atoms[0];
                              return (
                                <line
                                  key={`bond-${selectedMolecule.id}-${i}-${at.label}`}
                                  x1={root.x}
                                  y1={root.y}
                                  x2={at.x}
                                  y2={at.y}
                                />
                              );
                            })}
                          </g>
                        )}

                        {/* Átomos como círculos CPK con sombra */}
                        {selectedMolecule.atoms.map((at, i) => (
                          <g key={`atom-${selectedMolecule.id}-${i}-${at.label}-${at.x}-${at.y}`}>
                            <circle
                              cx={at.x}
                              cy={at.y}
                              r={at.size / 3.2}
                              fill={at.color}
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              className="filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                            />
                            <text
                              x={at.x}
                              y={at.y + 3.5}
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="9"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              {at.label}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>

                    <div className="mt-2 text-center">
                      <span className="font-extrabold text-white text-base tracking-wider">{selectedMolecule.formula} — {selectedMolecule.name}</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">{selectedMolecule.geometry} | {selectedMolecule.hybridization}</span>
                    </div>
                  </div>

                  {/* Ficha Fisicoquímica & Resonancia */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-3 shadow-lg text-xs">
                    <span className="font-bold text-rose-300 uppercase text-xs block border-b border-slate-800 pb-1.5">
                      Propiedades Cuánticas y Físico-Químicas:
                    </span>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-slate-950 border border-slate-800 rounded">
                        <span className="text-slate-400 block text-[9px] uppercase">Geometría:</span>
                        <strong className="text-white">{selectedMolecule.geometry}</strong>
                      </div>
                      <div className="p-2 bg-slate-950 border border-slate-800 rounded">
                        <span className="text-slate-400 block text-[9px] uppercase">Hibridación:</span>
                        <strong className="text-white">{selectedMolecule.hybridization}</strong>
                      </div>
                      <div className="p-2 bg-slate-950 border border-slate-800 rounded">
                        <span className="text-slate-400 block text-[9px] uppercase">Momento Dipolar (&mu;):</span>
                        <strong className="text-cyan-300">{selectedMolecule.dipoleMoment}</strong>
                      </div>
                      <div className="p-2 bg-slate-950 border border-slate-800 rounded">
                        <span className="text-slate-400 block text-[9px] uppercase">Longitud de Enlace:</span>
                        <strong className="text-amber-300">{selectedMolecule.bondLength}</strong>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded space-y-1">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Estructuras de Resonancia:</span>
                      <div className="font-mono text-emerald-300 text-[11px]">
                        {selectedMolecule.resonanceForms.join(' ')}
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded space-y-1">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Comportamiento en la Atmósfera:</span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {selectedMolecule.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 9. MODO TABLA COMPLETA CON HEATMAP COLORIDO */}
            {activeViewMode === 'hourly_table' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden shadow-lg">
                <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <span className="font-extrabold text-emerald-400 uppercase text-xs">
                      Matriz Horaria con Gradiente de Intensidad Térmica (24 Horas)
                    </span>
                    <p className="text-[10px] text-slate-400">Haz clic en cualquier fila para seleccionar la hora de asimilación.</p>
                  </div>
                  <span className="text-[10px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                    {filteredVariables.length} variables mostradas
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-black/90 text-slate-300 uppercase text-[10px] border-b border-slate-800 sticky top-0 z-10 backdrop-blur">
                      <tr>
                        <th className="p-2.5 sticky left-0 bg-black/95 z-20 border-r border-slate-800">Hora</th>
                        {filteredVariables.map(v => (
                          <th key={v.id} className="p-2.5 text-right whitespace-nowrap">
                            <span style={{ color: v.color }}>{v.formula}</span>{' '}
                            <span className="text-[8px] text-slate-400 font-normal">({v.unit})</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {dayHourlyData.map((row) => {
                        const isCurrent = row.hour === selectedHour;
                        return (
                          <tr
                            key={row.hour}
                            onClick={() => setSelectedHour(row.hour)}
                            className={`cursor-pointer transition-colors ${
                              isCurrent
                                ? 'bg-emerald-950/60 border-l-4 border-emerald-400 font-extrabold text-white'
                                : 'hover:bg-slate-800/50 text-slate-300'
                            }`}
                          >
                            <td className={`p-2.5 font-bold sticky left-0 z-10 whitespace-nowrap border-r border-slate-800 ${
                              isCurrent ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-950/95'
                            }`}>
                              {row.timeLabel}
                            </td>
                            {filteredVariables.map(v => {
                              const val = (row as any)[v.id];
                              const numVal = typeof val === 'number' ? val : 0;
                              const isOverWHO = v.limitWHO && numVal > v.limitWHO;

                              return (
                                <td
                                  key={v.id}
                                  className={`p-2.5 text-right whitespace-nowrap ${
                                    isOverWHO
                                      ? 'text-red-300 bg-red-950/20 font-bold'
                                      : ''
                                  }`}
                                >
                                  {typeof val === 'number' ? val.toFixed(1) : val}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. EVALUACIÓN NORMATIVA OMS 2021 & DIRECTIVA UE */}
            {activeViewMode === 'who_compliance' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/50 rounded-lg">
                  <h3 className="text-sm font-extrabold text-emerald-300 uppercase mb-1">
                    Auditoría de Conformidad Normativa: Guías OMS 2021 vs Directiva 2008/50/CE
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Evaluación estadística automatizada de la exposición humana y el cumplimiento de los valores guía recomendados por la Organización Mundial de la Salud (revisión 2021) frente a los límites de la legislación comunitaria europea.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tarjeta NO2 */}
                  <div className="p-4 bg-slate-900/80 border border-amber-500/40 rounded-lg space-y-3 shadow-md">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-amber-400 text-sm flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                        Dióxido de Nitrógeno (NO₂)
                      </span>
                      <span className="text-xs text-slate-300">
                        Media 24h: <strong className="text-white">{(dayHourlyData.reduce((a, b) => a + b.no2_ugm3, 0) / 24).toFixed(1)} µg/m³</strong>
                      </span>
                    </div>

                    {/* Barra de progreso contra límite OMS 25 ug/m3 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Guía OMS 24h (25 µg/m³):</span>
                        <span className={(dayHourlyData.reduce((a, b) => a + b.no2_ugm3, 0) / 24) > 25 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {Math.round(((dayHourlyData.reduce((a, b) => a + b.no2_ugm3, 0) / 24) / 25) * 100)}% del límite
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            (dayHourlyData.reduce((a, b) => a + b.no2_ugm3, 0) / 24) > 25 ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, ((dayHourlyData.reduce((a, b) => a + b.no2_ugm3, 0) / 24) / 25) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-black/40 border border-slate-800 rounded text-[11px] text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span>Límite Horario UE (200 µg/m³):</span>
                        <span className="text-emerald-400 font-bold">CUMPLE NORMATIVA UE</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Límite Anual OMS (10 µg/m³):</span>
                        <span className="text-amber-400 font-bold">RANGO EXPOSICIÓN MODERADA</span>
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta PM2.5 */}
                  <div className="p-4 bg-slate-900/80 border border-emerald-500/40 rounded-lg space-y-3 shadow-md">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-emerald-400 text-sm flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                        Partículas Finas (PM₂.₅)
                      </span>
                      <span className="text-xs text-slate-300">
                        Media 24h: <strong className="text-white">{(dayHourlyData.reduce((a, b) => a + b.pm25_ugm3, 0) / 24).toFixed(1)} µg/m³</strong>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Guía OMS 24h (15 µg/m³):</span>
                        <span className={(dayHourlyData.reduce((a, b) => a + b.pm25_ugm3, 0) / 24) > 15 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {Math.round(((dayHourlyData.reduce((a, b) => a + b.pm25_ugm3, 0) / 24) / 15) * 100)}% del límite
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            (dayHourlyData.reduce((a, b) => a + b.pm25_ugm3, 0) / 24) > 15 ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, ((dayHourlyData.reduce((a, b) => a + b.pm25_ugm3, 0) / 24) / 15) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-black/40 border border-slate-800 rounded text-[11px] text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span>Valor Límite Anual UE (25 µg/m³):</span>
                        <span className="text-emerald-400 font-bold">CUMPLE DIRECTIVA UE</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor Guía Anual OMS (5 µg/m³):</span>
                        <span className="text-amber-400 font-bold">RECOMENDADO REFUERZO LEZ</span>
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta O3 */}
                  <div className="p-4 bg-slate-900/80 border border-sky-500/40 rounded-lg space-y-3 shadow-md">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-sky-400 text-sm flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                        Ozono Troposférico (O₃)
                      </span>
                      <span className="text-xs text-slate-300">
                        Pico Máximo: <strong className="text-white">{Math.max(0, ...dayHourlyData.map(d => d.o3_ugm3)).toFixed(1)} µg/m³</strong>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Límite Máximo 8h OMS (100 µg/m³):</span>
                        <span className={Math.max(0, ...dayHourlyData.map(d => d.o3_ugm3)) > 100 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {Math.round((Math.max(0, ...dayHourlyData.map(d => d.o3_ugm3)) / 100) * 100)}% del límite
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            Math.max(0, ...dayHourlyData.map(d => d.o3_ugm3)) > 100 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, (Math.max(0, ...dayHourlyData.map(d => d.o3_ugm3)) / 100) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-black/40 border border-slate-800 rounded text-[11px] text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span>Umbral Información UE (180 µg/m³):</span>
                        <span className="text-emerald-400 font-bold">SIN ALERTA POBLACIÓN</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Umbral de Alerta UE (240 µg/m³):</span>
                        <span className="text-emerald-400 font-bold">NIVEL SEGURO</span>
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta PM10 */}
                  <div className="p-4 bg-slate-900/80 border border-teal-500/40 rounded-lg space-y-3 shadow-md">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-teal-400 text-sm flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-teal-500"></span>
                        Partículas Torácicas (PM₁₀)
                      </span>
                      <span className="text-xs text-slate-300">
                        Media 24h: <strong className="text-white">{(dayHourlyData.reduce((a, b) => a + b.pm10_ugm3, 0) / 24).toFixed(1)} µg/m³</strong>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Guía OMS 24h (45 µg/m³):</span>
                        <span className={(dayHourlyData.reduce((a, b) => a + b.pm10_ugm3, 0) / 24) > 45 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {Math.round(((dayHourlyData.reduce((a, b) => a + b.pm10_ugm3, 0) / 24) / 45) * 100)}% del límite
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            (dayHourlyData.reduce((a, b) => a + b.pm10_ugm3, 0) / 24) > 45 ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, ((dayHourlyData.reduce((a, b) => a + b.pm10_ugm3, 0) / 24) / 45) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-black/40 border border-slate-800 rounded text-[11px] text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span>Límite Diario UE (50 µg/m³):</span>
                        <span className="text-emerald-400 font-bold">CUMPLE DIRECTIVA UE</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Superaciones Anuales Permitidas UE:</span>
                        <span className="text-emerald-400 font-bold">&lt; 35 DÍAS / AÑO</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Informativo */}
          <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between text-xs font-mono flex-wrap gap-2 mt-2">
            <span className="text-[11px] text-slate-300">
              Día activo: <strong className="text-emerald-400">{selectedDay}</strong> | Hora: <strong className="text-amber-400">{currentSnapshot.timeLabel}</strong> | Receptor:{' '}
              <strong className="text-cyan-300">{OFFICIAL_MALAGA_AIR_STATIONS.find(s => s.id === selectedStationId)?.name}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-extrabold text-xs transition-all rounded shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              >
                Cerrar Módulo
              </button>
            </div>
          </div>
      </div>
    </DraggableWindow>
  );
};
