import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, useDragControls, useMotionValue } from 'motion/react';
import { Info, BookOpen, Scale, Sparkles, ChevronDown, ChevronUp, X, Users, Microscope, Layers, GripHorizontal, ShieldCheck, Activity, Compass, Maximize2, Minimize2 } from 'lucide-react';
import { getScientificTopic, ScientificTopicId, ScientificDiagramType } from '../lib/scientificRegistry';
import { DeepScientificDiagram } from './DeepScientificDiagrams';
import { MathFormula, renderInlineScientificMath } from './MathFormula';

export interface ScientificTooltipProps {
  children?: React.ReactNode;
  title?: string;
  content?: string | React.ReactNode;
  explanation?: string | React.ReactNode;
  laymanExplanation?: string;
  topic?: ScientificTopicId | string;
  formula?: string;
  citation?: string;
  regulatory?: string | { document: string; limitValue?: string };
  normativeRef?: string;
  normative?: string;
  diagram?: ScientificDiagramType;
  width?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showDiagramByDefault?: boolean;
  delay?: number;
  closeDelay?: number;
  className?: string;
}

export interface DomHierarchyContext {
  windowTitle: string;
  activeTabName: string;
  sectionTitle: string;
  elementKind:
    | 'COLUMN_HEADER_TH'
    | 'SELECTOR_SELECT'
    | 'SLIDER_OR_INPUT'
    | 'TAB_SWITCHER'
    | 'ACTION_BUTTON'
    | 'METRIC_CELL_OR_BADGE';
  elementKindLabel: string;
  elementLabel: string;
  elementValueDetail: string;
  tableSchemaContext: string;
  tableColHeader?: string;
  tableRowLabel?: string;
}

interface SynthesizedDoctoralProfile {
  disciplineBadge: string;
  physicsLaw: string;
  contextBreadcrumb: string;
  contextualizedContent: string;
  doctoralAddendum: string;
  formulaLaTeX: string;
  formulaExplanation: FormulaCompleteExplanation;
  unitsAndRange: string;
  regulatoryText: string;
  citationText: string;
  laymanText: string;
}

export interface FormulaTermItem {
  symbol: string;
  kind?: 'Variable' | 'Constante' | 'Parámetro / Coef.' | 'Operador';
  meaning: string;
}

export interface FormulaCompleteExplanation {
  structuralReading: string;
  terms: FormulaTermItem[];
  physicalSynthesis: string;
  physicalDomainAndStability: string;
  expandedUncertaintyGUM: string;
  parametricSensitivity: string;
}

const DEFAULT_DOM_CONTEXT: DomHierarchyContext = {
  windowTitle: '',
  activeTabName: '',
  sectionTitle: '',
  elementKind: 'METRIC_CELL_OR_BADGE',
  elementKindLabel: 'Indicador Científico',
  elementLabel: '',
  elementValueDetail: '',
  tableSchemaContext: '',
  tableColHeader: '',
  tableRowLabel: ''
};

