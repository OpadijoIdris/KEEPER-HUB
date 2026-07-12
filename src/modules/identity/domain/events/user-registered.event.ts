import { DomainEvent } from '../../../../shared/domain/domain-event.base';

interface UserRegisteredPayload {
  userId: string;
  email: string;
  [key: string]: unknown;
}

export class UserRegisteredEvent extends DomainEvent<UserRegisteredPayload> {
  readonly eventType = 'identity.user.registered';
  readonly schemaVersion = 1;
}
