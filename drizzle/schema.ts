import { decimal, integer, json, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */

// Enums for PostgreSQL
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const estadoActualEnum = pgEnum("estadoActual", ["ocupada", "vacia", "desconocido"]);
export const estadoConservacionEnum = pgEnum("estadoConservacion", ["bueno", "necesita_reparacion", "caida"]);
export const tipoMultimediaEnum = pgEnum("tipoMultimedia", ["foto", "audio", "video"]);

export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Nest boxes table - stores information about installed nest boxes
 */
export const nestBoxes = pgTable("nestBoxes", {
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

export type NestBox = typeof nestBoxes.$inferSelect;
export type InsertNestBox = typeof nestBoxes.$inferInsert;

/**
 * Inspections table - stores inspection records for each nest box
 */
export const inspections = pgTable("inspections", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nestBoxId: integer("nestBoxId").notNull(),
  userId: integer("userId").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  ocupada: integer("ocupada").notNull(),
  especie: varchar("especie", { length: 50 }),
  numHuevos: integer("numHuevos").default(0),
  numPollos: integer("numPollos").default(0),
  estadoConservacion: estadoConservacionEnum("estadoConservacion"),
  observaciones: text("observaciones"),
  multimediaUrls: json("multimediaUrls").$type<Array<{url: string; tipo: 'foto' | 'audio' | 'video'}>>()
    .default([]),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;

/**
 * Multimedia table - stores references to uploaded files
 */
export const multimedia = pgTable("multimedia", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  inspectionId: integer("inspectionId").notNull(),
  url: varchar("url", { length: 512 }).notNull(),
  tipo: tipoMultimediaEnum("tipo").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Multimedia = typeof multimedia.$inferSelect;
export type InsertMultimedia = typeof multimedia.$inferInsert;
