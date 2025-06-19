import { supabase } from '@/lib/supabase';

export interface CreateNotificationData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'complaint' | 'service' | 'distribution';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipient_id?: string;
  recipient_role?: string;
  action_url?: string;
  metadata?: any;
  expires_at?: string;
}

export class NotificationService {
  // Create a new notification
  static async createNotification(data: CreateNotificationData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          ...data,
          is_read: false,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error creating notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createNotification:', error);
      return false;
    }
  }

  // Create notification for complaint events
  static async notifyComplaintCreated(complaintId: string, customerName: string, priority: string, area?: string): Promise<void> {
    const priorityLevel = priority === 'critical' ? 'urgent' : priority === 'high' ? 'high' : 'medium';
    
    await this.createNotification({
      title: `New ${priority} Priority Complaint`,
      message: `Complaint from ${customerName} has been submitted${area ? ` in ${area}` : ''}`,
      type: 'complaint',
      priority: priorityLevel,
      recipient_role: 'service_manager',
      action_url: '/complaints',
      metadata: { complaint_id: complaintId, customer: customerName, area }
    });

    // Also notify admin for urgent complaints
    if (priorityLevel === 'urgent') {
      await this.createNotification({
        title: 'URGENT: High Priority Complaint',
        message: `Critical complaint from ${customerName} requires immediate attention`,
        type: 'error',
        priority: 'urgent',
        recipient_role: 'admin',
        action_url: '/complaints',
        metadata: { complaint_id: complaintId, customer: customerName }
      });
    }
  }

  // Create notification for service events
  static async notifyServiceAssigned(serviceId: string, technicianName: string, customerName: string): Promise<void> {
    await this.createNotification({
      title: 'Service Request Assigned',
      message: `Service request assigned to ${technicianName} for customer ${customerName}`,
      type: 'service',
      priority: 'medium',
      recipient_role: 'service_manager',
      action_url: '/services',
      metadata: { service_id: serviceId, technician: technicianName, customer: customerName }
    });
  }

  static async notifyServiceCompleted(serviceId: string, technicianName: string, customerName: string): Promise<void> {
    await this.createNotification({
      title: 'Service Request Completed',
      message: `${technicianName} has completed service for ${customerName}`,
      type: 'success',
      priority: 'medium',
      recipient_role: 'service_manager',
      action_url: '/services',
      metadata: { service_id: serviceId, technician: technicianName, customer: customerName }
    });
  }

  // Create notification for distribution events
  static async notifyDistributionStarted(routeName: string, driverName: string, plannedLiters: number): Promise<void> {
    await this.createNotification({
      title: 'Water Distribution Started',
      message: `${driverName} has started water distribution for ${routeName} route (${plannedLiters}L planned)`,
      type: 'distribution',
      priority: 'medium',
      recipient_role: 'driver_manager',
      action_url: '/distribution',
      metadata: { route: routeName, driver: driverName, planned_liters: plannedLiters }
    });
  }

  static async notifyDistributionCompleted(routeName: string, driverName: string, actualLiters: number): Promise<void> {
    await this.createNotification({
      title: 'Water Distribution Completed',
      message: `${driverName} has completed water distribution for ${routeName} route (${actualLiters}L delivered)`,
      type: 'success',
      priority: 'medium',
      recipient_role: 'driver_manager',
      action_url: '/distribution',
      metadata: { route: routeName, driver: driverName, actual_liters: actualLiters }
    });
  }

  // Create system notifications
  static async notifySystemAlert(title: string, message: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'): Promise<void> {
    await this.createNotification({
      title,
      message,
      type: 'warning',
      priority,
      recipient_role: 'admin',
      metadata: { system_alert: true }
    });
  }

  static async notifyMaintenanceScheduled(startTime: string, duration: string): Promise<void> {
    const message = `Scheduled system maintenance will begin at ${startTime} for approximately ${duration}`;
    
    // Notify all roles about maintenance
    const roles = ['admin', 'dept_head', 'service_manager', 'accounts_manager', 'product_manager', 'driver_manager'];
    
    for (const role of roles) {
      await this.createNotification({
        title: 'System Maintenance Scheduled',
        message,
        type: 'warning',
        priority: 'high',
        recipient_role: role,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Expire in 24 hours
        metadata: { maintenance_start: startTime, duration, type: 'scheduled' }
      });
    }
  }

  // Create user-specific notifications
  static async notifyUser(userId: string, title: string, message: string, type: CreateNotificationData['type'] = 'info', priority: CreateNotificationData['priority'] = 'medium'): Promise<void> {
    await this.createNotification({
      title,
      message,
      type,
      priority,
      recipient_id: userId,
      metadata: { user_specific: true }
    });
  }

  // Create role-based notifications
  static async notifyRole(role: string, title: string, message: string, type: CreateNotificationData['type'] = 'info', priority: CreateNotificationData['priority'] = 'medium'): Promise<void> {
    await this.createNotification({
      title,
      message,
      type,
      priority,
      recipient_role: role,
      metadata: { role_based: true }
    });
  }

  // Notify about payment overdue
  static async notifyPaymentOverdue(customerName: string, amount: number, invoiceNumber: string): Promise<void> {
    await this.createNotification({
      title: 'Payment Overdue Alert',
      message: `Payment of ₹${amount} from ${customerName} for invoice ${invoiceNumber} is overdue`,
      type: 'warning',
      priority: 'high',
      recipient_role: 'accounts_manager',
      action_url: '/accounts',
      metadata: { customer: customerName, amount, invoice: invoiceNumber, type: 'overdue_payment' }
    });
  }

  // Notify about low inventory
  static async notifyLowInventory(productName: string, currentStock: number, minStock: number): Promise<void> {
    await this.createNotification({
      title: 'Low Inventory Alert',
      message: `${productName} stock is running low (${currentStock} remaining, minimum: ${minStock})`,
      type: 'warning',
      priority: 'high',
      recipient_role: 'product_manager',
      action_url: '/products',
      metadata: { product: productName, current_stock: currentStock, min_stock: minStock, type: 'low_inventory' }
    });
  }

  // Notify about new user registration
  static async notifyNewUserRegistration(userName: string, userEmail: string, role: string): Promise<void> {
    await this.createNotification({
      title: 'New User Registration',
      message: `New ${role} user ${userName} (${userEmail}) has registered`,
      type: 'info',
      priority: 'medium',
      recipient_role: 'admin',
      action_url: '/admin/users',
      metadata: { user_name: userName, user_email: userEmail, user_role: role, type: 'new_registration' }
    });
  }

  // Mark notifications as read
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      return !error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      return !error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // Clean up expired notifications
  static async cleanupExpiredNotifications(): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString());
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    }
  }
} 