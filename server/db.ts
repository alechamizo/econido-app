import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, nestBoxes, InsertNestBox, inspections, InsertInspection } from "../drizzle/schema";
import { ENV } from './_core/env';
import { eq, desc, sql } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;
export let _client: ReturnType<typeof postgres> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    try {
      // Construir DATABASE_URL de Supabase si está disponible
      let connectionString = process.env.DATABASE_URL;
      const hasPassword = !!process.env.SUPABASE_DB_PASSWORD;
      const isNotSupabase = !connectionString?.includes('supabase');
      
      console.log("[Database] Inicializando...");
      console.log("[Database] DATABASE_URL:", connectionString ? connectionString.substring(0, 50) + '...' : 'undefined');
      console.log("[Database] SUPABASE_DB_PASSWORD:", hasPassword ? 'configurada' : 'no configurada');
      console.log("[Database] isNotSupabase:", isNotSupabase);
      
      if (hasPassword && isNotSupabase) {
        // Usar Supabase en lugar de TiDB
        const password = process.env.SUPABASE_DB_PASSWORD;
        const user = "postgres.juqfiuyhddskgodgwihi";
        const host = "aws-0-eu-west-1.pooler.supabase.com";
        const port = 6543;
        const database = "postgres";
        connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;
        console.log("[Database] Usando Supabase PostgreSQL");
      } else {
        console.log("[Database] Usando DATABASE_URL original (MySQL)");
      }
      
      if (connectionString) {
        console.log("[Database] Conectando a:", connectionString.substring(0, 50) + '...');
        _client = postgres(connectionString);
        _db = drizzle(_client);
        console.log("[Database] Conectado exitosamente");
      } else {
        console.warn("[Database] No DATABASE_URL configurada");
      }
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _client = null;
    }
  }
  return _db;
}

/**
 * User Queries
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Try to get existing user
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.openId, user.openId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing user
    await db
      .update(users)
      .set({
        name: user.name,
        email: user.email,
        loginMethod: user.loginMethod,
        lastSignedIn: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.openId, user.openId));
  } else {
    // Insert new user
    await db.insert(users).values(user);
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * NestBox Queries
 */
export async function getNestBoxes() {
  try {
    // Usar SQL directo para Supabase
    const client = _client;
    if (!client) {
      console.warn('[NestBoxes] No client available');
      return [];
    }
    
    console.log('[NestBoxes] Consultando cajas...');
    const boxes = await client`SELECT * FROM "nestBoxes"`;
    console.log('[NestBoxes] Cajas encontradas:', boxes.length);
    
    // Retornar cajas sin enriquecimiento por ahora
    return boxes.map((box: any) => ({
      ...box,
      inspections: [],
    }));
  } catch (err: any) {
    console.error('[NestBoxes] Error:', err.message, err.stack);
    return [];
  }
}

export async function getNestBoxById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(nestBoxes).where(eq(nestBoxes.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getNestBoxByCajaId(cajaId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(nestBoxes).where(eq(nestBoxes.cajaId, cajaId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createNestBox(data: InsertNestBox) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(nestBoxes).values(data);
}

export async function updateNestBox(id: number, data: Partial<InsertNestBox>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(nestBoxes).set(data).where(eq(nestBoxes.id, id));
}

export async function deleteNestBox(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(nestBoxes).where(eq(nestBoxes.id, id));
}

/**
 * Inspection Queries
 */
export async function getInspections(nestBoxId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  let inspectionRows: any[] = [];
  
  try {
    // Usar SQL directo para Supabase
    const client = _client;
    if (!client) return [];
    
    if (nestBoxId) {
      // Buscar inspecciones por nestboxid (UUID)
      inspectionRows = await client`
        SELECT * FROM "inspections" 
        WHERE "nestboxid"::text LIKE ${'%' + nestBoxId.toString().padStart(8, '0') + '%'}
        ORDER BY "fecha" DESC
      `;
    } else {
      inspectionRows = await client`SELECT * FROM "inspections" ORDER BY "fecha" DESC`;
    }
  } catch (err: any) {
    console.error('[Inspections] Error:', err.message);
    return [];
  }
  
  // Enriquecer cada inspeccion con datos de la caja nido
  const enrichedInspections = await Promise.all(
    inspectionRows.map(async (inspection: any) => {
      let nestBox = null;
      if (inspection.nestboxid) {
        // Buscar por UUID en Supabase
        const client = _client;
        if (client) {
          try {
            const result = await client`SELECT * FROM "nestBoxes" WHERE id::text LIKE ${'%' + inspection.nestboxid.toString().substring(0, 8) + '%'} LIMIT 1`;
            nestBox = result.length > 0 ? result[0] : null;
          } catch (err) {
            // Ignorar errores de búsqueda
          }
        }
      }
      
      return {
        ...inspection,
        nestBox,
      };
    })
  );
  
  return enrichedInspections;
}

export async function getInspectionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inspections).where(eq(inspections.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createInspection(data: InsertInspection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(inspections).values(data);
}

export async function updateInspection(id: number, data: Partial<InsertInspection>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(inspections).set(data).where(eq(inspections.id, id));
}

export async function deleteInspection(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(inspections).where(eq(inspections.id, id));
}
