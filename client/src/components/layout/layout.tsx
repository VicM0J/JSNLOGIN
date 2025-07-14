import { useState, ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { CustomSidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { NotificationsPanel } from "@/components/notifications/notifications-panel";
import { CreateOrderModal } from "@/components/orders/create-order-modal";
import { RepositionForm } from "@/components/repositions/RepositionForm";
import { useWebSocket } from "@/lib/websocket";
import { useAuth } from "@/hooks/use-auth";
import { ReportsPanel } from "../reports/ReportsPanel";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showCreateReposition, setShowCreateReposition] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReports, setShowReports] = useState(false);

  // Inicializar WebSocket para actualizaciones en tiempo real
  useWebSocket();

  const canCreateOrders = user?.area === 'corte' || user?.area === 'admin';
  const canCreateRepositions = user?.area === 'calidad' || user?.area === 'admin';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[var(--jasana-content-bg)]">
        <CustomSidebar 
          onShowNotifications={() => setShowNotifications(true)}
          onCreateOrder={() => setShowCreateOrder(true)}
          onCreateReposition={() => setShowCreateReposition(true)}
        />
        
        <SidebarInset className="flex-1 flex flex-col">
          <TopBar onShowNotifications={() => setShowNotifications(true)} />
          <main className="flex-1 p-6 overflow-y-auto bg-[var(--jasana-content-bg)]">
            {children}
          </main>
        </SidebarInset>

        {/* Modales */}
        {showCreateOrder && canCreateOrders && (
          <CreateOrderModal
            open={showCreateOrder}
            onClose={() => setShowCreateOrder(false)}
          />
        )}

        {showCreateReposition && canCreateRepositions && (
          <RepositionForm onClose={() => setShowCreateReposition(false)} />
        )}

        <NotificationsPanel
          open={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
        <ReportsPanel
          open={showReports}
          onClose={() => setShowReports(false)}
        />
      </div>
    </SidebarProvider>
  );
}