import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { CheckCircle2, AlertCircle } from "lucide-react";

const INSTALACIONES = ["PSF EXT I", "PSF EXT II", "PSF EXT III"];

const SECTORES_POR_INSTALACION: Record<string, string[]> = {
  "PSF EXT I": ["IB", "IB2", "IB3", "IB4"],
  "PSF EXT II": ["IIA", "IIA2", "IIA3", "IIA4"],
  "PSF EXT III": ["IIIC"],
};

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

interface ReviewData {
  nestBoxId: number;
  fecha: string;
  ocupada: boolean | null;
  especie: string | undefined;
  numHuevos: number;
  numPollos: number;
  numAdultos: number;
  observaciones: string;
}

export default function QuickReview() {
  const { user } = useAuth();
  const [selectedInstalacion, setSelectedInstalacion] = useState<string>("");
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [selectedNestBox, setSelectedNestBox] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewData>({
    nestBoxId: 0,
    fecha: new Date().toISOString().split("T")[0],
    ocupada: null,
    especie: "Desconocida",
    numHuevos: 0,
    numPollos: 0,
    numAdultos: 0,
    observaciones: "",
  });

  const { data: nestBoxes, isLoading } = trpc.nestBox.list.useQuery();
  const createInspection = trpc.inspection.create.useMutation();

  // Obtener sectores disponibles para la instalación seleccionada
  const sectoresDisponibles = useMemo(() => {
    if (!selectedInstalacion) return [];
    return SECTORES_POR_INSTALACION[selectedInstalacion] || [];
  }, [selectedInstalacion]);

  // Filtrar cajas según instalación y sector
  const cajasFiltradas = useMemo(() => {
    if (!nestBoxes) return [];
    return nestBoxes.filter((caja: any) => {
      const matchInstalacion = !selectedInstalacion || caja.instalacion === selectedInstalacion;
      const matchSector = !selectedSector || caja.cajaId.includes(selectedSector);
      return matchInstalacion && matchSector;
    });
  }, [nestBoxes, selectedInstalacion, selectedSector]);

  const handleOpenReview = useCallback((nestBox: any) => {
    setSelectedNestBox(nestBox);
    
    // Obtener la última inspección para precargar valores
    const ultimaInspeccion = nestBox.inspections?.[0]; // Asumiendo que está ordenada por fecha descendente
    
    setReviewData({
      nestBoxId: nestBox.id,
      fecha: new Date().toISOString().split("T")[0],
      ocupada: ultimaInspeccion?.ocupada ? true : ultimaInspeccion?.ocupada === 0 ? false : null,
      especie: ultimaInspeccion?.especie || "Desconocida",
      numHuevos: ultimaInspeccion?.numHuevos || 0,
      numPollos: ultimaInspeccion?.numPollos || 0,
      numAdultos: ultimaInspeccion?.numAdultos || 0,
      observaciones: "",
    });
    setIsModalOpen(true);
  }, []);

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
      setIsModalOpen(false);
      setSelectedNestBox(null);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la revisión");
    }
  }, [reviewData, createInspection]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Revisión Rápida</h1>
          <p className="text-slate-600">Completa inspecciones de campo de forma ágil</p>
        </div>

        {/* Filtros */}
        <Card className="p-6 mb-8 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="instalacion" className="text-sm font-semibold mb-2 block">
                Instalación
              </Label>
              <Select value={selectedInstalacion} onValueChange={setSelectedInstalacion}>
                <SelectTrigger id="instalacion">
                  <SelectValue placeholder="Selecciona instalación" />
                </SelectTrigger>
                <SelectContent>
                  {INSTALACIONES.map((inst) => (
                    <SelectItem key={inst} value={inst}>
                      {inst}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sector" className="text-sm font-semibold mb-2 block">
                Sector
              </Label>
              <Select
                value={selectedSector}
                onValueChange={setSelectedSector}
                disabled={!selectedInstalacion}
              >
                <SelectTrigger id="sector">
                  <SelectValue placeholder="Selecciona sector" />
                </SelectTrigger>
                <SelectContent>
                  {sectoresDisponibles.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Lista de Cajas */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Cajas Nido ({cajasFiltradas.length})
          </h2>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Cargando cajas...</p>
            </div>
          ) : cajasFiltradas.length === 0 ? (
            <Card className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">
                {selectedInstalacion
                  ? "No hay cajas en esta instalación y sector"
                  : "Selecciona una instalación para ver las cajas"}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cajasFiltradas.map((caja: any) => (
                <Card
                  key={caja.id}
                  className="p-4 cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all"
                  onClick={() => handleOpenReview(caja)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{caja.cajaId}</h3>
                      <p className="text-sm text-slate-600">{caja.instalacion}</p>
                      {caja.inspections?.[0] && (
                        <p className="text-xs text-slate-500 mt-1">
                          Última: {new Date(caja.inspections[0].fecha).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                    {caja.ultimaEspecie && (
                      <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {caja.ultimaEspecie}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenReview(caja);
                    }}
                  >
                    Revisar
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Revisión */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div>
              <DialogTitle>Revisión — {selectedNestBox?.cajaId}</DialogTitle>
              {selectedNestBox?.inspections?.[0] && (
                <p className="text-sm text-slate-600 mt-2">
                  Última inspección: {new Date(selectedNestBox.inspections[0].fecha).toLocaleDateString('es-ES')}
                </p>
              )}
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
                <div>
                  <Label htmlFor="adultos" className="text-sm font-semibold">
                    Adultos
                  </Label>
                  <Input
                    id="adultos"
                    type="number"
                    min="0"
                    max="10"
                    value={reviewData.numAdultos}
                    onChange={(e) =>
                      setReviewData((prev) => ({
                        ...prev,
                        numAdultos: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Notas */}
            <div>
              <Label htmlFor="notas" className="text-sm font-semibold">
                Notas
              </Label>
              <Textarea
                id="notas"
                placeholder="Observaciones..."
                value={reviewData.observaciones}
                onChange={(e) =>
                  setReviewData((prev) => ({ ...prev, observaciones: e.target.value }))
                }
                className="mt-1 min-h-24"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveReview}
                disabled={createInspection.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {createInspection.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
