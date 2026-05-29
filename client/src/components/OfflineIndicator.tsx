import { useEffect, useState } from "react";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

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

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-yellow-600" />
        <span className="text-sm font-medium text-yellow-800">
          Modo offline - Los cambios se sincronizarán cuando recuperes conexión
        </span>
      </div>
    </div>
  );
}

export function SyncingIndicator({ isSyncing }: { isSyncing: boolean }) {
  if (!isSyncing) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg flex items-center gap-2">
        <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <span className="text-sm font-medium text-blue-800">
          Sincronizando cambios...
        </span>
      </div>
    </div>
  );
}
