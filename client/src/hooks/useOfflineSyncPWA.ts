import { useEffect, useState, useCallback } from 'react';

interface PendingInspection {
  id: string;
  nestBoxId: number;
  fecha: string;
  ocupada: boolean;
  especie: string;
  numHuevos: number;
  numPollos: number;
  estadoConservacion: string;
  observaciones: string;
  multimedia: string[];
  timestamp: number;
}

export function useOfflineSyncPWA() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Abrir IndexedDB
  const openDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
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
  }, []);

  // Guardar inspección pendiente
  const savePendingInspection = useCallback(
    async (inspection: Omit<PendingInspection, 'id' | 'timestamp'>) => {
      try {
        const db = await openDB();
        const transaction = db.transaction(['pendingInspections'], 'readwrite');
        const store = transaction.objectStore('pendingInspections');

        const pendingInspection: PendingInspection = {
          ...inspection,
          id: `${inspection.nestBoxId}-${Date.now()}`,
          timestamp: Date.now(),
        };

        return new Promise((resolve, reject) => {
          const request = store.add(pendingInspection);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            console.log('[Offline] Inspection saved locally:', pendingInspection.id);
            resolve(pendingInspection);
            updatePendingCount();
          };
        });
      } catch (error) {
        console.error('[Offline] Error saving inspection:', error);
        throw error;
      }
    },
    [openDB]
  );

  // Obtener inspecciones pendientes
  const getPendingInspections = useCallback(async (): Promise<PendingInspection[]> => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['pendingInspections'], 'readonly');
      const store = transaction.objectStore('pendingInspections');

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    } catch (error) {
      console.error('[Offline] Error getting pending inspections:', error);
      return [];
    }
  }, [openDB]);

  // Actualizar contador de pendientes
  const updatePendingCount = useCallback(async () => {
    const pending = await getPendingInspections();
    setPendingCount(pending.length);
  }, [getPendingInspections]);

  // Sincronizar inspecciones pendientes
  const syncPendingInspections = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const pending = await getPendingInspections();

      if (pending.length === 0) {
        console.log('[Sync] No pending inspections to sync');
        setIsSyncing(false);
        return;
      }

      console.log('[Sync] Syncing', pending.length, 'pending inspections');

      let synced = 0;
      const db = await openDB();

      for (const inspection of pending) {
        try {
          const response = await fetch('/api/trpc/nestBox.createInspection', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nestBoxId: inspection.nestBoxId,
              fecha: inspection.fecha,
              ocupada: inspection.ocupada,
              especie: inspection.especie,
              numHuevos: inspection.numHuevos,
              numPollos: inspection.numPollos,
              estadoConservacion: inspection.estadoConservacion,
              observaciones: inspection.observaciones,
              multimedia: inspection.multimedia,
            }),
          });

          if (response.ok) {
            // Eliminar de pendientes
            const transaction = db.transaction(['pendingInspections'], 'readwrite');
            const store = transaction.objectStore('pendingInspections');
            await new Promise((resolve, reject) => {
              const request = store.delete(inspection.id);
              request.onerror = () => reject(request.error);
              request.onsuccess = () => resolve(null);
            });

            synced++;
            console.log('[Sync] Inspection synced:', inspection.id);
          } else {
            console.error('[Sync] Failed to sync inspection:', inspection.id, response.status);
          }
        } catch (error) {
          console.error('[Sync] Error syncing inspection:', inspection.id, error);
        }
      }

      setLastSyncTime(new Date());
      await updatePendingCount();

      console.log('[Sync] Synced', synced, 'inspections');
    } catch (error) {
      console.error('[Sync] Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, getPendingInspections, openDB, updatePendingCount]);

  // Escuchar cambios de conectividad
  useEffect(() => {
    const handleOnline = () => {
      console.log('[PWA] Back online, syncing...');
      syncPendingInspections();
    };

    const handleOffline = () => {
      console.log('[PWA] Went offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Escuchar mensajes del Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          console.log('[PWA] Sync complete from SW:', event.data.synced);
          updatePendingCount();
        }
      });
    }

    // Actualizar contador inicial
    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingInspections, updatePendingCount]);

  return {
    savePendingInspection,
    getPendingInspections,
    syncPendingInspections,
    isSyncing,
    pendingCount,
    lastSyncTime,
  };
}
