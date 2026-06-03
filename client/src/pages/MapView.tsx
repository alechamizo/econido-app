import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { MapView as GoogleMapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { MapPin, Plus, Filter, Menu, X, Navigation, BarChart3, Clock, Zap } from "lucide-react";
import { useLocation } from "wouter";

// Colores por estado de ocupación
const STATUS_COLORS: Record<string, string> = {
  ocupada: "#FF6B6B",      // Rojo para ocupada
  vacia: "#4ECDC4",        // Verde/Turquesa para vacía
  desconocida: "#95A5A6",  // Gris para sin datos
};

const STATUS_NAMES: Record<string, string> = {
  ocupada: "Ocupada",
  vacia: "Vacía",
  desconocida: "Sin datos",
};

export default function MapView() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedNestBox, setSelectedNestBox] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { data: nestBoxes, isLoading } = trpc.nestBox.list.useQuery();

  // Obtener ubicación del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
        }
      );
    }
  }, []);

  // Actualizar marcador del usuario en el mapa
  useEffect(() => {
    if (!map || !userLocation) return;

    if (userMarker) {
      userMarker.setPosition(userLocation);
    } else {
      const marker = new google.maps.Marker({
        position: userLocation,
        map,
        title: "Tu ubicación",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#4A90E2",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 3,
        },
      });
      setUserMarker(marker);
    }
  }, [map, userLocation, userMarker]);

  const handleMapReady = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setMapReady(true);
    
    if (!nestBoxes) return;

    // Limpiar marcadores previos
    nestBoxes.forEach((box: any) => {
      if (!box.latitude || !box.longitude) return;

      const lat = parseFloat(box.latitude);
      const lng = parseFloat(box.longitude);

      // Determinar estado: ocupada, vacía o desconocida
      let estado = "desconocida";
      if (box.inspections && box.inspections.length > 0) {
        const ultimaInspeccion = box.inspections[0];
        estado = ultimaInspeccion.ocupada ? "ocupada" : "vacia";
      }

      const color = STATUS_COLORS[estado] || "#95A5A6";

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: mapInstance,
        title: box.cajaId,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: color,
          fillOpacity: 0.8,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => {
        setSelectedNestBox(box);
        setSidebarOpen(true);
      });
    });
  }, [nestBoxes]);

  const handleCenterToUser = useCallback(() => {
    if (!map || !userLocation) return;
    map.panTo(userLocation);
    map.setZoom(15);
  }, [map, userLocation]);

  // Filtrar cajas según estado seleccionado
  const cajasFiltradas = nestBoxes?.filter((box: any) => {
    if (!selectedStatus || selectedStatus === "all") return true;
    
    let estado = "desconocida";
    if (box.inspections && box.inspections.length > 0) {
      const ultimaInspeccion = box.inspections[0];
      estado = ultimaInspeccion.ocupada ? "ocupada" : "vacia";
    }
    
    return estado === selectedStatus;
  }) || [];

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header - Responsive */}
      <div className="bg-white border-b border-border p-3 md:p-4 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
            <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">EcoNido</h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="default" size="sm" onClick={() => navigate("/quick-review")} className="bg-green-600 hover:bg-green-700 whitespace-nowrap">
              Revisión Rápida
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/history")}>
              Historial
            </Button>
            {user?.role === "admin" && (
              <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                Admin
              </Button>
            )}
            {user && (
              <Badge variant="outline" className="text-xs">
                {user.role === "admin" ? "Admin" : "Técnico"}
              </Badge>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Quick Navigation */}
        <div className="md:hidden flex gap-2 mt-3 overflow-x-auto pb-2">
          <Button variant="default" size="sm" onClick={() => navigate("/quick-review")} className="bg-green-600 hover:bg-green-700 text-xs whitespace-nowrap flex-shrink-0">
            Revisión
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")} className="text-xs whitespace-nowrap flex-shrink-0">
            Dashboard
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/history")} className="text-xs whitespace-nowrap flex-shrink-0">
            Historial
          </Button>
          {user?.role === "admin" && (
            <Button variant="outline" size="sm" onClick={() => navigate("/admin")} className="text-xs whitespace-nowrap flex-shrink-0">
              Admin
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - Mobile Drawer */}
        <div
          className={`fixed md:relative inset-y-0 left-0 z-40 w-72 md:w-80 bg-white border-r border-border overflow-y-auto transition-transform duration-300 md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 space-y-4">
            {/* Close button for mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Filters */}
            <div className="space-y-3 mt-8 md:mt-0">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtros
              </h2>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Estado
                </label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="ocupada">Ocupada</SelectItem>
                    <SelectItem value="vacia">Vacía</SelectItem>
                    <SelectItem value="desconocida">Sin datos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground">Leyenda</h3>
              <div className="space-y-2">
                {Object.entries(STATUS_NAMES).map(([key, name]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[key] }}
                    />
                    <span className="text-sm text-muted-foreground">{name}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Tu ubicación</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-4 border-t border-border">
              {user?.role === "admin" && (
                <Button className="w-full" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir Caja
                </Button>
              )}
            </div>

            {/* Selected nest box details */}
            {selectedNestBox && (
              <Card className="p-3 bg-muted">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">{selectedNestBox.cajaId}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedNestBox.instalacion}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tipo: {selectedNestBox.tipoCaja}
                  </p>
                  {selectedNestBox.inspections && selectedNestBox.inspections.length > 0 && (
                    <p className="text-xs">
                      Estado:{" "}
                      <span className="font-medium">
                        {selectedNestBox.inspections[0].ocupada ? "Ocupada" : "Vacía"}
                      </span>
                    </p>
                  )}
                  <Button 
                    className="w-full mt-2" 
                    size="sm" 
                    variant="default"
                    onClick={() => {
                      navigate(`/inspection/${selectedNestBox.id}`);
                      setSidebarOpen(false);
                    }}
                  >
                    Añadir Inspección
                  </Button>
                </div>
              </Card>
            )}

            {/* Statistics */}
            <div className="space-y-2 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground">Estadísticas</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total cajas:</span>
                  <span className="font-semibold">{cajasFiltradas?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ocupadas:</span>
                  <span className="font-semibold">
                    {cajasFiltradas?.filter((b: any) => b.inspections?.[0]?.ocupada).length || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vacías:</span>
                  <span className="font-semibold">
                    {cajasFiltradas?.filter((b: any) => !b.inspections?.[0]?.ocupada && b.inspections?.length > 0).length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Map Container */}
        <div className="flex-1 relative flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center h-full bg-muted">
              <p className="text-muted-foreground">Cargando mapa...</p>
            </div>
          ) : (
            <>
              <GoogleMapView 
                onMapReady={handleMapReady} 
                className="flex-1" 
                initialCenter={{ lat: 38.87, lng: -6.97 }} 
                initialZoom={13} 
              />
              
              {/* Geolocation Button */}
              <button
                onClick={handleCenterToUser}
                className="absolute bottom-4 right-4 bg-white border border-border rounded-lg p-3 hover:bg-slate-100 transition-all shadow-lg z-10 active:scale-95"
                title="Centrar en mi ubicación"
              >
                <Navigation className="w-5 h-5 text-primary" />
              </button>

              {/* Quick Action Buttons - Mobile */}
              <div className="md:hidden absolute bottom-4 left-4 flex flex-col gap-2 z-10">
                <button
                  onClick={() => navigate("/quick-review")}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-3 shadow-lg active:scale-95 transition-all"
                  title="Revisión Rápida"
                >
                  <Zap className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 shadow-lg active:scale-95 transition-all"
                  title="Dashboard"
                >
                  <BarChart3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate("/history")}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-3 shadow-lg active:scale-95 transition-all"
                  title="Historial"
                >
                  <Clock className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
