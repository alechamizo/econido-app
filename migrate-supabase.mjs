import postgres from 'postgres';

const password = process.env.SUPABASE_DB_PASSWORD;
const connectionString = `postgresql://postgres.juqfiuyhddskgodgwihi:${password}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;

const sql = postgres(connectionString);

console.log("🚀 Iniciando migraciones en Supabase...\n");

try {
  // 1. Crear tabla app_users
  console.log("1️⃣ Creando tabla app_users...");
  await sql`
    CREATE TABLE IF NOT EXISTS "public"."app_users" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "openId" varchar(64) NOT NULL UNIQUE,
      "name" text,
      "email" varchar(320),
      "loginMethod" varchar(64),
      "role" varchar(50) DEFAULT 'user' NOT NULL,
      "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
      "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
      "lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  console.log("✅ Tabla app_users creada\n");

  // 2. Crear tabla multimedia
  console.log("2️⃣ Creando tabla multimedia...");
  await sql`
    CREATE TABLE IF NOT EXISTS "public"."multimedia" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "inspectionId" integer NOT NULL,
      "url" varchar(512) NOT NULL,
      "tipo" varchar(50) NOT NULL,
      "createdAt" timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  console.log("✅ Tabla multimedia creada\n");

  // 3. Renombrar nest_boxes a nestBoxes
  console.log("3️⃣ Renombrando tabla nest_boxes a nestBoxes...");
  try {
    await sql`ALTER TABLE "public"."nest_boxes" RENAME TO "nestBoxes"`;
    console.log("✅ Tabla renombrada\n");
  } catch (e) {
    if (e.message.includes('does not exist')) {
      console.log("ℹ️ Tabla nest_boxes no existe, continuando...\n");
    } else {
      throw e;
    }
  }

  // 4. Verificar estructura de nestBoxes
  console.log("4️⃣ Verificando estructura de nestBoxes...");
  const nestBoxesColumns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'nestBoxes'
    ORDER BY ordinal_position
  `;
  
  if (nestBoxesColumns.length === 0) {
    console.log("⚠️ Tabla nestBoxes no existe, creándola...");
    await sql`
      CREATE TABLE "public"."nestBoxes" (
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
  } else {
    console.log("✅ Tabla nestBoxes existe con columnas:");
    nestBoxesColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    console.log();
  }

  // 5. Verificar estructura de inspections
  console.log("5️⃣ Verificando estructura de inspections...");
  const inspectionsColumns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'inspections'
    ORDER BY ordinal_position
  `;
  
  if (inspectionsColumns.length === 0) {
    console.log("⚠️ Tabla inspections no existe, creándola...");
    await sql`
      CREATE TABLE "public"."inspections" (
        "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        "nestBoxId" integer NOT NULL,
        "userId" integer NOT NULL,
        "fecha" timestamp with time zone NOT NULL,
        "ocupada" integer NOT NULL,
        "especie" varchar(50),
        "numHuevos" integer DEFAULT 0,
        "numPollos" integer DEFAULT 0,
        "estadoConservacion" varchar(50),
        "observaciones" text,
        "multimediaUrls" json DEFAULT '[]'::json,
        "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
        "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
      )
    `;
    console.log("✅ Tabla inspections creada\n");
  } else {
    console.log("✅ Tabla inspections existe\n");
  }

  // 6. Contar registros
  console.log("📊 Conteo de registros:");
  const nestBoxesCount = await sql`SELECT COUNT(*) as count FROM "nestBoxes"`;
  console.log(`  - nestBoxes: ${nestBoxesCount[0].count}`);
  
  const inspectionsCount = await sql`SELECT COUNT(*) as count FROM "inspections"`;
  console.log(`  - inspections: ${inspectionsCount[0].count}`);
  
  const appUsersCount = await sql`SELECT COUNT(*) as count FROM "app_users"`;
  console.log(`  - app_users: ${appUsersCount[0].count}`);

  console.log("\n✅ ¡Migraciones completadas exitosamente!");

} catch (error) {
  console.error("❌ Error durante la migración:", error.message);
  console.error("Detalles:", error);
  process.exit(1);
} finally {
  await sql.end();
}
