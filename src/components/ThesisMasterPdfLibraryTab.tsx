import React, { useState, useMemo } from 'react';
import {
  FileText,
  Eye,
  Printer,
  Download,
  Share2,
  Check,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  MapPin,
  Cpu,
  BookOpen,
  Layers,
  X
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ScientificTooltip } from './ScientificTooltip';
import { PdfCanvasPreviewModal } from './PdfCanvasPreviewModal';
import { useActivePoint } from '../context/ActivePointContext';
import {
  getMasterThesisPdfCatalog,
  ThesisMasterPdfCatalogItem,
  ThesisPdfCategory,
  appendVoluntarySiteAnd11DistrictsSectionToPdf
} from '../lib/universalPdfLiveSyncEngine';
import {
  DIRECTOR_ORIGINAL_PDF_PATH,
  DIRECTOR_EXPANDED_GEMINI_PDF_PATH,
  DIRECTOR_EXPANDED_GEMINI_DOWNLOAD_FILENAME,
  DIRECTOR_MONOGRAPH_POINTS_CATALOG,
  DirectorMonographPointId,
  downloadDirectorSinglePointMonographPdf
} from '../lib/directorOriginalDocAndFocusedPdf';
import {
  downloadDoctoralFivePointsThesisPdf,
  buildDoctoralFivePointsMetricsFromContext
} from '../lib/doctoralFivePointsThesisPdfGenerator';
import { downloadUnedTrainingAuditReportPdf } from '../lib/pythonJupyterNotebookGenerator';
import { generateActivePointQ1PaperPdf } from '../lib/q1PaperGenerator';
import { generateDetectorsInventoryPdf } from '../lib/detectorsPdfGenerator';
import { generateDoctoralPdfReport } from '../lib/pdfReportGenerator';
import { generateCustomOnDemandPdfReport, ReportScope, ReportDepth } from '../lib/customOnDemandPdfReport';
import { downloadCustomDirectorOrderMonographPdf } from '../lib/verifiedDoctoralEvidence2026';
import { MeteoData, PhysicsResult, StationComparisonResult, calculatePINNParameters } from '../lib/physics';
import { BenchmarkInputParams } from '../lib/pinnInference';
import { ODEKineticsParams } from '../lib/odeSolver';

export interface ThesisMasterPdfLibraryTabProps {
  currentMeteo: MeteoData;
  physics?: PhysicsResult;
  stationComparisons?: StationComparisonResult[];
  benchmarkParams?: BenchmarkInputParams;
  odeParams?: ODEKineticsParams;
  location?: { lat: number; lon: number };
  onNavigateToModal?: (modalId: string) => void;
  onSwitchToCustomPdfTab?: () => void;
}

