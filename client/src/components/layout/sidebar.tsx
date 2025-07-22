import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarSeparator,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { 
  Factory, 
  Home, 
  Package, 
  Bell, 
  History, 
  Plus, 
  Settings, 
  LogOut,
  User,
  FileEdit,
  BarChart3,
  Calendar,
  MessageSquare,
  FileX,
  PanelLeft
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface CustomSidebarProps {
  onShowNotifications: () => void;
  onCreateOrder: () => void;
  onCreateReposition: () => void;
}

export function CustomSidebar({ onShowNotifications, onCreateOrder, onCreateReposition }: CustomSidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const { state } = useSidebar();

  const { data: pendingTransfers = [] } = useQuery<any[]>({
    queryKey: ["/api/transfers/pending"],
    enabled: !!user,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const { data: repositionNotifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 1500, // Reducido a 1.5 segundos para notificaciones más rápidas
    refetchOnWindowFocus: true,
    staleTime: 500, // Datos más frescos
    refetchOnMount: 'always',
    queryFn: async () => {
      const res = await fetch('/api/notifications', {
        credentials: 'include'
      });
      if (!res.ok) {
        console.error('Error fetching notifications:', res.status);
        return [];
      }
      const allNotifications = await res.json();
      const filteredNotifications = allNotifications.filter((n: any) => 
        !n.read && (
          n.type?.includes('reposition') || 
          n.type?.includes('completion') ||
          n.type === 'new_reposition' ||
          n.type === 'reposition_transfer' ||
          n.type === 'reposition_approved' ||
          n.type === 'reposition_rejected' ||
          n.type === 'reposition_completed' ||
          n.type === 'reposition_deleted' ||
          n.type === 'completion_approval_needed'
        )
      );
      return filteredNotifications;
    },
  });

  const { data: pendingRepositions = [] } = useQuery({
    queryKey: ["/api/repositions/pending-count"],
    enabled: !!user && (user.area === 'admin' || user.area === 'envios' || user.area === 'operaciones'),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const res = await fetch('/api/repositions/pending-count', {
        credentials: 'include'
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.repositions || [];
    },
  });

  const canCreateOrders = user?.area === 'corte' || user?.area === 'admin';
  const canCreateRepositions = user?.area === 'calidad' || user?.area === 'admin';
  const isAdmin = user?.area === 'admin' || user?.area === 'sistemas';

  const getAreaDisplayName = (area: string) => {
    const names: Record<string, string> = {
      corte: "Corte",
      bordado: "Bordado", 
      ensamble: "Ensamble",
      plancha: "Plancha/Empaque",
      calidad: "Calidad",
      envios: "Envíos",
      admin: "Admin",
      operaciones: "Operaciones",
      almacen: "Almacén",
      diseño: "Diseño"
    };
    return names[area] || area;
  };

  const getUserInitials = (name: string) => {
    if (!name) return "U";
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const getAreaColor = (area: string) => {
    const colors: Record<string, string> = {
      corte: "bg-[#de8fd9] text-[#233154]",
      bordado: "bg-[#8c69a5] text-white",
      ensamble: "bg-[#504b78] text-white",
      plancha: "bg-[#f8bbed] text-[#233154]",
      calidad: "bg-[#233154] text-white",
      envios: "bg-[#8c69a5] text-white",
      admin: "bg-[#504b78] text-white",
      operaciones: "bg-[#8c69a5] text-white",
      almacen: "bg-[#504b78] text-white",
      diseño: "bg-[#de8fd9] text-[#233154]"
    };
    return colors[area] || "bg-gray-500 text-white";
  };

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-r-0 bg-[var(--jasana-sidebar-bg)]">
      <SidebarHeader className="border-b bg-[var(--jasana-sidebar-bg)]">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--jasana-accent)]/20 to-[var(--jasana-primary)]/20 shadow-md dark:from-[var(--jasana-accent)]/30 dark:to-[var(--jasana-primary)]/30">
            <img src="../../../public/logo.svg" alt="Logo" className="h-10 w-10 object-contain" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-500 via-pink-400 to-purple-700 bg-clip-text text-transparent">
              JASANA
            </h1>
            <p className="text-xs text-muted-foreground">Sistema de Pedidos</p>
          </div>
          <SidebarTrigger className="ml-auto h-6 w-6 group-data-[collapsible=icon]:ml-0" />
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[var(--jasana-sidebar-bg)]">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Navegación Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem onClick={(e) => {if (state === "collapsed") {e.preventDefault();e.stopPropagation();}}}>
                <SidebarMenuButton 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/dashboard');
                    }}
                  isActive={location === '/dashboard'}
                  className={`h-10 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#8c69a5]/10 hover:to-[#504b78]/10 hover:scale-[1.02] hover:shadow-sm ${
                    location === '/dashboard' 
                      ? 'bg-gradient-to-r from-[#8c69a5]/20 to-[#504b78]/20 text-[#8c69a5] border-r-2 border-[#8c69a5] font-medium shadow-sm' 
                      : ''
                  }`}
                >
                  <Home className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                  <span className="transition-colors duration-200 group-data-[collapsible=icon]:hidden">Tablero</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem onClick={(e) => {if (state === "collapsed") {e.preventDefault();e.stopPropagation();}}}>
                <SidebarMenuButton 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLocation('/orders');
                  }}

                  isActive={location === '/orders'}
                  className={`h-10 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#8c69a5]/10 hover:to-[#504b78]/10 hover:scale-[1.02] hover:shadow-sm ${
                    location === '/orders' 
                      ? 'bg-gradient-to-r from-[#8c69a5]/20 to-[#504b78]/20 text-[#8c69a5] border-r-2 border-[#8c69a5] font-medium shadow-sm' 
                      : ''
                  }`}
                >
                  <Package className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                  <span className="transition-colors duration-200 group-data-[collapsible=icon]:hidden">Pedidos</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem onClick={(e) => {if (state === "collapsed") {e.preventDefault();e.stopPropagation();}}}>
                <SidebarMenuButton 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLocation('/repositions');
                  }}
                  isActive={location === '/repositions'}
                  className={`h-10 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#8c69a5]/10 hover:to-[#504b78]/10 hover:scale-[1.02] hover:shadow-sm group ${
                    location === '/repositions' 
                      ? 'bg-gradient-to-r from-[#8c69a5]/20 to-[#504b78]/20 text-[#8c69a5] border-r-2 border-[#8c69a5] font-medium shadow-sm' 
                      : ''
                  }`}
                >
                  <FileEdit className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                  <span className="transition-colors duration-200 group-data-[collapsible=icon]:hidden">Reposiciones</span>
                  {(repositionNotifications.length > 0 || pendingRepositions.length > 0) && (
                    <div className="flex gap-1 group-data-[collapsible=icon]:hidden">
                      {repositionNotifications.length > 0 && (
                        <SidebarMenuBadge className="bg-destructive text-destructive-foreground transition-transform duration-200 group-hover:scale-110">
                          {repositionNotifications.length}
                        </SidebarMenuBadge>
                      )}
                      {pendingRepositions.length > 0 && (user?.area === 'admin' || user?.area === 'envios' || user?.area === 'operaciones') && (
                        <SidebarMenuBadge className="bg-orange-500 text-white transition-transform duration-200 group-hover:scale-110">
                          {pendingRepositions.length}
                        </SidebarMenuBadge>
                      )}
                    </div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem onClick={(e) => {if (state === "collapsed") {e.preventDefault();e.stopPropagation();}}}>
                <SidebarMenuButton 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLocation('/history');
                  }}
                  isActive={location === '/history'}
                  className={`h-10 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#8c69a5]/10 hover:to-[#504b78]/10 hover:scale-[1.02] hover:shadow-sm ${
                    location === '/history' 
                      ? 'bg-gradient-to-r from-[#8c69a5]/20 to-[#504b78]/20 text-[#8c69a5] border-r-2 border-[#8c69a5] font-medium shadow-sm' 
                      : ''
                  }`}
                >
                  <History className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                  <span className="transition-colors duration-200 group-data-[collapsible=icon]:hidden">Historial</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem onClick={(e) => {if (state === "collapsed") {e.preventDefault();e.stopPropagation();}}}>
                <SidebarMenuButton 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLocation('/agenda');
                  }}
                  isActive={location === '/agenda'}
                  className={`h-10 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#8c69a5]/10 hover:to-[#504b78]/10 hover:scale-[1.02] hover:shadow-sm ${
                    location === '/agenda' 
                      ? 'bg-gradient-to-r from-[#8c69a5]/20 to-[#504b78]/20 text-[#8c69a5] border-r-2 border-[#8c69a5] font-medium shadow-sm' 
                      : ''
                  }`}
                >
                  <Calendar className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                  <span className="transition-colors duration-200 group-data-[collapsible=icon]:hidden">Agenda</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {user?.area === 'almacen' && (
                <SidebarMenuItem onClick={(e) => {if (state === "collapsed") {e.preventDefault();e.stopPropagation();}}}>
                  <SidebarMenuButton 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/almacen');
                    }}
                    isActive={location === '/almacen'}
                    className={`h-10 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#8c69a5]/10 hover:to-[#504b78]/10 hover:scale-[1.02] hover:shadow-sm ${
                      location === '/almacen' 
                        ? 'bg-gradient-to-r from-[#8c69a5]/20 to-[#504b78]/20 text-[#8c69a5] border-r-2 border-[#8c69a5] font-medium shadow-sm' 
                        : ''
                    }`}
                  >
                    <Factory className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                    <span className="transition-colors duration-200 group-data-[collapsible=icon]:hidden">Almacén</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(canCreateOrders || canCreateRepositions) && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Acciones Rápidas
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {canCreateOrders && (
                    <SidebarMenuItem onClick={(e) => {if (state === "collapsed") {e.preventDefault();e.stopPropagation();}}}>
                      <SidebarMenuButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateOrder();
                        }}
                        className="h-10 bg-gradient-to-r from-[#8c69a5]/10 to-[#504b78]/10 hover:from-[#8c69a5]/20 hover:to-[#504b78]/20 border border-[#8c69a5]/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-md group"
                      >
                        <Plus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-90" />
                        <span className="transition-colors duration-200 group-data-[collapsible=icon]:hidden">Crear Pedido</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {canCreateRepositions && (
                    <SidebarMenuItem onClick={(e) => {if (state === "collapsed") {e.preventDefault();e.stopPropagation();}}}>
                      <SidebarMenuButton 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onCreateReposition();
                        }}
                        className="h-10 bg-gradient-to-r from-[#de8fd9]/10 to-[#f8bbed]/10 hover:from-[#de8fd9]/20 hover:to-[#f8bbed]/20 border border-[#de8fd9]/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-md group"
                      >
                        <FileX className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                        <span className="transition-colors duration-200 group-data-[collapsible=icon]:hidden">Crear Reposición</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {isAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Administración
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem onClick={(e) => {if (state === "collapsed") {e.preventDefault();e.stopPropagation();}}}>
                    <SidebarMenuButton 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setLocation('/admin');
                      }}
                      isActive={location === '/admin'}
                      className={`h-10 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#8c69a5]/10 hover:to-[#504b78]/10 hover:scale-[1.02] hover:shadow-sm group ${
                        location === '/admin' 
                          ? 'bg-gradient-to-r from-[#8c69a5]/20 to-[#504b78]/20 text-[#8c69a5] border-r-2 border-[#8c69a5] font-medium shadow-sm' 
                          : ''
                      }`}
                    >
                      <Settings className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-90" />
                      <span className="transition-colors duration-200 group-data-[collapsible=icon]:hidden">Administración</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem onClick={(e) => {if (state === "collapsed") {e.preventDefault();e.stopPropagation();}}}>
                    <SidebarMenuButton 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setLocation('/metrics');
                      }}
                      isActive={location === '/metrics'}
                      className={`h-10 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#8c69a5]/10 hover:to-[#504b78]/10 hover:scale-[1.02] hover:shadow-sm ${
                        location === '/metrics' 
                          ? 'bg-gradient-to-r from-[#8c69a5]/20 to-[#504b78]/20 text-[#8c69a5] border-r-2 border-[#8c69a5] font-medium shadow-sm' 
                          : ''
                      }`}
                    >
                      <BarChart3 className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                      <span className="transition-colors duration-200 group-data-[collapsible=icon]:hidden">Métricas</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t bg-[var(--jasana-sidebar-bg)]">
        <SidebarMenu>
          <SidebarMenuItem>
            <a href={`msteams:/l/chat/0/0?users=${user?.username}`} className="block">
              <SidebarMenuButton className="h-10 w-full bg-gradient-to-r from-[#8c69a5] to-[#504b78] hover:from-[#7a5d93] hover:to-[#453c6a] text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-md group">
                <MessageSquare className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                <span className="transition-colors duration-200 group-data-[collapsible=icon]:hidden">Teams</span>
              </SidebarMenuButton>
            </a>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

// Componente wrapper para usar con SidebarProvider
export function SidebarWrapper({ onShowNotifications, onCreateOrder, onCreateReposition }: CustomSidebarProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <CustomSidebar onShowNotifications={onShowNotifications} onCreateOrder={onCreateOrder} onCreateReposition={onCreateReposition} />
    </SidebarProvider>
  );
}

// Exportar el componente principal con el nombre original para compatibilidad
export { SidebarWrapper as Sidebar };