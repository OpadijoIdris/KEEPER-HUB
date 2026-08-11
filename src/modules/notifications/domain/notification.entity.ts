import { randomUUID } from 'crypto';
import { Entity } from '../../../shared/domain/entity.base';

// Scoped deliberately narrow: only an agent's execution actually completing
// raises a notification right now, not every decision or failure — expand
// this union (and the subscriber in infrastructure/events) if that changes.
export type NotificationType = 'keeperhub.execution.completed';

/**
 * The bell's feed item — a reaction to another module's domain event, not
 * an event source itself (no further subscribers need to react to "a
 * notification was created"), so this is a plain Entity, not an
 * AggregateRoot. Always created regardless of the user's channel
 * preferences — those preferences (see Settings' NotificationPreference)
 * gate *delivery* (email), not whether the in-app record exists at all.
 */
export class Notification extends Entity<string> {
  private constructor(
    id: string,
    readonly userId: string,
    readonly type: NotificationType,
    readonly title: string,
    readonly message: string,
    private _read: boolean,
    readonly createdAt: Date,
  ) {
    super(id);
  }

  get read(): boolean {
    return this._read;
  }

  static create(userId: string, type: NotificationType, title: string, message: string): Notification {
    return new Notification(randomUUID(), userId, type, title, message, false, new Date());
  }

  static fromPersistence(
    id: string,
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    read: boolean,
    createdAt: Date,
  ): Notification {
    return new Notification(id, userId, type, title, message, read, createdAt);
  }

  markRead(): void {
    this._read = true;
  }
}
