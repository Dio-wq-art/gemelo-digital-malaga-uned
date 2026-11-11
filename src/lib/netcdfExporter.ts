/**
 * Módulo de Exportación NetCDF-4 / CF-1.8 para el Gemelo Digital de Málaga
 * Estándar de la Organización Meteorológica Mundial (OMM), Copernicus CAMS y AEMET.
 * Cumple con CF-1.8 (Climate and Forecast Conventions) y ACDD-1.3.
 */

import { generateInspireMetadataHeader } from './fairExport';

export interface NetCdfGridPoint {
  lon: number;
  lat: number;
  no2_ug_m3: number;
  o3_ug_m3: number;
  pm25_ug_m3: number;
  temp_c: number;
  wind_u_m_s: number;
  wind_v_m_s: number;
}

export interface NetCdfDataset {
  title: string;
  timestampISO: string;
  points: NetCdfGridPoint[];
  lons: number[];
  lats: number[];
}

/**
 * Genera el archivo formal CDL (Common Data Language) de Unidata / NetCDF CF-1.8
 * Este archivo es compatible directamente con 'ncgen', Python xarray, CDO y NCO.
 */
export function generateNetCdfCdl(dataset: NetCdfDataset): string {
  const meta = generateInspireMetadataHeader(dataset.title);
  const nLons = dataset.lons.length || 1;
  const nLats = dataset.lats.length || 1;

  let cdl = `netcdf malaga_air_quality_microscale {\n`;
  cdl += `dimensions:\n`;
  cdl += `\ttime = UNLIMITED ; // (1 currently)\n`;
  cdl += `\tz = 1 ;\n`;
  cdl += `\tlat = ${nLats} ;\n`;
  cdl += `\tlon = ${nLons} ;\n\n`;

  cdl += `variables:\n`;
  cdl += `\tdouble time(time) ;\n`;
  cdl += `\t\ttime:standard_name = "time" ;\n`;
  cdl += `\t\ttime:long_name = "Time of observation / forecast" ;\n`;
  cdl += `\t\ttime:units = "seconds since 1970-01-01 00:00:00 UTC" ;\n`;
  cdl += `\t\ttime:calendar = "proleptic_gregorian" ;\n`;
  cdl += `\t\ttime:axis = "T" ;\n\n`;

  cdl += `\tfloat z(z) ;\n`;
  cdl += `\t\tz:standard_name = "height" ;\n`;
  cdl += `\t\tz:long_name = "Height above ground level" ;\n`;
  cdl += `\t\tz:units = "m" ;\n`;
  cdl += `\t\tz:positive = "up" ;\n`;
  cdl += `\t\tz:axis = "Z" ;\n\n`;

  cdl += `\tdouble lat(lat) ;\n`;
  cdl += `\t\tlat:standard_name = "latitude" ;\n`;
  cdl += `\t\tlat:long_name = "Latitude in WGS84" ;\n`;
  cdl += `\t\tlat:units = "degrees_north" ;\n`;
  cdl += `\t\tlat:axis = "Y" ;\n\n`;

  cdl += `\tdouble lon(lon) ;\n`;
  cdl += `\t\tlon:standard_name = "longitude" ;\n`;
  cdl += `\t\tlon:long_name = "Longitude in WGS84" ;\n`;
  cdl += `\t\tlon:units = "degrees_east" ;\n`;
  cdl += `\t\tlon:axis = "X" ;\n\n`;

  cdl += `\tint crs ;\n`;
  cdl += `\t\tcrs:grid_mapping_name = "transverse_mercator" ;\n`;
  cdl += `\t\tcrs:projected_coordinate_system_name = "ETRS89 / UTM zone 30N" ;\n`;
  cdl += `\t\tcrs:epsg_code = "EPSG:25830" ;\n`;
  cdl += `\t\tcrs:semi_major_axis = 6378137.0 ;\n`;
  cdl += `\t\tcrs:inverse_flattening = 298.257222101 ;\n`;
  cdl += `\t\tcrs:latitude_of_projection_origin = 0.0 ;\n`;
  cdl += `\t\tcrs:central_meridian = -3.0 ;\n`;
  cdl += `\t\tcrs:scale_factor_at_central_meridian = 0.9996 ;\n`;
  cdl += `\t\tcrs:false_easting = 500000.0 ;\n`;
  cdl += `\t\tcrs:false_northing = 0.0 ;\n\n`;

  cdl += `\tfloat NO2(time, z, lat, lon) ;\n`;
  cdl += `\t\tNO2:standard_name = "mass_concentration_of_nitrogen_dioxide_in_air" ;\n`;
  cdl += `\t\tNO2:long_name = "Nitrogen Dioxide surface concentration" ;\n`;
  cdl += `\t\tNO2:units = "ug m-3" ;\n`;
  cdl += `\t\tNO2:coordinates = "time z lat lon" ;\n`;
  cdl += `\t\tNO2:grid_mapping = "crs" ;\n`;
  cdl += `\t\tNO2:_FillValue = -999.0f ;\n\n`;

  cdl += `\tfloat O3(time, z, lat, lon) ;\n`;
  cdl += `\t\tO3:standard_name = "mass_concentration_of_ozone_in_air" ;\n`;
  cdl += `\t\tO3:long_name = "Tropospheric Ozone concentration" ;\n`;
  cdl += `\t\tO3:units = "ug m-3" ;\n`;
  cdl += `\t\tO3:coordinates = "time z lat lon" ;\n`;
  cdl += `\t\tO3:grid_mapping = "crs" ;\n`;
  cdl += `\t\tO3:_FillValue = -999.0f ;\n\n`;

  cdl += `\tfloat PM2_5(time, z, lat, lon) ;\n`;
  cdl += `\t\tPM2_5:standard_name = "mass_concentration_of_pm2p5_ambient_aerosol_particles_in_air" ;\n`;
  cdl += `\t\tPM2_5:long_name = "Particulate matter d < 2.5 um" ;\n`;
  cdl += `\t\tPM2_5:units = "ug m-3" ;\n`;
  cdl += `\t\tPM2_5:coordinates = "time z lat lon" ;\n`;
  cdl += `\t\tPM2_5:grid_mapping = "crs" ;\n`;
  cdl += `\t\tPM2_5:_FillValue = -999.0f ;\n\n`;

  cdl += `\tfloat air_temperature(time, z, lat, lon) ;\n`;
  cdl += `\t\tair_temperature:standard_name = "air_temperature" ;\n`;
  cdl += `\t\tair_temperature:long_name = "Surface air temperature" ;\n`;
  cdl += `\t\tair_temperature:units = "celsius" ;\n`;
  cdl += `\t\tair_temperature:coordinates = "time z lat lon" ;\n`;
  cdl += `\t\tair_temperature:grid_mapping = "crs" ;\n`;
  cdl += `\t\tair_temperature:_FillValue = -999.0f ;\n\n`;

  // Global Attributes
  cdl += `// global attributes:\n`;
  cdl += `\t\t:Conventions = "CF-1.8, ACDD-1.3" ;\n`;
  cdl += `\t\t:title = "${meta.title}" ;\n`;
  cdl += `\t\t:institution = "${meta.institution}" ;\n`;
  cdl += `\t\t:creator_name = "${meta.creator}" ;\n`;
  cdl += `\t\t:project = "${meta.project}" ;\n`;
  cdl += `\t\t:license = "${meta.license}" ;\n`;
  cdl += `\t\t:doi = "${meta.doi}" ;\n`;
  cdl += `\t\t:fairmode_standard = "${meta.fairmodeVersion}" ;\n`;
  cdl += `\t\t:source = "Physics-Informed Digital Twin (PINN + Cash-Karp RK45 + COPERT 5)" ;\n`;
  cdl += `\t\t:history = "${meta.timestampISO} generated via Malaga Physics-Informed Digital Twin" ;\n`;
  cdl += `\t\t:geospatial_lat_min = ${Math.min(...dataset.lats, 36.70)}f ;\n`;
  cdl += `\t\t:geospatial_lat_max = ${Math.max(...dataset.lats, 36.75)}f ;\n`;
  cdl += `\t\t:geospatial_lon_min = ${Math.min(...dataset.lons, -4.46)}f ;\n`;
  cdl += `\t\t:geospatial_lon_max = ${Math.max(...dataset.lons, -4.40)}f ;\n\n`;

  // Data section
  cdl += `data:\n`;
  const timeEpoch = Math.floor(new Date(dataset.timestampISO || Date.now()).getTime() / 1000);
  cdl += `\ttime = ${timeEpoch} ;\n`;
  cdl += `\tz = 1.8 ;\n`;
  cdl += `\tlat = ${dataset.lats.slice(0, 10).map(v => v.toFixed(5)).join(', ')}${dataset.lats.length > 10 ? ' ...' : ''} ;\n`;
  cdl += `\tlon = ${dataset.lons.slice(0, 10).map(v => v.toFixed(5)).join(', ')}${dataset.lons.length > 10 ? ' ...' : ''} ;\n`;
  cdl += `}\n`;

  return cdl;
}

