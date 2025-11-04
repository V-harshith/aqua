'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';
import { authenticatedPatch } from '@/lib/auth-client';
import { LoadingSpinner } from './LoadingStates';

export function NotificationDropdown() {
  const { notifications, unreadCount, isLoading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      setIsMarkingRead(true);
      await authenticatedPatch('/api/notifications', { 
        notification_ids: [notificationId] 
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setIsMarkingRead(false);
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <Link
              href="/notifications"
              className="text-sm text-blue-600 hover:underline"
              onClick={() => setIsOpen(false)}
            >
              View All
            </Link>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <LoadingSpinner size="sm" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="text-2xl mb-2">🔔</div>
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-xs line-clamp-2 mb-1">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                          
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              disabled={isMarkingRead}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 text-center">
              <Link
                href="/notifications"
                className="text-sm text-blue-600 hover:underline font-medium"
                onClick={() => setIsOpen(false)}
              >
                View All Notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}