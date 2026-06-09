CREATE TYPE "public"."estadoActual" AS ENUM('ocupada', 'vacia', 'desconocido');--> statement-breakpoint
CREATE TYPE "public"."estadoConservacion" AS ENUM('bueno', 'necesita_reparacion', 'caida');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."tipoMultimedia" AS ENUM('foto', 'audio', 'video');--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "inspections_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nestBoxId" integer NOT NULL,
	"userId" integer NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"ocupada" integer NOT NULL,
	"especie" varchar(50),
	"numHuevos" integer DEFAULT 0,
	"numPollos" integer DEFAULT 0,
	"estadoConservacion" "estadoConservacion",
	"observaciones" text,
	"multimediaUrls" json DEFAULT '[]'::json,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "multimedia" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "multimedia_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"inspectionId" integer NOT NULL,
	"url" varchar(512) NOT NULL,
	"tipo" "tipoMultimedia" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nestBoxes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "nestBoxes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"cajaId" varchar(64) NOT NULL,
	"instalacion" varchar(255) NOT NULL,
	"tipoCaja" varchar(100) NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"estadoActual" "estadoActual" DEFAULT 'desconocido' NOT NULL,
	"ultimaEspecie" varchar(50),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nestBoxes_cajaId_unique" UNIQUE("cajaId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
