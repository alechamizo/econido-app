import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const DATABASE_URL = `postgresql://postgres.juqfiuyhddskgodgwihi:${SUPABASE_DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;

const client = postgres(DATABASE_URL);

// Parsear el archivo TSV
function parseInspections(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  
  // Saltar header
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
    console.log('📥 Leyendo inspecciones...\n');
    
    const inspections = parseInspections('/home/ubuntu/upload/pasted_content_3.txt');
    console.log(`✅ ${inspections.length} inspecciones leídas\n`);
    
    // Agrupar por código de caja y encontrar la última inspección
    const latestByCode = {};
    inspections.forEach(insp => {
      const code = insp.codigoCN.trim();
      if (!code) return;
      
      if (!latestByCode[code] || new Date(insp.fecha) > new Date(latestByCode[code].fecha)) {
        latestByCode[code] = insp;
      }
    });
    
    console.log(`📊 ${Object.keys(latestByCode).length} códigos únicos encontrados\n`);
    
    // Actualizar cajas nido en Supabase
    let updated = 0;
    let notFound = 0;
    
    for (const [code, inspection] of Object.entries(latestByCode)) {
      try {
        // Buscar la caja por cajaId (que es el código)
        const result = await client`
          UPDATE "nestBoxes"
          SET 
            "estadoActual" = ${inspection.ocupacion === 'Ocupada' ? 'ocupada' : 'vacia'},
            "ultimaEspecie" = ${inspection.especie || 'desconocida'},
            "updatedAt" = NOW()
          WHERE "cajaId" = ${code}
          RETURNING id, "cajaId", "estadoActual", "ultimaEspecie"
        `;
        
        if (result.length > 0) {
          updated++;
          console.log(`✅ ${code}: ${inspection.ocupacion} - ${inspection.especie || 'N/A'}`);
        } else {
          notFound++;
          console.log(`⚠️  ${code}: No encontrada en BD`);
        }
      } catch (error) {
        console.error(`❌ Error actualizando ${code}:`, error.message);
      }
    }
    
    console.log(`\n📈 Resumen:`);
    console.log(`  - Cajas actualizadas: ${updated}`);
    console.log(`  - Cajas no encontradas: ${notFound}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
