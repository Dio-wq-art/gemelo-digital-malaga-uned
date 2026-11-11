import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { SYSTEM_PROPAGATION } from '../lib/systemPropagationEngine';
import { OFFICIAL_MALAGA_AIR_STATIONS, OFFICIAL_SATELLITE_MISSIONS } from '../lib/physics';
import { MALAGA_HOTSPOT_PRESETS } from '../lib/mapKinematicEngine';

describe('Regla Doctrinal 13: Automatismo y Propagación en Cadena Universal', () => {
  it('1. Debe calcular dinámicamente el conteo íntegro de estaciones terrestres y misiones espaciales', () => {
    expect(SYSTEM_PROPAGATION.stationsCount).toBe(OFFICIAL_MALAGA_AIR_STATIONS.length);
    expect(SYSTEM_PROPAGATION.satellitesCount).toBe(OFFICIAL_SATELLITE_MISSIONS.length);
    expect(SYSTEM_PROPAGATION.hotspotsCount).toBe(MALAGA_HOTSPOT_PRESETS.length);
    // Verificación de la red certificada del Gemelo Digital en Málaga ciudad
    expect(SYSTEM_PROPAGATION.stationsCount).toBe(OFFICIAL_MALAGA_AIR_STATIONS.length);
    expect(SYSTEM_PROPAGATION.satellitesCount).toBe(OFFICIAL_SATELLITE_MISSIONS.length);
    expect(SYSTEM_PROPAGATION.stationsCount).toBe(24);
    expect(SYSTEM_PROPAGATION.satellitesCount).toBe(16);
  });

  it('2. Los rótulos oficiales calculados deben reflejar automáticamente la colección maestra', () => {
    const nStations = OFFICIAL_MALAGA_AIR_STATIONS.length;
    const nSats = OFFICIAL_SATELLITE_MISSIONS.length;
    expect(SYSTEM_PROPAGATION.observatoryCapsule).toBe(`OBSERVATORIO ${nStations}+${nSats}`);
    expect(SYSTEM_PROPAGATION.observatoryShort).toBe(`${nStations}+${nSats} RED`);
    expect(SYSTEM_PROPAGATION.stationsToggleHeader).toBe(`${nStations} EST.`);
    expect(SYSTEM_PROPAGATION.satellitesToggleHeader).toBe(`${nSats} SAT.`);
    expect(SYSTEM_PROPAGATION.atalayasLabel).toBe(`ATALAYAS (${MALAGA_HOTSPOT_PRESETS.length})`);
  });

  it('3. Cero cadenas rígidas obsoletas (44+14, 50+17, 64+26, 65+26) en componentes visuales', () => {
    const componentsDir = path.resolve(__dirname, '../components');
    const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

    const forbiddenPatterns = [
      'OBSERVATORIO 44+14',
      '44+14 RED',
      '44 EST.',
      '14 SAT.',
      'RED 44 ESTACIONES',
      'ATALAYAS (1-6)',
      'OBSERVATORIO 50+17',
      '50+17 RED',
      'RED OFICIAL DE 50 ESTACIONES',
      '17 MISIONES SATELITALES ASIMILADAS SOBRE ESTE PUNTO',
      'OBSERVATORIO 64+26',
      'OBSERVATORIO 65+26',
      '64+26 RED',
      '65+26 RED',
      '64 EST.',
      '65 EST.',
      '26 SAT.'
    ];

    const violations: { file: string; pattern: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(path.join(componentsDir, file), 'utf-8');
      for (const pattern of forbiddenPatterns) {
        if (content.includes(pattern)) {
          violations.push({ file, pattern });
        }
      }
    }

    expect(
      violations,
      `Se encontraron textos hardcodeados obsoletos que violan la Regla 13:\n${violations.map(v => `  - ${v.file}: "${v.pattern}"`).join('\n')}`
    ).toHaveLength(0);
  });

  it('4. En el punto activo se activan y asimilan deterministamente todas las estaciones y misiones satelitales', async () => {
    const { assimilatePointInRealtime } = await import('../lib/spatialAssimilation');
    
    // Punto de prueba: Calle Marqués de Larios (Centro Histórico)
    const testLat = 36.7196;
    const testLon = -4.4200;
    const mockMeteo: any = {
      temperatura_malaga: 22.5,
      humedad_relativa: 58,
      velocidad_viento_km_h: 14.2,
      direccion_viento_grados: 120,
      no2_satelite_base: 32.0,
      pm2_5: 14.0,
      pm10: 24.0,
      ozone: 55.0
    };

    const state = assimilatePointInRealtime(testLat, testLon, mockMeteo);

    // Comprobación de activación de todas las estaciones oficiales in situ
    expect(state.allStationsReadings).toBeDefined();
    expect(state.allStationsReadings.length).toBe(OFFICIAL_MALAGA_AIR_STATIONS.length);
    expect(state.totalStationsAssimilated).toBe(OFFICIAL_MALAGA_AIR_STATIONS.length);
    expect(state.nearestStation).toBeDefined();
    expect(state.nearestStation.distanceKm).toBeGreaterThan(0);
    expect(state.nearestStation.interpolatedWeightPct).toBeGreaterThan(0);

    // Cada estación debe tener datos válidos no vacíos ni NaN
    for (const r of state.allStationsReadings) {
      expect(Number.isFinite(r.no2)).toBe(true);
      expect(Number.isFinite(r.pm25)).toBe(true);
      expect(Number.isFinite(r.pm10)).toBe(true);
      expect(Number.isFinite(r.o3)).toBe(true);
      expect(Number.isFinite(r.temp)).toBe(true);
      expect(Number.isFinite(r.distanceKm)).toBe(true);
      expect(Number.isFinite(r.weightPct)).toBe(true);
    }

    // Comprobación de activación de todas las misiones satelitales
    expect(state.allSatellitesReadings).toBeDefined();
    expect(state.allSatellitesReadings.length).toBe(OFFICIAL_SATELLITE_MISSIONS.length);
    expect(state.totalSatellitesAssimilated).toBe(OFFICIAL_SATELLITE_MISSIONS.length);

    // Cada satélite debe poseer valor interpolado local numérico
    for (const sat of state.allSatellitesReadings) {
      expect(sat.mission).toBeDefined();
      expect(Number.isFinite(sat.localInterpolatedValue)).toBe(true);
      expect(Number.isFinite(sat.distanceKm)).toBe(true);
      expect(sat.status).toBe('ACTIVE');
    }
  });

  it('5. Auditoría exhaustiva: las estaciones terrestres y misiones satelitales en Málaga ciudad están operativas en el registro unificado', async () => {
    const { getAllTerrestrialStations, getAllSatelliteMissions } = await import('../lib/dynamicStationRegistry');
    
    const terrestrial = getAllTerrestrialStations();
    const satellites = getAllSatelliteMissions();

    expect(terrestrial.length).toBe(OFFICIAL_MALAGA_AIR_STATIONS.length);
    expect(satellites.length).toBe(OFFICIAL_SATELLITE_MISSIONS.length);
    expect(terrestrial.length).toBe(24);
    expect(satellites.length).toBe(16);

    // Verificación de integridad de metadatos de las 24 estaciones terrestres
    const stationIds = new Set<string>();
    for (const st of terrestrial) {
      expect(st.id).toBeTruthy();
      expect(st.code).toBeTruthy();
      expect(st.name).toBeTruthy();
      expect(st.network).toBeTruthy();
      expect(st.lat).toBeGreaterThan(36.0);
      expect(st.lat).toBeLessThan(37.5);
      expect(st.lon).toBeGreaterThan(-5.5);
      expect(st.lon).toBeLessThan(-3.5);
      expect(st.sensors.length).toBeGreaterThan(0);
      expect(stationIds.has(st.id)).toBe(false); // Cero IDs duplicados
      stationIds.add(st.id);
    }

    // Verificación de integridad de metadatos de las 16 misiones satelitales
    const satelliteIds = new Set<string>();
    for (const sat of satellites) {
      expect(sat.id).toBeTruthy();
      expect(sat.code).toBeTruthy();
      expect(sat.name).toBeTruthy();
      expect(sat.agency).toBeTruthy();
      expect(sat.orbitType).toBeTruthy();
      expect(sat.spatialResolution).toBeTruthy();
      expect(sat.targetSpecies.length).toBeGreaterThan(0);
      expect(sat.revisitPassMálaga).toBeTruthy();
      expect(sat.assimilationMethod).toBeTruthy();
      expect(sat.doi).toBeTruthy();
      expect(sat.status).toBe('ACTIVE');
      expect(satelliteIds.has(sat.id)).toBe(false); // Cero IDs duplicados
      satelliteIds.add(sat.id);
    }
  });

  it('6. Regla Doctrinal 14: Propagación del inventario fotocatalítico Grado A1 (GMU/UMA) y química interfacial del 99,8 % de asfalto convencional', async () => {
    const { MALAGA_TIO2_TREATMENT_STREETS, calculateTio2AbatementSummary } = await import('../lib/tio2PhotocatalyticAbatement');
    const { resolvePavementForMalagaPoint, calculateRoadPavementPhysics } = await import('../physics/roadPavementPhysics');

    expect(SYSTEM_PROPAGATION.tio2VerifiedCount).toBe(MALAGA_TIO2_TREATMENT_STREETS.length);
    expect(SYSTEM_PROPAGATION.tio2VerifiedCount).toBe(8);
    expect(SYSTEM_PROPAGATION.tio2VerifiedAreaM2).toBe(36360);

    // Verificar Ley de 3 Resistencias, Damköhler y Selectividad de Ballari-Brouwers
    const summary = calculateTio2AbatementSummary(35.0, 58.0, 2.2, 42.0, 14, 24.0);
    expect(summary.meanDepositionVelocityCmS).toBeGreaterThan(0);
    expect(summary.meanDamkohlerDa).toBeGreaterThan(0);
    expect(summary.meanNitrateSelectivityPct).toBeGreaterThan(50);

    // Verificar que C/ Marqués de Larios es mármol de Macael / solería granítica sin falso positivo de TiO2
    const larios = resolvePavementForMalagaPoint(36.7196, -4.4200, 'Calle Marqués de Larios');
    expect(larios.pavementType.id).toBe('adoquin_granitico_centro');
    expect(larios.matchedGmuTio2Street).toBeNull();

    // Verificar que Alameda Principal detecta el pavimento i.active CARGO® Grado A1
    const alameda = resolvePavementForMalagaPoint(36.7179, -4.4242, 'Alameda Principal');
    expect(alameda.pavementType.id).toBe('pavimento_frio_fotocatalitico');
    expect(alameda.matchedGmuTio2Street?.id).toBe('alameda_principal_carril_bus');

    // Verificar química interfacial de asfalto convencional (Wesely, Stemmler HONO, Khare & Gentner IVOCs, Fe2O3, 6PPD-Q)
    const roadVia = resolvePavementForMalagaPoint(36.7015, -4.4455, 'Avenida de Velázquez');
    const asphaltRes = calculateRoadPavementPhysics({
      pavementTypeId: roadVia.pavementType.id,
      vehicleSpeedKmH: 45,
      trafficVolumeVehiclesHour: 1450,
      heavyVehicleSharePct: 9,
      roadGradientPct: 1.2,
      ambientTempC: 28,
      solarRadiationWm2: 720,
      relativeHumidityPct: 55,
      assimilatedNo2Ugm3: 44,
      assimilatedO3Ugm3: 58,
      windSpeedMs: 2.4,
      canyonHeightM: 18
    });
    expect(asphaltRes.asphaltIvocSvocEmissionUgM2H).toBeGreaterThan(0);
    expect(asphaltRes.asphaltHonoProductionFluxUgM2H).toBeGreaterThan(0);
    expect(asphaltRes.sixPpdQuinoneFormationNgM2H).toBeGreaterThan(0);
  });
});

