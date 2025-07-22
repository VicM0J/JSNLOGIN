
import { Layout } from "@/components/layout/layout";
import { SystemTicketList } from "@/components/tickets/SystemTicketList";
import { useAuth } from "@/hooks/use-auth";

export default function SystemTicketsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Verificando autenticación...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-700 mb-2">
            Acceso no autorizado
          </div>
          <div className="text-gray-600">
            Por favor, inicie sesión para acceder a esta página
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <SystemTicketList userArea={user.area} />
    </Layout>
  );
}
