import { apiRequest } from './client';

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const activityApi = {
  getNotifications: async (page = 1, limit = 20): Promise<NotificationItem[]> => {
    return apiRequest<NotificationItem[]>('/api/v1/activity/notifications', {
      params: { page, limit },
    });
  },

  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    return apiRequest<{ unreadCount: number }>('/api/v1/activity/notifications/unread-count');
  },

  markAsRead: async (id: string): Promise<void> => {
    return apiRequest<void>(`/api/v1/activity/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllAsRead: async (): Promise<void> => {
    return apiRequest<void>('/api/v1/activity/notifications/read-all', {
      method: 'POST',
    });
  },
};
