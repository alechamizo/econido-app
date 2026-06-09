import { describe, it, expect } from "vitest";
import postgres from "postgres";

describe("Supabase Connection", () => {
  it("should connect to Supabase PostgreSQL database", async () => {
    // Construir la URL de conexión usando las variables de entorno
    const password = process.env.SUPABASE_DB_PASSWORD;
    const user = "postgres.juqfiuyhddskgodgwihi";
    const host = "aws-0-eu-west-1.pooler.supabase.com";
    const port = 6543;
    const database = "postgres";

    if (!password) {
      throw new Error("SUPABASE_DB_PASSWORD is not set");
    }

    const connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;

    try {
      const sql = postgres(connectionString);
      
      // Ejecutar una consulta simple para validar la conexión
      const result = await sql`SELECT 1 as test`;
      
      expect(result).toBeDefined();
      expect(result[0]?.test).toBe(1);
      
      // Cerrar la conexión
      await sql.end();
    } catch (error: any) {
      throw new Error(`Failed to connect to Supabase: ${error.message}`);
    }
  });

  it("should be able to query the nestBoxes table", async () => {
    const password = process.env.SUPABASE_DB_PASSWORD;
    const user = "postgres.juqfiuyhddskgodgwihi";
    const host = "aws-0-eu-west-1.pooler.supabase.com";
    const port = 6543;
    const database = "postgres";

    if (!password) {
      throw new Error("SUPABASE_DB_PASSWORD is not set");
    }

    const connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;

    try {
      const sql = postgres(connectionString);
      
      // Intentar consultar la tabla nestBoxes
      const result = await sql`
        SELECT COUNT(*) as count FROM "nestBoxes"
      `;
      
      expect(result).toBeDefined();
      expect(result[0]?.count).toBeDefined();
      
      // Cerrar la conexión
      await sql.end();
    } catch (error: any) {
      throw new Error(`Failed to query nestBoxes table: ${error.message}`);
    }
  });
});
