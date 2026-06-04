import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Map, Box, Zap, BarChart3, History, Settings } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Mapa", icon: Map },
  { path: "/cajas", label: "Cajas", icon: Box },
  { path: "/quick-review", label: "Revisión Rápida", icon: Zap },
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { path: "/history", label: "Historial", icon: History },
  { path: "/settings", label: "Ajustes", icon: Settings },
];

export default function NavigationDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  const handleNavigation = (path: string) => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between p-3 md:p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <h1 className="text-lg md:text-xl font-bold text-foreground flex-1 text-center md:text-left">
            EcoNido
          </h1>
          <div className="w-10 md:hidden" />
        </div>
      </div>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-lg text-foreground">Menú</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Drawer Navigation */}
        <nav className="p-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-green-600 text-white font-semibold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:fixed md:left-0 md:top-16 md:h-[calc(100vh-4rem)] md:w-64 md:flex-col md:bg-white md:border-r md:border-border md:shadow-sm md:z-40">
        <nav className="p-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-green-600 text-white font-semibold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </>
  );
}