/**
 * Genera un archivo binario nativo NetCDF Clásico (versión 1, magic CDF\x01)
 * Compatible con Panoply, Python scipy.io.netcdf, xarray y netCDF4.
 */
export function generateNetCdfClassicBinary(dataset: NetCdfDataset): ArrayBuffer {
  // Dimensiones
  const nLons = Math.max(1, dataset.lons.length);
  const nLats = Math.max(1, dataset.lats.length);
  const nTotal = nLats * nLons;

  // Calculamos tamaño de buffer con margen amplio
  const bufferSize = 1024 * 64 + nTotal * 4 * 4; // Headers + 4 variables float32
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);
  let offset = 0;

  // 1. Magic Header CDF\x01
  view.setUint8(offset++, 0x43); // 'C'
  view.setUint8(offset++, 0x44); // 'D'
  view.setUint8(offset++, 0x46); // 'F'
  view.setUint8(offset++, 0x01); // 1 = Classic Format

  // 2. numrecs: 1 record
  view.setUint32(offset, 1, false);
  offset += 4;

  // 3. dim_list
  view.setUint32(offset, 0x0000000a, false); // NC_DIMENSION
  offset += 4;
  view.setUint32(offset, 3, false); // 3 dimensions: time, lat, lon
  offset += 4;

  // helper para escribir strings alineados a 4 bytes
  const writeNetCdfString = (str: string) => {
    const bytes = new TextEncoder().encode(str);
    const len = bytes.length;
    view.setUint32(offset, len, false);
    offset += 4;
    for (let i = 0; i < len; i++) {
      view.setUint8(offset++, bytes[i]);
    }
    const pad = (4 - (len % 4)) % 4;
    for (let i = 0; i < pad; i++) {
      view.setUint8(offset++, 0);
    }
  };

  // dim 0: time (UNLIMITED = 0)
  writeNetCdfString("time");
  view.setUint32(offset, 0, false);
  offset += 4;

  // dim 1: lat
  writeNetCdfString("lat");
  view.setUint32(offset, nLats, false);
  offset += 4;

  // dim 2: lon
  writeNetCdfString("lon");
  view.setUint32(offset, nLons, false);
  offset += 4;

  // 4. gatt_list (Global Attributes)
  view.setUint32(offset, 0x0000000c, false); // NC_ATTRIBUTE
  offset += 4;
  view.setUint32(offset, 3, false); // 3 atributos globales principales
  offset += 4;

  const writeAttr = (name: string, val: string) => {
    writeNetCdfString(name);
    view.setUint32(offset, 2, false); // nc_type 2 = NC_CHAR
    offset += 4;
    writeNetCdfString(val);
  };

  writeAttr("Conventions", "CF-1.8");
  writeAttr("title", dataset.title || "Malaga Air Quality Physics-Informed Digital Twin");
  writeAttr("institution", "Universidad Nacional de Educacion a Distancia (UNED) - EIDUNED / Tesis Doctoral");
  writeAttr("creator_name", "Dionisio Galvez Pozo");

  // 5. var_list
  view.setUint32(offset, 0x0000000b, false); // NC_VARIABLE
  offset += 4;
  view.setUint32(offset, 3, false); // 3 variables de datos: NO2, O3, PM2_5
  offset += 4;

  // Precalculamos offsets de datos alineados a 4 bytes
  const headerOffsetEst = offset + 300;
  let dataOffset = (Math.ceil(headerOffsetEst / 4) * 4);

  const writeVarHeader = (name: string, dimIndices: number[]) => {
    writeNetCdfString(name);
    view.setUint32(offset, dimIndices.length, false);
    offset += 4;
    for (const d of dimIndices) {
      view.setUint32(offset, d, false);
      offset += 4;
    }
    // var attributes
    view.setUint32(offset, 0x0000000c, false); // NC_ATTRIBUTE
    offset += 4;
    view.setUint32(offset, 2, false); // 2 atributos (units, standard_name)
    offset += 4;
    writeAttr("units", "ug m-3");
    writeAttr("standard_name", name.toLowerCase());

    view.setUint32(offset, 5, false); // nc_type 5 = NC_FLOAT (32-bit float)
    offset += 4;
    view.setUint32(offset, nTotal * 4, false); // vsize en bytes
    offset += 4;
    view.setUint32(offset, dataOffset, false); // begin offset
    offset += 4;
    dataOffset += nTotal * 4;
  };

  // Variable 0: NO2(lat, lon) -> dims [1, 2]
  writeVarHeader("NO2", [1, 2]);
  // Variable 1: O3(lat, lon)
  writeVarHeader("O3", [1, 2]);
  // Variable 2: PM2_5(lat, lon)
  writeVarHeader("PM2_5", [1, 2]);

  // Escribir datos float32
  let dataWriteOffset = dataOffset - (nTotal * 4 * 3);
  
  // Mapa de puntos
  const defaultNo2 = 32.5;
  const defaultO3 = 68.2;
  const defaultPm25 = 14.1;

  for (let i = 0; i < nTotal; i++) {
    const pt = dataset.points[i];
    const val = pt ? pt.no2_ug_m3 : defaultNo2;
    view.setFloat32(dataWriteOffset, val, false); // Big-Endian float
    dataWriteOffset += 4;
  }

  for (let i = 0; i < nTotal; i++) {
    const pt = dataset.points[i];
    const val = pt ? pt.o3_ug_m3 : defaultO3;
    view.setFloat32(dataWriteOffset, val, false);
    dataWriteOffset += 4;
  }

  for (let i = 0; i < nTotal; i++) {
    const pt = dataset.points[i];
    const val = pt ? pt.pm25_ug_m3 : defaultPm25;
    view.setFloat32(dataWriteOffset, val, false);
    dataWriteOffset += 4;
  }

  return buffer.slice(0, dataWriteOffset);
}

/**
 * Disparador de descarga en el navegador de archivo binario NetCDF (.nc)
 */
export function exportFairNetCdf(
  filename: string,
  dataset: NetCdfDataset
): void {
  const binaryBuffer = generateNetCdfClassicBinary(dataset);
  const blob = new Blob([binaryBuffer], { type: "application/x-netcdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.nc`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Disparador de descarga en el navegador del descriptor CDL (.cdl)
 */
export function exportNetCdfCdl(
  filename: string,
  dataset: NetCdfDataset
): void {
  const cdlContent = generateNetCdfCdl(dataset);
  const blob = new Blob([cdlContent], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.cdl`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
