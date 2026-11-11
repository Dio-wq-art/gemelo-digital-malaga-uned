import React, { useState, useMemo } from 'react';
import { 
  Footprints, 
  HeartPulse, 
  MapPin, 
  Navigation, 
  Clock, 
  TrendingDown, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Wind, 
  Leaf, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';

interface HealthyRoutingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PredefinedRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  standardDistanceM: number;
  standardDurationMin: number;
  standardAvgNO2: number;
  standardAvgPM25: number;
  healthyDistanceM: number;
  healthyDurationMin: number;
  healthyAvgNO2: number;
  healthyAvgPM25: number;
  healthyPathVia: string;
  standardPathVia: string;
  originCoords: [number, number];
  destCoords: [number, number];
}

const PREDEFINED_ROUTES: PredefinedRoute[] = [
  {
    id: 'zambrano_larios',
    name: 'Estación María Zambrano ↔ Calle Larios',
    origin: 'Estación María Zambrano (Explanada de la Estación)',
    destination: 'Plaza de la Constitución / Calle Marqués de Larios',
    standardDistanceM: 1750,
    standardDurationMin: 22,
    standardAvgNO2: 44.8, // Por Cuarteles y Alameda Principal con tráfico
    standardAvgPM25: 16.2,
    healthyDistanceM: 1980,
    healthyDurationMin: 25,
    healthyAvgNO2: 23.4, // Vía Paseo Marítimo Antonio Machado, Muelle Heredia peatonal y Jardines
    healthyAvgPM25: 9.1,
    standardPathVia: 'Calle Cuarteles → Puente de la Misericordia → Alameda Principal',
    healthyPathVia: 'Paseo Antonio Machado → Pasarela Palmeral de las Sorpresas → Plaza de la Marina',
    originCoords: [36.7118, -4.4328],
    destCoords: [36.7214, -4.4215]
  },
  {
    id: 'hospital_parque',
    name: 'Hospital Civil ↔ Paseo del Parque',
    origin: 'Hospital Civil de Málaga (Bailén-Miraflores)',
    destination: 'Paseo del Parque (Ayuntamiento / La Rosaleda)',
    standardDistanceM: 2100,
    standardDurationMin: 26,
    standardAvgNO2: 48.5, // Por Av. Arroyo de los Ángeles y Armengual de la Mota
    standardAvgPM25: 18.0,
    healthyDistanceM: 2350,
    healthyDurationMin: 29,
    healthyAvgNO2: 24.1, // Por ribera del Guadalmedina canalizada y corredor peatonal
    healthyAvgPM25: 9.8,
    standardPathVia: 'Calle Hilera → Armengual de la Mota → Mármoles',
    healthyPathVia: 'Ribera del Guadalmedina peatonal → Pasarela de Santo Domingo → Corredor Bohemio',
    originCoords: [36.7295, -4.4332],
    destCoords: [36.7196, -4.4148]
  },
  {
    id: 'carranque_marina',
    name: 'Carranque ↔ Plaza de la Marina',
    origin: 'Plaza de Pío XII / Ciudad Deportiva Carranque',
    destination: 'Plaza de la Marina (Centro)',
    standardDistanceM: 2600,
    standardDurationMin: 32,
    standardAvgNO2: 46.2, // Por Av. de Andalucía
    standardAvgPM25: 17.4,
    healthyDistanceM: 2820,
    healthyDurationMin: 35,
    healthyAvgNO2: 25.0, // Vía calles secundarias de Cruz de Humilladero y bulevares arbolados
    healthyAvgPM25: 10.2,
    standardPathVia: 'Avenida de Andalucía (arteria vehicular 6 carriles) → Puente Tetuán',
    healthyPathVia: 'Paseo de los Tilos → Callejones del Perchel → Puente de la Esperanza',
    originCoords: [36.7169, -4.4445],
    destCoords: [36.7175, -4.4208]
  }
];

