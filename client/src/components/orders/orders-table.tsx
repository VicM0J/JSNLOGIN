import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Order, type Area } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, ArrowRight, History, CheckCircle, Pause, Play, Trash2 } from "lucide-react";
import Swal from 'sweetalert2';

interface OrdersTableProps {
  searchTerm: string;
  onTransferOrder: (orderId: number) => void;
  onViewHistory: (orderId: number) => void;
  onViewDetails: (orderId: number) => void;
}

export function OrdersTable({
  searchTerm,
  onTransferOrder,
  onViewHistory,
  onViewDetails,
}: OrdersTableProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pauseDialog, setPauseDialog] = useState(false);
  const [pauseReason, setPauseReason] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const trashIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" class="animate-bounce text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="48" height="48">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
</svg>
`;
  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/orders');
      return response.json();
    },
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/complete`);
      return await res.json();
    },
   onSuccess: () => {
  Swal.fire({
    title: '¡Pedido finalizado!',
    text: 'El pedido ha sido marcado como completado exitosamente.',
    icon: 'success',
    confirmButtonText: 'Aceptar',
    customClass: {
      popup: 'font-sans',
    },
    backdrop: `
      rgba(0,0,123,0.4)
      url("https://sweetalert2.github.io/images/nyan-cat.gif")
      left top
      no-repeat
    `,
    timer: 2500,
    timerProgressBar: true,
    showClass: {
      popup: 'animate__animated animate__fadeInDown'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp'
    }
  });

  queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
  queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
},

    onError: (error: Error) => {
      toast({
        title: "Error al finalizar pedido",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteOrderMutation = useMutation({
  mutationFn: async (orderId: number) => {
    const res = await apiRequest("DELETE", `/api/orders/${orderId}`);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Error ${res.status}: ${errorText}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await res.json();
    }


    return null;
  },
  onSuccess: () => {
    Swal.fire({
          title: "Pedido eliminado",
          html: `
            <div class="flex flex-col items-center space-y-4">
              ${trashIconSvg}
              <p>El pedido ha sido eliminado permanentemente</p>
            </div>
          `,
          icon: undefined,
          showConfirmButton: true,
          confirmButtonText: "Aceptar",
          timer: 2500,
          customClass: {
            popup: "font-sans",
          },
        });
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
  },
  onError: (error: Error) => {
    toast({
      title: "Error al eliminar pedido",
      description: error.message,
      variant: "destructive",
    });
  },
});

  const pauseOrderMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: number; reason: string }) => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/pause`, { reason });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pedido pausado",
        description: "El pedido ha sido pausado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setPauseDialog(false);
      setPauseReason('');
      setSelectedOrder(null);
    },
    onError: (error: Error) => {
      Swal.fire({
  icon: 'error',
  title: 'No puedes pausar el pedido mientras otra área tiene piezas parciales.',
  text: 'Espera a tener el pedido completo',
  confirmButtonText: 'Entendido',
  timer: 5000,
  timerProgressBar: true
});
    },
  });

  const resumeOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/resume`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pedido reanudado",
        description: "El pedido ha sido reanudado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al reanudar pedido",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePauseOrder = (order: Order) => {
    setSelectedOrder(order);
    setPauseDialog(true);
  };

  const handleConfirmPause = () => {
    if (selectedOrder) {
      pauseOrderMutation.mutate({ orderId: selectedOrder.id, reason: pauseReason });
    }
  };

  const handleResumeOrder = (orderId: number) => {
    resumeOrderMutation.mutate(orderId);
  };


  const getAreaBadgeColor = (area: Area) => {
    const colors: Record<Area, string> = {
      corte: "badge-corte",
      bordado: "badge-bordado", 
      ensamble: "badge-ensamble",
      plancha: "badge-plancha",
      calidad: "badge-calidad",
      envios: "badge-envios",
      almacen: "bg-indigo-100 text-indigo-800",
      admin: "badge-admin",
    };
    return colors[area] || "bg-gray-100 text-gray-800";
  };

  const getStatusBadgeColor = (status: string) => {
    if (status === 'completed') return "status-completed";
    if (status === 'paused') return "status-paused";
    return "status-active";
  };

  const getAreaDisplayName = (area: Area) => {
    const names: Record<Area, string> = {
      corte: 'Corte',
      bordado: 'Bordado',
      ensamble: 'Ensamble',
      plancha: 'Plancha/Empaque',
      calidad: 'Calidad',
      envios: 'Envíos',
      almacen: 'Almacén',
      admin: 'Admin'
    };
    return names[area] || area;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === "" || 
      order.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clienteHotel.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = areaFilter === "all" || order.currentArea === areaFilter;
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesArea && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Pedidos Recientes</CardTitle>
          <div className="flex space-x-2">
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Áreas</SelectItem>
                <SelectItem value="corte">Corte</SelectItem>
                <SelectItem value="bordado">Bordado</SelectItem>
                <SelectItem value="ensamble">Ensamble</SelectItem>
                <SelectItem value="plancha">Plancha/Empaque</SelectItem>
                <SelectItem value="calidad">Calidad</SelectItem>
                <SelectItem value="envios">Envíos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="completed">Finalizados</SelectItem>
                <SelectItem value="paused">Pausados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio</TableHead>
                <TableHead>Cliente/Hotel</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Área Actual</TableHead>
                <TableHead>Piezas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-medium">{order.folio}</div>
                    <div className="text-sm text-gray-500">{order.noSolicitud}</div>
                  </TableCell>
                  <TableCell>{order.clienteHotel}</TableCell>
                  <TableCell>
                    <div className="font-medium">{order.modelo}</div>
                    <div className="text-sm text-gray-500">
                      {order.tipoPrenda} - {order.color}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getAreaBadgeColor(order.currentArea)}>
                      {getAreaDisplayName(order.currentArea)}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.totalPiezas}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(order.status)}>
                      {order.status === 'completed' ? 'Finalizado' : 
                       order.status === 'paused' ? 'Pausado' : 'En Proceso'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewDetails(order.id)}
                        title="Ver detalles"
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {order.status === 'active' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onTransferOrder(order.id)}
                          title="Transferir"
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}

                      {order.currentArea === user?.area && order.status === 'active' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePauseOrder(order)}
                          title="Pausar pedido"
                          className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}

                      {order.currentArea === user?.area && order.status === 'paused' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResumeOrder(order.id)}
                          title="Reanudar pedido"
                          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}

                      {user?.area === 'envios' && order.status === 'active' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => completeOrderMutation.mutate(order.id)}
                          disabled={completeOrderMutation.isPending}
                          title="Finalizar pedido"
                          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewHistory(order.id)}
                        title="Ver historial"
                        className="bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                      >
                        <History className="h-4 w-4" />
                      </Button>

                      {user?.area === 'admin' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            Swal.fire({
                              title: '¿Eliminar pedido?',
                              text: 'Esta acción no se puede deshacer.',
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonText: 'Sí, eliminar',
                              cancelButtonText: 'Cancelar',
                              confirmButtonColor: '#e3342f',
                              cancelButtonColor: '#6c757d',
                              customClass: {
                                popup: 'font-sans',
                              },
                            }).then((result) => {
                              if (result.isConfirmed) {
                                deleteOrderMutation.mutate(order.id);
                              }
                            });
                          }}
                          disabled={deleteOrderMutation.isPending}
                          title="Eliminar pedido"
                          className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Modal de Pausa */}
      <Dialog open={pauseDialog} onOpenChange={(open) => {
        setPauseDialog(open);
        if (!open) {
          setPauseReason('');
          setSelectedOrder(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pausar Pedido</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Al pausar este pedido, se detendrá temporalmente su procesamiento. 
              Debes explicar el motivo de la pausa.
            </p>
            {selectedOrder && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium">Pedido: {selectedOrder.folio}</p>
                <p className="text-sm text-gray-600">Cliente: {selectedOrder.clienteHotel}</p>
                <p className="text-sm text-gray-600">Modelo: {selectedOrder.modelo}</p>
              </div>
            )}
            <div>
              <Label htmlFor="pause-reason">Motivo de la pausa *</Label>
              <Textarea
                id="pause-reason"
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="Ejemplo: Falta de material específico, problema con maquinaria, etc..."
                required
                rows={4}
                className="min-h-[100px] resize-none"
              />
              {pauseReason.trim().length > 0 && pauseReason.trim().length < 10 && (
                <p className="text-sm text-red-600 mt-1">
                  El motivo debe tener al menos 10 caracteres (actual: {pauseReason.trim().length})
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPauseDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmPause}
              disabled={!pauseReason.trim() || pauseReason.trim().length < 10 || pauseOrderMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {pauseOrderMutation.isPending ? 'Pausando...' : 'Pausar Pedido'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}