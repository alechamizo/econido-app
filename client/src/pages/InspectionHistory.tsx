import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
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
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Download, Filter, X, Play } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";

const SPECIES_NAMES: Record<string, string> = {
  cernicalo_vulgar: "Cernícalo vulgar",
  cernicalo_primilla: "Cernícalo primilla",
  carraca_europea: "Carraca europea",
  mochuelo_europeo: "Mochuelo europeo",
  lechuza: "Lechuza",
  gorrion: "Gorrión",
  otros: "Otros",
};

export default function InspectionHistory() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedNestBoxId, setSelectedNestBoxId] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; tipo: string } | null>(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);

  const { data: nestBoxes } = trpc.nestBox.list.useQuery();
  const { data: inspections } = trpc.inspection.list.useQuery();

  // Filter inspections
  const filteredInspections = useMemo(() => {
    if (!inspections) return [];

    return inspections.filter((inspection: any) => {
      if (selectedNestBoxId && selectedNestBoxId !== "all" && inspection.nestBoxId !== parseInt(selectedNestBoxId)) {
        return false;
      }

      if (startDate) {
        const inspectionDate = new Date(inspection.fecha);
        const start = new Date(startDate);
        if (inspectionDate < start) return false;
      }

      if (endDate) {
        const inspectionDate = new Date(inspection.fecha);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (inspectionDate > end) return false;
      }

      return true;
    });
  }, [inspections, selectedNestBoxId, startDate, endDate]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredInspections.length === 0) {
      toast.error("No hay inspecciones para exportar");
      return;
    }

    const headers = [
      "ID Caja",
      "Fecha",
      "Ocupada",
      "Especie",
      "Huevos",
      "Pollos",
      "Estado Conservación",
      "Observaciones",
    ];

    const rows = filteredInspections.map((inspection: any) => [
      inspection.nestBoxId,
      new Date(inspection.fecha).toLocaleDateString("es-ES"),
      inspection.ocupada ? "Sí" : "No",
      inspection.especie ? SPECIES_NAMES[inspection.especie] || inspection.especie : "-",
      inspection.numHuevos || "-",
      inspection.numPollos || "-",
      inspection.estadoConservacion || "-",
      inspection.observaciones || "-",
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inspecciones-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Archivo CSV descargado correctamente");
  };

  const handleMediaClick = (media: { url: string; tipo: string }) => {
    setSelectedMedia(media);
    setMediaDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Historial de Inspecciones</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Filters */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Caja Nido
              </label>
              <Select value={selectedNestBoxId} onValueChange={setSelectedNestBoxId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las cajas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las cajas</SelectItem>
                  {nestBoxes?.map((box: any) => (
                    <SelectItem key={box.id} value={box.id.toString()}>
                      {box.cajaId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Fecha Inicio
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Fecha Fin
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleExportCSV}
                className="w-full"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </Card>

        {/* Timeline */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {filteredInspections.length} Inspecciones encontradas
          </h2>

          {filteredInspections.length > 0 ? (
            <div className="space-y-4">
              {filteredInspections.map((inspection: any, index: number) => (
                <Card key={inspection.id} className="p-4 border-l-4 border-l-primary">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {inspection.nestBox?.cajaId || `Caja #${inspection.nestBoxId}`}
                        </h3>
                        <Badge variant={inspection.ocupada ? "default" : "outline"}>
                          {inspection.ocupada ? "Ocupada" : "Vacía"}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        📅 {new Date(inspection.fecha).toLocaleDateString("es-ES", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>

                      {inspection.ocupada && inspection.especie && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Especie:</span>
                            <p className="font-medium">
                              {SPECIES_NAMES[inspection.especie] || inspection.especie}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Huevos:</span>
                            <p className="font-medium">{inspection.numHuevos || 0}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Pollos:</span>
                            <p className="font-medium">{inspection.numPollos || 0}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Estado:</span>
                            <p className="font-medium">{inspection.estadoConservacion || "-"}</p>
                          </div>
                        </div>
                      )}

                      {inspection.observaciones && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <p className="text-muted-foreground">Observaciones:</p>
                          <p className="text-foreground">{inspection.observaciones}</p>
                        </div>
                      )}
                    </div>

                    {/* Multimedia Thumbnail */}
                    {inspection.multimediaUrls && inspection.multimediaUrls.length > 0 && (
                      <div className="flex-shrink-0">
                        <div
                          className="relative w-24 h-24 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity bg-muted"
                          onClick={() => handleMediaClick(inspection.multimediaUrls[0])}
                        >
                          {inspection.multimediaUrls[0].tipo === "video" ? (
                            <>
                              <video
                                src={inspection.multimediaUrls[0].url}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <Play className="w-6 h-6 text-white" />
                              </div>
                            </>
                          ) : (
                            <img
                              src={inspection.multimediaUrls[0].url}
                              alt="Foto inspección"
                              className="w-full h-full object-cover"
                            />
                          )}
                          {inspection.multimediaUrls.length > 1 && (
                            <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                              +{inspection.multimediaUrls.length - 1}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="text-right text-xs text-muted-foreground">
                      <p>Inspector:</p>
                      <p className="font-medium">{inspection.userId}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">
                No hay inspecciones que coincidan con los filtros seleccionados
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Media Viewer Dialog */}
      <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogClose className="absolute right-4 top-4 z-10" />
          {selectedMedia && (
            <div className="w-full">
              {selectedMedia.tipo === "video" ? (
                <video
                  src={selectedMedia.url}
                  controls
                  className="w-full h-auto rounded-lg"
                  autoPlay
                />
              ) : (
                <img
                  src={selectedMedia.url}
                  alt="Foto inspección"
                  className="w-full h-auto rounded-lg"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
