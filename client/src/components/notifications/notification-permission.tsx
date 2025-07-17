
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
      // Mostrar notificación de prueba
      notificationService.showNotification('¡Notificaciones activadas!', {
        body: 'Ahora recibirás notificaciones de EasyTrack',
        tag: 'welcome-notification'
      });
    }
  };

  if (!isSupported) {
    return (
      <Card className="mb-4 border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BellOff className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-sm text-orange-800">Notificaciones no disponibles</CardTitle>
          </div>
          <CardDescription className="text-orange-700">
            Tu navegador no soporta notificaciones push
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (permission === 'granted') {
    return (
      <Card className="mb-4 border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <CardTitle className="text-sm text-green-800">Notificaciones activadas</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            Recibirás notificaciones cuando la página no esté visible
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (permission === 'denied') {
    return (
      <Card className="mb-4 border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <X className="w-5 h-5 text-red-600" />
            <CardTitle className="text-sm text-red-800">Notificaciones bloqueadas</CardTitle>
          </div>
          <CardDescription className="text-red-700">
            Para activar las notificaciones, ve a la configuración de tu navegador y permite las notificaciones para este sitio
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-sm text-blue-800">Activar notificaciones</CardTitle>
        </div>
        <CardDescription className="text-blue-700">
          Recibe notificaciones instantáneas como WhatsApp cuando no estés viendo la página
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button 
          onClick={requestPermission} 
          disabled={isRequesting}
          className="bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          {isRequesting ? 'Solicitando...' : 'Activar notificaciones'}
        </Button>
      </CardContent>
    </Card>
  );
}
