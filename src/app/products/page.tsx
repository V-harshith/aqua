import React from 'react';
import { ProductManagementDashboard } from '../../components/products/ProductManagementDashboard';
import { RoleGuard } from '../../components/auth/RoleGuard';

export default function ProductsPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'product_manager']}>
      <ProductManagementDashboard />
    </RoleGuard>
  );
} 