import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Sparkles,
  Maximize2,
  MapPin,
  AlertCircle,
  Layers,
  Upload,
  RefreshCw,
  Eye
} from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';

interface Props {
  isActive: boolean;
  onCropComplete: (base64Image: string) => void;
  onCancel: () => void;
}

interface CropBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface DetectedWindow {
  el: HTMLElement;
  title: string;
  rect: DOMRect;
  kind?: 'window' | 'tab';
}

import { cleanScientificSymbols, type FramedElementDetail } from '../lib/doctoralCropEngine';
export type { FramedElementDetail };

export interface GeminiCropCapturedContext {
  windowTitles: string[];
  activeTabs: string[];
  headings: string[];
  structuredItems: FramedElementDetail[];
  visibleText: string;
  cropDimensions: { left: number; top: number; width: number; height: number };
  coveredByWindow: boolean;
}

declare global {
  interface Window {
    __LAST_GEMINI_CROP_CONTEXT__?: GeminiCropCapturedContext;
  }
}

/**
 * Comprueba si un color CSS es efectivamente transparente
 */
function isTransparentColor(color: string | null | undefined): boolean {
  if (!color) return true;
  const c = color.trim().toLowerCase();
  if (c === 'transparent' || c === 'none' || c === ' rgba(0, 0, 0, 0)' || c === 'rgba(0, 0, 0, 0)') {
    return true;
  }
  // Comprobar oklch/rgba/rgb con alpha 0 al final: ej. oklch(0 0 0 / 0) o rgba(0,0,0,0)
  if (/\/\s*0(\.0+)?\s*\)$/.test(c)) return true;
  if (/^rgba\([^,]+,[^,]+,[^,]+,\s*0(\.0+)?\s*\)$/.test(c)) return true;
  return false;
}

/**
 * Extrae colores válidos (oklch, oklab, rgb, rgba, hsl, hex) desde un linear-gradient CSS
 */
function extractGradientColors(bgImage: string): string[] {
  if (!bgImage || !bgImage.includes('gradient')) return [];
  const matches = bgImage.match(
    /(?:oklch|oklab|rgba?|hsla?|color)\([^)]+\)|#[0-9a-fA-F]{3,8}/g
  );
  return matches ? matches.filter((m) => !isTransparentColor(m)) : [];
}

/**
 * Dibuja un rectángulo con bordes redondeados en el contexto 2D
 */
function traceRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function' && radius > 0) {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    ctx.rect(x, y, w, h);
  }
}

/**
 * Resuelve el color efectivo de un elemento SVG (soportando currentColor y herencia)
 */
function resolveSvgPaint(
  rawAttr: string | null,
  computedProp: string,
  computedColor: string
): string | null {
  const val = (computedProp || rawAttr || '').trim();
  if (!val || val === 'none' || isTransparentColor(val)) return null;
  if (val === 'currentColor' || val === 'inherit') return computedColor || '#e2e8f0';
  return val;
}

/**
 * Rasteriza de forma síncrona un elemento <svg> completo (iconos Lucide, gráficas Recharts, diagramas)
 * directamente en el Canvas 2D utilizando getScreenCTM() y Path2D nativo (0ms de espera asíncrona, 0 CORS taint).
 */
function paintSvgElementToCanvas(
  ctx: CanvasRenderingContext2D,
  svgRoot: SVGSVGElement,
  cropRect: { left: number; top: number; right: number; bottom: number }
) {
  const svgBounds = svgRoot.getBoundingClientRect();
  if (
    svgBounds.width <= 0 ||
    svgBounds.height <= 0 ||
    svgBounds.right < cropRect.left ||
    svgBounds.left > cropRect.right ||
    svgBounds.bottom < cropRect.top ||
    svgBounds.top > cropRect.bottom
  ) {
    return;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(svgBounds.left, svgBounds.top, svgBounds.width, svgBounds.height);
  ctx.clip();

  const shapes = svgRoot.querySelectorAll(
    'path, rect, circle, ellipse, line, polyline, polygon, text'
  );

  shapes.forEach((node) => {
    const el = node as SVGGraphicsElement;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return;
    }

    const ctm = typeof el.getScreenCTM === 'function' ? el.getScreenCTM() : null;
    if (!ctm) return;

    const tag = el.tagName.toLowerCase();
    const computedColor = style.color || '#e2e8f0';
    const fillPaint = resolveSvgPaint(el.getAttribute('fill'), style.fill, computedColor);
    const strokePaint = resolveSvgPaint(el.getAttribute('stroke'), style.stroke, computedColor);
    const strokeWidthRaw = parseFloat(style.strokeWidth || el.getAttribute('stroke-width') || '1.5') || 1.5;
    // Factor de escala medio de la matriz CTM para ajustar el grosor del trazo a píxeles de pantalla
    const matrixScale = Math.hypot(ctm.a, ctm.b) || 1;
    const screenStrokeWidth = Math.max(0.75, strokeWidthRaw * matrixScale);

    ctx.save();
    const opacity = parseFloat(style.opacity || '1');
    if (opacity < 1) ctx.globalAlpha *= opacity;

    if (tag === 'text') {
      const txt = (el.textContent || '').trim();
      if (txt) {
        const bbox = el.getBoundingClientRect();
        ctx.font = `${style.fontStyle || 'normal'} ${style.fontWeight || '500'} ${style.fontSize || '10px'} ${style.fontFamily || 'sans-serif'}`;
        ctx.fillStyle = fillPaint || computedColor;
        ctx.textBaseline = 'middle';
        ctx.fillText(txt, bbox.left, bbox.top + bbox.height / 2);
      }
      ctx.restore();
      return;
    }

    let localPath: Path2D | null = null;

    try {
      if (tag === 'path') {
        const d = el.getAttribute('d');
        if (d) localPath = new Path2D(d);
      } else if (tag === 'rect') {
        const x = parseFloat(el.getAttribute('x') || '0');
        const y = parseFloat(el.getAttribute('y') || '0');
        const w = parseFloat(el.getAttribute('width') || '0');
        const h = parseFloat(el.getAttribute('height') || '0');
        const rx = parseFloat(el.getAttribute('rx') || '0');
        if (w > 0 && h > 0) {
          localPath = new Path2D();
          if (rx > 0 && typeof localPath.roundRect === 'function') {
            localPath.roundRect(x, y, w, h, rx);
          } else {
            localPath.rect(x, y, w, h);
          }
        }
      } else if (tag === 'circle') {
        const cx = parseFloat(el.getAttribute('cx') || '0');
        const cy = parseFloat(el.getAttribute('cy') || '0');
        const r = parseFloat(el.getAttribute('r') || '0');
        if (r > 0) {
          localPath = new Path2D();
          localPath.arc(cx, cy, r, 0, Math.PI * 2);
        }
      } else if (tag === 'ellipse') {
        const cx = parseFloat(el.getAttribute('cx') || '0');
        const cy = parseFloat(el.getAttribute('cy') || '0');
        const rx = parseFloat(el.getAttribute('rx') || '0');
        const ry = parseFloat(el.getAttribute('ry') || '0');
        if (rx > 0 && ry > 0) {
          localPath = new Path2D();
          localPath.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        }
      } else if (tag === 'line') {
        const x1 = parseFloat(el.getAttribute('x1') || '0');
        const y1 = parseFloat(el.getAttribute('y1') || '0');
        const x2 = parseFloat(el.getAttribute('x2') || '0');
        const y2 = parseFloat(el.getAttribute('y2') || '0');
        localPath = new Path2D();
        localPath.moveTo(x1, y1);
        localPath.lineTo(x2, y2);
      } else if (tag === 'polyline' || tag === 'polygon') {
        const pts = (el.getAttribute('points') || '')
          .trim()
          .split(/[\s,]+/)
          .map(Number);
        if (pts.length >= 4) {
          localPath = new Path2D();
          localPath.moveTo(pts[0], pts[1]);
          for (let i = 2; i < pts.length - 1; i += 2) {
            localPath.lineTo(pts[i], pts[i + 1]);
          }
          if (tag === 'polygon') localPath.closePath();
        }
      }

      if (localPath) {
        const screenPath = new Path2D();
        screenPath.addPath(localPath, ctm);

        if (fillPaint && tag !== 'line') {
          ctx.fillStyle = fillPaint;
          ctx.fill(screenPath);
        }
        if (strokePaint) {
          ctx.strokeStyle = strokePaint;
          ctx.lineWidth = screenStrokeWidth;
          ctx.lineCap = (style.strokeLinecap as CanvasLineCap) || 'round';
          ctx.lineJoin = (style.strokeLinejoin as CanvasLineJoin) || 'round';
          ctx.stroke(screenPath);
        }
      }
    } catch {
      // Ignorar geometría SVG degenerada
    }

    ctx.restore();
  });

  ctx.restore();
}

