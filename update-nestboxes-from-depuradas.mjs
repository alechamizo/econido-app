import postgres from 'postgres';

const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const DATABASE_URL = `postgresql://postgres.juqfiuyhddskgodgwihi:${SUPABASE_DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;

const client = postgres(DATABASE_URL);

// Función para convertir UUID v5 basado en el ID de la caja
function idToUUID(id) {
  const baseUUID = '00000000-0000-5000-8000-';
  const hex = String(id).padStart(12, '0');
  return baseUUID + hex;
}

async function main() {
  try {
    console.log('📊 Actualizando estado de cajas desde inspecciones...\n');
    
    // Obtener todas las cajas
    const boxes = await client`SELECT id, "cajaId" FROM "nestBoxes"`;
    console.log(`📦 ${boxes.length} cajas encontradas\n`);
    
    let updated = 0;
    
    for (const box of boxes) {
      try {
        // Obtener la última inspección de esta caja
        const lastInspection = await client`
          SELECT ocupada, especie 
          FROM inspections 
          WHERE nestboxid = ${idToUUID(box.id)}
          ORDER BY fecha DESC 
          LIMIT 1
        `;
        
        if (lastInspection.length > 0) {
          const insp = lastInspection[0];
          const estado = insp.ocupada ? 'ocupada' : 'vacia';
          const especie = insp.especie || 'desconocida';
          
          // Actualizar la caja
          await client`
            UPDATE "nestBoxes"
            SET 
              "estadoActual" = ${estado},
              "ultimaEspecie" = ${especie},
              "updatedAt" = NOW()
            WHERE id = ${box.id}
          `;
          
          updated++;
          console.log(`✅ ${box.cajaId}: ${estado} - ${especie}`);
        } else {
          console.log(`⚠️  ${box.cajaId}: Sin inspecciones`);
        }
      } catch (error) {
        console.error(`❌ Error actualizando ${box.cajaId}:`, error.message);
      }
    }
    
    console.log(`\n📈 Resumen:`);
    console.log(`  - Cajas actualizadas: ${updated}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
