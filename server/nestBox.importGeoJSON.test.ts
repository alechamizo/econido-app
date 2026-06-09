import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin",
    email: "admin@test.com",
    name: "Test Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "test-user",
    email: "user@test.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("nestBox.importFromGeoJSON", () => {
  it("should import valid GeoJSON features as admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.nestBox.importFromGeoJSON({
      nestBoxes: [
        {
          cajaId: "Test-Import-001",
          instalacion: "Test Installation",
          tipoCaja: "Test Type",
          latitude: "38.87391",
          longitude: "-6.97218",
        },
        {
          cajaId: "Test-Import-002",
          instalacion: "Test Installation 2",
          tipoCaja: "Test Type 2",
          latitude: "38.88391",
          longitude: "-6.96218",
        },
      ],
    });

    expect(result.success).toBeGreaterThan(0);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject unauthorized users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.nestBox.importFromGeoJSON({
        nestBoxes: [
          {
            cajaId: "Unauthorized-Test",
            instalacion: "Test",
            tipoCaja: "Test",
            latitude: "38.87391",
            longitude: "-6.97218",
          },
        ],
      });
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });
});
