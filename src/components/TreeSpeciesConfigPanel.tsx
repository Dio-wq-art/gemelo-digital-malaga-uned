import React, { useState } from 'react';
import { ScientificTooltip } from './ScientificTooltip';
import {
  MALAGA_SPECIES_CATALOG,
  TreeSpeciesAntiPollutionProfile,
  recalculateSpeciesDryDeposition
} from '../lib/malagaTreesInventory';
import { useUIStore } from '../store/uiStore';
import {
  Settings,
  Sliders,
  RotateCcw,
  Save,
  Download,
  Info,
  Trees,
  Leaf,
  Wind,
  Sun,
  Activity,
  CheckCircle2,
  Sparkles,
  Search,
  Filter,
  Layers,
  ArrowRightLeft
} from 'lucide-react';

interface TreeSpeciesConfigPanelProps {
  onClose?: () => void;
  embedded?: boolean;
}

export function TreeSpeciesConfigPanel({ onClose, embedded = false }: TreeSpeciesConfigPanelProps) {
  const {
    speciesPhysicsOverrides,
    updateSpeciesPhysicsOverride,
    resetSpeciesPhysicsOverrides
  } = useUIStore();

  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('platanus');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFoliage, setFilterFoliage] = useState<string>('all');
  const [saveToast, setSaveToast] = useState(false);

  // Environmental conditions for test simulation
  const [testEnv, setTestEnv] = useState({
    solarRadWm2: 650,
    tempC: 25.0,
    u10Ms: 2.5,
    hrPct: 60.0
  });

  const filteredSpeciesList = MALAGA_SPECIES_CATALOG.filter(sp => {
    const matchesSearch = sp.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sp.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sp.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFoliage = filterFoliage === 'all' || sp.foliageType === filterFoliage;
    return matchesSearch && matchesFoliage;
  });

  const activeSpecies = MALAGA_SPECIES_CATALOG.find(s => s.id === selectedSpeciesId) || MALAGA_SPECIES_CATALOG[0];
  const activeOverrides = speciesPhysicsOverrides[activeSpecies.id] || {};

  // Current values
  const currentAlbedo = activeOverrides.albedoCanopy ?? activeSpecies.albedoCanopy ?? 0.18;
  const currentZ0 = activeOverrides.z0RoughnessM ?? activeSpecies.z0RoughnessM ?? 0.35;
  const currentCd = activeOverrides.cdDragCoef ?? activeSpecies.cdDragCoef ?? 0.20;
  const currentLai = activeOverrides.defaultLAI ?? activeSpecies.defaultLAI ?? 4.0;

  // Base physics vs Adjusted physics
  const basePhysics = recalculateSpeciesDryDeposition(
    activeSpecies,
    {
      albedoCanopy: activeSpecies.albedoCanopy ?? 0.18,
      z0RoughnessM: activeSpecies.z0RoughnessM ?? 0.35,
      cdDragCoef: activeSpecies.cdDragCoef ?? 0.20,
      defaultLAI: activeSpecies.defaultLAI ?? 4.0
    },
    testEnv
  );

  const adjustedPhysics = recalculateSpeciesDryDeposition(
    activeSpecies,
    {
      albedoCanopy: currentAlbedo,
      z0RoughnessM: currentZ0,
      cdDragCoef: currentCd,
      defaultLAI: currentLai
    },
    testEnv
  );

  const deltaVdNO2Pct = (((adjustedPhysics.vdNO2 - basePhysics.vdNO2) / Math.max(0.01, basePhysics.vdNO2)) * 100).toFixed(1);

  const handleUpdateField = (field: 'albedoCanopy' | 'z0RoughnessM' | 'cdDragCoef' | 'defaultLAI', val: number) => {
    updateSpeciesPhysicsOverride(activeSpecies.id, {
      ...activeOverrides,
      [field]: val
    });
  };

  const handleResetCurrentSpecies = () => {
    updateSpeciesPhysicsOverride(activeSpecies.id, {
      albedoCanopy: activeSpecies.albedoCanopy ?? 0.18,
      z0RoughnessM: activeSpecies.z0RoughnessM ?? 0.35,
      cdDragCoef: activeSpecies.cdDragCoef ?? 0.20,
      defaultLAI: activeSpecies.defaultLAI ?? 4.0
    });
  };

  const handleExportJson = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      thesisModule: "Configuración de Especies Arbóreas - Parámetros Físicos PINN Málaga",
      customOverrides: speciesPhysicsOverrides,
      speciesCatalog: MALAGA_SPECIES_CATALOG.map(sp => {
        const ov = speciesPhysicsOverrides[sp.id] || {};
        const phys = recalculateSpeciesDryDeposition(sp, ov, testEnv);
        return {
          id: sp.id,
          commonName: sp.commonName,
          scientificName: sp.scientificName,
          calibratedAlbedo: phys.alpha,
          calibratedZ0RoughnessM: phys.z0,
          calibratedCdDrag: phys.cd,
          calibratedLAI: phys.lai,
          calculatedVdNO2_cm_s: phys.vdNO2,
          calculatedRa_s_m: phys.ra,
          calculatedRb_s_m: phys.rb,
          calculatedRc_s_m: phys.rc,
          pinnSinkTermUgM3s: phys.pinnSinkTermUgM3s
        };
      })
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Malaga_TreeSpecies_PINN_PhysicsConfig_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col h-full bg-slate-950 text-slate-100 font-sans ${embedded ? 'p-0' : 'p-4'}`}>
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/90 border border-emerald-500/40 rounded-lg mb-4 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-950 border border-emerald-500/60 rounded-md text-emerald-400">
            <Settings className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide text-emerald-200 uppercase font-mono">
                Configuración de Especies Arbóreas • Parámetros PINN
              </h2>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-700/80 text-[9px] px-2 py-0.5 rounded font-mono font-bold">
                Tesis Doctoral
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Ajuste fino de Albedo foliar (&alpha;), Rugosidad aerodinámica (z₀) y Arrastre (C_d) para calibrar la deposición seca (v_d) en el operador de física residual PINN.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          <ScientificTooltip content="Restablecer todos los parámetros biofísicos de las especies a sus valores certificados de laboratorio y literatura internacional.">
            <button
              onClick={() => {
                resetSpeciesPhysicsOverrides();
                setSaveToast(true);
                setTimeout(() => setSaveToast(false), 2500);
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>RESTABLECER TODO</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip content="Exportar archivo JSON con la matriz completa de parámetros calibrados (albedos, LAI, resistencias estomáticas) para auditoría FAIR.">
            <button
              onClick={handleExportJson}
              className="px-2.5 py-1 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 border border-emerald-600 rounded flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              <Download className="w-3 h-3 text-emerald-300" />
              <span>EXPORTAR CONFIG. FAIR</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {saveToast && (
        <div className="mb-3 p-2 bg-emerald-950/90 border border-emerald-400 text-emerald-200 text-xs rounded font-mono flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Configuración física de especies sincronizada atómicamente con la Red Neuronal PINN y los visualizadores en vivo.</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-hidden">
        {/* Left Column: Species Selector & Catalog List */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
              <Trees className="w-4 h-4 text-emerald-400" />
              ESPECIES DE MÁLAGA ({MALAGA_SPECIES_CATALOG.length})
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              {Object.keys(speciesPhysicsOverrides).length} Calibradas
            </span>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar especie por nombre o calle..."
                className="w-full bg-slate-950 border border-slate-700 rounded text-xs pl-8 pr-2 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-1 font-mono text-[10px]">
              <span className="text-slate-400 flex items-center gap-1">
                <Filter className="w-3 h-3 text-slate-500" /> FOLLAJE:
              </span>
              <select
                value={filterFoliage}
                onChange={e => setFilterFoliage(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Todos</option>
                <option value="Caducifolio">Caducifolio</option>
                <option value="Perennifolio">Perennifolio</option>
                <option value="Marcescente">Marcescente</option>
                <option value="Palmera">Palmera</option>
              </select>
            </div>
          </div>

          {/* Species Scroll List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredSpeciesList.map(sp => {
              const isSelected = sp.id === activeSpecies.id;
              const hasCustom = !!speciesPhysicsOverrides[sp.id];
              const curPhys = recalculateSpeciesDryDeposition(sp, speciesPhysicsOverrides[sp.id], testEnv);

              return (
                <button
                  key={sp.id}
                  onClick={() => setSelectedSpeciesId(sp.id)}
                  className={`w-full text-left p-2 rounded border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold font-mono truncate">{sp.commonName}</span>
                      {hasCustom && (
                        <span className="text-[8px] bg-amber-950 text-amber-300 border border-amber-700 px-1 rounded font-mono font-bold">
                          CALIBRADO
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 italic truncate">{sp.scientificName}</p>
                  </div>

                  <div className="text-right font-mono text-[10px] shrink-0">
                    <div className="text-emerald-400 font-bold">Vd: {curPhys.vdNO2} cm/s</div>
                    <div className="text-slate-500 text-[9px]">&alpha;: {curPhys.alpha} | z0: {curPhys.z0}m</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Species Physics Editor & PINN Impact */}
        <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Selected Species Header */}
          <div className="bg-slate-950/80 border border-emerald-500/50 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-emerald-200 font-mono uppercase">
                  {activeSpecies.commonName} ({activeSpecies.scientificName})
                </h3>
                <span className="text-[9.5px] bg-emerald-900/80 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded font-mono font-bold">
                  {activeSpecies.foliageType}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                {activeSpecies.primaryRole}
              </p>
            </div>

            <ScientificTooltip content={`Restablecer los parámetros biofísicos de ${activeSpecies.commonName} a sus valores certificados de laboratorio.`}>
              <button
                onClick={handleResetCurrentSpecies}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-600/60 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span>Restablecer Especie</span>
              </button>
            </ScientificTooltip>
          </div>

          {/* Interactive Sliders Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slider 1: Albedo Foliar (alpha) */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <ScientificTooltip
                  position="top"
                  width="w-[320px]"
                  content="Albedo Folio-Canópico (&alpha;): Proporción de radiación solar de onda corta (SW) reflejada por el dosel. Un albedo menor (ej. 0.12 en coníferas) absorbe más radiación neta SW_net = (1 - &alpha;) * SW_inc, aumentando la energía fotosintética y estimulando la apertura estomática (g_s), lo que eleva Vd."
                >
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-mono cursor-help">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>ALBEDO CANÓPICO (&alpha;)</span>
                    <Info className="w-3 h-3 text-slate-500" />
                  </label>
                </ScientificTooltip>
                <span className="text-sm font-bold font-mono text-amber-200 bg-amber-950 px-2 py-0.5 rounded border border-amber-700">
                  {currentAlbedo.toFixed(2)}
                </span>
              </div>

              <input
                type="range"
                min="0.05"
                max="0.35"
                step="0.01"
                value={currentAlbedo}
                onChange={e => handleUpdateField('albedoCanopy', parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />

              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>0.05 (Pinus / Oscuro)</span>
                <span>0.18 (Plátano std)</span>
                <span>0.35 (Glauco / Claro)</span>
              </div>
            </div>

            {/* Slider 2: Rugosidad Aerodinámica z0 */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <ScientificTooltip
                  position="top"
                  width="w-[330px]"
                  content="Rugosidad Aerodinámica de Copa (z0_tree en metros): Define el perfil logarítmico de viento u(z) = (u*/k) * ln(z/z0). Una mayor rugosidad genera más turbulencia de fricción u*, reduciendo drásticamente la resistencia aerodinámica Ra y aumentando el flujo de deposición."
                >
                  <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 font-mono cursor-help">
                    <Wind className="w-3.5 h-3.5 text-cyan-400" />
                    <span>RUGOSIDAD AERODINÁMICA (z₀)</span>
                    <Info className="w-3 h-3 text-slate-500" />
                  </label>
                </ScientificTooltip>
                <span className="text-sm font-bold font-mono text-cyan-200 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-700">
                  {currentZ0.toFixed(2)} m
                </span>
              </div>

              <input
                type="range"
                min="0.02"
                max="1.20"
                step="0.01"
                value={currentZ0}
                onChange={e => handleUpdateField('z0RoughnessM', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />

              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>0.02 m (Césped)</span>
                <span>0.35 m (Arbolado medio)</span>
                <span>1.20 m (Ficus/Dosel frondoso)</span>
              </div>
            </div>

            {/* Slider 3: Coeficiente de Arrastre Aerodinámico Cd */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <ScientificTooltip
                  position="top"
                  width="w-[310px]"
                  content="Coeficiente de Arrastre Aerodinámico (C_d): Coeficiente adimensional de arrastre de la copa. Cuanto mayor es el C_d, mayor es la fuerza de resistencia al flujo de aire y mayor la captura física de partículas finas PM2.5."
                >
                  <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 font-mono cursor-help">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    <span>COEFICIENTE ARRASTRE (C_d)</span>
                    <Info className="w-3 h-3 text-slate-500" />
                  </label>
                </ScientificTooltip>
                <span className="text-sm font-bold font-mono text-emerald-200 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                  {currentCd.toFixed(2)}
                </span>
              </div>

              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.01"
                value={currentCd}
                onChange={e => handleUpdateField('cdDragCoef', parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />

              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>0.05 (Porosa / Palmera)</span>
                <span>0.20 (Promedio)</span>
                <span>0.50 (Denso / Ficus)</span>
              </div>
            </div>

            {/* Slider 4: Índice de Área Foliar LAI */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <ScientificTooltip
                  position="top"
                  width="w-[300px]"
                  content="Índice de Área Foliar (LAI en m²/m²): Superficie foliar unilateral por unidad de superficie de suelo. Multiplica la conductancia estomática canópica total G_c = LAI / r_s."
                >
                  <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 font-mono cursor-help">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>ÍNDICE ÁREA FOLIAR (LAI)</span>
                    <Info className="w-3 h-3 text-slate-500" />
                  </label>
                </ScientificTooltip>
                <span className="text-sm font-bold font-mono text-indigo-200 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-700">
                  {currentLai.toFixed(1)} m²/m²
                </span>
              </div>

              <input
                type="range"
                min="1.0"
                max="8.0"
                step="0.1"
                value={currentLai}
                onChange={e => handleUpdateField('defaultLAI', parseFloat(e.target.value))}
                className="w-full accent-indigo-400 cursor-pointer"
              />

              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>1.0 (Bajo / Inviernos)</span>
                <span>4.0 (Promedio)</span>
                <span>8.0 (Dosel Máximo)</span>
              </div>
            </div>
          </div>

          {/* Real-Time Physics Comparison Table */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col gap-3 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                EFECTO EN LA FÍSICA DE DEPOSICIÓN Y RESIDUO DE LA PINN
              </span>
              <span className="text-[10px] text-slate-400">
                Condición: SW = {testEnv.solarRadWm2} W/m² | T = {testEnv.tempC}°C | u₁₀ = {testEnv.u10Ms} m/s
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Vd NO₂ Base</span>
                <strong className="text-slate-300 text-sm">{basePhysics.vdNO2} cm/s</strong>
              </div>

              <div className="bg-emerald-950/80 p-2 rounded border border-emerald-500/60">
                <span className="text-[10px] text-emerald-300 block font-bold">Vd NO₂ Calibrado</span>
                <strong className="text-emerald-200 text-sm font-bold">{adjustedPhysics.vdNO2} cm/s</strong>
              </div>

              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Sensibilidad &Delta;Vd (%)</span>
                <strong className={`text-sm ${Number(deltaVdNO2Pct) >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {Number(deltaVdNO2Pct) >= 0 ? `+${deltaVdNO2Pct}%` : `${deltaVdNO2Pct}%`}
                </strong>
              </div>

              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Sumidero PINN S_dep</span>
                <strong className="text-cyan-300 text-xs">{adjustedPhysics.pinnSinkTermUgM3s} &mu;g/m³s</strong>
              </div>
            </div>

            {/* Detail Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10.5px] border-t border-slate-800/80 pt-2">
              <div className="flex justify-between p-1.5 bg-slate-900/60 rounded">
                <span className="text-slate-400">Velocidad Fricción u*:</span>
                <span className="text-cyan-300 font-bold">{adjustedPhysics.ustar} m/s</span>
              </div>
              <div className="flex justify-between p-1.5 bg-slate-900/60 rounded">
                <span className="text-slate-400">Resist. Aerodinámica Ra:</span>
                <span className="text-slate-200 font-bold">{adjustedPhysics.ra} s/m</span>
              </div>
              <div className="flex justify-between p-1.5 bg-slate-900/60 rounded">
                <span className="text-slate-400">Resist. Canópica Rc:</span>
                <span className="text-emerald-300 font-bold">{adjustedPhysics.rc} s/m</span>
              </div>
            </div>
          </div>

          {/* Doctoral Scientific Thesis Reference Footer */}
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-3 text-[10.5px] text-slate-300 font-mono leading-relaxed flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-200 block mb-0.5">Fundamentación Física y Ecuación Rectora PINN:</strong>
              El albedo foliar (&alpha;) modula la irradiancia neta SW_net = (1 - &alpha;) SW, dictando el término de ganancia térmica y la resistencia estomática de Wesely (R_c). La rugosidad aerodinámica de copa (z₀) define la fricción cortical u* y reduce la resistencia de transporte turbulento (R_a). Ambos parámetros alimentan el sumidero determinista S_dep en el residuo de PDE de la red neuronal informada por la física en Málaga.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
