import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { NotificationService, formatNotificationContent } from './notifications';

class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private listeners: Array<(data: any) => void> = [];

  connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      console.log('Intentando conectar WebSocket a:', wsUrl);
      
      // Validar que la URL sea correcta antes de crear el WebSocket
      if (!host || host === 'undefined' || !wsUrl.includes('://')) {
        console.error('URL de WebSocket inválida:', wsUrl);
        return;
      }

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket conectado exitosamente');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Notificación WebSocket recibida:', data);

          // Solo notificar a los listeners si es una notificación real
          if (data.type === 'notification') {
            this.listeners.forEach(listener => listener(data.data));
          }
        } catch (error) {
          console.error('Error al procesar mensaje WebSocket:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket desconectado, código:', event.code);
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Error en WebSocket:', error);
      };
    } catch (error) {
      console.error('Error al crear WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Intentando reconectar WebSocket en ${this.reconnectInterval / 1000} segundos... (Intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('Máximo número de intentos de reconexión alcanzado.');
    }
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket no está conectado, mensaje no enviado:', message);
    }
  }

  addListener(listener: (data: any) => void) {
    this.listeners.push(listener);
  }

  removeListener(listener: (data: any) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
}


export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const webSocketManagerRef = useRef<WebSocketManager | null>(null);

  useEffect(() => {
    if (!webSocketManagerRef.current) {
      webSocketManagerRef.current = new WebSocketManager();
    }

    const webSocketManager = webSocketManagerRef.current;

    webSocketManager.connect();
    setIsConnected(true);

    const notificationListener = (notification: any) => {
      console.log('Nueva notificación recibida:', notification);

      // Invalidar queries relacionadas para actualizar la UI
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // También invalidar otras queries según el tipo de notificación
      if (notification.type?.includes('order')) {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      }
      if (notification.type?.includes('reposition')) {
        queryClient.invalidateQueries({ queryKey: ['repositions'] });
      }

      // Mostrar notificación del navegador
      const notificationService = NotificationService.getInstance();
      const { title, body, data } = formatNotificationContent(notification);

      notificationService.showNotification(title, {
        body,
        tag: `notification-${notification.id || Date.now()}`,
        data
      });
    };

    webSocketManager.addListener(notificationListener);

    return () => {
      webSocketManager.removeListener(notificationListener);
      setIsConnected(false);
    };
  }, [queryClient]);

  const sendMessage = (message: any) => {
    webSocketManagerRef.current?.sendMessage(message);
  };

  const onMessage = (callback: (data: any) => void) => {
    if (webSocketManagerRef.current) {
      webSocketManagerRef.current.addListener(callback);
    }
  };

  return { isConnected, sendMessage, onMessage };
}