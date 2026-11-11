import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  ShieldAlert, 
  HeartPulse, 
  Download, 
  Layers, 
  Building2, 
  TrendingUp, 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  FileSpreadsheet, 
  Info,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { MeteoData, PhysicsResult } from '../lib/physics';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import Papa from 'papaparse';

export interface DistrictExposureData {
  id: string;
  name: string;
  population: number;
  areaKm2: number;
  densityHabKm2: number;
  baseNO2Ugm3: number;
  humanNO2Ugm3: number;
  inhalationDoseUgDay: number;
  populationAtRiskCount: number;
  complianceWHO2021: boolean;
  complianceEU2008: boolean;
  dominantSource: string;
  lat: number;
  lon: number;
}

import { Icrp66DosimetryModal } from './Icrp66DosimetryModal';
import { SchoolAirEquityModal } from './SchoolAirEquityModal';
import { EnvironmentalJusticeModal } from './EnvironmentalJusticeModal';
import { Scale, Baby, School } from 'lucide-react';

export type HealthExposureTab = 'districts' | 'pediatric_icrp66' | 'schools_equity' | 'environmental_justice';

interface PopulationExposureModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MeteoData;
  result: PhysicsResult | null;
  onFlyTo: (lat: number, lon: number, zoom?: number, pitch?: number) => void;
  initialTab?: HealthExposureTab;
}

