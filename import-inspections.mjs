import fs from 'fs';
import postgres from 'postgres';

// Leer variables de entorno
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
if (!SUPABASE_DB_PASSWORD) {
  console.error('❌ SUPABASE_DB_PASSWORD no está configurada');
  process.exit(1);
}

const DATABASE_URL = `postgresql://postgres.juqfiuyhddskgodgwihi:${SUPABASE_DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;

// Conectar a la base de datos
const sql = postgres(DATABASE_URL);

// Función para convertir UTM a lat/lon
const WGS84_A = 6378137.0;
const WGS84_E2 = 0.00669438;
const WGS84_E_PRIME2 = 0.00673949;
const K0 = 0.9996;
const FALSE_EASTING = 500000;
const FALSE_NORTHING = 0;
const ZONE_30_CENTRAL_MERIDIAN = -3;

function utmToLatLon(easting, northing, zone = 30) {
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
}

async function main() {
  try {
    console.log('📥 Importando cajas nido desde GeoJSON...\n');

    // Leer GeoJSON
    const geojson = JSON.parse(fs.readFileSync('/home/ubuntu/upload/cajasnido.geojson', 'utf-8'));
    
    // Insertar cajas nido
    let nestBoxCount = 0;
    const nestBoxMap = new Map(); // Mapear cajaId → nestBoxId

    for (const feature of geojson.features) {
      const [easting, northing] = feature.geometry.coordinates;
      const { latitude, longitude } = utmToLatLon(easting, northing);
      const cajaId = feature.properties.Etiqueta;
      const instalacion = feature.properties.PSF || 'Sin especificar';
      const tipoCaja = feature.properties.Tipo || 'Estándar';

      try {
        const result = await sql`
          INSERT INTO "nestBoxes" ("cajaId", "instalacion", "tipoCaja", "latitude", "longitude", "estadoActual", "ultimaEspecie", "createdAt", "updatedAt")
          VALUES (${cajaId}, ${instalacion}, ${tipoCaja}, ${latitude}, ${longitude}, 'Sin datos', NULL, NOW(), NOW())
          ON CONFLICT ("cajaId") DO UPDATE SET "updatedAt" = NOW()
          RETURNING id
        `;
        
        if (result.length > 0) {
          nestBoxMap.set(cajaId, result[0].id);
          nestBoxCount++;
        }
      } catch (err) {
        console.error(`❌ Error insertando caja ${cajaId}:`, err.message);
      }
    }

    console.log(`✅ ${nestBoxCount} cajas nido insertadas/actualizadas\n`);

    // Leer inspecciones
    console.log('📥 Importando inspecciones históricas...\n');
    const inspectionData = fs.readFileSync('/home/ubuntu/upload/pasted_content_2.txt', 'utf-8');
    const lines = inspectionData.split('\n').slice(1); // Saltar encabezado

    let inspectionCount = 0;
    const inspectionsByBox = new Map(); // Mapear cajaId → última inspección

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.split('\t');
      if (parts.length < 13) continue;

      const fecha = parts[0].trim();
      const ocupacion = parts[2].trim() === 'Ocupada' ? 1 : 0;
      const psf = parts[4].trim();
      const codigoCN = parts[6].trim();
      const especie = parts[7].trim() || null;
      const numHuevos = parseFloat(parts[9]) || 0;
      const numPollos = parseFloat(parts[10]) || 0;
      const observaciones = parts[12].trim() || '';

      // Convertir fecha DD/MM/YYYY a ISO
      const [day, month, year] = fecha.split('/');
      const fechaISO = new Date(`${year}-${month}-${day}`).toISOString();

      const nestBoxId = nestBoxMap.get(codigoCN);
      if (!nestBoxId) {
        console.warn(`⚠️  Caja no encontrada: ${codigoCN}`);
        continue;
      }

      try {
        await sql`
          INSERT INTO "inspections" ("nestBoxId", "userId", "fecha", "ocupada", "especie", "numHuevos", "numPollos", "observaciones", "createdAt", "updatedAt")
          VALUES (${nestBoxId}, 1, ${fechaISO}, ${ocupacion}, ${especie}, ${numHuevos}, ${numPollos}, ${observaciones}, NOW(), NOW())
        `;
        
        inspectionCount++;

        // Guardar última inspección por caja
        if (!inspectionsByBox.has(codigoCN) || new Date(fechaISO) > new Date(inspectionsByBox.get(codigoCN).fecha)) {
          inspectionsByBox.set(codigoCN, {
            fecha: fechaISO,
            ocupacion,
            especie,
            numHuevos,
            numPollos,
          });
        }
      } catch (err) {
        console.error(`❌ Error insertando inspección para ${codigoCN}:`, err.message);
      }
    }

    console.log(`✅ ${inspectionCount} inspecciones insertadas\n`);

    // Actualizar estado de cajas nido con última inspección
    console.log('🔄 Actualizando estado de cajas nido...\n');
    let updateCount = 0;

    for (const [cajaId, inspection] of inspectionsByBox) {
      const nestBoxId = nestBoxMap.get(cajaId);
      if (!nestBoxId) continue;

      const estadoActual = inspection.ocupacion === 1 ? 'Ocupada' : 'Vacía';
      const ultimaEspecie = inspection.especie || 'Sin datos';

      try {
        await sql`
          UPDATE "nestBoxes"
          SET "estadoActual" = ${estadoActual}, "ultimaEspecie" = ${ultimaEspecie}, "updatedAt" = NOW()
          WHERE id = ${nestBoxId}
        `;
        updateCount++;
      } catch (err) {
        console.error(`❌ Error actualizando caja ${cajaId}:`, err.message);
      }
    }

    console.log(`✅ ${updateCount} cajas nido actualizadas\n`);
    console.log('🎉 ¡Importación completada exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
