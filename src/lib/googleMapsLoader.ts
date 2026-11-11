/**
 * Singleton Google Maps JavaScript API Loader
 * Tesis Doctoral - Gemelo Digital de Málaga
 * 
 * Garantiza que la API de Google Maps JavaScript se cargue EXACTAMENTE UNA VEZ
 * en todo el ciclo de vida de la aplicación, evitando el error:
 * "You have included the Google Maps JavaScript API multiple times on this page."
 */

let loadPromise: Promise<boolean> | null = null;
let isLoaded = false;

export async function loadGoogleMapsScript(): Promise<boolean> {
  // Si ya está disponible en el objeto global window
  if (typeof window !== 'undefined' && (window as any).google?.maps) {
    isLoaded = true;
    return true;
  }

  // Si ya hay una promesa de carga en curso, reutilizarla (Singleflight)
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      // Comprobar si ya existe una etiqueta script de Google Maps en el DOM
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
      if (existingScript) {
        if ((window as any).google?.maps) {
          isLoaded = true;
          return true;
        }
        return new Promise<boolean>((resolve) => {
          existingScript.addEventListener('load', () => {
            isLoaded = true;
            resolve(true);
          });
          existingScript.addEventListener('error', () => resolve(false));
          // Timeout de seguridad
          setTimeout(() => resolve(!!(window as any).google?.maps), 4000);
        });
      }

      // Obtener la clave configurada en el servidor
      const res = await fetch('/api/maps/config');
      if (!res.ok) {
        return false;
      }
      const data = await res.json();
      const apiKey = data.apiKey;

      if (!apiKey) {
        console.info('[GoogleMapsLoader] REACT_APP_MAPS_API_KEY no configurada. Operando en modo fotogramétrico/OSM.');
        return false;
      }

      return new Promise<boolean>((resolve) => {
        const script = document.createElement('script');
        script.id = 'google-maps-singleton-script';
        // Se cargan todas las librerías necesarias de una sola vez con versión alpha para soporte 3D y StreetView
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=alpha&libraries=maps3d,places,geometry`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          isLoaded = true;
          resolve(true);
        };

        script.onerror = (err) => {
          console.warn('[GoogleMapsLoader] Error al cargar Google Maps API:', err);
          resolve(false);
        };

        document.head.appendChild(script);
      });
    } catch (err) {
      console.warn('[GoogleMapsLoader] Excepción durante la carga de Google Maps:', err);
      return false;
    }
  })();

  return loadPromise;
}

export function isGoogleMapsApiLoaded(): boolean {
  return isLoaded || (typeof window !== 'undefined' && !!(window as any).google?.maps);
}
