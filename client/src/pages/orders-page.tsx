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
import { Search, Eye, ArrowRight, History, Plus, CheckCircle, Trash2, Pause, Play } from "lucide-react";
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

  const [showTransfer, setShowTransfer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [pauseDialog, setPauseDialog] = useState(false);
  const [pauseReason, setPauseReason] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
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
    if (status === 'completed') return "bg-green-100 text-green-800";
    if (status === 'paused') return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
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
      order.modelo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = areaFilter === "all" || order.currentArea === areaFilter;
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesArea && matchesStatus;
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
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar por folio, cliente o modelo..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>

            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por área" />
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
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="active">En Proceso</SelectItem>
                <SelectItem value="paused">Pausados</SelectItem>
                <SelectItem value="completed">Finalizados</SelectItem>
              </SelectContent>
            </Select>
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