/**
 * One pagination shape, used identically wherever a list endpoint exists
 * (see docs/ARCHITECTURE.md §6.2) — Audit Logs is the first consumer,
 * Notifications' and Decisions' list endpoints reuse this later.
 */
export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