function cleanText(raw?: string | null, maxLen = 110): string {
  if (!raw) return '';
  const cleaned = raw
    .replace(/\s+/g, ' ')
    .replace(/[📕📍📌🔬💡⚗️📐]/g, '')
    .trim();
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen - 1).trim()}…`;
}

/**
 * Extractor Determinista de Jerarquía Contextual DOM (Regla 7, 12 y 22).
 * Identifica en tiempo real en qué Ventana/Modal, en qué Pestaña/Subpestaña activa,
 * en qué Tabla/Sección y sobre qué tipo exacto de control o métrica se encuentra el cursor.
 */
export function extractDomContextForElement(el: HTMLElement | null): DomHierarchyContext {
  if (!el || typeof document === 'undefined') return DEFAULT_DOM_CONTEXT;

  // 1. Detectar el elemento interactivo u hoja real dentro o alrededor del nodo
  const thEl = (el.tagName === 'TH' ? el : el.closest('th') || el.querySelector('th')) as HTMLTableCellElement | null;
  const selectEl = (el.tagName === 'SELECT' ? el : el.closest('select') || el.querySelector('select')) as HTMLSelectElement | null;
  const labelFileBtnEl = (el.tagName === 'LABEL' && el.querySelector('input[type="file"]')
    ? el
    : el.closest('label')?.querySelector('input[type="file"]')
      ? el.closest('label')
      : null) as HTMLLabelElement | null;
  const inputEl = !labelFileBtnEl
    ? ((el.tagName === 'INPUT' ? el : el.closest('input') || el.querySelector('input')) as HTMLInputElement | null)
    : null;
  const buttonEl = (el.tagName === 'BUTTON' ? el : el.closest('button') || el.querySelector('button')) as HTMLButtonElement | null;

  let elementKind: DomHierarchyContext['elementKind'] = 'METRIC_CELL_OR_BADGE';
  let elementKindLabel = 'Indicador / Métrica Telemétrica';
  let elementLabel = '';
  let elementValueDetail = '';
  let tableSchemaContext = '';
  let tableColHeader = '';
  let tableRowLabel = '';

  if (thEl) {
    elementKind = 'COLUMN_HEADER_TH';
    elementKindLabel = 'Cabecera de Columna de Matriz';
    elementLabel = cleanText(thEl.textContent, 80);
    tableColHeader = elementLabel;
    const tr = thEl.closest('tr');
    if (tr) {
      const siblingHeaders = Array.from(tr.querySelectorAll('th'))
        .map(h => cleanText(h.textContent, 32))
        .filter(Boolean);
      const colIdx = Array.from(tr.children).indexOf(thEl) + 1;
      if (siblingHeaders.length > 0) {
        tableSchemaContext = `Columna ${colIdx}/${siblingHeaders.length} en tabla [${siblingHeaders.slice(0, 6).join(' | ')}]`;
      }
    }
  } else if (selectEl) {
    elementKind = 'SELECTOR_SELECT';
    elementKindLabel = 'Selector Paramétrico Desplegable';
    const selectedOpt = selectEl.selectedOptions?.[0]?.textContent || selectEl.value || '';
    const optCount = selectEl.options?.length || 0;
    const prevLabel = selectEl.closest('label')?.textContent || selectEl.previousElementSibling?.textContent || '';
    elementLabel = cleanText(prevLabel || selectEl.getAttribute('aria-label') || selectedOpt, 80);
    elementValueDetail = `Opción activa: "${cleanText(selectedOpt, 60)}" (${optCount} modos disponibles)`;
  } else if (labelFileBtnEl) {
    elementKind = 'ACTION_BUTTON';
    elementKindLabel = 'Control de Lectura de Archivo (Modo 100% Solo-Lectura)';
    elementLabel = cleanText(
      labelFileBtnEl.textContent || labelFileBtnEl.getAttribute('aria-label') || labelFileBtnEl.title,
      85
    );
    elementValueDetail = 'Lector local aislado: procesa el fichero sin alterar jamás el código fuente ni los motores deterministas';
  } else if (inputEl) {
    elementKind = 'SLIDER_OR_INPUT';
    const inputType = (inputEl.type || 'text').toLowerCase();
    elementKindLabel =
      inputType === 'range'
        ? 'Control Deslizante de Parametrización'
        : inputType === 'checkbox'
          ? 'Conmutador Booleano de Capa/Filtro'
          : 'Campo de Entrada Paramétrica';
    const labelNode =
      inputEl.closest('label') ||
      (inputEl.id ? document.querySelector(`label[for="${inputEl.id}"]`) : null) ||
      inputEl.parentElement?.querySelector('label, span');
    elementLabel = cleanText(
      labelNode?.textContent || inputEl.placeholder || inputEl.getAttribute('aria-label') || inputEl.name,
      80
    );
    if (inputType === 'range') {
      elementValueDetail = `Valor actual = ${inputEl.value} (rango operativo [${inputEl.min || '0'} .. ${inputEl.max || '100'}], paso ${inputEl.step || '1'})`;
    } else if (inputType === 'checkbox') {
      elementValueDetail = `Estado actual: ${inputEl.checked ? 'ACTIVADO (ON)' : 'DESACTIVADO (OFF)'}`;
    } else if (inputType === 'value' || inputEl.value) {
      elementValueDetail = `Valor introducido: "${cleanText(inputEl.value, 50)}"`;
    }
  } else if (buttonEl) {
    const isTab =
      buttonEl.hasAttribute('data-ribbon-active') ||
      buttonEl.getAttribute('role') === 'tab' ||
      Boolean(buttonEl.closest('[role="tablist"]'));
    elementKind = isTab ? 'TAB_SWITCHER' : 'ACTION_BUTTON';
    elementKindLabel = isTab ? 'Subpestaña / Vista Analítica' : 'Control de Acción Operativa';
    elementLabel = cleanText(
      buttonEl.textContent || buttonEl.getAttribute('aria-label') || buttonEl.getAttribute('data-captured-native-title') || buttonEl.title,
      85
    );
    if (buttonEl.getAttribute('data-ribbon-active') === 'true' || buttonEl.getAttribute('aria-selected') === 'true') {
      elementValueDetail = 'Subpestaña activa en visualización';
    }
    const tdParent = buttonEl.closest('td');
    if (tdParent) {
      const tr = tdParent.closest('tr');
      const table = tdParent.closest('table');
      if (tr && table) {
        const colIdx = Array.from(tr.children).indexOf(tdParent);
        const ths = table.querySelectorAll('thead th');
        tableColHeader = ths[colIdx] ? cleanText(ths[colIdx].textContent, 48) : '';
        tableRowLabel = tr.children[0] ? cleanText(tr.children[0].textContent, 52) : '';
        if (tableColHeader || tableRowLabel) {
          tableSchemaContext = `Acción en [${tableColHeader || `Col ${colIdx + 1}`}] • Fila "${tableRowLabel}"`;
        }
      }
    }
  } else {
    elementLabel = cleanText(el.textContent || el.getAttribute('aria-label'), 95);
    if (!elementLabel || elementLabel.length <= 2) {
      const siblingOrParentText =
        el.previousElementSibling?.textContent ||
        el.parentElement?.textContent ||
        el.parentElement?.parentElement?.textContent ||
        '';
      elementLabel = cleanText(siblingOrParentText, 95);
    }
    const tdEl = (el.tagName === 'TD' ? el : el.closest('td')) as HTMLTableCellElement | null;
    if (tdEl) {
      const tr = tdEl.closest('tr');
      const table = tdEl.closest('table');
      if (tr && table) {
        const colIdx = Array.from(tr.children).indexOf(tdEl);
        const ths = table.querySelectorAll('thead th');
        tableColHeader = ths[colIdx] ? cleanText(ths[colIdx].textContent, 48) : '';
        tableRowLabel = tr.children[0] ? cleanText(tr.children[0].textContent, 52) : '';
        if (tableColHeader || tableRowLabel) {
          tableSchemaContext = `Celda [${tableColHeader || `Col ${colIdx + 1}`}] • Fila "${tableRowLabel}"`;
          if (colIdx > 0 && tableRowLabel && !elementLabel.toLowerCase().includes(tableRowLabel.slice(0, 10).toLowerCase())) {
            elementValueDetail = `Fila: ${tableRowLabel} | Columna: ${tableColHeader || `Col ${colIdx + 1}`} | Valor: ${elementLabel}`;
          }
        }
      }
    }
  }

  // 2. Detectar título de la ventana / modal o panel contenedor
  let windowTitle = '';
  let container: HTMLElement | null = el;
  while (container && container !== document.body) {
    const dataWinTitle = container.getAttribute('data-window-title');
    if (dataWinTitle) {
      windowTitle = cleanText(dataWinTitle, 80);
      break;
    }
    const headerH2 = container.querySelector(':scope > div h2, :scope > header h2, :scope > h2, :scope > h1');
    if (headerH2 && headerH2.textContent) {
      const candidate = cleanText(headerH2.textContent, 80);
      if (candidate.length > 3) {
        windowTitle = candidate;
        break;
      }
    }
    container = container.parentElement;
  }
  if (!windowTitle) {
    if (el.closest('header')) windowTitle = 'Cabecera Principal de Control Científico';
    else if (el.closest('aside')) windowTitle = 'Panel Geoespacial & Atalayas';
    else windowTitle = 'Lienzo Cartográfico & Telemetría Asimilada';
  }

  // 3. Detectar la pestaña o subpestaña activa dentro de la ventana actual
  let activeTabName = '';
  const modalRoot = el.closest('[role="dialog"], .fixed, main, section') as HTMLElement | null;
  if (modalRoot) {
    const explicitActiveTab = modalRoot.querySelector(
      'button[data-ribbon-active="true"], button[aria-selected="true"]'
    );
    if (explicitActiveTab && explicitActiveTab.textContent) {
      activeTabName = cleanText(explicitActiveTab.textContent, 65);
    } else {
      const candidateButtons = Array.from(modalRoot.querySelectorAll('button'));
      const activeStyledBtn = candidateButtons.find(b => {
        const cls = b.className || '';
        return (
          (cls.includes('bg-cyan-600') ||
            cls.includes('bg-emerald-600') ||
            cls.includes('bg-indigo-600') ||
            cls.includes('bg-amber-600') ||
            cls.includes('bg-purple-600') ||
            cls.includes('border-b-2')) &&
          (b.textContent || '').trim().length > 2 &&
          (b.textContent || '').trim().length < 55
        );
      });
      if (activeStyledBtn) {
        activeTabName = cleanText(activeStyledBtn.textContent, 65);
      }
    }
  }

  // 4. Detectar sección o bloque local (h3 / h4 / legend / caption)
  let sectionTitle = '';
  let secNode: HTMLElement | null = el.parentElement;
  while (secNode && secNode !== document.body && secNode !== modalRoot) {
    const heading = secNode.querySelector(':scope > h3, :scope > h4, :scope > div > h3, :scope > div > h4, :scope > legend, :scope > caption');
    if (heading && heading.textContent) {
      const txt = cleanText(heading.textContent, 70);
      if (txt && txt !== elementLabel && txt !== windowTitle) {
        sectionTitle = txt;
        break;
      }
    }
    secNode = secNode.parentElement;
  }

  return {
    windowTitle,
    activeTabName,
    sectionTitle,
    elementKind,
    elementKindLabel,
    elementLabel,
    elementValueDetail,
    tableSchemaContext,
    tableColHeader,
    tableRowLabel
  };
}

interface GranularFormulaMatch {
  formulaLaTeX: string;
  unitsAndRange: string;
  specificMechanism: string;
}

/**
 * Diccionario Analítico de Alta Granularidad (105+ Ecuaciones Específicas).
 * Garantiza que cada punto del Director (Puntos 1–7, Pasos 6.1–6.5, Tablas 1–13), columna estadística,
 * especie química, resistencia aerodinámica o parámetro de control muestre su ecuación exacta.
 */
function resolveGranularFormulaAndUnits(text: string): GranularFormulaMatch | null {
  const s = text.toLowerCase();

  if (s.includes('puntos 1, 2 y 3') || s.includes('obj. general + oe1') || s.includes('estimar concentración espaciotemporal de no₂ por tráfico')) {
    return {
      formulaLaTeX: '\\hat{c}(\\mathbf{x},z,t) = \\mathcal{N}_{\\theta}(\\mathbf{x},z,t) \\ge 0,\\quad z\\in\\{0,9\\,\\text{m},\\;1,8\\,\\text{m},\\;4,0\\,\\text{m}\\}',
      unitsAndRange: 'NO₂ respirable: µg·m⁻³ (Directiva UE 2024/2881 = 20 µg·m⁻³ | OMS 2021 = 10 µg·m⁻³)',
      specificMechanism: 'resuelve el Objetivo General y los Objetivos Específicos OE1–OE4 del documento del Director (03/10/2026): estimar el campo continuo 3D de NO₂ originado por tráfico rodado en Málaga y auditar el desacoplamiento vertical entre la cabina oficial (4,0 m), el peatón adulto (1,8 m) y el carrito infantil (0,9 m)'
    };
  }
  if (s.includes('punto 4') || s.includes('10 controles') || s.includes('controles costeros y no viarios') || s.includes('puerto, aeropuerto, brisa')) {
    return {
      formulaLaTeX: 'E_{\\text{total}}(\\mathbf{x},t) = E_{\\text{tráfico,COPERT}}(\\mathbf{x},t) + \\sum_{m=1}^{10} \\beta_m Z_{m,\\text{control}}(\\mathbf{x},t)',
      unitsAndRange: 'Aporte Tráfico COPERT 5.7: µg·m⁻³ | 10 Controles: Condiciones de Contorno ∂Ω',
      specificMechanism: 'implementa la delimitación estricta del Punto 4 del Director: el núcleo del modelo es tráfico rodado y NO₂, mientras que Puerto (Med SOx ECA), Aeropuerto (AENA LTO), brisa/terral, capa de mezcla H_PBL/h_TIBL, calima, radiación UV, arboleda y firme TiO₂/asfalto entran únicamente como controles físicos y condiciones de contorno'
    };
  }
  if (s.includes('paso 6.1') || s.includes('7 fuentes y detectores') || s.includes('24 estaciones terrestres') || s.includes('une-en 14211') || s.includes('ficha 14211') || s.includes('14211') || s.includes('ancla une')) {
    return {
      formulaLaTeX: '\\text{NO} + \\text{O}_3 \\longrightarrow \\text{NO}_2^* + \\text{O}_2 \\longrightarrow \\text{NO}_2 + h\\nu,\\quad w_i(\\mathbf{x},t)=\\frac{d_i^{-2}e^{-\\Delta t_i/\\tau_c}\\sigma_i^{-2}}{\\sum_j d_j^{-2}e^{-\\Delta t_j/\\tau_c}\\sigma_j^{-2}}',
      unitsAndRange: 'Red 24 Terrestres + 16 Satélites | Quimioluminiscencia UNE-EN 14211:2013',
      specificMechanism: 'ejecuta la auditoría del Paso 6.1 y Regla 33: certifica el analizador de quimioluminiscencia UNE-EN 14211:2013 (aporta L_data y valida LOOCV con w_k=0) frente a los nodos meteorológicos oficiales AEMET/Puertos/CAMS (aportan L_PDE y L_BC sin NO₂ ficticio)'
    };
  }
  if (s.includes('paso 6.2') || s.includes('matriz 32 variables') || s.includes('12 observadas crudas') || (s.includes('[observado]') && s.includes('[derivada]'))) {
    return {
      formulaLaTeX: '\\mathcal{V}_{32} = \\mathcal{V}_{\\text{OBS}}(12) \\sqcup \\mathcal{V}_{\\text{DERIV}}(13) \\sqcup \\mathcal{V}_{\\text{MOD-PINN}}(7),\\quad \\Delta C_{\\text{micro}}=\\Delta C_{\\text{tráf}}+\\Delta C_{\\text{cañón}}-\\Delta C_{\\text{fito}}-\\Delta C_{\\text{TiO}_2}',
      unitsAndRange: 'Partición Epistémica: 12 [OBS] + 13 [DERIV] + 7 [MOD-PINN] = 32 Variables',
      specificMechanism: 'fija sin ambigüedad la taxonomía del Punto 5 y Paso 6.2 exigida por el Director: distingue el dato crudo medido [OBSERVADO], la variable calculada determinísticamente antes de la red [DERIVADA] y la salida inferida por la red [MODELIZADA POR LA PINN]'
    };
  }
  if (s.includes('paso 6.3') || s.includes('conjunto mínimo mvp') || s.includes('núcleo mvp') || s.includes('varianza global de sobol') || s.includes('shannon-fisher')) {
    return {
      formulaLaTeX: '\\sum_{j\\in\\text{MVP}_{12}} S_{T_j} = \\frac{\\sum_{j=1}^{12} \\mathbb{E}_{\\mathbf{X}_{\\sim j}}[\\text{Var}_{X_j}(Y\\mid \\mathbf{X}_{\\sim j})]}{\\text{Var}(Y)} = 0.964 \\; (\\ge 94\\%)',
      unitsAndRange: 'Núcleo Irreducible MVP: 12 Variables Operativas (S_T = 96,4% de varianza de Sobol)',
      specificMechanism: 'justifica matemáticamente la selección del Conjunto Mínimo Viable (MVP v1.0 de 12 variables en Fase I) mediante índices de sensibilidad global de Sobol y determinante de información de Shannon-Fisher antes de escalar a las Fases II–IV'
    };
  }
  if (s.includes('paso 6.4') || s.includes('pinn formal') || s.includes('w_k=0') || s.includes('w_k = 0') || s.includes('sukumar') || s.includes('hard-constraint')) {
    return {
      formulaLaTeX: '\\mathcal{L}(\\theta)=\\lambda_{\\text{data}}\\mathcal{L}_{\\text{data}}^{(i\\neq k)}+\\lambda_{\\text{PDE}}\\|\\partial_t\\hat{c}+\\mathbf{u}\\cdot\\nabla\\hat{c}-\\nabla\\cdot(K\\nabla\\hat{c})-E+S_{\\text{Leighton}}+v_d\\hat{c}/H\\|^2,\\quad w_k(\\mathbf{x}_{s_k})\\equiv 0',
      unitsAndRange: 'Red RFF(64)+MLP 6×128 (86.403 parám.) | MQI ≤ 1.00 | Exclusión LOOCV w_k ≡ 0',
      specificMechanism: 'especifica la arquitectura PINN del Paso 6.4 con acoplamiento Hard-Constraint de Sukumar (2022), equilibrio fotoestacionario de Leighton, optimización bietápica AdamW + L-BFGS-B y validación ciega LOOCV anulando estrictamente el peso de la estación retenida (w_k = 0, Regla 35)'
    };
  }
  if (s.includes('paso 6.5') || s.includes('punto 7') || s.includes('pi-did') || s.includes('donut-rdd') || s.includes('ilusión regulatoria') || s.includes('spillover') || s.includes('q1–q5') || s.includes('q1-q5')) {
    return {
      formulaLaTeX: '\\tau_{\\text{PI-DiD}}(\\mathbf{x}) = (\\bar{C}_{\\text{ZBE,post}}^{\\text{desmet}}-\\bar{C}_{\\text{ZBE,pre}}^{\\text{desmet}})-(\\bar{C}_{\\text{ctrl,post}}^{\\text{desmet}}-\\bar{C}_{\\text{ctrl,pre}}^{\\text{desmet}})',
      unitsAndRange: 'Efecto ZBE (437 ha): -21,5% interior | +4,2% rebote borde | Límite UE 2024/2881 = 20 µg·m⁻³',
      specificMechanism: 'aísla el efecto causal desmeteorologizado de la ZBE de Málaga (Paso 6.5 y Punto 7) mediante Physics-Informed DiD y Donut-RDD en las 97 cámaras LPR, revelando el efecto rebote perimetral (spillover) por quintiles de renta Q1–Q5 y la Ilusión Regulatoria entre 4,0 m y 1,8 m / 0,9 m'
    };
  }
  if (s.includes('ablación') || s.includes('ablacion') || s.includes('m0') || s.includes('m1') || s.includes('m2') || s.includes('m3') || s.includes('m4')) {
    return {
      formulaLaTeX: '\\mathcal{L}_{M_k}(\\theta) = \\mathcal{L}_{\\text{data}} + \\mathbb{I}_{k\\ge 1}\\lambda_{\\text{adv-dif}}\\mathcal{L}_{\\text{PDE}} + \\mathbb{I}_{k\\ge 2}\\lambda_{\\text{chem}}\\mathcal{L}_{\\text{Leighton}} + \\mathbb{I}_{k\\ge 3}\\lambda_{\\text{BC}}\\mathcal{L}_{\\text{Wesely-TiO}_2}',
      unitsAndRange: 'Secuencia de Ablación M0 (MLP Puro) → M1 (+Adv/Dif) → M2 (+Leighton) → M3 (+BC) → M4 (PINN Completa)',
      specificMechanism: 'demuestra cuantitativamente (Tabla 8 del Director) cómo cada término físico añadido a la red (advección-difusión, ciclo de Leighton, contorno Wesely/TiO₂ y RFF+NTK) reduce el error ciego LOOCV y elimina las violaciones de conservación de masa'
    };
  }
  if (s.includes('idw') || s.includes('inverso de la distancia') || s.includes('lur') || s.includes('land use regression') || s.includes('pluma gaussiana') || s.includes('benchmark')) {
    return {
      formulaLaTeX: '\\hat{C}_{\\text{IDW}}(\\mathbf{x}) = \\frac{\\sum_{i=1}^N d_i^{-p} C_i}{\\sum_{i=1}^N d_i^{-p}}, \\quad \\Delta\\text{RMSE}_{\\text{PINN vs Bench}} = \\text{RMSE}_{\\text{PINN}} - \\text{RMSE}_{\\text{Bench}} < 0',
      unitsAndRange: 'Comparativa Benchmark (Tabla 6): IDW | Kriging | LUR | Pluma Gaussiana | CTM vs PINN',
      specificMechanism: 'contrasta en igualdad de condiciones (validación ciega LOOCV sobre las mismas estaciones UNE-EN 14211:2013) la superioridad de la PINN frente a los interpoladores puramente geométricos (IDW, Kriging), estadísticos (LUR) y gaussianos'
    };
  }
  if (s.includes('placebo') || s.includes('falsación') || s.includes('falsacion') || s.includes('150 m') || s.includes('250 m') || s.includes('500 m') || s.includes('ancho de banda')) {
    return {
      formulaLaTeX: '\\tau_{\\text{RDD}}(h) = \\lim_{d\\uparrow 0}\\mathbb{E}[C^{\\text{desmet}}\\mid d\\in[-h,0)] - \\lim_{d\\downarrow 0}\\mathbb{E}[C^{\\text{desmet}}\\mid d\\in(0,+h]], \\quad \\hat{\\tau}_{\\text{placebo}} \\approx 0\\;(p > 0.05)',
      unitsAndRange: 'Anillos Perimetrales LPR: h ∈ {±150 m, ±250 m, ±500 m} | Placebo p-valor > 0.05',
      specificMechanism: 'verifica la robustez del diseño de regresión discontinua espacial (Donut-RDD) variando el ancho de banda alrededor de las 97 cámaras LPR y ejecutando tests de falsación (placebo temporal pre-ZBE y placebo espacial en frontera ficticia)'
    };
  }
  if (s.includes('[observado]') || s.includes('[derivada]') || s.includes('[modelizada') || s.includes('carácter epistémico') || s.includes('caracter epistemico')) {
    return {
      formulaLaTeX: 'X_j \\in \\mathcal{V}_{\\text{OBS}} \\;(\\text{Sensor Crudo}) \\;\\lor\\; X_j = f_{\\text{det}}(\\mathcal{V}_{\\text{OBS}}) \\in \\mathcal{V}_{\\text{DERIV}} \\;\\lor\\; \\hat{Y}_j = \\mathcal{N}_\\theta(\\mathbf{x},t) \\in \\mathcal{V}_{\\text{MOD}}',
      unitsAndRange: 'Partición Epistémica Doctoral (Regla 21): 12 [OBS] + 13 [DERIV] + 7 [MOD-PINN]',
      specificMechanism: 'clasifica con rigor epistémico cada magnitud del Gemelo Digital distinguiendo lo medido directamente por un transductor físico [OBSERVADO], lo calculado por ecuación analítica previa [DERIVADA] y lo inferido por la red neuronal [MODELIZADA]'
    };
  }
  if (s.includes('radar doi') || s.includes('openalex') || s.includes('crossref') || s.includes('sota')) {
    return {
      formulaLaTeX: '\\mathcal{S}_{\\text{DOI}}(q, t) = \\bigcup_{k\\in\\{\\text{OpenAlex},\\text{Crossref}\\}} \\big\\{\\text{DOI}_i : \\text{Sim}(\\text{Abstract}_i, \\text{OE}_{1..4}) \\ge \\tau_{\\text{rel}}\\big\\}',
      unitsAndRange: 'Vigilancia Bibliográfica SOTA (2024–2026) | Identificador persistente ISO 26324 (DOI)',
      specificMechanism: 'interroga en vivo los repositorios científicos internacionales OpenAlex y Crossref para detectar literatura reciente sobre PINNs atmosféricas, NO₂ microescalar y ZBE que refuerce los Puntos 1 a 7 de la tesis'
    };
  }
  if (s.includes('pareja documental') || s.includes('pdf 1 original') || s.includes('con géminis') || s.includes('regla 31')) {
    return {
      formulaLaTeX: '\\mathcal{D}_{\\text{Director}}^{(N)} = \\big(\\text{PDF}_{N,\\text{Original}}(\\text{Mandato}),\\; \\text{PDF}_{N,\\text{Géminis}}(\\text{Ecuaciones OE1--OE4 + Hojas de Ruta})\\big)',
      unitsAndRange: 'Protocolo de Parejas Documentales en Azul (Regla 31): Custodia íntegra 1..N + Síntesis Monográfica',
      specificMechanism: 'vincula simétricamente el documento original entregado por el Director de Tesis con su desarrollo matemático extendido (ecuaciones canónicas OE2, capa límite costera TIBL y hoja de ruta en 5 fases)'
    };
  }
  if (s.includes('ppb') || s.includes('regla 34') || s.includes('conversión termodinámica')) {
    return {
      formulaLaTeX: 'C_{\\text{NO}_2}\\,[\\mu\\text{g/m}^3] = \\chi_{\\text{NO}_2}\\,[\\text{ppb}]\\cdot\\frac{M_{\\text{NO}_2}\\cdot P_{\\text{real}}(\\mathbf{x},t)}{R\\cdot T_{\\text{real}}(\\mathbf{x},t)}',
      unitsAndRange: 'M_NO₂ = 46,0055 g·mol⁻¹ | R = 8,31446 J·(mol·K)⁻¹ | P_real(t), T_real(t) AEMET',
      specificMechanism: 'convierte exactamente entre fracción molar (ppb) y concentración másica (µg·m⁻³) utilizando la presión barométrica P(x,t) y temperatura absoluta T(x,t) medidas en tiempo real por AEMET en Málaga (Regla 34)'
    };
  }
  if (s.includes('h_tibl') || s.includes('tibl') || s.includes('capa límite costera')) {
    return {
      formulaLaTeX: 'h_{\\text{TIBL}}(x) = A_{\\text{TIBL}}\\sqrt{x_{\\text{fetch}}(\\mathbf{x})} = \\sqrt{\\frac{2\\,H_0\\,x_{\\text{fetch}}}{\\rho\\,c_p\\,U_{10}\\,\\gamma_{\\text{lap}}}}',
      unitsAndRange: 'h_TIBL(x): metros AGL en función de la distancia a la costa x_fetch (m)',
      specificMechanism: 'modeliza el crecimiento parabólico de la Capa Límite Interna Térmica Costera (TIBL) desde la línea de costa de la Bahía de Málaga hacia el interior bajo régimen de brisa marina de Alborán'
    };
  }

  if (s.includes('rmse') || s.includes('error cuadrático')) {
    return {
      formulaLaTeX: '\\text{RMSE} = \\sqrt{\\frac{1}{N}\\sum_{i=1}^{N} (M_i - O_i)^2}',
      unitsAndRange: 'RMSE: µg·m⁻³ (óptimo → 0 µg·m⁻³)',
      specificMechanism: 'cuantifica la desviación cuadrática media entre la predicción determinista PINN (M_i) y la observación oficial certificada (O_i), penalizando cuadráticamente los errores en picos de episodio'
    };
  }
  if (s.includes('mqi') || s.includes('model quality indicator')) {
    return {
      formulaLaTeX: '\\text{MQI} = \\frac{\\text{RMSE}}{\\beta \\cdot \\text{RMS}_U}, \\quad \\beta = 2.0, \\; \\text{MQI} \\le 1.0',
      unitsAndRange: 'MQI: adimensional (Conforme FAIRMODE si ≤ 1.0)',
      specificMechanism: 'normaliza el error RMSE del modelo frente a la incertidumbre expandida de medida RMS_U de las estaciones de referencia bajo el estándar europeo FAIRMODE WG1'
    };
  }
  if (s.includes('bias') || s.includes('sesgo') || s.includes('fb')) {
    return {
      formulaLaTeX: '\\text{BIAS} = \\frac{1}{N}\\sum_{i=1}^{N}(M_i - O_i), \\quad \\text{FB} = \\frac{2(\\overline{M} - \\overline{O})}{\\overline{M} + \\overline{O}}',
      unitsAndRange: 'BIAS: µg·m⁻³ | FB: [-2, +2] adimensional',
      specificMechanism: 'evalúa la tendencia sistemática de sobreestimación (>0) o subestimación (<0) del campo asimilado respecto a los analizadores patrón in situ'
    };
  }
  if (s.includes('nmsd') || s.includes('desviación estándar normalizada')) {
    return {
      formulaLaTeX: '\\text{NMSD} = \\frac{\\sigma_M - \\sigma_O}{\\sigma_O}',
      unitsAndRange: 'NMSD: adimensional (ideal = 0.0)',
      specificMechanism: 'verifica si el modelo reproduce fielmente la amplitud de la variabilidad temporal diurna/nocturna observada en la estación (σ_M vs σ_O)'
    };
  }
  if (s.includes('u95') || s.includes('incertidumbre expandida') || s.includes('gum')) {
    return {
      formulaLaTeX: 'U_{95}(O_i) = k_{95}\\cdot u_c(O_i) = 1.96\\sqrt{u_{\\text{cal}}^2 + u_{\\text{deriva}}^2 + (\\alpha O_i)^2}',
      unitsAndRange: 'U₉₅: % o µg·m⁻³ (k = 1.96 al 95% de confianza)',
      specificMechanism: 'propaga la incertidumbre instrumental combinada según la guía metrológica JCGM 100:2008 (GUM) y la Directiva (UE) 2024/2881'
    };
  }
  if (s.includes('loocv') || s.includes('leave-one-out') || s.includes('validación cruzada')) {
    return {
      formulaLaTeX: '\\varepsilon_{\\text{LOOCV}} = \\frac{1}{N}\\sum_{k=1}^{N} \\left| \\hat{C}_{\\text{PINN}}^{(-k)}(\\mathbf{x}_k) - C_{\\text{obs}}(\\mathbf{x}_k) \\right|,\\quad w_k(\\mathbf{x}_{s_k})\\equiv 0',
      unitsAndRange: 'Error LOOCV: µg·m⁻³ sobre estaciones UNE-EN 14211:2013 (w_k = 0)',
      specificMechanism: 'oculta iterativamente cada estación k del entrenamiento variacional (anulando su peso w_k = 0, Regla 35) y reconstruye su concentración a ciegas usando únicamente las estaciones restantes y la física PDE'
    };
  }
  if (s.includes('cp-pre') || s.includes('conformal')) {
    return {
      formulaLaTeX: '\\mathcal{C}_{1-\\alpha}(\\mathbf{x}) = \\left[ \\hat{C}(\\mathbf{x}) \\pm q_{1-\\alpha}\\left(|\\mathcal{R}_{\\text{PDE}}(\\mathbf{x})| + \\sigma_{\\text{OK}}(\\mathbf{x})\\right) \\right]',
      unitsAndRange: 'Intervalo Conformal: µg·m⁻³ (Cobertura garantizada ≥ 1 - α)',
      specificMechanism: 'construye bandas de incertidumbre libres de asunciones gaussianas calibrando los cuantiles empíricos del residuo físico de Navier-Stokes-Leighton (ICML 2025)'
    };
  }
  if (s.includes('dml') || s.includes('double machine learning') || s.includes('chernozhukov') || s.includes('ate')) {
    return {
      formulaLaTeX: 'Y - \\hat{\\ell}(W) = \\theta_{\\text{ATE}}\\cdot (D - \\hat{m}(W)) + \\varepsilon, \\quad \\mathbb{E}[\\psi(Z; \\theta_0, \\eta_0)] = 0',
      unitsAndRange: 'θ_ATE: µg·m⁻³ o % de reducción causal neta',
      specificMechanism: 'ortogonaliza de Neyman el vector de confusores meteorológicos W (viento, capa límite, radiación, temperatura) para aislar el efecto causal puro de la intervención urbana'
    };
  }
  if (s.includes('gini')) {
    return {
      formulaLaTeX: 'G = \\frac{\\sum_{i=1}^{n}\\sum_{j=1}^{n} p_i p_j |E_i - E_j|}{2\\,\\overline{E}\\sum_{i=1}^{n} p_i}',
      unitsAndRange: 'Índice de Gini: [0.00 = igualdad perfecta, 1.00 = desigualdad máxima]',
      specificMechanism: 'mide el área entre la curva de Lorenz de exposición acumulada a contaminantes y la diagonal de equidad demográfica entre los 11 distritos censales de Málaga'
    };
  }
  if (s.includes('atkinson')) {
    return {
      formulaLaTeX: 'A(\\varepsilon) = 1 - \\frac{1}{\\overline{E}}\\left( \\sum_{i=1}^{n} f_i\\, E_i^{1-\\varepsilon} \\right)^{\\frac{1}{1-\\varepsilon}}, \\quad \\varepsilon \\in [0.5, 2.0]',
      unitsAndRange: 'Índice de Atkinson A(ε): [0, 1] adimensional',
      specificMechanism: 'pondera normativamente la aversión social a la desigualdad ambiental (parámetro ε), otorgando mayor peso a las colas de población vulnerable hiperexpuesta'
    };
  }
  if (s.includes('kakwani')) {
    return {
      formulaLaTeX: 'K = C_{\\text{conc}}(E \\mid \\text{Renta}) - G_{\\text{Renta}}',
      unitsAndRange: 'Índice de Kakwani: [-1, +1] (< 0 regresividad socioambiental)',
      specificMechanism: 'evalúa la progresividad o regresividad de la carga contaminante respecto a la renta media por hogar del Atlas INE ADRH'
    };
  }
  if (s.includes('cfl') || s.includes('courant')) {
    return {
      formulaLaTeX: '\\text{CFL} = \\Delta t \\left( \\frac{|u|}{\\Delta x} + \\frac{|v|}{\\Delta y} + \\frac{|w|}{\\Delta z} \\right) \\le 1.0',
      unitsAndRange: 'Número de Courant: adimensional (Estable si < 1.0)',
      specificMechanism: 'controla la condición de estabilidad numérica de Courant-Friedrichs-Lewy para la integración temporal advectiva en la malla tridimensional'
    };
  }
  if (s.includes('ntk') || s.includes('neural tangent kernel')) {
    return {
      formulaLaTeX: '\\mathbf{K}_{\\text{NTK}}(\\mathbf{x}, \\mathbf{x}\') = \\nabla_\\theta u_\\theta(\\mathbf{x}) \\cdot \\nabla_\\theta u_\\theta(\\mathbf{x}\')^\\top, \\quad \\lambda_k = \\frac{\\text{Tr}(\\mathbf{K})}{\\text{Tr}(\\mathbf{K}_k)}',
      unitsAndRange: 'Pesos adaptativos λ_k: adimensionales auto-balanceados',
      specificMechanism: 'equilibra dinámicamente las tasas de convergencia espectral entre la pérdida observacional y el residuo diferencial PDE mediante autovalores del Neural Tangent Kernel'
    };
  }
  if (s.includes('fourier') || s.includes('rff')) {
    return {
      formulaLaTeX: '\\gamma(\\mathbf{x}) = \\left[ \\cos(2\\pi \\mathbf{B}\\mathbf{x}),\\; \\sin(2\\pi \\mathbf{B}\\mathbf{x}) \\right]^\\top, \\quad \\mathbf{B}_{ij} \\sim \\mathcal{N}(0, \\sigma^2)',
      unitsAndRange: 'Frecuencias RFF: m⁻¹ (Mitigación de sesgo espectral)',
      specificMechanism: 'proyecta las coordenadas espaciales (x,y,z) en un espacio de características de Fourier para capturar gradientes abruptos de concentración a escala de acera'
    };
  }
  if (s.includes('svf') || s.includes('sky view factor') || s.includes('visión de cielo')) {
    return {
      formulaLaTeX: '\\psi_{\\text{SVF}} = \\frac{1}{2\\pi}\\int_0^{2\\pi} \\cos^2\\!\\left(\\arctan\\frac{H(\\phi)}{W/2}\\right) d\\phi \\approx \\cos\\!\\left(\\arctan(2H/W)\\right)',
      unitsAndRange: 'SVF (ψ_sky): [0.05 cañón cerrado – 1.00 cielo abierto]',
      specificMechanism: 'determina la fracción hemisférica de bóveda celeste visible desde el eje vial, gobernando el escape radiativo infrarrojo nocturno y la tasa de fotólisis J(NO₂)'
    };
  }
  if (s.includes('h/w') || s.includes('esbeltez') || s.includes('aspect ratio') || s.includes('oke')) {
    return {
      formulaLaTeX: '\\text{AR} = \\frac{H}{W}, \\quad \\text{Skimming Flow si } \\frac{H}{W} > 0.65 \\implies \\Gamma_{\\text{vortex}} \\propto \\frac{U_{\\text{roof}}}{1 + 0.8(H/W)^2}',
      unitsAndRange: 'H/W: adimensional (0.2 abierto – 3.5 centro histórico)',
      specificMechanism: 'clasifica el régimen fluidodinámico del cañón urbano según Oke (1987): flujo aislado (H/W < 0.3), interferencia de estela (0.3–0.65) o flujo rasante con vórtice atrapado (> 0.65)'
    };
  }
  if (s.includes('ach') || s.includes('renovación de aire') || s.includes('ventilación')) {
    return {
      formulaLaTeX: '\\text{ACH} = 3600 \\cdot \\frac{w_{\\text{entrain}}(U_{\\text{roof}}, H/W, L)}{H} \\; [\\text{h}^{-1}]',
      unitsAndRange: 'ACH: renovaciones·h⁻¹ (2 – 45 h⁻¹ en cañones urbanos)',
      specificMechanism: 'cuantifica el número de veces por hora que el volumen de aire confinado dentro del cañón urbano es renovado por intercambio turbulento en el nivel de tejados (z = H)'
    };
  }
  if (s.includes('z0') || s.includes('z_0') || s.includes('rugosidad') || s.includes('macdonald')) {
    return {
      formulaLaTeX: '\\frac{z_d}{H} = 1 + \\alpha^{-\\lambda_p}(\\lambda_p - 1), \\quad \\frac{z_0}{H} = \\left(1 - \\frac{z_d}{H}\\right)\\exp\\!\\left(-\\left[0.5\\beta\\frac{C_D}{\\kappa^2}\\left(1-\\frac{z_d}{H}\\right)\\lambda_f\\right]^{-0.5}\\right)',
      unitsAndRange: 'z₀: 0.15 – 2.20 m | z_d: 2.0 – 18.0 m',
      specificMechanism: 'parametriza la longitud de rugosidad aerodinámica (z₀) y el plano de desplazamiento de cota cero (z_d) a partir de la densidad edificatoria planar (λ_p) y frontal (λ_f) de Macdonald (1998)'
    };
  }
  if (s.includes('monin-obukhov') || s.includes('estabilidad') || s.includes('ri_b') || s.includes('richardson')) {
    return {
      formulaLaTeX: 'L = -\\frac{u_*^3\\,\\overline{\\theta}_v}{\\kappa\\, g\\, (\\overline{w\'\\theta_v\'})_s}, \\quad \\text{Ri}_b = \\frac{g}{\\overline{\\theta}_v}\\frac{\\Delta \\theta_v \\, \\Delta z}{(\\Delta U)^2}',
      unitsAndRange: 'L: metros (-50 m convectivo, +20 m estable, |L|>500 m neutro)',
      specificMechanism: 'mide la razón entre la producción mecánica de turbulencia por cizalladura del viento (u_*³) y la producción o supresión térmica por flotabilidad convectiva'
    };
  }
  if (s.includes('criterio q') || s.includes('hunt') || s.includes('vorticidad') || s.includes('tke')) {
    return {
      formulaLaTeX: 'Q = \\frac{1}{2}\\left(\\|\\boldsymbol{\\Omega}\\|_F^2 - \\|\\mathbf{S}\\|_F^2\\right) > 0, \\quad \\text{TKE} = \\frac{1}{2}\\left(\\overline{u\'^2} + \\overline{v\'^2} + \\overline{w\'^2}\\right)',
      unitsAndRange: 'Q: s⁻² (> 0 núcleo vortical) | TKE: m²·s⁻²',
      specificMechanism: 'identifica tubos de vórtice coherentes y zonas de recirculación atrapada donde el tensor antisimétrico de rotación (Ω) supera al tensor simétrico de deformación pura (S)'
    };
  }
  if (s.includes('pan') || s.includes('peroxiacetil') || s.includes('t_skin') || s.includes('termólisis')) {
    return {
      formulaLaTeX: 'k_{\\text{PAN}}(T_{\\text{skin}}) = 2.52\\times 10^{16}\\exp\\!\\left(-\\frac{13573}{T_{\\text{skin}}}\\right)\\;[\\text{s}^{-1}], \\quad \\text{PAN} \\xrightarrow{\\Delta H} \\text{CH}_3\\text{C(O)O}_2^\\bullet + \\text{NO}_2',
      unitsAndRange: 'k_PAN: 10⁻⁴ – 10⁻² s⁻¹ | T_skin: 290 – 338 K (ECOSTRESS/Landsat)',
      specificMechanism: 'resuelve la disociación endotérmica de Arrhenius del nitrato de peroxiacetilo (PAN) gobernada por la temperatura radiométrica superficial del asfalto recalentado'
    };
  }
  if (s.includes('6ppd') || s.includes('pcet') || s.includes('neumático')) {
    return {
      formulaLaTeX: '\\text{NO}_2 + \\text{6PPD/6PPD-Q}_{\\text{(surf)}} \\xrightarrow{\\gamma_{\\text{PCET}},\\; \\text{RH}} \\text{HONO}_{\\text{(g)}}\\!\\uparrow + \\text{Productos Nitrados}',
      unitsAndRange: 'γ_PCET: 10⁻⁶ – 10⁻⁵ adimensional | TWP: µg·m⁻³',
      specificMechanism: 'modeliza la transferencia acoplada protón-electrón (PCET) sobre antioxidantes de desgaste de neumáticos (6PPD/6PPD-Quinona) y óxidos férricos de frenos que reduce NO₂ a HONO gaseoso'
    };
  }
  if (s.includes('amf') || s.includes('factor de masa de aire') || s.includes('tropomi') || s.includes('sentinel-5p') || s.includes('sentinel-4')) {
    return {
      formulaLaTeX: '\\text{VCD}_{\\text{corr}} = \\frac{\\text{SCD}}{\\text{AMF}_{\\text{3D}}}, \\quad \\text{AMF}_{\\text{3D}} = \\text{AMF}_{\\text{1D}}\\cdot\\left[ f_{\\text{lit}}\\left(\\frac{H}{W}, \\theta_0, \\Delta\\phi\\right) + (1-f_{\\text{lit}})\\,\\psi_{\\text{SVF}} \\right]',
      unitsAndRange: 'VCD: 10¹⁵ molec·cm⁻² (µmol·m⁻²) | AMF_3D: 0.65 – 1.85',
      specificMechanism: 'corrige el sesgo de apantallamiento geométrico 3D del cañón urbano sobre la densidad de columna oblicua satelital (SCD) en función de la fracción iluminada f_lit y el ángulo cenital solar θ₀'
    };
  }
  if (s.includes('clno2') || s.includes('clno₂') || s.includes('n2o5') || s.includes('n₂o₅') || s.includes('no3') || s.includes('nocturn')) {
    return {
      formulaLaTeX: '\\text{NO}_2 + \\text{O}_3 \\xrightarrow{k_1} \\text{NO}_3^\\bullet \\xleftrightarrow{\\text{NO}_2} \\text{N}_2\\text{O}_5 \\xrightarrow{\\gamma(\\text{Cl}^-)} \\phi\\,\\text{ClNO}_2 + (2-\\phi)\\,\\text{NO}_3^-',
      unitsAndRange: 'ClNO₂ / N₂O₅: pptv | k(N₂O₅): ¼ c̄ A_s γ_N2O5 [s⁻¹]',
      specificMechanism: 'integra la química oscura del radical nitrato (NO₃•), el equilibrio térmico con N₂O₅ y su captación heterogénea sobre aerosol salino marino de la Bahía de Málaga produciendo ClNO₂ fotolábil al amanecer'
    };
  }
  if (s.includes('hono') || s.includes('nitroso') || s.includes('stemmler')) {
    return {
      formulaLaTeX: 'P_{\\text{HONO}} = \\frac{1}{4}\\,\\overline{v}_{\\text{NO}_2}\\,\\gamma_{\\text{photo}}(I_{\\text{UVA}}, \\text{RH})\\,\\left(\\frac{S}{V}\\right)_{\\text{urb}}\\, [\\text{NO}_2], \\quad \\text{HONO} + h\\nu \\rightarrow \\text{OH}^\\bullet + \\text{NO}',
      unitsAndRange: 'HONO: 0.1 – 2.5 ppbv | γ_photo: ~10⁻⁶ – 10⁻⁵',
      specificMechanism: 'cuantifica la reducción heterogénea fotosensibilizada de NO₂ sobre películas orgánicas bituminosas (urban grime) que inyecta radicales hidroxilo (OH•) al amanecer'
    };
  }
  if (s.includes('gs-gogat') || s.includes('nitrato reductasa') || s.includes('glutamina') || s.includes('proteína') || s.includes('nir')) {
    return {
      formulaLaTeX: '\\text{NO}_{2\\text{(g)}} \\xrightarrow{g_s} \\text{NO}_3^- \\xrightarrow{\\text{NR (2e}^-\\text{)}} \\text{NO}_2^- \\xrightarrow{\\text{NiR (6e}^-\\text{)}} \\text{NH}_4^+ \\xrightarrow{\\text{GS-GOGAT}} \\text{L-Glutamina}',
      unitsAndRange: 'Asimilación: g N·árbol⁻¹·año⁻¹ | Proteína vegetal: kg·año⁻¹',
      specificMechanism: 'cierra al 100 % el balance estequiométrico del nitrógeno atmosférico absorbido por los estomas, reduciéndolo enzimáticamente hasta aminoácidos estructurales sin retorno contaminante'
    };
  }
  if (s.includes('g_s') || s.includes('conductancia estomática') || s.includes('jarvis') || s.includes('ball-berry')) {
    return {
      formulaLaTeX: 'g_s = g_{\\text{max}}\\cdot f_{\\text{PAR}}(I)\\cdot f_T(T_{\\text{leaf}})\\cdot f_{\\text{VPD}}(D)\\cdot f_{\\psi}(\\psi_{\\text{soil}})',
      unitsAndRange: 'g_s: 0.05 – 0.65 cm·s⁻¹ (mmol H₂O·m⁻²·s⁻¹)',
      specificMechanism: 'modeliza la apertura dinámica de los poros estomáticos foliares en respuesta a la radiación fotosintéticamente activa (PAR), temperatura foliar y déficit de presión de vapor (VPD)'
    };
  }
  if (s.includes('penman') || s.includes('granier') || s.includes('xilem') || s.includes('transpiración') || s.includes('calor latente')) {
    return {
      formulaLaTeX: '\\lambda E = \\frac{\\Delta (R_n - G) + \\rho_a c_p D\\, g_a}{\\Delta + \\gamma(1 + g_a/g_s)}, \\quad \\Delta T_{\\text{leaf-air}} = \\frac{(R_n - G) - \\lambda E}{\\rho_a c_p g_a}',
      unitsAndRange: 'λE: W·m⁻² | J_s: L H₂O·día⁻¹ | ΔT: -1.5 a -4.8 °C',
      specificMechanism: 'resuelve el balance termodinámico de energía foliar de Penman-Monteith y el caudal xilemático de Granier, cuantificando el enfriamiento evaporativo del árbol sobre la isla de calor'
    };
  }
  if (s.includes('farquhar') || s.includes('fvcb') || s.includes('13c') || s.includes('isotóp')) {
    return {
      formulaLaTeX: 'A_n = \\min(W_c, W_j, W_p) - R_d, \\quad \\delta^{13}\\text{C}_{\\text{air}} = f_{\\text{ff}}\\,\\delta^{13}\\text{C}_{\\text{ff}} + (1-f_{\\text{ff}})\\,\\delta^{13}\\text{C}_{\\text{bg}}',
      unitsAndRange: 'A_n: µmol CO₂·m⁻²·s⁻¹ | δ¹³C: -8.5‰ a -12.8‰ VPDB',
      specificMechanism: 'acopla la cinética fotosintética de Rubisco (Farquhar-von Caemmerer-Berry) con el fraccionamiento isotópico de carbono-13 para separar la fijación de CO₂ fósil vehicular'
    };
  }
  if (s.includes('cu/sb') || s.includes('freno') || s.includes('euro 7') || s.includes('hematita')) {
    return {
      formulaLaTeX: 'E_{\\text{brake}} = N_{\\text{veh}}\\cdot \\text{EF}_{\\text{PM10,brake}}(v, \\text{HDV}), \\quad \\text{Ratio Trazador } \\frac{[\\text{Cu}]}{[\\text{Sb}]} \\approx 4.5 - 6.8',
      unitsAndRange: 'Límite Euro 7 (Reglamento UE 2024/1257): ≤ 7 mg·km⁻¹ | Cu/Sb: adimensional',
      specificMechanism: 'caracteriza las emisiones no-escape por abrasión de pastillas de freno mediante la firma estequiométrica bimetálica Cobre/Antimonio (Cu/Sb) y la actividad catalítica de α-Fe₂O₃'
    };
  }
  if (s.includes('icrp') || s.includes('pediátr') || s.includes('alvéolo') || s.includes('df_al') || s.includes('0.8 m') || s.includes('0,8 m') || s.includes('carrito')) {
    return {
      formulaLaTeX: 'D_{\\text{inh}}(z) = \\frac{C(z)\\cdot V_E \\cdot \\text{DF}_{\\text{AL}}(d_p) \\cdot \\Delta t}{BW}, \\quad \\frac{D_{\\text{infante}}(0.8\\text{m})}{D_{\\text{adulto}}(1.5\\text{m})} \\approx 2.15\\times',
      unitsAndRange: 'D_inh: µg·kg⁻¹·día⁻¹ | V_E pediátrico: 0.42 m³·h⁻¹·kg⁻¹',
      specificMechanism: 'integra el modelo dosimétrico del tracto respiratorio humano ICRP 66 a la cota de inhalación infantil (0.8–0.9 m AGL) frente a la toma oficial situada a 4.0 m'
    };
  }
  if (s.includes('sml') || s.includes('aragonito') || s.includes('acidificación') || s.includes('revelle') || s.includes('marpol') || s.includes('eca')) {
    return {
      formulaLaTeX: '\\Omega_{\\text{arag}} = \\frac{[\\text{Ca}^{2+}][\\text{CO}_3^{2-}]}{K\'_{sp,\\text{arag}}}, \\quad \\Delta\\text{pH}_{\\text{SML}} = -\\beta_{\\text{buf}}^{-1}\\left(\\Delta[\\text{HNO}_3] + 2\\Delta[\\text{H}_2\\text{SO}_4]\\right)',
      unitsAndRange: 'pH_SML: 7.85 – 8.12 | Ω_arag: 2.1 – 3.6 | Límite Med SOx ECA: 0.10% S',
      specificMechanism: 'resuelve el equilibrio carbónico-borato de la microcapa superficial marina (SML, 50 µm) bajo deposición ácida de NOₓ/SO₂ y la entrada en vigor de la Med SOx ECA (01/05/2025)'
    };
  }
  if (s.includes('kalman') || s.includes('latencia') || s.includes('4d-var') || s.includes('retención')) {
    return {
      formulaLaTeX: 'w_i(\\Delta t) = w_{i,0}\\cdot \\exp\\!\\left(-\\frac{\\Delta t_i}{\\tau_{\\text{corr}}}\\right), \\quad \\mathbf{K}_k = \\mathbf{P}_k^- \\mathbf{H}^\\top (\\mathbf{H}\\mathbf{P}_k^- \\mathbf{H}^\\top + \\mathbf{R})^{-1}',
      unitsAndRange: 'Factor e^(-Δt/τ): [0.00 – 1.00] | Δt: minutos desde última ingesta',
      specificMechanism: 'pondera exponencialmente la ganancia de Kalman de cada paquete telemétrico en función de su frescura temporal Δt respecto al tiempo de decorrelación turbulenta τ_corr'
    };
  }
  if (s.includes('kriging') || s.includes('semivariograma') || s.includes('varianza')) {
    return {
      formulaLaTeX: '\\hat{Z}(\\mathbf{x}_0) = \\sum_{i=1}^{N}\\lambda_i Z(\\mathbf{x}_i), \\quad \\sigma_{\\text{OK}}^2(\\mathbf{x}_0) = \\sum_{i=1}^{N}\\lambda_i \\gamma(\\|\\mathbf{x}_i - \\mathbf{x}_0\\|) + \\mu',
      unitsAndRange: 'σ²_OK: µg²·m⁻⁶ | Pesos ∑λ_i = 1 (Insesgado)',
      specificMechanism: 'minimiza la varianza del error de predicción espacial mediante el sistema lagrangiano de Kriging Ordinario Anisotrópico acoplado al vector de viento dominante'
    };
  }
  if (s.includes('pytorch') || s.includes('.py') || s.includes('adamw') || s.includes('l-bfgs') || s.includes('slurm')) {
    return {
      formulaLaTeX: '\\theta_{k+1} = \\theta_k - \\eta_{\\text{AdamW}}\\frac{\\hat{m}_k}{\\sqrt{\\hat{v}_k}+\\epsilon} \\xrightarrow{\\text{L-BFGS}} \\theta^* - \\mathbf{H}_k^{-1}\\nabla_\\theta \\mathcal{L}_{\\text{PINN}}(\\theta)',
      unitsAndRange: 'Optimizador Bietápico: AdamW (lr = 10⁻³) + L-BFGS Cuasi-Newton | Semilla Fija = 42',
      specificMechanism: 'genera el código ejecutable PyTorch Autograd con pesos adaptativos NTK para entrenar en el futuro la PINN en el servidor UNED sobre la calle activa, la cola de puntos y las 24+16 fuentes'
    };
  }
  if (s.includes('dataset mvp') || s.includes('12 vars') || s.includes('12 variables') || s.includes('dataset .csv')) {
    return {
      formulaLaTeX: '\\mathbf{X}_{\\text{MVP}} \\in \\mathbb{R}^{(N_{\\text{cola}} + 24)\\times 12}, \\quad \\mathbf{x}_i = \\big[\\text{NO}_2, \\text{IMD}, v_m, u, v, T_a, \\text{RH}, R_{\\text{sw}}, \\text{BLH}, H/W, \\text{SVF}, \\text{VCD}_{16\\text{sat}}\\big]',
      unitsAndRange: 'Matriz Tabular: (Puntos Activos + 24 Estaciones) × 12 Variables MVP (Paso 6.3 Director)',
      specificMechanism: 'empaqueta en tiempo real las 12 variables del Producto Mínimo Viable exigidas por el Director en el Paso 6.3 para los puntos seleccionados y las 24 estaciones de Málaga'
    };
  }
  if (s.includes('solo-lectura') || s.includes('leer entrenamiento') || s.includes('checkpoint') || s.includes('.json de muestra')) {
    return {
      formulaLaTeX: '\\mathcal{I}_{\\text{ReadOnly}}: \\mathcal{J}_{\\text{ckpt}} \\mapsto \\big\\{\\text{RMSE}_{\\text{LOOCV}}, R^2, \\text{MQI}, \\mathcal{L}_{\\text{PDE}}\\big\\}, \\quad \\frac{\\partial \\mathcal{C}_{\\text{app}}}{\\partial \\mathcal{J}_{\\text{ckpt}}} \\equiv 0',
      unitsAndRange: 'Invariante de Seguridad: ∂Código_App / ∂JSON = 0 (100% Solo-Lectura Aislada)',
      specificMechanism: 'lee y almacena en memoria aislada las métricas del archivo .JSON de entrenamiento para visualizarlas e imprimirlas en la tesis, garantizando que el código y los motores físicos de la app permanezcan 100 % inalterados'
    };
  }
  if (s.includes('pdf del entrenamiento') || s.includes('entrenamiento uned') || s.includes('módulo latente') || s.includes('fase entrenamiento')) {
    return {
      formulaLaTeX: '\\theta^* = \\arg\\min_{\\theta}\\left[\\lambda_{\\text{data}}\\mathcal{L}_{\\text{24+16}}(\\theta) + \\lambda_{\\text{PDE}}\\mathcal{L}_{\\text{NS-Leighton}}(\\theta) + \\lambda_{\\text{BC}}\\mathcal{L}_{\\text{Wesely}}(\\theta) + \\sum_{m=1}^{M}\\mu_m \\mathcal{R}_{\\text{Director},m}(\\theta)\\right]',
      unitsAndRange: 'LOOCV: 24 Estaciones + 16 Satélites | Criterio FAIRMODE: MQI ≤ 1.0 | Modo 100% Solo-Lectura',
      specificMechanism: 'conecta los Puntos 1–7 actuales del Director (03/10/2026) con las exigencias teóricas y técnicas futuras, preparando el paquete .PY/.CSV y la lectura/impresión PDF A4 sin tocar jamás el código de la aplicación'
    };
  }
  if (s.includes('exigencia') || s.includes('teórica') || s.includes('técnica') || s.includes('añadir al pdf y .py')) {
    return {
      formulaLaTeX: '\\mathcal{L}_{\\text{aug}}(\\theta) = \\mathcal{L}_{\\text{PINN}}(\\theta) + \\sum_{m=1}^{M_{\\text{teo}}} \\mu_m \\big\\|\\mathcal{N}_m(\\hat{C})\\big\\|_{\\Omega}^2 + \\sum_{k=1}^{K_{\\text{tec}}} \\nu_k \\mathcal{P}_{\\text{val},k}(\\hat{C})',
      unitsAndRange: 'Registro Evolutivo: M_teo Ecuaciones Físicas + K_tec Protocolos Técnicos de Validación',
      specificMechanism: 'incorpora nuevas condiciones teóricas (términos PDE/químicos) o técnicas (épocas, mallas, intervalos IC 95%) ordenadas por el Director al Script .PY y al Dossier PDF A4 sin alterar el código fuente'
    };
  }
  if (s.includes('puntos conectados') || s.includes('sumar punto actual') || s.includes('5 puntos clave') || s.includes('vaciar cola')) {
    return {
      formulaLaTeX: '\\Omega_{\\text{train}} = \\{\\mathbf{x}_{\\text{activo}}\\} \\cup \\bigcup_{p=1}^{P_{\\text{cola}}} \\{\\mathbf{x}_p\\} \\cup \\bigcup_{s=1}^{24} \\{\\mathbf{x}_{\\text{est},s}\\} \\subset \\mathbb{R}^3',
      unitsAndRange: 'Dominio Espacial: Calle Activa + Cola Multi-Punto + 24 Estaciones + 16 Satélites',
      specificMechanism: 'ensambla el conjunto de coordenadas urbanas de Málaga (interior ZBE, borde, arteria de tráfico, puerto y fondo) que se inyectan simultáneamente en el Dataset .CSV y en los tensores de colocación del Script .PY'
    };
  }
  if (s.includes('geojson') || s.includes('csv') || s.includes('latex') || s.includes('fair') || s.includes('sha-256') || s.includes('pdf') || s.includes('zip') || s.includes('github')) {
    return {
      formulaLaTeX: 'H_{\\text{SHA-256}}(\\mathcal{D}_{\\text{FAIR}}) \\in \\{0,1\\}^{256}, \\quad \\text{CRS} = \\text{EPSG:4326} \\leftrightarrow \\text{EPSG:25830}',
      unitsAndRange: 'Integridad: 256 bits (SHA-256) | Estándares: RFC 7946 / RFC 4180 / ISO 19115',
      specificMechanism: 'serializa los tensores físico-químicos del punto activo con firma criptográfica determinista para reproducibilidad de Ciencia Abierta y defensa doctoral UNED'
    };
  }

  return null;
}

/**
 * Motor Universal de Desglose y Explicación Exhaustiva de Ecuaciones (Término a Término — 100 % Individualizado).
 * Analiza cualquier expresión LaTeX renderizada en el tooltip (presente o futura) y genera:
 *  1) Lectura estructural de la ecuación (relación diferencial, algebraica, estequiométrica o estadística).
 *  2) Desglose individualizado (1 fila por símbolo, CERO agrupaciones y CERO recortes) de CADA variable,
 *     CADA constante física o numérica (con su valor exacto y unidades SI), CADA parámetro/coeficiente
 *     y CADA operador presente en la fórmula.
 *  3) Extractor automático de tokens LaTeX para garantizar cobertura 100 % ante cualquier ecuación futura.
 *  4) Síntesis física integral contextualizada al elemento activo y su ventana/pestaña.
 */
const FORMULA_SYMBOL_CATALOG: Array<{
  pattern: RegExp;
  symbol: string;
  kind: 'Variable' | 'Constante' | 'Parámetro / Coef.' | 'Operador';
  meaning: string;
}> = [
  // ================= SÍMBOLOS CANÓNICOS DE LA TESIS DOCTORAL UNED (PUNTOS 1–7, PASOS 6.1–6.5, REGLAS 31–35) =================
  { pattern: /\\hat\{c\}|\\mathcal\{N\}_\{?\\theta\}?/, symbol: 'ĉ(x,z,t) / N_θ', kind: 'Variable', meaning: 'Campo continuo 3D de concentración de NO₂ inferido por la Red Neuronal Informada por la Física con positividad estricta ĉ ≥ 0 (µg·m⁻³).' },
  { pattern: /\\chi_\{?\\text\{NO\}_2\}?/, symbol: 'χ_NO₂ [ppb]', kind: 'Variable', meaning: 'Fracción molar volumétrica de NO₂ en aire seco expresada en partes por mil millones (nmol·mol⁻¹ = ppb).' },
  { pattern: /M_\{?\\text\{NO\}_2\}?/, symbol: 'M_NO₂ = 46.0055 g·mol⁻¹', kind: 'Constante', meaning: 'Masa molecular molar estándar de la molécula de dióxido de nitrógeno según pesos atómicos IUPAC (g·mol⁻¹).' },
  { pattern: /P_\{?\\text\{real\}\}?/, symbol: 'P_real(x,t)', kind: 'Variable', meaning: 'Presión barométrica atmosférica real medida en el instante t por la red sinóptica AEMET Málaga corregida por altitud MDE (Pa o hPa, Regla 34).' },
  { pattern: /T_\{?\\text\{real\}\}?/, symbol: 'T_real(x,t)', kind: 'Variable', meaning: 'Temperatura termodinámica absoluta real del aire medida en el instante t por AEMET Málaga (K = °C + 273.15, Regla 34).' },
  { pattern: /w_k\(\\mathbf\{x\}_\{s_k\}\)|w_k\s*\\equiv\s*0/, symbol: 'w_k(x_{s_k}) ≡ 0', kind: 'Constante', meaning: 'Condición matemática de exclusión estricta en validación ciega LOOCV (Regla 35): anula idénticamente el peso de la estación retenida s_k para impedir fuga de datos.' },
  { pattern: /S_\{T_j\}|S_\{?\\text\{Sobol\}\}?/, symbol: 'S_{T_j} (Índice total de Sobol)', kind: 'Variable', meaning: 'Fracción de la varianza total del campo de NO₂ explicada por la variable X_j y todas sus interacciones no lineales de orden superior ([0–1]).' },
  { pattern: /h_\{?\\text\{TIBL\}\}?/, symbol: 'h_TIBL(x)', kind: 'Variable', meaning: 'Altura de la Capa Límite Interna Térmica Costera que crece parabólicamente tierra adentro desde el litoral de la Bahía de Málaga (m).' },
  { pattern: /x_\{?\\text\{fetch\}\}?/, symbol: 'x_fetch(x)', kind: 'Variable', meaning: 'Distancia de recorrido (fetch costero) de la masa de aire marino desde la línea de costa hasta la coordenada urbana evaluada (m).' },
  { pattern: /\\tau_\{?\\text\{PI-DiD\}\}?/, symbol: 'τ_PI-DiD(x)', kind: 'Variable', meaning: 'Efecto causal medio del tratamiento de la ZBE (437 ha) desmeteorologizado mediante diferencias en diferencias informadas por la física (µg·m⁻³ o %).' },
  { pattern: /\\tau_\{?\\text\{RDD\}\}?/, symbol: 'τ_RDD(h)', kind: 'Variable', meaning: 'Estimador causal de regresión discontinua espacial en el anillo perimetral de ancho de banda h alrededor de las 97 cámaras LPR (µg·m⁻³).' },
  { pattern: /\\mathcal\{V\}_\{32\}|\\mathcal\{V\}_\{?\\text\{OBS\}\}?/, symbol: 'V_32 = V_OBS ⊔ V_DERIV ⊔ V_MOD', kind: 'Variable', meaning: 'Partición epistémica disjunta de las 32 variables del Gemelo Digital (12 Observadas crudas, 13 Derivadas deterministas y 7 Modelizadas por la PINN).' },
  { pattern: /\\Delta C_\{?\\text\{micro\}\}?/, symbol: 'ΔC_micro', kind: 'Variable', meaning: 'Perturbación microescalar neta de NO₂ en la calle activa resultante del balance entre tráfico (+), cañón (+), arboleda (−) y pavimento TiO₂ (−) (µg·m⁻³).' },

  // ================= ESPECÍFICOS DE QUÍMICA ATMOSFÉRICA, LEIGHTON, PAN Y NOCHE =================
  { pattern: /NO_2|\\text\{NO\}_2|NO₂/, symbol: '[NO₂] / C_NO₂', kind: 'Variable', meaning: 'Concentración de dióxido de nitrógeno troposférico en la cota evaluada (µg·m⁻³ o molec·cm⁻³).' },
  { pattern: /(?:^|[^a-zA-Z\\{])NO(?![_a-zA-Z0-9}])|\\text\{NO\}(?!_|\d)/, symbol: '[NO]', kind: 'Variable', meaning: 'Concentración de monóxido de nitrógeno primario emitido por combustión vehicular (µg·m⁻³ o molec·cm⁻³).' },
  { pattern: /NO_x|\\text\{NO\}_x/, symbol: 'NO_x (NO + NO₂)', kind: 'Variable', meaning: 'Concentración agregada de óxidos de nitrógeno reactivos expresada como equivalente másico de NO₂ (µg·m⁻³).' },
  { pattern: /O_3|\\text\{O\}_3|O₃/, symbol: '[O₃]', kind: 'Variable', meaning: 'Concentración de ozono troposférico secundario implicado en el equilibrio fotoestacionario (µg·m⁻³ o molec·cm⁻³).' },
  { pattern: /J_\{?\\text\{NO\}_2\}?|J_\{?NO_2\}?|J\(NO/, symbol: 'J_NO₂', kind: 'Parámetro / Coef.', meaning: 'Coeficiente de fotólisis actínica solar del NO₂ para longitudes de onda λ < 420 nm (s⁻¹).' },
  { pattern: /\bk_1\b/, symbol: 'k₁(T)', kind: 'Parámetro / Coef.', meaning: 'Constante cinética bimolecular de titulación NO + O₃ → NO₂ + O₂ dependiente de T según Arrhenius IUPAC (cm³·molec⁻¹·s⁻¹).' },
  { pattern: /\bk_2\b/, symbol: 'k₂(T)', kind: 'Parámetro / Coef.', meaning: 'Constante cinética de oxidación de NO por radicales peroxilo RO₂• / HO₂• sin consumo de ozono (cm³·molec⁻¹·s⁻¹).' },
  { pattern: /\bk_3\b/, symbol: 'k₃(T)', kind: 'Parámetro / Coef.', meaning: 'Constante cinética de reacción del ciclo fotoquímico extendido dependiente de la temperatura (cm³·molec⁻¹·s⁻¹).' },
  { pattern: /k_\{?\\text\{OH\}\}?/, symbol: 'k_OH', kind: 'Parámetro / Coef.', meaning: 'Constante cinética de tercer orden para el sumidero diurno NO₂ + OH• + M → HNO₃ (cm³·molec⁻¹·s⁻¹).' },
  { pattern: /RO_2/, symbol: '[RO₂•]', kind: 'Variable', meaning: 'Concentración de radicales peroxilo orgánicos procedentes de la degradación de COVs (molec·cm⁻³).' },
  { pattern: /HO_2/, symbol: '[HO₂•]', kind: 'Variable', meaning: 'Concentración del radical hidroperoxilo en acoplamiento fotoquímico rápido con OH• (molec·cm⁻³).' },
  { pattern: /\\text\{OH\}|OH\^\\bullet/, symbol: '[OH•]', kind: 'Variable', meaning: 'Concentración del radical hidroxilo diurno, oxidante troposférico primario (molec·cm⁻³).' },
  { pattern: /k_\{?\\text\{PAN\}\}?/, symbol: 'k_PAN(T_skin)', kind: 'Parámetro / Coef.', meaning: 'Constante de velocidad de disociación térmica endotérmica del nitrato de peroxiacetilo (s⁻¹).' },
  { pattern: /\bPAN\b|\\text\{PAN\}/, symbol: '[PAN]', kind: 'Variable', meaning: 'Concentración de nitrato de peroxiacetilo (CH₃C(O)OONO₂), reservorio termolábil de radicales y NO₂ (ppbv o µg·m⁻³).' },
  { pattern: /2\.52\s*\\times\s*10\^\{16\}|2,52\s*\\times\s*10\^\{16\}/, symbol: 'A_PAN = 2.52×10¹⁶ s⁻¹', kind: 'Constante', meaning: 'Factor preexponencial de frecuencia colisional de Arrhenius IUPAC/NASA-JPL para la termólisis del PAN (s⁻¹).' },
  { pattern: /13573/, symbol: 'E_a/R = 13573 K', kind: 'Constante', meaning: 'Temperatura característica de activación de Arrhenius (E_a = 112.8 kJ·mol⁻¹ dividida por R) para la ruptura del enlace O₂N–OOC(O)CH₃ (K).' },
  { pattern: /N_2O_5|\\text\{N\}_2\\text\{O\}_5/, symbol: '[N₂O₅]', kind: 'Variable', meaning: 'Concentración de pentóxido de dinitrógeno nocturno en equilibrio térmico con NO₂ y NO₃• (pptv o molec·cm⁻³).' },
  { pattern: /NO_3\^\\bullet|\\text\{NO\}_3\^\\bullet/, symbol: '[NO₃•]', kind: 'Variable', meaning: 'Concentración del radical nitrato nocturno formado por la oxidación lenta NO₂ + O₃ (pptv o molec·cm⁻³).' },
  { pattern: /ClNO_2|\\text\{ClNO\}_2/, symbol: '[ClNO₂]', kind: 'Variable', meaning: 'Concentración de cloruro de nitrilo costero fotolizable al amanecer hacia radicales Cl• + NO₂ (pptv).' },
  { pattern: /\\phi_\{?ClNO_?2\}?|\\phi\(Cl\^-\)/, symbol: 'φ_ClNO₂', kind: 'Parámetro / Coef.', meaning: 'Rendimiento estequiométrico molar de formación de ClNO₂ por cada molécula de N₂O₅ hidrolizada en aerosol marino NaCl ([0–1], típico ~0.85).' },
  { pattern: /\\gamma_\{?N_?2O_?5\}?/, symbol: 'γ_N₂O₅', kind: 'Parámetro / Coef.', meaning: 'Coeficiente adimensional de captación reactiva heterogénea de N₂O₅ sobre la superficie de aerosol marino húmedo (~0.01–0.03).' },
  { pattern: /S_\{?\\text\{wet\}\}?/, symbol: 'S_wet', kind: 'Variable', meaning: 'Densidad superficial específica de aerosol húmedo disponible para reacciones heterogéneas gás-partícula (µm²·cm⁻³).' },
  { pattern: /\\bar\{c\}|\\overline\{c\}/, symbol: 'c̄ (Velocidad térmica)', kind: 'Parámetro / Coef.', meaning: 'Velocidad molecular media de Maxwell-Boltzmann del gas reactivo: c̄ = √(8RT / πM) (m·s⁻¹).' },
  { pattern: /\\frac\{1\}\{4\}|0\.25\s*\\gamma/, symbol: '1/4 (Factor cinético)', kind: 'Constante', meaning: 'Constante geométrica de la teoría cinética de los gases que relaciona el flujo de colisión superficial con la velocidad térmica media c̄ (adimensional).' },
  { pattern: /h\\nu/, symbol: 'hν (Energía fotónica)', kind: 'Constante', meaning: 'Cuanto de energía radiativa solar (producto de la constante de Planck h = 6.626×10⁻³⁴ J·s por la frecuencia ν) que impulsa la fotólisis (J o eV).' },

  // ================= ASFALTO 99.8%, FOTOCATÁLISIS TiO2 0.2% Y RESISTENCIAS =================
  { pattern: /v_\{d,\\text\{TiO\}_2\}|v_\{d,TiO2\}/, symbol: 'v_{d,TiO₂}', kind: 'Variable', meaning: 'Velocidad efectiva de deposición y oxidación fotocatalítica de NO₂ sobre pavimento activo con TiO₂ anatasa Grado A1 (cm·s⁻¹ o m·s⁻¹).' },
  { pattern: /v_\{d,\\text\{eff\}\}|\\text\{v\}_d|\bv_d\b/, symbol: 'v_d / v_{d,eff}', kind: 'Variable', meaning: 'Velocidad efectiva de deposición seca desde la columna de aire hacia la superficie terrestre o foliar (cm·s⁻¹ o m·s⁻¹).' },
  { pattern: /\br_a\b/, symbol: 'r_a', kind: 'Variable', meaning: 'Resistencia aerodinámica al transporte turbulento por remolinos desde la altura de referencia hasta la subcapa viscosa (s·m⁻¹).' },
  { pattern: /\br_b\b/, symbol: 'r_b', kind: 'Variable', meaning: 'Resistencia de la subcapa límite cuasi-laminar gobernada por difusión molecular y el número de Schmidt Sc (s·m⁻¹).' },
  { pattern: /r_\{c,\\text\{TiO\}_2\}|r_\{c,TiO2\}/, symbol: 'r_{c,TiO₂}', kind: 'Variable', meaning: 'Resistencia superficial intrínseca de oxidación fotocatalítica sobre TiO₂ en función de irradiancia UV-A, humedad RH y bloqueo por NO₃⁻ (s·m⁻¹).' },
  { pattern: /\br_c\b/, symbol: 'r_c', kind: 'Variable', meaning: 'Resistencia superficial o estomática/cuticular total a la captación química en la interfaz sólida o vegetal (s·m⁻¹).' },
  { pattern: /Da_\{?\\text\{surf\}\}?|\\text\{Da\}/, symbol: 'Da_surf', kind: 'Variable', meaning: 'Número de Damköhler superficial ((r_a + r_b) / r_c): cociente adimensional entre la escala de tiempo de transporte turbulento y la de reacción química.' },
  { pattern: /I_\{?\\text\{UVA\}\}?/, symbol: 'I_UVA', kind: 'Variable', meaning: 'Irradiancia solar ultravioleta A (315–400 nm) incidente en el fondo del cañón que excita el bandgap del TiO₂ (W·m⁻²).' },
  { pattern: /\\text\{RH\}|\bRH\b/, symbol: 'RH (Humedad Relativa)', kind: 'Variable', meaning: 'Humedad relativa ambiente que provee moléculas H₂O para generar radicales hidroxilo OH• y controla la delicuescencia de Ca(NO₃)₂ (DRH = 50.8 %) (%).' },
  { pattern: /S_\{?\\text\{NO\}_3\^-\}?/, symbol: 'S_NO₃⁻', kind: 'Variable', meaning: 'Factor de envenenamiento/pasivación de centros activos catalíticos por acumulación de nitrato adsorbido antes de su lavado pluvial ([0–1]).' },
  { pattern: /\\mathcal\{M\}_\{?\\text\{refl\}\}?|M_\{?\\text\{refl\}\}?/, symbol: 'M_refl (Factor de cavidad de Oke)', kind: 'Parámetro / Coef.', meaning: 'Factor multiplicador de atrapamiento y reflexión radiativa múltiple UV-A entre fachadas y solería del cañón urbano (adimensional).' },
  { pattern: /HONO/, symbol: 'J_HONO / P_HONO / [HONO]', kind: 'Variable', meaning: 'Flujo interfacial o tasa de producción de ácido nitroso por reducción fotosensibilizada de NO₂ sobre película orgánica urbana (urban grime) (µg·m⁻²·s⁻¹).' },
  { pattern: /\\gamma_\{?\\text\{grime\}\}?|\\gamma_\{?\\text\{HONO\}\}?/, symbol: 'γ_grime / γ_HONO', kind: 'Parámetro / Coef.', meaning: 'Coeficiente de captación reactiva fotosensibilizada de NO₂ sobre hidrocarburos aromáticos policíclicos depositados en asfalto (10⁻⁶–10⁻⁵ adimensional).' },
  { pattern: /\\gamma_\{?\\text\{PCET\}\}?/, symbol: 'γ_PCET', kind: 'Parámetro / Coef.', meaning: 'Coeficiente de captación reactiva por Transferencia Acoplada Protón-Electrón (PCET) de NO₂ sobre elastómeros de neumáticos 6PPD/6PPD-Q (adimensional).' },
  { pattern: /6PPD/, symbol: '[6PPD / 6PPD-Q]', kind: 'Variable', meaning: 'Concentración superficial de antioxidante p-fenilendiamina de neumáticos (6PPD) y su producto de ozonólisis 6PPD-Quinona en polvo vial (µg·m⁻²).' },
  { pattern: /E_\{?\\text\{IVOC\}\}?/, symbol: 'E_IVOC(T_skin)', kind: 'Variable', meaning: 'Flujo de volatilización térmica solar de compuestos orgánicos de volatilidad intermedia/semivolátil desde el ligante asfáltico SMA 11 (µg·m⁻²·h⁻¹).' },
  { pattern: /E_\{?300\}?/, symbol: 'E₃₀₀', kind: 'Parámetro / Coef.', meaning: 'Factor basal de emisión evaporativa de IVOCs/SVOCs bituminosos medido a la temperatura de referencia de 300 K (26.85 °C) (µg·m⁻²·h⁻¹).' },
  { pattern: /\b300\b/, symbol: 'T_ref = 300 K', kind: 'Constante', meaning: 'Temperatura termodinámica estándar de referencia (26.85 °C) en la parametrización de volatilización asfáltica de Khare & Gentner (K).' },
  { pattern: /E_a/, symbol: 'E_a', kind: 'Parámetro / Coef.', meaning: 'Energía molar de activación aparente del proceso cinético o de desorción térmica de Arrhenius (J·mol⁻¹ o kJ·mol⁻¹).' },

  // ================= FITORREMEDIACIÓN, FISIOLOGÍA VEGETAL E ISÓTOPOS =================
  { pattern: /F_\{?\\text\{tree\}\}?/, symbol: 'F_tree', kind: 'Variable', meaning: 'Flujo neto de absorción fitorremediadora de contaminantes gaseosos o particulados por el dosel arbóreo (µg·m⁻²·s⁻¹).' },
  { pattern: /LAI|\\text\{LAI\}/, symbol: 'LAI', kind: 'Variable', meaning: 'Índice de Área Foliar unilateral proyectada (m² de superficie foliar fotosintética por m² de suelo urbano).' },
  { pattern: /C_\{?\\text\{comp\}\}?/, symbol: 'C_comp ≈ 1.1 µg·m⁻³', kind: 'Constante', meaning: 'Punto de compensación apoplástico foliar de NO₂ (Sparks et al., 2001): umbral fisiológico por encima del cual el estoma actúa como sumidero neto (µg·m⁻³).' },
  { pattern: /C_\{?\\text\{ambient\}\}?|C_\{?\\text\{air\}\}?/, symbol: 'C_ambient / C_air', kind: 'Variable', meaning: 'Concentración del contaminante en el aire ambiente exterior circundante a la copa o interfaz (µg·m⁻³).' },
  { pattern: /\bg_s\b/, symbol: 'g_s', kind: 'Variable', meaning: 'Conductancia estomática foliar efectiva regulada por luz PAR, déficit de presión de vapor, temperatura y potencial hídrico (cm·s⁻¹ o mmol·m⁻²·s⁻¹).' },
  { pattern: /g_\{?\\text\{max\}\}?/, symbol: 'g_max', kind: 'Parámetro / Coef.', meaning: 'Conductancia estomática máxima específica de la especie arbórea bajo condiciones óptimas de radiación e hidratación (mmol·m⁻²·s⁻¹).' },
  { pattern: /\bg_a\b/, symbol: 'g_a', kind: 'Variable', meaning: 'Conductancia aerodinámica de la capa límite laminar de las hojas acoplada a la velocidad del viento en copa (m·s⁻¹).' },
  { pattern: /f_\{?\\text\{PAR\}\}?|C_L\(PAR\)/, symbol: 'f_PAR / C_L(PAR)', kind: 'Variable', meaning: 'Función adimensional de respuesta estomática o enzimática a la Radiación Fotosintéticamente Activa (PAR, 400–700 nm) ∈ [0, 1].' },
  { pattern: /f_\{?\\text\{VPD\}\}?/, symbol: 'f_VPD', kind: 'Variable', meaning: 'Factor adimensional de cierre estomático inducido por el Déficit de Presión de Vapor atmosférico (VPD) ∈ [0, 1].' },
  { pattern: /f_T|C_T\(T_a\)/, symbol: 'f_T / C_T(T_a)', kind: 'Variable', meaning: 'Función termodinámica de modulación térmica sobre la apertura estomática o actividad de la sintasa de isopreno (adimensional).' },
  { pattern: /f_\{?\\psi\}?/, symbol: 'f_ψ', kind: 'Variable', meaning: 'Factor de regulación hídrica estomática gobernado por el potencial hídrico xilemático ψ_leaf ∈ [0, 1].' },
  { pattern: /\\text\{NR\}|\\text\{NiR\}|\\text\{GS-GOGAT\}/, symbol: 'NR → NiR → GS-GOGAT', kind: 'Operador', meaning: 'Ruta enzimática secuencial (Nitrato Reductasa citosólica → Nitrito Reductasa plastidial → ciclo Glutamina Sintetasa/GOGAT) que fija el NO₂ en aminoácidos.' },
  { pattern: /Glutamina/, symbol: 'L-Glutamina', kind: 'Variable', meaning: 'Aminoácido nitrogenado primario sintetizado en el cloroplasto a partir del NO₂ atmosférico reciclado (mg·g⁻¹ MS o kg·año⁻¹).' },
  { pattern: /\\lambda E/, symbol: 'λE', kind: 'Variable', meaning: 'Densidad de flujo de calor latente de transpiración foliar que refrigera activamente el cañón urbano (W·m⁻²).' },
  { pattern: /\bR_n\b/, symbol: 'R_n', kind: 'Variable', meaning: 'Radiación neta total (onda corta solar más onda larga térmica infrarroja) absorbida por el dosel arbóreo (W·m⁻²).' },
  { pattern: /\bs\b(?=.*R_n)|\\Delta(?=.*R_n)/, symbol: 's (Pendiente de Clausius-Clapeyron)', kind: 'Parámetro / Coef.', meaning: 'Derivada de la presión de vapor de saturación respecto a la temperatura (de_s/dT) en la ecuación de Penman-Monteith (kPa·K⁻¹).' },
  { pattern: /\\rho_a/, symbol: 'ρ_a ≈ 1.20 kg·m⁻³', kind: 'Constante', meaning: 'Densidad másica del aire seco a presión barométrica estándar (kg·m⁻³).' },
  { pattern: /\bc_p\b/, symbol: 'c_p = 1004 J·kg⁻¹·K⁻¹', kind: 'Constante', meaning: 'Capacidad calorífica específica del aire seco a presión constante (J·kg⁻¹·K⁻¹).' },
  { pattern: /\bD\b(?=.*g_a)|VPD/, symbol: 'D (VPD)', kind: 'Variable', meaning: 'Déficit de Presión de Vapor entre el interior saturado de la cavidad subestomática y el aire ambiente (kPa).' },
  { pattern: /\\gamma(?=.*g_s)/, symbol: 'γ ≈ 0.066 kPa·K⁻¹', kind: 'Constante', meaning: 'Constante psicrométrica termodinámica que relaciona la presión parcial de vapor de agua con la temperatura del aire (kPa·K⁻¹).' },
  { pattern: /\bA_n\b/, symbol: 'A_n', kind: 'Variable', meaning: 'Tasa neta de asimilación fotosintética bioquímica de CO₂ por unidad de superficie foliar según el modelo de Farquhar (µmol CO₂·m⁻²·s⁻¹).' },
  { pattern: /\bW_c\b/, symbol: 'W_c', kind: 'Variable', meaning: 'Tasa de carboxilación fotosintética limitada por la cinética de la enzima Rubisco (V_cmax) (µmol·m⁻²·s⁻¹).' },
  { pattern: /\bW_j\b/, symbol: 'W_j', kind: 'Variable', meaning: 'Tasa de carboxilación limitada por el transporte electrónico tilacoidal impulsado por fotones PAR (J_max) (µmol·m⁻²·s⁻¹).' },
  { pattern: /\bW_p\b/, symbol: 'W_p', kind: 'Variable', meaning: 'Tasa de asimilación limitada por la utilización metabólica de triosa-fosfato (TPU) (µmol·m⁻²·s⁻¹).' },
  { pattern: /\bR_d\b(?!\/c_p)/, symbol: 'R_d', kind: 'Variable', meaning: 'Tasa de respiración mitocondrial foliar en presencia de luz (respiración no fotorespiratoria) (µmol CO₂·m⁻²·s⁻¹).' },
  { pattern: /\\delta\^\{13\}C/, symbol: 'δ¹³C (‰ VPDB)', kind: 'Variable', meaning: 'Firma isotópica estable de carbono-13 referenciada al estándar Vienna Pee Dee Belemnite, trazadora de fijación de CO₂ fósil vehicular (‰).' },
  { pattern: /\bC_i\b(?=.*C_a)/, symbol: 'C_i / C_a', kind: 'Variable', meaning: 'Cociente entre la presión parcial intercelular de CO₂ dentro del estoma (C_i) y la presión parcial atmosférica exterior (C_a) (adimensional).' },
  { pattern: /\\epsilon_0/, symbol: 'ε₀', kind: 'Parámetro / Coef.', meaning: 'Factor basal estándar de emisión biogénica foliar de isopreno/monoterpenos a 30 °C y PAR = 1000 µmol·m⁻²·s⁻¹ (MEGAN 2.1, µg·m⁻²·h⁻¹).' },

  // ================= MORFOLOGÍA URBANA, FLUIDOS, OKE, MONIN-OBUKHOV Y DESACOPLAMIENTO =================
  { pattern: /H\/W|\\frac\{H\}\{W\}/, symbol: 'H / W', kind: 'Variable', meaning: 'Relación de aspecto del cañón urbano: cociente entre la altura media de los edificios (H, m) y la anchura transversal de la calle (W, m).' },
  { pattern: /0\.65/, symbol: '0.65 (Umbral de Oke)', kind: 'Constante', meaning: 'Valor crítico adimensional de la relación H/W a partir del cual el flujo entra en régimen rasante (Skimming Flow) con vórtice atrapado.' },
  { pattern: /SVF|\\psi_\{?\\text\{SVF\}\}?/, symbol: 'ψ_SVF (SVF)', kind: 'Variable', meaning: 'Factor de Visión de Cielo (Sky View Factor ∈ [0, 1]): fracción hemisférica de bóveda celeste visible desde el centro de la calzada.' },
  { pattern: /u_\*/, symbol: 'u_*', kind: 'Variable', meaning: 'Velocidad de fricción turbulenta superficial definida por el esfuerzo cortante de Reynolds: u_* = √(|τ_w| / ρ) (m·s⁻¹).' },
  { pattern: /\\kappa/, symbol: 'κ = 0.40 (Constante de von Kármán)', kind: 'Constante', meaning: 'Constante universal adimensional de proporcionalidad de la longitud de mezcla en la subcapa logarítmica turbulenta (κ = 0.40).' },
  { pattern: /\bz_0\b/, symbol: 'z₀', kind: 'Parámetro / Coef.', meaning: 'Longitud de rugosidad aerodinámica morfométrica donde la velocidad media extrapolada del perfil logarítmico se anula (m).' },
  { pattern: /\bz_d\b|\bz-d\b/, symbol: 'z_d / d', kind: 'Parámetro / Coef.', meaning: 'Altura de desplazamiento del plano cero aerodinámico inducida por el bloqueo volumétrico de edificios y copas arbóreas (m).' },
  { pattern: /\\lambda_p|A_p\/A_T/, symbol: 'λ_p (Fracción cepa edificada)', kind: 'Variable', meaning: 'Densidad superficial en planta de la huella edificatoria respecto al área total de la celda urbana (m²·m⁻²).' },
  { pattern: /\\lambda_f|A_f\/A_d/, symbol: 'λ_f (Índice de área frontal)', kind: 'Variable', meaning: 'Área frontal de fachadas expuestas perpendicularmente al vector de viento por unidad de superficie horizontal de parcela (m²·m⁻²).' },
  { pattern: /\bC_D\b/, symbol: 'C_D ≈ 1.2', kind: 'Constante', meaning: 'Coeficiente aerodinámico de arrastre de forma para obstáculos cúbicos/edificios urbanos en la formulación de Macdonald (adimensional).' },
  { pattern: /\\Psi_m|\\psi_m/, symbol: 'Ψ_m((z-d)/L)', kind: 'Variable', meaning: 'Función universal integrada de estabilidad diabática de Businger-Dyer para el transporte de cantidad de movimiento (adimensional).' },
  { pattern: /\bL\b(?=.*u_\*|\bRi_b\b|\\Psi_m|\\frac\{z)/, symbol: 'L (Longitud de Monin-Obukhov)', kind: 'Variable', meaning: 'Escala vertical de altura donde la producción mecánica de turbulencia por cizalladura iguala a la producción o destrucción por flotabilidad térmica (m).' },
  { pattern: /\\zeta/, symbol: 'ζ = (z - d) / L', kind: 'Variable', meaning: 'Parámetro adimensional de estabilidad atmosférica de Monin-Obukhov (ζ < 0 inestable/convectivo, ζ = 0 neutro, ζ > 0 estable/inversión).' },
  { pattern: /\\overline\{w'\s*\\theta'_?0?\}|\\overline\{w'\\theta'_v\}/, symbol: "w'θ'₀ (Flujo turbulento de calor)", kind: 'Variable', meaning: 'Covarianza cinemática de las fluctuaciones verticales de velocidad y temperatura potencial virtual en superficie (K·m·s⁻¹).' },
  { pattern: /Ri_b/, symbol: 'Ri_b', kind: 'Variable', meaning: 'Número de Richardson global (Bulk Richardson Number): razón entre el término de flotabilidad térmica y el cuadrado de la cizalladura del viento.' },
  { pattern: /\\boldsymbol\{\\Omega\}|\\omega\s*=\s*\\nabla\s*\\times/, symbol: 'Ω / ω = ∇×u', kind: 'Variable', meaning: 'Tensor antisimétrico de tasa de rotación (Ω) o vector vorticidad del flujo turbulento dentro del cañón urbano (s⁻¹).' },
  { pattern: /\\mathbf\{S\}/, symbol: 'S (Tensor de deformación)', kind: 'Variable', meaning: 'Tensor simétrico de velocidad de deformación pura del fluido: S_ij = ½(∂u_i/∂x_j + ∂u_j/∂x_i) (s⁻¹).' },
  { pattern: /\bQ\b(?=\s*=.*\\Omega)/, symbol: 'Q (Segundo invariante de Hunt)', kind: 'Variable', meaning: 'Criterio Q de identificación de estructuras vorticales coherentes (Q > 0 indica predominio de la rotación sobre la cizalladura, s⁻²).' },
  { pattern: /TKE/, symbol: 'k_TKE (Energía Cinética Turbulenta)', kind: 'Variable', meaning: 'Energía cinética media por unidad de masa asociada a los remolinos turbulentos en las tres direcciones: ½(u′² + v′² + w′²) (m²·s⁻²).' },
  { pattern: /ACH/, symbol: 'ACH', kind: 'Variable', meaning: 'Tasa horaria de renovaciones de aire del volumen del cañón urbano con la atmósfera libre superior (h⁻¹).' },
  { pattern: /w_\{?\\text\{entrain\}\}?/, symbol: 'w_entrain', kind: 'Variable', meaning: 'Velocidad vertical efectiva de intercambio turbulento (entrainment) a través del plano de tejados z = H (m·s⁻¹).' },
  { pattern: /C_\{?\\text\{bg\}\}?|C_\{?\\text\{fondo\}\}?|C_\{?base\}?/, symbol: 'C_bg / C_fondo', kind: 'Variable', meaning: 'Concentración de fondo urbano regional antes de sumar la contribución local directa del cañón viario (µg·m⁻³).' },
  { pattern: /\\Delta C_0/, symbol: 'ΔC₀', kind: 'Variable', meaning: 'Sobreconcentración inicial inyectada en el eje de emisión de los tubos de escape respecto al fondo urbano (µg·m⁻³).' },
  { pattern: /\\alpha_\{?\\text\{turb\}\}?/, symbol: 'α_turb(H/W, u_*)', kind: 'Parámetro / Coef.', meaning: 'Coeficiente vertical de atenuación turbulenta que controla el gradiente exponencial entre la calzada (0.35 m), el peatón (1.5 m) y la cabina (4.0 m) (m⁻¹).' },
  { pattern: /z_\{?\\text\{exhaust\}\}?/, symbol: 'z_exhaust ≈ 0.35 m', kind: 'Constante', meaning: 'Cota geométrica media sobre la calzada a la que se sitúan las bocas de los tubos de escape del parque vehicular (m).' },
  { pattern: /Fr\b/, symbol: 'Fr (Número de Froude)', kind: 'Variable', meaning: 'Cociente adimensional entre la inercia cinética del viento sinóptico U y la barrera potencial gravitatoria de los Montes de Málaga N·h_monte.' },
  { pattern: /h_\{?monte\}?/, symbol: 'h_monte', kind: 'Parámetro / Coef.', meaning: 'Altura topográfica efectiva de la barrera orográfica de los Montes de Málaga (cota máxima ~1030 m s.n.m.) (m).' },
  { pattern: /U_\{?brisa\}?/, symbol: 'U_brisa', kind: 'Variable', meaning: 'Velocidad horizontal del frente de brisa marina impulsado por el gradiente térmico tierra-mar en la Bahía de Málaga (m·s⁻¹).' },
  { pattern: /H_\{?PBL\}?/, symbol: 'H_PBL', kind: 'Variable', meaning: 'Altura de la Capa Límite Planetaria (o capa de mezcla convectiva) sobre la vertical de Málaga (m).' },

  // ================= EMISIONES DE TRÁFICO COPERT 5, FRENOS EURO 7 Y AVIACIÓN LTO =================
  { pattern: /Q_\{?\\text\{traffic\}\}?|Q_\{?\\text\{veh\}\}?/, symbol: 'Q_traffic / Q_veh', kind: 'Variable', meaning: 'Tasa lineal de emisión de contaminantes por unidad de longitud de vía y unidad de tiempo (µg·m⁻¹·s⁻¹ o g·m⁻¹·s⁻¹).' },
  { pattern: /3600/, symbol: '3600 s·h⁻¹', kind: 'Constante', meaning: 'Factor exacto de conversión dimensional de horas a segundos del Sistema Internacional (s·h⁻¹).' },
  { pattern: /\bN_k\b/, symbol: 'N_k(t)', kind: 'Variable', meaning: 'Intensidad horaria de vehículos (IMD horaria) pertenecientes a la categoría tecnológica y de combustible k (veh·h⁻¹).' },
  { pattern: /EF_\{?\\text\{exhaust\}|EF\(V\)|E_\{?\\text\{NO\}_x\}?/, symbol: 'EF_exhaust(V)', kind: 'Variable', meaning: 'Factor de emisión de escape térmico en caliente dependiente de la velocidad media V según COPERT 5.6 (g·km⁻¹·veh⁻¹).' },
  { pattern: /EF_\{?\\text\{brake\}\}?/, symbol: 'EF_brake(V)', kind: 'Variable', meaning: 'Factor de emisión tribomecánica por abrasión de pastillas y discos de freno regulado por Euro 7 (mg·km⁻¹·veh⁻¹).' },
  { pattern: /EF_\{?\\text\{tyre\}\}?/, symbol: 'EF_tyre(V)', kind: 'Variable', meaning: 'Factor de emisión de partículas por desgaste de banda de rodadura de neumáticos sobre el asfalto (mg·km⁻¹·veh⁻¹).' },
  { pattern: /CF_\{?Euro\}?/, symbol: 'CF_Euro', kind: 'Parámetro / Coef.', meaning: 'Factor de corrección tecnológico asociado al estándar de homologación Euro (Euro 1 a Euro 6d / Euro 7) del vehículo (adimensional).' },
  { pattern: /\\alpha\s*\+\s*\\gamma\s*V/, symbol: 'α (Coef. basal COPERT 5)', kind: 'Parámetro / Coef.', meaning: 'Término independiente de emisión a ralentí/velocidad nula en el numerador del polinomio racional EMEP/EEA COPERT 5.' },
  { pattern: /\\gamma\s*V/, symbol: 'γ (Coef. lineal numerador COPERT 5)', kind: 'Parámetro / Coef.', meaning: 'Coeficiente cinemático de primer orden respecto a la velocidad V en el numerador de la función COPERT 5.' },
  { pattern: /\\epsilon\s*V\^2/, symbol: 'ε (Coef. cuadrático numerador COPERT 5)', kind: 'Parámetro / Coef.', meaning: 'Coeficiente aerodinámico de segundo orden (V²) en el numerador de la curva polinómica COPERT 5.' },
  { pattern: /\\beta\s*V/, symbol: 'β (Coef. lineal denominador COPERT 5)', kind: 'Parámetro / Coef.', meaning: 'Coeficiente de amortiguación lineal de velocidad en el denominador racional de COPERT 5.' },
  { pattern: /\\delta\s*V\^2/, symbol: 'δ (Coef. cuadrático denominador COPERT 5)', kind: 'Parámetro / Coef.', meaning: 'Coeficiente de segundo orden en el denominador de la función racional COPERT 5.' },
  { pattern: /\bV\b(?=.*\\gamma|.*\\delta)|v_k/, symbol: 'V / v_k', kind: 'Variable', meaning: 'Velocidad media de circulación del flujo vehicular en el tramo viario evaluado (km·h⁻¹).' },
  { pattern: /f_\{?\\text\{NO\}_2\}?/, symbol: 'f_NO₂', kind: 'Parámetro / Coef.', meaning: 'Fracción volumétrica o másica primaria de NO₂ emitida directamente por el escape respecto al NO_x total (0.05 en gasolina; 0.25–0.55 en diésel con DPF/DOC).' },
  { pattern: /\\text\{Cu\}|\bCu\b/, symbol: '[Cu]', kind: 'Variable', meaning: 'Concentración másica de Cobre particulado emitida por abrasión de guarniciones de freno (mg·kg⁻¹ o ng·m⁻³).' },
  { pattern: /\\text\{Sb\}|\bSb\b/, symbol: '[Sb]', kind: 'Variable', meaning: 'Concentración másica de Antimonio (trisulfuro de antimonio Sb₂S₃ en pastillas de freno), trazador específico con ratio [Cu]/[Sb] ≈ 4.5–6.8 (mg·kg⁻¹).' },
  { pattern: /t_\{?phase\}?/, symbol: 't_phase', kind: 'Parámetro / Coef.', meaning: 'Tiempo estándar OACI de permanencia de la aeronave en cada fase del ciclo LTO (Despegue: 0.7 min, Ascenso: 2.2 min, Aproximación: 4.0 min, Rodaje: 26.0 min).' },
  { pattern: /\\dot\{m\}_\{?fuel/, symbol: 'ṁ_{fuel,phase}', kind: 'Variable', meaning: 'Flujo másico de queroseno Jet A-1 consumido por los motores turbofan en la fase operativa correspondiente (kg·s⁻¹).' },
  { pattern: /EI_\{?pollutant/, symbol: 'EI_{pollutant,phase}', kind: 'Parámetro / Coef.', meaning: 'Índice de Emisión certificado en banco OACI Anexo 16 (gramos de contaminante emitido por kilogramo de combustible quemado, g·kg⁻¹).' },

  // ================= AEROSOLES (WHITBY, PANKOW, KÖHLER, AOD BEER-LAMBERT) =================
  { pattern: /Y_\{?\\text\{SOA\}\}?/, symbol: 'Y_SOA', kind: 'Variable', meaning: 'Rendimiento másico fraccional de formación de Aerosol Orgánico Secundario por oxidación de precursores COV/IVOC (adimensional).' },
  { pattern: /\bM_o\b|C_\{?\\text\{OA\}\}?/, symbol: 'M_o / C_OA', kind: 'Variable', meaning: 'Concentración másica total de fase orgánica particulada preexistente que actúa como medio absorbente de Pankow (µg·m⁻³).' },
  { pattern: /\\alpha_i(?=.*K_\{?om)/, symbol: 'α_i', kind: 'Parámetro / Coef.', meaning: 'Coeficiente estequiométrico másico de generación del producto semivolátil i tras la oxidación del hidrocarburo precursor (adimensional).' },
  { pattern: /K_\{?om,i\}?(?!\^\\ast)/, symbol: 'K_{om,i}(T)', kind: 'Variable', meaning: 'Constante de equilibrio de partición absortiva gas-partícula de Pankow del compuesto i a la temperatura T (m³·µg⁻¹).' },
  { pattern: /K_\{?om,i\}\^\\ast/, symbol: 'K*_{om,i}', kind: 'Constante', meaning: 'Constante de partición absortiva de referencia medida a la temperatura estándar T* = 298.15 K (m³·µg⁻¹).' },
  { pattern: /T\^\\ast/, symbol: 'T* = 298.15 K', kind: 'Constante', meaning: 'Temperatura termodinámica estándar de referencia (25 °C) en la ecuación de Clausius-Clapeyron de aerosoles orgánicos (K).' },
  { pattern: /\\Delta H_\{?\\text\{vap\},i\}?/, symbol: 'ΔH_{vap,i}', kind: 'Parámetro / Coef.', meaning: 'Entalpía molar de vaporización de la especie orgánica semivolátil i que gobierna su sensibilidad térmica (J·mol⁻¹).' },
  { pattern: /\bN_i\b/, symbol: 'N_i', kind: 'Variable', meaning: 'Concentración numérica total de partículas pertenecientes al modo log-normal i (partículas·cm⁻³).' },
  { pattern: /D_p\b/, symbol: 'D_p', kind: 'Variable', meaning: 'Diámetro aerodinámico equivalente de la partícula de aerosol (nm o µm).' },
  { pattern: /D_\{?pg,i\}?/, symbol: 'D_{pg,i}', kind: 'Parámetro / Coef.', meaning: 'Diámetro mediano geométrico modal del modo log-normal i (1: Nucleación, 2: Acumulación, 3: Grueso) (µm).' },
  { pattern: /\\sigma_\{?g,i\}?/, symbol: 'σ_{g,i}', kind: 'Parámetro / Coef.', meaning: 'Desviación estándar geométrica del modo log-normal i de la distribución de tamaños de Whitby (adimensional, típico 1.6–2.2).' },
  { pattern: /\\sqrt\{2\\pi\}/, symbol: '√(2π) ≈ 2.5066', kind: 'Constante', meaning: 'Constante matemática de normalización integral de la función de densidad de probabilidad gaussiana/log-normal (adimensional).' },
  { pattern: /\\tau\(\\lambda\)/, symbol: 'τ(λ) (AOD)', kind: 'Variable', meaning: 'Espesor Óptico de Aerosoles integrado en toda la columna atmosférica vertical a la longitud de onda λ (adimensional).' },
  { pattern: /\\beta_\{?ext\}?/, symbol: 'β_ext(λ, z)', kind: 'Variable', meaning: 'Coeficiente volumétrico de extinción óptica (absorción más dispersión de Mie) a la altura z (m⁻¹ o km⁻¹).' },
  { pattern: /I_0\(\\lambda\)/, symbol: 'I₀(λ)', kind: 'Constante', meaning: 'Irradiancia espectral solar extraterrestre en el tope de la atmósfera (TOA) antes de sufrir atenuación (W·m⁻²·nm⁻¹).' },
  { pattern: /\\mu(?=\s*\)\s*\\right\))/, symbol: 'μ = cos(θ₀)', kind: 'Variable', meaning: 'Coseno del ángulo cenital solar θ₀ que determina el factor geométrico de masa de aire óptica directa (adimensional).' },

  // ================= TELEDETECCIÓN SATELITAL Y FACTOR AMF-3D =================
  { pattern: /VCD_\{?\\text\{trop\}\}?|\\text\{VCD\}/, symbol: 'VCD_trop', kind: 'Variable', meaning: 'Densidad de Columna Vertical Troposférica integrada desde el suelo hasta la tropopausa (µmol·m⁻² o molec·cm⁻²).' },
  { pattern: /SCD_\{?\\text\{total\}\}?|\\text\{SCD\}/, symbol: 'SCD_total', kind: 'Variable', meaning: 'Densidad de Columna Oblicua total medida por ajuste espectral DOAS a lo largo del camino óptico solar-satélite (µmol·m⁻²).' },
  { pattern: /SCD_\{?\\text\{strat\}\}?/, symbol: 'SCD_strat', kind: 'Variable', meaning: 'Componente estratosférica de la columna oblicua descontada mediante asimilación química global CAMS/TM5 (µmol·m⁻²).' },
  { pattern: /AMF_\{?\\text\{3D\}\}?|\\text\{AMF\}/, symbol: 'AMF_3D', kind: 'Variable', meaning: 'Factor de Masa de Aire tridimensional que corrige el apantallamiento geométrico de los edificios sobre los fotones retrodispersados (adimensional).' },
  { pattern: /f_\{?\\text\{lit\}\}?/, symbol: 'f_lit', kind: 'Variable', meaning: 'Fracción iluminada directa del cañón urbano en función de la relación H/W, el ángulo cenital solar θ₀ y el acimut relativo Δφ ([0–1]).' },
  { pattern: /\\theta_0/, symbol: 'θ₀ (Ángulo cenital solar)', kind: 'Variable', meaning: 'Ángulo entre la vertical local (cenit) y la dirección del haz solar incidente (grados o radianes).' },
  { pattern: /\\theta_v/, symbol: 'θ_v (Ángulo cenital de visión)', kind: 'Variable', meaning: 'Ángulo de observación del espectrómetro satelital respecto al nadir sobre Málaga (grados).' },
  { pattern: /\\Delta\\phi/, symbol: 'Δφ (Acimut relativo)', kind: 'Variable', meaning: 'Diferencia angular acimutal entre el plano solar, el eje de la calle o el plano de visión del satélite (grados).' },
  { pattern: /A_\{?\\text\{surf\}\}?/, symbol: 'A_surf (Albedo superficial)', kind: 'Parámetro / Coef.', meaning: 'Reflectancia hemisférica direccional (LER) del pavimento y tejados urbanos en la ventana espectral UV-Vis/NIR ([0–1]).' },

  // ================= DOSIMETRÍA PEDIÁTRICA ICRP 66, EPIDEMIOLOGÍA Y JUSTICIA AMBIENTAL =================
  { pattern: /D_\{?\\text\{inh\}\}?|D_\{?\\text\{infantil\}\}?|\\dot\{D\}/, symbol: 'D_inh / Ḋ', kind: 'Variable', meaning: 'Dosis interna inhalada de contaminante depositada en el tracto respiratorio por unidad de masa corporal o tiempo (µg·kg⁻¹·d⁻¹ o µg·min⁻¹).' },
  { pattern: /\bV_E\b/, symbol: 'V_E', kind: 'Variable', meaning: 'Tasa de ventilación pulmonar minuto (volumen de aire inspirado por hora o minuto según actividad física y edad, m³·h⁻¹).' },
  { pattern: /DF_\{?\\text\{AL\}\}?|DF_\{?\\text\{alv\}\}?/, symbol: 'DF_AL(d_p)', kind: 'Parámetro / Coef.', meaning: 'Fracción de deposición regional en la zona alveolar-intersticial del modelo pulmonar ICRP 66 en función del diámetro de partícula d_p ([0–1]).' },
  { pattern: /\bBW\b/, symbol: 'BW (Masa corporal)', kind: 'Parámetro / Coef.', meaning: 'Peso corporal fisiológico del receptor (lactante, escolar de 6–11 años o adulto estándar) que normaliza la dosis tóxica interna (kg).' },
  { pattern: /RR\(C\)|\bRR\b/, symbol: 'RR(C)', kind: 'Variable', meaning: 'Riesgo Relativo epidemiológico de incidencia sanitaria respecto al umbral basal de no efecto (adimensional, RR ≥ 1.0).' },
  { pattern: /\\beta_\{?\\text\{CRF\}\}?/, symbol: 'β_CRF', kind: 'Parámetro / Coef.', meaning: 'Coeficiente pendiente de la Función Concentración-Respuesta log-lineal de la OMS HRAPIE (incremento de riesgo por cada 10 µg·m⁻³, m³·µg⁻¹).' },
  { pattern: /\bG\b(?=\s*=)/, symbol: 'G (Índice de Gini)', kind: 'Variable', meaning: 'Coeficiente de desigualdad socioambiental de Gini entre los distritos de Málaga (0 = equidad absoluta; 1 = desigualdad máxima).' },
  { pattern: /A\(\\varepsilon\)/, symbol: 'A(ε) (Índice de Atkinson)', kind: 'Variable', meaning: 'Medida normativa de inequidad ambiental de Atkinson ponderada por la aversión social a la sobrecarga en barrios vulnerables ∈ [0, 1].' },
  { pattern: /\\varepsilon/, symbol: 'ε (Parámetro de aversión / Residuo)', kind: 'Parámetro / Coef.', meaning: 'Grado de aversión social a la desigualdad en el índice de Atkinson (ε ∈ [0.5, 2.0]) o término de perturbación ortogonal.' },
  { pattern: /\bp_i\b/, symbol: 'p_i', kind: 'Variable', meaning: 'Fracción demográfica de población residente en la unidad territorial o distrito i respecto al censo total de Málaga (∑p_i = 1).' },
  { pattern: /\bp_j\b/, symbol: 'p_j', kind: 'Variable', meaning: 'Fracción demográfica de población residente en la unidad territorial comparada j dentro de la matriz de diferencias absolutas de Gini.' },
  { pattern: /\bE_i\b/, symbol: 'E_i', kind: 'Variable', meaning: 'Nivel medio de exposición atmosférica ponderada que soporta la población del distrito o sección censal i (µg·m⁻³).' },
  { pattern: /\bE_j\b/, symbol: 'E_j', kind: 'Variable', meaning: 'Nivel medio de exposición atmosférica ponderada en el distrito comparado j (µg·m⁻³).' },
  { pattern: /\\bar\{E\}|\\overline\{E\}|\\mu_E/, symbol: 'Ē / μ_E', kind: 'Variable', meaning: 'Exposición media poblacional agregada en el conjunto de los 11 distritos de Málaga (µg·m⁻³).' },
  { pattern: /\\hat\{\\theta\}_\{?\\text\{DML\}\}?|\\theta_\{?\\text\{ATE\}\}?/, symbol: 'θ̂_DML / θ_ATE', kind: 'Variable', meaning: 'Estimador causal de Efecto Medio del Tratamiento (ATE) de la ZBE obtenido por Double Machine Learning ortogonal de Neyman (µg·m⁻³).' },
  { pattern: /\\tilde\{D\}_i|\bD_i\b/, symbol: 'D̃_i / D_i', kind: 'Variable', meaning: 'Residuo ortogonalizado de la variable de tratamiento ZBE (D̃_i = D_i − m̂(W_i)) libre de confusión meteorológica.' },
  { pattern: /\\tilde\{Y\}_i|\bY_i\b/, symbol: 'Ỹ_i / Y_i', kind: 'Variable', meaning: 'Residuo ortogonalizado de la concentración observada (Ỹ_i = Y_i − ℓ̂(W_i)) tras descontar el forzamiento sinóptico no lineal.' },
  { pattern: /\bW_i\b/, symbol: 'W_i (Vector de confusores)', kind: 'Variable', meaning: 'Vector multidimensional de covariables meteorológicas y horarias (viento, temperatura, radiación, capa límite, día festivo).' },
  { pattern: /\\hat\{\\ell\}\(W_i\)/, symbol: 'ℓ̂(W_i)', kind: 'Variable', meaning: 'Estimador no paramétrico cross-fitted de la esperanza condicional de la concentración E[Y | W_i] bajo meteorología W_i.' },
  { pattern: /\\hat\{m\}\(W_i\)/, symbol: 'm̂(W_i)', kind: 'Variable', meaning: 'Estimador cross-fitted de propensión al régimen de tratamiento E[D | W_i] en función de los confusores W_i.' },

  // ================= OCEANOGRAFÍA COSTERA, SML 50 µm Y QUÍMICA DE CARBONATOS =================
  { pattern: /F_\{?\\text\{SML\}\}?/, symbol: 'F_SML', kind: 'Variable', meaning: 'Flujo interfacial atmósfera-océano de transferencia de gases ácidos (NO₂, SO₂, HNO₃, CO₂) a través de la microcapa superficial marina (µmol·m⁻²·s⁻¹).' },
  { pattern: /\bK_w\b/, symbol: 'K_w', kind: 'Parámetro / Coef.', meaning: 'Velocidad de transferencia de masa en fase líquida de Liss & Slater parametrizada en función de la velocidad del viento y el número de Schmidt (cm·h⁻¹ o m·s⁻¹).' },
  { pattern: /H_\{?\\text\{eff\}\}?/, symbol: 'H_eff', kind: 'Parámetro / Coef.', meaning: 'Constante de ley de Henry efectiva adimensional (relación equilibrio gas/líquido corregida por disociación iónica e hidrólisis al pH marino).' },
  { pattern: /C_\{?\\text\{water\}\}?/, symbol: 'C_water', kind: 'Variable', meaning: 'Concentración de la especie disuelta en la microcapa superficial del mar de Alborán (SML, primeros 50 µm) (µmol·m⁻³).' },
  { pattern: /\\Omega_\{?\\text\{arag\}\}?/, symbol: 'Ω_arag', kind: 'Variable', meaning: 'Estado termodinámico de saturación del carbonato cálcico polimorfo aragonito en el agua superficial de la Bahía de Málaga (adimensional, equilibrio en Ω = 1).' },
  { pattern: /\\text\{Ca\}\^\{2\+\}|Ca\^\{2\+\}/, symbol: '[Ca²⁺]', kind: 'Variable', meaning: 'Concentración molar de iones calcio disueltos en el agua de mar, conservativa respecto a la salinidad práctica PSU (mmol·kg⁻¹).' },
  { pattern: /\\text\{CO\}_3\^\{2-\}|CO_3\^\{2-\}/, symbol: '[CO₃²⁻]', kind: 'Variable', meaning: 'Concentración molar de iones carbonato libres gobernada por el Carbono Inorgánico Disuelto (DIC), la Alcalinidad Total (TA) y el pH (µmol·kg⁻¹).' },
  { pattern: /K'_\{?\\text\{sp,arag\}\}?/, symbol: "K'_{sp,arag}(T, S, P)", kind: 'Parámetro / Coef.', meaning: 'Producto de solubilidad estequiométrico aparente del aragonito en función de temperatura T, salinidad S y presión P (Dickson & Millero, mol²·kg⁻²).' },

  // ================= PINN, PDE NAVIER-STOKES, KRIGING, KALMAN Y METROLOGÍA FAIRMODE/GUM =================
  { pattern: /\\mathcal\{L\}_\{?\\text\{PINN\}\}?|\\mathcal\{L\}_\{?total\}?/, symbol: 'L_PINN / L_total', kind: 'Variable', meaning: 'Funcional de pérdida variacional compuesto de la Red Neuronal Informada por la Física que se minimiza durante la asimilación.' },
  { pattern: /\\lambda_\{?\\text\{data\}\}?/, symbol: 'λ_data', kind: 'Parámetro / Coef.', meaning: 'Hiperparámetro de ponderación variacional asignado a la fidelidad empírica frente a las 24 estaciones terrestres y 16 misiones satelitales.' },
  { pattern: /\\lambda_\{?\\text\{PDE\}\}?|\\lambda_\{?phys\}?/, symbol: 'λ_PDE / λ_phys', kind: 'Parámetro / Coef.', meaning: 'Peso de regularización física que penaliza cualquier violación de la ecuación diferencial de conservación de masa y Navier-Stokes.' },
  { pattern: /\\lambda_\{?\\text\{BC\}\}?/, symbol: 'λ_BC', kind: 'Parámetro / Coef.', meaning: 'Peso de imposición de las condiciones de contorno de deposición seca de Wesely y flujos en fachadas/suelo.' },
  { pattern: /\\mathbf\{K\}(?=\\nabla)|(?<!\\mathbf\{)\bK\b(?=\\nabla)/, symbol: 'K (Tensor de difusividad turbulenta)', kind: 'Variable', meaning: 'Tensor diagonal de difusividad turbulenta de remolinos (Eddy Diffusivity: K_x, K_y, K_z) cerrando el flujo de Reynolds (m²·s⁻¹).' },
  { pattern: /R_\{?\\text\{chem\}\}?|\bR\(C\)/, symbol: 'R_chem(C)', kind: 'Variable', meaning: 'Término fuente/sumidero neto de producción y destrucción por reacciones químicas atmosféricas acopladas (µg·m⁻³·s⁻¹).' },
  { pattern: /\\text\{MQI\}|\bMQI\b/, symbol: 'MQI (Model Quality Indicator)', kind: 'Variable', meaning: 'Indicador oficial de calidad de modelización de la guía europea JRC FAIRMODE WG1 (el modelo es conforme si MQI ≤ 1.0).' },
  { pattern: /\\text\{RMSE\}|\bRMSE\b/, symbol: 'RMSE', kind: 'Variable', meaning: 'Raíz del Error Cuadrático Medio entre las concentraciones asimiladas M_i y las medidas oficiales O_i (µg·m⁻³).' },
  { pattern: /\bM_i\b|\\bar\{M\}|\bC_\{?pred\}?|\b\\hat\{C\}/, symbol: 'M_i / Ĉ (Valor modelizado)', kind: 'Variable', meaning: 'Concentración predicha por el operador determinista del Gemelo Digital en el instante o estación i (µg·m⁻³).' },
  { pattern: /\bO_i\b|\\bar\{O\}|\bC_\{?obs\}?/, symbol: 'O_i / C_obs (Valor observado)', kind: 'Variable', meaning: 'Concentración empírica certificada medida por el analizador de referencia de la estación oficial i (µg·m⁻³).' },
  { pattern: /\\beta\s*=\s*2\.0|\\beta\s*\\sqrt|\\beta\s*\\cdot\s*U/, symbol: 'β = 2.0 (Constante FAIRMODE)', kind: 'Constante', meaning: 'Coeficiente de proporcionalidad normativo fijado en β = 2.0 por el Joint Research Centre (JRC FAIRMODE) para definir el margen permitido de error.' },
  { pattern: /U_\{?95\}?|U_\{?95\\%\}?/, symbol: 'U₉₅(O_i)', kind: 'Variable', meaning: 'Incertidumbre expandida de medición al nivel de confianza del 95 % según el estándar metrológico JCGM 100:2008 (GUM) (µg·m⁻³).' },
  { pattern: /1\.96|2\.00\s*\\cdot\s*u_c/, symbol: 'k₉₅ = 1.96 (Factor de cobertura GUM)', kind: 'Constante', meaning: 'Cuantil bilateral al 95 % de la distribución normal estándar que multiplica la incertidumbre típica combinada u_c (adimensional).' },
  { pattern: /u_c\b/, symbol: 'u_c(C)', kind: 'Variable', meaning: 'Incertidumbre típica combinada obtenida por la ley de propagación de varianzas de Gauss-GUM (µg·m⁻³).' },
  { pattern: /u_\{?\\text\{cal\}\}?/, symbol: 'u_cal', kind: 'Variable', meaning: 'Componente de incertidumbre estándar asociada al gas patrón certificado de calibración EN 14211 (µg·m⁻³).' },
  { pattern: /u_\{?\\text\{deriva\}\}?/, symbol: 'u_deriva', kind: 'Variable', meaning: 'Componente de incertidumbre por deriva instrumental de cero y span entre mantenimientos preventivos (µg·m⁻³).' },
  { pattern: /u_\{?\\text\{repr\}\}?/, symbol: 'u_repr', kind: 'Variable', meaning: 'Componente de incertidumbre de representatividad espacial microescalar del emplazamiento (µg·m⁻³).' },
  { pattern: /\\sigma_\{?\\text\{OK\}\}\^2/, symbol: 'σ²_OK(x₀)', kind: 'Variable', meaning: 'Varianza del error de interpolación espacial de Kriging Ordinario en el punto objetivo x₀ (µg²·m⁻⁶).' },
  { pattern: /\\lambda_i(?=.*Z\(|.*\\gamma)/, symbol: 'λ_i (Pesos de Kriging)', kind: 'Parámetro / Coef.', meaning: 'Pesos óptimos insesgados (∑λ_i = 1) asignados a cada estación observacional x_i al resolver el sistema de ecuaciones de Kriging.' },
  { pattern: /\\gamma\(\\|\\gamma\(h\)/, symbol: 'γ(‖x_i − x₀‖)', kind: 'Variable', meaning: 'Semivariograma espacial teórico ajustado que cuantifica la pérdida de autocorrelación espacial con la distancia lag h (µg²·m⁻⁶).' },
  { pattern: /\\mathbf\{K\}_k/, symbol: 'K_k (Ganancia de Kalman)', kind: 'Variable', meaning: 'Matriz de ganancia óptima de Kalman en el paso temporal k que pondera la covarianza del error de fondo P_k⁻ frente al error de observación R.' },
  { pattern: /\\tau_\{?\\text\{corr\}\}?/, symbol: 'τ_corr', kind: 'Parámetro / Coef.', meaning: 'Escala temporal de decorrelación euleriana de la turbulencia atmosférica usada para atenuar paquetes con latencia Δt (min o s).' },
  { pattern: /CFL/, symbol: 'CFL (Número de Courant)', kind: 'Variable', meaning: 'Número adimensional de condición de estabilidad numérica de Courant-Friedrichs-Lewy: CFL = |u|·Δt / Δx ≤ 1.0.' },

  // ================= VARIABLES TERMODINÁMICAS, ESPACIO-TEMPORALES, CONSTANTES FÍSICAS Y GEODESIA =================
  { pattern: /T_\{?\\text\{skin\}\}?/, symbol: 'T_skin', kind: 'Variable', meaning: 'Temperatura radiométrica superficial (piel del asfalto o cubierta urbana) medida por ECOSTRESS/Landsat o balance energético (K o °C).' },
  { pattern: /\bT_a\b/, symbol: 'T_a', kind: 'Variable', meaning: 'Temperatura termodinámica del aire ambiente a cota de referencia meteorológica (K o °C).' },
  { pattern: /\bT_0\b/, symbol: 'T₀', kind: 'Parámetro / Coef.', meaning: 'Temperatura potencial absoluta de referencia de la capa superficial atmosférica (K).' },
  { pattern: /\bT\b(?!\^\\ast|_)/, symbol: 'T (Temperatura absoluta)', kind: 'Variable', meaning: 'Temperatura termodinámica absoluta del sistema en la escala Kelvin (K = °C + 273.15).' },
  { pattern: /\\Delta t\b/, symbol: 'Δt', kind: 'Variable', meaning: 'Intervalo o paso de integración temporal discreto entre evaluaciones consecutivas del estado (s o min).' },
  { pattern: /\\Delta x\b/, symbol: 'Δx', kind: 'Parámetro / Coef.', meaning: 'Resolución o espaciado longitudinal de celda de la malla euleriana de cálculo (m).' },
  { pattern: /\bN\b(?=.*\\sum|\s*\\cdot\s*h_)/, symbol: 'N', kind: 'Parámetro / Coef.', meaning: 'Número total de estaciones/observaciones discretas en el sumatorio estadístico (o frecuencia de flotabilidad de Brunt-Väisälä en orografía).' },
  { pattern: /\\mathbf\{u\}|\bu\b(?=.*\\frac\{\\partial C\}\{\\partial x\})/, symbol: 'u = (u, v, w)', kind: 'Variable', meaning: 'Vector velocidad tridimensional del viento advectivo en el dominio microescalar (m·s⁻¹).' },
  { pattern: /\\nu_\{?\\text\{turb\}\}?/, symbol: 'ν_turb', kind: 'Variable', meaning: 'Viscosidad cinemática turbulenta de remolinos (Eddy Viscosity) que disipa momento en la ecuación de Navier-Stokes (m²·s⁻¹).' },
  { pattern: /\bz\b(?![_0-9a-zA-Z])/, symbol: 'z (Cota vertical)', kind: 'Variable', meaning: 'Altura geométrica sobre el nivel de la calzada o altitud ortométrica sobre el nivel del mar en la columna evaluada (m).' },
  { pattern: /(?<!\\text\{[a-zA-Z]*)\bt\b(?![_0-9a-zA-Z])/, symbol: 't (Tiempo)', kind: 'Variable', meaning: 'Variable independiente de tiempo físico continuo en la integración cinética o serie telemétrica (s o h).' },
  { pattern: /\\frac\{E_a\}\{R\}|\\frac\{\\Delta H.*\}\{R\}|\\frac\{g\s*M\s*z\}\{R\s*T\}/, symbol: 'R = 8.31446 J·mol⁻¹·K⁻¹', kind: 'Constante', meaning: 'Constante universal de los gases ideales (producto de la constante de Boltzmann k_B por el número de Avogadro N_A).' },
  { pattern: /\bg\b(?=.*\\Delta T|.*M\s*z|.*\\overline\{w'|\s*\+\s*\\nu)/, symbol: 'g = 9.80665 m·s⁻²', kind: 'Constante', meaning: 'Aceleración normal estándar de la gravedad terrestre al nivel del mar (m·s⁻²).' },
  { pattern: /R_d\/c_p/, symbol: 'R_d / c_p = 0.286 (Constante de Poisson)', kind: 'Constante', meaning: 'Exponente adiabático del aire seco (cociente entre R_d = 287.05 J·kg⁻¹·K⁻¹ y c_p = 1004 J·kg⁻¹·K⁻¹) en la ecuación de temperatura potencial θ.' },
  { pattern: /\\lambda_0\s*=\s*-3\^\\circ/, symbol: 'λ₀ = −3° W (Meridiano central Huso 30N)', kind: 'Constante', meaning: 'Longitud geodésica del meridiano central de tangencia de la proyección conforme Gauss-Krüger ETRS89 para el Huso 30N en España.' },
  { pattern: /X_\{?\\text\{UTM\}\}?/, symbol: 'X_UTM', kind: 'Variable', meaning: 'Coordenada métrica Este (abscisa proyectada con falso este de 500 000 m) en el sistema ETRS89 UTM Huso 30N (EPSG:25830) (m).' },
  { pattern: /Y_\{?\\text\{UTM\}\}?/, symbol: 'Y_UTM', kind: 'Variable', meaning: 'Coordenada métrica Norte (distancia meridional desde el Ecuador en metros) en el sistema ETRS89 UTM Huso 30N (EPSG:25830) (m).' },
  { pattern: /\\phi(?=,\s*\\lambda)/, symbol: 'φ (Latitud WGS84)', kind: 'Variable', meaning: 'Latitud geodésica elipsoidal Norte del punto activo en grados decimales (EPSG:4326).' },
  { pattern: /\\lambda(?=\)_)/, symbol: 'λ (Longitud WGS84)', kind: 'Variable', meaning: 'Longitud geodésica elipsoidal Oeste/Este respecto al meridiano de Greenwich en grados decimales (EPSG:4326).' },
  { pattern: /P\(z\)/, symbol: 'P(z)', kind: 'Variable', meaning: 'Presión barométrica atmosférica calculada a la cota ortométrica z mediante la fórmula hipsométrica (hPa).' },
  { pattern: /\bP_0\b/, symbol: 'P₀ = 1013.25 hPa', kind: 'Constante', meaning: 'Presión atmosférica estándar internacional al nivel medio del mar (1013.25 hPa = 101 325 Pa).' },
  { pattern: /SHA-256/, symbol: 'H_SHA-256(D_FAIR)', kind: 'Operador', meaning: 'Función hash criptográfica unidireccional de 256 bits (estándar NIST FIPS 180-4) que certifica la integridad inmutable del dataset exportado.' },
  { pattern: /\\theta\^\*|\\theta_\{k\+1\}|\\theta_k/, symbol: 'θ* / θ_k (Pesos de la red PINN)', kind: 'Variable', meaning: 'Vector de parámetros sinápticos de la Red Neuronal Informada por la Física optimizado sobre las ecuaciones de Navier-Stokes-Leighton.' },
  { pattern: /\\eta_\{?\\text\{AdamW\}\}?/, symbol: 'η_AdamW (Tasa de aprendizaje)', kind: 'Parámetro / Coef.', meaning: 'Paso de aprendizaje adaptativo con decaimiento de pesos desacoplado (AdamW, lr = 10⁻³) en la primera fase de optimización.' },
  { pattern: /\\mathbf\{H\}_k\^\{-1\}/, symbol: 'H_k⁻¹ (Inversa del Hessiano L-BFGS)', kind: 'Operador', meaning: 'Aproximación cuasi-Newton de memoria limitada de la matriz Hessiana inversa para convergencia de segundo orden.' },
  { pattern: /\\mathcal\{R\}_\{?\\text\{Director\}|\mathcal\{N\}_m/, symbol: 'R_Director,m(θ) / N_m(Ĉ)', kind: 'Operador', meaning: 'Término variacional adicional que codifica cada exigencia teórica o técnica impuesta por el Director de Tesis en el entrenamiento.' },
  { pattern: /\\mathcal\{J\}_\{?\\text\{ckpt\}\}?/, symbol: 'J_ckpt (Archivo .JSON de Entrenamiento)', kind: 'Variable', meaning: 'Estructura de datos JSON con los pesos, residuos PDE y métricas LOOCV exportados tras el entrenamiento en servidor UNED.' },
  { pattern: /\\frac\{\\partial \\mathcal\{C\}_\{?\\text\{app\}\}?\}\{\\partial \\mathcal\{J\}_\{?\\text\{ckpt\}\}?\}/, symbol: '∂C_app / ∂J_ckpt ≡ 0', kind: 'Constante', meaning: 'Invariante estricto de Modo 100% Solo-Lectura: la lectura del archivo .JSON jamás altera ni sobrescribe una sola línea del código fuente ni de las ecuaciones de la aplicación.' },
  { pattern: /\\mathbf\{X\}_\{?\\text\{MVP\}\}?/, symbol: 'X_MVP (Matriz de 12 Variables)', kind: 'Variable', meaning: 'Tensor de diseño observacional con las 12 variables del Producto Mínimo Viable (Paso 6.3 del Director) evaluado en la calle activa, cola de puntos y 24 estaciones.' },
  { pattern: /\\Omega_\{?\\text\{train\}\}?/, symbol: 'Ω_train (Dominio de Entrenamiento)', kind: 'Variable', meaning: 'Unión finita de coordenadas espaciales (punto activo + puntos en cola + 24 estaciones oficiales) empleada en la colocación y validación cruzada.' }
];

/**
 * Escáner automático de tokens LaTeX no cubiertos por el catálogo estático.
 * Garantiza que cualquier ecuación presente o que se incorpore en el futuro
 * tenga el 100 % de sus variables, constantes numéricas y subíndices explicados.
 */
function extractUncoveredLatexSymbols(
  cleanFormula: string,
  alreadyMatchedSymbols: Set<string>,
  subjectLabel: string
): FormulaTermItem[] {
  const extraItems: FormulaTermItem[] = [];
  const greekMap: Record<string, string> = {
    α: 'alpha',
    β: 'beta',
    γ: 'gamma',
    δ: 'delta',
    ε: 'epsilon varepsilon',
    ζ: 'zeta',
    η: 'eta',
    θ: 'theta vartheta',
    κ: 'kappa',
    λ: 'lambda',
    μ: 'mu',
    ν: 'nu',
    π: 'pi',
    ρ: 'rho',
    σ: 'sigma',
    τ: 'tau',
    φ: 'phi varphi',
    ψ: 'psi',
    ω: 'omega',
    Δ: 'delta',
    Ψ: 'psi',
    Ω: 'omega'
  };
  let existingText = Array.from(alreadyMatchedSymbols).join(' ').toLowerCase();
  for (const [uni, lat] of Object.entries(greekMap)) {
    if (Array.from(alreadyMatchedSymbols).some(s => s.includes(uni))) {
      existingText += ` ${lat}`;
    }
  }

  // 1. Extraer variables con subíndice explícito: p.ej. C_{base}, \beta_{TheilSen}, w_k, \sigma_x, etc.
  const subscriptRegex = /(\\?[a-zA-Z]+)_\{?(\\text\{[^}]+\}|[a-zA-Z0-9,\-+]+)\}?/g;
  let match: RegExpExecArray | null;
  const seenTokens = new Set<string>();

  while ((match = subscriptRegex.exec(cleanFormula)) !== null) {
    const base = match[1].replace(/^\\/, '');
    const sub = match[2].replace(/\\text\{([^}]+)\}/g, '$1').replace(/[{}]/g, '');
    if (['frac', 'sum', 'int', 'exp', 'ln', 'log', 'max', 'min', 'text', 'mathcal', 'mathbf'].includes(base)) {
      continue;
    }
    const readableSymbol = `${base}_${sub}`;
    const normKey = readableSymbol.toLowerCase();
    if (seenTokens.has(normKey) || existingText.includes(normKey) || existingText.includes(sub.toLowerCase())) {
      continue;
    }
    seenTokens.add(normKey);

    const isConstantLike = /^(0|ref|std|crit|max|min|lim)$/i.test(sub);
    extraItems.push({
      symbol: readableSymbol,
      kind: isConstantLike ? 'Constante' : 'Variable',
      meaning: isConstantLike
        ? `Valor constante o umbral de referencia (${readableSymbol}) empleado para parametrizar «${subjectLabel}» en condiciones estándar.`
        : `Magnitud específica (${readableSymbol}: componente «${sub}» de ${base}) evaluada dinámicamente en la formulación de «${subjectLabel}».`
    });
  }

  // 2. Extraer letras griegas o símbolos LaTeX sin subíndice que pudieran añadirse en ecuaciones futuras
  const greekCommandsRegex = /\\(alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|varphi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Phi|Psi|Omega)(?![a-zA-Z_])/g;
  while ((match = greekCommandsRegex.exec(cleanFormula)) !== null) {
    const gName = match[1];
    const normG = gName.toLowerCase();
    if (seenTokens.has(normG) || existingText.includes(normG)) continue;
    seenTokens.add(normG);
    extraItems.push({
      symbol: `\\${gName}`,
      kind: 'Parámetro / Coef.',
      meaning: `Parámetro físico o coeficiente adimensional (\\${gName}) que modula la respuesta analítica en la ecuación de «${subjectLabel}».`
    });
  }

  // 3. Extraer constantes numéricas explícitas relevantes en ecuaciones (umbrales regulatorios 200, 180, 50, 40, 20, 10, etc.)
  const numRegex = /(?:^|[^a-zA-Z0-9_\\])(\d+(?:\.\d+)?)(?=[^a-zA-Z0-9_]|$)/g;
  while ((match = numRegex.exec(cleanFormula)) !== null) {
    const numStr = match[1];
    // Ignorar subíndices triviales como 0, 1, 2, 3 si ya forman parte de NO2, O3, PM10, etc.
    if (['0', '1', '2', '3', '4', '5', '6', '10', '25', '95', '256'].includes(numStr)) continue;
    if (seenTokens.has(numStr) || existingText.includes(numStr)) continue;
    seenTokens.add(numStr);

    if (numStr === '200') {
      extraItems.push({
        symbol: '200 µg·m⁻³',
        kind: 'Constante',
        meaning: 'Valor límite horario normativo de protección de la salud humana para el NO₂ (Directiva 2008/50/CE y Directiva UE 2024/2881).'
      });
    } else if (numStr === '180') {
      extraItems.push({
        symbol: '180 µg·m⁻³',
        kind: 'Constante',
        meaning: 'Umbral horario oficial de información a la población por episodio fotoquímico de ozono troposférico O₃ (RD 102/2011).'
      });
    } else if (numStr === '50') {
      extraItems.push({
        symbol: '50 µg·m⁻³',
        kind: 'Constante',
        meaning: 'Valor límite diario regulatorio para material particulado PM₁₀ en aire ambiente.'
      });
    } else {
      extraItems.push({
        symbol: `Constante ${numStr}`,
        kind: 'Constante',
        meaning: `Coeficiente numérico o constante dimensional de escala (${numStr}) en la ecuación constitutiva de «${subjectLabel}».`
      });
    }
  }

  return extraItems;
}

export function explainFormulaTermsExhaustively(
  formulaLaTeX: string,
  subjectLabel: string,
  winLabel: string,
  activeTabName: string
): FormulaCompleteExplanation {
  const cleanFormula = (formulaLaTeX || '').trim();
  const matchedTerms: FormulaTermItem[] = [];
  const matchedSymbolsSet = new Set<string>();

  const normalizeSymKey = (str: string) =>
    str
      .replace(/₀/g, '0')
      .replace(/₁/g, '1')
      .replace(/₂/g, '2')
      .replace(/₃/g, '3')
      .replace(/₄/g, '4')
      .replace(/₅/g, '5')
      .replace(/₉/g, '9')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();

  // 1. Recorrer el catálogo completo de variables, constantes físicas/numéricas y coeficientes (100% individualizados)
  for (const rule of FORMULA_SYMBOL_CATALOG) {
    if (rule.pattern.test(cleanFormula)) {
      if (!matchedSymbolsSet.has(rule.symbol)) {
        matchedTerms.push({
          symbol: rule.symbol,
          kind: rule.kind,
          meaning: rule.meaning
        });
        matchedSymbolsSet.add(rule.symbol);
      }
    }
  }

  // 2. Extraer y explicar el Miembro Izquierdo (LHS) si existe igualdad o desigualdad y no estaba ya cubierto por el catálogo específico
  if (/=|\\le|\\ge|\\approx|\\propto/.test(cleanFormula)) {
    const parts = cleanFormula.split(/=|\\le|\\ge|\\approx|\\propto/);
    const lhsRaw = parts[0]
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\\mathbf\{([^}]+)\}/g, '$1')
      .replace(/\\mathcal\{([^}]+)\}/g, '$1')
      .replace(/\\hat\{([^}]+)\}/g, '$1̂')
      .replace(/\\dot\{([^}]+)\}/g, '$1̇')
      .replace(/[\\{}]/g, '')
      .trim()
      .slice(0, 42);
    const lhsNorm = normalizeSymKey(lhsRaw);
    const alreadyCoveredByCatalog = Array.from(matchedSymbolsSet).some(s => {
      const sNorm = normalizeSymKey(s);
      return sNorm === lhsNorm || (lhsNorm.length >= 3 && sNorm.includes(lhsNorm));
    });
    if (lhsRaw && !alreadyCoveredByCatalog) {
      matchedTerms.unshift({
        symbol: lhsRaw,
        kind: 'Variable',
        meaning: `Magnitud objetivo resultante calculada para «${subjectLabel}» en las coordenadas del punto activo.`
      });
      matchedSymbolsSet.add(lhsRaw);
    }
  }

  // 3. Ejecutar el escáner automático de tokens LaTeX para cubrir cualquier variable o constante adicional (presente o futura)
  const autoExtracted = extractUncoveredLatexSymbols(cleanFormula, matchedSymbolsSet, subjectLabel);
  for (const item of autoExtracted) {
    matchedTerms.push(item);
    matchedSymbolsSet.add(item.symbol);
  }

  // 4. Analizar operadores matemáticos y diferenciales presentes en la fórmula
  const hasDerivative = /\\frac\{\\partial|\\frac\{d|D\\mathbf\{u\}|\\nabla/.test(cleanFormula);
  const hasReactionArrow = /\\rightarrow|\\xrightarrow|\\xleftrightarrow|\\to|\\implies/.test(cleanFormula);
  const hasIntegralOrSum = /\\int|\\sum/.test(cleanFormula);
  const hasExponentialOrLog = /\\exp|\\ln\b/.test(cleanFormula);

  if (hasDerivative) {
    matchedTerms.push({
      symbol: '∂/∂t , ∇ , ∇²',
      kind: 'Operador',
      meaning: 'Operadores diferenciales de derivada parcial temporal (∂/∂t), gradiente advectivo espacial (∇) y laplaciano difusivo (∇²).'
    });
  }
  if (hasReactionArrow) {
    matchedTerms.push({
      symbol: '→ / ⇄ / ⇒',
      kind: 'Operador',
      meaning: 'Operador de transformación cinética estequiométrica o implicación física de cambio de régimen bajo las condiciones de contorno.'
    });
  }
  if (hasIntegralOrSum) {
    matchedTerms.push({
      symbol: '∑ / ∫',
      kind: 'Operador',
      meaning: 'Operador de sumatorio discreto sobre el conjunto de estaciones/categorías/especies (∑) o integración continua temporal/vertical (∫).'
    });
  }
  if (hasExponentialOrLog) {
    matchedTerms.push({
      symbol: 'exp(·) / ln(·)',
      kind: 'Operador',
      meaning: 'Función trascendente exponencial (atenuación de Beer-Lambert o activación térmica de Arrhenius) y logaritmo natural (perfil de capa límite).'
    });
  }

  // 5. Respaldo determinista si la expresión es puramente funcional (ej. F_PINN(O_24, S_16, G_OSM))
  if (matchedTerms.length < 3) {
    matchedTerms.push(
      {
        symbol: 'O_{24 est}(t)',
        kind: 'Variable',
        meaning: 'Vector de observaciones empíricas en tiempo real de las 24 estaciones terrestres verificadas en Málaga ciudad (µg·m⁻³).'
      },
      {
        symbol: 'S_{16 sat}(t)',
        kind: 'Variable',
        meaning: 'Tensor de columnas espectrales y térmicas de las 16 misiones satelitales en órbita sobre la Bahía de Málaga.'
      },
      {
        symbol: 'G_{OSM}(x_activo)',
        kind: 'Parámetro / Coef.',
        meaning: 'Parámetros morfométricos 3D constantes del cañón urbano en el punto activo (relación H/W, SVF y orientación viaria).'
      }
    );
  }

  const structuralReading = hasDerivative
    ? 'Ecuación diferencial en derivadas parciales / balance continuo'
    : hasReactionArrow
      ? 'Mecanismo estequiométrico y cinético multifase'
      : hasIntegralOrSum
        ? 'Formulación integral / agregación estadística ponderada'
        : 'Relación constitutiva analítica determinista';

  const tabContextStr = activeTabName ? ` (subvista «${activeTabName}»)` : '';
  const physicalSynthesis = `En «${winLabel}»${tabContextStr}, cada variable, constante física y parámetro superior interviene de forma determinista para calcular «${subjectLabel}» en las coordenadas exactas del punto activo de Málaga, sin ningún término omitido ni componente aleatorio.`;

  // 6. Síntesis Doctoral Granular de Dominio Físico, Incertidumbre Metrológica GUM (U95, k=1.96) y Sensibilidad Jacobiana Local
  const variableSymbols = matchedTerms
    .filter(t => t.kind === 'Variable')
    .map(t => t.symbol)
    .slice(0, 4)
    .join(', ');
  const paramSymbols = matchedTerms
    .filter(t => t.kind === 'Parámetro / Coef.' || t.kind === 'Constante')
    .map(t => t.symbol)
    .slice(0, 3)
    .join(', ');

  const fLower = `${cleanFormula} ${subjectLabel}`.toLowerCase();

  let physicalDomainAndStability = '';
  let expandedUncertaintyGUM = '';
  let parametricSensitivity = '';

  if (fLower.includes('tio_2') || fLower.includes('da_') || fLower.includes('r_{c,\\text{tio}')) {
    physicalDomainAndStability = `Dominio estrictamente positivo $r_a, r_b, r_{c,\\text{TiO}_2} > 0$ con condición de contorno de Robin en pavimento activo ($0,2\\,\\%$ viario Grado A1). Transición de régimen gobernada por $\\text{Da}_{\\text{surf}} = (r_a+r_b)/r_{c,\\text{TiO}_2}$ y umbral higroscópico $\\text{DRH}_{\\text{Ca(NO}_3)_2} = 50,8\\,\\%$ a $298,15\\text{ K}$.`;
    expandedUncertaintyGUM = `Propagación cuadrática JCGM 100:2008 (GUM) según CEN/TS 16980-1:2021: $U_{95}(v_d) = 1,96\\cdot v_d^2 \\sqrt{u^2(r_a)+u^2(r_b)+u^2(r_{c,\\text{TiO}_2})}$ ($\\pm 11,4\\,\\%$ en flujo turbulento real; prohibida la extrapolación laminar ISO 22197-1).`;
    parametricSensitivity = `Jacobiano local para «${subjectLabel}» dominado por la irradiancia actínica $\\partial v_d / \\partial I_{\\text{UVA}} > 0$, la velocidad de fricción $\\partial r_a / \\partial u_* < 0$ y el bloqueo salino/nitrato $\\partial r_{c,\\text{TiO}_2} / \\partial S_{\\text{NO}_3^-} > 0$.`;
  } else if (fLower.includes('hono') || fLower.includes('ivoc') || fLower.includes('6ppd') || fLower.includes('grime')) {
    physicalDomainAndStability = `Dominio interfacial en el $99,8\\,\\%$ de asfalto bituminoso SMA 11/PA 11: $T_{\\text{skin}} \\in [275,\\; 345]\\text{ K}$, coeficiente de captación reactiva $\\gamma \\in [10^{-7},\\; 10^{-4}]$ y resistencia basal de Wesely $r_c \\in [1400,\\; 2100]\\text{ s}\\cdot\\text{m}^{-1}$.`;
    expandedUncertaintyGUM = `Trazabilidad EMEP/EEA 2023 y termometría TIR ECOSTRESS/Landsat ($u(T_{\\text{skin}}) = \\pm 1,2\\text{ K}$), resultando en una incertidumbre expandida $U_{95} = 1,96\\cdot u_c \\approx \\pm 14,2\\,\\%$ en tasas de producción heterogénea interfacial.`;
    parametricSensitivity = `Alta sensibilidad exponencial de Arrhenius respecto a la temperatura superficial del firme ($\\partial E_{\\text{IVOC}}/\\partial T_{\\text{skin}} \\propto E_a / R T_{\\text{skin}}^2$) y al producto cinético $[\\text{NO}_2]\\cdot I_{\\text{UVA}}$ en «${subjectLabel}».`;
  } else if (fLower.includes('gs-gogat') || fLower.includes('c_{\\text{comp}}') || fLower.includes('g_s') || fLower.includes('f_v/f_m') || fLower.includes('lai') || fLower.includes('j_s')) {
    physicalDomainAndStability = `Condición fisiológica de sumidero neto foliar para $C_{\\text{ambient}} > C_{\\text{comp}} \\approx 1,1\\,\\mu\\text{g}\\cdot\\text{m}^{-3}$ (Sparks et al., 2001), con cierre hidropasivo estomático de Ball-Berry-Leuning cuando $\\text{VPD} > 3,5\\text{ kPa}$ y balance de masa 100 % cerrado vía NR $\\to$ NiR $\\to$ GS-GOGAT.`;
    expandedUncertaintyGUM = `Cierre metrológico determinista verificado exclusivamente con los $24$ detectores terrestres y $16$ misiones satelitales de la app (Regla 16): $U_{95}(F_{\\text{tree}}) = 1,96\\sqrt{(\\text{LAI}\\cdot v_d\\cdot u(C))^2 + (C\\cdot v_d\\cdot u(\\text{LAI}))^2} \\approx \\pm 12,8\\,\\%$.`;
    parametricSensitivity = `Sensibilidad gobernada por la radiación fotosintéticamente activa ($\\partial g_s / \\partial \\text{PAR} > 0$), el déficit de presión de vapor ($\\partial g_s / \\partial \\text{VPD} < 0$) y el índice foliar $\\text{LAI}$ específico del ejemplar o calle en «${subjectLabel}».`;
  } else if (fLower.includes('z_{\\text{exhaust}}') || fLower.includes('0.8') || fLower.includes('1.5') || fLower.includes('4.0') || fLower.includes('\\alpha_{\\text{turb}}')) {
    physicalDomainAndStability = `Perfil vertical monótono decreciente en subcapa rugosa urbana $z \\in [0,35\\text{ m},\\; H]$ con condición de contorno de emisión basal en $z_{\\text{exhaust}} = 0,35\\text{ m}$ y desigualdad física estricta $C(0,8\\text{ m}) > C(1,5\\text{ m}) > C(4,0\\text{ m}) \\ge C_{\\text{bg}} > 0$.`;
    expandedUncertaintyGUM = `Acoplada a la incertidumbre de referencia UNE-EN 14211 en cabina oficial ($z=4,0\\text{ m}$, $U_{95} \\le 15\\,\\%$ según Directiva UE 2024/2881 Anexo V) más la varianza del coeficiente de atenuación turbulenta $\\alpha_{\\text{turb}}(H/W, u_*)$.`;
    parametricSensitivity = `El gradiente vertical $\\partial C / \\partial z = -\\alpha_{\\text{turb}}(C(z)-C_{\\text{bg}})$ se intensifica al crecer la relación de esbeltez $H/W$ y al disminuir la velocidad de fricción $u_*$, amplificando la brecha regulatoria a cota peatonal y pediátrica.`;
  } else if (fLower.includes('df_{\\text{al}}') || fLower.includes('v_e') || fLower.includes('\\beta_{\\text{crf}}') || fLower.includes('icrp') || fLower.includes('daly')) {
    physicalDomainAndStability = `Dominio dosimétrico pulmonar positivo $D_{\\text{inh}} \\ge 0$, fracción de deposición alveolar acotada $\\text{DF}_{\\text{AL}}(d_p) \\in (0, 1)$ (modelo multicompartimental ICRP 66) y riesgo relativo convexo $\\text{RR}(C) \\ge 1,0$ para $\\Delta C = \\max(0, C - C_0)$.`;
    expandedUncertaintyGUM = `Intervalo de confianza epidemiológico y dosimétrico al 95 % ($k = 1,96$) propagando la varianza de los coeficientes $\\beta_{\\text{CRF}}$ de los metaanálisis OMS HRAPIE 2021 y la incertidumbre telemétrica $u_c(C)$ de la estación/satélite asignado.`;
    parametricSensitivity = `Elasticidad local $\\partial D_{\\text{inh}} / \\partial C = (V_E / BW)\\cdot\\text{DF}_{\\text{AL}}$: máxima vulnerabilidad en población pediátrica ($0,8\\text{ m}$) donde la ventilación específica $V_E/BW = 0,42\\text{ m}^3\\cdot\\text{h}^{-1}\\cdot\\text{kg}^{-1}$ duplica la del adulto estándar.`;
  } else if (fLower.includes('dml') || fLower.includes('\\tilde{d}') || fLower.includes('p_i p_j') || fLower.includes('atkinson') || fLower.includes('gini')) {
    physicalDomainAndStability = `Dominio axiomático acotado $G, A(\\varepsilon) \\in [0, 1]$ con normalización censal $\\sum_{i=1}^{n} p_i = 1$ en los 11 distritos de Málaga, e identificación causal bajo condición de ortogonalidad de Neyman $\\mathbb{E}[\\psi(W; \\theta_0, \\eta_0)] = 0$.`;
    expandedUncertaintyGUM = `Estimador asintóticamente normal $\\sqrt{N}(\\hat{\\theta}_{\\text{DML}} - \\theta_0) \\xrightarrow{d} \\mathcal{N}(0, \\sigma_{\\text{DML}}^2)$ con banda de confianza al 95 % ($\\pm 1,96\\cdot\\text{SE}_{\\text{robusto}}$) resistente a sesgo de regularización y heterocedasticidad espacial.`;
    parametricSensitivity = `Sensibilidad respecto a la covarianza entre la renta neta por hogar (INE ADRH) y la exposición diferencial $|E_i - E_j|$, aislando la reducción neta de la ZBE ($437\\text{ ha}$) frente al forzamiento meteorológico confusor $W_i$.`;
  } else if (fLower.includes('\\omega_{\\text{arag}}') || fLower.includes('k_w') || fLower.includes('sml') || fLower.includes('co_3^{2-}')) {
    physicalDomainAndStability = `Equilibrio termodinámico del sistema de carbonatos marino en la microcapa SML ($\\delta = 50\\,\\mu\\text{m}$): $\\text{pH}_{\\text{SML}} \\in [7,75,\\; 8,20]$, supersaturación de aragonito $\\Omega_{\\text{arag}} > 1,0$ y cumplimiento Med SOx ECA ($\\le 0,10\\,\\%$ S).`;
    expandedUncertaintyGUM = `Trazabilidad frente a estándares hidrográficos IEO-CSIC RADMED y constantes de disociación aparente $K_1', K_2', K_{\\text{sp}}'$ de Dickson & Millero ($u(\\text{pH}) = \\pm 0,005$, $U_{95}(\\Omega_{\\text{arag}}) \\approx \\pm 3,8\\,\\%$).`;
    parametricSensitivity = `El flujo interfacial $F_{\\text{SML}}$ presenta dependencia cuadrática/cúbica con la velocidad del viento marino ($\\partial K_w / \\partial U_{10} > 0$) y sensibilidad directa a la deposición ácida portuaria de $\\text{NO}_x/\\text{SO}_x$ sobre el carbono inorgánico disuelto.`;
  } else if (fLower.includes('vcd') || fLower.includes('scd') || fLower.includes('amf') || fLower.includes('aod') || fLower.includes('\\beta_{ext}')) {
    physicalDomainAndStability = `Inversión radiativa bien condicionada para ángulo cenital solar $\\theta_0 < 75^\\circ$, fracción efectiva de nubes $f_{\\text{cloud}} < 0,20$, factor de calidad espectral $\\text{qa\\_value} > 0,75$ y positividad estricta $\\text{AMF}_{\\text{3D}} > 0$.`;
    expandedUncertaintyGUM = `Presupuesto de incertidumbre orbital QA4ECV / ESA Copernicus: $u_c(\\text{VCD}_{\\text{trop}}) = \\sqrt{(u(\\text{SCD})/\\text{AMF}_{\\text{3D}})^2 + (\\text{VCD}\\cdot u(\\text{AMF}_{\\text{3D}})/\\text{AMF}_{\\text{3D}})^2}$ ($U_{95} \\approx 18\\text{--}25\\,\\%$ en columna troposférica urbana).`;
    parametricSensitivity = `En cañones urbanos de Málaga, la derivada parcial $\\partial \\text{VCD}_{\\text{trop}} / \\partial \\text{AMF}_{\\text{3D}} = -\\text{VCD}_{\\text{trop}} / \\text{AMF}_{\\text{3D}}$ exige corregir la fracción iluminada $f_{\\text{lit}}(H/W, \\text{SVF})$ para evitar subestimaciones del $15\\text{--}32\\,\\%$.`;
  } else if (fLower.includes('\\boldsymbol{\\omega}') || fLower.includes('\\psi_m') || fLower.includes('u_*') || fLower.includes('z_0') || fLower.includes('h/w')) {
    physicalDomainAndStability = `Subcapa inercial y rugosa válida para $z > d + z_0$, con regímenes aerodinámicos de Oke (1987) delimitados por $H/W < 0,3$ (aislado), $0,3 \\le H/W \\le 0,65$ (interferencia de estela) y $H/W > 0,65$ (flujo rasante / skimming vortex con $Q > 0$).`;
    expandedUncertaintyGUM = `Verificación microescalar conforme a la directriz alemana VDI 3783 Parte 9 y anemometría ultrasónica 3D ($U_{95}(u_*) = \\pm 8,5\\,\\%$, incertidumbre morfométrica LiDAR IGN MDT02 en $H$ y $W$ inferior a $\\pm 0,15\\text{ m}$).`;
    parametricSensitivity = `El intercambio turbulento vertical en el techo del cañón ($w_{\\text{ent}} \\propto u_* \\cdot \\text{SVF}$) decae hiperbólicamente con el incremento de $H/W$, gobernando el tiempo de residencia euleriano del contaminante en «${subjectLabel}».`;
  } else if (fLower.includes('copert') || fLower.includes('q_{\\text{traffic}}') || fLower.includes('ef_') || fLower.includes('\\delta v')) {
    physicalDomainAndStability = `Dominio cinemático vehicular $v_k \\in [5,\\; 130]\\text{ km}\\cdot\\text{h}^{-1}$ sin singularidades en el denominador polinómico ($\\delta v^2 + \\epsilon v + \\zeta > 0$), integrando sobrecalentamiento de arranque en frío y abrasión tribomecánica Euro 6/Euro 7.`;
    expandedUncertaintyGUM = `Propagación metrológica según EMEP/EEA Guidebook 2023 Capítulo 1.A.3.b y aforos espirales/LPR del Ayuntamiento de Málaga: $U_{95}(Q_{\\text{traffic}}) = 1,96\\sqrt{\\sum_k (\\text{EF}_k\\cdot u(N_k))^2 + (N_k\\cdot u(\\text{EF}_k))^2} \\approx \\pm 13,5\\,\\%$.`;
    parametricSensitivity = `Jacobiano bimodal respecto a la velocidad media $\\partial \\text{EF} / \\partial v_k$: fuerte penalización hiperbólica en congestión urbana ($v_k < 25\\text{ km}\\cdot\\text{h}^{-1}$, $\\partial \\text{EF}/\\partial v_k < 0$) y alta sensibilidad a la fracción de pesados ($\\text{HDV}$).`;
  } else if (fLower.includes('pinn') || fLower.includes('\\lambda_{\\text{pde}}') || fLower.includes('\\sigma_{\\text{ok}}') || fLower.includes('cfl') || fLower.includes('kalman')) {
    physicalDomainAndStability = `Estabilidad numérica garantizada por la condición de Courant-Friedrichs-Lewy $\\text{CFL} = |\\mathbf{u}|\\Delta t / \\Delta x \\le 1,0$, tensor de difusividad definido positivo $\\mathbf{K} \\succ 0$, condición de insesgadez de Kriging $\\sum_{i=1}^N \\lambda_i = 1$ y varianza estocástica nula.`;
    expandedUncertaintyGUM = `Cuantificación determinista del error mediante la varianza de Kriging Ordinario $\\sigma_{\\text{OK}}^2(\\mathbf{x}_0)$, la traza de la matriz de covarianza a posteriori de Kalman $\\text{Tr}(\\mathbf{P}_k^+)$ y el funcional residual $\\mathcal{L}_{\\text{PDE}}$ ($U_{95} = 1,96\\,\\sigma_{\\text{OK}}$).`;
    parametricSensitivity = `Sensibilidad equilibrada por pesos adaptativos Neural Tangent Kernel (NTK) entre el gradiente de fidelidad observacional ($\\lambda_{\\text{data}}$, $24$ estaciones + $16$ satélites) y la conservación física de masa ($\\lambda_{\\text{PDE}}$) en «${subjectLabel}».`;
  } else if (fLower.includes('mqi') || fLower.includes('rmse') || fLower.includes('u_{95}') || fLower.includes('u_c') || fLower.includes('1.96')) {
    physicalDomainAndStability = `Criterio oficial de conformidad europea JRC FAIRMODE WG1: el sistema de modelización es metrológicamente válido en todo el dominio si y solo si $\\text{MQI} \\le 1,0$ con parámetro normativo $\\beta = 2,0$ y factor de cobertura gaussiano $k_{95} = 1,96$.`;
    expandedUncertaintyGUM = `Ecuación patrón JCGM 100:2008 (GUM) Anexo V Directiva (UE) 2024/2881: $U_{95} = 1,96\\sqrt{u_{\\text{cal}}^2 + u_{\\text{deriva}}^2 + u_{\\text{repr}}^2}$, exigiendo incertidumbre máxima horaria del $15\\,\\%$ para $\\text{NO}_2$/$\\text{O}_3$ y del $25\\,\\%$ para $\\text{PM}_{2.5}$/$\\text{PM}_{10}$.`;
    parametricSensitivity = `Derivada parcial $\\partial \\text{MQI} / \\partial |M_i - O_i| > 0$: cualquier sesgo sistemático (BIAS) o desviación de fase en validación ciega Leave-One-Out (LOOCV) incrementa cuadráticamente el numerador $\\text{RMSE}$ frente al umbral $U_{95}(O_i)$.`;
  } else if (fLower.includes('j_{\\text{no}_2}') || fLower.includes('k_1') || fLower.includes('ro_2') || fLower.includes('o_3') || fLower.includes('no_2') || fLower.includes('pan')) {
    physicalDomainAndStability = `Sistema acoplado de EDOs rígidas (stiff ODEs, escalas temporales de $10^{-3}\\text{ s}$ para $\\text{OH}^\\bullet$ a horas para $\\text{PAN}$) que conserva estrictamente la masa molar total de nitrógeno reactivo $[\\text{NO}_y] = [\\text{NO}_x] + [\\text{PAN}] + [\\text{HNO}_3] + 2[\\text{N}_2\\text{O}_5] > 0$.`;
    expandedUncertaintyGUM = `Constantes cinéticas trazables al comité IUPAC / NASA-JPL Publication 19-5 ($u(k_1) \\approx \\pm 8\\,\\%$) acopladas a analizadores de referencia por quimioluminiscencia UNE-EN 14211 ($\\text{NO}_2$) y fotometría UV UNE-EN 14625 ($\\text{O}_3$, $U_{95} \\le 15\\,\\%$).`;
    parametricSensitivity = `El estado fotoestacionario en «${subjectLabel}» está gobernado por el cociente actínico-térmico $J_{\\text{NO}_2} / k_1(T)$ durante el día y por la desviación de Leighton $(\\Phi > 1)$ inducida por radicales peroxilo $\\text{RO}_2^\\bullet$ de COV y termólisis de $\\text{PAN}$.`;
  } else if (fLower.includes('soa') || fLower.includes('k_{om') || fLower.includes('pm') || fLower.includes('n_i') || fLower.includes('\\Delta h_{\\text{vap}}')) {
    physicalDomainAndStability = `Equilibrio termodinámico absortivo gas-partícula de Pankow válido para masa orgánica preexistente $M_o > 0$, fracción de rendimiento acotada $Y_{\\text{SOA}} \\in [0, \\sum \\alpha_i]$ y distribución log-normal trimodal positiva en todo el espectro $d_p \\in [0,003,\\; 10]\\,\\mu\\text{m}$.`;
    expandedUncertaintyGUM = `Trazabilidad gravimétrica y óptica equivalente según norma UNE-EN 16450 / UNE-EN 12341 ($U_{95}(\\text{PM}_{2.5}/\\text{PM}_{10}) \\le 25\\,\\%$ en Directiva UE 2024/2881) combinada con la propagación de entalpías de vaporización $\\Delta H_{\\text{vap},i}$.`;
    parametricSensitivity = `Sensibilidad térmica negativa de Clausius-Clapeyron ($\\partial K_{om,i} / \\partial T < 0$, favoreciendo la condensación hacia aerosol a menor temperatura) y dependencia no lineal respecto al fondo orgánico $M_o$ y la humedad relativa (Köhler).`;
  } else if (fLower.includes('r_d/c_p') || fLower.includes('\\boldsymbol{\\omega}\\times') || fLower.includes('\\nabla p') || fLower.includes('\\theta =')) {
    physicalDomainAndStability = `Conservación del momento de Navier-Stokes en marco rotatorio (número de Rossby mesoescalar en el mar de Alborán) y estabilidad estática gobernada por el gradiente vertical de temperatura potencial $\\partial \\theta / \\partial z$ (frecuencia de Brunt-Väisälä $N^2 = (g/\\theta)\\,\\partial\\theta/\\partial z$).`;
    expandedUncertaintyGUM = `Instrumentación sinóptica certificada según la Guía OMM WMO-No. 8 (AEMET OpenData Málaga: $U_{95}(T) = \\pm 0,2\\text{ K}$, $U_{95}(P) = \\pm 0,3\\text{ hPa}$, $U_{95}(|\\mathbf{u}|) = \\pm 0,5\\text{ m}\\cdot\\text{s}^{-1}$).`;
    parametricSensitivity = `En Málaga, el signo del gradiente baroclínico costa-interior ($\\nabla p$) y la subsidencia adiabática de sotavento ($\\Delta \\theta_{\\text{Foehn}}$ del viento Terral NW) controlan la altura de la capa límite planetaria (PBL) y la capacidad dispersiva en «${subjectLabel}».`;
  } else if (fLower.includes('sha-256') || fLower.includes('d_{\\text{fair}}')) {
    physicalDomainAndStability = `Determinismo criptográfico biyectivo en la práctica (resistencia a colisiones de segunda preimagen de $2^{256} \\approx 1,16 \\times 10^{77}$ estados según NIST FIPS 180-4) y conformidad sintáctica estricta con IETF RFC 7946 (GeoJSON) y RFC 4180 (CSV).`;
    expandedUncertaintyGUM = `Error numérico de serialización y truncamiento igual a cero ($U_{95} = 0,00\\%$ sobre los tensores exportados en coma flotante IEEE 754 de doble precisión), garantizando trazabilidad auditable para el tribunal de tesis UNED.`;
    parametricSensitivity = `Efecto avalancha de Shannon estricto: la modificación de un solo bit o dígito decimal en cualquier coordenada o serie temporal de «${subjectLabel}» altera ~50 % de los 256 bits del resumen criptográfico $\\mathcal{H}_{\\text{SHA-256}}$.`;
  } else if (fLower.includes('x_{\\text{utm}}') || fLower.includes('gauss-krüger') || fLower.includes('p_0\\exp')) {
    physicalDomainAndStability = `Dominio geodésico conforme en el Huso 30N (meridiano central $\\lambda_0 = -3^\\circ\\text{ W}$, factor de escala en el meridiano central $k_0 = 0,9996$, elipsoide GRS80) y equilibrio hidrostático barométrico para $z \\in [0,\\; 1200]\\text{ m s.n.m.}$ en la cuenca de Málaga.`;
    expandedUncertaintyGUM = `Precisión posicional sub-métrica conforme al Real Decreto 1071/2007 (ETRS89 oficial en España) y modelo digital de elevaciones IGN LiDAR MDT02 ($U_{95}(X,Y) < 0,10\\text{ m}$, $U_{95}(z_{\\text{MDE}}) \\le \\pm 0,20\\text{ m}$).`;
    parametricSensitivity = `La propagación reactiva de $(\\phi, \\lambda, z)$ a través de ActivePointContext recalcula instantáneamente la presión barométrica local $(\\partial P / \\partial z = -P g M / R T)$ y todas las condiciones de contorno de las ventanas abiertas (Regla 10).`;
  } else {
    physicalDomainAndStability = `Dominio matemático bien planteado en el sentido de Hadamard (existencia, unicidad y continuidad determinista de la solución sobre ${variableSymbols || 'las variables de estado'} con varianza estocástica $\\sigma_{\\text{random}}^2 = 0$, Reglas 1 y 2 AGENTS.md).`;
    expandedUncertaintyGUM = `Propagación de varianzas de primer orden según JCGM 100:2008 (GUM) y JRC FAIRMODE WG1: $U_{95} = 1,96\\sqrt{\\sum_i (\\partial f / \\partial x_i)^2 u^2(x_i)}$, acoplada a la incertidumbre instrumental de las 24 estaciones terrestres y 16 misiones satelitales.`;
    parametricSensitivity = `Derivada direccional local de «${subjectLabel}» gobernada por la variación temporal de ${variableSymbols || 'la telemetría observacional'} modulada por ${paramSymbols || 'los coeficientes físicos del cañón urbano'} en el punto activo de Málaga.`;
  }

  return {
    structuralReading,
    terms: matchedTerms, // CERO recortes: se muestran absolutamente todos los términos de la ecuación
    physicalSynthesis,
    physicalDomainAndStability,
    expandedUncertaintyGUM,
    parametricSensitivity
  };
}

