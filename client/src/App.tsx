import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { NotificationPermission } from "@/components/notifications/notification-permission";
import { useWebSocket } from "@/lib/websocket";
import { useEffect, Component, ReactNode } from "react";
import { NotificationService } from "@/lib/notifications";

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Algo salió mal
            </h2>
            <p className="text-gray-600 mb-4">
              Ha ocurrido un error inesperado. Por favor, recarga la página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Pages
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import OrdersPage from "@/pages/orders-page";
import AdminPage from "@/pages/admin-page";
import NotFound from "@/pages/not-found";
import RepositionsPage from "@/pages/repositions-page";
import HistoryPage from "@/pages/history-page";
import AlmacenPage from "@/pages/almacen-page";
import AgendaPage from "@/pages/agenda-page";
import MetricsPage from "@/pages/metrics-page";
import MaintenanceScreen from "@/components/maintenance/MaintenanceScreen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error && typeof error === 'object' && 'message' in error) {
          const errorMessage = error.message as string;
          if (errorMessage.includes('401') || errorMessage.includes('403')) {
            return false;
          }
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { isConnected } = useWebSocket();

  useEffect(() => {
    // Inicializar el servicio de notificaciones
    try {
      NotificationService.getInstance();
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/maintenance" component={MaintenanceScreen} />
        <Route path="/">
          {({ params }) => {
            // Redirect root to dashboard
            window.history.replaceState({}, '', '/dashboard');
            return null;
          }}
        </Route>
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/orders" component={OrdersPage} />
        <ProtectedRoute path="/admin" component={AdminPage} />
        <ProtectedRoute path="/repositions" component={RepositionsPage} />
        <ProtectedRoute path="/history" component={HistoryPage} />
        <ProtectedRoute path="/almacen" component={AlmacenPage} />
        <ProtectedRoute path="/agenda" component={AgendaPage} />
        <ProtectedRoute path="/metrics" component={MetricsPage} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
      <NotificationPermission />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;