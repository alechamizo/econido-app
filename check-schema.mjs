import postgres from 'postgres';

const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const DATABASE_URL = `postgresql://postgres.juqfiuyhddskgodgwihi:${SUPABASE_DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;

const sql = postgres(DATABASE_URL);

async function main() {
  try {
    console.log('📊 Estructura de tabla inspections:\n');
    const result = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'inspections'
      ORDER BY ordinal_position
    `;
    
    for (const col of result) {
      console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

main();
