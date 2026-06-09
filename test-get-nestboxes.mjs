import postgres from 'postgres';

const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const DATABASE_URL = `postgresql://postgres.juqfiuyhddskgodgwihi:${SUPABASE_DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;

const client = postgres(DATABASE_URL);

async function main() {
  try {
    console.log('📥 Probando getNestBoxes...\n');
    
    const boxes = await client`SELECT * FROM "nestBoxes"`;
    console.log(`✅ ${boxes.length} cajas encontradas`);
    console.log('Primeras 3 cajas:');
    boxes.slice(0, 3).forEach(box => {
      console.log(`  - ${box.cajaId}: ${box.estadoActual}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
