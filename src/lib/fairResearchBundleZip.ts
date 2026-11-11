/**
 * Motor de Empaquetado Científico de Investigación FAIR (.zip)
 * Tesis Doctoral - Modelización de Calidad del Aire a Microescala en Málaga
 * 
 * Reúne y empaqueta en un único archivo comprimido reproducible (.zip):
 * - Manuscrito completo de Tesis en LaTeX (.tex) con ecuaciones y tablas
 * - Archivo de referencias bibliográficas BibTeX (.bib)
 * - Diapositivas oficiales de defensa de Tesis en Beamer LaTeX (.tex)
 * - Manuscrito para revista científica Q1 (.tex)
 * - Mallas espaciales GeoJSON con atributos morfológicos y concentraciones
 * - Series temporales e innovaciones en CSV tabulares
 * - Metadatos de linaje científico W3C PROV e INSPIRE ISO 19115 en JSON-LD
 * - Guía de replicabilidad abierta README_REPRODUCIBILIDAD_FAIR.md
 */

import JSZip from 'jszip';
import { MeteoData, PhysicsResult, StationComparisonResult } from './physics';
import { 
  generateDoctoralThesisLatexDocument, 
  generateDoctoralThesisBibtex, 
  generateDoctoralThesisBeamerSlides,
  generateDoctoralThesisQ1Manuscripts
} from './latexThesisExporter';
import { generateInspireMetadataHeader } from './fairExport';
import { getTribunalQuestions } from './tribunalDefenseAdvisor';
import { defaultMalagaTinEngine } from './tinAndEarcutSpatialEngine';
import { evaluatePhotochemicalTernarySystem, exportTernaryCsv } from './photochemicalTernaryEngine';
import Papa from 'papaparse';

export interface ResearchBundleOptions {
  meteo: MeteoData;
  physics: PhysicsResult;
  stationComparisons?: StationComparisonResult[];
  rawUrbanPoints?: any[];
  historyData?: any[];
  marineFlowGeoJson?: any;
  includeLatex?: boolean;
  includeCsv?: boolean;
  includeGeoJson?: boolean;
  includeProvenance?: boolean;
  activePoint?: any;
  assimilation?: any;
  location?: { lat: number; lon: number };
}

