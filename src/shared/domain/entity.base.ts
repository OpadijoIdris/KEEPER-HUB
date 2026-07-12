/**
 * Base for every domain entity. Identity-based equality, not structural —
 * two entities are the same entity if their IDs match, regardless of
 * whatever else differs between them.
 */
export abstract class Entity<TId> {
  protected constructor(readonly id: TId) {}

  equals(other?: Entity<TId>): boolean {
    if (!other) return false;
    if (this === other) return true;
    return this.id === other.id;
  }
}
