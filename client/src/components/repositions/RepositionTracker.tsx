import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MapPin, Clock, User, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';

interface RepositionTrackerProps {
  repositionId: number;
  onClose: () => void;
}

interface TrackingStep {
  id: number;
  area: string;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string;
  user?: string;
  notes?: string;
  timeSpent?: string;
  timeInMinutes?: number;
  date?: string;
}

interface TrackingData {
  reposition: {
    folio: string;
    status: string;
    currentArea: string;
    progress: number;
  };
  steps: TrackingStep[];
  history: Array<{
    id: number;
    action: string;
    description: string;
    timestamp: string;
    userName: string;
    fromArea?: string;
    toArea?: string;
  }>;
  totalTime: {
    formatted: string;
    minutes: number;
  };
  areaTimes: Record<string, number>;
}

export function RepositionTracker({ repositionId, onClose }: RepositionTrackerProps) {
  console.log('RepositionTracker mounted with repositionId:', repositionId);

  const { data: trackingData, isLoading, error } = useQuery<TrackingData>({
    queryKey: ['repositions', repositionId, 'tracking'],
    queryFn: async () => {
      console.log('Fetching tracking data for repositionId:', repositionId);
      const response = await fetch(`/api/repositions/${repositionId}/tracking`);
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch tracking data: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Tracking data received:', data);
      return data;
    },
    retry: 1,
    enabled: !!repositionId
  });

  console.log('Query state:', { isLoading, error, trackingData });

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'current':
        return <MapPin className="w-5 h-5 text-blue-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getAreaDisplayName = (area: string) => {
    const names: Record<string, string> = {
      patronaje: 'Patronaje',
      corte: 'Corte',
      bordado: 'Bordado',
      ensamble: 'Ensamble',
      plancha: 'Plancha',
      calidad: 'Calidad',
      operaciones: 'Operaciones',
      admin: 'Administración'
    };
    return names[area] || area;
  };

  const formatDate = (dateString: string) => {
    // Crear la fecha
    const date = new Date(dateString);
    
    // Si la fecha parece estar en UTC (diferencia notable con hora local), ajustar
    const now = new Date();
    const localOffset = now.getTimezoneOffset() * 60000; // offset en milisegundos
    const utcTime = date.getTime() + localOffset;
    const mexicoOffset = -6 * 60 * 60 * 1000; // México es UTC-6
    
    // Si la fecha original parece estar en UTC, aplicar ajuste para México
    if (dateString.includes('T') && dateString.includes('Z')) {
      const adjustedDate = new Date(utcTime + mexicoOffset);
      return adjustedDate.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Si no tiene indicadores UTC, usar tal como está
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    console.log('Showing loading state');
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Cargando seguimiento...</p>
            <p className="text-sm text-gray-500 mt-1">Reposición ID: {repositionId}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    console.log('Showing error state:', error);
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p>Error al cargar el seguimiento</p>
            <p className="text-sm text-gray-500 mt-1">{error instanceof Error ? error.message : 'Error desconocido'}</p>
            <p className="text-xs text-gray-400 mt-2">Reposición ID: {repositionId}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!trackingData) {
    console.log('No tracking data available');
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p>No se pudo cargar el seguimiento</p>
            <p className="text-sm text-gray-500 mt-1">Los datos de seguimiento no están disponibles</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Validar que tengamos la estructura mínima de datos
  if (!trackingData.reposition || !trackingData.steps || !trackingData.areaTimes) {
    console.log('Incomplete tracking data structure:', trackingData);
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p>Datos de seguimiento incompletos</p>
            <p className="text-sm text-gray-500 mt-1">Faltan algunos datos necesarios para mostrar el seguimiento</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="text-blue-600" />
            Seguimiento de Reposición - {trackingData.reposition.folio}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Progreso</span>
                  <Badge variant="outline">{trackingData.reposition.progress}%</Badge>
                </div>
                <Progress value={trackingData.reposition.progress} className="h-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Área actual:</span>
                  <Badge>{getAreaDisplayName(trackingData.reposition.currentArea)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <Badge variant={trackingData.reposition.status === 'completado' ? 'default' : 'secondary'}>
                    {trackingData.reposition.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Flujo de Proceso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trackingData.steps.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      {getStepIcon(step.status)}
                      {index < trackingData.steps.length - 1 && (
                        <div className={`w-px h-12 mt-2 ${
                          step.status === 'completed' ? 'bg-green-300' : 'bg-gray-300'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`p-4 rounded-lg border ${
                        step.status === 'current' 
                          ? 'bg-blue-50 border-blue-200' 
                          : step.status === 'completed'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{getAreaDisplayName(step.area)}</h4>
                            {step.date && (
                              <p className="text-sm text-gray-600 mt-1">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Fecha: {new Date(step.date).toLocaleDateString('es-ES')}
                              </p>
                            )}
                            {step.timestamp && !step.date && (
                              <p className="text-sm text-gray-600 mt-1">
                                <Clock className="w-4 h-4 inline mr-1" />
                                {formatDate(step.timestamp)}
                              </p>
                            )}
                            {step.timeSpent && (
                              <p className="text-sm text-blue-600 font-medium mt-1">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Tiempo: {step.timeSpent}
                              </p>
                            )}
                            {step.user && (
                              <p className="text-sm text-gray-600">
                                <User className="w-4 h-4 inline mr-1" />
                                {step.user}
                              </p>
                            )}
                          </div>
                          <Badge 
                            variant={
                              step.status === 'completed' ? 'default' : 
                              step.status === 'current' ? 'secondary' : 'outline'
                            }
                          >
                            {step.status === 'completed' ? 'Completado' : 
                             step.status === 'current' ? 'En Proceso' : 'Pendiente'}
                          </Badge>
                        </div>
                        {step.notes && (
                          <p className="text-sm text-gray-700 mt-2 bg-white p-2 rounded border">
                            {step.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Time Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen de Tiempos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {trackingData.areaTimes && Object.entries(trackingData.areaTimes).map(([area, minutes]) => (
                    <div key={area} className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-sm">{getAreaDisplayName(area)}</h4>
                      <p className="text-lg font-bold text-blue-600">
                        {Math.floor(minutes / 60)}h {Math.round(minutes % 60)}m
                      </p>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Tiempo Total:</h3>
                    <div className="text-2xl font-bold text-green-600">
                      {trackingData.totalTime.formatted}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Total de minutos: {Math.round(trackingData.totalTime.minutes)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transferencias Entre Áreas */}
          {trackingData.transfers && trackingData.transfers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5" />
                  Transferencias Entre Áreas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trackingData.transfers.map((transfer: any) => (
                    <div key={transfer.id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                          <h4 className="font-semibold text-lg">
                            {getAreaDisplayName(transfer.fromArea)} → {getAreaDisplayName(transfer.toArea)}
                          </h4>
                        </div>
                        <Badge 
                          variant={transfer.status === 'accepted' ? 'default' : 
                                  transfer.status === 'rejected' ? 'destructive' : 'secondary'}
                          className="capitalize"
                        >
                          {transfer.status === 'accepted' ? 'Aceptada' : 
                           transfer.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Solicitada: {formatDate(transfer.createdAt)}
                          </p>
                          {transfer.processedAt && (
                            <p className="text-gray-600 mt-1">
                              <CheckCircle className="w-4 h-4 inline mr-1" />
                              Procesada: {formatDate(transfer.processedAt)}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          {transfer.transferredBy && (
                            <p className="text-gray-600">
                              <User className="w-4 h-4 inline mr-1" />
                              Solicitada por: {transfer.transferredBy}
                            </p>
                          )}
                          {transfer.processedBy && (
                            <p className="text-gray-600 mt-1">
                              <User className="w-4 h-4 inline mr-1" />
                              Procesada por: {transfer.processedBy}
                            </p>
                          )}
                        </div>
                      </div>

                      {transfer.notes && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <p className="text-sm font-medium text-gray-700 mb-1">Notas de transferencia:</p>
                          <p className="text-sm text-gray-600">{transfer.notes}</p>
                        </div>
                      )}

                      {transfer.consumoTela && (
                        <div className="mt-3">
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            Consumo de tela: {transfer.consumoTela} metros
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historial de Movimientos */}
          {trackingData.history && trackingData.history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Historial de Movimientos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trackingData.history.map((entry: any) => (
                    <div key={entry.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium">{entry.description}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(entry.createdAt || entry.timestamp)}
                        </p>
                        {entry.userName && (
                          <p className="text-xs text-gray-500 mt-1">
                            Por: {entry.userName}
                          </p>
                        )}
                        {entry.fromArea && entry.toArea && (
                          <p className="text-sm text-purple-600">
                            {getAreaDisplayName(entry.fromArea)} → {getAreaDisplayName(entry.toArea)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          
        </div>
      </DialogContent>
    </Dialog>
  );
}