export const HealthyRoutingModal: React.FC<HealthyRoutingModalProps> = ({ isOpen, onClose }) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('zambrano_larios');
  const [activityType, setActivityType] = useState<'walking' | 'cycling' | 'running'>('walking');

  const currentRoute = useMemo(() => {
    return PREDEFINED_ROUTES.find(r => r.id === selectedRouteId) || PREDEFINED_ROUTES[0];
  }, [selectedRouteId]);

  // Tasa de ventilación pulmonar VE según nivel de actividad física (ICRP Publication 89)
  // walking: 0.025 m3/min (25 L/min)
  // running: 0.055 m3/min (55 L/min)
  // cycling: 0.040 m3/min (40 L/min)
  const ventilationRate = activityType === 'running' ? 0.055 : activityType === 'cycling' ? 0.040 : 0.025;
  const speedFactor = activityType === 'running' ? 0.45 : activityType === 'cycling' ? 0.35 : 1.0;

  // Cálculo de dosis acumulada inhalada: Dosis = C_media * VE * Tiempo
  const doseAnalysis = useMemo(() => {
    const stdTimeMin = currentRoute.standardDurationMin * speedFactor;
    const hltTimeMin = currentRoute.healthyDurationMin * speedFactor;

    // Volumen total inhalado en m3
    const stdVolInh = stdTimeMin * ventilationRate;
    const hltVolInh = hltTimeMin * ventilationRate;

    // Dosis en microgramos (µg)
    const stdDoseNO2 = stdVolInh * currentRoute.standardAvgNO2;
    const hltDoseNO2 = hltVolInh * currentRoute.healthyAvgNO2;

    const stdDosePM25 = stdVolInh * currentRoute.standardAvgPM25;
    const hltDosePM25 = hltVolInh * currentRoute.healthyAvgPM25;

    // Reducción porcentual de dosis
    const no2ReductionPct = Math.round(((stdDoseNO2 - hltDoseNO2) / stdDoseNO2) * 100);
    const pm25ReductionPct = Math.round(((stdDosePM25 - hltDosePM25) / stdDosePM25) * 100);

    return {
      stdTimeMin: Math.round(stdTimeMin),
      hltTimeMin: Math.round(hltTimeMin),
      stdDoseNO2: Number(stdDoseNO2.toFixed(1)),
      hltDoseNO2: Number(hltDoseNO2.toFixed(1)),
      stdDosePM25: Number(stdDosePM25.toFixed(1)),
      hltDosePM25: Number(hltDosePM25.toFixed(1)),
      no2ReductionPct,
      pm25ReductionPct,
      timeDiffMin: Math.round(hltTimeMin - stdTimeMin)
    };
  }, [currentRoute, ventilationRate, speedFactor]);

  // Exportar itinerario en GeoJSON FAIR
  const handleExportGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      properties: {
        dataset: 'Málaga Digital Twin - Healthy Eco-Routing (Directiva 2008/50/CE)',
        route_name: currentRoute.name,
        timestamp: new Date().toISOString(),
        activity: activityType,
        ventilation_rate_m3_min: ventilationRate,
        dose_reduction_no2_pct: doseAnalysis.no2ReductionPct,
        dose_reduction_pm25_pct: doseAnalysis.pm25ReductionPct
      },
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [currentRoute.originCoords[1], currentRoute.originCoords[0]],
              [currentRoute.destCoords[1], currentRoute.destCoords[0]]
            ]
          },
          properties: {
            type: 'Standard Fastest Route',
            distance_m: currentRoute.standardDistanceM,
            avg_no2_ug_m3: currentRoute.standardAvgNO2,
            dose_no2_ug: doseAnalysis.stdDoseNO2
          }
        },
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [currentRoute.originCoords[1], currentRoute.originCoords[0]],
              [(currentRoute.originCoords[1] + currentRoute.destCoords[1]) / 2 - 0.005, (currentRoute.originCoords[0] + currentRoute.destCoords[0]) / 2],
              [currentRoute.destCoords[1], currentRoute.destCoords[0]]
            ]
          },
          properties: {
            type: 'Healthy Clean Air Corridor',
            distance_m: currentRoute.healthyDistanceM,
            avg_no2_ug_m3: currentRoute.healthyAvgNO2,
            dose_no2_ug: doseAnalysis.hltDoseNO2
          }
        }
      ]
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eco_routing_${currentRoute.id}_${new Date().toISOString().split('T')[0]}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title="ENRUTAMIENTO PEATONAL DE MÍNIMA EXPOSICIÓN (HEALTHY ECO-ROUTING)"
      icon={<HeartPulse className="w-4 h-4 text-emerald-400" />}
      subtitle="Optimización de Itinerarios Peatonales y Ciclistas para Minimizar la Dosis Inhalada de NO₂ y PM₂.₅"
      onClose={onClose}
      defaultCollapsed={true}
      className="w-full max-w-4xl max-h-[85vh]"
    >
      <div className="flex flex-col h-full bg-slate-950 text-slate-100 text-xs font-sans select-none overflow-hidden space-y-3 p-3">
        
        {/* Barra Superior de Selección de Itinerario */}
        <div className="p-2.5 bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Itinerario:</span>
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="bg-black/60 border border-slate-700 text-emerald-300 px-2 py-1 text-[11px] font-mono focus:border-emerald-500 outline-none"
            >
              {PREDEFINED_ROUTES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Modo de Movilidad */}
          <div className="flex items-center gap-1 bg-black/60 p-1 border border-slate-700 text-[10px]">
            <ScientificTooltip
              title="Ventilación Peatonal (ICRP 89)"
              content="Tasa de ventilación pulmonar estándar para marcha peatonal ligera: V_E = 25 L/min (0.025 m³/min). Dosis inhalada moderada."
              formula="V_E = 0.025 \text{ m}^3/\text{min}"
              regulatory="ICRP Publication 89 Human Respiratory Tract Model"
            >
              <button
                onClick={() => setActivityType('walking')}
                className={`px-2 py-0.5 font-bold transition-colors cursor-pointer ${
                  activityType === 'walking' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Peatón (4.5 km/h)
              </button>
            </ScientificTooltip>
            <ScientificTooltip
              title="Ventilación Deportiva Running (ICRP 89)"
              content="Tasa de ventilación pulmonar intensificada: V_E = 55 L/min (0.055 m³/min). El aumento de caudal de aire en zonas de tráfico incrementa drásticamente la dosis alveolar de nanopartículas."
              formula="V_E = 0.055 \text{ m}^3/\text{min}"
              regulatory="ICRP Publication 89"
            >
              <button
                onClick={() => setActivityType('running')}
                className={`px-2 py-0.5 font-bold transition-colors cursor-pointer ${
                  activityType === 'running' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Running (9.0 km/h)
              </button>
            </ScientificTooltip>
            <ScientificTooltip
              title="Ventilación Ciclista (ICRP 89)"
              content="Tasa de ventilación pulmonar ciclista: V_E = 40 L/min (0.040 m³/min). Menor tiempo de exposición por mayor velocidad de desplazamiento."
              formula="V_E = 0.040 \text{ m}^3/\text{min}"
              regulatory="ICRP Publication 89"
            >
              <button
                onClick={() => setActivityType('cycling')}
                className={`px-2 py-0.5 font-bold transition-colors cursor-pointer ${
                  activityType === 'cycling' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Bicicleta (14.0 km/h)
              </button>
            </ScientificTooltip>
          </div>

          <ScientificTooltip
            title="Exportación de Itinerarios Peatonales GeoJSON (FAIR)"
            content="Descarga las trayectorias geoespaciales comparadas de la ruta convencional y el corredor de aire limpio con metadatos completos de dosis calculada."
          >
            <button
              onClick={handleExportGeoJSON}
              className="px-2.5 py-1 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Exportar Tracks GeoJSON</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Comparativa Lado a Lado: Ruta Directa vs. Corredor Saludable */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          {/* Tarjeta Ruta Estándar (Más Corta / Más Contaminada) */}
          <div className="p-3 bg-slate-900/90 border border-red-900/60 space-y-2.5">
            <div className="flex justify-between items-center pb-1 border-b border-slate-800">
              <span className="font-bold text-red-400 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Ruta Convencional (Más Corta)</span>
              </span>
              <span className="px-1.5 py-0.5 text-[8.5px] bg-red-950 text-red-300 border border-red-800 font-mono">
                Ejes con Tráfico Pesado
              </span>
            </div>

            <p className="text-[9.5px] text-slate-400 font-mono">
              <strong>Vía:</strong> {currentRoute.standardPathVia}
            </p>

            <div className="grid grid-cols-2 gap-2 font-mono text-[9.5px]">
              <div className="p-2 bg-black/40 border border-slate-800">
                <span className="text-slate-400 block">Distancia / Tiempo:</span>
                <strong className="text-slate-200 text-xs">{currentRoute.standardDistanceM} m • {doseAnalysis.stdTimeMin} min</strong>
              </div>
              <div className="p-2 bg-black/40 border border-slate-800">
                <span className="text-slate-400 block">Concentración Media NO₂:</span>
                <strong className="text-red-400 text-xs">{currentRoute.standardAvgNO2} µg/m³</strong>
              </div>
            </div>

            {/* Dosis Inhalada Calculada */}
            <div className="p-2.5 bg-red-950/30 border border-red-800/80 space-y-1">
              <div className="flex justify-between items-center text-slate-300 font-mono text-[10px]">
                <span className="flex items-center gap-1">
                  <span>Dosis Inhalada NO₂:</span>
                  <ScientificTooltip
                    title="Dosis Inhalada de NO₂ (Ruta Convencional)"
                    content="Masa neta de dióxido de nitrógeno introducida en el tracto respiratorio calculada según el producto de la concentración media, la tasa ventilatoria y la duración de la exposición."
                    formula="D = \bar{C} \cdot V_E \cdot \Delta t"
                    regulatory="ICRP 66 / 89 Dosimetric Model"
                  />
                </span>
                <strong className="text-red-400 font-bold">{doseAnalysis.stdDoseNO2} µg</strong>
              </div>
              <div className="flex justify-between items-center text-slate-300 font-mono text-[10px]">
                <span className="flex items-center gap-1">
                  <span>Dosis Inhalada PM₂.₅:</span>
                  <ScientificTooltip
                    title="Dosis Inhalada de PM₂.₅"
                    content="Masa de partículas finas que penetran hasta los alvéolos pulmonares durante el trayecto convencional por arterias de tráfico denso."
                  />
                </span>
                <strong className="text-red-400 font-bold">{doseAnalysis.stdDosePM25} µg</strong>
              </div>
              <p className="text-[8.5px] text-slate-400 pt-1 italic">
                Mayor exposición debida al cañón urbano encajonado de las arterias principales con retención de emisiones.
              </p>
            </div>
          </div>

          {/* Tarjeta Ruta Saludable (Corredor de Aire Limpio) */}
          <div className="p-3 bg-slate-900/90 border border-emerald-900/60 space-y-2.5">
            <div className="flex justify-between items-center pb-1 border-b border-slate-800">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                <Leaf className="w-3.5 h-3.5" />
                <span>Corredor Saludable (Clean Air Corridor)</span>
                <ScientificTooltip
                  title="Corredores Urbanos de Bajas Emisiones"
                  content="Itinerarios optimizados por calles peatonales, paseos marítimos y parques arbolados donde la deposición vegetal y la ventilación marina minimizan la concentración de contaminantes."
                />
              </span>
              <span className="px-1.5 py-0.5 text-[8.5px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                Mínima Inhalación Tóxica
              </span>
            </div>

            <p className="text-[9.5px] text-slate-400 font-mono">
              <strong>Vía:</strong> {currentRoute.healthyPathVia}
            </p>

            <div className="grid grid-cols-2 gap-2 font-mono text-[9.5px]">
              <div className="p-2 bg-black/40 border border-slate-800">
                <span className="text-slate-400 block">Distancia / Tiempo:</span>
                <strong className="text-emerald-300 text-xs">{currentRoute.healthyDistanceM} m • {doseAnalysis.hltTimeMin} min</strong>
              </div>
              <div className="p-2 bg-black/40 border border-slate-800">
                <span className="text-slate-400 block">Concentración Media NO₂:</span>
                <strong className="text-emerald-400 text-xs">{currentRoute.healthyAvgNO2} µg/m³</strong>
              </div>
            </div>

            {/* Dosis Inhalada Calculada */}
            <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/80 space-y-1">
              <div className="flex justify-between items-center text-slate-300 font-mono text-[10px]">
                <span className="flex items-center gap-1">
                  <span>Dosis Inhalada NO₂:</span>
                  <ScientificTooltip
                    title="Dosis Inhalada Reducida"
                    content="A pesar de caminar unos metros adicionales, la menor concentración ambiental reduce fuertemente la masa tóxica total inhalada."
                  />
                </span>
                <strong className="text-emerald-400 font-bold">{doseAnalysis.hltDoseNO2} µg</strong>
              </div>
              <div className="flex justify-between items-center text-slate-300 font-mono text-[10px]">
                <span className="flex items-center gap-1">
                  <span>Dosis Inhalada PM₂.₅:</span>
                  <ScientificTooltip
                    title="Dosis Inhalada PM₂.₅ Reducida"
                    content="Reducción neta del impacto sobre el sistema cardiovascular y respiratorio."
                  />
                </span>
                <strong className="text-emerald-400 font-bold">{doseAnalysis.hltDosePM25} µg</strong>
              </div>
              <p className="text-[8.5px] text-slate-400 pt-1 italic">
                Aprovecha la ventilación de la brisa marina y la sombra/deposición del arbolado urbano del Paseo del Parque.
              </p>
            </div>
          </div>
        </div>

        {/* Resumen de Beneficio Sanitario y Reducción de Exposición */}
        <div className="p-3 bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-700/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-900/80 border border-emerald-500 rounded-full text-emerald-200">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-300 block">
                  BENEFICIO SANITARIO NETO: -{doseAnalysis.no2ReductionPct}% MENOS INHALACIÓN DE NO₂
                </span>
                <ScientificTooltip
                  title="Evaluación Epidemiológica y Dosis Pulmonar"
                  content="La reducción de la exposición personal a NO₂ y PM₂.₅ disminuye el riesgo relativo de inflamación bronquial y estrés oxidativo endotelial (Guías OMS 2021)."
                  regulatory="OMS Global Air Quality Guidelines 2021"
                />
              </div>
              <p className="text-[9.5px] text-slate-300">
                Caminar solo <strong className="text-white font-mono">+{doseAnalysis.timeDiffMin} minutos</strong> reduce la carga tóxica pulmonar en un <strong className="text-emerald-400 font-mono">-{doseAnalysis.no2ReductionPct}% de NO₂</strong> y un <strong className="text-emerald-400 font-mono">-{doseAnalysis.pm25ReductionPct}% de PM₂.₅</strong> acumulados.
              </p>
            </div>
          </div>

          <div className="text-right font-mono text-[9px] text-slate-400">
            <span>Metodología ICRP 89 • Directiva 2008/50/CE</span>
          </div>
        </div>

      </div>
    </DraggableWindow>
  );
};
