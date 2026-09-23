import { Injectable } from '@angular/core';

/**
 * HRM's own storage contract - every HRM screen reads/writes session data (b_id,
 * employeeId, is_superuser, permissions, accessToken, etc.) through this token instead
 * of importing a host's concrete storage class directly.
 *
 * Zero-config default: a plain `localStorage`-backed implementation, so a host with
 * nothing special in place just works - HRM reads/writes the same `localStorage` the
 * rest of a simple host app would use.
 *
 * A host that already has its own encrypted/IndexedDB storage service (matching this
 * same async getItem/setItem/getItemSync/removeItem/clear shape) can make HRM share
 * that exact store instead, with one line in the host's own app.config.ts:
 *
 *   import { HrmStorage } from 'src/app/modules/hrm-shared/core/shared/services/hrm-storage';
 *   import { EncryptedStorageService } from './core/shared/services/secure-cookie-service';
 *   providers: [
 *     ...,
 *     { provide: HrmStorage, useExisting: EncryptedStorageService },
 *   ]
 *
 * This way HRM automatically follows whatever the host already does for session
 * storage - plain localStorage if that's all the host has, or the host's real
 * encrypted store if it has one - without HRM ever needing to know which.
 */
@Injectable({ providedIn: 'root' })
export class HrmStorage {
  // In-memory cache of values already resolved via getItem/setItem this session -
  // lets synchronous callers (e.g. dialog form-config builders, which run as plain
  // functions and are never awaited by their callers) read an already-known value
  // without needing to await the async round trip themselves.
  private cache = new Map<string, any>();

  async getItem<T>(key: string): Promise<T | null> {
    const raw = localStorage.getItem(key);
    const value = raw === null ? null : this.tryParse<T>(raw);
    this.cache.set(key, value);
    return value;
  }

  async setItem(key: string, value: any): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
    this.cache.set(key, value);
  }

  /**
   * Synchronous read of whatever getItem/setItem last resolved for this key in
   * this session - returns null if it hasn't been loaded yet (never awaited, or
   * this is the very first read). Only use where a stale/momentarily-null value
   * is acceptable, e.g. display-only fields in a synchronous form-config builder.
   */
  getItemSync<T>(key: string): T | null {
    return this.cache.has(key) ? this.cache.get(key) : null;
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    localStorage.clear();
    this.cache.clear();
  }

  private tryParse<T>(raw: string): T {
    try {
      return JSON.parse(raw);
    } catch {
      // Value wasn't written as JSON (e.g. a host wrote a plain string directly
      // into localStorage outside this class) - hand it back as-is.
      return raw as unknown as T;
    }
  }
}
