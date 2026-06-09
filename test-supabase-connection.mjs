import postgres from 'postgres';

const password = process.env.SUPABASE_DB_PASSWORD;
const user = "postgres.juqfiuyhddskgodgwihi";
const host = "aws-0-eu-west-1.pooler.supabase.com";
const port = 6543;
const database = "postgres";

if (!password) {
  console.error("❌ SUPABASE_DB_PASSWORD is not set");
  process.exit(1);
}

const connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;

console.log("🔌 Intentando conectar a Supabase...");
console.log(`Host: ${host}:${port}`);
console.log(`Database: ${database}`);
console.log(`User: ${user}`);

try {
  const sql = postgres(connectionString, {
    connect_timeout: 10,
    idle_timeout: 30,
  });

  console.log("⏳ Esperando conexión...");
  
  // Ejecutar una consulta simple
  const result = await sql`SELECT 1 as test`;
  
  console.log("✅ Conexión exitosa!");
  console.log("Resultado:", result);

  // Intentar consultar las tablas
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `;
  
  console.log("📊 Tablas en la base de datos:");
  tables.forEach(t => console.log(`  - ${t.table_name}`));

  await sql.end();
  process.exit(0);
} catch (error) {
  console.error("❌ Error de conexión:", error.message);
  console.error("Código:", error.code);
  console.error("Detalles:", error);
  process.exit(1);
}
