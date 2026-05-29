import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Upload, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminPanel() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isAddingBox, setIsAddingBox] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Form state for new nest box
  const [cajaId, setCajaId] = useState("");
  const [instalacion, setInstalacion] = useState("");
  const [tipoCaja, setTipoCaja] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const { data: nestBoxes, isLoading } = trpc.nestBox.list.useQuery();
  const createNestBox = trpc.nestBox.create.useMutation();

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md">
          <h1 className="text-lg font-semibold mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-4">
            Solo los administradores pueden acceder a este panel.
          </p>
          <Button onClick={() => navigate("/")} className="w-full">
            Volver al Mapa
          </Button>
        </Card>
      </div>
    );
  }

  const handleAddNestBox = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingBox(true);

    try {
      await createNestBox.mutateAsync({
        cajaId,
        instalacion,
        tipoCaja,
        latitude,
        longitude,
      });

      toast.success("Caja nido añadida correctamente");
      setCajaId("");
      setInstalacion("");
      setTipoCaja("");
      setLatitude("");
      setLongitude("");
    } catch (error: any) {
      toast.error(error.message || "Error al añadir la caja nido");
    } finally {
      setIsAddingBox(false);
    }
  };

  const handleImportGeoJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const content = await file.text();
      const geojson = JSON.parse(content);

      if (geojson.type !== "FeatureCollection" || !geojson.features) {
        throw new Error("Formato GeoJSON inválido");
      }

      let imported = 0;
      for (const feature of geojson.features) {
        if (feature.geometry.type === "Point") {
          const [lng, lat] = feature.geometry.coordinates;
          const props = feature.properties;

          try {
            await createNestBox.mutateAsync({
              cajaId: props.caja_id,
              instalacion: props.instalacion,
              tipoCaja: props.tipo_caja,
              latitude: lat.toString(),
              longitude: lng.toString(),
            });
            imported++;
          } catch (err) {
            console.error(`Error importing ${props.caja_id}:`, err);
          }
        }
      }

      toast.success(`${imported} cajas nido importadas correctamente`);
    } catch (error: any) {
      toast.error(error.message || "Error al importar GeoJSON");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Panel de Administración</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Actions */}
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Añadir Caja Nido
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Añadir Nueva Caja Nido</DialogTitle>
                <DialogDescription>
                  Introduce los datos de la nueva caja nido
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddNestBox} className="space-y-4">
                <div>
                  <Label htmlFor="cajaId">ID de Caja</Label>
                  <Input
                    id="cajaId"
                    placeholder="CN-FV01-001"
                    value={cajaId}
                    onChange={(e) => setCajaId(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="instalacion">Instalación</Label>
                  <Input
                    id="instalacion"
                    placeholder="Planta Solar FV Badajoz I"
                    value={instalacion}
                    onChange={(e) => setInstalacion(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tipoCaja">Tipo de Caja</Label>
                  <Input
                    id="tipoCaja"
                    placeholder="Cemento-madera"
                    value={tipoCaja}
                    onChange={(e) => setTipoCaja(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="latitude">Latitud</Label>
                    <Input
                      id="latitude"
                      placeholder="38.912345"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitud</Label>
                    <Input
                      id="longitude"
                      placeholder="-6.345678"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isAddingBox} className="w-full">
                  {isAddingBox ? "Añadiendo..." : "Añadir Caja"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <div className="relative">
            <input
              type="file"
              accept=".geojson,.json"
              onChange={handleImportGeoJSON}
              className="hidden"
              id="geojson-upload"
              disabled={isImporting}
            />
            <label htmlFor="geojson-upload">
              <Button asChild disabled={isImporting}>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {isImporting ? "Importando..." : "Importar GeoJSON"}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Nest Boxes Table */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Cajas Nido Registradas</h2>
          {isLoading ? (
            <p className="text-muted-foreground">Cargando cajas nido...</p>
          ) : nestBoxes && nestBoxes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-semibold">ID</th>
                    <th className="text-left py-2 px-2 font-semibold">Instalación</th>
                    <th className="text-left py-2 px-2 font-semibold">Tipo</th>
                    <th className="text-left py-2 px-2 font-semibold">Ubicación</th>
                    <th className="text-left py-2 px-2 font-semibold">Estado</th>
                    <th className="text-left py-2 px-2 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {nestBoxes.map((box: any) => (
                    <tr key={box.id} className="border-b border-border hover:bg-muted">
                      <td className="py-2 px-2">{box.cajaId}</td>
                      <td className="py-2 px-2">{box.instalacion}</td>
                      <td className="py-2 px-2">{box.tipoCaja}</td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">
                        {box.latitude}, {box.longitude}
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-muted">
                          {box.estadoActual}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">No hay cajas nido registradas</p>
          )}
        </Card>
      </div>
    </div>
  );
}
