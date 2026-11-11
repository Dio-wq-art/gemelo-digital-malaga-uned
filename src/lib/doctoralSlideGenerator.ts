/**
 * Generador de Diapositiva de Tribunal Doctoral (PowerPoint / LaTeX Beamer)
 * Tesis Doctoral - Gemelo Digital de Málaga (Physics-Informed Digital Twin)
 * 
 * Genera código fuente citable en LaTeX Beamer (.tex) y diapositivas en HTML autónomo
 * formateadas para presentaciones de defensa doctoral ante tribunal universitario.
 */

import { CompleteAudioNarrative } from './scientificSpeechGenerator';
import { LocalPointAtmosphericState } from './spatialAssimilation';
import { MeteoData } from './physics';
import { MalagaStreetTreeRecord, StreetLiveAbsorptionMetrics } from './malagaTreesInventory';

export interface DoctoralSlideData {
  streetName: string;
  districtName: string;
  lat: number;
  lon: number;
  utmX: number;
  utmY: number;
  elevationM: number;
  timestampStr: string;
  realNO2: number;
  pinnNO2: number;
  deltaNO2: number;
  pdeResidual: number;
  o3: number;
  pm25: number;
  pm10: number;
  no: number;
  nox: number;
  clno2: number;
  so2: number;
  benzene: number;
  canyonHW: number;
  svf: number;
  ach: number;
  okeRegime: string;
  phiLeighton: number;
  inhaledNO2UgH: number;
  inhaledPM25UgH: number;
  treeCount: number;
  treeSpecies: string;
  treeNO2AbsorptionGh: number;
  treeCoolingC: number;
  expandedU: number;
  uc: number;
  caqiScore: number;
  caqiLabel: string;
  officialStation: string;
  stationDistanceKm: number;
  hashSHA256: string;
}

/**
 * Genera el código LaTeX Beamer (.tex) para incluir directamente en la presentación de la tesis
 */
