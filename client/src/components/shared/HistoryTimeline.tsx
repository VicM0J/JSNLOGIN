import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Clock, X, Plus, Package, MapPin, Calendar } from "lucide-react";

interface HistoryEvent {
  id: number;
  action: string;
  description: string;
  createdAt: string | Date;
  fromArea?: string;
  toArea?: string;
  pieces?: number;
  userName?: string;
}

interface HistoryTimelineProps {
  events: HistoryEvent[];
  title?: string;
  type?: 'order' | 'reposition';
}

export function HistoryTimeline({ events, title = "Historial de Movimientos", type = 'order' }: HistoryTimelineProps) {
  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Mexico_City'
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="text-white" size={16} />;
      case 'transfer_created':
        return <ArrowRight className="text-white" size={16} />;
      case 'transfer_accepted':
        return <CheckCircle className="text-white" size={16} />;
      case 'transfer_rejected':
        return <X className="text-white" size={16} />;
      case 'completed':
        return <CheckCircle className="text-white" size={16} />;
      default:
        return <Clock className="text-white" size={16} />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-500';
      case 'transfer_created':
        return 'bg-blue-500';
      case 'transfer_accepted':
        return 'bg-green-500';
      case 'transfer_rejected':
        return 'bg-red-500';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAreaDisplayName = (area: string) => {
    const names: Record<string, string> = {
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

  const getActionDisplayName = (action: string) => {
    const names: Record<string, string> = {
      'created': 'Creado',
      'transfer_created': 'Transferencia Enviada',
      'transfer_accepted': 'Transferencia Aceptada',
      'transfer_rejected': 'Transferencia Rechazada',
      'completed': 'Finalizado'
    };
    return names[action] || action;
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No hay historial disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort events to ensure correct timeline order
  const sortedEvents = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedEvents.map((event, index) => (
            <div key={event.id || index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className={`w-10 h-10 ${getActionColor(event.action)} rounded-full flex items-center justify-center`}>
                {getActionIcon(event.action)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-800">
                      {getActionDisplayName(event.action)}
                    </h4>
                    <p className="text-sm text-gray-600">{event.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(event.createdAt)}
                    </p>
                    {event.userName && (
                      <p className="text-xs text-gray-500 mt-1">
                        Por: {event.userName}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {event.fromArea && event.toArea && (
                      <Badge variant="outline" className="text-xs">
                        {getAreaDisplayName(event.fromArea)} → {getAreaDisplayName(event.toArea)}
                      </Badge>
                    )}
                    {event.pieces && (
                      <Badge variant="secondary" className="text-xs">
                        {event.pieces} piezas
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}