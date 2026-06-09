import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

const password = process.env.SUPABASE_DB_PASSWORD;
const connectionString = `postgresql://postgres.juqfiuyhddskgodgwihi:${password}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;

console.log("🔌 Conectando a Supabase con Drizzle...\n");

try {
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("✅ Drizzle conectado\n");

  // Intentar una consulta simple
  console.log("📊 Ejecutando consulta SELECT 1...");
  const result = await db.execute(sql`SELECT 1 as test`);
  console.log("✅ Resultado:", result);

  // Intentar consultar la tabla nestBoxes directamente
  console.log("\n📊 Consultando tabla nestBoxes...");
  const nestBoxesResult = await db.execute(
    sql`SELECT id, "cajaId", "instalacion" FROM "nestBoxes" LIMIT 3`
  );
  console.log("✅ Resultado:", nestBoxesResult);

  await client.end();
  console.log("\n✅ ¡Prueba completada exitosamente!");

} catch (error) {
  console.error("❌ Error:", error.message);
  console.error("Detalles:", error);
  process.exit(1);
}
