
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Clock, CheckCircle, XCircle, Ban, Eye, User, Calendar, AlertTriangle, FileText, Settings, Loader2 } from "lucide-react";
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

  const isSystemsUser = user?.area === "sistemas";

  const updateTicketMutation = useMutation({
    mutationFn: async (data: { status: string; solution?: string; attentionDate?: string }) => {
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
    return date.toLocaleDateString('es-ES', {
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

    const updateData: any = { status: newStatus };
    
    if (newStatus === "finalizada") {
      updateData.solution = solution.trim();
      updateData.attentionDate = attentionDate || getCurrentDate();
    }

    updateTicketMutation.mutate(updateData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎫 Ticket #{ticket.ticketNumber}
          </DialogTitle>
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
