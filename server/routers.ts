import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getNestBoxes,
  getNestBoxById,
  createNestBox,
  updateNestBox,
  deleteNestBox,
  getInspections,
  getInspectionById,
  createInspection,
  updateInspection,
  deleteInspection,
} from "./db";
import { utmToLatLon, isValidLatLon } from "./utm-converter";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  nestBox: router({
    list: publicProcedure.query(() => getNestBoxes()),
    
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getNestBoxById(input)),
    
    create: protectedProcedure
      .input(
        z.object({
          cajaId: z.string(),
          instalacion: z.string(),
          tipoCaja: z.string(),
          latitude: z.string(),
          longitude: z.string(),
        })
      )
      .mutation(({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return createNestBox({
          cajaId: input.cajaId,
          instalacion: input.instalacion,
          tipoCaja: input.tipoCaja,
          latitude: input.latitude as any,
          longitude: input.longitude as any,
        });
      }),
    
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            instalacion: z.string().optional(),
            tipoCaja: z.string().optional(),
            estadoActual: z.enum(["ocupada", "vacia", "desconocido"]).optional(),
            ultimaEspecie: z.string().optional(),
          }),
        })
      )
      .mutation(({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return updateNestBox(input.id, input.data);
      }),
    
    delete: protectedProcedure
      .input(z.number())
      .mutation(({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return deleteNestBox(input);
      }),
    
    importFromGeoJSON: protectedProcedure
      .input(
        z.object({
          nestBoxes: z.array(
            z.object({
              cajaId: z.string(),
              instalacion: z.string(),
              tipoCaja: z.string(),
              latitude: z.number(),
              longitude: z.number(),
              isUTM: z.boolean().optional().default(false),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const box of input.nestBoxes) {
          try {
            let latitude = box.latitude;
            let longitude = box.longitude;

            // Convertir UTM a lat/lon si es necesario
            if (box.isUTM) {
              const converted = utmToLatLon(longitude, latitude);
              latitude = converted.latitude;
              longitude = converted.longitude;
            }

            // Validar que las coordenadas estén en rango válido
            if (!isValidLatLon(latitude, longitude)) {
              throw new Error(`Coordenadas inválidas: lat=${latitude}, lon=${longitude}`);
            }

            await createNestBox({
              cajaId: box.cajaId,
              instalacion: box.instalacion,
              tipoCaja: box.tipoCaja,
              latitude: latitude.toString(),
              longitude: longitude.toString(),
            });
            success++;
          } catch (error: any) {
            failed++;
            errors.push(`${box.cajaId}: ${error.message}`);
          }
        }

        return { success, failed, errors };
      }),
  }),

  inspection: router({
    list: publicProcedure
      .input(z.object({ nestBoxId: z.number().optional() }).optional())
      .query(({ input }) => {
        return getInspections(input?.nestBoxId);
      }),
    
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getInspectionById(input)),
    
    create: protectedProcedure
      .input(
        z.object({
          nestBoxId: z.number(),
          fecha: z.date(),
          ocupada: z.number(),
          especie: z.string().optional(),
          numHuevos: z.number().optional(),
          numPollos: z.number().optional(),
          estadoConservacion: z.enum(["bueno", "necesita_reparacion", "caida"]).optional(),
          observaciones: z.string().optional(),
          multimediaUrls: z.array(z.object({
            url: z.string(),
            tipo: z.enum(["foto", "video", "audio"])
          })).optional(),
        })
      )
      .mutation(({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        return createInspection({
          ...input,
          userId: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            ocupada: z.number().optional(),
            especie: z.string().optional(),
            numHuevos: z.number().optional(),
            numPollos: z.number().optional(),
            estadoConservacion: z.enum(["bueno", "necesita_reparacion", "caida"]).optional(),
            observaciones: z.string().optional(),
          }),
        })
      )
      .mutation(({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return updateInspection(input.id, input.data);
      }),
    
    delete: protectedProcedure
      .input(z.number())
      .mutation(({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return deleteInspection(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;

