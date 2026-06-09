import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { pgTable, integer, varchar, decimal, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { eq, desc } from "drizzle-orm";

const password = process.env.SUPABASE_DB_PASSWORD;
const connectionString = `postgresql://postgres.juqfiuyhddskgodgwihi:${password}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;

console.log("🔌 Probando consulta SELECT de Drizzle...\n");

try {
  const client = postgres(connectionString);
  const db = drizzle(client);

  // Definir el schema igual que en el servidor
  const estadoActualEnum = pgEnum("estadoActual", ["ocupada", "vacia", "desconocido"]);
  
  const nestBoxes = pgTable("nestBoxes", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    cajaId: varchar("cajaId", { length: 64 }).notNull().unique(),
    instalacion: varchar("instalacion", { length: 255 }).notNull(),
    tipoCaja: varchar("tipoCaja", { length: 100 }).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    estadoActual: estadoActualEnum("estadoActual").default("desconocido").notNull(),
    ultimaEspecie: varchar("ultimaEspecie", { length: 50 }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  });

  console.log("📊 Ejecutando db.select().from(nestBoxes)...");
  const boxes = await db.select().from(nestBoxes);
  console.log("✅ Resultado:", JSON.stringify(boxes, null, 2));

  await client.end();
  console.log("\n✅ ¡Prueba completada exitosamente!");

} catch (error) {
  console.error("❌ Error:", error.message);
  console.error("Detalles:", error);
  process.exit(1);
}
