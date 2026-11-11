/**
 * Módulo de Exportación Vectorial SVG para Publicaciones Científicas JCR (Elsevier / IEEE / Springer)
 * Genera figuras vectoriales de alta resolución estandarizadas con tipografía científica y especificación ISO
 */

export interface VectorChartDataPoint {
  x: number;
  y: number;
  label?: string;
  category?: string;
}

export interface VectorSeries {
  name: string;
  color: string;
  strokeWidth?: number;
  dashArray?: string;
  points: VectorChartDataPoint[];
}

export interface VectorChartOptions {
  title: string;
  xLabel: string;
  yLabel: string;
  width?: number;
  height?: number;
  series: VectorSeries[];
  referenceLines?: Array<{ y: number; label: string; color: string; dash?: string }>;
}

/**
 * Genera un string SVG vectorial listo para insertar en LaTeX / Inkscape / Illustrator
 */
export function generateScientificSvg(options: VectorChartOptions): string {
  const width = options.width || 800;
  const height = options.height || 500;
  const margin = { top: 60, right: 140, bottom: 60, left: 70 };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Calcular límites de ejes
  let allX: number[] = [];
  let allY: number[] = [];

  options.series.forEach((s) => {
    s.points.forEach((p) => {
      allX.push(p.x);
      allY.push(p.y);
    });
  });

  if (allX.length === 0) allX = [0, 24];
  if (allY.length === 0) allY = [0, 100];

  const minX = allX.length ? Math.min(...allX) : 0;
  const maxX = (allX.length ? Math.max(...allX) : 1) || 1;
  const minY = allY.length ? Math.min(0, Math.min(...allY)) : 0;
  const maxY = (allY.length ? Math.max(...allY) : 10) * 1.1 || 10;

  const scaleX = (x: number) => margin.left + ((x - minX) / (maxX - minX)) * innerWidth;
  const scaleY = (y: number) => margin.top + innerHeight - ((y - minY) / (maxY - minY)) * innerHeight;

  // Grid Ticks
  const xTicksCount = 6;
  const yTicksCount = 5;

  const xTicks = Array.from({ length: xTicksCount + 1 }, (_, i) => minX + (i * (maxX - minX)) / xTicksCount);
  const yTicks = Array.from({ length: yTicksCount + 1 }, (_, i) => minY + (i * (maxY - minY)) / yTicksCount);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="Cambria, 'Times New Roman', Georgia, serif">
  <!-- Estilos Científicos -->
  <style>
    .bg { fill: #ffffff; }
    .title { font-size: 16px; font-weight: bold; fill: #111827; font-family: 'Times New Roman', serif; }
    .subtitle { font-size: 11px; fill: #4b5563; font-style: italic; }
    .axis { stroke: #111827; stroke-width: 1.5; }
    .grid { stroke: #e5e7eb; stroke-width: 0.8; stroke-dasharray: 3 3; }
    .axis-label { font-size: 12px; font-weight: bold; fill: #111827; }
    .tick-label { font-size: 10px; fill: #374151; }
    .legend { font-size: 11px; fill: #1f2937; }
  </style>

  <!-- Canvas Background -->
  <rect class="bg" width="${width}" height="${height}" />

  <!-- Título y Subtítulo de Figura -->
  <text x="${margin.left}" y="30" class="title">${options.title}</text>
  <text x="${margin.left}" y="45" class="subtitle">Gemelo Digital de Málaga · Formato Vectorial Citable JCR (ISO 31-11)</text>

  <!-- Grid Horizontal y Vertical -->
  <g class="grids">
`;

  // Grid líneas Y
  yTicks.forEach((tick) => {
    const y = scaleY(tick);
    svg += `    <line x1="${margin.left}" y1="${y}" x2="${margin.left + innerWidth}" y2="${y}" class="grid" />\n`;
    svg += `    <text x="${margin.left - 8}" y="${y + 3}" text-anchor="end" class="tick-label">${tick.toFixed(1)}</text>\n`;
  });

  // Grid líneas X
  xTicks.forEach((tick) => {
    const x = scaleX(tick);
    svg += `    <line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + innerHeight}" class="grid" />\n`;
    svg += `    <text x="${x}" y="${margin.top + innerHeight + 16}" text-anchor="middle" class="tick-label">${tick.toFixed(0)}</text>\n`;
  });

  svg += `  </g>\n\n  <!-- Ejes Principales -->\n`;
  svg += `  <line x1="${margin.left}" y1="${margin.top + innerHeight}" x2="${margin.left + innerWidth}" y2="${margin.top + innerHeight}" class="axis" />\n`;
  svg += `  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + innerHeight}" class="axis" />\n`;

  // Etiquetas Ejes
  svg += `  <!-- Etiquetas de Ejes -->\n`;
  svg += `  <text x="${margin.left + innerWidth / 2}" y="${height - 15}" text-anchor="middle" class="axis-label">${options.xLabel}</text>\n`;
  svg += `  <text x="20" y="${margin.top + innerHeight / 2}" text-anchor="middle" class="axis-label" transform="rotate(-90 20 ${margin.top + innerHeight / 2})">${options.yLabel}</text>\n`;

  // Lineas de Referencia Normativas
  if (options.referenceLines) {
    options.referenceLines.forEach((ref) => {
      const y = scaleY(ref.y);
      if (y >= margin.top && y <= margin.top + innerHeight) {
        svg += `  <!-- Línea de Referencia Normativa -->\n`;
        svg += `  <line x1="${margin.left}" y1="${y}" x2="${margin.left + innerWidth}" y2="${y}" stroke="${ref.color}" stroke-width="1.2" stroke-dasharray="${ref.dash || '4 4'}" />\n`;
        svg += `  <text x="${margin.left + innerWidth - 6}" y="${y - 4}" text-anchor="end" fill="${ref.color}" font-size="9" font-weight="bold">${ref.label}</text>\n`;
      }
    });
  }

  // Trazado de Series
  options.series.forEach((s) => {
    if (s.points.length === 0) return;

    let pathD = `M ${scaleX(s.points[0].x)} ${scaleY(s.points[0].y)}`;
    s.points.slice(1).forEach((p) => {
      pathD += ` L ${scaleX(p.x)} ${scaleY(p.y)}`;
    });

    svg += `  <!-- Serie: ${s.name} -->\n`;
    svg += `  <path d="${pathD}" fill="none" stroke="${s.color}" stroke-width="${s.strokeWidth || 2}" stroke-dasharray="${s.dashArray || 'none'}" />\n`;

    // Nodos / Puntos de Medida
    s.points.forEach((p) => {
      svg += `  <circle cx="${scaleX(p.x)}" cy="${scaleY(p.y)}" r="3" fill="${s.color}" stroke="#ffffff" stroke-width="1" />\n`;
    });
  });

  // Leyenda
  svg += `  <!-- Leyenda Científica -->\n  <g transform="translate(${margin.left + innerWidth + 15}, ${margin.top + 10})">\n`;
  options.series.forEach((s, idx) => {
    const yOffset = idx * 22;
    svg += `    <line x1="0" y1="${yOffset}" x2="20" y2="${yOffset}" stroke="${s.color}" stroke-width="${s.strokeWidth || 2}" stroke-dasharray="${s.dashArray || 'none'}" />\n`;
    svg += `    <circle cx="10" cy="${yOffset}" r="2.5" fill="${s.color}" />\n`;
    svg += `    <text x="26" y="${yOffset + 4}" class="legend">${s.name}</text>\n`;
  });
  svg += `  </g>\n`;

  svg += `</svg>`;
  return svg;
}

/**
 * Descarga directamente la figura en formato SVG
 * Soporta tanto (filename, rawSvgString) como (elementId, filename)
 */
export function downloadVectorSvg(param1: string, param2: string): void {
  let svgContent = '';
  let filename = '';

  // Caso 1: param2 es contenido SVG directo
  if (param2 && (param2.trim().startsWith('<svg') || param2.trim().startsWith('<?xml'))) {
    svgContent = param2;
    filename = param1.endsWith('.svg') ? param1 : `${param1}.svg`;
  } else {
    // Caso 2: param1 es un ID de elemento del DOM
    const elem = typeof document !== 'undefined' ? document.getElementById(param1) : null;
    if (elem) {
      const serializer = new XMLSerializer();
      svgContent = serializer.serializeToString(elem);
      filename = param2.endsWith('.svg') ? param2 : `${param2}.svg`;
    } else if (param1 && (param1.trim().startsWith('<svg') || param1.trim().startsWith('<?xml'))) {
      // Caso 3: param1 es el contenido SVG y param2 el nombre de archivo
      svgContent = param1;
      filename = param2.endsWith('.svg') ? param2 : `${param2}.svg`;
    } else {
      // Fallback
      svgContent = param2 || '';
      filename = param1.endsWith('.svg') ? param1 : `${param1}.svg`;
    }
  }

  // Asegurar namespace SVG válido
  if (svgContent && !svgContent.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgContent = svgContent.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
