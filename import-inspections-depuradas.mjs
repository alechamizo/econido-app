import postgres from 'postgres';
import fs from 'fs';

const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const DATABASE_URL = `postgresql://postgres.juqfiuyhddskgodgwihi:${SUPABASE_DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;

const client = postgres(DATABASE_URL);

// Función para convertir UUID v5 basado en el ID de la caja
function idToUUID(id) {
  const baseUUID = '00000000-0000-5000-8000-';
  const hex = String(id).padStart(12, '0');
  return baseUUID + hex;
}

// Parsear el archivo TSV
function parseInspections(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  
  const inspections = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split('\t');
    if (parts.length < 9) continue;
    
    inspections.push({
      fecha: parts[0],
      mes: parts[1],
      ocupacion: parts[2],
      psf: parts[3],
      sector: parts[4],
      codigoCN: parts[5],
      especie: parts[6],
      numHuevos: parseFloat(parts[7]) || 0,
      numPollos: parseFloat(parts[8]) || 0,
      observaciones: parts[9] || ''
    });
  }
  
  return inspections;
}

async function main() {
  try {
    console.log('📥 Leyendo inspecciones depuradas...\n');
    
    const inspections = parseInspections('/home/ubuntu/upload/pasted_content_4.txt');
    console.log(`✅ ${inspections.length} inspecciones leídas\n`);
    
    // Obtener todas las cajas para mapear código a ID
    const boxes = await client`SELECT id, "cajaId" FROM "nestBoxes"`;
    const boxMap = new Map(boxes.map(b => [b.cajaId, b.id]));
    
    console.log(`📊 ${boxes.length} cajas encontradas\n`);
    
    // Limpiar inspecciones antiguas
    try {
      await client`DELETE FROM inspections`;
      console.log('🗑️  Inspecciones antiguas eliminadas\n');
    } catch (err) {
      console.log('⚠️  No se pudieron limpiar inspecciones antiguas (puede estar vacía)\n');
    }
    
    // Insertar nuevas inspecciones
    let inserted = 0;
    let skipped = 0;
    
    for (const insp of inspections) {
      const codigoCN = insp.codigoCN.trim();
      const nestBoxId = boxMap.get(codigoCN);
      
      if (!nestBoxId) {
        skipped++;
        console.log(`⚠️  ${codigoCN}: No encontrada`);
        continue;
      }
      
      try {
        // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD
        const [day, month, year] = insp.fecha.split('/');
        const fechaISO = `${year}-${month}-${day}`;
        
        await client`
          INSERT INTO inspections (
            nestboxid, 
            fecha, 
            ocupada, 
            especie, 
            num_huevos, 
            num_pollos, 
            observaciones,
            status,
            created_at
          ) VALUES (
            ${idToUUID(nestBoxId)},
            ${fechaISO},
            ${insp.ocupacion === 'Ocupada'},
            ${insp.especie || null},
            ${insp.numHuevos},
            ${insp.numPollos},
            ${insp.observaciones},
            'completada',
            NOW()
          )
        `;
        
        inserted++;
        console.log(`✅ ${codigoCN}: ${insp.ocupacion} - ${insp.especie || 'N/A'}`);
      } catch (error) {
        console.error(`❌ Error insertando ${codigoCN}:`, error.message);
      }
    }
    
    console.log(`\n📈 Resumen:`);
    console.log(`  - Inspecciones insertadas: ${inserted}`);
    console.log(`  - Inspecciones omitidas: ${skipped}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
