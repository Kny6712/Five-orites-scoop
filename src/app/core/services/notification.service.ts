// src/app/core/services/notification.service.ts
// Five-orites Scoop — Push Notification Service (Capacitor + PWA fallback)
// Author: [Developer Placeholder]

import { Injectable, inject } from '@angular/core';
import { ToastController, Platform } from '@ionic/angular/standalone';
import { OrderStatus } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private toastCtrl = inject(ToastController);
  private platform = inject(Platform);

  async requestPermission(): Promise<boolean> {
    if (this.platform.is('capacitor')) {
      try {
        // Dynamic import to avoid SSR issues
        const { PushNotifications } = await import(
          '@capacitor/push-notifications'
        );
        const result = await PushNotifications.requestPermissions();
        if (result.receive === 'granted') {
          await PushNotifications.register();
          return true;
        }
        return false;
      } catch (err) {
        console.warn('Push notification registration error:', err);
        return false;
      }
    }
    // PWA: browser notification API
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  async showToast(
    message: string,
    color: 'success' | 'warning' | 'danger' | 'primary' = 'primary',
    duration = 3000
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color,
      position: 'top',
      buttons: [{ icon: 'close-outline', role: 'cancel' }],
    });
    await toast.present();
  }

  async notifyOrderStatusChange(
    orderId: string,
    newStatus: OrderStatus
  ): Promise<void> {
    const statusMessages: Record<OrderStatus, string> = {
      pending: '🍦 Order received! We\'re reviewing it now.',
      confirmed: '✅ Your order has been confirmed!',
      preparing: '👨‍🍳 Our scoop artists are preparing your order!',
      out_for_delivery: '🛵 Your scoops are on the way!',
      delivered: '🎉 Order delivered! Enjoy your scoops!',
      cancelled: '❌ Your order has been cancelled.',
    };

    const message = statusMessages[newStatus];
    if (message) {
      await this.showToast(
        message,
        newStatus === 'cancelled' ? 'danger' : 'success'
      );
      this.showBrowserNotification('Five-orites Scoop', `${message} (#${orderId.slice(-6).toUpperCase()})`);
    }
  }

  private showBrowserNotification(title: string, body: string): void {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      // eslint-disable-next-line no-new
      new Notification(title, { body });
    } catch {
      // Notifications unsupported/blocked — toast already shown.
    }
  }
}
