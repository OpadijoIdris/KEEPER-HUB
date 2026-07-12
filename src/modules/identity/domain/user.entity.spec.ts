import { User } from './user.entity';
import { Email } from './value-objects/email.vo';
import { PasswordHash } from './value-objects/password-hash.vo';
import { UserRegisteredEvent } from './events/user-registered.event';

describe('User', () => {
  it('registering a new user raises a UserRegisteredEvent', () => {
    const email = Email.create('carol@example.com');
    const hash = PasswordHash.fromHash('$2b$12$fakehash');

    const user = User.register(email, hash);
    const events = user.pullDomainEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(UserRegisteredEvent);
    expect(events[0].payload).toMatchObject({ userId: user.id, email: 'carol@example.com' });
  });

  it('pulling domain events clears the buffer', () => {
    const user = User.register(
      Email.create('dave@example.com'),
      PasswordHash.fromHash('$2b$12$fakehash'),
    );

    user.pullDomainEvents();
    expect(user.pullDomainEvents()).toHaveLength(0);
  });

  it('reconstructing from persistence raises no events', () => {
    const user = User.fromPersistence(
      'existing-id',
      Email.create('erin@example.com'),
      PasswordHash.fromHash('$2b$12$fakehash'),
      'user',
      new Date(),
    );

    expect(user.pullDomainEvents()).toHaveLength(0);
  });
});