export const MALAGA_DISTRICTS_POPULATION: DistrictExposureData[] = [
  {
    id: 'dist-1',
    name: 'Distrito 1: Centro Histórico / El Puerto',
    population: 85200,
    areaKm2: 5.95,
    densityHabKm2: 14319,
    baseNO2Ugm3: 38.5,
    humanNO2Ugm3: 49.2,
    inhalationDoseUgDay: 738,
    populationAtRiskCount: 68160,
    complianceWHO2021: false,
    complianceEU2008: false,
    dominantSource: 'Cañón urbano denso (Larios, Alameda) + Hotelling Portuario',
    lat: 36.7202,
    lon: -4.4203
  },
  {
    id: 'dist-2',
    name: 'Distrito 2: Málaga Este / El Palo / Pedregalejo',
    population: 59300,
    areaKm2: 39.81,
    densityHabKm2: 1489,
    baseNO2Ugm3: 18.2,
    humanNO2Ugm3: 21.5,
    inhalationDoseUgDay: 322,
    populationAtRiskCount: 8895,
    complianceWHO2021: false,
    complianceEU2008: true,
    dominantSource: 'Tráfico litoral (Paseo Marítimo) + Ventilación marina costera',
    lat: 36.7190,
    lon: -4.3680
  },
  {
    id: 'dist-3',
    name: 'Distrito 3: Ciudad Jardín / Las Flores',
    population: 36100,
    areaKm2: 3.79,
    densityHabKm2: 9525,
    baseNO2Ugm3: 29.4,
    humanNO2Ugm3: 34.8,
    inhalationDoseUgDay: 522,
    populationAtRiskCount: 21660,
    complianceWHO2021: false,
    complianceEU2008: true,
    dominantSource: 'Entrada autovía A-45 / Encajonamiento en ladera de Gibralfaro',
    lat: 36.7450,
    lon: -4.4250
  },
  {
    id: 'dist-4',
    name: 'Distrito 4: Bailén - Miraflores / Gamarra',
    population: 60200,
    areaKm2: 3.44,
    densityHabKm2: 17500,
    baseNO2Ugm3: 36.8,
    humanNO2Ugm3: 44.5,
    inhalationDoseUgDay: 667,
    populationAtRiskCount: 51170,
    complianceWHO2021: false,
    complianceEU2008: false,
    dominantSource: 'Alta densidad edificatoria + Tráfico arterias Martínez Maldonado / Eugenio Gross',
    lat: 36.7260,
    lon: -4.4370
  },
  {
    id: 'dist-5',
    name: 'Distrito 5: Palma - Palmilla / 26 de Febrero',
    population: 30800,
    areaKm2: 8.93,
    densityHabKm2: 3449,
    baseNO2Ugm3: 24.5,
    humanNO2Ugm3: 28.2,
    inhalationDoseUgDay: 423,
    populationAtRiskCount: 12320,
    complianceWHO2021: false,
    complianceEU2008: true,
    dominantSource: 'Arteria de acceso Valle del Guadalmedina + Autovía MA-20',
    lat: 36.7420,
    lon: -4.4420
  },
  {
    id: 'dist-6',
    name: 'Distrito 6: Cruz de Humilladero / Paseo de los Tilos',
    population: 86400,
    areaKm2: 7.22,
    densityHabKm2: 11966,
    baseNO2Ugm3: 41.2,
    humanNO2Ugm3: 52.8,
    inhalationDoseUgDay: 792,
    populationAtRiskCount: 77760,
    complianceWHO2021: false,
    complianceEU2008: false,
    dominantSource: 'Nodo crítico de transporte (Estación María Zambrano + Av. Juan XXIII + Estación Carranque)',
    lat: 36.7150,
    lon: -4.4420
  },
  {
    id: 'dist-7',
    name: 'Distrito 7: Carretera de Cádiz / Huelin / La Paz',
    population: 115800,
    areaKm2: 5.62,
    densityHabKm2: 20604,
    baseNO2Ugm3: 42.6,
    humanNO2Ugm3: 54.1,
    inhalationDoseUgDay: 811,
    populationAtRiskCount: 104220,
    complianceWHO2021: false,
    complianceEU2008: false,
    dominantSource: 'Máxima densidad europea + Eje viario MA-21 + Infiltración pluma Aeropuerto AGP',
    lat: 36.7020,
    lon: -4.4480
  },
  {
    id: 'dist-8',
    name: 'Distrito 8: Churriana / Aeropuerto AGP / Guadalmar',
    population: 20400,
    areaKm2: 22.18,
    densityHabKm2: 919,
    baseNO2Ugm3: 35.2,
    humanNO2Ugm3: 46.5,
    inhalationDoseUgDay: 697,
    populationAtRiskCount: 14280,
    complianceWHO2021: false,
    complianceEU2008: false,
    dominantSource: 'Operaciones LTO aeronaves Aeropuerto AGP + Nudos MA-20/MA-21',
    lat: 36.6749,
    lon: -4.4780
  },
  {
    id: 'dist-9',
    name: 'Distrito 9: Campanillas / Málaga TechPark (PTA)',
    population: 19800,
    areaKm2: 64.28,
    densityHabKm2: 307,
    baseNO2Ugm3: 26.5,
    humanNO2Ugm3: 31.2,
    inhalationDoseUgDay: 468,
    populationAtRiskCount: 9900,
    complianceWHO2021: false,
    complianceEU2008: true,
    dominantSource: 'Congestión pendular A-357 (Movilidad TechPark) + Valle interior',
    lat: 36.7380,
    lon: -4.5530
  },
  {
    id: 'dist-10',
    name: 'Distrito 10: Puerto de la Torre / Los Morales',
    population: 31200,
    areaKm2: 44.75,
    densityHabKm2: 697,
    baseNO2Ugm3: 16.5,
    humanNO2Ugm3: 18.9,
    inhalationDoseUgDay: 283,
    populationAtRiskCount: 4680,
    complianceWHO2021: true,
    complianceEU2008: true,
    dominantSource: 'Residencial periurbano + Alta dispersión orográfica',
    lat: 36.7450,
    lon: -4.4920
  },
  {
    id: 'dist-11',
    name: 'Distrito 11: Teatinos - Universidad / Consul',
    population: 41100,
    areaKm2: 12.06,
    densityHabKm2: 3407,
    baseNO2Ugm3: 31.0,
    humanNO2Ugm3: 36.4,
    inhalationDoseUgDay: 546,
    populationAtRiskCount: 24660,
    complianceWHO2021: false,
    complianceEU2008: true,
    dominantSource: 'Corredor universitario (Bulevar Louis Pasteur) + Tráfico Hiperronda A-7',
    lat: 36.7180,
    lon: -4.4760
  }
];

