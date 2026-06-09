import postgres from 'postgres';

const password = process.env.SUPABASE_DB_PASSWORD;
const connectionString = `postgresql://postgres.juqfiuyhddskgodgwihi:${password}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;

const sql = postgres(connectionString);

console.log("🔍 Debuggeando cajas nido...\n");

try {
  // 1. Verificar tablas disponibles
  console.log("1️⃣ Tablas disponibles:");
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  tables.forEach(t => console.log(`  - ${t.table_name}`));

  // 2. Verificar estructura de nestBoxes
  console.log("\n2️⃣ Estructura de nestBoxes:");
  const columns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'nestBoxes'
    ORDER BY ordinal_position
  `;
  columns.forEach(col => {
    console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
  });

  // 3. Contar registros
  console.log("\n3️⃣ Registros en nestBoxes:");
  const count = await sql`SELECT COUNT(*) as count FROM "nestBoxes"`;
  console.log(`  Total: ${count[0].count}`);

  // 4. Mostrar todos los registros
  console.log("\n4️⃣ Contenido de nestBoxes:");
  const records = await sql`SELECT * FROM "nestBoxes"`;
  console.log(JSON.stringify(records, null, 2));

  // 5. Verificar si hay errores en la tabla
  console.log("\n5️⃣ Verificando integridad...");
  const integrity = await sql`
    SELECT 
      COUNT(*) as total_rows,
      COUNT(DISTINCT "cajaId") as unique_cajas,
      COUNT(DISTINCT "id") as unique_ids
    FROM "nestBoxes"
  `;
  console.log(JSON.stringify(integrity[0], null, 2));

} catch (error) {
  console.error("❌ Error:", error.message);
  console.error("Detalles:", error);
} finally {
  await sql.end();
}