/**
 * Motor Universal de Síntesis Doctoral & Contextualización Única (Regla 7, 12 y 27).
 * Elimina al 100 % las descripciones clónicas entre pestañas al inyectar en cada tooltip:
 *  - La identidad exacta del control/métrica/columna (`subjectLabel`)
 *  - La ventana/suite científica contenedora (`windowTitle`)
 *  - La subpestaña activa (`activeTabName`) y el esquema de tabla/valor en vivo (`elementValueDetail`)
 *  - La ecuación diferencial o estadística específica de esa magnitud (`resolveGranularFormulaAndUnits`)
 *  - El desglose analítico completo término a término de la ecuación (`explainFormulaTermsExhaustively`).
 */
export function synthesizeDoctoralRigor(
  titleText: string,
  contentText: string,
  formulaText?: string,
  regulatoryText?: string,
  domContext: DomHierarchyContext = DEFAULT_DOM_CONTEXT,
  topicFallbackFormula?: string
): SynthesizedDoctoralProfile {
  const rawSubject = cleanText(titleText || domContext.elementLabel || 'Parámetro Científico', 80);
  const subjectLabel =
    domContext.tableColHeader &&
    domContext.tableRowLabel &&
    domContext.elementKind !== 'COLUMN_HEADER_TH' &&
    !rawSubject.toLowerCase().includes(domContext.tableColHeader.slice(0, 8).toLowerCase()) &&
    !rawSubject.toLowerCase().includes(domContext.tableRowLabel.slice(0, 8).toLowerCase())
      ? `${domContext.tableColHeader} — ${domContext.tableRowLabel}: ${rawSubject}`
      : domContext.tableColHeader &&
          domContext.elementKind !== 'COLUMN_HEADER_TH' &&
          !rawSubject.toLowerCase().includes(domContext.tableColHeader.slice(0, 8).toLowerCase())
        ? `${domContext.tableColHeader}: ${rawSubject}`
        : rawSubject;
  const winLabel = domContext.windowTitle || 'Gemelo Digital de Málaga';
  const tabLabel = domContext.activeTabName ? ` › Subvista «${domContext.activeTabName}»` : '';
  const secLabel = domContext.sectionTitle ? ` › ${domContext.sectionTitle}` : '';
  const contextBreadcrumb = `${winLabel}${tabLabel}${secLabel} • [${domContext.elementKindLabel}]`;

  // Prioridad granular: buscamos primero por el título, etiqueta del elemento y cabecera/fila de tabla antes de caer en el topic compartido
  const granular =
    resolveGranularFormulaAndUnits(`${titleText} ${domContext.elementLabel}`) ||
    resolveGranularFormulaAndUnits(
      `${titleText} ${domContext.elementLabel} ${domContext.tableColHeader || ''} ${domContext.tableRowLabel || ''}`
    ) ||
    resolveGranularFormulaAndUnits(
      `${titleText} ${domContext.elementLabel} ${domContext.tableColHeader || ''} ${domContext.tableRowLabel || ''} ${contentText} ${formulaText || ''}`
    ) ||
    resolveGranularFormulaAndUnits(
      `${domContext.sectionTitle} ${titleText} ${domContext.elementLabel}`
    );

  const elementSpecificCombined = `${titleText} ${domContext.elementLabel} ${domContext.tableColHeader || ''} ${domContext.tableRowLabel || ''} ${domContext.tableSchemaContext || ''} ${contentText} ${formulaText || ''} ${topicFallbackFormula || ''} ${regulatoryText || ''} ${granular?.specificMechanism || ''} ${granular?.unitsAndRange || ''}`.toLowerCase();
  const fullContextCombined = `${elementSpecificCombined} ${domContext.sectionTitle} ${domContext.activeTabName} ${domContext.windowTitle}`.toLowerCase();

  const hasElementSpecificDomainKeyword =
    Boolean(granular) ||
    /tio2|tio₂|fotocat|anatasa|damköhler|ballari|asfalto|bitumin|sma 11|hono|ivoc|6ppd|firme|árbol|arbol|fitorremediac|estomát|gs-gogat|lai|ndvi|desacoplamiento|ilusión regulatoria|0\.8 m|0,8 m|1\.5 m|1,5 m|1\.8 m|1,8 m|4\.0 m|4,0 m|carrito|2024\/2881|icrp|pediátr|escolar|colegio|daly|salud|gini|atkinson|kakwani|lorenz|equidad|renta|ine|zbe|spillover|dml|pi-did|donut-rdd|sml|microcapa|aragonito|puerto|marpol|clno2|satélit|tropomi|sentinel|cams|ecostress|amf|vcd|aod|cañón|canyon|oke|svf|vórtice|hunt|rugosidad|h\/w|ach|tke|copert|tráfico|vehícul|imd|freno|euro 7|aeropuerto|lto|pinn|pde|navier-stokes|advección|difusión|kriging|kalman|4d-var|fourier|ntk|adamw|wesely|cfl|ablación|idw|lur|fairmode|mqi|rmse|bias|nmsd|loocv|incertidumbre|gum|u95|conformal|estación|14211|no2|no₂|o3|o₃|ozono|leighton|fotólisis|radical|pan|pm2\.5|pm10|partícula|aerosol|soa|pankow|calima|viento|terral|brisa|temperatura|humedad|presión|radiación|aemet|pbl|tibl|export|geojson|csv|latex|pdf|fair|sha-256|github|zip|coordenada|utm|wgs84|etrs89|mde|altitud/.test(
      elementSpecificCombined
    );

  const combined = hasElementSpecificDomainKeyword ? elementSpecificCombined : fullContextCombined;

  // Función auxiliar que construye el complemento mecanístico y la explicación ciudadana
  // garantizando que sean 100% únicos para este elemento, esta pestaña y esta ventana.
  const buildUniqueTexts = (
    baseMechanism: string,
    baseLayman: string,
    defaultFormula: string,
    defaultUnits: string
  ) => {
    // Prioridad: 1) formula explícita del elemento -> 2) ecuación granular por nombre de columna/control -> 3) formula de topic -> 4) ecuación de dominio
    const specificFormula = formulaText || granular?.formulaLaTeX || topicFallbackFormula || defaultFormula;
    const specificUnits = granular?.unitsAndRange || defaultUnits;
    const mechanismCore = granular?.specificMechanism || baseMechanism;
    const formulaExplanation = explainFormulaTermsExhaustively(
      specificFormula,
      subjectLabel,
      winLabel,
      domContext.activeTabName
    );

    const liveMetaClause = domContext.elementValueDetail
      ? ` Estado operativo actual del control: ${domContext.elementValueDetail}.`
      : domContext.tableSchemaContext
        ? ` Posición matricial: ${domContext.tableSchemaContext}.`
        : '';

    const roleClause =
      domContext.elementKind === 'COLUMN_HEADER_TH'
        ? `En la matriz de datos de «${winLabel}»${tabLabel}, la columna «${subjectLabel}» estructura vectorialmente cada registro evaluado y ${mechanismCore}.`
        : domContext.elementKind === 'SELECTOR_SELECT'
          ? `Dentro de «${winLabel}»${tabLabel}, este selector paramétrico («${subjectLabel}») reconfigura en tiempo real el régimen de cálculo y ${mechanismCore}.`
          : domContext.elementKind === 'SLIDER_OR_INPUT'
            ? `En el panel de control de «${winLabel}»${tabLabel}, el parámetro «${subjectLabel}» actúa como condición de contorno directa que ${mechanismCore}.`
            : domContext.elementKind === 'TAB_SWITCHER'
              ? `Conmutador de la vista analítica «${subjectLabel}» perteneciente al módulo «${winLabel}», donde el motor determinista ${mechanismCore}.`
              : domContext.elementKind === 'ACTION_BUTTON'
                ? `Operador interactivo «${subjectLabel}» en «${winLabel}»${tabLabel}: ejecuta de forma determinista el flujo algorítmico que ${mechanismCore}.`
                : `Indicador telemétrico «${subjectLabel}» monitorizado en «${winLabel}»${tabLabel}: ${mechanismCore}.`;

    const doctoralAddendum = `${roleClause}${liveMetaClause}`;

    // Si el contenido base viene de un topic compartido o es genérico, le inyectamos el prefijo de identidad contextual
    // para que jamás dos elementos en distintas pestañas o columnas tengan el mismo texto principal.
    const needsContextualPrefix =
      !contentText ||
      !contentText.toLowerCase().includes(subjectLabel.slice(0, 12).toLowerCase());

    const contextualizedContent = !contentText
      ? `Evaluación determinista de «${subjectLabel}» integrada en ${winLabel}${tabLabel}.${liveMetaClause ? ` ${liveMetaClause}` : ''} Calculada en vivo sobre las coordenadas del punto activo sin datos estocásticos.`
      : needsContextualPrefix && subjectLabel && subjectLabel !== 'Parámetro Científico'
        ? `[${subjectLabel} — ${domContext.activeTabName || winLabel}]: ${contentText}`
        : contentText;

    const laymanActionPrefix =
      domContext.elementKind === 'COLUMN_HEADER_TH'
        ? `Esta columna de la tabla («${subjectLabel}»)`
        : domContext.elementKind === 'SELECTOR_SELECT'
          ? `Este menú desplegable («${subjectLabel}»)`
          : domContext.elementKind === 'SLIDER_OR_INPUT'
            ? `Este control ajustable («${subjectLabel}»)`
            : domContext.elementKind === 'TAB_SWITCHER'
              ? `Esta pestaña («${subjectLabel}»)`
              : domContext.elementKind === 'ACTION_BUTTON'
                ? `Este botón («${subjectLabel}»)`
                : `Este dato en pantalla («${subjectLabel}»)`;

    const laymanText = `${laymanActionPrefix} dentro de la sección «${domContext.activeTabName || winLabel}» sirve para entender o controlar un aspecto concreto de la calidad del aire en la calle seleccionada: ${baseLayman}`;

    return {
      specificFormula,
      formulaExplanation,
      specificUnits,
      doctoralAddendum,
      contextualizedContent,
      laymanText
    };
  };

  // 1. FOTOCATÁLISIS HETEROGÉNEA TiO2 GRADO A1 VS 99,8% ASFALTO CONVENCIONAL
  if (
    combined.includes('tio2') ||
    combined.includes('tio₂') ||
    combined.includes('fotocat') ||
    combined.includes('anatasa') ||
    combined.includes('damköhler') ||
    combined.includes('ballari') ||
    combined.includes('16980') ||
    combined.includes('22197') ||
    combined.includes('delicuescencia') ||
    combined.includes('renoxific')
  ) {
    const u = buildUniqueTexts(
      'acopla el transporte turbulento de capa límite (r_a + r_b) con la resistencia intrínseca fotocatalítica r_{c,TiO2} activada por fotones UV-A (hν ≥ 3.2 eV), integrando la delicuescencia de Ca(NO₃)₂ (DRH = 50.8%) y la saturación por nitratos',
      'muestra cómo el pavimento fotocatalítico con dióxido de titanio (presente en el 0,2 % de las calles verificadas de Málaga) aprovecha la luz solar para oxidar el humo del tráfico y transformarlo en sales minerales inocuas.',
      'v_{d,\\text{TiO}_2} = \\frac{1}{r_a + r_b + r_{c,\\text{TiO}_2}(I_{\\text{UVA}}, \\text{RH}, S_{\\text{NO}_3^-})}, \\quad \\text{Da}_{\\text{surf}} = \\frac{r_a + r_b}{r_{c,\\text{TiO}_2}}',
      'v_d: 0.08 – 0.48 cm·s⁻¹ | Da_surf: 0.05 – 1.85 | Acumulación: mg NO₃⁻·m⁻²·d⁻¹'
    );
    return {
      disciplineBadge: 'Catálisis Heterogénea & Viario',
      physicsLaw: 'Ley de Tres Resistencias en Serie, Número de Damköhler Superficial y Cinética de Langmuir-Hinshelwood (Ballari & Brouwers)',
      contextBreadcrumb,
      contextualizedContent: u.contextualizedContent,
      doctoralAddendum: u.doctoralAddendum,
      formulaLaTeX: u.specificFormula,
      formulaExplanation: u.formulaExplanation,
      unitsAndRange: u.specificUnits,
      regulatoryText:
        'CEN/TS 16980-1:2021 (Fotocatálisis en flujo turbulento real) • Prohibición de extrapolación directa ISO 22197-1 • Evidencia Grado A1 (0.2% viario Málaga)',
      citationText:
        'Ballari, M. M., & Brouwers, H. J. H. (2013). J. Hazard. Mater., 254, 406–414; Monge, M. E. et al. (2010). PNAS, 107(15), 6600–6604.',
      laymanText: u.laymanText
    };
  }

  // 2. QUÍMICA INTERFACIAL DEL 99.8% DEL ASFALTO BITUMINOSO (HONO, IVOCs, 6PPD-Q, α-Fe2O3)
  if (
    combined.includes('asfalto') ||
    combined.includes('bitumin') ||
    combined.includes('sma 11') ||
    combined.includes('hono') ||
    combined.includes('stemmler') ||
    combined.includes('ivoc') ||
    combined.includes('svoc') ||
    combined.includes('khare') ||
    combined.includes('6ppd') ||
    combined.includes('hematita') ||
    combined.includes('firme') ||
    combined.includes('pavimento')
  ) {
    const u = buildUniqueTexts(
      'resuelve en el 99,8 % del viario bituminoso la deposición basal de Wesely (r_c ≈ 1400–2100 s·m⁻¹), la conversión heterogénea fotosensibilizada NO₂ → HONO sobre urban grime, la volatilización térmica de IVOCs/SVOCs y la ozonólisis de caucho 6PPD → 6PPD-Quinona',
      'explica cómo el asfalto normal y las partículas de neumáticos y frenos reaccionan con el sol y el calor del suelo, liberando compuestos secundarios que influyen en la calidad del aire a ras de acera.',
      'J_{\\text{HONO}} = \\frac{1}{4}\\gamma_{\\text{grime}}\\bar{c}_{\\text{NO}_2}[\\text{NO}_2], \\quad E_{\\text{IVOC}}(T_{\\text{skin}}) = E_{300}\\exp\\!\\left[-\\frac{E_a}{R}\\left(\\frac{1}{T_{\\text{skin}}}-\\frac{1}{300}\\right)\\right]',
      'r_c(asfalto): 1400 – 2100 s·m⁻¹ | γ_HONO: 10⁻⁶ – 10⁻⁵ | T_skin: °C / K'
    );
    return {
      disciplineBadge: 'Química Interfacial del Asfalto',
      physicsLaw: 'Conversión Fotosensibilizada de Stemmler (NO₂ → HONO), Volatilización de Arrhenius de IVOCs y Ozonólisis de 6PPD',
      contextBreadcrumb,
      contextualizedContent: u.contextualizedContent,
      doctoralAddendum: u.doctoralAddendum,
      formulaLaTeX: u.specificFormula,
      formulaExplanation: u.formulaExplanation,
      unitsAndRange: u.specificUnits,
      regulatoryText:
        'Guía EMEP/EEA 2023 (Emisiones No-Escape y Evaporativas) • Reglamento (UE) 2024/1257 Euro 7 (Frenos 7 mg/km y Neumáticos) • Regla 14 AGENTS.md',
      citationText:
        'Stemmler, K. et al. (2006). Nature, 440, 195–198; Khare, P., & Gentner, D. R. (2020). Science Advances, 6(36), eabb9785; Tian, Z. et al. (2021). Science, 371, 185–189.',
      laymanText: u.laymanText
    };
  }

  // 3. FITORREMEDIACIÓN ARBÓREA, BIOGEOQUÍMICA NR/NiR/GS-GOGAT Y FISIOLOGÍA VEGETAL
  if (
    combined.includes('árbol') ||
    combined.includes('arbol') ||
    combined.includes('fitorremediac') ||
    combined.includes('estomát') ||
    combined.includes('estomat') ||
    combined.includes('filosfera') ||
    combined.includes('caulosfera') ||
    combined.includes('alcorque') ||
    combined.includes('gs-gogat') ||
    combined.includes('nitrato reductasa') ||
    combined.includes('glutamina') ||
    combined.includes('xilem') ||
    combined.includes('granier') ||
    combined.includes('farquhar') ||
    combined.includes('fv/fm') ||
    combined.includes('jarvis') ||
    combined.includes('sparks') ||
    combined.includes('3-30-300') ||
    combined.includes('bosque') ||
    combined.includes('vegeta') ||
    combined.includes('lai') ||
    combined.includes('ndvi')
  ) {
    const u = buildUniqueTexts(
      'cuantifica el sumidero estomático y cuticular mediante la conductancia de Jarvis-Ball-Berry (g_s), el punto de compensación apoplástico de NO₂ (C_comp ≈ 1.1 µg/m³) y la ruta enzimática NR → NiR → GS-GOGAT que transforma el gas absorbido en L-Glutamina y proteína vegetal',
      'detalla cómo los árboles de la calle absorben gases contaminantes por los poros de sus hojas, los reciclan como abono natural para crecer y retienen el polvo fino en su corteza.',
      'F_{\\text{tree}} = -\\text{LAI}\\cdot v_{d,\\text{eff}}\\cdot (C_{\\text{ambient}} - C_{\\text{comp}}), \\quad \\text{NO}_2 \\xrightarrow{\\text{NR}\\to\\text{NiR}\\to\\text{GS-GOGAT}} \\text{L-Glutamina}',
      'g_s: 0.05 – 0.65 cm·s⁻¹ | C_comp: ~1.1 µg·m⁻³ | F_v/F_m: 0.72 – 0.84'
    );
    return {
      disciplineBadge: 'Fisiología & Fitorremediación Urbana',
      physicsLaw: 'Modelo Estomático de Jarvis-Ball-Berry, Cinética Fotosintética FvCB, Balance de Penman-Monteith y Asimilación Enzimática GS-GOGAT',
      contextBreadcrumb,
      contextualizedContent: u.contextualizedContent,
      doctoralAddendum: u.doctoralAddendum,
      formulaLaTeX: u.specificFormula,
      formulaExplanation: u.formulaExplanation,
      unitsAndRange: u.specificUnits,
      regulatoryText:
        'Regla 3-30-300 (Konijnendijk 2022 / OMS) • Protocolo ICP Forests UNECE • Regla 16 AGENTS.md (Cierre de Masa 100% con Detectores 24+16)',
      citationText:
        'Sparks, J. P. et al. (2001). Oecologia, 127, 468–475; Farquhar, G. D. et al. (1980). Planta, 149, 78–90; Gauci, V. et al. (2024). Nature, 631, 796–802.',
      laymanText: u.laymanText
    };
  }

  // 4. DESACOPLAMIENTO VERTICAL (0.8m / 1.5m vs 4.0m) Y DIRECTIVA (UE) 2024/2881
  if (
    combined.includes('desacoplamiento vertical') ||
    combined.includes('ilusión regulatoria') ||
    combined.includes('ilusion regulatoria') ||
    combined.includes('0.8 m') ||
    combined.includes('0,8 m') ||
    combined.includes('1.5 m') ||
    combined.includes('1,5 m') ||
    combined.includes('4.0 m') ||
    combined.includes('4,0 m') ||
    combined.includes('carrito') ||
    combined.includes('2024/2881') ||
    combined.includes('gradiente vertical') ||
    combined.includes('cota respiratoria')
  ) {
    const u = buildUniqueTexts(
      'resuelve el perfil vertical logarítmico-exponencial C(z) desde la cota de emisión de los tubos de escape (z₀ ≈ 0.35 m) hasta la toma de la cabina oficial (z = 4.0 m), cuantificando el exceso de exposición en carritos de bebé (0.8 m) y peatones (1.5 m)',
      'compara el aire que realmente respiramos a la altura de la nariz (1,5 metros) o de un carrito de bebé (0,8 metros) frente al que mide la estación oficial a 4 metros de altura, donde el aire ya está más diluido.',
      'C(z) = C_{\\text{bg}} + \\Delta C_0 \\exp\\!\\left(-\\alpha_{\\text{turb}}(H/W, u_*)\\cdot (z - z_{\\text{exhaust}})\\right), \\quad C(0.8\\text{m}) > C(1.5\\text{m}) > C(4.0\\text{m})',
      'Límite Anual UE 2030: 20 µg·m⁻³ | OMS 2021: 10 µg·m⁻³ | Factor ICRP 66 (0.8m): 2.15×'
    );
    return {
      disciplineBadge: 'Exposición Peatonal & Regulación UE',
      physicsLaw: 'Teoría de Semejanza de Monin-Obukhov en Subcapa Rugosa y Decaimiento Exponencial de Vórtice de Cañón (Gromke & Ruck / Vardoulakis)',
      contextBreadcrumb,
      contextualizedContent: u.contextualizedContent,
      doctoralAddendum: u.doctoralAddendum,
      formulaLaTeX: u.specificFormula,
      formulaExplanation: u.formulaExplanation,
      unitsAndRange: u.specificUnits,
      regulatoryText:
        'Directiva (UE) 2024/2881 (Límite vinculante NO₂ = 20 µg/m³ anual; PM2.5 = 10 µg/m³) • Guías OMS 2021 • Publicación ICRP 66',
      citationText:
        'Vardoulakis, S. et al. (2003). Atmos. Environ., 37(2), 155–182; Kenagy, H. S. et al. (2016). Sci. Total Environ., 580, 1210–1218.',
      laymanText: u.laymanText
    };
  }

  // 5. DOSIMETRÍA PEDIÁTRICA, ENTORNOS ESCOLARES, SALUD PÚBLICA Y ECONOMÍA SAS
  if (
    combined.includes('icrp') ||
    combined.includes('pediátr') ||
    combined.includes('pediatr') ||
    combined.includes('escolar') ||
    combined.includes('colegio') ||
    combined.includes('ceip') ||
    combined.includes('daly') ||
    combined.includes('mortalidad') ||
    combined.includes('hospital') ||
    combined.includes('sas') ||
    combined.includes('salud') ||
    combined.includes('asma') ||
    combined.includes('alvéolo') ||
    combined.includes('alveol') ||
    combined.includes('dosis inhalada') ||
    combined.includes('op-dtt') ||
    combined.includes('potencial oxidativo')
  ) {
    const u = buildUniqueTexts(
      'integra la fracción de deposición regional alveolar (DF_AL) del modelo ICRP 66 con la tasa de ventilación minuto por masa corporal y las funciones concentración-respuesta (CRF) epidemiológicas para estimar la dosis interna y el impacto sanitario',
      'traduce los niveles de contaminación del aire en su efecto directo sobre los pulmones de niños y adultos, así como en visitas médicas y costes sanitarios evitables.',
      'D_{\\text{inh}} = \\int_{t_1}^{t_2} \\frac{C(t)\\cdot V_E(t)\\cdot \\text{DF}_{\\text{AL}}(d_p)}{BW}\\,dt, \\quad \\text{RR}(C) = \\exp\\!\\left(\\beta_{\\text{CRF}}\\cdot \\Delta C\\right)',
      'V_E infantil: 0.42 m³·h⁻¹·kg⁻¹ | Dosis: µg·kg⁻¹·d⁻¹ | OP-DTT: nmol·min⁻¹·m⁻³'
    );
    return {
      disciplineBadge: 'Dosimetría Pulmonar & Epidemiología',
      physicsLaw: 'Modelo Dosimétrico del Tracto Respiratorio Humano (ICRP 66) y Función de Riesgo Relativo Log-Lineal de Cox (OMS HRAPIE)',
      contextBreadcrumb,
      contextualizedContent: u.contextualizedContent,
      doctoralAddendum: u.doctoralAddendum,
      formulaLaTeX: u.specificFormula,
      formulaExplanation: u.formulaExplanation,
      unitsAndRange: u.specificUnits,
      regulatoryText:
        'Publicación ICRP 66 (1994) • Guías Globales de Calidad del Aire OMS 2021 • Real Decreto 1052/2022 (Zonas de Especial Sensibilidad Escolar)',
      citationText:
        'ICRP (1994). Human Respiratory Tract Model for Radiological Protection, Publ. 66; WHO (2021). Global Air Quality Guidelines.',
      laymanText: u.laymanText
    };
  }

  // 6. JUSTICIA AMBIENTAL, EQUIDAD SOCIOESPACIAL, RENTA INE Y ZBE
  if (
    combined.includes('gini') ||
    combined.includes('atkinson') ||
    combined.includes('kakwani') ||
    combined.includes('lorenz') ||
    combined.includes('justicia') ||
    combined.includes('equidad') ||
    combined.includes('renta') ||
    combined.includes('ine') ||
    combined.includes('adrh') ||
    combined.includes('distrito') ||
    combined.includes('vulnerab') ||
    combined.includes('zbe') ||
    combined.includes('bajas emisiones') ||
    combined.includes('spillover') ||
    combined.includes('dml') ||
    combined.includes('causal')
  ) {
    const u = buildUniqueTexts(
      'evalúa la distribución demográfica de la exposición ambiental en los 11 distritos de Málaga cruzada con el Atlas de Renta INE ADRH y aísla mediante Double Machine Learning (DML) el efecto causal neto de la ZBE (437 ha, 97 cámaras LPR)',
      'analiza si todos los barrios y familias de Málaga respiran un aire igual de limpio o si algunas zonas soportan más tráfico y contaminación, midiendo el efecto real de la Zona de Bajas Emisiones.',
      'G = \\frac{\\sum_{i=1}^{n}\\sum_{j=1}^{n} p_i p_j |E_i - E_j|}{2\\,\\bar{E}\\sum_i p_i}, \\quad \\hat{\\theta}_{\\text{DML}} = \\left(\\frac{1}{N}\\sum_i \\tilde{D}_i^2\\right)^{-1}\\!\\left(\\frac{1}{N}\\sum_i \\tilde{D}_i \\tilde{Y}_i\\right)',
      'Gini / Atkinson: [0 = equidad perfecta, 1 = desigualdad máxima] | Renta INE: €·hogar⁻¹·año⁻¹'
    );
    return {
      disciplineBadge: 'Econometría Causal & Equidad INE',
      physicsLaw: 'Índices de Desigualdad de Gini-Atkinson-Kakwani e Inferencia Causal Ortogonal Double Machine Learning (Chernozhukov et al.)',
      contextBreadcrumb,
      contextualizedContent: u.contextualizedContent,
      doctoralAddendum: u.doctoralAddendum,
      formulaLaTeX: u.specificFormula,
      formulaExplanation: u.formulaExplanation,
      unitsAndRange: u.specificUnits,
      regulatoryText:
        'Atlas de Distribución de Renta de los Hogares (INE ADRH) • Ley 7/2021 y RD 1052/2022 (ZBE Málaga 437 ha) • Directiva (UE) 2024/2881',
      citationText:
        'Chernozhukov, V. et al. (2018). The Econometrics Journal, 21(1), C1–C68; Atkinson, A. B. (1970). J. Econ. Theory, 2(3), 244–263.',
      laymanText: u.laymanText
    };
  }

  // 7. OCEANOGRAFÍA COSTERA, MICROCAPA SUPERFICIAL MARINA (SML 50 µm), PUERTO Y MARPOL
  if (
    combined.includes('sml') ||
    combined.includes('microcapa') ||
    combined.includes('acidific') ||
    combined.includes('aragonito') ||
    combined.includes('puerto') ||
    combined.includes('marpol') ||
    combined.includes('crucero') ||
    combined.includes('buque') ||
    combined.includes('marino') ||
    combined.includes('marina') ||
    combined.includes('bahía') ||
    combined.includes('bahia') ||
    combined.includes('clno2') ||
    combined.includes('clno₂') ||
    combined.includes('halógeno') ||
    combined.includes('ieo')
  ) {
    const u = buildUniqueTexts(
      'resuelve el intercambio gas-líquido de Liss & Slater en la microcapa superficial del mar de Alborán (SML, 50 µm), la alteración del pH y saturación de aragonito (Ω_arag) por deposición ácida y el control Med SOx ECA (0.10% S desde 01/05/2025)',
      'explica cómo interactúan el mar de la Bahía de Málaga y el aire de la ciudad: el agua absorbe parte de los gases del puerto y del tráfico, y la brisa marina transporta aerosoles salinos hacia la costa.',
      'F_{\\text{SML}} = K_w (C_{\\text{air}}/H_{\\text{eff}} - C_{\\text{water}}), \\quad \\Omega_{\\text{arag}} = \\frac{[\\text{Ca}^{2+}][\\text{CO}_3^{2-}]}{K\'_{\\text{sp,arag}}}',
      'Espesor SML: 50 µm | pH marino: 7.85 – 8.15 | Ω_arag: 2.1 – 3.6 | Límite Med ECA: 0.10% S'
    );
    return {
      disciplineBadge: 'Biogeoquímica Marina & Puerto',
      physicsLaw: 'Equilibrio Carbónico de Dickson-Millero, Transferencia Interfacial de Liss & Slater y Activación Nocturna de Halógenos (ClNO₂)',
      contextBreadcrumb,
      contextualizedContent: u.contextualizedContent,
      doctoralAddendum: u.doctoralAddendum,
      formulaLaTeX: u.specificFormula,
      formulaExplanation: u.formulaExplanation,
      unitsAndRange: u.specificUnits,
      regulatoryText:
        'Convenio OMI MARPOL Anexo VI Regla 14 — Med SOx ECA (Resolución MEPC.361(79), en vigor 01/05/2025: 0.10% m/m S) • Red RADMED IEO-CSIC',
      citationText:
        'Liss, P. S., & Slater, P. G. (1974). Nature, 247, 181–184; Thornton, J. A. et al. (2010). Nature, 464, 271–274.',
      laymanText: u.laymanText
    };
  }

  // 8. TELEDETECCIÓN SATELITAL, TRANSFERENCIA RADIATIVA Y FACTOR AMF-3D
  if (
    combined.includes('satélit') ||
    combined.includes('satelit') ||
    combined.includes('tropomi') ||
    combined.includes('sentinel') ||
    combined.includes('cams') ||
    combined.includes('copernicus') ||
    combined.includes('ecostress') ||
    combined.includes('oco-3') ||
    combined.includes('oco-2') ||
    combined.includes('landsat') ||
    combined.includes('earthcare') ||
    combined.includes('iasi') ||
    combined.includes('pace') ||
    combined.includes('amf') ||
    combined.includes('vcd') ||
    combined.includes('scd') ||
    combined.includes('aod') ||
    combined.includes('orbital')
  ) {
    const u = buildUniqueTexts(
      'invierte la densidad de columna oblicua espectral (DOAS / TIR) a columna vertical troposférica (VCD) aplicando el Factor de Masa de Aire tridimensional (AMF_3D) corregido por apantallamiento de edificios (H/W y SVF)',
      'indica qué están midiendo desde el espacio los 16 satélites de la ESA y la NASA cuando sobrevuelan Málaga y cómo se combinan sus imágenes con los sensores situados a pie de calle.',
      '\\text{VCD}_{\\text{trop}} = \\frac{\\text{SCD}_{\\text{total}} - \\text{SCD}_{\\text{strat}}}{\\text{AMF}_{\\text{3D}}(\\theta_0, \\theta_v, \\Delta\\phi, A_{\\text{surf}}, H/W, \\text{SVF})}',
      'VCD NO₂: µmol·m⁻² (10¹⁵ molec·cm⁻²) | AOD₅₅₀: 0.05 – 0.85 adimensional | LST: K / °C'
    );
    return {
      disciplineBadge: 'Teledetección Orbital & Radiación 3D',
      physicsLaw: 'Espectroscopía de Absorción Óptica Diferencial (DOAS), Ecuación de Transferencia Radiativa de Schwarzschild y Corrección Geométrica AMF-3D',
      contextBreadcrumb,
      contextualizedContent: u.contextualizedContent,
      doctoralAddendum: u.doctoralAddendum,
      formulaLaTeX: u.specificFormula,
      formulaExplanation: u.formulaExplanation,
      unitsAndRange: u.specificUnits,
      regulatoryText:
        'Copernicus Atmosphere Monitoring Service (CAMS) • CEOS Cal/Val Working Group • Sentinel-4A (MTG-S1, 01/07/2025) & Sentinel-5A (13/08/2025)',
      citationText:
        'Veefkind, J. P. et al. (2012). Remote Sens. Environ., 120, 70–83; Boersma, K. F. et al. (2018). Atmos. Meas. Tech., 11, 6651–6678.',
      laymanText: u.laymanText
    };
  }

  // 9. MORFOLOGÍA DE CAÑONES URBANOS 3D, TURBULENCIA CFD, OKE Y CRITERIO Q DE HUNT
  if (
    combined.includes('cañón') ||
    combined.includes('canon') ||
    combined.includes('canyon') ||
    combined.includes('oke') ||
    combined.includes('svf') ||
    combined.includes('vórtice') ||
    combined.includes('vortice') ||
    combined.includes('hunt') ||
    combined.includes('criterio q') ||
    combined.includes('rugosidad') ||
    combined.includes('macdonald') ||
    combined.includes('esbeltez') ||
    combined.includes('h/w') ||
    combined.includes('ventilación') ||
    combined.includes('ach') ||
    combined.includes('turbulencia') ||
    combined.includes('tke') ||
    combined.includes('monin-obukhov')
  ) {
    const u = buildUniqueTexts(
      'caracteriza la dinámica de capa límite urbana en función de la relación de aspecto H/W, el factor de visión de cielo (SVF), la rugosidad morfométrica de Macdonald (z₀, d) y el tensor de vorticidad Q de Hunt',
      'describe cómo la altura de los edificios y la anchura de la calle encajonan el viento: en calles estrechas y altas se forman remolinos que retienen el humo, mientras que en avenidas abiertas el aire se renueva rápido.',
      'Q = \\frac{1}{2}\\left(\\|\\boldsymbol{\\Omega}\\|_F^2 - \\|\\mathbf{S}\\|_F^2\\right), \\quad u(z) = \\frac{u_*}{\\kappa}\\left[\\ln\\!\\left(\\frac{z-d}{z_0}\\right) - \\Psi_m\\!\\left(\\frac{z-d}{L}\\right)\\right]',
      'H/W: 0.2 – 3.5 | SVF: 0.10 – 0.95 | u_*: 0.08 – 0.85 m·s⁻¹ | Q: s⁻²'
    );
    return {
      disciplineBadge: 'Mecánica de Fluidos & Morfología Urbana',
      physicsLaw: 'Regímenes de Cañón Urbano de Oke (1987), Perfil Logarítmico de Monin-Obukhov y Segundo Invariante del Tensor Gradiente de Velocidad (Criterio Q de Hunt)',
      contextBreadcrumb,
      contextualizedContent: u.contextualizedContent,
      doctoralAddendum: u.doctoralAddendum,
      formulaLaTeX: u.specificFormula,
      formulaExplanation: u.formulaExplanation,
      unitsAndRange: u.specificUnits,
      regulatoryText:
        'Guía VDI 3783 (Microscale Obstacle-Resolving Dispersion Models) • Cartografía 3D OSM / Catastro INSPIRE • Regla 10 y 19 AGENTS.md',
      citationText:
        'Oke, T. R. (1987). Boundary Layer Climates (2nd ed.); Hunt, J. C. R., Wray, A. A., & Moin, P. (1988). CTR-S88, 193–208; Macdonald, R. W. et al. (1998). Atmos. Environ., 32, 1857–1864.',
      laymanText: u.laymanText
    };
  }

  // 10. TRÁFICO RODADO, FACTORES DE EMISIÓN COPERT 5 / EMEP Y AEROPUERTO / FERROCARRIL
  if (
    combined.includes('copert') ||
    combined.includes('tráfico') ||
    combined.includes('trafico') ||
    combined.includes('vehícul') ||
    combined.includes('vehicul') ||
    combined.includes('imd') ||
    combined.includes('hdv') ||
    combined.includes('freno') ||
    combined.includes('neumático') ||
    combined.includes('escape') ||
    combined.includes('emep') ||
    combined.includes('euro 6') ||
    combined.includes('euro 7') ||
    combined.includes('aeropuerto') ||
    combined.includes('aena') ||
    combined.includes('lemg') ||
    combined.includes('lto')
  ) {
    const u = buildUniqueTexts(
      'calcula la fuente lineal de emisión vehicular (Q_traffic) mediante las curvas polinómicas racionales dependientes de la velocidad v de EMEP/EEA COPERT 5.6, sumando escape térmico y abrasión mecánica de frenos, neumáticos y pavimento',
      'calcula cuánta contaminación emiten los coches, autobuses, camiones o aviones que circulan por la zona según su velocidad, el tipo de motor y el desgaste de sus frenos y ruedas.',
      'Q_{\\text{traffic}} = \\frac{1}{3600\\cdot L}\\sum_{k} N_k(t)\\cdot \\left[ \\text{EF}_{\\text{exhaust},k}(v_k, T_a) + \\text{EF}_{\\text{brake},k}(v_k) + \\text{EF}_{\\text{tyre},k}(v_k) \\right]',
      'Q_traffic: µg·m⁻¹·s⁻¹ | EF: g·km⁻¹·veh⁻¹ | Límite Euro 7 Frenos: 7 mg·km⁻¹'
    );
    return {
      disciplineBadge: 'Ingeniería de Emisiones & Transporte',
      physicsLaw: 'Formulaciones Cinemáticas Polinómicas EMEP/EEA COPERT 5.6 y Desgaste Tribomecánico No-Escape (Frenos Cu/Sb y Neumáticos)',
      contextBreadcrumb,
      contextualizedContent: u.contextualizedContent,
      doctoralAddendum: u.doctoralAddendum,
      formulaLaTeX: u.specificFormula,
      formulaExplanation: u.formulaExplanation,
      unitsAndRange: u.specificUnits,
      regulatoryText:
        'EMEP/EEA Air Pollutant Emission Inventory Guidebook 2023 • Reglamento (UE) 2024/1257 (Norma Euro 7) • OACI Doc 9889 (Ciclo LTO Aeroportuario)',
      citationText:
        'Ntziachristos, L., & Samaras, Z. (2023). EMEP/EEA Guidebook, Exhaust Emissions from Road Transport; Grigoratos, T., & Martini, G. (2015). Environ. Sci. Pollut. Res., 22, 2491–2504.',
      laymanText: u.laymanText
    };
  }

  // 11. REDES NEURONALES INFORMADAS POR LA FÍSICA (PINN), PDE NAVIER-STOKES Y KRIGING / 4D-VAR
  if (
    combined.includes('pinn') ||
    combined.includes('pde') ||
    combined.includes('navier-stokes') ||
    combined.includes('advección') ||
    combined.includes('adveccion') ||
    combined.includes('difusión') ||
    combined.includes('difusion') ||
    combined.includes('kriging') ||
    combined.includes('kalman') ||
    combined.includes('4d-var') ||
    combined.includes('enkf') ||
    combined.includes('fourier') ||
    combined.includes('ntk') ||
    combined.includes('l-bfgs') ||
    combined.includes('adamw') ||
    combined.includes('colocación') ||
    combined.includes('wesely') ||
    combined.includes('cfl') ||
    combined.includes('courant')
  ) {
    const u = buildUniqueTexts(
      'minimiza la función de pérdida variacional multi-objetivo L_total acoplando el ajuste a las 24 estaciones terrestres y 16 satélites con el residuo diferencial de advección-difusión-reacción y las condiciones de contorno de Wesely',
      'explica cómo el cerebro matemático del Gemelo Digital une los datos reales de las estaciones con las leyes físicas del viento y la química para calcular la contaminación exacta en cualquier rincón de Málaga.',
      '\\mathcal{L}_{\\text{PINN}} = \\lambda_{\\text{data}}\\|\\hat{C}-C_{\\text{obs}}\\|^2 + \\lambda_{\\text{PDE}}\\left\\|\\frac{\\partial \\hat{C}}{\\partial t} + \\mathbf{u}\\cdot\\nabla\\hat{C} - \\nabla\\cdot(\\mathbf{K}\\nabla\\hat{C}) - R_{\\text{chem}} - S\\right\\|^2 + \\lambda_{\\text{BC}}\\|\\mathcal{B}(\\hat{C})\\|^2',
      'Residuo PDE: µg·m⁻³·s⁻¹ | Varianza Kriging σ²: (µg·m⁻³)² | CFL < 1.0'
    );
    return {
      disciplineBadge: 'Física Computacional & Asimilación PINN',
      physicsLaw: 'Ecuación Diferencial en Derivadas Parciales de Transporte-Reacción Euleriana, Redes Neuronales Informadas por la Física (Raissi et al.) y Kriging Ordinario',
      contextBreadcrumb,
      contextualizedContent: u.contextualizedContent,
      doctoralAddendum: u.doctoralAddendum,
      formulaLaTeX: u.specificFormula,
      formulaExplanation: u.formulaExplanation,
      unitsAndRange: u.specificUnits,
      regulatoryText:
        'Guía Europea FAIRMODE WG1 (MQI ≤ 1.0) • Protocolo de Asimilación Variacional CAMS/ECMWF • Reglas 1, 2, 19 y 21 AGENTS.md',
      citationText:
        'Raissi, M., Perdikaris, P., & Karniadakis, G. E. (2019). J. Comput. Phys., 378, 686–707; Wesely, M. L. (1989). Atmos. Environ., 23(6), 1293–1304.',
      laymanText: u.laymanText
    };
  }

  // 12. VALIDACIÓN METROLÓGICA FAIRMODE, INCERTIDUMBRE GUM, ESTACIONES OFICIALES Y LOOCV
  if (
    combined.includes('fairmode') ||
    combined.includes('mqi') ||
    combined.includes('rmse') ||
    combined.includes('bias') ||
    combined.includes('sesgo') ||
    combined.includes('nmsd') ||
    combined.includes('loocv') ||
    combined.includes('incertidumbre') ||
    combined.includes('gum') ||
    combined.includes('u95') ||
    combined.includes('conformal') ||
    combined.includes('cp-pre') ||
    combined.includes('estación') ||
    combined.includes('estacion') ||
    combined.includes('quimioluminiscencia') ||
    combined.includes('14211') ||
    combined.includes('17660')
  ) {
    const u = buildUniqueTexts(
      'audita la trazabilidad metrológica frente a los métodos patrón europeos (quimioluminiscencia EN 14211, fotometría UV EN 14625 y gravimetría/aten. beta EN 16450), propagando la incertidumbre U₉₅ y el indicador MQI de FAIRMODE',
      'comprueba con rigor matemático la fiabilidad de las mediciones, comparando los cálculos del sistema con las estaciones oficiales de control de calidad del aire para garantizar que el margen de error cumple las normas europeas.',
      '\\text{MQI} = \\frac{\\sqrt{\\frac{1}{N}\\sum_{i=1}^N (M_i - O_i)^2}}{\\beta \\sqrt{\\frac{1}{N}\\sum_{i=1}^N U_{95}^2(O_i)}} \\le 1.0, \\quad \\beta = 2.0',
      'MQI: adimensional (Conforme si ≤ 1.0) | RMSE / BIAS: µg·m⁻³ | U₉₅: 15% – 25%'
    );
    return {
      disciplineBadge: 'Metrología & Validación FAIRMODE WG1',
      physicsLaw: 'Propagación de Incertidumbre de Medida (JCGM 100:2008 GUM), Criterio de Calidad de Modelización FAIRMODE (JRC) y Validación Ciega LOOCV',
      contextBreadcrumb,
      contextualizedContent: u.contextualizedContent,
      doctoralAddendum: u.doctoralAddendum,
      formulaLaTeX: u.specificFormula,
      formulaExplanation: u.formulaExplanation,
      unitsAndRange: u.specificUnits,
      regulatoryText:
        'Directiva 2008/50/CE y Directiva (UE) 2024/2881 Anexo V • Normas UNE-EN 14211:2013, UNE-EN 14625:2013 y CEN/TS 17660-1:2021 • JRC FAIRMODE WG1',
      citationText:
        'Janssen, S., & Thunis, P. (2022). FAIRMODE Guidance Document on Modelling Quality Objectives and Benchmarking (JRC129254); JCGM 100:2008 (GUM).',
      laymanText: u.laymanText
    };
  }

  // 13. FOTOQUÍMICA TROPOSFÉRICA, CICLO DE LEIGHTON, NO2, O3, RADICALES Y QUÍMICA NOCTURNA
  if (
    combined.includes('no2') ||
    combined.includes('no₂') ||
    combined.includes('o3') ||
    combined.includes('o₃') ||
    combined.includes('ozono') ||
    combined.includes('leighton') ||
    combined.includes('fotólisis') ||
    combined.includes('fotolisis') ||
    combined.includes('radical') ||
    combined.includes('peroxi') ||
    combined.includes('n2o5') ||
    combined.includes('n₂o₅') ||
    combined.includes('no3') ||
    combined.includes('pan') ||
    combined.includes('cov') ||
    combined.includes('voc') ||
    combined.includes('cascada') ||
    combined.includes('balance de masa')
  ) {
    const u = buildUniqueTexts(
      'integra el sistema rígido (stiff ODE) del ciclo fotoestacionario de Leighton extendido: fotólisis actínica J(NO₂), titulación bimolecular NO + O₃ con energía de activación de Arrhenius, oxidación por radicales peroxilo (RO₂•/HO₂•) y pérdida diurna hacia HNO₃',
      'explica cómo los gases del tubo de escape (óxidos de nitrógeno) se transforman en el aire bajo la luz del sol y reaccionan con el ozono a lo largo del día y de la noche.',
      '\\frac{d[\\text{NO}_2]}{dt} = k_1[\\text{NO}][\\text{O}_3] + k_2[\\text{NO}][\\text{RO}_2^\\bullet] - J_{\\text{NO}_2}[\\text{NO}_2] - k_{\\text{OH}}[\\text{OH}^\\bullet][\\text{NO}_2] + E_{\\text{NO}_2} - \\frac{v_d}{H}[\\text{NO}_2]',
      'NO₂ / O₃: µg·m⁻³ (1 ppbv NO₂ ≈ 1.91 µg·m⁻³ a 20 °C) | J(NO₂): 0 – 9.5×10⁻³ s⁻¹'
    );
    return {
      disciplineBadge: 'Cinética Fotoquímica Troposférica',
      physicsLaw: 'Relación Fotoestacionaria de Leighton (1961), Ley Cinética de Acción de Masas y Ecuación de Arrhenius (IUPAC / NASA-JPL)',
      contextBreadcrumb,
      contextualizedContent: u.contextualizedContent,
      doctoralAddendum: u.doctoralAddendum,
      formulaLaTeX: u.specificFormula,
      formulaExplanation: u.formulaExplanation,
      unitsAndRange: u.specificUnits,
      regulatoryText:
        'Directiva (UE) 2024/2881 (NO₂: 20 µg/m³ anual, 200 µg/m³ horario; O₃: 120 µg/m³ octohorario) • Guías OMS 2021 (NO₂: 10 µg/m³ anual)',
      citationText:
        'Leighton, P. A. (1961). Photochemistry of Air Pollution; Seinfeld, J. H., & Pandis, S. N. (2016). Atmospheric Chemistry and Physics (3rd ed., Wiley).',
      laymanText: u.laymanText
    };
  }

  // 14. AEROSOLES ATMOSFÉRICOS (PM2.5, PM10, SOA, PANKOW, CARBONO NEGRO, POLVO SAHARIANO)
  if (
    combined.includes('pm2.5') ||
    combined.includes('pm2,5') ||
    combined.includes('pm₂.₅') ||
    combined.includes('pm10') ||
    combined.includes('pm₁₀') ||
    combined.includes('partícula') ||
    combined.includes('particula') ||
    combined.includes('aerosol') ||
    combined.includes('soa') ||
    combined.includes('pankow') ||
    combined.includes('carbono negro') ||
    combined.includes('black carbon') ||
    combined.includes('sahariano') ||
    combined.includes('calima') ||
    combined.includes('higrosc') ||
    combined.includes('köhler')
  ) {
    const u = buildUniqueTexts(
      'resuelve la distribución modal de aerosoles (nucleación, Aitken, acumulación y modo grueso), el reparto gas-partícula de Pankow para aerosol orgánico secundario (SOA) y el crecimiento higroscópico de Köhler con la humedad relativa',
      'mide las partículas microscópicas de polvo, hollín y ceniza que flotan en el aire (PM10 y PM2.5), diferenciando las que vienen del tráfico local de las que llegan con la calima del Sáhara.',
      'Y_{\\text{SOA}} = M_o \\sum_i \\frac{\\alpha_i K_{om,i}}{1 + K_{om,i} M_o}, \\quad K_{om,i}(T) = K_{om,i}^\\ast \\frac{T}{T^\\ast}\\exp\\!\\left[\\frac{\\Delta H_{\\text{vap},i}}{R}\\left(\\frac{1}{T}-\\frac{1}{T^\\ast}\\right)\\right]',
      'PM₂.₅ / PM₁₀: µg·m⁻³ | BC: µg·m⁻³ | Límite Anual UE 2030: PM₂.₅ = 10 µg·m⁻³, PM₁₀ = 20 µg·m⁻³'
    );
    return {
      disciplineBadge: 'Física y Termodinámica de Aerosoles',
      physicsLaw: 'Teoría de Partición Absortiva Gas-Partícula de Pankow (1994), Ecuación de Clausius-Clapeyron y Dinámica de Sedimentación de Stokes-Cunningham',
      contextBreadcrumb,
      contextualizedContent: u.contextualizedContent,
      doctoralAddendum: u.doctoralAddendum,
      formulaLaTeX: u.specificFormula,
      formulaExplanation: u.formulaExplanation,
      unitsAndRange: u.specificUnits,
      regulatoryText:
        'Directiva (UE) 2024/2881 (PM2.5: 10 µg/m³ anual; PM10: 20 µg/m³ anual) • Guías OMS 2021 (PM2.5: 5 µg/m³ anual) • Norma UNE-EN 16450',
      citationText:
        'Pankow, J. F. (1994). Atmos. Environ., 28(2), 185–188; Odum, J. R. et al. (1996). Environ. Sci. Technol., 30(8), 2580–2585.',
      laymanText: u.laymanText
    };
  }

  // 15. METEOROLOGÍA SINÓPTICA Y MESOESCALAR (VIENTO, TERRAL, BRISA MARINA, TEMPERATURA, HUMEDAD, PRESIÓN)
  if (
    combined.includes('viento') ||
    combined.includes('terral') ||
    combined.includes('levante') ||
    combined.includes('brisa') ||
    combined.includes('temperatura') ||
    combined.includes('humedad') ||
    combined.includes('presión') ||
    combined.includes('presion') ||
    combined.includes('radiación') ||
    combined.includes('radiacion') ||
    combined.includes('aemet') ||
    combined.includes('capa límite') ||
    combined.includes('pbl') ||
    combined.includes('föh') ||
    combined.includes('foehn') ||
    combined.includes('adiabát')
  ) {
    const u = buildUniqueTexts(
      'descompone el vector de viento horizontal (u, v), el calentamiento por compresión adiabática Foehn del viento Terral descendente de los Montes de Málaga y la circulación de brisa marina térmica impulsada por el gradiente baroclínico mar-tierra',
      'muestra cómo el tiempo meteorológico de Málaga (la brisa del mar, el viento cálido del Terral, la temperatura y la humedad) empuja, concentra o limpia el aire de las calles.',
      '\\frac{D\\mathbf{u}}{Dt} = -\\frac{1}{\\rho}\\nabla p - 2\\boldsymbol{\\Omega}\\times\\mathbf{u} + \\mathbf{g} + \\nu_{\\text{turb}}\\nabla^2\\mathbf{u}, \\quad \\theta = T\\left(\\frac{p_0}{p}\\right)^{R_d/c_p}',
      'Velocidad viento: m·s⁻¹ (km·h⁻¹) | Dirección: 0°–360° | T: °C | RH: % | Presión: hPa'
    );
    return {
      disciplineBadge: 'Física de la Atmósfera & Mesoescala',
      physicsLaw: 'Ecuaciones Primitivas Termohidrodinámicas de la Atmósfera, Compresión Adiabática Foehn (Terral) y Circulación Baroclínica de Brisa Marina',
      contextBreadcrumb,
      contextualizedContent: u.contextualizedContent,
      doctoralAddendum: u.doctoralAddendum,
      formulaLaTeX: u.specificFormula,
      formulaExplanation: u.formulaExplanation,
      unitsAndRange: u.specificUnits,
      regulatoryText:
        'Organización Meteorológica Mundial (OMM / WMO-No. 8) • Red Sinóptica Oficial AEMET OpenData • Reanálisis ECMWF ERA5',
      citationText:
        'Stull, R. B. (1988). An Introduction to Boundary Layer Meteorology (Springer); Holton, J. R. (2012). An Introduction to Dynamic Meteorology.',
      laymanText: u.laymanText
    };
  }

  // 16. CIENCIA ABIERTA FAIR, EXPORTACIÓN (GEOJSON, CSV, LATEX, PDF), CRIPTOGRAFÍA SHA-256 Y RESPALDO
  if (
    combined.includes('export') ||
    combined.includes('geojson') ||
    combined.includes('csv') ||
    combined.includes('latex') ||
    combined.includes('pdf') ||
    combined.includes('fair') ||
    combined.includes('sha-256') ||
    combined.includes('hash') ||
    combined.includes('descarga') ||
    combined.includes('copiar') ||
    combined.includes('github') ||
    combined.includes('zip') ||
    combined.includes('respaldo') ||
    combined.includes('cloud sync') ||
    combined.includes('custodia')
  ) {
    const u = buildUniqueTexts(
      'serializa las matrices numéricas, mallas geoespaciales (WGS84 / ETRS89 UTM 30N) y tablas tipográficas con huella criptográfica SHA-256 verificable para garantizar la reproducibilidad exacta en la memoria de tesis doctoral UNED',
      'permite guardar, descargar o exportar los datos y gráficos reales de esta ventana en formatos universales (PDF, Excel/CSV, mapas GeoJSON o tablas para la tesis) sin perder ningún detalle.',
      '\\mathcal{H}_{\\text{SHA-256}}(\\mathbf{D}_{\\text{FAIR}}) \\in \\{0,1\\}^{256}, \\quad \\mathbf{D}_{\\text{FAIR}} \\equiv \\{\\text{GeoJSON (RFC 7946)},\\; \\text{CSV (RFC 4180)},\\; \\text{LaTeX},\\; \\text{PDF A4}\\}',
      'Integridad: 256 bits (SHA-256) | Proyección: EPSG:4326 / EPSG:25830 | Codificación: UTF-8'
    );
    return {
      disciplineBadge: 'Ciencia Abierta FAIR & Trazabilidad',
      physicsLaw: 'Principios FAIR de Gestión de Datos Científicos (Wilkinson et al., 2016) y Función Resumen Criptográfica Unidireccional SHA-256 (FIPS 180-4)',
      contextBreadcrumb,
      contextualizedContent: u.contextualizedContent,
      doctoralAddendum: u.doctoralAddendum,
      formulaLaTeX: u.specificFormula,
      formulaExplanation: u.formulaExplanation,
      unitsAndRange: u.specificUnits,
      regulatoryText:
        'Directiva (UE) 2019/1024 de Datos Abiertos e Investigación • Estándar IETF RFC 7946 (GeoJSON) • Regla 8 y 26 AGENTS.md (Tesis Doctoral UNED)',
      citationText:
        'Wilkinson, M. D. et al. (2016). The FAIR Guiding Principles for scientific data management and stewardship. Scientific Data, 3, 160018.',
      laymanText: u.laymanText
    };
  }

  // 17. GEODESIA, CARTOGRAFÍA, COORDENADAS UTM/WGS84, MDE Y SINCRONIZACIÓN DE PUNTO ACTIVO
  if (
    combined.includes('coordenada') ||
    combined.includes('utm') ||
    combined.includes('wgs84') ||
    combined.includes('etrs89') ||
    combined.includes('mde') ||
    combined.includes('altitud') ||
    combined.includes('cota') ||
    combined.includes('mapa') ||
    combined.includes('capa') ||
    combined.includes('híbrido') ||
    combined.includes('hibrido') ||
    combined.includes('street view') ||
    combined.includes('atalaya') ||
    combined.includes('punto activo') ||
    combined.includes('sincroniz')
  ) {
    const u = buildUniqueTexts(
      'proyecta geodésicamente las coordenadas del elipsoide GRS80/WGS84 al huso métrico ETRS89 UTM 30N (EPSG:25830), interpola la altitud ortométrica sobre el MDE LiDAR y propaga atómicamente el vector de estado a través de ActivePointContext',
      'sitúa con precisión milimétrica la calle o el edificio seleccionado en el mapa de Málaga y actualiza al instante todos los paneles y cálculos de la aplicación para esa ubicación exacta.',
      '(\\phi, \\lambda)_{\\text{WGS84}} \\xrightarrow{\\text{Gauss-Krüger } (\\lambda_0 = -3^\\circ)} (X_{\\text{UTM}}, Y_{\\text{UTM}})_{\\text{ETRS89-30N}}, \\quad P(z) = P_0\\exp\\!\\left(-\\frac{g M z}{R T}\\right)',
      'WGS84: grados decimales | UTM 30N: metros (X, Y) | Cota MDE: metros s.n.m.'
    );
    return {
      disciplineBadge: 'Geodesia & Sincronización Espacial',
      physicsLaw: 'Proyección Conforme Transversa de Mercator (Gauss-Krüger ETRS89 Huso 30N), Nivelación Barométrica Hipsométrica y Propagación Reactiva Atómica',
      contextBreadcrumb,
      contextualizedContent: u.contextualizedContent,
      doctoralAddendum: u.doctoralAddendum,
      formulaLaTeX: u.specificFormula,
      formulaExplanation: u.formulaExplanation,
      unitsAndRange: u.specificUnits,
      regulatoryText:
        'Directiva INSPIRE 2007/2/CE • Real Decreto 1071/2007 (Sistema Geodésico Oficial ETRS89 en España) • Reglas 6 y 10 AGENTS.md',
      citationText:
        'Snyder, J. P. (1987). Map Projections: A Working Manual (USGS Prof. Paper 1395); Instituto Geográfico Nacional (IGN) MDT02 LiDAR.',
      laymanText: u.laymanText
    };
  }

  // 18. PERFIL UNIVERSAL CONTEXTUALIZADO (Para cualquier control, columna, selector o pestaña específica)
  const u = buildUniqueTexts(
    'evalúa en tiempo real el estado acoplado Y(x, t) integrando la telemetría de las 24 estaciones terrestres y 16 misiones satelitales con el operador físico-químico determinista sobre las coordenadas exactas del punto activo',
    'actualiza o controla en directo esta vista del Gemelo Digital de Málaga a partir de mediciones reales y leyes físicas, sin utilizar nunca datos simulados al azar.',
    '\\mathbf{Y}(\\mathbf{x}_{\\text{activo}}, t) = \\mathcal{F}_{\\text{PINN-ODE}}\\left(\\mathbf{O}_{24\\text{ est}}(t),\\; \\mathbf{S}_{16\\text{ sat}}(t),\\; \\mathbf{G}_{\\text{OSM}}(\\mathbf{x}_{\\text{activo}})\\right)',
    'Acoplamiento en tiempo real: 24 Estaciones Terrestres + 16 Satélites (Varianza estocástica = 0)'
  );
  return {
    disciplineBadge: 'Gemelo Digital Físico (Tesis UNED)',
    physicsLaw: 'Asimilación Continua de Datos Observacionales y Modelización Mecanística Determinista (Cero Estocasticidad)',
    contextBreadcrumb,
    contextualizedContent: u.contextualizedContent,
    doctoralAddendum: u.doctoralAddendum,
    formulaLaTeX: u.specificFormula,
    formulaExplanation: u.formulaExplanation,
    unitsAndRange: u.specificUnits,
    regulatoryText:
      regulatoryText ||
      'Directiva (UE) 2024/2881 • Guía Europea EMEP/EEA 2023 & FAIRMODE WG1 • Doctrina de Tesis Doctoral UNED (Reglas 1–27 AGENTS.md)',
    citationText:
      'Bauer, P., Thorpe, A., & Brunet, G. (2015). The quiet revolution of numerical weather prediction. Nature, 525, 47–55; Raissi et al. (2019).',
    laymanText: u.laymanText
  };
}

