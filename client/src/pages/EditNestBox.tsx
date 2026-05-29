import { useState, useEffect } from "react";
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
import { ArrowLeft, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

export default function EditNestBox({ nestBoxId }: { nestBoxId: number }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: nestBox } = trpc.nestBox.getById.useQuery(nestBoxId);
  const updateMutation = trpc.nestBox.update.useMutation();
  const deleteMutation = trpc.nestBox.delete.useMutation();

  // Form state
  const [instalacion, setInstalacion] = useState("");
  const [tipoCaja, setTipoCaja] = useState("");
  const [estadoActual, setEstadoActual] = useState("");

  useEffect(() => {
    if (nestBox) {
      setInstalacion(nestBox.instalacion || "");
      setTipoCaja(nestBox.tipoCaja || "");
      setEstadoActual(nestBox.estadoActual || "desconocido");
    }
  }, [nestBox]);

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md">
          <h1 className="text-lg font-semibold mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-4">
            Solo los administradores pueden editar cajas nido.
          </p>
          <Button onClick={() => navigate("/")} className="w-full">
            Volver al Mapa
          </Button>
        </Card>
      </div>
    );
  }

  if (!nestBox) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Cargando caja nido...</p>
      </div>
    );
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateMutation.mutateAsync({
        id: nestBoxId,
        data: {
          instalacion,
          tipoCaja,
          estadoActual: estadoActual as any,
        },
      });

      toast.success("Caja nido actualizada correctamente");
      navigate("/admin");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la caja nido");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteMutation.mutateAsync(nestBoxId);
      toast.success("Caja nido eliminada correctamente");
      navigate("/admin");
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la caja nido");
    } finally {
      setIsDeleting(false);
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
            onClick={() => navigate("/admin")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Editar Caja Nido</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <Card className="p-6">
          <form onSubmit={handleUpdate} className="space-y-6">
            {/* ID de Caja (read-only) */}
            <div>
              <Label className="text-sm font-medium">ID de Caja</Label>
              <Input
                type="text"
                value={nestBox.cajaId}
                disabled
                className="mt-1 bg-muted"
              />
            </div>

            {/* Coordenadas (read-only) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Latitud</Label>
                <Input
                  type="text"
                  value={nestBox.latitude}
                  disabled
                  className="mt-1 bg-muted"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Longitud</Label>
                <Input
                  type="text"
                  value={nestBox.longitude}
                  disabled
                  className="mt-1 bg-muted"
                />
              </div>
            </div>

            {/* Instalación */}
            <div>
              <Label htmlFor="instalacion" className="text-sm font-medium">
                Instalación
              </Label>
              <Input
                id="instalacion"
                type="text"
                placeholder="Nombre de la instalación"
                value={instalacion}
                onChange={(e) => setInstalacion(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Tipo de Caja */}
            <div>
              <Label htmlFor="tipoCaja" className="text-sm font-medium">
                Tipo de Caja
              </Label>
              <Input
                id="tipoCaja"
                type="text"
                placeholder="Tipo de caja (ej: Cemento-madera)"
                value={tipoCaja}
                onChange={(e) => setTipoCaja(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Estado Actual */}
            <div>
              <Label htmlFor="estado" className="text-sm font-medium">
                Estado Actual
              </Label>
              <Select value={estadoActual} onValueChange={setEstadoActual}>
                <SelectTrigger id="estado" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ocupada">Ocupada</SelectItem>
                  <SelectItem value="vacia">Vacía</SelectItem>
                  <SelectItem value="desconocido">Desconocido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Metadatos (read-only) */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded text-sm">
              <div>
                <p className="text-muted-foreground">Creada:</p>
                <p className="font-medium">
                  {new Date(nestBox.createdAt).toLocaleDateString("es-ES")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Actualizada:</p>
                <p className="font-medium">
                  {new Date(nestBox.updatedAt).toLocaleDateString("es-ES")}
                </p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin")}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isDeleting}
                    className="ml-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar caja nido?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminarán la caja nido
                      "{nestBox.cajaId}" y todas sus inspecciones asociadas.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex gap-2">
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Eliminando..." : "Eliminar"}
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
