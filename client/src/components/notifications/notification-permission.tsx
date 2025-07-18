
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { NotificationService } from '../../lib/notifications';

export function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    const notificationService = NotificationService.getInstance();
    setIsSupported(notificationService.isSupported());
    setPermission(notificationService.getPermissionStatus());
  }, []);

  const requestPermission = async () => {
    setIsRequesting(true);
    const notificationService = NotificationService.getInstance();
    const granted = await notificationService.requestPermission();
    setPermission(granted ? 'granted' : 'denied');
    setIsRequesting(false);

    if (granted) {
      // Mostrar notificación de prueba con sonido
      notificationService.showNotification('¡Notificaciones activadas!', {
        body: 'Ahora recibirás notificaciones con sonido de EasyTrack',
        tag: 'welcome-notification',
        silent: false
      });
    }
  };

  if (!isSupported) {
    return (
      <Card className="mb-4 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <BellOff className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm text-orange-800 font-semibold">
                ⚠️ Navegador no compatible
              </CardTitle>
              <CardDescription className="text-orange-700 text-xs mt-1">
                Tu navegador no soporta notificaciones push en tiempo real
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="p-3 bg-orange-100 rounded-lg border border-orange-200">
            <p className="text-xs text-orange-800 font-medium mb-1">
              🌐 Navegadores recomendados:
            </p>
            <p className="text-xs text-orange-700">
              Chrome, Firefox, Safari, Edge (versiones recientes)
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (permission === 'granted') {
    return (
      <Card className="mb-4 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm text-green-800 font-semibold">
                ✅ Notificaciones en tiempo real activas
              </CardTitle>
              <CardDescription className="text-green-700 text-xs mt-1">
                Recibirás alertas con sonido cuando no estés viendo la página
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (permission === 'denied') {
    return (
      <Card className="mb-4 border-red-200 bg-gradient-to-r from-red-50 to-rose-50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <X className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm text-red-800 font-semibold">
                🚫 Notificaciones bloqueadas
              </CardTitle>
              <CardDescription className="text-red-700 text-xs mt-1">
                Te estás perdiendo las notificaciones en tiempo real del sistema
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="p-3 bg-red-100 rounded-lg border border-red-200">
              <p className="text-xs text-red-800 font-medium mb-2">
                📱 Para activar las notificaciones:
              </p>
              <ol className="text-xs text-red-700 space-y-1 list-decimal list-inside">
                <li>Haz clic en el ícono de candado 🔒 en la barra de direcciones</li>
                <li>Selecciona "Permitir" para notificaciones</li>
                <li>Recarga la página</li>
              </ol>
            </div>
            <p className="text-xs text-red-600">
              💬 Con las notificaciones activas recibirás alertas como WhatsApp
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-sm text-amber-800 font-semibold">
              🔔 Activa las notificaciones en tiempo real
            </CardTitle>
            <CardDescription className="text-amber-700 text-xs mt-1">
              Recibe alertas con sonido de nuevas órdenes, reposiciones y transferencias
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-2">
          <Button 
            onClick={requestPermission} 
            disabled={isRequesting}
            className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
            size="sm"
          >
            {isRequesting ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                Solicitando permisos...
              </div>
            ) : (
              '🚀 Activar notificaciones ahora'
            )}
          </Button>
          <p className="text-xs text-amber-600">
            💡 Te avisaremos con sonido solo cuando la página esté en segundo plano
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
