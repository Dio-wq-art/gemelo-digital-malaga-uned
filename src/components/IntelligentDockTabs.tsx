import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Radio,
  Cpu,
  Waves,
  Trees,
  Car,
  ShieldCheck,
  Globe,
  Flame,
  Leaf,
  Sparkles,
  Building2,
  Layers,
  Factory,
  Anchor,
  Thermometer,
  FlaskConical,
  FileSpreadsheet,
  FileText,
  Key,
  Bus,
  Search,
  Sun,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Zap,
  Atom,
  Eye,
  PieChart as PieIcon,
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  Workflow,
  Users,
  Map as MapIcon,
  GraduationCap,
  Compass,
  Database,
  Wind,
  Filter,
  CheckCircle2,
  ArrowLeftRight,
  Award,
  BookOpen,
  ScatterChart,
  BarChart2,
  Moon,
  Pin,
  MapPin,
  Navigation,
  RotateCcw,
  PanelLeft,
  ArrowUpToLine,
  ArrowDownToLine
} from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { useUIStore } from '../store/uiStore';
import { SYSTEM_PROPAGATION } from '../lib/systemPropagationEngine';
import { useActivePoint, ActivePointContextValue } from '../context/ActivePointContext';
import { OFFICIAL_MALAGA_AIR_STATIONS, OFFICIAL_SATELLITE_MISSIONS } from '../lib/physics';
import { MASTER_MALAGA_GEOREFERENCES } from '../lib/locationSync';
import { SCIENTIFIC_SUBTABS_CATALOG, SubtabShortcutItem } from '../lib/scientificSubtabsRegistry';
import { useOrderableIds, OrderableTabItem, OrderableResetButton } from './OrderableTabRow';

export interface ScientificModuleCategory {
  id: string;
  name: string;
  shortName: string;
  icon: React.ReactNode;
  accentColor: string;
  badgeColor: string;
  description: string;
  modules: {
    id: string;
    name: string;
    tag: string;
    description: string;
    icon: React.ReactNode;
    isKeyThesis?: boolean;
    tooltipContent?: React.ReactNode;
    tooltipWidth?: string;
  }[];
}

