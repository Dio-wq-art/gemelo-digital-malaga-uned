import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export interface MathFormulaProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * Normaliza expresiones LaTeX reparando dobles barras accidentales (\\text -> \text),
 * caracteres de control de plantillas JS (\t -> \text, \f -> \frac, \b -> \beta, \r -> \right)
 * y comandos dentro de \text{...}.
 */
export function normalizeLatexFormula(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let cleaned = raw.trim();
  if (cleaned.startsWith('$$') && cleaned.endsWith('$$')) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if (cleaned.startsWith('$') && cleaned.endsWith('$')) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // 1. Recuperar caracteres de control producidos por barra simple en literales JS (\t, \f, \b, \r, \n, \v)
  cleaned = cleaned
    .replace(/\x09(ext\b|extbf\b|extit\b|extrm\b|au\b|heta\b|imes\b|o\b|ilde\b|riangle\b|an\b|anh\b|frac\b|op\b)/g, '\\t$1')
    .replace(/\x0c(rac\b|orall\b|lat\b)/g, '\\f$1')
    .replace(/\x08(eta\b|ar\b|inom\b|egin\b|ullet\b|oxed\b|ig\b|igg\b|oldsymbol\b|bmod\b|ackslash\b|ecause\b)/g, '\\b$1')
    .replace(/\x0d(ight|ho\b|angle\b|ceil\b|floor\b|m\b)/g, '\\r$1')
    .replace(/\x0a(abla\b|u\b|eq\b|eg\b|ot\b|otin\b|atural\b|ewline\b)/g, '\\n$1')
    .replace(/\x0b(arepsilon\b|arphi\b|artheta\b|arpi\b|arrho\b|arsigma\b|ec\b|ee\b|dash\b|dots\b)/g, '\\v$1');

  // 2. Colapsar múltiples barras invertidas seguidas inmediatamente de comando LaTeX o símbolo escapado (ej. \\text -> \text, \\_ -> \_)
  cleaned = cleaned.replace(/\\{2,}([a-zA-Z_%&{},;:!])/g, '\\$1');

  // 3. Reparar comandos con llaves a los que se les haya omitido la barra invertida
  cleaned = cleaned.replace(
    /(?<!\\)\b(text|mathrm|mathbf|mathcal|mathit|mathsf|mathtt|textbf|textit|textrm|overline|underline|widehat|widetilde|overrightarrow|overbrace|underbrace|sqrt|frac|dfrac|tfrac|binom)\s*\{/g,
    '\\$1{'
  );

  // 4. Limpiar comandos exclusivos de modo matemático que estén dentro de \text{...}
  cleaned = cleaned.replace(/\\text\{([^{}]*)\}/g, (_, inner: string) => {
    const safeInner = inner
      .replace(/\\cdot\b/g, '·')
      .replace(/\\times\b/g, '×')
      .replace(/\\mu\b/g, 'µ')
      .replace(/\\pm\b/g, '±')
      .replace(/\\approx\b/g, '≈');
    return `\\text{${safeInner}}`;
  });

  return cleaned;
}

/**
 * Componente universal de renderizado de fórmulas matemáticas con KaTeX.
 * Renderiza de forma segura ecuaciones LaTeX, PDE, ODE, cinética química y métricas físicas.
 */
export const MathFormula: React.FC<MathFormulaProps> = React.memo(({
  math,
  displayMode = false,
  className = ''
}) => {
  const renderedHtml = useMemo(() => {
    if (!math || typeof math !== 'string') return null;
    const cleaned = normalizeLatexFormula(math);
    if (!cleaned) return null;

    try {
      return katex.renderToString(cleaned, {
        displayMode,
        throwOnError: false,
        output: 'html',
        trust: true,
        strict: false
      });
    } catch {
      return null;
    }
  }, [math, displayMode]);

  if (!renderedHtml) {
    return (
      <span data-math-raw={math} className={`font-mono text-cyan-300 math-formula-rendered ${className}`}>
        {formatScientificSymbols(math)}
      </span>
    );
  }

  return (
    <span
      data-math-raw={math}
      className={`inline-block math-formula-rendered ${displayMode ? 'w-full text-center my-1' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
});

MathFormula.displayName = 'MathFormula';

/**
 * Normaliza símbolos científicos y fórmulas químicas en texto plano.
 */
export function formatScientificSymbols(text: string): string {
  if (!text) return text;
  return text
    .replace(/\\+text\{([^{}]*)\}/g, '$1')
    .replace(/\\+mathrm\{([^{}]*)\}/g, '$1')
    .replace(/\\+mathbf\{([^{}]*)\}/g, '$1')
    .replace(/\\+sum\b/g, '∑')
    .replace(/\\+prod\b/g, '∏')
    .replace(/\\+int\b/g, '∫')
    .replace(/\\+partial\b/g, '∂')
    .replace(/\\+nabla\b/g, '∇')
    .replace(/\\+Delta\b/g, 'Δ')
    .replace(/\\+Phi\b/g, 'Φ')
    .replace(/\\+Psi\b/g, 'Ψ')
    .replace(/\\+Omega\b/g, 'Ω')
    .replace(/\\+Gamma\b/g, 'Γ')
    .replace(/\\+Lambda\b/g, 'Λ')
    .replace(/\\+alpha\b/g, 'α')
    .replace(/\\+beta\b/g, 'β')
    .replace(/\\+gamma\b/g, 'γ')
    .replace(/\\+delta\b/g, 'δ')
    .replace(/\\+varepsilon\b/g, 'ε')
    .replace(/\\+epsilon\b/g, 'ε')
    .replace(/\\+zeta\b/g, 'ζ')
    .replace(/\\+eta\b/g, 'η')
    .replace(/\\+theta\b/g, 'θ')
    .replace(/\\+kappa\b/g, 'κ')
    .replace(/\\+lambda\b/g, 'λ')
    .replace(/\\+mu\b/g, 'µ')
    .replace(/\\+nu\b/g, 'ν')
    .replace(/\\+xi\b/g, 'ξ')
    .replace(/\\+pi\b/g, 'π')
    .replace(/\\+rho\b/g, 'ρ')
    .replace(/\\+sigma\b/g, 'σ')
    .replace(/\\+tau\b/g, 'τ')
    .replace(/\\+phi\b/g, 'φ')
    .replace(/\\+chi\b/g, 'χ')
    .replace(/\\+psi\b/g, 'ψ')
    .replace(/\\+omega\b/g, 'ω')
    .replace(/\\+le\b/g, '≤')
    .replace(/\\+leq\b/g, '≤')
    .replace(/\\+ge\b/g, '≥')
    .replace(/\\+geq\b/g, '≥')
    .replace(/\\+neq\b/g, '≠')
    .replace(/\\+approx\b/g, '≈')
    .replace(/\\+pm\b/g, '±')
    .replace(/\\+cdot\b/g, '·')
    .replace(/\\+times\b/g, '×')
    .replace(/\\+implies\b/g, '⇒')
    .replace(/\\+rightarrow\b/g, '→')
    .replace(/\\+leftarrow\b/g, '←')
    .replace(/\\+leftrightarrow\b/g, '↔')
    .replace(/\\+infty\b/g, '∞')
    .replace(/<->/g, '↔')
    .replace(/\s->\s/g, ' → ')
    .replace(/\bCH3C\(O\)O2•/g, 'CH₃C(O)O₂•')
    .replace(/\bCa\(NO3\)2\b/g, 'Ca(NO₃)₂')
    .replace(/\balpha-Fe2O3\b/g, 'α-Fe₂O₃')
    .replace(/\bFe2O3\b/g, 'Fe₂O₃')
    .replace(/\bTiO2\b/g, 'TiO₂')
    .replace(/\b15NO2\b/g, '¹⁵NO₂')
    .replace(/\b15NO\b/g, '¹⁵NO')
    .replace(/\bClNO2\b/g, 'ClNO₂')
    .replace(/\bN2O5\b/g, 'N₂O₅')
    .replace(/\bHNO3\b/g, 'HNO₃')
    .replace(/\bH2O2\b/g, 'H₂O₂')
    .replace(/\bH2SO4\b/g, 'H₂SO₄')
    .replace(/\bH2CO3\b/g, 'H₂CO₃')
    .replace(/\bH2O\b/g, 'H₂O')
    .replace(/\bSO4\^2-/g, 'SO₄²⁻')
    .replace(/\bCO3\^2-/g, 'CO₃²⁻')
    .replace(/\bNO3-/g, 'NO₃⁻')
    .replace(/\bNH4\+/g, 'NH₄⁺')
    .replace(/\bNH3\b/g, 'NH₃')
    .replace(/\bNO2\b/g, 'NO₂')
    .replace(/\bNOx\b/g, 'NOₓ')
    .replace(/\bSO2\b/g, 'SO₂')
    .replace(/\bO3\b/g, 'O₃')
    .replace(/\bCO2\b/g, 'CO₂')
    .replace(/\bCH4\b/g, 'CH₄')
    .replace(/\bPM2\.5\b/g, 'PM₂.₅')
    .replace(/\bPM10\b/g, 'PM₁₀')
    .replace(/\balpha_/g, 'α_')
    .replace(/\bbeta_/g, 'β_')
    .replace(/\bgamma_/g, 'γ_')
    .replace(/\bdelta_/g, 'δ_')
    .replace(/\btau_/g, 'τ_')
    .replace(/\bsigma_/g, 'σ_')
    .replace(/\blambda_/g, 'λ_')
    .replace(/\bu_\*/g, 'u*')
    .replace(/\bz_0\b/g, 'z₀')
    .replace(/&alpha;/g, 'α')
    .replace(/&beta;/g, 'β')
    .replace(/&gamma;/g, 'γ')
    .replace(/&delta;/g, 'δ')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<');
}

/**
 * Renderiza un fragmento de texto formateando subíndices tipo X_Y (ej. T_skin, AMF_3D, v_d, J_NO₂)
 * como elementos <sub> reales para eliminar guiones bajos crudos en la interfaz.
 */
function renderSubscriptsInPlainText(text: string, keyPrefix: string): React.ReactNode {
  const formatted = formatScientificSymbols(text);
  const subRegex = /\b([A-Za-zΑ-Ωα-ωΔΦΨΩΓΛ∂∇]+)_(\{[^{}]+\}|[A-Za-z0-9,+-]+(?:\+)?)/g;
  if (!subRegex.test(formatted)) {
    return formatted;
  }
  subRegex.lastIndex = 0;
  const nodes: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let subIdx = 0;

  while ((match = subRegex.exec(formatted)) !== null) {
    if (match.index > lastIdx) {
      nodes.push(formatted.slice(lastIdx, match.index));
    }
    const base = match[1];
    const rawSub = match[2].startsWith('{') && match[2].endsWith('}')
      ? match[2].slice(1, -1)
      : match[2];
    nodes.push(
      <span key={`${keyPrefix}-sub-${subIdx++}`} className="font-mono inline-baseline">
        {base}
        <sub className="text-[0.76em] leading-none">{formatScientificSymbols(rawSub)}</sub>
      </span>
    );
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < formatted.length) {
    nodes.push(formatted.slice(lastIdx));
  }
  return nodes;
}

/**
 * Renderiza texto mixto que puede contener expresiones matemáticas entre signos `$...$` o símbolos científicos con subíndices.
 */
export function renderInlineScientificMath(text: string): React.ReactNode {
  if (!text || typeof text !== 'string') return text;
  if (!text.includes('$')) {
    return renderSubscriptsInPlainText(text, 'plain');
  }
  const parts = text.split(/(\$[^$]+\$)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      return <MathFormula key={idx} math={part.slice(1, -1)} displayMode={false} className="mx-0.5" />;
    }
    return <React.Fragment key={idx}>{renderSubscriptsInPlainText(part, `p${idx}`)}</React.Fragment>;
  });
}

