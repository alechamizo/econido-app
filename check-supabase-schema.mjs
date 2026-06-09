import postgres from 'postgres';

const password = process.env.SUPABASE_DB_PASSWORD;
const connectionString = `postgresql://postgres.juqfiuyhddskgodgwihi:${password}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;

const sql = postgres(connectionString);

console.log("📋 Verificando estructura de tablas en Supabase...\n");

// Verificar tabla nest_boxes
console.log("=== Tabla: nest_boxes ===");
try {
  const nestBoxesSchema = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'nest_boxes'
    ORDER BY ordinal_position
  `;
  console.log(nestBoxesSchema);
} catch (e) {
  console.log("❌ Tabla nest_boxes no encontrada o error:", e.message);
}

console.log("\n=== Tabla: nestboxes ===");
try {
  const nestboxesSchema = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'nestboxes'
    ORDER BY ordinal_position
  `;
  console.log(nestboxesSchema);
} catch (e) {
  console.log("❌ Tabla nestboxes no encontrada o error:", e.message);
}

console.log("\n=== Tabla: inspections ===");
try {
  const inspectionsSchema = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'inspections'
    ORDER BY ordinal_position
  `;
  console.log(inspectionsSchema);
} catch (e) {
  console.log("❌ Tabla inspections no encontrada o error:", e.message);
}

console.log("\n=== Tabla: users ===");
try {
  const usersSchema = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position
  `;
  console.log(usersSchema);
} catch (e) {
  console.log("❌ Tabla users no encontrada o error:", e.message);
}

// Contar registros
console.log("\n=== Conteo de registros ===");
try {
  const nestBoxesCount = await sql`SELECT COUNT(*) as count FROM "nest_boxes"`;
  console.log(`nest_boxes: ${nestBoxesCount[0].count} registros`);
} catch (e) {
  console.log("nest_boxes: error -", e.message);
}

try {
  const inspectionsCount = await sql`SELECT COUNT(*) as count FROM "inspections"`;
  console.log(`inspections: ${inspectionsCount[0].count} registros`);
} catch (e) {
  console.log("inspections: error -", e.message);
}

await sql.end();
