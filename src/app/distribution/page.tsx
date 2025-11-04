'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { WaterDistributionDashboard } from '@/components/distribution/WaterDistributionDashboard';
export default function DistributionPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'dept_head', 'driver_manager']}>
      <WaterDistributionDashboard />
    </RoleGuard>
  );
} 