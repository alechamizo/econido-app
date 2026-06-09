import postgres from 'postgres';

const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const DATABASE_URL = `postgresql://postgres.juqfiuyhddskgodgwihi:${SUPABASE_DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;

const sql = postgres(DATABASE_URL);

async function main() {
  try {
    console.log('📊 Estructura de tabla nestBoxes:\n');
    const result = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'nestboxes' OR table_name = 'nestBoxes'
      ORDER BY ordinal_position
    `;
    
    if (result.length === 0) {
      console.log('No se encontró tabla nestBoxes');
      return;
    }
    
    for (const col of result) {
      console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    }
    
    console.log('\n📊 Datos en nestBoxes:\n');
    const data = await sql`SELECT * FROM "nestBoxes" LIMIT 3`;
    console.log(data);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

main();
