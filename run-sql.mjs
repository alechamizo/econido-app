import postgres from 'postgres';
import fs from 'fs';

const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const DATABASE_URL = `postgresql://postgres.juqfiuyhddskgodgwihi:${SUPABASE_DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;

const sql = postgres(DATABASE_URL);

async function main() {
  try {
    const sqlContent = fs.readFileSync('/tmp/create-all-tables.sql', 'utf-8');
    const statements = sqlContent.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (!statement.trim()) continue;
      try {
        console.log(`Ejecutando: ${statement.substring(0, 50)}...`);
        await sql.unsafe(statement);
        console.log('✅ OK');
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('⚠️  Ya existe');
        } else {
          console.error('❌ Error:', err.message);
        }
      }
    }

    console.log('\n🎉 Tablas creadas exitosamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

main();
