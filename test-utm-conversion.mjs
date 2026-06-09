import fs from 'fs';
import path from 'path';

// Función de conversión UTM a lat/lon
const WGS84_A = 6378137.0;
const WGS84_E2 = 0.00669438;
const WGS84_E_PRIME2 = 0.00673949;
const K0 = 0.9996;
const FALSE_EASTING = 500000;
const FALSE_NORTHING = 0;
const ZONE_30_CENTRAL_MERIDIAN = -3;

function utmToLatLon(easting, northing, zone = 30) {
  try {
    const x = easting - FALSE_EASTING;
    const y = northing - FALSE_NORTHING;

    const m = y / K0;
    const mu = m / (WGS84_A * (1 - WGS84_E2 / 4 - 3 * WGS84_E2 * WGS84_E2 / 64 - 5 * WGS84_E2 * WGS84_E2 * WGS84_E2 / 256));

    const phi1Rad = mu +
      (3 * WGS84_E2 / 8 + 3 * WGS84_E2 * WGS84_E2 / 32 + 45 * WGS84_E2 * WGS84_E2 * WGS84_E2 / 1024) * Math.sin(2 * mu) +
      (15 * WGS84_E2 * WGS84_E2 / 256 + 45 * WGS84_E2 * WGS84_E2 * WGS84_E2 / 1024) * Math.sin(4 * mu) +
      (35 * WGS84_E2 * WGS84_E2 * WGS84_E2 / 3072) * Math.sin(6 * mu);

    const c1 = WGS84_E_PRIME2 * Math.cos(phi1Rad) * Math.cos(phi1Rad);
    const t1 = Math.tan(phi1Rad) * Math.tan(phi1Rad);
    const n1 = WGS84_A / Math.sqrt(1 - WGS84_E2 * Math.sin(phi1Rad) * Math.sin(phi1Rad));
    const r1 = WGS84_A * (1 - WGS84_E2) / Math.sqrt(Math.pow(1 - WGS84_E2 * Math.sin(phi1Rad) * Math.sin(phi1Rad), 3));
    const d = x / (n1 * K0);

    const latitude = phi1Rad -
      (n1 * Math.tan(phi1Rad) / r1) *
      (d * d / 2 -
        (d * d * d * d / 24) * (5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * WGS84_E_PRIME2) +
        (d * d * d * d * d * d / 720) * (61 + 90 * t1 + 28 * t1 * t1 + 45 * WGS84_E_PRIME2 - 252 * WGS84_E_PRIME2 - 3 * WGS84_E_PRIME2 * WGS84_E_PRIME2));

    const longitude = ZONE_30_CENTRAL_MERIDIAN +
      (d - (d * d * d / 6) * (1 + 2 * t1 + c1) + (d * d * d * d * d / 120) * (5 - 2 * c1 + 28 * t1 - 3 * WGS84_E_PRIME2 + 8 * WGS84_E_PRIME2 - 3 * WGS84_E_PRIME2 * WGS84_E_PRIME2)) /
      Math.cos(phi1Rad);

    return {
      latitude: parseFloat((latitude * (180 / Math.PI)).toFixed(8)),
      longitude: parseFloat((longitude * (180 / Math.PI)).toFixed(8)),
    };
  } catch (error) {
    console.error("Error converting UTM to lat/lon:", error);
    throw new Error("Failed to convert UTM coordinates to lat/lon");
  }
}

// Leer el GeoJSON
const geojsonPath = '/home/ubuntu/upload/cajasnido.geojson';
const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));

console.log('📊 Probando conversión UTM a lat/lon\n');
console.log(`Total de features: ${geojson.features.length}\n`);

// Convertir las primeras 5 cajas como ejemplo
const examples = geojson.features.slice(0, 5);

for (const feature of examples) {
  const [easting, northing] = feature.geometry.coordinates;
  const { latitude, longitude } = utmToLatLon(easting, northing);
  const etiqueta = feature.properties.Etiqueta;
  
  console.log(`${etiqueta}:`);
  console.log(`  UTM: E=${easting}, N=${northing}`);
  console.log(`  Lat/Lon: ${latitude}, ${longitude}`);
  console.log(`  Válido: ${latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180 ? '✅' : '❌'}`);
  console.log();
}

console.log('✅ Conversión completada exitosamente');
