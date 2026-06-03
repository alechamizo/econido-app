import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MapPin, Upload, Camera, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

const ESPECIES = [
  "Desconocida",
  "Gorrión común",
  "Lavandera blanca",
  "Carbonero común",
  "Estornino negro",
  "Cernícalo vulgar",
  "Cernícalo primilla",
  "Carraca europea",
  "Mochuelo europeo",
  "Lechuza",
  "Otros",
];

const ESTADOS = ["Desconocida", "Ocupada", "Vacía"];

interface InspectionFormProps {
  nestBoxId: number;
  onSuccess?: () => void;
}

interface ReviewData {
  nestBoxId: number;
  fecha: string;
  ocupada: boolean | null;
  especie: string | undefined;
  numHuevos: number;
  numPollos: number;
  numAdultos: number;
  observaciones: string;
  multimedia: File[];
}

export default function InspectionForm({ nestBoxId, onSuccess }: InspectionFormProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedNestBox, setSelectedNestBox] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [reviewData, setReviewData] = useState<ReviewData>({
    nestBoxId,
    fecha: new Date().toISOString().split("T")[0],
    ocupada: null,
    especie: "Desconocida",
    numHuevos: 0,
    numPollos: 0,
    numAdultos: 0,
    observaciones: "",
    multimedia: [],
  });

  const { data: nestBoxes } = trpc.nestBox.list.useQuery();
  const createInspection = trpc.inspection.create.useMutation();

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

  // Cargar la caja nido seleccionada
  useEffect(() => {
    if (nestBoxes && nestBoxId) {
      const nestBox = nestBoxes.find((box: any) => box.id === nestBoxId);
      if (nestBox) {
        setSelectedNestBox(nestBox);
        
        // Precargar valores de la última inspección
        const ultimaInspeccion = nestBox.inspections?.[0];
        setReviewData({
          nestBoxId,
          fecha: new Date().toISOString().split("T")[0],
          ocupada: ultimaInspeccion?.ocupada ? true : ultimaInspeccion?.ocupada === 0 ? false : null,
          especie: ultimaInspeccion?.especie || "Desconocida",
          numHuevos: ultimaInspeccion?.numHuevos || 0,
          numPollos: ultimaInspeccion?.numPollos || 0,
          numAdultos: 0,
          observaciones: "",
          multimedia: [],
        });
      }
    }
  }, [nestBoxes, nestBoxId]);

  const calcularDistancia = useCallback((lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const distanciaACaja = useMemo(() => {
    if (!userLocation || !selectedNestBox) return null;
    const distancia = calcularDistancia(
      userLocation.lat,
      userLocation.lng,
      parseFloat(selectedNestBox.latitude),
      parseFloat(selectedNestBox.longitude)
    );
    return distancia < 1 ? (distancia * 1000).toFixed(0) + " m" : distancia.toFixed(2) + " km";
  }, [userLocation, selectedNestBox, calcularDistancia]);

  const handleMultimediaUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setReviewData((prev) => ({
      ...prev,
      multimedia: [...prev.multimedia, ...files],
    }));
    toast.success(`${files.length} archivo(s) agregado(s)`);
  }, []);

  const handleRemoveMultimedia = useCallback((index: number) => {
    setReviewData((prev) => ({
      ...prev,
      multimedia: prev.multimedia.filter((_, i) => i !== index),
    }));
  }, []);

  const handleViewInMap = useCallback(() => {
    if (selectedNestBox) {
      localStorage.setItem("selectedNestBoxId", selectedNestBox.id.toString());
      navigate("/");
    }
  }, [selectedNestBox, navigate]);

  const handleSaveReview = useCallback(async () => {
    if (reviewData.ocupada === null) {
      toast.error("Por favor selecciona si la caja está ocupada");
      return;
    }

    try {
      await createInspection.mutateAsync({
        nestBoxId: reviewData.nestBoxId,
        fecha: new Date(reviewData.fecha),
        ocupada: reviewData.ocupada ? 1 : 0,
        especie: reviewData.ocupada ? reviewData.especie : undefined,
        numHuevos: reviewData.ocupada ? reviewData.numHuevos : 0,
        numPollos: reviewData.ocupada ? reviewData.numPollos : 0,
        estadoConservacion: "bueno",
        observaciones: reviewData.observaciones,
      });

      toast.success("Revisión guardada correctamente");
      onSuccess?.();
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la revisión");
    }
  }, [reviewData, createInspection, onSuccess, navigate]);

  const handleEstadoChange = (estado: string) => {
    setReviewData((prev) => ({
      ...prev,
      ocupada: estado === "Ocupada" ? true : estado === "Vacía" ? false : null,
      especie: estado === "Ocupada" ? prev.especie : "Desconocida",
      numHuevos: estado === "Ocupada" ? prev.numHuevos : 0,
      numPollos: estado === "Ocupada" ? prev.numPollos : 0,
      numAdultos: estado === "Ocupada" ? prev.numAdultos : 0,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-border p-3 md:p-4 shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <h1 className="text-lg md:text-xl font-bold text-foreground">Nueva Inspección</h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Modal de Inspección */}
      <Dialog open={true} onOpenChange={() => navigate("/")}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle>Revisión — {selectedNestBox?.cajaId}</DialogTitle>
                {selectedNestBox?.inspections?.[0] && (
                  <p className="text-sm text-slate-600 mt-2">
                    Última inspección: {new Date(selectedNestBox.inspections[0].fecha).toLocaleDateString('es-ES')}
                  </p>
                )}
                {distanciaACaja && (
                  <p className="text-sm text-blue-600 mt-1 font-semibold">
                    📍 Distancia: {distanciaACaja}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewInMap}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <MapPin className="w-4 h-4" />
                Ver en mapa
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Fecha */}
            <div>
              <Label htmlFor="fecha" className="text-sm font-semibold">
                Fecha
              </Label>
              <Input
                id="fecha"
                type="date"
                value={reviewData.fecha}
                onChange={(e) =>
                  setReviewData((prev) => ({ ...prev, fecha: e.target.value }))
                }
                className="mt-1"
              />
            </div>

            {/* Estado */}
            <div>
              <Label htmlFor="estado" className="text-sm font-semibold">
                Estado
              </Label>
              <Select
                value={
                  reviewData.ocupada === true
                    ? "Ocupada"
                    : reviewData.ocupada === false
                    ? "Vacía"
                    : "Desconocida"
                }
                onValueChange={handleEstadoChange}
              >
                <SelectTrigger id="estado" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Especie (solo si ocupada) */}
            {reviewData.ocupada && (
              <div>
                <Label htmlFor="especie" className="text-sm font-semibold">
                  Especie
                </Label>
                <Select
                  value={reviewData.especie || "Desconocida"}
                  onValueChange={(value) =>
                    setReviewData((prev) => ({ ...prev, especie: value }))
                  }
                >
                  <SelectTrigger id="especie" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESPECIES.map((especie) => (
                      <SelectItem key={especie} value={especie}>
                        {especie}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Conteos (solo si ocupada) */}
            {reviewData.ocupada && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="huevos" className="text-sm font-semibold">
                    Huevos
                  </Label>
                  <Input
                    id="huevos"
                    type="number"
                    min="0"
                    max="15"
                    value={reviewData.numHuevos}
                    onChange={(e) =>
                      setReviewData((prev) => ({
                        ...prev,
                        numHuevos: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="pollos" className="text-sm font-semibold">
                    Pollos
                  </Label>
                  <Input
                    id="pollos"
                    type="number"
                    min="0"
                    max="15"
                    value={reviewData.numPollos}
                    onChange={(e) =>
                      setReviewData((prev) => ({
                        ...prev,
                        numPollos: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Notas */}
            <div>
              <Label htmlFor="observaciones" className="text-sm font-semibold">
                Notas
              </Label>
              <Textarea
                id="observaciones"
                placeholder="Observaciones..."
                value={reviewData.observaciones}
                onChange={(e) =>
                  setReviewData((prev) => ({ ...prev, observaciones: e.target.value }))
                }
                className="mt-1 resize-none"
              />
            </div>

            {/* Multimedia */}
            <div>
              <Label className="text-sm font-semibold">Multimedia (Fotos/Videos)</Label>
              <div className="mt-2 flex gap-2">
                <input
                  type="file"
                  id="multimedia-input"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleMultimediaUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("multimedia-input")?.click()}
                  className="flex items-center gap-2 flex-1"
                >
                  <Upload className="w-4 h-4" />
                  Subir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.getElementById("multimedia-input") as HTMLInputElement;
                    if (input) {
                      input.setAttribute("capture", "environment");
                      input.click();
                    }
                  }}
                  className="flex items-center gap-2 flex-1"
                >
                  <Camera className="w-4 h-4" />
                  Cámara
                </Button>
              </div>
              {reviewData.multimedia.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-slate-600">{reviewData.multimedia.length} archivo(s) seleccionado(s)</p>
                  {reviewData.multimedia.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-100 p-2 rounded text-sm">
                      <span className="truncate">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMultimedia(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveReview}
                disabled={createInspection.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                {createInspection.isPending ? "Guardando..." : "Guardar Revisión"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