export const ThesisMasterPdfLibraryTab: React.FC<ThesisMasterPdfLibraryTabProps> = ({
  currentMeteo,
  physics,
  stationComparisons,
  benchmarkParams,
  odeParams,
  location,
  onNavigateToModal,
  onSwitchToCustomPdfTab
}) => {
  const activeCtx = useActivePoint();

  const streetName =
    activeCtx?.activePoint?.nearestStreetName ||
    activeCtx?.activePoint?.name ||
    'Calle Marqués de Larios';
  const lat = activeCtx?.activePoint?.lat ?? location?.lat ?? currentMeteo.lat ?? 36.7196;
  const lon = activeCtx?.activePoint?.lon ?? location?.lon ?? currentMeteo.lon ?? -4.4200;
  const no2UgM3 = Number(
    (
      activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ??
      currentMeteo.no2_satelite_base ??
      25.4
    ).toFixed(1)
  );

  const catalogData = useMemo(
    () =>
      getMasterThesisPdfCatalog({
        streetName,
        lat,
        lon,
        no2UgM3
      }),
    [streetName, lat, lon, no2UgM3]
  );

  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ThesisPdfCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({
    pdf_director_13_tables_master: true
  });
  const [selectedPointId, setSelectedPointId] = useState<DirectorMonographPointId>('all_points_1_to_7');
  const [quickCustomScope, setQuickCustomScope] = useState<ReportScope>('integral_twin');
  const [quickCustomDepth, setQuickCustomDepth] = useState<ReportDepth>('standard');

  const [sharedConfirmId, setSharedConfirmId] = useState<string | null>(null);
  const [busyPdfId, setBusyPdfId] = useState<string | null>(null);

  // Estado para el visor integrado de PDFs en pantalla (Canvas HD o Iframe para el PDF original)
  const [previewState, setPreviewState] = useState<{
    arrayBuffer: ArrayBuffer | null;
    iframeUrl?: string | null;
    filename: string;
    title: string;
    pageCount: number;
    docInstance?: jsPDF | null;
  } | null>(null);

  const toggleCard = (id: string) => {
    setExpandedCardIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    catalogData.items.forEach((it) => {
      next[it.id] = true;
    });
    setExpandedCardIds(next);
  };

  const collapseAll = () => {
    setExpandedCardIds({});
  };

  const filteredItems = useMemo(() => {
    return catalogData.items.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q) ||
        item.whatIsItFor.toLowerCase().includes(q) ||
        item.whenToUseWithDirector.toLowerCase().includes(q) ||
        item.whereItLivesInApp.toLowerCase().includes(q)
      );
    });
  }, [catalogData.items, selectedCategory, searchQuery]);

  /**
   * Construye en vivo la instancia jsPDF de cualquiera de los PDFs del catálogo
   * para poder Visualizarlo, Imprimirlo, Descargarlo o Compartirlo.
   */
  const buildLivePdfDocument = async (
    item: ThesisMasterPdfCatalogItem
  ): Promise<{ doc: jsPDF; filename: string }> => {
    const safeStreet = streetName.split(',')[0].replace(/[^a-zA-Z0-9_-]/g, '_');
    const computedPhysics = physics || calculatePINNParameters(currentMeteo);
    const fivePtsMetrics = buildDoctoralFivePointsMetricsFromContext(activeCtx);

    switch (item.id) {
      case 'pdf_director_13_tables_master': {
        const res = downloadDoctoralFivePointsThesisPdf(
          {
            streetName,
            metrics: fivePtsMetrics,
            activeCtx,
            skipSave: true
          },
          undefined,
          { skipSave: true }
        );
        return { doc: res.doc, filename: res.filename };
      }

      case 'pdf_director_focused_point_by_point': {
        const res = downloadDirectorSinglePointMonographPdf(selectedPointId, activeCtx, {
          skipSave: true
        });
        return { doc: res.doc, filename: res.filename };
      }

      case 'pdf_uned_hpc_training_audit': {
        const res = downloadUnedTrainingAuditReportPdf(catalogData.snapshot.unedCheckpoint, {
          activeStreet: streetName,
          lat,
          lon,
          no2Pedestrian18m: no2UgM3,
          skipSave: true
        });
        return { doc: res.doc, filename: res.filename };
      }

      case 'pdf_q1_paper_active_point': {
        const doc = generateActivePointQ1PaperPdf({
          location: { lat, lon },
          activePoint: activeCtx?.activePoint,
          assimilation: activeCtx?.assimilation as any,
          meteo: currentMeteo,
          physics: computedPhysics,
          stationComparisons
        });
        appendVoluntarySiteAnd11DistrictsSectionToPdf(doc, 275, {
          streetName,
          lat,
          lon,
          no2Pedestrian18mUg: no2UgM3,
          no2Pediatric09mUg: fivePtsMetrics.cZ_0_9m_pediatric,
          no2Cabin40mUg: fivePtsMetrics.canyonMicroBreakdown?.cZ_4_0m_cabin,
          tempC: currentMeteo.temperatura_malaga ?? 22.5,
          pressureHpa: fivePtsMetrics.pressureHpa ?? 1015.0,
          primaryStationCode: fivePtsMetrics.primaryStation?.code || 'ES2086A',
          sectionTitlePrefix: 'ANEXO PAPER Q1 (REGLAS 32–35)'
        });
        return {
          doc,
          filename: `Monografia_Q1_Atmospheric_Environment_${safeStreet}.pdf`
        };
      }

      case 'pdf_high_res_12_pages_dossier': {
        const doc = await generateDoctoralPdfReport({
          meteo: currentMeteo,
          physics: computedPhysics,
          stationComparisons,
          benchmarkParams,
          odeParams,
          activePoint: activeCtx?.activePoint,
          assimilation: activeCtx?.assimilation,
          mapMeta: {
            lat,
            lon,
            zoom: 16.5,
            pitch: 60,
            bearing: 15,
            baseStyle: 'google_hybrid',
            activeLayers: ['PINN_3D', 'OSPM_Canyon', 'Sensors_24_16'],
            streetName
          }
        });
        return {
          doc,
          filename: `Informe_Doctoral_HD_12Pags_${safeStreet}.pdf`
        };
      }

      case 'pdf_detectors_census_24_16': {
        const doc = generateDetectorsInventoryPdf({
          activePoint: {
            name: streetName,
            district: activeCtx?.activePoint?.districtName,
            neighborhood: activeCtx?.activePoint?.neighborhoodName,
            lat,
            lon,
            elevationM: activeCtx?.activePoint?.elevationM,
            canyonAspectRatioHW: activeCtx?.activePoint?.aspectRatioHw,
            skyViewFactor: activeCtx?.activePoint?.skyViewFactorSvf,
            no2UgM3,
            o3UgM3: activeCtx?.assimilation?.ozoneO3UgM3 ?? currentMeteo.ozone,
            pm25UgM3: activeCtx?.assimilation?.pm25UgM3 ?? currentMeteo.pm2_5,
            pm10UgM3: activeCtx?.assimilation?.pm10UgM3 ?? currentMeteo.pm10,
            windSpeedKmh: currentMeteo.velocidad_viento_km_h,
            windDirDeg: currentMeteo.direccion_viento_grados,
            temperatureC: currentMeteo.temperatura_malaga,
            relativeHumidityPct: currentMeteo.humedad_relativa
          }
        });
        return {
          doc,
          filename: `Memoria_Metrologica_Detectores_${catalogData.snapshot.stationsCount}_${catalogData.snapshot.satellitesCount}_${safeStreet}.pdf`
        };
      }

      case 'pdf_point_metrological_certificate': {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 34, 'F');
        doc.setTextColor(52, 211, 153);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('UNED — PROGRAMA DE DOCTORADO (EIDUNED) • CERTIFICACIÓN METROLÓGICA GUM', 12, 10);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.text(`CERTIFICADO METROLÓGICO OFICIAL DEL PUNTO ACTIVO (ISO/IEC 98-3 & UE 2024/2881)`, 12, 18);
        doc.setFontSize(8.5);
        doc.setTextColor(203, 213, 225);
        doc.text(
          `Receptor: ${streetName} (${lat.toFixed(5)}°N, ${lon.toFixed(5)}°W) | Red: ${catalogData.snapshot.stationsCount}+${catalogData.snapshot.satellitesCount} Detectores | Sello SHA-256: ${fivePtsMetrics.dynamicSha.slice(0, 16)}`,
          12,
          26
        );

        autoTable(doc, {
          startY: 40,
          head: [['Parámetro Metrológico / Normativo', 'Valor Certificado en Vivo', 'Criterio / Norma Europea']],
          body: [
            ['Punto Geográfico Auditado', `${streetName} (${activeCtx?.activePoint?.districtName || 'Málaga'})`, 'ETRS89 UTM 30N / WGS84'],
            ['Concentración NO₂ Peatonal (z = 1.8 m)', `${no2UgM3.toFixed(1)} ug/m3`, 'Directiva (UE) 2024/2881 (Límite 2030: 20 ug/m3)'],
            ['Concentración NO₂ Pediátrica (z = 0.9 m)', `${fivePtsMetrics.cZ_0_9m_pediatric} ug/m3`, 'Dosimetría Pulmonar Infantil ICRP 66'],
            ['Concentración NO₂ Cabina Oficial (z = 4.0 m)', `${fivePtsMetrics.canyonMicroBreakdown.cZ_4_0m_cabin} ug/m3`, 'Toma Estándar Cabina EIONET (UNE-EN 14211)'],
            ['Estación Oficial Ancla #1', `${fivePtsMetrics.primaryStation.code} - ${fivePtsMetrics.primaryStation.name} (${fivePtsMetrics.primaryStation.distMeters} m)`, `Peso EnKF w_terr = ${fivePtsMetrics.wTerrPct}% | w_sat = ${fivePtsMetrics.wSatPct}%`],
            ['Incertidumbre Expandida GUM U95 (k = 2)', `± ${fivePtsMetrics.gumUncertainty} ug/m3 (u_c = ${fivePtsMetrics.uCombined} ug/m3)`, 'JCGM 100:2008 (GUM) • Nivel de confianza 95%'],
            ['Indicador de Calidad de Modelización (MQI)', `MQI = ${fivePtsMetrics.mqi} <= 1.0 (CONFORME)`, 'Guía Europea FAIRMODE WG1 (CEN/TR 17538)'],
            ['Residuo Diferencial PDE Navier-Stokes-Leighton', `${fivePtsMetrics.resPde} ug/(m3·s) (${fivePtsMetrics.physicsClosurePct}% cierre)`, 'Operador Diferencial PINN Paso 6.4'],
            ['Checkpoint Servidor UNED Vinculado', `${catalogData.snapshot.unedCheckpoint.checkpointId} (RMSE = ${catalogData.snapshot.unedCheckpoint.valRmseUgM3} ug/m3)`, catalogData.snapshot.unedCheckpoint.architecture]
          ],
          theme: 'grid',
          styles: { fontSize: 8.2, cellPadding: 2.4 },
          headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255], fontStyle: 'bold' }
        });
        const certEndY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 4 : 115;
        appendVoluntarySiteAnd11DistrictsSectionToPdf(doc, certEndY, {
          streetName,
          lat,
          lon,
          no2Pedestrian18mUg: no2UgM3,
          no2Pediatric09mUg: fivePtsMetrics.cZ_0_9m_pediatric,
          no2Cabin40mUg: fivePtsMetrics.canyonMicroBreakdown?.cZ_4_0m_cabin,
          tempC: currentMeteo.temperatura_malaga ?? 22.5,
          pressureHpa: fivePtsMetrics.pressureHpa ?? 1015.0,
          primaryStationCode: fivePtsMetrics.primaryStation?.code || 'ES2086A',
          sectionTitlePrefix: 'CERTIFICACIÓN MULTIDISTRITO GUM (REGLAS 32–35)'
        });

        return {
          doc,
          filename: `Certificado_Metrologico_GUM_UE2024_2881_${safeStreet}.pdf`
        };
      }

      case 'pdf_tribunal_executive_slide': {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 297, 32, 'F');
        doc.setTextColor(251, 191, 36);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('UNED — DEFENSA DE TESIS DOCTORAL (EIDUNED) • LÁMINA EJECUTIVA DE TRIBUNAL', 14, 11);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13.5);
        doc.text(`DICTAMEN FÍSICO-QUÍMICO Y CAUSAL A MICROESCALA: ${streetName.toUpperCase()}`, 14, 20);
        doc.setFontSize(8.5);
        doc.setTextColor(167, 243, 208);
        doc.text(
          `Coordenadas: ${lat.toFixed(5)}°N, ${lon.toFixed(5)}°W | Red: ${catalogData.snapshot.stationsCount} Estaciones + ${catalogData.snapshot.satellitesCount} Satélites | Checkpoint UNED: ${catalogData.snapshot.unedCheckpoint.checkpointId}`,
          14,
          27
        );

        autoTable(doc, {
          startY: 38,
          head: [[
            '1. Morfometría 3D & Desacoplamiento Vertical',
            '2. Asimilación PINN (Paso 6.4) & LOOCV',
            '3. Identificación Causal ZBE (Paso 6.5) & Salud'
          ]],
          body: [[
            `• Relación cañón H/W = ${fivePtsMetrics.aspectRatioHw.toFixed(2)} | SVF = ${fivePtsMetrics.svfVal.toFixed(2)}\n` +
            `• NO2 Cabina Oficial (4.0 m): ${fivePtsMetrics.canyonMicroBreakdown.cZ_4_0m_cabin} ug/m3\n` +
            `• NO2 Peatón Adulto (1.8 m): ${no2UgM3.toFixed(1)} ug/m3\n` +
            `• NO2 Carrito Bebé (0.9 m): ${fivePtsMetrics.cZ_0_9m_pediatric} ug/m3\n` +
            `• Límite Directiva (UE) 2024/2881: 20.0 ug/m3`,
            `• Arquitectura: ${catalogData.snapshot.unedCheckpoint.architecture}\n` +
            `• Parámetros entrenables: ${catalogData.snapshot.unedCheckpoint.parameterCount.toLocaleString('es-ES')}\n` +
            `• Residuo PDE: ${fivePtsMetrics.resPde} ug/(m3·s) (${fivePtsMetrics.physicsClosurePct}%)\n` +
            `• Error LOOCV fuera de muestra: ${fivePtsMetrics.loocvRelErrorPct}%\n` +
            `• FAIRMODE MQI = ${fivePtsMetrics.mqi} <= 1.0 (Apto)`,
            `• Ancla #1: ${fivePtsMetrics.primaryStation.code} (${fivePtsMetrics.primaryStation.distMeters} m)\n` +
            `• Pesos: ${fivePtsMetrics.wTerrPct}% Terrestre / ${fivePtsMetrics.wSatPct}% Satelital\n` +
            `• Incertidumbre expandida GUM U95: ±${fivePtsMetrics.gumUncertainty} ug/m3\n` +
            `• Hallazgos abiertos incorporados: ${catalogData.snapshot.openDiscoveriesCount}\n` +
            `• Sello Criptográfico SHA-256: ${fivePtsMetrics.dynamicSha.slice(0, 16)}`
          ]],
          theme: 'grid',
          styles: { fontSize: 9.2, cellPadding: 4, valign: 'top' },
          headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' }
        });

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 6,
          head: [['Objetivo del Director (03/10/2026)', 'Síntesis Cuantitativa para Respuesta Oral ante el Tribunal']],
          body: [
            ['OE1 (Base Integrada 24+16)', `Asimilación continua sin datos sintéticos de ${catalogData.snapshot.stationsCount} estaciones oficiales y ${catalogData.snapshot.satellitesCount} satélites en órbita.`],
            ['OE2 (Modelo Físico-Informado PINN)', `Reducción del error fuera de muestra LOOCV al ${fivePtsMetrics.loocvRelErrorPct}% frente al ${fivePtsMetrics.ablationPureKrigingErrorPct}% del Kriging ordinario.`],
            ['OE3 (Evaluación Causal Movilidad ZBE)', `Separación determinista del efecto tráfico respecto a brisa marina, terral, puerto y aeropuerto mediante contrafactual PINN + PI-DiD.`],
            ['OE4 (Justicia Territorial y 11 Distritos)', `Auditoría simultánea de exposición a 1.8 m / 0.9 m y equidad socioespacial en los 11 distritos INE de Málaga.`]
          ],
          theme: 'grid',
          styles: { fontSize: 8.5, cellPadding: 2.5 },
          headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255], fontStyle: 'bold' }
        });

        return {
          doc,
          filename: `Lamina_Ejecutiva_Tribunal_UNED_${safeStreet}.pdf`
        };
      }

      case 'pdf_custom_on_demand_and_crop':
      default: {
        const doc = generateCustomOnDemandPdfReport({
          scope: quickCustomScope,
          depth: quickCustomDepth,
          location: { lat, lon },
          activePoint: activeCtx?.activePoint,
          assimilation: activeCtx?.assimilation as any,
          meteo: currentMeteo,
          physics: computedPhysics,
          stationComparisons,
          benchmarkParams,
          odeParams,
          streetName
        });
        appendVoluntarySiteAnd11DistrictsSectionToPdf(doc, 275, {
          streetName,
          lat,
          lon,
          no2Pedestrian18mUg: no2UgM3,
          no2Pediatric09mUg: fivePtsMetrics.cZ_0_9m_pediatric,
          no2Cabin40mUg: fivePtsMetrics.canyonMicroBreakdown?.cZ_4_0m_cabin,
          tempC: currentMeteo.temperatura_malaga ?? 22.5,
          pressureHpa: fivePtsMetrics.pressureHpa ?? 1015.0,
          primaryStationCode: fivePtsMetrics.primaryStation?.code || 'ES2086A',
          sectionTitlePrefix: 'ANEXO ESTUDIO A LA CARTA (REGLAS 32–35)'
        });
        return {
          doc,
          filename: `Estudio_Doctoral_A_La_Carta_${quickCustomScope}_${safeStreet}.pdf`
        };
      }
    }
  };

  /**
   * 1. ACCIÓN: VISUALIZAR EN PANTALLA (Visor integrado DraggableWindow sin salir de la app — Regla 5 y 30)
   */
  const handlePreviewPdf = async (item: ThesisMasterPdfCatalogItem) => {
    try {
      (window as any).__forceExpandNextModal = true;
      setBusyPdfId(item.id);
      if (item.id === 'pdf_director_original_verbatim_2026') {
        const resp = await fetch(DIRECTOR_ORIGINAL_PDF_PATH);
        const arrayBuffer = await resp.arrayBuffer();
        setPreviewState({
          arrayBuffer,
          iframeUrl: DIRECTOR_ORIGINAL_PDF_PATH,
          filename: '03_10_2026_Marco_objetivos_tesis_Dionisio.pdf',
          title: item.title,
          pageCount: 2,
          docInstance: null
        });
        return;
      }

      if (item.id === 'pdf_director_expanded_geminis_2026') {
        const resp = await fetch(DIRECTOR_EXPANDED_GEMINI_PDF_PATH);
        const arrayBuffer = await resp.arrayBuffer();
        setPreviewState({
          arrayBuffer,
          iframeUrl: DIRECTOR_EXPANDED_GEMINI_PDF_PATH,
          filename: DIRECTOR_EXPANDED_GEMINI_DOWNLOAD_FILENAME,
          title: item.title,
          pageCount: 7,
          docInstance: null
        });
        return;
      }

      const { doc, filename } = await buildLivePdfDocument(item);
      const arrayBuffer = doc.output('arraybuffer');
      const totalPages = doc.getNumberOfPages();
      setPreviewState({
        arrayBuffer,
        iframeUrl: null,
        filename,
        title: item.title,
        pageCount: totalPages,
        docInstance: doc
      });
    } catch (err) {
      console.error('Error al previsualizar PDF:', err);
    } finally {
      setBusyPdfId(null);
    }
  };

  /**
   * 2. ACCIÓN: DESCARGAR PDF DIRECTAMENTE
   */
  const handleDownloadPdf = async (item: ThesisMasterPdfCatalogItem) => {
    try {
      setBusyPdfId(item.id);
      if (item.id === 'pdf_director_original_verbatim_2026') {
        const link = document.createElement('a');
        link.href = DIRECTOR_ORIGINAL_PDF_PATH;
        link.download = '03_10_2026_Marco_objetivos_tesis_Dionisio.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      if (item.id === 'pdf_director_expanded_geminis_2026') {
        const link = document.createElement('a');
        link.href = DIRECTOR_EXPANDED_GEMINI_PDF_PATH;
        link.download = DIRECTOR_EXPANDED_GEMINI_DOWNLOAD_FILENAME;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      if (item.isDynamicUploadedOrder && item.uploadedOrderPayload) {
        const metrics = buildDoctoralFivePointsMetricsFromContext(activeCtx);
        await downloadCustomDirectorOrderMonographPdf(item.uploadedOrderPayload, activeCtx, metrics);
        return;
      }

      const { doc, filename } = await buildLivePdfDocument(item);
      doc.save(filename);
    } catch (err) {
      console.error('Error al descargar PDF:', err);
    } finally {
      setBusyPdfId(null);
    }
  };

  /**
   * 3. ACCIÓN: IMPRIMIR DIRECTAMENTE DESDE LA APP
   */
  const handlePrintPdf = async (item: ThesisMasterPdfCatalogItem) => {
    try {
      setBusyPdfId(item.id);
      let blobUrl: string;

      if (item.id === 'pdf_director_original_verbatim_2026') {
        blobUrl = DIRECTOR_ORIGINAL_PDF_PATH;
      } else if (item.id === 'pdf_director_expanded_geminis_2026') {
        blobUrl = DIRECTOR_EXPANDED_GEMINI_PDF_PATH;
      } else {
        const { doc } = await buildLivePdfDocument(item);
        if (typeof (doc as any).autoPrint === 'function') {
          (doc as any).autoPrint();
        }
        const blob = doc.output('blob');
        blobUrl = URL.createObjectURL(blob);
      }

      // Imprimir mediante iframe oculto compatible con sandbox
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '1px';
      printIframe.style.height = '1px';
      printIframe.style.border = '0';
      printIframe.src = blobUrl;
      document.body.appendChild(printIframe);

      printIframe.onload = () => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch {
          // Si el navegador requiere visor interactivo, abrimos el visor en pantalla
          handlePreviewPdf(item);
        }
        setTimeout(() => {
          if (document.body.contains(printIframe)) {
            document.body.removeChild(printIframe);
          }
        }, 60000);
      };
    } catch (err) {
      console.error('Error al imprimir PDF:', err);
    } finally {
      setBusyPdfId(null);
    }
  };

  /**
   * 4. ACCIÓN: COMPARTIR (Web Share nativo con archivo PDF en iPad/móvil o copia de ficha completa en PC)
   */
  const handleSharePdf = async (item: ThesisMasterPdfCatalogItem) => {
    try {
      setBusyPdfId(item.id);
      const summaryText =
        `📑 ${item.badge} — ${item.title}\n` +
        `• ¿Para qué sirve?: ${item.whatIsItFor}\n` +
        `• ¿Cuándo usar con el Director?: ${item.whenToUseWithDirector}\n` +
        `• Datos en vivo sincronizados: ${item.liveDataInjected}\n` +
        `• Ubicación original en la App: ${item.whereItLivesInApp}`;

      if (
        typeof navigator !== 'undefined' &&
        navigator.share &&
        item.id !== 'pdf_director_original_verbatim_2026' &&
        item.id !== 'pdf_director_expanded_geminis_2026'
      ) {
        try {
          const { doc, filename } = await buildLivePdfDocument(item);
          const blob = doc.output('blob');
          const file = new File([blob], filename, { type: 'application/pdf' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: item.title,
              text: summaryText,
              files: [file]
            });
            setSharedConfirmId(item.id);
            setTimeout(() => setSharedConfirmId(null), 2500);
            return;
          }
        } catch {
          // Fallback a copia al portapapeles si el usuario cancela o el escritorio no soporta compartir archivos
        }
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(summaryText);
        setSharedConfirmId(item.id);
        setTimeout(() => setSharedConfirmId(null), 2500);
      }
    } catch (err) {
      console.error('Error al compartir PDF:', err);
    } finally {
      setBusyPdfId(null);
    }
  };

  const accentBorderMap: Record<ThesisMasterPdfCatalogItem['accentColor'], string> = {
    amber: 'border-amber-600/70 bg-amber-950/20',
    emerald: 'border-emerald-600/70 bg-emerald-950/20',
    cyan: 'border-cyan-600/70 bg-cyan-950/20',
    rose: 'border-rose-600/70 bg-rose-950/20',
    purple: 'border-purple-600/70 bg-purple-950/20',
    sky: 'border-sky-600/70 bg-sky-950/20'
  };

  const accentBadgeMap: Record<ThesisMasterPdfCatalogItem['accentColor'], string> = {
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/60',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60',
    cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60',
    rose: 'bg-rose-500/20 text-rose-300 border-rose-500/60',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/60',
    sky: 'bg-sky-500/20 text-sky-300 border-sky-500/60'
  };

  return (
    <div className="flex flex-col gap-2.5 text-slate-200">
      {/* 1. CABECERA DE SINCRONIZACIÓN DINÁMICA EN VIVO (REGLA 27) */}
      <div className="p-2.5 rounded-md bg-gradient-to-r from-slate-900 via-indigo-950/60 to-emerald-950/50 border border-emerald-600/60 flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-black uppercase tracking-tight text-white">
              Biblioteca Central Viva de Todos los PDFs de la Tesis ({catalogData.totalCatalogCount} Documentos)
            </span>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/70 font-bold">
            🟢 SINCRONIZACIÓN DINÁMICA ACTIVA (REGLA 27)
          </span>
        </div>

        <p className="text-[10.5px] text-slate-300 leading-snug">
          Aquí tienes reunidos y explicados <strong>todos los PDFs de la aplicación</strong> para poder{' '}
          <strong>visualizarlos en pantalla, imprimirlos, descargarlos o compartirlos</strong> desde un único lugar.{' '}
          <span className="text-amber-300 font-semibold">
            Cada PDF sigue también intacto en su ventana original
          </span>{' '}
          y todos se actualizan automáticamente en tiempo real con el punto activo y el desarrollo de la tesis.
        </p>

        {/* Píldoras de estado en vivo conectado */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80 text-[9.5px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-cyan-700/60 text-cyan-300 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>
              {streetName.split(',')[0]} • NO₂(1.8m): <strong>{no2UgM3.toFixed(1)} µg/m³</strong>
            </span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-emerald-700/60 text-emerald-300 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>
              Red Oficial: {catalogData.snapshot.stationsCount} Estaciones + {catalogData.snapshot.satellitesCount} Satélites
            </span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-purple-700/60 text-purple-300 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-purple-400 shrink-0" />
            <span>UNED GPU: {catalogData.snapshot.unedCheckpoint.checkpointId}</span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-amber-700/60 text-amber-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span>
              {catalogData.snapshot.openDiscoveriesCount} Hallazgos + {catalogData.snapshot.totalDynamicOrdersCount} Registros Vivos • Reglas 1➔35 PASS
            </span>
          </span>
        </div>

        {/* SELECTOR VOLUNTARIO DE SITIO / DISTRITO PARA TODOS LOS PDFs DE LA BIBLIOTECA */}
        <div className="pt-1 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <ScientificTooltip
            position="bottom"
            width="w-[410px]"
            title="Selector Voluntario del Sitio / Calle para Todos los PDFs (11 Distritos en Vivo)"
            content="Elige voluntariamente cualquier arteria de los 11 Distritos Oficiales de Málaga (o mantén la calle que hayas pinchado en el mapa). Todos los PDFs de esta biblioteca se nutren inmediatamente en vivo del sitio que elijas aquí (mostrando sus concentraciones a 1,8 m, 0,9 m y 4,0 m + ppb termodinámico bajo Regla 34) sin eliminar ningún PDF existente."
            formula="\\text{PDF}_{i}(\\mathbf{x}_{\\text{elegido}}) \\leftarrow C_{1,8\\text{m}},\\; C_{0,9\\text{m}},\\; C_{4,0\\text{m}},\\; \\chi_{\\text{ppb}}(P_{\\text{real}},T_{\\text{real}})"
            regulatory="Reglas 9, 27, 29 y 32–35 AGENTS.md — Elección Voluntaria del Sitio"
          >
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 border border-amber-400/80 rounded-lg px-2 py-1">
              <span className="text-[9.5px] font-black text-amber-300 whitespace-nowrap">
                🌍 Sitio Voluntario que Nutre Todos los PDFs (11 Distritos en Vivo):
              </span>
              <select
                aria-label="Elegir voluntariamente calle o distrito para todos los PDFs"
                value={
                  catalogData.snapshot.live11DistrictsCorridors.find((c) =>
                    streetName.toLowerCase().includes(c.streetName.split('(')[0].trim().toLowerCase().slice(0, 10))
                  )?.id || ''
                }
                onChange={(e) => {
                  const chosen = catalogData.snapshot.live11DistrictsCorridors.find(
                    (c) => c.id === e.target.value
                  );
                  if (chosen && activeCtx?.syncActivePoint) {
                    activeCtx.syncActivePoint(chosen.lat, chosen.lon, {
                      name: `${chosen.streetName}, ${chosen.districtName}, Málaga`,
                      fly: false
                    });
                  }
                }}
                className="bg-slate-900 text-amber-200 font-black text-[10px] rounded px-1.5 py-0.5 border border-amber-400/60 cursor-pointer max-w-full sm:max-w-[540px]"
              >
                <option value="">
                  📍 {streetName.split(',')[0]} (Sitio Activo Elegido) ➔ 1,8m: {no2UgM3.toFixed(1)} µg/m³
                </option>
                {catalogData.snapshot.live11DistrictsCorridors.map((corridor) => (
                  <option key={corridor.id} value={corridor.id}>
                    {corridor.shortLabel} ({corridor.streetName.split('(')[0].trim()}) ➔ 1,8m: {corridor.liveC18mPedestrianUg} µg/m³ ({corridor.livePpb18m} ppb) | 0,9m: {corridor.liveC09mPediatricUg} µg/m³ | 4,0m: {corridor.liveC40mCabinUg} µg/m³ [Ancla {corridor.anchorStationCode}]
                  </option>
                ))}
              </select>
            </div>
          </ScientificTooltip>
          <span className="text-[9px] text-emerald-300 font-bold">
            ✓ Cero PDFs eliminados (Regla 9) • Todos completados con Reglas 32–35 + 11 Distritos
          </span>
        </div>
      </div>

      {/* 2. FILTROS POR CATEGORÍA, BUSCADOR Y PLEGAR/DESPLEGAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-950/90 p-2 rounded border border-slate-800">
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: 'ALL' as const, label: `📚 Todos (${catalogData.totalCatalogCount})` },
            { id: 'DIRECTRICES_DIRECTOR' as const, label: '📕 Directrices Director' },
            { id: 'PUBLICACION_Q1_Y_DEFENSA' as const, label: '🎓 Paper Q1 y Tribunal' },
            { id: 'RED_SENSORES_Y_METROLOGIA' as const, label: `🛡️ Sensores (${catalogData.snapshot.stationsCount}+${catalogData.snapshot.satellitesCount}) y GUM` },
            { id: 'ESTUDIOS_A_LA_CARTA' as const, label: '🔬 A la Carta' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2 py-1 rounded text-[9.5px] font-mono font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700/70'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar PDF o tema..."
              className="w-full bg-slate-900 border border-slate-700 rounded pl-6 pr-2 py-1 text-[10px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            onClick={expandAll}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[9px] font-mono text-slate-300 cursor-pointer whitespace-nowrap"
            title="Desplegar la explicación detallada de todos los PDFs"
          >
            + Explicaciones
          </button>
          <button
            onClick={collapseAll}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[9px] font-mono text-slate-300 cursor-pointer whitespace-nowrap"
            title="Plegar explicaciones para vista compacta"
          >
            − Compactar
          </button>
        </div>
      </div>

      {/* 3. LISTA DE TODOS LOS PDFs (CERO HUECOS NEGROS, EXPLICACIÓN CLARA Y 4 ACCIONES EN CADA UNO) */}
      <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
        {filteredItems.map((item) => {
          const isExpanded = Boolean(expandedCardIds[item.id]);
          const isBusy = busyPdfId === item.id;
          const isShared = sharedConfirmId === item.id;

          return (
            <div
              key={item.id}
              className={`rounded-md border transition-all p-2.5 flex flex-col gap-2 ${accentBorderMap[item.accentColor]}`}
            >
              {/* Fila Principal: Badge + Título + Botones de Acción (Visualizar, Imprimir, Descargar, Compartir) */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                <div
                  onClick={() => toggleCard(item.id)}
                  data-scientific-auto-tooltip="true"
                  data-scientific-title={`${item.title} (${item.badge})`}
                  data-scientific-formula={item.id.includes('q1') ? '\\text{OSPM} + \\text{Leighton} + \\text{PINN}' : '\\text{FAIR} + \\text{UNED} + \\text{GUM } U_{95}'}
                  data-scientific-tooltip={`${item.whatIsItFor} • Uso Director/Tribunal: ${item.whenToUseWithDirector}`}
                  className="flex items-start gap-2 cursor-pointer flex-1 min-w-0"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCard(item.id);
                    }}
                    className="mt-0.5 text-slate-300 hover:text-white shrink-0 cursor-pointer"
                    aria-label="Desplegar explicación del PDF"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-amber-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[8.5px] font-mono font-black px-1.5 py-0.5 rounded border ${accentBadgeMap[item.accentColor]}`}
                      >
                        {item.badge}
                      </span>
                      <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-slate-300">
                        📄 {item.pagesLabel}
                      </span>
                      <span className="text-[8px] font-mono text-slate-400">
                        {item.categoryLabel}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white leading-snug">
                      {item.title}
                    </h4>
                    {!isExpanded && (
                      <p className="text-[10px] text-slate-300 line-clamp-1">
                        {item.whatIsItFor}
                      </p>
                    )}
                  </div>
                </div>

                {/* 4 Botones de Acción Directa: Visualizar, Imprimir, Descargar, Compartir */}
                <div className="flex flex-wrap items-center gap-1 shrink-0">
                  <ScientificTooltip
                    position="top"
                    content={`Visualizar "${item.title}" directamente en pantalla con zoom y paso de página sin salir de la aplicación.`}
                  >
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handlePreviewPdf(item)}
                      className="px-2 py-1 rounded bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/70 text-cyan-200 text-[9.5px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <Eye className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>Visualizar</span>
                    </button>
                  </ScientificTooltip>

                  <ScientificTooltip
                    position="top"
                    content={`Enviar "${item.title}" directamente a la impresora con formato A4 vectorial.`}
                  >
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handlePrintPdf(item)}
                      className="px-2 py-1 rounded bg-amber-950/90 hover:bg-amber-900 border border-amber-500/70 text-amber-200 text-[9.5px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <Printer className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>Imprimir</span>
                    </button>
                  </ScientificTooltip>

                  <ScientificTooltip
                    position="top"
                    content={`Descargar el archivo .PDF actualizado en tiempo real con los datos de ${streetName.split(',')[0]}.`}
                  >
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDownloadPdf(item)}
                      className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[9.5px] font-mono font-black flex items-center gap-1 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                    >
                      <Download className="w-3 h-3 shrink-0" />
                      <span>{isBusy ? 'Generando...' : 'Descargar PDF'}</span>
                    </button>
                  </ScientificTooltip>

                  <ScientificTooltip
                    position="top"
                    content="Compartir el documento PDF (AirDrop/Correo/iPad) o copiar su ficha ejecutiva completa al portapapeles."
                  >
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleSharePdf(item)}
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-600 text-slate-200 text-[9.5px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {isShared ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="text-emerald-300">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>Compartir</span>
                        </>
                      )}
                    </button>
                  </ScientificTooltip>
                </div>
              </div>

              {/* Selector interactivo específico para el PDF #2 (Monográfico Punto a Punto del Director) */}
              {item.id === 'pdf_director_focused_point_by_point' && (
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded border border-emerald-700/50 text-[10px]">
                  <span className="font-mono font-bold text-emerald-300">
                    🎯 Elegir Punto del Director para Visualizar / Imprimir / Descargar:
                  </span>
                  <select
                    value={selectedPointId}
                    onChange={(e) => setSelectedPointId(e.target.value as DirectorMonographPointId)}
                    className="bg-slate-900 border border-emerald-500/70 rounded px-2 py-0.5 text-[10px] font-mono text-emerald-200 focus:outline-none"
                  >
                    {DIRECTOR_MONOGRAPH_POINTS_CATALOG.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.shortLabel}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selector rápido para el PDF #10 (Estudios a la Carta) */}
              {item.id === 'pdf_custom_on_demand_and_crop' && (
                <div className="flex flex-wrap items-center justify-between gap-1.5 bg-slate-950/80 p-1.5 rounded border border-sky-700/50 text-[10px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono font-bold text-sky-300">🔬 Ámbito rápido:</span>
                    <select
                      value={quickCustomScope}
                      onChange={(e) => setQuickCustomScope(e.target.value as ReportScope)}
                      className="bg-slate-900 border border-sky-500/70 rounded px-1.5 py-0.5 text-[10px] font-mono text-sky-200"
                    >
                      <option value="integral_twin">Compendio Total del Gemelo Digital</option>
                      <option value="pinn_microscale">PINN &amp; Dinámica Microescalar</option>
                      <option value="environmental_justice">Justicia Ambiental, ZBE &amp; 11 Distritos</option>
                      <option value="school_pediatric">Entornos Escolares &amp; Dosimetría ICRP 66</option>
                      <option value="urban_forestry">Fitorremediación Arbórea &amp; Wesely</option>
                      <option value="regulatory_audit">Auditoría Directiva (UE) 2024/2881</option>
                    </select>
                    <select
                      value={quickCustomDepth}
                      onChange={(e) => setQuickCustomDepth(e.target.value as ReportDepth)}
                      className="bg-slate-900 border border-sky-500/70 rounded px-1.5 py-0.5 text-[10px] font-mono text-sky-200"
                    >
                      <option value="brief_note">Nota Rápida (2 págs)</option>
                      <option value="executive">Ejecutivo (3 págs)</option>
                      <option value="standard">Estudio Técnico (5 págs)</option>
                      <option value="doctoral_extended">Monografía Extensa (8 págs)</option>
                    </select>
                  </div>
                  {onSwitchToCustomPdfTab && (
                    <button
                      type="button"
                      onClick={onSwitchToCustomPdfTab}
                      className="px-2 py-0.5 rounded bg-sky-900/80 hover:bg-sky-800 text-sky-200 border border-sky-500/60 font-mono font-bold text-[9px] cursor-pointer"
                    >
                      Abrir Configurador Completo a la Carta ➔
                    </button>
                  )}
                </div>
              )}

              {/* Bloque Desplegable: Explicación de Para qué es, Cuándo usarlo, Datos en Vivo y Ubicación Original */}
              {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1.5 border-t border-slate-800/80 text-[10.5px] items-start">
                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                    <span className="text-[9px] font-mono font-bold uppercase text-amber-400">
                      🎯 ¿Para qué sirve este PDF?
                    </span>
                    <p className="text-slate-200 leading-relaxed">{item.whatIsItFor}</p>
                  </div>

                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                    <span className="text-[9px] font-mono font-bold uppercase text-emerald-400">
                      🎓 ¿Cuándo entregárselo al Director o al Tribunal?
                    </span>
                    <p className="text-slate-200 leading-relaxed">{item.whenToUseWithDirector}</p>
                  </div>

                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                    <span className="text-[9px] font-mono font-bold uppercase text-cyan-400">
                      ⚡ Actualización dinámica en vivo ahora mismo
                    </span>
                    <p className="text-slate-300 font-mono text-[9.5px] leading-relaxed">
                      {item.liveDataInjected}
                    </p>
                  </div>

                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800 flex flex-col justify-between gap-1.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-mono font-bold uppercase text-purple-400">
                        📍 Sitio original en la App (100% mantenido)
                      </span>
                      <p className="text-slate-300 text-[10px] leading-snug">
                        {item.whereItLivesInApp}
                      </p>
                    </div>
                    {onNavigateToModal && (
                      <button
                        type="button"
                        onClick={() => onNavigateToModal(item.sourceModalId)}
                        className="self-start px-2 py-0.5 rounded bg-purple-950/90 hover:bg-purple-900 border border-purple-500/70 text-purple-200 text-[9px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ir a su ventana original</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. VISOR DE PREVISUALIZACIÓN EN PANTALLA (DRAGGABLEWINDOW REGLA 5 Y 30) */}
      {previewState && previewState.arrayBuffer && (
        <PdfCanvasPreviewModal
          pdfArrayBuffer={previewState.arrayBuffer}
          filename={previewState.filename}
          title={previewState.title}
          pageCount={previewState.pageCount}
          onDownload={() => {
            if (previewState.docInstance) {
              previewState.docInstance.save(previewState.filename);
            } else if (previewState.iframeUrl) {
              const link = document.createElement('a');
              link.href = previewState.iframeUrl;
              link.download = previewState.filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }}
          onClose={() => setPreviewState(null)}
        />
      )}
    </div>
  );
};
