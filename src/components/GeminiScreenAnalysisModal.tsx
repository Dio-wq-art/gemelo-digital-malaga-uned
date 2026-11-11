import React, { useState, useRef, useEffect } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { useActivePoint } from '../context/ActivePointContext';
import {
  cleanScientificSymbols,
  consolidateFramedItems,
  buildUnifiedDoctoralCropDictamen,
  DOCTORAL_FOCUS_MODES
} from '../lib/doctoralCropEngine';
import { generateDoctoralCropPdf } from '../lib/doctoralCropPdfGenerator';
import {
  downloadDoctoralFivePointsThesisPdf,
  buildDoctoralFivePointsMetricsFromContext
} from '../lib/doctoralFivePointsThesisPdfGenerator';
import { SYSTEM_PROPAGATION } from '../lib/systemPropagationEngine';
import {
  Sparkles,
  Printer,
  Download,
  Send,
  Copy,
  CheckCircle2,
  MapPin,
  RefreshCw,
  FileText,
  AlertCircle,
  Clock,
  Upload,
  ShieldCheck,
  Sliders,
  Zap,
  Layers,
  Globe,
  ExternalLink,
  GitCompare,
  Code2,
  Scale,
  Quote,
  Calculator
} from 'lucide-react';

interface Props {
  onClose: () => void;
  croppedImageBase64: string;
  onNewCropRequested?: () => void;
}

interface GroundingSource {
  title: string;
  uri: string;
}

interface QaEntry {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  model: string;
  webSearchUsed?: boolean;
  groundingSources?: GroundingSource[];
}

interface PointSnapshot {
  id: string;
  streetName: string;
  lat: number;
  lon: number;
  elevationM: number;
  no2: number;
  o3: number;
  pm25: number;
  pm10: number;
  tempC: number;
  windSpeedMs: number;
  windowTitle: string;
  timestamp: string;
}

