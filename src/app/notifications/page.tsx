'use client';
import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
export default function NotificationsPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'dept_head', 'service_manager', 'accounts_manager', 'product_manager', 'driver_manager', 'technician', 'customer']}>
      <NotificationCenter />
    </RoleGuard>
  );
} 