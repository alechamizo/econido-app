import postgres from 'postgres';

const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const DATABASE_URL = `postgresql://postgres.juqfiuyhddskgodgwihi:${SUPABASE_DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;

const client = postgres(DATABASE_URL);

async function main() {
  try {
    const boxes = await client`SELECT "cajaId" FROM "nestBoxes" ORDER BY "cajaId"`;
    console.log('Códigos en BD:', boxes.map(b => b.cajaId).join(', '));
    
    const inspections = await client`SELECT DISTINCT "codigoCN" FROM inspections ORDER BY "codigoCN"`;
    console.log('Códigos en inspecciones:', inspections.map(i => i.codigoCN).join(', '));
  } finally {
    await client.end();
  }
}

main();
