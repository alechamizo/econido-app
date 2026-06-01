import { useState, useCallback } from "react";
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
import { MapPin, Plus, Filter } from "lucide-react";
import { useLocation } from "wouter";

const SPECIES_COLORS: Record<string, string> = {
  cernicalo_vulgar: "#A0522D",
  cernicalo_primilla: "#FF4500",
  carraca_europea: "#00CED1",
  mochuelo_europeo: "#DAA520",
  lechuza: "#E6E6FA",
  gorrion: "#696969",
  otros: "#8A2BE2",
  vacia: "#32CD32",
};

const SPECIES_NAMES: Record<string, string> = {
  cernicalo_vulgar: "Cernícalo vulgar",
  cernicalo_primilla: "Cernícalo primilla",
  carraca_europea: "Carraca europea",
  mochuelo_europeo: "Mochuelo europeo",
  lechuza: "Lechuza",
  gorrion: "Gorrión",
  otros: "Otros",
  vacia: "Caja Vacía",
};

export default function MapView() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedSpecies, setSelectedSpecies] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedNestBox, setSelectedNestBox] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);

  const { data: nestBoxes, isLoading } = trpc.nestBox.list.useQuery();

  const handleMapReady = useCallback((map: google.maps.Map) => {
    setMapReady(true);
    
    if (!nestBoxes) return;

    // Add markers for each nest box
    nestBoxes.forEach((box: any) => {
      if (!box.latitude || !box.longitude) return;

      const lat = parseFloat(box.latitude);
      const lng = parseFloat(box.longitude);

      const speciesKey = box.ultimaEspecie || "vacia";
      const color = SPECIES_COLORS[speciesKey] || "#8A2BE2";

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
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
      });
    });
  }, [nestBoxes]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">EcoNido App</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={() => navigate("/quick-review")} className="bg-green-600 hover:bg-green-700">
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
                Panel Admin
              </Button>
            )}
            {user && (
              <Badge variant="outline">
                {user.role === "admin" ? "Administrador" : "Técnico"}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with filters */}
        <div className="w-80 bg-white border-r border-border overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Filters */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtros
              </h2>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Especie
                </label>
                <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las especies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las especies</SelectItem>
                    {Object.entries(SPECIES_NAMES).map(([key, name]) => (
                      <SelectItem key={key} value={key}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground">Leyenda</h3>
              <div className="space-y-1">
                {Object.entries(SPECIES_NAMES).map(([key, name]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: SPECIES_COLORS[key] }}
                    />
                    <span className="text-sm text-muted-foreground">{name}</span>
                  </div>
                ))}
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
                  {selectedNestBox.ultimaEspecie && (
                    <p className="text-xs">
                      Última especie:{" "}
                      <span className="font-medium">
                        {SPECIES_NAMES[selectedNestBox.ultimaEspecie]}
                      </span>
                    </p>
                  )}
                  <Button 
                    className="w-full mt-2" 
                    size="sm" 
                    variant="default"
                    onClick={() => navigate(`/inspection/${selectedNestBox.id}`)}
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
                  <span className="font-semibold">{nestBoxes?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ocupadas:</span>
                  <span className="font-semibold">
                    {nestBoxes?.filter((b: any) => b.estadoActual === "ocupada").length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-full bg-muted">
              <p className="text-muted-foreground">Cargando mapa...</p>
            </div>
          ) : (
            <GoogleMapView onMapReady={handleMapReady} className="h-full" initialCenter={{ lat: 40, lng: -3 }} initialZoom={6} />
          )}
        </div>
      </div>
    </div>
  );
}
