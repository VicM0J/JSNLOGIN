
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, MapPin, Clock, CheckCircle } from 'lucide-react';
import { type Area } from '@shared/schema';

interface OrderRouteTrackerProps {
  orderHistory: Array<{
    id: number;
    action: string;
    description: string;
    timestamp: string;
    userName: string;
    metadata?: any;
  }>;
  currentArea: Area;
}

export function OrderRouteTracker({ orderHistory, currentArea }: OrderRouteTrackerProps) {
  const getAreaDisplayName = (area: Area) => {
    const names: Record<Area, string> = {
      patronaje: 'Patronaje',
      corte: 'Corte',
      bordado: 'Bordado',
      ensamble: 'Ensamble',
      plancha: 'Plancha/Empaque',
      calidad: 'Calidad',
      envios: 'Envíos',
      almacen: 'Almacén',
      admin: 'Admin',
      diseño: 'Diseño',
      operaciones: 'Operaciones'
    };
    return names[area] || area;
  };

  // Extraer la ruta basada en transferencias y cambios de área
  const routeSteps = React.useMemo(() => {
    const steps: Array<{
      area: Area;
      timestamp?: string;
      action: string;
      pieces?: number;
      isActive: boolean;
      route?: string;
    }> = [];

    const transferHistory = orderHistory.filter(h => 
      h.action.includes('transfer') || h.action.includes('area_changed') || h.action === 'created'
    );

    transferHistory.forEach((entry, index) => {
      if (entry.action === 'created') {
        steps.push({
          area: entry.metadata?.initialArea || 'corte' as Area,
          timestamp: entry.timestamp,
          action: 'Pedido creado',
          isActive: index === transferHistory.length - 1
        });
      } else if (entry.action === 'transfer_accepted' || entry.action === 'area_changed') {
        const toArea = entry.metadata?.toArea || entry.metadata?.newArea;
        if (toArea) {
          steps.push({
            area: toArea as Area,
            timestamp: entry.timestamp,
            action: entry.action === 'area_changed' ? 'Área actualizada' : 'Transferencia recibida',
            pieces: entry.metadata?.pieces,
            isActive: toArea === currentArea
          });
        }
      }
    });

    return steps;
  }, [orderHistory, currentArea]);

  if (routeSteps.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Ruta del Pedido
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {routeSteps.map((step, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                {step.isActive ? (
                  <MapPin className="w-6 h-6 text-blue-600" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                )}
                {index < routeSteps.length - 1 && (
                  <div className="w-px h-8 bg-gray-300 mt-2" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant={step.isActive ? "default" : "secondary"}
                    className={step.isActive ? "bg-blue-100 text-blue-800" : ""}
                  >
                    {getAreaDisplayName(step.area)}
                  </Badge>
                  {step.isActive && (
                    <Badge variant="outline" className="text-xs">
                      Área Actual
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600">
                  {step.action}
                  {step.pieces && ` (${step.pieces} piezas)`}
                </p>
                
                {step.timestamp && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {new Date(step.timestamp).toLocaleString('es-ES')}
                  </p>
                )}
              </div>
              
              {index < routeSteps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-400" />
              )}
            </div>
          ))}
        </div>
        
        {routeSteps.length > 1 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              <strong>Total de áreas visitadas:</strong> {routeSteps.length}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
