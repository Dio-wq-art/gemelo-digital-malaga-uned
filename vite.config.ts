import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    envPrefix: ['VITE_', 'REACT_APP_'],
    define: {
      'process.env.REACT_APP_MAPS_API_KEY': JSON.stringify(process.env.REACT_APP_MAPS_API_KEY || ''),
    },
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      entries: ['index.html', 'src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-is',
        'zustand',
        'lucide-react',
        'maplibre-gl',
        'react-map-gl/maplibre',
        'motion/react',
        '@deck.gl/aggregation-layers',
        '@deck.gl/geo-layers',
        '@deck.gl/layers',
        '@deck.gl/mapbox',
        '@mapbox/shp-write',
        '@tanstack/react-query',
        '@turf/turf',
        'apache-arrow',
        'd3',
        'd3-contour',
        'date-fns',
        'date-fns/locale',
        'delaunator',
        'earcut',
        'exceljs',
        'flatbush',
        'geotiff',
        'glpk.js',
        'h3-js',
        'html2canvas',
        'jspdf',
        'jspdf-autotable',
        'jszip',
        'katex',
        'mathjs',
        'ml-matrix',
        'netcdfjs',
        'osmtogeojson',
        'papaparse',
        'pdfjs-dist',
        'proj4',
        'recharts',
        'simple-statistics',
        'suncalc'
      ],
      exclude: ['onnxruntime-web']
    },
    resolve: {
      dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-is', 'zustand'],
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      minify: 'esbuild',
      sourcemap: false,
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Núcleo React para cacheo a largo plazo
              if (id.includes('react/') || id.includes('react-dom') || id.includes('react-is') || id.includes('zustand')) {
                return 'vendor-react';
              }
              // Motor cartográfico base
              if (id.includes('maplibre-gl') || id.includes('react-map-gl')) {
                return 'vendor-maplibre';
              }
              // Capa de visualización espacial Deck.gl y loaders
              if (id.includes('deck.gl') || id.includes('@deck.gl') || id.includes('@loaders.gl')) {
                return 'vendor-deckgl';
              }
              // Motor 3D WebGL
              if (id.includes('three')) {
                return 'vendor-three';
              }
              // Gráficas y series temporales
              if (id.includes('recharts')) {
                return 'vendor-recharts';
              }
              // Exportación de informes y documentación FAIR (PDF, Excel, Zip, Canvas)
              if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('exceljs') || id.includes('pdfjs-dist') || id.includes('jszip')) {
                return 'vendor-export';
              }
              // Iconografía
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              // Parsers de formatos geocientíficos pesados (TIFF, NetCDF, GeoJSON, triangulación)
              if (id.includes('geotiff') || id.includes('netcdfjs') || id.includes('earcut') || id.includes('delaunator') || id.includes('osmtogeojson')) {
                return 'vendor-geoparsers';
              }
              // Análisis y telemetría espacial (Arrow, PapaParse, D3, Turf, Proj4, H3, Flatbush)
              if (id.includes('apache-arrow') || id.includes('papaparse') || id.includes('d3') || id.includes('d3-contour') || id.includes('turf') || id.includes('@turf') || id.includes('proj4') || id.includes('flatbush') || id.includes('h3-js')) {
                return 'vendor-geodata';
              }
              // Solvers matemáticos, redes neuronales y optimización determinista (ONNX, GLPK, KaTeX)
              if (id.includes('onnxruntime-web') || id.includes('glpk.js') || id.includes('mathjs') || id.includes('ml-matrix') || id.includes('simple-statistics') || id.includes('katex')) {
                return 'vendor-solvers';
              }
              // Animación fluida de interfaz
              if (id.includes('motion')) {
                return 'vendor-motion';
              }
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
