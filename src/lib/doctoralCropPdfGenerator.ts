/**
 * Generador de PDF Científico para el Encuadre de Pantalla (Dictamen Doctoral)
 * Tesis Doctoral: Gemelo Digital de Calidad del Aire en Málaga (UNED Doctorado)
 * 
 * Genera un documento PDF A4 formal, citable e imprimible para la EIDUNED
 * que integra la imagen enmarcada, la tabla de elementos y el dictamen completo.
 */

import * as jspdfNamespace from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cleanScientificSymbols } from './doctoralCropEngine';
import { OFFICIAL_MALAGA_AIR_STATIONS, OFFICIAL_SATELLITE_MISSIONS } from './physics';
import { getUniversalLivePdfSyncSnapshot } from './universalPdfLiveSyncEngine';

export interface CropPdfPayload {
  currentImage?: string;
  activeStreet: string;
  activeLat: number;
  activeLon: number;
  activeElev: number;
  activeNo2: number;
  activeO3: number;
  activePm25: number;
  activePm10: number;
  activeTemp: number;
  activeWind: number;
  detectedWindowName: string;
  detectedActiveTab?: string;
  detectedItemsCount: number;
  structuredItems?: Array<{ kind: string; text: string; role?: string }>;
  qaHistory: Array<{
    id: string;
    question: string;
    answer: string;
    timestamp: string;
    model: string;
    webSearchUsed?: boolean;
  }>;
}

