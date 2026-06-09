import postgres from 'postgres';

const password = process.env.SUPABASE_DB_PASSWORD;
const connectionString = `postgresql://postgres.juqfiuyhddskgodgwihi:${password}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;

const sql = postgres(connectionString);

console.log("🔧 Reparando tabla nestBoxes...\n");

try {
  // 1. Renombrar la tabla antigua
  console.log("1️⃣ Renombrando tabla antigua...");
  try {
    await sql`ALTER TABLE "public"."nestBoxes" RENAME TO "nestBoxes_old"`;
    console.log("✅ Tabla renombrada a nestBoxes_old\n");
  } catch (e) {
    console.log("ℹ️ No se pudo renombrar (puede que no exista), continuando...\n");
  }

  // 2. Crear tabla nestBoxes con estructura correcta
  console.log("2️⃣ Creando tabla nestBoxes con estructura correcta...");
  await sql`
    CREATE TABLE IF NOT EXISTS "public"."nestBoxes" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "cajaId" varchar(64) NOT NULL UNIQUE,
      "instalacion" varchar(255) NOT NULL,
      "tipoCaja" varchar(100) NOT NULL,
      "latitude" numeric(10, 8) NOT NULL,
      "longitude" numeric(11, 8) NOT NULL,
      "estadoActual" varchar(50) DEFAULT 'desconocido' NOT NULL,
      "ultimaEspecie" varchar(50),
      "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
      "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  console.log("✅ Tabla nestBoxes creada\n");

  // 3. Verificar estructura
  console.log("3️⃣ Verificando estructura...");
  const columns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'nestBoxes'
    ORDER BY ordinal_position
  `;
  
  console.log("Columnas en nestBoxes:");
  columns.forEach(col => {
    console.log(`  ✓ ${col.column_name}: ${col.data_type}`);
  });

  // 4. Insertar datos de prueba
  console.log("\n4️⃣ Insertando datos de prueba...");
  await sql`
    INSERT INTO "public"."nestBoxes" ("cajaId", "instalacion", "tipoCaja", "latitude", "longitude", "estadoActual")
    VALUES 
      ('Ext IB12-1', 'PSF EXT I', 'Estándar', 38.87391, -6.97218, 'ocupada'),
      ('Ext IB12-2', 'PSF EXT I', 'Estándar', 38.87401, -6.97228, 'vacia'),
      ('Ext IB21-1', 'PSF EXT II', 'Estándar', 38.88391, -6.96218, 'desconocido')
    ON CONFLICT ("cajaId") DO NOTHING
  `;
  console.log("✅ Datos insertados\n");

  // 5. Contar registros
  console.log("5️⃣ Conteo final:");
  const count = await sql`SELECT COUNT(*) as count FROM "nestBoxes"`;
  console.log(`  - nestBoxes: ${count[0].count} registros`);

  console.log("\n✅ ¡Tabla reparada exitosamente!");

} catch (error) {
  console.error("❌ Error:", error.message);
  console.error("Detalles:", error);
  process.exit(1);
} finally {
  await sql.end();
}
