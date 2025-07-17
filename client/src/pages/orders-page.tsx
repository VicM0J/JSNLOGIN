import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, ArrowRight, History, Plus, CheckCircle, Trash2, Pause, Play, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Order, type Area } from "@shared/schema";
import { TransferModal } from "@/components/orders/transfer-modal";
import { OrderHistoryModal } from "@/components/orders/order-history-modal";
import { OrderDetailsModal } from "@/components/orders/order-details-modal";
import Swal from 'sweetalert2';

export default function OrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showMyOrdersOnly, setShowMyOrdersOnly] = useState(false);

  const [showTransfer, setShowTransfer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [pauseDialog, setPauseDialog] = useState(false);
  const [pauseReason, setPauseReason] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      console.log(`[ORDERS PAGE - ${user?.area}] Fetching orders...`);
      const response = await fetch('/api/orders', {
        credentials: 'include'
      });

      if (!response.ok) {
        console.error(`[ORDERS PAGE - ${user?.area}] Failed to fetch orders:`, response.status, response.statusText);
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[ORDERS PAGE - ${user?.area}] Received ${data.length} orders`);

      // Enhanced logging for bordado
      if (user?.area === 'bordado') {
        console.log(`[BORDADO PAGE] Successfully fetched ${data.length} orders`);
        console.log(`[BORDADO PAGE] Orders by area:`, data.reduce((acc: any, order: any) => {
          acc[order.currentArea] = (acc[order.currentArea] || 0) + 1;
          return acc;
        }, {}));
      }

      return data;
    },
    enabled: !!user, // Only fetch when user is authenticated
    retry: 1,
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/complete`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pedido finalizado",
        description: "El pedido ha sido marcado como completado",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
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
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pedido eliminado",
        description: "El pedido ha sido eliminado permanentemente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
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
      setPauseDialog(false);
      setPauseReason("");
      setSelectedOrder(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error al pausar pedido",
        description: error.message,
        variant: "destructive",
        duration: 8000, // Longer duration for partial transfer messages
      });
    },
  });

  const resumeOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/resume`);
      return await res.json();
    },
    onSuccess: () => {
      Swal.fire({
        title: '¡Pedido reanudado!',
        text: 'El pedido ha sido reanudado correctamente.',
        icon: 'success',
        confirmButtonColor: '#10B981'
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al reanudar pedido",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const canCreateOrders = user?.area === 'corte' || user?.area === 'admin';

  const getAreaBadgeColor = (area: Area) => {
    const colors: Record<Area, string> = {
      patronaje: "bg-amber-100 text-amber-800",
      corte: "bg-green-100 text-green-800",
      bordado: "bg-blue-100 text-blue-800",
      ensamble: "bg-purple-100 text-purple-800",
      plancha: "bg-orange-100 text-orange-800",
      calidad: "bg-pink-100 text-pink-800",
      envios: "bg-purple-100 text-purple-800",
      almacen: "bg-indigo-100 text-indigo-800",
      admin: "bg-gray-100 text-gray-800",
      diseño: "bg-cyan-100 text-cyan-800",
      operaciones: "bg-teal-100 text-teal-800",
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
      patronaje: 'Patronaje',
      corte: 'Corte',
      bordado: 'Bordado',
      ensamble: 'Ensamble',
      plancha: 'Plancha/Empaque',
      calidad: 'Calidad',
      envios: 'Envíos',
      almacen: 'Almacén',
      admin: 'Admin',
      diseño: 'Diseño',
      operaciones: 'Operaciones'
    };
    return names[area] || area;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === "" || 
      order.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clienteHotel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.noSolicitud?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tipoPrenda?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tela?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = areaFilter === "all" || order.currentArea === areaFilter;
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    const matchesDateRange = (() => {
      if (dateRangeFilter === "all") return true;

      const orderDate = new Date(order.createdAt);
      const now = new Date();

      switch (dateRangeFilter) {
        case "today":
          return orderDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        case "quarter":
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          return orderDate >= quarterAgo;
        default:
          return true;
      }
    })();

    const matchesPriority = priorityFilter === "all" || 
      (order.totalPiezas >= 100 && priorityFilter === "high") ||
      (order.totalPiezas >= 50 && order.totalPiezas < 100 && priorityFilter === "medium") ||
      (order.totalPiezas < 50 && priorityFilter === "low");

    const matchesMyOrders = !showMyOrdersOnly || order.currentArea === user?.area;

    return matchesSearch && matchesArea && matchesStatus && matchesDateRange && matchesPriority && matchesMyOrders;
  });

  const handleTransferOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setShowTransfer(true);
  };

  const handleViewHistory = (orderId: number) => {
    setSelectedOrderId(orderId);
    setShowHistory(true);
  };

  const handleViewDetails = (orderId: number) => {
    setSelectedOrderId(orderId);
    setShowDetails(true);
  };

  const handlePauseOrder = (order: Order) => {
    setSelectedOrder(order);
    setPauseDialog(true);
  };

  const handleConfirmPause = () => {
    if (selectedOrder && pauseReason.trim()) {
      pauseOrderMutation.mutate({ 
        orderId: selectedOrder.id, 
        reason: pauseReason.trim() 
      });
    }
  };

  const handleResumeOrder = (orderId: number) => {
    Swal.fire({
      title: '¿Reanudar pedido?',
      text: 'El pedido volverá a estar activo y podrá continuar su proceso.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#EF4444',
      confirmButtonText: 'Sí, reanudar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        resumeOrderMutation.mutate(orderId);
      }
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Pedidos</h1>
          <p className="text-gray-600 mt-2">Control completo de pedidos y transferencias</p>
        </div>

      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border-blue-200 dark:border-slate-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
            <Search className="w-5 h-5" />
            Búsqueda y Filtros Avanzados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative col-span-1 md:col-span-2">
              <Input
                type="text"
                placeholder="Buscar por folio, cliente, modelo, No. solicitud, tipo de prenda..."
                className="pl-10 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-300" />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Áreas</SelectItem>
                <SelectItem value="patronaje">Patronaje</SelectItem>
                <SelectItem value="corte">Corte</SelectItem>
                <SelectItem value="bordado">Bordado</SelectItem>
                <SelectItem value="ensamble">Ensamble</SelectItem>
                <SelectItem value="plancha">Plancha/Empaque</SelectItem>
                <SelectItem value="calidad">Calidad</SelectItem>
                <SelectItem value="envios">Envíos</SelectItem>
                <SelectItem value="almacen">Almacén</SelectItem>
                <SelectItem value="diseño">Diseño</SelectItem>
                <SelectItem value="operaciones">Operaciones</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="active">En Proceso</SelectItem>
                <SelectItem value="paused">Pausados</SelectItem>
                <SelectItem value="completed">Finalizados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las fechas</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
                <SelectItem value="quarter">Último trimestre</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="my-orders-only"
                checked={showMyOrdersOnly}
                onChange={(e) => setShowMyOrdersOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="my-orders-only" className="text-sm font-medium">
                Solo mis pedidos
              </label>
            </div>
          </div>

          {/* Resumen de filtros activos */}
          <div className="flex flex-wrap gap-2 mt-4">
            {(searchTerm || areaFilter !== 'all' || statusFilter !== 'all' || dateRangeFilter !== 'all' || priorityFilter !== 'all' || showMyOrdersOnly) && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Filtros activos:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Búsqueda: "{searchTerm.substring(0, 20)}{searchTerm.length > 20 ? '...' : ''}"
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                  </Badge>
                )}
                {areaFilter !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Área: {getAreaDisplayName(areaFilter as Area)}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setAreaFilter('all')} />
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Estado: {statusFilter === 'active' ? 'En proceso' : statusFilter === 'paused' ? 'Pausado' : 'Finalizado'}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setAreaFilter('all');
                    setStatusFilter('all');
                    setDateRangeFilter('all');
                    setPriorityFilter('all');
                    setShowMyOrdersOnly(false);
                  }}
                  className="h-6 text-xs"
                >
                  Limpiar todo
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Pedidos ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Folio</TableHead>
                    <TableHead>Cliente/Hotel</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Color</TableHead>
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
                      <TableCell className="font-medium">{order.modelo}</TableCell>
                      <TableCell>{order.tipoPrenda}</TableCell>
                      <TableCell>{order.color}</TableCell>
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
                        <div className="flex space-x-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            title="Ver detalles"
                            onClick={() => handleViewDetails(order.id)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {order.status === 'active' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleTransferOrder(order.id)}
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
                            onClick={() => handleViewHistory(order.id)}
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
                                  confirmButtonColor: '#EF4444',
                                  cancelButtonColor: '#6B7280',
                                  confirmButtonText: 'Sí, eliminar',
                                  cancelButtonText: 'Cancelar'
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

              {filteredOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron pedidos con los filtros aplicados
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

        {/* Modals */}
        {showTransfer && selectedOrderId && (
          <TransferModal
            open={showTransfer}
            onClose={() => setShowTransfer(false)}
            orderId={selectedOrderId}
          />
        )}

        {showHistory && selectedOrderId && (
          <OrderHistoryModal
            open={showHistory}
            onClose={() => setShowHistory(false)}
            orderId={selectedOrderId}
          />
        )}

        {showDetails && selectedOrderId && (
          <OrderDetailsModal
            open={showDetails}
            onClose={() => setShowDetails(false)}
            orderId={selectedOrderId}
          />
        )}

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
      </div>
    </Layout>
  );
}