export function generateLatexBeamerCode(d: DoctoralSlideData): string {
  return `% ==============================================================================
% DIAPOSITIVA DE DEFENSA DOCTORAL - GEMELO DIGITAL INFORMADO POR LA FÍSICA (MÁLAGA)
% Generado automáticamente bajo principios de Ciencia Abierta FAIR
% Punto Activo: ${d.streetName} (${d.districtName}, Málaga)
% Fecha de Asimilación: ${d.timestampStr} • Hash: ${d.hashSHA256.slice(0, 16)}...
% ==============================================================================

\\begin{frame}[t]{Dictamen Físico-Químico en Microescala: ${d.streetName}}
  \\framesubtitle{Asimilación en Tiempo Real, Ecuaciones PINN y Presupuesto Metrológico GUM}

  \\begin{columns}[T]
    % COLUMNA 1: GEODESIA & MORFODINÁMICA
    \\begin{column}{0.48\\textwidth}
      \\begin{block}{\\textbf{1. Geodesia y Morfología 3D de Oke}}
        \\small
        \\begin{itemize}
          \\item \\textbf{Coordenadas ETRS89 UTM 30N:} $X = ${d.utmX.toFixed(0)}\\text{ m}, \\, Y = ${d.utmY.toFixed(0)}\\text{ m}$ ($z = ${d.elevationM.toFixed(1)}\\text{ m}$)
          \\item \\textbf{Cañón Viario:} $H/W = ${d.canyonHW.toFixed(2)}, \\, \\text{SVF} = ${d.svf.toFixed(2)}$
          \\item \\textbf{Régimen Aerodinámico:} \\textcolor{purple}{\\textbf{${d.okeRegime}}}
          \\item \\textbf{Ventilación de Calle:} $\\text{ACH} = ${d.ach.toFixed(1)}\\text{ h}^{-1}$ (Berkowicz, 2000)
        \\end{itemize}
      \\end{block}

      \\begin{block}{\\textbf{2. Asimilación Multiespecie y PINN}}
        \\small
        \\begin{itemize}
          \\item $\\text{NO}_2\\,(1.8\\text{ m AGL}):$ \\textbf{${d.realNO2.toFixed(1)} $\\mu\\text{g/m}^3$} vs PINN: \\textbf{${d.pinnNO2.toFixed(1)} $\\mu\\text{g/m}^3$}
          \\item Discrepancia $\\Delta = ${d.deltaNO2 >= 0 ? `+${d.deltaNO2.toFixed(1)}` : d.deltaNO2.toFixed(1)}\\text{ }\\mu\\text{g/m}^3$ (Residuo PDE: $${d.pdeResidual.toFixed(4)}\\text{ }\\mu\\text{g/m}^3\\cdot\\text{s}$)
          \\item $\\text{O}_3: ${d.o3.toFixed(1)}\\text{ }\\mu\\text{g/m}^3 \\quad \\text{NO}: ${d.no.toFixed(1)}\\text{ }\\mu\\text{g/m}^3$
          \\item $\\text{PM}_{2.5}: ${d.pm25.toFixed(1)}\\text{ }\\mu\\text{g/m}^3 \\quad \\text{PM}_{10}: ${d.pm10.toFixed(1)}\\text{ }\\mu\\text{g/m}^3$
          \\item $\\text{ClNO}_2\\text{ (Halógenos Bahía)}: ${d.clno2.toFixed(0)}\\text{ pptv}$
        \\end{itemize}
      \\end{block}
    \\end{column}

    % COLUMNA 2: FOTOQUÍMICA, ARBOLADO Y METROLOGÍA
    \\begin{column}{0.48\\textwidth}
      \\begin{block}{\\textbf{3. Fotoquímica de Leighton y Salud Humana}}
        \\small
        \\begin{itemize}
          \\item \\textbf{Ratio de Leighton:} $\\Phi = \\frac{J_{\\text{NO}_2} [\\text{NO}_2]}{k_3(T) [\\text{NO}] [\\text{O}_3]} = \\mathbf{${d.phiLeighton.toFixed(2)}}$
          \\item \\textbf{Dosis Inhalada ICRP-66:} $${d.inhaledNO2UgH.toFixed(1)}\\text{ }\\mu\\text{g NO}_2/\\text{h} \\quad (${d.inhaledPM25UgH.toFixed(1)}\\text{ }\\mu\\text{g PM}_{2.5}/\\text{h})$
          \\item \\textbf{Fito-filtrado (${d.treeCount} árboles):} $-${d.treeNO2AbsorptionGh.toFixed(1)}\\text{ g NO}_2/\\text{h}$
          \\item \\textbf{Enfriamiento Microclimático:} $-${d.treeCoolingC.toFixed(1)}^\\circ\\text{C}$ (Penman-Monteith)
        \\end{itemize}
      \\end{block}

      \\begin{block}{\\textbf{4. Presupuesto de Incertidumbre GUM y FAIR}}
        \\small
        \\begin{itemize}
          \\item \\textbf{Incertidumbre Combinada:} $u_c = ${d.uc.toFixed(2)}\\text{ }\\mu\\text{g/m}^3$
          \\item \\textbf{Incertidumbre Expandida:} $\\mathbf{U = \\pm ${d.expandedU.toFixed(2)}\\text{ }\\mu\\text{g/m}^3} \\quad (k=2, \\, 95\\%)$
          \\item \\textbf{Índice CAQI:} $\\mathbf{${d.caqiScore}/100} \\text{ (${d.caqiLabel})}$
          \\item \\textbf{Estación Referencia:} ${d.officialStation} (${d.stationDistanceKm.toFixed(1)}\\text{ km}$)
        \\end{itemize}
      \\end{block}
    \\end{column}
  \\end{columns}

  \\vfill
  \\tiny \\textcolor{gray}{Directiva 2008/50/CE • Guías OMS 2021 • JCGM 100:2008 GUM • Red Oficial de Calidad del Aire de Málaga}
\\end{frame}`;
}

/**
 * Genera una diapositiva en formato HTML listo para exportar a PowerPoint / Navegador
 */
