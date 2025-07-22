import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Ticket, Clock, CheckCircle, XCircle, Ban, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateSystemTicketModal } from "./CreateSystemTicketModal";
import { SystemTicketDetailModal } from "./SystemTicketDetailModal";
import { useAuth } from "@/hooks/use-auth";
import { Area } from "@shared/schema";

interface SystemTicket {
  id: number;
  ticketNumber: string;
  requesterName: string;
  requesterArea: Area;
  requestDate: string;
  ticketType: string;
  otherTypeDescription?: string;
  description: string;
  urgency: "alta" | "media" | "baja";
  status: "pendiente" | "aceptada" | "finalizada" | "rechazada" | "cancelada";
  receivedBy?: number;
  attentionDate?: string;
  solution?: string;
  createdAt: string;
  hasUnreadMessages?: boolean;
  lastMessageTime?: string;
}

interface SystemTicketListProps {
  userArea: Area;
}

export function SystemTicketList({ userArea }: SystemTicketListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SystemTicket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["system-tickets"],
    queryFn: async () => {
      const response = await fetch("/api/system-tickets", {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch tickets");
      const ticketsData = await response.json();

      // Verificar mensajes sin leer para cada ticket
      const ticketsWithUnreadStatus = await Promise.all(
        ticketsData.map(async (ticket: SystemTicket) => {
          try {
            const unreadResponse = await fetch(`/api/system-tickets/${ticket.id}/messages/unread`, {
              credentials: "include"
            });
            if (unreadResponse.ok) {
              const unreadData = await unreadResponse.json();
              return {
                ...ticket,
                hasUnreadMessages: unreadData.hasUnread || false,
                lastMessageTime: unreadData.lastMessageTime
              };
            }
          } catch (error) {
            console.error(`Error checking unread messages for ticket ${ticket.id}:`, error);
          }
          return ticket;
        })
      );

      return ticketsWithUnreadStatus;
    },
    refetchInterval: 3000,
  });

  const getTicketTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      soporte_hardware: "Soporte técnico (hardware)",
      soporte_software: "Soporte técnico (software)",
      problemas_red: "Problemas de red o internet",
      acceso_permisos: "Solicitud de acceso o permisos",
      instalacion_configuracion: "Instalación o configuración",
      otro: "Otro"
    };
    return types[type] || type;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "alta": return "bg-red-100 text-red-800 border-red-200";
      case "media": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "baja": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente": return "bg-blue-100 text-blue-800 border-blue-200";
      case "aceptada": return "bg-orange-100 text-orange-800 border-orange-200";
      case "finalizada": return "bg-green-100 text-green-800 border-green-200";
      case "rechazada": return "bg-red-100 text-red-800 border-red-200";
      case "cancelada": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pendiente": return <Clock className="w-4 h-4" />;
      case "aceptada": return <Eye className="w-4 h-4" />;
      case "finalizada": return <CheckCircle className="w-4 h-4" />;
      case "rechazada": return <XCircle className="w-4 h-4" />;
      case "cancelada": return <Ban className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getAreaDisplayName = (area: string) => {
    const names: Record<string, string> = {
      corte: "Corte",
      bordado: "Bordado", 
      ensamble: "Ensamble",
      plancha: "Plancha/Empaque",
      calidad: "Calidad",
      envios: "Envíos",
      patronaje: "Patronaje",
      almacen: "Almacén",
      diseño: "Diseño",
      admin: "Administración",
      sistemas: "Sistemas",
      operaciones: "Operaciones"
    };
    return names[area] || area;
  };

  const handleViewTicket = (ticket: SystemTicket) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Ticket className="w-8 h-8 text-blue-600" />
            Tickets de Sistemas
          </h1>
          <p className="text-gray-600">
            Sistema de solicitudes para el área de sistemas
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Ticket
        </Button>
      </div>

      <div className="grid gap-6">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No hay tickets registrados
              </h3>
              <p className="text-gray-500 mb-4">
                Crea tu primer ticket para solicitar soporte del área de sistemas
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Ticket
              </Button>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket: SystemTicket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        Ticket #{ticket.ticketNumber}
                      </h3>
                      <Badge className={`${getStatusColor(ticket.status)} border`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(ticket.status)}
                          {ticket.status.toUpperCase()}
                        </div>
                      </Badge>
                      <Badge className={`${getUrgencyColor(ticket.urgency)} border`}>
                        Urgencia: {ticket.urgency.toUpperCase()}
                      </Badge>
                      {ticket.hasUnreadMessages && (
                        <Badge className="bg-blue-500 text-white text-xs animate-pulse">
                          💬 Nuevo mensaje
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><strong>Solicitante:</strong> {ticket.requesterName}</p>
                      <p><strong>Área:</strong> {getAreaDisplayName(ticket.requesterArea)}</p>
                      <p><strong>Fecha:</strong> {formatDate(ticket.requestDate)}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewTicket(ticket)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalles
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Tipo:</strong> {getTicketTypeLabel(ticket.ticketType)}</p>
                  {ticket.otherTypeDescription && (
                    <p><strong>Especificación:</strong> {ticket.otherTypeDescription}</p>
                  )}
                  <div>
                    <strong>Descripción:</strong>
                    <p className="text-sm text-gray-700 mt-1 line-clamp-3">
                      {ticket.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateSystemTicketModal 
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {selectedTicket && (
        <SystemTicketDetailModal
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTicket(null);
          }}
          ticket={selectedTicket}
        />
      )}
    </div>
  );
}