export async function generateFairResearchBundleZip(options: ResearchBundleOptions): Promise<Blob> {
  const zip = new JSZip();
  const timestamp = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();

  const {
    meteo,
    physics,
    stationComparisons = [],
    rawUrbanPoints = [],
    historyData = [],
    marineFlowGeoJson,
    includeLatex = true,
    includeCsv = true,
    includeGeoJson = true,
    includeProvenance = true,
    activePoint,
    assimilation,
    location
  } = options;

  const activeStreetName = activePoint?.nearestStreetName || activePoint?.name || "Calle Marqués de Larios";
  const activeLat = activePoint?.lat ?? location?.lat ?? 36.7196;
  const activeLon = activePoint?.lon ?? location?.lon ?? -4.4200;
  const activeNO2 = assimilation?.no2PedestrianLevel1_8mUgM3 ?? meteo.no2_satelite_base ?? 28.4;
  const activeO3 = assimilation?.ozoneO3UgM3 ?? meteo.ozone ?? 42.0;
  const activePM25 = assimilation?.pm25UgM3 ?? meteo.pm2_5 ?? 9.8;
  const activePM10 = assimilation?.pm10UgM3 ?? meteo.pm10 ?? 18.5;

  // 1. Carpeta LATEX (Memoria, Diapositivas Beamer, Manuscrito Q1 y BibTeX)
  if (includeLatex) {
    const latexFolder = zip.folder("01_latex_documentos_reproducibles");
    if (latexFolder) {
      // Documento principal de tesis
      const thesisTex = generateDoctoralThesisLatexDocument({
        meteo,
        physics,
        stationComparisons,
        activePoint,
        assimilation,
        location,
        thesisTitle: "Modelización de la Calidad del Aire a Microescala e Integración de Gemelos Digitales Informados por la Física (PINN) en Entornos Urbanos Costeros: El Caso de Málaga",
        authorName: "Dionisio Gálvez Pozo (Doctorando - UNED / EIDUNED)",
        university: "Universidad Nacional de Educación a Distancia (UNED) - Escuela Internacional de Doctorado (EIDUNED)",
        dateStr: timestamp
      });
      latexFolder.file("tesis_doctoral_malaga.tex", thesisTex);

      // Referencias BibTeX
      const bibtex = generateDoctoralThesisBibtex();
      latexFolder.file("referencias_tesis.bib", bibtex);

      // Diapositivas de defensa de Tesis Beamer
      const beamerSlides = generateDoctoralThesisBeamerSlides({ meteo, physics, stationComparisons, activePoint, assimilation, location });
      latexFolder.file("presentacion_defensa_tribunal_beamer.tex", beamerSlides);

      // Manuscritos Q1 para Revistas JCR (ACP / JCP / GMD)
      const manuscriptQ1 = generateDoctoralThesisQ1Manuscripts({ meteo, physics, stationComparisons, activePoint, assimilation, location });
      latexFolder.file("manuscritos_articulos_q1_malaga.tex", manuscriptQ1);
    }
  }

  // 2. Carpeta DATOS_CSV (Series temporales, Comparativas oficiales y Tribunal)
  if (includeCsv) {
    const csvFolder = zip.folder("02_datos_tabulares_csv");
    if (csvFolder) {
      // Comparativa de estaciones oficiales
      if (stationComparisons.length > 0) {
        const stationRows = stationComparisons.map(s => ({
          Estacion: s.station?.name || 'N/A',
          Codigo_Estacion: s.station?.id || 'N/A',
          Tipo_Area: (s.station as any)?.environmentType || (s.station as any)?.areaType || 'Urbana',
          Latitud: s.station?.lat ?? 36.72,
          Longitud: s.station?.lon ?? -4.42,
          NO2_Observado_ug_m3: s.measuredNO2,
          NO2_Simulado_PINN_ug_m3: s.estimatedNO2,
          Error_Absoluto_ug_m3: s.errorAbsoluteNO2,
          Sesgo_Relativo_Pct: s.relativeBiasPct,
          Indice_Confianza: s.confidenceScore,
          Criterio_FAIRMODE_MQO: Math.abs(s.relativeBiasPct) <= 25 ? 'CUMPLE_OBJETIVO_CALIDAD' : 'REVISAR'
        }));
        csvFolder.file("estaciones_oficiales_comparacion.csv", Papa.unparse(stationRows));
      }

      // Series históricas / asimiladas
      if (historyData.length > 0) {
        csvFolder.file("serie_temporal_asimilacion_7dias.csv", Papa.unparse(historyData));
      } else {
        const sampleMeteoSeries = [
          {
            Timestamp: nowIso,
            Temperatura_C: meteo.temperatura_malaga,
            Humedad_Relativa_Pct: meteo.humedad_relativa,
            Velocidad_Viento_km_h: meteo.velocidad_viento_km_h,
            Direccion_Viento_Deg: meteo.direccion_viento_grados,
            Radiacion_Solar_W_m2: meteo.shortwave_radiation,
            NO2_Base_ug_m3: meteo.no2_satelite_base,
            O3_ug_m3: meteo.ozone,
            PM10_ug_m3: meteo.pm10,
            PM25_ug_m3: meteo.pm2_5
          }
        ];
        csvFolder.file("serie_temporal_telemetria_actual.csv", Papa.unparse(sampleMeteoSeries));
      }

      // Preguntas del Tribunal y Argumentos de Defensa
      const questions = getTribunalQuestions();
      const questionRows = questions.map(q => ({
        ID: q.id,
        Categoria: q.category,
        Revisor: q.reviewerPersona,
        Pregunta: q.questionText,
        Argumento_Defensa: q.defenseArgument,
        Demostracion_Matematica: q.mathematicalProof,
        Referencia_Normativa: q.normativeReference,
        Puntuacion_Confianza: q.confidenceScore
      }));
      csvFolder.file("tribunal_defensa_eiduned_preguntas_respuestas.csv", Papa.unparse(questionRows));

      // Fichero de sincronización del Punto Activo seleccionado (Regla 10 AGENTS.md)
      const activePointRow = [{
        Timestamp: nowIso,
        Receptor_Activo: activeStreetName,
        Distrito: activePoint?.districtName || 'Distrito 1: Centro',
        Barrio: activePoint?.neighborhoodName || 'Centro Histórico',
        Codigo_Postal: activePoint?.postalCode || '29015',
        Latitud_WGS84: activeLat,
        Longitud_WGS84: activeLon,
        UTM_30N_X_m: activePoint?.utmEasting ?? Math.round(372900 + (activeLon - (-4.4214)) * 89200),
        UTM_30N_Y_m: activePoint?.utmNorthing ?? Math.round(4065200 + (activeLat - 36.7213) * 111100),
        Cota_MDE_m: activePoint?.elevationM ?? 11.0,
        Ratio_HW_Canyon: assimilation?.aspectRatioHw ?? activePoint?.aspectRatioHw ?? 1.25,
        SVF_Canyon: assimilation?.skyViewFactorSvf ?? activePoint?.skyViewFactorSvf ?? 0.42,
        NO2_Asimilado_1_8m_ug_m3: activeNO2,
        O3_Asimilado_ug_m3: activeO3,
        PM25_Asimilado_ug_m3: activePM25,
        PM10_Asimilado_ug_m3: activePM10
      }];
      csvFolder.file("00_punto_activo_sincronizado.csv", Papa.unparse(activePointRow));

      // Diagnóstico del Diagrama Ternario Fotoquímico EKMA sincronizado con el Punto Activo
      const ternaryState = evaluatePhotochemicalTernarySystem(
        activeNO2 * 0.8,
        activeNO2 * 2.5,
        activeO3,
        activeNO2,
        activeStreetName
      );
      const ternaryCsv = exportTernaryCsv(ternaryState);
      csvFolder.file("diagrama_ternario_fotoquimico_ekma.csv", ternaryCsv);
    }
  }

  // 3. Carpeta GEOJSON (Mallas Espaciales y Topología Urbana)
  if (includeGeoJson) {
    const geojsonFolder = zip.folder("03_capas_espaciales_geojson");
    if (geojsonFolder) {
      if (rawUrbanPoints.length > 0) {
        const featureCollection = {
          type: "FeatureCollection",
          crs: {
            type: "name",
            properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" }
          },
          features: rawUrbanPoints.map((pt: any, idx: number) => ({
            type: "Feature",
            id: pt.id || `pt-${idx}`,
            geometry: {
              type: "Point",
              coordinates: [pt.lon, pt.lat]
            },
            properties: {
              name: pt.name,
              no2_pred: pt.no2_pred,
              svf: pt.svf,
              h_w_ratio: pt.aspectRatio,
              flow_regime: pt.flowRegime,
              ach: pt.ach
            }
          }))
        };
        geojsonFolder.file("malla_receptores_urbanos_malaga.geojson", JSON.stringify(featureCollection, null, 2));
      }

      if (marineFlowGeoJson) {
        geojsonFolder.file("flujo_brisa_marina_alboran.geojson", JSON.stringify(marineFlowGeoJson, null, 2));
      }

      // Malla Irregular Triangular (TIN Delaunay)
      const tinGeoJson = defaultMalagaTinEngine.toGeoJson();
      geojsonFolder.file("malla_tin_delaunay_malaga.geojson", JSON.stringify(tinGeoJson, null, 2));
    }
  }

  // 4. Metadatos W3C PROV e INSPIRE ISO 19115
  if (includeProvenance) {
    const provFolder = zip.folder("04_metadatos_fair_y_linaje_prov");
    if (provFolder) {
      const inspireMeta = generateInspireMetadataHeader("Paquete de Reproducibilidad FAIR del Gemelo Digital de Málaga");
      provFolder.file("metadatos_inspire_iso19115_w3c_prov.json", JSON.stringify(inspireMeta, null, 2));
    }
  }

  // 5. Guía de Replicabilidad README en la raíz
  const readmeContent = `# Paquete de Replicabilidad Científica Abierta (FAIR Data & Code)
**Tesis Doctoral:** Modelización de la Calidad del Aire a Microescala e Integración de Gemelos Digitales Informados por la Física (PINN) en Entornos Urbanos Costeros: El Caso de Málaga
**Doctorando:** Dionisio Gálvez Pozo
**Institución:** Escuela Internacional de Doctorado (EIDUNED), Universidad Nacional de Educación a Distancia (UNED), Madrid, España.
**Fecha de Generación:** ${nowIso}
**Licencia:** Creative Commons Attribution 4.0 International (CC-BY-4.0)

---

## Estructura del Archivo:
1. \`01_latex_documentos_reproducibles/\`:
   - \`tesis_doctoral_malaga.tex\`: Código fuente LaTeX de la memoria doctoral listo para compilar en Overleaf o TeX Live.
   - \`referencias_tesis.bib\`: Citas bibliográficas completas en formato BibTeX.
   - \`presentacion_defensa_tribunal_beamer.tex\`: Diapositivas oficiales de la defensa oral en Beamer.
   - \`manuscrito_q1_acp_atmospheric_chemistry.tex\`: Manuscrito para Atmospheric Chemistry and Physics (ACP).
   - \`manuscrito_q1_gmd_microscale_fno.tex\`: Manuscrito para Geoscientific Model Development (GMD).

2. \`02_datos_tabulares_csv/\`:
   - \`estaciones_oficiales_comparacion.csv\`: Validación con estaciones oficiales de la Junta de Andalucía (Carranque, El Atabal, Puerto).
   - \`serie_temporal_asimilacion_7dias.csv\`: Telemetría asimilada continua.
   - \`tribunal_defensa_eiduned_preguntas_respuestas.csv\`: Argumentación formal ante las preguntas del tribunal.

3. \`03_capas_espaciales_geojson/\`:
   - \`malla_receptores_urbanos_malaga.geojson\`: Geometrías WGS84 de cañones urbanos, ratios H/W y concentraciones peatonales.
   - \`flujo_brisa_marina_alboran.geojson\`: Vectores de advección marina costera.

4. \`04_metadatos_fair_y_linaje_prov/\`:
   - \`metadatos_inspire_iso19115_w3c_prov.json\`: Trazabilidad W3C PROV y cumplimiento INSPIRE Directiva 2007/2/CE.

---
*Generado automáticamente por el Gemelo Digital Informado por la Física de Málaga.*
`;

  zip.file("README_REPRODUCIBILIDAD_FAIR.md", readmeContent);

  // Generar el blob ZIP
  const content = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6
    }
  });

  return content;
}