// Formateador del Dictamen Doctoral con símbolos 100 % legibles, anclas interactivas y filtro en vivo
function FormattedDoctoralAnalysis({
  text,
  filterQuery = '',
  highlightedElementIdx = null
}: {
  text: string;
  filterQuery?: string;
  highlightedElementIdx?: number | null;
}) {
  const cleanedText = cleanScientificSymbols(text);
  const rawLines = cleanedText.split('\n');
  const q = filterQuery.trim().toLowerCase();

  const lines = q
    ? rawLines.filter((line) => {
        const t = line.trim().toLowerCase();
        if (!t) return false;
        if (t.startsWith('# ') || t.startsWith('## ')) return true;
        return t.includes(q);
      })
    : rawLines;

  const formatInlineHtml = (str: string) =>
    str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-200 font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-emerald-200/90 not-italic font-medium">$1</em>')
      .replace(
        /`(.*?)`/g,
        '<code class="bg-slate-900 text-amber-300 px-1 py-0.5 rounded font-mono text-[10px]">$1</code>'
      );

  // Agrupar bloques de tablas Markdown (| col | col |) para renderizarlos como tablas HTML reales y claras
  const blocks: Array<{ type: 'table'; rows: string[] } | { type: 'line'; line: string; idx: number }> = [];
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t.startsWith('|') && t.endsWith('|')) {
      const tableRows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableRows.push(lines[i].trim());
        i++;
      }
      blocks.push({ type: 'table', rows: tableRows });
    } else {
      blocks.push({ type: 'line', line: lines[i], idx: i });
      i++;
    }
  }

  return (
    <div className="space-y-2 text-[11px] leading-relaxed text-slate-200 font-sans">
      {blocks.map((block, bIdx) => {
        if (block.type === 'table') {
          const validRows = block.rows.filter((r) => !/^\|[\s:|-]+\|$/.test(r));
          if (validRows.length === 0) return null;
          const headerCells = validRows[0]
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());
          const bodyRows = validRows.slice(1);

          return (
            <div key={`tbl-${bIdx}`} className="my-2 overflow-x-auto rounded-lg border border-purple-800/60 bg-slate-950/90 shadow-inner">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-purple-950/80 border-b border-purple-800/70 text-purple-200 font-bold">
                    {headerCells.map((cell, cIdx) => (
                      <th
                        key={cIdx}
                        className="px-2.5 py-1.5 border-r border-purple-900/40 last:border-r-0"
                        dangerouslySetInnerHTML={{ __html: formatInlineHtml(cell) }}
                      />
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {bodyRows.map((rowStr, rIdx) => {
                    const cells = rowStr
                      .slice(1, -1)
                      .split('|')
                      .map((c) => c.trim());
                    return (
                      <tr key={rIdx} className="hover:bg-slate-900/80 transition-colors">
                        {cells.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="px-2.5 py-1.5 border-r border-slate-800/50 last:border-r-0 text-slate-200 align-top"
                            dangerouslySetInnerHTML={{ __html: formatInlineHtml(cell) }}
                          />
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        }

        const { line, idx } = block;
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
          const headingText = trimmed.replace(/^#+\s*/, '');
          return (
            <div
              key={idx}
              className="font-bold text-xs uppercase tracking-wider text-purple-300 pt-2.5 pb-1 border-b border-purple-800/50 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>{headingText}</span>
            </div>
          );
        }

        if (trimmed.startsWith('### ') || trimmed.startsWith('#### ')) {
          const subHeading = trimmed.replace(/^#+\s*/, '');
          const elemMatch = subHeading.match(/(?:Elemento|Ecuación|Expresión|Nodo)?\s*\[(\d+)\]/i);
          const elemNumber = elemMatch ? parseInt(elemMatch[1], 10) : null;
          const isHighlighted = elemNumber !== null && highlightedElementIdx === elemNumber;

          return (
            <div
              key={idx}
              id={elemNumber ? `crop-element-anchor-${elemNumber}` : undefined}
              className={`font-bold text-[11.5px] pt-2 flex items-center gap-1.5 transition-all rounded px-1.5 py-1 ${
                isHighlighted
                  ? 'bg-emerald-950/90 border border-emerald-500 text-emerald-200 shadow-md'
                  : 'text-emerald-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0" />
              <span>{subHeading}</span>
            </div>
          );
        }

        if (trimmed.startsWith('> ')) {
          const quoteText = trimmed.replace(/^>\s*/, '');
          return (
            <div
              key={idx}
              className="my-1.5 p-2.5 bg-purple-950/40 border-l-4 border-purple-400 rounded-r-lg text-purple-100 text-[11px]"
              dangerouslySetInnerHTML={{ __html: formatInlineHtml(quoteText) }}
            />
          );
        }

        if (
          (trimmed.startsWith('$$') && trimmed.endsWith('$$')) ||
          trimmed.startsWith('∂C/∂t') ||
          trimmed.startsWith('F = -v_d') ||
          trimmed.startsWith('R² =') ||
          trimmed.startsWith('MQI =')
        ) {
          const formula = trimmed.replace(/^\$\$|\$\$/g, '').trim();
          return (
            <div
              key={idx}
              className="my-2 p-2.5 bg-slate-900/95 border border-purple-700/60 rounded-lg text-center font-mono text-[11px] font-bold text-purple-200 overflow-x-auto shadow-inner"
            >
              {formula}
            </div>
          );
        }

        if (trimmed === '---' || trimmed === '***') {
          return <hr key={idx} className="border-slate-800 my-2" />;
        }

        if (
          trimmed.startsWith('* ') ||
          trimmed.startsWith('- ') ||
          trimmed.startsWith('• ') ||
          /^\d+\.\s/.test(trimmed)
        ) {
          const isNumbered = /^\d+\.\s/.test(trimmed);
          const numPrefix = isNumbered ? trimmed.match(/^(\d+\.)\s/)?.[1] : null;
          const listText = trimmed.replace(/^([*\-•]\s|\d+\.\s)/, '');
          const listElemMatch = listText.match(/^(?:\*\*)?(?:Nodo\s*)?\[(\d+)\]/i);
          const listElemNumber = listElemMatch ? parseInt(listElemMatch[1], 10) : null;
          const isListHighlighted = listElemNumber !== null && highlightedElementIdx === listElemNumber;

          return (
            <div
              key={idx}
              id={listElemNumber ? `crop-element-anchor-${listElemNumber}` : undefined}
              className={`flex items-start gap-1.5 pl-2 rounded transition-all ${
                isListHighlighted
                  ? 'bg-emerald-950/90 border border-emerald-500 text-emerald-100 p-1.5 shadow-md'
                  : ''
              }`}
            >
              <span className="text-purple-400 font-bold shrink-0">{numPrefix || '•'}</span>
              <div
                className="flex-1"
                dangerouslySetInnerHTML={{ __html: formatInlineHtml(listText) }}
              />
            </div>
          );
        }

        return (
          <p
            key={idx}
            className="text-slate-200"
            dangerouslySetInnerHTML={{ __html: formatInlineHtml(trimmed) }}
          />
        );
      })}
    </div>
  );
}

export function GeminiScreenAnalysisModal({
  onClose,
  croppedImageBase64,
  onNewCropRequested
}: Props) {
  const activePointCtx = useActivePoint();
  const [currentImage, setCurrentImage] = useState<string>(croppedImageBase64);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [qaHistory, setQaHistory] = useState<QaEntry[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Modo 0-Cuota Instantáneo ACTIVO para la apertura inicial, y Conexión a Internet (Google Search Grounding) ACTIVA para el botón «Generar»
  const [quotaSaverMode, setQuotaSaverMode] = useState<boolean>(true);
  const [useInternetOnGenerate, setUseInternetOnGenerate] = useState<boolean>(true);
  const [autoGenerateOnOpen, setAutoGenerateOnOpen] = useState<boolean>(true);
  const [selectedFocusMode, setSelectedFocusMode] = useState<string>('full_explain_all');
  const [selectedCloudModel, setSelectedCloudModel] = useState<string>('auto');
  const [lastGeneratedBadge, setLastGeneratedBadge] = useState<string | null>(null);
  const [dictamenFilter, setDictamenFilter] = useState<string>('');
  const [highlightedElementIdx, setHighlightedElementIdx] = useState<number | null>(null);
  const [latexCopied, setLatexCopied] = useState<boolean>(false);
  const [showComparePanel, setShowComparePanel] = useState<boolean>(false);
  const [savedSnapshots, setSavedSnapshots] = useState<PointSnapshot[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const printContainerRef = useRef<HTMLDivElement>(null);
  const resultsScrollRef = useRef<HTMLDivElement>(null);
  const autoAnalyzedImageRef = useRef<string | null>(null);
  const lastSyncedStreetKeyRef = useRef<string>('');
  const clientCacheRef = useRef<Map<string, QaEntry>>(new Map());

  useEffect(() => {
    if (croppedImageBase64) {
      if (typeof window !== 'undefined') {
        (window as any).__forceExpandNextModal = true;
      }
      setCurrentImage(croppedImageBase64);
    }
  }, [croppedImageBase64]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              if (base64) {
                setCurrentImage(base64);
              }
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setCurrentImage(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const rawStreetName =
    activePointCtx?.activePoint?.name ||
    activePointCtx?.activePoint?.nearestStreetName ||
    activePointCtx?.assimilation?.streetLevelMetrics?.nearestStreetName ||
    'Málaga (Centro Histórico / Red Vial)';
  const activeStreet = React.useMemo(() => {
    const parts = rawStreetName.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2 && /^\d+[a-zA-Z/-]*$/.test(parts[0])) {
      return `${parts[1]}, ${parts[0]}`;
    }
    if (parts.length >= 4 && /málaga|andalucía|españa/i.test(rawStreetName)) {
      return parts.slice(0, 2).join(', ');
    }
    return rawStreetName;
  }, [rawStreetName]);
  const activeLat = activePointCtx?.location?.lat ?? 36.7202;
  const activeLon = activePointCtx?.location?.lon ?? -4.4206;
  const activeElev = activePointCtx?.activePoint?.elevationM ?? 12;
  const activeNo2 = Number(
    (
      activePointCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ??
      activePointCtx?.data?.no2_satelite_base ??
      11.7
    ).toFixed(1)
  );
  const activeO3 = Number(
    (activePointCtx?.assimilation?.ozoneO3UgM3 ?? activePointCtx?.data?.ozone ?? 64.0).toFixed(1)
  );
  const activePm25 = Number(
    (activePointCtx?.assimilation?.pm25UgM3 ?? activePointCtx?.data?.pm2_5 ?? 5.4).toFixed(1)
  );
  const activePm10 = Number(
    (activePointCtx?.assimilation?.pm10UgM3 ?? activePointCtx?.data?.pm10 ?? +(activePm25 * 1.75)).toFixed(1)
  );
  const activeTemp = Number(
    (
      activePointCtx?.assimilation?.temperatureC ??
      activePointCtx?.data?.temperatura_malaga ??
      19.3
    ).toFixed(1)
  );
  const activeWind = Number(
    (
      (activePointCtx?.assimilation?.windSpeedKmh ??
        activePointCtx?.data?.velocidad_viento_km_h ??
        2.5) / 3.6
    ).toFixed(1)
  );
  const activeSolar = activePointCtx?.data?.shortwave_radiation ?? 620;

  const capturedContext = typeof window !== 'undefined' ? window.__LAST_GEMINI_CROP_CONTEXT__ : undefined;

  /**
   * Genera en <5ms la Síntesis o Dictamen invocando la fuente única de verdad (`src/lib/doctoralCropEngine.ts`).
   */
  const buildInstantLocalDictamen = (
    questionText: string,
    modeKey = selectedFocusMode,
    isOnDemand = false
  ): string => {
    const latestCropCtx = typeof window !== 'undefined' ? window.__LAST_GEMINI_CROP_CONTEXT__ : undefined;
    return buildUnifiedDoctoralCropDictamen({
      userPrompt: questionText,
      analysisMode: modeKey,
      isOnDemandDictamen: isOnDemand,
      croppedDomText: latestCropCtx?.visibleText || '',
      capturedWindowTitles: latestCropCtx?.windowTitles || [],
      capturedActiveTabs: latestCropCtx?.activeTabs || [],
      capturedHeadings: latestCropCtx?.headings || [],
      capturedStructuredItems: latestCropCtx?.structuredItems || [],
      cropDimensions: latestCropCtx?.cropDimensions,
      activePointContext: {
        streetName: activeStreet,
        lat: activeLat,
        lon: activeLon,
        elevationM: activeElev,
        no2: activeNo2,
        o3: activeO3,
        pm25: activePm25,
        pm10: activePm10,
        tempC: activeTemp,
        windSpeedMs: activeWind,
        solarRadiationWm2: activeSolar
      }
    });
  };

  // Compresión rápida con timeout de seguridad de 350ms para que JAMÁS pueda quedarse colgada
  const compressImageForQuota = (base64Str: string): Promise<{ dataUrl: string; mime: string }> => {
    return new Promise((resolve) => {
      if (!base64Str || typeof document === 'undefined') {
        resolve({ dataUrl: base64Str || '', mime: 'image/jpeg' });
        return;
      }
      let settled = false;
      const safeResolve = (val: { dataUrl: string; mime: string }) => {
        if (!settled) {
          settled = true;
          resolve(val);
        }
      };

      const safetyTimer = setTimeout(() => {
        safeResolve({ dataUrl: base64Str, mime: 'image/jpeg' });
      }, 350);

      const img = new Image();
      img.onload = () => {
        clearTimeout(safetyTimer);
        try {
          const maxDim = 560;
          let w = img.width || 400;
          let h = img.height || 300;
          if (w > maxDim || h > maxDim) {
            const scale = maxDim / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            safeResolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.65), mime: 'image/jpeg' });
          } else {
            safeResolve({ dataUrl: base64Str, mime: 'image/jpeg' });
          }
        } catch {
          safeResolve({ dataUrl: base64Str, mime: 'image/jpeg' });
        }
      };
      img.onerror = () => {
        clearTimeout(safetyTimer);
        safeResolve({ dataUrl: base64Str, mime: 'image/jpeg' });
      };
      img.src = base64Str;
    });
  };

  const handleAskGemini = async (
    overridePrompt?: string,
    forceInstantZeroQuota = false,
    bypassCacheForOnDemand = false,
    explicitModeKey = selectedFocusMode,
    forceInternetSearch = false
  ) => {
    const fallbackPrompt =
      DOCTORAL_FOCUS_MODES[explicitModeKey]?.prompt || DOCTORAL_FOCUS_MODES.full_explain_all.prompt;
    const promptToSend = (overridePrompt || userPrompt || fallbackPrompt).trim();
    if (!promptToSend) return;

    const latestCropCtx = typeof window !== 'undefined' ? window.__LAST_GEMINI_CROP_CONTEXT__ : undefined;
    const shouldUseCloudOrWeb = forceInternetSearch || !quotaSaverMode;
    const shouldUseGoogleSearch = forceInternetSearch && useInternetOnGenerate;

    const cacheKey = `${shouldUseGoogleSearch ? 'web' : 'local'}::${explicitModeKey}::${promptToSend.toLowerCase()}::${(latestCropCtx?.windowTitles || []).join('|')}::${(latestCropCtx?.activeTabs || []).join('|')}::${(latestCropCtx?.visibleText || '').slice(0, 300)}::${activeStreet}`;

    // 1. Modo 0-Cuota Instantáneo (< 5 ms) solo si NO se ha solicitado consulta conectada a Internet
    if ((forceInstantZeroQuota || !shouldUseCloudOrWeb) && !shouldUseGoogleSearch) {
      const isSpecializedOnDemand = Boolean(bypassCacheForOnDemand);
      const instantAnswer = buildInstantLocalDictamen(
        promptToSend,
        explicitModeKey,
        isSpecializedOnDemand
      );
      const entry: QaEntry = {
        id: `qa_${Date.now()}`,
        question: promptToSend,
        answer: instantAnswer,
        timestamp: new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        model: isSpecializedOnDemand
          ? `Dictamen Doctoral (${DOCTORAL_FOCUS_MODES[explicitModeKey]?.shortLabel || 'Enfoque'} · 0-Cuota <5 ms)`
          : `Síntesis Directa del Recuadro (0-Cuota · ${detectedItemsCount || 'Completo'} elementos)`,
        webSearchUsed: false
      };
      clientCacheRef.current.set(cacheKey, entry);
      setQaHistory((prev) => [entry, ...prev]);
      if (!overridePrompt && userPrompt) setUserPrompt('');
      setLoading(false);
      setError(null);
      setLastGeneratedBadge(`✓ Dictamen generado (${entry.timestamp})`);
      setTimeout(() => {
        resultsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 20);
      return;
    }

    // 2. Si no es regeneración a voluntad y está en caché local, devolver al instante
    if (!bypassCacheForOnDemand) {
      const cachedEntry = clientCacheRef.current.get(cacheKey);
      if (cachedEntry) {
        const nowTs = new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        setQaHistory((prev) => [
          {
            ...cachedEntry,
            id: `qa_${Date.now()}`,
            timestamp: nowTs,
            model: `${cachedEntry.model} · Caché`
          },
          ...prev
        ]);
        if (!overridePrompt && userPrompt) setUserPrompt('');
        setLastGeneratedBadge(`✓ Dictamen generado (${nowTs})`);
        setTimeout(() => {
          resultsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 20);
        return;
      }
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutMs = shouldUseGoogleSearch ? 14000 : 6000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const compressed = await compressImageForQuota(currentImage);

      const response = await fetch('/api/gemini/screen-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          imageBase64: compressed.dataUrl,
          mimeType: compressed.mime,
          userPrompt: promptToSend,
          analysisMode: explicitModeKey,
          preferLocalQuotaSaver: !shouldUseCloudOrWeb && !shouldUseGoogleSearch,
          preferredModel: selectedCloudModel,
          useGoogleSearch: shouldUseGoogleSearch,
          croppedDomText: latestCropCtx?.visibleText || '',
          capturedWindowTitles: latestCropCtx?.windowTitles || [],
          capturedActiveTabs: latestCropCtx?.activeTabs || [],
          capturedHeadings: latestCropCtx?.headings || [],
          capturedStructuredItems: latestCropCtx?.structuredItems || [],
          cropDimensions: latestCropCtx?.cropDimensions,
          activePointContext: {
            streetName: activeStreet,
            lat: activeLat,
            lon: activeLon,
            elevationM: activeElev,
            no2: activeNo2,
            o3: activeO3,
            pm25: activePm25,
            pm10: activePm10,
            tempC: activeTemp,
            windSpeedMs: activeWind,
            solarRadiationWm2: activeSolar,
            pavementType: 'Viario Urbano de Málaga',
            nearestStation: `Red Oficial de Telemetría (${SYSTEM_PROPAGATION.stationsCount} terrestres + ${SYSTEM_PROPAGATION.satellitesCount} satélites)`
          }
        })
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));
      const answerText =
        response.ok && data?.analysis
          ? data.analysis
          : buildInstantLocalDictamen(promptToSend, explicitModeKey, true);

      const newEntry: QaEntry = {
        id: `qa_${Date.now()}`,
        question: promptToSend,
        answer: answerText,
        timestamp: new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        model: data?.model || (shouldUseGoogleSearch ? 'Gemini + 🌐 Google Search en Vivo' : 'Balanceador Dinámico Gemini'),
        webSearchUsed: Boolean(data?.webSearchUsed),
        groundingSources: Array.isArray(data?.groundingSources) ? data.groundingSources : []
      };

      clientCacheRef.current.set(cacheKey, newEntry);
      setQaHistory((prev) => [newEntry, ...prev]);
      if (!overridePrompt && userPrompt) setUserPrompt('');
      setLastGeneratedBadge(
        newEntry.webSearchUsed
          ? `🌐 Conectado a Internet (${newEntry.timestamp})`
          : `✓ Dictamen generado (${newEntry.timestamp})`
      );
      setTimeout(() => {
        resultsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 20);
    } catch {
      clearTimeout(timeoutId);
      const fallbackAnswer = buildInstantLocalDictamen(promptToSend, explicitModeKey, true);
      const fallbackEntry: QaEntry = {
        id: `qa_${Date.now()}`,
        question: promptToSend,
        answer: fallbackAnswer,
        timestamp: new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        model: 'Síntesis Doctoral Exhaustiva del Recuadro (Respaldo Determinista Instantáneo)',
        webSearchUsed: false
      };
      clientCacheRef.current.set(cacheKey, fallbackEntry);
      setQaHistory((prev) => [fallbackEntry, ...prev]);
      if (!overridePrompt && userPrompt) setUserPrompt('');
      setLastGeneratedBadge(`✓ Dictamen generado (${fallbackEntry.timestamp})`);
      setTimeout(() => {
        resultsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 20);
    } finally {
      setLoading(false);
    }
  };

  // Inicializar primer punto en la bandeja de comparación y emitir Síntesis Doctoral inicial al abrir el encuadre
  useEffect(() => {
    if (savedSnapshots.length === 0) {
      const cropCtx = typeof window !== 'undefined' ? window.__LAST_GEMINI_CROP_CONTEXT__ : undefined;
      setSavedSnapshots([
        {
          id: `snap_init`,
          streetName: activeStreet,
          lat: activeLat,
          lon: activeLon,
          elevationM: activeElev,
          no2: activeNo2,
          o3: activeO3,
          pm25: activePm25,
          pm10: activePm10,
          tempC: activeTemp,
          windSpeedMs: activeWind,
          windowTitle: cropCtx?.windowTitles?.[0] || 'Encuadre Inicial',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [activeStreet, activeLat, activeLon, activeElev, activeNo2, activeO3, activePm25, activePm10, activeTemp, activeWind, savedSnapshots.length]);

  useEffect(() => {
    if (
      autoGenerateOnOpen &&
      croppedImageBase64 &&
      autoAnalyzedImageRef.current !== croppedImageBase64
    ) {
      autoAnalyzedImageRef.current = croppedImageBase64;
      lastSyncedStreetKeyRef.current = `${activeStreet}|${activeLat.toFixed(4)}|${activeLon.toFixed(4)}|${activeNo2}`;
      const cropCtx = typeof window !== 'undefined' ? window.__LAST_GEMINI_CROP_CONTEXT__ : undefined;
      const winNames = cropCtx?.windowTitles?.length ? ` [${cropCtx.windowTitles.join(' · ')}]` : '';
      const tabNames = cropCtx?.activeTabs?.length ? ` (Pestaña: ${cropCtx.activeTabs.join(' · ')})` : '';
      handleAskGemini(
        `Explica de forma exhaustiva y muy extensa ÚNICAMENTE todo lo que está dentro de este recuadro seleccionado${winNames}${tabNames}: qué es cada elemento, qué significa cada cifra y símbolo con notación legible, y para qué está ahí.`,
        true,
        false,
        'full_explain_all',
        false
      );
    }
  }, [croppedImageBase64, autoGenerateOnOpen]);

  // Propagación reactiva instantánea (<5 ms) cuando el usuario selecciona otra calle en el mapa (Regla 10)
  useEffect(() => {
    const currentKey = `${activeStreet}|${activeLat.toFixed(4)}|${activeLon.toFixed(4)}|${activeNo2}`;
    if (!lastSyncedStreetKeyRef.current) {
      lastSyncedStreetKeyRef.current = currentKey;
      return;
    }
    if (lastSyncedStreetKeyRef.current !== currentKey && qaHistory.length > 0 && quotaSaverMode) {
      lastSyncedStreetKeyRef.current = currentKey;
      const topEntry = qaHistory[0];
      const isTopOnDemand = topEntry.model.includes('Dictamen Doctoral');
      const updatedAnswer = buildInstantLocalDictamen(
        topEntry.question,
        selectedFocusMode,
        isTopOnDemand
      );
      const nowTs = new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setQaHistory((prev) =>
        prev.length > 0
          ? [
              {
                ...prev[0],
                answer: updatedAnswer,
                timestamp: nowTs
              },
              ...prev.slice(1)
            ]
          : prev
      );
      setLastGeneratedBadge(`✓ Sincronizado con ${activeStreet} (${nowTs})`);
    }
  }, [activeStreet, activeLat, activeLon, activeNo2, activeO3, activePm25, activePm10, activeTemp, activeWind, quotaSaverMode, selectedFocusMode]);

  // Botón «Emitir Dictamen Doctoral Integral (A Voluntad)» (izquierda) y «Generar» (abajo derecha)
  const handleEmitDictamenAtWill = (forceInternet = false) => {
    const customText = userPrompt.trim();
    const chosenFocus =
      DOCTORAL_FOCUS_MODES[selectedFocusMode]?.prompt || DOCTORAL_FOCUS_MODES.full_explain_all.prompt;
    const finalDirective = customText || chosenFocus;
    handleAskGemini(
      finalDirective,
      !forceInternet && quotaSaverMode,
      true,
      selectedFocusMode,
      forceInternet
    );
  };

  // Botón «Cargar Punto»: captura una instantánea del punto activo actual, la guarda para comparar y actualiza el dictamen
  const handleLoadActivePointSnapshot = () => {
    const cropCtx = typeof window !== 'undefined' ? window.__LAST_GEMINI_CROP_CONTEXT__ : undefined;
    const newSnap: PointSnapshot = {
      id: `snap_${Date.now()}`,
      streetName: activeStreet,
      lat: activeLat,
      lon: activeLon,
      elevationM: activeElev,
      no2: activeNo2,
      o3: activeO3,
      pm25: activePm25,
      pm10: activePm10,
      tempC: activeTemp,
      windSpeedMs: activeWind,
      windowTitle: cropCtx?.windowTitles?.[0] || 'Punto Sincronizado',
      timestamp: new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
    setSavedSnapshots((prev) => [newSnap, ...prev.slice(0, 7)]);
    handleAskGemini(
      `Analiza el recuadro sincronizado con los datos cargados del punto activo en ${activeStreet} (${activeLat.toFixed(4)}°N, ${activeLon.toFixed(4)}°W; NO₂=${activeNo2} µg/m³, O₃=${activeO3} µg/m³, PM₂.₅=${activePm25} µg/m³, PM₁₀=${activePm10} µg/m³, T=${activeTemp}°C, Viento=${activeWind} m/s).`,
      quotaSaverMode,
      true,
      selectedFocusMode,
      !quotaSaverMode && useInternetOnGenerate
    );
  };

  const handleCopyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(cleanScientificSymbols(text));
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSaveReport = () => {
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const header = [
      '# DICTAMEN CIENTÍFICO DEL RECUADRO / PESTAÑA SELECCIONADA — GEMELO DIGITAL DE MÁLAGA',
      '## UNED (Universidad Nacional de Educación a Distancia) — Programa de Doctorado',
      '### Tesis Doctoral: Modelización de Calidad del Aire a Microescala en Málaga',
      `Fecha de Emisión: ${new Date().toLocaleString('es-ES')}`,
      `Ventana / Pestaña Enmarcada: ${(capturedContext?.windowTitles || []).join(' · ') || 'Encuadre Seleccionado'} (${(capturedContext?.activeTabs || []).join(' · ') || 'Vista Activa'})`,
      `Ubicación Sincronizada: ${activeStreet} (Lat: ${activeLat.toFixed(4)}, Lon: ${activeLon.toFixed(4)})`,
      `Contexto Observacional: NO₂=${activeNo2} µg/m³ | O₃=${activeO3} µg/m³ | PM₂.₅=${activePm25} µg/m³ | Temp=${activeTemp}°C | Viento=${activeWind} m/s`,
      `Red de Detección: ${SYSTEM_PROPAGATION.stationsCount} Estaciones Terrestres Oficiales + ${SYSTEM_PROPAGATION.satellitesCount} Misiones Satelitales Orbitales`,
      '---',
      ''
    ].join('\n');

    const body = qaHistory
      .map(
        (item, i) =>
          `### Dictamen ${i + 1} [${item.timestamp}] (Motor: ${item.model})\n` +
          `**Directriz del Doctorando:**\n${item.question}\n\n` +
          `**Síntesis Doctoral Exhaustiva del Recuadro:**\n${cleanScientificSymbols(item.answer)}\n\n---\n`
      )
      .join('\n');

    const fullContent = `${header}\n${body || '*(Sin consultas registradas aún)*'}`;
    const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dictamen_doctoral_recuadro_${dateStr}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setLastGeneratedBadge(`✓ Markdown FAIR descargado`);
  };

  // Exportación FAIR en CSV (UTF-8 con BOM) de los elementos extraídos y la telemetría sincronizada (Regla 8)
  const handleExportCsv = () => {
    const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const escapeCsv = (val: string | number) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows: string[] = [
      [
        'indice',
        'categoria_elemento',
        'elemento_enmarcado',
        'ventana_origen',
        'pestana_activa',
        'calle_sincronizada',
        'lat_wgs84',
        'lon_wgs84',
        'cota_m',
        'no2_ug_m3',
        'o3_ug_m3',
        'pm25_ug_m3',
        'pm10_ug_m3',
        'temp_c',
        'viento_m_s',
        'red_detectores'
      ].join(',')
    ];

    const items = consolidateFramedItems(capturedContext?.structuredItems || []);
    const winName = cleanScientificSymbols(
      capturedContext?.windowTitles?.[0] || capturedContext?.headings?.[0] || 'Recuadro Seleccionado'
    );
    const tabName = cleanScientificSymbols(capturedContext?.activeTabs?.[0] || 'Vista Activa');
    const detectorSummary = `${SYSTEM_PROPAGATION.stationsCount} terrestres + ${SYSTEM_PROPAGATION.satellitesCount} satelites`;

    if (items.length > 0) {
      items.forEach((it, idx) => {
        rows.push(
          [
            idx + 1,
            escapeCsv(cleanScientificSymbols(it.kind)),
            escapeCsv(cleanScientificSymbols(it.text)),
            escapeCsv(winName),
            escapeCsv(tabName),
            escapeCsv(activeStreet),
            activeLat.toFixed(5),
            activeLon.toFixed(5),
            activeElev,
            activeNo2,
            activeO3,
            activePm25,
            activePm10,
            activeTemp,
            activeWind,
            escapeCsv(detectorSummary)
          ].join(',')
        );
      });
    } else {
      rows.push(
        [
          1,
          escapeCsv('TELEMETRIA_SINCRONIZADA'),
          escapeCsv(activeStreet),
          escapeCsv(winName),
          escapeCsv(tabName),
          escapeCsv(activeStreet),
          activeLat.toFixed(5),
          activeLon.toFixed(5),
          activeElev,
          activeNo2,
          activeO3,
          activePm25,
          activePm10,
          activeTemp,
          activeWind,
          escapeCsv(detectorSummary)
        ].join(',')
      );
    }

    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sintesis_doctoral_recuadro_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setLastGeneratedBadge(`✓ CSV FAIR descargado (${items.length || 1} filas)`);
  };

  // Exportación FAIR en GeoJSON (EPSG:4326) del punto activo, instantáneas comparadas y elementos del recuadro (Regla 8)
  const handleExportGeoJson = () => {
    const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const items = consolidateFramedItems(capturedContext?.structuredItems || []);
    const winName = cleanScientificSymbols(
      capturedContext?.windowTitles?.[0] || capturedContext?.headings?.[0] || 'Recuadro Seleccionado'
    );
    const tabName = cleanScientificSymbols(capturedContext?.activeTabs?.[0] || 'Vista Activa');

    const geojson = {
      type: 'FeatureCollection',
      metadata: {
        institution: 'UNED — Programa de Doctorado (Tesis Doctoral Málaga)',
        module: 'Síntesis Doctoral Exhaustiva del Recuadro / Pestaña',
        framedWindow: winName,
        framedTab: tabName,
        stationsCount: SYSTEM_PROPAGATION.stationsCount,
        satellitesCount: SYSTEM_PROPAGATION.satellitesCount,
        exportedAt: new Date().toISOString()
      },
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [Number(activeLon.toFixed(6)), Number(activeLat.toFixed(6)), activeElev]
          },
          properties: {
            role: 'ACTIVE_SYNCHRONIZED_POINT',
            streetName: activeStreet,
            elevationM: activeElev,
            no2_ug_m3: activeNo2,
            o3_ug_m3: activeO3,
            pm25_ug_m3: activePm25,
            pm10_ug_m3: activePm10,
            temp_c: activeTemp,
            wind_m_s: activeWind,
            eu2030_no2_compliant: activeNo2 <= 20,
            framedElementsCount: items.length,
            framedElements: items.slice(0, 30).map((it, i) => ({
              index: i + 1,
              kind: cleanScientificSymbols(it.kind),
              text: cleanScientificSymbols(it.text)
            })),
            latestDictamen: qaHistory[0] ? cleanScientificSymbols(qaHistory[0].answer) : null
          }
        },
        ...savedSnapshots.slice(0, 10).map((snap, sIdx) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [Number(snap.lon.toFixed(6)), Number(snap.lat.toFixed(6)), snap.elevationM]
          },
          properties: {
            role: `COMPARISON_SNAPSHOT_${sIdx + 1}`,
            timestamp: snap.timestamp,
            streetName: snap.streetName,
            windowTitle: snap.windowTitle,
            no2_ug_m3: snap.no2,
            o3_ug_m3: snap.o3,
            pm25_ug_m3: snap.pm25,
            pm10_ug_m3: snap.pm10,
            temp_c: snap.tempC,
            wind_m_s: snap.windSpeedMs
          }
        }))
      ]
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: 'application/geo+json;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sintesis_doctoral_recuadro_${dateStr}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setLastGeneratedBadge(`✓ GeoJSON FAIR descargado`);
  };

  const handlePrintReport = () => {
    try {
      const { doc, filename } = generateDoctoralCropPdf({
        currentImage,
        activeStreet,
        activeLat,
        activeLon,
        activeElev,
        activeNo2,
        activeO3,
        activePm25,
        activePm10,
        activeTemp,
        activeWind,
        detectedWindowName,
        detectedActiveTab,
        detectedItemsCount,
        structuredItems: capturedContext?.structuredItems,
        qaHistory
      });

      // 1. Guardar y descargar directamente el archivo PDF de alta resolución
      doc.save(filename);

      // 2. Feedback visual claro en la barra inferior
      setLastGeneratedBadge(`✓ PDF formal descargado: ${filename}`);

      // 3. Fallback de autoPrint si el visor de PDF del navegador lo admite
      try {
        doc.autoPrint();
      } catch {
        // Silencioso
      }
    } catch (err) {
      console.error('Error generando PDF doctoral del recuadro:', err);
      try {
        window.print();
      } catch {
        // Fallback
      }
    }
  };

  const handleDownloadCroppedPng = () => {
    if (!currentImage) return;
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const a = document.createElement('a');
    a.href = currentImage;
    a.download = `recuadro_doctoral_malaga_${dateStr}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLatexFigure = () => {
    const winTitle = cleanScientificSymbols(
      capturedContext?.windowTitles?.[0] ||
        capturedContext?.headings?.[0] ||
        'Recuadro Analítico del Gemelo Digital'
    );
    const items = (capturedContext?.structuredItems || []).slice(0, 12);
    const itemRows = items
      .map((it, idx) => {
        const cleanTxt = cleanScientificSymbols(it.text).replace(/[%&_#$]/g, (m) => `\\${m}`);
        return `    ${idx + 1} & \\textbf{${it.kind}} & ${cleanTxt} \\\\ \\hline`;
      })
      .join('\n');

    const latexSnippet = [
      '% --- ANEXO DE TESIS DOCTORAL (UNED - PROGRAMA DE DOCTORADO) ---',
      '\\begin{figure}[htbp]',
      '  \\centering',
      '  \\includegraphics[width=0.92\\textwidth]{recuadro_doctoral_malaga.png}',
      `  \\caption{Síntesis metrológica y físico-química del recuadro \\textbf{${winTitle}} sincronizado en \\textit{${activeStreet}} (${activeLat.toFixed(4)}$^\\circ$N, ${activeLon.toFixed(4)}$^\\circ$W; $\\text{NO}_2 = ${activeNo2}\\,\\mu\\text{g/m}^3$, $\\text{O}_3 = ${activeO3}\\,\\mu\\text{g/m}^3$, $\\text{PM}_{2.5} = ${activePm25}\\,\\mu\\text{g/m}^3$). Red integrada: ${SYSTEM_PROPAGATION.stationsCount} estaciones terrestres oficiales y ${SYSTEM_PROPAGATION.satellitesCount} misiones satelitales.}`,
      '  \\label{fig:gemelo_digital_recuadro}',
      '\\end{figure}',
      '',
      '\\begin{table}[htbp]',
      '  \\centering',
      '  \\small',
      '  \\begin{tabular}{|c|l|p{9.5cm}|}',
      '    \\hline',
      '    \\textbf{\\#} & \\textbf{Categoría} & \\textbf{Elemento Extraído del Recuadro} \\\\ \\hline',
      itemRows || `    1 & \\textbf{MÉTRICA} & Telemetría sincronizada en ${activeStreet} \\\\ \\hline`,
      '  \\end{tabular}',
      `  \\caption{Desglose determinista de los elementos capturados en el recuadro (${items.length || 1} ítems auditados).}`,
      '\\end{table}'
    ].join('\n');

    navigator.clipboard.writeText(latexSnippet);
    setLatexCopied(true);
    setTimeout(() => setLatexCopied(false), 2200);
  };

  const handleJumpToElement = (elementNumber: number) => {
    setDictamenFilter('');
    setHighlightedElementIdx(elementNumber);
    setTimeout(() => {
      const container = resultsScrollRef.current;
      const targetEl = document.getElementById(`crop-element-anchor-${elementNumber}`);
      if (container && targetEl) {
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const offset = targetRect.top - containerRect.top + container.scrollTop - 16;
        container.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
      }
    }, 30);
    setTimeout(() => setHighlightedElementIdx(null), 3500);
  };

  const detectedItems = consolidateFramedItems(capturedContext?.structuredItems || []);
  const detectedItemsCount = detectedItems.length;
  const detectedWindowName =
    capturedContext?.windowTitles?.[0] ||
    capturedContext?.headings?.[0] ||
    'Área Seleccionada en el Recuadro';
  const detectedActiveTab = capturedContext?.activeTabs?.[0] || null;

  // Verificación matemática en vivo si el recuadro contiene pesos porcentuales (ej. w₁, w₂, w₃ o EOI / CAMS / PINN)
  const percentageMatches = (capturedContext?.visibleText || '').match(/(\d+(?:[.,]\d+)?)\s*%/g) || [];
  const parsedPercentages = percentageMatches
    .map((s) => parseFloat(s.replace('%', '').replace(',', '.')))
    .filter((n) => !isNaN(n) && n > 0 && n <= 100);
  const hasAssimilationWeights =
    /ĉ|\\hat\{c\}|w_1|w₁|c_obs|c_cams|c_pinn|observación\s*\(eoi\)/i.test(
      capturedContext?.visibleText || ''
    ) && parsedPercentages.length >= 2;
  const sumPercentages = parsedPercentages.slice(0, 3).reduce((acc, v) => acc + v, 0);

  const handleDownloadDirectorGuidelinesPdf = () => {
    const liveMetrics = buildDoctoralFivePointsMetricsFromContext(activePointCtx);
    const { filename } = downloadDoctoralFivePointsThesisPdf({
      streetName: activeStreet,
      metrics: liveMetrics,
      pm25UgM3: activePm25
    });
    setLastGeneratedBadge(`✓ PDF Directrices Director (12 Tablas): ${filename}`);
  };

  return (
    <DraggableWindow
      title="📐 Síntesis Doctoral Exhaustiva del Recuadro / Pestaña (UNED Doctorado)"
      icon={<Sparkles className="w-4 h-4 text-purple-400" />}
      onClose={onClose}
      defaultCollapsed={false}
      headerExtra={
        <div className="flex items-center gap-1">
          <ScientificTooltip
            position="bottom"
            title="Impresión Extensa en PDF: Directrices del Director de Tesis (5 Bloques + 7 Anexos / 12 Tablas)"
            formula="\text{PDF Vectorial Multipágina A4} \;\propto\; \mathbf{x}_{\text{mapa}}(\phi, \lambda, \text{NO}_2, H/W, \text{SVF})"
            explanation={`Genera y descarga en 1 clic la memoria extensa en PDF (5 Bloques + 7 Anexos Empíricos, 12 Tablas) recalculada dinámicamente para el punto activo del mapa: ${activeStreet} (${activeLat.toFixed(5)}°N, ${activeLon.toFixed(5)}°W; NO₂ = ${activeNo2} µg/m³).`}
            normativeRef="UNED Doctorado — Directrices del Director de Tesis"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadDirectorGuidelinesPdf();
              }}
              className="px-2 py-0.5 rounded bg-gradient-to-r from-rose-700 to-amber-700 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-[8.5px] font-mono border border-amber-400/80 flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Download className="w-2.5 h-2.5 text-amber-200" />
              <span>📕 PDF Directrices Director (12 Tablas)</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="bottom"
            title="Imprimir / Descargar PDF Completo de Este Recuadro"
            formula="\text{PDF Multipágina A4} \longrightarrow \text{100\% Ítems + Dictámenes}"
            explanation={`Descarga en PDF multipágina A4 el análisis completo del recuadro enmarcado y todos sus elementos sincronizados con ${activeStreet}.`}
            normativeRef="UNED — Anexo Gráfico Doctoral"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrintReport();
              }}
              className="px-2 py-0.5 rounded bg-purple-900/90 hover:bg-purple-800 text-purple-100 font-bold text-[8.5px] font-mono border border-purple-500/80 flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Printer className="w-2.5 h-2.5 text-purple-300" />
              <span>PDF Recuadro</span>
            </button>
          </ScientificTooltip>
        </div>
      }
      className="w-full max-w-5xl max-h-[90vh] bg-slate-950/95 border border-purple-700/80 rounded-xl overflow-hidden p-0 shadow-2xl"
      headerColorClass="text-purple-300"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />

      <div className="space-y-2.5 font-sans text-slate-200 p-2">
        {/* Banner Superior de Punto Activo y Control de Cuota / Balanceador */}
        <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg flex flex-wrap items-center justify-between gap-2 text-[10px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-purple-300 font-bold">
              <MapPin className="w-3.5 h-3.5 text-purple-400" />
              {activeStreet} ({activeLat.toFixed(4)}°N, {activeLon.toFixed(4)}°W)
            </span>
            <span className="bg-purple-950/80 text-purple-300 border border-purple-700/60 px-2 py-0.5 rounded font-mono font-bold">
              NO₂: {activeNo2} µg/m³ · O₃: {activeO3} µg/m³ · PM₂.₅: {activePm25} µg/m³
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <ScientificTooltip
              position="bottom"
              title="Conmutador de Motor Analítico (0-Cuota Instantáneo vs Balanceador IA en Nube)"
              formula="\text{Modo 0-Cuota } (<5\,\text{ms}) \;\Longleftrightarrow\; \text{Pool Multi-Modelo Gemini}"
              explanation="Conmuta y ejecuta al instante entre el Motor Determinista 0-Cuota (<5 ms, resolución algebraica y normativa local sin latencia) y el Balanceador Dinámico Multi-Modelo Gemini en Nube."
              normativeRef="UNED — Eficiencia Computacional y Continuidad Operativa"
            >
              <button
                type="button"
                onClick={() => {
                  const nextQuotaMode = !quotaSaverMode;
                  setQuotaSaverMode(nextQuotaMode);
                  const chosenFocus =
                    DOCTORAL_FOCUS_MODES[selectedFocusMode]?.prompt ||
                    DOCTORAL_FOCUS_MODES.full_explain_all.prompt;
                  handleAskGemini(
                    userPrompt.trim() || chosenFocus,
                    nextQuotaMode,
                    true,
                    selectedFocusMode,
                    !nextQuotaMode && useInternetOnGenerate
                  );
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[9.5px] font-bold cursor-pointer transition-colors border ${
                  quotaSaverMode
                    ? 'bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 border-emerald-500 shadow-sm'
                    : 'bg-indigo-900/90 hover:bg-indigo-800 text-indigo-100 border-indigo-500 shadow-sm'
                }`}
              >
                <Zap className="w-3 h-3 text-yellow-300 shrink-0" />
                <span>
                  {quotaSaverMode
                    ? 'Modo 0-Cuota Instantáneo: ACTIVO (<5 ms)'
                    : 'Modo Balanceador IA Multi-Modelo: ACTIVO'}
                </span>
              </button>
            </ScientificTooltip>

            {!quotaSaverMode && (
              <ScientificTooltip content="Selecciona el pool de modelo Gemini o deja 'Auto-Cuota Dinámico' para que el sistema rote automáticamente al modelo que tenga más cuota disponible.">
                <select
                  value={selectedCloudModel}
                  onChange={(e) => setSelectedCloudModel(e.target.value)}
                  className="bg-slate-950 border border-indigo-600/70 text-indigo-200 rounded px-2 py-1 text-[9.5px] font-bold focus:outline-none cursor-pointer"
                >
                  <option value="auto">🔄 Auto-Cuota (Mayor Cuota Libre)</option>
                  <option value="gemini-3.1-flash-lite-preview">⚡ Flash-Lite 3.1 (Máx. Cuota)</option>
                  <option value="gemini-2.5-flash-lite">🛡️ Flash-Lite 2.5 (Pool Respaldo)</option>
                  <option value="gemini-3-flash-preview">✨ Gemini 3 Flash (Multimodal)</option>
                  <option value="gemini-3.1-pro-preview">🎓 Gemini 3.1 Pro (STEM)</option>
                </select>
              </ScientificTooltip>
            )}

            <ScientificTooltip
              position="bottom"
              title="Subir Captura o Gráfico Externo (+ Subir Imagen)"
              formula="I_{\text{input}} \in \{\text{PNG, JPEG, WebP}\} \longrightarrow \text{Base64 DataURL}"
              explanation="Carga cualquier imagen, diagrama o recorte guardado en disco (además del atajo directo Ctrl+V desde el portapapeles) para someterlo a auditoría físico-química y normativa."
              normativeRef="UNED — Anexo Gráfico de Memoria Doctoral"
            >
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[9.5px] font-bold cursor-pointer transition-colors"
              >
                <Upload className="w-3 h-3 text-emerald-400" />
                <span>+ Subir Imagen</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              position="bottom"
              title="Cargar e Inyectar Telemetría del Punto Activo (Cargar Punto)"
              formula="\mathbf{x}_{\text{activo}} = (\phi, \lambda, z_{\text{MDE}}, \text{NO}_2, \text{O}_3, \text{PM}_{2.5}, \text{PM}_{10}, T, u)"
              explanation={`Captura una instantánea metrológica de la calle activa (${activeStreet}), la guarda en la bandeja de comparación y actualiza el dictamen con sus valores asimilados en tiempo real.`}
              normativeRef="Sincronización Atómica ActivePointContext (Regla 10)"
            >
              <button
                onClick={handleLoadActivePointSnapshot}
                className="flex items-center gap-1 px-2 py-1 bg-indigo-950/90 hover:bg-indigo-900 text-indigo-200 border border-indigo-600/80 rounded text-[9.5px] font-bold cursor-pointer transition-colors"
              >
                <MapPin className="w-3 h-3 text-indigo-300" />
                <span>Cargar Punto</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              position="bottom"
              title="Comparador Multi-Punto y Multi-Encuadre (Comparar)"
              formula="\Delta C_i = C_i(\mathbf{x}_{\text{actual}}) - C_i(\mathbf{x}_{\text{ref}})"
              explanation="Despliega la tabla comparativa lado a lado entre los puntos geográficos o recuadros cargados, evaluando gradientes espaciales de NO₂, O₃ y PM₂.₅ frente a la Directiva (UE) 2024/2881."
              normativeRef="Directiva (UE) 2024/2881 · Evaluación Espacial Comparada"
            >
              <button
                onClick={() => setShowComparePanel((v) => !v)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[9.5px] font-bold cursor-pointer transition-colors border ${
                  showComparePanel
                    ? 'bg-amber-900/90 text-amber-100 border-amber-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-700/60'
                }`}
              >
                <GitCompare className="w-3 h-3 text-amber-400" />
                <span>Comparar ({savedSnapshots.length})</span>
              </button>
            </ScientificTooltip>

            {onNewCropRequested && (
              <ScientificTooltip
                position="bottom"
                title="Nuevo Encuadre Interactivo de Pantalla (Re-encuadrar)"
                formula="\Omega_{\text{crop}} = [x_1, x_2] \times [y_1, y_2] \subset \mathbb{R}^2"
                explanation="Activa inmediatamente la retícula de selección para recortar otra ventana, pestaña o gráfica del Gemelo Digital."
                normativeRef="Motor Nativo Canvas 2D (<15 ms)"
              >
                <button
                  onClick={onNewCropRequested}
                  className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[9.5px] font-bold cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3 text-sky-400" />
                  <span>Re-encuadrar</span>
                </button>
              </ScientificTooltip>
            )}

            <ScientificTooltip
              position="bottom"
              title="Impresión Formal en PDF para Tribunal Doctoral (Imprimir PDF)"
              formula="\text{Anexo UNED} \longrightarrow \text{Formato A4 Maquetado (PDF)}"
              explanation="Abre el diálogo de impresión/exportación a PDF con maquetación académica formal de la UNED, incluyendo la figura enmarcada y todos los dictámenes emitidos."
              normativeRef="EIDUNED — Formato Oficial de Memoria de Tesis"
            >
              <button
                onClick={handlePrintReport}
                className="flex items-center gap-1 px-2 py-1 bg-purple-900/80 hover:bg-purple-800 text-purple-100 border border-purple-600 rounded text-[9.5px] font-bold cursor-pointer transition-colors"
              >
                <Printer className="w-3 h-3 text-purple-300" />
                <span>Imprimir PDF</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              position="bottom"
              title="Guardar Dictamen Doctoral en Markdown (Guardar .MD)"
              formula="\text{Exportación FAIR} \longrightarrow \texttt{dictamen\_doctoral\_recuadro.md}"
              explanation="Descarga el informe completo con todos los dictámenes, coordenadas y telemetría sincronizada en formato Markdown (.md) editable."
              normativeRef="Principios FAIR de Ciencia Abierta (Regla 8)"
            >
              <button
                onClick={handleSaveReport}
                className="flex items-center gap-1 px-2 py-1 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-600 rounded text-[9.5px] font-bold cursor-pointer transition-colors"
              >
                <Download className="w-3 h-3 text-emerald-300" />
                <span>Guardar</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              position="bottom"
              title="Exportar Tabla de Elementos y Telemetría en CSV (FAIR)"
              formula="\text{Exportación Tabular FAIR} \longrightarrow \texttt{sintesis\_doctoral\_recuadro.csv}"
              explanation="Descarga en formato CSV (UTF-8 con BOM compatible con Excel, R y Python) todos los elementos extraídos del recuadro junto con las coordenadas y concentraciones sincronizadas del punto activo."
              normativeRef="Principios FAIR de Ciencia Abierta (Regla 8 — CSV)"
            >
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1 px-2 py-1 bg-teal-950/90 hover:bg-teal-900 text-teal-200 border border-teal-600/80 rounded text-[9.5px] font-bold cursor-pointer transition-colors"
              >
                <Download className="w-3 h-3 text-teal-300" />
                <span>CSV</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              position="bottom"
              title="Exportar Coordenadas, Instantáneas y Elementos en GeoJSON (FAIR)"
              formula="\text{FeatureCollection EPSG:4326} \longrightarrow \texttt{sintesis\_doctoral\_recuadro.geojson}"
              explanation="Descarga el archivo geoespacial estándar GeoJSON (RFC 7946, WGS84) con el punto activo sincronizado, las instantáneas de comparación y los elementos auditados del recuadro para QGIS/ArcGIS."
              normativeRef="Principios FAIR de Ciencia Abierta (Regla 8 — GeoJSON)"
            >
              <button
                onClick={handleExportGeoJson}
                className="flex items-center gap-1 px-2 py-1 bg-cyan-950/90 hover:bg-cyan-900 text-cyan-200 border border-cyan-600/80 rounded text-[9.5px] font-bold cursor-pointer transition-colors"
              >
                <Globe className="w-3 h-3 text-cyan-300" />
                <span>GeoJSON</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              position="bottom"
              title="Copiar Entorno LaTeX (\begin{figure} + \begin{table})"
              formula="\texttt{\textbackslash includegraphics} + \texttt{\textbackslash begin\{tabular\}}"
              explanation="Copia al portapapeles el código LaTeX completo con pie de figura y tabla de elementos extraídos, listo para pegar en Overleaf."
              normativeRef="Plantilla LaTeX Tesis Doctoral UNED"
            >
              <button
                onClick={handleCopyLatexFigure}
                className="flex items-center gap-1 px-2 py-1 bg-indigo-950/90 hover:bg-indigo-900 text-indigo-200 border border-indigo-600/80 rounded text-[9.5px] font-bold cursor-pointer transition-colors"
              >
                {latexCopied ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-indigo-300" />
                )}
                <span>{latexCopied ? '¡LaTeX!' : 'LaTeX'}</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              position="bottom"
              title="Descargar Imagen PNG del Recuadro"
              formula="I_{\text{crop}} \longrightarrow \texttt{recuadro\_doctoral\_malaga.png}"
              explanation="Descarga en alta resolución (DPR 2x) únicamente la imagen PNG exacta del recuadro recortado."
              normativeRef="Anexo Gráfico de Tesis Doctoral"
            >
              <button
                onClick={handleDownloadCroppedPng}
                className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded text-[9.5px] font-bold cursor-pointer transition-colors"
              >
                <Download className="w-3 h-3 text-sky-400" />
                <span>PNG</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Panel Desplegable de Comparación Multi-Punto («Comparar (N)») */}
        {showComparePanel && (
          <div className="bg-slate-900/95 border border-amber-600/70 rounded-lg p-2.5 space-y-2 text-[10px]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <GitCompare className="w-3.5 h-3.5 text-amber-400" />
                Comparativa Multi-Punto Sincronizada ({savedSnapshots.length} instantáneas registradas · Pulsa «Cargar Punto» tras moverte en el mapa para añadir otra calle)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleLoadActivePointSnapshot}
                  className="px-2 py-0.5 bg-indigo-900 hover:bg-indigo-800 text-indigo-100 rounded border border-indigo-500 text-[9px] font-bold cursor-pointer"
                >
                  + Añadir Punto Actual ({activeStreet.slice(0, 22)})
                </button>
                <button
                  type="button"
                  onClick={() => setShowComparePanel(false)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[9px] cursor-pointer"
                >
                  Cerrar Comparador
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[9.5px] font-mono">
                <thead>
                  <tr className="bg-slate-950 text-amber-200 border-b border-slate-800">
                    <th className="p-1.5">Hora</th>
                    <th className="p-1.5">Calle / Punto Sincronizado</th>
                    <th className="p-1.5">Ventana / Recuadro</th>
                    <th className="p-1.5">NO₂ (1,8 m)</th>
                    <th className="p-1.5">ΔNO₂ vs Actual</th>
                    <th className="p-1.5">O₃</th>
                    <th className="p-1.5">PM₂.₅</th>
                    <th className="p-1.5">Meteorología</th>
                    <th className="p-1.5">Directiva UE 2030</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {savedSnapshots.map((snap) => {
                    const diffNo2 = +(activeNo2 - snap.no2).toFixed(1);
                    return (
                      <tr key={snap.id} className="hover:bg-slate-800/60">
                        <td className="p-1.5 text-slate-400">{snap.timestamp}</td>
                        <td className="p-1.5 font-sans font-bold text-slate-200">{snap.streetName}</td>
                        <td className="p-1.5 font-sans text-purple-300">{snap.windowTitle}</td>
                        <td className="p-1.5 font-bold text-amber-300">{snap.no2} µg/m³</td>
                        <td className="p-1.5">
                          <span
                            className={
                              diffNo2 === 0
                                ? 'text-slate-400'
                                : diffNo2 > 0
                                  ? 'text-rose-400 font-bold'
                                  : 'text-emerald-400 font-bold'
                            }
                          >
                            {diffNo2 > 0 ? `+${diffNo2}` : diffNo2} µg/m³
                          </span>
                        </td>
                        <td className="p-1.5 text-sky-300">{snap.o3} µg/m³</td>
                        <td className="p-1.5 text-emerald-300">{snap.pm25} µg/m³</td>
                        <td className="p-1.5 text-slate-300">
                          {snap.tempC}°C · {snap.windSpeedMs} m/s
                        </td>
                        <td className="p-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                              snap.no2 <= 20
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                                : 'bg-rose-950 text-rose-300 border border-rose-700/60'
                            }`}
                          >
                            {snap.no2 <= 20 ? 'CUMPLE (≤20)' : 'SUPERA (>20)'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Contenedor Principal: Izquierda Imagen y Control A Voluntad / Derecha Dictamen Extenso */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Columna Izquierda: Vista del Recuadro + Índice Interactivo de Elementos + Selector Unificado de Enfoque */}
          <div className="md:col-span-5 bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg space-y-2 flex flex-col">
            <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-300 gap-1 flex-wrap">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                Recuadro / Pestaña Enmarcada
              </span>
              <span className="text-[9px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-700/70 px-1.5 py-0.5 rounded truncate max-w-[220px]">
                ✓ {detectedWindowName}
              </span>
            </div>

            <div className="relative rounded border border-slate-700 bg-black/80 flex items-center justify-center overflow-hidden max-h-48 group">
              <img
                src={currentImage}
                alt="Encuadre seleccionado de la pantalla"
                className="object-contain max-h-44 w-auto rounded transition-transform group-hover:scale-102"
              />
              <div className="absolute bottom-1 right-1 bg-black/75 px-1.5 py-0.5 rounded text-[8.5px] text-slate-300 font-mono">
                {detectedItemsCount > 0
                  ? `${detectedItemsCount} elementos extraídos del recuadro`
                  : 'Ctrl+V para pegar otra captura'}
              </div>
            </div>

            {/* Tarjeta de Verificación de Aislamiento Estricto + Índice Interactivo Clicable de Elementos del Recuadro */}
            <div className="bg-slate-950/90 border border-emerald-800/50 rounded-lg p-2 space-y-1.5 text-[9.5px]">
              <div className="flex items-center justify-between font-bold text-emerald-300">
                <span>🎯 Foco Exclusivo en lo Enmarcado:</span>
                <span className="font-mono bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-700/60">
                  {detectedItemsCount} ítems en recuadro
                </span>
              </div>
              <div className="text-slate-300 truncate">
                <strong className="text-slate-400">Bloque / Ventana:</strong>{' '}
                {cleanScientificSymbols(detectedWindowName)}
              </div>
              {detectedActiveTab && (
                <div className="text-purple-300 truncate">
                  <strong className="text-slate-400">Sección activa:</strong>{' '}
                  {cleanScientificSymbols(detectedActiveTab)}
                </div>
              )}

              {/* Verificador Matemático en Vivo si hay ecuación/pesos en el recuadro */}
              {hasAssimilationWeights && (
                <div className="bg-emerald-950/60 border border-emerald-700/60 rounded p-1.5 text-[9px] text-emerald-200 font-mono space-y-0.5">
                  <div className="font-bold text-emerald-300 flex items-center justify-between">
                    <span>✓ Cierre Baricéntrico Verificado:</span>
                    <span>
                      Σwᵢ = {parsedPercentages.slice(0, 3).join('% + ')}% = {sumPercentages.toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-slate-300">
                    Ĉ(NO₂) = {activeNo2} µg/m³ · Ĉ(O₃) = {activeO3} µg/m³ · Ĉ(PM₂.₅) = {activePm25} µg/m³
                  </div>
                </div>
              )}

              {/* Índice Clicable de los Elementos Extraídos del Recuadro */}
              {detectedItems.length > 0 && (
                <div className="pt-1 border-t border-slate-800/80 space-y-1">
                  <div className="text-[8.5px] text-slate-400 flex items-center justify-between">
                    <span>Pulsa cualquier ítem para ir a su explicación:</span>
                    <span className="text-emerald-400 font-mono">100% aislado</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-0.5">
                    {detectedItems.slice(0, 28).map((it, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleJumpToElement(idx + 1)}
                        className={`flex items-center justify-between gap-1 px-1.5 py-1 rounded border text-[9px] cursor-pointer transition-colors ${
                          highlightedElementIdx === idx + 1
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold'
                            : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                        title="Haz clic para desplazarte directamente a la explicación extensa de este elemento en el panel derecho"
                      >
                        <span className="truncate">
                          <strong className="text-purple-300 font-mono">[{idx + 1}]</strong>{' '}
                          {cleanScientificSymbols(it.text)}
                        </span>
                        <span className="text-[8px] font-mono text-emerald-400 shrink-0 bg-emerald-950/80 px-1 rounded">
                          {it.kind.split('/')[0].trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Panel Unificado de Enfoque y Emisión a Voluntad (Sin botones redundantes) */}
            <div className="bg-slate-950/90 border border-purple-800/60 rounded-lg p-2 space-y-2">
              <div className="flex items-center justify-between text-[9.5px]">
                <span className="font-bold text-purple-300 flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-purple-400" />
                  Enfoque Doctoral sobre Este Recuadro:
                </span>
                <label className="flex items-center gap-1 text-[9px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoGenerateOnOpen}
                    onChange={(e) => setAutoGenerateOnOpen(e.target.checked)}
                    className="accent-purple-500 rounded cursor-pointer"
                  />
                  <span>Auto-generar al encuadrar</span>
                </label>
              </div>

              {/* Cuadrícula de las 4 Directrices Rápidas de Tesis (1 clic selecciona y emite al instante) */}
              <div className="grid grid-cols-2 gap-1.5">
                {(['full_explain_all', 'normative_audit', 'tribunal_defense', 'code_ui_diagnostic'] as const).map(
                  (key) => {
                    const item = DOCTORAL_FOCUS_MODES[key];
                    if (!item) return null;
                    const isActive = selectedFocusMode === key;
                    return (
                      <ScientificTooltip
                        key={key}
                        position="top"
                        title={item.title}
                        explanation={item.prompt}
                        normativeRef="UNED — Directriz de Auditoría Doctoral"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFocusMode(key);
                            handleAskGemini(item.prompt, quotaSaverMode, true, key, false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded border text-[9.5px] font-bold transition-all cursor-pointer leading-tight ${
                            isActive
                              ? 'bg-purple-900/90 border-purple-400 text-purple-100 shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-purple-200'
                          }`}
                        >
                          {item.shortLabel}
                        </button>
                      </ScientificTooltip>
                    );
                  }
                )}
              </div>

              {/* Botón Principal de Dictamen a Voluntad */}
              <button
                type="button"
                onClick={() => handleEmitDictamenAtWill(!quotaSaverMode && useInternetOnGenerate)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs py-2.5 px-3 rounded-lg shadow-lg cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] border border-purple-400/40"
              >
                <Sparkles className={`w-4 h-4 text-yellow-300 ${loading ? 'animate-spin' : ''}`} />
                <span>Emitir Dictamen Doctoral Integral (A Voluntad)</span>
              </button>
            </div>
          </div>

          {/* Columna Derecha: Dictamen Doctoral Extenso del Recuadro y Caja de Instrucciones */}
          <div className="md:col-span-7 bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg space-y-2 flex flex-col justify-between">
            {/* Barra de Búsqueda / Filtro Rápido dentro del Dictamen */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 bg-slate-950/90 border border-slate-800 px-2 py-1.5 rounded-lg text-[9.5px]">
              <input
                type="text"
                value={dictamenFilter}
                onChange={(e) => setDictamenFilter(e.target.value)}
                placeholder="🔍 Filtrar dentro del dictamen (ej. Elemento [1], Ĉ, w₁, EOI, CAMS, PINN, Símbolos)..."
                className="flex-1 min-w-[180px] bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none text-[10px]"
              />
              {dictamenFilter && (
                <button
                  type="button"
                  onClick={() => setDictamenFilter('')}
                  className="text-[9px] text-rose-300 hover:text-rose-200 bg-rose-950/70 px-1.5 py-0.5 rounded cursor-pointer"
                >
                  Limpiar filtro
                </button>
              )}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDictamenFilter('Elemento [')}
                  className={`px-1.5 py-0.5 rounded border cursor-pointer text-[8.5px] font-mono ${
                    dictamenFilter === 'Elemento ['
                      ? 'bg-purple-900 border-purple-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  Ítems [1..{detectedItemsCount || 'N'}]
                </button>
                <button
                  type="button"
                  onClick={() => setDictamenFilter('Símbolo')}
                  className={`px-1.5 py-0.5 rounded border cursor-pointer text-[8.5px] font-mono ${
                    dictamenFilter === 'Símbolo'
                      ? 'bg-purple-900 border-purple-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  Símbolos
                </button>
                <button
                  type="button"
                  onClick={() => setDictamenFilter('')}
                  className={`px-1.5 py-0.5 rounded border cursor-pointer text-[8.5px] font-mono ${
                    dictamenFilter === ''
                      ? 'bg-emerald-900/80 border-emerald-500 text-emerald-100'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  Ver Todo
                </button>
              </div>
            </div>

            <div ref={resultsScrollRef} className="space-y-2.5 overflow-y-auto max-h-[430px] pr-1">
              {qaHistory.length === 0 && !loading && (
                <div className="bg-slate-950/60 border border-dashed border-slate-800 p-5 rounded-lg text-center space-y-2.5 my-4">
                  <div className="w-10 h-10 rounded-full bg-purple-950/80 border border-purple-600/60 flex items-center justify-center mx-auto text-purple-300">
                    <Layers className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-200">
                    Recuadro listo para emitir Síntesis Doctoral Exhaustiva a voluntad
                  </p>
                  <p className="text-[10px] text-slate-400 max-w-md mx-auto leading-relaxed">
                    Pulsa en{' '}
                    <strong className="text-purple-300">
                      «Emitir Dictamen Doctoral Integral (A Voluntad)»
                    </strong>{' '}
                    o en <strong className="text-purple-300">«Generar»</strong> (abajo a la derecha) para
                    obtener al instante la explicación extensa, elemento por elemento, de todo lo que hay dentro
                    de tu recuadro o pestaña.
                  </p>
                </div>
              )}

              {loading && (
                <div className="bg-slate-950/90 border border-purple-700/80 p-3 rounded-lg flex items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <RefreshCw className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-bold text-purple-300">
                        Analizando elementos del recuadro con Balanceador Dinámico Multi-Modelo...
                      </div>
                      <div className="text-[9px] text-slate-400">
                        Seleccionando el modelo con mayor cuota libre. Puedes resolver al instante en 0 ms
                        pulsando el botón de la derecha.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAskGemini(undefined, true, true, selectedFocusMode)}
                    className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded text-[9.5px] font-bold cursor-pointer shrink-0 border border-emerald-500"
                  >
                    ⚡ Resolver Ya (0 ms)
                  </button>
                </div>
              )}

              {qaHistory.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-purple-900/60 rounded-lg p-3 space-y-2 text-[11px]"
                >
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5 text-[9.5px] flex-wrap gap-1">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-purple-400" />
                      <span>{item.timestamp}</span>
                      <span className="text-slate-600">|</span>
                      <span className="font-mono text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                        {item.model}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(item.answer, idx)}
                      className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer bg-slate-900 px-2 py-0.5 rounded border border-slate-700 hover:border-purple-500"
                    >
                      {copiedIndex === idx ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>
                        {copiedIndex === idx ? 'Copiado (Símbolos Legibles)' : 'Copiar Dictamen'}
                      </span>
                    </button>
                  </div>

                  <div className="bg-purple-950/30 border border-purple-800/40 p-2 rounded font-medium text-purple-200 text-[10.5px]">
                    <strong className="text-purple-400">Directriz / Enfoque sobre el Recuadro:</strong>{' '}
                    {cleanScientificSymbols(item.question)}
                  </div>

                  <div className="pt-1">
                    <FormattedDoctoralAnalysis
                      text={item.answer}
                      filterQuery={dictamenFilter}
                      highlightedElementIdx={highlightedElementIdx}
                    />
                  </div>

                  {/* Fuentes verificadas de Google Search Grounding cuando se consulta en Internet */}
                  {item.groundingSources && item.groundingSources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800/90 bg-slate-900/70 p-2 rounded-lg space-y-1">
                      <div className="text-[9.5px] font-bold text-sky-300 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-sky-400" />
                        <span>
                          Fuentes Científicas y Oficiales Consultadas en Tiempo Real (Google Search Grounding):
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {item.groundingSources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-950/80 hover:bg-sky-900 text-sky-200 border border-sky-700/60 text-[9px] font-mono transition-colors max-w-[280px] truncate"
                            title={src.uri}
                          >
                            <ExternalLink className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                            <span className="truncate">{src.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {error && (
                <div className="bg-rose-950/80 border border-rose-700 p-3 rounded-lg flex items-start gap-2.5 text-[10.5px] text-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">Aviso del sistema:</div>
                    <div className="text-[10px] text-rose-300">{error}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Barra Inferior para Consultas a Voluntad + Botón «Generar» Conectado a Internet + 4 Pestañas Rápidas */}
            <div className="pt-2 pb-1 pr-2 border-t border-slate-800 space-y-2 relative z-40">
              <div className="flex gap-1.5 items-center flex-wrap sm:flex-nowrap">
                <input
                  type="text"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleEmitDictamenAtWill(useInternetOnGenerate);
                    }
                  }}
                  placeholder="Pregunta algo específico sobre este recuadro (fórmulas, anomalías, código, tesis) o pulsa «Generar»..."
                  className="flex-1 min-w-[200px] bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                />

                <ScientificTooltip
                  position="top"
                  title="Conexión a Internet en Tiempo Real (Google Search Grounding)"
                  formula="\text{Gemini Multimodal} \oplus \texttt{tools: [\{ googleSearch: \{\} \}]}"
                  explanation="Cuando está activo (ON), el botón «Generar» conecta en tiempo real con Google Search Grounding para contrastar tu consulta y los datos del recuadro con fuentes científicas, normativas (DOUE Directiva 2024/2881, OMS, AEMET, Copernicus) y artículos Q1 en Internet, adjuntando los enlaces verificados."
                  normativeRef="Google Search Grounding API (@google/genai)"
                >
                  <button
                    type="button"
                    onClick={() => setUseInternetOnGenerate((v) => !v)}
                    className={`flex items-center gap-1 px-2.5 py-2 rounded-lg font-bold text-[10px] cursor-pointer transition-all border shrink-0 ${
                      useInternetOnGenerate
                        ? 'bg-sky-950/90 hover:bg-sky-900 text-sky-200 border-sky-500 shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <Globe className={`w-3.5 h-3.5 ${useInternetOnGenerate ? 'text-sky-400' : 'text-slate-500'}`} />
                    <span>{useInternetOnGenerate ? '🌐 Internet: ON' : 'Internet: OFF'}</span>
                  </button>
                </ScientificTooltip>

                <ScientificTooltip
                  position="top"
                  title="Generar Dictamen Doctoral de Alta Precisión (Con Búsqueda en Internet)"
                  formula="\text{Consulta} + \Omega_{\text{crop}} + \text{Google Search} \longrightarrow \text{Dictamen Doctoral}"
                  explanation="Ejecuta inmediatamente la consulta sobre el recuadro seleccionado. Si el cuadro de texto está vacío, analiza en profundidad el enfoque activo conectándose a Internet (si 🌐 Internet: ON está activo) para máxima precisión científica."
                  normativeRef="UNED — Auditoría Científica Conectada en Tiempo Real"
                >
                  <button
                    type="button"
                    onClick={() => handleEmitDictamenAtWill(useInternetOnGenerate)}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white rounded-lg font-bold text-xs cursor-pointer transition-all disabled:opacity-50 shadow-md border border-purple-400/40 shrink-0"
                  >
                    <Send className={`w-3.5 h-3.5 ${loading ? 'animate-pulse' : ''}`} />
                    <span>Generar</span>
                  </button>
                </ScientificTooltip>
              </div>

              {/* Fila Inferior: Estado de Conexión Dinámico + Las 4 Pestañas de Acción Rápida de la Foto */}
              <div className="flex justify-between items-center text-[9px] text-slate-400 px-1 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>
                    Conectado al contexto en tiempo real del Gemelo Digital ({SYSTEM_PROPAGATION.stationsCount}{' '}
                    estaciones + {SYSTEM_PROPAGATION.satellitesCount} satélites).
                  </span>
                  {lastGeneratedBadge && (
                    <span className="font-mono font-bold text-emerald-300 bg-emerald-950/90 border border-emerald-700/70 px-1.5 py-0.5 rounded">
                      {lastGeneratedBadge}
                    </span>
                  )}
                </div>

                {/* Las 4 Pestañas Rápidas Inferiores de la Captura: ∑ Ecuación | ⚖ Normativa | <> Código | ❝ Citar */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <ScientificTooltip
                    position="top"
                    title="Pestaña de Desglose Algebraico y Dimensional (∑ Ecuación)"
                    formula="\text{Análisis Dimensional SI: } [\text{M}\,\text{L}^{-3}], [\text{L}\,\text{T}^{-1}]"
                    explanation="Desglosa término a término todas las ecuaciones matemáticas capturadas dentro del recuadro, sustituyendo los valores numéricos actuales y verificando sus unidades en el Sistema Internacional."
                    normativeRef="UNED — Rigor Matemático y Dimensional SI"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFocusMode('equations_and_symbols');
                        handleAskGemini(
                          DOCTORAL_FOCUS_MODES.equations_and_symbols.prompt,
                          quotaSaverMode,
                          true,
                          'equations_and_symbols',
                          !quotaSaverMode && useInternetOnGenerate
                        );
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded border text-[9.5px] font-bold cursor-pointer transition-colors ${
                        selectedFocusMode === 'equations_and_symbols'
                          ? 'bg-purple-900/90 text-purple-100 border-purple-400'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      <Calculator className="w-3 h-3 text-purple-400" />
                      <span>Ecuación</span>
                    </button>
                  </ScientificTooltip>

                  <ScientificTooltip
                    position="top"
                    title="Pestaña de Conformidad Regulatoria Europea y Sanitaria (⚖ Normativa)"
                    formula="\text{NO}_2 \le 20\,\mu\text{g/m}^3 \text{ (UE 2030)} \;\wedge\; \text{PM}_{2.5} \le 10\,\mu\text{g/m}^3"
                    explanation="Contrasta las concentraciones del recuadro y de la calle activa frente a los valores límite de la Directiva (UE) 2024/2881 (horizonte 2030), el RD 39/2017 y las Guías de la OMS 2021."
                    normativeRef="Directiva (UE) 2024/2881 · Guías OMS 2021 · FAIRMODE WG1"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFocusMode('normative_audit');
                        handleAskGemini(
                          DOCTORAL_FOCUS_MODES.normative_audit.prompt,
                          quotaSaverMode,
                          true,
                          'normative_audit',
                          !quotaSaverMode && useInternetOnGenerate
                        );
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded border text-[9.5px] font-bold cursor-pointer transition-colors ${
                        selectedFocusMode === 'normative_audit'
                          ? 'bg-purple-900/90 text-purple-100 border-purple-400'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      <Scale className="w-3 h-3 text-amber-400" />
                      <span>Normativa</span>
                    </button>
                  </ScientificTooltip>

                  <ScientificTooltip
                    position="top"
                    title="Pestaña de Auditoría de Arquitectura TypeScript/React (<> Código)"
                    formula="\text{Determinismo Puro: } \texttt{Math.random()} \equiv 0 \;\wedge\; \mathcal{O}(1)"
                    explanation="Audita los motores físico-químicos en src/lib/, el flujo reactivo de ActivePointContext y la estructura DOM/Canvas de los elementos capturados en el recuadro."
                    normativeRef="Reglas 1, 2 y 13 (Cero Aleatoriedad y Propagación en Cadena)"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFocusMode('code_ui_diagnostic');
                        handleAskGemini(
                          DOCTORAL_FOCUS_MODES.code_ui_diagnostic.prompt,
                          quotaSaverMode,
                          true,
                          'code_ui_diagnostic',
                          !quotaSaverMode && useInternetOnGenerate
                        );
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded border text-[9.5px] font-bold cursor-pointer transition-colors ${
                        selectedFocusMode === 'code_ui_diagnostic'
                          ? 'bg-purple-900/90 text-purple-100 border-purple-400'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      <Code2 className="w-3 h-3 text-emerald-400" />
                      <span>Código</span>
                    </button>
                  </ScientificTooltip>

                  <ScientificTooltip
                    position="top"
                    title="Pestaña de Citación Académica APA 7 / IEEE / LaTeX (❝ Citar)"
                    formula="\text{APA 7.ª ed.} \oplus \text{IEEE Q1} \oplus \texttt{\textbackslash begin\{figure\}}"
                    explanation="Genera al instante la referencia bibliográfica formal en formatos APA 7.ª edición, IEEE y LaTeX para citar este recuadro analítico en la Memoria de Tesis Doctoral de la UNED."
                    normativeRef="EIDUNED — Normas de Citación Doctoral"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFocusMode('academic_citation');
                        handleAskGemini(
                          DOCTORAL_FOCUS_MODES.academic_citation.prompt,
                          quotaSaverMode,
                          true,
                          'academic_citation',
                          !quotaSaverMode && useInternetOnGenerate
                        );
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded border text-[9.5px] font-bold cursor-pointer transition-colors ${
                        selectedFocusMode === 'academic_citation'
                          ? 'bg-purple-900/90 text-purple-100 border-purple-400'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      <Quote className="w-3 h-3 text-sky-400" />
                      <span>Citar</span>
                    </button>
                  </ScientificTooltip>

                  <ScientificTooltip
                    position="top"
                    title="Pestaña e Impresión Extensa PDF: Directrices del Director de Tesis (5 Bloques + 7 Anexos / 12 Tablas)"
                    formula="\text{5 Bloques} + \text{7 Anexos (12 Tablas)} \;\propto\; \mathbf{x}_{\text{activo}}"
                    explanation={`Descarga directamente el PDF extenso multipágina A4 de las Directrices del Director de Tesis (Auditoría 24+16, Matriz de 32 variables, MVP de 12 variables, PINN Auto-Diff H¹/NTK y ZBE Causal PI-DiD/RDD), 100% variable con el punto seleccionado en el mapa (${activeStreet}).`}
                    normativeRef="Programa de Doctorado UNED — Directrices del Director de Tesis"
                  >
                    <button
                      type="button"
                      onClick={handleDownloadDirectorGuidelinesPdf}
                      className="flex items-center gap-1 px-2.5 py-1 rounded border text-[9.5px] font-extrabold cursor-pointer transition-all bg-gradient-to-r from-rose-700 to-amber-700 hover:from-rose-600 hover:to-amber-600 text-white border-amber-400 shadow-xs"
                    >
                      <Download className="w-3 h-3 text-amber-200" />
                      <span>📕 Directrices Director (.PDF)</span>
                    </button>
                  </ScientificTooltip>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN PARA IMPRESIÓN FORMAL (window.print()) */}
        <div
          ref={printContainerRef}
          className="hidden print:block print:p-6 print:text-black print:bg-white"
        >
          <div className="border-b-2 border-black pb-3 mb-4">
            <h1 className="text-xl font-bold uppercase">
              UNED (Universidad Nacional de Educación a Distancia) — Programa de Doctorado
            </h1>
            <h2 className="text-sm font-semibold text-gray-700">
              Gemelo Digital de Calidad del Aire a Microescala: Síntesis Doctoral Exhaustiva de Recuadro /
              Pestaña
            </h2>
            <div className="text-xs text-gray-600 mt-1">
              Ventana / Pestaña Enmarcada: {detectedWindowName}{' '}
              {detectedActiveTab ? `(${detectedActiveTab})` : ''}
            </div>
            <div className="text-xs text-gray-600">
              Fecha: {new Date().toLocaleString('es-ES')} | Ubicación: {activeStreet} (
              {activeLat.toFixed(4)}, {activeLon.toFixed(4)})
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase mb-1">
              Imagen del Recuadro / Pestaña Analizada:
            </h3>
            <img
              src={currentImage}
              alt="Encuadre impreso"
              className="max-h-60 border border-gray-400 mb-2"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase border-b border-gray-300 pb-1">
              Dictámenes Doctorales Emitidos sobre el Recuadro:
            </h3>
            {qaHistory.map((item, idx) => (
              <div key={idx} className="space-y-1 page-break-inside-avoid">
                <div className="text-xs font-bold text-gray-900 bg-gray-100 p-1.5 border border-gray-300">
                  Dictamen {idx + 1}: {item.question}
                </div>
                <div className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed p-1">
                  {cleanScientificSymbols(item.answer)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-gray-400 pt-2 text-[10px] text-gray-500 flex justify-between">
            <span>
              Certificación de Asimilación Observacional: {SYSTEM_PROPAGATION.stationsCount} Estaciones Terrestres + {SYSTEM_PROPAGATION.satellitesCount} Misiones Satelitales
            </span>
            <span>Documento emitido para Anexo de Tesis Doctoral (UNED)</span>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
}

export default GeminiScreenAnalysisModal;
