import { useEffect, useState, useCallback } from "react";

interface OfflineOperation {
  id: string;
  type: "create" | "update" | "delete";
  entity: "nestBox" | "inspection";
  data: any;
  timestamp: number;
  synced: boolean;
}

const DB_NAME = "EcoNidoDB";
const DB_VERSION = 1;
const STORE_NAME = "offlineOperations";

let db: IDBDatabase | null = null;

async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

async function getDB(): Promise<IDBDatabase> {
  if (db) return db;
  return initDB();
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingOperations, setPendingOperations] = useState<OfflineOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load pending operations from IndexedDB
  const loadPendingOperations = useCallback(async () => {
    try {
      const database = await getDB();
      return new Promise<OfflineOperation[]>((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const operations = request.result.filter((op: any) => !op.synced);
          setPendingOperations(operations);
          resolve(operations);
        };
      });
    } catch (error) {
      console.error("Error loading pending operations:", error);
      return [];
    }
  }, []);

  // Save operation to IndexedDB
  const saveOperation = useCallback(
    async (operation: Omit<OfflineOperation, "id" | "timestamp" | "synced">) => {
      try {
        const database = await getDB();
        const op: OfflineOperation = {
          ...operation,
          id: `${operation.entity}-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          synced: false,
        };

        return new Promise<OfflineOperation>((resolve, reject) => {
          const transaction = database.transaction([STORE_NAME], "readwrite");
          const store = transaction.objectStore(STORE_NAME);
          const request = store.add(op);

          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            setPendingOperations((prev) => [...prev, op]);
            resolve(op);
          };
        });
      } catch (error) {
        console.error("Error saving operation:", error);
        throw error;
      }
    },
    []
  );

  // Mark operation as synced
  const markAsSynced = useCallback(async (operationId: string) => {
    try {
      const database = await getDB();
      return new Promise<void>((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const getRequest = store.get(operationId);

        getRequest.onsuccess = () => {
          const operation = getRequest.result;
          if (operation) {
            operation.synced = true;
            const updateRequest = store.put(operation);
            updateRequest.onerror = () => reject(updateRequest.error);
            updateRequest.onsuccess = () => {
              setPendingOperations((prev) =>
                prev.filter((op) => op.id !== operationId)
              );
              resolve();
            };
          } else {
            resolve();
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    } catch (error) {
      console.error("Error marking operation as synced:", error);
      throw error;
    }
  }, []);

  // Clear all synced operations
  const clearSyncedOperations = useCallback(async () => {
    try {
      const database = await getDB();
      return new Promise<void>((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          setPendingOperations([]);
          resolve();
        };
      });
    } catch (error) {
      console.error("Error clearing operations:", error);
      throw error;
    }
  }, []);

  return {
    isOnline,
    pendingOperations,
    isSyncing,
    setIsSyncing,
    loadPendingOperations,
    saveOperation,
    markAsSynced,
    clearSyncedOperations,
  };
}
