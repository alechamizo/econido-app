
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, nestBoxes, InsertNestBox, inspections, InsertInspection } from "../drizzle/schema";
import { ENV } from './_core/env';
import { eq, desc } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Nest Box Queries
 */
export async function getNestBoxes() {
  const db = await getDb();
  if (!db) return [];
  
  // Obtener todas las cajas nido
  const boxes = await db.select().from(nestBoxes);
  
  // Para cada caja, obtener la última inspección
  const boxesWithInspections = await Promise.all(
    boxes.map(async (box) => {
      const lastInspection = await db
        .select()
        .from(inspections)
        .where(eq(inspections.nestBoxId, box.id))
        .orderBy(desc(inspections.fecha))
        .limit(1);
      
      return {
        ...box,
        inspections: lastInspection,
      };
    })
  );
  
  return boxesWithInspections;
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
  const result = await db.insert(nestBoxes).values(data);
  return result;
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
  if (nestBoxId) {
    return db.select().from(inspections).where(eq(inspections.nestBoxId, nestBoxId));
  }
  return db.select().from(inspections);
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
