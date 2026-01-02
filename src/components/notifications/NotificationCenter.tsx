'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'complaint' | 'service' | 'distribution';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipient_id?: string;
  recipient_role?: string;
  is_read: boolean;
  action_url?: string;
  metadata?: any;
  created_at: string;
  expires_at?: string;
}
interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}
export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    byType: {},
    byPriority: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high_priority'>('all');
  const [isSubscribed, setIsSubscribed] = useState(false);
  useEffect(() => {
    if (user) {
      loadNotifications();
      setupRealtimeSubscription();
    }
    return () => {
      if (isSubscribed) {
        supabase.removeAllChannels();
      }
    };
  }, [user]);
  const loadNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`recipient_id.eq.${user.id},recipient_role.eq.${user.role}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error && error.code === '42P01') {
        // No notifications table found
        setNotifications([]);
        setStats({ total: 0, unread: 0, byType: {}, byPriority: {} });
        return;
      }
      setNotifications(data || []);
      setStats(calculateStats(data || []));
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setStats({ total: 0, unread: 0, byType: {}, byPriority: {} });
    } finally {
      setIsLoading(false);
    }
  };
  const setupRealtimeSubscription = useCallback(() => {
    if (!user || isSubscribed) return;
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setStats(prev => ({
            ...prev,
            total: prev.total + 1,
            unread: prev.unread + (newNotification.is_read ? 0 : 1)
          }));
          // Show browser notification if supported
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/pwa-64x64.png'
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
        }
      )
      .subscribe();
    setIsSubscribed(true);
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [user, isSubscribed]);
  const calculateStats = (notifications: Notification[]): NotificationStats => {
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.is_read).length,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>
    };
    notifications.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
    });
    return stats;
  };
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) {
        console.error('Error marking notification as read:', error);
        // Update local state even if DB update fails
      }
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);
      if (error) {
        console.error('Error marking all notifications as read:', error);
      }
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setStats(prev => ({ ...prev, unread: 0 }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      if (error) {
        console.error('Error deleting notification:', error);
      }
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setStats(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return {
          ...prev,
          total: prev.total - 1,
          unread: prev.unread - (notification?.is_read ? 0 : 1)
        };
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };
  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.is_read);
      case 'high_priority':
        return notifications.filter(n => ['high', 'urgent'].includes(n.priority));
      default:
        return notifications;
    }
  };
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'complaint': return '🔧';
      case 'service': return '⚙️';
      case 'distribution': return '🚚';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };
  const filteredNotifications = getFilteredNotifications();
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
        <p className="text-gray-600 mt-1">Stay updated with real-time system notifications</p>
      </div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="text-2xl">📊</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
              </div>
              <div className="text-2xl">🔔</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-orange-600">
                  {(stats.byPriority.high || 0) + (stats.byPriority.urgent || 0)}
                </p>
              </div>
              <div className="text-2xl">⚠️</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold text-blue-600">
                  {notifications.filter(n =>
                    new Date(n.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <div className="text-2xl">📅</div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex gap-2">
          {(['all', 'unread', 'high_priority'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === filterType
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {filterType.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button onClick={markAllAsRead} variant="secondary" size="sm">
            Mark All Read
          </Button>
          <Button onClick={loadNotifications} variant="secondary" size="sm">
            Refresh
          </Button>
        </div>
      </div>
      {/* Notifications List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading notifications...</p>
            </CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">🔔</div>
              <p className="text-gray-500 text-lg">No notifications found</p>
              <p className="text-sm text-gray-400 mt-2">
                {filter === 'unread' ? 'All caught up!' : 'Check back later for updates'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`hover:shadow-md transition-all cursor-pointer border-l-4 ${notification.is_read ? 'bg-gray-50' : 'bg-white'
                } ${getPriorityColor(notification.priority)}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className={`text-sm mb-2 ${notification.is_read ? 'text-gray-500' : 'text-gray-700'}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{getTimeAgo(notification.created_at)}</span>
                        <span className={`px-2 py-1 rounded-full font-medium ${getPriorityColor(notification.priority)}`}>
                          {(notification.priority || 'medium').toUpperCase()}
                        </span>
                        <span className="capitalize">{notification.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        Mark Read
                      </button>
                    )}
                    {notification.action_url && (
                      <button
                        onClick={() => window.location.href = notification.action_url!}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                      >
                        View
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {/* Real-time Status */}
      <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-800">Real-time notifications active</span>
          </div>
          <span className="text-xs text-green-600">
            {isSubscribed ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      </div>
    </div>
  );
}; 