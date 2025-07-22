import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Clock, CheckCircle, XCircle, Ban, Eye, User, Calendar, AlertTriangle, FileText, Settings, Loader2, Trash2, MessageCircle, Send, RefreshCw } from "lucide-react";
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
  rejectionReason?: string;
  createdAt: string;
  hasUnreadMessages?: boolean; // Added to track unread messages
}

interface TicketMessage {
  id: number;
  message: string;
  createdAt: string;
  userName: string;
  userArea: string;
}

interface SystemTicketDetailModalProps {
  open: boolean;
  onClose: () => void;
  ticket: SystemTicket;
}

export function SystemTicketDetailModal({ open, onClose, ticket }: SystemTicketDetailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [solution, setSolution] = useState(ticket.solution || "");
  const [attentionDate, setAttentionDate] = useState(ticket.attentionDate || "");
  const [rejectionReason, setRejectionReason] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSystemsUser = user?.area === "sistemas";
  const canParticipateInChat = isSystemsUser || ticket.createdBy === user?.id;

  // Obtener mensajes del chat
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["ticket-messages", ticket.id],
    queryFn: async () => {
      const response = await fetch(`/api/system-tickets/${ticket.id}/messages`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: open,
    refetchInterval: 3000, // Refrescar cada 3 segundos
  });

  // Marcar mensajes como leídos cuando se abre el modal
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/system-tickets/${ticket.id}/messages/mark-read`, {
        method: "POST",
        credentials: "include"
      });
      if (!response.ok) throw new Error("Error al marcar como leído");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-tickets"] });
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && canParticipateInChat) {
      // Marcar mensajes como leídos cuando se abre el modal
      markAsReadMutation.mutate();
    }
  }, [open, canParticipateInChat]);

  const updateTicketMutation = useMutation({
    mutationFn: async (data: { status: string; solution?: string; attentionDate?: string; rejectionReason?: string }) => {
      const response = await fetch(`/api/system-tickets/${ticket.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al actualizar ticket");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.refetchQueries({ queryKey: ["system-tickets"] });
      toast({
        title: "✅ Ticket actualizado",
        description: "El estado del ticket ha sido actualizado correctamente"
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar ticket",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteTicketMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/system-tickets/${ticket.id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al eliminar ticket");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-tickets"] });
      toast({
        title: "✅ Ticket eliminado",
        description: "El ticket ha sido eliminado correctamente"
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar ticket",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`/api/system-tickets/${ticket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message })
      });
      if (!response.ok) throw new Error("Error al enviar mensaje");
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ["system-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }); // Invalidate notifications
      toast({
        title: "✅ Mensaje enviado",
        description: "Tu mensaje ha sido enviado correctamente"
      });
    },
    onError: () => {
      toast({
        title: "Error al enviar mensaje",
        variant: "destructive"
      });
    }
  });

  const clearChatMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/system-tickets/${ticket.id}/messages`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) throw new Error("Error al limpiar chat");
      return response.json();
    },
    onSuccess: () => {
      refetchMessages();
      toast({
        title: "✅ Chat limpiado",
        description: "El historial de chat ha sido eliminado"
      });
    },
    onError: () => {
      toast({
        title: "Error al limpiar chat",
        variant: "destructive"
      });
    }
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
    return date.toLocaleDateString('es-MX', {
      timeZone: 'America/Mexico_City',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "finalizada" && !solution.trim()) {
      toast({
        title: "Error de validación",
        description: "Por favor ingresa la solución aplicada antes de finalizar",
        variant: "destructive"
      });
      return;
    }

    if (newStatus === "rechazada" && !rejectionReason.trim()) {
      toast({
        title: "Error de validación",
        description: "Por favor ingresa la explicación del rechazo",
        variant: "destructive"
      });
      return;
    }

    const updateData: any = { status: newStatus };

    if (newStatus === "finalizada") {
      updateData.solution = solution.trim();
      updateData.attentionDate = attentionDate || getCurrentDate();
    }

    if (newStatus === "rechazada") {
      updateData.rejectionReason = rejectionReason.trim();
    }

    updateTicketMutation.mutate(updateData);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      timeZone: 'America/Mexico_City',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              🎫 Ticket #{ticket.ticketNumber}
            </DialogTitle>
            {isSystemsUser && (
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar ticket?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. El ticket y todo su historial de chat serán eliminados permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteTicketMutation.mutate()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleteTicketMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header con estado y urgencia */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Badge className={`${getStatusColor(ticket.status)} border`}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(ticket.status)}
                  {ticket.status.toUpperCase()}
                </div>
              </Badge>
              <Badge className={`${getUrgencyColor(ticket.urgency)} border`}>
                <AlertTriangle className="w-3 h-3 mr-1" />
                Urgencia: {ticket.urgency.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información del solicitante */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información del Solicitante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Nombre</Label>
                  <p className="font-medium">{ticket.requesterName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Departamento/Área</Label>
                  <p className="font-medium">{getAreaDisplayName(ticket.requesterArea)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Fecha de Solicitud</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(ticket.requestDate)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Información del ticket */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Detalles del Ticket
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Tipo de Solicitud</Label>
                  <p className="font-medium">{getTicketTypeLabel(ticket.ticketType)}</p>
                  {ticket.otherTypeDescription && (
                    <p className="text-sm text-gray-600 italic">
                      Especificación: {ticket.otherTypeDescription}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Número de Ticket</Label>
                  <p className="font-mono text-lg font-bold text-blue-600">
                    #{ticket.ticketNumber}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Descripción del problema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Descripción del Problema o Solicitud</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Sección para uso del área de Sistemas */}
          {isSystemsUser && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  🛠 Para uso del área de Sistemas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Recibido por</Label>
                    <Input 
                      value={user?.name || ""} 
                      disabled 
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label>Fecha de atención</Label>
                    <Input
                      type="date"
                      value={attentionDate}
                      onChange={(e) => setAttentionDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Observaciones / solución aplicada</Label>
                  <Textarea
                    placeholder="Describe la solución aplicada o las observaciones..."
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Motivo del rechazo (si aplica)</Label>
                  <Textarea
                    placeholder="Explica por qué se rechaza el ticket..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Cambiar estado del ticket</Label>
                  <div className="flex flex-wrap gap-2">
                    {ticket.status === "pendiente" && (
                      <Button
                        onClick={() => handleStatusChange("aceptada")}
                        disabled={updateTicketMutation.isPending}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {updateTicketMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4 mr-2" />
                        )}
                        Aceptar
                      </Button>
                    )}

                    {(ticket.status === "pendiente" || ticket.status === "aceptada") && (
                      <>
                        <Button
                          onClick={() => handleStatusChange("finalizada")}
                          disabled={updateTicketMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {updateTicketMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Finalizar
                        </Button>

                        <Button
                          onClick={() => handleStatusChange("rechazada")}
                          disabled={updateTicketMutation.isPending}
                          variant="destructive"
                        >
                          {updateTicketMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          Rechazar
                        </Button>
                      </>
                    )}

                    {ticket.status !== "cancelada" && ticket.status !== "finalizada" && (
                      <Button
                        onClick={() => handleStatusChange("cancelada")}
                        disabled={updateTicketMutation.isPending}
                        variant="outline"
                        className="border-gray-400 text-gray-600 hover:bg-gray-50"
                      >
                        {updateTicketMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Ban className="w-4 h-4 mr-2" />
                        )}
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mostrar solución si existe */}
          {ticket.solution && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  Solución Aplicada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <p className="whitespace-pre-wrap">{ticket.solution}</p>
                  {ticket.attentionDate && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-sm text-green-700">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Fecha de atención: {formatDate(ticket.attentionDate)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mostrar razón de rechazo si existe */}
          {ticket.rejectionReason && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                  <XCircle className="w-5 h-5" />
                  Motivo del Rechazo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <p className="whitespace-pre-wrap">{ticket.rejectionReason}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sistema de Chat */}
          {canParticipateInChat && (
            <Card className="border-blue-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    💬 Chat del Ticket
                  </CardTitle>
                  {isSystemsUser && messages.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => clearChatMutation.mutate()}
                      disabled={clearChatMutation.isPending}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      {clearChatMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Limpiar Chat
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mensajes del chat */}
                <ScrollArea className="h-64 w-full border rounded-lg p-2">
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No hay mensajes aún</p>
                    ) : (
                      messages.map((message: TicketMessage) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg max-w-[80%] ${
                            message.userArea === 'sistemas'
                              ? 'bg-blue-100 text-blue-900 ml-auto'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-2 text-xs opacity-70 mb-1">
                            <span className="font-semibold">{message.userName}</span>
                            <span>({message.userArea})</span>
                            <span>{formatMessageTime(message.createdAt)}</span>
                          </div>
                          <p className="whitespace-pre-wrap">{message.message}</p>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input para nuevo mensaje */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Escribir mensaje..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    size="sm"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}