export const PopulationExposureModal: React.FC<PopulationExposureModalProps> = ({
  isOpen,
  onClose,
  data,
  result,
  onFlyTo,
  initialTab = 'districts'
}) => {
  const [activeTab, setActiveTab] = useState<HealthExposureTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [selectedSort, setSelectedSort] = useState<'dose' | 'population' | 'density' | 'no2'>('dose');

  // Ajuste determinista en tiempo real según el NO2 actual simulado/asimilado
  const scaledDistricts = useMemo(() => {
    const scaleFactor = data.no2_satelite_base > 0 ? (data.no2_satelite_base / 32.0) : 1.0;
    
    return MALAGA_DISTRICTS_POPULATION.map(d => {
      const liveHumanNO2 = Number((d.humanNO2Ugm3 * scaleFactor).toFixed(1));
      // Tasa media de inhalación humana en reposo/actividad moderada: 15 m³/día (OMS)
      const dose = Math.round(liveHumanNO2 * 15.0);
      const isWHOCompliant = liveHumanNO2 <= 10.0; // Guía OMS 2021: 10 µg/m³ anual
      const isEUCompliant = liveHumanNO2 <= 40.0;  // Directiva 2008/50/CE: 40 µg/m³ anual

      return {
        ...d,
        humanNO2Ugm3: liveHumanNO2,
        inhalationDoseUgDay: dose,
        complianceWHO2021: isWHOCompliant,
        complianceEU2008: isEUCompliant
      };
    }).sort((a, b) => {
      if (selectedSort === 'dose') return b.inhalationDoseUgDay - a.inhalationDoseUgDay;
      if (selectedSort === 'population') return b.population - a.population;
      if (selectedSort === 'density') return b.densityHabKm2 - a.densityHabKm2;
      return b.humanNO2Ugm3 - a.humanNO2Ugm3;
    });
  }, [data.no2_satelite_base, selectedSort]);

  // Totales metropolitanos
  const totalPopulation = 586300;
  const totalPopulationExposed = useMemo(() => {
    return scaledDistricts
      .filter(d => !d.complianceEU2008)
      .reduce((acc, curr) => acc + curr.population, 0);
  }, [scaledDistricts]);

  const pctExposedEU = Number(((totalPopulationExposed / totalPopulation) * 100).toFixed(1));

  const exportExposureCSV = () => {
    const rows = scaledDistricts.map(d => ({
      distrito: d.name,
      poblacion_padron: d.population,
      superficie_km2: d.areaKm2,
      densidad_hab_km2: d.densityHabKm2,
      no2_cota_respirable_1_8m_ug_m3: d.humanNO2Ugm3,
      dosis_inhalada_ug_dia: d.inhalationDoseUgDay,
      poblacion_afectada_alerta: d.populationAtRiskCount,
      cumple_directiva_2008_50_ce: d.complianceEU2008 ? 'SI' : 'NO',
      cumple_guia_oms_2021: d.complianceWHO2021 ? 'SI' : 'NO',
      foco_emisor_dominante: d.dominantSource,
      coordenadas_lat: d.lat,
      coordenadas_lon: d.lon
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `malaga_distritos_exposicion_no2_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title="EXPOSICIÓN POBLACIONAL Y SALUD PÚBLICA • DISTRITOS DE MÁLAGA"
      icon={<Users className="w-4 h-4 text-rose-400" />}
      subtitle="Evaluación Epidemiológica y Dosis Inhalada de NO₂ por Distrito (Directiva 2008/50/CE & OMS 2021)"
      badge={
        <span className="px-2 py-0.5 text-[9px] font-mono bg-rose-950 border border-rose-600 text-rose-300 font-bold">
          {pctExposedEU}% POBLACIÓN &gt; 40 µg/m³
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[92vw] max-w-5xl max-h-[85vh]"
      headerColorClass="text-rose-400"
      borderColorClass="border-rose-600/80"
      initialPositionClass="top-14 left-1/2 -translate-x-1/2"
      headerExtra={
        <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar matriz completa de exposición poblacional por distrito en formato tabular citable CSV.">
          <button
            onClick={exportExposureCSV}
            className="p-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded border border-rose-700 text-[10px] font-bold flex items-center gap-1 mr-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV FAIR</span>
          </button>
        </ScientificTooltip>
      }
    >
      <div className="p-4 space-y-4 text-xs bg-slate-950 text-slate-200 overflow-y-auto max-h-[calc(85vh-90px)]">
        
        {/* SUB-NAVIGATION TABS */}
        <div className="flex items-center gap-1 border-b border-slate-800 pb-2 text-xs">
          <ScientificTooltip content="Matriz de concentración poblacional ponderada (PWC) y dosis inhalada en los 11 distritos censales de Málaga.">
            <button
              onClick={() => setActiveTab('districts')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'districts'
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-rose-400" />
              <span>1. Exposición Distritos</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip content="Modelo dosimétrico pulmonar ICRP 66: depósito regional extratorácico (ET), traqueobronquial (BB) y alveolar (AI).">
            <button
              onClick={() => setActiveTab('pediatric_icrp66')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'pediatric_icrp66'
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Baby className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. Dosimetría ICRP 66</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip content="Evaluación de aire en perímetros de 200m y 500m de centros educativos y zonas de prioridad peatonal infantil.">
            <button
              onClick={() => setActiveTab('schools_equity')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'schools_equity'
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <School className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Entornos Escolares</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip content="Índice de justicia distributiva de Gini y Atkinson acoplado a vulnerabilidad socioeconómica y ZBE.">
            <button
              onClick={() => setActiveTab('environmental_justice')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'environmental_justice'
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              <span>4. Justicia Ambiental (Gini)</span>
            </button>
          </ScientificTooltip>
        </div>

        {activeTab === 'districts' && (
          <>
            {/* Fila de Tarjetas Resumen Metropolitano */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xs space-y-1">
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>Población Total Censada</span>
              <Users className="w-3 h-3 text-slate-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {totalPopulation.toLocaleString()} <span className="text-xs font-normal text-slate-400">hab.</span>
            </div>
            <div className="text-[9px] text-slate-400 font-mono">11 Distritos Oficiales</div>
          </div>

          <div className="bg-slate-900/90 border border-rose-900/50 p-2.5 rounded-xs space-y-1">
            <div className="text-[10px] text-rose-400 font-mono flex items-center justify-between">
              <span>Población en Superación EU</span>
              <AlertTriangle className="w-3 h-3 text-rose-400" />
            </div>
            <div className="text-xl font-bold font-mono text-rose-400">
              {totalPopulationExposed.toLocaleString()} <span className="text-xs font-normal">hab.</span>
            </div>
            <div className="text-[9px] text-rose-300/80 font-mono">
              {pctExposedEU}% con NO₂ &gt; 40 µg/m³
            </div>
          </div>

          <div className="bg-slate-900/90 border border-amber-900/50 p-2.5 rounded-xs space-y-1">
            <div className="text-[10px] text-amber-400 font-mono flex items-center justify-between">
              <span>Dosis Inhalada Máxima</span>
              <HeartPulse className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-300">
              {Math.max(...scaledDistricts.map(d => d.inhalationDoseUgDay))} <span className="text-xs font-normal text-slate-400">µg/día</span>
            </div>
            <div className="text-[9px] text-slate-400 font-mono">Carretera de Cádiz (15 m³/día)</div>
          </div>

          <div className="bg-slate-900/90 border border-emerald-900/50 p-2.5 rounded-xs space-y-1">
            <div className="text-[10px] text-emerald-400 font-mono flex items-center justify-between">
              <span>Distrito con Mayor Calidad</span>
              <ShieldAlert className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-sm font-bold text-emerald-300 truncate">
              Puerto de la Torre / Este
            </div>
            <div className="text-[9px] text-emerald-400 font-mono">&lt; 22 µg/m³ a 1.8m AGL</div>
          </div>
        </div>

        {/* Gráfico Comparativo de Dosis Inhalada y Concentración */}
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
              <span>PERFIL COMPARATIVO DE EXPOSICIÓN A 1.8m AGL POR DISTRITO</span>
            </h4>

            {/* Selectores de Ordenación */}
            <div className="flex items-center gap-1 font-mono text-[9px]">
              <span className="text-slate-500">Ordenar por:</span>
              <ScientificTooltip content="Ordenar distritos por dosis inhalada total estimada (µg/día) en base a volumen respiratorio ICRP.">
                <button
                  onClick={() => setSelectedSort('dose')}
                  className={`px-1.5 py-0.5 border rounded-xs cursor-pointer ${selectedSort === 'dose' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                >
                  Dosis Inhalada
                </button>
              </ScientificTooltip>
              <ScientificTooltip content="Ordenar distritos por censo poblacional oficial (INE/Padrón Municipal de Málaga).">
                <button
                  onClick={() => setSelectedSort('population')}
                  className={`px-1.5 py-0.5 border rounded-xs cursor-pointer ${selectedSort === 'population' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                >
                  Población
                </button>
              </ScientificTooltip>
              <ScientificTooltip content="Ordenar distritos por densidad demográfica urbana (habitantes/km²).">
                <button
                  onClick={() => setSelectedSort('density')}
                  className={`px-1.5 py-0.5 border rounded-xs cursor-pointer ${selectedSort === 'density' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                >
                  Densidad
                </button>
              </ScientificTooltip>
              <ScientificTooltip content="Ordenar distritos por concentración media estimada de NO₂ a 1.8m AGL.">
                <button
                  onClick={() => setSelectedSort('no2')}
                  className={`px-1.5 py-0.5 border rounded-xs cursor-pointer ${selectedSort === 'no2' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                >
                  NO₂ Cota Calle
                </button>
              </ScientificTooltip>
            </div>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scaledDistricts} margin={{ top: 5, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={8} 
                  angle={-25} 
                  textAnchor="end" 
                  interval={0}
                  tickFormatter={(val) => val.split(':')[0]}
                />
                <YAxis stroke="#64748b" fontSize={9} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', color: '#f8fafc', fontSize: '10px' }}
                  formatter={(val: any, name: any) => {
                    if (name === 'humanNO2Ugm3') return [`${val} µg/m³`, 'NO₂ a 1.8m AGL'];
                    if (name === 'inhalationDoseUgDay') return [`${val} µg/día`, 'Dosis Inhalada Diaria'];
                    return [val, name];
                  }}
                />
                <Bar dataKey="humanNO2Ugm3" name="NO₂ (µg/m³)">
                  {scaledDistricts.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.humanNO2Ugm3 > 40 ? '#f43f5e' : entry.humanNO2Ugm3 > 25 ? '#fbbf24' : '#10b981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla Desglosada por Distritos con Botones de Navegación Georreferenciada */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xs overflow-hidden">
          <div className="p-2.5 bg-slate-950 border-b border-slate-800 font-mono text-[10px] text-slate-300 font-bold flex items-center justify-between">
            <span>DETALLE EPIDEMIOLÓGICO POR DISTRITOS DE MÁLAGA</span>
            <span className="text-[8.5px] text-slate-500 font-normal">Guías OMS 2021 (10 µg/m³) vs. Directiva 2008/50/CE (40 µg/m³)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[9.5px]">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2">Distrito</th>
                  <th className="p-2 text-right">Población</th>
                  <th className="p-2 text-right">Densidad (hab/km²)</th>
                  <th className="p-2 text-right">NO₂ 1.8m (µg/m³)</th>
                  <th className="p-2 text-right">Dosis Inhalada</th>
                  <th className="p-2 text-center">Dir. 2008/50</th>
                  <th className="p-2 text-center">Guía OMS</th>
                  <th className="p-2">Fuente Predominante</th>
                  <th className="p-2 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {scaledDistricts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-2 font-bold text-slate-200">
                      {d.name}
                    </td>
                    <td className="p-2 text-right text-slate-300">
                      {d.population.toLocaleString()}
                    </td>
                    <td className="p-2 text-right text-cyan-300">
                      {d.densityHabKm2.toLocaleString()}
                    </td>
                    <td className="p-2 text-right font-bold">
                      <span className={d.humanNO2Ugm3 > 40 ? 'text-rose-400' : d.humanNO2Ugm3 > 25 ? 'text-amber-300' : 'text-emerald-400'}>
                        {d.humanNO2Ugm3}
                      </span>
                    </td>
                    <td className="p-2 text-right text-amber-300 font-bold">
                      {d.inhalationDoseUgDay} <span className="text-[8px] font-normal text-slate-500">µg/d</span>
                    </td>
                    <td className="p-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        d.complianceEU2008 ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'
                      }`}>
                        {d.complianceEU2008 ? 'CUMPLE' : 'SUPERA'}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        d.complianceWHO2021 ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-red-950 text-red-300 border border-red-800'
                      }`}>
                        {d.complianceWHO2021 ? 'CUMPLE' : 'SUPERA'}
                      </span>
                    </td>
                    <td className="p-2 text-[8.5px] text-slate-400 truncate max-w-[220px]">
                      {d.dominantSource}
                    </td>
                    <td className="p-2 text-center">
                      <ScientificTooltip content={`Navegación cinemática 3D al centroide censal del distrito ${d.name} para inspección microescalar de exposición.`}>
                        <button
                          onClick={() => onFlyTo(d.lat, d.lon, 16.2, 40)}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded text-[8.5px] font-bold transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <MapPin className="w-2.5 h-2.5 text-cyan-400" />
                          <span>Volar</span>
                        </button>
                      </ScientificTooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Nota Metodológica de Salud Pública */}
        <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xs space-y-1 text-[9.5px] text-slate-400">
          <div className="font-bold text-slate-300 font-mono flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fundamentación Metodológica y Epidemiológica (Tesis Doctoral)</span>
          </div>
          <p className="leading-relaxed">
            La dosis inhalada individual se computa de forma determinista como <code className="text-amber-300">Dosis = C_NO2(1.8m) × V_inhalación</code>, donde el volumen de ventilación respiratoria promedio para adultos según la Organización Mundial de la Salud (OMS) se establece en <strong>15 m³/día</strong>. La concentración a 1.8 m AGL incluye la corrección por confinamiento de cañón de Oke (1988) y el factor de visión del cielo (SVF) asimilado de OpenStreetMap.
          </p>
        </div>
        </>
        )}

        {/* TAB 2: DOSIMETRÍA PEDIÁTRICA ICRP 66 */}
        {activeTab === 'pediatric_icrp66' && (
          <div className="space-y-4">
            <Icrp66DosimetryModal isOpen={true} onClose={() => {}} />
          </div>
        )}

        {/* TAB 3: ENTORNOS ESCOLARES DE MÁLAGA */}
        {activeTab === 'schools_equity' && (
          <div className="space-y-4">
            <SchoolAirEquityModal isOpen={true} onClose={() => {}} />
          </div>
        )}

        {/* TAB 4: JUSTICIA AMBIENTAL & CURVAS DE LORENZ */}
        {activeTab === 'environmental_justice' && (
          <div className="space-y-4">
            <EnvironmentalJusticeModal isOpen={true} onClose={() => {}} />
          </div>
        )}

      </div>
    </DraggableWindow>
  );
};
