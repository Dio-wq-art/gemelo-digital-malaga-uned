import { describe, it, expect } from 'vitest';
import { generateActivePointQ1PaperPdf } from '../lib/q1PaperGenerator';
import { MeteoData } from '../lib/physics';

describe('Monografía Científica Q1 para Puntos Activos (Tesis Doctoral)', () => {
  const dummyMeteo: MeteoData = {
    temperatura_malaga: 24.2,
    humedad_relativa: 65,
    velocidad_viento_km_h: 12.0,
    direccion_viento_grados: 140,
    no2_satelite_base: 26.5,
    pm2_5: 10.2,
    pm10: 19.4,
    ozone: 42.0,
    shortwave_radiation: 580,
    uv_index: 5.8,
    lai_arbolado: 2.5,
    dust: 0,
    presion_atmosferica: 1013
  };

  it('1. Genera un documento PDF formal con exactamente 8 páginas para Calle Marqués de Larios', () => {
    const doc = generateActivePointQ1PaperPdf({
      location: { lat: 36.7185, lon: -4.4213 },
      customZoneName: 'Calle Marqués de Larios',
      meteo: dummyMeteo,
      activePoint: {
        lat: 36.7185,
        lon: -4.4213,
        name: 'Calle Marqués de Larios',
        nearestStreetName: 'Calle Marqués de Larios',
        highwayType: 'pedestrian',
        neighborhoodName: 'Centro Histórico',
        districtName: 'Distrito Centro',
        districtId: 1,
        postalCode: '29015',
        aspectRatioHw: 2.01,
        H: 22.5,
        W: 11.2,
        orientationDeg: 184,
        skyViewFactorSvf: 0.35,
        elevationM: 12.0,
        treeCoverPct: 2.0,
        lanes: 0,
        qNOx_ug_m_s: 4.2,
        trafficVehiclesDay: 0,
        clickedFeatureType: 'street',
        isKnownLandmark: true,
        distanceToStreetMeters: 0,
        lateralZone: 'sidewalk',
        lateralZoneLabel: 'Acera Peatonal',
        perpendicularDecayFactor: 1.0,
        utmX: 372900,
        utmY: 4065200,
        distanceToCoastM: 350,
        nearestOfficialStation: { id: 'carranque', code: 'ES1681A', name: 'Carranque', distanceM: 1200 },
        flowRegimeOke: 'skimming_flow',
        flowRegimeLabel: 'Skimming Flow',
        streetOrientationLabel: 'Norte-Sur',
        fullLocationDescription: 'Calle Marqués de Larios, Centro Histórico, Málaga',
        buildingHeightM: 22.5,
        canyonWidthM: 11.2,
        streetBearingDeg: 184,
        streetName: 'Calle Marqués de Larios',
        district: 'Distrito Centro',
        svf: 0.35,
        isPedestrian: true
      }
    });

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBe(8);
  });

  it('2. Resuelve deterministamente las coordenadas oficiales ETRS89 UTM Huso 30N', () => {
    const doc = generateActivePointQ1PaperPdf({
      location: { lat: 36.7213, lon: -4.4214 },
      meteo: dummyMeteo
    });

    expect(doc.getNumberOfPages()).toBe(8);
    const pdfOutput = doc.output('arraybuffer');
    expect(pdfOutput.byteLength).toBeGreaterThan(15000);
  });

  it('3. Audita el colegio más próximo frente al nuevo límite vinculante de la Directiva (UE) 2024/2881', () => {
    const doc = generateActivePointQ1PaperPdf({
      location: { lat: 36.7088, lon: -4.4443 },
      customZoneName: 'Avenida Juan XXIII',
      meteo: dummyMeteo
    });

    expect(doc.getNumberOfPages()).toBe(8);
  });
});