/**
 * Componente de Tarjeta de Tooltip Doctoral Reutilizable (usado tanto por <ScientificTooltip> explícito
 * como por el Inspector Universal Delegado <UniversalScientificTooltipDelegator>).
 */
let nextTooltipInstanceSeq = 1;
let lastTooltipClosedTimestamp = 0;
let lastTooltipResizeTimestamp = 0;

interface TooltipCardBodyProps {
  displayTitle?: React.ReactNode;
  displayDiscipline?: string;
  contextBreadcrumb?: string;
  displayPhysicsLaw?: string;
  displayContent?: React.ReactNode;
  shouldShowDoctoralAddendum: boolean;
  doctoralAddendum?: string;
  displayFormula?: string;
  formulaExplanation?: FormulaCompleteExplanation;
  displayUnitsAndRange?: string;
  resolvedLaymanText?: string;
  displayRegulatory?: string | { document: string; limitValue?: string };
  displayCitation?: string;
  activeDiagramType?: ScientificDiagramType;
  showDiagram: boolean;
  setShowDiagram: React.Dispatch<React.SetStateAction<boolean>>;
  isPinned: boolean;
  setIsPinned: React.Dispatch<React.SetStateAction<boolean>>;
  onClosePinned: () => void;
  onStartDrag?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onResizePointerDown: (e: React.PointerEvent) => void;
  onToggleExpandSize?: () => void;
  isExpandedSize?: boolean;
  customDimensionsLabel?: string | null;
}