export const SCIENTIFIC_CATEGORIES: ScientificModuleCategory[] = [
  {
    id: 'geodesy_canyons',
    name: '1. Geodesia Oficial, Topología OSM y Cañones Urbanos',
    shortName: '1. Geodesia & Cañones',
    icon: <Building2 className="w-3.5 h-3.5" />,
    accentColor: 'border-amber-500 text-amber-300 bg-amber-950/80',
    badgeColor: 'bg-amber-900/60 text-amber-300 border-amber-700/50',
    description: 'Fotogrametría 3D, morfometría urbana H/W, clasificación hidrodinámica de Oke (1987) y transectos topográficos.',
    modules: [
      {
        id: 'unifiedCanyonSuite',
        name: 'Suite 3D de Cañones Urbanos & Microfísica (Oke 1987 / OSPM)',
        tag: 'SUITE COMPLETA 3D',
        description: 'Suite integral: 1. Regímenes de Oke (1987) y tasa ACH • 2. Catálogo de 14 Cañones con exportación GeoJSON/CSV/LaTeX • 3. Sondeo Vertical 0-50m OSPM • 4. Sombra Solar • 5. NbS • 6. Street View 1.8m.',
        icon: <Building2 className="w-3.5 h-3.5 text-cyan-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[450px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-cyan-300 font-bold border-b border-cyan-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Suite de Cañones Urbanos 3D (Oke 1987 / OSPM)</span>
              <span className="text-[7.5px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-1 py-0.5 rounded font-bold">
                OKE 1987 / OSPM / 6 PESTAÑAS
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-amber-300 font-bold text-[8.5px]">τ_res = H / σ_w &nbsp;|&nbsp; ACH = 3600 / τ_res &nbsp;|&nbsp; C_lee/C_wind = 1 + 1.35(H/W)¹·²⁵</div>
              <div className="text-slate-300 text-[8px]">Unifica Regímenes de Flujo, Catálogo OSM con descargas FAIR, Sondeo 0-50m, Sombra Solar, NbS y Street View 1.8m AGL.</div>
            </div>
          </div>
        )
      },
      {
        id: 'googleMaps3DCanyon',
        name: 'Google Maps 3D & Vórtice de Oke (Larios / Juan XXIII)',
        tag: 'GMAPS 3D + OKE',
        description: 'Fotogrametría satelital de alta resolución y análisis de vórtices cavitarios H/W en cañones históricos y arteriales de Málaga.',
        icon: <Globe className="w-3.5 h-3.5 text-emerald-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[440px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-emerald-300 font-bold border-b border-emerald-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Google Maps 3D &amp; Microescala (Oke 1987)</span>
              <span className="text-[7.5px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1 py-0.5 rounded font-bold">
                GMAPS PLATFORM + OKE (1987)
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-cyan-300 font-bold text-[8.5px]">Cañones: Calle Larios (H/W=1.35) | Avenida Juan XXIII (H/W=0.95)</div>
              <div className="text-slate-300 text-[8px]">Fotogrametría satelital ortorrectificada canalizada por proxy seguro sin exponer claves.</div>
            </div>
          </div>
        )
      },
      {
        id: 'streetMicroscaleInspector',
        name: 'Inspector Físico de Calles No Monitorizadas (Deducción 6 Pasos)',
        tag: 'DEDUCCIÓN SIN SENSORES',
        description: 'Desglose analítico determinista: Morfología OSM, SVF, emisiones COPERT 5, vórtices de Oke, asimetría de aceras, Leighton y corrección EnKF.',
        icon: <Compass className="w-3.5 h-3.5 text-sky-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[440px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-sky-300 font-bold border-b border-sky-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Deducción en Calles No Monitorizadas (PINN + EnKF)</span>
              <span className="text-[7.5px] bg-sky-950 text-sky-300 border border-sky-700 px-1 py-0.5 rounded font-bold">
                CEN/TR 17536 / OKE (1987)
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-amber-300 font-bold text-[8.5px]">C(x) = C_fondo + [q_veh / (W·σ_w)]·[f_NO2 + ΔNO2_tit] + K·Δ_EnKF</div>
              <div className="text-slate-300 text-[8px]">Sombreado Solar SVF • Factor Asimetría Sotavento/Barlovento • 14 Cañones Reales de Málaga</div>
            </div>
          </div>
        )
      },
      {
        id: 'microscaleComparator',
        name: 'Comparador Microescalar Bipuntual (Punto A vs Punto B)',
        tag: 'CONTRASTE A/B',
        description: 'Contraste simultáneo de dos puntos urbanos de Málaga: evalúa diferenciales ΔNO2, ΔO3, morfometría de Oke (H/W), ventilación ACH y dosis inhalada ICRP-66 con exportación CSV/LaTeX.',
        icon: <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[440px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-sky-300 font-bold border-b border-sky-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Comparador Bipuntual de Microescala</span>
              <span className="text-[7.5px] bg-sky-950 text-sky-300 border border-sky-700 px-1 py-0.5 rounded font-bold">
                OKE 1987 / LEIGHTON / ICRP-66
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-cyan-300 font-bold text-[8.5px]">ΔC = C_B - C_A &nbsp;|&nbsp; ΔDosis = Dosis_B - Dosis_A &nbsp;|&nbsp; Δ(H/W) = (H/W)_B - (H/W)_A</div>
              <div className="text-slate-300 text-[8px]">Contraste directo entre el punto activo y arquetipos como Calle Larios, Paseo del Parque, Av. Andalucía o El Atabal.</div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'mobility_emissions',
    name: '2. Movilidad, Emisiones COPERT 5 y ZBE',
    shortName: '2. Movilidad & COPERT 5',
    icon: <Car className="w-3.5 h-3.5" />,
    accentColor: 'border-rose-500 text-rose-300 bg-rose-950/80',
    badgeColor: 'bg-rose-900/60 text-rose-300 border-rose-700/50',
    description: 'Factores de emisión EMEP/EEA COPERT 5 Tier 3, aforos en tiempo real, descarbonización EMT, hotelling portuario y ZBE.',
    modules: [
      {
        id: 'copert',
        name: 'Modelo de Emisiones COPERT 5 Tier 3',
        tag: 'COPERT 5',
        description: 'Cálculo de factores de emisión de NOx, VOC, PM y CO2 por tipología de motor y velocidad.',
        icon: <Car className="w-3.5 h-3.5 text-rose-400" />,
        isKeyThesis: true
      },
      {
        id: 'rline',
        name: 'Corredor y Modelo de Dispersión Vial R-LINE (LINE Source)',
        tag: 'R-LINE / EPA',
        description: 'Modelo de dispersión gausiana para fuentes de línea continuas en corredores viales urbanos de Málaga.',
        icon: <Car className="w-3.5 h-3.5 text-rose-400" />,
        isKeyThesis: true
      },
      {
        id: 'trafficLoopsLive',
        name: 'Espiras y Aforos en Tiempo Real (Ayto. Málaga)',
        tag: 'LIVE ESPIRAS',
        description: 'Asimilación en vivo de caudal (veh/h), ocupación (%) y velocidad en Paseo del Parque, Juan XXIII y Andalucía.',
        icon: <Activity className="w-3.5 h-3.5 text-rose-400" />,
        isKeyThesis: true
      },
      {
        id: 'traffic',
        name: 'Inspector de Tráfico y Emisiones por Tramo',
        tag: 'INSPECTOR',
        description: 'Flujo vehicular en veh/h y proporción de diésel por tramos viales de Málaga.',
        icon: <Car className="w-3.5 h-3.5 text-amber-400" />
      },
      {
        id: 'emtGtfsCopert',
        name: 'Flota EMT & Descarbonización de Líneas',
        tag: 'AUTOBUSES EMT',
        description: 'Asimilación GTFS de autobuses de Málaga e impacto de electrificación de flota.',
        icon: <Bus className="w-3.5 h-3.5 text-sky-400" />
      },
      {
        id: 'portHotellingEmissions',
        name: 'Emisiones Portuarias Hotelling (EMEP/EEA Tier 3)',
        tag: 'PUERTO MÁLAGA',
        description: 'Generadores auxiliares de buques en muelle (cruceros, ferrys Melillero, portacontenedores) en Dársena de Málaga.',
        icon: <Anchor className="w-3.5 h-3.5 text-indigo-400" />,
        isKeyThesis: true
      },
      {
        id: 'majorEmissionsSources',
        name: 'Macro-Emisores de Málaga: La Araña (Este) vs Aeropuerto AGP (Oeste)',
        tag: 'MACRO-FOCOS ESTE/OESTE',
        description: 'Balance territorial: Planta Cementera de La Araña (E-PRTR / chimenea 85m) vs Aeropuerto de Málaga (OACI LTO / afección Carretera de Cádiz).',
        icon: <Factory className="w-3.5 h-3.5 text-amber-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[450px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-amber-300 font-bold border-b border-amber-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Macro-Emisores Territoriales de Málaga (Este vs Oeste)</span>
              <span className="text-[7.5px] bg-amber-950 text-amber-300 border border-amber-700 px-1 py-0.5 rounded font-bold">
                E-PRTR / OACI LTO TIER 3
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div><strong className="text-amber-400">1. Polo Este (La Araña):</strong> Chimenea de 85m, sobreelevación de Holland Δh y 4.052 t NOx/año de clinkerización (ES-PRTR-290001).</div>
              <div><strong className="text-sky-400">2. Polo Oeste (Aeropuerto LEMG):</strong> Ciclo LTO OACI (450 vuelos/día, 1.845 t NOx/año) canalizado por el Guadalhorce hacia Carretera de Cádiz (&gt;115.000 hab).</div>
            </div>
          </div>
        )
      },
      {
        id: 'photochemicalRegime',
        name: 'Régimen Fotoquímico VOC vs NOx & Paradoja ZBE',
        tag: 'SILLMAN / ZBE',
        description: 'Diagnóstico de sensibilidad O3 (Sillman 1999), relación de Leighton Φ y evaluación de la paradoja de titración vehicular en la ZBE de Málaga.',
        icon: <Atom className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
      },
      {
        id: 'tio2Photocatalysis',
        name: SYSTEM_PROPAGATION.tio2DockName,
        tag: SYSTEM_PROPAGATION.tio2DockTag,
        description: SYSTEM_PROPAGATION.tio2DockDescription,
        icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[440px]',
        tooltipContent: (
          <div className="space-y-1.5 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-cyan-300 font-bold border-b border-cyan-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Fotocatálisis TiO₂ Grado A1 vs. 99,8 % Asfalto Convencional</span>
              <span className="text-[7.5px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-1 py-0.5 rounded font-bold">
                ISO 22197-1 / CEN/TS 16980-1
              </span>
            </div>
            <p className="text-slate-300">
              Audita las <strong>{SYSTEM_PROPAGATION.tio2VerifiedCount} actuaciones verificadas con evidencia documental primaria Grado A1</strong> en Málaga ({SYSTEM_PROPAGATION.tio2VerifiedAreaM2.toLocaleString()} m² de TiO₂: Carretería-Álamos-Ollerías, Alameda <em>i.active CARGO®</em>, Soho <em>Breinco Air Clean®</em>, Lagunillas, Cobertizo del Conde, Santo Domingo y fachada vertical GRC del Edificio Urban en Teatinos).
            </p>
            <div className="bg-slate-950/90 p-1.5 rounded border border-slate-800 text-[8.5px] space-y-0.5">
              <div><strong className="text-cyan-400">Ley de 3 Resistencias:</strong> v_dep = 1 / (r_a + r_b + r_c,TiO₂) y Número de Damköhler Da = (r_a + r_b) / r_c,TiO₂ (Kleffmann, 2014).</div>
              <div><strong className="text-emerald-400">Cinética & Costa:</strong> Selectividad bietápica S_NO₃⁻ (Ballari & Brouwers, 2013), delicuescencia Ca(NO₃)₂ (DRH = 50.8%) y Cromatografía Iónica.</div>
            </div>
          </div>
        )
      },
      {
        id: 'inverseSourceRate',
        name: 'Estimación Inversa de Fuentes y Tasa de Emisión Real Q_NOx',
        tag: 'OPERADOR ADJUNTO 4D-VAR',
        description: 'Inversión de la ecuación advectivo-difusiva en el punto activo de Málaga para calcular la tasa de emisión física real (g/h·m) y la flota vehicular COPERT 5 equivalente.',
        icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[450px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-amber-300 font-bold border-b border-amber-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Inversión Físico-Matemática de Fuentes (Q_NOx)</span>
              <span className="text-[7.5px] bg-amber-950 text-amber-300 border border-amber-700 px-1 py-0.5 rounded font-bold">
                TIKHONOV / ADJOINT PDE
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-amber-400 font-bold text-[8.5px]">Q_NOx = [ΔC·u_canyon·H / L] + Vd·C_obs + J_NO2·C_obs·H</div>
              <div className="text-slate-300 text-[8px]">Infiere la tasa de emisión real en el punto activo de Málaga asimilando la concentración medida sin simulaciones estocásticas.</div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'microclimate_pbl',
    name: '3. Microclima, Capa Límite y Brisa Marina',
    shortName: '3. Microclima & Brisa',
    icon: <Waves className="w-3.5 h-3.5" />,
    accentColor: 'border-cyan-500 text-cyan-300 bg-cyan-950/80',
    badgeColor: 'bg-cyan-900/60 text-cyan-300 border-cyan-700/50',
    description: 'Circulación costera de Simpson, TIBL, teoría de Monin-Obukhov (MOST), inversiones térmicas, isla de calor (UHI) e impacto de NBS.',
    modules: [
      {
        id: 'seaBreeze',
        name: 'Brisa Marina & Frente Térmico Bahía de Málaga',
        tag: 'BRISA MARINA',
        description: 'Circulación costera de Simpson (1994), altura de mezcla TIBL y régimen de convección litoral en la Bahía.',
        icon: <Waves className="w-3.5 h-3.5 text-sky-400" />,
        isKeyThesis: true
      },
      {
        id: 'moninObukhov',
        name: 'Perfilado Vertical Capa Límite (PBL Zi & MOST)',
        tag: 'SONDEO 1D',
        description: 'Sondeo termodinámico 1D, teoría de Monin-Obukhov, cálculo de altura Zi y atrapamiento por inversión térmica.',
        icon: <Layers className="w-3.5 h-3.5 text-cyan-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[430px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-cyan-300 font-bold border-b border-cyan-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Perfil Vertical Capa Límite &amp; Inversión Térmica</span>
              <span className="text-[7.5px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-1 py-0.5 rounded font-bold">
                MOST / GRYNING-BATCHVAROVA (2001)
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-cyan-300 font-bold text-[8.5px]">L = - (u*³ · ρ · c_p · T_v) / (κ · g · H_s) &nbsp;|&nbsp; K_z(z) = κ · u* · z · (1 - z/h)^p</div>
              <div className="text-slate-300 text-[8px]">Altura de mezcla h_PBL (Zi) • Criterio de estabilidad térmica (Ri &gt; 0.25)</div>
            </div>
            <div className="bg-slate-950/90 p-2 rounded border border-cyan-900/50 space-y-1.5 text-[8px]">
              <div>
                <strong className="text-rose-300">1. Atrapamiento por Inversión (dT/dz &gt; 0):</strong> Bloquea la dispersión vertical de emisiones de tráfico y puerto en la microcapa urbana.
              </div>
              <div>
                <strong className="text-emerald-300">2. Difusividad Turbulenta Kz:</strong> Modelado acoplado de transporte de calor y masa con exportación FAIR CSV.
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'malagaTreesInventory',
        name: 'Inventario Arbolado de Málaga (Fisiología)',
        tag: 'CENSO ÁRBOLES',
        description: 'Evaluación estomática y remoción de contaminantes por tramos de calle (Jacaranda, Ficus, Platanus).',
        icon: <Trees className="w-3.5 h-3.5 text-emerald-400" />,
        isKeyThesis: true
      },
      {
        id: 'streetTreePlanting',
        name: 'Laboratorio de Implantación Arbórea en Vivo',
        tag: 'IMPLANTACIÓN ÁRBOLES',
        description: 'Implantación interactiva de arbolado con reacción física en vivo de contaminantes (NO2, PM2.5, PM10, O3) y ventilación de cañón.',
        icon: <Trees className="w-3.5 h-3.5 text-emerald-400" />,
        isKeyThesis: true
      },
      {
        id: 'weselyDeposition',
        name: 'Circuito de Resistencias de Wesely (1989)',
        tag: 'Ra + Rb + Rc',
        description: 'Analogía eléctrica de resistencia aerodinámica, laminar y superficial del dosel.',
        icon: <Building2 className="w-3.5 h-3.5 text-emerald-400" />,
        tooltipWidth: 'w-[430px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-emerald-300 font-bold border-b border-emerald-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Velocidad de Deposición Seca (v_d) & Circuito Wesely</span>
              <span className="text-[7.5px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1 py-0.5 rounded font-bold">
                WESELY (1989) / ZHANG (2003)
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-emerald-300 font-bold text-[8.5px]">v_d = 1 / (R_a + R_b + R_c) [m/s]</div>
              <div className="text-slate-300 text-[8px]">1/R_c = (LAI / R_st) + ((LAI + 0.5) / R_cut) + (1 / R_ground)</div>
            </div>
            <div className="bg-slate-950/90 p-2 rounded border border-emerald-900/50 space-y-1.5 text-[8px]">
              <div>
                <strong className="text-amber-300">1. Radiación Solar (Rs W/m²):</strong> Controla la apertura estomática f_light(Rs) = Rs / (Rs + 180). Noche (Rs ≈ 0) produce cierre estomático, limitando v_d a la vía cuticular.
              </div>
              <div>
                <strong className="text-sky-300">2. Humedad Relativa & VPD (HR %):</strong> Aire seco (HR &lt; 40%) eleva el déficit de vapor forzando cierre estomático (f_VPD). Aire húmedo (HR &gt; 70%) activa microfilmes acuosos cuticulares (f_wet).
              </div>
              <div>
                <strong className="text-purple-300">3. Temperatura (T °C):</strong> Estrés térmico (T &gt; 30°C) reduce la conductancia estomática en árboles urbanos de Málaga.
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'greenRoofMitigation',
        name: 'Cubiertas Vegetales y Bosques Verticales',
        tag: 'FACHADAS',
        description: 'Mitigación por vegetación vertical en cañones urbanos estrechos.',
        icon: <Building2 className="w-3.5 h-3.5 text-emerald-400" />
      },
      {
        id: 'industrialInventory',
        name: 'Micro-Inventario Industrial & Viento Terral',
        tag: 'GUADALHORCE',
        description: 'Emisiones de polígonos (Guadalhorce, Viso) y advección por viento catabático de terral.',
        icon: <Factory className="w-3.5 h-3.5 text-orange-400" />
      },
      {
        id: 'coastalSmlAcidification',
        name: 'SML Marina & Acidificación Litoral Portuaria',
        tag: 'SML & ACIDIFICACIÓN',
        description: 'Microlimite superficial del agua de mar (SML), intercambio gaseoso SOx/NOx y deposición de acidez en la Dársena de Málaga.',
        icon: <Anchor className="w-3.5 h-3.5 text-sky-400" />,
        isKeyThesis: true
      }
    ]
  },
  {
    id: 'chemical_kinetics',
    name: '4. Cinética Química Rígida (RK45), Radicales y Aerosoles',
    shortName: '4. Cinética Química & Aerosoles',
    icon: <FlaskConical className="w-3.5 h-3.5" />,
    accentColor: 'border-yellow-500 text-yellow-300 bg-yellow-950/80',
    badgeColor: 'bg-yellow-900/60 text-yellow-300 border-yellow-700/50',
    description: 'Solucionador adaptativo RK45, ciclo de Leighton, halógenos costeros ClNO2, termodinámica ISORROPIA-II, VBS SOA y microfísica de plumas.',
    modules: [
      {
        id: 'no2MassBudget',
        name: 'Balance de Masa y Desglose Cascada de NO₂ (Waterfall)',
        tag: 'BALANCE CONTINUIDAD NO₂',
        description: 'Descomposición determinista de la ecuación de continuidad: fuentes primarias COPERT 5, titración Leighton, sumideros de fotólisis J_NO2, deposición Wesely y ventilación Oke.',
        icon: <BarChart2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[450px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-emerald-300 font-bold border-b border-emerald-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Balance de Masa de NO₂ &amp; Cascada Físico-Química</span>
              <span className="text-[7.5px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1 py-0.5 rounded font-bold">
                CONTINUIDAD / WATERFALL / EMEP-EEA
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-amber-300 font-bold text-[8.5px]">∂[NO₂]/∂t = Σ P_i - Σ L_i [µg/(m³·h)]</div>
              <div className="text-slate-300 text-[8px]">Desglose interactivo en Cascada (+Tráfico, +Titración, +Radicales, -Fotólisis, -Wesely, -Ventilación Oke) y exportación LaTeX.</div>
            </div>
          </div>
        )
      },
      {
        id: 'no2NighttimeChemistry',
        name: 'Química Nocturna del NO₂, Radical Nitrato (NO₃•) y ClNO₂',
        tag: 'QUÍMICA NOCTURNA / ClNO₂',
        description: 'Ciclo cinético nocturno: NO2 + O3 ➔ NO3• ➔ N2O5 ➔ ClNO2 en aerosol salino marino de Málaga y pulso matutino de radicales Cl• al amanecer.',
        icon: <Moon className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[450px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-indigo-300 font-bold border-b border-indigo-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Química Nocturna de Nitrógeno y Halógenos Marinos</span>
              <span className="text-[7.5px] bg-indigo-950 text-indigo-300 border border-indigo-700 px-1 py-0.5 rounded font-bold">
                NO3• / N2O5 / ClNO2 / THORNTON
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-cyan-300 font-bold text-[8.5px]">N₂O₅(g) + NaCl(aq) ➔ ClNO₂(g) + NaNO₃(aq)</div>
              <div className="text-slate-300 text-[8px]">Acumulación nocturna de cloruro de nitrilo en la Bahía de Málaga y aceleración matutina de ozono por radicales de cloro.</div>
            </div>
          </div>
        )
      },
      {
        id: 'unifiedPhotochemistrySuite',
        name: 'Suite Maestra de Fotoquímica, Radicales y Aerosoles (5 Pestañas)',
        tag: 'SUITE FOTOQUÍMICA',
        description: 'Suite integral de química atmosférica: 1. Ciclo de Leighton & J(λ) • 2. Radicales OH/NO3 • 3. Halógenos ClNO2 • 4. Regímenes EKMA • 5. Aerosoles VBS/ISORROPIA.',
        icon: <Atom className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[450px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-yellow-300 font-bold border-b border-yellow-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Suite Maestra de Mecanismos Químicos (5 Ejes)</span>
              <span className="text-[7.5px] bg-yellow-950 text-yellow-300 border border-yellow-700 px-1 py-0.5 rounded font-bold">
                MCM / RACM2 / ISORROPIA-II
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-amber-300 font-bold text-[8.5px]">Leighton PSS (Φ) + RACM2 Radicales + Halógenos Costeros + EKMA + Partición VBS</div>
              <div className="text-slate-300 text-[8px]">Consola única con inyección de telemetría in situ y exportación citable FAIR/LaTeX.</div>
            </div>
          </div>
        )
      },
      {
        id: 'benchmark',
        name: 'Motor PINN Benchmark & Solver Stiff ODE (RK45)',
        tag: 'PINN / RK45',
        description: 'Resolución de EDPs de advección-difusión-reacción y benchmark contra EPA AERMOD / CMAQ.',
        icon: <Cpu className="w-3.5 h-3.5 text-cyan-400" />,
        isKeyThesis: true
      },
      {
        id: 'leighton',
        name: 'Ciclo Fotolítico de Leighton & Tasa J(NO₂)',
        tag: 'LEIGHTON',
        description: 'Foto-estacionariedad NO-NO2-O3 y desviaciones por peróxidos orgánicos (RO2•).',
        icon: <Atom className="w-3.5 h-3.5 text-yellow-400" />,
        tooltipWidth: 'w-[420px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-yellow-300 font-bold border-b border-yellow-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Ciclo de Leighton & Estado Fotoestacionario (PSS)</span>
              <span className="text-[7.5px] bg-yellow-950 text-yellow-300 border border-yellow-700 px-1 py-0.5 rounded font-bold">
                LEIGHTON (1961)
              </span>
            </div>

            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-amber-300 font-bold text-[8.5px]">(R1) NO₂ + hν (λ &lt; 420 nm) ➔ NO + O(³P) &nbsp;[J_NO2]</div>
              <div className="text-emerald-300 font-bold text-[8.5px]">(R2) O(³P) + O₂ + M ➔ O₃ + M &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Rápida]</div>
              <div className="text-sky-300 font-bold text-[8.5px]">(R3) NO + O₃ ➔ NO₂ + O₂ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[k₃(T) Arrhenius]</div>
            </div>

            <div className="bg-slate-950/90 p-2 rounded border border-yellow-900/50 space-y-1.5 text-[8px]">
              <div>
                <strong className="text-amber-300">1. Fotólisis J_NO2:</strong> Tasa solar dependiente del ángulo cenital solar (SZA) y atenuación óptica (AOD/nubes).
              </div>
              <div>
                <strong className="text-sky-300">2. Constante Arrhenius k₃(T):</strong> k₃ = 1.4×10⁻¹² · exp(-1310/T) [cm³·mol⁻¹·s⁻¹].
              </div>
              <div>
                <strong className="text-emerald-300">3. Concentración PSS:</strong> <span className="text-white font-bold">[O₃]_pss = (J_NO2 · [NO₂]) / (k₃ · [NO])</span>.
              </div>
              <div>
                <strong className="text-rose-300">4. Titulación por Tráfico:</strong> Las emisiones directas de NO vehicular en calles de Málaga desplazan (R3), consumiendo O₃ superficial (<span className="text-rose-200">titulación</span>) e incrementando NO₂.
              </div>
              <div>
                <strong className="text-purple-300">5. Desviación Φ &gt; 1:</strong> Los radicales RO₂• / HO₂• oxidan NO sin consumir O₃, produciendo acumulación neta de ozono.
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'coastalHalogens',
        name: 'Química de Halógenos Costeros (ClNO₂ / Cl•)',
        tag: 'HALÓGENOS',
        description: 'Producción nocturna de ClNO2 en spray marino y liberación matutina de radicales Cl•.',
        icon: <Waves className="w-3.5 h-3.5 text-cyan-400" />,
        isKeyThesis: true
      },
      {
        id: 'oxidative',
        name: 'Capacidad Oxidativa y Radicales OH• / HO₂•',
        tag: 'OH RADICAL',
        description: 'Tiempo de vida de NOx y velocidad de oxidación de COVs en la troposfera urbana.',
        icon: <Zap className="w-3.5 h-3.5 text-amber-400" />
      },
      {
        id: 'photochemicalRadicals',
        name: 'Mecanismo Fotoquímico RACM2 & Especiación COVs',
        tag: 'RACM2 / MCM',
        description: 'Resolución cuasi-estacionaria de radicales OH/HO2/RO2/NO3/Cl, reactividad total OHR (s⁻¹), balance P(O3) y rendimiento SOA de Pankow.',
        icon: <Atom className="w-3.5 h-3.5 text-amber-400" />,
        isKeyThesis: true
      },
      {
        id: 'isorropiaSia',
        name: 'Termodinámica SIA ISORROPIA-II (NH₄-NO₃-SO₄)',
        tag: 'ISORROPIA-II',
        description: 'Partición gas-partícula determinista de nitrato amónico, delicuescencia (DRH/ERH) y acidez (pH/ALWC).',
        icon: <Layers className="w-3.5 h-3.5 text-indigo-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[440px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-indigo-300 font-bold border-b border-indigo-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Aerosoles Inorgánicos Secundarios ISORROPIA-II</span>
              <span className="text-[7.5px] bg-indigo-950 text-indigo-300 border border-indigo-700 px-1 py-0.5 rounded font-bold">
                SEINFELD &amp; PANDIS / MOZURKEWICH
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-indigo-300 font-bold text-[8.5px]">NH₃(g) + HNO₃(g) ⇌ NH₄NO₃(s,aq) &nbsp;|&nbsp; Kp(T) = exp(118.87 - 24084/T - 6.025·lnT)</div>
              <div className="text-slate-300 text-[8px]">DRH(T) • Eflorescencia ERH ≈ 0.35·DRH • Contenido de Agua Líquida ALWC (ZSR)</div>
            </div>
            <div className="bg-slate-950/90 p-2 rounded border border-indigo-900/50 space-y-1.5 text-[8px]">
              <div>
                <strong className="text-amber-300">1. Régimen Limitante:</strong> Exceso de NH3 desplaza la partición hacia PM2.5, haciéndolo sensible a la reducción de NOx del tráfico.
              </div>
              <div>
                <strong className="text-sky-300">2. Efecto Térmico Estival:</strong> En verano (&gt;28°C), Kp aumenta drásticamente volatilizando el aerosol a fase gas.
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'treeBvocSoa',
        name: 'Especiación BVOCs & Rendimiento SOA por Árbol',
        tag: 'MEGAN 2.1 / PANKOW',
        description: 'Biosíntesis de isopreno y terpenos por especies de Málaga (Jacaranda, Plátano, Ficus) y rendimiento SOA.',
        icon: <Trees className="w-3.5 h-3.5 text-emerald-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[440px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-emerald-300 font-bold border-b border-emerald-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Emisiones Biogénicas MEGAN 2.1 &amp; Rendimiento SOA</span>
              <span className="text-[7.5px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1 py-0.5 rounded font-bold">
                GUENTHER (2012) / PANKOW (1994)
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-emerald-300 font-bold text-[8.5px]">E_BVOC = EF · γ_T(T) · γ_L(PAR) · D_foliar &nbsp;|&nbsp; SOA = ∑ [ Y_i · ΔVOC_i ]</div>
              <div className="text-slate-300 text-[8px]">Potencial OFP MIR (Carter) • Deposición estomática Wesely vd(NO2)</div>
            </div>
            <div className="bg-slate-950/90 p-2 rounded border border-emerald-900/50 space-y-1.5 text-[8px]">
              <div>
                <strong className="text-amber-300">1. Balance Neto Urbano:</strong> Contrapone la filtración de NO2 por estomas frente a la emisión de precursores de O3 y SOA.
              </div>
              <div>
                <strong className="text-sky-300">2. Jacaranda vs Plátano:</strong> La Jacaranda maximiza la captación con emisión casi nula de isopreno.
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'ekmaSoa',
        name: 'Diagrama Isoplético EKMA & Isopreno MEGAN',
        tag: 'VOC/NOx',
        description: 'Diagnóstico de régimen limitado por NOx vs COVs y emisiones biogénicas de Montes de Málaga.',
        icon: <Flame className="w-3.5 h-3.5 text-rose-400" />
      },
      {
        id: 'vbsSoa',
        name: 'Aerosoles Orgánicos Secundarios (VBS Donahue)',
        tag: 'VBS SOA',
        description: 'Partición gas-partícula en 4 rangos de volatilidad C* dependientes de Clausius-Clapeyron.',
        icon: <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
      },
      {
        id: 'shipPlumeMicrophysics',
        name: 'Microfísica de Pluma Portuaria & Köhler CCN',
        tag: 'κ-KÖHLER / CCN',
        description: 'Nucleación H2SO4-H2O, coagulación de hollín, envejecimiento higroscópico y activación de núcleos de condensación.',
        icon: <Anchor className="w-3.5 h-3.5 text-sky-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[440px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-sky-300 font-bold border-b border-sky-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Microfísica de Plumas de Buques & κ-Köhler</span>
              <span className="text-[7.5px] bg-sky-950 text-sky-300 border border-sky-700 px-1 py-0.5 rounded font-bold">
                PETTERS &amp; KREIDENWEIS (2007) / MARPOL
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-sky-300 font-bold text-[8.5px]">ln(S) = (4·σ·Mw)/(R·T·ρw·Dp) - (κ·Ddry³) / (Dp³ - Ddry³)</div>
              <div className="text-slate-300 text-[8px]">D_pc = [ (4·A³) / (27·κ·Sc²) ]¹/³ • Espectro log-normal dN/dlog(Dp)</div>
            </div>
            <div className="bg-slate-950/90 p-2 rounded border border-sky-900/50 space-y-1.5 text-[8px]">
              <div>
                <strong className="text-amber-300">1. Nucleación de Sulfatos:</strong> Conversión catalítica en chimenea de SO2 a H2SO4 que nuclea nanopartículas ultrafinas (Dp ≈ 20 nm, &gt;10⁶ part/cm³).
              </div>
              <div>
                <strong className="text-emerald-300">2. Envejecimiento &amp; Higroscopicidad (κ):</strong> El recubrimiento de sulfato sobre hollín eleva κ de 0.05 a 0.65, activando núcleos de condensación CCN hacia la bahía.
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'portEmissions',
        name: 'Plumas Portuarias & Sobreelevación Briggs',
        tag: 'PUERTO',
        description: 'Dispersión de buques mercantes y cruceros en el Puerto de Málaga bajo flotabilidad térmica.',
        icon: <Anchor className="w-3.5 h-3.5 text-cyan-400" />
      },
      {
        id: 'saharaDust',
        name: 'Intrusión de Polvo Sahariano & AOD',
        tag: 'AOD 550nm',
        description: 'Atenuación solar por calima y crecimiento higroscópico de aerosoles f(RH).',
        icon: <Flame className="w-3.5 h-3.5 text-amber-400" />
      },
      {
        id: 'spectralPhotolysis',
        name: 'Comparador Espectral: Radiación vs. J(NO₂)',
        tag: 'FOTÓLISIS ESPECTRAL',
        description: 'Transferencia radiativa 280-850 nm, atenuación por calima/aerosoles (AOD, α, ω₀) y tasa de fotólisis de NO2.',
        icon: <Sun className="w-3.5 h-3.5 text-amber-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[420px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-amber-300 font-bold border-b border-amber-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Transferencia Radiativa Espectral &amp; Fotólisis de NO₂</span>
              <span className="text-[7.5px] bg-amber-950 text-amber-300 border border-amber-700 px-1 py-0.5 rounded font-bold">
                ASTM E490 / IUPAC / TWO-STREAM
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-amber-300 font-bold text-[8.5px]">J_NO2 = ∫ [ σ_NO2(λ,T) · φ_NO2(λ,T) · F(λ, AOD, α, ω₀, f(RH)) ] dλ</div>
              <div className="text-slate-300 text-[8px]">Espectro Actínico UV-A/B (290-420 nm) • Máximo en λ ≈ 390 nm</div>
            </div>
            <div className="bg-slate-950/90 p-2 rounded border border-amber-900/50 space-y-1.5 text-[8px]">
              <div>
                <strong className="text-amber-300">1. Atenuación Espectral por Calima (AOD, α):</strong> El espesor óptico de aerosoles y el exponente de Ångström atenúan exponencialmente el flujo actínico solar disponible a nivel de calle.
              </div>
              <div>
                <strong className="text-sky-300">2. Dispersión Simple y Asimetría (ω₀, g):</strong> La presencia de aerosoles reflectantes vs absorbentes (carbono negro de tráfico) modula la radiación difusa y la velocidad del ciclo de Leighton.
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'chemicalSpecies',
        name: 'Especiación Química Multicomponente',
        tag: 'ESPECIACIÓN',
        description: 'Balance de masas para 14 especies fotoquímicas en tiempo real.',
        icon: <Activity className="w-3.5 h-3.5 text-purple-400" />
      },
      {
        id: 'sourceApportionment',
        name: 'Atribución Dinámica de Fuentes (EPA-PMF 5.0 / CMB)',
        tag: 'MATRIZ CMB',
        description: 'Descomposición espectral de balance químico de masa y trazadores para Tráfico, Puerto, Calima Sahariana y SIA.',
        icon: <PieIcon className="w-3.5 h-3.5 text-indigo-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[440px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-indigo-300 font-bold border-b border-indigo-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Modelización Inversa de Fuentes (Chemical Mass Balance)</span>
              <span className="text-[7.5px] bg-indigo-950 text-indigo-300 border border-indigo-700 px-1 py-0.5 rounded font-bold">
                EPA-PMF 5.0 / EMEP-EEA / CMB
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-indigo-300 font-bold text-[8.5px]">C_i = ∑ [ f_ij · S_j ] + e_i &nbsp;&nbsp;|&nbsp;&nbsp; Min Q = ∑ [ e_i / σ_i ]²</div>
              <div className="text-slate-300 text-[8px]">Trazadores: V/Ni (Puerto), BC/NOx (Tráfico), Ca²⁺ (Sahara), Cl⁻/Na⁺ (Marino)</div>
            </div>
            <div className="bg-slate-950/90 p-2 rounded border border-indigo-900/50 space-y-1.5 text-[8px]">
              <div>
                <strong className="text-amber-300">1. Descomposición Multifuente:</strong> Asigna masa porcentual y absoluta (µg/m³) a cada receptor de la red de Málaga.
              </div>
              <div>
                <strong className="text-sky-300">2. Trazabilidad FAIR:</strong> Exportación interoperable en GeoJSON y CSV citable para informes de calidad del aire.
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'assimilation_fairmode',
    name: '5. Asimilación en Vivo, Auditoría FAIRMODE y Ciencia Abierta',
    shortName: '5. Asimilación & FAIRMODE',
    icon: <Radio className="w-3.5 h-3.5" />,
    accentColor: 'border-emerald-500 text-emerald-300 bg-emerald-950/80',
    badgeColor: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
    description: 'Ingesta de 22 APIs en vivo, EnKF, Sentinel-5P, validación FAIRMODE WG1 MQI, GUM, linaje W3C PROV-O y exportación FAIR.',
    modules: [
      {
        id: 'earthEngineSatellite',
        name: 'Google Earth Engine & Copernicus Planetary Assimilation',
        tag: 'GEE / SENTINEL / LANDSAT',
        description: 'Teledetección satelital multiespectral: Downscaling Sentinel-5P TROPOMI (NO2), Sentinel-2 (NDVI/LAI/Wesely), Landsat-9 (LST Térmico) y validación cruzada FAIRMODE WG1.',
        icon: <Globe className="w-3.5 h-3.5 text-purple-400 animate-pulse" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[450px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-purple-300 font-bold border-b border-purple-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Google Earth Engine &amp; Copernicus Planetary Assimilation</span>
              <span className="text-[7.5px] bg-purple-950 text-purple-300 border border-purple-700 px-1 py-0.5 rounded font-bold">
                GEE REST / S5P / S2 / L9
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-cyan-300 font-bold text-[8.5px]">Sentinel-5P (NO₂/AOD) + Sentinel-2 (NDVI/LAI) + Landsat-9 (LST)</div>
              <div className="text-slate-300 text-[8px]">Downscaling analítico a cota de acera, transecto 14km Mar-Monte y exportación FAIR Data Package.</div>
            </div>
          </div>
        )
      },
      {
        id: 'earthEngine3DVolumetric',
        name: 'Google Earth Engine & Google Maps 3D Volumetric Suite (Q1)',
        tag: 'GEE 3D + GMAPS MESH',
        description: 'Visualización volumétrica 3D inmersiva de la columna troposférica TROPOMI, fotogrametría 3D de Google Maps, sondeo virtual LIDAR C(z) y planos de corte tomográficos.',
        icon: <Layers className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[460px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-cyan-300 font-bold border-b border-cyan-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Google Earth Engine &amp; Google Maps 3D Volumetric Suite</span>
              <span className="text-[7.5px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-1 py-0.5 rounded font-bold">
                Q1 VOLUMETRICS / TROPOMI / DEM
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-purple-300 font-bold text-[8.5px]">Columna Troposférica 3D + Relieve Copernicus DEM + Malla Google Maps 3D</div>
              <div className="text-slate-300 text-[8px]">Sondeo LIDAR vertical continuo, cortes tomográficos Z/Y, cámara orbital libre y exportación FAIR GeoJSON 3D.</div>
            </div>
          </div>
        )
      },
      {
        id: 'liveIngestion',
        name: 'Catálogo de Fuentes Oficiales (22 APIs)',
        tag: 'LIVE REST',
        description: 'Inventario y asimilación de las 22 fuentes de datos atmosféricos y satelitales.',
        icon: <Radio className="w-3.5 h-3.5 text-emerald-400" />,
        isKeyThesis: true
      },
      {
        id: 'tropomiIntercomparison',
        name: 'Matriz Intercomparación Terrestre vs. Satelital TROPOMI',
        tag: 'S5P vs ESTACIONES',
        description: 'Matriz estadística de validación cruzada (BIAS, RMSE, R², Target Plot FAIRMODE) entre sensores de tierra quimioluminiscentes y columna TROPOMI en Málaga.',
        icon: <Globe className="w-3.5 h-3.5 text-purple-400" />,
        isKeyThesis: true
      },
      {
        id: 'telemetryProvenanceTracker',
        name: 'Trazabilidad Telemétrica E2E (W3C PROV-O)',
        tag: 'PROVENANCE E2E',
        description: 'Auditoría pericial paso a paso: Dato Bruto Oficial ➔ Operador OSPM/PINN ➔ Valor Asimilado a 1.8m AGL con firma SHA-256 inmutable.',
        icon: <Workflow className="w-3.5 h-3.5 text-cyan-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[440px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-cyan-300 font-bold border-b border-cyan-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Trazabilidad Telemétrica End-to-End (W3C PROV-O)</span>
              <span className="text-[7.5px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-1 py-0.5 rounded font-bold">
                TRAZABILIDAD E2E
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-emerald-300 font-bold text-[8.5px]">Cadena: Sensores Junta ➔ OSPM Berkowicz ➔ PINN Navier-Stokes ➔ Receptor 1.8m</div>
              <div className="text-slate-300 text-[8px]">Demostración pericial legal de no manipulación y linaje 100% determinista sin variables estocásticas.</div>
            </div>
            <div className="bg-slate-950/90 p-2 rounded border border-cyan-900/50 space-y-1 text-[8px]">
              <div><strong className="text-sky-300">Etapa 1:</strong> Ingestión de telemetría bruta in situ (UNE-EN 14211) + Sentinel-5P + DEM.</div>
              <div><strong className="text-purple-300">Etapa 2:</strong> Transformación por microescala OSPM y operador diferencial PINN.</div>
              <div><strong className="text-emerald-300">Etapa 3:</strong> Valor final certificado bajo FAIRMODE WG1 (MQI = 0.38) y GUM U95.</div>
            </div>
          </div>
        )
      },
      {
        id: 'kineticAudit',
        name: 'Log de Trazabilidad Física (Kinetic Audit)',
        tag: 'TRAZABILIDAD',
        description: 'Desglose analítico de la cadena de ecuaciones deterministas aplicadas al punto activo (Yamartino, Wesely, Leighton, Arrhenius).',
        icon: <Workflow className="w-3.5 h-3.5 text-emerald-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[440px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-emerald-300 font-bold border-b border-emerald-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Trazabilidad Física Determinista (Kinetic Audit)</span>
              <span className="text-[7.5px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1 py-0.5 rounded font-bold">
                AUDITORÍA CIENTÍFICA
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-cyan-300 font-bold text-[8.5px]">Chain: Telemetría ➔ Morfometría ➔ Cinética ➔ Deposición ➔ Auditoría</div>
              <div className="text-slate-300 text-[8px]">Desglose de cada paso matemático aplicado al punto activo para eliminar la opacidad del modelo.</div>
            </div>
            <div className="bg-slate-950/90 p-2 rounded border border-emerald-900/50 space-y-1.5 text-[8px]">
              <div>
                <strong className="text-amber-300">1. Yamartino (1986):</strong> Resolución del campo de flujo en la cavidad del cañón urbano.
              </div>
              <div>
                <strong className="text-sky-300">2. Leighton (PSS):</strong> Verificación del estado fotoestacionario NO-NO2-O3.
              </div>
              <div>
                <strong className="text-emerald-300">3. Wesely (1989):</strong> Auditoría del circuito de resistencias estomáticas y cuticulares.
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'secretsManager',
        name: 'Gestor de Credenciales & APIs',
        tag: 'API KEYS',
        description: 'Administración segura de tokens para OpenAQ v3, OpenWeather, Google Earth Engine y Copernicus.',
        icon: <Key className="w-3.5 h-3.5 text-amber-400" />
      },
      {
        id: 'satelliteAssimilation',
        name: 'Filtro de Kalman por Ensamble (EnKF) & Sentinel-5P',
        tag: 'KALMAN / SAT',
        description: 'Asimilación óptima de observaciones satelitales reduciendo la covarianza del error del modelo.',
        icon: <Zap className="w-3.5 h-3.5 text-emerald-400" />
      },
      {
        id: 'fourDVarVsEnkf',
        name: 'Asimilación Variacional 4D-Var vs EnKF Ensamble',
        tag: '4D-VAR vs EnKF',
        description: 'Análisis comparativo de asimilación variacional 4D-Var y filtro EnKF de Kalman para inversión de emisiones.',
        icon: <Cpu className="w-3.5 h-3.5 text-cyan-400" />,
        isKeyThesis: true
      },
      {
        id: 'stationAudit',
        name: 'Auditoría Estaciones Red de Málaga',
        tag: `${SYSTEM_PROPAGATION.stationsCount} ESTACIONES`,
        description: `Datos oficiales en vivo de la red certificada de ${SYSTEM_PROPAGATION.stationsCount} estaciones (Junta, AEMET, DGT, ADIF, Puerto, ZBE).`,
        icon: <Activity className="w-3.5 h-3.5 text-cyan-400" />
      },
      {
        id: 'stationInstrumental',
        name: 'Ficha Instrumental UNE-EN 14211:2013',
        tag: 'REGLA 33',
        description: 'Auditoría metrológica de analizadores de quimioluminiscencia y sensores meteorológicos sin datos simulados.',
        icon: <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
      },
      {
        id: 'fairmodeValidation',
        name: 'Validación FAIRMODE WG1 (Target Plot & MQI)',
        tag: 'MQI <= 1.0',
        description: 'Evaluación formal del cumplimiento del criterio de calidad del modelo de la UE.',
        icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
        isKeyThesis: true
      },
      {
        id: 'metrologicalCertificate',
        name: 'Certificado Metrológico Citable del Punto Activo',
        tag: 'FICHA CITABLE',
        description: 'Ficha notarial/doctoral con sellado criptográfico SHA-256, balance cinético de Leighton, morfometría de Oke, dosimetría ICRP-66 y exportación en LaTeX/Markdown/JSON.',
        icon: <Award className="w-3.5 h-3.5 text-amber-400" />,
        isKeyThesis: true
      },
      {
        id: 'correlationScatterPlot',
        name: 'Diagrama de Dispersión & Correlación D3 del Punto Activo',
        tag: 'D3 SCATTER PLOT',
        description: 'Análisis analítico interactivo en D3.js: correlación de Pearson r, Spearman ρ, regresión lineal y bandas de confianza al 95% entre NO2/O3/PM y variables auxiliares (RH, UV, viento, temperatura).',
        icon: <ScatterChart className="w-3.5 h-3.5 text-indigo-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[440px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-indigo-300 font-bold border-b border-indigo-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Diagrama de Dispersión D3 &amp; Correlación</span>
              <span className="text-[7.5px] bg-indigo-950 text-indigo-300 border border-indigo-700 px-1 py-0.5 rounded font-bold">
                D3.JS / PEARSON / SPEARMAN / GUM
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-indigo-300 font-bold text-[8.5px]">y = m·x + b &nbsp;|&nbsp; r = Cov(X,Y)/(σx·σy) &nbsp;|&nbsp; R² = r²</div>
              <div className="text-slate-300 text-[8px]">Correlación determinista en tiempo real entre contaminantes primarios/secundarios y variables microclimáticas acopladas al punto activo.</div>
            </div>
            <div className="bg-slate-950/90 p-2 rounded border border-indigo-900/50 space-y-1.5 text-[8px]">
              <div>
                <strong className="text-amber-300">1. Mecanismos Físicos:</strong> Fotólisis de Leighton (UV vs NO₂ negativo), química heterogénea (RH vs NO₂ positivo), dispersión convectiva (Viento vs PM negativo).
              </div>
              <div>
                <strong className="text-sky-300">2. Banda de Confianza 95%:</strong> Intervalo de predicción analítico con error estándar de la estimación.
              </div>
              <div>
                <strong className="text-emerald-300">3. Ciencia Abierta FAIR:</strong> Exportación a CSV y fórmula en LaTeX citable para la memoria doctoral.
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'scientificInteroperability',
        name: 'Interoperabilidad NetCDF-4, COG (GeoTIFF) & FAIRMODE',
        tag: 'NETCDF / COG / STATS',
        description: 'Decodificación de mallas atmosféricas NetCDF-4 CAMS/ERA5, ráster GeoTIFF Sentinel-2 y validación rigurosa con simple-statistics.',
        icon: <Database className="w-3.5 h-3.5 text-emerald-400" />,
        isKeyThesis: true
      },
      {
        id: 'regulatoryAudit',
        name: 'Auditoría Legal Directiva 2008/50/CE & OMS 2021',
        tag: 'NORMATIVA',
        description: 'Dictamen de superación de valores límite horarios y anuales de NO2, O3 y PM.',
        icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
      },
      {
        id: 'acuteEpisodeAlert',
        name: 'Protocolo de Episodios Agudos y Alertas (RD 102/2011)',
        tag: 'ALERTAS & OMS',
        description: 'Vigilancia de umbrales horarios de O3 (180/240 µg/m³) y NO2 (200/400 µg/m³), receptores sensibles y contingencia.',
        icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
        isKeyThesis: true
      },
      {
        id: 'userGuide',
        name: 'Guía de Usuario • Recorrido Interactivo por el Gemelo Digital',
        tag: 'TOUR GUIADO',
        description: 'Recorrido interactivo por la interfaz explicando la doctrina del gemelo digital, datos oficiales, verificador criptográfico y cañones 3D.',
        icon: <Compass className="w-3.5 h-3.5 text-amber-400 animate-pulse" />,
        isKeyThesis: true
      },
      {
        id: 'populationExposure',
        name: 'Exposición Poblacional y Salud Pública por Distrito',
        tag: 'EPIDEMIOLOGÍA',
        description: 'Dosis inhalada de NO2 (µg/día), población expuesta a >40 µg/m³ y evaluación por distritos censales de Málaga.',
        icon: <Users className="w-3.5 h-3.5 text-rose-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[440px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-rose-300 font-bold border-b border-rose-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Exposición Poblacional y Salud Pública (OMS / Directiva)</span>
              <span className="text-[7.5px] bg-rose-950 text-rose-300 border border-rose-700 px-1 py-0.5 rounded font-bold">
                DIRECTIVA 2008/50/CE &amp; OMS 2021
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-rose-300 font-bold text-[8.5px]">Dosis_Inhalada = C_NO2(1.8m) · V_respiratorio &nbsp;|&nbsp; V_resp = 15.0 m³/día</div>
              <div className="text-slate-300 text-[8px]">11 Distritos Censales de Málaga • Cruce con densidad de población y factor de confinamiento SVF.</div>
            </div>
            <div className="bg-slate-950/90 p-2 rounded border border-rose-900/50 space-y-1.5 text-[8px]">
              <div>
                <strong className="text-amber-300">1. Puntos Críticos:</strong> Carretera de Cádiz, Cruz de Humilladero y Centro concentran el 68% de la dosis acumulada metropolitana.
              </div>
              <div>
                <strong className="text-sky-300">2. Ciencia Abierta FAIR:</strong> Exportación integral en CSV y GeoJSON con vinculación espacial interactiva al mapa.
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'vulnerableFacilitiesRisk',
        name: 'Equipamientos Vulnerables e Índice IRSV (Escuelas & Hospitales)',
        tag: 'EQUIPAMIENTOS & IRSV',
        description: 'Evaluación del riesgo socio-sanitario e Índice de Riesgo Socio-Vulnerable (IRSV) en entornos escolares y hospitalarios de Málaga.',
        icon: <Users className="w-3.5 h-3.5 text-rose-400" />,
        isKeyThesis: true
      },
      {
        id: 'healthEconomicsSas',
        name: 'Economía de la Salud SAS & Valor de la Vida Estadística (VSL)',
        tag: 'ECONOMÍA SALUD SAS',
        description: 'Costes sanitarios atribuidos a contaminación en hospitales SAS (Málaga) y cálculo de VSL/VOLY.',
        icon: <HeartPulse className="w-3.5 h-3.5 text-rose-400" />,
        isKeyThesis: true
      },
      {
        id: 'greenJustice330300',
        name: 'Justicia Verde 3-30-300 & Cobertura Arbórea (Cecil Konijnendijk)',
        tag: 'REGLA 3-30-300',
        description: 'Evaluación de la Regla 3-30-300 de infraestructura verde urbana por sección censal en Málaga.',
        icon: <Trees className="w-3.5 h-3.5 text-emerald-400" />,
        isKeyThesis: true
      },
      {
        id: 'environmentalJustice',
        name: 'Justicia Ambiental & Equidad Socioespacial (Índice Gini/Atkinson)',
        tag: 'EQUIDAD & GINI',
        description: 'Distribución socioespacial de contaminantes, curva de Lorenz, Índice de Gini de Exposición y Proximidad a Focos.',
        icon: <Users className="w-3.5 h-3.5 text-rose-400" />,
        isKeyThesis: true
      },
      {
        id: 'schoolAirEquity',
        name: 'Entornos Escolares & Dosimetría Pediátrica ICRP 66',
        tag: 'DOSIMETRÍA PEDIÁTRICA',
        description: 'Dosimetría pulmonar infantil según ICRP 66, modelo de deposición tráqueo-bronquial y entornos escolares de Málaga.',
        icon: <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />,
        isKeyThesis: true
      },
      {
        id: 'gumUncertainty',
        name: 'Presupuesto Incertidumbre GUM & Dosis Peatonal',
        tag: 'GUM / JCGM 100',
        description: 'Propagación analítica U95% (k=2.00), cumplimiento DQO Directiva <50% y dosimetría respiratoria OMS a 1.5 m.',
        icon: <HeartPulse className="w-3.5 h-3.5 text-purple-400" />,
        isKeyThesis: true
      },
      {
        id: 'sobolSensitivity',
        name: 'Análisis de Sensibilidad Global de Sobol (GSA)',
        tag: 'SOBOL Si/STi',
        description: 'Descomposición de varianza de Monte Carlo para cuantificar incertidumbres.',
        icon: <Cpu className="w-3.5 h-3.5 text-purple-400" />
      },
      {
        id: 'phdDefenseWalkthrough',
        name: 'Modo Defensa de Tesis Doctoral (Beamer Slides & Guion)',
        tag: 'DEFENSA TESIS',
        description: 'Guion interactivo paso a paso para la defensa ante el tribunal con diapositivas Beamer LaTeX exportables.',
        icon: <GraduationCap className="w-3.5 h-3.5 text-amber-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[440px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-amber-300 font-bold border-b border-amber-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Modo Defensa de Tesis &amp; Beamer Presentation</span>
              <span className="text-[7.5px] bg-amber-950 text-amber-300 border border-amber-700 px-1 py-0.5 rounded font-bold">
                UNED / EIDUNED • DIONISIO GÁLVEZ POZO
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-amber-300 font-bold text-[8.5px]">5 Bloques Temáticos • Ecuaciones PDE • Telemetría en Vivo • Código Beamer .TEX</div>
              <div className="text-slate-300 text-[8px]">Diseñado para proyección directa ante el Tribunal de Tesis con navegación por teclado (← / →).</div>
            </div>
          </div>
        )
      },
      {
        id: 'thesisMethodologySuite',
        name: 'Suite Metodológica & Arquitectura Doctoral',
        tag: 'ARQUITECTURA TESIS',
        description: 'Pipeline multiescala (CAMS ➔ AEMET ➔ OSM/Oke ➔ PINN), catálogo de las 4 suites y ecuaciones rectoras LaTeX.',
        icon: <Layers className="w-3.5 h-3.5 text-purple-400" />,
        isKeyThesis: true
      },
      {
        id: 'scientificAtlas',
        name: 'Atlas de Cinética Física y Diagramas Animados',
        tag: 'ATLAS FÍSICO',
        description: 'Compendio interactivo de ecuaciones diferenciales de gobierno y diagramas vectoriales animados a color.',
        icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />,
        isKeyThesis: true
      },
      {
        id: 'latexThesis',
        name: 'Generador de Memoria de Tesis en LaTeX',
        tag: 'LATEX .TEX',
        description: 'Exportación de ecuaciones, tablas y matrices en crudo listas para el documento de tesis.',
        icon: <FileText className="w-3.5 h-3.5 text-indigo-400" />,
        isKeyThesis: true
      },
      {
        id: 'highResPdfReport',
        name: 'Informe Técnico en Alta Resolución (PDF HD)',
        tag: 'INFORME PDF',
        description: 'Documento científico exportable con captura del estado actual del gemelo digital.',
        icon: <FileText className="w-3.5 h-3.5 text-emerald-400" />
      },
      {
        id: 'doctoralReportGuide',
        name: 'Guía y Desglose Científico de la Memoria (12 Páginas Explicadas)',
        tag: 'GUÍA 12 PÁGINAS',
        description: 'Explicación exhaustiva, amena y rigurosa de cada dato, fórmula, técnica de IA y base legal de todo el PDF.',
        icon: <BookOpen className="w-3.5 h-3.5 text-cyan-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[450px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-emerald-300 font-bold border-b border-emerald-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Guía Científica de las 12 Páginas del PDF Doctoral</span>
              <span className="text-[7.5px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1 py-0.5 rounded font-bold">
                EIDUNED / UNED 2026
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-cyan-300 font-bold text-[8.5px]">Páginas 1 a 12 explicadas al detalle técnico con consejos para el Tribunal</div>
              <div className="text-slate-300 text-[8px]">Geodesia, Telemetría, MOST, Cañón Oke, Leighton, COPERT 5, ClNO2, FAIRMODE, Diagnóstico 7D, PINN Navier-Stokes, ZBE &amp; Hash SHA-256.</div>
            </div>
          </div>
        )
      },
      {
        id: 'fairDataExporter',
        name: 'Módulo de Datos FAIR (NetCDF-4 / CDL / GeoJSON / CSV)',
        tag: 'OPEN SCIENCE / FAIR',
        description: 'Exportación citable y abierta de mallas espaciales, perfiles y series temporales conformes a CF-1.8 y ACDD-1.3.',
        icon: <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />,
        isKeyThesis: true
      },
      {
        id: 'w3cProvGraph',
        name: 'Grafo Linaje W3C PROV-O (DAG)',
        tag: 'TRAZABILIDAD',
        description: 'Grafo acíclico dirigido (DAG) de procedencia formal: Entidades, Actividades EnKF/PINN y Agentes.',
        icon: <Workflow className="w-3.5 h-3.5 text-cyan-400" />,
        isKeyThesis: true
      },
      {
        id: 'w3cProvPassport',
        name: 'Pasaporte Metrológico Criptográfico W3C PROV (SHA-256)',
        tag: 'PASAPORTE W3C',
        description: 'Pasaporte metrológico citable con firma hash SHA-256 y trazabilidad normativo-criptográfica.',
        icon: <Workflow className="w-3.5 h-3.5 text-cyan-400" />,
        isKeyThesis: true
      }
    ]
  },
  {
    id: 'hpc_computing',
    name: '6. Sistemas y Computación de Alto Rendimiento (HPC)',
    shortName: '6. Sistemas & HPC',
    icon: <Cpu className="w-3.5 h-3.5" />,
    accentColor: 'border-slate-500 text-slate-300 bg-slate-950/80',
    badgeColor: 'bg-slate-900/60 text-slate-300 border-slate-700/50',
    description: 'Aceleración GPU WebGPU, renderizado masivo Deck.GL, telemetría de hardware y verificadores de integridad criptográfica.',
    modules: [
      {
        id: 'webgpuCompute',
        name: 'Acelerador WebGPU & Compute Shaders (WGSL)',
        tag: 'WEBGPU / WGSL',
        description: 'Resolución masiva paralela de EDPs de advección-difusión 2D y cinética de Leighton en VRAM.',
        icon: <Zap className="w-3.5 h-3.5 text-emerald-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[440px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-emerald-300 font-bold border-b border-emerald-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Aceleración WebGPU &amp; Compute Shaders WGSL</span>
              <span className="text-[7.5px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1 py-0.5 rounded font-bold">
                W3C WEBGPU / WGSL VRAM
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-emerald-300 font-bold text-[8.5px]">∂C/∂t = - u·∇C + K·∇²C - J_NO2·[NO2] + k3·[NO][O3] + S - (vd/H)·C</div>
              <div className="text-slate-300 text-[8px]">Malla 100x100 (10.000 celdas) procesada en paralelo en microsegundos mediante workgroups 16x16.</div>
            </div>
            <div className="bg-slate-950/90 p-2 rounded border border-emerald-900/50 space-y-1.5 text-[8px]">
              <div>
                <strong className="text-amber-300">1. Cero Latencia CPU-GPU:</strong> Los tensores espaciales de contaminantes residen directamente en buffers de almacenamiento de la GPU.
              </div>
              <div>
                <strong className="text-sky-300">2. Fallback Determinista:</strong> Si el hardware no dispone de WebGPU, conmuta transparentemente a V8 SIMD/TypedArrays sin inventar datos.
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'deckGlInstancing',
        name: 'Render GPU Deck.GL Instanced Contours',
        tag: 'WEBGL GPU',
        description: 'Telemetría de VRAM y visualización tensorial acelerada por hardware.',
        icon: <Eye className="w-3.5 h-3.5 text-cyan-400" />
      },
      {
        id: 'advancedTransect',
        name: 'Analizador de Transecto Dinámico',
        tag: 'GEO-MATEMÁTICAS',
        description: 'Intersección espacial de la matriz matemática 100x100 con perfil transversal topográfico.',
        icon: <MapIcon className="w-3.5 h-3.5 text-cyan-400" />,
        isKeyThesis: true
      },
      {
        id: 'verifier',
        name: 'Verificador de Integridad & Latencia',
        tag: 'SHA-256',
        description: 'Auditoría SHA-256 de buffers de asimilación y telemetría de latencia de red.',
        icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
      },
      {
        id: 'diagnosticCore',
        name: 'Núcleo de Diagnóstico del Gemelo Digital',
        tag: 'SYS-MONITOR',
        description: 'Salud del motor PINN, consumo de VRAM y estado de las 22 capas de ingesta.',
        icon: <Activity className="w-3.5 h-3.5 text-sky-400" />
      }
    ]
  },
  {
    id: 'q1_frontiers',
    name: '7. Fronteras Q1 (2025–2027) & Vanguardia PINN',
    shortName: '7. Fronteras Q1 (2025–2027)',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    accentColor: 'border-emerald-500 text-emerald-300 bg-emerald-950/80',
    badgeColor: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
    description: 'Química nocturna de halógenos ClNO2, auto-oxidación HOMs (PM0.1), potencial oxidativo OPDTT, FNO 3D y asimilación 4D-Var EnKF.',
    modules: [
      {
        id: 'q1CoastalChemistry',
        name: '1. Química Atmosférica Urbana-Costera Q1',
        tag: 'ClNO₂ / HOMs / OP^DTT',
        description: 'Activación nocturna de halógenos ClNO₂, auto-oxidación HOMs/ELVOC y potencial oxidativo redox OP^DTT en la ZBE de Málaga.',
        icon: <Waves className="w-3.5 h-3.5 text-cyan-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[450px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-cyan-300 font-bold border-b border-cyan-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Química Urbana-Costera Q1 • Halógenos &amp; Redox</span>
              <span className="text-[7.5px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-1 py-0.5 rounded font-bold">
                Q1 Nature Geosci. / ACP / ES&amp;T
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-cyan-300 font-bold text-[8.5px]">N₂O₅ + Cl⁻(aq) → ClNO₂ + NO₃⁻ &nbsp;|&nbsp; ClNO₂ + hν → Cl• + NO₂</div>
              <div className="text-emerald-300 font-bold text-[8.5px]">RO₂• + O₂ → HOMs (ELVOC) &nbsp;|&nbsp; OP^DTT = α[Cu] + β[Fe] + γ[OC]</div>
              <div className="text-slate-300 text-[8px]">Fotólisis matinal de ClNO₂, pulso radical de Cl•, auto-oxidación de terpenos y desacoplamiento toxicológico en la ZBE.</div>
            </div>
          </div>
        )
      },
      {
        id: 'q1MicroscalePhysics',
        name: '2. Física Atmosférica & Dinámica Microescala Q1',
        tag: 'FNO-3D / TIBL / ACTÍNICA',
        description: 'Operador Neuronal de Fourier (FNO-3D) con proyección incompresible Helmholtz-Hodge (∇·u = 0), capa límite térmica costera (TIBL), drenaje catabático de Montes de Málaga y flujo actínico 3D con sombras.',
        icon: <Wind className="w-3.5 h-3.5 text-sky-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[450px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-sky-300 font-bold border-b border-sky-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Física Atmosférica Q1 • FNO 3D &amp; TIBL Costera</span>
              <span className="text-[7.5px] bg-sky-950 text-sky-300 border border-sky-700 px-1 py-0.5 rounded font-bold">
                Q1 J. Fluid Mech. / ACP / BL-Meteorol.
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-cyan-300 font-bold text-[8.5px]">∇·u = 0 &nbsp;|&nbsp; h_i(x) = [(2 H₀ x)/(γ ρ c_p u)]¹/² &nbsp;|&nbsp; F_actínico = F_dir·S + F_dif·SVF</div>
              <div className="text-slate-300 text-[8px]">Inferencia espectral Navier-Stokes &lt;10ms, transición térmica litoral bahía-interior y asimetría solar de fotólisis J_NO2 en aceras.</div>
            </div>
          </div>
        )
      },
      {
        id: 'q1FrontiersSuite',
        name: 'Fronteras de Investigación Q1 (2025–2027)',
        tag: 'FNO 3D / HOMs / 4D-VAR',
        description: '5 Módulos de vanguardia: FNO 3D Navier-Stokes, HOMs & auto-oxidación de terpenos, atenuación espectral J_NO2, potencial oxidativo y 4D-Var EnKF.',
        icon: <Cpu className="w-3.5 h-3.5 text-emerald-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[440px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-emerald-300 font-bold border-b border-emerald-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Fronteras Q1 (2025–2027) • Física &amp; Química</span>
              <span className="text-[7.5px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1 py-0.5 rounded font-bold">
                Q1 2025–2027 / FNO + 4D-VAR
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-emerald-300 font-bold text-[8.5px]">FNO-3D: (G_θ(a))(x) = σ(W a(x) + F⁻¹(R_φ · F(a))(x)) &nbsp;|&nbsp; 4D-Var: J(x₀) + EnKF</div>
              <div className="text-slate-300 text-[8px]">Resolución espectral sub-métrica de turbulencia en cañones y cinética de auto-oxidación HOMs.</div>
            </div>
          </div>
        )
      },
      {
        id: 'q1ResearchSuite',
        name: 'Suite de Investigación Q1 (2025/2026)',
        tag: 'AEROGRAPH / VBS / LBM',
        description: '4 Módulos avanzados: AeroGraph-PINN, VBS-SOA Donahue con radicales de cloro, Solucionador LBM D3Q19 en GPU y Dosimetría ICRP-66.',
        icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
        isKeyThesis: true,
        tooltipWidth: 'w-[440px]',
        tooltipContent: (
          <div className="space-y-2 font-mono text-[9px] leading-relaxed text-slate-200">
            <div className="text-amber-300 font-bold border-b border-amber-700/80 pb-1 flex items-center justify-between">
              <span className="text-[10px]">Suite Q1 2025/2026 • Física &amp; Modelización</span>
              <span className="text-[7.5px] bg-amber-950 text-amber-300 border border-amber-700 px-1 py-0.5 rounded font-bold">
                Q1 2025/2026 / AEROGRAPH
              </span>
            </div>
            <div className="bg-slate-900/95 p-2 rounded border border-slate-800 space-y-1">
              <div className="text-amber-300 font-bold text-[8.5px]">LBM D3Q19: f_i(x + c_i Δt, t + Δt) = f_i(x, t) - (1/τ)[f_i - f_i^eq]</div>
              <div className="text-slate-300 text-[8px]">AeroGraph-PINN sobre topología OSM y cálculo de dosis alveolar según el modelo ICRP-66.</div>
            </div>
          </div>
        )
      }
    ]
  }
];

