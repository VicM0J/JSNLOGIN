import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ArrowRight, CheckCircle, AlertTriangle, Package, FileText } from "lucide-react";
import { type Order, type Area } from "@shared/schema";
import Swal from 'sweetalert2';

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  orderId: number;
}

export function TransferModal({ open, onClose, orderId }: TransferModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [transferData, setTransferData] = useState({
    toArea: "" as Area,
    pieces: "",
    notes: "",
  });

  const { data: order } = useQuery<Order>({
    queryKey: ["/api/orders", orderId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/orders/${orderId}`);
      return res.json();
    },
    enabled: !!orderId,
  });

  const { data: orderPieces = [], isLoading: isLoadingPieces } = useQuery({
    queryKey: [`/api/orders/${orderId}/pieces`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/orders/${orderId}/pieces`);
      return res.json();
    },
    enabled: !!orderId,
  });

  const createTransferMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/transfers", {
        orderId,
        toArea: data.toArea,
        pieces: parseInt(data.pieces),
        notes: data.notes,
      });
      return await res.json();
    },
    onSuccess: () => {
        Swal.fire({
  title: '¡Transferencia enviada!',
  text: 'El pedido ha sido transferido para aprobación.',
  imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMjUgNDIgTDI1IDIgTTI1IDIgTDEwIDE3IE0yNSAyIEw0MCAxNyIgc3Ryb2tlPSIjMDA4OEZGIiBzdHJva2Utd2lkdGg9IjQiIGZpbGw9Im5vbmUiPgogICAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ic3Ryb2tlLWRhc2hhcnJheSIgdmFsdWVzPSIyIDUgMiA1OzIgNSAyIDUiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiAvPgogIDwvcGF0aD4KPC9zdmc+',
  imageWidth: 80,
  imageHeight: 80,
  imageAlt: 'Flecha animada hacia arriba',
  showConfirmButton: false,
  timer: 2000,
  customClass: {
    popup: 'font-sans',
  },
});


      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/pieces`] });
      queryClient.invalidateQueries({ queryKey: ["/api/transfers/pending"] });
      onClose();
      setTransferData({
        toArea: "" as Area,
        pieces: "",
        notes: "",
      });
    },
    onError: (error: any) => {
      console.error('Transfer error:', error);

      // Manejar error de transferencia reciente
      if (error.message?.includes('Debes esperar')) {
        toast({
          title: "Transferencia Bloqueada",
          description: error.message,
          variant: "destructive",
          duration: 7000, // Mostrar por más tiempo
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Error al crear la transferencia",
          variant: "destructive",
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const availablePieces = getCurrentAreaPieces();
    const requestedPieces = parseInt(transferData.pieces);

    if (requestedPieces > availablePieces) {
      toast({
        title: "Error en transferencia",
        description: `No puedes transferir ${requestedPieces} piezas. Solo tienes ${availablePieces} disponibles en ${user?.area ? getAreaDisplayName(user.area) : 'tu área'}.`,
        variant: "destructive",
      });
      return;
    }

    createTransferMutation.mutate(transferData);
  };

  const getNextAreas = (): Area[] => {
    if (!user) return [];

    // Todas las áreas disponibles para transferencia (incluye todas las áreas del sistema)
    const allAreas: Area[] = ['patronaje', 'corte', 'bordado', 'ensamble', 'plancha', 'calidad', 'envios', 'operaciones', 'admin', 'almacen', 'diseño'];

    // Filtrar el área actual del usuario para evitar auto-transferencias
    return allAreas.filter(area => area !== user.area);
  };

  const getAreaDisplayName = (area: Area) => {
    const names: Record<Area, string> = {
      patronaje: 'Patronaje',
      corte: 'Corte',
      bordado: 'Bordado',
      ensamble: 'Ensamble',
      plancha: 'Plancha/Empaque',
      calidad: 'Calidad',
      operaciones: 'Operaciones',
      envios: 'Envíos',
      almacen: 'Almacén',
      admin: 'Admin',
      diseño: 'Diseño'
    };
    return names[area] || area;
  };

  const getCurrentAreaPieces = () => {
    const piecesArr = orderPieces as Array<any>;
    if (!user || !piecesArr.length) return 0;
    const currentAreaPieces = piecesArr.find((p: any) => p.area === user.area);
    console.log('User area:', user.area, 'Order pieces:', piecesArr, 'Found pieces:', currentAreaPieces);
    return currentAreaPieces?.pieces || 0;
  };

  const nextAreas = getNextAreas();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-slate-800 border-2 border-blue-100 dark:border-slate-700 shadow-2xl mx-2">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="text-base sm:text-xl">Transferir Pedido</span>
          </DialogTitle>
        </DialogHeader>

        {isLoadingPieces && (
          <div className="flex items-center justify-center p-4 sm:p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-xl">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-500" />
            <span className="ml-2 sm:ml-3 text-sm sm:text-lg text-gray-700 dark:text-gray-200">Cargando información...</span>
          </div>
        )}

        {!isLoadingPieces && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Header del pedido */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white p-3 sm:p-4 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">Folio: {order?.folio || "Cargando..."}</h3>
                    <p className="text-blue-100 dark:text-blue-200 text-xs sm:text-sm">ID: #{orderId}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-blue-100 dark:text-blue-200 text-xs sm:text-sm">Cliente</p>
                    <p className="font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-none text-white">{order?.clienteHotel || "Cargando..."}</p>
                  </div>
                </div>
              </div>

              {/* Información de piezas */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-200 dark:border-green-700 rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
                  <div className="p-1.5 sm:p-2 bg-green-500 rounded-full">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200 text-sm sm:text-base">Resumen de Piezas</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mb-1">Disponibles en {user?.area ? getAreaDisplayName(user.area) : 'tu área'}</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-800 dark:text-green-200">{getCurrentAreaPieces()}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mb-1">Total del pedido</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-800 dark:text-green-200">{order?.totalPiezas || 0}</p>
                  </div>
                </div>
              </div>

              {getCurrentAreaPieces() === 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-2 border-yellow-300 dark:border-yellow-600 rounded-xl p-3 sm:p-4 shadow-sm">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-1.5 sm:p-2 bg-yellow-500 rounded-full flex-shrink-0">
                      <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <p className="text-yellow-800 dark:text-yellow-200 font-medium text-sm sm:text-base">
                      No tienes piezas disponibles en tu área para este pedido.
                    </p>
                  </div>
                </div>
              )}

              {/* Selector de área destino */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-200 font-medium flex items-center space-x-2 text-sm sm:text-base">
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                  <span>Transferir a</span>
                </Label>
                <Select 
                  value={transferData.toArea} 
                  onValueChange={(value: Area) => setTransferData(prev => ({ ...prev, toArea: value }))}
                >
                  <SelectTrigger className="border-2 border-purple-200 dark:border-purple-600 focus:border-purple-500 dark:focus:border-purple-400 h-10 sm:h-12 text-sm sm:text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100">
                    <SelectValue placeholder="Seleccionar área destino..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-600">
                    {nextAreas.map(area => (
                      <SelectItem key={area} value={area} className="text-sm sm:text-base py-2 sm:py-3 text-gray-900 dark:text-gray-100 hover:bg-purple-50 dark:hover:bg-slate-700">
                        {getAreaDisplayName(area)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cantidad a transferir */}
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-gray-700 dark:text-gray-200 font-medium flex items-center space-x-2 text-sm sm:text-base">
                  <Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                  <span>Cantidad a transferir</span>
                </Label>
                <div className="bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-600 rounded-xl p-3 sm:p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="1"
                        max={getCurrentAreaPieces()}
                        value={transferData.pieces}
                        onChange={(e) => setTransferData(prev => ({ ...prev, pieces: e.target.value }))}
                        required
                        className="text-base sm:text-lg font-semibold text-center border-2 border-blue-300 dark:border-blue-600 focus:border-blue-500 dark:focus:border-blue-400 h-10 sm:h-12 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                        placeholder="0"
                      />
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-center sm:text-left">
                      <span className="block">de <strong>{getCurrentAreaPieces()}</strong> disponibles</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">en {user?.area ? getAreaDisplayName(user.area) : ''}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-200 font-medium flex items-center space-x-2 text-sm sm:text-base">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
                  <span>Notas adicionales (opcional)</span>
                </Label>
                <Textarea
                  rows={2}
                  placeholder="Agregar comentarios sobre la transferencia..."
                  value={transferData.notes}
                  onChange={(e) => setTransferData(prev => ({ ...prev, notes: e.target.value }))}
                  className="border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 resize-none text-sm sm:text-base bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-600">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm sm:text-base order-2 sm:order-1 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createTransferMutation.isPending || getCurrentAreaPieces() === 0}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold shadow-lg text-sm sm:text-base order-1 sm:order-2"
              >
                {createTransferMutation.isPending && <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
                <span className="hidden sm:inline">Confirmar Transferencia</span>
                <span className="sm:hidden">Confirmar</span>
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}