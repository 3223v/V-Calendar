import { Notification } from 'electron';
import type { NotificationOptions } from '../types';

class NotificationService {
  private isSupported: boolean;

  constructor() {
    this.isSupported = Notification.isSupported();
  }

  show(options: NotificationOptions): void {
    if (!this.isSupported) {
      console.warn('System notifications are not supported');
      return;
    }

    const notification = new Notification({
      title: options.title,
      body: options.body,
      silent: options.sound === undefined
    });

    notification.show();
  }

  showAlarm(eventTitle: string, eventTime: string): void {
    this.show({
      title: '📅 日程提醒',
      body: `${eventTitle} - ${eventTime}`,
      sound: 'default'
    });
  }
}

export const notificationService = new NotificationService();
