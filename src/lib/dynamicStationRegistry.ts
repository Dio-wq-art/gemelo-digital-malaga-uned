/**
 * Dynamic Station & Satellite Registry
 */
import { OFFICIAL_MALAGA_AIR_STATIONS, OFFICIAL_SATELLITE_MISSIONS, OfficialStation, SatelliteMission } from "./physics";

export function getAllTerrestrialStations(): OfficialStation[] {
  return OFFICIAL_MALAGA_AIR_STATIONS;
}

export function getAllSatelliteMissions(): SatelliteMission[] {
  return OFFICIAL_SATELLITE_MISSIONS;
}