export function generateStandaloneHtmlSlide(d: DoctoralSlideData): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Slide Doctoral - ${d.streetName} (Málaga)</title>
  <style>
    @page { size: 16in 9in; margin: 0; }
    body {
      margin: 0;
      padding: 30px 45px;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      background: linear-gradient(135deg, #090d16 0%, #0f172a 50%, #06101e 100%);
      color: #f8fafc;
      box-sizing: border-box;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title {
      font-size: 26px;
      font-weight: 800;
      color: #38bdf8;
      margin: 0;
    }
    .subtitle {
      font-size: 14px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .badge-hash {
      font-family: monospace;
      font-size: 11px;
      background: #0369a1;
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 6px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-top: 18px;
      flex: 1;
    }
    .card {
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid #1e293b;
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .card-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #334155;
      padding-bottom: 6px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .card-1 .card-title { color: #38bdf8; }
    .card-2 .card-title { color: #34d399; }
    .card-3 .card-title { color: #f472b6; }
    .card-4 .card-title { color: #fbbf24; }
    .metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 7px;
      font-size: 12px;
    }
    .metric-label { color: #94a3b8; }
    .metric-val { font-weight: 700; font-family: monospace; color: #f1f5f9; }
    .highlight-val {
      font-size: 20px;
      font-weight: 800;
      color: #38bdf8;
      text-align: center;
      background: rgba(2, 132, 199, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 6px;
      padding: 6px;
      margin: 8px 0;
    }
    .footer {
      border-top: 1px solid #1e293b;
      padding-top: 10px;
      font-size: 10px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">Gemelo Digital de Málaga: Dictamen Microescalar</h1>
      <div class="subtitle">📍 ${d.streetName} (${d.districtName}) • ${d.timestampStr} • Asimilación Acoplada ETRS89 / PINN / Leighton</div>
    </div>
    <div class="badge-hash">HASH: ${d.hashSHA256.slice(0, 16)}... (GUM k=2)</div>
  </div>

  <div class="grid">
    <!-- BLOQUE 1: GEODESIA & MORFOLOGÍA -->
    <div class="card card-1">
      <div class="card-title">1. Geodesia & Oke 3D</div>
      <div class="metric-row"><span class="metric-label">Datum Oficial:</span><span class="metric-val">ETRS89 UTM 30N</span></div>
      <div class="metric-row"><span class="metric-label">Coordenadas X, Y:</span><span class="metric-val">${d.utmX.toFixed(0)}, ${d.utmY.toFixed(0)} m</span></div>
      <div class="metric-row"><span class="metric-label">Cota MDE:</span><span class="metric-val">${d.elevationM.toFixed(1)} m</span></div>
      <div class="metric-row"><span class="metric-label">Relación Cañón H/W:</span><span class="metric-val">${d.canyonHW.toFixed(2)}</span></div>
      <div class="metric-row"><span class="metric-label">Sky View Factor:</span><span class="metric-val">${d.svf.toFixed(2)}</span></div>
      <div class="metric-row"><span class="metric-label">Régimen Oke:</span><span class="metric-val" style="color:#c084fc;">${d.okeRegime}</span></div>
      <div class="metric-row"><span class="metric-label">Ventilación ACH:</span><span class="metric-val">${d.ach.toFixed(1)} h⁻¹</span></div>
    </div>

    <!-- BLOQUE 2: CONCENTRACIONES & PINN -->
    <div class="card card-2">
      <div class="card-title">2. Asimilación & PINN</div>
      <div class="metric-row"><span class="metric-label">NO₂ Real (1.8m AGL):</span><span class="metric-val" style="color:#38bdf8;">${d.realNO2.toFixed(1)} µg/m³</span></div>
      <div class="metric-row"><span class="metric-label">NO₂ PINN Operator:</span><span class="metric-val" style="color:#34d399;">${d.pinnNO2.toFixed(1)} µg/m³</span></div>
      <div class="metric-row"><span class="metric-label">Discrepancia Δ (Residuo):</span><span class="metric-val">${d.deltaNO2 >= 0 ? `+${d.deltaNO2.toFixed(1)}` : d.deltaNO2.toFixed(1)} (${d.pdeResidual.toFixed(4)})</span></div>
      <div class="metric-row"><span class="metric-label">Ozono O₃ Troposférico:</span><span class="metric-val">${d.o3.toFixed(1)} µg/m³</span></div>
      <div class="metric-row"><span class="metric-label">Partículas PM₂.₅ / PM₁₀:</span><span class="metric-val">${d.pm25.toFixed(1)} / ${d.pm10.toFixed(1)} µg/m³</span></div>
      <div class="metric-row"><span class="metric-label">Monóxido NO primario:</span><span class="metric-val">${d.no.toFixed(1)} µg/m³</span></div>
      <div class="metric-row"><span class="metric-label">Halógeno ClNO₂ Marino:</span><span class="metric-val">${d.clno2.toFixed(0)} pptv</span></div>
    </div>

    <!-- BLOQUE 3: FOTOQUÍMICA & ARBOLADO -->
    <div class="card card-3">
      <div class="card-title">3. Fotoquímica & Salud</div>
      <div class="metric-row"><span class="metric-label">Ratio Leighton Φ:</span><span class="metric-val" style="color:#2dd4bf;">${d.phiLeighton.toFixed(2)} (Equilibrio)</span></div>
      <div class="metric-row"><span class="metric-label">Dosis Inhalada NO₂:</span><span class="metric-val" style="color:#f43f5e;">${d.inhaledNO2UgH.toFixed(1)} µg/h</span></div>
      <div class="metric-row"><span class="metric-label">Dosis Inhalada PM₂.₅:</span><span class="metric-val">${d.inhaledPM25UgH.toFixed(1)} µg/h</span></div>
      <div class="metric-row"><span class="metric-label">Censo Arbóreo:</span><span class="metric-val">${d.treeCount} árboles</span></div>
      <div class="metric-row"><span class="metric-label">Especie Predominante:</span><span class="metric-val">${d.treeSpecies}</span></div>
      <div class="metric-row"><span class="metric-label">Fito-filtrado NO₂:</span><span class="metric-val" style="color:#4ade80;">-${d.treeNO2AbsorptionGh.toFixed(1)} g/h</span></div>
      <div class="metric-row"><span class="metric-label">Enfriamiento Bioclimático:</span><span class="metric-val">-${d.treeCoolingC.toFixed(1)} °C</span></div>
    </div>

    <!-- BLOQUE 4: INCERTIDUMBRE GUM & METROLOGÍA -->
    <div class="card card-4">
      <div class="card-title">4. Metrología GUM & FAIR</div>
      <div class="highlight-val">U = ±${d.expandedU.toFixed(2)} µg/m³ (k=2)</div>
      <div class="metric-row"><span class="metric-label">Incertidumbre uc:</span><span class="metric-val">${d.uc.toFixed(2)} µg/m³</span></div>
      <div class="metric-row"><span class="metric-label">Índice CAQI Europeo:</span><span class="metric-val" style="color:#fbbf24;">${d.caqiScore}/100 (${d.caqiLabel})</span></div>
      <div class="metric-row"><span class="metric-label">Estación Oficial:</span><span class="metric-val">${d.officialStation}</span></div>
      <div class="metric-row"><span class="metric-label">Distancia Estación:</span><span class="metric-val">${d.stationDistanceKm.toFixed(1)} km</span></div>
      <div class="metric-row"><span class="metric-label">Normativa:</span><span class="metric-val">Directiva 2008/50/CE</span></div>
      <div class="metric-row"><span class="metric-label">Guías Sanitarias:</span><span class="metric-val">OMS 2021 / ICRP-66</span></div>
    </div>
  </div>

  <div class="footer">
    <span>Tesis Doctoral: Modelización de Calidad del Aire a Microescala mediante Gemelos Digitales e Inteligencia Artificial en Málaga</span>
    <span>Metodología FAIRMODE WG1 • Guía EMEP/EEA 2023 • JCGM 100:2008 GUM</span>
  </div>
</body>
</html>`;
}
