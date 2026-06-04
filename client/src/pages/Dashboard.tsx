import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { ArrowLeft, Home, Layers, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

const INSTALACIONES = ["Todas", "PSF EXT I", "PSF EXT II", "PSF EXT III"];

const SPECIES_COLORS: Record<string, string> = {
  "Gorrión común": "#22c55e",
  "Lavandera blanca": "#f97316",
  "Carbonero común": "#06b6d4",
  "Estornino negro": "#ec4899",
  "Cernícalo vulgar": "#f59e0b",
  "Cernícalo primilla": "#8b5cf6",
  "Carraca europea": "#06b6d4",
  "Mochuelo europeo": "#d97706",
  "Lechuza": "#6b7280",
  "Desconocida": "#9ca3af",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedInstalacion, setSelectedInstalacion] = useState("Todas");

  const { data: nestBoxes } = trpc.nestBox.list.useQuery();
  const { data: inspections } = trpc.inspection.list.useQuery();

  // Filtrar cajas por instalación
  const filteredNestBoxes = useMemo(() => {
    if (!nestBoxes) return [];
    if (selectedInstalacion === "Todas") return nestBoxes;
    return nestBoxes.filter((box: any) => box.instalacion === selectedInstalacion);
  }, [nestBoxes, selectedInstalacion]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    if (!filteredNestBoxes || !inspections) return null;

    const totalBoxes = filteredNestBoxes.length;
    const occupiedBoxes = filteredNestBoxes.filter((b: any) => {
      const lastInspection = b.inspections?.[0];
      return lastInspection?.ocupada === 1;
    }).length;
    const occupancyRate = totalBoxes > 0 ? ((occupiedBoxes / totalBoxes) * 100).toFixed(0) : 0;

    // Contar especies detectadas
    const speciesSet = new Set<string>();
    filteredNestBoxes.forEach((box: any) => {
      if (box.inspections?.[0]?.especie && box.inspections[0].especie !== "Desconocida") {
        speciesSet.add(box.inspections[0].especie);
      }
    });

    // Contar huevos y pollos
    const filteredInspections = inspections.filter((i: any) => {
      const box = filteredNestBoxes.find((b: any) => b.id === i.nestBoxId);
      return box !== undefined;
    });

    const totalEggs = filteredInspections.reduce((sum: number, i: any) => sum + (i.numHuevos || 0), 0);
    const totalChicks = filteredInspections.reduce((sum: number, i: any) => sum + (i.numPollos || 0), 0);
    const totalReviews = filteredInspections.length;

    // Distribución de especies
    const speciesCount: Record<string, number> = {};
    filteredNestBoxes.forEach((box: any) => {
      const lastInspection = box.inspections?.[0];
      if (lastInspection?.ocupada === 1 && lastInspection?.especie) {
        const species = lastInspection.especie;
        speciesCount[species] = (speciesCount[species] || 0) + 1;
      }
    });

    const speciesData = Object.entries(speciesCount)
      .map(([species, count]) => ({
        name: species,
        value: count,
        color: SPECIES_COLORS[species] || "#9ca3af",
      }))
      .sort((a, b) => b.value - a.value);

    // Estado actual de cajas (Ocupada, Vacía, Sin datos)
    const stateCount = {
      ocupada: occupiedBoxes,
      vacia: filteredNestBoxes.filter((b: any) => {
        const lastInspection = b.inspections?.[0];
        return lastInspection?.ocupada === 0;
      }).length,
      sinDatos: filteredNestBoxes.filter((b: any) => !b.inspections?.[0]).length,
    };

    const stateData = [
      { name: "Ocupadas", value: stateCount.ocupada, color: "#22c55e" },
      { name: "Vacías", value: stateCount.vacia, color: "#06b6d4" },
      { name: "Sin datos", value: stateCount.sinDatos, color: "#d1d5db" },
    ].filter((item) => item.value > 0);

    return {
      totalBoxes,
      occupiedBoxes,
      occupancyRate,
      speciesCount: speciesSet.size,
      totalEggs,
      totalChicks,
      totalReviews,
      speciesData,
      stateData,
    };
  }, [filteredNestBoxes, inspections]);

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="text-center py-12">
          <p className="text-slate-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-border p-3 md:p-4 shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <h1 className="text-lg md:text-xl font-bold text-foreground">Dashboard</h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Título y Descripción */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Resumen de temporada</h2>
          <p className="text-slate-600">Estado de ocupación y especies detectadas</p>
        </div>

        {/* Filtro de Instalación */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {INSTALACIONES.map((inst) => (
            <Button
              key={inst}
              variant={selectedInstalacion === inst ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedInstalacion(inst)}
              className="whitespace-nowrap"
            >
              {inst}
            </Button>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
          {/* Total Cajas */}
          <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl md:text-4xl font-bold text-slate-900">{stats.totalBoxes}</p>
                <p className="text-xs md:text-sm text-slate-600 mt-1">Cajas totales</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Home className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Tasa Ocupación */}
          <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl md:text-4xl font-bold text-slate-900">{stats.occupancyRate}%</p>
                <p className="text-xs md:text-sm text-slate-600 mt-1">Tasa ocupación</p>
                <p className="text-xs text-slate-500 mt-1">{stats.occupiedBoxes} ocupadas</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </Card>

          {/* Especies */}
          <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl md:text-4xl font-bold text-slate-900">{stats.speciesCount}</p>
                <p className="text-xs md:text-sm text-slate-600 mt-1">Especies detectadas</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Layers className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </Card>

          {/* Huevos */}
          <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-slate-900">{stats.totalEggs}</p>
              <p className="text-xs md:text-sm text-slate-600 mt-1">Huevos acumulado</p>
            </div>
          </Card>

          {/* Pollos */}
          <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-slate-900">{stats.totalChicks}</p>
              <p className="text-xs md:text-sm text-slate-600 mt-1">Pollos acumulado</p>
            </div>
          </Card>

          {/* Revisiones */}
          <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-slate-900">{stats.totalReviews}</p>
              <p className="text-xs md:text-sm text-slate-600 mt-1">Revisiones registradas</p>
            </div>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Estado Actual de Cajas */}
          <Card className="p-4 md:p-6 border-0 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Estado actual de cajas</h3>
            <p className="text-sm text-slate-600 mb-6">Basado en la última revisión de cada caja</p>
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.stateData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stats.stateData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 justify-center">
              {stats.stateData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Especies Detectadas */}
          <Card className="p-4 md:p-6 border-0 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Especies detectadas</h3>
            <p className="text-sm text-slate-600 mb-6">Revisiones con especie registrada</p>
            {stats.speciesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={stats.speciesData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#22c55e" radius={[0, 8, 8, 0]}>
                    {stats.speciesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px]">
                <p className="text-slate-500">No hay datos de especies</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