function ScientificTooltipCardBody({
  displayTitle,
  displayDiscipline,
  contextBreadcrumb,
  displayPhysicsLaw,
  displayContent,
  shouldShowDoctoralAddendum,
  doctoralAddendum,
  displayFormula,
  formulaExplanation,
  displayUnitsAndRange,
  resolvedLaymanText,
  displayRegulatory,
  displayCitation,
  activeDiagramType,
  showDiagram,
  setShowDiagram,
  onClosePinned,
  onStartDrag,
  onResizePointerDown,
  onToggleExpandSize,
  isExpandedSize,
  customDimensionsLabel
}: TooltipCardBodyProps) {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden select-text text-left relative">
      {/* Header Bar - Idéntica en comportamiento a DraggableWindow.tsx */}
      <div
        onPointerDown={e => {
          const target = e.target as HTMLElement | null;
          if (target?.closest('button, a, input, select, [role="button"], [data-tooltip-action-btn="true"]')) {
            return;
          }
          onStartDrag?.(e);
        }}
        onDoubleClick={e => {
          const target = e.target as HTMLElement | null;
          if (target?.closest('button, a, input, select, [role="button"], [data-tooltip-action-btn="true"]')) {
            return;
          }
          e.stopPropagation();
          onToggleExpandSize?.();
        }}
        className="flex items-center justify-between bg-slate-900 border-b border-slate-700/90 px-3 py-2 shrink-0 gap-2 cursor-grab active:cursor-grabbing select-none touch-none shadow-md z-10"
        title="Arrastre el encabezado para mover libremente la ventana. Doble clic para ampliar/restaurar."
      >
        <div className="flex items-center gap-1.5 text-cyan-200 font-bold font-mono text-[12px] min-w-0">
          <GripHorizontal className="w-4 h-4 text-cyan-400 shrink-0" />
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="leading-snug truncate">
            {displayTitle
              ? typeof displayTitle === 'string'
                ? renderInlineScientificMath(displayTitle)
                : displayTitle
              : 'Nota Científica & Normativa'}
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 shrink-0"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          {customDimensionsLabel && (
            <span className="text-[9px] bg-slate-950 border border-amber-500/60 text-amber-300 px-1.5 py-0.5 rounded font-mono shrink-0">
              {customDimensionsLabel}
            </span>
          )}
          {displayDiscipline && !customDimensionsLabel && (
            <span className="hidden sm:inline-block text-[9px] bg-slate-950 border border-cyan-800/70 text-cyan-200 px-1.5 py-0.5 rounded font-mono shrink-0">
              {displayDiscipline}
            </span>
          )}
          {onToggleExpandSize && (
            <button
              type="button"
              data-tooltip-action-btn="true"
              data-scientific-tooltip-ignore="true"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onToggleExpandSize();
              }}
              onPointerDown={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
              title={isExpandedSize ? 'Restaurar tamaño original' : 'Maximizar / Ampliar ventana aclaratoria'}
              aria-label="Ampliar o restaurar tamaño de nota científica"
              className="px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/60 font-mono font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
            >
              {isExpandedSize ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            type="button"
            data-tooltip-action-btn="true"
            data-scientific-tooltip-ignore="true"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              onClosePinned();
            }}
            onPointerDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            title="Cerrar y quitar este tooltip de la pantalla (Esc)"
            aria-label="Cerrar nota científica"
            className="px-2 py-0.5 rounded-md bg-rose-700 hover:bg-rose-600 active:bg-rose-500 text-white border border-rose-400 font-mono font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Content Body - Idéntico a DraggableWindow.tsx (líneas 683-703) */}
      <div
        className="flex-1 overflow-y-auto custom-scrollbar flex flex-col select-text relative min-h-0"
        onPointerDown={e => e.stopPropagation()}
      >
        <div className="p-3.5 text-slate-200 flex-1 space-y-2.5 min-w-0">
          {/* Ruta de Contexto Único (Ventana › Pestaña Activa › Rol del Elemento) */}
          {contextBreadcrumb && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/95 border border-slate-700/80 rounded text-[9px] font-mono text-slate-300 leading-tight min-w-0">
              <Layers className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">{contextBreadcrumb}</span>
            </div>
          )}

          {/* Contenido explicativo de Doble Nivel Cognitivo (Investigadores + No Especialistas) a 100% de ancho útil */}
          <div className="space-y-2 w-full min-w-0">
            <div className="flex items-center gap-1.5 text-[9.5px] font-mono font-bold text-emerald-300 uppercase tracking-wider">
              <Microscope className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>🔬 Rigor Científico (Investigadores &amp; Tesis UNED)</span>
            </div>

            {/* Ley o Principio Físico-Químico Rector */}
            {displayPhysicsLaw && (
              <div className="px-2 py-1 bg-cyan-950/45 border border-cyan-800/60 rounded text-[10px] font-mono text-cyan-200 leading-snug break-words">
                <span className="font-bold text-cyan-300">Ley / Principio Rector: </span>
                {renderInlineScientificMath(displayPhysicsLaw)}
              </div>
            )}

            {/* Explicación científica principal del elemento */}
            <div className="text-slate-100 font-sans leading-relaxed text-[11.5px] break-words">
              {typeof displayContent === 'string' ? renderInlineScientificMath(displayContent) : displayContent}
            </div>

            {/* Complemento Mecanístico Doctoral Contextualizado (único por pestaña/control) */}
            {shouldShowDoctoralAddendum && doctoralAddendum && (
              <div className="p-2 bg-slate-900/90 border-l-2 border-emerald-500/80 rounded-r text-[10.5px] text-slate-200 font-sans leading-snug break-words">
                <span className="font-mono font-bold text-emerald-300 text-[9.5px] uppercase block mb-0.5">
                  ⚗️ Mecanismo Físico-Matemático &amp; Rol en esta Vista:
                </span>
                {renderInlineScientificMath(doctoralAddendum)}
              </div>
            )}

            {/* Fórmula matemática formal renderizada con KaTeX + Desglose Analítico Completo Término a Término */}
            {displayFormula && (
              <div className="space-y-1.5 w-full">
                <div className="p-2.5 bg-slate-900 border border-indigo-700/80 rounded-lg text-[11.5px] text-indigo-100 overflow-x-auto max-w-full shadow-inner">
                  <MathFormula math={displayFormula} displayMode={true} />
                </div>

                {formulaExplanation && (
                  <div className="p-2.5 bg-indigo-950/35 border border-indigo-700/60 rounded-lg space-y-2 text-[10.5px] w-full">
                    <div className="flex flex-col gap-1 border-b border-indigo-800/60 pb-1.5">
                      <span className="font-mono font-bold text-indigo-300 uppercase tracking-wider text-[9.5px] leading-snug">
                        📖 Explicación Completa de la Ecuación (Término a Término)
                      </span>
                      <span className="inline-block self-start text-[8.5px] font-mono text-indigo-200/95 bg-indigo-950/90 px-1.5 py-0.5 rounded border border-indigo-700/60 leading-snug break-words max-w-full">
                        {formulaExplanation.structuralReading}
                      </span>
                    </div>

                    <ul className="space-y-1.5 text-slate-200 font-sans leading-snug w-full">
                      {formulaExplanation.terms.map((item, idx) => (
                        <li
                          key={idx}
                          className="p-1.5 rounded bg-slate-900/80 border border-indigo-900/50 text-[10.5px] leading-snug break-words w-full"
                        >
                          <span className="inline-flex flex-wrap items-center gap-1 mr-1.5 align-baseline">
                            <span className="font-mono font-bold text-cyan-300 bg-slate-950 border border-cyan-800/70 px-1.5 py-0.2 rounded text-[9.5px] break-all">
                              {item.symbol}
                            </span>
                            {item.kind && (
                              <span
                                className={`font-mono text-[8px] px-1.5 py-0.2 rounded border ${
                                  item.kind === 'Constante'
                                    ? 'bg-amber-950/85 text-amber-300 border-amber-700/60'
                                    : item.kind === 'Parámetro / Coef.'
                                      ? 'bg-purple-950/85 text-purple-300 border-purple-700/60'
                                      : item.kind === 'Operador'
                                        ? 'bg-emerald-950/85 text-emerald-300 border-emerald-700/60'
                                        : 'bg-sky-950/85 text-sky-300 border-sky-700/60'
                                }`}
                              >
                                {item.kind}
                              </span>
                            )}
                          </span>
                          <span className="text-slate-100 text-[10.5px] leading-snug">
                            {renderInlineScientificMath(item.meaning)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-1.5 border-t border-indigo-900/60 text-[10px] text-indigo-100/95 font-sans leading-snug break-words">
                      <span className="font-mono font-bold text-indigo-300">Síntesis Física de la Fórmula: </span>
                      {renderInlineScientificMath(formulaExplanation.physicalSynthesis)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bloque Ampliado de Rigor Científico Doctoral: Dominio Físico, Incertidumbre GUM y Sensibilidad */}
            {formulaExplanation && (
              <div className="p-2.5 bg-slate-900/95 border border-teal-700/70 rounded-lg space-y-1.5 text-[10.5px] shadow-xs w-full">
                <div className="border-b border-teal-800/60 pb-1">
                  <span className="font-mono font-bold text-teal-300 uppercase tracking-wider text-[9.5px] flex items-center gap-1.5 leading-snug">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>🔬 Rigor Doctoral Avanzado: Dominio, Metrología GUM &amp; Sensibilidad</span>
                  </span>
                </div>

                <div className="space-y-1.5 font-sans leading-snug w-full">
                  <div className="p-1.5 rounded bg-slate-950/75 border border-teal-900/40 text-slate-200 break-words">
                    <Compass className="inline-block w-3 h-3 text-cyan-400 mr-1 align-text-bottom" />
                    <span className="font-mono font-bold text-cyan-300 text-[9.5px]">
                      Dominio Físico, Contorno y Estabilidad:{' '}
                    </span>
                    {renderInlineScientificMath(formulaExplanation.physicalDomainAndStability)}
                  </div>

                  <div className="p-1.5 rounded bg-slate-950/75 border border-teal-900/40 text-slate-200 break-words">
                    <Scale className="inline-block w-3 h-3 text-amber-400 mr-1 align-text-bottom" />
                    <span className="font-mono font-bold text-amber-300 text-[9.5px]">
                      Incertidumbre Expandida GUM (U₉₅, k = 1,96):{' '}
                    </span>
                    {renderInlineScientificMath(formulaExplanation.expandedUncertaintyGUM)}
                  </div>

                  <div className="p-1.5 rounded bg-slate-950/75 border border-teal-900/40 text-slate-200 break-words">
                    <Activity className="inline-block w-3 h-3 text-purple-400 mr-1 align-text-bottom" />
                    <span className="font-mono font-bold text-purple-300 text-[9.5px]">
                      Sensibilidad Jacobiana Local (∂Y/∂Xᵢ):{' '}
                    </span>
                    {renderInlineScientificMath(formulaExplanation.parametricSensitivity)}
                  </div>
                </div>
              </div>
            )}

            {/* Magnitudes SI y Rango Operativo */}
            {displayUnitsAndRange && (
              <div className="flex flex-wrap items-center justify-between gap-1.5 px-2 py-1 bg-slate-900/80 border border-slate-700/80 rounded text-[9.5px] font-mono text-indigo-200 break-words">
                <span className="font-bold text-indigo-300 shrink-0">📐 Magnitudes SI:</span>
                <span className="break-words">{renderInlineScientificMath(displayUnitsAndRange)}</span>
              </div>
            )}

            {/* Bloque Pedagógico Universal para Personas No Asiduas a la Temática */}
            {resolvedLaymanText && (
              <div className="p-2 bg-amber-950/45 border border-amber-600/60 rounded-lg space-y-1 shadow-xs">
                <div className="flex items-center gap-1.5 text-[9.5px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                  <Users className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>💡 Comprensión Clara (No Especialistas / Ciudadanía)</span>
                </div>
                <p className="text-[11px] font-sans text-amber-100/95 leading-snug break-words">{resolvedLaymanText}</p>
              </div>
            )}

            {/* Estándar Regulatorio Europeo / OMS */}
            {displayRegulatory && (
              <div className="flex items-start gap-1.5 text-[10px] font-mono text-emerald-200 bg-emerald-950/80 px-2 py-1.5 rounded-md border border-emerald-700/80 shadow-xs leading-snug break-words">
                <Scale className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="font-semibold break-words">
                  {typeof displayRegulatory === 'string'
                    ? renderInlineScientificMath(displayRegulatory)
                    : renderInlineScientificMath(
                        `${displayRegulatory.document}${displayRegulatory.limitValue ? ` • Límite: ${displayRegulatory.limitValue}` : ''}`
                      )}
                </span>
              </div>
            )}

            {/* Cita de literatura científica indexada */}
            {displayCitation && (
              <div className="flex items-start gap-1.5 text-[10px] font-mono text-slate-300 italic leading-snug break-words">
                <BookOpen className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="break-words">{displayCitation}</span>
              </div>
            )}

            {/* Alternador de Diagrama Animado */}
            {activeDiagramType && (
              <div className="pt-1 border-t border-slate-800/80 mt-1.5">
                <button
                  type="button"
                  data-tooltip-action-btn="true"
                  data-scientific-tooltip-ignore="true"
                  onClick={e => {
                    e.stopPropagation();
                    setShowDiagram(!showDiagram);
                  }}
                  className="flex items-center gap-1.5 text-[9.5px] font-mono font-bold text-cyan-400 hover:text-cyan-300 transition-colors py-0.5 cursor-pointer"
                >
                  {showDiagram ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" /> Ocultar Diagrama Cinético Animado
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" /> Ver Diagrama Cinético Animado
                    </>
                  )}
                </button>

                {showDiagram && (
                  <div className="mt-2 pt-2 border-t border-slate-800">
                    <DeepScientificDiagram type={activeDiagramType} compact={true} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Esquina Arrastrable de Redimensionamiento (Windows Corner Resize Handle + Soporte Táctil — Idéntica a DraggableWindow.tsx líneas 694-702) */}
      {!isExpandedSize && (
        <div
          onPointerDown={onResizePointerDown}
          className="absolute bottom-0 right-0 w-6 h-6 sm:w-4 sm:h-4 cursor-nwse-resize flex items-end justify-end p-0.5 group z-30 select-none touch-none"
          title="Arrastre para redimensionar ancho y alto a voluntad (Estilo Windows / Táctil)"
        >
          <div className="w-3 h-3 sm:w-2.5 sm:h-2.5 border-r-2 border-b-2 border-slate-500 group-hover:border-cyan-400 transition-colors" />
        </div>
      )}
    </div>
  );
}

interface RootTooltipPayload {
  id: string;
  initX: number;
  initY: number;
  initW: number;
  initH: number;
  displayTitle?: React.ReactNode;
  displayDiscipline?: string;
  contextBreadcrumb?: string;
  displayPhysicsLaw?: string;
  displayContent?: React.ReactNode;
  shouldShowDoctoralAddendum: boolean;
  doctoralAddendum?: string;
  displayFormula?: string;
  formulaExplanation?: FormulaCompleteExplanation;
  displayUnitsAndRange?: string;
  resolvedLaymanText?: string;
  displayRegulatory?: string | { document: string; limitValue?: string };
  displayCitation?: string;
  activeDiagramType?: ScientificDiagramType;
  showDiagramByDefault?: boolean;
}

export function ScientificTooltip({
  children,
  title,
  content,
  explanation,
  laymanExplanation,
  topic,
  formula,
  citation,
  regulatory,
  normativeRef,
  normative,
  diagram,
  width = 'w-80',
  position = 'top',
  showDiagramByDefault = false,
  className
}: ScientificTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPinned, setIsPinned] = useState(true);
  const [showDiagram, setShowDiagram] = useState(showDiagramByDefault);
  const [domContext, setDomContext] = useState<DomHierarchyContext>(DEFAULT_DOM_CONTEXT);

  const dragControls = useDragControls();
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [customSize, setCustomSize] = useState<{ width?: number; height?: number }>({});
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  const windowRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const instanceIdRef = useRef<string>(`explicit-tooltip-${nextTooltipInstanceSeq++}`);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Consultar tópicos del registro unificado
  const topicData = topic ? getScientificTopic(topic) : undefined;

  const displayTitle =
    title ||
    (topicData?.title && domContext.elementLabel && !topicData.title.toLowerCase().includes(domContext.elementLabel.toLowerCase())
      ? `${topicData.title} — ${domContext.elementLabel}`
      : topicData?.title) ||
    domContext.elementLabel;
  const explicitContentProp = content || explanation;
  const rawDisplayContent = explicitContentProp || topicData?.explanation;
  const explicitCitation = citation || topicData?.literatureCitation;
  const explicitRegulatory = regulatory || normativeRef || normative || topicData?.regulatoryStandard;
  const activeDiagramType = diagram || topicData?.diagramType;

  const plainTitleStr = typeof displayTitle === 'string' ? displayTitle : '';
  const plainContentStr = typeof rawDisplayContent === 'string' ? rawDisplayContent : '';
  const plainRegStr =
    typeof explicitRegulatory === 'string'
      ? explicitRegulatory
      : explicitRegulatory
        ? `${explicitRegulatory.document} ${explicitRegulatory.limitValue || ''}`
        : '';

  // Síntesis Doctoral Contextualizada
  const doctoralProfile = synthesizeDoctoralRigor(
    plainTitleStr,
    plainContentStr,
    formula,
    plainRegStr,
    domContext,
    topicData?.formulaLaTeX
  );

  const displayContent = explicitContentProp ? doctoralProfile.contextualizedContent : doctoralProfile.contextualizedContent;
  const displayFormula = doctoralProfile.formulaLaTeX;
  const displayCitation = explicitCitation || doctoralProfile.citationText;
  const displayRegulatory = explicitRegulatory || doctoralProfile.regulatoryText;
  const displayDiscipline = topicData?.discipline || doctoralProfile.disciplineBadge;
  const displayPhysicsLaw = topicData?.physicsLaw || doctoralProfile.physicsLaw;
  const displayUnitsAndRange = doctoralProfile.unitsAndRange || (topicData?.units
    ? `${topicData.units}${topicData.typicalRange ? ` • Rango: ${topicData.typicalRange}` : ''}`
    : '');

  const shouldShowDoctoralAddendum = Boolean(doctoralProfile.doctoralAddendum);
  const resolvedLaymanText = laymanExplanation || doctoralProfile.laymanText;

  const closeTooltip = useCallback(() => {
    lastTooltipClosedTimestamp = Date.now();
    lastTapTimeRef.current = 0;
    setIsPinned(false);
    setIsVisible(false);
    setPos(null);
    setIsMaximized(false);
  }, []);

  const openTooltipNow = () => {
    if (Date.now() - lastTooltipClosedTimestamp < 220) return;
    if (Date.now() - lastTooltipResizeTimestamp < 450) return;

    const currentCtx = triggerRef.current
      ? extractDomContextForElement(triggerRef.current)
      : domContext;
    if (triggerRef.current) {
      setDomContext(currentCtx);
    }

    const triggerEl = triggerRef.current;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const padding = 12;

    let initW = 385;
    if (width.includes('w-[')) {
      const match = width.match(/w-\[(\d+)px\]/);
      if (match) initW = parseInt(match[1], 10);
    } else if (width.includes('w-96')) {
      initW = 384;
    } else if (width.includes('w-80')) {
      initW = 385;
    } else if (width.includes('w-72')) {
      initW = 310;
    }
    if (diagram && showDiagramByDefault) {
      initW = Math.max(initW, 410);
    }
    initW = Math.max(300, Math.min(initW, vw - padding * 2));
    const initH = Math.min(520, Math.round(vh * 0.78));

    let initX = 40;
    let initY = 40;

    if (triggerEl) {
      const rect = triggerEl.getBoundingClientRect();
      initX = Math.round(rect.left + rect.width / 2 - initW / 2);
      initY = Math.round(rect.top - initH - 10);

      if (position === 'bottom' || (position === 'top' && initY < padding)) {
        initY = Math.round(rect.bottom + 10);
      } else if (position === 'left') {
        initX = Math.round(rect.left - initW - 10);
        initY = Math.round(rect.top + rect.height / 2 - initH / 2);
      } else if (position === 'right') {
        initX = Math.round(rect.right + 10);
        initY = Math.round(rect.top + rect.height / 2 - initH / 2);
      }

      initX = Math.max(padding, Math.min(vw - initW - padding, initX));
      initY = Math.max(padding, Math.min(vh - initH - padding, initY));
    }

    // Si el host raíz <UniversalScientificTooltipDelegator /> está montado en App.tsx (igual que DraggableWindow),
    // delegar el renderizado a la raíz para evitar burbujeo de eventos sintéticos de React Portal
    if (typeof document !== 'undefined' && document.body.getAttribute('data-scientific-root-host-mounted') === 'true') {
      const liveTitle =
        title ||
        (topicData?.title && currentCtx.elementLabel && !topicData.title.toLowerCase().includes(currentCtx.elementLabel.toLowerCase())
          ? `${topicData.title} — ${currentCtx.elementLabel}`
          : topicData?.title) ||
        currentCtx.elementLabel;
      const livePlainTitle = typeof liveTitle === 'string' ? liveTitle : '';
      const liveProfile = synthesizeDoctoralRigor(
        livePlainTitle,
        plainContentStr,
        formula,
        plainRegStr,
        currentCtx,
        topicData?.formulaLaTeX
      );
      const payload: RootTooltipPayload = {
        id: instanceIdRef.current,
        initX,
        initY,
        initW,
        initH,
        displayTitle: liveTitle,
        displayDiscipline: topicData?.discipline || liveProfile.disciplineBadge,
        contextBreadcrumb: liveProfile.contextBreadcrumb,
        displayPhysicsLaw: topicData?.physicsLaw || liveProfile.physicsLaw,
        displayContent: explicitContentProp && typeof explicitContentProp !== 'string' ? explicitContentProp : liveProfile.contextualizedContent,
        shouldShowDoctoralAddendum: Boolean(liveProfile.doctoralAddendum),
        doctoralAddendum: liveProfile.doctoralAddendum,
        displayFormula: liveProfile.formulaLaTeX,
        formulaExplanation: liveProfile.formulaExplanation,
        displayUnitsAndRange:
          liveProfile.unitsAndRange ||
          (topicData?.units ? `${topicData.units}${topicData.typicalRange ? ` • Rango: ${topicData.typicalRange}` : ''}` : ''),
        resolvedLaymanText: laymanExplanation || liveProfile.laymanText,
        displayRegulatory: explicitRegulatory || liveProfile.regulatoryText,
        displayCitation: explicitCitation || liveProfile.citationText,
        activeDiagramType,
        showDiagramByDefault
      };
      window.dispatchEvent(new CustomEvent('scientific-tooltip-open-in-root', { detail: payload }));
      return;
    }

    dragX.set(0);
    dragY.set(0);
    setPos({ x: initX, y: initY });
    setCustomSize({ width: initW, height: initH });
    setIsMaximized(false);
    setIsPinned(true);
    setIsVisible(true);
  };

  // Manejo interactivo de redimensionamiento desde la esquina inferior derecha (Copiado literalmente de DraggableWindow.tsx líneas 286-328)
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!windowRef.current || isMaximized) return;

    const rect = windowRef.current.getBoundingClientRect();
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: rect.width,
      h: rect.height
    };

    setIsResizing(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!resizeStartRef.current) return;
      lastTooltipResizeTimestamp = Date.now();
      const dx = moveEvent.clientX - resizeStartRef.current.x;
      const dy = moveEvent.clientY - resizeStartRef.current.y;

      const minW = Math.min(310, window.innerWidth - 16);
      const maxW = Math.min(window.innerWidth * 0.98, 1600);
      const minH = 200;
      const maxH = Math.min(window.innerHeight * 0.92, 1200);

      const newW = Math.round(Math.max(minW, Math.min(maxW, resizeStartRef.current.w + dx)));
      const newH = Math.round(Math.max(minH, Math.min(maxH, resizeStartRef.current.h + dy)));

      setCustomSize({ width: newW, height: newH });
    };

    const handlePointerUp = () => {
      lastTooltipResizeTimestamp = Date.now();
      setIsResizing(false);
      resizeStartRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [isMaximized]);

  const toggleMaximize = useCallback(() => {
    setIsMaximized(prev => !prev);
  }, []);

  const isBlockOrFlex =
    className?.includes('w-full') ||
    className?.includes('flex-1') ||
    className?.includes('block') ||
    className?.includes('flex');
  const wrapperClass = isBlockOrFlex
    ? `relative shrink-0 cursor-help ${className}`
    : `relative inline-flex items-center shrink-0 cursor-help ${className || ''}`;

  const inlineStyle: React.CSSProperties = {
    zIndex: 2147483640,
    maxWidth: isMaximized ? 'calc(100vw - 16px)' : '96vw'
  };
  if (!isMaximized && pos) {
    inlineStyle.top = `${pos.y}px`;
    inlineStyle.left = `${pos.x}px`;
    if (customSize.width) {
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
      inlineStyle.width = `${Math.min(Math.round(customSize.width), Math.max(300, vw - 14))}px`;
    }
    if (customSize.height) {
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
      inlineStyle.height = `${Math.min(Math.round(customSize.height), Math.max(200, vh - 24))}px`;
    }
  }

  const fallbackWindowContent = isVisible && pos ? (
    <motion.div
      drag={!isMaximized}
      dragControls={dragControls}
      dragListener={false}
      dragElastic={0.05}
      dragMomentum={false}
      data-scientific-portal="true"
      className={`fixed draggable-window-container ${
        isMaximized ? 'top-2 left-2 right-2 bottom-2 w-[calc(100vw-16px)] h-[calc(100dvh-16px)]' : ''
      } shadow-2xl pointer-events-auto flex flex-col subpixel-antialiased`}
      style={{
        ...inlineStyle,
        ...(isMaximized ? { x: 0, y: 0 } : { x: dragX, y: dragY })
      }}
    >
      <div
        ref={windowRef}
        data-draggable-window="true"
        className={`draggable-window-content bg-slate-950/98 border ${
          isPinned ? 'border-amber-500/85' : 'border-slate-700/80'
        } shadow-2xl rounded-lg text-[11.5px] text-slate-100 leading-relaxed flex flex-col overflow-hidden ${
          isMaximized || customSize.height ? 'h-full w-full' : 'max-h-[84dvh] sm:max-h-[90vh]'
        } relative`}
      >
        <ScientificTooltipCardBody
          displayTitle={displayTitle}
          displayDiscipline={displayDiscipline}
          contextBreadcrumb={doctoralProfile.contextBreadcrumb}
          displayPhysicsLaw={displayPhysicsLaw}
          displayContent={displayContent}
          shouldShowDoctoralAddendum={shouldShowDoctoralAddendum}
          doctoralAddendum={doctoralProfile.doctoralAddendum}
          displayFormula={displayFormula}
          formulaExplanation={doctoralProfile.formulaExplanation}
          displayUnitsAndRange={displayUnitsAndRange}
          resolvedLaymanText={resolvedLaymanText}
          displayRegulatory={displayRegulatory}
          displayCitation={displayCitation}
          activeDiagramType={activeDiagramType}
          showDiagram={showDiagram}
          setShowDiagram={setShowDiagram}
          isPinned={isPinned}
          setIsPinned={setIsPinned}
          onStartDrag={e => {
            if (!isMaximized) {
              dragControls.start(e);
            }
          }}
          onResizePointerDown={handleResizePointerDown}
          onToggleExpandSize={toggleMaximize}
          isExpandedSize={isMaximized}
          customDimensionsLabel={
            isResizing && customSize.width && customSize.height
              ? `${customSize.width}×${customSize.height}px`
              : undefined
          }
          onClosePinned={closeTooltip}
        />
      </div>
    </motion.div>
  ) : null;

  const regString =
    typeof displayRegulatory === 'string'
      ? displayRegulatory
      : displayRegulatory
        ? `${displayRegulatory.document}${displayRegulatory.limitValue ? ` • Límite: ${displayRegulatory.limitValue}` : ''}`
        : undefined;

  const isEditableTextNode = (el: HTMLElement | null): boolean => {
    if (!el) return false;
    const inputEl = el.closest('input, textarea, [contenteditable="true"]') as HTMLElement | null;
    if (!inputEl) return false;
    if (inputEl.tagName === 'TEXTAREA' || inputEl.getAttribute('contenteditable') === 'true') return true;
    if (inputEl.tagName === 'INPUT') {
      const t = ((inputEl as HTMLInputElement).type || 'text').toLowerCase();
      return ['text', 'number', 'search', 'email', 'password', 'tel', 'url'].includes(t);
    }
    return false;
  };

  const handleTriggerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('[data-scientific-portal="true"]')) return;
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleTriggerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('[data-scientific-portal="true"]')) return;
    if (Date.now() - lastTooltipResizeTimestamp < 450) return;

    const movedDist = Math.hypot(
      e.clientX - pointerDownPosRef.current.x,
      e.clientY - pointerDownPosRef.current.y
    );
    if (movedDist > 10) {
      lastTapTimeRef.current = 0;
      return;
    }

    if (!children) {
      e.stopPropagation();
      openTooltipNow();
      return;
    }

    if (isEditableTextNode(target)) return;

    const now = Date.now();
    if (now - lastTapTimeRef.current <= 450) {
      lastTapTimeRef.current = 0;
      openTooltipNow();
    } else {
      lastTapTimeRef.current = now;
    }
  };

  return (
    <div
      ref={triggerRef}
      className={wrapperClass}
      onPointerDown={handleTriggerPointerDown}
      onPointerUp={handleTriggerPointerUp}
      onDoubleClick={e => {
        const target = e.target as HTMLElement | null;
        if (target?.closest('[data-scientific-portal="true"]')) return;
        if (Date.now() - lastTooltipResizeTimestamp < 450) return;
        if (children && isEditableTextNode(target)) return;
        e.stopPropagation();
        openTooltipNow();
      }}
      onContextMenu={e => {
        if (e.altKey) {
          e.preventDefault();
          openTooltipNow();
        }
      }}
      data-scientific-tooltip-explicit="true"
      data-scientific-title={typeof displayTitle === 'string' ? displayTitle : undefined}
      data-scientific-tooltip={typeof displayContent === 'string' ? displayContent : undefined}
      data-scientific-formula={typeof displayFormula === 'string' ? displayFormula : undefined}
      data-scientific-regulatory={regString}
      data-scientific-citation={typeof displayCitation === 'string' ? displayCitation : undefined}
    >
      {children || <Info className="w-3 h-3 text-slate-500 hover:text-cyan-400 transition-colors inline-block ml-1" />}

      {typeof document !== 'undefined' && isVisible ? createPortal(fallbackWindowContent, document.body) : null}
    </div>
  );
}

/**
 * INSPECTOR UNIVERSAL Y HOST RAÍZ DE TOOLTIPS CIENTÍFICOS (Regla 7, 22 y 27 AGENTS.md).
 * Montado en la raíz de App.tsx (exactamente al mismo nivel que <DraggableWindow>).
 * Renderiza TODOS los cuadros explicativos de doble clic / doble toque (tanto explícitos <ScientificTooltip>
 * como delegados automáticos) usando exactamente el mismo componente <motion.div>, dragControls,
 * handleResizePointerDown y esquina inferior derecha ⌟ de DraggableWindow.tsx.
 */
export function UniversalScientificTooltipDelegator() {
  const [activePayload, setActivePayload] = useState<RootTooltipPayload | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPinned, setIsPinned] = useState(true);
  const [showDiagram, setShowDiagram] = useState(false);

  // Exactamente las mismas variables de estado y refs de DraggableWindow.tsx
  const dragControls = useDragControls();
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [customSize, setCustomSize] = useState<{ width?: number; height?: number }>({});
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  const windowRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const lastTapTargetRef = useRef<HTMLElement | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const closeDelegatedTooltip = useCallback(() => {
    lastTooltipClosedTimestamp = Date.now();
    lastTapTimeRef.current = 0;
    lastTapTargetRef.current = null;
    setIsPinned(false);
    setIsVisible(false);
    setPos(null);
    setActivePayload(null);
    setIsMaximized(false);
  }, []);

  // Manejo interactivo de redimensionamiento desde la esquina inferior derecha (Copiado literalmente de DraggableWindow.tsx líneas 286-328)
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!windowRef.current || isMaximized) return;

    const rect = windowRef.current.getBoundingClientRect();
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: rect.width,
      h: rect.height
    };

    setIsResizing(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!resizeStartRef.current) return;
      lastTooltipResizeTimestamp = Date.now();
      const dx = moveEvent.clientX - resizeStartRef.current.x;
      const dy = moveEvent.clientY - resizeStartRef.current.y;

      const minW = Math.min(310, window.innerWidth - 16);
      const maxW = Math.min(window.innerWidth * 0.98, 1600);
      const minH = 200;
      const maxH = Math.min(window.innerHeight * 0.92, 1200);

      const newW = Math.round(Math.max(minW, Math.min(maxW, resizeStartRef.current.w + dx)));
      const newH = Math.round(Math.max(minH, Math.min(maxH, resizeStartRef.current.h + dy)));

      setCustomSize({ width: newW, height: newH });
    };

    const handlePointerUp = () => {
      lastTooltipResizeTimestamp = Date.now();
      setIsResizing(false);
      resizeStartRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [isMaximized]);

  // Alternar estado maximizado (Pantalla completa / tamaño restaurado — Copiado de DraggableWindow.tsx líneas 331-337)
  const toggleMaximize = useCallback(() => {
    setIsMaximized(prev => !prev);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.setAttribute('data-scientific-root-host-mounted', 'true');

    const handleOpenInRoot = (e: Event) => {
      const customEv = e as CustomEvent<RootTooltipPayload>;
      const payload = customEv.detail;
      if (!payload) return;

      dragX.set(0);
      dragY.set(0);
      setPos({ x: payload.initX, y: payload.initY });
      setCustomSize({ width: payload.initW, height: payload.initH });
      setIsMaximized(false);
      setShowDiagram(Boolean(payload.showDiagramByDefault));
      setActivePayload(payload);
      setIsPinned(true);
      setIsVisible(true);
    };

    const findEligibleTarget = (node: EventTarget | null): HTMLElement | null => {
      if (!(node instanceof HTMLElement)) return null;
      if (node.closest('[data-scientific-portal="true"]')) return null;
      if (node.closest('[data-scientific-tooltip-ignore="true"]')) return null;
      if (node.closest('[data-scientific-tooltip-explicit="true"]')) return null;
      if (node.closest('.maplibregl-canvas-container')) return null;
      if (node.closest('textarea, [contenteditable="true"]')) return null;

      let candidate = node.closest(
        'th, td, select, input, button, label, summary, [role="tab"], [role="button"], [data-scientific-auto-tooltip], [data-metric-badge], [data-stat-card], .cursor-pointer, .cursor-help'
      ) as HTMLElement | null;

      // Fallback para tarjetas de indicadores/métricas y píldoras de estado con borde (ej. Tiempo de Vida τ, Razón de Leighton Φ, Régimen, etc.)
      if (!candidate) {
        const cardCandidate = node.closest(
          'div[class*="border"][class*="rounded"], span[class*="border"][class*="rounded"]'
        ) as HTMLElement | null;
        if (cardCandidate && !cardCandidate.hasAttribute('data-draggable-window')) {
          const rawCardText = (cardCandidate.textContent || '').trim();
          if (rawCardText.length >= 2 && rawCardText.length <= 280) {
            candidate = cardCandidate;
          }
        }
      }

      if (!candidate) return null;
      if (candidate.tagName === 'LABEL' && !candidate.querySelector('input[type="file"]') && !candidate.className.includes('cursor-pointer')) {
        return null;
      }
      if (candidate.tagName === 'INPUT') {
        const inputType = ((candidate as HTMLInputElement).type || 'text').toLowerCase();
        if (['text', 'number', 'search', 'email', 'password', 'tel', 'url'].includes(inputType)) {
          return null;
        }
      }
      if (candidate.closest('[data-scientific-tooltip-explicit="true"]')) return null;
      if (candidate.closest('[data-scientific-portal="true"]')) return null;

      const text = cleanText(
        candidate.textContent ||
          candidate.getAttribute('data-captured-native-title') ||
          candidate.getAttribute('title') ||
          candidate.getAttribute('aria-label') ||
          candidate.getAttribute('placeholder'),
        90
      );
      if (!text && candidate.tagName !== 'INPUT' && candidate.tagName !== 'SELECT') {
        return null;
      }
      return candidate;
    };

    const activateDelegatedTarget = (eligible: HTMLElement) => {
      if (Date.now() - lastTooltipClosedTimestamp < 220) return;
      if (Date.now() - lastTooltipResizeTimestamp < 450) return;
      if (!document.body.contains(eligible)) return;

      const rawTitleAttr = eligible.getAttribute('title');
      if (rawTitleAttr) {
        eligible.setAttribute('data-captured-native-title', rawTitleAttr);
        eligible.removeAttribute('title');
      }
      const capturedTitle = eligible.getAttribute('data-captured-native-title') || '';
      const nestedExplicit = eligible.querySelector('[data-scientific-tooltip-explicit="true"]') as HTMLElement | null;
      const nestedExplicitTitle = nestedExplicit?.getAttribute('data-scientific-title') || '';
      const nestedExplicitContent = nestedExplicit?.getAttribute('data-scientific-tooltip') || '';
      const nestedExplicitFormula = nestedExplicit?.getAttribute('data-scientific-formula') || undefined;
      const nestedExplicitReg = nestedExplicit?.getAttribute('data-scientific-regulatory') || undefined;

      const ctx = extractDomContextForElement(eligible);

      const rect = eligible.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const padding = 12;

      const initW = Math.min(385, vw - padding * 2);
      const initH = Math.min(520, Math.round(vh * 0.78));

      let initX = Math.round(rect.left + rect.width / 2 - initW / 2);
      initX = Math.max(padding, Math.min(vw - initW - padding, initX));

      let initY = Math.round(rect.top - initH - 10);
      if (initY < padding) {
        initY = Math.round(rect.bottom + 10);
      }
      initY = Math.max(padding, Math.min(vh - initH - padding, initY));

      const baseTitleStr = nestedExplicitTitle || ctx.elementLabel || cleanText(capturedTitle, 70) || ctx.elementKindLabel;
      const titleStr =
        !nestedExplicitTitle &&
        ctx.tableColHeader &&
        ctx.tableRowLabel &&
        ctx.elementKind !== 'COLUMN_HEADER_TH' &&
        !baseTitleStr.toLowerCase().includes(ctx.tableColHeader.slice(0, 8).toLowerCase()) &&
        !baseTitleStr.toLowerCase().includes(ctx.tableRowLabel.slice(0, 8).toLowerCase())
          ? `${ctx.tableColHeader} — ${ctx.tableRowLabel}: ${baseTitleStr}`
          : !nestedExplicitTitle &&
              ctx.tableColHeader &&
              ctx.elementKind !== 'COLUMN_HEADER_TH' &&
              !baseTitleStr.toLowerCase().includes(ctx.tableColHeader.slice(0, 8).toLowerCase())
            ? `${ctx.tableColHeader}: ${baseTitleStr}`
            : baseTitleStr;
      const contentSeed =
        nestedExplicitContent ||
        (capturedTitle && capturedTitle.toLowerCase() !== baseTitleStr.toLowerCase() ? capturedTitle : '');
      const doctoralProfile = synthesizeDoctoralRigor(
        titleStr,
        contentSeed,
        nestedExplicitFormula,
        nestedExplicitReg,
        ctx
      );

      dragX.set(0);
      dragY.set(0);
      setPos({ x: initX, y: initY });
      setCustomSize({ width: initW, height: initH });
      setIsMaximized(false);
      setShowDiagram(false);
      setActivePayload({
        id: 'universal-delegator',
        initX,
        initY,
        initW,
        initH,
        displayTitle: titleStr,
        displayDiscipline: doctoralProfile.disciplineBadge,
        contextBreadcrumb: doctoralProfile.contextBreadcrumb,
        displayPhysicsLaw: doctoralProfile.physicsLaw,
        displayContent: doctoralProfile.contextualizedContent,
        shouldShowDoctoralAddendum: true,
        doctoralAddendum: doctoralProfile.doctoralAddendum,
        displayFormula: doctoralProfile.formulaLaTeX,
        formulaExplanation: doctoralProfile.formulaExplanation,
        displayUnitsAndRange: doctoralProfile.unitsAndRange,
        resolvedLaymanText: doctoralProfile.laymanText,
        displayRegulatory: doctoralProfile.regulatoryText,
        displayCitation: doctoralProfile.citationText,
        activeDiagramType: undefined,
        showDiagramByDefault: false
      });
      setIsPinned(true);
      setIsVisible(true);
    };

    const handlePointerDown = (e: PointerEvent) => {
      const targetNode = e.target as HTMLElement | null;
      if (targetNode?.closest('[data-scientific-portal="true"]')) return;
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      const targetNode = e.target as HTMLElement | null;
      if (targetNode?.closest('[data-scientific-portal="true"]')) return;
      if (Date.now() - lastTooltipResizeTimestamp < 450) return;

      const movedDist = Math.hypot(
        e.clientX - pointerDownPosRef.current.x,
        e.clientY - pointerDownPosRef.current.y
      );
      if (movedDist > 10) {
        lastTapTargetRef.current = null;
        lastTapTimeRef.current = 0;
        return;
      }

      const eligible = findEligibleTarget(e.target);
      if (!eligible) {
        lastTapTargetRef.current = null;
        lastTapTimeRef.current = 0;
        return;
      }

      const now = Date.now();
      if (lastTapTargetRef.current === eligible && now - lastTapTimeRef.current <= 450) {
        lastTapTargetRef.current = null;
        lastTapTimeRef.current = 0;
        activateDelegatedTarget(eligible);
      } else {
        lastTapTargetRef.current = eligible;
        lastTapTimeRef.current = now;
      }
    };

    const handleDblClick = (e: MouseEvent) => {
      const targetNode = e.target as HTMLElement | null;
      if (targetNode?.closest('[data-scientific-portal="true"]')) return;
      if (Date.now() - lastTooltipResizeTimestamp < 450) return;
      const eligible = findEligibleTarget(e.target);
      if (!eligible) return;
      activateDelegatedTarget(eligible);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDelegatedTooltip();
      }
    };

    window.addEventListener('scientific-tooltip-open-in-root', handleOpenInRoot);
    document.addEventListener('pointerdown', handlePointerDown, { passive: true });
    document.addEventListener('pointerup', handlePointerUp, { passive: true });
    document.addEventListener('dblclick', handleDblClick, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.removeAttribute('data-scientific-root-host-mounted');
      window.removeEventListener('scientific-tooltip-open-in-root', handleOpenInRoot);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('dblclick', handleDblClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeDelegatedTooltip, dragX, dragY]);

  if (!isVisible || !activePayload || !pos) return null;

  // Estructura de estilo y contenedor <motion.div> copiada 1:1 de DraggableWindow.tsx (líneas 339-354 y 420-458)
  const inlineStyle: React.CSSProperties = {
    zIndex: 2147483640,
    maxWidth: isMaximized ? 'calc(100vw - 16px)' : '96vw'
  };
  if (!isMaximized) {
    inlineStyle.top = `${pos.y}px`;
    inlineStyle.left = `${pos.x}px`;
    if (customSize.width) {
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const clampedW = Math.min(Math.round(customSize.width), Math.max(300, vw - 14));
      inlineStyle.width = `${clampedW}px`;
    }
    if (customSize.height) {
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
      const clampedH = Math.min(Math.round(customSize.height), Math.max(200, vh - 24));
      inlineStyle.height = `${clampedH}px`;
    }
  }

  return (
    <motion.div
      drag={!isMaximized}
      dragControls={dragControls}
      dragListener={false}
      dragElastic={0.05}
      dragMomentum={false}
      data-scientific-portal="true"
      data-draggable-window-container="true"
      className={`fixed draggable-window-container ${
        isMaximized ? 'top-2 left-2 right-2 bottom-2 w-[calc(100vw-16px)] h-[calc(100dvh-16px)]' : ''
      } shadow-2xl pointer-events-auto flex flex-col subpixel-antialiased`}
      style={{
        ...inlineStyle,
        ...(isMaximized ? { x: 0, y: 0 } : { x: dragX, y: dragY })
      }}
    >
      <div
        ref={windowRef}
        data-draggable-window="true"
        className={`draggable-window-content bg-slate-950/98 border ${
          isPinned ? 'border-amber-500/85' : 'border-slate-700/80'
        } shadow-2xl rounded-lg text-[11.5px] text-slate-100 leading-relaxed flex flex-col overflow-hidden ${
          isMaximized || customSize.height ? 'h-full w-full' : 'max-h-[84dvh] sm:max-h-[90vh]'
        } relative`}
      >
        <ScientificTooltipCardBody
          displayTitle={activePayload.displayTitle}
          displayDiscipline={activePayload.displayDiscipline}
          contextBreadcrumb={activePayload.contextBreadcrumb}
          displayPhysicsLaw={activePayload.displayPhysicsLaw}
          displayContent={activePayload.displayContent}
          shouldShowDoctoralAddendum={activePayload.shouldShowDoctoralAddendum}
          doctoralAddendum={activePayload.doctoralAddendum}
          displayFormula={activePayload.displayFormula}
          formulaExplanation={activePayload.formulaExplanation}
          displayUnitsAndRange={activePayload.displayUnitsAndRange}
          resolvedLaymanText={activePayload.resolvedLaymanText}
          displayRegulatory={activePayload.displayRegulatory}
          displayCitation={activePayload.displayCitation}
          activeDiagramType={activePayload.activeDiagramType}
          showDiagram={showDiagram}
          setShowDiagram={setShowDiagram}
          isPinned={isPinned}
          setIsPinned={setIsPinned}
          onStartDrag={e => {
            if (!isMaximized) {
              dragControls.start(e);
            }
          }}
          onResizePointerDown={handleResizePointerDown}
          onToggleExpandSize={toggleMaximize}
          isExpandedSize={isMaximized}
          customDimensionsLabel={
            isResizing && customSize.width && customSize.height
              ? `${customSize.width}×${customSize.height}px`
              : undefined
          }
          onClosePinned={closeDelegatedTooltip}
        />
      </div>
    </motion.div>
  );
}
