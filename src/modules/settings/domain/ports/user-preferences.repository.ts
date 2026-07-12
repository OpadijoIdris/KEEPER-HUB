import { UserPreferences } from '../user-preferences.entity';

export const USER_PREFERENCES_REPOSITORY = Symbol('USER_PREFERENCES_REPOSITORY');

export interface UserPreferencesRepository {
  findByUserId(userId: string): Promise<UserPreferences | null>;
  save(preferences: UserPreferences): Promise<void>;
}