export function ScreenCropOverlay({ isActive, onCropComplete, onCancel }: Props) {
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [cropBox, setCropBox] = useState<CropBox | null>(null);
  const [hasSelected, setHasSelected] = useState<boolean>(false);
  const [capturing, setCapturing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openWindows, setOpenWindows] = useState<DetectedWindow[]>([]);

  const overlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rafMoveRef = useRef<number | null>(null);

  // Escanear dinámicamente todas las ventanas, pestañas y paneles flotantes abiertos
  const scanOpenWindows = useCallback(() => {
    try {
      const candidates = Array.from(
        document.querySelectorAll(
          '[data-draggable-window="true"], .draggable-window-content, .draggable-window-panel, [role="dialog"], .scientific-modal, #point-inspector-modal, [data-collapsible-panel="true"], [data-sync-banner="true"]'
        )
      ) as HTMLElement[];

      const validList: DetectedWindow[] = [];

      candidates.forEach((el) => {
        const panelEl = (el.classList.contains('draggable-window-content')
          ? el
          : el.querySelector('.draggable-window-content') || el) as HTMLElement;

        const rect = panelEl.getBoundingClientRect();
        if (rect.width > 120 && rect.height > 48) {
          const style = window.getComputedStyle(panelEl);
          if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
            const rawTitle =
              panelEl.getAttribute('data-window-title') ||
              panelEl.getAttribute('data-panel-title') ||
              panelEl.querySelector('h1, h2, h3, h4, .font-mono.font-bold, .font-bold')?.textContent?.trim() ||
              'Panel / Ventana Activa';

            const cleanTitle = rawTitle.replace(/\s+/g, ' ').slice(0, 38);

            if (
              !validList.some(
                (w) =>
                  w.el === panelEl ||
                  (Math.abs(w.rect.left - rect.left) < 8 && Math.abs(w.rect.top - rect.top) < 8)
              )
            ) {
              validList.push({
                el: panelEl,
                title: cleanTitle,
                rect
              });
            }
          }
        }
      });

      setOpenWindows(validList);
    } catch (e) {
      console.warn('[ScreenCrop] Error al escanear ventanas abiertas:', e);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      scanOpenWindows();
    } else {
      setCropBox(null);
      setHasSelected(false);
      setCapturing(false);
      setErrorMessage(null);
    }
  }, [isActive, scanOpenWindows]);

  /**
   * MOTOR NATIVO SÍNCRONO DE COMPOSICIÓN 2D (<15ms, CERO html2canvas, 100% COMPATIBLE CON TAILWIND v4 OKLCH):
   * 1. Detecta si el encuadre intersecta ventanas/pestañas abiertas y las pinta con base opaca sólida (#020617)
   *    para que el mapa de fondo JAMÁS reemplace ni transparente el contenido de la ventana encuadrada.
   * 2. Rasteriza directamente sobre CanvasRenderingContext2D cada contenedor, tarjeta, pestaña, fórmula,
   *    borde, gradiente, icono vectorial SVG (Path2D + getScreenCTM) y nodo de texto en su posición exacta.
   * 3. Extrae simultáneamente el texto técnico y las ecuaciones visibles dentro del recuadro para Gemini.
   */
  const executeCompositeCrop = useCallback(
    (box: CropBox) => {
      const left = Math.round(Math.max(0, Math.min(box.startX, box.endX)));
      const top = Math.round(Math.max(0, Math.min(box.startY, box.endY)));
      const width = Math.round(Math.min(window.innerWidth - left, Math.abs(box.endX - box.startX)));
      const height = Math.round(Math.min(window.innerHeight - top, Math.abs(box.endY - box.startY)));

      if (width < 25 || height < 25) {
        setCropBox(null);
        setHasSelected(false);
        return;
      }

      setCapturing(true);
      setErrorMessage(null);

      const overlayEl = overlayRef.current;
      if (overlayEl) {
        overlayEl.style.display = 'none';
      }

      try {
        const cropRect = {
          left,
          top,
          right: left + width,
          bottom: top + height,
          width,
          height
        };

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = Math.round(width * dpr);
        outputCanvas.height = Math.round(height * dpr);
        const ctx = outputCanvas.getContext('2d');

        if (!ctx) {
          throw new Error('No se pudo inicializar el contexto 2D del canvas');
        }

        // Transformar sistema de coordenadas del canvas para trabajar directamente en coordenadas de viewport (clientX, clientY)
        ctx.scale(dpr, dpr);
        ctx.translate(-left, -top);

        // Fondo base oscuro
        ctx.fillStyle = '#020617';
        ctx.fillRect(left, top, width, height);

        // Detectar mediante muestreo real de píxeles (elementFromPoint) qué contenedor/ventana es el propietario visible superior del recuadro
        const samplePoints: Array<[number, number]> = [
          [cropRect.left + width * 0.5, cropRect.top + height * 0.5],
          [cropRect.left + width * 0.25, cropRect.top + height * 0.25],
          [cropRect.left + width * 0.75, cropRect.top + height * 0.25],
          [cropRect.left + width * 0.25, cropRect.top + height * 0.75],
          [cropRect.left + width * 0.75, cropRect.top + height * 0.75],
          [cropRect.left + width * 0.5, cropRect.top + height * 0.2],
          [cropRect.left + width * 0.5, cropRect.top + height * 0.8]
        ];

        const hitElements: Element[] = [];
        for (const [px, py] of samplePoints) {
          const clampedX = Math.max(1, Math.min(window.innerWidth - 2, Math.round(px)));
          const clampedY = Math.max(1, Math.min(window.innerHeight - 2, Math.round(py)));
          const hit = document.elementFromPoint(clampedX, clampedY);
          if (hit && hit.id !== 'screen-crop-overlay-root' && !hit.closest('#screen-crop-overlay-root')) {
            hitElements.push(hit);
          }
        }

        // Comprueba si un elemento está realmente visible en su centro y no tapado por otra ventana/panel superior
        const isElementVisibleAtCenter = (el: Element, r: DOMRect): boolean => {
          const cx = Math.max(
            cropRect.left + 2,
            Math.min(cropRect.right - 2, Math.round(r.left + r.width / 2))
          );
          const cy = Math.max(
            cropRect.top + 2,
            Math.min(cropRect.bottom - 2, Math.round(r.top + r.height / 2))
          );
          if (cx < 0 || cy < 0 || cx >= window.innerWidth || cy >= window.innerHeight) return false;
          const topHit = document.elementFromPoint(cx, cy);
          if (!topHit) return true;
          if (el === topHit || el.contains(topHit) || topHit.contains(el)) return true;
          // Permitir si comparten la misma tarjeta o fila inmediata
          const sharedRow = el.closest('tr, li, button, .rounded-lg, .rounded-xl');
          if (sharedRow && sharedRow.contains(topHit)) return true;
          return false;
        };

        // Detectar todas las ventanas/paneles abiertos que intersectan el recuadro elegido y son realmente visibles en el frente
        const windowElements = Array.from(
          document.querySelectorAll(
            '.draggable-window-content, [data-draggable-window="true"], [role="dialog"], .scientific-modal, #point-inspector-modal, aside'
          )
        ) as HTMLElement[];

        const uniqueIntersectingWindows: { el: HTMLElement; rect: DOMRect; title: string }[] = [];
        let isCropFullyInsideOpaqueWindow = false;

        for (const wEl of windowElements) {
          const panel = (wEl.classList.contains('draggable-window-content')
            ? wEl
            : wEl.querySelector('.draggable-window-content') || wEl) as HTMLElement;
          const style = window.getComputedStyle(panel);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            continue;
          }
          const r = panel.getBoundingClientRect();
          if (r.width < 40 || r.height < 35) continue;

          const intersects = !(
            r.right <= cropRect.left ||
            r.left >= cropRect.right ||
            r.bottom <= cropRect.top ||
            r.top >= cropRect.bottom
          );

          // Exigir que al menos uno de los puntos muestreados dentro del recuadro pertenezca a este panel
          const ownsSampledPixels =
            hitElements.length === 0 || hitElements.some((h) => panel.contains(h));

          if (intersects && ownsSampledPixels && !uniqueIntersectingWindows.some((u) => u.el === panel)) {
            const headerTitleEl =
              panel.querySelector('.cursor-grab .font-mono.font-bold.uppercase') ||
              panel.querySelector('h1, h2, h3') ||
              panel.querySelector('.font-mono.font-bold');

            const rawTitleText =
              panel.getAttribute('data-window-title') ||
              headerTitleEl?.textContent?.trim() ||
              '';

            const cleanPanelTitle = rawTitleText
              .replace(/\s+/g, ' ')
              .replace(/ARRASTRAR|FIJAR|FIJADO/gi, '')
              .trim()
              .slice(0, 85);

            uniqueIntersectingWindows.push({
              el: panel,
              rect: r,
              title: cleanPanelTitle || 'Panel Analítico Seleccionado'
            });

            // Comprobar si el recuadro recortado a voluntad está íntegramente dentro de esta ventana
            if (
              cropRect.left >= r.left - 6 &&
              cropRect.right <= r.right + 6 &&
              cropRect.top >= r.top - 6 &&
              cropRect.bottom <= r.bottom + 6
            ) {
              isCropFullyInsideOpaqueWindow = true;
            }
          }
        }

        // --- PASO 1: DIBUJAR EL MAPA BASE SÓLO SI EL RECUADRO NO ESTÁ 100% CUBIERTO POR UNA VENTANA OPACA ---
        if (!isCropFullyInsideOpaqueWindow) {
          const mapCanvases = Array.from(
            document.querySelectorAll('.maplibregl-canvas, .mapboxgl-canvas, #deckgl-overlay')
          ) as HTMLCanvasElement[];

          for (const mc of mapCanvases) {
            if (mc instanceof HTMLCanvasElement && mc.width > 0 && mc.height > 0) {
              try {
                const mr = mc.getBoundingClientRect();
                if (mr.width > 0 && mr.height > 0) {
                  ctx.drawImage(mc, mr.left, mr.top, mr.width, mr.height);
                }
              } catch {
                // Ignorar si algún canvas auxiliar está protegido
              }
            }
          }
        }

        // --- PASO 2: RASTERIZADO NATIVO SÍNCRONO DEL ÁRBOL DOM VISIBLE EN ORDEN DE APILAMIENTO (Z-INDEX) ---
        const capturedTextSnippets: string[] = [];
        const rangeHelper = document.createRange();

        const formatReadableFormulaOnCanvas = (txt: string): string =>
          txt
            .replace(/\\hat\{([^}]*)\}/g, '$1̂')
            .replace(/\\bar\{([^}]*)\}/g, '$1̄')
            .replace(/_\{([^}]*)\}/g, '_$1')
            .replace(/\bw_1\b/g, 'w₁')
            .replace(/\bw_2\b/g, 'w₂')
            .replace(/\bw_3\b/g, 'w₃');

        const paintDomNode = (node: Element) => {
          if (!(node instanceof HTMLElement || node instanceof SVGElement)) return;
          if (node.id === 'screen-crop-overlay-root') return;
          if (node.classList.contains('screen-crop-ignore')) return;
          if (node.classList.contains('maplibregl-canvas-container')) return;
          // Ignorar el árbol MathML oculto de KaTeX para no duplicar texto superpuesto en el canvas ni fragmentar ecuaciones
          if (node.classList.contains('katex-mathml')) return;

          const style = window.getComputedStyle(node);
          if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            parseFloat(style.opacity || '1') <= 0.01
          ) {
            return;
          }

          // Si es un elemento <svg>, rasterizar su geometría vectorial de inmediato
          if (node instanceof SVGSVGElement) {
            paintSvgElementToCanvas(ctx, node, cropRect);
            return;
          }

          const rect = node.getBoundingClientRect();
          const intersectsCrop = !(
            rect.right <= cropRect.left ||
            rect.left >= cropRect.right ||
            rect.bottom <= cropRect.top ||
            rect.top >= cropRect.bottom
          );

          // Si es una fórmula matemática KaTeX (.math-formula-rendered), pintarla limpia y sin solapamientos en su caja
          if (node.classList.contains('math-formula-rendered') && node.hasAttribute('data-math-raw')) {
            if (intersectsCrop && rect.width > 2 && rect.height > 2) {
              const rawMath = node.getAttribute('data-math-raw') || '';
              const cleanEq = cleanScientificSymbols(rawMath);
              if (cleanEq) {
                ctx.save();
                ctx.font = `600 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
                ctx.fillStyle = style.color || '#67e8f9';
                ctx.textBaseline = 'middle';
                const maxW = Math.max(60, rect.width - 8);
                const words = cleanEq.split(' ');
                const linesToDraw: string[] = [];
                let cur = '';
                for (const w of words) {
                  const test = cur ? `${cur} ${w}` : w;
                  if (ctx.measureText(test).width > maxW && cur) {
                    linesToDraw.push(cur);
                    cur = w;
                  } else {
                    cur = test;
                  }
                }
                if (cur) linesToDraw.push(cur);
                const lineH = 15;
                const totalH = linesToDraw.length * lineH;
                const startY = rect.top + (rect.height - totalH) / 2 + lineH / 2;
                for (let li = 0; li < linesToDraw.length; li++) {
                  const lw = ctx.measureText(linesToDraw[li]).width;
                  const drawX = rect.left + Math.max(4, (rect.width - lw) / 2);
                  ctx.fillText(linesToDraw[li], drawX, startY + li * lineH);
                }
                ctx.restore();
              }
            }
            return;
          }

          const clipsOverflow =
            style.overflowX === 'hidden' ||
            style.overflowX === 'auto' ||
            style.overflowX === 'scroll' ||
            style.overflowX === 'clip' ||
            style.overflowY === 'hidden' ||
            style.overflowY === 'auto' ||
            style.overflowY === 'scroll' ||
            style.overflowY === 'clip';

          // Poda O(1): Si el contenedor recorta su contenido (overflow) o es una ventana flotante y no intersecta el recuadro, saltar todo su subárbol
          if (!intersectsCrop) {
            if (
              clipsOverflow ||
              node.hasAttribute('data-draggable-window') ||
              node.classList.contains('draggable-window-container') ||
              node.classList.contains('draggable-window-content')
            ) {
              return;
            }
          }

          const radius = parseFloat(style.borderTopLeftRadius || '0') || 0;

          // Pintar fondo, gradientes y bordes del elemento si tiene dimensiones visibles e intersecta el encuadre
          if (intersectsCrop && rect.width > 0.5 && rect.height > 0.5) {
            const isWindowSurface =
              node.hasAttribute('data-draggable-window') ||
              node.classList.contains('draggable-window-content') ||
              node.getAttribute('role') === 'dialog' ||
              node.id === 'point-inspector-modal' ||
              (style.backdropFilter && style.backdropFilter !== 'none');

            const bgColor = style.backgroundColor;
            const bgImage = style.backgroundImage;
            const hasSolidBg = !isTransparentColor(bgColor);
            const gradientColors = extractGradientColors(bgImage);

            // Si es la superficie de una ventana/pestaña abierta o tiene backdrop-blur, sellar primero con fondo sólido #020617 para ocultar 100% el mapa inferior
            if (isWindowSurface && (hasSolidBg || gradientColors.length > 0)) {
              ctx.save();
              traceRoundedRect(ctx, rect.left, rect.top, rect.width, rect.height, radius);
              ctx.fillStyle = '#020617';
              ctx.fill();
              ctx.restore();
            }

            if (gradientColors.length >= 2) {
              ctx.save();
              traceRoundedRect(ctx, rect.left, rect.top, rect.width, rect.height, radius);
              const grad = ctx.createLinearGradient(rect.left, rect.top, rect.right, rect.bottom);
              gradientColors.forEach((c, idx) => {
                grad.addColorStop(idx / (gradientColors.length - 1), c);
              });
              ctx.fillStyle = grad;
              ctx.fill();
              ctx.restore();
            } else if (hasSolidBg) {
              ctx.save();
              traceRoundedRect(ctx, rect.left, rect.top, rect.width, rect.height, radius);
              ctx.fillStyle = bgColor;
              ctx.fill();
              ctx.restore();
            }

            // Bordes del elemento (completos o individuales como border-b / border-l)
            const bt = parseFloat(style.borderTopWidth || '0') || 0;
            const br = parseFloat(style.borderRightWidth || '0') || 0;
            const bb = parseFloat(style.borderBottomWidth || '0') || 0;
            const bl = parseFloat(style.borderLeftWidth || '0') || 0;

            if (bt > 0 || br > 0 || bb > 0 || bl > 0) {
              ctx.save();
              if (style.borderTopStyle === 'dashed' || style.borderBottomStyle === 'dashed') {
                ctx.setLineDash([4, 3]);
              }
              if (bt > 0 && br > 0 && bb > 0 && bl > 0 && !isTransparentColor(style.borderTopColor)) {
                traceRoundedRect(ctx, rect.left, rect.top, rect.width, rect.height, radius);
                ctx.strokeStyle = style.borderTopColor;
                ctx.lineWidth = bt;
                ctx.stroke();
              } else {
                if (bt > 0 && !isTransparentColor(style.borderTopColor)) {
                  ctx.beginPath();
                  ctx.moveTo(rect.left, rect.top + bt / 2);
                  ctx.lineTo(rect.right, rect.top + bt / 2);
                  ctx.strokeStyle = style.borderTopColor;
                  ctx.lineWidth = bt;
                  ctx.stroke();
                }
                if (bb > 0 && !isTransparentColor(style.borderBottomColor)) {
                  ctx.beginPath();
                  ctx.moveTo(rect.left, rect.bottom - bb / 2);
                  ctx.lineTo(rect.right, rect.bottom - bb / 2);
                  ctx.strokeStyle = style.borderBottomColor;
                  ctx.lineWidth = bb;
                  ctx.stroke();
                }
                if (bl > 0 && !isTransparentColor(style.borderLeftColor)) {
                  ctx.beginPath();
                  ctx.moveTo(rect.left + bl / 2, rect.top);
                  ctx.lineTo(rect.left + bl / 2, rect.bottom);
                  ctx.strokeStyle = style.borderLeftColor;
                  ctx.lineWidth = bl;
                  ctx.stroke();
                }
                if (br > 0 && !isTransparentColor(style.borderRightColor)) {
                  ctx.beginPath();
                  ctx.moveTo(rect.right - br / 2, rect.top);
                  ctx.lineTo(rect.right - br / 2, rect.bottom);
                  ctx.strokeStyle = style.borderRightColor;
                  ctx.lineWidth = br;
                  ctx.stroke();
                }
              }
              ctx.restore();
            }

            // Contenido embebido: <canvas>, <img>, <input>, <select>
            if (node instanceof HTMLCanvasElement && node.width > 0 && node.height > 0) {
              try {
                ctx.drawImage(node, rect.left, rect.top, rect.width, rect.height);
              } catch {
                // Ignorar si no es accesible
              }
            } else if (
              node instanceof HTMLImageElement &&
              node.complete &&
              node.naturalWidth > 0
            ) {
              try {
                ctx.drawImage(node, rect.left, rect.top, rect.width, rect.height);
              } catch {
                // Ignorar imágenes cross-origin sin CORS
              }
            } else if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
              const val = node.value || node.placeholder || '';
              if (val.trim()) {
                ctx.save();
                ctx.font = `${style.fontStyle || 'normal'} ${style.fontWeight || '400'} ${style.fontSize || '12px'} ${style.fontFamily || 'sans-serif'}`;
                ctx.fillStyle = node.value ? style.color || '#f8fafc' : '#64748b';
                ctx.textBaseline = 'middle';
                const padLeft = parseFloat(style.paddingLeft || '8') || 8;
                ctx.fillText(val, rect.left + padLeft, rect.top + rect.height / 2);
                ctx.restore();
              }
            }
          }

          // Aplicar recorte (clip) si el contenedor tiene overflow oculto o con scroll
          if (clipsOverflow && rect.width > 0 && rect.height > 0) {
            ctx.save();
            traceRoundedRect(ctx, rect.left, rect.top, rect.width, rect.height, radius);
            ctx.clip();
          }

          // Pintar nodos de texto directos de este elemento en sus coordenadas exactas de pantalla
          if (intersectsCrop) {
            const childNodes = node.childNodes;
            for (let i = 0; i < childNodes.length; i++) {
              const child = childNodes[i];
              if (child.nodeType === Node.TEXT_NODE) {
                const rawText = child.nodeValue || '';
                const collapsed = formatReadableFormulaOnCanvas(rawText.replace(/\s+/g, ' '));
                if (!collapsed.trim()) continue;

                let displayStr = collapsed;
                if (style.textTransform === 'uppercase') displayStr = displayStr.toUpperCase();
                else if (style.textTransform === 'lowercase') displayStr = displayStr.toLowerCase();

                try {
                  rangeHelper.selectNodeContents(child);
                  const clientRects = rangeHelper.getClientRects();
                  if (clientRects.length === 0) continue;

                  const firstRect = clientRects[0];
                  const textCenterX = firstRect.left + firstRect.width / 2;
                  const textCenterY = firstRect.top + firstRect.height / 2;
                  const isTextCenterInCrop =
                    textCenterX >= cropRect.left - 2 &&
                    textCenterX <= cropRect.right + 2 &&
                    textCenterY >= cropRect.top - 2 &&
                    textCenterY <= cropRect.bottom + 2;

                  if (
                    firstRect.right < cropRect.left ||
                    firstRect.left > cropRect.right ||
                    firstRect.bottom < cropRect.top ||
                    firstRect.top > cropRect.bottom
                  ) {
                    if (clientRects.length === 1) continue;
                  }

                  // Guardar fragmento de texto visible SÓLO si su centro cae físicamente dentro del recuadro y no está tapado por otra ventana
                  const cleanSnippet = displayStr.trim();
                  const belongsToFramedWindow =
                    uniqueIntersectingWindows.length === 0 ||
                    uniqueIntersectingWindows.some((w) => w.el.contains(node));

                  if (
                    isTextCenterInCrop &&
                    belongsToFramedWindow &&
                    isElementVisibleAtCenter(node, firstRect) &&
                    !node.closest('.math-formula-rendered, .katex') &&
                    cleanSnippet.length > 1 &&
                    capturedTextSnippets.length < 260
                  ) {
                    capturedTextSnippets.push(cleanSnippet);
                  }

                  ctx.save();
                  ctx.font = `${style.fontStyle || 'normal'} ${style.fontWeight || '400'} ${style.fontSize || '12px'} ${style.fontFamily || 'sans-serif'}`;
                  ctx.fillStyle = style.color || '#f1f5f9';
                  ctx.textBaseline = 'middle';

                  if (clientRects.length === 1) {
                    const r = clientRects[0];
                    const trimmedLine =
                      childNodes.length === 1 ? displayStr.trim() : displayStr.replace(/^\s+|\s+$/g, ' ');
                    ctx.fillText(trimmedLine, r.left, r.top + r.height / 2);
                  } else {
                    const fullBounding = rangeHelper.getBoundingClientRect();
                    const words = displayStr.trim().split(' ');
                    const maxW = Math.max(40, fullBounding.width + 6);
                    const lineH =
                      parseFloat(style.lineHeight) ||
                      (parseFloat(style.fontSize || '11') || 11) * 1.38;

                    let currentLine = '';
                    let lineIdx = 0;
                    const baseTop = clientRects[0].top + clientRects[0].height / 2;

                    for (let w = 0; w < words.length; w++) {
                      const testLine = currentLine ? `${currentLine} ${words[w]}` : words[w];
                      if (ctx.measureText(testLine).width > maxW && currentLine) {
                        const lineRectLeft =
                          clientRects[Math.min(lineIdx, clientRects.length - 1)]?.left ??
                          fullBounding.left;
                        ctx.fillText(currentLine, lineRectLeft, baseTop + lineIdx * lineH);
                        currentLine = words[w];
                        lineIdx++;
                      } else {
                        currentLine = testLine;
                      }
                    }
                    if (currentLine) {
                      const lineRectLeft =
                        clientRects[Math.min(lineIdx, clientRects.length - 1)]?.left ??
                        fullBounding.left;
                      ctx.fillText(currentLine, lineRectLeft, baseTop + lineIdx * lineH);
                    }
                  }
                  ctx.restore();
                } catch {
                  // Ignorar si el rango de texto no es medible
                }
              }
            }
          }

          // Recorrer elementos hijos ordenados por z-index ascendente (para que las ventanas de z-[250] siempre tapen al fondo)
          const elChildren = Array.from(node.children);
          if (elChildren.length > 1) {
            const indexed = elChildren.map((childEl, idx) => {
              const cs = window.getComputedStyle(childEl);
              const pos = cs.position;
              const zRaw = pos !== 'static' ? parseInt(cs.zIndex || '0', 10) : 0;
              return {
                childEl,
                idx,
                z: Number.isNaN(zRaw) ? 0 : zRaw
              };
            });
            indexed.sort((a, b) => (a.z !== b.z ? a.z - b.z : a.idx - b.idx));
            for (const item of indexed) {
              paintDomNode(item.childEl);
            }
          } else if (elChildren.length === 1) {
            paintDomNode(elChildren[0]);
          }

          if (clipsOverflow && rect.width > 0 && rect.height > 0) {
            ctx.restore();
          }
        };

        // Ejecutar el recorrido síncrono desde document.body
        paintDomNode(document.body);

        // --- PASO 3: EXTRACCIÓN ESTRUCTURADA 100 % CEÑIDA AL INTERIOR DEL RECUADRO (CERO FUGAS DE OTROS PANELES O PESTAÑAS) ---
        const searchRoots: HTMLElement[] =
          uniqueIntersectingWindows.length > 0
            ? [uniqueIntersectingWindows[uniqueIntersectingWindows.length - 1].el]
            : [document.body];

        const activeTabs: string[] = [];
        const headings: string[] = [];
        const structuredItems: FramedElementDetail[] = [];
        const seenStructuredTexts = new Set<string>();

        const cleanStr = (s: string | null | undefined) =>
          formatReadableFormulaOnCanvas(s || '')
            .replace(/\s+/g, ' ')
            .replace(/Analizar con Gemini|ENCUADRE GEMINI|Arrastra sobre cualquier pestaña/gi, '')
            .trim();

        // Extrae el texto de un elemento separando hijos distintos con " · " y tratando las fórmulas KaTeX como una sola expresión limpia
        const extractSpacedTextFromCrop = (el: Element): string => {
          if (el.classList.contains('math-formula-rendered')) {
            const rawLatex =
              el.getAttribute('data-math-raw') ||
              el.querySelector('annotation[encoding="application/x-tex"]')?.textContent ||
              el.textContent ||
              '';
            return cleanScientificSymbols(rawLatex);
          }
          const directParts: string[] = [];
          const walk = (n: Node) => {
            if (n.nodeType === Node.TEXT_NODE) {
              const t = cleanStr(n.nodeValue);
              if (t) directParts.push(t);
            } else if (n instanceof HTMLElement) {
              if (n.classList.contains('katex-mathml')) return;
              if (n.classList.contains('math-formula-rendered')) {
                const rawLatex =
                  n.getAttribute('data-math-raw') ||
                  n.querySelector('annotation[encoding="application/x-tex"]')?.textContent ||
                  n.textContent ||
                  '';
                const fClean = cleanScientificSymbols(rawLatex);
                if (fClean) directParts.push(fClean);
                return;
              }
              const st = window.getComputedStyle(n);
              if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') return;
              const nr = n.getBoundingClientRect();
              const cx = nr.left + nr.width / 2;
              const cy = nr.top + nr.height / 2;
              // Ignorar subelementos cuyo centro caiga fuera del recuadro recortado
              if (
                nr.width > 1 &&
                nr.height > 1 &&
                (cx < cropRect.left - 6 ||
                  cx > cropRect.right + 6 ||
                  cy < cropRect.top - 6 ||
                  cy > cropRect.bottom + 6)
              ) {
                return;
              }
              n.childNodes.forEach(walk);
            }
          };
          walk(el);
          return directParts.join(' · ').replace(/(?:\s*·\s*)+/g, ' · ').trim();
        };

        // Comprueba que un elemento esté físicamente DENTRO de los límites del recuadro (y no sea un contenedor gigante que sobresale fuera)
        const isStrictlyInsideCrop = (r: DOMRect, el: Element): boolean => {
          if (r.width <= 2 || r.height <= 2) return false;
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          if (
            cx < cropRect.left - 4 ||
            cx > cropRect.right + 4 ||
            cy < cropRect.top - 4 ||
            cy > cropRect.bottom + 4
          ) {
            return false;
          }
          const overlapW = Math.max(0, Math.min(r.right, cropRect.right) - Math.max(r.left, cropRect.left));
          const overlapH = Math.max(0, Math.min(r.bottom, cropRect.bottom) - Math.max(r.top, cropRect.top));
          const overlapRatioW = overlapW / Math.max(1, r.width);
          const overlapRatioH = overlapH / Math.max(1, r.height);
          if (overlapRatioW < 0.65 || overlapRatioH < 0.65) {
            return false;
          }
          return isElementVisibleAtCenter(el, r);
        };

        const extractTooltipMeta = (el: Element) => {
          const tipHolder = el.closest(
            '[data-scientific-tooltip], [data-scientific-title], [data-scientific-formula], [title]'
          );
          if (!tipHolder) return {};
          // Solo adjuntar el tooltip si el propio portador del tooltip está dentro o cerca del elemento enmarcado (evitando tooltips globales de ventana)
          const tr = tipHolder.getBoundingClientRect();
          if (tr.height > cropRect.height * 1.6 && tr.width > cropRect.width * 1.6) {
            return {};
          }
          return {
            tooltipTitle: cleanStr(tipHolder.getAttribute('data-scientific-title')) || undefined,
            tooltipContent:
              cleanStr(tipHolder.getAttribute('data-scientific-tooltip')) ||
              cleanStr(tipHolder.getAttribute('title')) ||
              undefined,
            formula: cleanStr(tipHolder.getAttribute('data-scientific-formula')) || undefined,
            regulatory: cleanStr(tipHolder.getAttribute('data-scientific-regulatory')) || undefined,
            citation: cleanStr(tipHolder.getAttribute('data-scientific-citation')) || undefined
          };
        };

        const toolbarNoiseRegex =
          /^(×|x|cerrar|minimizar|maximizar|guardar|imprimir|subir|re-encuadrar|fijar|fijado|arrastrar|3d:\s*(on|off)|mapa base.*|\d+\s*estaciones.*|\d+\s*satélites.*|exportar\s*(geojson|csv).*|encuadrar.*)$/i;

        for (const rootEl of searchRoots) {
          // 1. Detectar pestañas o subpestañas activas: SOLO si están dentro del recuadro (o en la barra de pestañas directa de la ventana propietaria, nunca de la barra del mapa)
          const tabCandidates = Array.from(
            rootEl.querySelectorAll('button, [role="tab"]')
          ) as HTMLElement[];

          for (const btn of tabCandidates) {
            if (btn.closest('#screen-crop-overlay-root') || btn.closest('.screen-crop-ignore')) continue;
            const st = window.getComputedStyle(btn);
            if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') continue;
            const br = btn.getBoundingClientRect();
            const txt = cleanStr(btn.innerText || btn.textContent);
            if (!txt || txt.length < 2 || txt.length > 85) continue;
            if (toolbarNoiseRegex.test(txt)) continue;

            const inCrop = isStrictlyInsideCrop(br, btn);
            // Si el recuadro no incluye ninguna barra de pestañas y estamos dentro de una ventana DraggableWindow, solo aceptar role="tab" o aria-selected="true" de esa ventana
            const isExplicitWindowTab =
              uniqueIntersectingWindows.length > 0 &&
              uniqueIntersectingWindows[uniqueIntersectingWindows.length - 1].el.contains(btn) &&
              (btn.getAttribute('role') === 'tab' || btn.getAttribute('aria-selected') === 'true');

            if (!inCrop && !isExplicitWindowTab) continue;

            const cls = typeof btn.className === 'string' ? btn.className : '';
            const looksLikeMetricCard =
              br.height > 42 || /%|µg\/m³|≤|≥|0%\s*datos\s*mock|balance\s*pinn/i.test(txt);
            const isSelectedTab =
              !looksLikeMetricCard &&
              (btn.getAttribute('aria-selected') === 'true' ||
                btn.getAttribute('role') === 'tab' ||
                (inCrop &&
                  txt.length <= 45 &&
                  /border-b-2|bg-purple-|bg-emerald-|bg-sky-|bg-cyan-|bg-indigo-|bg-amber-|bg-blue-|bg-rose-|ring-1|ring-2/.test(
                    cls
                  ) &&
                  !/bg-slate-900|bg-slate-950|bg-slate-800\/40|text-slate-400|text-slate-500/.test(cls)));

            if (isSelectedTab && !activeTabs.includes(txt)) {
              activeTabs.push(txt);
            }
          }

          // 2. Recorrer TODOS los elementos candidatos estrictamente dentro del recuadro (incluyendo filas flex, spans, divs de ecuaciones, tablas, botones y gráficas)
          const allNodes = Array.from(
            rootEl.querySelectorAll(
              'h1, h2, h3, h4, h5, h6, button, select, tr, svg, code, [data-scientific-tooltip], .rounded-lg, .rounded-xl, .border, .flex, p, li, div, span'
            )
          ) as Element[];

          let currentSectionTitle =
            uniqueIntersectingWindows[uniqueIntersectingWindows.length - 1]?.title ||
            activeTabs[0] ||
            'Recuadro Seleccionado';

          for (const el of allNodes) {
            if (el.closest('#screen-crop-overlay-root') || el.closest('.screen-crop-ignore')) continue;
            // Si el nodo está dentro de una fórmula KaTeX, saltar todos sus sub-spans internos para no fragmentar la ecuación en 30 trozos
            if (el.closest('.math-formula-rendered, .katex') && !el.classList.contains('math-formula-rendered')) {
              continue;
            }
            const st = window.getComputedStyle(el);
            if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity || '1') <= 0.02) {
              continue;
            }
            const r = el.getBoundingClientRect();
            if (!isStrictlyInsideCrop(r, el)) continue;

            const tag = el.tagName.toLowerCase();
            const meta = extractTooltipMeta(el);

            // Si es una fórmula matemática renderizada (<MathFormula />), extraerla íntegra como un único elemento de ecuación
            if (el.classList.contains('math-formula-rendered')) {
              const formulaTxt = extractSpacedTextFromCrop(el);
              if (formulaTxt && formulaTxt.length >= 2) {
                const normF = formulaTxt.toLowerCase();
                if (!seenStructuredTexts.has(normF)) {
                  seenStructuredTexts.add(normF);
                  structuredItems.push({
                    kind: 'ECUACIÓN / FÓRMULA',
                    text: formulaTxt,
                    parentSection: currentSectionTitle,
                    ...meta
                  });
                }
              }
              continue;
            }

            // Encabezados explícitos (h1..h6) o títulos en mayúsculas / negrita dentro del recuadro
            const isHeadingLikeDiv =
              (tag === 'div' || tag === 'span') &&
              el.children.length <= 2 &&
              (st.textTransform === 'uppercase' || parseInt(st.fontWeight || '400', 10) >= 700) &&
              r.height <= 36;

            if (/^h[1-6]$/.test(tag) || isHeadingLikeDiv) {
              const hTxt = extractSpacedTextFromCrop(el);
              if (
                hTxt &&
                hTxt.length >= 3 &&
                hTxt.length <= 90 &&
                !toolbarNoiseRegex.test(hTxt) &&
                !/^\d+(?:[.,]\d+)?\s*%?$/.test(hTxt)
              ) {
                if (/^h[1-6]$/.test(tag) || !hTxt.includes(':')) {
                  currentSectionTitle = hTxt;
                  if (!headings.includes(hTxt)) headings.push(hTxt);
                }
                const normH = hTxt.toLowerCase();
                if (!seenStructuredTexts.has(normH)) {
                  seenStructuredTexts.add(normH);
                  structuredItems.push({
                    kind:
                      /[=∂∇ΔΦλµ±≈≤≥→]|w₁|w₂|w₃|Ĉ|dC\/dt/.test(hTxt)
                        ? 'ECUACIÓN / FÓRMULA'
                        : /\d/.test(hTxt)
                          ? 'MÉTRICA / INDICADOR'
                          : 'SECCIÓN / TÍTULO',
                    text: hTxt,
                    parentSection: currentSectionTitle,
                    ...meta
                  });
                }
                if (/^h[1-6]$/.test(tag)) continue;
              }
            }

            // Gráficas o diagramas SVG con texto/ejes
            if (tag === 'svg') {
              if (r.width >= 55 && r.height >= 35) {
                const svgTexts = Array.from(el.querySelectorAll('text'))
                  .map((t) => cleanStr(t.textContent))
                  .filter((t) => t.length > 0);
                const uniqueSvgLabels = Array.from(new Set(svgTexts)).slice(0, 18);
                if (uniqueSvgLabels.length > 0 || meta.tooltipContent) {
                  const desc =
                    uniqueSvgLabels.length > 0
                      ? `Diagrama / Gráfica Vectorial con etiquetas y ejes: ${uniqueSvgLabels.join(' · ')}`
                      : `Diagrama / Gráfica Vectorial (${Math.round(r.width)}×${Math.round(r.height)} px)`;
                  const key = `svg::${desc.toLowerCase().slice(0, 100)}`;
                  if (!seenStructuredTexts.has(key)) {
                    seenStructuredTexts.add(key);
                    structuredItems.push({
                      kind: 'GRÁFICA / DIAGRAMA',
                      text: desc,
                      parentSection: currentSectionTitle,
                      ...meta
                    });
                  }
                }
              }
              continue;
            }

            // Selectores desplegables (<select>)
            if (tag === 'select' && el instanceof HTMLSelectElement) {
              const selectedOpt = cleanStr(el.options[el.selectedIndex]?.text || el.value);
              const allOpts = Array.from(el.options)
                .map((o) => cleanStr(o.text))
                .filter(Boolean)
                .slice(0, 6)
                .join(' / ');
              if (selectedOpt) {
                const desc = `Selector activo: «${selectedOpt}» (Opciones disponibles: ${allOpts})`;
                const key = `sel::${desc.toLowerCase()}`;
                if (!seenStructuredTexts.has(key)) {
                  seenStructuredTexts.add(key);
                  structuredItems.push({
                    kind: 'CONTROL / SELECTOR',
                    text: desc,
                    parentSection: currentSectionTitle,
                    ...meta
                  });
                }
              }
              continue;
            }

            // Botones o pestañas interactivas estrictamente dentro del recuadro
            if (tag === 'button') {
              const bTxt = extractSpacedTextFromCrop(el);
              if (bTxt && bTxt.length >= 2 && bTxt.length <= 120 && !toolbarNoiseRegex.test(bTxt)) {
                const isTab = activeTabs.includes(bTxt);
                const key = bTxt.toLowerCase();
                if (!seenStructuredTexts.has(key)) {
                  seenStructuredTexts.add(key);
                  structuredItems.push({
                    kind: isTab ? 'PESTAÑA / SUBPESTAÑA' : 'CONTROL / SELECTOR',
                    text: isTab ? `Pestaña Activa Seleccionada: «${bTxt}»` : `Control / Botón: «${bTxt}»`,
                    parentSection: currentSectionTitle,
                    ...meta
                  });
                }
              }
              continue;
            }

            // Filas de tabla (<tr>)
            if (tag === 'tr') {
              const cells = Array.from(el.querySelectorAll('th, td'))
                .map((c) => cleanStr(c.textContent))
                .filter(Boolean);
              if (cells.length >= 2) {
                const rowStr = cells.join(' · ');
                const key = rowStr.toLowerCase();
                if (!seenStructuredTexts.has(key)) {
                  seenStructuredTexts.add(key);
                  structuredItems.push({
                    kind: 'TABLA / REGISTRO',
                    text: rowStr,
                    parentSection: currentSectionTitle,
                    ...meta
                  });
                }
              }
              continue;
            }

            // Filas atómicas (ej. pares Etiqueta + Valor en barras de porcentaje, ecuaciones, KPIs o líneas individuales)
            const nestedBlockContainers = Array.from(el.children).filter((c) => {
              const ct = c.tagName.toLowerCase();
              return ct === 'div' || ct === 'p' || ct === 'table' || ct === 'ul' || ct === 'tr';
            });

            // Extraer tarjetas KPI compactas (ej. Confiabilidad 97.4% ALTA · 0% datos mock) o filas atómicas
            const isCompactKpiCard =
              (el.hasAttribute('data-scientific-tooltip') ||
                el.classList.contains('rounded-lg') ||
                el.classList.contains('rounded-xl')) &&
              r.width <= 280 &&
              r.height <= 115 &&
              nestedBlockContainers.length <= 4;

            if (nestedBlockContainers.length <= 1 || isCompactKpiCard) {
              const rawElText = extractSpacedTextFromCrop(el);
              if (!rawElText || rawElText.length < 2 || rawElText.length > 260) continue;
              if (toolbarNoiseRegex.test(rawElText)) continue;

              const hasFormulaChars =
                /[=∂∇ΔΦλµ±≈≤≥→]|Ĉ|w₁|w₂|w₃|dC\/dt|r_a|r_b|r_c|v_d|R²|RMSE|FAC2|MQI/.test(
                  rawElText
                );
              const hasNumbers =
                /\d+(?:[.,]\d+)?\s*(?:µg\/m³|mg\/m³|ppb|ppm|%|m\/s|W\/m²|°C|dB|s\/m|cm\/s|kg|g|m\b|km\b|15m|h\b)?/i.test(
                  rawElText
                );

              const kind: FramedElementDetail['kind'] =
                hasFormulaChars && (rawElText.includes('=') || rawElText.includes('≈'))
                  ? 'ECUACIÓN / FÓRMULA'
                  : hasNumbers || rawElText.includes(':')
                    ? 'MÉTRICA / INDICADOR'
                    : 'BLOQUE CIENTÍFICO';

              const normKey = rawElText.toLowerCase();
              const isExactDuplicate = seenStructuredTexts.has(normKey);

              if (!isExactDuplicate && structuredItems.length < 65) {
                seenStructuredTexts.add(normKey);
                structuredItems.push({
                  kind,
                  text: rawElText,
                  parentSection: currentSectionTitle,
                  ...meta
                });
              }
            }
          }
        }

        // 3. Purgar contenedores gigantes (> 110 caracteres) que concatenan múltiples bloques distintos, pero preservar tarjetas KPI compactas (< 95 caracteres) eliminando sus palabras sueltas internas
        const atomicStructuredItems = structuredItems.filter((item, idx, arr) => {
          const itemNorm = item.text.toLowerCase();
          // Si este ítem es un fragmento corto (ej. "ALTA", "97.4 · %", "0% datos mock") que ya forma parte de una tarjeta KPI compacta (<= 95 chars), descartar el fragmento suelto
          const isInsideCompactCard = arr.some(
            (other, oIdx) =>
              oIdx !== idx &&
              other.text.length > item.text.length &&
              other.text.length <= 95 &&
              other.text.toLowerCase().includes(itemNorm)
          );
          if (isInsideCompactCard) return false;

          // Si este ítem es un contenedor grande (> 95 chars) que agrupa 2 o más bloques ya capturados, descartar el contenedor grande
          if (item.text.length > 95) {
            const containedSmallerCount = arr.filter(
              (other, oIdx) =>
                oIdx !== idx &&
                other.text.length >= 4 &&
                other.text.length < item.text.length - 4 &&
                itemNorm.includes(other.text.toLowerCase())
            ).length;
            return containedSmallerCount < 2;
          }
          return true;
        });

        // 4. Asegurar que ningún fragmento de texto visible en el recuadro (capturedTextSnippets) se quede fuera
        for (const snippet of Array.from(new Set(capturedTextSnippets))) {
          const cleanSnip = cleanStr(snippet);
          if (!cleanSnip || cleanSnip.length < 2 || toolbarNoiseRegex.test(cleanSnip)) continue;
          const lowSnip = cleanSnip.toLowerCase();
          const alreadyCovered = atomicStructuredItems.some(
            (it) => it.text.toLowerCase().includes(lowSnip) || lowSnip.includes(it.text.toLowerCase())
          );
          if (!alreadyCovered && atomicStructuredItems.length < 65) {
            const isEq = /[=∂∇ΔΦλµ±≈≤≥→]|Ĉ|w₁|w₂|w₃/.test(cleanSnip);
            const isNum = /\d/.test(cleanSnip);
            atomicStructuredItems.push({
              kind: isEq ? 'ECUACIÓN / FÓRMULA' : isNum ? 'MÉTRICA / INDICADOR' : 'BLOQUE CIENTÍFICO',
              text: cleanSnip,
              parentSection: headings[0] || uniqueIntersectingWindows[0]?.title || 'Recuadro Seleccionado'
            });
          }
        }

        // Si el usuario recortó un sub-bloque específico dentro de un panel, usar los encabezados reales dentro del recuadro como identificación principal
        const finalWindowTitles =
          uniqueIntersectingWindows.length > 0 &&
          uniqueIntersectingWindows[0].title !== 'Panel Analítico Seleccionado'
            ? uniqueIntersectingWindows.map((w) => w.title)
            : headings.length > 0
              ? [headings[0]]
              : atomicStructuredItems.length > 0
                ? [atomicStructuredItems[0].text.slice(0, 65)]
                : ['Recuadro Seleccionado en Pantalla'];

        const finalActiveTabs =
          activeTabs.length > 0
            ? activeTabs.slice(0, 4)
            : headings.length > 0
              ? headings.slice(0, 3)
              : [];

        // Construir visibleText limpio separado por saltos de línea (\n) exclusivamente con lo enmarcado
        const structuredLines = atomicStructuredItems.map((item) => {
          const tipSuffix = item.tooltipContent ? ` [Fundamento: ${item.tooltipContent}]` : '';
          const formSuffix = item.formula ? ` [Fórmula: ${item.formula}]` : '';
          return `[${item.kind}] ${item.text}${formSuffix}${tipSuffix}`;
        });

        const finalVisibleText = structuredLines.join('\n').slice(0, 14000);

        // Guardar contexto exacto capturado del DOM para que la Síntesis Doctoral explique al 100% SOLO lo encuadrado
        window.__LAST_GEMINI_CROP_CONTEXT__ = {
          windowTitles: finalWindowTitles,
          activeTabs: finalActiveTabs,
          headings: headings.slice(0, 20),
          structuredItems: atomicStructuredItems.slice(0, 60),
          visibleText: finalVisibleText,
          cropDimensions: { left, top, width, height },
          coveredByWindow: uniqueIntersectingWindows.length > 0 || hitElements.length > 0
        };

        const finalBase64 = outputCanvas.toDataURL('image/png');
        if (finalBase64 && finalBase64.length > 200) {
          onCropComplete(finalBase64);
        } else {
          throw new Error('La captura resultó vacía');
        }
      } catch (err: any) {
        console.error('[Screen Crop Error]:', err);
        setErrorMessage(
          'No se pudo completar el recorte. Puedes pulsar en "Subir Imagen" o pegar con Ctrl+V.'
        );
      } finally {
        setCapturing(false);
        if (overlayEl) {
          overlayEl.style.display = '';
        }
      }
    },
    [onCropComplete]
  );

  // Escuchar teclado: ESC para cancelar, Enter para confirmar selección
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter' && cropBox && hasSelected && !capturing) {
        executeCompositeCrop(cropBox);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, cropBox, hasSelected, capturing, onCancel, executeCompositeCrop]);

  // Soporte universal para pegar imagen desde el portapapeles (Ctrl+V / Cmd+V)
  useEffect(() => {
    if (!isActive) return;

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
                onCropComplete(base64);
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
  }, [isActive, onCropComplete]);

  // Carga manual de imagen
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          onCropComplete(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Encuadrar directamente una ventana o pestaña abierta con un solo clic
  const handleEncuadrarWindow = (win: DetectedWindow) => {
    const freshRect = win.el.getBoundingClientRect();
    const box: CropBox = {
      startX: Math.max(0, freshRect.left),
      startY: Math.max(0, freshRect.top),
      endX: Math.min(window.innerWidth, freshRect.right),
      endY: Math.min(window.innerHeight, freshRect.bottom)
    };
    setCropBox(box);
    setHasSelected(true);
    executeCompositeCrop(box);
  };

  // Encuadre predefinido: Pantalla Completa
  const handleCaptureFullScreen = () => {
    const box: CropBox = {
      startX: 0,
      startY: 0,
      endX: window.innerWidth,
      endY: window.innerHeight
    };
    setCropBox(box);
    setHasSelected(true);
    executeCompositeCrop(box);
  };

  // Encuadre predefinido: Centro del Mapa
  const handleCaptureCenterMap = () => {
    const marginX = window.innerWidth * 0.15;
    const marginY = window.innerHeight * 0.12;
    const box: CropBox = {
      startX: marginX,
      startY: marginY,
      endX: window.innerWidth - marginX,
      endY: window.innerHeight - marginY * 1.4
    };
    setCropBox(box);
    setHasSelected(true);
    executeCompositeCrop(box);
  };

  // Gestos del ratón para encuadre libre
  const handleMouseDown = (e: React.MouseEvent) => {
    if (capturing) return;
    setIsDrawing(true);
    setHasSelected(false);
    setErrorMessage(null);
    setCropBox({
      startX: e.clientX,
      startY: e.clientY,
      endX: e.clientX,
      endY: e.clientY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !cropBox) return;
    const nextX = e.clientX;
    const nextY = e.clientY;
    if (rafMoveRef.current !== null) {
      cancelAnimationFrame(rafMoveRef.current);
    }
    rafMoveRef.current = requestAnimationFrame(() => {
      rafMoveRef.current = null;
      setCropBox((prev) => (prev ? { ...prev, endX: nextX, endY: nextY } : null));
    });
  };

  const handleMouseUp = () => {
    if (rafMoveRef.current !== null) {
      cancelAnimationFrame(rafMoveRef.current);
      rafMoveRef.current = null;
    }
    if (!isDrawing || !cropBox) return;
    setIsDrawing(false);

    const width = Math.abs(cropBox.endX - cropBox.startX);
    const height = Math.abs(cropBox.endY - cropBox.startY);

    if (width >= 25 && height >= 25) {
      setHasSelected(true);
    } else {
      setCropBox(null);
      setHasSelected(false);
    }
  };

  if (!isActive) return null;

  const currentRect = cropBox
    ? {
        left: Math.max(0, Math.min(cropBox.startX, cropBox.endX)),
        top: Math.max(0, Math.min(cropBox.startY, cropBox.endY)),
        width: Math.abs(cropBox.endX - cropBox.startX),
        height: Math.abs(cropBox.endY - cropBox.startY)
      }
    : null;

  return (
    <div
      id="screen-crop-overlay-root"
      ref={overlayRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="fixed inset-0 z-[99999] cursor-crosshair select-none bg-black/40"
      style={{ touchAction: 'none' }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />

      {/* Barra superior de herramientas y controles */}
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="screen-crop-ignore absolute top-3 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-purple-500/80 px-3 py-2 rounded-xl shadow-2xl flex flex-wrap items-center justify-center gap-2 text-xs text-slate-100 font-sans pointer-events-auto backdrop-blur-md max-w-[96vw]"
      >
        <div className="flex items-center gap-1.5 font-bold text-purple-300 pr-2 border-r border-slate-800">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="tracking-wide uppercase text-[11px] hidden sm:inline">
            Encuadrar · Gemini Multimodal
          </span>
        </div>

        {/* Botones directos para encuadrar cada ventana o pestaña abierta */}
        {openWindows.length > 0 && (
          <div className="flex items-center gap-1.5 bg-purple-950/40 border border-purple-800/60 px-2 py-0.5 rounded-lg">
            <span className="text-[10px] text-purple-300 font-bold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Ventanas Abiertas:</span>
            </span>
            {openWindows.map((win, idx) => (
              <button
                key={idx}
                onClick={() => handleEncuadrarWindow(win)}
                disabled={capturing}
                className="flex items-center gap-1 px-2 py-0.5 bg-purple-900/80 hover:bg-purple-800 text-purple-100 border border-purple-500/80 rounded font-bold text-[10px] cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
                title={`Encuadrar y analizar inmediatamente la ventana: ${win.title}`}
              >
                <Eye className="w-3 h-3 text-emerald-400" />
                <span className="max-w-[150px] truncate">{win.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCaptureFullScreen}
            disabled={capturing}
            className="flex items-center gap-1 px-2.5 py-1 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700/70 rounded-md font-bold text-[10px] cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
            title="Capturar toda la pantalla completa con todas las ventanas y el mapa"
          >
            <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Toda la Pantalla</span>
          </button>

          <button
            onClick={handleCaptureCenterMap}
            disabled={capturing}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-md font-bold text-[10px] cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
            title="Encuadrar automáticamente el área central del mapa"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span>Área Central</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={capturing}
            className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-md font-bold text-[10px] cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
            title="Subir un archivo de imagen (PNG o JPG)"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Subir</span>
          </button>
        </div>

        <span className="text-slate-500 hidden md:inline">|</span>
        <span className="text-slate-400 hidden lg:inline text-[10px]">
          Arrastra sobre cualquier pestaña o mapa · <kbd className="bg-slate-800 px-1 py-0.5 rounded text-[9px] font-mono text-purple-300">Ctrl+V</kbd>
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/80 rounded-md font-bold text-[10px] cursor-pointer transition-colors"
        >
          <X className="w-3.5 h-3.5 text-rose-400" />
          <span>Cancelar (ESC)</span>
        </button>
      </div>

      {/* Recuadro de selección activo e interactivo */}
      {currentRect && (
        <div
          className="absolute border-2 border-dashed border-purple-400 bg-purple-500/10 pointer-events-none shadow-[0_0_25px_rgba(168,85,247,0.4)]"
          style={{
            left: `${currentRect.left}px`,
            top: `${currentRect.top}px`,
            width: `${currentRect.width}px`,
            height: `${currentRect.height}px`
          }}
        >
          {/* Badge con dimensiones de píxeles */}
          <div className="absolute -top-7 left-0 bg-purple-950 text-purple-200 border border-purple-600 px-2 py-0.5 rounded text-[10px] font-mono font-bold shadow-md">
            {Math.round(currentRect.width)} × {Math.round(currentRect.height)} px
          </div>

          {/* Marcadores de esquinas estilo visor científico */}
          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-purple-300" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-purple-300" />
          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-purple-300" />
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-purple-300" />

          {/* Barra de acción adherida a la selección */}
          {hasSelected && cropBox && !capturing && (
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="screen-crop-ignore absolute -bottom-12 left-1/2 -translate-x-1/2 bg-slate-950 border border-purple-500 p-1 rounded-lg shadow-2xl flex items-center gap-1.5 pointer-events-auto z-50 whitespace-nowrap"
            >
              <ScientificTooltip
                position="top"
                title="Síntesis Visual y Auditoría Científica de Región de Interés (ROI)"
                formula="\Omega_{\text{ROI}} = [x_1, x_2] \times [y_1, y_2] \rightarrow \text{PNG Base64}"
                explanation="Compone en memoria el recorte cartográfico WebGL/Canvas junto con las capas vectoriales superpuestas para su inspección analítica e inclusión en láminas doctorales."
                normativeRef="Fotogrametría Digital y Cartografía Científica EIDUNED"
              >
                <button
                  onClick={() => executeCompositeCrop(cropBox)}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-3.5 py-1.5 rounded shadow cursor-pointer transition-all hover:scale-105"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Analizar con Gemini</span>
                  <kbd className="bg-purple-950/80 px-1 py-0.2 rounded text-[9px] font-mono">↵</kbd>
                </button>
              </ScientificTooltip>

              <ScientificTooltip
                position="top"
                title="Reencuadre Geométrico de Ventana Espacial"
                formula="\Delta x, \Delta y \rightarrow \text{Reset ROI}"
                explanation="Descarta las coordenadas de píxel actuales y habilita un nuevo trazado ortogonal sobre el lienzo del Gemelo Digital."
                normativeRef="Interfaz Cartográfica Interactiva"
              >
                <button
                  onClick={() => {
                    setCropBox(null);
                    setHasSelected(false);
                  }}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2 py-1.5 rounded cursor-pointer transition-colors"
                  title="Volver a dibujar el encuadre"
                >
                  <RefreshCw className="w-3 h-3 text-sky-400" />
                  <span>Redibujar</span>
                </button>
              </ScientificTooltip>

              <ScientificTooltip
                position="top"
                title="Cancelar Modo de Captura Científica"
                explanation="Cierra el superpuesto de selección y devuelve el control táctil/ratón a la navegación 3D del mapa."
              >
                <button
                  onClick={onCancel}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs px-2 py-1.5 rounded cursor-pointer transition-colors"
                  title="Cerrar encuadre"
                >
                  <X className="w-3 h-3 text-rose-400" />
                </button>
              </ScientificTooltip>
            </div>
          )}
        </div>
      )}

      {/* Modal de error si la captura automática no pudo concretarse */}
      {errorMessage && (
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 border border-rose-600 p-5 rounded-xl shadow-2xl max-w-md w-full space-y-3 pointer-events-auto font-sans"
        >
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>Incidencia en la captura gráfica del DOM</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{errorMessage}</p>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs py-2 px-3 rounded cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir Imagen PNG/JPG</span>
            </button>

            <button
              onClick={() => {
                setErrorMessage(null);
                setCropBox(null);
                setHasSelected(false);
              }}
              className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 px-3 rounded cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reintentar</span>
            </button>

            <button
              onClick={onCancel}
              className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 px-3 rounded cursor-pointer"
            >
              <span>Cerrar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScreenCropOverlay;

