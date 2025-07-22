import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface CreateSystemTicketModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateSystemTicketModal({ open, onClose }: CreateSystemTicketModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const [formData, setFormData] = useState({
    requesterName: user?.name || "",
    requesterArea: user?.area || "",
    ticketType: "",
    otherTypeDescription: "",
    description: "",
    urgency: ""
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/system-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear ticket");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.refetchQueries({ queryKey: ["system-tickets"] });
      toast({
        title: "✅ Ticket creado",
        description: "El ticket ha sido creado exitosamente"
      });
      onClose();
      setFormData({
        requesterName: user?.name || "",
        requesterArea: user?.area || "",
        ticketType: "",
        otherTypeDescription: "",
        description: "",
        urgency: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear ticket",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      requesterName: user?.name || "",
      requesterArea: user?.area || "",
      ticketType: "",
      otherTypeDescription: "",
      description: "",
      urgency: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ticketType) {
      toast({
        title: "Error de validación",
        description: "Por favor selecciona el tipo de solicitud",
        variant: "destructive"
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Error de validación", 
        description: "Por favor describe el problema o solicitud",
        variant: "destructive"
      });
      return;
    }

    if (!formData.urgency) {
      toast({
        title: "Error de validación",
        description: "Por favor selecciona la urgencia de la solicitud",
        variant: "destructive"
      });
      return;
    }

    if (formData.ticketType === "otro" && !formData.otherTypeDescription.trim()) {
      toast({
        title: "Error de validación",
        description: "Por favor especifica el tipo de solicitud",
        variant: "destructive"
      });
      return;
    }

    createTicketMutation.mutate({
      requesterName: formData.requesterName,
      requesterArea: formData.requesterArea,
      ticketType: formData.ticketType,
      otherTypeDescription: formData.ticketType === "otro" ? formData.otherTypeDescription : null,
      description: formData.description.trim(),
      urgency: formData.urgency
    });
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">🎫 Crear Nuevo Ticket de Sistemas</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requesterName">1. Nombre del solicitante</Label>
              <Input
                id="requesterName"
                value={formData.requesterName}
                disabled
                className="bg-gray-50 text-gray-700"
              />
              <p className="text-xs text-gray-500">Se obtiene automáticamente de tu usuario</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requesterArea">2. Departamento / Área</Label>
              <Input
                id="requesterArea"
                value={getAreaDisplayName(formData.requesterArea)}
                disabled
                className="bg-gray-50 text-gray-700"
              />
              <p className="text-xs text-gray-500">Se obtiene automáticamente de tu área</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>3. Fecha de la solicitud</Label>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
              <span className="text-lg">📅</span>
              <span className="font-mono text-gray-700">{getCurrentDate()}</span>
            </div>
            <p className="text-xs text-gray-500">Se genera automáticamente</p>
          </div>

          <div className="space-y-3">
            <Label>4. Tipo de solicitud *</Label>
            <Select value={formData.ticketType} onValueChange={(value) => setFormData({...formData, ticketType: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soporte_hardware">🔧 Soporte técnico (hardware)</SelectItem>
                <SelectItem value="soporte_software">💻 Soporte técnico (software)</SelectItem>
                <SelectItem value="problemas_red">🌐 Problemas de red o internet</SelectItem>
                <SelectItem value="acceso_permisos">🔐 Solicitud de acceso o permisos</SelectItem>
                <SelectItem value="instalacion_configuracion">⚙️ Instalación o configuración</SelectItem>
                <SelectItem value="otro">📝 Otro</SelectItem>
              </SelectContent>
            </Select>

            {formData.ticketType === "otro" && (
              <div className="ml-4">
                <Input
                  placeholder="Especifica el tipo de solicitud..."
                  value={formData.otherTypeDescription}
                  onChange={(e) => setFormData({...formData, otherTypeDescription: e.target.value})}
                  maxLength={100}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">5. Descripción del problema o solicitud *</Label>
            <Textarea
              id="description"
              placeholder="Describe con el mayor detalle posible..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500">
              {formData.description.length}/1000 caracteres
            </p>
          </div>

          <div className="space-y-3">
            <Label>6. Urgencia de la solicitud *</Label>
            <RadioGroup 
              value={formData.urgency} 
              onValueChange={(value) => setFormData({...formData, urgency: value})}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="alta" id="urgencia-alta" />
                <Label htmlFor="urgencia-alta" className="flex items-center gap-2">
                  🔴 <strong>Alta</strong> - Impide completamente el trabajo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="media" id="urgencia-media" />
                <Label htmlFor="urgencia-media" className="flex items-center gap-2">
                  🟡 <strong>Media</strong> - Afecta parcialmente el trabajo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="baja" id="urgencia-baja" />
                <Label htmlFor="urgencia-baja" className="flex items-center gap-2">
                  🟢 <strong>Baja</strong> - No afecta directamente el trabajo
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createTicketMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createTicketMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createTicketMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                "🎫 Crear Ticket"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}