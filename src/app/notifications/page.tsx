'use client';

export const dynamic = 'force-dynamic';

import { DashboardLayout } from '@/components/ui/DashboardLayout';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export default function NotificationsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-600 mt-2">Stay updated with your latest notifications</p>
                </div>

                <NotificationCenter />
            </div>
        </DashboardLayout>
    );
}
