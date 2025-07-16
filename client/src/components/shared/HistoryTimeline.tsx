
import { type OrderHistory, type Area } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Package, User, Clock, AlertCircle, CheckCircle, Play, Pause, ArrowRight } from "lucide-react";

interface HistoryTimelineProps {
  events: OrderHistory[];
  title?: string;
  type?: 'order' | 'reposition';
  showDetailedInfo?: boolean;
}

export function HistoryTimeline({ events, title, type = 'order', showDetailedInfo = false }: HistoryTimelineProps) {
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

  const getAreaBadgeColor = (area: Area) => {
    const colors: Record<Area, string> = {
      corte: "bg-red-100 text-red-800",
      bordado: "bg-blue-100 text-blue-800",
      ensamble: "bg-green-100 text-green-800",
      plancha: "bg-yellow-100 text-yellow-800",
      calidad: "bg-purple-100 text-purple-800",
      envios: "bg-indigo-100 text-indigo-800",
      admin: "bg-gray-100 text-gray-800",
    };
    return colors[area] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Mexico_City'
    });
  };

  const formatDateShort = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getTimeDifference = (currentDate: string, previousDate?: string) => {
    if (!previousDate) return null;
    
    const current = new Date(currentDate);
    const previous = new Date(previousDate);
    const diffMs = current.getTime() - previous.getTime();
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `+${days}d ${hours}h`;
    if (hours > 0) return `+${hours}h ${minutes}m`;
    return `+${minutes}m`;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Package className="h-4 w-4" />;
      case 'transfer_accepted':
        return <MapPin className="h-4 w-4" />;
      case 'transfer_requested':
        return <ArrowRight className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'resumed':
        return <Play className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'transfer_accepted':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'transfer_requested':
        return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'completed':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'paused':
        return 'bg-red-100 text-red-600 border-red-200';
      case 'resumed':
        return 'bg-green-100 text-green-600 border-green-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getActionLabel = (action: string, fromArea?: string, toArea?: string) => {
    switch (action) {
      case 'created':
        return 'Pedido Creado';
      case 'transfer_accepted':
        return fromArea && toArea ? `Transferido: ${getAreaDisplayName(fromArea as Area)} → ${getAreaDisplayName(toArea as Area)}` : 'Transferido';
      case 'transfer_requested':
        return fromArea && toArea ? `Solicitud: ${getAreaDisplayName(fromArea as Area)} → ${getAreaDisplayName(toArea as Area)}` : 'Transferencia Solicitada';
      case 'completed':
        return 'Pedido Finalizado';
      case 'paused':
        return 'Pedido Pausado';
      case 'resumed':
        return 'Pedido Reanudado';
      default:
        return action;
    }
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No hay eventos en el historial</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        {title && (
          <h3 className="font-semibold mb-4 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            {title}
          </h3>
        )}
        
        <div className="space-y-6">
          {events.map((event, index) => {
            const isLast = index === events.length - 1;
            const timeDiff = index > 0 ? getTimeDifference(event.createdAt, events[index - 1].createdAt) : null;
            
            return (
              <div key={event.id} className="relative">
                {/* Línea conectora */}
                {!isLast && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                )}
                
                <div className="flex items-start space-x-4">
                  {/* Icono de acción */}
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${getActionColor(event.action)}`}>
                    {getActionIcon(event.action)}
                  </div>
                  
                  {/* Contenido del evento */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      {/* Header del evento */}
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {getActionLabel(event.action, event.fromArea, event.toArea)}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {timeDiff && (
                            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                              {timeDiff}
                            </span>
                          )}
                          <span className="text-sm text-gray-500">
                            {showDetailedInfo ? formatDate(event.createdAt) : formatDateShort(event.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Badges de áreas */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {event.fromArea && (
                          <Badge className={getAreaBadgeColor(event.fromArea as Area)} variant="outline">
                            Desde: {getAreaDisplayName(event.fromArea as Area)}
                          </Badge>
                        )}
                        {event.toArea && (
                          <Badge className={getAreaBadgeColor(event.toArea as Area)}>
                            Hacia: {getAreaDisplayName(event.toArea as Area)}
                          </Badge>
                        )}
                      </div>

                      {/* Descripción */}
                      {event.description && (
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      )}

                      {/* Información adicional */}
                      {showDetailedInfo && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 bg-gray-50 p-3 rounded">
                          {event.userId && (
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              <span>Usuario: {event.userId}</span>
                            </div>
                          )}
                          {event.pieces && (
                            <div className="flex items-center">
                              <Package className="h-3 w-3 mr-1" />
                              <span>Piezas: {event.pieces}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>ID: {event.id}</span>
                          </div>
                          <div className="flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            <span>Tipo: {event.action}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumen al final */}
        {showDetailedInfo && events.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Total de eventos: {events.length}</span>
              <span>
                Duración: {events.length > 1 ? getTimeDifference(
                  events[events.length - 1].createdAt, 
                  events[0].createdAt
                ) : '0m'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
