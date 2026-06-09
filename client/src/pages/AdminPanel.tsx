import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Upload, ArrowLeft, Loader2, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

interface GeoJSONFeature {
  type: "Feature";
  properties: Record<string, any>;
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export default function AdminPanel() {
  const [, navigate] = useLocation();
  const [isAddingBox, setIsAddingBox] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Form state for new nest box
  const [cajaId, setCajaId] = useState("");
  const [instalacion, setInstalacion] = useState("");
  const [tipoCaja, setTipoCaja] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const { data: nestBoxes, isLoading, refetch } = trpc.nestBox.list.useQuery();
  const createNestBox = trpc.nestBox.create.useMutation();
  const importGeoJSON = trpc.nestBox.importFromGeoJSON.useMutation();
  const deleteNestBox = trpc.nestBox.delete.useMutation();

  // Obtener usuario actual
  const { data: currentUser } = trpc.auth.me.useQuery();

  // Check if user is admin
  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
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
      refetch();
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
      const geojson: any = JSON.parse(content);

      if (geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
        throw new Error("Formato GeoJSON inválido - debe ser un FeatureCollection");
      }

      // Detectar si las coordenadas son UTM
      const isUTM = geojson.crs?.properties?.name?.includes("25830") || 
                    geojson.features.some((f: any) => {
                      const coords = f.geometry.coordinates;
                      return coords[0] > 180 || coords[1] > 90;
                    });

      // Transformar features a formato esperado
      const nestBoxesToImport = geojson.features
        .map((feature: any, idx: number) => {
          if (feature.geometry.type !== "Point") {
            throw new Error(`Feature ${idx}: La geometría debe ser de tipo Point`);
          }

          const props = feature.properties || {};
          const [longitude, latitude] = feature.geometry.coordinates;

          return {
            cajaId: props.Etiqueta || props.cajaId || props.caja_id || props.id || `Caja_${idx}`,
            instalacion: props.PSF || props.instalacion || props.installation || "Sin especificar",
            tipoCaja: props.Tipo || props.tipoCaja || props.tipo_caja || props.type || "Estándar",
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            isUTM,
          };
        });

      // Usar el mutation del servidor para importar
      const result = await importGeoJSON.mutateAsync({
        nestBoxes: nestBoxesToImport,
      });

      setImportResults({
        success: result.success,
        failed: result.failed,
        errors: result.errors || [],
      });
      setShowResults(true);

      if (result.failed === 0) {
        toast.success(`✅ ${result.success} cajas nido importadas correctamente`);
      } else {
        toast.warning(`⚠️ ${result.success} importadas, ${result.failed} fallidas`);
      }

      refetch();
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Error al importar GeoJSON");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteNestBox = async (id: number) => {
    try {
      await deleteNestBox.mutateAsync(id);
      toast.success("Caja nido eliminada correctamente");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la caja nido");
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
            <Badge variant="default" className="ml-auto">
              Admin
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
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
                    placeholder="Ext IB12-1"
                    value={cajaId}
                    onChange={(e) => setCajaId(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="instalacion">Instalación</Label>
                  <Input
                    id="instalacion"
                    placeholder="PSF EXT I"
                    value={instalacion}
                    onChange={(e) => setInstalacion(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tipoCaja">Tipo de Caja</Label>
                  <Input
                    id="tipoCaja"
                    placeholder="Estándar"
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
                      placeholder="38.87391"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitud</Label>
                    <Input
                      id="longitude"
                      placeholder="-6.97218"
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
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Importar GeoJSON
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* GeoJSON Format Guide */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Formato GeoJSON Esperado</h3>
          <div className="bg-muted p-4 rounded font-mono text-xs overflow-x-auto">
            <pre>{`{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "cajaId": "Ext IB12-1",
        "instalacion": "PSF EXT I",
        "tipoCaja": "Estándar"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-6.97218, 38.87391]
      }
    }
  ]
}`}</pre>
          </div>
        </Card>

        {/* Nest Boxes Table */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            Cajas Nido Registradas ({nestBoxes?.length || 0})
          </h2>
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
                      <td className="py-2 px-2 font-medium">{box.cajaId}</td>
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
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar Caja Nido</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que deseas eliminar la caja {box.cajaId}?
                                Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteNestBox(box.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogContent>
                        </AlertDialog>
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

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resultados de la Importación</DialogTitle>
            <DialogDescription>
              Resumen de las cajas nido importadas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded">
                <p className="text-sm text-muted-foreground">Exitosas</p>
                <p className="text-2xl font-bold text-green-600">
                  {importResults?.success || 0}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded">
                <p className="text-sm text-muted-foreground">Fallidas</p>
                <p className="text-2xl font-bold text-red-600">
                  {importResults?.failed || 0}
                </p>
              </div>
            </div>

            {importResults?.errors && importResults.errors.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded">
                <p className="text-sm font-medium text-yellow-800 mb-2">Errores:</p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {importResults.errors.slice(0, 5).map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                  {importResults.errors.length > 5 && (
                    <li>• ... y {importResults.errors.length - 5} más</li>
                  )}
                </ul>
              </div>
            )}

            <Button onClick={() => setShowResults(false)} className="w-full">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