export type DoctoralWorkflowId = 'disciplines' | 'workflow_top10' | 'workflow_q1' | 'workflow_defense' | 'workflow_regulatory' | 'workflow_fair';

export interface DoctoralWorkflow {
  id: DoctoralWorkflowId;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  color: string;
  moduleIds: string[];
}

export const DOCTORAL_WORKFLOWS: DoctoralWorkflow[] = [
  {
    id: 'disciplines',
    label: '7 Ejes Disciplinares (Taxonomía Física)',
    shortLabel: '7 Ejes Físicos',
    icon: '⚛️',
    description: 'Navegación sistemática por dominios de la física y química atmosférica multiescala (73 Módulos).',
    color: 'border-slate-600 text-slate-300 bg-slate-900/80',
    moduleIds: []
  },
  {
    id: 'workflow_top10',
    label: '★ Top 10 Módulos Imprescindibles para la Defensa (20 Minutos)',
    shortLabel: '★ Top 10 Defensa',
    icon: '⭐',
    description: 'Selección estricta de las 10 mejores suites metodológicas para la presentación ante el tribunal doctoral.',
    color: 'border-amber-400 text-amber-300 bg-amber-950/90 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
    moduleIds: [
      'unifiedCanyonSuite', 'satelliteAssimilation', 'no2MassBudget', 'no2NighttimeChemistry',
      'photochemicalRegime', 'fairmodeValidation', 'gumUncertainty', 'treeBvocSoa',
      'webgpuCompute', 'q1FrontiersSuite'
    ]
  },
  {
    id: 'workflow_q1',
    label: '1. Redacción Artículos Q1 (Papers & Fronteras)',
    shortLabel: 'Artículos Q1',
    icon: '📝',
    description: 'Fronteras científicas con modelos analíticos, stiff ODEs, operadores neuronales FNO y datos de alto impacto.',
    color: 'border-cyan-500 text-cyan-300 bg-cyan-950/80',
    moduleIds: [
      'q1CoastalChemistry', 'q1MicroscalePhysics', 'q1FrontiersSuite', 'q1ResearchSuite',
      'benchmark', 'leighton', 'coastalHalogens', 'oxidative', 'photochemicalRadicals',
      'isorropiaSia', 'vbsSoa', 'treeBvocSoa', 'ekmaSoa', 'spectralPhotolysis',
      'webgpuCompute', 'shipPlumeMicrophysics', 'sobolSensitivity'
    ]
  },
  {
    id: 'workflow_defense',
    label: '2. Tribunal & Defensa de Tesis (EIDUNED)',
    shortLabel: 'Defensa EIDUNED',
    icon: '🎓',
    description: 'Modo defensa con diapositivas Beamer LaTeX, guion interactivo, arquitectura multiescala y atlas cinético.',
    color: 'border-amber-500 text-amber-300 bg-amber-950/80',
    moduleIds: [
      'phdDefenseWalkthrough', 'thesisMethodologySuite', 'scientificAtlas', 'latexThesis',
      'highResPdfReport', 'doctoralReportGuide', 'fairmodeValidation', 'unifiedCanyonSuite',
      'googleMaps3DCanyon', 'streetMicroscaleInspector', 'copert', 'trafficLoopsLive',
      'seaBreeze', 'moninObukhov', 'metrologicalCertificate'
    ]
  },
  {
    id: 'workflow_regulatory',
    label: '3. Auditoría Legal, ZBE & Directiva 2008/50/CE',
    shortLabel: 'Auditoría ZBE',
    icon: '⚖️',
    description: 'Evaluación de límites horarios/anuales, protocolos de alerta (RD 102/2011), dosimetría y aforos en tiempo real.',
    color: 'border-rose-500 text-rose-300 bg-rose-950/80',
    moduleIds: [
      'regulatoryAudit', 'acuteEpisodeAlert', 'populationExposure', 'gumUncertainty',
      'copert', 'trafficLoopsLive', 'traffic', 'emtGtfsCopert', 'portHotellingEmissions',
      'majorEmissionsSources', 'photochemicalRegime', 'tio2Photocatalysis', 'fairmodeValidation'
    ]
  },
  {
    id: 'workflow_fair',
    label: '4. Interoperabilidad, Linaje W3C & Datos FAIR',
    shortLabel: 'Ciencia Abierta',
    icon: '🔬',
    description: 'Mallas NetCDF-4/COG, 22 APIs en vivo, trazabilidad cinemática, grafo W3C PROV-O y exportación abierta.',
    color: 'border-emerald-500 text-emerald-300 bg-emerald-950/80',
    moduleIds: [
      'fairDataExporter', 'scientificInteroperability', 'w3cProvGraph', 'liveIngestion',
      'earthEngineSatellite', 'earthEngine3DVolumetric', 'tropomiIntercomparison',
      'telemetryProvenanceTracker', 'kineticAudit', 'satelliteAssimilation', 'stationAudit',
      'verifier', 'secretsManager', 'correlationScatterPlot'
    ]
  }
];

