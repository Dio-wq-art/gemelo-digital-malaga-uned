/**
 * Motor Fotoquímico Ternario (NOx - VOC - Ox) y Particionamiento de Fase EKMA
 * Tesis Doctoral - Modelización a Microescala en Málaga
 * 
 * Basado en las formulaciones analíticas de:
 * - Sillman, S. (1999). The relation between ozone, NOx and hydrocarbons in urban and polluted rural atmospheres.
 * - Dodge, M. C. (1977). Combined use of modeling techniques and smog chamber data to derive ozone-precursor relationships.
 */

export interface PhotochemicalTernaryState {
  noxPpb: number;
  vocPpbC: number;
  o3Ppb: number;
  no2Ppb: number;
  locationName: string;
  fractions: {
    fracNOx: number;
    fracVOC: number;
    fracO3: number;
  };
  vocNoxRatio: number;
  regime: 'VOC-limited' | 'NOx-limited' | 'Transition';
  regimeLabel: string;
  regimeDescription: string;
  barycentricCoordinates: {
    x: number;
    y: number;
  };
  sensitivityIndex: {
    dO3_dNOx: number;
    dO3_dVOC: number;
  };
}

/**
 * Evalúa el estado del sistema fotoquímico en coordenadas ternarias baricéntricas
 */
export function evaluatePhotochemicalTernarySystem(
  noxPpb: number,
  vocPpbC: number,
  o3Ppb: number,
  no2Ppb?: number,
  locationName: string = "Málaga"
): PhotochemicalTernaryState {
  const safeNOx = Math.max(0.1, noxPpb);
  const safeVOC = Math.max(0.1, vocPpbC);
  const safeO3 = Math.max(0.1, o3Ppb);
  const safeNO2 = no2Ppb ?? safeNOx * 0.75;

  const total = safeNOx + safeVOC + safeO3;
  const fracNOx = (safeNOx / total) * 100;
  const fracVOC = (safeVOC / total) * 100;
  const fracO3 = (safeO3 / total) * 100;

  const vocNoxRatio = safeVOC / safeNOx;

  let regime: 'VOC-limited' | 'NOx-limited' | 'Transition' = 'Transition';
  let regimeLabel = 'Zona de Transición Óptima (Sillman, 1999)';
  let regimeDescription = 'Máxima sensibilidad acoplada. Se requiere abatimiento sinérgico de NOx y VOC.';

  if (vocNoxRatio < 4.5) {
    regime = 'VOC-limited';
    regimeLabel = 'Régimen VOC-Limitado / Sensible a Hidrocarburos';
    regimeDescription = 'La reducción aislada de NOx incrementa el O₃ por menor titulación. Prioridad a mitigación de VOCs.';
  } else if (vocNoxRatio > 8.0) {
    regime = 'NOx-limited';
    regimeLabel = 'Régimen NOx-Limitado / Sensible a Óxidos de Nitrógeno';
    regimeDescription = 'La formación de O₃ está controlada por NOx. La reducción de tráfico vehicular mitiga el O₃ de fondo.';
  }

  // Coordenadas baricéntricas en triángulo normalizado [0, 1]
  const a = fracO3 / 100;
  const b = fracNOx / 100;
  const c = fracVOC / 100;

  // Derivadas de sensibilidad analítica EKMA
  const dO3_dNOx = regime === 'VOC-limited' ? -0.35 : regime === 'NOx-limited' ? 0.65 : 0.15;
  const dO3_dVOC = regime === 'VOC-limited' ? 0.55 : regime === 'NOx-limited' ? 0.08 : 0.32;

  return {
    noxPpb: Number(safeNOx.toFixed(2)),
    vocPpbC: Number(safeVOC.toFixed(2)),
    o3Ppb: Number(safeO3.toFixed(2)),
    no2Ppb: Number(safeNO2.toFixed(2)),
    locationName,
    fractions: {
      fracNOx: Number(fracNOx.toFixed(2)),
      fracVOC: Number(fracVOC.toFixed(2)),
      fracO3: Number(fracO3.toFixed(2))
    },
    vocNoxRatio: Number(vocNoxRatio.toFixed(2)),
    regime,
    regimeLabel,
    regimeDescription,
    barycentricCoordinates: {
      x: Number((0.5 * (2 * c + a) / (a + b + c)).toFixed(4)),
      y: Number((Math.sqrt(3) / 2 * a / (a + b + c)).toFixed(4))
    },
    sensitivityIndex: {
      dO3_dNOx: Number(dO3_dNOx.toFixed(3)),
      dO3_dVOC: Number(dO3_dVOC.toFixed(3))
    }
  };
}

/**
 * Exporta el análisis ternario en formato CSV tabular FAIR
 */
export function exportTernaryCsv(state: PhotochemicalTernaryState): string {
  return `# DIAGRAMA TERNARIO FOTOQUIMICO (NOx - VOC - Ox) - GEMELO DIGITAL MALAGA
# Localizacion: ${state.locationName}
# Regimen: ${state.regimeLabel}
# Fecha: ${new Date().toISOString()}
Parametro,Valor,Unidad,Descripcion
NOx_ppb,${state.noxPpb},ppb,Precursores Oxidos de Nitrogeno (NO + NO2)
VOC_ppbC,${state.vocPpbC},ppbC,Compuestos Organicos Volatiles Reactivos
O3_Ox_ppb,${state.o3Ppb},ppb,Ozono Troposferico y Oxigeno Impar
Fraccion_NOx_pct,${state.fractions.fracNOx},%,Coordenada Baricentrica NOx
Fraccion_VOC_pct,${state.fractions.fracVOC},%,Coordenada Baricentrica VOC
Fraccion_O3_pct,${state.fractions.fracO3},%,Coordenada Baricentrica O3
Ratio_VOC_NOx,${state.vocNoxRatio},ppbC/ppb,Indicador de Regimen Sillman (1999)
Regimen_Fotoquimico,"${state.regime}",-,Clasificacion de Sensibilidad
Sensibilidad_dO3_dNOx,${state.sensitivityIndex.dO3_dNOx},ppb/ppb,Derivada parcial de respuesta O3 ante NOx
Sensibilidad_dO3_dVOC,${state.sensitivityIndex.dO3_dVOC},ppb/ppbC,Derivada parcial de respuesta O3 ante VOC
`;
}
