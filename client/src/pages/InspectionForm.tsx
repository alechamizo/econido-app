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
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Upload } from "lucide-react";
import { useLocation } from "wouter";

const SPECIES_NAMES: Record<string, string> = {
  cernicalo_vulgar: "Cernícalo vulgar",
  cernicalo_primilla: "Cernícalo primilla",
  carraca_europea: "Carraca europea",
  mochuelo_europeo: "Mochuelo europeo",
  lechuza: "Lechuza",
  gorrion: "Gorrión",
  otros: "Otros",
};

interface InspectionFormProps {
  nestBoxId: number;
  onSuccess?: () => void;
}

export default function InspectionForm({ nestBoxId, onSuccess }: InspectionFormProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isOccupied, setIsOccupied] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [otherSpecies, setOtherSpecies] = useState("");
  const [numEggs, setNumEggs] = useState(0);
  const [numChicks, setNumChicks] = useState(0);
  const [conservationStatus, setConservationStatus] = useState("");
  const [observations, setObservations] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const createInspection = trpc.inspection.create.useMutation();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      const finalSpecies = selectedSpecies === "otros" ? otherSpecies : selectedSpecies;

      await createInspection.mutateAsync({
        nestBoxId,
        fecha: new Date(selectedDate),
        ocupada: isOccupied ? 1 : 0,
        especie: isOccupied ? finalSpecies : undefined,
        numHuevos: isOccupied ? numEggs : undefined,
        numPollos: isOccupied ? numChicks : undefined,
        estadoConservacion: conservationStatus as any,
        observaciones: observations,
      });

      toast.success("Inspección registrada correctamente");
      onSuccess?.();
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Error al registrar la inspección");
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-foreground">Nueva Inspección</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fecha */}
            <div>
              <Label htmlFor="fecha" className="text-sm font-medium">
                Fecha de Inspección
              </Label>
              <Input
                id="fecha"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* ¿Está ocupada? */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <Label htmlFor="occupied" className="text-sm font-medium cursor-pointer">
                ¿Está ocupada?
              </Label>
              <Switch
                id="occupied"
                checked={isOccupied}
                onCheckedChange={setIsOccupied}
              />
            </div>

            {/* Campos condicionales si está ocupada */}
            {isOccupied && (
              <>
                {/* Especie */}
                <div>
                  <Label htmlFor="species" className="text-sm font-medium">
                    Especie
                  </Label>
                  <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
                    <SelectTrigger id="species" className="mt-1">
                      <SelectValue placeholder="Selecciona una especie" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SPECIES_NAMES).map(([key, name]) => (
                        <SelectItem key={key} value={key}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Otra especie si se selecciona "otros" */}
                {selectedSpecies === "otros" && (
                  <div>
                    <Label htmlFor="otherSpecies" className="text-sm font-medium">
                      Especifica la especie
                    </Label>
                    <Input
                      id="otherSpecies"
                      type="text"
                      placeholder="Nombre de la especie"
                      value={otherSpecies}
                      onChange={(e) => setOtherSpecies(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}

                {/* Número de huevos */}
                <div>
                  <Label htmlFor="eggs" className="text-sm font-medium">
                    Número de Huevos (0-15)
                  </Label>
                  <Input
                    id="eggs"
                    type="number"
                    min="0"
                    max="15"
                    value={numEggs}
                    onChange={(e) => setNumEggs(Math.min(15, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="mt-1"
                  />
                </div>

                {/* Número de pollos */}
                <div>
                  <Label htmlFor="chicks" className="text-sm font-medium">
                    Número de Pollos (0-15)
                  </Label>
                  <Input
                    id="chicks"
                    type="number"
                    min="0"
                    max="15"
                    value={numChicks}
                    onChange={(e) => setNumChicks(Math.min(15, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="mt-1"
                  />
                </div>

                {/* Estado de conservación */}
                <div>
                  <Label htmlFor="conservation" className="text-sm font-medium">
                    Estado de Conservación
                  </Label>
                  <Select value={conservationStatus} onValueChange={setConservationStatus}>
                    <SelectTrigger id="conservation" className="mt-1">
                      <SelectValue placeholder="Selecciona el estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bueno">Bueno</SelectItem>
                      <SelectItem value="necesita_reparacion">Necesita reparación</SelectItem>
                      <SelectItem value="caida">Caída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Observaciones */}
            <div>
              <Label htmlFor="observations" className="text-sm font-medium">
                Observaciones
              </Label>
              <Textarea
                id="observations"
                placeholder="Notas adicionales sobre la inspección..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>

            {/* Multimedia */}
            <div>
              <Label className="text-sm font-medium">Multimedia (Fotos/Audio)</Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  accept="image/*,audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Haz clic para seleccionar archivos
                  </span>
                </label>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="text-sm text-muted-foreground">
                      ✓ {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || (isOccupied && !selectedSpecies)}
              >
                {isLoading ? "Registrando..." : "Registrar Inspección"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