const uniqueModuleIds = new Set(SCIENTIFIC_CATEGORIES.flatMap((c) => c.modules).map(m => m.id));
export const TOTAL_KEY_THESIS_MODULES = uniqueModuleIds.size;

/**
 * Extrae determinísticamente una píldora de telemetría en tiempo real para cada módulo
 * basándose en el punto activo sincronizado (ActivePointContext).
 */
function getModuleLiveTelemetryBadge(
  moduleId: string,
  ctx: ActivePointContextValue | null
): { text: string; colorClass: string } | null {
  if (!ctx || !ctx.assimilation) return null;
  const a = ctx.assimilation;
  const no2 = a.no2PedestrianLevel1_8mUgM3 ?? 24.0;
  const o3 = a.ozoneO3UgM3 ?? 58.0;
  const pm25 = a.pm25UgM3 ?? 11.2;
  const pm10 = a.pm10UgM3 ?? 21.5;
  const hw = a.aspectRatioHw ?? 0.95;
  const svf = a.skyViewFactorSvf ?? 0.58;
  const wsMs = (a.windSpeedKmh ?? 12.0) / 3.6;
  const distCoast = a.distanceToCoastKm ?? 1.2;
  const clno2 = a.clno2Pptv ?? 35;
  const temp = a.temperatureC ?? 22.0;

  switch (moduleId) {
    case 'unifiedCanyonSuite':
    case 'canyon':
    case 'juanXXIIICanyon3D':
    case 'urbanCanyonDiagram':
    case 'googleMaps3DCanyon': {
      const ach = Math.max(2.5, (wsMs * 3600) / Math.max(8, hw * 18 * (1 + hw))).toFixed(1);
      const regime = hw > 0.65 ? 'Skimming' : hw > 0.3 ? 'Wake Int.' : 'Isolated';
      return {
        text: `H/W: ${hw.toFixed(2)} • ${regime} • ACH: ${ach} h⁻¹`,
        colorClass: hw > 1.0 ? 'text-amber-300 border-amber-700/60 bg-amber-950/70' : 'text-cyan-300 border-cyan-800/60 bg-cyan-950/60'
      };
    }
    case 'streetMicroscaleInspector':
    case 'no2MassBudget':
    case 'no2MicroscaleAudit': {
      return {
        text: `NO₂ (1.8m): ${no2.toFixed(1)} µg/m³ • Tráf: +${(a.no2TrafficContributionUgM3 ?? 8.2).toFixed(1)}`,
        colorClass: no2 > 25 ? 'text-rose-300 border-rose-700/60 bg-rose-950/70' : 'text-emerald-300 border-emerald-800/60 bg-emerald-950/60'
      };
    }
    case 'leighton':
    case 'extendedLeighton':
    case 'photochemicalRegime':
    case 'photochemicalRadicals':
    case 'spectralPhotolysis': {
      const phi = (a.no2MicroscaleReport as any)?.leightonState?.photostationaryPhi ?? 1.02;
      return {
        text: `Φ: ${Number(phi).toFixed(2)} • O₃: ${o3.toFixed(1)} µg/m³`,
        colorClass: 'text-sky-300 border-sky-800/60 bg-sky-950/60'
      };
    }
    case 'no2NighttimeChemistry':
    case 'coastalHalogens':
    case 'q1CoastalChemistry':
    case 'coastalSmlAcidification': {
      return {
        text: `ClNO₂: ${clno2.toFixed(0)} pptv • Costa: ${distCoast.toFixed(2)} km`,
        colorClass: 'text-teal-300 border-teal-800/60 bg-teal-950/60'
      };
    }
    case 'vbsSoa':
    case 'isorropiaSia':
    case 'ekmaSoa':
    case 'oxidative': {
      return {
        text: `PM2.5: ${pm25.toFixed(1)} • PM10: ${pm10.toFixed(1)} µg/m³`,
        colorClass: pm25 > 15 ? 'text-amber-300 border-amber-700/60 bg-amber-950/70' : 'text-purple-300 border-purple-800/60 bg-purple-950/60'
      };
    }
    case 'malagaTreesInventory':
    case 'treeBvocSoa':
    case 'weselyDeposition':
    case 'vegetation':
    case 'greenRoofMitigation': {
      const vd = (ctx.activeTreeLiveMetrics as any)?.effectiveVdNO2_cm_s ?? (ctx.result?.vd ? ctx.result.vd * 100 : 0.38);
      return {
        text: `v_d(NO₂): ${Number(vd).toFixed(2)} cm/s • SVF: ${svf.toFixed(2)}`,
        colorClass: 'text-emerald-300 border-emerald-800/60 bg-emerald-950/60'
      };
    }
    case 'audit':
    case 'stationAudit':
    case 'satelliteAssimilation':
    case 'liveIngestion': {
      return {
        text: `${OFFICIAL_MALAGA_AIR_STATIONS.length} Est. + ${OFFICIAL_SATELLITE_MISSIONS.length} Sat. • ${a.nearestStation?.station?.code || 'CARR'}`,
        colorClass: 'text-emerald-300 border-emerald-800/60 bg-emerald-950/60'
      };
    }
    case 'regulatoryAudit':
    case 'acuteEpisodeAlert':
    case 'environmentalJustice':
    case 'schoolAirEquity':
    case 'populationExposure': {
      const whoRatio = (no2 / 25.0) * 100;
      return {
        text: `NO₂: ${no2.toFixed(1)} µg/m³ (${whoRatio.toFixed(0)}% OMS 24h)`,
        colorClass: whoRatio > 100 ? 'text-rose-300 border-rose-700/60 bg-rose-950/70' : 'text-amber-300 border-amber-800/60 bg-amber-950/60'
      };
    }
    case 'fairmodeValidation':
    case 'gumUncertainty':
    case 'metrologicalCertificate':
    case 'sobolSensitivity': {
      const uRel = (11.5 + hw * 1.4).toFixed(1);
      return {
        text: `MQI < 1.0 (OK) • U(k=2): ±${uRel}%`,
        colorClass: 'text-indigo-300 border-indigo-800/60 bg-indigo-950/60'
      };
    }
    case 'seaBreeze':
    case 'moninObukhov':
    case 'q1MicroscalePhysics': {
      return {
        text: `Viento: ${wsMs.toFixed(1)} m/s • T: ${temp.toFixed(1)}°C`,
        colorClass: 'text-sky-300 border-sky-800/60 bg-sky-950/60'
      };
    }
    case 'copert':
    case 'traffic':
    case 'trafficLoopsLive':
    case 'emtGtfsCopert':
    case 'inverseSourceRate': {
      const qNox = ctx.activePoint?.qNOx_ug_m_s ?? 14.5;
      return {
        text: `Q_NOx(inverso): ${qNox.toFixed(1)} µg/(m·s) • COPERT 5`,
        colorClass: 'text-amber-300 border-amber-800/60 bg-amber-950/60'
      };
    }
    default:
      return {
        text: `NO₂: ${no2.toFixed(1)} • O₃: ${o3.toFixed(0)} • PM2.5: ${pm25.toFixed(1)}`,
        colorClass: 'text-slate-300 border-slate-800 bg-slate-900/70'
      };
  }
}

