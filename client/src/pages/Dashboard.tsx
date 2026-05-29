import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { ArrowLeft, BarChart3, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
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

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: nestBoxes } = trpc.nestBox.list.useQuery();
  const { data: inspections } = trpc.inspection.list.useQuery();

  // Calculate statistics
  const stats = useMemo(() => {
    if (!nestBoxes || !inspections) return null;

    const totalBoxes = nestBoxes.length;
    const occupiedBoxes = nestBoxes.filter((b: any) => b.estadoActual === "ocupada").length;
    const occupancyRate = totalBoxes > 0 ? ((occupiedBoxes / totalBoxes) * 100).toFixed(1) : 0;
    const totalChicks = inspections.reduce((sum: number, i: any) => sum + (i.numPollos || 0), 0);

    // Species distribution
    const speciesCount: Record<string, number> = {};
    nestBoxes.forEach((box: any) => {
      const species = box.ultimaEspecie || "vacia";
      speciesCount[species] = (speciesCount[species] || 0) + 1;
    });

    const speciesData = Object.entries(speciesCount).map(([species, count]) => ({
      name: SPECIES_NAMES[species] || species,
      value: count,
      color: SPECIES_COLORS[species] || "#8A2BE2",
    }));

    // Reproductive success (eggs vs chicks)
    const reproductiveData = inspections
      .filter((i: any) => i.ocupada === 1)
      .reduce(
        (acc: any, i: any) => {
          acc.totalEggs += i.numHuevos || 0;
          acc.totalChicks += i.numPollos || 0;
          return acc;
        },
        { totalEggs: 0, totalChicks: 0 }
      );

    const reproductiveChart = [
      { name: "Huevos", value: reproductiveData.totalEggs },
      { name: "Pollos", value: reproductiveData.totalChicks },
    ];

    // Timeline data (simulated by month)
    const timelineData = [
      { month: "Enero", ocupacion: 20 },
      { month: "Febrero", ocupacion: 35 },
      { month: "Marzo", ocupacion: 45 },
      { month: "Abril", ocupacion: 65 },
      { month: "Mayo", ocupacion: 75 },
      { month: "Junio", ocupacion: 80 },
    ];

    return {
      totalBoxes,
      occupiedBoxes,
      occupancyRate,
      totalChicks,
      speciesData,
      reproductiveChart,
      timelineData,
    };
  }, [nestBoxes, inspections]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Cargando estadísticas...</p>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-foreground">Dashboard de Estadísticas</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total de Cajas</p>
              <p className="text-3xl font-bold text-foreground">{stats.totalBoxes}</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Cajas Ocupadas</p>
              <p className="text-3xl font-bold text-foreground">{stats.occupiedBoxes}</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tasa de Ocupación</p>
              <p className="text-3xl font-bold text-foreground">{stats.occupancyRate}%</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Pollos Nacidos</p>
              <p className="text-3xl font-bold text-foreground">{stats.totalChicks}</p>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Species Distribution */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Distribución de Especies</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.speciesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.speciesData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Reproductive Success */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Éxito Reproductor</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.reproductiveChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Occupancy Timeline */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Evolución de Ocupación (Histórico)</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="ocupacion"
                stroke="#10b981"
                name="% Ocupación"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Species Legend */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Leyenda de Especies</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </Card>
      </div>
    </div>
  );
}
