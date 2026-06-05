import { decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Nest boxes table - stores information about installed nest boxes
 */
export const nestBoxes = mysqlTable("nestBoxes", {
  id: int("id").autoincrement().primaryKey(),
  cajaId: varchar("cajaId", { length: 64 }).notNull().unique(),
  instalacion: varchar("instalacion", { length: 255 }).notNull(),
  tipoCaja: varchar("tipoCaja", { length: 100 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  estadoActual: mysqlEnum("estadoActual", ["ocupada", "vacia", "desconocido"]).default("desconocido").notNull(),
  ultimaEspecie: varchar("ultimaEspecie", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NestBox = typeof nestBoxes.$inferSelect;
export type InsertNestBox = typeof nestBoxes.$inferInsert;

/**
 * Inspections table - stores inspection records for each nest box
 */
export const inspections = mysqlTable("inspections", {
  id: int("id").autoincrement().primaryKey(),
  nestBoxId: int("nestBoxId").notNull(),
  userId: int("userId").notNull(),
  fecha: timestamp("fecha").notNull(),
  ocupada: int("ocupada").notNull(),
  especie: varchar("especie", { length: 50 }),
  numHuevos: int("numHuevos").default(0),
  numPollos: int("numPollos").default(0),
  estadoConservacion: mysqlEnum("estadoConservacion", ["bueno", "necesita_reparacion", "caida"]),
  observaciones: text("observaciones"),
  multimediaUrls: json("multimediaUrls").$type<Array<{url: string; tipo: 'foto' | 'audio' | 'video'}>>()
    .default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;

/**
 * Multimedia table - stores references to uploaded files
 */
export const multimedia = mysqlTable("multimedia", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspectionId").notNull(),
  url: varchar("url", { length: 512 }).notNull(),
  tipo: mysqlEnum("tipo", ["foto", "audio", "video"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Multimedia = typeof multimedia.$inferSelect;
export type InsertMultimedia = typeof multimedia.$inferInsert;