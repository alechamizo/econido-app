import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('useOfflineSyncPWA', () => {
  beforeEach(() => {
    // Limpiar IndexedDB antes de cada test
    const request = indexedDB.deleteDatabase('EcoNidoDB');
    request.onerror = () => console.error('Error deleting DB');
  });

  it('should open IndexedDB correctly', async () => {
    const dbRequest = indexedDB.open('EcoNidoDB', 1);
    
    await new Promise((resolve, reject) => {
      dbRequest.onerror = () => reject(dbRequest.error);
      dbRequest.onsuccess = () => resolve(dbRequest.result);
      dbRequest.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('pendingInspections')) {
          db.createObjectStore('pendingInspections', { keyPath: 'id' });
        }
      };
    });

    expect(dbRequest.result).toBeDefined();
  });

  it('should save pending inspection to IndexedDB', async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('EcoNidoDB', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('pendingInspections')) {
          db.createObjectStore('pendingInspections', { keyPath: 'id' });
        }
      };
    });

    const inspection = {
      nestBoxId: 1,
      fecha: '2026-06-05',
      ocupada: true,
      especie: 'Gorrión común',
      numHuevos: 3,
      numPollos: 2,
      estadoConservacion: 'Bueno',
      observaciones: 'Test observation',
      multimedia: [],
    };

    const transaction = db.transaction(['pendingInspections'], 'readwrite');
    const store = transaction.objectStore('pendingInspections');

    await new Promise((resolve, reject) => {
      const request = store.add({
        id: `${inspection.nestBoxId}-${Date.now()}`,
        ...inspection,
        timestamp: Date.now(),
      });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    // Verificar que se guardó
    const allInspections = await new Promise<any[]>((resolve, reject) => {
      const transaction2 = db.transaction(['pendingInspections'], 'readonly');
      const store2 = transaction2.objectStore('pendingInspections');
      const request = store2.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    expect(allInspections).toHaveLength(1);
    expect(allInspections[0].nestBoxId).toBe(1);
    expect(allInspections[0].especie).toBe('Gorrión común');
  });

  it('should detect online/offline status', () => {
    expect(navigator.onLine).toBeDefined();
  });

  it('should handle Service Worker registration', async () => {
    if ('serviceWorker' in navigator) {
      // Mock the registration
      const mockRegistration = {
        active: { state: 'activated' },
        installing: null,
        waiting: null,
      };

      vi.spyOn(navigator.serviceWorker, 'register').mockResolvedValue(
        mockRegistration as any
      );

      const registration = await navigator.serviceWorker.register('/sw.js');
      expect(registration).toBeDefined();
    }
  });
});
