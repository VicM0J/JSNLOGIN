import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "@/lib/protected-route";
import Dashboard from "@/pages/dashboard";
import OrdersPage from "@/pages/orders-page";
import RepositionsPage from "@/pages/repositions-page";
import AdminPage from "@/pages/admin-page";
import HistoryPage from "@/pages/history-page";
import AgendaPage from "@/pages/agenda-page";
import AlmacenPage from "@/pages/almacen-page";
import AuthPage from "@/pages/auth-page";
import NotFound from "./pages/not-found";
import MetricsPage from "./pages/metrics-page";
import { useEffect } from 'react';
import { NotificationService } from './lib/notifications';
import MaintenanceScreen from './components/maintenance/MaintenanceScreen';

// Toggle this to enable/disable maintenance mode
const MAINTENANCE_MODE = false;

function Router() {
  if (MAINTENANCE_MODE) {
    return <MaintenanceScreen />;
  }

  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/orders" component={OrdersPage} />
      <ProtectedRoute path="/repositions" component={RepositionsPage} />
      <ProtectedRoute path="/history" component={HistoryPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/almacen" component={AlmacenPage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/agenda" component={AgendaPage} />
       <ProtectedRoute path="/metrics" component={MetricsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    NotificationService.getInstance();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;