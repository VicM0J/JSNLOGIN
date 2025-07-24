import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, CheckCircle, Info, Clock, Bell, Package, RefreshCw, Plus, X, XCircle, Trash2, BellRing, Settings, AlertTriangle } from "lucide-react";
import { type Transfer } from "@shared/schema";
import { useState } from "react";
import { NotificationPermission } from './notification-permission';

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();


  const { data: pendingTransfers = [] } = useQuery<Transfer[]>({
    queryKey: ["/api/transfers/pending"],
    enabled: open,
  });

  const { data: repositionNotifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: open,
    refetchInterval: 2000,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/notifications");
      const allNotifications = await res.json();
      return allNotifications.filter((n: any) => 
        !n.read && (
          n.type?.includes('reposition') || 
          n.type?.includes('completion') ||
          n.type === 'new_reposition' ||
          n.type === 'reposition_transfer' ||
          n.type === 'reposition_approved' ||
          n.type === 'reposition_rejected' ||
          n.type === 'reposition_completed' ||
          n.type === 'reposition_deleted' ||
          n.type === 'completion_approval_needed' ||
          n.type === 'partial_transfer_warning'
        )
      );
    },
  });

  const acceptTransferMutation = useMutation({
    mutationFn: async (transferId: number) => {
      const res = await apiRequest("POST", `/api/transfers/${transferId}/accept`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transferencia aceptada",
        description: "La transferencia ha sido aceptada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transfers/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al aceptar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectTransferMutation = useMutation({
    mutationFn: async (transferId: number) => {
      const res = await apiRequest("POST", `/api/transfers/${transferId}/reject`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transferencia rechazada",
        description: "La transferencia ha sido rechazada",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transfers/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al rechazar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("POST", `/api/repositions/${notificationId}/read`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const getAreaDisplayName = (area: string) => {
    const names: Record<string, string> = {
      corte: "Corte",
      bordado: "Bordado",
      ensamble: "Ensamble",
      plancha: "Plancha/Empaque",
      calidad: "Calidad",
      envios: "Envíos",
      admin: "Admin",
      diseño: "Diseño",
    };
    return names[area] || area;
  };

  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === "string" 
      ? new Date(dateInput.endsWith('Z') ? dateInput : dateInput + 'Z')
      : dateInput;

    const now = new Date();
    const mexicoNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
    const mexicoDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));

    const diffMs = mexicoNow.getTime() - mexicoDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    const timeFormat = date.toLocaleString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Mexico_City'
    });

    if (diffDays > 0) {
      return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""} - ${date.toLocaleString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/Mexico_City'
      })}`;
    } else if (diffHours > 0) {
      return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""} - ${timeFormat}`;
    } else if (diffMinutes > 0) {
      return `Hace ${diffMinutes} minuto${diffMinutes > 1 ? "s" : ""} - ${timeFormat}`;
    } else {
      return `Hace unos segundos - ${timeFormat}`;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transfer':
        return <ArrowRight className="w-4 h-4" />;
      case 'order_completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'order_created':
        return <Plus className="w-4 h-4" />;
      case 'new_reposition':
      case 'reposition_created':
        return <Plus className="w-4 h-4" />;
      case 'reposition_approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'reposition_rejected':
        return <XCircle className="w-4 h-4" />;
      case 'reposition_completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'reposition_deleted':
        return <Trash2 className="w-4 h-4" />;
      case 'reposition_transfer':
        return <ArrowRight className="w-4 h-4" />;
      case 'transfer_processed':
        return <RefreshCw className="w-4 h-4" />;
      case 'reposition_received':
        return <Package className="w-4 h-4" />;
      case 'completion_approval_needed':
        return <Clock className="w-4 h-4" />;
      case 'partial_transfer_warning':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'transfer':
      case 'reposition_transfer':
      case 'transfer_processed':
        return "bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800";
      case 'order_completed':
      case 'reposition_approved':
      case 'reposition_completed':
      case 'reposition_received':
        return "bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800";
      case 'order_created':
      case 'new_reposition':
      case 'reposition_created':
        return "bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:border-purple-800";
      case 'reposition_rejected':
      case 'reposition_deleted':
        return "bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800";
      case 'completion_approval_needed':
      case 'partial_transfer_warning':
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/50 dark:border-yellow-800";
      default:
        return "bg-muted border-border";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'transfer':
      case 'reposition_transfer':
      case 'transfer_processed':
        return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30";
      case 'order_completed':
      case 'reposition_approved':
      case 'reposition_completed':
      case 'reposition_received':
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30";
      case 'order_created':
      case 'new_reposition':
      case 'reposition_created':
        return "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30";
      case 'reposition_rejected':
      case 'reposition_deleted':
        return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30";
      case 'completion_approval_needed':
      case 'partial_transfer_warning':
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const totalNotifications = repositionNotifications.length + pendingTransfers.length;



  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[90vw] sm:w-[420px] md:w-[480px] lg:w-[540px] max-w-[600px] bg-background border-l border-border">
        <SheetHeader className="border-b border-border pb-6">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                  <BellRing className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  Notificaciones
                </h2>
                <p className="text-sm text-muted-foreground font-normal">
                  {totalNotifications > 0 ? `${totalNotifications} notificación${totalNotifications > 1 ? 'es' : ''} pendiente${totalNotifications > 1 ? 's' : ''}` : 'Todo al día'}
                </p>
              </div>
            </div>
            {totalNotifications > 0 && (
              <div className="relative">
                <Badge className="bg-destructive text-destructive-foreground border-0 shadow-sm">
                  {totalNotifications}
                </Badge>
              </div>
            )}
          </SheetTitle>


        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          <NotificationPermission />
          {repositionNotifications.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <h3 className="text-sm font-semibold text-foreground">Reposiciones</h3>
                <Badge variant="secondary" className="text-xs">
                  {repositionNotifications.length}
                </Badge>
              </div>
              {repositionNotifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`relative overflow-hidden rounded-lg border ${getNotificationColor(notification.type)} transition-all duration-200 hover:shadow-md cursor-pointer group`}
                  onClick={() => markNotificationReadMutation.mutate(notification.id)}
                >
                  <div className="relative p-3 md:p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 md:w-12 md:h-12 ${getIconColor(notification.type)} rounded-lg flex items-center justify-center`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-sm leading-tight">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3">
                          {notification.repositionId && (
                            <Badge variant="outline" className="text-xs font-medium w-fit">
                              Reposición #{notification.repositionId}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                        {notification.type === 'completion_approval_needed' && (
                          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/50 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
                              ⚠️ Solicitud de finalización pendiente de aprobación
                            </p>
                          </div>
                        )}
                        {notification.type === 'partial_transfer_warning' && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800">
                            <p className="text-xs text-red-800 dark:text-red-200 font-medium">
                              🚫 RESTRICCIÓN: No puedes pausar este pedido hasta recibir la orden completa
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pendingTransfers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-foreground">Transferencias Pendientes</h3>
                <Badge variant="secondary" className="text-xs">
                  {pendingTransfers.length}
                </Badge>
              </div>
              {pendingTransfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="relative overflow-hidden rounded-lg border bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800 transition-all duration-200 hover:shadow-md group"
                >
                  <div className="relative p-3 md:p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-sm leading-tight">
                          {transfer.pieces} piezas desde {getAreaDisplayName(transfer.fromArea)}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(transfer.createdAt)}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 mt-3">
                          <Button
                            size="sm"
                            className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => acceptTransferMutation.mutate(transfer.id)}
                            disabled={acceptTransferMutation.isPending}
                          >
                            {acceptTransferMutation.isPending ? (
                              <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            )}
                            Aceptar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 px-3"
                            onClick={() => rejectTransferMutation.mutate(transfer.id)}
                            disabled={rejectTransferMutation.isPending}
                          >
                            {rejectTransferMutation.isPending ? (
                              <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notificaciones del sistema */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
              <h3 className="text-sm font-semibold text-foreground">Sistema</h3>
            </div>

            <div className="relative overflow-hidden rounded-lg border bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800 transition-all duration-200 hover:shadow-md group">
              <div className="relative p-3 md:p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground text-sm">Bienvenido a JASANA</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sistema de gestión listo para usar
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Ahora</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {totalNotifications === 0 && (
            <div className="text-center py-12 md:py-16">
              <div className="relative">
                <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-green-500" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">¡Todo al día!</h3>
              <p className="text-sm text-muted-foreground">No tienes notificaciones pendientes</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}