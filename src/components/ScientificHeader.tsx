import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Compass,
  FileText,
  Database,
  ShieldCheck,
  Globe,
  Sparkles,
  Atom,
  Sliders,
  Maximize2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  FileSpreadsheet,
  CheckCircle2,
  ScatterChart,
  PanelLeft,
  Activity,
  Cpu,
  Pin
} from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { VramTelemetryMonitor } from './VramTelemetryMonitor';
import { TelemetryFreshnessPopover } from './TelemetryFreshnessBanner';
import { TelemetryAudit } from '../lib/verifier';
import { InstancedBinaryBuffers } from '../lib/instancedPollutantEngine';
import { useActivePoint } from '../context/ActivePointContext';
import { evaluateNormativeStatus } from '../lib/normativeStandards';
import { TOTAL_KEY_THESIS_MODULES } from './IntelligentDockTabs';
import { useUIStore } from '../store/uiStore';
import { SYSTEM_PROPAGATION } from '../lib/systemPropagationEngine';
import { PinnedShortcutsBar } from './PinnedShortcutsBar';
import { useOrderableIds, OrderableTabItem, OrderableResetButton } from './OrderableTabRow';
import {
  initializeAutomaticMultiDeviceSync,
  getWorkspaceSyncStatus,
  WorkspaceSyncStatus
} from '../lib/workspaceCloudSync';
import { getMasterThesisPdfCatalog } from '../lib/universalPdfLiveSyncEngine';

interface ScientificHeaderProps {
  activeModal: string | null;
  setActiveModal: (modalId: string | null) => void;
  telemetryAudit: TelemetryAudit | null;
  showDeckGLMesh: boolean;
  instancedBuffers: InstancedBinaryBuffers | null;
  handleForceGC: () => void;
  showLeftSidebar: boolean;
  setShowLeftSidebar: (show: boolean) => void;
  showRightSidebar: boolean;
  setShowRightSidebar: (show: boolean) => void;
  loading: boolean;
  dataTimestamps?: Record<string, number>;
  isSyncingTelemetry?: boolean;
  onRefreshTelemetry?: () => void;
  onStartScreenCrop?: () => void;
}

