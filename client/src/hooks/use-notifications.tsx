
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { NotificationService, formatNotificationContent } from "@/lib/notifications";

export function useNotifications() {
  const notificationService = NotificationService.getInstance();
  const previousNotificationsRef = useRef<any[]>([]);

  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/notifications");
      const allNotifications = await res.json();
      return allNotifications.filter((n: any) => !n.read);
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (notificationService.getPermissionStatus() !== 'granted') {
      return;
    }

    const previousIds = previousNotificationsRef.current.map(n => n.id);
    const newNotifications = notifications.filter(n => !previousIds.includes(n.id));

    newNotifications.forEach((notification: any) => {
      // Solo mostrar notificaciones push para tickets del sistema cuando la ventana no esté activa
      if (notification.type?.includes('system_ticket') || 
          notification.type === 'new_system_ticket') {
        const content = formatNotificationContent(notification);
        notificationService.showNotification(content.title, {
          body: content.body,
          tag: `ticket-${notification.ticketId || notification.id}`,
          data: content.data,
          requireInteraction: notification.type === 'system_ticket_message',
          silent: false
        });
      }
    });

    previousNotificationsRef.current = notifications;
  }, [notifications, notificationService]);

  return { notifications, notificationService };
}
