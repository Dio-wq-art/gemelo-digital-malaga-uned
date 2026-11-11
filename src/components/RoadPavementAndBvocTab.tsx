import React, { useMemo } from 'react';
import { ScientificTooltip } from './ScientificTooltip';
import {
  calculateRoadPavementPhysics,
  exportRoadPhysicsCsv,
  resolvePavementForMalagaPoint
} from '../physics/roadPavementPhysics';
import {
  calculatePhotochemicalCanopyPhysics,
  PhotochemicalCanopyResult
} from '../physics/bvocMeganPhysics';
import { MALAGA_SPECIES_CATALOG } from '../lib/malagaTreesInventory';
import { useActivePoint } from '../context/ActivePointContext';
import {
  Car,
  Trees,
  Download,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Gauge,
  FlaskConical
} from 'lucide-react';

interface Props {
  streetName?: string;
  ambientTempC?: number;
  solarRadWm2?: number;
  windSpeedMs?: number;
  trafficVolumeVehH?: number;
}

export const RoadPavementAndBvocTab: React.FC<Props> = ({
  streetName,
  ambientTempC,
  solarRadWm2,
  windSpeedMs,
  trafficVolumeVehH
}) => {
  const activePointCtx = useActivePoint();

  const activeLat = activePointCtx?.location?.lat ?? 36.7185;
  const activeLon = activePointCtx?.location?.lon ?? -4.4220;
  const resolvedStreetName =
    streetName ||
    activePointCtx?.activePoint?.name ||
    activePointCtx?.activePoint?.nearestStreetName ||
    'Avenida de Andalucía';

  const liveTempC =
    ambientTempC ??
    activePointCtx?.assimilation?.temperatureC ??
    activePointCtx?.data?.temperatura_malaga ??
    24.5;
  const liveSolarWm2 =
    solarRadWm2 ?? 640;
  const liveRhPct =
    activePointCtx?.assimilation?.relativeHumidityPct ??
    activePointCtx?.data?.humedad_relativa ??
    55;
  const liveNo2Ugm3 =
    activePointCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ??
    activePointCtx?.data?.no2_satelite_base ??
    34.0;
  const liveO3Ugm3 = activePointCtx?.assimilation?.ozoneO3UgM3 ?? 48.0;
  const liveWindMs =
    windSpeedMs ??
    (activePointCtx?.assimilation?.windSpeedKmh
      ? activePointCtx.assimilation.windSpeedKmh / 3.6
      : activePointCtx?.data?.velocidad_viento_km_h
      ? activePointCtx.data.velocidad_viento_km_h / 3.6
      : 2.2);
  const liveElevationM = activePointCtx?.activePoint?.elevationM ?? 12;

  const resolvedPavementInfo = useMemo(() => {
    return resolvePavementForMalagaPoint(activeLat, activeLon, resolvedStreetName);
  }, [activeLat, activeLon, resolvedStreetName]);

  const roadKinematics = useMemo(() => {
    const pid = resolvedPavementInfo.pavementType.id;
    const isZbeOrPedestrian =
      pid === 'adoquin_granitico_centro' || pid === 'pavimento_frio_fotocatalitico';
    const isHighway = pid === 'pavimento_drenante_fonoabsorbente';

    const speedKmH = isHighway ? 80 : isZbeOrPedestrian ? 20 : 40;
    const volumeVehH =
      trafficVolumeVehH ?? (isHighway ? 2400 : isZbeOrPedestrian ? 320 : 1150);
    const heavySharePct = isHighway ? 11.5 : isZbeOrPedestrian ? 6.5 : 8.0;
    const gradientPct = parseFloat(
      Math.min(8.0, Math.max(0.5, liveElevationM / 25.0)).toFixed(1)
    );

    return { speedKmH, volumeVehH, heavySharePct, gradientPct };
  }, [resolvedPavementInfo, trafficVolumeVehH, liveElevationM]);

  const roadInput = useMemo(
    () => ({
      pavementTypeId: resolvedPavementInfo.pavementType.id,
      vehicleSpeedKmH: roadKinematics.speedKmH,
      trafficVolumeVehiclesHour: roadKinematics.volumeVehH,
      heavyVehicleSharePct: roadKinematics.heavySharePct,
      roadGradientPct: roadKinematics.gradientPct,
      ambientTempC: liveTempC,
      solarRadiationWm2: liveSolarWm2,
      relativeHumidityPct: liveRhPct,
      assimilatedNo2Ugm3: liveNo2Ugm3,
      assimilatedO3Ugm3: liveO3Ugm3,
      windSpeedMs: liveWindMs
    }),
    [
      resolvedPavementInfo,
      roadKinematics,
      liveTempC,
      liveSolarWm2,
      liveRhPct,
      liveNo2Ugm3,
      liveO3Ugm3,
      liveWindMs
    ]
  );

  const roadResult = useMemo(() => {
    return calculateRoadPavementPhysics(roadInput);
  }, [roadInput]);

  const nearestTreeStreet = activePointCtx?.nearestTreeStreet;
  const activeSpeciesId = useMemo(() => {
    if (nearestTreeStreet?.predominantSpeciesId) {
      const exists = MALAGA_SPECIES_CATALOG.some(
        (s) => s.id === nearestTreeStreet.predominantSpeciesId
      );
      if (exists) return nearestTreeStreet.predominantSpeciesId;
    }
    return 'jacaranda';
  }, [nearestTreeStreet]);

  const activeTreeCount = nearestTreeStreet?.totalTreeCount ?? 28;
  const activeLai = nearestTreeStreet?.estimatedStreetLAI ?? 4.1;

  const canopyResult: PhotochemicalCanopyResult = useMemo(() => {
    return calculatePhotochemicalCanopyPhysics({
      speciesId: activeSpeciesId,
      lai: activeLai,
      crownPorosity: 0.25,
      solarZenithAngleDeg: 25.0,
      surfaceSolarRadWm2: liveSolarWm2,
      ambientTempC: liveTempC,
      ambientNo2Ugm3: liveNo2Ugm3,
      ambientO3Ugm3: liveO3Ugm3,
      treeCountInAlignment: activeTreeCount,
      canopyAreaM2PerTree: 35.0
    });
  }, [
    activeSpeciesId,
    activeLai,
    liveSolarWm2,
    liveTempC,
    liveNo2Ugm3,
    liveO3Ugm3,
    activeTreeCount
  ]);

  const handleExportCsv = () => {
    const roadCsv = exportRoadPhysicsCsv(roadInput, roadResult);
    const blob = new Blob([roadCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `firme_quimica_interfacial_malaga_${resolvedPavementInfo.pavementType.id}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-3.5 font-mono text-slate-200 text-[11px]">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-800/60 p-3 rounded-sm flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-950 border border-cyan-500/50 rounded text-cyan-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              AUDITORÍA IN SITU DE FIRME MUNICIPAL (99,8% ASFALTO vs 0,2% TiO₂ GMU) & FOTOQUÍMICA ARBÓREA
            </h3>
            <p className="text-[10px] text-slate-400">
              Química heterogénea sobre betún (NO₂→HONO, IVOCs Khare & Gentner 2020, α-Fe₂O₃ frenos, 6PPD-Q neumáticos) y dosel MEGAN 2.1
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ScientificTooltip
            position="bottom"
            width="w-[320px]"
            content="Exportar matriz determinista de rugosidad de firme real, emisiones COPERT 5, conversión NO₂→HONO en urban grime, IVOCs/SVOCs del asfalto, α-Fe₂O₃ y 6PPD-quinona en formato CSV citable."
          >
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600 rounded text-[10px] font-bold cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5" /> EXPORTAR CSV FAIR
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {/* Banner de Clasificación Espacial Selectiva del Firme */}
      <div className="bg-slate-900/95 border border-slate-800 p-2.5 rounded-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-cyan-300 font-bold text-[10.5px]">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            {resolvedStreetName} ({activeLat.toFixed(4)}°N, {activeLon.toFixed(4)}°W)
          </span>
          {resolvedPavementInfo.matchedGmuTio2Street ? (
            <span className="text-[9.5px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> ACTUACIÓN GMU/UMA CON TiO₂ VERIFICADA (Grado A1)
            </span>
          ) : (
            <span className="text-[9.5px] bg-amber-950 text-amber-300 border border-amber-700 px-2 py-0.5 rounded font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> FIRME CONVENCIONAL SIN TiO₂ (Actuación GMU más cercana a {resolvedPavementInfo.distanceToNearestGmuTio2M} m)
            </span>
          )}
        </div>
        <div className="text-[9.5px] text-slate-300">
          {resolvedPavementInfo.classificationBasis}
        </div>
      </div>

      {/* Grid: Left Column (Road Pavement Physics & Interfacial Chemistry) & Right Column (Tree Canopy & MEGAN Photochemistry) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* SECTION 1: ROAD PAVEMENT PHYSICS & INTERFACIAL CHEMISTRY */}
        <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-sm flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] uppercase">
              <Car className="w-4 h-4" />
              <span>1. Física y Química Interfacial del Firme Detectado</span>
            </div>
            <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-700 px-1.5 py-0.5 rounded font-bold">
              MPD: {roadResult.pavement.mpdMm} mm | Albedo: {roadResult.pavement.albedo}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Tipología en Punto Activo:</span>
              <span className="text-amber-300 font-bold">{roadResult.pavement.name}</span>
            </div>
            <p className="text-[9.5px] text-slate-400 mt-1 leading-relaxed">
              {roadResult.pavement.description}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 bg-slate-900/60 p-2 border border-slate-800/80 rounded text-[9.5px]">
            <div>
              <span className="text-slate-400 block">T_piel Firme:</span>
              <strong className="text-yellow-300">{roadResult.pavementSurfaceTempC} °C</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Richardson Ri_b:</span>
              <strong className="text-cyan-300">{roadResult.bulkRichardsonNumberRib}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Wesely r_c(NO₂):</span>
              <strong className="text-amber-300">{roadResult.weselySurfaceResistanceRcNo2Sm} s/m</strong>
            </div>
            <div>
              <span className="text-slate-400 block">v_d(NO₂) Real:</span>
              <strong className="text-emerald-300">{roadResult.weselyDryDepositionVelocityNo2CmS} cm/s</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col gap-0.5">
              <span className="text-slate-400 text-[9px]">Desgaste Frenos & Hematita α-Fe₂O₃:</span>
              <span className="text-amber-400 font-bold text-xs">
                {roadResult.brakeWearPm10MgVehKm} mg/veh·km ({roadResult.brakeWearFe2o3LoadingMgM2} mg Fe₂O₃/m²)
              </span>
              <span className="text-[8.5px] text-slate-400">
                Catálisis luz visible (≤563nm): {roadResult.fe2o3VisibleLightPhotoFentonRateUgM2H} µg/m²·h
              </span>
            </div>

            <div className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col gap-0.5">
              <span className="text-slate-400 text-[9px]">Neumáticos (TWP) & Ozonólisis 6PPD-Q:</span>
              <span className="text-rose-400 font-bold text-xs">
                {roadResult.tireWearPm10MgVehKm} mg/veh·km ({roadResult.sixPpdQuinoneFormationNgM2H} ng 6PPD-Q/m²·h)
              </span>
              <span className="text-[8.5px] text-slate-400">
                Sumidero O₃ por 6PPD: -{roadResult.surfaceOzoneDepletionBy6PpdUgM2H} µg O₃/m²·h
              </span>
            </div>
          </div>

          <div className="bg-slate-900/95 border border-cyan-900/60 p-2.5 rounded space-y-2">
            <div className="flex items-center justify-between text-[10px] border-b border-slate-800 pb-1">
              <span className="text-cyan-300 font-bold flex items-center gap-1">
                <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                Química Interfacial del Ligante Bituminoso y Película Orgánica (Urban Grime)
              </span>
              <span className="text-[8.5px] text-slate-400">
                Fracción Betún: {(roadResult.pavement.bitumenFraction * 100).toFixed(0)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[9.5px]">
              <ScientificTooltip
                position="top"
                width="w-[340px]"
                content="Reducción fotosensibilizada de NO₂ a ácido nitroso (HONO↑) sobre hidrocarburos aromáticos policíclicos (PAHs) y betún (Stemmler et al., Nature 2006; George et al., Chem. Rev. 2015) más hidrólisis oscura (Finlayson-Pitts, 2003)."
              >
                <div className="bg-slate-950 p-2 rounded border border-slate-800 cursor-help">
                  <span className="text-slate-400 block text-[8.5px]">
                    Conversión NO₂ → HONO↑ (γ={roadResult.urbanGrimeGammaNo2}):
                  </span>
                  <strong className="text-rose-300 text-[11px]">
                    +{roadResult.asphaltHonoProductionFluxUgM2H} µg HONO / m²·h
                  </strong>
                  <span className="text-[8px] text-slate-500 block">
                    Fuente matinal de radicales •OH al fotolizarse
                  </span>
                </div>
              </ScientificTooltip>

              <ScientificTooltip
                position="top"
                width="w-[350px]"
                content="Desgasificación termo-actínica de compuestos orgánicos semivolátiles (IVOCs/SVOCs C12–C25) del asfalto calentado por el sol (Khare & Gentner, Science Advances 2020). Sus radicales RO₂• oxidan NO a NO₂ sin consumir O₃ y forman SOA."
              >
                <div className="bg-slate-950 p-2 rounded border border-slate-800 cursor-help">
                  <span className="text-slate-400 block text-[8.5px]">
                    Emisión IVOCs/SVOCs Betún (Khare & Gentner, 2020):
                  </span>
                  <strong className="text-amber-300 text-[11px]">
                    {roadResult.asphaltIvocSvocEmissionUgM2H} µg / m²·h
                  </strong>
                  <span className="text-[8px] text-slate-400 block">
                    SOA: +{roadResult.asphaltSoaYieldPotentialUgM3} µg/m³ • Desv. Leighton: +{roadResult.asphaltRo2NoToNo2PerturbationPct}%
                  </span>
                </div>
              </ScientificTooltip>
            </div>
          </div>

          <div className="bg-amber-950/40 border border-amber-800/80 p-2 rounded text-[10px] text-amber-200">
            <span className="font-bold text-amber-300 uppercase block mb-0.5">
              Dictamen Físico-Químico del Firme In Situ:
            </span>
            {roadResult.doctoralComment}
          </div>
        </div>

        {/* SECTION 2: TREE CANOPY & MEGAN PHOTOCHEMISTRY */}
        <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-sm flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] uppercase">
              <Trees className="w-4 h-4" />
              <span>2. Dosel Arbóreo Municipal & Fotólisis J_NO2 (MEGAN 2.1)</span>
            </div>
            <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded font-bold">
              LAI: {activeLai} • {activeTreeCount} ejemplares
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Especie Dominante en Tramo:</span>
              <span className="text-emerald-300 font-bold">
                {canopyResult.species.commonName} (<em>{canopyResult.species.scientificName}</em>)
              </span>
            </div>
            <p className="text-[9.5px] text-slate-400 mt-1 leading-relaxed">
              {canopyResult.species.primaryRole}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2 border border-slate-800/80 rounded text-[9.5px]">
            <div>
              <span className="text-slate-400 block">Alineación:</span>
              <strong className="text-emerald-300">
                {nearestTreeStreet?.streetName || 'Tramo Próximo'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Índice Foliar LAI:</span>
              <strong className="text-cyan-300">{activeLai} m²/m²</strong>
            </div>
            <div>
              <span className="text-slate-400 block">NO₂ / O₃ Fondo:</span>
              <strong className="text-amber-300">
                {liveNo2Ugm3.toFixed(1)} / {liveO3Ugm3.toFixed(1)} µg/m³
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col gap-0.5">
              <span className="text-slate-400 text-[9px]">Atenuación Fotólisis J_NO2:</span>
              <span className="text-rose-400 font-bold text-xs">
                -{canopyResult.jNo2AttenuationPct}% bajo copa
              </span>
              <span className="text-[8.5px] text-slate-400">
                J_NO2: {canopyResult.underCanopyJNo2PerSec} s⁻¹
              </span>
            </div>

            <div className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col gap-0.5">
              <span className="text-slate-400 text-[9px]">Emisión Isopreno MEGAN 2.1:</span>
              <span className="text-amber-300 font-bold text-xs">
                {canopyResult.isopreneEmissionGramsDay} g / día
              </span>
              <span className="text-[8.5px] text-slate-400">
                Monoterpenos: {canopyResult.monoterpenesEmissionGramsDay} g/día
              </span>
            </div>

            <div className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col gap-0.5">
              <span className="text-slate-400 text-[9px]">Potencial Formación Ozono (MIR):</span>
              <span className="text-yellow-400 font-bold text-xs">
                {canopyResult.photochemicalO3ProductionGramsDay} g O₃ / día
              </span>
              <span className="text-[8.5px] text-slate-400">Acoplamiento BVOC-NOₓ</span>
            </div>

            <div className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col gap-0.5">
              <span className="text-slate-400 text-[9px]">Balance Neto de O3:</span>
              <span
                className={`font-bold text-xs ${
                  canopyResult.netO3BalanceGramsDay >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {canopyResult.netO3BalanceGramsDay >= 0 ? '+' : ''}
                {canopyResult.netO3BalanceGramsDay} g O₃ / día
              </span>
              <span className="text-[8.5px] text-slate-400">Sumidero estomático vs emisión</span>
            </div>
          </div>

          <div className="bg-emerald-950/40 border border-emerald-800/80 p-2 rounded text-[10px] text-emerald-200">
            <span className="font-bold text-emerald-300 uppercase block mb-0.5">
              Evaluación Fotoquímica del Arbolado In Situ:
            </span>
            {canopyResult.doctoralEvaluation}
          </div>
        </div>
      </div>
    </div>
  );
};