export function generateDoctoralCropPdf(payload: CropPdfPayload): { doc: any; filename: string } {
  const JsPdfClass = (jspdfNamespace as any).jsPDF || (jspdfNamespace as any).default || jspdfNamespace;
  const doc = new JsPdfClass({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const author = 'Dionisio Gálvez Pozo';
  const university = 'Universidad Nacional de Educación a Distancia (UNED)';
  const program = 'Programa de Doctorado — EIDUNED';
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const filename = `dictamen_doctoral_recuadro_${now.toISOString().slice(0, 10)}_${now.getHours()}${now.getMinutes()}.pdf`;

  // =========================================================================
  // CABECERA INSTITUCIONAL
  // =========================================================================
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('GEMELO DIGITAL DE CALIDAD DEL AIRE — MÁLAGA', 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('DICTAMEN TÉCNICO-CIENTÍFICO DEL ENCUADRE DE PANTALLA (ANÁLISIS DOCTORAL)', 14, 20);
  doc.text(`Tesis Doctoral: Modelización de Calidad del Aire a Microescala • ${university}`, 14, 26);
  doc.text(`Doctorando: ${author} • ${program} • Fecha: ${dateStr} ${timeStr}`, 14, 32);

  let currentY = 42;

  // =========================================================================
  // CUADRO DE CONTEXTO METROLÓGICO Y OBSERVACIONAL
  // =========================================================================
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, 182, 30, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTEXTO GEOGRÁFICO Y TELEMETRÍA ASIMILADA EN TIEMPO REAL:', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`• Ubicación Sincronizada: ${payload.activeStreet}`, 18, currentY + 12);
  doc.text(
    `• Coordenadas WGS84: ${payload.activeLat.toFixed(5)}°N, ${payload.activeLon.toFixed(5)}°W  |  Cota MDE: ${payload.activeElev} m s.n.m.`,
    18,
    currentY + 17
  );
  doc.text(
    `• Calidad del Aire: NO₂ = ${payload.activeNo2} µg/m³  |  O₃ = ${payload.activeO3} µg/m³  |  PM₂.₅ = ${payload.activePm25} µg/m³  |  PM₁₀ = ${payload.activePm10} µg/m³`,
    18,
    currentY + 22
  );
  const liveSync = getUniversalLivePdfSyncSnapshot({
    streetName: payload.activeStreet,
    lat: payload.activeLat,
    lon: payload.activeLon,
    no2UgM3: payload.activeNo2
  });
  doc.text(
    `• Meteorología: T=${payload.activeTemp}°C | Viento=${payload.activeWind} m/s | Red: ${OFFICIAL_MALAGA_AIR_STATIONS.length}+${OFFICIAL_SATELLITE_MISSIONS.length} Detectores | UNED: ${liveSync.unedCheckpoint.checkpointId} (${liveSync.unedCheckpoint.parameterCount.toLocaleString('es-ES')} params) | Órdenes Director: 7+${liveSync.totalDynamicOrdersCount}`,
    18,
    currentY + 27
  );

  currentY += 36;

  // =========================================================================
  // SECCIÓN 1: IMAGEN DEL RECUADRO CAPTURADO
  // =========================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('1. FIGURA ENMARCADA (CAPTURA EN ALTA RESOLUCIÓN)', 14, currentY);
  currentY += 4;

  if (payload.currentImage && payload.currentImage.startsWith('data:image')) {
    try {
      // Dimensiones máximas de imagen en PDF: ancho 182 mm, alto máx 60 mm
      const maxImgW = 182;
      const maxImgH = 60;
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, currentY, maxImgW, maxImgH, 1, 1, 'FD');
      
      doc.addImage(payload.currentImage, 'PNG', 15, currentY + 1, maxImgW - 2, maxImgH - 2, undefined, 'FAST');
      currentY += maxImgH + 3;

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const tabStr = payload.detectedActiveTab ? ` · Sección: ${payload.detectedActiveTab}` : '';
      doc.text(
        `Figura 1: Encuadre interactivo de «${cleanScientificSymbols(payload.detectedWindowName)}${tabStr}» en ${payload.activeStreet}.`,
        14,
        currentY
      );
      currentY += 6;
    } catch {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('[Captura enmarcada registrada digitalmente]', 14, currentY + 4);
      currentY += 10;
    }
  }

  // =========================================================================
  // SECCIÓN 2: TABLA DE ELEMENTOS DETECTADOS EN EL RECUADRO
  // =========================================================================
  const rawItems = payload.structuredItems || [];
  if (rawItems.length > 0) {
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`2. ELEMENTOS ESTRUCTURADOS IDENTIFICADOS (${rawItems.length} ÍTEMS)`, 14, currentY);
    currentY += 3;

    const tableRows = rawItems.map((it, idx) => [
      String(idx + 1),
      cleanScientificSymbols(it.kind || 'Componente'),
      cleanScientificSymbols(it.text || ''),
      it.role ? cleanScientificSymbols(it.role) : 'Métrica / Control / Indicador Doctoral'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Tipo', 'Elemento Enmarcado', 'Función Metrológica / Científica']],
      body: tableRows,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });

    currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : currentY + 40;
  }

  // =========================================================================
  // SECCIÓN 3: DICTÁMENES CIENTÍFICOS DOCTORALES
  // =========================================================================
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('3. DICTAMEN DOCTORAL CIENTÍFICO EXHAUSTIVO', 14, currentY);
  currentY += 5;

  const entries = payload.qaHistory.length > 0 ? payload.qaHistory : [];
  if (entries.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No se han emitido dictámenes en esta sesión.', 14, currentY);
  } else {
    entries.forEach((item, index) => {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(79, 70, 229); // Indigo-600
      doc.text(`Dictamen ${index + 1} [Hora: ${item.timestamp}] — Motor: ${item.model}`, 14, currentY);
      currentY += 4.5;

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const splitQuestion = doc.splitTextToSize(`Directriz: ${cleanScientificSymbols(item.question)}`, 182);
      doc.text(splitQuestion, 14, currentY);
      currentY += splitQuestion.length * 3.8 + 2;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);

      const cleanedAnswer = cleanScientificSymbols(item.answer);
      const splitLines = doc.splitTextToSize(cleanedAnswer, 182);

      // Si el texto se desborda, lo escribimos línea a línea respetando saltos de página
      for (let i = 0; i < splitLines.length; i++) {
        if (currentY > 275) {
          doc.addPage();
          currentY = 20;
        }
        doc.text(splitLines[i], 14, currentY);
        currentY += 3.7;
      }

      currentY += 5;
    });
  }

  // =========================================================================
  // PIE DE PÁGINA FORMAL EN TODAS LAS HOJAS
  // =========================================================================
  const totalPages = (doc as any).internal?.getNumberOfPages?.() || 1;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 287, 196, 287);
    doc.text(
      `Tesis Doctoral — UNED Doctorado (Dionisio Gálvez Pozo) • Gemelo Digital de Málaga • Principios FAIR`,
      14,
      291
    );
    doc.text(`Página ${p} de ${totalPages}`, 196, 291, { align: 'right' });
  }

  return { doc, filename };
}
