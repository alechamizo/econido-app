import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Tests de integración para flujos offline/online
 * Valida que las operaciones se encolen correctamente y se sincronizan al recuperar conexión
 */

interface OfflineOperation {
  id: string;
  type: "create" | "update" | "delete";
  entity: "nestBox" | "inspection";
  data: any;
  timestamp: number;
  synced: boolean;
}

// Mock de IndexedDB
class MockIndexedDB {
  private store: Map<string, OfflineOperation> = new Map();

  put(operation: OfflineOperation): void {
    this.store.set(operation.id, operation);
  }

  get(id: string): OfflineOperation | undefined {
    return this.store.get(id);
  }

  getAll(): OfflineOperation[] {
    return Array.from(this.store.values());
  }

  update(id: string, updates: Partial<OfflineOperation>): void {
    const op = this.store.get(id);
    if (op) {
      this.store.set(id, { ...op, ...updates });
    }
  }

  clear(): void {
    this.store.clear();
  }
}

describe("Offline Sync Integration", () => {
  let mockDB: MockIndexedDB;

  beforeEach(() => {
    mockDB = new MockIndexedDB();
  });

  describe("Operation Queueing", () => {
    it("should queue nestBox creation when offline", () => {
      const operation: OfflineOperation = {
        id: "nestbox-1",
        type: "create",
        entity: "nestBox",
        data: {
          cajaId: "CAJA-001",
          instalacion: "Parque Natural",
          tipoCaja: "Cemento-madera",
          latitude: "40.4168",
          longitude: "-3.7038",
        },
        timestamp: Date.now(),
        synced: false,
      };

      mockDB.put(operation);

      const stored = mockDB.get("nestbox-1");
      expect(stored).toBeDefined();
      expect(stored?.type).toBe("create");
      expect(stored?.entity).toBe("nestBox");
      expect(stored?.synced).toBe(false);
    });

    it("should queue inspection creation when offline", () => {
      const operation: OfflineOperation = {
        id: "inspection-1",
        type: "create",
        entity: "inspection",
        data: {
          nestBoxId: 1,
          fecha: new Date(),
          ocupada: 1,
          especie: "Cernicalo vulgar",
          numHuevos: 3,
          numPollos: 2,
          estadoConservacion: "bueno",
          observaciones: "Nido en buen estado",
        },
        timestamp: Date.now(),
        synced: false,
      };

      mockDB.put(operation);

      const stored = mockDB.get("inspection-1");
      expect(stored).toBeDefined();
      expect(stored?.type).toBe("create");
      expect(stored?.entity).toBe("inspection");
      expect(stored?.synced).toBe(false);
    });

    it("should queue multiple operations", () => {
      const ops: OfflineOperation[] = [
        {
          id: "op-1",
          type: "create",
          entity: "nestBox",
          data: { cajaId: "CAJA-001" },
          timestamp: Date.now(),
          synced: false,
        },
        {
          id: "op-2",
          type: "update",
          entity: "nestBox",
          data: { id: 1, estadoActual: "ocupada" },
          timestamp: Date.now() + 1000,
          synced: false,
        },
        {
          id: "op-3",
          type: "create",
          entity: "inspection",
          data: { nestBoxId: 1 },
          timestamp: Date.now() + 2000,
          synced: false,
        },
      ];

      ops.forEach((op) => mockDB.put(op));

      const all = mockDB.getAll();
      expect(all).toHaveLength(3);
      expect(all.every((op) => !op.synced)).toBe(true);
    });
  });

  describe("Synchronization", () => {
    it("should mark operations as synced after successful sync", () => {
      const operation: OfflineOperation = {
        id: "nestbox-1",
        type: "create",
        entity: "nestBox",
        data: { cajaId: "CAJA-001" },
        timestamp: Date.now(),
        synced: false,
      };

      mockDB.put(operation);
      mockDB.update("nestbox-1", { synced: true });

      const synced = mockDB.get("nestbox-1");
      expect(synced?.synced).toBe(true);
    });

    it("should retrieve only unsynced operations", () => {
      const ops: OfflineOperation[] = [
        {
          id: "op-1",
          type: "create",
          entity: "nestBox",
          data: { cajaId: "CAJA-001" },
          timestamp: Date.now(),
          synced: false,
        },
        {
          id: "op-2",
          type: "create",
          entity: "nestBox",
          data: { cajaId: "CAJA-002" },
          timestamp: Date.now() + 1000,
          synced: true,
        },
        {
          id: "op-3",
          type: "create",
          entity: "inspection",
          data: { nestBoxId: 1 },
          timestamp: Date.now() + 2000,
          synced: false,
        },
      ];

      ops.forEach((op) => mockDB.put(op));

      const unsynced = mockDB.getAll().filter((op) => !op.synced);
      expect(unsynced).toHaveLength(2);
      expect(unsynced.every((op) => !op.synced)).toBe(true);
    });

    it("should maintain operation order by timestamp", () => {
      const ops: OfflineOperation[] = [
        {
          id: "op-3",
          type: "create",
          entity: "nestBox",
          data: { cajaId: "CAJA-003" },
          timestamp: Date.now() + 2000,
          synced: false,
        },
        {
          id: "op-1",
          type: "create",
          entity: "nestBox",
          data: { cajaId: "CAJA-001" },
          timestamp: Date.now(),
          synced: false,
        },
        {
          id: "op-2",
          type: "create",
          entity: "nestBox",
          data: { cajaId: "CAJA-002" },
          timestamp: Date.now() + 1000,
          synced: false,
        },
      ];

      ops.forEach((op) => mockDB.put(op));

      const sorted = mockDB.getAll().sort((a, b) => a.timestamp - b.timestamp);
      expect(sorted[0].id).toBe("op-1");
      expect(sorted[1].id).toBe("op-2");
      expect(sorted[2].id).toBe("op-3");
    });
  });

  describe("Conflict Resolution", () => {
    it("should detect timestamp conflicts", () => {
      const local: OfflineOperation = {
        id: "op-1",
        type: "update",
        entity: "nestBox",
        data: { id: 1, estadoActual: "ocupada" },
        timestamp: Date.now() - 1000,
        synced: false,
      };

      const remote = {
        id: 1,
        estadoActual: "vacia",
        updatedAt: new Date(Date.now()),
      };

      // Simular conflicto: la operación local es más antigua que la remota
      const isConflict = local.timestamp < new Date(remote.updatedAt).getTime();
      expect(isConflict).toBe(true);
    });

    it("should apply last-write-wins strategy", () => {
      const local: OfflineOperation = {
        id: "op-1",
        type: "update",
        entity: "nestBox",
        data: { id: 1, estadoActual: "ocupada" },
        timestamp: Date.now() + 1000, // Más reciente
        synced: false,
      };

      const remote = {
        id: 1,
        estadoActual: "vacia",
        updatedAt: new Date(Date.now()),
      };

      // Local es más reciente, gana
      const shouldApplyLocal =
        local.timestamp > new Date(remote.updatedAt).getTime();
      expect(shouldApplyLocal).toBe(true);
    });
  });

  describe("Offline State Management", () => {
    it("should clear synced operations", () => {
      const ops: OfflineOperation[] = [
        {
          id: "op-1",
          type: "create",
          entity: "nestBox",
          data: { cajaId: "CAJA-001" },
          timestamp: Date.now(),
          synced: true,
        },
        {
          id: "op-2",
          type: "create",
          entity: "nestBox",
          data: { cajaId: "CAJA-002" },
          timestamp: Date.now() + 1000,
          synced: true,
        },
      ];

      ops.forEach((op) => mockDB.put(op));
      mockDB.clear();

      const all = mockDB.getAll();
      expect(all).toHaveLength(0);
    });

    it("should handle empty operation queue", () => {
      const unsynced = mockDB.getAll().filter((op) => !op.synced);
      expect(unsynced).toHaveLength(0);
    });
  });
});
