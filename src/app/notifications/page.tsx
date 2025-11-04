'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { authenticatedGet, authenticatedPatch, authenticatedDelete } from '@/lib/auth-client';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/ui/LoadingStates';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'service_assignment' | 'service_update' | 'complaint_update';
  related_id?: string;
  action_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export default function NotificationsPage() {
  const { userProfile } = useAuthContext();
  const { success: showSuccess, error: showError } = useToast();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const params = filter === 'unread' ? '?unread_only=true' : '';
      const data = await authenticatedGet(`/api/notifications${params}`);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      showError({ title: 'Failed to load notifications' });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      setIsUpdating(true);
      await authenticatedPatch('/api/notifications', { notification_ids: notificationIds });
      await loadNotifications();
      showSuccess({ title: 'Notifications marked as read' });
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      showError({ title: 'Failed to update notifications' });
    } finally {
      setIsUpdating(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setIsUpdating(true);
      await authenticatedPatch('/api/notifications', { mark_all_read: true });
      await loadNotifications();
      showSuccess({ title: 'All notifications marked as read' });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      showError({ title: 'Failed to update notifications' });
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await authenticatedDelete(`/api/notifications?id=${notificationId}`);
      await loadNotifications();
      showSuccess({ title: 'Notification deleted' });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      showError({ title: 'Failed to delete notification' });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'service_assignment': return '🔧';
      case 'service_update': return '🔄';
      case 'complaint_update': return '📝';
      default: return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500 bg-green-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'error': return 'border-l-red-500 bg-red-50';
      case 'service_assignment': return 'border-l-blue-500 bg-blue-50';
      case 'service_update': return 'border-l-purple-500 bg-purple-50';
      case 'complaint_update': return 'border-l-orange-500 bg-orange-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    return true;
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-gray-600 mt-1">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              disabled={isUpdating}
              variant="outline"
              size="sm"
            >
              {isUpdating ? <LoadingSpinner size="sm" /> : 'Mark All Read'}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <EmptyState
            icon="🔔"
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            description={
              filter === 'unread'
                ? 'All caught up! You have no unread notifications.'
                : 'You have no notifications yet. They will appear here when you receive them.'
            }
          />
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border-l-4 ${getNotificationColor(notification.type)} ${
                !notification.is_read ? 'ring-2 ring-blue-100' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                        {notification.is_read && notification.read_at && (
                          <span>
                            Read {new Date(notification.read_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                      
                      {notification.action_url && (
                        <div className="mt-2">
                          <Link
                            href={notification.action_url}
                            className="text-blue-600 hover:underline text-sm font-medium"
                          >
                            View Details →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {!notification.is_read && (
                      <Button
                        onClick={() => markAsRead([notification.id])}
                        disabled={isUpdating}
                        variant="outline"
                        size="sm"
                      >
                        Mark Read
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => deleteNotification(notification.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}