export const ScientificHeader: React.FC<ScientificHeaderProps> = ({
  activeModal,
  setActiveModal,
  telemetryAudit,
  showDeckGLMesh,
  instancedBuffers,
  handleForceGC,
  showLeftSidebar,
  setShowLeftSidebar,
  showRightSidebar,
  setShowRightSidebar,
  loading,
  dataTimestamps = {},
  isSyncingTelemetry = false,
  onRefreshTelemetry,
  onStartScreenCrop
}) => {
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const row1ScrollRef = useRef<HTMLDivElement>(null);
  const row2ScrollRef = useRef<HTMLDivElement>(null);

  const scrollHorizontalBar = (ref: React.RefObject<HTMLDivElement | null>, offset: number) => {
    if (ref.current) {
      ref.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleHorizontalWheel = (e: React.WheelEvent<HTMLDivElement>, ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      ref.current.scrollLeft += e.deltaY;
    }
  };

  const isDockExpanded = useUIStore((state) => state.isDockExpanded);
  const toggleDock = useUIStore((state) => state.toggleDock);
  const pinnedShortcuts = useUIStore((state) => state.pinnedShortcuts);
  const [isShortcutsRowOpen, setIsShortcutsRowOpen] = useState(false);

  // Asimilación activa y estado normativo europeo en tiempo real
  const activePointCtx = useActivePoint();
  const assimilation = activePointCtx?.assimilation;
  const streetDisplayName = activePointCtx?.activePoint?.nearestStreetName
    || activePointCtx?.activePoint?.name
    || "Punto Activo";

  const [cloudSyncStatus, setCloudSyncStatus] = useState<WorkspaceSyncStatus>(() =>
    getWorkspaceSyncStatus({
      lat: activePointCtx?.activePoint?.lat ?? 36.7168,
      lon: activePointCtx?.activePoint?.lon ?? -4.4234,
      address: streetDisplayName
    })
  );

  useEffect(() => {
    initializeAutomaticMultiDeviceSync();
    const updateStatus = () => {
      setCloudSyncStatus(
        getWorkspaceSyncStatus({
          lat: activePointCtx?.activePoint?.lat ?? 36.7168,
          lon: activePointCtx?.activePoint?.lon ?? -4.4234,
          address: streetDisplayName
        })
      );
    };
    updateStatus();
    window.addEventListener('doctoral-workspace-sync-updated', updateStatus);
    return () => window.removeEventListener('doctoral-workspace-sync-updated', updateStatus);
  }, [activePointCtx?.activePoint?.lat, activePointCtx?.activePoint?.lon, streetDisplayName]);

  const normativeStatus = React.useMemo(() => {
    const no2 = Number((assimilation?.no2PedestrianLevel1_8mUgM3 ?? activePointCtx?.data?.no2_satelite_base ?? 22.0).toFixed(1));
    const pm25 = assimilation?.pm25UgM3 ?? activePointCtx?.data?.pm2_5 ?? 9.5;
    const pm10 = assimilation?.pm10UgM3 ?? activePointCtx?.data?.pm10 ?? 18.0;
    const o3 = assimilation?.ozoneO3UgM3 ?? activePointCtx?.data?.ozone ?? 65.0;

    return evaluateNormativeStatus({ no2, pm25, pm10, o3 });
  }, [assimilation, activePointCtx?.data]);

  const defaultHeaderTabIds = React.useMemo(
    () => [
      'director',
      'portable_cloud_sync',
      'shortcuts',
      'observatory',
      'fair_vram',
      'guide',
      'gemini_crop',
      'export_fair'
    ],
    []
  );
  const {
    orderedIds: orderedHeaderIds,
    moveItem: moveHeaderTab,
    resetOrder: resetHeaderOrder,
    isCustomized: isHeaderOrderCustomized
  } = useOrderableIds('scientific_header_row1', defaultHeaderTabIds);

  const toggleExportDropdown = () => {
    if (!isExportDropdownOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        right: Math.max(10, window.innerWidth - rect.right)
      });
    }
    setIsExportDropdownOpen(!isExportDropdownOpen);
  };

  // Close dropdowns on click outside & window resize
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideTrigger = dropdownRef.current && dropdownRef.current.contains(target);
      const isInsideMenu = exportMenuRef.current && exportMenuRef.current.contains(target);
      if (!isInsideTrigger && !isInsideMenu) {
        setIsExportDropdownOpen(false);
      }
    };
    const handleResize = () => {
      if (isExportDropdownOpen && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + 6,
          right: Math.max(10, window.innerWidth - rect.right)
        });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [isExportDropdownOpen]);

  return (
    <header className="bg-slate-950 border-b border-slate-800 flex flex-col shrink-0 relative z-[200] select-none">
      {/* ========================================================================= */}
      {/* FILA 1: BARRA DESLIZANTE CONTINUA (TODO JUNTO SIN ESPACIOS EN NEGRO)      */}
      {/* ========================================================================= */}
      <div className="relative flex items-center bg-slate-950 h-[38px] px-2">
        {/* Contenedor Deslizante Continuo (Todo Junto, Cero Huecos Negros) */}
        <div
          ref={row1ScrollRef}
          onWheel={(e) => handleHorizontalWheel(e, row1ScrollRef)}
          className="flex-1 flex items-center justify-start gap-1.5 overflow-x-auto whitespace-nowrap py-1 scroll-smooth no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {/* 1. Identidad Institucional con Tooltip Científico y Divulgativo */}
          <ScientificTooltip
            position="bottom"
            width="w-[380px]"
            title="Gemelo Digital Informado por la Física (Tesis Doctoral UNED — Málaga)"
            formula="\mathcal{L}_{\text{PINN}} = \mathcal{L}_{\text{obs}}(24+16) + \lambda_{\text{PDE}}\|\partial_t C + \mathbf{u}\cdot\nabla C - \nabla\cdot(K\nabla C) - R_{\text{chem}}\|_2^2"
            regulatory="Programa de Doctorado UNED • Directiva (UE) 2024/2881 & Guía EMEP/EEA"
            citation="Raissi et al. (2019) J. Comput. Phys.; Oke (1987); Seinfeld & Pandis (2016)"
            content={`Sistema determinista de asimilación continua de datos observacionales en tiempo real (${SYSTEM_PROPAGATION.sensorNetwork.totalTerrestrial} estaciones terrestres + ${SYSTEM_PROPAGATION.sensorNetwork.totalSatellites} misiones satelitales) acoplado a ecuaciones diferenciales de transporte turbulento, fotoquímica de Leighton y emisiones COPERT 5 en Málaga (Punto activo: ${streetDisplayName}).`}
          >
            <div className="flex items-center gap-1.5 shrink-0 pr-1.5 border-r border-slate-800 cursor-help">
              <div className="relative flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 font-mono text-[10.5px] font-black tracking-tight text-emerald-400 leading-none">
                  <span>GEMELO DIGITAL DE MÁLAGA</span>
                  <span className="text-[8px] px-1 py-0.2 bg-emerald-950/80 border border-emerald-700/60 rounded text-emerald-300 font-bold">v2.5</span>
                </div>
                <span className="text-[6.8px] font-mono text-slate-400 tracking-tight uppercase leading-tight mt-0.5">
                  Físico-Informado • Movilidad &amp; NO₂ • Tesis UNED
                </span>
              </div>
            </div>
          </ScientificTooltip>

          {/* 2..8 Pestañas y Controles de Cabecera Reordenables a Izquierda ◀ y Derecha ▶ a voluntad */}
          {(() => {
            const headerItemsMap: Record<string, React.ReactNode> = {
              director: (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="hidden 2xl:inline-block px-1 py-0.5 bg-slate-900 border border-slate-700 text-slate-400 font-mono text-[7px] font-bold uppercase rounded-xs">
                    [I. TESIS UNED]
                  </span>
                  <ScientificTooltip
                    position="bottom"
                    width="w-[400px]"
                    title="Directrices del Director de Tesis — Camino a la Defensa UNED (Regla 20 • OE1–OE4 + 5 Bloques + 8 Anexos / 13 Tablas PDF)"
                    formula="\mathcal{M}_{\text{Director}} = \Big\{\text{OE1--OE4},\; \mathbf{X}_{\text{10ctrl}},\; \text{Taxonomía } [\text{OBS}|\text{DERIV}|\text{MOD}],\; \mathcal{L}_{\text{PINN-6.4}},\; \hat{\theta}_{\text{DML-ZBE}}\Big\}"
                    content={`Abrir la Consola Maestra de Directrices del Director de Tesis (100% reactiva a ${streetDisplayName}): • Los ${SYSTEM_PROPAGATION.directorGuidelinesProtocol.coreBlocksCount} Bloques Metodológicos + ${SYSTEM_PROPAGATION.directorGuidelinesProtocol.empiricalAnnexesCount} Anexos Empíricos (${SYSTEM_PROPAGATION.directorGuidelinesProtocol.totalPdfTablesCount} Tablas con Impresión PDF Extensa Multipágina A4) • Semáforo 5 Checks "Ready for Defense" • Comparador Bipuntual A/B • Párrafo Académico y LaTeX Booktabs • Receptor de futuras órdenes del Director.`}
                    laymanExplanation="Abre la ventana principal donde están respondidos punto por punto todos los objetivos, tablas y requisitos marcados por tu Director de Tesis en la UNED."
                    regulatory="Regla 20 AGENTS.md — Dirección de Tesis Doctoral UNED (EIDUNED)"
                    citation="Raissi, M. et al. (2019). J. Comput. Phys., 378, 686–707; Chernozhukov, V. et al. (2018). Econometrics J., 21(1), C1–C68."
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          (window as any).__forceExpandNextModal = true;
                        }
                        setActiveModal('thesisMethodologySuite');
                      }}
                      className={`px-2.5 py-1 border transition-all flex items-center gap-1 font-mono font-black text-[8.5px] uppercase tracking-tight rounded-sm cursor-pointer shrink-0 ${
                        activeModal === 'thesisMethodologySuite'
                          ? 'bg-sky-500 text-slate-950 border-white shadow-[0_0_12px_rgba(14,165,233,0.65)] ring-1 ring-sky-200'
                          : 'bg-slate-900 hover:bg-sky-950/90 text-sky-200 hover:text-white border-sky-500/80 shadow-xs'
                      }`}
                    >
                      <span>📕 {SYSTEM_PROPAGATION.directorGuidelinesProtocol.headerButtonLabel}</span>
                    </button>
                  </ScientificTooltip>
                </div>
              ),
              portable_cloud_sync: (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="hidden 2xl:inline-block px-1 py-0.5 bg-slate-900 border border-slate-700 text-slate-400 font-mono text-[7px] font-bold uppercase rounded-xs">
                    [II. RESPALDO]
                  </span>
                  <ScientificTooltip
                    position="bottom"
                    width="w-[390px]"
                    title={`Continuidad Total PC ↔ Nube ↔ iPad ↔ Pendrive USB (${cloudSyncStatus.verificationCode})`}
                    formula="S_{\text{total}} = S_{\text{PC}} \cup S_{\text{iPad}} \cup S_{\text{USB}} \quad (\text{Máquina del Tiempo 5 Puntos})"
                    regulatory="Ciencia Abierta FAIR & Blindaje Doctoral Multidispositivo UNED"
                    content={`Abrir la Consola de Sincronización en Nube y Pack USB 1-Clic: • Estado actual: ${
                      cloudSyncStatus.mode === 'CLOUD_LIVE' ? '🟢 Sincronizado en Servidor Central' : '🟠 Guardado Local Autónomo'
                    } (${cloudSyncStatus.verificationCode}) • Pack USB Completo en 1 Clic (Ejecutable .HTML de Doble Motor Online/Offline + Snapshot .JSON + 3 PDFs A4) • Máquina del Tiempo (${cloudSyncStatus.restorePointsCount}/5 puntos) • Seguro Modo Defensa (${
                      cloudSyncStatus.defenseLockActive ? 'ON 🔒' : 'OFF'
                    }).`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          (window as any).__forceExpandNextModal = true;
                        }
                        setActiveModal(activeModal === 'portableCloudSync' ? null : 'portableCloudSync');
                      }}
                      className={`px-2 py-1 border transition-all flex items-center gap-1.5 font-mono font-black text-[8.5px] uppercase tracking-tight rounded-sm cursor-pointer shrink-0 ${
                        activeModal === 'portableCloudSync'
                          ? 'bg-sky-500 text-slate-950 border-white shadow-[0_0_12px_rgba(14,165,233,0.6)]'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-600/90 hover:border-sky-400'
                      }`}
                    >
                      <span>📦 CLOUD SYNC, GITHUB &amp; USB</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          cloudSyncStatus.mode === 'CLOUD_LIVE'
                            ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                            : 'bg-amber-400'
                        }`}
                      />
                      {cloudSyncStatus.defenseLockActive && <span title="Seguro Modo Defensa Activo">🔒</span>}
                    </button>
                  </ScientificTooltip>
                </div>
              ),
              shortcuts: (
                <ScientificTooltip
                  position="bottom"
                  width="w-[320px]"
                  title="Barra Desplegable de Atajos Directos (Alt + 1..9)"
                  content={`Desplegar u ocultar la cinta rápida de ${pinnedShortcuts.length} subpestañas favoritas fijadas (Sondeo 0-50m, Ciclo de Leighton, Sensibilidad de Sobol, Dosimetría ICRP 66, COPERT 5, Regímenes de Oke). Los atajos de teclado Alt+1 a Alt+9 funcionan siempre aunque la barra esté plegada.`}
                  regulatory="Ergonomía Cartográfica & Anti-Saturación (Regla 12 AGENTS.md)"
                >
                  <button
                    type="button"
                    onClick={() => setIsShortcutsRowOpen((prev) => !prev)}
                    className={`px-2 py-1 border transition-all flex items-center gap-1 font-mono font-bold text-[8.5px] uppercase tracking-tight rounded-sm cursor-pointer shrink-0 ${
                      isShortcutsRowOpen
                        ? 'bg-sky-900/90 text-sky-100 border-sky-400'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-sky-400'
                    }`}
                  >
                    <Pin className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                    <span>ATAJOS ({pinnedShortcuts.length})</span>
                    <span className="text-[7px] text-sky-300">{isShortcutsRowOpen ? '▴' : '▾'}</span>
                  </button>
                </ScientificTooltip>
              ),
              observatory: (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="hidden 2xl:inline-block px-1 py-0.5 bg-slate-900 border border-slate-700 text-slate-400 font-mono text-[7px] font-bold uppercase rounded-xs">
                    [III. RED 24+16]
                  </span>
                  <div className="flex items-center bg-slate-900 border border-slate-700 hover:border-emerald-500/80 rounded-sm shrink-0">
                    <ScientificTooltip
                      position="bottom"
                      width="w-[340px]"
                      title="Observatorio Oficial Terrestre y Satelital"
                      content={SYSTEM_PROPAGATION.observatoryTooltip}
                      regulatory="Directiva 2008/50/CE & Directiva (UE) 2024/2881"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (activeModal !== 'audit' && typeof window !== 'undefined') {
                            (window as any).__forceExpandNextModal = true;
                          }
                          setActiveModal(activeModal === 'audit' ? null : 'audit');
                        }}
                        className={`px-1.5 2xl:px-2 py-1 transition-all flex items-center gap-1 font-bold font-mono text-[8px] 2xl:text-[8.5px] uppercase tracking-tight cursor-pointer whitespace-nowrap shrink-0 ${
                          activeModal === 'audit'
                            ? 'bg-emerald-950 text-emerald-200'
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isSyncingTelemetry ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 shadow-[0_0_6px_#10b981]'}`} />
                        <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{SYSTEM_PROPAGATION.observatoryCapsule}</span>
                        <span className="text-[7px] bg-emerald-950 text-emerald-300 border border-emerald-600/80 px-1 py-0.2 rounded-xs font-bold">
                          EN VIVO
                        </span>
                      </button>
                    </ScientificTooltip>

                    <div className="border-l border-slate-700 shrink-0">
                      <TelemetryFreshnessPopover 
                        timestamps={dataTimestamps} 
                        isSyncing={isSyncingTelemetry}
                        onRefresh={onRefreshTelemetry}
                      />
                    </div>
                  </div>
                </div>
              ),
              fair_vram: (
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-sm shrink-0">
                  <ScientificTooltip
                    position="bottom"
                    width="w-[300px]"
                    title="Verificador Criptográfico de Integridad (SHA-256)"
                    content="Certifica que el 100% de los datos provienen de APIs oficiales en vivo y ecuaciones deterministas (Regla 1), midiendo latencia real y generando sello SHA-256."
                    regulatory="Principios FAIR & Guía ISO/IEC 98-3 (GUM)"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (activeModal !== 'systemIntegrityAudit' && typeof window !== 'undefined') {
                          (window as any).__forceExpandNextModal = true;
                        }
                        setActiveModal(activeModal === 'systemIntegrityAudit' ? null : 'systemIntegrityAudit');
                      }}
                      className={`px-1.5 py-0.5 border transition-all flex items-center gap-1 font-bold rounded-xs cursor-pointer whitespace-nowrap shrink-0 ${
                        activeModal === 'systemIntegrityAudit'
                          ? 'bg-sky-950 text-sky-200 border-sky-400 text-[7.5px] font-mono'
                          : 'bg-black/40 border-slate-800 text-slate-300 hover:text-sky-300 text-[7.5px] font-mono'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3 text-sky-400 shrink-0" />
                      <span>FAIR ✓</span>
                    </button>
                  </ScientificTooltip>

                  <VramTelemetryMonitor
                    showDeckGL={showDeckGLMesh}
                    buffers={instancedBuffers}
                    onForceGC={handleForceGC}
                  />
                </div>
              ),
              guide: (
                <ScientificTooltip 
                  position="bottom" 
                  width="w-[300px]" 
                  title="Guía Metodológica & Estado Normativo"
                  content={`Guía Interactiva & Normativa del Gemelo Digital: Recorrido metodológico por los componentes de la tesis. Estado Asimilado: ${normativeStatus.label} (${normativeStatus.directiveCitation}). Determinante: ${normativeStatus.worstPollutant} (${normativeStatus.worstPollutantValue} ${normativeStatus.worstPollutantUnit}).`}
                  regulatory="Directiva 2008/50/CE & Guías OMS 2021"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (activeModal !== 'userGuide' && typeof window !== 'undefined') {
                        (window as any).__forceExpandNextModal = true;
                      }
                      setActiveModal(activeModal === 'userGuide' ? null : 'userGuide');
                    }}
                    className={`flex items-center gap-1 border px-1.5 py-1 text-[8px] font-bold uppercase tracking-tight transition-all rounded-sm cursor-pointer whitespace-nowrap shrink-0 ${
                      activeModal === 'userGuide'
                        ? 'bg-sky-950 text-sky-100 border-sky-400 shadow-sm'
                        : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-sky-400'
                    }`}
                  >
                    <Compass className="w-3 h-3 text-sky-400" />
                    <span>GUÍA</span>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: normativeStatus.colorHex }} />
                  </button>
                </ScientificTooltip>
              ),
              gemini_crop: onStartScreenCrop ? (
                <ScientificTooltip
                  position="bottom"
                  width="w-[320px]"
                  title="Análisis Visual Multimodal (Recorte de Pantalla)"
                  content="Encuadrar cualquier región de la pantalla (mapa, gráficos, cañones o tablas) para obtener explicaciones científicas inmediatas sobre la zona capturada, con opción de guardar e imprimir el dictamen doctoral."
                >
                  <button
                    type="button"
                    onClick={onStartScreenCrop}
                    className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-sky-400 px-1.5 2xl:px-2 py-1 text-[8px] font-bold uppercase tracking-tight rounded-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
                    <span>ENCUADRAR · GEMINI</span>
                  </button>
                </ScientificTooltip>
              ) : null,
              export_fair: (
                <div className="relative flex items-center gap-1 shrink-0" ref={dropdownRef}>
                  <span className="hidden 2xl:inline-block px-1 py-0.5 bg-slate-900 border border-slate-700 text-slate-400 font-mono text-[7px] font-bold uppercase rounded-xs">
                    [IV. PDFs &amp; FAIR]
                  </span>
                  <ScientificTooltip
                    position="bottom"
                    width="w-[330px]"
                    content={`Biblioteca Viva de Todos los PDFs (${getMasterThesisPdfCatalog().totalCatalogCount} generadores activos sincronizados en tiempo real con Regla 27) y Exportación Abierta FAIR: Visualizar en pantalla, imprimir, compartir o descargar cualquier PDF de la tesis explicando para qué sirve cada uno, sin quitar ninguno de su ventana original.`}
                  >
                    <div className="flex items-center bg-slate-900 hover:bg-slate-800 border border-sky-600/80 rounded-sm">
                      <button
                        type="button"
                        onClick={() => {
                          if (activeModal !== 'fairDataExporter') {
                            (window as any).__forceExpandNextModal = true;
                          }
                          setActiveModal(activeModal === 'fairDataExporter' ? null : 'fairDataExporter');
                        }}
                        className="flex items-center gap-1 text-sky-100 px-1.5 2xl:px-2 py-1 text-[8px] font-bold uppercase tracking-tight transition-colors cursor-pointer"
                      >
                        <FileText className="w-3 h-3 text-sky-400 shrink-0" />
                        <span>📑 CENTRO PDFs ({getMasterThesisPdfCatalog().totalCatalogCount}) &amp; FAIR</span>
                      </button>
                      <button
                        type="button"
                        onClick={toggleExportDropdown}
                        className="px-1 py-1 text-sky-300 hover:text-white border-l border-slate-700 transition-colors cursor-pointer"
                      >
                        <ChevronDown className={`w-3 h-3 transition-transform ${isExportDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </ScientificTooltip>
                </div>
              )
            };

            const activeIds = orderedHeaderIds.filter((id) => headerItemsMap[id] != null);

            return (
              <>
                {activeIds.map((id, idx) => (
                  <OrderableTabItem
                    key={id}
                    id={id}
                    index={idx}
                    total={activeIds.length}
                    onMove={moveHeaderTab}
                    compact
                  >
                    {headerItemsMap[id]}
                  </OrderableTabItem>
                ))}
                <OrderableResetButton
                  isCustomized={isHeaderOrderCustomized}
                  onReset={resetHeaderOrder}
                  label="Orden"
                />
              </>
            );
          })()}

          <div>

          {isExportDropdownOpen && dropdownPos && createPortal(
            <div 
              ref={exportMenuRef}
              onClick={(e) => e.stopPropagation()}
              className="fixed w-76 bg-slate-950 border border-indigo-800/80 shadow-[0_12px_35px_rgba(0,0,0,0.95)] z-[99999] p-1 font-mono text-[9px] rounded-sm backdrop-blur-md animate-in fade-in duration-100 pointer-events-auto"
              style={{ top: `${dropdownPos.top}px`, right: `${dropdownPos.right}px` }}
            >
              <div className="px-2 py-1 text-[7.5px] uppercase tracking-widest text-indigo-400 font-bold border-b border-indigo-900/60 flex items-center justify-between">
                <span>BIBLIOTECA VIVA DE PDFs &amp; FAIR</span>
                <span className="text-[7px] text-amber-300 font-bold">{getMasterThesisPdfCatalog().totalCatalogCount} PDFs en vivo</span>
              </div>

              <div className="flex flex-col gap-0.5 mt-1">
                {/* BIBLIOTECA VIVA DE TODOS LOS PDFs DE LA APP */}
                <ScientificTooltip position="left" width="w-[320px]" content="Abre la pestaña maestra que reúne TODOS los PDFs de la aplicación explicando para qué sirve cada uno, cuándo entregárselo al Director/Tribunal, qué datos en vivo inyecta y permitiendo Visualizar, Imprimir, Compartir o Descargar (dejando además cada PDF en su sitio original).">
                  <button
                    onClick={() => {
                      (window as any).__forceExpandNextModal = true;
                      setActiveModal('fairDataExporter');
                      setIsExportDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 p-1.5 text-left text-slate-100 hover:bg-amber-950/80 hover:text-amber-200 transition-colors w-full rounded-xs cursor-pointer border-b border-amber-700/60 pb-2 bg-amber-950/35"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div className="flex flex-col truncate">
                      <span className="font-bold text-amber-300 flex items-center gap-1">
                        <span>📑 Biblioteca Viva de Todos los PDFs ({getMasterThesisPdfCatalog().totalCatalogCount})</span>
                        <span className="text-[6.5px] px-1 py-0.2 bg-amber-900/80 border border-amber-500 rounded text-amber-200 font-mono">VER / IMPRIMIR</span>
                      </span>
                      <span className="text-[7.5px] text-slate-300">Explicación de cada PDF • Visualizar, Imprimir, Compartir y Descargar</span>
                    </div>
                  </button>
                </ScientificTooltip>

                {/* OPCIÓN ESTRELLA: MONOGRAFÍA Q1 DEL PUNTO ACTIVO */}
                <ScientificTooltip position="left" width="w-[300px]" content="Descargar la monografía científica Q1 (8 páginas) para el punto activo o zona seleccionada con formato de artículo formal indexado (Elsevier Atmospheric Environment).">
                  <button
                    onClick={() => {
                      setActiveModal('q1PaperMonograph');
                      setIsExportDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 p-1.5 text-left text-slate-200 hover:bg-emerald-950/80 hover:text-emerald-200 transition-colors w-full rounded-xs cursor-pointer border-b border-emerald-900/60 pb-2 bg-emerald-950/30"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <div className="flex flex-col truncate">
                      <span className="font-bold text-emerald-300 flex items-center gap-1">
                        <span>Paper Q1 Zona Activa (PDF)</span>
                        <span className="text-[6.5px] px-1 py-0.2 bg-emerald-900 border border-emerald-500 rounded text-emerald-200 font-mono">PUNTO ACTIVO</span>
                      </span>
                      <span className="text-[7.5px] text-slate-400">8 Págs • OSPM + Leighton + ICRP 66 + Dir 2024/2881</span>
                    </div>
                  </button>
                </ScientificTooltip>

                <ScientificTooltip position="left" width="w-[310px]" content={`Descargar la Memoria Técnica y Metrológica Doctoral (5 páginas A4) con el censo de ${SYSTEM_PROPAGATION.sensorNetwork.totalTerrestrial} estaciones terrestres (normas CEN/ISO/WMO, z_inlet, U95 y matriz de atribución EnKF al Punto Activo), ${SYSTEM_PROPAGATION.sensorNetwork.totalSatellites} misiones satelitales (5 constelaciones, factor AMF-3D) y formulación matemática PINN.`}>
                  <button
                    onClick={async () => {
                      setIsExportDropdownOpen(false);
                      try {
                        const { generateDetectorsInventoryPdf } = await import('../lib/detectorsPdfGenerator');
                        const doc = generateDetectorsInventoryPdf({
                          activePoint: {
                            name: streetDisplayName,
                            district: activePointCtx?.activePoint?.districtName,
                            neighborhood: activePointCtx?.activePoint?.neighborhoodName,
                            lat: activePointCtx?.activePoint?.lat,
                            lon: activePointCtx?.activePoint?.lon,
                            elevationM: activePointCtx?.activePoint?.elevationM,
                            canyonAspectRatioHW: activePointCtx?.activePoint?.aspectRatioHw,
                            skyViewFactor: activePointCtx?.activePoint?.skyViewFactorSvf,
                            no2UgM3: assimilation?.no2PedestrianLevel1_8mUgM3 ?? activePointCtx?.data?.no2_satelite_base,
                            o3UgM3: assimilation?.ozoneO3UgM3 ?? activePointCtx?.data?.ozone,
                            pm25UgM3: assimilation?.pm25UgM3 ?? activePointCtx?.data?.pm2_5,
                            pm10UgM3: assimilation?.pm10UgM3 ?? activePointCtx?.data?.pm10,
                            windSpeedKmh: activePointCtx?.data?.velocidad_viento_km_h,
                            windDirDeg: activePointCtx?.data?.direccion_viento_grados,
                            temperatureC: activePointCtx?.data?.temperatura_malaga,
                            relativeHumidityPct: activePointCtx?.data?.humedad_relativa
                          }
                        });
                        doc.save(`Memoria_Metrologica_Detectores_Malaga_${SYSTEM_PROPAGATION.sensorNetwork.totalTerrestrial}_${SYSTEM_PROPAGATION.sensorNetwork.totalSatellites}.pdf`);
                      } catch (e) {
                        window.open('/api/download-sensors-pdf', '_blank');
                      }
                    }}
                    className="flex items-center gap-2 p-1.5 text-left text-slate-200 hover:bg-rose-950/70 hover:text-rose-200 transition-colors w-full rounded-xs cursor-pointer border-b border-slate-800/80 pb-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <div className="flex flex-col truncate">
                      <span className="font-bold text-rose-300">Censo Detectores PDF ({SYSTEM_PROPAGATION.sensorNetwork.totalTerrestrial}+{SYSTEM_PROPAGATION.sensorNetwork.totalSatellites})</span>
                      <span className="text-[7.5px] text-slate-400">5 Págs • Metrología CEN/WMO + Matriz EnKF + AMF-3D</span>
                    </div>
                  </button>
                </ScientificTooltip>

                <ScientificTooltip position="left" width="w-[280px]" content="Generar informe doctoral completo en PDF de alta resolución con vista ortofotográfica, balances PINN y trazabilidad normativa.">
                  <button
                    onClick={() => {
                      setActiveModal('highResPdfReport');
                      setIsExportDropdownOpen(false);
                    }}
                    disabled={loading}
                    className="flex items-center gap-2 p-1.5 text-left text-slate-200 hover:bg-emerald-950/60 hover:text-emerald-300 transition-colors w-full rounded-xs disabled:opacity-40 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <div className="flex flex-col truncate">
                      <span className="font-bold">Informe Doctoral (PDF HD)</span>
                      <span className="text-[7.5px] text-slate-400">Captura ortofotográfica + balances PINN</span>
                    </div>
                  </button>
                </ScientificTooltip>

                <ScientificTooltip position="left" width="w-[280px]" content="Exportar conjuntos de datos abiertos FAIR en GeoJSON y series temporales horarias CSV con sellado hash criptográfico.">
                  <button
                    onClick={() => {
                      setActiveModal('fairDataExporter');
                      setIsExportDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 p-1.5 text-left text-slate-200 hover:bg-indigo-950/60 hover:text-indigo-300 transition-colors w-full rounded-xs cursor-pointer border-b border-slate-800/60 pb-1.5"
                  >
                    <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <div className="flex flex-col truncate">
                      <span className="font-bold">Exportación FAIR (Open Science)</span>
                      <span className="text-[7.5px] text-slate-400">GeoJSON mallas 3D + CSV series temporales</span>
                    </div>
                  </button>
                </ScientificTooltip>

                <ScientificTooltip position="left" width="w-[300px]" content="Generador a la carta de cualquier tipo de estudio, informe técnico, auditoría normativa o monografía doctoral en PDF con directrices personalizadas libres.">
                  <button
                    onClick={() => {
                      setActiveModal('customPdfReport');
                      setIsExportDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 p-1.5 text-left text-slate-200 hover:bg-sky-950/70 hover:text-sky-200 transition-colors w-full rounded-xs cursor-pointer border-b border-slate-800/60 pb-1.5 bg-sky-950/20"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <div className="flex flex-col truncate">
                      <span className="font-bold text-sky-300 flex items-center gap-1">
                        <span>Informes &amp; Estudios PDF a la Carta</span>
                        <span className="text-[6.5px] px-1 py-0.2 bg-emerald-900 border border-emerald-500 rounded text-emerald-200 font-mono">NUEVO</span>
                      </span>
                      <span className="text-[7.5px] text-slate-400">Personalizable • Directriz Libre • 2 a 10 Págs</span>
                    </div>
                  </button>
                </ScientificTooltip>

                <ScientificTooltip position="left" width="w-[280px]" content="Generar código fuente LaTeX estandarizado de tablas cinéticas, morfológicas y citas BibTeX para la memoria de tesis doctoral.">
                  <button
                    onClick={() => {
                      setActiveModal('latexThesisExporter');
                      setIsExportDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 p-1.5 text-left text-slate-200 hover:bg-purple-950/60 hover:text-purple-300 transition-colors w-full rounded-xs cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <div className="flex flex-col truncate">
                      <span className="font-bold">Tablas LaTeX para Tesis</span>
                      <span className="text-[7.5px] text-slate-400">Código fuente de tablas y bibliografía BibTeX</span>
                    </div>
                  </button>
                </ScientificTooltip>
              </div>
            </div>,
            document.body
          )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILA 2: BARRA CONTINUA DE ATAJOS DIRECTOS (PLEGABLE PARA NO SATURAR)      */}
      {/* ========================================================================= */}
      <div className={isShortcutsRowOpen ? "relative h-[28px] bg-slate-950/95 border-t border-slate-800/80 px-2 flex items-center" : "hidden"}>
        <div
          ref={row2ScrollRef}
          onWheel={(e) => handleHorizontalWheel(e, row2ScrollRef)}
          className="flex-1 flex items-center justify-start gap-1.5 overflow-x-auto whitespace-nowrap py-0.5 scroll-smooth no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <PinnedShortcutsBar />
        </div>
      </div>
    </header>
  );
};