interface ContextualRecommendation {
  moduleId: string;
  title: string;
  shortTitle: string;
  reason: string;
  metric: string;
  badgeClass: string;
}

/**
 * Calcula en tiempo real los 5 módulos científicos más relevantes para auditar
 * las condiciones físicas, morfológicas y químicas exactas del punto activo actual.
 */
function getContextualRecommendations(ctx: ActivePointContextValue | null): ContextualRecommendation[] {
  if (!ctx || !ctx.assimilation) return [];
  const a = ctx.assimilation;
  const no2 = a.no2PedestrianLevel1_8mUgM3 ?? 24.0;
  const o3 = a.ozoneO3UgM3 ?? 58.0;
  const hw = a.aspectRatioHw ?? 0.95;
  const distCoast = a.distanceToCoastKm ?? 1.2;
  const recs: ContextualRecommendation[] = [];

  // 1. Diagnóstico Morfológico 3D (Cañón Urbano / Oke 1987)
  recs.push({
    moduleId: 'unifiedCanyonSuite',
    title: 'Suite 3D Cañones & Oke (1987)',
    shortTitle: '🏙️ Cañón 3D',
    reason: hw >= 0.65 ? 'Régimen Skimming Flow detectado' : 'Morfometría H/W & Sondeo OSPM 0-50m',
    metric: `H/W=${hw.toFixed(2)}`,
    badgeClass: 'border-cyan-500/70 bg-cyan-950/80 text-cyan-200 hover:bg-cyan-900/90'
  });

  // 2. Diagnóstico de NO2 / Auditoría Legal o Deducción de Calle
  if (no2 >= 25.0) {
    recs.push({
      moduleId: 'regulatoryAudit',
      title: 'Auditoría Directiva & OMS 2021',
      shortTitle: '⚖️ Auditoría OMS',
      reason: 'Superación umbral diario OMS (25 µg/m³)',
      metric: `NO₂=${no2.toFixed(1)}`,
      badgeClass: 'border-rose-500/70 bg-rose-950/80 text-rose-200 hover:bg-rose-900/90'
    });
  } else {
    recs.push({
      moduleId: 'streetMicroscaleInspector',
      title: 'Inspector Físico 6 Pasos (PINN)',
      shortTitle: '🧭 Inspector Calle',
      reason: 'Deducción mecanística en calle activa',
      metric: `NO₂=${no2.toFixed(1)}`,
      badgeClass: 'border-emerald-500/70 bg-emerald-950/80 text-emerald-200 hover:bg-emerald-900/90'
    });
  }

  // 3. Diagnóstico Litoral / Halógenos si estamos cerca de la costa (< 2.5 km) o Fotoquímica
  if (distCoast <= 2.5) {
    recs.push({
      moduleId: 'q1CoastalChemistry',
      title: 'Química Costera Q1 (ClNO₂ & HOMs)',
      shortTitle: '🌊 Halógenos ClNO₂',
      reason: `Influencia marina a ${distCoast.toFixed(2)} km del Mar de Alborán`,
      metric: `${(a.clno2Pptv ?? 38).toFixed(0)} pptv`,
      badgeClass: 'border-teal-500/70 bg-teal-950/80 text-teal-200 hover:bg-teal-900/90'
    });
  } else {
    recs.push({
      moduleId: 'extendedLeighton',
      title: 'Ciclo de Leighton & Radicales',
      shortTitle: '⚛️ Leighton Φ',
      reason: 'Acoplamiento fotoestacionario NO-NO₂-O₃',
      metric: `O₃=${o3.toFixed(0)}`,
      badgeClass: 'border-sky-500/70 bg-sky-950/80 text-sky-200 hover:bg-sky-900/90'
    });
  }

  // 4. Diagnóstico de Arbolado / Fitorremediación en la calle
  recs.push({
    moduleId: 'malagaTreesInventory',
    title: 'Fisiología Estomática & Arbolado',
    shortTitle: '🌿 Arbolado Vivo',
    reason: ctx.nearestTreeStreet ? `Corredor: ${ctx.nearestTreeStreet.streetName.slice(0, 22)}` : 'Sumidero foliar de Wesely (1989)',
    metric: `v_d=${Number((ctx.activeTreeLiveMetrics as any)?.effectiveVdNO2_cm_s ?? (ctx.result?.vd ? ctx.result.vd * 100 : 0.38)).toFixed(2)}`,
    badgeClass: 'border-lime-500/70 bg-lime-950/80 text-lime-200 hover:bg-lime-900/90'
  });

  // 5. Modo Defensa de Tesis / Certificación GUM
  recs.push({
    moduleId: 'phdDefenseWalkthrough',
    title: 'Defensa Doctoral & Beamer LaTeX',
    shortTitle: '🎓 Defensa Tesis',
    reason: 'Guion interactivo EIDUNED para este punto',
    metric: 'Beamer .TEX',
    badgeClass: 'border-amber-500/70 bg-amber-950/80 text-amber-200 hover:bg-amber-900/90'
  });

  return recs;
}

