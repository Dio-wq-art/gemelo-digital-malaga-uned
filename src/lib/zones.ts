export interface Zone {
  name: string;
  lat: number;
  lon: number;
  tag: string;
  zoom?: number;
  bearing?: number;
}

export const PRESET_ZONES: Zone[] = [
  { name: 'Cañón Alameda', lat: 36.7188, lon: -4.4222, tag: 'Foco Central (NO2)', zoom: 16.5, bearing: -45 },
  { name: 'Av. Juan XXIII', lat: 36.7088, lon: -4.4428, tag: 'Cañón Arterial 3D (NO2)', zoom: 16.8, bearing: -15 },
  { name: 'Dosel Parque', lat: 36.7196, lon: -4.4124, tag: 'Filtro Verde (LAI)', zoom: 17, bearing: 15 },
  { name: 'Valle Campanillas', lat: 36.7380, lon: -4.5510, tag: 'Corona Periférica (O3)', zoom: 15, bearing: 80 },
  { name: 'Dársena Puerto', lat: 36.7153, lon: -4.4172, tag: 'Brisa Sur (Advección HFO)', zoom: 16.2, bearing: -20 },
  { name: 'Aeropuerto', lat: 36.6749, lon: -4.4991, tag: 'Emisión NOx Bruto', zoom: 15.5, bearing: -120 },
  { name: 'Polo Químico', lat: 36.6850, lon: -4.4750, tag: 'Masa Industrial (SO2/VOCs)', zoom: 15.8, bearing: 90 },
  { name: 'Campus Teatinos', lat: 36.7183, lon: -4.4735, tag: 'Centro Universitario (Mix)', zoom: 15.5, bearing: 0 },
];
