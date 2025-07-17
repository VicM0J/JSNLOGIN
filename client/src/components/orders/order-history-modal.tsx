
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { type OrderHistory, type Area } from "@shared/schema";
import { HistoryTimeline } from "@/components/shared/HistoryTimeline";
import { Download, Filter, Clock, User, MapPin, Package, Calendar, Activity, TrendingUp, BarChart3 } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrderHistoryModalProps {
  open: boolean;
  onClose: () => void;
  orderId: number;
}

export function OrderHistoryModal({ open, onClose, orderId }: OrderHistoryModalProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [showStats, setShowStats] = useState(true);

  const { data: order } = useQuery<OrderHistory>({
    queryKey: ["/api/orders", orderId],
    enabled: !!orderId,
  });

  const { data: history = [], isLoading } = useQuery<OrderHistory[]>({
    queryKey: ["/api/orders", orderId, "history"],
    enabled: !!orderId,
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  const getAreaDisplayName = (area: Area) => {
    const names: Record<Area, string> = {
      corte: 'Corte',
      bordado: 'Bordado',
      ensamble: 'Ensamble',
      plancha: 'Plancha/Empaque',
      calidad: 'Calidad',
      envios: 'Envíos',
      admin: 'Admin'
    };
    return names[area] || area;
  };

  const formatDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const calculateStats = () => {
    if (!history.length) return null;

    const totalTime = order?.completedAt 
      ? new Date(order.completedAt).getTime() - new Date(order.createdAt).getTime()
      : new Date().getTime() - new Date(order?.createdAt || 0).getTime();

    const areaChanges = history.filter(h => h.action === 'transfer_accepted').length;
    const totalSteps = history.length;
    
    // Calcular tiempo promedio por área
    const areaTimes: Record<string, number> = {};
    let currentArea = '';
    let areaStartTime = new Date(order?.createdAt || 0);

    history.forEach((event, index) => {
      if (event.action === 'transfer_accepted' || event.action === 'created') {
        if (currentArea && event.fromArea) {
          const timeInArea = new Date(event.createdAt).getTime() - areaStartTime.getTime();
          areaTimes[currentArea] = (areaTimes[currentArea] || 0) + timeInArea;
        }
        currentArea = event.toArea || event.fromArea || '';
        areaStartTime = new Date(event.createdAt);
      }
    });

    // Agregar tiempo de área actual si no está completado
    if (currentArea && !order?.completedAt) {
      const timeInCurrentArea = new Date().getTime() - areaStartTime.getTime();
      areaTimes[currentArea] = (areaTimes[currentArea] || 0) + timeInCurrentArea;
    }

    return {
      totalTime: Math.floor(totalTime / (1000 * 60 * 60 * 24)), // días
      areaChanges,
      totalSteps,
      areaTimes,
      averageTimePerArea: Object.keys(areaTimes).length > 0 
        ? Math.floor(totalTime / (Object.keys(areaTimes).length * 1000 * 60 * 60 * 24))
        : 0
    };
  };

  const filteredHistory = history.filter(event => {
    if (filterType === "all") return true;
    return event.action === filterType;
  });

  const stats = calculateStats();

  const exportHistory = () => {
    const csvContent = [
      ['Fecha', 'Acción', 'Área Origen', 'Área Destino', 'Usuario', 'Descripción', 'Piezas'],
      ...history.map(event => [
        new Date(event.createdAt).toLocaleString('es-ES'),
        event.action,
        event.fromArea || '',
        event.toArea || '',
        event.userId || '',
        event.description || '',
        event.pieces || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial-pedido-${order?.orderId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cargando historial...</DialogTitle>
          </DialogHeader>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Historial Detallado - Pedido #{order?.orderId}</span>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStats(!showStats)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {showStats ? 'Ocultar' : 'Mostrar'} Estadísticas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportHistory}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Información del Pedido */}
        <Card className="mb-4 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-300">Cliente:</span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{order?.clienteHotel}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-300">Modelo:</span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{order?.modelo}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-300">Piezas:</span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{order?.totalPiezas}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-300">Estado:</span>
                <Badge className={order?.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'}>
                  {order?.status === 'completed' ? 'Finalizado' : 'En Proceso'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        {showStats && stats && (
          <Card className="mb-4 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center text-gray-900 dark:text-gray-100">
                <TrendingUp className="h-4 w-4 mr-2" />
                Estadísticas del Pedido
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border dark:border-blue-900/30">
                  <Clock className="h-6 w-6 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">Tiempo Total</p>
                  <p className="font-bold text-blue-600 dark:text-blue-400">{stats.totalTime} días</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border dark:border-green-900/30">
                  <MapPin className="h-6 w-6 mx-auto mb-1 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">Cambios de Área</p>
                  <p className="font-bold text-green-600 dark:text-green-400">{stats.areaChanges}</p>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border dark:border-purple-900/30">
                  <Activity className="h-6 w-6 mx-auto mb-1 text-purple-600 dark:text-purple-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Eventos</p>
                  <p className="font-bold text-purple-600 dark:text-purple-400">{stats.totalSteps}</p>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border dark:border-orange-900/30">
                  <BarChart3 className="h-6 w-6 mx-auto mb-1 text-orange-600 dark:text-orange-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">Promedio/Área</p>
                  <p className="font-bold text-orange-600 dark:text-orange-400">{stats.averageTimePerArea}d</p>
                </div>
              </div>

              {/* Tiempo por área */}
              {Object.keys(stats.areaTimes).length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Tiempo por Área:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(stats.areaTimes).map(([area, time]) => (
                      <div key={area} className="text-sm p-2 bg-gray-50 dark:bg-slate-700 rounded border dark:border-slate-600">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{getAreaDisplayName(area as Area)}:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-300">
                          {formatDuration(new Date(Date.now() - time).toISOString())}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <Card className="mb-4 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder="Filtrar eventos" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700">
                  <SelectItem value="all" className="text-gray-900 dark:text-gray-100">Todos los eventos</SelectItem>
                  <SelectItem value="created" className="text-gray-900 dark:text-gray-100">Creación</SelectItem>
                  <SelectItem value="transfer_requested" className="text-gray-900 dark:text-gray-100">Transferencias solicitadas</SelectItem>
                  <SelectItem value="transfer_accepted" className="text-gray-900 dark:text-gray-100">Transferencias aceptadas</SelectItem>
                  <SelectItem value="completed" className="text-gray-900 dark:text-gray-100">Finalizaciones</SelectItem>
                  <SelectItem value="paused" className="text-gray-900 dark:text-gray-100">Pausas</SelectItem>
                  <SelectItem value="resumed" className="text-gray-900 dark:text-gray-100">Reanudaciones</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {filteredHistory.length} de {history.length} eventos
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Contenedor del Historial */}
        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardContent className="p-4">
            <HistoryTimeline 
              events={filteredHistory} 
              title={`Historial del Pedido #${order?.orderId}`}
              type="order"
              showDetailedInfo={true}
            />
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
