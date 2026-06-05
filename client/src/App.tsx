import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { OfflineIndicator } from "./components/OfflineIndicator";
import NavigationDrawer from "./components/NavigationDrawer";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import Home from "./pages/Home";
import MapView from "./pages/MapView";
import InspectionForm from "./pages/InspectionForm";
import AdminPanel from "./pages/AdminPanel";
import Dashboard from "./pages/Dashboard";
import InspectionHistory from "./pages/InspectionHistory";
import QuickReview from "./pages/QuickReview";

function InspectionFormRoute() {
  const [location] = useLocation();
  const nestBoxId = location?.split("/").pop();
  return nestBoxId ? <InspectionForm nestBoxId={parseInt(nestBoxId)} /> : <NotFound />;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={MapView} />
      <Route path="/home" component={Home} />
      <Route path="/inspection/:nestBoxId" component={InspectionFormRoute} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/history" component={InspectionHistory} />
      <Route path="/quick-review" component={QuickReview} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <OfflineIndicator />
          <NavigationDrawer />
          <PWAInstallPrompt />
          <div className="md:ml-64">
            <Router />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