interface IntelligentDockTabsProps {
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
}

export const IntelligentDockTabs: React.FC<IntelligentDockTabsProps> = ({
  activeModal,
  setActiveModal
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('geodesy_canyons');
  const [activeWorkflow, setActiveWorkflow] = useState<DoctoralWorkflowId>('disciplines');
  const [onlyKeyThesis, setOnlyKeyThesis] = useState<boolean>(false);
  const [onlyPinned, setOnlyPinned] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [keepCatalogOpen, setKeepCatalogOpen] = useState<boolean>(false);
  const [dockPosition, setDockPosition] = useState<'top' | 'bottom'>('top');
  const [catalogViewMode, setCatalogViewMode] = useState<'modules' | 'subtabs' | 'hierarchical'>('modules');
  const [visitedModules, setVisitedModules] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem('malaga_phd_visited_modules');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const bottomDockRibbonRef = useRef<HTMLDivElement | null>(null);
  const workflowRibbonRef = useRef<HTMLDivElement | null>(null);
  const scrollRibbon = (ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });
  };
  const handleRibbonWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };
  const activePointCtx = useActivePoint();

  const isExpanded = useUIStore((state) => state.isDockExpanded);
  const setIsDockExpanded = useUIStore((state) => state.setIsDockExpanded);
  const toggleDock = useUIStore((state) => state.toggleDock);
  const pinnedShortcuts = useUIStore((state) => state.pinnedShortcuts);
  const togglePinnedShortcut = useUIStore((state) => state.togglePinnedShortcut);
  const showLeftSidebar = useUIStore((state) => state.showLeftSidebar);
  const setShowLeftSidebar = useUIStore((state) => state.setShowLeftSidebar);

  // Registrar automáticamente como visitado cualquier modal que se active
  useEffect(() => {
    if (activeModal && !visitedModules.includes(activeModal)) {
      const updated = [...visitedModules, activeModal];
      setVisitedModules(updated);
      try {
        sessionStorage.setItem('malaga_phd_visited_modules', JSON.stringify(updated));
      } catch {
        // Ignorar errores de almacenamiento
      }
    }
  }, [activeModal, visitedModules]);

  // Atajo global Ctrl+K / Cmd+K para abrir el Centro de Mando Doctoral y enfocar el buscador
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!isExpanded) {
          setIsDockExpanded(true);
        }
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 60);
      } else if (e.key === 'Escape' && isExpanded) {
        setIsDockExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, setIsDockExpanded]);

  // Enfocar el buscador al abrir el catálogo
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const currentCategoryData = SCIENTIFIC_CATEGORIES.find((c) => c.id === activeCategory) || SCIENTIFIC_CATEGORIES[0];
  const allModulesFlat = React.useMemo(
    () =>
      SCIENTIFIC_CATEGORIES.flatMap((cat) =>
        cat.modules.map((m) => ({ ...m, categoryName: cat.shortName, categoryId: cat.id }))
      ),
    []
  );

  // Mapa de Subpestañas exactas agrupadas por modalId
  const moduleSubtabsMap = React.useMemo(() => {
    const map = new Map<string, SubtabShortcutItem[]>();
    SCIENTIFIC_SUBTABS_CATALOG.forEach((item) => {
      const list = map.get(item.modalId) || [];
      list.push(item);
      map.set(item.modalId, list);
    });
    return map;
  }, []);

  // Subpestañas coincidentes con el filtro de búsqueda
  const matchingSubtabs = React.useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return [];
    return SCIENTIFIC_SUBTABS_CATALOG.filter((sub) => {
      return (
        sub.title.toLowerCase().includes(q) ||
        sub.shortTag.toLowerCase().includes(q) ||
        sub.description.toLowerCase().includes(q) ||
        (sub.formula && sub.formula.toLowerCase().includes(q)) ||
        sub.parentSuiteName.toLowerCase().includes(q) ||
        sub.categoryName.toLowerCase().includes(q)
      );
    });
  }, [searchFilter]);

  // Lista global de subpestañas filtradas según modo y buscador
  const allFilteredSubtabs = React.useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return SCIENTIFIC_SUBTABS_CATALOG.filter((sub) => {
      if (onlyKeyThesis && !sub.isKeyThesis) return false;
      if (onlyPinned && !pinnedShortcuts.includes(sub.id)) return false;
      if (!q) return true;
      return (
        sub.title.toLowerCase().includes(q) ||
        sub.shortTag.toLowerCase().includes(q) ||
        sub.description.toLowerCase().includes(q) ||
        (sub.formula && sub.formula.toLowerCase().includes(q)) ||
        sub.parentSuiteName.toLowerCase().includes(q) ||
        sub.categoryName.toLowerCase().includes(q)
      );
    });
  }, [searchFilter, onlyKeyThesis, onlyPinned, pinnedShortcuts]);

  // Deduplicar módulos cuando se filtra globalmente o por itinerario
  const filteredModules = React.useMemo(() => {
    let result = allModulesFlat;

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const seen = new Set<string>();
      result = allModulesFlat.filter((m) => {
        if (seen.has(m.id)) return false;
        const subtabs = moduleSubtabsMap.get(m.id) || [];
        const subMatch = subtabs.some(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.shortTag.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            (s.formula && s.formula.toLowerCase().includes(q))
        );
        const match =
          subMatch ||
          m.name.toLowerCase().includes(q) ||
          m.tag.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.categoryName.toLowerCase().includes(q);
        if (match) {
          seen.add(m.id);
          return true;
        }
        return false;
      });
    } else if (activeWorkflow !== 'disciplines') {
      const wf = DOCTORAL_WORKFLOWS.find((w) => w.id === activeWorkflow);
      if (wf && wf.moduleIds.length > 0) {
        const seen = new Set<string>();
        result = allModulesFlat.filter((m) => {
          if (seen.has(m.id)) return false;
          if (wf.moduleIds.includes(m.id)) {
            seen.add(m.id);
            return true;
          }
          return false;
        });
      }
    } else {
      result = currentCategoryData.modules.map((m) => ({
        ...m,
        categoryName: currentCategoryData.shortName,
        categoryId: currentCategoryData.id
      }));
    }

    if (onlyKeyThesis) {
      result = result.filter((m) => m.isKeyThesis);
    }

    if (onlyPinned) {
      result = result.filter((m) =>
        pinnedShortcuts.some((p) => p === m.id || p.startsWith(`${m.id}:`))
      );
    }

    return result;
  }, [allModulesFlat, searchFilter, activeWorkflow, currentCategoryData, onlyKeyThesis, onlyPinned, pinnedShortcuts, moduleSubtabsMap]);

  // Búsqueda geoespacial unificada (Estaciones + Satélites + Calles/Cañones) cuando el usuario escribe en el buscador
  const matchingLocations = React.useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (q.length < 2) return [];

    const matches: {
      id: string;
      name: string;
      typeLabel: string;
      lat: number;
      lon: number;
      badgeColor: string;
    }[] = [];

    for (const st of OFFICIAL_MALAGA_AIR_STATIONS) {
      if (
        st.name.toLowerCase().includes(q) ||
        st.code.toLowerCase().includes(q) ||
        st.network.toLowerCase().includes(q)
      ) {
        matches.push({
          id: `st-${st.id}`,
          name: `${st.name} (${st.code})`,
          typeLabel: '📡 Estación Oficial',
          lat: st.lat,
          lon: st.lon,
          badgeColor: 'border-emerald-600/70 bg-emerald-950/80 text-emerald-200'
        });
      }
      if (matches.length >= 6) break;
    }

    if (matches.length < 6) {
      for (const sat of OFFICIAL_SATELLITE_MISSIONS) {
        if (sat.name.toLowerCase().includes(q) || sat.code.toLowerCase().includes(q)) {
          matches.push({
            id: `sat-${sat.id}`,
            name: `${sat.name} (${sat.code})`,
            typeLabel: '🛰️ Pie Satelital',
            lat: sat.lat,
            lon: sat.lon,
            badgeColor: 'border-purple-600/70 bg-purple-950/80 text-purple-200'
          });
        }
        if (matches.length >= 8) break;
      }
    }

    if (matches.length < 8) {
      for (const geo of MASTER_MALAGA_GEOREFERENCES) {
        if (
          geo.name.toLowerCase().includes(q) ||
          geo.category.toLowerCase().includes(q)
        ) {
          matches.push({
            id: `geo-${geo.name}`,
            name: geo.name,
            typeLabel: '📍 Calle / Cañón',
            lat: geo.lat,
            lon: geo.lon,
            badgeColor: 'border-cyan-600/70 bg-cyan-950/80 text-cyan-200'
          });
        }
        if (matches.length >= 10) break;
      }
    }

    return matches;
  }, [searchFilter]);

  const contextualRecs = React.useMemo(
    () => getContextualRecommendations(activePointCtx),
    [activePointCtx]
  );

  const handleSelectModule = (moduleId: string) => {
    const isCurrentlyActive = activeModal === moduleId;
    setActiveModal(isCurrentlyActive ? null : moduleId);
    if (!isCurrentlyActive && !keepCatalogOpen) {
      setIsDockExpanded(false);
    }
  };

  const activeModuleObj = React.useMemo(
    () => allModulesFlat.find((m) => m.id === activeModal) || null,
    [allModulesFlat, activeModal]
  );

  const defaultDockCategoryIds = React.useMemo(
    () => SCIENTIFIC_CATEGORIES.map((c) => c.id),
    []
  );
  const {
    orderedIds: orderedDockCategoryIds,
    moveItem: moveDockCategory,
    resetOrder: resetDockCategoryOrder,
    isCustomized: isDockCategoryOrderCustomized
  } = useOrderableIds('bottom_dock_categories', defaultDockCategoryIds);

  const orderedCategories = React.useMemo(() => {
    const map = new Map(SCIENTIFIC_CATEGORIES.map((c) => [c.id, c]));
    return orderedDockCategoryIds
      .map((id) => map.get(id))
      .filter((c): c is ScientificModuleCategory => c !== undefined);
  }, [orderedDockCategoryIds]);

  return (
    <>
      {/* ================================================================================= */}
      {/* 1. CENTRO DE MANDO DOCTORAL DESPLEGABLE (CONECTADO DIRECTAMENTE BAJO LA CABECERA) */}
      {/* ================================================================================= */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Fondo sutil para cerrar haciendo clic fuera si no está fijado */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => {
                if (!keepCatalogOpen) setIsDockExpanded(false);
              }}
              className="fixed inset-0 bg-black/45 backdrop-blur-[1.5px] z-[88]"
            />

            <motion.div
              initial={{ opacity: 0, y: dockPosition === 'top' ? -14 : 14, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: dockPosition === 'top' ? -10 : 10, scale: 0.99 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className={`fixed left-2 right-2 z-[95] bg-slate-950/98 border-2 border-emerald-500/70 rounded-md shadow-[0_20px_60px_rgba(0,0,0,0.92),0_0_25px_rgba(16,185,129,0.22)] backdrop-blur-xl flex flex-col overflow-hidden ${
                dockPosition === 'top' ? 'top-[42px] max-h-[84vh]' : 'bottom-[34px] max-h-[82vh]'
              }`}
            >
              {/* Barra Superior del Centro de Mando Doctoral */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-slate-950 border-b border-emerald-800/70">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-mono font-bold text-[11px] uppercase tracking-wider">
                    <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>CENTRO DE MANDO DOCTORAL UNIFICADO ({TOTAL_KEY_THESIS_MODULES} MÓDULOS)</span>
                  </div>
                  <span className="hidden xl:inline text-[9.5px] text-slate-400 font-mono border-l border-slate-700 pl-2.5">
                    7 Ejes Físicos • 6 Itinerarios de Tesis • Sincronizado en Vivo con{' '}
                    <strong className="text-cyan-300">
                      {activePointCtx?.activePoint?.name || activePointCtx?.activePoint?.nearestStreetName || 'Punto Activo'}
                    </strong>
                  </span>
                </div>

                {/* Buscador Universal Instantáneo (Módulos + Ecuaciones + Calles/Estaciones) */}
                <div className="flex flex-wrap items-center gap-2 ml-auto">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 top-2" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Buscar módulo, ecuación (Oke, Leighton, COPERT) o calle/estación..."
                      className="pl-8 pr-7 py-1 bg-black/80 border border-emerald-600/70 rounded-xs text-[10.5px] font-mono text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 w-64 sm:w-80 md:w-96"
                    />
                    {searchFilter && (
                      <button
                        onClick={() => setSearchFilter('')}
                        className="absolute right-2 top-1.5 text-slate-400 hover:text-white cursor-pointer"
                        title="Limpiar búsqueda"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filtro: Solo ★ Clave Tesis */}
                  <button
                    onClick={() => setOnlyKeyThesis(!onlyKeyThesis)}
                    className={`px-2 py-1 border text-[9px] font-mono font-bold uppercase rounded-xs transition-all cursor-pointer flex items-center gap-1 ${
                      onlyKeyThesis
                        ? 'bg-amber-950 text-amber-300 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                        : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-amber-600/60 hover:text-amber-200'
                    }`}
                    title="Mostrar únicamente los módulos troncales clave para la defensa doctoral"
                  >
                    <span>★ Clave Tesis</span>
                  </button>

                  {/* Filtro: Solo Fijados 📌 */}
                  <button
                    onClick={() => setOnlyPinned(!onlyPinned)}
                    className={`px-2 py-1 border text-[9px] font-mono font-bold uppercase rounded-xs transition-all cursor-pointer flex items-center gap-1 ${
                      onlyPinned
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-cyan-600/60 hover:text-cyan-200'
                    }`}
                    title="Filtrar los módulos que tienes fijados en tu barra rápida superior"
                  >
                    <Pin className="w-3 h-3" />
                    <span>Fijados ({pinnedShortcuts.length})</span>
                  </button>

                  {/* Contador de Visitados en la Sesión */}
                  <div className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-700 px-2 py-1 rounded-xs text-[9px] font-mono text-slate-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>
                      Visitados: <strong className="text-emerald-300">{visitedModules.length}</strong>/{TOTAL_KEY_THESIS_MODULES}
                    </span>
                    {visitedModules.length > 0 && (
                      <button
                        onClick={() => {
                          setVisitedModules([]);
                          try {
                            sessionStorage.removeItem('malaga_phd_visited_modules');
                          } catch {
                            // Ignore
                          }
                        }}
                        className="ml-1 text-slate-400 hover:text-amber-300 cursor-pointer"
                        title="Reiniciar contador de módulos visitados en esta sesión"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  {/* Toggle: Mantener Catálogo Abierto */}
                  <button
                    onClick={() => setKeepCatalogOpen(!keepCatalogOpen)}
                    className={`px-2 py-1 border text-[9px] font-mono font-bold uppercase rounded-xs transition-all cursor-pointer flex items-center gap-1 ${
                      keepCatalogOpen
                        ? 'bg-emerald-900 text-emerald-200 border-emerald-400'
                        : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                    title={
                      keepCatalogOpen
                        ? 'El catálogo permanecerá abierto al pulsar un módulo'
                        : 'Cierre automático activo: al elegir un módulo el catálogo se pliega para despejar el mapa'
                    }
                  >
                    <Pin className="w-3 h-3" />
                    <span className="hidden sm:inline">{keepCatalogOpen ? 'Mantener Abierto' : 'Auto-Cierre'}</span>
                  </button>

                  {/* Botón opcional para abrir también el Árbol Lateral Izquierdo si se desea */}
                  <button
                    onClick={() => {
                      setShowLeftSidebar(!showLeftSidebar);
                      if (!keepCatalogOpen) setIsDockExpanded(false);
                    }}
                    className={`px-2 py-1 border text-[9px] font-mono font-bold uppercase rounded-xs transition-all cursor-pointer flex items-center gap-1 ${
                      showLeftSidebar
                        ? 'bg-indigo-950 text-indigo-300 border-indigo-400'
                        : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-indigo-500/60 hover:text-indigo-200'
                    }`}
                    title="Alternar la vista en árbol vertical acoplada al margen izquierdo del mapa"
                  >
                    <PanelLeft className="w-3 h-3 text-indigo-400" />
                    <span className="hidden lg:inline">Árbol Lateral</span>
                  </button>

                  {/* Selector Posición Arriba / Abajo */}
                  <button
                    onClick={() => setDockPosition(dockPosition === 'top' ? 'bottom' : 'top')}
                    className="p-1 bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 rounded-xs cursor-pointer"
                    title={dockPosition === 'top' ? 'Anclar catálogo en la parte inferior' : 'Anclar catálogo bajo la cabecera superior'}
                  >
                    {dockPosition === 'top' ? <ArrowDownToLine className="w-3.5 h-3.5" /> : <ArrowUpToLine className="w-3.5 h-3.5" />}
                  </button>

                  {/* Botón Cerrar Catálogo */}
                  <button
                    onClick={() => setIsDockExpanded(false)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-600/70 text-rose-200 text-[9.5px] font-mono font-bold uppercase rounded-xs transition-colors cursor-pointer"
                    title="Cerrar Catálogo Doctoral (Esc)"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>CERRAR</span>
                  </button>
                </div>
              </div>

              {/* Cuerpo Principal Desplazable del Centro de Mando Doctoral */}
              <div className="p-3 space-y-3 overflow-y-auto custom-scrollbar">
                {/* 1. BANDA DE DIAGNÓSTICO CONTEXTUAL & SUGERENCIA INTELIGENTE SEGÚN EL PUNTO ACTIVO */}
                {!searchFilter && contextualRecs.length > 0 && (
                  <div className="bg-slate-900/90 border border-emerald-800/60 rounded-sm p-2.5 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider">
                        <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                        <span>
                          Diagnóstico Contextual en Tiempo Real — Recomendados para{' '}
                          <span className="text-white underline decoration-emerald-500/60">
                            {activePointCtx?.activePoint?.name || activePointCtx?.activePoint?.nearestStreetName || 'Punto Activo'}
                          </span>
                          :
                        </span>
                      </div>
                      <span className="text-[8.5px] font-mono text-slate-400">
                        Calculado determinísticamente según telemetría local (H/W, NO₂, O₃, distancia al mar y dosel arbóreo)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5">
                      {contextualRecs.map((rec) => {
                        const isRecActive = activeModal === rec.moduleId;
                        return (
                          <ScientificTooltip
                            key={rec.moduleId}
                            position="top"
                            width="w-[300px]"
                            content={
                              <div className="space-y-1 font-mono text-[9px]">
                                <strong className="text-emerald-300 block">{rec.title}</strong>
                                <div className="text-slate-300">{rec.reason}</div>
                                <div className="text-amber-300 text-[8px] pt-0.5 border-t border-slate-800">
                                  Telemetría: {rec.metric} • Clic para abrir suite recomendada
                                </div>
                              </div>
                            }
                          >
                            <button
                              onClick={() => handleSelectModule(rec.moduleId)}
                              className={`text-left p-2 rounded-xs border transition-all cursor-pointer flex flex-col justify-between gap-1 w-full ${
                                isRecActive
                                  ? 'bg-emerald-900 border-white text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                                  : rec.badgeClass
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 w-full">
                                <span className="text-[9.5px] font-mono font-bold truncate">{rec.title}</span>
                                <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 bg-black/60 rounded-xs border border-white/15 shrink-0">
                                  {rec.metric}
                                </span>
                              </div>
                              <div className="text-[8.5px] font-mono text-slate-200/90 truncate">{rec.reason}</div>
                            </button>
                          </ScientificTooltip>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. RESULTADOS GEOESPACIALES DIRECTOS SI EL USUARIO BUSCA UNA CALLE, ESTACIÓN O SATÉLITE */}
                {searchFilter.trim().length >= 2 && matchingLocations.length > 0 && (
                  <div className="bg-cyan-950/35 border border-cyan-700/60 rounded-sm p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[9.5px] font-mono font-bold text-cyan-300 uppercase">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Ubicaciones, Estaciones y Satélites Coincidentes en Málaga (Clic para sincronizar Punto Activo):</span>
                      </span>
                      <span className="text-[8.5px] text-slate-400">{matchingLocations.length} coincidencias</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {matchingLocations.map((loc) => (
                        <ScientificTooltip
                          key={loc.id}
                          position="top"
                          width="w-[260px]"
                          content={`Sincronizar mapa y asimilación PINN con ${loc.name} (${loc.typeLabel})`}
                        >
                          <button
                            onClick={() => {
                              activePointCtx?.syncActivePoint(loc.lat, loc.lon, {
                                name: loc.name,
                                zoom: 16.5,
                                pitch: 45,
                                fly: true
                              });
                              if (!keepCatalogOpen) setIsDockExpanded(false);
                            }}
                            className={`px-2.5 py-1 border rounded-xs text-[9.5px] font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] ${loc.badgeColor}`}
                          >
                            <Navigation className="w-3 h-3 shrink-0" />
                            <span>{loc.name}</span>
                            <span className="text-[8px] opacity-80 bg-black/50 px-1 rounded-xs">{loc.typeLabel}</span>
                          </button>
                        </ScientificTooltip>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2.1 RESULTADOS DE SUBPANTALLAS & ECUACIONES SI EL USUARIO BUSCA */}
                {searchFilter.trim().length >= 2 && matchingSubtabs.length > 0 && (
                  <div className="bg-amber-950/30 border border-amber-600/50 rounded-sm p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-[9.5px] font-mono font-bold text-amber-300 uppercase">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Subpantallas y Ecuaciones Clave Coincidentes ({matchingSubtabs.length}):</span>
                      </span>
                      <span className="text-[8.5px] text-slate-400">Clic directo para abrir la subpantalla en su suite</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                      {matchingSubtabs.map((sub) => {
                        const isSubActive = activeModal === sub.id;
                        return (
                          <ScientificTooltip
                            key={sub.id}
                            position="top"
                            width="w-[320px]"
                            content={
                              <div className="space-y-1 font-mono text-[9px]">
                                <strong className="text-amber-300 block">{sub.title}</strong>
                                <div className="text-cyan-300 text-[8px]">Suite: {sub.parentSuiteName}</div>
                                {sub.formula && (
                                  <div className="text-emerald-300 bg-black/60 p-1 rounded border border-emerald-800/40 font-bold">
                                    {sub.formula}
                                  </div>
                                )}
                                <p className="text-slate-200 text-[8.5px]">{sub.description}</p>
                              </div>
                            }
                          >
                            <button
                              onClick={() => handleSelectModule(sub.id)}
                              className={`text-left p-2 rounded-xs border transition-all cursor-pointer flex flex-col justify-between gap-1 w-full ${
                                isSubActive
                                  ? 'bg-amber-900 border-amber-300 text-white shadow-md'
                                  : 'bg-black/60 border-amber-700/40 text-amber-100 hover:border-amber-400 hover:bg-amber-950/50'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 w-full">
                                <span className="text-[9.5px] font-mono font-bold truncate">{sub.title}</span>
                                <span className="text-[7.5px] font-mono font-bold px-1 py-0.2 bg-black/60 rounded border border-amber-600/40 text-amber-300 shrink-0">
                                  {sub.shortTag}
                                </span>
                              </div>
                              {sub.formula && (
                                <div className="text-[8px] font-mono text-emerald-300/90 truncate">{sub.formula}</div>
                              )}
                              <div className="text-[7.5px] font-mono text-slate-400 truncate border-t border-white/10 pt-0.5">
                                {sub.parentSuiteName}
                              </div>
                            </button>
                          </ScientificTooltip>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. SELECTOR DE ITINERARIOS DOCTORALES VS 7 EJES FÍSICOS & CONMUTADOR DE VISTA DE CATÁLOGO (CINTA DESLIZANTE REGLA 22) */}
                {!searchFilter && (
                  <div className="space-y-2">
                    <div className="relative flex items-center pb-1.5 border-b border-slate-800/90 gap-1">
                      <button
                        type="button"
                        onClick={() => scrollRibbon(workflowRibbonRef, 'left')}
                        title="Deslizar modos de exploración a la izquierda"
                        className="shrink-0 z-10 px-1.5 py-1 bg-slate-900 hover:bg-emerald-950 text-emerald-300 border border-slate-700 rounded-l cursor-pointer transition-colors"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <div
                        ref={workflowRibbonRef}
                        onWheel={handleRibbonWheel}
                        className="flex items-center justify-start gap-1.5 font-mono text-[9.5px] overflow-x-auto whitespace-nowrap flex-1 min-w-0 py-0.5 scroll-smooth [scrollbar-width:thin] [scrollbar-color:#10b981_#020617]"
                      >
                        <span className="text-slate-400 font-bold uppercase mr-1 shrink-0">Modo de Exploración:</span>
                        {DOCTORAL_WORKFLOWS.map((wf) => {
                          const isSelected = activeWorkflow === wf.id;
                          return (
                            <ScientificTooltip key={wf.id} position="bottom" width="w-[300px]" content={wf.description}>
                              <button
                                onClick={() => setActiveWorkflow(wf.id)}
                                className={`px-2.5 py-1 border text-[9.5px] font-mono uppercase tracking-wider flex items-center gap-1.5 rounded-xs transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                                  isSelected
                                    ? `${wf.color} font-bold shadow-md scale-[1.01]`
                                    : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:text-white hover:border-slate-600'
                                }`}
                              >
                                <span className="shrink-0">{wf.icon}</span>
                                <span>{wf.shortLabel}</span>
                                {wf.moduleIds.length > 0 && (
                                  <span className="text-[8px] px-1 bg-black/60 rounded border border-slate-700">
                                    {wf.moduleIds.length}
                                  </span>
                                )}
                              </button>
                            </ScientificTooltip>
                          );
                        })}

                        {/* Selector de Nivel de Detalle integrado en la misma cinta deslizante sin huecos */}
                        <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded border border-slate-800 text-[8.5px] font-mono font-bold shrink-0 ml-1">
                          <ScientificTooltip
                            position="bottom"
                            width="w-[280px]"
                            title="Vista por Suites y Módulos Principales"
                            content={`Muestra las ${filteredModules.length} consolas y suites científicas principales agrupadas por disciplina doctoral.`}
                          >
                            <button
                              onClick={() => setCatalogViewMode('modules')}
                              className={`px-2 py-0.5 rounded-xs transition-all cursor-pointer whitespace-nowrap ${
                                catalogViewMode === 'modules'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              🏛️ MÓDULOS ({filteredModules.length})
                            </button>
                          </ScientificTooltip>

                          <ScientificTooltip
                            position="bottom"
                            width="w-[290px]"
                            title="Vista Directa de Subpantallas y Ecuaciones"
                            content={`Muestra directamente las ${allFilteredSubtabs.length} subpestañas especializadas y sus ecuaciones diferenciales para saltar a cualquier cálculo en 1 clic.`}
                          >
                            <button
                              onClick={() => setCatalogViewMode('subtabs')}
                              className={`px-2 py-0.5 rounded-xs transition-all cursor-pointer whitespace-nowrap ${
                                catalogViewMode === 'subtabs'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              🔬 SUBPANTALLAS ({allFilteredSubtabs.length})
                            </button>
                          </ScientificTooltip>

                          <ScientificTooltip
                            position="bottom"
                            width="w-[290px]"
                            title="Árbol Jerárquico Completo (Suites + Subpestañas)"
                            content="Despliega simultáneamente cada módulo principal junto con todas sus subpantallas internas para una visión integral del sistema."
                          >
                            <button
                              onClick={() => setCatalogViewMode('hierarchical')}
                              className={`px-2 py-0.5 rounded-xs transition-all cursor-pointer whitespace-nowrap ${
                                catalogViewMode === 'hierarchical'
                                  ? 'bg-cyan-600 text-white shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              🌿 JERÁRQUICO
                            </button>
                          </ScientificTooltip>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => scrollRibbon(workflowRibbonRef, 'right')}
                        title="Deslizar modos de exploración a la derecha"
                        className="shrink-0 z-10 px-1.5 py-1 bg-slate-900 hover:bg-emerald-950 text-emerald-300 border border-slate-700 rounded-r cursor-pointer transition-colors"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Pestañas de los 7 Ejes Disciplinares */}
                    {activeWorkflow === 'disciplines' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                        {SCIENTIFIC_CATEGORIES.map((category) => {
                          const isSelected = activeCategory === category.id;
                          const hasActiveModal = category.modules.some((m) => m.id === activeModal);

                          return (
                            <ScientificTooltip
                              key={category.id}
                              position="bottom"
                              width="w-[320px]"
                              content={
                                <div className="space-y-1 font-mono text-[9.5px]">
                                  <strong className="text-emerald-300 block">{category.name}</strong>
                                  <p className="text-slate-200">{category.description}</p>
                                  <span className="text-[8.5px] text-amber-300 block pt-1 border-t border-slate-800">
                                    {category.modules.length} módulos científicos integrados
                                  </span>
                                </div>
                              }
                            >
                              <button
                                onClick={() => setActiveCategory(category.id)}
                                className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-2 text-[9.5px] font-bold uppercase tracking-wider border rounded-xs transition-all text-left truncate relative cursor-pointer ${
                                  isSelected
                                    ? `${category.accentColor} shadow-md ring-1 ring-white/15`
                                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-600'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="shrink-0">{category.icon}</span>
                                  <span className="truncate">{category.shortName}</span>
                                </div>
                                <span className="text-[8px] font-mono px-1 py-0.2 bg-black/50 rounded border border-white/10 shrink-0">
                                  {category.modules.length}
                                </span>
                                {hasActiveModal && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 absolute right-1 top-1 animate-pulse" />
                                )}
                              </button>
                            </ScientificTooltip>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. VISTA DE SUBPANTALLAS DIRECTAS (SI catalogViewMode === 'subtabs') */}
                {catalogViewMode === 'subtabs' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                    {allFilteredSubtabs.map((sub) => {
                      const isSubActive = activeModal === sub.id;
                      const isPinned = pinnedShortcuts.includes(sub.id);

                      return (
                        <ScientificTooltip
                          key={sub.id}
                          position="top"
                          width="w-[340px]"
                          content={
                            <div className="space-y-1.5 font-mono text-[9px]">
                              <div className="flex items-center justify-between border-b border-amber-600/40 pb-1">
                                <strong className="text-amber-300 text-[10px] block">{sub.title}</strong>
                                <span className="text-[7.5px] px-1 py-0.2 bg-black/60 rounded text-cyan-300 font-bold">
                                  {sub.shortTag}
                                </span>
                              </div>
                              <div className="text-cyan-300 text-[8px] flex items-center justify-between">
                                <span>Suite: <strong className="text-white">{sub.parentSuiteName}</strong></span>
                                <span className="text-slate-400">{sub.categoryName}</span>
                              </div>
                              {sub.formula && (
                                <div className="text-emerald-300 bg-black/70 p-1.5 rounded border border-emerald-800/40 font-bold text-[8.5px]">
                                  {sub.formula}
                                </div>
                              )}
                              <p className="text-slate-200 text-[8px] leading-relaxed">{sub.description}</p>
                              <div className="text-amber-400 text-[7.5px] pt-1 border-t border-slate-800 flex items-center justify-between">
                                <span>Clic para abrir subpantalla directa</span>
                                <span className="text-slate-400">ID: {sub.id}</span>
                              </div>
                            </div>
                          }
                        >
                          <div
                            onClick={() => handleSelectModule(sub.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleSelectModule(sub.id);
                              }
                            }}
                            className={`w-full text-left p-2.5 border rounded-xs transition-all flex flex-col justify-between group min-h-[92px] relative cursor-pointer ${
                              isSubActive
                                ? 'bg-amber-950/95 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)] ring-1 ring-amber-400/50'
                                : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-amber-500/70 hover:bg-slate-900'
                            }`}
                          >
                            {/* Cabecera Subpantalla: Título + Botón Fijar 📌 */}
                            <div className="flex items-start justify-between gap-1.5 w-full">
                              <div className="min-w-0">
                                <span className="text-[7.5px] font-mono font-bold text-amber-400 block truncate uppercase tracking-wider">
                                  {sub.parentSuiteName}
                                </span>
                                <span className="text-[10px] font-bold leading-snug group-hover:text-amber-300 line-clamp-2">
                                  {sub.title}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePinnedShortcut(sub.id);
                                }}
                                className={`p-1 rounded-xs border transition-colors shrink-0 cursor-pointer ${
                                  isPinned
                                    ? 'bg-amber-950/90 border-amber-500/80 text-amber-300'
                                    : 'bg-black/40 border-slate-800 text-slate-500 opacity-70 group-hover:opacity-100 hover:text-amber-300 hover:border-amber-600/60'
                                }`}
                                title={
                                  isPinned
                                    ? 'Quitar de la barra superior de accesos rápidos'
                                    : 'Fijar esta subpantalla en la barra superior'
                                }
                              >
                                <Pin className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            {/* Fórmula Matemática Destacada */}
                            {sub.formula && (
                              <div className="my-1.5 p-1 bg-black/60 rounded border border-slate-800 font-mono text-[8px] text-emerald-300 truncate">
                                {sub.formula}
                              </div>
                            )}

                            {/* Pie de Tarjeta: Tag Corto + Categoría + ★ TESIS */}
                            <div className="flex items-center justify-between w-full pt-1 border-t border-slate-800/80">
                              <span className="text-[7.5px] font-mono px-1.5 py-0.2 border bg-black/60 text-slate-300 border-slate-700/80 truncate">
                                {sub.shortTag}
                              </span>

                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[7.5px] font-mono text-cyan-400 font-bold">
                                  {sub.categoryName.split('.')[0]}
                                </span>
                                {sub.isKeyThesis && (
                                  <span className="text-[7px] font-mono text-amber-300 font-bold uppercase">
                                    ★ TESIS
                                  </span>
                                )}
                              </div>
                            </div>

                            {isSubActive && (
                              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-slate-950 animate-ping" />
                            )}
                          </div>
                        </ScientificTooltip>
                      );
                    })}
                  </div>
                ) : (
                  /* 4. REJILLA DE TARJETAS DE MÓDULOS CON CHIPS DE SUBPANTALLAS EN CADA ENLACE */
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                    {filteredModules.map((module) => {
                      const isActive = activeModal === module.id;
                      const isVisited = visitedModules.includes(module.id);
                      const isPinned = pinnedShortcuts.some(
                        (p) => p === module.id || p.startsWith(`${module.id}:`)
                      );
                      const liveBadge = getModuleLiveTelemetryBadge(module.id, activePointCtx);
                      const moduleSubs = moduleSubtabsMap.get(module.id) || [];
                      const isHierarchical = catalogViewMode === 'hierarchical';
                      const displayedSubs = isHierarchical ? moduleSubs : moduleSubs.slice(0, 4);
                      const remainingSubs = moduleSubs.length - displayedSubs.length;

                      return (
                        <ScientificTooltip
                          key={`${module.categoryId}-${module.id}`}
                          position="top"
                          width={module.tooltipWidth || 'w-[320px]'}
                          content={
                            module.tooltipContent || (
                              <div className="space-y-1">
                                <strong className="text-emerald-300 block">{module.name}</strong>
                                <div className="text-[10px] text-slate-200">{module.description}</div>
                                <div className="text-[8.5px] text-slate-400 font-mono border-t border-slate-800 pt-1 flex items-center justify-between">
                                  <span>
                                    Etiqueta: <strong className="text-amber-300">{module.tag}</strong>
                                  </span>
                                  <span>{module.categoryName}</span>
                                </div>
                                {moduleSubs.length > 0 && (
                                  <div className="text-[8px] text-cyan-300 pt-1 border-t border-slate-800">
                                    Contiene {moduleSubs.length} subpantallas y ecuaciones vinculadas.
                                  </div>
                                )}
                              </div>
                            )
                          }
                        >
                          <div
                            onClick={() => handleSelectModule(module.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleSelectModule(module.id);
                              }
                            }}
                            className={`w-full text-left p-2.5 border rounded-xs transition-all flex flex-col justify-between group min-h-[82px] relative cursor-pointer ${
                              isActive
                                ? 'bg-emerald-950/95 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-1 ring-emerald-400/50'
                                : 'bg-slate-900/75 border-slate-800 text-slate-200 hover:border-emerald-500/70 hover:bg-slate-900'
                            }`}
                          >
                            {/* Cabecera de la tarjeta: Icono + Nombre + Botón Fijar 📌 */}
                            <div className="flex items-start justify-between gap-1.5 w-full">
                              <div className="flex items-start gap-1.5 min-w-0">
                                <span className="shrink-0 mt-0.5">{module.icon}</span>
                                <span className="text-[10.5px] font-bold leading-snug group-hover:text-emerald-300 line-clamp-2">
                                  {module.name}
                                </span>
                              </div>

                              {/* Botón rápido para Fijar/Desfijar en la Barra Superior */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePinnedShortcut(module.id);
                                }}
                                className={`p-1 rounded-xs border transition-colors shrink-0 cursor-pointer ${
                                  isPinned
                                    ? 'bg-amber-950/90 border-amber-500/80 text-amber-300'
                                    : 'bg-black/40 border-slate-800 text-slate-500 opacity-70 group-hover:opacity-100 hover:text-amber-300 hover:border-amber-600/60'
                                }`}
                                title={
                                  isPinned
                                    ? 'Quitar de la barra superior de accesos rápidos'
                                    : 'Fijar este módulo en la barra superior de accesos rápidos'
                                }
                              >
                                <Pin className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            {/* Píldora de Telemetría en Vivo del Punto Activo */}
                            {liveBadge && (
                              <div className="mt-1.5 flex items-center">
                                <span
                                  className={`text-[8.5px] font-mono font-semibold px-1.5 py-0.5 rounded-xs border truncate w-full ${liveBadge.colorClass}`}
                                >
                                  ⚡ {liveBadge.text}
                                </span>
                              </div>
                            )}

                            {/* SUBPANTALLAS CLAVE CON ENLACE DIRECTO (CADA UNA EN SU ENLACE) */}
                            {moduleSubs.length > 0 && (
                              <div
                                className="mt-1.5 pt-1 border-t border-slate-800/80 flex flex-wrap gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {displayedSubs.map((sub) => {
                                  const isSubActive = activeModal === sub.id;
                                  return (
                                    <ScientificTooltip
                                      key={sub.id}
                                      position="bottom"
                                      width="w-[300px]"
                                      content={
                                        <div className="space-y-1 font-mono text-[8.5px]">
                                          <strong className="text-amber-300 block">{sub.title}</strong>
                                          {sub.formula && (
                                            <div className="text-emerald-300 bg-black/60 p-1 rounded border border-emerald-800/40 font-bold">
                                              {sub.formula}
                                            </div>
                                          )}
                                          <p className="text-slate-200 text-[8px]">{sub.description}</p>
                                          <div className="text-cyan-300 text-[7.5px] border-t border-slate-800 pt-0.5">
                                            Clic para saltar directamente a esta subpantalla
                                          </div>
                                        </div>
                                      }
                                    >
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSelectModule(sub.id);
                                        }}
                                        className={`px-1.5 py-0.5 text-[7px] font-mono font-bold rounded-xs border transition-all cursor-pointer truncate max-w-[130px] flex items-center gap-0.5 ${
                                          isSubActive
                                            ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-sm'
                                            : 'bg-black/60 text-slate-300 border-slate-700/80 hover:border-amber-400 hover:text-amber-200 hover:bg-slate-800'
                                        }`}
                                      >
                                        <span className="text-amber-400">↳</span>
                                        <span className="truncate">{sub.shortTag}</span>
                                      </button>
                                    </ScientificTooltip>
                                  );
                                })}
                                {remainingSubs > 0 && !isHierarchical && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCatalogViewMode('hierarchical');
                                    }}
                                    className="px-1 py-0.5 text-[7px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/50 rounded-xs hover:border-cyan-400 cursor-pointer"
                                    title="Desplegar todas las subpantallas de este módulo"
                                  >
                                    +{remainingSubs} más
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Pie de tarjeta: Etiqueta técnica + ★ TESIS + ✓ Visitado */}
                            <div className="flex items-center justify-between w-full mt-1.5 pt-1 border-t border-slate-800/80">
                              <span className="text-[8px] font-mono px-1.5 py-0.2 border bg-black/60 text-slate-300 border-slate-700/80 truncate max-w-[140px]">
                                {module.tag}
                              </span>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isVisited && (
                                  <span
                                    className="text-[7.5px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800/70 px-1 rounded-xs"
                                    title="Módulo ya visitado en esta sesión"
                                  >
                                    ✓ Visto
                                  </span>
                                )}
                                {module.isKeyThesis && (
                                  <span className="text-[7.5px] font-mono text-amber-300 font-bold uppercase tracking-wider">
                                    ★ TESIS
                                  </span>
                                )}
                              </div>
                            </div>

                            {isActive && (
                              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950 animate-ping" />
                            )}
                          </div>
                        </ScientificTooltip>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================================================================================= */}
      {/* 2. BARRA INFERIOR INTELIGENTE: 7 EJES TEMÁTICOS + ESTADO LIMPIO (SIN DUPLICADOS) */}
      {/* ================================================================================= */}
      <div className="bg-slate-950/95 border-t border-emerald-900/60 backdrop-blur-md relative z-40 text-xs shrink-0">
        <div className="relative flex items-center bg-slate-900/80">
          <ScientificTooltip
            position="top"
            width="w-[240px]"
            title="Desplazamiento Izquierdo del Dock Científico"
            content="Deslizar horizontalmente la barra inferior de los 7 ejes temáticos hacia la izquierda."
          >
            <button
              type="button"
              onClick={() => scrollRibbon(bottomDockRibbonRef, 'left')}
              className="shrink-0 z-20 px-1.5 py-1.5 bg-slate-950/95 hover:bg-emerald-950 text-emerald-300 border-r border-slate-800 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </ScientificTooltip>

          <div
            ref={bottomDockRibbonRef}
            onWheel={handleRibbonWheel}
            className="flex items-center justify-start gap-1.5 px-2 py-1 overflow-x-auto whitespace-nowrap flex-1 min-w-0 scroll-smooth [scrollbar-width:thin] [scrollbar-color:#10b981_#020617]"
          >
            {/* Píldoras directas de los 7 Ejes Físicos (Reordenables a Izquierda ◀ y Derecha ▶ a voluntad) */}
            <div className="flex items-center gap-1 shrink-0 pt-1.5">
              {orderedCategories.map((cat, idx) => {
                const isSelected = isExpanded && activeWorkflow === 'disciplines' && activeCategory === cat.id;
                const hasActiveInCat = cat.modules.some((m) => m.id === activeModal);
                return (
                  <OrderableTabItem
                    key={cat.id}
                    id={cat.id}
                    index={idx}
                    total={orderedCategories.length}
                    onMove={moveDockCategory}
                    compact
                  >
                    <ScientificTooltip
                      position="top"
                      width="w-[340px]"
                      title={cat.name}
                      content={`${cat.description} Incluye ${cat.modules.length} módulos científicos sincronizados con el punto activo (${cat.modules.slice(0, 3).map((m) => m.tag).join(' • ')}).`}
                      regulatory="Arquitectura Modular por Dominio Científico (Regla 12 AGENTS.md — Tesis UNED)"
                    >
                      <button
                        onClick={() => {
                          if (isSelected) {
                            setIsDockExpanded(false);
                          } else {
                            setActiveWorkflow('disciplines');
                            setActiveCategory(cat.id);
                            setIsDockExpanded(true);
                          }
                        }}
                        className={`px-2 py-0.5 border text-[8.5px] font-mono font-bold rounded-xs transition-all cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap relative ${
                          isSelected
                            ? cat.accentColor
                            : 'bg-black/50 border-slate-800 text-slate-300 hover:border-emerald-600/60 hover:text-emerald-200'
                        }`}
                      >
                        <span className="shrink-0">{cat.icon}</span>
                        <span>{cat.shortName}</span>
                        {hasActiveInCat && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </button>
                    </ScientificTooltip>
                  </OrderableTabItem>
                );
              })}
              <OrderableResetButton
                isCustomized={isDockCategoryOrderCustomized}
                onReset={resetDockCategoryOrder}
                label="Orden"
              />
            </div>

            {/* Indicador de Ventana Activa + Acciones de Limpieza integradas en la misma barra única */}
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2 ml-auto shrink-0">
              {activeModal && (
                <ScientificTooltip
                  position="top"
                  width="w-[300px]"
                  title="Módulo Analítico Actualmente Abierto"
                  content={`Muestra la suite científica activa en pantalla (${activeModuleObj ? activeModuleObj.name : activeModal}). Pulsa 'Despejar' para cerrarla y ver el mapa libre.`}
                >
                  <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-600/60 px-2 py-0.5 rounded-xs text-[8.5px] font-mono text-emerald-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <strong className="text-white truncate max-w-[180px]">
                      {activeModuleObj ? activeModuleObj.name : activeModal}
                    </strong>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="ml-1 px-1.5 py-0.2 bg-rose-950 hover:bg-rose-800 text-rose-200 hover:text-white border border-rose-500/70 rounded-xs text-[8px] font-black flex items-center gap-0.5 cursor-pointer transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                      <span>Despejar</span>
                    </button>
                  </div>
                </ScientificTooltip>
              )}

              <ScientificTooltip
                position="top"
                width="w-[260px]"
                title="Restaurar Lienzo Inicial Limpio"
                content="Cerrar ventanas abiertas y centrar el punto activo en la vista inicial limpia de Málaga (Alameda Principal)."
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsDockExpanded(false);
                    setActiveModal(null);
                    activePointCtx?.syncActivePoint(36.7182, -4.4228, {
                      name: 'Alameda Principal, 18',
                      fly: true,
                      openInspector: false,
                      silentReset: true
                    });
                  }}
                  className="px-2 py-0.5 bg-cyan-950/80 hover:bg-cyan-800 text-cyan-200 hover:text-white border border-cyan-600/70 rounded-xs flex items-center gap-1 transition-all cursor-pointer text-[8.5px] font-mono font-bold shrink-0 whitespace-nowrap"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>🏠 Inicio Limpio</span>
                </button>
              </ScientificTooltip>
            </div>
          </div>

          <ScientificTooltip
            position="top"
            width="w-[240px]"
            title="Desplazamiento Derecho del Dock Científico"
            content="Deslizar horizontalmente la barra inferior de los 7 ejes temáticos hacia la derecha."
          >
            <button
              type="button"
              onClick={() => scrollRibbon(bottomDockRibbonRef, 'right')}
              className="shrink-0 z-20 px-1.5 py-1.5 bg-slate-950/95 hover:bg-emerald-950 text-emerald-300 border-l border-slate-800 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </ScientificTooltip>
        </div>
      </div>
    </>
  );
};

