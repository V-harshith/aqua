import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { authenticatedGet } from '@/lib/auth-client';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { userProfile } = useAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!userProfile) return;

    try {
      setIsLoading(true);

      // Check if session exists before making request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session available, skipping notifications load');
        return;
      }

      const data = await authenticatedGet('/api/notifications?limit=10');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Don't throw, just log - notifications are not critical
    } finally {
      setIsLoading(false);
    }
  }, [userProfile]);

  // Load notifications on mount and when user changes
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!userProfile) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userProfile.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userProfile.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );

          // Update unread count
          if (updatedNotification.is_read && !payload.old?.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          } else if (!updatedNotification.is_read && payload.old?.is_read) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile]);

  return {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications: loadNotifications,
  };
}