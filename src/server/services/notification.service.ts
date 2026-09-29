import { INotification, NotificationType } from '../types/verification.types.js';
import { isDatabaseConnected } from '../config/database.js';
import { NotificationModel } from '../models/Notification.js';
import { ApiError } from '../utils/apiError.js';

export class NotificationService {
  private inMemoryNotifications: INotification[] = [];

  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedVerificationId?: string;
  }): Promise<INotification> {
    const newNotif: INotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      read: false,
      relatedVerificationId: data.relatedVerificationId,
      createdAt: new Date(),
    };

    if (isDatabaseConnected()) {
      try {
        const doc = await NotificationModel.create({
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          read: false,
          relatedVerificationId: data.relatedVerificationId,
        });
        return {
          id: doc._id.toString(),
          userId: doc.userId.toString(),
          type: doc.type as NotificationType,
          title: doc.title,
          message: doc.message,
          read: doc.read,
          relatedVerificationId: doc.relatedVerificationId?.toString(),
          createdAt: doc.createdAt,
        };
      } catch (err) {
        console.warn('[NotificationService] DB create failed, using store:', err);
      }
    }

    this.inMemoryNotifications.unshift(newNotif);
    return newNotif;
  }

  async getUserNotifications(userId: string): Promise<INotification[]> {
    let list: INotification[] = [];
    if (isDatabaseConnected()) {
      try {
        const docs = await NotificationModel.find({
          $or: [{ userId }, { userId: userId.toString() }],
        })
          .sort({ createdAt: -1 })
          .limit(50);

        list = docs.map((doc) => ({
          id: doc._id.toString(),
          userId: doc.userId.toString(),
          type: doc.type as NotificationType,
          title: doc.title,
          message: doc.message,
          read: doc.read,
          relatedVerificationId: doc.relatedVerificationId?.toString(),
          createdAt: doc.createdAt,
        }));
      } catch (err) {
        console.warn('[NotificationService] DB find error:', err);
      }
    }

    if (list.length === 0) {
      list = this.inMemoryNotifications
        .filter((n) => n.userId === userId || n.userId === userId.toString())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }

  async markAsRead(id: string, userId: string): Promise<boolean> {
    if (isDatabaseConnected()) {
      try {
        const doc = await NotificationModel.findOne({
          _id: id,
          $or: [{ userId }, { userId: userId.toString() }],
        });
        if (!doc) {
          throw ApiError.notFound('Notification not found or permission denied.');
        }
        doc.read = true;
        await doc.save();
        return true;
      } catch (err: any) {
        if (err instanceof ApiError) throw err;
      }
    }

    const notif = this.inMemoryNotifications.find(
      (n) => n.id === id && (n.userId === userId || n.userId === userId.toString())
    );
    if (!notif) {
      throw ApiError.notFound('Notification not found or permission denied.');
    }
    notif.read = true;
    return true;
  }

  async markAllAsRead(userId: string): Promise<number> {
    let count = 0;

    if (isDatabaseConnected()) {
      try {
        const result = await NotificationModel.updateMany(
          { $or: [{ userId }, { userId: userId.toString() }], read: false },
          { $set: { read: true } }
        );
        count = result.modifiedCount || 0;
      } catch (err) {
        console.warn('[NotificationService] Update many error:', err);
      }
    }

    for (const n of this.inMemoryNotifications) {
      if ((n.userId === userId || n.userId === userId.toString()) && !n.read) {
        n.read = true;
        count++;
      }
    }

    return count;
  }
}

export const notificationService = new NotificationService();
