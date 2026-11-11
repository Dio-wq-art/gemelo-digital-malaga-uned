# PROTOCOLO QUIRÚRGICO DE DESARROLLO DEL GEMELO DIGITAL (ECOSIM LAB)
**Estándar Doctoral de Manipulación Rápida, Segura y Cero-Regresiones**

Este protocolo rige de forma obligatoria e inmutable cada vez que se incorpore, modifique o retire cualquier funcionalidad, cálculo, suite o componente en el Gemelo Digital. Su objetivo es garantizar que **el código nunca sufra daños colaterales** y que **ningún proceso de desarrollo se vuelva lento ni eterno**.

---

## 1. PRINCIPIO DE AISLAMIENTO MODULAR (PLUG & PLAY)
* **Autocontención Estricta:** Cada nueva funcionalidad, visualización, cálculo o suite analítica debe residir en su propio archivo independiente (`src/components/`, `src/lib/` o `server/routes/`).
* **Interfaces Estándar:** La integración con el resto del sistema se realiza exclusivamente a través de los canales globales ya consolidados:
  - `ActivePointContext` (para coordenadas, dirección oficial, telemetría y meteorología en tiempo real).
  - `DraggableWindow` (para paneles flotantes, modales y suites arrastrables).
  - `ScientificTooltip` (para justificación metodológica y citas normativas).
* **Cero Daño al Retirar:** Para desactivar o retirar una funcionalidad, basta con desconectar su punto de montaje o importación en la vista padre, dejando la lógica circundante 100% intacta.

---

## 2. EDICIÓN QUIRÚRGICA POR MICRO-BLOQUES (CERO SOBREESCRITURAS MASIVAS)
* **Prohibición de Sobreescritura Ciega:** Queda prohibido sobreescribir archivos enteros o bloques de cientos de líneas para cambios puntuales.
* **Micro-Ediciones Contiguas:** Las modificaciones se efectúan en fragmentos delimitados de 10 a 30 líneas mediante herramientas de reemplazo exacto (`replace_file_content`), asegurando la preservación del 100% del código circundante y evitando pérdida de estado o funcionalidades consolidadas.

---

## 3. PILA CIENTÍFICA CONSOLIDADA (CERO INSTALACIONES SUPERFLUAS)
* **Aprovechamiento Integral:** El proyecto cuenta con una pila matemática, geoespacial y de renderizado de élite ya instalada y optimizada:
  - Física & Álgebra: `mathjs`, `ml-matrix`, `onnxruntime-web`, `comlink`.
  - Geodesia & GIS: `@turf/turf`, `proj4`, `h3-js`, `geotiff`, `netcdfjs`.
  - Cartografía & Gráficos: `maplibre-gl`, `deck.gl`, `d3`, `katex`.
  - Auditoría & Exportación: `jspdf`, `jspdf-autotable`, `exceljs`, `jszip`.
* **Prohibición:** No se instalan paquetes externos por comodidad si la operación matemática o analítica puede resolverse de forma determinista con la pila existente. Esto evita sobrecargar el entorno y previene conflictos de dependencias.

---

## 4. VALIDACIÓN FOCALIZADA EN TIEMPO REAL (< 1 SEGUNDO)
* **Verificación Focal:** En cada iteración se ejecuta únicamente el archivo de pruebas correspondiente al módulo intervenido (`npx vitest run src/tests/<modulo_especifico>.test.ts`), con un tiempo de respuesta inferior a 1 segundo.
* **Prohibición de Builds Globales en Iteraciones:** No se lanzan construcciones globales masivas de producción (`npm run build`) durante el ciclo de microcambios, ya que el empaquetado de librerías WebGL/3D bloquea el flujo de trabajo innecesariamente.
* **Auditoría Global Periódica:** La batería completa (74 tests unitarios y `tsc --noEmit`) se reserva únicamente para el cierre de hitos importantes o por petición expresa del investigador.

---

## 5. FLUJO DE COMUNICACIÓN EN 2 LÍNEAS
Antes de ejecutar cualquier cambio sobre el código, el ingeniero jefe indicará:
1. **Archivo exacto a intervenir.**
2. **Impacto delimitado (qué entra o qué sale).**
3. **Ejecución y verificación instantánea.**
