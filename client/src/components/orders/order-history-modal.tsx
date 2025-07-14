import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { type OrderHistory } from "@shared/schema";
import { HistoryTimeline } from "@/components/shared/HistoryTimeline";

interface OrderHistoryModalProps {
  open: boolean;
  onClose: () => void;
  orderId: number;
}

export function OrderHistoryModal({ open, onClose, orderId }: OrderHistoryModalProps) {
  const { data: order } = useQuery<OrderHistory>({
    queryKey: ["/api/orders", orderId],
    enabled: !!orderId,
  });

  const { data: history = [], isLoading } = useQuery<OrderHistory[]>({
    queryKey: ["/api/orders", orderId, "history"],
    enabled: !!orderId,
    refetchInterval: 2000, // Refetch cada 2 segundos
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Considerar datos siempre obsoletos para forzar refetch
  });

  

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Historial del Pedido #{order?.orderId}
          </DialogTitle>
        </DialogHeader>
        
        <HistoryTimeline 
          events={history} 
          title={`Historial del Pedido #${order?.orderId}`}
          type="order"
        />
      </DialogContent>
    </Dialog>
  );
}
