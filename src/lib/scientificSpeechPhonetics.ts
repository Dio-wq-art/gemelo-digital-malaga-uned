/**
 * Módulo de Preprocesamiento Fonético Doctoral Estricto (Prosodia Académica de Élite)
 * Tesis Doctoral - Gemelo Digital de Calidad del Aire de Málaga (Physics-Informed Digital Twin)
 * 
 * Transforma determinísticamente la notación simbólica físico-química, matemática,
 * geodésica y regulatoria en una prosodia natural, fluida y continuada en Español de España peninsular (es-ES).
 */

export function toScientificDoctoralSpeech(rawText: string): string {
  if (!rawText) return '';

  let speech = rawText;

  // 1. Notación científica exponencial
  speech = speech.replace(/(\d+(?:\.\d+)?)\s*[xX*×]\s*10\^?\{?-?(\d+)\}?/g, (_m, base, exp) => {
    return `${base.replace('.', ' punto ')} por diez a la menos ${exp}`;
  });
  speech = speech.replace(/(\d+(?:\.\d+)?)[eE]-(\d+)/g, (_m, base, exp) => {
    return `${base.replace('.', ' punto ')} por diez a la menos ${exp}`;
  });

  // 2. Coordenadas y acrónimos geodésicos (prosodia natural sin deletreo robótico)
  speech = speech.replace(/\bETRS89\b/g, 'sistema ETRS ochenta y nueve');
  speech = speech.replace(/\bUTM\s*30N\b/gi, 'UTM huso treinta norte');
  speech = speech.replace(/\bUTM\s*Huso\s*30N\b/gi, 'UTM huso treinta norte');
  speech = speech.replace(/\bGRS80\b/g, 'elipsoide GRS ochenta');
  speech = speech.replace(/\bWGS84\b/g, 'datum WGS ochenta y cuatro');
  speech = speech.replace(/\bIGN\b/g, 'Instituto Geográfico Nacional');
  speech = speech.replace(/\bOSM\b/g, 'OpenStreetMap');
  speech = speech.replace(/\bAGL\b/g, 'sobre el nivel del suelo');
  speech = speech.replace(/1\.8\s*(?:m|metros)\s*(?:AGL)?/gi, 'un metro ochenta de altura respiratoria');

  // 3. Especies químicas y radicales fotoquímicos
  speech = speech.replace(/\bNO2\b|\bNO_2\b|\bNO₂\b/g, 'dióxido de nitrógeno');
  speech = speech.replace(/\bNOx\b|\bNO_x\b|\bNOₓ\b/g, 'óxidos de nitrógeno');
  speech = speech.replace(/\bO3\b|\bO_3\b|\bO₃\b/g, 'ozono troposférico');
  speech = speech.replace(/\bPM2\.5\b|\bPM_2\.5\b|\bPM₂\.₅\b|\bPM\s*2\.5\b|\bPM\s*2,5\b/g, 'partículas finas PM dos punto cinco');
  speech = speech.replace(/\bPM10\b|\bPM_10\b|\bPM₁₀\b|\bPM\s*10\b/g, 'partículas respirables PM diez');
  speech = speech.replace(/\bSO2\b|\bSO_2\b|\bSO₂\b/g, 'dióxido de azufre');
  speech = speech.replace(/\bCO2\b|\bCO_2\b|\bCO₂\b/g, 'dióxido de carbono');
  speech = speech.replace(/\bClNO2\b|\bClNO_2\b|\bClNO₂\b/g, 'cloruro de nitrilo');
  speech = speech.replace(/\bN2O5\b|\bN₂O₅\b/g, 'pentóxido de dinitrógeno');
  speech = speech.replace(/\bRO2\b|\bRO_2\b|\bRO₂\b/g, 'radicales peroxilo orgánicos');
  speech = speech.replace(/\bNaCl\b/g, 'cloruro sódico marino');

  speech = speech.replace(/(?:del|el|de|concentración\s+de|emisión\s+de|titulación\s+por|tríada\s+de)\s+NO\b/g, (m) => {
    return m.replace(/\bNO\b/, 'monóxido de nitrógeno');
  });
  speech = speech.replace(/NO-NO2-O3|NO\s*-\s*NO2\s*-\s*O3/g, 'monóxido, dióxido de nitrógeno y ozono');

  // Compuestos orgánicos
  speech = speech.replace(/\bBVOCs\b|\bBVOC\b/gi, 'compuestos orgánicos volátiles biogénicos');
  speech = speech.replace(/\bVOCs\b|\bVOC\b|\bCOVs\b|\bCOV\b/g, 'compuestos orgánicos volátiles');
  speech = speech.replace(/\bSOA\b/g, 'aerosoles orgánicos secundarios');

  // 4. Unidades de medida científicas
  speech = speech.replace(/µg\/\(m³·s\)|µg\/\(m\^3·s\)|ug\/\(m3·s\)/gi, 'microgramos por metro cúbico y segundo');
  speech = speech.replace(/µg\/m³|µg\/m3|µg\/m\^3|ug\/m3|ug\/m\^3/gi, 'microgramos por metro cúbico');
  speech = speech.replace(/µg\/\(m²·h\)|µg\/\(m\^2·h\)|ug\/\(m2·h\)/gi, 'microgramos por metro cuadrado y hora');
  speech = speech.replace(/µg\/hora|µg\/h|ug\/h/gi, 'microgramos por hora');
  speech = speech.replace(/mg\/\(m²·s\)|mg\/m2s/gi, 'miligramos por metro cuadrado y segundo');
  speech = speech.replace(/mmol\/\(m²·s\)|mmol\/m2s/gi, 'milimoles por metro cuadrado y segundo');
  speech = speech.replace(/\bg\s*NO2\/h\b|\bg\s*NO₂\/h\b/g, 'gramos de dióxido de nitrógeno por hora');
  speech = speech.replace(/\bg\/h\b/g, 'gramos por hora');
  speech = speech.replace(/\bkg\/año\b|\bkg\/year\b/gi, 'kilogramos al año');
  speech = speech.replace(/m³\/h|m3\/h/gi, 'metros cúbicos por hora');
  speech = speech.replace(/km\/h/gi, 'kilómetros por hora');
  speech = speech.replace(/m\/s/gi, 'metros por segundo');
  speech = speech.replace(/cm\/s/gi, 'centímetros por segundo');
  speech = speech.replace(/hPa\b/gi, 'hectopascales');
  speech = speech.replace(/kW\b/g, 'kilovatios');
  speech = speech.replace(/°C\b|ºC\b/g, 'grados centígrados');
  speech = speech.replace(/pptv\b/gi, 'partes por billón en volumen');
  speech = speech.replace(/dBA\b|dB\(A\)\b/gi, 'decibelios A ponderados');
  speech = speech.replace(/h\^\{-1\}|h\^-1|renovaciones\/h\b/gi, 'renovaciones de aire por hora');
  speech = speech.replace(/s\^\{-1\}|s\^-1/gi, 'segundos a la menos uno');

  // 5. Parámetros mecanicistas
  speech = speech.replace(/\bH\/W\b|\bH\s*\/\s*W\b/g, 'relación de aspecto altura sobre anchura');
  speech = speech.replace(/\bSVF\b/g, 'factor de visión de cielo');
  speech = speech.replace(/\bACH\b/g, 'tasa de renovación de aire');
  speech = speech.replace(/\btau_res\b|\\tau_\{\\text\{res\}\}|\\tau_\{res\}|\\tau_{\text{res}}|tau_res/g, 'tiempo de residencia tau');
  speech = speech.replace(/\btau_adv\b|\\tau_\{\\text\{adv\}\}|\\tau_\{adv\}|tau_adv/g, 'tiempo advectivo tau');
  speech = speech.replace(/\btau_chem\b|\\tau_\{\\text\{chem\}\}|\\tau_\{chem\}|tau_chem/g, 'tiempo de reacción fotoquímica tau');
  speech = speech.replace(/\btau_SOA\b|\\tau_\{\\text\{SOA\}\}|\\tau_\{SOA\}|tau_SOA/g, 'tiempo de formación de aerosoles tau');
  speech = speech.replace(/\bL_MO\b|\\text\{L\}_\{MO\}|L_\{MO\}/g, 'longitud de Monin Obukhov');
  speech = speech.replace(/\bu_\*\b|\bu\*\b/g, 'velocidad de fricción u asterisco');
  speech = speech.replace(/\bk_3\(T\)\b|\bk3\(T\)\b|\bk_3\b|\bk3\b/g, 'constante cinética de Arrhenius k tres');
  speech = speech.replace(/\bJ_NO2\b|\bJ_\{NO2\}\b|\bJNO2\b/g, 'frecuencia de fotólisis jota');
  speech = speech.replace(/\bPhi\b|\\Phi\b/g, 'número de Leighton fi');

  // 6. Normativa y modelos
  speech = speech.replace(/\bk\s*=\s*2\b/g, 'factor de cobertura dos con noventa y cinco por ciento de confianza');
  speech = speech.replace(/\bICRP-66\b|\bICRP\s*66\b/g, 'modelo dosimétrico ICRP sesenta y seis');
  speech = speech.replace(/\bCOPERT\s*5\b|\bCOPERT\b/g, 'metodología europea COPERT cinco');
  speech = speech.replace(/\bFAIRMODE\s*WG1\b/g, 'protocolo europeo FAIRMODE grupo de trabajo uno');
  speech = speech.replace(/\bFAIRMODE\b/g, 'protocolo europeo FAIRMODE');
  speech = speech.replace(/\bCAMS\b/g, 'Copernicus CAMS');
  speech = speech.replace(/\bAEMET\b/g, 'Agencia Estatal de Meteorología');
  speech = speech.replace(/\bPINN\b/g, 'red neuronal PINN');
  speech = speech.replace(/\bPDE\b/g, 'ecuaciones en derivadas parciales');
  speech = speech.replace(/\bODE\b/g, 'ecuaciones diferenciales ordinarias');
  speech = speech.replace(/\bLAI\b/g, 'índice de área foliar');
  speech = speech.replace(/\bOPALS\b/g, 'índice alergénico OPALS');
  speech = speech.replace(/\bPSS\b/g, 'estado fotoestacionario');
  speech = speech.replace(/\bMOST\b/g, 'teoría de Monin Obukhov');
  speech = speech.replace(/\bGUM\b/g, 'guía de incertidumbre GUM');
  speech = speech.replace(/\bJCGM\s*100:2008\b|\bJCGM\b/g, 'Comité Conjunto de Guías en Metrología');
  speech = speech.replace(/\bOMS\b/g, 'Organización Mundial de la Salud');
  speech = speech.replace(/\bWHO\b/g, 'Organización Mundial de la Salud');

  // 7. Números decimales hablados de forma natural
  speech = speech.replace(/(\d+)\.(\d+)/g, '$1 punto $2');

  // 8. Normalización de espacios y eliminación de puntuación repetida
  speech = speech.replace(/\s+/g, ' ');
  speech = speech.replace(/,\s*,+/g, ',');
  speech = speech.replace(/\.\s*\.+/g, '.');
  speech = speech.replace(/,\s*\./g, '.');

  return speech.trim();
}
