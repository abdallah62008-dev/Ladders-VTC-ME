// Permission cache STUB per D-CACHE-001 (locked 2026-05-09).
//
// Sprint 1 scaffolds the architecture only. Sprint 2+ wires Redis + 7 invalidation
// triggers per /docs/03-rbac/03-scopes.md §H.0.
//
// Hard rules (locked):
//   1. Cache MUST NOT replace database RLS — RLS is the final enforcement layer.
//   2. Cache TTL ≤ session length.
//   3. Invalidate on: role change / permission change / user_country_access change /
//      country_scope.all grant/revoke / user deactivation / session logout / time-limited
//      grant expiry.
//   4. Cache MUST NEVER cache secrets.
//   5. Cache MUST NOT expose cost fields without cost.read / cost.export.
//   6. Sensitive actions bypass cache (cost reads, override approvals, restore.production,
//      country_scope.all grants, sensitive_cleanup_override).
//   7. Denied access attempts STILL audit-logged regardless of cache state.
//
// Cache key: permcache:user:{user_id}:session:{session_id}

import type { CountryCode } from '../i18n/config';

export interface CachedPermissions {
  readonly role: string;
  readonly permission_slugs: readonly string[];
  readonly country_scope: readonly CountryCode[];
  readonly has_country_scope_all: boolean;
  readonly cached_at: string;
  readonly ttl_seconds: number;
}

export interface PermissionCache {
  get(user_id: string, session_id: string): Promise<CachedPermissions | null>;
  set(user_id: string, session_id: string, perms: CachedPermissions): Promise<void>;
  invalidateUser(user_id: string): Promise<void>;
  invalidateSession(user_id: string, session_id: string): Promise<void>;
  invalidateRole(role: string): Promise<void>; // for role-wide changes
}

/**
 * Sprint 1 stub — no-op implementation. Sprint 2+ replaces with Redis-backed cache.
 *
 * Until then, permission checks fall through to DB queries (slow but correct).
 * RLS at the DB layer remains authoritative regardless of cache state.
 */
export class StubPermissionCache implements PermissionCache {
  async get(_user_id: string, _session_id: string): Promise<null> {
    return null; // always cache miss → fall through to DB
  }
  async set(_u: string, _s: string, _p: CachedPermissions): Promise<void> {
    // no-op
  }
  async invalidateUser(_u: string): Promise<void> {
    // no-op
  }
  async invalidateSession(_u: string, _s: string): Promise<void> {
    // no-op
  }
  async invalidateRole(_r: string): Promise<void> {
    // no-op
  }
}

export const permissionCache: PermissionCache = new StubPermissionCache();
